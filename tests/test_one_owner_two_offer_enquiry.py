"""One beneficial owner's existing, public, third-party enquiry URL on two safe pilots."""
from pathlib import Path
from html.parser import HTMLParser
import unittest

ROOT=Path(__file__).resolve().parents[1]
GOOGLE="https://docs.google.com/forms/d/e/1FAIpQLSe_N8anCGUDmWdNZLnGwFRfhYaaCsB18BKdYd_VsFZp1xWm3g/viewform"

class Tags(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.forms=0
        self.scripts=0
    def handle_starttag(self, tag, attrs):
        if tag=="a":self.links.append(dict(attrs).get("href",""))
        if tag=="form":self.forms+=1
        if tag=="script":self.scripts+=1

class OneOwnerBuyerEnquiryTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages={}
        cls.parsers={}
        for label,path in {
            "home":ROOT/"index.html",
            "csv":ROOT/"crypto-csv-rescue/index.html",
            "merchant":ROOT/"usdc-receipt-reconciliation/index.html"
        }.items():
            source=path.read_text("utf8")
            parser=Tags()
            parser.feed(source)
            cls.pages[label]=source
            cls.parsers[label]=parser
        cls.llms=(ROOT/"llms.txt").read_text("utf8")
        cls.docs=[
            (ROOT/"crypto-csv-rescue/README.md").read_text("utf8"),
            (ROOT/"usdc-receipt-reconciliation/README.md").read_text("utf8"),
        ]

    def test_same_existing_external_form_exactly_once_in_three_public_pages(self):
        from scripts.owner_buyer_intent_prefill import prefilled_url
        # The home page keeps the generic original form; each product page routes
        # to that SAME one-beneficial-owner form with only a product label.
        for label in self.pages:
            with self.subTest(label=label):
                dest = GOOGLE if label=="home" else prefilled_url("crypto" if label=="csv" else label)
                self.assertEqual(self.parsers[label].links.count(dest),1)
                self.assertNotIn("formsubmit.co",self.pages[label])
                self.assertEqual(self.parsers[label].forms,0)
                self.assertEqual(self.parsers[label].scripts,0)
                self.assertIn("default-src 'none'",self.pages[label])
                self.assertIn("form-action 'none'",self.pages[label])
        self.assertIn(GOOGLE,self.llms)

    def test_original_genuine_written_contact_retained_in_both_markets(self):
        for label in ("csv","merchant"):
            p=self.pages[label]
            self.assertTrue(any(h.startswith("mailto:onecursor1@gmail.com?") for h in self.parsers[label].links))
            self.assertIn("49.000000 native Circle USDC",p)
            self.assertIn("not a booking",p)
            self.assertIn("written agreement",p)
            self.assertIn("VM5",p)
            self.assertIn("Google",p)
            self.assertIn("a reply email is required",p)
            self.assertNotIn("walletConnect",p)
            self.assertNotIn("sendTransaction(",p)

    def test_contact_intent_split_unambiguously_for_single_owner_queue(self):
        from scripts.owner_buyer_intent_prefill import DESCRIPTIONS
        self.assertIn("Crypto CSV Rescue / 49-USDC sample pilot",DESCRIPTIONS["crypto"])
        self.assertIn("USDC Invoice Match / 49-USDC pilot",DESCRIPTIONS["merchant"])
        self.assertIn("Crypto CSV Rescue",self.pages["home"])
        self.assertIn("USDC Invoice Match",self.pages["home"])
        self.assertIn("same human owner's VM5",self.pages["merchant"])
        self.assertIn("same-owner VM5",self.pages["csv"])
        self.assertIn("one real owner",self.pages["home"].lower())
        self.assertIn("VM5",self.llms)

    def test_public_form_asks_no_private_csv_or_onchain_spend(self):
        for label,p in self.pages.items():
            self.assertIn("private",p.lower())
            if label in ("csv","merchant"):
                self.assertIn("no",p.lower())
                self.assertIn("separate written agreement",p)
            self.assertNotIn('type="file"',p)
            self.assertNotIn('window.ethereum',p)
        self.assertIn("Google processes browser and response data",self.pages["home"])
        for doc in self.docs:
            self.assertIn(GOOGLE,doc)
            self.assertIn("not evidence of a submitted or accepted customer order",doc.lower())
            self.assertIn("DO NOT enter real records",doc)

    def test_prefilled_product_category_does_not_impersonate_a_customer(self):
        from scripts.owner_buyer_intent_prefill import (
            BASE, CONTACT_FIELD, BUDGET_FIELD, DESCRIPTION_FIELD,
            DESCRIPTIONS, prefilled_url,
        )
        from urllib.parse import urlsplit, parse_qs
        self.assertEqual(BASE, GOOGLE)
        self.assertEqual(self.parsers["home"].links.count(GOOGLE),1)
        for label in ("csv","merchant"):
            with self.subTest(label=label):
                url=prefilled_url("crypto" if label=="csv" else label)
                parts=urlsplit(url)
                self.assertEqual(parts.scheme,"https")
                self.assertEqual(parts.hostname,"docs.google.com")
                self.assertEqual(parts.path,urlsplit(GOOGLE).path)
                fields=parse_qs(parts.query)
                self.assertEqual(fields["usp"],["pp_url"])
                self.assertEqual(fields[DESCRIPTION_FIELD],[DESCRIPTIONS["crypto" if label=="csv" else label]])
                self.assertNotIn(CONTACT_FIELD,fields)
                self.assertNotIn(BUDGET_FIELD,fields)
                self.assertEqual(self.parsers[label].links.count(url),1)
                self.assertIn("PLEASE REPLACE THIS TEMPLATE",DESCRIPTIONS["crypto" if label=="csv" else label])
                self.assertIn("Do NOT submit this unchanged",DESCRIPTIONS["crypto" if label=="csv" else label])
                self.assertNotIn("my API key",url)
                self.assertNotIn("0x833589",url)
                self.assertIn("not your stated budget",self.pages[label])
                self.assertIn("before submitting",self.pages[label])
        self.assertIn("same-owner VM5",self.pages["csv"])
        self.assertIn("same human owner's VM5",self.pages["merchant"])

    def test_not_sneakily_treated_as_two_paid_services_sales(self):
        self.assertIn("no real customer report was delivered",self.pages["csv"].lower())
        self.assertIn("no revenue from this offer is claimed",self.pages["merchant"].lower())
        self.assertIn("not a paid order",self.pages["home"].lower())
        self.assertIn("actual received",self.pages["home"].lower()) if "actual received" in self.pages["home"].lower() else self.assertIn("not evidence",self.pages["home"].lower())

if __name__=="__main__":
    unittest.main()
