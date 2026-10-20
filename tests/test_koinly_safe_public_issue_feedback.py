"""Source verification of public GitHub issue intake and privacy safeguards."""
from pathlib import Path
import unittest
import yaml

ROOT=Path(__file__).resolve().parents[1]
ISSUE=ROOT/".github/ISSUE_TEMPLATE/koinly-structural-feedback.yml"
README=(ROOT/"README.md").read_text("utf8")

class KoinlySafeIssueIntake(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config=yaml.safe_load(ISSUE.read_text("utf8"))
        cls.raw=ISSUE.read_text("utf8")

    def test_public_github_issue_form_is_valid_and_has_minimum_elements(self):
        self.assertTrue(self.config["name"].startswith("Koinly CSV format checker"))
        self.assertTrue(self.config["description"])
        self.assertTrue(self.config["title"].startswith("[Koinly format QA]"))
        items=self.config["body"]
        self.assertEqual([x["id"] for x in items if "id" in x],
                         ["template","problem","safe_summary","expected","classification","disclosure"])
        self.assertEqual(items[0]["type"],"markdown")
        self.assertGreaterEqual(len(items),7)

    def test_optional_note_cannot_be_demanded_as_real_financial_input(self):
        fields={x["id"]:x for x in self.config["body"] if "id" in x}
        self.assertEqual(fields["safe_summary"]["type"],"textarea")
        self.assertIs(fields["safe_summary"]["validations"]["required"],False)
        self.assertNotIn("file",str(fields["safe_summary"].get("type")).lower())
        for code in ("Universal","Simple","Trades"):
            self.assertIn(code,fields["template"]["attributes"]["options"])
        self.assertIn("Fully fictional/internal demonstration",fields["classification"]["attributes"]["options"][1])
        self.assertIn("outside user",fields["classification"]["attributes"]["options"][0])
        checks=fields["disclosure"]["attributes"]["options"]
        self.assertEqual(len(checks),2)
        self.assertTrue(all(c["required"] for c in checks))

    def test_privacy_and_no_fake_sales_or_tax_status_dominates(self):
        for phrase in ("Do NOT post or attach your original CSV","real transaction IDs",
                       "wallet", "tax", "public issue", "not a paid contract",
                       "not an authorized confidential data channel"):
            self.assertIn(phrase.lower(),self.raw.lower(),phrase)
        self.assertNotIn("secret access token:",self.raw.lower())
        self.assertNotIn("enter your payment address:",self.raw.lower())

    def test_readme_links_exact_original_public_form_and_rejects_synthetic_sales(self):
        path="https://github.com/livastic-vm3-primary-tmp-260920/livastic-vm3-primary-tmp-260920.github.io/issues/new?template=koinly-structural-feedback.yml"
        self.assertIn(path,README)
        self.assertIn("Only VM5 coordinates",README)
        self.assertIn("neither buyer orders",README)
        self.assertTrue(ISSUE.is_file())

if __name__=="__main__":
    unittest.main()
