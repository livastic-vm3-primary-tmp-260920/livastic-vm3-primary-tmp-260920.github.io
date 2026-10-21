import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildPaidQaPreview,serializeReport} from './build-paid-qa-sample.mjs';
import {parseCsv,makeCandidate} from './core.mjs';
const dir=new URL('./',import.meta.url);
const source=readFileSync(new URL('synthetic-buyer-10rows.csv',dir),'utf8');
const publicReport=JSON.parse(readFileSync(new URL('buyer-qa-example.json',dir),'utf8'));
const d=buildPaidQaPreview();
const map={date:'Closed At UTC',pnl:'Realized PnL',currency:'Settlement Asset',reference:'Invented Reference'};
const ack={closedPnl:true,utcSource:true,feesSeparate:true};
test('fixed original ten invented rows and machine report JSON reproducible',()=>{
 assert.equal(d.source.inventedDataRows,10);
 assert.equal(d.analysis.totalInputRows,10);
 assert.equal(d.source.sha256,createHash('sha256').update(source).digest('hex'));
 assert.deepEqual(publicReport,d);
 assert.equal(serializeReport(d),readFileSync(new URL('buyer-qa-example.json',dir),'utf8'));
 assert.equal(d.source.kind,'ENTIRELY_INVENTED_FAKE_10_ROW_CSV_NOT_NATIVE_NADO');
 assert.equal(d.source.actualCustomerDataUsed,false);
 assert.equal(d.source.actualNadoSourceSchemaValidated,false);
 assert.equal(d.source.actualKoinlyUploadOrImportTest,false);
});
test('correct human-visible CSV source line numbers are included',()=>{
 assert.deepEqual(d.analysis.detectedIssues.map(x=>x.line),[9,10,11]);
 assert.ok(d.analysis.detectedIssues[0].message.startsWith('Source line 9:'));
 assert.ok(d.analysis.detectedIssues[2].message.startsWith('Source line 11:'));
});
test('distinct issues date duplicate source reference and unknown settlement asset',()=>{
 assert.deepEqual(d.analysis.detectedIssues.map(x=>x.code),[
  'INVALID_UTC_DATE','DUPLICATE_SOURCE_EVENT_REFERENCE','UNKNOWN_SETTLEMENT_ASSET'
 ]);
 assert.equal(d.analysis.individuallySyntacticallyValidRows,7);
 assert.equal(d.analysis.sourceRowsNeedingHumanResolution,3);
 assert.ok(d.analysis.detectedIssues[1].message.includes('FAKE-PERP-006'));
 assert.ok(source.includes('2026-02-30'));
 assert.ok(source.includes('5.00,USD,FAKE-PERP-010'));
});
test('full sample is NEVER exported or silently filtered',()=>{
 const parsed=parseCsv(source);
 assert.throws(()=>makeCandidate(parsed,map,ack));
 assert.equal(d.analysis.status,'REJECT_FULL_INPUT');
 assert.equal(d.analysis.fullCandidateCsvReleased,false);
 assert.equal(d.analysis.automaticRowDropOrRepair,false);
 assert.equal(d.deliveryExample.decision,'NEEDS_DOCUMENTED_SOURCE_FIX_BEFORE_KOINLY_IMPORT');
 assert.equal(d.deliveryExample.paidDeliveryOrBuyerAcceptance,false);
});
test('report never claims payer, order, fees earned or real Nado client',()=>{
 assert.equal(d.deliveryExample.chargedNativeBaseCircleUSDC,0);
 assert.equal(d.deliveryExample.uniqueNewOnchainReceiptNativeBaseCircleUSDC,0);
 assert.ok(d.documentType.includes('NOT BUYER ORDER'));
 assert.ok(d.scope.constraints.includes('not economic truth'));
 assert.equal(d.safety.paymentAutomatic,false);
 assert.equal(d.safety.walletAccess,false);
 assert.equal(d.safety.realClientEvidence,false);
});
test('public firstparty sample code is source-only no fetching wallets or arbitrary client file paths',()=>{
 const src=readFileSync(new URL('build-paid-qa-sample.mjs',dir),'utf8');
 for(const bad of ['fetch(', 'XMLHttpRequest','WebSocket','eth_requestAccounts','ethereum.request','new Web3','process.env','localStorage','API_KEY','Bearer '])
  assert.equal(src.includes(bad),false,bad);
 assert.ok(src.includes('synthetic-buyer-10rows.csv'));
 assert.ok(src.includes('args[0]'));
});
test('source row order and header width stable, every reference fabricated',()=>{
 const rows=parseCsv(source).rows;
 assert.equal(rows.length,10);
 assert.ok(rows.every(x=>x.length===4));
 assert.ok(rows.every(x=>x[3].startsWith('FAKE-PERP-')));
 assert.ok(rows.every(x=>x[3]!==''));
});
