import test from 'node:test';
import assert from 'node:assert/strict';
import {BlackjackRoom} from '../src/worker.js';
const room=()=>new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile:f=>f()},{});
const player=id=>({id,name:id,token:id,socket:{send(){}},bank:100,wager:25,cards:[],status:'Waiting'});
test('leaving host hands authority to connected seat rather than an offline reservation',async()=>{
 const r=room(),a=player('a'),offline=player('offline'),online=player('online');
 offline.socket=null;r.players.set('a',a);r.players.set('offline',offline);r.players.set('online',online);r.host='a';a.seated='a';
 await r.handle(a,{type:'leaveRoom'});assert.equal(r.host,'online');
});
