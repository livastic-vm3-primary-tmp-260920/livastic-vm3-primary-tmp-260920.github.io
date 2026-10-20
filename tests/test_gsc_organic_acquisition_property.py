"""One actual public site owner Search Console verification tag, no fake traffic."""
import pathlib
import unittest
from html.parser import HTMLParser

ROOT=pathlib.Path(__file__).resolve().parents[1]
TAG='tQM6aCd63rbSZfV3TrpyTFyNbyP-LG-sQ_zLl_6OexI'

class MetaParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.metatags=[]
        self.script_count=0
        self.forms=0
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=="meta" and d.get("name")=="google-site-verification":
            self.metatags.append(d.get("content"))
        if tag=="script":self.script_count+=1
        if tag=="form":self.forms+=1

class SearchOwnershipRegistrationTests(unittest.TestCase):
    def test_only_one_public_verification_meta_in_real_home_head(self):
        page=(ROOT/"index.html").read_text("utf-8")
        d=MetaParser();d.feed(page)
        self.assertEqual(d.metatags,[TAG])
        self.assertLess(page.index('name="google-site-verification"'),page.index("</head>"))
        self.assertEqual(d.forms,0)
        self.assertEqual(d.script_count,0)
        self.assertNotIn("window.ethereum",page)
        self.assertIn("default-src 'none'",page)
    def test_not_a_fabricated_customer_or_analytics_counter(self):
        page=(ROOT/"index.html").read_text("utf-8")
        self.assertNotIn("gtag(",page)
        self.assertNotIn("www.googletagmanager.com",page)
        self.assertNotIn("new paying customers this month",page)
        self.assertNotIn("fetch(",page)
        self.assertIn("No wallet connection",page)
    def test_original_pilot_pages_and_sitemap_intact(self):
        page=(ROOT/"index.html").read_text("utf-8")
        self.assertIn('href="/crypto-csv-rescue/"',page)
        self.assertIn('href="/usdc-receipt-reconciliation/"',page)
        self.assertIn("https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/",(ROOT/"urls.txt").read_text("utf-8"))
        self.assertIn("https://livastic-vm3-primary-tmp-260920.github.io/usdc-receipt-reconciliation/",(ROOT/"urls.txt").read_text("utf-8"))

if __name__=="__main__":
    unittest.main()
