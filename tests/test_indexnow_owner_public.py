"""IndexNow public HTTP proof file only; search submission separate and not guaranteed indexing."""
import pathlib,re,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class PublicIndexNowKey(unittest.TestCase):
 def test_one_public_owner_host_key_for_root(self):
  f=[x for x in ROOT.glob('*.txt') if re.fullmatch(r'[a-f0-9]{32}\.txt',x.name)]
  self.assertEqual(len(f),1)
  self.assertEqual(f[0].read_text().strip(),f[0].stem)
  self.assertRegex(f[0].stem,r'^[a-f0-9]{32}$')
 def test_buyer_sitemap_contains_one_manual_qa_page(self):
  urls=(ROOT/'urls.txt').read_text().splitlines()
  self.assertEqual(sum(x.endswith('/x402-cors-qa-order/') for x in urls),1)
  self.assertEqual(sum(x.endswith('/x402-smokecheck/') for x in urls),1)
 def test_manual_qa_page_no_key_crosslink_or_browser_credential_use(self):
  text=(ROOT/'x402-cors-qa-order/index.html').read_text()
  f=[x for x in ROOT.glob('*.txt') if re.fullmatch(r'[a-f0-9]{32}\.txt',x.name)]
  self.assertNotIn(f[0].stem,text)
  self.assertNotIn('window.ethereum',text)
  self.assertNotIn('eth_sendTransaction',text)
