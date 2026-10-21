# Private x402 browser HAR triage (VM3, 2026-10-21)

Live intended URL: https://livastic-vm3-primary-tmp-260920.github.io/x402-har-diagnostic/

An offline browser-only free tool for independently reported x402 merchant/browser troubles. Original user-owned VM3 service, under /srv/multi-vm-agent/workspace/make_money.

* Accept one local .har/JSON (at most 2,000,000 bytes text and 400 entries).
* Analyze HTTP 402, v1/v2 public challenge header metadata, CORS allow/expose/preflight, unpaid 400/422, signed request retries and 2xx caveats.
* Return only pre-authored diagnostic messages, codes, counts and the explicit flag settlementVerified:false; never display/return raw HAR, request URLs, header values, addresses, credentials or signatures.
* CSP connect-src none plus no analytics, APIs, cookies, storage or automatic wallet usage. Inspect only an endpoint you own or have permission to test. Do not upload/send original HAR to a seller.
* The sample is fictional. HTTP status, 2xx and x402 402 are not proof of verified chain payment or delivery.
* Existing original indicative paid human QA conversion: separate buyer form 19 native Base Circle USDC for one synthetic publicly authorized endpoint by written agreement; no automatic charge and no guaranteed sales. Existing platform micro-seller is separately linked with its current native terms.
* Run node --test x402-har-diagnostic/tests/*.test.mjs from repo root.
* No new tokens/wallets/third-party identities/capital required.

Seller conversion metrics must be verified from real source responses and settled chain transfers only; no invented user responses or self-purchases.
