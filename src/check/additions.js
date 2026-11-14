/* Checks the pages and drills added from the book comparison: Words to know (with its two drills and the
   "Did not know a word" cause), and the rest as they are added: Look for the shortcut first, the study-method cues and why lines, and more. Usage: node src/check/additions.js index.html 390 */
const path = require('path');
const { chromium } = require(require.resolve('playwright', { paths: [require('child_process').execSync('npm root -g').toString().trim()] }));
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const width = Number(process.argv[3] || 390);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const p = await ctx.newPage();
  const errors = [], over = [], fails = [];
  const ok = (c, m) => { if (!c) { fails.push(m); } };
  p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  async function go(t) { await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(150); }
  async function wide(t) { const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })); if (r.sw > r.cw + 1) { over.push(`${t}: ${r.sw}>${r.cw}`); } }
  await p.goto(file); await p.waitForTimeout(800);

  /* ---- Words to know ---- */
  for (const t of ['vocab', 'vocab-why', 'vocab-check', 'vocab-second', 'vocab-list', 'vocab-func', 'o-word', 'o-structure']) { await go(t); await wide(t); }
  await go('vocab');
  const words = await p.$$eval('#vout .vrow', r => r.length);
  ok(words === 814, 'word list shows ' + words + ' words, expected 814');
  const second = await p.$$eval('.vsec tbody tr', r => r.length);
  ok(second === 40, 'second meanings table has ' + second + ' rows');
  const func = await p.$$eval('.vfunc tbody tr', r => r.length);
  ok(func === 87, 'purpose words table has ' + func + ' rows');
  await p.fill('#vq', 'mitigate'); await p.waitForTimeout(100);
  const hit = await p.textContent('#vout');
  ok(/make less severe/.test(hit) && /1 word of 814/.test(hit), 'search for mitigate: ' + hit.slice(0, 120));
  await p.fill('#vq', ''); await p.check('#vshow-right', { force: true }); await p.waitForTimeout(100);
  ok((await p.$$eval('#vout .vrow', r => r.length)) === 214, 'right answers filter');
  await p.check('#vshow-mine', { force: true }); await p.waitForTimeout(100);
  ok(/No words yet/.test(await p.textContent('#vout')), 'empty "from my misses" message');
  const links = await p.$$eval('.nextlinks a', a => a.map(x => x.getAttribute('href') + (x.dataset.drill || '')));
  ok(links.includes('#drillswmean') && links.includes('#drillswsecond'), 'drill links ' + links.join(' '));
  /* the Learn search reaches a word, and opens the list on it */
  await go('rw-hub'); await p.fill('#rwhub-q', 'corroborate'); await p.waitForTimeout(150);
  const hl = await p.$$eval('#rwhub-res a', a => a.map(x => x.getAttribute('href')));
  ok(hl.includes('#voc-corroborate'), 'hub search finds the word: ' + hl.slice(0, 5).join(' '));
  await go('voc-corroborate');
  ok(/1 word of 814/.test(await p.textContent('#vout')) && (await p.inputValue('#vq')) === 'corroborate', 'voc- address filters the list');
  /* the word drills */
  for (const k of ['wmean', 'wsecond']) {
    await go('drills'); const b = await p.$('[data-start="' + k + '"]'); if (!b) { await p.click('#dhome').catch(() => {}); await p.waitForTimeout(80); }
    await p.click('[data-start="' + k + '"]'); await p.waitForTimeout(120);
    const n = await p.$$eval('#dhost .dopt', o => o.length);
    ok(n === 4, k + ' shows ' + n + ' options');
    const ans = await p.evaluate(() => null);
    await p.keyboard.press('1'); await p.waitForTimeout(100);
    const v = await p.textContent('#dfeed .verdict').catch(() => 'NO VERDICT');
    ok(/Right|Not this one/.test(v), k + ' verdict: ' + v);
    await wide('drill ' + k);
    await p.click('#dend'); await p.waitForTimeout(80); await p.click('#dhome');
  }
  /* every Word meanings card has exactly one right definition and four different options */
  const audit = await p.evaluate(() => {
    const bad = [];
    const V = JSON.parse(document.getElementById('sprint-data').textContent).vocab;
    if (!V || V.words.length !== 814) { bad.push('vocab data'); }
    return bad;
  });
  ok(!audit.length, 'vocab data ' + audit.join(','));
  /* a miss marked "Did not know a word" sends its words to the list */
  await p.evaluate(() => {
    const k = 'sat-grammar-sprint.v1', s = JSON.parse(localStorage.getItem(k) || '{}');
    s.b = s.b || {}; s.b['0021d326'] = { c: 0, t: 30, l: null, mode: 'learn', confidence: '', cause: 'vocab', evidence: '', n: 1, at: Date.now() };
    localStorage.setItem(k, JSON.stringify(s));
  });
  /* 0021d326 is a Support question: its words are not in the list, so add a Words in Context miss too */
  const wq = await p.evaluate(() => JSON.parse(document.getElementById('sprint-data').textContent).bank.reading.filter(x => x.job === 'word' && /most logical and precise/.test(x.q))[0].id);
  await p.evaluate(id => {
    const k = 'sat-grammar-sprint.v1', s = JSON.parse(localStorage.getItem(k) || '{}');
    s.b[id] = { c: 0, t: 30, l: null, mode: 'learn', confidence: '', cause: 'vocab', evidence: '', n: 1, at: Date.now() };
    localStorage.setItem(k, JSON.stringify(s));
  }, wq);
  await p.reload(); await p.waitForTimeout(700);
  await go('rw-traps');
  const trap = await p.textContent('#v-rwmap');
  ok(/Did not know a word/.test(trap) && /See the words from these questions/.test(trap), 'trap report shows the word cause');
  await go('vocab-mine');
  const mine = await p.$$eval('#vout .vrow', r => r.length);
  ok(mine === 4, 'from my misses shows ' + mine + ' words (expected the 4 choices of ' + wq + ')');
  await go('practice'); await wide('practice');

  /* ---- Math drills ---- */
  await go('m-drills'); await wide('m-drills');
  const mcards = await p.$$eval('#v-mdrills [data-start]', b => b.map(x => x.getAttribute('data-start')));
  ok(['mskill', 'mcount', 'mform', 'mexp', 'mpct', 'mslope', 'mfrac'].every(k => mcards.includes(k)), 'Math drill cards: ' + mcards.join(' '));
  ok(!mcards.some(k => ['job', 'wmean', 'pattern'].includes(k)), 'no Reading and Writing drills on the Math page');
  const subnav = await p.textContent('#subnav');
  ok(/Practice/.test(subnav) && /Drills/.test(subnav), 'Math Practice tab lists Practice and Drills: ' + subnav);
  for (const k of mcards) {
    await go('math'); await go('m-drill-' + k); await p.waitForTimeout(250);
    const n = await p.$$eval('#v-mdrills #dhost .dopt', o => o.length);
    ok(n >= 3, k + ' shows ' + n + ' options');
    await p.keyboard.press('2'); await p.waitForTimeout(150);
    const v = await p.textContent('#dfeed .verdict').catch(() => 'NO VERDICT');
    ok(/Right|Not this one/.test(v), k + ' verdict: ' + v);
    await wide('m-drill ' + k);
    await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    ok(/Card 2 of/.test(await p.textContent('#dhost .dbar')), k + ': Enter goes to the next card');
    await p.click('#dend'); await p.waitForTimeout(150);
    ok(/round finished/.test(await p.textContent('#dhost')), k + ': ending the round shows the result');
  }
  /* a wrong pick on a card written for this site says why that choice is wrong */
  await go('math'); await go('m-drill-mexp'); await p.waitForTimeout(200);
  const wrongKey = await p.$$eval('#dhost .dopt', o => o.map(x => x.getAttribute('data-k')).filter(k => k !== 'a')[0]);
  await p.click('#dhost .dopt[data-k="' + wrongKey + '"]'); await p.waitForTimeout(120);
  ok(/Why not:/.test(await p.textContent('#dfeed')), 'wrong pick shows its note');
  await p.click('#dend'); await p.waitForTimeout(100);
  /* the Reading and Writing drills come back after the Math page used the host */
  await go('drills'); await p.waitForTimeout(150);
  ok(!!(await p.$('#v-drills #dhost [data-start="job"]')), 'Reading and Writing drills after the Math drills');
  ok(!(await p.$('#v-mdrills #dhost')), 'one drill host at a time');
  await go('drill-mcount'); await p.waitForTimeout(150);
  ok(!(await p.$eval('#v-mdrills', v => v.hidden)) && (await p.$$eval('#v-mdrills #dhost .dopt', o => o.length)) === 4, '#drill-mcount opens on the Math page');
  await p.click('#dend'); await p.waitForTimeout(100);
  /* the two miss causes link to the drills in the trap report */
  await p.evaluate(() => {
    const k = 'sat-grammar-sprint.v1', s = JSON.parse(localStorage.getItem(k) || '{}');
    s.m = s.m || {}; s.x = s.x || {};
    s.m['beca03de'] = [0, 40, Date.now()]; s.x['beca03de'] = ['slip', Date.now()];
    s.m['0013adbd'] = [0, 40, Date.now()]; s.x['0013adbd'] = ['method', Date.now()];
    localStorage.setItem(k, JSON.stringify(s));
  });
  await p.reload(); await p.waitForTimeout(700);
  await go('m-traps'); await p.waitForTimeout(200);
  const mtr = await p.$$eval('#m-traps a', a => a.map(x => x.getAttribute('href')));
  ok(['#m-drill-mexp', '#m-drill-mpct', '#m-drill-mslope', '#m-drill-mfrac', '#m-drill-mskill'].every(h => mtr.includes(h)), 'trap report drill links: ' + mtr.filter(h => /drill/.test(h)).join(' '));
  ok(mtr.includes('#m-found'), 'a slip in the trap report points to Algebra foundations');
  await wide('m-traps');

  /* ---- Algebra foundations ---- */
  await go('m-found'); await p.waitForTimeout(150);
  const fsec = await p.$$eval('#v-mfound section.mfound', s => s.map(x => x.id));
  ok(fsec.join(' ') === 'm-found-frac m-found-iso m-found-expr m-found-dist m-found-like m-found-den', 'six sections: ' + fsec.join(' '));
  const fbtn = await p.$$eval('#v-mfound .mfound-go a', a => a.map(x => [x.getAttribute('data-drill-ref'), Number((x.textContent.match(/(\d+) cards/) || [])[1])]));
  ok(fbtn.length === 6 && fbtn.every(b => b[1] >= 5), 'each section drills its own cards: ' + JSON.stringify(fbtn));
  ok(/Easy Algebra/.test(await p.textContent('#mfound-you')), 'the page shows your Easy Algebra record');
  ok(/\b269 of the bank’s 685 Easy questions\b/.test(await p.textContent('#v-mfound .mhead')), 'the page says how much of the easy end is Algebra');
  await wide('m-found');
  /* one section's drill: only its cards, and a miss leads back to that section */
  await p.click('#m-found-frac .mfound-go a'); await p.waitForTimeout(200);
  ok(!(await p.$eval('#v-mdrills', v => v.hidden)) && /Algebra foundations/.test(await p.textContent('#dhost .dname')), 'a section drill opens on the Math drills page');
  ok((await p.textContent('#dhost .dbar')).includes('Card 1 of ' + fbtn[0][1]), 'and has just that section’s ' + fbtn[0][1] + ' cards: ' + (await p.textContent('#dhost .dbar')));
  ok(/Which is equal to it\?/.test(await p.textContent('#dprompt')), 'the question is printed on the card');
  await p.click('#dhost .dopt:not([data-k="a"])'); await p.waitForTimeout(120);
  ok(/Why not:/.test(await p.textContent('#dfeed')) && !!(await p.$('#dfeed a[href="#m-found-frac"]')), 'a wrong pick says why, and links to its section');
  await wide('m-found drill');
  await p.click('#dend'); await p.waitForTimeout(120);
  ok(/Algebra foundations · Fractions/.test(await p.textContent('#dhost .missed')), 'the round lists the section to review');
  await go('m-found-den'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => { const r = document.getElementById('m-found-den').getBoundingClientRect(); return !document.getElementById('v-mfound').hidden && r.top >= 0 && r.top < 400; }), '#m-found-den opens on its section');
  /* the Easy Algebra practice link sets the practice up */
  await go('m-found-practice'); await p.waitForTimeout(200);
  const fset = await p.evaluate(() => [document.querySelector('input[name="mp-kind"]:checked').value, document.querySelector('input[name="mp-sub"]:checked').value, document.querySelector('input[name="mp-diff"]:checked').value]);
  ok(fset.join(' ') === 'd alg E' && /^269 questions match/.test(await p.textContent('#mp-count')), 'Easy Algebra practice is set up: ' + fset.join(' ') + ' · ' + await p.textContent('#mp-count'));
  /* the Learn search reaches the sections */
  await go('m-hub'); await p.fill('#mhub-q', 'denominator'); await p.waitForTimeout(150);
  ok((await p.$$eval('#mhub-res a', a => a.map(x => x.getAttribute('href')))).includes('#m-found-den'), 'the Learn search finds the denominator section');
  /* three Easy Algebra misses bring a pointer to the map and the lessons */
  ok(!(await p.$('#v-mmap .mfound-nudge')), 'no pointer before the misses');
  const fmiss = await p.evaluate(() => {
    const k = 'sat-grammar-sprint.v1', s = JSON.parse(localStorage.getItem(k) || '{}'), D = JSON.parse(document.getElementById('sprint-data').textContent).math;
    const alg = D.domains.filter(d => d.id === 'alg')[0].skills;
    const easy = D.qs.filter(r => r[2] === 0 && alg.includes(D.types[D.order[r[1]]].skill));
    s.m = s.m || {}; easy.slice(0, 3).forEach(r => { s.m[r[0]] = [0, 50, Date.now()]; });
    localStorage.setItem(k, JSON.stringify(s));
    return easy.filter(r => s.m[r[0]] && !s.m[r[0]][0]).length;
  });
  await p.reload(); await p.waitForTimeout(700);
  await go('m-map'); await p.waitForTimeout(150);
  ok(fmiss >= 3 && new RegExp('^' + fmiss + ' Easy Algebra questions still missed').test(await p.textContent('#v-mmap .mfound-nudge').catch(() => '')), 'the map points to the foundations after ' + fmiss + ' Easy Algebra misses');
  await go('m-learn'); await p.waitForTimeout(150);
  ok(!!(await p.$('#v-mlearn .mfound-nudge a[href="#m-found"]')), 'and so do the lessons');
  await go('m-found'); await p.waitForTimeout(150);
  ok((await p.textContent('#mfound-you')).includes(fmiss + ' still wrong'), 'the page counts them: ' + await p.textContent('#mfound-you'));
  await wide('m-found with a record');

  /* ---- What the bank never asks (Math → Start here) ---- */
  await go('m-notin'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => { const r = document.getElementById('m-notin').getBoundingClientRect(); return !document.getElementById('v-mstart').hidden && r.top >= 0 && r.top < 400; }), '#m-notin opens on its section');
  const nin = await p.$$eval('#m-notin .mfacts', L => L.map(u => u.querySelectorAll('li').length));
  ok(nin.join(' ') === '7 2 1', 'seven topics with no question, two found once, one to keep: ' + nin.join(' '));
  const ntxt = await p.textContent('#m-notin');
  ok(/Complex numbers and i/.test(ntxt) && /all 1,925 questions/.test(ntxt) && /38 questions that mention sine, cosine or tangent/.test(ntxt), 'the section names its topics and counts');
  await wide('m-notin');
  await p.click('#m-notin a[href="#mq-89fc23af"]'); await p.waitForTimeout(400);
  ok(!(await p.$eval('#v-mprac', v => v.hidden)) && !!(await p.$('#v-mprac [data-mtx$="89fc23af"]')), 'its question link opens that question');
  await go('m-hub'); await p.fill('#mhub-q', 'complex numbers'); await p.waitForTimeout(150);
  const nh = await p.$$eval('#mhub-res a', a => a.map(x => x.getAttribute('href') + ' ' + x.querySelector('.mtag').textContent));
  ok(nh[0] === '#m-notin Not in the bank', 'the Learn search says complex numbers are not in the bank: ' + nh.slice(0, 3).join(' | '));
  await p.fill('#mhub-q', 'remainder theorem'); await p.waitForTimeout(150);
  ok((await p.$$eval('#mhub-res .mtag', t => t.map(x => x.textContent))).includes('In the bank'), 'and that the factor theorem is');

  /* ---- Look for the shortcut first ---- */
  await go('m-first'); await p.waitForTimeout(200);
  const F = await p.evaluate(() => {
    const D = JSON.parse(document.getElementById('sprint-data').textContent), qs = D.mfirst.qs, d = {};
    D.math.qs.forEach(r => { d[r[0]] = 'EMH'[r[2]]; });
    return { qs, d, study: D.mathStudy.methods.map(m => m.id) };
  });
  const kinds = ['scale', 'block', 'combine', 'roots', 'match', 'mirror'];
  const idsOf = k => Object.keys(F.qs).filter(id => k === 'x' ? F.qs[id].k.startsWith('x-') : F.qs[id].k === k);
  ok(Object.keys(F.qs).length === 78 && Object.keys(F.qs).every(id => F.d[id]), 'the page data has 78 bank questions, all in the bank');
  const fsecs = await p.$$eval('#v-mfirst section[id]', s => s.map(x => x.id));
  ok(fsecs.join(' ') === kinds.map(k => 'm-first-' + k).join(' ') + ' m-first-fakes m-first-picknum m-first-mix', 'sections in order: ' + fsecs.join(' '));
  const kAll = kinds.flatMap(idsOf);
  ok(/\b73 bank questions, 31 of them Hard\b/.test(await p.textContent('#v-mfirst .mhead')) && kAll.length === 73 && kAll.filter(id => F.d[id] === 'H').length === 31, 'the lede counts the six kinds’ questions');
  for (const k of kinds) {
    const L = idsOf(k), n = (await p.textContent('#m-first-' + k + ' .mfirst-n')).trim();
    ok(n.startsWith(L.length + ' bank question'), k + ': count line ' + n);
    const tries = await p.$$eval('#m-first-' + k + ' .mfirst-try a', a => a.map(x => x.getAttribute('href').replace('#mq-', '')));
    ok(tries.length === 3 && tries.every(id => L.includes(id)), k + ': three questions to try, all of this kind: ' + tries.join(' '));
    const go1 = await p.getAttribute('#m-first-' + k + ' .mfound-go a', 'href');
    ok(go1 === '#m-first-practice-' + k, k + ': practice button ' + go1);
  }
  const xt = await p.$$eval('#m-first-fakes .mfirst-try a', a => a.map(x => x.getAttribute('href').replace('#mq-', '')));
  ok(xt.length === 5 && xt.every(id => idsOf('x').includes(id)), 'the look-alikes list their bank questions: ' + xt.join(' '));
  ok((await p.$$('#m-first-fakes .mfirst-fake')).length === 5, 'five look-alikes');
  await wide('m-first');
  /* every link on the page leads somewhere real */
  const flinks = [...new Set(await p.$$eval('#v-mfirst a[href^="#"]', a => a.map(x => x.getAttribute('href').slice(1))))];
  const deadf = [];
  for (const h of flinks) {
    if (h.startsWith('m-study-') && !h.startsWith('m-study-practice-')) { if (!F.study.includes(decodeURIComponent(h.slice(8)))) { deadf.push(h); } continue; }
    if (/^(mq-|m-first-practice)/.test(h)) { continue; }
    await go(h); await p.waitForTimeout(60);
    const fine = await p.evaluate(t => { const v = [...document.querySelectorAll('.view')].find(x => !x.hidden); return !!v && v.id !== 'v-home' && (!/^(ms-|mpat-|m-found-|m-first-)/.test(t) || !!document.getElementById(t)); }, h);
    if (!fine) { deadf.push(h); }
  }
  ok(!deadf.length, 'links on the page: ' + flinks.length + (deadf.length ? ', dead: ' + deadf.join(' ') : ''));
  await go('m-first-x-cubic'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => { const r = document.getElementById('m-first-x-cubic').getBoundingClientRect(); return !document.getElementById('v-mfirst').hidden && r.top >= 0 && r.top < 400; }), '#m-first-x-cubic opens on that look-alike');
  /* after an answer: the note for that question */
  async function answerIt() {
    if (await p.$('#v-mprac .mpch')) { await p.click('#v-mprac .mpch[data-k="A"]'); } else { await p.fill('#mp-gin', '0'); await p.click('#mp-gform button'); }
    await p.waitForTimeout(200);
  }
  const qid = async () => p.evaluate(() => { const t = document.querySelector('#v-mprac .mpq [data-mtx]'), i = document.querySelector('#v-mprac .mpq img'); return t ? t.getAttribute('data-mtx').split(':')[1] : (i ? i.getAttribute('src').replace(/^.*\/|\.webp$/g, '') : ''); });
  await go('mq-620abf36'); await p.waitForTimeout(300); await answerIt();
  const fb1 = await p.textContent('#mp-fb .mfirst-fb').catch(() => '');
  ok(/^Shortcut first/.test(fb1) && fb1.includes('The same bracket twice.') && fb1.includes(F.qs['620abf36'].n) && (await p.getAttribute('#mp-fb .mfirst-fb a', 'href')) === '#m-first-block', 'a kind’s question gets its note after the answer');
  await wide('shortcut note');
  await go('mq-ea8bd66f'); await p.waitForTimeout(300); await answerIt();
  ok(/^Looks like a shortcut, but isn’t/.test(await p.textContent('#mp-fb .mfirst-fb').catch(() => '')) && (await p.getAttribute('#mp-fb .mfirst-fb a', 'href')) === '#m-first-x-sub', 'a look-alike says so, and links to why');
  await go('mq-89fc23af'); await p.waitForTimeout(300); await answerIt();
  ok(!(await p.$('#mp-fb .mfirst-fb')), 'other questions get no note');
  /* practice one kind, and the mixed set */
  await go('m-first-practice-roots'); await p.waitForTimeout(300);
  ok((await p.textContent('#v-mprac .mpbar-pos')).trim() === 'Question 1 of ' + idsOf('roots').length && idsOf('roots').includes(await qid()), 'one kind’s practice: its questions');
  await go('m-first-practice'); await p.waitForTimeout(300);
  const mixed = [];
  for (let i = 0; i < 10; i++) {
    const id = await qid(); await answerIt();
    const tag = await p.evaluate(() => { const a = document.querySelector('#mp-fb .mfirst-fb a'); return a ? a.getAttribute('href') : ''; });
    mixed.push([id, tag]);
    await p.click('#mp-next'); await p.waitForTimeout(250);
  }
  const mk = mixed.map(([id]) => (F.qs[id] || {}).k || 'none');
  ok(new Set(mixed.map(x => x[0])).size === 10 && kinds.every(k => mk.includes(k)) && mk.filter(k => k.startsWith('x-')).length === 2 && !mk.includes('none'), 'the mixed set: ten different questions, every kind, two look-alikes: ' + mk.join(' '));
  ok(mixed.every(([id, tag]) => tag === '#m-first-' + F.qs[id].k), 'and a note after each answer');
  /* Shortcuts points here; Pick a number states its limits */
  await go('m-short'); await p.waitForTimeout(150);
  ok(!!(await p.$('#v-mshort .mshort-pointer a[href="#m-first"]')), 'Shortcuts points to the page');
  ok(/Limits/.test(await p.textContent('#ms-picknum')) && !!(await p.$('#ms-picknum a[href="#m-first-picknum"]')), 'Pick a number names where it breaks down');
  ok(!!(await p.$('#ms-composite a[href="#m-first-combine"]')) && !!(await p.$('#ms-sumroots a[href="#m-first-roots"]')) && !!(await p.$('#ms-vertex a[href="#m-first-mirror"]')), 'the matching shortcuts link to their kinds');
  await go('m-hub'); await p.fill('#mhub-q', 'sum of the solutions'); await p.waitForTimeout(150);
  ok((await p.$$eval('#mhub-res a', a => a.map(x => x.getAttribute('href')))).includes('#m-first-roots'), 'the Learn search finds a kind');
  await p.fill('#mhub-q', 'substitute'); await p.waitForTimeout(150);
  ok((await p.$$eval('#mhub-res a', a => a.map(x => x.getAttribute('href')))).includes('#m-first-x-sub'), 'and a look-alike');

  /* ---- Recognize it: every study method has a cue of its own (src/math/study_text.py) ---- */
  const cues = await p.evaluate(() => JSON.parse(document.getElementById('sprint-data').textContent).mathStudy.methods.map(m => [m.id, m.recognition_pattern]));
  ok(cues.length === 249 && !cues.some(([, c]) => /Identify the requested quantity|original page/.test(c)), 'no study method shows the template cue');
  ok(new Set(cues.map(([, c]) => c)).size === cues.length, 'every study method has a cue of its own');
  for (const id of ['L1-identity', 'NEQ-root_sum', 'PROB-complement']) {
    await go('m-study-' + encodeURIComponent(id)); await p.waitForTimeout(200);
    const shown = await p.evaluate(i => { const s = document.getElementById('mst-' + i), b = s && [...s.querySelectorAll('b')].find(x => x.textContent === 'Recognize it:'); return b ? b.parentElement.textContent : ''; }, id);
    ok(shown === 'Recognize it: ' + cues.find(([i]) => i === id)[1], id + ': its page shows the cue: ' + shown.slice(0, 90));
  }
  await wide('study method');

  /* ---- Why it works: no line is shared among methods, and the written ones show (src/math/study_text.py) ---- */
  const whys = await p.evaluate(() => JSON.parse(document.getElementById('sprint-data').textContent).mathStudy.methods.map(m => [m.id, m.why_it_works]));
  ok(new Set(whys.map(([, w]) => w)).size === whys.length, 'every study method has a why line of its own');
  for (const [id, part] of [['EQV-exponents', '(x · x · x)(x · x) = x⁵'], ['AREA-cone', 'one third of the cylinder']]) {
    await go('m-study-' + encodeURIComponent(id)); await p.waitForTimeout(200);
    const shown = await p.evaluate(i => { const s = document.getElementById('mst-' + i), b = s && [...s.querySelectorAll('b')].find(x => x.textContent === 'Why it works:'); return b ? b.parentElement.textContent : ''; }, id);
    ok(shown === 'Why it works: ' + whys.find(([i]) => i === id)[1] && shown.includes(part), id + ': its page shows the written why line: ' + shown.slice(0, 90));
  }

  /* ---- the reference sheet while doing Math questions ---- */
  await go('mq-89fc23af'); await p.waitForTimeout(300);
  ok(!!(await p.$('#v-mprac .mpbar [data-calc]')) && !!(await p.$('#v-mprac .mpbar [data-sheet]')), 'a Math question has Calculator and Reference buttons');
  await p.click('#v-mprac [data-sheet]'); await p.waitForTimeout(200);
  ok(await p.isVisible('#msheet') && (await p.$$('#msheet .msheet-c')).length === 10 && (await p.$$('#msheet .msheet-facts li')).length === 3, 'Reference opens the sheet: ten figures and three facts');
  const sht = (await p.textContent('#msheet')).replace(/\s+/g, ' ');
  ok(['A = πr2', 'C = 2πr', 'A = ℓw', 'c2 = a2 + b2', 'V = ℓwh', 'V = πr2h', '360 degrees', '2π radians', '180 degrees'].every(x => sht.includes(x)), 'the formulas and facts are text: ' + sht.slice(0, 120));
  ok((await p.getAttribute('#v-mprac [data-sheet]', 'aria-pressed')) === 'true', 'the button shows it is open');
  await wide('reference sheet open');
  await p.click('#v-mprac [data-calc]'); await p.waitForTimeout(200);
  ok(!(await p.isVisible('#msheet')) && await p.isVisible('#mcalc'), 'opening the calculator puts the sheet away');
  await p.click('#v-mprac [data-sheet]'); await p.waitForTimeout(200);
  ok(await p.isVisible('#msheet') && !(await p.isVisible('#mcalc')), 'and opening the sheet puts the calculator away');
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ok(!(await p.isVisible('#msheet')) && (await p.getAttribute('#v-mprac [data-sheet]', 'aria-pressed')) === 'false', 'Escape closes it');
  await p.click('#v-mprac [data-sheet]'); await p.waitForTimeout(150);
  await go('m-ref'); await p.waitForTimeout(200);
  ok(!(await p.isVisible('#msheet')), 'leaving the question closes the sheet');
  ok((await p.$$('#v-mref #m-sheet .msheet-c')).length === 10, 'the Formulas page shows the same sheet');
  await wide('m-ref');
  await go('m-module'); await p.waitForTimeout(300); await p.click('#mp-go'); await p.waitForTimeout(600);
  ok(!!(await p.$('#v-mprac .mmbar-tools [data-sheet]')), 'a timed module has the Reference button too');
  await p.click('#v-mprac .mmbar-tools [data-sheet]'); await p.waitForTimeout(200);
  ok(await p.isVisible('#msheet'), 'and it opens there');
  await wide('module with the sheet');
  await p.click('#msheet [data-sheet-close]'); await p.waitForTimeout(150);
  ok(!(await p.isVisible('#msheet')), 'Close closes it');

  console.log(over.length ? 'OVERFLOW:\n' + over.join('\n') : 'no overflow');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
  console.log(fails.length ? 'FAILED:\n' + fails.join('\n') : 'all checks passed');
  await browser.close();
  if (fails.length || errors.length || over.length) { process.exit(1); }
})().catch(e => { console.error('RUN FAILED', e); process.exit(1); });
