import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {chromium} from 'playwright';

const ROOT=process.cwd(),PORT=4174,BASE=`http://127.0.0.1:${PORT}`;
const files=fs.readdirSync(path.join(ROOT,'courses')).filter(f=>f.endsWith('.html')).sort();
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{cwd:ROOT,stdio:['ignore','ignore','inherit']});
async function ready(){for(let i=0;i<50;i++){try{if((await fetch(BASE)).ok)return;}catch(e){}await sleep(100);}throw new Error('C++ certification server failed to start');}
const code='#include <iostream>\nusing namespace std;\nint main(){ cout << "cert-ok" << endl; return 0; }\n';
const report={courses:0,examples:0,exercises:0,dualExercises:0,projects:0,coldRuns:[],maxFeedbackMs:0};
async function feedbackRun(button,out,label,max=60000){
  const before=await out.textContent().catch(()=>''),start=performance.now();
  await button.click({timeout:5000});
  const sel=await out.evaluate(el=>{if(!el.id)el.id='cpp-cert-'+Math.random().toString(36).slice(2);return '#'+CSS.escape(el.id)});
  await button.page().waitForFunction(({sel,before})=>{const o=document.querySelector(sel);return o&&String(o.textContent||'')!==String(before||'');},{sel,before},{timeout:1000});
  const feedback=performance.now()-start;report.maxFeedbackMs=Math.max(report.maxFeedbackMs,feedback);assert(feedback<1000,`${label}: no visible feedback under 1 second`);
  const end=Date.now()+max;while(Date.now()<end){const text=String(await out.textContent().catch(()=>''));if(/cert-ok|Run error|Runner error|compilation failed|timed out/i.test(text)){assert(text.includes('cert-ok'),`${label}: real C++ output failed: ${text.slice(0,500)}`);report.coldRuns.push({label,ms:Math.round(performance.now()-start)});return;}await sleep(100);}
  throw new Error(`${label}: C++ run did not complete`);
}
await ready();const browser=await chromium.launch({headless:true});
try{
  for(const file of files){
    const context=await browser.newContext(),page=await context.newPage();await page.goto(`${BASE}/courses/${file}`,{waitUntil:'domcontentloaded',timeout:10000});await page.waitForTimeout(250);
    const cppMode=page.locator('[data-lang-mode="cpp"]').first();if(!await cppMode.count()||!await cppMode.isVisible().catch(()=>false)){await context.close();continue;}
    report.courses++;await cppMode.click();await page.waitForTimeout(120);
    const examples=page.locator('[data-lang-variant="cpp"] [data-run-language-example]');
    for(let i=0;i<await examples.count();i++){
      const b=examples.nth(i);if(!await b.isVisible().catch(()=>false))continue;const root=b.locator('xpath=ancestor::*[@data-lang-variant="cpp"][1]'),out=root.locator('[data-csai-example-output]').first();if(!await out.count())continue;
      const start=performance.now(),before=await out.textContent();await b.click();const sel=await out.evaluate(el=>{if(!el.id)el.id='cpp-ex-out-'+Math.random().toString(36).slice(2);return '#'+CSS.escape(el.id)});await page.waitForFunction(({sel,before})=>{const o=document.querySelector(sel);return o&&String(o.textContent||'')!==String(before||'');},{sel,before},{timeout:1000});report.maxFeedbackMs=Math.max(report.maxFeedbackMs,performance.now()-start);
      const end=Date.now()+60000;let text='';while(Date.now()<end){text=String(await out.textContent());if(/Output|Run error|Runner error|compilation failed|timed out/i.test(text))break;await sleep(100);}assert(!/Run error|Runner error|compilation failed|timed out/i.test(text),`${file} C++ example ${i+1} failed: ${text.slice(0,500)}`);report.examples++;
    }
    const tasks=page.locator('.oa-task');for(let i=0;i<await tasks.count();i++){const task=tasks.nth(i),editor=task.locator('textarea[data-editor]:not(.oa-answer)').first(),run=task.locator('[data-run],[data-universal-run]').first(),out=task.locator('[data-output]').first();if(!await editor.count()||!await run.count()||!await out.count())continue;await editor.fill(code);await editor.dispatchEvent('input');await feedbackRun(run,out,`${file} exercise ${i+1}`);report.exercises++;}
    const dual=page.locator('[data-lang-mode="dual"]').first();if(await dual.count()&&await dual.isVisible().catch(()=>false)){await dual.click();await page.waitForTimeout(100);for(let i=0;i<await tasks.count();i++){const task=tasks.nth(i),editor=task.locator('textarea[data-editor]:not(.oa-answer)').first(),run=task.locator('[data-run],[data-universal-run]').first(),out=task.locator('[data-output]').first();if(!await editor.count()||!await run.count()||!await out.count())continue;await editor.fill(code);await editor.dispatchEvent('input');await feedbackRun(run,out,`${file} dual C++ exercise ${i+1}`);report.dualExercises++;}}
    await cppMode.click();await page.waitForTimeout(100);
    const projects=page.locator('.project-card');for(let i=0;i<await projects.count();i++){const card=projects.nth(i),select=card.locator('[data-project-lang]').first();if(!await select.count())continue;const opts=await select.locator('option').evaluateAll(o=>o.map(x=>x.value));if(!opts.includes('cpp'))continue;await select.selectOption('cpp');const editor=card.locator('[data-project-editor]').first(),run=card.locator('[data-project-run]').first(),out=card.locator('[data-project-output]').first();await editor.fill(code);await editor.dispatchEvent('input');await feedbackRun(run,out,`${file} C++ project ${i+1}`);report.projects++;}
    await context.close();
  }
  assert(report.courses>0,'No C++-enabled courses were found');assert(report.exercises>0,'No C++ exercises were certified');assert(report.maxFeedbackMs<1000,`C++ feedback exceeded 1 second: ${report.maxFeedbackMs.toFixed(1)}ms`);fs.writeFileSync('cpp-workspace-certification-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));console.log('C++ workspace certification passed.');
}finally{await browser.close().catch(()=>{});server.kill('SIGTERM');}
