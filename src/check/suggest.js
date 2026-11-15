// node src/check/suggest.js index.html
// Text size and colors (open, dark, kept after a reload, Escape, a click outside), then the Ask or suggest page: the page you
// came from, an empty message refused, a message sent to the suggestions table (Supabase is faked here, so nothing reaches
// the real project: the request must carry only the public key, no sign-in, and ask for nothing back), the robot trap, a
// failed send offering Copy and GitHub, no connection, the limit of 10 a day, the draft kept when you leave, and My notes.
// Then the footer, the skip link and the R&W tabs.
const path = require('path');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require(require.resolve('playwright', { paths: [require('child_process').execSync('npm root -g').toString().trim()] })); }
const { chromium } = pw;
const KEY = 'sat-grammar-sprint.v1';
let fails = 0;
const ok = (c, what) => { if (!c) { fails++; } console.log((c ? 'ok   ' : 'FAIL ') + what); };
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  /* the suggestions table, faked: what each send carried, and how the next one is answered */
  const sent = []; let answer = 'ok';
  await ctx.route(/\/rest\/v1\/suggestions/, r => {
    sent.push({ body: r.request().postDataJSON(), h: r.request().headers(), method: r.request().method() });
    if (answer === 'offline') { return r.abort(); }
    return answer === 'ok' ? r.fulfill({ status: 201, body: '' }) : r.fulfill({ status: 404, contentType: 'application/json', body: '{"code":"PGRST205","message":"Could not find the table"}' });
  });
  await p.goto(file + '#m-desmos'); await p.waitForTimeout(800);

  // theme: open, pick dark, persists after reload
  await p.click('#theme-btn'); await p.check('#theme-pop input[value="dark"]');
  ok((await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark', 'Dark puts the dark colors on');
  await p.keyboard.press('Escape');
  ok(await p.evaluate(() => document.getElementById('theme-pop').hidden), 'Escape closes the box');
  await p.reload(); await p.waitForTimeout(600);
  ok((await p.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark', 'dark is kept after a reload');
  await p.click('#theme-btn'); await p.check('#theme-pop input[value="auto"]');
  ok(!(await p.evaluate(() => document.documentElement.getAttribute('data-theme'))), 'Match my device follows the device again');
  await p.mouse.click(10, 600);
  ok(await p.evaluate(() => document.getElementById('theme-pop').hidden), 'a click outside closes the box');

  // suggest: remembers the page you came from
  await p.click('#footcols a[href="#suggest"]'); await p.waitForTimeout(200);
  const where = await p.$eval('#sg-where option', o => o.textContent);
  ok((await p.evaluate(() => location.hash)) === '#suggest' && /^The page I was on: Math/.test(where), 'the footer opens Ask or suggest, naming the page you were on: ' + where);
  ok((await p.textContent('#sg-form button[type="submit"]')).trim() === 'Send it', 'the button sends it here, with no GitHub account needed');
  await p.click('#sg-form button[type="submit"]');
  ok(/write your message first/.test(await p.textContent('#sg-msg')) && sent.length === 0, 'an empty message is not sent');

  await p.click('label:has(#sg-kind-tip)');
  await p.fill('#sg-text', 'Add a lesson on circles & radians?'); await p.fill('#sg-name', 'Sam');
  await p.click('#sg-form button[type="submit"]'); await p.waitForTimeout(400);
  const s1 = sent[0] || { body: {}, h: {} };
  ok(sent.length === 1 && s1.method === 'POST' && s1.body.kind === 'tip' && s1.body.body === 'Add a lesson on circles & radians?' && s1.body.name === 'Sam' && /^The page I was on: Math/.test(s1.body.part), 'Send it posts the kind, the part of the site, the message and the name: ' + JSON.stringify(s1.body));
  ok(!!s1.h.apikey && !s1.h.authorization && s1.h.prefer === 'return=minimal', 'with the public key only, no sign-in, and nothing asked back');
  ok(Object.keys(s1.body).sort().join() === 'body,kind,name,part', 'and nothing else is sent');
  ok(/^Sent\. Thank you/.test(await p.textContent('#sg-msg')) && (await p.inputValue('#sg-text')) === '', 'it says it was sent and clears the box');
  ok((await p.$$('.sglist li')).length === 1, 'a copy is kept on this device');

  // the robot trap: a filled hidden box looks sent but sends nothing
  await p.fill('#sg-text', 'Buy cheap things at example dot com'); await p.evaluate(() => { document.getElementById('sg-web').value = 'http://spam.example'; });
  await p.click('#sg-form button[type="submit"]'); await p.waitForTimeout(300);
  ok(sent.length === 1 && /^Sent/.test(await p.textContent('#sg-msg')), 'a robot filling the hidden box is thanked, and nothing is sent');
  await p.evaluate(() => { document.getElementById('sg-web').value = ''; });

  // a failed send: the table is not there yet
  answer = 'missing';
  await p.fill('#sg-text', 'The answer to the third question seems wrong.');
  await p.click('#sg-form button[type="submit"]'); await p.waitForTimeout(400);
  const gh = await p.$eval('#sg-msg a', a => a.href).catch(() => '');
  ok(/did not send just now/.test(await p.textContent('#sg-msg')) && /github\.com\/rk68193-sys\/SAT-Method\/issues\/new\?title=/.test(gh) && (await p.inputValue('#sg-text')) !== '', 'when it cannot be saved, it says so, keeps the message, and offers Copy or GitHub with it filled in');
  answer = 'offline';
  await p.click('#sg-form button[type="submit"]'); await p.waitForTimeout(400);
  ok(/no internet connection/.test(await p.textContent('#sg-msg')), 'with no connection it says that');
  answer = 'ok';

  // leaving and coming back keeps the draft
  await p.evaluate(() => { location.hash = 'math'; }); await p.waitForTimeout(150);
  await p.evaluate(() => { location.hash = 'suggest'; }); await p.waitForTimeout(150);
  ok((await p.inputValue('#sg-text')) === 'The answer to the third question seems wrong.', 'a half-written message is kept when you leave and come back');

  // notes autosave
  await p.fill('#sg-notes', 'positive solution = keep the positive one'); await p.waitForTimeout(600);
  ok((await p.evaluate(k => JSON.parse(localStorage.getItem(k)).s.notes, KEY)) === 'positive solution = keep the positive one', 'My notes saves as you type');
  await p.evaluate(() => { location.hash = 'home'; }); await p.waitForTimeout(150);
  await p.evaluate(() => { location.hash = 'suggest-notes'; }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => window.scrollY > 0), 'the My notes link scrolls to the notes');

  // ten a day from one device
  await p.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); for (let i = 0; i < 10; i++) { s.g[String(Date.now() - i * 1000)] = { k: 'A question', w: 'The whole site', t: 'question ' + i }; } localStorage.setItem(k, JSON.stringify(s)); }, KEY);
  await p.reload(); await p.waitForTimeout(600);
  const n0 = sent.length;
  await p.fill('#sg-text', 'One more question'); await p.click('#sg-form button[type="submit"]'); await p.waitForTimeout(300);
  ok(/10 messages from this device today/.test(await p.textContent('#sg-msg')) && sent.length === n0, 'after 10 messages in a day, the next waits for tomorrow');

  // footer links
  await p.evaluate(() => { location.hash = 'home'; }); await p.waitForTimeout(150);
  await p.click('.foot-theme');
  ok(await p.evaluate(() => !document.getElementById('theme-pop').hidden), 'the footer opens Text size and colors');
  await p.keyboard.press('Escape');
  // skip link
  await p.keyboard.press('Tab');
  console.log('first tab:', await p.evaluate(() => document.activeElement.textContent));
  await p.keyboard.press('Enter');
  console.log('focus after skip:', await p.evaluate(() => document.activeElement.id), '| hash still', await p.evaluate(() => location.hash));
  await p.keyboard.press('Escape');   // Tab from Text size now reaches Help, and Enter opens it: close it again
  // tabs nav in R&W
  await p.click('#subj a[data-subj="rw"]'); await p.waitForTimeout(150);
  console.log('rw tabs:', await p.$$eval('#secin a', a => a.map(x => x.textContent + (x.getAttribute('aria-current') ? '*' : '')).join(', ')));
  ok(!errs.length, errs.length ? 'ERRORS ' + errs.join(' | ') : 'no errors');
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'all suggest checks passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('RUN FAILED', e); process.exit(1); });
