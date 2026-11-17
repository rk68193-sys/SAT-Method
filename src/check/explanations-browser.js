/* Local pilot integration. Uses disposable browser profiles; never signs in or sends real account data. */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const root=path.resolve(__dirname,'../..'), json=n=>JSON.parse(fs.readFileSync(path.join(root,'src/build/'+n+'.json'),'utf8'));
const payload=json('explanations'), base=process.argv[2] || 'http://127.0.0.1:8765/';
const width=Number(process.argv[3] || 390), out=process.argv[4] || '';
const KEY='sat-grammar-sprint.v1';
const norm=s=>s.replace(/\*\*/g,'').replace(/\s+/g,' ').trim();
(async()=>{
  const browser=await chromium.launch(); const context=await browser.newContext({viewport:{width,height:950}});
  const p=await context.newPage(), errors=[]; p.on('pageerror',e=>errors.push(e.message));
  const saved=()=>p.evaluate(key=>localStorage.getItem(key),KEY);
  const go=async hash=>{await p.goto(base+'#'+hash);await p.waitForSelector('#main');};
  const answer=async(item,wrong=false)=>{
    if(item.subject==='m'){
      if(Array.isArray(item.answer)){await p.fill('#mp-gin',item.answer.at(-1));await p.click('#mp-gform button');}
      else await p.click('#v-mprac .mpch[data-k="'+(wrong?'ABCD'.split('').find(k=>k!==item.answer):item.answer)+'"]');
    }else await p.click('#tcard .opt[data-k="'+(wrong?'ABCD'.split('').find(k=>k!==item.answer):item.answer)+'"]');
  };
  let count=0,variations=0;
  const sample=new Map(), addSample=key=>sample.set(key,payload.items[key]);
  // Actual published data in the local collection, not replacement fixtures: all Math
  // teaching types, the original 18 cases, every repaired source, and all RW card kinds.
  const seenTypes=new Set(), math=json('mdata');
  math.qs.forEach(q=>{if(!seenTypes.has(q[1])){seenTypes.add(q[1]);addSample('m:'+q[0]);}});
  for(const id of ['c943acba','f2b63f49','d03e29f1','a520ba07','379ffefb','7700d098','ac472881','3f5a3602','8493fd10'])addSample('m:'+id);
  for(const id of ['de55ec71','0014477f','00221c00','003f22c8','00460c13','0113152f','80fd9454','03080769','e060dd6b'])addSample('rw:'+id);
  for(const [key,item] of Object.entries(payload.items))if(item.source)addSample(key);
  for(const [key,item] of sample){
    await go((item.subject==='m'?'mq-':'rq-')+item.id);
    const host=p.locator(item.subject==='m'?'#v-mprac':'#tcard');
    assert.equal(await host.locator('[data-explanation]').count(),0,key+' before answering');
    if(item.source){
      const source=host.locator('[data-explanation-source="'+key+'"]');await source.waitFor();
      if(item.source.kind==='editorial')assert.ok((await source.innerText()).includes('editorial correction'));
      const marks=item.source.blocks.flat().filter(x=>x.u);
      if(marks.length)assert.equal(await source.locator('u').count(),marks.length,key+' recovered emphasis');
    }
    await answer(item,(count++%2)===1);
    const card=host.locator('[data-explanation="'+key+'"]');await card.waitFor();
    assert.ok(norm(await card.innerText()).includes(norm(item.paragraphs[0])),key+' exact text');
    assert.ok((await host.innerText()).includes('College Board'),key+' attribution/reference');
    // Answering schedules the existing welcome reward after 60 ms. Wait for that
    // answer-triggered save before measuring whether a variation changes anything.
    await p.waitForFunction(key=>{const s=JSON.parse(localStorage.getItem(key));return !!(s&&s.s&&s.s.pz&&s.s.pz.g&&s.s.pz.g.welcome);},KEY);
    const before=await saved();
    if(item.variation){
      const v=card.locator('.ex-variation');await v.locator(':scope > summary').click();
      if(item.variation.worked)assert.ok(norm(await v.innerText()).includes(norm(item.variation.worked)));
      else {
        assert.equal(await v.locator('details').getAttribute('open'),null,key+' answer initially hidden');
        await v.locator('details > summary').click();
        assert.ok(norm(await v.innerText()).includes(norm(item.variation.answer)));
      }
      variations++;
    }
    assert.equal(await saved(),before,key+' variation does not change progress');
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false,key+' overflow');
  }
  // Both image-only Math questions retain their question fallback, independently of authored prose.
  for(const id of ['a520ba07','8493fd10']){
    await go('mq-'+id);await p.locator('#v-mprac .mpq img.mimg').waitFor();
    assert.equal(await p.locator('#v-mprac .mpq .mtx').count(),0);
  }
  await p.goto(base+'?explanations=off#mq-c943acba');await answer(payload.items['m:c943acba']);
  assert.equal(await p.locator('#v-mprac [data-explanation]').count(),0,'off switch restores fallback');
  await p.locator('#v-mprac .mprat > summary').click();
  assert.ok((await p.locator('#v-mprac .mprat').innerText()).length>30,'original reference remains');
  for(const id of ['00460c13','00221c00']){
    await p.goto(base+'?explanations=off#rq-'+id);await answer(payload.items['rw:'+id]);
    assert.equal(await p.locator('#tcard [data-explanation]').count(),0,'bank fallback remains available');
    const feedback=await p.locator('#tcard .qfeed').innerHTML();
    assert.ok(feedback.lastIndexOf('Explanations: College Board')>feedback.lastIndexOf('<a '),'bank fallback retains its original link/credit order');
  }
  // Reopening a saved question and the site with its saved shell both retain eligible explanations.
  await go('mq-c943acba');await answer(payload.items['m:c943acba']);
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();
  await context.setOffline(true);await p.reload();await p.locator('#v-mprac .mpcard').waitFor();
  await answer(payload.items['m:c943acba']);await p.locator('[data-explanation="m:c943acba"]').waitFor();
  await context.setOffline(false);
  // The read-only walkthrough mode must use the same explanation as answering the card.
  const example=json('rdata').examples.find(x=>x.qid==='80fd9454');
  await go('ex-'+example.n);await p.click('#ex-read');
  await p.locator('[data-explanation="rw:80fd9454"]').waitFor();assert.ok(await p.locator('#ex-host table').count());
  await go('m-check-c943acba');await p.locator('#mst-question [data-explanation="m:c943acba"]').waitFor();
  await go('q-de55ec71');
  await p.locator('#q-de55ec71').evaluate(el=>{for(let n=el;n;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true;});
  await p.click('#q-de55ec71 .opt[data-k="A"]');await p.locator('#q-de55ec71 [data-explanation="rw:de55ec71"]').waitFor();
  await go('home');await p.click('[data-htry="math"]');
  const practice=()=>p.evaluate(key=>{const s=JSON.parse(localStorage.getItem(key));return JSON.stringify([s.t,s.r,s.b,s.m]);},KEY);
  const homeBefore=await practice();let homePilot=false;
  for(let i=0;i<7;i++){
    await p.locator('#htry .mpch').first().click();
    if(await p.locator('#htry [data-explanation="m:c943acba"]').count()){homePilot=true;break;}
    await p.click('[data-htry-next="math"]');
  }
  assert.ok(homePilot,'Home sample uses the shared solution');assert.equal(await practice(),homeBefore,'Home does not record practice attempts');
  // Fixture-only entries force every drawn module card through the enabled lookup. No fixture is exported.
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const match=/<script type="application\/json" id="sprint-data">([\s\S]*?)<\/script>/.exec(html);
  const D=JSON.parse(match[1]), fixture={schema:1,mode:'local-pilot',enabled:true,items:{}};
  const add=(subject,id,answer)=>fixture.items[subject+':'+id]={subject,id,answer,paragraphs:['MODULE TEST EXPLANATION']};
  Object.values(D.ex).forEach(q=>add('rw',q.q,q.a));D.reading.examples.forEach(q=>add('rw',q.qid,q.ans));
  for(const k of ['reading','notes','trans','figures','grammarSources'])D.bank[k].forEach(q=>add('rw',q.id,q.ans));
  D.math.qs.forEach(q=>add('m',q[0],q[4]));D.explanations=fixture;
  const fixtureHtml=html.replace(match[1],JSON.stringify(D).replace(/<\//g,'<\\/'));
  const mc=await browser.newContext({viewport:{width,height:950},serviceWorkers:'block'}), m=await mc.newPage();
  await m.route(base,route=>route.fulfill({status:200,contentType:'text/html',body:fixtureHtml}));
  for(const subject of ['rw','m']){
    await m.goto(base+'#'+(subject==='rw'?'rw-module':'m-module'));
    await m.click(subject==='rw'?'#tstart':'#mp-go');
    const prefix=subject==='rw'?'rm':'mm', body=subject==='rw'?'#rm-body':'#mm-card';
    await m.locator('#'+prefix+'-next').waitFor();
    assert.equal(await m.locator(body+' [data-explanation]').count(),0,'module before choosing');
    const before=await m.evaluate(key=>localStorage.getItem(key),KEY);
    if(subject==='rw')await m.click('#rm-body .opt[data-k="A"]');
    else if(await m.locator('#mm-card .mpch').count())await m.click('#mm-card .mpch[data-k="A"]');
    else await m.fill('#mm-gin','12');
    assert.equal(await m.locator(body+' [data-explanation]').count(),0,'module after choosing');
    assert.equal(await m.evaluate(key=>localStorage.getItem(key),KEY),before,'selection not saved before finishing');
    await m.click('#'+prefix+'-finish');await m.click('#'+prefix+'-nav [data-mm-do="finish"]');
    await m.locator(subject==='rw'?'[data-rm-rev="0"]':'[data-rev="0"]').first().click();
    const review=m.locator(subject==='rw'?'#rm-revcard':'#v-mprac');
    await review.locator('[data-explanation]').waitFor();
    assert.ok((await review.innerText()).includes('MODULE TEST EXPLANATION'),'finished-module review');
  }
  await mc.close();
  // Two widths beyond the main pass, then large text with the dark theme.
  for(const w of [320,1280]){
    await p.setViewportSize({width:w,height:950});await go('mq-c943acba');await answer(payload.items['m:c943acba']);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false,'width '+w);
  }
  await p.setViewportSize({width:390,height:950});await p.click('#theme-btn');
  await p.click('#theme-pop .size-opt:nth-child(2)');await p.check('#theme-pop input[value="dark"]');await p.click('#theme-done');
  await p.waitForTimeout(250);
  const inheritedHeaderOverflow=await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
  const bounds=await p.locator('#v-mprac [data-explanation="m:c943acba"]').boundingBox();
  assert.ok(bounds.x>=0 && bounds.x+bounds.width<=390,'large dark explanation fits');
  if(inheritedHeaderOverflow){
    const headerRight=await p.locator('#help-btn').evaluate(e=>e.getBoundingClientRect().right);
    await p.goto(base+'?explanations=off#mq-c943acba');await answer(payload.items['m:c943acba']);await p.waitForTimeout(250);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),'header overflow also exists with replacements disabled');
    assert.ok(Math.abs(await p.locator('#help-btn').evaluate(e=>e.getBoundingClientRect().right)-headerRight)<1,'same pre-existing header overflow');
    await go('mq-c943acba');await answer(payload.items['m:c943acba']);
  }
  await p.click('#theme-btn');await p.click('#theme-pop .size-opt:nth-child(1)');await p.check('#theme-pop input[value="light"]');await p.click('#theme-done');
  await p.setViewportSize({width:1280,height:950});
  if(out){fs.mkdirSync(out,{recursive:true});await p.screenshot({path:path.join(out,'math-pilot.png'),fullPage:true});
    await go('rq-de55ec71');await answer(payload.items['rw:de55ec71']);await p.screenshot({path:path.join(out,'grammar-pilot.png'),fullPage:true});}
  assert.deepEqual(errors,[]);
  const report={passed:true,collection_questions:Object.keys(payload.items).length,browser_sample_questions:count,math_types:seenTypes.size,source_resolutions:11,variations,held_images:2,module_subjects:2,offline:true,widths:[320,width,1280],large_dark:true,home_and_lesson_views:true,inheritedHeaderOverflow};
  if(out)fs.writeFileSync(path.join(out,'browser-validation.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
