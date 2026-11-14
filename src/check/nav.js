/* The home page's sample question, the four-group section bar with its second row, and the Learn overviews.
   node src/check/nav.js index.html [width] [shots-folder] */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const width = Number(process.argv[3] || 390), dir = process.argv[4] || '';
  if (dir) { fs.mkdirSync(dir, { recursive: true }); }
  const browser = await chromium.launch();
  const p = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
  const errors = [], over = [], fail = [];
  const ok = (cond, what) => { if (!cond) { fail.push(what); } console.log((cond ? 'ok   ' : 'FAIL ') + what); };
  p.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g/i.test(m.text())) { errors.push('console: ' + m.text()); } });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const shot = async (n, full) => { if (dir) { await p.screenshot({ path: path.join(dir, 'nav-' + width + '-' + n + '.png'), fullPage: !!full }); } };
  const wide = async t => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (r[0] > r[1] + 1) { over.push(t + ': ' + r[0] + '>' + r[1]); } };
  const go = async t => { await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(250); };
  const text = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  const bar = async () => p.evaluate(() => ({
    top: [...document.querySelectorAll('#secin a')].map(a => a.textContent + (a.getAttribute('aria-current') ? '*' : '')).join(' | '),
    sub: document.getElementById('subnav').hidden ? '' : [...document.querySelectorAll('#subnav a')].map(a => a.textContent + (a.getAttribute('aria-current') ? '*' : '')).join(' | ')
  }));
  await p.goto(file); await p.waitForTimeout(700);

  // Home: what it costs, and a real question before anything else
  ok(['Free · no account · no paywall', 'Free · no paywall · account optional'].includes(await text('#v-home .hpill')), 'the hero says free and no paywall, with no account needed (optional when accounts are on)');
  await p.waitForSelector('#htry .mtx[data-mtx-s="d"]', { timeout: 15000 });
  ok((await p.$$('#htry .mpchoices.txt .mpch .mpch-c')).length === 4, 'a Math question is ready to answer, its choices in the buttons');
  ok((await p.$$('#v-home .hfacts li')).length === 4 && !(await p.$('#v-home .hh-stats')), 'the numbers are one strip under the hero');
  await wide('home'); await shot('home');
  await p.click('#htry .mpch[data-k="B"]'); await p.waitForTimeout(250);
  const fb = await text('#htry-fb');
  ok(/^(Correct\.|Not this time\. The answer is [A-D]\.)/.test(fb) && fb.includes('How to spot it:') && fb.includes('Watch out'), 'answering shows how to spot that kind of question');
  ok(await p.isVisible('#htry-fb a[href^="#mp-"]'), 'and leads to more like it');
  await wide('home answered'); await shot('home-math-answered', true);
  const firstQ = await p.getAttribute('#htry .mtx', 'data-mtx');
  await p.click('#htry [data-htry-next="math"]'); await p.waitForTimeout(300);
  await p.waitForSelector('#htry .mtx[data-mtx-s="d"]', { timeout: 15000 });
  ok((await p.getAttribute('#htry .mtx', 'data-mtx')) !== firstQ && !(await p.$('#htry .mpch:disabled')), '“Try another” brings a different question');
  ok(await p.evaluate(() => { const r = document.querySelector('.hh-try').getBoundingClientRect(); return r.top >= 0 && r.top < window.innerHeight - 160; }), 'and the new question is on the screen, not left above it');
  await p.click('#htry-tabs [data-htry="rw"]'); await p.waitForTimeout(300);
  ok(await p.isVisible('#htry .q .passage') && (await p.$$('#htry .opt')).length === 4, 'the Reading and Writing sample is a real grammar question');
  await p.click('#htry .opt[data-k="A"]'); await p.waitForTimeout(300);
  ok((await text('#htry')).includes('The fast path') && (await text('#htry')).includes('Run the check'), 'answering shows the method for it');
  await wide('home rw answered'); await shot('home-rw-answered', true);
  const st = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('sat-grammar-sprint.v1')); return Object.keys(s.m).length + Object.keys(s.t).length + Object.keys(s.b).length; });
  ok(st === 0, 'nothing from the samples is saved as practice');
  await p.reload(); await p.waitForTimeout(600);
  ok((await p.getAttribute('#htry-tabs [data-htry="rw"]', 'aria-pressed')) === 'true', 'the section you last tried is remembered');

  // Math: four groups; Learn has a second row
  await go('math');
  let b = await bar();
  ok(b.top === 'Start here* | Learn | Practice | My map' && b.sub === '', 'Math bar on Start here: ' + b.top);
  await shot('math-start');
  await go('m-learn'); b = await bar();
  ok(b.top === 'Start here | Learn* | Practice | My map', 'Lessons is under Learn: ' + b.top);
  ok(b.sub === 'Overview | Lessons* | Foundations | Big patterns | Expanded types | Question finder | Shortcuts | Desmos | Formulas', 'second row: ' + b.sub);
  await wide('math lessons'); await shot('math-lessons');
  for (const [t, name] of [['m-found', 'Foundations'], ['m-found-den', 'Foundations'], ['m-patterns', 'Big patterns'], ['m-study', 'Expanded types'], ['m-types', 'Question finder'], ['m-short', 'Shortcuts'], ['m-desmos', 'Desmos'], ['m-ref', 'Formulas'], ['m-nlf', 'Lessons'], ['mt-sys-count', 'Lessons'], ['md-fit', 'Desmos']]) {
    await go(t); b = await bar();
    ok(b.top.includes('Learn*') && b.sub.includes(name + '*'), t + ' → Learn › ' + name);
    await wide(t);
  }
  await go('m-practice'); b = await bar();
  ok(b.top === 'Start here | Learn | Practice* | My map' && b.sub === 'Practice* | Drills', 'Math Practice → Practice, with Drills beside it: ' + b.sub);
  await go('m-drills'); b = await bar();
  ok(b.top.includes('Practice*') && b.sub === 'Practice | Drills*', 'm-drills → Practice › Drills: ' + b.sub);
  await go('m-drill-mcount'); b = await bar();
  ok(b.sub === 'Practice | Drills*', 'a Math drill stays under Practice › Drills');
  await go('m-map'); b = await bar();
  ok(b.top.endsWith('My map*') && b.sub === '', 'My map');
  // the tab itself goes to the overview; search finds things across every section
  await p.click('#secin a[data-group="learn"]'); await p.waitForTimeout(300);
  ok((await p.evaluate(() => location.hash)) === '#m-hub' && (await bar()).sub.startsWith('Overview*'), 'the Learn tab opens the overview');
  ok((await p.$$('#v-mhub .hub-card')).length === 8, 'the overview lists the eight Math sections');
  await p.fill('#mhub-q', 'vertex'); await p.waitForTimeout(150);
  const kinds = await p.$$eval('#mhub-res .mtag', L => [...new Set(L.map(x => x.textContent))]);
  ok(kinds.length >= 3 && /results?/.test(await text('#mhub-n')), '“vertex” is found across ' + kinds.join(', '));
  await wide('math hub'); await shot('math-hub', true);
  await p.fill('#mhub-q', 'zzzz'); await p.waitForTimeout(100);
  ok((await text('#mhub-n')).startsWith('Nothing matches'), 'no match says so');
  await p.fill('#mhub-q', 'sum of the solutions'); await p.waitForTimeout(150);
  const href = await p.getAttribute('#mhub-res a', 'href');
  await p.click('#mhub-res a'); await p.waitForTimeout(300);
  ok((await p.evaluate(() => location.hash)) === href && !(await p.isVisible('#v-mhub')), 'a result opens its page (' + href + ')');

  // Reading and Writing: the same four groups
  await go('start'); b = await bar();
  ok(b.top === 'Start here* | Learn | Practice | My map' && b.sub === '', 'Reading and Writing bar on Start here');
  await go('reading'); b = await bar();
  ok(b.top.includes('Learn*') && b.sub === 'Overview | Reading* | Grammar | Look up', 'Reading is under Learn: ' + b.sub);
  for (const [t, name] of [['method', 'Grammar'], ['c8', 'Grammar'], ['lookup', 'Look up'], ['ex-3', 'Reading'], ['glossary', 'Look up']]) {
    await go(t); b = await bar();
    ok(b.top.includes('Learn*') && b.sub.includes(name + '*'), t + ' → Learn › ' + name);
    await wide(t);
  }
  await go('practice'); b = await bar();
  ok(b.top.includes('Practice*') && b.sub === 'Practice* | Drills', 'Practice and Drills share a row: ' + b.sub);
  await go('drills'); b = await bar();
  ok(b.top.includes('Practice*') && b.sub === 'Practice | Drills*', 'Drills is under Practice');
  await wide('rw drills'); await shot('rw-drills');
  await go('rw-hub');
  ok((await p.$$('#v-rwhub .hub-card')).length === 3, 'the overview lists the three Reading and Writing sections');
  await p.fill('#rwhub-q', 'semicolon'); await p.waitForTimeout(150);
  const rk = await p.$$eval('#rwhub-res .mtag', L => [...new Set(L.map(x => x.textContent))]);
  ok(rk.includes('Grammar lesson') && rk.includes('Grammar rule'), '“semicolon” finds the lesson and its rules (' + rk.join(', ') + ')');
  await p.fill('#rwhub-q', 'however'); await p.waitForTimeout(150);
  ok((await p.$$eval('#rwhub-res .mtag', L => L.map(x => x.textContent))).includes('Transition word'), '“however” finds the transition word');
  await wide('rw hub'); await shot('rw-hub', true);
  // moving between pages of a group returns to where you were, as before
  await go('ex-3'); await p.click('#subnav a[data-view="grammar"]'); await p.waitForTimeout(250);
  await p.click('#subnav a[data-view="reading"]'); await p.waitForTimeout(250);
  ok((await p.evaluate(() => location.hash)) === '#ex-3', 'a page you visited keeps your place');
  // footer and home still list every page
  await go('home');
  ok((await p.$$('#footcols nav:nth-of-type(2) a')).length === 13 &&(await text('#footcols')).includes('Learn: overview'), 'the footer lists every page, with the overview named');
  console.log(over.length ? 'OVERFLOW ' + over.join(' ; ') : 'no overflow');
  console.log(errors.length ? 'ERRORS ' + errors.join(' ; ') : 'no errors');
  console.log(fail.length ? fail.length + ' FAILED: ' + fail.join(' ; ') : 'all checks passed');
  await browser.close();
  process.exit(fail.length || errors.length || over.length ? 1 : 0);
})();
