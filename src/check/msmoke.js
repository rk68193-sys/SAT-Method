const path = require('path');
const { chromium } = require('playwright');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const width = Number(process.argv[3] || 390), scheme = process.argv[4] || 'light', tag = width + '-' + scheme;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme });
  const p = await ctx.newPage();
  const errors = [], over = [], bad = [];
  p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  p.on('requestfailed', r => bad.push(r.url()));
  await p.goto(file); await p.waitForTimeout(700);
  const shot = async (n, full) => p.screenshot({ path: `shots/${tag}-${n}.png`, fullPage: !!full });
  await shot('home', true);
  const tokens = ['m-patterns','mpat-constant','mrare','m-desmos','md-fit','md-types','mpp-multiplier','mq-4aaa9c42','home','math','m-learn','m-learn-geo','m-nlf','m-cir','m-stc','mt-cir-read','mt-sys-count','m-types','m-short','ms-vertex','m-ref','m-practice','mp-nlf-vertex','mp-psda','start','grammar','math'];
  for (const t of tokens) {
    await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(150);
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, view: [...document.querySelectorAll('main > section')].filter(s => !s.hidden).map(s => s.id).join(','), cur: [...document.querySelectorAll('#tabs a[aria-current]')].map(a=>a.textContent).join('|') }));
    if (r.sw > r.cw + 1) over.push(`${t}: ${r.sw}>${r.cw}`);
    console.log(t.padEnd(16), r.view.padEnd(10), r.cur);
  }
  for (const [t, n] of [['m-patterns','patterns'],['m-desmos','desmos'],['math','mstart'],['m-learn','mlearn'],['m-nlf','skill'],['m-types','types'],['m-short','short'],['m-ref','ref']]) {
    await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(200); await shot(n, true);
  }
  // one exact question from a proof link: answer D on 4aaa9c42
  await p.evaluate(() => { location.hash = 'mq-4aaa9c42'; }); await p.waitForTimeout(250);
  await p.keyboard.press('4'); await p.waitForTimeout(200);
  console.log('mq verdict:', (await p.textContent('.mpverdict')).replace(/\s+/g, ' ').trim());
  await shot('mq', true);
  // pattern practice preset
  await p.evaluate(() => { location.hash = 'mpp-twofacts'; }); await p.waitForTimeout(200);
  console.log('pattern preset:', await p.$eval('input[name="mp-kind"]:checked', i => i.parentElement.textContent), '/', await p.$eval('input[name="mp-sub"]:checked', i => i.parentElement.textContent), '|', await p.textContent('#mp-count'));
  // finder search
  await p.evaluate(() => { location.hash = 'm-types'; }); await p.waitForTimeout(100);
  await p.fill('#mf-q', 'margin of error'); await p.waitForTimeout(100);
  console.log('finder:', await p.textContent('#mf-n'), '|', (await p.$$eval('#mf-list .mtype h3', h => h.map(x => x.textContent))).join('; '));
  // practice: 5 Hard questions on everything
  await p.evaluate(() => { location.hash = 'm-practice'; }); await p.waitForTimeout(150);
  await shot('psetup');
  await p.click('label:has(#mp-n-5)');
  await p.click('#mp-go'); await p.waitForTimeout(400);
  for (let i = 0; i < 5; i++) {
    const img = await p.evaluate(() => { const im = document.querySelector('.mpq img'); return im ? [im.complete, im.naturalWidth, im.getAttribute('src')] : null; });
    const mc = await p.$('.mpch');
    if (i === 0) await shot('pq');
    if (mc) { await p.keyboard.press(String(1 + (i % 4))); }
    else { await p.fill('#mp-gin', '7/6'); await p.click('#mp-gform button'); }
    await p.waitForTimeout(250);
    const v = await p.textContent('.mpverdict');
    const rimg = await p.evaluate(() => { const im = document.querySelector('.mprat img'); return im ? im.getAttribute('src') : null; });
    console.log('q', i + 1, mc ? 'MC' : 'grid', JSON.stringify(img), '→', v.replace(/\s+/g, ' ').trim(), rimg);
    if (i === 0) await shot('pfb', true);
    await p.click('#mp-next'); await p.waitForTimeout(300);
  }
  await shot('psum', true);
  console.log('summary:', (await p.textContent('#v-mprac h2')).trim());
  console.log(over.length ? 'OVERFLOW ' + over.join(' ; ') : 'no overflow');
  console.log(errors.length ? 'ERRORS ' + errors.join(' ; ') : 'no errors');
  console.log(bad.length ? 'FAILED REQUESTS ' + bad.slice(0,5).join(' ; ') : 'no failed requests');
  await browser.close();
})();
