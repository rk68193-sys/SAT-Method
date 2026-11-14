/* The guided layout: the short home page and its sample question, the four numbered steps of each subject, the guide
   bar with Back, "You are here" and Home that stays on screen, one next step at the foot of each page, the Learn
   overviews, and the text size setting.
   node src/check/nav.js index.html [width] [shots-folder] */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const file = 'file://' + path.resolve(process.argv[2]);
  const width = Number(process.argv[3] || 390), dir = process.argv[4] || '';
  const phone = width <= 820;
  if (dir) { fs.mkdirSync(dir, { recursive: true }); }
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const p = await ctx.newPage();
  const errors = [], over = [], fail = [];
  const ok = (cond, what) => { if (!cond) { fail.push(what); } console.log((cond ? 'ok   ' : 'FAIL ') + what); };
  p.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts\.g/i.test(m.text())) { errors.push('console: ' + m.text()); } });
  p.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const shot = async (n, full) => { if (dir) { await p.screenshot({ path: path.join(dir, 'nav-' + width + '-' + n + '.png'), fullPage: !!full }); } };
  const wide = async t => { const r = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); if (r[0] > r[1] + 1) { over.push(t + ': ' + r[0] + '>' + r[1]); } };
  const go = async t => { await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(250); };
  const text = async sel => ((await p.textContent(sel)) || '').replace(/\s+/g, ' ').trim();
  /* the steps, with a star on the one you are in, and the "You are here" line */
  const bar = async () => p.evaluate(() => ({
    steps: [...document.querySelectorAll('#secin a')].map(a => a.querySelector('.secn').textContent + ' ' + a.querySelector('.secw').textContent + (a.getAttribute('aria-current') ? '*' : '')).join(' | '),
    trail: [...document.querySelectorAll('#gtrail .gc')].map(c => c.textContent.replace('›', '').trim()).join(' › '),
    back: document.getElementById('guide').hidden ? '' : document.getElementById('gback').innerText.replace(/\s+/g, ' ').replace('←', '').trim()
  }));
  const inView = async sel => p.evaluate(s => { const e = document.querySelector(s); if (!e) { return false; } const r = e.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && getComputedStyle(e).display !== 'none'; }, sel);
  await p.goto(file); await p.waitForTimeout(700);

  // Home: what it is, the two subjects first, how it works, then one easy question
  ok(await text('#v-home .hpill') === 'Free · no sign-up needed', 'the hero says free, with no sign-up needed');
  ok(JSON.stringify(await p.$$eval('#v-home .hpick', a => a.map(x => x.getAttribute('href')))) === '["#start","#math"]', 'two big buttons, one for each subject');
  ok(await inView('#v-home .hpick-math'), 'both subjects are on the first screen');
  ok(await p.evaluate(() => { const h = document.getElementById('hhow'), t = document.getElementById('htry-sec'); return !!h && !!t && (h.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; }), '“How this site works” comes before the sample question');
  ok((await p.$$('#v-home a[href^="#"]')).length <= 25, 'the home page has a handful of links, not dozens (' + (await p.$$('#v-home a[href^="#"]')).length + ')');
  ok(await p.isHidden('#guide') && await p.isHidden('#nextbox') && await p.isHidden('#tabs'), 'Home has no step bar, no Back and no next-step box');
  await wide('home'); await shot('home');
  await p.click('#v-home .hnot a'); await p.waitForTimeout(400);
  ok((await p.evaluate(() => location.hash)) !== '#htry-sec' && await p.isVisible('#v-home') && await p.evaluate(() => { const r = document.getElementById('htry-sec').getBoundingClientRect(); return r.top > -5 && r.top < innerHeight / 2; }), '“Try one easy question first” scrolls to the question on the same page');
  await p.waitForSelector('#htry .mtx[data-mtx-s="d"]', { timeout: 15000 });
  ok((await p.$$('#htry .mpchoices.txt .mpch .mpch-c')).length === 4, 'a Math question is ready to answer, its choices in the buttons');
  ok(await p.evaluate(() => /Easy/.test(document.querySelector('#htry .mdiff').textContent)), 'and it is an Easy one');
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

  // Math: four numbered steps, and the guide bar says where you are
  await go('math');
  let b = await bar();
  ok(b.steps === '1 Start here* | 2 Learn | 3 Practice | 4 My progress', 'Math steps on Start here: ' + b.steps);
  ok(b.trail === 'Home › Math › Start here', 'You are here: ' + b.trail);
  ok(!(await p.$('#subnav')) && !(await p.$('#secwhat')), 'no second row of buttons and no extra box above the page');
  await shot('math-start');
  await go('m-learn'); b = await bar();
  ok(b.steps === '1 Start here | 2 Learn* | 3 Practice | 4 My progress', 'Lessons is in step 2, Learn: ' + b.steps);
  ok(b.trail === 'Home › Math › Learn › Lessons', 'You are here: ' + b.trail);
  ok(b.back === (phone && width <= 420 ? 'Back' : 'Back to Start here'), 'Back names the page you came from: ' + b.back);
  await wide('math lessons'); await shot('math-lessons');
  for (const [t, name] of [['m-found', 'Algebra basics'], ['m-found-den', 'Algebra basics'], ['m-first', 'Look for a shortcut'], ['m-first-roots', 'Look for a shortcut'], ['m-patterns', 'Big ideas'], ['m-study', 'All question types'], ['m-types', 'Find a question type'], ['m-short', 'Shortcut list'], ['m-desmos', 'Calculator tips'], ['m-ref', 'Formula sheet'], ['m-nlf', 'Lessons › Nonlinear functions'], ['mt-sys-count', 'Lessons › Systems of two linear equations'], ['md-fit', 'Calculator tips']]) {
    await go(t); b = await bar();
    ok(b.steps.includes('2 Learn*') && b.trail === 'Home › Math › Learn › ' + name, t + ' → ' + b.trail);
    await wide(t);
  }
  await go('m-practice'); b = await bar();
  ok(b.steps.includes('3 Practice*') && b.trail === 'Home › Math › Practice', 'Math practice: ' + b.trail);
  await go('m-drills'); b = await bar();
  ok(b.steps.includes('3 Practice*') && b.trail === 'Home › Math › Practice › Short exercises', 'Math exercises: ' + b.trail);
  await go('m-drill-mcount'); b = await bar();
  ok(b.trail === 'Home › Math › Practice › Short exercises', 'an exercise in progress stays under Practice');
  await go('m-map'); b = await bar();
  ok(b.steps.endsWith('4 My progress*') && b.trail === 'Home › Math › My progress', 'My progress: ' + b.trail);

  // Back: the page you came from, and Home, stay on screen while you scroll
  await go('m-learn'); await go('m-nlf'); b = await bar();
  ok(b.back === (width <= 420 ? 'Back' : 'Back to Lessons'), 'from a lesson, Back says where it goes: ' + b.back);
  await p.evaluate(() => window.scrollTo(0, 2500)); await p.waitForTimeout(200);
  ok(await inView('#gback'), 'Back is still on screen after scrolling down a long page');
  ok(phone ? await inView('.ghome') : await inView('#subj a[data-subj="home"]'), 'and so is Home');
  await shot('lesson-scrolled');
  await p.click('#gback'); await p.waitForTimeout(400);
  ok((await p.evaluate(() => location.hash)) === '#m-learn', 'Back returns to the lessons');
  // the next step at the foot of a lesson
  await go('m-nlf');
  ok((await p.getAttribute('#nextbox .nextstep-go', 'href')) === '#mp-nlf' && (await text('#nextbox .nextstep-alt')).includes('next lesson'), 'a lesson ends with one next step: practice it, or the next lesson');
  await go('m-ref');
  ok((await p.$$('#v-mref .nextstep')).length === 1 && await p.isHidden('#nextbox') && (await p.getAttribute('#v-mref .nextstep-go', 'href')) === '#m-practice', 'a page with its own next step shows only that one');
  // opened straight at a page, Back goes one level up
  const p2 = await ctx.newPage();
  await p2.goto(file + '#m-desmos'); await p2.waitForTimeout(700);
  ok((await p2.getAttribute('#gback', 'href')) === '#m-hub' && !(await p2.getAttribute('#gback', 'data-go')), 'opened straight at a page, Back goes up to Learn');
  await p2.close();

  // the Learn step opens the overview: numbered pages to start with, extras, then search
  await go('math'); await p.click('#secin a[data-group="learn"]'); await p.waitForTimeout(300);
  ok((await p.evaluate(() => location.hash)) === '#m-hub' && (await bar()).trail === 'Home › Math › Learn', 'the Learn step opens the overview');
  ok((await p.$$('#v-mhub .hub-card.hub-big')).length === 4 && (await p.$$('#v-mhub .hub-card')).length === 9, 'the overview numbers four pages to start with, then five extras');
  ok((await p.getAttribute('#v-mhub .hub-big', 'href')) === '#m-learn', 'number 1 is the lessons');
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

  // Reading and Writing: the same four steps
  await go('start'); b = await bar();
  ok(b.steps === '1 Start here* | 2 Learn | 3 Practice | 4 My progress' && b.trail === 'Home › Reading & Writing › Start here', 'Reading and Writing on Start here');
  for (const [t, name] of [['reading', 'Reading lessons'], ['lessons', 'Grammar lessons'], ['method', 'Grammar lessons › The 60-second method'], ['c8', 'Grammar lessons › Lesson 8: Subject–verb agreement'], ['lookup', 'Look up a rule'], ['ex-3', 'Reading lessons › Worked example 3'], ['job', 'Reading lessons › Step 1: Job'], ['glossary', 'Look up a rule']]) {
    await go(t); b = await bar();
    ok(b.steps.includes('2 Learn*') && b.trail === 'Home › Reading & Writing › Learn › ' + name, t + ' → ' + b.trail);
    await wide(t);
  }
  await go('practice'); b = await bar();
  ok(b.steps.includes('3 Practice*') && b.trail === 'Home › Reading & Writing › Practice', 'Reading and Writing practice');
  await go('drills'); b = await bar();
  ok(b.trail === 'Home › Reading & Writing › Practice › Short exercises', 'Reading and Writing exercises');
  await wide('rw drills'); await shot('rw-drills');
  await go('rw-hub');
  ok((await p.$$('#v-rwhub .hub-card.hub-big')).length === 3 && (await p.$$('#v-rwhub .hub-card')).length === 6, 'the overview numbers reading, grammar and words, then three extras');
  ok((await p.getAttribute('#nextbox .nextstep-go', 'href')) === '#reading', 'and its next step is the reading lessons');
  await p.fill('#rwhub-q', 'semicolon'); await p.waitForTimeout(150);
  const rk = await p.$$eval('#rwhub-res .mtag', L => [...new Set(L.map(x => x.textContent))]);
  ok(rk.includes('Grammar lesson') && rk.includes('Grammar rule'), '“semicolon” finds the lesson and its rules (' + rk.join(', ') + ')');
  await p.fill('#rwhub-q', 'however'); await p.waitForTimeout(150);
  ok((await p.$$eval('#rwhub-res .mtag', L => L.map(x => x.textContent))).includes('Transition word'), '“however” finds the transition word');
  await wide('rw hub'); await shot('rw-hub', true);
  // the reading steps lead on, one step at a time
  await go('job');
  ok((await p.getAttribute('#v-reading .nextstep-go', 'href')) === '#chunk', 'step 1 leads to step 2');

  // pages that belong to no subject: Home is not lit, and Back is there
  await go('plan');
  ok(!(await p.getAttribute('#subj a[data-subj="home"]', 'aria-current')) && (await bar()).trail === 'Home › My study plan', 'on My study plan, Home is not lit and the guide says where you are');

  // text size: three sizes, kept on this device
  await go('home');
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.click('#theme-btn'); await p.waitForTimeout(150);
  ok(await p.isVisible('#theme-pop input[name="tsize"][value="l"]') && (await p.$$('#theme-pop input[name="tsize"]')).length === 3, 'Text size offers three sizes');
  await p.click('#theme-pop .size-opt:nth-child(2)'); await p.waitForTimeout(150);
  ok((await p.evaluate(() => [document.documentElement.getAttribute('data-size'), getComputedStyle(document.documentElement).fontSize].join(' '))) === 'l 18px', 'Large makes the text bigger');
  await p.click('#theme-done'); await p.waitForTimeout(100);
  ok(await p.isHidden('#theme-pop'), 'Done closes the box');
  await wide('large text'); await shot('large-text');
  await p.reload(); await p.waitForTimeout(500);
  ok((await p.evaluate(() => document.documentElement.getAttribute('data-size'))) === 'l', 'the size is kept after a reload');
  await go('m-learn'); await wide('large text lessons');
  await go('home'); await p.click('#theme-btn'); await p.click('#theme-pop .size-opt:nth-child(1)'); await p.waitForTimeout(100);
  ok(!(await p.evaluate(() => document.documentElement.getAttribute('data-size'))), 'Normal puts it back');
  // the footer still lists every page
  ok((await p.$$('#footcols nav:nth-of-type(2) a')).length === 14 && (await text('#footcols')).includes('All topics'), 'the footer lists every Math page');
  console.log(over.length ? 'OVERFLOW ' + over.join(' ; ') : 'no overflow');
  console.log(errors.length ? 'ERRORS ' + errors.join(' ; ') : 'no errors');
  console.log(fail.length ? fail.length + ' FAILED: ' + fail.join(' ; ') : 'all checks passed');
  await browser.close();
  process.exit(fail.length || errors.length || over.length ? 1 : 0);
})();
