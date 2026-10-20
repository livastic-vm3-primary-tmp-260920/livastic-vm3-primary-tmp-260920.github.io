/**
 * Build a reviewable, share-at-user-discretion technical summary from the
 * original local Koinly schema checker. NEVER copy raw cells/columns/filenames,
 * wallet addresses, CSV bytes, arbitrary strings or customer budget.
 *
 * Strings in result are treated as UNTRUSTED and reduced to allowlisted constants.
 * The output cannot initiate a network call or payment.
 */
import {MAX_ROWS, TEMPLATE_REQUIRED} from "./core.mjs";

const TEMPLATES = new Set(Object.keys(TEMPLATE_REQUIRED));
const SEVERITIES = new Set(["error", "warning"]);
const CODES = new Set([
  "DUPLICATE_EXACT_HEADER", "HEADER_HAS_EXTRA_SPACES",
  "SPREADSHEET_FORMULA_HEADER", "MISSING_REQUIRED_HEADER",
  "COLUMN_COUNT_MISMATCH", "UTC_DATE_FORMAT_OR_CALENDAR",
  "INVALID_SIMPLE_SIGNED_AMOUNT", "MISSING_OR_INVALID_CURRENCY",
  "INVALID_TRADE_POSITIVE_AMOUNT", "SIDE_MUST_BE_BUY_OR_SELL",
  "PAIR_MUST_HAVE_BASE_AND_QUOTE", "SENT_AMOUNT_CURRENCY_INCOMPLETE",
  "RECEIVED_AMOUNT_CURRENCY_INCOMPLETE", "NEITHER_SENT_NOR_RECEIVED",
  "INVALID_UNIVERSAL_POSITIVE_AMOUNT", "INVALID_CURRENCY_FORMAT",
  "INVALID_FEE_AMOUNT", "FEE_CURRENCY_MISSING", "SPREADSHEET_FORMULA_LIKE_CELL"
]);
const FIELDS = new Set([
  ...Object.values(TEMPLATE_REQUIRED).flat(),
  "Fee Amount", "Fee Currency"
]);
export const MAX_SHARED_ISSUES = 25;
export const MAX_SUMMARY_CHARS = 3500;
const PUBLIC_TOOL =
  "https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/koinly-preflight/";

function safeNum(value, maximum) {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) return null;
  return String(value);
}
function strictSafeIssue(issue) {
  if (!issue || typeof issue !== "object" || Array.isArray(issue)) return null;
  if (!CODES.has(issue.code) || !SEVERITIES.has(issue.severity)) return null;
  const row = safeNum(issue.row, MAX_ROWS + 1);
  if (row === null || Number(row) < 1) return null;
  if (issue.field !== null && issue.field !== undefined && !FIELDS.has(issue.field)) return null;
  return "line " + row + ": " + issue.severity.toUpperCase() + " / " + issue.code +
    (issue.field ? " / " + issue.field : "");
}

/** Does NOT collect or transmit financial records. */
export function makeSafeSummary(result) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return "NO_SAFE_LOCAL_DIAGNOSTIC. Please run the free checker first.";
  }
  if (!TEMPLATES.has(result.template) || !Array.isArray(result.issues) ||
      result.sourceFileUploaded !== false || result.originalValuesExposed !== false ||
      result.blockchainSettlementVerified !== false || result.taxAdviceProvided !== false ||
      result.userMustVerifyKoinlyImport !== true || result.networkRequests !== 0 ||
      result.issues.length > 8000) {
    return "NO_SAFE_LOCAL_DIAGNOSTIC. The diagnostic is incomplete or untrusted.";
  }
  const count = safeNum(result.dataRowCount, MAX_ROWS);
  const columns = safeNum(result.headerColumnCount, 36);
  const errors = safeNum(result.errors, 8000);
  const warnings = safeNum(result.warnings, 8000);
  if ([count,columns,errors,warnings].some(v => v === null)) {
    return "NO_SAFE_LOCAL_DIAGNOSTIC. Invalid diagnostic counts.";
  }
  const safe = result.issues.map(strictSafeIssue).filter(Boolean);
  const selected = safe.slice(0,MAX_SHARED_ISSUES);
  const omittedCount = result.issues.length - selected.length;
  const lines = [
    "ONE CURSOR — OPTIONAL LOCAL KOINLY CSV FORMAT DIAGNOSTIC",
    "CUSTOMER MUST REVIEW BEFORE SHARING; THIS TEXT IS NOT SENT.",
    "Template: " + result.template.toUpperCase(),
    "Bounded row count: " + count,
    "Schema column count: " + columns,
    "Structural blockers: " + errors,
    "Advisory codes: " + warnings,
    "Only static code names and row numbers; original cell values omitted.",
    "This does not confirm Koinly import, tax lots, ownership or on-chain settlement.",
    "Detected issues (truncated to " + MAX_SHARED_ISSUES + "):",
    ...selected
  ];
  if (!selected.length) lines.push("No safe issues in this limited result.");
  if (omittedCount > 0) {
    lines.push("Other diagnostics withheld: " + String(omittedCount) +
      " (unknown/private values discarded).");
  }
  lines.push("Free source-only checker: " + PUBLIC_TOOL);
  lines.push("Next step: use Koinly's own official import guide, or voluntarily");
  lines.push("contact the single owner with your own issue and authorized scope.");
  lines.push("Do not include CSV rows, file names, wallet addresses or tax IDs.");
  lines.push("No quoted 49-USDC pilot is booked or paid by generating this note.");
  const ticket = lines.join("\n");
  if (ticket.length > MAX_SUMMARY_CHARS) {
    return "NO_SAFE_LOCAL_DIAGNOSTIC. The selected report was too large.";
  }
  return ticket;
}
