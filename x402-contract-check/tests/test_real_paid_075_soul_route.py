import unittest,json,html,re
from pathlib import Path
from html.parser import HTMLParser
P=Path(__file__).resolve().parents[2]
URL='https://api.soul.mds.markets/v1/soul/vm3-usdc-receipt-qa/services/x402-quote-mismatch-preflight/execute'
class Finder(HTMLParser):
 def __init__(self):
  super().__init__();self.depth=0;self.got='';self.active=False
 def handle_starttag(self,tag,attrs):
  if tag=='pre' and ('class','example-json') in attrs:self.active=True
 def handle_endtag(self,tag):
  if tag=='pre':self.active=False
 def handle_data(self,s):
  if self.active:self.got+=s
class ExistingPaidSellerFlow(unittest.TestCase):
 def test_single_original_seller_listing_and_agent_quote_path(self):
  s=(P/'x402-contract-check/index.html').read_text()
  self.assertEqual(s.count('id="paid-micro-qa"'),1)
  self.assertEqual(s.count(URL),1)
  self.assertEqual(s.count('https://api.soul.mds.markets/v1/soul/vm3-usdc-receipt-qa"'),1)
  self.assertIn('USD $0.75',s)
  self.assertIn('402 PAYMENT-REQUIRED',s)
  self.assertIn('not</strong> proof of completed delivery',s)
  self.assertIn('executions and confirmed paid orders were both <strong>0</strong>',s)
  self.assertIn('same one human beneficial owner',s)
 def test_sample_is_synthetic_and_safe(self):
  s=(P/'x402-contract-check/index.html').read_text()
  f=Finder();f.feed(s)
  x=json.loads(html.unescape(f.got))
  self.assertEqual(set(x),{'input'})
  self.assertEqual(set(x['input']),{'http_status','decoded_public_payment_required','quoted_native_base_usdc','symptom'})
  j=json.loads(x['input']['decoded_public_payment_required'])
  self.assertEqual(j['x402Version'],2)
  self.assertEqual(j['accepts'][0]['amount'],'5000')
  self.assertTrue(j['resource']['url'].startswith('https://example.invalid/'))
  self.assertEqual(j['accepts'][0]['payTo'],'0x1111111111111111111111111111111111111111')
  self.assertIn('5,000 atomic units',s)
  self.assertIn('not</strong> the platform price',s)
 def test_no_payment_wiring_or_personal_data_access(self):
  s=(P/'x402-contract-check/index.html').read_text()
  self.assertIn("connect-src 'none'",s)
  for key in ['window.ethereum','eth_sendTransaction','eth_requestAccounts','method=\"post\"','function submitPayment']:
   with self.subTest(key=key):self.assertNotIn(key,s)
  self.assertIn('both <strong>0</strong>',s)
if __name__=='__main__':unittest.main()
