  /* =================== The course: each subject's lessons in one order, with Previous, Next and a done tick =================== */
  /* Reading and Writing, Grammar and Math lessons were three systems with three ways of moving on. This is the one list
     they all share: courseList gives a subject's lessons in order, the bar under every lesson (courseBarHTML) moves
     through it, and the study plan hands out the next lesson not yet done. Grammar lessons keep their marks in store.l as
     before; the rest are in store.s.ld[address] = 1. Subjects use the plan's names, 'm' and 'rw'. */
  var COURSE_READ = [['routine', 'Four steps for any reading question'], ['job', 'Step 1: Job'], ['chunk', 'Step 2: Chunk'], ['long', 'Long sentences: core first'], ['para', 'Long passages: make them make sense'], ['say', 'Step 3: Say'], ['check', 'Step 4: Check']];
  var courseMemo = {};
  function courseList(subj) {
    if (courseMemo[subj]) { return courseMemo[subj]; }
    var L = [];
    if (subj === 'm') {
      MD.domains.forEach(function (d) { d.skills.forEach(function (k) { L.push({ tok: 'm-' + k, name: MSK[k].name, part: d.name }); }); });
    } else {
      COURSE_READ.forEach(function (r) { L.push({ tok: r[0], name: r[1], part: 'Reading' }); });
      L.push({ tok: 'method', name: 'Grammar: the 60-second method', part: 'Grammar' });
      CONCEPTS.forEach(function (c) { L.push({ tok: c.id, name: plain(c.title), part: 'Grammar', gid: c.id }); });
    }
    courseMemo[subj] = L;
    return L;
  }
  function courseAt(subj, tok) { var L = courseList(subj); for (var i = 0; i < L.length; i += 1) { if (L[i].tok === tok) { return i; } } return -1; }
  function courseMarks() { if (!isObj(store.s.ld)) { store.s.ld = {}; } return store.s.ld; }
  function courseDone(subj, tok) {
    var i = courseAt(subj, tok);
    if (i < 0) { return false; }
    var e = courseList(subj)[i];
    return e.gid ? !!store.l[e.gid] : !!courseMarks()[tok];
  }
  function courseSet(subj, tok, on) {
    var i = courseAt(subj, tok);
    if (i < 0) { return; }
    var e = courseList(subj)[i], M = courseMarks();
    if (e.gid) { if (on) { store.l[e.gid] = 1; } else { delete store.l[e.gid]; } }
    else if (on) { M[tok] = 1; } else { delete M[tok]; }
    save();
  }
  function courseCount(subj) { var L = courseList(subj), n = 0; L.forEach(function (e) { if (courseDone(subj, e.tok)) { n += 1; } }); return { done: n, of: L.length }; }
  /* the first lesson not yet done, or null when every one is */
  function courseNext(subj) { var L = courseList(subj); for (var i = 0; i < L.length; i += 1) { if (!courseDone(subj, L[i].tok)) { return { i: i, e: L[i] }; } } return null; }
  function courseDoneLabel(on) { return on ? 'Lesson done ✓' : 'Mark this lesson done'; }
  /* the bar under a lesson: where you are in the course, the way back and forward, and the done button */
  function courseBarHTML(subj, tok) {
    var i = courseAt(subj, tok);
    if (i < 0) { return ''; }
    var L = courseList(subj), p = L[i - 1], n = L[i + 1], d = courseDone(subj, tok), c = courseCount(subj);
    return '<nav class="lbar" aria-label="Lessons" data-csubj="' + subj + '" data-ctok="' + esc(tok) + '">' +
      '<p class="lbar-at"><b>Lesson ' + (i + 1) + ' of ' + L.length + '</b><span class="lbar-n">' + c.done + ' done so far</span></p>' +
      '<div class="lbar-row">' +
        (p ? '<a class="btn ghost lbar-prev" href="#' + p.tok + '"><span aria-hidden="true">←</span><span><span class="lbar-k">Previous</span>' + esc(p.name) + '</span></a>' : '<span class="lbar-gap"></span>') +
        '<button type="button" class="btn ghost donebtn lbar-done" data-cdone aria-pressed="' + (d ? 'true' : 'false') + '">' + courseDoneLabel(d) + '</button>' +
        (n ? '<a class="btn lbar-next" href="#' + n.tok + '"><span><span class="lbar-k">Next lesson</span>' + esc(n.name) + '</span><span aria-hidden="true">→</span></a>'
           : '<a class="btn lbar-next" href="#' + (subj === 'm' ? 'm-practice' : 'practice') + '"><span><span class="lbar-k">That was the last lesson</span>Practice real questions</span><span aria-hidden="true">→</span></a>') +
      '</div></nav>';
  }
  /* where you are in a subject's lessons: how many are done, a bar, and the one to open next */
  function courseCardHTML(subj) {
    var c = courseCount(subj), nx = courseNext(subj), pct = Math.round(100 * c.done / c.of);
    return '<div class="ccard"><div class="ccard-t"><p class="label">Lessons</p><p class="ccard-n"><b>' + c.done + ' of ' + c.of + '</b> done</p>' +
      '<div class="ccard-bar" role="img" aria-label="' + c.done + ' of ' + c.of + ' lessons done"><i style="width:' + pct + '%"></i></div></div>' +
      (nx ? '<a class="btn" href="#' + nx.e.tok + '"><span><span class="lbar-k">' + (c.done ? 'Continue with lesson ' : 'Start with lesson ') + (nx.i + 1) + '</span>' + esc(nx.e.name) + '</span><span aria-hidden="true">→</span></a>'
          : '<p class="ccard-all">Every lesson is done. Well done.</p>') + '</div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-cdone]') : null;
    if (!b) { return; }
    var bar = b.closest('.lbar'), subj = bar.getAttribute('data-csubj'), tok = bar.getAttribute('data-ctok');
    var on = !courseDone(subj, tok);
    courseSet(subj, tok, on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = courseDoneLabel(on);
    var cn = $('.lbar-n', bar); if (cn) { cn.textContent = courseCount(subj).done + ' done so far'; }
    try { if (subj === 'rw') { grammarView.refresh(); readingView.refresh(); } } catch (err) {}
    try { if (typeof pzSoon === 'function') { pzSoon(); } } catch (err2) {}
  });
