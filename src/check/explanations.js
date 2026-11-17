/* No browser needed: safe lookup, source mapping, fallback and side-effect checks. */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '../..'), read = p => fs.readFileSync(path.join(root, p), 'utf8');
const payload = JSON.parse(read('src/build/explanations.json'));
const c = vm.createContext({ D: { explanations: payload }, URLSearchParams,
  location: { hostname: 'localhost', search: '' },
  esc: s => String(s ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])),
  save: () => { throw Error('Rendering must not save'); }, noteAnswer: () => { throw Error('Rendering must not record an attempt'); }
});
vm.runInContext(read('src/site/explanations.js'), c);
assert.equal(Object.keys(payload.items).length, 3770);
assert.equal(payload.mode,'released');
for (const [key,item] of Object.entries(payload.items)) {
  const html = c.explanationHTML(item.subject, item.id, item.answer);
  assert.ok(html.includes('data-explanation="'+key+'"'), key);
  assert.ok(html.includes('Explanation written for SAT Sprint'));
  assert.ok(!html.includes('Current assessment') && !html.includes('Review judgment'));
  assert.equal(c.explanationHTML(item.subject,item.id,'incorrect'), '');
  if (item.variation) assert.ok(html.includes(item.variation.worked ? '<summary>See a variation and its reasoning</summary>' : '<summary>Show the answer</summary>'));
  if (item.source) {
    const source=c.explanationSourceHTML(item.subject,item.id,item.answer);
    assert.ok(source.includes('data-explanation-source="'+key+'"'),key+' repaired source');
    if(item.source.kind==='editorial')assert.ok(source.includes('editorial correction'));
  }
}
const item = payload.items['m:c943acba'];
for (const host of ['localhost','127.0.0.1','[::1]','satsprint.org','www.satsprint.org','rk68193-sys.github.io']) {
  c.location.hostname=host;assert.ok(c.explanationFor('m',item.id,item.answer),host);
}
for (const host of ['example.com','localhost.example.com','satsprint.org.example.com','']) {
  c.location.hostname=host;assert.equal(c.explanationHTML('m',item.id,item.answer),'',host);
}
c.location.hostname='satsprint.org';payload.mode='local-pilot';assert.equal(c.explanationFor('m',item.id,item.answer),null);payload.mode='released';
c.location.hostname='localhost';payload.mode='unknown';assert.equal(c.explanationFor('m',item.id,item.answer),null);payload.mode='released';
c.location.hostname='127.0.0.1';c.location.search='?explanations=off';assert.equal(c.explanationFor('m',item.id,item.answer),null);
c.location.search='';payload.enabled=false;assert.equal(c.explanationFor('m',item.id,item.answer),null);payload.enabled=true;
assert.ok(c.explanationFor('m','4e18fc5d','A').source);assert.ok(c.explanationFor('rw','3a2d77d7','D').source);
assert.equal(c.explanationFor('m','00000000','A'),null);
assert.equal(c.explanationText('<img src=x onerror=alert(1)> **safe**'),'&lt;img src=x onerror=alert(1)&gt; <strong>safe</strong>');
const before=JSON.stringify(payload);for(let i=0;i<10;i++) c.explanationHTML('m',item.id,item.answer);assert.equal(JSON.stringify(payload),before);
// Every occurrence of an ID, including both presentations of the 25 duplicates, maps to its own key.
const json=n=>JSON.parse(read('src/build/'+n+'.json')), D=json('data');D.reading=json('rdata');D.bank=json('bank');D.bank.figures=json('figures');D.bank.grammarSources=json('grammar-sources');
let occurrences=0;const ids=new Map();
function mapped(subject,id,answer){assert.ok(c.explanationFor(subject,id,answer),subject+':'+id);occurrences++;ids.set(subject+':'+id,(ids.get(subject+':'+id)||0)+1);}
Object.values(D.ex).forEach(q=>mapped('rw',q.q,q.a));D.reading.examples.forEach(q=>mapped('rw',q.qid,q.ans));
for(const k of ['reading','notes','trans','figures','grammarSources'])D.bank[k].forEach(q=>mapped('rw',q.id,q.ans));
json('mdata').qs.forEach(q=>mapped('m',q[0],q[4]));
assert.equal(ids.size,3770);assert.equal([...ids.values()].filter(n=>n>1).length,25);assert.equal(occurrences,3795);
const hostile=payload.items['rw:265e7f4c'].source.blocks[0][0], oldText=hostile.text;
hostile.text='<img src=x onerror=alert(1)>';assert.ok(c.explanationSourceHTML('rw','265e7f4c','D').includes('&lt;img'));hostile.text=oldText;
console.log('PASS: 3,770 IDs, 3,795 source occurrences, 25 duplicates, 11 source resolutions, feature/key guards, escaping, variations and pure rendering.');
