"""Third-party A2A directory indexing is discoverability, never real payment proof."""
import pathlib,unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
INDEX=(ROOT/'index.html').read_text('utf8')
README=(ROOT/'README.md').read_text('utf8')
LLMS=(ROOT/'llms.txt').read_text('utf8')
LINK='https://www.a2a-registry.org/agent/io.github.vm3_public_usdc_receipt_evidence_qa'
ID='ac27d81a-1267-4f19-a991-cb24b90e79ae'

class A2AExternalDirectoryTruth(unittest.TestCase):
    def test_one_exact_original_external_listing_on_site_and_docs(self):
        self.assertEqual(INDEX.count('href="'+LINK+'"'),1)
        self.assertEqual(README.count(LINK),1)
        self.assertEqual(LLMS.count(LINK),1)
        for x in (INDEX,README,LLMS):
            self.assertIn(ID,x)
            self.assertIn('UNCLAIMED',x)

    def test_do_not_mark_unverified_directory_record_as_checkout_or_customer(self):
        self.assertIn('identity not yet verified',INDEX)
        self.assertIn('not a paying customer',INDEX)
        self.assertIn('not a verified owner badge',README)
        self.assertIn('not a sixth SKU',README)
        self.assertIn('does not certify',INDEX)
        self.assertIn('original provider',INDEX)
        self.assertIn('five original skills',README)
        self.assertIn('buyer',INDEX.lower())
        self.assertIn('seller',README.lower())

    def test_existing_real_public_provider_and_original_no_wallet_controls_remain(self):
        self.assertIn('https://api.soul.mds.markets/v1/soul/vm3-usdc-receipt-qa',INDEX)
        self.assertIn('/.well-known/agent.json',INDEX)
        self.assertIn('No wallet connection for free tools',INDEX)
        self.assertIn('crypto-csv-rescue/',INDEX)
        self.assertIn('usdc-receipt-reconciliation/',INDEX)
        self.assertIn('current price',INDEX)
        self.assertNotIn('registrar verified payments',INDEX)
        self.assertNotIn('5 new external paying customers',INDEX)

if __name__=='__main__':unittest.main()
