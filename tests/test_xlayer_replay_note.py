"""Offline proof-page integrity checks; no wallet, RPC, credentials or payment."""
from pathlib import Path
from html.parser import HTMLParser
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "tapeout-accelerate"

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.hrefs.append(dict(attrs).get("href", ""))

class XLayerReplayDocumentationTests(unittest.TestCase):
    def test_attested_read_only_two_changed_fields_match_pinned_evidence(self):
        data = json.loads((ARTIFACT / "evidence.json").read_text())
        doc = (ARTIFACT / "REPRODUCE.md").read_text()
        self.assertEqual(data["chainId"], 196)
        self.assertEqual(data["actualBlocks"], {"baseline": "73915245", "current": "74073819"})
        self.assertEqual(data["changedFields"], 2)
        changed = {f["field"]: f for f in data["actualNormalizedFields"] if f["changed"]}
        self.assertEqual(set(changed), {"factory.cpuCount", "factory.implementation"})
        for block in ("73915245", "74073819"):
            self.assertIn(block, doc)
        for field in changed.values():
            self.assertIn(field["before"], doc)
            self.assertIn(field["after"], doc)
        self.assertIn("eth_getStorageAt", doc)
        self.assertIn("eth_call", doc)
        self.assertIn("HTTP 403", doc)
        self.assertIn("not", doc.lower())
        self.assertNotIn("eth_sendTransaction", doc)
        self.assertNotIn("personal_sign", doc)

    def test_public_page_links_one_reproduction_document(self):
        page = (ARTIFACT / "index.html").read_text()
        links = Links()
        links.feed(page)
        self.assertEqual(links.hrefs.count("./REPRODUCE.md"), 1)
        self.assertGreaterEqual(links.hrefs.count("./evidence.json"), 1)

if __name__ == "__main__":
    unittest.main()
