const path = require('path'); const { chromium } = require('playwright');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]); const width = Number(process.argv[3]); const scheme = process.argv[4] || 'light';
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width, height: 1000 }, colorScheme: scheme })).newPage();
  await p.goto(file); await p.waitForTimeout(600);
  for (const t of ['start', 'method', 'c3', 'reading', 'drills', 'practice', 'lookup']) {
    await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(250);
    await p.screenshot({ path: `shots/rw-${width}-${scheme}-${t}.png` });
  }
  await b.close();
})();
