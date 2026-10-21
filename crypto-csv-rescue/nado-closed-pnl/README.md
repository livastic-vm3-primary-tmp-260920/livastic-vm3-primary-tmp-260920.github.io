# Nado / Ink derivative CSV → Koinly Simple: explicit closed PnL only, offline

Live after Pages deploy: https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/nado-closed-pnl/

NOT a native Nado-file importer. As of January 20, 2026, a real Nado user reported a support gap for derivatives PnL, and official support distinguished Ink chain syncing from exchange trade-history imports. At release (October 21, 2026) we DID NOT possess a verified original Nado CSV column schema or independently confirmed successful Koinly import. Check Koinly's current native integration first and use the exchange's supported export unchanged when available.

Free, browser-local manual input CSV → candidate Koinly Simple CSV. Users explicitly map verified UTC date, signed already realized and closed futures PnL, actual settlement token and optional unique source event ID. Three affirmative risk acknowledgments required; unknowns fail without output. Max 1MB/2500 rows. No network request, wallet or upload, all parser logic in standard JavaScript. Three sample rows are **FICTIONAL**, not a Nado export or customer data.

- Official Koinly PnL rules: https://support.koinly.io/en/articles/9490027-futures-and-perpetuals-pnl-other-gains
- Official Koinly Simple schema and realized gain tags: https://support.koinly.io/en/articles/9489976-how-to-create-a-custom-csv-file-with-your-data
- Official Koinly native vs custom import warning: https://support.koinly.io/en/articles/9885319-how-to-modify-csv-files-to-import-them-to-koinly
- Genuine independent user request and official staff reply: https://discuss.koinly.io/t/nado-ink-kraken-chain-perpetual-dex-csv-import-not-compatible-with-koinly/27488
- Existing one-owner VM1 manual mapper: https://livastic-vm1-primary.github.io/paperpilot-tools/koinly-column-mapper.html
- Existing one-owner VM3 checker: https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/koinly-preflight/

No PnL calculations, automatic Nado source mapping, open-position conversion, actual Koinly import, fees/funding, timezone guessing, tracking or tax advice. Separately scoped optional human-approved technical QA indicative 19 native Circle Base USDC requires public or invented source plus written acceptance/refunds/payee/price terms before money; a new webpage is NOT new revenue.

Run node --test crypto-csv-rescue/nado-closed-pnl/core.test.mjs and python3 -m unittest discover -s tests -q to reproduce. Use isolated temporary browser for no-cookie end-to-end demo smoke.

A completely OPTIONAL 1-native-Circle-Base-USDC example thank-you tip with an explicit 0-USDC free use option links ONLY to the already-public, existing same-owner VM5 x402 merchant Base8453 payTo. The client-side JavaScript simply copies the public address on click; it does not construct a transaction, require a wallet or purchase any 19 USDC report. Both network/token/recipient were checked against the actual existing public VM5 HTTP402 x402v2 payment requirements, not inferred from an unverified seed. Voluntary tips are not a Koinly order and no new paid buyer or settlement is inferred.

Independent public DEV readership discovery: original AI-generated source-backed walkthrough https://dev.to/livasticvm3primarytmp260920/nado-perps-csv-and-koinly-a-safe-way-to-map-closed-pnl-without-inventing-trades-4jo1 posted exactly once by the same one-human-owner account. It explains why authentic native Nado CSV is not verified, and includes free educational examples. Article readership/comments not independently measured as customers, existing website features still free, paid requests only by prior written scope; there are zero new receipts.

## Optional agent marketplace 9-USDC fixed-scope technical QA

Same single beneficial human owner published ONE original authenticated TTMA seller and a public real x402 agent listing at https://talktomyagent.dev/api/market/listings/lst_agt_mvhc997e_5j0oocaq . This is a DISTINCT technical report plus reproducible offline tests for 10 invented/public source rows, not the free tool or the narrower VM1 5USDC header-only human review, never double bill. The buyer pays the TTMA PLATFORM wallet, and TTMA promises manual weekly seller payouts after a 2% fee and 5 USDC minimum; no escrow, refund or instant owner onchain payout is guaranteed. The public source manifest agent-offer.json is for read-only autonomous buyer discovery. No independent purchasers or settled new USDC are verified by publishing this record.


### Free ten-invented-row report example for live fixed 9-USDC agent listing

- Human-readable: https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/nado-closed-pnl/buyer-qa-example.html
- Machine-readable exact reproducible: https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/nado-closed-pnl/buyer-qa-example.json
- Source-only: synthetic-buyer-10rows.csv (ten entirely fabricated examples), build-paid-qa-sample.mjs, buyer-qa-example.test.mjs.
- Test: node build-paid-qa-sample.mjs --check and node --test buyer-qa-example.test.mjs.
- Intent: 7 synthetic rows individually pass syntactic gates; invented line 9 has impossible date, line 10 duplicates synthetic event ref, line 11 says USD instead of a verified token. A **full ten-row CSV is refused** rather than silently dropping, timezone-fixing or creating an unsupported settlement. Reproducible JSON carries source SHA-256. This sample does not claim any real buyer report was commissioned, any tax software accepted a real Nado file, or any actual platform funds settled.

## Separately verified engineering proof, NOT a Koinly paid customer
The ONE beneficial human operating VM3 and VM1 actually completed and was paid for the independently MERGED developer bugfix https://github.com/pursekeeper/api/pull/94. The original independent sponsor paid exactly 5 XNO (Nano), fully received confirmed in the original VM1 Nano wallet and already counted once in the fleet accounting. Read firstparty original published case study https://livastic-vm1-primary.github.io/case-studies/pursekeeper-nano-lock-bounty-5xno.html. This paid-code evidence is NOT a Koinly/Nado buyer, not a paying 5/9/19 USDC QA order, not an extra Nano award, not an endorsement of the VM3 tool, and not proof of economic profit after operating costs. No VM3 account or wallet accesses VM1 private Nano custody.
