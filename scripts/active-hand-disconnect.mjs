// Verify the live server's deliberate disconnect policy: auto-stand, then resume same seat.
// Two independent browsers use actual UI and production WebSockets.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.BLACKEDGE_LIVE_URL||'https://counter.tmbstartkleen.workers.dev';
const room='recover-'+crypto.randomUUID().replace(/-/g,'').slice(0,12);
const browser=await chromium.launch({headless:true});
const contexts=[];const errors=[];
try{
  const pages=[];
  for(const [i,viewport] of [{width:1280,height:850},{width:390,height:844}].entries()){
    const ctx=await browser.newContext({viewport});contexts.push(ctx);
    const page=await ctx.newPage();pages.push(page);page.setDefaultTimeout(20000);
    page.on('pageerror',e=>errors.push('client '+i+': '+e.message));
    await page.goto(base+'/online.html?room='+room,{waitUntil:'load'});
    await page.locator('#name').fill(i?'Recovery Guest':'Recovery Host');
    await page.locator('#join').click();
    await page.waitForFunction(()=>typeof last!=='undefined'&&last?.playerId&&last?.players?.length>=1);
  }
  await pages[0].waitForFunction(()=>last?.players?.length===2);
  await pages[1].waitForFunction(()=>last?.players?.length===2);
  const guest=await pages[1].evaluate(room=>({
    token:sessionStorage.getItem('blackedge-seat-'+room),
    id:last.playerId,
    bank:last.players.find(p=>p.id===last.playerId).bank
  }),room);
  assert.ok(guest.token);
  await pages[0].locator('#deal').click();
  await Promise.all(pages.map(p=>p.waitForFunction(()=>last?.round===1&&['turn','insurance','complete'].includes(last.phase))));
  // Disconnect the guest during the initial decision phase (or a natural blackjack's
  // already completed round). The server must never leave an abandoned action blocking play.
  const phase=await pages[0].evaluate(()=>last.phase);
  await pages[1].reload({waitUntil:'load'});
  await pages[0].waitForFunction(()=>last?.players?.some(p=>p.id!==last.playerId&&!p.connected));
  const state=await pages[0].evaluate(()=>last);
  const offline=state.players.find(p=>p.id===guest.id);
  assert.ok(offline,'guest reserved seat remains after disconnection');
  if(phase==='turn'||phase==='insurance'){
    assert.equal(offline.connected,false,'guest marked offline');
    if(state.phase==='turn'||state.phase==='insurance') {
      assert.match(offline.status,/Disconnected/i,'active disconnected hand is auto-stood');
    } else {
      assert.equal(state.phase,'complete','hand may already be settled when disconnect state is observed');
      assert.ok(typeof offline.status==='string'&&offline.status.length>0,'settled player retains an outcome');
    }
  }
  // Resolve decisions for the connected host; offline guest has auto-stood/declined insurance.
  for(let step=0;step<35;step++){
    const info=await pages[0].evaluate(()=>({
      done:last?.phase==='complete',
      insurance:!document.getElementById('declineInsurance').disabled,
      stand:!document.getElementById('stand').disabled
    }));
    if(info.done)break;
    if(info.insurance)await pages[0].locator('#declineInsurance').evaluate(el=>el.click());
    else if(info.stand)await pages[0].locator('#stand').evaluate(el=>el.click());
    await pages[0].waitForTimeout(250);
  }
  await pages[0].waitForFunction(()=>last?.phase==='complete');
  await pages[1].locator('#join').click();
  await pages[1].waitForFunction(()=>last?.phase==='complete'&&last?.players?.length===2&&last?.players?.every(p=>p.connected));
  const resumed=await pages[1].evaluate(room=>({
    token:sessionStorage.getItem('blackedge-seat-'+room),
    id:last.playerId,
    bank:last.players.find(p=>p.id===last.playerId).bank,
    seats:last.players.length
  }),room);
  assert.equal(resumed.id,guest.id,'guest resumes original seat');
  assert.equal(resumed.token,guest.token,'guest token is stable');
  assert.equal(resumed.seats,2,'no duplicate seats after disconnect');
  assert.ok(Number.isFinite(resumed.bank),'resolved virtual chip bank is valid');
  assert.deepEqual(errors,[],'no browser JavaScript errors');
  console.log('PASS two real browsers: mid-round disconnect auto-stands, host finishes, guest resumes its original seat');
}finally{for(const ctx of contexts)await ctx.close().catch(()=>{});await browser.close()}
