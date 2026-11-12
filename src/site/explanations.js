  /* Independently authored pilot; the source questions and grading keys stay intact. */
  var EXPLANATION_PILOT = D.explanationPilot || {};
  function simplifiedExplanationHTML(id) {
    var e = EXPLANATION_PILOT[id];
    if (!e) { return ''; }
    return '<section class="mpstrat simplified-explanation" aria-label="Simplified explanation">' +
      '<h3 class="h3">Simplified explanation</h3><p><b>Key clue:</b> ' + esc(e.clue) + '</p><ol>' +
      e.steps.map(function (step) { return '<li>' + esc(step) + '</li>'; }).join('') + '</ol>' +
      (e.wrong ? '<details><summary>Why the other choices fail</summary><ul>' +
        Object.keys(e.wrong).map(function (k) { return '<li><b>' + k + ':</b> ' + esc(e.wrong[k]) + '</li>'; }).join('') + '</ul></details>' : '') +
      '<p><b>Watch out:</b> ' + esc(e.trap) + '</p><p class="fine muted">Independently written explanation · College Board’s answer key. <a href="explanation-preview.html">Review all 20 sample explanations</a>.</p></section>';
  }
