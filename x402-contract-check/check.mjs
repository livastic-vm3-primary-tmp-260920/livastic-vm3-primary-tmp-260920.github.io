/* No-wallet offline prepay public 402 metadata inspection.
 * Strictly local; checks are syntactic, NOT payments, route liveness, merchant
 * authenticity, data-safety certification or a schema validation of paid data.
 * Official references:
 * https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md
 * https://github.com/x402-foundation/x402/blob/main/specs/extensions/bazaar.md
 */
export const MAX_CHARS=24000;
export const NATIVE_BASE_USDC="0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const ADDR=/^0x[0-9a-fA-F]{40}$/;
const PRIVATE_KEYS=/^(?:authorization|payment-signature|payment-signature-header|x-payment|x-payment-response|payment-payload|payload|privatekey|private_key|seed|seed_phrase|mnemonic|cookie|set-cookie|access_token|refresh_token|api_key|bearer|password|secret|__proto__|constructor|prototype)$/i;
const asObj=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
function invalid(code){const e=new Error(code);e.code=code;throw e;}
function scrutinize(input,depth=0){
 if(depth>12)invalid("TOO_DEEP");
 if(!input||typeof input!=="object")return;
 if(Array.isArray(input)){if(input.length>150)invalid("ARRAY_TOO_LONG");for(const v of input)scrutinize(v,depth+1);return;}
 const entries=Object.entries(input);if(entries.length>90)invalid("TOO_MANY_KEYS");
 for(const [k,v] of entries){
  if(PRIVATE_KEYS.test(k))invalid("SECRET_OR_SIGNED_PAYMENT_FIELD_REJECTED");
  scrutinize(v,depth+1);
 }
}
export function parsePublic402(raw){
 if(typeof raw!=="string")invalid("TEXT_REQUIRED");
 const x=raw.trim();
 if(x.length<12||x.length>MAX_CHARS)invalid("SIZE_OUT_OF_BOUNDS");
 let unwrapped=x;
 if(!x.startsWith("{")){
  // Do not accept full HTTP responses that might contain user cookies, tokens,
  // signature or other sensitive headers. Only the public header's base64 value.
  if(!/^[A-Za-z0-9+/_-]+={0,2}$/.test(x))invalid("JSON_OR_BASE64_PUBLIC_402_ONLY");
  try{
   const normalized=x.replace(/-/g,"+").replace(/_/g,"/");
   const bytes=Uint8Array.from(atob(normalized),c=>c.charCodeAt(0));
   unwrapped=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
  }catch{invalid("INVALID_PUBLIC_HEADER_BASE64");}
 }
 if(unwrapped.length>MAX_CHARS)invalid("DECODED_402_TOO_LARGE");
 let j;try{j=JSON.parse(unwrapped);}catch{invalid("INVALID_402_JSON");}
 if(!asObj(j))invalid("402_MUST_BE_OBJECT");
 scrutinize(j);
 if(!Array.isArray(j.accepts)||j.accepts.length<1||j.accepts.length>6)invalid("REQUIREMENTS_NOT_1_TO_6");
 return j;
}
export const DEMO_V2=Object.freeze({
 x402Version:2,error:"Payment required",
 resource:{url:"https://example.invalid/price-check",description:"FICTIONAL no-wallet example",mimeType:"application/json"},
 accepts:[{scheme:"exact",network:"eip155:8453",amount:"5000",asset:NATIVE_BASE_USDC,payTo:"0x1111111111111111111111111111111111111111",maxTimeoutSeconds:60}],
 extensions:{bazaar:{
  info:{input:{type:"http",method:"GET",queryParams:{sample:"fictional"}},output:{type:"json",example:{ok:true,price_usdc:"0.005"}}},
  schema:{"$schema":"https://json-schema.org/draft/2020-12/schema",type:"object",properties:{input:{type:"object"},output:{type:"object"}},required:["input"]}
 }}
});
export const DEMO_V1=Object.freeze({
 x402Version:1,accepts:[{
  scheme:"exact",network:"base",maxAmountRequired:"5000",asset:NATIVE_BASE_USDC,
  payTo:"0x1111111111111111111111111111111111111111",
  resource:"https://example.invalid/price-check",description:"FICTIONAL v1",
  mimeType:"application/json",outputSchema:{type:"json",example:{ok:true}}
 }]
});
const SCHEMA_LINK="https://github.com/x402-foundation/x402/blob/main/specs/extensions/bazaar.md";
const V2_LINK="https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md";
function dateSafeUrl(x){
 if(typeof x!=="string"||x.length>2048)return false;
 try{const u=new URL(x);return u.protocol==="https:"&&!u.username&&!u.password&&u.hostname.length>1;}
 catch{return false;}
}
export function examinePublic402(data){
 if(!asObj(data)||!Array.isArray(data.accepts)||!data.accepts.length||data.accepts.length>6)invalid("REQUIREMENTS_NOT_1_TO_6");
 scrutinize(data);
 const issues=[];
 const add=(code,severity,text)=>issues.push({code,severity,text});
 const v=data.x402Version;
 const isV1=v===1,isV2=v===2;
 if(!isV1&&!isV2)add("UNSUPPORTED_X402_VERSION","BLOCKER","Expected explicit x402Version 1 or 2.");
 if(isV1)add("LEGACY_V1_ONLY","INFO","Version 1 syntax is not a v2-compatible PaymentRequired header. Do not treat v1 fields as a v2 seller failure.");
 const first=data.accepts[0];
 if(data.accepts.length>1)add("MULTIPLE_PAYMENT_CHOICES","INFO","Multiple public accepts entries exist. Buyers must evaluate every supported choice.");
 let baseValue=null;
 for(let i=0;i<data.accepts.length;i++){
  const a=data.accepts[i];
  if(!asObj(a)){add("INVALID_ACCEPT_ENTRY","BLOCKER","Every accepts entry must be an object.");continue;}
  if(a.scheme!=="exact")add("OTHER_OR_MISSING_SCHEME","INFO","This limited tool only fully checks exact EVM payments.");
  const network=a.network;
  if(isV2&&(!/^[-a-zA-Z0-9]+:[A-Za-z0-9_-]{1,80}$/.test(network??"")))
   add("V2_NETWORK_NOT_CAIP2","BLOCKER","Version 2 network must be a CAIP-2 identifier (e.g. eip155:8453).");
  const value=isV1?a.maxAmountRequired:a.amount;
  if(typeof value!=="string"||!/^[0-9]{1,30}$/.test(value)||BigInt(/^[0-9]{1,30}$/.test(value)?value:"0")<=0n)
   add("MISSING_OR_INVALID_ATOMIC_AMOUNT","BLOCKER","V1 expects maxAmountRequired; V2 expects positive atomic amount as a decimal string.");
  if(isV2&&a.maxAmountRequired!==undefined)add("LEGACY_V1_AMOUNT_KEY_IN_V2","WARNING","Version 2 uses amount, not the legacy maxAmountRequired field. Do not derive the paid amount from that field.");
  if(isV2&&a.outputSchema!==undefined)add("LEGACY_V1_OUTPUT_SCHEMA_IN_V2","WARNING","Version 2 Bazaar discovery belongs under extensions.bazaar, not accepts[*].outputSchema.");
  if(typeof a.asset!=="string"||a.asset.length>160)add("ASSET_UNCLEAR","BLOCKER","A bounded public token identifier is required.");
  if(typeof a.payTo!=="string"||a.payTo.length>160)add("PAYEE_UNCLEAR","BLOCKER","A bounded public destination is required; format alone never establishes custody or merchant authenticity.");
  if(/^eip155:\d+$/.test(network??"")||network==="base"){
   if(!ADDR.test(a.payTo??""))add("EVM_PAYEE_FORMAT_INVALID","BLOCKER","EVM payTo must be a public 20-byte address, not evidence of ownership.");
   if(!ADDR.test(a.asset??""))add("EVM_ASSET_FORMAT_INVALID","BLOCKER","EVM asset should be a public 20-byte contract address.");
  }
  if(i===0&&isV2&&network==="eip155:8453"&&String(a.asset).toLowerCase()===NATIVE_BASE_USDC&&
      /^[0-9]{1,30}$/.test(value??"")){
   const units=BigInt(value);
   baseValue=(units/1000000n)+"."+(units%1000000n).toString().padStart(6,"0");
  }
 }
 if(isV2){
  const resource=data.resource;
  if(!asObj(resource)||!dateSafeUrl(resource.url))
   add("V2_RESOURCE_URL_UNUSABLE","BLOCKER","Version 2 requires resource.url as a public absolute HTTPS URL; no endpoint is fetched.");
  const ext=data.extensions;
  if(!asObj(ext)||!asObj(ext.bazaar)){
   add("NO_BAZAAR_DISCOVERY","WARNING","Payment might still work, but no Bazaar discovery data was supplied. This is not a payment blocker.");
  }else{
   const b=ext.bazaar;
   if(!asObj(b.info)||!asObj(b.info.input)||!["http","mcp"].includes(b.info.input.type))
    add("BAZAAR_INPUT_MISSING_OR_UNCLEAR","WARNING","Bazaar info.input must identify an HTTP request or MCP tool.");
   if(!asObj(b.schema))
    add("BAZAAR_META_SCHEMA_MISSING","WARNING","Bazaar schema validates its info metadata; its absence reduces discoverability and is not the result-schema test.");
   if(!asObj(b.info?.output)||typeof b.info.output.type!=="string"){
    add("BAZAAR_OUTPUT_NOT_DESCRIBED","WARNING","No output type/format/example metadata provided for prepay evaluation.");
   }else{
    add("BAZAAR_EXAMPLE_IS_NOT_A_RESPONSE_CONTRACT","INFO","A type/example cannot prove required response fields, nullable semantics, all errors or actual paid delivery. Bazaar.schema validates metadata info, not automatically the returned JSON.");
    const example=b.info.output.example;
    if(example===undefined)add("BAZAAR_OUTPUT_EXAMPLE_MISSING","WARNING","No synthetic response example appears.");
    else if(asObj(example)&&Object.keys(example).length<=2)
     add("SHALLOW_RESPONSE_EXAMPLE","INFO","Example has at most two fields; it cannot establish a full response contract.");
   }
   if(b.info?.input?.type==="http"&&!["GET","POST","PUT","PATCH","DELETE","HEAD"].includes(b.info.input.method))
    add("BAZAAR_HTTP_METHOD_UNCLEAR","WARNING","Bazaar HTTP input should declare a standard method.");
   if(b.info?.input?.type==="http"&&["POST","PUT","PATCH"].includes(b.info.input.method)&&
      (!b.info.input.bodyType||b.info.input.body===undefined))
    add("BAZAAR_BODY_METHOD_SAMPLE_MISSING","WARNING","Paid JSON POST/PUT/PATCH requests need a documented request body type/example to avoid false dead-endpoint scans.");
  }
 }
 add("PAID_RESPONSE_AND_MERCHANT_UNVERIFIED","INFO","Only public user-pasted payment terms are inspected. No URL fetched, no payment or authenticated seller verified, no resulting JSON schema validated.");
 const blockers=issues.filter(e=>e.severity==="BLOCKER").length;
 const warnings=issues.filter(e=>e.severity==="WARNING").length;
 const discovered=isV2&&asObj(data.extensions?.bazaar);
 return Object.freeze({
  schema:"onecursor-public-x402-metadata-v1",checkedLocally:true,versionObserved:isV1?1:isV2?2:"unknown",
  acceptsInspected:data.accepts.length,paymentShape:!blockers?"NO_STRUCTURAL_BLOCKER_OBSERVED":"STRUCTURAL_BLOCKER_OBSERVED",
  bazaarDisclosed:discovered,bazaarResultContractVerified:false,actualPaidDeliverabilityVerified:false,
  baseNativeCircleUsdcFirstAcceptAmount:baseValue,feeOrSafetyEstimateProvided:false,
  walletsConnected:0,networkRequests:0,fiatRevenueClaimed:0,realBuyerConfirmed:false,
  blockers,warnings,issues,
  nextActions:["Confirm v2 CAIP-2 network, atomic amount, asset and payTo with seller independently.",
    "Ask for a separately versioned machine-readable paid response JSON Schema and error cases; do not infer required fields from a sample.",
    "Use an authorized synthetic test/official client for HTTP method and body; unpaid 402 alone cannot prove actual paid delivery."],
  sources:{v2:V2_LINK,bazaar:SCHEMA_LINK},
  notice:"Research-only syntax/discoverability observations, not a protocol conformance certificate, warranty, permission to pay or investment advice."
 });
}
