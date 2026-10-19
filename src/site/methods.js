  /* =================== Methods: seven techniques from James Lu's videos, checked against the bank =================== */
  var MT = D.methods || { sections: [] };
  function buildMethods() {
    if (built.methods) { return; }
    built.methods = true;
    var idx = MT.sections.map(function (s, i) { return '<a class="ulink" href="#meth-' + s.id + '">' + (i + 1) + ' ' + esc(s.name) + '</a>'; }).join('');
    var secs = MT.sections.map(function (s, i) {
      var h = '<section class="lsec meth" id="meth-' + s.id + '"><div class="sech"><p class="label">Method ' + (i + 1) + ' · from “' + esc(s.video) + '”</p><h3 class="h2">' + esc(s.name) + '</h3>' +
        '<p class="meth-for"><a href="' + s.forHref + '">' + esc(s.for) + '</a> · ' + esc(s.count) + '</p><p class="lede">' + esc(s.idea) + '</p></div>';
      h += '<ol class="mroutine">' + s.steps.map(function (st) { return '<li><b>' + esc(st[0]) + '</b><span>' + esc(st[1]) + '</span></li>'; }).join('') + '</ol>';
      if (s.table) {
        h += '<h4 class="meth-h">' + esc(s.tableTitle) + '</h4><div class="tablewrap"><table class="meth-t"><tbody>' + s.table.map(function (r) {
          return '<tr><th scope="row">' + esc(r[0]) + '</th><td class="meth-k">' + esc(r[1]) + '</td><td>' + r[2] + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      }
      if (s.rules) {
        h += '<div class="meth-rules">' + s.rules.map(function (r) { return '<div class="meth-rule"><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></div>'; }).join('') + '</div>';
      }
      if (s.examples) {
        h += '<h4 class="meth-h">On real questions</h4><ul class="meth-ex">' + s.examples.map(function (e) {
          return '<li><a class="qref" href="#rq-' + e[0] + '"><code>' + e[0] + '</code></a> <span class="muted">' + esc(e[1]) + '</span><span class="meth-clue">' + e[2] + '</span><span class="meth-say">' + esc(e[3]) + ' → <b>' + esc(e[4]) + '</b></span></li>';
        }).join('') + '</ul>';
      }
      h += '<div class="meth-bank"><p class="mtag ok">What the bank shows</p><ul class="plainlist">' + s.bank.map(function (b) { return '<li>' + b + '</li>'; }).join('') + '</ul></div>';
      h += '<p class="meth-links"><span class="label">Go deeper</span> ' + s.links.map(function (l) { return '<a class="ulink" href="' + l[0] + '">' + esc(l[1]) + '</a>'; }).join('') + '</p>';
      return h + '</section>';
    }).join('');
    viewEl.methods.innerHTML = '<div class="wrap"><header class="read"><p class="eyebrow">Reading &amp; Writing · Methods</p><h2 class="vtitle">' + esc(MT.title) + '</h2>' +
      '<p class="lede">' + esc(MT.intro) + '</p><nav class="subnav" aria-label="On this page">' + idx + '<a class="ulink" href="#meth-disagree">Where the bank disagrees</a><a class="ulink" href="#meth-summary">In one line each</a></nav></header>' +
      '<section class="lsec"><div class="sech"><h3 class="h2">Where they fit</h3></div><ul class="plainlist">' + MT.fit.map(function (f) { return '<li><b>' + esc(f[0]) + '.</b> ' + f[1] + '</li>'; }).join('') + '</ul></section>' +
      secs +
      '<section class="lsec" id="meth-disagree"><div class="sech"><h3 class="h2">Where the bank disagrees</h3><p class="lede">The methods hold up. These four claims needed a safer version.</p></div><div class="tablewrap"><table class="meth-t"><tbody>' +
        MT.disagree.map(function (r) { return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div></section>' +
      '<section class="lsec" id="meth-summary"><div class="sech"><h3 class="h2">The seven methods in one line each</h3></div><ol class="meth-sum">' +
        MT.summary.map(function (r, i) { return '<li><a href="#meth-' + MT.sections[i].id + '"><b>' + esc(r[0]) + '</b></a> ' + esc(r[1]) + '</li>'; }).join('') + '</ol>' +
      '<p class="fine">' + esc(MT.credit) + '</p>' +
      '<p class="row" style="margin-top:1rem"><a class="btn" href="#practice">Practice real questions</a><a class="btn ghost" href="#drills">Drill the slow steps</a></p></section></div>';
  }
