// Actual live casino UI -> Cloudflare Worker -> payout verification for surrender.
// Random cards are not manipulated; retries only handle naturally completed hands.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const origin=process.env.BLACKEDGE_LIVE_URL||'https://counter.tmbstartkleen.workers.dev';
const room='surrender-'+crypto.randomUUID().replace(/-/g,'').slice(0,12);
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
try{
 const page=await context.newPage();
 page.setDefaultTimeout(20000);
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/online.html?room='+room,{waitUntil:'load'});
 await page.locator('#name').fill('Surrender Tester');
 await page.locator('#join').click();
 await page.waitForFunction(()=>typeof last!=='undefined'&&last?.playerId&&last?.players?.length===1);
 let verified=false;
 for(let round=1;round<=8;round++){
   assert.equal(await page.locator('#deal').isEnabled(),true,'host can deal between rounds');
   await page.locator('#deal').evaluate(el=>el.click());
   await page.waitForFunction(n=>last?.round===n,round);
   let state=await page.evaluate(()=>({phase:last.phase,round:last.round}));
   if(state.phase==='insurance'){
     await page.locator('#declineInsurance').evaluate(el=>el.click());
     await page.waitForFunction(()=>last?.phase!=='insurance');
   }
   state=await page.evaluate(()=>({
     phase:last.phase,bank:last.players.find(p=>p.id===last.playerId).bank,
     wager:last.players.find(p=>p.id===last.playerId).wager
   }));
   if(state.phase==='turn'&&await page.locator('#surrender').isEnabled()){
     assert.equal(state.wager,25,'table starts each hand with 25 virtual chips');
     await page.locator('#surrender').evaluate(el=>el.click());
     await page.waitForFunction(()=>last?.phase==='complete');
     const after=await page.evaluate(()=>({
       bank:last.players.find(p=>p.id===last.playerId).bank,
       status:last.players.find(p=>p.id===last.playerId).status,
       connected:last.players.find(p=>p.id===last.playerId).connected
     }));
     assert.equal(after.status,'surrender','server confirms surrendered hand');
     assert.equal(after.bank,state.bank+state.wager/2,'half wager returned exactly once');
     assert.equal(after.connected,true);
     assert.match(await page.locator('#stageTurn').innerText(),/Round complete/);
     verified=true;
     break;
   }
   // The server may complete a round immediately after a natural blackjack.
   // It cannot be surrendered; retry a fresh real hand instead.
   assert.equal(state.phase,'complete','only an immediately completed hand can skip surrender');
 }
 assert.ok(verified,'reached a naturally playable hand and surrendered via real browser control');
 assert.deepEqual(errors,[],'no browser JavaScript errors');
 console.log('PASS live mobile UI surrender: authoritative room status and exact half-wager settlement');
}finally{await context.close();await browser.close()}
