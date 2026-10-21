/**
 * Read-only, browser-local, FIRST-ROW-ONLY CSV header comparison.
 *
 * Does not parse balances, trade history, real values, tokens, positions,
 * transactions, wallets, names, addresses or taxes. No inferred rename is safe.
 *
 * Koinly says for supported integrations rejected as "Unknown file", don't
 * rewrite the source export: contact Koinly support with the untouched file.
 */
export const MAX_HEADER_CHARS = 2048;
export const MAX_FIELDS = 36;
export const SOURCE = Object.freeze({
  forumReport: "https://discuss.koinly.io/t/strike-exchange-csv-file-appears-to-have-changed-october-2026/28630",
  koinlySupport: "https://support.koinly.io/en/articles/9885319-how-to-modify-csv-files-to-import-them-to-koinly"
});
export const FICTIONAL_OLD = "Time,Type,Amount,Currency,Fee";
export const FICTIONAL_NEW = "Timestamp,Transaction Type,Quantity,Asset,Fee";
const SEPARATORS = Object.freeze([",",";","\t"]);
const sensitive = /(?:-----BEGIN|0x[a-f0-9]{40}|[^\s@]+@[^\s@]+\.[a-z]{2,}|(?:^|[\s_-])(?:private[\s_-]?key|seed[\s_-]?phrase|mnemonic|password|api[\s_-]?key)(?:$|[\s_-]))/i;
const values = /^(?:\d{4}[-/]\d{2}[-/]\d{2}(?:\s|$)|[+-]?\d{3,}(?:[.,]\d+)?$|[+-]?\d+\.\d{5,}$)/;
function issue(code) {
  const e = new Error(code);
  e.code = code;
  throw e;
}
function quotedHeaders(line, sep) {
  const cells = [];
  let field = "", open = false, closed = false, atStart = true;
  for (let pos = 0; pos < line.length; pos++) {
    const char = line[pos];
    if (open) {
      if (char !== '"') {field += char;continue;}
      if (line[pos + 1] === '"') {field += '"'; pos++;continue;}
      open = false;closed = true;continue;
    }
    if (char === sep) {
      cells.push(field); field = ""; open = false; closed = false; atStart = true;continue;
    }
    if (closed) {
      if (char === " " || char === "\t") continue;
      issue("INVALID_CSV_HEADER_QUOTING");
    }
    if (char === '"') {
      if (!atStart || field.length) issue("INVALID_CSV_HEADER_QUOTING");
      open = true;atStart = false;continue;
    }
    field += char;
    if (char.trim().length > 0) atStart = false;
  }
  if (open) issue("UNTERMINATED_CSV_HEADER_QUOTE");
  cells.push(field);
  return cells;
}
const keyFor = value => value.normalize("NFKC").trim().replace(/\s+/g," ").toLowerCase();
export function parseHeaderOnly(value) {
  if (typeof value !== "string") issue("HEADER_TEXT_REQUIRED");
  // A single header row, optionally terminated by a single newline.
  let line = value.replace(/^\uFEFF/,"").replace(/\r?\n$/,"");
  if (!line.trim()) issue("EMPTY_HEADER");
  if (line.length > MAX_HEADER_CHARS) issue("HEADER_TOO_LONG");
  if (/[\r\n\u0000]/.test(line)) issue("MULTIROW_INPUT_REFUSED");
  if (sensitive.test(line)) issue("POTENTIAL_SENSITIVE_DATA_REFUSED");
  const candidates = SEPARATORS.map(delimiter => {
    try {
      return {delimiter,cells:quotedHeaders(line,delimiter),error:null};
    } catch(e) {
      return {delimiter,cells:[],error:e.code||"INVALID_CSV_HEADER_QUOTING"};
    }
  }).filter(x => !x.error);
  if (!candidates.length) issue("INVALID_CSV_HEADER_QUOTING");
  candidates.sort((a,b) => b.cells.length-a.cells.length);
  const selected = candidates[0];
  const cells = selected.cells.map(c=>c.trim());
  if (cells.length<2)issue("SINGLE_COLUMN_CANNOT_COMPARE");
  if (cells.length>MAX_FIELDS)issue("TOO_MANY_HEADER_FIELDS");
  if (cells.some(c=>!c||c.length>128))issue("EMPTY_OR_OVERSIZE_HEADER_FIELD");
  if (cells.some(c=>sensitive.test(c)||values.test(c)))issue("POTENTIAL_DATA_ROW_OR_SENSITIVE_FIELD");
  const keys = cells.map(keyFor);
  if (new Set(keys).size !== keys.length)issue("DUPLICATE_OR_COLLIDING_HEADER_FIELD");
  return Object.freeze({delimiter:selected.delimiter,cells:Object.freeze(cells),
    keys:Object.freeze(keys),count:cells.length});
}
export function comparePublicHeaderShapes(before,after) {
  const current = parseHeaderOnly(after);
  if (before==null || before.trim()==="") return Object.freeze({
    code:"CURRENT_HEADER_ONLY_NO_OLD_SAMPLE",oldCount:0,newCount:current.count,
    oldOnly:[],newOnly:[],sameFieldsDifferentOrder:false,
    separatorChanged:false,requiresKoinlySupport:true,
    automaticRewriteAllowed:false,uploadOrNetworkCall:false,actualImportTested:false,
    note:"Current header inspected locally, but no supported prior export was supplied. This cannot prove what changed."
  });
  const original = parseHeaderOnly(before);
  const pre = new Set(original.keys),post = new Set(current.keys);
  const oldOnly = original.cells.filter((_x,i)=>!post.has(original.keys[i]));
  const newOnly = current.cells.filter((_x,i)=>!pre.has(current.keys[i]));
  const sameSet = oldOnly.length===0 && newOnly.length===0;
  const reordered = sameSet && original.keys.some((k,i)=>k!==current.keys[i]);
  const separatorChanged = original.delimiter!==current.delimiter;
  const cosmetic = sameSet && !reordered && original.cells.some((v,i)=>v!==current.cells[i]);
  const unchanged = sameSet && !reordered && !cosmetic && !separatorChanged;
  const code = unchanged ? "NO_HEADER_DIFFERENCE_OBSERVED"
    : sameSet && separatorChanged ? "CSV_SEPARATOR_CHANGED"
    : reordered ? "CSV_FIELD_ORDER_CHANGED"
    : cosmetic ? "HEADER_CASE_OR_SPACING_CHANGED"
    : "HEADER_COLUMNS_CHANGED";
  return Object.freeze({
    code,oldCount:original.count,newCount:current.count,
    oldOnly:Object.freeze(oldOnly),newOnly:Object.freeze(newOnly),
    sameFieldsDifferentOrder:reordered,separatorChanged,
    requiresKoinlySupport:true,automaticRewriteAllowed:false,
    uploadOrNetworkCall:false,actualImportTested:false,
    note:"This inspects ONLY user-pasted header names. Do not infer row, currency, fee or tax semantics or edit a supported exchange export."
  });
}
