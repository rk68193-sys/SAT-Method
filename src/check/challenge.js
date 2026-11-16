/* Challenge a friend (site/challenge.js). In separate browsers, as separate students: a challenge made on #challenge (five
   questions, two easy, two medium and one hard, easier first), played on the ordinary practice screen; the link it makes,
   with a name, sent and copied; a friend opening it (who sent it, the score to beat, the same questions in the same order),
   the scores side by side and who won; the score sent back and opened by the sender; the student's own link and a second
   try that leaves the first score alone; a try stopped part way; broken and hostile links; a challenge made from an
   ordinary set; Reading and Writing too; what is saved (only what a backup may hold, joined from a second device without
   losing a challenge, and the same file twice changing nothing); the visit counter seeing "ch" and nothing from the link;
   and no sideways scrolling at 320 px.
   node src/check/challenge.js index.html [width] [shots-folder]   (pictures are taken at twice the pixels, to be read by people) */
const fs = require('fs'), os = require('os'), path = require('path');
const { chromium } = require('playwright');
const page = path.resolve(process.argv[2] || 'index.html'), file = 'file://' + page, root = path.dirname(page);
const width = Number(process.argv[3] || 390), dir = process.argv[4] || '';
if (dir) { fs.mkdirSync(dir, { recursive: true }); }
let fails = 0;
const ok = (c, what) => { if (!c) { fails++; } console.log((c ? 'ok   ' : 'FAIL ') + what); };
const BK_KEY = /^[\w.\-]{1,64}$/, BK_STR = /^[\w .:,+\-\/]{0,200}$/;
const KEY = 'sat-grammar-sprint.v1';

async function student(b, opt) {
  opt = opt || {};
  const ctx = await b.newContext({ viewport: { width: opt.width || width, height: 860 }, deviceScaleFactor: dir ? 2 : 1, serviceWorkers: 'block' });
  /* sending and copying are recorded instead of reaching the phone's share sheet or the clipboard */
  await ctx.addInitScript(o => {
    if (o.noShare) { try { delete Navigator.prototype.share; } catch (e) {} } else { navigator.share = d => { window.__shared = d; return Promise.resolve(); }; }
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: t => o.copyFails ? Promise.reject(new Error('blocked')) : (window.__copied = t, Promise.resolve()) } });
    if (o.copyFails) { document.execCommand = () => false; }
    window.alert = () => { window.__bad = 1; };
  }, { noShare: !!opt.noShare, copyFails: !!opt.copyFails });
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g/i.test(m.text())) { errs.push('console: ' + m.text()); } });
  p.on('dialog', d => { errs.push('dialog: ' + d.message()); d.dismiss(); });
  const S = { ctx, p, errs };
  S.go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(350); };
  S.text = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  S.store = async () => p.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), KEY);
  S.wide = async what => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); ok(r[0] <= r[1] + 1, 'no sideways scrolling: ' + what + ' (' + r[0] + ' in ' + r[1] + ')'); };
  S.shot = async (n, full) => { if (dir) { await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: path.join(dir, 'challenge-' + (opt.width || width) + '-' + n + '.png'), fullPage: !!full }); } };
  return S;
}
/* one Math question after another; pick(id) names the answer to give, else A (or 1 when it is typed); stop: how many to
   answer before pressing Stop practicing */
async function playMath(S, pick, stop) {
  const p = S.p, seen = [];
  for (let i = 0; i < 12; i++) {
    await p.waitForSelector('#v-mprac .mpcard', { timeout: 15000 });
    if (stop != null && i === stop) { await p.click('#mp-end'); break; }
    const q = await p.evaluate(() => {
      const t = document.querySelector('.mpcard .mpq [data-mtx]'), im = document.querySelector('.mpcard .mpq img');
      return { id: t ? t.getAttribute('data-mtx').split(':')[1] : ((im && im.getAttribute('src') || '').match(/([0-9a-f]{8})\.webp/) || [])[1], lvl: document.querySelector('.mpcard .mdiff').textContent.trim(), mc: !!document.querySelector('.mpch') };
    });
    const give = pick ? pick(q.id) : null;
    if (q.mc) { await p.click('.mpch[data-k="' + (give || 'A') + '"]'); } else { await p.fill('#mp-gin', give || '1'); await p.click('#mp-gform button'); }
    await p.waitForSelector('#mp-fb:not([hidden]) .mpverdict');
    q.right = q.mc ? await p.getAttribute('.mpch.right', 'data-k') : await p.evaluate(() => document.querySelector('#mp-fb .mpverdict b').textContent.split(' or ')[0].trim());
    q.good = /^Correct/.test(await S.text('#mp-fb .mpverdict'));
    seen.push(q);
    const last = /See my results/.test(await p.textContent('#mp-next'));
    await p.click('#mp-next');
    if (last) { break; }
  }
  await p.waitForTimeout(300);
  return seen;
}
/* one Reading and Writing question after another, always answering B */
async function playRW(S, stop) {
  const p = S.p, seen = [];
  for (let i = 0; i < 12; i++) {
    await p.waitForSelector('#tcard > *', { timeout: 15000 });
    if (stop != null && i === stop) { await p.click('#tend'); break; }
    await p.waitForTimeout(150);
    await p.keyboard.press('B');
    await p.waitForSelector('#tnext');
    seen.push({ id: ((await S.text('#tcard')).match(/Question ([0-9a-f]{8})/) || [])[1] });
    const last = /See my results/.test(await p.textContent('#tnext'));
    await p.click('#tnext');
    if (last) { break; }
  }
  await p.waitForTimeout(300);
  return seen;
}
const hashOf = u => u.slice(u.indexOf('#'));
function plainSave(v, at) {
  if (v === null || typeof v === 'boolean' || typeof v === 'number') { return true; }
  if (typeof v === 'string') { return BK_STR.test(v) || (console.log('  not plain: ' + at + ' = ' + v), false); }
  if (Array.isArray(v)) { return v.every((x, i) => plainSave(x, at + '.' + i)); }
  return Object.keys(v).every(k => (BK_KEY.test(k) || (console.log('  bad name: ' + at + '.' + k), false)) && plainSave(v[k], at + '.' + k));
}

(async () => {
  const b = await chromium.launch();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sat-chal-'));

  // ---------- making a challenge: Math, any topic, a mix ----------
  const A = await student(b), pa = A.p;
  await pa.goto(file + '#challenge'); await pa.waitForTimeout(700);
  ok(await A.text('#v-challenge .vtitle') === 'Challenge a friend' && await pa.isVisible('#chal-form'), 'Challenge a friend opens on its own page');
  ok((await A.text('#gtrail')).includes('Challenge a friend'), 'the guide bar says where you are: ' + await A.text('#gtrail'));
  const topics = async () => pa.$$eval('input[name="chal-t"]', a => a.map(x => x.value).join());
  ok(await topics() === 'all,alg,adv,psda,geo', 'Math topics: any, or one of the four areas');
  await pa.click('label:has(#chal-s-rw)'); await pa.waitForTimeout(150);
  ok(await topics() === 'all,cs,ii,sec,eoi', 'Reading and Writing has its own four areas');
  await pa.click('label:has(#chal-s-m)'); await pa.waitForTimeout(150);
  ok(!(await pa.isDisabled('#chal-start')) && await A.text('#chal-count') === '', 'enough questions match, so nothing to warn about');
  await A.wide('making a challenge'); await A.shot('make', true);
  await pa.click('#chal-start');
  const mine = await playMath(A);
  const ids = mine.map(x => x.id), R = mine.filter(x => x.good).length;
  ok(mine.length === 5 && new Set(ids).size === 5 && ids.every(id => /^[0-9a-f]{8}$/.test(id)), 'five different real questions: ' + ids.join(' '));
  ok(mine.map(x => x.lvl).join() === 'Easy,Easy,Medium,Medium,Hard', 'a mix is two easy, two medium and one hard, easier first: ' + mine.map(x => x.lvl).join());
  ok(await A.text('#v-mprac .eyebrow') === 'Math · Challenge' && (await A.text('#v-mprac .vtitle')) === 'You got ' + R + ' of 5 right', 'the results page says it was a challenge');
  ok((await A.text('.chal-end')).includes('Your challenge is ready') && (await A.text('.chal-end')).includes('You got ' + R + ' of 5'), 'and the challenge is ready to send');
  ok(await pa.isHidden('.chal-urlf'), 'the link itself stays out of the way until it is needed');
  const link0 = await pa.inputValue('.chal-url');
  ok(link0 === 'https://satsprint.org/#ch-m-' + R + '-' + ids.join(''), 'the link holds the subject, the score and the questions in order: ' + link0);
  await pa.fill('.chal-name', 'Maya!'); await pa.waitForTimeout(100);
  ok((await pa.inputValue('.chal-url')).endsWith('-Maya'), 'a name goes into the link as it is typed, letters only');
  await pa.click('[data-chal-send]'); await pa.waitForTimeout(250);
  const sent = await pa.evaluate(() => window.__shared);
  ok(sent && sent.url === link0 + '-Maya' && sent.text === 'I got ' + R + ' of 5 on these SAT Math questions. Can you beat me?', 'Send to a friend hands the phone the link and a short note: ' + JSON.stringify(sent));
  ok(await A.text('.chal-msg') === 'Sent. Now wait for their score.', 'and says what happens next');
  await pa.click('[data-chal-copy]'); await pa.waitForTimeout(200);
  ok(await pa.evaluate(() => window.__copied) === link0 + '-Maya' && (await A.text('.chal-msg')).startsWith('Copied.'), 'Copy the link copies it');
  await A.wide('a challenge ready to send'); await A.shot('ready');
  await pa.locator('.chal-name').blur(); await pa.waitForTimeout(100);
  let sa = await A.store();
  const K = Object.keys(sa.s.chal || {})[0], rec = K && sa.s.chal[K];
  ok(sa.s.chn === 'Maya' && rec && rec.r === R && rec.n === 5 && rec.mine === 1 && rec.q === ids.join(''), 'saved: the name, and the challenge with its first score: ' + JSON.stringify(rec));
  ok(sa.s.sets[sa.s.sets.length - 1].h === 'Challenge', 'it shows in the list of recent sets as a challenge');
  ok(ids.every(id => Array.isArray(sa.m[id])), 'every answer is saved like ordinary practice');

  // ---------- a friend opens it ----------
  const B = await student(b), pb = B.p;
  await pb.goto(file + hashOf(sent.url)); await pb.waitForTimeout(800);
  ok(await B.text('#v-challenge .vtitle') === 'Maya challenged you', 'the friend sees who sent it');
  ok((await B.text('#v-challenge .lede')).includes('Maya got ' + R + ' of 5 right') && await B.text('.chal-beat b') === R + ' of 5', 'and the score to beat');
  ok((await B.text('.chal-facts')).includes('Math') && (await B.text('.chal-facts')).includes('2 easy, 2 medium, 1 hard') && (await B.text('.chal-facts')).includes('None. Take your time.'), 'what the questions are, with no clock: ' + await B.text('.chal-facts'));
  ok((await B.text('.chal-about')).includes('free') && !(await pb.$('#tour')), 'a first-time visitor is told the site is free, and no tour gets in the way');
  await B.wide('a friend’s link'); await B.shot('landing');
  const rightOf = {}; mine.forEach(x => { rightOf[x.id] = x.right; });
  await pb.click('[data-chal-go]');
  const theirs = await playMath(B, id => rightOf[id]);
  ok(theirs.map(x => x.id).join() === ids.join(), 'the friend gets the same questions in the same order');
  ok(theirs.every(x => x.good), 'answering every one right gives 5 of 5');
  const vs = await pb.$$eval('.chal-end .chal-side', a => a.map(x => x.querySelector('.chal-who').textContent + ' ' + x.querySelector('b').textContent + (x.classList.contains('win') ? ' win' : '')));
  ok(vs.join(' | ') === 'You 5 of 5' + (R < 5 ? ' win' : '') + ' | Maya ' + R + ' of 5', 'the two scores side by side: ' + vs.join(' | '));
  ok((await B.text('.chal-verdict')) === (R < 5 ? 'You win! You got more right than Maya.' : 'It’s a tie: you both got 5 of 5.'), 'and who won: ' + await B.text('.chal-verdict'));
  await pb.fill('.chal-name', 'Sam'); await pb.click('[data-chal-send]'); await pb.waitForTimeout(250);
  const reply = await pb.evaluate(() => window.__shared);
  ok(reply && reply.url === 'https://satsprint.org/#ch-m-5-' + ids.join('') + '-Sam' && reply.text === 'I got 5 of 5 on your SAT Math challenge. Open it to see who won.', 'the friend sends their score back the same way: ' + JSON.stringify(reply));
  ok(await pb.isVisible('.chal-end [data-chal-send]') && (await B.text('.chal-end [data-chal-send]')) === 'Send it to Maya' && (await B.text('.chal-end .chal-msg')) === 'Sent. Maya will see who won.', 'the button names who it goes to, and says what happens next');
  await B.wide('the friend’s result'); await B.shot('friend-result');
  let sb = await B.store();
  ok(sb.s.chal[K] && sb.s.chal[K].r === 5 && !sb.s.chal[K].mine && JSON.stringify(sb.s.chal[K].f) === '[["Maya",' + R + ']]', 'the friend’s device keeps its score and Maya’s');
  ok(sb.s.sets[sb.s.sets.length - 1].h === 'Challenge from Maya', 'and lists the set as a challenge from Maya');

  // ---------- the score comes back ----------
  await A.go(hashOf(reply.url));
  ok(await A.text('#v-challenge .vtitle') === 'You vs Sam', 'Maya opens Sam’s link: You vs Sam');
  const vs2 = await pa.$$eval('#v-challenge .chal-side', a => a.map(x => x.querySelector('.chal-who').textContent + ' ' + x.querySelector('b').textContent));
  ok(vs2.join(' | ') === 'You ' + R + ' of 5 | Sam 5 of 5' && (await A.text('.chal-verdict')).startsWith(R < 5 ? 'Sam wins this one.' : 'It’s a tie'), 'with both scores and who won: ' + vs2.join(' | '));
  ok(!(await pa.$('#v-challenge .chal-share')) && await pa.isVisible('#v-challenge a[href^="#ch-m-' + R + '-"]'), 'her own challenge needs no score sent back; she can send it to another friend');
  sa = await A.store();
  ok(JSON.stringify(sa.s.chal[K].f) === '[["Sam",5]]', 'Sam’s score is kept with the challenge');
  await A.wide('You vs Sam'); await A.shot('vs');
  await A.go('challenge');
  ok((await A.text('.chal-hist')).includes('Math · 5 questions, made by you') && (await A.text('.chal-hist')).includes('You ' + R + ' of 5 · Sam 5 of 5'), 'Your challenges lists it: ' + await A.text('.chal-hist'));
  await pa.click('.chal-hist a'); await pa.waitForTimeout(400);
  ok(await A.text('#v-challenge .vtitle') === 'You got ' + R + ' of 5' && (await A.text('.chal-back')).includes('Sam'), 'her own challenge again: her score, the scores sent back, and the link to send');
  ok(await pa.inputValue('.chal-url') === link0 + '-Maya', 'the link is the same one');

  // a second try changes nothing in the challenge
  await pa.click('[data-chal-go]');
  await playMath(A, id => rightOf[id]);
  ok((await A.text('.chal-end')).includes('This time you got 5 of 5. Your first try, ' + R + ' of 5, is your score in this challenge.'), 'a second try says the first one counts');
  ok(await pa.inputValue('.chal-url') === link0 + '-Maya', 'and the link still carries the first score');
  sa = await A.store();
  ok(sa.s.chal[K].r === R && sa.s.chal[K].lr === 5, 'saved: first score kept, the latest try noted');

  // ---------- broken and hostile links ----------
  const C = await student(b), pc = C.p;
  for (const [h, why] of [['#ch-m-7-' + ids.join(''), 'a score above the number of questions'], ['#ch-m-3-' + ids[0] + ids[0] + ids[1], 'the same question twice'],
    ['#ch-m-3-' + ids[0] + ids[1] + '00000000', 'a question that is not on the site'], ['#ch-m-3-' + ids.join('').slice(0, 30), 'a link cut off part way'], ['#ch-rw-3-' + ids.join(''), 'Math questions under Reading and Writing']]) {
    await pc.goto(file + h); await pc.waitForTimeout(350);
    ok(await C.text('#v-challenge .vtitle') === 'This link doesn’t work' && await pc.isVisible('#v-challenge a[href="#challenge"]'), 'a broken link says so and offers to make one: ' + why);
  }
  await pc.goto(file + '#ch-m-2-' + ids.join('') + '-%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E'); await pc.waitForTimeout(400);
  ok(!(await pc.$('#v-challenge img')) && !(await pc.evaluate(() => window.__bad)) && /^[A-Za-z0-9 .\-]+ challenged you$/.test(await C.text('#v-challenge .vtitle')), 'a name with markup in it is shown as plain letters: ' + await C.text('#v-challenge .vtitle'));
  await pc.goto(file + '#ch-m-2-' + ids.join('') + '-Jos%C3%A9_Mar%C3%ADa'); await pc.waitForTimeout(400);
  ok(await C.text('#v-challenge .vtitle') === 'Jose Maria challenged you', 'accents and spaces come through as plain letters');

  // a try stopped part way does not count
  await pc.click('[data-chal-go]');
  await playMath(C, null, 2);
  ok((await C.text('.chal-end')).includes('The challenge isn’t finished') && (await C.text('.chal-end')).includes('You answered 2 of 5'), 'stopping part way says the challenge is not finished');
  ok(!Object.keys((await C.store()).s.chal || {}).length, 'and nothing is kept as a score');
  await pc.click('.chal-end [data-chal-go]'); await pc.waitForTimeout(400);
  ok((await C.text('.mpbar-pos')) === 'Question 1 of 5', 'Start the challenge again begins at question 1');

  // ---------- from an ordinary set ----------
  const D = await student(b, { noShare: true, copyFails: true }), pd = D.p;
  await pd.goto(file + '#m-practice'); await pd.waitForTimeout(500);
  ok(await pd.isVisible('#v-mprac .pway-more a[href="#challenge-m"]'), 'Math practice offers Challenge a friend');
  await D.go('m-easy');
  const easy = await playMath(D);
  ok((await D.text('.chal-offer')).includes('Challenge a friend with these') && (await D.text('.chal-offer')).includes('You got ' + easy.filter(x => x.good).length + ' of 5'), 'an ordinary set offers to send the same questions');
  await pd.click('[data-chal-from]'); await pd.waitForTimeout(250);
  ok(!(await pd.$('[data-chal-send]')) && (await D.text('.chal-share .btn')) === 'Copy the link', 'without a share sheet (a computer) there is one button, Copy the link');
  await pd.click('[data-chal-copy]'); await pd.waitForTimeout(250);
  ok(await pd.isVisible('.chal-urlf') && (await pd.inputValue('.chal-url')) === 'https://satsprint.org/#ch-m-' + easy.filter(x => x.good).length + '-' + easy.map(x => x.id).join(''), 'when copying is blocked the link is shown to copy by hand, with the questions just answered');

  // ---------- Reading and Writing ----------
  const E = await student(b), pe = E.p;
  await pe.goto(file + '#practice'); await pe.waitForTimeout(500);
  ok(await pe.isVisible('#v-practice .pway-more a[href="#challenge-rw"]'), 'Reading and Writing practice offers Challenge a friend');
  await pe.click('#v-practice .pway-more a[href="#challenge-rw"]'); await pe.waitForTimeout(400);
  ok(await pe.isChecked('#chal-s-rw'), 'and starts on Reading and Writing');
  await pe.click('#chal-start');
  const rw = await playRW(E);
  ok(rw.length === 5 && new Set(rw.map(x => x.id)).size === 5, 'five different Reading and Writing questions: ' + rw.map(x => x.id).join(' '));
  ok((await E.text('#thost .eyebrow')) === 'Challenge finished' && (await E.text('.chal-end')).includes('Your challenge is ready'), 'the results say it was a challenge, ready to send');
  ok((await pe.inputValue('.chal-url')).startsWith('https://satsprint.org/#ch-rw-'), 'its link is a Reading and Writing one');
  await E.go('rw-easy');
  await playRW(E);
  ok((await E.text('.chal-offer')).includes('Challenge a friend with these'), 'an ordinary Reading and Writing set offers it too');
  await pe.click('[data-chal-from]'); await pe.waitForTimeout(200);
  const se = await E.store();
  ok(Object.keys(se.s.chal).length === 2 && plainSave(se, 'store'), 'everything saved is what a backup may hold');

  // ---------- the same student on a second device: a backup joined, nothing lost ----------
  const extra = JSON.parse(JSON.stringify(sa.s.chal[K]));
  extra.t += 60000; extra.lt += 60000; extra.r = 0; extra.f = [['Lee', 4]];
  se.s.chal[K] = extra;
  const bk = path.join(tmp, 'sat-sprint-backup-other.json');
  fs.writeFileSync(bk, JSON.stringify({ app: 'sat-sprint', version: 1, saved: new Date().toISOString(), theme: '', data: se }));
  await A.go('my-data');
  await pa.setInputFiles('#bk-file', bk); await pa.waitForSelector('#bk-add'); await pa.click('#bk-add'); await pa.waitForTimeout(400);
  sa = await A.store();
  const ch = sa.s.chal;
  ok(Object.keys(ch).length === 3 && Object.keys(se.s.chal).every(k => ch[k]), 'adding a backup from another device keeps every challenge from both');
  ok(ch[K].r === R && ch[K].mine === 1 && ch[K].f.map(x => x[0]).sort().join() === 'Lee,Sam', 'for the same challenge: the earlier first try, and every friend’s score: ' + JSON.stringify(ch[K]));
  const once = JSON.stringify(sa.s.chal);
  await pa.setInputFiles('#bk-file', bk); await pa.waitForSelector('#bk-add'); await pa.click('#bk-add'); await pa.waitForTimeout(400);
  ok(JSON.stringify((await A.store()).s.chal) === once, 'adding the same file twice changes nothing');

  // ---------- 320 px ----------
  const W = await student(b, { width: 320 }), pw = W.p;
  await pw.goto(file + '#challenge'); await pw.waitForTimeout(500); await W.wide('making one, 320 px');
  await pw.goto(file + hashOf(sent.url)); await pw.waitForTimeout(500); await W.wide('a friend’s link, 320 px');
  await pw.click('[data-chal-go]'); await playMath(W); await W.wide('the result, 320 px');
  await W.go(hashOf(reply.url)); await W.wide('You vs Sam, 320 px');

  // ---------- the visit counter, with the site served as satsprint.org ----------
  const V = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }), counted = [];
  await V.route(/^https:\/\/satsprint\.org\//, r => {
    const u = new URL(r.request().url()), f = path.join(root, decodeURIComponent(u.pathname).replace(/^\/+/, '') || path.basename(page));
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { return r.fulfill({ status: 404, body: '' }); }
    return r.fulfill({ status: 200, contentType: /\.html$/.test(f) ? 'text/html' : /\.js$/.test(f) ? 'text/javascript' : 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await V.route(/\/rest\/v1\/rpc\/count_visit/, r => { counted.push(r.request().postDataJSON().p); return r.fulfill({ status: 204, body: '' }); });
  await V.route(/supabase\.co\/(?!rest\/v1\/rpc\/count_visit)/, r => r.abort());
  const pv = await V.newPage();
  await pv.goto('https://satsprint.org/' + hashOf(sent.url)); await pv.waitForTimeout(1200);
  ok(counted.join() === 'visit,ch', 'a challenge link counts as "ch", with no name and no questions: ' + counted.join());
  ok((await pv.evaluate(() => location.href)).endsWith(hashOf(sent.url)) && (await pv.textContent('#v-challenge .vtitle')) === 'Maya challenged you', 'and the link on the real site opens the challenge');

  const errs = [A, B, C, D, E, W].flatMap(S => S.errs);
  ok(!errs.length, 'no script errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'all challenge checks passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
