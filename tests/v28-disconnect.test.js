import test from 'node:test';
import assert from 'node:assert/strict';
import {BlackjackRoom} from '../src/worker.js';
const make=()=>new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile:fn=>fn()},{});
const player=(id)=>({id,token:id,name:id,socket:{send(){}},bank:75,wager:25,insurance:0,cards:[{r:'9',s:'S'},{r:'7',s:'H'}],status:'Playing',hands:null});
test('insurance proceeds if the last undecided player disconnects',()=>{
 const r=make(),a=player('a'),b=player('b');r.players.set(a.id,a);r.players.set(b.id,b);r.host='a';
 r.phase='insurance';r.dealer=[{r:'A',s:'H'},{r:'6',s:'S'}];r.insuranceDecided.add('a');
 r.leave(b);assert.equal(r.phase,'turn');assert.equal(b.socket,null);assert.equal(r.insuranceDecided.has('b'),true);
});
test('insurance disconnect against dealer natural settles all hands',()=>{
 const r=make(),a=player('a');r.players.set(a.id,a);r.host='a';r.phase='insurance';r.dealer=[{r:'A',s:'H'},{r:'K',s:'S'}];
 r.leave(a);assert.equal(r.phase,'complete');assert.equal(a.status,'loss');
});
