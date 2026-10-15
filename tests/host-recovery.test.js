import test from 'node:test';
import assert from 'node:assert/strict';
import {BlackjackRoom} from '../src/worker.js';
function room(){return new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile:fn=>fn()},{})}
function seat(id){return {id,token:id,name:id,socket:{send(){}},bank:100,wager:25,status:'Waiting',cards:[]}}
test('lobby host disconnect transfers deal authority',()=>{const r=room(),a=seat('a'),b=seat('b');r.players.set('a',a);r.players.set('b',b);r.host='a';a.seated='a';r.leave(a);assert.equal(r.host,'b');assert.equal(a.socket,null)});
test('completed-round host disconnect transfers authority',()=>{const r=room(),a=seat('a'),b=seat('b');r.players.set('a',a);r.players.set('b',b);r.host='a';r.phase='complete';a.seated='a';r.leave(a);assert.equal(r.host,'b')});
