#!/usr/bin/env node
// No payment headers or authorization are ever sent. All probes require endpoint-owner consent.
import {request} from "node:https";
import {lookup} from "node:dns/promises";
import {isIP} from "node:net";
import {diagnose} from "./checker.mjs";

const flags = process.argv.slice(2);
function option(key) {
  const pos = flags.indexOf(key);
  return pos >= 0 ? flags[pos + 1] : null;
}
function die(message) {
  process.stderr.write("ERROR: " + message + "\n");
  process.exit(1);
}
function help() {
  console.log("x402 Browser Readiness Check v1.0.0 — owner-authorized, READ ONLY");
  console.log("Usage: node cli.mjs --url https://YOUR-PUBLIC-PAID-ENDPOINT --origin https://YOUR-APP --method GET --i-control-endpoint [--json] [--legacy]");
  console.log("POST probes additionally need --permit-unpaid-post. No wallet, signature, credentials, or money involved.");
}
function publicIp(address) {
  if (!isIP(address)) return false;
  const ip = String(address).toLowerCase();
  if (ip.includes(":")) {
    if (ip === "::1" || ip === "::" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) return false;
    // Fail-closed for exotic IPv6 address types and IPv4 mapped literals.
    return /^2[0-9a-f]{3}:|^3[0-9a-f]{3}:|^2001:/.test(ip) && !ip.startsWith("2001:db8:");
  }
  const a = ip.split(".").map(Number);
  if (a.length !== 4 || a.some(x => x < 0 || x > 255)) return false;
  return !(
    a[0] === 0 || a[0] === 10 || a[0] === 127 || a[0] >= 224 ||
    (a[0] === 100 && a[1] >= 64 && a[1] <= 127) ||
    (a[0] === 169 && a[1] === 254) ||
    (a[0] === 172 && a[1] >= 16 && a[1] <= 31) ||
    (a[0] === 192 && (a[1] === 168 || a[1] === 0)) ||
    (a[0] === 198 && (a[1] === 18 || a[1] === 19))
  );
}
function pickHeaders(all) {
  const allow = ["access-control-allow-origin", "access-control-allow-methods",
    "access-control-allow-headers", "access-control-allow-credentials",
    "access-control-expose-headers", "access-control-max-age", "payment-required",
    "payment-response", "cache-control", "vary", "x-payment-response"];
  return Object.fromEntries(allow.filter(k => all[k] !== undefined).map(k => [k, all[k]]));
}
async function probe(url, method, extraHeaders, pinnedIps) {
  return await new Promise((resolve, reject) => {
    const req = request(url, {
      method, headers: extraHeaders, timeout: 9000, maxHeaderSize: 24576,
      // Only vetted IPs from the first DNS resolution may be used.
      lookup(hostname, options, callback) {
        const family = options && options.family;
        const ip = pinnedIps.find(x => !family || x.family === family) || pinnedIps[0];
        if (!ip) return callback(new Error("Public DNS address unavailable"));
        if (options && options.all) return callback(null, pinnedIps.filter(x => !family || x.family === family));
        callback(null, ip.address, ip.family);
      }
    }, res => {
      const output = {status: res.statusCode || 0, headers: pickHeaders(res.headers)};
      resolve(output); // headers are enough; do not read a resource body
      res.destroy(); // bound network usage; discard body immediately
    });
    req.on("timeout", () => req.destroy(new Error("Timeout")));
    req.on("error", reject);
    req.end(); // never sends a payment signature, user content, or wallet authorization
  });
}
async function main() {
  if (flags.includes("--help") || flags.length === 0) { help(); return; }
  const urlRaw = option("--url"), originRaw = option("--origin");
  const method = (option("--method") || "GET").toUpperCase();
  if (!flags.includes("--i-control-endpoint")) die("Explicit endpoint operator authorization flag is required.");
  if (!urlRaw || !originRaw) die("Provide --url and --origin.");
  if (!["GET", "POST"].includes(method)) die("Only GET and POST paid methods are accepted.");
  if (method === "POST" && !flags.includes("--permit-unpaid-post")) die("POST probe requires explicit --permit-unpaid-post (may reach a misconfigured unprotected handler).");
  let u;
  try {u = new URL(urlRaw);} catch {die("Invalid URL.");}
  if (u.protocol !== "https:" || u.username || u.password || u.search || u.hash ||
      u.port && u.port !== "443" || u.href.length > 1500) die("Require public HTTPS endpoint on port 443; no credentials, query or fragment.");
  if (isIP(u.hostname) || u.hostname === "localhost" || u.hostname.endsWith(".local") || !u.hostname.includes(".")) die("Use a public DNS name, never localhost, private IP or local network.");
  let origin;
  try {origin = new URL(originRaw);} catch {die("Invalid origin.");}
  if (origin.protocol !== "https:" || origin.pathname !== "/" || origin.search || origin.hash ||
      origin.username || origin.password) die("Browser origin must be HTTPS scheme + hostname only.");
  const answers = await lookup(u.hostname, {all:true,verbatim:true});
  if (!answers.length || answers.some(x => !publicIp(x.address))) die("DNS includes private, reserved, or unsupported addresses; fail closed.");
  const common = {"Origin": origin.origin, "User-Agent": "x402-browser-readiness/1.0.0 (read-only unpaid diagnostic)"};
  const preflight = await probe(u, "OPTIONS", {...common,
    "Access-Control-Request-Method":method,
    "Access-Control-Request-Headers": method === "POST" ? "payment-signature,content-type" : "payment-signature"}, answers);
  const challenge = await probe(u, method, common, answers);
  const report = diagnose({origin:origin.origin, method, preflight, challenge, legacy:flags.includes("--legacy")});
  if (flags.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else {
    console.log("x402 browser readiness — " + report.overall + " (" + report.blockers + " blockers, " + report.warnings + " warnings)");
    console.log("OPTIONS: " + report.observed.optionsStatus + " | unpaid request: " + report.observed.requestStatus);
    for (const check of report.checks) console.log(check.status.padEnd(8) + " " + check.code + " — " + check.detail);
    console.log("No payment or wallet signature was sent. This is not a settlement test.");
  }
  process.exitCode = report.blockers ? 2 : 0;
}
main().catch(error => die(error && error.code ? error.code : "Read-only probe failed; check network and intended method."));
