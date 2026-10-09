const path = require('path');
const { chromium } = require(require.resolve('playwright', { paths: [require('child_process').execSync('npm root -g').toString().trim()] }));
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const width = Number(process.argv[3] || 390);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: 'dark' });
  const p = await ctx.newPage();
  const errors = [], over = [];
  p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await p.goto(file); await p.waitForTimeout(800);
  const tokens = ['start','which','reading','shape','job','leadin','chunk','tags','turns','long','apart-3','para','say','check','traps','others','train','sets','measured',
    ...Array.from({length:17},(_, i)=>'ex-'+(i+1)), 'grammar','try','patterns','shortcuts','hard','lessons','part-a','part-b','part-c','c1','c8','c14','c19','u3-3','i-7b950fc2','q-7b950fc2','g-verbs',
    'drills','practice','lookup','find','transitions','glossary','about','job-notes','o-cross','notesfirst'];
  for (const t of tokens) {
    await p.evaluate(x => { location.hash = x; }, t);
    await p.waitForTimeout(120);
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, view: [...document.querySelectorAll('main > section')].filter(s => !s.hidden).map(s => s.id).join(',') }));
    if (r.sw > r.cw + 1) over.push(`${t}: ${r.sw}>${r.cw}`);
    if (!r.view) errors.push('no view for ' + t);
  }
  // exercise a reading example in try mode, each drill once, a mixed practice set
  await p.evaluate(() => { location.hash = 'ex-5'; }); await p.waitForTimeout(150);
  await p.click('#ex-host .opt[data-k="A"]'); await p.waitForTimeout(100);
  const w = await p.textContent('#ex-host .verdict');
  await p.click('#ex-read'); await p.waitForTimeout(100);
  for (const k of ['job','tag','core','point','pointer','notes','why','pattern','boundary','verb','link']) {
    await p.evaluate(() => { location.hash = 'drills'; }); await p.waitForTimeout(100);
    const b = await p.$('[data-start="' + k + '"]');
    if (!b) { await p.click('#dhome').catch(()=>{}); await p.waitForTimeout(50); }
    await p.click('[data-start="' + k + '"]'); await p.waitForTimeout(100);
    await p.keyboard.press('1'); await p.waitForTimeout(80);
    if (k === 'core') { await p.click('#pcheck').catch(() => {}); await p.waitForTimeout(80); }
    const v = await p.textContent('#dfeed .verdict').catch(() => 'NO VERDICT');
    errors.length; console.log('drill', k, '→', v);
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    if (r.sw > r.cw + 1) over.push(`drill ${k}: ${r.sw}>${r.cw}`);
    await p.click('#dend'); await p.waitForTimeout(80); await p.click('#dhome');
  }
  await p.evaluate(() => { location.hash = 'practice'; }); await p.waitForTimeout(100);
  await p.check('#tsrc-both', { force: true }); await p.waitForTimeout(50);
  await p.click('#tstart'); await p.waitForTimeout(400);
  for (let i = 0; i < 4; i++) { await p.keyboard.press('b'); await p.waitForTimeout(80); await p.keyboard.press('Enter'); await p.waitForTimeout(120); }
  const r2 = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  if (r2.sw > r2.cw + 1) over.push(`practice: ${r2.sw}>${r2.cw}`);
  await p.click('#tend'); await p.waitForTimeout(150);
  console.log('practice result:', await p.textContent('.dresult'));
  console.log('example verdict:', w);
  await p.evaluate(() => { location.hash = 'find'; }); await p.fill('#fq', '123bd312'); await p.waitForTimeout(50);
  console.log('lookup:', (await p.textContent('#flist')).trim().slice(0, 140));
  await p.evaluate(() => { location.hash = 'sets'; }); await p.fill('#idq', '7b950fc2');
  console.log('idq:', await p.textContent('#idres'));
  if (process.argv[4]) { await p.evaluate(x => { location.hash = x; }, process.argv[4]); await p.waitForTimeout(300); await p.screenshot({ path: 'shot-' + process.argv[4] + '-' + width + '.png', fullPage: false }); }
  console.log(over.length ? 'OVERFLOW:\n' + over.join('\n') : 'no overflow');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  await browser.close();
})().catch(e => { console.error('RUN FAILED', e); process.exit(1); });
