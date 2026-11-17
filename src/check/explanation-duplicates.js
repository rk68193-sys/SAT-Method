/* Exercise both real presentations and shared attempt history for every duplicated RW ID.
   The hook exists only in the intercepted test page; no diagnostic hook is shipped. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),base=process.argv[2]||'http://127.0.0.1:8765/';
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const marker='  var hot = window.claude && window.claude.hot;';
assert.equal(html.split(marker).length,2);
const hook=`window.__exDuplicateTest={
 list:function(){var groups={};itemsAll().forEach(function(it){(groups[it.id]||(groups[it.id]=[])).push(it);});return Object.keys(groups).filter(function(id){return groups[id].length>1;}).map(function(id){return {id:id,types:groups[id].map(function(it){return it.t;})};});},
 draw:function(id,type){var it=itemsAll().filter(function(it){return it.id===id&&it.t===type;})[0];
   if(!it)throw Error('Missing presentation');
   TS={items:[it],i:0,res:[],tier:TIERS.learn,hints:false,settings:{src:'both',part:'all',diff:'all',which:'all',len:1,tier:'learn',mode:'set'}};
   viewEl.practice.innerHTML='<div id="thost"><div id="tpos"></div><div id="tmeta"></div><div id="tcard"></div><div id="tclock"></div><div id="tconfidence"></div><div id="treview"></div><div id="tnav"></div><button id="tnext2"></button></div>';
   timedDraw();return it.t==='g'?it.ex.a:it.t==='r'?it.x.ans:it.b.ans;},
 snapshot:function(id){var it=itemsAll().filter(function(it){return it.id===id;})[0];return {record:result(it),fresh:matching({src:'both',part:'all',diff:'all',which:'new'}).some(function(q){return q.id===id;})};}
};\n`;
(async()=>{
 const browser=await chromium.launch(),ctx=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:950}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.route(base,r=>r.fulfill({status:200,contentType:'text/html',body:html.replace(marker,hook+marker)}));
 await p.goto(base+'#practice');const groups=await p.evaluate(()=>window.__exDuplicateTest.list());assert.equal(groups.length,25);
 let count=0;
 for(const g of groups){
   let n=0;
   for(const type of g.types){
     const answer=await p.evaluate(({id,type})=>window.__exDuplicateTest.draw(id,type),{id:g.id,type});
     await p.locator('#tcard .opt[data-k="'+answer+'"]').click();
     const card=p.locator('#tcard [data-explanation="rw:'+g.id+'"]');await card.waitFor();
     await p.waitForFunction(key=>{const s=JSON.parse(localStorage.getItem(key));return !!(s&&s.s&&s.s.pz&&s.s.pz.g&&s.s.pz.g.welcome);},'sat-grammar-sprint.v1');
     const saved=await p.evaluate(()=>localStorage.getItem('sat-grammar-sprint.v1'));
     if(await card.locator('.ex-variation').count())await card.locator('.ex-variation > summary').click();
     assert.equal(await p.evaluate(()=>localStorage.getItem('sat-grammar-sprint.v1')),saved,'variation must not create an attempt');
     const s=await p.evaluate(id=>window.__exDuplicateTest.snapshot(id),g.id);
     assert.equal(s.fresh,false,g.id+' is shared history');assert.equal(s.record.n,++n,g.id+' attempts accumulate across views');count++;
   }
 }
 assert.deepEqual(errors,[]);await browser.close();console.log(JSON.stringify({passed:true,duplicate_ids:25,presentations:count,shared_attempts:true,variation_side_effects:false}));
})().catch(e=>{console.error(e);process.exit(1);});
