import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const client=readFileSync('public/online.html','utf8');
test('online table uses received state variable when updating leave control',()=>{
 assert.match(client,/render\(m\);\$\('leaveRoom'\)\.disabled=m\.phase/);
 assert.doesNotMatch(client,/render\(m\);\$\('leaveRoom'\)\.disabled=s\.phase/);
});
test('online multiplayer assets mirror root and display participant presence',()=>{
 assert.equal(client,readFileSync('online.html','utf8'));
 assert.match(client,/p\.connected/);
 assert.match(client,/players online/);
});
test('server includes connection state without exposing session tokens',()=>{
 const worker=readFileSync('src/worker.js','utf8');
 assert.match(worker,/connected:!!p\.socket/);
 const publicState=worker.split('publicState(viewer)')[1]?.split('broadcast()')[0]||'';
 assert.ok(!publicState.includes('token:p.token'));
});
