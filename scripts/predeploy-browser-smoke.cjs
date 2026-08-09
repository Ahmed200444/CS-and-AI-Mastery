const fs=require('fs');
const {chromium}=require('playwright');
const BASE=process.env.CSAI_SMOKE_BASE||'http://127.0.0.1:4173';

function assert(cond,msg){if(!cond)throw new Error(msg);}
async function installGitHubMock(page,posted){
 await page.route('**/api/github/status',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({connected:true,csrf:'test-csrf',repositories:[{full_name:'Ahmed200444/CS-and-AI-Mastery'}]})}));
 await page.route('**/api/github/file',async route=>{posted.push(JSON.parse(route.request().postData()||'{}'));await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});});
}
async function waitOutput(page,out,initial,timeout=120000){
 const handle=await out.elementHandle();
 await page.waitForFunction(({el,initial})=>{const t=String(el.textContent||'').trim();return t!==initial&&/Output|Run error|Runner error|C\+\+ run did not finish/.test(t);},{el:handle,initial},{timeout});
}
async function runVariant(page,variant,label,timeout=120000){
 const run=variant.locator('[data-run-language-example]').first(),out=variant.locator('[data-csai-example-output]').first();
 assert(await run.count(),label+': Run example button missing');
 const initial=String(await out.textContent()||'').trim(),start=Date.now();
 await run.click();await waitOutput(page,out,initial,timeout);
 const ms=Date.now()-start,raw=String(await out.textContent()||'');
 if(/Run error|Runner error|did not finish/i.test(raw))throw new Error(label+': '+raw);
 return{ms,raw};
}
async function waitVariantReady(page,variant,label){
 const note=variant.locator('.csai-example-note').first();assert(await note.count(),label+': readiness indicator missing');
 const handle=await note.elementHandle();
 await page.waitForFunction(el=>/C\+\+ ready/.test(String(el.textContent||'')),handle,{timeout:120000});
}

(async()=>{
 const files=fs.readdirSync('courses').filter(f=>f.endsWith('.html')).sort();
 assert(files.length===55,`Expected 55 generated course pages, found ${files.length}`);
 const catalog=JSON.parse(fs.readFileSync('assets/catalog-data.json','utf8'));
 assert(catalog.courses.length===55,'Catalog must contain 55 courses');
 assert(catalog.courses[0].id==='python','Python must remain first');
 assert(catalog.courses[1].id==='cpp','C++ must appear directly after Python');
 const staticFailures=[];
 for(const file of files){
  const html=fs.readFileSync('courses/'+file,'utf8');
  if((html.match(/\/assets\/cpp-runner-ui-worker\.js\?v=20260809-5/g)||[]).length!==1)staticFailures.push(file+': C++ runner missing/not unique');
  if((html.match(/\/assets\/example-github-publish\.js\?v=20260809-1/g)||[]).length!==1)staticFailures.push(file+': example GitHub publisher missing/not unique');
  if((html.match(/\/assets\/cpp-loop-deep-dive\.js\?v=20260809-1/g)||[]).length!==1)staticFailures.push(file+': C++ loop layer missing/not unique');
  if(!html.includes('/assets/evergreen-learning-engine.js'))staticFailures.push(file+': Evergreen engine missing');
  if(!html.includes('/assets/evergreen-review-navigation.js'))staticFailures.push(file+': Evergreen review navigation missing');
 }
 const cppHtml=fs.readFileSync('courses/cpp.html','utf8');
 if((cppHtml.match(/\/assets\/dedicated-cpp-course\.js\?v=20260809-1/g)||[]).length!==1)staticFailures.push('cpp.html: dedicated runtime missing/not unique');
 const index=fs.readFileSync('index.html','utf8');
 if(/<details\b[^>]*class=["'][^"']*hub-changelog/i.test(index))staticFailures.push('index.html: visible version history remains');
 if(staticFailures.length)throw new Error(staticFailures.join('\n'));
 console.log('Static guards passed across all 55 course pages; visible footer versions removed.');

 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext();
 try{
  const pageFailures=[];
  for(const chosen of files){
   const page=await context.newPage(),errs=[];page.on('pageerror',e=>errs.push(String(e.message||e)));
   try{await page.goto(BASE+'/courses/'+encodeURIComponent(chosen),{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(350);if(errs.length)throw new Error(errs.join(' | '));}
   catch(e){pageFailures.push(chosen+': '+(e.message||e));}finally{await page.close();}
  }
  if(pageFailures.length)throw new Error('Course page load failures:\n'+pageFailures.join('\n'));
  console.log('All 55 course pages loaded in Chromium without uncaught page errors.');

  {const page=await context.newPage();await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});assert(await page.locator('details.hub-changelog').count()===0,'Visible version history remains on home page');await page.close();}

  // Dedicated C++ course: exact structure + every topic represented by a real browser compile/run.
  {
   const page=await context.newPage(),posted=[];await installGitHubMock(page,posted);
   await page.goto(BASE+'/courses/cpp.html',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1800);
   const lessons=page.locator('.lesson');
   assert(await lessons.count()===30,'C++ course must render 30 lessons');
   assert(await page.locator('[data-lang-mode]').count()===0,'Dedicated C++ course must not show a language selector');
   assert(await page.locator('[data-lang-variant="cpp"] [data-run-language-example]').count()===60,'C++ course must expose 60 runnable examples');
   assert(await page.locator('[data-lang-variant="cpp"] [data-publish-language-example="cpp"]').count()===60,'Every C++ example needs Publish C++ to GitHub');
   assert(await page.locator('.csai-example-explain').count()>=60,'Every C++ example needs deep explanation');
   assert((await page.locator('body').innerText()).includes('Evergreen'),'Evergreen UI missing from C++ course');
   const loopAudit=await page.evaluate(()=>{const variants=[...document.querySelectorAll('[data-lang-variant="cpp"]')];let withLoops=0,missing=0;for(const v of variants){const pre=v.querySelector('[data-csai-language-generated],.csai-language-code,pre.code'),code=String(pre&&pre.textContent||'');if(/\bfor\s*\(/.test(code)){withLoops++;if(!v.querySelector('.csai-cpp-loop-deep'))missing++;}}return{withLoops,missing};});
   assert(loopAudit.withLoops>=10,'Expected broad for-loop coverage');assert(loopAudit.missing===0,`${loopAudit.missing} C++ for-loop examples lack exact loop explanation`);
   console.log(`C++ loop teaching verified on ${loopAudit.withLoops} lesson examples.`);

   // Run the first example of every lesson. All 60 examples + all 15 exercise solutions are
   // separately g++ syntax-checked by verify-cpp-course.cjs; this browser layer verifies every lesson/topic
   // through the actual clang++ -> wasm-ld -> WASI path without stress-testing 75 back-to-back links.
   for(let i=0;i<30;i++){
    const lesson=lessons.nth(i);await lesson.evaluate(el=>{el.open=true;});
    const variant=lesson.locator('[data-lang-variant="cpp"]').first();
    await variant.scrollIntoViewIfNeeded();
    await waitVariantReady(page,variant,`C++ lesson ${i+1}`);
    const result=await runVariant(page,variant,`C++ lesson ${i+1} first example`,30000);
    assert(result.ms<8000,`C++ lesson ${i+1}: prepared Run took ${result.ms}ms`);
    assert(!/\n\n\n/.test(result.raw),`C++ lesson ${i+1}: output contains triple-newline spacing`);
    if((i+1)%5===0)console.log(`Browser-ran C++ topics ${i-4}-${i+1}/30; latest prepared Run ${result.ms}ms`);
    await lesson.evaluate(el=>{el.open=false;});
   }
   // Also run the alternative range/iterator example from the for-loop lesson.
   const loopLesson=lessons.nth(6);await loopLesson.evaluate(el=>{el.open=true;});const loopAlt=loopLesson.locator('[data-lang-variant="cpp"]').nth(1);await loopAlt.scrollIntoViewIfNeeded();await waitVariantReady(page,loopAlt,'C++ loop alternatives');const loopResult=await runVariant(page,loopAlt,'C++ range/iterator example',30000);assert(loopResult.ms<8000,'Prepared range/iterator example is too slow');
   console.log('Dedicated C++ browser runner passed one prepared example from every lesson plus the range/iterator alternative.');

   // Exact GitHub publishing for two examples in the same lesson; paths must not overwrite.
   await lessons.nth(0).evaluate(el=>{el.open=true;});const firstTwo=lessons.nth(0).locator('[data-lang-variant="cpp"]');
   for(let i=0;i<2;i++)await firstTwo.nth(i).locator('[data-publish-language-example="cpp"]').click();await page.waitForTimeout(500);
   const examplePosts=posted.filter(p=>/student-code\/C\+\+\/cpp\/examples\/.+\.cpp$/.test(p.path||''));assert(examplePosts.length>=2,'C++ example publisher did not issue two .cpp writes');assert(examplePosts[0].path!==examplePosts[1].path,'Multiple examples overwrite the same GitHub path');
   for(let i=0;i<2;i++){const shown=String(await firstTwo.nth(i).locator('[data-csai-language-generated],.csai-language-code').first().textContent()||'').trimEnd();assert(examplePosts.some(p=>String(p.content||'').trimEnd()===shown),'C++ example publisher did not send exact displayed source');}
   console.log('C++ example GitHub publishing passed with exact code and unique semantic filenames.');

   // Exercises: all 15 are g++-checked; browser-run five representative solutions across the course.
   await page.locator('.lesson').evaluateAll(els=>els.forEach(el=>{el.open=false;}));
   const payload=await page.evaluate(()=>JSON.parse(document.getElementById('csai-assessment-data').textContent)),tasks=page.locator('.assessment-stack .oa-task');
   assert(payload.exercises.length===15&&await tasks.count()===15,'Expected 15 C++ exercises');
   const exerciseIndexes=[0,3,6,9,14];
   for(const i of exerciseIndexes){const task=tasks.nth(i),solution=String(payload.exercises[i].solution||'');assert(solution.includes('int main'),`Exercise ${i+1} solution is not complete C++`);await task.scrollIntoViewIfNeeded();await task.locator('[data-editor]').fill(solution);const out=task.locator('[data-output]'),initial=String(await out.textContent()||'').trim();await task.locator('[data-run]').first().click();await waitOutput(page,out,initial,125000);const text=String(await out.textContent()||'');if(/Run error|Runner error|did not finish/i.test(text))throw new Error(`Exercise ${i+1} browser run failed: ${text}`);}
   console.log('Representative C++ exercise solutions compiled and ran through the browser worker; all 15 are separately g++-checked.');

   const firstTask=tasks.nth(0),ownCode=String(await firstTask.locator('[data-editor]').inputValue()).trimEnd();await firstTask.locator('[data-publish]').first().click();await page.waitForTimeout(400);assert(posted.some(p=>/student-code\/C\+\+\/cpp\/.+\.cpp$/.test(p.path||'')&&String(p.content||'').trimEnd()===ownCode),'C++ own-solution GitHub publish failed');
   await firstTask.locator('[data-reveal-solution]').click();await page.waitForTimeout(350);const revealed=firstTask.locator('[data-revealed-language="cpp"]');assert(await revealed.count()===1,'C++ revealed solution missing');const revealedCode=String(await revealed.locator('pre').textContent()||'').trimEnd();await revealed.locator('[data-publish-revealed="cpp"]').click();await page.waitForTimeout(400);assert(posted.some(p=>String(p.content||'').trimEnd()===revealedCode&&/student-code\/C\+\+\/cpp\/.+\.cpp$/.test(p.path||'')),'Publish revealed C++ exact-code write failed');
   console.log('C++ exercise own-code + revealed-solution GitHub publishing passed.');
   await page.close();
  }

  // Every existing language-flexible C++ course keeps the fast prepared Run path.
  const cppCourses=[];
  for(const chosen of files.filter(f=>f!=='cpp.html')){
   const page=await context.newPage(),id=chosen.replace(/\.html$/,'');await page.addInitScript(({id})=>{try{localStorage.setItem('csai-course-language-v2:'+id,'python');}catch(e){}},{id});await page.goto(BASE+'/courses/'+encodeURIComponent(chosen),{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(900);const cppButton=page.locator('[data-lang-mode="cpp"]');if(!await cppButton.count()){await page.close();continue;}cppCourses.push(id);await cppButton.first().click();const variant=page.locator('[data-lang-variant="cpp"]').filter({has:page.locator('[data-run-language-example]')}).first();await variant.scrollIntoViewIfNeeded();await waitVariantReady(page,variant,id);const result=await runVariant(page,variant,id+' first C++ example',30000);assert(result.ms<8000,`${id}: prepared C++ Run took ${result.ms}ms`);assert(!/\n\n\n/.test(result.raw),`${id}: output spacing regression`);await page.close();
  }
  assert(cppCourses.length>0,'No language-flexible C++ courses found');console.log('Prepared C++ Run passed on every language-flexible C++ course: '+cppCourses.join(', '));

  // Dual mode exact Python/C++ GitHub publishing remains intact.
  {const page=await context.newPage(),posted=[];await installGitHubMock(page,posted);await page.goto(BASE+'/courses/dsa.html',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1100);const dual=page.locator('[data-lang-mode="dual"]');assert(await dual.count(),'DSA Dual mode missing');await dual.first().click();await page.waitForTimeout(700);const py=page.locator('[data-lang-variant="python"]').filter({has:page.locator('[data-publish-language-example="python"]')}).first(),cpp=page.locator('[data-lang-variant="cpp"]').filter({has:page.locator('[data-publish-language-example="cpp"]')}).first();assert(await py.count()&&await cpp.count(),'Dual example publish buttons missing');const pyCode=String(await py.locator('[data-csai-language-generated],.csai-language-code').first().textContent()||'').trimEnd(),cppCode=String(await cpp.locator('[data-csai-language-generated],.csai-language-code').first().textContent()||'').trimEnd();await py.locator('[data-publish-language-example="python"]').click();await cpp.locator('[data-publish-language-example="cpp"]').click();await page.waitForTimeout(450);assert(posted.some(p=>/student-code\/Python\/.+\.py$/.test(p.path||'')&&String(p.content||'').trimEnd()===pyCode),'Dual Python GitHub publish failed');assert(posted.some(p=>/student-code\/C\+\+\/.+\.cpp$/.test(p.path||'')&&String(p.content||'').trimEnd()===cppCode),'Dual C++ GitHub publish failed');await page.close();}
  console.log('Dual Python/C++ GitHub publishing passed.');
  console.log('FULL BROWSER PREDEPLOY SUITE PASSED.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
