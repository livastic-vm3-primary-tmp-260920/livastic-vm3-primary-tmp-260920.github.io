"""User-facing link to previously deployed same-beneficial-owner real $0.005 DNS checkout.

Never claims a real mainnet buyer or signs a USDC transaction.
"""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
URL="https://livastic-vm5-primary-20260911.github.io/base-usdc-csv-checkout/email-dns.html"

class H(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.forms=0
        self.scripts=0
    def handle_starttag(self,tag,attrs):
        if tag=="a":self.links.append(dict(attrs).get("href",""))
        if tag=="form":self.forms+=1
        if tag=="script":self.scripts+=1

class RealPublishedVm5OneOwnerDnsBuyerLink(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.home=(ROOT/"index.html").read_text("utf8")
        cls.catalog=(ROOT/"llms.txt").read_text("utf8")
        cls.tags=H();cls.tags.feed(cls.home)

    def test_exact_existing_owner_reused_not_duplicate_new_seller(self):
        self.assertEqual(self.tags.links.count(URL),1)
        self.assertEqual(self.catalog.count(URL),1)
        self.assertIn("already published VM5 product",self.home)
        self.assertIn("not a new VM3 merchant",self.home)
        self.assertIn("one genuine human owner",self.catalog)

    def test_dns_buyer_scope_is_real_0p005_correct_network(self):
        for term in ("0.005 native Base USDC","5,000 atomic native Circle Base USDC","chain 8453",
                     "publicly deployed human checkout","genuine unsigned HTTP 402 price quote"):
            self.assertIn(term,self.home)
        self.assertIn("0.005 USDC",self.catalog)
        self.assertIn("HTTP402",self.catalog)

    def test_free_first_buyer_can_avoid_spending(self):
        self.assertIn("free wholly fictional example",self.home)
        self.assertIn("invented sample",self.home)
        self.assertIn("optional public DNS preview are free",self.home)
        self.assertIn("No automatic payment",self.home)
        self.assertIn("buyer must choose and confirm their own compatible wallet",self.home)

    def test_no_fake_checkout_completion_or_independent_buyer_claims(self):
        self.assertIn("no independent outside human has yet completed",self.home.lower())
        self.assertIn("NO actual independent buyer's real funded signed wallet checkout",self.catalog)
        self.assertIn("not a real mailbox deliverability guarantee",self.home.lower())
        self.assertNotIn("All 0.005-USDC buyers paid successfully",self.home)
        self.assertNotIn("100% guaranteed",self.home)

    def test_no_cross_vm_raw_data_wallet_signing_embedded(self):
        self.assertEqual(self.tags.forms,0)
        self.assertEqual(self.tags.scripts,0)
        for needle in ("window.ethereum","sendTransaction(","ethereum.request","fetch(",
                       "localStorage","<input","<iframe","<form","walletConnect"):
            self.assertNotIn(needle,self.home)
        self.assertIn("default-src 'none'",self.home)
        self.assertIn("form-action 'none'",self.home)

    def test_prior_two_49_product_pages_and_services_unchanged(self):
        self.assertIn('id="csv-rescue49"',self.home)
        self.assertIn('id="recon49"',self.home)
        self.assertIn('id="paid"',self.home)
        self.assertIn('id="cors-paid"',self.home)
        self.assertIn('id="agent-services"',self.home)
        self.assertLess(self.home.index('id="paid"'),self.home.index('id="dns-micro-buyer"'))
        self.assertLess(self.home.index('id="dns-micro-buyer"'),self.home.index('id="cors-paid"'))

if __name__=="__main__":
    unittest.main()
