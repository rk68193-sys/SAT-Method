/* Run with Node: verifies practice history, pacing and evidence access without a browser. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read('src/build/' + file + '.json'));
const D = json('data');
D.reading = json('rdata');
D.bank = json('bank');
D.bank.figures = json('figures');
D.bank.grammarSources = json('grammar-sources');
const EXLIST = D.concepts.flatMap(c => c.uses.flatMap(id => D.uses[id].ex.map(q => D.ex[q])));
const store = { t: {}, r: {}, b: {}, s: {} };
const c = vm.createContext({ D, EXLIST, RLIST: D.reading.examples, RD: D.reading, store,
  isObj: x => !!x && typeof x === 'object' && !Array.isArray(x),
  rec: (bucket, id) => store[bucket][id] || null,
  median: values => { const a = values.slice().sort((a, b) => a - b); return a.length ? (a[Math.floor((a.length - 1) / 2)] + a[Math.floor(a.length / 2)]) / 2 : 0; }
});
vm.runInContext(read('src/site/practice.js'), c);
assert.equal(c.tset().tier, 'learn');
store.s.timed = { tier: 'std' };
assert.equal(c.tset().tier, 'std', 'Keep an existing clock preference');
const settings = { src: 'both', part: 'all', diff: 'all', which: 'all' };
const all = c.matching(settings);
assert.equal(all.length, 1845);
assert.equal(new Set(all.map(q => q.id)).size, 1845);

// A question answered through its worked example must not become “new” in the bank.
const worked = c.itemsAll().find(it => it.t === 'r' && c.itemsAll().some(q => q.id === it.id && q.t !== 'r'));
assert.ok(worked);
store.r[worked.id] = { c: 0, t: 95, l: 70, n: 1 };
assert.ok(!c.matching({ ...settings, which: 'new' }).some(q => q.id === worked.id));
assert.ok(c.matching({ ...settings, which: 'missed' }).some(q => q.id === worked.id));

// Untimed answers carry no numeric speed or limit, including when replacing a slow attempt.
const learned = c.practiceAttempt(store.r[worked.id], true, null, null, 'guess');
store.b[worked.id] = learned;
assert.equal(learned.t, null);
assert.equal(learned.l, null);
assert.equal(learned.mode, 'learn');
assert.equal(learned.n, 2);
assert.equal(c.overPace(learned), false);
assert.equal(c.result(worked), learned);
assert.ok(!c.matching({ ...settings, which: 'slow' }).some(q => q.id === worked.id));
assert.ok(!c.matching({ ...settings, which: 'missed' }).some(q => q.id === worked.id));
assert.ok(c.matching({ ...settings, which: 'uncertain' }).some(q => q.id === worked.id));
const record = c.practiceRecord('r', [worked.id]);
assert.equal(record.tried, 1);
assert.equal(record.right, 1);
assert.equal(record.timed, 0);
assert.equal(record.under, 0);

learned.evidence = 'Preserve the stated comparison.';
learned.cause = 'scope';
const paced = c.practiceAttempt(learned, true, 75.34, 70, 'sure');
assert.equal(paced.t, 75.3);
assert.equal(c.overPace(paced), true);
assert.equal(paced.evidence, learned.evidence, 'Do not erase a review on a repeat attempt');
assert.equal(paced.cause, 'scope');
assert.equal(c.practiceAttempt({ c: 0 }, true, 20, 60, 'skip').n, 2, 'Recognize legacy attempts without a counter');
const summary = c.practiceSummary([
  { fresh: true, ok: true, confidence: 'guess' },
  { fresh: true, ok: false, confidence: 'sure' },
  { fresh: false, ok: true, confidence: 'sure' }
]);
assert.equal(summary.firstRight, 1);
assert.equal(summary.first, 2);
assert.equal(summary.repeatRight, 1);
assert.equal(summary.repeat, 1);
assert.equal(summary.review.length, 2, 'Review a guessed correct answer as well as a miss');

// Notes must be available while answering, rather than supplied only after the key.
vm.runInContext(read('src/site/drills.js'), c);
const notes = c.drillItems('notes');
assert.equal(notes.length, D.bank.notes.length);
notes.forEach((item, i) => {
  assert.equal(item.ans, D.bank.notes[i].ans);
  D.bank.notes[i].notes.forEach(note => assert.ok(item.prompt.includes(note), 'Missing evidence before answering: ' + item.id));
});
console.log('PASS: 1,845 unique questions; cross-view history; untimed/paced results; legacy records; confidence review; retained notes; all 204 notes drills expose evidence before answering.');
