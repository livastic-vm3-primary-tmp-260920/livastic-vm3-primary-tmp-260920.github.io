import unittest
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree
P=Path(__file__).resolve().parent.parent
BASE='/crypto-csv-rescue/nado-closed-pnl/'
URL='https://livastic-vm3-primary-tmp-260920.github.io'+BASE
class NadoPnlSiteTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.page=(P/'crypto-csv-rescue/nado-closed-pnl/index.html').read_text()
  cls.core=(P/'crypto-csv-rescue/nado-closed-pnl/core.mjs').read_text()
  cls.app=(P/'crypto-csv-rescue/nado-closed-pnl/app.mjs').read_text()
 def test_links_from_landing_and_csv_rescue(self):
  self.assertEqual((P/'index.html').read_text().count('href="'+BASE+'"'),1)
  self.assertEqual((P/'crypto-csv-rescue/index.html').read_text().count('href="'+BASE+'"'),1)
 def test_valid_sitemap_canonical_and_llms(self):
  self.assertIn('rel="canonical" href="'+URL+'"',self.page)
  tree=ElementTree.parse(P/'sitemap.xml')
  names=[u.text for u in tree.iter() if u.tag.endswith('loc')]
  self.assertEqual(names.count(URL),1)
  self.assertIn(URL,(P/'llms.txt').read_text())
  HTMLParser().feed(self.page)
 def test_single_directory_backlink_is_honest_and_not_implied_approved(self):
  self.assertEqual(self.page.count('href="https://twelve.tools/"'),1)
  self.assertIn('Browse independent tools at Twelve Tools',self.page)
  self.assertNotIn('Listed on Twelve Tools',self.page)
  self.assertNotIn('Featured on Twelve Tools',self.page)

 def test_local_only_technical_limits_and_no_promise(self):
  self.assertIn("connect-src 'none'",self.page)
  self.assertIn("form-action 'none'",self.page)
  self.assertIn('not</strong> infer Nado',self.page)
  self.assertIn('not a native Nado converter',self.page)
  self.assertIn('no independently verified buyer',self.page)
  self.assertIn('19 native Circle USDC',self.page)
  for bad in ['fetch(', 'XMLHttpRequest', 'WebSocket(', 'navigator.sendBeacon','ethereum.request','localStorage','sessionStorage']:
   self.assertNotIn(bad,self.core)
   self.assertNotIn(bad,self.app)
 def test_explicit_source_controls_and_fictional_source(self):
  for key in ['date','pnl','currency','reference']:
   self.assertIn('id="map-'+key+'"',self.page)
  for key in ['ack-closed','ack-utc','ack-fees','demo','download']:
   self.assertIn('id="'+key+'"',self.page)
  self.assertIn('FICTIONAL',(P/'crypto-csv-rescue/nado-closed-pnl/README.md').read_text().upper())
  self.assertIn('FAKE-PERP-A',(P/'crypto-csv-rescue/nado-closed-pnl/fictional-only.csv').read_text())
  self.assertIn("f.text()",self.app)
  self.assertIn("if(f&&f.size>MAX_SOURCE_BYTES)",self.app)
  self.assertIn("URL.createObjectURL",self.app)
 def test_free_feedback_is_voluntary_and_safe(self):
  self.assertIn('id="free-feedback"',self.page)
  self.assertEqual(self.page.count('subject=Nado%20%2F%20Koinly%20FREE%20mapper%20feedback'),1)
  self.assertIn('column names only',self.page.lower())
  self.assertIn('not</strong> a purchase',self.page)
  self.assertIn('No independent respondents have been verified',self.page)
  self.assertIn('opening this draft may reveal your email address',self.page)
  self.assertEqual(self.page.count('href="https://twelve.tools/livastic-vm3-primary-tmp-260920-github-io-crypto-csv-rescue-nado-closed-pnl"'),1)
  self.assertIn('listing, not endorsement',self.page)
  self.assertIn('issues">Open-source issues',self.page)
 def test_verified_preexisting_public_usdc_voluntary_support_only(self):
  self.assertEqual(self.page.count('id="optional-support"'),1)
  self.assertEqual(self.page.count('id="copy-public-tip-recipient"'),1)
  self.assertEqual(self.page.count('id="public-tip-recipient"'),1)
  self.assertEqual(self.page.count('src="./tip.mjs"'),1)
  self.assertIn('Pay 0 USDC to use every feature',self.page)
  self.assertIn('No real donations or paying customers are currently verified',self.page)
  self.assertIn('do NOT send a tip as payment',self.page)
  self.assertIn('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',self.page)
  self.assertIn('0x6b01efA0705E91a7aca54271510bf9e594717f34',self.page)
  self.assertIn('vm5-openapi-x402.onrender.com/v1/csv-report',self.page)
  self.assertIn("connect-src 'none'",self.page)
  code=(P/'crypto-csv-rescue/nado-closed-pnl/tip.mjs').read_text()
  self.assertIn("browserAutoTransfers: false",code)
  self.assertIn("paymentCreatesOrder: false",code)
  for bad in ['ethereum.request','sendTransaction','fetch(','XMLHttpRequest','WebSocket(','eth_requestAccounts','localStorage']:
   self.assertNotIn(bad,code)
  self.assertIn('navigator.clipboard',code)
 def test_real_existing_same_owner_5_usdc_inquiry_not_fake_checkout(self):
  self.assertEqual(self.page.count('id="small-paid-qa"'),1)
  self.assertEqual(self.page.count('href="https://livastic-vm1-primary.github.io/paperpilot-tools/contact.html?service=koinly-mini-5"'),1)
  self.assertEqual(self.page.count('href="https://hashn.com/store/886ed287-aaca-434b-9f27-560a50bfbbb6/listings/koinly-csv-one-source-mapping-mini-review-5usdc.md"'),1)
  self.assertIn('not an automatic purchase',self.page)
  self.assertIn('not a wallet checkout',self.page)
  self.assertIn('two orders for the same work',self.page)
  self.assertIn('5 native Circle Base USDC/10-row',self.page)
  self.assertIn('different services of the same beneficial owner',self.page)
  self.assertIn('Written deliverables, acceptance, legitimate payee',self.page)
  self.assertIn('No real Nado buyer or paid result has been verified',self.page)
 def test_one_actual_published_educational_walkthrough_crosslink(self):
  url='https://dev.to/livasticvm3primarytmp260920/nado-perps-csv-and-koinly-a-safe-way-to-map-closed-pnl-without-inventing-trades-4jo1'
  self.assertEqual(self.page.count('href="'+url+'"'),1)
  self.assertIn('id="source-backed-walkthrough"',self.page)
  self.assertIn('same human economic owner',self.page)
  self.assertIn('not an independent endorsement or customer review',self.page)
  self.assertIn('no proof of Nado import success',self.page)
 def test_source_attribution(self):
  for official in [
   'https://support.koinly.io/en/articles/9490027-futures-and-perpetuals-pnl-other-gains',
   'https://support.koinly.io/en/articles/9489976-how-to-create-a-custom-csv-file-with-your-data',
   'https://discuss.koinly.io/t/nado-ink-kraken-chain-perpetual-dex-csv-import-not-compatible-with-koinly/27488',
  ]:self.assertIn(official,self.page)
