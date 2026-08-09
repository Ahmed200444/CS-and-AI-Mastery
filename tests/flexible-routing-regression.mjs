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
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
  await page.goto(`${BASE}/courses/dsa.html`,{waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForTimeout(1000);
  const task=page.locator('.oa-task').nth(3);
  assert(await task.count(),'DSA task 4 is missing');
  report.task=await task.evaluate(el=>({
    title:el.getAttribute('data-title'),
    task:el.getAttribute('data-task'),
    responseTask:el.getAttribute('data-response-task'),
    responseTextarea:!!el.querySelector('textarea.oa-answer'),
    runCount:el.querySelectorAll('[data-run],[data-universal-run],[data-compare]').length,
    actionText:[...el.querySelectorAll('button')].map(b=>String(b.textContent||'').trim()),
    publishCount:el.querySelectorAll('[data-final-publish],[data-publish]').length,
    readmeCount:el.querySelectorAll('[data-final-readme]').length
  }));
  report.pageErrors=errors;
  fs.writeFileSync('routing-regression-report.json',JSON.stringify(report,null,2));
  assert.equal(errors.length,0,`DSA page error: ${errors[0]||''}`);
  assert.equal(report.task.title,'Array vs linked list trade-off','Unexpected DSA task 4 title');
  assert.equal(report.task.responseTask,'1','Conceptual DSA task must stay marked as a response task');
  assert.equal(report.task.responseTextarea,true,'Conceptual DSA task must keep its response textarea');
  assert.equal(report.task.runCount,0,'Conceptual response task must not have a Run/Check button');
  assert(report.task.actionText.some(t=>/mark complete/i.test(t)),'Conceptual response task must keep Mark complete');
  assert(report.task.publishCount>=1,'Conceptual response task must remain publishable');
  console.log('Flexible-language/response-task routing regression passed.');
}finally{await browser.close().catch(()=>{});server.kill('SIGTERM');}
