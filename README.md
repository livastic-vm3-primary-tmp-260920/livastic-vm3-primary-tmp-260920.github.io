# Free Crypto CSV and Base USDC checks — One Cursor

**Try a private, free browser tool before buying any service.** This is one human-owned, AI-assisted developer project across VM1, VM2, VM3 and VM5, not four independent sellers. No MetaMask, sign-in, custody, private file upload, or cryptocurrency payment is needed to try the free checks.

**[Open free Koinly CSV checker](https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/koinly-preflight/)** · **[Crypto CSV Rescue scope](https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/)** · **[Free Base USDC merchant invoice preview](https://livastic-vm1-primary.github.io/paperpilot-tools/usdc-invoice-reconcile.html)**

### Crypto CSV errors and missing purchase history

If a supported exchange's original export gets Koinly's *Unknown file* warning, **first consult [Koinly's official supported CSV troubleshooting](https://support.koinly.io/en/articles/9490013-csv-import-unknown-file-unable-to-import-this-file-automatically)**. Do not guess trade semantics or cost basis and edit real financial rows merely to silence a warning.

If your data legitimately follows one of Koinly's **Simple / Trades / Universal** custom templates, use the [free original local-only Koinly format preflight](https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/koinly-preflight/):

- Checks exact required headers, RFC CSV quoting, row-width consistency, UTC calendar format and structural quantity/sign anomalies. Source guidance: [official Koinly custom CSV help](https://support.koinly.io/en/articles/9489976-how-to-create-a-custom-csv-file-with-your-data).
- Reads only your voluntarily selected local CSV, maximum **512 KiB / 200 data rows / 36 columns**, using browser memory. The published static app sets **connect-src 'none'** in its content security policy. No file POST, analytics or automatic wallet interaction.
- Outputs only allowlisted error codes and row numbers; a **read-only safe diagnostic summary** contains official field names and bounded numeric counts but *never original transaction amounts, timestamps, financial records, account IDs, hashes, wallet addresses or filenames*. The user must inspect the summary and deliberately select it before copying elsewhere.
- Includes a wholly fictional three-row example. **Structural PASS does not establish that Koinly accepted your CSV, tax basis, chain finality, source ownership or completeness.**

### Merchant Base USDC transfer versus invoice review

Use the [free original Base USDC merchant ledger](https://livastic-vm3-primary-tmp-260920.github.io/defi-payment-proof-qa/guides/base-usdc-merchant-ledger.html) and the [original one-owner entirely fictional 50-invoice/50-transfer reconciliation example](https://livastic-vm1-primary.github.io/paperpilot-tools/usdc-invoice-reconcile.html) before paying for any custom review. These are strictly **candidate matches from provided data**. Matching amount/txHash claims cannot alone prove the right human sender, a finalized Base chain receipt, payment allocation, or delivered work.

### Optional 49 native Circle Base USDC written-scope technical review — not a checkout

The one owner is exploring two **UNVALIDATED PRICE HYPOTHESES**, not booked sales: (1) **Crypto CSV Rescue**, for at most **50 sanitized rows TOTAL across two authorized exports**, one discrepancy cluster and a technical evidence checklist; (2) [Base USDC invoice matching](https://livastic-vm3-primary-tmp-260920.github.io/usdc-receipt-reconciliation/), up to **50 merchant invoices and 50 reported token transfer event rows**, yielding an exception-only technical report. No certified cost basis, legal/financial/accounting advice, tax filings, recovery of wallets or automated merchant checkout is offered.

An actual independent buyer would first agree the written authorized scope, protected data transfer, correct token/chain/payee, timing, acceptance, cancellation/refund and AI-assisted data processing terms. **Do NOT transfer tokens merely because a public page quotes 49 USDC.** This is **not a funded order or proof of revenue**.

If you have a REAL independent problem and want an optional quote, use the [existing same-owner VM5 voluntary inquiry form](https://docs.google.com/forms/d/e/1FAIpQLSe_N8anCGUDmWdNZLnGwFRfhYaaCsB18BKdYd_VsFZp1xWm3g/viewform) or manually email **onecursor1@gmail.com**. **Only send a broad description and your own acceptance criteria**; never place private financial CSV lines, tax info, customer invoices, wallet addresses, signed payment headers, keys, seed phrases or OTPs into public forms, email or GitHub issues. Google separately processes form data. Unchanged prefilled templates and synthetic examples are not evidence of a real customer.

**Actual sales disclosure:** these two 49 USDC manual pilots have **zero independently confirmed paying customers and zero proven finalized 49-USDC receipts** as of this publication. Page views, potential awards, cloned repos, bot HTTP402 challenges and other services' past wallet receipts are not new pilot revenue.

### Original code and local reproducibility

Original static checker code is under [crypto-csv-rescue/koinly-preflight](./crypto-csv-rescue/koinly-preflight/): [core](./crypto-csv-rescue/koinly-preflight/core.mjs), [safe summary](./crypto-csv-rescue/koinly-preflight/safe-summary.mjs), app, synthetic tests and vendor-spec README.

```sh
# Node.js >=22, only invented local data
node --test crypto-csv-rescue/koinly-preflight/tests/*.test.mjs \
  crypto-csv-rescue/koinly-preflight/safe-summary.test.mjs
python3 -m unittest discover -s tests -q

# Local HTTP server, loopback only — never exposes user's CSV to this repo
python3 -m http.server 8765 --bind 127.0.0.1
# Open http://127.0.0.1:8765/crypto-csv-rescue/koinly-preflight/
```

Other original developer tools include a [free x402 HTTP402/browser CORS preflight](./x402-smokecheck/). The project owner does not sell rented raw CPU/GPU/VPS, Golem, AIOZ or DePIN compute.

*Updated 21 October 2026. AI-assisted engineering, no vendor sponsorship, user review, earned 49-USDC commission, verified custody, tax advice or audited security certification claimed.*
