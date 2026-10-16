import test from 'node:test';
import assert from 'node:assert/strict';
import {BlackjackRoom} from '../src/worker.js';
function room(){return new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile:f=>f()},{})}
function player(id){return {id,token:'token-'+id,name:id,socket:{send(){}},bank:1000,wager:25,cards:[],status:'Waiting'}}
test('new connected player can host room when previous host is offline',async()=>{
 const r=room(),original=player('original');original.socket=null;r.players.set(original.id,original);r.host=original.id;
 const newcomer=player('newcomer');await r.handle(newcomer,{type:'join'});
 assert.equal(r.host,'newcomer');assert.equal(r.players.size,2);
});
test('join preserves connected host authority',async()=>{
 const r=room(),host=player('host');r.players.set(host.id,host);r.host=host.id;
 await r.handle(player('newcomer'),{type:'join'});assert.equal(r.host,'host');
});
