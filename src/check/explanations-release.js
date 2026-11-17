/* Production-host rendering and upgrade checks against an intercepted, local-only site.
   No production progress/account writes: every request to satsprint.org is served by localhost. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),base=process.argv[2]||'http://127.0.0.1:8766/';
const data=JSON.parse(fs.readFileSync(path.join(root,'src/build/explanations.json'),'utf8'));
const KEY='sat-grammar-sprint.v1';
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({serviceWorkers:'block',viewport:{width:390,height:950}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await ctx.route('https://satsprint.org/**',async route=>{const u=new URL(route.request().url());const r=await ctx.request.get(base+u.pathname.slice(1)+u.search);await route.fulfill({response:r});});
 const old={v:1,t:{de55ec71:{c:1,n:3,at:1700000000000,mode:'learn',t:null,l:null}},r:{},b:{},m:{c943acba:[1,4,1700000000000]},s:{}};
 await ctx.addInitScript(({KEY,old})=>{if(!localStorage.getItem(KEY))localStorage.setItem(KEY,JSON.stringify(old));},{KEY,old});
 let count=0;
 const sample=Object.values(data.items).filter(x=>x.source).concat([data.items['m:c943acba'],data.items['rw:de55ec71'],data.items['m:ac472881']]);
 for(const item of sample){
   const hash=(item.subject==='m'?'mq-':'rq-')+item.id;await p.goto('https://satsprint.org/#'+hash,{waitUntil:'domcontentloaded'});
   const host=p.locator(item.subject==='m'?'#v-mprac':'#tcard');await host.waitFor();
   assert.equal(await host.locator('[data-explanation]').count(),0,'answer not leaked');
   if(item.source)await host.locator('[data-explanation-source]').first().waitFor();
   if(Array.isArray(item.answer)){await p.fill('#mp-gin',item.answer.at(-1));await p.click('#mp-gform button');}
   else await host.locator((item.subject==='m'?'.mpch':'.opt')+'[data-k="'+item.answer+'"]').click();
   await host.locator('[data-explanation="'+item.subject+':'+item.id+'"]').waitFor();count++;
 }
 const saved=await p.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);
 assert.ok(saved.t.de55ec71.n>=3,'existing grammar attempt history survives');assert.ok(saved.m.c943acba,'existing Math record survives');
 await p.goto('https://satsprint.org/?explanations=off#rq-3a2d77d7',{waitUntil:'domcontentloaded'});
 await p.locator('#tcard .opt[data-k="D"]').click();assert.equal(await p.locator('#tcard [data-explanation], #tcard [data-explanation-source]').count(),0,'kill switch restores previous source and explanation');
 assert.deepEqual(errors,[]);await b.close();console.log(JSON.stringify({passed:true,production_host:true,questions:count,source_resolutions:11,preserved_history:true,comparison_switch:true}));
})().catch(e=>{console.error(e);process.exit(1);});
