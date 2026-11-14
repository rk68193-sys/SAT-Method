  /* =================== Both subjects: an optional account that keeps progress in the cloud =================== */
  /* Without an account nothing changes: progress stays in this browser. With one, the same saved progress (answers, days and
     streak, maps, plan, notes) is also kept in one row of a Supabase table, and every device that signs in shares it.
     The project address and its public key come from src/build/account.json; with none set, accounts are switched off and
     no link to this page is shown. The key is the public one: the table's row rules let a person read and write only their own row.
     Saved under ACCT_LS: { uid, email, at (access token), rt (refresh token), exp, rev, dirty, last }.
       rev   the row's version when this device last matched it (null: never)
       dirty this device has changes the account has not seen
     A sync reads the row, then: row unchanged and device changed -> the device's copy is sent; row changed and device not ->
     the row is taken; both changed -> they are joined the way a backup is added (bkMerge) and the result is sent. A send names
     the version it replaces, so two devices can never overwrite each other unseen. */
  var ACCT = isObj(D.account) ? D.account : {};
  var ACCT_URL = String(ACCT.url || '').replace(/\/+$/, ''), ACCT_KEY = String(ACCT.key || '');
  var acctOn = /^https?:\/\/[^\s\/]+/.test(ACCT_URL) && ACCT_KEY.length > 10 && !!window.fetch;
  var ACCT_LS = 'sat-sprint-account';
  /* kept on each device and never sent: the page you were last on, the last backup, the sample shown on Home */
  var ACCT_LOCAL = ['last', 'bk', 'htry'];
  var A = null, acctLast = '', acctSeq = 0, acctRun = null, acctAgain = false, acctTimer = null;
  var acctState = { s: '', msg: '' }, acctNewPw = false, acctNote = '';

  function acctRead() {
    try {
      var o = JSON.parse(window.localStorage.getItem(ACCT_LS) || 'null');
      return isObj(o) && typeof o.uid === 'string' && o.uid ? o : null;
    } catch (e) { return null; }
  }
  function acctPut() {
    try { if (A) { window.localStorage.setItem(ACCT_LS, JSON.stringify(A)); } else { window.localStorage.removeItem(ACCT_LS); } } catch (e) {}
  }
  function acctIn() { return acctOn && !!A && !!A.rt; }
  /* the words for where progress is kept, for the lines around the site that say so */
  function savedIn() { return acctIn() ? 'in this browser and in your account' : 'in this browser only'; }
  function acctLinkHTML() {
    if (!acctOn) { return ''; }
    return acctIn() ? '<a href="#account">My account</a> · ' : '<a href="#account">Sign in to keep it on every device</a> · ';
  }

  /* ---------- what is sent, and taking what comes back ---------- */
  function acctBody() {
    var out = {}, s = {};
    Object.keys(store.s).forEach(function (k) { if (ACCT_LOCAL.indexOf(k) < 0) { s[k] = store.s[k]; } });
    Object.keys(store).forEach(function (k) { out[k] = k === 's' ? s : store[k]; });
    return out;
  }
  /* a row can only hold what its owner sent, but it is still checked like a backup file: plain values, ordinary names */
  function acctClean(data) {
    var out = {};
    Object.keys(store).forEach(function (k) { var c = bkClean(isObj(data) ? data[k] : null, [k]); out[k] = isObj(c) ? c : {}; });
    return out;
  }
  function acctAny(d) {
    var c = bkCount(d), s = isObj(d.s) ? d.s : {}, n = 0;
    ['l', 'rl', 'd', 'g', 'x'].forEach(function (b) { n += Object.keys(isObj(d[b]) ? d[b] : {}).length; });
    return c.m + c.rw + c.days + n > 0 || isObj(s.plan) || (typeof s.notes === 'string' && !!s.notes.trim()) ||
      (Array.isArray(s.modules) && s.modules.length > 0) || (Array.isArray(s.rwmodules) && s.rwmodules.length > 0) || (isObj(s.diag) && Object.keys(s.diag).length > 0);
  }
  /* make this device hold `data`, without counting that as a change of its own */
  function acctAdopt(data) {
    var keep = {};
    ACCT_LOCAL.forEach(function (k) { if (has(store.s, k)) { keep[k] = store.s[k]; } });
    Object.keys(store).forEach(function (k) { store[k] = isObj(data[k]) ? data[k] : {}; });
    Object.keys(keep).forEach(function (k) { store.s[k] = keep[k]; });
    if (canStore) { try { window.localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { canStore = false; } }
    acctLast = JSON.stringify(acctBody());
  }
  /* pages that only show results are drawn again when the account brings something new; a question in progress is left alone */
  function acctRedraw() {
    if (['home', 'mmap', 'rwmap', 'plan', 'data', 'account'].indexOf(cur.view) < 0) { return; }
    var y = window.scrollY, f = document.activeElement;
    if (f && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)) { return; }
    route(lastToken);
    window.scrollTo(0, y);
  }

  /* ---------- talking to the project ---------- */
  function acctReq(method, path, body, token, extra) {
    var ctl = window.AbortController ? new AbortController() : null, tm = ctl ? setTimeout(function () { ctl.abort(); }, 20000) : 0;
    var h = { apikey: ACCT_KEY };
    if (token) { h.Authorization = 'Bearer ' + token; }
    if (body !== undefined) { h['Content-Type'] = 'application/json'; }
    Object.keys(extra || {}).forEach(function (k) { h[k] = extra[k]; });
    return window.fetch(ACCT_URL + path, { method: method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), signal: ctl ? ctl.signal : undefined, cache: 'no-store' }).then(function (res) {
      return res.text().then(function (t) {
        clearTimeout(tm);
        var j = null;
        try { j = t ? JSON.parse(t) : null; } catch (e) {}
        return { ok: res.ok, status: res.status, body: j };
      });
    }).catch(function () { clearTimeout(tm); return { ok: false, status: 0, body: null }; });
  }
  function acctErr(r) {
    var b = isObj(r.body) ? r.body : {}, code = String(b.error_code || b.code || b.error || ''), msg = String(b.msg || b.error_description || b.message || '');
    if (!r.status) { return 'No connection to the account service. Check your internet and try again.'; }
    if (r.status === 429 || /rate_limit/.test(code)) { return 'Too many tries just now. Wait a minute, then try again.'; }
    if (code === 'invalid_credentials' || /invalid login/i.test(msg)) { return 'That email and password do not match an account.'; }
    if (code === 'email_not_confirmed' || /not confirmed/i.test(msg)) { return 'Confirm your email first: open the link we sent you, then sign in.'; }
    if (code === 'user_already_exists' || code === 'email_exists' || /already registered/i.test(msg)) { return 'There is already an account for that email. Choose “Sign in” instead.'; }
    if (code === 'weak_password' || /password should/i.test(msg)) { return 'Choose a longer password: at least 8 characters.'; }
    if (code === 'same_password') { return 'That is your current password. Choose a different one.'; }
    if (code === 'email_address_invalid' || code === 'validation_failed' || /invalid.*email|email.*invalid/i.test(msg)) { return 'That does not look like an email address.'; }
    if (/signup.*disabled|signups not allowed/i.test(msg + code)) { return 'New accounts are closed right now.'; }
    return 'That did not work (' + (msg.slice(0, 120) || 'error ' + r.status) + '). Try again in a moment.';
  }
  /* the session has ended: the device keeps its progress and remembers whose it is, until that person signs in again */
  function acctExpire() {
    if (A) { A.at = ''; A.rt = ''; A.exp = 0; acctPut(); }
    clearTimeout(acctTimer);
    acctSet('', '');
    acctNote = 'You were signed out of your account. Sign in again to keep saving to it; your progress is still on this device.';
    if (cur.view === 'account') { buildAccount(); }
  }
  /* a token that is good for at least another minute; another tab may already have renewed it */
  function acctToken() {
    if (!acctIn()) { return Promise.resolve(''); }
    if (A.exp - Date.now() > 60000) { return Promise.resolve(A.at); }
    var other = acctRead();
    if (other && other.uid === A.uid && other.rt && other.exp - Date.now() > 60000) { A.at = other.at; A.rt = other.rt; A.exp = other.exp; return Promise.resolve(A.at); }
    var uid = A.uid;
    return acctReq('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: A.rt }).then(function (r) {
      if (!A || A.uid !== uid) { return ''; }
      if (r.ok && isObj(r.body) && r.body.access_token && r.body.refresh_token) {
        A.at = r.body.access_token; A.rt = r.body.refresh_token; A.exp = Date.now() + (Number(r.body.expires_in) || 3600) * 1000; acctPut();
        return A.at;
      }
      if (r.status >= 400 && r.status < 500 && r.status !== 429) { acctExpire(); }
      return '';
    });
  }

  /* ---------- the sync ---------- */
  function acctSet(s, msg) {
    acctState = { s: s, msg: msg || '' };
    acctDraw();
  }
  /* called by save(): notes a real change and sends it a moment later */
  function acctChanged() {
    if (!acctOn || !A || !A.uid) { return; }
    var j = JSON.stringify(acctBody());
    if (j === acctLast) { return; }
    acctLast = j; acctSeq += 1;
    if (!A.dirty) { A.dirty = true; acctPut(); }
    if (acctIn()) { clearTimeout(acctTimer); acctTimer = setTimeout(acctSync, 2500); }
  }
  function acctSync() {
    clearTimeout(acctTimer);
    if (!acctIn()) { return Promise.resolve(false); }
    if (acctRun) { acctAgain = true; return acctRun; }
    acctSet('sync', '');
    var uid = A.uid;
    acctRun = acctOnce(uid, 0).then(function (res) {
      acctRun = null;
      if (!A || A.uid !== uid || !A.rt) { return false; }
      if (res === true) { A.last = Date.now(); acctPut(); acctSet('ok', ''); }
      else { acctSet('err', res || 'Could not reach your account. Your answers are safe on this device and will be sent when the connection is back.'); }
      if (acctAgain || (res === true && A.dirty)) { acctAgain = false; acctTimer = setTimeout(acctSync, 1500); }
      else if (res !== true) { acctTimer = setTimeout(acctSync, 60000); }
      return res === true;
    });
    return acctRun;
  }
  /* true when the device and the account match; otherwise a message (or '' for the usual one) */
  function acctOnce(uid, tries) {
    var mine = function () { return !!A && A.uid === uid && !!A.rt; };
    return acctToken().then(function (tok) {
      if (!tok || !mine()) { return ''; }
      return acctReq('GET', '/rest/v1/progress?select=rev,data&user_id=eq.' + encodeURIComponent(uid), undefined, tok).then(function (r) {
        if (!mine()) { return ''; }
        if (r.status === 401) { A.exp = 0; return tries < 1 ? acctOnce(uid, tries + 1) : (acctExpire(), ''); }
        if (!r.ok || !Array.isArray(r.body)) { return r.status === 404 ? 'The account service is not set up yet (its table is missing).' : ''; }
        var row = isObj(r.body[0]) ? r.body[0] : null, rev = row ? Number(row.rev) || 0 : 0, changed = false, send = false;
        if (!row) { send = true; }
        else if (A.rev === rev) { send = !!A.dirty; }
        else {
          var theirs = acctClean(row.data);
          if (A.rev === null ? !acctAny(store) : !A.dirty) { acctAdopt(theirs); }
          else { acctAdopt(bkMerge(acctBody(), theirs)); send = true; }
          changed = true;
        }
        if (!send) { A.rev = rev; A.dirty = false; acctPut(); if (changed) { acctRedraw(); } return true; }
        var seq = acctSeq, body = { rev: rev + 1, data: acctBody(), updated_at: new Date().toISOString() }, req;
        if (row) { req = acctReq('PATCH', '/rest/v1/progress?user_id=eq.' + encodeURIComponent(uid) + '&rev=eq.' + rev + '&select=rev', body, tok, { Prefer: 'return=representation' }); }
        else { body.user_id = uid; req = acctReq('POST', '/rest/v1/progress', body, tok, { Prefer: 'return=minimal' }); }
        return req.then(function (w) {
          if (!mine()) { return ''; }
          /* someone else wrote first (another device): read again and join */
          var lost = row ? w.ok && Array.isArray(w.body) && !w.body.length : w.status === 409;
          if (lost) { if (changed) { A.rev = null; A.dirty = true; } return tries < 3 ? acctOnce(uid, tries + 1) : ''; }
          if (!w.ok) { if (changed) { A.rev = null; A.dirty = true; acctPut(); acctRedraw(); } return w.status === 413 ? 'Your saved progress is too large for the account service.' : ''; }
          A.rev = rev + 1; A.dirty = acctSeq !== seq; acctPut();
          if (changed) { acctRedraw(); }
          return true;
        });
      });
    });
  }

  /* ---------- signing in and out ---------- */
  /* start using a session the service gave us; false when the person backed out */
  function acctBegin(sess) {
    var u = isObj(sess.user) ? sess.user : {}, uid = String(u.id || ''), prev = A;
    if (!uid || !sess.access_token || !sess.refresh_token) { return false; }
    if (prev && prev.uid !== uid && acctAny(store)) {
      if (!window.confirm('This device holds progress from another account (' + prev.email + '). Signing in replaces it with the progress in this account. Continue?')) { return false; }
      acctAdopt({});
    }
    var same = !!prev && prev.uid === uid;
    A = { uid: uid, email: String(u.email || ''), at: String(sess.access_token), rt: String(sess.refresh_token), exp: Date.now() + (Number(sess.expires_in) || 3600) * 1000,
      rev: same && typeof prev.rev === 'number' ? prev.rev : null, dirty: same ? !!prev.dirty : acctAny(store), last: 0 };
    acctPut();
    acctLast = JSON.stringify(acctBody());
    acctNote = '';
    acctSync();
    return true;
  }
  function acctSignIn(email, pw) {
    return acctReq('POST', '/auth/v1/token?grant_type=password', { email: email, password: pw }).then(function (r) {
      if (!r.ok || !isObj(r.body)) { return acctErr(r); }
      return acctBegin(r.body) ? '' : 'Not signed in.';
    });
  }
  /* '' signed in, 'confirm' an email was sent, otherwise what went wrong */
  function acctSignUp(email, pw) {
    var back = location.origin + location.pathname;
    return acctReq('POST', '/auth/v1/signup?redirect_to=' + encodeURIComponent(back), { email: email, password: pw }).then(function (r) {
      if (!r.ok || !isObj(r.body)) { return acctErr(r); }
      if (r.body.access_token) { return acctBegin(r.body) ? '' : 'Not signed in.'; }
      return 'confirm';
    });
  }
  function acctForget() {
    A = null; acctPut(); clearTimeout(acctTimer); acctRun = null; acctAgain = false; acctNewPw = false;
    acctAdopt({});
    acctSet('', '');
  }
  function acctSignOut() {
    var done = function () {
      var tok = A ? A.at : '';
      if (tok) { acctReq('POST', '/auth/v1/logout?scope=local', undefined, tok); }
      acctForget();
      acctNote = 'Signed out. Your progress is in your account and is no longer on this device.';
      buildAccount();
    };
    return (A.dirty ? acctSync() : Promise.resolve(true)).then(function () {
      if (!A) { return; }
      var q = A.dirty
        ? 'Your latest answers have NOT reached your account yet (no connection?). If you sign out now they are removed from this device and lost. Sign out anyway?'
        : 'Sign out? Your progress is safe in your account. It is removed from this device until you sign in again.';
      if (window.confirm(q)) { done(); }
    });
  }

  /* ---------- a link from an email (confirming an address, or choosing a new password) lands here ---------- */
  (function () {
    var h = location.hash.replace(/^#/, '');
    if (!acctOn || !/(^|&)(access_token|error_code|error_description)=/.test(h)) { return; }
    var q = {};
    h.split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) { try { q[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')); } catch (e) {} } });
    try { history.replaceState(null, '', '#account'); } catch (e) { return; }
    if (!q.access_token || !q.refresh_token) { acctNote = 'That link has expired or was already used. Ask for a new one below.'; return; }
    acctReq('GET', '/auth/v1/user', undefined, q.access_token).then(function (r) {
      if (!r.ok || !isObj(r.body)) { acctNote = 'That link has expired or was already used. Ask for a new one below.'; }
      else if (acctBegin({ access_token: q.access_token, refresh_token: q.refresh_token, expires_in: q.expires_in, user: r.body })) { acctNewPw = q.type === 'recovery'; }
      if (cur.view === 'account') { buildAccount(); }
    });
  }());

  /* ---------- the button at the top, and the lines around the site ---------- */
  function acctDraw() {
    var t = document.getElementById('acct-tool');
    if (t) {
      t.hidden = !acctOn;
      var s = acctIn() ? (acctState.s || 'ok') : '';
      t.setAttribute('data-state', s);
      t.setAttribute('aria-label', !acctIn() ? 'Sign in or create an account' : 'My account: ' + (s === 'sync' ? 'saving' : s === 'err' ? 'not saved yet' : 'saved'));
      $('span', t).textContent = acctIn() ? 'Account' : 'Sign in';
    }
    var st = document.getElementById('acct-st');
    if (st) { st.innerHTML = acctStatusHTML(); }
  }
  function acctStatusHTML() {
    if (acctState.s === 'sync') { return 'Saving to your account…'; }
    if (acctState.s === 'err') { return '<b>Not saved to your account yet.</b> ' + esc(acctState.msg); }
    var t = A && A.last ? new Date(A.last).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';
    return '<b>Everything is saved to your account.</b>' + (t ? ' Last checked at ' + esc(t) + '.' : '');
  }

  /* ---------- the page ---------- */
  function buildAccount() {
    var host = viewEl.account;
    if (!acctOn) { host.innerHTML = '<div class="wrap sgwrap"><header class="mhead"><p class="eyebrow">My account</p><h2 class="vtitle">Accounts are not switched on</h2><p class="lede">Your progress is saved in this browser. <a href="#my-data">Back it up or move it to another device</a>.</p></header></div>'; return; }
    var note = acctNote ? '<p class="note acct-note" role="status">' + esc(acctNote) + '</p>' : '';
    if (!acctIn()) {
      var again = A && A.email ? A.email : '';
      host.innerHTML = '<div class="wrap sgwrap">' +
        '<header class="mhead"><p class="eyebrow">My account</p><h2 class="vtitle">Keep your progress on every device</h2>' +
        '<p class="lede">An account is free and optional. It saves your streak, your maps, your study plan and every answer, so they are there on your phone, your laptop and a school computer. Without one, the whole site still works and your progress stays in this browser.</p></header>' + note +
        '<form class="sgform acct-form" id="acct-form" novalidate>' +
          seg('acct-mode', 'New here, or coming back?', [['up', 'Create an account'], ['in', 'Sign in']], again ? 'in' : 'up') +
          '<label class="field"><span class="label">Email</span><input type="email" id="acct-email" autocomplete="email" inputmode="email" maxlength="200" required value="' + esc(again) + '"></label>' +
          '<label class="field"><span class="label">Password</span><input type="password" id="acct-pw" maxlength="200" required><span class="fine" id="acct-pw-hint"></span></label>' +
          '<p class="row"><button class="btn big" type="submit" id="acct-go"></button><button class="linkbtn" type="button" id="acct-forgot">I forgot my password</button></p>' +
          '<p class="sg-msg" id="acct-msg" role="status" aria-live="polite"></p>' +
        '</form>' +
        '<section class="sec"><h3 class="h2">What an account keeps</h3><ul class="plainlist acct-list">' +
          '<li><b>Your progress on this device is added to the account</b> when you sign in, so nothing you have done is lost.</li>' +
          '<li><b>We store two things:</b> your email address, and your study progress (answers, days practiced, plan, notes). Nothing else, and it is never shared or sold.</li>' +
          '<li><b>You can leave at any time:</b> delete the account from this page and everything in it is erased.</li></ul></section>' +
        '</div>';
      var form = $('#acct-form', host), msg = $('#acct-msg', host), go = $('#acct-go', host), busy = false;
      var mode = function () { var c = $('input[name="acct-mode"]:checked', form); return c ? c.value : 'up'; };
      var say = function (ok, t) { msg.className = 'sg-msg ' + (ok ? 'ok' : 'bad'); msg.textContent = t; };
      var paint = function () {
        var up = mode() === 'up';
        go.textContent = up ? 'Create my account' : 'Sign in';
        $('#acct-pw', form).setAttribute('autocomplete', up ? 'new-password' : 'current-password');
        $('#acct-pw-hint', form).textContent = up ? 'At least 8 characters.' : '';
      };
      paint();
      form.addEventListener('change', function (e) { if (e.target && e.target.name === 'acct-mode') { paint(); say(true, ''); } });
      var mail = function () {
        var v = $('#acct-email', form).value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { say(false, 'Type your email address first.'); focusQuiet($('#acct-email', form)); return ''; }
        return v;
      };
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) { return; }
        var email = mail(), pw = $('#acct-pw', form).value, up = mode() === 'up';
        if (!email) { return; }
        if (!pw || (up && pw.length < 8)) { say(false, up ? 'Choose a password of at least 8 characters.' : 'Type your password.'); focusQuiet($('#acct-pw', form)); return; }
        busy = true; go.disabled = true; say(true, up ? 'Creating your account…' : 'Signing in…');
        (up ? acctSignUp(email, pw) : acctSignIn(email, pw)).then(function (res) {
          busy = false; go.disabled = false;
          if (res === '') { buildAccount(); toTop(); focusQuiet($('.vtitle', host)); return; }
          if (res === 'confirm') { say(true, 'Almost done: we sent a link to ' + email + '. Open it to confirm your address and you will be signed in. If it does not arrive in a few minutes, look in your spam folder.'); return; }
          say(false, res);
        });
      });
      $('#acct-forgot', host).addEventListener('click', function () {
        var email = mail();
        if (!email || busy) { return; }
        busy = true; say(true, 'Sending…');
        acctReq('POST', '/auth/v1/recover?redirect_to=' + encodeURIComponent(location.origin + location.pathname), { email: email }).then(function (r) {
          busy = false;
          if (r.ok) { say(true, 'If there is an account for ' + email + ', a link to choose a new password is on its way.'); } else { say(false, acctErr(r)); }
        });
      });
      return;
    }
    var c = bkCount(store), s = habitStreak(), lessons = countDone() + countReadDone();
    var mods = (Array.isArray(store.s.modules) ? store.s.modules.length : 0) + (Array.isArray(store.s.rwmodules) ? store.s.rwmodules.length : 0), P = planGet();
    function row(n, what, href, link) { return '<li><b>' + n + '</b><span>' + what + '</span>' + (href ? '<a href="#' + href + '">' + link + '</a>' : '') + '</li>'; }
    host.innerHTML = '<div class="wrap sgwrap">' +
      '<header class="mhead"><p class="eyebrow">My account</p><h2 class="vtitle">Signed in</h2><p class="lede acct-who">' + esc(A.email) + '</p></header>' + note +
      (acctNewPw ? '<p class="note warn" role="status"><b>Choose a new password below</b> to finish resetting it.</p>' : '') +
      '<p class="note acct-st" id="acct-st" role="status" aria-live="polite">' + acctStatusHTML() + '</p>' +
      '<p class="row acct-row"><button class="btn" type="button" id="acct-sync">Save and check now</button><button class="btn ghost" type="button" id="acct-out">Sign out</button></p>' +
      '<section class="sec first"><h3 class="h2">In your account</h3><ul class="data-rows">' +
        row(s.n, (s.n === 1 ? 'day' : 'days') + ' in a row · longest streak ' + s.best, 'home', 'Today') +
        row(c.days, 'days with practice') +
        row(mfmt(c.m), 'Math questions answered', 'm-map', 'Math map') +
        row(mfmt(c.rw), 'Reading &amp; Writing questions answered', 'rw-map', 'Reading &amp; Writing map') +
        row(lessons, 'lessons marked as read') +
        row(mods, 'timed tests scored') +
        row(P ? '✓' : '–', P ? 'A study plan' : 'No study plan yet', 'plan', P ? 'My plan' : 'Make one') +
      '</ul><p class="fine acct-fine">Sign in on another device with the same email and all of this is there too. Answers are saved a few seconds after you give them; with no connection they wait on this device and are sent later.</p></section>' +
      '<section class="sec" id="acct-pwsec"><h3 class="h2">Change my password</h3>' +
        '<form class="acct-inline" id="acct-pwform" novalidate><label class="field"><span class="label">New password</span><input type="password" id="acct-newpw" autocomplete="new-password" maxlength="200"><span class="fine">At least 8 characters.</span></label>' +
        '<p class="row"><button class="btn ghost" type="submit">Change password</button></p><p class="sg-msg" id="acct-pwmsg" role="status" aria-live="polite"></p></form></section>' +
      '<section class="sec"><h3 class="h2">Delete my account</h3><p class="lede">Erases the account and everything saved in it. The progress on this device stays here, in this browser. It cannot be undone.</p>' +
        '<p class="row"><button class="btn ghost danger" type="button" id="acct-del">Delete my account</button></p><p class="sg-msg" id="acct-delmsg" role="status" aria-live="polite"></p></section>' +
      '</div>';
    $('#acct-sync', host).addEventListener('click', function () { acctSync().then(function () { if (cur.view === 'account' && acctIn()) { acctDraw(); } }); });
    $('#acct-out', host).addEventListener('click', function () { acctSignOut(); });
    $('#acct-pwform', host).addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = $('#acct-newpw', host).value, m = $('#acct-pwmsg', host);
      if (pw.length < 8) { m.className = 'sg-msg bad'; m.textContent = 'Choose a password of at least 8 characters.'; return; }
      m.className = 'sg-msg ok'; m.textContent = 'Saving…';
      acctToken().then(function (tok) { return tok ? acctReq('PUT', '/auth/v1/user', { password: pw }, tok) : { ok: false, status: 0, body: null }; }).then(function (r) {
        if (r.ok) { acctNewPw = false; $('#acct-newpw', host).value = ''; m.className = 'sg-msg ok'; m.textContent = 'Your password is changed.'; }
        else { m.className = 'sg-msg bad'; m.textContent = acctErr(r); }
      });
    });
    $('#acct-del', host).addEventListener('click', function () {
      var m = $('#acct-delmsg', host);
      if (!window.confirm('Delete your account and everything saved in it? This cannot be undone. The progress on this device stays here.')) { return; }
      m.className = 'sg-msg ok'; m.textContent = 'Deleting…';
      acctToken().then(function (tok) { return tok ? acctReq('POST', '/rest/v1/rpc/delete_account', {}, tok) : { ok: false, status: 0, body: null }; }).then(function (r) {
        if (!r.ok) { m.className = 'sg-msg bad'; m.textContent = acctErr(r); return; }
        A = null; acctPut(); clearTimeout(acctTimer); acctNewPw = false; acctSet('', '');
        acctNote = 'Your account is deleted. The progress on this device is still here, in this browser only.';
        buildAccount(); toTop();
      });
    });
  }

  /* ---------- start ---------- */
  if (acctOn) {
    A = acctRead();
    acctLast = JSON.stringify(acctBody());
    acctDraw();
    var footSaved = document.getElementById('foot-saved');
    if (footSaved) { footSaved.textContent = 'Progress is saved in your browser, and in your account if you sign in.'; }
    if (acctIn()) { acctSync(); }
    /* another tab signed in or out, or synced */
    window.addEventListener('storage', function (e) {
      if (e.key !== ACCT_LS) { return; }
      var was = acctIn(), o = acctRead();
      A = o; acctLast = JSON.stringify(acctBody());
      if (was !== acctIn()) { acctSet('', ''); if (cur.view === 'account') { buildAccount(); } } else { acctDraw(); }
    });
    document.addEventListener('visibilitychange', function () {
      if (!acctIn()) { return; }
      if (document.hidden) { if (A.dirty) { acctSync(); } }
      else if (A.dirty || Date.now() - (A.last || 0) > 30000) { acctSync(); }
    });
    window.addEventListener('pagehide', function () { if (acctIn() && A.dirty) { acctSync(); } });
    window.addEventListener('online', function () { if (acctIn()) { acctSync(); } });
  }
