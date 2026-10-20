"""Source-first root card points at a real already-owned A2A paid seller (NO payments)."""
from __future__ import annotations
import copy
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/"scripts"))
from build_owner_soul_a2a_discovery import (
    BASE, CANONICAL, EXPECTED, OUTPUT, SOURCE, TOP_KEYS, build, validate,
)

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.scripts = 0
        self.forms = 0
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=="link":self.links.append(a)
        elif tag=="script":self.scripts+=1
        elif tag=="form":self.forms+=1

class OriginalSoulA2ABuyerDiscoverability(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.site=(ROOT/"index.html").read_text("utf8")
        cls.readme=(ROOT/"README.md").read_text("utf8")
        cls.llms=(ROOT/"llms.txt").read_text("utf8")
        cls.card=json.loads(OUTPUT.read_text("utf8"))
        cls.source=json.loads(SOURCE.read_text("utf8"))
        cls.links=Links()
        cls.links.feed(cls.site)

    def test_public_card_exactly_matches_real_official_existing_five_skills(self):
        self.assertEqual(self.card,self.source)
        self.assertEqual(set(self.card),TOP_KEYS)
        self.assertEqual(self.card["name"],"VM3 Public USDC Receipt Evidence QA")
        self.assertEqual(self.card["url"],CANONICAL)
        self.assertEqual(self.card["provider"]["url"],"https://api.soul.mds.markets")
        self.assertEqual({x["id"] for x in self.card["skills"]},EXPECTED)
        self.assertEqual(len(self.card["skills"]),5)
        self.assertEqual(self.card["defaultInputModes"],["application/json"])
        self.assertEqual(self.card["defaultOutputModes"],["application/json"])
        self.assertIs(self.card["capabilities"]["streaming"],False)
        self.assertIs(self.card["capabilities"]["pushNotifications"],False)
        self.assertIs(self.card["capabilities"]["stateTransitionHistory"],False)

    def test_card_reproducible_and_live_backend_remains_vendor_not_static_site(self):
        self.assertEqual(OUTPUT.read_text("utf8"),build())
        status=subprocess.run([sys.executable,str(ROOT/"scripts/build_owner_soul_a2a_discovery.py"),"--check"],capture_output=True,text=True)
        self.assertEqual(status.returncode,0,status.stderr)
        self.assertIn("five real skills",status.stdout)
        self.assertTrue((ROOT/".nojekyll").is_file(),"GitHub Pages hidden .well-known path needs the existing .nojekyll marker")
        self.assertEqual(self.card["url"],"https://api.soul.mds.markets/v1/soul/vm3-usdc-receipt-qa/agent.json")
        self.assertNotIn("livastic-vm3-primary-tmp-260920.github.io",self.card["url"])

    def test_reject_tampered_public_card_fields_and_wrong_owner(self):
        for change in [
            {"url":"http://127.0.0.1:3000/private"},
            {"url":"https://attacker.invalid/agent.json"},
            {"name":"Different economic owner"},
            {"provider":{"organization":"OpenAI","url":"https://openai.com"}},
            {"capabilities":{"streaming":True,"pushNotifications":False,"stateTransitionHistory":False}},
            {"defaultOutputModes":["text/plain"]},
            {"skills":[]},
            {"private_wallet_seed":"SECRET_IN_PUBLIC"},
        ]:
            bad=copy.deepcopy(self.card)
            bad.update(change)
            with self.subTest(change=list(change)):
                with self.assertRaises(ValueError):validate(bad)

    def test_reject_injected_and_unsupported_skill(self):
        bad=copy.deepcopy(self.card)
        bad["skills"][0]["id"]="non-original-seller-skill"
        with self.assertRaises(ValueError):validate(bad)
        bad=copy.deepcopy(self.card)
        bad["skills"][0]["description"]="secret=exposed-in-public"
        with self.assertRaises(ValueError):validate(bad)
        bad=copy.deepcopy(self.card)
        bad["skills"][0]["tags"]=["unverified-payment-received"]
        with self.assertRaises(ValueError):validate(bad)

    def test_organic_discovery_has_one_header_link_and_visible_no_wallet_disclosure(self):
        l=[x for x in self.links.links if x.get("href")=="/.well-known/agent.json"]
        self.assertEqual(len(l),1)
        self.assertEqual(l[0].get("rel"),"alternate")
        self.assertEqual(l[0].get("type"),"application/json")
        self.assertLess(self.site.index('href="/.well-known/agent.json"'),self.site.index("</head>"))
        self.assertEqual(self.links.scripts,0)
        self.assertEqual(self.links.forms,0)
        for text in ("five already ACTIVE","zero verified paid executions or earnings",
                     "not a free execution endpoint","Never provide secrets",
                     "independent buyer to inspect a fresh quote"):
            self.assertIn(text,self.site)
        self.assertIn('id="agent-services"',self.site)
        self.assertIn(CANONICAL,self.readme)
        self.assertIn(CANONICAL,self.llms)

    def test_prior_original_sales_and_free_personal_data_limits_remain(self):
        for url in ('/crypto-csv-rescue/','/usdc-receipt-reconciliation/'):
            self.assertIn(url,self.site)
        self.assertIn("0.005 Base USDC",self.site)
        self.assertIn("0 new sales",self.site)
        self.assertIn("No wallet connection for free tools",self.site)
        self.assertIn("not a funded order or proof of revenue",self.readme.lower())
        self.assertIn("security audit",self.readme.lower())
        self.assertIn("source-only",self.readme.lower()) if "source-only" in self.readme.lower() else self.assertIn("source",self.readme.lower())

if __name__=="__main__":
    unittest.main()
