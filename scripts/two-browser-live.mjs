// Real two-browser end-to-end check against the public Cloudflare multiplayer server.
// This tests the actual join/deal/action UI in separate, isolated Chromium contexts.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = process.env.BLACKEDGE_LIVE_URL || 'https://counter.tmbstartkleen.workers.dev';
const room = 'browser-' + crypto.randomUUID().replace(/-/g,'').slice(0,12);
await mkdir('test-results/browser', {recursive:true});
const browser = await chromium.launch({headless:true});
const contexts = [];
const errors = [];
try {
  for(const [index,viewport] of [{width:1280,height:850},{width:390,height:844}].entries()){
    const context=await browser.newContext({viewport});
    contexts.push(context);
  }
  const pages=await Promise.all(contexts.map(c=>c.newPage()));
  for(const [i,page] of pages.entries()){
    page.setDefaultTimeout(20000);
    page.on('pageerror',e=>errors.push('browser '+i+': '+e.message));
    await page.goto(base+'/online.html?room='+room,{waitUntil:'load'});
    await page.locator('#name').fill(i?'Mobile Guest':'Desktop Host');
    await page.locator('#join').click();
    await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Connected to'));
    await page.waitForFunction(()=>document.querySelector('#stageStatus')?.textContent?.includes('of 4 people online'));
  }
  for(const page of pages){
    await page.waitForFunction(()=>document.querySelector('#stageStatus')?.textContent?.includes('2 of 4 people online'));
    assert.equal(await page.locator('.stage-seat:not(:has-text("Open seat"))').count(),2);
  }
  assert.equal(await pages[0].locator('#deal').isEnabled(),true,'host can deal');
  await pages[0].locator('#deal').click();
  for(const page of pages){
    await page.waitForFunction(()=>document.querySelector('#meta')?.textContent?.includes('Round 1'));
    assert.equal(await page.locator('.stage-seat .stage-card').count(),4,'both players received two cards');
  }

  // Resolve insurance if offered, and stand using the active player's real UI.
  for(let step=0;step<30;step++){
    const snapshot=await pages[0].evaluate(()=>({
      turn:document.querySelector('#stageTurn')?.textContent||'',
      meta:document.querySelector('#meta')?.textContent||'',
      insurance:!document.querySelector('#declineInsurance')?.disabled,
      done:document.querySelector('#stageTurn')?.textContent==='Round complete'
    }));
    if(snapshot.done)break;
    const controls=await Promise.all(pages.map(async page=>({
      insurance:await page.locator('#declineInsurance').isEnabled(),
      stand:await page.locator('#stand').isEnabled()
    })));
    const insuranceClient=controls.findIndex(x=>x.insurance);
    if(insuranceClient>=0){await pages[insuranceClient].locator('#declineInsurance').evaluate(el=>el.click());await pages[0].waitForTimeout(250);continue}
    const turnClient=controls.findIndex(x=>x.stand);
    if(turnClient>=0){await pages[turnClient].locator('#stand').evaluate(el=>el.click());await pages[0].waitForTimeout(250);continue}
    await pages[0].waitForTimeout(200);
  }
  for(const page of pages){
    await page.waitForFunction(()=>document.querySelector('#stageTurn')?.textContent==='Round complete');
    assert.equal(await page.locator('#stageDealer .stage-card.down').count(),0,'dealer hole card revealed');
    assert.ok(await page.locator('#stageDealerScore').innerText(),'dealer score visible');
  }
  assert.deepEqual(errors,[], 'no browser JavaScript errors');
  await Promise.all(pages.map((page,i)=>page.screenshot({path:'test-results/browser/live-player-'+(i?'mobile':'desktop')+'.png',fullPage:true})));
  console.log('PASS two isolated browsers joined one room, dealt and settled a full live blackjack round');
}finally{
  for(const context of contexts)await context.close().catch(()=>{});
  await browser.close();
}
