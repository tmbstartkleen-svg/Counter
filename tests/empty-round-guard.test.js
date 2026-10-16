import test from 'node:test';
import assert from 'node:assert/strict';
import {BlackjackRoom} from '../src/worker.js';
const make=()=>new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile:fn=>fn()},{});
const player=(id,bank)=>({id,name:id,token:id,socket:{send(){}},bank,wager:0,cards:[],status:'Waiting'});
test('host cannot start a round without any connected credits',()=>{
 const r=make(),a=player('a',0);r.players.set('a',a);r.host='a';
 assert.throws(()=>r.action(a,{type:'start'}),/with chips/);
 assert.equal(r.phase,'lobby');assert.equal(r.round,0);
});
test('an online funded seat permits a round even when host has no chips',()=>{
 const r=make(),a=player('a',0),b=player('b',100);r.players.set('a',a);r.players.set('b',b);r.host='a';
 r.action(a,{type:'start'});assert.equal(r.round,1);assert.equal(a.wager,0);assert.equal(b.wager,25);
});
