  /* =================== the welcome tour: four short cards for a first-time visitor =================== */
  var TOUR_KEY = 'sat-sprint-tour';
  var TOUR = [
    { t: 'Welcome to SAT Sprint',
      p: ['This is a free place to get ready for the SAT. There is nothing to buy, and you do not need an account.', 'This short tour shows you how the site works. It takes about a minute, and you can skip it at any time.'],
      pic: '<span class="tp-mark"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.5l3.8 3.8 7.2-8.3"/></svg></span><span class="tp-pill">Free · no sign-up needed</span>' },
    { t: 'First, pick a subject',
      p: ['The SAT has two parts: Reading &amp; Writing, and Math. You can begin with either one.', 'These three buttons sit at the top of every page, so you can switch subjects or go back to Home whenever you like.'],
      pic: '<span class="tp-chip on">Home</span><span class="tp-chip"><i class="sdot rw"></i>Reading &amp; Writing</span><span class="tp-chip"><i class="sdot math"></i>Math</span>' },
    { t: 'Then follow the four steps',
      p: ['Inside each subject you will see four numbered steps. Start here explains the test. Learn has the lessons. Practice has real questions. My progress shows how you are doing.', 'Go through them in order. At the bottom of every page, a “Next step” button tells you where to go next, so you never have to guess.'],
      pic: '<span class="tp-step on"><b>1</b>Start here</span><span class="tp-step"><b>2</b>Learn</span><span class="tp-step"><b>3</b>Practice</span><span class="tp-step"><b>4</b>My progress</span>' },
    { t: 'You cannot get lost',
      p: ['A Back button stays at the top of the screen, and Home is always one tap away.', 'Your progress saves itself on this device, so you can stop whenever you like. If the words look small, press Text size at the top of the page.'],
      pic: '<span class="tp-chip">← Back</span><span class="tp-chip">Home</span><span class="tp-chip">Text size</span>' }
  ];
  var tourEl = null, tourI = 0, tourFrom = null;
  function tourSeen() { try { return window.localStorage.getItem(TOUR_KEY) === '1'; } catch (e) { return true; } }
  function tourMark() { try { window.localStorage.setItem(TOUR_KEY, '1'); } catch (e) {} }
  function tourDraw() {
    var c = TOUR[tourI], last = tourI === TOUR.length - 1;
    $('.tour-card', tourEl).innerHTML =
      '<p class="tour-n">Step ' + (tourI + 1) + ' of ' + TOUR.length + '</p>' +
      '<div class="tour-pic tour-pic' + (tourI + 1) + '" aria-hidden="true">' + c.pic + '</div>' +
      '<h2 class="tour-h" id="tour-h" tabindex="-1">' + c.t + '</h2>' + c.p.map(function (x) { return '<p>' + x + '</p>'; }).join('') +
      (last
        ? '<p class="tour-q">Where would you like to begin?</p><div class="tour-end"><a class="btn big" href="#start" data-tour-go>Start Reading &amp; Writing</a><a class="btn big" href="#math" data-tour-go>Start Math</a></div>' +
          '<div class="tour-row"><button type="button" class="btn ghost" data-tour-back>Back</button><button type="button" class="linkbtn" data-tour-skip>Let me look around first</button></div>'
        : '<div class="tour-row">' + (tourI ? '<button type="button" class="btn ghost" data-tour-back>Back</button>' : '<button type="button" class="linkbtn" data-tour-skip>Skip the tour</button>') +
          '<button type="button" class="btn big" data-tour-next>' + (tourI ? 'Next' : 'Start the tour') + ' <span aria-hidden="true">→</span></button></div>');
    focusQuiet($('.tour-h', tourEl));
  }
  function tourOpen() {
    if (tourEl) { return; }
    tourFrom = document.activeElement; tourI = 0;
    tourEl = document.createElement('div');
    tourEl.className = 'tour'; tourEl.id = 'tour';
    tourEl.setAttribute('role', 'dialog'); tourEl.setAttribute('aria-modal', 'true'); tourEl.setAttribute('aria-labelledby', 'tour-h');
    tourEl.innerHTML = '<div class="tour-card"></div>';
    document.body.appendChild(tourEl);
    document.documentElement.classList.add('tour-open');
    tourDraw();
  }
  function tourClose() {
    if (!tourEl) { return; }
    tourMark();
    tourEl.parentNode.removeChild(tourEl); tourEl = null;
    document.documentElement.classList.remove('tour-open');
    if (tourFrom && document.body.contains(tourFrom)) { focusQuiet(tourFrom); }
    tourFrom = null;
  }
  /* the first visit opens it on Home; a script that drives the browser is not a visitor, so it is left alone */
  function tourMaybe() { if (cur.view === 'home' && !tourSeen() && !window.navigator.webdriver) { tourOpen(); } }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) { return; }
    if (t.closest('[data-tour]')) { e.preventDefault(); tourOpen(); return; }
    if (!tourEl) { return; }
    if (t.closest('[data-tour-next]')) { tourI = Math.min(TOUR.length - 1, tourI + 1); tourDraw(); }
    else if (t.closest('[data-tour-back]')) { tourI = Math.max(0, tourI - 1); tourDraw(); }
    else if (t.closest('[data-tour-skip]') || t.closest('[data-tour-go]') || t === tourEl) { tourClose(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!tourEl) { return; }
    e.stopPropagation();   /* the page's own keys (1 to 4, Enter) stay quiet under the tour */
    if (e.key === 'Escape') { tourClose(); return; }
    if (e.key === 'ArrowRight' && tourI < TOUR.length - 1) { tourI += 1; tourDraw(); return; }
    if (e.key === 'ArrowLeft' && tourI) { tourI -= 1; tourDraw(); return; }
    if (e.key !== 'Tab') { return; }
    var f = $$('a[href], button', tourEl), first = f[0], lastEl = f[f.length - 1], a = document.activeElement;
    if (!tourEl.contains(a) || a === $('.tour-h', tourEl)) { e.preventDefault(); (e.shiftKey ? lastEl : first).focus(); }
    else if (e.shiftKey && a === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && a === lastEl) { e.preventDefault(); first.focus(); }
  }, true);
