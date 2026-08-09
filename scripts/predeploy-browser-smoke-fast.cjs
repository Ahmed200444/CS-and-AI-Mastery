const fs=require('fs');
const {chromium}=require('playwright');
const BASE=process.env.CSAI_SMOKE_BASE||'http://127.0.0.1:4173';
function assert(v,m){if(!v)throw new Error(m);}
async function mockGitHub(page,posted){
 await page.route('**/api/github/status',async r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({connected:true,csrf:'test-csrf',repositories:[{full_name:'Ahmed200444/CS-and-AI-Mastery'}]})}));
 await page.route('**/api/github/file',async r=>{posted.push(JSON.parse(r.request().postData()||'{}'));await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});});
}
async function waitReady(page,variant,label){
 const note=variant.locator('.csai-example-note').first();assert(await note.count(),label+': C++ readiness note missing');
 const el=await note.elementHandle();await page.waitForFunction(n=>/C\+\+ ready/.test(String(n.textContent||'')),el,{timeout:120000});
}
async function runVariant(page,variant,label){
 const run=variant.locator('[data-run-language-example]').first(),out=variant.locator('[data-csai-example-output]').first();
 assert(await run.count()&&await out.count(),label+': C++ run/output UI missing');
 const before=String(await out.textContent()||'').trim(),start=Date.now();await run.click();const el=await out.elementHandle();
 await page.waitForFunction(({el,before})=>{const t=String(el.textContent||'').trim();return t!==before&&/Output|Run error|Runner error/.test(t);},{el,before},{timeout:40000});
 const raw=String(await out.textContent()||''),ms=Date.now()-start;
 assert(!/Run error|Runner error|took too long/i.test(raw),label+': '+raw);assert(ms<8000,label+`: prepared Run took ${ms}ms`);assert(!/\n\n\n/.test(raw),label+': output spacing regression');return{raw,ms};
}
(async()=>{
 const files=fs.readdirSync('courses').filter(f=>f.endsWith('.html')).sort();assert(files.length===55,`Expected 55 pages, found ${files.length}`);
 const catalog=JSON.parse(fs.readFileSync('assets/catalog-data.json','utf8'));assert(catalog.courses.length===55,'Catalog must contain 55 courses');assert(catalog.courses[0].id==='python'&&catalog.courses[1].id==='cpp','Catalog must start Python, C++');
 for(const file of files){const html=fs.readFileSync('courses/'+file,'utf8');assert(html.includes('/assets/evergreen-learning-engine.js'),file+': Evergreen engine missing');assert(html.includes('/assets/evergreen-review-navigation.js'),file+': Evergreen navigation missing');assert((html.match(/\/assets\/cpp-runner-ui-worker\.js\?v=20260809-5/g)||[]).length===1,file+': C++ runner missing/not unique');assert((html.match(/\/assets\/example-github-publish\.js\?v=20260809-1/g)||[]).length===1,file+': example GitHub publisher missing/not unique');assert((html.match(/\/assets\/course-project-workspace\.js\?v=20260809-2/g)||[]).length===1,file+': project README workspace missing/not unique');}
 assert(!/<details\b[^>]*class=["'][^"']*hub-changelog/i.test(fs.readFileSync('index.html','utf8')),'Visible bottom version history remains');
 console.log('Static platform guards passed on all 55 course pages.');
 const browser=await chromium.launch({headless:true});const context=await browser.newContext();
 try{
  const loadFailures=[];
  for(const file of files){const p=await context.newPage(),errs=[];p.on('pageerror',e=>errs.push(String(e.message||e)));try{await p.goto(BASE+'/courses/'+encodeURIComponent(file),{waitUntil:'domcontentloaded',timeout:30000});await p.waitForTimeout(220);if(errs.length)throw new Error(errs.join(' | '));}catch(e){loadFailures.push(file+': '+(e.message||e));}finally{await p.close();}}
  assert(!loadFailures.length,'Course page browser-load failures:\n'+loadFailures.join('\n'));console.log('All 55 course pages loaded in Chromium without uncaught errors.');

  // Dedicated C++ course: full structural coverage plus representative real browser compiles.
  {
   const page=await context.newPage(),posted=[];await mockGitHub(page,posted);await page.goto(BASE+'/courses/cpp.html',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1700);
   const lessons=page.locator('.lesson');assert(await lessons.count()===30,'C++ course must have 30 lessons');assert(await page.locator('[data-lang-mode]').count()===0,'Dedicated C++ course must be C++ only');
   assert(await page.locator('[data-lang-variant="cpp"] [data-run-language-example]').count()===60,'C++ course must expose 60 runnable examples');assert(await page.locator('[data-lang-variant="cpp"] [data-publish-language-example="cpp"]').count()===60,'Every C++ example needs a GitHub publish button');assert(await page.locator('.csai-example-explain').count()>=60,'Every C++ example needs deep reasoning');assert((await page.locator('body').innerText()).includes('Evergreen'),'C++ Evergreen UI missing');
   const loops=await page.evaluate(()=>{const vs=[...document.querySelectorAll('[data-lang-variant="cpp"]')];let total=0,missing=0;for(const v of vs){const code=String(v.querySelector('[data-csai-language-generated],.csai-language-code,pre.code')?.textContent||'');if(/\bfor\s*\(/.test(code)){total++;if(!v.querySelector('.csai-cpp-loop-deep'))missing++;}}return{total,missing};});assert(loops.total>=10&&loops.missing===0,`C++ loop teaching incomplete: ${JSON.stringify(loops)}`);console.log(`Every for-loop panel verified on ${loops.total} C++ examples.`);
   // Every one of the 60 examples and 15 exercise solutions is g++-compiled by verify-cpp-course.cjs.
   // These indices exercise the shared browser compiler across fundamentals, loops/STL, OOP/memory, and advanced material.
   for(const i of [0,6,13,21,29]){const lesson=lessons.nth(i);await lesson.evaluate(el=>{el.open=true});const variant=lesson.locator('[data-lang-variant="cpp"]').first();await variant.scrollIntoViewIfNeeded();await waitReady(page,variant,`C++ lesson ${i+1}`);const r=await runVariant(page,variant,`C++ lesson ${i+1}`);console.log(`C++ lesson ${i+1} browser run ${r.ms}ms`);await lesson.evaluate(el=>{el.open=false});}
   const loopLesson=lessons.nth(6);await loopLesson.evaluate(el=>{el.open=true});const alt=loopLesson.locator('[data-lang-variant="cpp"]').nth(1);await alt.scrollIntoViewIfNeeded();await waitReady(page,alt,'C++ loop alternative');await runVariant(page,alt,'C++ loop alternative');
   await lessons.nth(0).evaluate(el=>{el.open=true});const firstTwo=lessons.nth(0).locator('[data-lang-variant="cpp"]');for(let i=0;i<2;i++)await firstTwo.nth(i).locator('[data-publish-language-example="cpp"]').click();await page.waitForTimeout(450);const exPosts=posted.filter(p=>/student-code\/C\+\+\/cpp\/examples\/.+\.cpp$/.test(p.path||''));assert(exPosts.length>=2&&exPosts[0].path!==exPosts[1].path,'C++ example GitHub paths are missing or overwrite');for(let i=0;i<2;i++){const shown=String(await firstTwo.nth(i).locator('[data-csai-language-generated],.csai-language-code').first().textContent()||'').trimEnd();assert(exPosts.some(p=>String(p.content||'').trimEnd()===shown),'C++ GitHub example publish did not send exact source');}
   const payload=await page.evaluate(()=>JSON.parse(document.getElementById('csai-assessment-data').textContent)),tasks=page.locator('.assessment-stack .oa-task');assert(payload.exercises.length===15&&await tasks.count()===15,'Expected 15 C++ exercises');
   for(const i of [0,14]){const task=tasks.nth(i),solution=String(payload.exercises[i].solution||'');assert(solution.includes('int main'),`Exercise ${i+1} solution incomplete`);await task.locator('[data-editor]').fill(solution);const out=task.locator('[data-output]'),before=String(await out.textContent()||'').trim();await task.locator('[data-run]').first().click();const el=await out.elementHandle();await page.waitForFunction(({el,before})=>{const t=String(el.textContent||'').trim();return t!==before&&/Output|Run error|Runner error/.test(t);},{el,before},{timeout:125000});const text=String(await out.textContent()||'');assert(!/Run error|Runner error|took too long/i.test(text),`Exercise ${i+1} C++ run failed: ${text}`);}
   const firstTask=tasks.nth(0),own=String(await firstTask.locator('[data-editor]').inputValue()).trimEnd();await firstTask.locator('[data-publish]').first().click();await page.waitForTimeout(350);assert(posted.some(p=>/student-code\/C\+\+\/cpp\/.+\.cpp$/.test(p.path||'')&&String(p.content||'').trimEnd()===own),'C++ exercise own-code GitHub publish failed');await firstTask.locator('[data-reveal-solution]').click();await page.waitForTimeout(300);const revealed=firstTask.locator('[data-revealed-language="cpp"]');assert(await revealed.count()===1,'C++ revealed solution missing');const rc=String(await revealed.locator('pre').textContent()||'').trimEnd();await revealed.locator('[data-publish-revealed="cpp"]').click();await page.waitForTimeout(350);assert(posted.some(p=>String(p.content||'').trimEnd()===rc),'Revealed C++ GitHub publish failed');await page.close();
   console.log('Dedicated C++ structure, representative runtime, exercise runtime, and GitHub publishing passed.');
  }

  // Test the shared prepared C++ runner on every other course that actually offers C++ mode.
  const flexible=[];
  for(const file of files.filter(f=>f!=='cpp.html')){const page=await context.newPage(),id=file.replace(/\.html$/,'');await page.addInitScript(({id})=>{try{localStorage.setItem('csai-course-language-v2:'+id,'python')}catch(e){}},{id});await page.goto(BASE+'/courses/'+file,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(700);const mode=page.locator('[data-lang-mode="cpp"]');if(!await mode.count()){await page.close();continue}flexible.push(id);await mode.first().click();const variant=page.locator('[data-lang-variant="cpp"]').filter({has:page.locator('[data-run-language-example]')}).first();await variant.scrollIntoViewIfNeeded();await waitReady(page,variant,id);await runVariant(page,variant,id);await page.close();}
  assert(flexible.length>0,'No language-flexible C++ courses found');console.log('Prepared C++ browser Run passed on every flexible C++ course: '+flexible.join(', '));

  // Dual exact-source GitHub publishing remains intact.
  {const page=await context.newPage(),posted=[];await mockGitHub(page,posted);await page.goto(BASE+'/courses/dsa.html',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(900);await page.locator('[data-lang-mode="dual"]').first().click();await page.waitForTimeout(500);const py=page.locator('[data-lang-variant="python"]').filter({has:page.locator('[data-publish-language-example="python"]')}).first(),cpp=page.locator('[data-lang-variant="cpp"]').filter({has:page.locator('[data-publish-language-example="cpp"]')}).first();const pyCode=String(await py.locator('[data-csai-language-generated],.csai-language-code').first().textContent()||'').trimEnd(),cppCode=String(await cpp.locator('[data-csai-language-generated],.csai-language-code').first().textContent()||'').trimEnd();await py.locator('[data-publish-language-example="python"]').click();await cpp.locator('[data-publish-language-example="cpp"]').click();await page.waitForTimeout(400);assert(posted.some(p=>/student-code\/Python\/.+\.py$/.test(p.path||'')&&String(p.content||'').trimEnd()===pyCode),'Dual Python GitHub publish failed');assert(posted.some(p=>/student-code\/C\+\+\/.+\.cpp$/.test(p.path||'')&&String(p.content||'').trimEnd()===cppCode),'Dual C++ GitHub publish failed');await page.close();}
  console.log('FAST FULL-PLATFORM BROWSER PREDEPLOY SUITE PASSED.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
