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


## Voluntary real-user feedback, no private source data

The static page optionally links to the SAME existing one-owner VM5 Google
project enquiry form that the main Crypto CSV Rescue buyer page links to.
Only the original owner's Crypto CSV Rescue category is prefilled; this URL
does **not** prepopulate a user's email or budget and it clearly asks the
buyer to replace the category placeholder with their own genuine, broadly
described issue and acceptance needs. The Google Form requires a reply
email and is not anonymous; Google processes requests and responses.
Do not submit real CSV rows, wallet/account identifiers, signed payment
headers, customer receipts, taxes, keys, seeds, or other private data.
The owner maintains the alternative manual mailto channel. Sending a form
is not a payment, accepted job, outside reviewer endorsement or proof of a
successful Koinly import. This is explicitly optional and never posted
automatically by the validator.

## Optional redacted offline diagnostic summary for lawful independent feedback (2026-10-21)

The existing free checker now uses original pure stdlib-compatible JS
`safe-summary.mjs` to build a **locally visible, manually selectable**
allowlisted technical note. Data comes ONLY from the existing parser's
sanitized issue codes, bounded source row numbers, official expected Koinly
field names and integer counts. It CANNOT include a source filename,
user-defined header or field, trade amount, original UTC timestamp,
transaction hash, address, customer identity or real CSV value; unrecognized
issue types and fields are discarded. The issue list is bounded to 25. Any
evidence of a purported upload, external request, chain settlement or tax
calculation makes note generation refuse the result.

Use the separate `Select safe summary for manual Ctrl+C / Copy` control
only after reviewing the generated text in the read-only box. Selection does
NOT transmit to us, invoke clipboard API, require browser permissions,
POST to Google or send email. A user must deliberately copy it manually
and, if desired, separately write an honest voluntary original problem
to the existing VM5 one-owner secure inquiry route; the initial inbox
does NOT ingest raw customer financial exports.

One-owner `49 native Circle Base8453 USDC` price remains **unvalidated
and entirely conditional on real independent contract, legal receiving
payee, data handling, acceptance and cancellation/refund**, never a charge,
tax filing or settled USDC from a local note. No test submits owner-authored
forms or simulates an outside paying user.


## No-upload two-stage optional owner workflow

First, for a *genuinely unsupported* source export with authorized
ownership and independently known original timestamp zone, run VM1's
original free browser-only manual column mapper at
https://livastic-vm1-primary.github.io/paperpilot-tools/koinly-column-mapper.html .
Then open that program's **downloaded candidate CSV** in this separately
hosted free local Koinly format checker using your own file chooser. There
is no cross-site browser storage/API/POST or sharing of a customer CSV.
Actual Koinly proprietary import success is never asserted from either
offline step. For supported exchange exports, consult Koinly's original
integration/support instead of rewriting source records.


## Existing one-owner HashN small Koinly manual seller contact (not a checkout)

Original VM1 has an ACTUALLY published external HashN agent-services listing
https://hashn.com/store/886ed287-aaca-434b-9f27-560a50bfbbb6/listings/koinly-csv-one-source-mapping-mini-review-5usdc.md ,
proposing a separate 5.000000 native Circle BaseUSDC manually negotiated
one-source header review with MAX 10 sanitized buyer-authorized sample
rows. HashN holds NO money and offers NO escrow; the published listing
is not a confirmed customer/contract/checkout nor a funded bounty.
The original owner seller's historical reputation is from a different
job and is not a sale of this new mini review. Authenticated independent
agent contact, mutually written exact scope, recipient/chain/token,
privacy/data processing, delivery, cancellation and refund terms all
must precede any real buyer-controlled USDC transfer. Our distinct
broader 49-native-BaseUSDC up-to-50-row/two-export manual pilot is not
included. If the free original local tools work, customer pays ZERO.
