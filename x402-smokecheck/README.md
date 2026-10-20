# x402 Browser Readiness Check

Open-source, no-cost CLI for x402 resource-server operators to reproduce
cross-origin HTTP 402 integration failures **without a wallet or any payment**.

**Intended audience:** developers who operate (or have authorization to test) a public HTTPS x402 endpoint.

## Run

Requires Node.js 22 or newer. No dependencies or secrets.

    node cli.mjs --help
    node cli.mjs --url https://YOUR-OWN-PUBLIC-X402-ENDPOINT/paid \
      --origin https://YOUR-BROWSER-CLIENT.example \
      --method GET --i-control-endpoint

Use \`--json\` for non-secret machine-readable diagnostics. To test an
intended \`POST\` paid route, additionally pass \`--permit-unpaid-post\`. Only
do so on your own endpoint when even an unsigned request is safe. In neither
case does this program create a wallet or pay for a route. The tool rejects
localhost, private/reserved IPs, non-HTTPS, credentials in URLs, query strings,
and redirects, and pins DNS lookups for the two requests. It sends a CORS
preflight \`OPTIONS\` and one *unsigned* intended-method request.

\`PREFLIGHT_READY_UNVERIFIED_PAID\` is **not** proof that a wallet, signature,
facilitator, payment, paid response, delivery or settlement works.
A service may deliberately refuse browser callers; such a service will
correctly fail this specific browser-compatibility assessment.

## Diagnostic coverage

- OPTIONS success *without* requiring a payment
- Correct origin, intended method, payment-signature and Content-Type
- HTTP 402 with a PAYMENT-REQUIRED header visible to the browser
- Advisory paid response exposing PAYMENT-RESPONSE (cannot confirm from unpaid 402)
- Origin-specific cache hygiene, Vary: Origin and restrictive Cache-Control
- Optional mixed v1/v2 compatibility mode

This checker sends **no** authorization, payment signature, cookies, CSV
files or private application data. It redacts header *values* from the report.
No paid routes are exercised and no funds move.

## Test locally

    node --test tests/*.test.mjs

Public documentation of the underlying browser failure:
https://github.com/x402-foundation/x402/issues/3808
and https://github.com/x402-foundation/x402/issues/3722

Free tooling complements, but does not certify or bundle, an optional
separately agreed **paid developer QA/remediation service** offered by the
same one-owner seller through:
https://livastic-vm3-primary-tmp-260920.github.io/defi-payment-proof-qa/

No buyers, payment volume, or customer endorsement are claimed.

## Existing optional $1.50 machine-payable seller service

The exact active service and public validation-only input schema are linked from
`soul-service.json`, generated from the provider's original public seller catalog
(no secret keys). This is **not** a prepaid order or working human browser checkout.
The machine route requires a buyer with their own provider-compatible x402 client
and explicit USDC authorization. The vendor's challenge, not this static file,
determines amount, destination and authorization requirements. Seller jobs and
earnings observed at publication: **zero**. The free CLI does NOT send funds
or diagnose the success of this separately hosted service.
