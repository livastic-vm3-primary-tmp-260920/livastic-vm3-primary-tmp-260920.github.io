"""Original 9-USDC agent-service buyer can audit fictional QA deliverable before paying."""
import hashlib,json,unittest
from pathlib import Path
from xml.etree import ElementTree
from html.parser import HTMLParser
P=Path(__file__).resolve().parents[1]
D=P/'crypto-csv-rescue/nado-closed-pnl'
EX='https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/nado-closed-pnl/buyer-qa-example.html'
class BuyerProofExampleTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.report=json.loads((D/'buyer-qa-example.json').read_text(encoding='utf8'))
  cls.page=(D/'buyer-qa-example.html').read_text(encoding='utf8')
  cls.entry=(D/'index.html').read_text(encoding='utf8')
  cls.fixture=(D/'synthetic-buyer-10rows.csv').read_bytes()
 def test_exact_fabricated_input_and_fixed_sha(self):
  d=self.report
  self.assertEqual(d['source']['inventedDataRows'],10)
  self.assertEqual(d['source']['sha256'],hashlib.sha256(self.fixture).hexdigest())
  self.assertEqual(d['source']['kind'],'ENTIRELY_INVENTED_FAKE_10_ROW_CSV_NOT_NATIVE_NADO')
  self.assertFalse(d['source']['actualCustomerDataUsed'])
  self.assertFalse(d['source']['actualNadoSourceSchemaValidated'])
  self.assertFalse(d['source']['actualKoinlyUploadOrImportTest'])
  self.assertEqual(len(self.fixture.decode().strip().splitlines()),11)
  self.assertIn('FAKE-PERP-008',self.fixture.decode())
 def test_three_visible_fail_closed_human_disposition_reasons(self):
  d=self.report['analysis']
  self.assertEqual(d['status'],'REJECT_FULL_INPUT')
  self.assertEqual(d['totalInputRows'],10)
  self.assertEqual(d['individuallySyntacticallyValidRows'],7)
  self.assertEqual(d['sourceRowsNeedingHumanResolution'],3)
  self.assertEqual([x['line'] for x in d['detectedIssues']],[9,10,11])
  self.assertEqual([x['code'] for x in d['detectedIssues']],[
   'INVALID_UTC_DATE','DUPLICATE_SOURCE_EVENT_REFERENCE','UNKNOWN_SETTLEMENT_ASSET'])
  self.assertFalse(d['automaticRowDropOrRepair'])
  self.assertFalse(d['fullCandidateCsvReleased'])
  for code in ('INVALID_UTC_DATE','DUPLICATE_SOURCE_EVENT_REFERENCE','UNKNOWN_SETTLEMENT_ASSET'):
   self.assertIn(code,self.page)
 def test_public_sample_has_no_paying_client_or_economic_falsehood(self):
  self.assertIn('NOT a paid customer delivery',self.page)
  self.assertIn('zero completed paid reports',self.page)
  self.assertIn('no guaranteed refund, escrow or immediate owner cashout',self.page)
  self.assertIn('every one of the 10 source records',self.page.lower())
  self.assertIn('Source/test files are openly inspectable',self.page)
  self.assertEqual(self.report['deliveryExample']['chargedNativeBaseCircleUSDC'],0)
  self.assertEqual(self.report['deliveryExample']['uniqueNewOnchainReceiptNativeBaseCircleUSDC'],0)
 def test_technical_content_discoverable_in_existing_original_free_page(self):
  self.assertEqual(self.entry.count('href="./buyer-qa-example.html"'),1)
  self.assertEqual(self.entry.count('href="./buyer-qa-example.json"'),1)
  self.assertEqual(self.entry.count('href="./synthetic-buyer-10rows.csv"'),1)
  self.assertIn('NOT actual Nado data, a completed paid order, or proof of receiving 9 USDC',self.entry)
  self.assertEqual(self.page.count('href="./buyer-qa-example.json"'),1)
  self.assertIn('href="./build-paid-qa-sample.mjs"',self.page)
  self.assertIn('href="./buyer-qa-example.test.mjs"',self.page)
 def test_headers_and_no_external_network_code_in_static_page(self):
  self.assertIn("connect-src 'none'",self.page)
  self.assertIn("form-action 'none'",self.page)
  self.assertNotIn('<script ',self.page)
  self.assertIn('rel="canonical" href="'+EX+'"',self.page)
  HTMLParser().feed(self.page)
  tree=ElementTree.parse(P/'sitemap.xml')
  locs=[x.text for x in tree.iter() if x.tag.endswith('loc')]
  self.assertEqual(locs.count(EX),1)
  self.assertIn(EX,(P/'llms.txt').read_text())
 def test_actual_store_link_carries_distinct_real_checkout_and_5usdc_option(self):
  self.assertIn('talktomyagent.dev/api/market/listings/lst_agt_mvhc997e_5j0oocaq',self.page)
  self.assertIn('livastic-vm1-primary.github.io/paperpilot-tools/contact.html?service=koinly-mini-5',self.page)
  self.assertIn('manual weekly seller payouts',self.page)
  self.assertIn('different 5-USDC header-only mini-review',self.page)
  self.assertEqual(self.report['safety']['walletAccess'],False)
if __name__=='__main__':unittest.main()
