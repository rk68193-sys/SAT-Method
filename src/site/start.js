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
    var gl = countDone(), rl = countReadDone();
    var g = practiceRecord('t', EXLIST.map(function (e) { return e.q; })), r = practiceRecord('r', RLIST.map(function (x) { return x.qid; }));
    var tried = g.tried + r.tried;
    var items = [
      ['Learn how to read the passages', 'Four simple steps work on every reading question. You will watch them used on ' + RLIST.length + ' real questions, one step at a time, before you try any yourself.', rl + ' of ' + RLIST.length + ' worked examples studied', '<a class="btn sm" href="#reading">Open the reading lessons</a>'],
      ['Learn the grammar method', 'Some questions ask you to fix a sentence. A one-minute method handles them, and ' + NC + ' short lessons each teach one rule, such as where a comma belongs.', gl + ' of ' + NC + ' grammar lessons done', '<a class="btn sm ghost" href="#lessons">Open the grammar lessons</a>'],
      ['Practice on real questions', 'Begin with 5 easy questions and no clock. After each answer you see which choice is right and the reason why. For a quick warm-up, the <a href="#drills">short exercises</a> train one small step at a time.', tried ? tried + ' lesson questions tried so far, ' + (g.right + r.right) + ' right the last time' : '', '<a class="btn sm ghost" href="#rw-easy">Try 5 easy questions</a>'],
      ['See how you are doing', 'The My progress page shows which kinds of question you are already good at and which ones need more practice, so you always know what to do next.', '', '<a class="btn sm ghost" href="#rw-map">See my progress</a>']
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
    var time = '<p>The real test gives you 32 minutes for each set of 27 questions. That works out to about 71 seconds a question. Grammar questions usually take less than a minute, which leaves extra time for the longer reading passages.</p>' +
      '<p>Treat these times as goals to grow into. While you are learning, take all the time you need. Speed comes later, with practice.</p>' +
      '<div class="dials"><figure class="dial duo">' + dialSVG(GRAMMAR_DIAL) + '<figcaption><p class="label">A grammar question: about 60 seconds</p><ol class="dlegend">' +
      '<li><i class="sw-look"></i><span><b>5 seconds · Look</b>See what changes between the choices.</span></li><li><i class="sw-check"></i><span><b>40 seconds · Check</b>Run the one check that settles it.</span></li><li><i class="sw-confirm"></i><span><b>15 seconds · Confirm</b>Read the sentence again with your answer in it.</span></li></ol></figcaption></figure>' +
      '<figure class="dial duo">' + dialSVG(READING_DIAL) + '<figcaption><p class="label">A reading question: about 70 seconds</p><ol class="dlegend">' +
      '<li><i class="sw-look"></i><span><b>5 seconds · Question</b>Read the question first.</span></li><li><i class="sw-check"></i><span><b>35 seconds · Passage</b>Read the passage a piece at a time.</span></li><li><i class="sw-say"></i><span><b>10 seconds · Your answer</b>Say it in your own words, if that helps.</span></li><li><i class="sw-confirm"></i><span><b>20 seconds · Choices</b>Check each choice against the passage.</span></li></ol></figcaption></figure></div>' +
      '<p><a href="#reading">See how the reading steps use the time</a></p>';
    var kinds = '<p>The SAT asks the same kinds of question on every test, and each kind is worded almost the same way every time. That is good news. Once you recognize a question, you know what to look for in the passage before you start reading.</p>' +
      '<p>The number beside each kind shows how many practice questions of that kind are on this site. Tap a kind to see how to handle it.</p>' +
      '<div class="jtable">' + jobRowsHTML() + '</div><p class="row" style="margin-top:1rem"><a class="btn sm" href="#drills" data-drill="job">Practice spotting them with the “Name the job” exercise</a></p>';
    var from = '<p>Every question on this site comes from College Board, the organization that writes the SAT. They publish a free bank of practice questions, and this site sorts all ' + total.toLocaleString('en-US') + ' of the Reading and Writing ones for you: ' + TOTAL.q + ' grammar questions grouped under ' + TOTAL.u + ' rules, and ' + RTOTAL.toLocaleString('en-US') + ' reading questions grouped by what they ask.</p>' +
      '<p>The answers and explanations are College Board’s own. The lessons and methods were written for this site by studying all of those questions.</p>';
    viewEl.start.innerHTML = '<div class="wrap">' +
      '<section class="hero hero-plain"><div><p class="eyebrow">Reading &amp; Writing · Start here</p>' +
      '<h1>Welcome to <span class="u">Reading and Writing</span></h1>' +
      '<p class="lede">This half of the SAT has 54 short questions. Most of them give you a short passage, about a paragraph long, and ask one question about it. The others ask you to fix a sentence so that its grammar and punctuation are correct.</p>' +
      '<p class="lede">You will learn a simple method for each kind and then practice on real questions. There is no rush. Learn everything without a clock first, and bring in the timer only when you feel ready.</p>' +
      '<div class="row"><a class="btn big" href="#reading">Start the reading lessons</a><a class="btn big ghost" href="#rw-easy">Try 5 easy questions</a></div></div></section>' +
      '<section class="sec first"><div class="sech"><p class="eyebrow">Your path</p><h2 class="h2">Four steps, in this order</h2>' +
      '<p class="lede">' + (canStore ? 'Take them one at a time. Your progress is saved ' + savedIn() + '. You can stop whenever you like and pick up where you left off.' : 'Take them one at a time. Your progress lasts until you close this page.') + '</p></div><ol class="path" id="path">' + pathHTML() + '</ol></section>' +
      '<section class="sec"><div class="sech"><p class="eyebrow">Good to know</p><h2 class="h2">Questions people ask before they start</h2>' +
      '<p class="lede">You do not need any of this to begin. Open one when you are curious.</p></div><div class="folds">' +
      foldHTML('howlong', 'How much time do I get for each question?', time) +
      foldHTML('which', 'What kinds of question will I see?', kinds) +
      foldHTML('wherefrom', 'Where do the questions come from?', from) +
      '</div></section>' +
      '</div>';
  }
