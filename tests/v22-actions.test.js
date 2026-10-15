import test from 'node:test';
import assert from 'node:assert/strict';
import {BlackjackRoom} from '../src/worker.js';
function room(){return new BlackjackRoom({storage:{get:async()=>null,put:async()=>{}},blockConcurrencyWhile(f){return f()}},{})}
function seat(id,cards){return {id,name:id,token:id,socket:{send(){}},bank:100,wager:25,cards,status:'Playing',insurance:0,hands:null}}
test('split creates two playable hands from a matching pair',()=>{const r=room(),p=seat('p',[{r:'8',s:'S'},{r:'8',s:'H'}]);r.players.set(p.id,p);r.phase='turn';r.shoe=[{r:'5',s:'C'},{r:'6',s:'C'}];r.action(p,{type:'split'});assert.equal(p.hands.length,2);assert.equal(p.bank,75);assert.equal(p.cards.length,2)});
test('surrender ends turn with half-stake refund on settlement',()=>{const r=room(),p=seat('p',[{r:'10',s:'H'},{r:'6',s:'S'}]);r.players.set(p.id,p);r.phase='turn';r.dealer=[{r:'10',s:'C'},{r:'8',s:'D'}];r.action(p,{type:'surrender'});assert.equal(p.bank,112.5);assert.equal(p.status,'surrender')});
