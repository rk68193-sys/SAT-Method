  function rReviewFindingsHTML() {
    var groups = ['Inference and two texts', 'Grammar and transitions', 'Evidence and synthesis', 'Words and structure'];
    return '<header><p class="eyebrow">Further findings from the supplied export</p><h2 class="vtitle">What the broad rules miss</h2><p class="lede">These source-backed distinctions extend the earlier lessons. Some correct an official explanation while retaining its answer key. Open the cited question to compare the passage, choices and explanation.</p></header>' + groups.map(function (group) {
      return '<section class="sec"><h3 class="h2">' + esc(group) + '</h3>' + (D.reviewFindings || []).filter(function (c) { return c.group === group; }).map(function (c) {
        return '<article class="mtype"><h4 class="h3">' + esc(c.title) + '</h4>' + c.paragraphs.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + (c.transfer ? '<p class="midea">' + esc(c.transfer) + '</p>' : '') + '<p>' + c.ids.map(function (id) { return '<a class="linkbtn" href="#rq-' + id + '">Practise source ' + esc(id) + '</a>'; }).join(' · ') + '</p></article>';
      }).join('') + '</section>';
    }).join('');
  }
