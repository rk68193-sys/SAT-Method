  /* =================== Help with this page ===================
     One Help button, in the same place on every page (WCAG 2.2 "Consistent Help"). It answers the few questions a
     first-time visitor has about the page they are on, and always ends with how to go back, whether an account is
     needed, and how to make the words bigger. */
  var HELP_COMMON = [
    ['How do I go back?', 'Press <b>Back</b> near the top of the page. <b>Home</b> is at the top too, and it always takes you to the first page.'],
    ['Do I need an account?', 'No. The whole site works without one, and your progress saves itself on this device. A free account adds one thing: your progress follows you to another phone or computer.'],
    ['The words are too small.', 'Press <b>Text size</b> at the top of the page, then choose Large or Largest.']
  ];
  var HELP = {
    home: ['the Home page', [
      ['Where do I start?', 'Press <b>Start</b> on Reading &amp; Writing or on Math. Either one is fine. The site then shows you four numbered steps to follow.'],
      ['What if I only want to look around?', 'Scroll down to “Try one easy question”. It is a real SAT question with no clock, and nothing is saved.'],
      ['How do I get back to what I was doing?', 'When you come back, Home shows a box named “Pick up where you left off”. Press it.']]],
    start: ['this page', [
      ['What should I press first?', 'Press the dark button near the top of the page. If you would rather try a question first, press “Try 5 easy questions”.'],
      ['What are the numbers 1 to 4 at the top?', 'They are the four steps of this subject: Start here, Learn, Practice and My progress. The dark one is where you are now. Go through them in order.']]],
    learn: ['the lessons', [
      ['Which lesson should I read first?', 'Start with number 1 and work down the list. At the bottom of every page a <b>Next step</b> button takes you on.'],
      ['How do I find one topic?', 'Press <b>2 Learn</b> at the top. That page lists every topic and has a search box at the bottom.'],
      ['How do I practice what I just read?', 'Press <b>3 Practice</b> at the top, then “5 easy questions”.']]],
    setup: ['the Practice page', [
      ['How do I start practicing?', 'Press <b>5 easy questions</b>. You get one question at a time, with no clock.'],
      ['What is “Pick what to practice”?', 'It lets you choose the kind of question, how hard it is and how many you get. You can leave it closed until you want it.'],
      ['Where can I see my mistakes?', 'Once you have a wrong answer, a button named “Try again the ones I got wrong” appears on this page. <b>4 My progress</b> also shows which kinds of question need more work.']]],
    question: ['answering a question', [
      ['How do I answer?', 'Press the choice you think is right. The site then tells you whether you were right and explains why.'],
      ['What do I do after I answer?', 'Press the big <b>Next</b> button to go to the next question.'],
      ['How do I stop?', 'Press the button near the top of the question that ends the set, or press <b>Back</b>. Every answer you have given is kept.']]],
    drills: ['the short exercises', [
      ['What are these?', 'Each exercise is a set of quick cards that trains one small step. They are a good warm-up when you have five minutes.'],
      ['How do I start one?', 'Pick an exercise and press <b>Start</b>. After each card you will see the right answer and the reason for it.']]],
    progress: ['My progress', [
      ['Why is there so little here?', 'This page fills in by itself as you answer practice questions. Answer a few and come back.'],
      ['What do the colored squares mean?', 'Each square is one kind of question. The key above the squares explains the colors. Press a square to see what to work on.'],
      ['Where can I see my mistakes?', 'Scroll to “Why you miss” on this page, or press <b>3 Practice</b> and then “Try again the ones I got wrong”.']]],
    saved: ['your saved progress', [
      ['Where is my progress saved?', 'In the browser on this device. If you sign in to a free account, it is also kept in the account, so it follows you to other devices.'],
      ['Can I lose it?', 'Yes, if you clear this browser’s data and you have no account and no backup file. An account or a backup file keeps it safe.'],
      ['Does the site work without the internet?', 'Lessons and any questions you have already opened still work. New questions need a connection.']]],
    crates: ['crates', [
      ['How do I get coins?', 'Answer the question of the day in each subject (10 coins each), finish every task on your study plan (20), and say why you missed a question (5 each, up to 4 a day).'],
      ['What is in a crate?', 'A new look for the site: colors, a paper background, an effect when you get a question right, a glow around your streak, or a streak picture. Nothing in a crate opens a lesson or a question; those are all free already.'],
      ['How do I use what I won?', 'Press <b>Wear</b> on it under “Your collection”. Colors you win also show up when you press <b>Text size</b> at the top.'],
      ['Can I buy coins?', 'No. Coins only come from studying, and nothing on this site costs money.']]],
    challenge: ['challenges', [
      ['How does a challenge work?', 'You answer five real SAT questions, then send the link to a friend. They answer the same five, in the same order, and you both see who got more right. They can send their score back the same way.'],
      ['Does my friend need an account?', 'No. The link holds the questions and your score, so it works for anyone, with nothing to sign up for. Nothing about a challenge is sent to SAT Sprint.'],
      ['Does a challenge count as practice?', 'Yes. Your answers are saved like any other practice and count toward your day. A challenge gives no extra coins.'],
      ['Can I play one again?', 'Yes, as often as you like. Your first try that answers every question is your score in the challenge.']]],
    room: ['your room', [
      ['What is my room?', 'A room in the clubhouse where the prizes you win go on show: a theme on the walls, a paper in the window, auras and effects on the stands, streak styles on the shelf and stickers on the board.'],
      ['How do I change it?', 'Press <b>Decorate</b>, tap a spot in the room, then pick a prize for it. What you pick shows straight away. Press <b>Save my room</b> to keep it, or <b>Cancel</b> to leave it as it was.'],
      ['Who can see my room?', 'Only you, for now. It is saved with the rest of your progress, in your backup file and in your account if you sign in.'],
      ['How do I get more for my room?', 'Earn coins by studying and open crates. Every crate has a prize and a sticker in it.']]],
    other: ['this page', [
      ['Where do I start?', 'Press <b>Home</b> at the top, then press <b>Start</b> on Reading &amp; Writing or on Math.']]]
  };
  var HELP_VIEW = { home: 'home', start: 'start', mstart: 'start', practice: 'setup', mprac: 'setup', drills: 'drills', mdrills: 'drills', rwmap: 'progress', mmap: 'progress', data: 'saved', account: 'saved', suggest: 'other', plan: 'other', crates: 'crates', challenge: 'challenge', room: 'room' };
  var helpEl = null, helpFrom = null;
  function helpKey() {
    var v = cur.view;
    if ((v === 'practice' || v === 'mprac') && $('#tend, .mpbar', viewEl[v])) { return 'question'; }
    return HELP_VIEW[v] || (VIEW_SUBJ[v] && VIEW_SUBJ[v] !== 'home' ? 'learn' : 'other');
  }
  function helpOpen() {
    if (helpEl) { return; }
    var h = HELP[helpKey()], qa = function (x) { return '<div class="help-qa"><h3>' + x[0] + '</h3><p>' + x[1] + '</p></div>'; };
    helpFrom = document.activeElement;
    helpEl = document.createElement('div');
    helpEl.className = 'tour help'; helpEl.id = 'help';
    helpEl.setAttribute('role', 'dialog'); helpEl.setAttribute('aria-modal', 'true'); helpEl.setAttribute('aria-labelledby', 'help-h');
    helpEl.innerHTML = '<div class="tour-card help-card"><div class="help-top"><p class="tour-n">Help</p><button type="button" class="btn ghost help-x" data-help-close>Close</button></div><h2 class="tour-h" id="help-h" tabindex="-1">Help with ' + h[0] + '</h2>' +
      h[1].map(qa).join('') + '<p class="help-also">Always there</p>' + HELP_COMMON.map(qa).join('') +
      '<div class="help-more"><button type="button" class="btn ghost" data-help-tour>Take the one-minute tour</button><a class="btn ghost" href="#my-data" data-help-go>Where my progress is saved</a><a class="btn ghost" href="#suggest" data-help-go>Ask a question</a></div>' +
      '<div class="tour-row"><span></span><button type="button" class="btn big" data-help-close>Close help</button></div></div>';
    document.body.appendChild(helpEl);
    document.documentElement.classList.add('tour-open');
    var b = document.getElementById('help-btn'); if (b) { b.setAttribute('aria-expanded', 'true'); }
    focusQuiet($('.tour-h', helpEl));
  }
  function helpClose(quiet) {
    if (!helpEl) { return; }
    helpEl.parentNode.removeChild(helpEl); helpEl = null;
    document.documentElement.classList.remove('tour-open');
    var b = document.getElementById('help-btn'); if (b) { b.setAttribute('aria-expanded', 'false'); }
    if (!quiet && helpFrom && document.body.contains(helpFrom)) { focusQuiet(helpFrom); }
    helpFrom = null;
  }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) { return; }
    if (t.closest('[data-help]')) { e.preventDefault(); if (helpEl) { helpClose(); } else { helpOpen(); } return; }
    if (!helpEl) { return; }
    if (t.closest('[data-help-tour]')) { helpClose(true); tourOpen(); }
    else if (t.closest('[data-help-go]')) { helpClose(true); }
    else if (t.closest('[data-help-close]') || t === helpEl) { helpClose(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!helpEl) { return; }
    e.stopPropagation();   /* the page's own keys stay quiet under the help box */
    if (e.key === 'Escape') { helpClose(); return; }
    if (e.key !== 'Tab') { return; }
    var f = $$('a[href], button', helpEl), first = f[0], lastEl = f[f.length - 1], a = document.activeElement;
    if (!helpEl.contains(a) || a === $('.tour-h', helpEl)) { e.preventDefault(); (e.shiftKey ? lastEl : first).focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && a === lastEl) { e.preventDefault(); first.focus(); }
  }, true);
