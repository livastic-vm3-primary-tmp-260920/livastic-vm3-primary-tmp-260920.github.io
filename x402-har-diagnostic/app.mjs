import { analyzeHar, sampleHar } from "./analyze.mjs";
const $ = (id) => document.getElementById(id);
let last = null;
function clear(parent) { parent.replaceChildren(); }
function elem(tag, text, className) {
  const el = document.createElement(tag);
  if (text != null) el.textContent = String(text);
  if (className) el.className = className;
  return el;
}
function render(result) {
  last = result;
  $("export").disabled = false;
  $("message").textContent = "Analyzed locally. No network request or wallet action was made; no settlement was verified.";
  const c = result.counts;
  $("counts").textContent = "Entries: " + c.inspected + " · 402 challenges: " + c.challenges402 +
    " · payment-header requests: " + c.paymentHeaderRequests + " · preflights: " + c.preflightsObserved +
    " · unsigned 400/422: " + c.unsigned400or422 + ".";
  clear($("findings"));
  $("findings").appendChild(elem("h3", result.findings.length + " diagnostic findings"));
  for (const item of result.findings) {
    const row = elem("div", null, "result " + item.severity);
    row.appendChild(elem("strong", item.severity.toUpperCase() + " · " + item.code));
    row.appendChild(elem("p", item.message));
    $("findings").appendChild(row);
  }
}
$("example").addEventListener("click", () => {
  $("file").value = "";
  render(analyzeHar(sampleHar()));
});
$("analyze").addEventListener("click", async () => {
  last = null;
  $("export").disabled = true;
  clear($("findings"));
  $("counts").textContent = "";
  const file = $("file").files?.[0];
  if (!file) { $("message").textContent = "Select a .har or .json file first, or try the fictional example."; return; }
  if (file.size > 2_000_000) { $("message").textContent = "File exceeds 2 MB. Trim it locally and try again."; $("file").value = ""; return; }
  try {
    const report = analyzeHar(await file.text());
    render(report);
  } catch (err) {
    $("message").textContent = err instanceof Error ? err.message : "Could not analyze the selected file.";
  } finally {
    $("file").value = "";
  }
});
$("export").addEventListener("click", () => {
  if (!last) return;
  const blob = new Blob([JSON.stringify(last, null, 2) + "\n"], {type:"application/json"});
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u; a.download = "x402-har-sanitized-findings.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1500);
});
