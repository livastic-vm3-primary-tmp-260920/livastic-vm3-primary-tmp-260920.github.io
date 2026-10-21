"""Same owner historical real XNO earn proof is attributed, not a Nado buyer."""
import unittest
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
class RealSponsorProofTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.html=(ROOT/'crypto-csv-rescue/nado-closed-pnl/index.html').read_text()
  cls.llms=(ROOT/'llms.txt').read_text()
 def test_one_independent_upstream_merged_pr_link(self):
  self.assertEqual(self.html.count('id="verified-external-code-reward"'),1)
  self.assertEqual(self.html.count('href="https://github.com/pursekeeper/api/pull/94"'),1)
  self.assertEqual(self.html.count('href="https://livastic-vm1-primary.github.io/case-studies/pursekeeper-nano-lock-bounty-5xno.html"'),1)
 def test_nano_is_not_base_usdc_customer_or_paid_qa(self):
  for text in ['5 Nano (XNO)','same one beneficial human owner','NOT</strong> a Nado/Koinly customer',
               'not booked again here','zero independently verified paying clients, orders, deliverables or settled USDC',
               'NOT a VM3 Nado/Koinly paying client','This optional 5/9/19 native Base Circle USDC QA funnel']:
   self.assertTrue(text in self.html or text in self.llms,text)
  self.assertIn('Nano wallet access/backup is unrelated to this service',self.html)
  self.assertNotIn('Paid Nado customer testimonial',self.html)
 def test_accounting_and_product_discovery_unchanged(self):
  self.assertIn('id="small-paid-qa"',self.html)
  self.assertIn('id="agent-paid-9usdc"',self.html)
  self.assertIn('id="optional-support"',self.html)
  self.assertIn("connect-src 'none'",self.html)
  self.assertIn('5 XNO Nano mainnet',self.llms)
  self.assertIn('already earned once, NOT new revenue today',self.llms)
  HTMLParser().feed(self.html)
