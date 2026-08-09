import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {chromium} from 'playwright';

const ROOT=process.cwd(),PORT=4176,BASE=`http://127.0.0.1:${PORT}`;
assert(fs.existsSync(path.join(ROOT,'courses','dsa.html')),'Generated DSA page is missing');
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{cwd:ROOT,stdio:['ignore','ignore','inherit']});
async function ready(){for(let i=0;i<50;i++){try{if((await fetch(BASE)).ok)return;}catch(e){}await sleep(100);}throw new Error('Routing regression server failed to start');}
await ready();
const browser=await chromium.launch({headless:true});
const report={};
try{
  const context=await browser.newContext();
  await context.addInitScript(()=>{
    window.__csaiStopLog=[];
    const originalImmediate=Event.prototype.stopImmediatePropagation;
    const originalPropagation=Event.prototype.stopPropagation;
    Event.prototype.stopImmediatePropagation=function(){
      try{window.__csaiStopLog.push({kind:'immediate',type:this.type,target:this.target?.outerHTML?.slice(0,240)||String(this.target),stack:new Error('stopImmediatePropagation').stack});}catch(e){}
      return originalImmediate.call(this);
    };
    Event.prototype.stopPropagation=function(){
      try{if(this.type==='click')window.__csaiStopLog.push({kind:'propagation',type:this.type,target:this.target?.outerHTML?.slice(0,240)||String(this.target),stack:new Error('stopPropagation').stack});}catch(e){}
      return originalPropagation.call(this);
    };
  });
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
  await page.goto(`${BASE}/courses/dsa.html`,{waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForTimeout(900);
  const python=page.locator('[data-lang-mode="python"]').first();
  await python.click();await page.waitForTimeout(450);
  const task=page.locator('.oa-task').nth(3),editor=task.locator('textarea[data-editor]:not(.oa-answer)').first(),button=task.locator('[data-run],[data-universal-run]').first(),out=task.locator('[data-output]').first();
  assert(await editor.count()&&await button.count()&&await out.count(),'DSA task 4 coding workspace is missing');
  await editor.fill('print("routing-ok")\n');await editor.dispatchEvent('input');await page.waitForTimeout(80);
  report.before=await task.evaluate(el=>({title:el.getAttribute('data-title'),task:el.getAttribute('data-task'),activeMode:el.getAttribute('data-csai-active-language'),editorLanguage:el.getAttribute('data-csai-editor-language'),select:el.querySelector('[data-lang]')?.value||null,button:el.querySelector('[data-run],[data-universal-run]')?.outerHTML||null,output:el.querySelector('[data-output]')?.textContent||null,code:el.querySelector('textarea[data-editor]:not(.oa-answer)')?.value||null}));
  const beforeStops=await page.evaluate(()=>window.__csaiStopLog.length);
  await button.click();
  const deadline=Date.now()+8000;let text='';while(Date.now()<deadline){text=String(await out.textContent());if(text.includes('routing-ok')||/Run error|Runner error|Error/i.test(text))break;await sleep(80);}
  report.after={output:text,disabled:await button.isDisabled().catch(()=>false),state:await task.evaluate(el=>({activeMode:el.getAttribute('data-csai-active-language'),editorLanguage:el.getAttribute('data-csai-editor-language'),select:el.querySelector('[data-lang]')?.value||null}))};
  report.stops=(await page.evaluate(()=>window.__csaiStopLog)).slice(beforeStops);
  report.pageErrors=errors;
  fs.writeFileSync('routing-regression-report.json',JSON.stringify(report,null,2));
  assert.equal(errors.length,0,`DSA page error: ${errors[0]||''}`);
  assert(text.includes('routing-ok'),`DSA task 4 Python routing failed. ${JSON.stringify(report,null,2)}`);
  console.log('Flexible-language routing regression passed.');
}finally{await browser.close().catch(()=>{});server.kill('SIGTERM');}
