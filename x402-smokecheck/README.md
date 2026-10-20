# x402 Browser Readiness Check v1.0.1 (MIT)

A free, zero-dependency Node.js 22+ developer CLI for **owner-authorized public HTTPS** x402 browser/CORS QA. It tests an unsigned OPTIONS preflight and one unsigned resource request. No wallet, gas, signed retry, x402 settlement, or real purchase is performed. **Not a payment success test or security audit.**

## Download and run

Use the [verified immutable v1.0.1 GitHub release](https://github.com/livastic-vm3-primary-tmp-260920/livastic-vm3-primary-tmp-260920.github.io/releases/tag/x402-browser-readiness-v1.0.1) when available. The source components `cli.mjs`, `checker.mjs`, and `fixture.mjs` must be together in the same directory.

    node cli.mjs --help
    node cli.mjs --url https://YOUR-OWN-PUBLIC-X402-ENDPOINT/paid \
      --origin https://YOUR-BROWSER-CLIENT.example \
      --method GET --i-control-endpoint

Use `--json` for machine-readable diagnostics **without raw header/payment values**. The tool only permits public DNS HTTPS port 443 and requires explicit operator authorization; it rejects localhost/private/reserved IPs, URL usernames/passwords, query strings, fragments, and redirect following. It discards response bodies, pins addresses for both probes, and includes no user credentials, wallet, signed payment data, or tx hashes.

## POST-only paid routes requiring a JSON request body

Many production x402 endpoints reject unsigned POST without the expected JSON object as HTTP 400, *before* generating their HTTP 402 payment challenge. That is not proof of missing x402 integration. To make the paid route observable **on an endpoint you operate**, provide only a tiny, fictional JSON input, such as `samples/synthetic-csv.json`:

    node cli.mjs --url https://YOUR-OWN-PUBLIC-X402-ENDPOINT/paid \
      --origin https://YOUR-BROWSER-CLIENT.example --method POST \
      --i-control-endpoint --permit-unpaid-post \
      --fixture-json-file samples/synthetic-csv.json --json

POST is separately disabled unless you give `--permit-unpaid-post`. It may cause real side effects if the operator's API is misconfigured to allow unauthenticated processing; only you can decide if an unsigned POST is safe on your OWN system. Do not use POST probing on other people's production endpoints without explicit written operator consent. The fixture is limited to **4,096 bytes**, must be a JSON object in a local regular `.json` file, and is scanned for obvious secret-bearing fields/values. **The filter cannot guarantee safety:** never include real customer records, tokens, cookies, private URLs, wallet addresses, mnemonic phrases, signed payment headers, confidential data, or account details. The original synthetic bytes are transmitted **only to the explicitly selected endpoint**, not written to the CLI's report. The report indicates only that a fixture was sent and its byte count.

An endpoint that demands a different schema may still respond 400; treat it as **INCONCLUSIVE**, not proof of absent paid APIs. If no fixture is provided, POST sends no JSON body. Mixed v1/v2 mode with `--legacy` includes requested `x-payment` in the OPTIONS preflight header list without ever producing a payment signature.

## Scope and limits

- Detect non-2xx OPTIONS, missing Origin/method/CORS allowed-request-headers, lack of `PAYMENT-SIGNATURE`, and POST Content-Type allow-list gaps.
- Inspect **unsigned** HTTP 402 and browser-exposed `PAYMENT-REQUIRED` header, Vary: Origin, restrictive cache policy, and advisory exposed response headers.
- Never send authorization cookies, real payment signatures, secrets, or transaction approvals.
- The final positive status is `PREFLIGHT_READY_UNVERIFIED_PAID`, explicitly **NOT** proof of paid-response delivery, facilitator acceptance, EIP-3009 signature validity, settlement, blockchain finality, merchant trust, sales, or certification.
- If the operator intentionally restricts browser origins, browser readiness should fail; that is not automatically a server vulnerability.

## Test / learn / license

    node --test tests/*.test.mjs

Relevant actual community discussion: https://github.com/x402-foundation/x402/issues/3808 and https://github.com/x402-foundation/x402/issues/3722 . If you have no Node runtime, use the separate [no-install browser CORS doctor](https://livastic-vm3-primary-tmp-260920.github.io/defi-payment-proof-qa/guides/x402-browser-cors-doctor.html), whose explicit user click controls any optional browser request. All code in this utility is distributed under `LICENSE` (MIT). Original synthetic tests and test code are also included in the public GitHub repository.

## Optional separate same-owner paid service

One existing original Soul.Markets “**x402 Browser HTTP 402 CORS Remediation Blueprint**” machine-payable AI-assisted offline analysis is publicly listed at nominal **$1.50** (Base USDC subject to buyer's actual provider quote) via the same economic owner: [public service catalog](https://api.soul.mds.markets/v1/soul/vm3-usdc-receipt-qa) and [public buyer input schema](https://livastic-vm3-primary-tmp-260920.github.io/x402-smokecheck/soul-service.json). It is a separate external x402-capable buyer-approved POST service, **not** part of the free CLI and **not** a browser checkout. No externally paying customer, signed checkout, or VM3 revenue is verified from publishing this page.
