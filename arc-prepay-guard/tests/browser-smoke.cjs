// Optional isolated browser integration smoke: uses separate headless Chrome profile and loopback server.
// Does not touch any user's existing Chrome tabs or cookies.
const {spawn} = require("node:child_process");
const {mkdtempSync,readFileSync,existsSync,rmSync} = require("node:fs");
const {tmpdir} = require("node:os");
const {join,resolve} = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const {setTimeout:delay} = require("node:timers/promises");
const root = resolve(__dirname,"..");
const allowed = new Set(["index.html","app.mjs","rpc.mjs"]);
const rootDir = mkdtempSync(join(tmpdir(),"vm3-arc-prepay-isolated-"));
let child;
const server=http.createServer((req,res)=>{
  const file=decodeURI((req.url||"/").split("?")[0]).replace(/^\/+/,"")||"index.html";
  if (!allowed.has(file)){res.writeHead(404);res.end();return;}
  try {res.setHeader("Content-Type",file.endsWith(".mjs")?"application/javascript;charset=UTF-8":"text/html;charset=UTF-8");res.end(readFileSync(join(root,file)));}
  catch {res.writeHead(404);res.end();}
});
let socket;
let msgId=1;
const pending=new Map();
function call(method,params={}) {
  const id=msgId++;
  return new Promise((resolve,reject)=>{
    pending.set(id,{resolve,reject});
    socket.send(JSON.stringify({id,method,params}));
    setTimeout(()=>{const slot=pending.get(id);if(slot){pending.delete(id);slot.reject(new Error("Chrome CDP timeout "+method));}},5000);
  });
}
(async()=>{
  await new Promise(r=>server.listen(0,"127.0.0.1",r));
  const port=server.address().port;
  child=spawn("/usr/bin/google-chrome",[
    "--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--no-first-run",
    "--disable-background-networking","--disable-extensions","--remote-debugging-port=0",
    "--remote-allow-origins=*","--user-data-dir="+rootDir,"about:blank"
  ],{stdio:"ignore"});
  let info;
  for (let i=0;i<100;i++){
    if(existsSync(join(rootDir,"DevToolsActivePort"))){info=readFileSync(join(rootDir,"DevToolsActivePort"),"utf8").split("\n");break;}
    await delay(90);
  }
  assert.ok(info,"isolated browser started");
  const port2=info[0];
  const created = await fetch("http://127.0.0.1:"+port2+"/json/new?"+encodeURIComponent("http://127.0.0.1:"+port+"/"),{method:"PUT"});
  assert.equal(created.status,200);
  const tab=await created.json();
  socket=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
    socket.addEventListener("open",resolve,{once:true});
    socket.addEventListener("error",reject,{once:true});
  });
  socket.onmessage=({data})=>{
    const obj=JSON.parse(data.toString());if(!obj.id||!pending.has(obj.id))return;
    const slot=pending.get(obj.id);pending.delete(obj.id);
    if(obj.error)slot.reject(new Error(JSON.stringify(obj.error))); else slot.resolve(obj.result);
  };
  await call("Runtime.enable");
  let result;
  for(let i=0;i<65;i++){
    result=await call("Runtime.evaluate",{expression:'document.querySelector("#inspect")?.textContent',returnByValue:true});
    if(typeof result.result.value==="string")break;
    await delay(75);
  }
  assert.match(result.result.value,/Inspect registration and reputation/,"browser loaded Arc tool");
  const initial=await call("Runtime.evaluate",{expression:'document.querySelector("#message").textContent',returnByValue:true});
  assert.match(initial.result.value,/No network request/);
  await call("Runtime.evaluate",{expression:'document.querySelector("#inspect").click()'});
  let status="";
  for(let i=0;i<100;i++){
    const v=await call("Runtime.evaluate",{expression:'document.querySelector("#message").textContent',returnByValue:true});
    status=v.result.value||"";
    if(status.includes("Read-only Arc registry query completed.")||status.includes("Wrong network")||status.includes("unavailable")||status.includes("Failed to fetch"))break;
    await delay(110);
  }
  assert.match(status,/Read-only Arc registry query completed/,"actual browser CORS + Arc mainnet RPC GET");
  const details=await call("Runtime.evaluate",{expression:'document.querySelector("#details").textContent',returnByValue:true});
  assert.match(details.result.value,/Arc chain5042/);
  assert.match(details.result.value,/ERC-8004 registered owner0xd305607510e0db2c95807173c7a05bea53c1ed36/i);
  assert.match(details.result.value,/MANUAL REVIEW REQUIRED/);
  const visible=await call("Runtime.evaluate",{expression:'!document.querySelector("#results").hidden',returnByValue:true});
  assert.equal(visible.result.value,true);
  const exportEnabled=await call("Runtime.evaluate",{expression:'!document.querySelector("#export").disabled',returnByValue:true});
  assert.equal(exportEnabled.result.value,true);
  const warnings=await call("Runtime.evaluate",{expression:'document.querySelector("#notices").textContent',returnByValue:true});
  assert.match(warnings.result.value,/NOT legal identity/);
  console.log("ISOLATED_CHROME_REAL_ARC_RPC_SMOKE_PASS",JSON.stringify({
    id:0,network:5042,registrationOwnerVerified:true,feedbackObserved:true,
    decision:"MANUAL REVIEW REQUIRED", exportEnabled:true,publicUserTabsTouched:0,paidTransactionsCreated:0
  }));
})().catch(e=>{console.error("CHROME_BROWSER_SMOKE_FAIL",e.message);process.exitCode=1;}).finally(async()=>{
  if(socket?.readyState===WebSocket.OPEN)socket.close();
  if(child){child.kill("SIGTERM");await delay(150);}
  await new Promise(r=>server.close(r));
  rmSync(rootDir,{recursive:true,force:true});
});
