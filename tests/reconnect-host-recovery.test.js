import test from 'node:test';import assert from 'node:assert/strict';import {BlackjackRoom} from '../src/worker.js';
const room=()=>new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile:f=>f()},{});
const seat=(id,online=false)=>({id,name:id,token:'token-'+id,socket:online?{send(){}}:null,bank:100,wager:0,cards:[],status:'Waiting'});
test('reconnecting to room without online host restores deal authority',async()=>{
 const r=room(),original=seat('original');r.players.set(original.id,original);r.host='original';const c=seat('new',true);
 await r.handle(c,{type:'resume',token:original.token});assert.equal(r.host,'original');assert.equal(original.socket,c.socket);
});
test('reconnecting seat does not displace connected host',async()=>{
 const r=room(),original=seat('original'),host=seat('host',true);r.players.set(original.id,original);r.players.set(host.id,host);r.host='host';const c=seat('new',true);
 await r.handle(c,{type:'resume',token:original.token});assert.equal(r.host,'host');
});
