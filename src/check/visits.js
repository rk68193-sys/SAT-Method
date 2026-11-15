// node src/check/visits.js index.html
// The visit counter (site/visits.js). The page is served as https://satsprint.org/ from this folder and the counting call is
// faked, so nothing reaches the real project. A page load counts "visit" and the page; each page shown counts once, a
// question under its kind; the request carries only the public key; no cookie, nothing kept in the browser for it; nothing
// is counted when the browser asks not to be tracked, or from a copy of the page; a failed count changes nothing on the page.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.dirname(path.resolve(process.argv[2] || 'index.html')), page = path.basename(process.argv[2] || 'index.html');
let fails = 0;
const ok = (c, what) => { if (!c) { fails++; } console.log((c ? 'ok   ' : 'FAIL ') + what); };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

async function site(b, opt) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  if (opt && opt.gpc) { await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true }); }); }
  const counted = [], heads = [], errs = [];
  /* this folder, as if it were the live site */
  await ctx.route(/^https:\/\/satsprint\.org\//, r => {
    const u = new URL(r.request().url()), rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || page;
    const f = path.join(root, rel);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { return r.fulfill({ status: 404, body: '' }); }
    return r.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  /* the counting call, faked; any other call to the project is refused */
  await ctx.route(/\/rest\/v1\/rpc\/count_visit/, r => {
    counted.push(r.request().postDataJSON().p); heads.push(r.request().headers());
    return opt && opt.fail ? r.fulfill({ status: 404, contentType: 'application/json', body: '{"code":"PGRST202"}' }) : r.fulfill({ status: 204, body: '' });
  });
  await ctx.route(/supabase\.co\/(?!rest\/v1\/rpc\/count_visit)/, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(e.message));
  return { ctx, p, counted, heads, errs };
}

(async () => {
  const b = await chromium.launch();
  {
    const t = await site(b);
    await t.p.goto('https://satsprint.org/#home'); await t.p.waitForTimeout(1200);
    ok(t.counted.join() === 'visit,home', 'opening the site counts one visit and Home: ' + t.counted.join());
    await t.p.evaluate(() => { location.hash = 'crates'; }); await t.p.waitForTimeout(400);
    /* a real question: the Reading and Writing question of the day, linked from Crates */
    const rq = await t.p.$eval('.pz-earn a[href^="#rq-"]', a => a.getAttribute('href').slice(1));
    await t.p.evaluate(h => { location.hash = h; }, rq); await t.p.waitForTimeout(400);
    await t.p.evaluate(() => { location.hash = 'm-practice'; }); await t.p.waitForTimeout(400);
    ok(t.counted.slice(2).join() === 'crates,rq,m-practice', 'each page shown counts once, a question under its kind, not its number: ' + t.counted.slice(2).join());
    await t.p.goBack(); await t.p.waitForTimeout(400);
    ok(t.counted[t.counted.length - 1] === 'rq', 'Back counts the page it returns to');
    ok(t.heads.every(h => !!h.apikey && !h.authorization && !h.cookie), 'each count carries the public key and nothing about who');
    ok((await t.ctx.cookies()).length === 0 && (await t.p.evaluate(() => document.cookie)) === '', 'no cookie');
    const kept = await t.p.evaluate(() => Object.keys(sessionStorage).concat(Object.keys(localStorage)));
    ok(kept.every(k => !/visit/i.test(k)), 'nothing kept in the browser for counting (it holds: ' + kept.join(', ') + ')');
    const n = t.counted.length;
    await t.p.reload(); await t.p.waitForTimeout(1200);
    ok(t.counted.slice(n).join() === 'visit,rq', 'a reload is a new visit: ' + t.counted.slice(n).join());
    ok(!t.errs.length, 'no script errors' + (t.errs.length ? ': ' + t.errs.join(' | ') : ''));
    await t.ctx.close();
  }
  {
    const t = await site(b, { gpc: true });
    await t.p.goto('https://satsprint.org/#home'); await t.p.waitForTimeout(1000);
    await t.p.evaluate(() => { location.hash = 'crates'; }); await t.p.waitForTimeout(300);
    ok(t.counted.length === 0, 'a browser that asks not to be tracked is never counted');
    await t.ctx.close();
  }
  {
    const t = await site(b, { fail: true });
    await t.p.goto('https://satsprint.org/#home'); await t.p.waitForTimeout(1000);
    await t.p.evaluate(() => { location.hash = 'crates'; }); await t.p.waitForTimeout(400);
    ok(t.counted.length === 3 && !t.errs.length && (await t.p.isVisible('#v-crates')), 'before the counting table exists, the site works the same and shows no error');
    await t.ctx.close();
  }
  {
    const t = await site(b);
    await t.p.goto('file://' + path.join(root, page) + '#home'); await t.p.waitForTimeout(1000);
    ok(t.counted.length === 0, 'a copy of the page (not on satsprint.org) counts nothing');
    await t.ctx.close();
  }
  await b.close();
  console.log(fails ? fails + ' FAILED' : 'all visit counter checks passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('RUN FAILED', e); process.exit(1); });
