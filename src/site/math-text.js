  /* =================== Math questions as text =================== */
  /* m/t/<id>.js holds one question rebuilt from College Board's export: SATQ(id, { q, c: {A..D}, r }), where the prose is
     text and each expression is an inline SVG made of <use> references. m/t/_glyphs.js holds every symbol outline once.
     Both are plain scripts, so they load from a file:// page too. D.mathText.held lists the questions whose rebuild did
     not pass every check; those, and any question whose file fails to load, keep the picture. */
  var MTXT = D.mathText || {}, MTX_ON = !!MTXT.on, MTX_HELD = {}, MTX = {}, MTX_BAD = {}, MTX_WAIT = {};
  (MTXT.held || []).forEach(function (id) { MTX_HELD[id] = 1; });
  function mtxHas(id) { return MTX_ON && !MTX_HELD[id] && !MTX_BAD[id]; }
  function mtxScript(src, fail) {
    var s = document.createElement('script');
    s.src = src; s.async = true; s.onerror = fail;
    document.head.appendChild(s);
  }
  var mtxLib = 0, mtxLibWait = [];          /* 0 not asked for, 1 loading, 2 ready, 3 failed */
  function mtxLibDone(ok) {
    mtxLib = ok ? 2 : 3;
    if (!ok) { MTX_ON = false; }
    var w = mtxLibWait; mtxLibWait = [];
    w.forEach(function (f) { f(ok); });
  }
  window.SATG = function (defs) {
    var box = document.createElement('div');
    box.innerHTML = '<svg class="mxdefs" width="0" height="0" aria-hidden="true"><defs>' + defs + '</defs></svg>';
    document.body.appendChild(box.firstChild);
    mtxLibDone(true);
  };
  function mtxNeedLib(cb) {
    if (mtxLib === 2) { cb(true); return; }
    if (mtxLib === 3) { cb(false); return; }
    mtxLibWait.push(cb);
    if (mtxLib === 0) { mtxLib = 1; mtxScript('m/t/_glyphs.js', function () { mtxLibDone(false); }); }
  }
  function mtxDone(id, body) {
    var w = MTX_WAIT[id] || [];
    delete MTX_WAIT[id];
    w.forEach(function (f) { f(body); });
  }
  window.SATQ = function (id, body) { MTX[id] = body; mtxDone(id, body); };
  function mtxLoad(id, cb) {
    mtxNeedLib(function (ok) {
      if (!ok || MTX_BAD[id]) { cb(null); return; }
      if (MTX[id]) { cb(MTX[id]); return; }
      var first = !MTX_WAIT[id];
      (MTX_WAIT[id] = MTX_WAIT[id] || []).push(cb);
      if (first) { mtxScript('m/t/' + id + '.js', function () { MTX_BAD[id] = 1; mtxDone(id, null); }); }
    });
  }
  /* a choice's paragraphs sit inside a button, where only inline elements belong */
  function mtxInline(html) { return html.replace(/<p( class="[^"]*")?>/g, function (m, c) { return '<span class="mtx-p' + (c ? ' ' + c.slice(8, -1) : '') + '">'; }).replace(/<\/p>/g, '</span>'); }
  function mtxFill(el) {
    if (el.getAttribute('data-mtx-s')) { return; }
    el.setAttribute('data-mtx-s', 'w');
    var parts = el.getAttribute('data-mtx').split(':'), kind = parts[0], id = parts[1], q = MQBY[id];
    mtxLoad(id, function (body) {
      if (!el.parentNode) { return; }
      if (!body || !q) {
        var pic = document.createElement('div');
        pic.innerHTML = q ? mPic(kind, q) : '';
        el.parentNode.replaceChild(pic.firstChild || document.createTextNode(''), el);
        return;
      }
      var card = el.closest('.mpcard'), html = kind === 'q' ? body.q : body.r;
      if (kind === 'q' && body.c) {
        var btns = el.hasAttribute('data-mtx-b') && card ? $$('.mpch[data-k]', card) : [];
        if (btns.length === 4) {
          /* in practice the choices go into the answer buttons */
          btns.forEach(function (b) {
            var k = b.getAttribute('data-k');
            if (body.c[k] && !$('.mpch-c', b)) {
              var c = document.createElement('span');
              c.className = 'mpch-c'; c.innerHTML = mtxInline(body.c[k]);
              b.insertBefore(c, $('.kbd', b));
            }
          });
          var grid = $('.mpchoices', card), note = $('.mpch-note', card);
          if (grid) { grid.classList.add('txt'); }
          if (note) { note.textContent = note.getAttribute('data-txt') || 'Choose your answer.'; }
        } else {
          html += '<ol class="mtx-ch">' + ['A', 'B', 'C', 'D'].map(function (k) { return '<li><b>' + k + '.</b><div>' + (body.c[k] || '') + '</div></li>'; }).join('') + '</ol>';
        }
      }
      el.innerHTML = html;
      el.setAttribute('data-mtx-s', 'd');
      var zoom = el.parentNode.nextElementSibling;
      zoom = zoom && zoom.classList.contains('mpzoom') ? $('[data-zoom]', zoom) : null;
      if (zoom) { zoom.textContent = kind === 'q' ? 'See the question as printed' : 'See the explanation as printed'; }
    });
  }
  /* fill a question when it comes near the screen: a lesson page lists many, most of them inside closed details */
  var mtxIO = window.IntersectionObserver ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { mtxIO.unobserve(e.target); mtxFill(e.target); } });
  }, { rootMargin: '500px' }) : null;
  var mtxQueued = false;
  function mtxScan() {
    mtxQueued = false;
    $$('[data-mtx]:not([data-mtx-s]):not([data-mtx-o])').forEach(function (el) {
      el.setAttribute('data-mtx-o', '1');
      if (mtxIO) { mtxIO.observe(el); } else { mtxFill(el); }
    });
  }
  if (window.MutationObserver) {
    new MutationObserver(function () {
      if (!mtxQueued) { mtxQueued = true; (window.requestAnimationFrame || window.setTimeout)(mtxScan); }
    }).observe(document.getElementById('main'), { childList: true, subtree: true });
  }

