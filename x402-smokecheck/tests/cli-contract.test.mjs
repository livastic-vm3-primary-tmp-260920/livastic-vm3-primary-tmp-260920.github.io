import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {mkdtemp, writeFile, symlink, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, dirname} from "node:path";
import {readSyntheticJson} from "../fixture.mjs";
const CLI=fileURLToPath(new URL("../cli.mjs",import.meta.url));
const BASE=["--url","https://owned.public-example.dev/paid","--origin","https://buyer.public-example.dev"];
const run=(args)=>spawnSync(process.execPath,[CLI,...args],{encoding:"utf8",timeout:2500});
test("CLI help includes strict fixture permissions and no wallet assumption",()=>{
 const x=run(["--help"]);assert.equal(x.status,0);assert.match(x.stdout,/v1.0.1/);
 assert.match(x.stdout,/--permit-unpaid-post/);assert.match(x.stdout,/--fixture-json-file/);
});
test("CLI rejects a request without explicit endpoint control before network",()=>{
 const x=run([...BASE,"--method","GET"]);assert.equal(x.status,1);
 assert.match(x.stderr,/operator authorization flag/);
});
test("CLI refuses POST without explicit authorization even with a filename",()=>{
 const x=run([...BASE,"--method","POST","--i-control-endpoint","--fixture-json-file","sample.json"]);
 assert.equal(x.status,1);assert.match(x.stderr,/--permit-unpaid-post/);
});
test("CLI refuses a fixture on GET",()=>{
 const x=run([...BASE,"--method","GET","--i-control-endpoint","--fixture-json-file","synthetic.json"]);
 assert.equal(x.status,1);assert.match(x.stderr,/only allowed for explicitly approved POST/);
});
test("local fixture validator reads only regular synthetic JSON files",async()=>{
 const dir=await mkdtemp(join(tmpdir(),"x402fixture-test-"));
 try{
  const valid=join(dir,"synthetic.json");
  await writeFile(valid,JSON.stringify({csvText:"a,b\n1,2\n"}));
  assert.deepEqual(JSON.parse(await readSyntheticJson(valid)),{csvText:"a,b\n1,2\n"});
  const link=join(dir,"link.json");await symlink(valid,link);
  await assert.rejects(()=>readSyntheticJson(link),/regular file/);
  const invalid=join(dir,"secret.json");await writeFile(invalid,'{"authorization":"test"}');
  await assert.rejects(()=>readSyntheticJson(invalid),/secret-bearing/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
