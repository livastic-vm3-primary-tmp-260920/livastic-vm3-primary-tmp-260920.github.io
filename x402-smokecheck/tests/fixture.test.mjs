import test from "node:test";
import assert from "node:assert/strict";
import {parseSyntheticJson} from "../fixture.mjs";
test("synthetic CSV record fixture passes without changing user data", () => {
 const v={csvText:"a,b\n1,2\n",limit:2,simulate:true};
 assert.deepEqual(JSON.parse(parseSyntheticJson(JSON.stringify(v))),v);
});
test("rejects invalid JSON",()=>assert.throws(()=>parseSyntheticJson("{oops"),/valid JSON/));
test("rejects top-level arrays",()=>assert.throws(()=>parseSyntheticJson("[1,2]"),/top level/));
test("rejects >4096-byte payload",()=>assert.throws(()=>parseSyntheticJson(JSON.stringify({a:"z".repeat(4096)})),/4096/));
test("rejects sensitive Authorization fields",()=>assert.throws(()=>parseSyntheticJson('{"Authorization":"synthetic bearer"}'),/secret-bearing/));
test("rejects hidden bearer token in harmless field",()=>assert.throws(()=>parseSyntheticJson('{"note":"Bearer abcDEFGHIJKLMNOP12345"}'),/sensitive-looking/));
test("rejects nested seed and payment signatures",()=>{
 assert.throws(()=>parseSyntheticJson('{"nested":{"seed_phrase":"fake 12 words"}}'),/secret-bearing/);
 assert.throws(()=>parseSyntheticJson('{"payment_signature":"aaa"}'),/secret-bearing/);
});
test("rejects untrusted secret/private hexadecimal strings",()=>assert.throws(()=>parseSyntheticJson(JSON.stringify({id:"0x"+"a".repeat(64)})),/sensitive-looking/));
test("rejects many fields",()=>assert.throws(()=>parseSyntheticJson(JSON.stringify(Object.fromEntries(Array.from({length:81},(_,i)=>["field_"+i,i])))),/Too many/));
test("rejects too deeply nested objects",()=>{
 let v={v:1};for(let i=0;i<10;i++)v={child:v};
 assert.throws(()=>parseSyntheticJson(JSON.stringify(v)),/deeply nested/);
});
test("permits synthetic arrays and null",()=>assert.deepEqual(JSON.parse(parseSyntheticJson('{"items":[1,2,null],"safe":false}')).items,[1,2,null]));
