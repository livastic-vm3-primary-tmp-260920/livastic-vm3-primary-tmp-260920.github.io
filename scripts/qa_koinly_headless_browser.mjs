/**
 * Isolated throwaway Chrome headless 1-tab browser smoke check of original
 * public ONLY synthetic Koinly local preflight. Never uses any user's Chrome
 * profiles, wallet extension, Gmail cookies, real CSV or credentials.
 * No script injection into customer pages beyond button click on own site.
 */
import {spawn} from "node:child_process";
import {mkdtemp, readFile, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {setTimeout as sleep} from "node:timers/promises";

const URL="https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/koinly-preflight/";
const root=await mkdtemp(join(tmpdir(),"original-vm3-koinly-qa-"));
let chrome=null;
let ws=null;
const pending=new Map();
let callId=0;
const exception=[];
const externalRequests=[];
const timeout=(delay)=>new Promise((_,reject)=>setTimeout(()=>reject(new Error("QA_TIMEOUT")),delay));
const send=(method,params={})=>{
  const id=++callId;
  return new Promise((resolve,reject)=>{
    pending.set(id,{resolve,reject});
    ws.send(JSON.stringify({id,method,params}));
  });
};

try {
  chrome=spawn("/usr/bin/google-chrome",[
    "--headless=new","--no-sandbox","--disable-gpu",
    "--disable-background-networking","--no-first-run",
    "--no-default-browser-check","--remote-allow-origins=*",
    "--remote-debugging-port=0", "--user-data-dir="+root,
    "about:blank"
  ],{stdio:"ignore",env:{...process.env,CHROME_LOG_FILE:"/dev/null"}});
  let port;
  for(let i=0;i<65;i++){
    await sleep(110);
    try{
      const txt=await readFile(join(root,"DevToolsActivePort"),"utf8");
      port=Number(txt.split("\n")[0]);
      if(Number.isSafeInteger(port)&&port>0)break;
    }catch{}
    if(chrome.exitCode !== null)throw new Error("CHROME_EXITED_EARLY");
  }
  if(!port)throw new Error("DEVTOOLS_NO_PORT");
  const targets=await(await fetch("http://127.0.0.1:"+port+"/json/list")).json();
  const target=targets.find(x=>x.type==="page");
  if(!target)throw new Error("NO_HEADLESS_TEST_TAB");
  ws=new WebSocket(target.webSocketDebuggerUrl);
  ws.addEventListener("message",event=>{
    const obj=JSON.parse(event.data);
    if(obj.method==="Runtime.exceptionThrown"){
      exception.push(obj.params.exceptionDetails?.exception?.description || "PAGE_SCRIPT_ERROR");
    }
    if(obj.method==="Network.requestWillBeSent"){
      const u=obj.params.request?.url || "";
      if(u.startsWith("http")&&!u.startsWith("https://livastic-vm3-primary-tmp-260920.github.io/")){
        externalRequests.push(u.split("?")[0]);
      }
    }
    if(obj.id&&pending.has(obj.id)){
      const p=pending.get(obj.id);pending.delete(obj.id);
      if(obj.error)p.reject(new Error(obj.error.message||"DEVTOOLS_REJECTED"));
      else p.resolve(obj.result);
    }
  });
  await Promise.race([
    new Promise((resolve,reject)=>{
      ws.addEventListener("open",resolve,{once:true});
      ws.addEventListener("error",reject,{once:true});
    }),timeout(6000)
  ]);
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");
  await send("Page.navigate",{url:URL});
  let ready=false;
  for(let i=0;i<90;i++){
    await sleep(135);
    const result=await send("Runtime.evaluate",{
      expression:"document.readyState === 'complete' && !!document.querySelector('#synthetic-demo') && !!document.querySelector('#summary')",
      returnByValue:true
    });
    if(result.result?.value===true){ready=true;break;}
  }
  if(!ready)throw new Error("NOT_READY");
  // Wait for static ES module to finish its browser own setup.
  await sleep(800);
  const before=await send("Runtime.evaluate",{
    expression:"document.querySelector('#summary').textContent",returnByValue:true
  });
  if(!String(before.result?.value).includes("No file read"))throw new Error("MODULE_INITIAL_STATE_UNEXPECTED");
  const response=await send("Runtime.evaluate",{
    expression:"(document.querySelector('#synthetic-demo').click(), document.querySelector('#summary').textContent)",
    returnByValue:true
  });
  const summary=String(response.result?.value||"");
  if(!summary.includes("UNIVERSAL | 3 data rows | 0 structural blockers"))
    throw new Error("ACTUAL_BROWSER_SYNTHETIC_CLICK_FAILED");
  const fileCheck=await send("Runtime.evaluate",{
    expression:"document.querySelector('#csv-file').files.length === 0 && document.querySelector('#issues').textContent.includes('No issue codes')",
    returnByValue:true
  });
  if(fileCheck.result?.value!==true)throw new Error("CSV_OR_RESULT_STATE_NOT_ISOLATED");
  // Real browser proof: summary is generated solely from invented local row
  // codes, contains NO original amounts, and selecting it sends no request.
  const safeResult=await send("Runtime.evaluate",{
    expression:"(() => { const area=document.querySelector('#safe-summary'); const btn=document.querySelector('#select-safe-summary'); if(!area || !btn || btn.disabled) return 'MISSING_SAFE_BUTTON'; btn.click(); const x=area.value; return JSON.stringify({length:x.length,hasSafePrefix:x.includes('ONE CURSOR — OPTIONAL LOCAL KOINLY'),hasDisclaimer:x.includes('CUSTOMER MUST REVIEW BEFORE SHARING'),hasPrivateValue:x.includes('10.000000')||x.includes('0.020000')||x.includes('2026-10-01'),selectionMatches:area.selectionStart===0&&area.selectionEnd===x.length}); })()",
    returnByValue:true
  });
  const safe=JSON.parse(String(safeResult.result?.value||"null"));
  if(!safe || !safe.hasSafePrefix || !safe.hasDisclaimer ||
     safe.hasPrivateValue || !safe.selectionMatches || safe.length>3500)
    throw new Error("LIVE_SAFE_DIAGNOSTIC_PRIVACY_OR_SELECTION_FAIL");
  if(externalRequests.length)throw new Error("UNEXPECTED_THIRDPARTY_NETWORK_REQUEST");
  if(exception.length)throw new Error("BROWSER_SCRIPT_EXCEPTION");
  console.log(JSON.stringify({
    externalPublicDemo:true,browser:"fresh isolated headless Chrome",
    openedExistingChromeTabs:0,sourceFileRead:false,
    browserPostAttempted:false,wholeSiteCheckout:false,
    demoClickSuccessful:true,summary,localRedactedTicket:true,
    manualSelectOnly:true,rawValuesInTicket:false,externalRequests:0,
    scriptExceptions:0,realOrders:0,USDCReceivedFromDemo:"0"
  }));
}catch(err){
  console.error("QA_FAILED",String(err?.message||"UNKNOWN"));
  process.exitCode=1;
}finally{
  try{if(ws){ws.close();}}catch{}
  try{if(chrome){chrome.kill("SIGTERM");}}catch{}
  await sleep(170);
  try{await rm(root,{recursive:true,force:true});}catch{}
}
