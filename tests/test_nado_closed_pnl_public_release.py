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
 def test_source_attribution(self):
  for official in [
   'https://support.koinly.io/en/articles/9490027-futures-and-perpetuals-pnl-other-gains',
   'https://support.koinly.io/en/articles/9489976-how-to-create-a-custom-csv-file-with-your-data',
   'https://discuss.koinly.io/t/nado-ink-kraken-chain-perpetual-dex-csv-import-not-compatible-with-koinly/27488',
  ]:self.assertIn(official,self.page)
