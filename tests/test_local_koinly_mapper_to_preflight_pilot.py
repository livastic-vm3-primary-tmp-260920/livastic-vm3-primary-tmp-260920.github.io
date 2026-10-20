"""Free two-stage map→format-check Koinly buyer journey uses existing distinct SAME-OWNER tools, no upload."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]
MAPPER="https://livastic-vm1-primary.github.io/paperpilot-tools/koinly-column-mapper.html"
PREFLIGHT="/crypto-csv-rescue/koinly-preflight/"
KOINLY_OFFICIAL="https://support.koinly.io/en/articles/9489976-how-to-create-a-custom-csv-file-with-your-data"

class Links(HTMLParser):
    def __init__(self):
        super().__init__();self.links=[];self.form_count=0;self.scripts=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=="a":self.links.append(d.get("href",""))
        if tag=="form":self.form_count+=1
        if tag=="script":self.scripts.append(d.get("src",""))

class TwoStageKoinlyBuyerWorkflows(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages={
            "check":(ROOT/"crypto-csv-rescue/koinly-preflight/index.html").read_text("utf8"),
            "offer":(ROOT/"crypto-csv-rescue/index.html").read_text("utf8"),
            "root":(ROOT/"index.html").read_text("utf8")
        }
        cls.p={key:Links() for key in cls.pages}
        for k in cls.pages:cls.p[k].feed(cls.pages[k])
        cls.llms=(ROOT/"llms.txt").read_text("utf8")
        cls.docs={
            "check":(ROOT/"crypto-csv-rescue/koinly-preflight/README.md").read_text("utf8"),
            "offer":(ROOT/"crypto-csv-rescue/README.md").read_text("utf8")
        }

    def test_working_existing_vm1_free_mapper_in_each_relevant_original_page(self):
        self.assertEqual(self.p["root"].links.count(MAPPER),1)
        self.assertEqual(self.p["check"].links.count(MAPPER),2)
        self.assertEqual(self.p["offer"].links.count(MAPPER),2)
        for k in self.pages:
            self.assertIn(MAPPER,self.pages[k])
        self.assertIn(MAPPER,self.llms)
        for k in self.docs:self.assertIn(MAPPER,self.docs[k])

    def test_firstparty_checker_link_explains_explicit_local_file_hand_off(self):
        self.assertEqual(self.p["offer"].links.count(PREFLIGHT),4)
        self.assertIn('id="two-free-koinly-steps"',self.pages["offer"])
        self.assertIn('id="map-first"',self.pages["check"])
        self.assertIn('href="#check-title"',self.pages["check"])
        self.assertLess(self.pages["offer"].index('id="two-free-koinly-steps"'),self.pages["offer"].index('id="koinly-template-preflight"'))
        self.assertLess(self.pages["check"].index('id="map-first"'),self.pages["check"].index('id="check-title"'))
        self.assertIn("downloaded candidate",self.pages["check"].lower())
        self.assertIn("your own file chooser",self.docs["check"])
        self.assertIn("no cross-site browser storage",self.docs["check"].lower())

    def test_data_rights_and_vendor_supported_source_not_rewritten_blindly(self):
        self.assertIn("First check the exchange's native Koinly integration",self.pages["check"])
        self.assertIn("keep your original transaction export unchanged",self.pages["offer"].lower())
        self.assertIn("VM1 mapper requires actual customer-chosen exact field mapping",self.llms)
        self.assertIn("original UTC source verification",self.llms)
        self.assertIn("Koinly acceptance is still unverified",self.pages["check"])
        self.assertIn(KOINLY_OFFICIAL,self.pages["offer"])
        self.assertIn("tax",self.pages["offer"].lower())

    def test_zero_cost_option_is_explicit_and_49USDC_is_optional_manual_work(self):
        self.assertIn("pay 0 USDC",self.pages["check"])
        self.assertIn("no reason to buy",self.pages["offer"].lower()) if "no reason to buy" in self.pages["offer"].lower() else self.assertIn("cost0",self.llms)
        self.assertIn("49-native-Base-USDC",self.pages["check"])
        self.assertIn("49.000000 native Circle USDC",self.pages["offer"])
        self.assertIn("no actual independent customer",self.pages["offer"].lower()) if "no actual independent customer" in self.pages["offer"].lower() else self.assertIn("No independent customer has agreed",self.pages["offer"])
        self.assertIn("No customer",self.llms) if "No customer" in self.llms else self.assertIn("buy paid",self.llms)

    def test_no_secret_wallet_files_or_network_tracker_added_by_crosslinks(self):
        for k in self.pages:
            self.assertEqual(self.p[k].form_count,0)
            self.assertNotIn("window.ethereum",self.pages[k])
            self.assertNotIn("sendTransaction(",self.pages[k])
            self.assertNotIn("localStorage",self.pages[k])
            self.assertNotIn('type="file" name=',self.pages[k])
            self.assertIn("default-src 'none'",self.pages[k])
        self.assertEqual(self.p["check"].scripts,["./app.mjs"])
        self.assertIn("connect-src 'none'",self.pages["check"])
        self.assertIn("does not",self.pages["check"].lower())
        self.assertIn("No automatic",self.pages["check"]) if "No automatic" in self.pages["check"] else self.assertIn("No USDC charge",self.pages["check"]) if "No USDC charge" in self.pages["check"] else self.assertIn("No wallet",self.pages["check"])

    def test_no_new_real_buyer_revenue_or_independent_firm_claim(self):
        self.assertIn("SAME beneficial economic owner",self.llms) if "SAME beneficial economic owner" in self.llms else self.assertIn("SAME beneficial",self.llms)
        self.assertIn("same human economic owner",self.pages["check"])
        self.assertIn("not independent vendor certifications",self.pages["check"])
        self.assertIn("If free checks suffice, cost0",self.llms)
        self.assertIn("one permitted unresolved defect",self.pages["offer"])
        self.assertIn("not a payment",self.pages["offer"].lower()) if "not a payment" in self.pages["offer"].lower() else self.assertIn("proposed",self.pages["offer"])

if __name__=="__main__":
    unittest.main()
