"""Source-first, accurate public GitHub landing for one owner's real crypto tools."""
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
TEXT=(ROOT/"README.md").read_text("utf8")

class PublicOriginalRepoDiscoveryTest(unittest.TestCase):
    def test_real_free_tools_and_both_price_hypotheses_visible_first_screen(self):
        self.assertTrue(TEXT.startswith("# Free Crypto CSV and Base USDC checks"))
        self.assertLess(TEXT.index("Open free Koinly CSV checker"),900)
        for url in (
          "https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/koinly-preflight/",
          "https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/",
          "https://livastic-vm3-primary-tmp-260920.github.io/usdc-receipt-reconciliation/",
          "https://livastic-vm1-primary.github.io/paperpilot-tools/usdc-invoice-reconcile.html",
        ):
            self.assertIn(url,TEXT)

    def test_documentation_does_not_claim_tax_deletion_or_paid_clients(self):
        for phrase in (
            "UNVALIDATED PRICE HYPOTHESES", "zero independently confirmed paying customers",
            "zero proven finalized 49-USDC receipts",
            "512 KiB / 200 data rows / 36 columns",
            "never original transaction amounts", "one discrepancy cluster",
            "50 merchant invoices and 50 reported token transfer event rows",
            "No certified cost basis", "connect-src 'none'",
        ):
            if phrase=="one discrepancy cluster":
                self.assertIn("one discrepancy cluster",TEXT)
            else:
                self.assertIn(phrase.lower(),TEXT.lower(),phrase)
        self.assertIn("not four independent sellers",TEXT)

    def test_actual_qa_sources_exist(self):
        for p in ("crypto-csv-rescue/koinly-preflight/index.html",
                  "crypto-csv-rescue/koinly-preflight/core.mjs",
                  "crypto-csv-rescue/koinly-preflight/app.mjs",
                  "crypto-csv-rescue/koinly-preflight/safe-summary.mjs",
                  "crypto-csv-rescue/koinly-preflight/safe-summary.test.mjs",
                  "crypto-csv-rescue/koinly-preflight/tests/preflight.test.mjs"):
            self.assertTrue((ROOT/p).is_file(),p)
        self.assertIn("python3 -m http.server 8765 --bind 127.0.0.1",TEXT)

    def test_one_original_owner_and_optin_customer_contact_only(self):
        self.assertIn("VM5 voluntary inquiry form",TEXT)
        self.assertIn("onecursor1@gmail.com",TEXT)
        self.assertIn("1FAIpQLSe_N8anCGUDmWdNZLnGwFRfhYaaCsB18BKdYd_VsFZp1xWm3g",TEXT)
        self.assertIn("seed phrases or OTPs",TEXT)
        self.assertIn("never place private financial CSV",TEXT)
        self.assertIn("does not sell rented raw CPU/GPU/VPS",TEXT)

if __name__=="__main__":
    unittest.main()
