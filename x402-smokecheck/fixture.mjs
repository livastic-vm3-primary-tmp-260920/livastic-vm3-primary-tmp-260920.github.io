// Synthetic JSON fixtures for operator-controlled, unpaid x402 POST QA.
// The CLI never logs, stores, or returns submitted fixture content.
import {lstat, readFile} from "node:fs/promises";
const MAX_BYTES = 4096;
const UNSAFE_FIELD = /(?:password|private.?key|secret|seed.?phrase|mnemonic|authoriz(?:ation|e)|bearer|cookie|api.?key|access.?token|refresh.?token|payment.?signature|x.?payment|wallet|session.?id|ssn|passport|email|phone)/i;
const UNSAFE_TEXT = /(?:Bearer\s+[A-Za-z0-9._\-]+|(?:sk|pk)[-_](?:test[_-]|live[_-])?[a-zA-Z0-9]{12,}|0x[a-fA-F0-9]{64}|-----BEGIN\s+(?:RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE KEY-----)/i;
export function parseSyntheticJson(raw) {
  if (typeof raw !== "string" || Buffer.byteLength(raw, "utf8") > MAX_BYTES ||
      Buffer.byteLength(raw, "utf8") < 2) throw new Error("Fixture must be 2..4096 bytes.");
  let parsed;
  try { parsed = JSON.parse(raw); } catch { throw new Error("Fixture must be valid JSON."); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Fixture top level must be one JSON object.");
  let fields = 0;
  function scan(v, depth) {
    if (depth > 8) throw new Error("Fixture structure too deeply nested.");
    if (v === null || typeof v === "boolean" || typeof v === "number") return;
    if (typeof v === "string") {
      if (v.length > 3000 || UNSAFE_TEXT.test(v)) throw new Error("Remove sensitive-looking data from synthetic fixture.");
      return;
    }
    if (Array.isArray(v)) {
      if (v.length > 40) throw new Error("Fixture array too large.");
      for (const item of v) scan(item, depth + 1);
      return;
    }
    if (typeof v !== "object") throw new Error("Unsupported fixture element.");
    for (const [key, value] of Object.entries(v)) {
      fields++;
      if (fields > 80 || key.length > 100) throw new Error("Too many or oversized fixture field names.");
      if (UNSAFE_FIELD.test(key) || key === "__proto__" || key === "constructor")
        throw new Error("Remove secret-bearing or identity fields before probing.");
      scan(value, depth + 1);
    }
  }
  scan(parsed, 0);
  const normalized = JSON.stringify(parsed);
  if (Buffer.byteLength(normalized, "utf8") > MAX_BYTES) throw new Error("Fixture exceeds byte limit.");
  return normalized;
}
export async function readSyntheticJson(filePath) {
  if (!filePath || filePath.startsWith("--") || !filePath.toLowerCase().endsWith(".json"))
    throw new Error("Use one local .json synthetic fixture file.");
  const stat = await lstat(filePath);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > MAX_BYTES || stat.size < 2)
    throw new Error("Fixture must be a small regular file, not a symlink.");
  return parseSyntheticJson(await readFile(filePath,{encoding:"utf8"}));
}
