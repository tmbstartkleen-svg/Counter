import test from 'node:test';import assert from 'node:assert/strict';import {BlackjackRoom} from '../src/worker.js';
const make=()=>new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile:fn=>fn()},{});
const player=(id)=>({id,token:'t-'+id,name:id,bank:100,wager:25,status:'Playing',insurance:0,cards:[{r:'8',s:'H'},{r:'8',s:'C'}],socket:{send(){}},hands:null});
test('resumed connection sees its seat as self',()=>{const room=make(),p=player('seat');room.players.set(p.id,p);const resumed={id:'connection',seated:'seat'};assert.equal(room.publicState(resumed).playerId,'seat')});
test('insurance decision state is exposed without revealing dealer hole',()=>{const room=make(),p=player('seat');room.players.set(p.id,p);room.phase='insurance';room.dealer=[{r:'A',s:'H'},{r:'K',s:'D'}];room.insuranceDecided.add('seat');const state=room.publicState(p);assert.equal(state.players[0].insuranceDecided,true);assert.deepEqual(state.dealer[1],{hidden:true})});
