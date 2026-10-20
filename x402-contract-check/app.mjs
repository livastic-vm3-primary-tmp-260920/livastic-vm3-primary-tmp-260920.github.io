import {parsePublic402,examinePublic402,DEMO_V1,DEMO_V2,MAX_CHARS} from "./check.mjs";
const $=id=>document.getElementById(id);
const txt=(tag,text,className)=>{const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;return e;};
let last=null;
function error(e){
 const code=typeof e?.code==="string"?e.code:"PUBLIC_402_FORMAT_ERROR";
 $("status").textContent="No analysis performed: "+code+". Please paste only an unsigned PUBLIC PaymentRequired JSON object or header value; never a signed payment.";
 $("status").className="result error";
 $("report").replaceChildren();
 $("overview").replaceChildren();
 $("amount").textContent="";
 $("download").disabled=true;
 last=null;
}
function view(r){
 last=r;
 $("status").textContent=r.paymentShape==="NO_STRUCTURAL_BLOCKER_OBSERVED"?
  "No basic public payment-requirement blockers observed. This does NOT confirm merchant identity, a payable route or delivery.":
  "Potential public payment-shape blockers observed. Inspect the static codes below; no transaction was attempted.";
 $("status").className="result "+(r.blockers?"error":"good");
 const top=$("overview");
 top.replaceChildren();
 for(const [name,value] of [["Format",r.versionObserved==="unknown"?"Unrecognized":"x402 v"+r.versionObserved],
 ["Basic blockers",r.blockers],["Metadata warnings",r.warnings],
 ["Bazaar declaration",r.bazaarDisclosed?"Present":"Not established"],
 ["Actual response contract","NOT VERIFIED"]]){
  const c=txt("div","", "metric");
  c.append(txt("strong",String(value)),txt("span",name));
  top.append(c);
 }
 const tbody=$("report");tbody.replaceChildren();
 for(const finding of r.issues){
  const row=document.createElement("tr");
  const sev=txt("td",finding.severity,finding.severity==="BLOCKER"?"error-text":finding.severity==="WARNING"?"warn-text":"quiet-text");
  row.append(txt("td",finding.code),sev,txt("td",finding.text));
  tbody.append(row);
 }
 $("amount").textContent=r.baseNativeCircleUsdcFirstAcceptAmount===null?
  "Only native Circle USDC on Base (if present) is converted from atomic units. Other assets are never assigned an invented USD price.":
  "First accepted Base native Circle USDC amount: "+r.baseNativeCircleUsdcFirstAcceptAmount+
  " USDC (public quote, NOT an order or payment).";
 $("download").disabled=false;
}
function run(){
 last=null;$("download").disabled=true;$("overview").replaceChildren();
 try{view(examinePublic402(parsePublic402($("quote").value)));}
 catch(e){error(e);}
}
function putDemo(payload){$("quote").value=JSON.stringify(payload,null,2);$("status").textContent="Fictional public example loaded locally. Choose Inspect to analyze. No real customer or payment."; $("status").className="result";$("report").replaceChildren();$("overview").replaceChildren();$("amount").textContent="";$("download").disabled=true;last=null;}
$("check").addEventListener("click",run);
$("demo-v2").addEventListener("click",()=>putDemo(DEMO_V2));
$("demo-v1").addEventListener("click",()=>putDemo(DEMO_V1));
$("clear").addEventListener("click",()=>{$("quote").value="";$("status").textContent="Cleared. Nothing was submitted or saved."; $("status").className="result";$("overview").replaceChildren();$("report").replaceChildren();$("amount").textContent="";last=null;$("download").disabled=true;});
$("download").addEventListener("click",()=>{
 if(!last)return;
 const doc={...last,downloadedAtUtc:new Date().toISOString(),selfContainedReport:true};
 const blob=new Blob([JSON.stringify(doc,null,2)+"\n"],{type:"application/json"});
 const url=URL.createObjectURL(blob);const a=document.createElement("a");
 a.href=url;a.download="onecursor-public-x402-prepay-codes.json";document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),500);
});
$("max").textContent=(MAX_CHARS/1000)+"k";
