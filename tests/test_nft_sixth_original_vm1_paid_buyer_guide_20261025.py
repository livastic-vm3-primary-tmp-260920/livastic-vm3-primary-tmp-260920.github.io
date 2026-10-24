"""Original owner's six-item buyer marketplace page: NFT API truthful zero-custody and not fake earnings.
Pure offline static checks; no wallet access, marketplace mutations or chain API.
"""
from pathlib import Path
from html.parser import HTMLParser
import unittest

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/"x402-live-api/index.html"
PAID="https://vm5-openapi-x402.onrender.com/v1/nft-operator-calldata-preflight"
SAMPLE="https://vm5-openapi-x402.onrender.com/v1/nft-operator-calldata-sample"
OWNER="0x4e3106520E40af30870caFE78da1B1e7110eD98E"
CIRCLE="0x833589fCD6eDb6E08f4C7C32D4f71b54bdA02913"
SOURCE_PR="https://github.com/livastic-vm5-primary-20260911/x402-openapi-lint/pull/14"

class Collect(HTMLParser):
    def __init__(self):
        super().__init__();self.links=[];self.forms=0;self.scripts=0
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=="a" and d.get("href"):self.links.append(d["href"])
        if tag=="form":self.forms+=1
        if tag=="script":self.scripts+=1

class OriginalNftBuyerGuide(unittest.TestCase):
    def test_same_original_owner_existing_wallet_and_exact_nft_links(self):
        page=SITE.read_text()
        links=Collect();links.feed(page)
        self.assertEqual(links.links.count(PAID),1)
        self.assertEqual(links.links.count(SAMPLE),1)
        self.assertEqual(links.links.count(SOURCE_PR),1)
        self.assertIn(OWNER,page)
        self.assertIn(CIRCLE,page)
        self.assertIn("Six real deployed machine-readable products",page)
        self.assertIn("10,000 native Circle Base USDC atomic units",page)
        self.assertIn("0.010000 native Base Circle USDC",page)

    def test_real_scope_is_not_wallet_custody_or_a_fake_purchase(self):
        page=SITE.read_text()
        links=Collect();links.feed(page)
        self.assertEqual((links.forms,links.scripts),(0,0))
        for line in ["unsigned, public ERC-721 / ERC-1155","setApprovalForAll(address,bool)",
                     "only</strong> if the caller explicitly declares ERC-721",
                     "Nothing here signs, approves, revokes, transfers, connects to a wallet",
                     "Zero independent buyers or paid settlements yet verified",
                     "Market402 free 11/11 compliant listing queued",
                     "PayAPI Market listing pending review"]:
            self.assertIn(line,page)

    def test_discovery_points_to_six_distinct_direct_seller_routes_not_soul(self):
        homepage=(ROOT/"index.html").read_text()
        llms=(ROOT/"llms.txt").read_text()
        self.assertIn("Six buyer-verifiable Base USDC micro-APIs",homepage)
        self.assertIn("six free synthetic JSON previews",homepage)
        self.assertIn("## Six original same-owner live",llms)
        self.assertEqual(llms.count(PAID),1)
        self.assertEqual(llms.count(SAMPLE),1)
        self.assertIn("306/306 original local mocked middleware tests PASS",llms)
        self.assertIn("PENDING_REVIEW",llms)
        self.assertIn("No wallet connects here",SITE.read_text())

if __name__=="__main__":unittest.main()
