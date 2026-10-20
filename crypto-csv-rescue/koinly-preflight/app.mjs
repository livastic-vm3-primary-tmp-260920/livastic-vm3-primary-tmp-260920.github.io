import { inspectCsv, SYNTHETIC_UNIVERSAL, MAX_BYTES } from "./core.mjs";

const templateNode = document.querySelector("#template");
const fileNode = document.querySelector("#csv-file");
const summaryNode = document.querySelector("#summary");
const issuesNode = document.querySelector("#issues");
const runNode = document.querySelector("#check-file");
const demoNode = document.querySelector("#synthetic-demo");

function showStatus(message) {
  summaryNode.textContent = message;
}
function showRedacted(result) {
  // Only author-controlled static codes, canonical fields and source row numbers.
  issuesNode.replaceChildren();
  showStatus(
    result.template.toUpperCase() +
      " | " + result.dataRowCount + " data rows | " +
      result.errors + " structural blockers | " +
      result.warnings + " advisory notices. " +
      (result.structurallyReady
        ? "No structural blocker detected (NOT an import, tax, or receipt guarantee)."
        : "Review the reported row numbers and Koinly's official template first.")
  );
  if (!result.issues.length) {
    const li = document.createElement("li");
    li.textContent = "No issue codes in the limited selected schema. Koinly account acceptance still NOT VERIFIED.";
    issuesNode.append(li);
  }
  for (const issue of result.issues.slice(0, 120)) {
    const li = document.createElement("li");
    li.textContent = "Line " + issue.row +
      ": " + issue.severity.toUpperCase() + " / " + issue.code +
      (issue.field ? " / expected Koinly field: " + issue.field : "") +
      ". No original cell value is displayed.";
    issuesNode.append(li);
  }
  if (result.issues.length > 120) {
    const li = document.createElement("li");
    li.textContent = "Additional sanitized warnings omitted from the display; no data values retained.";
    issuesNode.append(li);
  }
}
function onError(err) {
  issuesNode.replaceChildren();
  // Errors contain only authored static parser codes; never an input value or filename.
  const codes = new Set([
    "TYPE_MUST_BE_TEXT", "FILE_TOO_LARGE", "BINARY_NUL_REJECTED",
    "EMPTY_FILE", "CELL_TOO_LONG", "TOO_MANY_COLUMNS", "TOO_MANY_ROWS",
    "UNEXPECTED_QUOTE", "TEXT_AFTER_CLOSING_QUOTE", "UNCLOSED_QUOTE",
    "NO_ROWS", "UNKNOWN_TEMPLATE"
  ]);
  showStatus(
    "The local check could not proceed. Reason code: " +
      (err && codes.has(err.code) ? err.code : "LOCAL_FILE_OR_PARSER_ERROR") +
      ". No CSV content was uploaded or transmitted."
  );
}

demoNode.addEventListener("click", () => {
  try {
    templateNode.value = "universal";
    showRedacted(inspectCsv(SYNTHETIC_UNIVERSAL, "universal"));
  } catch (error) {
    onError(error);
  }
});

runNode.addEventListener("click", async () => {
  const f = fileNode.files && fileNode.files[0];
  issuesNode.replaceChildren();
  if (!f) {
    showStatus("No file selected. Choose your own CSV or use the entirely synthetic example.");
    return;
  }
  if (f.size > MAX_BYTES) {
    showStatus("File exceeds the 512 KiB local-only safety limit. No file content was read.");
    return;
  }
  runNode.disabled = true;
  showStatus("Reading the selected file only inside this browser; no server request.");
  try {
    const raw = await f.text();
    const analysis = inspectCsv(raw, templateNode.value);
    showRedacted(analysis);
  } catch (error) {
    onError(error);
  } finally {
    runNode.disabled = false;
    // The browser input reference is cleared so the tool does not keep
    // an unexpected reference to a selected sensitive file.
    fileNode.value = "";
  }
});
