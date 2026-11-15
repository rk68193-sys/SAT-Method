  /* =================== Math: the reference sheet =================== */
  /* The formulas and facts College Board gives in the Math section, drawn for this site. While doing questions, a
     Reference button beside Calculator opens them in the same kind of panel (one panel at a time); the Formulas page
     shows the same sheet in full (#m-sheet). */
  var MSHEET = [
    { name: 'Circle', alt: 'A circle with radius r', f: ['A = πr<sup>2</sup>', 'C = 2πr'],
      svg: '<circle cx="70" cy="50" r="38"/><line x1="70" y1="50" x2="108" y2="50"/><circle class="dot" cx="70" cy="50" r="2.2"/><text x="89" y="45" text-anchor="middle">r</text>' },
    { name: 'Rectangle', alt: 'A rectangle with length l and width w', f: ['A = ℓw'],
      svg: '<rect x="22" y="22" width="96" height="52"/><text x="70" y="92" text-anchor="middle">ℓ</text><text x="126" y="53">w</text>' },
    { name: 'Triangle', alt: 'A triangle with base b and height h', f: ['A = ' + mfr(1, 2) + 'bh'],
      svg: '<path d="M16 78H124L50 18Z"/><line class="d" x1="50" y1="18" x2="50" y2="78"/><path d="M50 71h7v7"/><text x="44" y="54" text-anchor="end">h</text><text x="70" y="95" text-anchor="middle">b</text>' },
    { name: 'Right triangle', alt: 'A right triangle with legs a and b and hypotenuse c', f: ['c<sup>2</sup> = a<sup>2</sup> + b<sup>2</sup>'],
      svg: '<path d="M24 20V80H116Z"/><path d="M24 71h9v9"/><text x="15" y="55" text-anchor="middle">a</text><text x="70" y="96" text-anchor="middle">b</text><text x="77" y="44">c</text>' },
    { name: 'Special right triangles', wide: true, vb: '0 0 220 108', f: ['Sides x, x√3 and 2x', 'Sides s, s and s√2'],
      alt: 'A 30-60-90 triangle with sides x, x root 3 and 2x, and a 45-45-90 triangle with sides s, s and s root 2',
      svg: '<path d="M20 30V88H120Z"/><path d="M20 80h8v8"/><text x="11" y="64" text-anchor="middle">x</text><text x="70" y="104" text-anchor="middle">x√3</text><text x="74" y="52">2x</text>' +
        '<text class="ang" x="23" y="51">60°</text><text class="ang" x="100" y="85" text-anchor="end">30°</text>' +
        '<path d="M140 30V88H198Z"/><path d="M140 80h8v8"/><text x="131" y="64" text-anchor="middle">s</text><text x="169" y="104" text-anchor="middle">s</text><text x="174" y="54">s√2</text>' +
        '<text class="ang" x="143" y="61">45°</text><text class="ang" x="183" y="85" text-anchor="end">45°</text>' },
    { name: 'Rectangular prism', alt: 'A box with length l, width w and height h', f: ['V = ℓwh'],
      svg: '<path d="M18 38H96V84H18Z"/><path d="M18 38L44 18H122L96 38M96 84L122 64V18"/><path class="d" d="M18 84L44 64H122M44 64V18"/>' +
        '<text x="57" y="98" text-anchor="middle">ℓ</text><text x="115" y="84">w</text><text x="10" y="65" text-anchor="middle">h</text>' },
    { name: 'Cylinder', alt: 'A cylinder with radius r and height h', f: ['V = πr<sup>2</sup>h'],
      svg: '<ellipse cx="70" cy="22" rx="36" ry="12"/><path d="M34 22V80M106 22V80M34 80A36 12 0 0 0 106 80"/><path class="d" d="M34 80A36 12 0 0 1 106 80"/>' +
        '<line x1="70" y1="22" x2="106" y2="22"/><circle class="dot" cx="70" cy="22" r="2.2"/><text x="88" y="20" text-anchor="middle">r</text><text x="114" y="56">h</text>' },
    { name: 'Sphere', alt: 'A sphere with radius r', f: ['V = ' + mfr(4, 3) + 'πr<sup>3</sup>'],
      svg: '<circle cx="70" cy="50" r="38"/><path d="M32 50A38 10 0 0 0 108 50"/><path class="d" d="M32 50A38 10 0 0 1 108 50"/>' +
        '<line x1="70" y1="50" x2="99" y2="26"/><circle class="dot" cx="70" cy="50" r="2.2"/><text x="79" y="35" text-anchor="middle">r</text>' },
    { name: 'Cone', alt: 'A cone with radius r and height h', f: ['V = ' + mfr(1, 3) + 'πr<sup>2</sup>h'],
      svg: '<path d="M34 80L70 12L106 80M34 80A36 13 0 0 0 106 80"/><path class="d" d="M34 80A36 13 0 0 1 106 80M70 12V80"/>' +
        '<line x1="70" y1="80" x2="106" y2="80"/><circle class="dot" cx="70" cy="80" r="2.2"/><text x="64" y="54" text-anchor="end">h</text><text x="88" y="77" text-anchor="middle">r</text>' },
    { name: 'Rectangular pyramid', alt: 'A pyramid on a rectangle with length l and width w, and height h', f: ['V = ' + mfr(1, 3) + 'ℓwh'],
      svg: '<path d="M14 82H96L124 60M69 8L14 82M69 8L96 82M69 8L124 60"/><path class="d" d="M14 82L42 60H124M69 8L42 60M69 8V71"/>' +
        '<text x="55" y="96" text-anchor="middle">ℓ</text><text x="114" y="82">w</text><text x="63" y="46" text-anchor="end">h</text>' }
  ];
  var MSHEET_FACTS = ['A circle has 360 degrees of arc.', 'A circle has 2π radians of arc.', 'The angles of a triangle add up to 180 degrees.'];
  function mSheetHTML() {
    return '<div class="msheet-grid">' + MSHEET.map(function (s) {
      return '<figure class="msheet-c' + (s.wide ? ' wide' : '') + '"><svg viewBox="' + (s.vb || '0 0 140 100') + '" role="img" aria-label="' + s.alt + '">' + s.svg + '</svg>' +
        '<figcaption><b>' + s.name + '</b>' + s.f.map(function (x) { return '<span class="msheet-f">' + x + '</span>'; }).join('') + '</figcaption></figure>';
    }).join('') + '</div><ul class="msheet-facts">' + MSHEET_FACTS.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
  }
  function mSheetOpen() { var el = document.getElementById('msheet'); return !!el && !el.hidden; }
  function mSheetBtn() {
    return '<button class="btn ghost sm mcalc-btn" type="button" data-sheet aria-pressed="' + (mSheetOpen() ? 'true' : 'false') + '" title="The formulas and facts given on the test">' + ICON.sheet + '<span>Formula sheet</span></button>';
  }
  function mSheetShow(open) {
    var el = document.getElementById('msheet');
    if (!el) {
      if (!open) { return; }
      el = document.createElement('aside'); el.id = 'msheet'; el.className = 'mcalc msheet'; el.setAttribute('aria-label', 'Formula sheet');
      el.innerHTML = '<div class="mcalc-bar"><b>Formula sheet</b><span class="muted">The formulas and facts given on the test</span><button class="btn sm" type="button" data-sheet-close>Close</button></div>' +
        '<div class="msheet-body">' + mSheetHTML() + '</div>';
      document.body.appendChild(el);
    }
    if (open && mCalcOpen()) { mCalcShow(false); }
    el.hidden = !open;
    document.body.classList.toggle('calc-open', !!open || mCalcOpen());
    placePanels();
    $$('[data-sheet]').forEach(function (b) { b.setAttribute('aria-pressed', open ? 'true' : 'false'); });
    /* on a phone the panel covers the lower part of the screen, so bring the question to the top */
    var card = open && narrow() ? $('#v-mprac .mpcard') : null;
    if (card) { try { card.scrollIntoView({ block: 'start' }); } catch (e) {} }
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-sheet],[data-sheet-close]') : null;
    if (!b) { return; }
    if (b.hasAttribute('data-sheet-close')) { mSheetShow(false); focusQuiet($('[data-sheet]')); return; }
    mSheetShow(!mSheetOpen());
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mSheetOpen()) { mSheetShow(false); focusQuiet($('[data-sheet]')); }
  });
