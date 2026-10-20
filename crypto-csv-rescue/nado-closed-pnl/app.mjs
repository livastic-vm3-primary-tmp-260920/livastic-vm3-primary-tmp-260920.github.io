import {parseCsv,makeCandidate,MAX_SOURCE_BYTES} from './core.mjs';
const $=id=>document.getElementById(id);
let parsed=null,lastURL=null,synthetic=false;
const sample=[
 'Closed At UTC,Realized PnL,Settlement Asset,Invented Reference',
 '2026-01-19T10:22:00Z,18.50,USDC,FAKE-PERP-A',
 '2026-01-19T11:44:15Z,-6.25,USDC,FAKE-PERP-B',
 '2026-01-20T04:05:01Z,3.00,USDT,FAKE-PERP-C'
].join('\r\n');
function reset(){
 parsed=null;
 $('download').hidden=true;$('download').removeAttribute('href');
 if(lastURL){URL.revokeObjectURL(lastURL);lastURL=null;}
 for(const id of ['date','pnl','currency','reference'])$('map-'+id).replaceChildren(new Option('Read CSV first',''));
 $('report').textContent='No parsed source. Nothing has been uploaded.';
 $('row-count').textContent='0';
}
function setReport(text,fail=false){$('report').textContent=text;$('report').className=fail?'warning':'note'}
$('demo').addEventListener('click',()=>{
 $('csv').value=sample;$('file').value='';synthetic=true;reset();
 setReport('Loaded invented demo text. Click Read local CSV to inspect the four fictional columns.');
});
$('file').addEventListener('change',()=>{synthetic=false;$('csv').value='';reset()});
$('csv').addEventListener('input',()=>{synthetic=false;$('file').value='';reset()});
$('read').addEventListener('click',async()=>{
 reset();
 try{
  const f=$('file').files[0];
  if(f&&f.size>MAX_SOURCE_BYTES)throw Error('This local file is over 1 MB; choose a smaller excerpt.');
  const src=f?await f.text():$('csv').value;
  parsed=parseCsv(src);
  for(const id of ['date','pnl','currency','reference']){
   const select=$('map-'+id);
   const defaultChoice=new Option('-- choose explicitly --','');
   select.replaceChildren(defaultChoice);
   for(const h of parsed.headers)select.add(new Option(h,h));
  }
  $('row-count').textContent=String(parsed.rows.length);
  setReport(String(parsed.rows.length)+' local rows parsed; explicitly select date, signed CLOSED PnL and settlement token fields. Nothing uploaded.'+
    (synthetic?' This is a completely invented demonstration.':''));
 }catch(e){setReport('Cannot parse local CSV: '+e.message,true)}
});
$('make').addEventListener('click',()=>{
 $('download').hidden=true;
 if(lastURL){URL.revokeObjectURL(lastURL);lastURL=null;}
 try{
  const mapping=Object.fromEntries(['date','pnl','currency','reference'].map(k=>[k,$('map-'+k).value]));
  const checks={
   closedPnl:$('ack-closed').checked,
   utcSource:$('ack-utc').checked,
   feesSeparate:$('ack-fees').checked
  };
  const output=makeCandidate(parsed,mapping,checks);
  lastURL=URL.createObjectURL(new Blob([output.csv],{type:'text/csv;charset=utf-8'}));
  $('download').href=lastURL;
  $('download').download='koinly-simple-closed-pnl-candidate-'+(synthetic?'FICTIONAL-':'')+'local.csv';
  $('download').hidden=false;
  setReport('Locally generated '+String(output.rows)+' candidate rows. Important: '+output.warning);
 }catch(e){setReport('STOP: no output was generated. '+e.message,true)}
});
window.addEventListener('pagehide',()=>{if(lastURL)URL.revokeObjectURL(lastURL)});
reset();
