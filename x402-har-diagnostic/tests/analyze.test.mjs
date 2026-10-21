import test from "node:test";
import assert from "node:assert/strict";
import { analyzeHar, sampleHar } from "../analyze.mjs";
const h=(name,value)=>({name,value});
const ent=(status, method="GET", req=[], res=[])=>({request:{method,url:"https://topsecret.example/SECRET_URL",headers:req},response:{status,headers:res}});
const doc=(...entries)=>({log:{entries}});
const codes = report=>report.findings.map(x=>x.code);
const challenge = btoa(JSON.stringify({x402Version:2,accepts:[{scheme:"exact",network:"eip155:8453",amount:"1000"}]}));
test("fictional sample is diagnosed and is not counted as settlement",()=>{
 const r=analyzeHar(sampleHar()); assert.equal(r.counts.challenges402,2);
 assert.equal(r.counts.preflightsObserved,1); assert.equal(r.counts.paymentHeaderRequests,1);
 assert.ok(codes(r).includes("PREFLIGHT_DENIES_PAYMENT_HEADER"));
 assert.ok(codes(r).includes("CORS_CHALLENGE_HEADER_HIDDEN"));
 assert.ok(codes(r).includes("RETRY_REJECTED"));
 assert.equal(r.settlementVerified,false);
});
test("a clean parsed v2 quote receives no missing-accepts warning",()=>{
 const r=analyzeHar(doc(ent(402,"GET",[],[h("PAYMENT-REQUIRED",challenge)])));
 assert.ok(codes(r).includes("CHALLENGE_V2"));
 assert.ok(!codes(r).includes("CHALLENGE_MISSING_ACCEPTS"));
});
test("v2 no accepts flagged without secrets",()=>{
 const raw=btoa(JSON.stringify({x402Version:2,accepts:[],payTo:"PRIVATE123"}));
 const r=analyzeHar(doc(ent(402,"GET",[],[h("PAYMENT-REQUIRED",raw)])));
 assert.ok(codes(r).includes("CHALLENGE_MISSING_ACCEPTS"));
 assert.ok(!JSON.stringify(r).includes("PRIVATE123"));
});
test("legacy v1 JSON quote classification",()=>{
 const r=analyzeHar(doc(ent(402,"GET",[],[h("X-PAYMENT-REQUIRED",JSON.stringify({x402Version:1,accepts:[{}]}) )])));
 assert.ok(codes(r).includes("CHALLENGE_V1"));
});
test("unsigned 400 and 422 are prepay validation, not a paid rejection",()=>{
 const r=analyzeHar(doc(ent(400),ent(422)));
 assert.equal(r.counts.unsigned400or422,2);
 assert.ok(codes(r).includes("PREPAY_400_422")); assert.ok(!codes(r).includes("RETRY_REJECTED"));
});
test("signed 2xx is not settlement proof",()=>{
 const r=analyzeHar(doc(ent(200,"POST",[h("PAYMENT-SIGNATURE","SECRET-PAYLOAD-XYZ")],[h("Access-Control-Allow-Origin","*")])));
 assert.equal(r.counts.http2xxAfterHeader,1); assert.ok(codes(r).includes("NO_SETTLEMENT_VERIFICATION"));
 assert.equal(r.buyerPaymentsCreated,0); assert.ok(!JSON.stringify(r).includes("SECRET-PAYLOAD-XYZ"));
});
test("request path, cookies, auth and signatures never occur in findings",()=>{
 const r=analyzeHar(doc(ent(402,"GET",[
   h("Origin","https://PRIVATE_ORIGIN.example"), h("cookie","PRIVATE_COOKIE"),
   h("authorization","Bearer PRIVATE_AUTH"),h("PAYMENT-SIGNATURE","SECRET_PAYLOAD")
 ],[h("PAYMENT-REQUIRED",challenge)])));
 const s=JSON.stringify(r);
 for(const token of ["PRIVATE_ORIGIN","PRIVATE_COOKIE","PRIVATE_AUTH","SECRET_PAYLOAD","SECRET_URL","topsecret.example"]) assert.ok(!s.includes(token),token);
});
test("preflight declared payment header denial is a high severity finding",()=>{
 const r=analyzeHar(doc(ent(204,"OPTIONS",[
 h("Origin","https://test.invalid"), h("Access-Control-Request-Headers","Content-Type, PAYMENT-SIGNATURE"),
 h("Access-Control-Request-Method","POST")],[h("Access-Control-Allow-Headers","content-type"),
 h("Access-Control-Allow-Methods","GET"),h("Access-Control-Allow-Origin","https://test.invalid")])));
 assert.ok(codes(r).includes("PREFLIGHT_DENIES_PAYMENT_HEADER"));
 assert.ok(codes(r).includes("PREFLIGHT_DENIES_METHOD"));
});
test("preflight 403 and ACAO mismatch identified",()=>{
 const r=analyzeHar(doc(ent(403,"OPTIONS",[
 h("Origin","https://buyer.example"),h("Access-Control-Request-Headers","payment-signature")
 ],[h("Access-Control-Allow-Origin","https://other.example")])));
 assert.ok(codes(r).includes("PREFLIGHT_FAILED"));
 assert.ok(codes(r).includes("CORS_RESPONSE_ORIGIN_MISMATCH"));
});
test("missing and malformed public quote headers are distinguished",()=>{
 const missing=analyzeHar(doc(ent(402))), bad=analyzeHar(doc(ent(402,"GET",[],[h("PAYMENT-REQUIRED","INVALID!!")])));
 assert.ok(codes(missing).includes("CHALLENGE_MISSING_HEADER"));
 assert.ok(codes(bad).includes("CHALLENGE_UNREADABLE"));
});
test("irrelevant HAR shows no captured x402 payment flow",()=>{
 const r=analyzeHar(doc(ent(200)));
 assert.ok(codes(r).includes("HAR_NOT_CAPTURED"));
});
test("malformed or overlong input fails safely",()=>{
 assert.throws(()=>analyzeHar("{unclosed"),/HAR JSON/);
 assert.throws(()=>analyzeHar({other:1}),/standard HAR/);
 assert.throws(()=>analyzeHar("x".repeat(2_000_001)),/2 MB/);
 assert.throws(()=>analyzeHar(doc(...Array(401).fill(ent(200)))),/400 entries/);
});
test("malformed nonobject entries tolerated safely",()=>{
 const r=analyzeHar(doc(null,{},ent(200)));
 assert.equal(r.counts.inspected,3);
});
