// Visit every page of the site, open every collapsible part, and dump the visible text (site-authored text only: question
// passages are skipped where they are marked as such).
const path = require('path'); const fs = require('fs'); const { chromium } = require('playwright');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await p.goto(file); await p.waitForTimeout(600);
  const tokens = await p.evaluate(() => {
    const t = ['home','start','reading','shape','job','chunk','long','para','say','check','others','sets','measured','notesfirst','method','shortcuts','hard','lessons','part-a','part-b','part-c','drills','practice','lookup',
      'math','m-learn','m-patterns','m-desmos','m-short','m-types','m-ref','m-practice'];
    for (let i = 1; i <= 19; i++) t.push('c' + i);
    for (let i = 1; i <= 17; i++) t.push('ex-' + i);
    return t;
  });
  const extra = await p.evaluate(() => { const D = JSON.parse(document.getElementById('sprint-data').textContent); return Object.keys(D.math.skills).map(k => 'm-' + k); });
  let out = '';
  for (const t of tokens.concat(extra)) {
    await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(120);
    const txt = await p.evaluate(() => {
      document.querySelectorAll('details').forEach(d => d.open = true);
      const v = [...document.querySelectorAll('main > section')].find(s => !s.hidden);
      return v ? v.innerText : '';
    });
    out += '\n#### ' + t + '\n' + txt;
  }
  out += '\n#### chrome\n' + await p.evaluate(() => document.querySelector('header').innerText + '\n' + document.querySelector('footer').innerText + '\n' + document.getElementById('tabs').innerText);
  fs.writeFileSync(process.argv[3], out); console.log('chars', out.length);
  await b.close();
})();
