/** Fresh, temporary Chrome profile and fictional data only. Never touch original tabs. */
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as sleep} from 'node:timers/promises';
const SITE='https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/nado-closed-pnl/';
const profile=await mkdtemp(join(tmpdir(),'vm3-nado-fake-only-'));
let chrome=null,ws=null,uid=0;
const pending=new Map(),errors=[],external=[];
function send(method,params={}){
 const id=++uid;
 return new Promise((resolve,reject)=>{
  pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
 });
}
async function evalJS(expression){
 const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.text||'browser exception');
 return r.result?.value;
}
try{
 chrome=spawn('/usr/bin/google-chrome',[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-background-networking',
  '--disable-extensions','--no-first-run','--remote-allow-origins=*',
  '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
 ],{stdio:'ignore'});
 let port=0;
 for(let i=0;i<90;i++){
  await sleep(105);
  try{port=Number((await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);}catch{}
  if(port>0&&Number.isSafeInteger(port))break;
  if(chrome.exitCode!==null)throw Error('CHROME_EXITED_EARLY');
 }
 if(!port)throw Error('CHROME_PORT_MISSING');
 const pages=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 const page=pages.find(x=>x.type==='page');if(!page)throw Error('NO_EPHEMERAL_PAGE');
 ws=new WebSocket(page.webSocketDebuggerUrl);
 ws.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails?.text||'JS error');
  if(msg.method==='Network.requestWillBeSent'){
   const u=msg.params.request?.url||'';
   if(u.startsWith('http')&&!u.startsWith(SITE))external.push(u.split('?')[0]);
  }
  if(msg.id&&pending.has(msg.id)){
   const p=pending.get(msg.id);pending.delete(msg.id);
   msg.error?p.reject(Error(msg.error.message||'CDP failed')):p.resolve(msg.result);
  }
 });
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('CDP_TIMEOUT')),6000);
  ws.addEventListener('open',()=>{clearTimeout(timer);resolve()},{once:true});
  ws.addEventListener('error',err=>{clearTimeout(timer);reject(err)},{once:true});
 });
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');
 await send('Page.navigate',{url:SITE});
 let ready=false;
 for(let i=0;i<90;i++){
  await sleep(145);
  if(await evalJS("document.readyState==='complete' && !!document.getElementById('demo') && !!document.getElementById('make') && document.getElementById('report').textContent.includes('No parsed source')")){ready=true;break}
 }
 if(!ready)throw Error('BROWSER_PAGE_NOT_READY');
 const initial=await evalJS("(function(){return [document.getElementById('download').hidden,document.getElementById('row-count').textContent]})()");
 if(!initial[0]||initial[1]!=='0')throw Error('INITIAL_NOT_INERT');
 const step=await evalJS([
  "(async function(){",
  "document.getElementById('demo').click();document.getElementById('read').click();",
  "await new Promise(r=>setTimeout(r,140));",
  "const m={date:'Closed At UTC',pnl:'Realized PnL',currency:'Settlement Asset',reference:'Invented Reference'};",
  "for(const k in m)document.getElementById('map-'+k).value=m[k];",
  "for(const k of ['ack-closed','ack-utc','ack-fees'])document.getElementById(k).checked=true;",
  "document.getElementById('make').click();",
  "const a=document.getElementById('download');return {rows:document.getElementById('row-count').textContent,",
  "href:a.getAttribute('href'),filename:a.download,hidden:a.hidden,",
  "report:document.getElementById('report').textContent,actualFileCount:document.getElementById('file').files.length,",
  "pageURL:location.href,label:document.getElementById('map-pnl').value};",
  "})()"
 ].join(''));
 if(step.rows!=='3'||step.hidden||!step.href?.startsWith('blob:')||!step.filename?.includes('FICTIONAL'))
  throw Error('FAKE_CSV_NOT_GENERATED');
 if(!step.report.includes('Locally generated 3 candidate rows'))throw Error('REPORT_INCORRECT');
 if(step.pageURL!==SITE||step.actualFileCount!==0||step.label!=='Realized PnL')
  throw Error('ACTUAL_CUSTOMER_FILE_OR_NAVIGATION');
 const blocked=await evalJS("(function(){document.getElementById('ack-utc').checked=false;document.getElementById('make').click();return [document.getElementById('download').hidden,document.getElementById('report').textContent]})()");
 if(!blocked[0]||!blocked[1].includes('STOP:'))throw Error('UNKNOWN_UTC_NOT_FAIL_CLOSED');
 const recipient='0x6b01efA0705E91a7aca54271510bf9e594717f34';
 const expectedToken='0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
 const tipBefore=await evalJS("(function(){return {section:!!document.getElementById('optional-support'),recipient:document.getElementById('public-tip-recipient')?.textContent,button:!!document.getElementById('copy-public-tip-recipient'),status:document.getElementById('tip-copy-status')?.textContent,details:document.getElementById('optional-support')?.textContent,script:!!document.querySelector('script[src=\\\"./tip.mjs\\\"]'),url:location.href}})()");
 if(!tipBefore.section||!tipBefore.button||!tipBefore.script||tipBefore.recipient!==recipient||!tipBefore.details.includes(expectedToken)||!tipBefore.details.includes('Pay 0 USDC'))
  throw Error('VERIFIED_SAME_OWNER_TIP_PAYTO_NOT_LIVE');
 const tipAfter=await evalJS("(async function(){document.getElementById('copy-public-tip-recipient').click();await new Promise(r=>setTimeout(r,190));return {text:document.getElementById('tip-copy-status').textContent,href:location.href}})()");
 if(tipAfter.href!==SITE||!tipAfter.text.includes('Public address copied')&&!tipAfter.text.includes('Clipboard permission unavailable'))
  throw Error('TIP_COPY_LOCAL_USER_ACTION_FAILED');
 if(external.length)throw Error('THIRDPARTY_REQUEST_OCCURRED');
 if(errors.length)throw Error('PAGE_JS_EXCEPTION');
 console.log(JSON.stringify({status:'PASS',website:SITE,syntheticRows:3,
   newBrowserProfile:true,existingChromeTabsTouched:0,realClientFilesRead:0,
   networkToOtherOrigins:0,JavaScriptExceptions:0,
   manualMapping:true,fictionalCandidateDownload:true,
   acknowledgmentFailClosed:true,
   tipPublicCanonicalPayToVerified:true,tipOneClickClipboardOnly:true,
   tipSeparateFromPaidOrder:true,walletPermissionRequests:0,
   paidBuyers:0,newUSDC:0}));
}catch(e){console.error('NADO_BROWSER_QA_FAILED',String(e?.message||e));process.exitCode=1}
finally{
 try{ws?.close()}catch{}
 try{chrome?.kill('SIGTERM')}catch{}
 await sleep(230);
 try{await rm(profile,{recursive:true,force:true})}catch{}
}
