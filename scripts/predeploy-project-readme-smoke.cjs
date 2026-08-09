const {chromium}=require('playwright');
const BASE=process.env.CSAI_SMOKE_BASE||'http://127.0.0.1:4173';
function assert(v,m){if(!v)throw new Error(m);}
async function mockGitHub(page,posted){
 await page.route('**/api/github/status',async r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({connected:true,csrf:'test-csrf',repositories:[{full_name:'Ahmed200444/CS-and-AI-Mastery'}]})}));
 await page.route('**/api/github/file',async r=>{posted.push(JSON.parse(r.request().postData()||'{}'));await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});});
}
async function testProject(context,courseId,expectedExt,expectedLang,runIt){
 const page=await context.newPage(),posted=[];await mockGitHub(page,posted);
 await page.goto(BASE+'/courses/'+courseId+'.html',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForSelector('.project-card',{timeout:15000});await page.waitForTimeout(500);
 const card=page.locator('.project-card').first(),title=String(await card.locator('.project-head h3').textContent()||'').trim();
 const select=card.locator('[data-project-lang]'),editor=card.locator('[data-project-editor]'),fileLabel=String(await card.locator('[data-project-file]').textContent()||'').trim();
 assert(await select.inputValue()===expectedLang,`${courseId}: project language should be ${expectedLang}`);
 assert(fileLabel.endsWith('.'+expectedExt),`${courseId}: project filename should end in .${expectedExt}`);
 let source=String(await editor.inputValue()||'');
 if(expectedLang==='cpp'){
  source='#include <iostream>\nusing namespace std;\nint main(){ cout << "README_TEST" << endl; return 0; }\n';
  await editor.fill(source);
 }
 if(runIt){
  const out=card.locator('[data-project-output]'),before=String(await out.textContent()||'').trim();
  await card.locator('[data-project-run]').click();
  const h=await out.elementHandle();
  await page.waitForFunction(({el,before})=>{const t=String(el.textContent||'').trim();return t!==before&&/Output|Run error|Runner error|Check complete/.test(t);},{el:h,before},{timeout:125000});
  const text=String(await out.textContent()||'');assert(!/Run error|Runner error|took too long/i.test(text),`${courseId}: project run failed: ${text}`);
 }
 await card.locator('[data-project-publish]').click();
 await page.waitForFunction(()=>document.querySelector('[data-project-status]')?.textContent.includes('README.md'),{timeout:15000});
 assert(posted.length===2,`${courseId}: expected exactly code + README GitHub writes, got ${posted.length}`);
 const code=posted.find(p=>String(p.path||'').endsWith('.'+expectedExt)),readme=posted.find(p=>String(p.path||'').endsWith('/README.md'));
 assert(code,`${courseId}: project code write missing`);assert(readme,`${courseId}: README.md write missing`);
 const codeDir=String(code.path).slice(0,String(code.path).lastIndexOf('/')),readmeDir=String(readme.path).slice(0,String(readme.path).lastIndexOf('/'));
 assert(codeDir===readmeDir,`${courseId}: code and README are not in the same project folder`);
 assert(String(code.path).startsWith(`student-code/projects/${courseId}/`),`${courseId}: unexpected project path ${code.path}`);
 assert(String(code.content||'').trimEnd()===source.trimEnd(),`${courseId}: published project source differs from editor`);
 const md=String(readme.content||'');
 assert(md.includes('# '+title),`${courseId}: README title missing`);
 assert(md.includes('## Course'),`${courseId}: README course section missing`);
 assert(md.includes('## What this project practices'),`${courseId}: README concepts section missing`);
 assert(md.includes('## Files'),`${courseId}: README files section missing`);
 assert(md.includes('## How to run'),`${courseId}: README run section missing`);
 assert(md.includes('`README.md`'),`${courseId}: README file list missing README.md`);
 if(expectedLang==='cpp')assert(md.includes('g++ -std=c++17'),`${courseId}: C++ README compile command missing`);
 console.log(`[${courseId}] project GitHub code + README passed: ${code.path} | ${readme.path}`);
 await page.close();
}
(async()=>{
 const browser=await chromium.launch({headless:true});const context=await browser.newContext();
 try{
  await testProject(context,'cpp','cpp','cpp',true);
  await testProject(context,'python','py','python',false);
  const home=await context.newPage();await home.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});assert(await home.locator('details.hub-changelog').count()===0,'Visible version/changelog block remains at bottom of home page');await home.close();
  console.log('PROJECT README + VISIBLE VERSION PREDEPLOY SMOKE PASSED.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
