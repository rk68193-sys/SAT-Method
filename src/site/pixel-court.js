  /* =================== 8-Bit and Royal Court, and five more Radiant looks (prizes.js) =================== */
  /* Thirty looks, one of every kind at every tier. 8-Bit is drawn in chunky pixels, like an old game: a save point, a boss
     fight, a side-scroller, a world map. Royal Court is kings, queens and knights: a chess game, a great bell, an empty throne,
     a castle on a hill. The five Radiant looks are a carousel, a garden that blooms round the answer, a shadow-puppet show, a
     library at midnight and an owl made of stars. Every one is a whole scene built in layers (a floor, a centerpiece, things in
     orbit, rising sparks, words that appear) with a moment it builds to. They add themselves to the registries in fx.js and
     draw with the helpers in radiant.js (z...), gems-weather.js (gw...) and looks.js (lk...). */

  /* ---------- helpers ---------- */
  /* pixel art. A sprite is rows of letters, each letter a color in pal ('.' is clear); p is the size of one pixel. A run of one
     color is drawn as one rectangle, a hair oversize, so no seams show when the drawing is scaled */
  function bcSpr(c, rows, pal, x, y, p, flip) {
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r], n = row.length;
      for (var q = 0; q < n; q++) {
        var ch = row.charAt(q); if (ch === '.') { continue; }
        var run = 1; while (q + run < n && row.charAt(q + run) === ch) { run++; }
        c.fillStyle = pal[ch]; c.fillRect(flip ? x + (n - q - run) * p : x + q * p, y + r * p, run * p + 0.35, p + 0.35); q += run - 1;
      }
    }
  }
  function bcPx(c, x, y, p, col, w, h) { c.fillStyle = col; c.fillRect(x, y, (w || 1) * p + 0.35, (h || 1) * p + 0.35); }
  /* every color of a sprite's palette turned to one color, for the frame it flashes */
  function bcFlash(pal, col) { var w = {}; Object.keys(pal).forEach(function (k) { w[k] = col || '#FFFFFF'; }); return w; }
  /* a 3 by 5 pixel font: each letter is five rows, each row a number from 0 to 7 (its three pixels as bits) */
  var BC_FONT = { A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755', I: '72227', J: '11152', K: '55655', L: '44447', M: '57755', N: '65555', O: '25552', P: '65644', Q: '25563', R: '65655', S: '34216', T: '72222', U: '55557', V: '55552', W: '55775', X: '55255', Y: '55222', Z: '71247',
    0: '75557', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34757', 7: '71222', 8: '75757', 9: '75716', '!': '22202', '+': '02720', '-': '00700', '.': '00002', x: '05250', ':': '02020', '/': '11244' };
  /* a line of pixel text centered on x, its top at y */
  function bcText(c, str, x, y, p, col, a) {
    str = String(str); var x0 = x - (str.length * 4 - 1) * p / 2; c.globalAlpha = a === undefined ? 1 : Math.max(0, Math.min(1, a)); c.fillStyle = col;
    for (var i = 0; i < str.length; i++) { var g = BC_FONT[str.charAt(i)]; if (!g) { continue; } for (var r = 0; r < 5; r++) { var b = +g.charAt(r); for (var q = 0; q < 3; q++) { if (b & (4 >> q)) { c.fillRect(x0 + (i * 4 + q) * p, y + r * p, p + 0.35, p + 0.35); } } } }
    c.globalAlpha = 1;
  }
  /* a pixel spark: a plus sign that opens and closes in four steps (f is 0 to 3) */
  function bcSpark(c, x, y, p, f, col) { c.fillStyle = col; c.fillRect(x, y, p, p); if (f === 1 || f === 3) { c.fillRect(x - p, y, p * 3, p); c.fillRect(x, y - p, p, p * 3); } if (f === 2) { c.fillRect(x - p * 2, y, p * 5, p); c.fillRect(x, y - p * 2, p, p * 5); } }
  /* is the page behind a paper dark? A Radiant arrival draws the paper on its own dark screen and says so in s.opt */
  function bcDark(s) { return s.opt && s.opt.dark !== undefined ? !!s.opt.dark : FX_INK.dark; }
  var BC_HEART = ['.aa.aa.', 'aaaaaaa', 'aaaaaaa', '.aaaaa.', '..aaa..', '...a...'];
  var BC_CRY = ['...w...', '..wcc..', '.wcccb.', 'wccccbb', 'wcccbbb', 'wccbbbd', 'cccbbbd', '.cbbbd.', '.cbbdd.', '..bdd..', '...d...'];
  var BC_KNIGHT = ['..rr.....', '.hhhh....', '.hkkh....', '.hhhh....', 'bbaaab...', 'baaaab...', 'baaaab...', '.aaaa....', '.a..a....', '.a..a....', 'bb..bb...'];
  var BC_DRAGON = ['....................', '.....G..G...........', '....gggggg.....ww...', '...ggeggggg...wwww..', '..gggggggggg.wwwwww.', '.gggggggggggWwwwwww.', '.gttGggggggggWwwww..', '..GGG.gggggggggWW...', '......ggggggggggg...', '.....gyyyygggggggg..', '.....gyyyyyggggggggg', '......GyyyyGG.GGGGG.', '......GG..GG....GGG.', '.....GGG.GGG......G.'];
  var BC_BAT = [['bb.....bb', 'bbb.b.bbb', '.bbbbbbb.', '..bbrbb..', '...b.b...'], ['...b.b...', '..bbbbb..', '.bbbrbbb.', 'bbbbbbbbb', 'bb..b..bb']];

  /* ---------- stage auras: a scene above the streak, in a box 330 wide and 190 tall with the ground at y = 160 ---------- */
  /* Save point (8-Bit, Common): a crystal turns above a stone pedestal in a torch-lit pixel dungeon. Every few seconds the game
     saves: sparks are drawn in from the dark, the runes on the floor light one by one, the bar fills, the hearts refill, and the
     crystal flashes as the words change to GAME SAVED */
  gwStage('savepoint', function () {
    var P = 3, Br = [], Mo = [], i, j, C = 10, PAL = { w: '#F0FDFF', c: '#A5F3FC', b: '#22D3EE', d: '#2563EB' }, HOT = { w: '#FFFFFF', c: '#FFFFFF', b: '#CFFAFE', d: '#67E8F9' };
    var DISK = ['bbbbbbb.', 'bwwwwkbb', 'bwwwwkbb', 'bbbbbbbb', 'bkkkkkkb', 'bkwwwwkb', 'bkwwwwkb', 'bbbbbbbb'], DP = { b: '#818CF8', w: '#E0E7FF', k: '#1E1B4B' };
    for (j = 0; j < 15; j++) { for (i = 0; i < 19; i++) { var bx = -171 + i * 18 + (j % 2) * 9, by = 16 + j * 9, d = Math.hypot(bx + 9, (by - 84) * 1.25) / 172; if (d < 1) { Br.push([bx, by, (1 - d) * (0.5 + 0.5 * fxRnd(i * 31 + j * 7)), fxRnd(i + j * 13) < 0.1]); } } }
    for (i = 0; i < 22; i++) { Mo.push({ a: fxR(0, FX_TAU), r: fxR(50, 150), sp: fxR(0.6, 1.4), x: fxR(-48, 48), u: Math.random() }); }
    function sn(v) { return Math.round(v / P) * P; }
    return function (c, t, dt) {
      var cyc = (t + (FX_REDUCE ? 3 : 0)) % C, sv = Math.max(0, Math.min(1, (cyc - 1.2) / 3.6)), done = cyc - 4.8, lit = done > 0 ? Math.min(1, (C - cyc) / 1.2) : 0, fl = done > 0 && done < 0.5 ? 1 - done / 0.5 : 0, fr = Math.floor(t * 8), k, cy = sn(88 + Math.sin(t * 1.6) * 5), saving = sv > 0 && done <= 0;
      /* the wall: bricks lit by the torches and the crystal, and the alcove behind it */
      Br.forEach(function (b) { c.globalAlpha = Math.min(1, b[2] * (0.78 + 0.22 * lkNoise(t * 3 + b[0])) + fl * 0.35); c.fillStyle = b[3] ? '#3F3A7A' : '#2B2760'; c.fillRect(b[0], b[1], 17, 8); c.fillStyle = 'rgba(165,180,252,.3)'; c.fillRect(b[0], b[1], 17, 1); });
      c.globalAlpha = 1; c.fillStyle = '#0B0920'; for (k = 0; k < 6; k++) { c.fillRect(-(21 + k * 3), 58 + k * 3, (21 + k * 3) * 2, 3); } c.fillRect(-36, 76, 72, 84);
      [-87, 87].forEach(function (tx, n) {
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,146,60', tx, 70, 44 + 6 * lkNoise(t * 7 + n * 9), 0.42); c.globalCompositeOperation = 'source-over';
        c.fillStyle = '#78350F'; c.fillRect(tx - 3, 80, 6, 15); c.fillStyle = '#B45309'; c.fillRect(tx - 6, 77, 12, 3);
        for (k = -2; k <= 2; k++) { var fh = Math.max(1, Math.round((3.2 - Math.abs(k)) * (1.5 + 0.7 * lkNoise(fr * 0.9 + k * 3 + n * 5)))); for (j = 0; j < fh; j++) { c.fillStyle = j < fh * 0.35 ? '#FDE047' : j < fh * 0.7 ? '#FB923C' : '#EF4444'; c.fillRect(tx + k * P - 1.5, 74 - j * P, P, P); } }
      });
      /* floor tiles, and the ring of runes that lights as the game saves */
      for (k = 0; k < 14; k++) { c.fillStyle = k % 2 ? '#231F52' : '#1A1742'; c.fillRect(-168 + k * 24, 160, 24, 12); c.fillStyle = k % 2 ? '#1A1742' : '#231F52'; c.fillRect(-168 + k * 24, 172, 24, 18); }
      c.fillStyle = '#4F46E5'; c.fillRect(-165, 159, 330, 2);
      for (k = 0; k < 14; k++) { var ra = k / 14 * FX_TAU - Math.PI / 2, on = (saving && sv * 14 > k) || lit > 0, rx = sn(Math.cos(ra) * 87), ry = sn(174 + Math.sin(ra) * 10); if (on) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '103,232,249', rx, ry, 9, 0.5 * (lit || 1)); c.globalCompositeOperation = 'source-over'; } bcSpark(c, rx - 1.5, ry - 1.5, P, on ? 1 : 0, on ? ((fr + k) % 7 === 0 ? '#FFFFFF' : '#67E8F9') : '#3730A3'); }
      /* the pedestal and the crystal over it */
      c.fillStyle = '#4B4880'; c.fillRect(-27, 151, 54, 9); c.fillStyle = '#5E5AA6'; c.fillRect(-21, 142, 42, 9); c.fillStyle = '#716DC0'; c.fillRect(-15, 133, 30, 9); c.fillStyle = 'rgba(224,231,255,.55)'; c.fillRect(-15, 133, 30, 2); c.fillRect(-21, 142, 6, 2); c.fillRect(15, 142, 6, 2); c.fillRect(-27, 151, 6, 2); c.fillRect(21, 151, 6, 2);
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '34,211,238', 0, cy + 22, 44 + 26 * sv + 60 * fl, 0.45 + 0.3 * sv); lkBeam(c, 0, cy + 22, Math.PI / 2, 46, 0.34, '103,232,249', 0.18 + 0.2 * sv); c.globalCompositeOperation = 'source-over';
      bcSpr(c, BC_CRY, fl > 0 || (saving && fr % 4 === 0) ? HOT : PAL, -14, cy, 4);
      if (fr % 12 < 7) { bcPx(c, -14 + (fr % 12) * 4, cy + 12 + ((fr % 12) % 3) * 4, 4, 'rgba(255,255,255,.85)'); }
      Mo.forEach(function (m, n) {
        if (saving) { var pr = 1 - ((sv * 3 * m.sp + n * 0.13) % 1), mx = sn(Math.cos(m.a) * m.r * pr), my = sn(cy + 22 + Math.sin(m.a) * m.r * 0.55 * pr); if (my < 158) { bcSpark(c, mx, my, P, (fr + n) % 4, pr < 0.3 ? '#FFFFFF' : '#67E8F9'); } }
        else { m.u = (m.u + dt * 0.16 * m.sp) % 1; if (n < 10) { bcSpark(c, sn(m.x), sn(130 - m.u * 80), P, (fr + n) % 4, n % 3 ? '#A5F3FC' : '#FDE68A'); } }
      });
      if (done > 0 && done < 0.9) { for (k = 0; k < 8; k++) { var ba = k / 8 * FX_TAU, bd = 16 + done * 150; bcSpark(c, sn(Math.cos(ba) * bd), sn(cy + 22 + Math.sin(ba) * bd * 0.6), P, 2, k % 2 ? '#FFFFFF' : '#FDE047'); } c.globalCompositeOperation = 'lighter'; fxRing(c, 0, 172, 20 + done * 150, 3 + done * 20, '165,243,252', 1 - done / 0.9, 2); fxGlow(c, '207,250,254', 0, 95, 240, fl * 0.3); c.globalCompositeOperation = 'source-over'; }
      /* the screen's furniture: hearts, the save icon, the words and the bar */
      var full = done > 0 ? 5 : 2 + (saving ? Math.floor(sv * 3.99) : 0);
      for (k = 0; k < 5; k++) { var hop = done > 0 && done - k * 0.08 > 0 && done - k * 0.08 < 0.25 ? -3 : 0; bcSpr(c, BC_HEART, { a: k < full ? '#FB7185' : '#34305E' }, -156 + k * 17, 9 + hop, 2); if (k < full) { bcPx(c, -154 + k * 17, 11 + hop, 2, '#FFE4E6'); } }
      if ((saving && fr % 4 < 2) || lit > 0) { c.globalAlpha = lit > 0 ? lit : 1; bcSpr(c, DISK, DP, 140, 8, 2); c.globalAlpha = 1; }
      if (saving) { bcText(c, 'SAVING', -6, 26, 2, '#C7D2FE'); for (k = 0; k < fr % 4; k++) { bcPx(c, 20 + k * 4, 34, 2, '#C7D2FE'); } c.fillStyle = '#312E81'; c.fillRect(-33, 40, 66, 5); c.fillStyle = '#67E8F9'; c.fillRect(-32, 41, sn(64 * sv), 3); }
      else if (lit > 0) { bcText(c, 'GAME SAVED', 0, 28, 2, fl > 0 ? '#FFFFFF' : '#FDE047', lit); }
      else { bcText(c, 'SAVE POINT', 0, 28, 2, '#818CF8', 0.7 + 0.3 * Math.sin(t * 3)); }
    };
  });

  /* a chess piece standing at (x, y), k times life size: 'p' pawn, 'r' rook, 'b' bishop, 'n' knight, 'q' queen, 'k' king */
  function bcPiece(c, ty, x, y, k, white, tilt, a) {
    var H = { p: 13, r: 16, b: 19, n: 18, q: 23, k: 25 }[ty], w = ty === 'p' ? 4.2 : 5.2;
    c.save(); c.translate(x, y); c.scale(k, k); if (tilt) { c.rotate(tilt); } c.globalAlpha = a === undefined ? 1 : Math.max(0, Math.min(1, a));
    var g = c.createLinearGradient(-7, 0, 7, 0); if (white) { g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.55, '#E7E5E4'); g.addColorStop(1, '#A8A29E'); } else { g.addColorStop(0, '#6B6478'); g.addColorStop(0.5, '#1C1917'); g.addColorStop(1, '#0C0A09'); }
    c.fillStyle = g; c.strokeStyle = white ? 'rgba(120,113,108,.9)' : 'rgba(196,181,253,.85)'; c.lineWidth = 0.8;
    c.beginPath(); c.ellipse(0, 0, 7.5, 2.6, 0, 0, FX_TAU); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-6.5, -1); c.quadraticCurveTo(-w * 0.5, -3, -w * 0.5, -H * 0.5); c.lineTo(-w * 0.75, -H + 5); c.lineTo(w * 0.75, -H + 5); c.lineTo(w * 0.5, -H * 0.5); c.quadraticCurveTo(w * 0.5, -3, 6.5, -1); c.closePath(); c.fill(); c.stroke();
    c.beginPath();
    if (ty === 'p') { c.arc(0, -H + 2.5, 3.4, 0, FX_TAU); }
    else if (ty === 'r') { c.rect(-5, -H, 10, 5.5); c.rect(-5, -H - 2.2, 2.6, 2.2); c.rect(-1.3, -H - 2.2, 2.6, 2.2); c.rect(2.4, -H - 2.2, 2.6, 2.2); }
    else if (ty === 'b') { c.moveTo(0, -H - 3.5); c.quadraticCurveTo(5.5, -H + 2, 0, -H + 6.5); c.quadraticCurveTo(-5.5, -H + 2, 0, -H - 3.5); c.moveTo(1.1, -H - 5); c.arc(0, -H - 5, 1.1, 0, FX_TAU); }
    else if (ty === 'n') { c.moveTo(-4, -H + 6); c.lineTo(-6.5, -H - 1); c.lineTo(-3, -H - 6); c.lineTo(-1.5, -H - 8.5); c.lineTo(0, -H - 5.5); c.lineTo(4.5, -H - 1); c.lineTo(5, -H + 6); c.closePath(); }
    else if (ty === 'q') { c.moveTo(-5.5, -H + 5.5); c.lineTo(-7, -H - 4); c.lineTo(-3.4, -H); c.lineTo(-2, -H - 5.5); c.lineTo(0, -H); c.lineTo(2, -H - 5.5); c.lineTo(3.4, -H); c.lineTo(7, -H - 4); c.lineTo(5.5, -H + 5.5); c.closePath(); }
    else { c.rect(-4.6, -H, 9.2, 5.5); c.rect(-0.9, -H - 7, 1.8, 7); c.rect(-3, -H - 5.2, 6, 1.8); }
    c.fill(); c.stroke();
    if (ty === 'q') { c.fillStyle = '#FDE047'; [-7, -2, 2, 7].forEach(function (q, i) { c.beginPath(); c.arc(q, -H - (i === 0 || i === 3 ? 4.6 : 6.2), 1.1, 0, FX_TAU); c.fill(); }); }
    c.restore();
  }
  /* Checkmate (Royal Court, Rare): a chessboard in a moonlit hall. A bishop slides out, the white queen runs the length of the
     board on a trail of gold, the squares round the black king burn red, he shakes and falls, a beam of light finds the queen,
     and her side hops for joy before the board is set again */
  gwStage('checkmate', function () {
    var C = 12, Du = [], Sp = [], o = {}, i;
    for (i = 0; i < 26; i++) { Du.push({ x: fxR(-150, 150), y: fxR(10, 150), p: fxR(0, 6), z: fxR(0.5, 1.2) }); }
    function pj(u, v) { var z = v / 8, hw = 78 + 74 * z; return [(u - 4) / 4 * hw, 98 + 76 * z * (0.6 + 0.4 * z), 0.62 + 0.5 * z]; }
    function mv(a, b, u) { u = fxEase(u); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; }
    return function (c, t, dt) {
      var cyc = (t + (FX_REDUCE ? 3.4 : 0)) % C, fade = cyc < 0.8 ? cyc / 0.8 : cyc > C - 0.8 ? (C - cyc) / 0.8 : 1, k, u, v;
      var mate = cyc - 4.9, qm = Math.max(0, Math.min(1, (cyc - 3.6) / 1.3)), bm = Math.max(0, Math.min(1, (cyc - 1.4) / 1.1)), fall = fxEase(Math.max(0, Math.min(1, (mate - 0.5) / 0.7)));
      function sq(u2, v2, col, a) { if (!(a > 0)) { return; } var p0 = pj(u2, v2), p1 = pj(u2 + 1, v2), p2 = pj(u2 + 1, v2 + 1), p3 = pj(u2, v2 + 1); c.globalAlpha = Math.min(1, a); c.fillStyle = col; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]); c.closePath(); c.fill(); c.globalAlpha = 1; }
      /* the hall: moonlight through two tall windows, candles at the sides, dust in the light */
      [-104, 104].forEach(function (wx, n) {
        c.globalCompositeOperation = 'lighter'; var g = c.createLinearGradient(0, 6, 0, 90); g.addColorStop(0, 'rgba(165,180,252,.38)'); g.addColorStop(1, 'rgba(165,180,252,.06)'); c.fillStyle = g; c.beginPath(); c.moveTo(wx - 16, 90); c.lineTo(wx - 16, 30); c.quadraticCurveTo(wx, 2, wx + 16, 30); c.lineTo(wx + 16, 90); c.fill();
        lkBeam(c, wx, 34, Math.atan2(120, -wx), 190, 0.13, '165,180,252', 0.13 + 0.03 * Math.sin(t * 0.7 + n));
        c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#0D0B1E'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(wx, 12); c.lineTo(wx, 90); c.moveTo(wx - 16, 44); c.lineTo(wx + 16, 44); c.moveTo(wx - 16, 68); c.lineTo(wx + 16, 68); c.stroke();
        var sx = wx * 1.47; c.strokeStyle = '#B08D3C'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(sx, 160); c.lineTo(sx, 112); c.moveTo(sx - 9, 118); c.quadraticCurveTo(sx, 128, sx + 9, 118); c.stroke();
        [-9, 0, 9].forEach(function (dx, m) { var fy = (m === 1 ? 108 : 114), fk = lkNoise(t * 9 + m * 4 + n * 11); c.fillStyle = '#F5F0E6'; c.fillRect(sx + dx - 1.2, fy, 2.4, 5); c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', sx + dx, fy - 3, 13 + fk * 2, 0.5); lkTongue(c, sx + dx, fy, 6.5 + fk * 1.4, 1.7, fk * 1.3, 'rgba(253,224,71,.95)'); c.globalCompositeOperation = 'source-over'; });
      });
      /* the board, its gold edge, the queen's trail and the squares the king cannot step on */
      var A = pj(-0.3, -0.3), B = pj(8.3, -0.3), E = pj(8.3, 8.35), F = pj(-0.3, 8.35); c.fillStyle = '#3B2A14'; c.strokeStyle = '#D4A94A'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(E[0], E[1]); c.lineTo(F[0], F[1]); c.closePath(); c.fill(); c.stroke();
      for (v = 0; v < 8; v++) { for (u = 0; u < 8; u++) { sq(u, v, (u + v) % 2 === 0 ? '#EDE9E0' : '#3A3353', 1); } }
      var qp = mv([6.5, 7.5], [6.5, 1.5], qm), bp = mv([1.5, 0.5], [4.5, 3.5], bm), tr = Math.max(0, 1 - Math.max(0, mate) / 1.2) * fade;
      if (qm > 0) { for (k = 1; k <= 7; k++) { if (k + 0.5 >= qp[1] - 0.01) { sq(6, k, '#FACC15', 0.55 * tr); } } }
      if (mate > 0 && mate < 2.4) { var rd = 0.6 * Math.abs(Math.sin(mate * 5)) * fade; sq(6, 0, '#EF4444', rd); sq(7, 1, '#EF4444', rd); sq(7, 0, '#EF4444', rd * 0.8); }
      var L = [['r', 0, 0.5, 0.5], ['k', 0, 7.5 + (mate > 0 && mate < 0.5 ? Math.sin(t * 70) * 0.05 : 0), 0.5, fall * 1.45], ['p', 0, 0.5, 1.5], ['p', 0, 2.5, 1.5], ['b', 0, bp[0], bp[1], 0, Math.sin(bm * Math.PI) * 5], ['k', 1, 5.5, 2.5], ['q', 1, qp[0], qp[1], 0, Math.sin(qm * Math.PI) * 7], ['p', 1, 2.5, 5.5], ['p', 1, 3.5, 6.5], ['n', 1, 1.5, 7.5], ['r', 1, 0.5, 7.5]];
      L.sort(function (a, b) { return a[3] - b[3]; });
      L.forEach(function (m) { var p = pj(m[2], m[3]), hop = m[1] && mate > 0.9 && mate < 3.6 && m[0] !== 'q' ? Math.abs(Math.sin(mate * 6 + m[2])) * 3 : 0; c.fillStyle = 'rgba(0,0,0,' + (0.35 * fade).toFixed(3) + ')'; c.beginPath(); c.ellipse(p[0] + 2, p[1] + 1, 8 * p[2], 2.6 * p[2], 0, 0, FX_TAU); c.fill(); bcPiece(c, m[0], p[0], p[1] - (m[5] || 0) - hop, p[2], m[1], m[4] || 0, fade); });
      c.globalCompositeOperation = 'lighter';
      if (mate > 0) {
        var qq = pj(6.5, 1.5), gl = Math.min(1, mate / 0.3) * Math.max(0, 1 - (mate - 3.6) / 1.2) * fade;
        lkBeam(c, qq[0], qq[1] - 150, Math.PI / 2, 152, 0.09, '253,224,71', 0.5 * gl); fxGlow(c, '253,224,71', qq[0], qq[1] - 12, 26, 0.6 * gl);
        if (mate < 0.7) { fxRing(c, qq[0], qq[1], 6 + mate * 90, 2 + mate * 26, '253,224,71', 1 - mate / 0.7, 1.6); }
        lkEvery(o, gl > 0.2 ? 14 : 0, dt, function () { Sp.push({ x: qq[0] + fxR(-9, 9), y: qq[1] - fxR(0, 18), vx: fxR(-8, 8), vy: fxR(-34, -14), l: 0, m: fxR(0.8, 1.6) }); });
        var ta = Math.max(0, Math.min(1, (4.6 - mate) / 0.8)) * fade; if (ta > 0) { zType(c, 'checkmate.', 0, 14, mate / 0.6, '600 11px ' + FX_MONO, 'rgba(253,230,138,' + ta.toFixed(3) + ')', '#F59E0B'); c.globalCompositeOperation = 'lighter'; }
      }
      lkStep(Sp, dt, 0, 0, function (p, f) { fxStar4(c, p.x, p.y, 3.2 * f, f, '#FDE68A'); });
      Du.forEach(function (q) { fxGlow(c, '199,210,254', q.x + Math.sin(t * 0.3 + q.p) * 8, q.y + Math.cos(t * 0.23 + q.p) * 5, 1.6 * q.z, 0.25 + 0.25 * Math.sin(t * 1.4 + q.p)); });
      c.globalCompositeOperation = 'source-over';
    };
  });

  /* Belfry (Royal Court, Epic): a great bronze bell swings in a stone arch in front of the moon, over the roofs of a sleeping
     town. Each toll sends rings of sound rolling out, shakes dust from the arch and lights one more numeral on the ground; doves
     scatter across the moon. At the twelfth the bell blazes gold, rays turn behind it, and the word midnight writes itself */
  gwStage('belfry', function () {
    var St = [], Dv = [], Du = [], Mo = [], Hs = [], i, PER = 3.4, HALF = 1.7, lastN = -1, o = {}, RN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    for (i = 0; i < 44; i++) { St.push({ x: fxR(-162, 162), y: fxR(4, 124), p: fxR(0, 6), z: fxR(0.4, 1.2) }); }
    for (i = 0; i < 16; i++) { Hs.push({ x: -170 + i * 22 + fxR(-3, 3), w: fxR(16, 24), h: fxR(10, 26), win: Math.random() < 0.6, p: fxR(0, 6) }); }
    function bell(c) { c.beginPath(); c.moveTo(-7, 8); c.bezierCurveTo(-13, 12, -14, 34, -20, 48); c.quadraticCurveTo(-24, 58, -32, 62); c.lineTo(-32, 67); c.lineTo(32, 67); c.lineTo(32, 62); c.quadraticCurveTo(24, 58, 20, 48); c.bezierCurveTo(14, 34, 13, 12, 7, 8); c.closePath(); }
    return function (c, t, dt) {
      var CY = 12 * HALF + 6, cyc = (t + (FX_REDUCE ? 18.6 : 0)) % CY, n = Math.min(12, Math.floor(cyc / HALF)), since = cyc - n * HALF, fin = cyc - 12 * HALF, damp = fin > 0 ? Math.max(0, 1 - fin / 4) : 1, th = 0.6 * Math.sin(cyc * FX_TAU / PER) * damp, ca = 0.85 * Math.sin(cyc * FX_TAU / PER - 1.1) * damp, glow = fin > 0 ? fxEnv(fin, 0, 0.5, 4.4, 6) : 0, k;
      if (cyc < 0.2 && lastN > 1) { lastN = -1; }
      if (n !== lastN && n >= 1 && since < 0.3) { lastN = n; for (k = 0; k < 9; k++) { Du.push({ x: fxR(-70, 70), y: fxR(34, 44), vx: fxR(-6, 6), vy: fxR(4, 22), l: 0, m: fxR(1.2, 2.4) }); } if (n % 3 === 0) { for (k = 0; k < 6; k++) { var sd = k % 2 ? 1 : -1; Dv.push({ x: sd * fxR(60, 84), y: fxR(30, 50), vx: sd * fxR(26, 60), vy: fxR(-30, -8), l: 0, m: fxR(2.4, 3.6) }); } } }
      /* the sky: stars, the moon and slow clouds; then the town's roofs and lit windows */
      c.globalCompositeOperation = 'lighter';
      St.forEach(function (q) { fxGlow(c, '226,232,255', q.x, q.y, 1.7 * q.z, 0.25 + 0.3 * Math.sin(t * 1.8 + q.p)); });
      fxGlow(c, '254,243,199', 58, 62, 74, 0.22 + 0.2 * glow); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#FEF3C7'; c.beginPath(); c.arc(58, 62, 30, 0, FX_TAU); c.fill(); c.fillStyle = 'rgba(180,140,70,.22)'; [[-9, -8, 7], [10, 6, 5], [2, -16, 4], [-4, 12, 6], [14, -10, 3]].forEach(function (q) { c.beginPath(); c.arc(58 + q[0], 62 + q[1], q[2], 0, FX_TAU); c.fill(); });
      for (k = 0; k < 3; k++) { var cx0 = ((t * (3 + k) + k * 150) % 460) - 230; c.fillStyle = 'rgba(30,27,60,.5)'; c.beginPath(); c.ellipse(cx0, 52 + k * 16, 46, 6, 0, 0, FX_TAU); c.ellipse(cx0 + 26, 56 + k * 16, 30, 5, 0, 0, FX_TAU); c.fill(); }
      Hs.forEach(function (h) { c.fillStyle = '#14122B'; c.beginPath(); c.moveTo(h.x, 160); c.lineTo(h.x, 160 - h.h); c.lineTo(h.x + h.w / 2, 160 - h.h - h.w * 0.4); c.lineTo(h.x + h.w, 160 - h.h); c.lineTo(h.x + h.w, 160); c.fill(); if (h.win) { c.fillStyle = 'rgba(251,191,36,' + (0.55 + 0.25 * Math.sin(t * 0.9 + h.p)).toFixed(3) + ')'; c.fillRect(h.x + h.w * 0.3, 160 - h.h * 0.7, 3, 4); } });
      lkStep(Dv, dt, -5, 0.8, function (p, f) { var fl = Math.sin(t * 17 + p.m * 9) * 4.5; c.strokeStyle = 'rgba(241,245,249,' + Math.min(1, f * 2.5).toFixed(3) + ')'; c.lineWidth = 1.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(p.x - 6, p.y - fl); c.quadraticCurveTo(p.x - 2, p.y - 2, p.x, p.y); c.quadraticCurveTo(p.x + 2, p.y - 2, p.x + 6, p.y - fl); c.stroke(); });
      /* rays behind the bell at midnight */
      if (glow > 0) { c.globalCompositeOperation = 'lighter'; for (k = 0; k < 10; k++) { lkBeam(c, 0, 92, k / 10 * FX_TAU + t * 0.35, 150, 0.07, '253,224,71', 0.3 * glow); } fxGlow(c, '253,224,71', 0, 92, 96, 0.5 * glow); c.globalCompositeOperation = 'source-over'; }
      /* the belfry: two pillars, the arch, a little roof and its vane */
      var sg = c.createLinearGradient(-90, 0, 90, 0); sg.addColorStop(0, '#23213A'); sg.addColorStop(0.5, '#34324F'); sg.addColorStop(1, '#4A4868'); c.fillStyle = sg;
      c.beginPath(); c.rect(-88, 40, 22, 120); c.rect(66, 40, 22, 120); c.fill();
      c.beginPath(); c.moveTo(-92, 44); c.lineTo(-92, 34); c.quadraticCurveTo(0, -4, 92, 34); c.lineTo(92, 44); c.lineTo(66, 44); c.quadraticCurveTo(0, 14, -66, 44); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-18, 17); c.lineTo(0, -1); c.lineTo(18, 17); c.fill(); c.strokeStyle = '#B08D3C'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -1); c.lineTo(0, -9); c.moveTo(-4, -6); c.lineTo(4, -6); c.stroke();
      c.strokeStyle = 'rgba(12,10,28,.55)'; c.lineWidth = 0.8; c.beginPath(); for (k = 0; k < 10; k++) { c.moveTo(-88, 52 + k * 12); c.lineTo(-66, 52 + k * 12); c.moveTo(66, 52 + k * 12); c.lineTo(88, 52 + k * 12); c.moveTo(k % 2 ? -77 : -72, 52 + k * 12); c.lineTo(k % 2 ? -77 : -72, 64 + k * 12); c.moveTo(k % 2 ? 77 : 82, 52 + k * 12); c.lineTo(k % 2 ? 77 : 82, 64 + k * 12); } c.stroke();
      c.strokeStyle = 'rgba(254,243,199,.4)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(88, 40); c.lineTo(88, 160); c.moveTo(-66, 44); c.lineTo(-66, 160); c.stroke();
      [-77, 77].forEach(function (lx, m) { c.fillStyle = '#1C1917'; c.fillRect(lx - 3, 96, 6, 9); c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,146,60', lx, 100, 20 + 2 * lkNoise(t * 8 + m * 5), 0.55); fxGlow(c, '254,240,138', lx, 100, 4, 0.95); c.globalCompositeOperation = 'source-over'; });
      /* the rope, the bell on its headstock, and the clapper */
      c.strokeStyle = '#A8926B'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-22 * Math.cos(th), 40 - 22 * Math.sin(th)); c.quadraticCurveTo(-46 + th * 16, 100, -44 - th * 8, 160); c.stroke();
      c.save(); c.translate(0, 40); c.rotate(th);
      c.strokeStyle = '#3A2A1A'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(0, 30); c.lineTo(Math.sin(ca) * 34, 30 + Math.cos(ca) * 34); c.stroke(); c.fillStyle = '#57534E'; c.beginPath(); c.arc(Math.sin(ca) * 36, 30 + Math.cos(ca) * 36, 5, 0, FX_TAU); c.fill();
      var bg = c.createLinearGradient(-32, 0, 32, 0); bg.addColorStop(0, '#6B3F0E'); bg.addColorStop(0.3, '#FBBF24'); bg.addColorStop(0.45, '#FDE68A'); bg.addColorStop(0.7, '#B45309'); bg.addColorStop(1, '#5B330A'); c.fillStyle = bg; bell(c); c.fill();
      c.strokeStyle = 'rgba(92,51,10,.8)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-13, 22); c.lineTo(13, 22); c.moveTo(-22, 52); c.lineTo(22, 52); c.moveTo(-23, 55); c.lineTo(23, 55); c.stroke(); c.strokeStyle = 'rgba(254,243,199,.75)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-32, 67); c.lineTo(32, 67); c.stroke();
      if (glow > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * glow; c.fillStyle = '#FDE68A'; bell(c); c.fill(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      c.fillStyle = '#4A3320'; c.fillRect(-24, -6, 48, 13); c.fillStyle = '#B08D3C'; c.fillRect(-24, -1, 48, 2); c.beginPath(); c.arc(0, 0, 3, 0, FX_TAU); c.fill();
      c.restore();
      /* each toll: rings of sound from the mouth of the bell, and a shiver of light on the ground */
      c.globalCompositeOperation = 'lighter';
      for (k = 0; k < 3; k++) { var s2 = since + k * HALF; if (n - k >= 1 && s2 < 3) { fxRing(c, Math.sin(th) * 60, 104, 26 + s2 * 70, 10 + s2 * 30, '253,224,71', (1 - s2 / 3) * 0.55 * (fin > 0 ? damp : 1), 2.2 - s2 * 0.5); } }
      /* the ground: flagstones, and the ring of numerals that counts the hour */
      c.globalCompositeOperation = 'source-over'; c.fillStyle = '#17152E'; c.fillRect(-165, 160, 330, 30); c.strokeStyle = 'rgba(148,163,184,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-165, 160.5); c.lineTo(165, 160.5); c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '700 7px Georgia, serif';
      for (k = 0; k < 12; k++) { var ra = (k + 1) / 12 * FX_TAU - Math.PI / 2, on = k < n, nx = Math.cos(ra) * 126, ny = 174 + Math.sin(ra) * 11, pulse = on && k === n - 1 ? Math.max(0, 1 - since / 0.8) : 0; if (on) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', nx, ny, 9 + 8 * pulse + 5 * glow, 0.4 + 0.5 * pulse + 0.4 * glow); c.globalCompositeOperation = 'source-over'; } c.fillStyle = on ? '#FDE68A' : 'rgba(148,163,184,.4)'; c.fillText(RN[k], nx, ny); }
      c.globalCompositeOperation = 'lighter'; fxRing(c, 0, 174, 104, 8, '253,224,71', 0.18 + 0.5 * glow, 1);
      lkStep(Du, dt, 30, 0.5, function (p, f) { fxGlow(c, '203,213,225', p.x, p.y, 2.4, 0.5 * f); });
      lkEvery(o, glow > 0.3 ? 22 : 0, dt, function () { Mo.push({ x: fxR(-120, 120), y: fxR(120, 170), vx: fxR(-5, 5), vy: fxR(-40, -16), l: 0, m: fxR(1, 2) }); });
      lkStep(Mo, dt, 0, 0, function (p, f) { fxStar4(c, p.x, p.y, 3 * f, f, '#FDE68A'); });
      if (fin > 0.4 && glow > 0) { zType(c, 'midnight.', -116, 16, (fin - 0.4) / 0.7, '600 10px ' + FX_MONO, 'rgba(253,230,138,' + Math.min(1, glow).toFixed(3) + ')', '#F59E0B'); }
      c.globalCompositeOperation = 'source-over';
    };
  });

  /* Boss fight (8-Bit, Legendary): a pixel knight against a pixel dragon over a lake of lava. The dragon breathes fire and the
     shield takes it, the knight dashes in and cuts, numbers fly and the bars drain; then the knight charges up, strikes three
     times for 999, the dragon breaks apart, and VICTORY drops in as coins rain down and bounce */
  gwStage('bossfight', function () {
    var P = 3, C = 15, Fi = [], Co = [], Nm = [], Bo = [], Em = [], St = [], i, o = {}, o2 = {}, last = 99, ei = 0, shake = 0;
    var KP = { r: '#EF4444', h: '#E2E8F0', k: '#0F172A', a: '#94A3B8', b: '#475569' }, DP = { g: '#22C55E', G: '#15803D', e: '#FDE047', t: '#F8FAFC', y: '#FDE68A', w: '#C026D3', W: '#86198F' }, KW = bcFlash(KP), DW = bcFlash(DP), KG = bcFlash(KP, '#FDE047');
    for (i = 0; i < 28; i++) { St.push(2 + Math.floor(fxRnd(i * 7) * 5) * (fxRnd(i * 3) < 0.4 ? 2 : 1)); }
    for (i = 0; i < 18; i++) { Em.push({ x: fxR(-160, 160), u: Math.random(), sp: fxR(0.1, 0.3) }); }
    function sn(v) { return Math.round(v / P) * P; }
    function num(x, y, txt, col, p) { Nm.push({ x: x, y: y, vx: 0, vy: -26, l: 0, m: 1.0, txt: txt, col: col, p: p }); }
    var EV = [[2.05, function () { num(-84, 112, '-12', '#FCA5A5', 2); shake = 0.2; }], [3.42, function () { num(74, 74, '-25', '#FFFFFF', 2); shake = 0.2; }], [5.25, function () { num(-84, 112, '-14', '#FCA5A5', 2); shake = 0.2; }], [6.62, function () { num(74, 74, '-31', '#FFFFFF', 2); shake = 0.2; }], [9.35, function () { num(74, 62, '-999', '#FDE047', 4); shake = 0.6; }],
      [11.4, function () { for (var j = 0; j < 30; j++) { Co.push({ x: fxR(-150, 150), y: fxR(-90, -4), vy: fxR(0, 40), vx: fxR(-10, 10), n: j }); } }]];
    return function (c, t, dt) {
      var cyc = (t + (FX_REDUCE ? 9.9 : 0)) % C, fr = Math.floor(t * 8), k, j;
      if (cyc < last) { ei = 0; Co.length = 0; Nm.length = 0; } last = cyc; while (ei < EV.length && cyc >= EV[ei][0]) { EV[ei][1](); ei++; }
      shake = Math.max(0, shake - dt); if (shake > 0) { c.translate(fr % 2 ? P : -P, 0); }
      function ph(t0, d) { return (cyc - t0) / d; }
      var f1 = ph(1.4, 1.1), f2 = ph(4.6, 1.1), fire = f1 > 0 && f1 < 1 ? f1 : f2 > 0 && f2 < 1 ? f2 : -1, s1 = ph(3.0, 0.9), s2 = ph(6.2, 0.9), sl = s1 > 0 && s1 < 1 ? s1 : s2 > 0 && s2 < 1 ? s2 : -1;
      var chg = ph(7.4, 1.6), mega = ph(9.0, 0.9), die = ph(9.9, 1.5), win = cyc - 11.4, out = cyc > C - 0.7 ? (C - cyc) / 0.7 : 1;
      var hpH = cyc < 2.05 ? 1 : cyc < 5.25 ? 0.74 : win > 0 ? Math.min(1, 0.5 + win * 0.5) : 0.5, hpD = cyc < 3.42 ? 1 : cyc < 6.62 ? 0.7 : cyc < 9.35 ? 0.42 : 0;
      var lunge = 0; if (sl >= 0) { lunge = sl < 0.33 ? fxEase(sl / 0.33) : sl < 0.5 ? 1 : 1 - fxEase((sl - 0.5) / 0.5); } if (mega > 0 && cyc < 10.6) { lunge = mega < 0.25 ? fxEase(mega / 0.25) : mega < 1 ? 1 : 1 - fxEase((cyc - 9.9) / 0.7); }
      var kx = sn(-99 + lunge * 96), ky = sn(127 - (win > 0 ? Math.abs(Math.sin(win * 5)) * 7 : 0)), hitK = (cyc > 2.05 && cyc < 2.22) || (cyc > 5.25 && cyc < 5.42), charging = chg > 0 && chg < 1, cut = (sl > 0.3 && sl < 0.55) || (mega > 0.22 && mega < 0.9);
      var hitD = (cyc > 3.42 && cyc < 3.6) || (cyc > 6.62 && cyc < 6.8) || (cyc > 9.3 && cyc < 9.9 && fr % 2 === 0), dx = sn(42 + (fire >= 0 ? (fire < 0.32 ? 6 * fire / 0.32 : -4) : 0) + (hitD ? 6 : 0)), dy = sn(82 + Math.sin(t * 2.2) * 4);
      /* the cave: hanging rock, two pillars, the glow of the lava and the stone bridge over it */
      c.fillStyle = '#1B1840'; St.forEach(function (h, n) { c.fillRect(-168 + n * 12, 0, 12, h * P); });
      c.fillStyle = '#131030'; St.forEach(function (h, n) { if (n % 3 === 1) { c.fillRect(-165 + n * 12, 0, 6, (h + 3) * P); } });
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '234,88,12', 0, 196, 190, 0.5 + 0.08 * Math.sin(t * 2)); c.globalCompositeOperation = 'source-over';
      [-159, 144].forEach(function (px) { c.fillStyle = '#2A2757'; c.fillRect(px, 27, 15, 133); c.fillStyle = '#3B3875'; c.fillRect(px, 27, 3, 133); c.fillStyle = '#17153A'; for (k = 0; k < 6; k++) { c.fillRect(px, 42 + k * 21, 15, 3); } c.fillStyle = '#3B3875'; c.fillRect(px - 3, 21, 21, 6); });
      c.fillStyle = '#9A3412'; c.fillRect(-165, 166, 330, 24);
      for (k = 0; k < 28; k++) { var lh = Math.round(1.5 + 1.5 * Math.sin(t * 2.4 + k * 0.9)); c.fillStyle = '#EA580C'; c.fillRect(-168 + k * 12, 172 - lh * P, 12, lh * P); if ((k + fr) % 5 === 0) { c.fillStyle = '#FDBA74'; c.fillRect(-165 + k * 12, 172 - lh * P, 6, 3); } }
      for (k = 0; k < 6; k++) { var bu = (t * 0.5 + k * 0.37) % 1, bxx = sn(-150 + ((k * 61) % 300)); if (bu < 0.8) { bcPx(c, bxx, sn(187 - bu * 14), P, '#FED7AA'); } else { bcSpark(c, bxx, 174, P, 1, '#FEF3C7'); } }
      c.fillStyle = '#35325F'; c.fillRect(-141, 160, 282, 6); c.fillStyle = '#6E6AA0'; c.fillRect(-141, 160, 282, 2); c.fillStyle = '#1D1B40'; for (k = 0; k < 12; k++) { c.fillRect(-129 + k * 24, 163, 3, 3); }
      Em.forEach(function (e, n) { e.u = (e.u + dt * e.sp) % 1; bcPx(c, sn(e.x + Math.sin(e.u * 9 + n) * 6), sn(166 - e.u * 150), P, e.u < 0.5 ? '#FB923C' : '#B45309'); });
      /* the dragon: hovering, leaning back to breathe, flashing when cut, breaking apart when beaten */
      if (die < 1 && !(cyc < 0.6 && fr % 2)) {
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(dx + 12, 157, 54, 3);
        if (die > 0) { for (j = 0; j < BC_DRAGON.length; j++) { c.globalAlpha = Math.max(0, 1 - die); bcSpr(c, [BC_DRAGON[j]], fr % 2 ? DW : DP, sn(dx + (fxRnd(j * 3 + fr) * 2 - 1) * die * 34), sn(dy + j * 4 + die * die * 26), 4); } c.globalAlpha = 1; }
        else { bcSpr(c, BC_DRAGON, hitD ? DW : DP, dx, dy, 4); if (fire >= 0.32) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,146,60', dx + 2, dy + 26, 26, 0.7); c.globalCompositeOperation = 'source-over'; } }
      }
      lkEvery(o2, die > 0 && die < 1 ? 10 : 0, dt, function () { Bo.push({ x: dx + fxR(0, 80), y: dy + fxR(0, 56), vx: 0, vy: 0, l: 0, m: 0.4 }); });
      lkStep(Bo, dt, 0, 0, function (p, f) { bcSpark(c, sn(p.x), sn(p.y), 4, f > 0.66 ? 0 : f > 0.33 ? 1 : 2, f > 0.5 ? '#FFFFFF' : '#FDBA74'); });
      lkEvery(o, fire >= 0.32 ? 70 : 0, dt, function () { Fi.push({ x: dx + 2, y: dy + 26, vx: -fxR(150, 230), vy: fxR(-26, 30), l: 0, m: fxR(0.4, 0.62) }); });
      lkStep(Fi, dt, 0, 0, function (p, f) { if (p.x < kx + 33) { p.l = p.m; bcSpark(c, sn(p.x), sn(p.y), P, 1, '#FFFFFF'); return; } var big = f > 0.4 ? 2 : 1; bcPx(c, sn(p.x), sn(p.y), P, f > 0.66 ? '#FEF9C3' : f > 0.33 ? '#FB923C' : '#DC2626', big, big); });
      /* the knight: shield up under fire, sword out on the cut, gold while charging */
      if (charging) { for (j = 0; j < 8; j++) { bcPx(c, kx - 6 + j * 6, sn(ky + 33 - ((t * 90 + j * 17) % 45)), P, j % 2 ? '#FDE047' : '#FFFFFF'); } c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', kx + 9, ky + 16, 30 + chg * 16, 0.5); c.globalCompositeOperation = 'source-over'; }
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(kx, 157, 21, 3);
      bcSpr(c, BC_KNIGHT, hitK ? KW : charging && fr % 2 ? KG : KP, kx, ky, P);
      var sc = charging || (mega > 0 && mega < 1) ? '#FDE047' : '#E2E8F0';
      bcPx(c, kx + 15, ky + 15, P, '#FACC15');
      if (cut) { for (j = 0; j < 6; j++) { bcPx(c, kx + 18 + j * P, ky + 15, P, sc); } for (j = -3; j <= 3; j++) { bcPx(c, sn(kx + 21 + Math.cos(j * 0.32) * 27), sn(ky + 15 + Math.sin(j * 0.32) * 27), P, j % 2 ? '#FFFFFF' : sc, 1, 2); } }
      else if (charging || win > 0) { for (j = 0; j < (charging ? 7 : 5); j++) { bcPx(c, kx + 18, ky + 12 - j * P, P, sc); } if (fr % 3 === 0) { bcSpark(c, kx + 18, ky + 12 - (charging ? 7 : 5) * P, P, 1, '#FFFFFF'); } }
      else { for (j = 0; j < 5; j++) { bcPx(c, kx + 18 + j * P, ky + 12 - j * P, P, sc); } }
      if (fire >= 0.25) { bcPx(c, kx + 27, ky + 9, P, fr % 2 ? '#FFFFFF' : '#93C5FD', 2, 6); bcPx(c, kx + 27, ky + 15, P, '#1D4ED8', 2, 1); }
      if (charging && fr % 2) { bcText(c, 'LIMIT BREAK', kx + 12, ky - 15, 2, '#FDE047'); }
      /* three cuts across the dragon, then the numbers and the coins */
      if (mega > 0.22 && mega < 0.8) { for (k = 0; k < 3; k++) { var mu = Math.max(0, Math.min(1, (mega - 0.22 - k * 0.12) / 0.16)); for (j = 0; j < mu * 16; j++) { bcPx(c, sn(dx + 6 + k * 16 + j * 3.4), sn(dy - 8 + j * 4.4), P, j % 3 ? '#FFFFFF' : '#FDE047', 2, 1); } } fxGlow(c, '255,255,255', 60, 100, 260, mega < 0.4 ? 0.6 : 0.15); }
      lkStep(Nm, dt, 0, 0, function (p, f) { bcText(c, p.txt, p.x + 1.5, sn(p.y) + 1.5, p.p, '#0B0920', f * 2); bcText(c, p.txt, p.x, sn(p.y), p.p, p.col, f * 2); });
      Co.forEach(function (q) { if (!q.rest) { q.vy += 260 * dt; q.y += q.vy * dt; q.x += q.vx * dt; if (q.y > 154) { q.y = 154; q.vy = -q.vy * 0.45; if (Math.abs(q.vy) < 14) { q.rest = 1; } } } c.globalAlpha = out; bcPx(c, sn(q.x), sn(q.y), P, (fr + q.n) % 6 === 0 ? '#FFFFFF' : '#FACC15', 2, 2); bcPx(c, sn(q.x), sn(q.y), P, '#FEF9C3'); c.globalAlpha = 1; });
      /* the bars and the words */
      bcText(c, 'HERO', -141, 8, 2, '#E2E8F0'); c.fillStyle = '#E2E8F0'; c.fillRect(-160, 21, 72, 8); c.fillStyle = '#0B0920'; c.fillRect(-158, 23, 68, 4); c.fillStyle = hpH > 0.6 ? '#4ADE80' : '#FACC15'; c.fillRect(-158, 23, sn(68 * hpH), 4);
      bcText(c, 'DRAGON', 133, 8, 2, '#E2E8F0'); c.fillStyle = '#E2E8F0'; c.fillRect(56, 21, 102, 8); c.fillStyle = '#0B0920'; c.fillRect(58, 23, 98, 4); c.fillStyle = '#F43F5E'; c.fillRect(58, 23, sn(98 * hpD), 4);
      if (cyc < 0.7) { bcText(c, 'READY', 0, 44, 3, '#E2E8F0'); } else if (cyc < 1.4 && fr % 2) { bcText(c, 'FIGHT!', 0, 44, 3, '#FDE047'); }
      if (win > 0) {
        'VICTORY'.split('').forEach(function (ch, n) { var dp = Math.max(0, 1 - (win - n * 0.08) / 0.3); bcText(c, ch, (n - 3) * 18, sn(38 - dp * 70 + (dp > 0 ? 0 : Math.sin(win * 5 - n * 0.7) * 3)), 4, 'rgb(' + zHsl(fr * 14 + n * 42, 95, 66) + ')', out); });
        if (win > 0.9) { bcText(c, '+500 XP', 0, 68, 2, '#FDE047', out); }
        for (k = 0; k < 6; k++) { if ((fr + k * 3) % 8 < 4) { bcSpark(c, sn(-120 + k * 48 + Math.sin(k * 7) * 12), sn(30 + ((k * 37) % 50)), P, (fr + k) % 4, k % 2 ? '#FDE047' : '#F0ABFC'); } }
      }
    };
  });

  /* Empty throne (Royal Court, Mythic): a black throne on a cracked floor that leaks violet light, a ring of words turning round
     it, six swords planted before it and a crown hanging in a beam above the seat. Dark lightning walks from sword to sword.
     Then the hall dims, a king made of shadow sits where no one sat, the crown comes down onto his head, every crack blazes and
     every sword is struck at once, and he is gone again */
  gwStage('throne', function () {
    var C = 13, Cr = [], Em = [], Bt = [], Dr = [], i, j, o = {}, lastS = -1, TXT = '· THE CROWN WAITS · NO ONE KNEELS · THE HALL REMEMBERS ', SW = [[-128, 166, -0.3], [-100, 173, -0.16], [-74, 167, -0.06], [74, 167, 0.06], [100, 173, 0.16], [128, 166, 0.3]];
    for (i = 0; i < 9; i++) { var a0 = i / 9 * FX_TAU + fxR(-0.2, 0.2), pts = [], r = 22; for (j = 0; j < 7; j++) { pts.push([a0 + (j ? fxR(-0.13, 0.13) : 0), r]); r += fxR(12, 21); } Cr.push(pts); }
    for (i = 0; i < 30; i++) { Em.push({ x: fxR(-150, 150), u: Math.random(), sp: fxR(0.05, 0.14), z: fxR(0.6, 1.5), g: Math.random() < 0.3 }); }
    function fl(a, r) { return [Math.cos(a) * r, 171 + Math.sin(a) * r * 0.15]; }
    function tip(q) { return [q[0] + Math.sin(q[2]) * 38, q[1] - Math.cos(q[2]) * 38]; }
    function strike(n) { var q = tip(SW[n]), x0 = q[0] + fxR(-34, 34), P = [[x0, -6]]; for (var m = 1; m < 7; m++) { var u = m / 7; P.push([x0 + (q[0] - x0) * u + fxR(-9, 9), -6 + (q[1] + 6) * u]); } P.push(q); Bt.push({ pts: P, l: 0, m: 0.22, x: q[0], y: q[1], vx: 0, vy: 0 }); }
    function trace(c, pts) { c.beginPath(); pts.forEach(function (p, m) { if (m) { c.lineTo(p[0], p[1]); } else { c.moveTo(p[0], p[1]); } }); c.stroke(); }
    function crown(c, y, gl) {
      c.save(); c.translate(0, y); var g = c.createLinearGradient(-13, 0, 13, 0); g.addColorStop(0, '#92400E'); g.addColorStop(0.35, '#FDE68A'); g.addColorStop(0.6, '#F59E0B'); g.addColorStop(1, '#78350F');
      c.fillStyle = g; c.beginPath(); c.moveTo(-12, 6); c.lineTo(-14, -6); c.lineTo(-8, 0); c.lineTo(-5, -9); c.lineTo(0, -1); c.lineTo(5, -9); c.lineTo(8, 0); c.lineTo(14, -6); c.lineTo(12, 6); c.closePath(); c.fill();
      c.fillStyle = '#B45309'; c.fillRect(-12, 3.4, 24, 2.6); c.fillStyle = '#EF4444'; c.beginPath(); c.arc(0, 2.4, 1.9, 0, FX_TAU); c.fill(); c.fillStyle = '#60A5FA'; c.beginPath(); c.arc(-7, 3, 1.3, 0, FX_TAU); c.arc(7, 3, 1.3, 0, FX_TAU); c.fill();
      c.fillStyle = '#FEF3C7'; [[-14, -6], [-5, -9], [5, -9], [14, -6]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 1.4, 0, FX_TAU); c.fill(); });
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', 0, 0, 24 + gl * 14, 0.5 + 0.4 * gl); fxStar4(c, -5 + Math.sin(y) * 2, -9, 5 + gl * 4, 0.9, '#FFFFFF'); c.restore();
    }
    return function (c, t, dt) {
      var cyc = (t + (FX_REDUCE ? 6.6 : 0)) % C, mo = cyc - 7.5, king = fxEnv(mo, 0.3, 1.1, 3.6, 4.6), cd = fxEase((mo - 0.7) / 0.8) * (1 - fxEase((mo - 3.9) / 1.0)), blaze = fxEnv(mo, 1.4, 1.7, 3.4, 4.4), dim = fxEnv(mo, 0, 0.6, 3.8, 4.8), k;
      var sk = mo > 1.5 ? 100 + Math.floor((mo - 1.5) / 0.16) : Math.floor(cyc / 1.6);
      if (sk !== lastS) { lastS = sk; if (sk >= 100) { if (sk - 100 < 14) { strike((sk - 100) % 6); if (sk > 106) { strike((sk - 97) % 6); } } } else if (cyc > 0.5) { strike(Math.floor(fxR(0, 6))); } }
      /* the hall: three slits of violet light, a slow halo of rings behind the throne, and two banners */
      c.globalCompositeOperation = 'lighter';
      [-112, 0, 112].forEach(function (wx) { var g = c.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, 'rgba(167,139,250,' + (0.4 * (1 - 0.6 * dim)).toFixed(3) + ')'); g.addColorStop(1, 'rgba(167,139,250,0)'); c.fillStyle = g; c.fillRect(wx - 5, 0, 10, 100); lkBeam(c, wx, 0, Math.PI / 2 - wx * 0.0022, 170, 0.1, '139,92,246', 0.13 * (1 - 0.6 * dim)); });
      for (k = 0; k < 2; k++) { var R = 56 + k * 12, rr = t * (k ? -0.22 : 0.16); fxRing(c, 0, 72, R, R, '167,139,250', 0.22 + 0.3 * blaze, 1); c.strokeStyle = 'rgba(196,181,253,' + (0.4 + 0.4 * blaze).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath(); for (j = 0; j < 24; j++) { var ta = rr + j / 24 * FX_TAU, tl = j % 6 === 0 ? 6 : 3; c.moveTo(Math.cos(ta) * R, 72 + Math.sin(ta) * R); c.lineTo(Math.cos(ta) * (R - tl), 72 + Math.sin(ta) * (R - tl)); } c.stroke(); }
      c.globalCompositeOperation = 'source-over';
      [-138, 138].forEach(function (bx, n) { var sw = Math.sin(t * 0.9 + n * 2) * 3, s2 = Math.sin(t * 1.3 + n) * 2, ex = bx + s2 * 0.6; c.fillStyle = '#3B0764'; c.beginPath(); c.moveTo(bx - 13, 12); c.lineTo(bx + 13, 12); c.quadraticCurveTo(bx + 13 + s2, 66, bx + 13 + sw, 116); c.lineTo(bx + sw, 104); c.lineTo(bx - 13 + sw, 116); c.quadraticCurveTo(bx - 13 + s2, 66, bx - 13, 12); c.fill(); c.strokeStyle = '#D4A94A'; c.lineWidth = 1; c.stroke(); c.fillStyle = '#B08D3C'; c.fillRect(bx - 16, 10, 32, 3); c.strokeStyle = '#FDE68A'; c.lineWidth = 1.2; c.beginPath(); c.arc(ex, 54, 6.5, 0, FX_TAU); c.moveTo(ex, 44); c.lineTo(ex + 4, 54); c.lineTo(ex, 64); c.lineTo(ex - 4, 54); c.closePath(); c.stroke(); });
      /* the floor: a dark disc, its cracks leaking light that pulses outward, and the ring of words */
      c.fillStyle = '#0C0919'; c.beginPath(); c.ellipse(0, 171, 156, 23.5, 0, 0, FX_TAU); c.fill(); c.strokeStyle = 'rgba(139,92,246,.6)'; c.lineWidth = 1.2; c.stroke();
      c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round';
      Cr.forEach(function (pts, n) {
        var xy = pts.map(function (p) { return fl(p[0], p[1]); }), pu = (t * 0.45 + n * 0.21) % 1, pp = xy[Math.min(xy.length - 1, Math.floor(pu * xy.length))];
        [[4.5, 0.16], [1.3, 0.75]].forEach(function (L) { c.lineWidth = L[0]; c.strokeStyle = 'rgba(168,85,247,' + Math.min(1, L[1] * (0.55 + 0.9 * blaze)).toFixed(3) + ')'; trace(c, xy); });
        fxGlow(c, '216,180,254', pp[0], pp[1], 7 + 6 * blaze, 0.7);
      });
      if (mo > 1.4 && mo < 2.6) { var su = (mo - 1.4) / 1.2; fxRing(c, 0, 171, 20 + su * 140, 3 + su * 21, '216,180,254', 1 - su, 2.4); }
      c.globalCompositeOperation = 'source-over'; c.font = '700 7px ' + FX_MONO; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (k = 0; k < TXT.length; k++) { var la = t * 0.14 + k / TXT.length * FX_TAU, lp = fl(la, 143), dep = (Math.sin(la) + 1) / 2; c.fillStyle = 'rgba(221,214,254,' + ((0.18 + 0.6 * dep) * (0.7 + 0.3 * blaze)).toFixed(3) + ')'; c.fillText(TXT.charAt(k), lp[0], lp[1]); }
      /* the steps, the swords, and the throne */
      [[62, 160, 154], [50, 154, 148], [38, 148, 142]].forEach(function (s3) { var g = c.createLinearGradient(0, s3[2], 0, s3[1]); g.addColorStop(0, '#2A2244'); g.addColorStop(1, '#120E22'); c.fillStyle = g; c.beginPath(); c.moveTo(-s3[0], s3[1]); c.lineTo(-s3[0] + 5, s3[2]); c.lineTo(s3[0] - 5, s3[2]); c.lineTo(s3[0], s3[1]); c.fill(); c.strokeStyle = 'rgba(167,139,250,.45)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-s3[0] + 5, s3[2]); c.lineTo(s3[0] - 5, s3[2]); c.stroke(); });
      SW.forEach(function (q2) { c.save(); c.translate(q2[0], q2[1]); c.rotate(q2[2]); var g = c.createLinearGradient(-2, 0, 2, 0); g.addColorStop(0, '#CBD5E1'); g.addColorStop(0.5, '#475569'); g.addColorStop(1, '#1E293B'); c.fillStyle = g; c.fillRect(-2, -24, 4, 24); c.fillStyle = '#B08D3C'; c.fillRect(-6, -26.5, 12, 2.5); c.fillStyle = '#3B2A14'; c.fillRect(-1.3, -36, 2.6, 9.5); c.fillStyle = '#D4A94A'; c.beginPath(); c.arc(0, -37.5, 2, 0, FX_TAU); c.fill(); c.restore(); });
      var tg = c.createLinearGradient(-26, 0, 26, 0); tg.addColorStop(0, '#0A0814'); tg.addColorStop(0.5, '#1E1838'); tg.addColorStop(1, '#0A0814'); c.fillStyle = tg; c.strokeStyle = 'rgba(168,85,247,' + (0.75 + 0.25 * blaze).toFixed(3) + ')'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(-24, 142); c.lineTo(-24, 58); c.lineTo(-19, 34); c.lineTo(-13, 52); c.lineTo(-8, 44); c.lineTo(0, 16); c.lineTo(8, 44); c.lineTo(13, 52); c.lineTo(19, 34); c.lineTo(24, 58); c.lineTo(24, 142); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#4C0519'; c.beginPath(); c.moveTo(-16, 112); c.lineTo(-16, 68); c.quadraticCurveTo(0, 50, 16, 68); c.lineTo(16, 112); c.fill(); c.strokeStyle = 'rgba(212,169,74,.7)'; c.lineWidth = 0.8; c.stroke();
      c.fillStyle = tg; c.strokeStyle = 'rgba(168,85,247,.8)'; c.lineWidth = 1; c.beginPath(); c.rect(-30, 112, 60, 11); c.rect(-34, 98, 8, 44); c.rect(26, 98, 8, 44); c.fill(); c.stroke(); c.fillStyle = '#7F1D1D'; c.fillRect(-25, 109, 50, 4);
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '192,132,252', 0, 26, 9 + 3 * Math.sin(t * 2.2) + 8 * blaze, 0.9); fxGlow(c, '192,132,252', -30, 98, 5, 0.7); fxGlow(c, '192,132,252', 30, 98, 5, 0.7);
      /* the king of shadow, seated, with the crown coming down onto his head */
      c.globalCompositeOperation = 'source-over';
      if (king > 0) {
        c.globalAlpha = king; c.fillStyle = '#05030D'; c.strokeStyle = 'rgba(192,132,252,.9)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(-7, 92); c.quadraticCurveTo(-19, 95, -21, 112); c.lineTo(-27, 141); c.lineTo(-9, 141); c.lineTo(-8, 124); c.lineTo(8, 124); c.lineTo(9, 141); c.lineTo(27, 141); c.lineTo(21, 112); c.quadraticCurveTo(19, 95, 7, 92); c.closePath(); c.fill(); c.stroke();
        c.beginPath(); c.arc(0, 85, 8, 0, FX_TAU); c.fill(); c.stroke(); c.globalAlpha = 1;
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '233,213,255', -3.2, 85, 3 + 3 * blaze, king); fxGlow(c, '233,213,255', 3.2, 85, 3 + 3 * blaze, king); c.fillStyle = 'rgba(255,255,255,' + king.toFixed(3) + ')'; c.fillRect(-4.4, 84.4, 2.4, 1.2); c.fillRect(2, 84.4, 2.4, 1.2);
      }
      c.globalCompositeOperation = 'lighter'; var cy = 62 + Math.sin(t * 1.3) * 3 * (1 - cd) + cd * 13; lkBeam(c, 0, -4, Math.PI / 2, cy + 30, 0.11, '253,224,71', 0.3 + 0.25 * blaze);
      c.globalCompositeOperation = 'source-over'; crown(c, cy, blaze);
      lkEvery(o, 5 + 16 * blaze, dt, function () { Dr.push({ x: fxR(-11, 11), y: cy + 5, vx: fxR(-3, 3), vy: fxR(6, 20), l: 0, m: fxR(0.7, 1.4) }); });
      c.globalCompositeOperation = 'lighter'; lkStep(Dr, dt, 40, 0, function (p, f) { fxGlow(c, '253,224,71', p.x, p.y, 2.6, f); });
      /* dark lightning to the swords, and what rises from the floor */
      lkStep(Bt, dt, 0, 0, function (b, f) {
        c.lineJoin = 'round'; c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
        [[9, 0.3], [4, 0.85]].forEach(function (L) { c.lineWidth = L[0]; c.strokeStyle = 'rgba(168,85,247,' + (L[1] * f).toFixed(3) + ')'; trace(c, b.pts); });
        c.globalCompositeOperation = 'source-over'; c.lineWidth = 1.5; c.strokeStyle = 'rgba(5,2,14,' + f.toFixed(3) + ')'; trace(c, b.pts);
        c.globalCompositeOperation = 'lighter'; fxGlow(c, '233,213,255', b.x, b.y, 16, f); fxRing(c, b.x, b.y + 34, 4 + (1 - f) * 22, 1 + (1 - f) * 4, '216,180,254', f, 1.2);
      });
      c.globalCompositeOperation = 'lighter';
      Em.forEach(function (e, n) { e.u = (e.u + dt * e.sp * (1 + 2 * blaze)) % 1; fxGlow(c, e.g ? '253,224,71' : '192,132,252', e.x + Math.sin(e.u * 7 + n) * 9, 176 - e.u * 170, 2.2 * e.z, Math.sin(e.u * Math.PI) * 0.6); });
      if (mo > 1.6 && king > 0) { zType(c, 'the crown remembers.', 0, 9, (mo - 1.6) / 0.9, '600 9px ' + FX_MONO, 'rgba(233,213,255,' + king.toFixed(3) + ')', '#A855F7'); }
      c.globalCompositeOperation = 'source-over';
    };
  });

  /* Carousel (Radiant): a golden carousel turns at a night fair. Eight horses rise and fall on twisted poles, passing behind the
     mirrored column and in front of it; the striped canopy turns, its bulbs chase, a Ferris wheel turns far behind under strings
     of lights, and notes drift up. Then the lights go down, every bulb fires at once, the ride spins up and throws sparks, and
     fireworks open over the top */
  gwStage('carousel', function () {
    var N = 8, C = 14, Fw = [], Nt = [], Sk = [], Bk = [], i, o2 = {}, o3 = {}, rot = 0, lastF = -1, HC = ['#FFFFFF', '#FDE68A', '#FBCFE8', '#BAE6FD'], SC = ['#F43F5E', '#0EA5E9', '#F59E0B', '#8B5CF6', '#10B981', '#EC4899', '#3B82F6', '#EAB308'];
    for (i = 0; i < 26; i++) { Bk.push({ x: fxR(-165, 165), y: fxR(0, 120), r: fxR(5, 16), p: fxR(0, 6), h: [330, 45, 200, 280][i % 4] }); }
    function horse(c, body, mane, sad, g) {
      var s1 = Math.sin(g), s2 = Math.cos(g);
      c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = body; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(-8, 4); c.lineTo(-13 - 3 * s1, 10); c.lineTo(-11 - 6 * s1, 16 - 2 * s1); c.moveTo(-6, 4); c.lineTo(-9 + 3 * s1, 11); c.lineTo(-12 + 4 * s1, 16); c.moveTo(8, 4); c.lineTo(12 + 3 * s2, 10); c.lineTo(15 + 5 * s2, 15); c.moveTo(6, 4); c.lineTo(8 - 2 * s2, 11); c.lineTo(11 - 4 * s2, 16); c.stroke();
      c.fillStyle = body; c.beginPath(); c.ellipse(0, 0, 13, 6.4, 0, 0, FX_TAU); c.fill();
      c.beginPath(); c.moveTo(-7, -4); c.quadraticCurveTo(-12, -13, -16, -17); c.lineTo(-23, -12.5); c.lineTo(-22, -9.5); c.lineTo(-17, -10.5); c.quadraticCurveTo(-13, -3, -9, 3); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-16.5, -17); c.lineTo(-15.5, -21.5); c.lineTo(-13.5, -16); c.fill();
      c.strokeStyle = mane; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-14, -17); c.quadraticCurveTo(-9, -12, -7, -5); c.stroke(); c.beginPath(); c.moveTo(12.5, -2); c.quadraticCurveTo(19 + 2 * s1, -3, 20 + 2 * s1, 7); c.stroke();
      c.fillStyle = sad; c.beginPath(); c.moveTo(-5, -6.6); c.quadraticCurveTo(0, -9.5, 5, -6.6); c.lineTo(4.5, 1.5); c.quadraticCurveTo(0, 3.5, -4.5, 1.5); c.closePath(); c.fill();
      c.strokeStyle = '#FDE047'; c.lineWidth = 1; c.beginPath(); c.moveTo(-5, -6.6); c.quadraticCurveTo(0, -9.5, 5, -6.6); c.moveTo(-20.5, -11); c.lineTo(-17.5, -14.5); c.stroke();
      c.fillStyle = '#1E1B4B'; c.beginPath(); c.arc(-18.3, -14, 0.9, 0, FX_TAU); c.fill();
    }
    return function (c, t, dt) {
      var T = t + (FX_REDUCE ? 9.6 : 0), cyc = T % C, mo = cyc - 8, dimv = fxEnv(mo, 0, 0.5, 1.0, 1.3), burst = fxEnv(mo, 1.0, 1.3, 4.2, 5.4), lit = 1 - 0.8 * dimv, k, j, fr = Math.floor(T * 6);
      rot += dt * (0.55 + 1.5 * burst - 0.3 * dimv);
      /* the fair behind: soft lights, a Ferris wheel, fireworks, and strings of bulbs */
      c.globalCompositeOperation = 'lighter';
      Bk.forEach(function (b) { fxGlow(c, gwRgb(b.h, 90, 65), b.x, b.y, b.r, (0.1 + 0.05 * Math.sin(T * 0.8 + b.p)) * lit); });
      c.strokeStyle = 'rgba(165,180,252,' + (0.3 * lit).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath(); c.arc(-122, 80, 42, 0, FX_TAU); c.moveTo(-122, 80); c.lineTo(-140, 160); c.moveTo(-122, 80); c.lineTo(-104, 160);
      for (k = 0; k < 10; k++) { var wa = T * 0.13 + k / 10 * FX_TAU; c.moveTo(-122, 80); c.lineTo(-122 + Math.cos(wa) * 42, 80 + Math.sin(wa) * 42); } c.stroke();
      for (k = 0; k < 10; k++) { var wb = T * 0.13 + k / 10 * FX_TAU; fxGlow(c, gwRgb(k * 36, 95, 65), -122 + Math.cos(wb) * 42, 83 + Math.sin(wb) * 42, 5, 0.8 * lit); }
      var fi = mo > 1.1 ? Math.floor((mo - 1.1) / 0.75) : -1;
      if (fi !== lastF) { lastF = fi; if (fi >= 0 && fi < 4) { var fx0 = [-70, 84, 6, -112][fi], fy0 = [30, 24, 12, 44][fi], hu = [45, 330, 190, 280][fi]; for (j = 0; j < 34; j++) { var fa = j / 34 * FX_TAU + fxR(-0.1, 0.1), fv = fxR(30, 62); Fw.push({ x: fx0, y: fy0, vx: Math.cos(fa) * fv, vy: Math.sin(fa) * fv, l: 0, m: fxR(0.9, 1.5), h: hu + fxR(-18, 18) }); } } }
      lkStep(Fw, dt, 26, 0.22, function (p, f) { var rgb = gwRgb(p.h, 95, 68); fxGlow(c, rgb, p.x, p.y, 3.2, f); c.strokeStyle = 'rgba(' + rgb + ',' + (0.6 * f).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.09, p.y - p.vy * 0.09); c.stroke(); });
      [[-166, 6, -8, 8], [166, 6, 8, 8]].forEach(function (L, n) {
        c.strokeStyle = 'rgba(148,163,184,.35)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(L[0], L[1]); c.quadraticCurveTo((L[0] + L[2]) / 2, 44, L[2], L[3]); c.stroke();
        for (k = 1; k < 11; k++) { var u = k / 11, bx = (1 - u) * (1 - u) * L[0] + 2 * u * (1 - u) * (L[0] + L[2]) / 2 + u * u * L[2], by = (1 - u) * (1 - u) * L[1] + 2 * u * (1 - u) * 44 + u * u * L[3], on = (k + fr + n) % 3 === 0 || burst > 0.5; fxGlow(c, gwRgb(k * 67 + n * 40, 95, 66), bx, by + 2, on ? 6.5 : 3.5, (on ? 0.95 : 0.4) * Math.min(1, lit + burst)); }
      });
      /* the ground glow, the drum under the platform with its chasing bulbs, and the platform */
      fxGlow(c, '251,191,36', 0, 162, 170, 0.2 * lit + 0.2 * burst); c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#7F1D1D'; c.beginPath(); c.ellipse(0, 163, 120, 17.5, 0, 0, Math.PI); c.lineTo(-120, 156); c.ellipse(0, 156, 120, 17.5, 0, Math.PI, 0, true); c.closePath(); c.fill();
      var pg = c.createLinearGradient(-120, 0, 120, 0); pg.addColorStop(0, '#2A1420'); pg.addColorStop(0.5, '#5B2A3C'); pg.addColorStop(1, '#2A1420'); c.fillStyle = pg; c.beginPath(); c.ellipse(0, 156, 120, 17.5, 0, 0, FX_TAU); c.fill(); c.strokeStyle = '#FACC15'; c.lineWidth = 1.4; c.stroke();
      c.strokeStyle = 'rgba(250,204,21,.3)'; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 156, 84, 12.2, 0, 0, FX_TAU); c.stroke();
      c.globalCompositeOperation = 'lighter';
      for (k = 0; k < 22; k++) { var ba = (k + 0.5) / 22 * Math.PI, bon = (k + fr) % 3 === 0 || burst > 0.6; fxGlow(c, bon ? '254,240,138' : '251,191,36', Math.cos(ba) * 120, 160.5 + Math.sin(ba) * 17.5, bon ? 6 : 3, (bon ? 1 : 0.45) * Math.min(1, lit + burst)); }
      /* beams of light turning from the top of the column */
      for (k = 0; k < 4; k++) { lkBeam(c, 0, 70, rot * 0.7 + k * Math.PI / 2, 170, 0.09, '254,240,138', (0.07 + 0.16 * burst) * lit); }
      c.globalCompositeOperation = 'source-over';
      /* the horses behind, the column, the horses in front */
      var Hs = []; for (k = 0; k < N; k++) { var a = rot + k / N * FX_TAU; Hs.push([Math.sin(a), Math.cos(a) * 96, k]); } Hs.sort(function (p, q) { return p[0] - q[0]; });
      function ride(h) {
        var d = h[0], x = h[1], n = h[2], yb = 152 + d * 11, scl = 0.8 + 0.2 * d, bob = Math.sin(rot * 2.6 + n * 2.4) * 8 * scl, hy = yb - 30 * scl + bob;
        c.globalAlpha = (0.5 + 0.5 * (d + 1) / 2) * Math.min(1, 0.35 + 0.65 * lit + 0.4 * burst);
        var gg = c.createLinearGradient(x - 1.6, 0, x + 1.6, 0); gg.addColorStop(0, '#92400E'); gg.addColorStop(0.5, '#FDE68A'); gg.addColorStop(1, '#B45309'); c.strokeStyle = gg; c.lineWidth = 2.2 * scl; c.beginPath(); c.moveTo(x, 62 + d * 12); c.lineTo(x, yb); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 0.7; c.beginPath(); for (j = 0; j < 9; j++) { var yy = 70 + d * 12 + ((j * 10 + rot * 20) % 80); if (yy < yb - 3) { c.moveTo(x - 1.4 * scl, yy); c.lineTo(x + 1.4 * scl, yy + 2.4); } } c.stroke();
        c.save(); c.translate(x, hy); c.scale(d > 0 ? scl : -scl, scl); c.rotate(Math.sin(rot * 2.6 + n * 2.4 + 1.2) * 0.1); horse(c, HC[n % 4], SC[(n + 3) % 8], SC[n], rot * 5.2 + n * 2); c.restore();
        c.globalAlpha = 1;
        if (d > 0.1 && burst > 0.1) { lkEvery(o2, burst * 5, dt, function () { Sk.push({ x: x + fxR(8, 20), y: hy + fxR(-8, 10), vx: fxR(20, 60), vy: fxR(-20, 10), l: 0, m: fxR(0.5, 1.0) }); }); }
      }
      Hs.forEach(function (h) { if (h[0] < 0) { ride(h); } });
      for (k = 0; k < 5; k++) { var br = 0.5 + 0.5 * Math.sin(rot * 2 + k * 1.3); c.fillStyle = 'rgb(' + gwRgb(46, 80, 38 + 50 * br * (0.4 + 0.6 * lit)) + ')'; c.fillRect(-14 + k * 5.6, 62, 5.9, 92); }
      c.fillStyle = '#B45309'; c.fillRect(-15.5, 74, 31, 3); c.fillRect(-15.5, 104, 31, 3); c.fillRect(-15.5, 136, 31, 3); c.fillRect(-16, 151, 32, 4);
      [89, 120].forEach(function (my, n) { c.fillStyle = '#E0F2FE'; c.strokeStyle = '#B45309'; c.lineWidth = 1.2; c.beginPath(); c.arc(0, my, 6, 0, FX_TAU); c.fill(); c.stroke(); c.globalCompositeOperation = 'lighter'; fxStar4(c, Math.sin(rot * 2 + n * 2) * 4, my - 1, 4 + 2 * Math.sin(rot * 4 + n), 0.9 * lit, '#FFFFFF'); c.globalCompositeOperation = 'source-over'; });
      Hs.forEach(function (h) { if (h[0] >= 0) { ride(h); } });
      c.globalCompositeOperation = 'lighter'; lkStep(Sk, dt, 20, 0.3, function (p, f) { fxStar4(c, p.x, p.y, 3.4 * f, f, '#FDE68A'); });
      /* the canopy: stripes that turn, a scalloped edge hung with bulbs, and a pennant on top */
      c.globalCompositeOperation = 'source-over';
      for (k = 0; k < 16; k++) {
        var a0 = ((rot * 0.5 + k / 16 * FX_TAU) % FX_TAU + FX_TAU) % FX_TAU, a1 = a0 + FX_TAU / 16, lo = a0, hi = Math.min(a1, Math.PI);
        if (a1 > FX_TAU) { lo = 0; hi = a1 - FX_TAU; }
        if (hi <= lo) { continue; }
        var sh = 0.55 + 0.45 * Math.sin((lo + hi) / 2), lw = 0.3 + 0.7 * lit; c.fillStyle = k % 2 ? 'rgb(' + Math.round(30 + 200 * sh * lw) + ',' + Math.round(38 * sh) + ',' + Math.round(38 * sh) + ')' : 'rgb(' + Math.round(254 * sh * lw) + ',' + Math.round(243 * sh * lw) + ',' + Math.round(199 * sh * lw) + ')';
        c.beginPath(); c.moveTo(0, 16); for (j = 0; j <= 4; j++) { var aa = lo + (hi - lo) * j / 4; c.lineTo(Math.cos(aa) * 130, 58 + Math.sin(aa) * 15); } c.closePath(); c.fill();
      }
      c.strokeStyle = '#FACC15'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 58, 130, 15, 0, 0, Math.PI); c.stroke();
      for (k = 0; k < 15; k++) { var v0 = k / 15 * Math.PI, v1 = (k + 1) / 15 * Math.PI, vm = (v0 + v1) / 2; c.fillStyle = k % 2 ? '#B91C1C' : '#FDE68A'; c.beginPath(); c.moveTo(Math.cos(v0) * 130, 58 + Math.sin(v0) * 15); c.quadraticCurveTo(Math.cos(vm) * 131, 58 + Math.sin(vm) * 15 + 12, Math.cos(v1) * 130, 58 + Math.sin(v1) * 15); c.closePath(); c.fill(); }
      c.globalCompositeOperation = 'lighter';
      for (k = 0; k <= 15; k++) { var va = k / 15 * Math.PI, von = (k + fr) % 2 === 0 || burst > 0.5; fxGlow(c, von ? '254,240,138' : '251,191,36', Math.cos(va) * 130, 59 + Math.sin(va) * 15, von ? 7 : 3.5, (von ? 1 : 0.5) * Math.min(1, lit + burst)); }
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#FACC15'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 16); c.lineTo(0, 2); c.stroke(); c.fillStyle = '#FDE047'; c.beginPath(); c.arc(0, 15, 3.4, 0, FX_TAU); c.fill();
      c.fillStyle = '#F43F5E'; c.beginPath(); c.moveTo(0, 2); c.quadraticCurveTo(8, 1 + Math.sin(T * 5) * 2, 15, 5 + Math.sin(T * 5 + 1) * 2.4); c.quadraticCurveTo(8, 7 + Math.sin(T * 5) * 2, 0, 8); c.fill();
      /* notes drifting up, and the moment the lights go down and come back */
      lkEvery(o3, 1.6 + 3 * burst, dt, function () { Nt.push({ x: fxR(-110, 110), y: fxR(40, 70), vx: fxR(-6, 6), vy: fxR(-18, -9), l: 0, m: fxR(1.6, 2.6), h: fxR(0, 360) }); });
      lkStep(Nt, dt, 0, 0, function (p, f) { var wx = p.x + Math.sin(p.l * 3 + p.h) * 4; c.globalAlpha = Math.sin(f * Math.PI) * 0.9; c.fillStyle = 'rgb(' + gwRgb(p.h, 90, 78) + ')'; c.strokeStyle = c.fillStyle; c.lineWidth = 1; c.beginPath(); c.ellipse(wx, p.y, 2.4, 1.8, -0.4, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(wx + 2.1, p.y - 0.6); c.lineTo(wx + 2.1, p.y - 8); c.lineTo(wx + 5.4, p.y - 6.6); c.stroke(); c.globalAlpha = 1; });
      if (mo > 0.95 && mo < 1.7) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '254,240,138', 0, 100, 220, (1 - (mo - 0.95) / 0.75) * 0.7); }
      c.globalCompositeOperation = 'source-over';
    };
  });

  /* ---------- right-answer effects: drawn on a layer over the page, never over the answer itself (k is its box) ---------- */
  /* Level up (8-Bit, Common): a pixel bar under the answer fills with experience, flashes, and LEVEL UP! bounces in above it in
     every color while pillars of pixels rise at both ends, sparks march round the frame and three stat lines tick up */
  FX_DUR.levelup = 3.4;
  FX_DRAW.levelup = function (s, k) {
    var P = 3, Sp = [], i, ST = ['+1 FOCUS', '+1 SPEED', '+2 WISDOM'];
    for (i = 0; i < 26; i++) { Sp.push({ u: Math.random(), sd: i % 2, x: fxR(0, 22), sp: fxR(0.5, 1.1) }); }
    function sn(v) { return Math.round(v / P) * P; }
    return function (t) {
      var c = s.ctx, a = fxEnv(t, 0, 0.15, 2.8, 3.4), fill = Math.min(1, t / 1.15), up = t - 1.2, fr = Math.floor(t * 10), bx = sn(k.x), by = sn(k.y + k.h + 9), bw = sn(k.w), j, n;
      lkOut(c, s, k, 3); c.globalAlpha = a;
      /* pillars of pixels at both ends once the level is gained */
      if (up > 0) { Sp.forEach(function (p, m) { var u = (up * p.sp + p.u) % 1, x = p.sd ? k.x + k.w - 4 - p.x : k.x + 4 + p.x; c.globalAlpha = a * (1 - u); bcPx(c, sn(x), sn(k.y + k.h - u * (k.h + 90)), P, m % 3 ? '#FDE047' : '#FFFFFF', 1, m % 4 === 0 ? 3 : 1); }); c.globalAlpha = a; }
      /* the bar */
      c.fillStyle = '#0B0920'; c.fillRect(bx - P, by - P, bw + P * 2, P * 5); c.fillStyle = '#E2E8F0'; c.fillRect(bx - P, by - P, bw + P * 2, P); c.fillRect(bx - P, by + P * 3, bw + P * 2, P); c.fillRect(bx - P, by, P, P * 3); c.fillRect(bx + bw, by, P, P * 3);
      c.fillStyle = up > 0 && up < 0.5 && fr % 2 ? '#FFFFFF' : '#4ADE80'; c.fillRect(bx, by, sn(bw * fill), P * 3); c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(bx, by, sn(bw * fill), P);
      if (fill < 1) { bcSpark(c, bx + sn(bw * fill), by + P, P, fr % 4, '#FFFFFF'); }
      bcText(c, up > 0 ? 'LV 8' : 'LV 7', k.x + 20, by + P * 6, 2, up > 0 ? '#FDE047' : '#94A3B8', a); bcText(c, Math.round(fill * 100) + '/100 XP', k.x + k.w - 34, by + P * 6, 2, '#94A3B8', a);
      /* sparks marching round the frame */
      for (j = 0; j < 14; j++) { var per = (k.w + k.h) * 2, d = ((j / 14 + t * 0.22) % 1) * per, x = d < k.w ? k.x + d : d < k.w + k.h ? k.x + k.w : d < k.w * 2 + k.h ? k.x + k.w - (d - k.w - k.h) : k.x, y = d < k.w ? k.y : d < k.w + k.h ? k.y + (d - k.w) : d < k.w * 2 + k.h ? k.y + k.h : k.y + k.h - (d - k.w * 2 - k.h); c.globalAlpha = a; bcSpark(c, sn(x + (x <= k.x ? -6 : x >= k.x + k.w ? 6 : 0)), sn(y + (y <= k.y ? -6 : y >= k.y + k.h ? 6 : 0)), P, (fr + j) % 4, j % 2 ? '#67E8F9' : '#FDE047'); }
      /* the words, the burst and the stats */
      if (up > 0) {
        'LEVEL UP!'.split('').forEach(function (ch, m) { var dp = Math.max(0, 1 - (up - m * 0.05) / 0.25); bcText(c, ch, k.cx + (m - 4) * 16, sn(k.y - 34 - dp * 40 + (dp > 0 ? 0 : Math.sin(up * 7 - m * 0.8) * 3)), 4, 'rgb(' + zHsl(fr * 16 + m * 40, 95, 62) + ')', a); });
        if (up < 0.8) { for (n = 0; n < 8; n++) { var ba = n / 8 * FX_TAU, bd = 20 + up * 190; c.globalAlpha = a * (1 - up / 0.8); bcSpark(c, sn(k.cx + Math.cos(ba) * bd), sn(k.y - 26 + Math.sin(ba) * bd * 0.5), P, 2, n % 2 ? '#FFFFFF' : '#FDE047'); } }
        ST.forEach(function (tx, m) { var su = up - 0.45 - m * 0.3; if (su > 0) { bcText(c, tx, k.x + k.w - 46, sn(k.y - 62 - m * 14 - Math.min(1, su / 0.2) * 6), 2, m === 2 ? '#F0ABFC' : '#A5F3FC', a * Math.min(1, su / 0.15)); } });
      }
      c.globalAlpha = 1; lkIn(c);
      lkFinish(c, k, a * Math.min(1, Math.max(0, up) / 0.2), (up - 0.1) / 0.8, '74,222,128');
    };
  };

  /* Royal seal (Royal Court, Rare): red wax drips and pools under the corner of the answer, a brass seal comes down and
     presses it, and lifts to show a crown in the wax. Two ribbons unroll beneath, gold dust bursts, and a gold line with a
     curl at each end draws itself above the answer */
  FX_DUR.seal = 3.6;
  FX_DRAW.seal = function (s, k) {
    var Du = [], done = 0, Bl = [], i; for (i = 0; i < 12; i++) { Bl.push(0.86 + 0.24 * Math.random()); }
    function blob(c, x, y, r) { c.beginPath(); for (var j = 0; j <= 48; j++) { var an = j / 48 * FX_TAU, q = (an / FX_TAU * 12) % 12, i0 = Math.floor(q) % 12, f = q - Math.floor(q), rr = r * (Bl[i0] * (1 - f) + Bl[(i0 + 1) % 12] * f); if (j) { c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } else { c.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } } c.closePath(); }
    return function (t, dt) {
      var c = s.ctx, a = fxEnv(t, 0, 0.12, 3.0, 3.6), sx = k.x + k.w - 34, sy = k.y + k.h + 24, pool = fxEase(t / 0.7), press = fxEnv(t, 0.7, 1.0, 1.15, 1.5), shown = t > 1.12, j;
      if (shown && !done) { done = 1; for (j = 0; j < 30; j++) { var an = fxR(0, FX_TAU), v = fxR(30, 130); Du.push({ x: sx, y: sy, vx: Math.cos(an) * v, vy: Math.sin(an) * v - 30, l: 0, m: fxR(0.6, 1.3) }); } }
      lkOut(c, s, k, 2);
      /* the ribbons under the wax */
      var rb = fxEase((t - 0.9) / 0.9);
      [-1, 1].forEach(function (d) { if (rb <= 0) { return; } var L = 54 * rb, w = Math.sin(t * 3 + d) * 3 * rb; c.globalAlpha = a; c.fillStyle = d < 0 ? '#9F1239' : '#BE123C'; c.beginPath(); c.moveTo(sx + d * 3 - 7, sy + 4); c.quadraticCurveTo(sx + d * 12 - 7 + w, sy + L * 0.5, sx + d * 16 - 7 + w * 1.6, sy + L); c.lineTo(sx + d * 16 + w * 1.6, sy + L - 7); c.lineTo(sx + d * 16 + 7 + w * 1.6, sy + L); c.quadraticCurveTo(sx + d * 12 + 7 + w, sy + L * 0.5, sx + d * 3 + 7, sy + 4); c.closePath(); c.fill(); c.strokeStyle = 'rgba(253,224,71,.7)'; c.lineWidth = 0.8; c.stroke(); });
      /* drips of wax, then the pool */
      c.globalAlpha = a; c.fillStyle = '#B91C1C';
      for (j = 0; j < 3; j++) { var du = (t - j * 0.16) / 0.34; if (du > 0 && du < 1) { var dy = sy - 120 + 118 * du * du; c.beginPath(); c.moveTo(sx + (j - 1) * 5, dy - 8); c.quadraticCurveTo(sx + (j - 1) * 5 + 4, dy, sx + (j - 1) * 5, dy + 3.5); c.quadraticCurveTo(sx + (j - 1) * 5 - 4, dy, sx + (j - 1) * 5, dy - 8); c.fill(); } }
      if (pool > 0) {
        var R = 19 * pool * (1 + 0.1 * press), wg = c.createRadialGradient(sx - 5, sy - 6, 2, sx, sy, R * 1.1); wg.addColorStop(0, '#F87171'); wg.addColorStop(0.55, '#B91C1C'); wg.addColorStop(1, '#7F1D1D'); c.fillStyle = wg; blob(c, sx, sy, R); c.fill();
        if (shown) { var em = Math.min(1, (t - 1.12) / 0.25); c.globalAlpha = a * em; c.strokeStyle = '#7F1D1D'; c.lineWidth = 1.4; c.beginPath(); c.arc(sx, sy, 12.5, 0, FX_TAU); c.stroke(); c.fillStyle = '#7F1D1D'; c.beginPath(); c.moveTo(sx - 7.5, sy + 5); c.lineTo(sx - 9, sy - 4); c.lineTo(sx - 4.5, sy); c.lineTo(sx - 2.5, sy - 6.5); c.lineTo(sx, sy - 1); c.lineTo(sx + 2.5, sy - 6.5); c.lineTo(sx + 4.5, sy); c.lineTo(sx + 9, sy - 4); c.lineTo(sx + 7.5, sy + 5); c.closePath(); c.fill(); c.strokeStyle = 'rgba(254,202,202,.8)'; c.lineWidth = 0.7; c.beginPath(); c.arc(sx - 0.6, sy - 0.6, 12.5, Math.PI, Math.PI * 1.6); c.stroke(); c.globalAlpha = a; }
      }
      /* the brass seal, coming down and going away */
      var hy = t < 0.7 ? -200 : t < 1.0 ? -120 * (1 - fxEase((t - 0.7) / 0.3)) : t < 1.15 ? 0 : -160 * fxEase((t - 1.15) / 0.5);
      if (t > 0.7 && t < 1.7) { c.save(); c.translate(sx + 6 + hy * -0.12, sy + hy); c.rotate(0.12); var hg = c.createLinearGradient(-13, 0, 13, 0); hg.addColorStop(0, '#78350F'); hg.addColorStop(0.4, '#FDE68A'); hg.addColorStop(1, '#92400E'); c.fillStyle = hg; c.fillRect(-13, -9, 26, 9); c.fillRect(-5, -44, 10, 36); c.beginPath(); c.arc(0, -47, 9, 0, FX_TAU); c.fill(); c.restore(); }
      c.globalCompositeOperation = 'lighter';
      if (t > 1.0 && t < 1.6) { var ru = (t - 1.0) / 0.6; fxRing(c, sx, sy, 16 + ru * 60, 16 + ru * 60, '253,224,71', (1 - ru) * a, 2); }
      lkStep(Du, dt, 90, 0.2, function (p, f) { fxStar4(c, p.x, p.y, 3.4 * f, f * a, '#FDE68A'); });
      if (shown) { fxStar4(c, sx - 6 + ((t - 1.12) * 14) % 14, sy - 7, 5 * Math.abs(Math.sin(t * 5)), a, '#FFFFFF'); }
      /* a gold rule with a curl at each end, drawn above the answer */
      var fu = fxEase((t - 1.2) / 0.9); if (fu > 0) { c.strokeStyle = 'rgba(253,224,71,' + a.toFixed(3) + ')'; c.lineWidth = 1.4; c.lineCap = 'round'; [-1, 1].forEach(function (d) { var L = (k.w * 0.42) * fu, x0 = k.cx, y0 = k.y - 12; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + d * L, y0); if (fu > 0.8) { c.arc(x0 + d * L, y0 - 5, 5, Math.PI / 2, Math.PI / 2 - d * Math.PI * 1.5 * (fu - 0.8) / 0.2, d > 0); } c.stroke(); }); fxStar4(c, k.cx, k.y - 12, 6 * fu, a, '#FEF3C7'); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; lkIn(c);
      lkFinish(c, k, a * Math.min(1, Math.max(0, t - 1.1) / 0.3), (t - 1.2) / 0.9, '250,204,21');
    };
  };

  /* Critical hit (8-Bit, Epic): speed lines race in, three pixel cuts cross behind the answer, the screen flashes, 9999 jumps
     out in gold, CRITICAL! shakes above, the frame turns to hard pixels and shards of light fly off it */
  FX_DUR.crit = 3.0;
  FX_DRAW.crit = function (s, k) {
    var P = 3, Sh = [], done = 0, Ln = [], i; for (i = 0; i < 18; i++) { Ln.push({ y: fxR(-1, 1), d: fxR(0, 0.3), l: fxR(30, 90), sd: i % 2 }); }
    function sn(v) { return Math.round(v / P) * P; }
    return function (t, dt) {
      var c = s.ctx, a = fxEnv(t, 0, 0.08, 2.4, 3.0), hit = t - 0.5, fr = Math.floor(t * 12), j, n;
      if (hit > 0 && !done) { done = 1; for (j = 0; j < 44; j++) { var sd = Math.floor(fxR(0, 4)), x = sd < 2 ? fxR(k.x, k.x + k.w) : sd === 2 ? k.x : k.x + k.w, y = sd === 0 ? k.y : sd === 1 ? k.y + k.h : fxR(k.y, k.y + k.h); Sh.push({ x: x, y: y, vx: (x - k.cx) * fxR(0.8, 2.2) + fxR(-40, 40), vy: (y - k.cy) * fxR(3, 7) - fxR(20, 120), l: 0, m: fxR(0.5, 1.2), z: Math.random() < 0.3 ? 2 : 1 }); } }
      fxDim(c, s, k, 0.5 * a, '#0A0618');
      lkOut(c, s, k, 3); c.globalAlpha = a;
      /* speed lines racing in from both sides */
      Ln.forEach(function (L) { var u = (t - L.d) / 0.5; if (u <= 0 || u >= 1.6) { return; } var x = L.sd ? s.w + 40 - u * (s.w * 0.6) : -40 + u * (s.w * 0.6) - L.l; c.globalAlpha = a * Math.max(0, 1 - u / 1.6); bcPx(c, sn(x), sn(k.cy + L.y * 150), P, '#E0E7FF', Math.round(L.l / P), 1); }); c.globalAlpha = a;
      /* three cuts */
      for (n = 0; n < 3; n++) { var cu = (t - 0.14 - n * 0.12) / 0.18, fa = Math.max(0, 1 - Math.max(0, t - 0.9 - n * 0.1) / 0.5); if (cu <= 0 || fa <= 0) { continue; } var L2 = Math.min(1, cu) * 34, x0 = k.cx - 150 + n * 70, y0 = k.cy - 80 - n * 10; for (j = 0; j < L2; j++) { c.globalAlpha = a * fa; bcPx(c, sn(x0 + j * 6), sn(y0 + j * 5), P, j % 5 === 0 ? '#67E8F9' : j % 5 === 2 ? '#F0ABFC' : '#FFFFFF', 3, j > L2 - 3 ? 1 : 2); } }
      c.globalAlpha = a;
      if (hit > 0 && hit < 0.18) { c.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - hit / 0.18)).toFixed(3) + ')'; c.fillRect(0, 0, s.w, s.h); }
      /* the frame in hard pixels, the stars at its corners and the shards */
      if (hit > 0) {
        var col = hit < 0.5 && fr % 2 ? '#FFFFFF' : '#F87171'; for (j = 0; j <= k.w / (P * 2); j++) { if ((j + fr) % 4 < 3) { bcPx(c, sn(k.x + j * P * 2), sn(k.y - 9), P, col, 2, 1); bcPx(c, sn(k.x + k.w - j * P * 2), sn(k.y + k.h + 6), P, col, 2, 1); } }
        [[k.x - 6, k.y - 9], [k.x + k.w + 3, k.y - 9], [k.x - 6, k.y + k.h + 6], [k.x + k.w + 3, k.y + k.h + 6]].forEach(function (q, m) { bcSpark(c, sn(q[0]), sn(q[1]), P, (fr + m) % 4, '#FDE047'); });
        lkStep(Sh, dt, 340, 0.5, function (p, f) { c.globalAlpha = a * f; bcPx(c, sn(p.x), sn(p.y), P, f > 0.6 ? '#FFFFFF' : '#FCA5A5', p.z, p.z); }); c.globalAlpha = a;
        var jx = hit < 0.5 ? (fr % 2 ? 3 : -3) : 0, pop = Math.min(1, hit / 0.12), ny = sn(k.y - 78 - Math.sin(Math.min(1, hit / 0.5) * Math.PI) * 22);
        bcText(c, '9999', k.cx + 3, ny + 3, 6 * pop, '#450A0A', a); bcText(c, '9999', k.cx, ny, 6 * pop, fr % 3 ? '#FDE047' : '#FFFFFF', a);
        bcText(c, 'CRITICAL!', k.cx + jx + 2, sn(k.y - 34) + 2, 3, '#450A0A', a); bcText(c, 'CRITICAL!', k.cx + jx, sn(k.y - 34), 3, '#F87171', a);
        if (hit > 0.7) { bcText(c, 'x3 HIT', k.x + k.w - 34, sn(k.y + k.h + 18), 2, '#67E8F9', a * Math.min(1, (hit - 0.7) / 0.15)); }
      }
      c.globalAlpha = 1; lkIn(c);
      lkFinish(c, k, a * Math.min(1, Math.max(0, hit) / 0.15) * 0.8, (hit - 0.1) / 0.7, '248,113,113');
    };
  };

  /* Coronation (Royal Court, Legendary): two banners drop above the answer, heralds' trumpets slide in from both sides and
     sound, and a crown comes down a beam of light to rest on the answer's top edge while gold leaf falls */
  FX_DUR.coronation = 4.8;
  FX_DRAW.coronation = function (s, k) {
    var Lf = [], Nt = [], o = {}, o2 = {}, i; for (i = 0; i < 40; i++) { Lf.push({ x: Math.random(), u: Math.random(), sp: fxR(0.16, 0.34), p: fxR(0, 6), z: fxR(0.7, 1.4) }); }
    function crown(c, x, y, sc) {
      c.save(); c.translate(x, y); c.scale(sc, sc); var g = c.createLinearGradient(-22, 0, 22, 0); g.addColorStop(0, '#92400E'); g.addColorStop(0.35, '#FDE68A'); g.addColorStop(0.6, '#F59E0B'); g.addColorStop(1, '#78350F');
      c.fillStyle = g; c.beginPath(); c.moveTo(-20, 0); c.lineTo(-24, -20); c.lineTo(-13, -9); c.lineTo(-8, -26); c.lineTo(0, -11); c.lineTo(8, -26); c.lineTo(13, -9); c.lineTo(24, -20); c.lineTo(20, 0); c.closePath(); c.fill();
      c.fillStyle = '#B45309'; c.fillRect(-20, -5, 40, 5); c.fillStyle = '#7F1D1D'; c.beginPath(); c.moveTo(-17, -6); c.quadraticCurveTo(0, -15, 17, -6); c.fill();
      [['#EF4444', 0, -2.6, 2.6], ['#60A5FA', -11, -2.6, 2], ['#34D399', 11, -2.6, 2]].forEach(function (q) { c.fillStyle = q[0]; c.beginPath(); c.arc(q[1], q[2], q[3], 0, FX_TAU); c.fill(); });
      c.fillStyle = '#FEF3C7'; [[-24, -20], [-8, -26], [8, -26], [24, -20]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 2.2, 0, FX_TAU); c.fill(); }); c.restore();
    }
    return function (t, dt) {
      var c = s.ctx, a = fxEnv(t, 0, 0.2, 4.0, 4.8), top = k.y - 6, cu = fxEase((t - 1.3) / 1.0), landed = t - 2.3, j;
      fxDim(c, s, k, 0.42 * a, '#1A0A12');
      lkOut(c, s, k, 3);
      /* rays behind where the crown will rest */
      c.globalCompositeOperation = 'lighter';
      if (cu > 0) { for (j = 0; j < 9; j++) { lkBeam(c, k.cx, top - 10, -Math.PI / 2 + (j - 4) * 0.33 + Math.sin(t * 0.6 + j) * 0.04, 150 + 40 * Math.sin(t + j), 0.07, '253,224,71', 0.22 * cu * a); } lkBeam(c, k.cx, -10, Math.PI / 2, top + 10, 0.06, '254,243,199', 0.35 * a * cu); }
      c.globalCompositeOperation = 'source-over';
      /* two banners dropping from above */
      [k.x + 8, k.x + k.w - 52].forEach(function (bx, n) {
        var du = Math.min(1, Math.max(0, (t - n * 0.12) / 0.6)), ov = du < 1 ? du * du : 1 + Math.sin(Math.min(1, (t - n * 0.12 - 0.6) / 0.5) * Math.PI) * 0.04, len = Math.max(0, (top - 40) * ov), sw = Math.sin(t * 2 + n * 2) * 4; if (len <= 4) { return; }
        c.globalAlpha = a; c.fillStyle = n ? '#1E3A8A' : '#7F1D1D'; c.beginPath(); c.moveTo(bx, 0); c.lineTo(bx + 44, 0); c.quadraticCurveTo(bx + 44 + sw * 0.5, len * 0.5, bx + 44 + sw, len); c.lineTo(bx + 22 + sw, len - 14); c.lineTo(bx + sw, len); c.quadraticCurveTo(bx + sw * 0.5, len * 0.5, bx, 0); c.fill(); c.strokeStyle = '#FACC15'; c.lineWidth = 1.6; c.stroke();
        c.strokeStyle = '#FDE68A'; c.lineWidth = 1.4; c.beginPath(); var ex = bx + 22 + sw * 0.6, ey = Math.max(20, len * 0.55); c.moveTo(ex - 9, ey + 5); c.lineTo(ex - 11, ey - 5); c.lineTo(ex - 5, ey); c.lineTo(ex, ey - 8); c.lineTo(ex + 5, ey); c.lineTo(ex + 11, ey - 5); c.lineTo(ex + 9, ey + 5); c.closePath(); c.stroke();
      });
      /* the heralds' trumpets and what they play */
      [-1, 1].forEach(function (d, n) {
        var su = fxEase((t - 0.5 - n * 0.1) / 0.5) * (1 - fxEase((t - 3.6) / 0.6)); if (su <= 0) { return; }
        var blast = Math.max(0, Math.sin((t - 1.1) * 6)) * (t > 1.1 && t < 3.3 ? 1 : 0), hx = (d < 0 ? -90 + su * 96 : s.w + 90 - su * 96), hy = top - 46 + n * 6, ang = d < 0 ? -0.34 : Math.PI + 0.34, L = 84;
        c.save(); c.translate(hx, hy); c.rotate(ang); c.globalAlpha = a; var g = c.createLinearGradient(0, -6, 0, 6); g.addColorStop(0, '#FDE68A'); g.addColorStop(0.5, '#D97706'); g.addColorStop(1, '#78350F'); c.fillStyle = g;
        c.beginPath(); c.moveTo(0, -1.6); c.lineTo(L - 16, -2.6); c.quadraticCurveTo(L - 6, -4, L, -11 - blast * 1.5); c.lineTo(L, 11 + blast * 1.5); c.quadraticCurveTo(L - 6, 4, L - 16, 2.6); c.lineTo(0, 1.6); c.closePath(); c.fill();
        c.fillStyle = n ? '#1E3A8A' : '#7F1D1D'; c.beginPath(); c.moveTo(20, 2.4); c.lineTo(58, 3); c.lineTo(58 + Math.sin(t * 4) * 2, 30); c.lineTo(39, 23); c.lineTo(20 + Math.sin(t * 4 + 1) * 2, 30); c.closePath(); c.fill(); c.strokeStyle = '#FACC15'; c.lineWidth = 1; c.stroke();
        c.restore();
        var mx = hx + Math.cos(ang) * L, my = hy + Math.sin(ang) * L; c.globalCompositeOperation = 'lighter';
        for (j = 0; j < 3; j++) { var ru = ((t - 1.1) * 1.4 + j / 3) % 1; if (t > 1.1 && t < 3.4) { fxRing(c, mx + Math.cos(ang) * ru * 46, my + Math.sin(ang) * ru * 46, 4 + ru * 14, 8 + ru * 30, '253,224,71', (1 - ru) * 0.7 * a, 1.6); } }
        lkEvery(n ? o2 : o, t > 1.1 && t < 3.3 ? 5 : 0, dt, function () { Nt.push({ x: mx, y: my, vx: Math.cos(ang) * fxR(30, 70), vy: fxR(-60, -24), l: 0, m: fxR(0.9, 1.6), h: fxR(30, 55) }); });
        c.globalCompositeOperation = 'source-over';
      });
      lkStep(Nt, dt, 0, 0.5, function (p, f) { c.globalAlpha = Math.sin(f * Math.PI) * a; c.fillStyle = 'rgb(' + gwRgb(p.h, 95, 70) + ')'; c.strokeStyle = c.fillStyle; c.lineWidth = 1.3; c.beginPath(); c.ellipse(p.x, p.y, 3.4, 2.5, -0.4, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(p.x + 3, p.y - 0.8); c.lineTo(p.x + 3, p.y - 12); c.lineTo(p.x + 8, p.y - 10); c.stroke(); });
      /* gold leaf falling */
      Lf.forEach(function (q, n) { var u = (q.u + t * q.sp) % 1, x = q.x * s.w + Math.sin(u * 9 + q.p) * 16, y = -10 + u * (s.h + 20), tw = Math.abs(Math.sin(t * 4 + q.p)); c.globalAlpha = a * Math.min(1, t / 0.8) * 0.9; c.fillStyle = n % 3 ? '#FACC15' : '#FEF3C7'; c.beginPath(); c.ellipse(x, y, 3.4 * q.z, 3.4 * q.z * (0.15 + 0.85 * tw), q.p, 0, FX_TAU); c.fill(); });
      /* the crown comes down and settles */
      if (cu > 0) { var cy = -30 + (top + 30) * cu - (landed > 0 && landed < 0.4 ? Math.sin(landed / 0.4 * Math.PI) * 7 : 0); c.globalAlpha = a; crown(c, k.cx, cy, 1.25); c.globalCompositeOperation = 'lighter'; fxGlow(c, '253,224,71', k.cx, cy - 12, 52, 0.5 * a); fxStar4(c, k.cx - 10 + Math.sin(t * 3) * 3, cy - 32, 9 + 3 * Math.sin(t * 6), a, '#FFFFFF'); if (landed > 0 && landed < 0.7) { fxRing(c, k.cx, top, 20 + landed * 200, 6 + landed * 50, '253,224,71', (1 - landed / 0.7) * a, 2.4); } }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; lkIn(c);
      lkFinish(c, k, a * Math.min(1, Math.max(0, landed) / 0.3), (landed - 0.1) / 0.9, '250,204,21');
    };
  };

  /* Kingmaker (Royal Court, Mythic): storm cloud gathers, a sword of light falls and plants itself in the answer's top edge as
     if in a stone. Cracks of light run round the frame, a ring of runes spins at the hilt, lightning comes down to the pommel
     three times, and then the blade becomes a pillar of light to the sky and feathers of gold drift down */
  FX_DUR.kingmaker = 5.4;
  FX_DRAW.kingmaker = function (s, k) {
    var Cl = [], Bt = [], Fe = [], Mo = [], Ck = [], i, o = {}, lastB = -1, done = 0, RU = 'WHOSO PULLS THIS IS RIGHT · ';
    for (i = 0; i < 12; i++) { Cl.push({ x: fxR(-0.1, 1.1), y: fxR(0, 70), r: fxR(60, 130), p: fxR(0, 6) }); }
    for (i = 0; i < 26; i++) { Ck.push(fxR(-1, 1)); }
    function trace(c, pts) { c.beginPath(); pts.forEach(function (p, m) { if (m) { c.lineTo(p[0], p[1]); } else { c.moveTo(p[0], p[1]); } }); c.stroke(); }
    return function (t, dt) {
      var c = s.ctx, a = fxEnv(t, 0, 0.3, 4.6, 5.4), top = k.y - 3, fall = Math.min(1, Math.max(0, (t - 0.9) / 0.32)), hit = t - 1.22, asc = fxEase((t - 3.4) / 0.7), gone = fxEase((t - 4.0) / 0.5), H = 150, j, n;
      fxDim(c, s, k, 0.78 * a, '#050818');
      lkOut(c, s, k, 3);
      if (hit > 0 && hit < 0.3) { c.translate(Math.sin(t * 90) * 3 * (1 - hit / 0.3), 0); }
      /* the storm overhead */
      Cl.forEach(function (q) { c.globalAlpha = 0.5 * a * Math.min(1, t / 0.8); c.fillStyle = '#111A33'; c.beginPath(); c.ellipse(q.x * s.w + Math.sin(t * 0.4 + q.p) * 14, q.y, q.r, q.r * 0.42, 0, 0, FX_TAU); c.fill(); });
      c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
      var bi = t > 1.7 && t < 3.3 ? Math.floor((t - 1.7) / 0.5) : -1;
      if (bi !== lastB) { lastB = bi; if (bi >= 0) { var x0 = k.cx + fxR(-70, 70), P = [[x0, -8]]; for (j = 1; j < 8; j++) { var u = j / 8; P.push([x0 + (k.cx - x0) * u + fxR(-14, 14), -8 + (top - H) * u]); } P.push([k.cx, top - H - 8]); Bt.push({ pts: P, l: 0, m: 0.3, vx: 0, vy: 0, x: 0, y: 0 }); } }
      lkStep(Bt, dt, 0, 0, function (b, f) { c.lineJoin = 'round'; fxBolt(c, b.pts, f * a, '147,197,253'); fxGlow(c, '191,219,254', k.cx, top - H - 8, 60, f * a); c.fillStyle = 'rgba(191,219,254,' + (0.1 * f * a).toFixed(3) + ')'; c.fillRect(0, 0, s.w, s.h); });
      /* cracks of light along the frame, out from where the sword went in */
      if (hit > 0) {
        var reach = Math.min(1, hit / 0.6) * (k.w / 2 + k.h + 10), fa = a * (1 - gone);
        [-1, 1].forEach(function (d) { var pts = [[k.cx, top]], dist = 0, m = 0; while (dist < reach) { dist += 14; m++; var jx = Ck[(m + (d > 0 ? 13 : 0)) % 26] * 5; if (dist < k.w / 2 + 4) { pts.push([k.cx + d * dist, top - 3 + jx]); } else { pts.push([k.cx + d * (k.w / 2 + 6) + jx, top + (dist - k.w / 2)]); } }
          [[7, 0.2], [2.4, 0.9]].forEach(function (L) { c.lineWidth = L[0]; c.strokeStyle = 'rgba(147,197,253,' + (L[1] * fa).toFixed(3) + ')'; trace(c, pts); }); var e = pts[pts.length - 1]; fxGlow(c, '255,255,255', e[0], e[1], 9, fa); });
        if (hit < 0.8) { fxRing(c, k.cx, top, 20 + hit * 300, 8 + hit * 90, '191,219,254', (1 - hit / 0.8) * a, 3); }
        if (!done) { done = 1; for (j = 0; j < 30; j++) { var an = -Math.PI * Math.random(), v = fxR(60, 240); Mo.push({ x: k.cx, y: top, vx: Math.cos(an) * v, vy: Math.sin(an) * v, l: 0, m: fxR(0.5, 1.1) }); } }
      }
      lkStep(Mo, dt, 260, 0.3, function (p, f) { fxStar4(c, p.x, p.y, 4 * f, f * a, '#DBEAFE'); });
      /* the sword */
      if (fall > 0 && gone < 1) {
        var sy = top - (1 - fall * fall) * (top + H + 60), gl = Math.min(1, hit > 0 ? 0.5 + hit * 0.3 : 0.3) + asc, sa = a * (1 - gone);
        lkBeam(c, k.cx, sy - H - 40, Math.PI / 2, 60, 0.3, '191,219,254', (fall < 1 ? 0.5 : 0) * a);
        fxGlow(c, '147,197,253', k.cx, sy - H * 0.5, 70 + 50 * asc, 0.4 * gl * sa);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = sa;
        var bg = c.createLinearGradient(k.cx - 7, 0, k.cx + 7, 0); bg.addColorStop(0, '#94A3B8'); bg.addColorStop(0.45, '#FFFFFF'); bg.addColorStop(0.55, '#E2E8F0'); bg.addColorStop(1, '#64748B'); c.fillStyle = bg;
        c.beginPath(); c.moveTo(k.cx - 6.5, sy - 104); c.lineTo(k.cx - 5.5, sy - 8); c.lineTo(k.cx, sy); c.lineTo(k.cx + 5.5, sy - 8); c.lineTo(k.cx + 6.5, sy - 104); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(100,116,139,.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(k.cx, sy - 104); c.lineTo(k.cx, sy - 12); c.stroke();
        var hg = c.createLinearGradient(k.cx - 26, 0, k.cx + 26, 0); hg.addColorStop(0, '#78350F'); hg.addColorStop(0.5, '#FDE68A'); hg.addColorStop(1, '#78350F'); c.fillStyle = hg;
        c.beginPath(); c.moveTo(k.cx - 27, sy - 101); c.quadraticCurveTo(k.cx, sy - 111, k.cx + 27, sy - 101); c.lineTo(k.cx + 25, sy - 108); c.quadraticCurveTo(k.cx, sy - 116, k.cx - 25, sy - 108); c.closePath(); c.fill();
        c.fillStyle = '#3B2A14'; c.fillRect(k.cx - 3.4, sy - 140, 6.8, 30); c.fillStyle = hg; c.beginPath(); c.arc(k.cx, sy - H + 6, 7, 0, FX_TAU); c.fill(); c.fillStyle = '#60A5FA'; c.beginPath(); c.arc(k.cx, sy - H + 6, 3, 0, FX_TAU); c.fill();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1;
        if (asc > 0) { c.fillStyle = 'rgba(255,255,255,' + (asc * sa).toFixed(3) + ')'; c.fillRect(k.cx - 7, sy - H, 14, H - 4); }
        var su = ((t * 0.9) % 1); fxStar4(c, k.cx + 2, sy - 12 - su * 90, 7 * Math.sin(su * Math.PI), sa, '#FFFFFF');
        /* the ring of runes at the hilt */
        if (hit > 0.2) { var ra = Math.min(1, (hit - 0.2) / 0.5) * sa; fxRing(c, k.cx, sy - 104, 46, 11, '147,197,253', 0.6 * ra, 1.2); c.font = '700 8px ' + FX_MONO; c.textAlign = 'center'; c.textBaseline = 'middle'; for (n = 0; n < RU.length; n++) { var la = t * 1.2 + n / RU.length * FX_TAU; c.fillStyle = 'rgba(219,234,254,' + ((0.25 + 0.7 * (Math.sin(la) + 1) / 2) * ra).toFixed(3) + ')'; c.fillText(RU.charAt(n), k.cx + Math.cos(la) * 58, sy - 104 + Math.sin(la) * 14); } }
      }
      /* the pillar of light, the word, and the feathers */
      if (asc > 0) { var pw = (10 + 60 * Math.sin(Math.min(1, (t - 3.4) / 1.2) * Math.PI)), pa = a * (t < 4.2 ? asc : Math.max(0, 1 - (t - 4.2) / 0.8)); var g = c.createLinearGradient(k.cx - pw, 0, k.cx + pw, 0); g.addColorStop(0, 'rgba(147,197,253,0)'); g.addColorStop(0.5, 'rgba(255,255,255,' + (0.85 * pa).toFixed(3) + ')'); g.addColorStop(1, 'rgba(147,197,253,0)'); c.fillStyle = g; c.fillRect(k.cx - pw, 0, pw * 2, top); fxGlow(c, '219,234,254', k.cx, top, 120, 0.5 * pa); }
      lkEvery(o, t > 3.6 && t < 4.6 ? 16 : 0, dt, function () { Fe.push({ x: k.cx + fxR(-s.w * 0.4, s.w * 0.4), y: fxR(-10, top * 0.5), vx: fxR(-10, 10), vy: fxR(14, 40), l: 0, m: fxR(1.2, 2), p: fxR(0, 6) }); });
      c.globalCompositeOperation = 'source-over';
      lkStep(Fe, dt, 0, 0, function (p, f) { c.save(); c.translate(p.x + Math.sin(p.l * 3 + p.p) * 12, p.y); c.rotate(Math.sin(p.l * 3 + p.p) * 0.6); c.globalAlpha = Math.min(1, f * 2) * a; c.fillStyle = '#FDE68A'; c.beginPath(); c.moveTo(0, -7); c.quadraticCurveTo(4.5, 0, 0, 7); c.quadraticCurveTo(-4.5, 0, 0, -7); c.fill(); c.strokeStyle = '#B45309'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, -7); c.lineTo(0, 8); c.stroke(); c.restore(); });
      if (hit > 1.0 && t < 4.4) { zType(c, 'worthy.', k.cx, Math.max(14, top - H - 34), (hit - 1.0) / 0.5, '600 13px ' + FX_MONO, 'rgba(219,234,254,' + (a * (1 - gone)).toFixed(3) + ')', '#60A5FA'); }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; lkIn(c);
      lkFinish(c, k, a * Math.min(1, Math.max(0, hit) / 0.3), (t - 3.5) / 1.0, '191,219,254');
    };
  };

  /* In full bloom (Radiant): the page turns to a garden at night. Two vines climb round the answer from below and meet at the
     top, putting out leaves as they go; buds swell along them and open one after another into flowers; petals burst, butterflies
     lift off and fireflies gather, and then a warm dawn rises from under the answer and gilds its frame */
  FX_DUR.bloom = 5.8;
  FX_DRAW.bloom = function (s, k) {
    var Pt = [], Bf = [], Ff = [], i, lastO = -1, NB = 12, FC = [['#F9A8D4', '#DB2777'], ['#FDBA74', '#EA580C'], ['#FFFFFF', '#F0ABFC'], ['#C4B5FD', '#7C3AED'], ['#FDE68A', '#D97706'], ['#FDA4AF', '#E11D48']];
    for (i = 0; i < 26; i++) { Ff.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6), z: fxR(0.6, 1.4) }); }
    /* one vine: from the middle of the bottom edge, round one side, to the middle of the top */
    function vine(d) { var e = 9, pts = [], n, hw = k.w / 2 + e; for (n = 0; n <= 10; n++) { pts.push([k.cx + d * hw * n / 10, k.y + k.h + e + Math.sin(n * 1.7) * 2.6]); } for (n = 1; n <= 5; n++) { pts.push([k.cx + d * (hw + Math.sin(n * 2.1) * 2.6), k.y + k.h + e - (k.h + e * 2) * n / 5]); } for (n = 1; n <= 10; n++) { pts.push([k.cx + d * hw * (1 - n / 10), k.y - e + Math.sin(n * 1.9) * 2.6]); } return zPath(pts); }
    function flower(c, x, y, r, open, col, rot) {
      if (open <= 0) { c.fillStyle = '#16A34A'; c.beginPath(); c.arc(x, y, 2.6, 0, FX_TAU); c.fill(); return; }
      var ov = open < 1 ? open * (2 - open) * 1.08 : 1; c.save(); c.translate(x, y); c.rotate(rot + (1 - open) * 1.4); c.scale(ov, ov);
      for (var q = 0; q < 6; q++) { c.rotate(FX_TAU / 6); var g = c.createLinearGradient(0, 0, 0, -r); g.addColorStop(0, col[1]); g.addColorStop(1, col[0]); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-r * 0.55, -r * 0.4, -r * 0.4, -r, 0, -r); c.bezierCurveTo(r * 0.4, -r, r * 0.55, -r * 0.4, 0, 0); c.fill(); }
      c.fillStyle = '#FDE047'; c.beginPath(); c.arc(0, 0, r * 0.24, 0, FX_TAU); c.fill(); c.fillStyle = '#B45309'; for (q = 0; q < 5; q++) { c.beginPath(); c.arc(Math.cos(q * 1.26) * r * 0.12, Math.sin(q * 1.26) * r * 0.12, 0.7, 0, FX_TAU); c.fill(); } c.restore();
    }
    return function (t, dt) {
      var c = s.ctx, a = fxEnv(t, 0, 0.3, 5.0, 5.8), grow = fxEase((t - 0.3) / 1.9), dawn = fxEase((t - 3.3) / 1.2), j, opened = Math.floor((t - 2.1) / 0.11);
      fxDim(c, s, k, 0.72 * a, '#03120C');
      lkOut(c, s, k, 3);
      /* dawn rising from under the answer */
      c.globalCompositeOperation = 'lighter';
      if (dawn > 0) { fxGlow(c, '253,186,116', k.cx, k.y + k.h + 40, 260 * dawn, 0.4 * dawn * a); for (j = 0; j < 9; j++) { lkBeam(c, k.cx, k.y + k.h + 30, -Math.PI / 2 + (j - 4) * 0.36 + Math.sin(t * 0.5 + j) * 0.05, 420, 0.06, '253,224,71', 0.14 * dawn * a); } }
      Ff.forEach(function (f, n) { var fa = Math.min(1, t / 1.2) * a * (0.3 + 0.7 * Math.abs(Math.sin(t * 1.6 + f.p))), gx = f.x * s.w + Math.sin(t * 0.7 + f.p) * 20, gy = f.y * s.h + Math.cos(t * 0.5 + f.p) * 16, pull = dawn * 0.5; fxGlow(c, '217,249,157', gx + (k.cx - gx) * pull, gy + (k.cy - gy) * pull, 5 * f.z, fa * 0.8); });
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.lineCap = 'round'; c.lineJoin = 'round';
      [-1, 1].forEach(function (d, vi) {
        var p = vine(d), dist = p.len * grow, n;
        zStrokeTo(c, p, dist, '#14532D', 4.6); zStrokeTo(c, p, dist, '#22C55E', 2.2);
        /* leaves in pairs along the vine, each opening as the tip passes */
        for (n = 1; n * 15 < dist; n++) { var q = zAlong(p, n * 15), q2 = zAlong(p, n * 15 + 3), an = Math.atan2(q2[1] - q[1], q2[0] - q[0]) + (n % 2 ? 1 : -1) * 1.2 * d, lo = Math.min(1, (dist - n * 15) / 40), L = 9.5 * lo * (1 + 0.08 * Math.sin(t * 3 + n)); c.save(); c.translate(q[0], q[1]); c.rotate(an); c.fillStyle = n % 3 ? '#16A34A' : '#4ADE80'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -L * 0.45, L, 0); c.quadraticCurveTo(L * 0.5, L * 0.45, 0, 0); c.fill(); c.strokeStyle = 'rgba(20,83,45,.7)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(L, 0); c.stroke(); c.restore(); }
        /* six buds a vine, opening in turn */
        for (n = 0; n < NB / 2; n++) { var bd = p.len * (0.1 + n * 0.16); if (bd > dist) { continue; } var b = zAlong(p, bd), idx = n * 2 + vi, op = Math.max(0, Math.min(1, (t - 2.1 - idx * 0.11) / 0.45)), out = b[1] < k.y ? -1 : b[1] > k.y + k.h ? 1 : 0, fx0 = b[0] + (out ? 0 : d * 9), fy0 = b[1] + out * 9; flower(c, fx0, fy0, 12.5 + (idx % 3) * 2.5, op, FC[idx % 6], idx * 0.9 + Math.sin(t * 1.4 + idx) * 0.08);
          if (idx === opened && idx !== lastO && op > 0) { lastO = idx; for (var m = 0; m < 9; m++) { var pa = fxR(0, FX_TAU), pv = fxR(30, 90); Pt.push({ x: fx0, y: fy0, vx: Math.cos(pa) * pv, vy: Math.sin(pa) * pv - 20, l: 0, m: fxR(0.8, 1.5), col: FC[idx % 6][0], p: fxR(0, 6) }); } if (idx % 2 === 0) { Bf.push({ x: fx0, y: fy0, vx: fxR(-26, 26), vy: fxR(-46, -24), l: 0, m: fxR(2.4, 3.4), col: FC[(idx + 2) % 6], p: fxR(0, 6) }); } }
        }
      });
      lkStep(Pt, dt, 70, 0.25, function (p, f) { c.save(); c.translate(p.x, p.y); c.rotate(p.p + p.l * 4); c.globalAlpha = f * a; c.fillStyle = p.col; c.beginPath(); c.ellipse(0, 0, 4.4, 2.2 * (0.3 + 0.7 * Math.abs(Math.sin(p.l * 6 + p.p))), 0, 0, FX_TAU); c.fill(); c.restore(); });
      lkStep(Bf, dt, -8, 0.7, function (p, f) { var fl = Math.abs(Math.sin(p.l * 13 + p.p)), x = p.x + Math.sin(p.l * 2.4 + p.p) * 22; c.globalAlpha = Math.min(1, f * 3) * a; [-1, 1].forEach(function (d) { var g = c.createLinearGradient(x, p.y, x + d * 11, p.y - 6); g.addColorStop(0, p.col[1]); g.addColorStop(1, p.col[0]); c.fillStyle = g; c.beginPath(); c.moveTo(x, p.y); c.bezierCurveTo(x + d * 4 * fl, p.y - 13, x + d * 14 * fl, p.y - 11, x + d * 12 * fl, p.y - 1); c.bezierCurveTo(x + d * 11 * fl, p.y + 7, x + d * 3 * fl, p.y + 7, x, p.y + 2); c.fill(); }); c.fillStyle = '#1C1917'; c.fillRect(x - 0.8, p.y - 5, 1.6, 10); });
      c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
      for (j = 0; j < 10; j++) { var su = ((t * 0.5 + j * 0.37) % 1); if (dawn > 0) { fxStar4(c, k.x + ((j * 97) % 100) / 100 * k.w, k.y - 14 - su * 80, 5 * Math.sin(su * Math.PI), dawn * a, '#FEF3C7'); } }
      c.globalCompositeOperation = 'source-over'; lkIn(c);
      lkFinish(c, k, a * dawn, (t - 3.6) / 1.1, '253,186,116');
    };
  };

  /* ---------- moving papers: drawn behind the whole page, on light pages and dark ones ---------- */
  /* Heraldry (Royal Court, Common): a field of small shields and diamonds. A sheen crosses it on the slant, and every so often
     a ripple runs out from the middle and each shield turns over to show its other color. Strings of pennants sway along the
     top and gold motes drift */
  FX_PAPER.heraldry = function (s) {
    var D = bcDark(s), Mo = [], i, CA = D ? '250,204,21' : '30,58,138', CB = D ? '167,139,250' : '159,18,57';
    for (i = 0; i < 24; i++) { Mo.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6), z: fxR(0.6, 1.4) }); }
    function shield(c, x, y, r, sx, rgb, al) { c.fillStyle = 'rgba(' + rgb + ',' + al.toFixed(3) + ')'; c.beginPath(); c.moveTo(x - r * sx, y - r); c.lineTo(x + r * sx, y - r); c.lineTo(x + r * sx, y); c.quadraticCurveTo(x + r * sx, y + r * 0.8, x, y + r * 1.25); c.quadraticCurveTo(x - r * sx, y + r * 0.8, x - r * sx, y); c.closePath(); c.fill(); }
    return function (t) {
      var c = s.ctx, W = s.w, H = s.h, S = 58, cyc = t % 13, rip = (cyc - 8) / 2.6, x, y, n = 0, k;
      c.globalCompositeOperation = 'source-over';
      for (y = -S; y < H + S; y += S / 2) {
        for (x = (n % 2 ? S / 2 : 0) - S; x < W + S; x += S) {
          var sh = Math.max(0, 1 - Math.abs(((x + y) * 0.7 - t * 90) % 900 + (((x + y) * 0.7 - t * 90) % 900 < 0 ? 900 : 0) - 450) / 130), d = Math.hypot(x - W / 2, y - H / 2) / Math.hypot(W / 2, H / 2), fu = rip > 0 && rip < 1 ? Math.max(0, Math.min(1, (rip * 1.4 - d) / 0.25)) : rip >= 1 ? 1 : 0, fl = Math.cos(fu * Math.PI), al = (D ? 0.09 : 0.07) + sh * (D ? 0.2 : 0.14) + (fu > 0 && fu < 1 ? 0.14 : 0), alt = ((Math.floor(cyc < 8 ? t / 13 : t / 13 + 1) + n) % 2 === 0) !== (fl < 0 && fu < 1);
          if (n % 2) { shield(c, x, y, 9, Math.max(0.08, Math.abs(fl)), alt ? CA : CB, al); c.fillStyle = 'rgba(' + (alt ? CB : CA) + ',' + (al * 1.2).toFixed(3) + ')'; c.fillRect(x - 1.2 * Math.abs(fl), y - 7, 2.4 * Math.abs(fl), 15); c.fillRect(x - 6 * Math.abs(fl), y - 3, 12 * Math.abs(fl), 2.4); }
          else { c.fillStyle = 'rgba(' + CB + ',' + (al * 0.8).toFixed(3) + ')'; c.beginPath(); c.moveTo(x, y - 5); c.lineTo(x + 3.4, y); c.lineTo(x, y + 5); c.lineTo(x - 3.4, y); c.closePath(); c.fill(); }
        }
        n++;
      }
      /* two strings of pennants along the top */
      for (k = 0; k < 2; k++) {
        var y0 = 6 + k * 26, sag = 34 + k * 10, N = Math.max(8, Math.round(W / 34)), pu, px, py;
        c.strokeStyle = 'rgba(' + (D ? '203,213,225' : '71,85,105') + ',.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-10, y0); c.quadraticCurveTo(W / 2, y0 + sag * 2, W + 10, y0); c.stroke();
        for (i = 0; i < N; i++) { pu = (i + 0.5 + k * 0.5) / N; px = pu * W; py = y0 + sag * 4 * pu * (1 - pu) * 0.5 * 2 * 0.5 * 2; var sw = Math.sin(t * 2 + i * 0.9 + k) * 3.4; c.fillStyle = 'rgba(' + [CA, CB, D ? '56,189,248' : '21,128,61'][(i + k) % 3] + ',' + (D ? 0.5 : 0.4) + ')'; c.beginPath(); c.moveTo(px - 8, py); c.lineTo(px + 8, py); c.lineTo(px + sw, py + 19 - k * 3); c.closePath(); c.fill(); }
      }
      c.globalCompositeOperation = D ? 'lighter' : 'source-over';
      Mo.forEach(function (m) { var mx = ((m.x * W + t * 6 * m.z) % (W + 20)) - 10, my = ((m.y * H - t * 9 * m.z) % (H + 20) + H + 20) % (H + 20) - 10; fxGlow(c, D ? '253,224,71' : '217,119,6', mx + Math.sin(t + m.p) * 8, my, 2.6 * m.z, (D ? 0.5 : 0.4) * (0.5 + 0.5 * Math.sin(t * 1.8 + m.p))); });
      c.globalCompositeOperation = 'source-over';
    };
  };

  /* Side-scroller (8-Bit, Rare): a pixel level scrolls along the foot of the page: far mountains, hills, a path of blocks with
     gaps, coins in arcs and flags. A little runner jumps the gaps and takes the coins; clouds and a pixel sun ride above */
  FX_PAPER.scroller = function (s) {
    var D = bcDark(s), P = 4, RUN = [['..hhh..', '..fff..', '.bbbbb.', 'f.bbb.f', '..bbb..', '..l.l..', '.l...l.', 'll...ll'], ['..hhh..', '..fff..', '.bbbbb.', '.fbbbf.', '..bbb..', '..ll...', '..ll...', '..lll..']], RP = { h: '#EF4444', f: '#FDBA74', b: '#3B82F6', l: '#1E3A8A' }, got = {}, Pp = [];
    function sn(v) { return Math.round(v / P) * P; }
    /* the level repeats every 40 blocks; a gap wherever gap() is true */
    function gap(n) { n = ((n % 40) + 40) % 40; return n === 9 || n === 10 || n === 22 || n === 31 || n === 32; }
    function hgt(n) { n = ((n % 40) + 40) % 40; return n > 13 && n < 19 ? 2 : n > 25 && n < 29 ? 3 : 1; }
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, B = P * 6, base = H - 8, al = D ? 0.62 : 0.5, scr = t * 46, x, n, k, fr = Math.floor(t * 9);
      c.globalCompositeOperation = 'source-over';
      /* the sun and the clouds */
      c.globalAlpha = al * 0.7; bcPx(c, sn(W * 0.78), sn(H * 0.1), P, D ? '#FDE68A' : '#FBBF24', 6, 6); bcPx(c, sn(W * 0.78) - P, sn(H * 0.1) + P, P, D ? '#FDE68A' : '#FBBF24', 8, 4); bcPx(c, sn(W * 0.78) + P, sn(H * 0.1) - P, P, D ? '#FDE68A' : '#FBBF24', 4, 8);
      for (k = 0; k < 5; k++) { var cx = sn(((k * 173 - t * (5 + k * 2)) % (W + 120) + W + 120) % (W + 120) - 60), cy = sn(H * (0.06 + 0.11 * ((k * 37) % 5))); c.globalAlpha = al * (D ? 0.3 : 0.5); bcPx(c, cx, cy, P, D ? '#94A3B8' : '#CBD5E1', 10, 2); bcPx(c, cx + P * 2, cy - P, P, D ? '#94A3B8' : '#CBD5E1', 6, 1); bcPx(c, cx + P, cy + P * 2, P, D ? '#64748B' : '#E2E8F0', 8, 1); }
      /* far mountains and nearer hills, in steps */
      for (x = 0; x < W + 16; x += 8) { var m1 = Math.round((46 + 30 * Math.sin((x + scr * 0.2) * 0.011) + 18 * Math.sin((x + scr * 0.2) * 0.031 + 1)) / P) * P; c.globalAlpha = al * 0.45; c.fillStyle = D ? '#312E81' : '#A5B4FC'; c.fillRect(x, base - 60 - m1, 8, m1 + 60); if (m1 > 70) { c.fillStyle = D ? '#C7D2FE' : '#FFFFFF'; c.fillRect(x, base - 60 - m1, 8, P * 2); } }
      for (x = 0; x < W + 16; x += 8) { var m2 = Math.round((30 + 16 * Math.sin((x + scr * 0.5) * 0.019 + 2) + 8 * Math.sin((x + scr * 0.5) * 0.047)) / P) * P; c.globalAlpha = al * 0.6; c.fillStyle = D ? '#14532D' : '#86EFAC'; c.fillRect(x, base - 30 - m2, 8, m2 + 30); }
      /* the path: blocks with grass on top, gaps, coins and flags */
      var n0 = Math.floor(scr / B), ox = -(scr % B), rx = sn(W * 0.24), rn = Math.floor((scr + rx + 10) / B), air = 0, gy = 0;
      for (k = -1; k < W / B + 2; k++) {
        n = n0 + k; x = sn(ox + k * B); if (gap(n)) { continue; } var hh = hgt(n) * B * 0.5;
        c.globalAlpha = al; c.fillStyle = D ? '#92400E' : '#D97706'; c.fillRect(x, base - hh, B, hh + 8); c.fillStyle = D ? '#16A34A' : '#22C55E'; c.fillRect(x, base - hh, B, P); c.fillStyle = D ? '#78350F' : '#B45309'; c.fillRect(x + P, base - hh + P * 2, P, P); c.fillRect(x + P * 4, base - hh + P * 3, P, P);
        var nn = ((n % 40) + 40) % 40;
        if (nn % 5 === 2 && !got[n]) { c.fillStyle = (fr + n) % 6 === 0 ? '#FFFFFF' : '#FACC15'; c.fillRect(x + P * 2, base - hh - P * 9 - (nn % 10 === 2 ? P * 4 : 0), P * 2, P * 3); if (n === rn) { got[n] = 1; Pp.push({ x: x + P * 3, y: base - hh - P * 9, vx: 0, vy: -30, l: 0, m: 0.6 }); } }
        if (nn === 20) { c.fillStyle = D ? '#E2E8F0' : '#475569'; c.fillRect(x + P * 3, base - hh - P * 12, P, P * 12); c.fillStyle = '#F43F5E'; c.fillRect(x + P * 4, base - hh - P * 12 + (fr % 2 ? P : 0), P * 4, P * 3); }
      }
      /* the runner: runs on the block under it, and jumps when a gap or a step is two blocks ahead */
      for (k = 0; k < 4; k++) { if (gap(rn + k) || hgt(rn + k) > hgt(rn)) { air = Math.max(air, 1 - k / 4); } if (gap(rn - k)) { air = Math.max(air, 1 - k / 3); } }
      gy = base - (gap(rn) ? hgt(rn + 2) : hgt(rn)) * B * 0.5 - P * 8 - Math.sin(Math.min(1, air) * Math.PI * 0.5) * P * 9;
      c.globalAlpha = Math.min(1, al * 1.4); bcSpr(c, air > 0.05 ? RUN[0] : RUN[fr % 2], RP, rx, sn(gy), P);
      lkStep(Pp, dt, 0, 0, function (p, f) { c.globalAlpha = f * al; bcText(c, '+1', p.x, sn(p.y), 2, '#FACC15', f); bcSpark(c, sn(p.x), sn(p.y + 14), P, f > 0.5 ? 1 : 2, '#FDE68A'); });
      if (fr % 90 === 0) { got = {}; }
      c.globalAlpha = 1;
    };
  };

  /* Dogfight (8-Bit, Epic): a pixel starfield falls down the page in three layers past a ringed planet. A fighter weaves at
     the bottom and fires; a wing of raiders sways down from the top, and each one hit bursts into pixels and is replaced. Now
     and then a saucer crosses, and the score counts up in the corner */
  FX_PAPER.dogfight = function (s) {
    var D = bcDark(s), P = 3, St = [], En = [], Bu = [], Ex = [], i, o = {}, score = 0;
    var SH = ['....w....', '....w....', '...wcw...', '...wcw...', '..wwwww..', '.rwwwwwr.', 'rrw.w.wrr', 'r.......r'], SP = { w: D ? '#E2E8F0' : '#475569', c: '#22D3EE', r: '#F43F5E' }, EN = ['m.......m', 'mm.....mm', 'mmmmmmmmm', '.mmymymm.', '..mmmmm..', '...mmm...', '....m....'], EP = { m: D ? '#E879F9' : '#A21CAF', y: '#FDE047' }, SA = ['...ssss...', '..sccccs..', 'ssssssssss', '.s.y.y.ys.'], SAP = { s: D ? '#A5B4FC' : '#6366F1', c: '#67E8F9', y: '#FDE047' };
    for (i = 0; i < 70; i++) { St.push({ x: Math.random(), y: Math.random(), z: 1 + (i % 3) }); }
    for (i = 0; i < 6; i++) { En.push({ sl: i, y: -40 - i * 50, ph: i * 1.1 }); }
    function sn(v) { return Math.round(v / P) * P; }
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, al = D ? 0.6 : 0.42, fr = Math.floor(t * 10), hx = W / 2 + Math.sin(t * 0.7) * W * 0.32 + Math.sin(t * 1.9) * 18, hy = H - 70;
      c.globalCompositeOperation = 'source-over';
      St.forEach(function (q) { c.globalAlpha = al * (0.3 + 0.25 * q.z); bcPx(c, sn(q.x * W), sn((q.y * H + t * 14 * q.z * q.z) % H), P, D ? '#E0E7FF' : '#64748B', 1, q.z === 3 ? 2 : 1); });
      /* a ringed planet drifting down */
      var py = sn(((t * 9) % (H + 260)) - 130), pxx = sn(W * 0.74), j, k; c.globalAlpha = al * 0.55;
      for (j = -6; j <= 6; j++) { var hw = Math.round(Math.sqrt(49 - j * j)); bcPx(c, pxx - hw * P, py + j * P, P, j % 3 === 0 ? (D ? '#7C3AED' : '#C4B5FD') : (D ? '#4C1D95' : '#DDD6FE'), hw * 2, 1); }
      bcPx(c, pxx - 12 * P, py, P, D ? '#FDE68A' : '#D97706', 5, 1); bcPx(c, pxx + 7 * P, py, P, D ? '#FDE68A' : '#D97706', 5, 1); bcPx(c, pxx - 10 * P, py + P, P, D ? '#FDE68A' : '#D97706', 20, 1);
      /* the raiders, the shots and the bursts */
      lkEvery(o, 3.2, dt, function () { Bu.push({ x: hx, y: hy - 6, vx: 0, vy: -330, l: 0, m: 3 }); });
      En.forEach(function (e) {
        e.y += dt * 22; if (e.y > H * 0.62) { e.y = -40; }
        e.x = W * (0.14 + 0.72 * ((e.sl + 0.5) / 6)) + Math.sin(t * 1.3 + e.ph) * 22;
        Bu.forEach(function (b) { if (!b.dead && Math.abs(b.x - e.x) < 16 && Math.abs(b.y - e.y) < 12 && e.y > 0) { b.dead = 1; b.l = b.m; score += 150; for (k = 0; k < 9; k++) { var an = k / 9 * FX_TAU; Ex.push({ x: e.x, y: e.y, vx: Math.cos(an) * fxR(30, 90), vy: Math.sin(an) * fxR(30, 90), l: 0, m: fxR(0.35, 0.7) }); } e.y = -40 - fxR(0, 80); } });
        c.globalAlpha = al; bcSpr(c, EN, EP, sn(e.x - 13), sn(e.y - 10), P);
      });
      lkStep(Bu, dt, 0, 0, function (b) { if (b.y < -10) { b.l = b.m; return; } c.globalAlpha = al; bcPx(c, sn(b.x), sn(b.y), P, '#67E8F9', 1, 3); });
      lkStep(Ex, dt, 0, 0.3, function (p, f) { c.globalAlpha = al * f; bcSpark(c, sn(p.x), sn(p.y), P, f > 0.6 ? 2 : f > 0.3 ? 1 : 0, f > 0.5 ? '#FDE047' : '#FB923C'); });
      c.globalAlpha = Math.min(1, al * 1.2); bcSpr(c, SH, SP, sn(hx - 13), sn(hy), P); bcPx(c, sn(hx - 7), sn(hy + 24), P, fr % 2 ? '#FDE047' : '#FB923C', 1, 1 + fr % 2); bcPx(c, sn(hx + 5), sn(hy + 24), P, fr % 2 ? '#FB923C' : '#FDE047', 1, 1 + (fr + 1) % 2);
      /* the saucer, every half minute, and the score */
      var su = (t % 26) / 5; if (su < 1) { c.globalAlpha = al; bcSpr(c, SA, SAP, sn(-40 + su * (W + 80)), sn(H * 0.3 + Math.sin(su * 9) * 14), P); }
      c.globalAlpha = 1; bcText(c, 'SCORE ' + ('00000' + score).slice(-6), W - 60, 10, 2, D ? '#A5B4FC' : '#6366F1', al * 0.9);
    };
  };

  /* Castle on the hill (Royal Court, Legendary): a castle stands on a crag at the foot of the page, windows lit and flags
     flying, under a big moon (a sun on a light page) with clouds crossing it. Birds circle the tallest tower, a rider with a
     torch crosses the bridge, mist lies in the valley, and every so often fireworks go up over the keep */
  FX_PAPER.castle = function (s) {
    var D = bcDark(s), St = [], Fw = [], Wn = [], i, lastF = -1;
    for (i = 0; i < 50; i++) { St.push({ x: Math.random(), y: Math.random() * 0.6, p: fxR(0, 6), z: fxR(0.5, 1.3) }); }
    for (i = 0; i < 16; i++) { Wn.push({ x: fxR(-0.5, 0.5), y: fxR(0.2, 0.85), p: fxR(0, 6) }); }
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, gy = H - 8, u = Math.min(1.25, W / 390), cx = W * 0.6, k, j, far = D ? '#1B1A3D' : '#C7D2FE', mid = D ? '#15143A' : '#A5B4FC', near = D ? '#232252' : '#818CF8', al = D ? 0.95 : 0.42;
      /* sky: stars at night, the moon or sun, and clouds */
      c.globalCompositeOperation = D ? 'lighter' : 'source-over';
      if (D) { St.forEach(function (q) { fxGlow(c, '226,232,255', q.x * W, q.y * H, 1.8 * q.z, 0.2 + 0.25 * Math.sin(t * 1.5 + q.p)); }); }
      fxGlow(c, D ? '254,243,199' : '253,186,116', W * 0.2, H * 0.16, 110 * u, D ? 0.22 : 0.3); c.globalCompositeOperation = 'source-over'; c.globalAlpha = D ? 0.8 : 0.5; c.fillStyle = D ? '#FEF3C7' : '#FDBA74'; c.beginPath(); c.arc(W * 0.2, H * 0.16, 30 * u, 0, FX_TAU); c.fill();
      for (k = 0; k < 4; k++) { var clx = ((k * 211 + t * (4 + k * 1.5)) % (W + 300)) - 150; c.globalAlpha = D ? 0.4 : 0.5; c.fillStyle = D ? '#1E1B4B' : '#E0E7FF'; c.beginPath(); c.ellipse(clx, H * (0.12 + k * 0.07), 80 * u, 10 * u, 0, 0, FX_TAU); c.ellipse(clx + 40 * u, H * (0.12 + k * 0.07) + 7, 60 * u, 8 * u, 0, 0, FX_TAU); c.fill(); }
      /* far ridges and the valley mist */
      c.globalAlpha = al * 0.7; c.fillStyle = far; c.beginPath(); c.moveTo(0, gy + 8); for (k = 0; k <= 20; k++) { c.lineTo(k / 20 * W, gy - 110 * u - 40 * u * Math.sin(k * 0.9) * Math.sin(k * 0.37 + 1)); } c.lineTo(W, gy + 8); c.fill();
      c.globalAlpha = al * 0.85; c.fillStyle = mid; c.beginPath(); c.moveTo(0, gy + 8); for (k = 0; k <= 20; k++) { c.lineTo(k / 20 * W, gy - 70 * u - 26 * u * Math.sin(k * 0.7 + 2) - 12 * u * Math.sin(k * 1.9)); } c.lineTo(W, gy + 8); c.fill();
      for (k = 0; k < 3; k++) { var mx = ((t * (6 + k * 3) + k * 190) % (W + 400)) - 200; c.globalAlpha = D ? 0.16 : 0.5; c.fillStyle = D ? '#C7D2FE' : '#FFFFFF'; c.beginPath(); c.ellipse(mx, gy - 62 * u + k * 12, 150 * u, 9 * u, 0, 0, FX_TAU); c.fill(); }
      /* the crag, the bridge and the castle */
      c.globalAlpha = al; c.fillStyle = near;
      c.beginPath(); c.moveTo(cx - 150 * u, gy + 8); c.lineTo(cx - 96 * u, gy - 60 * u); c.lineTo(cx - 70 * u, gy - 76 * u); c.lineTo(cx + 78 * u, gy - 76 * u); c.lineTo(cx + 104 * u, gy - 52 * u); c.lineTo(cx + 150 * u, gy + 8); c.fill();
      c.beginPath(); c.rect(0, gy - 40 * u, cx - 110 * u, 6 * u); for (k = 0; k < 5; k++) { var ax = (cx - 110 * u) * (k + 0.5) / 5; c.moveTo(ax - 10 * u, gy + 8); c.lineTo(ax - 10 * u, gy - 34 * u); c.lineTo(ax + 10 * u, gy - 34 * u); c.lineTo(ax + 10 * u, gy + 8); } c.fill();
      function tower(x, w, h, cap) { c.rect(cx + x * u, gy - 76 * u - h * u, w * u, h * u); for (var q = 0; q < Math.floor(w / 6); q++) { if (q % 2 === 0) { c.rect(cx + (x + q * 6) * u, gy - (76 + h + 5) * u, 6 * u, 5 * u); } } if (cap) { c.moveTo(cx + (x - 3) * u, gy - (76 + h) * u); c.lineTo(cx + (x + w / 2) * u, gy - (76 + h + cap) * u); c.lineTo(cx + (x + w + 3) * u, gy - (76 + h) * u); } }
      c.beginPath(); tower(-62, 124, 34, 0); tower(-70, 22, 66, 20); tower(48, 22, 58, 18); tower(-18, 36, 84, 0); tower(-6, 16, 118, 26); tower(-40, 14, 50, 14); tower(28, 14, 46, 12); c.fill();
      c.globalAlpha = 1; c.fillStyle = D ? '#0B0B1E' : '#6366F1'; c.globalAlpha = al; c.beginPath(); c.moveTo(cx - 9 * u, gy - 76 * u); c.lineTo(cx - 9 * u, gy - 92 * u); c.quadraticCurveTo(cx, gy - 104 * u, cx + 9 * u, gy - 92 * u); c.lineTo(cx + 9 * u, gy - 76 * u); c.fill();
      /* flags, windows, the birds and the rider */
      [[-59, 162], [59, 152], [2, 220]].forEach(function (f, n) { var fx0 = cx + f[0] * u, fy0 = gy - f[1] * u; c.globalAlpha = al; c.strokeStyle = near; c.lineWidth = 1.2; c.beginPath(); c.moveTo(fx0, fy0 + 14 * u); c.lineTo(fx0, fy0 - 8 * u); c.stroke(); c.fillStyle = ['#F43F5E', '#FACC15', '#F43F5E'][n]; c.globalAlpha = D ? 0.9 : 0.6; c.beginPath(); c.moveTo(fx0, fy0 - 8 * u); c.quadraticCurveTo(fx0 + 8 * u, fy0 - 10 * u + Math.sin(t * 4 + n) * 2, fx0 + 15 * u, fy0 - 5 * u + Math.sin(t * 4 + n + 1) * 2.4); c.quadraticCurveTo(fx0 + 8 * u, fy0 - 3 * u + Math.sin(t * 4 + n) * 2, fx0, fy0 - 1 * u); c.fill(); });
      Wn.forEach(function (w, n) { var wx = cx + w.x * 120 * u, wy = gy - (80 + w.y * 78 * (Math.abs(w.x) < 0.15 ? 1.3 : 0.6)) * u, on = 0.55 + 0.45 * lkNoise(t * 1.3 + n * 5); c.globalAlpha = (D ? 0.9 : 0.75) * on; c.fillStyle = D ? '#FBBF24' : '#FEF3C7'; c.fillRect(wx, wy, 2.6 * u, 4.2 * u); if (D) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', wx + 1.3 * u, wy + 2 * u, 7 * u, 0.4 * on); c.globalCompositeOperation = 'source-over'; } });
      for (k = 0; k < 5; k++) { var ba = t * 0.5 + k * 1.3, bx = cx + 2 * u + Math.cos(ba) * (34 + k * 7) * u, by = gy - 196 * u + Math.sin(ba) * 12 * u - k * 4, fl = Math.sin(t * 9 + k * 2) * 3 * u; c.globalAlpha = D ? 0.7 : 0.5; c.strokeStyle = D ? '#C7D2FE' : '#4338CA'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx - 5 * u, by - fl); c.quadraticCurveTo(bx - 2 * u, by - 1.5, bx, by); c.quadraticCurveTo(bx + 2 * u, by - 1.5, bx + 5 * u, by - fl); c.stroke(); }
      var ru = (t % 22) / 9; if (ru < 1) { var rx = ru * (cx - 96 * u), ry = gy - 40 * u, bob = Math.abs(Math.sin(t * 9)) * 2; c.globalAlpha = al; c.fillStyle = D ? '#0B0B1E' : '#4338CA'; c.beginPath(); c.ellipse(rx, ry - 7 * u - bob, 7 * u, 3.4 * u, 0, 0, FX_TAU); c.fill(); c.fillRect(rx + 4 * u, ry - 14 * u - bob, 3 * u, 6 * u); c.fillRect(rx - 1.5 * u, ry - 16 * u - bob, 3 * u, 7 * u); c.fillRect(rx - 5 * u, ry - 5 * u, 1.6 * u, 5 * u); c.fillRect(rx + 4 * u, ry - 5 * u, 1.6 * u, 5 * u); c.globalCompositeOperation = D ? 'lighter' : 'source-over'; fxGlow(c, '251,146,60', rx + 3 * u, ry - 20 * u - bob, 12 * u, D ? 0.9 : 0.7); c.globalCompositeOperation = 'source-over'; }
      /* fireworks over the keep */
      var fi = Math.floor((t % 17) / 0.7); if (fi !== lastF) { lastF = fi; if (fi < 4) { var fx1 = cx + fxR(-90, 90) * u, fy1 = gy - fxR(230, 300) * u, hu = fxR(0, 360); for (j = 0; j < 26; j++) { var fa = j / 26 * FX_TAU, fv = fxR(26, 54) * u; Fw.push({ x: fx1, y: fy1, vx: Math.cos(fa) * fv, vy: Math.sin(fa) * fv, l: 0, m: fxR(0.8, 1.4), h: hu + fxR(-20, 20) }); } } }
      c.globalCompositeOperation = D ? 'lighter' : 'source-over'; lkStep(Fw, dt, 22, 0.25, function (p, f) { fxGlow(c, gwRgb(p.h, 95, D ? 68 : 52), p.x, p.y, 3.4, f * (D ? 1 : 0.75)); });
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    };
  };

  /* Overworld (8-Bit, Mythic): the map of a pixel world slides slowly under the page: seas, beaches, grassland, forest and
     snow-capped mountains. Waves glint, towns blink their windows, cloud shadows cross, an airship flies over with its shadow
     beneath it, and now and then a sea serpent rises in three humps and goes under again */
  FX_PAPER.overworld = function (s) {
    var D = bcDark(s), T = 8, NX = 64, NY = 96, buf = document.createElement('canvas'), Tw = [], Wa = [], i, j;
    var AIR = ['....bbbbbbbb....', '..bbBBBBBBBBbb..', '.bBBBBBBBBBBBBb.', '.bBBBwBBBBwBBBb.', '..bbBBBBBBBBbb..', '....bbbbbbbb....', '.....k....k.....', '....wwwwwwww....', '....wyywyyww....', '.....wwwwww.....'], AP = { b: '#B91C1C', B: '#EF4444', w: '#F5E6C8', k: '#44403C', y: '#FDE047' };
    var PAL = D ? ['#0B1D4A', '#12306E', '#7A6A3A', '#1F5C2E', '#134222', '#374151', '#9CA3AF'] : ['#93C5FD', '#BFDBFE', '#FDE68A', '#86EFAC', '#4ADE80', '#CBD5E1', '#FFFFFF'];
    function hgt(x, y) { var a = x / NX * FX_TAU, b = y / NY * FX_TAU; return 0.5 + 0.24 * Math.sin(a * 3 + 1.3 * Math.sin(b * 2)) + 0.22 * Math.sin(b * 4 + 1.7 * Math.sin(a * 2) + 1) + 0.1 * Math.sin(a * 7 + b * 5) + 0.06 * (fxRnd(x * 13 + y * 57) - 0.5); }
    buf.width = NX * T; buf.height = NY * T; var g = buf.getContext('2d');
    for (j = 0; j < NY; j++) { for (i = 0; i < NX; i++) {
      var h = hgt(i, j), ty = h < 0.36 ? 0 : h < 0.46 ? 1 : h < 0.5 ? 2 : h < 0.64 ? 3 : h < 0.76 ? 4 : h < 0.86 ? 5 : 6;
      g.fillStyle = PAL[ty]; g.fillRect(i * T, j * T, T, T);
      if (ty === 4) { g.fillStyle = D ? '#0B2E17' : '#16A34A'; g.fillRect(i * T + 2, j * T + 1, 4, 4); g.fillRect(i * T + 3, j * T + 5, 2, 2); }
      if (ty === 5) { g.fillStyle = D ? '#374151' : '#94A3B8'; g.fillRect(i * T, j * T + 4, T, 4); g.fillRect(i * T + 2, j * T + 2, 4, 2); }
      if (ty === 3 && fxRnd(i * 7 + j * 31) < 0.12) { g.fillStyle = D ? '#2E7D3E' : '#BBF7D0'; g.fillRect(i * T + 2, j * T + 4, 2, 2); g.fillRect(i * T + 5, j * T + 2, 2, 2); }
      if (ty === 3 && fxRnd(i * 91 + j * 17) < 0.022) { Tw.push([i, j]); }
      if (ty < 2 && fxRnd(i * 3 + j * 71) < 0.1) { Wa.push([i, j, fxRnd(i + j) * 6]); }
    } }
    Tw.forEach(function (q) { var x = q[0] * T, y = q[1] * T; g.fillStyle = D ? '#7C2D12' : '#F97316'; g.fillRect(x - 2, y, 12, 4); g.fillStyle = D ? '#D6D3D1' : '#FFFFFF'; g.fillRect(x, y + 4, 8, 6); g.fillStyle = '#44403C'; g.fillRect(x + 3, y + 7, 2, 3); });
    return function (t) {
      var c = s.ctx, W = s.w, H = s.h, BW = NX * T, BH = NY * T, ox = (t * 5) % BW, oy = (t * 3.2) % BH, al = D ? 0.46 : 0.42, x, y, k, fr = Math.floor(t * 6);
      c.globalCompositeOperation = 'source-over'; c.imageSmoothingEnabled = false; c.globalAlpha = al;
      for (y = -oy; y < H; y += BH) { for (x = -ox; x < W; x += BW) { c.drawImage(buf, Math.round(x), Math.round(y)); } }
      /* glints on the water and lights in the towns */
      function at(q, fn) { for (var yy = q[1] * T - oy; yy < H; yy += BH) { for (var xx = q[0] * T - ox; xx < W; xx += BW) { if (xx > -T * 2 && yy > -T * 2) { fn(Math.round(xx), Math.round(yy)); } } } }
      Wa.forEach(function (q) { var ph = Math.floor(t * 2 + q[2]) % 5; if (ph < 2) { at(q, function (xx, yy) { c.globalAlpha = al; c.fillStyle = D ? '#93C5FD' : '#FFFFFF'; c.fillRect(xx + (ph ? 2 : 0), yy + 3, ph ? 4 : 6, 2); }); } });
      Tw.forEach(function (q, n) { if ((fr + n * 3) % 9 < 6) { at(q, function (xx, yy) { c.globalAlpha = Math.min(1, al * 1.6); c.fillStyle = '#FDE047'; c.fillRect(xx + 1, yy + 5, 2, 2); c.fillRect(xx + 6, yy + 5, 2, 2); }); } });
      /* cloud shadows */
      for (k = 0; k < 4; k++) { var sx = Math.round((((k * 263 + t * 16) % (W + 260)) - 130) / 4) * 4, sy = Math.round((((k * 197 + t * 7) % (H + 160)) - 80) / 4) * 4; c.globalAlpha = D ? 0.3 : 0.12; c.fillStyle = '#020617'; c.fillRect(sx, sy, 88, 20); c.fillRect(sx + 12, sy - 8, 56, 8); c.fillRect(sx + 20, sy + 20, 44, 8); }
      /* the sea serpent: three humps in a pixel sea, wherever the middle of the page is over water */
      var su = (t % 19) / 6; if (su < 1) { var qx = Math.floor((ox + W * 0.3) / T), qy = Math.floor((oy + H * 0.6) / T); if (hgt(((qx % NX) + NX) % NX, ((qy % NY) + NY) % NY) < 0.4) { var up = Math.sin(su * Math.PI); for (k = 0; k < 3; k++) { var hx = Math.round((W * 0.3 + k * 26 + su * 30) / 4) * 4, hh = Math.round(up * (10 + 6 * Math.sin(t * 3 + k * 2)) / 4) * 4, hy = Math.round(H * 0.6 / 4) * 4; c.globalAlpha = Math.min(1, al * 1.5); c.fillStyle = '#0D9488'; c.fillRect(hx, hy - hh, 16, hh); c.fillStyle = '#5EEAD4'; c.fillRect(hx + 4, hy - hh, 8, 4); c.fillStyle = D ? '#93C5FD' : '#FFFFFF'; c.fillRect(hx - 4, hy, 24, 4); } } }
      /* the airship and its shadow */
      var au = (t % 34) / 20; if (au < 1) { var ax = Math.round((-80 + au * (W + 160)) / 4) * 4, ay = Math.round((H * 0.34 + Math.sin(au * 7) * 24) / 4) * 4; c.globalAlpha = D ? 0.35 : 0.16; c.fillStyle = '#020617'; c.fillRect(ax + 18, ay + 78, 44, 12); c.globalAlpha = Math.min(1, al * 1.7); bcSpr(c, AIR, AP, ax, ay, 4); bcPx(c, ax - 4, ay + 12 + (fr % 2) * 4, 4, '#E5E7EB'); }
      c.globalAlpha = 1; c.imageSmoothingEnabled = true;
    };
  };

  /* Shadow play (Radiant): the page becomes the lit screen of a shadow-puppet theater, with a curtain along the top. Paper
     figures on thin rods act three scenes in turn: a deer walking through a forest under a cut-out moon, a ship rocking on
     rows of sliding waves while a whale's tail rises, and a town of roofs where a cat walks the ridge and lanterns float up */
  FX_PAPER.shadowplay = function (s) {
    var D = bcDark(s), Ln = [], i, SC = 14; for (i = 0; i < 14; i++) { Ln.push({ x: Math.random(), u: Math.random(), sp: fxR(0.04, 0.09), p: fxR(0, 6) }); }
    return function (t) {
      var c = s.ctx, W = s.w, H = s.h, gy = H - 6, u = Math.min(1.3, W / 390), sc = Math.floor(t / SC) % 3, lt = t % SC, fade = Math.min(1, lt / 1.4, (SC - lt) / 1.4), ink = D ? 'rgba(3,2,8,' : 'rgba(69,39,18,', ia = (D ? 0.9 : 0.5) * fade, k, j;
      function fill(a) { c.fillStyle = ink + (ia * (a || 1)).toFixed(3) + ')'; }
      function rod(x, y) { c.strokeStyle = ink + (ia * 0.5).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x, gy + 8); c.stroke(); }
      /* the lit screen: a warm lamp behind the middle, breathing a little */
      c.globalCompositeOperation = D ? 'lighter' : 'source-over';
      fxGlow(c, D ? '251,191,36' : '253,186,116', W / 2, H * 0.6, Math.max(W, H) * 0.75, (D ? 0.3 : 0.42) * (0.92 + 0.08 * lkNoise(t * 3))); fxGlow(c, D ? '254,243,199' : '254,215,170', W / 2, H * 0.62, W * 0.6, D ? 0.16 : 0.3);
      c.globalCompositeOperation = 'source-over';
      if (sc === 0) {
        /* forest: a moon, layered trees swaying on their rods, a deer walking through, birds */
        c.fillStyle = D ? 'rgba(254,243,199,' + (0.5 * fade).toFixed(3) + ')' : 'rgba(255,255,255,' + (0.8 * fade).toFixed(3) + ')'; c.beginPath(); c.arc(W * 0.72, H * 0.24, 26 * u, 0, FX_TAU); c.fill();
        for (k = 0; k < 7; k++) { var tx = W * (k < 4 ? 0.04 + k * 0.1 : 0.66 + (k - 4) * 0.11), th = (150 + ((k * 53) % 90)) * u, sw = Math.sin(t * 0.8 + k) * 0.03; c.save(); c.translate(tx, gy); c.rotate(sw); fill(k % 2 ? 0.75 : 1); c.fillRect(-3 * u, -th * 0.4, 6 * u, th * 0.4); for (j = 0; j < 3; j++) { var tw = (34 - j * 8) * u, tb = -th * (0.3 + j * 0.22); c.beginPath(); c.moveTo(-tw, tb); c.lineTo(0, tb - th * 0.36); c.lineTo(tw, tb); c.closePath(); c.fill(); } c.restore(); }
        var dx = -60 + ((lt / SC) * (W + 120)), dy = gy - 34 * u, st = Math.sin(t * 5); rod(dx, dy); fill();
        c.beginPath(); c.ellipse(dx, dy, 22 * u, 9 * u, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(dx + 14 * u, dy - 4 * u); c.lineTo(dx + 24 * u, dy - 24 * u); c.lineTo(dx + 34 * u, dy - 22 * u); c.lineTo(dx + 32 * u, dy - 17 * u); c.lineTo(dx + 27 * u, dy - 16 * u); c.lineTo(dx + 21 * u, dy + 2 * u); c.fill();
        c.strokeStyle = c.fillStyle; c.lineWidth = 1.6 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(dx + 25 * u, dy - 24 * u); c.lineTo(dx + 21 * u, dy - 38 * u); c.lineTo(dx + 17 * u, dy - 42 * u); c.moveTo(dx + 21 * u, dy - 38 * u); c.lineTo(dx + 26 * u, dy - 44 * u); c.moveTo(dx + 23 * u, dy - 31 * u); c.lineTo(dx + 29 * u, dy - 36 * u); c.stroke();
        c.lineWidth = 3 * u; c.beginPath(); [[-15, 1], [-9, -1], [11, -1], [17, 1]].forEach(function (L) { c.moveTo(dx + L[0] * u, dy + 5 * u); c.lineTo(dx + (L[0] + st * 7 * L[1]) * u, dy + 34 * u); }); c.stroke();
        for (k = 0; k < 4; k++) { var bx = ((t * 26 + k * 140) % (W + 80)) - 40, by = H * (0.2 + 0.06 * k) + Math.sin(t + k) * 10, fl = Math.sin(t * 8 + k * 2) * 5 * u; c.lineWidth = 1.6; c.beginPath(); c.moveTo(bx - 7 * u, by - fl); c.quadraticCurveTo(bx - 2, by - 2, bx, by); c.quadraticCurveTo(bx + 2, by - 2, bx + 7 * u, by - fl); c.stroke(); }
      } else if (sc === 1) {
        /* sea: a ship rocking, a whale's tail, and three rows of waves sliding opposite ways */
        var rk = Math.sin(t * 1.1) * 0.08, shx = W * 0.56 + Math.sin(t * 0.3) * 30, shy = gy - 86 * u + Math.sin(t * 1.1 + 1) * 5; rod(shx, shy);
        c.save(); c.translate(shx, shy); c.rotate(rk); fill(); c.beginPath(); c.moveTo(-46 * u, 0); c.lineTo(46 * u, 0); c.lineTo(34 * u, 18 * u); c.lineTo(-34 * u, 18 * u); c.closePath(); c.fill(); c.fillRect(-1.5 * u, -70 * u, 3 * u, 70 * u);
        c.beginPath(); c.moveTo(3 * u, -66 * u); c.quadraticCurveTo(40 * u, -40 * u, 3 * u, -8 * u); c.fill(); c.beginPath(); c.moveTo(-3 * u, -58 * u); c.quadraticCurveTo(-30 * u, -36 * u, -3 * u, -10 * u); c.fill(); c.beginPath(); c.moveTo(0, -70 * u); c.lineTo(14 * u, -74 * u + Math.sin(t * 5) * 2); c.lineTo(0, -78 * u); c.fill(); c.restore();
        var wu = (lt - 4) / 5; if (wu > 0 && wu < 1) { var wy = gy - 40 * u - Math.sin(wu * Math.PI) * 70 * u, wx = W * 0.2; fill(); c.beginPath(); c.moveTo(wx - 7 * u, wy + 80 * u); c.quadraticCurveTo(wx - 5 * u, wy + 20 * u, wx - 30 * u, wy - 4 * u); c.quadraticCurveTo(wx - 12 * u, wy - 2 * u, wx, wy + 12 * u); c.quadraticCurveTo(wx + 12 * u, wy - 2 * u, wx + 30 * u, wy - 4 * u); c.quadraticCurveTo(wx + 5 * u, wy + 20 * u, wx + 7 * u, wy + 80 * u); c.fill(); }
        for (k = 0; k < 3; k++) { var wo = (t * (14 + k * 8) * (k % 2 ? -1 : 1)) % (48 * u), wy0 = gy - (44 - k * 18) * u; fill(0.55 + k * 0.2); c.beginPath(); c.moveTo(-60, gy + 10); for (j = -2; j < W / (48 * u) + 3; j++) { var x0 = j * 48 * u + wo; c.lineTo(x0, wy0); c.quadraticCurveTo(x0 + 12 * u, wy0 - 16 * u, x0 + 24 * u, wy0 - 3 * u); c.quadraticCurveTo(x0 + 36 * u, wy0 + 8 * u, x0 + 48 * u, wy0); } c.lineTo(W + 60, gy + 10); c.fill(); }
        for (k = 0; k < 3; k++) { var gx = ((t * 20 + k * 170) % (W + 80)) - 40, ggy = H * (0.22 + 0.05 * k), gf = Math.sin(t * 7 + k * 2) * 5 * u; c.strokeStyle = ink + ia.toFixed(3) + ')'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(gx - 8 * u, ggy - gf); c.quadraticCurveTo(gx - 2, ggy - 2, gx, ggy); c.quadraticCurveTo(gx + 2, ggy - 2, gx + 8 * u, ggy - gf); c.stroke(); }
      } else {
        /* town: a row of roofs and a tower, a cat walking the ridge, lanterns floating up */
        fill(); c.beginPath(); c.moveTo(0, gy + 10); for (k = 0; k < 9; k++) { var hx = k / 9 * W, hw = W / 9, hh = (50 + ((k * 47) % 60)) * u; c.lineTo(hx, gy - hh); c.lineTo(hx + hw * 0.5, gy - hh - hw * 0.42); c.lineTo(hx + hw, gy - hh); } c.lineTo(W, gy + 10); c.fill();
        c.fillRect(W * 0.8, gy - 190 * u, 22 * u, 190 * u); c.beginPath(); c.moveTo(W * 0.8 - 5 * u, gy - 190 * u); c.lineTo(W * 0.8 + 11 * u, gy - 226 * u); c.lineTo(W * 0.8 + 27 * u, gy - 190 * u); c.fill();
        for (k = 0; k < 9; k++) { if ((k * 5) % 3) { c.fillStyle = D ? 'rgba(251,191,36,' + ((0.5 + 0.2 * Math.sin(t + k)) * fade).toFixed(3) + ')' : 'rgba(255,247,214,' + (0.8 * fade).toFixed(3) + ')'; c.fillRect(k / 9 * W + W / 18 - 4 * u, gy - (30 + ((k * 47) % 60) * 0.5) * u, 8 * u, 10 * u); } }
        var cxx = W * 0.1 + ((lt / SC) * W * 0.6), ck = Math.floor(cxx / (W / 9)), cf = (cxx / (W / 9)) - ck, chh = (50 + ((ck * 47) % 60)) * u, cyy = gy - chh - (W / 9) * 0.42 * (1 - Math.abs(cf - 0.5) * 2) - 7 * u, cs = Math.sin(t * 7); rod(cxx, cyy); fill();
        c.beginPath(); c.ellipse(cxx, cyy, 11 * u, 5 * u, 0, 0, FX_TAU); c.fill(); c.beginPath(); c.arc(cxx + 11 * u, cyy - 5 * u, 5 * u, 0, FX_TAU); c.fill(); c.beginPath(); c.moveTo(cxx + 8 * u, cyy - 8 * u); c.lineTo(cxx + 8 * u, cyy - 14 * u); c.lineTo(cxx + 12 * u, cyy - 9 * u); c.lineTo(cxx + 15 * u, cyy - 14 * u); c.lineTo(cxx + 15 * u, cyy - 7 * u); c.fill();
        c.strokeStyle = c.fillStyle; c.lineWidth = 2 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(cxx - 10 * u, cyy - 2 * u); c.quadraticCurveTo(cxx - 20 * u, cyy - 6 * u, cxx - 17 * u, cyy - 18 * u + cs * 2); c.moveTo(cxx - 6 * u, cyy + 3 * u); c.lineTo(cxx - 6 * u + cs * 3 * u, cyy + 9 * u); c.moveTo(cxx + 6 * u, cyy + 3 * u); c.lineTo(cxx + 6 * u - cs * 3 * u, cyy + 9 * u); c.stroke();
        Ln.forEach(function (L) { var lu = (L.u + t * L.sp) % 1, lx = L.x * W + Math.sin(lu * 8 + L.p) * 14, ly = gy - 40 * u - lu * (H * 0.8), la = Math.sin(lu * Math.PI) * fade; c.globalCompositeOperation = D ? 'lighter' : 'source-over'; fxGlow(c, '251,146,60', lx, ly, 13 * u, (D ? 0.7 : 0.55) * la); c.globalCompositeOperation = 'source-over'; c.fillStyle = D ? 'rgba(254,215,170,' + (0.9 * la).toFixed(3) + ')' : 'rgba(194,65,12,' + (0.55 * la).toFixed(3) + ')'; c.beginPath(); fxRR(c, lx - 3.4 * u, ly - 4.6 * u, 6.8 * u, 9.2 * u, 2); c.fill(); });
      }
      /* the curtain along the top and down both sides */
      c.globalCompositeOperation = 'source-over'; var cur = D ? 'rgba(127,29,29,' : 'rgba(159,18,57,';
      for (k = 0; k < Math.ceil(W / 34) + 1; k++) { var vx = k * 34, vy = 20 + Math.sin(t * 1.2 + k * 0.7) * 1.6; c.fillStyle = cur + (k % 2 ? (D ? 0.8 : 0.42) : (D ? 0.62 : 0.32)) + ')'; c.beginPath(); c.moveTo(vx - 17, -4); c.lineTo(vx + 17, -4); c.lineTo(vx + 17, vy); c.quadraticCurveTo(vx, vy + 22, vx - 17, vy); c.closePath(); c.fill(); }
      c.fillStyle = D ? 'rgba(250,204,21,.6)' : 'rgba(202,138,4,.5)'; c.fillRect(0, 0, W, 3);
      [0, 1].forEach(function (sd) { c.fillStyle = cur + (D ? 0.5 : 0.24) + ')'; c.beginPath(); var x0 = sd ? W : 0, dd = sd ? -1 : 1; c.moveTo(x0, 0); c.lineTo(x0 + dd * 26, 0); c.quadraticCurveTo(x0 + dd * (20 + Math.sin(t * 0.7 + sd) * 3), H * 0.3, x0 + dd * 8, H * 0.55); c.lineTo(x0, H * 0.6); c.closePath(); c.fill(); });
    };
  };

  /* ---------- living themes: a theme's own scene, drawn behind the page in its colors (palettes in tools/themes.py) ---------- */
  /* Illuminated (Royal Court, Common, light): the margins of an old manuscript. Vines climb both edges putting out leaves,
     flowers and gold dots that glint; a painted capital sits in the corner; faint ruled lines cross the page; gold dust
     drifts; and along the foot a small knight forever chases a snail */
  FX_LIVING['prize-vellum'] = function (s) {
    var Mo = [], i; for (i = 0; i < 20; i++) { Mo.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6), z: fxR(0.6, 1.3) }); }
    return function (t) {
      var c = s.ctx, W = s.w, H = s.h, cyc = t % 44, grow = Math.min(1, (cyc + (FX_REDUCE ? 30 : 0)) / 20), fade = cyc > 40 ? (44 - cyc) / 4 : 1, y, k;
      c.globalCompositeOperation = 'source-over';
      c.strokeStyle = 'rgba(185,28,28,.07)'; c.lineWidth = 1; c.beginPath(); for (y = 40; y < H; y += 28) { c.moveTo(26, y + 0.5); c.lineTo(W - 26, y + 0.5); } c.stroke();
      c.strokeStyle = 'rgba(30,58,138,.1)'; c.beginPath(); c.moveTo(24.5, 0); c.lineTo(24.5, H); c.moveTo(W - 24.5, 0); c.lineTo(W - 24.5, H); c.stroke();
      /* the vines */
      [11, W - 11].forEach(function (vx, sd) {
        var top = H - (H - 30) * grow, n = 0, d = sd ? -1 : 1;
        c.strokeStyle = 'rgba(21,94,46,' + (0.55 * fade).toFixed(3) + ')'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); for (y = H; y >= top; y -= 6) { var x = vx + Math.sin(y * 0.03 + sd * 2) * 6; if (y === H) { c.moveTo(x, y); } else { c.lineTo(x, y); } } c.stroke();
        for (y = H - 20; y >= top + 8; y -= 26) {
          var x2 = vx + Math.sin(y * 0.03 + sd * 2) * 6, op = Math.min(1, (y - top) / 60), sg = (n % 2 ? 1 : -1), L = 12 * op, an = sg * 0.9 + Math.sin(t * 1.2 + n) * 0.08; n++;
          c.save(); c.translate(x2, y); c.rotate(-Math.PI / 2 + an); c.fillStyle = 'rgba(' + (n % 3 ? '22,128,61' : '77,124,15') + ',' + (0.5 * fade).toFixed(3) + ')'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -L * 0.5, L, 0); c.quadraticCurveTo(L * 0.5, L * 0.5, 0, 0); c.fill(); c.restore();
          if (n % 3 === 0 && op > 0.5) { var fx0 = x2 + d * 9, fo = (op - 0.5) * 2; for (k = 0; k < 5; k++) { c.fillStyle = 'rgba(' + (n % 2 ? '185,28,28' : '30,64,175') + ',' + (0.55 * fade * fo).toFixed(3) + ')'; c.beginPath(); c.arc(fx0 + Math.cos(k * 1.257 + t * 0.2) * 3.6, y + Math.sin(k * 1.257 + t * 0.2) * 3.6, 2.5 * fo, 0, FX_TAU); c.fill(); } c.fillStyle = 'rgba(217,119,6,' + (0.9 * fade * fo).toFixed(3) + ')'; c.beginPath(); c.arc(fx0, y, 1.8, 0, FX_TAU); c.fill(); }
          if (n % 4 === 1 && op > 0.6) { var gl = Math.max(0, Math.sin(t * 1.6 + n * 1.7)); c.fillStyle = 'rgba(202,138,4,' + (0.7 * fade).toFixed(3) + ')'; c.beginPath(); c.arc(x2 - d * 5, y - 9, 2.2, 0, FX_TAU); c.fill(); fxStar4(c, x2 - d * 5, y - 9, 6 * gl, 0.8 * gl * fade, '#FDE68A'); }
        }
      });
      /* the painted capital in the corner */
      var ix = 30, iy = H - 96; c.fillStyle = 'rgba(30,58,138,.4)'; c.fillRect(ix, iy, 46, 46); c.strokeStyle = 'rgba(202,138,4,.75)'; c.lineWidth = 2; c.strokeRect(ix + 1, iy + 1, 44, 44); c.strokeStyle = 'rgba(185,28,28,.5)'; c.lineWidth = 1; c.strokeRect(ix + 5, iy + 5, 36, 36);
      c.font = '700 34px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(202,138,4,.85)'; c.fillText('S', ix + 23, iy + 25); fxStar4(c, ix + 10 + ((t * 9) % 28), iy + 12, 6 * Math.abs(Math.sin(t * 2)), 0.8, '#FFFBEB');
      /* the knight and the snail */
      var sx = ((t * 7) % (W + 120)) - 40, by = H - 10, kx = sx - 60 - Math.sin(t * 0.7) * 12, st = Math.sin(t * 8);
      c.strokeStyle = 'rgba(120,53,15,.18)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(Math.max(0, sx - 200), by + 0.5); c.lineTo(sx - 8, by + 0.5); c.stroke();
      c.fillStyle = 'rgba(120,53,15,.6)'; c.beginPath(); c.moveTo(sx - 10, by); c.quadraticCurveTo(sx, by - 5, sx + 11, by - 2); c.lineTo(sx + 11, by); c.fill(); c.strokeStyle = 'rgba(120,53,15,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(sx + 10, by - 2); c.lineTo(sx + 13, by - 8 + Math.sin(t * 2)); c.moveTo(sx + 8, by - 3); c.lineTo(sx + 9, by - 9 + Math.sin(t * 2 + 1)); c.stroke();
      c.fillStyle = 'rgba(185,28,28,.55)'; c.beginPath(); c.arc(sx - 1, by - 7, 6, 0, FX_TAU); c.fill(); c.strokeStyle = 'rgba(254,243,199,.8)'; c.beginPath(); c.arc(sx - 1, by - 7, 3, 0, 4.4); c.stroke();
      c.fillStyle = 'rgba(30,58,138,.6)'; c.fillRect(kx - 3, by - 15, 6, 9); c.beginPath(); c.arc(kx, by - 18, 3.4, 0, FX_TAU); c.fill(); c.strokeStyle = 'rgba(30,58,138,.6)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(kx - 1.5, by - 6); c.lineTo(kx - 1.5 + st * 3, by); c.moveTo(kx + 1.5, by - 6); c.lineTo(kx + 1.5 - st * 3, by); c.stroke();
      c.strokeStyle = 'rgba(100,116,139,.8)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(kx + 3, by - 12); c.lineTo(kx + 13, by - 20 + st); c.stroke(); c.fillStyle = 'rgba(185,28,28,.6)'; c.beginPath(); c.moveTo(kx, by - 21); c.lineTo(kx - 5, by - 25 + st); c.lineTo(kx - 1, by - 22); c.fill();
      Mo.forEach(function (m) { fxGlow(c, '217,119,6', m.x * W + Math.sin(t * 0.4 + m.p) * 14, ((m.y * H - t * 6 * m.z) % H + H) % H, 2.4 * m.z, 0.35 * (0.5 + 0.5 * Math.sin(t * 1.5 + m.p))); });
    };
  };
  FX_LIVE_THEMES['prize-vellum'] = 1;

  /* Pocket (8-Bit, Rare, light): the green screen of an old handheld. Scan lines, two layers of pixel hills and a brick path
     scrolling along the foot, a little blob that hops along it, clouds, a sun with turning rays, hearts and a battery in the
     corners, and now and then the whole screen refreshes in a band of light */
  FX_LIVING['prize-pocket'] = function (s) {
    var P = 4, G1 = '#A9C26E', G2 = '#5E8037', G3 = '#2F4A1C', BL = ['..gggg..', '.gggggg.', 'gkggkggg', 'gggggggg', 'gggggggg', '.g.gg.g.'], BATT = ['gggggggg.', 'g......gg', 'g.kk.k.gg', 'g......gg', 'gggggggg.'];
    function sn(v) { return Math.round(v / P) * P; }
    return function (t) {
      var c = s.ctx, W = s.w, H = s.h, base = H - 4, x, y, k, fr = Math.floor(t * 6), scr = t * 22;
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = 'rgba(47,74,28,.045)'; for (y = 0; y < H; y += P) { c.fillRect(0, y, W, 1); }
      /* sun, clouds, sparks */
      c.globalAlpha = 0.5; bcPx(c, sn(W * 0.8), sn(H * 0.08), P, G1, 5, 5); for (k = 0; k < 8; k++) { if ((k + fr) % 2) { var ra = k / 8 * FX_TAU; bcPx(c, sn(W * 0.8 + 8 + Math.cos(ra) * 20), sn(H * 0.08 + 8 + Math.sin(ra) * 20), P, G1); } }
      for (k = 0; k < 4; k++) { var cx = sn(((k * 190 - t * (4 + k)) % (W + 100) + W + 100) % (W + 100) - 50), cy = sn(H * (0.14 + 0.09 * k)); c.globalAlpha = 0.4; bcPx(c, cx, cy, P, G1, 9, 2); bcPx(c, cx + P * 2, cy - P, P, G1, 5, 1); }
      for (k = 0; k < 10; k++) { c.globalAlpha = 0.5; bcSpark(c, sn(((k * 97) % 100) / 100 * W), sn(((k * 61) % 100) / 100 * H * 0.7 + 30), P, (fr + k * 2) % 8 < 4 ? (fr + k) % 4 : 0, G2); }
      /* hills and the path */
      for (x = 0; x < W + 8; x += 8) { var m1 = Math.round((40 + 24 * Math.sin((x + scr * 0.3) * 0.014) + 12 * Math.sin((x + scr * 0.3) * 0.04)) / P) * P; c.globalAlpha = 0.5; c.fillStyle = G1; c.fillRect(x, base - 40 - m1, 8, m1 + 44); }
      for (x = 0; x < W + 8; x += 8) { var m2 = Math.round((22 + 12 * Math.sin((x + scr * 0.6) * 0.022 + 2)) / P) * P; c.globalAlpha = 0.5; c.fillStyle = G2; c.fillRect(x, base - 22 - m2, 8, m2 + 26); }
      var ox = -(scr % 24); for (k = -1; k < W / 24 + 2; k++) { x = sn(ox + k * 24); c.globalAlpha = 0.75; c.fillStyle = G3; c.fillRect(x, base - 16, 24, 20); c.fillStyle = G2; c.fillRect(x + P, base - 12, 16, P); c.fillRect(x + P * 3, base - 4, 12, P); c.fillStyle = G1; c.fillRect(x, base - 16, 24, 2); }
      var hop = Math.abs(Math.sin(t * 3.2)), bx = sn(W * 0.3 + Math.sin(t * 0.25) * W * 0.18); c.globalAlpha = 0.85; bcSpr(c, BL, { g: G3, k: '#DCE8B8' }, bx, sn(base - 16 - 24 - hop * 22) + (hop < 0.15 ? P : 0), P);
      /* hearts, battery, and the refresh band */
      for (k = 0; k < 3; k++) { c.globalAlpha = 0.6; bcSpr(c, BC_HEART, { a: G3 }, 8 + k * 18, 8, 2); } c.globalAlpha = 0.6; bcSpr(c, BATT, { g: G3, k: fr % 6 < 4 ? G2 : G3 }, W - 30, 8, 2);
      var ru = (t % 16) / 1.6; if (ru < 1) { c.globalAlpha = 0.35; c.fillStyle = '#F4FAD8'; c.fillRect(0, sn(ru * H), W, P * 5); }
      c.globalAlpha = 1;
    };
  };
  FX_LIVE_THEMES['prize-pocket'] = 1;

  /* Dungeon (8-Bit, Epic, dark): pixel brick walls down both edges with torches burning on them, chains swaying from the
     ceiling, water dripping and splashing, eyes blinking in the dark, bats crossing, a spider on its thread, a slime bouncing
     along the stone floor, and a chest in the corner that now and then opens and throws out coins */
  FX_LIVING['prize-dungeon'] = function (s) {
    var P = 4, Co = [], Dp = [], i, lastC = -1, o = {}, CH = ['.bbbbbbbb.', 'bBBBBBBBBb', 'byyyyyyyyb', 'bBBBkkBBBb', 'bBBBkkBBBb', 'bBBBBBBBBb', 'bbbbbbbbbb'], CP = { b: '#78350F', B: '#B45309', y: '#FACC15', k: '#1C1917' }, SL = ['..gggg..', '.gGGGGg.', 'gGwGGwGg', 'gGGGGGGg', 'gggggggg'];
    function sn(v) { return Math.round(v / P) * P; }
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, y, k, j, fr = Math.floor(t * 8), base = H - 4;
      c.globalCompositeOperation = 'source-over';
      /* brick walls, lit where a torch is near */
      [0, 1].forEach(function (sd) {
        for (y = 0; y < H; y += 12) { for (k = 0; k < 3; k++) { var bx = sd ? W - 28 + k * 16 - ((y / 12) % 2 ? 8 : 0) : -4 + k * 16 - ((y / 12) % 2 ? 8 : 0), near = 1 - Math.min(1, Math.abs(((y + 120) % 260) - 130) / 130); c.globalAlpha = 0.35 + 0.5 * near * (0.8 + 0.2 * lkNoise(t * 5 + sd)); c.fillStyle = fxRnd(y + k * 7 + sd) < 0.15 ? '#3D3468' : '#2B2550'; c.fillRect(bx, y, 15, 11); c.fillStyle = 'rgba(165,180,252,.25)'; c.fillRect(bx, y, 15, 1); } }
        for (y = 130; y < H - 60; y += 260) { var tx = sd ? W - 20 : 12; c.globalAlpha = 1; c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,146,60', tx + 4, y - 6, 70 + 8 * lkNoise(t * 7 + y), 0.4); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#78350F'; c.fillRect(tx + 2, y, P, P * 4); c.fillStyle = '#B45309'; c.fillRect(tx - 2, y - 2, P * 3, P);
          for (k = -1; k <= 1; k++) { var fh = Math.max(1, Math.round((2.4 - Math.abs(k)) * (1.5 + 0.7 * lkNoise(fr * 0.9 + k * 3 + y)))); for (j = 0; j < fh; j++) { c.fillStyle = j < fh * 0.35 ? '#FDE047' : j < fh * 0.7 ? '#FB923C' : '#EF4444'; c.fillRect(tx + 2 + k * P, y - 6 - j * P, P, P); } } }
      });
      /* chains, drips, eyes */
      for (k = 0; k < 3; k++) { var chx = W * (0.25 + k * 0.25), L = 5 + k * 2; for (j = 0; j < L; j++) { c.globalAlpha = 0.5; bcPx(c, sn(chx + Math.sin(t * 1.1 + k) * j * 0.8), j * P * 2, P, j % 2 ? '#64748B' : '#94A3B8', 1, 2); } }
      lkEvery(o, 0.7, dt, function () { Dp.push({ x: sn(fxR(40, W - 40)), y: 0, vx: 0, vy: 60, l: 0, m: 9 }); });
      lkStep(Dp, dt, 500, 0, function (p) { if (p.y > base - 14) { p.l = p.m; Co.push({ x: p.x, y: base - 14, vx: 0, vy: 0, l: 0, m: 0.3, sp: 1 }); return; } c.globalAlpha = 0.7; bcPx(c, p.x, sn(p.y), P, '#7DD3FC', 1, 2); });
      for (k = 0; k < 5; k++) { var ex = sn(W * (0.16 + ((k * 37) % 70) / 100)), ey = sn(H * (0.15 + ((k * 53) % 60) / 100)), bl = (t * 0.5 + k * 1.7) % 6; if (bl < 2.4 && !(bl > 1.1 && bl < 1.25)) { c.globalAlpha = Math.min(1, bl * 2, (2.4 - bl) * 2) * 0.8; bcPx(c, ex, ey, P, k % 2 ? '#F87171' : '#FDE047'); bcPx(c, ex + P * 3, ey, P, k % 2 ? '#F87171' : '#FDE047'); } }
      /* bats and the spider */
      for (k = 0; k < 3; k++) { var bxx = ((t * (34 + k * 9) + k * 200) % (W + 100)) - 50, byy = H * (0.2 + 0.2 * k) + Math.sin(t * 2 + k) * 24; c.globalAlpha = 0.75; bcSpr(c, BC_BAT[(fr + k) % 2], { b: '#4C1D95', r: '#F87171' }, sn(bxx), sn(byy), 3); }
      var sy = sn(60 + 46 * (0.5 + 0.5 * Math.sin(t * 0.45))), spx = sn(W * 0.62); c.globalAlpha = 0.5; c.fillStyle = '#CBD5E1'; c.fillRect(spx + 5, 0, 1, sy); c.globalAlpha = 0.85; bcPx(c, spx, sy, P, '#1E1B4B', 3, 2); bcPx(c, spx + P, sy + P, P, '#F87171'); bcPx(c, spx - P, sy - P + (fr % 2) * P, P, '#1E1B4B'); bcPx(c, spx + P * 3, sy - P + ((fr + 1) % 2) * P, P, '#1E1B4B');
      /* the floor, the slime and the chest */
      for (k = 0; k < W / 24 + 1; k++) { c.globalAlpha = 0.85; c.fillStyle = k % 2 ? '#231F52' : '#1A1742'; c.fillRect(k * 24, base - 12, 24, 16); c.fillStyle = '#4F46E5'; c.fillRect(k * 24, base - 12, 24, 2); }
      var hp = Math.abs(Math.sin(t * 2.6)), slx = sn(((t * 18) % (W + 80)) - 40); c.globalAlpha = 0.9; bcSpr(c, SL, { g: '#16A34A', G: '#4ADE80', w: '#F0FDF4' }, slx, sn(base - 12 - 20 - hp * 26) + (hp < 0.12 ? P : 0), P);
      var cu = (t % 18) - 12, open = cu > 0 && cu < 4, ci = open ? Math.floor(cu / 0.12) : -1, chx2 = sn(W - 96), chy = base - 12 - 28;
      if (ci !== lastC) { lastC = ci; if (open && ci < 14) { Co.push({ x: chx2 + 20, y: chy, vx: fxR(-70, 30), vy: fxR(-240, -150), l: 0, m: 1.6 }); } }
      c.globalAlpha = 0.95; bcSpr(c, CH, CP, chx2, chy - (open ? P : 0), P); if (open) { bcPx(c, chx2 + P, chy + P * 2 - P, P, '#FEF3C7', 8, 1); c.globalCompositeOperation = 'lighter'; fxGlow(c, '250,204,21', chx2 + 20, chy, 40, 0.6); c.globalCompositeOperation = 'source-over'; } else if (fr % 16 === 0) { bcSpark(c, chx2 + 16, chy + 8, P, 1, '#FFFFFF'); }
      lkStep(Co, dt, 520, 0, function (p, f) { c.globalAlpha = Math.min(1, f * 3); if (p.sp) { bcSpark(c, p.x, p.y, P, f > 0.5 ? 1 : 2, '#BAE6FD'); p.vy = 0; return; } if (p.y > base - 16 && p.vy > 0) { p.vy = -p.vy * 0.5; p.y = base - 16; } bcPx(c, sn(p.x), sn(p.y), P, (fr + Math.round(p.m * 10)) % 5 ? '#FACC15' : '#FFFFFF'); });
      c.globalAlpha = 1;
    };
  };
  FX_LIVE_THEMES['prize-dungeon'] = 1;

  /* Vespers (Royal Court, Legendary, dark): a cathedral at evening. Pointed arches recede down both sides, three shafts of
     colored light slant in from high windows and drift, a wheel of glass glows at the top, rows of candles burn along the
     foot of the page, incense curls up, dust turns in the light, and every so often the whole place brightens as a bell tolls */
  FX_LIVING['prize-vespers'] = function (s) {
    var Mo = [], Sm = [], Cd = [], i, o = {};
    for (i = 0; i < 46; i++) { Mo.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6), z: fxR(0.5, 1.4) }); }
    for (i = 0; i < 22; i++) { Cd.push({ x: (i + 0.5) / 22 + fxR(-0.012, 0.012), h: fxR(10, 26), p: fxR(0, 9) }); }
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, toll = Math.max(0, 1 - ((t + (FX_REDUCE ? 19 : 0)) % 21) / 4), sw = 1 + 0.6 * toll, k, j, gy = H - 4;
      /* the wheel of glass and the three shafts */
      c.globalCompositeOperation = 'lighter';
      var rx = W / 2, ry = H * 0.1, R = Math.min(70, W * 0.18); fxGlow(c, '252,211,77', rx, ry, R * 2.2, 0.16 * sw);
      for (k = 0; k < 12; k++) { var a = k / 12 * FX_TAU + t * 0.03; c.fillStyle = 'rgba(' + ['248,113,113', '252,211,77', '96,165,250'][k % 3] + ',' + (0.2 * sw).toFixed(3) + ')'; c.beginPath(); c.moveTo(rx + Math.cos(a) * R * 0.25, ry + Math.sin(a) * R * 0.25); c.arc(rx, ry, R, a + 0.04, a + FX_TAU / 12 - 0.04); c.closePath(); c.fill(); }
      fxRing(c, rx, ry, R, R, '252,211,77', 0.35 * sw, 1.4); fxRing(c, rx, ry, R * 0.25, R * 0.25, '252,211,77', 0.4 * sw, 1);
      [['248,113,113', 0.86, 0], ['252,211,77', 0.62, 1], ['96,165,250', 0.38, 2]].forEach(function (b) { var bx = W * b[1] + Math.sin(t * 0.13 + b[2] * 2) * 30; lkBeam(c, bx + 90, -30, Math.PI / 2 + 0.34 + Math.sin(t * 0.1 + b[2]) * 0.03, H * 1.25, 0.075, b[0], 0.13 * sw); });
      Mo.forEach(function (m) { var mx = m.x * W + Math.sin(t * 0.3 + m.p) * 16, my = ((m.y * H - t * 5 * m.z) % H + H) % H; fxGlow(c, '254,243,199', mx, my, 2 * m.z, (0.2 + 0.25 * Math.sin(t * 1.3 + m.p)) * sw); });
      /* arches down both sides */
      c.globalCompositeOperation = 'source-over';
      for (k = 3; k >= 0; k--) { var z = 1 - k * 0.2, aw = 46 * z, ah = H * (0.5 + 0.14 * k), ay = H * (0.16 + 0.05 * k); [0, 1].forEach(function (sd) { var x0 = sd ? W - k * 15 : k * 15, d = sd ? -1 : 1; c.fillStyle = 'rgba(' + (34 + k * 8) + ',' + (22 + k * 6) + ',' + (26 + k * 7) + ',' + (0.85 - k * 0.15) + ')'; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + d * aw, 0); c.lineTo(x0 + d * aw, ay); c.quadraticCurveTo(x0 + d * aw * 0.9, ay + ah * 0.16, x0 + d * aw * 0.3, ay + ah * 0.3); c.lineTo(x0 + d * aw * 0.3, H); c.lineTo(x0, H); c.fill(); c.strokeStyle = 'rgba(252,211,77,' + (0.16 * sw).toFixed(3) + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0 + d * aw * 0.3, H); c.lineTo(x0 + d * aw * 0.3, ay + ah * 0.3); c.quadraticCurveTo(x0 + d * aw * 0.9, ay + ah * 0.16, x0 + d * aw, ay); c.stroke(); }); }
      /* incense */
      lkEvery(o, 3, dt, function () { Sm.push({ x: W * (Math.random() < 0.5 ? 0.22 : 0.78) + fxR(-4, 4), y: gy - 30, vx: fxR(-3, 3), vy: fxR(-22, -12), l: 0, m: fxR(5, 8), p: fxR(0, 6) }); });
      c.globalCompositeOperation = 'lighter'; lkStep(Sm, dt, 0, 0.9, function (p, f) { fxGlow(c, '203,213,225', p.x + Math.sin(p.l * 1.4 + p.p) * (8 + p.l * 5), p.y, 8 + p.l * 6, 0.07 * Math.sin(f * Math.PI)); });
      /* the candles */
      Cd.forEach(function (q, n) { var x = q.x * W, fk = lkNoise(t * 8 + q.p), top = gy - q.h; c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(245,235,220,.75)'; c.fillRect(x - 1.8, top, 3.6, q.h + 4); c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', x, top - 5, (17 + fk * 2.5) * sw, 0.5); lkTongue(c, x, top, (7 + fk * 1.4) * sw, 1.9, fk * 1.4, 'rgba(253,224,71,.95)'); });
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', W / 2, gy, W * 0.7, 0.12 * sw); if (toll > 0) { fxRing(c, rx, ry, R + (1 - toll) * W * 0.8, R + (1 - toll) * W * 0.8, '252,211,77', toll * 0.4, 2); }
      c.globalCompositeOperation = 'source-over';
    };
  };
  FX_LIVE_THEMES['prize-vespers'] = 1;

  /* Storm keep (8-Bit, Mythic, dark): the last level. A pixel fortress stands over a moat of lava in driving rain, windows
     blinking, banners snapping. Cloud banks roll overhead, lightning stairs down and whitens the whole screen, bats wheel, and
     the dragon crosses the sky and breathes a line of fire before it goes */
  FX_LIVING['prize-stormkeep'] = function (s) {
    var P = 4, Rn = [], Fi = [], i, o = {}, bolt = null, nextB = 3, DP = { g: '#B91C1C', G: '#7F1D1D', e: '#FDE047', t: '#F8FAFC', y: '#FCA5A5', w: '#312E81', W: '#1E1B4B' };
    for (i = 0; i < 90; i++) { Rn.push({ x: Math.random(), y: Math.random(), z: fxR(0.6, 1.4) }); }
    function sn(v) { return Math.round(v / P) * P; }
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, base = H - 4, k, j, fr = Math.floor(t * 8), cx = sn(W * 0.5), T = t + (FX_REDUCE ? 1.6 : 0);
      c.globalCompositeOperation = 'source-over';
      if (T > nextB) { nextB = T + fxR(5, 9); var x = fxR(0.15, 0.85) * W, pts = [], y = 0; while (y < H * 0.62) { pts.push([sn(x), y]); y += P * 3; x += (Math.random() < 0.5 ? -1 : 1) * P * Math.floor(fxR(0, 3)); } bolt = { pts: pts, t0: T }; }
      var ba = bolt ? Math.max(0, 1 - (T - bolt.t0) / 0.5) : 0;
      /* cloud banks */
      for (k = 0; k < 9; k++) { var clx = sn(((k * 120 - t * (7 + (k % 3) * 4)) % (W + 240) + W + 240) % (W + 240) - 120), cly = sn(8 + (k % 3) * 26); c.globalAlpha = 0.7; c.fillStyle = ba > 0.5 ? '#6366F1' : k % 2 ? '#1A1F45' : '#232A5C'; c.fillRect(clx, cly, 120, 20); c.fillRect(clx + 16, cly - 8, 72, 8); c.fillRect(clx + 24, cly + 20, 80, 8); }
      /* the dragon and its fire */
      var du = (t % 30) / 11; if (du < 1) { var dx = sn(W + 90 - du * (W + 190)), dy = sn(H * 0.2 + Math.sin(du * 8) * 18); c.globalAlpha = 0.9; bcSpr(c, BC_DRAGON, DP, dx, dy, 4); lkEvery(o, du > 0.3 && du < 0.6 ? 50 : 0, dt, function () { Fi.push({ x: dx + 4, y: dy + 26, vx: -fxR(150, 240), vy: fxR(20, 90), l: 0, m: fxR(0.5, 0.9) }); }); }
      lkStep(Fi, dt, 0, 0, function (p, f) { c.globalAlpha = 0.9; bcPx(c, sn(p.x), sn(p.y), P, f > 0.66 ? '#FEF9C3' : f > 0.33 ? '#FB923C' : '#DC2626', f > 0.4 ? 2 : 1, f > 0.4 ? 2 : 1); });
      /* lightning */
      if (ba > 0) { c.globalAlpha = ba; bolt.pts.forEach(function (p, n) { bcPx(c, p[0], p[1], P, '#FFFFFF', 1, 3); if (n % 4 === 3) { bcPx(c, p[0] + P, p[1], P, '#C7D2FE', 2, 1); } }); c.globalAlpha = ba * 0.14; c.fillStyle = '#C7D2FE'; c.fillRect(0, 0, W, H); }
      /* the lava and its glow, then the fortress */
      c.globalAlpha = 1; c.globalCompositeOperation = 'lighter'; fxGlow(c, '220,38,38', W / 2, base + 30, W * 0.8, 0.3 + 0.05 * Math.sin(t * 2)); c.globalCompositeOperation = 'source-over';
      for (k = 0; k < W / 12 + 1; k++) { var lh = Math.round(1.5 + 1.5 * Math.sin(t * 2.4 + k * 0.9)); c.globalAlpha = 0.9; c.fillStyle = '#9A3412'; c.fillRect(k * 12, base - 8, 12, 12); c.fillStyle = '#EA580C'; c.fillRect(k * 12, base - 8 - lh * P + P, 12, lh * P); if ((k + fr) % 6 === 0) { c.fillStyle = '#FDBA74'; c.fillRect(k * 12 + 4, base - 8 - lh * P + P, 4, 4); } }
      var wall = ba > 0.5 ? '#4B4F8A' : '#1B1F4A', edge = ba > 0.5 ? '#A5B4FC' : '#2E3470';
      function tower(x, w, h) { c.fillStyle = wall; c.fillRect(cx + x, base - 8 - h, w, h); c.fillStyle = edge; c.fillRect(cx + x, base - 8 - h, P, h); for (var q = 0; q < w / P; q += 2) { c.fillStyle = wall; c.fillRect(cx + x + q * P, base - 8 - h - P * 2, P, P * 2); } }
      c.globalAlpha = 0.95; tower(-120, 240, 44); tower(-132, 36, 96); tower(96, 36, 84); tower(-44, 88, 110); tower(-16, 32, 168); tower(-84, 24, 70); tower(60, 24, 64);
      c.fillStyle = '#05061A'; c.fillRect(cx - 12, base - 8 - 32, 24, 32); c.fillRect(cx - 8, base - 8 - 36, 16, 4);
      [[-120, 60], [108, 50], [-28, 80], [16, 80], [-4, 130], [-76, 40], [68, 36], [-4, 100], [-112, 30], [120, 24]].forEach(function (w, n) { var on = (fr + n * 5) % 23 > 3; c.fillStyle = on ? '#FBBF24' : '#3B2A14'; c.fillRect(cx + w[0], base - 8 - w[1], P, P * 2); });
      [[-116, 96], [112, 84], [0, 168]].forEach(function (f, n) { c.fillStyle = '#94A3B8'; c.fillRect(cx + f[0], base - 8 - f[1] - 28, P, 20); c.fillStyle = '#F43F5E'; c.fillRect(cx + f[0] + P, base - 8 - f[1] - 28 + ((fr + n) % 2) * P, P * 3, P * 2); c.fillRect(cx + f[0] + P * 4, base - 8 - f[1] - 28 + ((fr + n + 1) % 2) * P, P * 2, P * 2); });
      /* bats and rain */
      for (k = 0; k < 3; k++) { var ang = t * 0.6 + k * 2.1; c.globalAlpha = 0.8; bcSpr(c, BC_BAT[(fr + k) % 2], { b: '#0B0E24', r: '#F87171' }, sn(cx + Math.cos(ang) * (60 + k * 22)), sn(base - 210 + Math.sin(ang) * 22 - k * 10), 3); }
      Rn.forEach(function (r) { var ry = (r.y * H + t * 520 * r.z) % H, rx = ((r.x * W - t * 130 * r.z) % W + W) % W; c.globalAlpha = 0.3 * r.z; bcPx(c, sn(rx), sn(ry), P, '#A5B4FC', 1, 2); bcPx(c, sn(rx) - P, sn(ry) + P * 2, P, '#A5B4FC', 1, 1); });
      c.globalAlpha = 1;
    };
  };
  FX_LIVE_THEMES['prize-stormkeep'] = 1;

  /* Midnight library (Radiant, dark): shelves of old books stand down both sides with ladders against them, three lamps
     hang and sway, and a moonbeam crosses with dust turning in it. Books fly through like birds, shedding sparks. On the
     desk along the foot a candle burns beside a turning globe and an hourglass, and now and then a book there opens and a
     spiral of glowing letters climbs out of it */
  FX_LIVING['prize-stacks'] = function (s) {
    var Bk = [], Mo = [], Lt = [], Sk = [], i, o = {}, o2 = {}, o3 = {}, GL = 'abcdefghijklmnopqrstuvwxyzπ∑√∫÷=+?!;', SPN = ['#7F1D1D', '#1E3A8A', '#14532D', '#78350F', '#4C1D95', '#92400E', '#0F766E', '#3F3F46'];
    for (i = 0; i < 5; i++) { Bk.push({ y: fxR(0.12, 0.6), sp: fxR(24, 46), ph: fxR(0, 900), d: i % 2 ? -1 : 1, c: SPN[i], z: fxR(0.8, 1.3) }); }
    for (i = 0; i < 40; i++) { Mo.push({ x: Math.random(), y: Math.random(), p: fxR(0, 6), z: fxR(0.5, 1.4) }); }
    return function (t, dt) {
      var c = s.ctx, W = s.w, H = s.h, lit = (s.opt && s.opt.lit) || 1, gy = H - 4, k, j, y, T = t + (FX_REDUCE ? 15 : 0), op = fxEnv(T % 20, 12, 13, 17.5, 19);
      /* the moonbeam and its dust */
      c.globalCompositeOperation = 'lighter';
      lkBeam(c, -20, -40, 0.95, H * 1.3, 0.13, '191,219,254', 0.1 * lit); lkBeam(c, -20, -40, 0.95, H * 1.3, 0.05, '224,231,255', 0.08 * lit);
      Mo.forEach(function (m) { var mx = m.x * W + Math.sin(t * 0.3 + m.p) * 18, my = ((m.y * H + t * 4 * m.z) % H); fxGlow(c, '254,243,199', mx, my, 2 * m.z, (0.16 + 0.22 * Math.sin(t * 1.2 + m.p)) * lit); });
      /* the shelves: rows of spines, each row lit by the lamps, and a ladder on each side */
      c.globalCompositeOperation = 'source-over';
      [0, 1].forEach(function (sd) {
        var sw = Math.min(44, W * 0.1), x0 = sd ? W - sw : 0; c.fillStyle = 'rgba(36,22,10,.9)'; c.fillRect(x0, 0, sw, H);
        for (y = 6; y < H - 40; y += 46) { var x = x0 + 2, n = Math.floor(y / 46) * 13 + sd * 7; while (x < x0 + sw - 4) { var bw = 4 + Math.floor(fxRnd(n) * 5), bh = 28 + Math.floor(fxRnd(n + 3) * 12), lean = fxRnd(n + 5) < 0.08; c.fillStyle = SPN[Math.floor(fxRnd(n + 1) * 8)]; c.globalAlpha = 0.7 * Math.min(1, lit); if (lean) { c.save(); c.translate(x, y + 40); c.rotate(-0.22); c.fillRect(0, -bh, bw, bh); c.restore(); x += bw + 5; } else { c.fillRect(x, y + 40 - bh, bw, bh); c.fillStyle = 'rgba(253,227,167,.55)'; c.fillRect(x, y + 40 - bh + 5, bw, 1.4); if (fxRnd(n + 9) < 0.3) { c.fillRect(x, y + 40 - 9, bw, 1.4); } x += bw + 1; } n++; } c.globalAlpha = 1; c.fillStyle = 'rgba(92,58,24,.95)'; c.fillRect(x0, y + 40, sw, 4); c.fillStyle = 'rgba(253,227,167,.2)'; c.fillRect(x0, y + 40, sw, 1); }
        var lx = sd ? W - sw - 4 : sw + 4, d = sd ? -1 : 1; c.strokeStyle = 'rgba(146,98,48,.75)'; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, H * 0.34); c.lineTo(lx + d * 26, gy - 30); c.moveTo(lx - d * 9, H * 0.34); c.lineTo(lx + d * 17, gy - 30); for (k = 1; k < 10; k++) { var u = k / 10, yy = H * 0.34 + (gy - 30 - H * 0.34) * u; c.moveTo(lx + d * 26 * u, yy); c.lineTo(lx - d * 9 + d * 26 * u, yy); } c.stroke();
      });
      /* three lamps on their chains */
      [0.26, 0.5, 0.74].forEach(function (px, n) { var an = Math.sin(t * 0.9 + n * 1.7) * 0.06, L = 38 + (n === 1 ? 22 : 0), x = px * W + Math.sin(an) * L, y2 = Math.cos(an) * L, fk = lkNoise(t * 6 + n * 9); c.strokeStyle = 'rgba(180,140,80,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(px * W, 0); c.lineTo(x, y2); c.stroke(); c.fillStyle = 'rgba(120,80,30,.95)'; c.beginPath(); c.moveTo(x - 9, y2 + 8); c.lineTo(x - 4, y2); c.lineTo(x + 4, y2); c.lineTo(x + 9, y2 + 8); c.fill(); c.globalCompositeOperation = 'lighter'; fxGlow(c, '245,181,71', x, y2 + 12, (90 + fk * 6) * lit, 0.22); fxGlow(c, '254,240,138', x, y2 + 10, 9, 0.95); lkBeam(c, x, y2 + 8, Math.PI / 2, 200, 0.42, '245,181,71', 0.07 * lit); c.globalCompositeOperation = 'source-over'; });
      /* books flying through, wings beating */
      Bk.forEach(function (b, n) {
        var bx = (((t * b.sp + b.ph) % (W + 160)) - 80), x = b.d > 0 ? bx : W - bx, y3 = b.y * H + Math.sin(t * 1.1 + n * 2) * 26, fl = Math.sin(t * 9 + n * 2), wy = fl * 9 * b.z;
        c.save(); c.translate(x, y3); c.rotate(Math.sin(t * 1.1 + n * 2 + 1.5) * 0.2 * b.d);
        [-1, 1].forEach(function (d) { c.fillStyle = b.c; c.beginPath(); c.moveTo(0, 0); c.lineTo(d * 15 * b.z, -wy - 3); c.lineTo(d * 15 * b.z, -wy + 7); c.lineTo(0, 9 * b.z); c.fill(); c.fillStyle = 'rgba(253,244,220,.95)'; c.beginPath(); c.moveTo(0, 1); c.lineTo(d * 13 * b.z, -wy - 1); c.lineTo(d * 13 * b.z, -wy + 5); c.lineTo(0, 7.5 * b.z); c.fill(); c.strokeStyle = 'rgba(120,80,40,.5)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(d * 3, 2.5); c.lineTo(d * 11 * b.z, -wy * 0.85 + 1); c.moveTo(d * 3, 5); c.lineTo(d * 11 * b.z, -wy * 0.85 + 3.5); c.stroke(); });
        c.restore();
        lkEvery(n ? o2 : o, 2, dt, function () { Sk.push({ x: x, y: y3 + 6, vx: fxR(-8, 8), vy: fxR(8, 26), l: 0, m: fxR(0.7, 1.4) }); });
      });
      c.globalCompositeOperation = 'lighter'; lkStep(Sk, dt, 0, 0, function (p, f) { fxStar4(c, p.x, p.y, 3.4 * f, f * 0.9, '#FDE3A7'); });
      /* the desk: stacks, an hourglass, a globe, a candle, and the book that opens */
      c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(48,30,14,.97)'; c.fillRect(0, gy - 14, W, 18); c.fillStyle = 'rgba(253,227,167,.3)'; c.fillRect(0, gy - 14, W, 1.4);
      [[0.16, 4], [0.86, 3]].forEach(function (q) { for (k = 0; k < q[1]; k++) { c.fillStyle = SPN[(k * 3 + Math.round(q[0] * 10)) % 8]; c.fillRect(q[0] * W - 16 + (k % 2) * 3, gy - 14 - (k + 1) * 7, 30, 6.4); c.fillStyle = 'rgba(253,244,220,.8)'; c.fillRect(q[0] * W + 12 + (k % 2) * 3, gy - 13 - (k + 1) * 7, 2, 4.4); } });
      var hx = W * 0.3, sand = (t % 12) / 12; c.strokeStyle = 'rgba(180,140,80,.9)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(hx - 7, gy - 40); c.lineTo(hx + 7, gy - 40); c.lineTo(hx + 1, gy - 27); c.lineTo(hx + 7, gy - 14); c.lineTo(hx - 7, gy - 14); c.lineTo(hx - 1, gy - 27); c.closePath(); c.stroke(); c.fillStyle = 'rgba(245,181,71,.85)'; c.fillRect(hx - 5 * (1 - sand), gy - 38 + 9 * sand, 10 * (1 - sand), 9 * (1 - sand)); c.fillRect(hx - 5 * sand, gy - 15 - 8 * sand, 10 * sand, 8 * sand); c.fillRect(hx - 0.5, gy - 28, 1, 12);
      var gx = W * 0.72, gr = 13; c.strokeStyle = 'rgba(180,140,80,.9)'; c.lineWidth = 1.4; c.beginPath(); c.arc(gx, gy - 32, gr + 3, -0.4, Math.PI + 0.4); c.moveTo(gx, gy - 16); c.lineTo(gx, gy - 14); c.stroke(); c.fillStyle = 'rgba(15,118,110,.85)'; c.beginPath(); c.arc(gx, gy - 32, gr, 0, FX_TAU); c.fill(); c.save(); c.beginPath(); c.arc(gx, gy - 32, gr, 0, FX_TAU); c.clip(); c.fillStyle = 'rgba(253,227,167,.75)'; for (k = 0; k < 4; k++) { var lx2 = ((t * 5 + k * 17) % 68) - 20; c.beginPath(); c.ellipse(gx - gr + lx2, gy - 32 + (k % 2 ? 5 : -4), 6, 4 + k, 0.4, 0, FX_TAU); c.fill(); } c.restore();
      var cdx = W * 0.6, fk2 = lkNoise(t * 8); c.fillStyle = 'rgba(245,235,220,.85)'; c.fillRect(cdx - 2, gy - 32, 4, 18); c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', cdx, gy - 38, 30 + fk2 * 3, 0.5); lkTongue(c, cdx, gy - 32, 9 + fk2 * 1.6, 2.2, fk2 * 1.5, 'rgba(253,224,71,.95)');
      var ox = W * 0.46, oy = gy - 14; c.globalCompositeOperation = 'source-over';
      if (op <= 0) { c.fillStyle = '#7F1D1D'; c.fillRect(ox - 13, oy - 8, 26, 8); c.fillStyle = 'rgba(253,244,220,.95)'; c.fillRect(ox - 11, oy - 6.4, 24, 4.8); c.fillStyle = '#F5B547'; c.fillRect(ox - 13, oy - 8, 3, 8); }
      [-1, 1].forEach(function (d) { if (op <= 0) { return; } var an = -d * (0.1 + 1.05 * (1 - op)); c.save(); c.translate(ox, oy); c.rotate(d > 0 ? an : Math.PI + an); c.scale(1, d > 0 ? 1 : -1); c.fillStyle = '#7F1D1D'; c.fillRect(0, -3, 24, 3); c.fillStyle = 'rgba(253,244,220,.95)'; c.fillRect(1, -5.4, 22, 2.6); c.restore(); });
      if (op > 0) { c.globalCompositeOperation = 'lighter'; fxGlow(c, '245,181,71', ox, oy - 8, 60 * op, 0.5 * op); lkBeam(c, ox, oy - 4, -Math.PI / 2, H * 0.6, 0.16, '253,227,167', 0.16 * op); lkEvery(o3, 16 * op, dt, function () { Lt.push({ x: ox, y: oy - 6, vx: 0, vy: -fxR(46, 80), l: 0, m: fxR(2.2, 3.4), ch: GL.charAt(Math.floor(Math.random() * GL.length)), p: fxR(0, 6), r: fxR(8, 34) }); }); }
      c.globalCompositeOperation = 'source-over'; c.font = '700 13px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      lkStep(Lt, dt, 0, 0, function (p, f) { var lx3 = p.x + Math.sin(p.l * 2.6 + p.p) * p.r * Math.min(1, p.l), a2 = Math.sin(f * Math.PI); c.shadowColor = '#F5B547'; c.shadowBlur = 8; c.fillStyle = 'rgba(253,236,190,' + (0.95 * a2).toFixed(3) + ')'; c.fillText(p.ch, lx3, p.y); c.shadowBlur = 0; });
    };
  };
  FX_LIVE_THEMES['prize-stacks'] = 1;

  /* ---------- streak styles: small drawings that grow with the streak (their looks are in prizes.css, classes bc-...) ---------- */
  function bcRects(rows, x, y, u, cls) { var out = ''; rows.forEach(function (row, r) { for (var q = 0; q < row.length; q++) { if (row.charAt(q) === '.') { continue; } var run = 1; while (q + run < row.length && row.charAt(q + run) === row.charAt(q)) { run++; } out += '<rect class="' + cls + '" x="' + (x + q * u) + '" y="' + (y + r * u) + '" width="' + (run * u) + '" height="' + u + '"/>'; q += run - 1; } }); return out; }
  /* Hearts (8-Bit, Common): pixel hearts that beat. One fills for each week, with a half heart on the way; five slots after
     three weeks. Gold at 30 days, and every color at 100 */
  FX_STREAK.hearts = function (n) {
    var full = Math.min(5, Math.floor(n / 7)), half = full < 5 && n % 7 >= 4, slots = n >= 21 ? 5 : 3, out = '', i;
    for (i = 0; i < slots; i++) { var x = 1 + i * 16, st = i < full ? 'on' : i === full && half ? 'half' : 'off'; out += '<g class="bc-hb bc-hb' + (i % 3) + (st === 'off' ? ' off' : '') + '">' + bcRects(BC_HEART, x, 5, 2, 'bc-h' + (st === 'on' ? 'on' : 'off')) + (st === 'half' ? bcRects(['.aa', 'aaa', 'aaa', '.aa', '..a', '...'], x, 5, 2, 'bc-hon') : '') + (st !== 'off' ? '<rect class="bc-hsh" x="' + (x + 2) + '" y="7" width="2" height="2"/>' : '') + '</g>'; }
    if (n >= 100) { out += lkSpk(4, 3, 0) + lkSpk(slots * 16 - 4, 2, 1) + lkSpk(slots * 8, 21, 2); }
    return '<svg class="pz-si bc-hearts' + (n >= 100 ? ' rainbow' : n >= 30 ? ' gold' : '') + '" viewBox="0 0 ' + (slots * 16) + ' 24" aria-hidden="true">' + out + '</svg>';
  };
  /* XP bar (8-Bit, Epic): a pixel badge with your level (one a week) over a bar that fills a seventh each day. Wings at 30
     days, and a crown and a bar of every color at 100 */
  FX_STREAK.xp = function (n) {
    var lv = Math.floor(n / 7) + 1, fill = n >= 100 ? 7 : n % 7, out = '', i;
    if (n >= 30) { out += bcRects(['aaaa....', '.aaaaa..', '..aaaaaa', '...aaaaa', '....aaaa'], 2, 10, 2, 'bc-xw') + bcRects(['....aaaa', '..aaaaa.', 'aaaaaa..', 'aaaaa...', 'aaaa....'], 38, 10, 2, 'bc-xw'); }
    out += '<g class="bc-xb">' + bcRects(['.aaaaaaa.', 'aaaaaaaaa', 'aaaaaaaaa', 'aaaaaaaaa', 'aaaaaaaaa', '.aaaaaaa.', '..aaaaa..', '...aaa...', '....a....'], 19, 5, 2, 'bc-xs') + bcRects(['.aaaaa.', 'a.....a'], 21, 5, 2, 'bc-xr') + '<text class="bc-xt" x="28" y="16.4" text-anchor="middle">' + lv + '</text></g>';
    if (n >= 100) { out += bcRects(['a.a.a', 'aaaaa'], 23, 0, 2, 'bc-xc'); }
    out += '<rect class="bc-xf" x="6" y="26" width="44" height="7"/>';
    for (i = 0; i < 7; i++) { out += '<rect class="bc-xp' + (i < fill ? ' on' : '') + (i === fill - 1 ? ' tip' : '') + '" x="' + (8 + i * 5.8) + '" y="28" width="4.8" height="3"/>'; }
    if (n >= 100) { out += lkSpk(6, 6, 0) + lkSpk(51, 5, 1); }
    return '<svg class="pz-si bc-xp-i' + (n >= 100 ? ' rainbow' : n >= 30 ? ' gold' : '') + '" viewBox="0 0 56 35" aria-hidden="true">' + out + '</svg>';
  };
  /* Banner (Royal Court, Rare): a pennant on a pole that flies longer each week and gains a stripe. At 30 days it carries a
     gold crown and fringe, and at 100 it has two tails and the finial shines */
  FX_STREAK.banner = function (n) {
    var w = Math.min(5, Math.floor(n / 7)), L = 16 + w * 5, out = '<path class="bc-bpole" d="M6 4V40"/><circle class="bc-bfin' + (n >= 100 ? ' shine' : '') + '" cx="6" cy="3.4" r="2.4"/><g class="bc-bfly">', i;
    out += '<path class="bc-bcloth" d="M6 7H' + (6 + L) + (n >= 100 ? 'l-5 5.5 5 5.5-5 5.5 5 5.5H6z' : 'L' + (L + 1) + ' 18L' + (6 + L) + ' 29H6z') + '"/>';
    for (i = 0; i < w; i++) { out += '<path class="bc-bstripe" d="M' + (11 + i * 5) + ' 7v22"/>'; }
    if (n >= 30) { out += '<path class="bc-bcrown" d="M10 22l-1.4-7 3.4 3 2.4-5 2.4 5 3.4-3-1.4 7z"/><path class="bc-bfringe" d="M6 30.5H' + (6 + L - 5) + '"/>'; }
    out += '</g>'; if (n >= 100) { out += lkSpk(L + 4, 5, 0) + lkSpk(L, 34, 1) + lkSpk(14, 38, 2); }
    return '<svg class="pz-si bc-banner' + (n >= 30 ? ' gold' : '') + '" viewBox="0 0 ' + (L + 12) + ' 42" aria-hidden="true">' + out + '</svg>';
  };
  /* Tower (Royal Court, Legendary): a stone tower that gains a storey each week, each with a lit window. At 30 days a flag
     flies from the top, and at 100 a beacon burns there and sparks rise */
  FX_STREAK.tower = function (n) {
    var st = Math.min(6, 1 + Math.floor(n / 7)), top = 40 - st * 6, out = '<path class="bc-tground" d="M2 41H34"/>', i;
    for (i = 0; i < st; i++) { var y = 40 - (i + 1) * 6; out += '<rect class="bc-tst' + (i % 2 ? ' alt' : '') + '" x="' + (10 + (i > 3 ? 1.5 : 0)) + '" y="' + y + '" width="' + (16 - (i > 3 ? 3 : 0)) + '" height="6"/><rect class="bc-twin bc-twin' + (i % 3) + '" x="' + (i % 2 ? 19.5 : 14) + '" y="' + (y + 1.6) + '" width="2.4" height="3"/>'; }
    var tx = st > 4 ? 11.5 : 10, tw = st > 4 ? 13 : 16; out += '<path class="bc-tcren" d="M' + (tx - 1.5) + ' ' + top + 'v-3.4h3v2h' + ((tw - 6) / 2) + 'v-2h3v2h' + ((tw - 6) / 2) + 'v-2h3v3.4z"/>';
    if (n >= 30) { out += '<path class="bc-bpole" d="M18 ' + (top - 3) + 'v-8"/><path class="bc-tflag" d="M18 ' + (top - 11) + 'l7 2.2-7 2.4z"/>'; }
    if (n >= 100) { out += '<circle class="bc-tbeacon" cx="18" cy="' + (top - 5) + '" r="6"/>' + lkSpk(7, top - 4, 0) + lkSpk(30, top + 4, 1) + lkSpk(26, top - 12, 2); }
    return '<svg class="pz-si bc-tower' + (n >= 30 ? ' gold' : '') + '" viewBox="0 ' + Math.min(0, top - 18) + ' 36 ' + (44 - Math.min(0, top - 18)) + '" aria-hidden="true">' + out + '</svg>';
  };
  /* Sword in the stone (Royal Court, Mythic): a sword sunk in a rock, a little further out every day. At 30 days it comes free
     and hangs over the stone in a ring of light, and at 100 rays turn behind it and its jewel shows every color */
  FX_STREAK.sword = function (n) {
    var free = n >= 30, up = free ? 0 : (1 - Math.min(1, n / 30)) * 15, y = free ? -4 : up, out = '';
    if (n >= 100) { out += '<g class="bc-srays">'; for (var i = 0; i < 8; i++) { out += '<path d="M22 20L' + (22 + Math.cos(i * Math.PI / 4 - 0.12) * 24).toFixed(1) + ' ' + (20 + Math.sin(i * Math.PI / 4 - 0.12) * 24).toFixed(1) + 'L' + (22 + Math.cos(i * Math.PI / 4 + 0.12) * 24).toFixed(1) + ' ' + (20 + Math.sin(i * Math.PI / 4 + 0.12) * 24).toFixed(1) + 'z"/>'; } out += '</g>'; }
    if (free) { out += '<ellipse class="bc-shalo" cx="22" cy="20" rx="14" ry="17"/>'; }
    out += '<g class="bc-sword' + (free ? ' free' : '') + '" transform="translate(0 ' + y.toFixed(1) + ')"><path class="bc-sblade" d="M20 12h4v22l-2 3.4-2-3.4z"/><path class="bc-sfull" d="M22 13v20"/><path class="bc-sguard" d="M14 10.4q8-2.6 16 0v2.2q-8-2.2-16 0z"/><rect class="bc-sgrip" x="20.8" y="3.4" width="2.4" height="7"/><circle class="bc-spom' + (n >= 100 ? ' rainbow' : '') + '" cx="22" cy="2.6" r="2.4"/></g>';
    out += '<path class="bc-sstone" d="M6 44q1-9 8-11l5-1.6 8 .4 6 2.2q5 3 5 10z"/><path class="bc-sstone2" d="M12 37l5-2.4 5 .6M27 36l5 2.4"/>' + (free ? '<path class="bc-sslot" d="M19 33.6h6"/>' : '');
    if (free) { out += lkSpk(8, 12, 0) + lkSpk(36, 18, 1) + (n >= 100 ? lkSpk(33, 4, 2) : ''); }
    return '<svg class="pz-si bc-sword-i' + (n >= 100 ? ' shine' : '') + '" viewBox="0 -5 44 50" aria-hidden="true">' + out + '</svg>';
  };
  /* Star owl (Radiant): an owl drawn in stars. A star is added every few days and joined to the last; at 30 days the figure is
     whole and its two eyes burn gold and blink, and at 100 its wings beat, a halo turns round it and a star falls past */
  var BC_OWL = [[22, 6], [14, 4], [10, 12], [7, 22], [9, 33], [17, 40], [22, 43], [27, 40], [35, 33], [37, 22], [34, 12], [30, 4], [22, 6]];
  FX_STREAK.owl = function (n) {
    var k = Math.min(BC_OWL.length, 2 + Math.floor(n / 2.6)), full = n >= 30, out = '', i, d = '';
    if (n >= 100) { out += '<ellipse class="bc-ohalo" cx="22" cy="23" rx="21" ry="23"/><path class="bc-ofall" d="M40 2l-9 7"/>'; }
    if (full) { out += '<path class="bc-obody" d="M22 6L14 4L10 12L7 22L9 33L17 40L22 43L27 40L35 33L37 22L34 12L30 4Z"/><g class="bc-owing bc-owingl"><path class="bc-oline" d="M10 14L3 24L9 31"/><circle class="bc-ostar sm" cx="3" cy="24" r="1.2"/></g><g class="bc-owing bc-owingr"><path class="bc-oline" d="M34 14L41 24L35 31"/><circle class="bc-ostar sm" cx="41" cy="24" r="1.2"/></g><path class="bc-oline" d="M16 14L22 20L28 14M22 20v5"/>'; }
    for (i = 0; i < k; i++) { d += (i ? 'L' : 'M') + BC_OWL[i][0] + ' ' + BC_OWL[i][1]; }
    out += '<path class="bc-oline' + (full ? '' : ' grow') + '" d="' + d + '"/>';
    for (i = 0; i < Math.min(k, 12); i++) { out += '<circle class="bc-ostar bc-ostar' + (i % 3) + (i === k - 1 && !full ? ' new' : '') + '" cx="' + BC_OWL[i][0] + '" cy="' + BC_OWL[i][1] + '" r="' + (i % 4 === 0 ? 1.9 : 1.4) + '"/>'; }
    if (full) { out += '<g class="bc-oeyes"><circle class="bc-oeye" cx="16" cy="14" r="3.2"/><circle class="bc-oeye" cx="28" cy="14" r="3.2"/><circle class="bc-opup" cx="16" cy="14" r="1.2"/><circle class="bc-opup" cx="28" cy="14" r="1.2"/></g>' + lkSpk(4, 6, 0) + lkSpk(40, 40, 1); }
    return '<svg class="pz-si bc-owl' + (n >= 100 ? ' fly' : full ? ' whole' : '') + '" viewBox="-1 0 46 46" aria-hidden="true">' + out + '</svg>';
  };

  /* ---------- the five Radiant looks' arrivals (radiant.js plays one when the prize is won; each ends by 5.4 seconds) ---------- */
  Z_COL.carousel = '250,204,21'; Z_COL.bloom = '249,168,212'; Z_COL.shadowplay = '251,146,60'; Z_COL['prize-stacks'] = '245,181,71'; Z_COL.owl = '165,180,252';
  /* Carousel: the ride fades up out of the dark, small and slow, grows to fill the screen, and its lights go down and fire */
  Z_SCENE.carousel = function (s) {
    var u = Math.min(s.w / 340, s.h / 300, 1.7), sw = 330 * u, sh = 190 * u, sub = zSub(FX_AURA.carousel, sw, sh);
    return function (t, dt, k) {
      var c = s.ctx, a = fxEnv(t, 0.9, 1.6, 99, 100) * k, g = fxEase((t - 0.9) / 1.6);
      c.globalCompositeOperation = 'lighter'; fxGlow(c, '251,191,36', s.w / 2, s.h * 0.56, s.w * 0.7 * g, 0.22 * a);
      sub.step(t + 5.3, dt); zBlit(c, sub, (s.w - sw) / 2, s.h * 0.5 - sh * 0.56, a, 0.55 + 0.45 * g, s.w / 2, s.h * 0.56);
    };
  };
  /* In full bloom: an answer waits in the dark, and the garden grows round it */
  Z_SCENE.bloom = function (s) {
    var kb = { x: s.w * 0.12, y: s.h * 0.46, w: s.w * 0.76, h: 58 }, d; kb.cx = kb.x + kb.w / 2; kb.cy = kb.y + kb.h / 2; d = FX_DRAW.bloom(s, kb);
    return function (t, dt, k) {
      var c = s.ctx, a = fxEnv(t, 0.8, 1.2, 99, 100) * k;
      if (t > 0.9) { c.save(); c.globalAlpha = k; d((t - 0.9) * 1.12, dt * 1.12); c.restore(); fxClean(c); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.fillStyle = '#12301F'; c.beginPath(); fxRR(c, kb.x, kb.y, kb.w, kb.h, 12); c.fill(); c.strokeStyle = '#4ADE80'; c.lineWidth = 1.4; c.stroke();
      c.fillStyle = '#DCFCE7'; c.font = '700 15px ' + FX_MONO; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('B', kb.x + 18, kb.cy); c.font = '600 15px system-ui, sans-serif'; c.fillText('Correct', kb.x + 42, kb.cy); c.globalAlpha = 1;
    };
  };
  /* Shadow play: the lamp comes up behind the screen and the forest scene plays */
  Z_SCENE.shadowplay = function (s) {
    var sub = zSub(FX_PAPER.shadowplay, s.w, s.h, { dark: true });
    return function (t, dt, k) { var a = fxEnv(t, 0.6, 1.8, 99, 100) * k; sub.step(t * 1.4 + 3.4, dt * 1.4); zBlit(s.ctx, sub, 0, 0, a); };
  };
  /* Midnight library: the lamps come up on the shelves, and the book on the desk opens and lets its letters go */
  Z_SCENE['prize-stacks'] = function (s) {
    var sub = zSub(FX_LIVING['prize-stacks'], s.w, s.h, { lit: 1.25 });
    return function (t, dt, k) {
      var c = s.ctx, a = fxEnv(t, 0.5, 1.4, 99, 100) * k;
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.fillStyle = '#0F0A07'; c.fillRect(0, 0, s.w, s.h); c.globalAlpha = 1;
      sub.step(t + 10.8, dt); zBlit(c, sub, 0, 0, a);
    };
  };
  /* Star owl: stars come out one at a time and are joined, the figure closes, and its two eyes light */
  Z_SCENE.owl = function (s) {
    var u = Math.min(s.w / 60, s.h / 90), ox = s.w / 2 - 22 * u, oy = s.h * 0.48 - 23 * u, St = [], i; for (i = 0; i < 60; i++) { St.push({ x: Math.random() * s.w, y: Math.random() * s.h, p: fxR(0, 6), z: fxR(0.5, 1.4) }); }
    function P(q) { return [ox + q[0] * u, oy + q[1] * u]; }
    return function (t, dt, k) {
      var c = s.ctx, a = k, n = Math.max(0, Math.min(BC_OWL.length, (t - 1.0) / 0.15)), eye = fxEase((t - 3.0) / 0.5), j;
      c.globalCompositeOperation = 'lighter';
      St.forEach(function (q) { fxGlow(c, '199,210,254', q.x, q.y, 2 * q.z, (0.2 + 0.3 * Math.sin(t * 2 + q.p)) * a * fxEase(t / 1.2)); });
      if (eye > 0) { c.globalAlpha = 0.14 * eye * a; c.fillStyle = '#818CF8'; c.beginPath(); BC_OWL.forEach(function (q, m) { var p = P(q); if (m) { c.lineTo(p[0], p[1]); } else { c.moveTo(p[0], p[1]); } }); c.fill(); c.globalAlpha = 1; fxGlow(c, '129,140,248', s.w / 2, s.h * 0.48, 40 * u, 0.3 * eye * a); }
      c.strokeStyle = 'rgba(165,180,252,' + (0.8 * a).toFixed(3) + ')'; c.lineWidth = 1.4; c.lineJoin = 'round'; c.beginPath();
      for (j = 0; j < Math.ceil(n); j++) { var p0 = P(BC_OWL[j]); if (j === 0) { c.moveTo(p0[0], p0[1]); } else if (j < n - 1 || n >= BC_OWL.length) { c.lineTo(p0[0], p0[1]); } else { var pr = P(BC_OWL[j - 1]), f = n - Math.floor(n); c.lineTo(pr[0] + (p0[0] - pr[0]) * f, pr[1] + (p0[1] - pr[1]) * f); } }
      c.stroke();
      if (eye > 0) { c.globalAlpha = eye * a; c.beginPath(); [[[10, 14], [3, 24], [9, 31]], [[34, 14], [41, 24], [35, 31]], [[16, 14], [22, 20], [28, 14]]].forEach(function (L) { L.forEach(function (q, m) { var p = P(q); if (m) { c.lineTo(p[0], p[1]); } else { c.moveTo(p[0], p[1]); } }); }); c.stroke(); c.globalAlpha = 1; }
      for (j = 0; j < Math.min(12, Math.floor(n)); j++) { var ps = P(BC_OWL[j]), nw = Math.max(0, 1 - (n - j - 1) / 2); fxGlow(c, '224,231,255', ps[0], ps[1], (5 + 9 * nw) * u / 4, a); fxStar4(c, ps[0], ps[1], (4 + 6 * nw) * u / 4, a, '#FFFFFF'); }
      if (eye > 0) { [16, 28].forEach(function (ex) { var e = P([ex, 14]); fxGlow(c, '253,224,71', e[0], e[1], 9 * u * eye, 0.9 * a); fxGlow(c, '255,255,255', e[0], e[1], 3 * u * eye, a); if (t < 4) { fxRing(c, e[0], e[1], (t - 3) * 40 * u, (t - 3) * 40 * u, '253,224,71', (4 - t) * a, 1.6); } }); }
    };
  };
