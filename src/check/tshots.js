// node check/tshots.js out/index.html <width> <theme|auto-light|auto-dark> outdir token...
const path = require('path');
const { chromium } = require(require.resolve('playwright', { paths: [require('child_process').execSync('npm root -g').toString().trim()] }));
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const width = Number(process.argv[3]), theme = process.argv[4], out = process.argv[5];
  const tokens = process.argv.slice(6);
  const browser = await chromium.launch();
  const scheme = theme === 'auto-dark' ? 'dark' : 'light';
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme });
  if (!theme.startsWith('auto')) { await ctx.addInitScript(t => { try { localStorage.setItem('sat-sprint-theme', t); } catch (e) {} }, theme); }
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(file); await p.waitForTimeout(1200);
  for (const t of tokens) {
    const [tok, mode] = t.split(':');
    await p.evaluate(x => { location.hash = x; }, tok); await p.waitForTimeout(300);
    if (mode === 'theme') { await p.click('#theme-btn'); await p.waitForTimeout(150); }
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    if (r.sw > r.cw + 1) errors.push(`${tok}: overflow ${r.sw}>${r.cw}`);
    await p.screenshot({ path: `${out}/${tok}${mode ? '-' + mode : ''}-${width}-${theme}.png`, fullPage: mode !== 'top' && mode !== 'theme' });
    if (mode === 'theme') { await p.keyboard.press('Escape'); }
  }
  console.log(errors.length ? 'ERRORS: ' + errors.join(' | ') : 'ok');
  await browser.close();
})();
