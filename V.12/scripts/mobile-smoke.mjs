import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const { chromium, webkit, devices } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.GAME_URL || 'http://localhost:4174/';
const screenshots = process.env.SCREENSHOTS;
const profiles = [
  ['chrome-360', chromium, 'Pixel 7', 360, 640],
  ['chrome-430', chromium, 'Pixel 7', 430, 932],
  ['chrome-paisagem', chromium, 'Pixel 7', 800, 360],
  ['webkit-390', webkit, 'iPhone 13', 390, 844],
  ['webkit-480', webkit, 'iPhone 13', 480, 950],
  ['webkit-paisagem', webkit, 'iPhone 13 landscape', 844, 390],
  ['desktop', chromium, null, 1440, 900],
];
const selectedProfiles = process.argv.slice(2).length ? profiles.filter(([name]) => process.argv.slice(2).includes(name)) : profiles;

for (const [name, engine, device, width, height] of selectedProfiles) {
  const browser = await engine.launch(engine === chromium ? {channel: 'chrome'} : {});
  try {
    const page = await browser.newPage({
      ...devices[device], viewport: { width, height }, deviceScaleFactor: 1,
      reducedMotion: name === 'chrome-430' ? 'no-preference' : 'reduce',
    });
    page.setDefaultTimeout(7000);
    const errors = [];
    const assets = new Set();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(base) && response.status() >= 400) errors.push(response.status() + ' ' + response.url());
      if (response.url().includes('/assets/cartas/')) assets.add(response.url());
    });
    await page.addInitScript(() => {
      let seed = 12;
      Math.random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    });
    const tap = async (selector, index = 0) => {
      const target = page.locator(selector).nth(index);
      await (device ? target.tap() : target.click());
    };
    const inView = async (selector, scope = 'screen') => {
      await page.locator(selector).first().waitFor();
      const boxes = await page.locator(selector).evaluateAll(elements => elements.filter(element => element.getClientRects().length).map(element => {
        const { x, y, right, bottom, width, height } = element.getBoundingClientRect();
        return { x, y, right, bottom, width, height };
      }));
      assert.ok(boxes.length, scope + ' ' + selector);
      for (const box of boxes) {
        assert.ok(box.x >= -1 && box.y >= -1 && box.right <= width + 1 && box.bottom <= height + 1,
          scope + ' ' + selector + ' outside viewport: ' + JSON.stringify(box));
        if (device) assert.ok(box.width >= 44 && box.height >= 44, scope + ' ' + selector + ' touch area: ' + JSON.stringify(box));
      }
    };
    const visibleArea = async (step) => {
      const dimensions = await page.evaluate(() => ({
        total: document.documentElement.scrollWidth, view: document.documentElement.clientWidth,
        height: document.documentElement.scrollHeight,
      }));
      assert.ok(dimensions.total <= dimensions.view, step + ' horizontal overflow: ' + JSON.stringify(dimensions));
      return dimensions.height;
    };
    const snap = async (step) => {
      const docHeight = await visibleArea(step);
      if (screenshots) {
        await page.evaluate(() => document.fonts.ready);
        const dir = resolve(screenshots, name);
        await mkdir(dir, { recursive: true });
        await page.screenshot({ path: resolve(dir, step + '.jpg'), quality: 88, timeout: 7000 });
      }
      return docHeight;
    };
    await page.goto(base);
    const start = '[data-action=start]';
    await inView(start);
    await snap('01-inicio');
    await tap('[data-action=rules]');
    await inView('.rules-detail .detail-close');
    if (device) await inView('#close-rules');
    await snap('02-regras');
    await tap('#close-rules');

    await tap(start);
    await inView('.package-option');
    await inView('[data-action=recycle-open]');
    const packageHeight = await snap('03-pacotes');
    await tap('[data-action=deck-open]');
    assert.equal(await page.locator('#deck-dialog-title').textContent(), 'SEU BARALHO');
    await snap('04-baralho');
    assert.equal(await page.locator('.recycle-controls').count(), 0);
    await tap('[data-recycle-close]');

    await tap('[data-action=package]');
    await snap('05-cartas');
    if (device) {
      await inView('.draft-actions button');
      await tap('[data-action=offer-focus]', 4);
      await page.waitForFunction(() => document.querySelector('[data-mobile-pick]').dataset.index === '4');
      if (engine === chromium) {
        const rail = await page.locator('.tech-offers').boundingBox();
        const session = await page.context().newCDPSession(page);
        const y = Math.round(rail.y + rail.height / 2);
        const start = Math.round(rail.x + rail.width * .23);
        const end = Math.round(rail.x + rail.width * .8);
        await session.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x:start, y}]});
        for (let step = 1; step <= 8; step++) {
          await session.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{ x: Math.round(start + (end - start) * step / 8), y }]});
          await page.waitForTimeout(23);
        }
        await session.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
        await page.waitForFunction(() => Number(document.querySelector('[data-mobile-pick]').dataset.index) < 4);
        await page.waitForTimeout(350);
        await session.detach();
      }
      await tap('[data-action=offer-focus]', 2);
      await page.waitForFunction(() => document.querySelector('[data-mobile-pick]').dataset.index === '2');
      const active = page.locator('[data-offer="2"] .offer-name');
      await tap('[data-action=offer-detail]');
      assert.equal(await page.locator('#detail-title').textContent(), await active.textContent());
    } else {
      await tap('.offer [data-inspect]', 2);
    }
    await inView('.card-detail .detail-close');
    await snap('06-detalhes');
    await tap('.card-detail .detail-close');

    await tap('[data-action=recycle-open]');
    assert.equal(await page.locator('[data-recycle-intent]').isDisabled(), true);
    await snap('07-estacao');
    await tap('[data-recycle-select]');
    assert.ok((await page.locator('.recycle-skill').textContent()).length > 12);
    assert.equal(await page.locator('dialog[open]').count(), 1);
    await inView('[data-recycle-intent]');
    await snap('08-estacao-carta');
    await tap('[data-recycle-intent]');
    await inView('[data-recycle-back], [data-recycle-commit]');
    await snap('09-confirmacao');
    await tap('[data-recycle-back]');
    await tap('[data-recycle-intent]');
    await tap('[data-recycle-commit]');
    assert.match(await page.locator('.deck-service small').textContent(), /^8 CARTAS$/);
    assert.equal(await page.locator('[data-action=recycle-open]').isDisabled(), true);
    assert.match(await page.locator('.recycle-toast').textContent(), /cópia reciclada/);
    if (device) {
      await page.waitForFunction(() => document.querySelector('[data-mobile-pick]').dataset.index === '2');
      await tap('[data-mobile-pick]');
      assert.match(await page.locator('.deck-service small').textContent(), /^9 CARTAS$/);
      await tap('[data-mobile-pick]');
    } else {
      await tap('.offer [data-action=pick]');
      await tap('.offer [data-action=pick]');
    }

    await inView('.zone-deploy');
    await inView('[data-action=current-detail]');
    const placementHeight = await snap('10-posicionamento');
    await tap('[data-action=current-detail]');
    assert.match(await page.locator('.detail-skill h3').textContent(), /HABILIDADE/);
    await tap('.card-detail .detail-close');
    await tap('.zone-deploy', 2);
    assert.match(await page.locator('.deploy-status').textContent(), /Zona C/);
    assert.equal(await page.locator('[data-lane=C0] [data-inspect]').count(), 1);
    await tap('[data-lane=C0] [data-inspect]');
    await tap('.card-detail .detail-close');
    assert.equal(await page.locator('[data-lane=C0] [data-inspect]').count(), 1);
    let move = 0;
    while (await page.locator('.zone-deploy').count()) {
      await tap('.zone-deploy', move++ < 4 ? 2 : move % 3);
      if (move === 5) {
        await inView('.zone-deploy');
        await snap('11-zonas-ocupadas');
      }
    }
    await inView('[data-action=skip]');
    await page.locator('.fighter-atk').first().waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('.damage-hit')].some(hit => hit.textContent));
    await inView('[data-action=bench-open]');
    await snap('12-batalha');
    await tap('[data-action=bench-open]');
    const zone = await page.locator('.battle-label').textContent();
    await page.waitForTimeout(550);
    assert.equal(await page.locator('.battle-label').textContent(), zone);
    await snap('13-arquibancada');
    await tap('.card-detail .detail-close');
    if (name === 'chrome-430') {
      await page.evaluate(() => { window.testArena = document.querySelector('.combat-stage'); });
      await page.locator('[data-action=show-result]').waitFor({ timeout: 45000 });
      assert.equal(await page.evaluate(() => window.testArena === document.querySelector('.combat-stage')), true);
      await page.evaluate(() => { delete window.testArena; });
      await tap('[data-action=bench-open]');
      await page.locator('.bench-entry [data-inspect]').first().waitFor();
      await tap('.bench-entry [data-inspect]');
      await tap('[data-return-bench]');
      await tap('.card-detail .detail-close');
    } else await tap('[data-action=skip]');
    await tap('[data-action=show-result]');
    await inView('[data-action=next-round]');
    await snap('14-resultado');
    await tap('[data-action=next-round]');
    await inView('.package-option');
    assert.equal(await page.locator('[data-action=recycle-open]').isEnabled(), true);
    await snap('15-rodada-dois');
    await tap('[data-action=package]');
    for (let i = 0; i < 3; i++) await tap(device ? '[data-mobile-pick]' : '.offer [data-action=pick]');
    move = 0;
    while (await page.locator('.zone-deploy').count()) await tap('.zone-deploy', move++ % 3);
    await tap('[data-action=skip]');
    await tap('[data-action=show-result]');
    await page.locator('.tech-results').waitFor();
    let rounds = 2;
    while (await page.locator('[data-action=next-round]').count()) {
      assert.ok(++rounds <= 15, 'seeded match should finish in 15 rounds');
      await tap('[data-action=next-round]');
      if (await page.locator('[data-action=package]').count()) {
        await tap('[data-action=package]');
        const pick = device ? '[data-mobile-pick]' : '.offer [data-action=pick]';
        while (await page.locator(pick).count()) await tap(pick);
      }
      move = 0;
      while (await page.locator('.zone-deploy').count()) await tap('.zone-deploy', move++ % 3);
      await tap('[data-action=skip]');
      await tap('[data-action=show-result]');
    }
    await inView('[data-action=restart]');
    await tap('[data-action=restart]');
    await inView('.package-option');

    assets.clear();
    await page.goto(new URL('colecao', base).href);
    await page.locator('.collection-card svg').first().waitFor();
    assert.match(await page.locator('.collection-counter').textContent(), /50 \/ 50/);
    await snap('16-colecao');
    if (device && width <= 480) assert.ok(assets.size < 20, 'collection artwork activation should be lazy, loaded ' + assets.size);
    await tap('[data-faction=robots]');
    await tap('[data-rarity-filter="6"]');
    assert.ok(Number((await page.locator('.collection-counter').textContent()).split('/')[0]) < 25);
    await tap('.collection-card');
    await tap('.card-detail .detail-close');
    await tap('.back-link');
    await page.locator(start).waitFor();
    assert.deepEqual(errors, []);
    console.log(name + ' PASS · ' + width + '×' + height + ' · ' + rounds + ' rodadas · pacotes ' + packageHeight + ' / posicionamento ' + placementHeight + ' px');
  } finally {
    await browser.close();
  }
}
