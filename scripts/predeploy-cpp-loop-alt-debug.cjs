const {chromium}=require('playwright');
const BASE=process.env.CSAI_SMOKE_BASE||'http://127.0.0.1:4173';
function assert(v,m){if(!v)throw new Error(m)}
async function waitOutcome(page,out,before,timeout){const el=await out.elementHandle();await page.waitForFunction(({el,before})=>{const t=String(el.textContent||'').trim();return t!==before&&/Output|Run error|Runner error/.test(t);},{el,before},{timeout});return String(await out.textContent()||'')}
(async()=>{
 const browser=await chromium.launch({headless:true});const page=await browser.newPage();
 try{
  page.on('console',m=>{if(/C\+\+ runner/.test(m.text()))console.log('[browser]',m.text())});
  await page.goto(BASE+'/courses/cpp.html',{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1200);
  const lessons=page.locator('.lesson');assert(await lessons.count()===30,'Expected 30 C++ lessons');await lessons.evaluateAll(xs=>xs.forEach(x=>{x.open=false}));
  const lesson=lessons.nth(6);await lesson.evaluate(x=>{x.open=true});
  const variants=lesson.locator('[data-lang-variant="cpp"]');assert(await variants.count()===2,'Loop lesson should have two examples');
  const first=variants.nth(0),second=variants.nth(1);
  const firstNote=first.locator('.csai-example-note'),firstNoteEl=await firstNote.elementHandle();await page.waitForFunction(n=>/C\+\+ ready/.test(String(n.textContent||'')),firstNoteEl,{timeout:90000});
  console.log('First loop example ready:',await firstNote.textContent());
  const firstOut=first.locator('[data-csai-example-output]'),firstBefore=String(await firstOut.textContent()||'').trim(),firstStart=Date.now();await first.locator('[data-run-language-example]').click();let text=await waitOutcome(page,firstOut,firstBefore,30000);assert(!/Run error|Runner error/.test(text),'First loop example failed: '+text);console.log('First prepared Run:',Date.now()-firstStart,'ms');
  await lesson.evaluate(x=>{x.open=false});await page.waitForTimeout(250);await lesson.evaluate(x=>{x.open=true});await second.scrollIntoViewIfNeeded();
  const secondNote=second.locator('.csai-example-note');console.log('Second initial note:',await secondNote.textContent());
  let ready=false;try{const n=await secondNote.elementHandle();await page.waitForFunction(el=>/C\+\+ ready/.test(String(el.textContent||'')),n,{timeout:70000});ready=true}catch(e){console.log('Second did not become ready in background. Final note:',await secondNote.textContent())}
  const out=second.locator('[data-csai-example-output]'),before=String(await out.textContent()||'').trim(),start=Date.now();await second.locator('[data-run-language-example]').click();text=await waitOutcome(page,out,before,125000);const ms=Date.now()-start;console.log('Second run after ready='+ready+':',ms,'ms; output=',JSON.stringify(text));assert(!/Run error|Runner error|took too long/i.test(text),'Second loop example failed: '+text);if(!ready)throw new Error('Second loop example runs, but background warmup did not prepare it.');if(ms>8000)throw new Error('Second prepared Run was too slow: '+ms+'ms');
  console.log('SECOND C++ LOOP EXAMPLE WARMUP PASSED.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
