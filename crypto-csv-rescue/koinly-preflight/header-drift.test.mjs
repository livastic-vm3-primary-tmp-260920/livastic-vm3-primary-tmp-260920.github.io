import test from "node:test";
import assert from "node:assert/strict";
import {parseHeaderOnly,comparePublicHeaderShapes,FICTIONAL_OLD,FICTIONAL_NEW,MAX_HEADER_CHARS,MAX_FIELDS} from "./header-drift.mjs";
test("fully fictional current-vs-previous header diff gives exact names but not an automatic conversion",()=>{
  const result=comparePublicHeaderShapes(FICTIONAL_OLD,FICTIONAL_NEW);
  assert.equal(result.code,"HEADER_COLUMNS_CHANGED");
  assert.deepEqual(result.oldOnly,["Time","Type","Amount","Currency"]);
  assert.deepEqual(result.newOnly,["Timestamp","Transaction Type","Quantity","Asset"]);
  assert.equal(result.oldCount,5);assert.equal(result.newCount,5);
  assert.equal(result.automaticRewriteAllowed,false);
  assert.equal(result.requiresKoinlySupport,true);
  assert.equal(result.uploadOrNetworkCall,false);
  assert.equal(result.actualImportTested,false);
});
test("without a known-working header, do not infer a Strike schema migration",()=>{
  const result=comparePublicHeaderShapes("",FICTIONAL_NEW);
  assert.equal(result.code,"CURRENT_HEADER_ONLY_NO_OLD_SAMPLE");
  assert.deepEqual(result.oldOnly,[]);
  assert.deepEqual(result.newOnly,[]);
  assert.equal(result.oldCount,0);
});
test("same fields, new positions are reordered not lost",()=>{
  const r=comparePublicHeaderShapes("Time,Type,Amount","Amount,Type,Time");
  assert.equal(r.code,"CSV_FIELD_ORDER_CHANGED");
  assert.equal(r.sameFieldsDifferentOrder,true);
  assert.deepEqual(r.oldOnly,[]);assert.deepEqual(r.newOnly,[]);
});
test("same fields, actual separator changed",()=>{
  const r=comparePublicHeaderShapes("Time;Type;Amount","Time,Type,Amount");
  assert.equal(r.code,"CSV_SEPARATOR_CHANGED");
  assert.equal(r.separatorChanged,true);
  assert.equal(r.sameFieldsDifferentOrder,false);
});
test("same fields, capitalization and spacing changed",()=>{
  const r=comparePublicHeaderShapes("Date, Amount"," DATE ,amount");
  assert.equal(r.code,"HEADER_CASE_OR_SPACING_CHANGED");
  assert.equal(r.oldCount,2);
});
test("identical fields and separator: no header change does NOT promise Koinly import",()=>{
  const r=comparePublicHeaderShapes("Date,Amount","Date,Amount");
  assert.equal(r.code,"NO_HEADER_DIFFERENCE_OBSERVED");
  assert.equal(r.actualImportTested,false);
  assert.equal(r.requiresKoinlySupport,true);
});
test("UTF-8 BOM and one trailing CRLF accepted for header only",()=>{
  const r=parseHeaderOnly("\uFEFFDate,Amount\r\n");
  assert.deepEqual(r.cells,["Date","Amount"]);
  assert.equal(r.delimiter,",");
});
test("semicolon and tab delimiters accepted",()=>{
  assert.equal(parseHeaderOnly("Date;Amount;Asset").delimiter,";");
  assert.equal(parseHeaderOnly("Date\tAmount\tAsset").delimiter,"\t");
  assert.deepEqual(parseHeaderOnly("Date\tAmount\tAsset").cells,["Date","Amount","Asset"]);
});
test("proper CSV double-quote escaping and comma within header field",()=>{
  const h=parseHeaderOnly('"Settlement, UTC","Trade ""type""",Fee');
  assert.deepEqual(h.cells,["Settlement, UTC",'Trade "type"',"Fee"]);
});
test("reject real-looking transaction rows or sensitive names",()=>{
  for(const row of [
    "2026-10-20,0.005,USDC",
    "2026/10/20,0.005",
    "Name,person@example.com",
    "Amount,0x" + "a".repeat(40),
    "Time,Seed Phrase",
    "Account,private_key",
    "-----BEGIN PRIVATE KEY-----,Time"
  ]) {
    assert.throws(()=>parseHeaderOnly(row),/POTENTIAL_SENSITIVE_DATA_REFUSED|POTENTIAL_DATA_ROW_OR_SENSITIVE_FIELD/);
  }
});
test("reject pasting the entire file (multiple CSV rows)",()=>{
  for(const src of ["Date,Amount\n2026-10-20,1.20",
    "Date,Amount\r\n2026-10-20,1.20",
    "Date,Amount\r2026-10-20,1.20"])
      assert.throws(()=>parseHeaderOnly(src),/MULTIROW_INPUT_REFUSED/);
});
test("reject unsupported quoted syntax instead of silently moving fields",()=>{
  for(const header of ['Date,"Amount','"Date", "Amount"', 'Date,Am"ount']){
    assert.throws(()=>parseHeaderOnly(header),/INVALID_CSV_HEADER_QUOTING|UNTERMINATED_CSV_HEADER_QUOTE/);
  }
});
test("duplicate columns even with case/whitespace normalized rejected",()=>{
  for(const header of ["Date,date","Date, date ","Date,DATE","DATE,ＤＡＴＥ"]){
    assert.throws(()=>parseHeaderOnly(header),/DUPLICATE_OR_COLLIDING_HEADER_FIELD/);
  }
});
test("hard max length, max 36 fields, empty or oversize fields",()=>{
  assert.equal(MAX_HEADER_CHARS,2048);
  assert.equal(MAX_FIELDS,36);
  assert.throws(()=>parseHeaderOnly("x".repeat(MAX_HEADER_CHARS+1)),/HEADER_TOO_LONG/);
  assert.throws(()=>parseHeaderOnly(Array.from({length:37},(_,i)=>"H"+i).join(",")),/TOO_MANY_HEADER_FIELDS/);
  assert.throws(()=>parseHeaderOnly("A,,B"),/EMPTY_OR_OVERSIZE_HEADER_FIELD/);
  assert.throws(()=>parseHeaderOnly("A,"+"a".repeat(129)),/EMPTY_OR_OVERSIZE_HEADER_FIELD/);
});
test("reject zero or one header column or invalid empty values",()=>{
  for(const header of ["","   ","oneColumn"])
    assert.throws(()=>parseHeaderOnly(header),/EMPTY_HEADER|SINGLE_COLUMN_CANNOT_COMPARE/);
});
test("preserve names with no invented semantic mapping or transaction validation",()=>{
  const r=comparePublicHeaderShapes("Date,Amount","Timestamp,Quantity");
  assert.deepEqual(r.oldOnly,["Date","Amount"]);
  assert.deepEqual(r.newOnly,["Timestamp","Quantity"]);
  assert.equal(r.automaticRewriteAllowed,false);
  assert.equal(r.actualImportTested,false);
});
test("Unicode case folding only for detect; never rewrite source",()=>{
  const r=comparePublicHeaderShapes("Ａｍｏｕｎｔ,Date","Amount,Date");
  assert.equal(r.code,"HEADER_CASE_OR_SPACING_CHANGED");
  assert.deepEqual(r.oldOnly,[]);
  assert.deepEqual(r.newOnly,[]);
});
test("field contents with HTML-like text stay inert text only",()=>{
  const header=parseHeaderOnly("Date,<script>alert(1)</script>");
  assert.equal(header.cells[1],"<script>alert(1)</script>");
  assert.equal(header.count,2);
});
