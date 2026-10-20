/**
 * Browser-local manual, normalized CLOSED derivative PnL to Koinly Simple candidate.
 * Does NOT parse Nado-native schemas, calculate PnL/taxes, or import to Koinly.
 * The user's original source CSV is never uploaded.
 */
export const MAX_SOURCE_BYTES=1_000_000;
export const MAX_SOURCE_DATA_ROWS=2500;
const MAX_COLS=60;
const ALLOWED_ASSETS=new Set(['USDC','USDT','DAI','USDS','PYUSD','RLUSD','USDG','GHO','EURC','USDE']);
export const TARGET_HEADERS=Object.freeze(['Koinly Date','Amount','Currency','Tag','Description']);

export function parseCsv(text){
 if(typeof text!=='string')throw Error('CSV text required');
 if(new TextEncoder().encode(text).length>MAX_SOURCE_BYTES)throw Error('CSV is over 1 MB; use a smaller local sample.');
 if(text.startsWith('\uFEFF'))text=text.slice(1);
 if(!text.trim())throw Error('CSV is empty.');
 if(text.includes('\0'))throw Error('Binary/NUL CSV unsupported.');
 const records=[];let row=[],field='',quoted=false,afterQuote=false,started=false;
 const addField=()=>{if(row.length>=MAX_COLS)throw Error('CSV has too many columns.');row.push(field);field='';afterQuote=false;started=false};
 const addRow=()=>{
  addField();
  if(row.every(f=>f.trim()===''))throw Error('Empty CSV row: cannot silently drop data.');
  records.push(row);
  row=[];
  if(records.length>MAX_SOURCE_DATA_ROWS+1)throw Error('Over 2500 data rows; divide the local file.');
 };
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){
   if(c==='"'){
    if(text[i+1]==='"'){field+='"';i++}
    else{quoted=false;afterQuote=true}
   }else field+=c;
   continue;
  }
  if(afterQuote){
   if(c===','){addField();continue}
   if(c==='\n'){addRow();continue}
   if(c==='\r'&&text[i+1]==='\n'){i++;addRow();continue}
   throw Error('Malformed CSV after a quoted cell.');
  }
  if(c==='"'){
   if(started||field!=='')throw Error('Unexpected quote in an unquoted CSV cell.');
   quoted=true;started=true;
  }else if(c===',')addField();
  else if(c==='\n')addRow();
  else if(c==='\r'){
   if(text[i+1]!=='\n')throw Error('Use CRLF or LF line endings.');
   i++;addRow();
  }else{field+=c;started=true}
 }
 if(quoted)throw Error('Unclosed CSV quote.');
 if(field!==''||started||row.length) addRow();
 if(records.length<2)throw Error('At least one header and one local data row required.');
 const headers=records.shift().map(h=>h.trim());
 if(headers.some(h=>!h||h.length>150))throw Error('CSV has an empty or oversize header.');
 if(new Set(headers.map(h=>h.toLowerCase())).size!==headers.length)throw Error('Duplicate source column headers need manual correction.');
 for(const [i,r] of records.entries())
  if(r.length!==headers.length)throw Error('CSV row '+String(i+2)+' has '+r.length+' cells; expected '+headers.length+'.');
 return {headers,rows:records};
}

export function normalizeUtc(s){
 if(typeof s!=='string')throw Error('Timestamp text required');
 const m=/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(Z)?$/.exec(s.trim());
 if(!m)throw Error('UTC timestamp must be YYYY-MM-DD HH:mm:ss or YYYY-MM-DDTHH:mm:ssZ.');
 const [y,mo,d,h,mi,sec]=m.slice(1,7).map(Number);
 if(y<1970||y>2100||mo<1||mo>12||d<1||d>31||h>23||mi>59||sec>59)
  throw Error('Out-of-range UTC timestamp.');
 const epoch=Date.UTC(y,mo-1,d,h,mi,sec);
 const check=new Date(epoch);
 if(check.getUTCFullYear()!==y||check.getUTCMonth()+1!==mo||check.getUTCDate()!==d||check.getUTCHours()!==h||check.getUTCMinutes()!==mi||check.getUTCSeconds()!==sec)
  throw Error('Invalid UTC calendar date.');
 return [m[1],m[2],m[3]].join('-')+' '+[m[4],m[5],m[6]].join(':');
}
export function normalizePnl(s){
 if(typeof s!=='string')throw Error('Realized PnL is not text.');
 const n=s.trim();
 if(!/^[+-]?(?:0|[1-9]\d{0,19})(?:\.\d{1,18})?$/.test(n))throw Error('Signed decimal required, without commas, exponent or currency symbols.');
 if(/^[-+]?0(?:\.0+)?$/.test(n))throw Error('Zero/non-settled PnL cannot be inferred.');
 return n.startsWith('+')?n.slice(1):n;
}
function encodeCsv(rows){return rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n'}

export function makeCandidate(parsed,mapping,checks){
 if(!parsed||!Array.isArray(parsed.headers)||!Array.isArray(parsed.rows))throw Error('Parse a local CSV first.');
 if(!checks||checks.closedPnl!==true||checks.utcSource!==true||checks.feesSeparate!==true)
  throw Error('Confirm closed-position PnL, original source UTC, and separately reviewed fees/funding.');
 if(!mapping||typeof mapping!=='object')throw Error('Explicit column selection required.');
 const indices={};const used=new Set();
 for(const key of ['date','pnl','currency']){
  const s=mapping[key];
  if(typeof s!=='string'||!s||!parsed.headers.includes(s))throw Error('Select source CSV column for '+key+'.');
  if(used.has(s))throw Error('Do not reuse one source column for two meanings.');
  indices[key]=parsed.headers.indexOf(s);used.add(s);
 }
 if(mapping.reference){
  if(typeof mapping.reference!=='string'||!parsed.headers.includes(mapping.reference)||used.has(mapping.reference))
   throw Error('Reference column conflicts with required columns.');
  indices.reference=parsed.headers.indexOf(mapping.reference);
 }
 const result=[TARGET_HEADERS],seenReferences=new Set();
 if(parsed.rows.length>MAX_SOURCE_DATA_ROWS)throw Error('Too many rows.');
 for(const [i,row] of parsed.rows.entries()){
  const line=i+2;
  if(!Array.isArray(row)||row.length!==parsed.headers.length)throw Error('Source row length mismatch at line '+line);
  let stamp,pnl;
  try{stamp=normalizeUtc(row[indices.date]);pnl=normalizePnl(row[indices.pnl])}
  catch(e){throw Error('Source line '+line+': '+e.message)}
  const curr=row[indices.currency].trim();
  if(!ALLOWED_ASSETS.has(curr))throw Error('Source line '+line+': unverified settlement currency; stop instead of guessing.');
  let reference='';
  if(indices.reference!==undefined){
   reference=row[indices.reference].trim();
   if(reference.length>160)throw Error('Source line '+line+': reference exceeds 160 characters.');
   if(reference){
    if(seenReferences.has(reference))throw Error('Source line '+line+': duplicate nonempty event reference; do not double-import.');
    seenReferences.add(reference);
   }
  }
  const description='Manual CLOSED derivative PnL; source not verified'+(reference?'; ref '+reference.replaceAll(/[\r\n\t]/g,' '):'');
  result.push([stamp,pnl,curr,'realized gain',description]);
 }
 return {csv:encodeCsv(result),rows:parsed.rows.length,headers:TARGET_HEADERS,
  warning:'NOT a Nado-native parser or tax report. Verify exact source rows, UTC, close-only PnL, funding, fees, transfers and duplicate imports. No upload.'};
}
