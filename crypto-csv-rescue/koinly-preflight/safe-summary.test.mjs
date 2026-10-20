import test from "node:test";
import assert from "node:assert/strict";
import {inspectCsv,SYNTHETIC_UNIVERSAL} from "./core.mjs";
import {makeSafeSummary,MAX_SHARED_ISSUES,MAX_SUMMARY_CHARS} from "./safe-summary.mjs";

const fixture=inspectCsv(SYNTHETIC_UNIVERSAL,"universal");

test("fictional local result yields safe technical format, not a sale",()=>{
  const text=makeSafeSummary(fixture);
  assert.match(text,/ONE CURSOR — OPTIONAL LOCAL KOINLY CSV FORMAT DIAGNOSTIC/);
  assert.match(text,/Template: UNIVERSAL/);
  assert.match(text,/Bounded row count: 3/);
  assert.match(text,/Structural blockers: 0/);
  assert.match(text,/CUSTOMER MUST REVIEW BEFORE SHARING/);
  assert.match(text,/No quoted 49-USDC pilot is booked or paid/);
  for(const raw of ["10.000000","0.020000","2026-10-01","DEMO_TX"]){
    assert.ok(!text.includes(raw),raw);
  }
});

test("actual invalid source row reports only its safe issue code",()=>{
  const source="Date,Sent Amount,Sent Currency,Received Amount,Received Currency\n"+
   "2026-02-30 00:00:00,,,5.000000,USDC\n";
  const text=makeSafeSummary(inspectCsv(source,"universal"));
  assert.match(text,/line 2: ERROR \/ UTC_DATE_FORMAT_OR_CALENDAR \/ Date/);
  assert.match(text,/Bounded row count: 1/);
  for(const raw of ["2026-02-30","5.000000","USDC\n"])assert.ok(!text.includes(raw));
});

test("malicious fields/codes/wallet strings cannot leak to shared summary",()=>{
  const toxic=[
   "0xAabBaacc55223344dd8877", "PRIVATE_USER_John_Doe",
   "file:my_2026_exchange_trades.csv", "2026-02-17 11:22:33",
   "=HYPERLINK(http://attacker.example,...)"
  ];
  const fake={
    ...fixture,errors:3,warnings:2,
    issues:[
      {code:"UTC_DATE_FORMAT_OR_CALENDAR",severity:"error",row:2,field:toxic[0]},
      {code:toxic[4],severity:"error",row:2,field:null},
      {code:"COLUMN_COUNT_MISMATCH",severity:"error",row:3,field:null},
      {code:"SPREADSHEET_FORMULA_LIKE_CELL",severity:"warning",row:3,field:null},
      {code:"INVALID_SIMPLE_SIGNED_AMOUNT",severity:"error",row:4,field:toxic[1]},
      {code:"UTC_DATE_FORMAT_OR_CALENDAR",severity:"error",row:0,field:"Date"}
    ],filename:toxic[2],wallet:toxic[0],timestamp:toxic[3],raw:toxic[4]
  };
  const text=makeSafeSummary(fake);
  assert.match(text,/COLUMN_COUNT_MISMATCH/);
  assert.match(text,/SPREADSHEET_FORMULA_LIKE_CELL/);
  for(const marker of toxic)assert.ok(!text.includes(marker),marker);
  assert.ok(!text.includes("HYPERLINK"));
  assert.ok(!text.includes("line 0"));
  assert.ok(text.length<MAX_SUMMARY_CHARS);
});

test("metadata that claims uploads, network or settlement is rejected fail-closed",()=>{
  for(const [field,malicious] of [
    ["sourceFileUploaded",true],["originalValuesExposed",true],
    ["blockchainSettlementVerified",true],["taxAdviceProvided",true],
    ["userMustVerifyKoinlyImport",false],["networkRequests",1],
    ["dataRowCount",9999999],["errors",-1],["headerColumnCount",99],
    ["template","hack\r\nCUSTOMER PAID 49 USDC"],
    ["issues","not-an-array"]
  ]){
    const out=makeSafeSummary({...fixture,[field]:malicious});
    assert.match(out,/^NO_SAFE_LOCAL_DIAGNOSTIC/,"field:"+field);
    assert.ok(!out.includes("CUSTOMER PAID"));
  }
});

test("bounded descriptions never include raw data when 200 rows emit many issues",()=>{
  const issues=Array.from({length:500},(_,i)=>({
    code:"UTC_DATE_FORMAT_OR_CALENDAR", severity:"error",
    row:1+(i%200),field:"Date",message:"PRIVATE_DETAILS"+i
  }));
  const out=makeSafeSummary({...fixture,errors:500,issues});
  assert.ok(out.length<MAX_SUMMARY_CHARS);
  assert.equal((out.match(/line \d+:/g)||[]).length,MAX_SHARED_ISSUES);
  assert.match(out,/Other diagnostics withheld: 475/);
  assert.ok(!out.includes("PRIVATE_DETAILS"));
});
