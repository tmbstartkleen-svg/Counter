import test from 'node:test';import assert from 'node:assert/strict';import {BlackjackRoom} from '../src/worker.js';
const make=()=>new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile:fn=>fn()},{});
const conn=id=>({id,token:'secret-'+id,name:id,bank:1000,wager:25,cards:[],status:'Waiting',socket:{messages:[],send(v){this.messages.push(JSON.parse(v))},close(){}}});
test('voluntary seat exit frees space and hands host to remaining player',async()=>{const r=make(),a=conn('a'),b=conn('b');await r.handle(a,{type:'join'});await r.handle(b,{type:'join'});await r.handle(a,{type:'leaveRoom'});assert.equal(r.players.size,1);assert.equal(r.host,'b');assert.equal(a.seated,null)});
test('voluntary leave is forbidden during active hand',async()=>{const r=make(),a=conn('a');await r.handle(a,{type:'join'});r.phase='turn';await assert.rejects(r.handle(a,{type:'leaveRoom'}),/Leave after/);assert.equal(r.players.size,1)});
test('released token cannot resume an abandoned seat',async()=>{const r=make(),a=conn('a');await r.handle(a,{type:'join'});await r.handle(a,{type:'leaveRoom'});await assert.rejects(r.handle(conn('b'),{type:'resume',token:a.token}),/invalid/)});
