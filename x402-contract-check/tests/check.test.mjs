import test from 'node:test';
import assert from 'node:assert/strict';
import {
 parsePublic402,examinePublic402,DEMO_V1,DEMO_V2,NATIVE_BASE_USDC,MAX_CHARS
} from '../check.mjs';
const snapshot=value=>structuredClone(value);
const codes=r=>r.issues.map(x=>x.code);
const b64=o=>Buffer.from(JSON.stringify(o)).toString('base64');
const modify=(o,p)=>{const x=snapshot(o);p(x);return x;};
test('authored demo x402 v2 has correct canonical chain/asset, interprets USDC atomic units',()=>{
 const x=examinePublic402(parsePublic402(JSON.stringify(DEMO_V2)));
 assert.equal(x.blockers,0);
 assert.equal(x.versionObserved,2);
 assert.equal(x.baseNativeCircleUsdcFirstAcceptAmount,'0.005000');
 assert.equal(x.bazaarDisclosed,true);
 assert.equal(x.bazaarResultContractVerified,false);
 assert.equal(x.actualPaidDeliverabilityVerified,false);
 assert.equal(x.walletsConnected,0);
 assert.equal(x.networkRequests,0);
 assert.ok(codes(x).includes('BAZAAR_EXAMPLE_IS_NOT_A_RESPONSE_CONTRACT'));
 assert.ok(codes(x).includes('PAID_RESPONSE_AND_MERCHANT_UNVERIFIED'));
});
test('legacy v1 recognized without creating false v2 payment errors',()=>{
 const result=examinePublic402(parsePublic402(JSON.stringify(DEMO_V1)));
 assert.equal(result.versionObserved,1);
 assert.equal(result.blockers,0);
 assert.ok(codes(result).includes('LEGACY_V1_ONLY'));
 assert.equal(result.baseNativeCircleUsdcFirstAcceptAmount,null);
 assert.equal(result.bazaarDisclosed,false);
});
test('base64 v2 PAYMENT-REQUIRED header is accepted without requiring an HTTP response',()=>{
 const obj=parsePublic402(b64(DEMO_V2));
 assert.deepEqual(obj,DEMO_V2);
 assert.equal(examinePublic402(obj).versionObserved,2);
});
test('unsupported legacy payment fields in a v2 quote require explicitly adding amount',()=>{
 const quote=modify(DEMO_V2,o=>{
  o.accepts[0].maxAmountRequired=o.accepts[0].amount;
  delete o.accepts[0].amount;
 });
 const r=examinePublic402(quote);
 assert.ok(r.blockers>0);
 assert.ok(codes(r).includes('MISSING_OR_INVALID_ATOMIC_AMOUNT'));
 assert.ok(codes(r).includes('LEGACY_V1_AMOUNT_KEY_IN_V2'));
});
test('legacy accepts outputSchema in v2 is a warning, not a fake verified paid result schema',()=>{
 const r=examinePublic402(modify(DEMO_V2,o=>o.accepts[0].outputSchema={type:'json',example:{ok:true}}));
 assert.ok(codes(r).includes('LEGACY_V1_OUTPUT_SCHEMA_IN_V2'));
 assert.equal(r.bazaarResultContractVerified,false);
});
test('incorrect v2 network identifier is a structural blocker',()=>{
 const r=examinePublic402(modify(DEMO_V2,o=>o.accepts[0].network='base'));
 assert.ok(codes(r).includes('V2_NETWORK_NOT_CAIP2'));
 assert.equal(r.paymentShape,'STRUCTURAL_BLOCKER_OBSERVED');
});
test('missing Bazaar extension is a metadata limitation, not payment failure',()=>{
 const r=examinePublic402(modify(DEMO_V2,o=>delete o.extensions));
 assert.equal(r.blockers,0);
 assert.ok(codes(r).includes('NO_BAZAAR_DISCOVERY'));
 assert.equal(r.bazaarDisclosed,false);
});
test('metadata schema absence cannot be silently treated as a complete contract',()=>{
 const r=examinePublic402(modify(DEMO_V2,o=>delete o.extensions.bazaar.schema));
 assert.ok(codes(r).includes('BAZAAR_META_SCHEMA_MISSING'));
 assert.equal(r.bazaarResultContractVerified,false);
});
test('POST without documented body must not be called a full dead service',()=>{
 const r=examinePublic402(modify(DEMO_V2,o=>{o.extensions.bazaar.info.input={type:'http',method:'POST'};}));
 assert.ok(codes(r).includes('BAZAAR_BODY_METHOD_SAMPLE_MISSING'));
 assert.equal(r.actualPaidDeliverabilityVerified,false);
});
test('missing paid resource is blocker in v2, but never triggers network',()=>{
 const r=examinePublic402(modify(DEMO_V2,o=>{o.resource={url:'http://localhost:9000/'};}));
 assert.ok(codes(r).includes('V2_RESOURCE_URL_UNUSABLE'));
 assert.equal(r.networkRequests,0);
});
test('canonical nonmatching asset must not be mislabeled as native Base USDC',()=>{
 const r=examinePublic402(modify(DEMO_V2,o=>o.accepts[0].asset='0x0000000000000000000000000000000000000000'));
 assert.equal(r.baseNativeCircleUsdcFirstAcceptAmount,null);
});
test('multiple accepts are transparently disclosed',()=>{
 const r=examinePublic402(modify(DEMO_V2,o=>o.accepts.push({...o.accepts[0],network:'eip155:1'})));
 assert.equal(r.acceptsInspected,2);
 assert.ok(codes(r).includes('MULTIPLE_PAYMENT_CHOICES'));
});
test('malformed arrays, versions, atomic values, URLs are never certified',()=>{
 for(const edit of [
  o=>o.x402Version=9,
  o=>o.accepts=[],
  o=>o.accepts[0].amount='-1',
  o=>o.accepts[0].amount='1e12',
  o=>o.accepts[0].amount='0',
  o=>o.accepts[0].payTo='bad'
 ]){
  const input=modify(DEMO_V2,edit);
  if(!input.accepts.length)assert.throws(()=>parsePublic402(JSON.stringify(input)));
  else assert.ok(examinePublic402(input).blockers>0);
 }
});
test('private or signed payment fields in nested JSON are rejected before reporting',()=>{
 for(const name of [
  'authorization','payment-signature','x-payment','cookie','access_token',
  'seed_phrase','privateKey','__proto__','payload'
 ]){
  const raw=name==='__proto__'?
    JSON.stringify(DEMO_V2).replace('"x402Version"', '"__proto__": {"isAdmin":true}, "x402Version"'):
    JSON.stringify({...DEMO_V2,nested:{[name]:'private-secret-canary'}});
  assert.throws(()=>parsePublic402(raw),/SECRET_OR_SIGNED_PAYMENT_FIELD_REJECTED/);
 }
});
test('never leak private original input text or full receiver to output',()=>{
 const privateCanary='THIS_USER_PRIVATE_VALUE_SHOULD_NOT_APPEAR';
 const original=modify(DEMO_V2,o=>{
  o.resource.description=privateCanary;
  o.accepts[0].payTo='0x1234567890123456789012345678901234567890';
 });
 const report=JSON.stringify(examinePublic402(original));
 assert.ok(!report.includes(privateCanary));
 assert.ok(!report.includes('0x1234567890123456789012345678901234567890'));
});
test('source input limited by length, depth and forbidden whole HTTP headers',()=>{
 assert.equal(MAX_CHARS,24000);
 assert.throws(()=>parsePublic402('x'.repeat(MAX_CHARS+1)));
 assert.throws(()=>parsePublic402('HTTP/1.1 402 Payment Required\nset-cookie:secret=1'));
 let nested={};let cur=nested;
 for(let i=0;i<20;i++){cur.next={};cur=cur.next;}
 assert.throws(()=>parsePublic402(JSON.stringify({...DEMO_V2,nested})),/TOO_DEEP/);
});
test('fail closed for invalid base64, malformed JSON or insufficient public accepts',()=>{
 for (const raw of ['???','{}','[]','eyJmb28iOiAiYmFy','{"accepts":[]}', '{"accepts":true}']){
  assert.throws(()=>parsePublic402(raw));
 }
});
