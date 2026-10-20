"""Free-first owner marketing is actionable and never claims a real buyer's money."""
from pathlib import Path
from html.parser import HTMLParser
import unittest

ROOT=Path(__file__).resolve().parents[1]
CRYPTO="https://livastic-vm1-primary.github.io/paperpilot-tools/crypto-csv-rescue.html"
MERCH_VM1="https://livastic-vm1-primary.github.io/paperpilot-tools/usdc-invoice-reconcile.html"
MERCH_VM5="https://livastic-vm5-primary-20260911.github.io/vm5-delivery-lab/usdc-invoice-bridge/"
INVS=MERCH_VM5+"examples/pilot-50-synthetic-invoices.csv"
TRANS=MERCH_VM5+"examples/pilot-50-synthetic-reported-transfers.csv"

class Anchors(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.forms=0
        self.scripts=0
    def handle_starttag(self,tag,attrs):
        if tag=="a":self.links.append(dict(attrs).get("href",""))
        if tag=="form":self.forms+=1
        if tag=="script":self.scripts+=1

class OriginalOwnerFreeFirstBuyerQA(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages={
            "crypto":(ROOT/"crypto-csv-rescue/index.html").read_text("utf8"),
            "merchant":(ROOT/"usdc-receipt-reconciliation/index.html").read_text("utf8"),
            "home":(ROOT/"index.html").read_text("utf8"),
        }
        cls.anchors={}
        for k,s in cls.pages.items():
            p=Anchors();p.feed(s);cls.anchors[k]=p
        cls.llms=(ROOT/"llms.txt").read_text("utf8")
        cls.readmes={
            "crypto":(ROOT/"crypto-csv-rescue/README.md").read_text("utf8"),
            "merchant":(ROOT/"usdc-receipt-reconciliation/README.md").read_text("utf8")
        }

    def test_merchant_buyer_can_get_actual_one_owner_free_50_pair_example(self):
        self.assertEqual(self.anchors["merchant"].links.count(MERCH_VM5),2)
        self.assertIn(MERCH_VM1,self.anchors["merchant"].links)
        self.assertIn(INVS,self.anchors["merchant"].links)
        self.assertIn(TRANS,self.anchors["merchant"].links)
        self.assertIn("50-invoice / 50-reported-transfer",self.pages["merchant"])
        self.assertIn("not proof of real customer payment",self.pages["merchant"].lower())
        self.assertIn("no usdc payment",self.pages["merchant"].lower())

    def test_crypto_buyer_can_try_genuine_original_free_50_record_example(self):
        self.assertEqual(self.anchors["crypto"].links.count(CRYPTO),2)
        self.assertIn("/defi-payment-proof-qa/guides/crypto-transfer-csv-pair-auditor.html",self.anchors["crypto"].links)
        self.assertIn("free fictional 50-record CSV diagnosis",self.pages["crypto"])
        self.assertIn("fully fabricated",self.pages["crypto"])
        self.assertIn("stop there",self.pages["crypto"])

    def test_free_first_visible_in_product_hierarchy_before_price_scope(self):
        for k in ("crypto","merchant"):
            s=self.pages[k]
            self.assertEqual(s.count('id="try-free"'),1)
            self.assertLess(s.index('id="try-free"'),s.index('id="sample"'))
            self.assertLess(s.index('id="try-free"'),s.index('id="scope"'))
            self.assertIn("49.000000 native Circle USDC",s)
            self.assertTrue(any(x.startswith('mailto:onecursor1@gmail.com?') for x in self.anchors[k].links))

    def test_homepage_links_real_free_tool_separately_from_nonbinding_offers(self):
        self.assertEqual(self.anchors["home"].links.count(CRYPTO),1)
        self.assertEqual(self.anchors["home"].links.count(MERCH_VM5),1)
        self.assertIn("49-USDC",self.pages["home"])
        self.assertIn("before buying",self.pages["home"].lower())
        self.assertIn('href="/crypto-csv-rescue/"',self.pages["home"])
        self.assertIn('href="/usdc-receipt-reconciliation/"',self.pages["home"])

    def test_all_external_asset_links_from_same_owner_and_discovery_docs(self):
        for link in (CRYPTO,MERCH_VM5,MERCH_VM1,INVS,TRANS):
            self.assertIn(link,self.llms)
        for k,link in (("crypto",CRYPTO),("merchant",MERCH_VM5)):
            self.assertIn(link,self.readmes[k])
            self.assertIn("ONE economic owner",self.readmes[k])
        self.assertIn("not an end-to-end customer remediation",self.llms)
        self.assertIn("No automatic wallet charge",self.llms)

    def test_no_actual_payments_kYC_wallet_scripts_or_unapproved_csv_upload(self):
        for k,p in self.pages.items():
            self.assertEqual(self.anchors[k].forms,0)
            self.assertEqual(self.anchors[k].scripts,0)
            for banned in ["<form",'<input type="file"', "localStorage", "window.ethereum", "sendTransaction(",
                          "ethereum.request", "formsubmit.co", "new Web3", "fetch("]:
                self.assertNotIn(banned,p)
            self.assertIn("default-src 'none'",p)
            self.assertIn("form-action 'none'",p)
        self.assertIn("not evidence",self.pages["home"])
        self.assertIn("No independent merchant has yet accepted",self.pages["merchant"])
        self.assertIn("No independent customer has agreed",self.pages["crypto"])

    def test_no_fictional_owner_test_relabelled_to_independent_payer(self):
        self.assertIn("No independent customer has agreed",self.pages["crypto"])
        self.assertIn("no revenue from this offer is claimed",self.pages["merchant"].lower())
        self.assertIn("one real economic owner",self.pages["home"].lower())
        self.assertIn("these free tools",self.readmes["merchant"].lower())
        self.assertIn("NOT third-party paid client work",self.readmes["crypto"])

if __name__=="__main__":
    unittest.main()
