/* SAT Sprint: keeps the site, and the questions you have opened, on the device, so it opens with no connection.
   The page itself is always fetched fresh when there is a connection, so a new version of the site needs no change here.
   Change a cache's name only if the rules in this file change. Progress is not kept here: it lives in localStorage.
   v2: the page asks for each Math question file and the symbol library with the stamp of their rebuild (?v=…). The v1
   rules kept the library from the first visit and answered with it forever, so after a rebuild renumbered the symbols,
   new questions were drawn with old symbols (π as d, % as g). Renaming the caches drops everything v1 kept. */
var SHELL = 'sat-sprint-shell-v2', QS = 'sat-sprint-q-v2', FONTS = 'sat-sprint-fonts-v1';
var CORE = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon.svg'];
var ROOT = new URL('./', self.location.href).pathname;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('sat-sprint-') === 0 && [SHELL, QS, FONTS].indexOf(k) < 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* the page: the network first, and the saved copy when there is none. The page is large, so the saved copy is rewritten
   only when the server says it changed. */
function stamp(res) { return res ? (res.headers.get('etag') || res.headers.get('last-modified') || '') : ''; }
function page(req) {
  return fetch(req).then(function (res) {
    if (res && res.ok && res.type === 'basic' && !res.redirected) {
      var copy = res.clone();
      caches.open(SHELL).then(function (c) {
        return c.match('./').then(function (old) {
          if (old && stamp(old) && stamp(old) === stamp(copy)) { if (copy.body) { copy.body.cancel(); } return null; }
          return c.put('./', copy);
        });
      }).catch(function () {});
    }
    return res;
  }).catch(function () {
    return caches.open(SHELL).then(function (c) { return c.match('./'); }).then(function (hit) { return hit || Response.error(); });
  });
}
/* a stamped file (?v=…) never changes: a new rebuild has a new stamp. Keeping it replaces the copies of that file kept
   under older stamps. */
function keep(c, url, res) {
  var u = new URL(url);
  if (!u.search) { return c.put(url, res); }
  return c.delete(u.origin + u.pathname, { ignoreSearch: true }).then(function () { return c.put(url, res); });
}
/* a question file or picture: the saved copy at once, refreshed in the background unless it is stamped; anything
   opened is saved */
function asset(req, e) {
  return caches.match(req.url).then(function (hit) {
    if (hit && new URL(req.url).searchParams.get('v')) { return hit; }
    var net = fetch(req).then(function (res) {
      if (res && res.ok && res.type === 'basic') { var copy = res.clone(); caches.open(QS).then(function (c) { return keep(c, req.url, copy); }).catch(function () {}); }
      return res;
    });
    if (hit) { e.waitUntil(net.catch(function () {})); return hit; }
    return net;
  });
}
/* Google Fonts: the style sheet is refreshed in the background; a font file never changes */
function font(req, e, sheet) {
  return caches.open(FONTS).then(function (c) {
    return c.match(req.url).then(function (hit) {
      if (hit && !sheet) { return hit; }
      var net = fetch(req.url, { mode: 'cors', credentials: 'omit' }).then(function (res) {
        if (res && res.ok) { c.put(req.url, res.clone()).catch(function () {}); }
        return res;
      });
      if (hit) { e.waitUntil(net.catch(function () {})); return hit; }
      return net;
    });
  });
}
self.addEventListener('fetch', function (e) {
  var req = e.request, url;
  if (req.method !== 'GET') { return; }
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin === self.location.origin) {
    if (url.pathname.indexOf(ROOT) !== 0 || url.pathname === ROOT + 'sw.js') { return; }
    if (req.mode === 'navigate' && (url.pathname === ROOT || url.pathname === ROOT + 'index.html')) { e.respondWith(page(req)); return; }
    if (!req.headers.get('range')) { e.respondWith(asset(req, e)); }
    return;
  }
  if (url.hostname === 'fonts.googleapis.com') { e.respondWith(font(req, e, true)); }
  else if (url.hostname === 'fonts.gstatic.com') { e.respondWith(font(req, e, false)); }
});
