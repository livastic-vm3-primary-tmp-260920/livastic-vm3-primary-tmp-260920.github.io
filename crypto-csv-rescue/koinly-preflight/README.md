# Koinly CSV Format Preflight — Free local structural validator

Original first-party URL: https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/koinly-preflight/

**Why this helps the existing original Crypto CSV Rescue market test:** Koinly's own import guide says custom CSV files will be rejected if their exact expected headers differ, dates are not UTC or records don't align with the selected template. This free tool supports only limited *structural preflight* and hands back a privacy-preserving list of authored error codes and record indices. The buyer can fix elementary problems for **0 USDC**, without giving this owner the user's wallet, original CSV or login.

## Official specifications and exact supported template selection

Primary source, published June 2026: https://support.koinly.io/en/articles/9489976-how-to-create-a-custom-csv-file-with-your-data

Modification guide: https://support.koinly.io/en/articles/9885319-how-to-modify-csv-files-to-import-them-to-koinly

- `simple` requires **Koinly Date**, **Amount**, **Currency**. Withdrawal amount can be negative. A trade in Simple generally requires more than one row; we do not infer the exact trade.
- `trades` requires **Koinly Date**, **Pair**, **Side**, **Amount**, **Total**. Side Buy/Sell, positive gross base and quote amounts, pair separated by slash or hyphen. Never invent an asset pair or price.
- `universal` requires **Date**, **Sent Amount**, **Sent Currency**, **Received Amount**, **Received Currency**. Deposit only Received fields; withdrawal only Sent fields; a trade uses both sides with positive gross amounts.

All date columns are checked as an explicit UTC `YYYY-MM-DD HH:mm:ss` calendar timestamp with no invented timezone conversions. Year range 1970–2100 is an intentional product limit, not a Koinly tax limitation.

Unknown input exchange CSV fields are not automatically mapped. This service does not write or download corrected data, verify accepted imports inside a Koinly account, certify cost basis, calculate taxable gains, process raw wallet data on a server or supply tax/legal advice.

## Privacy & threat model

Source file selected only with browser's file picker; `File.text()` reads at most 512 KiB, 200 data rows, 36 columns, max 16,384 characters/cell. Strict RFC-style quoting and row-width controls. Module references are same-origin and a strict CSP has `connect-src 'none'`, no analytics, storage, cookies, fetch/XHR, file POST, wallet library or signing. Errors list **authored static status codes, official template field names and source record numbers** only. No filename, raw amount, timestamp, transaction hash or original CSV cell is shown, logged or transmitted. Actual browser memory follows standard JS GC, so close the page after inspecting sensitive local data. Choose only files you own or are authorized to inspect.

Use **Run the wholly fictional example** if you don't want to pick a file. All synthetic data is invented; no test transaction is a real receipt.

A structural `PASS` means the limited check found no blocking issue **not** that Koinly accepted this import, a signed tax report was prepared, the original wallet paid anything, or a priced seller obtained revenue.

## Verify

`node --test crypto-csv-rescue/koinly-preflight/tests/preflight.test.mjs`

`python3 -m unittest discover -s tests -q`

`node --test x402-smokecheck/tests/*.test.mjs`

## Original real headless browser verification (purely invented data)

`node scripts/qa_koinly_headless_browser.mjs` launches one fresh, isolated,
temporary-profile Chrome headless tab, loads the owner's publicly published
static app and clicks ONLY its `Run the wholly fictional example` button.
Expected result is `UNIVERSAL | 3 data rows | 0 structural blockers`, zero
third-party network requests, zero page script errors and zero real customer
files or USDC payment activity. It does NOT open, close or access existing
owner Chrome tabs, Gmail sessions, MetaMask, wallet storage or user secrets.

One owner, VM3 main workroot `/srv/multi-vm-agent/workspace/make_money`. This is an original free extension of the prior limited 49 **native Base Circle USDC** Crypto CSV Rescue *pricing hypothesis*. Existing VM5 is the sole independent buyer contact coordinator. Any buyer-requested manual conversion/CSV review requires separately signed lawful scope, source-data authorization, secure data channel, delivery/acceptance/refund/payee confirmation *before* money or sensitive source data changes hands. No new external customer has paid for this free checker.
