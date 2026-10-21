"""Ensure actual independent firstparty TTMA buy-path is disclosed safely."""
import json
import unittest
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/'crypto-csv-rescue/nado-closed-pnl'
LISTING='lst_agt_mvhc997e_5j0oocaq'
AGENT='agt_onecursor_defi_csv_qa_11702cd7'
URL='https://talktomyagent.dev/api/market/listings/'+LISTING
class TTMAOriginalAgentListingTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.manifest=json.loads((DIR/'agent-offer.json').read_text())
  cls.page=(DIR/'index.html').read_text()
 def test_exactly_one_real_public_x402_9usdc(self):
  d=self.manifest
  self.assertEqual(d['seller']['agentId'],AGENT)
  self.assertTrue(d['seller']['oneUltimateHumanOwner'])
  self.assertTrue(d['seller']['aiAssisted'])
  self.assertEqual(d['product']['readOnlyPublicListingGET'],URL)
  self.assertEqual(d['product']['listingId'],LISTING)
  self.assertEqual(d['product']['priceAtomicUSDC'],'9000000')
  self.assertEqual(d['product']['priceNativeCircleBaseUSDC'],'9.000000')
  self.assertEqual(d['product']['chainId'],8453)
  self.assertEqual(d['product']['nativeUSDCContract'].lower(),'0x833589fcd6edb6e08f4c7c32d4f71b54bda02913')
  self.assertEqual(d['product']['checkoutRail'],'x402')
  self.assertFalse(d['product']['testOnly'])
  self.assertEqual(d['product']['serviceQuantityConcurrent'],1)
 def test_buy_payment_is_to_platform_not_seller(self):
  s=self.manifest['settlement']
  self.assertIn('TalkToMyAgent',s['buyerPays'])
  self.assertIn('NOT the original VM5 gratuity address',s['buyerPays'])
  self.assertEqual(s['feeBps'],200)
  self.assertEqual(s['minimumPayoutUSDC'],5)
  self.assertIn('8.82',s['netToSellerIfOne9USDCOrderPaid'])
  self.assertIn('NOT final wallet cash',s['netToSellerIfOne9USDCOrderPaid'])
  self.assertFalse(s['escrow'])
  self.assertFalse(s['refundGuaranteed'])
  self.assertFalse(s['immediateSellerReceipt'])
  self.assertFalse(s['userWalletAutoSigning'])
  self.assertFalse(s['userFundsSpentBySeller'])
 def test_no_fake_client_and_no_customer_private_data(self):
  self.assertEqual(self.manifest['revenue']['independentPaidBuyersAtPublication'],0)
  self.assertEqual(self.manifest['revenue']['ownerFinalNativeCircleBaseUSDCReceivedFromThisListing'],0)
  self.assertTrue(self.manifest['revenue']['publicationIsNotOrder'])
  self.assertIn('Never send actual transactions',self.page)
  self.assertIn('up to 10 completely fictional example rows',self.page)
  self.assertEqual(self.manifest['product']['publicOrEntirelyFictionalRowsMax'],10)
  self.assertIn('unsupported source semantics',self.page)
  self.assertIn("connect-src 'none'",self.page)
 def test_frontend_links_and_accompanying_original_free_case(self):
  self.assertEqual(self.page.count('id="agent-paid-9usdc"'),1)
  self.assertEqual(self.page.count('href="'+URL+'"'),1)
  self.assertEqual(self.page.count('href="./agent-offer.json"'),1)
  self.assertIn('id="small-paid-qa"',self.page)
  self.assertIn('5-USDC header-only mini-review',self.page)
  self.assertIn('buy at most one service',self.page.lower())
  HTMLParser().feed(self.page)
 def test_agent_manifest_has_not_leaked_seller_api_key(self):
  whole=json.dumps(self.manifest)+self.page
  for bad in ['apiKey','privateKey','Bearer ', 'PRIVATE KEY','BEGIN RSA','X-API-Key','localStorage','eth_requestAccounts','sendTransaction(']:
   self.assertNotIn(bad,whole)
  self.assertIn('officialBuyerQuoteURL',self.manifest['product'])
  self.assertEqual(self.manifest['product']['officialBuyerQuoteMethod'],'POST')
  self.assertEqual(self.manifest['product']['officialBuyerQuoteURL'],
   'https://talktomyagent.dev/api/x402/buy/'+LISTING)
 def test_original_site_discovery_cites_public_actual_one_owner(self):
  s=(ROOT/'llms.txt').read_text()
  self.assertEqual(s.count('## Original VM3 actually-buyable agent 9 Base-USDC Koinly technical QA'),1)
  self.assertIn(URL,s)
  self.assertIn('agent-offer.json',s)
  self.assertIn('one source issue',s)
  self.assertIn('different narrower VM1',s)
if __name__=='__main__':unittest.main()
