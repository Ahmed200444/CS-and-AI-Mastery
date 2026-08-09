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
    window.__csaiMutationStacks=[];
    const targetRelated=(el,value='')=>{
      try{
        if(String(value||'').includes('dsa_ex4')||String(value||'').includes('Array vs linked list trade-off'))return true;
        if(!el||el.nodeType!==1)return false;
        if(el.getAttribute?.('data-task')==='dsa_ex4'||el.getAttribute?.('data-title')==='Array vs linked list trade-off')return true;
        return !!el.closest?.('[data-task="dsa_ex4"]');
      }catch(e){return false;}
    };
    const log=(kind,el,value)=>{
      if(!targetRelated(el,value))return;
      try{window.__csaiMutationStacks.push({kind,tag:el?.tagName||null,task:el?.getAttribute?.('data-task')||el?.closest?.('[data-task]')?.getAttribute?.('data-task')||null,value:String(value||'').slice(0,500),stack:new Error(kind).stack});}catch(e){}
    };
    const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
    if(inner?.get&&inner?.set)Object.defineProperty(Element.prototype,'innerHTML',{configurable:true,enumerable:inner.enumerable,get:inner.get,set:function(value){log('innerHTML',this,value);return inner.set.call(this,value);}});
    const originalInsert=Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML=function(position,text){log('insertAdjacentHTML',this,text);return originalInsert.call(this,position,text);};
    const originalReplaceChildren=Element.prototype.replaceChildren;
    Element.prototype.replaceChildren=function(...nodes){log('replaceChildren',this,nodes.map(n=>n?.outerHTML||n?.textContent||String(n)).join(' '));return originalReplaceChildren.apply(this,nodes);};
    const originalAppend=Element.prototype.append;
    Element.prototype.append=function(...nodes){log('append',this,nodes.map(n=>n?.outerHTML||n?.textContent||String(n)).join(' '));return originalAppend.apply(this,nodes);};
    const originalAppendChild=Node.prototype.appendChild;
    Node.prototype.appendChild=function(node){log('appendChild',this,node?.outerHTML||node?.textContent||'');return originalAppendChild.call(this,node);};
    const originalReplaceWith=Element.prototype.replaceWith;
    Element.prototype.replaceWith=function(...nodes){log('replaceWith',this,nodes.map(n=>n?.outerHTML||n?.textContent||String(n)).join(' '));return originalReplaceWith.apply(this,nodes);};
    const originalRemove=Element.prototype.remove;
    Element.prototype.remove=function(){log('remove',this,this.outerHTML||'');return originalRemove.call(this);};
  });
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e.message||e)));
  const githubRequests=[];
  await page.route('**/api/github/status',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({connected:true,csrf:'routing-csrf',repositories:[{full_name:'Ahmed200444/CS-and-AI-Mastery'}],user:{login:'Ahmed200444'}})}));
  await page.route('**/api/github/file',async route=>{
    const body=JSON.parse(route.request().postData()||'{}');githubRequests.push(body);
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,alreadyExists:false,path:body.path,commit:'routing-cert'})});
  });
  await page.goto(`${BASE}/courses/dsa.html`,{waitUntil:'domcontentloaded',timeout:10000});
  await page.waitForTimeout(1200);
  report.payload=await page.evaluate(()=>{
    try{
      const data=JSON.parse(document.getElementById('csai-assessment-data')?.textContent||'{}');
      const item=(data.exercises||[]).find(x=>x&&x.id==='dsa_ex4')||null;
      return {
        item:item?{id:item.id,title:item.title,type:item.type,prompt:item.prompt||item.description||'',starter:item.starter||null,solution:item.solution||null}:null,
        structured:data.structured?.dsa_ex4||null,
        defaultLanguage:data.defaultLanguage||null
      };
    }catch(error){return {error:String(error?.message||error)};}
  });
  report.scripts=await page.evaluate(()=>[...document.scripts].map(s=>s.src||'(inline)').filter(Boolean));
  report.mutationStacks=await page.evaluate(()=>window.__csaiMutationStacks||[]);
  const task=page.locator('.oa-task').nth(3);
  assert(await task.count(),'DSA task 4 is missing');
  report.task=await task.evaluate(el=>({
    title:el.getAttribute('data-title'),
    task:el.getAttribute('data-task'),
    responseTask:el.getAttribute('data-response-task'),
    responseTextarea:!!el.querySelector('textarea.oa-answer'),
    editorOuterHTML:el.querySelector('textarea')?.outerHTML||null,
    runCount:el.querySelectorAll('[data-run],[data-universal-run],[data-compare]').length,
    actionText:[...el.querySelectorAll('button')].map(b=>String(b.textContent||'').trim()),
    publishCount:el.querySelectorAll('[data-final-publish],[data-publish]').length,
    publishElements:[...el.querySelectorAll('[data-final-publish],[data-publish]')].map(node=>({tag:node.tagName,classes:String(node.className||''),text:String(node.textContent||'').trim(),final:node.hasAttribute('data-final-publish'),legacy:node.hasAttribute('data-publish'),parentClass:String(node.parentElement?.className||''),parentTag:node.parentElement?.tagName||'',outerHTML:node.outerHTML})),
    toolbarHTML:el.querySelector('.oa-toolbar,.oa-response-actions')?.outerHTML||null,
    readmeCount:el.querySelectorAll('[data-final-readme]').length
  }));
  report.pageErrors=errors;
  fs.writeFileSync('routing-regression-report.json',JSON.stringify(report,null,2));

  assert.equal(errors.length,0,`DSA page error: ${errors[0]||''}`);
  assert(report.payload.item,'dsa_ex4 is missing from embedded assessment data');
  assert.equal(report.payload.item.title,'Array vs linked list trade-off','Unexpected embedded dsa_ex4 title');
  assert.equal(report.payload.item.type,'scenario-analysis',`dsa_ex4 payload was not classified as conceptual: ${JSON.stringify(report.payload.item)}`);
  assert.equal(report.payload.structured,null,'Conceptual dsa_ex4 must not have structured coding tests');
  assert.equal(report.task.title,'Array vs linked list trade-off','Unexpected DSA task 4 title');
  assert.equal(report.task.responseTask,'1',`Conceptual DSA task must stay marked as a response task. Mutation stacks: ${JSON.stringify(report.mutationStacks.slice(-8))}`);
  assert.equal(report.task.responseTextarea,true,'Conceptual DSA task must keep its response textarea');
  assert.equal(report.task.runCount,0,'Conceptual response task must not have a Run/Check button');
  assert(report.task.actionText.some(t=>/mark complete/i.test(t)),'Conceptual response task must keep Mark complete');
  assert.equal(report.task.publishCount,1,`Conceptual response task must have exactly one Publish button. Found: ${JSON.stringify(report.task.publishElements)}`);
  assert.equal(report.task.readmeCount,1,'Conceptual response task must have exactly one README button');

  const answer=task.locator('textarea.oa-answer');
  await answer.fill('A linked list fits better because front insertion can be O(1) and random index access is not required.');
  const publish=task.locator('[data-final-publish]').first(),readme=task.locator('[data-final-readme]').first(),status=task.locator('.csai-final-publish-status').first();
  await publish.click();
  await page.waitForFunction(()=>/Published|Already published/.test(document.querySelector('[data-task="dsa_ex4"] .csai-final-publish-status')?.textContent||''),null,{timeout:3000});
  await readme.click();
  await page.waitForFunction(()=>/README (added|already added)/.test(document.querySelector('[data-task="dsa_ex4"] .csai-final-publish-status')?.textContent||''),null,{timeout:3000});
  assert.equal(githubRequests.length,2,`Expected code + README requests, got ${githubRequests.length}`);
  const codeReq=githubRequests[0],readmeReq=githubRequests[1],expectedCode='student-code/practice/dsa/array-vs-linked-list-trade-off/text/solution.txt',expectedReadme='student-code/practice/dsa/array-vs-linked-list-trade-off/text/README.md';
  assert.equal(codeReq.path,expectedCode,`Conceptual response published to wrong path: ${codeReq.path}`);
  assert.equal(codeReq.createOnly,true,'Conceptual response code must be create-only');
  assert.equal(readmeReq.path,expectedReadme,`Conceptual response README published to wrong path: ${readmeReq.path}`);
  assert.equal(readmeReq.requirePath,expectedCode,'Conceptual response README must require its exact text file');
  assert(String(readmeReq.content).includes('**Language:** Text'),'Conceptual response README must identify Text language');
  report.githubRequests=githubRequests;
  report.finalStatus=await status.textContent();
  report.pageErrors=errors;
  fs.writeFileSync('routing-regression-report.json',JSON.stringify(report,null,2));
  console.log('Flexible-language/response-task routing regression passed.');
}finally{await browser.close().catch(()=>{});server.kill('SIGTERM');}
