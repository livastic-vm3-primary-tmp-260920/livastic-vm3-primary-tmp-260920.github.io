# Independently reproduce the X Layer TapeOut state changes

This is a **read-only, historical** check for the public [TapeOut State Observatory](./). It does not require MetaMask, a signature, fees, account credentials, or cryptocurrency.

## Exact public chain data

- X Layer mainnet: chain ID 196 (RPC value `0xc4`).
- Factory: `0x1f09daefa827f02cbb40967cc91b259763760761`.
- Baseline: block **73915245**, CPU count **387**, implementation `0x74956236ab64ed143933040b4137e8a352e4d17b`.
- Comparison: block **74073819**, CPU count **392**, implementation `0xb41c1e7602eb5734be2430b72178ccb814a5293d`.
- All twenty normalized source fields (including eighteen that did not change) are in [evidence.json](./evidence.json). This is a fixed pair of historical reads, not a live monitoring feed.

## Reproduction without installing software or linking a wallet

Use a public JSON-RPC client such as curl/Postman to send **POST** requests to `https://rpc.xlayer.tech` with `Content-Type: application/json`. Never send a private key or signed transaction. Substitute each historical height in hexadecimal using `hex(73915245)` and `hex(74073819)` in Python.

1. Check network using JSON-RPC method `eth_chainId` with `params: []`. Expect `0xc4`.
2. Fetch registered CPU count using `eth_call` at each exact block with `params: [{"to":"0x1f09daefa827f02cbb40967cc91b259763760761","data":"0xa94da8a7"},"0x<hex block>"]`. The returned 32-byte ABI word decodes to 387 and 392 respectively.
3. Fetch factory upgradeable implementation using `eth_getStorageAt` at each exact block with `params: ["0x1f09daefa827f02cbb40967cc91b259763760761","0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc","0x<hex block>"]`. The final 20 bytes of the returned 32-byte word are the implementation address.
4. Compare every other original source field against the [evidence JSON](./evidence.json) and the public [20-field x402 source logic](https://github.com/livastic-vm3-primary-tmp-260920/livastic-vm3-primary-tmp-260920.github.io/tree/main/tapeout-accelerate). Treat missing or reverting calls as **unknown**, not unchanged.

## Actual independent read-back on 24 October 2026

VM3 replayed **all four key historic reads** successfully from `rpc.xlayer.tech`: 387→392, and the implementation address change specified above. The other advertised 18 unchanged fields were validated in the original prior complete twenty-field capture but **were not fully re-read in this independent spot check**.

Secondary public host `xlayerrpc.okx.com` returned **HTTP 403** for these historic calls in this independent check; it was **not bypassed**. Do not present two independently successful RPC-provider confirmations.

These results do **not** establish a formal audit, guarantee that no intermediate state changed, prove an exploit, establish project eligibility, or prove a human buyer purchase or profit. This application remains **unsubmitted** until the real applicant supplies their legal identity and eligibility information.
