  /* Expanded methods and scoped calculator checks. Source grading stays in MD. */
  var MST = D.mathStudy, MSTBY = {};
  MST.methods.forEach(function (m) { MSTBY[m.id] = m; });
  var mstState = { search: '', skill: '', evidence: '', legacy: '', page: 0 }, MST_PAGE = 12;

  function mstLink(m) { return '#m-study-' + encodeURIComponent(m.id); }
  function mstScope(q) { return q.calculator ? q.calculator.mode : 'not_computed'; }
  function mstQuestionLinks(ids) {
    return '<ul class="mst-qids">' + ids.map(function (id) {
      var q = MST.questions[id], label = MST.scopes[mstScope(q)].label;
      return '<li><a href="#m-check-' + id + '">' + id + '</a><span class="fine">' + esc(label) + '</span><a class="linkbtn" href="#mq-' + id + '">Practice</a></li>';
    }).join('') + '</ul>';
  }
  function mstExplanation(m) {
    return '<p><b>Recognize it:</b> ' + esc(m.recognition_pattern) + '</p>' +
      '<p><b>Why it works:</b> ' + esc(m.why_it_works) + '</p>' + mStepList(m.detailed_steps) +
      '<div class="mst-route"><h4 class="h3">Desmos or graphing calculator</h4><p>' + esc(m.calculator_method) + '</p></div>' +
      '<p><b>Faster by hand:</b> ' + esc(m.when_hand_is_faster) + '</p>' +
      '<p class="mtrap"><b>Watch for:</b> ' + esc(m.common_trap) + '</p>';
  }
  function mstCalculator(id) {
    var q = MST.questions[id], c = q.calculator, scope = MST.scopes[mstScope(q)];
    if (!c) { return '<div class="mnote mst-check"><b>No numerical check recorded</b><p>' + esc(scope.meaning) + '</p></div>'; }
    return '<section class="mst-check"><p class="mtag des">' + esc(scope.label) + '</p><h4 class="h3">Calculator check · ' + id + '</h4>' +
      '<p>' + esc(c.explanation) + '</p><p><b>Calculation:</b> <code class="mst-math">' + esc(c.input_readable) + '</code></p>' +
      '<p><b>Result before rounding: ' + esc(Number(c.local_result.toPrecision(12))) + '</b></p>' +
      '<p class="row"><button type="button" class="btn sm" data-mst-copy="' + id + '">Copy Desmos input</button><a class="linkbtn" href="https://www.desmos.com/calculator" target="_blank" rel="noopener">Open Desmos</a></p>' +
      '<p class="fine mst-copy-status" data-mst-status="' + id + '" role="status"></p>' +
      '<details><summary>Exact input to paste</summary><textarea class="mst-input" readonly aria-label="Desmos input for ' + id + '">' + esc(c.desmos_latex) + '</textarea></details>' +
      '<p class="mst-scope"><b>What this checks:</b> ' + esc(scope.meaning) + '</p>' +
      (c.mode === 'question_computed' ? '<p class="fine">' + esc(c.answer_comparison.note) + '</p>' : '') +
      '<details><summary>How the arithmetic was checked</summary><p class="fine">' + (c.verification === 'individual' ? 'This corrected input was entered individually in the Desmos web calculator; its displayed result was recorded.' : 'This expression was evaluated in a Desmos list. Across 20 batches, the largest normalized difference from a separate arithmetic evaluation was 2.9411764706 × 10⁻¹⁵.') + ' This checks arithmetic, not every modeling assumption. These checks used the standard web calculator, not the SAT test interface.</p></details></section>';
  }
  function mStudyFeedbackHTML(id) {
    var q = MST.questions[id]; if (!q) { return ''; }
    var m = MSTBY[q.method];
    return '<details class="mstrategy mst-feedback"><summary>Expanded method and calculator check</summary><h4 class="h3">' + esc(m.title) + '</h4>' +
      '<p>' + esc(m.why_it_works) + '</p>' + (q.note ? '<p class="mtrap">' + esc(q.note) + '</p>' : '') +
      mstCalculator(id) + '<p><a class="linkbtn" href="' + mstLink(m) + '">Full steps and similar questions</a> · <a href="#m-check-' + id + '">Compare close variants</a></p></details>';
  }
  function mStudyRelatedHTML(type) {
    var ids = MST.by_legacy_type[type] || [];
    if (!ids.length) { return ''; }
    return '<details class="mstrategy mst-related"><summary>More specific methods inside this type · ' + ids.length + '</summary><p>Choose the setup and target that match your question.</p><ul class="plainlist">' + ids.slice(0,8).map(function (id) { var m = MSTBY[id]; return '<li><a href="' + mstLink(m) + '">' + esc(m.title) + '</a></li>'; }).join('') + '</ul><a class="linkbtn" href="#m-study-from-' + type + '">See all ' + ids.length + ' related methods</a></details>';
  }
  function mstCard(m, opened) {
    return '<details class="mst-card" id="mst-' + m.id + '"' + (opened ? ' open' : '') + '><summary><span class="mtag">' + esc(MSK[m.skill].name) + '</span><h3 class="h3">' + esc(m.title) + '</h3><span class="fine">' + plural(m.question_count,'question') + ' · ' + plural(m.checks,'numerical check') + '</span></summary><div class="mst-body">' + mstExplanation(m) +
      '<p class="row"><a class="btn sm" href="#m-study-practice-' + encodeURIComponent(m.id) + '">Practice this type</a><a class="linkbtn" href="#m-check-' + m.representative_id + '">Worked example · ' + m.representative_id + '</a></p>' +
      '<details><summary>' + plural(m.question_count,'question') + ' in this type</summary>' + mstQuestionLinks(m.question_ids) + '</details></div></details>';
  }
  function mstFilter(m) {
    if (mstState.skill && m.skill !== mstState.skill) { return false; }
    if (mstState.legacy && (MST.by_legacy_type[mstState.legacy] || []).indexOf(m.id) === -1) { return false; }
    var search = mstState.search.trim().toLowerCase();
    if (search && [m.title,m.recognition_pattern,m.why_it_works,m.id,m.question_ids.join(' '),MSK[m.skill].name].join(' ').toLowerCase().indexOf(search) === -1) { return false; }
    if (mstState.evidence && !m.question_ids.some(function (id) { var mode = mstScope(MST.questions[id]);return mstState.evidence === 'checked' ? mode !== 'not_computed' : mode === mstState.evidence; })) { return false; }
    return true;
  }
  function mstDraw(openId) {
    var methods = MST.methods.filter(mstFilter), max = Math.max(0, Math.ceil(methods.length/MST_PAGE)-1);
    mstState.page = Math.min(mstState.page,max);
    if (openId) { var at = methods.map(function (m) {return m.id;}).indexOf(openId); if (at >= 0) { mstState.page = Math.floor(at/MST_PAGE); } }
    $('#mst-count').textContent = plural(methods.length,'matching type') + ' · ' + plural(methods.reduce(function (n,m) {return n+m.question_count;},0),'question');
    $('#mst-results').innerHTML = methods.length ? methods.slice(mstState.page*MST_PAGE,(mstState.page+1)*MST_PAGE).map(function (m) {return mstCard(m,m.id === openId);}).join('') : '<p class="mnote">No types match. Try fewer words or clear the filters.</p>';
    $('#mst-pager').innerHTML = max ? '<button class="btn ghost sm" type="button" data-mst-page="-1"' + (mstState.page===0?' disabled':'') + '>Previous types</button><span>Page ' + (mstState.page+1) + ' of ' + (max+1) + '</span><button class="btn ghost sm" type="button" data-mst-page="1"' + (mstState.page===max?' disabled':'') + '>Next types</button>' : '';
  }
  function buildMStudy(openId,legacy) {
    if (!built.mstudy) {
      built.mstudy = true;
      viewEl.mstudy.innerHTML = '<div class="wrap">' + mHead('Math · Expanded types','249 ways to recognize the question','Find the exact setup, learn why the fast method works, and try it on the original questions. All 1,925 Math questions are mapped to a type.') +
        '<div class="mst-stats"><div><b>249</b><span>fine question types</span></div><div><b>1,925</b><span>questions linked</span></div><div><b>998</b><span>scoped Desmos checks</span></div></div>' +
        '<details class="mnote mst-evidence"><summary>What the calculator checks mean</summary><p>The 998 checks include 382 question-derived target calculations, 528 intermediate source-solution steps, and 88 model, coordinate, discriminant, or choice checks. Each question states which kind it has. A numerical test is not a proof of an identity, and 927 questions have no recorded numerical check.</p><p>The 249 types are teaching groupings. Close variants are suggestions, and each question keeps its own official answer. Use the original images for fractions, powers, roots, bars, and diagrams.</p></details>' +
        '<div class="mst-filters"><label class="field"><span class="label">Find a type or question ID</span><input type="search" id="mst-search" placeholder="e.g. vertex, density, 841ef26c"></label>' +
        '<label class="field"><span class="label">Math skill</span><select id="mst-skill"><option value="">All skills</option>' + Object.keys(MSK).map(function (k) {return '<option value="'+k+'">'+esc(MSK[k].name)+'</option>';}).join('') + '</select></label>' +
        '<label class="field"><span class="label">Calculator evidence</span><select id="mst-evidence"><option value="">All types</option><option value="checked">Has a numerical check</option><option value="question_computed">Has a question-derived check</option><option value="source_step_check">Has a source-step check</option><option value="not_computed">Includes unchecked questions</option></select></label></div>' +
        '<p class="row"><button class="linkbtn" type="button" id="mst-clear">Clear filters</button><span class="fine" id="mst-legacy-note"></span></p><p id="mst-count" class="fine" aria-live="polite"></p><div id="mst-results"></div><div class="mst-pager" id="mst-pager"></div><div id="mst-question"></div></div>';
      [['mst-search','search','input'],['mst-skill','skill','change'],['mst-evidence','evidence','change']].forEach(function (x) { $('#'+x[0]).addEventListener(x[2],function () {mstState[x[1]]=this.value;mstState.page=0;$('#mst-question').innerHTML='';mstDraw();}); });
      $('#mst-clear').addEventListener('click',function () {mstState={search:'',skill:'',evidence:'',legacy:'',page:0};$('#mst-search').value='';$('#mst-skill').value='';$('#mst-evidence').value='';$('#mst-legacy-note').textContent='';$('#mst-question').innerHTML='';mstDraw();});
    }
    $('#mst-question').innerHTML = '';
    if (openId || legacy) {mstState={search:'',skill:'',evidence:'',legacy:legacy||'',page:0};$('#mst-search').value='';$('#mst-skill').value='';$('#mst-evidence').value='';}
    $('#mst-legacy-note').textContent=mstState.legacy?'Showing methods related to '+MTY[mstState.legacy].name+'.':'';
    mstDraw(openId);
  }
  function mStudyQuestion(id) {
    built.mstudy=false;
    buildMStudy();
    var q=MST.questions[id],m=MSTBY[q.method],source=MQBY[id],f=MST.families[q.family];
    $('#mst-results').innerHTML='';$('#mst-pager').innerHTML='';$('#mst-count').textContent='Question '+id+' · '+q.difficulty;
    $('#mst-question').innerHTML='<article class="mst-question"><p><a href="'+mstLink(m)+'">← '+esc(m.title)+'</a></p><h3 class="h2">Question '+id+'</h3>'+
      (q.note?'<aside class="mtrap"><b>Notation / target check:</b> '+esc(q.note)+'</aside>':'')+
      '<p class="row"><a class="btn sm" href="#mq-'+id+'">Try this question</a><a class="linkbtn" href="'+mstLink(m)+'">Full method</a></p>'+mstCalculator(id)+
      (q.hand?'<details><summary>Short hand solution</summary><p>'+esc(q.hand)+'</p></details>':'')+
      '<details><summary>Original question and choices</summary><div class="mpq">'+mImg('q',source)+'</div></details>'+
      '<details><summary>Official source solution</summary><div class="mpq">'+mImg('r',source)+'</div></details>'+
      (id==='841ef26c'?'<details><summary>See the actual Desmos graph</summary><p>g(x)=f(x+5) shifts the vertex left five units, from (-8,6) to (-13,6). The question asks for the input -13.</p><img class="mst-graph" loading="lazy" src="'+esc(MST.evidence.graph_image)+'" alt="Desmos graph of f and g, with the shifted vertex at (-13,6)"></details>':'')+
      '<h4 class="h3">Close variants</h4>'+(f?'<p class="fine">Suggested similar wording and structure; each question has its own answer.</p>'+mstQuestionLinks(f.ids.filter(function (other) {return other!==id;})):'<p>No close variant was confidently grouped. The question remains in its broader method group.</p>')+'</article>';
  }
  function mStudyPractice(id) {
    clearInterval(mpInterval);mpPause();
    var pool=shuffle(MSTBY[id].question_ids.map(function (qid) {return MQBY[qid];}).slice()).slice(0,10);
    MP={qs:pool,i:0,res:[],timer:false,over:false};mpShow();
  }
  document.addEventListener('click',async function (event) {
    var target=event.target.closest?event.target.closest('[data-mst-copy],[data-mst-page]'):null;
    if (!target) {return;}
    if (target.hasAttribute('data-mst-page')) {mstState.page+=Number(target.getAttribute('data-mst-page'));mstDraw();scrollToEl($('#mst-count'));return;}
    var id=target.getAttribute('data-mst-copy'),value=MST.questions[id].calculator.desmos_latex,status=target.closest('.mst-check').querySelector('[data-mst-status]');
    try {await navigator.clipboard.writeText(value);status.textContent='Copied. Paste into an empty Desmos expression.';}
    catch(error) {var field=target.closest('.mst-check').querySelector('textarea');field.closest('details').open=true;field.focus();field.select();status.textContent='Input selected. Press Ctrl+C (or Command+C) to copy.';}
  });
