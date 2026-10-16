const path = require('path');
const { chromium } = require(require.resolve('playwright', { paths: [require('child_process').execSync('npm root -g').toString().trim()] }));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForTimeout(600);
  console.log('before:', await p.evaluate(() => document.activeElement.outerHTML.slice(0, 120)));
  await p.keyboard.press('Tab');
  const box = await p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return a.textContent + ' top=' + Math.round(r.top); });
  console.log('first tab:', box);
  await p.keyboard.press('Enter'); await p.waitForTimeout(100);
  console.log('focus:', await p.evaluate(() => document.activeElement.id), 'hash:', await p.evaluate(() => location.hash));
  await p.keyboard.press('Tab');
  console.log('next tab lands in main:', await p.evaluate(() => !!document.activeElement.closest('main')), await p.evaluate(() => document.activeElement.textContent.slice(0, 40)));
  await b.close();
})();
