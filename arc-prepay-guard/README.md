# Arc ERC-8004 Prepayment Cross-Check

Original free, independent MIT-licensed developer prototype for Arc mainnet chain 5042, 2026-10-21.

Live intended URL: https://livastic-vm3-primary-tmp-260920.github.io/arc-prepay-guard/

## Problem and value

x402 buyers receive a network/token/payTo quote but usually cannot deduce whether a merchant's advertised ERC-8004 agent identity has any canonical on-chain registration or visible feedback. This tool asks the buyer for one PUBLIC Arc ERC-8004 agent ID and returns live owner, public registration metadata and unfiltered reputation from the Arc registries. A public identity is NOT independent verified merchant reliability. The decision is ALWAYS MANUAL_REVIEW_REQUIRED.

## Trust boundary and architecture

- No account, gas, wallet, keys, signing, transactions, analytics, cookies or storage. The user clicks before any RPC; their public agent ID and IP are visible to the public RPC operator.
- Fixed firstparty Arc mainnet RPC: https://rpc.mainnet.arc.io. Refuse a chain other than 5042. Only eth_chainId, eth_blockNumber and eth_call are supported.
- Canonical official Arc identity registry 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432; canonical reputation registry 0x8004BAa17C55a88189AE136b182e5fdA19dE9b63, as documented at https://arcusid.com/docs
- Direct ABI ownerOf, tokenURI, getClients, getSummary calls. Public client addresses are unfiltered and could be sybils. The module declines aggregate summaries with more than 64 clients rather than truncating an apparently definitive value.
- On-chain JSON data URI can be locally decoded with length caps; external https/IPFS registration URLs are classified but NEVER automatically fetched. All untrusted names and strings go through DOM textContent, never innerHTML.
- An ERC-8004 ownerOf result is proof of NFT ownership, NOT legal identity, operational service/solvency, USDC payment settlement, approval to spend, safe x402 envelope, refund rights, or delivery. User must compare fresh 402 network, token, payTo, amount and terms separately.
- No back-end traffic to our servers. Browser CSP limits network connect-src to the public Arc RPC only.
- Independently authored original software; not operated, endorsed, approved or funded by ArcID, Circle or ERC-8004. Not a security audit or financial advice.

## Reproduce locally

From the Git repository root: node --test arc-prepay-guard/tests/*.test.mjs
From the Git repository root: node arc-prepay-guard/tests/browser-smoke.cjs
The browser smoke launches an isolated headless Chrome against local static HTML and public READ-ONLY Arc RPC. It does not interact with existing Gmail/MetaMask tabs and cannot sign a transaction. Production app has zero JS runtime dependencies.

## Potential grant

Possible application to https://arcusid.com/grants (Tooling track, 1000 USDC per selected milestone project, FIVE advertised places). Working public source and a live reading demo are NOT an accepted grant, a customer, an award, a purchase or a paid receipt. An application may be rejected or require additional real owner eligibility. No user funds were moved to apply.

## License

MIT. See the accompanying LICENSE file.
