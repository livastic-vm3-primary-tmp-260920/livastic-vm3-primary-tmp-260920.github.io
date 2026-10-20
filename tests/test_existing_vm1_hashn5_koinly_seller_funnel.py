"""One-owner real registered HashN mini Koinly contact offer, never counted as a sale."""
from pathlib import Path
from html.parser import HTMLParser
import unittest

ROOT=Path(__file__).resolve().parents[1]
HASHN="https://hashn.com/store/886ed287-aaca-434b-9f27-560a50bfbbb6/listings/koinly-csv-one-source-mapping-mini-review-5usdc.md"

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.forms=0
        self.scripts=0
    def handle_starttag(self,tag,attrs):
        if tag=="a":self.links.append(dict(attrs).get("href",""))
        if tag=="form":self.forms+=1
        if tag=="script":self.scripts+=1

class OneOwnerRealListedSmallPaidScope(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages={
            "home":(ROOT/"index.html").read_text("utf8"),
            "sale":(ROOT/"crypto-csv-rescue/index.html").read_text("utf8"),
            "check":(ROOT/"crypto-csv-rescue/koinly-preflight/index.html").read_text("utf8"),
        }
        cls.tag={}
        for name,page in cls.pages.items():
            c=Links()
            c.feed(page)
            cls.tag[name]=c
        cls.llms=(ROOT/"llms.txt").read_text("utf8")
        cls.docs=[
            (ROOT/"crypto-csv-rescue/README.md").read_text("utf8"),
            (ROOT/"crypto-csv-rescue/koinly-preflight/README.md").read_text("utf8"),
        ]

    def test_original_same_owner_live_listing_has_exact_url_once_each(self):
        for label in ("home","sale","check"):
            self.assertEqual(self.tag[label].links.count(HASHN),1,label)
        self.assertEqual(self.llms.count(HASHN),1)
        for doc in self.docs:
            self.assertEqual(doc.count(HASHN),1)

    def test_sale_scope_small_not_same_as_extended_pilot(self):
        s=self.pages["sale"]
        self.assertIn('id="mini5"',s)
        self.assertEqual(s.count('id="mini5"'),1)
        self.assertIn("5.000000 native Circle Base USDC",s)
        self.assertIn("10 lawfully buyer-authorized",s)
        self.assertIn("from ONE source",s)
        self.assertIn("49 native Base USDC",s)
        self.assertIn("50 redacted rows from at most two original exports",s)
        self.assertIn("at most TEN sample rows",self.llms)

    def test_hashn_contact_only_no_escrow_or_fake_paid_purchase(self):
        for s in self.pages.values():
            self.assertIn("HashN",s)
        s=self.pages["sale"]
        for snippet in (
            "does not hold money or offer escrow",
            "not an instant protected checkout",
            "zero newly confirmed purchases",
            "a different prior job",
            "neither is a completed or funded outside customer order",
        ):
            self.assertIn(snippet,s.lower())
        self.assertIn("does NOT custody money or provide escrow",self.llms)
        self.assertIn("No independent new buyer",self.llms)

    def test_free_value_precedes_paid_small_scope_in_buyer_path(self):
        s=self.pages["sale"]
        self.assertLess(s.index('id="try-free"'),s.index('id="mini5"'))
        self.assertLess(s.index('id="mini5"'),s.index('id="scope"'))
        self.assertIn("If the free workflow answers your question",s)
        self.assertIn("spend nothing",s)
        self.assertIn("10 lawfully buyer-authorized",s)
        self.assertIn("/crypto-csv-rescue/koinly-preflight/",self.tag["sale"].links)

    def test_local_checker_remains_unpaid_and_manual_no_auto_checkout(self):
        s=self.pages["check"]
        self.assertIn('id="mini5"',s)
        self.assertIn("5-USDC / up-to-10-redacted-row",s)
        self.assertIn("contact listing only",s)
        self.assertIn("HashN holds no buyer funds or escrow",s)
        self.assertIn("no outside buyer has paid",s.lower())
        self.assertIn("CSP",self.docs[1])

    def test_no_new_user_csv_collection_wallet_connect_or_unsigned_purchase(self):
        for label,p in self.pages.items():
            t=self.tag[label]
            self.assertEqual(t.forms,0)
            if label != "check":
                self.assertEqual(t.scripts,0)
            for forbidden in ("window.ethereum","sendTransaction(", "Web3Provider",
                              "checkout.stripe.com","formsubmit.co",
                              "payment-signature:"):
                self.assertNotIn(forbidden,p)
            self.assertIn("form-action 'none'",p)
        self.assertIn("No private transaction CSV in public contact",self.pages["sale"])

    def test_same_owner_not_a_second_revenue_stream_booked_without_external_deal(self):
        s=self.llms
        self.assertIn("same ONE economic owner",s) if "same ONE economic owner" in s else self.assertIn("ONE economic owner",s)
        self.assertIn("not a confirmed customer/contract/checkout",self.docs[0])
        self.assertIn("No independent new buyer",s)
        self.assertIn("never self-purchase",s.lower())
        self.assertIn("old",self.docs[1].lower()) if "old" in self.docs[1].lower() else self.assertIn("historical reputation",self.docs[1])

if __name__=="__main__":
    unittest.main()
