import test from "node:test";
import assert from "node:assert/strict";
import {diagnose} from "../checker.mjs";
const O="https://buyer.example";
const pfGood={status:204,headers:{
 "access-control-allow-origin":O,
 "access-control-allow-methods":"GET, POST, OPTIONS",
 "access-control-allow-headers":"payment-signature, content-type, x-payment"
}};
const chGood={status:402,headers:{
 "access-control-allow-origin":O,
 "access-control-expose-headers":"payment-required, payment-response, x-payment-response",
 "payment-required":"eyJzZW5zaXRpdmUiOiB0cnVlfQ==",
 "cache-control":"no-store", "vary":"Origin"
}};
const check=(p=pfGood,c=chGood,method="GET",more={})=>
  diagnose({origin:O,method,preflight:p,challenge:c,...more});
test("known-good browser headers pass with no leaks",()=>{
  const r=check();
  assert.equal(r.blockers,0);
  assert.equal(r.warnings,0);
  assert.equal(r.overall,"PREFLIGHT_READY_UNVERIFIED_PAID");
  assert.ok(!JSON.stringify(r).includes("eyJzZW5zaXRpdmUi"));
});
test("OPTIONS 402 is a blocker",()=>assert.ok(check({...pfGood,status:402}).checks.some(x=>x.code==="PREFLIGHT_2XX"&&x.status==="BLOCKER")));
test("missing exposed challenge is a blocker",()=>assert.ok(check(pfGood,{...chGood,headers:{...chGood.headers,"access-control-expose-headers":"payment-response"}}).checks.some(x=>x.code==="CHALLENGE_EXPOSE_PRICE"&&x.status==="BLOCKER")));
test("missing payment-signature is a blocker",()=>assert.ok(check({...pfGood,headers:{...pfGood.headers,"access-control-allow-headers":"content-type"}}).checks.some(x=>x.code==="PREFLIGHT_PAYMENT_SIGNATURE"&&x.status==="BLOCKER")));
test("wrong Origin blocks both response types",()=>assert.equal(check({...pfGood,headers:{...pfGood.headers,"access-control-allow-origin":"https://other.example"}},{...chGood,headers:{...chGood.headers,"access-control-allow-origin":"https://other.example"}}).blockers,2));
test("POST requires content-type",()=>assert.ok(check({...pfGood,headers:{...pfGood.headers,"access-control-allow-headers":"payment-signature"}},chGood,"POST").checks.some(x=>x.code==="PREFLIGHT_CONTENT_TYPE"&&x.status==="BLOCKER")));
test("200 route warns, not a confirmed payment",()=>assert.ok(check(pfGood,{status:200,headers:{}}).checks.some(x=>x.code==="UNPAID_CHALLENGE_402"&&x.status==="WARNING")));
test("legacy requires X-PAYMENT explicit",()=>assert.equal(check(pfGood,chGood,"GET",{legacy:true}).blockers,0));
test("credentialed wildcard cannot authorize origin",()=>assert.ok(check({...pfGood,headers:{...pfGood.headers,"access-control-allow-origin":"*","access-control-allow-credentials":"true"}} ,chGood,"GET",{credentials:true}).blockers>0));
test("reflected Origin without Vary is a warning",()=>assert.ok(check(pfGood,{...chGood,headers:{...chGood.headers,vary:"Accept-Encoding"}}).warnings>0));
test("no shared cache directive adds warning",()=>assert.ok(check(pfGood,{...chGood,headers:{...chGood.headers,"cache-control":"public, max-age=3600"}}).warnings>0));
test("invalid method is rejected",()=>assert.throws(()=>check(pfGood,chGood,"DELETE"),/Only GET or POST/));
test("origin with paths rejected",()=>assert.throws(()=>diagnose({origin:"https://buyer.example/path",preflight:pfGood,challenge:chGood}),/Origin must/));
test("challenge missing payment-required is a blocker",()=>{
 const h={...chGood.headers};delete h["payment-required"];
 assert.ok(check(pfGood,{status:402,headers:h}).checks.some(x=>x.code==="CHALLENGE_PAYMENT_REQUIRED_PRESENT"&&x.status==="BLOCKER"));
});
