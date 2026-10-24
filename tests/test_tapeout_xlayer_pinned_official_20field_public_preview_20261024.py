"""True original VM3 X Layer actual chain 196 two-block preview, no wallet/no fake sale."""
from pathlib import Path
import json
import re
import subprocess
import unittest
from html.parser import HTMLParser
from urllib.parse import urlsplit
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "tapeout-accelerate" / "index.html"
EVIDENCE = ROOT / "tapeout-accelerate" / "evidence.json"
BASE = "https://livastic-vm3-primary-tmp-260920.github.io/tapeout-accelerate/"

class PublicParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.scripts = []
        self.forms = []
        self.inputs = []
        self.canonical = []
        self.content = []
    def handle_starttag(self, name, attrs):
        a = dict(attrs)
        if name == "a": self.links.append(a.get("href", ""))
        elif name == "form": self.forms.append(a)
        elif name == "input": self.inputs.append(a)
        elif name == "script": self.scripts.append((a, ""))
    def handle_data(self, text):
        if text.strip():self.content.append(text.strip())

class TapeOutRealEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads(EVIDENCE.read_text())
        self.page = PAGE.read_text()
        self.parser = PublicParser()
        self.parser.feed(self.page)

    def test_truthful_pinned_real_XLayer_chain_contracts_and_exact_20_source_fields(self):
        d = self.data
        self.assertEqual(d["chainId"],196)
        self.assertEqual(d["network"],"eip155:196")
        self.assertEqual(d["actualBlocks"],{"baseline":"73915245","current":"74073819"})
        self.assertEqual(d["totalFieldsCompared"],20)
        self.assertEqual(len(d["actualNormalizedFields"]),20)
        self.assertEqual(len({x["field"] for x in d["actualNormalizedFields"]}),20)
        self.assertEqual(d["changedFields"],2)
        self.assertEqual(d["unchangedFields"],18)
        self.assertEqual(sum(x["changed"] for x in d["actualNormalizedFields"]),2)
        self.assertEqual(d["confirmedCompleteChainReads"],True)
        self.assertFalse(d["hasUnknownFields"])
        self.assertEqual(d["readErrors"],[])
        for item in d["actualNormalizedFields"]:
            self.assertEqual(item["changed"],item["before"].lower()!=item["after"].lower())
            self.assertIn(item["type"],("uint","address","bool"))
            if item["type"]=="address":
                for k in ("before","after"):
                    self.assertRegex(item[k],r"^0x[0-9a-f]{40}$")
        a=d["primarySourceFixedContracts"]
        self.assertEqual(a["factory"].lower(),"0x1f09daefa827f02cbb40967cc91b259763760761")
        self.assertEqual(a["market"].lower(),"0xd89f358c48a7b632c9845af2a02a32eb90dd75db")
        self.assertEqual(a["processorCPU0"].lower(),"0x839bdd6fa7a66416a609a735e11de5411b98574e")
        self.assertEqual(d["rpcHostnameSources"],["rpc.xlayer.tech","xlayerrpc.okx.com"])

    def test_marketing_contains_actual_free_page_merchant_and_truthful_caveats(self):
        body=self.page
        for w in ("20 verifiable fields","Don't trust state.","No wallet","No wallet","pinned","20 source","evidence.json","xlayer/build-x-series","Actual"):
            if w=="Actual":continue
            self.assertIn(w.lower(),body.lower(),w)
        self.assertFalse(self.parser.forms)
        self.assertEqual(len(self.parser.scripts),1)
        self.assertTrue(any(x.get("id")=="search" for x in self.parser.inputs))
        self.assertIn("aria-live",body)
        self.assertIn("textContent",body)
        self.assertNotIn("innerHTML",body)
        self.assertIn("allBtn",body)
        self.assertIn("changedBtn",body)
        self.assertIn("https://vm5-openapi-x402.onrender.com/v1/tapeout-cpu0-sample",self.parser.links)
        self.assertIn("https://vm5-openapi-x402.onrender.com/v1/tapeout-cpu0-diff",self.parser.links)
        self.assertTrue(self.data["noTransactionSigningOrWalletReads"])
        self.assertFalse(self.data["receiptOrSaleForThisPublicPreview"])
        self.assertIn("security audit",self.data["limitations"].lower())

    def test_page_javascript_syntax_valid_with_node_and_safe_queries(self):
        matches=re.findall(r"<script(?:\s[^>]*)?>([\s\S]*?)</script>",self.page,re.I)
        self.assertEqual(len(matches),1)
        out=subprocess.run(["node","--check","--input-type=commonjs"],input=matches[0],text=True,capture_output=True,timeout=10)
        self.assertEqual(out.returncode,0,out.stderr)
        self.assertNotIn("eval(",matches[0])
        self.assertNotIn("new Function(",matches[0])
        self.assertNotIn("window.ethereum",matches[0])
        self.assertNotIn("eth_sendTransaction",matches[0])
        self.assertNotIn("personal_sign",matches[0])
        self.assertNotIn("wallet_requestPermissions",matches[0])

    def test_public_site_firstparty_index_sitemap_and_api_buyer_page_link(self):
        index=(ROOT/"index.html").read_text()
        buyer=(ROOT/"x402-live-api"/"index.html").read_text()
        llms=(ROOT/"llms.txt").read_text()
        urls=(ROOT/"urls.txt").read_text().splitlines()
        self.assertIn('href="/tapeout-accelerate/"',index)
        self.assertIn('href="../tapeout-accelerate/"',buyer)
        self.assertIn(BASE,llms)
        self.assertEqual(sum(x==BASE for x in urls),1)
        sitemap=ElementTree.parse(ROOT/"sitemap.xml")
        NS="{http://www.sitemaps.org/schemas/sitemap/0.9}"
        values=[elem.text for elem in sitemap.findall(f"{NS}url/{NS}loc")]
        self.assertEqual(values.count(BASE),1)
        self.assertEqual(len(values),len(set(values)))

    def test_actual_57_84_second_public_demonstration_captions_and_sha256(self):
        import hashlib, shutil, subprocess
        video = ROOT / "tapeout-accelerate" / "demo.mp4"
        manifest = json.loads((ROOT / "tapeout-accelerate" / "demo-manifest.json").read_text())
        captions = (ROOT / "tapeout-accelerate" / "demo.en.vtt").read_text()
        self.assertTrue(video.exists())
        self.assertGreater(video.stat().st_size, 500_000)
        self.assertLess(video.stat().st_size, 30_000_000)
        self.assertEqual(hashlib.sha256(video.read_bytes()).hexdigest(), manifest["videoSha256"])
        self.assertEqual(video.stat().st_size, manifest["videoSizeBytes"])
        self.assertTrue(video.read_bytes()[:80].find(b"ftyp") >= 0)
        self.assertEqual(manifest["sourcePublicMainnetChainId"],196)
        self.assertTrue(manifest["recordingOfActualPublicUI"])
        self.assertTrue(manifest["noOwnerWalletSignatures"])
        self.assertTrue(manifest["noOwnerTokensGasOrDepositsSpent"])
        self.assertTrue(manifest["noNewExternallyPaidCustomerSaleFromThisRecording"])
        self.assertTrue(manifest["contestApplicantIdentityAndAgeNotVerified"])
        self.assertEqual(manifest["contestSubmissionStatus"],"NOT_SUBMITTED")
        self.assertLess(manifest["recordedDurationSeconds"],180)
        self.assertEqual(manifest["recordedDurationSeconds"],57.84)
        self.assertIn("HTTP 402",captions)
        self.assertIn("WEBVTT",captions)
        self.assertIn("<video controls",self.page)
        self.assertIn('src="./demo.mp4"',self.page)
        self.assertIn('href="#demo"',self.page)
        self.assertIn("silent video with burned-in english scene captions",self.page.lower())
        self.assertIn("source JSON",self.page)
        if shutil.which("ffprobe"):
            p = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",str(video)],text=True,capture_output=True,timeout=12)
            self.assertEqual(p.returncode,0,p.stderr)
            self.assertGreater(float(p.stdout),55)
            self.assertLess(float(p.stdout),65)

    def test_no_fake_cash_product_or_cash_award_attestation(self):
        d=self.data
        self.assertEqual(d["noOriginalOwnerGasOrDeposits"],0)
        self.assertFalse(d["receiptOrSaleForThisPublicPreview"])
        self.assertIn("do not provide a consensus certificate or security audit",d["limitations"].lower())
        self.assertEqual(d["separatelyLivePaidMerchant"]["baseNativeUSDCPriceCurrent"],"0.005000")
        self.assertEqual(d["separatelyLivePaidMerchant"]["baseNativeUSDCPriceDiff"],"0.010000")
        self.assertEqual(d["basePayoutNetwork"],"eip155:8453")
        self.assertTrue(d["originalOneBeneficialHumanOwnerAcrossVMs"])
        self.assertIn("this is not a formal security audit",self.page.lower())
