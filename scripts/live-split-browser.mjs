// Real random-shoe split action against Cloudflare live blackjack.
// End-to-end browser action, independently checked split-hand settlement.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {settleHand,canSplit,handValue} from '../src/blackjack-rules.js';
const base=process.env.BLACKEDGE_LIVE_URL||'https://counter.tmbstartkleen.workers.dev';
const room='split-'+crypto.randomUUID().replace(/-/g,'').slice(0,12);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
try{
 const page=await context.newPage();page.setDefaultTimeout(20000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/online.html?room='+room,{waitUntil:'load'});
 await page.locator('#name').fill('Split QA');
 await page.locator('#join').click();
 await page.waitForFunction(()=>typeof last!=='undefined'&&!!last?.playerId);
 let verified=false;
 for(let tries=0;tries<75;tries++){
   const initial=await page.evaluate(()=>({round:last.round,phase:last.phase,bank:last.players[0].bank}));
   assert.ok(initial.bank>=50,'player must have chips for an additional split stake');
   assert.ok(initial.phase==='lobby'||initial.phase==='complete');
   await page.locator('#deal').evaluate(el=>el.click());
   await page.waitForFunction(n=>last.round>n,initial.round);
   let state=await page.evaluate(()=>({phase:last.phase,cards:last.players[0].cards,wager:last.players[0].wager,bank:last.players[0].bank}));
   if(state.phase==='insurance'){
     await page.locator('#declineInsurance').evaluate(el=>el.click());
     await page.waitForFunction(()=>last.phase!=='insurance');
     state=await page.evaluate(()=>({phase:last.phase,cards:last.players[0].cards,wager:last.players[0].wager,bank:last.players[0].bank}));
   }
   if(state.phase==='turn'&&await page.locator('#split').isEnabled()){
     assert.equal(canSplit(state.cards),true,'real initial cards form a split pair');
     assert.equal(state.bank,initial.bank-state.wager,'first stake reserved');
     await page.locator('#split').evaluate(el=>el.click());
     await page.waitForFunction(()=>last.players[0].hands?.length===2);
     const dealt=await page.evaluate(()=>({
       phase:last.phase,bank:last.players[0].bank,activeHand:last.players[0].activeHand,hands:last.players[0].hands
     }));
     if(dealt.phase==='turn')assert.equal(dealt.bank,state.bank-state.wager,'second stake reserved exactly once before settlement');
     // Splitting aces settles immediately: the first state already includes payouts.
     assert.equal(dealt.hands.length,2);
     assert.equal(await page.locator('.stage-split-hand').count(),2,'two separate live hand panels');
     assert.equal(dealt.hands[0].wager,state.wager);
     assert.equal(dealt.hands[1].wager,state.wager);
     assert.ok(dealt.hands.every(h=>h.cards.length===2),'each split hand initially gets one extra card');
     if(dealt.phase==='turn'){
       assert.equal(dealt.activeHand,0,'first hand is active');
       assert.equal(await page.locator('.stage-split-hand.current').count(),1);
       await page.locator('#stand').evaluate(el=>el.click());
       await page.waitForFunction(()=>last.phase==='complete'||last.players[0].activeHand===1);
       if(await page.evaluate(()=>last.phase==='turn')){
         assert.equal(await page.locator('.stage-split-hand.current').count(),1,'second hand highlighted');
         await page.locator('#stand').evaluate(el=>el.click());
       }
     }else{
       assert.equal(dealt.phase,'complete','split aces auto-stand');
     }
     await page.waitForFunction(()=>last.phase==='complete');
     const result=await page.evaluate(()=>({bank:last.players[0].bank,hands:last.players[0].hands,dealer:last.dealer,status:last.players[0].status}));
     const outcomes=result.hands.map(h=>settleHand({cards:h.cards,dealerCards:result.dealer,wager:h.wager,splitHand:true}));
     assert.equal(result.bank,(dealt.phase==='complete'?state.bank-state.wager:dealt.bank)+outcomes.reduce((sum,o)=>sum+o.payout,0),
       'live virtual-chip bank equals independent settlement of both split hands');
     assert.deepEqual(result.hands.map(h=>h.status),outcomes.map(o=>o.result),'per-hand outcomes agree');
     assert.equal(await page.locator('.stage-split-hand').count(),2,'separate hand panels survive settlement');
     assert.ok(result.hands.every(h=>!(handValue(h.cards).blackjack&&h.status==='blackjack')),
       'split blackjack cannot receive natural bonus');
     verified=true;break;
   }
   if(state.phase==='turn')await page.locator('#stand').evaluate(el=>el.click());
   await page.waitForFunction(()=>last.phase==='complete');
 }
 assert.ok(verified,'found natural matching cards and tested real split interaction');
 assert.deepEqual(errors,[],'no JavaScript page errors');
 console.log('PASS live mobile split action: distinct hands, independent turn focus and reconciled chips');
}finally{await context.close();await browser.close()}
