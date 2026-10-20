/*
 * Original One Cursor read-only Koinly-template structure preflight.
 * Public official Koinly templates (June 2026):
 * https://support.koinly.io/en/articles/9489976-how-to-create-a-custom-csv-file-with-your-data
 * https://support.koinly.io/en/articles/9885319-how-to-modify-csv-files-to-import-them-to-koinly
 *
 * No network, wallet, tax treatment, CSV modification, private row values
 * or confirmation that a real upload to Koinly succeeds.
 */
export const MAX_BYTES = 512 * 1024;
export const MAX_ROWS = 200;
export const MAX_COLUMNS = 36;
export const MAX_CELL = 16384;
export const TEMPLATE_REQUIRED = Object.freeze({
  simple: Object.freeze(["Koinly Date", "Amount", "Currency"]),
  trades: Object.freeze(["Koinly Date", "Pair", "Side", "Amount", "Total"]),
  universal: Object.freeze(["Date", "Sent Amount", "Sent Currency", "Received Amount", "Received Currency"])
});

function parseFail(code, position) {
  const e = new Error(code);
  e.code = code;
  e.position = position;
  throw e;
}

/**
 * Bounded strict RFC-style CSV parser. Returns local in-memory rows.
 * Every caller must avoid logging or displaying raw cells.
 */
export function parseCsv(input) {
  if (typeof input !== "string") parseFail("TYPE_MUST_BE_TEXT", 0);
  if (new TextEncoder().encode(input).byteLength > MAX_BYTES) parseFail("FILE_TOO_LARGE", 0);
  if (input.includes("\0")) parseFail("BINARY_NUL_REJECTED", 0);
  if (input.charCodeAt(0) === 0xfeff) input = input.slice(1);
  if (input.length === 0) parseFail("EMPTY_FILE", 0);
  let rows = [], row = [], field = "", inQuotes = false, afterQuote = false;
  let justTerminated = false;
  const append = (s, pos) => {
    field += s;
    if (field.length > MAX_CELL) parseFail("CELL_TOO_LONG", pos);
  };
  const endCell = () => {
    row.push(field);
    if (row.length > MAX_COLUMNS) parseFail("TOO_MANY_COLUMNS", -1);
    field = "";afterQuote = false;
  };
  const endRow = () => {
    endCell();
    // One wholly blank line is an ignorable separator; no guessing about data.
    if (!(row.length === 1 && row[0] === "")) {
      rows.push(row);
      if (rows.length > MAX_ROWS + 1) parseFail("TOO_MANY_ROWS", -1);
    }
    row = [];
    justTerminated = true;
  };
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          append('"', i); i++;
        } else {
          inQuotes = false; afterQuote = true;
        }
      } else {
        append(c, i);
      }
      justTerminated = false;
    } else {
      if (c === '"') {
        if (afterQuote || field.length) parseFail("UNEXPECTED_QUOTE", i);
        inQuotes = true; justTerminated = false;
      } else if (c === ",") {
        endCell(); justTerminated = false;
      } else if (c === "\n" || c === "\r") {
        endRow();
        if (c === "\r" && input[i + 1] === "\n") i++;
      } else {
        if (afterQuote) parseFail("TEXT_AFTER_CLOSING_QUOTE", i);
        append(c, i);justTerminated = false;
      }
    }
  }
  if (inQuotes) parseFail("UNCLOSED_QUOTE", input.length);
  if (!justTerminated || row.length || field.length || afterQuote) endRow();
  if (!rows.length) parseFail("NO_ROWS", 0);
  return rows;
}

const realUtcDate = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(v);
  if (!m) return false;
  const [year, month, day, hour, minute, second] = m.slice(1).map(Number);
  if (year < 1970 || year > 2100 || month < 1 || month > 12 ||
      day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) return false;
  const d = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return d.getUTCFullYear() === year &&
    d.getUTCMonth() + 1 === month && d.getUTCDate() === day &&
    d.getUTCHours() === hour && d.getUTCMinutes() === minute &&
    d.getUTCSeconds() === second;
};
const validDecimal = (value, allowNegative) =>
  new RegExp(allowNegative
    ? "^-(?:0|[1-9]\\d*)(?:\\.\\d{1,18})?$|^(?:0|[1-9]\\d*)(?:\\.\\d{1,18})?$"
    : "^(?:0|[1-9]\\d*)(?:\\.\\d{1,18})?$"
  ).test(value) && !/^-?0(?:\.0+)?$/.test(value);
const symbol = (v) => v.length > 0 && v.length < 45 &&
  /^[A-Za-z0-9][A-Za-z0-9:._/-]*$/.test(v);
const pair = (v) => /^[A-Za-z0-9]{2,18}[-/][A-Za-z0-9]{2,18}$/.test(v);

function safeIssue(code, severity, row, field = null) {
  // Every code and field is an authored static identifier or canonical
  // template name; no cells/header text, private refs or hashes leak out.
  return Object.freeze({ code, severity, row, field });
}

/**
 * Returns metadata and sanitized issue codes only, never private row values.
 * 'structurallyReady' does NOT mean a Koinly account accepted this file.
 */
export function inspectCsv(text, template) {
  if (!Object.hasOwn(TEMPLATE_REQUIRED, template)) parseFail("UNKNOWN_TEMPLATE", 0);
  const rows = parseCsv(text);
  const required = TEMPLATE_REQUIRED[template];
  const issues = [];
  const header = rows[0];
  const positions = new Map();
  header.forEach((h, i) => {
    if (positions.has(h)) issues.push(safeIssue("DUPLICATE_EXACT_HEADER", "error", 1, null));
    else positions.set(h, i);
    if (h.trim() !== h) issues.push(safeIssue("HEADER_HAS_EXTRA_SPACES", "error", 1, null));
    if (/^[=+@-]/.test(h)) issues.push(safeIssue("SPREADSHEET_FORMULA_HEADER", "error", 1, null));
  });
  for (const name of required) {
    if (!positions.has(name)) issues.push(safeIssue("MISSING_REQUIRED_HEADER", "error", 1, name));
  }
  const get = (r, k) => positions.has(k) ? r[positions.get(k)] : null;
  const dateName = template === "universal" ? "Date" : "Koinly Date";
  for (let ri = 1; ri < rows.length; ri++) {
    const r = rows[ri], displayRow = ri + 1;
    if (r.length !== header.length) {
      issues.push(safeIssue("COLUMN_COUNT_MISMATCH", "error", displayRow));
      continue;
    }
    if (positions.has(dateName) && !realUtcDate(get(r, dateName))) {
      issues.push(safeIssue("UTC_DATE_FORMAT_OR_CALENDAR", "error", displayRow, dateName));
    }
    if (template === "simple") {
      const amount = get(r, "Amount"), currency = get(r, "Currency");
      if (amount !== null && !validDecimal(amount, true))
        issues.push(safeIssue("INVALID_SIMPLE_SIGNED_AMOUNT", "error", displayRow, "Amount"));
      if (currency !== null && !symbol(currency))
        issues.push(safeIssue("MISSING_OR_INVALID_CURRENCY", "error", displayRow, "Currency"));
    } else if (template === "trades") {
      const base = get(r,"Amount"), total = get(r,"Total"),
            side = get(r,"Side"), p = get(r,"Pair");
      for (const [label,value] of [["Amount",base],["Total",total]]) {
        if (value !== null && !validDecimal(value,false))
          issues.push(safeIssue("INVALID_TRADE_POSITIVE_AMOUNT", "error", displayRow, label));
      }
      if (side !== null && !/^(buy|sell)$/i.test(side))
        issues.push(safeIssue("SIDE_MUST_BE_BUY_OR_SELL", "error", displayRow, "Side"));
      if (p !== null && !pair(p))
        issues.push(safeIssue("PAIR_MUST_HAVE_BASE_AND_QUOTE", "error", displayRow, "Pair"));
    } else {
      const s = get(r,"Sent Amount"), sc = get(r,"Sent Currency"),
            b = get(r,"Received Amount"), bc = get(r,"Received Currency");
      if (s !== null && sc !== null && Boolean(s) !== Boolean(sc))
        issues.push(safeIssue("SENT_AMOUNT_CURRENCY_INCOMPLETE", "error", displayRow));
      if (b !== null && bc !== null && Boolean(b) !== Boolean(bc))
        issues.push(safeIssue("RECEIVED_AMOUNT_CURRENCY_INCOMPLETE", "error", displayRow));
      if (s === "" && b === "") issues.push(safeIssue("NEITHER_SENT_NOR_RECEIVED", "error", displayRow));
      for (const [label,qty,ticker] of [["Sent Amount",s,sc],["Received Amount",b,bc]]) {
        if (qty !== null && qty !== "" && !validDecimal(qty,false))
          issues.push(safeIssue("INVALID_UNIVERSAL_POSITIVE_AMOUNT", "error", displayRow,label));
        if (ticker !== null && ticker !== "" && !symbol(ticker))
          issues.push(safeIssue("INVALID_CURRENCY_FORMAT", "error", displayRow,label));
      }
    }
    if (positions.has("Fee Amount")) {
      const v = get(r, "Fee Amount");
      if (v && !validDecimal(v,false)) issues.push(safeIssue("INVALID_FEE_AMOUNT", "error", displayRow,"Fee Amount"));
      if (v && positions.has("Fee Currency") && !get(r,"Fee Currency"))
        issues.push(safeIssue("FEE_CURRENCY_MISSING", "error", displayRow,"Fee Currency"));
    }
    // Formula detection reports only row number and static diagnostic code.
    for (let ci=0; ci<r.length; ci++) {
      if (/^[=+@]/.test(r[ci]) && !(template === "simple" && header[ci] === "Amount")) {
        issues.push(safeIssue("SPREADSHEET_FORMULA_LIKE_CELL", "warning", displayRow));
        break;
      }
    }
  }
  const errors = issues.filter(i => i.severity === "error").length;
  return Object.freeze({
    template, dataRowCount:rows.length-1, headerColumnCount:header.length,
    errors, warnings:issues.length-errors, issues:Object.freeze(issues),
    structurallyReady:errors===0, userMustVerifyKoinlyImport:true,
    taxAdviceProvided:false, historicalCostBasisCalculated:false,
    blockchainSettlementVerified:false, networkRequests:0, sourceFileUploaded:false,
    originalValuesExposed:false
  });
}

export const SYNTHETIC_UNIVERSAL =
  "Date,Sent Amount,Sent Currency,Received Amount,Received Currency\n" +
  "2026-10-01 00:00:00,,,10.000000,USDC\n" +
  "2026-10-02 10:04:35,0.002000,ETH,,\n" +
  "2026-10-03 14:20:07,50.000000,USDC,0.020000,ETH\n";
