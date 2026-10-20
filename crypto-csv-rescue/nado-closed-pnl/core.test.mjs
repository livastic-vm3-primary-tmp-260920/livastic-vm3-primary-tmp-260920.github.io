import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseCsv,makeCandidate,normalizeUtc,normalizePnl,MAX_SOURCE_BYTES,MAX_SOURCE_DATA_ROWS,TARGET_HEADERS} from './core.mjs';
const fixture=readFileSync(new URL('./fictional-only.csv',import.meta.url),'utf8');
const selected={date:'Closed At UTC',pnl:'Realized PnL',currency:'Settlement Asset',reference:'Invented Reference'};
const confirmations={closedPnl:true,utcSource:true,feesSeparate:true};
const check=(csv=fixture,map=selected,ack=confirmations)=>makeCandidate(parseCsv(csv),map,ack);
test('original three fictional closed PnL rows map to Koinly Simple explicit tag',()=>{
 const result=check();
 assert.equal(result.rows,3);
 assert.deepEqual(result.headers,TARGET_HEADERS);
 assert.equal(result.csv.split('\r\n').filter(Boolean).length,4);
 assert.ok(result.csv.includes('"Koinly Date","Amount","Currency","Tag","Description"'));
 assert.ok(result.csv.includes('"2026-01-19 10:22:00","18.50","USDC","realized gain"'));
 assert.ok(result.csv.includes('"2026-01-19 11:44:15","-6.25","USDC","realized gain"'));
 assert.ok(result.csv.includes('"2026-01-20 04:05:01","3.00","USDT","realized gain"'));
 assert.ok(!result.csv.includes('Nado official'));}
);
test('explicit missing three confirmation checks fail independently',()=>{
 for(const key of Object.keys(confirmations)){
  assert.throws(()=>check(fixture,selected,{...confirmations,[key]:false}),/Confirm closed-position PnL/);
 }
 assert.throws(()=>check(fixture,selected,{}),/Confirm/);
});
test('original source must have a header + row and no duplicate headers',()=>{
 for(const text of ['', ' ', 'A,B\n','A,a\n1,2','A,,B\n1,2,3'])assert.throws(()=>parseCsv(text));
});
test('source RFC4180 commas, multiline and escaped quotes parse correctly',()=>{
 const x=parseCsv('A,B,C\r\n"hi,there","a""b","line 1\nline 2"\r\n');
 assert.deepEqual(x.rows,[['hi,there','a"b','line 1\nline 2']]);
});
test('malformed source CSV, stray quotes and row length mismatches fail closed',()=>{
 for(const text of ['A,B\n"123,abc\n','A,B\n3"4,5\n','A,B\n"3"more,5\n','A,B\n3\n','A,B\n3,4,5\n','A,B\n3,4\r5,6\n'])
  assert.throws(()=>parseCsv(text));
});
test('injected formula in reference is data only inside constant-prefixed Description',()=>{
 const data=fixture.replace('FAKE-PERP-A','=@evil()');
 const r=check(data);
 assert.ok(r.csv.includes('source not verified; ref =@evil()'));
 assert.ok(!r.csv.split('\r\n').some(line=>line.startsWith('=')||line.startsWith('@')));
});
test('duplicate nonempty reference blocks',()=>{
 const p=fixture.replace('FAKE-PERP-B','FAKE-PERP-A');
 assert.throws(()=>check(p),/duplicate nonempty event reference/);
});
test('duplicate source column mapping blocks',()=>{
 assert.throws(()=>check(fixture,{...selected,currency:selected.pnl}),/reuse/);
 assert.throws(()=>check(fixture,{...selected,date:'wrong'}),/Select source CSV column/);
 assert.throws(()=>check(fixture,{...selected,reference:selected.pnl}),/conflicts/);
});
test('unknown settlement token, blank token, USD notional reject',()=>{
 for(const x of ['USD','USDC.e','USDC-ink','', 'BTC','usdc','ETH']){
  assert.throws(()=>check(fixture.replace(',USDC,FAKE-PERP-A',','+x+',FAKE-PERP-A')),/unverified settlement currency/);
 }
});
test('dates must be source-proven explicit UTC and calendar-valid',()=>{
 for(const invalid of ['2026-02-30T10:22:00Z','2026-01-19T25:22:00Z','2026-01-19T10:61:00Z','2026-01-19 10:22:00+09:00','2026-01-19T10:22:00.444Z','1/19/2026','2026-01-19T10:22:60Z','2026-13-01T10:22:00Z']){
  assert.throws(()=>normalizeUtc(invalid),/UTC|range|calendar/i);
 }
 assert.equal(normalizeUtc('2026-01-19 10:22:00'),'2026-01-19 10:22:00');
 assert.equal(normalizeUtc('2026-01-19T10:22:00Z'),'2026-01-19 10:22:00');
});
test('signed PnL never converted from percentage, exponent, locale or Infinity',()=>{
 for(const invalid of ['', '0','0.000000','-0.00','12,000','0x12','5%','$5','Infinity','NaN','1e9','--3.22','+0','+00.5']){
  assert.throws(()=>normalizePnl(invalid));
 }
 assert.equal(normalizePnl('-2.254001'),'-2.254001');
 assert.equal(normalizePnl('+2.5'),'2.5');
});
test('file byte limit includes UTF8 and limits rows and column count',()=>{
 assert.throws(()=>parseCsv('a'.repeat(MAX_SOURCE_BYTES+1)),/over 1 MB/);
 assert.throws(()=>parseCsv('A,B\n'+('1,2\n'.repeat(MAX_SOURCE_DATA_ROWS+1))),/2500/);
 assert.throws(()=>parseCsv(Array.from({length:61},(_,i)=>'H'+i).join(',')+'\n'+Array.from({length:61},()=>1).join(',')),/too many columns/);
});
test('no network, wallet interaction, or heuristic fee and funding deduction in core',()=>{
 const core=readFileSync(new URL('./core.mjs',import.meta.url),'utf8');
 for(const text of ['fetch(', 'XMLHttpRequest','WebSocket','navigator.sendBeacon','ethereum.request','window.localStorage','document.cookie']) assert.ok(!core.includes(text),text);
 assert.ok(check().warning.includes('funding'));
});
test('invalid or omitted records do not produce files silently',()=>{
 const invalids=[
  fixture.replace('18.50',''),fixture.replace('18.50','0'),fixture.replace('18.50','NaN'),
  fixture.replace('2026-01-19T10:22:00Z','today'),fixture.replace('FAKE-PERP-A','FAKE-PERP-A'.repeat(40))
 ];
 for(const src of invalids)assert.throws(()=>check(src));
});

test('empty interior source data row is never silently dropped',()=>{
 assert.throws(()=>parseCsv('A,B\n\n1,2\n'),/Empty CSV row/);
});
