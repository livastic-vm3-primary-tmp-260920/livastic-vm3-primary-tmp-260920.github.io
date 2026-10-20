import unittest
from pathlib import Path
from html.parser import HTMLParser
import xml.etree.ElementTree as ET
BASE=Path(__file__).resolve().parents[2]
class Parser(HTMLParser):pass
class StaticReleaseTests(unittest.TestCase):
 def test_single_free_browser_app_and_no_unpaid_payment(self):
  html=(BASE/"x402-contract-check/index.html").read_text()
  Parser().feed(html)
  for phrase in ['id="quote"','id="check"','id="demo-v2"','id="demo-v1"','id="download"',
                 'id="report"','x402 v1 vs v2','Bazaar','19 native Circle Base USDC',
                 'No payments are initiated']:
   self.assertIn(phrase,html)
  self.assertIn("connect-src 'none'",html)
  self.assertIn("x402-browser-compatibility.md",html)
  self.assertIn("No payment is required to report a bug",html)
  self.assertEqual(html.count('src="./app.mjs"'),1)
 def test_no_wallet_network_apis_or_private_fields(self):
  src=(BASE/"x402-contract-check/check.mjs").read_text()+(BASE/"x402-contract-check/app.mjs").read_text()
  for text in ['window.ethereum','eth_requestAccounts','eth_sendTransaction','personal_sign',
               'walletconnect','localStorage','XMLHttpRequest','fetch(','navigator.sendBeacon','WebSocket(']:
   with self.subTest(text=text):self.assertNotIn(text,src)
  self.assertIn('SECRET_OR_SIGNED_PAYMENT_FIELD_REJECTED',src)
 def test_homepage_and_sitemap_has_one_reference(self):
  s=(BASE/"index.html").read_text()
  self.assertEqual(s.count('href="/x402-contract-check/"'),1)
  self.assertIn('id="x402-contract-reality"',s)
  self.assertIn('href="/x402-smokecheck/"',s)
  x=ET.parse(BASE/"sitemap.xml").getroot()
  dest="https://livastic-vm3-primary-tmp-260920.github.io/x402-contract-check/"
  self.assertEqual([u.text for u in x.iter() if u.tag.endswith('loc')].count(dest),1)
  self.assertEqual((BASE/"llms.txt").read_text().count(dest),1)
if __name__=='__main__':unittest.main()
