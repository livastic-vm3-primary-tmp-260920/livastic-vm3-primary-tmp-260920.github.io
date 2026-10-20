"""Original VM3 one-owner root buyer conversion without auto-wallet work or fake revenue."""
import pathlib
import unittest
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from create_root_sitemap import parse_paths,to_xml,NS,PREFIX

PAID="https://livastic-vm3-primary-tmp-260920.github.io/defi-payment-proof-qa/services/x402-cors-remedy-150-usdc.html"
PAID_REL="/defi-payment-proof-qa/services/x402-cors-remedy-150-usdc.html"

class Tags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs=[]
    def handle_starttag(self,tag,attrs):
        if tag=="a":self.hrefs.append(dict(attrs).get("href",""))

class RootNewPaidRealProduct(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.home=(ROOT/"index.html").read_text("utf8")
        cls.llms=(ROOT/"llms.txt").read_text("utf8")
        cls.urls=parse_paths((ROOT/"urls.txt").read_text("utf8"))
        cls.xml=(ROOT/"sitemap.xml").read_bytes()
        cls.tags=Tags()
        cls.tags.feed(cls.home)
    def test_new_buyer_paid_funnel_is_firstparty_and_linked_once(self):
        self.assertEqual(self.tags.hrefs.count(PAID_REL),1)
        self.assertEqual(self.home.count('id="cors-paid"'),1)
        self.assertIn('#cors-paid',self.tags.hrefs)
    def test_researching_customer_can_use_free_CORS_tool_without_buying(self):
        self.assertIn("/defi-payment-proof-qa/guides/x402-browser-cors-doctor.html",self.tags.hrefs)
        self.assertIn('the browser doctor remains fully free',self.home)
        self.assertIn('no automatic payment',self.home.lower())
    def test_real_service_and_quote_accuracy(self):
        self.assertIn('1.50 native Base USDC',self.home)
        self.assertIn('Soul.Markets service',self.home)
        self.assertIn('X-Agent-ID',self.home)
        self.assertIn('1.500000',self.home)
        self.assertIn('0.30',self.home)
        self.assertIn('1.20 USDC',self.home)
        self.assertIn('five real active services',self.home)
    def test_no_merchant_revenue_customer_or_security_credential_fiction(self):
        self.assertIn('No independently verified customer has paid',self.home)
        self.assertIn('not a customer review or paid project',self.home)
        self.assertIn('not delivery, settled money',self.home)
        self.assertIn('One actual ultimate beneficiary',self.llms)
        self.assertNotIn('100 paying buyers',self.home)
    def test_all_sitemap_urls_exactly_once_and_only_firstparty(self):
        self.assertEqual(self.urls.count(PAID),1)
        self.assertEqual(len(self.urls),19)
        self.assertEqual(self.xml,to_xml(self.urls))
        root=ET.fromstring(self.xml)
        self.assertEqual(len(root.findall(f"{{{NS}}}url")),len(self.urls))
        for url in self.urls:self.assertTrue(url.startswith(PREFIX))
    def test_own_firstparty_explorer_discovers_new_SKU(self):
        self.assertIn(PAID,self.llms)
        self.assertIn('x402-browser-cors-remedy',self.llms)
        self.assertIn('Base8453 native Circle USDC 1.500000',self.llms)
        self.assertIn('No actual new paid executions',self.llms)
    def test_no_wallet_signing_payment_or_private_storage_on_home(self):
        for bad in ['<script','<form','window.ethereum','localStorage','sessionStorage','fetch(', 'sendTransaction(', 'payment-signature:']:
            self.assertNotIn(bad,self.home)
    def test_earlier_other_vm_free_and_paid_features_remain(self):
        for href in [
            '/x402-smokecheck/',
            '/defi-payment-proof-qa/guides/csv-browser-x402-checkout.html',
            '/defi-payment-proof-qa/guides/base-usdc-merchant-ledger.html',
            '/defi-payment-proof-qa/guides/crypto-transfer-csv-pair-auditor.html',
        ]:self.assertIn(href,self.tags.hrefs)
        self.assertIn('0.005 native Base USDC',self.home)
    def test_root_metadata_remains_canonical_and_zero_trackers(self):
        self.assertIn(f'rel="canonical" href="{PREFIX}"',self.home)
        self.assertIn("default-src 'none'",self.home)
        self.assertEqual(self.home.count("<h1>"),1)

if __name__=="__main__":
    unittest.main()
