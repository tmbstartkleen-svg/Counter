import test from 'node:test';
import assert from 'node:assert/strict';
import {BlackjackRoom} from '../src/worker.js';
const room=()=>new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile:fn=>fn()},{});
const seat=id=>({id,name:id,token:id,socket:{send(){}},bank:75,wager:25,status:'Playing',cards:[{r:'10',s:'S'},{r:'6',s:'H'}],insurance:0});
test('insurance disconnect cannot leave an unresponsive player turn',()=>{
 const r=room(),a=seat('a'),b=seat('b');a.seated='a';b.seated='b';
 r.players.set('a',a);r.players.set('b',b);r.phase='insurance';r.dealer=[{r:'A',s:'S'},{r:'6',s:'C'}];
 r.leave(a);
 assert.equal(a.status,'Disconnected - standing');assert.equal(r.insuranceDecided.has('a'),true);
 r.action(b,{type:'declineInsurance'});
 assert.equal(r.phase,'turn');assert.equal(r.current()?.id,'b');
});
