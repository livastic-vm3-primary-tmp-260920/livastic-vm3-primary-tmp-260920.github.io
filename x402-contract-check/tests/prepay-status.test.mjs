import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyObservedPrepayStatus as classify} from '../prepay-status.mjs';

for (const [status, code] of [
  [400,'REQUEST_NOT_READY'], [401,'AUTH_REQUIRED'],
  [402,'PAYMENT_CHALLENGE_POSSIBLE'], [403,'ACCESS_FORBIDDEN'],
  [404,'ROUTE_NOT_FOUND'], [408,'REQUEST_TIMED_OUT'],
  [409,'REQUEST_CONFLICT'], [422,'INPUT_SEMANTICS_REJECTED'],
  [429,'RATE_LIMITED'], [103,'INFORMATIONAL_ONLY'],
  [200,'HTTP_SUCCESS_NOT_PAYMENT_PROOF'], [202,'HTTP_SUCCESS_NOT_PAYMENT_PROOF'],
  [307,'REDIRECT_NOT_PAYMENT'], [418,'CLIENT_OR_REQUEST_EXCEPTION'],
  [500,'UPSTREAM_OR_SERVER_ERROR'], [503,'UPSTREAM_OR_SERVER_ERROR']
]) {
  test(`fictional HTTP ${status} produces correct cautious category with zero financial actions`, () => {
    const r=classify(status);
    assert.equal(r.httpStatus,status);
    assert.equal(r.code,code);
    assert.equal(r.paymentSucceeded,'NOT_VERIFIED');
    assert.equal(r.paymentFailed,'NOT_VERIFIED');
    assert.equal(r.merchantTrustworthy,'NOT_VERIFIED');
    assert.equal(r.walletAccessRequired,false);
    assert.equal(r.networkCallsMade,0);
    assert.ok(r.interpretation.length>35);
    assert.ok(r.safeNextStep.length>30);
  });
}
test('request-error statuses do not get marked as paid payment failures',()=>{
  for (const s of [400,422,401,403]) {
    const r=classify(s);
    assert.doesNotMatch(r.title,/payment failed/i);
    assert.equal(r.paymentFailed,'NOT_VERIFIED');
  }
});
test('402 never implies a valid quote or successful payment',()=>{
  const r=classify(402);
  assert.match(r.interpretation,/does not prove/i);
  assert.equal(r.paymentSucceeded,'NOT_VERIFIED');
});
test('2xx does not assert a money transfer, and server errors do not imply retry',()=>{
  assert.match(classify(200).interpretation,/cannot prove a payment/i);
  assert.match(classify(503).safeNextStep,/do not repeat a signed purchase automatically/i);
});
test('no data-bearing strings are accepted or reflected',()=>{
  for (const x of ['',null,'400 secret=abc','http://example.com','402;cookie=x','999',-1,'undefined','401\nAuthorization:BearerX',{}]) {
    const r=classify(x);
    assert.equal(r.code,'INVALID_HTTP_STATUS');
    assert.equal(JSON.stringify(r).includes('BearerX'),false);
    assert.equal(r.httpStatus,null);
  }
});
