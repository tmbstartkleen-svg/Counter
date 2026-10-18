// End-to-end insurance wager test against production's actual random shoe.
// Search fresh virtual-chip rounds until dealer shows an Ace; do not tamper with cards.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {settleHand,settleInsurance} from '../src/blackjack-rules.js';
const origin=process.env.BLACKEDGE_LIVE_URL||'https://counter.tmbstartkleen.workers.dev';
const room='insurance-'+crypto.randomUUID().replace(/-/g,'').slice(0,12);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
try {
 const page=await context.newPage();page.setDefaultTimeout(20000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/online.html?room='+room,{waitUntil:'load'});
 await page.locator('#name').fill('Insurance QA');
 await page.locator('#join').click();
 await page.waitForFunction(()=>typeof last!=='undefined'&&!!last?.playerId);
 let verified=false;
 for(let attempt=0;attempt<90;attempt++){
   const before=await page.evaluate(()=>({phase:last.phase,round:last.round,bank:last.players[0].bank}));
   assert.equal(before.phase==='lobby'||before.phase==='complete',true,'host is ready');
   assert.equal(await page.locator('#deal').isEnabled(),true,'host can deal');
   await page.locator('#deal').evaluate(el=>el.click());
   await page.waitForFunction(n=>last.round>n,before.round);
   const start=await page.evaluate(()=>({
     phase:last.phase,bank:last.players[0].bank,wager:last.players[0].wager,
     cards:last.players[0].cards,dealer:last.dealer
   }));
   if(start.phase==='insurance'){
     assert.equal(start.dealer[0].r,'A','insurance offered only on dealer Ace');
     assert.equal(start.dealer[1].hidden,true,'hole card remains hidden');
     assert.equal(start.bank,before.bank-start.wager,'main stake reserved');
     assert.equal(await page.locator('#insurance').isEnabled(),true,'insurance button available');
     await page.locator('#insurance').evaluate(el=>el.click());
     await page.waitForFunction(()=>last.phase!=='insurance');
     const accepted=await page.evaluate(()=>({
       bank:last.players[0].bank,insurance:last.players[0].insurance,
       decided:last.players[0].insuranceDecided,phase:last.phase
     }));
     assert.equal(accepted.insurance,start.wager/2,'insurance stake is half the main wager');
     assert.equal(accepted.decided,true,'server recorded insurance choice');
     if(accepted.phase==='turn')await page.locator('#stand').evaluate(el=>el.click());
     await page.waitForFunction(()=>last.phase==='complete');
     const finished=await page.evaluate(()=>({
       bank:last.players[0].bank,status:last.players[0].status,
       cards:last.players[0].cards,dealer:last.dealer
     }));
     const main=settleHand({cards:finished.cards,dealerCards:finished.dealer,wager:start.wager});
     const side=settleInsurance({insuranceWager:accepted.insurance,dealerCards:finished.dealer});
     assert.equal(finished.bank,start.bank-accepted.insurance+main.payout+side.payout,
       'real server balance equals independently calculated main and insurance payouts');
     assert.equal(finished.status,main.result,'actual server outcome agrees with blackjack rules');
     assert.equal(await page.locator('#stageDealer .stage-card.down').count(),0,'dealer hole card revealed');
     verified=true;break;
   }
   if(start.phase==='turn')await page.locator('#stand').evaluate(el=>el.click());
   await page.waitForFunction(()=>last.phase==='complete');
 }
 assert.ok(verified,'encountered a naturally dealt dealer Ace and verified insurance settlement');
 assert.deepEqual(errors,[],'browser JavaScript errors');
 console.log('PASS live insurance UI: half-stake reservation, hidden dealer hole and verified main/side payout');
} finally {await context.close();await browser.close()}
