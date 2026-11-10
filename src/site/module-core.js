  /* =================== Timed modules: the parts Math and Reading & Writing share =================== */
  /* A run R holds one module: one clock for the whole set, movement back and forth, marks for review, a list of every
     question, and a last check before finishing. The subject supplies the rest:
       p         prefix for element ids ('mm' Math, 'rm' Reading & Writing), so both can be on the page at once
       host      element the module is drawn in;  wrap  class for the outer div
       n, limit  number of questions, seconds on the clock
       tools     extra buttons for the bar (html)
       kind(i)   short label for question i, such as "Multiple choice"
       answered(i), draw(i, body), finish(timeUp), alive() */
  function modNew(o) {
    var R = { i: 0, acc: 0, t0: 0, over: false, hide: false, warned: false, tick: null, tools: '', wrap: 'mmwrap', flag: [], spent: [] }, k;
    for (k in o) { if (Object.prototype.hasOwnProperty.call(o, k)) { R[k] = o[k]; } }
    for (k = 0; k < R.n; k += 1) { R.flag.push(false); R.spent.push(0); }
    return R;
  }
  function modEl(R, name) { return document.getElementById(R.p + '-' + name); }
  function modUsed(R) { return (R.acc + (R.t0 ? now() - R.t0 : 0)) / 1000; }
  /* stop both clocks: the module's, and the time spent on the question in view */
  function modBank(R) { if (R.t0) { var d = now() - R.t0; R.acc += d; R.spent[R.i] += d; R.t0 = 0; } }
  function modPause(R) { if (R && !R.over) { modBank(R); } }
  function modResume(R) { if (R && !R.over && !R.t0) { R.t0 = now(); } }
  function modTick(R) {
    if (R.over || !R.alive()) { clearInterval(R.tick); return; }
    var left = R.limit - modUsed(R), el = modEl(R, 'clock');
    if (left <= 0) { R.finish(true); return; }
    var late = left <= 300 && R.limit > 600;
    if (el) {
      el.textContent = R.hide && !late ? '–:––' : clock(Math.ceil(left));
      el.classList.toggle('late', late);
    }
    if (late && !R.warned) {
      R.warned = true;
      var live = modEl(R, 'live'), hb = modEl(R, 'hide');
      if (live) { live.textContent = '5 minutes left in this module.'; }
      if (hb) { hb.hidden = true; }
    }
  }
  function modStart(R) {
    modShell(R); modShow(R, 0);
    R.t0 = now();
    R.tick = setInterval(function () { modTick(R); }, 500);
    modTick(R);
  }
  /* stop for good; returns the seconds used */
  function modStop(R) { modBank(R); clearInterval(R.tick); R.over = true; return Math.min(R.limit, Math.round(R.acc / 1000)); }
  function modShell(R) {
    var p = R.p;
    R.host.innerHTML = '<div class="' + R.wrap + '">' +
      '<div class="mpbar mmbar"><span class="mpbar-pos" id="' + p + '-pos"></span>' +
        '<span class="mm-clockbox"><span class="mpclock" id="' + p + '-clock" role="timer" aria-label="Time left in this module">' + clock(R.limit) + '</span><button class="linkbtn" type="button" id="' + p + '-hide" aria-pressed="false">Hide clock</button></span>' +
        '<span class="mmbar-tools">' + R.tools + '<button class="btn ghost sm" type="button" id="' + p + '-open-nav" aria-expanded="false" aria-controls="' + p + '-nav">All questions</button><button class="linkbtn" type="button" id="' + p + '-finish">Finish</button></span>' +
        '<span class="sr" id="' + p + '-live" aria-live="polite"></span></div>' +
      '<section class="mm-nav" id="' + p + '-nav" aria-label="All questions in this module" tabindex="-1" hidden></section>' +
      '<article class="mpcard" id="' + p + '-card"></article></div>';
    modEl(R, 'hide').addEventListener('click', function () {
      R.hide = !R.hide;
      this.setAttribute('aria-pressed', R.hide ? 'true' : 'false'); this.textContent = R.hide ? 'Show clock' : 'Hide clock';
      modTick(R);
    });
    modEl(R, 'open-nav').addEventListener('click', function () { modNav(R, modEl(R, 'nav').hidden, false); });
    modEl(R, 'finish').addEventListener('click', function () { modNav(R, true, true); });
    modEl(R, 'nav').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-go],[data-mm-do]') : null;
      if (!b) { return; }
      if (b.hasAttribute('data-go')) { modNav(R, false, false); modGo(R, Number(b.getAttribute('data-go'))); return; }
      if (b.getAttribute('data-mm-do') === 'finish') { R.finish(false); } else { modNav(R, false, false); }
    });
  }
  function modNavOpen(R) { var el = modEl(R, 'nav'); return !!el && !el.hidden; }
  /* the list of every question; with confirm, it is also the last check before finishing */
  function modNav(R, open, confirm) {
    var host = modEl(R, 'nav'), btn = modEl(R, 'open-nav'), i;
    if (!host) { return; }
    host.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open) { return; }
    var blank = 0, flags = 0, cells = '';
    for (i = 0; i < R.n; i += 1) {
      var a = R.answered(i);
      if (!a) { blank += 1; }
      if (R.flag[i]) { flags += 1; }
      cells += '<button type="button" class="mm-n' + (a ? ' ans' : '') + (R.flag[i] ? ' flag' : '') + (i === R.i ? ' cur' : '') + '" data-go="' + i + '" aria-label="Question ' + (i + 1) + ', ' + (a ? 'answered' : 'no answer') + (R.flag[i] ? ', marked for review' : '') + (i === R.i ? ', the one you are on' : '') + '">' + (i + 1) + '</button>';
    }
    host.innerHTML = (confirm
      ? '<div class="mm-confirm"><p><b>Finish the module now?</b> ' + (blank ? plural(blank, 'question') + ' ' + (blank === 1 ? 'has' : 'have') + ' no answer' : 'Every question has an answer') + (flags ? ', and ' + flags + ' ' + (flags === 1 ? 'is' : 'are') + ' marked for review' : '') + '. You cannot change answers after this.</p>' +
        '<p class="row"><button class="btn" type="button" data-mm-do="finish">Finish and see my results</button><button class="btn ghost" type="button" data-mm-do="stay">Keep working</button></p></div>'
      : '') +
      '<p class="mm-nav-h"><b>All questions</b> <span class="muted">Tap a number to go to it.</span></p><div class="mm-nav-grid">' + cells + '</div>' +
      '<p class="mm-key"><span><i class="mm-n ans" aria-hidden="true"></i>Answered</span><span><i class="mm-n" aria-hidden="true"></i>No answer</span><span><i class="mm-n flag" aria-hidden="true"></i>Marked for review</span></p>';
    if (narrow() || confirm) { try { host.scrollIntoView({ block: 'start' }); } catch (e) {} }
    focusQuiet(confirm ? $('[data-mm-do="finish"]', host) : host);
  }
  function modGo(R, i) {
    if (!R || R.over || i < 0 || i >= R.n) { return; }
    var run = !!R.t0;
    modBank(R); modShow(R, i);
    if (run) { R.t0 = now(); }
  }
  function modNext(R) { if (R.i < R.n - 1) { modGo(R, R.i + 1); } else { modNav(R, true, true); } }
  function modShow(R, i) {
    R.i = i;
    var p = R.p, last = i === R.n - 1;
    modEl(R, 'pos').innerHTML = '<b>Question ' + (i + 1) + '</b> of ' + R.n;
    modEl(R, 'card').innerHTML = '<header class="mpcard-h"><b class="mm-qn">Question ' + (i + 1) + '</b><span class="muted">' + R.kind(i) + '</span>' +
        '<label class="checkline mm-flag"><input type="checkbox" id="' + p + '-flag"' + (R.flag[i] ? ' checked' : '') + '> Mark for review</label></header>' +
      '<div class="mm-body" id="' + p + '-body"></div>' +
      '<p class="row mm-step"><button class="btn ghost" type="button" id="' + p + '-back"' + (i ? '' : ' disabled') + '>Back</button><button class="btn" type="button" id="' + p + '-next">' + (last ? 'Review and finish' : 'Next') + '</button></p>';
    modEl(R, 'flag').addEventListener('change', function () { R.flag[R.i] = this.checked; });
    modEl(R, 'back').addEventListener('click', function () { modGo(R, R.i - 1); });
    modEl(R, 'next').addEventListener('click', function () { modNext(R); });
    R.draw(i, modEl(R, 'body'));
    window.scrollTo(0, 0);
  }
  /* the words on a retry button, when a set holds at most cap questions */
  function retryLabel(kind, n, cap) {
    var some = n > cap ? cap + ' of ' : '';
    if (kind === 'type') { return 'Retry ' + some + 'the ' + n + ' I missed'; }
    if (kind === 'all') { return 'Retry ' + (n > cap ? cap + ' of ' + n + ' missed questions' : plural(n, 'missed question')); }
    return 'Retry ' + (n === 1 ? 'this question' : some + 'these ' + n + ' questions');
  }
  /* how well a group of questions is going, from the last attempt at each */
  function levelOf(right, tried, n) {
    if (!tried) { return 'new'; }
    return right / tried < 0.6 ? 'weak' : (right / tried >= 0.85 && tried >= Math.min(3, n) ? 'strong' : 'mid');
  }

