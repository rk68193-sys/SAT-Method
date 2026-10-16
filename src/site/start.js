  /* =================== Start =================== */
  function jobRowsHTML() {
    var byName = {};
    RD.jobs.forEach(function (j) { byName[j.name] = j; });
    var n = function (name) { var j = byName[name]; return j ? Number((j.meta.match(/^(\d+)/) || [0, 0])[1]) : 0; };
    var row = function (o) {
      return '<a class="jrow" href="#' + o.href + '"><span class="jq">' + o.stem + '</span><span class="jj"><b>' + o.job + '</b><span>' + o.routine + '</span></span><span class="jn">' + o.n + '</span></a>';
    };
    var groups = [
      { title: 'Information and Ideas', rows: [
        { stem: 'Which choice best states the main idea of the text?', job: 'Main idea', routine: 'Reading routine', n: n('Main idea'), href: 'job-main' },
        { stem: 'According to the text, … ? · Based on the text, … ? · It can most reasonably be inferred from the text that …?', job: 'Detail', routine: 'Reading routine', n: n('Detail'), href: 'job-detail' },
        { stem: 'Which choice most logically completes the text?', job: 'Inference', routine: 'Reading routine', n: n('Inference'), href: 'job-inference' },
        { stem: 'Which finding, if true, would most directly support / weaken …?', job: 'Support or weaken', routine: 'Reading routine', n: n('Support') + n('Weaken'), href: 'job-support' },
        { stem: 'Which quotation … most effectively illustrates the claim?', job: 'Quotation', routine: 'Reading routine', n: n('Quotation'), href: 'job-quote' },
        { stem: 'Which choice most effectively uses data from the table / graph …?', job: 'Table or graph', routine: 'Reading routine', n: n('Table or graph'), href: 'job-data' }] },
      { title: 'Craft and Structure', rows: [
        { stem: '… the most logical and precise word or phrase?', job: 'Word', routine: 'Reading routine', n: n('Word'), href: 'job-word' },
        { stem: 'main purpose · overall structure · function of the underlined sentence', job: 'Purpose or structure', routine: 'Reading routine', n: n('Purpose or structure'), href: 'job-structure' },
        { stem: 'Based on the texts, how would the author of Text 2 …?', job: 'Two texts', routine: 'Reading routine', n: n('Two texts'), href: 'job-cross' }] },
      { title: 'Expression of Ideas', rows: [
        { stem: '… uses relevant information from the notes to accomplish this goal?', job: 'Notes', routine: 'Reading routine', n: n('Notes'), href: 'job-notes' },
        { stem: '… completes the text with the most logical transition?', job: 'Transition', routine: '60-second method', n: partStats.C.q, href: 'part-c' }] },
      { title: 'Standard English Conventions', rows: [
        { stem: '… so that it conforms to the conventions of Standard English?', job: 'Grammar', routine: '60-second method', n: partStats.A.q + partStats.B.q, href: 'method' }] }
    ];
    return groups.map(function (g) {
      var sum = g.rows.reduce(function (a, r) { return a + r.n; }, 0);
      return '<div class="jgroup"><p class="label">' + g.title + ' · ' + sum.toLocaleString('en-US') + ' questions</p>' + g.rows.map(row).join('') + '</div>';
    }).join('');
  }
  function pathHTML() {
    var dj = store.d.job, gl = countDone(), rl = countReadDone();
    var g = timedRecord('t', EXLIST.map(function (e) { return e.q; })), r = timedRecord('r', RLIST.map(function (x) { return x.qid; }));
    var items = [
      ['Name the job', 'A four-second drill on the question line alone: which job, which routine.', lastLine(dj) || drillCount('job') + ' cards · not tried yet', '<a class="btn sm" href="#drills" data-drill="job">Start the drill</a>'],
      ['Learn the 60-second method', 'Grammar and transition questions: see what changes in the choices, run one check. Nineteen lessons cover every rule.', gl + ' of ' + NC + ' grammar lessons done', '<a class="btn sm ghost" href="#method">Open the method</a>'],
      ['Learn the reading routine', 'Job, Chunk, Say, Check, with long sentences taken apart and seventeen worked examples.', rl + ' of ' + RLIST.length + ' worked examples studied', '<a class="btn sm ghost" href="#reading">Open the routine</a>'],
      ['Drill the slow steps', Object.keys(DR).length + ' drills on real questions: name the job, tag the sentence, find the core, find the Point, notes goal first, spot the pattern, name the link and more.', Object.keys(DR).filter(function (k) { return isObj(store.d[k]); }).length + ' of ' + Object.keys(DR).length + ' drills tried', '<a class="btn sm ghost" href="#drills">See the drills</a>'],
      ['Practice against the clock', 'Real questions with the clock running, then the fast path or the walkthrough.', (g.tried + r.tried) ? (g.tried + r.tried) + ' tried · ' + (g.right + r.right) + ' right last time' : (EXLIST.length + RLIST.length) + ' questions · not tried yet', '<a class="btn sm ghost" href="#practice">Start a set</a>']
    ];
    return items.map(function (it, i) {
      return '<li><span class="pn">' + (i + 1) + '</span><div class="pd"><b>' + it[0] + '</b><p>' + it[1] + '</p><p class="ps">' + it[2] + '</p></div>' + it[3] + '</li>';
    }).join('');
  }
  function refreshPath() { var p = document.getElementById('path'); if (p) { p.innerHTML = pathHTML(); } }
  function buildStart() {
    if (built.start) { return; }
    built.start = true;
    var total = TOTAL.q + RTOTAL;
    viewEl.start.innerHTML = '<div class="wrap">' +
      '<section class="hero"><div><p class="eyebrow">SAT Reading and Writing · the whole section</p>' +
      '<h1>Every Reading and Writing question, <span class="u">one routine at a time</span>.</h1>' +
      '<p class="lede">The question line tells you which of two routines to run: the 60-second method for grammar and transitions, or four steps for a reading passage. Learn both, drill the slow steps, then practice against the clock.</p>' +
      '<div class="row"><a class="btn" href="#which">Which routine?</a><a class="btn ghost" href="#try">Try a question</a></div>' +
      '<p class="facts">Built from ' + total.toLocaleString('en-US') + ' questions in College Board’s SAT Suite Question Bank: ' + TOTAL.q + ' grammar and transition questions sorted into ' + TOTAL.u + ' rules, and ' + RTOTAL.toLocaleString('en-US') + ' reading questions sorted by job.</p></div>' +
      '<div class="dials"><figure class="dial duo">' + dialSVG(GRAMMAR_DIAL) + '<figcaption><p class="label">Grammar · 60 seconds</p><ol class="dlegend">' +
      '<li><i class="sw-look"></i><span><b>5 sec · Look</b>What changes?</span></li><li><i class="sw-check"></i><span><b>40 sec · Check</b>Run one check</span></li><li><i class="sw-confirm"></i><span><b>15 sec · Confirm</b>Reread it</span></li></ol></figcaption></figure>' +
      '<figure class="dial duo">' + dialSVG(READING_DIAL) + '<figcaption><p class="label">Reading · 70 seconds</p><ol class="dlegend">' +
      '<li><i class="sw-look"></i><span><b>5 sec · Job</b>The question first</span></li><li><i class="sw-check"></i><span><b>35 sec · Chunk</b>Tag each sentence</span></li><li><i class="sw-say"></i><span><b>10 sec · Say</b>Your answer first</span></li><li><i class="sw-confirm"></i><span><b>20 sec · Check</b>Every piece needs a line</span></li></ol></figcaption></figure></div></section>' +
      '<div class="budget"><span class="big">71 s</span><p>Each Reading and Writing module gives you 32 minutes for 27 questions, about 71 seconds each. Grammar and transition questions can take under a minute, which leaves the extra seconds for the passages that need them. Both splits are targets to practice against, not measurements. <a href="#reading">How the reading routine spends them</a></p></div>' +
      '<section class="sec" id="which"><div class="sech"><p class="eyebrow">The first five seconds</p><h2 class="h2">Read the question line first. It names the routine.</h2>' +
      '<p class="lede">The wording of each kind of question barely changes from test to test. Match the line, and you know the job, the routine and where to look before you read the passage. The number is how many questions of that kind are in the bank.</p></div>' +
      '<div class="jtable">' + jobRowsHTML() + '</div><p class="row" style="margin-top:1rem"><a class="btn sm" href="#drills" data-drill="job">Drill it: Name the job</a></p></section>' +
      '<section class="sec"><div class="sech"><p class="eyebrow">Train in this order</p><h2 class="h2">From the question line to a full set</h2>' +
      '<p class="lede">' + (canStore ? 'Your progress is saved in this browser only.' : 'Your progress lasts until you close this page.') + '</p></div><ol class="path" id="path">' + pathHTML() + '</ol></section>' +
      '</div>';
  }
