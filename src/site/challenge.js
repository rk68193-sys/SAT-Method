  /* =================== Challenge a friend: a few real questions in a link, with no server =================== */
  /* A challenge is its questions, written into a link: #ch-<m|rw>-<score>-<question ids, 3 to 10 of them>[-<name>].
     The sender answers first, so the link carries a score to beat. The friend answers the same questions in the same order
     and can send their own score back in a link of the same kind. Nothing is sent anywhere: the link travels in whatever app
     the student uses, and each device keeps its own results (store.s.chal, the last 20, and store.s.chn, the name it signs
     with; both only hold characters a backup may hold). Answers count as ordinary practice (saved, spaced repeats, the
     day's count) and earn nothing extra. A first try that answers every question is the score that counts. */
  var CHAL_N = 5, CHAL_KEEP = 20, CHAL_NAME_MAX = 20;
  var CHAL_RE = /^ch-(m|rw)-(\d{1,2})-((?:[0-9a-f]{8}){3,10})(?:-(.{1,120}))?$/;
  var chalNow = null, chalSet = { s: 'm', t: 'all', d: 'mix' };

  /* ---------- the challenge itself ---------- */
  function chalHash(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function chalMake(s, ids, score, by) {
    var q = ids.join('');
    return { s: s, ids: ids.slice(), n: ids.length, q: q, key: s + '.' + chalHash(s + q), score: score, by: by || '', mine: false };
  }
  /* a name as it may appear in a link and on the page: letters and digits, spaces, dots and dashes, at most 20 */
  function chalName(v) {
    var s = String(v == null ? '' : v);
    try { s = s.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    return s.replace(/_/g, ' ').replace(/[^A-Za-z0-9 .\-]/g, '').replace(/\s+/g, ' ').replace(/^[ .\-]+/, '').slice(0, CHAL_NAME_MAX).replace(/[ .\-]+$/, '');
  }
  function chalMyName() { return chalName(store.s.chn); }
  function chalParse(token) {
    var m = CHAL_RE.exec(String(token || '').replace(/^#/, ''));
    if (!m || !PSUB[m[1]]) { return null; }
    var ids = m[3].match(/.{8}/g), score = Number(m[2]), seen = {}, by = '';
    if (score > ids.length) { return null; }
    for (var i = 0; i < ids.length; i += 1) {
      if (seen[ids[i]] || !PSUB[m[1]].valid(ids[i])) { return null; }
      seen[ids[i]] = 1;
    }
    if (m[4]) { try { by = decodeURIComponent(m[4]); } catch (e) { by = m[4]; } }
    return chalMake(m[1], ids, score, chalName(by));
  }
  /* links point at the address this page came from, or at the site when it is a saved copy */
  function chalBase() {
    var l = window.location;
    return /^https?:$/.test(l.protocol) ? l.origin + l.pathname : 'https://satsprint.org/';
  }
  function chalLink(s, q, score, name) {
    var nm = chalName(name).replace(/ /g, '_');
    return chalBase() + '#ch-' + s + '-' + score + '-' + q + (nm ? '-' + nm : '');
  }
  function chalSubj(s) { return s === 'm' ? 'Math' : 'Reading &amp; Writing'; }
  function chalSetName(C) { return 'Challenge' + (C.by && !C.mine ? ' from ' + C.by : ''); }
  function chalOf(n, of) { return n + ' of ' + of; }
  /* the topic, and how many questions at each level */
  function chalInfo(C) {
    var doms = {}, lv = { E: 0, M: 0, H: 0 };
    C.ids.forEach(function (id) {
      var d = '', dn = '';
      if (C.s === 'm') { var q = MQBY[id]; d = q.d; dn = MDOM[q.k] ? MDOM[q.k].name : ''; }
      else { rwItems(); var it = RWIT[id], k = rwDomain(it); d = String(it.d || '').charAt(0); dn = (RW_DOMS.filter(function (x) { return x[0] === k; })[0] || ['', ''])[1]; }
      if (dn) { doms[dn] = 1; }
      if (has(lv, d)) { lv[d] += 1; }
    });
    var dk = Object.keys(doms);
    return {
      topic: dk.length === 1 ? dk[0] : 'A mix of topics',
      levels: ['E', 'M', 'H'].filter(function (k) { return lv[k]; }).map(function (k) { return lv[k] + ' ' + MDIFF[k].toLowerCase(); }).join(', ')
    };
  }

  /* ---------- what this device remembers: the first full try at each challenge, and the scores friends sent ---------- */
  function chalAll() { if (!isObj(store.s.chal)) { store.s.chal = {}; } return store.s.chal; }
  function chalRec(C) { var r = chalAll()[C.key]; return isObj(r) && r.q === C.q && typeof r.r === 'number' && r.r >= 0 && r.r <= C.n ? r : null; }
  function chalTrim(A) {
    Object.keys(A).filter(function (k) { return !isObj(A[k]); }).forEach(function (k) { delete A[k]; });
    Object.keys(A).sort(function (a, b) { return (A[b].lt || 0) - (A[a].lt || 0); }).slice(CHAL_KEEP).forEach(function (k) { delete A[k]; });
  }
  function chalFriend(r, C) {
    if (C.mine || typeof C.score !== 'number') { return; }
    var f = (Array.isArray(r.f) ? r.f : []).filter(function (x) { return Array.isArray(x) && x[0] !== C.by; });
    f.unshift([C.by, C.score]);
    r.f = f.slice(0, 6);
  }
  function chalKeep(C, right) {
    var A = chalAll(), r = chalRec(C), t = Date.now();
    if (!r) { r = A[C.key] = { s: C.s, q: C.q, n: C.n, r: right, t: t, f: [] }; }
    if (C.mine) { r.mine = 1; }
    r.lr = right; r.lt = t;
    chalFriend(r, C);
    chalTrim(A);
    save();
    return r;
  }
  /* two devices joined (bkMerge): every challenge from both, the earlier first try, the later try, and every friend's
     score. Every record comes out in one shape, so joining the same backup twice changes nothing. */
  function chalMerge(a, b) {
    var all = {}, out = {};
    [a, b].forEach(function (side) {
      if (!isObj(side)) { return; }
      Object.keys(side).forEach(function (k) {
        var x = side[k];
        if (isObj(x) && typeof x.r === 'number' && typeof x.q === 'string') { (all[k] = all[k] || []).push(x); }
      });
    });
    Object.keys(all).forEach(function (k) {
      var L = all[k], first = L[0], last = L[0], f = [], seen = {};
      L.forEach(function (x) { if ((x.t || 0) < (first.t || 0)) { first = x; } if ((x.lt || 0) > (last.lt || 0)) { last = x; } });
      [last].concat(L).forEach(function (x) {
        (Array.isArray(x.f) ? x.f : []).forEach(function (p) { if (Array.isArray(p) && typeof p[1] === 'number' && !seen[p[0]]) { seen[p[0]] = 1; f.push([String(p[0] == null ? '' : p[0]), p[1]]); } });
      });
      out[k] = { s: first.s, q: first.q, n: Math.floor(first.q.length / 8), r: first.r, t: first.t || 0, lr: typeof last.lr === 'number' ? last.lr : first.r, lt: last.lt || first.t || 0, f: f.slice(0, 6) };
      if (L.some(function (x) { return x.mine; })) { out[k].mine = 1; }
    });
    chalTrim(out);
    return out;
  }
  /* the challenge a saved record stands for, with the score and name its link should carry */
  function chalFromRec(r) {
    if (!isObj(r) || !PSUB[r.s] || typeof r.q !== 'string') { return null; }
    var ids = r.q.match(/.{8}/g) || [];
    if (ids.length < 3 || ids.some(function (id) { return !PSUB[r.s].valid(id); })) { return null; }
    var C = chalMake(r.s, ids, r.r, chalMyName());
    C.mine = !!r.mine;
    return C;
  }

  /* ---------- playing: the ordinary practice screens, with the challenge attached ---------- */
  function chalPlay(C) {
    chalNow = C; C.kept = null;
    if (C.s === 'm') {
      var qs = C.ids.map(function (id) { return MQBY[id]; }).filter(Boolean);
      if (MP && !MP.over) { clearInterval(mpInterval); }
      MP = { qs: qs, i: 0, res: [], timer: false, over: false, chal: C, settings: { mode: 'learn', topic: 'all', diff: 'all', n: qs.length, pick: 'any', timer: false } };
      try { history.pushState(null, '', '#m-practice'); } catch (e) {}
      lastToken = 'm-practice';
      showView('mprac'); mpShow();
    } else {
      rwItems();
      var list = C.ids.map(function (id) { return RWIT[id]; }).filter(Boolean);
      try { history.pushState(null, '', '#practice'); } catch (e) {}
      lastToken = 'practice';
      showView('practice'); buildPractice();
      timedStart(list, { src: 'both', part: 'all', diff: 'all', which: 'all', len: list.length, tier: 'learn', hints: false, mode: 'set', quick: true });
      TS.chal = C;
    }
    viewTok[cur.view] = lastToken; guide(); visitCount(lastToken);
  }

  /* ---------- the parts of the page ---------- */
  function chalCanShare() { try { return typeof navigator.share === 'function'; } catch (e) { return false; } }
  /* to: '' or a name when this answers a friend's challenge; null when it is the student's own */
  function chalShareHTML(C, score, to) {
    var reply = to != null, share = chalCanShare();
    return '<div class="chal-share" data-chal-s="' + C.s + '" data-chal-q="' + C.q + '" data-chal-r="' + score + '" data-chal-n="' + C.n + '"' + (reply ? ' data-chal-to="' + esc(to) + '"' : '') + '>' +
      '<label class="field"><span class="label">Your name in the link</span><input type="text" class="chal-name" maxlength="' + CHAL_NAME_MAX + '" autocomplete="nickname" spellcheck="false" placeholder="First name or nickname" value="' + esc(chalMyName()) + '"></label>' +
      '<p class="fine">Optional. Your friend sees it, so a first name or a nickname is best.</p>' +
      '<p class="row chal-acts">' + (share ? '<button class="btn" type="button" data-chal-send>' + (reply ? 'Send it to ' + esc(to || 'your friend') : 'Send to a friend') + '</button>' : '') +
        '<button class="btn' + (share ? ' ghost' : '') + '" type="button" data-chal-copy>Copy the link</button></p>' +
      '<p class="chal-msg" role="status" aria-live="polite"></p>' +
      '<label class="field chal-urlf" hidden><span class="label">The link</span><input type="text" class="chal-url" readonly value="' + esc(chalLink(C.s, C.q, score, chalMyName())) + '"></label>' +
    '</div>';
  }
  function chalVsHTML(me, them, n, name) {
    var w = me > them ? 'me' : me < them ? 'them' : 'tie', who = esc(name || 'Your friend');
    function side(label, sc, won) { return '<div class="chal-side' + (won ? ' win' : '') + '"><span class="chal-who">' + label + '</span><b>' + chalOf(sc, n) + '</b>' + (won ? '<span class="chal-tag">Winner</span>' : '') + '</div>'; }
    return '<div class="chal-vs">' + side('You', me, w === 'me') + '<span class="chal-mid" aria-hidden="true">vs</span>' + side(who, them, w === 'them') + '</div>' +
      '<p class="chal-verdict ' + w + '">' + (w === 'me' ? 'You win! You got more right than ' + esc(name || 'your friend') + '.'
        : w === 'tie' ? 'It’s a tie: you both got ' + chalOf(me, n) + '.'
        : who + ' wins this one. Want a rematch? Make a new challenge and send it back.') + '</p>';
  }
  function chalFriendsHTML(r, n) {
    var f = (Array.isArray(r.f) ? r.f : []).filter(function (x) { return Array.isArray(x) && typeof x[1] === 'number'; });
    if (!f.length) { return '<p class="fine">When a friend sends their score back, open their link to see who won.</p>'; }
    return '<div class="chal-back"><p class="label">Scores sent back</p><ul class="chal-friends">' + f.map(function (x) {
      return '<li><span>' + esc(chalName(x[0]) || 'A friend') + '</span><b>' + chalOf(x[1], n) + '</b>' + (x[1] > r.r ? '<i>beat you</i>' : x[1] === r.r ? '<i>tie</i>' : '<i>you win</i>') + '</li>';
    }).join('') + '</ul></div>';
  }
  function chalPage(html) { viewEl.challenge.innerHTML = '<div class="wrap chal-page">' + html + '</div>'; }

  /* ---------- #challenge: make one ---------- */
  function chalTopics(s) {
    return [['all', 'Any topic']].concat(s === 'm' ? MD.domains.map(function (d) { return [d.id, esc(d.name)]; }) : RW_DOMS.map(function (d) { return [d[0], d[1]]; }));
  }
  function chalPool(s, t, d) {
    var out = [];
    if (s === 'm') {
      MQ.forEach(function (q) {
        if ((t !== 'all' && (!MDOM[q.k] || MDOM[q.k].id !== t)) || (d !== 'mix' && q.d !== d)) { return; }
        out.push({ id: q.id, d: q.d, fresh: !mDone(q.id) });
      });
    } else {
      rwItems().forEach(function (it) {
        var lv = String(it.d || '').charAt(0);
        if ((t !== 'all' && rwDomain(it) !== t) || (d !== 'mix' && lv !== d)) { return; }
        out.push({ id: it.id, d: lv, fresh: !result(it) });
      });
    }
    return out;
  }
  /* five questions: ones this student has not tried first; for a mix, two easy, two medium and one hard; easier ones first */
  function chalPick(pool, d) {
    var want = d === 'mix' ? ['E', 'E', 'M', 'M', 'H'] : [d, d, d, d, d], by = { E: [], M: [], H: [] }, out = [];
    var L = shuffle(pool.slice()).sort(function (a, b) { return (b.fresh ? 1 : 0) - (a.fresh ? 1 : 0); });
    L.forEach(function (x) { if (by[x.d]) { by[x.d].push(x); } });
    want.forEach(function (lv) { var x = by[lv] ? by[lv].shift() : null; if (x) { out.push(x); } });
    L.forEach(function (x) { if (out.length < CHAL_N && out.indexOf(x) === -1) { out.push(x); } });
    var rank = { E: 0, M: 1, H: 2 };
    return out.sort(function (a, b) { return (rank[a.d] || 0) - (rank[b.d] || 0); }).map(function (x) { return x.id; });
  }
  function chalHistHTML() {
    var A = chalAll(), keys = Object.keys(A).filter(function (k) { return isObj(A[k]) && typeof A[k].r === 'number'; }).sort(function (a, b) { return (A[b].lt || 0) - (A[a].lt || 0); }).slice(0, 5);
    var rows = keys.map(function (k) {
      var r = A[k], C = chalFromRec(r);
      if (!C) { return ''; }
      var f = Array.isArray(r.f) && Array.isArray(r.f[0]) && typeof r.f[0][1] === 'number' && r.f[0][1] <= C.n ? r.f[0] : null;
      var href = !r.mine && f ? chalLink(C.s, C.q, f[1], f[0]) : chalLink(C.s, C.q, r.r, chalMyName());
      return '<li><a href="' + esc(href.slice(href.indexOf('#'))) + '"><b>' + chalSubj(C.s) + ' · ' + plural(C.n, 'question') + (r.mine ? ', made by you' : f && f[0] ? ', from ' + esc(chalName(f[0])) : '') + '</b>' +
        '<span>You ' + chalOf(r.r, C.n) + (f && typeof f[1] === 'number' ? ' · ' + esc(chalName(f[0]) || 'A friend') + ' ' + chalOf(f[1], C.n) : '') + ' · ' + setsDay(Number(r.lt || r.t) || Date.now()) + '</span></a></li>';
    }).join('');
    return rows ? '<section class="chal-hist"><h3 class="h3">Your challenges</h3><ul class="chal-list">' + rows + '</ul></section>' : '';
  }
  function chalBuild(pre) {
    if (pre && PSUB[pre]) { chalSet.s = pre; chalSet.t = 'all'; }
    chalNow = null;
    chalPage('<header class="chal-head"><p class="eyebrow">Practice with friends</p><h2 class="vtitle">Challenge a friend</h2>' +
        '<p class="lede">Answer five real SAT questions, then send them to a friend. They answer the same five, and you both see who got more right.</p></header>' +
      '<form class="chal-card chal-form" id="chal-form">' +
        seg('chal-s', '1 · Subject', [['m', 'Math'], ['rw', 'Reading &amp; Writing']], chalSet.s) +
        '<div id="chal-tbox">' + seg('chal-t', '2 · Topic', chalTopics(chalSet.s), chalSet.t) + '</div>' +
        seg('chal-d', '3 · How hard', [['mix', 'A mix'], ['E', 'Easy'], ['M', 'Medium'], ['H', 'Hard']], chalSet.d) +
        '<p class="chal-count" id="chal-count" aria-live="polite"></p>' +
        '<p class="row"><button class="btn big" type="submit" id="chal-start">Pick 5 questions and start</button></p>' +
        '<p class="fine">There is no clock. You go first, so your friend has a score to beat.</p>' +
      '</form>' +
      '<ol class="chal-how"><li><b>You answer</b> five real SAT questions.</li><li><b>You send the link</b> to a friend, in any app.</li><li><b>They answer the same five</b> and see who won. They can send their score back.</li></ol>' +
      chalHistHTML() +
      '<p class="fine chal-note">No account is needed, for you or your friend. The link holds the questions and your score, and nothing about a challenge is sent to SAT Sprint.</p>');
    var form = $('#chal-form');
    function read() {
      var r = function (n) { var el = $('input[name="' + n + '"]:checked', form); return el ? el.value : ''; };
      return { s: r('chal-s') === 'rw' ? 'rw' : 'm', t: r('chal-t') || 'all', d: r('chal-d') || 'mix' };
    }
    function count() {
      var st = read(), n = chalPool(st.s, st.t, st.d).length, msg = $('#chal-count');
      msg.textContent = n < 3 ? 'Not enough questions match. Choose another topic or level.' : n < CHAL_N ? 'Only ' + n + ' questions match, so this challenge will have ' + n + '.' : '';
      $('#chal-start').disabled = n < 3;
    }
    form.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'chal-s') { $('#chal-tbox').innerHTML = seg('chal-t', '2 · Topic', chalTopics(read().s), 'all'); }
      chalSet = read();
      count();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var st = read(), ids = chalPick(chalPool(st.s, st.t, st.d), st.d);
      chalSet = st;
      if (ids.length < 3) { return; }
      var C = chalMake(st.s, ids, null, '');
      C.mine = true;
      chalPlay(C);
    });
    count();
  }

  /* ---------- #ch-…: a challenge link ---------- */
  function chalOpen(token) {
    var C = chalParse(token);
    if (!C) {
      chalNow = null;
      chalPage('<header class="chal-head"><p class="eyebrow">Challenge a friend</p><h2 class="vtitle">This link doesn’t work</h2>' +
        '<p class="lede">Part of it may have been cut off when it was copied. Ask your friend to send it again, or make a challenge of your own.</p></header>' +
        '<p class="row chal-row"><a class="btn big" href="#challenge">Make a challenge</a><a class="btn ghost" href="#home">Go to Home</a></p>');
      return;
    }
    var r = chalRec(C), I = chalInfo(C), me = chalMyName().toLowerCase();
    chalNow = C;
    /* the student's own link, opened again */
    if (r && r.mine && C.score === r.r && C.by.toLowerCase() === me) {
      C.mine = true;
      chalPage('<header class="chal-head"><p class="eyebrow">Your challenge · ' + chalSubj(C.s) + '</p><h2 class="vtitle">You got ' + chalOf(r.r, C.n) + '</h2>' +
          '<p class="lede">' + esc(I.topic) + ' · ' + I.levels + '. Send it to a friend and see if they can beat you.</p></header>' +
        '<div class="chal-card">' + chalFriendsHTML(r, C.n) + chalShareHTML(C, r.r, null) + '</div>' +
        '<p class="row chal-row"><button class="btn ghost" type="button" data-chal-go>Play it again</button><a class="btn ghost" href="#challenge-' + C.s + '">Make a new challenge</a></p>');
      return;
    }
    /* a friend's challenge or a friend's score, on a challenge this device has played */
    if (r) {
      chalFriend(r, C); save();
      chalPage('<header class="chal-head"><p class="eyebrow">Challenge · ' + chalSubj(C.s) + '</p><h2 class="vtitle">You vs ' + esc(C.by || 'your friend') + '</h2>' +
          '<p class="lede">' + esc(I.topic) + ' · ' + I.levels + '. Your first try is your score.</p></header>' +
        '<div class="chal-card">' + chalVsHTML(r.r, C.score, C.n, C.by) +
          (r.mine ? '' : '<h3 class="h3">Send your score back</h3>' + chalShareHTML(C, r.r, C.by)) + '</div>' +
        '<p class="row chal-row"><a class="btn' + (r.mine ? '' : ' ghost') + '" href="#challenge-' + C.s + '">Make a new challenge</a>' +
          (r.mine ? '<a class="btn ghost" href="' + esc(chalLink(C.s, C.q, r.r, chalMyName()).replace(/^[^#]*/, '')) + '">Send it to another friend</a>' : '') + '<button class="btn ghost" type="button" data-chal-go>Play it again</button></p>');
      /* playing again from here is playing one's own challenge again */
      if (r.mine) { C.mine = true; C.score = r.r; C.by = chalMyName(); }
      return;
    }
    var who = esc(C.by || 'A friend'), they = esc(C.by || 'Your friend');
    chalPage('<header class="chal-head"><p class="eyebrow">A challenge for you</p><h2 class="vtitle">' + who + ' challenged you</h2>' +
        '<p class="lede">' + plural(C.n, 'real SAT ' + chalSubj(C.s) + ' question') + '. ' + they + ' got ' + chalOf(C.score, C.n) + ' right. ' + (C.score === C.n ? 'Can you match it?' : 'Can you beat it?') + '</p></header>' +
      '<div class="chal-card chal-start">' +
        '<dl class="chal-facts"><div><dt>Subject</dt><dd>' + chalSubj(C.s) + '</dd></div><div><dt>Topic</dt><dd>' + esc(I.topic) + '</dd></div><div><dt>Questions</dt><dd>' + I.levels + '</dd></div><div><dt>Clock</dt><dd>None. Take your time.</dd></div></dl>' +
        '<div class="chal-beat"><span class="label">Score to beat</span><b>' + chalOf(C.score, C.n) + '</b></div>' +
        '<p class="row"><button class="btn big" type="button" data-chal-go>Start the challenge</button></p>' +
        '<p class="fine">After each question you see the right answer and how to solve it.</p>' +
      '</div>' +
      '<p class="chal-about">New to SAT Sprint? It is a free place to get ready for the SAT, with nothing to buy and no sign-up. Your answers stay on this device.</p>' +
      '<p class="row chal-row"><a class="btn ghost" href="#challenge">Make my own challenge</a><a class="btn ghost" href="#home">See the whole site</a></p>');
  }

  /* ---------- the end of a set: the score, who won, and the link to send ---------- */
  /* rows: the answered questions, [{ id, ok }]. Called from mpSummary (math.js) and timedFinish (practice.js). */
  function chalEndHTML(C, rows) {
    chalNow = C;
    var n = rows.length, right = rows.filter(function (x) { return x.ok; }).length;
    if (n < C.n) {
      return '<section class="chal-card chal-end"><h3 class="h3">The challenge isn’t finished</h3><p>You answered ' + chalOf(n, C.n) + '. A challenge counts once every question is answered.</p>' +
        '<p class="row"><button class="btn" type="button" data-chal-go>Start the challenge again</button></p></section>';
    }
    if (!C.kept) { C.kept = { had: !!chalRec(C) }; C.kept.r = chalKeep(C, right); }
    var r = C.kept.r, again = C.kept.had ? '<p class="fine">This time you got ' + chalOf(right, C.n) + '. Your first try, ' + chalOf(r.r, C.n) + ', is your score in this challenge.</p>' : '';
    if (C.mine) {
      return '<section class="chal-card chal-end"><p class="eyebrow">Your challenge is ready</p><h3 class="h2">Now send it to a friend</h3>' +
        '<p>You got <b>' + chalOf(r.r, C.n) + '</b>. Your friend answers the same ' + C.n + ' questions and sees if they can beat you.</p>' + again + chalShareHTML(C, r.r, null) + '</section>';
    }
    return '<section class="chal-card chal-end">' + chalVsHTML(r.r, C.score, C.n, C.by) + again +
      '<h3 class="h3">Send your score back</h3>' + chalShareHTML(C, r.r, C.by) +
      '<p><a class="linkbtn" href="#challenge-' + C.s + '">Make a new challenge</a></p></section>';
  }
  /* after an ordinary set of 3 to 10 questions: send the same questions to a friend */
  function chalOfferHTML(s, rows) {
    if (rows.length < 3 || rows.length > 10) { return ''; }
    var seen = {}, ok = rows.every(function (x) { if (seen[x.id] || !PSUB[s].valid(x.id)) { return false; } seen[x.id] = 1; return true; });
    if (!ok) { return ''; }
    var right = rows.filter(function (x) { return x.ok; }).length;
    return '<section class="chal-card chal-offer" data-chal-s="' + s + '" data-chal-q="' + rows.map(function (x) { return x.id; }).join('') + '" data-chal-r="' + right + '">' +
      '<h3 class="h3">Challenge a friend with these</h3><p>Send these ' + rows.length + ' questions to a friend and see who gets more right. You got ' + chalOf(right, rows.length) + '.</p>' +
      '<p class="row"><button class="btn ghost" type="button" data-chal-from>Challenge a friend</button></p></section>';
  }

  /* ---------- sending ---------- */
  function chalPanelLink(p) { return chalLink(p.getAttribute('data-chal-s'), p.getAttribute('data-chal-q'), p.getAttribute('data-chal-r'), chalMyName()); }
  function chalPanelText(p) {
    var s = p.getAttribute('data-chal-s') === 'm' ? 'Math' : 'Reading and Writing', sc = chalOf(p.getAttribute('data-chal-r'), p.getAttribute('data-chal-n'));
    return p.hasAttribute('data-chal-to') ? 'I got ' + sc + ' on your SAT ' + s + ' challenge. Open it to see who won.' : 'I got ' + sc + ' on these SAT ' + s + ' questions. Can you beat me?';
  }
  function chalCopyOld(inp) {
    var ok = false;
    try { inp.focus(); inp.select(); ok = document.execCommand('copy'); } catch (e) {}
    return ok;
  }
  function chalCopy(p) {
    var msg = $('.chal-msg', p), box = $('.chal-urlf', p), inp = $('.chal-url', p), url = chalPanelLink(p);
    inp.value = url;
    function done(ok) {
      if (ok) { box.hidden = true; msg.textContent = 'Copied. Paste it into a message to your friend.'; return; }
      box.hidden = false; focusQuiet(inp); try { inp.select(); } catch (e) {}
      msg.textContent = 'Copy the link below, then paste it into a message to your friend.';
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { done(true); }, function () { box.hidden = false; done(chalCopyOld(inp)); });
        return;
      }
    } catch (e) {}
    box.hidden = false; done(chalCopyOld(inp));
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-chal-go],[data-chal-from],[data-chal-send],[data-chal-copy]') : null;
    if (!b) { return; }
    if (b.hasAttribute('data-chal-go')) { if (chalNow) { chalPlay(chalNow); } return; }
    if (b.hasAttribute('data-chal-from')) {
      var o = b.closest('.chal-offer'), s = o.getAttribute('data-chal-s'), C = chalMake(s, o.getAttribute('data-chal-q').match(/.{8}/g), null, '');
      C.mine = true;
      var r = chalRec(C) || chalKeep(C, Number(o.getAttribute('data-chal-r')) || 0);
      chalNow = C;
      o.classList.remove('chal-offer');
      o.innerHTML = '<p class="eyebrow">Your challenge is ready</p><h3 class="h2">Now send it to a friend</h3><p>You got <b>' + chalOf(r.r, C.n) + '</b>. Your friend answers the same ' + C.n + ' questions and sees if they can beat you.</p>' + chalShareHTML(C, r.r, null);
      focusQuiet($('.chal-name', o));
      return;
    }
    var p = b.closest('.chal-share');
    if (!p) { return; }
    save();
    if (b.hasAttribute('data-chal-copy')) { chalCopy(p); return; }
    try {
      navigator.share({ title: 'SAT Sprint challenge', text: chalPanelText(p), url: chalPanelLink(p) }).then(function () {
        $('.chal-msg', p).textContent = p.hasAttribute('data-chal-to') ? 'Sent. ' + (p.getAttribute('data-chal-to') || 'Your friend') + ' will see who won.' : 'Sent. Now wait for their score.';
      }, function (err) { if (!err || err.name !== 'AbortError') { chalCopy(p); } });
    } catch (err) { chalCopy(p); }
  });
  /* the name goes into every link on the page as it is typed, and is kept when the box is left */
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains('chal-name')) { return; }
    store.s.chn = chalName(t.value);
    $$('.chal-share').forEach(function (p) { var u = $('.chal-url', p); if (u) { u.value = chalPanelLink(p); } $('.chal-msg', p).textContent = ''; });
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t || !t.classList || !t.classList.contains('chal-name')) { return; }
    store.s.chn = chalName(t.value);
    $$('.chal-name').forEach(function (x) { x.value = store.s.chn; });
    save();
  });
