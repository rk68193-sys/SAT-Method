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
        { stem: 'Which choice best states the main idea of the text?', job: 'Main idea', routine: 'Reading steps', n: n('Main idea'), href: 'job-main' },
        { stem: 'According to the text, … ? · Based on the text, … ? · It can most reasonably be inferred from the text that …?', job: 'Detail', routine: 'Reading steps', n: n('Detail'), href: 'job-detail' },
        { stem: 'Which choice most logically completes the text?', job: 'Inference', routine: 'Reading steps', n: n('Inference'), href: 'job-inference' },
        { stem: 'Which finding, if true, would most directly support / weaken …?', job: 'Support or weaken', routine: 'Reading steps', n: n('Support') + n('Weaken'), href: 'job-support' },
        { stem: 'Which quotation … most effectively illustrates the claim?', job: 'Quotation', routine: 'Reading steps', n: n('Quotation'), href: 'job-quote' },
        { stem: 'Which choice most effectively uses data from the table / graph …?', job: 'Table or graph', routine: 'Reading steps', n: n('Table or graph'), href: 'job-data' }] },
      { title: 'Craft and Structure', rows: [
        { stem: '… the most logical and precise word or phrase?', job: 'Word', routine: 'Reading steps', n: n('Word'), href: 'job-word' },
        { stem: 'main purpose · overall structure · function of the underlined sentence', job: 'Purpose or structure', routine: 'Reading steps', n: n('Purpose or structure'), href: 'job-structure' },
        { stem: 'Based on the texts, how would the author of Text 2 …?', job: 'Two texts', routine: 'Reading steps', n: n('Two texts'), href: 'job-cross' }] },
      { title: 'Expression of Ideas', rows: [
        { stem: '… uses relevant information from the notes to accomplish this goal?', job: 'Notes', routine: 'Reading steps', n: n('Notes'), href: 'job-notes' },
        { stem: '… completes the text with the most logical transition?', job: 'Transition', routine: 'Grammar method', n: partStats.C.q, href: 'part-c' }] },
      { title: 'Standard English Conventions', rows: [
        { stem: '… so that it conforms to the conventions of Standard English?', job: 'Grammar', routine: 'Grammar method', n: partStats.A.q + partStats.B.q, href: 'method' }] }
    ];
    return groups.map(function (g) {
      var sum = g.rows.reduce(function (a, r) { return a + r.n; }, 0);
      return '<div class="jgroup"><p class="label">' + g.title + ' · ' + sum.toLocaleString('en-US') + ' questions</p>' + g.rows.map(row).join('') + '</div>';
    }).join('');
  }
  function pathHTML() {
    var gl = countDone(), rl = countReadDone(), dt = drillTried('rw').length, dn = drillsOf('rw').length;
    var g = practiceRecord('t', EXLIST.map(function (e) { return e.q; })), r = practiceRecord('r', RLIST.map(function (x) { return x.qid; }));
    var items = [
      ['Learn the reading steps', 'Four steps that work on any reading question, shown on ' + RLIST.length + ' real questions.', rl + ' of ' + RLIST.length + ' worked examples studied', '<a class="btn sm" href="#reading">Open the reading lessons</a>'],
      ['Learn the grammar method', 'A one-minute method for grammar questions, and ' + NC + ' short lessons on the rules.', gl + ' of ' + NC + ' grammar lessons done', '<a class="btn sm ghost" href="#lessons">Open the grammar lessons</a>'],
      ['Practice real questions', 'Start with 5 easy ones, with no clock. After each answer you see the right one and why.', (g.tried + r.tried) ? (g.tried + r.tried) + ' lesson questions tried · ' + (g.right + r.right) + ' right last time' : 'Not tried yet', '<a class="btn sm ghost" href="#rw-easy">Try 5 easy questions</a>'],
      ['Short exercises', 'Quick cards that each train one small step, such as saying what a question asks before you read.', dt + ' of ' + dn + ' exercises tried', '<a class="btn sm ghost" href="#drills">See the short exercises</a>'],
      ['Check your progress', 'See which kinds of question need more work, and practice just those.', '', '<a class="btn sm ghost" href="#rw-map">See my progress</a>']
    ];
    return items.map(function (it, i) {
      return '<li><span class="pn">' + (i + 1) + '</span><div class="pd"><b>' + it[0] + '</b><p>' + it[1] + '</p>' + (it[2] ? '<p class="ps">' + it[2] + '</p>' : '') + '</div>' + it[3] + '</li>';
    }).join('');
  }
  function refreshPath() { var p = document.getElementById('path'); if (p) { p.innerHTML = pathHTML(); } }
  function buildStart() {
    if (built.start) { return; }
    built.start = true;
    var total = TOTAL.q + RTOTAL;
    viewEl.start.innerHTML = '<div class="wrap">' +
      '<section class="hero"><div><p class="eyebrow">Reading &amp; Writing · Start here</p>' +
      '<h1>Every Reading and Writing question, <span class="u">one step at a time</span>.</h1>' +
      '<p class="lede">The test has two kinds of question. Reading questions ask about a short passage, and four steps work on all of them. Grammar questions ask you to fix a sentence, and a one-minute method works on them. Learn both without a clock first, then practice on real questions.</p>' +
      '<div class="row"><a class="btn big" href="#reading">Start the reading lessons</a><a class="btn big ghost" href="#rw-easy">Try 5 easy questions</a></div>' +
      '<p class="facts">Built from ' + total.toLocaleString('en-US') + ' real questions from College Board’s free SAT question bank: ' + TOTAL.q + ' grammar questions sorted into ' + TOTAL.u + ' rules, and ' + RTOTAL.toLocaleString('en-US') + ' reading questions sorted by what they ask.</p></div>' +
      '<div class="dials"><figure class="dial duo">' + dialSVG(GRAMMAR_DIAL) + '<figcaption><p class="label">Grammar · 60 seconds</p><ol class="dlegend">' +
      '<li><i class="sw-look"></i><span><b>5 sec · Look</b>What changes?</span></li><li><i class="sw-check"></i><span><b>40 sec · Check</b>Run one check</span></li><li><i class="sw-confirm"></i><span><b>15 sec · Confirm</b>Reread it</span></li></ol></figcaption></figure>' +
      '<figure class="dial duo">' + dialSVG(READING_DIAL) + '<figcaption><p class="label">Reading · 70 seconds</p><ol class="dlegend">' +
      '<li><i class="sw-look"></i><span><b>5 sec · Job</b>See what it asks</span></li><li><i class="sw-check"></i><span><b>35 sec · Chunk</b>Read it in pieces</span></li><li><i class="sw-say"></i><span><b>10 sec · Say</b>Your own answer, if it helps</span></li><li><i class="sw-confirm"></i><span><b>20 sec · Check</b>Check the choices</span></li></ol></figcaption></figure></div></section>' +
      '<section class="sec first"><div class="sech"><p class="eyebrow">Go in this order</p><h2 class="h2">Five steps, from your first lesson to a full practice set</h2>' +
      '<p class="lede">' + (canStore ? 'Your progress is saved ' + savedIn() + ', so you can stop and come back.' : 'Your progress lasts until you close this page.') + '</p></div><ol class="path" id="path">' + pathHTML() + '</ol></section>' +
      '<div class="budget"><span class="big">71 s</span><p>The real test gives you 32 minutes for 27 questions: about 71 seconds each. Grammar questions often take less than a minute, which leaves more time for the longer passages. These times are goals to work toward. While you learn, take all the time you need. <a href="#reading">How the reading steps use the time</a></p></div>' +
      '<section class="sec" id="which"><div class="sech"><p class="eyebrow">Before you read the passage</p><h2 class="h2">The question tells you what to do</h2>' +
      '<p class="lede">Each kind of question uses almost the same words on every test. Read the question first, and you know what to look for before you read the passage. The number is how many questions of that kind are in the practice bank.</p></div>' +
      '<div class="jtable">' + jobRowsHTML() + '</div><p class="row" style="margin-top:1rem"><a class="btn sm" href="#drills" data-drill="job">Practice this with the “Name the job” exercise</a></p></section>' +
      '</div>';
  }
