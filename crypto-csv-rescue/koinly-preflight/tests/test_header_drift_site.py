import unittest
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[2]
class Parser(HTMLParser):pass
class HeaderDrift(unittest.TestCase):
 def test_unique_same_site_readonly_buyer_diagnostic(self):
  index=(ROOT/'koinly-preflight/index.html').read_text()
  Parser().feed(index)
  for item in ['id="header-drift"','id="old-header-text"','id="new-header-text"',
               'id="drift-result"','id="drift-old-only"','id="drift-new-only"',
               'id="drift-check"','id="drift-synthetic"','id="drift-clear"',
               'src="./header-drift-app.mjs"','October 12, 2026',
               'DO NOT edit','contact Koinly support','pay <strong>0 USDC</strong>']:
    with self.subTest(item=item):self.assertIn(item,index)
  self.assertEqual(index.count('id="header-drift"'),1)
  self.assertEqual(index.count('src="./header-drift-app.mjs"'),1)
 def test_no_browser_upload_wallet_or_quote(self):
  text=(ROOT/'koinly-preflight/header-drift.mjs').read_text() + (ROOT/'koinly-preflight/header-drift-app.mjs').read_text()
  for token in ['window.ethereum','eth_requestAccounts','eth_sendTransaction','XMLHttpRequest','fetch(','sendBeacon(','localStorage','sessionStorage','navigator.clipboard','addEventListener("submit"']:
    with self.subTest(token=token):self.assertNotIn(token,text)
  self.assertIn('textContent',text)
  self.assertNotIn('innerHTML',text)
 def test_existing_free_and_paid_options_unchanged(self):
  index=(ROOT/'koinly-preflight/index.html').read_text()
  for key in ['id="map-first"','id="check-title"','id="safe-summary"','id="feedback"','id="mini5"',
       'src="./app.mjs"','5-USDC','49 USDC']:
    with self.subTest(key=key):self.assertIn(key,index)
  self.assertIn("connect-src 'none'",index)
if __name__=="__main__":unittest.main()
