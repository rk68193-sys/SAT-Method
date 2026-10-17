const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const read = f => JSON.parse(fs.readFileSync(path.join(root, 'src/build', f)));
const math = read('mdata.json'), figures = read('figures.json'), grammar = read('grammar-sources.json');
const byId = Object.fromEntries([...figures, ...grammar].map(q => [q.id, q]));
const base = process.argv[2] || 'http://127.0.0.1:8000/';
(async () => {
  assert.equal(figures.length, 131); assert.equal(grammar.length, 335);
  for (const q of [...figures, ...grammar]) {
    assert.match(q.ans, /^[A-D]$/); assert.ok(q.pages.length);
    for (const file of [q.qsrc, q.rsrc]) assert.ok(fs.statSync(path.join(root, file)).size > 1000, file);
  }
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/chromium' });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const go = async hash => { await page.goto(base + '#' + hash); await page.waitForTimeout(120); };
    await go('practice');
    await page.check('#tsrc-both', { force: true });
    assert.match(await page.locator('#tcount').innerText(), /1,?845 questions/);
    for (const [source, count] of [['v', 131], ['a', 335]]) {
      await go('practice'); await page.check('#tsrc-' + source, { force: true });
      await page.check('#twhich-all', { force: true });
      assert.match(await page.locator('#tcount').innerText(), new RegExp(count + ' questions'));
      await page.click('#tstart');
      for (let i = 0; i < 3; i++) {
        const img = page.locator('#tcard img[src^="rw/q/"]'); await img.waitFor();
        await img.evaluate(im => im.decode());
        const id = (await img.getAttribute('src')).match(/([0-9a-f]{8})\.webp$/)[1];
        const chosen = i === 0 ? (byId[id].ans === 'A' ? 'B' : 'A') : byId[id].ans;
        await page.locator('#tcard .opt[data-k="' + chosen + '"]').click();
        assert.match(await page.locator('#tcard .verdict').innerText(), i === 0 ? /not|incorrect/i : /right|correct/i);
        const sol = page.locator('#tcard .qfeed img[src^="rw/r/"]'); await sol.waitFor(); await sol.evaluate(im => im.decode());
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
        if (i < 2) await page.click('#tnext');
      }
      await page.click('#tend');
      assert.match(await page.locator('.dresult').innerText(), /2 of 3 right/);
      await page.click('#tagain');
    }
    console.log('PASS: complete unique English pool, restored figure/grammar practice, source solutions and mobile layout');
    let cards = 0, questions = 0;
    for (const skill of Object.keys(math.skills)) {
      await go('m-' + skill);
      cards += await page.locator('#v-mlearn article.mtype').count();
      questions += await page.locator('#v-mlearn .msourcegroup a[href^="m/q/"]').count();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    }
    assert.equal(cards, 102); assert.equal(questions, 1925);
    console.log('PASS: all102 Math types, all1925 comparison links, mobile layout');
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const token of ['reasoning', 'data-patterns', 'source-findings']) {
        await go(token);
        assert.ok((await page.locator('#v-reading').innerText()).length > 1000);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
      }
    }
    for (const id of ['5432d1de', 'd222f7d9', '00221c00']) {
      await go('rq-' + id);
      assert.match(await page.locator('#tcard').innerText(), new RegExp(id));
      assert.equal(await page.locator('#tcard .opt').count(), 4);
    }
    assert.deepEqual(errors, []); console.log('PASS: reading pathways, data patterns, desktop/mobile; no script errors');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
