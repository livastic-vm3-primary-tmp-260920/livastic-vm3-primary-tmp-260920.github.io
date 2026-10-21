"""Regression: a real paid QA buyer must describe a genuine failure; boilerplate must not satisfy required problem field."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,parse_qs
import unittest

PAGE=Path(__file__).resolve().parents[1]/"x402-har-diagnostic/index.html"
PATH="/forms/d/e/1FAIpQLSe_N8anCGUDmWdNZLnGwFRfhYaaCsB18BKdYd_VsFZp1xWm3g/viewform"

class Reader(HTMLParser):
 def __init__(self):
  super().__init__(); self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag=="a":
   self.links.append(dict(attrs))

class GenuineProblemIntakeTests(unittest.TestCase):
 def test_two_real_buyer_ctas_prefill_budget_not_required_failure(self):
  raw=PAGE.read_text()
  reader=Reader(); reader.feed(raw)
  links=[x for x in reader.links if x.get("href","").startswith("https://docs.google.com/forms")]
  self.assertEqual(len(links),2)
  for price,link in zip((5,19),links):
   url=urlsplit(link["href"])
   self.assertEqual(url.scheme,"https")
   self.assertEqual(url.netloc,"docs.google.com")
   self.assertEqual(url.path,PATH)
   values=parse_qs(url.query)
   self.assertEqual(values.get("usp"),["pp_url"])
   # Verified public Google Form: budget/timeline = optional entry.326068836;
   # mandatory real buyer problem = entry.1765055758, contact = entry.967471981.
   self.assertNotIn("entry.1765055758",values)
   self.assertNotIn("entry.967471981",values)
   self.assertIn("entry.326068836",values)
   self.assertEqual(len(values["entry.326068836"]),1)
   intent=values["entry.326068836"][0]
   self.assertIn("VM3 x402",intent)
   self.assertIn(str(price),intent)
   self.assertIn("Circle Base USDC",intent)
   self.assertIn("timeline by agreement",intent)
   self.assertEqual(link["target"],"_blank")
   self.assertIn("noopener",link["rel"])
  self.assertIn("describe your actual browser failure",raw)
  self.assertIn("a prefilled product name alone is not a valid problem description",raw)
  self.assertNotIn('type="email"',raw)
  self.assertNotIn('sendTransaction(',raw)

if __name__=="__main__":
 unittest.main()
