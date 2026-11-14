  /* =================== Both subjects: the days you practiced, the streak, and the question of the day =================== */
  /* store.s.days['2026-11-12'] = [Math answers, Reading and Writing answers] on that day, added to wherever an answer is saved. */
  function dayBump(d, t, i) { var k = dayKey(t), r = Array.isArray(d[k]) ? d[k] : [0, 0]; r[i] = (r[i] || 0) + 1; d[k] = r; }
  /* the days a set of saved answers can still tell: the last attempt at each question, on the day it was made */
  function daysFrom(d) {
    var out = {}, rw = {}, lo = 1.5e12, hi = Date.now() + DAY;
    Object.keys(isObj(d.m) ? d.m : {}).forEach(function (id) { var r = d.m[id]; if (Array.isArray(r) && r[2] > lo && r[2] < hi && MQBY[id]) { dayBump(out, r[2], 0); } });
    ['t', 'r', 'b'].forEach(function (b) {
      Object.keys(isObj(d[b]) ? d[b] : {}).forEach(function (id) { var x = d[b][id]; if (isObj(x) && x.at > lo && x.at < hi && x.at > (rw[id] || 0)) { rw[id] = x.at; } });
    });
    Object.keys(rw).forEach(function (id) { dayBump(out, rw[id], 1); });
    return out;
  }
  function daysAll() {
    if (!isObj(store.s.days)) { store.s.days = daysFrom(store); }
    return store.s.days;
  }
  /* every place that saves an answer calls this: the question's repeat is scheduled and the day is counted */
  function noteAnswer(subj, id, ok) {
    srNote(subj, id, ok);
    /* the answer is already saved, so a day log that is built just now has counted it */
    var built = isObj(store.s.days), d = daysAll();
    if (built) { dayBump(d, Date.now(), subj === 'm' ? 0 : 1); }
  }
  /* a card in a short exercise counts toward the day too, in its own subject */
  function noteDrill(subj) { dayBump(daysAll(), Date.now(), subj === 'math' ? 0 : 1); save(); }
  function dayCount(t) { var r = daysAll()[dayKey(t)]; return Array.isArray(r) ? [r[0] || 0, r[1] || 0] : [0, 0]; }
  function dayBefore(t) { var d = new Date(t); d.setDate(d.getDate() - 1); return dayStart(d.getTime()); }
  /* n: days in a row up to today; a streak is still alive if the last day was yesterday. best: the longest run on record. */
  function habitStreak() {
    var today = dayStart(Date.now()), did = function (t) { var c = dayCount(t); return c[0] + c[1] > 0; };
    var n = 0, t = did(today) ? today : dayBefore(today);
    while (did(t)) { n += 1; t = dayBefore(t); }
    var keys = Object.keys(daysAll()).filter(function (k) { var r = daysAll()[k]; return Array.isArray(r) && (r[0] || 0) + (r[1] || 0) > 0 && !isNaN(parseDay(k)); }).map(function (k) { return dayNo(parseDay(k)); }).sort(function (a, b) { return a - b; });
    var best = 0, run = 0;
    keys.forEach(function (k, i) { run = i && k === keys[i - 1] + 1 ? run + 1 : 1; if (run > best) { best = run; } });
    return { n: n, today: did(today), best: Math.max(best, n), days: keys.length };
  }
  function habitLine() {
    var s = habitStreak();
    if (!s.days) { return 'Answer one question to start a streak.'; }
    if (!s.n) { return 'No streak right now. Your longest so far is ' + plural(s.best, 'day') + '; one question today starts a new one.'; }
    return (s.today ? 'You have practiced ' + plural(s.n, 'day') + ' in a row, today included.' : 'Your streak is ' + plural(s.n, 'day') + '. Answer one question today to keep it.') + (s.best > s.n ? ' Your longest is ' + s.best + '.' : '');
  }
  /* the last weeks, a column a week, Sunday at the top; darker means more answers that day (questions and exercise cards) */
  function habitCalHTML(weeks) {
    var today = dayStart(Date.now()), start = new Date(today), cols = '', active = 0, total = 0;
    start.setDate(start.getDate() - start.getDay() - 7 * (weeks - 1));
    var d = new Date(start.getTime()), month = -1;
    for (var w = 0; w < weeks; w += 1) {
      var cells = '', label = '';
      for (var i = 0; i < 7; i += 1) {
        var t = d.getTime();
        if (i === 0 && d.getMonth() !== month && d.getDate() <= 7 + 6) { month = d.getMonth(); label = d.toLocaleDateString(undefined, { month: 'short' }); }
        if (t > today) { cells += '<i class="hcal-c none"></i>'; }
        else {
          var c = dayCount(t), n = c[0] + c[1], lv = !n ? 0 : n < 5 ? 1 : n < 10 ? 2 : n < 20 ? 3 : 4;
          if (n) { active += 1; total += n; }
          cells += '<i class="hcal-c l' + lv + (t === today ? ' now' : '') + '" title="' + d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) + ': ' + (n ? plural(n, 'answer') + ' (Math ' + c[0] + ', Reading &amp; Writing ' + c[1] + ')' : 'no practice') + '"></i>';
        }
        d.setDate(d.getDate() + 1);
      }
      cols += '<div class="hcal-w"><span class="hcal-m">' + label + '</span>' + cells + '</div>';
    }
    return '<div class="hcal" role="img" aria-label="Practice in the last ' + weeks + ' weeks: ' + plural(active, 'day') + ' with practice, ' + plural(total, 'answer') + ' given.">' + cols + '</div>' +
      '<p class="hcal-key"><span>Less</span><i class="hcal-c l0"></i><i class="hcal-c l1"></i><i class="hcal-c l2"></i><i class="hcal-c l3"></i><i class="hcal-c l4"></i><span>More</span><span class="muted">' + plural(active, 'day') + ' with practice in ' + weeks + ' weeks</span></p>';
  }
  /* one question a day in each subject, the same for everyone that day: Easy, Medium and Hard take turns */
  function qotd(subj) {
    var n = dayNo(Date.now()), want = 'EMH'[n % 3], pool;
    if (subj === 'm') { pool = MQ.filter(function (q) { return q.d === want && mtxHas(q.id); }); if (!pool.length) { pool = MQ; } }
    else { want = { E: 'Easy', M: 'Medium', H: 'Hard' }[want]; pool = rwItems().filter(function (it) { return it.d === want; }); }
    return pool[(n * 7919) % pool.length];
  }
  function qotdDone(subj, q) {
    var t = dayStart(Date.now());
    if (subj === 'm') { var r = mDone(q.id); return !!r && r[2] >= t; }
    var x = result(q);
    return !!x && (x.at || 0) >= t;
  }
  function habitHomeHTML() {
    var m = qotd('m'), r = qotd('rw'), s = habitStreak();
    function card(subj, q, href, what) {
      var done = qotdDone(subj, q);
      return '<a class="hqotd hqotd-' + (subj === 'm' ? 'math' : 'rw') + (done ? ' done' : '') + '" href="#' + href + '"><span class="label">' + (subj === 'm' ? 'Math' : 'Reading &amp; Writing') + ' · question of the day</span><b>' + esc(what) + '</b>' +
        '<span class="hqotd-s">' + (done ? '✓ Answered today' : 'Answer it →') + '</span></a>';
    }
    var rt = RWTBY[RWQT[r.id]];
    return '<section class="hsec htoday" id="htoday"><div class="hsec-h"><h2 class="h2">Today</h2><p class="muted">' + habitLine() + '</p></div>' +
      '<div class="htoday-grid">' +
        card('m', m, 'mq-' + m.id, MSK[m.k].name + ' · ' + MDIFF[m.d]) +
        card('rw', r, 'rq-' + r.id, (rt ? rt.name : 'Reading and Writing') + ' · ' + r.d) +
        '<div class="hstreak"><p class="hstreak-n"><b>' + s.n + '</b><span>' + (s.n === 1 ? 'day' : 'days') + ' in a row</span><span class="muted">longest: ' + s.best + '</span></p><div class="hstreak-cal">' + habitCalHTML(narrow() ? 13 : 26) + '</div></div>' +
      '</div><p class="htoday-foot">' + acctLinkHTML() + '<a href="#my-data">Back up my progress</a> · <a href="#my-data-offline">Use it offline</a></p></section>';
  }

