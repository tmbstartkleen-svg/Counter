import test from 'node:test';
import assert from 'node:assert/strict';
import {BlackjackRoom} from '../src/worker.js';

const c=r=>({r,s:'S'});
function setup({cards=['8','8'],dealer=['10','7'],bank=975,wager=25,extra=[]}={}){
 const room=Object.create(BlackjackRoom.prototype);
 const player={id:'one',name:'One',cards:cards.map(c),bank,wager,status:'Playing',socket:{},hands:null,activeHand:0,insurance:0};
 room.players=new Map([['one',player]]);
 for(const p of extra)room.players.set(p.id,p);
 room.dealer=dealer.map(c);room.shoe=['9','2','5','10','3','6'].map(c);
 room.phase='turn';room.turn=0;room.round=1;room.host='one';room.running=0;room.revealed=false;
 room.insuranceDecided=new Set();room.notice='test';
 room.broadcast=()=>{};
 room.draw=()=>room.shoe.pop();
 return {room,player};
}
test('split action reserves second stake, creates two server hands, and selects hand one',()=>{
 const {room,player}=setup();
 room.action(player,{type:'split'});
 assert.equal(player.bank,950);
 assert.equal(player.hands.length,2);
 assert.equal(player.hands[0].cards.length,2);
 assert.equal(player.hands[1].cards.length,2);
 assert.equal(player.hands[0].wager,25);
 assert.equal(player.hands[1].wager,25);
 assert.equal(player.activeHand,0);
 assert.deepEqual(player.cards,player.hands[0].cards);
 assert.ok(player.hands.every(h=>h.splitHand));
});
test('finishing first split hand advances to second hand, not next player',()=>{
 const {room,player}=setup();
 room.action(player,{type:'split'});
 player.status='Stand';
 room.nextHand(player);
 assert.equal(player.activeHand,1);
 assert.deepEqual(player.cards,player.hands[1].cards);
 assert.equal(player.status,'Playing');
 assert.equal(room.phase,'turn');
});
test('split aces each receive one card and automatically stand',()=>{
 const {room,player}=setup({cards:['A','A']});
 room.action(player,{type:'split'});
 assert.equal(player.bank,950);
 assert.equal(player.hands.length,2);
 assert.equal(player.hands[0].cards.length,2);
 assert.equal(player.hands[1].cards.length,2);
 assert.ok(player.hands.every(h=>h.status==='Stand'));
 assert.equal(room.phase,'complete');
});
test('surrender settles half of the reserved stake',()=>{
 const {room,player}=setup({cards:['10','6']});
 room.action(player,{type:'surrender'});
 assert.equal(room.phase,'complete');
 assert.equal(player.status,'surrender');
 assert.equal(player.bank,987.5);
});
test('surrender is refused for already split hands',()=>{
 const {room,player}=setup();
 room.action(player,{type:'split'});
 assert.throws(()=>room.action(player,{type:'surrender'}),/Surrender unavailable/);
 assert.equal(player.bank,950);
});
test('insurance reserves half-wager and completes decision exactly once',()=>{
 const {room,player}=setup({cards:['9','7'],dealer:['A','K']});
 room.phase='insurance';
 room.action(player,{type:'insurance'});
 assert.equal(player.insurance,12.5);
 assert.equal(room.insuranceDecided.has(player.id),true);
 assert.equal(room.phase,'complete');
 assert.equal(player.bank,1000); // 975-12.5 + 37.5 insurance gross
});
test('declining insurance leaves chip bank unchanged during decision',()=>{
 const {room,player}=setup({cards:['10','7'],dealer:['A','9']});
 room.phase='insurance';
 room.action(player,{type:'declineInsurance'});
 assert.equal(player.insurance,0);
 assert.equal(room.insuranceDecided.has(player.id),true);
 assert.equal(player.bank,975);
 assert.equal(room.phase,'turn');
});
test('a second insurance decision is rejected',()=>{
 const {room,player}=setup({dealer:['A','9']});
 room.phase='insurance';
 room.insuranceDecided.add(player.id);
 assert.throws(()=>room.action(player,{type:'insurance'}),/Insurance decision unavailable/);
 assert.equal(player.bank,975);
});
