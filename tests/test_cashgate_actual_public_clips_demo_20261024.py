"""CashGate public demonstration integrity and no-pretend-revenue tests."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import shutil
import subprocess
import unittest
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / "cashgate-demo"
URL = "https://livastic-vm3-primary-tmp-260920.github.io/cashgate-demo/"
CLIPS = "https://clips.agent-native.com/r/aIEjP8iNJ6VC"

class A(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.sources=[]
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if tag=="a":self.links.append(d.get("href"))
        if tag=="source":self.sources.append(d.get("src"))

class CashGatePublicActualDemoTests(unittest.TestCase):
    def test_real_recording_original_sha_duration_and_nonrevenue(self):
        manifest=json.loads((DEMO/"media-manifest.json").read_text())
        events=json.loads((DEMO/"provenance.json").read_text())
        video=DEMO/"demo.mp4"
        self.assertTrue(video.is_file())
        self.assertEqual(hashlib.sha256(video.read_bytes()).hexdigest(),manifest["video_original_sha256"])
        self.assertEqual(video.stat().st_size,manifest["video_size_bytes"])
        self.assertGreater(video.stat().st_size,500_000)
        self.assertLess(video.stat().st_size,10_000_000)
        self.assertEqual(manifest["wallet_transactions_signed"],0)
        self.assertTrue(manifest["actual_historic_blockchain_transfer_not_new_revenue"])
        self.assertEqual(manifest["new_revenue_during_demo_USDC"],"0.000000")
        self.assertFalse(manifest["public_application_deployment"])
        self.assertTrue(events["noWalletTransaction"])
        self.assertTrue(events["noNewSale"])
        self.assertTrue(events["usingHistoricalPublicReceiptOnly"])
        self.assertEqual(events["errors"],[])
        self.assertIn("Live original Aave x402",str(events["scenes"]))
        self.assertIn("Second live onchain X Layer",str(events["scenes"]))
        self.assertIn("Historic original BaseUSDC transfer",str(events["scenes"]))
        if shutil.which("ffprobe"):
            p=subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(video)],capture_output=True,text=True,timeout=10)
            self.assertEqual(p.returncode,0,p.stderr)
            self.assertGreater(float(p.stdout),66)
            self.assertLess(float(p.stdout),67)

    def test_public_site_no_secret_or_fake_transaction(self):
        body=(DEMO/"index.html").read_text()
        links=A();links.feed(body)
        self.assertEqual(links.sources,["./demo.mp4"])
        self.assertIn("./provenance.json",links.links)
        self.assertIn("./demo.mp4",links.links)
        self.assertIn("https://github.com/livastic-vm3-primary-tmp-260920/cashgate-x402-defi-evidence",links.links)
        self.assertIn("historical",body.lower())
        self.assertIn("not income created by this demo",body)
        self.assertNotIn("window.ethereum",body)
        self.assertNotIn("<script",body)
        self.assertNotIn("automated payout",body.lower())
        self.assertTrue((DEMO/"demo.en.srt").exists())

    def test_firstparty_owner_sitemap_root_and_clips_discovery(self):
        index=(ROOT/"index.html").read_text()
        llms=(ROOT/"llms.txt").read_text()
        readme=(ROOT/"README.md").read_text()
        urls=(ROOT/"urls.txt").read_text().splitlines()
        self.assertEqual(index.count('href="/cashgate-demo/"'),1)
        self.assertEqual(urls.count(URL),1)
        self.assertIn(URL,llms)
        self.assertIn(CLIPS,llms)
        self.assertIn(CLIPS,readme)
        xml=ET.parse(ROOT/"sitemap.xml")
        ns="{http://www.sitemaps.org/schemas/sitemap/0.9}"
        arr=[x.text for x in xml.findall(f"{ns}url/{ns}loc")]
        self.assertEqual(arr.count(URL),1)
        self.assertEqual(len(arr),len(set(arr)))

if __name__=="__main__": unittest.main()
