"""Original VM3 first-party honest conversion to existing VM5 $19 FIXED Clawlancer micro, no self-buys."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
URL="https://clawlancer.ai/marketplace/a06039e5-cab4-4f8c-ae16-03a2c713abd9"
ISSUER="0x833589fCD6eDb6E08f4C7C32D4f71b54bdA02913"

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs=[]
        self.buttons=0
        self.forms=0
    def handle_starttag(self,tag,attrs):
        props=dict(attrs)
        if tag=="a":self.hrefs.append(props.get("href",""))
        if tag=="button":self.buttons+=1
        if tag=="form":self.forms+=1

class OneOwnerAlreadyListed19BaseUSDCTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.merchant=(ROOT/"usdc-receipt-reconciliation/index.html").read_text("utf8")
        cls.home=(ROOT/"index.html").read_text("utf8")
        cls.llms=(ROOT/"llms.txt").read_text("utf8")
        cls.readme=(ROOT/"usdc-receipt-reconciliation/README.md").read_text("utf8")
        cls.h1=Links();cls.h1.feed(cls.merchant)
        cls.h2=Links();cls.h2.feed(cls.home)

    def test_existing_vm5_fixed_listing_reused_exactly_once_not_new_checkout(self):
        self.assertEqual(self.h1.hrefs.count(URL),1)
        self.assertEqual(self.h2.hrefs.count(URL),1)
        self.assertIn(URL,self.llms)
        self.assertIn(URL,self.readme)
        self.assertIn("listing_type=FIXED",self.llms)
        self.assertIn("times_purchased=0",self.llms)
        self.assertIn("zero confirmed purchases",self.merchant.lower())
        self.assertIn('id="mini19"',self.merchant)
        self.assertEqual(self.merchant.count('id="mini19"'),1)

    def test_small_and_large_scope_cannot_be_sold_as_same_job(self):
        for value in ("19.000000 native Circle USDC on Base","20 invented invoice rows",
                      "20 invented reported token-transfer rows","one limited correction round",
                      "49-USDC / up-to-50-invoice and 50-event"):
            self.assertIn(value,self.merchant)
        self.assertIn("49.000000 native Circle USDC on Base",self.merchant)
        self.assertIn("one agreed artificial, nonsecret CSV header schema",self.merchant)
        self.assertIn("synthetic-only SKU",self.merchant)
        self.assertIn("19,000,000 atomic native",self.readme)
        self.assertIn("<=50-invoice",self.readme)

    def test_ui_platform_mismatch_is_disclosed_without_fake_buyer_or_escrow(self):
        for term in ("bounty amount","open for claims","fixed","not",
                     "zero confirmed purchases","unauthenticated page",
                     "not verified","never send tokens","buyer may need"):
            self.assertIn(term.lower(),self.merchant.lower())
        self.assertIn("FIXED",self.llms)
        self.assertIn("not an independent buyer",self.readme.lower())
        self.assertNotIn("guaranteed marketplace checkout",self.merchant.lower())
        self.assertNotIn("sold 1 copy",self.merchant.lower())

    def test_original_free_first_before_smaller_existing_listing(self):
        self.assertIn('id="try-free"',self.merchant)
        self.assertLess(self.merchant.index('id="try-free"'),self.merchant.index('id="mini19"'))
        self.assertLess(self.merchant.index('id="mini19"'),self.merchant.index('id="scope"'))
        self.assertIn("do not buy",self.merchant.lower())
        self.assertIn("No USDC payment",self.merchant)
        self.assertIn("up-to-50 TRUE authorized",self.llms)

    def test_no_wallet_signature_new_receiver_or_private_invoice_upload(self):
        self.assertEqual(self.h1.forms,0)
        self.assertEqual(self.h2.forms,0)
        for bad in ('window.ethereum','sendTransaction(', 'localStorage', 'fetch(',
                    'WalletConnect','<input type="file"','checkout.stripe.com'):
            self.assertNotIn(bad,self.merchant)
        self.assertIn("native Circle USDC",self.merchant)
        self.assertIn(ISSUER,self.merchant)
        self.assertIn("No wallet connection",self.merchant)
        self.assertIn("separate written agreement",self.merchant)
        self.assertIn("no actual customer",self.merchant.lower()) if "no actual customer" in self.merchant.lower() else self.assertIn("not",self.merchant.lower())

    def test_49_proposed_original_email_and_client_intake_are_preserved(self):
        self.assertTrue(any(u.startswith("mailto:onecursor1@gmail.com?") for u in self.h1.hrefs))
        self.assertTrue(any(u.startswith("https://docs.google.com/forms/d/e/1FAIpQLSe_N8anCG") for u in self.h1.hrefs))
        self.assertIn("onecursor1@gmail.com",self.merchant)
        self.assertIn("Do not transfer USDC before written agreement",self.merchant)
        self.assertIn("No independent merchant has yet accepted this 49-USDC proposal",self.merchant)

if __name__=="__main__":
    unittest.main()
