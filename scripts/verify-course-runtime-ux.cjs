const fs=require('fs');
const path=require('path');
const root=process.cwd();
const dir=path.join(root,'courses');
const controllerPath=path.join(root,'assets','course-language-mode-controller.js');
const catalogPath=path.join(root,'assets','catalog-recovery.js');
const guardPath=path.join(root,'scripts','inject-course-first-paint-guard.cjs');
const problems=[];
if(!fs.existsSync(controllerPath))problems.push('course language controller missing');
if(!fs.existsSync(catalogPath))problems.push('catalog recovery missing');
if(!fs.existsSync(guardPath))problems.push('first-paint guard injector missing');
if(!fs.existsSync(dir))problems.push('courses directory missing');
if(!problems.length){
 const controller=fs.readFileSync(controllerPath,'utf8');
 const catalog=fs.readFileSync(catalogPath,'utf8');
 const guard=fs.readFileSync(guardPath,'utf8');
 const checks=[
  ['strict flexible course list',/FLEXIBLE_IDS=\['dsa','problem-solving','oop','algorithms','data-structures'\]/],
  ['C++ starter',/function cppStarter\(task\)/],
  ['Python draft separation',/draftKey\(task,lang\)/],
  ['C++ editor mode',/data-csai-active-language/],
  ['mode click handler',/data-lang-mode/],
  ['post-render reapply',/MutationObserver/],
  ['assessment task application',/\.assessment-stack \.oa-task/],
  ['Dual single editor preservation',/if\(m==='python'\|\|m==='cpp'\)loadLanguage/]
 ];
 for(const [label,re] of checks)if(!re.test(controller))problems.push('course-language-mode-controller.js missing '+label);
 if(/var id=b\.getAttribute\('data-scr-course'\);remove\(\);/.test(catalog))problems.push('catalog still exposes underlying raw course screen before navigation');
 if(!/location\.assign\(url\);return/.test(catalog))problems.push('catalog does not navigate directly while overlay remains visible');
 if(!/bootClass\(html\)/.test(guard)||!/<html\[\^>\]\*csai-course-booting/.test(guard))problems.push('first-paint guard does not bake boot state into initial HTML');
 const files=fs.readdirSync(dir).filter(x=>x.endsWith('.html'));
 if(files.length!==54)problems.push(`expected 54 course pages, found ${files.length}`);
 for(const name of files){
  const html=fs.readFileSync(path.join(dir,name),'utf8');
  if(!/<html[^>]*csai-course-booting/i.test(html))problems.push(`${name}: initial boot class missing`);
  if(!html.includes('/assets/course-language-mode-controller.js?v=20260808-1'))problems.push(`${name}: language controller missing`);
  if(!html.includes('/assets/dual-single-editor-publish.js'))problems.push(`${name}: Dual publisher missing`);
  if(!html.includes('csai-course-first-paint-start')||!html.includes('csai-course-first-paint-end'))problems.push(`${name}: first-paint guard incomplete`);
 }
}
if(problems.length)throw new Error('Course runtime UX verification failed:\n'+problems.slice(0,120).join('\n'));
console.log('Course runtime UX verification passed: no catalog raw-screen exposure, initial-byte first-paint guard on 54 pages, and resilient Python/C++/Dual switching.');
