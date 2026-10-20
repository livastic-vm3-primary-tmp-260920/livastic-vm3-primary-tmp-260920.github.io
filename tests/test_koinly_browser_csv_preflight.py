"""Koinly free standalone static browser template check, private-by-design UX."""
from pathlib import Path
from html.parser import HTMLParser
import unittest
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from create_root_sitemap import PREFIX,parse_paths,to_xml

URL=PREFIX+"crypto-csv-rescue/koinly-preflight/"

class Html(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs=[]
        self.inputs=[]
        self.scripts=[]
    def handle_starttag(self,tag,attrs):
        p=dict(attrs)
        if tag=="a":self.hrefs.append(p.get("href",""))
        if tag=="input":self.inputs.append(p)
        if tag=="script":self.scripts.append(p)

class KoinlyPrivateCsvPreflightTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html=(ROOT/"crypto-csv-rescue/koinly-preflight/index.html").read_text("utf8")
        cls.app=(ROOT/"crypto-csv-rescue/koinly-preflight/app.mjs").read_text("utf8")
        cls.core=(ROOT/"crypto-csv-rescue/koinly-preflight/core.mjs").read_text("utf8")
        cls.marketing=(ROOT/"crypto-csv-rescue/index.html").read_text("utf8")
        cls.home=(ROOT/"index.html").read_text("utf8")
        cls.llms=(ROOT/"llms.txt").read_text("utf8")
        cls.urls=parse_paths((ROOT/"urls.txt").read_text("utf8"))
        cls.sitemap=(ROOT/"sitemap.xml").read_bytes()
        cls.tags=Html();cls.tags.feed(cls.html)

    def test_firstparty_canonical_and_owner_merchandising(self):
        self.assertIn('rel="canonical" href="'+URL+'"',self.html)
        self.assertEqual(self.urls.count(URL),1)
        self.assertEqual(len(self.urls),20)
        self.assertEqual(self.sitemap,to_xml(self.urls))
        self.assertIn('href="/crypto-csv-rescue/koinly-preflight/"',self.marketing)
        self.assertIn('href="/crypto-csv-rescue/koinly-preflight/"',self.home)
        self.assertIn(URL,self.llms)
        self.assertIn("Koinly CSV",self.html)

    def test_koinly_three_exact_template_headers_from_official_docs(self):
        for required in ["Koinly Date","Amount","Currency","Pair","Side",
                         "Date","Sent Amount","Sent Currency","Received Amount","Received Currency"]:
            self.assertIn(required,self.core)
        self.assertIn("https://support.koinly.io/en/articles/9489976-how-to-create-a-custom-csv-file-with-your-data",self.tags.hrefs)
        self.assertIn("https://support.koinly.io/en/articles/9885319-how-to-modify-csv-files-to-import-them-to-koinly",self.tags.hrefs)
        self.assertIn('value="universal"',self.html)
        self.assertIn('value="simple"',self.html)
        self.assertIn('value="trades"',self.html)

    def test_only_optin_file_read_bounded_with_no_network(self):
        self.assertIn("connect-src 'none'",self.html)
        self.assertIn("default-src 'none'",self.html)
        self.assertIn("script-src 'self'",self.html)
        self.assertIn("form-action 'none'",self.html)
        self.assertEqual(len(self.tags.scripts),1)
        self.assertEqual(self.tags.scripts[0].get("src"),"./app.mjs")
        self.assertEqual(self.tags.scripts[0].get("type"),"module")
        self.assertEqual(len([x for x in self.tags.inputs if x.get("type")=="file"]),1)
        self.assertIn("f.text()",self.app)
        for denied in ["fetch(","XMLHttpRequest","WebSocket","sendBeacon","localStorage","sessionStorage",
                       "document.cookie","window.ethereum","eth_sendTransaction",
                       "navigator.clipboard","location.href =","eval("]:
            self.assertNotIn(denied,self.app)
        for denied in ["fetch(","XMLHttpRequest","WebSocket","sendBeacon","localStorage","sessionStorage",
                       "document.cookie","window.ethereum"]:
            self.assertNotIn(denied,self.core)
        self.assertIn("No file selected",self.app)

    def test_no_original_cell_or_source_file_name_in_results(self):
        self.assertIn("textContent",self.app)
        self.assertIn("replaceChildren",self.app)
        self.assertNotIn("innerHTML",self.app)
        self.assertNotIn("file.name",self.app)
        self.assertNotIn("f.name",self.app)
        self.assertNotIn("console.log",self.app)
        self.assertIn("originalValuesExposed:false",self.core)
        self.assertIn("No original addresses, timestamps, amounts, row contents or file names",self.html)
        self.assertIn("MAX_BYTES",self.app)
        self.assertIn("sourceFileUploaded:false",self.core)

    def test_clear_no_tax_no_checkout_scope_and_realized_income_gate(self):
        for term in ("No file upload","Koinly accepted the CSV","No original addresses","no real independent customer",
                     "49-native-Base-USDC manual diagnostic","Never make a tax filing"):
            self.assertIn(term.lower(),self.html.lower())
        self.assertIn("not a Koinly affiliate",self.html.lower()) if "not a Koinly affiliate" in self.html.lower() else self.assertIn("not Koinly",self.html)
        self.assertIn("No automated signing",self.html) if "No automated signing" in self.html else self.assertIn("No automatic signing",self.html) if "No automatic signing" in self.html else self.assertIn("No automatic",self.html)

    def test_no_external_owner_seed_auth_claims_or_dynamic_upload_form(self):
        self.assertIn('type="file"',self.html)
        self.assertNotIn("<form",self.html)
        self.assertNotIn("method=\"POST\"",self.html)
        self.assertNotIn("formsubmit.co",self.html)
        self.assertNotIn("WalletConnect",self.html)
        self.assertNotIn("Koinly endorsed",self.html)
        self.assertNotIn("100% guaranteed import",self.html)
        self.assertNotIn("track your purchases",self.html)

if __name__=="__main__":
    unittest.main()
