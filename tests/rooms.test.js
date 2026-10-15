import test from 'node:test';
import assert from 'node:assert/strict';
import { BlackjackRoom } from '../src/worker.js';
const state=()=>({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile(fn){return fn()}});
const socket=()=>({messages:[],send(value){this.messages.push(JSON.parse(value))},close(){}});
const make=()=>new BlackjackRoom(state(),{});
function connection(id){return {id,token:'secret-'+id,socket:socket(),name:'Guest',bank:1000,wager:25,cards:[],status:'Waiting'}}
test('join reserves a seat and returns token',async()=>{const room=make(),c=connection('a');await room.handle(c,{type:'join'});assert.equal(room.players.size,1);assert.equal(c.seated,'a');assert.equal(c.socket.messages[0].type,'welcome')});
test('resume rejects incorrect token',async()=>{const room=make(),c=connection('a');await room.handle(c,{type:'join'});const intruder=connection('b');await assert.rejects(room.handle(intruder,{type:'resume',token:'incorrect'}),/invalid/);assert.equal(room.players.get('a').socket,c.socket)});
test('resume reclaims seat without resetting balance',async()=>{const room=make(),c=connection('a');await room.handle(c,{type:'join'});c.bank=725;const other=connection('b');await room.handle(other,{type:'resume',token:c.token});assert.equal(room.players.size,1);assert.equal(room.players.get('a').socket,other.socket);assert.equal(room.players.get('a').bank,725)});
test('disallows joining during active round',async()=>{const room=make();room.phase='turn';await assert.rejects(room.handle(connection('a'),{type:'join'}),/current round/)});
test('limits rooms to four reserved seats',async()=>{const room=make();for(let i=0;i<4;i++)await room.handle(connection('p'+i),{type:'join'});await assert.rejects(room.handle(connection('extra'),{type:'join'}),/full/)});
test('face-down dealer card is not counted until settlement',()=>{const room=make();room.shoe=[{r:'2',s:'S'},{r:'K',s:'H'}];const down=room.draw(true);assert.equal(down.r,'K');assert.equal(room.running,0);room.draw();assert.equal(room.running,1)});
test('host cannot start a second active round',async()=>{const room=make(),c=connection('a');await room.handle(c,{type:'join'});room.phase='turn';await assert.rejects(Promise.resolve().then(()=>room.action(c,{type:'start'})),/underway/)});
test('saves checkpoints without socket references',async()=>{let snapshot;const st=state();st.storage.put=async(k,v)=>{snapshot=v};const room=new BlackjackRoom(st,{}),c=connection('a');await room.handle(c,{type:'join'});await room.checkpoint();assert.equal(snapshot.seats[0].socket,undefined);assert.equal(snapshot.seats[0].token,c.token)});
