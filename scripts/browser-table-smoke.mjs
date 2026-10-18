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
    await page.close();
    console.log('PASS ' + device.name + ' live table: separate split hands, turn, hidden dealer card, responsive width');
  }
  assert.deepEqual(errors, [], 'no JavaScript page errors');
} finally { await browser.close(); }
