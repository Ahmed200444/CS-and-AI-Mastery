import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {chromium} from 'playwright';

const ROOT=process.cwd(),PORT=4175,BASE=`http://127.0.0.1:${PORT}`;
const files=fs.readdirSync(path.join(ROOT,'courses')).filter(f=>f.endsWith('.html')).sort();
assert.equal(files.length,54);
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{cwd:ROOT,stdio:['ignore','ignore','inherit']});
async function ready(){for(let i=0;i<40;i++){try{if((await fetch(BASE)).ok)return;}catch(e){}await sleep(100);}throw new Error('Theme certification server failed to start');}
await ready();const browser=await chromium.launch({headless:true});const report=[];
try{
  for(const file of files){
    const page=await browser.newPage();const start=performance.now();await page.goto(`${BASE}/courses/${file}`,{waitUntil:'domcontentloaded',timeout:10000});const load=performance.now()-start;assert(load<1000,`${file}: load ${load.toFixed(1)}ms exceeded 1 second`);await page.waitForTimeout(120);
    const button=page.locator('[data-course-theme-toggle]').first();await button.waitFor({state:'visible',timeout:1000});const before=await page.locator('html').getAttribute('data-theme')||'light',clickStart=performance.now();await button.click();await page.waitForFunction(before=>document.documentElement.dataset.theme&&document.documentElement.dataset.theme!==before,before,{timeout:1000});const click=performance.now()-clickStart;assert(click<1000,`${file}: theme change exceeded 1 second`);report.push({file,loadMs:Math.round(load),toggleMs:Math.round(click)});await page.close();
  }
  fs.writeFileSync('theme-certification-report.json',JSON.stringify(report,null,2));console.log(`Theme certification passed on ${report.length} courses.`);
}finally{await browser.close().catch(()=>{});server.kill('SIGTERM');}
