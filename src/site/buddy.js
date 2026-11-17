  /* =================== Buddies: the student's character, its skins, and the study buddy that walks along =================== */
  /* The character is a chibi kid (a big head and big eyes on a small body), a boy or a girl, drawn here for My room (room.js),
     live rooms (live.js), the prize cards for skins (crates.js) and the study buddy, a small copy that keeps the student
     company. Its look: { c: the student's color, h: a hat, s: a skin, g: 'b' or 'g', t: a skin tone, r: a hair color }.
     budSVG(look, o) draws it. Each part has its own class, so the moves are CSS animations (buddy.css), and every face and
     mouth it can make is drawn, the one on show picked by data-face and data-mouth on the svg. A drawing that will not move
     (a card, the room, a picture) asks for one face and one mouth only (o.still). The drawing is 100 wide and 120 tall; a
     skin's glow and effects reach past that, so the svg lets them show (overflow: visible). */

  /* ---------- colors ---------- */
  var BUD_SID = 0;
  function budHex(h) { h = String(h || '').replace('#', ''); return h.length === 6 ? [0, 2, 4].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }) : [128, 128, 128]; }
  function budMix(a, b, t) { var A = budHex(a), B = budHex(b); return '#' + A.map(function (v, i) { return ('0' + Math.round(v + (B[i] - v) * t).toString(16)).slice(-2); }).join(''); }
  function budN(v) { return Math.round(v * 100) / 100; }
  var BUD_TONES = [['t1', 'Light', '#FFE3D1'], ['t2', 'Fair', '#F5C7A1'], ['t3', 'Medium', '#D99D72'], ['t4', 'Tan', '#AC7048'], ['t5', 'Deep', '#76452B']];
  var BUD_HAIRS = [['black', 'Black', '#28222E'], ['dark', 'Dark brown', '#4B2F24'], ['brown', 'Brown', '#82522E'], ['blond', 'Blond', '#E2B65E'], ['red', 'Auburn', '#A9432A'], ['silver', 'Silver', '#C9CED9']];
  function budPick(list, id, i) { var x = list.filter(function (r) { return r[0] === id; })[0]; return (x || list[i || 0])[2]; }
  /* the palette for one look: the outfit, the skin, the hair and the eyes */
  function budPal(look) {
    var c = look.c || '#3B82F6', t = budPick(BUD_TONES, look.t, 1), r = budPick(BUD_HAIRS, look.r, 1);
    return {
      c: c, c2: budMix(c, '#160C22', 0.3), c3: budMix(c, '#FFFFFF', 0.34), cl: budMix(c, '#160C22', 0.64), cs: budMix(c, '#FFFFFF', 0.78),
      sk: t, sk2: budMix(t, '#9C4A38', 0.26), skl: budMix(t, '#4E2219', 0.6),
      hr: r, hr2: budMix(r, '#0D0812', 0.42), hr3: budMix(r, '#FFFFFF', 0.55), hrl: budMix(r, '#0D0812', 0.68),
      ir1: budMix(c, '#0B0614', 0.7), ir2: budMix(c, '#0B0614', 0.1), ir3: budMix(c, '#FFFFFF', 0.6), pupil: '#0B0614',
      lid: budMix(r, '#120A16', 0.82), brow: budMix(r, '#120A16', 0.38),
      mouth: '#7A2E3E', mline: '#4A1F2B', tongue: '#FF8E9E', cheek: '#FF7A8C',
      pants: '#2E3448', pants2: '#20253A', shoe: '#FFFFFF', shoe2: '#D3D9E6', sole: '#8E98AE', line: '#2A2033'
    };
  }

  /* ---------- the eyes: anime eyes with a lid line, an iris that fades from dark to light, and two highlights ---------- */
  var BUD_EX = [37.2, 62.8], BUD_EY = 58.6;
  function budP(x, y) { return budN(x) + ' ' + budN(y); }
  /* s is -1 for the left eye and 1 for the right, so the outer corner is always at x + s */
  function budSclera(x, y, s) {
    return 'M' + budP(x - 7 * s, y - 0.8) + 'C' + budP(x - 6.4 * s, y - 7.8) + ' ' + budP(x + 4.6 * s, y - 9.6) + ' ' + budP(x + 7.7 * s, y - 3.8) +
      'C' + budP(x + 9 * s, y + 2.4) + ' ' + budP(x + 5.6 * s, y + 8.5) + ' ' + budP(x + 0.6 * s, y + 8.5) + 'C' + budP(x - 4.6 * s, y + 8.5) + ' ' + budP(x - 7.6 * s, y + 4.2) + ' ' + budP(x - 7 * s, y - 0.8) + 'Z';
  }
  function budLid(P, x, y, s, g) {
    var d = 'M' + budP(x - 7.5 * s, y - 0.1) + 'C' + budP(x - 6.7 * s, y - 8.9) + ' ' + budP(x + 4.8 * s, y - 11.2) + ' ' + budP(x + 8.5 * s, y - 4.9);
    d += g ? 'L' + budP(x + 11.2 * s, y - 7.4) + 'L' + budP(x + 9.7 * s, y - 3.7) + 'L' + budP(x + 10.9 * s, y - 2.4) + 'L' + budP(x + 8.7 * s, y - 2) : 'L' + budP(x + 9.8 * s, y - 2.1);
    d += 'C' + budP(x + 6.5 * s, y - 7.3) + ' ' + budP(x - 4.4 * s, y - 7.9) + ' ' + budP(x - 6.3 * s, y - 0.5) + 'Z';
    return '<path d="' + d + '" fill="' + P.lid + '"/><path d="M' + budP(x + 1.2 * s, y + 9) + 'Q' + budP(x + 5.7 * s, y + 8.1) + ' ' + budP(x + 7.6 * s, y + 4.6) + '" fill="none" stroke="' + P.lid + '" stroke-width=".9" stroke-linecap="round" opacity=".7"/>';
  }
  /* o: { r: iris size (1 normal, smaller when surprised), star: a star for the big highlight, cut: a lid lowered over the top
     ('half' sleepy, 'slant' determined), up: the upper lid line drawn along the cut } */
  function budEye(P, u, i, g, o) {
    o = o || {};
    var x = BUD_EX[i], y = BUD_EY, s = i ? 1 : -1, r = o.r || 1, ix = x + 0.4 * s, iy = y + 1.3;
    var h = '<g class="bud-eye bud-eye-' + i + '"><path d="' + budSclera(x, y, s) + '" fill="#FFFFFF"/>' +
      '<g clip-path="url(#' + u + 'sc' + i + ')"><ellipse cx="' + x + '" cy="' + budN(y - 5.2) + '" rx="9" ry="4.4" fill="#BCC7E3" opacity=".55"/>' +
      '<g class="bud-look"><ellipse cx="' + budN(ix) + '" cy="' + budN(iy) + '" rx="' + budN(5.8 * r) + '" ry="' + budN(7.4 * r) + '" fill="url(#' + u + 'ir)" stroke="' + P.ir1 + '" stroke-width=".8"/>' +
      '<ellipse cx="' + budN(ix) + '" cy="' + budN(iy + 0.5) + '" rx="' + budN(2.7 * r) + '" ry="' + budN(3.9 * r) + '" fill="' + P.pupil + '" opacity=".88"/>' +
      '<ellipse cx="' + budN(ix) + '" cy="' + budN(iy + 4.3 * r) + '" rx="' + budN(3.7 * r) + '" ry="' + budN(1.9 * r) + '" fill="' + P.ir3 + '" opacity=".55"/>' +
      (o.star ? '<path d="M' + budP(ix - 1.6, iy - 6.4) + 'l1.15 2.95 3 .95-3 .95-1.15 2.95-1.15-2.95-3-.95 3-.95z" fill="#FFFFFF" transform="translate(0 1.6)"/>'
        : '<ellipse cx="' + budN(ix - 2.1) + '" cy="' + budN(iy - 3.1) + '" rx="' + budN(2.2 * r) + '" ry="' + budN(2.7 * r) + '" fill="#FFFFFF"/>') +
      '<circle cx="' + budN(ix + 2.4 * r) + '" cy="' + budN(iy + 3.2 * r) + '" r="' + budN(1.05 * r) + '" fill="#FFFFFF" opacity=".92"/><circle cx="' + budN(ix + 3.1 * r) + '" cy="' + budN(iy - 4.5 * r) + '" r=".55" fill="#FFFFFF" opacity=".85"/></g>';
    if (o.cut === 'half') { h += '<path d="M' + budP(x - 10 * s, y - 12) + 'H' + budN(x + 11 * s) + 'V' + budN(y - 0.6) + 'C' + budP(x + 5 * s, y + 0.6) + ' ' + budP(x - 5 * s, y + 0.6) + ' ' + budP(x - 10 * s, y - 0.4) + 'Z" fill="' + P.sk + '"/>'; }
    if (o.cut === 'slant') { h += '<path d="M' + budP(x - 10 * s, y - 12) + 'H' + budN(x + 11 * s) + 'V' + budN(y - 6.6) + 'L' + budP(x - 10 * s, y - 3) + 'Z" fill="' + P.sk + '"/>'; }
    h += '</g>';
    if (o.cut === 'half') { h += '<path d="M' + budP(x - 7.4 * s, y + 0.2) + 'C' + budP(x - 3 * s, y + 1.2) + ' ' + budP(x + 4 * s, y + 1) + ' ' + budP(x + 9.4 * s, y - 0.6) + (g ? 'l' + budN(1.6 * s) + ' -1.6' : '') + '" fill="none" stroke="' + P.lid + '" stroke-width="2.4" stroke-linecap="round"/>'; }
    else if (o.cut === 'slant') { h += '<path d="M' + budP(x - 7.6 * s, y - 2.8) + 'L' + budP(x + 9.4 * s, y - 6.8) + (g ? 'l' + budN(1.8 * s) + ' -1.2' : '') + '" fill="none" stroke="' + P.lid + '" stroke-width="2.6" stroke-linecap="round"/>'; }
    else { h += budLid(P, x, y, s, g); }
    return h + '</g>';
  }
  /* brows: [inner, outer, middle] heights above the eye */
  var BUD_BROW = { n: [-13.2, -14.2, -16.2], up: [-15, -15.6, -18], hi: [-16.8, -17.2, -20], dn: [-11.8, -15, -14.8], wo: [-15.8, -13, -15.6], lo: [-12.2, -12.8, -14.4] };
  function budBrow(P, i, k, g) {
    var x = BUD_EX[i], y = BUD_EY, s = i ? 1 : -1, B = BUD_BROW[k] || BUD_BROW.n, ix = x - 5.4 * s, ox = x + 6.9 * s, cx = x + 0.8 * s;
    if (g) { return '<path d="M' + budP(ix, y + B[0] - 0.6) + 'Q' + budP(cx, y + B[2] - 0.8) + ' ' + budP(ox, y + B[1] - 0.4) + '" fill="none" stroke="' + P.brow + '" stroke-width="1.45" stroke-linecap="round"/>'; }
    return '<path d="M' + budP(ix, y + B[0] - 1.1) + 'Q' + budP(cx, y + B[2] - 1.3) + ' ' + budP(ox, y + B[1] - 0.2) + 'Q' + budP(cx, y + B[2] + 1.5) + ' ' + budP(ix, y + B[0] + 1.1) + 'Z" fill="' + P.brow + '" stroke="' + P.brow + '" stroke-width=".5" stroke-linejoin="round"/>';
  }
  function budBrows(P, k, g, k2) { return budBrow(P, 0, k, g) + budBrow(P, 1, k2 || k, g); }
  function budArc(P, i, up, w) {
    var x = BUD_EX[i], y = BUD_EY;
    return up ? '<path d="M' + budP(x - 6.6, y + 2.6) + 'Q' + budP(x, y - 6.6) + ' ' + budP(x + 6.6, y + 2.6) + '" fill="none" stroke="' + P.lid + '" stroke-width="' + (w || 2.7) + '" stroke-linecap="round"/>'
      : '<path d="M' + budP(x - 6.6, y + 0.6) + 'Q' + budP(x, y + 5.6) + ' ' + budP(x + 6.6, y + 0.6) + '" fill="none" stroke="' + P.lid + '" stroke-width="' + (w || 2.5) + '" stroke-linecap="round"/>';
  }
  var BUD_FACES = {
    open: function (P, u, g) { return budEye(P, u, 0, g) + budEye(P, u, 1, g) + budBrows(P, 'n', g); },
    happy: function (P, u, g) { return budArc(P, 0, true) + budArc(P, 1, true) + budBrows(P, 'up', g); },
    closed: function (P, u, g) { return budArc(P, 0, false) + budArc(P, 1, false) + budBrows(P, 'lo', g); },
    wide: function (P, u, g) { return budEye(P, u, 0, g, { r: 0.8 }) + budEye(P, u, 1, g, { r: 0.8 }) + budBrows(P, 'hi', g); },
    star: function (P, u, g) { return budEye(P, u, 0, g, { star: 1 }) + budEye(P, u, 1, g, { star: 1 }) + budBrows(P, 'up', g); },
    heart: function (P, u, g) {
      return BUD_EX.map(function (x) { var y = BUD_EY + 0.6; return '<path d="M' + budP(x, y + 7.6) + 'C' + budP(x - 11, y - 0.6) + ' ' + budP(x - 6, y - 10.4) + ' ' + budP(x, y - 4.4) + 'C' + budP(x + 6, y - 10.4) + ' ' + budP(x + 11, y - 0.6) + ' ' + budP(x, y + 7.6) + 'Z" fill="#F43F5E" stroke="#9F1239" stroke-width="1.2"/><ellipse cx="' + budN(x - 3.6) + '" cy="' + budN(y - 3.4) + '" rx="1.8" ry="1.3" fill="#FFFFFF" opacity=".9"/>'; }).join('') + budBrows(P, 'up', g);
    },
    dizzy: function (P, u, g) { return BUD_EX.map(function (x) { return '<path d="M' + budP(x, BUD_EY) + 'm-1 0a1 1 0 1 1 2 0a2.8 2.8 0 1 1 -5.6 0a4.6 4.6 0 1 1 9.2 0a6.4 6.4 0 1 1 -12.8 0" fill="none" stroke="' + P.lid + '" stroke-width="1.8" stroke-linecap="round"/>'; }).join('') + budBrows(P, 'wo', g); },
    wink: function (P, u, g) { return budEye(P, u, 0, g) + budArc(P, 1, true) + budBrows(P, 'n', g, 'up'); },
    squint: function (P, u, g) { return BUD_EX.map(function (x, i) { var o = i ? -1 : 1, y = BUD_EY; return '<path d="M' + budP(x - o * 5.8, y - 5.6) + 'L' + budP(x + o * 5, y) + 'L' + budP(x - o * 5.8, y + 5.6) + '" fill="none" stroke="' + P.lid + '" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>'; }).join('') + budBrows(P, 'dn', g); },
    sleepy: function (P, u, g) { return budEye(P, u, 0, g, { cut: 'half' }) + budEye(P, u, 1, g, { cut: 'half' }) + budBrows(P, 'lo', g); },
    cool: function (P, u, g) { return budEye(P, u, 0, g, { cut: 'slant' }) + budEye(P, u, 1, g, { cut: 'slant' }) + budBrows(P, 'dn', g); },
    smug: function (P, u, g) { return budEye(P, u, 0, g, { cut: 'half' }) + budEye(P, u, 1, g) + budBrows(P, 'lo', g, 'up'); }
  };
  /* ---------- mouths ---------- */
  var BUD_MY = 72.4;
  var BUD_MOUTHS = {
    smile: function (P) { return '<path d="M46.8 71.6Q50 74.4 53.2 71.6" fill="none" stroke="' + P.mline + '" stroke-width="1.45" stroke-linecap="round"/>'; },
    open: function (P) { return '<path d="M46.2 70.8Q50 77.6 53.8 70.8Z" fill="' + P.mouth + '" stroke="' + P.mline + '" stroke-width="1.1" stroke-linejoin="round"/><ellipse cx="50" cy="74.5" rx="2" ry="1.15" fill="' + P.tongue + '"/>'; },
    grin: function (P) { return '<path d="M44.8 70.2Q50 79.6 55.2 70.2Z" fill="' + P.mouth + '" stroke="' + P.mline + '" stroke-width="1.2" stroke-linejoin="round"/><path d="M45.6 70.6Q50 72 54.4 70.6L54 71.9Q50 73.3 46 71.9Z" fill="#FFFFFF"/><path d="M47 75.6Q50 78.2 53 75.6Q50 74 47 75.6Z" fill="' + P.tongue + '"/>'; },
    o: function (P) { return '<ellipse cx="50" cy="72.6" rx="2.2" ry="2.7" fill="' + P.mouth + '" stroke="' + P.mline + '" stroke-width="1.1"/>'; },
    yawn: function (P) { return '<ellipse cx="50" cy="73.4" rx="3.7" ry="4.6" fill="' + P.mouth + '" stroke="' + P.mline + '" stroke-width="1.15"/><ellipse cx="50" cy="75.9" rx="2.4" ry="1.4" fill="' + P.tongue + '"/>'; },
    cat: function (P) { return '<path d="M45.6 71.2Q47.8 73.8 50 71.6Q52.2 73.8 54.4 71.2" fill="none" stroke="' + P.mline + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'; },
    flat: function (P) { return '<path d="M47.4 72.6H52.6" stroke="' + P.mline + '" stroke-width="1.5" stroke-linecap="round"/>'; },
    wavy: function (P) { return '<path d="M45.8 72.8q1.4 -1.6 2.8 0t2.8 0t2.8 0" fill="none" stroke="' + P.mline + '" stroke-width="1.4" stroke-linecap="round"/>'; },
    tongue: function (P) { return '<path d="M46.6 71.6Q50 74.6 53.4 71.6" fill="none" stroke="' + P.mline + '" stroke-width="1.45" stroke-linecap="round"/><path d="M50.4 73.1q.2 3.4 2.2 3.4t2-3.2" fill="' + P.tongue + '" stroke="' + P.mline + '" stroke-width=".9"/>'; },
    smirk: function (P) { return '<path d="M46.4 72.6Q50.6 74.4 54 70.8" fill="none" stroke="' + P.mline + '" stroke-width="1.45" stroke-linecap="round"/><path d="M54.3 69.8l.9 1.6" stroke="' + P.mline + '" stroke-width=".9" stroke-linecap="round" opacity=".7"/>'; },
    fang: function (P) { return '<path d="M45.8 70.8Q50 77.8 54.2 70.8Z" fill="' + P.mouth + '" stroke="' + P.mline + '" stroke-width="1.1" stroke-linejoin="round"/><path d="M51.2 71.2l1 2.1 1-2.3Z" fill="#FFFFFF"/><ellipse cx="49.4" cy="74.7" rx="1.9" ry="1.05" fill="' + P.tongue + '"/>'; }
  };

  /* ---------- hair: clumps, each a curved spike from a root to its tip, with a shadow side and a shine ---------- */
  function budLock(r, t, w, b) {
    var dx = t[0] - r[0], dy = t[1] - r[1], L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L, h = w / 2;
    var mx = r[0] + dx * 0.55 + nx * (b || 0), my = r[1] + dy * 0.55 + ny * (b || 0);
    return 'M' + budP(r[0] + nx * h, r[1] + ny * h) + 'Q' + budP(mx + nx * h * 0.78, my + ny * h * 0.78) + ' ' + budP(t[0], t[1]) + 'Q' + budP(mx - nx * h * 0.5, my - ny * h * 0.5) + ' ' + budP(r[0] - nx * h, r[1] - ny * h) + 'Z';
  }
  /* the two long sides of a lock, without its root, so locks melt into the hair above them */
  function budLockEdge(r, t, w, b) {
    var dx = t[0] - r[0], dy = t[1] - r[1], L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L, h = w / 2;
    var mx = r[0] + dx * 0.55 + nx * (b || 0), my = r[1] + dy * 0.55 + ny * (b || 0);
    return 'M' + budP(r[0] + nx * h, r[1] + ny * h) + 'Q' + budP(mx + nx * h * 0.78, my + ny * h * 0.78) + ' ' + budP(t[0], t[1]) + 'Q' + budP(mx - nx * h * 0.5, my - ny * h * 0.5) + ' ' + budP(r[0] - nx * h, r[1] - ny * h);
  }
  /* each lock: [root x, root y, tip x, tip y, width, bend]; drawn back to front, each with a shadow side, a shine and its outline */
  function budLocks(P, u, list, o) {
    o = o || {};
    return list.map(function (k, i) {
      var r = [k[0], k[1]], t = [k[2], k[3]], dx = t[0] - r[0], dy = t[1] - r[1], L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L, side = k[5] < 0 ? 1 : -1;
      var sh = budLock([r[0] + dx * 0.3 + nx * k[4] * 0.2 * side, r[1] + dy * 0.3 + ny * k[4] * 0.2 * side], [r[0] + dx * 0.9 + nx * side * 0.4, r[1] + dy * 0.9 + ny * side * 0.4], k[4] * 0.36, k[5] * 0.6);
      var hi = o.shine === false ? '' : budLock([r[0] + dx * 0.36 - nx * side * k[4] * 0.12, r[1] + dy * 0.36 - ny * side * k[4] * 0.12], [r[0] + dx * 0.66 - nx * side * k[4] * 0.1, r[1] + dy * 0.66 - ny * side * k[4] * 0.1], 1.3, k[5] * 0.3);
      return '<path d="' + budLock(r, t, k[4], k[5]) + '" fill="' + (o.fill || 'url(#' + u + 'hc)') + '"/>' + '<path d="' + sh + '" fill="' + P.hr2 + '" opacity=".42"/>' + (hi ? '<path d="' + hi + '" fill="' + P.hr3 + '" opacity=".5"/>' : '') +
        '<path d="' + budLockEdge(r, t, k[4], k[5]) + '" fill="none" stroke="' + P.hrl + '" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>';
    }).join('');
  }
  var BUD_CAP = 'M18.6 54C16.4 30 30 11.6 50 11.6C70 11.6 83.6 30 81.4 54C78 46 72.6 40.6 64 38.4C56 36.8 44 36.8 36 38.4C27.4 40.6 22 46 18.6 54Z';
  var BUD_BANGS = {
    b: [[25, 36, 22.6, 63.2, 8, 1.2], [75, 36, 77.4, 63.2, 8, -1.2], [30, 28, 27.4, 51.6, 10, 1.8], [70, 28, 73.2, 52, 10, -1.8], [36, 24, 34, 47.8, 11, 1.4], [64, 24, 67.4, 48.6, 11, -1.8],
      [40, 24, 39.4, 43.6, 8, 0.6], [44, 22, 47.6, 46, 12, -1.6], [49, 21, 53.2, 42, 7, -1], [54, 22, 59.4, 46.8, 12, -2.2]],
    g: [[26.6, 34, 24.8, 52, 9, 1.2], [73.4, 34, 75.2, 52.4, 9, -1.2], [32, 26, 30.2, 49.2, 10.4, 1.4], [68, 26, 70.6, 49.8, 10.4, -1.6], [39, 23, 37.6, 47.4, 11, 1], [61, 23, 63.4, 48, 11, -1.4], [46, 21.6, 45.2, 46.2, 10.6, 0.4], [54.6, 21.6, 56.4, 46.6, 10.6, -0.8]]
  };
  var BUD_SPIKES = [[21, 42, 14, 51.4, 8, 1.6], [79, 42, 86, 51.4, 8, -1.6], [30, 22, 19.6, 11, 12, 2.4], [71, 21, 81.4, 10.6, 12, -2.4], [40, 16, 33.4, 2.4, 12, 1.6], [62, 15.6, 68.8, 2.8, 12, -1.6], [51, 14, 51.6, -0.8, 12, -1.2]];
  var BUD_LONG = [[22, 44, 16.2, 100, 11, 2.2], [78, 44, 83.8, 100, 11, -2.2], [26, 50, 21.6, 104.6, 10, 1.4], [74, 50, 78.4, 104.6, 10, -1.4], [31, 54, 28.4, 99, 9, 1], [69, 54, 71.6, 99, 9, -1]];
  /* the shine across the top of the head: a band with a jagged lower edge */
  function budShine(P) {
    var top = [], bot = [], i, n = 9;
    for (i = 0; i <= n; i++) { var a = Math.PI * (1.16 + 0.68 * i / n); top.push(budP(50 + 26.5 * Math.cos(a), 33 + 19 * Math.sin(a))); bot.push(budP(50 + (i % 2 ? 22.6 : 24.2) * Math.cos(a), 33 + (i % 2 ? 12.4 : 15.2) * Math.sin(a))); }
    return '<path d="M' + top.join('L') + 'L' + bot.reverse().join('L') + 'Z" fill="' + P.hr3 + '" opacity=".38" stroke="' + P.hr3 + '" stroke-width=".6" stroke-linejoin="round"/>';
  }
  /* ---------- the head, the body and the arms of the plain look: a hoodie, dark pants and sneakers ---------- */
  var BUD_FACE = 'M23 52C23 37 35 29.5 50 29.5C65 29.5 77 37 77 52C77 66.4 68.6 77.4 50 79.6C31.4 77.4 23 66.4 23 52Z';
  var BUD_PART = {
    /* behind the body: a girl's long hair */
    hairBack: function (P, u, g) {
      if (!g) { return ''; }
      return '<g class="bud-hairback"><path d="M19.4 42C15.6 62 15.4 84 18 98H82C84.6 84 84.4 62 80.6 42Z" fill="' + P.hr2 + '"/>' + budLocks(P, u, BUD_LONG, { fill: 'url(#' + u + 'hl)' }) + '</g>';
    },
    legs: function (P) {
      function leg(x, side) {
        var m = side === 'l' ? 1 : -1, sx = x - m * 0.4;
        return '<g class="bud-leg bud-leg-' + side + '"><path d="M' + x + ' 99.4V106.4" stroke="#141826" stroke-width="9.2" stroke-linecap="round"/><path d="M' + x + ' 99.4V106.4" stroke="' + P.pants + '" stroke-width="7" stroke-linecap="round"/>' +
          '<path d="M' + budP(sx - 6.2, 111.8) + 'C' + budP(sx - 6.2, 108.4) + ' ' + budP(sx - 3.4, 107) + ' ' + budP(sx, 107) + 'C' + budP(sx + 3.4, 107) + ' ' + budP(sx + 5.6, 108.6) + ' ' + budP(sx + 5.4, 111.6) + 'C' + budP(sx + 5.4, 113.4) + ' ' + budP(sx + 4.2, 114.2) + ' ' + budP(sx + 2.4, 114.2) + 'H' + budN(sx - 4.4) + 'C' + budP(sx - 5.6, 114.2) + ' ' + budP(sx - 6.2, 113.4) + ' ' + budP(sx - 6.2, 111.8) + 'Z" fill="' + P.shoe + '" stroke="' + P.line + '" stroke-width="1.15"/>' +
          '<path d="M' + budP(sx - 6, 112.2) + 'H' + budN(sx + 5.3) + '" stroke="' + P.sole + '" stroke-width="1.5"/><path d="M' + budP(sx - 3.2, 109.8) + 'Q' + budP(sx - 0.4, 108.4) + ' ' + budP(sx + 2.6, 110.2) + '" fill="none" stroke="' + P.c + '" stroke-width="1.5" stroke-linecap="round"/></g>';
      }
      return leg(45.2, 'l') + leg(54.8, 'r');
    },
    torso: function (P, u) {
      return '<path d="M34.4 80.4C35.2 77 40.2 75.6 50 75.6C59.8 75.6 64.8 77 65.6 80.4L68.2 97.8C68.6 100.6 66.8 102.2 64 102.2H36C33.2 102.2 31.4 100.6 31.8 97.8Z" fill="url(#' + u + 'td)" stroke="' + P.cl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M34.4 80.4C33.6 86 32.6 92 31.8 97.8C31.6 99.6 32.2 100.8 33.4 101.6C34.8 94 35.4 86 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.c2 + '" opacity=".5"/>' +
        '<path d="M39.6 89.4H60.4L62 96.2H38Z" fill="' + P.c2 + '" opacity=".4" stroke="' + P.cl + '" stroke-width=".8" stroke-linejoin="round"/>' +
        '<path d="M32 96.4H68L68.2 97.8C68.6 100.6 66.8 102.2 64 102.2H36C33.2 102.2 31.4 100.6 31.8 97.8Z" fill="' + P.c2 + '" stroke="' + P.cl + '" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="M50 80V96.4" stroke="' + P.cl + '" stroke-width=".9"/><rect x="49" y="81.2" width="2" height="3.4" rx=".8" fill="' + P.cs + '" stroke="' + P.cl + '" stroke-width=".5"/>' +
        '<path d="M45.4 79.6L44.6 88.2M54.6 79.6L55.4 88.2" stroke="' + P.cs + '" stroke-width="1.15" stroke-linecap="round"/><path d="M44.5 88V89.8M55.5 88V89.8" stroke="' + P.cl + '" stroke-width="1.4" stroke-linecap="round"/>';
    },
    arm: function (P, side) {
      var m = side < 0 ? 1 : -1, sx = side < 0 ? 37.2 : 62.8, ex = side < 0 ? 31.6 : 68.4, hx = side < 0 ? 31 : 69;
      return '<path d="M' + sx + ' 80.6L' + ex + ' 92.4" stroke="' + (P.armline || P.cl) + '" stroke-width="9.8" stroke-linecap="round"/><path d="M' + sx + ' 80.6L' + ex + ' 92.4" stroke="' + (P.arm || P.c) + '" stroke-width="7.4" stroke-linecap="round"/>' +
        '<path d="M' + budP(ex + m * 0.7, 90.6) + 'L' + budP(ex - m * 0.5, 93.4) + '" stroke="' + (P.cuff || P.c2) + '" stroke-width="7.6"/>' +
        '<circle cx="' + hx + '" cy="96" r="3.9" fill="' + (P.hand || P.sk) + '" stroke="' + (P.handline || P.skl) + '" stroke-width="1.1"/>';
    },
    ears: function (P, u, g) {
      if (g) { return ''; }
      return '<path d="M24.2 56C19.4 53.6 17.2 60.4 20.6 64.6C22 66.2 24 65.8 25 63.8Z" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1.1"/><path d="M22.4 58.4C21 59.8 21.2 62 22.6 63" fill="none" stroke="' + P.skl + '" stroke-width=".8" opacity=".6"/>' +
        '<path d="M75.8 56C80.6 53.6 82.8 60.4 79.4 64.6C78 66.2 76 65.8 75 63.8Z" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1.1"/><path d="M77.6 58.4C79 59.8 78.8 62 77.4 63" fill="none" stroke="' + P.skl + '" stroke-width=".8" opacity=".6"/>';
    },
    face: function (P, u, g) {
      var bangs = BUD_BANGS[g ? 'g' : 'b'];
      return '<path d="' + BUD_FACE + '" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1.2"/>' +
        '<g clip-path="url(#' + u + 'fc)"><g transform="translate(0 2.8)" fill="' + P.sk2 + '" opacity=".45">' + bangs.map(function (k) { return '<path d="' + budLock([k[0], k[1]], [k[2], k[3]], k[4], k[5]) + '"/>'; }).join('') + '<path d="' + BUD_CAP + '"/></g>' +
        '<path d="M23 52C23 66 31 77 50 79.6C36 74 28 66 27.6 52Z" fill="' + P.sk2 + '" opacity=".25"/></g>' +
        '<path d="M50.2 64.8l.9 1.5" stroke="' + P.skl + '" stroke-width=".9" stroke-linecap="round" opacity=".55"/>';
    },
    cheeks: function (P, u, g) { return '<g class="bud-cheek"><ellipse cx="29.8" cy="67.6" rx="4.4" ry="2.3" fill="' + P.cheek + '" opacity="' + (g ? '.36' : '.24') + '"/><ellipse cx="70.2" cy="67.6" rx="4.4" ry="2.3" fill="' + P.cheek + '" opacity="' + (g ? '.36' : '.24') + '"/></g>'; },
    /* over the face: the hair, with spikes for a boy and a cowlick, side locks and a clip for a girl; o.covered when a hat sits on top */
    hair: function (P, u, g, o) {
      var h = '';
      if (!g && !o.covered) { h += '<g class="bud-spikes">' + budLocks(P, u, BUD_SPIKES) + '</g>'; }
      if (g && !o.covered) { h += '<path class="bud-ahoge" d="M49.4 13.4C46.4 6.4 50.6 1.4 56.4 3.4C52.4 4 50.8 7.6 52 13Z" fill="' + P.hr + '" stroke="' + P.hrl + '" stroke-width="1"/>'; }
      h += '<path d="' + BUD_CAP + '" fill="url(#' + u + 'hc)" stroke="' + P.hrl + '" stroke-width="1.1"/>' + (o.covered ? '' : budShine(P));
      h += budLocks(P, u, BUD_BANGS[g ? 'g' : 'b']);
      if (g) {
        h += '<g class="bud-lock-l">' + budLocks(P, u, [[25.4, 38, 19.2, 90, 9.8, 3.4]], { fill: 'url(#' + u + 'hl)' }) + '</g>' +
          '<g class="bud-lock-r">' + budLocks(P, u, [[74.6, 38, 80.8, 90, 9.8, -3.4]], { fill: 'url(#' + u + 'hl)' }) + '</g>' +
          (o.noclip ? '' : '<g transform="rotate(-24 69 30)"><rect x="63.6" y="28.4" width="10.8" height="2.8" rx="1.4" fill="' + P.c3 + '" stroke="' + P.cl + '" stroke-width=".8"/><rect x="64.6" y="32.2" width="9" height="2.6" rx="1.3" fill="' + P.c + '" stroke="' + P.cl + '" stroke-width=".8"/></g>');
      }
      return h;
    },
    defs: function (P, u, g) {
      return '<clipPath id="' + u + 'fc"><path d="' + BUD_FACE + '"/></clipPath>' +
        '<clipPath id="' + u + 'sc0"><path d="' + budSclera(BUD_EX[0], BUD_EY, -1) + '"/></clipPath><clipPath id="' + u + 'sc1"><path d="' + budSclera(BUD_EX[1], BUD_EY, 1) + '"/></clipPath>' +
        '<linearGradient id="' + u + 'ir" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.ir1 + '"/><stop offset=".42" stop-color="' + P.ir2 + '"/><stop offset="1" stop-color="' + P.ir3 + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'hc" gradientUnits="userSpaceOnUse" x1="0" y1="6" x2="0" y2="62"><stop offset="0" stop-color="' + budMix(P.hr, '#FFFFFF', 0.16) + '"/><stop offset=".6" stop-color="' + P.hr + '"/><stop offset="1" stop-color="' + budMix(P.hr, P.hr2, 0.5) + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'hl" gradientUnits="userSpaceOnUse" x1="0" y1="36" x2="0" y2="104"><stop offset="0" stop-color="' + P.hr + '"/><stop offset="1" stop-color="' + budMix(P.hr, P.hr2, 0.7) + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'td" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + P.c3 + '"/><stop offset=".55" stop-color="' + P.c + '"/><stop offset="1" stop-color="' + P.c2 + '"/></linearGradient>';
    }
  };

  /* ---------- hats from My room ---------- */
  var BUD_HATS = {
    grad: function () {
      return '<path d="M27 27C27 16.6 37 12.8 50 12.8C63 12.8 73 16.6 73 27C66 24.4 34 24.4 27 27Z" fill="#1F2937" stroke="#0B0F17" stroke-width="1"/><path d="M50 2.8L82.4 11.8L50 20.8L17.6 11.8Z" fill="#111827" stroke="#000000" stroke-width=".8" stroke-linejoin="round"/>' +
        '<path d="M50 4.4L78 11.8" stroke="#374151" stroke-width=".8"/><circle cx="50" cy="11.8" r="1.5" fill="#FACC15"/><path d="M50 11.8L77.6 15.4V29" fill="none" stroke="#FACC15" stroke-width="1.5" stroke-linecap="round"/><path d="M75.8 28.6h3.6l.6 5h-4.8z" fill="#FACC15" stroke="#B45309" stroke-width=".6"/>';
    },
    beanie: function () {
      return '<path d="M18.4 38C18.4 18.6 32 8.4 50 8.4C68 8.4 81.6 18.6 81.6 38Z" fill="#1E3A8A" stroke="#0F1D4A" stroke-width="1.1"/><path d="M30 15.4C28 22 27.4 30 27.6 36M42 10.6C41 18 40.8 28 41 36M58 10.6C59 18 59.2 28 59 36M70 15.4C72 22 72.6 30 72.4 36" stroke="#2C4BA6" stroke-width="1.3" fill="none"/>' +
        '<rect x="16.4" y="31.6" width="67.2" height="9.4" rx="4.7" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/><path d="M22 33.4v6M28 33v7M34 32.8v7.4M40 32.6v7.6M46 32.6v7.6M52 32.6v7.6M58 32.6v7.6M64 32.8v7.4M70 33v7M76 33.4v6" stroke="#CBD5E1" stroke-width="1"/>' +
        '<circle cx="50" cy="7" r="5.2" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1"/>';
    },
    phones: function () {
      return '<path d="M17.4 54C17.4 26 30 9.2 50 9.2S82.6 26 82.6 54" fill="none" stroke="#111827" stroke-width="3.8" stroke-linecap="round"/><path d="M22 30C26 17 37 11.6 50 11.6" fill="none" stroke="#475569" stroke-width="1" stroke-linecap="round"/>' +
        '<rect x="11.4" y="47.4" width="10.4" height="17" rx="5" fill="#F59E0B" stroke="#92400E" stroke-width="1.1"/><rect x="78.2" y="47.4" width="10.4" height="17" rx="5" fill="#F59E0B" stroke="#92400E" stroke-width="1.1"/><rect x="13.4" y="50" width="3" height="11.6" rx="1.5" fill="#FCD34D"/><rect x="80.2" y="50" width="3" height="11.6" rx="1.5" fill="#FCD34D"/>';
    },
    bow: function () {
      return '<g transform="translate(70 22) rotate(16)"><path d="M0 0L-11 -7.4V7.4ZM0 0L11 -7.4V7.4Z" fill="#F43F5E" stroke="#9F1239" stroke-width="1" stroke-linejoin="round"/><path d="M-9 -4.4L-3 -1M9 -4.4L3 -1" stroke="#FDA4AF" stroke-width="1" stroke-linecap="round"/><circle r="3.6" fill="#E11D48" stroke="#9F1239" stroke-width="1"/></g>';
    },
    cap: function () {
      return '<path d="M20.4 36C20.4 18.6 33 9.4 50 9.4S79.6 18.6 79.6 36Z" fill="#DC2626" stroke="#7F1D1D" stroke-width="1.1"/><path d="M50 9.6V35M36 12.6C33 20 32 28 32.2 35M64 12.6C67 20 68 28 67.8 35" stroke="#B91C1C" stroke-width="1" fill="none"/><circle cx="50" cy="9.6" r="2.2" fill="#B91C1C"/>' +
        '<path d="M22.6 35.2C34 31 66 30.8 87.4 37.4C86.4 41.8 81.6 43 75 41.6C63 39 41 38.8 25.4 41C22.6 40.4 21.8 37 22.6 35.2Z" fill="#B91C1C" stroke="#7F1D1D" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<rect x="44" y="20" width="12" height="8" rx="2" fill="#FFFFFF"/><path d="M47 24h6M50 21.6v4.8" stroke="#DC2626" stroke-width="1.6"/>';
    }
  };

  /* ---------- arms in front, for the moves that bring the hands up past the big head ---------- */
  function budPoses(P) {
    var a = P.arm || P.c, L = P.armline || P.cl, h = P.hand || P.sk, hl = P.handline || P.skl;
    function arm(d, hx, hy) { return '<path d="' + d + '" stroke="' + L + '" stroke-width="9.8" stroke-linecap="round" fill="none"/><path d="' + d + '" stroke="' + a + '" stroke-width="7.4" stroke-linecap="round" fill="none"/><circle cx="' + hx + '" cy="' + hy + '" r="4" fill="' + h + '" stroke="' + hl + '" stroke-width="1.1"/>'; }
    return '<g class="bud-pose bud-pose-fists"><g class="bud-fist-l">' + arm('M37.2 81Q28 80 25.6 73.4', 25, 70.8) + '</g><g class="bud-fist-r">' + arm('M62.8 81Q72 80 74.4 73.4', 75, 70.8) + '</g></g>' +
      '<g class="bud-pose bud-pose-mouth">' + arm('M62.8 81Q60 78.4 54.6 75.6', 52.4, 74.4) + '</g>' +
      '<g class="bud-pose bud-pose-chin">' + arm('M62.8 81Q62 83 59.4 82.4', 57.6, 80.6) + '</g>' +
      '<g class="bud-pose bud-pose-clasp">' + arm('M37.2 81Q40 88 46.6 90.2', 47.6, 90.6) + arm('M62.8 81Q60 88 53.4 90.2', 52.4, 90.6) + '</g>' +
      '<g class="bud-pose bud-pose-thumb">' + arm('M62.8 81Q70 84 73.6 79', 74.4, 77.4) + '<path d="M73.6 74.4v-4" stroke="' + hl + '" stroke-width="3.6" stroke-linecap="round"/><path d="M73.6 74.4v-4" stroke="' + h + '" stroke-width="2" stroke-linecap="round"/></g>';
  }
  /* what a move shows around the head */
  var BUD_FX = '<g class="bud-fx bud-zz" fill="none" stroke="#6D5BD0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path class="bud-z1" d="M80 28h6l-6 7h6"/><path class="bud-z2" d="M88 16h7.5l-7.5 8.5h7.5"/><path class="bud-z3" d="M96 2h9l-9 10h9"/></g>' +
    '<g class="bud-fx bud-hearts"><path class="bud-h1" d="M86 30c-3-3-7 1-3 5l3 3 3-3c4-4 0-8-3-5z" fill="#F43F5E"/><path class="bud-h2" d="M12 24c-2.4-2.4-5.6.8-2.4 4l2.4 2.4 2.4-2.4c3.2-3.2 0-6.4-2.4-4z" fill="#FB7185"/><path class="bud-h3" d="M94 12c-2-2-4.6.6-2 3.2l2 2 2-2c2.6-2.6 0-5.2-2-3.2z" fill="#F43F5E"/></g>' +
    '<g class="bud-fx bud-notes" fill="#6D5BD0"><g class="bud-n1"><ellipse cx="84" cy="30" rx="3" ry="2.3"/><path d="M86.8 30V17.6l5 2" stroke="#6D5BD0" stroke-width="1.6" fill="none"/></g><g class="bud-n2"><ellipse cx="14" cy="22" rx="2.6" ry="2"/><path d="M16.4 22V11.6" stroke="#6D5BD0" stroke-width="1.5"/></g></g>' +
    '<g class="bud-fx bud-sparks" fill="#FACC15"><path class="bud-s1" d="M12 16l1.5 3.6 3.6 1.5-3.6 1.5-1.5 3.6-1.5-3.6-3.6-1.5 3.6-1.5z"/><path class="bud-s2" d="M90 10l1.3 3 3 1.3-3 1.3-1.3 3-1.3-3-3-1.3 3-1.3z"/><path class="bud-s3" d="M95 46l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z"/><path class="bud-s4" d="M5 50l1.1 2.6 2.6 1.1-2.6 1.1-1.1 2.6-1.1-2.6-2.6-1.1 2.6-1.1z"/></g>' +
    '<g class="bud-fx bud-sweat"><path d="M80 42c0 0-3.6 4.2-3.6 6.6a3.6 3.6 0 0 0 7.2 0c0-2.4-3.6-6.6-3.6-6.6z" fill="#7DD3FC" stroke="#0284C7" stroke-width="1"/></g>' +
    '<g class="bud-fx bud-ask"><text x="88" y="24" font-family="system-ui, sans-serif" font-size="20" font-weight="800" fill="#6D5BD0">?</text></g>' +
    '<g class="bud-fx bud-idea"><circle cx="50" cy="-6" r="6.6" fill="#FDE047" stroke="#CA8A04" stroke-width="1.2"/><rect x="47" y="0" width="6" height="3.6" rx="1" fill="#A1A1AA"/><path d="M50-18v-4M38-12l-3-3M62-12l3-3" stroke="#FACC15" stroke-width="1.8" stroke-linecap="round"/></g>';

  /* ---------- skins: each one draws some parts its own way, and brings its own colors, effects and moves ---------- */
  var BUD_SKINS = {};

  /* ---------- the whole character ---------- */
  /* look: { c, h, s, g, t, r } (see the top); o: { still, face, mouth, cls } */
  function budSVG(look, o) {
    o = o || {}; look = look || {};
    var S = BUD_SKINS[look.s] || {}, u = 'bd' + (++BUD_SID) + '-', P = budPal(look), g = look.g === 'g';
    if (S.pal) { P = S.pal(P, look, g); }
    var face = o.face || S.eyes || 'open', mouth = o.mouth || S.mouth || 'smile';
    var hk = S.hat === false || !look.h || !BUD_HATS[look.h] ? '' : look.h, q = { still: o.still, covered: !!S.covers || hk === 'grad' || hk === 'beanie' || hk === 'cap', noclip: S.clip === false };
    function part(k) { return S[k] ? S[k](P, u, g, q) : BUD_PART[k](P, u, g, q); }
    function arm(side) { return '<g class="bud-arm bud-arm-' + (side < 0 ? 'l' : 'r') + '">' + (S.arm ? S.arm(P, side, u, g) : BUD_PART.arm(P, side)) + '</g>'; }
    function faces() { var ks = o.still ? [face] : Object.keys(BUD_FACES); return ks.map(function (k) { return '<g class="bud-f bud-f-' + k + '">' + BUD_FACES[k](P, u, g) + '</g>'; }).join(''); }
    function mouths() { var ks = o.still ? [mouth] : Object.keys(BUD_MOUTHS); return ks.map(function (k) { return '<g class="bud-m bud-m-' + k + '">' + BUD_MOUTHS[k](P) + '</g>'; }).join(''); }
    var cls = 'bud bud-' + (g ? 'g' : 'b') + (BUD_SKINS[look.s] ? ' bud-sk-' + look.s : '') + (hk ? ' bud-hatted bud-hat-' + hk : '') + (o.still ? ' bud-still' : '') + (o.cls ? ' ' + o.cls : '');
    return '<svg class="' + cls + '" viewBox="0 0 100 120" preserveAspectRatio="xMidYMax meet" data-face="' + face + '" data-mouth="' + mouth + '" aria-hidden="true" focusable="false">' +
      '<defs>' + BUD_PART.defs(P, u, g) + (S.defs ? S.defs(P, u, g) : '') + '</defs>' +
      (S.aura ? '<g class="bud-aura">' + S.aura(P, u, g, q) + '</g>' : '') +
      '<ellipse class="bud-shadow" cx="50" cy="115.2" rx="18.5" ry="3.1" fill="rgba(0,0,0,.2)"/>' +
      '<g class="bud-all">' + (S.back ? '<g class="bud-back">' + S.back(P, u, g, q) + '</g>' : '') +
      '<g class="bud-hb">' + part('hairBack') + '</g>' +
      part('legs') + '<g class="bud-body">' + part('torso') + '</g>' + arm(-1) + arm(1) +
      '<g class="bud-head">' + part('ears') + part('face') + part('cheeks') + '<g class="bud-mouths">' + mouths() + '</g>' + '<g class="bud-hair">' + part('hair') + '</g>' +
        (S.top ? '<g class="bud-top">' + S.top(P, u, g, q) + '</g>' : '') + (hk ? '<g class="bud-hat">' + BUD_HATS[hk](P) + '</g>' : '') + '<g class="bud-faces">' + faces() + '</g>' + (S.over ? S.over(P, u, g, q) : '') + '</g>' +
      (S.front ? '<g class="bud-front">' + S.front(P, u, g, q) + '</g>' : '') + (o.still ? '' : budPoses(P) + BUD_FX + (S.fx ? S.fx(P, u, g) : '')) +
      '</g>' + (S.fore ? '<g class="bud-fore">' + S.fore(P, u, g, q) + '</g>' : '') + '</svg>';
  }

  /* ---------- what the skins' effects are made of ---------- */
  /* a fixed "random" number for k, so a drawing is the same every time */
  function budR(k) { var x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  /* n particles in a box [x0, x1, y0, y1]: each rises (--dy) and drifts (--dx) at its own speed (--d), from its own start (--dl) */
  function budParts(n, box, draw, o) {
    o = o || {}; var h = '', i, s = o.seed || 0;
    for (i = 0; i < n; i++) {
      var a = budR(i + s), b = budR(i + 50 + s), c = budR(i + 99 + s), x = box[0] + (box[1] - box[0]) * a, y = box[2] + (box[3] - box[2]) * b, d = (o.d || 3) * (0.7 + c * 0.6);
      h += '<g class="bud-pt" style="--d:' + budN(d) + 's;--dl:-' + budN(d * b) + 's;--dx:' + budN((c - 0.5) * (o.dx || 8)) + 'px;--dy:' + budN(-(o.dy || 26) * (0.7 + a * 0.6)) + 'px">' + draw(x, y, i, c) + '</g>';
    }
    return h;
  }
  function budStar4(x, y, r, fill, k) {
    k = k || 0.2;
    return '<path d="M' + budP(x, y - r) + 'Q' + budP(x + r * k, y - r * k) + ' ' + budP(x + r, y) + 'Q' + budP(x + r * k, y + r * k) + ' ' + budP(x, y + r) + 'Q' + budP(x - r * k, y + r * k) + ' ' + budP(x - r, y) + 'Q' + budP(x - r * k, y - r * k) + ' ' + budP(x, y - r) + 'Z" fill="' + fill + '"/>';
  }
  /* stars that twinkle where they are: [x, y, size] */
  function budTwinkles(list, fill, seed) { return list.map(function (s, i) { return '<g class="bud-tw" style="--d:' + budN(1.6 + budR(i + (seed || 0) + 7) * 2) + 's;--dl:-' + budN(budR(i + (seed || 0) + 3) * 2.4) + 's">' + budStar4(s[0], s[1], s[2], fill) + '</g>'; }).join(''); }
  /* n marks around a circle; mark(angle in degrees, x, y, i) draws one */
  function budRing(cx, cy, r, n, mark) { var h = '', i; for (i = 0; i < n; i++) { var a = i * 360 / n, t = a * Math.PI / 180; h += mark(a, cx + r * Math.cos(t), cy + r * Math.sin(t), i); } return h; }
  /* n wedges of light from (cx, cy), from r0 out to r1 (every other one out to r1 * alt) */
  function budRays(cx, cy, r0, r1, n, w, alt) {
    var d = '', i;
    for (i = 0; i < n; i++) {
      var a = i * 360 / n, R = alt && i % 2 ? r1 * alt : r1, a1 = (a - w / 2) * Math.PI / 180, a2 = (a + w / 2) * Math.PI / 180, am = a * Math.PI / 180;
      d += 'M' + budP(cx + r0 * Math.cos(am), cy + r0 * Math.sin(am)) + 'L' + budP(cx + R * Math.cos(a1), cy + R * Math.sin(a1)) + 'L' + budP(cx + R * Math.cos(a2), cy + R * Math.sin(a2)) + 'Z';
    }
    return d;
  }
  /* a flame, its base at (x, y), h tall and w wide */
  function budFlame(x, y, w, h) {
    return 'M' + budP(x, y - h) + 'C' + budP(x + w * 0.3, y - h * 0.62) + ' ' + budP(x + w * 0.62, y - h * 0.42) + ' ' + budP(x + w * 0.5, y - h * 0.14) + 'C' + budP(x + w * 0.42, y + h * 0.1) + ' ' + budP(x - w * 0.42, y + h * 0.1) + ' ' + budP(x - w * 0.5, y - h * 0.14) +
      'C' + budP(x - w * 0.62, y - h * 0.42) + ' ' + budP(x - w * 0.12, y - h * 0.56) + ' ' + budP(x, y - h) + 'Z';
  }
  /* the hood a few skins wear: the top and sides of the head, open round the face */
  var BUD_HOOD = 'M15.4 62C12.4 34 27 9 50 9C73 9 87.6 34 84.6 62C81.6 50.4 75.4 42.4 67.4 39.6C57.6 36.2 42.4 36.2 32.6 39.6C24.6 42.4 18.4 50.4 15.4 62Z';
  var BUD_HOODIN = 'M18.6 58C21.6 49.6 26.6 43.2 33.4 40.8C43 37.6 57 37.6 66.6 40.8C73.4 43.2 78.4 49.6 81.4 58';
  /* the body shape most outfits share */
  var BUD_TORSO = 'M34.4 80.4C35.2 77 40.2 75.6 50 75.6C59.8 75.6 64.8 77 65.6 80.4L68.2 97.8C68.6 100.6 66.8 102.2 64 102.2H36C33.2 102.2 31.4 100.6 31.8 97.8Z';
  function budLimb(x1, y1, x2, y2, w, fill, line) { return '<path d="M' + budP(x1, y1) + 'L' + budP(x2, y2) + '" stroke="' + line + '" stroke-width="' + budN(w + 2.4) + '" stroke-linecap="round"/><path d="M' + budP(x1, y1) + 'L' + budP(x2, y2) + '" stroke="' + fill + '" stroke-width="' + w + '" stroke-linecap="round"/>'; }

  /* ---------- Sleepyhead (Common): pajamas with moons and stars, a long nightcap, a glow of moonlight and Zs ---------- */
  BUD_SKINS.pjs = {
    eyes: 'sleepy', mouth: 'smile', hat: false, covers: true,
    pal: function (P) {
      P.pj = budMix(P.c, '#1E1B4B', 0.42); P.pj2 = budMix(P.pj, '#0B0820', 0.32); P.pj3 = budMix(P.pj, '#FFFFFF', 0.22); P.pjl = budMix(P.pj, '#0B0820', 0.62);
      P.arm = P.pj; P.armline = P.pjl; P.cuff = '#F1F5F9'; P.pants = P.pj; return P;
    },
    defs: function (P, u) {
      return '<pattern id="' + u + 'pp" patternUnits="userSpaceOnUse" width="11" height="11"><rect width="11" height="11" fill="' + P.pj + '"/>' + budStar4(3, 3, 1.5, '#FDE68A', 0.25) +
        '<path d="M8.6 6.6a2.2 2.2 0 1 0 1.8 3.4a1.7 1.7 0 1 1 -1.8 -3.4z" fill="#F8FAFC" opacity=".9"/><circle cx="8.4" cy="1.6" r=".5" fill="#F8FAFC" opacity=".7"/><circle cx="1.6" cy="8.6" r=".45" fill="#FDE68A" opacity=".8"/></pattern>' +
        '<radialGradient id="' + u + 'mg"><stop offset="0" stop-color="#C7D2FE" stop-opacity=".75"/><stop offset=".55" stop-color="#A5B4FC" stop-opacity=".25"/><stop offset="1" stop-color="#A5B4FC" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="' + u + 'nc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + P.pj3 + '"/><stop offset="1" stop-color="' + P.pj2 + '"/></linearGradient>';
    },
    aura: function (P, u) {
      return '<circle class="bud-c bud-moonglow" cx="50" cy="56" r="56" fill="url(#' + u + 'mg)"/>' +
        '<g class="bud-moon"><circle cx="13" cy="16" r="12" fill="#FEF3C7" opacity=".25"/><path d="M13.6 6.2A9.6 9.6 0 1 0 22.6 19.6A7.6 7.6 0 1 1 13.6 6.2Z" fill="#FDE68A" stroke="#D9A521" stroke-width=".9"/><circle cx="11" cy="17" r="1.2" fill="#F6C94C" opacity=".7"/><circle cx="14.4" cy="21.6" r=".8" fill="#F6C94C" opacity=".7"/></g>' +
        budTwinkles([[6, 42, 2.2], [92, 26, 2.6], [96, 66, 1.8], [4, 84, 2], [86, 6, 1.6]], '#FDE68A', 1);
    },
    torso: function (P, u) {
      return '<path d="' + BUD_TORSO + '" fill="url(#' + u + 'pp)" stroke="' + P.pjl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M34.4 80.4C33.6 86 32.6 92 31.8 97.8C31.6 99.6 32.2 100.8 33.4 101.6C34.8 94 35.4 86 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.pj2 + '" opacity=".45"/>' +
        '<path d="M39 77.2L50 86.6L61 77.2" fill="none" stroke="#F1F5F9" stroke-width="2.2" stroke-linejoin="round"/><path d="M50 86.6V101.6" stroke="#F1F5F9" stroke-width="1.4"/>' +
        '<circle cx="52.6" cy="90.6" r="1.25" fill="#F1F5F9" stroke="' + P.pjl + '" stroke-width=".5"/><circle cx="52.6" cy="96.4" r="1.25" fill="#F1F5F9" stroke="' + P.pjl + '" stroke-width=".5"/>' +
        '<rect x="37.6" y="88.4" width="7.6" height="6.6" rx="1.4" fill="' + P.pj3 + '" stroke="#F1F5F9" stroke-width=".9"/><path d="M41.6 89.8a1.6 1.6 0 1 0 1.3 2.4a1.2 1.2 0 1 1 -1.3 -2.4z" fill="#FDE68A"/>';
    },
    legs: function (P) {
      function leg(x, side) {
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 99.4, x, 106.2, 7.2, P.pj3, P.pjl) +
          '<ellipse cx="' + x + '" cy="110.8" rx="7.4" ry="4.4" fill="#E2E8F0" stroke="#64748B" stroke-width="1.1"/><ellipse cx="' + x + '" cy="109.2" rx="5.4" ry="2.4" fill="#F8FAFC"/>' +
          '<circle cx="' + budN(x - 2.4) + '" cy="107.2" r="1.8" fill="#F8FAFC" stroke="#94A3B8" stroke-width=".7"/><circle cx="' + budN(x + 2.4) + '" cy="107.2" r="1.8" fill="#F8FAFC" stroke="#94A3B8" stroke-width=".7"/>' +
          '<circle cx="' + budN(x - 1.4) + '" cy="110.4" r=".7" fill="#334155"/><circle cx="' + budN(x + 1.4) + '" cy="110.4" r=".7" fill="#334155"/></g>';
      }
      return leg(45, 'l') + leg(55, 'r');
    },
    top: function (P, u) {
      return '<path d="M19.2 36C17.6 17.4 32 5.2 50 5.2C62.4 5.2 71.6 9.2 77.6 15.6C84.6 23 90.4 33 91.4 45.2C91.6 49.4 89.6 51.2 88 49.6C86.4 40.4 82 32.6 77 29Z" fill="url(#' + u + 'nc)" stroke="' + P.pjl + '" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M70 10.6C74 14 78 19 80.4 24.6M80.6 17.4C84 21.6 87 27.4 88.6 33.6M30 12C40 8.4 54 8 66 11" fill="none" stroke="#F1F5F9" stroke-width="2.6" opacity=".55" stroke-linecap="round"/>' +
        '<g class="bud-pom"><circle cx="89.4" cy="50.4" r="5.2" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1"/><circle cx="88" cy="48.8" r="2" fill="#FFFFFF"/></g>' +
        '<path d="M16.4 38.6C16.6 31.4 22 27.6 30.4 26.6C43.4 25 56.6 25 69.6 26.6C78 27.6 83.4 31.4 83.6 38.6C77.4 35.4 64.6 33.8 50 33.8C35.4 33.8 22.6 35.4 16.4 38.6Z" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1"/>' +
        '<path d="M22 32.4q2-1.6 4 0t4 0t4 0t4 0t4 0t4 0t4 0t4 0t4 0t4 0t4 0t4 0t4 0" fill="none" stroke="#CBD5E1" stroke-width=".9"/>' +
        budLocks(P, u, [[20.4, 38.4, 13, 45.6, 6, 2], [79.4, 37.4, 85.4, 43.6, 6, -2]]);
    },
    fore: function () {
      return '<g class="bud-zzi" fill="none" stroke="#818CF8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path class="bud-zi1" d="M80 2h3.6l-3.6 4.2h3.6"/><path class="bud-zi2" d="M86.6 -6h4.4l-4.4 5h4.4"/><path class="bud-zi3" d="M94 -15h5.4l-5.4 6.2h5.4"/></g>';
    }
  };

  /* ---------- Ghostie (Rare): a hooded spirit cloak that trails into a wisp, with ghost-fire friends floating round ---------- */
  BUD_SKINS.ghost = {
    eyes: 'open', mouth: 'cat', hat: false, covers: true,
    pal: function (P) {
      P.gh = '#F6F8FF'; P.gh2 = budMix(P.c, '#C7D2FE', 0.6); P.gh3 = budMix(P.c, '#8B9AE0', 0.5); P.ghl = budMix(P.c, '#3F4370', 0.55); P.glow = budMix(P.c, '#67E8F9', 0.55); P.glow2 = budMix(P.glow, '#FFFFFF', 0.6);
      P.arm = P.gh; P.armline = P.ghl; P.cuff = P.gh2; return P;
    },
    defs: function (P, u) {
      return '<linearGradient id="' + u + 'gc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.gh + '"/><stop offset=".6" stop-color="' + budMix(P.gh, P.gh2, 0.6) + '"/><stop offset="1" stop-color="' + P.gh2 + '" stop-opacity=".35"/></linearGradient>' +
        '<radialGradient id="' + u + 'ga"><stop offset="0" stop-color="' + P.glow + '" stop-opacity=".55"/><stop offset=".6" stop-color="' + P.glow + '" stop-opacity=".16"/><stop offset="1" stop-color="' + P.glow + '" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + u + 'gw" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="' + P.glow2 + '"/><stop offset="1" stop-color="' + P.glow + '"/></radialGradient>' +
        '<linearGradient id="' + u + 'gh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="' + P.gh2 + '"/></linearGradient>';
    },
    aura: function (P, u) {
      function wisp(x, y, k, cls) {
        return '<g class="bud-wisp ' + cls + '"><g transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><circle r="9" fill="' + P.glow + '" opacity=".22"/><path d="' + budFlame(0, 5, 9, 15) + '" fill="url(#' + u + 'gw)" stroke="' + P.glow + '" stroke-width=".6"/>' +
          '<circle cx="-1.8" cy="-.4" r=".95" fill="#1E1B3A"/><circle cx="1.8" cy="-.4" r=".95" fill="#1E1B3A"/><path d="M-1 1.8q1 .9 2 0" fill="none" stroke="#1E1B3A" stroke-width=".55" stroke-linecap="round"/></g></g>';
      }
      return '<circle class="bud-c bud-gglow" cx="50" cy="66" r="56" fill="url(#' + u + 'ga)"/><ellipse class="bud-c bud-mist" cx="50" cy="112" rx="34" ry="7" fill="' + P.glow + '" opacity=".28"/>' +
        wisp(10, 52, 1, 'bud-w1') + wisp(90, 40, 0.86, 'bud-w2') + wisp(86, 96, 0.72, 'bud-w3') +
        budParts(9, [24, 76, 96, 112], function (x, y, i, c) { return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(0.6 + c * 0.9) + '" fill="' + (i % 2 ? '#FFFFFF' : P.glow2) + '"/>'; }, { d: 3.4, dy: 34, dx: 10, seed: 3 });
    },
    legs: function () { return ''; },
    torso: function (P, u) {
      return '<g class="bud-cloak"><path d="M35 77.4C29.4 85 25.4 95 23.6 104.6L27.8 101.6L31 107.6L35.4 102.4L39.6 108.4L44 102.8L48.4 108.2C52.4 112.4 59.4 114 65.6 112.6C71.6 111.2 75.6 107.4 77 102.8C78 99.2 75 96.6 72.4 98.8C72.8 92 70.4 84.4 65 77.4C60 75.4 40 75.4 35 77.4Z" fill="url(#' + u + 'gc)" stroke="' + P.ghl + '" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M40 80C38 88 37 96 37.6 103M50 79.6V105M60 80C62 87 63.4 94 63 100" fill="none" stroke="' + P.gh3 + '" stroke-width="1" opacity=".5" stroke-linecap="round"/>' +
        '<path d="M66 108.6C70 108 73 105.6 74.2 102.4" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".8" stroke-linecap="round"/></g>' +
        '<path d="M39.6 77.4Q50 84 60.4 77.4" fill="none" stroke="' + P.gh3 + '" stroke-width="1.6" opacity=".7"/><circle cx="50" cy="82.6" r="2.2" fill="' + P.glow + '" stroke="' + P.ghl + '" stroke-width=".7"/><circle cx="49.4" cy="82" r=".7" fill="#FFFFFF"/>';
    },
    arm: function (P, side) {
      var m = side < 0 ? -1 : 1, x = 50 + m * 13;
      return '<path d="M' + budP(x, 78.6) + 'C' + budP(x + m * 6, 81) + ' ' + budP(x + m * 10, 88) + ' ' + budP(x + m * 12.4, 96.4) + 'L' + budP(x + m * 9.6, 95) + 'L' + budP(x + m * 9, 99) + 'L' + budP(x + m * 6.4, 96) + 'L' + budP(x + m * 4.6, 98.6) + 'C' + budP(x + m * 4, 92) + ' ' + budP(x + m * 2.4, 86) + ' ' + budP(x - m * 1, 82) + 'Z" fill="' + P.gh + '" stroke="' + P.ghl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<circle cx="' + budN(x + m * 7.6) + '" cy="95.4" r="3.4" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1"/>';
    },
    top: function (P, u) {
      return '<path d="' + BUD_HOOD + '" fill="url(#' + u + 'gh)" stroke="' + P.ghl + '" stroke-width="1.2"/>' +
        '<path d="M60 10.4C68 6 76 6 82 2C80 8.4 77.4 13 72.4 15.4" fill="' + P.gh + '" stroke="' + P.ghl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<path d="' + BUD_HOODIN + '" fill="none" stroke="' + P.gh3 + '" stroke-width="2.6" opacity=".55"/><path d="M26 22C30 15 38 11 46 10.4" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>';
    }
  };

  /* ---------- Robo (Epic): a mech suit with a visor helmet, a glowing core, jet boots and a hologram round it ---------- */
  BUD_SKINS.robo = {
    eyes: 'open', mouth: 'smile', hat: false, covers: true,
    pal: function (P) {
      P.ar = '#F1F4F9'; P.ar2 = '#B9C3D6'; P.arl = '#364056'; P.suit = '#283149'; P.suitl = '#151B2B'; P.glow = budMix(P.c, '#22D3EE', 0.35); P.glow2 = budMix(P.glow, '#FFFFFF', 0.6);
      P.arm = P.suit; P.armline = P.suitl; P.cuff = P.ar; P.hand = '#3A4560'; P.handline = P.suitl; P.pants = P.suit; return P;
    },
    defs: function (P, u) {
      return '<linearGradient id="' + u + 'rh" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="' + P.ar + '"/><stop offset="1" stop-color="' + P.ar2 + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'rv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + budMix(P.glow, '#0B1220', 0.55) + '"/><stop offset="1" stop-color="' + budMix(P.glow, '#0B1220', 0.85) + '"/></linearGradient>' +
        '<radialGradient id="' + u + 'rc"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="' + P.glow2 + '"/><stop offset="1" stop-color="' + P.glow + '"/></radialGradient>' +
        '<radialGradient id="' + u + 'rg"><stop offset="0" stop-color="' + P.glow + '" stop-opacity=".35"/><stop offset="1" stop-color="' + P.glow + '" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="' + u + 'rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="' + P.glow2 + '"/><stop offset="1" stop-color="' + P.glow + '" stop-opacity="0"/></linearGradient>' +
        '<clipPath id="' + u + 'ru"><rect x="-20" y="-20" width="140" height="106"/></clipPath><clipPath id="' + u + 'rd"><rect x="-20" y="86" width="140" height="60"/></clipPath>';
    },
    aura: function (P, u) {
      var ticks = budRing(0, 0, 42, 48, function (a, x, y, i) { var k = i % 4 ? 0.93 : 0.86; return '<path d="M' + budP(x, y) + 'L' + budP(x * k, y * k) + '"/>'; });
      return '<circle cx="50" cy="62" r="54" fill="url(#' + u + 'rg)"/>' +
        '<g class="bud-c bud-hud1"><circle cx="50" cy="58" r="47" fill="none" stroke="' + P.glow + '" stroke-width=".8" stroke-dasharray="14 4 2 4" opacity=".75"/>' +
        budRing(50, 58, 47, 4, function (a, x, y) { return '<path d="M' + budP(x, y) + 'm-2.4 -2.4h4.8v4.8h-4.8z" fill="none" stroke="' + P.glow2 + '" stroke-width=".8" transform="rotate(' + a + ' ' + budP(x, y) + ')"/>'; }) + '</g>' +
        '<g class="bud-c bud-hud2"><circle cx="50" cy="58" r="39" fill="none" stroke="' + P.glow + '" stroke-width="2.4" stroke-dasharray="1 5" opacity=".55"/></g>' +
        '<g clip-path="url(#' + u + 'ru)"><g transform="translate(50 86) scale(1 .3)"><g class="bud-c bud-hud3" stroke="' + P.glow + '" stroke-width="1.6" opacity=".9"><circle r="42" fill="none"/>' + ticks + '</g></g></g>' +
        budRing(50, 58, 54, 6, function (a, x, y, i) { return '<path class="bud-hex" style="--dl:-' + budN(i * 0.5) + 's" d="M' + budP(x, y - 3.4) + 'l2.9 1.7v3.4l-2.9 1.7l-2.9 -1.7v-3.4z" fill="' + P.glow + '" fill-opacity=".14" stroke="' + P.glow + '" stroke-width=".6"/>'; }) +
        budParts(10, [10, 90, 70, 110], function (x, y, i) { return i % 3 ? '<rect x="' + budN(x) + '" y="' + budN(y) + '" width="1.8" height="1.8" fill="' + P.glow2 + '"/>' : '<path d="M' + budP(x, y) + 'h3M' + budP(x + 1.5, y - 1.5) + 'v3" stroke="' + P.glow2 + '" stroke-width=".7"/>'; }, { d: 2.6, dy: 40, dx: 4, seed: 11 });
    },
    hairBack: function (P, u, g) {
      if (!g) { return ''; }
      return '<g class="bud-pony">' + budLocks(P, u, [[66, 26, 88, 86, 12, -6], [64, 30, 82, 92, 8, -4]], { fill: 'url(#' + u + 'hl)' }) + '<rect x="62" y="22.4" width="8" height="5" rx="2" fill="' + P.glow + '" stroke="' + P.arl + '" stroke-width=".8" transform="rotate(40 66 25)"/></g>';
    },
    legs: function (P, u) {
      function leg(x, side) {
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 99.2, x, 104.6, 7, P.suit, P.suitl) +
          '<path d="M' + budP(x - 6.4, 112) + 'V106.4C' + budP(x - 6.4, 104) + ' ' + budP(x - 4, 103) + ' ' + budP(x, 103) + 'C' + budP(x + 4, 103) + ' ' + budP(x + 6.4, 104) + ' ' + budP(x + 6.4, 106.4) + 'V112Z" fill="url(#' + u + 'rh)" stroke="' + P.arl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
          '<path d="M' + budP(x - 6, 108.4) + 'H' + budN(x + 6) + '" stroke="' + P.glow + '" stroke-width="1.3"/><path d="M' + budP(x - 4.6, 112) + 'L' + budP(x - 3.4, 114.4) + 'H' + budN(x + 3.4) + 'L' + budP(x + 4.6, 112) + 'Z" fill="#596482" stroke="' + P.arl + '" stroke-width=".9"/>' +
          '<path class="bud-jet" d="M' + budP(x - 3, 114.6) + 'Q' + budP(x, 126) + ' ' + budP(x + 3, 114.6) + 'Z" fill="url(#' + u + 'rf)"/></g>';
      }
      return leg(45, 'l') + leg(55, 'r');
    },
    torso: function (P, u) {
      return '<path d="' + BUD_TORSO + '" fill="' + P.suit + '" stroke="' + P.suitl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M36.4 80.6C37 77.6 41 76.6 50 76.6C59 76.6 63 77.6 63.6 80.6L62.4 92.4C58.4 95.4 41.6 95.4 37.6 92.4Z" fill="url(#' + u + 'rh)" stroke="' + P.arl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<path d="M41 84.6H44M56 84.6H59M42 88.6H44M56 88.6H58" stroke="' + P.ar2 + '" stroke-width="1" stroke-linecap="round"/>' +
        '<circle cx="50" cy="86" r="6.4" fill="#2A3350" stroke="' + P.arl + '" stroke-width="1"/><circle class="bud-c bud-core" cx="50" cy="86" r="4.6" fill="url(#' + u + 'rc)"/><g class="bud-c bud-corering"><circle cx="50" cy="86" r="5.6" fill="none" stroke="' + P.glow2 + '" stroke-width=".8" stroke-dasharray="3 2"/></g>' +
        '<rect x="35.6" y="96" width="28.8" height="4.6" rx="1.6" fill="#1D2438" stroke="' + P.suitl + '" stroke-width=".9"/><circle class="bud-led1" cx="44" cy="98.3" r="1.1" fill="' + P.glow + '"/><circle class="bud-led2" cx="50" cy="98.3" r="1.1" fill="#FACC15"/><circle class="bud-led3" cx="56" cy="98.3" r="1.1" fill="#F472B6"/>';
    },
    arm: function (P, side) {
      var m = side < 0 ? -1 : 1, sx = 50 + m * 12.8, ex = 50 + m * 18.4, hx = 50 + m * 19;
      return budLimb(sx, 80.6, ex, 92.4, 7, P.suit, P.suitl) +
        '<path d="M' + budP(ex - m * 0.6, 88.4) + 'l' + budN(m * 4.2) + ' 1.6l' + budN(-m * 1) + ' 5.6l' + budN(-m * 5) + ' -1.2z" fill="' + P.ar + '" stroke="' + P.arl + '" stroke-width="1" stroke-linejoin="round"/><path d="M' + budP(ex + m * 0.4, 91.6) + 'l' + budN(m * 2.6) + ' .9" stroke="' + P.glow + '" stroke-width="1.2" stroke-linecap="round"/>' +
        '<circle cx="' + budN(hx) + '" cy="96" r="3.9" fill="' + P.hand + '" stroke="' + P.handline + '" stroke-width="1.1"/>' +
        '<ellipse cx="' + budN(sx + m * 0.6) + '" cy="79.4" rx="6.2" ry="5" fill="' + P.ar + '" stroke="' + P.arl + '" stroke-width="1.1"/><path d="M' + budP(sx - m * 2.6, 77.4) + 'Q' + budP(sx + m * 1, 75.6) + ' ' + budP(sx + m * 4.6, 78)  + '" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>';
    },
    top: function (P, u) {
      return '<path d="M16.8 57C13.8 29 29.6 9.4 50 9.4C70.4 9.4 86.2 29 83.2 57C80.2 48.8 75 42.6 67.8 40C57.8 36.6 42.2 36.6 32.2 40C25 42.6 19.8 48.8 16.8 57Z" fill="url(#' + u + 'rh)" stroke="' + P.arl + '" stroke-width="1.2"/>' +
        '<path d="M50 9.6V20" stroke="' + P.ar2 + '" stroke-width="1.2"/><path d="M24 22C30 14 40 10.6 50 10.4" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M22.6 37.4C26 26 37 20.6 50 20.6C63 20.6 74 26 77.4 37.4C70 33.4 61 32 50 32C39 32 30 33.4 22.6 37.4Z" fill="url(#' + u + 'rv)" stroke="' + P.arl + '" stroke-width="1.1"/>' +
        '<path d="M28 31.6C34 26.6 42 24.6 50 24.4" fill="none" stroke="' + P.glow2 + '" stroke-width="1.1" opacity=".8" stroke-linecap="round"/><path class="bud-vis" d="M36 29.6H64" stroke="' + P.glow + '" stroke-width=".8" stroke-dasharray="2 1.4" opacity=".9"/>' +
        '<circle cx="15.6" cy="52" r="6.8" fill="url(#' + u + 'rh)" stroke="' + P.arl + '" stroke-width="1.1"/><circle class="bud-ear" cx="15.6" cy="52" r="3.6" fill="none" stroke="' + P.glow + '" stroke-width="1.4"/><circle cx="15.6" cy="52" r="1.3" fill="' + P.glow2 + '"/>' +
        '<circle cx="84.4" cy="52" r="6.8" fill="url(#' + u + 'rh)" stroke="' + P.arl + '" stroke-width="1.1"/><circle class="bud-ear" cx="84.4" cy="52" r="3.6" fill="none" stroke="' + P.glow + '" stroke-width="1.4"/><circle cx="84.4" cy="52" r="1.3" fill="' + P.glow2 + '"/>' +
        '<path d="M86 46L92 26" stroke="' + P.arl + '" stroke-width="1.4" stroke-linecap="round"/><circle class="bud-bulb" cx="92.4" cy="24.4" r="2.4" fill="' + P.glow + '" stroke="' + P.arl + '" stroke-width=".8"/>';
    },
    fore: function (P, u) {
      var ticks = budRing(0, 0, 42, 48, function (a, x, y, i) { var k = i % 4 ? 0.93 : 0.86; return '<path d="M' + budP(x, y) + 'L' + budP(x * k, y * k) + '"/>'; });
      return '<g clip-path="url(#' + u + 'rd)"><g transform="translate(50 86) scale(1 .3)"><g class="bud-c bud-hud3" stroke="' + P.glow + '" stroke-width="1.6" opacity=".9"><circle r="42" fill="none"/>' + ticks + '</g></g></g>' +
        '<path class="bud-scan" d="M20 40H80" stroke="' + P.glow2 + '" stroke-width="1.6" opacity="0" stroke-linecap="round"/>';
    }
  };

  /* ---------- Dragon (Legendary): a dragon-head hood, scale armor, wings and a tail, in a fire that never goes out ---------- */
  BUD_SKINS.dragon = {
    eyes: 'open', mouth: 'fang', hat: false, covers: true,
    pal: function (P) {
      P.dg = P.c; P.dg2 = budMix(P.c, '#1A0B10', 0.36); P.dg3 = budMix(P.c, '#FFFFFF', 0.32); P.dgl = budMix(P.c, '#1A0B10', 0.66);
      P.bel = '#FBD9A3'; P.bel2 = '#E2A458'; P.horn = '#FAF0D9'; P.horn2 = '#C79A5E';
      P.arm = P.dg; P.armline = P.dgl; P.cuff = P.dg2; P.pants = P.dg2; return P;
    },
    defs: function (P, u) {
      return '<linearGradient id="' + u + 'dh" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="' + P.dg3 + '"/><stop offset=".6" stop-color="' + P.dg + '"/><stop offset="1" stop-color="' + P.dg2 + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'dn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + P.horn + '"/><stop offset="1" stop-color="' + P.horn2 + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'dw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.dg2 + '"/><stop offset="1" stop-color="' + budMix(P.dg2, '#F97316', 0.25) + '"/></linearGradient>' +
        '<radialGradient id="' + u + 'f1" cx=".5" cy=".85" r=".75"><stop offset="0" stop-color="#FDE047"/><stop offset=".35" stop-color="#FB923C"/><stop offset=".75" stop-color="#DC2626" stop-opacity=".8"/><stop offset="1" stop-color="#7F1D1D" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + u + 'f2" cx=".5" cy=".85" r=".7"><stop offset="0" stop-color="#FFFBEB"/><stop offset=".4" stop-color="#FDE047"/><stop offset="1" stop-color="#F97316" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + u + 'fg"><stop offset="0" stop-color="#F97316" stop-opacity=".45"/><stop offset="1" stop-color="#F97316" stop-opacity="0"/></radialGradient>';
    },
    aura: function (P, u) {
      var rune = budRing(0, 0, 30, 12, function (a, x, y, i) { return '<path d="' + budFlame(x, y + 2, 3.4, 6) + '" transform="rotate(' + budN(a + 90) + ' ' + budP(x, y) + ')"/>'; });
      function tongue(x, w, h, r, f, o) { return '<path d="' + budFlame(x, 114, w, h) + '" fill="url(#' + u + f + ')" opacity="' + o + '"' + (r ? ' transform="rotate(' + r + ' ' + x + ' 114)"' : '') + '/>'; }
      return '<circle cx="50" cy="70" r="58" fill="url(#' + u + 'fg)"/>' +
        '<g transform="translate(50 113) scale(1 .3)"><g class="bud-c bud-sig" fill="#FB923C" opacity=".85"><circle r="36" fill="none" stroke="#F97316" stroke-width="1.6"/><circle r="24" fill="none" stroke="#FDBA74" stroke-width="1" stroke-dasharray="3 3"/>' + rune +
        '<path d="M0 -22L19 11H-19Z M0 22L-19 -11H19Z" fill="none" stroke="#FDBA74" stroke-width="1"/></g></g>' +
        '<g class="bud-fl bud-fl1">' + tongue(50, 84, 112, 0, 'f1', 0.8) + tongue(20, 30, 70, -14, 'f1', 0.75) + tongue(80, 30, 70, 14, 'f1', 0.75) + '</g>' +
        '<g class="bud-fl bud-fl2">' + tongue(30, 26, 84, -6, 'f1', 0.7) + tongue(70, 26, 84, 6, 'f1', 0.7) + tongue(50, 56, 90, 0, 'f1', 0.65) + '</g>' +
        '<g class="bud-fl bud-fl3">' + tongue(50, 44, 70, 0, 'f2', 0.8) + tongue(36, 18, 52, -8, 'f2', 0.7) + tongue(64, 18, 52, 8, 'f2', 0.7) + '</g>' +
        budParts(14, [8, 92, 60, 112], function (x, y, i, c) { return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(0.7 + c * 1.1) + '" fill="' + (i % 3 ? '#FDBA74' : '#FEF08A') + '"/><circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(1.6 + c * 1.6) + '" fill="#F97316" opacity=".25"/>'; }, { d: 2.6, dy: 48, dx: 14, seed: 21 });
    },
    back: function (P, u) {
      function wing(m) {
        var x = 50 + m * 12;
        return '<g class="bud-wing bud-wing-' + (m < 0 ? 'l' : 'r') + '"><path d="M' + budP(x, 82) + 'C' + budP(x + m * 10, 72) + ' ' + budP(x + m * 26, 62) + ' ' + budP(x + m * 40, 60) + 'C' + budP(x + m * 36, 66) + ' ' + budP(x + m * 36, 72) + ' ' + budP(x + m * 37, 78) + 'C' + budP(x + m * 32, 76) + ' ' + budP(x + m * 28, 78) + ' ' + budP(x + m * 27, 83) + 'C' + budP(x + m * 22, 80) + ' ' + budP(x + m * 18, 82) + ' ' + budP(x + m * 17, 87) + 'C' + budP(x + m * 12, 85) + ' ' + budP(x + m * 8, 86) + ' ' + budP(x + m * 4, 90) + 'Z" fill="url(#' + u + 'dw)" stroke="' + P.dgl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
          '<path d="M' + budP(x, 82) + 'L' + budP(x + m * 40, 60) + 'M' + budP(x + m * 4, 80) + 'L' + budP(x + m * 37, 78) + 'M' + budP(x + m * 3, 82) + 'L' + budP(x + m * 27, 83) + 'M' + budP(x + m * 2, 84) + 'L' + budP(x + m * 17, 87) + '" stroke="' + P.dgl + '" stroke-width="1.3" stroke-linecap="round"/>' +
          '<path d="M' + budP(x + m * 40, 60) + 'l' + budN(m * 2.6) + ' -2.4" stroke="' + P.horn2 + '" stroke-width="1.6" stroke-linecap="round"/></g>';
      }
      return wing(-1) + wing(1) +
        '<g class="bud-tail"><path d="M58 100C66 104 76 108 84 104C90 101 92 95 90 90L94 92L93 86L88 88C88 94 86 98 82 99C74 101 66 98 60 94Z" fill="' + P.dg + '" stroke="' + P.dgl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<path d="M68 101l1.6 -3.4 1.4 3.6M74 101.6l1.8 -3.4 1.2 3.4M80 100.4l2.2 -3 .8 3.4" fill="' + P.bel2 + '" stroke="' + P.dgl + '" stroke-width=".7"/></g>';
    },
    torso: function (P, u) {
      var sc = '', r, c;
      for (r = 0; r < 3; r++) { for (c = 0; c < 6; c++) { var x = 36.4 + c * 5.4 + (r % 2) * 2.7, y = 80 + r * 4.4; if (x < 64) { sc += 'M' + budP(x - 2.6, y) + 'q2.6 3.4 5.2 0'; } } }
      return '<path d="' + BUD_TORSO + '" fill="url(#' + u + 'dh)" stroke="' + P.dgl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="' + sc + '" fill="none" stroke="' + P.dg2 + '" stroke-width=".8" opacity=".7"/>' +
        '<path d="M43 82.6C44 80 56 80 57 82.6L58.4 98.4H41.6Z" fill="' + P.bel + '" stroke="' + P.bel2 + '" stroke-width="1" stroke-linejoin="round"/><path d="M42.2 86.6H57.8M41.8 90.6H58.2M41.6 94.6H58.4" stroke="' + P.bel2 + '" stroke-width=".9"/>' +
        '<rect x="33" y="96.6" width="34" height="4" rx="1.6" fill="#7C4A1E" stroke="#3B2310" stroke-width=".8"/><path d="M50 95.6l2.6 3-2.6 3-2.6-3z" fill="#EF4444" stroke="#7F1D1D" stroke-width=".7"/>';
    },
    arm: function (P, side) {
      var m = side < 0 ? -1 : 1, sx = 50 + m * 12.8, ex = 50 + m * 18.4, hx = 50 + m * 19;
      return budLimb(sx, 80.6, ex, 92.4, 7.4, P.dg, P.dgl) + '<path d="M' + budP(sx + m * 0.6, 84) + 'q' + budN(m * 2.2) + ' 1.6 ' + budN(m * 2.4) + ' 3.6M' + budP(sx + m * 2.6, 87.6) + 'q' + budN(m * 2) + ' 1.4 ' + budN(m * 2) + ' 3.2" fill="none" stroke="' + P.dg2 + '" stroke-width=".8"/>' +
        '<circle cx="' + budN(hx) + '" cy="96" r="3.9" fill="' + P.dg3 + '" stroke="' + P.dgl + '" stroke-width="1.1"/>' +
        '<path d="M' + budP(hx - 2.4, 98.6) + 'l-.6 2.6 1.6 -1.6M' + budP(hx, 99.6) + 'l0 2.6 1 -2M' + budP(hx + 2.4, 98.6) + 'l.8 2.4 .6 -2.4" fill="' + P.horn + '" stroke="' + P.horn2 + '" stroke-width=".6"/>' +
        '<path d="M' + budP(sx - m * 3, 78.6) + 'C' + budP(sx, 75) + ' ' + budP(sx + m * 5, 76) + ' ' + budP(sx + m * 6.4, 80.6) + 'C' + budP(sx + m * 3, 79.4) + ' ' + budP(sx, 80) + ' ' + budP(sx - m * 3, 78.6) + 'Z" fill="' + P.dg3 + '" stroke="' + P.dgl + '" stroke-width="1"/>';
    },
    legs: function (P) {
      function leg(x, side) {
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 99.4, x, 106.4, 7, P.dg2, P.dgl) +
          '<path d="M' + budP(x - 6, 112.4) + 'C' + budP(x - 6.4, 108) + ' ' + budP(x - 3.6, 106.4) + ' ' + budP(x, 106.4) + 'C' + budP(x + 3.6, 106.4) + ' ' + budP(x + 6.4, 108) + ' ' + budP(x + 6, 112.4) + 'Z" fill="' + P.dg + '" stroke="' + P.dgl + '" stroke-width="1.1"/>' +
          '<path d="M' + budP(x - 5, 112.2) + 'l-1.2 2.4 2.6 -.6M' + budP(x - 1, 112.4) + 'l-.2 2.6 1.6 -1.2M' + budP(x + 3, 112.2) + 'l1 2.4 1.2 -2.2" fill="' + P.horn + '" stroke="' + P.horn2 + '" stroke-width=".6"/></g>';
      }
      return leg(45, 'l') + leg(55, 'r');
    },
    top: function (P, u) {
      var sc = '';
      [[30, 20], [40, 16], [50, 15], [60, 16], [70, 20], [24, 28], [76, 28], [35, 25], [65, 25]].forEach(function (s) { sc += 'M' + budP(s[0] - 3, s[1]) + 'q3 3.6 6 0'; });
      return '<path d="M30 17C25 9 20 3.6 12.6 0.6C17 6.4 20.4 13 22.4 20.6Z" fill="url(#' + u + 'dn)" stroke="' + P.horn2 + '" stroke-width="1" stroke-linejoin="round"/><path d="M70 17C75 9 80 3.6 87.4 0.6C83 6.4 79.6 13 77.6 20.6Z" fill="url(#' + u + 'dn)" stroke="' + P.horn2 + '" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="M22 12.6l3 -1M19.4 9l2.8 -1.4M78 12.6l-3 -1M80.6 9l-2.8 -1.4" stroke="' + P.horn2 + '" stroke-width=".9"/>' +
        '<path d="M14 46C8 40 6 32 7.6 24C11 30 14 34 18.4 36ZM86 46C92 40 94 32 92.4 24C89 30 86 34 81.6 36Z" fill="' + P.dg2 + '" stroke="' + P.dgl + '" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="' + BUD_HOOD + '" fill="url(#' + u + 'dh)" stroke="' + P.dgl + '" stroke-width="1.2"/><path d="' + sc + '" fill="none" stroke="' + P.dg2 + '" stroke-width=".8" opacity=".6"/>' +
        '<path d="M44 9.6l3 -5 3 4.4 3 -4.4 3 5" fill="' + P.bel2 + '" stroke="' + P.dgl + '" stroke-width=".9" stroke-linejoin="round"/>' +
        '<ellipse cx="38" cy="22.6" rx="4" ry="2.8" fill="#FDE047" stroke="' + P.dgl + '" stroke-width="1"/><ellipse cx="62" cy="22.6" rx="4" ry="2.8" fill="#FDE047" stroke="' + P.dgl + '" stroke-width="1"/><path d="M38 20.6v4M62 20.6v4" stroke="#1A0B10" stroke-width="1.3" stroke-linecap="round"/>' +
        '<path d="M33 19.6Q38 17 43 19.8M57 19.8Q62 17 67 19.6" fill="none" stroke="' + P.dgl + '" stroke-width="1.4" stroke-linecap="round"/>' +
        '<path d="M31 39.4L33.4 44.6L36 38.8L38.6 44L41.2 38.2L43.8 43.6L46.4 37.8L49 43.2L51 43.2L53.6 37.8L56.2 43.6L58.8 38.2L61.4 44L64 38.8L66.6 44.6L69 39.4Z" fill="#FFFFFF" stroke="' + P.dgl + '" stroke-width=".8" stroke-linejoin="round"/>' +
        '<path d="M' + 'M18.6 58C21.6 49.6 26.6 43.2 33.4 40.8C43 37.6 57 37.6 66.6 40.8C73.4 43.2 78.4 49.6 81.4 58'.slice(1) + '" fill="none" stroke="' + P.dg2 + '" stroke-width="2.2" opacity=".6"/>';
    },
    fx: function () {
      return '<g class="bud-fx bud-flame"><path d="M58 74C70 70 84 70 98 66C92 74 92 80 98 86C84 84 70 82 58 78Z" fill="#F97316"/><path d="M58 75C68 72 78 72 88 70C84 75 84 79 88 82C78 81 68 80 58 77Z" fill="#FACC15"/><path d="M58 75.6C64 74 70 74 76 73.6C74 75.6 74 77 76 78.4C70 78 64 77.6 58 76.6Z" fill="#FFFBEB"/></g>' +
        '<g class="bud-fx bud-smoke" fill="#94A3B8"><circle cx="72" cy="66" r="3"/><circle cx="78" cy="62" r="2.4"/><circle cx="84" cy="64" r="2"/></g>';
    }
  };

  /* ---------- Starborn (Mythic): a robe and cape of night sky, hair like a galaxy, star rings, constellations that draw
     themselves, and a little planet that orbits in front and behind ---------- */
  BUD_SKINS.cosmo = {
    eyes: 'open', mouth: 'smile', hat: false,
    pal: function (P) {
      P.cv = budMix(P.c, '#0E0B2E', 0.66); P.cv2 = budMix(P.cv, '#04020C', 0.45); P.cv3 = budMix(P.cv, '#FFFFFF', 0.16); P.cvl = budMix(P.cv, '#04020C', 0.7);
      P.gold = '#F7CF5A'; P.gold2 = '#C98A1C'; P.goldl = '#6E430B';
      P.n1 = budMix(P.c, '#A855F7', 0.55); P.n2 = budMix(P.c, '#22D3EE', 0.6); P.n3 = budMix(P.c, '#F472B6', 0.55);
      P.hr = budMix(P.c, '#2E1F6B', 0.62); P.hr2 = '#140C38'; P.hr3 = budMix(P.n2, '#FFFFFF', 0.3); P.hrl = '#0B0624'; P.lid = '#120B2A'; P.brow = '#2A1E5C';
      P.ir1 = '#1B1340'; P.ir2 = budMix(P.c, '#7C3AED', 0.45); P.ir3 = budMix(P.n2, '#FFFFFF', 0.3);
      P.arm = P.cv; P.armline = P.cvl; P.cuff = P.gold; P.pants = P.cv2; return P;
    },
    defs: function (P, u) {
      function dot(x, y, r, c, o) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '" opacity="' + o + '"/>'; }
      function neb(id, c) { return '<radialGradient id="' + u + id + '"><stop offset="0" stop-color="' + c + '" stop-opacity=".6"/><stop offset=".5" stop-color="' + c + '" stop-opacity=".22"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient>'; }
      return '<pattern id="' + u + 'cs" patternUnits="userSpaceOnUse" width="14" height="14"><rect width="14" height="14" fill="' + P.cv + '"/>' + dot(2, 3, 0.55, '#FFFFFF', 0.9) + dot(9.6, 1.6, 0.35, '#FFFFFF', 0.6) +
          dot(6, 9.4, 0.5, P.n2, 0.9) + dot(12.2, 11.6, 0.4, '#FFFFFF', 0.7) + dot(1.4, 12, 0.35, P.n3, 0.9) + budStar4(10.4, 6.2, 1.6, P.gold, 0.22) + '</pattern>' +
        neb('n1', P.n1) + neb('n2', P.n2) + neb('n3', P.n3) +
        '<radialGradient id="' + u + 'cg"><stop offset="0" stop-color="' + P.cv3 + '" stop-opacity=".55"/><stop offset=".7" stop-color="' + P.cv + '" stop-opacity=".2"/><stop offset="1" stop-color="' + P.cv + '" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + u + 'pl" cx=".35" cy=".3"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="' + P.n2 + '"/><stop offset="1" stop-color="' + budMix(P.n2, '#0B0624', 0.6) + '"/></radialGradient>' +
        '<linearGradient id="' + u + 'cp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.n1 + '" stop-opacity="0"/><stop offset="1" stop-color="' + P.n1 + '" stop-opacity=".55"/></linearGradient>' +
        '<linearGradient id="' + u + 'sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>' +
        '<clipPath id="' + u + 'ou"><rect x="-30" y="-30" width="160" height="114"/></clipPath><clipPath id="' + u + 'od"><rect x="-30" y="84" width="160" height="60"/></clipPath>' +
        '<clipPath id="' + u + 'hk"><path d="' + BUD_CAP + '"/></clipPath>';
    },
    aura: function (P, u) {
      var A = '<circle r="46" fill="none" stroke="' + P.gold + '" stroke-width=".9" opacity=".85"/><circle r="42.6" fill="none" stroke="' + P.gold + '" stroke-width=".5" opacity=".6"/>' +
        budRing(0, 0, 44.3, 48, function (a, x, y, i) { return i % 6 === 3 ? '' : '<path d="M' + budP(x * 0.975, y * 0.975) + 'L' + budP(x * 1.025, y * 1.025) + '" stroke="' + P.gold + '" stroke-width=".5" opacity=".8"/>'; }) +
        budRing(0, 0, 44.3, 8, function (a, x, y, i) { return i % 2 ? '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="2" fill="' + P.cv2 + '" stroke="' + P.gold + '" stroke-width=".7"/><circle cx="' + budN(x) + '" cy="' + budN(y) + '" r=".7" fill="' + P.gold + '"/>' : budStar4(x, y, 3.2, P.gold, 0.22); });
      var B = '<circle r="53" fill="none" stroke="' + P.n2 + '" stroke-width=".9" stroke-dasharray="1.4 3.6" opacity=".75"/>' + budRing(0, 0, 53, 4, function (a, x, y) { return budStar4(x, y, 3.6, '#FFFFFF', 0.18); });
      var C = [[[4, 34], [11, 25], [19, 27], [23, 17], [15, 10]], [[78, 6], [86, 13], [93, 8], [97, 21], [89, 28]], [[3, 76], [9, 67], [5, 56], [13, 50]]];
      var stars = [[8, 46, 0.6], [26, 4, 0.5], [70, 2, 0.6], [97, 40, 0.7], [94, 58, 0.5], [2, 96, 0.6], [99, 104, 0.5], [18, 112, 0.5], [84, 116, 0.6], [40, -4, 0.5], [60, -6, 0.6], [100, 82, 0.5]];
      return '<circle class="bud-c bud-cglow" cx="50" cy="58" r="60" fill="url(#' + u + 'cg)"/>' +
        '<ellipse class="bud-c bud-neb1" cx="22" cy="40" rx="30" ry="20" fill="url(#' + u + 'n1)"/><ellipse class="bud-c bud-neb2" cx="80" cy="30" rx="26" ry="18" fill="url(#' + u + 'n2)"/><ellipse class="bud-c bud-neb3" cx="62" cy="86" rx="34" ry="18" fill="url(#' + u + 'n3)"/>' +
        stars.map(function (s, i) { return '<circle class="bud-tw" style="--d:' + budN(1.4 + budR(i + 70) * 2) + 's;--dl:-' + budN(budR(i + 80) * 2) + 's" cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '" fill="#FFFFFF"/>'; }).join('') +
        '<g transform="translate(50 58)"><g class="bud-c bud-ringb">' + B + '</g></g><g transform="translate(50 58)"><g class="bud-c bud-ringa">' + A + '</g></g>' +
        C.map(function (pts, i) {
          return '<g class="bud-con" style="--dl:-' + budN(i * 2.5) + 's"><path d="M' + pts.map(function (p) { return budP(p[0], p[1]); }).join('L') + '" pathLength="1" stroke-dasharray="1" fill="none" stroke="' + P.n2 + '" stroke-width=".7" opacity=".9"/>' +
            pts.map(function (p, j) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2" fill="' + P.n2 + '" opacity=".25"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (j % 2 ? 0.8 : 1.1) + '" fill="#FFFFFF"/>'; }).join('') + '</g>';
        }).join('') +
        '<g class="bud-shoot"><path d="M0 0L18 -7" stroke="url(#' + u + 'sh)" stroke-width="1.3" stroke-linecap="round"/><circle r="1.3" fill="#FFFFFF"/></g>' +
        '<g clip-path="url(#' + u + 'ou)">' + this.orbit(P, u) + '</g>' +
        budParts(12, [12, 88, 64, 112], function (x, y, i, c) { return i % 3 ? '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(0.5 + c * 0.7) + '" fill="' + (i % 2 ? '#FFFFFF' : P.n2) + '"/>' : budStar4(x, y, 1.8, P.gold, 0.22); }, { d: 3.8, dy: 46, dx: 10, seed: 31 });
    },
    /* the planet's path, a ring seen from the side; drawn twice, clipped to the half behind and the half in front */
    orbit: function (P, u) {
      return '<g transform="translate(50 84) scale(1 .26)"><circle r="44" fill="none" stroke="' + P.n2 + '" stroke-width="1.8" opacity=".6"/></g>' +
        '<g class="bud-orx"><g class="bud-c bud-ory"><circle cx="50" cy="84" r="7.4" fill="' + P.n2 + '" opacity=".22"/><path d="M42.8 84A7.2 1.9 0 0 1 57.2 84" fill="none" stroke="' + P.gold + '" stroke-width=".9" transform="rotate(-16 50 84)"/>' +
        '<circle cx="50" cy="84" r="4.2" fill="url(#' + u + 'pl)"/><path d="M42.8 84A7.2 1.9 0 0 0 57.2 84" fill="none" stroke="' + P.gold + '" stroke-width="1.1" transform="rotate(-16 50 84)"/></g></g>';
    },
    back: function (P, u) {
      var d = 'M37 78C31 88 24 100 18.6 113.6C25.6 111.2 30.4 114.8 35.6 112.6C41.4 115.4 45.6 112.8 50 114.2C54.4 112.8 58.6 115.4 64.4 112.6C69.6 114.8 74.4 111.2 81.4 113.6C76 100 69 88 63 78Z';
      return '<g class="bud-cape"><path d="' + d + '" fill="url(#' + u + 'cs)" stroke="' + P.gold + '" stroke-width="1.3" stroke-linejoin="round"/><path d="' + d + '" fill="url(#' + u + 'cp)"/>' +
        '<path d="M21.4 108C26 101 30 92 34.6 84M78.6 108C74 101 70 92 65.4 84" fill="none" stroke="' + P.gold + '" stroke-width=".6" opacity=".55"/>' + budTwinkles([[25, 104, 1.6], [74, 100, 1.9], [29, 92, 1.2], [71, 90, 1.3]], '#FFFFFF', 33) + '</g>';
    },
    torso: function (P, u) {
      return '<path d="' + BUD_TORSO + '" fill="url(#' + u + 'cs)" stroke="' + P.cvl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M34.4 80.4C33.6 86 32.6 92 31.8 97.8C31.6 99.6 32.2 100.8 33.4 101.6C34.8 94 35.4 86 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.cv2 + '" opacity=".6"/>' +
        '<path d="M50 85V102.2" stroke="' + P.gold + '" stroke-width="1.3"/><path d="M45.6 85.6L44.4 102M54.4 85.6L55.6 102" stroke="' + P.gold + '" stroke-width=".6" opacity=".6"/>' +
        '<path d="M32.4 93.8H67.6L68 97.4H32Z" fill="' + P.gold2 + '" stroke="' + P.goldl + '" stroke-width=".8" stroke-linejoin="round"/><path d="M33 95H67" stroke="' + P.gold + '" stroke-width=".7"/>' +
        '<circle cx="50" cy="95.6" r="3.4" fill="' + P.cv2 + '" stroke="' + P.gold + '" stroke-width="1"/>' + budStar4(50, 95.6, 2.6, P.n2, 0.25) +
        '<path d="M34.4 81.2C35.8 76.8 41 75.2 50 75.2C59 75.2 64.2 76.8 65.6 81.2C61.4 84.6 56 86 50 86.2C44 86 38.6 84.6 34.4 81.2Z" fill="' + P.cv3 + '" stroke="' + P.gold + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<path d="M36.6 81.4C40.6 83.8 45 84.8 50 84.9C55 84.8 59.4 83.8 63.4 81.4" fill="none" stroke="' + P.gold + '" stroke-width=".5" opacity=".7"/>' +
        '<circle class="bud-c bud-clasp" cx="50" cy="80.6" r="4.4" fill="' + P.n2 + '" opacity=".45"/>' + budStar4(50, 80.6, 4, '#FFFFFF', 0.24) + '<circle cx="50" cy="80.6" r="1.3" fill="' + P.gold + '"/>';
    },
    arm: function (P, side) {
      var m = side < 0 ? -1 : 1, sx = 50 + m * 12.8, ex = 50 + m * 18.4, hx = 50 + m * 19;
      return budLimb(sx, 80.6, ex, 90.8, 7.6, P.cv, P.cvl) +
        '<path d="M' + budP(ex - m * 4.4, 88.6) + 'L' + budP(ex + m * 4, 87.2) + 'L' + budP(ex + m * 5.6, 94.4) + 'L' + budP(ex - m * 4.8, 95.4) + 'Z" fill="' + P.cv3 + '" stroke="' + P.gold + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<path d="M' + budP(ex - m * 4.6, 94) + 'L' + budP(ex + m * 5.3, 93) + '" stroke="' + P.gold + '" stroke-width=".7"/>' +
        '<circle cx="' + budN(hx) + '" cy="97.4" r="3.7" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1.1"/>';
    },
    legs: function (P) {
      function leg(x, side) {
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 99.4, x, 106, 7, P.cv2, P.cvl) +
          '<path d="M' + budP(x - 6, 113.8) + 'V109.6C' + budP(x - 6, 107) + ' ' + budP(x - 3.4, 105.6) + ' ' + budP(x, 105.6) + 'C' + budP(x + 3.4, 105.6) + ' ' + budP(x + 6, 107) + ' ' + budP(x + 6, 109.6) + 'V113.8Z" fill="' + P.cv + '" stroke="' + P.cvl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
          '<path d="M' + budP(x - 6, 112.2) + 'H' + budN(x + 6) + '" stroke="' + P.gold + '" stroke-width="1.4"/>' + budStar4(x, 108.8, 1.9, P.gold, 0.25) + '</g>';
      }
      return leg(45.2, 'l') + leg(54.8, 'r');
    },
    top: function (P, u, g) {
      return '<g clip-path="url(#' + u + 'hk)"><path d="M14 40C30 30 46 34 58 24C66 18 76 18 86 22" fill="none" stroke="' + P.n1 + '" stroke-width="7" opacity=".35" stroke-linecap="round"/><path d="M20 30C34 24 44 26 54 18" fill="none" stroke="' + P.n2 + '" stroke-width="4" opacity=".3" stroke-linecap="round"/>' +
          budTwinkles([[30, 22, 1.7], [44, 16, 1.3], [60, 18, 1.9], [70, 28, 1.4], [38, 30, 1], [56, 30, 1.2], [24, 40, 1.3], [77, 42, 1.1]], '#FFFFFF', 41) + '</g>' +
        (g ? '' : budTwinkles([[36, 8, 1.3], [62, 7, 1.4], [24, 16, 1.1]], '#FFFFFF', 45)) +
        '<g transform="translate(26 33) rotate(-24)"><path d="M0 -5.8A5.8 5.8 0 1 0 4.8 3.2A4.6 4.6 0 1 1 0 -5.8Z" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".7"/><circle cx="-1.6" cy="1.6" r=".7" fill="' + P.gold2 + '"/></g>' + budStar4(32, 26.4, 2.4, '#FFFFFF', 0.2);
    },
    fore: function (P, u) {
      return '<g clip-path="url(#' + u + 'od)">' + this.orbit(P, u) + '</g>' + budTwinkles([[10, 88, 2.2], [92, 74, 2.6], [86, 108, 1.6]], '#FFFFFF', 37);
    },
    fx: function (P) {
      var h = '', i, k;
      for (k = 0; k < 2; k++) { for (i = 0; i < 12; i++) { var a = i * 0.5 + k * Math.PI, r = 8 + i * 4; h += '<circle cx="' + budN(50 + r * Math.cos(a)) + '" cy="' + budN(60 + r * Math.sin(a) * 0.9) + '" r="' + budN(2.2 - i * 0.12) + '" fill="' + (i % 3 ? P.n2 : '#FFFFFF') + '"/>'; } }
      return '<g class="bud-fx bud-gal">' + h + '</g>';
    }
  };

  /* ---------- Daybreak (Radiant): white-gold armor with a sun on the chest, a winged circlet, wings of light, a sun behind
     the head, turning rays and rune rings, and light that ripples out from the ground ---------- */
  BUD_SKINS.dawn = {
    eyes: 'open', mouth: 'smile', hat: false,
    pal: function (P) {
      P.ar = '#FFFDF6'; P.ar2 = '#F0DCA6'; P.arl = '#8A5A12'; P.gold = '#FCD34D'; P.gold2 = '#E5A21A'; P.goldl = '#7C4A06';
      P.gem = budMix(P.c, '#FFFFFF', 0.12); P.gem2 = budMix(P.c, '#0B0614', 0.4); P.gem3 = budMix(P.c, '#FFFFFF', 0.7);
      P.ir1 = '#5B3A0A'; P.ir2 = '#D98A0B'; P.ir3 = '#FFE7A3';
      P.arm = P.ar; P.armline = P.arl; P.cuff = P.gold; P.pants = '#FBF3DC'; return P;
    },
    defs: function (P, u) {
      return '<radialGradient id="' + u + 'sg"><stop offset="0" stop-color="#FFF6D5" stop-opacity=".95"/><stop offset=".35" stop-color="#FDE68A" stop-opacity=".5"/><stop offset="1" stop-color="#FBBF24" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + u + 'sd"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="#FFF4C2"/><stop offset=".84" stop-color="#FCD34D" stop-opacity=".9"/><stop offset="1" stop-color="#F59E0B" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + u + 'ry" gradientUnits="userSpaceOnUse" cx="50" cy="50" r="74"><stop offset="0" stop-color="#FFF7D6" stop-opacity=".95"/><stop offset=".45" stop-color="#FCD34D" stop-opacity=".5"/><stop offset="1" stop-color="#FCD34D" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="' + u + 'bl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#FEF3C7" stop-opacity=".95"/><stop offset="1" stop-color="#FBBF24" stop-opacity=".15"/></linearGradient>' +
        '<linearGradient id="' + u + 'am" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".6" stop-color="' + P.ar + '"/><stop offset="1" stop-color="' + P.ar2 + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'au" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3B0"/><stop offset=".5" stop-color="' + P.gold + '"/><stop offset="1" stop-color="' + P.gold2 + '"/></linearGradient>' +
        '<radialGradient id="' + u + 'gm" cx=".35" cy=".3"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".3" stop-color="' + P.gem3 + '"/><stop offset=".7" stop-color="' + P.gem + '"/><stop offset="1" stop-color="' + P.gem2 + '"/></radialGradient>' +
        '<linearGradient id="' + u + 'cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF7D6" stop-opacity=".9"/><stop offset="1" stop-color="#FCD34D" stop-opacity="0"/></linearGradient>' +
        '<radialGradient id="' + u + 'gl"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".45" stop-color="#FDE68A" stop-opacity=".6"/><stop offset="1" stop-color="#FCD34D" stop-opacity="0"/></radialGradient>';
    },
    aura: function (P, u) {
      var runes = budRing(0, 0, 41.6, 16, function (a, x, y, i) {
        var k = i % 4, t = ' transform="rotate(' + budN(a + 90) + ' ' + budP(x, y) + ')"';
        if (k === 0) { return '<path d="M' + budP(x, y - 2.4) + 'l1.7 2.4-1.7 2.4-1.7-2.4z" fill="' + P.gold + '"' + t + '/>'; }
        if (k === 1) { return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="1.3" fill="none" stroke="' + P.gold + '" stroke-width=".7"/><circle cx="' + budN(x) + '" cy="' + budN(y) + '" r=".45" fill="' + P.gold + '"/>'; }
        if (k === 2) { return '<path d="M' + budP(x - 1.7, y + 1.1) + 'L' + budP(x, y - 1.5) + 'L' + budP(x + 1.7, y + 1.1) + '" fill="none" stroke="' + P.gold + '" stroke-width=".8"' + t + '/>'; }
        return '<path d="M' + budP(x, y - 1.9) + 'V' + budN(y + 1.9) + 'M' + budP(x - 1.3, y - 0.5) + 'H' + budN(x + 1.3) + '" stroke="' + P.gold + '" stroke-width=".7"' + t + '/>';
      });
      var ticks = budRing(0, 0, 30, 24, function (a, x, y, i) { return '<path d="M' + budP(x * 0.9, y * 0.9) + 'L' + budP(x * (i % 2 ? 1.04 : 1.1), y * (i % 2 ? 1.04 : 1.1)) + '"/>'; });
      return '<circle class="bud-c bud-dglow" cx="50" cy="54" r="66" fill="url(#' + u + 'sg)"/>' +
        '<g class="bud-c bud-raysa"><path d="' + budRays(50, 50, 10, 76, 16, 8, 0.7) + '" fill="url(#' + u + 'ry)" opacity=".85"/></g>' +
        '<g class="bud-c bud-raysb"><path d="' + budRays(50, 50, 8, 62, 24, 2.4, 0.6) + '" fill="#FFF7D6" opacity=".55"/></g>' +
        '<g transform="translate(50 50)"><g class="bud-c bud-sigb"><circle r="53" fill="none" stroke="#FFF1B8" stroke-width="1.1" stroke-dasharray="1 4" opacity=".95"/>' +
          budRing(0, 0, 53, 8, function (a, x, y) { return '<path d="M' + budP(x, y - 2.9) + 'l2.1 2.9-2.1 2.9-2.1-2.9z" fill="#FFF7D6" stroke="' + P.gold2 + '" stroke-width=".5"/>'; }) + '</g></g>' +
        '<g transform="translate(50 50)"><g class="bud-c bud-siga"><circle r="46" fill="none" stroke="' + P.gold + '" stroke-width="1" opacity=".95"/><circle r="37.2" fill="none" stroke="' + P.gold + '" stroke-width=".6" opacity=".85"/>' + runes + '</g></g>' +
        '<circle class="bud-c bud-sun" cx="50" cy="44" r="37" fill="url(#' + u + 'sd)"/>' +
        '<g transform="translate(50 113) scale(1 .3)"><circle r="36" fill="url(#' + u + 'gl)"/><g class="bud-c bud-gring" stroke="' + P.gold + '" stroke-width="1.4"><circle r="30" fill="none"/>' + ticks + '</g>' +
          '<circle class="bud-c bud-pr bud-pr1" r="28" fill="none" stroke="#FFF1B8" stroke-width="2"/><circle class="bud-c bud-pr bud-pr2" r="28" fill="none" stroke="#FFF1B8" stroke-width="2"/><circle class="bud-c bud-pr bud-pr3" r="28" fill="none" stroke="#FFF1B8" stroke-width="2"/></g>' +
        budParts(16, [10, 90, 62, 112], function (x, y, i, c) { return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(1.6 + c * 1.6) + '" fill="#FDE68A" opacity=".35"/><circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(0.6 + c * 0.7) + '" fill="#FFFFFF"/>'; }, { d: 3.4, dy: 52, dx: 10, seed: 51 }) +
        budTwinkles([[8, 22, 3], [93, 16, 3.6], [97, 62, 2.6], [3, 66, 2.4], [90, 98, 2.2], [11, 102, 2]], '#FFFBEB', 61);
    },
    back: function (P, u) {
      function wing(m) {
        var h = '', i, x = 50 + m * 10, y = 82;
        for (i = 4; i >= 0; i--) {
          var a = m * (34 + i * 15), L = 50 - i * 5, w = 5.6 - i * 0.4;
          h += '<path d="M0 0C' + budP(-w, -L * 0.3) + ' ' + budP(-w * 0.7, -L * 0.72) + ' 0 ' + budN(-L) + 'C' + budP(w * 0.7, -L * 0.72) + ' ' + budP(w, -L * 0.3) + ' 0 0Z" fill="url(#' + u + 'bl)" stroke="#FCD34D" stroke-width=".6" transform="translate(' + budP(x, y) + ') rotate(' + budN(a) + ')"/>' +
            '<path d="M0 -2L0 ' + budN(-L * 0.8) + '" stroke="#FFFFFF" stroke-width=".7" opacity=".8" transform="translate(' + budP(x, y) + ') rotate(' + budN(a) + ')"/>';
        }
        return '<g class="bud-lw bud-lw-' + (m < 0 ? 'l' : 'r') + '">' + h + '</g>';
      }
      return wing(-1) + wing(1) + '<path class="bud-lcape" d="M38 80C32 90 26.6 102 23.4 114.4H76.6C73.4 102 68 90 62 80Z" fill="url(#' + u + 'cl)" opacity=".75"/>';
    },
    torso: function (P, u) {
      return '<path d="M40.4 94H59.6L58.8 105.4L50 108.4L41.2 105.4Z" fill="' + P.c + '" stroke="' + P.goldl + '" stroke-width="1" stroke-linejoin="round"/><path d="M42.6 96.2H57.4L56.8 103.8L50 106.2L43.2 103.8Z" fill="none" stroke="' + P.gold + '" stroke-width=".9"/>' +
        '<path d="' + BUD_TORSO + '" fill="url(#' + u + 'am)" stroke="' + P.arl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M34.4 80.4C33.6 86 32.6 92 31.8 97.8C31.6 99.6 32.2 100.8 33.4 101.6C34.8 94 35.4 86 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.ar2 + '" opacity=".7"/>' +
        '<path d="M39.6 77.2Q50 82.6 60.4 77.2" fill="none" stroke="' + P.gold + '" stroke-width="1.6"/><path d="M37.4 80.6C40 90 41 94 41.4 96M62.6 80.6C60 90 59 94 58.6 96" fill="none" stroke="' + P.gold + '" stroke-width=".8" opacity=".85"/>' +
        '<path d="' + budRays(50, 87.6, 4.6, 9.4, 12, 16, 0.66) + '" fill="url(#' + u + 'au)" stroke="' + P.goldl + '" stroke-width=".4"/><circle cx="50" cy="87.6" r="4.6" fill="url(#' + u + 'au)" stroke="' + P.goldl + '" stroke-width=".8"/>' +
        '<circle class="bud-c bud-gem" cx="50" cy="87.6" r="2.8" fill="url(#' + u + 'gm)" stroke="' + P.gem2 + '" stroke-width=".5"/>' +
        '<rect x="32.6" y="95.4" width="34.8" height="3.8" rx="1.4" fill="url(#' + u + 'au)" stroke="' + P.goldl + '" stroke-width=".8"/><path d="M50 95l2.6 2.3-2.6 2.3-2.6-2.3z" fill="url(#' + u + 'gm)" stroke="' + P.goldl + '" stroke-width=".6"/>';
    },
    arm: function (P, side, u) {
      var m = side < 0 ? -1 : 1, sx = 50 + m * 12.8, ex = 50 + m * 18.4, hx = 50 + m * 19;
      return budLimb(sx, 80.6, ex, 92.4, 7.2, P.ar, P.arl) +
        '<path d="M' + budP(ex - m * 4, 88.8) + 'L' + budP(ex + m * 3.6, 87.6) + 'L' + budP(ex + m * 4.4, 93.6) + 'L' + budP(ex - m * 3.6, 94.4) + 'Z" fill="url(#' + u + 'au)" stroke="' + P.goldl + '" stroke-width=".9" stroke-linejoin="round"/>' +
        '<circle cx="' + budN(hx) + '" cy="96.6" r="3.8" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1.1"/>' +
        '<path d="M' + budP(sx - m * 4.4, 79.8) + 'C' + budP(sx - m * 2, 74.2) + ' ' + budP(sx + m * 5.4, 74.4) + ' ' + budP(sx + m * 7.8, 80.6) + 'C' + budP(sx + m * 4, 79.2) + ' ' + budP(sx, 79.8) + ' ' + budP(sx - m * 4.4, 79.8) + 'Z" fill="url(#' + u + 'au)" stroke="' + P.goldl + '" stroke-width="1"/>' +
        '<path d="M' + budP(sx - m * 2.2, 81.8) + 'C' + budP(sx, 78.2) + ' ' + budP(sx + m * 5.2, 78.4) + ' ' + budP(sx + m * 7.4, 83.4) + 'C' + budP(sx + m * 4, 82) + ' ' + budP(sx + m * 1, 82.4) + ' ' + budP(sx - m * 2.2, 81.8) + 'Z" fill="url(#' + u + 'am)" stroke="' + P.arl + '" stroke-width=".9"/>';
    },
    legs: function (P, u) {
      function leg(x, side) {
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 99.4, x, 105.6, 7, P.pants, P.arl) +
          '<path d="M' + budP(x - 6, 113.8) + 'V109C' + budP(x - 6, 106.4) + ' ' + budP(x - 3.4, 104.6) + ' ' + budP(x, 104.6) + 'C' + budP(x + 3.4, 104.6) + ' ' + budP(x + 6, 106.4) + ' ' + budP(x + 6, 109) + 'V113.8Z" fill="url(#' + u + 'am)" stroke="' + P.arl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
          '<path d="M' + budP(x - 6, 111.8) + 'H' + budN(x + 6) + '" stroke="' + P.gold + '" stroke-width="1.6"/><path d="M' + budP(x, 105) + 'V109.6" stroke="' + P.gold + '" stroke-width="1.2"/></g>';
      }
      return leg(45.2, 'l') + leg(54.8, 'r');
    },
    top: function (P, u) {
      var band = 'M24.4 41C31.8 34.6 40.8 32 50 32C59.2 32 68.2 34.6 75.6 41';
      function wing(m) { return '<path d="M' + budP(50 + m * 25, 39.4) + 'C' + budP(50 + m * 29, 33.6) + ' ' + budP(50 + m * 34, 30.4) + ' ' + budP(50 + m * 39.6, 29.8) + 'C' + budP(50 + m * 36.6, 32) + ' ' + budP(50 + m * 35, 34) + ' ' + budP(50 + m * 34.2, 35.8) + 'C' + budP(50 + m * 36, 35.4) + ' ' + budP(50 + m * 37.6, 35.8) + ' ' + budP(50 + m * 38.6, 36.8) + 'C' + budP(50 + m * 35.4, 38.4) + ' ' + budP(50 + m * 31.4, 39.6) + ' ' + budP(50 + m * 27, 41.6) + 'Z" fill="url(#' + u + 'au)" stroke="' + P.goldl + '" stroke-width=".8" stroke-linejoin="round"/>'; }
      return wing(-1) + wing(1) + '<path d="' + band + '" fill="none" stroke="' + P.goldl + '" stroke-width="3.8" stroke-linecap="round"/><path d="' + band + '" fill="none" stroke="' + P.gold + '" stroke-width="2.4" stroke-linecap="round"/><path d="M28 37.6C35 33.6 42 32.2 50 32.2" fill="none" stroke="#FFF7D6" stroke-width=".8" stroke-linecap="round"/>' +
        '<path d="' + budRays(50, 30.4, 3.4, 8.4, 12, 20, 0.6) + '" fill="url(#' + u + 'au)" stroke="' + P.goldl + '" stroke-width=".4"/><circle cx="50" cy="30.4" r="3.8" fill="url(#' + u + 'au)" stroke="' + P.goldl + '" stroke-width=".7"/>' +
        '<circle cx="50" cy="30.4" r="2.5" fill="url(#' + u + 'gm)" stroke="' + P.gem2 + '" stroke-width=".4"/><g class="bud-glint">' + budStar4(52, 27.4, 3.4, '#FFFFFF', 0.16) + '</g>';
    },
    fore: function () {
      return budTwinkles([[16, 84, 2.4], [86, 80, 2.8], [80, 110, 1.8], [20, 112, 1.6]], '#FFFFFF', 67);
    },
    fx: function () {
      return '<g class="bud-fx bud-burst"><path d="' + budRays(50, 56, 14, 70, 20, 5, 0.6) + '" fill="#FFF7D6" opacity=".9"/><circle cx="50" cy="56" r="20" fill="none" stroke="#FFFFFF" stroke-width="2"/></g>';
    }
  };

  /* ---------- more shapes the skins share ---------- */
  /* a five-pointed star around (x, y), r to its points */
  function budStar5(x, y, r) {
    var d = '', i;
    for (i = 0; i < 10; i++) { var a = (i * 36 - 90) * Math.PI / 180, R = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + budP(x + R * Math.cos(a), y + R * Math.sin(a)); }
    return d + 'Z';
  }
  /* a leaf from its stem at (x, y), len long and w wide, turned a degrees from straight up; o: { fill, line, vein } */
  function budLeaf(x, y, len, w, a, o) {
    var t = ' transform="translate(' + budP(x, y) + ') rotate(' + budN(a) + ')"';
    return '<path d="M0 0C' + budP(w, -len * 0.28) + ' ' + budP(w * 0.8, -len * 0.82) + ' 0 ' + budN(-len) + 'C' + budP(-w * 0.8, -len * 0.82) + ' ' + budP(-w, -len * 0.28) + ' 0 0Z" fill="' + o.fill + '" stroke="' + o.line + '" stroke-width="' + (o.lw || 0.7) + '" stroke-linejoin="round"' + t + '/>' +
      (o.vein ? '<path d="M0 -.6V' + budN(-len * 0.8) + '" stroke="' + o.vein + '" stroke-width=".55" fill="none"' + t + '/>' : '');
  }
  /* a flower of five round petals */
  function budFlower(x, y, r, fill, line, mid) {
    var h = '', i;
    for (i = 0; i < 5; i++) { var a = (i * 72 - 90) * Math.PI / 180; h += '<circle cx="' + budN(x + r * Math.cos(a)) + '" cy="' + budN(y + r * Math.sin(a)) + '" r="' + budN(r * 0.92) + '" fill="' + fill + '" stroke="' + line + '" stroke-width=".55"/>'; }
    return h + '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(r * 0.7) + '" fill="' + (mid || '#FDE047') + '" stroke="' + line + '" stroke-width=".5"/>';
  }
  /* clip paths for the half of the drawing above a line (u + id + 'u') and below it (u + id + 'd'), so a ring can pass behind and in front */
  function budHalves(u, id, y) { return '<clipPath id="' + u + id + 'u"><rect x="-40" y="-60" width="180" height="' + budN(y + 60) + '"/></clipPath><clipPath id="' + u + id + 'd"><rect x="-40" y="' + budN(y) + '" width="180" height="90"/></clipPath>'; }

  /* ---------- Doodle (Common): a notebook-paper hoodie, a folded paper hat and a big pencil, with doodles that draw
     themselves and a paper plane looping overhead ---------- */
  BUD_SKINS.doodle = {
    eyes: 'open', mouth: 'grin', hat: false, covers: true,
    pal: function (P) {
      P.pp = '#FBFAF4'; P.pp2 = '#E7E3D4'; P.ppl = '#3F3F46'; P.rule = '#9CC3F5'; P.marg = '#F28B8B'; P.ink = P.c;
      P.arm = P.pp; P.armline = P.ppl; P.cuff = P.pp2; P.pants = '#4B5563'; P.line = '#27272A'; return P;
    },
    defs: function (P, u) {
      return '<pattern id="' + u + 'nb" patternUnits="userSpaceOnUse" width="12" height="4.2"><rect width="12" height="4.2" fill="' + P.pp + '"/><path d="M0 3.9H12" stroke="' + P.rule + '" stroke-width=".45"/></pattern>' +
        '<radialGradient id="' + u + 'pg"><stop offset="0" stop-color="#FFFBEB" stop-opacity=".95"/><stop offset=".6" stop-color="#FEF3C7" stop-opacity=".35"/><stop offset="1" stop-color="#FEF3C7" stop-opacity="0"/></radialGradient>' +
        '<clipPath id="' + u + 'tc"><path d="' + BUD_TORSO + '"/></clipPath>';
    },
    aura: function (P, u) {
      function dd(d, dl, c, w) { return '<g class="bud-drawn" style="--d:7.2s;--dl:-' + dl + 's"><path d="' + d + '" pathLength="1" stroke-dasharray="1" fill="none" stroke="' + c + '" stroke-width="' + (w || 1.7) + '" stroke-linecap="round" stroke-linejoin="round"/></g>'; }
      return '<circle class="bud-c bud-pls" style="--d:4.6s" cx="50" cy="60" r="56" fill="url(#' + u + 'pg)"/>' +
        dd(budStar5(12, 22, 7.4), 0, P.ink) + dd('M88 34.6C80.6 29.4 83 22.2 88 25.8C93 22.2 95.4 29.4 88 34.6Z', 1.2, '#F43F5E') +
        dd('M10 64.6a1.8 1.8 0 1 1 1.9 1.8a3.8 3.8 0 1 1 -4 -3.8a5.8 5.8 0 1 1 5.8 5.8', 2.4, P.ppl, 1.3) + dd('M93 55L86.6 65.4H92L87.4 75', 3.6, '#F59E0B') +
        dd('M88 90.6a5.2 5.2 0 1 0 0.01 0ZM86 94.4v.4M90 94.4v.4M85.6 97.4Q88 99.6 90.4 97.4', 4.8, P.ink, 1.3) + dd('M14 92a3.6 3.6 0 1 0 .01 0ZM14 85.6v-2.4M14 102.8v2.4M7 96H4.6M21 96h2.4M9 91l-1.7-1.7M19 101l1.7 1.7M19 91l1.7-1.7M9 101l-1.7 1.7', 6, '#F59E0B', 1.2);
    },
    torso: function (P, u) {
      var rings = '';
      [81.2, 84.8, 88.4, 92, 95.6, 99.2].forEach(function (y) { rings += '<ellipse cx="34.8" cy="' + y + '" rx="1.7" ry="1.05" fill="none" stroke="' + P.ppl + '" stroke-width=".8"/>'; });
      return '<path d="' + BUD_TORSO + '" fill="url(#' + u + 'nb)" stroke="' + P.ppl + '" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<g clip-path="url(#' + u + 'tc)"><path d="M39.4 74V104" stroke="' + P.marg + '" stroke-width=".8"/><path d="M34.4 80.4C33.6 86 32.6 92 31.8 97.8C31.6 99.6 32.2 100.8 33.4 101.6C34.8 94 35.4 86 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.pp2 + '" opacity=".7"/></g>' +
        '<path d="' + BUD_TORSO + '" fill="none" stroke="' + P.ppl + '" stroke-width=".5" opacity=".45" transform="translate(.8 -.6)"/>' + rings +
        '<path d="M45.4 79.6L44.6 88.2M54.6 79.6L55.4 88.2" stroke="' + P.ink + '" stroke-width="1.15" stroke-linecap="round"/>' +
        '<path d="' + budStar5(56.6, 92.6, 4.6) + '" fill="none" stroke="' + P.ink + '" stroke-width="1.1" stroke-linejoin="round"/><path d="M55.2 92.4v.2M58 92.4v.2M55 94.2q1.6 1.2 3.2 0" stroke="' + P.ppl + '" stroke-width=".6" fill="none" stroke-linecap="round"/>' +
        '<path d="M41.6 96.6h7.6l-.4 4.6h-6.8z" fill="none" stroke="' + P.ppl + '" stroke-width=".7" stroke-dasharray="1.4 1"/>';
    },
    arm: function (P, side) {
      var h = BUD_PART.arm(P, side);
      if (side < 0) { return h; }
      var t = ' transform="translate(66.4 101.6) rotate(22)"';
      return h.replace(/<circle[^>]*\/>$/, '') +
        '<g' + t + '><path d="M-1.9 0V-2.6H1.9V0Q0 1.2-1.9 0Z" fill="#F9A8D4" stroke="#9D174D" stroke-width=".6"/><rect x="-2" y="-4.2" width="4" height="1.8" fill="#CBD5E1" stroke="#475569" stroke-width=".6"/>' +
        '<rect x="-1.9" y="-15" width="3.8" height="11" fill="#FACC15" stroke="#92400E" stroke-width=".7"/><path d="M-.6 -14.6V-4.6M.7 -14.6V-4.6" stroke="#EAB308" stroke-width=".6"/>' +
        '<path d="M-1.9 -15L0 -20L1.9 -15Z" fill="#F5D0A0" stroke="#92400E" stroke-width=".6" stroke-linejoin="round"/><path d="M-.7 -18.2L0 -20L.7 -18.2Z" fill="#374151"/></g>' +
        h.match(/<circle[^>]*\/>$/)[0];
    },
    top: function (P, u) {
      return '<path d="M21.4 32.4L50 -3L78.6 32.4Z" fill="url(#' + u + 'nb)" stroke="' + P.ppl + '" stroke-width="1.2" stroke-linejoin="round"/><path d="M50 -3L45 31M50 -3L56 31" stroke="' + P.pp2 + '" stroke-width=".9"/>' +
        '<path d="M50 -3L78.6 32.4" stroke="' + P.ppl + '" stroke-width=".5" opacity=".45" transform="translate(.7 .4)"/>' +
        '<path d="' + budStar5(40.6, 20.6, 4.2) + '" fill="none" stroke="' + P.ink + '" stroke-width="1" stroke-linejoin="round"/><path d="M57 14.6l4.4 4.4M61.4 14.6L57 19" stroke="#F43F5E" stroke-width="1" stroke-linecap="round"/>' +
        '<path d="M18.2 30.6H81.8L80.2 38.4H19.8Z" fill="' + P.pp + '" stroke="' + P.ppl + '" stroke-width="1.2" stroke-linejoin="round"/><path d="M19 34.6H81" stroke="' + P.rule + '" stroke-width=".5"/>' +
        '<text x="66.4" y="37.4" font-family="system-ui, sans-serif" font-size="6" font-weight="800" fill="#EF4444">A+</text>';
    },
    fore: function (P) {
      return '<g class="bud-plane"><path d="M-6 -2.6L6 0L-6 2.6L-3.6 0Z" fill="#FFFFFF" stroke="' + P.ppl + '" stroke-width=".7" stroke-linejoin="round"/><path d="M-3.6 0H6M-6 2.6L-1 1" stroke="' + P.ppl + '" stroke-width=".5" fill="none"/></g>';
    }
  };

  /* ---------- Raincoat (Common): a glossy raincoat and rain hat in your color, rubber boots, a little cloud that drizzles
     beside you, a rainbow behind and a puddle with ripples ---------- */
  BUD_SKINS.rain = {
    eyes: 'open', mouth: 'grin', hat: false, covers: true,
    pal: function (P) {
      var h = budHex(P.c), warm = h[0] > 190 && h[1] > 110 && h[2] < 120;
      P.rc = budMix(P.c, '#FFFFFF', 0.06); P.rc2 = budMix(P.c, '#0B1020', 0.25); P.rc3 = budMix(P.c, '#FFFFFF', 0.5); P.rcl = budMix(P.c, '#0B1020', 0.6);
      P.bt = warm ? '#2563EB' : '#FACC15'; P.bt2 = budMix(P.bt, '#000000', 0.22); P.btl = budMix(P.bt, '#000000', 0.6);
      P.arm = P.rc; P.armline = P.rcl; P.cuff = P.rc2; P.pants = '#334155'; return P;
    },
    defs: function (P, u) {
      return '<linearGradient id="' + u + 'rg" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="' + P.rc3 + '"/><stop offset=".45" stop-color="' + P.rc + '"/><stop offset="1" stop-color="' + P.rc2 + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#CBD5E1"/></linearGradient>' +
        '<linearGradient id="' + u + 'dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E0F2FE"/><stop offset="1" stop-color="#38BDF8"/></linearGradient>' +
        '<radialGradient id="' + u + 'pd"><stop offset="0" stop-color="#BAE6FD" stop-opacity=".95"/><stop offset=".7" stop-color="#7DD3FC" stop-opacity=".6"/><stop offset="1" stop-color="#7DD3FC" stop-opacity="0"/></radialGradient>';
    },
    aura: function (P, u) {
      var bow = ['#F87171', '#FB923C', '#FACC15', '#4ADE80', '#60A5FA', '#A78BFA'].map(function (c, i) { var r = 47 - i * 2.4; return '<path d="M' + budP(50 - r, 64) + 'A' + r + ' ' + r + ' 0 0 1 ' + budP(50 + r, 64) + '" fill="none" stroke="' + c + '" stroke-width="2.5"/>'; }).join('');
      function rip(x, d, dl) { return '<g transform="translate(' + x + ' 113.4) scale(1 .3)"><circle class="bud-c bud-rip" style="--d:' + d + 's;--dl:-' + dl + 's" r="8" fill="none" stroke="#E0F2FE" stroke-width="1.8"/></g>'; }
      return '<g opacity=".38">' + bow + '</g>' +
        '<ellipse cx="50" cy="113.4" rx="31" ry="4.8" fill="url(#' + u + 'pd)"/><path d="M30 112.4Q40 110.8 50 111" stroke="#FFFFFF" stroke-width=".9" fill="none" opacity=".8" stroke-linecap="round"/>' + rip(34, 2.6, 0.2) + rip(66, 2.6, 1.5) + rip(50, 3, 0.9) +
        budParts(8, [5, 25, 21, 28], function (x, y) { return '<path d="M' + budP(x, y - 2.4) + 'q1.4 2 1.4 3a1.4 1.4 0 0 1 -2.8 0q0 -1 1.4 -3z" fill="url(#' + u + 'dp)"/>'; }, { d: 1.1, dy: -80, dx: -2, seed: 71 }) +
        '<g class="bud-bob" style="--d:3.6s"><path d="M6.4 20.6C2.6 20.6 1.4 15.4 4.8 13.6C4.6 9 9.4 7 12.6 9.4C14.4 4.6 22.4 4.6 24 10.2C28.4 9.8 30.6 14.6 28 17.6C28.8 19.6 27.6 20.6 26 20.6Z" fill="url(#' + u + 'cl)" stroke="#94A3B8" stroke-width=".9" stroke-linejoin="round"/>' +
        '<path d="M11.8 14.6q1.2 1.2 2.4 0M18.4 14.6q1.2 1.2 2.4 0M15 17.4q1.2.9 2.4 0" fill="none" stroke="#475569" stroke-width=".8" stroke-linecap="round"/><ellipse cx="10.6" cy="17" rx="1.3" ry=".7" fill="#FDA4AF" opacity=".7"/><ellipse cx="22.4" cy="17" rx="1.3" ry=".7" fill="#FDA4AF" opacity=".7"/></g>';
    },
    torso: function (P, u) {
      var tg = '';
      [87.6, 93.4, 99.2].forEach(function (y) { tg += '<path d="M45.4 ' + budN(y + 0.9) + 'h9.2" stroke="#78350F" stroke-width=".7"/><rect x="47.4" y="' + y + '" width="5.2" height="1.8" rx=".9" fill="#F5DEB3" stroke="#92400E" stroke-width=".6"/>'; });
      return '<path d="M34 80C35 76.6 40 75.4 50 75.4C60 75.4 65 76.6 66 80L70.2 102.8C70.6 105.2 69.2 106.4 66.8 106.4H33.2C30.8 106.4 29.4 105.2 29.8 102.8Z" fill="url(#' + u + 'rg)" stroke="' + P.rcl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M50 81V106.2" stroke="' + P.rcl + '" stroke-width=".9"/><path d="M35.2 96h8.6l.3 6.2h-9.6z M64.8 96h-8.6l-.3 6.2h9.6z" fill="' + P.rc2 + '" fill-opacity=".35" stroke="' + P.rcl + '" stroke-width=".7" stroke-linejoin="round"/>' + tg +
        '<path d="M39.4 76.2L50 81.8L46.4 86L36.8 79.4Z M60.6 76.2L50 81.8L53.6 86L63.2 79.4Z" fill="' + P.rc3 + '" stroke="' + P.rcl + '" stroke-width=".9" stroke-linejoin="round"/>' +
        '<path d="M37.6 82C36.8 87.4 36 93.4 35.4 99.4" stroke="#FFFFFF" stroke-width="1.6" opacity=".55" stroke-linecap="round"/><path d="M59.6 89.6q.8 1.2.8 1.8a.8.8 0 0 1 -1.6 0q0 -.6.8 -1.8zM41.6 84.2q.7 1 .7 1.6a.7.7 0 0 1 -1.4 0q0 -.6.7 -1.6z" fill="#FFFFFF" opacity=".85"/>';
    },
    legs: function (P) {
      function leg(x, side) {
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 99.4, x, 103, 6.6, P.pants, '#141826') +
          '<path d="M' + budP(x - 5.4, 103.2) + 'H' + budN(x + 5.4) + 'V110.6C' + budP(x + 5.4, 113.4) + ' ' + budP(x + 4.4, 114.2) + ' ' + budP(x + 1.6, 114.2) + 'H' + budN(x - 4) + 'C' + budP(x - 5.6, 114.2) + ' ' + budP(x - 6.4, 113.2) + ' ' + budP(x - 6.2, 111.6) + 'Z" fill="' + P.bt + '" stroke="' + P.btl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
          '<path d="M' + budP(x - 6.2, 112.6) + 'H' + budN(x + 5.3) + '" stroke="' + P.bt2 + '" stroke-width="1.4"/><path d="M' + budP(x - 5.4, 104.8) + 'H' + budN(x + 5.4) + '" stroke="' + P.bt2 + '" stroke-width="1.2"/><path d="M' + budP(x - 3.4, 106.4) + 'V109.8" stroke="#FFFFFF" stroke-width=".9" opacity=".6" stroke-linecap="round"/></g>';
      }
      return leg(45.2, 'l') + leg(54.8, 'r');
    },
    top: function (P, u) {
      return '<path d="M25.6 34C24.4 18 35 9.2 50 9.2C65 9.2 75.6 18 74.4 34Z" fill="url(#' + u + 'rg)" stroke="' + P.rcl + '" stroke-width="1.2"/><path d="M50 9.4V33M37 12.6C33.6 19 32.6 26 33 33.4M63 12.6C66.4 19 67.4 26 67 33.4" stroke="' + P.rc2 + '" stroke-width=".8" opacity=".6" fill="none"/>' +
        '<path d="M30 17C34 12.8 40 10.8 46 10.6" stroke="#FFFFFF" stroke-width="1.8" opacity=".7" fill="none" stroke-linecap="round"/>' +
        '<path d="M14.4 39.4C22 33 35.4 30.6 50 30.6C64.6 30.6 78 33 85.6 39.4C88.2 42.6 86.6 45.6 83 44.4C74.6 40.8 63 39 50 39C37 39 25.4 40.8 17 44.4C13.4 45.6 11.8 42.6 14.4 39.4Z" fill="url(#' + u + 'rg)" stroke="' + P.rcl + '" stroke-width="1.2" stroke-linejoin="round"/>' +
        '<path d="M18.8 40.6C27 36.6 38 35 50 35C62 35 73 36.6 81.2 40.6" fill="none" stroke="' + P.rc3 + '" stroke-width=".7" stroke-dasharray="1.4 1.2"/>';
    },
    fx: function () {
      var h = '';
      [[34, 110, -6, -9], [40, 107, -3, -12], [60, 107, 3, -12], [66, 110, 6, -9], [50, 108, 0, -13]].forEach(function (d) { h += '<path style="--dx:' + d[2] + 'px;--dy:' + d[3] + 'px" d="M' + budP(d[0], d[1] - 2) + 'q1.2 1.7 1.2 2.6a1.2 1.2 0 0 1 -2.4 0q0 -.9 1.2 -2.6z" fill="#7DD3FC"/>'; });
      return '<g class="bud-fx bud-splash">' + h + '</g>';
    }
  };

  /* ---------- Sprout (Common): a leafy hood with a sprout growing out of it, a flower clip, a garden at your feet and
     leaves drifting down in warm sunlight ---------- */
  BUD_SKINS.sprout = {
    eyes: 'open', mouth: 'cat', hat: false, covers: true,
    pal: function (P) {
      P.hd = budMix('#86EFAC', P.c, 0.22); P.hd2 = budMix(P.hd, '#14532D', 0.3); P.hd3 = budMix(P.hd, '#FFFFFF', 0.45); P.hdl = budMix(P.hd, '#052E16', 0.62);
      P.lf = '#4ADE80'; P.lf2 = '#16A34A'; P.lf3 = '#BBF7D0'; P.lfl = '#166534'; P.fl = budMix(P.c, '#FFFFFF', 0.2); P.fl2 = budMix(P.c, '#000000', 0.3);
      P.arm = P.hd; P.armline = P.hdl; P.cuff = P.hd2; P.pants = '#6B4F3A'; P.shoe = '#F7FEE7'; P.sole = '#65A30D'; return P;
    },
    defs: function (P, u) {
      return '<linearGradient id="' + u + 'sg" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="' + P.hd3 + '"/><stop offset=".55" stop-color="' + P.hd + '"/><stop offset="1" stop-color="' + P.hd2 + '"/></linearGradient>' +
        '<radialGradient id="' + u + 'sw"><stop offset="0" stop-color="#FEF9C3" stop-opacity=".95"/><stop offset=".6" stop-color="#FEF08A" stop-opacity=".3"/><stop offset="1" stop-color="#FEF08A" stop-opacity="0"/></radialGradient>';
    },
    aura: function (P, u) {
      var lo = { fill: P.lf, line: P.lfl, vein: P.lf2 }, ground = '';
      [[17, 113, -20], [21, 114, 8], [27, 113.6, -6], [73, 113.6, 6], [79, 114, -8], [84, 113, 18]].forEach(function (b) { ground += '<path d="M0 0Q-1 -4 .4 -7Q.8 -3.4 1.6 0Z" fill="' + P.lf2 + '" transform="translate(' + b[0] + ' ' + b[1] + ') rotate(' + b[2] + ')"/>'; });
      function flower(x, y, h, dl) { return '<g class="bud-swy bud-pv" style="--d:3.2s;--a:5deg;--dl:-' + dl + 's;transform-origin:' + x + 'px ' + y + 'px"><path d="M' + x + ' ' + y + 'V' + budN(y - h) + '" stroke="' + P.lf2 + '" stroke-width="1"/>' + budLeaf(x, y - h * 0.4, 4, 1.8, 50, lo) + budFlower(x, y - h, 2.2, P.fl, P.fl2) + '</g>'; }
      return '<circle class="bud-c bud-pls" style="--d:4.4s" cx="50" cy="52" r="58" fill="url(#' + u + 'sw)"/>' +
        '<ellipse cx="50" cy="113.6" rx="32" ry="4.4" fill="#86EFAC" opacity=".55"/>' + ground + flower(14, 113, 11, 0) + flower(88, 113, 9, 1.2) + flower(24, 114, 6, 2) +
        budParts(7, [4, 96, -6, 34], function (x, y, i, c) { return budLeaf(x, y, 4.6, 2, c * 300, { fill: i % 2 ? P.lf : '#A3E635', line: P.lfl, lw: 0.5 }); }, { d: 6, dy: -72, dx: 18, seed: 81 }) +
        budParts(9, [16, 84, 66, 110], function (x, y, i, c) { return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(0.5 + c * 0.6) + '" fill="#FDE047"/>'; }, { d: 3.6, dy: 30, dx: 6, seed: 83 });
    },
    torso: function (P, u) {
      return '<path d="' + BUD_TORSO + '" fill="url(#' + u + 'sg)" stroke="' + P.hdl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M34.4 80.4C33.6 86 32.6 92 31.8 97.8C31.6 99.6 32.2 100.8 33.4 101.6C34.8 94 35.4 86 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.hd2 + '" opacity=".5"/>' +
        '<path d="M32 96.4H68L68.2 97.8C68.6 100.6 66.8 102.2 64 102.2H36C33.2 102.2 31.4 100.6 31.8 97.8Z" fill="' + P.hd2 + '" stroke="' + P.hdl + '" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="M45.4 79.6L44.6 88.2M54.6 79.6L55.4 88.2" stroke="' + P.lf2 + '" stroke-width="1.15" stroke-linecap="round"/>' +
        budLeaf(50, 95.6, 11.4, 4.8, 0, { fill: P.lf, line: P.lfl, vein: P.lf2, lw: 0.8 }) + budLeaf(50, 95.6, 7, 3, -48, { fill: '#A3E635', line: P.lfl, lw: 0.7 });
    },
    top: function (P, u) {
      var rim = '', i, lo = { fill: P.lf, line: P.lfl, vein: P.lf2, lw: 0.6 };
      for (i = 0; i <= 10; i++) { var t = (200 + i * 14) * Math.PI / 180, x = 50 + 31.6 * Math.cos(t), y = 60 + 22.4 * Math.sin(t), a = Math.atan2(x - 50, -(y - 60)) * 180 / Math.PI; rim += budLeaf(x, y, 5.6, 2.6, a, lo); }
      return '<path d="' + BUD_HOOD + '" fill="url(#' + u + 'sg)" stroke="' + P.hdl + '" stroke-width="1.2"/><path d="M26 22C30 15 38 11 46 10.4" fill="none" stroke="' + P.hd3 + '" stroke-width="2.4" stroke-linecap="round"/>' + rim +
        '<g class="bud-swy bud-pv" style="--d:3.4s;--a:7deg;transform-origin:50px 9.4px"><path d="M50 9.6C50 5 50.6 1.6 52 -1.6" fill="none" stroke="' + P.lf2 + '" stroke-width="1.6" stroke-linecap="round"/>' +
          budLeaf(52, -1.4, 11, 4.6, -62, { fill: P.lf, line: P.lfl, vein: P.lf2, lw: 0.8 }) + budLeaf(52, -1.4, 12.4, 5, 58, { fill: '#A3E635', line: P.lfl, vein: P.lf2, lw: 0.8 }) + '</g>' +
        budFlower(76.6, 28.6, 2.6, P.fl, P.fl2);
    },
    fx: function (P) {
      var h = '';
      [[14, 40], [86, 34], [8, 78], [92, 74], [50, -10]].forEach(function (f, i) { h += '<g style="animation-delay:' + (i * 0.12) + 's">' + budFlower(f[0], f[1], 3, P.fl, P.fl2) + '</g>'; });
      return '<g class="bud-fx bud-bloom">' + h + '</g>';
    }
  };

  /* ---------- Pixel Pal (Rare): blocky headphones, pixel shades pushed up, a pixel heart on the hoodie, on a spinning neon
     grid with hearts, coins and +1s floating up ---------- */
  BUD_SKINS.bits = {
    eyes: 'open', mouth: 'grin', hat: false,
    pal: function (P) { P.nc = '#22D3EE'; P.nm = '#F472B6'; P.ny = '#FDE047'; P.dk = '#111827'; return P; },
    defs: function (P, u) {
      return '<radialGradient id="' + u + 'gm"><stop offset="0" stop-color="' + P.nm + '" stop-opacity=".45"/><stop offset="1" stop-color="' + P.nm + '" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + u + 'gc"><stop offset="0" stop-color="' + P.nc + '" stop-opacity=".45"/><stop offset="1" stop-color="' + P.nc + '" stop-opacity="0"/></radialGradient>' +
        '<clipPath id="' + u + 'fl"><circle r="34"/></clipPath>';
    },
    aura: function (P, u) {
      var g = '', i;
      for (i = -3; i <= 3; i++) { g += 'M' + budP(i * 9.7, -36) + 'V36M' + budP(-36, i * 9.7) + 'H36'; }
      function px(x, y, map, fill, s) { var h = '', r, c; for (r = 0; r < map.length; r++) { for (c = 0; c < map[r].length; c++) { if (map[r][c] !== '.') { h += '<rect x="' + budN(x + c * s) + '" y="' + budN(y + r * s) + '" width="' + s + '" height="' + s + '" fill="' + (map[r][c] === 'w' ? '#FFFFFF' : fill) + '"/>'; } } } return h; }
      var heart = ['.x.x.', 'xwxxx', 'xxxxx', '.xxx.', '..x..'], coin = ['.x.', 'xwx', '.x.'];
      function cross(x, y, s) { return '<g class="bud-tw" style="--d:' + budN(1.4 + budR(x) * 1.6) + 's;--dl:-' + budN(budR(y) * 2) + 's">' + px(x - s * 1.5, y - s * 1.5, ['.x.', 'xxx', '.x.'], '#FFFFFF', s) + '</g>'; }
      return '<circle class="bud-c bud-pls" style="--d:3.4s" cx="28" cy="40" r="40" fill="url(#' + u + 'gm)"/><circle class="bud-c bud-pls" style="--d:3.4s;--dl:-1.7s" cx="74" cy="82" r="42" fill="url(#' + u + 'gc)"/>' +
        '<g transform="translate(50 112) scale(1 .32)"><g class="bud-c bud-rot" style="--d:28s"><g clip-path="url(#' + u + 'fl)"><path d="' + g + '" stroke="' + P.nc + '" stroke-width="1" opacity=".75"/></g><circle r="34" fill="none" stroke="' + P.nm + '" stroke-width="1.6"/></g></g>' +
        budParts(9, [8, 92, 58, 106], function (x, y, k) { return k % 3 === 2 ? px(x - 2.25, y - 2.25, coin, P.ny, 1.5) : px(x - 3, y - 3, heart, k % 2 ? P.nm : '#EF4444', 1.2); }, { d: 3.4, dy: 42, dx: 6, seed: 91 }) +
        budParts(3, [14, 86, 40, 70], function (x, y) { return '<text x="' + budN(x) + '" y="' + budN(y) + '" font-family="ui-monospace, Menlo, monospace" font-size="5.4" font-weight="800" fill="' + P.ny + '" stroke="#7C2D12" stroke-width=".5" paint-order="stroke">+1</text>'; }, { d: 2.6, dy: 22, dx: 0, seed: 95 }) +
        cross(8, 24, 1.2) + cross(92, 20, 1.4) + cross(95, 62, 1.1) + cross(5, 70, 1.2);
    },
    torso: function (P, u) {
      var map = ['.xx.xx.', 'xwxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'], h = '', r, c, s = 1.5;
      for (r = 0; r < map.length; r++) { for (c = 0; c < 7; c++) { if (map[r][c] !== '.') { h += '<rect x="' + budN(44.75 + c * s) + '" y="' + budN(86 + r * s) + '" width="' + s + '" height="' + s + '" fill="' + (map[r][c] === 'w' ? '#FFFFFF' : '#EF4444') + '"/>'; } } }
      return BUD_PART.torso(P, u) + h;
    },
    top: function (P) {
      var band = '', i;
      for (i = 0; i <= 22; i++) { var a = Math.PI * (1 + i / 22), x = 50 + 34 * Math.cos(a), y = 40 + 32 * Math.sin(a); band += '<rect x="' + budN(Math.round(x / 1.6) * 1.6 - 2.4) + '" y="' + budN(Math.round(y / 1.6) * 1.6 - 2.4) + '" width="4.8" height="4.8" fill="' + (i % 4 < 2 ? P.c : P.c2) + '"/>'; }
      band = '<g stroke="' + P.dk + '" stroke-width="1.4">' + band.replace(/fill="[^"]*"/g, 'fill="' + P.dk + '"') + '</g>' + band;
      function cup(x) { return '<path d="M' + budP(x - 4.6, 44.6) + 'h9.2v2.2h2.2v12.4h-2.2v2.2h-9.2v-2.2h-2.2v-12.4h2.2z" fill="' + P.c + '" stroke="' + P.dk + '" stroke-width="1.1"/><rect x="' + budN(x - 2.6) + '" y="48.6" width="5.2" height="8" fill="' + P.nc + '"/><rect x="' + budN(x - 2.6) + '" y="48.6" width="1.8" height="1.8" fill="#FFFFFF"/>'; }
      return band + cup(15.6) + cup(84.4) +
        '<path d="M31 21.4h13v2.2h2v4.2h-2v2.2h-13v-2.2h-2v-4.2h2zM56 21.4h13v2.2h2v4.2h-2v2.2h-13v-2.2h-2v-4.2h2zM46 23.6h8v2.2h-8z" fill="' + P.dk + '" stroke="#000000" stroke-width=".4"/><rect x="33.2" y="23.6" width="2.2" height="2.2" fill="#FFFFFF"/><rect x="58.2" y="23.6" width="2.2" height="2.2" fill="#FFFFFF"/><rect x="35.4" y="25.8" width="2.2" height="1.4" fill="#FFFFFF" opacity=".6"/><rect x="60.4" y="25.8" width="2.2" height="1.4" fill="#FFFFFF" opacity=".6"/>';
    },
    fx: function (P) {
      return '<g class="bud-fx bud-lvl"><text x="50" y="-4" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="9.6" font-weight="800" fill="' + P.ny + '" stroke="#7C2D12" stroke-width=".7" paint-order="stroke">LEVEL UP!</text></g>';
    }
  };

  /* ---------- Froggy (Rare): a frog hood with big eyes that blink, a frog suit with a cream belly and webbed feet, on a
     lily pad in a pond, with a lotus, bubbles and a fly buzzing round ---------- */
  BUD_SKINS.frog = {
    eyes: 'open', mouth: 'cat', hat: false, covers: true,
    pal: function (P) {
      P.fg = budMix('#4ADE80', P.c, 0.16); P.fg2 = budMix(P.fg, '#14532D', 0.35); P.fg3 = budMix(P.fg, '#FFFFFF', 0.4); P.fgl = budMix(P.fg, '#052E16', 0.62); P.bel = '#FEF3C7'; P.bel2 = '#E9C77B';
      P.arm = P.fg; P.armline = P.fgl; P.cuff = P.fg2; P.pants = P.fg2; return P;
    },
    defs: function (P, u) {
      return '<linearGradient id="' + u + 'fh" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="' + P.fg3 + '"/><stop offset=".55" stop-color="' + P.fg + '"/><stop offset="1" stop-color="' + P.fg2 + '"/></linearGradient>' +
        '<radialGradient id="' + u + 'fw"><stop offset="0" stop-color="#A5F3FC" stop-opacity=".85"/><stop offset=".65" stop-color="#22D3EE" stop-opacity=".35"/><stop offset="1" stop-color="#22D3EE" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="' + u + 'fp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86EFAC"/><stop offset="1" stop-color="#16A34A"/></linearGradient>';
    },
    aura: function (P, u) {
      function rip(x, d, dl) { return '<g transform="translate(' + x + ' 113) scale(1 .3)"><circle class="bud-c bud-rip" style="--d:' + d + 's;--dl:-' + dl + 's" r="9" fill="none" stroke="#ECFEFF" stroke-width="1.8"/></g>'; }
      var veins = budRing(0, 0, 22, 9, function (a, x, y, i) { return i === 0 ? '' : '<path d="M0 0L' + budP(x, y) + '"/>'; });
      var lotus = '<g transform="translate(86 109)"><ellipse cx="0" cy="2.4" rx="7" ry="1.8" fill="#4ADE80" stroke="#166534" stroke-width=".6"/>' +
        [[-4.6, -1, -40], [4.6, -1, 40], [-2.4, -2.2, -16], [2.4, -2.2, 16], [0, -2.8, 0]].map(function (p) { return '<path d="M0 2C-2 -1 -1.6 -4.6 0 -6.4C1.6 -4.6 2 -1 0 2Z" fill="#F9A8D4" stroke="#BE185D" stroke-width=".5" transform="translate(' + p[0] + ' ' + p[1] + ') rotate(' + p[2] + ')"/>'; }).join('') + '<circle cx="0" cy="-1.6" r="1.2" fill="#FDE047"/></g>';
      return '<ellipse cx="50" cy="112.6" rx="44" ry="7.4" fill="url(#' + u + 'fw)"/>' + rip(18, 2.8, 0.3) + rip(80, 3.2, 1.7) +
        '<g transform="translate(50 113) scale(1 .24)"><path d="M0 0L5 -24A24 24 0 1 1 -5 -24Z" fill="url(#' + u + 'fp)" stroke="#166534" stroke-width="2.4" stroke-linejoin="round"/><g stroke="#15803D" stroke-width="1.6" opacity=".7">' + veins + '</g></g>' +
        lotus + budParts(6, [22, 78, 104, 112], function (x, y, i, c) { return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(0.8 + c) + '" fill="#ECFEFF" fill-opacity=".35" stroke="#FFFFFF" stroke-width=".5"/>'; }, { d: 3.2, dy: 22, dx: 4, seed: 101 }) +
        '<g transform="translate(84 26)"><g class="bud-f8x"><g class="bud-f8y"><ellipse cx="0" cy="0" rx="2" ry="1.4" fill="#1F2937"/><g class="bud-wing"><ellipse cx="-1" cy="-1.8" rx="1.6" ry="1" fill="#E0F2FE" fill-opacity=".85" stroke="#7DD3FC" stroke-width=".3"/><ellipse cx="1" cy="-1.8" rx="1.6" ry="1" fill="#E0F2FE" fill-opacity=".85" stroke="#7DD3FC" stroke-width=".3"/></g><circle cx="1.6" cy="-.2" r=".5" fill="#F87171"/></g></g></g>';
    },
    torso: function (P, u) {
      return '<path d="' + BUD_TORSO + '" fill="url(#' + u + 'fh)" stroke="' + P.fgl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<ellipse cx="50" cy="91.4" rx="9.4" ry="9.8" fill="' + P.bel + '" stroke="' + P.bel2 + '" stroke-width=".9"/><path d="M43 88.4Q50 90.4 57 88.4M42.6 92.4Q50 94.4 57.4 92.4M43.4 96.4Q50 98.2 56.6 96.4" fill="none" stroke="' + P.bel2 + '" stroke-width=".6" opacity=".8"/>' +
        '<circle cx="36.6" cy="85.6" r="1.6" fill="' + P.fg2 + '" opacity=".7"/><circle cx="63.6" cy="88" r="2" fill="' + P.fg2 + '" opacity=".7"/><circle cx="35.4" cy="93" r="1.2" fill="' + P.fg2 + '" opacity=".7"/><circle cx="64.6" cy="95" r="1.3" fill="' + P.fg2 + '" opacity=".7"/>';
    },
    legs: function (P, u) {
      function leg(x, side) {
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 99.4, x, 106.6, 7, P.fg2, P.fgl) +
          '<circle cx="' + budN(x - 4.6) + '" cy="112.6" r="1.9" fill="' + P.fg + '" stroke="' + P.fgl + '" stroke-width=".9"/><circle cx="' + budN(x + 4.6) + '" cy="112.6" r="1.9" fill="' + P.fg + '" stroke="' + P.fgl + '" stroke-width=".9"/><circle cx="' + x + '" cy="113.4" r="2" fill="' + P.fg + '" stroke="' + P.fgl + '" stroke-width=".9"/>' +
          '<path d="M' + budP(x - 5.6, 111) + 'C' + budP(x - 5.6, 107.4) + ' ' + budP(x - 2.6, 106.2) + ' ' + budP(x, 106.2) + 'C' + budP(x + 2.6, 106.2) + ' ' + budP(x + 5.6, 107.4) + ' ' + budP(x + 5.6, 111) + 'C' + budP(x + 3, 113) + ' ' + budP(x - 3, 113) + ' ' + budP(x - 5.6, 111) + 'Z" fill="url(#' + u + 'fh)" stroke="' + P.fgl + '" stroke-width="1"/></g>';
      }
      return leg(45.2, 'l') + leg(54.8, 'r');
    },
    top: function (P, u) {
      function eye(x) {
        return '<circle cx="' + x + '" cy="13.4" r="8.6" fill="url(#' + u + 'fh)" stroke="' + P.fgl + '" stroke-width="1.1"/><g class="bud-feye bud-pv" style="transform-origin:' + x + 'px 13.6px"><circle cx="' + x + '" cy="13.6" r="6" fill="#FFFFFF" stroke="' + P.fgl + '" stroke-width=".8"/>' +
          '<ellipse cx="' + budN(x + (x < 50 ? 0.8 : -0.8)) + '" cy="14.2" rx="2.7" ry="3.3" fill="#111827"/><circle cx="' + budN(x - 0.6) + '" cy="12.2" r="1.2" fill="#FFFFFF"/></g>';
      }
      return '<path d="' + BUD_HOOD + '" fill="url(#' + u + 'fh)" stroke="' + P.fgl + '" stroke-width="1.2"/>' + eye(32.6) + eye(67.4) +
        '<path d="M35 31Q50 38.4 65 31" fill="none" stroke="' + P.fgl + '" stroke-width="1.4" stroke-linecap="round"/><circle cx="47" cy="24.6" r=".7" fill="' + P.fgl + '"/><circle cx="53" cy="24.6" r=".7" fill="' + P.fgl + '"/>' +
        '<ellipse cx="26.6" cy="31.6" rx="2.8" ry="1.6" fill="#FB7185" opacity=".45"/><ellipse cx="73.4" cy="31.6" rx="2.8" ry="1.6" fill="#FB7185" opacity=".45"/>' +
        '<path d="' + BUD_HOODIN + '" fill="none" stroke="' + P.fg2 + '" stroke-width="2.4" opacity=".5"/><path d="M22 30C24 25 27 22 30 20.6" fill="none" stroke="' + P.fg3 + '" stroke-width="2" stroke-linecap="round"/>';
    }
  };

  /* ---------- Knight (Rare): steel armor over a tabard in your color, a plumed helmet with the visor up, a shield and a
     cape, a sword on the back and a banner flying behind ---------- */
  BUD_SKINS.knight = {
    eyes: 'open', mouth: 'smile', hat: false, covers: true,
    pal: function (P) {
      P.st = '#E5EAF1'; P.st2 = '#9AA7BA'; P.st3 = '#FFFFFF'; P.stl = '#334155'; P.gold = '#FBBF24'; P.goldl = '#92400E';
      P.cp = budMix(P.c, '#1E1B2E', 0.35); P.cp2 = budMix(P.cp, '#000000', 0.3);
      P.arm = P.st; P.armline = P.stl; P.cuff = P.st2; P.hand = '#B8C2D1'; P.handline = P.stl; P.pants = '#475569'; return P;
    },
    defs: function (P, u) {
      return '<linearGradient id="' + u + 'kg" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="' + P.st3 + '"/><stop offset=".5" stop-color="' + P.st + '"/><stop offset="1" stop-color="' + P.st2 + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'kc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.cp + '"/><stop offset="1" stop-color="' + P.cp2 + '"/></linearGradient>' +
        '<radialGradient id="' + u + 'ka"><stop offset="0" stop-color="#E0E7FF" stop-opacity=".7"/><stop offset="1" stop-color="#E0E7FF" stop-opacity="0"/></radialGradient>';
    },
    aura: function (P, u) {
      var tiles = budRing(0, 0, 34, 12, function (a, x, y) { return '<path d="M' + budP(x * 0.5, y * 0.5) + 'L' + budP(x, y) + '"/>'; });
      return '<circle class="bud-c bud-pls" style="--d:4s" cx="50" cy="60" r="56" fill="url(#' + u + 'ka)"/>' +
        '<g transform="translate(50 113) scale(1 .28)"><circle r="34" fill="#CBD5E1" opacity=".55"/><circle r="17" fill="none" stroke="#94A3B8" stroke-width="1.4"/><g stroke="#94A3B8" stroke-width="1.4">' + tiles + '</g><circle r="34" fill="none" stroke="#94A3B8" stroke-width="1.6"/></g>' +
        '<path d="M90 114V30" stroke="#7C4A1E" stroke-width="1.8" stroke-linecap="round"/><circle cx="90" cy="29.4" r="1.6" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".6"/>' +
        '<g class="bud-wave bud-pv" style="--d:2.4s;transform-origin:90px 38px"><path d="M90.6 31.6H106L101.6 38.4L106 45.2H90.6Z" fill="' + P.c + '" stroke="' + P.cl + '" stroke-width=".9" stroke-linejoin="round"/><path d="' + budStar5(97, 38.4, 3.2) + '" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".4"/></g>' +
        budParts(6, [14, 86, 96, 112], function (x, y, i, c) { return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(0.6 + c * 0.6) + '" fill="#CBD5E1"/>'; }, { d: 3.4, dy: 20, dx: 6, seed: 111 });
    },
    back: function (P, u) {
      return '<path d="M37.4 78C32 88 27.4 100 25.4 110.6C33 108.8 41 110.6 50 109.8C59 110.6 67 108.8 74.6 110.6C72.6 100 68 88 62.6 78Z" fill="url(#' + u + 'kc)" stroke="' + P.cp2 + '" stroke-width="1.1" stroke-linejoin="round"/><path d="M26.6 108.4C34 106.8 42 108.4 50 107.8C58 108.4 66 106.8 73.4 108.4" fill="none" stroke="' + P.gold + '" stroke-width=".9"/>' +
        '<g transform="translate(67.4 71) rotate(32)"><rect x="-1.2" y="-6" width="2.4" height="9" rx=".8" fill="#7C4A1E" stroke="#3B2310" stroke-width=".6"/><rect x="-5" y="2.6" width="10" height="2.2" rx="1" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".6"/><circle cx="0" cy="-7" r="1.7" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".6"/></g>';
    },
    torso: function (P, u) {
      return '<path d="' + BUD_TORSO + '" fill="url(#' + u + 'kg)" stroke="' + P.stl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M42.4 77.6H57.6L59.4 102.2H40.6Z" fill="' + P.c + '" stroke="' + P.cl + '" stroke-width=".9" stroke-linejoin="round"/><path d="M43.6 79H56.4L57.9 100.8H42.1Z" fill="none" stroke="' + P.gold + '" stroke-width=".8"/>' +
        '<path d="' + budStar5(50, 87.6, 4.4) + '" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".6" stroke-linejoin="round"/>' +
        '<path d="M36.4 82.6C37 90 37.6 95 38 99M63.6 82.6C63 90 62.4 95 62 99" fill="none" stroke="' + P.st3 + '" stroke-width="1.2" opacity=".8" stroke-linecap="round"/>' +
        '<rect x="32.6" y="95.6" width="34.8" height="3.6" rx="1.4" fill="#7C4A1E" stroke="#3B2310" stroke-width=".8"/><rect x="47.6" y="95.2" width="4.8" height="4.4" rx="1" fill="none" stroke="' + P.gold + '" stroke-width="1"/>';
    },
    arm: function (P, side, u) {
      var m = side < 0 ? -1 : 1, sx = 50 + m * 12.8, ex = 50 + m * 18.4, hx = 50 + m * 19;
      var h = budLimb(sx, 80.6, ex, 92.4, 7.2, P.st, P.stl) + '<path d="M' + budP(ex - m * 3.8, 88.6) + 'L' + budP(ex + m * 3.6, 87.4) + 'L' + budP(ex + m * 4.4, 93.6) + 'L' + budP(ex - m * 3.4, 94.4) + 'Z" fill="url(#' + u + 'kg)" stroke="' + P.stl + '" stroke-width=".9" stroke-linejoin="round"/>' +
        '<circle cx="' + budN(hx) + '" cy="96.2" r="3.9" fill="' + P.hand + '" stroke="' + P.handline + '" stroke-width="1.1"/>' +
        '<path d="M' + budP(sx - m * 4.4, 80.4) + 'C' + budP(sx - m * 2, 74.6) + ' ' + budP(sx + m * 5.4, 74.8) + ' ' + budP(sx + m * 7.6, 81) + 'C' + budP(sx + m * 4, 79.6) + ' ' + budP(sx, 80.2) + ' ' + budP(sx - m * 4.4, 80.4) + 'Z" fill="url(#' + u + 'kg)" stroke="' + P.stl + '" stroke-width="1"/>' +
        '<path d="M' + budP(sx - m * 2.2, 82.2) + 'C' + budP(sx, 78.6) + ' ' + budP(sx + m * 5.2, 78.8) + ' ' + budP(sx + m * 7.4, 83.8) + 'C' + budP(sx + m * 4, 82.4) + ' ' + budP(sx + m * 1, 82.8) + ' ' + budP(sx - m * 2.2, 82.2) + 'Z" fill="url(#' + u + 'kg)" stroke="' + P.stl + '" stroke-width=".9"/>';
      if (side < 0) {
        h += '<g transform="translate(29.4 96.4)"><path d="M-7.6 -8.6H7.6L7.2 0C6.6 5.4 3.4 8.6 0 10.2C-3.4 8.6 -6.6 5.4 -7.2 0Z" fill="' + P.c + '" stroke="' + P.goldl + '" stroke-width="1.1" stroke-linejoin="round"/><path d="M-6.2 -7.2H6.2L5.8 0C5.3 4.4 2.7 7 0 8.4C-2.7 7 -5.3 4.4 -5.8 0Z" fill="none" stroke="' + P.gold + '" stroke-width="1"/>' +
          '<path d="' + budStar5(0, -0.4, 4) + '" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".5" stroke-linejoin="round"/><path d="M-5 -6.4C-4.4 -3 -4 -1 -3.4 1" stroke="#FFFFFF" stroke-width="1" opacity=".55" fill="none" stroke-linecap="round"/></g>';
      }
      return h;
    },
    legs: function (P, u) {
      function leg(x, side) {
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 99.4, x, 105, 7, P.st2, P.stl) +
          '<path d="M' + budP(x - 6.2, 113.8) + 'V109.4C' + budP(x - 6.2, 106.8) + ' ' + budP(x - 3.4, 105) + ' ' + budP(x, 105) + 'C' + budP(x + 3.4, 105) + ' ' + budP(x + 6.2, 106.8) + ' ' + budP(x + 6.2, 109.4) + 'V113.8Z" fill="url(#' + u + 'kg)" stroke="' + P.stl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
          '<path d="M' + budP(x - 6, 109.6) + 'H' + budN(x + 6) + 'M' + budP(x - 6, 112) + 'H' + budN(x + 6) + '" stroke="' + P.st2 + '" stroke-width=".8"/></g>';
      }
      return leg(45.2, 'l') + leg(54.8, 'r');
    },
    top: function (P, u) {
      var rv = '';
      [[22, 46], [26.6, 38.6], [33.4, 33.6], [66.6, 33.6], [73.4, 38.6], [78, 46]].forEach(function (p) { rv += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r=".8" fill="' + P.st2 + '" stroke="' + P.stl + '" stroke-width=".4"/>'; });
      return '<g class="bud-swy bud-pv" style="--d:3s;--a:4deg;transform-origin:50px 10px"><path d="M48 10.4C46 2 52 -4.4 60.4 -4.4C70.6 -4.4 79 3.6 83 14C77 9.2 70.6 7.2 64.6 8C68.6 10.4 71.4 13.4 72.6 17.4C66.6 13.4 60.4 12.2 55.4 13.2C57.2 14.4 58.2 16.4 58.4 18.6C54.6 15.6 51.2 13.2 48 10.4Z" fill="' + P.c + '" stroke="' + P.cl + '" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="M52 4C58 0 66 0 72 4" fill="none" stroke="' + P.c3 + '" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></g>' +
        '<path d="M16.8 57C13.8 29 29.6 9.4 50 9.4C70.4 9.4 86.2 29 83.2 57C80.2 48.8 75 42.6 67.8 40C57.8 36.6 42.2 36.6 32.2 40C25 42.6 19.8 48.8 16.8 57Z" fill="url(#' + u + 'kg)" stroke="' + P.stl + '" stroke-width="1.2"/>' +
        '<path d="M50 9.6V23" stroke="' + P.st2 + '" stroke-width="1.6"/><path d="M24 22C30 14 40 10.6 50 10.4" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M23.4 33.4C29.6 25.8 39.6 22.6 50 22.6C60.4 22.6 70.4 25.8 76.6 33.4L74.4 36.6C68.2 30.4 59.6 28.2 50 28.2C40.4 28.2 31.8 30.4 25.6 36.6Z" fill="' + P.st2 + '" stroke="' + P.stl + '" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="M36 27.4h6M45 26.2h10M58 27.4h6" stroke="' + P.stl + '" stroke-width="1" stroke-linecap="round"/>' + rv;
    },
    fore: function () { return budTwinkles([[38, 13, 2.4], [22, 88, 2.2]], '#FFFFFF', 113); }
  };
  /* ---------- shapes for the Epic, Legendary and Mythic skins below ---------- */
  /* a hem that drips, drawn right to left from x0 to x1 along y; drips: [x, width, length] */
  function budDripHem(x0, x1, y, drips) {
    var d = '';
    drips.slice().sort(function (a, b) { return b[0] - a[0]; }).forEach(function (k) {
      var x = k[0], w = k[1] / 2, L = k[2];
      d += 'L' + budP(x + w + 1.2, y) + 'Q' + budP(x + w, y) + ' ' + budP(x + w, y + 1.2) + 'C' + budP(x + w, y + L * 0.7) + ' ' + budP(x + w * 0.9, y + L) + ' ' + budP(x, y + L) +
        'C' + budP(x - w * 0.9, y + L) + ' ' + budP(x - w, y + L * 0.7) + ' ' + budP(x - w, y + 1.2) + 'Q' + budP(x - w, y) + ' ' + budP(x - w - 1.2, y);
    });
    return d + 'L' + budP(x1, y);
  }
  /* one drip hanging from (x, y), w wide and L long: its fill, then its outline without the top, so it melts into what it hangs from */
  function budDrip(x, y, w, L, fill, line) {
    w = w / 2;
    var sides = 'M' + budP(x - w, y) + 'C' + budP(x - w, y + L * 0.7) + ' ' + budP(x - w * 0.9, y + L) + ' ' + budP(x, y + L) + 'C' + budP(x + w * 0.9, y + L) + ' ' + budP(x + w, y + L * 0.7) + ' ' + budP(x + w, y);
    return '<path d="M' + budP(x - w - 1.4, y - 1.8) + 'Q' + budP(x - w, y - 1) + ' ' + sides.slice(1) + 'Q' + budP(x + w, y - 1) + ' ' + budP(x + w + 1.4, y - 1.8) + 'Z" fill="' + fill + '"/>' +
      '<path d="' + sides + '" fill="none" stroke="' + line + '" stroke-width=".9" stroke-linecap="round"/><ellipse cx="' + budN(x - w * 0.4) + '" cy="' + budN(y + L * 0.55) + '" rx=".5" ry="' + budN(Math.min(1.1, L * 0.18)) + '" fill="#FFFFFF" opacity=".65"/>';
  }
  /* a little slime with a face, sitting on (x, y), s times its size; it squashes and bounces (--dl shifts its timing) */
  function budSlime(P, u, x, y, s, dl) {
    return '<g transform="translate(' + budP(x, y) + ') scale(' + s + ')"><g class="bud-mini" style="--dl:-' + budN(dl) + 's">' +
      '<path d="M-6.2 0C-6.6 -4.8 -3.6 -8.2 0 -8.2C3.6 -8.2 6.6 -4.8 6.2 0C4 .9 -4 .9 -6.2 0Z" fill="url(#' + u + 'sp)" stroke="' + P.sll + '" stroke-width=".8"/>' +
      '<ellipse cx="-3" cy="-5.4" rx="1.7" ry=".9" fill="#FFFFFF" opacity=".75" transform="rotate(-32 -3 -5.4)"/><circle cx="3.6" cy="-2.2" r=".5" fill="#FFFFFF" opacity=".6"/>' +
      '<ellipse cx="-1.9" cy="-3.3" rx=".8" ry="1.15" fill="#1E0B3B"/><ellipse cx="1.9" cy="-3.3" rx=".8" ry="1.15" fill="#1E0B3B"/><circle cx="-1.65" cy="-3.75" r=".32" fill="#FFFFFF"/><circle cx="2.15" cy="-3.75" r=".32" fill="#FFFFFF"/>' +
      '<path d="M-.9 -1.7Q0 -.9 .9 -1.7" fill="none" stroke="#1E0B3B" stroke-width=".45" stroke-linecap="round"/><ellipse cx="-3.6" cy="-1.9" rx="1" ry=".5" fill="#FF7A8C" opacity=".45"/><ellipse cx="3.6" cy="-1.9" rx="1" ry=".5" fill="#FF7A8C" opacity=".45"/></g></g>';
  }
  /* a puff of smoke: three soft balls, the back one shaded */
  function budCloud(x, y, r) {
    return '<g opacity=".85"><circle cx="' + budN(x + r * 0.55) + '" cy="' + budN(y - r * 0.2) + '" r="' + budN(r * 0.8) + '" fill="#CBD5E1"/><circle cx="' + budN(x - r * 0.5) + '" cy="' + budN(y) + '" r="' + budN(r * 0.75) + '" fill="#E2E8F0"/>' +
      '<circle cx="' + budN(x) + '" cy="' + budN(y - r * 0.45) + '" r="' + budN(r) + '" fill="#F1F5F9"/><circle cx="' + budN(x - r * 0.3) + '" cy="' + budN(y - r * 0.75) + '" r="' + budN(r * 0.35) + '" fill="#FFFFFF"/></g>';
  }
  /* a shiny bubble or drop of slime */
  function budBlob(x, y, r, fill, line) {
    return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(r) + '" fill="' + fill + '" stroke="' + line + '" stroke-width=".6"/><ellipse cx="' + budN(x - r * 0.35) + '" cy="' + budN(y - r * 0.38) + '" rx="' + budN(r * 0.34) + '" ry="' + budN(r * 0.22) + '" fill="#FFFFFF" opacity=".8" transform="rotate(-35 ' + budP(x - r * 0.35, y - r * 0.38) + ')"/>';
  }

  /* ---------- Gloop (Epic): a suit of shiny jelly with bubbles rising inside it, a drippy hood with a little slime friend
     on top, and a puddle where two more slimes bounce and drops fall from the hood ---------- */
  var BUD_GLOOP = 'M34.4 80.4C35.2 77 40.2 75.6 50 75.6C59.8 75.6 64.8 77 65.6 80.4L68.2 97.8C68.6 100.6 67 102.2 64.6 102.2' +
    budDripHem(64.6, 35.4, 102.2, [[59.6, 4.4, 5.4], [47.6, 3.4, 3.2], [39.4, 4, 6.2]]) + 'C33.2 102.2 31.4 100.6 31.8 97.8Z';
  BUD_SKINS.gloop = {
    eyes: 'open', mouth: 'grin', hat: false, covers: true,
    pal: function (P) {
      P.sl = budMix('#A855F7', P.c, 0.22); P.sl2 = budMix(P.sl, '#2E1065', 0.38); P.sl3 = budMix(P.sl, '#FFFFFF', 0.5); P.sll = budMix(P.sl, '#1E0B3B', 0.64);
      P.arm = P.sl; P.armline = P.sll; P.cuff = P.sl2; P.pants = P.sl2; return P;
    },
    defs: function (P, u) {
      return '<linearGradient id="' + u + 'sg" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="' + P.sl3 + '"/><stop offset=".45" stop-color="' + P.sl + '"/><stop offset="1" stop-color="' + P.sl2 + '"/></linearGradient>' +
        '<radialGradient id="' + u + 'sw"><stop offset="0" stop-color="' + P.sl + '" stop-opacity=".42"/><stop offset="1" stop-color="' + P.sl + '" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + u + 'sp" cx=".4" cy=".32"><stop offset="0" stop-color="' + P.sl3 + '"/><stop offset=".6" stop-color="' + P.sl + '"/><stop offset="1" stop-color="' + P.sl2 + '"/></radialGradient>' +
        '<radialGradient id="' + u + 'sq" cx=".5" cy=".4"><stop offset="0" stop-color="' + P.sl3 + '" stop-opacity=".9"/><stop offset="1" stop-color="' + P.sl + '" stop-opacity=".75"/></radialGradient>' +
        '<clipPath id="' + u + 'gt"><path d="' + BUD_GLOOP + '"/></clipPath>';
    },
    aura: function (P, u) {
      function rip(x, d, dl) { return '<g transform="translate(' + x + ' 112.6) scale(1 .3)"><circle class="bud-c bud-rip" style="--d:' + d + 's;--dl:-' + dl + 's" r="8" fill="none" stroke="' + P.sl3 + '" stroke-width="1.8"/></g>'; }
      return '<circle class="bud-c bud-pls" style="--d:3.6s" cx="50" cy="66" r="54" fill="url(#' + u + 'sw)"/>' +
        '<path d="M20 112.6C20 109.2 28.6 107.8 37 108.4C44 106.6 56 106.6 63 108.2C72.4 107.6 80.4 109.4 80 112.6C79.8 115.8 71 117.6 60.6 117C52 118.4 43.4 118.2 37.4 117C27.4 117.4 20 115.8 20 112.6Z" fill="url(#' + u + 'sq)" stroke="' + P.sll + '" stroke-width=".9"/>' +
        '<path d="M27 111.2Q35 108.8 44 109.6M66 109.4Q71 109.6 74 110.8" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round" opacity=".6"/>' + rip(30, 2.6, 0.4) + rip(70, 3, 1.8) +
        budParts(8, [26, 74, 104, 112], function (x, y, i, c) { return budBlob(x, y, 0.9 + c * 1.3, P.sl3, P.sll); }, { d: 3, dy: 34, dx: 6, seed: 121 }) +
        '<g class="bud-bob" style="--d:3.4s">' + budBlob(9, 44, 3.2, 'url(#' + u + 'sp)', P.sll) + '</g><g class="bud-bob" style="--d:2.8s;--dl:-1.2s">' + budBlob(92, 36, 2.5, 'url(#' + u + 'sp)', P.sll) + '</g>' +
        '<g class="bud-bob" style="--d:3.1s;--dl:-2s">' + budBlob(88, 74, 2, 'url(#' + u + 'sp)', P.sll) + '</g><g class="bud-bob" style="--d:3.6s;--dl:-.6s">' + budBlob(12, 80, 1.8, 'url(#' + u + 'sp)', P.sll) + '</g>' +
        budSlime(P, u, 13, 113, 0.9, 0) + budSlime(P, u, 87.4, 113.6, 0.75, 0.6) + budTwinkles([[6, 20, 2], [95, 56, 2.2], [24, 6, 1.6]], '#FFFFFF', 61);
    },
    legs: function (P, u) {
      function leg(x, side) {
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 99.4, x, 105.4, 7, P.sl2, P.sll) +
          '<path d="M' + budP(x - 6.6, 112.4) + 'C' + budP(x - 7, 108) + ' ' + budP(x - 4, 105.4) + ' ' + budP(x, 105.4) + 'C' + budP(x + 4, 105.4) + ' ' + budP(x + 7, 108) + ' ' + budP(x + 6.6, 112.4) + 'C' + budP(x + 6.4, 114.6) + ' ' + budP(x - 6.4, 114.6) + ' ' + budP(x - 6.6, 112.4) + 'Z" fill="url(#' + u + 'sp)" stroke="' + P.sll + '" stroke-width="1.1"/>' +
          '<ellipse cx="' + budN(x - 2.6) + '" cy="108.2" rx="1.7" ry="1" fill="#FFFFFF" opacity=".7" transform="rotate(-20 ' + budP(x - 2.6, 108.2) + ')"/></g>';
      }
      return leg(45, 'l') + leg(55, 'r');
    },
    torso: function (P, u) {
      return '<path d="' + BUD_GLOOP + '" fill="url(#' + u + 'sg)" stroke="' + P.sll + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<g clip-path="url(#' + u + 'gt)">' + budParts(7, [36, 64, 90, 104], function (x, y, i, c) { return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(0.8 + c * 1.3) + '" fill="' + P.sl3 + '" fill-opacity=".5" stroke="#FFFFFF" stroke-width=".4" stroke-opacity=".75"/>'; }, { d: 3.4, dy: 20, dx: 3, seed: 131 }) + '</g>' +
        '<circle cx="51" cy="89.4" r="4.8" fill="url(#' + u + 'sq)" stroke="' + P.sll + '" stroke-width=".6" opacity=".9"/><ellipse cx="49.4" cy="87.6" rx="1.7" ry="1" fill="#FFFFFF" opacity=".85" transform="rotate(-30 49.4 87.6)"/>' +
        '<path d="M37.6 81.8C36.6 86 35.8 90 35.4 94" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".55"/><circle cx="36.2" cy="97.2" r=".9" fill="#FFFFFF" opacity=".6"/>' +
        '<path d="M56.4 79.4Q60.8 79.8 62.8 82.4" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>';
    },
    arm: function (P, side) {
      var m = side < 0 ? -1 : 1, sx = 50 + m * 12.8, ex = 50 + m * 18.4, hx = 50 + m * 19;
      return budLimb(sx, 80.6, ex, 92.4, 7.4, P.sl, P.sll) + '<path d="M' + budP(sx + m * 0.2, 82.4) + 'L' + budP(ex - m * 1.4, 89.4) + '" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round" opacity=".45"/>' +
        budDrip(ex - m * 2.6, 94.4, 2.4, 4.6, P.sl, P.sll) +
        '<circle cx="' + budN(hx) + '" cy="96" r="3.9" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1.1"/>';
    },
    top: function (P, u) {
      return '<path d="' + BUD_HOOD + '" fill="url(#' + u + 'sg)" stroke="' + P.sll + '" stroke-width="1.2"/>' +
        '<g fill="' + P.sl3 + '" fill-opacity=".45" stroke="#FFFFFF" stroke-opacity=".7" stroke-width=".4"><circle cx="70" cy="22" r="2.2"/><circle cx="75.6" cy="30" r="1.3"/><circle cx="66" cy="15.6" r="1"/><circle cx="23.6" cy="40.6" r="1.2"/></g>' +
        '<path d="M22.6 32C26.4 21.6 34.6 15 45 12.6" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".6"/><circle cx="20.4" cy="38.6" r="1" fill="#FFFFFF" opacity=".6"/>' +
        [[29.8, 40.6, 3.6, 6.2, 0], [42.6, 37.6, 3, 4, 1.2], [57.4, 37.6, 3.4, 7, 0.6], [70.4, 40.6, 3, 4.6, 1.8]].map(function (k) {
          return '<g class="bud-drip bud-pv" style="--dl:-' + k[4] + 's;transform-origin:' + k[0] + 'px ' + k[1] + 'px">' + budDrip(k[0], k[1], k[2], k[3], P.sl, P.sll) + '</g>';
        }).join('') +
        budDrip(16.6, 59.6, 3.4, 4.4, P.sl, P.sll) + budDrip(83.4, 59.6, 3.4, 4.4, P.sl, P.sll) + budSlime(P, u, 50, 10.2, 1.25, 0.3);
    },
    fore: function (P) {
      function drop(x, dl) { return '<circle class="bud-dropf" style="--dl:-' + dl + 's" cx="' + x + '" cy="65.4" r="1.4" fill="' + P.sl + '" stroke="' + P.sll + '" stroke-width=".6"/>'; }
      return drop(16.6, 0.4) + drop(83.4, 1.9) + budParts(4, [16, 84, 70, 100], function (x, y, i, c) { return budBlob(x, y, 1 + c, P.sl3, P.sll); }, { d: 4, dy: 30, dx: 10, seed: 141 }) +
        budTwinkles([[22, 92, 1.8], [80, 96, 2]], '#FFFFFF', 67);
    },
    fx: function (P) {
      return '<g class="bud-fx bud-splat">' + [[-30, -20], [28, -24], [-36, 2], [34, 0], [-16, -34], [16, -36], [-6, -40], [8, -28]].map(function (v, i) {
        return '<circle cx="50" cy="84" r="' + budN(1.6 + (i % 3) * 0.5) + '" fill="' + P.sl + '" stroke="' + P.sll + '" stroke-width=".6" style="--dx:' + v[0] + 'px;--dy:' + v[1] + 'px"/>';
      }).join('') + '</g>';
    }
  };

  /* ---------- Ninja (Epic): a dark gi with a sash and a scarf in the student's color, a headband with tails that flutter,
     a sword on the back, bamboo and a full moon behind, leaves that whirl round, and a smoke bomb ---------- */
  BUD_SKINS.ninja = {
    eyes: 'open', mouth: 'smirk', hat: false,
    pal: function (P) {
      P.gi = '#272C3F'; P.gi2 = '#181C29'; P.gi3 = '#3C4462'; P.gil = '#0A0D16'; P.wrap = '#E9E4D4'; P.wrap2 = '#B3AA90';
      P.rb = P.c; P.rb2 = budMix(P.c, '#160C22', 0.32); P.rb3 = budMix(P.c, '#FFFFFF', 0.3); P.rbl = budMix(P.c, '#0B0614', 0.62);
      P.arm = P.gi; P.armline = P.gil; P.cuff = P.wrap; P.pants = P.gi; return P;
    },
    defs: function (P, u) {
      return '<radialGradient id="' + u + 'mn" cx=".42" cy=".4"><stop offset="0" stop-color="#FFFBEB"/><stop offset=".7" stop-color="#FDE9B0"/><stop offset="1" stop-color="#F1C462"/></radialGradient>' +
        '<radialGradient id="' + u + 'mg"><stop offset="0" stop-color="#FDE68A" stop-opacity=".6"/><stop offset="1" stop-color="#FDE68A" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="' + u + 'ng" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="' + P.gi3 + '"/><stop offset=".55" stop-color="' + P.gi + '"/><stop offset="1" stop-color="' + P.gi2 + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'nb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3E7A38"/><stop offset=".45" stop-color="#86C973"/><stop offset="1" stop-color="#2E6629"/></linearGradient>' +
        '<pattern id="' + u + 'nm" patternUnits="userSpaceOnUse" width="2.4" height="2.4"><rect width="2.4" height="2.4" fill="#2B3142"/><path d="M0 0L2.4 2.4M2.4 0L0 2.4" stroke="#56607E" stroke-width=".35"/></pattern>' +
        budHalves(u, 'lv', 92);
    },
    /* leaves whirling round the waist; drawn twice, the half behind and the half in front */
    orbit: function () {
      var h = '', i, n = 6;
      for (i = 0; i < n; i++) {
        h += '<g class="bud-orx" style="--od:1.6s;--odl:-' + budN(i * 3.2 / n) + 's;--ox:38px;--oy:8px"><g class="bud-c bud-ory"><g class="bud-c bud-rot" style="--d:' + budN(0.9 + budR(i + 140) * 0.8) + 's">' +
          budLeaf(50, 94.8, 5.6, 2, 0, { fill: i % 2 ? '#6FBF60' : '#A3D982', line: '#1F4D1C', vein: '#1F4D1C' }) + '</g></g></g>';
      }
      return h;
    },
    aura: function (P, u) {
      function bamboo(x, top, w, dl) {
        var h = '<g class="bud-swy bud-pv" style="--d:4.6s;--a:1.4deg;--dl:-' + dl + 's;transform-origin:' + x + 'px 118px"><rect x="' + budN(x - w / 2) + '" y="' + top + '" width="' + w + '" height="' + budN(118 - top) + '" rx="' + budN(w / 2) + '" fill="url(#' + u + 'nb)" stroke="#1F4D1C" stroke-width=".6"/>', y;
        for (y = top + 14; y < 116; y += 15) { h += '<path d="M' + budP(x - w / 2 - 0.4, y) + 'H' + budN(x + w / 2 + 0.4) + '" stroke="#1F4D1C" stroke-width="1.1" stroke-linecap="round"/>'; }
        return h + budLeaf(x, top + 14, 9, 2.2, 64, { fill: '#5FA552', line: '#1F4D1C', vein: '#1F4D1C' }) + budLeaf(x, top + 29, 8, 2, -60, { fill: '#4C9443', line: '#1F4D1C', vein: '#1F4D1C' }) +
          budLeaf(x, top + 29, 7, 1.8, 76, { fill: '#7CC86A', line: '#1F4D1C', vein: '#1F4D1C' }) + '</g>';
      }
      function puff(x, y, r, dl, dx) { return '<g class="bud-c bud-puff" style="--d:2.8s;--dl:-' + dl + 's;--dx:' + dx + 'px;--dy:-5px">' + budCloud(x, y, r) + '</g>'; }
      return '<circle class="bud-c bud-pls" style="--d:4.2s" cx="80" cy="20" r="26" fill="url(#' + u + 'mg)"/><circle cx="80" cy="20" r="12.6" fill="url(#' + u + 'mn)"/>' +
        '<g fill="#E9BE5E" opacity=".5"><circle cx="75.6" cy="17" r="2.3"/><circle cx="84" cy="24.4" r="1.7"/><circle cx="83" cy="14.4" r="1.1"/><circle cx="77.4" cy="25" r=".9"/></g>' +
        '<g class="bud-drift" style="--d:9s"><path d="M60 27.4H88.6A2.6 2.6 0 0 0 88.6 22.2H85.4A3.8 3.8 0 0 0 78 21.4A3 3 0 0 0 72.6 23H62A2.2 2.2 0 0 0 60 27.4Z" fill="#475569" opacity=".5"/></g>' +
        '<g class="bud-drift" style="--d:12s;--dl:-5s"><path d="M70 33.4H96A2 2 0 0 0 96 29.4H90A3 3 0 0 0 84.6 28.4A2.4 2.4 0 0 0 80.6 29.6H72A1.9 1.9 0 0 0 70 33.4Z" fill="#334155" opacity=".4"/></g>' +
        bamboo(6, -6, 3.8, 0) + bamboo(14.4, 16, 3.2, 1.6) + bamboo(94, 40, 3, 2.6) +
        '<g clip-path="url(#' + u + 'lvu)">' + this.orbit() + '</g>' +
        puff(30, 113, 4, 0, -5) + puff(70, 113.4, 3.6, 1.2, 5) + puff(22, 110, 2.8, 2, -4) + puff(79, 110.4, 2.6, 0.6, 4) + budTwinkles([[66, 6, 1.6], [96, 8, 1.4], [58, 16, 1.2]], '#FFFBEB', 71);
    },
    hairBack: function (P, u, g) {
      if (!g) { return ''; }
      return '<g class="bud-pony bud-pv" style="transform-origin:34px 26px">' + budLocks(P, u, [[34, 26, 12, 84, 12, 6], [36, 30, 18, 90, 8, 4]], { fill: 'url(#' + u + 'hl)' }) +
        '<rect x="30" y="22.4" width="8" height="5" rx="2" fill="' + P.rb + '" stroke="' + P.rbl + '" stroke-width=".8" transform="rotate(-40 34 25)"/></g>';
    },
    back: function (P) {
      var wrap = '', i;
      for (i = 0; i < 4; i++) { wrap += '<path d="M48.4 ' + budN(59.4 + i * 2.6) + 'l3.2 2.2M51.6 ' + budN(59.4 + i * 2.6) + 'l-3.2 2.2" stroke="' + P.rb + '" stroke-width=".9"/>'; }
      return '<g transform="translate(27 2) rotate(41 50 70)"><rect x="48.2" y="70" width="3.6" height="34" rx="1.4" fill="#1B1F2C" stroke="#05070C" stroke-width=".8"/><path d="M48.2 76h3.6M48.2 80h3.6" stroke="' + P.rb + '" stroke-width=".8"/>' +
        '<rect x="48.4" y="58.6" width="3.2" height="11.4" rx="1" fill="#2E3445" stroke="#05070C" stroke-width=".7"/>' + wrap + '<rect x="48" y="56.8" width="4" height="2.2" rx=".8" fill="#C9A227" stroke="#5B4508" stroke-width=".5"/>' +
        '<ellipse cx="50" cy="70" rx="4" ry="1.3" fill="#C9A227" stroke="#5B4508" stroke-width=".6"/></g>' +
        '<g class="bud-swy bud-pv" style="--d:2.2s;--a:5deg;transform-origin:62px 80px"><g class="bud-wave bud-pv" style="--d:1.4s;transform-origin:62px 80px">' +
        '<path d="M60 78C68 76 76 79.6 84 76.6C88 75.2 92 76.4 96.4 74.2L94.6 80.6C90.6 82.4 86.4 81 82.4 82.6C75 85.4 67 82.6 59.4 84Z" fill="' + P.rb + '" stroke="' + P.rbl + '" stroke-width=".9" stroke-linejoin="round"/>' +
        '<path d="M61 82C68 84.4 74 88.4 81 88.4C85 88.4 88 90.2 91.6 89.2L89.4 94.4C85.4 95 82 93 78.4 93C71 92.8 66 88.4 60 86Z" fill="' + P.rb2 + '" stroke="' + P.rbl + '" stroke-width=".9" stroke-linejoin="round"/>' +
        '<path d="M66 80Q75 81 83 78.6" fill="none" stroke="' + P.rb3 + '" stroke-width=".8" stroke-linecap="round" opacity=".7"/></g></g>';
    },
    legs: function (P) {
      function leg(x, side) {
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 99.4, x, 106, 7.2, P.gi, P.gil) +
          '<path d="M' + budP(x - 3.5, 102.4) + 'H' + budN(x + 3.5) + 'M' + budP(x - 3.5, 104.6) + 'H' + budN(x + 3.5) + '" stroke="' + P.wrap + '" stroke-width="1.6"/>' +
          '<path d="M' + budP(x - 5.8, 112.6) + 'C' + budP(x - 6, 108.6) + ' ' + budP(x - 3.4, 106.6) + ' ' + budP(x, 106.6) + 'C' + budP(x + 3.6, 106.6) + ' ' + budP(x + 5.8, 108.6) + ' ' + budP(x + 5.6, 112.4) + 'C' + budP(x + 5.4, 114) + ' ' + budP(x + 4, 114.4) + ' ' + budP(x + 2.6, 114.2) +
          'L' + budP(x + 1.8, 112.4) + 'L' + budP(x + 1, 114.2) + 'H' + budN(x - 4.4) + 'C' + budP(x - 5.4, 114.2) + ' ' + budP(x - 5.8, 113.6) + ' ' + budP(x - 5.8, 112.6) + 'Z" fill="#1E2333" stroke="' + P.gil + '" stroke-width="1.1" stroke-linejoin="round"/>' +
          '<path d="M' + budP(x - 3.6, 108.6) + 'Q' + budP(x - 0.6, 107.4) + ' ' + budP(x + 2.6, 108.8) + '" fill="none" stroke="#4B5470" stroke-width="1" stroke-linecap="round"/></g>';
      }
      return leg(45.2, 'l') + leg(54.8, 'r');
    },
    torso: function (P, u) {
      return '<path d="' + BUD_TORSO + '" fill="url(#' + u + 'ng)" stroke="' + P.gil + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M34.4 80.4C33.6 86 32.6 92 31.8 97.8C31.6 99.6 32.2 100.8 33.4 101.6C34.8 94 35.4 86 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.gi2 + '" opacity=".6"/>' +
        '<path d="M42.6 76.4L50 88.2L57.4 76.4Z" fill="url(#' + u + 'nm)"/><path d="M40.4 76.6L50 91L53 86.4M59.6 76.6L52.6 87.6" fill="none" stroke="' + P.gi3 + '" stroke-width="2.6" stroke-linejoin="round"/>' +
        '<path d="M40.4 76.6L50 91" fill="none" stroke="#5A6488" stroke-width=".7" transform="translate(-.8 0)"/>' +
        '<path d="M32.4 92.4Q50 95.2 67.6 92.4L68.2 97.2Q50 100 31.8 97.2Z" fill="' + P.rb + '" stroke="' + P.rbl + '" stroke-width="1" stroke-linejoin="round"/><path d="M33 93.4Q50 96 67 93.4" fill="none" stroke="' + P.rb3 + '" stroke-width=".7" opacity=".7"/>' +
        '<path d="M38.4 95.6L35.4 103.6L37.8 103.2L38.8 105.6L41 96.4Z" fill="' + P.rb2 + '" stroke="' + P.rbl + '" stroke-width=".7" stroke-linejoin="round"/><ellipse cx="39" cy="95.4" rx="2.7" ry="2.2" fill="' + P.rb3 + '" stroke="' + P.rbl + '" stroke-width=".8"/>' +
        '<path d="M36.6 78.8C40.6 74.2 59.4 74.2 63.4 78.8C63.8 81.4 60.4 82.6 50 82.6S36.2 81.4 36.6 78.8Z" fill="' + P.rb + '" stroke="' + P.rbl + '" stroke-width="1"/><path d="M38.4 79.6C43 78.4 57 78.4 61.6 79.6" fill="none" stroke="' + P.rb2 + '" stroke-width=".8"/>';
    },
    arm: function (P, side) {
      var m = side < 0 ? -1 : 1, sx = 50 + m * 12.8, ex = 50 + m * 18.4, hx = 50 + m * 19;
      return budLimb(sx, 80.6, ex, 92.4, 7.4, P.gi, P.gil) +
        '<path d="M' + budP(ex - m * 0.4, 88.6) + 'L' + budP(ex + m * 0.6, 93.6) + '" stroke="' + P.wrap + '" stroke-width="7.4"/><path d="M' + budP(ex - m * 3.4, 89.4) + 'l' + budN(m * 6.4) + ' 1.6M' + budP(ex - m * 3.2, 91.8) + 'l' + budN(m * 6.4) + ' 1.6" stroke="' + P.wrap2 + '" stroke-width=".7"/>' +
        '<circle cx="' + budN(hx) + '" cy="96" r="3.9" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1.1"/>';
    },
    top: function (P) {
      return '<path d="M19.4 47.6C21.6 38 34 31.2 50 31.2C66 31.2 78.4 38 80.6 47.6L80.2 52.8C77.4 43.6 66 37.4 50 37.4C34 37.4 22.6 43.6 19.8 52.8Z" fill="' + P.rb + '" stroke="' + P.rbl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<path d="M22.4 46.4C25.6 39.4 36 33.6 50 33.6C64 33.6 74.4 39.4 77.6 46.4" fill="none" stroke="' + P.rb3 + '" stroke-width=".9" stroke-dasharray="1.6 1.2" opacity=".8"/>' +
        '<g class="bud-swy bud-pv" style="--d:1.7s;--a:8deg;transform-origin:80px 47px"><path d="M79.6 45C86 43.6 90 47 96.6 45.2L95.4 50.6C89.6 51.6 85.6 49.4 80.2 50.4Z" fill="' + P.rb2 + '" stroke="' + P.rbl + '" stroke-width=".8" stroke-linejoin="round"/>' +
        '<path d="M79.6 47.6C85 50 88 55 94 55.6L90.8 60C85.4 58 82.2 53.8 78.8 51.2Z" fill="' + P.rb + '" stroke="' + P.rbl + '" stroke-width=".8" stroke-linejoin="round"/></g>' +
        '<ellipse cx="80" cy="47.8" rx="2.8" ry="3.2" fill="' + P.rb3 + '" stroke="' + P.rbl + '" stroke-width=".9"/>';
    },
    fore: function (P, u) {
      function puff(x, y, r, dl, dx) { return '<g class="bud-c bud-puff" style="--d:2.6s;--dl:-' + dl + 's;--dx:' + dx + 'px;--dy:-4px">' + budCloud(x, y, r) + '</g>'; }
      return '<g clip-path="url(#' + u + 'lvd)">' + this.orbit() + '</g>' + puff(36, 116, 3.2, 0.8, -4) + puff(64, 116.4, 3, 2, 4) +
        '<g class="bud-fx bud-smk">' + [[50, 98, 14], [34, 106, 9], [66, 106, 9], [40, 84, 11], [60, 82, 12], [50, 66, 13], [32, 62, 9], [68, 60, 9], [50, 46, 11], [40, 34, 8], [62, 32, 8]].map(function (k, i) {
          return '<g class="bud-c" style="--dl:' + budN(i * 0.035) + 's">' + budCloud(k[0], k[1] + k[2] * 0.4, k[2]) + '</g>';
        }).join('') + '</g>';
    }
  };

  /* ---------- Wizard (Legendary): a tall hat with a floppy tip, a robe with gold stars, a staff with a glowing orb, a spellbook
     that turns its own pages, a magic circle behind and one on the ground, and rune stones circling round ---------- */
  /* made-up rune marks, each about 4.4 across, centered on 0 0 */
  var BUD_RUNES = ['M0 -2.2L1.9 1.5H-1.9ZM0 .2V.4', 'M.7 -2.2A2.2 2.2 0 1 0 .7 2.2A1.7 1.7 0 1 1 .7 -2.2Z', 'M-1.9 1.3L-.65 -1.3L.65 1.3L1.9 -1.3', 'M-1.6 -2.2H1.6L-1.6 2.2H1.6Z',
    'M-1.6 0A1.6 1.6 0 1 0 1.6 0A1.6 1.6 0 1 0 -1.6 0M0 -2.4V2.4', 'M-1.9 -1.5H1.9L0 2.2ZM-1 .2H1', 'M0 0A.8 .8 0 1 1 .8 .8A1.7 1.7 0 1 1 -.9 -1.5', 'M-1.9 0Q0 -2.6 1.9 0Q0 2.6 -1.9 0M-.1 0H.1'];
  /* two squares turned an eighth of a turn apart */
  function budOcta(r) {
    function sq(o) { var d = '', i; for (i = 0; i < 4; i++) { var a = (i * 90 + o) * Math.PI / 180; d += (i ? 'L' : 'M') + budP(r * Math.cos(a), r * Math.sin(a)); } return d + 'Z'; }
    return sq(0) + sq(45);
  }
  /* a ring of runes, r out from 0 0, each turned to face out */
  function budRuneRing(r, n, color, w) {
    return budRing(0, 0, r, n, function (a, x, y, i) { return '<path d="' + BUD_RUNES[i % BUD_RUNES.length] + '" transform="translate(' + budP(x, y) + ') rotate(' + budN(a + 90) + ')" fill="none" stroke="' + color + '" stroke-width="' + (w || 0.7) + '" stroke-linecap="round" stroke-linejoin="round"/>'; });
  }
  BUD_SKINS.wizard = {
    eyes: 'open', mouth: 'smile', hat: false, covers: true,
    pal: function (P) {
      P.wr = budMix('#5B3FD0', P.c, 0.22); P.wr2 = budMix(P.wr, '#140A33', 0.42); P.wr3 = budMix(P.wr, '#FFFFFF', 0.28); P.wrl = budMix(P.wr, '#0B0520', 0.66);
      P.gold = '#F7CF5A'; P.gold2 = '#C98A1C'; P.goldl = '#6E430B'; P.mg = '#5EEAD4'; P.mg2 = '#CCFBF1'; P.mg3 = '#0F9F8F'; P.wood = '#9A6A3A'; P.wood2 = '#5C3A1A';
      P.arm = P.wr; P.armline = P.wrl; P.cuff = P.gold; P.pants = P.wr2; return P;
    },
    defs: function (P, u) {
      return '<linearGradient id="' + u + 'wg" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="' + P.wr3 + '"/><stop offset=".5" stop-color="' + P.wr + '"/><stop offset="1" stop-color="' + P.wr2 + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'wh" x1="0" y1="0" x2="1" y2=".3"><stop offset="0" stop-color="' + P.wr3 + '"/><stop offset=".5" stop-color="' + P.wr + '"/><stop offset="1" stop-color="' + P.wr2 + '"/></linearGradient>' +
        '<radialGradient id="' + u + 'wm"><stop offset="0" stop-color="' + P.mg + '" stop-opacity=".42"/><stop offset=".6" stop-color="' + P.wr3 + '" stop-opacity=".16"/><stop offset="1" stop-color="' + P.wr3 + '" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + u + 'wo" cx=".38" cy=".34"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color="' + P.mg2 + '"/><stop offset=".75" stop-color="' + P.mg + '"/><stop offset="1" stop-color="' + P.mg3 + '"/></radialGradient>' +
        '<radialGradient id="' + u + 'wq"><stop offset="0" stop-color="' + P.mg + '" stop-opacity=".7"/><stop offset="1" stop-color="' + P.mg + '" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="' + u + 'wb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF9EA"/><stop offset="1" stop-color="#EBD9AE"/></linearGradient>' + budHalves(u, 'wz', 94);
    },
    orbit: function (P, u) {
      var h = '', i;
      for (i = 0; i < 3; i++) {
        h += '<g class="bud-orx" style="--od:2.4s;--odl:-' + budN(i * 1.6) + 's;--ox:40px;--oy:8px"><g class="bud-c bud-ory"><circle cx="50" cy="94" r="5.4" fill="url(#' + u + 'wq)"/>' +
          '<path d="M50 90.2L53.4 92.4L52.4 96.6H47.6L46.6 92.4Z" fill="#6B7280" stroke="#1F2937" stroke-width=".7" stroke-linejoin="round"/><path d="M50 90.6L52.8 92.5L50.4 93.4Z" fill="#9CA3AF"/>' +
          '<path d="' + BUD_RUNES[i * 2 + 1] + '" transform="translate(50 93.8) scale(.62)" fill="none" stroke="' + P.mg2 + '" stroke-width="1.2" stroke-linecap="round"/></g></g>';
      }
      return h;
    },
    aura: function (P, u) {
      var V = '<circle r="45.6" fill="none" stroke="' + P.mg + '" stroke-width="1.1"/><circle r="40.4" fill="none" stroke="' + P.mg + '" stroke-width=".6"/>' + budRuneRing(43, 16, P.mg2, 0.75) +
        '<path d="' + budOcta(37) + '" fill="none" stroke="' + P.mg + '" stroke-width=".8" opacity=".85"/><circle r="26" fill="none" stroke="' + P.mg + '" stroke-width=".6" opacity=".8"/>' + budRing(0, 0, 37, 8, function (a, x, y) { return '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="1.3" fill="' + P.mg2 + '"/>'; });
      var G = '<circle r="34" fill="none" stroke="' + P.mg + '" stroke-width="1.8"/><circle r="28.6" fill="none" stroke="' + P.mg + '" stroke-width="1"/>' + budRuneRing(31.3, 12, P.mg2, 1.1) + '<path d="' + budOcta(28.6) + '" fill="none" stroke="' + P.mg + '" stroke-width="1"/>';
      var book = '<g class="bud-bob" style="--d:3.4s"><g transform="rotate(-10 13 66)"><ellipse cx="13" cy="66" rx="13" ry="9" fill="url(#' + u + 'wq)" opacity=".7"/>' +
        '<path d="M13 71.6Q6.8 69 .6 70.8L1.2 59.4Q7.4 57.6 13 60.4Q18.6 57.6 24.8 59.4L25.4 70.8Q19.2 69 13 71.6Z" fill="' + P.wr2 + '" stroke="' + P.goldl + '" stroke-width=".8" stroke-linejoin="round"/>' +
        '<path d="M13 70.2Q7.4 67.8 2 69.4L2.6 60.4Q7.6 58.8 13 61.4Z" fill="url(#' + u + 'wb)" stroke="#B08A4A" stroke-width=".5"/><path d="M13 70.2Q18.6 67.8 24 69.4L23.4 60.4Q18.4 58.8 13 61.4Z" fill="url(#' + u + 'wb)" stroke="#B08A4A" stroke-width=".5"/>' +
        '<path d="M4.4 62.6Q8 61.6 11 62.8M4.6 64.8Q8 63.8 11 65M4.8 67Q8 66 11 67.2" fill="none" stroke="#8A6B3A" stroke-width=".45" opacity=".8"/><path d="M15.4 62.8Q18.6 61.6 21.6 62.6" fill="none" stroke="#8A6B3A" stroke-width=".45" opacity=".8"/>' +
        '<path d="' + BUD_RUNES[6] + '" transform="translate(18.4 66) scale(.8)" fill="none" stroke="' + P.mg3 + '" stroke-width=".8"/>' +
        '<path class="bud-page" d="M13 70.2Q18.6 67.8 24 69.4L23.4 60.4Q18.4 58.8 13 61.4Z" fill="url(#' + u + 'wb)" stroke="#B08A4A" stroke-width=".5"/></g>' +
        budParts(5, [6, 20, 54, 60], function (x, y, i) { return i % 2 ? budStar4(x, y, 1.5, P.mg2, 0.22) : '<path d="' + BUD_RUNES[i] + '" transform="translate(' + budP(x, y) + ') scale(.55)" fill="none" stroke="' + P.mg + '" stroke-width="1"/>'; }, { d: 2.6, dy: 22, dx: 6, seed: 171 }) + '</g>';
      return '<circle class="bud-c bud-pls" style="--d:3.8s" cx="50" cy="62" r="58" fill="url(#' + u + 'wm)"/>' +
        '<g class="bud-fx bud-spell"><g transform="translate(50 60)"><g class="bud-c bud-spellc"><circle r="34" fill="' + P.mg + '" fill-opacity=".12" stroke="' + P.mg + '" stroke-width="1.6"/><path d="' + budOcta(30) + '" fill="none" stroke="' + P.mg2 + '" stroke-width="1.1"/>' +
        budRuneRing(37.6, 14, P.mg2, 0.9) + budRing(0, 0, 42, 8, function (a, x, y) { return budStar4(x, y, 3, P.gold, 0.22); }) + '</g></g></g>' +
        '<g transform="translate(50 60)" opacity=".8"><g class="bud-c bud-mcv">' + V + '</g></g><g transform="translate(50 60)"><g class="bud-c bud-rotr" style="--d:50s"><circle r="51.6" fill="none" stroke="' + P.gold + '" stroke-width="1.6" stroke-dasharray=".6 4.4" stroke-linecap="round" opacity=".8"/></g></g>' +
        '<g transform="translate(50 113) scale(1 .3)"><g class="bud-c bud-rotr" style="--d:26s">' + G + '</g></g>' +
        book + '<g clip-path="url(#' + u + 'wzu)">' + this.orbit(P, u) + '</g>' +
        budParts(10, [10, 90, 70, 112], function (x, y, i, c) { return i % 3 === 0 ? budStar4(x, y, 1.9, P.gold, 0.22) : '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(0.5 + c * 0.6) + '" fill="' + (i % 2 ? P.mg2 : '#FFFFFF') + '"/>'; }, { d: 3.6, dy: 40, dx: 8, seed: 181 }) +
        budTwinkles([[92, 52, 2.2], [6, 30, 1.8], [96, 96, 1.6], [30, 4, 1.6]], P.gold, 83);
    },
    back: function (P) {
      return '<g class="bud-wave bud-pv" style="--d:3.6s;transform-origin:50px 78px"><path d="M36 78C29 88 22.4 101 17.6 113.4Q24 110.6 30 113.6Q36 110.8 42.4 113.6Q50 110.8 57.6 113.6Q64 110.8 70 113.6Q76 110.6 82.4 113.4C77.6 101 71 88 64 78Z" fill="' + P.wr2 + '" stroke="' + P.wrl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<path d="M18.6 111.6Q24 109 30 112M70 112Q76 109 81.4 111.6" fill="none" stroke="' + P.gold + '" stroke-width="1.1" stroke-linecap="round"/></g>' +
        '<path d="M36.6 79.4C32.6 74 32 68.6 34.6 64.6L40.6 76.6ZM63.4 79.4C67.4 74 68 68.6 65.4 64.6L59.4 76.6Z" fill="' + P.wr2 + '" stroke="' + P.goldl + '" stroke-width=".9" stroke-linejoin="round"/>';
    },
    legs: function (P) {
      function boot(x, s, side) {
        function X(v) { return budN(x + s * v); }
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 100, x, 106.4, 7, P.wr2, P.wrl) +
          '<path d="M' + X(-4.6) + ' 113.6C' + X(-5) + ' 109 ' + X(-3) + ' 107.2 ' + X(0) + ' 107.2C' + X(3) + ' 107.2 ' + X(4.6) + ' 108.6 ' + X(5.6) + ' 110.6C' + X(7.2) + ' 111 ' + X(8.6) + ' 110 ' + X(9.2) + ' 108.4C' + X(9.6) + ' 111.6 ' + X(7.8) + ' 114.2 ' + X(4) + ' 114.2H' + X(-3.6) + 'C' + X(-4.4) + ' 114.2 ' + X(-4.6) + ' 113.9 ' + X(-4.6) + ' 113.6Z" fill="' + P.wr2 + '" stroke="' + P.wrl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
          '<circle cx="' + X(9.2) + '" cy="108.2" r=".9" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".4"/><path d="M' + X(-4.4) + ' 112.4H' + X(5.6) + '" stroke="' + P.gold2 + '" stroke-width=".9"/></g>';
      }
      return boot(45, -1, 'l') + boot(55, 1, 'r');
    },
    torso: function (P, u) {
      var robe = 'M34.4 80.4C35.2 77 40.2 75.6 50 75.6C59.8 75.6 64.8 77 65.6 80.4L70.6 104.4C71 107 69.4 108.6 67 108.6H33C30.6 108.6 29 107 29.4 104.4Z';
      return '<path d="' + robe + '" fill="url(#' + u + 'wg)" stroke="' + P.wrl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M34.4 80.4L29.4 104.4C29.2 106 29.8 107.4 31 108.2C32.6 98 34.6 88 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.wr2 + '" opacity=".55"/>' +
        '<path d="M29.8 104.8Q50 107 70.2 104.8" fill="none" stroke="' + P.gold + '" stroke-width="1.8"/><path d="M30 106.6Q50 108.6 70 106.6" fill="none" stroke="' + P.gold2 + '" stroke-width=".6"/>' +
        '<path d="M50 82.6V108.4" stroke="' + P.gold + '" stroke-width="2.4"/><path d="M51.1 82.6V108.4" stroke="' + P.gold2 + '" stroke-width=".6"/>' +
        '<path d="M41.4 76.6L50 84.4L58.6 76.6" fill="none" stroke="' + P.gold + '" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M33.4 91.2Q50 93.8 66.6 91.2L67.2 95.4Q50 98 32.8 95.4Z" fill="' + P.wr2 + '" stroke="' + P.goldl + '" stroke-width=".8" stroke-linejoin="round"/>' +
        '<path d="M50 90.4L52.8 93.6L50 96.8L47.2 93.6Z" fill="' + P.mg + '" stroke="' + P.goldl + '" stroke-width=".8"/><circle cx="49.2" cy="92.8" r=".6" fill="#FFFFFF"/>' +
        '<path d="M42.4 82.8a2.6 2.6 0 1 0 2 4.4a2 2 0 1 1 -2 -4.4z" fill="' + P.gold + '"/>' + budStar4(57.8, 86, 1.8, P.gold, 0.22) + budStar4(40.6, 101.4, 2, P.gold, 0.22) + budStar4(60, 100.4, 1.5, P.gold, 0.22) +
        '<circle cx="44.6" cy="99" r=".55" fill="' + P.gold + '"/><circle cx="56" cy="104.4" r=".55" fill="' + P.gold + '"/><circle cx="62.6" cy="88.6" r=".5" fill="' + P.gold + '"/>';
    },
    arm: function (P, side, u) {
      function bell(x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L, px = -uy, py = ux;
        function pt(t, w) { return budP(x2 + ux * t + px * w, y2 + uy * t + py * w); }
        return '<path d="M' + pt(-1, -3.7) + 'L' + pt(-1, 3.7) + 'L' + pt(4.4, 5.8) + 'Q' + pt(6.2, 0) + ' ' + pt(4.4, -5.8) + 'Z" fill="' + P.wr + '" stroke="' + P.wrl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
          '<path d="M' + pt(4.4, 5.8) + 'Q' + pt(6.2, 0) + ' ' + pt(4.4, -5.8) + '" fill="none" stroke="' + P.gold + '" stroke-width="1.4" stroke-linecap="round"/>';
      }
      if (side < 0) { return budLimb(37.2, 80.6, 32.8, 89.6, 7.4, P.wr, P.wrl) + bell(37.2, 80.6, 32.8, 89.6) + '<circle cx="30.6" cy="96.4" r="3.9" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1.1"/>'; }
      var spk = budRing(77.6, 15.4, 1, 8, function (a, x, y, i) { var t = a * Math.PI / 180; return '<g class="bud-spk" style="--dx:' + budN(Math.cos(t) * 16) + 'px;--dy:' + budN(Math.sin(t) * 16) + 'px">' + budStar4(77.6, 15.4, i % 2 ? 1.6 : 2.4, i % 2 ? P.gold : P.mg2, 0.22) + '</g>'; });
      return '<path d="M77.6 116.4V21" stroke="' + P.wood2 + '" stroke-width="3.4" stroke-linecap="round"/><path d="M77.6 116.4V21" stroke="' + P.wood + '" stroke-width="1.9" stroke-linecap="round"/>' +
        '<path d="M76.9 40v3M78.3 58v3M76.9 104v3" stroke="' + P.wood2 + '" stroke-width=".7" stroke-linecap="round"/><rect x="75.6" y="25" width="4" height="2.4" rx=".8" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".5"/>' +
        '<circle class="bud-c bud-pls" style="--d:2s" cx="77.6" cy="15.4" r="11" fill="url(#' + u + 'wq)"/>' +
        '<path d="M71.4 13.2C70.8 20.6 75 23.4 77.6 23.6C80.2 23.4 84.4 20.6 83.8 13.2C82.6 17.6 80.6 19.6 77.6 19.8C74.6 19.6 72.6 17.6 71.4 13.2Z" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".7" stroke-linejoin="round"/>' +
        '<circle class="bud-c bud-orb" cx="77.6" cy="15.4" r="5" fill="url(#' + u + 'wo)" stroke="' + P.mg3 + '" stroke-width=".6"/><ellipse cx="75.8" cy="13.4" rx="1.5" ry="1" fill="#FFFFFF" opacity=".9" transform="rotate(-30 75.8 13.4)"/>' +
        '<g transform="translate(77.6 15.4)"><g class="bud-c bud-rot" style="--d:2.6s"><ellipse rx="8.4" ry="2.6" fill="none" stroke="' + P.mg2 + '" stroke-width=".6" stroke-dasharray="3 2" transform="rotate(-24)"/></g></g>' +
        budTwinkles([[70.6, 8.6, 1.4], [85, 10.4, 1.6], [84.6, 22, 1.1]], '#FFFFFF', 89) +
        '<g class="bud-fx bud-orbx"><circle class="bud-c" cx="77.6" cy="15.4" r="6" fill="none" stroke="' + P.mg2 + '" stroke-width="1.4"/><circle class="bud-c" style="--dl:.5s" cx="77.6" cy="15.4" r="6" fill="none" stroke="' + P.gold + '" stroke-width="1"/>' + spk + '</g>' +
        budLimb(62.8, 80.6, 72.4, 88.2, 7.4, P.wr, P.wrl) + bell(62.8, 80.6, 72.4, 88.2) + '<circle cx="76.8" cy="91.2" r="3.9" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1.1"/><path d="M74.2 89.6Q77.4 88.6 80 90.2" fill="none" stroke="' + P.skl + '" stroke-width=".8" stroke-linecap="round" opacity=".7"/>';
    },
    top: function (P, u) {
      return '<ellipse cx="50" cy="34.4" rx="42" ry="7.2" fill="' + P.wr2 + '" stroke="' + P.wrl + '" stroke-width="1.1"/><path d="M9.6 33.6C15 29.6 31 27.6 50 27.6S85 29.6 90.4 33.6C84 36.4 68 37.4 50 37.4S16 36.4 9.6 33.6Z" fill="url(#' + u + 'wh)"/>' +
        '<path d="M20.6 32.6C23.4 21.4 31.6 11.6 43 6.6C39.2 4.8 34.4 4.6 29.4 6.2C33.2 0.8 41.4 -2.6 49.4 -1.8C54.4 -1.2 57.4 2.8 57.6 7.6C65.6 13.6 75.6 22 79.4 32.6Q50 37.2 20.6 32.6Z" fill="url(#' + u + 'wh)" stroke="' + P.wrl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<path d="M57.6 7.6C65.6 13.6 75.6 22 79.4 32.6Q70 34.2 62 34.6C62 24 60.6 14.6 57.6 7.6Z" fill="' + P.wr2 + '" opacity=".45"/><path d="M26.4 27.6C29.6 19.6 35.4 13 42.4 9.4" fill="none" stroke="' + P.wr3 + '" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M21 30Q50 34.8 79 30L79.6 33.4Q50 38.2 20.4 33.4Z" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".8" stroke-linejoin="round"/>' +
        '<rect x="46.4" y="30.4" width="7.2" height="5.6" rx="1" fill="none" stroke="' + P.goldl + '" stroke-width="1"/><path d="M50 30.8L52.2 33.2L50 35.6L47.8 33.2Z" fill="' + P.mg + '" stroke="' + P.mg3 + '" stroke-width=".5"/>' +
        budStar4(41.6, 21, 2.4, P.gold, 0.22) + budStar4(60.4, 18.4, 1.7, P.gold, 0.22) + budStar4(50.8, 11.6, 1.4, P.gold, 0.22) + '<path d="M65.4 24.4a2.4 2.4 0 1 0 1.8 4a1.8 1.8 0 1 1 -1.8 -4z" fill="' + P.gold + '"/>' +
        '<circle cx="33.4" cy="25" r=".6" fill="' + P.gold + '"/><circle cx="55.6" cy="26.6" r=".6" fill="' + P.gold + '"/>' +
        '<g class="bud-swy bud-pv" style="--d:2.8s;--a:10deg;transform-origin:30.4px 6.4px"><path d="M30.4 6.4V10" stroke="' + P.goldl + '" stroke-width=".6"/><path d="' + budStar5(30.4, 12.6, 3) + '" fill="' + P.gold + '" stroke="' + P.goldl + '" stroke-width=".6" stroke-linejoin="round"/></g>';
    },
    fore: function (P, u) {
      return '<g clip-path="url(#' + u + 'wzd)">' + this.orbit(P, u) + '</g>' + budTwinkles([[16, 96, 2], [88, 110, 1.8]], P.mg2, 91);
    },
    fx: function (P) {
      return '<g class="bud-fx bud-pop">' + budRing(50, 72, 1, 10, function (a, x, y, i) { var t = (a + 18) * Math.PI / 180; return '<g class="bud-spk" style="--dx:' + budN(Math.cos(t) * 40) + 'px;--dy:' + budN(Math.sin(t) * 34) + 'px">' + budStar4(50, 72, i % 2 ? 2 : 3, i % 3 ? P.gold : P.mg2, 0.22) + '</g>'; }) + '</g>';
    }
  };

  /* ---------- Frostfall (Mythic): a crown of ice, frost in the hair, a crystal breastplate with a glowing snowflake, a fur-
     trimmed cape, northern lights across the sky, a giant snowflake turning behind, snow falling, ice shards circling,
     and frozen ground with crystals and mist ---------- */
  /* an ice crystal standing on (x, y), h tall and w wide, leaning a degrees, with a shaded face and a shine */
  function budCrystal(x, y, h, w, a, fill, line, shade) {
    return '<g transform="translate(' + budP(x, y) + ') rotate(' + budN(a) + ')"><path d="M0 0L' + budP(-w / 2, -h * 0.16) + 'L' + budP(-w * 0.34, -h * 0.84) + 'L0 ' + budN(-h) + 'L' + budP(w * 0.34, -h * 0.84) + 'L' + budP(w / 2, -h * 0.16) + 'Z" fill="' + fill + '" stroke="' + line + '" stroke-width=".7" stroke-linejoin="round"/>' +
      '<path d="M0 0V' + budN(-h) + 'L' + budP(w * 0.34, -h * 0.84) + 'L' + budP(w / 2, -h * 0.16) + 'Z" fill="' + shade + '" opacity=".38"/><path d="M' + budP(-w * 0.2, -h * 0.22) + 'L' + budP(-w * 0.14, -h * 0.7) + '" stroke="#FFFFFF" stroke-width="' + budN(Math.max(0.5, w * 0.12)) + '" stroke-linecap="round" opacity=".85"/></g>';
  }
  /* a smooth line through points [[x, y], ...] */
  function budSmooth(pts) {
    var d = 'M' + budP(pts[0][0], pts[0][1]), i;
    for (i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + budP(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6) + ' ' + budP(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6) + ' ' + budP(p2[0], p2[1]);
    }
    return d;
  }
  /* a band of fluffy fur from x1 to x2, its top at y, r the size of its puffs */
  function budFur(x1, x2, y, r, fill, line) {
    var n = Math.max(2, Math.round((x2 - x1) / (r * 1.7))), s = (x2 - x1) / n, d = 'M' + budP(x1, y), i;
    for (i = 0; i < n; i++) { d += 'a' + budN(s / 2) + ' ' + budN(r) + ' 0 0 1 ' + budN(s) + ' 0'; }
    d += 'a' + budN(r * 0.8) + ' ' + budN(r * 0.8) + ' 0 0 1 0 ' + budN(r * 1.6);
    for (i = 0; i < n; i++) { d += 'a' + budN(s / 2) + ' ' + budN(r * 0.7) + ' 0 0 1 ' + budN(-s) + ' 0'; }
    return '<path d="' + d + 'a' + budN(r * 0.8) + ' ' + budN(r * 0.8) + ' 0 0 1 0 ' + budN(-r * 1.6) + 'Z" fill="' + fill + '" stroke="' + line + '" stroke-width=".6" stroke-linejoin="round"/>' +
      '<path d="M' + budP(x1 + s * 0.6, y + r * 0.9) + 'h' + budN(s * 0.5) + 'M' + budP(x1 + s * 1.9, y + r * 0.6) + 'h' + budN(s * 0.4) + 'M' + budP(x2 - s * 1.2, y + r * 1) + 'h' + budN(s * 0.5) + '" stroke="' + line + '" stroke-width=".45" stroke-linecap="round" opacity=".7"/>';
  }
  /* one arm of a snowflake, pointing up from 0 0 to r, with branches [distance, length] */
  function budFlakeArm(r, br) {
    var d = 'M0 -5V' + budN(-r);
    br.forEach(function (b) { d += 'M0 ' + budN(-b[0]) + 'l' + budP(-0.87 * b[1], -0.5 * b[1]) + 'M0 ' + budN(-b[0]) + 'l' + budP(0.87 * b[1], -0.5 * b[1]); });
    return d + 'M0 ' + budN(-r - 2.6) + 'l1.5 2.2l-1.5 2.2l-1.5 -2.2z';
  }
  function budFlake(r, br, attrs) { var arm = budFlakeArm(r, br), h = '', i; for (i = 0; i < 6; i++) { h += '<path d="' + arm + '" transform="rotate(' + i * 60 + ')"' + attrs + '/>'; } return h; }
  BUD_SKINS.frost = {
    eyes: 'open', mouth: 'smile', hat: false, clip: false,
    pal: function (P) {
      P.ic = budMix('#7DD3FC', P.c, 0.14); P.ic2 = budMix(P.ic, '#0C4A6E', 0.45); P.ic3 = budMix(P.ic, '#FFFFFF', 0.62); P.icl = budMix(P.ic, '#082F49', 0.7);
      P.fr = budMix('#1D4ED8', P.c, 0.18); P.fr2 = budMix(P.fr, '#0B1437', 0.42); P.fr3 = budMix(P.fr, '#FFFFFF', 0.25); P.frl = budMix(P.fr, '#050A1F', 0.66);
      P.fur = '#F8FAFC'; P.fur2 = '#CBD5E1'; P.furl = '#8C9AB0'; P.sil = '#E2E8F0'; P.sil2 = '#94A3B8';
      P.hr = '#E3F1FF'; P.hr2 = '#8DB8E8'; P.hr3 = '#FFFFFF'; P.hrl = '#3E6795'; P.lid = '#1E3A5F'; P.brow = '#7FA6D6'; P.ir1 = '#0B3A5E'; P.ir2 = '#38BDF8'; P.ir3 = '#E0F7FF';
      P.arm = P.fr; P.armline = P.frl; P.cuff = P.fur; P.pants = P.fr2; return P;
    },
    defs: function (P, u) {
      function aur(id, c, y0, y1) { return '<linearGradient id="' + u + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="' + y0 + '" x2="0" y2="' + y1 + '"><stop offset="0" stop-color="' + c + '" stop-opacity="0"/><stop offset=".65" stop-color="' + c + '" stop-opacity=".4"/><stop offset="1" stop-color="' + c + '" stop-opacity=".85"/></linearGradient>'; }
      return '<radialGradient id="' + u + 'fg"><stop offset="0" stop-color="#BAE6FD" stop-opacity=".6"/><stop offset=".6" stop-color="#BAE6FD" stop-opacity=".2"/><stop offset="1" stop-color="#BAE6FD" stop-opacity="0"/></radialGradient>' +
        aur('fa1', '#10B981', -2, 32) + aur('fa2', '#06B6D4', -8, 20) + aur('fa3', '#8B5CF6', 15, 42) +
        '<linearGradient id="' + u + 'fh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000000"/><stop offset=".24" stop-color="#FFFFFF"/><stop offset=".76" stop-color="#FFFFFF"/><stop offset="1" stop-color="#000000"/></linearGradient>' +
        '<mask id="' + u + 'fk" maskUnits="userSpaceOnUse" x="-10" y="-40" width="120" height="100"><rect x="-4" y="-40" width="108" height="100" fill="url(#' + u + 'fh)"/></mask>' +
        '<linearGradient id="' + u + 'fi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".4" stop-color="' + P.ic3 + '"/><stop offset=".8" stop-color="' + P.ic + '"/><stop offset="1" stop-color="' + P.ic2 + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'fc" x1="0" y1="0" x2=".5" y2="1"><stop offset="0" stop-color="' + P.fr3 + '"/><stop offset=".55" stop-color="' + P.fr + '"/><stop offset="1" stop-color="' + P.fr2 + '"/></linearGradient>' +
        '<radialGradient id="' + u + 'ff"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".55" stop-color="' + P.ic3 + '" stop-opacity=".75"/><stop offset="1" stop-color="' + P.ic + '" stop-opacity=".25"/></radialGradient>' +
        '<radialGradient id="' + u + 'fm"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".75"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="' + u + 'fq"><stop offset="0" stop-color="#E0F7FF" stop-opacity=".9"/><stop offset="1" stop-color="#7DD3FC" stop-opacity="0"/></radialGradient>' +
        '<pattern id="' + u + 'fp" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="' + P.fr2 + '"/><g transform="translate(5 5)">' + budFlake(2.6, [[1.4, 1]], ' fill="none" stroke="' + P.ic3 + '" stroke-width=".35" opacity=".7"') + '</g></pattern>' +
        budHalves(u, 'fz', 90);
    },
    orbit: function (P, u) {
      var h = '', i;
      for (i = 0; i < 3; i++) {
        h += '<g class="bud-orx" style="--od:2s;--odl:-' + budN(i * 4 / 3) + 's;--ox:42px;--oy:9px"><g class="bud-c bud-ory"><circle cx="50" cy="90" r="6" fill="url(#' + u + 'fq)"/><g class="bud-c bud-rot" style="--d:' + (2.4 + i * 0.6) + 's">' +
          '<path d="M50 83.4L52.4 90L50 96.6L47.6 90Z" fill="url(#' + u + 'fi)" stroke="' + P.icl + '" stroke-width=".6" stroke-linejoin="round"/><path d="M50 83.4V96.6L52.4 90Z" fill="' + P.ic2 + '" opacity=".35"/></g></g></g>';
      }
      return h;
    },
    aura: function (P, u) {
      /* a curtain of light: a wavy lower edge that glows, fading up into the sky */
      function band(y, h, id, c, d, dl, amp, ph) {
        var bot = [], top = [], i;
        for (i = 0; i <= 8; i++) { var x = -6 + i * 14, w = Math.sin(i * 1.1 + ph) * amp; bot.push([x, y + w]); top.push([x, y - h + w * 0.5 - Math.sin(i * 1.9 + ph) * 3]); }
        var b = budSmooth(bot);
        return '<g class="bud-aur" style="--d:' + d + 's;--dl:-' + dl + 's"><path d="' + b + 'L' + budSmooth(top.reverse()).slice(1) + 'Z" fill="url(#' + u + id + ')"/><path d="' + b + '" fill="none" stroke="' + c + '" stroke-width=".9" opacity=".75"/></g>';
      }
      var spikes = [[24, 110.4, 12, 5, -14], [34.4, 107.6, 8, 3.6, -6], [67, 107.6, 9, 4, 8], [77.4, 110.6, 13, 5.2, 16], [13.6, 112.6, 7, 3.4, -26], [88, 113, 8, 3.6, 24]];
      return '<circle class="bud-c bud-pls" style="--d:4.2s" cx="50" cy="60" r="62" fill="url(#' + u + 'fg)"/>' +
        '<g class="bud-fx bud-frz"><g transform="translate(50 58)"><g class="bud-c bud-frb">' + budFlake(48, [[16, 9], [27, 8], [37, 6]], ' fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"') + '</g></g></g>' +
        '<g mask="url(#' + u + 'fk)">' + band(16, 22, 'fa2', '#67E8F9', 9, 3, 4, 2) + band(27, 26, 'fa1', '#6EE7B7', 7, 0, 5, 0) + band(37, 20, 'fa3', '#C4B5FD', 8, 5, 5, 4) + '</g>' +
        '<g transform="translate(50 54)" opacity=".7"><g class="bud-c bud-flake"><circle r="48" fill="none" stroke="' + P.ic3 + '" stroke-width=".7" stroke-dasharray="2 2.6"/>' +
        budFlake(44, [[15, 8], [25, 7], [34, 5]], ' fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"') +
        '<path d="' + budRing(0, 0, 9, 6, function (a, x, y, i) { return (i ? 'L' : 'M') + budP(x, y); }) + 'Z" fill="none" stroke="#FFFFFF" stroke-width=".9"/></g></g>' +
        '<g transform="translate(50 54)"><g class="bud-c bud-flake2">' + budRing(0, 0, 53, 12, function (a, x, y, i) { return '<path d="M' + budP(x, y - 2.6) + 'l1.4 2.6l-1.4 2.6l-1.4 -2.6z" fill="' + (i % 2 ? '#FFFFFF' : P.ic3) + '" transform="rotate(' + budN(a + 90) + ' ' + budP(x, y) + ')"/>'; }) + '<circle r="53" fill="none" stroke="' + P.ic + '" stroke-width=".5" opacity=".6"/></g></g>' +
        budParts(16, [-4, 104, -16, 56], function (x, y, i, c) {
          return i % 3 ? '<circle cx="' + budN(x) + '" cy="' + budN(y) + '" r="' + budN(0.6 + c * 0.7) + '" fill="#FFFFFF"/>' : '<g transform="translate(' + budP(x, y) + ')">' + budFlake(1.6 + c, [], ' fill="#FFFFFF" stroke="#FFFFFF" stroke-width=".5" stroke-linecap="round"') + '</g>';
        }, { d: 5.4, dy: -64, dx: 12, seed: 151 }) +
        '<ellipse cx="50" cy="113" rx="43" ry="7.6" fill="url(#' + u + 'ff)" stroke="' + P.ic + '" stroke-width=".6"/>' +
        '<path d="M30 112.4l5 1.4l3 -1.6M58 114.6l4 -1.6l5 .8M44 116.2l2.4 -1.6M72 111.6l3.6 1.2" fill="none" stroke="#FFFFFF" stroke-width=".7" stroke-linecap="round" opacity=".85"/>' +
        spikes.map(function (k) { return budCrystal(k[0], k[1], k[2], k[3], k[4], 'url(#' + u + 'fi)', P.icl, P.ic2); }).join('') +
        '<g class="bud-drift" style="--d:7s"><ellipse cx="24" cy="112" rx="20" ry="4.4" fill="url(#' + u + 'fm)"/></g><g class="bud-drift" style="--d:9s;--dl:-4s"><ellipse cx="78" cy="111.4" rx="18" ry="4" fill="url(#' + u + 'fm)"/></g>' +
        '<g clip-path="url(#' + u + 'fzu)">' + this.orbit(P, u) + '</g>' + budTwinkles([[8, 50, 2.4], [93, 44, 2.6], [96, 84, 1.8], [4, 92, 2], [70, 4, 1.8], [28, 2, 1.6]], '#FFFFFF', 97);
    },
    back: function (P, u) {
      var ice = '', i;
      for (i = 0; i < 7; i++) { var x = 22.6 + i * 9.2; ice += '<path d="M' + budP(x - 2, 112.6) + 'L' + budP(x, 117.4 - (i % 2) * 1.8) + 'L' + budP(x + 2, 112.6) + 'Z" fill="url(#' + u + 'fi)" stroke="' + P.icl + '" stroke-width=".5" stroke-linejoin="round"/>'; }
      return '<g class="bud-fcap"><path d="M36.4 78C29.6 88 23.6 100 19 113.2Q50 110.8 81 113.2C76.4 100 70.4 88 63.6 78Z" fill="url(#' + u + 'fp)" stroke="' + P.frl + '" stroke-width="1.1" stroke-linejoin="round"/>' +
        '<path d="M19.6 111.6Q50 109.2 80.4 111.6" fill="none" stroke="' + P.ic3 + '" stroke-width="1.4"/>' + ice + '</g>';
    },
    legs: function (P) {
      function leg(x, side) {
        var fur = budFur(x - 6.2, x + 6.2, 103.6, 1.5, P.fur, P.furl);
        return '<g class="bud-leg bud-leg-' + side + '">' + budLimb(x, 99.4, x, 104, 7, P.fr2, P.frl) +
          '<path d="M' + budP(x - 6, 112.6) + 'C' + budP(x - 6, 108.6) + ' ' + budP(x - 5, 105.4) + ' ' + budP(x, 105.4) + 'C' + budP(x + 5, 105.4) + ' ' + budP(x + 6, 108.6) + ' ' + budP(x + 6, 112.6) + 'C' + budP(x + 6, 114) + ' ' + budP(x + 5, 114.4) + ' ' + budP(x + 3.6, 114.4) + 'H' + budN(x - 3.6) + 'C' + budP(x - 5, 114.4) + ' ' + budP(x - 6, 114) + ' ' + budP(x - 6, 112.6) + 'Z" fill="' + P.ic2 + '" stroke="' + P.icl + '" stroke-width="1.1"/>' +
          '<path d="M' + budP(x - 5.8, 112.4) + 'H' + budN(x + 5.8) + '" stroke="' + P.sil2 + '" stroke-width="1.3"/><path d="M' + budP(x - 2.6, 108.8) + 'Q' + budP(x, 107.6) + ' ' + budP(x + 2.6, 108.8) + '" fill="none" stroke="' + P.ic3 + '" stroke-width=".9" stroke-linecap="round"/>' + fur + '</g>';
      }
      return leg(45, 'l') + leg(55, 'r');
    },
    torso: function (P, u) {
      var fur = '', i;
      fur = budFur(36, 64, 76.6, 2, P.fur, P.furl);
      return '<path d="' + BUD_TORSO + '" fill="url(#' + u + 'fc)" stroke="' + P.frl + '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path d="M34.4 80.4C33.6 86 32.6 92 31.8 97.8C31.6 99.6 32.2 100.8 33.4 101.6C34.8 94 35.4 86 37.6 77.4C35.8 78.2 34.8 79.2 34.4 80.4Z" fill="' + P.fr2 + '" opacity=".55"/>' +
        '<path d="M38.4 79.4L50 77.6L61.6 79.4L60.4 91.6L50 96.2L39.6 91.6Z" fill="url(#' + u + 'fi)" stroke="' + P.icl + '" stroke-width="1" stroke-linejoin="round"/>' +
        '<path d="M50 77.6V96.2M38.4 79.4L50 87M61.6 79.4L50 87M39.6 91.6L50 87M60.4 91.6L50 87" stroke="' + P.ic2 + '" stroke-width=".55" opacity=".7"/><path d="M50 87L61.6 79.4L60.4 91.6Z" fill="' + P.ic2 + '" opacity=".3"/><path d="M50 87L38.4 79.4L50 77.6Z" fill="#FFFFFF" opacity=".45"/>' +
        '<g transform="translate(50 87)">' + budFlake(5.4, [[3, 1.6]], ' fill="none" stroke="#FFFFFF" stroke-width=".7" stroke-linecap="round"') + '</g><circle class="bud-gem" cx="50" cy="87" r="2.2" fill="#22D3EE" stroke="' + P.icl + '" stroke-width=".6"/><circle cx="49.3" cy="86.3" r=".7" fill="#FFFFFF"/>' +
        '<rect x="33" y="96" width="34" height="3.4" rx="1.4" fill="' + P.sil + '" stroke="' + P.sil2 + '" stroke-width=".7"/><path d="M50 95.2L52 97.7L50 100.2L48 97.7Z" fill="url(#' + u + 'fi)" stroke="' + P.icl + '" stroke-width=".6"/>' + fur;
    },
    arm: function (P, side, u) {
      var m = side < 0 ? -1 : 1, sx = 50 + m * 12.8, ex = 50 + m * 18.4, hx = 50 + m * 19, fur = '<g transform="rotate(' + budN(m * -25) + ' ' + budP(ex, 91.6) + ')">' + budFur(ex - 5, ex + 5, 90.4, 1.3, P.fur, P.furl) + '</g>';
      return budLimb(sx, 80.6, ex, 92.4, 7.4, P.fr, P.frl) + '<circle cx="' + budN(hx) + '" cy="96" r="3.9" fill="' + P.sk + '" stroke="' + P.skl + '" stroke-width="1.1"/>' + fur +
        budCrystal(sx + m * 3.4, 80.4, 7.4, 3.4, m * 52, 'url(#' + u + 'fi)', P.icl, P.ic2) + budCrystal(sx + m * 1.4, 78.4, 9, 3.8, m * 26, 'url(#' + u + 'fi)', P.icl, P.ic2) + budCrystal(sx - m * 0.8, 78.6, 6, 3, m * 4, 'url(#' + u + 'fi)', P.icl, P.ic2);
    },
    top: function (P, u) {
      return '<g class="bud-float"><circle cx="50" cy="-1" r="7" fill="url(#' + u + 'fq)"/><path d="M50 -6.4L53 -1L50 4.4L47 -1Z" fill="url(#' + u + 'fi)" stroke="' + P.icl + '" stroke-width=".6" stroke-linejoin="round"/><path d="M50 -6.4V4.4L53 -1Z" fill="' + P.ic2 + '" opacity=".35"/></g>' +
        budCrystal(31.4, 27.6, 8, 4, -24, 'url(#' + u + 'fi)', P.icl, P.ic2) + budCrystal(68.6, 27.6, 8, 4, 24, 'url(#' + u + 'fi)', P.icl, P.ic2) +
        budCrystal(40.4, 23.6, 11, 4.6, -10, 'url(#' + u + 'fi)', P.icl, P.ic2) + budCrystal(59.6, 23.6, 11, 4.6, 10, 'url(#' + u + 'fi)', P.icl, P.ic2) + budCrystal(50, 22.4, 16, 6, 0, 'url(#' + u + 'fi)', P.icl, P.ic2) +
        '<path d="M27.4 30.6Q50 17.8 72.6 30.6L71.6 33.4Q50 21 28.4 33.4Z" fill="' + P.sil + '" stroke="' + P.sil2 + '" stroke-width=".8" stroke-linejoin="round"/>' +
        '<path d="M50 20.6L52.6 23.6L50 26.6L47.4 23.6Z" fill="#22D3EE" stroke="' + P.icl + '" stroke-width=".6"/><circle class="bud-gem" cx="49.4" cy="22.9" r=".7" fill="#FFFFFF"/>' +
        budTwinkles([[34, 40, 1.6], [66, 36, 1.4], [25, 50, 1.2]], '#FFFFFF', 101);
    },
    fore: function (P, u) {
      return '<g clip-path="url(#' + u + 'fzd)">' + this.orbit(P, u) + '</g>' +
        budCrystal(19.4, 117.4, 9, 4, -22, 'url(#' + u + 'fi)', P.icl, P.ic2) + budCrystal(82.6, 117.6, 10, 4.4, 20, 'url(#' + u + 'fi)', P.icl, P.ic2) + budCrystal(63, 118.6, 6, 3, 8, 'url(#' + u + 'fi)', P.icl, P.ic2) +
        '<g class="bud-drift" style="--d:8s;--dl:-2s"><ellipse cx="50" cy="117.6" rx="26" ry="3.6" fill="url(#' + u + 'fm)"/></g>' + budTwinkles([[12, 100, 2], [90, 98, 2.2]], '#FFFFFF', 107);
    },
    fx: function (P) {
      var fl = budRing(50, 92, 1, 8, function (a, x, y, i) { var t = a * Math.PI / 180; return '<g class="bud-frs" style="--dx:' + budN(Math.cos(t) * 42) + 'px;--dy:' + budN(Math.sin(t) * 30 - 8) + 'px"><g transform="translate(' + budP(50 + Math.cos(t) * 12, 92 + Math.sin(t) * 9) + ')">' + budFlake(i % 2 ? 2.4 : 3.4, [[1.6, 1.2]], ' fill="none" stroke="#FFFFFF" stroke-width=".8" stroke-linecap="round"') + '</g></g>'; });
      return '<g class="bud-fx bud-frz">' +
        '<g transform="translate(50 113) scale(1 .3)"><circle class="bud-c bud-frr" r="30" fill="none" stroke="#FFFFFF" stroke-width="3"/></g>' + fl + '</g>';
    }
  };

  /* ---------- moves: how long each lasts (t, in ms; 0 keeps going until the next), the face and mouth it makes, and any
     change of face partway through (steps) ---------- */
  var BUD_ACTS = {
    hop: { t: 950, f: 'happy', m: 'grin' }, wave: { t: 1800, f: 'happy', m: 'open' }, cheer: { t: 1700, f: 'star', m: 'grin' },
    love: { t: 1900, f: 'heart', m: 'cat' }, spin: { t: 1100, f: 'happy', m: 'open' }, dance: { t: 2700, f: 'happy', m: 'cat' },
    shy: { t: 2000, f: 'happy', m: 'wavy' }, yawn: { t: 2300, f: 'closed', m: 'yawn' }, sleep: { t: 0, f: 'closed', m: 'flat' },
    think: { t: 2300, f: 'open', m: 'flat' }, idea: { t: 1700, f: 'wide', m: 'open' }, oops: { t: 1700, f: 'squint', m: 'wavy' },
    dizzy: { t: 2100, f: 'dizzy', m: 'wavy' }, look: { t: 2600, f: 'open', m: 'smile' }, stretch: { t: 2100, f: 'closed', m: 'o' },
    nod: { t: 1500, f: 'happy', m: 'smile' }, giggle: { t: 1500, f: 'happy', m: 'grin' }, surprise: { t: 1100, f: 'wide', m: 'o' },
    cool: { t: 2000, f: 'cool', m: 'smirk' }, smug: { t: 1800, f: 'smug', m: 'smirk' }, wink: { t: 1300, f: 'wink', m: 'tongue' },
    power: { t: 2400, f: 'squint', m: 'grin', steps: [[1500, 'star', 'grin']] },
    vanish: { t: 2400, f: 'wink', m: 'smile', steps: [[1350, 'wide', 'grin']] },
    scan: { t: 2200, f: 'wide', m: 'flat', steps: [[1900, 'happy', 'smile']] }, beep: { t: 1600, f: 'heart', m: 'cat' },
    fire: { t: 2100, f: 'squint', m: 'fang', steps: [[1300, 'happy', 'grin']] }, flap: { t: 1900, f: 'happy', m: 'grin' },
    swirl: { t: 2400, f: 'star', m: 'o' }, shine: { t: 2400, f: 'happy', m: 'grin' },
    nap: { t: 3300, f: 'closed', m: 'flat', steps: [[2500, 'wide', 'o']] },
    jiggle: { t: 1500, f: 'happy', m: 'grin' }, poof: { t: 2300, f: 'cool', m: 'smirk', steps: [[1500, 'wink', 'grin']] },
    cast: { t: 2300, f: 'squint', m: 'open', steps: [[700, 'star', 'grin']] }, freeze: { t: 2300, f: 'wide', m: 'o', steps: [[1300, 'happy', 'grin']] },
    walk: { t: 0, f: 'open', m: 'smile' }
  };
  /* who each buddy is: its mood, what it does and says when it is tapped, what it does on its own, and how it takes a right
     answer and a miss. '' is the plain character. */
  var BUD_WHO = {
    '': { mood: 'Cheerful and curious', tap: [['hop', 'Hi! Ready when you are.'], ['wave', 'Hello again!'], ['cool', 'We’ve got this.'], ['spin', 'Wheee!'], ['think', 'Hmm, what should we learn next?'], ['wink', 'You’re doing great.']],
      idle: ['look', 'stretch', 'dance', 'yawn'], right: ['cheer', 'Yes! You got it!'], miss: ['nod', 'Close one. You will get the next one.'] },
    pjs: { mood: 'Sleepy but sweet', tap: [['yawn', 'Five more minutes…'], ['nap', 'Zzz… Oh! I am awake. Totally awake.'], ['stretch', 'Okay, okay. Let’s study.'], ['shy', 'Is it morning already?']],
      idle: ['nap', 'yawn', 'stretch'], right: ['surprise', 'Wow! That woke me right up.'], miss: ['nod', 'It’s okay. Even I get sleepy answers.'] },
    ghost: { mood: 'Shy and giggly', tap: [['vanish', 'Boo! …Sorry, did I scare you?'], ['shy', 'You can see me?'], ['giggle', 'Hehe, that tickles!'], ['spin', 'Spooky spin!']],
      idle: ['vanish', 'look', 'shy'], right: ['cheer', 'Boo-tiful answer!'], miss: ['nod', 'Don’t be scared. Try the next one.'] },
    robo: { mood: 'Helpful and very precise', tap: [['beep', 'Beep boop! Hello, friend.'], ['scan', 'Scanning… you look smart today.'], ['think', 'Computing… 100% ready to study.'], ['dance', 'Robot dance mode: on.']],
      idle: ['scan', 'look', 'beep'], right: ['beep', 'Correct! Joy levels rising.'], miss: ['think', 'Error found. Learning from it.'] },
    dragon: { mood: 'Brave and a little dramatic', tap: [['fire', 'Rawr! …That was my scariest one.'], ['flap', 'Look, I can almost fly!'], ['power', 'Feel the heat!'], ['giggle', 'Dragons don’t giggle. Hehe.']],
      idle: ['flap', 'fire', 'look'], right: ['fire', 'Roar-some!'], miss: ['nod', 'Even dragons miss sometimes.'] },
    cosmo: { mood: 'Dreamy and wise', tap: [['swirl', 'Every star in me is cheering for you.'], ['think', 'The stars say: keep going.'], ['cool', 'Out of this world.'], ['spin', 'Wheee, zero gravity!']],
      idle: ['swirl', 'look', 'think'], right: ['swirl', 'Stellar!'], miss: ['nod', 'Stars take time to shine.'] },
    doodle: { mood: 'Creative and a little silly', tap: [['wink', 'I drew this outfit myself!'], ['dance', 'Doodle dance!'], ['think', 'Hmm, what should I draw next?'], ['giggle', 'Oops, I colored outside the lines.']],
      idle: ['look', 'dance', 'think'], right: ['cheer', 'A+ answer!'], miss: ['nod', 'No worries. That’s what erasers are for.'] },
    rain: { mood: 'Sunny in any weather', tap: [['hop', 'Splash!'], ['wave', 'Rain or shine, let’s study!'], ['spin', 'Twirl!'], ['shy', 'Is it raining on you too?']],
      idle: ['hop', 'look', 'spin'], right: ['cheer', 'Rainbow time!'], miss: ['nod', 'Every storm passes.'] },
    sprout: { mood: 'Gentle and always growing', tap: [['shy', 'Hi! I grow a little every day.'], ['stretch', 'Reaching for the sun!'], ['love', 'You’re blooming!'], ['nod', 'Water, sunlight and practice.']],
      idle: ['stretch', 'look', 'shy'], right: ['cheer', 'You’re growing so fast!'], miss: ['nod', 'Roots grow before flowers.'] },
    bits: { mood: 'Competitive and goofy', tap: [['power', 'Level up!'], ['dance', 'Victory dance!'], ['cool', 'High score incoming.'], ['spin', 'Combo!']],
      idle: ['dance', 'look', 'power'], right: ['cheer', '+100 points!'], miss: ['nod', 'Respawning… ready!'] },
    frog: { mood: 'Bouncy and easily excited', tap: [['hop', 'Ribbit!'], ['giggle', 'Hop on, let’s go!'], ['spin', 'Lily pad spin!'], ['surprise', 'Was that a fly?']],
      idle: ['hop', 'look', 'giggle'], right: ['hop', 'Toad-ally right!'], miss: ['nod', 'Just hop to the next one.'] },
    knight: { mood: 'Brave and loyal', tap: [['cool', 'For honor… and good grades!'], ['wave', 'At your service!'], ['power', 'Charge!'], ['nod', 'I shall guard your streak.']],
      idle: ['look', 'nod', 'cool'], right: ['cheer', 'Victory is ours!'], miss: ['nod', 'A true knight gets back up.'] },
    gloop: { mood: 'Squishy and upbeat', tap: [['jiggle', 'Wobble wobble!'], ['giggle', 'Hehe, I’m a little sticky.'], ['love', 'Slime hugs!'], ['surprise', 'Did I just drip on your notes?']],
      idle: ['jiggle', 'look', 'giggle'], right: ['jiggle', 'Gloop-tastic!'], miss: ['nod', 'No stress. Just go with the flow.'] },
    ninja: { mood: 'Quiet, quick and a bit of a show-off', tap: [['poof', 'Now you see me…'], ['cool', 'Silent. Swift. Studious.'], ['spin', 'Ninja spin!'], ['wink', 'Shh. Secret study move.']],
      idle: ['look', 'poof', 'cool'], right: ['cheer', 'Swift and sharp!'], miss: ['nod', 'A ninja learns from every miss.'] },
    wizard: { mood: 'Bookish and full of surprises', tap: [['cast', 'Abraca-study!'], ['think', 'Let me check my spellbook…'], ['idea', 'I know just the trick!'], ['wink', 'Practice is the real magic.']],
      idle: ['cast', 'think', 'look'], right: ['cast', 'Magical!'], miss: ['nod', 'Even great wizards practice.'] },
    frost: { mood: 'Calm and cool-headed', tap: [['freeze', 'Stay frosty!'], ['cool', 'Cool, calm and ready.'], ['shy', 'Brr… is it cold in here?'], ['spin', 'Snow spin!']],
      idle: ['freeze', 'look', 'cool'], right: ['freeze', 'Ice cold answer!'], miss: ['nod', 'Chill. You’ll get the next one.'] },
    dawn: { mood: 'Warm and glowing', tap: [['shine', 'You shine a little more every day.'], ['power', 'Rise and shine!'], ['wave', 'Good morning, star student!'], ['love', 'Good things are coming.']],
      idle: ['shine', 'look', 'stretch'], right: ['shine', 'Brilliant!'], miss: ['nod', 'Every sunrise starts in the dark.'] }
  };
  function budWho(skin) { return BUD_WHO[skin] || BUD_WHO['']; }
  /* show a face and a mouth (the drawing keeps the skin's own as data-f0 and data-m0) */
  function budFace(svg, f, m) { if (!svg) { return; } svg.setAttribute('data-face', f || svg.getAttribute('data-f0') || 'open'); svg.setAttribute('data-mouth', m || svg.getAttribute('data-m0') || 'smile'); }
  /* play a move; done is called when it is over */
  function budPlay(svg, name, done) {
    var A = BUD_ACTS[name];
    if (!svg || !A) { return 0; }
    if (!svg.hasAttribute('data-f0')) { svg.setAttribute('data-f0', svg.getAttribute('data-face')); svg.setAttribute('data-m0', svg.getAttribute('data-mouth')); }
    clearTimeout(svg.budT); (svg.budS || []).forEach(clearTimeout);
    svg.removeAttribute('data-act'); void svg.getBoundingClientRect();
    svg.setAttribute('data-act', name); budFace(svg, A.f, A.m);
    svg.budS = (A.steps || []).map(function (s) { return setTimeout(function () { budFace(svg, s[1], s[2]); }, s[0]); });
    if (A.t) { svg.budT = setTimeout(function () { budRest(svg); if (done) { done(); } }, A.t); }
    return A.t;
  }
  function budRest(svg) { if (!svg) { return; } clearTimeout(svg.budT); (svg.budS || []).forEach(clearTimeout); svg.removeAttribute('data-act'); budFace(svg); }
