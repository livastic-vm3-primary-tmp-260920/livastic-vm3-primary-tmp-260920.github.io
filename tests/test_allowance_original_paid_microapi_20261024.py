"""One-owner Base Circle USDC allowance seller buyer guide: no custody, no invented sales.
Pure local static assertions. Network probes and wallet signing deliberately excluded.
"""
from html.parser import HTMLParser
from pathlib import Path
import unittest

BASE = Path(__file__).resolve().parents[1]
ROUTE = "https://vm5-openapi-x402.onrender.com/v1/base-usdc-allowance"
SAMPLE = ROUTE + "-sample"
PAYEE = "0x4e3106520E40af30870caFE78da1B1e7110eD98E"
TOKEN = "0x833589fCD6eDb6E08f4C7C32D4f71b54bdA02913"

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs=[]
        self.forms=0
        self.scripts=0
    def handle_starttag(self,tag,attrs):
        data=dict(attrs)
        if tag=="a":self.hrefs.append(data.get("href"))
        if tag=="form":self.forms+=1
        if tag=="script":self.scripts+=1

class OriginalLiveBaseUSDCAllowanceBuyerGuide(unittest.TestCase):
    def test_one_original_route_and_public_synthetic_sample(self):
        text=(BASE/"x402-live-api/index.html").read_text()
        parser=Links();parser.feed(text)
        self.assertEqual(parser.hrefs.count(ROUTE),1)
        self.assertEqual(parser.hrefs.count(SAMPLE),1)
        self.assertIn("0.010000 USDC / successful request",text)
        self.assertIn("10,000 atomic native Circle Base USDC",text)
        self.assertIn(PAYEE,text)
        self.assertIn(TOKEN,text)
        self.assertIn("allowance(owner, spender)",text)
        self.assertIn("balanceOf(owner)",text)
        self.assertIn("not an independently paid or verified customer sale",text.lower())
        self.assertEqual(parser.forms,0)
        self.assertEqual(parser.scripts,0)

    def test_one_human_owner_discovery_no_fake_sales(self):
        home=(BASE/"index.html").read_text()
        llms=(BASE/"llms.txt").read_text()
        page=(BASE/"x402-live-api/index.html").read_text()
        self.assertIn("Five buyer-verifiable Base USDC micro-APIs",home)
        self.assertIn("five free synthetic JSON previews",home)
        self.assertIn("## Five original same-owner live",llms)
        self.assertEqual(llms.count(ROUTE+" "),1)
        self.assertIn("five free synthetic previews",page)
        self.assertIn("Market402 free spec test passed 11/11",page)
        self.assertIn("qualified=false",llms)
        self.assertIn("no new independent paid buyer",llms)
        self.assertIn("No wallet connects here",page)
