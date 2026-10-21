"""Safety: voluntary shared diagnostic never includes buyer's raw crypto data."""
from pathlib import Path
from html.parser import HTMLParser
import unittest

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"crypto-csv-rescue/koinly-preflight"

class UIBits(HTMLParser):
    def __init__(self):
        super().__init__();self.inputs=[];self.buttons=[];self.scripts=[];self.forms=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="textarea":self.inputs.append(a)
        if tag=="button":self.buttons.append(a)
        if tag=="script":self.scripts.append(a)
        if tag=="form":self.forms+=1

class OriginalLocalSafeFeedbackTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html=(BASE/"index.html").read_text("utf8")
        cls.app=(BASE/"app.mjs").read_text("utf8")
        cls.ticket=(BASE/"safe-summary.mjs").read_text("utf8")
        cls.tests=(BASE/"safe-summary.test.mjs").read_text("utf8")
        cls.manual=(BASE/"README.md").read_text("utf8")
        cls.parser=UIBits();cls.parser.feed(cls.html)

    def test_one_own_locally_reviewable_readonly_redacted_summary(self):
        self.assertEqual(len([i for i in self.parser.inputs if i.get("id")=="safe-summary"]),1)
        self.assertIn("readonly",next(i for i in self.parser.inputs if i.get("id")=="safe-summary"))
        self.assertEqual(len([i for i in self.parser.buttons if i.get("id")=="select-safe-summary"]),1)
        self.assertIn("disabled",[i for i in self.parser.buttons if i.get("id")=="select-safe-summary"][0])
        self.assertIn('type="button" disabled>Select safe summary',self.html)
        self.assertIn("Ctrl+C / Copy",self.html)
        self.assertIn('aria-live="polite"',self.html)
        self.assertEqual(self.parser.forms,0)
        self.assertEqual(self.parser.scripts,[{"type":"module","src":"./app.mjs"},{"type":"module","src":"./header-drift-app.mjs"}])
        self.assertIn("connect-src 'none'",self.html)
        self.assertIn("form-action 'none'",self.html)

    def test_no_automatic_customer_contact_or_clipboard_permission(self):
        self.assertIn("safeNode.value = ticket",self.app)
        self.assertIn('selectSafeNode.addEventListener("click"',self.app)
        self.assertIn("safeNode.select()",self.app)
        self.assertIn("clearSafeSummary()",self.app)
        self.assertIn("makeSafeSummary(result)",self.app)
        for banned in ("fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket",
                       "navigator.clipboard", "localStorage","sessionStorage",
                       "window.ethereum","eth_sendTransaction", "console.log",
                       "innerHTML", "f.name", "file.name"):
            self.assertNotIn(banned,self.app,banned)
        self.assertEqual(self.parser.forms,0)
        self.assertNotIn("formsubmit.co",self.html)

    def test_export_uses_strict_firstparty_constants_never_raw_cells_or_headers(self):
        self.assertIn("const CODES = new Set",self.ticket)
        self.assertIn("const FIELDS = new Set",self.ticket)
        self.assertIn("MAX_SHARED_ISSUES = 25",self.ticket)
        self.assertIn("MAX_SUMMARY_CHARS = 3500",self.ticket)
        self.assertIn("strictSafeIssue",self.ticket)
        self.assertIn("originalValuesExposed !== false",self.ticket)
        self.assertIn("sourceFileUploaded !== false",self.ticket)
        self.assertIn("networkRequests !== 0",self.ticket)
        self.assertIn("NO_SAFE_LOCAL_DIAGNOSTIC",self.ticket)
        self.assertIn("malicious fields/codes/wallet strings cannot leak",self.tests)
        self.assertIn("Do not include CSV rows, file names, wallet addresses or tax IDs.",self.ticket)
        self.assertNotIn("issue.message",self.ticket)
        self.assertNotIn("issue.raw",self.ticket)
        self.assertNotIn("result.sourceFileName",self.ticket)
        self.assertNotIn("result.sourceFileContents",self.ticket)

    def test_paid_consultation_still_optional_firstparty_only_and_unsettled(self):
        self.assertIn("Generating or selecting text does",self.html)
        self.assertIn("not",self.html)
        self.assertIn("does not",self.html)
        self.assertIn("No quoted 49-USDC pilot is booked or paid",self.ticket)
        self.assertIn("unvalidated",self.manual.lower())
        self.assertIn("49 native Circle Base8453 USDC",self.manual)
        self.assertIn("same-owner VM5",self.html)
        self.assertIn("No actual",self.manual) if "No actual" in self.manual else self.assertIn("No test submits",self.manual)

if __name__=="__main__":
    unittest.main()
