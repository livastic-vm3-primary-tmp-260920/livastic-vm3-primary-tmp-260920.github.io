/* x402 HAR failure triage. No I/O. No network. Never preserve raw headers. */
const MAX_CHARS = 2_000_000;
const MAX_ENTRIES = 400;
const MAX_CHALLENGE = 32_000;

const notice = {
  HAR_NOT_CAPTURED: ["info", "No x402-like exchange was found. Export browser HAR with the relevant public test requests, or use the example."],
  PREFLIGHT_FAILED: ["high", "An OPTIONS preflight received a non-2xx response; the browser may block the paid retry before the API sees a signature."],
  PREFLIGHT_DENIES_PAYMENT_HEADER: ["high", "An observed preflight did not allow one or more requested headers, potentially blocking the payment retry."],
  PREFLIGHT_DENIES_METHOD: ["high", "The observed preflight did not allow the requested method."],
  PREFLIGHT_NOT_CAPTURED: ["info", "A signed retry appears in the trace, but an OPTIONS preflight was not captured. This does not by itself prove a CORS fault."],
  CHALLENGE_MISSING_HEADER: ["medium", "An HTTP 402 did not contain PAYMENT-REQUIRED or X-PAYMENT-REQUIRED. Some older implementations convey requirements in the body, so check the protocol version."],
  CHALLENGE_UNREADABLE: ["medium", "The available x402 challenge header could not be decoded as a bounded JSON object; confirm the server's supported wire format."],
  CHALLENGE_V1: ["info", "A legacy x402 v1 challenge was observed. Do not assume a v2-only client or header convention will interoperate."],
  CHALLENGE_V2: ["info", "At least one x402 v2 public challenge was observed. This is not evidence of a settled payment."],
  CHALLENGE_MISSING_ACCEPTS: ["medium", "A parsed v2 challenge has no nonempty accepts array; a buyer cannot select an advertised payment method from this header."],
  CORS_CHALLENGE_HEADER_HIDDEN: ["high", "A cross-origin 402 response did not expose PAYMENT-REQUIRED via Access-Control-Expose-Headers. Browser JavaScript may see the status but not read the challenge."],
  CORS_RESPONSE_ORIGIN_MISMATCH: ["high", "A cross-origin response lacks a compatible Access-Control-Allow-Origin value. The browser may block access to that response."],
  RETRY_REJECTED: ["medium", "A request containing an x402 payment header still received HTTP 402. A retry was attempted; its rejection reason cannot be determined from status alone."],
  RETRY_HTTP_SUCCESS: ["info", "A payment-header request received an HTTP 2xx. This is NOT proof of on-chain settlement or fulfilled delivery."],
  PREPAY_400_422: ["info", "An unsigned request received HTTP 400 or 422. This may be input validation before payment, not failed settlement."],
  OVERLARGE_PAYMENT_HEADER: ["medium", "A challenge header was very large. Some HTTP servers and intermediaries reject headers with size limits."],
  NO_SETTLEMENT_VERIFICATION: ["info", "HAR alone cannot establish USDC network/token, tx hash, confirmations, unique invoice matching, or final settlement."]
};

function headers(raw) {
  const out = new Map();
  if (!Array.isArray(raw)) return out;
  for (const h of raw.slice(0, 100)) {
    if (typeof h?.name === "string" && typeof h?.value === "string" && h.name.length < 100) {
      out.set(h.name.toLowerCase(), h.value);
    }
  }
  return out;
}
function tokens(v) { return String(v || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean); }
function allowed(origin, actual, credentials) {
  if (!origin) return true;
  if (actual === origin) return true;
  return actual === "*" && !credentials;
}
function isObject(x) { return x !== null && typeof x === "object" && !Array.isArray(x); }
function parseChallenge(raw) {
  if (typeof raw !== "string" || !raw.trim() || raw.length > MAX_CHALLENGE) return null;
  try {
    let candidate = raw.trim();
    if (!candidate.startsWith("{")) {
      // PaymentRequired v2 is encoded as URL-safe base64 JSON, not a signature.
      if (!/^[A-Za-z0-9_+\/-]+={0,2}$/.test(candidate)) return null;
      candidate = candidate.replace(/-/g, "+").replace(/_/g, "/");
      if (candidate.length % 4 === 1) return null;
      candidate = new TextDecoder("utf-8", {fatal:true}).decode(Uint8Array.from(atob(candidate.padEnd(Math.ceil(candidate.length/4)*4, "=")), c => c.charCodeAt(0)));
    }
    const parsed = JSON.parse(candidate);
    if (!isObject(parsed)) return null;
    const version = parsed.x402Version === 1 || parsed.x402Version === 2 ? parsed.x402Version : null;
    const hasAccepts = Array.isArray(parsed.accepts) && parsed.accepts.length > 0;
    return { version, hasAccepts };
  } catch { return null; }
}
function checkInput(input) {
  let source = input;
  if (typeof input === "string") {
    if (input.length > MAX_CHARS) throw new Error("HAR exceeds 2 MB text limit.");
    try { source = JSON.parse(input); } catch { throw new Error("Not valid HAR JSON."); }
  }
  if (!isObject(source) || !isObject(source.log) || !Array.isArray(source.log.entries)) {
    throw new Error("Expected a standard HAR object with log.entries array.");
  }
  if (source.log.entries.length > MAX_ENTRIES) throw new Error("HAR exceeds 400 entries. Trim locally first.");
  return source.log.entries;
}

export function analyzeHar(input) {
  const entries = checkInput(input);
  const codes = new Set();
  const counts = { inspected: entries.length, challenges402: 0, paymentHeaderRequests: 0, unsigned400or422: 0, preflightsObserved: 0, http2xxAfterHeader: 0 };
  const paymentHeaders = ["payment-signature", "x-payment"];
  let noticedSigned = false;
  let noticedPreflight = false;
  for (const entry of entries) {
    if (!isObject(entry)) continue;
    const req = entry.request || {};
    const res = entry.response || {};
    const rq = headers(req.headers);
    const rs = headers(res.headers);
    const method = String(req.method || "").toUpperCase();
    const status = Number(res.status);
    if (!Number.isInteger(status) || status < 0 || status > 599) continue;
    const origin = rq.get("origin") || "";
    const allowOrigin = rs.get("access-control-allow-origin") || "";
    const credentials = rq.has("cookie") || rq.has("authorization");
    const hasPaid = paymentHeaders.some(h => rq.has(h));
    if (method === "OPTIONS" && (rq.has("access-control-request-headers") || rq.has("access-control-request-method"))) {
      noticedPreflight = true;
      counts.preflightsObserved++;
      if (status < 200 || status >= 300) codes.add("PREFLIGHT_FAILED");
      const requested = tokens(rq.get("access-control-request-headers"));
      const permitted = tokens(rs.get("access-control-allow-headers"));
      if (requested.some(h => !permitted.includes(h) && !permitted.includes("*"))) codes.add("PREFLIGHT_DENIES_PAYMENT_HEADER");
      const methodWanted = String(rq.get("access-control-request-method") || "").toLowerCase();
      const methods = tokens(rs.get("access-control-allow-methods"));
      if (methodWanted && !methods.includes(methodWanted) && !methods.includes("*")) codes.add("PREFLIGHT_DENIES_METHOD");
      if (origin && !allowed(origin, allowOrigin, credentials)) codes.add("CORS_RESPONSE_ORIGIN_MISMATCH");
    }
    if (status === 402) {
      counts.challenges402++;
      const challenge = rs.get("payment-required") || rs.get("x-payment-required");
      if (!challenge) codes.add("CHALLENGE_MISSING_HEADER");
      else {
        if (challenge.length > 8000) codes.add("OVERLARGE_PAYMENT_HEADER");
        const parsed = parseChallenge(challenge);
        if (!parsed) codes.add("CHALLENGE_UNREADABLE");
        else if (parsed.version === 1) codes.add("CHALLENGE_V1");
        else if (parsed.version === 2) {
          codes.add("CHALLENGE_V2");
          if (!parsed.hasAccepts) codes.add("CHALLENGE_MISSING_ACCEPTS");
        }
      }
      if (origin && !allowed(origin, allowOrigin, credentials)) codes.add("CORS_RESPONSE_ORIGIN_MISMATCH");
      if (origin && challenge) {
        const exposed = tokens(rs.get("access-control-expose-headers"));
        if (!exposed.includes("*") && !exposed.includes("payment-required") && !exposed.includes("x-payment-required")) {
          codes.add("CORS_CHALLENGE_HEADER_HIDDEN");
        }
      }
    }
    if (hasPaid) {
      noticedSigned = true;
      counts.paymentHeaderRequests++;
      if (status === 402) codes.add("RETRY_REJECTED");
      if (status >= 200 && status < 300) {
        counts.http2xxAfterHeader++;
        codes.add("RETRY_HTTP_SUCCESS");
      }
      if (origin && !allowed(origin, allowOrigin, credentials)) codes.add("CORS_RESPONSE_ORIGIN_MISMATCH");
    } else if (status === 400 || status === 422) {
      counts.unsigned400or422++;
      codes.add("PREPAY_400_422");
    }
  }
  if (noticedSigned && !noticedPreflight) codes.add("PREFLIGHT_NOT_CAPTURED");
  if (counts.challenges402 === 0 && !noticedSigned && counts.unsigned400or422 === 0) codes.add("HAR_NOT_CAPTURED");
  if (noticedSigned) codes.add("NO_SETTLEMENT_VERIFICATION");
  const order = { high: 0, medium: 1, info: 2 };
  const findings = [...codes].map(code => ({ code, severity: notice[code][0], message: notice[code][1] }))
    .sort((a,b) => order[a.severity] - order[b.severity] || a.code.localeCompare(b.code));
  // Never include headers, URLs, request or response bodies, cookies, signatures or addresses.
  return { schema: "x402-har-diagnostic/1.0", privacy: "metadata-and-authored-findings-only", counts, findings,
    settlementVerified: false, buyerPaymentsCreated: 0 };
}

export function sampleHar() {
  const publicRequirement = btoa(JSON.stringify({ x402Version: 2,
    resource: { url: "https://example.invalid/fictional" },
    accepts: [{ scheme: "exact", network: "eip155:8453", asset: "synthetic-placeholder", amount: "5000" }]
  }));
  const header = (name,value) => ({name,value});
  const syntheticUrl = "https://example.invalid/test";
  return { log: { version: "1.2", creator: {name:"fictional test",version:"1.0"}, entries: [
    { request:{url:syntheticUrl,method:"GET",headers:[header("Origin","https://buyer.example")]},
      response:{status:402,headers:[header("PAYMENT-REQUIRED",publicRequirement),header("Access-Control-Allow-Origin","https://buyer.example")]} },
    { request:{url:syntheticUrl,method:"OPTIONS",headers:[header("Origin","https://buyer.example"),
      header("Access-Control-Request-Headers","payment-signature"),header("Access-Control-Request-Method","POST")]},
      response:{status:204,headers:[header("Access-Control-Allow-Origin","https://buyer.example"),
        header("Access-Control-Allow-Methods","POST"),header("Access-Control-Allow-Headers","content-type")]} },
    { request:{url:syntheticUrl,method:"POST",headers:[header("Origin","https://buyer.example"),
      header("PAYMENT-SIGNATURE","FICTIONAL_DO_NOT_SIGN")]},
      response:{status:402,headers:[header("Access-Control-Allow-Origin","https://buyer.example")]} }
  ] }};
}
