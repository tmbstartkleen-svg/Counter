import test from 'node:test';
import assert from 'node:assert/strict';
import {BlackjackRoom} from '../src/worker.js';
const make=()=>new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile:f=>f()},{});
const seat=(id,online=true)=>({id,token:id,name:id,socket:online?{send(){}}:null,bank:75,wager:25,insurance:0,status:'Stand',cards:[{r:'10',s:'S'},{r:'7',s:'H'}]});
test('finishing a round replaces host who disconnected during play',()=>{
 const r=make(),a=seat('a',false),b=seat('b');r.players.set('a',a);r.players.set('b',b);r.host='a';r.phase='turn';r.dealer=[{r:'10',s:'D'},{r:'8',s:'C'}];r.finish();
 assert.equal(r.host,'b');assert.equal(r.phase,'complete');
});
test('finishing round preserves connected host',()=>{
 const r=make(),a=seat('a'),b=seat('b');r.players.set('a',a);r.players.set('b',b);r.host='a';r.phase='turn';r.dealer=[{r:'10',s:'D'},{r:'8',s:'C'}];r.finish();assert.equal(r.host,'a');
});
