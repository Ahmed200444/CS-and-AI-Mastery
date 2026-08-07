const fs=require('fs');
const path=require('path');

const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');

const fixTag='<script src="/assets/runnable-lesson-example-fixes.js?v=20260807-1"></script>';
const runnerTag='<script src="/assets/lesson-example-runner.js?v=20260807-2"></script>';
const guardTag='<script src="/assets/lesson-example-runner-guard.js?v=20260807-1"></script>';
let count=0;
for(const file of fs.readdirSync(dir).filter(name=>name.endsWith('.html'))){
  const full=path.join(dir,file);
  let html=fs.readFileSync(full,'utf8');
  html=html.replace(/<script[^>]*src=["']\/assets\/runnable-lesson-example-fixes\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  html=html.replace(/<script[^>]*src=["']\/assets\/lesson-example-runner\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  html=html.replace(/<script[^>]*src=["']\/assets\/lesson-example-runner-guard\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  const body=html.toLowerCase().lastIndexOf('</body>');
  const tags=fixTag+'\n'+runnerTag+'\n'+guardTag+'\n';
  html=body>=0?html.slice(0,body)+tags+html.slice(body):html+'\n'+tags;
  fs.writeFileSync(full,html,'utf8');
  count++;
}
if(count!==54)throw new Error(`Expected 54 course pages, updated ${count}`);
console.log(`Added runnable lesson examples with pseudocode protection to ${count} course pages.`);
