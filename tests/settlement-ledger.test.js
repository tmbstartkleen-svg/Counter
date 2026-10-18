import test from 'node:test';
import assert from 'node:assert/strict';
import {BlackjackRoom} from '../src/worker.js';

// Exercise the room's settlement routine, not only the pure blackjack calculators.
// All balances are virtual-chip amounts; bank starts AFTER stakes were reserved.
const C=(r,s='S')=>({r,s});
function room({players,dealer,shoe=[]}){
 const r=Object.create(BlackjackRoom.prototype);
 r.players=new Map(players.map(p=>[p.id,p]));
 r.dealer=dealer.map(c=>typeof c==='string'?C(c):c);
 r.shoe=shoe.map(c=>typeof c==='string'?C(c):c);
 r.revealed=false;r.phase='turn';r.running=0;r.host=players[0]?.id||null;
 r.broadcast=()=>{};
 return r;
}
function player(id,{bank=975,wager=25,cards=['10','8'],status='Stand',hands=null,insurance=0}={}){
 return {id,name:id,bank,wager,cards:cards.map(c=>typeof c==='string'?C(c):c),status,hands,insurance,socket:{}};
}
function hand(cards,status='Stand',wager=25){return {cards:cards.map(c=>typeof c==='string'?C(c):c),status,wager,splitHand:true}}
function assertLedger(label,setup,expected){
 const r=room(setup);
 r.finish();
 assert.equal(r.phase,'complete');
 assert.deepEqual(Object.fromEntries([...r.players.values()].map(p=>[p.id,{bank:p.bank,status:p.status}])),expected,label);
}
test('ledger: natural blackjack credits 3:2 gross payout once',()=>{
 assertLedger('natural',{players:[player('a',{cards:['A','K']})],dealer:['10','9']},{a:{bank:1037.5,status:'blackjack'}});
});
test('ledger: natural versus dealer blackjack returns original stake',()=>{
 assertLedger('push',{players:[player('a',{cards:['A','K']})],dealer:['A','K']},{a:{bank:1000,status:'push'}});
});
test('ledger: surrender returns exactly half original stake',()=>{
 assertLedger('surrender',{players:[player('a',{cards:['10','6'],status:'Surrender'})],dealer:['10','8']},{a:{bank:987.5,status:'surrender'}});
});
test('ledger: insurance offsets main-hand loss on dealer natural',()=>{
 assertLedger('insured',{players:[player('a',{bank:962.5,cards:['10','9'],insurance:12.5})],dealer:['A','K']},{a:{bank:1000,status:'loss'}});
});
test('ledger: insurance loses if dealer has no natural, while main hand pushes',()=>{
 assertLedger('insurance loss',{players:[player('a',{bank:962.5,cards:['10','8'],insurance:12.5})],dealer:['A','7']},{a:{bank:987.5,status:'push'}});
});
test('ledger: split hand winner and loser settle separately with no natural bonus',()=>{
 assertLedger('split mixed',{players:[player('a',{bank:950,wager:25,hands:[hand(['A','K']),hand(['10','8'])]})],dealer:['10','9']},{a:{bank:1000,status:'win / loss'}});
});
test('ledger: split aces twenty-one is paid as regular win, not blackjack',()=>{
 assertLedger('split aces',{players:[player('a',{bank:950,wager:25,hands:[hand(['A','K']),hand(['A','9'])]})],dealer:['10','9']},{a:{bank:1050,status:'win / win'}});
});
test('ledger: losing, pushing, and winning players never cross-credit banks',()=>{
 assertLedger('independent seats',{players:[
  player('lose',{cards:['10','6']}),player('push',{cards:['10','8']}),player('win',{cards:['10','K']})
 ],dealer:['10','8']},{
  lose:{bank:975,status:'loss'},push:{bank:1000,status:'push'},win:{bank:1025,status:'win'}
 });
});
