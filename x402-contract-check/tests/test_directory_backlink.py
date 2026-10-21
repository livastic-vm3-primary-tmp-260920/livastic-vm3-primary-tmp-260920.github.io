from pathlib import Path
import unittest
from html.parser import HTMLParser
BASE=Path(__file__).resolve().parents[2]
class P(HTMLParser):pass
class T(unittest.TestCase):
 def test_one_honest_free_directory_footer_link(self):
  s=(BASE/'x402-contract-check/index.html').read_text()
  self.assertEqual(s.count('href="https://twelve.tools/"'),1)
  self.assertIn('Browse developer tools at Twelve Tools',s)
  self.assertNotIn('As seen on Twelve Tools',s)
  self.assertIn('id="paid-micro-qa"',s)
  self.assertIn("connect-src 'none'",s)
  P().feed(s)
if __name__=='__main__':unittest.main()
