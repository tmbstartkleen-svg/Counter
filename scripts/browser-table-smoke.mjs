import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const origin = process.env.BLACKEDGE_TEST_URL || 'http://127.0.0.1:8789';
const destination = 'test-results/browser';
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  for (const device of [
    { name: 'desktop', width: 1366, height: 900 },
    { name: 'mobile', width: 375, height: 812 },
  ]) {
    const page = await browser.newPage({ viewport: { width: device.width, height: device.height }, deviceScaleFactor: 1 });
    page.on('pageerror', error => errors.push(device.name + ': ' + error.message));
    await page.goto(origin + '/online.html', { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.BlackEdgeVisual?.render === 'function');
    const state = {
      phase: 'turn', round: 3, playerId: 'one', turnId: 'one',
      message: 'Playing split hands', dealer: [{ r:'10',s:'S' },{hidden:true}],
      players: [
        { id:'one',name:'Alice',connected:true,bank:950,wager:25,status:'Playing',activeHand:1,
          cards:[{r:'8',s:'H'},{r:'3',s:'S'}],
          hands:[{ cards:[{r:'8',s:'H'},{r:'3',s:'S'}],wager:25,status:'Stand' },
                 { cards:[{r:'8',s:'D'},{r:'2',s:'C'}],wager:25,status:'Playing' }] },
        { id:'two',name:'Bob',connected:true,bank:975,wager:25,status:'Stand',
          cards:[{r:'K',s:'C'},{r:'9',s:'D'}] }
      ]
    };
    await page.evaluate(s => window.BlackEdgeVisual.render(s), state);
    assert.equal(await page.locator('.stage-split-hand').count(), 2, 'both split hands visible');
    assert.equal(await page.locator('.stage-split-hand.current').count(), 1, 'exactly one active split hand');
    assert.match(await page.locator('#stageTurn').innerText(), /Your turn/);
    assert.equal(await page.locator('#stageDealerScore').innerText(), 'Showing 10', 'hole card not exposed');
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      table: document.querySelector('#liveStage').getBoundingClientRect().width,
      scroll: document.documentElement.scrollWidth
    }));
    assert.ok(widths.table <= widths.viewport + 1, 'table fits ' + device.name + ' viewport: ' + JSON.stringify(widths));
    assert.ok(widths.scroll <= widths.viewport + 1, 'page avoids horizontal overflow: ' + JSON.stringify(widths));
    await page.screenshot({ path: destination + '/' + device.name + '-split-hand.png', fullPage: true });
    // Drive the visual renderer through a turn change and a completed payout.
    const turnChanged = structuredClone(state);
    turnChanged.turnId = 'two';
    turnChanged.players[0].status = 'Stand';
    turnChanged.players[0].hands[1].status = 'Stand';
    turnChanged.players[1].status = 'Playing';
    await page.evaluate(next => window.BlackEdgeVisual.render(next), turnChanged);
    assert.equal(await page.locator('.stage-split-hand.current').count(), 0, 'old split hand no longer active');
    assert.match(await page.locator('#stageTurn').innerText(), /Turn: Bob/, 'turn passed to second player');

    const complete = structuredClone(turnChanged);
    complete.phase = 'complete';
    complete.turnId = null;
    complete.dealer = [{r:'10',s:'S'},{r:'7',s:'H'}];
    complete.players[0].bank = 1000;
    complete.players[0].status = 'Win';
    complete.players[1].status = 'Loss';
    await page.evaluate(next => window.BlackEdgeVisual.render(next), complete);
    assert.equal(await page.locator('.stage-payout').count(), 1, 'only winning seat has payout indicator');
    assert.match(await page.locator('.stage-payout').innerText(), /\\+50 chips/);
    assert.equal(await page.locator('#stageDealerScore').innerText(), 'Total 17', 'dealer revealed after settlement');
    assert.match(await page.locator('#stageTurn').innerText(), /Round complete/);
    await page.screenshot({ path: destination + '/' + device.name + '-settlement.png', fullPage: true });

    // A new round must animate its initial cards even if the prior hand had more cards.
    const nextRound = structuredClone(state);
    nextRound.round = 4;
    nextRound.players[0].bank = 975;
    nextRound.players[0].hands = null;
    nextRound.players[0].cards = [{r:'A',s:'H'},{r:'9',s:'S'}];
    nextRound.players[0].status = 'Playing';
    nextRound.players[1].cards = [{r:'7',s:'C'},{r:'8',s:'D'}];
    nextRound.players[1].status = 'Playing';
    nextRound.dealer = [{r:'6',s:'C'},{hidden:true}];
    await page.evaluate(next => window.BlackEdgeVisual.render(next), nextRound);
    assert.equal(await page.locator('.stage-split-hand').count(), 0, 'split groups clear at new round');
    assert.equal(await page.locator('.stage-card.new').count(), 6, 'all new-round player and dealer cards animate');
    assert.equal(await page.locator('#stageDealerScore').innerText(), 'Showing 6');
    assert.equal(await page.locator('.stage-total').filter({hasText:'Total 20'}).count(), 1, 'soft ace scored correctly');
    assert.equal(await page.locator('#liveStage.dealing-cards').count(), 1, 'dealer gesture activated on fresh round');
    await page.screenshot({ path: destination + '/' + device.name + '-new-round.png', fullPage: true });

    // Disabling animation never hides the cards or loses turn state.
    await page.locator('#stageAnimate').uncheck();
    const quietRound = structuredClone(nextRound);
    quietRound.round = 5;
    await page.evaluate(next => window.BlackEdgeVisual.render(next), quietRound);
    assert.equal(await page.locator('#liveStage.motion').count(), 0, 'animation toggle disables motion');
    assert.equal(await page.locator('.stage-card').count(), 6, 'all cards remain visible with motion disabled');
    assert.match(await page.locator('#stageTurn').innerText(), /Your turn/);

    await page.close();
    console.log('PASS ' + device.name + ' live table: split hands, turn transition, payout, repeat round and motion setting');
  }
  assert.deepEqual(errors, [], 'no JavaScript page errors');
} finally { await browser.close(); }
