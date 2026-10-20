import pathlib
import sys
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

BASE = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE / "scripts"))
from create_root_sitemap import NS, parse_paths, to_xml, PREFIX

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs=[]
        self.text=[]
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            a=dict(attrs)
            self.hrefs.append(a.get("href",""))
    def handle_data(self, data):
        self.text.append(data)

class RootMarketingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page=(BASE/"index.html").read_text("utf8")
        cls.parser=Links()
        cls.parser.feed(cls.page)
        cls.urls=parse_paths((BASE/"urls.txt").read_text("utf8"))
        cls.xml=(BASE/"sitemap.xml").read_bytes()

    def test_original_firstparty_root_and_all_required_routes(self):
        self.assertEqual(self.urls[0],PREFIX)
        self.assertGreaterEqual(len(self.urls),10)
        self.assertIn(PREFIX+"defi-payment-proof-qa/guides/crypto-transfer-csv-pair-auditor.html",self.urls)

    def test_root_sitemap_xml_matches_source_exactly(self):
        self.assertEqual(self.xml,to_xml(self.urls))
        root=ET.fromstring(self.xml)
        self.assertEqual(root.tag,f"{{{NS}}}urlset")
        self.assertEqual(len(root.findall(f"{{{NS}}}url")),len(self.urls))

    def test_root_robots_points_to_valid_firstparty_sitemap(self):
        text=(BASE/"robots.txt").read_text("utf8")
        self.assertIn("Sitemap: "+PREFIX+"sitemap.xml",text)
        self.assertNotIn("Disallow: /",text)

    def test_home_has_canonical_and_just_one_h1(self):
        self.assertIn('rel="canonical" href="'+PREFIX+'"',self.page)
        self.assertEqual(self.page.count("<h1>"),1)
        self.assertIn('name="robots" content="index,follow"',self.page)

    def test_important_paid_and_free_product_links_are_visible(self):
        links=self.parser.hrefs
        for suffix in (
            "/defi-payment-proof-qa/guides/crypto-transfer-csv-pair-auditor.html",
            "/defi-payment-proof-qa/guides/x402-quote-safety.html",
            "/defi-payment-proof-qa/guides/base-usdc-merchant-ledger.html",
            "/defi-payment-proof-qa/guides/csv-browser-x402-checkout.html",
            "/defi-payment-proof-qa/guides/csv-structural-preflight-005-base-usdc.html",
        ):
            self.assertIn(suffix,links)
        self.assertGreaterEqual(len(links),12)

    def test_no_silent_wallet_payment_or_sensitive_input(self):
        for forbidden in ("window.ethereum","eth_requestAccounts","sendTransaction(", "privateKeyToAccount",
                          "<form ","localStorage","google-analytics","type=\"password\""):
            self.assertNotIn(forbidden,self.page)
        self.assertNotIn('<script ',self.page)

    def test_seller_origin_is_same_existing_provider_and_not_cloned(self):
        self.assertIn("VM5",self.page)
        self.assertIn("0.005 native Base USDC",self.page)
        self.assertIn("0.005 Base USDC",self.page)
        self.assertNotIn("0 USDC paid customers",self.page)
        self.assertIn("independent buyer",self.page)

    def test_claims_clear_unverified_and_no_tax_credential(self):
        self.assertIn("not",self.page.lower())
        self.assertIn("tax filing",self.page)
        self.assertIn("not evidence",self.page)
        self.assertIn("AI-assisted",self.page)

    def test_external_feedback_is_opt_in_and_discloses_email(self):
        self.assertTrue(any(x.startswith("mailto:onecursor1@gmail.com") for x in self.parser.hrefs))
        self.assertIn("email exposes your sender address",self.page)

    def test_server_side_render_or_js_backend_not_included(self):
        self.assertIn("default-src 'none'",self.page)
        self.assertIn("@media(max-width:740px)",self.page)
        self.assertTrue((BASE/".nojekyll").exists())

    def test_missing_paid_quote_or_invalid_domain_rejected(self):
        with self.assertRaises(ValueError):
            parse_paths("\n".join(self.urls[:-1]) if "csv-browser-x402-checkout" in self.urls[-1] else
                        "\n".join(x for x in self.urls if "csv-browser-x402-checkout" not in x))
        with self.assertRaises(ValueError):
            parse_paths("\n".join(self.urls+["http://evil.example/private"]))
        with self.assertRaises(ValueError):
            parse_paths("\n".join(self.urls+[self.urls[-1]]))

if __name__=="__main__":
    unittest.main()
