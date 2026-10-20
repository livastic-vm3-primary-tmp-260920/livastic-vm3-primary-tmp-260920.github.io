"""Explicitly bounded Crypto CSV Rescue buyer market-test page: fabricated fixtures, no tax or wallet."""
from pathlib import Path
from csv import DictReader
from html.parser import HTMLParser
from decimal import Decimal
import json
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from create_root_sitemap import PREFIX,parse_paths,to_xml

URL=PREFIX+"crypto-csv-rescue/"
USDC="0x833589fCD6eDb6E08f4C7C32D4f71b54bdA02913"
KOINLY="https://support.koinly.io/en/articles/9490037-missing-purchase-history-for-xyz"
COINTRACKER="https://www.cointracker.com/pricing"

class Tags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.h1=0
        self.forms=[]
        self.scripts=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="a":self.links.append(a.get("href",""))
        if tag=="h1":self.h1+=1
        if tag=="form":self.forms.append(a.get("action",""))
        if tag=="script":self.scripts+=1

class CryptoCsvRescueSales(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.page=(ROOT/"crypto-csv-rescue/index.html").read_text("utf8")
        cls.demo=json.loads((ROOT/"crypto-csv-rescue/fictional-8-case-review.json").read_text("utf8"))
        with (ROOT/"crypto-csv-rescue/fictional-8-case-review.csv").open(newline="",encoding="utf8") as f:
            cls.rows=list(DictReader(f))
        cls.home=(ROOT/"index.html").read_text("utf8")
        cls.llms=(ROOT/"llms.txt").read_text("utf8")
        cls.urls=parse_paths((ROOT/"urls.txt").read_text("utf8"))
        cls.xml=(ROOT/"sitemap.xml").read_bytes()
        cls.tags=Tags();cls.tags.feed(cls.page)

    def test_firstparty_canonical_and_two_market_root_funnel(self):
        self.assertEqual(cls_count(self.urls,URL),1)
        self.assertEqual(len(self.urls),19)
        self.assertEqual(self.xml,to_xml(self.urls))
        self.assertIn('rel="canonical" href="'+URL+'"',self.page)
        self.assertIn('href="/crypto-csv-rescue/"',self.home)
        self.assertIn('href="/usdc-receipt-reconciliation/"',self.home)
        self.assertEqual(self.home.count('id="csv-rescue49"'),1)
        self.assertEqual(self.home.count('id="recon49"'),1)
        self.assertLess(self.home.index('id="csv-rescue49"'),self.home.index('id="recon49"'))
        self.assertEqual(self.tags.h1,1)
        self.assertIn(URL,self.llms)

    def test_real_observed_industry_docs_not_fake_vendor_affiliation(self):
        self.assertIn(KOINLY,self.tags.links)
        self.assertIn("https://support.koinly.io/en/articles/9490041-some-transactions-are-missing",self.tags.links)
        self.assertIn(COINTRACKER,self.tags.links)
        self.assertIn("neither vendor commissioned, endorsed, partnered with, nor validated",self.page)
        self.assertIn("not evidence of a customer who bought our service",self.page.lower())

    def test_one_off_fortynine_native_circle_usdc_is_hypothesis(self):
        self.assertIn("49.000000 native Circle USDC",self.page)
        self.assertIn("chain 8453",self.page)
        self.assertIn(USDC,self.page)
        self.assertIn("pricing is a hypothesis",self.page.lower())
        self.assertIn("No independent customer has agreed",self.page)
        self.assertTrue(self.demo["metadata"]["priceIsHypothesis"])
        self.assertEqual(self.demo["metadata"]["proposedPriceNativeBaseCircleUSDC"],"49.000000")
        self.assertEqual(self.demo["metadata"]["actualFundedOrders"],0)
        self.assertEqual(self.demo["metadata"]["actualCustomerPayoutUSDC"],"0.000000")

    def test_bounded_one_issue_fifty_rows_two_exports(self):
        self.assertIn("50 safely redacted transaction rows across at most two exports",self.page)
        self.assertIn("one bounded discrepancy cluster",self.page)
        self.assertEqual(self.demo["metadata"]["maxRowsAcceptedAfterWrittenAgreement"],50)
        self.assertEqual(self.demo["metadata"]["maxSourceExports"],2)
        self.assertEqual(len(self.demo["cases"]),8)
        self.assertEqual(len(self.rows),8)

    def test_fully_fictional_json_and_csv_match_exactly(self):
        self.assertTrue(self.demo["demoOnly"])
        self.assertFalse(self.demo["generatedFromRealCustomer"])
        self.assertTrue(self.demo["safeFictionalReferenceIds"])
        self.assertEqual(len({x["id"] for x in self.demo["cases"]}),8)
        self.assertEqual(len({x["finding"] for x in self.demo["cases"]}),8)
        self.assertEqual([x["id"] for x in self.demo["cases"]],[r["case_id"] for r in self.rows])
        for case,row in zip(self.demo["cases"],self.rows):
            self.assertEqual(case["finding"],row["finding"])
            self.assertEqual(case["asset"],row["asset"])
            self.assertEqual(case["size"],row["hypothetical_quantity"])
            self.assertEqual(";".join(case["fictionalRefs"]),row["fictional_source_refs"])
            self.assertEqual(case["indication"],row["observed_or_suspected"])
            self.assertEqual(case["requiredEvidence"],row["primary_evidence_required"])
            self.assertEqual(case["resolution"],row["honest_status"])
            for value in row.values():
                self.assertFalse(value.startswith(("=","+","-","@","\t","\r")))
                self.assertFalse("0x" in value)
            self.assertEqual(Decimal(case["size"]),Decimal(row["hypothetical_quantity"]))
        self.assertIn("fictional-8-case-review.csv",self.tags.links)
        self.assertIn("fictional-8-case-review.json",self.tags.links)

    def test_never_fabricate_missing_cost_basis_or_tax_return(self):
        self.assertTrue(self.demo["notTaxOrLegalAdvice"])
        self.assertFalse(self.demo["priorAcquisitionCostBasisInferred"])
        self.assertIn("NO_COST_BASIS_INVENTED",[x["resolution"] for x in self.demo["cases"]])
        self.assertIn("no verified acquisition price can be inferred",self.page.lower())
        self.assertIn("never fabricate cost basis",self.page.lower())
        self.assertIn("Tax filings, professional accounting/legal advice",json.dumps(self.demo))
        self.assertNotIn("We will fix your tax filing",self.page)

    def test_transfer_ownership_and_duplicated_events_not_overasserted(self):
        text=json.dumps(self.demo)
        self.assertIn("account ownership",text)
        self.assertIn("log indexes",text)
        self.assertIn("not enough to assert self-transfer ownership",text)
        self.assertIn("not necessarily duplicates",self.page.lower())
        self.assertIn("time-zone",self.page.lower())
        self.assertIn("uncertainty",self.page.lower())

    def test_no_signatures_live_payment_upload_or_hidden_analytics(self):
        self.assertEqual(self.tags.forms,[])
        self.assertEqual(self.tags.scripts,0)
        for bad in ["window.ethereum","localStorage","sessionStorage","sendTransaction(",
                    "fetch(","XMLHttpRequest","<iframe","<input","<form","googletagmanager",
                    "formsubmit.co","type=\"file\"","payment-signature:"]:
            self.assertNotIn(bad,self.page)
        self.assertIn("default-src 'none'",self.page)
        self.assertIn("form-action 'none'",self.page)
        self.assertIn("no online file upload",self.page.lower())

    def test_written_scope_before_wallet_or_sensitive_data(self):
        self.assertTrue(any(x.startswith("mailto:onecursor1@gmail.com?") for x in self.tags.links))
        self.assertIn("transmitting private data or any USDC",self.page)
        self.assertIn("written scope",self.page)
        self.assertIn("refund",self.page.lower())
        self.assertIn("retention/deletion",self.page)
        self.assertIn("Crypto transfers may be irreversible",self.page) if "Crypto transfers may be irreversible" in self.page else self.assertIn("transfers may be irreversible",self.page)
        self.assertIn("Do not send money to a random address",self.page)
        self.assertFalse(self.demo["actualPaymentReceivedForService"])

    def test_preserves_other_merchant_services_and_old_original_root(self):
        self.assertIn('href="/usdc-receipt-reconciliation/"',self.home)
        self.assertIn('href="/x402-cors-qa-order/"',self.home)
        self.assertIn('href="/x402-smokecheck/"',self.home)
        self.assertIn("0.005 native Base USDC",self.home)
        self.assertIn("1.50 native Base USDC",self.home)
        self.assertIn("ONE beneficial owner",self.llms) if "ONE beneficial owner" in self.llms else self.assertIn("ONE human",self.llms)
        self.assertIn("existing free two-csv transfer-pair auditor",self.page.lower())

def cls_count(data,value):
    return sum(x==value for x in data)

if __name__=="__main__":
    unittest.main()
