import {inspectArcAgent} from "./rpc.mjs";
const byId=id=>document.getElementById(id);
let last=null;
const add=(parent,tag,text,cls)=>{
  const el=document.createElement(tag);
  if(text!=null)el.textContent=String(text);
  if(cls)el.className=cls;
  parent.appendChild(el);
  return el;
};
const row=(key,value)=>{
  const d=byId("details");
  add(d,"dt",key);
  add(d,"dd",value??"Not independently established","value");
};
function render(result){
  last=result;
  byId("export").disabled=false;
  byId("results").hidden=false;
  byId("details").replaceChildren();
  byId("notices").replaceChildren();
  row("Agent ID",result.agentId);
  row("Arc chain",result.chainId);
  row("Checked Arc block",result.blockNumber);
  row("ERC-8004 registered owner",result.owner);
  row("Registration metadata type",result.registration?.uriKind || "Unavailable");
  row("On-chain registered name (self-claimed)",result.registration?.name || "No inline name validated");
  row("Agent active flag (self-claimed)",result.registration?.active == null?"Not established":String(result.registration.active));
  row("x402 enabled flag (self-claimed)",result.registration?.x402Support == null?"Not established":String(result.registration.x402Support));
  row("Registered service types (self-claimed)",result.registration?.services?.join(", ") || "Not available");
  row("On-chain client addresses",result.clientCount??"Unavailable");
  row("Unfiltered registry feedback count",result.reputationSummary?.count??"Unavailable");
  row("Unfiltered registry summary value",result.reputationSummary?.value??"Unavailable");
  row("Verified customer payments","NONE — this tool does not verify settlement");
  row("Payment decision","MANUAL REVIEW REQUIRED");
  for(const note of result.notices)add(byId("notices"),"li",note);
  byId("message").textContent="Read-only Arc registry query completed. No wallet interaction or payment. Export includes public registry metadata only.";
}
byId("inspect").addEventListener("click",async()=>{
  const b=byId("inspect");
  b.disabled=true;
  last=null;
  byId("export").disabled=true;
  byId("results").hidden=true;
  byId("message").textContent="Reading Arc chain 5042 in read-only mode…";
  try{render(await inspectArcAgent(byId("agentId").value));}
  catch(e){
    byId("message").textContent=e instanceof Error ? e.message : "Unable to verify. Do not assume an identity or make a payment.";
  }finally{b.disabled=false;}
});
byId("export").addEventListener("click",()=>{
  if(!last)return;
  const file=new Blob([JSON.stringify(last,null,2)+"\n"],{type:"application/json"});
  const url=URL.createObjectURL(file);
  const a=document.createElement("a");
  a.href=url;a.download="arc-erc8004-public-prepay-facts.json";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
});
