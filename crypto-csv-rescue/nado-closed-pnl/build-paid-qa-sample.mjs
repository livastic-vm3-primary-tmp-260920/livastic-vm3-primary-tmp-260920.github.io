/**
 * Sample ONLY for completely synthetic 10-row CSV.
 * The real paid report takes independently scoped buyer public/fictional data
 * and independently validates the provenance; this executable does not accept
 * real source files, client data, wallet IDs or filenames as CLI inputs.
 * It never assumes Nado-native source headers or silently corrects/rejects
 * one row to make the full CSV seem safe.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {parseCsv,makeCandidate} from './core.mjs';

const dir=dirname(fileURLToPath(import.meta.url));
const source=readFileSync(join(dir,'synthetic-buyer-10rows.csv'),'utf8');
const SHA=createHash('sha256').update(source,'utf8').digest('hex');
const parsed=parseCsv(source);
const requiredMapping={date:'Closed At UTC',pnl:'Realized PnL',currency:'Settlement Asset',reference:'Invented Reference'};
const reviews={closedPnl:true,utcSource:true,feesSeparate:true};
const assert=(truth,message)=>{if(!truth)throw Error(message)};

function classifyInventedRows(data){
 const ids=new Set();
 let valid=0;const issues=[];
 assert(data?.headers?.join('|')===Object.values(requiredMapping).join('|'),'Sample source shape changed; do not infer');
 assert(data.rows.length===10,'This is explicitly a fixed ten-row synthetic QA example');
 for(let i=0;i<data.rows.length;i++){
  const line=i+2, row=data.rows[i];
  assert(row.length===data.headers.length,'Row length does not match heading width');
  // First-party core validates real conversion restrictions per individual
  // fictional row; complete-file conversion is REFUSED if any issue exists.
  try{makeCandidate({headers:data.headers,rows:[row]},requiredMapping,reviews)}
  catch(e){
   issues.push({line,code: /UTC|calendar|date/i.test(e.message)?'INVALID_UTC_DATE':
                       /currency/i.test(e.message)?'UNKNOWN_SETTLEMENT_ASSET':'OTHER_UNVERIFIED',
                message:String(e.message).replace(/^Source line 2:/,'Source line '+line+':').slice(0,140)});
  }
  const id=row[3];
  if(id){
   if(ids.has(id))issues.push({
    line,code:'DUPLICATE_SOURCE_EVENT_REFERENCE',
    message:'Invented source reference '+id+' occurs more than once; manual disposition required. No silent drop.'
   });
   ids.add(id);
  }
  const has=issues.some(x=>x.line===line);
  if(!has)valid++;
 }
 return {issues,individuallySyntacticallyValidRowCount:valid};
}
export function buildPaidQaPreview(){
 const results=classifyInventedRows(parsed);
 assert(results.issues.length===3,'Expected exactly three deliberate invented source problems');
 assert(results.individuallySyntacticallyValidRowCount===7,'Seven individual invented rows should pass syntactically');
 assert(results.issues.map(x=>x.code).join('|')==='INVALID_UTC_DATE|DUPLICATE_SOURCE_EVENT_REFERENCE|UNKNOWN_SETTLEMENT_ASSET',
  'Issue ordering has changed: report requires manual review');
 let converted=false;
 try{makeCandidate(parsed,requiredMapping,reviews);converted=true;}catch{}
 assert(converted===false,'Full invented source MUST fail closed: do not export a partial candidate');
 return {
  format:'onecursor-public-synthetic-9usdc-QA-example-v1',
  documentType:'FREE ORIGINAL DEMO NOT BUYER ORDER OR COMPLETED PAID WORK',
  freeTool:'https://livastic-vm3-primary-tmp-260920.github.io/crypto-csv-rescue/nado-closed-pnl/',
  originalRealX402Listing:'https://talktomyagent.dev/api/market/listings/lst_agt_mvhc997e_5j0oocaq',
  firstpartyKoinlyDocumentation:[
    'https://support.koinly.io/en/articles/9489976-how-to-create-a-custom-csv-file-with-your-data',
    'https://support.koinly.io/en/articles/9490027-futures-and-perpetuals-pnl-other-gains'
  ],
  source:{
    kind:'ENTIRELY_INVENTED_FAKE_10_ROW_CSV_NOT_NATIVE_NADO',
    file:'synthetic-buyer-10rows.csv',
    sha256:SHA,
    columns:parsed.headers,
    inventedDataRows:parsed.rows.length,
    actualCustomerDataUsed:false,
    actualNadoSourceSchemaValidated:false,
    actualKoinlyUploadOrImportTest:false
  },
  scope:{
    namedProblem:'One fictional 10-row closed-PnL Koinly Simple manual mapping quality gate',
    verifiedAssumptions:[
      'Only invented source declares signed already-realized closed PnL.',
      'Invented header explicitly says UTC, no genuine exchange timezone verified.',
      'Source has two named example settlement tokens; USD is NOT silently assumed USDC.',
      'Trading fees, funding and collateral are outside this synthetic-only sample.'
    ],
    constraints:'This sample tests structural fields only, not economic truth, tax basis, native Nado compatibility or ledger completeness.'
  },
  analysis:{
    status:'REJECT_FULL_INPUT',
    totalInputRows:parsed.rows.length,
    individuallySyntacticallyValidRows:results.individuallySyntacticallyValidRowCount,
    sourceRowsNeedingHumanResolution:3,
    detectedIssues:results.issues,
    fullCandidateCsvReleased:false,
    automaticRowDropOrRepair:false
  },
  deliveryExample:{
    decision:'NEEDS_DOCUMENTED_SOURCE_FIX_BEFORE_KOINLY_IMPORT',
    recommendedAction:'Verify original UTC calendar dates, resolve duplicated closed-position reference and obtain the real settlement asset from the source. Never guess PnL or currency.',
    outputType:'short findings note + tests + candidate only if every input passes and source provenance is independently documented',
    paidDeliveryOrBuyerAcceptance:false,
    chargedNativeBaseCircleUSDC:0,
    uniqueNewOnchainReceiptNativeBaseCircleUSDC:0
  },
  safety:{
    dataCollection:'NONE (firstparty static downloadable invented CSV only)',
    paymentAutomatic:false,walletAccess:false,realClientEvidence:false,
    notInvestmentOrAccountingAdvice:true,thirdPartyEndorsement:false
  }
 };
}
export function serializeReport(report){return JSON.stringify(report,null,2)+'\n'}
if(process.argv[1] && fileURLToPath(import.meta.url)===process.argv[1]){
 const args=process.argv.slice(2);
 if(args.length>1 || (args.length===1&&args[0]!=='--check'))
  throw Error('This example only builds or --check-verifies the fixed synthetic fixture, never accepts customer input');
 const out=serializeReport(buildPaidQaPreview());
 const path=join(dir,'buyer-qa-example.json');
 if(args[0]==='--check'){
   assert(readFileSync(path,'utf8')===out,'Committed public synthetic sample JSON is not reproducible');
   console.log('PASS: deterministic ten invented rows, three withheld source issues, no Koinly import/no wallet');
 }else{
   writeFileSync(path,out,'utf8');
   console.log('Generated entirely fictional ten-row report:',path,'bytes',out.length);
 }
}
