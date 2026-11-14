  /* =================== Both subjects: what is saved on this device, a backup file, and offline use =================== */
  /* A backup is one file: { app: 'sat-sprint', version, saved, theme, data: the whole store }. Nothing is sent anywhere. */
  var BK_APP = 'sat-sprint', BK_VER = 1, BK_MAX = 12 * 1024 * 1024;
  var BK_KEY = /^[\w.\-]{1,64}$/, BK_STR = /^[\w .:,+\-\/]{0,200}$/;
  /* the only places a backup may hold free text, and how long it may be; each of these is escaped wherever it is shown */
  function bkFree(path) {
    if (path.length === 2 && path[0] === 's' && path[1] === 'notes') { return 10000; }
    if (path.length === 3 && path[0] === 'g') { return 2000; }
    if (path.length === 3 && /^[trb]$/.test(path[0]) && path[2] === 'evidence') { return 800; }
    return 0;
  }
  /* a file can come from anywhere, so nothing in it is trusted: plain values only, short plain strings, ordinary names */
  function bkClean(v, path) {
    if (v === null || typeof v === 'boolean') { return v; }
    if (typeof v === 'number') { return isFinite(v) ? v : 0; }
    if (typeof v === 'string') { var free = bkFree(path); return free ? v.slice(0, free) : BK_STR.test(v) ? v : ''; }
    if (typeof v !== 'object' || path.length > 7) { return null; }
    if (Array.isArray(v)) { return v.slice(0, 5000).map(function (x, i) { return bkClean(x, path.concat(String(i))); }); }
    var out = {};
    Object.keys(v).forEach(function (k) { if (BK_KEY.test(k) && k !== '__proto__' && k !== 'constructor' && k !== 'prototype') { out[k] = bkClean(v[k], path.concat(k)); } });
    return out;
  }
  function bkParse(text) {
    var o;
    try { o = JSON.parse(text); } catch (e) { return { err: 'That file could not be read. Choose a file this site made: its name starts with “sat-sprint-backup”.' }; }
    if (!isObj(o) || o.app !== BK_APP || !isObj(o.data)) { return { err: 'That file is not a SAT Sprint backup. Its name should start with “sat-sprint-backup”.' }; }
    if (typeof o.version === 'number' && o.version > BK_VER) { return { err: 'That backup was made by a newer version of this site. Reload this page, then try again.' }; }
    var data = {};
    Object.keys(store).forEach(function (k) { var c = bkClean(o.data[k], [k]); data[k] = isObj(c) ? c : {}; });
    var theme = THEMES.filter(function (t) { return t[0] === o.theme; }).length ? o.theme : '';
    return { data: data, saved: typeof o.saved === 'string' ? Date.parse(o.saved) : NaN, theme: theme };
  }
  function bkCount(d) {
    var m = 0, rw = {}, days = isObj(d.s) && isObj(d.s.days) ? d.s.days : daysFrom(d);
    Object.keys(isObj(d.m) ? d.m : {}).forEach(function (id) { if (Array.isArray(d.m[id]) && MQBY[id]) { m += 1; } });
    rwItems();
    ['t', 'r', 'b'].forEach(function (b) { Object.keys(isObj(d[b]) ? d[b] : {}).forEach(function (id) { if (isObj(d[b][id]) && RWIT[id]) { rw[id] = 1; } }); });
    return { m: m, rw: Object.keys(rw).length, days: Object.keys(days).filter(function (k) { var r = days[k]; return Array.isArray(r) && (r[0] || 0) + (r[1] || 0) > 0; }).length };
  }
  function bkCountText(c) { return plural(c.m, 'Math answer') + ', ' + plural(c.rw, 'Reading &amp; Writing answer') + ', ' + plural(c.days, 'day') + ' with practice'; }

  /* ---------- adding a backup to what is here: for each question the newer attempt stays ---------- */
  function bkNewer(a, b, at) {
    var out = {};
    Object.keys(a).forEach(function (k) { out[k] = a[k]; });
    Object.keys(b).forEach(function (k) { if (!has(out, k) || at(b[k]) > at(out[k])) { out[k] = b[k]; } });
    return out;
  }
  function bkUnion(under, over) {
    var out = {};
    Object.keys(under).forEach(function (k) { out[k] = under[k]; });
    Object.keys(over).forEach(function (k) { out[k] = over[k]; });
    return out;
  }
  /* when a question was last answered in one set of saved answers */
  function bkAt(d, subj, id) {
    if (subj === 'm') { var r = d.m[id]; return Array.isArray(r) && typeof r[2] === 'number' ? r[2] : 0; }
    var at = 0;
    ['t', 'r', 'b'].forEach(function (b) { var x = d[b][id]; if (isObj(x) && typeof x.at === 'number' && x.at > at) { at = x.at; } });
    return at;
  }
  function bkMerge(cur, inc) {
    var out = {}, cs = cur.s, is = inc.s;
    out.m = bkNewer(cur.m, inc.m, function (r) { return Array.isArray(r) ? r[2] || 0 : -1; });
    out.x = bkNewer(cur.x, inc.x, function (r) { return Array.isArray(r) ? r[1] || 0 : -1; });
    ['t', 'r', 'b'].forEach(function (b) { out[b] = bkNewer(cur[b], inc[b], function (r) { return isObj(r) ? r.at || 0 : -1; }); });
    /* lessons read, drills, suggestions, settings and the plan: both sets, and what is here stays where they differ */
    ['l', 'rl', 'd', 'g'].forEach(function (b) { out[b] = bkUnion(inc[b], cur[b]); });
    var s = bkUnion(is, cs);
    /* days: the larger count for each day, so the same backup added twice changes nothing */
    var da = isObj(cs.days) ? cs.days : daysFrom(cur), db = isObj(is.days) ? is.days : daysFrom(inc), days = {};
    Object.keys(da).concat(Object.keys(db)).forEach(function (k) {
      var p = Array.isArray(da[k]) ? da[k] : [0, 0], q = Array.isArray(db[k]) ? db[k] : [0, 0];
      if (!isNaN(parseDay(k))) { days[k] = [Math.max(p[0] || 0, q[0] || 0), Math.max(p[1] || 0, q[1] || 0)]; }
    });
    s.days = days;
    /* a question's next repeat comes from the side that answered it last */
    var sr = { m: {}, rw: {} };
    ['m', 'rw'].forEach(function (subj) {
      var a = isObj(cs.sr) && isObj(cs.sr[subj]) ? cs.sr[subj] : {}, b = isObj(is.sr) && isObj(is.sr[subj]) ? is.sr[subj] : {};
      Object.keys(bkUnion(a, b)).forEach(function (id) {
        var from = bkAt(inc, subj, id) > bkAt(cur, subj, id) ? b : a;
        if (Array.isArray(from[id])) { sr[subj][id] = from[id]; }
      });
    });
    s.sr = sr;
    ['modules', 'rwmodules'].forEach(function (k) {
      var seen = {}, all = (Array.isArray(cs[k]) ? cs[k] : []).concat(Array.isArray(is[k]) ? is[k] : []).filter(function (r) { if (!isObj(r) || seen[r.t]) { return false; } seen[r.t] = 1; return true; });
      if (all.length) { s[k] = all.sort(function (p, q) { return (p.t || 0) - (q.t || 0); }).slice(-20); }
    });
    var dg = {};
    ['m', 'rw'].forEach(function (subj) {
      var a = isObj(cs.diag) ? cs.diag[subj] : null, b = isObj(is.diag) ? is.diag[subj] : null, pick = isObj(a) && isObj(b) ? ((b.t || 0) > (a.t || 0) ? b : a) : isObj(a) ? a : b;
      if (isObj(pick)) { dg[subj] = pick; }
    });
    s.diag = dg;
    var na = typeof cs.notes === 'string' ? cs.notes.trim() : '', nb = typeof is.notes === 'string' ? is.notes.trim() : '';
    s.notes = !nb || na === nb || na.indexOf(nb) >= 0 ? na : !na ? nb : (na + '\n\n' + nb).slice(0, 10000);
    out.s = s;
    return out;
  }
  function bkApply(data, theme) {
    Object.keys(store).forEach(function (k) { store[k] = isObj(data[k]) ? data[k] : {}; });
    save();
    if (theme) { setTheme(theme); }
  }

  /* ---------- making the file ---------- */
  function bkBody() { return JSON.stringify({ app: BK_APP, version: BK_VER, saved: new Date().toISOString(), theme: getTheme(), data: store }); }
  function bkName(ext) { return 'sat-sprint-backup-' + dayKey(Date.now()) + '.' + ext; }
  function bkMark() { store.s.bk = Date.now(); save(); }
  function bkDownload() {
    bkMark();
    var url = URL.createObjectURL(new Blob([bkBody()], { type: 'application/json' })), a = document.createElement('a');
    a.href = url; a.download = bkName('json'); a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.parentNode.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  /* phones: hand the file to the share sheet (mail, a drive, Files). A plain-text file is the kind every share sheet takes. */
  function bkShareFile() { try { return new File([bkBody()], bkName('txt'), { type: 'text/plain' }); } catch (e) { return null; } }
  function bkCanShare() { try { var f = bkShareFile(); return !!f && !!navigator.canShare && navigator.canShare({ files: [f] }); } catch (e) { return false; } }
  function bkAgo() {
    var t = typeof store.s.bk === 'number' ? store.s.bk : 0;
    if (!t) { return 'You have not made a backup on this device yet.'; }
    var n = dayNo(Date.now()) - dayNo(t);
    return 'Last backup: ' + (n <= 0 ? 'today' : n === 1 ? 'yesterday' : n + ' days ago') + '.';
  }
  /* one line for the pages that show results */
  function dataLineHTML() {
    return '<p class="data-line"><span class="muted">' + (acctIn() ? 'Saved in this browser and in your account.' : canStore ? 'Saved in this browser only.' : 'This browser is not saving your progress.') + '</span> ' + acctLinkHTML() + '<a href="#my-data">Back up my progress</a> · <a href="#my-data-offline">Use it offline</a></p>';
  }

  /* ---------- offline: the site as an app, and the questions kept on the device ---------- */
  var PWA_OK = 'serviceWorker' in navigator && !!window.caches && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  var PWA_Q = 'sat-sprint-q-v1', pwaPrompt = null, offRun = null;
  if (PWA_OK) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pwaPrompt = e; if (cur.view === 'data') { offDraw(); } });
    window.addEventListener('appinstalled', function () { pwaPrompt = null; if (cur.view === 'data') { offDraw(); } });
  }
  function pwaStandalone() { try { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } }
  /* every file a question needs that is not already inside the page */
  function offList() {
    var out = ['m/t/_glyphs.js'], seen = {};
    MQ.forEach(function (q) {
      if (MTXT.on && !MTX_HELD[q.id]) { out.push('m/t/' + q.id + '.js'); return; }
      out.push('m/q/' + q.id + '.webp', 'm/r/' + q.id + '.webp');
      if (q.qnw) { out.push('m/qn/' + q.id + '.webp'); }
      if (q.rnw) { out.push('m/rn/' + q.id + '.webp'); }
    });
    (document.getElementById('sprint-data').textContent.match(/rw\/f\/[\w\-]+\.webp/g) || []).forEach(function (u) { if (!seen[u]) { seen[u] = 1; out.push(u); } });
    rwItems().forEach(function (it) { var b = it.b; if (b && b.qsrc && !b.txt && !seen[b.qsrc]) { seen[b.qsrc] = 1; out.push(b.qsrc); if (b.rsrc) { out.push(b.rsrc); } } });
    return out;
  }
  function offHave(list) {
    return caches.open(PWA_Q).then(function (c) { return c.keys(); }).then(function (keys) {
      var have = {}, n = 0;
      keys.forEach(function (r) { have[r.url] = 1; });
      list.forEach(function (u) { if (have[new URL(u, location.href).href]) { n += 1; } });
      return n;
    });
  }
  function offSaveAll() {
    if (offRun) { return; }
    var list = offList(), run = offRun = { done: 0, failed: 0, of: list.length, full: false, stop: false }, i = 0;
    if (navigator.storage && navigator.storage.persist) { try { navigator.storage.persist().catch(function () {}); } catch (e) {} }
    offDraw();
    caches.open(PWA_Q).then(function (cache) {
      function next() {
        if (i >= list.length || run.stop) { return Promise.resolve(); }
        var u = list[i++];
        return cache.match(u).then(function (hit) {
          return hit || fetch(u).then(function (res) { if (!res.ok) { throw new Error('missing'); } return cache.put(u, res); });
        }).then(function () { run.done += 1; }, function (err) {
          run.failed += 1;
          if (err && err.name === 'QuotaExceededError') { run.full = true; run.stop = true; }
          if (navigator.onLine === false) { run.stop = true; }
        }).then(function () { offTick(run); return next(); });
      }
      var lanes = [];
      for (var k = 0; k < 6; k += 1) { lanes.push(next()); }
      return Promise.all(lanes);
    }).then(function () { offRun = null; offDraw(run); }, function () { offRun = null; run.failed += 1; offDraw(run); });
  }
  function offTick(run) {
    var bar = document.getElementById('off-bar'), st = document.getElementById('off-st');
    if (bar) { bar.value = run.done + run.failed; }
    if (st) { st.textContent = 'Saving ' + mfmt(run.done + run.failed) + ' of ' + mfmt(run.of) + ' files…'; }
  }
  function offDraw(last) {
    var host = document.getElementById('off-box');
    if (!host) { return; }
    if (location.protocol === 'file:') {
      host.innerHTML = '<p class="note">You opened this site from a folder on this device, so it already works with no connection. Only the Desmos calculator and the web fonts need the internet.</p>';
      return;
    }
    if (!PWA_OK) { host.innerHTML = '<p class="note">This browser cannot keep the site for use without a connection. Try a current version of Chrome, Edge, Safari or Firefox.</p>'; return; }
    var install = pwaStandalone()
      ? '<p class="off-ok"><b>Installed.</b> You are using the app.</p>'
      : (pwaPrompt ? '<p class="row"><button class="btn" type="button" id="off-install">Install SAT Sprint</button><span class="muted">Adds it to your home screen or apps. No store, no account.</span></p>' : '') +
        '<details class="off-how"' + (pwaPrompt ? '' : ' open') + '><summary>How to add it to your home screen</summary><ul class="plainlist">' +
          '<li><b>iPhone or iPad (Safari):</b> tap Share, then “Add to Home Screen”.</li>' +
          '<li><b>Android (Chrome):</b> open the ⋮ menu, then “Add to Home screen” or “Install app”.</li>' +
          '<li><b>Computer (Chrome or Edge):</b> use the install icon at the right of the address bar.</li></ul></details>';
    var list = offList();
    host.innerHTML = '<div class="off-grid">' +
      '<div class="off-card"><h4>1 · The site</h4><p>Lessons, methods, every Reading &amp; Writing passage and your progress are saved on this device the first time you open the site online. After that it opens with no connection.</p>' + install + '</div>' +
      '<div class="off-card"><h4>2 · The questions</h4><p>Each Math question, and each Reading &amp; Writing table or graph, is a small file. The ones you open are kept as you go. To have all ' + mfmt(list.length) + ' on this device, save them once while you are online: about 32 MB.</p>' +
        (offRun
          ? '<progress id="off-bar" max="' + offRun.of + '" value="' + (offRun.done + offRun.failed) + '" aria-label="Saving questions for offline use"></progress><p class="fine" id="off-st" aria-live="polite">Saving ' + mfmt(offRun.done + offRun.failed) + ' of ' + mfmt(offRun.of) + ' files…</p>'
          : '<p class="row"><button class="btn" type="button" id="off-save">Save every question for offline use</button><button class="linkbtn" type="button" id="off-clear" hidden>Remove the saved questions</button></p><p class="fine" id="off-st" aria-live="polite"></p>') +
      '</div></div>' +
      '<p class="fine">With no connection, everything works except the Desmos calculator panel and “Suggest a change”. Your progress is separate from these saved files: removing them never removes your answers.</p>';
    var st = document.getElementById('off-st');
    if (!offRun) {
      offHave(list).then(function (n) {
        var go = document.getElementById('off-save'), clear = document.getElementById('off-clear');
        if (!go || !st) { return; }
        if (n >= list.length) { go.hidden = true; }
        else if (n) { go.textContent = 'Save the other ' + mfmt(list.length - n) + ' for offline use'; }
        if (clear) { clear.hidden = !n; }
        var said = last ? (last.full ? 'This device has no more room for the site, so saving stopped. ' : last.failed ? (navigator.onLine === false ? 'The connection dropped, so saving stopped. ' : plural(last.failed, 'file') + ' could not be fetched. ') + 'Try again when you are online. ' : '') : '';
        st.innerHTML = said + (n >= list.length ? '<b>All ' + mfmt(list.length) + ' question files are saved on this device.</b>' : n ? mfmt(n) + ' of ' + mfmt(list.length) + ' question files are saved on this device.' : 'No question files are saved on this device yet.');
      }).catch(function () { if (st) { st.textContent = 'This browser would not open its offline storage.'; } });
    }
    var b = document.getElementById('off-install');
    if (b) { b.addEventListener('click', function () { var p = pwaPrompt; pwaPrompt = null; if (p) { p.prompt(); if (p.userChoice) { p.userChoice.then(function () { offDraw(); }, function () { offDraw(); }); } } }); }
    b = document.getElementById('off-save');
    if (b) { b.addEventListener('click', offSaveAll); }
    b = document.getElementById('off-clear');
    if (b) { b.addEventListener('click', function () { if (window.confirm('Remove the question files saved for offline use? Your progress is not touched.')) { caches.delete(PWA_Q).then(function () { offDraw(); }); } }); }
  }
  /* a small line under the section bar while there is no connection */
  function offNote() {
    var el = document.getElementById('offnote');
    if (el) { el.hidden = navigator.onLine !== false; }
  }
  window.addEventListener('online', function () {
    /* questions that could not load while offline get another try */
    MTX_BAD = {};
    if (mtxLib === 3) { mtxLib = 0; MTX_ON = !!MTXT.on; }
    offNote();
  });
  window.addEventListener('offline', offNote);

  /* ---------- the page ---------- */
  var bkFound = null;
  function buildData(msg) {
    var host = viewEl.data, c = bkCount(store), s = habitStreak();
    var lessons = countDone() + countReadDone(), mods = (Array.isArray(store.s.modules) ? store.s.modules.length : 0) + (Array.isArray(store.s.rwmodules) ? store.s.rwmodules.length : 0);
    var P = planGet(), notes = typeof store.s.notes === 'string' ? store.s.notes.trim().length : 0, any = c.m + c.rw + lessons + mods + notes > 0 || !!P;
    function row(n, what, href, link) { return '<li><b>' + n + '</b><span>' + what + '</span>' + (href ? '<a href="#' + href + '">' + link + '</a>' : '') + '</li>'; }
    bkFound = null;
    host.innerHTML = '<div class="wrap">' +
      '<header class="mhead"><p class="eyebrow">My progress</p><h2 class="vtitle">Keep a copy, move it, and study with no connection</h2>' +
      '<p class="lede">' + (acctIn() ? 'You are signed in, so your progress is also kept in <a href="#account">your account</a> and follows you to other devices. A backup file is a second copy that you hold yourself.' : (acctOn ? 'Without an account, your progress lives in this browser on this device. A backup file keeps it safe and carries it to another device; <a href="#account">a free account</a> does the same without the file.' : 'There is no account, so your progress lives in this browser on this device. A backup file keeps it safe and carries it to another device.')) + '</p></header>' +
      (canStore ? '' : '<p class="note warn">This browser is not saving data (private browsing, or storage is turned off), so progress is lost when you close the page. A backup file still works.</p>') +
      (msg ? '<p class="note data-msg" id="data-msg" role="status" tabindex="-1">' + msg + '</p>' : '') +
      '<section class="sec first" id="data-here"><h3 class="h2">Saved on this device</h3><ul class="data-rows">' +
        row(mfmt(c.m), 'Math questions answered', 'm-map', 'Math map') +
        row(mfmt(c.rw), 'Reading &amp; Writing questions answered', 'rw-map', 'Reading &amp; Writing map') +
        row(lessons, 'lessons marked as read') +
        row(mods, 'timed modules scored') +
        row(c.days, 'days with practice · longest streak ' + s.best) +
        row(P ? '✓' : '–', P ? 'A study plan for ' + new Date(parseDay(P.date)).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : 'No study plan yet', 'plan', P ? 'My plan' : 'Make one') +
        row(notes ? '✓' : '–', notes ? 'Private notes' : 'No notes yet', 'suggest-notes', 'My notes') +
      '</ul></section>' +
      '<section class="sec" id="data-days"><h3 class="h2">Days you practiced</h3><p class="lede">' + habitLine() + '</p>' + habitCalHTML(26) + '</section>' +
      '<section class="sec" id="data-backup"><h3 class="h2">Back up</h3><p class="lede">One small file with your answers, miss reasons, plan, notes and settings, for both sections. It stays with you: nothing is uploaded.</p>' +
        '<p class="row"><button class="btn" type="button" id="bk-save"' + (any ? '' : ' disabled') + '>Download a backup file</button>' + (bkCanShare() ? '<button class="btn ghost" type="button" id="bk-share"' + (any ? '' : ' disabled') + '>Send it to myself</button>' : '') + '</p>' +
        '<p class="fine" id="bk-ago">' + (any ? bkAgo() + ' Make a new one every week or two, and before you clear your browser or change devices.' : 'There is nothing to back up yet. Answer a question first.') + '</p></section>' +
      '<section class="sec" id="data-restore"><h3 class="h2">Restore, or move to this device</h3><p class="lede">Choose a backup file made by this site. You then decide whether to add it to what is here or to replace what is here.</p>' +
        '<p class="row"><label class="btn ghost bk-pick" for="bk-file">Choose a backup file</label><input class="sr" type="file" id="bk-file" accept=".json,.txt,application/json,text/plain"></p>' +
        '<div id="bk-found" aria-live="polite"></div></section>' +
      '<section class="sec" id="my-data-offline"><h3 class="h2">Use it offline</h3><p class="lede">On a bus, on a plane, or anywhere with a weak signal.</p><div id="off-box"></div></section>' +
      '<section class="sec" id="data-erase"><h3 class="h2">Start over</h3><p class="lede">Erases every answer, the plan, notes and settings saved on this device' + (acctIn() ? ' <b>and in your account</b>' : '') + ', for both sections. It cannot be undone, so download a backup first.</p>' +
        '<p class="row"><button class="btn ghost danger" type="button" id="bk-erase"' + (any ? '' : ' disabled') + '>' + (acctIn() ? 'Erase my progress everywhere' : 'Erase my progress on this device') + '</button></p></section>' +
      '</div>';
    offDraw();
    $('#bk-save', host).addEventListener('click', function () { bkDownload(); $('#bk-ago', host).textContent = 'Downloaded ' + bkName('json') + '. Keep it somewhere safe: your files, a drive, or an email to yourself.'; });
    var share = $('#bk-share', host);
    if (share) {
      share.addEventListener('click', function () {
        var f = bkShareFile();
        if (!f) { return; }
        navigator.share({ files: [f], title: 'SAT Sprint backup' }).then(function () { bkMark(); $('#bk-ago', host).textContent = 'Sent. ' + bkAgo(); }, function () {});
      });
    }
    $('#bk-file', host).addEventListener('change', function () {
      var file = this.files && this.files[0], box = $('#bk-found', host), input = this;
      bkFound = null;
      if (!file) { box.innerHTML = ''; return; }
      if (file.size > BK_MAX) { box.innerHTML = '<p class="note warn">That file is too large to be a SAT Sprint backup.</p>'; input.value = ''; return; }
      var rd = new FileReader();
      rd.onerror = function () { box.innerHTML = '<p class="note warn">That file could not be opened.</p>'; };
      rd.onload = function () {
        var got = bkParse(String(rd.result || ''));
        input.value = '';
        if (got.err) { box.innerHTML = '<p class="note warn">' + esc(got.err) + '</p>'; return; }
        bkFound = got;
        var n = bkCount(got.data), here = bkCount(store);
        box.innerHTML = '<div class="bk-found"><p><b>' + esc(file.name) + '</b>' + (isNaN(got.saved) ? '' : ' · saved ' + new Date(got.saved).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })) + '</p>' +
          '<ul class="plainlist"><li><b>In the file:</b> ' + bkCountText(n) + '.</li><li><b>On this device now:</b> ' + bkCountText(here) + '.</li></ul>' +
          '<p class="row"><button class="btn" type="button" id="bk-add">Add it to what is here</button><button class="btn ghost" type="button" id="bk-replace">Replace what is here</button><button class="linkbtn" type="button" id="bk-cancel">Cancel</button></p>' +
          '<p class="fine"><b>Add</b> keeps both: for a question answered in both places, the more recent answer stays, and your plan and settings here are kept. <b>Replace</b> makes this device match the file exactly.</p></div>';
        $('#bk-add', box).addEventListener('click', function () {
          if (!bkFound) { return; }
          bkApply(bkMerge(store, bkFound.data), '');
          buildData('<b>Added.</b> This device now has ' + bkCountText(bkCount(store)) + '.'); focusQuiet(document.getElementById('data-msg')); toTop();
        });
        $('#bk-replace', box).addEventListener('click', function () {
          if (!bkFound || !window.confirm(acctIn() ? 'Replace everything saved on this device and in your account with this backup? What is there now will be lost.' : 'Replace everything saved on this device with this backup? What is here now will be lost.')) { return; }
          bkApply(bkFound.data, bkFound.theme);
          buildData('<b>Restored.</b> This device now has ' + bkCountText(bkCount(store)) + '.'); focusQuiet(document.getElementById('data-msg')); toTop();
        });
        $('#bk-cancel', box).addEventListener('click', function () { bkFound = null; box.innerHTML = ''; });
        focusQuiet($('#bk-add', box));
      };
      rd.readAsText(file);
    });
    $('#bk-erase', host).addEventListener('click', function () {
      if (!window.confirm(acctIn() ? 'Erase every answer, your plan, notes and settings on this device AND in your account? This cannot be undone.' : 'Erase every answer, your plan, notes and settings on this device? This cannot be undone.')) { return; }
      bkApply({}, '');
      buildData('<b>Erased.</b> This device is back to a fresh start. Your appearance setting and any questions saved for offline use were kept.'); focusQuiet(document.getElementById('data-msg')); toTop();
    });
  }

