// SPDX-License-Identifier: MIT
// Arc ERC-8004 prepayment evidence reader. One fixed public RPC, read methods ONLY.
// Neither this module nor the UI can sign, approve, spend or settle payments.
export const CHAIN_ID = 5042n;
export const RPC_URL = "https://rpc.mainnet.arc.io";
export const IDENTITY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";
export const REPUTATION = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63";
export const SELECTORS = Object.freeze({
  ownerOf: "0x6352211e",
  tokenURI: "0xc87b56dd",
  getClients: "0x42dd519c",
  getSummary: "0x81bbba58"
});
const MAX_AGENT_ID = 999_999_999n;
const MAX_CLIENTS = 64;
const MAX_RPC_CHARS = 170_000;
const MAX_URI_BYTES = 16_384;
const ALLOWED_RPC_METHODS = new Set(["eth_chainId", "eth_blockNumber", "eth_call"]);
const TWO_256 = 1n << 256n;

export function normalizeAgentId(text) {
  const s = String(text).trim();
  if (!/^(0|[1-9][0-9]{0,8})$/.test(s)) throw new Error("Enter one decimal Arc ERC-8004 agent ID (0–999999999).");
  const n = BigInt(s);
  if (n > MAX_AGENT_ID) throw new Error("Agent ID exceeds this tool's size limit.");
  return n;
}
function word(n) {
  const b = BigInt(n);
  if (b < 0n || b >= TWO_256) throw new Error("ABI unsigned integer is out of range.");
  return b.toString(16).padStart(64, "0");
}
function validHex(value) {
  if (typeof value !== "string" || value.length > MAX_RPC_CHARS || !/^0x([0-9a-fA-F]{2})*$/.test(value)) {
    throw new Error("Malformed or oversized read-only RPC result.");
  }
  return value.slice(2).toLowerCase();
}
function readWord(hex, byteOffset) {
  if (!Number.isSafeInteger(byteOffset) || byteOffset < 0 || byteOffset * 2 + 64 > hex.length) {
    throw new Error("RPC ABI response is truncated or offset is invalid.");
  }
  return hex.slice(byteOffset * 2, byteOffset * 2 + 64);
}
function uintAt(hex, byteOffset) { return BigInt("0x" + readWord(hex, byteOffset)); }
function numBounded(x, cap, label) {
  if (x < 0n || x > BigInt(cap)) throw new Error(label + " exceeds safe bounds.");
  return Number(x);
}
function decodeAbiDynamicBytes(result) {
  const hex = validHex(result);
  const offset = numBounded(uintAt(hex, 0), 512, "ABI bytes offset");
  if (offset % 32) throw new Error("Malformed ABI bytes offset alignment.");
  const size = numBounded(uintAt(hex, offset), MAX_URI_BYTES, "Registration URI");
  const start = (offset + 32) * 2;
  if (hex.length < start + size * 2) throw new Error("Truncated registry URI bytes.");
  const bytes = new Uint8Array(size);
  for (let i=0;i<size;i++) bytes[i] = parseInt(hex.slice(start+i*2,start+i*2+2),16);
  return new TextDecoder("utf-8", {fatal:true}).decode(bytes);
}
export function decodeOwner(result) {
  const hex = validHex(result);
  const w = readWord(hex, 0);
  if (!/^0{24}[0-9a-f]{40}$/.test(w)) throw new Error("Registry returned an invalid address word.");
  const address = "0x" + w.slice(24);
  if (/^0x0{40}$/.test(address)) throw new Error("Registry returned a zero owner.");
  return address;
}
export function decodeClients(result) {
  const hex=validHex(result);
  const offset = numBounded(uintAt(hex,0),512,"Clients offset");
  if (offset % 32) throw new Error("Malformed ABI clients offset alignment.");
  const count=uintAt(hex,offset);
  if (count > BigInt(MAX_CLIENTS)) return { count: count.toString(), addresses: [], tooMany: true };
  const n=Number(count);
  const addresses=[];
  const dedup = new Set();
  for(let i=0;i<n;i++){
    const w=readWord(hex,offset+32+i*32);
    if(!/^0{24}[0-9a-f]{40}$/.test(w))throw new Error("Registry returned malformed client address.");
    const addr="0x"+w.slice(24);
    if (/^0x0{40}$/.test(addr)) throw new Error("Registry returned a zero client address.");
    if (dedup.has(addr)) throw new Error("Registry returned repeated client addresses.");
    dedup.add(addr);addresses.push(addr);
  }
  return {count: String(n),addresses,tooMany:false};
}
export function encodeOwnerOf(agentId) {return SELECTORS.ownerOf + word(agentId);}
export function encodeTokenURI(agentId) {return SELECTORS.tokenURI + word(agentId);}
export function encodeGetClients(agentId) {return SELECTORS.getClients + word(agentId);}
export function encodeGetSummary(agentId, clientAddresses) {
  if (!Array.isArray(clientAddresses) || clientAddresses.length > MAX_CLIENTS) throw new Error("Invalid clients array.");
  const seen = new Set();
  const addressWords=clientAddresses.map(addr=>{
    if(typeof addr!=="string"||!/^0x[0-9a-fA-F]{40}$/.test(addr))throw new Error("Malformed public client address.");
    const k=addr.toLowerCase();
    if(seen.has(k)) throw new Error("Repeated public client address.");
    seen.add(k);
    return word(BigInt(k));
  });
  // 4 argument head words; 3 dynamic tails: clients[], "", ""
  const arrayTail=word(clientAddresses.length)+addressWords.join("");
  const offset1=128;
  const offset2=offset1+arrayTail.length/2;
  const offset3=offset2+32;
  return SELECTORS.getSummary+word(agentId)+word(offset1)+word(offset2)+word(offset3)+arrayTail+word(0)+word(0);
}
export function decimalSigned(raw,decimals) {
  const b = BigInt(raw);
  if (b <= -TWO_256 || b >= TWO_256) throw new Error("Invalid signed magnitude.");
  const d = Number(decimals);
  if (!Number.isInteger(d) || d < 0 || d > 36) throw new Error("Untrusted on-chain decimal scale.");
  const a=b<0n?-b:b;
  const scale=10n ** BigInt(d);
  const i=a/scale;
  const f=d ? "."+(a%scale).toString().padStart(d,"0") : "";
  return (b<0n?"-":"")+String(i)+f;
}
export function decodeSummary(result) {
  const hex=validHex(result);
  const count=uintAt(hex,0), raw=uintAt(hex,32), decimals=uintAt(hex,64);
  if (count>1_000_000_000n)throw new Error("Unreasonable unfiltered feedback count.");
  const signed=(raw & (1n<<255n)) ? raw - TWO_256 : raw;
  if (signed < -(1n<<127n)||signed >=(1n<<127n))throw new Error("Invalid registry int128 summary.");
  const d=numBounded(decimals,36,"Summary decimal scale");
  return {count:count.toString(),raw:signed.toString(),decimals:d,value:decimalSigned(signed,d)};
}
export function decodeRegistration(result) {
  const uri=decodeAbiDynamicBytes(result);
  const meta={uriKind:"unresolved",name:null,active:null,x402Support:null,services:[],uriLength:uri.length};
  if (uri.startsWith("data:application/json;base64,") && uri.length<=14000) {
    const b64=uri.slice("data:application/json;base64,".length);
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw new Error("Invalid on-chain base64 registration file.");
    const binary=atob(b64);
    if(binary.length>MAX_URI_BYTES)throw new Error("Oversized on-chain registration file.");
    const decoded=new TextDecoder("utf-8",{fatal:true}).decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));
    let data;
    try { data=JSON.parse(decoded); } catch {throw new Error("On-chain registration file is not valid JSON.");}
    if(!data||typeof data!=="object"||Array.isArray(data))throw new Error("On-chain registration is not an object.");
    meta.uriKind="onchain-data";
    if(typeof data.name==="string")meta.name=data.name.slice(0,180);
    if(typeof data.active==="boolean")meta.active=data.active;
    if(typeof data.x402Support==="boolean")meta.x402Support=data.x402Support;
    if(Array.isArray(data.services)) meta.services=data.services.slice(0,12).map(x=>typeof x?.name==="string"?x.name.slice(0,50):"unnamed");
  } else if (/^https:\/\//i.test(uri)) {
    meta.uriKind="external-https-not-fetched";
  } else if (/^ipfs:\/\//i.test(uri)) {
    meta.uriKind="external-ipfs-not-fetched";
  } else if (uri==="") {
    meta.uriKind="empty";
  } else {
    meta.uriKind="unrecognized-not-fetched";
  }
  // Never export untrusted raw URI or arbitrary endpoints (possibly credential-bearing).
  return meta;
}
export async function rpcRead(method, params, {fetchImpl=fetch, timeoutMs=7500}={}) {
  if (!ALLOWED_RPC_METHODS.has(method)) throw new Error("Only public read-only Arc RPC methods are supported.");
  if (!Array.isArray(params)) throw new Error("Malformed RPC request.");
  if(method==="eth_call"){
    if(params.length!==2||params[1]!=="latest")throw new Error("Only current finalized public eth_call is supported.");
    const req=params[0];
    if(!req||typeof req!=="object"||!Object.keys(req).every(k=>k==="to"||k==="data"))throw new Error("Only approved public registry eth_call is supported.");
    if (![IDENTITY.toLowerCase(),REPUTATION.toLowerCase()].includes(String(req.to).toLowerCase()))throw new Error("Registry address is not approved.");
    const sig=String(req.data||"").slice(0,10).toLowerCase();
    const expected=String(req.to).toLowerCase()===IDENTITY.toLowerCase() ? [SELECTORS.ownerOf,SELECTORS.tokenURI] : [SELECTORS.getClients,SELECTORS.getSummary];
    if(!expected.includes(sig) || !/^0x[0-9a-fA-F]+$/.test(req.data) || req.data.length>20000) throw new Error("Contract selector or calldata is not approved.");
  }else if(params.length)throw new Error("Read-only chain metadata takes no parameters.");
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try {
    const r=await fetchImpl(RPC_URL,{
      method:"POST",mode:"cors",credentials:"omit",redirect:"error",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:controller.signal
    });
    if(!r.ok)throw new Error("Read-only Arc RPC is unavailable (HTTP "+r.status+").");
    const data=await r.json();
    if(!data||data.jsonrpc!=="2.0"||data.id!==1||data.error||typeof data.result!=="string")
      throw new Error("Read-only Arc RPC returned an error or malformed response.");
    return data.result;
  }finally {clearTimeout(timer);}
}
export async function inspectArcAgent(agentIdText, options={}) {
  const id=normalizeAgentId(agentIdText);
  const read=options.read || rpcRead;
  const chain=await read("eth_chainId",[]);
  if (BigInt(chain)!==CHAIN_ID)throw new Error("Wrong network. Expected Arc mainnet chain ID 5042.");
  const [ownerResult, blockResult] = await Promise.all([
    read("eth_call",[{to:IDENTITY,data:encodeOwnerOf(id)},"latest"]),
    read("eth_blockNumber",[])
  ]);
  const owner=decodeOwner(ownerResult);
  const result={schema:"arc-agent-prepay-guard/1",agentId:id.toString(),chainId:5042,
    rpc:"https://rpc.mainnet.arc.io", registry:IDENTITY, reputationRegistry:REPUTATION,
    blockNumber:BigInt(blockResult).toString(), owner,
    registration:null, clientCount:null, reputationSummary:null,
    policy:"MANUAL_REVIEW_REQUIRED", settlementVerified:false, ratingTrusted:false, buyerPaymentCreated:false,
    notices:["ERC-8004 identity proves registration and current NFT owner, NOT legal identity, financial solvency, trustworthy behavior or settlement.",
      "Reputation feedback is unverified here. Sybil wallets or coordinated feedback may distort it.",
      "Before paying, independently verify the live HTTP 402 network, token contract, amount, payTo and delivery terms. This tool cannot approve payment."]
  };
  try{
    const raw=await read("eth_call",[{to:IDENTITY,data:encodeTokenURI(id)},"latest"]);
    result.registration=decodeRegistration(raw);
    if(result.registration.x402Support===true)result.notices.push("An on-chain registration self-declares x402 support; it does NOT demonstrate a working or paid endpoint.");
    if(result.registration.uriKind!=="onchain-data")result.notices.push("External registration data were not fetched, so claims in an off-chain document were NOT verified.");
  }catch{result.notices.push("Public registration metadata unavailable or unreadable. Manual review required.");}
  try{
    const raw=await read("eth_call",[{to:REPUTATION,data:encodeGetClients(id)},"latest"]);
    const clients=decodeClients(raw);
    result.clientCount=clients.count;
    if(clients.tooMany)result.notices.push("More than 64 on-chain client entries. Unfiltered reputation summary skipped; verify with an independent allow-list.");
    else{
      try{
        const sum=await read("eth_call",[{to:REPUTATION,data:encodeGetSummary(id,clients.addresses)},"latest"]);
        result.reputationSummary=decodeSummary(sum);
        if(result.reputationSummary.count==="0")result.notices.push("No unfiltered feedback summary; absence of reviews is NOT proof of dishonesty.");
        else result.notices.push("Feedback count/value comes from the public registry for all listed clients; these wallets were NOT independently verified as paying counterparties.");
      }catch{result.notices.push("Reputation summary unavailable; do not infer positive standing.");}
    }
  }catch{result.notices.push("Unable to read the on-chain reputation-client list.");}
  return result;
}
