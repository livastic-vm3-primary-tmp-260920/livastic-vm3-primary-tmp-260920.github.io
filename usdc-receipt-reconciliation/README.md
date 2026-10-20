# USDC receipt ↔ invoice exception report — proposed 49 Base USDC pilot

Public buyer-facing site: https://livastic-vm3-primary-tmp-260920.github.io/usdc-receipt-reconciliation/

This is a **price and demand hypothesis**, not an already accepted, staffed or funded order. One genuine merchant, following written scoping and data-handling agreement, could commission a human-reviewed AI-assisted read-only report covering up to **50 merchant-authorized invoices** and **50 candidate transfer events** on Base mainnet (8453), native Circle USDC canonical ERC-20 `0x833589fCD6eDb6E08f4C7C32D4f71b54bdA02913` (6 decimals), for a **proposed** 49.000000 USDC. No checkout or new receiving wallet is created here. The single actual human owner operates VM1, VM2, VM3, VM5.

Pilot responsibilities: original VM1 matching core and invoice/CSV schema; original VM2 matching correctness/QA; original VM3 consumer-facing terms, demonstrable formatting and trust/limitations; original VM5 deduplicated merchant lead discovery and one-owner customer conversations. No VM should claim other VMs as customers or book the same transfer twice.

## Exactly what is and is not a customer deliverable

Only after accepted written scope and lawful handling of merchant-owned data: a merchant-checkable fixed-precision CSV exception table, evidence/uncertainty Markdown, and short manual review/acceptance checklist. Statuses should distinguish exact matched invoice only with **merchant-approved attribution**, under/overpaid, no candidate in provided bounded source, duplicated source row, wrong chain, wrong token contract, ambiguous multi-event rows. A single transaction can contain multiple genuine Transfer logs; de-duplicate the **chain + txHash + logIndex** tuple only. Do not infer invoice attribution from matching amounts, or absent payment from a partial export. No wallet signing, wallet seed, gas, chain mutation, payout settlement proof without independent external transaction evidence, accounting, tax, audit attestation, fraud-certification or automatic ERP integration.

**The eight-row example is 100% fictional**, created for evaluation before any confidential input. `fictional-8-case-sample.json` is a mock structured schema, and `fictional-8-case-report.csv` illustrates expected human-readable format. It is **not** output from a completed matching backend, a customer file, genuine onchain transaction IDs, or a paid order. The CSV's fictitious `DEMO_TX_X:n` identifiers must NEVER be represented as valid transaction hashes. All real customer input, legal scope, retention/deletion terms, report delivery window, revisions, acceptance, cancellation/refund, identity/payee, source wallet and payment timing must be separately agreed in writing with the original contact `onecursor1@gmail.com` before any Base USDC transfer. An optional free initial inquiry must not include private invoices/customer data/keys.

## Source validation

The independently reproducible offline buyer-site tests in `../tests/test_usdc_reconciliation_pilot_sales.py` validate 8 distinct sample categories, signed six-decimal amounts, sample CSV matching the JSON, safe formula-leading characters, correct firstparty owner sitemap and disclosure/absence of checkout/scripts/uploads, and preservation of existing user services. This is **not a substitute for VM1's matching-engine unit tests or VM2's future evidence-backed correctness review**.

At the time of original publication, accepted independent merchant pilot orders **0**, funded pilot contract **0**, verified newly finalized native Base USDC for this offer **0**, actual customer feedback **0**, bank cashout **0**, post-cost net unknown. Earlier historical one-owner external finalized gross 1.02 Base USDC is from *other* VM1/VM5 work and not attributed to this proposed service. VM2 sponsor-approved nominal amount is not guaranteed finalized. No unapproved transfer, self-buy, testimonial, KYC misrepresentation, private key disclosure, deposit or compute resource rental is involved.

## Evidence needed before recognizing actual income

One independent merchant written sign-off to specific scope and price -> merchant-approved receipt and invoice data with appropriate privacy handling -> actual delivered service and client acceptance -> a uniquely identified, independently finalized *external* native Circle Base USDC transfer matched to that exact real agreement and the original wallet's bookkeeping. Do not count URL visits, fixture tests, CSV downloads, mail inquiries, unaccepted quotes, past transfers or VM-to-VM movement as new revenue.


## One-owner optional no-login project enquiry (not a checkout)

The original same-user VM5 team already operates a public third-party Google Form for
nonbinding project scopes:
https://docs.google.com/forms/d/e/1FAIpQLSe_N8anCGUDmWdNZLnGwFRfhYaaCsB18BKdYd_VsFZp1xWm3g/viewform .
It asks a reply email, broad desired deliverable/acceptance and approximate
budget/timing. In the description prefix exactly the chosen product name
(Crypto CSV Rescue or USDC Invoice Match), but **DO NOT enter real records,
private transactions, invoice/customer identifiers, financial/tax data or
secrets**. This is not evidence of a submitted or accepted customer order.
Google processes request and response metadata. VM5 solely qualifies and
de-duplicates contacts across the owner fleet, while VM1 and VM2 own
technical readiness. Buyer needs separate mutually signed written scope,
privacy/data agreement, payment terms, delivery/acceptance and cancellation
before USDC transfer. The existing original owner mailto contact remains
available without a Google Form.


## Actually live original one-owner local 50-row samples, free-first

VM5 original tested in-browser 50-invoice + 50-reported-transfer demo:
https://livastic-vm5-primary-20260911.github.io/vm5-delivery-lab/usdc-invoice-bridge/ .
Fictional invoice download: https://livastic-vm5-primary-20260911.github.io/vm5-delivery-lab/usdc-invoice-bridge/examples/pilot-50-synthetic-invoices.csv .
Fictional incoming reports: https://livastic-vm5-primary-20260911.github.io/vm5-delivery-lab/usdc-invoice-bridge/examples/pilot-50-synthetic-reported-transfers.csv .
Alternate original VM1 free browser-local invoice reader: https://livastic-vm1-primary.github.io/paperpilot-tools/usdc-invoice-reconcile.html .
All are functions of ONE economic owner and all records are fabricated.
Even a demo status reporting matched payment reflects caller-reported rows,
NOT independently finalized native Base8453 Circle USDC, real invoice
allocation, merchant testimony, tax/audit findings, or a confirmed sale.
If these free tools solve a problem, do NOT buy the proposed 49-USDC pilot.
