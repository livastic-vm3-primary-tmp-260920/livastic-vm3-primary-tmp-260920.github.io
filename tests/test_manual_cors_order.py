"""No-wallet, written-consent manual USDC pilot landing assertions; synthetic example only."""
import pathlib
import unittest
import json
import sys
from html.parser import HTMLParser

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from create_root_sitemap import PREFIX, parse_paths, to_xml

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.headings=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=="a":self.links.append(a.get("href",""))
        if tag in {"h1","h2","h3"}:self.headings.append(tag)

class OriginalManualCORSOrderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html=(ROOT/"x402-cors-qa-order/index.html").read_text("utf8")
        cls.sample=json.loads((ROOT/"x402-cors-qa-order/synthetic-example-report.json").read_text("utf8"))
        cls.readme=(ROOT/"x402-cors-qa-order/README.md").read_text("utf8")
        cls.home=(ROOT/"index.html").read_text("utf8")
        cls.llms=(ROOT/"llms.txt").read_text("utf8")
        cls.sitemap=(ROOT/"sitemap.xml").read_bytes()
        cls.urls=parse_paths((ROOT/"urls.txt").read_text("utf8"))
        cls.tags=Links()
        cls.tags.feed(cls.html)

    def test_public_manual_offer_routable_from_owner_home(self):
        self.assertIn('href="/x402-cors-qa-order/"',self.home)
        self.assertIn(PREFIX+"x402-cors-qa-order/",self.urls)
        self.assertIn(PREFIX+"x402-cors-qa-order/",self.llms)
        self.assertEqual(self.sitemap,to_xml(self.urls))
        self.assertEqual(len(self.urls),17)

    def test_buyer_pays_only_after_individual_written_scope(self):
        for term in ["15 native Base USDC","written acceptance","Do not send any USDC before that confirmation","unique invoice reference","refund","one authorized, public","not an invoice"]:
            self.assertIn(term.lower(),self.html.lower())
        self.assertIn('mailto:onecursor1@gmail.com?',self.html)
        self.assertNotIn('href="https://paypal.com/',self.html)

    def test_exact_canonical_usdc_not_vague_or_private_wallet(self):
        self.assertIn('chain ID 8453',self.html)
        self.assertIn('0x833589fCD6eDb6E08f4C7C32D4f71b54bdA02913',self.html)
        # No VM1 MetaMask address; existing VM5 payout is confirmed with buyer only after agreement.
        self.assertNotIn('0x4e3106520E40af30870caFE78da1B1e7110eD98E',self.html)
        self.assertNotIn('0x6b01efa0705e91a7aca54271510bf9e594717f34',self.html)
        self.assertIn('verify the signed-off seller recipient',self.html)

    def test_independent_offer_and_no_customer_fake_claim(self):
        for term in ['fully fictional','same person','zero verified external paid customers',
                     '$1.50','signed checkout','no fake clients']:
            # "no fake clients" belongs to page metadata
            self.assertIn(term.lower(),self.html.lower())
        self.assertFalse(self.sample['isRealThirdPartyCase'])
        self.assertFalse(self.sample['isCustomerTestimonial'])
        self.assertFalse(self.sample['isPaidOrder'])
        self.assertTrue(self.sample['simulationOnly'])

    def test_real_offline_synthetic_sample_has_non_secret_failures(self):
        r=self.sample['report']
        self.assertEqual(r['overall'],'BLOCKED')
        self.assertEqual(r['blockers'],2)
        self.assertEqual(r['warnings'],2)
        self.assertGreaterEqual(len(r['checks']),10)
        self.assertNotIn('DELIBERATELY-INVENTED-UNSIGNED-PLACEHOLDER',json.dumps(self.sample))
        self.assertTrue(self.sample['observedHeaderValuesRedacted'])

    def test_no_wallet_script_customer_storage_or_unapproved_form_endpoint(self):
        for bad in ['<script','window.ethereum','eth_sendTransaction','ethereum.request',
                    'localStorage','sessionStorage','fetch(','XMLHttpRequest','google-analytics','<iframe',
                    'password','api_key','recovery phrase is']:
            if bad=='password':
                # The disclosure warns about credentials without collecting them.
                continue
            self.assertNotIn(bad,self.html)
        self.assertIn("default-src 'none'",self.html)
        self.assertIn("form-action https://formsubmit.co",self.html)
        self.assertEqual(self.html.count('<form action="https://formsubmit.co/onecursor1@gmail.com" method="POST"'),1)
        self.assertNotIn('<form action="http://',self.html)
        self.assertEqual(self.html.count('<h1 '),1)
        self.assertGreaterEqual(len(self.tags.links),10)

    def test_no_login_form_requires_consent_and_cannot_collect_files_or_secrets(self):
        for snippet in [
            'name="public_sanitized_problem" maxlength="500" required',
            'name="willingness_to_pay_usdc" required',
            'name="only_public_sanitized_data_and_third_party_processing_acknowledged" value="yes" required',
            'independent FormSubmit service',
            'for up to 30 days',
            'reCAPTCHA may be required',
            'Form activation not yet confirmed',
            'not purchases, paid orders',
            'value="feedback_only_no_order"',
            'value="please_reply_with_written_15_usdc_scope_only"',
        ]:self.assertIn(snippet,self.html)
        self.assertNotIn('type="file"',self.html)
        self.assertNotIn('name="password"',self.html)
        self.assertNotIn('name="wallet"',self.html)
        self.assertNotIn('name="authorization"',self.html)
        self.assertNotIn('_captcha" value="false"',self.html)
        self.assertEqual(self.html.count('action="https://formsubmit.co/onecursor1@gmail.com"'),1)

    def test_redirect_explains_it_is_not_contract_or_cash(self):
        text=(ROOT/"x402-cors-qa-order/thanks.html").read_text('utf8')
        self.assertIn('noindex,follow',text)
        self.assertIn('not',text.lower())
        self.assertIn('not</strong> proof',text)
        self.assertIn('Do <strong>not</strong> transfer USDC',text)
        self.assertNotIn('<script',text)

    def test_free_buyer_value_and_own_provider_kept_separate(self):
        self.assertIn('/x402-smokecheck/',self.tags.links)
        self.assertIn('/defi-payment-proof-qa/services/x402-cors-remedy-150-usdc.html',self.tags.links)
        self.assertIn('synthetic-example-report.json',self.tags.links)
        self.assertIn('disclosed AI-assisted',self.html)
        self.assertIn('No automatic wallet signing/payment',self.llms)

if __name__=="__main__":
    unittest.main()
