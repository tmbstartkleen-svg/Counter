import test from 'node:test';import assert from 'node:assert/strict';import {BlackjackRoom} from '../src/worker.js';
function make(){return new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile(fn){return fn()}},{})}
function seat(){return {id:'p',token:'tok',name:'P',socket:{send(){}},cards:[{r:'9',s:'S'},{r:'7',s:'H'}],bank:75,wager:25,insurance:0,status:'Playing',hands:null}}
test('dealer hole card is hidden during insurance',()=>{const r=make(),p=seat();r.players.set(p.id,p);r.phase='insurance';r.dealer=[{r:'A',s:'C'},{r:'K',s:'S'}];assert.deepEqual(r.publicState(p).dealer[1],{hidden:true})});
test('dealer hole card remains hidden on player turn',()=>{const r=make(),p=seat();r.players.set(p.id,p);r.phase='turn';r.dealer=[{r:'9',s:'C'},{r:'K',s:'S'}];assert.deepEqual(r.publicState(p).dealer[1],{hidden:true})});
test('dealer hole is revealed after settlement',()=>{const r=make(),p=seat();r.players.set(p.id,p);r.phase='complete';r.dealer=[{r:'A',s:'C'},{r:'K',s:'S'}];assert.equal(r.publicState(p).dealer[1].r,'K')});
test('insurance phase forbids joining a room',async()=>{const r=make();r.phase='insurance';await assert.rejects(r.handle({...seat(),id:'new'},{type:'join'}),/current round/)});
test('dealer natural ends immediately without additional cards',()=>{const r=make(),p=seat();r.players.set(p.id,p);r.dealer=[{r:'A',s:'C'},{r:'K',s:'S'}];r.phase='insurance';r.shoe=[{r:'2',s:'H'}];r.action(p,{type:'declineInsurance'});assert.equal(r.phase,'complete');assert.equal(r.shoe.length,1)});
