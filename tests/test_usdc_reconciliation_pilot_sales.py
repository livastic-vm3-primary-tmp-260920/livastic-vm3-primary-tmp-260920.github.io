"""Owner VM3 public fixed-scope USDC merchant buyer UX, no real invoice or wallet."""
import json
from decimal import Decimal
from html.parser import HTMLParser
from pathlib import Path
import sys
import unittest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from create_root_sitemap import PREFIX,parse_paths,to_xml

LANDING="https://livastic-vm3-primary-tmp-260920.github.io/usdc-receipt-reconciliation/"
TOKEN="0x833589fCD6eDb6E08f4C7C32D4f71b54bdA02913"

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.actions=[]
        self.h1=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="a":self.links.append(a.get("href",""))
        if tag=="form":self.actions.append(a.get("action",""))
        if tag=="h1":self.h1+=1

class MerchantsNew49USDCPilotPage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html=(ROOT/"usdc-receipt-reconciliation/index.html").read_text("utf8")
        cls.fixture=json.loads((ROOT/"usdc-receipt-reconciliation/fictional-8-case-sample.json").read_text("utf8"))
        cls.home=(ROOT/"index.html").read_text("utf8")
        cls.llms=(ROOT/"llms.txt").read_text("utf8")
        cls.urls=parse_paths((ROOT/"urls.txt").read_text("utf8"))
        cls.sitemap=(ROOT/"sitemap.xml").read_bytes()
        cls.links=Links()
        cls.links.feed(cls.html)

    def test_one_canonical_owner_and_firstparty_purchase_path(self):
        self.assertIn('rel="canonical" href="'+LANDING+'"',self.html)
        self.assertEqual(self.urls.count(LANDING),1)
        self.assertGreaterEqual(len(self.urls),21)  # Exact sitemap must match allowlisted urls.txt; unique new first-party pages permitted
        self.assertEqual(self.sitemap,to_xml(self.urls))
        self.assertIn('href="/usdc-receipt-reconciliation/"',self.home)
        self.assertIn('href="#recon49"',self.home)
        self.assertEqual(self.home.count('id="recon49"'),1)
        self.assertIn(LANDING,self.llms)
        self.assertEqual(self.links.h1,1)

    def test_49_usdc_is_experiment_not_billed_customer_or_subscription(self):
        for word in (
                '49.000000 native Circle USDC on Base',
                'pricing experiment', 'a pre-funded commission',
                'zero actual buyer reviews or completed $49 pilot sales',
                'No independent merchant has yet accepted',
                'no revenue from this offer is claimed',
                'no automatic reconciliation',
                'not a licensed accounting firm'):
            self.assertIn(word.lower(),self.html.lower())
        self.assertEqual(self.fixture["proposedPilot"]["proposedBaseUSDCPrice"],"49.000000")
        self.assertTrue(self.fixture["proposedPilot"]["priceIsNonbindingHypothesis"])
        self.assertEqual(self.fixture["verifiedNewPayingUsersForThisOffer"],0)
        self.assertEqual(self.fixture["verifiedSalesForThisOffer"],"0.000000 USDC")
        self.assertNotIn('guaranteed monthly subscription',self.html)

    def test_bounded_50_invoice_and_50_receipt_and_reproducible_offer(self):
        self.assertIn("50 seller-authorized invoices and 50 candidate token Transfer events",self.html)
        self.assertEqual(self.fixture["proposedPilot"]["maximumInvoices"],50)
        self.assertEqual(self.fixture["proposedPilot"]["maximumCandidateTransferEvents"],50)
        self.assertEqual(len(self.fixture["sampleCases"]),8)
        self.assertIn("one plain-English/Markdown exception report",self.html)
        self.assertIn("Merchant finance operations",self.html)
        self.assertIn("written scope",self.html.lower())

    def test_canonical_base_usdc_non_ambiguous_contract_and_decimal(self):
        f=self.fixture
        self.assertEqual(f["fictionalExpectedRail"]["chainId"],8453)
        self.assertEqual(f["fictionalExpectedRail"]["decimals"],6)
        self.assertEqual(f["fictionalExpectedRail"]["tokenContract"],TOKEN)
        self.assertIn(TOKEN,self.html)
        self.assertIn("6 decimals",self.html)
        amounts=[]
        for row in f["sampleCases"]:
            for k in ["expected","observed"]:
                if row[k] is None:continue
                d=Decimal(row[k])
                self.assertEqual(d.as_tuple().exponent,-6)
                self.assertGreaterEqual(d,0)
                amounts.append(d)
        self.assertGreater(len(amounts),12)

    def test_public_fictional_csv_report_is_consistent_and_spreadsheet_safe(self):
        import csv
        path=ROOT/"usdc-receipt-reconciliation/fictional-8-case-report.csv"
        with path.open(newline="",encoding="utf8") as f:
            records=list(csv.DictReader(f))
        self.assertEqual(len(records),8)
        self.assertEqual([row["invoice_ref"] for row in records],
                         [sample["invoiceId"] for sample in self.fixture["sampleCases"]])
        for case,row in zip(self.fixture["sampleCases"],records):
            self.assertEqual(case["status"],row["exception_status"])
            self.assertEqual(case["expected"],row["expected_base_usdc"])
            self.assertEqual(case["observed"] or "",row["candidate_amount"])
            self.assertEqual(case["evidence"],row["source_event_keys_fictional"].split(";") if row["source_event_keys_fictional"] else [])
            for value in row.values():
                self.assertFalse(value.startswith(("=","+","-","@","\t","\r")))
                self.assertNotIn("0x"+"a"*64,value)
        self.assertIn("fictional-8-case-report.csv",self.links.links)
        self.assertIn("fictional-8-case-report.csv",self.llms)

    def test_one_each_realistic_exception_type_not_a_matcher(self):
        sample=self.fixture["sampleCases"]
        counts=self.fixture["expectedCategoryCount"]
        statuses=[row["status"] for row in sample]
        self.assertEqual(set(statuses),set(counts))
        self.assertTrue(all(count==1 for count in counts.values()))
        self.assertTrue(f["illustrativeOnly"] if (f:=self.fixture) else False)
        self.assertFalse(f["generatedFromRealUsers"])
        self.assertFalse(f["representsFinishedClientWork"])
        self.assertEqual(Decimal(sample[1]["expected"])-Decimal(sample[1]["observed"]),Decimal("1.000000"))
        self.assertEqual(Decimal(sample[6]["observed"])-Decimal(sample[6]["expected"]),Decimal("0.500000"))
        self.assertIsNone(sample[2]["observed"])
        self.assertEqual(sample[3]["evidence"][0],sample[3]["evidence"][1])
        self.assertEqual(len(set(sample[7]["evidence"])),2)

    def test_no_real_payment_hash_or_wallet_access_or_customer_data(self):
        self.assertEqual(self.links.actions,[])
        for banned in (
            "<script", "<form", "localStorage", "sessionStorage",
            "window.ethereum","eth_requestAccounts", "payment-signature:",
            "sendTransaction(", "seed phrase:","<input", "checkout.stripe.com",
            "formsubmit.co", "dataLayer", "googletagmanager", "new Promise("):
            self.assertNotIn(banned,self.html)
        self.assertIn("default-src 'none'",self.html)
        self.assertIn("form-action 'none'",self.html)
        self.assertTrue(self.fixture["illustrativeOnly"])
        self.assertTrue(all("DEMO_TX_" in evidence for row in self.fixture["sampleCases"] for evidence in row["evidence"]))
        self.assertTrue(all(row["invoiceId"].startswith("FICTION-") for row in self.fixture["sampleCases"]))
        self.assertNotIn('"transactionHash": "0x',json.dumps(self.fixture))

    def test_actual_evidence_requires_chain_log_index_merchant_attribution(self):
        for term in ["chain ID + transaction hash + log index",
                     "merchant-approved attribution",
                     "A receipt missing from a partial export is not proof of nonpayment",
                     "not a security audit", "only for genuine independently verifiable receipts"]:
            self.assertIn(term.lower(),self.html.lower())
        boundary=self.fixture["classificationBoundaries"]
        self.assertIn("logIndex",boundary["identity"])
        self.assertIn("Merchant-authorized",boundary["attribution"])
        self.assertIn("not proof",boundary["missing"])
        self.assertIn("independently verified chain confirmations",boundary["finality"])
        self.assertIn("never floating-point",boundary["precision"])

    def test_no_upfront_payment_or_surprise_delivery_claim(self):
        self.assertIn("Do not transfer USDC before written agreement",self.html)
        self.assertIn("refund/cancellation",self.html)
        self.assertIn("No client invoice or customer data is collected",self.home)
        self.assertIn("No wallet signing",self.home)
        self.assertIn("no wallet connection",self.html.lower())
        self.assertIn("mail",self.html.lower())
        self.assertIn("mailto:onecursor1@gmail.com?",self.html)
        self.assertTrue(self.fixture["proposedPilot"]["mustAgreeScopeInvoiceRefundAndPayeeBeforeTokenTransfer"])

    def test_existing_other_owner_sites_and_paid_offers_remain_intact(self):
        for href in [
            "/x402-smokecheck/",
            "/x402-cors-qa-order/",
            "/defi-payment-proof-qa/guides/base-usdc-merchant-ledger.html",
            "/defi-payment-proof-qa/guides/crypto-transfer-csv-pair-auditor.html",
        ]:
            self.assertIn(href,self.home)
        self.assertIn("0.005 native Base USDC",self.home)
        self.assertIn("1.50 native Base USDC",self.home)
        self.assertIn('not a real customer',self.fixture["disclosure"].lower())
        self.assertIn("VM5",self.llms)

if __name__=="__main__":
    unittest.main()
