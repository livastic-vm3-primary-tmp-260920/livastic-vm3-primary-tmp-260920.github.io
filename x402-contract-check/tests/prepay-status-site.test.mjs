import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html = readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js = readFileSync(new URL('../prepay-status-app.mjs',import.meta.url),'utf8');
test('existing x402 inspection and optional micro buyer routes stay present',()=>{
  assert.match(html,/id="quote"/);
  assert.match(html,/id="paid-micro-qa"/);
  assert.match(html,/0\.75/);
  assert.match(html,/id="b2b-qa"/);
  assert.match(html,/19 native Circle Base USDC/);
});
test('prepayment checker actually loads local module in a no-network CSP',()=>{
  assert.match(html,/id="prepay-http-status"/);
  assert.match(html,/id="prepay-status-result"/);
  assert.match(html,/src="\.\/prepay-status-app\.mjs"/);
  assert.match(html,/connect-src 'none'/);
  assert.match(js,/textContent/);
  assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|window\.ethereum|innerHTML|localStorage/);
});
test('VM3 x402 service inquiry is prefilled into the existing single-owner VM5 form and is optional',()=>{
  const link=html.match(/href="(https:\/\/docs\.google\.com\/forms\/d\/e\/[^"]+)"[^>]*>Request no-payment technical QA scope/);
  assert.ok(link);
  const url=new URL(link[1].replace(/&amp;/g,'&'));
  assert.match(url.searchParams.get('entry.1765055758'),/VM3 x402 public 400\/422 vs 402/);
  assert.match(html,/no customer data is sent until you choose to submit/i);
  assert.match(html,/form inquiry is not a purchase or payment/i);
});
test('no signed payment or user secrets are accepted by status utility',()=>{
  assert.match(html,/no URL or response payload/);
  assert.match(html,/No endpoint is fetched/);
});
