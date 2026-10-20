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
