const path = require('path');
const { chromium } = require(require.resolve('playwright', { paths: [require('child_process').execSync('npm root -g').toString().trim()] }));
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(file + '#m-desmos'); await p.waitForTimeout(800);
  // theme: open, pick dark, persists after reload
  await p.click('#theme-btn'); await p.check('#theme-pop input[value="dark"]');
  console.log('theme attr', await p.evaluate(() => document.documentElement.getAttribute('data-theme')));
  await p.keyboard.press('Escape');
  console.log('pop hidden after Esc', await p.evaluate(() => document.getElementById('theme-pop').hidden));
  await p.reload(); await p.waitForTimeout(600);
  console.log('after reload', await p.evaluate(() => document.documentElement.getAttribute('data-theme')));
  await p.click('#theme-btn'); await p.check('#theme-pop input[value="auto"]');
  console.log('auto removes attr', await p.evaluate(() => document.documentElement.getAttribute('data-theme')));
  await p.mouse.click(10, 600); console.log('outside click closes', await p.evaluate(() => document.getElementById('theme-pop').hidden));
  // suggest: remembers the page you came from
  await p.click('[data-tool="suggest"]'); await p.waitForTimeout(200);
  console.log('hash', await p.evaluate(() => location.hash), '| where:', await p.$eval('#sg-where option', o => o.textContent));
  await p.click('#sg-form button[type="submit"]'); console.log('empty msg:', await p.textContent('#sg-msg'));
  await p.click('label:has(#sg-kind-tip)');
  await p.fill('#sg-text', 'Add a lesson on circles & radians?'); await p.fill('#sg-name', 'Sam');
  const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('#sg-form button[type="submit"]')]);
  const u = new URL(pop.url().startsWith('http') ? pop.url() : 'https://x/' ); 
  console.log('popup url', decodeURIComponent(pop.url()).slice(0, 220));
  await pop.close();
  console.log('saved list:', await p.$$eval('.sglist li', l => l.length), '| msg:', await p.textContent('#sg-msg'));
  // leaving and coming back keeps the draft
  await p.evaluate(() => { location.hash = 'math'; }); await p.waitForTimeout(150);
  await p.evaluate(() => { location.hash = 'suggest'; }); await p.waitForTimeout(150);
  console.log('draft kept:', await p.inputValue('#sg-text'), '| where now:', await p.$eval('#sg-where option', o => o.textContent));
  // notes autosave
  await p.fill('#sg-notes', 'positive solution = keep the positive one'); await p.waitForTimeout(600);
  console.log('notes stored:', await p.evaluate(() => JSON.parse(localStorage.getItem('sat-grammar-sprint.v1')).s.notes));
  await p.evaluate(() => { location.hash = 'home'; }); await p.waitForTimeout(150);
  await p.evaluate(() => { location.hash = 'suggest-notes'; }); await p.waitForTimeout(200);
  console.log('notes view y>0:', await p.evaluate(() => window.scrollY > 0));
  // footer links
  await p.evaluate(() => { location.hash = 'home'; }); await p.waitForTimeout(150);
  await p.click('.foot-theme'); console.log('footer opens theme:', await p.evaluate(() => !document.getElementById('theme-pop').hidden));
  await p.keyboard.press('Escape');
  // skip link
  await p.keyboard.press('Tab'); console.log('first tab:', await p.evaluate(() => document.activeElement.textContent));
  await p.keyboard.press('Enter'); console.log('focus after skip:', await p.evaluate(() => document.activeElement.id), '| hash still', await p.evaluate(() => location.hash));
  // tabs nav in R&W
  await p.click('#subj a[data-subj="rw"]'); await p.waitForTimeout(150);
  console.log('rw tabs:', await p.$$eval('#secin a', a => a.map(x => x.textContent + (x.getAttribute('aria-current') ? '*' : '')).join(', ')));
  console.log(errs.length ? 'ERRORS ' + errs.join(' | ') : 'no errors');
  await b.close();
})();
