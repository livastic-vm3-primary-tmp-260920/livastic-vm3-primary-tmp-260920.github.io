// x402 Browser Readiness Check — deterministic, read-only diagnostics.
// No wallet connection, no transaction signing, no user secrets.
const HEADER_ALLOW = [
  "access-control-allow-origin", "access-control-allow-methods",
  "access-control-allow-headers", "access-control-allow-credentials",
  "access-control-expose-headers", "access-control-max-age",
  "payment-required", "payment-response", "cache-control", "vary"
];
function headers(h) {
  const out = {};
  for (const key of HEADER_ALLOW) {
    const value = h && (h[key] ?? h[key.toLowerCase()]);
    if (value !== undefined) {
      // Never include raw x402 challenge/payment payloads in output.
      out[key] = key === "payment-required" || key === "payment-response" ?
        "[present]" : String(Array.isArray(value) ? value.join(", ") : value).slice(0, 500);
    }
  }
  return out;
}
function get(raw, key) {
  return (raw && (raw[key] ?? raw[key.toLowerCase()])) || "";
}
function tokens(s) {
  return String(s).toLowerCase().split(",").map(x => x.trim()).filter(Boolean);
}
function originOkay(value, origin, credentials) {
  return value === origin || (value === "*" && !credentials);
}
function hasHeader(value, header, credentials) {
  const t = tokens(value);
  return t.includes(header.toLowerCase()) || (t.includes("*") && !credentials);
}
export function diagnose({origin, method = "GET", preflight, challenge, credentials = false, legacy = false}) {
  const checks = [];
  const add = (code, pass, severity, reason) => checks.push({code, status: pass ? "PASS" : severity, detail: reason});
  const m = String(method).toUpperCase();
  const pf = preflight || {status: 0, headers: {}};
  const ch = challenge || {status: 0, headers: {}};
  const ph = pf.headers || {};
  const chh = ch.headers || {};
  if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(origin)) throw new Error("Origin must be an HTTPS scheme + host, without a path.");
  if (!["GET", "POST"].includes(m)) throw new Error("Only GET or POST is supported.");
  add("PREFLIGHT_2XX", pf.status >= 200 && pf.status <= 299, "BLOCKER",
      "An OPTIONS preflight must succeed without payment or authorization.");
  add("PREFLIGHT_ALLOW_ORIGIN", originOkay(get(ph, "access-control-allow-origin"), origin, credentials), "BLOCKER",
      "OPTIONS must allow the intended browser Origin.");
  add("PREFLIGHT_ALLOW_METHOD", tokens(get(ph, "access-control-allow-methods")).includes(m.toLowerCase()), "BLOCKER",
      "OPTIONS must allow the intended paid request method.");
  add("PREFLIGHT_PAYMENT_SIGNATURE", hasHeader(get(ph, "access-control-allow-headers"), "payment-signature", credentials),
      "BLOCKER", "OPTIONS must allow the x402 v2 PAYMENT-SIGNATURE request header.");
  if (m === "POST") add("PREFLIGHT_CONTENT_TYPE", hasHeader(get(ph, "access-control-allow-headers"), "content-type", credentials),
      "BLOCKER", "A JSON POST preflight must allow Content-Type.");
  if (legacy) add("PREFLIGHT_X_PAYMENT", hasHeader(get(ph, "access-control-allow-headers"), "x-payment", credentials),
      "BLOCKER", "Dual-version service must allow the v1 X-PAYMENT request header.");
  if (credentials) {
    add("PREFLIGHT_CREDENTIALS", String(get(ph, "access-control-allow-credentials")).toLowerCase() === "true",
      "BLOCKER", "Credentialed browser requests require Access-Control-Allow-Credentials: true.");
  }
  if (ch.status !== 402) {
    add("UNPAID_CHALLENGE_402", false, "WARNING",
        "Without an HTTP 402 challenge, the expected priced path was not observed. A 200/404/405 can mean wrong route or method.");
  } else {
    add("CHALLENGE_ALLOW_ORIGIN", originOkay(get(chh, "access-control-allow-origin"), origin, credentials),
      "BLOCKER", "HTTP 402 response must allow browser to read its headers.");
    add("CHALLENGE_PAYMENT_REQUIRED_PRESENT", Boolean(get(chh, "payment-required")),
      "BLOCKER", "x402 v2 priced route should return a PAYMENT-REQUIRED response header.");
    add("CHALLENGE_EXPOSE_PRICE", hasHeader(get(chh, "access-control-expose-headers"), "payment-required", credentials),
      "BLOCKER", "Browser must be allowed to read PAYMENT-REQUIRED. Without it the price is opaque.");
    add("SUCCESS_EXPOSE_RECEIPT_CLAIM", hasHeader(get(chh, "access-control-expose-headers"), "payment-response", credentials),
      "WARNING", "Check whether paid responses also expose PAYMENT-RESPONSE; unpaid 402 alone cannot prove it.");
    if (legacy) add("V1_EXPOSE_PAYMENT_RESPONSE", hasHeader(get(chh, "access-control-expose-headers"), "x-payment-response", credentials),
      "WARNING", "Dual-version paid responses should expose X-PAYMENT-RESPONSE; verify separately on a safe fixture.");
    const aco = String(get(chh, "access-control-allow-origin"));
    if (aco === origin) add("VARY_ORIGIN", tokens(get(chh, "vary")).includes("origin"), "WARNING",
      "Reflecting per-request Origins should include Vary: Origin to prevent shared cache mistakes.");
    const cc = String(get(chh, "cache-control")).toLowerCase();
    add("NO_SHARED_402_CACHE", /no-store|private/.test(cc), "WARNING",
      "A priced challenge should not be cached in a shared intermediary.");
  }
  const count = kind => checks.filter(x => x.status === kind).length;
  return {
    version: "1.0.0",
    scope: "Unpaid browser-header readiness only. NOT payment verification, spend-control, chain finality, or a paid-response test.",
    origin, method: m, credentials, legacy,
    observed: {optionsStatus: pf.status, requestStatus: ch.status,
      optionsHeaderNames: Object.keys(headers(ph)),
      requestHeaderNames: Object.keys(headers(chh))},
    blockers: count("BLOCKER"), warnings: count("WARNING"),
    overall: count("BLOCKER") ? "BLOCKED" : count("WARNING") ? "REVIEW" : "PREFLIGHT_READY_UNVERIFIED_PAID",
    checks
  };
}
