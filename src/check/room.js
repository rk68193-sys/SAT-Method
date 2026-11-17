/* My room (site/room.js), the first part of the clubhouse. As a new student: the empty room, the note about crates, and a
   room saved with nothing in it. As a student with prizes: the room it starts with (what they have on, then their rarest
   prizes), tapping a stand (its card, and the effect playing), the list of everything in the room, the keyboard;
   decorating every spot (a theme on the walls and the living view through the window, a paper as the view, a prize moved
   from one stand to another, the shelf and the board when they are full, the name and title on the plate, a color and a
   hat), Cancel putting it all back, Save keeping it after a reload; a saved room holding prizes the student no longer has,
   and junk; what is saved (only what a backup may hold); a backup from another device (the room saved last wins, and the
   same file twice changes nothing); reduced motion; the links to the room; Help; no sideways scrolling at 320 px.
   node src/check/room.js index.html [width] [shots-folder]   (pictures are taken at twice the pixels, to be read by people) */
const fs = require('fs'), os = require('os'), path = require('path');
const { chromium } = require('playwright');
const page = path.resolve(process.argv[2] || 'index.html'), file = 'file://' + page;
const width = Number(process.argv[3] || 390), dir = process.argv[4] || '';
if (dir) { fs.mkdirSync(dir, { recursive: true }); }
let fails = 0;
const ok = (c, what) => { if (!c) { fails++; } console.log((c ? 'ok   ' : 'FAIL ') + what); };
const BK_KEY = /^[\w.\-]{1,64}$/, BK_STR = /^[\w .:,+\-\/]{0,200}$/;
const KEY = 'sat-grammar-sprint.v1', THEME = 'sat-sprint-theme';
function plainSave(v, at) {
  if (v === null || typeof v === 'boolean' || typeof v === 'number') { return true; }
  if (typeof v === 'string') { return BK_STR.test(v) || (console.log('  not plain: ' + at + ' = ' + v), false); }
  if (Array.isArray(v)) { return v.every((x, i) => plainSave(x, at + '.' + i)); }
  return Object.keys(v).every(k => (BK_KEY.test(k) || (console.log('  bad name: ' + at + '.' + k), false)) && plainSave(v[k], at + '.' + k));
}
function day(off) { const d = new Date(Date.now() - off * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
/* a student who has opened crates: the prizes, a sticker from each crate, 12 days in a row, and what they have on */
const OWN = ['theme:prize-nebula', 'theme:prize-library', 'paper:stars', 'paper:lined', 'aura:horizon', 'aura:glow', 'aura:seraph', 'fx:supernova', 'fx:confetti', 'fx:check', 'streak:plant', 'streak:crown', 'streak:egg', 'streak:candle'];
const STK = ['night-0', 'night-1', 'night-2', 'night-3', 'myth-0', 'myth-1', 'pencil-0', 'pencil-1'];
function rich(room) {
  const o = {}, st = {}, days = {};
  OWN.forEach((id, i) => { const sk = STK[i % STK.length]; o['c' + i] = [Date.now() - (OWN.length - i) * 60000, sk.split('-')[0], id, 'c', 0, sk]; st[sk] = 1; });
  for (let i = 0; i < 12; i++) { days[day(i)] = [3, 2]; }
  const s = { days, chn: 'Maya', tour: 1, welcome: 1, pz: { e: {}, x: {}, o, g: {}, fz: {}, st, eq: { aura: 'aura:glow', fx: 'fx:confetti', streak: 'streak:candle', title: 'week' } } };
  if (room) { s.room = room; }
  return { t: {}, l: {}, d: {}, s, r: {}, rl: {}, b: {}, m: {}, g: {}, x: {} };
}

async function student(b, data, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: { width: opt.width || width, height: 860 }, deviceScaleFactor: dir ? 2 : 1, serviceWorkers: 'block', reducedMotion: opt.reduce ? 'reduce' : 'no-preference' });
  /* the saved progress is put in place once, so a reload keeps what the page saved */
  await ctx.addInitScript(o => {
    if (o.data && !localStorage.getItem(o.key)) { localStorage.setItem(o.key, JSON.stringify(o.data)); if (o.theme) { localStorage.setItem(o.tk, o.theme); } }
    window.alert = () => { window.__bad = 1; };
  }, { data, key: KEY, theme: opt.theme || '', tk: THEME });
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g/i.test(m.text())) { errs.push('console: ' + m.text()); } });
  p.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
  const S = { ctx, p, errs };
  S.open = async h => { await p.goto(file + '#' + (h || 'room')); if (!h || h === 'room') { await p.waitForSelector('#v-room .room-room', { timeout: 15000 }); } await p.waitForTimeout(500); };
  S.text = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  S.store = async () => p.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), KEY);
  S.wide = async what => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); ok(r[0] <= r[1] + 1, 'no sideways scrolling: ' + what + ' (' + r[0] + ' in ' + r[1] + ')'); };
  S.shot = async n => { if (dir) { await p.screenshot({ path: path.join(dir, 'room-' + (opt.width || width) + '-' + n + '.png') }); } };
  /* a spot in the room; the walls are tapped in a corner, where nothing stands in front of them */
  S.spot = async id => { await p.click('.room-room [data-room-spot="' + id + '"]', id === 'walls' ? { position: { x: 6, y: 6 } } : undefined); await p.waitForTimeout(200); };
  S.chip = async id => { await p.click('#room-side [data-room-spot="' + id + '"]'); await p.waitForTimeout(200); };
  S.pick = async v => { await p.click('#room-side [data-room-pick="' + v + '"]'); await p.waitForTimeout(250); };
  S.side = async () => S.text('#room-side');
  /* the plate: the name, and the title under it (shown in capitals) */
  S.plate = async () => p.$eval('.room-plate-in', x => [...x.children].map(c => c.textContent).join(' | '));
  S.css = async name => p.evaluate(n => getComputedStyle(document.querySelector('.room-room')).getPropertyValue(n).trim(), name);
  return S;
}

(async () => {
  const b = await chromium.launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sat-room-'));

  // ---------- a new student: an empty room ----------
  const N = await student(b, null), pn = N.p;
  await N.open();
  ok((await N.text('#v-room .vtitle')) === 'My room' && (await N.text('.room-plate-in')) === 'My room', 'a new student’s room is “My room”');
  ok((await N.text('.room-hello')).includes('Your room is ready for prizes') && (await pn.getAttribute('.room-hello a', 'href')) === '#crates', 'it says where prizes come from, with a link to the crates');
  const spots = await pn.$$eval('.room-room .room-spot', a => a.map(x => [x.getAttribute('data-room-spot'), x.getAttribute('aria-label'), x.tagName]));
  ok(spots.length === 10 && spots.every(x => x[2] === 'BUTTON' && x[1]), 'ten spots, each a button with a name: ' + spots.map(x => x[0]).join(' '));
  ok(spots.find(x => x[0] === 'walls')[1] === 'Walls: Classic, the plain walls' && spots.find(x => x[0] === 's0')[1] === 'Stand 1: Empty', 'the names say what is there: ' + spots.slice(0, 3).map(x => x[1]).join(' | '));
  ok(!(await pn.$('.room-room canvas[data-room-aura]')) && !!(await pn.$('.room-room .room-sky')) && (await N.text('.room-calnum')) === '0', 'nothing on the stands, the sky in the window, and 0 on the calendar');
  await N.shot('new');
  await pn.click('#room-edit'); await pn.waitForTimeout(200);
  ok((await pn.$$('#room-side .room-spots .room-chip')).length === 9 && !!(await pn.$('.room-room.room-edit')), 'Decorate shows the nine spots that can change, and rings the room’s spots');
  await N.chip('s0');
  ok((await N.side()).includes('You have no auras or effects yet') && (await pn.getAttribute('#room-side .room-none-msg a', 'href')) === '#crates', 'a stand with nothing to put on it says so, and points to the crates');
  await N.wide('decorating an empty room');
  await pn.click('#room-save'); await pn.waitForTimeout(200);
  let sn = await N.store();
  ok(sn.s.room && sn.s.room.v === 1 && sn.s.room.st.join() === ',,' && sn.s.room.av.join() === 'violet,,,b,t2,dark' && (await N.text('.room-said')) === 'Your room is saved.', 'saving an empty room keeps it, and says so: ' + JSON.stringify(sn.s.room));
  ok(plainSave(sn, 'store'), 'everything saved is what a backup may hold');

  // ---------- a student with prizes: the room it starts with ----------
  const A = await student(b, rich(), { theme: 'prize-library' }), pa = A.p;
  await A.open();
  ok((await A.plate()) === 'Maya’s room | Week Strong', 'the plate has the name and the title on show: ' + await A.plate());
  ok((await A.css('--room-wall')) === '#FBF7EF', 'the walls are the theme the student has on (Library)');
  ok(!!(await pa.$('.room-st0 canvas[data-room-aura="glow"]')) && !!(await pa.$('.room-st1 .room-ans')) && !!(await pa.$('.room-st2 canvas[data-room-aura="horizon"]')), 'the stands start with the aura and the effect on, then the rarest prize');
  ok((await pa.$$('.room-shelf .pz-si')).length === 3 && (await pa.$$('.room-board .room-stk')).length === 6 && (await A.text('.room-calnum')) === '12', 'three trophies, six stickers, and 12 days on the calendar');
  ok(!(await A.store()).s.room, 'and nothing is saved until the student saves');
  await A.shot('start');
  // tapping a stand: its card, and its effect
  await A.spot('s1'); await pa.waitForTimeout(150);
  ok(!!(await pa.$('canvas.pz-over')), 'tapping the stand with an effect plays it');
  let side = await A.side();
  ok(side.includes('Confetti') && side.includes('Epic') && /In the Arcade crate it is 1 in \d/.test(side) && !!(await pa.$('#room-side [data-room-play="confetti"]')), 'and shows its card: name, rarity, the crate and its odds');
  await A.shot('tap');
  await pa.waitForTimeout(1900);
  ok(!(await pa.$('canvas.pz-over')), 'the effect is gone by itself');
  await A.spot('s0');
  ok((await A.side()).includes('Soft glow') && (await pa.$('.room-st0.room-on')) && !(await pa.$('.room-st1.room-on')), 'another stand shows its own card, and is the one marked');
  await pa.click('[data-room-all]'); await pa.waitForTimeout(150);
  side = await A.side();
  ok(side.includes('In my room') && side.includes('Stand 3') && side.includes('Event horizon, a Mythic aura') && side.includes('Confetti, an Epic right-answer effect') && side.includes('Candle, Crown, Dragon egg'), 'everything in the room, in words');
  await pa.focus('.room-room [data-room-spot="shelf"]'); await pa.keyboard.press('Enter'); await pa.waitForTimeout(200);
  ok((await pa.$$('#room-side .room-list li')).length === 3 && (await A.side()).includes('best streak, 12 days'), 'the keyboard opens a spot too: the shelf lists its trophies');

  // ---------- decorating ----------
  await pa.click('#room-edit'); await pa.waitForTimeout(200);
  /* on a phone the spots are one row that scrolls sideways: the one tapped in the room comes fully into view */
  const inRow = async () => pa.evaluate(() => { const row = document.querySelector('#room-side .room-spots'), c = row && row.querySelector('[aria-pressed="true"]'); if (!c) { return false; } const a = c.getBoundingClientRect(), r = row.getBoundingClientRect(); return a.left >= r.left - 1 && a.right <= r.right + 1; });
  await A.spot('me'); await pa.waitForTimeout(300);
  const meIn = await inRow();
  await A.spot('s1'); await pa.waitForTimeout(300);
  ok(meIn && await inRow(), 'a spot tapped in the room has its name in full view in the row of spots');
  await A.spot('walls');
  ok((await pa.$$('#room-side .room-tile')).length === 3, 'the walls offer Classic and the two themes owned');
  await A.pick('theme:prize-nebula');
  ok((await A.css('--room-wall')) === '#0B0820' && !!(await pa.$('.room-room.room-dark')) && !!(await pa.$('.room-view canvas[data-room-scene="living:prize-nebula"]')), 'a living theme paints the walls dark, and its scene is the view through the window');
  await A.chip('window'); await A.pick('paper:stars');
  ok(!!(await pa.$('.room-view.pz-pt-stars canvas[data-room-scene="paper:stars"]')), 'a paper becomes the view instead');
  await A.chip('s0');
  ok((await A.text('#room-side [data-room-pick="aura:horizon"] .room-tile-note')) === 'On stand 3', 'a prize already on another stand says which');
  await A.pick('aura:horizon');
  ok(!!(await pa.$('.room-st0 canvas[data-room-aura="horizon"]')) && !!(await pa.$('.room-st2 canvas[data-room-aura="glow"]')) && (await pa.getAttribute('#room-side [data-room-pick="aura:horizon"]', 'aria-pressed')) === 'true', 'choosing it moves it here, and the two stands swap');
  await A.chip('shelf'); await A.pick('streak:plant');
  ok((await A.text('.room-flash')).includes('The shelf holds three') && (await pa.$$('.room-shelf .pz-si')).length === 3, 'a full shelf says how to make room');
  await A.pick('streak:candle'); await A.pick('streak:plant');
  ok((await pa.$$('.room-shelf .pz-si')).length === 3 && (await pa.getAttribute('#room-side [data-room-pick="streak:candle"]', 'aria-pressed')) === 'false', 'a trophy taken off makes room for another');
  await A.chip('board');
  ok((await pa.$$('#room-side .room-stkb')).length === 8 && (await pa.$$('#room-side .room-stkb[aria-pressed="true"]')).length === 6, 'the board offers every sticker found, six of them on it');
  const off = await pa.$eval('#room-side .room-stkb[aria-pressed="false"]', x => x.getAttribute('data-room-pick'));
  await A.pick(off);
  ok((await A.text('.room-flash')).includes('The board holds six'), 'a full board says so too');
  const onb = await pa.$eval('#room-side .room-stkb[aria-pressed="true"]', x => x.getAttribute('data-room-pick'));
  await A.pick(onb);
  ok((await pa.$$('.room-board .room-stk')).length === 5, 'a sticker comes off the board');
  await A.chip('plate');
  await pa.fill('#room-name', 'Zoë <b>');
  ok((await A.text('.room-plate-in b')) === 'Zoe b’s room', 'the name shows on the plate as it is typed, in plain letters');
  await pa.click('#room-side [data-room-title=""]'); await pa.waitForTimeout(200);
  ok(!(await pa.$('.room-plate-in small')), 'and the title can come off');
  await A.chip('me');
  await pa.click('#room-side [data-room-color="teal"]'); await pa.click('#room-side [data-room-hat="grad"]'); await pa.waitForTimeout(200);
  ok((await pa.$eval('.room-me .room-av', s => s.innerHTML)).includes('#14B8A6') && (await pa.$eval('.room-me .room-av', s => s.innerHTML)).includes('#FACC15'), 'the figure turns teal and wears the graduation cap');
  await A.wide('decorating');
  await A.shot('decorating');
  ok(!(await A.store()).s.room, 'nothing is saved while decorating');
  await pa.click('#room-cancel'); await pa.waitForTimeout(250);
  ok((await A.css('--room-wall')) === '#FBF7EF' && !!(await pa.$('.room-st0 canvas[data-room-aura="glow"]')) && (await A.text('.room-plate-in b')) === 'Maya’s room' && !(await A.store()).s.room, 'Cancel puts everything back');
  // decorate again, and save
  await pa.click('#room-edit'); await A.spot('walls'); await A.pick('theme:prize-nebula');
  await A.chip('window'); await A.pick('paper:stars');
  await A.chip('s2'); await A.pick('fx:supernova');
  await A.chip('plate'); await pa.fill('#room-name', 'Zoë'); await pa.click('#room-side [data-room-title="week"]');
  await A.chip('me'); await pa.click('#room-side [data-room-color="pink"]'); await pa.click('#room-side [data-room-hat="phones"]');
  await pa.click('#room-save'); await pa.waitForTimeout(300);
  let sa = await A.store();
  const R = sa.s.room;
  ok(R && R.v === 1 && R.w === 'theme:prize-nebula' && R.win === 'paper:stars' && R.st.join() === 'aura:glow,fx:confetti,fx:supernova' && R.sh.join() === 'streak:candle,streak:crown,streak:egg' && R.tl === 'week' && R.av.join() === 'pink,phones,,b,t2,dark' && R.bd.length === 6, 'Save keeps the room: ' + JSON.stringify(R));
  ok(sa.s.chn === 'Zoe' && plainSave(sa, 'store'), 'the name is kept in plain letters, and the save is what a backup may hold');
  await pa.reload(); await pa.waitForSelector('#v-room .room-room', { timeout: 15000 }); await pa.waitForTimeout(300);
  ok((await A.css('--room-wall')) === '#0B0820' && !!(await pa.$('.room-st2 .room-ans')) && (await A.plate()) === 'Zoe’s room | Week Strong', 'after a reload the saved room is the one shown: ' + (await A.css('--room-wall')) + ' ' + (await A.plate()) + ' ' + !!(await pa.$('.room-st2 .room-ans')));
  await A.shot('saved');

  // ---------- a saved room holding prizes the student no longer has, and junk ----------
  const junk = { v: 1, t: 5, w: 'theme:prize-holo', win: '<img src=x onerror=alert(1)>', st: ['aura:infinity', 'fx:confetti', { a: 1 }, 'aura:glow'], sh: 'streak:plant', bd: ['night-0', 'zzz-9', '<b>x</b>', 'night-0'], tl: 'century', av: ['red<script>', 'crown'] };
  const J = await student(b, rich(junk)), pj = J.p;
  await J.open();
  ok(!(await pj.$('.room-room img')) && !(await pj.evaluate(() => window.__bad)), 'nothing in a saved room can add to the page');
  ok((await J.css('--room-wall')) === '#F3EEE4' && !!(await pj.$('.room-sky')) && (await pj.$$('.room-room canvas[data-room-aura]')).length === 0 && !!(await pj.$('.room-st1 .room-ans')), 'what is not owned leaves its spot empty; what is owned stays');
  ok((await pj.$$('.room-board .room-stk')).length === 1 && !(await pj.$('.room-plate-in small')) && (await pj.$eval('.room-me .room-av', s => s.innerHTML)).includes('#8B5CF6'), 'only real stickers, no title not earned, and the usual figure');

  // ---------- another device: the room saved last wins ----------
  const other = rich({ v: 1, t: Date.now() + 60000, w: 'theme:prize-library', win: 'paper:lined', st: ['', '', 'aura:seraph'], sh: ['streak:plant'], bd: ['myth-0'], tl: '', av: ['green', 'beanie'] });
  const bk = path.join(tmp, 'sat-sprint-backup-other.json');
  fs.writeFileSync(bk, JSON.stringify({ app: 'sat-sprint', version: 1, saved: new Date().toISOString(), theme: '', data: other }));
  await pa.goto(file + '#my-data'); await pa.waitForTimeout(500);
  await pa.setInputFiles('#bk-file', bk); await pa.waitForSelector('#bk-add'); await pa.click('#bk-add'); await pa.waitForTimeout(400);
  sa = await A.store();
  ok(sa.s.room.w === 'theme:prize-library' && sa.s.room.av.join() === 'green,beanie', 'a backup holding a room saved later brings that room');
  const once = JSON.stringify(sa.s.room);
  await pa.setInputFiles('#bk-file', bk); await pa.waitForSelector('#bk-add'); await pa.click('#bk-add'); await pa.waitForTimeout(400);
  ok(JSON.stringify((await A.store()).s.room) === once, 'adding the same file twice changes nothing');
  other.s.room.t = 10;
  fs.writeFileSync(bk, JSON.stringify({ app: 'sat-sprint', version: 1, saved: new Date().toISOString(), theme: '', data: other }));
  await pa.setInputFiles('#bk-file', bk); await pa.waitForSelector('#bk-add'); await pa.click('#bk-add'); await pa.waitForTimeout(400);
  ok(JSON.stringify((await A.store()).s.room) === once, 'and a room saved earlier does not replace a newer one');

  // ---------- reduced motion ----------
  const M = await student(b, rich(), { reduce: true }), pm = M.p;
  await M.open();
  await M.spot('s1'); await pm.waitForTimeout(250);
  ok(!(await pm.$('canvas.pz-over')) && (await M.side()).includes('Confetti'), 'with reduced motion a tapped effect does not play, and its card still shows');

  // ---------- the way in: Today, the footer, the Crates page, and Help ----------
  await pa.goto(file + '#home'); await pa.waitForTimeout(600);
  ok(!!(await pa.$('footer.foot a[href="#room"]')), 'the footer links to the room');
  /* Today's More list is there for a student with a study plan */
  const withPlan = rich(); withPlan.s.plan = { date: day(-60), mins: 15, subj: 'both' };
  const T = await student(b, withPlan);
  await T.open('home'); await T.p.waitForSelector('#tmore', { timeout: 15000 }).catch(() => {});
  ok(!!(await T.p.$('#tmore a[href="#room"]')), 'and so does the More list on Today, for a student with a plan');
  await pa.goto(file + '#crates'); await pa.waitForTimeout(600);
  ok(!!(await pa.$('#pz-collection a[href="#room"]')), 'the Crates page points to the room');
  await pa.goto(file + '#room'); await pa.waitForTimeout(500);
  await pa.click('#help-btn'); await pa.waitForTimeout(300);
  ok((await A.text('#help')).includes('Who can see my room?'), 'Help on the room page answers questions about the room');
  await pa.keyboard.press('Escape');

  // ---------- 320 px ----------
  const W = await student(b, rich(), { width: 320 }), pw = W.p;
  await W.open(); await W.wide('the room, 320 px');
  await pw.click('#room-edit'); await W.spot('s0'); await W.wide('decorating, 320 px');
  await W.chip('me'); await W.wide('the figure, 320 px');

  const errs = [N, A, J, M, T, W].flatMap(S => S.errs);
  ok(!errs.length, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails ? fails + ' failed' : 'all passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
