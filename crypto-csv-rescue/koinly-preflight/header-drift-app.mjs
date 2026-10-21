import {comparePublicHeaderShapes,FICTIONAL_OLD,FICTIONAL_NEW} from "./header-drift.mjs";
if(typeof document !== "undefined"){
  const $ = id=>document.getElementById(id);
  const reset=()=> {
    $("drift-result").textContent="Nothing compared. No input is stored or sent.";
    $("drift-old-only").replaceChildren();
    $("drift-new-only").replaceChildren();
    $("drift-meta").textContent="";
    $("drift-result").className="";
  };
  const fillList=(container,values)=>{
    container.replaceChildren();
    if (!values.length) {
      const li=document.createElement("li");li.textContent="None observed";container.append(li);
    } else for(const v of values) {
      const li=document.createElement("li");
      li.textContent=v;
      container.append(li);
    }
  };
  $("drift-check").addEventListener("click",()=>{
    reset();
    try {
      const report=comparePublicHeaderShapes(
        $("old-header-text").value,$("new-header-text").value
      );
      const readable={
        CURRENT_HEADER_ONLY_NO_OLD_SAMPLE:"Current header only; comparison requires an older known-working header.",
        NO_HEADER_DIFFERENCE_OBSERVED:"No header difference in the two lines provided. Import success remains untested.",
        CSV_SEPARATOR_CHANGED:"Column names match, but CSV delimiters differ.",
        CSV_FIELD_ORDER_CHANGED:"Same column names, different order; semantic data is NOT verified.",
        HEADER_CASE_OR_SPACING_CHANGED:"Only header whitespace/capitalization differences detected.",
        HEADER_COLUMNS_CHANGED:"Column names changed or appeared/disappeared. Do not guess a mapping."
      };
      $("drift-result").textContent="LOCAL ONLY · "+report.code+" · "+
        (readable[report.code]||"Review the two header lines.")+
        "  · Existing: "+report.oldCount+" columns; current: "+report.newCount+" columns.";
      $("drift-result").className="good";
      fillList($("drift-old-only"),report.oldOnly);
      fillList($("drift-new-only"),report.newOnly);
      $("drift-meta").textContent="Delimiter changed: "+(report.separatorChanged?"yes":"no")+
        ". Column reordering: "+(report.sameFieldsDifferentOrder?"yes":"no")+
        ". Automatic rewriting: NEVER. Real Koinly import tested: NO. "+
        "Koinly recommends contacting support without editing supported-exchange exports that show Unknown file.";
    } catch(e) {
      const allow=new Set(["HEADER_TEXT_REQUIRED","EMPTY_HEADER","HEADER_TOO_LONG","MULTIROW_INPUT_REFUSED",
        "POTENTIAL_SENSITIVE_DATA_REFUSED","INVALID_CSV_HEADER_QUOTING",
        "UNTERMINATED_CSV_HEADER_QUOTE","SINGLE_COLUMN_CANNOT_COMPARE",
        "TOO_MANY_HEADER_FIELDS","EMPTY_OR_OVERSIZE_HEADER_FIELD",
        "POTENTIAL_DATA_ROW_OR_SENSITIVE_FIELD","DUPLICATE_OR_COLLIDING_HEADER_FIELD"]);
      const code=allow.has(e?.code)?e.code:"UNRECOGNIZED_LOCAL_HEADER_ERROR";
      $("drift-result").textContent="Not analyzed: "+code+
        ". Paste ONLY each file's FIRST CSV HEADER LINE; never transaction records, seed phrases or private data.";
      $("drift-result").className="note";
    }
  });
  $("drift-synthetic").addEventListener("click",()=>{
    $("old-header-text").value=FICTIONAL_OLD;
    $("new-header-text").value=FICTIONAL_NEW;
    reset();
    $("drift-result").textContent="Entirely invented examples loaded locally; these are NOT verified real Strike column names. Click Compare.";
  });
  $("drift-clear").addEventListener("click",()=>{
    $("old-header-text").value="";
    $("new-header-text").value="";
    reset();
  });
}
