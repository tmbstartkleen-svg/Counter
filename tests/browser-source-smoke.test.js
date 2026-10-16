import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {Script} from 'node:vm';
const pages=['index.html','public/index.html','online.html','public/online.html'];
for(const file of pages)test('inline browser scripts parse: '+file,()=>{
 const source=readFileSync(file,'utf8');
 const matches=[...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 assert.ok(matches.some(m=>m[1].trim()),'expected inline browser script');
 for(const [i,m] of matches.entries())new Script(m[1],{filename:file+':script'+i});
});
for(const asset of ['v24-casino.css','v25-guided.js','v26-progress.js','public/v24-casino.css','public/v25-guided.js','public/v26-progress.js'])test('referenced training asset exists: '+asset,()=>assert.ok(existsSync(asset)));

for(const name of ['index.html','online.html','v25-guided.js','v26-progress.js'])test('deployed public copy matches source: '+name,()=>{
 assert.equal(readFileSync('public/'+name,'utf8'),readFileSync(name,'utf8'));
});
