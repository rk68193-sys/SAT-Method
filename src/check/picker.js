const path = require('path'); const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); 
  for (const w of [390, 1280]) {
    const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
    await p.goto('file://' + path.resolve(process.argv[2]) + '#m-practice'); await p.waitForTimeout(500);
    await p.click('label:has(input[name="mp-kind"][value="k"])'); await p.waitForTimeout(150);
    await p.screenshot({ path: `shots/picker-${w}.png`, fullPage: true });
    await p.click('label:has(input[name="mp-sub"][value="cir"])'); await p.waitForTimeout(100);
    console.log(w, await p.textContent('#mp-count'));
    await p.click('label:has(input[name="mp-kind"][value="p"])'); await p.waitForTimeout(100);
    console.log(w, await p.textContent('#mp-count'));
    await p.goto('file://' + path.resolve(process.argv[2]) + '#m-patterns'); await p.waitForTimeout(400);
    await p.screenshot({ path: `shots/patcol-${w}.png`, fullPage: true });
    const h = await p.evaluate(() => document.documentElement.scrollHeight); console.log(w, 'patterns page height', h);
    await p.evaluate(() => { location.hash = 'm-desmos'; }); await p.waitForTimeout(300);
    console.log(w, 'desmos page height', await p.evaluate(() => document.documentElement.scrollHeight));
    await p.evaluate(() => { location.hash = 'md-chain'; }); await p.waitForTimeout(300);
    console.log(w, 'md-chain open:', await p.evaluate(() => document.getElementById('md-chain').open));
  }
  await b.close();
})();
