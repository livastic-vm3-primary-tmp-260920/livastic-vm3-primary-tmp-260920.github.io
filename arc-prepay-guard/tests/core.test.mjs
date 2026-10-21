// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import {
 CHAIN_ID,RPC_URL,IDENTITY,REPUTATION,SELECTORS,
 normalizeAgentId,encodeOwnerOf,encodeTokenURI,encodeGetClients,encodeGetSummary,
 decodeOwner,decodeClients,decodeSummary,decodeRegistration,decimalSigned,rpcRead,inspectArcAgent
} from "../rpc.mjs";
const w = x=>BigInt(x).toString(16).padStart(64,"0");
const addr="0xd305607510e0db2c95807173c7a05bea53c1ed36";
const client="0xee602a161232aac1436e812676b6626382fc84a9";
const abiOwner="0x"+w(BigInt(addr));
const abiClients=(xs=[])=>"0x"+w(32)+w(xs.length)+xs.map(x=>w(BigInt(x))).join("");
const abiText=s=>{
 const buf=Buffer.from(s,"utf8");const hex=buf.toString("hex");
 return "0x"+w(32)+w(buf.length)+hex.padEnd(Math.ceil(buf.length/32)*64,"0");
};
const summary=(count,value,decimals)=>{
 const y=BigInt(value);
 return "0x"+w(count)+w(y<0n?(1n<<256n)+y:y)+w(decimals);
};
test("only numeric decimal IDs accepted",()=>{
 assert.equal(normalizeAgentId("0"),0n);
 assert.equal(normalizeAgentId(" 42 "),42n);
 assert.equal(normalizeAgentId("999999999"),999999999n);
 for(const bad of ["-1","1.2","00042","0x2a","1e6","","10\n2","NaN","1000000000","<img src=x>"]){
   assert.throws(()=>normalizeAgentId(bad),/decimal Arc|size limit/,bad);
 }
});
test("canonical Arc registry addresses and selectors fixed",()=>{
 assert.equal(CHAIN_ID,5042n);
 assert.equal(RPC_URL,"https://rpc.mainnet.arc.io");
 assert.equal(IDENTITY,"0x8004A169FB4a3325136EB29fA0ceB6D2e539a432");
 assert.equal(REPUTATION,"0x8004BAa17C55a88189AE136b182e5fdA19dE9b63");
 assert.equal(encodeOwnerOf(0n),"0x6352211e"+w(0));
 assert.equal(encodeTokenURI(42n),"0xc87b56dd"+w(42));
 assert.equal(encodeGetClients(42n),"0x42dd519c"+w(42));
});
test("getSummary dynamic ABI head and offsets are canonical",()=>{
 const x=encodeGetSummary(4n,[client]);
 assert.equal(x.slice(0,10),"0x81bbba58");
 assert.equal(x.slice(10,74),w(4));
 assert.equal(x.slice(74,138),w(128));
 assert.equal(x.slice(138,202),w(192));
 assert.equal(x.slice(202,266),w(224));
 assert.equal(x.slice(266,330),w(1));
 assert.equal(x.slice(330,394),w(BigInt(client)));
 assert.equal(x.slice(-128),w(0)+w(0));
});
test("invalid and repeated client addresses rejected before query",()=>{
 assert.throws(()=>encodeGetSummary(4n,["wrong"]),/Malformed public client/);
 assert.throws(()=>encodeGetSummary(4n,[client,client]),/Repeated/);
 assert.throws(()=>encodeGetSummary(4n,Array(65).fill(client)),/Invalid clients/);
});
test("decode owner word strictly, avoid zero and malformed",()=>{
 assert.equal(decodeOwner(abiOwner),addr);
 assert.throws(()=>decodeOwner("0x"+w(0)),/zero owner/);
 assert.throws(()=>decodeOwner("0x"+w(1n<<200n)),/invalid address/);
 assert.throws(()=>decodeOwner("0xabcdef"),/truncated/);
});
test("read onchain clients with strict expected ABI",()=>{
 assert.deepEqual(decodeClients(abiClients([client])),{count:"1",addresses:[client],tooMany:false});
 assert.deepEqual(decodeClients(abiClients([])),{count:"0",addresses:[],tooMany:false});
 assert.throws(()=>decodeClients("0x"+w(99999)),/safe bounds/);
 assert.throws(()=>decodeClients("0x"+w(32)+w(1)+w(0)),/zero client/);
});
test("too many clients never pretends to get partial canonical summary",()=>{
 const v=decodeClients("0x"+w(32)+w(70));
 assert.deepEqual(v,{count:"70",addresses:[],tooMany:true});
});
test("decimal signed int128 never rounds via floating point",()=>{
 assert.equal(decimalSigned(1234567n,6),"1.234567");
 assert.equal(decimalSigned(-1n,6),"-0.000001");
 assert.equal(decimalSigned(6n,0),"6");
 assert.throws(()=>decimalSigned(1n,37),/scale/);
});
test("decode getSummary uint64 int128 and uint8",()=>{
 assert.deepEqual(decodeSummary(summary(5,1234567n,6)),{count:"5",raw:"1234567",decimals:6,value:"1.234567"});
 assert.deepEqual(decodeSummary(summary(1,-1n,6)),{count:"1",raw:"-1",decimals:6,value:"-0.000001"});
 assert.throws(()=>decodeSummary(summary(1,1,37)),/scale/);
});
test("decode one trusted byte layout but untrusted inline JSON as data only",()=>{
 const registration={name:"Test merchant <img src=x>",active:true,x402Support:true,
  services:[{name:"MCP"},{name:"A2A"}]};
 const uri="data:application/json;base64,"+Buffer.from(JSON.stringify(registration)).toString("base64");
 const r=decodeRegistration(abiText(uri));
 assert.equal(r.uriKind,"onchain-data");
 assert.equal(r.name,registration.name);
 assert.equal(r.x402Support,true);
 assert.deepEqual(r.services,["MCP","A2A"]);
 assert.ok(!JSON.stringify(r).includes("data:application/json;base64"));
});
test("off-chain URI never fetched or exported",()=>{
 const uri="https://example.invalid/agent.json?apiKey=NEVER_EXPORT_ME";
 const r=decodeRegistration(abiText(uri));
 assert.equal(r.uriKind,"external-https-not-fetched");
 assert.ok(!JSON.stringify(r).includes("NEVER_EXPORT_ME"));
});
test("reject enormous inline metadata before decoding JSON",()=>{
 const u="data:application/json;base64,"+"A".repeat(14020);
 assert.equal(decodeRegistration(abiText(u)).uriKind,"unrecognized-not-fetched");
});
test("malformed ABI response rejected fail-closed",()=>{
 assert.throws(()=>decodeRegistration("0x"+w(32)+w(10)+"aa"),/Truncated/);
 assert.throws(()=>decodeRegistration("0x"+w(32)+w(16385)),/safe bounds/);
 assert.throws(()=>decodeRegistration("junk"),/Malformed/);
});
test("RPC rejects signing, transaction and arbitrary methods before any network",async()=>{
 let called=false; const fake=async()=>{called=true;throw Error("should not connect")};
 for(const m of ["eth_sendRawTransaction","eth_sendTransaction","personal_sign","eth_sign","debug_traceTransaction"]){
  await assert.rejects(()=>rpcRead(m,[],{fetchImpl:fake}),/Only public read-only/);
 }
 assert.equal(called,false);
});
test("RPC rejects arbitrary contract or function before any network",async()=>{
 const fake=async()=>{throw Error("should not connect")};
 await assert.rejects(()=>rpcRead("eth_call",[{to:"0x0000000000000000000000000000000000000001",data:encodeOwnerOf(0)},"latest"],{fetchImpl:fake}),/Registry address/);
 await assert.rejects(()=>rpcRead("eth_call",[{to:IDENTITY,data:"0xa9059cbb"+w(0)},"latest"],{fetchImpl:fake}),/selector/);
 await assert.rejects(()=>rpcRead("eth_call",[{to:IDENTITY,data:encodeOwnerOf(0)},"pending"],{fetchImpl:fake}),/current/);
 await assert.rejects(()=>rpcRead("eth_chainId",["secret"],{fetchImpl:fake}),/no parameters/);
});
test("RPC posts only bounded, read-only, no-cookie, no-wallet JSON",async()=>{
 let seen;
 const mock=async(url,args)=>{seen={url,...args};return {ok:true,json:async()=>({jsonrpc:"2.0",id:1,result:"0x13b2"})}};
 assert.equal(await rpcRead("eth_chainId",[],{fetchImpl:mock}),"0x13b2");
 assert.equal(seen.url,RPC_URL);
 assert.equal(seen.method,"POST");
 assert.equal(seen.credentials,"omit");
 assert.equal(seen.redirect,"error");
 assert.equal(JSON.parse(seen.body).method,"eth_chainId");
 assert.deepEqual(JSON.parse(seen.body).params,[]);
});
test("RPC errors do not dump arbitrary remote response bodies",async()=>{
 const fake=async()=>({ok:true,json:async()=>({jsonrpc:"2.0",id:1,error:{message:"PRIVATE_TOKEN_SECRET"}})});
 await assert.rejects(()=>rpcRead("eth_chainId",[],{fetchImpl:fake}),e=>!e.message.includes("PRIVATE_TOKEN_SECRET"));
});
test("wrong chain stops before agent-specific reads",async()=>{
 const calls=[];
 const read=async(method)=>{calls.push(method);return "0x1"};
 await assert.rejects(()=>inspectArcAgent("1",{read}),/Wrong network/);
 assert.deepEqual(calls,["eth_chainId"]);
});
test("end-to-end synthetic report NEVER certifies safe payments",async()=>{
 const registration={name:"Untrusted Example",active:true,x402Support:true,services:[{name:"web"}]};
 const uri="data:application/json;base64,"+Buffer.from(JSON.stringify(registration)).toString("base64");
 const calls=[];
 const read=async(method,args)=>{
   calls.push(method);
   if(method==="eth_chainId")return "0x13b2";
   if(method==="eth_blockNumber")return "0x100";
   const data=args[0].data;
   if(data.startsWith(SELECTORS.ownerOf))return abiOwner;
   if(data.startsWith(SELECTORS.tokenURI))return abiText(uri);
   if(data.startsWith(SELECTORS.getClients))return abiClients([client]);
   if(data.startsWith(SELECTORS.getSummary))return summary(2,75,1);
   throw Error("unknown selector");
 };
 const r=await inspectArcAgent("42",{read});
 assert.equal(r.chainId,5042);
 assert.equal(r.blockNumber,"256");
 assert.equal(r.owner,addr);
 assert.equal(r.registration.name,"Untrusted Example");
 assert.equal(r.clientCount,"1");
 assert.equal(r.reputationSummary.value,"7.5");
 assert.equal(r.settlementVerified,false);
 assert.equal(r.ratingTrusted,false);
 assert.equal(r.buyerPaymentCreated,false);
 assert.equal(r.policy,"MANUAL_REVIEW_REQUIRED");
 assert.ok(calls.includes("eth_call"));
 assert.ok(r.notices.join(" ").includes("self-declares"));
});
test("unreadable external profile or reputation cannot create trust",async()=>{
 const read=async(method,args)=>{
   if(method==="eth_chainId")return "0x13b2";
   if(method==="eth_blockNumber")return "0x10";
   if(args[0].data.startsWith(SELECTORS.ownerOf))return abiOwner;
   throw Error("simulated offline");
 };
 const r=await inspectArcAgent("0",{read});
 assert.equal(r.registration,null);
 assert.equal(r.reputationSummary,null);
 assert.equal(r.clientCount,null);
 assert.equal(r.policy,"MANUAL_REVIEW_REQUIRED");
 assert.equal(r.settlementVerified,false);
});
test("large client list prevents summary RPC rather than truncating history",async()=>{
 let summaryCalled=false;
 const read=async(method,args)=>{
   if(method==="eth_chainId")return "0x13b2";
   if(method==="eth_blockNumber")return "0x100";
   const calldata=args[0].data;
   if(calldata.startsWith(SELECTORS.ownerOf))return abiOwner;
   if(calldata.startsWith(SELECTORS.tokenURI))return abiText("https://example.invalid/agent.json");
   if(calldata.startsWith(SELECTORS.getClients))return "0x"+w(32)+w(65);
   if(calldata.startsWith(SELECTORS.getSummary)){summaryCalled=true;throw Error("forbidden");}
   throw Error("unknown");
 };
 const r=await inspectArcAgent("0",{read});
 assert.equal(r.clientCount,"65");
 assert.equal(r.reputationSummary,null);
 assert.equal(summaryCalled,false);
 assert.equal(r.policy,"MANUAL_REVIEW_REQUIRED");
});
