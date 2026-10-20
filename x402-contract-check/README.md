# x402 Contract Reality Check — free, no-wallet, locally executed

Original production URL: https://livastic-vm3-primary-tmp-260920.github.io/x402-contract-check/

Original software by One Cursor, AI-assisted, one real human beneficial owner. This is a developer PREPAY PUBLIC-DATA inspector, not an x402 Foundation product, financial or security advice, a live merchant audit, real paid response verification or transaction service. Publishing does not imply any customer has bought it.

## The real problem

Some clients parse v2 PaymentRequired only from a JSON 402 BODY, overlooking the public PAYMENT-REQUIRED HTTP header. Similarly, v2 uses accepts[*].amount (atomic units) and a CAIP-2 network while v1 may carry maxAmountRequired, older network identifiers and outputSchema under accepts. The new v2 Bazaar metadata lives under extensions.bazaar, whose JSON Schema describes the INFO metadata structure, not necessarily all ACTUAL PAID API response fields, errors or guarantees.

Independent external observations (NOT buyers or endorsements):
- https://dev.to/noboru/x402-market-measured-what-is-being-sold-at-what-price-and-where-the-gaps-are-2p0b
- https://dev.to/innerozma/i-asked-1000-x402-endpoints-to-sell-me-something-207-never-quoted-a-price-kh6

Authoritative standards:
- https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md
- https://github.com/x402-foundation/x402/blob/main/specs/extensions/bazaar.md

## Free browser instructions

1. Choose an included FICTIONAL x402 v1 or v2 example.
2. Alternatively, paste ONLY public unsigned PaymentRequired JSON or the PUBLIC base64 PAYMENT-REQUIRED header value, never full HTTP responses, access credentials, authorization, buyer PaymentPayload, wallet keys or other sensitive user data.
3. Click Inspect to obtain static explanatory diagnostic CODES; no pasted source text, payee, wallet address or secrets are shown or exported.
4. Optionally save redacted JSON. For one separate limited PUBLIC endpoint data QA project, the original owner may provide an INDICATIVE fixed 19 native Base Circle USDC technical QA quote, only after the customer and provider agree written scope, acceptance, delivery and refund/payment terms. A quote inquiry does NOT charge the user.

No login, wallet, transaction, network fetch/RPC, file upload, cookies, localStorage, analytics, merchant HTTP probe, web hook, private session or recurring server. Production Content Security Policy sets connect-src none.

We DO NOT verify actual merchant identity, response JSON schema, funded escrow, ability to complete a payment, authorization, liveness, risk, taxes, legal compliance, return on investment or chargebacks. No PASS in this local tool means a buyer should pay.

Source input is capped at 24k characters and rejects forbidden secret/signature field names, pathologial depth and excess array sizes. Only when network is Base mainnet eip155:8453 and the asset contract exactly native Circle USDC 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 is the first acceptance atomic amount rendered as six-decimal token units; no fiat valuation is invented.

## Test offline

Requires Node 22+ for JavaScript tests, Python 3.9+ for static site tests. No npm install, external packages or secrets.

    node --test x402-contract-check/tests/*.test.mjs
    python3 -m unittest discover -s x402-contract-check/tests -p 'test_*.py'
    python3 -m http.server 8128
    # Visit http://localhost:8128/x402-contract-check/

The client is two tiny modules: check.mjs for strict parser and static metadata checks, app.mjs for browser-local display/download only. Original README, homepage card, sitemap and llms.txt make the free tool discoverable. These are not traffic analytics.

## Existing buyer-payable AI-assisted micro-review (optional)

The very same one-human-owner VM3 seller already has FIVE Soul.Markets services. Its existing x402 quote-mismatch public-header micro-review is platform-listed at **USD $0.75**. Its authentic original public catalogue is at https://api.soul.mds.markets/v1/soul/vm3-usdc-receipt-qa and its original x402-paid execute route is https://api.soul.mds.markets/v1/soul/vm3-usdc-receipt-qa/services/x402-quote-mismatch-preflight/execute (POST only; requires input object). A buyer with its own x402 client must explicitly review the current HTTP402 PaymentRequired token, chain, exact price, payTo and refund terms, then approve a charge on the buyer side. The firstparty unpaid route was verified actually returning HTTP402 and PAYMENT-REQUIRED without any seller/wallet transaction; nobody bought in that test. The paid SKU's two required fields are http_status and decoded_public_payment_required; the optional fields quoted_native_base_usdc and symptom are permitted. This new disclosure does NOT change platform pricing, paid input schema, payout wallet, seller identity, service count, or execute behavior.

The separate indicative 19 native Base Circle USDC manually scoped technical QA is NOT an automatic purchase, while the free checker remains entirely free. The 5,000-atomic-unit sample shown in the page is entirely fictional and NOT a live 0.005USDC SKU quote; never mistake its sample payTo for the platform's verified current merchant recipient.

## Economic truth at launch

External independent paying clients 0. Signed orders 0. Verifiable distinct new Circle Base USDC receipts attributable to THIS new tool 0. Thirdparty developer studies and free comments are not buyers or paid contracts. Previous historical receipts by the same human across VM1/VM5 belong in the older unique overall ledger only.
