/* Character skins and the study buddy (site/buddy.js, site/pal.js). On a wide screen: the buddy stands beside the page and
   says hello the first time, out of the way of everything on the page; a tap plays one of its moves and shows a Hide me
   button; Hide puts it away until the tab is closed (a new tab brings it back); the switch in Text size and colors turns it
   off and on again. On a phone: it peeks up from behind the bottom bar, with room left at the foot of the page so nothing
   stays under it; a tap pops it up and a tap anywhere else sends it back. Wearing a skin from the Crates page dresses the
   buddy too; it stays out of My room and timed modules; it cheers a right answer. With reduced motion it stands still.
   No sideways scrolling at 320 px.
   node src/check/buddy.js index.html [shots-folder] */
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const file = 'file://' + path.resolve(process.argv[2] || 'index.html'), dir = process.argv[3] || '';
if (dir) { fs.mkdirSync(dir, { recursive: true }); }
let fails = 0;
const ok = (c, what) => { if (!c) { fails++; } console.log((c ? 'ok   ' : 'FAIL ') + what); };
const KEY = 'sat-grammar-sprint.v1', OFF = 'sat-sprint-buddy', HI = 'sat-sprint-buddy-hi';
function day(off) { const d = new Date(Date.now() - off * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
/* a student with 12 days in a row and two skins from the Dress-Up crate, wearing none yet */
function rich() {
  const days = {};
  for (let i = 0; i < 12; i++) { days[day(i)] = [3, 2]; }
  const o = { c1: [Date.now() - 120000, 'dress', 'skin:sprout', 'c', 0, 'dress-0'], c2: [Date.now() - 60000, 'dress', 'skin:ninja', 'e', 0, 'dress-1'] };
  return { t: {}, l: {}, d: {}, s: { days, chn: 'Maya', tour: 1, welcome: 1, pz: { e: {}, x: {}, o, g: {}, fz: {}, st: { 'dress-0': 1, 'dress-1': 1 }, eq: {} } }, r: {}, rl: {}, b: {}, m: {}, g: {}, x: {} };
}

async function student(b, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: { width: opt.width || 1440, height: opt.height || 900 }, deviceScaleFactor: dir ? 2 : 1, serviceWorkers: 'block', reducedMotion: opt.reduce ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(o => {
    if (!localStorage.getItem(o.key)) { localStorage.setItem(o.key, JSON.stringify(o.data)); if (o.seen) { localStorage.setItem(o.hi, '1'); } }
  }, { data: rich(), key: KEY, hi: HI, seen: opt.seen !== false });
  const errs = [];
  const S = { ctx, errs };
  S.page = async () => {
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g/i.test(m.text())) { errs.push('console: ' + m.text()); } });
    return p;
  };
  S.p = await S.page();
  S.open = async (h, p) => { p = p || S.p; await p.goto(file + '#' + (h || 'home')); await p.waitForTimeout(900); };
  /* the buddy as the page has it: on the page, shown, its place, its bubble and what it is doing */
  S.pal = (p) => (p || S.p).evaluate(() => {
    const el = document.getElementById('pal'); if (!el) { return null; }
    const say = el.querySelector('.pal-say'), svg = el.querySelector('.pal-me .bud'), r = el.querySelector('.pal-me').getBoundingClientRect();
    return { shown: !el.hidden && getComputedStyle(el).display !== 'none', cls: el.className, svg: svg ? svg.getAttribute('class') : '', act: svg ? svg.getAttribute('data-act') || '' : '',
      say: say && !say.hidden ? say.querySelector('.pal-line').textContent : '', hide: !!(say && !say.hidden && !say.querySelector('.pal-hide').hidden),
      label: el.querySelector('.pal-me').getAttribute('aria-label'), box: [r.left, r.top, r.right, r.bottom], pad: document.body.classList.contains('pal-pad') };
  });
  /* what can be tapped under the buddy's visible part: the page's own buttons, links and fields there */
  S.under = (p) => (p || S.p).evaluate(() => {
    const el = document.getElementById('pal'), r = el.querySelector('.pal-me').getBoundingClientRect(), out = [];
    for (let i = 1; i < 6; i++) { for (let j = 1; j < 6; j++) {
      const x = r.left + r.width * i / 6, y = r.top + r.height * j / 6;
      if (y < 0 || y > innerHeight || x < 0 || x > innerWidth) { continue; }
      const top = document.elementFromPoint(x, y);
      if (!top || !el.contains(top)) { continue; }
      const below = document.elementsFromPoint(x, y).find(n => !el.contains(n));
      const hit = below && below.closest('a[href], button, input, select, textarea, [role="button"], .opt');
      if (hit) { out.push((hit.id ? '#' + hit.id : hit.tagName.toLowerCase()) + ' "' + (hit.textContent || '').trim().slice(0, 30) + '"'); }
    } }
    return [...new Set(out)];
  });
  /* a spot on the page with nothing to tap */
  S.blank = (p) => (p || S.p).evaluate(() => {
    const el = document.getElementById('pal');
    for (let y = 120; y < innerHeight - 120; y += 20) { for (let x = 4; x < innerWidth; x += 20) {
      const n = document.elementFromPoint(x, y);
      if (n && !(el && el.contains(n)) && !n.closest('a[href], button, input, select, textarea, label, summary, details, [role="button"], [tabindex], .opt')) { return [x, y]; }
    } }
    return [2, 200];
  });
  S.wide = async (what, p) => { const r = await (p || S.p).evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); ok(r[0] <= r[1] + 1, 'no sideways scrolling: ' + what + ' (' + r[0] + ' in ' + r[1] + ')'); };
  S.shot = async (n, p) => { if (dir) { await (p || S.p).screenshot({ path: path.join(dir, 'buddy-' + n + '.png') }); } };
  S.done = async name => { ok(!errs.length, name + ': no script errors' + (errs.length ? ' (' + errs.join(' | ') + ')' : '')); await ctx.close(); };
  return S;
}

(async () => {
  const b = await chromium.launch();

  // ---------- a wide screen: beside the page, hello, a tap, Hide, the switch ----------
  {
    const W = await student(b, { seen: false }), p = W.p;
    await W.open('home');
    let s = await W.pal();
    ok(!!s && s.shown && /pal-stand/.test(s.cls) && /\bbud\b/.test(s.svg) && !s.pad, 'on a wide screen the buddy stands beside the page: ' + (s && s.cls));
    ok(!!s && /^Your study buddy\. Tap to say hi\.$/.test(s.label), 'its button says what it is: ' + (s && s.label));
    ok(!(await W.under()).length, 'nothing on the page is under it: ' + (await W.under()).join(', '));
    await p.waitForTimeout(2200);
    s = await W.pal();
    ok(/^Hi! I’m your study buddy/.test(s.say), 'the first time, it says hello: ' + s.say);
    ok(await p.evaluate(k => localStorage.getItem(k) === '1', HI), 'and only the first time');
    await W.shot('hello');
    await p.click('#pal .pal-me'); await p.waitForTimeout(400);
    s = await W.pal();
    ok(!!s.act && !!s.say && !/^Hi! I’m your study buddy/.test(s.say) && s.hide, 'a tap plays one of its moves, says something and offers Hide me: ' + s.act + ' / ' + s.say);
    /* five quick taps make it dizzy */
    for (let i = 0; i < 4; i++) { await p.click('#pal .pal-me'); await p.waitForTimeout(120); }
    s = await W.pal();
    ok(s.act === 'dizzy' && /spinning/.test(s.say), 'five quick taps make it dizzy: ' + s.act);
    await p.click('#pal .pal-hide'); await p.waitForTimeout(300);
    ok(!(await p.$('#pal')), 'Hide me puts it away');
    ok(/Your study buddy is hidden/.test(await p.textContent('#pz-toast')) && /Text size and colors/.test(await p.textContent('#pz-toast')), 'and a note says how to turn it off for good');
    await p.evaluate(() => { location.hash = 'crates'; }); await p.waitForTimeout(700);
    ok(!(await p.$('#pal')), 'it stays away on the next page');
    const p2 = await W.page(); await W.open('home', p2);
    ok(!!(await W.pal(p2)) && (await W.pal(p2)).shown, 'and comes back in a new tab');
    /* the switch in Text size and colors */
    await p2.click('#theme-btn'); await p2.waitForSelector('#theme-pop input[name="buddy"]');
    ok(await p2.isChecked('#theme-pop input[name="buddy"]'), 'Text size and colors has a Show my study buddy switch, on');
    await p2.click('#theme-pop input[name="buddy"]'); await p2.waitForTimeout(200);
    ok(!(await p2.$('#pal')) && await p2.evaluate(k => localStorage.getItem(k) === 'off', OFF), 'switched off, it goes, and the choice is kept on this device');
    /* the next page, not a reload or another tab: in this test browser either can read what was saved before the switch */
    await p2.evaluate(() => { location.hash = 'crates'; }); await p2.waitForTimeout(700);
    ok(!(await p2.$('#pal')), 'it stays off on the next page');
    if (!(await p2.isVisible('#theme-pop input[name="buddy"]'))) { await p2.click('#theme-btn'); }
    await p2.waitForSelector('#theme-pop input[name="buddy"]');
    await p2.click('#theme-pop input[name="buddy"]'); await p2.waitForTimeout(200);
    ok(!!(await p2.$('#pal')) && await p2.evaluate(k => localStorage.getItem(k) === null, OFF), 'switched on again, it is back');
    await W.done('a wide screen');
  }

  // ---------- a phone: peeking up from behind the bottom bar ----------
  {
    const P = await student(b, { width: 390, height: 844 }), p = P.p;
    await P.open('home');
    let s = await P.pal();
    ok(!!s && s.shown && /pal-peek/.test(s.cls) && s.pad, 'on a phone it peeks up in the corner, and the page gets room at its foot: ' + (s && s.cls));
    const bar = await p.evaluate(() => { const n = document.querySelector('.subj'); return n ? n.getBoundingClientRect().top : innerHeight; });
    ok(s.box[1] < bar && s.box[3] > bar, 'its head shows above the bottom bar, the rest behind it: ' + s.box.map(Math.round).join(',') + ' bar at ' + Math.round(bar));
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(300);
    const u = await P.under();
    ok(!u.length, 'at the foot of the page nothing is left under it: ' + u.join(', '));
    await P.shot('phone');
    const head = { x: (s.box[2] - s.box[0]) / 2, y: 14 };
    await p.click('#pal .pal-me', { position: head }); await p.waitForTimeout(700);
    s = await P.pal();
    ok(/pal-out/.test(s.cls) && s.hide && !!s.say, 'a tap pops it up, with its line and Hide me');
    await P.shot('phone-tap');
    const [bx, by] = await P.blank(); await p.mouse.click(bx, by); await p.waitForTimeout(300);
    s = await P.pal();
    ok(!/pal-out/.test(s.cls) && !s.say, 'a tap anywhere else sends it back down');
    await P.wide('a phone');
    await P.done('a phone');
  }

  // ---------- a skin, places it stays away from, and a right answer ----------
  {
    const K = await student(b, { width: 1440 }), p = K.p;
    await K.open('crates');
    await p.click('[data-pz-wear="skin"][data-pz-id="skin:sprout"]'); await p.waitForTimeout(300);
    const st = await p.evaluate(k => JSON.parse(localStorage.getItem(k)).s.room, KEY);
    ok(!!st && st.a === 1 && st.av[2] === 'skin:sprout', 'Wear on a skin dresses the character: ' + JSON.stringify(st));
    let s = await K.pal();
    ok(/bud-sk-sprout/.test(s.svg) && /in the Sprout skin/.test(s.label), 'and the buddy wears it too: ' + s.label);
    await p.evaluate(() => { location.hash = 'room'; }); await p.waitForTimeout(1200);
    s = await K.pal();
    ok(!s.shown, 'it stays out of My room, where the character already stands');
    ok(/bud-sk-sprout/.test(await p.$eval('.room-room .room-me .bud', n => n.getAttribute('class'))), 'which wears the skin');
    await p.evaluate(() => { location.hash = 'home'; }); await p.waitForTimeout(900);
    ok((await K.pal()).shown, 'and is back on Home');
    await p.evaluate(() => { location.hash = 'rw-module'; }); await p.waitForTimeout(900);
    await p.click('#tstart'); await p.waitForTimeout(1100);
    ok(!(await K.pal()).shown, 'it is never there in a timed module');
    await p.goto(file + '#home'); await p.waitForTimeout(900);
    ok((await K.pal()).shown, 'and comes back after it');
    /* a right answer in a practice set; a set of ten can end before one (about 1 time in 18, always answering A), and
       setting the address the page already has starts nothing, so a new set is started by way of Home */
    const start = async () => {
      await p.evaluate(() => { location.hash = 'home'; }); await p.waitForTimeout(250);
      await p.evaluate(() => { location.hash = 'rw-mixed'; }); await p.waitForTimeout(900);
    };
    await start();
    let right = 0;
    for (let i = 0; i < 48 && !right; i++) {
      const a = await p.waitForSelector('#tcard .opt[data-k="A"]:not([disabled])', { timeout: 3000 }).catch(() => null);
      if (!a) { await start(); continue; }
      await a.click(); await p.waitForTimeout(80);
      if (await p.$('#tcard .opt[data-k="A"].right')) { right = i + 1; break; }
      await p.keyboard.press('Enter'); await p.waitForTimeout(160);
    }
    s = await K.pal();
    ok(right > 0 && !!s.act && !!s.say, 'it cheers a right answer: ' + s.act + ' / ' + s.say);
    await K.done('a skin');
  }

  // ---------- reduced motion, and 320 px ----------
  {
    const R = await student(b, { width: 1440, reduce: true }), p = R.p;
    await R.open('home');
    const still = await p.evaluate(() => [...document.querySelectorAll('#pal .bud, #pal .bud *')].every(n => getComputedStyle(n).animationName === 'none'));
    ok(still, 'with reduced motion nothing on it moves');
    await p.click('#pal .pal-me'); await p.waitForTimeout(300);
    ok(!!(await R.pal()).say, 'a tap still gets its line');
    await R.done('reduced motion');
    const N = await student(b, { width: 320, height: 640 });
    await N.open('home');
    await N.wide('320 px', N.p);
    ok((await N.pal(N.p)).shown, 'it is there at 320 px too');
    await N.done('320 px');
  }

  await b.close();
  console.log(fails ? fails + ' FAILED' : 'all passed');
  process.exit(fails ? 1 : 0);
})();
