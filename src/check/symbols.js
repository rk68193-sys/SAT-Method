/* Broken symbols in the Math questions.
   1. The files: every symbol a question draws is in the symbol library, every exponent or subscript the older
      questions set as small text stays with what it belongs to (x², 10⁸, x₁), and no character is one the export
      does not name.
   2. A device: the v1 service worker kept the symbol library from the first visit and answered with it forever, so
      after a rebuild numbered the symbols afresh, new questions came out with the wrong symbols (π as d, % as g). This
      serves the site as it was before that rebuild (git b4e166c), then as it was after it (b086afa) to show the fault,
      then this folder, where every symbol must be the right one again. Part 2 is skipped when git or those commits are
      not at hand.
   node src/check/symbols.js index.html [shots-folder] */
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const BEFORE = 'b4e166c', AFTER = 'b086afa';

const fail = [];
const ok = (cond, what) => { if (!cond) { fail.push(what); } console.log((cond ? 'ok   ' : 'FAIL ') + what); };
const body = file => JSON.parse(fs.readFileSync(file, 'utf8').match(/^SATQ\("[0-9a-f]{8}",([\s\S]*)\);\s*$/)[1]);
const library = file => {
  const defs = JSON.parse(fs.readFileSync(file, 'utf8').match(/^SATG\(([\s\S]*)\);\s*$/)[1]), out = {};
  defs.replace(/<path id="(G[0-9a-f]+)" d="([^"]+)"/g, (m, id, d) => { out[id] = d; return m; });
  return out;
};
const uses = html => (html.match(/href="#G[0-9a-f]+"/g) || []).map(h => h.slice(7, -1));
const words = html => html.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<img[^>]*>/g, ' ').replace(/<(sup|sub)>[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, '');

(async () => {
  const root = path.dirname(path.resolve(process.argv[2]));
  const mt = path.join(root, 'm', 't');
  const dir = process.argv[3] || '';
  if (dir) { fs.mkdirSync(dir, { recursive: true }); }

  /* ---------- 1. the files ---------- */
  const lib = library(path.join(mt, '_glyphs.js'));
  const files = fs.readdirSync(mt).filter(n => /^[0-9a-f]{8}\.js$/.test(n));
  let missing = [], loose = [], unnamed = [], scripts = 0;
  for (const n of files) {
    const b = body(path.join(mt, n)), parts = [b.q, b.r].concat(Object.values(b.c || {}));
    for (const h of parts) {
      for (const id of uses(h)) { if (!lib[id]) { missing.push(n + ' ' + id); } }
      // the old fault left an exponent's digits together on a line of their own: "2 2 2 2"
      if (/(^|[\s(])\d( \d){2,}([\s.,)]|$)/.test(words(h))) { loose.push(n); }
      if (/�/.test(h)) { unnamed.push(n); }
    }
    if (/<su[pb]>/.test(parts.join(''))) { scripts += 1; }
  }
  ok(files.length > 1900, files.length + ' Math questions as text, with a library of ' + Object.keys(lib).length + ' symbols');
  ok(!missing.length, 'every symbol a question draws is in the library' + (missing.length ? ': ' + missing.slice(0, 5).join(', ') : ''));
  ok(!loose.length, 'no question has exponents set apart from what they belong to' + (loose.length ? ': ' + [...new Set(loose)].slice(0, 8).join(', ') : ''));
  ok(!unnamed.length, 'no question has a character the export does not name' + (unnamed.length ? ': ' + unnamed.join(', ') : ''));
  ok(scripts >= 19, scripts + ' questions print an exponent or subscript as <sup> or <sub>');
  const r1 = body(path.join(mt, 'f89e1d6f.js')).r, r2 = body(path.join(mt, '263f9937.js')).r, r3 = body(path.join(mt, 'e9349667.js')).r;
  ok(r1.includes('x<sup>2</sup>') && r1.includes('d)<sup>2</sup>'), 'f89e1d6f: x² and (c + d)² keep their exponents');
  ok(r2.includes('10<sup>8</sup>') && r2.includes('2<sup>d – 3</sup>'), '263f9937: 10⁸ and 2 to the power d – 3 keep theirs');
  ok(r3.includes('x<sub>1</sub>') && r3.includes('y<sub>2</sub>'), 'e9349667: x₁ and y₂ keep their subscripts');

  /* ---------- 2. a device that kept an older symbol library ---------- */
  let tmp = '', have = false;
  try {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sat-symbols-'));
    for (const rev of [BEFORE, AFTER]) {
      const dir = path.join(tmp, rev);
      fs.mkdirSync(dir);
      const tar = execFileSync('git', ['-C', root, 'archive', rev, 'index.html', 'sw.js', 'manifest.webmanifest', 'icons', 'm/t'], { maxBuffer: 1 << 30 });
      execFileSync('tar', ['-x', '-C', dir], { input: tar, maxBuffer: 1 << 30 });
    }
    have = true;
  } catch (e) {
    console.log('skip the device check: ' + String(e.message || e).split('\n')[0]);
  }
  if (have) {
    let serve = path.join(tmp, BEFORE);
    const asked = [];
    const server = http.createServer((req, res) => {
      asked.push(req.url);
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel.endsWith('/')) { rel += 'index.html'; }
      const f = path.join(serve, rel);
      if (!f.startsWith(serve) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'Last-Modified': fs.statSync(f).mtime.toUTCString() });
      fs.createReadStream(f).pipe(res);
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const base = 'http://localhost:' + server.address().port + '/';
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 760, height: 900 }, deviceScaleFactor: dir ? 2 : 1 });
    const p = await ctx.newPage();
    const shot = async n => { if (dir) { await (await p.$('#v-mprac .mpcard')).screenshot({ path: path.join(dir, 'symbols-' + n + '.png') }); } };
    const go = async t => { await p.evaluate(x => { location.hash = x; }, t); await p.waitForTimeout(300); };
    /* what a question draws on the page: for each symbol, the outline the page's library holds under its name */
    const drawn = async id => {
      await go('mq-' + id);
      await p.waitForSelector('#v-mprac .mpq .mtx[data-mtx-s="d"]', { timeout: 20000 });
      return p.evaluate(() => [...document.querySelectorAll('#v-mprac .mpcard svg.mx use')].map(u => {
        const g = document.querySelector('svg.mxdefs ' + u.getAttribute('href'));
        return [u.getAttribute('href').slice(1), g ? g.getAttribute('d') : null, (u.closest('.mpch') || { dataset: {} }).dataset.k || ''];
      }));
    };
    const right = (seen, libNow) => seen.filter(([id, d]) => d === libNow[id]).length;
    const PI = '0815a5af', PCT = '022e9894';

    // before the rebuild: the v1 service worker keeps the symbol library of that time
    await p.goto(base); await p.waitForTimeout(800);
    await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForTimeout(800);
    ok(await p.evaluate(() => !!navigator.serviceWorker.controller), 'before the rebuild (' + BEFORE + '): the v1 service worker is in charge');
    await go('mq-ac472881'); await p.waitForSelector('#v-mprac .mpq .mtx[data-mtx-s="d"]', { timeout: 20000 });

    // after the rebuild, as the live site was: the old library is still the one the device answers with
    serve = path.join(tmp, AFTER);
    await p.reload(); await p.waitForTimeout(1200);
    const libAfter = library(path.join(serve, 'm/t/_glyphs.js'));
    const piId = uses(body(path.join(serve, 'm/t', PI + '.js')).c.A).pop();
    let seen = await drawn(PI);
    const piDrawn = seen.filter(s => s[2] === 'A').pop();
    await shot('fault');
    ok(piDrawn && piDrawn[1] !== libAfter[piId], 'after the rebuild (' + AFTER + '): the fault shows, π in ' + PI + ' is drawn with another symbol (' + right(seen, libAfter) + ' of ' + seen.length + ' symbols right)');

    // this folder: stamped files, new caches
    serve = root;
    asked.length = 0;
    await p.reload(); await p.waitForTimeout(1500);
    await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForTimeout(1200);
    const libNow = library(path.join(mt, '_glyphs.js'));
    const stamp = await p.evaluate(() => JSON.parse(document.getElementById('sprint-data').textContent).mathText.v);
    seen = await drawn(PI);
    const piNow = uses(body(path.join(mt, PI + '.js')).c.A).pop(), piSeen = seen.filter(s => s[2] === 'A').pop();
    ok(seen.length > 10 && right(seen, libNow) === seen.length, 'now: every symbol in ' + PI + ' is the right one (' + right(seen, libNow) + ' of ' + seen.length + ')');
    ok(piSeen && piSeen[1] === libNow[piNow], 'now: its π is π');
    await shot('fixed');
    seen = await drawn(PCT);
    const pct = Object.keys(libNow).filter(id => seen.some(s => s[0] === id));
    ok(seen.length > 5 && right(seen, libNow) === seen.length, 'now: every symbol in ' + PCT + ' (with a %) is the right one (' + right(seen, libNow) + ' of ' + seen.length + ', ' + pct.length + ' different)');
    const mtAsked = asked.filter(u => u.startsWith('/m/t/'));
    ok(mtAsked.length >= 3 && mtAsked.every(u => u.endsWith('.js?v=' + stamp)), 'now: the page asks for question files and the library with the stamp ' + stamp + ' (' + mtAsked.length + ' asked)');
    const keys = await p.evaluate(() => caches.keys());
    ok(!keys.some(k => /-v1$/.test(k) && !/fonts/.test(k)) && keys.includes('sat-sprint-q-v2'), 'now: the v1 caches are gone: ' + keys.join(', '));
    const kept = await p.evaluate(() => caches.open('sat-sprint-q-v2').then(c => c.keys()).then(k => k.map(r => r.url.replace(/^https?:\/\/[^/]+/, ''))));
    ok(kept.some(u => u === '/m/t/' + PI + '.js?v=' + stamp) && kept.some(u => u === '/m/t/_glyphs.js?v=' + stamp), 'now: the device keeps the stamped files it opened');
    // a library kept from another rebuild (another stamp) is never used, and fetching this one replaces it
    await p.evaluate(v => caches.open('sat-sprint-q-v2').then(c => c.delete('/m/t/_glyphs.js?v=' + v).then(() => c.put('/m/t/_glyphs.js?v=0000000000', new Response('SATG("");')))), stamp);
    await p.reload(); await p.waitForTimeout(1200);
    seen = await drawn(PI);
    ok(right(seen, libNow) === seen.length, 'a library kept under another stamp is never used');
    const copies = await p.evaluate(() => caches.open('sat-sprint-q-v2').then(c => c.keys()).then(k => k.filter(r => /_glyphs\.js/.test(r.url)).map(r => r.url.split('?')[1])));
    ok(copies.length === 1 && copies[0] === 'v=' + stamp, 'fetching the library again replaced the other copy: ' + copies.join(', '));
    await browser.close(); server.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(fail.length ? '\nFAILED ' + fail.length : '\nPASS');
  process.exit(fail.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
