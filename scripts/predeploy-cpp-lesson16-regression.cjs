const {chromium}=require('playwright');
const BASE=process.env.CSAI_SMOKE_BASE||'http://127.0.0.1:4173';
function assert(v,m){if(!v)throw new Error(m);}
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage();
 try{
  await page.goto(BASE+'/courses/cpp.html',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1300);
  const lessons=page.locator('.lesson');assert(await lessons.count()===30,'Expected 30 C++ lessons');
  // Close every lesson first so hidden examples cannot be mistaken for the current target.
  await lessons.evaluateAll(xs=>xs.forEach(x=>{x.open=false}));
  const lesson=lessons.nth(15);await lesson.evaluate(x=>{x.open=true});
  const variant=lesson.locator('[data-lang-variant="cpp"]').first();await variant.scrollIntoViewIfNeeded();
  const note=variant.locator('.csai-example-note').first(),noteEl=await note.elementHandle();
  await page.waitForFunction(n=>/C\+\+ ready/.test(String(n.textContent||'')),noteEl,{timeout:90000});
  const run=variant.locator('[data-run-language-example]').first(),out=variant.locator('[data-csai-example-output]').first(),before=String(await out.textContent()||'').trim(),start=Date.now();
  await run.click();const outEl=await out.elementHandle();await page.waitForFunction(({el,before})=>{const t=String(el.textContent||'').trim();return t!==before&&/Output|Run error|Runner error/.test(t);},{el:outEl,before},{timeout:30000});
  const ms=Date.now()-start,text=String(await out.textContent()||'');assert(!/Run error|Runner error|took too long/i.test(text),'Lesson 16 C++ run failed: '+text);assert(ms<8000,`Lesson 16 prepared Run took ${ms}ms`);
  console.log(`C++ lesson 16 structs regression passed; prepared Run ${ms}ms.`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
