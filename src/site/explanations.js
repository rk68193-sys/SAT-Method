  /* Authored solutions never grade, save or award rewards. Exact host and answer-key guards fail closed. */
  function explanationFor(subject, id, answer) {
    var data = D.explanations, host = location.hostname;
    var local = ['localhost', '127.0.0.1', '[::1]'].indexOf(host) !== -1;
    var releasedHost = data && data.mode === 'released' && ['satsprint.org', 'www.satsprint.org', 'rk68193-sys.github.io'].indexOf(host) !== -1;
    if (!data || data.schema !== 1 || ['local-pilot', 'released'].indexOf(data.mode) === -1 || data.enabled !== true ||
        !(local || releasedHost) ||
        new URLSearchParams(location.search).get('explanations') === 'off' ||
        !/^(m|rw)$/.test(subject) || !/^[0-9a-f]{8}$/.test(id)) { return null; }
    var item = data.items && data.items[subject + ':' + id];
    if (!item || item.subject !== subject || item.id !== id ||
        JSON.stringify(item.answer) !== JSON.stringify(answer) ||
        !Array.isArray(item.paragraphs) || !item.paragraphs.length ||
        !item.paragraphs.every(function (p) { return typeof p === 'string' && p.trim(); })) { return null; }
    return item;
  }
  function explanationText(text) {
    /* Only **emphasis** is recognized; all text, including HTML, is escaped. */
    return String(text).split(/(\*\*[^*\n]+\*\*)/g).map(function (part) {
      return /^\*\*[^*\n]+\*\*$/.test(part) ? '<strong>' + esc(part.slice(2, -2)) + '</strong>' : esc(part);
    }).join('');
  }
  function explanationHTML(subject, id, answer, noHeading) {
    var item = explanationFor(subject, id, answer);
    if (!item) { return ''; }
    var v = item.variation;
    return '<div class="authored-explanation" data-explanation="' + subject + ':' + id + '">' +
      (noHeading ? '' : '<h4 class="h3">How to solve it</h4>') +
      item.paragraphs.map(function (p) { return '<p>' + explanationText(p) + '</p>'; }).join('') +
      '<p class="fine muted">Explanation written for SAT Sprint. Answer key: College Board.</p>' +
      (v && typeof v.prompt === 'string' && v.prompt.trim() && typeof v.answer === 'string' && v.answer.trim()
        ? '<details class="ex-variation"><summary>Try a similar idea</summary><p>' + explanationText(v.prompt) +
          '</p><details><summary>Show the answer</summary><p>' + explanationText(v.answer) + '</p></details></details>' :
        v && typeof v.worked === 'string' && v.worked.trim()
          ? '<details class="ex-variation ex-worked"><summary>See a variation and its reasoning</summary><p>' + explanationText(v.worked) + '</p></details>' : '') + '</div>';
  }
  function explanationSourceHTML(subject, id, answer, fill) {
    var item = explanationFor(subject, id, answer), source = item && item.source;
    if (!source || !Array.isArray(source.blocks) || !source.blocks.length ||
        ['restored', 'editorial'].indexOf(source.kind) === -1) { return ''; }
    /* Source text is structured data; no imported HTML or attributes are executed. */
    return '<span class="ex-source" data-explanation-source="' + subject + ':' + id + '">' +
      '<span class="ex-source-label">' + (source.kind === 'editorial' ? 'Practice version · editorial correction' : 'Complete passage') + '</span>' +
      (source.kind === 'editorial' ? '<span class="ex-source-note">' + esc(source.note) + '</span>' : '') +
      source.blocks.map(function (block) {
        return '<span class="ex-source-block">' + block.map(function (run) {
          var text = esc(run.text).replace(/\n/g, '<br>');
          if (run.blank) { return fill ? '<mark class="fill">' + esc(fill) + '</mark>' : '<span class="blank">______</span>'; }
          if (run.i) { text = '<em>' + text + '</em>'; }
          if (run.b) { text = '<strong>' + text + '</strong>'; }
          if (run.u) { text = '<u>' + text + '</u>'; }
          return text;
        }).join('') + '</span>';
      }).join('') + '</span>';
  }
  function explanationReference(label, html) {
    return '<details class="ex-reference"><summary>' + esc(label) + '</summary>' + html + '</details>';
  }
