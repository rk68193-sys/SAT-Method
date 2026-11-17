  /* =================== Cipher and Pop-Up, and six more Radiant looks (prizes.js) =================== */
  /* Thirty-six looks: one of every kind (character skin, living theme, right-answer effect, aura, paper, streak style) at every
     tier from Common to Radiant. Cipher is codes, locks and secret rooms, and each of its looks hides something real to
     decode: Morse that spells words, signal flags, an SAT word of the day in a cryptex, a vault whose combination is the date,
     writing that only shows under a lamp or a lens. Pop-Up is a pop-up book: scenes cut from layers of paper that fold up off
     the page and throw shadows on each other, with tabs that pull, flaps that open, wheels that turn and someone new behind a
     flap each time. The six Radiant looks are a ship in a bottle, a world behind a keyhole, a labyrinth of turning rings, an
     astronomical clock that keeps the real time and moon, nesting dolls, and a moon knight whose moon is tonight's.
     Each is built deeper than the looks before it: several planes with light and shadow passing between them, a story in acts
     rather than one loop, and a secret to find (a message, a rare visitor, the hour, the date or the moon). They add themselves
     to the registries in fx.js and the skins to BUD_SKINS in buddy.js, and draw with the helpers in radiant.js (z...),
     gems-weather.js (gw...), looks.js (lk...) and pixel-court.js (bc...). */

  /* ---------- helpers ---------- */
  /* the student's own calendar: a day number that goes up by one at each local midnight, the hour (with minutes as a fraction),
     and the moon's age as a part of its 29.53-day cycle (0 new, 0.5 full), counted from the new moon of 6 January 2000 */
  function cpDay() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5); }
  function cpHour() { var d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
  function cpMoon() { var x = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5 / 29.530589; return x - Math.floor(x); }
  /* a color part way from a to b (each '#rrggbb' or 'rgb(...)'), as rgb() */
  function cpRgbA(h) { if (h.charAt(0) === '#') { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; } var m = h.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]]; }
  function cpMix(a, b, u) { var A = cpRgbA(a), B = cpRgbA(b); u = Math.max(0, Math.min(1, u)); return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * u) + ',' + Math.round(A[1] + (B[1] - A[1]) * u) + ',' + Math.round(A[2] + (B[2] - A[2]) * u) + ')'; }
  function cpPoly(c, P) { c.beginPath(); c.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) { c.lineTo(P[i][0], P[i][1]); } c.closePath(); }
  /* a piece of cut paper standing up from a fold at y = base: u is how far up it is (0 flat on the page, 1 upright). path(c)
     draws it upright; it is squashed toward the fold as it lies down, and darker until it faces you. sh throws its shadow back
     and to the right, onto whatever is behind it */
  function cpCut(c, base, u, path, fill, sh) {
    if (!(u > 0.01)) { return; }
    c.save(); c.translate(0, base); c.scale(1, u); c.translate(0, -base);
    if (sh) { c.save(); c.translate(sh, sh * 0.55); c.globalAlpha *= 0.24; c.fillStyle = '#140D06'; path(c); c.fill(); c.restore(); }
    c.fillStyle = u < 0.999 ? cpMix(fill, '#2A2018', (1 - u) * 0.6) : fill; path(c); c.fill();
    c.restore();
  }
  /* words, centered; px is the size, font a whole CSS font when given */
  function cpWrite(c, txt, x, y, px, col, a, font) { if (!(a > 0)) { return; } c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.font = font || ('700 ' + px + 'px ' + FX_MONO); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x, y); c.globalAlpha = 1; }
  var CP_SERIF = '"Literata", Georgia, "Times New Roman", serif';
  /* Morse: a message as a list of [from, to, letter] in dot lengths (a dash is 3, a gap inside a letter 1, between letters 3,
     between words 7), and how long it all takes */
  var CP_MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };
  function cpMorse(msg) {
    var on = [], u = 0, i, j;
    for (i = 0; i < msg.length; i++) { var ch = msg.charAt(i); if (ch === ' ') { u += 4; continue; } var code = CP_MORSE[ch] || ''; for (j = 0; j < code.length; j++) { var L = code.charAt(j) === '.' ? 1 : 3; on.push([u, u + L, i]); u += L + 1; } u += 2; }
    return { on: on, len: u + 8 };
  }
  /* a little paper animal standing at (x, y), z tall; k: 0 cat, 1 rabbit, 2 hedgehog, 3 fox. wave lifts a paw */
  function cpCritter(c, k, x, y, z, wave) {
    var s = z / 20, body = ['#6B7280', '#F5F0E6', '#8B5E3C', '#EA7A2A'][k], dark = ['#374151', '#B8AFA0', '#4A2E18', '#9A3F0E'][k];
    c.save(); c.translate(x, y); c.scale(s, s);
    if (k === 2) {
      c.fillStyle = dark; c.beginPath(); for (var i = 0; i <= 12; i++) { var a = Math.PI + i / 12 * Math.PI, r = i % 2 ? 9 : 13; c.lineTo(Math.cos(a) * r, -2 + Math.sin(a) * r * 0.9); } c.closePath(); c.fill();
      c.fillStyle = '#E8C9A0'; c.beginPath(); c.ellipse(9, -3, 5, 4, 0.2, 0, FX_TAU); c.fill(); c.fillStyle = '#1A1A1A'; c.beginPath(); c.arc(13.4, -3.4, 1.2, 0, FX_TAU); c.arc(9.6, -5, 0.8, 0, FX_TAU); c.fill();
      c.restore(); return;
    }
    c.fillStyle = body; c.beginPath(); c.ellipse(0, -7, 6.5, 7.5, 0, 0, FX_TAU); c.fill();
    c.beginPath(); c.arc(0, -17, 6, 0, FX_TAU); c.fill();
    if (k === 1) { c.beginPath(); c.ellipse(-2.6, -27, 1.8, 6, -0.15, 0, FX_TAU); c.ellipse(2.6, -27, 1.8, 6, 0.15, 0, FX_TAU); c.fill(); c.fillStyle = '#F9A8D4'; c.beginPath(); c.ellipse(-2.6, -27, 0.8, 4, -0.15, 0, FX_TAU); c.ellipse(2.6, -27, 0.8, 4, 0.15, 0, FX_TAU); c.fill(); }
    else { c.beginPath(); c.moveTo(-5.6, -19); c.lineTo(-4.6, -26); c.lineTo(-1.4, -22); c.moveTo(5.6, -19); c.lineTo(4.6, -26); c.lineTo(1.4, -22); c.fill(); }
    if (k === 3) { c.fillStyle = '#FFF7ED'; c.beginPath(); c.moveTo(-5, -15); c.quadraticCurveTo(0, -9, 5, -15); c.quadraticCurveTo(0, -12, -5, -15); c.fill(); }
    c.strokeStyle = k === 3 ? body : dark; c.lineWidth = k === 1 ? 4 : 2.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(5, -3); c.quadraticCurveTo(13, -6, k === 1 ? 6.5 : 12, k === 1 ? -4 : -14); c.stroke();
    if (k === 3) { c.fillStyle = '#FFF7ED'; c.beginPath(); c.arc(12, -14, 2, 0, FX_TAU); c.fill(); }
    c.fillStyle = '#1A1A1A'; c.beginPath(); c.arc(-2.2, -17.6, 0.9, 0, FX_TAU); c.arc(2.2, -17.6, 0.9, 0, FX_TAU); c.fill(); c.beginPath(); c.arc(0, -15.4, 0.7, 0, FX_TAU); c.fill();
    c.strokeStyle = body; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-5, -10); c.lineTo(-8 - wave * 2, -10 - wave * 9); c.stroke();
    c.restore();
  }

  /* ---------- stage auras: a scene above the streak, in a box 330 wide and 190 tall with the ground at y = 160 ---------- */
  /* Paper garden (Pop-Up, Common): a pop-up page. The sky is the page behind; paper hills, a cottage and a row of flowers fold
     up off the floor page, each throwing its shadow on the layer behind. A tab at the side pulls the sun up its arc on a paper
     arm, the flowers open, smoke puffs bob on wires, a bee bounces on a spring, and the cottage door opens: each time someone
     different lives there (a cat, a rabbit, a hedgehog, a fox) and comes out to wave with a little sign */
  gwStage('pgarden', function () {
    var C = 12, FL = [[-132, '#F472B6'], [-104, '#FACC15'], [-12, '#A78BFA'], [22, '#FB923C'], [74, '#F472B6'], [108, '#60A5FA'], [138, '#FACC15']], Bf = [], i;
    for (i = 0; i < 2; i++) { Bf.push({ ph: i * 2.4, col: i ? '#FDE047' : '#F9A8D4' }); }
    function hills(y0, amp, f, ph) { return function (c) { c.beginPath(); c.moveTo(-150, y0); for (var x = -150; x <= 150; x += 10) { c.lineTo(x, y0 - amp * (0.55 + 0.45 * Math.sin(x * f + ph))); } c.lineTo(150, y0); c.closePath(); }; }
    var H1 = hills(152, 30, 0.021, 1.3), H2 = hills(162, 22, 0.034, 4.1);
    return function (c, t, dt) {
      var T = t + (FX_REDUCE ? 3.6 : 0), cyc = T % C, n = Math.floor(T / C), k = n % 4, j;
      var f1 = fxEase(T / 0.7), f2 = fxEase((T - 0.25) / 0.7), f3 = fxEase((T - 0.5) / 0.7), f4 = fxEase((T - 0.75) / 0.7);
      var rise = fxEase(cyc / 2.2) * (1 - fxEase((cyc - 9.4) / 2.2)), bloom = fxEase((cyc - 1.2) / 1.4) * (1 - 0.4 * fxEase((cyc - 9.6) / 1.6));
      var door = fxEase((cyc - 3.4) / 0.6) * (1 - fxEase((cyc - 8.4) / 0.6)), out = fxEase((cyc - 4.0) / 0.6) * (1 - fxEase((cyc - 7.9) / 0.5)), wave = cyc > 4.8 && cyc < 7.6 ? Math.max(0, Math.sin((cyc - 4.8) * 7)) : 0, sign = fxEnv(cyc, 4.9, 5.3, 7.4, 7.8);
      /* the back page and the sky on it */
      c.fillStyle = '#F4EBD9'; c.fillRect(-152, 6, 304, 146); c.fillStyle = '#BCE0F2'; c.fillRect(-144, 12, 288, 138);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-144, 12, 288, 40);
      /* the sun on its paper arm, pulled by the tab at the edge */
      var sa = 0.22 + 1.15 * rise, sx = 60 + Math.cos(sa) * 100, sy = 150 - Math.sin(sa) * 100, rot = t * 0.4;
      c.strokeStyle = '#E9D8B4'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(60, 150); c.lineTo(sx, sy); c.stroke();
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', sx, sy, 44, 0.35 * (0.4 + 0.6 * rise)); c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#FDBA4D'; c.beginPath(); for (j = 0; j < 24; j++) { var ra = rot + j / 24 * FX_TAU, rr = j % 2 ? 15 : 21; c.lineTo(sx + Math.cos(ra) * rr, sy + Math.sin(ra) * rr); } c.closePath(); c.fill();
      c.fillStyle = '#FDE047'; c.beginPath(); c.arc(sx, sy, 13, 0, FX_TAU); c.fill(); c.fillStyle = '#B45309'; c.beginPath(); c.arc(sx - 4, sy - 2, 1.4, 0, FX_TAU); c.arc(sx + 4, sy - 2, 1.4, 0, FX_TAU); c.fill(); c.strokeStyle = '#B45309'; c.lineWidth = 1.2; c.beginPath(); c.arc(sx, sy + 1, 5, 0.3, Math.PI - 0.3); c.stroke();
      c.fillStyle = '#C9B48A'; c.beginPath(); c.arc(60, 150, 3, 0, FX_TAU); c.fill();
      /* the tab, sticking out of the page edge: it slides out as the sun climbs */
      var tx = 146 + 14 * rise; c.fillStyle = '#F97316'; c.beginPath(); fxRR(c, tx - 4, 92, 18, 14, 3); c.fill(); c.fillStyle = '#FFF7ED'; c.font = '700 7px ' + FX_MONO; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('PULL', tx + 5, 99);
      /* clouds sliding in their slots */
      [[-90, 34, 0], [10, 52, 2]].forEach(function (q, m) { var cx = q[0] + Math.sin(t * 0.35 + q[2]) * 26; c.strokeStyle = 'rgba(80,110,130,.25)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(q[0] - 30, q[1] + 8); c.lineTo(q[0] + 30, q[1] + 8); c.stroke(); c.fillStyle = 'rgba(20,40,60,.12)'; c.beginPath(); c.ellipse(cx + 3, q[1] + 3, 22, 8, 0, 0, FX_TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(cx, q[1], 22, 8, 0, 0, FX_TAU); c.arc(cx - 8, q[1] - 5, 8, 0, FX_TAU); c.arc(cx + 7, q[1] - 6, 10, 0, FX_TAU); c.fill(); });
      /* the floor page, and the gutter where the two pages meet */
      c.fillStyle = '#E9DFC7'; cpPoly(c, [[-152, 150], [152, 150], [166, 186], [-166, 186]]); c.fill(); c.fillStyle = '#A3CF72'; cpPoly(c, [[-146, 152], [146, 152], [158, 182], [-158, 182]]); c.fill();
      var gg = c.createLinearGradient(0, 144, 0, 158); gg.addColorStop(0, 'rgba(60,40,20,0)'); gg.addColorStop(0.45, 'rgba(60,40,20,.3)'); gg.addColorStop(1, 'rgba(60,40,20,0)'); c.fillStyle = gg; c.fillRect(-150, 144, 300, 14);
      /* far hills */
      cpCut(c, 152, f1, H1, '#7FBF7A', 5);
      /* the cottage, its smoke and its door */
      cpCut(c, 158, f2, function (c) { c.beginPath(); c.rect(-84, 126, 44, 32); c.moveTo(-90, 128); c.lineTo(-62, 104); c.lineTo(-34, 128); c.closePath(); c.rect(-50, 106, 7, 14); }, '#F3D9A4', 5);
      if (f2 > 0.9) {
        c.fillStyle = '#C8553D'; cpPoly(c, [[-91, 129], [-62, 103], [-33, 129], [-38, 129], [-62, 109], [-86, 129]]); c.fill(); c.fillStyle = '#9F3A2A'; c.fillRect(-51, 104, 9, 4);
        c.fillStyle = '#7DD3FC'; c.fillRect(-80, 133, 11, 10); c.strokeStyle = '#8B5E3C'; c.lineWidth = 1.2; c.strokeRect(-80, 133, 11, 10); c.beginPath(); c.moveTo(-74.5, 133); c.lineTo(-74.5, 143); c.moveTo(-80, 138); c.lineTo(-69, 138); c.stroke();
        for (j = 0; j < 3; j++) { var py = 96 - j * 12 + Math.sin(t * 2 + j) * 2, px = -46 + j * 6 + Math.sin(t * 1.3 + j * 2) * 3; c.strokeStyle = 'rgba(120,110,100,.35)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-46, 104); c.lineTo(px, py); c.stroke(); c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(px, py, 4 + j * 1.5, 0, FX_TAU); c.fill(); }
        c.fillStyle = '#3F2A1A'; c.fillRect(-66, 140, 11, 18);
        var dw = 11 * Math.cos(door * 1.35); c.fillStyle = cpMix('#8B5E3C', '#3F2A1A', door * 0.5); c.fillRect(-66, 140, Math.max(0.5, dw), 18); c.fillStyle = '#FACC15'; if (dw > 4) { c.beginPath(); c.arc(-66 + dw - 2.4, 150, 1, 0, FX_TAU); c.fill(); }
        if (out > 0) {
          c.save(); c.globalAlpha = Math.min(1, out * 1.5); cpCritter(c, k, -60 + out * 22, 159 + out * 3, 12 + 12 * out, wave); c.restore();
          if (sign > 0) { var gx = -24 + out * 18, gy = 124 - sign * 6; c.strokeStyle = '#8B5E3C'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(gx, 156); c.lineTo(gx, gy + 8); c.stroke(); c.save(); c.translate(gx, gy); c.scale(1, sign); c.fillStyle = 'rgba(20,10,0,.2)'; c.fillRect(-16, -5, 34, 15); c.fillStyle = '#FFFBEB'; c.fillRect(-18, -8, 34, 15); c.strokeStyle = '#F97316'; c.lineWidth = 1; c.strokeRect(-18, -8, 34, 15); c.restore(); cpWrite(c, ['HELLO!', 'HI THERE', 'HOWDY!', 'HEY YOU!'][k], gx - 1, gy, 6, '#9A3412', sign); }
        }
      }
      /* the near hills, the flowers on their stems, the bee on its spring */
      cpCut(c, 162, f3, H2, '#5FA85A', 5);
      cpCut(c, 174, f4, function (c) { c.beginPath(); FL.forEach(function (q, m) { c.rect(q[0] - 1.2, 140 - (m % 3) * 6, 2.4, 34 + (m % 3) * 6); c.moveTo(q[0], 160); c.ellipse(q[0] - 5, 160, 6, 2.4, -0.5, 0, FX_TAU); c.moveTo(q[0] + 11, 156); c.ellipse(q[0] + 5, 156, 6, 2.4, 0.5, 0, FX_TAU); }); }, '#3F8F45', 3);
      if (f4 > 0.9) {
        FL.forEach(function (q, m) {
          var fx = q[0], fy = 140 - (m % 3) * 6 + Math.sin(t * 1.4 + m) * 1.2, b = bloom * (0.7 + 0.3 * Math.sin(m * 3.1)), r = 3 + 5 * b;
          c.fillStyle = 'rgba(20,10,0,.18)'; c.beginPath(); c.arc(fx + 3, fy + 2, r + 2, 0, FX_TAU); c.fill();
          c.fillStyle = q[1]; c.beginPath(); for (j = 0; j < 6; j++) { var pa = j / 6 * FX_TAU + m; c.moveTo(fx, fy); c.ellipse(fx + Math.cos(pa) * r * 0.75, fy + Math.sin(pa) * r * 0.75, r * 0.62, r * 0.36, pa, 0, FX_TAU); } c.fill();
          c.fillStyle = '#FEF3C7'; c.beginPath(); c.arc(fx, fy, 1.6 + b * 1.6, 0, FX_TAU); c.fill();
        });
        var bx = 30 + Math.sin(t * 1.7) * 22, by = 104 + Math.sin(t * 3.1) * 10;
        c.strokeStyle = 'rgba(100,90,80,.6)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(30, 172); for (j = 1; j <= 14; j++) { var u2 = j / 14; c.lineTo(30 + (bx - 30) * u2 + (j % 2 ? 3 : -3), 172 + (by - 172) * u2); } c.stroke();
        c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(bx - 2, by - 5, 4, 2.4 * Math.abs(Math.sin(t * 30)) + 0.6, -0.5, 0, FX_TAU); c.ellipse(bx + 2, by - 5, 4, 2.4 * Math.abs(Math.sin(t * 30 + 1)) + 0.6, 0.5, 0, FX_TAU); c.fill();
        c.fillStyle = '#FACC15'; c.beginPath(); c.ellipse(bx, by, 6, 4, 0, 0, FX_TAU); c.fill(); c.fillStyle = '#1F2937'; c.fillRect(bx - 2.5, by - 3.6, 1.6, 7.2); c.fillRect(bx + 1, by - 3.6, 1.6, 7.2); c.beginPath(); c.arc(bx + 6, by - 1, 2.2, 0, FX_TAU); c.fill();
      }
      /* when the visitor waves, two paper butterflies lift off the flowers and petals puff up */
      var fly = fxEnv(cyc, 4.6, 5.4, 8.6, 9.6);
      Bf.forEach(function (b, m) {
        if (fly <= 0) { return; }
        var u3 = (cyc - 4.6) / 5, x = (m ? 74 : -12) + Math.sin(u3 * 5 + b.ph) * 40 * fly, y = 136 - fly * (50 + 20 * Math.sin(u3 * 3 + b.ph)), fl = Math.abs(Math.sin(t * 13 + b.ph));
        c.globalAlpha = fly; c.fillStyle = b.col; c.beginPath(); c.ellipse(x - 4 * fl, y, 4.6 * fl + 0.4, 5.4, 0.3, 0, FX_TAU); c.ellipse(x + 4 * fl, y, 4.6 * fl + 0.4, 5.4, -0.3, 0, FX_TAU); c.fill(); c.fillStyle = '#4C1D95'; c.fillRect(x - 0.7, y - 4, 1.4, 8); c.globalAlpha = 1;
      });
      /* the page fades in when it first opens */
      if (T < 0.5) { c.globalAlpha = 1 - T / 0.5; c.fillStyle = '#0A0915'; c.fillRect(-170, 0, 340, 190); c.globalAlpha = 1; }
    };
  });

  /* Cryptex (Cipher, Rare): a brass cryptex on a desk by candlelight, a study window full of moonlight behind it. Its five
     lettered rings spin and stop one at a time, clicking into line until they spell the SAT word of the day (a new one each
     day, the same all day); then the end cap slides off and a scroll comes out and unrolls with the word and what it means.
     A moth circles the candle, dust turns in the moonbeam, and the cryptex's shadow sways as the flame flickers */
  var CP_WORDS = [['LUCID', 'clear and easy to follow'], ['TERSE', 'brief and to the point'], ['ADEPT', 'highly skilled'], ['VIVID', 'bright and striking'], ['AMPLE', 'more than enough'],
    ['SAVVY', 'shrewd, in the know'], ['INFER', 'to conclude from clues'], ['NOVEL', 'new and original'], ['OVERT', 'open, not hidden'], ['SCANT', 'barely enough'], ['TACIT', 'understood but not said'],
    ['VALID', 'well founded, sound'], ['PITHY', 'short but full of meaning'], ['STOIC', 'calm through hardship'], ['TRITE', 'overused, stale'], ['GLEAN', 'to gather bit by bit'], ['KNACK', 'a natural skill'],
    ['MERIT', 'worth, deserving'], ['ONSET', 'the start of something'], ['TENET', 'a central belief'], ['AVERT', 'to turn away, prevent'], ['ERODE', 'to wear away slowly'], ['INERT', 'still, not acting'],
    ['EVOKE', 'to call to mind'], ['ELUDE', 'to escape, slip away'], ['FEIGN', 'to pretend'], ['QUELL', 'to calm, put down'], ['LITHE', 'bending easily, graceful'], ['MIRTH', 'laughter and joy'],
    ['GAUGE', 'to measure, judge'], ['HEDGE', 'to avoid committing']];
  function cpWord() { return CP_WORDS[((cpDay() % CP_WORDS.length) + CP_WORDS.length) % CP_WORDS.length]; }
  gwStage('cryptex', function () {
    var C = 14, Mo = [], Bk = [], G = null, AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', i, lastK = -1, Sp = [];
    for (i = 0; i < 24; i++) { Mo.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6), z: fxR(0.5, 1.3) }); }
    for (i = 0; i < 16; i++) { Bk.push({ w: fxR(6, 11), h: fxR(22, 34), c: ['#7F1D1D', '#1E3A8A', '#14532D', '#78350F', '#4C1D95', '#334155'][i % 6], lean: fxRnd(i * 7) > 0.85 ? 0.12 : 0 }); }
    return function (c, t, dt) {
      var W = cpWord(), word = W[0], cyc = (t + (FX_REDUCE ? 6.2 : 0)) % C, j, q;
      var fl = lkNoise(t * 7) * 0.5 + lkNoise(t * 13 + 4) * 0.3, lx = 132, ly = 104 + fl;
      if (!G) { G = c.createLinearGradient(0, 78, 0, 122); G.addColorStop(0, '#2A1C08'); G.addColorStop(0.22, '#A07A32'); G.addColorStop(0.38, '#F6E2A0'); G.addColorStop(0.52, '#C99A3E'); G.addColorStop(0.8, '#6B4A16'); G.addColorStop(1, '#1E1405'); }
      /* the wall, the window and its moonbeam, the shelf of books lit by the candle */
      c.fillStyle = '#1A130F'; c.fillRect(-170, 0, 340, 150);
      c.strokeStyle = 'rgba(120,90,60,.18)'; c.lineWidth = 1; c.beginPath(); for (j = -150; j < 170; j += 34) { c.moveTo(j, 0); c.lineTo(j, 148); } c.stroke();
      c.fillStyle = '#0E1A2E'; c.beginPath(); c.moveTo(-148, 128); c.lineTo(-148, 34); c.quadraticCurveTo(-120, 4, -92, 34); c.lineTo(-92, 128); c.closePath(); c.fill();
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '191,219,254', -112, 30, 26, 0.6); c.fillStyle = 'rgba(226,232,240,.9)'; c.beginPath(); c.arc(-112, 30, 7, 0, FX_TAU); c.fill();
      var bm = c.createLinearGradient(-120, 40, -20, 150); bm.addColorStop(0, 'rgba(165,190,230,.16)'); bm.addColorStop(1, 'rgba(165,190,230,0)'); c.fillStyle = bm; cpPoly(c, [[-148, 40], [-92, 40], [10, 150], [-70, 150]]); c.fill();
      Mo.forEach(function (m) { var x = -140 + m.x * 130 + Math.sin(t * 0.3 + m.p) * 8, y = 40 + m.y * 108 + Math.sin(t * 0.21 + m.p * 2) * 6, inb = (x + 148 - (y - 40) * 0.5) > 0 && (x + 92 - (y - 40) * 0.93) < 0; if (inb) { fxGlow(c, '219,234,254', x, y, 1.6 * m.z, 0.5 * (0.5 + 0.5 * Math.sin(t * 1.3 + m.p))); } });
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#3B2A1E'; c.lineWidth = 3; c.beginPath(); c.moveTo(-148, 128); c.lineTo(-148, 34); c.quadraticCurveTo(-120, 4, -92, 34); c.lineTo(-92, 128); c.closePath(); c.moveTo(-120, 14); c.lineTo(-120, 128); c.moveTo(-148, 76); c.lineTo(-92, 76); c.stroke();
      var bx = 52; c.fillStyle = '#2B1D14'; c.fillRect(46, 30, 116, 4); c.fillRect(46, 76, 116, 4);
      Bk.forEach(function (b, m) { var x = bx; bx += b.w + 1; if (bx > 160) { bx = 52; } var row = m < 9 ? 30 : 76, d = Math.max(0, 1 - Math.hypot(x - lx, row - ly) / 150) * (0.85 + 0.15 * fl); c.save(); c.translate(x, row); c.rotate(b.lean); c.fillStyle = cpMix(b.c, '#0A0705', 0.75 - 0.6 * d); c.fillRect(0, -b.h, b.w, b.h); c.fillStyle = 'rgba(250,204,21,' + (0.5 * d).toFixed(3) + ')'; c.fillRect(1, -b.h + 4, b.w - 2, 1.2); c.fillRect(1, -6, b.w - 2, 1.2); c.restore(); });
      /* the desk */
      var dg = c.createLinearGradient(0, 146, 0, 190); dg.addColorStop(0, '#4A2E17'); dg.addColorStop(1, '#24150A'); c.fillStyle = dg; c.fillRect(-170, 146, 340, 44);
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 0.8; c.beginPath(); for (j = 0; j < 5; j++) { c.moveTo(-170, 154 + j * 7); c.bezierCurveTo(-60, 152 + j * 7 + 3, 40, 157 + j * 7 - 2, 170, 154 + j * 7); } c.stroke();
      c.fillStyle = 'rgba(255,214,150,.18)'; c.fillRect(-170, 146, 340, 1.5);
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', lx, 150, 120, 0.2 + 0.05 * fl); c.globalCompositeOperation = 'source-over';
      /* the ink pot and quill */
      c.fillStyle = '#0F172A'; c.beginPath(); c.moveTo(-138, 150); c.lineTo(-136, 136); c.lineTo(-124, 136); c.lineTo(-122, 150); c.closePath(); c.fill(); c.fillStyle = '#1E293B'; c.fillRect(-134, 132, 8, 4);
      c.strokeStyle = '#E7E5E4'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-130, 134); c.quadraticCurveTo(-118, 104, -100, 92); c.stroke(); c.fillStyle = 'rgba(231,229,228,.85)'; c.beginPath(); c.moveTo(-126, 124); c.quadraticCurveTo(-112, 96, -100, 92); c.quadraticCurveTo(-108, 108, -122, 128); c.closePath(); c.fill();
      /* the cryptex's shadow, thrown away from the flame */
      c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(-14 - fl * 5, 150, 112, 7, 0, 0, FX_TAU); c.fill();
      /* the rings: each spins down to its letter, one after another; at the end of the cycle they all spin away */
      var stopAt = [1.4, 2.3, 3.2, 4.1, 5.0], cap = fxEase((cyc - 6.0) / 0.9) * (1 - fxEase((cyc - 12.4) / 0.8)), scr = fxEase((cyc - 7.0) / 1.2) * (1 - fxEase((cyc - 11.6) / 0.9));
      var lit = fxEnv(cyc, 5.1, 5.5, 11.8, 12.4);
      if (cap > 0.02) { c.fillStyle = '#0C0703'; c.fillRect(70, 80, cap * 40, 40); c.fillStyle = '#120B04'; c.beginPath(); c.ellipse(70, 100, 4, 20, 0, 0, FX_TAU); c.fill(); }
      c.fillStyle = G; c.fillRect(-100, 78, 30, 44); c.fillRect(70 + cap * 40, 78, 30, 44);
      c.strokeStyle = 'rgba(40,24,6,.8)'; c.lineWidth = 1.2; [-100, -86, -70, 70 + cap * 40, 84 + cap * 40, 100 + cap * 40].forEach(function (x) { c.beginPath(); c.moveTo(x, 78); c.lineTo(x, 122); c.stroke(); });
      c.fillStyle = '#2A1C08'; c.beginPath(); c.ellipse(-100, 100, 4, 22, 0, 0, FX_TAU); c.fill(); c.fillStyle = G; c.beginPath(); c.ellipse(100 + cap * 40, 100, 4, 22, 0, 0, FX_TAU); c.fill();
      for (q = 0; q < 5; q++) {
        var x0 = -70 + q * 28, tgt = AB.indexOf(word.charAt(q)), u = Math.min(1, cyc / stopAt[q]), p = tgt - 46 * (1 - (1 - Math.pow(1 - u, 3)));
        if (cyc > stopAt[q]) { p = tgt + 0.22 * Math.sin((cyc - stopAt[q]) * 22) * Math.exp(-(cyc - stopAt[q]) * 7); }
        if (cyc > 12.2) { p = tgt + Math.pow(cyc - 12.2, 2) * 8; }
        c.fillStyle = G; c.fillRect(x0 + 1, 78, 26, 44);
        c.save(); c.beginPath(); c.rect(x0 + 1, 78, 26, 44); c.clip(); c.textAlign = 'center'; c.textBaseline = 'middle';
        for (j = Math.floor(p) - 2; j <= Math.floor(p) + 3; j++) { var th = (j - p) * FX_TAU / 10, co = Math.cos(th); if (co <= 0.08) { continue; } var y = 100 + 22 * Math.sin(th), ch = AB.charAt(((j % 26) + 26) % 26); c.save(); c.translate(x0 + 14, y); c.scale(1, co); c.font = '800 13px ' + FX_MONO; c.fillStyle = 'rgba(255,240,190,' + (0.45 * co * co).toFixed(3) + ')'; c.fillText(ch, 0.6, 1.6); c.fillStyle = 'rgba(42,22,5,' + (0.15 + 0.85 * Math.pow(co, 3)).toFixed(3) + ')'; c.fillText(ch, 0, 1); c.restore(); }
        c.restore();
        c.strokeStyle = 'rgba(30,18,4,.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 0.5, 78); c.lineTo(x0 + 0.5, 122); c.stroke();
      }
      c.strokeStyle = 'rgba(30,18,4,.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(70.5, 78); c.lineTo(70.5, 122); c.stroke();
      /* the line the letters must meet, and a click of light as each ring locks */
      var k = -1; for (q = 0; q < 5; q++) { if (cyc > stopAt[q]) { k = q; } }
      if (k !== lastK) { if (k >= 0 && cyc < 6) { for (j = 0; j < 8; j++) { var sa = fxR(0, FX_TAU), sv = fxR(20, 60); Sp.push({ x: -56 + k * 28, y: 78, vx: Math.cos(sa) * sv, vy: Math.sin(sa) * sv - 20, l: 0, m: fxR(0.3, 0.6) }); } } lastK = k; }
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = 'rgba(253,224,71,' + (0.3 + 0.6 * lit).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(-72, 92.5); c.lineTo(72, 92.5); c.moveTo(-72, 108.5); c.lineTo(72, 108.5); c.stroke();
      c.fillStyle = 'rgba(253,224,71,' + (0.5 + 0.5 * lit).toFixed(3) + ')'; cpPoly(c, [[-78, 96], [-72, 100.5], [-78, 105]]); c.fill(); cpPoly(c, [[78 + cap * 40, 96], [72 + cap * 40, 100.5], [78 + cap * 40, 105]]); c.fill();
      if (lit > 0) { fxGlow(c, '253,224,71', 0, 100, 120, 0.2 * lit); for (q = 0; q < 5; q++) { fxGlow(c, '254,240,138', -56 + q * 28, 100, 14, 0.35 * lit * (0.7 + 0.3 * Math.sin(t * 4 + q))); } }
      lkStep(Sp, dt, 60, 0.4, function (p2, f) { fxGlow(c, '253,224,71', p2.x, p2.y, 3, f); });
      /* the scroll comes out of the open end, rises and unrolls */
      if (scr > 0) {
        var ry = 104 - scr * 62, hh = 4 + 34 * fxEase((scr - 0.35) / 0.65), rx = 40 * (1 - fxEase(scr / 0.4)) + 0;
        c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(-96 + rx + 4, ry - hh / 2 + 4, 192, hh);
        var pg = c.createLinearGradient(0, ry - hh / 2, 0, ry + hh / 2); pg.addColorStop(0, '#E8D3A2'); pg.addColorStop(0.5, '#FBF0D4'); pg.addColorStop(1, '#E2C88E'); c.fillStyle = pg; c.fillRect(-96 + rx, ry - hh / 2, 192, hh);
        c.fillStyle = '#C9A86A'; c.beginPath(); fxRR(c, -100 + rx, ry - hh / 2 - 4, 200, 6, 3); fxRR(c, -100 + rx, ry + hh / 2 - 2, 200, 6, 3); c.fill();
        var ta = fxEase((scr - 0.7) / 0.3); cpWrite(c, word, rx, ry - 6, 15, '#3B1D06', ta, '700 15px ' + CP_SERIF); cpWrite(c, W[1], rx, ry + 9, 9, '#5B3A16', ta, 'italic 9px ' + CP_SERIF);
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,230,138', rx, ry, 90, 0.18 * ta);
      }
      /* the candle: wax, a flame that flickers, sparks rising, and a moth that circles it */
      c.globalCompositeOperation = 'source-over'; c.fillStyle = '#F5EBDD'; c.fillRect(lx - 6, 118, 12, 32); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(lx + 2, 118, 4, 32); c.fillStyle = '#E7D7BF'; c.beginPath(); c.ellipse(lx, 118, 6, 2, 0, 0, FX_TAU); c.fill();
      c.fillStyle = '#7C5A3A'; c.beginPath(); c.ellipse(lx, 150, 13, 3, 0, 0, FX_TAU); c.fill();
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,146,60', lx, ly, 34, 0.5); lkTongue(c, lx, 117, 15 + fl * 3, 3.4, fl * 2, 'rgba(253,186,116,.85)'); lkTongue(c, lx, 117, 9 + fl * 2, 1.8, fl * 1.4, 'rgba(255,247,214,.95)');
      var ma = t * 2.3, mx = lx + Math.cos(ma) * 16, my = ly - 6 + Math.sin(ma * 1.4) * 9, mw = Math.abs(Math.sin(t * 24)); c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(214,201,180,.85)'; c.beginPath(); c.ellipse(mx - 2.4, my, 2.6, 2.6 * mw + 0.3, 0.6, 0, FX_TAU); c.ellipse(mx + 2.4, my, 2.6, 2.6 * mw + 0.3, -0.6, 0, FX_TAU); c.fill();
      c.globalCompositeOperation = 'source-over';
    };
  });
  /* Jungle (Pop-Up, Epic): a pop-up jungle at sundown. A waterfall pours off a paper cliff, a monkey swings on a vine and a
     toucan sits on a branch, all half hidden behind two great leaves. Pull tabs slide the leaves apart and there is a lost
     temple behind them: its doorway lights, the glyphs on its steps light one by one, a banner unrolls, fireflies rise and blue
     butterflies circle it. Then two eyes in the ferns blink, a tiger folds up out of them and roars, and the toucan takes off.
     Now and then the idol inside wakes and the whole temple blazes */
  gwStage('jungle', function () {
    var C = 16, Ff = [], o = {}, Bf = [], i, FR = [];
    for (i = 0; i < 3; i++) { Bf.push({ ph: i * 2.1, r: 60 + i * 14, sp: 0.6 + i * 0.13 }); }
    for (i = 0; i < 26; i++) { FR.push({ x: -158 + i * 12.6 + fxRnd(i) * 6, h: 22 + fxRnd(i + 40) * 16, a: (fxRnd(i + 9) - 0.5) * 0.5 }); }
    function frond(c, x, y, h, a, n) { c.save(); c.translate(x, y); c.rotate(a); c.moveTo(0, 0); for (var k = 0; k < n; k++) { var yy = -h * (k + 1) / (n + 1), w = h * 0.28 * (1 - k / (n + 1)); c.moveTo(0, yy); c.ellipse(-w * 0.6, yy + 2, w * 0.7, 2.2, -0.5, 0, FX_TAU); c.moveTo(0, yy); c.ellipse(w * 0.6, yy + 2, w * 0.7, 2.2, 0.5, 0, FX_TAU); } c.rect(-0.8, -h, 1.6, h); c.restore(); }
    function leaf(c, x, y, L, a) { c.save(); c.translate(x, y); c.rotate(a); c.moveTo(0, 0); c.bezierCurveTo(-L * 0.55, -L * 0.25, -L * 0.45, -L * 0.9, 0, -L); c.bezierCurveTo(L * 0.45, -L * 0.9, L * 0.55, -L * 0.25, 0, 0); c.restore(); }
    function veins(c, x, y, L, a) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(0, -2); c.lineTo(0, -L * 0.92); for (var k = 1; k < 6; k++) { var yy = -L * k / 6.4; c.moveTo(0, yy); c.lineTo(-L * 0.3, yy - L * 0.1); c.moveTo(0, yy); c.lineTo(L * 0.3, yy - L * 0.1); } c.stroke(); c.restore(); }
    return function (c, t, dt) {
      var T = t + (FX_REDUCE ? 4.6 : 0), cyc = T % C, n = Math.floor(T / C), rare = n % 4 === 3, j;
      var f1 = fxEase(T / 0.7), f2 = fxEase((T - 0.2) / 0.7), f3 = fxEase((T - 0.4) / 0.7), f4 = fxEase((T - 0.6) / 0.7);
      var open = fxEase((cyc - 2.4) / 2.0) * (1 - fxEase((cyc - 14.0) / 1.6)), rev = fxEase((cyc - 4.2) / 1.0) * (1 - fxEase((cyc - 13.6) / 1.0)), ban = fxEnv(cyc, 4.8, 5.6, 13.2, 13.8);
      var roar = fxEnv(cyc, 9.4, 9.8, 11.0, 11.6), shake = roar > 0.9 ? Math.sin(t * 60) * 1.2 : 0, idol = rare ? fxEnv(cyc, 6.0, 6.6, 12.6, 13.4) : 0;
      /* the back page: a sunset in three strips of paper, and the sun */
      c.fillStyle = '#F4EBD9'; c.fillRect(-152, 6, 304, 146);
      [['#F28C45', 12], ['#F6A95B', 52], ['#F9C978', 92], ['#FBE2A6', 124]].forEach(function (q) { c.fillStyle = q[0]; c.fillRect(-144, q[1], 288, 150 - q[1]); });
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,214,140', 52, 88, 60, 0.35); c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#FFE9B0'; c.beginPath(); c.arc(52, 88, 20, 0, FX_TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; c.beginPath(); c.arc(52, 88, 25, 0, FX_TAU); c.stroke();
      /* the far canopy and the cliff with its waterfall */
      cpCut(c, 150, f1, function (c) { c.beginPath(); c.moveTo(-144, 150); for (var x = -144; x <= 144; x += 12) { c.arc(x, 112 + 8 * Math.sin(x * 0.07), 13, Math.PI, 0); } c.lineTo(144, 150); c.closePath(); }, '#4B8B63', 4);
      cpCut(c, 154, f2, function (c) { cpPoly(c, [[-150, 154], [-150, 38], [-136, 32], [-118, 40], [-104, 36], [-92, 58], [-96, 154]]); }, '#6E7E6C', 5);
      if (f2 > 0.9) {
        c.fillStyle = '#BEE8F4'; c.fillRect(-128, 42, 20, 104); c.save(); c.beginPath(); c.rect(-128, 42, 20, 104); c.clip(); c.fillStyle = 'rgba(255,255,255,.85)'; for (j = 0; j < 9; j++) { var wy = 42 + ((t * 60 + j * 14) % 126) - 14; c.fillRect(-126 + (j % 3) * 6, wy, 3, 9); } c.restore();
        c.fillStyle = '#9ED6E8'; c.beginPath(); c.ellipse(-112, 148, 26, 5, 0, 0, FX_TAU); c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1; for (j = 0; j < 2; j++) { var ru = (t * 0.7 + j * 0.5) % 1; c.globalAlpha = 1 - ru; c.beginPath(); c.ellipse(-118, 148, 6 + ru * 18, 1.4 + ru * 3, 0, 0, FX_TAU); c.stroke(); } c.globalAlpha = 1;
      }
      /* the temple: five steps, the stair, the shrine on top with its doorway, glyphs on the steps and vines */
      cpCut(c, 152, f2, function (c) { c.beginPath(); for (var k = 0; k < 5; k++) { var w = 62 - k * 10; c.rect(-w, 150 - (k + 1) * 11, w * 2, 11.4); } c.rect(-14, 78, 28, 18); c.rect(-18, 74, 36, 5); }, '#9AA78A', 5);
      if (f2 > 0.9) {
        for (j = 0; j < 5; j++) { var sw = 62 - j * 10, sy = 150 - (j + 1) * 11; c.fillStyle = '#7B876C'; c.fillRect(-sw, sy, sw * 2, 2); c.fillStyle = '#B9C4A6'; c.fillRect(-7, sy + 2, 14, 9);
          for (var g = 0; g < 2; g++) { var gx = (g ? 1 : -1) * (sw * 0.55 + 4), on = rev * Math.max(0, Math.min(1, (cyc - 5.0 - j * 0.35) / 0.3)), ga = 0.35 + 0.65 * on; c.strokeStyle = on > 0.05 ? 'rgba(253,224,71,' + ga.toFixed(3) + ')' : 'rgba(70,80,60,.6)'; c.lineWidth = 1.2; c.beginPath(); if ((j + g) % 3 === 0) { c.arc(gx, sy + 6, 2.6, 0, FX_TAU); } else if ((j + g) % 3 === 1) { c.moveTo(gx - 3, sy + 9); c.lineTo(gx, sy + 3); c.lineTo(gx + 3, sy + 9); } else { c.moveTo(gx - 3, sy + 3); c.lineTo(gx + 3, sy + 3); c.moveTo(gx, sy + 3); c.lineTo(gx, sy + 9); } c.stroke(); if (on > 0.5) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', gx, sy + 6, 7, 0.5 * on); c.globalCompositeOperation = 'source-over'; } }
        }
        c.fillStyle = '#2A1F14'; c.fillRect(-6, 82, 12, 14);
        if (rev > 0) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,186,80', 0, 89, 22 + 30 * idol, 0.6 * rev + 0.4 * idol); c.fillStyle = 'rgba(253,200,100,' + (0.8 * rev).toFixed(3) + ')'; c.fillRect(-5, 83, 10, 13); if (idol > 0) { for (j = 0; j < 10; j++) { lkBeam(c, 0, 89, -Math.PI / 2 + (j - 4.5) * 0.3 + Math.sin(t + j) * 0.05, 120, 0.06, '253,224,71', 0.3 * idol); } } c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(120,70,10,' + (0.9 * rev).toFixed(3) + ')'; c.beginPath(); c.arc(0, 88, 2.4, 0, FX_TAU); c.fill(); c.fillRect(-2.6, 90, 5.2, 5); }
        c.strokeStyle = '#4E8A3A'; c.lineWidth = 1.4; c.beginPath(); [[-50, 128, 18], [-30, 106, 14], [40, 118, 22], [24, 98, 12]].forEach(function (v) { c.moveTo(v[0], v[1]); c.quadraticCurveTo(v[0] + 4 + Math.sin(t + v[0]) * 2, v[1] + v[2] * 0.5, v[0] + 1, v[1] + v[2]); }); c.stroke();
      }
      /* the monkey on its vine and the toucan on its branch */
      if (f3 > 0.9) {
        var ph = Math.sin(t * 1.3) * 0.55, L = 72, mx = 26 + Math.sin(ph) * L, my = 4 + Math.cos(ph) * L;
        c.strokeStyle = '#3F6B2A'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(26, 4); c.quadraticCurveTo(26 + Math.sin(ph) * L * 0.5 + 6, 4 + L * 0.5, mx, my); c.stroke();
        c.fillStyle = '#7A4A26'; c.beginPath(); c.arc(mx, my + 8, 6, 0, FX_TAU); c.arc(mx + 1, my - 1, 4.6, 0, FX_TAU); c.fill(); c.fillStyle = '#E9C49A'; c.beginPath(); c.ellipse(mx + 2, my, 3, 2.4, 0, 0, FX_TAU); c.fill(); c.strokeStyle = '#7A4A26'; c.lineWidth = 2; c.beginPath(); c.moveTo(mx, my + 13); c.quadraticCurveTo(mx - 12, my + 18, mx - 9, my + 8); c.moveTo(mx - 2, my + 4); c.lineTo(mx, my - 4); c.stroke();
        var fly = fxEase((cyc - 9.8) / 1.4) * (1 - fxEase((cyc - 13.0) / 1.4)), tx2 = 118 - fly * 230, ty2 = 62 - fly * 40 * Math.sin(fly * Math.PI) - fly * 10, fl2 = fly > 0.02 && fly < 0.98 ? Math.sin(t * 20) : 0;
        c.strokeStyle = '#5B3A1E'; c.lineWidth = 3; c.beginPath(); c.moveTo(150, 72); c.quadraticCurveTo(122, 62, 100, 70); c.stroke(); c.fillStyle = '#3F7D46'; c.beginPath(); c.ellipse(140, 64, 8, 3, -0.4, 0, FX_TAU); c.ellipse(106, 64, 7, 3, 0.5, 0, FX_TAU); c.fill();
        c.save(); c.translate(tx2, ty2); if (fly > 0.5) { c.scale(-1, 1); }
        c.fillStyle = '#111111'; c.beginPath(); c.ellipse(0, 0, 6, 8, 0.2, 0, FX_TAU); c.fill(); c.fillStyle = '#FEF3C7'; c.beginPath(); c.ellipse(-2.6, -3, 3, 4, 0.2, 0, FX_TAU); c.fill();
        c.fillStyle = '#F59E0B'; c.beginPath(); c.moveTo(-3, -7); c.quadraticCurveTo(-16, -9, -19, -2); c.quadraticCurveTo(-12, -4, -3, -4); c.fill(); c.fillStyle = '#111111'; c.beginPath(); c.arc(-17.4, -3.4, 1.6, 0, FX_TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-1, -6, 1.2, 0, FX_TAU); c.fill();
        if (fl2) { c.fillStyle = '#111111'; c.beginPath(); c.ellipse(3, -4 - fl2 * 6, 9, 3, -0.6 - fl2 * 0.5, 0, FX_TAU); c.fill(); }
        c.restore();
      }
      /* the two great leaves, pulled apart on their tabs */
      cpCut(c, 158, f3, function (c) { c.beginPath(); var xl = -38 - open * 92, xr = 38 + open * 92; leaf(c, xl, 158, 104, -0.25); leaf(c, xl - 18, 158, 84, -0.6); leaf(c, xl + 16, 158, 76, 0.2); leaf(c, xr, 158, 104, 0.25); leaf(c, xr + 18, 158, 84, 0.6); leaf(c, xr - 16, 158, 76, -0.2); }, '#2F7D4F', 6);
      if (f3 > 0.9) { var xl2 = -38 - open * 92, xr2 = 38 + open * 92; c.strokeStyle = 'rgba(190,240,200,.55)'; c.lineWidth = 1; [[xl2, 104, -0.25], [xl2 - 18, 84, -0.6], [xl2 + 16, 76, 0.2], [xr2, 104, 0.25], [xr2 + 18, 84, 0.6], [xr2 - 16, 76, -0.2]].forEach(function (q) { veins(c, q[0], 158, q[1], q[2]); });
        c.fillStyle = '#F97316'; [[-150 - open * 6, 128], [138 + open * 6, 128]].forEach(function (q) { c.beginPath(); fxRR(c, q[0], q[1], 14, 10, 2); c.fill(); }); }
      /* the tiger: eyes in the ferns, then the whole head folds up and roars */
      c.save(); c.translate(shake, 0);
      if (roar > 0.02) {
        cpCut(c, 176, roar, function (c) { c.beginPath(); c.arc(-26, 140, 17, 0, FX_TAU); c.moveTo(-40, 128); c.arc(-38, 127, 6, 0, FX_TAU); c.moveTo(-8, 128); c.arc(-14, 127, 6, 0, FX_TAU); }, '#F08A24', 4);
        if (roar > 0.9) { c.fillStyle = '#1C1917'; [[-36, 132, -0.6], [-16, 132, 0.6], [-26, 125, 0], [-41, 143, -1.2], [-11, 143, 1.2]].forEach(function (q) { c.save(); c.translate(q[0], q[1]); c.rotate(q[2]); c.fillRect(-1.2, -5, 2.4, 9); c.restore(); });
          c.fillStyle = '#FFF7ED'; c.beginPath(); c.ellipse(-26, 148, 10, 7, 0, 0, FX_TAU); c.fill(); c.fillStyle = '#7F1D1D'; c.beginPath(); c.ellipse(-26, 151, 6, 4 + 2 * Math.abs(Math.sin(t * 9)), 0, 0, FX_TAU); c.fill(); c.fillStyle = '#FFFFFF'; cpPoly(c, [[-31, 147], [-29.5, 151], [-28, 147]]); c.fill(); cpPoly(c, [[-24, 147], [-22.5, 151], [-21, 147]]); c.fill();
          c.fillStyle = '#FDE047'; c.beginPath(); c.ellipse(-32, 136, 3, 2.4, 0.3, 0, FX_TAU); c.ellipse(-20, 136, 3, 2.4, -0.3, 0, FX_TAU); c.fill(); c.fillStyle = '#111111'; c.fillRect(-32.6, 134, 1.2, 4.4); c.fillRect(-20.6, 134, 1.2, 4.4);
          c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.4; for (j = 0; j < 3; j++) { var ru2 = ((t * 1.6) + j / 3) % 1; c.globalAlpha = (1 - ru2) * roar; c.beginPath(); c.arc(-26, 148, 18 + ru2 * 40, -0.9, 0.9); c.stroke(); c.beginPath(); c.arc(-26, 148, 18 + ru2 * 40, Math.PI - 0.9, Math.PI + 0.9); c.stroke(); } c.globalAlpha = 1; }
      }
      cpCut(c, 176, f4, function (c) { c.beginPath(); FR.forEach(function (q) { if (q.x > -44 && q.x < -8) { return; } frond(c, q.x, 178, q.h, q.a, 6); }); c.rect(-160, 170, 320, 10); }, '#1F5A3A', 3);
      if (f4 > 0.9 && roar < 0.05) { var bl = (cyc % 3.3) < 0.14 ? 0.1 : 1; c.globalCompositeOperation = 'lighter'; [-32, -20].forEach(function (ex) { fxGlow(c, '190,242,100', ex, 158, 6, 0.6); }); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#D9F99D'; [-32, -20].forEach(function (ex) { c.beginPath(); c.ellipse(ex, 158, 2.8, 2.2 * bl, 0, 0, FX_TAU); c.fill(); }); c.fillStyle = '#111111'; [-32, -20].forEach(function (ex) { c.fillRect(ex - 0.5, 158 - 2 * bl, 1, 4 * bl); }); }
      c.restore();
      /* fireflies rising, butterflies circling, the banner */
      lkEvery(o, rev * 6, dt, function () { Ff.push({ x: fxR(-150, 150), y: fxR(150, 172), vx: fxR(-6, 6), vy: fxR(-16, -8), l: 0, m: fxR(1.6, 2.8), p: fxR(0, 6) }); });
      c.globalCompositeOperation = 'lighter'; lkStep(Ff, dt, 0, 0, function (p, f) { fxGlow(c, '217,249,157', p.x + Math.sin(p.l * 4 + p.p) * 4, p.y, 3.4, Math.sin(f * Math.PI) * (0.5 + 0.5 * Math.sin(p.l * 9 + p.p))); }); c.globalCompositeOperation = 'source-over';
      Bf.forEach(function (b) { var a = t * b.sp + b.ph, x = Math.cos(a) * b.r, y = 86 + Math.sin(a * 1.7) * 22, w = Math.abs(Math.sin(t * 14 + b.ph)), al = 0.4 + 0.6 * open; c.globalAlpha = al; c.fillStyle = '#2563EB'; c.beginPath(); c.ellipse(x - 3.4 * w, y, 3.6 * w + 0.4, 4.6, 0.3, 0, FX_TAU); c.ellipse(x + 3.4 * w, y, 3.6 * w + 0.4, 4.6, -0.3, 0, FX_TAU); c.fill(); c.fillStyle = '#93C5FD'; c.beginPath(); c.ellipse(x - 3 * w, y - 1, 1.6 * w + 0.2, 2.2, 0.3, 0, FX_TAU); c.ellipse(x + 3 * w, y - 1, 1.6 * w + 0.2, 2.2, -0.3, 0, FX_TAU); c.fill(); c.globalAlpha = 1; });
      if (ban > 0) { var bw = 152 * ban; c.fillStyle = 'rgba(20,10,0,.25)'; c.fillRect(-bw / 2 + 3, 15, bw, 16); c.fillStyle = '#FFF7E6'; c.fillRect(-bw / 2, 12, bw, 16); c.strokeStyle = '#B45309'; c.lineWidth = 1.2; c.strokeRect(-bw / 2 + 2, 14, bw - 4, 12); c.fillStyle = '#C2410C'; cpPoly(c, [[-bw / 2, 12], [-bw / 2 - 9, 20], [-bw / 2, 28]]); c.fill(); cpPoly(c, [[bw / 2, 12], [bw / 2 + 9, 20], [bw / 2, 28]]); c.fill(); cpWrite(c, rare ? 'YOU WOKE THE IDOL!' : 'THE LOST TEMPLE', 0, 20.5, 8, '#7C2D12', fxEase((ban - 0.6) / 0.4)); }
      if (T < 0.5) { c.globalAlpha = 1 - T / 0.5; c.fillStyle = '#0A0915'; c.fillRect(-170, 0, 340, 190); c.globalAlpha = 1; }
    };
  });

  /* Vault (Cipher, Legendary): a round vault door in a marble hall, red lasers sweeping the floor in front of it. The dial turns
     left, right and left to today's date (month, day, year), and an x-ray window in the door shows the three wheels inside
     turning until their notches line up and the bar drops. The lasers go out, twelve bolts slide back one by one, the wheel
     spins and the door swings open on a room of gold light. What is inside changes: gold, a jewel, a golden pencil, and once in
     a while a sleeping cat */
  gwStage('vault', function () {
    var C = 20, Du = [], Sk = [], Vn = [], i, lastB = 0;
    for (i = 0; i < 28; i++) { Du.push({ x: fxR(-60, 60), y: fxR(60, 160), p: fxR(0, 6), z: fxR(0.5, 1.3) }); }
    for (i = 0; i < 6; i++) { var pts = [], x = fxR(-160, 160), y = fxR(0, 150); for (var q = 0; q < 6; q++) { pts.push([x, y]); x += fxR(-18, 18); y += fxR(8, 26); } Vn.push(pts); }
    function num(v) { return ((Math.round(v) % 100) + 100) % 100; }
    function two(v) { return ('0' + v).slice(-2); }
    return function (c, t, dt) {
      var T = t + (FX_REDUCE ? 9.8 : 0), cyc = T % C, n = Math.floor(T / C), now = new Date(), code = [now.getMonth() + 1, now.getDate(), now.getFullYear() % 100];
      var v1 = code[0] + 100, d2 = ((v1 - code[1]) % 100 + 100) % 100 + 100, v2 = v1 - d2, d3 = ((code[2] - v2) % 100 + 100) % 100; if (d3 < 30) { d3 += 100; } var v3 = v2 + d3;
      var v = cyc < 1 ? 0 : cyc < 2.6 ? v1 * fxEase((cyc - 1) / 1.6) : cyc < 4 ? v1 - d2 * fxEase((cyc - 2.6) / 1.4) : cyc < 5.4 ? v2 + d3 * fxEase((cyc - 4) / 1.4) : cyc < 17.8 ? v3 : v3 + 260 * fxEase((cyc - 17.8) / 1.6);
      var stage = cyc < 1 ? 0 : cyc < 2.6 ? 1 : cyc < 4 ? 2 : cyc < 5.4 ? 3 : 4;
      var lz = Math.max(0, Math.min(1, 1 - fxEase((cyc - 5.4) / 0.4) + fxEase((cyc - 17.8) / 0.6))), sw = fxEase((cyc - 7.0) / 1.2) * (1 - fxEase((cyc - 17.0) / 0.8));
      var al = 1.85 * fxEase((cyc - 8.2) / 2.0) * (1 - fxEase((cyc - 15.0) / 2.0)), opn = Math.sin(Math.min(al, 1.57)), inside = n > 0 && fxRnd(n * 7.3 + 3.1) < 0.14 ? 3 : n % 3, j;
      /* the hall: marble wall with veins, two columns, a polished floor */
      var wg = c.createLinearGradient(0, 0, 0, 150); wg.addColorStop(0, '#11141C'); wg.addColorStop(1, '#232838'); c.fillStyle = wg; c.fillRect(-170, 0, 340, 150);
      c.strokeStyle = 'rgba(200,210,230,.08)'; c.lineWidth = 1; Vn.forEach(function (pts) { c.beginPath(); pts.forEach(function (p, m) { if (m) { c.lineTo(p[0], p[1]); } else { c.moveTo(p[0], p[1]); } }); c.stroke(); });
      [-128, 128].forEach(function (x) { var cg = c.createLinearGradient(x - 13, 0, x + 13, 0); cg.addColorStop(0, '#2B3040'); cg.addColorStop(0.5, '#4A5168'); cg.addColorStop(1, '#22263A'); c.fillStyle = cg; c.fillRect(x - 13, 14, 26, 136); c.fillStyle = '#3A4054'; c.fillRect(x - 17, 8, 34, 8); c.fillRect(x - 17, 144, 34, 8); c.strokeStyle = 'rgba(0,0,0,.35)'; c.beginPath(); for (j = -2; j <= 2; j++) { c.moveTo(x + j * 5, 18); c.lineTo(x + j * 5, 142); } c.stroke(); c.fillStyle = 'rgba(248,113,113,.9)'; [112, 128, 142].forEach(function (y) { c.fillRect(x + (x < 0 ? 12 : -15), y - 1.5, 3, 3); }); });
      var fg = c.createLinearGradient(0, 150, 0, 190); fg.addColorStop(0, '#2A3042'); fg.addColorStop(1, '#0F121A'); c.fillStyle = fg; c.fillRect(-170, 150, 340, 40);
      /* the light from inside, falling across the floor and catching the dust */
      if (opn > 0.02) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,214,120', 0, 92, 110, 0.35 * opn); for (j = 0; j < 7; j++) { lkBeam(c, 0, 92, Math.PI / 2 + (j - 3) * 0.22, 120, 0.09, '253,224,150', 0.12 * opn); } var lg = c.createRadialGradient(0, 168, 0, 0, 168, 120); lg.addColorStop(0, 'rgba(253,214,120,' + (0.4 * opn).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(253,214,120,0)'); c.fillStyle = lg; c.beginPath(); c.ellipse(0, 168, 120, 18, 0, 0, FX_TAU); c.fill();
        Du.forEach(function (d) { var x = d.x + Math.sin(t * 0.4 + d.p) * 6, y = d.y + Math.sin(t * 0.3 + d.p * 2) * 5; fxGlow(c, '254,240,138', x, y, 1.5 * d.z, 0.5 * opn * (0.5 + 0.5 * Math.sin(t * 2 + d.p))); }); c.globalCompositeOperation = 'source-over'; }
      /* the frame of the door, and the room inside when it is open */
      c.fillStyle = '#2E3444'; c.beginPath(); c.arc(0, 92, 72, 0, FX_TAU); c.fill(); c.strokeStyle = '#596178'; c.lineWidth = 2; c.stroke();
      for (j = 0; j < 24; j++) { var ra = j / 24 * FX_TAU; c.fillStyle = '#6B7490'; c.beginPath(); c.arc(Math.cos(ra) * 67, 92 + Math.sin(ra) * 67, 1.4, 0, FX_TAU); c.fill(); }
      c.fillStyle = '#07080C'; c.beginPath(); c.arc(0, 92, 60, 0, FX_TAU); c.fill();
      if (al > 0.01) {
        c.save(); c.beginPath(); c.arc(0, 92, 59, 0, FX_TAU); c.clip();
        var ig = c.createRadialGradient(0, 100, 4, 0, 92, 70); ig.addColorStop(0, '#FDE68A'); ig.addColorStop(0.45, '#B7791F'); ig.addColorStop(1, '#3B2506'); c.fillStyle = ig; c.fillRect(-60, 32, 120, 120);
        c.fillStyle = 'rgba(60,35,5,.6)'; c.fillRect(-60, 70, 120, 3); c.fillRect(-60, 112, 120, 3);
        for (j = 0; j < 9; j++) { var gx = -52 + j * 12.5; [[gx, 70], [gx + 4, 112]].forEach(function (q, m) { if (inside === 3 && m === 1 && Math.abs(q[0]) < 20) { return; } c.fillStyle = m ? '#E0A82E' : '#F2C94C'; cpPoly(c, [[q[0], q[1]], [q[0] + 10, q[1]], [q[0] + 8.6, q[1] - 5], [q[0] + 1.4, q[1] - 5]]); c.fill(); c.fillStyle = 'rgba(255,250,220,.6)'; c.fillRect(q[0] + 2, q[1] - 4.6, 6, 1); }); }
        c.fillStyle = '#5B3A10'; c.fillRect(-12, 128, 24, 24); c.fillStyle = '#8A5A16'; c.fillRect(-15, 126, 30, 4);
        if (inside === 0) { for (j = 0; j < 4; j++) { c.fillStyle = j % 2 ? '#E0A82E' : '#F2C94C'; cpPoly(c, [[-10 + j % 2 * 3, 126 - j * 5], [10 + j % 2 * 3, 126 - j * 5], [8 + j % 2 * 3, 121 - j * 5], [-8 + j % 2 * 3, 121 - j * 5]]); c.fill(); } }
        else if (inside === 1) { gwGem(c, 0, 112, 11, 190 + Math.sin(t) * 20, 85, 60, 1, 1, t * 0.5); }
        else if (inside === 2) { c.save(); c.translate(0, 118); c.rotate(-0.35); c.fillStyle = '#F2C94C'; c.fillRect(-16, -3, 26, 6); c.fillStyle = '#FBCFE8'; c.fillRect(-20, -3, 4, 6); c.fillStyle = '#D4D4D8'; c.fillRect(-16.5, -3, 2, 6); c.fillStyle = '#FDE7B0'; cpPoly(c, [[10, -3], [17, 0], [10, 3]]); c.fill(); c.fillStyle = '#3F3F46'; cpPoly(c, [[14.6, -1.1], [17, 0], [14.6, 1.1]]); c.fill(); c.restore(); }
        else { c.fillStyle = '#EA7A2A'; c.beginPath(); c.ellipse(0, 121, 15, 7, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.arc(11, 117, 6, 0, FX_TAU); c.fill(); cpPoly(c, [[7, 113], [8, 106], [12, 112]]); c.fill(); cpPoly(c, [[12, 112], [16, 106], [16, 114]]); c.fill(); c.strokeStyle = '#9A3F0E'; c.lineWidth = 1; c.beginPath(); c.moveTo(9, 117); c.lineTo(11, 117.6); c.moveTo(13, 117.6); c.lineTo(15, 117); c.stroke(); c.lineWidth = 3; c.strokeStyle = '#EA7A2A'; c.beginPath(); c.moveTo(-14, 121); c.quadraticCurveTo(-20, 128, -6, 128); c.stroke(); cpWrite(c, 'z', 20 + Math.sin(t * 2) * 2, 104 - (t * 6) % 10, 7, '#FFF7ED', 0.9, 'italic 700 8px ' + CP_SERIF); cpWrite(c, 'z', 26, 96 - (t * 6 + 5) % 10, 6, '#FFF7ED', 0.7, 'italic 700 6px ' + CP_SERIF); }
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,247,214', 0, 112, 30, 0.5 + 0.2 * Math.sin(t * 3)); fxStar4(c, 6 + Math.sin(t * 2) * 8, 104, 6 * Math.abs(Math.sin(t * 2.6)), 0.9, '#FFFFFF'); c.globalCompositeOperation = 'source-over';
        c.restore();
      }
      /* the door, swung by its hinge on the left: thickness first, then the face (or its back, past a quarter turn) */
      var ca = Math.cos(al), dx = -66 + 66 * ca, sx = Math.max(0.02, Math.abs(ca)), back = ca < 0;
      c.save(); c.translate(dx, 92); c.fillStyle = '#3A4152'; c.beginPath(); c.ellipse(Math.sin(al) * 12, 0, 60 * sx, 60, 0, 0, FX_TAU); c.fill(); c.restore();
      c.save(); c.translate(dx, 92); c.scale(back ? -sx : sx, 1);
      var dg = c.createRadialGradient(-22, -24, 6, 0, 0, 62); dg.addColorStop(0, back ? '#5A6276' : '#C3CBDA'); dg.addColorStop(0.55, back ? '#3A4152' : '#7D879C'); dg.addColorStop(1, back ? '#262B38' : '#4B5468'); c.fillStyle = dg; c.beginPath(); c.arc(0, 0, 60, 0, FX_TAU); c.fill();
      c.strokeStyle = 'rgba(20,24,32,.6)'; c.lineWidth = 1.4; [50, 36].forEach(function (r) { c.beginPath(); c.arc(0, 0, r, 0, FX_TAU); c.stroke(); });
      for (j = 0; j < 12; j++) { var ba = j / 12 * FX_TAU + 0.13, bu = Math.min(1, Math.max(0, (cyc - 5.8 - j * 0.09) / 0.15)) * (1 - Math.min(1, Math.max(0, (cyc - 17.0 - j * 0.05) / 0.15))), r0 = 50, r1 = 68 - 14 * bu; c.save(); c.rotate(ba); c.fillStyle = back ? '#8A93A8' : '#B9C2D2'; c.fillRect(r0, -3.4, r1 - r0, 6.8); c.fillStyle = 'rgba(30,34,46,.45)'; c.fillRect(r0, 1.8, r1 - r0, 1.6); c.restore(); if (bu > 0 && bu < 1 && Math.floor(cyc * 40) % 2 && !back) { Sk.push({ x: dx + Math.cos(ba) * 60 * sx, y: 92 + Math.sin(ba) * 60, vx: fxR(-30, 30), vy: fxR(-40, 10), l: 0, m: fxR(0.2, 0.5) }); } }
      if (!back) {
        c.save(); c.rotate(sw * FX_TAU * 1.25); c.strokeStyle = '#D5DCE8'; c.lineWidth = 4.4; c.lineCap = 'round'; for (j = 0; j < 6; j++) { var wa = j / 6 * FX_TAU; c.beginPath(); c.moveTo(Math.cos(wa) * 6, 14 + Math.sin(wa) * 6); c.lineTo(Math.cos(wa) * 22, 14 + Math.sin(wa) * 22); c.stroke(); c.fillStyle = '#E7ECF4'; c.beginPath(); c.arc(Math.cos(wa) * 23, 14 + Math.sin(wa) * 23, 3.2, 0, FX_TAU); c.fill(); } c.restore();
        c.fillStyle = '#9AA3B6'; c.beginPath(); c.arc(0, 14, 7, 0, FX_TAU); c.fill(); c.strokeStyle = '#5B647A'; c.lineWidth = 1; c.stroke();
        c.fillStyle = '#1A1E28'; c.beginPath(); c.arc(-28, -22, 15, 0, FX_TAU); c.fill(); c.save(); c.translate(-28, -22); c.rotate(-v / 100 * FX_TAU); c.strokeStyle = '#E5E7EB'; c.lineWidth = 0.8; for (j = 0; j < 50; j++) { var ta = j / 50 * FX_TAU; c.beginPath(); c.moveTo(Math.cos(ta) * 13, Math.sin(ta) * 13); c.lineTo(Math.cos(ta) * (j % 5 ? 11.4 : 10), Math.sin(ta) * (j % 5 ? 11.4 : 10)); c.stroke(); } c.fillStyle = '#9CA3AF'; c.beginPath(); c.arc(0, 0, 6, 0, FX_TAU); c.fill(); c.restore();
        c.fillStyle = '#F87171'; cpPoly(c, [[-28, -40], [-31, -44], [-25, -44]]); c.fill(); cpWrite(c, two(num(v)), -28, -22, 6, '#111827', 1, '700 6px ' + FX_MONO);
        /* the x-ray window: the three wheels inside, each turning until its notch is at the top */
        c.fillStyle = '#04161C'; c.beginPath(); c.arc(28, -22, 16, 0, FX_TAU); c.fill(); c.save(); c.beginPath(); c.arc(28, -22, 15, 0, FX_TAU); c.clip();
        var wa1 = stage < 1 ? (0 - v1) / 100 * FX_TAU : stage === 1 ? (v - v1) / 100 * FX_TAU : 0, wa2 = stage < 2 ? d2 / 100 * FX_TAU : stage === 2 ? (v - v2) / 100 * FX_TAU : 0, wa3 = stage < 3 ? -d3 / 100 * FX_TAU : stage === 3 ? (v - v3) / 100 * FX_TAU : 0;
        if (cyc > 17.8) { var back3 = fxEase((cyc - 17.8) / 1.6); wa1 = -v1 / 100 * FX_TAU * back3; wa2 = d2 / 100 * FX_TAU * back3; wa3 = -d3 / 100 * FX_TAU * back3; }
        [[13, wa1], [9.4, wa2], [5.8, wa3]].forEach(function (w, m) { c.strokeStyle = 'rgba(103,232,249,' + (0.5 + 0.15 * m).toFixed(2) + ')'; c.lineWidth = 2.2; c.beginPath(); c.arc(28, -22, w[0], -Math.PI / 2 + w[1] + 0.22, -Math.PI / 2 + w[1] + FX_TAU - 0.22); c.stroke(); });
        var fence = fxEase((cyc - 5.4) / 0.3) * (1 - fxEase((cyc - 17.8) / 0.3)); c.fillStyle = 'rgba(165,243,252,.95)'; c.fillRect(26.6, -40 + fence * 6, 2.8, 8);
        c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(34,211,238,.12)'; c.fillRect(12, -38, 32, 32); c.fillStyle = 'rgba(165,243,252,.25)'; c.fillRect(12, -38 + ((t * 30) % 32), 32, 1.2); c.restore(); c.globalCompositeOperation = 'source-over';
        c.strokeStyle = '#596178'; c.lineWidth = 1.6; c.beginPath(); c.arc(28, -22, 16, 0, FX_TAU); c.stroke();
      }
      c.restore();
      c.globalCompositeOperation = 'lighter'; lkStep(Sk, dt, 80, 0.4, function (p, f) { fxGlow(c, '253,224,71', p.x, p.y, 2.4, f); }); c.globalCompositeOperation = 'source-over';
      /* the lasers */
      if (lz > 0.01) { c.globalCompositeOperation = 'lighter'; [112, 128, 142].forEach(function (y, m) { var y1 = y + 10 * Math.sin(t * 0.9 + m * 2), y2 = y + 14 * Math.sin(t * 0.7 + m * 3 + 1); c.strokeStyle = 'rgba(248,113,113,' + (0.25 * lz).toFixed(3) + ')'; c.lineWidth = 4; c.beginPath(); c.moveTo(-115, y); c.lineTo(115, y2 + (y1 - y) * 0.2); c.stroke(); c.strokeStyle = 'rgba(254,202,202,' + (0.9 * lz).toFixed(3) + ')'; c.lineWidth = 1; c.stroke(); fxGlow(c, '248,113,113', -115, y, 5, lz); fxGlow(c, '248,113,113', 115, y2 + (y1 - y) * 0.2, 5, lz); }); c.globalCompositeOperation = 'source-over'; }
      /* the readout above the door */
      c.fillStyle = '#05140C'; c.beginPath(); fxRR(c, -40, 4, 80, 15, 3); c.fill(); c.strokeStyle = '#3A4152'; c.lineWidth = 1.4; c.stroke();
      var txt = cyc < 1 ? '-- -- --' : stage < 4 ? [0, 1, 2].map(function (q) { return q < stage - 1 ? two(code[q]) : q === stage - 1 ? (Math.floor(t * 4) % 2 ? two(num(v)) : '  ') : '--'; }).join(' ') : cyc < 15 ? (Math.floor(cyc * 2) % 2 && cyc < 7 ? two(code[0]) + ' ' + two(code[1]) + ' ' + two(code[2]) : 'GRANTED') : 'LOCKED';
      c.globalCompositeOperation = 'lighter'; cpWrite(c, txt, 0, 11.6, 8, cyc >= 15 ? '#F87171' : '#4ADE80', 1, '700 9px ' + FX_MONO); c.globalCompositeOperation = 'source-over';
    };
  });
  /* Once upon a time (Pop-Up, Mythic): an open pop-up book on a table by lamplight, its ribbon hanging over the edge. The pages
     turn by themselves, and at every turn the scene on the last spread folds flat while the next one folds up, layer after
     layer, with a line of the story on a strip of paper above: a ship on rolling waves, mountains white with snow where a tiny
     climber reaches the flag, a forest at night with a lit cabin and a deer, and a city of lights with fireworks and a train
     on the bridge. On the last spread the pages riffle, paper birds fly out of the book and circle, and the story says it is to
     be continued */
  gwStage('storybook', function () {
    var S = 4.4, C = S * 5, Bd = [], Cf = [], i, Fw = [], lastFw = -1, oB = {};
    var CAP = ['Once upon a time, a ship set sail…', '…past mountains white with snow…', '…through a forest in the dark…', '…to a city full of lights.', 'To be continued…'];
    for (i = 0; i < 9; i++) { Bd.push({ t0: 0.9 + i * 0.12, a: fxR(0, FX_TAU), r: fxR(40, 120), sp: fxR(0.8, 1.4) * (i % 2 ? 1 : -1), h: fxR(30, 80), col: ['#FDE68A', '#FBCFE8', '#BAE6FD', '#BBF7D0', '#FFFFFF'][i % 5] }); }
    function back(c, col) { return function (c) { c.beginPath(); c.moveTo(-126, 148); c.lineTo(-126, 44); c.quadraticCurveTo(-126, 30, -112, 30); c.lineTo(112, 30); c.quadraticCurveTo(126, 30, 126, 44); c.lineTo(126, 148); c.closePath(); }; }
    function waves(y, a, k, ph) { return function (c) { c.beginPath(); c.moveTo(-124, y + 20); for (var x = -124; x <= 124; x += 4) { c.lineTo(x, y - a * Math.abs(Math.sin(x * k + ph))); } c.lineTo(124, y + 20); c.closePath(); }; }
    function peaks(y, P) { return function (c) { c.beginPath(); c.moveTo(-124, y); P.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(124, y); c.closePath(); }; }
    function pines(y, xs, h) { return function (c) { c.beginPath(); xs.forEach(function (x, m) { var hh = h * (0.8 + 0.4 * fxRnd(m + x)); c.moveTo(x - hh * 0.3, y); c.lineTo(x, y - hh); c.lineTo(x + hh * 0.3, y); c.closePath(); }); c.rect(-124, y - 2, 248, 4); }; }
    function sky(c, u, t, ph) { var k = Math.max(0, Math.min(1, (u - ph) / 0.64)); return k; }
    /* one spread's scene at fold-up u; t for its motion */
    function scene(c, id, u, t) {
      var a = sky(c, u, t, 0), b = sky(c, u, t, 0.12), d = sky(c, u, t, 0.24), e = sky(c, u, t, 0.36), j;
      if (id === 0) {
        cpCut(c, 148, a, back(c), '#9ED8F0', 5);
        if (a > 0.95) { c.fillStyle = '#FDE68A'; c.beginPath(); c.arc(70, 62, 13, 0, FX_TAU); c.fill(); c.strokeStyle = '#475569'; c.lineWidth = 1.2; c.beginPath(); for (j = 0; j < 3; j++) { var gx = -70 + j * 30 + Math.sin(t * 0.6 + j) * 10, gy = 56 + j * 8, w = 5 + Math.sin(t * 5 + j) * 1.5; c.moveTo(gx - 6, gy - w * 0.4); c.quadraticCurveTo(gx - 3, gy - 3, gx, gy); c.quadraticCurveTo(gx + 3, gy - 3, gx + 6, gy - w * 0.4); } c.stroke(); }
        cpCut(c, 154, b, waves(122, 7, 0.06, t * 1.6), '#3B82C4', 4);
        if (d > 0.05) { var bob = Math.sin(t * 1.8) * 3, tilt = Math.sin(t * 1.8 + 1) * 0.06; cpCut(c, 158, d, function (c) { c.save(); c.translate(-6, 118 + bob); c.rotate(tilt); c.beginPath(); c.moveTo(-34, 0); c.lineTo(34, 0); c.lineTo(26, 12); c.lineTo(-28, 12); c.closePath(); c.rect(-1, -58, 2, 58); c.rect(-21, -44, 2, 44); c.moveTo(1, -54); c.quadraticCurveTo(22, -34, 1, -6); c.closePath(); c.moveTo(-19, -40); c.quadraticCurveTo(-2, -24, -19, -6); c.closePath(); c.moveTo(1, -58); c.lineTo(16, -54); c.lineTo(1, -50); c.restore(); }, '#7C4A2A', 4);
          if (d > 0.95) { c.save(); c.translate(-6, 118 + bob); c.rotate(tilt); c.fillStyle = '#FFF8E7'; c.beginPath(); c.moveTo(2, -54); c.quadraticCurveTo(22, -34, 2, -6); c.closePath(); c.moveTo(-18, -40); c.quadraticCurveTo(-2, -24, -18, -6); c.closePath(); c.fill(); c.fillStyle = '#DC2626'; c.beginPath(); c.moveTo(1, -58); c.lineTo(16 + Math.sin(t * 6) * 2, -55); c.lineTo(1, -51); c.fill(); c.fillStyle = '#FBBF24'; c.fillRect(-26, 3, 52, 2.4); c.restore(); } }
        cpCut(c, 164, e, waves(134, 9, 0.05, -t * 1.9 + 1), '#1F5FA0', 4);
        cpCut(c, 170, e, waves(146, 6, 0.08, t * 2.2 + 2), '#16497D', 3);
      } else if (id === 1) {
        cpCut(c, 148, a, back(c), '#D6E6F5', 5);
        if (a > 0.95) { [[-60, 52], [40, 44]].forEach(function (q, m) { var x = q[0] + Math.sin(t * 0.4 + m * 2) * 16; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(x, q[1], 18, 6, 0, 0, FX_TAU); c.arc(x - 6, q[1] - 4, 7, 0, FX_TAU); c.fill(); }); }
        cpCut(c, 152, b, peaks(150, [[-96, 92], [-60, 118], [-24, 70], [20, 112], [70, 80], [110, 120]]), '#8DA4C8', 4);
        if (b > 0.95) { c.fillStyle = '#FFFFFF'; cpPoly(c, [[-31, 82], [-24, 70], [-16, 82], [-20, 80], [-24, 84], [-28, 80]]); c.fill(); cpPoly(c, [[63, 91], [70, 80], [77, 90], [73, 88], [70, 92], [66, 88]]); c.fill(); }
        cpCut(c, 158, d, peaks(156, [[-110, 130], [-70, 96], [-40, 118], [6, 56], [50, 104], [90, 86], [120, 126]]), '#5B7399', 4);
        if (d > 0.95) { c.fillStyle = '#FFFFFF'; cpPoly(c, [[-4, 72], [6, 56], [16, 72], [11, 68], [6, 75], [1, 68]]); c.fill(); c.strokeStyle = '#334155'; c.lineWidth = 1; c.beginPath(); c.moveTo(6, 56); c.lineTo(6, 44); c.stroke(); c.fillStyle = '#EF4444'; c.beginPath(); c.moveTo(6, 44); c.lineTo(15 + Math.sin(t * 5) * 1.5, 47); c.lineTo(6, 50); c.fill();
          var cu = Math.min(1, ((t * 0.12) % 1.25)), path = [[-40, 140], [-14, 120], [-28, 104], [-4, 88], [2, 62]], seg = cu * 4, si = Math.min(3, Math.floor(seg)), sf = seg - si, px = path[si][0] + (path[si + 1][0] - path[si][0]) * sf, py = path[si][1] + (path[si + 1][1] - path[si][1]) * sf;
          c.setLineDash([2, 3]); c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); path.forEach(function (p, m) { if (m) { c.lineTo(p[0], p[1]); } else { c.moveTo(p[0], p[1]); } }); c.stroke(); c.setLineDash([]); c.fillStyle = '#F97316'; c.beginPath(); c.arc(px, py - 3, 2.2, 0, FX_TAU); c.fill(); if (cu >= 1) { c.globalCompositeOperation = 'lighter'; fxStar4(c, 8, 42, 7, 0.9, '#FFFFFF'); c.globalCompositeOperation = 'source-over'; } }
        cpCut(c, 164, e, pines(164, [-118, -100, -84, -62, 58, 76, 96, 116], 30), '#2F5D50', 3);
        cpCut(c, 170, e, peaks(170, [[-124, 160], [-90, 150], [-60, 162], [40, 160], [80, 148], [124, 158]]), '#4B5563', 3);
      } else if (id === 2) {
        cpCut(c, 148, a, back(c), '#23305A', 5);
        if (a > 0.95) { c.fillStyle = '#FEF3C7'; c.beginPath(); c.arc(-70, 58, 12, 0, FX_TAU); c.fill(); c.fillStyle = '#23305A'; c.beginPath(); c.arc(-64, 54, 11, 0, FX_TAU); c.fill(); c.globalCompositeOperation = 'lighter'; for (j = 0; j < 14; j++) { fxGlow(c, '255,255,255', -110 + fxRnd(j) * 220, 38 + fxRnd(j + 30) * 50, 1.6, 0.4 + 0.4 * Math.sin(t * 2 + j)); } c.globalCompositeOperation = 'source-over'; }
        cpCut(c, 152, b, pines(152, [-116, -96, -70, -40, -10, 22, 50, 84, 112], 52), '#2C4A52', 4);
        cpCut(c, 158, d, function (c) { c.beginPath(); c.rect(24, 124, 40, 34); c.moveTo(18, 126); c.lineTo(44, 104); c.lineTo(70, 126); c.closePath(); c.rect(52, 106, 6, 12); }, '#8B5E3C', 4);
        if (d > 0.95) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', 36, 138, 22, 0.6 + 0.1 * Math.sin(t * 7)); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#FCD34D'; c.fillRect(30, 132, 12, 11); c.strokeStyle = '#5B3A1E'; c.lineWidth = 1; c.strokeRect(30, 132, 12, 11); c.beginPath(); c.moveTo(36, 132); c.lineTo(36, 143); c.stroke(); c.fillStyle = '#3F2A1A'; c.fillRect(48, 140, 9, 18);
          for (j = 0; j < 3; j++) { var sy = 100 - j * 10 - (t * 6) % 10, sx = 55 + Math.sin(t + j) * 3; c.fillStyle = 'rgba(203,213,225,' + (0.5 - j * 0.12).toFixed(2) + ')'; c.beginPath(); c.arc(sx, sy, 3 + j, 0, FX_TAU); c.fill(); } }
        cpCut(c, 164, e, pines(164, [-122, -104, -86, 94, 112], 40), '#1D3B3A', 3);
        if (e > 0.95) { var dxp = ((t * 9) % 300) - 150; c.fillStyle = '#5C3A22'; c.save(); c.translate(dxp, 162); c.beginPath(); c.ellipse(0, -10, 8, 4.4, 0, 0, FX_TAU); c.fill(); c.fillRect(-6, -8, 1.6, 8); c.fillRect(5, -8, 1.6, 8); c.beginPath(); c.moveTo(6, -12); c.lineTo(10, -20); c.lineTo(13, -18); c.lineTo(9, -11); c.fill(); c.strokeStyle = '#5C3A22'; c.lineWidth = 1; c.beginPath(); c.moveTo(11, -20); c.lineTo(9, -26); c.moveTo(12, -20); c.lineTo(15, -25); c.stroke(); c.restore();
          c.globalCompositeOperation = 'lighter'; for (j = 0; j < 8; j++) { var fxp = -100 + fxRnd(j + 5) * 200 + Math.sin(t * 0.7 + j) * 10, fyp = 120 + fxRnd(j + 9) * 36 + Math.sin(t * 1.1 + j * 2) * 6; fxGlow(c, '217,249,157', fxp, fyp, 3.2, 0.5 + 0.5 * Math.sin(t * 3 + j)); } c.globalCompositeOperation = 'source-over'; }
        cpCut(c, 170, e, function (c) { c.beginPath(); for (var x = -124; x <= 124; x += 9) { c.moveTo(x, 170); c.quadraticCurveTo(x - 6, 158, x - 2, 150 + (x % 3)); c.quadraticCurveTo(x + 2, 160, x + 4, 170); } }, '#122A28', 3);
      } else if (id === 3) {
        cpCut(c, 148, a, back(c), '#1B1F4B', 5);
        if (a > 0.95) {
          var fi = Math.floor(t / 0.9); if (fi !== lastFw) { lastFw = fi; if (fi % 2 === 0) { var fx0 = fxR(-90, 90), fy0 = fxR(40, 70), hu = fxR(0, 360); for (j = 0; j < 18; j++) { var fa = j / 18 * FX_TAU, fv = fxR(18, 34); Fw.push({ x: fx0, y: fy0, vx: Math.cos(fa) * fv, vy: Math.sin(fa) * fv, l: 0, m: fxR(0.7, 1.1), h: hu }); } } }
          c.globalCompositeOperation = 'lighter'; lkStep(Fw, 1 / 60, 18, 0.3, function (p, f) { fxStar4(c, p.x, p.y, 3 * f, f, 'hsl(' + p.h + ',95%,72%)'); }); c.globalCompositeOperation = 'source-over';
        }
        cpCut(c, 152, b, function (c) { c.beginPath(); var x = -124; for (var m = 0; x < 124; m++) { var w = 14 + fxRnd(m * 3) * 14, h = 34 + fxRnd(m * 5) * 40; c.rect(x, 152 - h, w, h); x += w + 2; } }, '#3B3F7A', 4);
        cpCut(c, 158, d, function (c) { c.beginPath(); var x = -120; for (var m = 0; x < 120; m++) { var w = 16 + fxRnd(m * 7 + 2) * 16, h = 20 + fxRnd(m * 11) * 34; c.rect(x, 158 - h, w, h); x += w + 4; } c.rect(-8, 70, 16, 88); c.moveTo(-10, 70); c.lineTo(0, 54); c.lineTo(10, 70); c.closePath(); }, '#2A2D5C', 4);
        if (d > 0.95) { for (j = 0; j < 40; j++) { var wx = -116 + fxRnd(j * 3) * 232, wy = 112 + fxRnd(j * 5) * 40, on = fxRnd(j + Math.floor(t / 1.7 + fxRnd(j) * 3)) > 0.35; if (on) { c.fillStyle = j % 5 ? '#FDE68A' : '#BAE6FD'; c.fillRect(wx, wy, 2.4, 3); } } c.fillStyle = '#FEF3C7'; c.beginPath(); c.arc(0, 84, 5, 0, FX_TAU); c.fill(); c.strokeStyle = '#1B1F4B'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(0, 84); c.lineTo(Math.cos(t * 0.5) * 3.6, 84 + Math.sin(t * 0.5) * 3.6); c.moveTo(0, 84); c.lineTo(0, 81); c.stroke(); }
        cpCut(c, 164, e, function (c) { c.beginPath(); c.rect(-124, 140, 248, 4); for (var x = -112; x <= 112; x += 28) { c.rect(x - 2, 144, 4, 20); c.moveTo(x - 14, 144); c.quadraticCurveTo(x, 132, x + 14, 144); } }, '#4B4F8A', 3);
        if (e > 0.95) { var tx = ((t * 40) % 340) - 170; for (j = 0; j < 4; j++) { var cx2 = tx - j * 17; if (cx2 < -124 || cx2 > 110) { continue; } c.fillStyle = j ? '#64748B' : '#DC2626'; c.fillRect(cx2, 131, 15, 9); c.fillStyle = '#FDE68A'; c.fillRect(cx2 + 2, 133, 4, 3); c.fillRect(cx2 + 9, 133, 4, 3); } }
        cpCut(c, 170, e, waves(166, 3, 0.1, t), '#1E3A6E', 3);
      } else {
        cpCut(c, 148, a, back(c), '#FBF4E2', 5);
        if (a > 0.95) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,230,138', 0, 88, 80, 0.2 + 0.1 * Math.sin(t * 2)); c.globalCompositeOperation = 'source-over'; cpWrite(c, 'Chapter Two', 0, 80, 22, '#7C2D12', 0.9, 'italic 700 22px ' + CP_SERIF); c.strokeStyle = 'rgba(180,140,90,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-70, 98); c.quadraticCurveTo(0, 92, 70, 98); c.moveTo(-40, 104); c.quadraticCurveTo(0, 100, 40, 104); c.stroke(); cpWrite(c, '~ coming soon ~', 0, 116, 9, '#92400E', 0.7, 'italic 9px ' + CP_SERIF); }
      }
    }
    return function (c, t, dt) {
      var T = t + (FX_REDUCE ? 5.8 : 0), cyc = T % C, id = Math.floor(cyc / S), w = cyc - id * S, prev = (id + 4) % 5, j;
      var fold = T < S ? fxEase((w - 0.1) / 0.8) : fxEase((w - 0.45) / 0.55), down = T < S ? 0 : 1 - fxEase(w / 0.4);
      /* the lamp's warmth, the table, the book's cover and pages, the ribbon */
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,186,116', -120, 10, 220, 0.18); c.globalCompositeOperation = 'source-over';
      var tg = c.createLinearGradient(0, 160, 0, 190); tg.addColorStop(0, '#3A2414'); tg.addColorStop(1, '#1C110A'); c.fillStyle = tg; c.fillRect(-170, 160, 340, 30);
      c.fillStyle = '#5B2418'; cpPoly(c, [[-156, 152], [156, 152], [164, 184], [-164, 184]]); c.fill();
      c.fillStyle = '#E8DCC0'; cpPoly(c, [[-150, 150], [-2, 146], [-2, 178], [-154, 181]]); c.fill(); cpPoly(c, [[150, 150], [2, 146], [2, 178], [154, 181]]); c.fill();
      c.fillStyle = '#FBF4E2'; cpPoly(c, [[-148, 148], [-2, 144], [-2, 175], [-151, 178]]); c.fill(); cpPoly(c, [[148, 148], [2, 144], [2, 175], [151, 178]]); c.fill();
      var gg = c.createLinearGradient(-14, 0, 14, 0); gg.addColorStop(0, 'rgba(120,80,40,0)'); gg.addColorStop(0.5, 'rgba(120,80,40,.35)'); gg.addColorStop(1, 'rgba(120,80,40,0)'); c.fillStyle = gg; c.fillRect(-14, 144, 28, 34);
      c.strokeStyle = '#B91C1C'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 176); c.quadraticCurveTo(3 + Math.sin(t * 1.3) * 2, 184, 1 + Math.sin(t * 1.3) * 4, 192); c.stroke();
      /* the scene going down and the one coming up */
      if (down > 0.01) { scene(c, prev, down, t); }
      scene(c, id, fold, t);
      /* the turning page */
      if (T >= S && w < 0.9) { var f = w / 0.9, ang = f * Math.PI, ox = Math.cos(ang) * 148, lift = Math.sin(ang) * 26, sh = 0.75 + 0.25 * Math.abs(Math.cos(ang)); c.fillStyle = 'rgba(30,15,5,.18)'; cpPoly(c, [[0, 175], [0, 144], [ox * 0.9, 150 - lift * 0.5], [ox * 0.92, 182]]); c.fill(); c.fillStyle = cpMix('#FBF4E2', '#BFAE8E', 1 - sh); cpPoly(c, [[0, 175], [0, 144], [ox, 146 - lift], [ox * 1.02, 178 - lift]]); c.fill(); c.strokeStyle = 'rgba(150,120,80,.5)'; c.lineWidth = 0.8; c.stroke(); }
      /* on the last spread the pages riffle and the paper birds fly out */
      if (id === 4) {
        for (j = 0; j < 4; j++) { var rf = (w - 0.9 - j * 0.16) / 0.3; if (rf > 0 && rf < 1) { var an2 = rf * Math.PI, ox2 = Math.cos(an2) * 146, l2 = Math.sin(an2) * 20; c.fillStyle = cpMix('#FBF4E2', '#D6C8A8', 0.3 + 0.3 * Math.abs(Math.cos(an2))); cpPoly(c, [[0, 175], [0, 144], [ox2, 146 - l2], [ox2, 178 - l2]]); c.fill(); } }
        Bd.forEach(function (b) { var u = w - b.t0 - 0.8; if (u <= 0) { return; } var r = Math.min(1, u / 1.2), x = Math.cos(b.a + u * b.sp) * b.r * r, y = 140 - b.h * r - u * 6 + Math.sin(u * 2 + b.a) * 8, fl = Math.sin(t * 10 + b.a) * 0.9, al = Math.min(1, u * 3) * (1 - Math.max(0, (w - 3.9) / 0.5)); if (al <= 0) { return; } c.globalAlpha = al; c.fillStyle = b.col; cpPoly(c, [[x - 11, y - fl * 8], [x, y], [x + 3, y + 3]]); c.fill(); cpPoly(c, [[x + 11, y - fl * 8], [x, y], [x - 3, y + 3]]); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; cpPoly(c, [[x, y], [x + 11, y - fl * 8], [x + 3, y + 3]]); c.fill(); cpPoly(c, [[x + 4, y + 2], [x + 9, y + 1], [x + 3, y + 4]]); c.fill(); c.globalAlpha = 1; });
        lkEvery(oB, w > 1.2 && w < 3.4 ? 26 : 0, dt, function () { Cf.push({ x: fxR(-10, 10), y: 146, vx: fxR(-60, 60), vy: fxR(-110, -60), l: 0, m: fxR(0.9, 1.6), r: fxR(0, 6), h: fxR(0, 360) }); });
      }
      lkStep(Cf, dt, 90, 0.5, function (p, f) { c.save(); c.translate(p.x, p.y); c.rotate(p.r + p.l * 6); c.globalAlpha = f; c.fillStyle = 'hsl(' + p.h + ',80%,72%)'; c.fillRect(-2.4, -1.4, 4.8, 2.8 * Math.abs(Math.sin(p.l * 9 + p.r))); c.restore(); });
      /* the line of the story on its strip of paper */
      var ca = fxEnv(w, T < S ? 0.6 : 0.9, T < S ? 0.9 : 1.2, S - 0.35, S), txt = CAP[id], nch = Math.max(0, Math.min(txt.length, Math.floor((w - 0.9) * 26)));
      if (ca > 0) { c.globalAlpha = ca; c.fillStyle = 'rgba(20,10,0,.3)'; c.fillRect(-118, 9, 240, 17); c.fillStyle = '#FFFBEB'; c.fillRect(-120, 6, 240, 17); c.strokeStyle = '#B45309'; c.lineWidth = 0.8; c.strokeRect(-117, 8, 234, 13); c.globalAlpha = 1; cpWrite(c, txt.slice(0, nch), 0, 15, 10, '#4A2A0C', ca, 'italic 600 10px ' + CP_SERIF); }
      if (T < 0.4) { c.globalAlpha = 1 - T / 0.4; c.fillStyle = '#0A0915'; c.fillRect(-170, 0, 340, 190); c.globalAlpha = 1; }
    };
  });

  /* Ship in a bottle (Radiant): a glass bottle on a wooden stand, lit by a lamp. Inside it a tall ship sails a whole small sea:
     an easy afternoon, then cloud gathers and a storm breaks inside the glass, rain and lightning, the ship tossing; it clears,
     a rainbow stands over the water, and night comes with stars and the ship's lantern lit. A tiny bottle with a message bobs
     on the waves inside, the glass catches the light, and a tag on the neck wishes you well */
  gwStage('shipbottle', function () {
    var C = 20, St = [], Du = [], Ra = [], i, oR = {}, Bo = null;
    for (i = 0; i < 26; i++) { St.push({ x: fxR(-120, 60), y: fxR(60, 110), p: fxR(0, 6) }); }
    for (i = 0; i < 20; i++) { Du.push({ x: fxR(-160, 160), y: fxR(0, 150), p: fxR(0, 6), z: fxR(0.5, 1.3) }); }
    function body(c) { c.beginPath(); c.moveTo(-100, 56); c.lineTo(60, 56); c.bezierCurveTo(84, 56, 90, 85, 104, 85); c.lineTo(136, 85); c.lineTo(136, 115); c.lineTo(104, 115); c.bezierCurveTo(90, 115, 84, 144, 60, 144); c.lineTo(-100, 144); c.quadraticCurveTo(-128, 144, -128, 116); c.lineTo(-128, 84); c.quadraticCurveTo(-128, 56, -100, 56); c.closePath(); }
    function wave(x, base, A, t, k, ph) { return base - A * (0.6 * Math.sin(x * k + t * 1.4 + ph) + 0.4 * Math.sin(x * k * 2.3 - t * 1.1 + ph * 2)); }
    return function (c, t, dt) {
      var T = t + (FX_REDUCE ? 11.4 : 0), cyc = T % C, n = Math.floor(T / C), j;
      var st = fxEnv(cyc, 4, 7, 10.5, 12.5), rb = fxEnv(cyc, 11.8, 13.2, 15.6, 17.2), nt = Math.max(fxEnv(cyc, 15.6, 17.2, 19.2, 20.4), fxEnv(cyc, -1, -0.5, -0.2, 0.6)), calm = 1 - st;
      var fl = 0; [7.6, 8.7, 9.2, 10.1].forEach(function (tk) { if (cyc > tk) { fl = Math.max(fl, Math.exp(-(cyc - tk) * 8)); } });
      var A = 3 + 7 * st;
      /* the lamp, the desk, the bottle's shadow and the light it gathers on the desk */
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,186,116', -160, -10, 230, 0.2); c.globalCompositeOperation = 'source-over';
      var dg = c.createLinearGradient(0, 150, 0, 190); dg.addColorStop(0, '#4A2E17'); dg.addColorStop(1, '#1C110A'); c.fillStyle = dg; c.fillRect(-170, 150, 340, 40);
      c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(10, 160, 140, 8, 0, 0, FX_TAU); c.fill();
      c.globalCompositeOperation = 'lighter'; var cg = c.createRadialGradient(40, 162, 0, 40, 162, 70); cg.addColorStop(0, 'rgba(180,240,230,' + (0.35 * calm * (1 - nt)).toFixed(3) + ')'); cg.addColorStop(1, 'rgba(180,240,230,0)'); c.fillStyle = cg; c.beginPath(); c.ellipse(40, 162, 70, 6, 0, 0, FX_TAU); c.fill();
      Du.forEach(function (d) { fxGlow(c, '253,224,170', d.x + Math.sin(t * 0.3 + d.p) * 10, d.y + Math.sin(t * 0.2 + d.p) * 6, 1.4 * d.z, 0.35 * (0.5 + 0.5 * Math.sin(t * 1.4 + d.p))); }); c.globalCompositeOperation = 'source-over';
      /* the stand */
      c.fillStyle = '#5B3416'; [-84, 20].forEach(function (x) { c.beginPath(); c.moveTo(x - 20, 152); c.lineTo(x + 20, 152); c.lineTo(x + 16, 138); c.quadraticCurveTo(x, 150, x - 16, 138); c.closePath(); c.fill(); });
      /* inside the glass: sky, sun or moon, clouds, rain, lightning, the sea, the ship, the little bottle, the rainbow */
      c.save(); body(c); c.clip();
      var top = cpMix(cpMix('#8ECDEB', '#3B4656', st), '#081230', nt), bot = cpMix(cpMix('#FCE3AE', '#6B7480', st), '#22386A', nt), sg = c.createLinearGradient(0, 56, 0, 144); sg.addColorStop(0, top); sg.addColorStop(1, bot); c.fillStyle = sg; c.fillRect(-130, 50, 270, 100);
      c.globalCompositeOperation = 'lighter';
      if (nt > 0.02) { St.forEach(function (q) { fxGlow(c, '255,255,255', q.x, q.y - 30, 1.3, nt * (0.4 + 0.5 * Math.sin(t * 2 + q.p))); }); c.fillStyle = 'rgba(254,249,195,' + (0.9 * nt).toFixed(3) + ')'; c.beginPath(); c.arc(30, 74, 7, 0, FX_TAU); c.fill(); fxGlow(c, '254,249,195', 30, 74, 22, 0.4 * nt); }
      var sunA = calm * (1 - nt); if (sunA > 0.02) { fxGlow(c, '255,214,140', -60, 76, 46, 0.5 * sunA); c.fillStyle = 'rgba(255,240,200,' + (0.9 * sunA).toFixed(3) + ')'; c.beginPath(); c.arc(-60, 76, 9, 0, FX_TAU); c.fill(); }
      if (rb > 0.01) { for (j = 0; j < 7; j++) { c.strokeStyle = 'rgba(' + GW_BOW[j] + ',' + (0.42 * rb).toFixed(3) + ')'; c.lineWidth = 2.2; c.beginPath(); c.arc(0, 150, 78 - j * 2.4, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); } }
      c.globalCompositeOperation = 'source-over';
      for (j = 0; j < 4; j++) { var cx = ((j * 70 + t * (4 + 10 * st)) % 300) - 140, cy = 64 + (j % 2) * 9 + st * 4, cw = 50 + 30 * st, ca = 0.35 + 0.55 * st; c.globalAlpha = ca * (1 - 0.6 * nt) + 0.1; c.fillStyle = cpMix('#FFFFFF', '#2F3743', st * 0.9); gwCloud(c, cx, cy + 10, cw, 16 + 10 * st, j + 3, t); c.fill(); }
      c.globalAlpha = 1;
      if (st > 0.3) { lkEvery(oR, 70 * st, dt, function () { Ra.push({ x: fxR(-130, 110), y: 60, vx: -30, vy: 220, l: 0, m: 0.45 }); }); }
      c.strokeStyle = 'rgba(200,215,235,.5)'; c.lineWidth = 1; lkStep(Ra, dt, 0, 0, function (p) { c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - 3, p.y + 8); c.stroke(); });
      if (fl > 0.05) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(220,230,255,' + (0.5 * fl).toFixed(3) + ')'; c.fillRect(-130, 50, 270, 100); if (!Bo || Bo.k !== Math.floor(cyc * 10)) { var bx = fxR(-90, 60); Bo = { k: Math.floor(cyc * 10), p: fxJag(bx, 58, bx + fxR(-20, 20), 120, 14, 5) }; } fxBolt(c, Bo.p, fl, '200,220,255'); c.globalCompositeOperation = 'source-over'; }
      var seaCols = [['#3A8DB8', '#2C4F6A', '#14284A'], ['#25729C', '#22405A', '#0F2140'], ['#1A5A80', '#18324A', '#0A1832']];
      var sx = -20 + Math.sin(t * 0.3) * 18, sy = wave(sx, 118, A, t, 0.05, 1) - 3, sl = (wave(sx + 6, 118, A, t, 0.05, 1) - wave(sx - 6, 118, A, t, 0.05, 1)) / 12;
      [[112, 0.04, 0], [118, 0.05, 1], [128, 0.06, 2]].forEach(function (L, m) {
        c.fillStyle = cpMix(cpMix(seaCols[m][0], seaCols[m][1], st), seaCols[m][2], nt); c.beginPath(); c.moveTo(-130, 150); for (var x = -130; x <= 140; x += 5) { c.lineTo(x, wave(x, L[0], A * (0.7 + m * 0.2), t, L[1], L[2])); } c.lineTo(140, 150); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(255,255,255,' + (0.18 + 0.3 * st).toFixed(3) + ')'; c.lineWidth = 1; c.stroke();
        if (m === 1) {
          /* the ship rides the middle swell */
          c.save(); c.translate(sx, sy); c.rotate(Math.atan(sl) + Math.sin(t * 3) * 0.05 * st);
          c.fillStyle = '#4A2511'; c.beginPath(); c.moveTo(-22, -2); c.lineTo(24, -2); c.lineTo(18, 7); c.lineTo(-18, 7); c.closePath(); c.fill(); c.fillStyle = '#C2410C'; c.fillRect(-20, 0, 41, 1.6);
          c.strokeStyle = '#3B1F0E'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-8, -2); c.lineTo(-8, -36); c.moveTo(6, -2); c.lineTo(6, -44); c.moveTo(17, -2); c.lineTo(17, -26); c.moveTo(24, -2); c.lineTo(34, -12); c.stroke();
          var bl = 1 + 0.3 * st; c.fillStyle = cpMix('#FFF8E7', '#C9C2B2', nt * 0.6); [[-8, -34, 9], [6, -42, 11], [17, -24, 7]].forEach(function (q) { c.beginPath(); c.moveTo(q[0] - q[2] * 0.6, q[1]); c.quadraticCurveTo(q[0] + q[2] * bl, q[1] + 8, q[0] - q[2] * 0.6, q[1] + 16); c.closePath(); c.moveTo(q[0] - q[2] * 0.6, q[1] + 18); c.quadraticCurveTo(q[0] + q[2] * bl, q[1] + 25, q[0] - q[2] * 0.6, q[1] + 31); c.closePath(); c.fill(); });
          c.fillStyle = '#DC2626'; [[-8, -36], [6, -44], [17, -26]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] - 7 - Math.sin(t * 7 + q[0]) * 1.5, q[1] + 1.5); c.lineTo(q[0], q[1] + 3); c.fill(); });
          if (nt > 0.05 || st > 0.5) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', -21, -6, 9, 0.9 * Math.max(nt, st * 0.7)); c.globalCompositeOperation = 'source-over'; }
          c.restore();
          /* the message in a bottle, bobbing */
          var mx = 52 + Math.sin(t * 0.5) * 12, my = wave(mx, 118, A * 0.9, t, 0.05, 1); c.save(); c.translate(mx, my - 1); c.rotate(-0.3 + Math.sin(t * 2) * 0.2); c.fillStyle = 'rgba(167,243,208,.8)'; c.beginPath(); fxRR(c, -6, -2.4, 9, 4.8, 2); c.fill(); c.fillRect(3, -1.2, 3, 2.4); c.fillStyle = '#C69C6D'; c.fillRect(6, -1.2, 1.6, 2.4); c.fillStyle = '#FEF3C7'; c.fillRect(-4, -1, 5, 2); c.restore();
        }
      });
      c.restore();
      /* the glass: its edge, the long highlights, the neck and the cork, and a tag that swings on its string */
      c.strokeStyle = 'rgba(190,230,240,.55)'; c.lineWidth = 3; body(c); c.stroke(); c.fillStyle = 'rgba(120,200,190,.06)'; c.fill();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,255,255,' + (0.45 + 0.4 * fl).toFixed(3) + ')'; c.lineWidth = 3.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-104, 63); c.quadraticCurveTo(-30, 59, 52, 62); c.stroke(); c.lineWidth = 1.4; c.beginPath(); c.moveTo(-120, 92); c.lineTo(-120, 112); c.moveTo(70, 66); c.quadraticCurveTo(84, 70, 92, 84); c.moveTo(108, 89); c.lineTo(132, 89); c.stroke();
      fxStar4(c, -96 + Math.sin(t * 0.7) * 3, 64, 5 + 2 * Math.sin(t * 2.3), 0.8, '#FFFFFF'); c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#C69C6D'; c.beginPath(); fxRR(c, 135, 84, 17, 32, 3); c.fill(); c.fillStyle = 'rgba(90,60,30,.5)'; for (j = 0; j < 6; j++) { c.beginPath(); c.arc(139 + fxRnd(j) * 10, 88 + fxRnd(j + 7) * 24, 0.9, 0, FX_TAU); c.fill(); }
      var tw = Math.sin(t * 1.4) * 0.18; c.strokeStyle = '#A3836A'; c.lineWidth = 1; c.beginPath(); c.moveTo(118, 115); c.quadraticCurveTo(120, 124, 122 + tw * 10, 130); c.stroke();
      c.save(); c.translate(122 + tw * 10, 130); c.rotate(tw); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-15, 2, 34, 15); c.fillStyle = '#FEF3C7'; cpPoly(c, [[-17, 4], [-12, 0], [17, 0], [17, 15], [-12, 15], [-17, 11]]); c.fill(); c.fillStyle = '#A3836A'; c.beginPath(); c.arc(-12, 7.5, 1.4, 0, FX_TAU); c.fill(); c.restore();
      cpWrite(c, ['FAIR WINDS', 'STEADY ON', 'LAND HO!', 'BON VOYAGE'][n % 4], 124 + tw * 10, 138 + tw * 3, 6, '#7C2D12', 1, '700 6px ' + FX_MONO);
      if (rb > 0.3) { c.globalCompositeOperation = 'lighter'; for (j = 0; j < 4; j++) { fxStar4(c, -100 + fxRnd(j + n) * 180, 66 + fxRnd(j * 3 + n) * 40, 5 * rb * Math.abs(Math.sin(t * 3 + j)), rb, '#FFFFFF'); } c.globalCompositeOperation = 'source-over'; }
    };
  });

  /* ---------- right-answer effects: drawn on a layer over the page, never over the answer itself (k is its box) ---------- */
  var CP_YES = ['CORRECT', 'NAILED IT', 'SOLVED', 'WELL READ', 'SPOT ON', 'BULLSEYE', 'DECODED', 'CRACKED IT', 'YES!'];
  function cpPick(a) { return a[Math.floor(Math.random() * a.length)]; }
  /* Decoder (Cipher, Common): a split-flap board drops in above your answer and its tiles clatter through letters, while
     scrambled letters stream up out of the answer into it; one by one, left to right, the tiles stop on a message (a different
     one each time), and the board lights */
  FX_DUR.decoder = 1.9;
  FX_DRAW.decoder = function (s, k) {
    var m = cpPick(CP_YES), N = 10, AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#?', G = [], i, pad = Math.floor((N - m.length) / 2), msg = (new Array(pad + 1).join(' ') + m + '          ').slice(0, N);
    for (i = 0; i < 30; i++) { G.push({ x: k.x + 10 + Math.random() * (k.w - 20), d: fxR(0, 0.55), ch: AB.charAt(Math.floor(Math.random() * 36)), j: i % N }); }
    return function (t) {
      var c = s.ctx, tw = Math.min(20, (k.w - 16) / N), th = tw * 1.45, x0 = k.cx - tw * N / 2, y0 = Math.max(6, k.y - th - 16), a = fxEnv(t, 0, 0.14, 1.5, 1.9), drop = 1 - fxEase(t / 0.25), j, done = t - (0.35 + (N - 1) * 0.07);
      y0 -= drop * 16;
      c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); fxRR(c, x0 - 4, y0 - 2, tw * N + 12, th + 12, 7); c.fill();
      c.fillStyle = '#0F172A'; c.beginPath(); fxRR(c, x0 - 7, y0 - 6, tw * N + 14, th + 12, 7); c.fill(); c.strokeStyle = done > 0 ? '#FDE68A' : '#334155'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = '#475569'; [x0 - 3, x0 + tw * N + 3].forEach(function (x) { c.beginPath(); c.arc(x, y0 + th / 2, 1.6, 0, FX_TAU); c.fill(); });
      for (j = 0; j < N; j++) {
        var stop = 0.35 + j * 0.07, fin = t >= stop, tk = t * 24 + j * 2.3, ch = fin ? msg.charAt(j) : AB.charAt((Math.floor(tk) * 7 + j * 13) % AB.length), ph = fin ? Math.min(1, (t - stop) * 10) : tk % 1, x = x0 + j * tw;
        c.fillStyle = '#1E293B'; c.beginPath(); fxRR(c, x + 1, y0, tw - 2, th, 2.5); c.fill();
        c.fillStyle = fin ? '#FDE68A' : '#E2E8F0'; c.font = '700 ' + Math.round(th * 0.6) + 'px ' + FX_MONO; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, x + tw / 2, y0 + th / 2 + 1);
        if (ph < 1) { var fh = (th / 2) * (1 - ph); c.fillStyle = '#334155'; c.fillRect(x + 1, y0 + th / 2 - fh, tw - 2, fh); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x + 1, y0 + th / 2 - fh, tw - 2, 1); }
        c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(x + 1, y0 + th / 2 - 0.6, tw - 2, 1.2);
      }
      c.globalAlpha = 1;
      /* the scrambled letters rising out of the answer into the board */
      gwLit(c); c.font = '700 10px ' + FX_MONO; c.textAlign = 'center'; c.textBaseline = 'middle';
      G.forEach(function (g) { var u = (t - g.d) / 0.42; if (u <= 0 || u >= 1) { return; } var tx = x0 + g.j * tw + tw / 2, x = g.x + (tx - g.x) * fxEase(u), y = k.y + (y0 + th - k.y) * u; c.globalAlpha = Math.sin(u * Math.PI) * 0.9 * a; c.fillStyle = FX_INK.dark ? '#86EFAC' : '#15803D'; c.fillText(g.ch, x, y); });
      c.globalAlpha = 1;
      if (done > 0) { c.globalCompositeOperation = 'lighter'; if (done < 0.5) { fxGlow(c, '253,224,71', k.cx, y0 + th / 2, tw * N * 0.6, 0.35 * (1 - done / 0.5) * a); } c.globalCompositeOperation = 'source-over'; }
      lkFinish(c, k, a * Math.min(1, Math.max(0, done) / 0.2), done / 0.6, '74,222,128');
    };
  };

  /* Pop-out (Pop-Up, Rare): paper folds up off the page around your answer: a flower at each end opens its petals, paper stars
     bounce up on springs, a ribbon banner unfolds above with a cheer on it (a different one each time), and folded paper
     confetti bursts out; then it all folds flat again */
  FX_DUR.popout = 2.5;
  FX_DRAW.popout = function (s, k) {
    var m = cpPick(['WELL DONE!', 'NICE ONE!', 'YOU GOT IT!', 'BRILLIANT!', 'SPOT ON!', 'TOP MARKS!']), Cf = [], i, PC = ['#F472B6', '#FACC15', '#60A5FA', '#34D399', '#FB923C', '#A78BFA'];
    for (i = 0; i < 48; i++) { Cf.push({ x: k.cx + fxR(-k.w * 0.25, k.w * 0.25), y: k.y - 26, vx: fxR(-190, 190), vy: fxR(-300, -110), l: -fxR(0.35, 0.55), m: fxR(1.1, 1.7), r: fxR(0, 6), c: PC[i % 6] }); }
    return function (t, dt) {
      var c = s.ctx, up = fxEase(t / 0.4) * (1 - fxEase((t - 2.0) / 0.35)), bl = fxEase((t - 0.35) / 0.5) * (1 - fxEase((t - 1.95) / 0.3)), ban = fxEase((t - 0.25) / 0.45) * (1 - fxEase((t - 1.9) / 0.3)), base = k.y - 1, bw = Math.min(k.w * 0.82, 250), by = Math.max(18, k.y - 44), j;
      lkOut(c, s, k, 2);
      /* stars on springs, behind the banner */
      [[-0.32, 30], [0, 44], [0.32, 30]].forEach(function (q, n) { var sx = k.cx + q[0] * bw, h = q[1] * up + Math.sin(t * 9 + n * 2) * 5 * up, sy = by - 8 - h; if (up < 0.05) { return; } c.strokeStyle = 'rgba(100,90,80,.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx, by); for (j = 1; j <= 10; j++) { c.lineTo(sx + (j % 2 ? 3 : -3), by - h * j / 10); } c.stroke(); c.save(); c.translate(sx, sy); c.rotate(Math.sin(t * 5 + n) * 0.2); c.fillStyle = 'rgba(20,10,0,.2)'; c.beginPath(); for (j = 0; j < 10; j++) { var ra = j / 10 * FX_TAU - Math.PI / 2, rr = j % 2 ? 4.4 : 10; c.lineTo(Math.cos(ra) * rr + 2.4, Math.sin(ra) * rr + 2); } c.fill(); c.fillStyle = ['#FACC15', '#F472B6', '#60A5FA'][n]; c.beginPath(); for (j = 0; j < 10; j++) { var ra2 = j / 10 * FX_TAU - Math.PI / 2, rr2 = j % 2 ? 4.4 : 10; c.lineTo(Math.cos(ra2) * rr2, Math.sin(ra2) * rr2); } c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -10); c.lineTo(-4, -2); c.closePath(); c.fill(); c.restore(); });
      /* the banner unfolds sideways from the middle, its tails folded under */
      if (ban > 0.02) { var w2 = bw * ban; c.fillStyle = 'rgba(20,10,0,.22)'; c.fillRect(k.cx - w2 / 2 + 4, by - 12, w2, 26); c.fillStyle = '#B91C1C'; cpPoly(c, [[k.cx - w2 / 2 + 6, by - 6], [k.cx - w2 / 2 - 16, by - 6], [k.cx - w2 / 2 - 8, by + 4], [k.cx - w2 / 2 - 16, by + 14], [k.cx - w2 / 2 + 6, by + 14]]); c.fill(); cpPoly(c, [[k.cx + w2 / 2 - 6, by - 6], [k.cx + w2 / 2 + 16, by - 6], [k.cx + w2 / 2 + 8, by + 4], [k.cx + w2 / 2 + 16, by + 14], [k.cx + w2 / 2 - 6, by + 14]]); c.fill();
        c.fillStyle = '#EF4444'; c.fillRect(k.cx - w2 / 2, by - 14, w2, 24); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(k.cx - w2 / 2, by - 14, w2, 4); c.strokeStyle = '#FDE68A'; c.lineWidth = 1; c.setLineDash([3, 2]); c.strokeRect(k.cx - w2 / 2 + 3, by - 11, w2 - 6, 18); c.setLineDash([]);
        cpWrite(c, m, k.cx, by - 2, 13, '#FFFBEB', fxEase((ban - 0.5) / 0.5), '800 13px ' + CP_SERIF); }
      /* a paper flower at each end of the answer */
      [k.x + 16, k.x + k.w - 16].forEach(function (fx, n) {
        cpCut(c, base, up, function (c) { c.beginPath(); c.rect(fx - 1.6, base - 46, 3.2, 46); c.moveTo(fx, base - 16); c.ellipse(fx + (n ? 8 : -8), base - 18, 9, 3.6, n ? 0.5 : -0.5, 0, FX_TAU); c.moveTo(fx, base - 30); c.ellipse(fx + (n ? -8 : 8), base - 32, 8, 3.2, n ? -0.5 : 0.5, 0, FX_TAU); }, '#3F8F45', 3);
        if (up > 0.95) { var hy = base - 48 + Math.sin(t * 6 + n) * 1.5, r = 4 + 8 * bl; c.fillStyle = 'rgba(20,10,0,.18)'; c.beginPath(); c.arc(fx + 3, hy + 2, r + 3, 0, FX_TAU); c.fill(); c.fillStyle = n ? '#F472B6' : '#FACC15'; c.beginPath(); for (j = 0; j < 6; j++) { var pa = j / 6 * FX_TAU + t * 0.6; c.moveTo(fx, hy); c.ellipse(fx + Math.cos(pa) * r * 0.75, hy + Math.sin(pa) * r * 0.75, r * 0.62, r * 0.36, pa, 0, FX_TAU); } c.fill(); c.fillStyle = n ? '#FDE68A' : '#FB923C'; c.beginPath(); c.arc(fx, hy, 2 + bl * 2, 0, FX_TAU); c.fill(); }
      });
      /* folded paper confetti, each piece two-toned where it is creased */
      lkStep(Cf, dt, 380, 0.55, function (p, f) { if (p.l < 0) { return; } c.save(); c.translate(p.x, p.y); c.rotate(p.r + p.l * 7); var sq = Math.cos(p.l * 11 + p.r); c.scale(1, sq); c.globalAlpha = Math.min(1, f * 2); c.fillStyle = p.c; c.fillRect(-4, -3, 4, 6); c.fillStyle = cpMix(p.c, '#1A1208', 0.3); c.fillRect(0, -3, 4, 6); c.restore(); });
      c.globalAlpha = 1; lkIn(c);
      lkFinish(c, k, Math.min(1, Math.max(0, t - 0.5) / 0.3) * (1 - fxEase((t - 2.1) / 0.4)), (t - 0.5) / 0.8, '250,204,21');
    };
  };

  /* Invisible ink (Cipher, Epic): the page goes dark, and a black-light torch sweeps its violet beam across your answer. Where
     the beam passes, hidden notes glow round it in invisible ink: an arrow and THIS ONE, a check, stars, a wavy underline,
     brackets, a smile, a note that you knew it (a different set each time). They glow on after the beam has gone, then the torch
     opens wide and lights them all at once */
  FX_DUR.uvink = 3.5;
  FX_DRAW.uvink = function (s, k) {
    var ALL = ['arrow', 'check', 'stars', 'under', 'brackets', 'smile', 'note', 'key'], pick = ['arrow', 'check'], Du = [], i;
    ALL.slice(2).sort(function () { return Math.random() - 0.5; }).slice(0, 3).forEach(function (x) { pick.push(x); });
    for (i = 0; i < 40; i++) { Du.push({ u: Math.random(), v: Math.random(), p: fxR(0, 6) }); }
    var NOTE = cpPick(['you knew it', 'nailed it', 'keep going', 'smart move']);
    function where(id) { return id === 'arrow' ? k.x + 40 : id === 'check' ? k.x + k.w - 50 : id === 'stars' ? k.cx : id === 'under' ? k.cx : id === 'brackets' ? k.cx : id === 'smile' ? k.x + k.w - 24 : id === 'note' ? k.cx : k.x + 24; }
    function ink(c, id) {
      c.beginPath();
      if (id === 'arrow') { c.moveTo(k.x + 78, k.y - 50); c.quadraticCurveTo(k.x + 40, k.y - 44, k.x + 30, k.y - 8); c.moveTo(k.x + 22, k.y - 18); c.lineTo(k.x + 30, k.y - 7); c.lineTo(k.x + 39, k.y - 16); }
      else if (id === 'check') { c.moveTo(k.x + k.w - 74, k.y - 30); c.lineTo(k.x + k.w - 60, k.y - 14); c.lineTo(k.x + k.w - 30, k.y - 54); }
      else if (id === 'stars') { [-30, 0, 30].forEach(function (dx, n) { var cx = k.cx + dx, cy = k.y - (n === 1 ? 44 : 32); for (var q = 0; q <= 10; q++) { var ra = q / 10 * FX_TAU - Math.PI / 2, rr = q % 2 ? 3.6 : 8; if (q) { c.lineTo(cx + Math.cos(ra) * rr, cy + Math.sin(ra) * rr); } else { c.moveTo(cx + Math.cos(ra) * rr, cy + Math.sin(ra) * rr); } } }); }
      else if (id === 'under') { for (var x = k.x + 16; x <= k.x + k.w - 16; x += 4) { var y = k.y + k.h + 9 + Math.sin((x - k.x) * 0.25) * 3; if (x === k.x + 16) { c.moveTo(x, y); } else { c.lineTo(x, y); } } }
      else if (id === 'brackets') { c.moveTo(k.x - 4, k.y - 6); c.quadraticCurveTo(k.x - 12, k.y - 6, k.x - 12, k.cy); c.quadraticCurveTo(k.x - 12, k.y + k.h + 6, k.x - 4, k.y + k.h + 6); c.moveTo(k.x + k.w + 4, k.y - 6); c.quadraticCurveTo(k.x + k.w + 12, k.y - 6, k.x + k.w + 12, k.cy); c.quadraticCurveTo(k.x + k.w + 12, k.y + k.h + 6, k.x + k.w + 4, k.y + k.h + 6); }
      else if (id === 'smile') { var sx = k.x + k.w - 24, sy = k.y + k.h + 30; c.arc(sx, sy, 11, 0, FX_TAU); c.moveTo(sx - 5, sy + 2); c.quadraticCurveTo(sx, sy + 8, sx + 5, sy + 2); c.moveTo(sx - 4, sy - 3); c.lineTo(sx - 4, sy - 1); c.moveTo(sx + 4, sy - 3); c.lineTo(sx + 4, sy - 1); }
      else if (id === 'key') { var kx = k.x + 24, ky = k.y + k.h + 28; c.arc(kx, ky, 6, 0, FX_TAU); c.moveTo(kx + 6, ky); c.lineTo(kx + 26, ky); c.moveTo(kx + 20, ky); c.lineTo(kx + 20, ky + 5); c.moveTo(kx + 25, ky); c.lineTo(kx + 25, ky + 6); }
    }
    function words(c, id, al) {
      if (id === 'arrow') { cpWrite(c, 'THIS ONE!', k.x + 96, k.y - 56, 12, '#E9D5FF', al, 'italic 700 13px ' + CP_SERIF); }
      else if (id === 'note') { cpWrite(c, NOTE, k.cx, k.y + k.h + 30, 13, '#E9D5FF', al, 'italic 700 14px ' + CP_SERIF); }
    }
    return function (t, dt) {
      var c = s.ctx, a = fxEnv(t, 0, 0.3, 3.0, 3.5), sw = fxEase((t - 0.35) / 1.9), wide = fxEnv(t, 2.35, 2.5, 2.8, 3.3), lx = Math.max(16, k.x - 10), ly = Math.min(s.h - 20, k.y + k.h + 150);
      var bx = k.x - 40 + sw * (k.w + 80), by = k.cy - 10, R = 64 + 40 * wide;
      fxDim(c, s, k, 0.72 * a, '#0A0618');
      lkOut(c, s, k, 2);
      c.globalCompositeOperation = 'lighter';
      /* the beam: a cone from the torch to the spot, and dust in it */
      var ang = Math.atan2(by - ly, bx - lx), dist = Math.hypot(bx - lx, by - ly), cg = c.createLinearGradient(lx, ly, bx, by); cg.addColorStop(0, 'rgba(167,139,250,' + (0.22 * a).toFixed(3) + ')'); cg.addColorStop(1, 'rgba(167,139,250,' + (0.08 * a).toFixed(3) + ')');
      c.fillStyle = cg; c.beginPath(); c.moveTo(lx + Math.cos(ang + 1.57) * 6, ly + Math.sin(ang + 1.57) * 6); c.lineTo(bx + Math.cos(ang + 1.57) * R, by + Math.sin(ang + 1.57) * R); c.lineTo(bx + Math.cos(ang - 1.57) * R, by + Math.sin(ang - 1.57) * R); c.lineTo(lx + Math.cos(ang - 1.57) * 6, ly + Math.sin(ang - 1.57) * 6); c.closePath(); c.fill();
      fxGlow(c, '139,92,246', bx, by, R * 1.1, 0.28 * a);
      Du.forEach(function (d) { var f = d.u, x = lx + (bx - lx) * f + Math.cos(ang + 1.57) * (d.v - 0.5) * 2 * R * f, y = ly + (by - ly) * f + Math.sin(ang + 1.57) * (d.v - 0.5) * 2 * R * f; fxGlow(c, '221,214,254', x + Math.sin(t + d.p) * 3, y + Math.cos(t * 0.8 + d.p) * 3, 1.4, 0.5 * a * (0.5 + 0.5 * Math.sin(t * 3 + d.p))); });
      /* the notes: bright inside the spot, glowing on where it has been */
      c.lineCap = 'round'; c.lineJoin = 'round';
      pick.forEach(function (id) {
        var x = where(id), passed = bx - x, after = passed > 0 ? Math.max(0.18, Math.exp(-passed / (k.w * 0.9))) * 0.55 : 0, al = Math.max(after, wide * 0.95) * a;
        if (al > 0.01) { c.globalAlpha = al; c.strokeStyle = 'rgba(167,139,250,.45)'; c.lineWidth = 6; ink(c, id); c.stroke(); c.strokeStyle = '#E9D5FF'; c.lineWidth = 2; ink(c, id); c.stroke(); c.globalAlpha = 1; words(c, id, al); }
      });
      c.save(); c.beginPath(); c.ellipse(bx, by, R, R * 0.9, 0, 0, FX_TAU); c.clip();
      pick.forEach(function (id) { c.globalAlpha = a; c.strokeStyle = 'rgba(196,181,253,.6)'; c.lineWidth = 7; ink(c, id); c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 2.2; ink(c, id); c.stroke(); c.globalAlpha = 1; words(c, id, a); });
      c.restore();
      /* the torch */
      c.globalCompositeOperation = 'source-over'; c.save(); c.translate(lx, ly); c.rotate(ang); c.globalAlpha = a; c.fillStyle = '#1F2937'; c.beginPath(); fxRR(c, -46, -7, 40, 14, 4); c.fill(); c.fillStyle = '#374151'; c.beginPath(); c.moveTo(-8, -9); c.lineTo(4, -11); c.lineTo(4, 11); c.lineTo(-8, 9); c.closePath(); c.fill(); c.fillStyle = '#6B7280'; c.fillRect(-30, -8, 3, 16); c.globalCompositeOperation = 'lighter'; fxGlow(c, '167,139,250', 4, 0, 16, 0.9); c.fillStyle = '#DDD6FE'; c.fillRect(2, -9, 3, 18); c.restore(); c.globalAlpha = 1;
      lkIn(c);
      lkFinish(c, k, a * fxEase((t - 2.3) / 0.3), (t - 2.3) / 0.8, '167,139,250');
    };
  };

  /* Pull the tab (Pop-Up, Legendary): a paper tab marked PULL slides out from under your answer and pulls itself. Two paper
     doors above the answer swing open, and behind them a pop-up scene folds up in layers. What is behind changes: fireworks
     over the hills, balloons climbing past the clouds, or a whale rising out of the waves to spout. A banner pops up, then the
     doors close and the tab slides home */
  FX_DUR.pulltab = 4.7;
  FX_DRAW.pulltab = function (s, k) {
    var V = Math.floor(Math.random() * 3), Fw = [], Dr = [], i, lastF = -1, o = {};
    function hill(y0, amp, f, ph) { return function (c) { c.beginPath(); c.moveTo(0, 170); for (var x = 0; x <= 300; x += 10) { c.lineTo(x, y0 - amp * (0.5 + 0.5 * Math.sin(x * f + ph))); } c.lineTo(300, 170); c.closePath(); }; }
    function wv(y0, amp, ph, t) { return function (c) { c.beginPath(); c.moveTo(0, 170); for (var x = 0; x <= 300; x += 5) { c.lineTo(x, y0 - amp * Math.abs(Math.sin(x * 0.05 + ph + t))); } c.lineTo(300, 170); c.closePath(); }; }
    function scene(c, t, u) {
      var a = Math.max(0, Math.min(1, u / 0.7)), b = Math.max(0, Math.min(1, (u - 0.15) / 0.7)), d = Math.max(0, Math.min(1, (u - 0.3) / 0.7)), j;
      c.fillStyle = ['#1E2A5A', '#9FD3F0', '#0E5A7A'][V]; c.fillRect(0, 0, 300, 170);
      if (V === 0) {
        c.globalCompositeOperation = 'lighter'; for (j = 0; j < 20; j++) { fxGlow(c, '255,255,255', fxRnd(j) * 300, fxRnd(j + 9) * 90, 1.4, 0.5 + 0.4 * Math.sin(t * 3 + j)); } c.globalCompositeOperation = 'source-over';
        var fi = Math.floor(t / 0.35); if (fi !== lastF && u > 0.6) { lastF = fi; var fx0 = fxR(40, 260), fy0 = fxR(20, 70), hu = fxR(0, 360), nn = 10; for (j = 0; j < nn; j++) { Fw.push({ x: fx0, y: fy0, a: j / nn * FX_TAU, r: 0, l: 0, m: 0.9, h: hu }); } }
        Fw.forEach(function (p) { p.l += 1 / 60; p.r = 30 * fxEase(p.l / 0.5); }); for (j = Fw.length - 1; j >= 0; j--) { if (Fw[j].l > Fw[j].m) { Fw.splice(j, 1); } }
        Fw.forEach(function (p) { var f = 1 - p.l / p.m, x = p.x + Math.cos(p.a) * p.r, y = p.y + Math.sin(p.a) * p.r + p.l * p.l * 20; c.save(); c.translate(x, y); c.rotate(p.a); c.globalAlpha = Math.min(1, f * 2); c.fillStyle = 'hsl(' + p.h + ',90%,65%)'; cpPoly(c, [[-7, -2.4], [5, 0], [-7, 2.4]]); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; cpPoly(c, [[-7, 0], [5, 0], [-7, 2.4]]); c.fill(); c.restore(); c.globalAlpha = 1; });
        cpCut(c, 170, a, hill(118, 28, 0.025, 1), '#3B4A8A', 4); cpCut(c, 170, b, hill(140, 22, 0.04, 3), '#2A3466', 4); cpCut(c, 170, d, function (c) { c.beginPath(); c.rect(40, 120, 30, 50); c.moveTo(34, 122); c.lineTo(55, 102); c.lineTo(76, 122); c.closePath(); c.rect(200, 128, 50, 42); c.moveTo(196, 130); c.lineTo(225, 110); c.lineTo(254, 130); c.closePath(); }, '#1A2148', 4);
        if (d > 0.95) { c.fillStyle = '#FDE68A'; [[48, 132], [58, 132], [210, 138], [232, 138], [221, 150]].forEach(function (q) { c.fillRect(q[0], q[1], 5, 6); }); }
      } else if (V === 1) {
        [[50, 30, 0], [190, 52, 2]].forEach(function (q) { var x = q[0] + Math.sin(t * 0.5 + q[2]) * 14; c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(x, q[1], 26, 9, 0, 0, FX_TAU); c.arc(x - 9, q[1] - 6, 10, 0, FX_TAU); c.arc(x + 9, q[1] - 7, 12, 0, FX_TAU); c.fill(); });
        [[70, '#EF4444', '#FDE68A', 0], [150, '#3B82F6', '#FFFFFF', 1.3], [230, '#22C55E', '#FACC15', 2.6]].forEach(function (q, n) { var rise = Math.max(0, Math.min(1, (u - 0.2 - n * 0.1) / 0.7)), y = 150 - rise * (70 + n * 12) + Math.sin(t * 1.6 + q[3]) * 4; if (rise <= 0) { return; } c.strokeStyle = 'rgba(80,70,60,.5)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(q[0], 170); c.lineTo(q[0], y + 26); c.stroke(); c.fillStyle = 'rgba(20,10,0,.2)'; c.beginPath(); c.arc(q[0] + 3, y + 2, 17, 0, FX_TAU); c.fill(); c.fillStyle = q[1]; c.beginPath(); c.arc(q[0], y, 17, Math.PI * 0.9, Math.PI * 2.1); c.lineTo(q[0] + 5, y + 18); c.lineTo(q[0] - 5, y + 18); c.closePath(); c.fill(); c.fillStyle = q[2]; c.beginPath(); c.moveTo(q[0] - 3, y - 17); c.quadraticCurveTo(q[0] - 9, y, q[0] - 4, y + 17); c.lineTo(q[0] + 4, y + 17); c.quadraticCurveTo(q[0] + 9, y, q[0] + 3, y - 17); c.closePath(); c.fill(); c.fillStyle = '#8B5E3C'; c.fillRect(q[0] - 4, y + 21, 8, 6); c.strokeStyle = '#8B5E3C'; c.beginPath(); c.moveTo(q[0] - 5, y + 18); c.lineTo(q[0] - 4, y + 21); c.moveTo(q[0] + 5, y + 18); c.lineTo(q[0] + 4, y + 21); c.stroke(); });
        cpCut(c, 170, a, hill(132, 24, 0.03, 0.5), '#86C46A', 4); cpCut(c, 170, d, hill(152, 16, 0.05, 2), '#5FA05A', 3);
      } else {
        cpCut(c, 170, a, wv(110, 8, 0, t * 1.5), '#2D86B0', 4);
        var wu = Math.max(0, Math.min(1, (u - 0.35) / 0.5)), wy = 150 - wu * 50 + Math.sin(t * 2) * 3;
        if (wu > 0) { c.fillStyle = 'rgba(0,20,40,.25)'; c.beginPath(); c.ellipse(158, wy + 4, 56, 22, -0.1, 0, FX_TAU); c.fill(); c.fillStyle = '#3E5C8A'; c.beginPath(); c.ellipse(150, wy, 56, 22, -0.1, 0, FX_TAU); c.moveTo(200, wy - 6); c.quadraticCurveTo(222, wy - 22, 236, wy - 30); c.lineTo(228, wy - 10); c.quadraticCurveTo(222, wy - 2, 204, wy + 6); c.fill(); c.fillStyle = '#DCE7F5'; c.beginPath(); c.ellipse(140, wy + 9, 44, 10, -0.1, 0, Math.PI); c.fill(); c.fillStyle = '#0F172A'; c.beginPath(); c.arc(112, wy - 2, 2.4, 0, FX_TAU); c.fill();
          if (wu > 0.9) { lkEvery(o, 40, 1 / 60, function () { Dr.push({ x: 128, y: wy - 20, vx: fxR(-40, 40), vy: fxR(-150, -90), l: 0, m: fxR(0.6, 1.0) }); }); } }
        lkStep(Dr, 1 / 60, 240, 0.8, function (p, f) { c.globalAlpha = f; c.fillStyle = '#BAE6FD'; c.beginPath(); c.ellipse(p.x, p.y, 2.2, 3.2, 0, 0, FX_TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(p.x - 0.6, p.y - 1, 0.8, 0, FX_TAU); c.fill(); c.globalAlpha = 1; });
        cpCut(c, 170, b, wv(140, 10, 2, -t * 1.8), '#1C6A93', 4); cpCut(c, 170, d, wv(158, 7, 4, t * 2.2), '#11506F', 3);
      }
    }
    return function (t, dt) {
      var c = s.ctx, a = fxEnv(t, 0, 0.2, 4.2, 4.7), tab = fxEase((t - 0.1) / 0.45) * (1 - fxEase((t - 3.9) / 0.4)), pull = fxEase((t - 0.6) / 0.45) * (1 - fxEase((t - 3.5) / 0.4)), op = fxEase((t - 0.85) / 0.55) * (1 - fxEase((t - 3.2) / 0.5)), lay = fxEase((t - 1.1) / 0.9) * (1 - fxEase((t - 3.0) / 0.45));
      var Wd = Math.min(k.w, 330), Hh = Math.max(60, Math.min(180, k.y - 14)), x0 = k.cx - Wd / 2, y1 = k.y - 10, y0 = y1 - Hh, fa = fxEnv(t, 0.15, 0.45, 3.9, 4.3);
      fxDim(c, s, k, 0.32 * a, '#120A06');
      lkOut(c, s, k, 2);
      if (op > 0.01) { c.save(); c.beginPath(); c.rect(x0, y0, Wd, Hh); c.clip(); c.translate(x0, y0); c.scale(Wd / 300, Hh / 170); scene(c, t, lay); c.restore();
        var bp = fxEnv(t, 1.9, 2.2, 3.0, 3.25); if (bp > 0) { var bw = Math.min(Wd * 0.7, 200) * bp, byy = y0 + 18; c.fillStyle = 'rgba(20,10,0,.25)'; c.fillRect(k.cx - bw / 2 + 3, byy - 8, bw, 20); c.fillStyle = '#FFF7E6'; c.fillRect(k.cx - bw / 2, byy - 11, bw, 20); c.strokeStyle = '#C2410C'; c.lineWidth = 1.2; c.strokeRect(k.cx - bw / 2 + 2, byy - 9, bw - 4, 16); cpWrite(c, ['BRAVO!', 'UP AND AWAY!', 'WHALE DONE!'][V], k.cx, byy - 1, 12, '#9A3412', fxEase((bp - 0.5) / 0.5), '800 12px ' + CP_SERIF); } }
      /* the doors: paper flaps hinged at the sides, darker as they turn away */
      if (fa > 0.01) { [0, 1].forEach(function (n) { var w = (Wd / 2) * Math.max(0.0, 1 - op * 0.98), hx = n ? x0 + Wd : x0, x = n ? hx - w : hx; c.globalAlpha = fa; c.fillStyle = 'rgba(20,10,0,.25)'; c.fillRect(x + 3, y0 + 3, w, Hh); c.fillStyle = cpMix('#FBF4E2', '#A8977A', op * 0.7); c.fillRect(x, y0, w, Hh); c.strokeStyle = 'rgba(150,120,80,.6)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y0 + 0.5, w - 1, Hh - 1); if (w > 20) { c.setLineDash([4, 3]); c.beginPath(); c.moveTo(x + w / 2, y0 + 8); c.lineTo(x + w / 2, y0 + Hh - 8); c.stroke(); c.setLineDash([]); cpWrite(c, '?', x + w / 2, y0 + Hh / 2, 22, 'rgba(180,140,90,.8)', fa * (1 - op), '700 26px ' + CP_SERIF); } c.globalAlpha = 1; }); }
      /* the tab, pulled out from under the answer's right edge */
      if (tab > 0.01) { var tx = k.x + k.w - 74, ty = k.y + k.h - 22 + tab * 22 + pull * 26; c.globalAlpha = a; c.fillStyle = 'rgba(20,10,0,.25)'; c.beginPath(); fxRR(c, tx + 2, ty + 2, 50, 22, 4); c.fill(); c.fillStyle = '#F97316'; c.beginPath(); fxRR(c, tx, ty, 50, 22, 4); c.fill(); c.globalAlpha = 1; cpWrite(c, 'PULL', tx + 20, ty + 12, 8, '#FFF7ED', a, '800 9px ' + FX_MONO); c.fillStyle = '#FFF7ED'; cpPoly(c, [[tx + 37, ty + 8], [tx + 45, ty + 8], [tx + 41, ty + 15]]); c.fill(); }
      lkIn(c);
      lkFinish(c, k, a * fxEase((t - 3.4) / 0.3), (t - 3.4) / 0.8, '251,146,60');
    };
  };

  /* Enigma (Cipher, Mythic): a cipher machine builds itself round your answer: a wooden case of three brass rotors above it, a
     board of letter lamps below. Scrambled letters fly up out of the answer into the rotors, the right rotor clicks round with
     each one (carrying the middle one now and then), a lamp lights for the letter it comes out as, and a paper tape prints the
     message. Then all three rotors spin and stop on Y, E and S, the lamps flash in a wave, and light runs down to your answer */
  FX_DUR.enigma = 5.4;
  FX_DRAW.enigma = function (s, k) {
    var MSG = cpPick(['CORRECT', 'WELLDONE', 'BRAVO', 'GENIUS', 'NAILEDIT', 'SOLVED', 'BRILLIANT']), L = MSG.length, AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ROWS = ['QWERTZUIO', 'ASDFGHJK', 'PYXCVBNML'], CT = [], i, Sp = [];
    for (i = 0; i < L; i++) { var cc; do { cc = AB.charAt(Math.floor(Math.random() * 26)); } while (cc === MSG.charAt(i)); CT.push({ ch: cc, x: k.x + 16 + Math.random() * (k.w - 32) }); }
    var R0 = [Math.floor(Math.random() * 26), Math.floor(Math.random() * 26), Math.floor(Math.random() * 26)], G = null;
    function lampAt(ch, x0, y0, sp) { for (var r = 0; r < 3; r++) { var q = ROWS[r].indexOf(ch); if (q >= 0) { return [x0 + (q - (ROWS[r].length - 1) / 2) * sp, y0 + r * sp * 0.9]; } } return [x0, y0]; }
    return function (t, dt) {
      var c = s.ctx, a = fxEnv(t, 0, 0.35, 4.8, 5.4), rise = fxEase((t - 0.1) / 0.6), step = 2.4 / L, j, q;
      var Wm = Math.min(k.w, 300), Hm = 66, cy0 = Math.max(10, k.y - Hm - 22) + (1 - rise) * 20, sp = Math.min(26, (k.w - 8) / 9), ly0 = Math.min(s.h - sp * 2.6 - 34, k.y + k.h + 24), done = t - (0.9 + L * step), yes = fxEase((t - 3.55) / 0.5);
      fxDim(c, s, k, 0.78 * a, '#05060E');
      lkOut(c, s, k, 2);
      if (!G) { G = c.createLinearGradient(0, -22, 0, 22); G.addColorStop(0, '#2A1C08'); G.addColorStop(0.25, '#A07A32'); G.addColorStop(0.42, '#F6E2A0'); G.addColorStop(0.58, '#C99A3E'); G.addColorStop(1, '#1E1405'); }
      /* the case and its three rotors */
      c.globalAlpha = a * rise; c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); fxRR(c, k.cx - Wm / 2 + 4, cy0 + 4, Wm, Hm, 8); c.fill();
      var wg = c.createLinearGradient(0, cy0, 0, cy0 + Hm); wg.addColorStop(0, '#5B3A1E'); wg.addColorStop(1, '#2E1C0E'); c.fillStyle = wg; c.beginPath(); fxRR(c, k.cx - Wm / 2, cy0, Wm, Hm, 8); c.fill(); c.strokeStyle = '#8A5A2B'; c.lineWidth = 1.4; c.stroke();
      c.fillStyle = '#1A1008'; c.beginPath(); fxRR(c, k.cx - 80, cy0 + 9, 160, Hm - 18, 5); c.fill();
      for (q = 0; q < 3; q++) {
        var rx = k.cx + (q - 1) * 50, ry = cy0 + Hm / 2, n3 = Math.max(0, Math.min(L, (t - 0.9) / step)), base = R0[q] + (q === 2 ? n3 : q === 1 ? Math.floor((R0[2] + n3) / 5) - Math.floor(R0[2] / 5) : 0);
        var tgt = AB.indexOf('YES'.charAt(q)), p = base; if (t > 3.55) { var from = base, dist = ((tgt - from) % 26 + 26) % 26 + 26 * (q + 1); p = from + dist * yes; }
        c.save(); c.translate(rx, ry); c.fillStyle = G; c.fillRect(-15, -22, 30, 44); c.beginPath(); c.rect(-15, -22, 30, 44); c.clip(); c.textAlign = 'center'; c.textBaseline = 'middle';
        for (j = Math.floor(p) - 2; j <= Math.floor(p) + 3; j++) { var th = (j - p) * FX_TAU / 10, co = Math.cos(th); if (co <= 0.08) { continue; } c.save(); c.translate(0, 21 * Math.sin(th)); c.scale(1, co); c.font = '800 13px ' + FX_MONO; c.fillStyle = 'rgba(42,22,5,' + (0.15 + 0.85 * Math.pow(co, 3)).toFixed(3) + ')'; c.fillText(AB.charAt(((j % 26) + 26) % 26), 0, 1); c.restore(); }
        c.restore();
        c.fillStyle = '#C99A3E'; for (j = 0; j < 9; j++) { c.fillRect(rx - 19, ry - 20 + j * 5, 3, 2.4); c.fillRect(rx + 16, ry - 20 + j * 5, 3, 2.4); }
        c.strokeStyle = 'rgba(253,224,71,' + (0.4 + 0.5 * yes).toFixed(3) + ')'; c.lineWidth = 1; c.strokeRect(rx - 15.5, ry - 8.5, 31, 17);
      }
      c.globalAlpha = 1;
      /* the lamp board, and the tape */
      var lit = {}, glow = {};
      for (i = 0; i < L; i++) { var ti = 0.9 + i * step, on = (t - ti - step * 0.45) / (step * 0.9); if (on > 0 && on < 1) { lit[MSG.charAt(i)] = Math.sin(on * Math.PI); } }
      ROWS.forEach(function (row, r) { for (var m = 0; m < row.length; m++) { var ch = row.charAt(m), x = k.cx + (m - (row.length - 1) / 2) * sp, y = ly0 + r * sp * 0.9, wave = done > 0.25 ? Math.max(0, 1 - Math.abs((done - 0.25) * 9 - (x - k.x) / k.w * 6 - r * 0.6)) : 0, l = Math.max(lit[ch] || 0, wave); c.globalAlpha = a * rise; c.fillStyle = '#111827'; c.beginPath(); c.arc(x, y, sp * 0.42, 0, FX_TAU); c.fill(); c.strokeStyle = '#4B5563'; c.lineWidth = 1; c.stroke(); if (l > 0.02) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', x, y, sp * 0.9, 0.8 * l * a); c.globalCompositeOperation = 'source-over'; } c.fillStyle = l > 0.3 ? '#1C1305' : '#9CA3AF'; if (l > 0.3) { c.fillStyle = '#FEF3C7'; c.beginPath(); c.arc(x, y, sp * 0.38, 0, FX_TAU); c.fill(); c.fillStyle = '#78350F'; } c.font = '700 ' + Math.round(sp * 0.42) + 'px ' + FX_MONO; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, x, y + 0.5); c.globalAlpha = 1; } });
      var nt = Math.max(0, Math.min(L, Math.floor((t - 0.9 - step * 0.55) / step) + 1)), ty = ly0 + sp * 2.6 + 8, tw = Math.max(40, nt * 12 + 16);
      if (nt > 0) { c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(k.cx - tw / 2 + 2, ty - 7, tw, 16); c.fillStyle = '#F5ECD7'; c.fillRect(k.cx - tw / 2, ty - 9, tw, 16); c.globalAlpha = 1; cpWrite(c, MSG.slice(0, nt).split('').join(' '), k.cx, ty - 1, 10, '#1F2937', a, '700 10px ' + FX_MONO); }
      /* the scrambled letters rising out of the answer into the right rotor */
      c.globalCompositeOperation = 'lighter';
      CT.forEach(function (g, m) { var u = (t - 0.9 - m * step) / (step * 0.6); if (u <= 0 || u >= 1) { return; } var x = g.x + (k.cx + 50 - g.x) * fxEase(u), y = k.y + (cy0 + Hm / 2 - k.y) * u; fxGlow(c, '125,211,252', x, y, 10, 0.5 * Math.sin(u * Math.PI)); cpWrite(c, g.ch, x, y, 12, '#E0F2FE', Math.sin(u * Math.PI) * a); var lp = lampAt(MSG.charAt(m), k.cx, ly0, sp); if (u > 0.7) { fxGlow(c, '253,224,71', lp[0], lp[1], 14, (u - 0.7) * 2); } });
      /* the YES, the wave of lamps, and light down to the answer */
      if (yes > 0.9) { fxGlow(c, '253,224,71', k.cx, cy0 + Hm / 2, 110, 0.3 * a * (0.6 + 0.4 * Math.sin(t * 8))); }
      if (done > 0.3) { var lu = Math.min(1, (done - 0.3) / 0.5); [[k.cx - 50, cy0 + Hm], [k.cx + 50, cy0 + Hm]].forEach(function (p0) { var x = p0[0], y = p0[1] + (k.y - p0[1]) * lu; c.strokeStyle = 'rgba(253,224,71,' + (0.6 * a).toFixed(3) + ')'; c.lineWidth = 2; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(x, y); c.stroke(); fxGlow(c, '255,247,214', x, y, 8, a); }); if (lu >= 1 && Sp.length < 40) { for (j = 0; j < 3; j++) { Sp.push({ x: k.x + Math.random() * k.w, y: k.y, vx: fxR(-30, 30), vy: fxR(-90, -30), l: 0, m: fxR(0.5, 0.9) }); } } }
      lkStep(Sp, dt, 60, 0.6, function (p2, f) { fxStar4(c, p2.x, p2.y, 4 * f, f * a, '#FDE68A'); });
      c.globalCompositeOperation = 'source-over'; lkIn(c);
      lkFinish(c, k, a * fxEase((done - 0.7) / 0.3), (done - 0.7) / 0.9, '250,204,21');
    };
  };

  /* Hidden world (Radiant): the page goes dark. Sparks gather into a key of light, a keyhole glows above your answer, the key goes
     in and turns, and the keyhole opens wide on a whole world in cut paper folding up round you: hills, a river, a windmill,
     a cottage and trees under a sky that is the sky you have now (sunrise, day, sunset or night, by your own clock). Paper birds
     fly out past you, then the keyhole closes and the key settles on your answer */
  FX_DUR.hidden = 5.8;
  function cpKeyhole(c, x, y, r) { c.beginPath(); c.arc(x, y - r * 0.32, r * 0.5, 0, FX_TAU); c.moveTo(x - r * 0.22, y - r * 0.1); c.lineTo(x + r * 0.22, y - r * 0.1); c.lineTo(x + r * 0.42, y + r * 0.9); c.lineTo(x - r * 0.42, y + r * 0.9); c.closePath(); }
  function cpKey(c, x, y, z, turn) { c.save(); c.translate(x, y); c.scale(z, z); c.beginPath(); c.save(); c.scale(Math.max(0.15, Math.abs(Math.cos(turn))), 1); c.arc(0, -16, 9, 0, FX_TAU); c.restore(); c.moveTo(-2, -8); c.lineTo(2, -8); c.lineTo(2, 22); c.lineTo(-2, 22); c.closePath(); c.rect(2, 12, 6 * Math.cos(turn), 3); c.rect(2, 18, 8 * Math.cos(turn), 3); c.restore(); }
  FX_DRAW.hidden = function (s, k) {
    var h = cpHour(), tod = h < 6 || h >= 20 ? 3 : h < 8 ? 0 : h < 17 ? 1 : 2, Sp = [], Bd = [], i, kx = k.cx, ky = Math.max(70, k.y - 70);
    var SKY = [['#F9A8D4', '#FDE68A'], ['#7DD3FC', '#E0F2FE'], ['#7C3AED', '#FB923C'], ['#0B1338', '#1E3A8A']][tod], LAND = tod === 3 ? ['#273A5C', '#1E3150', '#152640', '#0F1C30'] : tod === 2 ? ['#7A4E7E', '#5E3E6E', '#46305A', '#32223F'] : ['#8BC48A', '#6DB06E', '#4F9A57', '#3A7F45'];
    var KP = []; for (i = 0; i < 40; i++) { var a2 = i / 22 * FX_TAU; KP.push(i < 22 ? [Math.cos(a2) * 9, -16 + Math.sin(a2) * 9] : i < 34 ? [0, -7 + (i - 22) * 2.4] : [3 + (i - 34) * 1.2, 13 + (i % 2) * 6]); }
    for (i = 0; i < 40; i++) { Sp.push({ x0: fxR(0, s.w), y0: fxR(0, s.h), d: fxR(0, 0.3) }); }
    for (i = 0; i < 9; i++) { Bd.push({ x: fxR(0.15, 0.85), y: fxR(0.25, 0.6), d: 3.0 + i * 0.12, dx: fxR(-1, 1), col: ['#FFFFFF', '#FDE68A', '#FBCFE8', '#BAE6FD'][i % 4] }); }
    function world(c, t, u) {
      var W = s.w, H = s.h, hy = k.y + k.h * 0.6, sg = c.createLinearGradient(0, 0, 0, hy), j;
      sg.addColorStop(0, SKY[0]); sg.addColorStop(1, SKY[1]); c.fillStyle = sg; c.fillRect(0, 0, W, H);
      var sx = W * 0.72, sy = hy - Math.min(H * 0.28, 210) * fxEase(u);
      c.globalCompositeOperation = 'lighter'; if (tod === 3) { for (j = 0; j < 50; j++) { fxGlow(c, '255,255,255', fxRnd(j) * W, fxRnd(j + 50) * hy, 1.6, 0.5 + 0.4 * Math.sin(t * 2 + j)); } fxGlow(c, '254,249,195', sx, sy, 60, 0.4); } else { for (j = 0; j < 12; j++) { lkBeam(c, sx, sy, j / 12 * FX_TAU + t * 0.15, Math.max(W, H), 0.06, '255,240,200', 0.12); } fxGlow(c, '255,214,140', sx, sy, 120, 0.5); }
      c.globalCompositeOperation = 'source-over'; c.fillStyle = tod === 3 ? '#FEF9C3' : '#FFF4D6'; c.beginPath(); c.arc(sx, sy, 26, 0, FX_TAU); c.fill(); if (tod === 3) { c.fillStyle = SKY[0]; c.beginPath(); c.arc(sx + 10, sy - 6, 22, 0, FX_TAU); c.fill(); }
      var f1 = Math.max(0, Math.min(1, u / 0.6)), f2 = Math.max(0, Math.min(1, (u - 0.12) / 0.6)), f3 = Math.max(0, Math.min(1, (u - 0.24) / 0.6)), f4 = Math.max(0, Math.min(1, (u - 0.36) / 0.6));
      c.fillStyle = LAND[0]; c.fillRect(0, hy, W, H - hy + 4);
      cpCut(c, hy, f1, function (c) { c.beginPath(); c.moveTo(0, hy); for (var x = 0; x <= W; x += W / 9) { c.lineTo(x, hy - 60 - 50 * Math.abs(Math.sin(x * 0.011 + 1))); c.lineTo(x + W / 18, hy - 30 - 30 * Math.abs(Math.sin(x * 0.02))); } c.lineTo(W, hy); c.closePath(); }, LAND[0], 6);
      cpCut(c, hy + 40, f2, function (c) { c.beginPath(); c.moveTo(0, H + 4); for (var x = 0; x <= W; x += 10) { c.lineTo(x, hy + 10 - 40 * (0.5 + 0.5 * Math.sin(x * 0.012 + 2))); } c.lineTo(W, H + 4); c.closePath(); }, LAND[1], 6);
      if (f2 > 0.95) { var mx = W * 0.2, my = hy - 12; c.fillStyle = tod === 3 ? '#E2E8F0' : '#FEF3C7'; cpPoly(c, [[mx - 9, my + 30], [mx - 6, my - 4], [mx + 6, my - 4], [mx + 9, my + 30]]); c.fill(); c.fillStyle = '#B91C1C'; cpPoly(c, [[mx - 8, my - 4], [mx, my - 14], [mx + 8, my - 4]]); c.fill(); c.save(); c.translate(mx, my - 6); c.rotate(t * 1.2); c.fillStyle = '#F5EBDD'; for (j = 0; j < 4; j++) { c.rotate(Math.PI / 2); c.fillRect(-2, 2, 4, 26); } c.restore(); if (tod >= 2) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', mx, my + 12, 10, 0.7); c.globalCompositeOperation = 'source-over'; } }
      cpCut(c, hy + 110, f3, function (c) { c.beginPath(); c.moveTo(0, H + 4); for (var x = 0; x <= W; x += 10) { c.lineTo(x, hy + 70 - 40 * (0.5 + 0.5 * Math.sin(x * 0.009 + 4))); } c.lineTo(W, H + 4); c.closePath(); for (j = 0; j < 7; j++) { var tx = W * (0.08 + j * 0.14), tyy = hy + 52 - 30 * (0.5 + 0.5 * Math.sin(tx * 0.009 + 4)); c.moveTo(tx + 12, tyy); c.arc(tx, tyy, 12, 0, FX_TAU); c.rect(tx - 2, tyy, 4, 16); } }, LAND[2], 5);
      if (f3 > 0.95) { var hx = W * 0.82, hy2 = hy + 44; c.fillStyle = '#F3D9A4'; c.fillRect(hx - 14, hy2 - 16, 28, 18); c.fillStyle = '#C8553D'; cpPoly(c, [[hx - 18, hy2 - 15], [hx, hy2 - 30], [hx + 18, hy2 - 15]]); c.fill(); c.fillStyle = tod >= 2 ? '#FCD34D' : '#7DD3FC'; c.fillRect(hx - 9, hy2 - 11, 7, 6); if (tod >= 2) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', hx - 5, hy2 - 8, 14, 0.7); c.globalCompositeOperation = 'source-over'; } }
      cpCut(c, H + 4, f4, function (c) { c.beginPath(); c.moveTo(0, H + 4); for (var x = 0; x <= W; x += 10) { c.lineTo(x, hy + 150 - 30 * Math.sin(x * 0.008 + 1)); } c.lineTo(W, H + 4); c.closePath(); }, LAND[3], 5);
      if (f4 > 0.9) { c.fillStyle = tod === 3 ? 'rgba(147,197,253,.5)' : 'rgba(186,230,253,.85)'; c.beginPath(); c.moveTo(W * 0.46, hy + 8); c.bezierCurveTo(W * 0.3, hy + 60, W * 0.7, hy + 110, W * 0.45, H + 4); c.lineTo(W * 0.62, H + 4); c.bezierCurveTo(W * 0.85, hy + 110, W * 0.42, hy + 60, W * 0.5, hy + 8); c.closePath(); c.fill(); }
    }
    return function (t, dt) {
      var c = s.ctx, a = fxEnv(t, 0, 0.4, 5.2, 5.8), form = fxEase((t - 0.25) / 0.9), ins = fxEase((t - 1.25) / 0.45), turn = fxEase((t - 1.7) / 0.3) * Math.PI / 2, grow = fxEase((t - 1.95) / 1.0), shrink = fxEase((t - 4.3) / 0.6), j;
      var R = 16 + (Math.hypot(s.w, s.h) * 1.4) * grow * (1 - shrink), holeY = ky + 4;
      fxDim(c, s, k, 0.9 * a, '#04030A');
      lkOut(c, s, k, 2);
      /* the world through the keyhole */
      if (grow > 0.001 && R > 18) { c.save(); cpKeyhole(c, kx, holeY, R); c.clip(); world(c, t, fxEase((t - 2.0) / 1.4) * (1 - shrink)); c.restore(); }
      /* the keyhole's rim of light */
      c.globalCompositeOperation = 'lighter'; var kh = fxEnv(t, 0.9, 1.3, 4.9, 5.3);
      kh *= Math.max(0, Math.min(1, 1 - (R - 40) / 160));
      if (kh > 0) { c.strokeStyle = 'rgba(253,224,71,' + (0.85 * kh * a).toFixed(3) + ')'; c.lineWidth = 2.4; cpKeyhole(c, kx, holeY, R); c.stroke(); if (grow < 0.05) { fxGlow(c, '253,224,71', kx, holeY, 30, 0.6 * kh); c.fillStyle = 'rgba(255,247,214,' + (0.5 * kh).toFixed(3) + ')'; cpKeyhole(c, kx, holeY, R); c.fill(); } }
      /* the sparks that become a key, the key going in and turning */
      var kyy = ky - 80 + 70 * ins, kz = 1.3 - 0.45 * ins;
      if (t < 2.1) { Sp.forEach(function (p, m) { var u = Math.max(0, Math.min(1, (t - 0.2 - p.d) / 0.8)), tg = KP[m % KP.length], x = p.x0 + (kx + tg[0] * kz - p.x0) * fxEase(u), y = p.y0 + (kyy + tg[1] * kz - p.y0) * fxEase(u); fxGlow(c, '253,224,71', x, y, 4, (0.3 + 0.7 * u) * a * (1 - fxEase((t - 1.9) / 0.2))); }); }
      if (form > 0.6 && t < 2.2) { c.fillStyle = 'rgba(253,230,138,' + (Math.min(1, (form - 0.6) * 3) * a * (1 - fxEase((t - 1.95) / 0.25))).toFixed(3) + ')'; cpKey(c, kx, kyy, kz, turn); c.fill('evenodd'); fxGlow(c, '253,224,71', kx, kyy, 40, 0.4 * a); }
      var clk = t - 1.95; if (clk > 0 && clk < 0.5) { fxRing(c, kx, holeY, 10 + clk * 160, 10 + clk * 160, '255,247,214', (1 - clk / 0.5) * a, 2.4); fxGlow(c, '255,255,255', kx, holeY, 60, (1 - clk / 0.5) * a); }
      /* paper birds flying out past you */
      c.globalCompositeOperation = 'source-over';
      Bd.forEach(function (b) { var u = (t - b.d) / 1.3; if (u <= 0 || u >= 1) { return; } var z = 0.4 + u * u * 5, x = s.w * b.x + b.dx * u * s.w * 0.6, y = s.h * b.y - u * s.h * 0.3, fl = Math.sin(t * 9 + b.d * 7); c.globalAlpha = Math.min(1, (1 - u) * 3) * a; c.fillStyle = b.col; cpPoly(c, [[x - 11 * z, y - fl * 7 * z], [x, y], [x + 3 * z, y + 3 * z]]); c.fill(); cpPoly(c, [[x + 11 * z, y - fl * 7 * z], [x, y], [x - 3 * z, y + 3 * z]]); c.fill(); c.fillStyle = 'rgba(0,0,0,.2)'; cpPoly(c, [[x, y], [x + 11 * z, y - fl * 7 * z], [x + 3 * z, y + 3 * z]]); c.fill(); c.globalAlpha = 1; });
      /* the key settles on the answer */
      var st = fxEnv(t, 4.7, 5.0, 5.3, 5.7); if (st > 0) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(253,230,138,' + (0.9 * st).toFixed(3) + ')'; c.save(); c.translate(k.x + k.w - 24, k.y - 6); c.rotate(-Math.PI / 2); cpKey(c, 0, 0, 0.55, 0); c.fill('evenodd'); c.restore(); fxGlow(c, '253,224,71', k.x + k.w - 24, k.y - 6, 26, 0.5 * st); }
      c.globalCompositeOperation = 'source-over'; lkIn(c);
      lkFinish(c, k, a * fxEase((t - 4.6) / 0.3), (t - 4.6) / 0.9, '253,224,71');
    };
  };

  /* ---------- moving paper, behind the whole page (light or dark: bcDark(s)) ---------- */
  /* cut paper is opaque, so a scene of paper layers is drawn whole on a canvas of its own (cpOff) and then laid over the page
     at one strength (cpBlit): the layers hide each other as paper does instead of showing through */
  function cpOff(s, o) {
    var w = s.c.width, h = s.c.height, d = w / Math.max(1, s.w);
    if (!o.cv || o.cv.width !== w || o.cv.height !== h) { o.cv = document.createElement('canvas'); o.cv.width = w; o.cv.height = h; o.c = o.cv.getContext('2d'); }
    o.c.setTransform(d, 0, 0, d, 0, 0); o.c.clearRect(0, 0, s.w, s.h); fxClean(o.c); return o.c;
  }
  function cpBlit(s, o, a) { var c = s.ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.drawImage(o.cv, 0, 0); c.restore(); }
  /* Paper boats (Pop-Up, Common): along the foot of the page, four rows of cut-paper waves roll at their own speeds, each
     throwing a shadow on the row behind, and folded paper boats in every color ride them, bobbing and tipping with the swell.
     A paper sun (or moon, on a dark page) turns in the corner and gulls bob on their wires. Every so often a paper whale's tail
     flips up between the waves and splashes, and one boat now and then flies a flag that says hello */
  FX_PAPER.boats = function (s) {
    var Bt = [], i, Sp = [], lastW = -1, OF = {};
    for (i = 0; i < 5; i++) { Bt.push({ row: i % 4, off: fxR(0, 1), sp: fxR(0.006, 0.012) * (i % 2 ? 1 : -1), c: ['#F87171', '#FBBF24', '#60A5FA', '#F472B6', '#34D399'][i], z: fxR(0.85, 1.15), flag: i === 2 }); }
    function wy(x, r, t, H, u) { var base = H - (110 - r * 26) * u; return base - 8 * u * (0.6 * Math.sin(x * 0.018 + t * (0.9 + r * 0.25) * (r % 2 ? -1 : 1) + r * 1.7) + 0.4 * Math.sin(x * 0.041 - t * 0.6 + r)); }
    return function (t, dt) {
      var c = cpOff(s, OF), D = bcDark(s), W = s.w, H = s.h, u = Math.min(1.25, Math.max(0.75, W / 600)), A = D ? 0.88 : 0.62, al = 1, j, r;
      var COL = D ? ['#1E3A6E', '#1B3462', '#172C55', '#122447'] : ['#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6'];
      /* the sun or moon on its paper wheel, and gulls on wires */
      var sx = W - 90 * u, sy = 90 * u, rot = t * 0.15; c.globalAlpha = al * 0.9;
      c.fillStyle = D ? '#FEF3C7' : '#FDE68A'; c.beginPath(); for (j = 0; j < 20; j++) { var ra = rot + j / 20 * FX_TAU, rr = (j % 2 ? 30 : 40) * u; c.lineTo(sx + Math.cos(ra) * rr, sy + Math.sin(ra) * rr); } c.closePath(); if (!D) { c.fill(); }
      c.fillStyle = D ? '#FEF9C3' : '#FCD34D'; c.beginPath(); c.arc(sx, sy, 26 * u, 0, FX_TAU); c.fill(); if (D) { c.fillStyle = cpMix('#0B0B10', '#FEF9C3', 0.05); c.beginPath(); c.arc(sx + 10 * u, sy - 6 * u, 22 * u, 0, FX_TAU); c.fill(); }
      c.strokeStyle = D ? 'rgba(226,232,240,.55)' : 'rgba(71,85,105,.5)'; c.lineWidth = 1.4; c.lineCap = 'round';
      for (j = 0; j < 3; j++) { var gx = W * (0.2 + j * 0.28) + Math.sin(t * 0.5 + j) * 14, gy = H - 170 * u - j * 22 + Math.sin(t * 1.3 + j * 2) * 6, f = Math.sin(t * 6 + j) * 4; c.lineWidth = 1; c.globalAlpha = al * 0.35; c.beginPath(); c.moveTo(gx, gy - 70); c.lineTo(gx, gy); c.stroke(); c.globalAlpha = al; c.lineWidth = 2; c.beginPath(); c.moveTo(gx - 10, gy - f); c.quadraticCurveTo(gx - 4, gy - 5, gx, gy); c.quadraticCurveTo(gx + 4, gy - 5, gx + 10, gy - f); c.stroke(); }
      /* the rows of waves, back to front, with a boat or two on each; the whale's tail between rows 1 and 2 */
      var wc = Math.floor(t / 38), wt = t - wc * 38, wx = W * (0.25 + 0.5 * fxRnd(wc)), tail = fxEnv(wt, 30, 31, 32.6, 33.6);
      for (r = 0; r < 4; r++) {
        if (r === 2 && tail > 0) { var ty = wy(wx, 1, t, H, u) + 10 - tail * 54 * u; c.globalAlpha = al; c.fillStyle = D ? '#334A7A' : '#475569'; c.beginPath(); c.moveTo(wx - 6 * u, ty + 40 * u); c.quadraticCurveTo(wx - 4 * u, ty + 10 * u, wx, ty); c.quadraticCurveTo(wx - 26 * u, ty - 8 * u, wx - 34 * u, ty - 2 * u); c.quadraticCurveTo(wx - 14 * u, ty - 16 * u, wx, ty - 6 * u); c.quadraticCurveTo(wx + 14 * u, ty - 16 * u, wx + 34 * u, ty - 2 * u); c.quadraticCurveTo(wx + 26 * u, ty - 8 * u, wx, ty); c.quadraticCurveTo(wx + 4 * u, ty + 10 * u, wx + 6 * u, ty + 40 * u); c.fill();
          var wk = Math.floor(wt * 3); if (tail > 0.9 && wk !== lastW) { lastW = wk; for (j = 0; j < 6; j++) { Sp.push({ x: wx + fxR(-20, 20) * u, y: ty - 4 * u, vx: fxR(-50, 50), vy: fxR(-120, -60), l: 0, m: fxR(0.5, 0.9) }); } } }
        c.globalAlpha = al * 0.35; c.fillStyle = '#0B1220'; c.beginPath(); c.moveTo(0, H); for (j = 0; j <= W + 10; j += 10) { c.lineTo(j + 6, wy(j, r, t, H, u) - 3); } c.lineTo(W, H); c.closePath(); c.fill();
        c.globalAlpha = al; c.fillStyle = COL[r]; c.beginPath(); c.moveTo(0, H); for (j = 0; j <= W + 10; j += 10) { c.lineTo(j, wy(j, r, t, H, u)); } c.lineTo(W, H); c.closePath(); c.fill();
        c.strokeStyle = D ? 'rgba(191,219,254,.35)' : 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; c.beginPath(); for (j = 0; j <= W + 10; j += 10) { var yy = wy(j, r, t, H, u); if (j) { c.lineTo(j, yy); } else { c.moveTo(j, yy); } } c.stroke();
        Bt.forEach(function (b) {
          if (b.row !== r) { return; }
          var x = ((b.off + t * b.sp) % 1 + 1) % 1 * (W + 120) - 60, y = wy(x, r, t, H, u), sl = Math.atan((wy(x + 6, r, t, H, u) - wy(x - 6, r, t, H, u)) / 12), z = b.z * u * (0.75 + r * 0.1);
          c.save(); c.translate(x, y + 2 * z); c.rotate(sl); c.scale(z, z); c.globalAlpha = al;
          c.fillStyle = 'rgba(11,18,32,.3)'; cpPoly(c, [[-20, -3], [22, -3], [14, 9], [-12, 9]]); c.fill();
          c.fillStyle = b.c; cpPoly(c, [[-22, -6], [22, -6], [14, 6], [-14, 6]]); c.fill(); c.fillStyle = cpMix(b.c, '#000000', 0.18); cpPoly(c, [[0, -6], [22, -6], [14, 6], [0, 6]]); c.fill();
          c.fillStyle = cpMix(b.c, '#FFFFFF', 0.25); cpPoly(c, [[-10, -6], [0, -26], [10, -6]]); c.fill(); c.fillStyle = cpMix(b.c, '#000000', 0.1); cpPoly(c, [[0, -26], [10, -6], [0, -6]]); c.fill();
          if (b.flag && Math.floor(t / 20) % 3 === 1) { c.strokeStyle = '#475569'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -26); c.lineTo(0, -40); c.stroke(); c.fillStyle = '#FFFFFF'; c.fillRect(0, -40, 18, 9); c.restore(); cpWrite(c, 'HI!', x + 9 * z, y + 2 * z - 35 * z, 6 * z, '#DC2626', al, '800 ' + Math.round(7 * z) + 'px ' + FX_MONO); return; }
          c.restore();
        });
      }
      c.globalAlpha = al; lkStep(Sp, dt, 260, 0.6, function (p, f) { c.fillStyle = D ? 'rgba(191,219,254,' + f + ')' : 'rgba(255,255,255,' + f + ')'; c.beginPath(); c.arc(p.x, p.y, 2.4, 0, FX_TAU); c.fill(); });
      c.globalAlpha = 1; cpBlit(s, OF, A);
    };
  };

  /* Signals (Cipher, Rare): ships far out at sea along the foot of the page talk to each other in real Morse code, one asking
     and another answering. On a dark page they flash signal lamps; on a light one they flash mirrors in the sun. Each dot and
     dash is written faintly over the water as it is sent, and each letter appears under its code when it is done, so you can
     read along or decode it first */
  var CP_TALK = [['HOW GOES IT', 'ALL WELL'], ['KEEP GOING', 'ALWAYS'], ['READY', 'AYE AYE'], ['LAND AHEAD', 'STEADY ON'], ['GOOD LUCK', 'THANKS'], ['NICE WORK', 'YOU TOO'], ['STUDY HARD', 'WILCO']];
  FX_PAPER.signals = function (s) {
    var SH = [[0.2, 0.9, 1], [0.62, 0.75, -1], [0.86, 0.6, 1]], i, St = [], U = 0.13;
    for (i = 0; i < 60; i++) { St.push({ x: Math.random(), y: Math.random() * 0.6, p: fxR(0, 6), z: fxR(0.5, 1.3) }); }
    var plan = [], tt = 2, n0 = Math.floor(Math.random() * CP_TALK.length);
    function build(k) { var pair = CP_TALK[(n0 + k) % CP_TALK.length], a = cpMorse(pair[0]), b = cpMorse(pair[1]), who = k % 3; return [{ m: pair[0], mo: a, ship: who, t0: 0 }, { m: pair[1], mo: b, ship: (who + 1) % 3, t0: a.len * U + 2.5 }, { end: a.len * U + 2.5 + b.len * U + 5 }]; }
    return function (t) {
      var c = s.ctx, D = bcDark(s), W = s.w, H = s.h, u = Math.min(1.3, Math.max(0.8, W / 600)), hz = H - 120 * u, al = D ? 0.9 : 0.6, j;
      /* which exchange is on: they repeat in turn */
      var T = t, k = 0, cyc; while (true) { cyc = build(k); if (T < cyc[2].end) { break; } T -= cyc[2].end; k++; if (k > 200) { break; } }
      if (D) { c.globalCompositeOperation = 'lighter'; St.forEach(function (q) { fxGlow(c, '226,232,255', q.x * W, q.y * hz, 1.5 * q.z, 0.15 + 0.2 * Math.sin(t * 1.4 + q.p)); }); c.globalCompositeOperation = 'source-over'; }
      /* the sea in bands, the far island, the ships */
      var sg = c.createLinearGradient(0, hz, 0, H); sg.addColorStop(0, D ? 'rgba(30,58,110,.85)' : 'rgba(147,197,253,.5)'); sg.addColorStop(1, D ? 'rgba(12,24,52,.95)' : 'rgba(59,130,246,.45)'); c.fillStyle = sg; c.fillRect(0, hz, W, H - hz);
      c.globalAlpha = al * 0.6; c.fillStyle = D ? '#16264A' : '#94A3B8'; c.beginPath(); c.moveTo(W * 0.38, hz); c.quadraticCurveTo(W * 0.44, hz - 22 * u, W * 0.5, hz - 14 * u); c.quadraticCurveTo(W * 0.55, hz - 30 * u, W * 0.6, hz); c.closePath(); c.fill(); c.globalAlpha = 1;
      c.strokeStyle = D ? 'rgba(147,197,253,.25)' : 'rgba(255,255,255,.6)'; c.lineWidth = 1; for (j = 0; j < 7; j++) { var yy = hz + 10 * u + j * 14 * u, ph = t * (0.4 + j * 0.1); c.beginPath(); for (var x = 0; x <= W; x += 12) { var y2 = yy + Math.sin(x * 0.03 + ph + j) * 1.6; if (x) { c.lineTo(x, y2); } else { c.moveTo(x, y2); } } c.stroke(); }
      var talk = [cyc[0], cyc[1]];
      SH.forEach(function (sh, n) {
        var x = sh[0] * W + Math.sin(t * 0.05 + n * 2) * 30 * u, z = sh[1] * u, y = hz + (14 + n * 10) * u + Math.sin(t * 1.2 + n) * 1.5;
        c.save(); c.translate(x, y); c.scale(z * sh[2], z); c.globalAlpha = al; c.fillStyle = D ? '#0B1226' : '#334155';
        c.beginPath(); c.moveTo(-40, -6); c.lineTo(42, -6); c.lineTo(34, 6); c.lineTo(-34, 6); c.closePath(); c.fill(); c.fillRect(-18, -18, 30, 12); c.fillRect(-8, -30, 16, 12); c.fillRect(14, -40, 2, 34); c.fillRect(-26, -32, 2, 26);
        if (D) { c.fillStyle = '#FCD34D'; for (j = 0; j < 5; j++) { c.fillRect(-14 + j * 6, -14, 2.6, 2.6); } }
        c.restore();
        /* the lamp or mirror: on during each dot and dash of this ship's message */
        var lit = 0; talk.forEach(function (msg) { if (msg.ship !== n) { return; } var tm = (T - msg.t0) / U; msg.mo.on.forEach(function (o) { if (tm >= o[0] && tm < o[1]) { lit = 1; } }); });
        var lx = x + 15 * z * sh[2], ly = y - 40 * z; c.globalCompositeOperation = 'lighter';
        if (lit) { if (D) { fxGlow(c, '254,240,138', lx, ly, 26 * z, 0.95); fxGlow(c, '255,255,255', lx, ly, 6 * z, 1); fxBeam(c, lx, ly, sh[2] > 0 ? -0.15 : Math.PI + 0.15, 160 * z, 0.12, 'rgba(254,240,138,.18)'); } else { c.globalCompositeOperation = 'source-over'; fxStar4(c, lx, ly, 14 * z, 0.95, '#F59E0B'); fxStar4(c, lx, ly, 8 * z, 1, '#FFFFFF'); } }
        else if (D) { fxGlow(c, '254,240,138', lx, ly, 4 * z, 0.4); }
        c.globalCompositeOperation = 'source-over';
      });
      /* the code written over the water, and the letters under it */
      talk.forEach(function (msg, m) {
        var tm = (T - msg.t0) / U; if (tm < -4) { return; } var fade = Math.min(1, Math.max(0, (cyc[2].end - T) / 2.4)), x0 = W * 0.5 - msg.m.length * 9 * u, yb = hz - (58 - m * 28) * u, al2 = (D ? 0.85 : 0.75) * fade;
        c.font = '700 ' + Math.round(11 * u) + 'px ' + FX_MONO; c.textAlign = 'center'; c.textBaseline = 'middle';
        for (var q = 0; q < msg.m.length; q++) { var ch = msg.m.charAt(q), syms = msg.mo.on.filter(function (o) { return o[2] === q; }), cx = x0 + q * 18 * u + 9 * u; if (ch === ' ' || !syms.length) { continue; }
          var shown = syms.filter(function (o) { return tm >= o[0]; }); if (!shown.length) { continue; }
          var dw = 0, tot = syms.reduce(function (sum, o) { return sum + (o[1] - o[0] === 1 ? 3 : 7); }, 0) * u * 0.8; c.fillStyle = D ? 'rgba(254,240,138,' + al2 + ')' : 'rgba(30,64,175,' + al2 + ')';
          shown.forEach(function (o) { var w = (o[1] - o[0] === 1 ? 2 : 6) * u * 0.8; c.fillRect(cx - tot / 2 + dw, yb - 1.2 * u, w, 2.4 * u); dw += w + u * 0.8; });
          var done = tm >= syms[syms.length - 1][1]; if (done) { c.globalAlpha = al2 * Math.min(1, (tm - syms[syms.length - 1][1]) / 4); c.fillStyle = D ? '#FEF3C7' : '#1E3A8A'; c.fillText(ch, cx, yb + 11 * u); c.globalAlpha = 1; }
        }
      });
    };
  };

  /* Paper forest (Pop-Up, Epic): five rows of cut-paper trees along the foot of the page, mist drifting between them, every row
     casting its shadow on the one behind. It keeps your own time of day: a gold morning, green afternoon, orange and violet
     dusk, or blue night with a moon, fireflies and a lit cabin. Animals live between the rows and change with the hour: a deer
     walking behind the trunks, a rabbit hopping in front, birds crossing by day, an owl blinking by night and a fox at dusk */
  FX_PAPER.forest = function (s) {
    var R = [], i, Ff = [], OF = {};
    for (i = 0; i < 5; i++) { var tr = [], x = -40; while (x < 1500) { var w = fxR(26, 54); tr.push({ x: x, h: fxR(0.7, 1.15), pine: fxRnd(x + i * 9) > 0.35, w: w }); x += w * fxR(0.55, 0.9); } R.push(tr); }
    for (i = 0; i < 26; i++) { Ff.push({ x: Math.random(), y: fxR(0.7, 0.95), p: fxR(0, 6) }); }
    var PAL = { morning: ['#C9DFC2', '#A9CDA0', '#86B97E', '#5E9C5C', '#3F7F45', '#FCE7B6'], day: ['#BFDDB8', '#9CCB93', '#77B36F', '#4F9A50', '#357A3C', '#FFFFFF'], dusk: ['#C9A0C9', '#A87AA8', '#865A8C', '#5E3E6E', '#3B2748', '#FDBA9A'], night: ['#2B3F66', '#24375A', '#1D2F4D', '#162640', '#0F1C30', '#A5B4FC'] };
    function treePath(c, x, base, h, pine, w) { if (pine) { c.moveTo(x - w * 0.42, base); c.lineTo(x, base - h); c.lineTo(x + w * 0.42, base); c.closePath(); c.moveTo(x - w * 0.34, base - h * 0.35); c.lineTo(x, base - h * 0.95); c.lineTo(x + w * 0.34, base - h * 0.35); c.closePath(); } else { c.moveTo(x + w * 0.4, base - h * 0.6); c.arc(x, base - h * 0.6, w * 0.4, 0, FX_TAU); c.rect(x - w * 0.06, base - h * 0.4, w * 0.12, h * 0.4); } }
    return function (t, dt) {
      var c = cpOff(s, OF), D = bcDark(s), W = s.w, H = s.h, u = Math.min(1.3, Math.max(0.8, W / 600)), hr = cpHour(), tod = hr >= 20 || hr < 6 ? 'night' : hr < 11 ? 'morning' : hr < 17 ? 'day' : 'dusk', P = PAL[tod].map(function (x) { return D && tod !== 'night' ? cpMix(x, '#0B0B10', 0.35) : x; }), A = D ? 0.85 : 0.58, al = 1, j, r;
      /* sky light: the sun low, high, setting, or the moon */
      var sx = tod === 'morning' ? W * 0.2 : tod === 'day' ? W * 0.55 : tod === 'dusk' ? W * 0.82 : W * 0.7, sy = H - (tod === 'day' ? 380 : 250) * u;
      c.globalCompositeOperation = D ? 'lighter' : 'source-over'; c.globalAlpha = 1;
      fxGlow(c, tod === 'night' ? '199,210,254' : tod === 'dusk' ? '251,146,60' : '253,224,71', sx, sy, 160 * u, D ? 0.25 : 0.3);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = al; c.fillStyle = tod === 'night' ? '#E0E7FF' : tod === 'dusk' ? '#FDBA74' : '#FDE68A'; c.beginPath(); c.arc(sx, sy, 22 * u, 0, FX_TAU); c.fill();
      if (tod === 'night') { c.fillStyle = D ? '#0B0B10' : '#FFFFFF'; c.beginPath(); c.arc(sx + 9 * u, sy - 6 * u, 19 * u, 0, FX_TAU); c.fill(); }
      if (tod === 'day' || tod === 'morning') { c.strokeStyle = 'rgba(51,65,85,' + (al * 0.7).toFixed(2) + ')'; c.lineWidth = 1.4; for (j = 0; j < 4; j++) { var bx = ((t * 22 + j * 140) % (W + 200)) - 100, by = H - 330 * u + Math.sin(t * 0.8 + j) * 20 + j * 12, f = Math.sin(t * 8 + j) * 4; c.beginPath(); c.moveTo(bx - 7, by - f); c.quadraticCurveTo(bx - 3, by - 3, bx, by); c.quadraticCurveTo(bx + 3, by - 3, bx + 7, by - f); c.stroke(); } }
      for (r = 0; r < 5; r++) {
        var base = H - (130 - r * 26) * u, scale = (0.58 + r * 0.13) * u, drift = t * (2 + r * 3), off = drift % 1500;
        c.globalAlpha = al * 0.3; c.fillStyle = '#0B1220'; c.beginPath(); R[r].forEach(function (q) { var x = (q.x - off + 1500 * 2) % 1500 * Math.max(1, W / 1500); if (x > W + 60) { return; } treePath(c, x + 5, base + 3, q.h * 90 * scale, q.pine, q.w * scale); }); c.rect(0, base, W, H - base); c.fill();
        c.globalAlpha = al; c.fillStyle = P[r]; c.beginPath(); R[r].forEach(function (q) { var x = (q.x - off + 1500 * 2) % 1500 * Math.max(1, W / 1500); if (x > W + 60) { return; } treePath(c, x, base, q.h * 90 * scale, q.pine, q.w * scale); }); c.rect(0, base - 1, W, H - base + 1); c.fill();
        if (r < 4) { var mx = ((t * (8 + r * 4) + r * 300) % (W + 600)) - 300; c.globalAlpha = (D ? 0.12 : 0.35) * (tod === 'night' ? 0.6 : 1); c.fillStyle = P[5]; c.beginPath(); c.ellipse(mx, base - 6 * u, 260 * u, 10 * u, 0, 0, FX_TAU); c.ellipse(mx + 420 * u, base - 2 * u, 200 * u, 8 * u, 0, 0, FX_TAU); c.fill(); }
        /* who lives in which row, by the hour */
        c.globalAlpha = al;
        if (r === 2 && tod !== 'night') { var dx = ((t * 14) % (W + 300)) - 150, dy = base - 2 * u, z = scale * 0.9, step = Math.sin(t * 6) * 3; c.fillStyle = tod === 'dusk' ? '#2A1A3A' : '#7A5236'; c.save(); c.translate(dx, dy); c.scale(z, z); c.beginPath(); c.ellipse(0, -18, 14, 7, 0, 0, FX_TAU); c.fill(); c.fillRect(-11 + step * 0.3, -14, 3, 14); c.fillRect(8 - step * 0.3, -14, 3, 14); c.beginPath(); c.moveTo(10, -22); c.lineTo(16, -34); c.lineTo(21, -32); c.lineTo(16, -20); c.fill(); c.strokeStyle = c.fillStyle; c.lineWidth = 1.4; c.beginPath(); c.moveTo(18, -34); c.lineTo(15, -42); c.moveTo(19, -34); c.lineTo(24, -41); c.stroke(); c.restore(); }
        if (r === 3 && tod === 'dusk') { var fx = W - ((t * 30) % (W + 200)) + 100, fy = base - 2 * u, z2 = scale * 0.8, tr2 = Math.sin(t * 12) * 2; c.fillStyle = '#E8692A'; c.save(); c.translate(fx, fy); c.scale(-z2, z2); c.beginPath(); c.ellipse(0, -9, 11, 5, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(8, -12); c.lineTo(16, -14); c.lineTo(12, -6); c.fill(); c.beginPath(); c.moveTo(9, -13); c.lineTo(11, -19); c.lineTo(13, -13); c.fill(); c.beginPath(); c.moveTo(-10, -9); c.quadraticCurveTo(-20, -14 + tr2, -24, -8); c.quadraticCurveTo(-18, -6, -10, -7); c.fill(); c.fillRect(-7, -6, 2, 6); c.fillRect(5, -6, 2, 6); c.restore(); }
        if (r === 1 && tod === 'night') { var ox = W * 0.3, oy = base - 70 * scale, bl = (t % 4.2) < 0.15 ? 0.15 : 1; c.fillStyle = '#5B4A6E'; c.beginPath(); c.ellipse(ox, oy, 7 * u, 9 * u, 0, 0, FX_TAU); c.fill(); c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', ox - 2.6 * u, oy - 3 * u, 4 * u, 0.8); fxGlow(c, '253,224,71', ox + 2.6 * u, oy - 3 * u, 4 * u, 0.8); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#FDE047'; c.beginPath(); c.ellipse(ox - 2.6 * u, oy - 3 * u, 1.8 * u, 1.8 * u * bl, 0, 0, FX_TAU); c.ellipse(ox + 2.6 * u, oy - 3 * u, 1.8 * u, 1.8 * u * bl, 0, 0, FX_TAU); c.fill(); }
        if (r === 2 && tod === 'night') { var cx2 = W * 0.72, cy2 = base; c.fillStyle = P[4]; c.fillRect(cx2 - 18 * u, cy2 - 22 * u, 36 * u, 22 * u); cpPoly(c, [[cx2 - 22 * u, cy2 - 20 * u], [cx2, cy2 - 36 * u], [cx2 + 22 * u, cy2 - 20 * u]]); c.fill(); c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', cx2 - 6 * u, cy2 - 12 * u, 22 * u, 0.6 + 0.1 * Math.sin(t * 5)); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#FCD34D'; c.fillRect(cx2 - 10 * u, cy2 - 16 * u, 8 * u, 7 * u); }
        if (r === 4 && (tod === 'day' || tod === 'morning')) { var hx = ((t * 40) % (W + 200)) - 100, hop = Math.abs(Math.sin(t * 5)) * 10 * u, hy = base - hop; c.fillStyle = '#E7E5E4'; c.beginPath(); c.ellipse(hx, hy - 6 * u, 7 * u, 5 * u, 0, 0, FX_TAU); c.arc(hx + 6 * u, hy - 10 * u, 3.6 * u, 0, FX_TAU); c.fill(); c.beginPath(); c.ellipse(hx + 6 * u, hy - 17 * u, 1.3 * u, 4 * u, 0.2, 0, FX_TAU); c.ellipse(hx + 8 * u, hy - 17 * u, 1.3 * u, 4 * u, 0.4, 0, FX_TAU); c.fill(); }
      }
      if (tod === 'night' || tod === 'dusk') { c.globalCompositeOperation = D ? 'lighter' : 'source-over'; Ff.forEach(function (q) { var x = q.x * W + Math.sin(t * 0.6 + q.p) * 20, y = H - (1 - q.y) * 500 * u + Math.sin(t * 0.9 + q.p * 2) * 10, b = 0.5 + 0.5 * Math.sin(t * 3 + q.p * 3); if (D) { fxGlow(c, '217,249,157', x, y, 4, b * 0.8); } else { c.globalAlpha = 0.7 * b; c.fillStyle = '#65A30D'; c.beginPath(); c.arc(x, y, 1.8, 0, FX_TAU); c.fill(); } }); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; cpBlit(s, OF, A);
    };
  };

  /* Treasure map (Cipher, Legendary): an old map drifts slowly under the page: islands with hatched coasts, mountains and woods,
     a compass rose, rhumb lines, a ship and a sea serpent, and places with study names (the Isle of Commas, Mount Algebra, the
     Bay of Syntax, Cape Evidence). A dotted trail draws itself from landmark to landmark to an X, and a chest opens there. A
     magnifying glass wanders over it all, and through the lens you can read what is written in secret ink under the map */
  FX_PAPER.map = function (s) {
    var TW = 1000, TH = 760, M = null, S = null, mk = '', TR = [[150, 560], [250, 470], [330, 500], [420, 420], [520, 450], [600, 340], [700, 300], [790, 360]];
    var NAMES = [['Isle of Commas', 230, 610], ['Mount Algebra', 470, 360], ['Bay of Syntax', 640, 520], ['Cape Evidence', 850, 250], ['The Vocab Woods', 330, 440], ['Inference Point', 120, 300]];
    var SECRET = [['DIG DEEPER', 300, 520, -0.2], ['TEN PACES NORTH', 610, 420, 0.1], ['THE TREASURE IS', 760, 180, 0], ['WHAT YOU LEARN', 760, 200, 0], ['TRUST YOUR PREP', 160, 380, -0.1], ['READ THE CLUES', 520, 640, 0.15]];
    function blob(c, x, y, r, seed) { c.beginPath(); for (var i = 0; i <= 40; i++) { var a = i / 40 * FX_TAU, rr = r * (1 + 0.22 * Math.sin(a * 3 + seed) + 0.12 * Math.sin(a * 7 + seed * 2)); if (i) { c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); } else { c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8); } } c.closePath(); }
    function render(D) {
      var d = Math.min(2, window.devicePixelRatio || 1), ink = D ? 'rgba(253,230,138,' : 'rgba(120,72,24,', sec = D ? 'rgba(103,232,249,' : 'rgba(185,28,28,', i, j;
      function mkc() { var cv = document.createElement('canvas'); cv.width = TW * d; cv.height = TH * d; var c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return [cv, c]; }
      var A = mkc(), c = A[1];
      c.strokeStyle = ink + '.12)'; c.lineWidth = 1; for (i = 0; i <= TW; i += 100) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, TH); c.stroke(); } for (i = 0; i <= TH; i += 95) { c.beginPath(); c.moveTo(0, i); c.lineTo(TW, i); c.stroke(); }
      for (i = 0; i < 16; i++) { var ra = i / 16 * FX_TAU; c.strokeStyle = ink + (i % 4 ? '.08)' : '.14)'); c.beginPath(); c.moveTo(880, 640); c.lineTo(880 + Math.cos(ra) * 900, 640 + Math.sin(ra) * 900); c.stroke(); }
      [[230, 560, 120, 1], [520, 400, 150, 2], [830, 260, 90, 3]].forEach(function (q) {
        blob(c, q[0], q[1], q[2], q[3]); c.fillStyle = D ? 'rgba(253,230,138,.05)' : 'rgba(180,130,60,.08)'; c.fill(); c.strokeStyle = ink + '.55)'; c.lineWidth = 1.6; c.stroke();
        for (j = 0; j < 60; j++) { var a = j / 60 * FX_TAU, rr = q[2] * (1 + 0.22 * Math.sin(a * 3 + q[3]) + 0.12 * Math.sin(a * 7 + q[3] * 2)), x = q[0] + Math.cos(a) * rr, y = q[1] + Math.sin(a) * rr * 0.8; c.strokeStyle = ink + '.25)'; c.beginPath(); c.moveTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); c.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); c.stroke(); }
        for (j = 0; j < 6; j++) { var mx = q[0] + (fxRnd(j + q[3] * 9) - 0.5) * q[2] * 0.9, my = q[1] + (fxRnd(j + q[3] * 5 + 3) - 0.5) * q[2] * 0.6; c.strokeStyle = ink + '.5)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(mx - 9, my + 6); c.lineTo(mx, my - 8); c.lineTo(mx + 9, my + 6); c.moveTo(mx - 2, my - 4); c.lineTo(mx + 3, my + 3); c.stroke(); }
        for (j = 0; j < 9; j++) { var tx = q[0] + (fxRnd(j * 3 + q[3]) - 0.5) * q[2] * 1.1, ty = q[1] + q[2] * 0.25 + (fxRnd(j * 7 + q[3]) - 0.5) * q[2] * 0.3; c.beginPath(); c.arc(tx, ty, 4, 0, FX_TAU); c.stroke(); c.beginPath(); c.moveTo(tx, ty + 4); c.lineTo(tx, ty + 8); c.stroke(); }
      });
      c.strokeStyle = ink + '.4)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(470, 330); c.bezierCurveTo(500, 380, 450, 420, 520, 470); c.bezierCurveTo(560, 500, 540, 530, 600, 545); c.stroke();
      for (i = 0; i < 40; i++) { var wx = fxRnd(i * 13) * TW, wy = fxRnd(i * 17 + 2) * TH; c.strokeStyle = ink + '.22)'; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 4, wy - 3, wx + 8, wy); c.quadraticCurveTo(wx + 12, wy + 3, wx + 16, wy); c.stroke(); }
      c.strokeStyle = ink + '.5)'; c.lineWidth = 1.6; [[60, 150], [84, 152], [108, 150]].forEach(function (q, n) { c.beginPath(); c.arc(q[0], q[1], 10, Math.PI, 0); c.stroke(); }); c.beginPath(); c.moveTo(118, 150); c.quadraticCurveTo(130, 136, 138, 142); c.stroke(); c.fillStyle = ink + '.6)'; c.beginPath(); c.arc(134, 142, 1.6, 0, FX_TAU); c.fill();
      c.beginPath(); c.moveTo(660, 120); c.lineTo(700, 120); c.lineTo(694, 130); c.lineTo(666, 130); c.closePath(); c.moveTo(680, 120); c.lineTo(680, 92); c.moveTo(682, 96); c.quadraticCurveTo(696, 106, 682, 116); c.stroke();
      c.save(); c.translate(880, 640); c.strokeStyle = ink + '.6)'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, 46, 0, FX_TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 40, 0, FX_TAU); c.stroke();
      for (i = 0; i < 8; i++) { var pa = i / 8 * FX_TAU - Math.PI / 2, L = i % 2 ? 26 : 44; c.fillStyle = i % 2 ? ink + '.3)' : ink + '.55)'; c.beginPath(); c.moveTo(Math.cos(pa) * L, Math.sin(pa) * L); c.lineTo(Math.cos(pa + 0.4) * 9, Math.sin(pa + 0.4) * 9); c.lineTo(0, 0); c.lineTo(Math.cos(pa - 0.4) * 9, Math.sin(pa - 0.4) * 9); c.closePath(); c.fill(); }
      c.fillStyle = ink + '.8)'; c.font = '700 13px ' + CP_SERIF; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('N', 0, -56); c.restore();
      c.fillStyle = ink + '.6)'; c.font = 'italic 13px ' + CP_SERIF; c.textAlign = 'center'; NAMES.forEach(function (q) { c.fillText(q[0], q[1], q[2]); });
      c.strokeStyle = ink + '.65)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(780, 350); c.lineTo(800, 370); c.moveTo(800, 350); c.lineTo(780, 370); c.stroke();
      var B = mkc(), e = B[1];
      e.fillStyle = sec + '.85)'; e.font = '700 15px ' + CP_SERIF; e.textAlign = 'center'; e.textBaseline = 'middle'; SECRET.forEach(function (q) { e.save(); e.translate(q[1], q[2]); e.rotate(q[3]); e.fillText(q[0], 0, 0); e.restore(); });
      e.strokeStyle = sec + '.7)'; e.lineWidth = 1.6; e.setLineDash([2, 5]); e.beginPath(); e.moveTo(330, 520); e.bezierCurveTo(400, 600, 520, 560, 560, 650); e.stroke(); e.setLineDash([]);
      [[120, 470], [700, 640], [440, 180]].forEach(function (q) { e.beginPath(); e.arc(q[0], q[1], 7, 0, FX_TAU); e.moveTo(q[0] + 7, q[1]); e.lineTo(q[0] + 26, q[1]); e.moveTo(q[0] + 20, q[1]); e.lineTo(q[0] + 20, q[1] + 6); e.moveTo(q[0] + 25, q[1]); e.lineTo(q[0] + 25, q[1] + 7); e.stroke(); });
      [[200, 250], [900, 480], [600, 230]].forEach(function (q) { e.beginPath(); for (var k = 0; k <= 10; k++) { var a2 = k / 10 * FX_TAU - Math.PI / 2, r2 = k % 2 ? 4 : 10; if (k) { e.lineTo(q[0] + Math.cos(a2) * r2, q[1] + Math.sin(a2) * r2); } else { e.moveTo(q[0] + Math.cos(a2) * r2, q[1] + Math.sin(a2) * r2); } } e.stroke(); });
      M = A[0]; S = B[0];
    }
    function tiles(c, img, ox, oy, W, H) { var x0 = ((ox % TW) + TW) % TW - TW, y0 = ((oy % TH) + TH) % TH - TH; for (var x = x0; x < W; x += TW) { for (var y = y0; y < H; y += TH) { c.drawImage(img, x, y, TW, TH); } } }
    return function (t) {
      var c = s.ctx, D = bcDark(s), W = s.w, H = s.h, u = Math.min(1.3, Math.max(0.8, W / 600)), key = D ? 'd' : 'l', j;
      if (key !== mk) { render(D); mk = key; }
      var ox = -t * 5, oy = Math.sin(t * 0.03) * 40;
      c.globalAlpha = D ? 0.85 : 0.75; tiles(c, M, ox, oy, W, H); c.globalAlpha = 1;
      /* the trail, from landmark to landmark, on the copy of the map nearest the middle of the page */
      var cyc = t % 26, prog = Math.min(1, cyc / 18) * (TR.length - 1), bx = ((W / 2 - ox - TW / 2) / TW), by = ((H / 2 - oy - TH / 2) / TH), tx0 = ox + Math.round(bx) * TW, ty0 = oy + Math.round(by) * TH, fade = cyc > 24 ? (26 - cyc) / 2 : 1;
      c.strokeStyle = D ? 'rgba(253,186,116,' + (0.85 * fade).toFixed(3) + ')' : 'rgba(185,28,28,' + (0.7 * fade).toFixed(3) + ')'; c.lineWidth = 2.2; c.setLineDash([6, 6]); c.beginPath();
      for (j = 0; j <= Math.floor(prog); j++) { var p = TR[j]; if (j) { c.lineTo(tx0 + p[0], ty0 + p[1]); } else { c.moveTo(tx0 + p[0], ty0 + p[1]); } }
      if (prog < TR.length - 1) { var a = TR[Math.floor(prog)], b = TR[Math.floor(prog) + 1], f = prog - Math.floor(prog); c.lineTo(tx0 + a[0] + (b[0] - a[0]) * f, ty0 + a[1] + (b[1] - a[1]) * f); }
      c.stroke(); c.setLineDash([]);
      var got = fxEnv(cyc, 18, 18.6, 24, 26), ex = tx0 + 790, ey = ty0 + 360;
      if (got > 0) { c.globalCompositeOperation = D ? 'lighter' : 'source-over'; if (D) { fxGlow(c, '253,224,71', ex, ey - 14, 46, 0.6 * got); } c.globalCompositeOperation = 'source-over'; c.globalAlpha = got; c.fillStyle = '#7C4A1E'; c.fillRect(ex - 14, ey - 12, 28, 16); c.fillStyle = '#FACC15'; c.fillRect(ex - 14, ey - 6, 28, 2.4); c.save(); c.translate(ex, ey - 12); c.rotate(-0.9 * Math.min(1, (cyc - 18.2) / 0.5)); c.fillStyle = '#8B5A2B'; c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.quadraticCurveTo(14, -10, 0, -10); c.quadraticCurveTo(-14, -10, -14, 0); c.fill(); c.restore(); if (cyc > 18.4) { c.globalCompositeOperation = D ? 'lighter' : 'source-over'; for (j = 0; j < 4; j++) { fxStar4(c, ex - 10 + j * 7, ey - 20 - Math.abs(Math.sin(t * 3 + j)) * 10, 5, got, '#FDE047'); } } c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      /* the magnifying glass: the map twice as large inside it, with the secret ink */
      var lx = W * 0.5 + W * 0.34 * Math.sin(t * 0.07), ly = H * 0.55 + H * 0.26 * Math.sin(t * 0.11 + 1), R = 74 * u, z = 1.7;
      c.save(); c.beginPath(); c.arc(lx, ly, R, 0, FX_TAU); c.clip();
      c.fillStyle = D ? 'rgba(15,23,42,.55)' : 'rgba(255,251,235,.75)'; c.fillRect(lx - R, ly - R, R * 2, R * 2);
      c.translate(lx, ly); c.scale(z, z); c.translate(-lx, -ly); tiles(c, M, ox, oy, W * 2, H * 2); c.globalAlpha = 0.95; tiles(c, S, ox, oy, W * 2, H * 2); c.globalAlpha = 1;
      c.restore();
      c.strokeStyle = D ? '#C9A14A' : '#8B6A2E'; c.lineWidth = 5 * u; c.beginPath(); c.arc(lx, ly, R, 0, FX_TAU); c.stroke(); c.strokeStyle = D ? 'rgba(255,240,200,.5)' : 'rgba(255,255,255,.8)'; c.lineWidth = 1.5; c.beginPath(); c.arc(lx, ly, R - 3 * u, 0, FX_TAU); c.stroke();
      c.lineCap = 'round'; c.strokeStyle = D ? '#5B3A1E' : '#6B4423'; c.lineWidth = 10 * u; c.beginPath(); c.moveTo(lx + R * 0.72, ly + R * 0.72); c.lineTo(lx + R * 1.45, ly + R * 1.45); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3 * u; c.beginPath(); c.arc(lx, ly, R * 0.75, -2.6, -1.9); c.stroke(); c.globalCompositeOperation = 'source-over'; c.lineCap = 'butt';
    };
  };

  /* Tunnel book (Pop-Up, Mythic): the page becomes a tunnel book, seven sheets of cut paper one behind another, each with an
     opening smaller than the last: a curtain, leaves, cliffs, hills, rooftops, mountains, and the sky at the far end. Your view
     drifts slowly, so the near sheets slide more than the far ones and the tunnel has real depth. Now and then a paper bird
     flies out of the far end toward you, and the light at the end of the tunnel is something different each time: the sun,
     the moon, a lantern, an open door */
  FX_PAPER.tunnel = function (s) {
    var N = 6, OF = {};
    var LT = ['#F3E8D6', '#C9E3B3', '#B8C7D9', '#A8D29A', '#E6C8A8', '#C7D2FE'], DK = ['#2A2140', '#1C3A2E', '#252E44', '#1E3B2A', '#3A2A20', '#1E2550'];
    function opening(c, i, cx, cy, hw, hh, t) {
      var j, x, y;
      if (i === 0) { c.moveTo(cx - hw, cy + hh); c.lineTo(cx - hw, cy - hh * 0.7); c.quadraticCurveTo(cx - hw * 0.6, cy - hh * 0.62, cx - hw * 0.4, cy - hh * 0.85); for (j = 0; j <= 8; j++) { x = cx - hw * 0.4 + hw * 0.8 * j / 8; c.quadraticCurveTo(x - hw * 0.05, cy - hh * 0.93, x, cy - hh * 0.85); } c.quadraticCurveTo(cx + hw * 0.6, cy - hh * 0.62, cx + hw, cy - hh * 0.7); c.lineTo(cx + hw, cy + hh); c.closePath(); return; }
      if (i === 1) { c.moveTo(cx - hw, cy + hh); for (j = 0; j <= 14; j++) { var a = Math.PI + j / 14 * Math.PI; x = cx + Math.cos(a) * hw; y = cy + Math.sin(a) * hh * 1.05; c.lineTo(x + (j % 2 ? 8 : -6), y + (j % 2 ? 10 : -4)); } c.lineTo(cx + hw, cy + hh); c.closePath(); return; }
      if (i === 2) { c.moveTo(cx - hw, cy + hh); c.lineTo(cx - hw * 0.9, cy - hh * 0.2); c.lineTo(cx - hw * 0.7, cy - hh * 0.5); c.lineTo(cx - hw * 0.8, cy - hh * 0.9); c.lineTo(cx + hw * 0.7, cy - hh * 0.95); c.lineTo(cx + hw * 0.85, cy - hh * 0.4); c.lineTo(cx + hw * 0.75, cy + hh * 0.1); c.lineTo(cx + hw, cy + hh); c.closePath(); return; }
      c.rect(cx - hw, cy - hh, hw * 2, hh * 2);
    }
    function edge(c, i, cx, cy, hw, hh, W, H) {
      var j, x;
      if (i === 3) { c.moveTo(-10, H + 10); c.lineTo(-10, cy + hh * 0.55); for (x = -10; x <= W + 10; x += 12) { c.lineTo(x, cy + hh * 0.55 - 26 * (0.5 + 0.5 * Math.sin(x * 0.015 + 1))); } c.lineTo(W + 10, H + 10); c.closePath(); }
      if (i === 4) { c.moveTo(-10, H + 10); c.lineTo(-10, cy + hh * 0.7); for (x = -10, j = 0; x <= W + 10; j++) { var w = 26 + fxRnd(j * 3) * 20, h = 18 + fxRnd(j * 7) * 26; c.lineTo(x, cy + hh * 0.7 - h); c.lineTo(x + w * 0.5, cy + hh * 0.7 - h - 12); c.lineTo(x + w, cy + hh * 0.7 - h); x += w; } c.lineTo(W + 10, cy + hh * 0.7); c.lineTo(W + 10, H + 10); c.closePath(); }
      if (i === 5) { c.moveTo(-10, H + 10); c.lineTo(-10, cy + hh * 0.3); for (x = -10, j = 0; x <= W + 10; j++) { c.lineTo(x, cy + hh * 0.3 - (j % 2 ? 70 : 20) * (0.6 + 0.4 * fxRnd(j))); x += 40 + fxRnd(j + 4) * 40; } c.lineTo(W + 10, cy + hh * 0.3); c.lineTo(W + 10, H + 10); c.closePath(); }
    }
    return function (t, dt) {
      var c = cpOff(s, OF), D = bcDark(s), W = s.w, H = s.h, A = D ? 0.8 : 0.5, al = 1, vx = Math.sin(t * 0.13) * 34, vy = Math.sin(t * 0.09 + 1) * 18, i, cyc = Math.floor(t / 24), lt = cyc % 4, j;
      /* the far end: the sky, and its light */
      var fcx = W / 2 - vx * 0.15, fcy = H * 0.45 - vy * 0.15, sk = c.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, D ? '#0F1636' : '#DCEBFA'); sk.addColorStop(1, D ? '#2A1F4A' : '#FDE9D2'); c.globalAlpha = al; c.fillStyle = sk; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = D ? 'lighter' : 'source-over'; c.globalAlpha = 1;
      var lc = ['253,224,71', '226,232,240', '251,146,60', '255,247,214'][lt]; fxGlow(c, lc, fcx, fcy, Math.min(W, H) * 0.3, D ? 0.45 : 0.35);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = al;
      if (lt === 0) { c.fillStyle = '#FDE68A'; c.beginPath(); c.arc(fcx, fcy, 26, 0, FX_TAU); c.fill(); }
      else if (lt === 1) { c.fillStyle = '#F1F5F9'; c.beginPath(); c.arc(fcx, fcy, 24, 0, FX_TAU); c.fill(); c.fillStyle = D ? '#1B1B3A' : '#DCEBFA'; c.beginPath(); c.arc(fcx + 9, fcy - 5, 21, 0, FX_TAU); c.fill(); }
      else if (lt === 2) { c.strokeStyle = '#7C2D12'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(fcx, fcy - 40); c.lineTo(fcx, fcy - 18); c.stroke(); c.fillStyle = '#EA580C'; c.beginPath(); c.ellipse(fcx, fcy, 14, 18, 0, 0, FX_TAU); c.fill(); c.fillStyle = '#FDE68A'; c.beginPath(); c.ellipse(fcx, fcy, 7, 12, 0, 0, FX_TAU); c.fill(); }
      else { c.fillStyle = '#7C4A2A'; c.fillRect(fcx - 16, fcy - 30, 32, 52); c.fillStyle = '#FFF7D6'; c.fillRect(fcx - 12, fcy - 26, 24, 48); c.fillStyle = '#7C4A2A'; c.save(); c.translate(fcx - 12, 0); c.scale(0.25 + 0.15 * Math.sin(t), 1); c.fillRect(0, fcy - 26, 24, 48); c.restore(); }
      /* the sheets, far to near: each casts a shadow on the one behind, and slides by its nearness */
      for (i = N - 1; i >= 0; i--) {
        var near = 1 - i / N, cx = W / 2 + vx * near, cy = H * 0.47 + vy * near, hw = W * (0.47 - 0.05 * i), hh = H * (0.44 - 0.045 * i), col = (D ? DK : LT)[i];
        c.save(); c.globalAlpha = al * 0.35; c.fillStyle = '#05070D'; c.translate(6 + i, 5 + i * 0.6); c.beginPath(); c.rect(-20, -20, W + 40, H + 40); opening(c, i, cx, cy, hw, hh, t); c.fill('evenodd'); if (i >= 3) { c.beginPath(); edge(c, i, cx, cy, hw, hh, W, H); c.fill(); } c.restore();
        c.globalAlpha = al * (i >= 3 ? 0.9 : 1); c.fillStyle = col; c.beginPath(); c.rect(-20, -20, W + 40, H + 40); opening(c, i, cx, cy, hw, hh, t); c.fill('evenodd'); if (i >= 3) { c.beginPath(); edge(c, i, cx, cy, hw, hh, W, H); c.fill(); }
        if (i === 4) { c.fillStyle = D ? 'rgba(251,191,36,.8)' : 'rgba(255,255,255,.8)'; for (j = 0; j < 14; j++) { var wx = (fxRnd(j * 5) * W), wy = cy + hh * 0.7 - 10 - fxRnd(j * 9) * 16; c.fillRect(wx, wy, 4, 5); } }
        if (i === 0) { c.fillStyle = D ? '#4C1D35' : '#E9B8C8'; c.globalAlpha = al; [[-1, 0], [1, 0]].forEach(function (q) { var x0 = cx + q[0] * hw; c.beginPath(); c.moveTo(x0, cy - hh); c.quadraticCurveTo(x0 - q[0] * 40, cy, x0 - q[0] * 18 + Math.sin(t * 0.8) * 3, cy + hh); c.lineTo(x0 + q[0] * 30, cy + hh); c.lineTo(x0 + q[0] * 30, cy - hh); c.closePath(); c.fill(); }); c.fillStyle = D ? '#FBBF24' : '#D97706'; for (j = 0; j < 12; j++) { var tx = cx - hw * 0.4 + hw * 0.8 * (j + 0.5) / 12; c.beginPath(); c.moveTo(tx, cy - hh * 0.86); c.lineTo(tx - 3, cy - hh * 0.86 + 9 + Math.sin(t * 2 + j) * 1.5); c.lineTo(tx + 3, cy - hh * 0.86 + 9 + Math.sin(t * 2 + j) * 1.5); c.fill(); } }
        /* the paper bird, flying out from the far end and growing as it passes each sheet */
        var bu = (t % 24) / 6; if (bu < 1 && i === Math.max(0, Math.floor((1 - bu) * N) - 1)) { var bz = 0.3 + bu * bu * 4, bx = fcx + (W * 0.25) * bu + Math.sin(bu * 6) * 20, by = fcy - H * 0.2 * bu, fl = Math.sin(t * 10) * 0.9; c.globalAlpha = Math.min(1, (1 - bu) * 4); c.fillStyle = D ? '#F5F5F4' : '#FFFFFF'; cpPoly(c, [[bx - 12 * bz, by - fl * 8 * bz], [bx, by], [bx + 3 * bz, by + 3 * bz]]); c.fill(); cpPoly(c, [[bx + 12 * bz, by - fl * 8 * bz], [bx, by], [bx - 3 * bz, by + 3 * bz]]); c.fill(); c.fillStyle = 'rgba(0,0,0,.15)'; cpPoly(c, [[bx, by], [bx + 12 * bz, by - fl * 8 * bz], [bx + 3 * bz, by + 3 * bz]]); c.fill(); }
      }
      c.globalAlpha = 1; cpBlit(s, OF, A);
    };
  };

  /* Labyrinth (Radiant): a round maze of six rings, each turning its own way, faint behind the page. A spark of light works its
     way in from outside: it runs along each corridor to the gap in the next ring, waits for the ring to bring it round, and
     slips through. When it reaches the middle the maze blooms with light, and something different appears there each time
     (a star, a key, a crown, a sun, a heart, a moon); then a new maze grows and a new spark sets out */
  FX_PAPER.maze = function (s) {
    var N = 6, PH = [], WV = [], G = [], i, sp = null, bloom = -1, Tr = [], gift = 0, fast = s.opt && s.opt.fast ? s.opt.fast : 1, born = 0;
    function grow(t) { PH = []; WV = []; for (var q = 0; q < N; q++) { PH.push(fxR(0, FX_TAU)); WV.push(fxR(0.05, 0.13) * (q % 2 ? -1 : 1) * fast); } sp = { j: -1, th: fxR(0, FX_TAU), rad: -1, tr: 0 }; bloom = -1; born = t; Tr = []; }
    function ang(q, t) { return PH[q] + WV[q] * (t - born); }
    function wrap(a) { return ((a % FX_TAU) + FX_TAU * 1.5) % FX_TAU - Math.PI; }
    function sym(c, k, x, y, r) { c.beginPath(); var j; if (k === 0) { for (j = 0; j <= 10; j++) { var a = j / 10 * FX_TAU - Math.PI / 2, rr = j % 2 ? r * 0.4 : r; if (j) { c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } else { c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } } } else if (k === 1) { c.arc(x, y - r * 0.45, r * 0.38, 0, FX_TAU); c.moveTo(x, y - r * 0.07); c.lineTo(x, y + r); c.moveTo(x, y + r * 0.6); c.lineTo(x + r * 0.35, y + r * 0.6); c.moveTo(x, y + r * 0.85); c.lineTo(x + r * 0.3, y + r * 0.85); } else if (k === 2) { c.moveTo(x - r, y + r * 0.5); c.lineTo(x - r, y - r * 0.4); c.lineTo(x - r * 0.5, y + r * 0.05); c.lineTo(x, y - r * 0.6); c.lineTo(x + r * 0.5, y + r * 0.05); c.lineTo(x + r, y - r * 0.4); c.lineTo(x + r, y + r * 0.5); c.closePath(); } else if (k === 3) { c.arc(x, y, r * 0.45, 0, FX_TAU); for (j = 0; j < 8; j++) { var a2 = j / 8 * FX_TAU; c.moveTo(x + Math.cos(a2) * r * 0.62, y + Math.sin(a2) * r * 0.62); c.lineTo(x + Math.cos(a2) * r, y + Math.sin(a2) * r); } } else if (k === 4) { c.moveTo(x, y + r * 0.8); c.bezierCurveTo(x - r * 1.3, y - r * 0.1, x - r * 0.5, y - r * 1.0, x, y - r * 0.35); c.bezierCurveTo(x + r * 0.5, y - r * 1.0, x + r * 1.3, y - r * 0.1, x, y + r * 0.8); } else { c.arc(x, y, r * 0.8, 0.6, FX_TAU - 0.6); c.quadraticCurveTo(x + r * 0.1, y, x + Math.cos(0.6) * r * 0.8, y + Math.sin(0.6) * r * 0.8); } }
    return function (t, dt) {
      var c = s.ctx, D = bcDark(s), W = s.w, H = s.h, cx = W * 0.5, cy = H * 0.52, Rm = Math.min(W, H) * 0.46, q, j;
      if (!sp) { grow(t); }
      var r = []; for (q = 0; q < N; q++) { r.push(Rm * (1 - q / (N + 1))); }
      var rho = function (j2) { return j2 < 0 ? Rm * 1.08 : j2 >= N - 1 ? 0 : (r[j2] + r[j2 + 1]) / 2; };
      /* the spark: along its corridor to the next gap, then through when the gap comes round */
      if (bloom < 0) {
        var nx = sp.j + 1, ga = ang(nx, t), gw = 18 / r[nx];
        if (sp.rad < 0) { var dlt = wrap(ga - sp.th), v = 120 * fast / Math.max(40, rho(sp.j)); if (Math.abs(dlt) < gw * 0.5) { sp.rad = 0; } else { sp.th += Math.max(-v * dt, Math.min(v * dt, dlt)); } }
        else { sp.rad += dt * 2.4 * fast; sp.th = ga; if (sp.rad >= 1) { sp.j = nx; sp.rad = -1; if (sp.j >= N - 1) { bloom = 0; gift = (gift + 1) % 6; } } }
      } else { bloom += dt; if (bloom > 4.5) { grow(t); } }
      var pr = sp.rad < 0 ? rho(sp.j) : rho(sp.j) + (rho(sp.j + 1) - rho(sp.j)) * fxEase(sp.rad), px = cx + Math.cos(sp.th) * pr, py = cy + Math.sin(sp.th) * pr;
      if (bloom < 0) { Tr.push([px, py]); if (Tr.length > 46) { Tr.shift(); } }
      var g = D ? 'rgba(165,180,252,' : 'rgba(79,70,229,', al = D ? 1 : 0.85, bl = bloom >= 0 ? Math.sin(Math.min(1, bloom / 1.2) * Math.PI / 2) * (1 - Math.max(0, (bloom - 3.6) / 0.9)) : 0, grown = Math.min(1, (t - born) / 1.5);
      c.globalCompositeOperation = D ? 'lighter' : 'source-over';
      if (D) { fxGlow(c, '129,140,248', cx, cy, Rm * 1.2, 0.12 + 0.25 * bl); }
      for (q = 0; q < N; q++) {
        var a0 = ang(q, t), gw2 = 18 / r[q], rr = r[q] * (0.9 + 0.1 * grown);
        c.strokeStyle = g + ((D ? 0.22 : 0.12) * al * grown).toFixed(3) + ')'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, rr, a0 + gw2, a0 + FX_TAU - gw2); c.stroke();
        c.strokeStyle = g + ((D ? 0.7 : 0.4) * al * grown + 0.3 * bl).toFixed(3) + ')'; c.lineWidth = 1.6; c.beginPath(); c.arc(cx, cy, rr, a0 + gw2, a0 + FX_TAU - gw2); c.stroke();
        for (j = 0; j < 3; j++) { var wa = a0 + Math.PI * 0.5 + j * 2.1; c.beginPath(); c.moveTo(cx + Math.cos(wa) * rr, cy + Math.sin(wa) * rr); c.lineTo(cx + Math.cos(wa) * (rr - (Rm / (N + 1)) * 0.55), cy + Math.sin(wa) * (rr - (Rm / (N + 1)) * 0.55)); c.stroke(); }
        for (j = 0; j < 24; j++) { var ta = a0 + j / 24 * FX_TAU; if (Math.abs(wrap(ta - a0)) < gw2 * 1.4) { continue; } c.beginPath(); c.moveTo(cx + Math.cos(ta) * (rr + 3), cy + Math.sin(ta) * (rr + 3)); c.lineTo(cx + Math.cos(ta) * (rr + (j % 3 ? 6 : 9)), cy + Math.sin(ta) * (rr + (j % 3 ? 6 : 9))); c.stroke(); }
        [a0 + gw2, a0 - gw2].forEach(function (e) { if (D) { fxGlow(c, '199,210,254', cx + Math.cos(e) * rr, cy + Math.sin(e) * rr, 5, 0.6 * grown); } else { c.fillStyle = g + '.5)'; c.beginPath(); c.arc(cx + Math.cos(e) * rr, cy + Math.sin(e) * rr, 2.2, 0, FX_TAU); c.fill(); } });
      }
      /* the spark and its trail */
      if (Tr.length > 1) { c.lineCap = 'round'; for (j = 1; j < Tr.length; j++) { c.strokeStyle = D ? 'rgba(253,224,71,' + (j / Tr.length * 0.7).toFixed(3) + ')' : 'rgba(217,119,6,' + (j / Tr.length * 0.6).toFixed(3) + ')'; c.lineWidth = 3 * j / Tr.length; c.beginPath(); c.moveTo(Tr[j - 1][0], Tr[j - 1][1]); c.lineTo(Tr[j][0], Tr[j][1]); c.stroke(); } }
      if (bloom < 0) { if (D) { fxGlow(c, '253,224,71', px, py, 16, 0.9); fxGlow(c, '255,255,255', px, py, 4, 1); } else { c.fillStyle = '#D97706'; c.beginPath(); c.arc(px, py, 4, 0, FX_TAU); c.fill(); } }
      /* the middle: a gem, and when the spark arrives, a bloom and this maze's gift */
      var cr = Rm / (N + 1) * 0.6;
      if (D) { fxGlow(c, '253,224,71', cx, cy, cr * (1.4 + 4 * bl), 0.35 + 0.6 * bl); for (j = 0; j < 12 && bl > 0; j++) { lkBeam(c, cx, cy, j / 12 * FX_TAU + t * 0.2, Rm * 1.3 * bl, 0.05, '253,224,71', 0.2 * bl); } }
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = D ? 'rgba(254,240,138,' + (0.6 + 0.4 * bl).toFixed(3) + ')' : 'rgba(180,83,9,' + (0.4 + 0.4 * bl).toFixed(3) + ')'; c.lineWidth = 2;
      if (bl > 0.05) { c.globalAlpha = bl; sym(c, gift, cx, cy, cr * (0.7 + 0.5 * bl)); c.stroke(); if (gift !== 1) { c.fillStyle = D ? 'rgba(254,240,138,.35)' : 'rgba(251,191,36,.35)'; c.fill(); } c.globalAlpha = 1; }
      else { c.beginPath(); for (j = 0; j < 4; j++) { var da = j / 4 * FX_TAU + t * 0.5; c.lineTo(cx + Math.cos(da) * cr * 0.5, cy + Math.sin(da) * cr * 0.5); } c.closePath(); c.stroke(); }
      c.globalCompositeOperation = 'source-over';
    };
  };

  /* ---------- living themes: a scene behind the page in the theme's own colors ---------- */
  /* Crossword (Cipher, Common, light): newsprint, with a strip of crossword down each margin. A pencil fills in the answers one
     letter at a time, now and then rubbing one out and writing it again, and a clue is written along the foot. The circled
     squares spell the SAT word of the day (the same one the Cryptex spells), and when the last one is in they light red and
     the clue is answered */
  FX_LIVING['prize-crossword'] = function (s) {
    var Cr = [], i;
    for (i = 0; i < 14; i++) { Cr.push({ x: Math.random(), y: Math.random(), r: fxR(0, 6) }); }
    function strips(H, cell) {
      var W = cpWord(), d = cpDay(), rows = Math.floor((H - 40) / cell), L = [], R = [], j, n = 0;
      function fill(col, secret, k0) { var r = 0, k = k0; while (r < rows) { var w = secret && r > rows * 0.25 && !col.sec ? W[0] : CP_WORDS[(d * 3 + k * 7) % CP_WORDS.length][0]; k++; if (r + w.length > rows) { break; } var sec = w === W[0] && secret && !col.sec; if (sec) { col.sec = 1; } for (j = 0; j < w.length; j++) { col.push({ ch: w.charAt(j), circ: sec, ord: n++ }); r++; } if (r < rows) { col.push(null); r++; } } while (col.length < rows) { col.push(null); } }
      fill(L, false, 1); fill(R, true, 5);
      return { L: L, R: R, rows: rows, n: n, word: W };
    }
    var G = null, key = '';
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, cell = W < 500 ? 15 : 22, k2 = H + 'x' + cell; if (k2 !== key) { G = strips(H, cell); key = k2; }
      var C = 42, cyc = (t + (FX_REDUCE ? 34 : 0)) % C, per = 30 / G.n, done = cyc / per, erase = cyc > 38 ? (cyc - 38) / 4 : 0, j, cx;
      /* the coffee ring and the newsprint's faint columns */
      c.strokeStyle = 'rgba(120,80,40,.12)'; c.lineWidth = 5; c.beginPath(); c.arc(W - 70, H - 120, 34, 0.3, FX_TAU - 0.5); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.arc(W - 72, H - 118, 30, 1, FX_TAU - 0.2); c.stroke();
      c.strokeStyle = 'rgba(26,26,26,.05)'; c.lineWidth = 1; for (j = 0; j < 30; j++) { var ly = 30 + j * 9; if (ly > 300) { break; } c.beginPath(); c.moveTo(W * 0.5 - 60, ly); c.lineTo(W * 0.5 + 60, ly); c.stroke(); }
      var pen = null;
      [['L', W < 500 ? 4 : 10], ['R', W - (W < 500 ? 4 : 10) - cell]].forEach(function (q) {
        var col = G[q[0]], x = q[1], y0 = 24;
        col.forEach(function (sq, r) {
          var y = y0 + r * cell;
          if (!sq) { c.fillStyle = 'rgba(26,26,26,.55)'; c.fillRect(x, y, cell, cell); return; }
          c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x, y, cell, cell); c.strokeStyle = 'rgba(26,26,26,.45)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
          if (sq.circ) { var hot = done > G.n ? Math.min(1, (done - G.n) * per / 1.2) : 0; c.strokeStyle = hot > 0 ? 'rgba(185,28,28,' + (0.5 + 0.5 * hot) + ')' : 'rgba(26,26,26,.4)'; c.lineWidth = hot > 0 ? 1.6 : 1; c.beginPath(); c.arc(x + cell / 2, y + cell / 2, cell * 0.42, 0, FX_TAU); c.stroke(); }
          var u = done - sq.ord, wrong = (sq.ord * 7 + Math.floor(t / C)) % 11 === 3;
          if (u > 0) { var a = Math.min(1, u * 2) * (1 - erase), ch = sq.ch; if (wrong && u < 1.6) { ch = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt((sq.ord * 5 + 3) % 26); if (u > 1.1) { a *= 1 - (u - 1.1) / 0.5; } } if (wrong && u >= 1.6) { a = Math.min(1, (u - 1.6) * 2) * (1 - erase); } c.globalAlpha = a; c.fillStyle = sq.circ && done > G.n ? '#B91C1C' : '#2B2B28'; c.font = '600 ' + Math.round(cell * 0.62) + 'px ' + FX_MONO; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, x + cell / 2, y + cell / 2 + 1); c.globalAlpha = 1; if (u < 1 || (wrong && u < 2.1)) { pen = [x + cell * 0.7, y + cell * 0.7, wrong && u > 1.1 && u < 1.6]; } }
        });
      });
      /* the pencil, writing (or turned round to rub out), and the crumbs */
      if (pen && !erase) { var px = pen[0] + Math.sin(t * 30) * 1.2, py = pen[1] + Math.cos(t * 23) * 1.2, rub = pen[2]; c.save(); c.translate(px, py); c.rotate(rub ? -2.4 : 0.75); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(-3, 4, 7, 46); c.fillStyle = '#FACC15'; c.fillRect(-3.5, 6, 7, 40); c.fillStyle = '#EAB308'; c.fillRect(1.2, 6, 2.3, 40); c.fillStyle = '#E5C29F'; cpPoly(c, [[-3.5, 6], [3.5, 6], [0, -2]]); c.fill(); c.fillStyle = '#2B2B28'; cpPoly(c, [[-1.2, 1.2], [1.2, 1.2], [0, -2]]); c.fill(); c.fillStyle = '#A1A1AA'; c.fillRect(-3.5, 46, 7, 4); c.fillStyle = '#F9A8D4'; c.fillRect(-3.5, 50, 7, 5); c.restore(); if (rub) { Cr.forEach(function (q, m) { c.fillStyle = 'rgba(249,168,212,.6)'; c.fillRect(px - 10 + q.x * 20, py + 6 + q.y * 10, 2, 1.4); }); } }
      /* the clue along the foot, and the answer when the circled squares are in */
      var clue = 'Circled squares: ' + G.word[1] + ' (5)', ans = done > G.n ? Math.min(1, (done - G.n) * per / 1.5) * (1 - erase) : 0;
      /* on a narrow screen the clue shrinks to fit, and the answer moves up a line when it would touch the clue */
      cx = W < 500 ? 30 : 48; c.font = 'italic 13px ' + CP_SERIF; var cw = c.measureText(clue).width, fs = Math.max(9, Math.min(13, Math.floor(13 * (W - 2 * cx) / cw)));
      if (fs < 13) { c.font = 'italic ' + fs + 'px ' + CP_SERIF; cw = c.measureText(clue).width; }
      var ay = cx + cw + 12 > W - cx - 82 ? H - 44 : H - 18;
      c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(43,43,40,' + (0.55 * (1 - erase)).toFixed(3) + ')';
      c.fillText(clue.slice(0, Math.min(clue.length, Math.floor(cyc * 9))), cx, H - 18);
      if (ans > 0) { c.globalAlpha = ans; c.fillStyle = '#B91C1C'; c.font = '700 13px ' + FX_MONO; c.textAlign = 'right'; c.fillText(G.word[0].split('').join(' '), W - cx, ay); c.strokeStyle = '#B91C1C'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(W - cx - 36, ay, 46, 11, -0.04, 0, FX_TAU); c.stroke(); c.globalAlpha = 1; }
    };
  };
  FX_LIVE_THEMES['prize-crossword'] = 1;

  /* Cut paper (Pop-Up, Rare, light): construction paper round the edges. Paper vines climb both sides putting out leaves, hills
     in three layers along the foot with flowers that fold up and lie down in a wave, clouds sliding in their slots, a ladybug
     walking a stem and a paper butterfly. The sun is on a paper tab that keeps your own time: it rises on the left in the
     morning, crosses the top at midday and sets on the right, and after dark a paper moon takes its place */
  FX_LIVING['prize-cutpaper'] = function (s) {
    var OF = {}, FL = [], i;
    for (i = 0; i < 24; i++) { FL.push({ x: i / 24 + fxR(-0.01, 0.01), h: fxR(28, 48), c: ['#F472B6', '#FACC15', '#A78BFA', '#FB923C', '#60A5FA'][i % 5], row: i % 2 }); }
    function hills(W, H, y0, amp, f, ph) { return function (c) { c.beginPath(); c.moveTo(-10, H + 10); for (var x = -10; x <= W + 10; x += 12) { c.lineTo(x, y0 - amp * (0.5 + 0.5 * Math.sin(x * f + ph))); } c.lineTo(W + 10, H + 10); c.closePath(); }; }
    return function (t, dt) {
      var c = cpOff(s, OF), W = s.w, H = s.h, u = Math.min(1.3, Math.max(0.8, W / 600)), hr = cpHour(), day = hr >= 6 && hr < 20, sp = day ? (hr - 6) / 14 : ((hr + 4) % 24) / 10, j;
      /* the sun or moon on its tab, sliding along a slot across the top */
      var sx = 40 + (W - 80) * sp, sy = 60 * u + Math.pow((sp - 0.5) * 2, 2) * 40 * u;
      c.strokeStyle = 'rgba(120,80,40,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(30, sy + 30 * u); c.lineTo(W - 30, sy + 30 * u); c.stroke();
      c.fillStyle = 'rgba(80,40,10,.18)'; c.beginPath(); c.arc(sx + 4, sy + 4, 26 * u, 0, FX_TAU); c.fill();
      if (day) { c.fillStyle = '#FDBA4D'; c.beginPath(); for (j = 0; j < 22; j++) { var ra = t * 0.3 + j / 22 * FX_TAU, rr = (j % 2 ? 22 : 30) * u; c.lineTo(sx + Math.cos(ra) * rr, sy + Math.sin(ra) * rr); } c.closePath(); c.fill(); c.fillStyle = '#FDE047'; c.beginPath(); c.arc(sx, sy, 19 * u, 0, FX_TAU); c.fill(); }
      else { c.fillStyle = '#E0E7FF'; c.beginPath(); c.arc(sx, sy, 19 * u, 0, FX_TAU); c.fill(); c.fillStyle = '#FFF8EE'; c.beginPath(); c.arc(sx + 8 * u, sy - 5 * u, 16 * u, 0, FX_TAU); c.fill(); }
      [[0.2, 0.12], [0.62, 0.2]].forEach(function (q, m) { var cx = W * q[0] + Math.sin(t * 0.25 + m * 2) * 30, cy = H * q[1] + 40; c.fillStyle = 'rgba(80,40,10,.15)'; c.beginPath(); c.ellipse(cx + 4, cy + 4, 34 * u, 11 * u, 0, 0, FX_TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.ellipse(cx, cy, 34 * u, 11 * u, 0, 0, FX_TAU); c.arc(cx - 10 * u, cy - 7 * u, 12 * u, 0, FX_TAU); c.arc(cx + 10 * u, cy - 8 * u, 15 * u, 0, FX_TAU); c.fill(); });
      /* vines up both sides */
      [8, W - 8].forEach(function (vx, sd) {
        c.strokeStyle = '#3F8F45'; c.lineWidth = 3.4; c.beginPath(); for (j = H; j > H * 0.25; j -= 8) { var x = vx + Math.sin(j * 0.03 + sd * 2) * 5; if (j === H) { c.moveTo(x, j); } else { c.lineTo(x, j); } } c.stroke();
        for (j = 0; j < 9; j++) { var ly = H - 60 - j * (H * 0.6 / 9), lx = vx + Math.sin(ly * 0.03 + sd * 2) * 5, side = (j % 2 ? 1 : -1) * (sd ? -1 : 1), sw = Math.sin(t * 1.2 + j) * 0.12; c.save(); c.translate(lx, ly); c.rotate(side * 0.9 + sw - (sd ? Math.PI : 0) * 0); c.fillStyle = 'rgba(80,40,10,.15)'; c.beginPath(); c.ellipse(12, 3, 11, 5, 0, 0, FX_TAU); c.fill(); c.fillStyle = j % 3 ? '#5FA85A' : '#7FBF7A'; c.beginPath(); c.ellipse(10, 0, 11, 5, 0, 0, FX_TAU); c.fill(); c.restore(); }
      });
      /* three rows of hills, the flowers on the middle and front rows folding up and down in a wave */
      [[H - 70 * u, 26 * u, 0.012, 1, '#9DD18B'], [H - 44 * u, 22 * u, 0.02, 3, '#6DB86A'], [H - 20 * u, 14 * u, 0.03, 5, '#4F9A50']].forEach(function (L, n) {
        var p = hills(W, H, L[0], L[1], L[2], L[3]);
        c.save(); c.translate(6, 4); c.fillStyle = 'rgba(30,20,10,.16)'; p(c); c.fill(); c.restore(); c.fillStyle = L[4]; p(c); c.fill();
        if (n > 0) { FL.forEach(function (f, m) { if (f.row !== n - 1) { return; } var x = f.x * W, base = L[0] - L[1] * (0.5 + 0.5 * Math.sin(x * L[2] + L[3])) + 4, up = Math.max(0, Math.sin(t * 0.7 - f.x * 9 + n)), hgt = f.h * u * (0.25 + 0.75 * up), hy = base - hgt;
          c.strokeStyle = '#3F8F45'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x, base); c.lineTo(x, hy); c.stroke(); var r = (4 + 6 * up) * u; c.fillStyle = 'rgba(30,20,10,.15)'; c.beginPath(); c.arc(x + 3, hy + 3, r + 2, 0, FX_TAU); c.fill(); c.fillStyle = f.c; c.beginPath(); for (j = 0; j < 5; j++) { var pa = j / 5 * FX_TAU + m; c.moveTo(x, hy); c.arc(x + Math.cos(pa) * r * 0.7, hy + Math.sin(pa) * r * 0.7, r * 0.55, 0, FX_TAU); } c.fill(); c.fillStyle = '#FEF3C7'; c.beginPath(); c.arc(x, hy, r * 0.35, 0, FX_TAU); c.fill(); }); }
      });
      /* a ladybug walking up the left vine, and a butterfly */
      var lb = (t * 0.04) % 1, lby = H - 40 - lb * H * 0.6, lbx = 8 + Math.sin(lby * 0.03) * 5; c.fillStyle = '#DC2626'; c.beginPath(); c.arc(lbx, lby, 4.4, 0, FX_TAU); c.fill(); c.fillStyle = '#111111'; c.beginPath(); c.arc(lbx, lby - 4, 2.2, 0, FX_TAU); c.fill(); c.fillRect(lbx - 0.5, lby - 3, 1, 7); c.beginPath(); c.arc(lbx - 2, lby + 1, 0.9, 0, FX_TAU); c.arc(lbx + 2, lby + 1.6, 0.9, 0, FX_TAU); c.fill();
      var bx = W * 0.5 + Math.sin(t * 0.21) * W * 0.4, by = H * 0.62 + Math.sin(t * 0.37) * 60, fl = Math.abs(Math.sin(t * 9)); c.fillStyle = '#F472B6'; c.beginPath(); c.ellipse(bx - 6 * fl, by, 7 * fl + 0.5, 8, 0.3, 0, FX_TAU); c.ellipse(bx + 6 * fl, by, 7 * fl + 0.5, 8, -0.3, 0, FX_TAU); c.fill(); c.fillStyle = '#831843'; c.fillRect(bx - 1, by - 6, 2, 12);
      cpBlit(s, OF, 0.9);
    };
  };
  FX_LIVE_THEMES['prize-cutpaper'] = 1;

  /* Darkroom (Cipher, Epic, dark): a photographer's darkroom under a red safelight. Prints hang from a line across the top by
     their pegs, swaying, dripping into a tray below, and each one slowly develops out of white into a picture: a key, a map,
     a cat, a moon, a door left open, footprints, an owl. Now and then a print shows something it should not. A timer ticks in
     the corner and the tray ripples where a fresh print lies in it */
  FX_LIVING['prize-darkroom'] = function (s) {
    var Dr = [], o = {}, i;
    function pic(c, k, w, h, a) {
      c.globalAlpha = a; c.fillStyle = '#1A0E0A'; c.strokeStyle = '#1A0E0A'; c.lineWidth = 2; var x = w / 2, y = h / 2, j;
      if (k === 0) { c.beginPath(); c.arc(x - 10, y, 7, 0, FX_TAU); c.stroke(); c.fillRect(x - 3, y - 2, 20, 4); c.fillRect(x + 10, y + 2, 3, 6); c.fillRect(x + 15, y + 2, 3, 4); }
      else if (k === 1) { c.beginPath(); c.moveTo(x - 20, y + 10); c.quadraticCurveTo(x - 5, y - 18, x + 8, y - 4); c.quadraticCurveTo(x + 20, y + 8, x + 18, y + 14); c.stroke(); c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + 2, y - 4); c.lineTo(x + 8, y + 2); c.moveTo(x + 8, y - 4); c.lineTo(x + 2, y + 2); c.stroke(); }
      else if (k === 2) { c.beginPath(); c.ellipse(x, y + 8, 12, 9, 0, 0, FX_TAU); c.arc(x, y - 6, 8, 0, FX_TAU); c.fill(); cpPoly(c, [[x - 7, y - 10], [x - 6, y - 19], [x - 1, y - 13]]); c.fill(); cpPoly(c, [[x + 7, y - 10], [x + 6, y - 19], [x + 1, y - 13]]); c.fill(); }
      else if (k === 3) { c.beginPath(); c.arc(x, y, 14, 0, FX_TAU); c.fill(); c.fillStyle = '#E8DCD0'; c.beginPath(); c.arc(x + 6, y - 4, 12, 0, FX_TAU); c.fill(); }
      else if (k === 4) { c.fillRect(x - 12, y - 18, 24, 36); c.fillStyle = '#E8DCD0'; c.fillRect(x - 9, y - 15, 10, 30); c.fillStyle = '#1A0E0A'; c.beginPath(); c.arc(x + 6, y + 2, 1.6, 0, FX_TAU); c.fill(); }
      else if (k === 5) { for (j = 0; j < 4; j++) { c.beginPath(); c.ellipse(x - 14 + j * 9, y + 12 - j * 8 + (j % 2) * 4, 3, 5, 0.3, 0, FX_TAU); c.fill(); } }
      else if (k === 6) { c.beginPath(); c.ellipse(x, y + 4, 11, 14, 0, 0, FX_TAU); c.fill(); c.fillStyle = '#E8DCD0'; c.beginPath(); c.arc(x - 4.5, y - 3, 3.6, 0, FX_TAU); c.arc(x + 4.5, y - 3, 3.6, 0, FX_TAU); c.fill(); c.fillStyle = '#1A0E0A'; c.beginPath(); c.arc(x - 4.5, y - 3, 1.6, 0, FX_TAU); c.arc(x + 4.5, y - 3, 1.6, 0, FX_TAU); c.fill(); }
      else { c.beginPath(); c.ellipse(x, y - 2, 18, 5, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.arc(x, y - 5, 8, Math.PI, 0); c.fill(); c.globalAlpha = a * 0.5; cpPoly(c, [[x - 6, y + 2], [x + 6, y + 2], [x + 14, y + 20], [x - 14, y + 20]]); c.fill(); }
      c.globalAlpha = 1;
    }
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, n = Math.max(3, Math.min(6, Math.floor(W / 160))), sw = Math.sin(t * 0.8) * 0.04, j;
      /* the safelight's glow from above, and the line */
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '239,68,68', W * 0.5, -20, Math.max(W, H) * 0.55, 0.22 + 0.02 * Math.sin(t * 3)); c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#2A0E0E'; c.fillRect(W * 0.5 - 22, 0, 44, 16); c.globalCompositeOperation = 'lighter'; fxGlow(c, '248,113,113', W * 0.5, 16, 30, 0.8); c.globalCompositeOperation = 'source-over';
      c.strokeStyle = 'rgba(253,230,220,.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 46); c.quadraticCurveTo(W / 2, 60, W, 46); c.stroke();
      for (j = 0; j < n; j++) {
        var px = (j + 0.5) / n * W, py = 46 + 14 * (1 - Math.pow((px - W / 2) / (W / 2), 2)), cyc = (t + j * 5.3) % 32, id = Math.floor((t + j * 5.3) / 32) * 7 + j * 3, k = fxRnd(id) < 0.08 ? 7 : id % 7, dev = Math.min(1, Math.max(0, (cyc - 2) / 14)), out = cyc > 30 ? (cyc - 30) / 2 : 0, inn = Math.min(1, cyc / 1.2), w = Math.min(70, W / n - 18), h = w * 1.25;
        c.save(); c.translate(px, py); c.rotate(sw * (j % 2 ? 1 : -1) + Math.sin(t * 1.1 + j) * 0.03); c.globalAlpha = (1 - out) * inn;
        c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(-w / 2 + 3, 9, w, h); c.fillStyle = cpMix('#FAF4EE', '#E8DCD0', dev); c.fillRect(-w / 2, 6, w, h); c.fillStyle = 'rgba(0,0,0,' + (0.08 * dev) + ')'; c.fillRect(-w / 2 + 5, 11, w - 10, h - 10);
        c.save(); c.translate(-w / 2, 6); c.scale(w / 60, h / 75); pic(c, k, 60, 75, Math.pow(dev, 1.6) * (1 - out) * inn); c.restore();
        c.globalAlpha = (1 - out) * inn; c.fillStyle = '#7C5A3A'; c.fillRect(-4, -6, 8, 16); c.fillStyle = '#A07A50'; c.fillRect(-3, -6, 2, 16);
        c.restore();
        if (Math.random() < dt * 0.5 && dev < 1) { Dr.push({ x: px - w / 2 + Math.random() * w, y: py + h + 8, vx: 0, vy: 30, l: 0, m: 3 }); }
      }
      c.fillStyle = 'rgba(253,230,220,.55)'; lkStep(Dr, dt, 240, 0, function (p) { if (p.y > H - 46) { p.l = 99; return; } c.fillRect(p.x, p.y, 1.4, 4); });
      /* the tray, its ripples and the print in it; the timer */
      var tx = W * 0.5, ty = H - 30, tw = Math.min(260, W * 0.6);
      c.fillStyle = '#2B1513'; c.beginPath(); fxRR(c, tx - tw / 2, ty - 18, tw, 34, 6); c.fill(); c.fillStyle = 'rgba(248,113,113,.16)'; c.beginPath(); fxRR(c, tx - tw / 2 + 6, ty - 13, tw - 12, 24, 4); c.fill();
      c.fillStyle = 'rgba(250,244,238,.35)'; c.fillRect(tx - 30, ty - 9, 60, 16); c.save(); c.translate(tx - 30, ty - 9); c.scale(1, 0.24); pic(c, Math.floor(t / 9) % 7, 60, 66, 0.25 + 0.15 * Math.sin(t)); c.restore();
      c.strokeStyle = 'rgba(254,202,202,.35)'; c.lineWidth = 1; for (j = 0; j < 2; j++) { var ru = ((t * 0.5) + j / 2) % 1; c.globalAlpha = 1 - ru; c.beginPath(); c.ellipse(tx + 40, ty, 6 + ru * 40, 2 + ru * 8, 0, 0, FX_TAU); c.stroke(); } c.globalAlpha = 1;
      var ckx = W - 40, cky = H - 40; c.fillStyle = '#1C0A0A'; c.beginPath(); c.arc(ckx, cky, 18, 0, FX_TAU); c.fill(); c.strokeStyle = 'rgba(254,202,202,.6)'; c.lineWidth = 1.4; c.stroke(); for (j = 0; j < 12; j++) { var ta = j / 12 * FX_TAU; c.beginPath(); c.moveTo(ckx + Math.cos(ta) * 14, cky + Math.sin(ta) * 14); c.lineTo(ckx + Math.cos(ta) * 16, cky + Math.sin(ta) * 16); c.stroke(); } var ha = -Math.PI / 2 + Math.floor(t) / 60 * FX_TAU; c.strokeStyle = '#FCA5A5'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(ckx, cky); c.lineTo(ckx + Math.cos(ha) * 13, cky + Math.sin(ha) * 13); c.stroke();
    };
  };
  FX_LIVE_THEMES['prize-darkroom'] = 1;

  /* Big top (Pop-Up, Legendary, dark): the page is inside a circus tent at night, all in cut paper. A striped canopy with
     tassels across the top, poles at the sides, a string of bulbs that chase, spotlights sweeping from the corners, and the red
     wall of the ring along the foot with a seal bouncing a ball. An acrobat walks a tightrope under the canopy now and then,
     and once in a while the cannon on the right fires someone clean across the tent */
  FX_LIVING['prize-bigtop'] = function (s) {
    var OF = {}, Cf = [], Sm = [], lastC = -1;
    return function (t, dt) {
      var c = cpOff(s, OF), W = s.w, H = s.h, u = Math.min(1.3, Math.max(0.8, W / 600)), ch = 58 * u, sw = 34 * u, j;
      /* spotlights from the corners */
      c.globalCompositeOperation = 'lighter'; [[0, 1], [W, -1]].forEach(function (q, n) { var a = -Math.PI / 2 + q[1] * (0.45 + 0.3 * Math.sin(t * 0.4 + n * 2)); lkBeam(c, q[0], H, a, H * 1.1, 0.13, '254,243,199', 0.16); fxGlow(c, '254,243,199', q[0] + Math.cos(a) * H * 0.75, H + Math.sin(a) * H * 0.75, 70 * u, 0.12); }); c.globalCompositeOperation = 'source-over';
      /* the poles */
      [12, W - 12].forEach(function (x) { c.fillStyle = '#B91C1C'; c.fillRect(x - 4, 0, 8, H); c.fillStyle = '#FDE68A'; for (j = 0; j < H; j += 26) { c.fillRect(x - 4, j + ((t * 8) % 26), 8, 6); } });
      /* the tightrope, and the acrobat who crosses it */
      var ry = ch + 70 * u; c.strokeStyle = 'rgba(253,230,138,.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(12, ry); c.quadraticCurveTo(W / 2, ry + 10, W - 12, ry); c.stroke();
      var ac = (t % 26) / 14; if (ac < 1) { var ax = 12 + (W - 24) * ac, ay = ry + 10 * (1 - Math.pow((ax - W / 2) / (W / 2), 2)) - 1, wob = Math.sin(t * 3) * 0.25; c.save(); c.translate(ax, ay); c.rotate(wob * 0.4); c.strokeStyle = '#FDE68A'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-26 * u, -14 * u + wob * 10); c.lineTo(26 * u, -14 * u - wob * 10); c.stroke(); c.fillStyle = '#F472B6'; c.fillRect(-3 * u, -18 * u, 6 * u, 11 * u); c.fillStyle = '#FDE7D3'; c.beginPath(); c.arc(0, -22 * u, 3.6 * u, 0, FX_TAU); c.fill(); c.strokeStyle = '#FDE7D3'; c.lineWidth = 1.6 * u; c.beginPath(); c.moveTo(-1.5 * u, -7 * u); c.lineTo(-2 * u + Math.sin(t * 6) * 2, 0); c.moveTo(1.5 * u, -7 * u); c.lineTo(2 * u - Math.sin(t * 6) * 2, 0); c.stroke(); c.restore(); }
      /* the string of bulbs */
      var by = ch + 26 * u, nb = Math.floor(W / (26 * u)); c.strokeStyle = 'rgba(30,20,10,.8)'; c.lineWidth = 1; c.beginPath(); for (j = 0; j <= nb; j++) { var bx = 12 + (W - 24) * j / nb, byy = by + 22 * u * Math.sin(Math.PI * ((j % (nb / 3)) / (nb / 3))); if (j) { c.lineTo(bx, byy); } else { c.moveTo(bx, byy); } } c.stroke();
      c.globalCompositeOperation = 'lighter'; for (j = 0; j <= nb; j++) { var bx2 = 12 + (W - 24) * j / nb, by2 = by + 22 * u * Math.sin(Math.PI * ((j % (nb / 3)) / (nb / 3))) + 3, on = (j + Math.floor(t * 6)) % 3 === 0; fxGlow(c, ['253,224,71', '248,113,113', '96,165,250'][j % 3], bx2, by2, on ? 9 * u : 4 * u, on ? 1 : 0.5); } c.globalCompositeOperation = 'source-over';
      /* the canopy: stripes, a scalloped edge with gold trim and tassels, and its shadow */
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, ch + 6); for (j = W; j >= 0; j -= sw) { c.arc(j - sw / 2, ch + 6, sw / 2, 0, Math.PI); } c.closePath(); c.fill();
      for (j = 0; j * sw < W + sw; j++) { c.fillStyle = j % 2 ? '#FEF3C7' : '#DC2626'; c.beginPath(); c.moveTo(j * sw, 0); c.lineTo(j * sw + sw, 0); c.lineTo(j * sw + sw, ch); c.arc(j * sw + sw / 2, ch, sw / 2, 0, Math.PI); c.closePath(); c.fill(); }
      c.strokeStyle = '#FACC15'; c.lineWidth = 2; c.beginPath(); for (j = 0; j * sw < W + sw; j++) { c.moveTo(j * sw + sw, ch); c.arc(j * sw + sw / 2, ch, sw / 2, 0, Math.PI); } c.stroke();
      for (j = 0; j * sw < W + sw; j++) { var tx = j * sw, sway = Math.sin(t * 2 + j) * 2; c.strokeStyle = '#FACC15'; c.lineWidth = 1; c.beginPath(); c.moveTo(tx, ch); c.lineTo(tx + sway, ch + 10 * u); c.stroke(); c.fillStyle = '#FACC15'; cpPoly(c, [[tx + sway - 3, ch + 10 * u], [tx + sway + 3, ch + 10 * u], [tx + sway, ch + 18 * u]]); c.fill(); }
      /* the ring wall along the foot */
      var wy = H - 44 * u; c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, wy - 4, W, H - wy + 4); c.fillStyle = '#991B1B'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, wy + 10); c.quadraticCurveTo(W / 2, wy - 14, W, wy + 10); c.lineTo(W, H); c.closePath(); c.fill(); c.strokeStyle = '#FACC15'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, wy + 10); c.quadraticCurveTo(W / 2, wy - 14, W, wy + 10); c.stroke();
      c.fillStyle = '#FDE68A'; for (j = 0; j < Math.floor(W / 60); j++) { var sx = 30 + j * 60, sy = wy + 24 - 10 * (1 - Math.pow((sx - W / 2) / (W / 2), 2)); c.beginPath(); for (var q = 0; q <= 10; q++) { var ra = q / 10 * FX_TAU - Math.PI / 2, rr = q % 2 ? 2.6 : 6; c.lineTo(sx + Math.cos(ra) * rr, sy + Math.sin(ra) * rr); } c.fill(); }
      /* the seal and its ball */
      var slx = 54 * u, sly = wy - 2, bh = Math.abs(Math.sin(t * 2.6)) * 30 * u; c.fillStyle = '#334155'; c.beginPath(); c.ellipse(slx, sly - 10 * u, 18 * u, 10 * u, -0.4, 0, FX_TAU); c.fill(); c.beginPath(); c.arc(slx + 12 * u, sly - 24 * u, 7 * u, 0, FX_TAU); c.fill(); c.fillStyle = '#0F172A'; c.beginPath(); c.arc(slx + 14 * u, sly - 26 * u, 1.4, 0, FX_TAU); c.fill();
      var bx3 = slx + 18 * u, by3 = sly - 38 * u - bh; c.save(); c.translate(bx3, by3); c.rotate(t * 3); ['#EF4444', '#FACC15', '#3B82F6', '#22C55E'].forEach(function (col, m) { c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 8 * u, m * Math.PI / 2, (m + 1) * Math.PI / 2); c.closePath(); c.fill(); }); c.restore();
      /* the cannon, and whoever it fires */
      var cx = W - 56 * u, cy = wy - 8, ci = Math.floor(t / 34), ct = t - ci * 34, fire = ct > 28;
      c.save(); c.translate(cx, cy); c.rotate(-0.6); c.fillStyle = '#1F2937'; c.beginPath(); fxRR(c, -10 * u, -9 * u, 50 * u, 18 * u, 6 * u); c.fill(); c.fillStyle = '#FACC15'; c.fillRect(30 * u, -10 * u, 5 * u, 20 * u); c.fillRect(6 * u, -10 * u, 4 * u, 20 * u); c.restore(); c.fillStyle = '#7C2D12'; c.beginPath(); c.arc(cx, cy + 6, 10 * u, 0, FX_TAU); c.fill(); c.fillStyle = '#FACC15'; c.beginPath(); c.arc(cx, cy + 6, 3 * u, 0, FX_TAU); c.fill();
      if (fire && ci !== lastC) { lastC = ci; for (j = 0; j < 14; j++) { Sm.push({ x: cx - 30 * u, y: cy - 30 * u, vx: fxR(-60, 20), vy: fxR(-60, 10), l: 0, m: fxR(0.8, 1.6), r: fxR(6, 14) }); } for (j = 0; j < 40; j++) { Cf.push({ x: cx - 30 * u, y: cy - 30 * u, vx: fxR(-240, -40), vy: fxR(-260, -60), l: 0, m: fxR(1, 2), h: fxR(0, 360), r: fxR(0, 6) }); } }
      if (fire) { var fu = (ct - 28) / 2.6; if (fu < 1) { var fx = cx - 30 * u - fu * (W + 60), fy = cy - 30 * u - Math.sin(fu * Math.PI) * H * 0.45; c.save(); c.translate(fx, fy); c.rotate(-fu * 6); c.fillStyle = '#FACC15'; c.beginPath(); c.arc(0, -6 * u, 4.4 * u, 0, FX_TAU); c.fill(); c.fillStyle = '#EF4444'; c.fillRect(-3 * u, -2 * u, 6 * u, 10 * u); c.strokeStyle = '#EF4444'; c.lineWidth = 2; c.beginPath(); c.moveTo(-3 * u, 0); c.lineTo(-9 * u, -4 * u); c.moveTo(3 * u, 0); c.lineTo(9 * u, -4 * u); c.stroke(); c.restore(); c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', fx, fy, 14 * u, 0.6); c.globalCompositeOperation = 'source-over'; } }
      lkStep(Sm, dt, -20, 0.5, function (p, f) { c.globalAlpha = f * 0.6; c.fillStyle = '#CBD5E1'; c.beginPath(); c.arc(p.x, p.y, p.r * (1.6 - f * 0.6), 0, FX_TAU); c.fill(); c.globalAlpha = 1; });
      lkStep(Cf, dt, 200, 0.6, function (p, f) { c.save(); c.translate(p.x, p.y); c.rotate(p.r + p.l * 8); c.globalAlpha = Math.min(1, f * 2); c.fillStyle = 'hsl(' + p.h + ',90%,65%)'; c.fillRect(-3, -2, 6, 4 * Math.abs(Math.sin(p.l * 10 + p.r))); c.restore(); });
      c.globalAlpha = 1; cpBlit(s, OF, 0.95);
    };
  };
  FX_LIVE_THEMES['prize-bigtop'] = 1;

  /* Puzzle box (Cipher, Mythic, dark): the page sits inside a Japanese puzzle box. Its walls are inlaid wood in diamond
     patterns, and behind them brass gears turn in the dark along channels of teal light. Once a minute, by your own clock, the
     box solves itself: the panels slide one after another (down, up, along, out), the channels light in turn, and at the end a
     secret drawer slides out of the bottom holding a glowing key; then everything slides shut again */
  FX_LIVING['prize-puzzlebox'] = function (s) {
    var WD = ['#6B4423', '#8A5A2B', '#B07A3E', '#4A2E17'];
    function inlay(c, x, y, w, h, seed) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.fillStyle = WD[3]; c.fillRect(x, y, w, h); var z = 12, i, j; for (j = -1; j < h / z + 1; j++) { for (i = -1; i < w / z + 1; i++) { var cx = x + i * z + (j % 2) * z / 2, cy = y + j * z; c.fillStyle = WD[(i + j * 2 + seed + 8) % 3]; c.beginPath(); c.moveTo(cx, cy - z / 2); c.lineTo(cx + z / 2, cy); c.lineTo(cx, cy + z / 2); c.lineTo(cx - z / 2, cy); c.closePath(); c.fill(); } } c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); c.strokeStyle = 'rgba(255,220,160,.18)'; c.beginPath(); c.moveTo(x + 1, y + h - 1); c.lineTo(x + 1, y + 1); c.lineTo(x + w - 1, y + 1); c.stroke(); c.restore(); }
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, pw = W < 500 ? 24 : 60, tb = 20, bb = 46, now = new Date(), sec = (s.opt && s.opt.sec !== undefined) ? (s.opt.sec + t) % 60 : now.getSeconds() + now.getMilliseconds() / 1000, j;
      function stp(a, b) { return fxEase((sec - a) / (b - a)) * (1 - fxEase((sec - 57) / 2.4)); }
      var m1 = stp(2, 4), m2 = stp(9, 11), m3 = stp(16, 18.5), m4 = stp(24, 26), m5 = stp(31, 33), dw = stp(40, 44), glow = stp(44, 46), run = (sec - 44) / 12;
      /* the mechanism behind the walls: gears and teal channels, lit in turn */
      c.fillStyle = '#0A0705'; c.fillRect(0, 0, pw, H); c.fillRect(W - pw, 0, pw, H); c.fillRect(0, 0, W, tb); c.fillRect(0, H - bb, W, bb);
      [[pw / 2, H * 0.22, 1], [pw / 2, H * 0.5, -1], [pw / 2, H * 0.8, 1], [W - pw / 2, H * 0.3, -1], [W - pw / 2, H * 0.62, 1], [W * 0.3, tb / 2, 1], [W * 0.7, tb / 2, -1]].forEach(function (g, n) { zGear(c, g[0], g[1], Math.min(pw, 60) * 0.42, 10, t * 0.4 * g[2] + n, '#C9A14A', 0.8); zGear(c, g[0], g[1] + Math.min(pw, 60) * 0.7, Math.min(pw, 60) * 0.25, 7, -t * 0.66 * g[2] + n, '#8A6A2E', 0.7); });
      c.globalCompositeOperation = 'lighter'; c.lineWidth = 2;
      [[m1, [[pw / 2, 0], [pw / 2, H * 0.4]]], [m2, [[W - pw / 2, H], [W - pw / 2, H * 0.5]]], [m3, [[0, tb / 2], [W, tb / 2]]], [m4, [[pw / 2, H * 0.4], [pw / 2, H]]], [m5, [[W - pw / 2, H * 0.5], [W - pw / 2, 0]]]].forEach(function (q) { if (q[0] <= 0.01) { return; } c.strokeStyle = 'rgba(94,234,212,' + (0.7 * q[0]).toFixed(3) + ')'; c.beginPath(); c.moveTo(q[1][0][0], q[1][0][1]); c.lineTo(q[1][1][0], q[1][1][1]); c.stroke(); fxGlow(c, '94,234,212', q[1][1][0], q[1][1][1], 14, 0.6 * q[0]); });
      if (glow > 0) { for (j = 0; j < 6; j++) { var pu = ((run + j / 6) % 1 + 1) % 1, py2 = H - bb / 2 - pu * (H - bb), px2 = j % 2 ? pw / 2 : W - pw / 2; fxGlow(c, '153,246,228', px2, py2, 10, glow); } }
      c.globalCompositeOperation = 'source-over';
      /* the panels, each sliding its own way */
      c.save(); c.beginPath(); c.rect(0, 0, pw, H); c.rect(W - pw, 0, pw, H); c.rect(0, 0, W, tb); c.rect(0, H - bb, W, bb); c.clip();
      inlay(c, 0, 0 + m1 * H * 0.18, pw, H * 0.4, 0); inlay(c, -m4 * pw * 0.85, H * 0.4, pw, H * 0.6, 1);
      inlay(c, W - pw, H * 0.5 - m2 * H * 0.16, pw, H * 0.5, 2); inlay(c, W - pw + m5 * pw * 0.85, 0, pw, H * 0.5, 1);
      inlay(c, pw + m3 * W * 0.3, 0, W - pw * 2, tb, 2);
      inlay(c, pw, H - bb, (W - pw * 2) / 2 - dw * 40, bb, 0); inlay(c, W / 2 + dw * 40, H - bb, (W - pw * 2) / 2 - dw * 40, bb, 1);
      c.restore();
      /* the secret drawer and the key in it */
      if (dw > 0.01) { var dx = W / 2, dy = H - bb / 2 - dw * 30, dwid = 76; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(dx - dwid / 2 + 4, dy - 12, dwid, 30); c.fillStyle = '#3B2414'; c.fillRect(dx - dwid / 2, dy - 16, dwid, 32); c.fillStyle = '#5B1A2A'; c.fillRect(dx - dwid / 2 + 5, dy - 11, dwid - 10, 20); c.globalCompositeOperation = 'lighter'; fxGlow(c, '94,234,212', dx, dy - 1, 40, 0.5 * dw + 0.4 * glow * (0.6 + 0.4 * Math.sin(t * 4))); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#E8B04B'; c.beginPath(); c.arc(dx - 18, dy - 1, 5, 0, FX_TAU); c.fill(); c.fillRect(dx - 13, dy - 2.4, 26, 3); c.fillRect(dx + 6, dy, 3, 5); c.fillRect(dx + 11, dy, 3, 4); c.fillStyle = '#5B1A2A'; c.beginPath(); c.arc(dx - 18, dy - 1, 2, 0, FX_TAU); c.fill(); c.fillStyle = '#E8B04B'; c.fillRect(dx - 6, dy + 11, 12, 3); if (glow > 0.5) { c.globalCompositeOperation = 'lighter'; fxStar4(c, dx - 16 + Math.sin(t * 2) * 4, dy - 6, 6 * glow, glow, '#FFFFFF'); c.globalCompositeOperation = 'source-over'; } }
    };
  };
  FX_LIVE_THEMES['prize-puzzlebox'] = 1;

  /* Astronomical clock (Radiant, dark): a great astronomical clock rises behind the page, keeping your real time. A gold sun on
     its hand points to the hour on a ring of twenty-four, a moon on its own hand shows tonight's real phase, a star marks the
     minutes, and the sky disc behind them is day above and night below with the twilight between. Gears turn behind the face
     and stars wheel in the dark. Every five minutes on your clock its two little doors open, figures parade past one by one as
     the bell rings, and the gold rooster on top flaps and crows */
  var CP_ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  FX_LIVING['prize-astro'] = function (s) {
    var St = [], i, OF = {}; for (i = 0; i < 90; i++) { St.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6), z: fxR(0.5, 1.4) }); }
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, R = Math.min(W * 0.62, H * 0.5), cx = W / 2, cy = H - R * 0.66, now = new Date(), opt = s.opt || {}, j;
      var hr = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600, mn = now.getMinutes() + now.getSeconds() / 60, moon = cpMoon();
      var par = opt.parade !== undefined ? opt.parade + t : (now.getMinutes() % 5) * 60 + now.getSeconds() + now.getMilliseconds() / 1000, doors = fxEase(par / 2) * (1 - fxEase((par - 18) / 2)), al = opt.lit || 0.62;
      /* the sky behind, wheeling slowly */
      c.globalCompositeOperation = 'lighter'; St.forEach(function (q) { var a = t * 0.004, x = cx + (q.x - 0.5) * W * 1.4 * Math.cos(a) - (q.y - 0.5) * H * 1.4 * Math.sin(a), y = cy + (q.x - 0.5) * W * 1.4 * Math.sin(a) + (q.y - 0.5) * H * 1.4 * Math.cos(a); fxGlow(c, '226,232,255', x, y, 1.5 * q.z, 0.2 + 0.25 * Math.sin(t * 1.5 + q.p)); });
      fxGlow(c, '252,211,77', cx, cy, R * 1.25, 0.1);
      c.globalCompositeOperation = 'source-over'; c = cpOff(s, OF);
      /* gears behind the face, seen through the open ring */
      for (j = 0; j < 6; j++) { var ga = j / 6 * FX_TAU + 0.3; zGear(c, cx + Math.cos(ga) * R * 0.86, cy + Math.sin(ga) * R * 0.86, R * 0.16, 12, t * 0.2 * (j % 2 ? 1 : -1), '#B7791F', 0.9); }
      /* the face: the outer ring of twenty-four hours */
      c.fillStyle = '#0F1530'; c.beginPath(); c.arc(cx, cy, R, 0, FX_TAU); c.fill(); c.strokeStyle = '#FCD34D'; c.lineWidth = 2.4; c.stroke(); c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R * 0.86, 0, FX_TAU); c.stroke();
      c.font = '700 ' + Math.round(R * 0.07) + 'px ' + CP_SERIF; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (j = 0; j < 24; j++) { var ha = -Math.PI / 2 + j / 24 * FX_TAU; c.save(); c.translate(cx + Math.cos(ha) * R * 0.93, cy + Math.sin(ha) * R * 0.93); c.rotate(ha + Math.PI / 2); c.fillStyle = '#FDE68A'; c.fillText(CP_ROMAN[j % 12], 0, 0); c.restore(); c.strokeStyle = '#FCD34D'; c.beginPath(); c.moveTo(cx + Math.cos(ha + FX_TAU / 48) * R * 0.86, cy + Math.sin(ha + FX_TAU / 48) * R * 0.86); c.lineTo(cx + Math.cos(ha + FX_TAU / 48) * R, cy + Math.sin(ha + FX_TAU / 48) * R); c.stroke(); }
      /* the sky disc: day above the horizon, night below, twilight between */
      c.save(); c.beginPath(); c.arc(cx, cy, R * 0.86, 0, FX_TAU); c.clip();
      var sg = c.createLinearGradient(0, cy - R * 0.86, 0, cy + R * 0.86); sg.addColorStop(0, '#3B6FB6'); sg.addColorStop(0.42, '#7FB0E0'); sg.addColorStop(0.5, '#E8A25C'); sg.addColorStop(0.58, '#5B3A6E'); sg.addColorStop(1, '#0A0F26'); c.fillStyle = sg; c.fillRect(cx - R, cy - R, R * 2, R * 2);
      c.strokeStyle = 'rgba(253,230,138,.6)'; c.lineWidth = 1; [0.18, 0.36].forEach(function (k) { c.beginPath(); c.arc(cx, cy + R * 1.1, R * (1.1 + k), Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }); c.beginPath(); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.stroke();
      c.globalCompositeOperation = 'lighter'; for (j = 0; j < 30; j++) { fxGlow(c, '255,255,255', cx + (fxRnd(j) - 0.5) * R * 1.5, cy + fxRnd(j + 30) * R * 0.8, 1.2, 0.6); } c.globalCompositeOperation = 'source-over';
      /* the ring of the stars, set off center and turning with the hour */
      var zc = [cx, cy - R * 0.2], zr = R * 0.6; c.strokeStyle = '#FCD34D'; c.lineWidth = 2; c.beginPath(); c.arc(zc[0], zc[1], zr, 0, FX_TAU); c.stroke(); c.lineWidth = 1; c.beginPath(); c.arc(zc[0], zc[1], zr * 0.86, 0, FX_TAU); c.stroke();
      for (j = 0; j < 12; j++) { var za = hr / 24 * FX_TAU + j / 12 * FX_TAU; c.fillStyle = '#FDE68A'; fxStar4(c, zc[0] + Math.cos(za) * zr * 0.93, zc[1] + Math.sin(za) * zr * 0.93, 4, 1, '#FDE68A'); c.beginPath(); c.moveTo(zc[0] + Math.cos(za + 0.26) * zr * 0.86, zc[1] + Math.sin(za + 0.26) * zr * 0.86); c.lineTo(zc[0] + Math.cos(za + 0.26) * zr, zc[1] + Math.sin(za + 0.26) * zr); c.strokeStyle = '#FCD34D'; c.stroke(); }
      c.restore();
      /* the hands: the sun on the hour, the moon in its real phase, a star on the minutes */
      var sa = -Math.PI / 2 + hr / 24 * FX_TAU + Math.PI, ma = sa + moon * FX_TAU, na = -Math.PI / 2 + mn / 60 * FX_TAU;
      c.strokeStyle = '#FCD34D'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(sa) * R * 0.9, cy + Math.sin(sa) * R * 0.9); c.stroke(); c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ma) * R * 0.66, cy + Math.sin(ma) * R * 0.66); c.stroke(); c.strokeStyle = '#E0E7FF'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(na) * R * 0.8, cy + Math.sin(na) * R * 0.8); c.stroke();
      var spx = cx + Math.cos(sa) * R * 0.74, spy = cy + Math.sin(sa) * R * 0.74; c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', spx, spy, R * 0.12, 0.8); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#FCD34D'; c.beginPath(); for (j = 0; j < 16; j++) { var r2 = j % 2 ? R * 0.035 : R * 0.06, a2 = j / 16 * FX_TAU + t * 0.3; c.lineTo(spx + Math.cos(a2) * r2, spy + Math.sin(a2) * r2); } c.closePath(); c.fill();
      var mpx = cx + Math.cos(ma) * R * 0.58, mpy = cy + Math.sin(ma) * R * 0.58, mr = R * 0.05; c.fillStyle = '#1E2547'; c.beginPath(); c.arc(mpx, mpy, mr, 0, FX_TAU); c.fill();
      c.save(); c.beginPath(); c.arc(mpx, mpy, mr, 0, FX_TAU); c.clip(); c.fillStyle = '#F1F5F9'; var ph = moon < 0.5 ? moon * 2 : (1 - moon) * 2, side = moon < 0.5 ? 1 : -1; c.beginPath(); c.arc(mpx, mpy, mr, -Math.PI / 2, Math.PI / 2, side < 0); c.ellipse(mpx, mpy, mr * Math.abs(1 - ph * 2), mr, 0, Math.PI / 2, -Math.PI / 2, (ph > 0.5) === (side > 0)); c.fill(); c.restore();
      fxStar4(c, cx + Math.cos(na) * R * 0.8, cy + Math.sin(na) * R * 0.8, R * 0.04, 1, '#E0E7FF'); c.fillStyle = '#FCD34D'; c.beginPath(); c.arc(cx, cy, R * 0.03, 0, FX_TAU); c.fill();
      /* the doors, the parade, the bell and the rooster */
      var dy = cy - R - R * 0.2, dwid = R * 0.22, dh = R * 0.18;
      [-1, 1].forEach(function (sd) { var dx = cx + sd * R * 0.3; c.fillStyle = '#1A1F3D'; c.fillRect(dx - dwid / 2, dy - dh / 2, dwid, dh); c.strokeStyle = '#FCD34D'; c.lineWidth = 1.4; c.strokeRect(dx - dwid / 2, dy - dh / 2, dwid, dh);
        c.save(); c.beginPath(); c.rect(dx - dwid / 2, dy - dh / 2, dwid, dh); c.clip(); c.fillStyle = 'rgba(253,230,138,' + (0.25 * doors).toFixed(3) + ')'; c.fillRect(dx - dwid / 2, dy - dh / 2, dwid, dh);
        for (var f = 0; f < 6; f++) { var fu = (par - 2 - f * 2.4 - (sd > 0 ? 1.2 : 0)) / 2.4; if (fu <= 0 || fu >= 1) { continue; } var fx = dx - dwid / 2 - 8 + fu * (dwid + 16), fyy = dy + dh / 2; c.fillStyle = ['#FDE68A', '#FCA5A5', '#A5B4FC', '#86EFAC', '#FDBA74', '#F9A8D4'][f]; c.beginPath(); c.arc(fx, fyy - dh * 0.62, dh * 0.12, 0, FX_TAU); c.fill(); cpPoly(c, [[fx - dh * 0.14, fyy - dh * 0.48], [fx + dh * 0.14, fyy - dh * 0.48], [fx + dh * 0.2, fyy], [fx - dh * 0.2, fyy]]); c.fill(); }
        c.restore();
        c.fillStyle = '#2C3566'; c.fillRect(dx - dwid / 2, dy - dh / 2, dwid / 2 * (1 - doors), dh); c.fillRect(dx + dwid / 2 - dwid / 2 * (1 - doors), dy - dh / 2, dwid / 2 * (1 - doors), dh); });
      var ring = par > 2 && par < 17 ? Math.max(0, Math.sin((par - 2) * Math.PI / 1.2)) : 0, bx = cx - R * 0.62, byy = cy - R * 0.84; c.fillStyle = '#FCD34D'; c.beginPath(); c.moveTo(bx - 10, byy + 10); c.quadraticCurveTo(bx - 9, byy - 8, bx, byy - 10); c.quadraticCurveTo(bx + 9, byy - 8, bx + 10, byy + 10); c.closePath(); c.fill(); c.beginPath(); c.arc(bx + Math.sin(par * 6) * 3 * ring, byy + 12, 2.4, 0, FX_TAU); c.fill();
      if (ring > 0.1) { c.strokeStyle = 'rgba(253,230,138,' + (0.6 * ring).toFixed(3) + ')'; c.lineWidth = 1.2; for (j = 1; j <= 3; j++) { c.beginPath(); c.arc(bx, byy, 10 + j * 7 * ring, -0.6, 0.6); c.stroke(); c.beginPath(); c.arc(bx, byy, 10 + j * 7 * ring, Math.PI - 0.6, Math.PI + 0.6); c.stroke(); } }
      var crow = fxEnv(par, 17, 17.4, 19.2, 19.8), rx = cx, ry = dy - dh / 2 - R * 0.1, flap = crow > 0 ? Math.sin(t * 18) * 0.5 * crow : 0; c.fillStyle = '#FCD34D'; c.beginPath(); c.ellipse(rx, ry, R * 0.05, R * 0.035, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.arc(rx + R * 0.045, ry - R * 0.04, R * 0.022, 0, FX_TAU); c.fill(); c.fillStyle = '#EF4444'; cpPoly(c, [[rx + R * 0.04, ry - R * 0.065], [rx + R * 0.05, ry - R * 0.085], [rx + R * 0.06, ry - R * 0.06]]); c.fill(); c.fillStyle = '#FCD34D'; c.save(); c.translate(rx - R * 0.01, ry - R * 0.01); c.rotate(-0.4 - flap); c.beginPath(); c.ellipse(-R * 0.03, 0, R * 0.04, R * 0.016, 0, 0, FX_TAU); c.fill(); c.restore(); cpPoly(c, [[rx - R * 0.045, ry], [rx - R * 0.09, ry - R * 0.06], [rx - R * 0.07, ry + R * 0.01]]); c.fill();
      if (crow > 0.2) { cpWrite(c, 'COCK-A-DOODLE!', rx + R * 0.24, ry - R * 0.08, Math.round(R * 0.05), '#FDE68A', crow, 'italic 700 ' + Math.round(R * 0.05) + 'px ' + CP_SERIF); }
      c.globalAlpha = 1; cpBlit(s, OF, al);
    };
  };
  FX_LIVE_THEMES['prize-astro'] = 1;

  /* ---------- streak styles: small drawings that grow with the streak (their looks are in prizes.css, classes cp-...) ---------- */
  /* the lit part of a moon of radius r at (cx, cy), p its age in its cycle (0 new, 0.5 full), as an SVG path */
  function cpMoonD(cx, cy, r, p) {
    var k = Math.cos(p * FX_TAU), rx = Math.max(0.01, Math.abs(k) * r), wax = p < 0.5, top = budP(cx, cy - r), bot = budP(cx, cy + r);
    if (p < 0.02 || p > 0.98) { return ''; }
    return 'M' + top + 'A' + budN(r) + ' ' + budN(r) + ' 0 0 ' + (wax ? 1 : 0) + ' ' + bot + 'A' + budN(rx) + ' ' + budN(r) + ' 0 0 ' + (wax ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0)) + ' ' + top + 'Z';
  }
  /* Paper folds (Pop-Up, Common): a square of paper with its creases marked, folded into something new each week: a boat on
     the water, a paper plane, a fox. At 30 days it is a crane that flaps its wings, and at 100 the crane is gold */
  FX_STREAK.folds = function (n) {
    var w = Math.floor(n / 7), out;
    if (n < 7) { out = '<g class="cp-fsq"><path class="cp-fp cp-p0" d="M8 6h28v28H8z"/><path class="cp-fl" d="M8 6l28 28M36 6L8 34M22 6v28M8 20h28"/><path class="cp-fp2 cp-p0" d="M36 6v8l-8-8z"/></g>'; }
    else if (w === 1) { out = '<path class="cp-fw" d="M2 37q5-3 10 0t10 0 10 0 10 0"/><g class="cp-fbob"><path class="cp-fp cp-p1" d="M4 24h36l-7 9H11z"/><path class="cp-fp2 cp-p1" d="M12 24l10-17 10 17z"/><path class="cp-fl" d="M22 7v17M4 24l7 9M40 24l-7 9"/></g>'; }
    else if (w === 2) { out = '<g class="cp-fplane"><path class="cp-fp cp-p2" d="M3 22L42 9 19 30z"/><path class="cp-fp2 cp-p2" d="M19 30l4-11 19-10z"/><path class="cp-fl" d="M3 22l20-3"/><path class="cp-ftrail" d="M1 32q6-2 10 2"/></g>'; }
    else if (n < 30) { out = '<path class="cp-fp cp-p3" d="M5 7l11 11h12l11-11-4 16-13 13-13-13z"/><path class="cp-fp2 cp-p3" d="M16 18h12l-6 18z"/><circle class="cp-feye" cx="17" cy="22" r="1.7"/><circle class="cp-feye" cx="27" cy="22" r="1.7"/><path class="cp-fl" d="M5 7l11 11M39 7L28 18M22 18v18"/>'; }
    else { out = '<g class="cp-crane"><path class="cp-fp cp-wl" d="M22 21L5 6l8 17z"/><path class="cp-fp cp-wr" d="M22 21L40 4 30 23z"/><path class="cp-fp2" d="M9 25l13-4 13 4-13 7z"/><path class="cp-fp" d="M9 25L2 13l4 1z"/><path class="cp-fp" d="M35 25l6-12 1 4z"/><path class="cp-fl" d="M22 21v11"/></g>' + (n >= 100 ? lkSpk(5, 33, 0) + lkSpk(41, 30, 1) + lkSpk(22, 3, 2) : ''); }
    return '<svg class="pz-si cp-folds' + (n >= 100 ? ' gold' : n >= 30 ? ' crane' : '') + '" viewBox="0 0 44 40" aria-hidden="true">' + out + '</svg>';
  };
  /* Padlock (Cipher, Rare): a padlock whose dial shows your streak, with a notch filed on top for each week. At 30 days it
     springs open and its key hangs beside it; at 100 it is gold and glints */
  FX_STREAK.padlock = function (n) {
    var open = n >= 30, wk = Math.min(4, Math.floor(n / 7)), num = n > 999 ? '999' : String(n), out = '', i;
    out += open ? '<path class="cp-shk" d="M13 13V8a9 9 0 0 1 18 0v12"/>' : '<path class="cp-shk" d="M13 20V13a9 9 0 0 1 18 0v7"/>';
    out += '<rect class="cp-lbody" x="8" y="19" width="28" height="22" rx="4"/><rect class="cp-lshine" x="11" y="21.4" width="3" height="17" rx="1.5"/>';
    for (i = 0; i < wk; i++) { out += '<rect class="cp-ltal" x="' + (16 + i * 4) + '" y="20.6" width="2.4" height="1.8" rx=".6"/>'; }
    out += '<circle class="cp-ldial" cx="22" cy="31" r="7.6"/>'; for (i = 0; i < 12; i++) { var a = i / 12 * FX_TAU; out += '<path class="cp-ltick" d="M' + budP(22 + Math.cos(a) * 6.2, 31 + Math.sin(a) * 6.2) + 'L' + budP(22 + Math.cos(a) * 7.4, 31 + Math.sin(a) * 7.4) + '"/>'; }
    out += '<text class="cp-lnum" x="22" y="33.4" text-anchor="middle">' + num + '</text>';
    if (open) { out += '<g class="cp-lkey"><circle class="cp-key" cx="46" cy="12" r="4.4"/><circle class="cp-keyh" cx="46" cy="12" r="1.6"/><path class="cp-key" d="M45 16h2v17h-2zM47 26h3v2h-3zM47 30h4v2h-4z"/></g>' + (n >= 100 ? lkSpk(5, 9, 0) + lkSpk(40, 40, 1) + lkSpk(52, 4, 2) : ''); }
    return '<svg class="pz-si cp-padlock' + (n >= 100 ? ' gold' : open ? ' open' : '') + '" viewBox="0 0 ' + (open ? 56 : 44) + ' 44" aria-hidden="true">' + out + '</svg>';
  };
  /* Moon wheel (Pop-Up, Epic): a paper wheel of the moon's phases behind a card with a window. It turns one notch a day, so the
     window shows a new moon on the first day of each week and a full one in the middle; a dot is punched for each week. Gold
     with stars at 30 days, and at 100 a sun sits at its hub and its rays turn */
  FX_STREAK.moonwheel = function (n) {
    var ph = n % 7, wk = Math.min(4, Math.floor(n / 7)), out = '', i;
    if (n >= 100) { out += '<g class="cp-mrays">'; for (i = 0; i < 12; i++) { var ra = i / 12 * FX_TAU; out += '<path d="M' + budP(24 + Math.cos(ra - 0.1) * 21, 24 + Math.sin(ra - 0.1) * 21) + 'L' + budP(24 + Math.cos(ra) * 26, 24 + Math.sin(ra) * 26) + 'L' + budP(24 + Math.cos(ra + 0.1) * 21, 24 + Math.sin(ra + 0.1) * 21) + 'z"/>'; } out += '</g>'; }
    out += '<circle class="cp-mwheel" cx="24" cy="24" r="20"/><g transform="rotate(' + budN(-ph * 360 / 7) + ' 24 24)">';
    for (i = 0; i < 7; i++) { var a = -Math.PI / 2 + i / 7 * FX_TAU, x = 24 + Math.cos(a) * 13, y = 24 + Math.sin(a) * 13, d = cpMoonD(0, 0, 4.2, i / 7 + 0.0001); out += '<g transform="translate(' + budP(x, y) + ') rotate(' + budN(i * 360 / 7) + ')"><circle class="cp-mdark" r="4.2"/>' + (d ? '<path class="cp-mlit" d="' + d + '"/>' : '') + '</g>'; }
    out += '</g><path class="cp-mcard" fill-rule="evenodd" d="M24 2a22 22 0 1 0 .01 0zM19 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/>';
    for (i = 0; i < wk; i++) { out += '<circle class="cp-mdot" cx="' + (18 + i * 4) + '" cy="38" r="1.3"/>'; }
    out += '<circle class="' + (n >= 100 ? 'cp-msun' : 'cp-mhub') + '" cx="24" cy="26" r="' + (n >= 100 ? 4.4 : 2) + '"/>';
    if (n >= 30) { out += lkSpk(4, 6, 0) + lkSpk(44, 8, 1) + lkSpk(42, 44, 2); }
    return '<svg class="pz-si cp-moonw' + (n >= 30 ? ' gold' : '') + '" viewBox="-2 -2 52 52" aria-hidden="true">' + out + '</svg>';
  };
  /* Cipher wheel (Cipher, Legendary): two rings of letters, the inner one turned a letter further each day, and a window that
     shows one letter of a secret word: a new letter every week, with a mark for each one found. At 30 days the wheel is gold,
     and once all eleven are found the whole word is written under it and the wheel glows */
  var CP_SECRET = 'UNSTOPPABLE';
  FX_STREAK.cipherwheel = function (n) {
    var wk = Math.floor(n / 7), got = Math.min(CP_SECRET.length, wk + 1), cur = CP_SECRET.charAt(Math.min(CP_SECRET.length - 1, wk)), sh = n % 26, out = '', i, all = got >= CP_SECRET.length && n >= 77;
    out += '<circle class="cp-cwo" cx="24" cy="24" r="21"/>'; for (i = 0; i < 26; i++) { var a = i / 26 * FX_TAU; out += '<path class="cp-cwt" d="M' + budP(24 + Math.cos(a) * 18.4, 24 + Math.sin(a) * 18.4) + 'L' + budP(24 + Math.cos(a) * (i % 2 ? 20 : 21), 24 + Math.sin(a) * (i % 2 ? 20 : 21)) + '"/>'; }
    out += '<g transform="rotate(' + budN(sh * 360 / 26) + ' 24 24)"><circle class="cp-cwi" cx="24" cy="24" r="15.6"/>'; for (i = 0; i < 26; i++) { var b = i / 26 * FX_TAU; out += '<circle class="cp-cwd' + (i % 13 === 0 ? ' big' : '') + '" cx="' + budN(24 + Math.cos(b) * 12.6) + '" cy="' + budN(24 + Math.sin(b) * 12.6) + '" r="' + (i % 13 === 0 ? 1.3 : 0.6) + '"/>'; } out += '</g>';
    out += '<rect class="cp-cwin" x="16.4" y="15.4" width="15.2" height="17.2" rx="2.4"/><text class="cp-cwl" x="24" y="28.4" text-anchor="middle">' + cur + '</text>';
    if (all) { out += '<text class="cp-cwword" x="24" y="51.8" text-anchor="middle">' + CP_SECRET + '</text><circle class="cp-cwglow" cx="24" cy="24" r="23"/>' + lkSpk(2, 4, 0) + lkSpk(46, 6, 1); }
    else { for (i = 0; i < CP_SECRET.length; i++) { out += '<circle class="cp-cwf' + (i < got ? ' on' : '') + '" cx="' + budN(6 + i * 3.6) + '" cy="50" r="1.2"/>'; } }
    return '<svg class="pz-si cp-cwheel' + (all ? ' found' : n >= 30 ? ' gold' : '') + '" viewBox="-1 -1 50 54" aria-hidden="true">' + out + '</svg>';
  };
  /* Paper peacock (Pop-Up, Mythic): a little paper peacock that opens a fan of pleated feathers, one more every few days. At
     30 days the fan is full and the eyes on the feathers shimmer; at 100 they run through every color and its crest shines */
  FX_STREAK.peacock = function (n) {
    var k = Math.min(9, 2 + Math.floor(n / 4)), full = n >= 30, out = '<g class="cp-pfan">', i;
    for (i = 0; i < k; i++) { var a = (i - (k - 1) / 2) * (150 / 8) * Math.PI / 180, ex = 24 + Math.sin(a) * 21, ey = 33 - Math.cos(a) * 21; out += '<g class="cp-pfe cp-pfe' + (i % 3) + '"><path class="cp-pf' + (i % 2) + '" d="M' + budP(24 + Math.sin(a - 0.12) * 4, 33 - Math.cos(a - 0.12) * 4) + 'L' + budP(24 + Math.sin(a - 0.14) * 23, 33 - Math.cos(a - 0.14) * 23) + 'L' + budP(24 + Math.sin(a + 0.14) * 23, 33 - Math.cos(a + 0.14) * 23) + 'L' + budP(24 + Math.sin(a + 0.12) * 4, 33 - Math.cos(a + 0.12) * 4) + 'z"/><circle class="cp-peye" cx="' + budN(ex) + '" cy="' + budN(ey) + '" r="2"/><circle class="cp-peye2" cx="' + budN(ex) + '" cy="' + budN(ey) + '" r=".9"/></g>'; }
    out += '</g><path class="cp-pbody" d="M20 44q-1-10 3-14q2-6 5-4q2 2 -1 5q4 4 2 13z"/><path class="cp-pbeak" d="M28 26.6l3 1-3 .8z"/><circle class="cp-peyeb" cx="26.6" cy="27.4" r=".7"/>';
    out += '<path class="cp-pcrest' + (n >= 100 ? ' shine' : '') + '" d="M25.6 25.6l-1-4M26.4 25.4l.4-4.2M27.2 25.8l1.6-3.8"/><circle class="cp-pcb" cx="24.6" cy="21.4" r=".9"/><circle class="cp-pcb" cx="26.8" cy="21.2" r=".9"/><circle class="cp-pcb" cx="28.8" cy="22" r=".9"/>';
    if (n >= 100) { out += lkSpk(3, 10, 0) + lkSpk(45, 12, 1) + lkSpk(24, 2, 2); }
    return '<svg class="pz-si cp-peacock' + (n >= 100 ? ' rainbow' : full ? ' full' : '') + '" viewBox="0 0 48 46" aria-hidden="true">' + out + '</svg>';
  };
  /* Nesting dolls (Radiant): a painted doll steps out of the last one each week, smaller every time, each with its own pattern,
     up to five in a row. At 30 days the smallest holds a gold egg and the row glows; at 100 they have all gone back inside one
     gold doll, their outlines showing in rings on her front, and light turns round her */
  FX_STREAK.dolls = function (n) {
    var k = Math.min(5, 1 + Math.floor(n / 7)), out = '', x = 1, i, COL = ['dl0', 'dl1', 'dl2', 'dl3', 'dl4'];
    function doll(x0, h, cls, rings) { var w = h * 0.62, cx = x0 + w / 2, by = 46, hr = w * 0.34, s = '<g class="cp-doll ' + cls + '">'; s += '<path class="cp-dbody" d="M' + budP(cx - w * 0.5, by) + 'C' + budP(cx - w * 0.56, by - h * 0.5) + ' ' + budP(cx - w * 0.42, by - h * 0.66) + ' ' + budP(cx - hr * 0.95, by - h * 0.7) + 'A' + budN(hr * 1.02) + ' ' + budN(hr * 1.02) + ' 0 1 1 ' + budP(cx + hr * 0.95, by - h * 0.7) + 'C' + budP(cx + w * 0.42, by - h * 0.66) + ' ' + budP(cx + w * 0.56, by - h * 0.5) + ' ' + budP(cx + w * 0.5, by) + 'Z"/>';
      s += '<ellipse class="cp-dface" cx="' + budN(cx) + '" cy="' + budN(by - h * 0.78) + '" rx="' + budN(hr * 0.66) + '" ry="' + budN(hr * 0.56) + '"/><circle class="cp-dcheek" cx="' + budN(cx - hr * 0.32) + '" cy="' + budN(by - h * 0.74) + '" r="' + budN(hr * 0.12) + '"/><circle class="cp-dcheek" cx="' + budN(cx + hr * 0.32) + '" cy="' + budN(by - h * 0.74) + '" r="' + budN(hr * 0.12) + '"/>';
      if (rings) { for (var r = 1; r <= 4; r++) { s += '<ellipse class="cp-dring" cx="' + budN(cx) + '" cy="' + budN(by - h * 0.32) + '" rx="' + budN(w * 0.4 * (1 - r * 0.17)) + '" ry="' + budN(h * 0.26 * (1 - r * 0.17)) + '"/>'; } }
      else { s += '<circle class="cp-dflower" cx="' + budN(cx) + '" cy="' + budN(by - h * 0.32) + '" r="' + budN(w * 0.2) + '"/><circle class="cp-dmid" cx="' + budN(cx) + '" cy="' + budN(by - h * 0.32) + '" r="' + budN(w * 0.08) + '"/>'; }
      return s + '</g>'; }
    if (n >= 100) { out += '<g class="cp-dhalo"><circle cx="16" cy="26" r="17"/></g>' + doll(1, 44, 'gold', 1) + lkSpk(3, 6, 0) + lkSpk(30, 4, 1) + lkSpk(31, 38, 2); return '<svg class="pz-si cp-dolls one" viewBox="-2 -2 36 50" aria-hidden="true">' + out + '</svg>'; }
    for (i = 0; i < k; i++) { var h = 42 - i * 6.4; out += doll(x, h, COL[i] + (i === k - 1 && n % 7 < 2 && n > 6 ? ' new' : ''), 0); x += h * 0.62 + 1.4; }
    if (n >= 30) { out += '<ellipse class="cp-degg" cx="' + budN(x + 1.6) + '" cy="42.6" rx="2" ry="2.6"/>' + lkSpk(x + 2, 36, 0); x += 5; }
    return '<svg class="pz-si cp-dolls' + (n >= 30 ? ' glow' : '') + '" viewBox="0 0 ' + budN(x + 1) + ' 48" aria-hidden="true">' + out + '</svg>';
  };

  /* ---------- character skins (BUD_SKINS in buddy.js; their moves use the shared classes in buddy.css: bud-rot, bud-swy,
     bud-pls, bud-glw, bud-wave, bud-orx and bud-ory for an orbit, bud-tw for twinkles and bud-pt for particles) ---------- */
  /* a style that turns a part about a point of the drawing */
  function cpOrg(x, y, extra) { return ' style="transform-box:view-box;transform-origin:' + x + 'px ' + y + 'px;' + (extra || '') + '"'; }
  /* split the stock arm's hand off, so a skin can put something in it */
  function cpHand(h) { var m = h.match(/<circle[^>]*\/>$/); return m ? [h.slice(0, h.length - m[0].length), m[0]] : [h, '']; }

  /* Detective (Cipher, Common): a trench coat with a belt and a scarf in your color, a checked deerstalker cap, and a magnifying
     glass that sweeps back and forth. A spotlight on the floor, footprints that appear one after another, and question marks
     drifting up */
  BUD_SKINS.sleuth = {
    eyes: 'open', mouth: 'smile', hat: false, covers: true,
    pal: function (P) { P.tc = '#C9A46A'; P.tc2 = '#B08A52'; P.tc3 = '#E2C48F'; P.tcl = '#5C4322'; P.arm = P.tc; P.armline = P.tcl; P.cuff = P.tc2; P.pants = '#3B3632'; P.shoe = '#7A5232'; P.sole = '#3B2414'; return P; },
    defs: function (P, u) { return '<pattern id="' + u + 'ck" patternUnits="userSpaceOnUse" width="5" height="5"><rect width="5" height="5" fill="#A8834F"/><path d="M0 0h2.5v2.5H0zM2.5 2.5H5V5H2.5z" fill="#7E5F36"/><path d="M0 1.25H5M1.25 0V5" stroke="#D9B884" stroke-width=".35" opacity=".7"/></pattern>' +
      '<radialGradient id="' + u + 'sp"><stop offset="0" stop-color="#FFF7D6" stop-opacity=".9"/><stop offset=".6" stop-color="#FDE68A" stop-opacity=".25"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient>'; },
    aura: function (P, u) {
      var fp = '', i; for (i = 0; i < 6; i++) { var x = 4 + i * 16, y = 116 + (i % 2) * 3.6; fp += '<g class="bud-c bud-glw"' + cpOrg(x, y, '--d:3.6s;--dl:-' + budN(3.6 - i * 0.6) + 's') + '><ellipse cx="' + x + '" cy="' + y + '" rx="2.4" ry="1.2" fill="#7A5232" opacity=".55"/><ellipse cx="' + (x + 3.6) + '" cy="' + (y + 0.2) + '" rx="1" ry=".9" fill="#7A5232" opacity=".55"/></g>'; }
      return '<ellipse class="bud-c bud-pls" style="--d:4s" cx="50" cy="112" rx="42" ry="9" fill="url(#' + u + 'sp)"/><circle class="bud-c bud-pls" style="--d:5s" cx="50" cy="62" r="54" fill="url(#' + u + 'sp)" opacity=".35"/>' + fp +
        budParts(6, [10, 90, 24, 70], function (x, y, i) { return '<text x="' + budN(x) + '" y="' + budN(y) + '" font-family="Georgia, serif" font-size="' + (7 + (i % 3) * 2) + '" font-weight="700" fill="#B45309" opacity=".75">?</text>'; }, { d: 4.6, dy: 30, dx: 8, seed: 11 });
    },
    back: function (P) { return '<path d="M33.6 90C31.6 99 30.4 106 29.4 111.6H70.6C69.6 106 68.4 99 66.4 90Z" fill="' + P.tc2 + '" stroke="' + P.tcl + '" stroke-width="1.1" stroke-linejoin="round"/><path d="M50 97V111.6" stroke="' + P.tcl + '" stroke-width=".8"/>'; },
    torso: function (P) {
      return '<path d="' + BUD_TORSO + '" fill="' + P.tc + '" stroke="' + P.tcl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M34.4 80.4C33.6 86 32.6 92 31.8 97.8C31.6 99.6 32.2 100.8 33.4 101.6C34.8 94 35.4 86 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.tc2 + '" opacity=".6"/>' +
        '<path d="M44 75.8L38.4 79L41.6 89L47.6 80.2Z" fill="' + P.tc3 + '" stroke="' + P.tcl + '" stroke-width=".9" stroke-linejoin="round"/><path d="M56 75.8L61.6 79L58.4 89L52.4 80.2Z" fill="' + P.tc3 + '" stroke="' + P.tcl + '" stroke-width=".9" stroke-linejoin="round"/>' +
        '<path d="M40 77.4Q50 82.6 60 77.4L59.4 80.8Q50 85.4 40.6 80.8Z" fill="' + P.c + '" stroke="' + P.cl + '" stroke-width=".8"/><path d="M54.4 81.6l2.6 9-3.8.8-1-8.6Z" fill="' + P.c2 + '" stroke="' + P.cl + '" stroke-width=".7"/><path d="M53.4 89.6l3.6-.6M53.6 90.8l3.6-.6" stroke="' + P.c3 + '" stroke-width=".5"/>' +
        [[45, 87], [45, 92], [55, 92]].map(function (b) { return '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="1" fill="' + P.tcl + '"/>'; }).join('') +
        '<rect x="32.4" y="94" width="35.2" height="3.6" rx="1" fill="' + P.tc2 + '" stroke="' + P.tcl + '" stroke-width=".8"/><rect x="47.4" y="93.4" width="5.2" height="4.8" rx=".8" fill="none" stroke="#E5C07B" stroke-width="1"/><path d="M38 99.6h6M56 99.6h6" stroke="' + P.tcl + '" stroke-width=".7"/>';
    },
    arm: function (P, side) {
      var h = BUD_PART.arm(P, side); if (side < 0) { return h; } var p = cpHand(h);
      return p[0] + '<g class="bud-swy"' + cpOrg(69, 96, '--a:9deg;--d:3.4s') + '><path d="M69 96L76.6 83.4" stroke="#5B3A1E" stroke-width="2.6" stroke-linecap="round"/><circle cx="79.6" cy="78" r="6.6" fill="rgba(186,230,253,.35)" stroke="#8B6A3E" stroke-width="2"/><path d="M76.4 75.4q2-2.4 5-1.4" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/><circle class="bud-c bud-glw" style="--d:2.2s" cx="81.6" cy="80" r="1" fill="#FFFFFF"/></g>' + p[1];
    },
    top: function (P, u) {
      return '<path d="M21 41C21 22.4 33.4 12 50 12C66.6 12 79 22.4 79 41Z" fill="url(#' + u + 'ck)" stroke="' + P.tcl + '" stroke-width="1.2" stroke-linejoin="round"/><path d="M50 12V41M35 15.6Q40 28 39 41M65 15.6Q60 28 61 41" fill="none" stroke="' + P.tcl + '" stroke-width=".6" opacity=".5"/>' +
        '<path d="M25.6 38.8Q50 46.6 74.4 38.8L72 44Q50 50.4 28 44Z" fill="url(#' + u + 'ck)" stroke="' + P.tcl + '" stroke-width="1.1" stroke-linejoin="round"/><path d="M28 44Q50 50.4 72 44" fill="none" stroke="' + P.tc3 + '" stroke-width=".6" opacity=".7"/>' +
        '<path d="M22.4 33q-4 5-1 10l4-1.6z" fill="url(#' + u + 'ck)" stroke="' + P.tcl + '" stroke-width=".9"/><path d="M77.6 33q4 5 1 10l-4-1.6z" fill="url(#' + u + 'ck)" stroke="' + P.tcl + '" stroke-width=".9"/>' +
        '<path d="M45.6 12.4q4.4-4.6 8.8 0q-4.4 2.4-8.8 0z" fill="' + P.tc2 + '" stroke="' + P.tcl + '" stroke-width=".7"/><circle cx="50" cy="11.6" r="1.6" fill="' + P.tc2 + '" stroke="' + P.tcl + '" stroke-width=".7"/>';
    }
  };

  /* Origami (Pop-Up, Rare): an outfit folded from paper in your color, every facet a different shade along its creases, a folded
     paper crane on a headband that flaps its wings, a paper fan behind, two more cranes circling and paper confetti rising */
  BUD_SKINS.origami = {
    eyes: 'open', mouth: 'grin', hat: false,
    pal: function (P) { P.o1 = P.c; P.o2 = budMix(P.c, '#FFFFFF', 0.45); P.o3 = budMix(P.c, '#160C22', 0.25); P.ol = budMix(P.c, '#160C22', 0.62); P.arm = P.o2; P.armline = P.ol; P.cuff = P.o1; P.pants = P.o3; P.shoe = '#FFFFFF'; return P; },
    defs: function (P, u) { return '<radialGradient id="' + u + 'og"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".8"/><stop offset=".6" stop-color="' + P.o2 + '" stop-opacity=".25"/><stop offset="1" stop-color="' + P.o2 + '" stop-opacity="0"/></radialGradient>'; },
    crane: function (P, s) { return '<g transform="scale(' + s + ')"><path d="M-12 2L0 -4L12 2L0 6Z" fill="' + P.o2 + '" stroke="' + P.ol + '" stroke-width=".5"/><path d="M0 -1L-10 -16L-3 -1Z" fill="' + P.o1 + '" stroke="' + P.ol + '" stroke-width=".5"/><path d="M0 -1L12 -18L4 -1Z" fill="' + P.o3 + '" stroke="' + P.ol + '" stroke-width=".5"/><path d="M-12 2L-18 -8L-15.6 -6.4Z" fill="' + P.o2 + '" stroke="' + P.ol + '" stroke-width=".5"/><path d="M12 2L17 -6L16 -2.4Z" fill="' + P.o3 + '" stroke="' + P.ol + '" stroke-width=".5"/></g>'; },
    aura: function (P, u) {
      return '<circle class="bud-c bud-pls" style="--d:5s" cx="50" cy="60" r="56" fill="url(#' + u + 'og)"/>' +
        '<g class="bud-orx" style="--od:4.6s;--ox:44px"><g class="bud-c bud-ory" style="--od:4.6s;--oy:8px"><g transform="translate(50 30)">' + this.crane(P, 0.55) + '</g></g></g>' +
        '<g class="bud-orx" style="--od:5.8s;--ox:40px;--odl:-2.9s"><g class="bud-c bud-ory" style="--od:5.8s;--oy:7px;--odl:-2.9s"><g transform="translate(50 92)">' + this.crane(P, 0.45) + '</g></g></g>' +
        budParts(10, [10, 90, 72, 112], function (x, y, i) { return '<rect x="' + budN(x - 1.6) + '" y="' + budN(y - 1.6) + '" width="3.2" height="3.2" fill="' + ['#F472B6', '#FACC15', '#60A5FA', '#34D399', P.o2][i % 5] + '" transform="rotate(' + (i * 37) + ' ' + budP(x, y) + ')"/>'; }, { d: 4.2, dy: 50, dx: 12, seed: 21 });
    },
    back: function (P) {
      var h = '', i; for (i = 0; i < 12; i++) { var a0 = Math.PI + i / 12 * Math.PI, a1 = Math.PI + (i + 1) / 12 * Math.PI; h += '<path d="M50 84L' + budP(50 + Math.cos(a0) * 40, 84 + Math.sin(a0) * 40) + 'L' + budP(50 + Math.cos(a1) * 40, 84 + Math.sin(a1) * 40) + 'Z" fill="' + (i % 2 ? P.o2 : P.o1) + '" stroke="' + P.ol + '" stroke-width=".5"/>'; }
      return '<g class="bud-swy"' + cpOrg(50, 84, '--a:3deg;--d:4s') + '>' + h + '<circle cx="50" cy="84" r="3" fill="' + P.o3 + '"/></g>';
    },
    torso: function (P) {
      return '<path d="' + BUD_TORSO + '" fill="' + P.o1 + '" stroke="' + P.ol + '" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M34.4 80.4L50 75.6L44 90Z" fill="' + P.o2 + '"/><path d="M65.6 80.4L50 75.6L56 90Z" fill="' + P.o3 + '"/><path d="M31.8 97.8L44 90L37 102.2H36C33.2 102.2 31.4 100.6 31.8 97.8Z" fill="' + P.o3 + '"/><path d="M68.2 97.8L56 90L63 102.2H64C66.8 102.2 68.6 100.6 68.2 97.8Z" fill="' + P.o2 + '"/>' +
        '<path d="M50 75.6L56 90L50 102.2L44 90Z" fill="' + P.o1 + '"/><path d="M50 75.6L44 90L50 102.2L56 90Z M34.4 80.4L44 90L31.8 97.8M65.6 80.4L56 90L68.2 97.8M44 90L37 102.2M56 90L63 102.2" fill="none" stroke="' + P.ol + '" stroke-width=".6" stroke-linejoin="round"/>' +
        '<path d="M46.4 86l3.6-3.6 3.6 3.6-3.6 3.6z" fill="#FFFFFF" stroke="' + P.ol + '" stroke-width=".5"/>';
    },
    top: function (P) {
      return '<path d="M23.4 41.4C31 34.6 40.6 32 50 32C59.4 32 69 34.6 76.6 41.4" fill="none" stroke="' + P.ol + '" stroke-width="4.4" stroke-linecap="round"/><path d="M23.4 41.4C31 34.6 40.6 32 50 32C59.4 32 69 34.6 76.6 41.4" fill="none" stroke="' + P.o3 + '" stroke-width="3" stroke-linecap="round"/>' +
        '<g transform="translate(50 9)"><g class="bud-swy"' + cpOrg(0, 0, '--a:6deg;--d:1.6s') + '>' + this.crane(P, 1.3) + '</g></g>';
    },
    fore: function () { return budTwinkles([[12, 80, 2.4], [90, 70, 2.6], [84, 108, 1.8], [16, 106, 1.6]], '#FFFFFF', 23); }
  };

  /* Spy (Cipher, Epic): a black suit with a tie in your color, dark glasses, an earpiece, a briefcase and a watch that glows.
     Red laser beams cross behind, a searchlight sweeps, radar rings pulse at your feet, and a tiny drone circles with its
     light blinking */
  BUD_SKINS.spy = {
    eyes: 'open', mouth: 'smirk', hat: false,
    pal: function (P) { P.su = '#1E2228'; P.su2 = '#2C323B'; P.su3 = '#3A424D'; P.sul = '#07080A'; P.sh = '#F8FAFC'; P.arm = P.su; P.armline = P.sul; P.cuff = P.sh; P.pants = P.su; P.shoe = '#14171B'; P.sole = '#000000'; P.line = '#07080A'; return P; },
    defs: function (P, u) { return '<linearGradient id="' + u + 'sl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>'; },
    aura: function (P, u) {
      var lz = '', i; for (i = 0; i < 5; i++) { var y0 = 10 + i * 24, y1 = 40 + i * 18; lz += '<g class="bud-c bud-glw" style="--d:' + budN(1.6 + i * 0.3) + 's;--dl:-' + budN(i * 0.4) + 's"><path d="M-14 ' + y0 + 'L114 ' + y1 + '" stroke="#EF4444" stroke-width="2.6" opacity=".25"/><path d="M-14 ' + y0 + 'L114 ' + y1 + '" stroke="#FECACA" stroke-width=".6"/></g>'; }
      return '<g class="bud-swy"' + cpOrg(8, -14, '--a:16deg;--d:5s') + '><path d="M8 -14L34 122L76 122Z" fill="url(#' + u + 'sl)" opacity=".4"/></g>' + lz +
        '<g transform="translate(50 115) scale(1 .3)">' + [0, 1, 2].map(function (k) { return '<circle class="bud-c bud-rip" style="--d:3s;--dl:-' + k + 's" r="34" fill="none" stroke="#22D3EE" stroke-width="2"/>'; }).join('') + '</g>';
    },
    torso: function (P) {
      return '<path d="' + BUD_TORSO + '" fill="' + P.su + '" stroke="' + P.sul + '" stroke-width="1.3" stroke-linejoin="round"/><path d="M44 76.4L50 88.6L56 76.4Z" fill="' + P.sh + '"/>' +
        '<path d="M48.8 78.6h2.4l1.2 2.2-1.4 9.6L50 89.2l-1 1.2-1.4-9.6z" fill="' + P.c + '" stroke="' + P.cl + '" stroke-width=".6"/><path d="M48.8 78.6h2.4l.4 1.4h-3.2z" fill="' + P.c2 + '"/>' +
        '<path d="M43.6 76L39.2 79.4L44.6 90.6L48.6 84.6Z" fill="' + P.su2 + '" stroke="' + P.sul + '" stroke-width=".7"/><path d="M56.4 76L60.8 79.4L55.4 90.6L51.4 84.6Z" fill="' + P.su2 + '" stroke="' + P.sul + '" stroke-width=".7"/>' +
        '<path d="M57.6 85.6l4.2-1 .4 2.2H58z" fill="' + P.c3 + '"/><circle cx="50" cy="95" r=".9" fill="' + P.su3 + '"/><circle cx="50" cy="98.6" r=".9" fill="' + P.su3 + '"/><path d="M36 100.2H64" stroke="' + P.su3 + '" stroke-width=".6"/>';
    },
    arm: function (P, side, u) {
      var p = cpHand(BUD_PART.arm(P, side));
      if (side < 0) { return p[0] + '<path d="M28 96q3-3.6 6 0" fill="none" stroke="#14171B" stroke-width="1.4"/><rect x="22" y="96.6" width="15" height="11" rx="1.6" fill="#3F2A1A" stroke="#160E07" stroke-width=".9"/><path d="M22 100.4h15" stroke="#160E07" stroke-width=".6"/><rect x="28.4" y="99.4" width="2.4" height="2.4" fill="#D4AF37"/>' + p[1]; }
      return p[0] + '<rect x="65.4" y="90.2" width="4.4" height="3.2" rx=".8" fill="#0B0D10" transform="rotate(26 67.6 91.8)"/><rect class="bud-c bud-glw" style="--d:1.4s" x="66.2" y="90.8" width="2.8" height="2" rx=".5" fill="#22D3EE" transform="rotate(26 67.6 91.8)"/>' + p[1];
    },
    over: function (P) {
      return '<path d="M27 55.4H47.6L46.2 62.2C45.6 64.8 43.6 66 41 66H34C31.4 66 29.4 64.6 28.6 62.2Z" fill="#0B0D10" stroke="#000000" stroke-width=".6"/><path d="M52.4 55.4H73L71.4 62.2C70.6 64.6 68.6 66 66 66H59C56.4 66 54.4 64.8 53.8 62.2Z" fill="#0B0D10" stroke="#000000" stroke-width=".6"/>' +
        '<path d="M47.6 56.4q2.4-1.8 4.8 0M27 55.6l-4.4-1.2M73 55.6l4.4-1.2" fill="none" stroke="#0B0D10" stroke-width="1.2" stroke-linecap="round"/><path d="M31 58.6l4.6-2M56.4 58.6l4.6-2" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" opacity=".7"/>' +
        '<path d="M79.6 60.4q2.6 2.4.4 6.4q-2.4 4 1 9" fill="none" stroke="#94A3B8" stroke-width=".8"/><circle cx="79.4" cy="60.4" r="1.6" fill="#1F2937"/>';
    },
    fore: function () {
      return '<g class="bud-orx" style="--od:3.8s;--ox:38px"><g class="bud-c bud-ory" style="--od:3.8s;--oy:6px"><g transform="translate(50 20)"><rect x="-5" y="-1.6" width="10" height="3.2" rx="1.2" fill="#334155"/><path d="M-8 -3h5M3 -3h5" stroke="#94A3B8" stroke-width=".9"/><path d="M-5.5 -1.6v-1.4M5.5 -1.6v-1.4" stroke="#334155" stroke-width=".8"/><circle class="bud-c bud-glw" style="--d:.8s" cx="0" cy="0" r="1" fill="#EF4444"/></g></g></g>';
    }
  };

  /* Storyteller (Pop-Up, Legendary): a tunic in your color with a ribbon sash, a cape and a tall hat folded from book pages with
     a quill in the band, and an open pop-up book in your hands where a little castle keeps folding up. A paper theater stands
     behind, its curtains stirring, paper stars swing on their strings, and letters float up out of the book */
  BUD_SKINS.tale = {
    eyes: 'open', mouth: 'smile', hat: false, covers: true,
    pal: function (P) { P.rb = P.c; P.rb2 = budMix(P.c, '#160C22', 0.3); P.rbl = budMix(P.c, '#160C22', 0.62); P.pg = '#FBF4E2'; P.pg2 = '#E8DCC0'; P.gold = '#E8B04B'; P.goldl = '#8A5A12'; P.arm = P.rb; P.armline = P.rbl; P.cuff = P.gold; P.pants = P.rb2; P.shoe = '#6B4423'; P.sole = '#3B2414'; return P; },
    defs: function (P, u) { return '<pattern id="' + u + 'pp" patternUnits="userSpaceOnUse" width="14" height="4.4"><rect width="14" height="4.4" fill="' + P.pg + '"/><path d="M1.4 3.2H8.6M10 3.2H12.8" stroke="#B9A98A" stroke-width=".5"/></pattern>' +
      '<radialGradient id="' + u + 'st"><stop offset="0" stop-color="#FDE68A" stop-opacity=".6"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient>'; },
    aura: function (P, u) {
      var stars = [[22, 8, 24], [50, 4, 18], [78, 8, 26]].map(function (q, i) { return '<g class="bud-swy"' + cpOrg(q[0], q[1], '--a:10deg;--d:' + (2.4 + i * 0.5) + 's') + '><path d="M' + q[0] + ' ' + q[1] + 'V' + (q[1] + q[2]) + '" stroke="#A8A29E" stroke-width=".5"/><path d="' + budStar5(q[0], q[1] + q[2] + 4, 4.4) + '" fill="#FACC15" stroke="#A16207" stroke-width=".5"/></g>'; }).join('');
      return '<circle cx="50" cy="70" r="56" fill="url(#' + u + 'st)"/>' +
        '<path d="M5 120V30Q5 4 50 4Q95 4 95 30V120" fill="none" stroke="' + P.gold + '" stroke-width="3"/><path d="M5 120V30Q5 4 50 4Q95 4 95 30V120" fill="none" stroke="' + P.goldl + '" stroke-width=".6"/>' +
        '<g class="bud-wave"' + cpOrg(8, 10, '--d:4s') + '><path d="M7 28Q8 10 30 9Q24 40 27 70Q20 92 23 120H7Z" fill="#B91C1C"/><path d="M14 20Q18 60 14 120M20 14Q22 60 18 120" stroke="#7F1D1D" stroke-width=".8" fill="none"/></g>' +
        '<g class="bud-wave"' + cpOrg(92, 10, '--d:4.4s') + '><path d="M93 28Q92 10 70 9Q76 40 73 70Q80 92 77 120H93Z" fill="#B91C1C"/><path d="M86 20Q82 60 86 120M80 14Q78 60 82 120" stroke="#7F1D1D" stroke-width=".8" fill="none"/></g>' +
        '<path d="M8 17Q50 1 92 17L92 23Q70 13 50 17Q30 13 8 23Z" fill="#991B1B" stroke="' + P.gold + '" stroke-width=".8"/>' + stars +
        budParts(10, [26, 74, 70, 104], function (x, y, i) { return '<text x="' + budN(x) + '" y="' + budN(y) + '" font-family="Georgia, serif" font-size="6.4" font-weight="700" fill="' + (i % 2 ? P.gold : '#FFFFFF') + '">' + 'ONCEUPAIMT'.charAt(i) + '</text>'; }, { d: 4.4, dy: 52, dx: 10, seed: 41 });
    },
    back: function (P, u) { return '<path class="bud-wave"' + cpOrg(50, 80, '--d:3.6s') + ' d="M37 78C31 88 25 100 21 113.4L27 111.6L33 114L39 111.6L45 114L50 111.8L55 114L61 111.6L67 114L73 111.6L79 113.4C75 100 69 88 63 78Z" fill="url(#' + u + 'pp)" stroke="' + P.goldl + '" stroke-width="1" stroke-linejoin="round"/>'; },
    torso: function (P) {
      return '<path d="' + BUD_TORSO + '" fill="' + P.rb + '" stroke="' + P.rbl + '" stroke-width="1.3" stroke-linejoin="round"/><path d="M34.4 80.4C33.6 86 32.6 92 31.8 97.8C31.6 99.6 32.2 100.8 33.4 101.6C34.8 94 35.4 86 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.rb2 + '" opacity=".6"/>' +
        '<path d="M36 79L64 99" stroke="' + P.gold + '" stroke-width="3.2"/><path d="M36 79L64 99" stroke="' + P.goldl + '" stroke-width=".5" stroke-dasharray="1.6 1.6"/>' +
        '<path d="M40 76.8Q50 83 60 76.8L58 80.2Q50 84.8 42 80.2Z" fill="' + P.pg + '" stroke="' + P.goldl + '" stroke-width=".6"/>';
    },
    front: function (P) {
      return '<path d="M28.6 93L50 96.6L71.4 93L71.4 105.6L50 108.6L28.6 105.6Z" fill="' + P.rb2 + '" stroke="' + P.rbl + '" stroke-width=".8"/>' +
        '<path d="M30 92L49.4 95V106L30 103.4Z" fill="' + P.pg + '" stroke="' + P.goldl + '" stroke-width=".6"/><path d="M70 92L50.6 95V106L70 103.4Z" fill="' + P.pg + '" stroke="' + P.goldl + '" stroke-width=".6"/>' +
        '<path d="M33 96.2l13 2M33 98.8l13 2M33 101.4l10 1.6M67 96.2l-13 2M67 98.8l-13 2M67 101.4l-10 1.6" stroke="#B9A98A" stroke-width=".5"/>' +
        '<g class="cp-pop"' + cpOrg(50, 96, '') + '><path d="M42 96V84h3v-2h2v2h2v-4h2v4h2v-2h2v2h3v12Z" fill="#94A3B8" stroke="#475569" stroke-width=".6"/><path d="M41 84l3-4 3 4zM53 84l3-4 3 4zM47.4 80l2.6-5 2.6 5z" fill="#DC2626"/><rect x="48.6" y="89" width="2.8" height="7" rx="1.4" fill="#475569"/><path d="M50 75v-3l3 1.2-3 1.2" fill="#FACC15" stroke="#A16207" stroke-width=".3"/></g>';
    },
    top: function (P, u) {
      return '<path d="M25 40.4L50 -12L75 40.4Z" fill="url(#' + u + 'pp)" stroke="' + P.goldl + '" stroke-width="1.1" stroke-linejoin="round"/><path d="M50 -12L44 40M50 -12L58 40" stroke="' + P.pg2 + '" stroke-width=".7"/>' +
        '<path d="M22.6 36.4H77.4L75.6 42.6H24.4Z" fill="' + P.rb + '" stroke="' + P.rbl + '" stroke-width="1" stroke-linejoin="round"/><path d="M23.4 39.4H76.6" stroke="' + P.gold + '" stroke-width=".8"/>' +
        '<path d="M66 39Q78 18 89 5Q81 24 69.4 41Z" fill="#FDFDF8" stroke="#A8A29E" stroke-width=".6"/><path d="M67.6 40Q78 22 88 6" stroke="#A8A29E" stroke-width=".5" fill="none"/>';
    },
    fore: function (P) {
      return '<g class="bud-orx" style="--od:5s;--ox:42px"><g class="bud-c bud-ory" style="--od:5s;--oy:6px"><g transform="translate(50 50)"><path d="M-6 -3L0 0L-1 1.6ZM6 -3L0 0L1 1.6Z" fill="#FFFFFF" stroke="' + P.goldl + '" stroke-width=".3"/></g></g></g>' + budTwinkles([[14, 90, 2.2], [86, 86, 2.4]], '#FDE68A', 43);
    }
  };

  /* Keymaster (Cipher, Mythic): a midnight robe and hood edged in gold, glowing letters on the robe, a padlock pendant with a
     lit keyhole and a giant key for a staff. Behind the head two rings of letters turn opposite ways (the inner one three
     letters on, like a real cipher), keys of light circle, and letters rise round you */
  BUD_SKINS.keymaster = {
    eyes: 'open', mouth: 'smile', hat: false, covers: true,
    pal: function (P) { P.km = '#141A3A'; P.km2 = '#1E2752'; P.km3 = '#2C3870'; P.kml = '#070A1A'; P.gold = '#E8B04B'; P.gold2 = '#B7791F'; P.goldl = '#5B3A06'; P.teal = '#5EEAD4'; P.arm = P.km2; P.armline = P.kml; P.cuff = P.gold; P.pants = P.km; P.shoe = P.km2; P.sole = P.gold2; P.ir1 = '#042F2E'; P.ir2 = '#0D9488'; P.ir3 = '#99F6E4'; return P; },
    defs: function (P, u) { return '<radialGradient id="' + u + 'kg"><stop offset="0" stop-color="#5EEAD4" stop-opacity=".45"/><stop offset=".6" stop-color="#5EEAD4" stop-opacity=".12"/><stop offset="1" stop-color="#5EEAD4" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="' + u + 'gm" cx=".35" cy=".3"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".4" stop-color="' + budMix(P.c, '#FFFFFF', 0.4) + '"/><stop offset="1" stop-color="' + budMix(P.c, '#0B0614', 0.4) + '"/></radialGradient>'; },
    ring: function (P, r, off, sz) { var AB = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; return '<circle r="' + (r + 4.6) + '" fill="none" stroke="' + P.gold + '" stroke-width=".7" opacity=".9"/><circle r="' + (r - 4.6) + '" fill="none" stroke="' + P.gold + '" stroke-width=".5" opacity=".7"/>' + budRing(0, 0, r, 26, function (a, x, y, i) { return '<text x="' + budN(x) + '" y="' + budN(y + sz * 0.36) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="' + sz + '" font-weight="700" fill="' + (i % 2 ? P.gold : '#FDE68A') + '" transform="rotate(' + budN(a + 90) + ' ' + budP(x, y) + ')">' + AB.charAt((i + off) % 26) + '</text>'; }); },
    key: function (P, s) { return '<g transform="scale(' + s + ')"><circle cx="0" cy="-6" r="3.4" fill="none" stroke="#99F6E4" stroke-width="1.4"/><path d="M0 -2.6V8M0 4h2.6M0 7h3.4" stroke="#99F6E4" stroke-width="1.4" stroke-linecap="round"/></g>'; },
    aura: function (P, u) {
      return '<circle class="bud-c bud-pls" style="--d:4s" cx="50" cy="52" r="60" fill="url(#' + u + 'kg)"/>' +
        '<g transform="translate(50 47)"><g class="bud-c bud-rot" style="--d:46s">' + this.ring(P, 42, 0, 5.4) + '</g></g><g transform="translate(50 47)"><g class="bud-c bud-rotr" style="--d:34s">' + this.ring(P, 32.6, 3, 4.6) + '</g></g>' +
        '<g class="bud-orx" style="--od:4.4s;--ox:46px"><g class="bud-c bud-ory" style="--od:4.4s;--oy:8px"><g transform="translate(50 30)">' + this.key(P, 1) + '</g></g></g>' +
        '<g class="bud-orx" style="--od:5.6s;--ox:40px;--odl:-2.8s"><g class="bud-c bud-ory" style="--od:5.6s;--oy:7px;--odl:-2.8s"><g transform="translate(50 96)">' + this.key(P, 0.8) + '</g></g></g>' +
        budParts(12, [10, 90, 64, 112], function (x, y, i) { return '<text x="' + budN(x) + '" y="' + budN(y) + '" font-family="IBM Plex Mono, monospace" font-size="5.6" font-weight="700" fill="#5EEAD4">' + 'KEYSCIPHERLOCK'.charAt(i) + '</text>'; }, { d: 4, dy: 50, dx: 10, seed: 61 });
    },
    back: function (P) { return '<g class="bud-wave"' + cpOrg(50, 80, '--d:3.8s') + '><path d="M36 78C30 88 24 100 19 114H81C76 100 70 88 64 78Z" fill="' + P.km + '" stroke="' + P.gold + '" stroke-width="1.2" stroke-linejoin="round"/><path d="M21.6 110H78.4" stroke="' + P.gold + '" stroke-width=".8" stroke-dasharray="2 1.6"/></g>'; },
    torso: function (P) {
      var gl = [[40, 84, 'Q'], [60, 88, 'X'], [42, 96, 'Z'], [58, 97, 'J']].map(function (q, i) { return '<g class="bud-tw" style="--d:' + (2 + i * 0.4) + 's;--dl:-' + i * 0.6 + 's"><text x="' + q[0] + '" y="' + q[1] + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="4.6" font-weight="700" fill="#5EEAD4">' + q[2] + '</text></g>'; }).join('');
      return '<path d="' + BUD_TORSO + '" fill="' + P.km2 + '" stroke="' + P.kml + '" stroke-width="1.3" stroke-linejoin="round"/><path d="M46.6 76V102M53.4 76V102" stroke="' + P.gold + '" stroke-width="1"/>' + gl +
        '<path d="M46.6 80.4a3.4 3.4 0 0 1 6.8 0V83" fill="none" stroke="' + P.gold + '" stroke-width="1.3"/><rect x="45.2" y="82.6" width="9.6" height="8.4" rx="1.6" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".7"/><circle class="bud-c bud-glw" style="--d:2s" cx="50" cy="85.6" r="1.4" fill="#5EEAD4"/><path class="bud-c bud-glw" style="--d:2s" d="M49.3 86.2h1.4l.4 3h-2.2z" fill="#5EEAD4"/>';
    },
    arm: function (P, side, u) {
      var p = cpHand(BUD_PART.arm(P, side)); if (side < 0) { return p[0] + p[1]; }
      return p[0] + '<g transform="translate(74 0)"><rect x="-1.2" y="64" width="2.4" height="48" rx="1" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".5"/><path d="M1.2 101h4v2.4h-4zM1.2 106h5.4v2.4h-5.4z" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".4"/>' +
        '<circle cx="0" cy="58" r="6.4" fill="none" stroke="' + P.gold + '" stroke-width="2.6"/><circle cx="0" cy="58" r="6.4" fill="none" stroke="' + P.goldl + '" stroke-width=".4"/><circle class="bud-c bud-pls" style="--d:2.4s" cx="0" cy="58" r="3.2" fill="url(#' + u + 'gm)"/></g>' + p[1];
    },
    top: function (P) {
      return '<path d="' + BUD_HOOD + '" fill="' + P.km + '" stroke="' + P.gold + '" stroke-width="1.3"/><path d="' + BUD_HOODIN + '" fill="none" stroke="' + P.gold2 + '" stroke-width="1" opacity=".8"/>' +
        '<g transform="translate(50 20)"><circle cx="0" cy="-3" r="2.6" fill="none" stroke="' + P.gold + '" stroke-width="1.1"/><path d="M0 -.4V6M0 3.4h1.8M0 5.4h2.4" stroke="' + P.gold + '" stroke-width="1.1" stroke-linecap="round"/></g>';
    },
    fore: function () { return budTwinkles([[12, 84, 2.4], [88, 78, 2.8], [86, 110, 1.8], [14, 110, 1.6]], '#99F6E4', 63); }
  };

  /* Moonrise (Radiant): silver armor with a crescent on the chest, a crescent circlet, a cloak of night full of stars, and a
     white rabbit hopping at your feet. Over your shoulder the moon shows tonight's real phase (it is worked out from the date
     each time the drawing is made), a ring of every phase of the moon turns round you, clouds drift past and stardust falls */
  BUD_SKINS.moonrise = {
    eyes: 'open', mouth: 'smile', hat: false,
    pal: function (P) { P.ar = '#EEF2FF'; P.ar2 = '#C7D2FE'; P.ar3 = '#A5B4FC'; P.arl = '#3B4A85'; P.ng = '#141B3D'; P.arm = P.ar; P.armline = P.arl; P.cuff = P.ar2; P.pants = '#E0E7FF'; P.shoe = P.ar; P.sole = P.arl; P.ir1 = '#1E1B4B'; P.ir2 = '#6366F1'; P.ir3 = '#E0E7FF'; return P; },
    defs: function (P, u) {
      return '<radialGradient id="' + u + 'mg"><stop offset="0" stop-color="#E0E7FF" stop-opacity=".75"/><stop offset=".45" stop-color="#A5B4FC" stop-opacity=".25"/><stop offset="1" stop-color="#A5B4FC" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + u + 'mn" cx=".4" cy=".35"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#E2E8F0"/><stop offset="1" stop-color="#C7D2FE"/></radialGradient>' +
        '<linearGradient id="' + u + 'am" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="' + P.ar + '"/><stop offset="1" stop-color="' + P.ar2 + '"/></linearGradient>' +
        '<pattern id="' + u + 'ns" patternUnits="userSpaceOnUse" width="12" height="12"><rect width="12" height="12" fill="' + P.ng + '"/><circle cx="2" cy="3" r=".5" fill="#FFFFFF"/><circle cx="8.4" cy="1.6" r=".35" fill="#C7D2FE"/><circle cx="6" cy="8.6" r=".45" fill="#FFFFFF"/><circle cx="10.6" cy="10.4" r=".3" fill="#E0E7FF"/></pattern>';
    },
    aura: function (P, u) {
      var ph = cpMoon(), lit = cpMoonD(81, 14, 15, ph), ring = budRing(0, 0, 47, 8, function (a, x, y, i) { var d = cpMoonD(x, y, 3.8, i / 8 + 0.0001); return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="3.8" fill="#1B2350" stroke="#C7D2FE" stroke-width=".4"/>' + (d ? '<path d="' + d + '" fill="#F1F5F9"/>' : ''); });
      return '<circle class="bud-c bud-pls" style="--d:4.6s" cx="50" cy="44" r="64" fill="url(#' + u + 'mg)"/>' +
        '<circle class="bud-c bud-pls" style="--d:3.6s" cx="81" cy="14" r="26" fill="url(#' + u + 'mg)"/><circle cx="81" cy="14" r="15" fill="#1B2350"/><circle cx="81" cy="14" r="15" fill="none" stroke="#C7D2FE" stroke-width=".5" opacity=".7"/>' + (lit ? '<path d="' + lit + '" fill="url(#' + u + 'mn)"/>' : '') +
        '<g opacity=".22" fill="#64748B"><circle cx="76" cy="10" r="2"/><circle cx="86" cy="18" r="2.6"/><circle cx="83" cy="7" r="1.2"/><circle cx="77" cy="20" r="1.4"/></g>' +
        '<g transform="translate(50 50)"><g class="bud-c bud-rot" style="--d:64s">' + ring + '</g></g>' +
        '<g class="bud-c bud-bob" style="--d:6s">' + budCloud(14, 64, 7) + '</g><g class="bud-c bud-bob" style="--d:7s;--dl:-3s">' + budCloud(88, 50, 6) + '</g>' +
        budTwinkles([[8, 20, 2.6], [92, 14, 3], [96, 80, 2.2], [4, 92, 2], [24, 4, 1.8], [78, 2, 2]], '#FFFFFF', 71) +
        budParts(12, [8, 92, 0, 50], function (x, y, i, c) { return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(0.5 + c * 0.8) + '" fill="' + (i % 2 ? '#FFFFFF' : '#C7D2FE') + '"/>'; }, { d: 5, dy: -60, dx: 6, seed: 73 });
    },
    back: function (P, u) { return '<path class="bud-wave"' + cpOrg(50, 80, '--d:3.4s') + ' d="M37 78C31 88 25 100 20 114H80C75 100 69 88 63 78Z" fill="url(#' + u + 'ns)" stroke="' + P.ar2 + '" stroke-width="1" stroke-linejoin="round"/>'; },
    torso: function (P, u) {
      return '<path d="' + BUD_TORSO + '" fill="url(#' + u + 'am)" stroke="' + P.arl + '" stroke-width="1.3" stroke-linejoin="round"/><path d="M34.4 80.4C33.6 86 32.6 92 31.8 97.8C31.6 99.6 32.2 100.8 33.4 101.6C34.8 94 35.4 86 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.ar2 + '" opacity=".7"/>' +
        '<path d="M39.6 77.2Q50 82.6 60.4 77.2" fill="none" stroke="' + P.ar3 + '" stroke-width="1.6"/><path d="M53.6 82.4a6.4 6.4 0 1 0 0 11.2a5 5 0 1 1 0-11.2z" fill="' + P.ar2 + '" stroke="' + P.arl + '" stroke-width=".8"/><circle class="bud-c bud-glw" style="--d:2.6s" cx="52.6" cy="88" r="1.6" fill="' + budMix(P.c, '#FFFFFF', 0.3) + '"/>' +
        '<rect x="32.6" y="95.4" width="34.8" height="3.8" rx="1.4" fill="' + P.ar2 + '" stroke="' + P.arl + '" stroke-width=".8"/><circle cx="50" cy="97.3" r="1.8" fill="#FFFFFF" stroke="' + P.arl + '" stroke-width=".6"/>';
    },
    arm: function (P, side, u) {
      var m = side < 0 ? -1 : 1, sx = 50 + m * 12.8, ex = 50 + m * 18.4, hx = 50 + m * 19;
      return budLimb(sx, 80.6, ex, 92.4, 7.2, P.ar, P.arl) + '<path d="M' + budP(ex - m * 4, 88.8) + 'L' + budP(ex + m * 3.6, 87.6) + 'L' + budP(ex + m * 4.4, 93.6) + 'L' + budP(ex - m * 3.6, 94.4) + 'Z" fill="' + P.ar2 + '" stroke="' + P.arl + '" stroke-width=".9" stroke-linejoin="round"/>' +
        '<circle cx="' + budN(hx) + '" cy="96.6" r="3.8" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1.1"/>' +
        '<path d="M' + budP(sx - m * 4.4, 79.8) + 'C' + budP(sx - m * 2, 74.2) + ' ' + budP(sx + m * 5.4, 74.4) + ' ' + budP(sx + m * 7.8, 80.6) + 'C' + budP(sx + m * 4, 79.2) + ' ' + budP(sx, 79.8) + ' ' + budP(sx - m * 4.4, 79.8) + 'Z" fill="url(#' + u + 'am)" stroke="' + P.arl + '" stroke-width="1"/>';
    },
    top: function (P) {
      var band = 'M24.4 41C31.8 34.6 40.8 32 50 32C59.2 32 68.2 34.6 75.6 41';
      return '<path d="' + band + '" fill="none" stroke="' + P.arl + '" stroke-width="3.6" stroke-linecap="round"/><path d="' + band + '" fill="none" stroke="' + P.ar2 + '" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M53.4 21.6a7.4 7.4 0 1 0 0 12.8a5.8 5.8 0 1 1 0-12.8z" fill="#F1F5F9" stroke="' + P.arl + '" stroke-width=".8"/><circle class="bud-c bud-glw" style="--d:2.2s" cx="50" cy="31.6" r="1.6" fill="' + budMix(P.c, '#FFFFFF', 0.35) + '"/>';
    },
    fore: function () {
      return '<g class="bud-c bud-bob" style="--d:1.6s"><g transform="translate(80 113)"><ellipse cx="0" cy="-4" rx="5.4" ry="4" fill="#FFFFFF" stroke="#94A3B8" stroke-width=".5"/><circle cx="4.4" cy="-7.4" r="3" fill="#FFFFFF" stroke="#94A3B8" stroke-width=".5"/><ellipse cx="3.6" cy="-13" rx="1" ry="3.4" fill="#FFFFFF" stroke="#94A3B8" stroke-width=".4" transform="rotate(-10 3.6 -13)"/><ellipse cx="5.6" cy="-12.6" rx="1" ry="3.4" fill="#FFFFFF" stroke="#94A3B8" stroke-width=".4" transform="rotate(12 5.6 -12.6)"/><circle cx="5.6" cy="-7.8" r=".6" fill="#F472B6"/><circle cx="-5" cy="-4" r="1.4" fill="#FFFFFF"/></g></g>' +
        budTwinkles([[14, 86, 2.4], [90, 92, 2], [20, 112, 1.6]], '#E0E7FF', 77);
    },
    fx: function () { return '<g class="bud-fx bud-burst"><path d="' + budRays(50, 54, 14, 70, 20, 5, 0.6) + '" fill="#E0E7FF" opacity=".9"/><circle cx="50" cy="54" r="20" fill="none" stroke="#FFFFFF" stroke-width="2"/></g>'; }
  };

  BUD_WHO.sleuth = { mood: 'Sharp-eyed and curious', tap: [['think', 'Elementary!'], ['idea', 'Aha! A clue!'], ['look', 'Hmm. What do we have here?'], ['smug', 'Case closed.']], idle: ['look', 'think', 'idea'], right: ['idea', 'Case solved!'], miss: ['think', 'Every clue counts. On to the next one.'] };
  BUD_WHO.origami = { mood: 'Neat, nimble and full of surprises', tap: [['spin', 'Fold, fold… ta-da!'], ['wave', 'Crisp and ready!'], ['giggle', 'I crinkle when I laugh.'], ['cool', 'Sharp creases only.']], idle: ['spin', 'look', 'wave'], right: ['cheer', 'Perfect fold!'], miss: ['nod', 'Unfold it and try again.'] };
  BUD_WHO.spy = { mood: 'Cool, quiet and always on a mission', tap: [['cool', 'Mission: ace this test.'], ['wink', 'This note will self-destruct. Kidding.'], ['smug', 'Agent on duty.'], ['look', 'Scanning for spies… all clear.']], idle: ['look', 'cool', 'smug'], right: ['cool', 'Mission accomplished.'], miss: ['nod', 'Regroup. New plan.'] };
  BUD_WHO.tale = { mood: 'Warm, wise and full of stories', tap: [['think', 'Once upon a time…'], ['love', 'Every page is a new adventure.'], ['wave', 'Gather round!'], ['idea', 'Ooh, plot twist!']], idle: ['look', 'think', 'wave'], right: ['cheer', 'What a chapter!'], miss: ['nod', 'Every hero stumbles in chapter two.'] };
  BUD_WHO.keymaster = { mood: 'Mysterious, patient and kind', tap: [['cast', 'Every lock has a key.'], ['think', 'The answer hides in plain sight.'], ['wink', 'Psst… I know the code.'], ['power', 'Unlocked!']], idle: ['think', 'look', 'cast'], right: ['cast', 'Unlocked!'], miss: ['nod', 'Try another key.'] };
  BUD_WHO.moonrise = { mood: 'Calm, bright and full of wonder', tap: [['shine', 'The moon is cheering for you.'], ['look', 'Look up tonight. That is my moon.'], ['wave', 'Good evening, star student.'], ['love', 'Shine on.']], idle: ['shine', 'look', 'stretch'], right: ['shine', 'Over the moon!'], miss: ['nod', 'Even the moon has phases.'] };

  /* ---------- the six Radiant looks' arrivals (radiant.js plays one when the prize is won; each ends by 5.4 seconds) ---------- */
  Z_COL.shipbottle = '125,211,252'; Z_COL.hidden = '253,224,71'; Z_COL.maze = '165,180,252'; Z_COL['prize-astro'] = '252,211,77'; Z_COL.dolls = '248,113,113'; Z_COL.moonrise = '199,210,254';
  /* Ship in a bottle: the bottle comes up out of the dark, the storm breaks inside it, and it clears to a rainbow */
  Z_SCENE.shipbottle = function (s) {
    var u = Math.min(s.w / 340, s.h / 300, 1.7), sw = 330 * u, sh = 190 * u, sub = zSub(FX_AURA.shipbottle, sw, sh);
    return function (t, dt, k) {
      var c = s.ctx, a = fxEnv(t, 0.8, 1.6, 99, 100) * k, g = fxEase((t - 0.8) / 1.8);
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '125,211,252', s.w / 2, s.h * 0.55, s.w * 0.6 * g, 0.18 * a);
      sub.step(t * 1.6 + 5, dt * 1.6); zBlit(c, sub, (s.w - sw) / 2, s.h * 0.5 - sh * 0.56, a, 0.6 + 0.4 * g, s.w / 2, s.h * 0.55);
    };
  };
  /* Hidden world: an answer waits in the dark, and the key, the keyhole and the world behind it all happen round it */
  Z_SCENE.hidden = function (s) {
    var kb = { x: s.w * 0.12, y: s.h * 0.56, w: s.w * 0.76, h: 58 }, d; kb.cx = kb.x + kb.w / 2; kb.cy = kb.y + kb.h / 2; d = FX_DRAW.hidden(s, kb);
    return function (t, dt, k) {
      var c = s.ctx, a = fxEnv(t, 0.6, 1.0, 99, 100) * k;
      if (t > 0.6) { c.save(); c.globalAlpha = k; d((t - 0.6) * 1.18, dt * 1.18); c.restore(); fxClean(c); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.fillStyle = '#1C1708'; c.beginPath(); fxRR(c, kb.x, kb.y, kb.w, kb.h, 12); c.fill(); c.strokeStyle = '#FCD34D'; c.lineWidth = 1.4; c.stroke();
      c.fillStyle = '#FEF3C7'; c.font = '700 15px ' + FX_MONO; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('B', kb.x + 18, kb.cy); c.font = '600 15px system-ui, sans-serif'; c.fillText('Correct', kb.x + 42, kb.cy); c.globalAlpha = 1;
    };
  };
  /* Labyrinth: the rings of the maze grow out of the dark and a spark races through them to the middle */
  Z_SCENE.maze = function (s) {
    var sub = zSub(FX_PAPER.maze, s.w, s.h, { dark: true, fast: 5 });
    return function (t, dt, k) { var a = fxEnv(t, 0.4, 1.4, 99, 100) * k; sub.step(t, dt); zBlit(s.ctx, sub, 0, 0, a); };
  };
  /* Astronomical clock: the clock comes up out of the night at your real time, its doors open and the figures parade */
  Z_SCENE['prize-astro'] = function (s) {
    var sub = zSub(FX_LIVING['prize-astro'], s.w, s.h, { parade: 0.4, lit: 0.95 });
    return function (t, dt, k) {
      var c = s.ctx, a = fxEnv(t, 0.5, 1.6, 99, 100) * k;
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.fillStyle = '#070B1C'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1;
      sub.step(t * 3, dt * 3); zBlit(c, sub, 0, 0, a);
    };
  };
  /* Nesting dolls: a gold doll stands in the dark and opens, and a smaller one steps out of her, and so on down to the
     smallest, who holds a gold egg; then they all stand in a row and glow */
  function cpDoll(c, x, y, h, col, face, top, lift) {
    var w = h * 0.62, hr = w * 0.34, by = y;
    function shape() { c.beginPath(); c.moveTo(x - w * 0.5, by); c.bezierCurveTo(x - w * 0.56, by - h * 0.5, x - w * 0.42, by - h * 0.66, x - hr * 0.95, by - h * 0.7); c.arc(x, by - h * 0.7, hr * 1.02, Math.PI - 0.2, 0.2); c.bezierCurveTo(x + w * 0.42, by - h * 0.66, x + w * 0.56, by - h * 0.5, x + w * 0.5, by); c.closePath(); }
    c.save(); if (top) { c.translate(0, -lift); } c.beginPath(); if (top) { c.rect(x - w, by - h * 1.2, w * 2, h * 0.75); } else { c.rect(x - w, by - h * 0.45, w * 2, h * 0.5); } c.clip();
    c.fillStyle = col; shape(); c.fill(); c.strokeStyle = 'rgba(40,15,5,.8)'; c.lineWidth = Math.max(1, h * 0.02); c.stroke();
    if (top || face) { c.fillStyle = '#FDE7D3'; c.beginPath(); c.ellipse(x, by - h * 0.78, hr * 0.66, hr * 0.56, 0, 0, FX_TAU); c.fill(); c.fillStyle = 'rgba(251,113,133,.7)'; c.beginPath(); c.arc(x - hr * 0.32, by - h * 0.74, hr * 0.12, 0, FX_TAU); c.arc(x + hr * 0.32, by - h * 0.74, hr * 0.12, 0, FX_TAU); c.fill(); c.fillStyle = '#1C1917'; c.beginPath(); c.arc(x - hr * 0.22, by - h * 0.8, hr * 0.06, 0, FX_TAU); c.arc(x + hr * 0.22, by - h * 0.8, hr * 0.06, 0, FX_TAU); c.fill(); }
    c.fillStyle = '#FEF3C7'; c.beginPath(); c.arc(x, by - h * 0.32, w * 0.2, 0, FX_TAU); c.fill(); c.fillStyle = '#F472B6'; c.beginPath(); c.arc(x, by - h * 0.32, w * 0.08, 0, FX_TAU); c.fill();
    c.restore();
    if (top) { c.strokeStyle = 'rgba(253,230,138,.9)'; c.lineWidth = Math.max(1, h * 0.015); c.beginPath(); c.moveTo(x - w * 0.52, by - h * 0.45 - lift); c.lineTo(x + w * 0.52, by - h * 0.45 - lift); c.stroke(); }
  }
  Z_SCENE.dolls = function (s) {
    var COL = ['#FBBF24', '#DC2626', '#2563EB', '#16A34A', '#9333EA'], H0 = Math.min(s.h * 0.34, s.w * 0.42), St = [], i;
    for (i = 0; i < 60; i++) { St.push({ x: Math.random() * s.w, y: Math.random() * s.h, p: fxR(0, 6), z: fxR(0.5, 1.4) }); }
    return function (t, dt, k) {
      var c = s.ctx, a = fxEnv(t, 0.7, 1.2, 99, 100) * k, cx = s.w / 2, gy = s.h * 0.66, step = 0.62, j;
      c.globalCompositeOperation = 'lighter'; St.forEach(function (q) { fxGlow(c, '253,230,138', q.x, q.y, 1.6 * q.z, (0.2 + 0.3 * Math.sin(t * 2 + q.p)) * a); }); fxGlow(c, '253,186,116', cx, gy - H0 * 0.5, H0 * 1.4, 0.2 * a);
      c.globalCompositeOperation = 'source-over';
      var row = fxEase((t - 4.3) / 0.7);
      for (j = 0; j < 5; j++) {
        var h = H0 * Math.pow(0.78, j), t0 = 1.0 + j * step, open = fxEase((t - t0) / 0.45), out = j === 0 ? 1 : fxEase((t - (t0 - step + 0.2)) / 0.4), x = cx + (j - 2) * H0 * 0.42 * row, vis = j < 4 ? 1 - fxEase((t - (t0 + 0.55)) / 0.3) : 1;
        if (row > 0.01) { c.globalAlpha = a * row; cpDoll(c, x, gy, h, COL[j], 1, 0, 0); cpDoll(c, x, gy, h, COL[j], 1, 1, 0); }
        else { if (out <= 0 || vis <= 0) { continue; } c.globalAlpha = a * Math.min(1, out * 1.4) * vis; if (j < 4 && open > 0) { cpDoll(c, x, gy, h, COL[j], 0, 0, 0); cpDoll(c, x, gy, h, COL[j], 0, 1, open * h * 0.9); } else { cpDoll(c, x, gy, h, COL[j], 1, 0, 0); cpDoll(c, x, gy, h, COL[j], 1, 1, 0); }
          if (open > 0 && open < 1 && j < 4) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '255,247,214', x, gy - h * 0.45, h * 0.5, 0.6 * Math.sin(open * Math.PI) * a); c.globalCompositeOperation = 'source-over'; } }
        if (j === 4 && t > t0 + 0.2) { var eg = fxEase((t - t0 - 0.2) / 0.5), ex = x + h * 0.42, ey = gy - h * 0.16; c.globalAlpha = a; c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', ex, ey, h * 0.5 * eg, 0.8 * eg * a); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#FDE68A'; c.beginPath(); c.ellipse(ex, ey, h * 0.08 * eg, h * 0.1 * eg, 0, 0, FX_TAU); c.fill(); }
      }
      c.globalAlpha = 1;
      if (row > 0) { c.globalCompositeOperation = 'lighter'; for (j = 0; j < 5; j++) { var hx = cx + (j - 2) * H0 * 0.42 * row; fxGlow(c, '253,224,71', hx, gy - H0 * Math.pow(0.78, j) * 0.5, H0 * 0.5, 0.25 * row * a); } c.globalCompositeOperation = 'source-over'; }
    };
  };
  /* Moonrise: night over still water. The moon rises behind a figure on a rock, running through all its phases to stop on
     tonight's, its path of light spreads across the water, and the figure's edge turns silver */
  Z_SCENE.moonrise = function (s) {
    var W = s.w, H = s.h, hy = H * 0.66, R = Math.min(W, H) * 0.11, cx = W / 2, fig = Math.min(H * 0.16, W * 0.2), ST = [], i, girl = false, ph = cpMoon();
    try { girl = roomGet().av[3] === 'g'; } catch (e) { girl = false; }
    for (i = 0; i < 90; i++) { ST.push({ x: Math.random(), y: Math.random() * 0.62, p: fxR(0, 6), z: fxR(0.5, 1.4) }); }
    return function (t, dt, k) {
      var c = s.ctx, a = fxEnv(t, 0.4, 1.0, 99, 100) * k, rise = fxEase((t - 0.9) / 2.4), my = hy + R * 1.2 - (H * 0.36) * rise, mp = rise < 1 ? ph + (1 - rise) * 2 : ph, j;
      mp = mp - Math.floor(mp);
      c.globalCompositeOperation = 'lighter'; ST.forEach(function (q) { fxGlow(c, '226,232,255', q.x * W, q.y * H, 1 + q.z, (0.25 + 0.4 * Math.sin(t * 2.4 + q.p)) * a); });
      fxGlow(c, '199,210,254', cx, my, R * 5, 0.3 * rise * a); fxGlow(c, '255,255,255', cx, my, R * 1.6, 0.4 * rise * a);
      /* the moon in its phase */
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.save(); c.beginPath(); c.rect(0, 0, W, hy); c.clip();
      c.fillStyle = '#1B2350'; c.beginPath(); c.arc(cx, my, R, 0, FX_TAU); c.fill();
      var kk = Math.cos(mp * FX_TAU), rx = Math.abs(kk) * R, wax = mp < 0.5;
      if (mp > 0.02 && mp < 0.98) { c.fillStyle = '#F1F5F9'; c.beginPath(); c.arc(cx, my, R, -Math.PI / 2, Math.PI / 2, !wax); c.ellipse(cx, my, Math.max(0.1, rx), R, 0, Math.PI / 2, -Math.PI / 2, wax ? kk > 0 : kk <= 0); c.fill(); }
      c.restore();
      /* the water, the moon's path on it, the far shore and the rock */
      var wg = c.createLinearGradient(0, hy, 0, H); wg.addColorStop(0, '#111A3F'); wg.addColorStop(1, '#05070F'); c.fillStyle = wg; c.globalAlpha = a; c.fillRect(0, hy, W, H - hy);
      c.globalCompositeOperation = 'lighter'; for (j = 0; j < 22; j++) { var yy = hy + 4 + j * (H - hy) / 22, ww = (8 + j * 5) * rise * (0.7 + 0.3 * Math.sin(t * 3 + j)); c.fillStyle = 'rgba(226,232,255,' + (0.5 * rise * a * (1 - j / 26)).toFixed(3) + ')'; c.fillRect(cx - ww / 2 + Math.sin(t * 2 + j * 1.7) * 4, yy, ww, 1.6); }
      c.globalCompositeOperation = 'source-over'; c.fillStyle = '#0B1028'; c.beginPath(); c.moveTo(0, hy); for (j = 0; j <= 12; j++) { c.lineTo(j / 12 * W, hy - (6 + 10 * Math.abs(Math.sin(j * 1.3))) * (j % 4 === 0 ? 1.6 : 1)); } c.lineTo(W, hy); c.closePath(); c.fill();
      c.fillStyle = '#05060D'; c.beginPath(); c.moveTo(cx - fig * 0.9, hy + fig * 0.18); c.quadraticCurveTo(cx - fig * 0.6, hy - fig * 0.12, cx, hy - fig * 0.1); c.quadraticCurveTo(cx + fig * 0.6, hy - fig * 0.12, cx + fig * 0.9, hy + fig * 0.18); c.closePath(); c.fill();
      /* the figure, edged in silver as the moon comes up behind */
      var rim = fxEase((t - 2.2) / 1.0) * a; if (rim > 0) { c.globalCompositeOperation = 'lighter'; zHero(c, cx, hy - fig * 0.1, fig, girl, t, '#C7D2FE', 1 + 5 / fig, rim * 0.9); }
      c.globalCompositeOperation = 'source-over'; zHero(c, cx, hy - fig * 0.1, fig, girl, t, '#05040B', 1, a);
      /* a rabbit hops onto the rock beside the figure */
      var rb = fxEase((t - 3.0) / 0.6), rx2 = cx + fig * 0.62 + (1 - rb) * fig * 1.2, ry2 = hy - fig * 0.12 - Math.abs(Math.sin(t * 7)) * fig * 0.06 * (1 - rb); if (rb > 0) { c.globalAlpha = rb * a; c.fillStyle = '#05040B'; c.beginPath(); c.ellipse(rx2, ry2 - fig * 0.06, fig * 0.09, fig * 0.06, 0, 0, FX_TAU); c.arc(rx2 + fig * 0.06, ry2 - fig * 0.13, fig * 0.045, 0, FX_TAU); c.fill(); c.beginPath(); c.ellipse(rx2 + fig * 0.055, ry2 - fig * 0.22, fig * 0.014, fig * 0.06, -0.1, 0, FX_TAU); c.ellipse(rx2 + fig * 0.08, ry2 - fig * 0.21, fig * 0.014, fig * 0.06, 0.2, 0, FX_TAU); c.fill(); c.globalAlpha = 1; }
      var em = t - 3.4; if (em > 0 && em < 1.2) { var e = Math.sin(Math.min(1, em / 1.2) * Math.PI), ey = hy - fig * 0.42; c.globalCompositeOperation = 'lighter'; fxGlow(c, '199,210,254', cx, ey, fig * 0.7, 0.7 * e * a); fxStar4(c, cx + fig * 0.06, ey, fig * 0.36 * e, e * a, '#F8FAFF'); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    };
  };
