const fs=require('fs');
const path=require('path');
const root=process.cwd(),failures=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const assetPath=path.join(root,'assets','study-examples.js');
function fail(message){failures.push(message);}

if(!fs.existsSync(assetPath))fail('assets/study-examples.js is missing');
else{
 const src=fs.readFileSync(assetPath,'utf8');
 const required=[
  ['5-example minimum and 8-example maximum',/clamp\(Math\.max\(concepts\(b\)\.length,objectives\(b\)\.length\)\+2,5,8\)/],
  ['study-set count marker',/data-study-count/],
  ['visible study cards',/csai-study-example csai-example-card/],
  ['editable Python editor',/csai-study-code/],
  ['Run \/ Check control',/▶ Run \/ Check/],
  ['visible output panel',/data-study-output/],
  ['Reset control',/data-study-reset/],
  ['GitHub publish control',/data-final-publish/],
  ['README control',/data-final-readme/],
  ['publisher-compatible toolbar',/csai-example-actions/],
  ['shared Python execution',/\.runSource\(area\.value\)/],
  ['lazy lesson build on open',/lesson\.addEventListener\('toggle',[\s\S]*if\(lesson\.open\)buildLesson\(lesson\)/],
  ['initial open lesson build',/if\(lesson\.open\)buildLesson\(lesson\)/],
  ['original single-example replacement',/hideOld/]
 ];
 for(const [label,re] of required)if(!re.test(src))fail(`study-examples.js missing ${label}`);
 if(/new\s+MutationObserver|MutationObserver\s*\(/.test(src))fail('study-examples.js must not use a page-wide MutationObserver');
 if(/querySelectorAll\('\.lesson'\)\.forEach\(buildLesson\)/.test(src))fail('study-examples.js must not build every lesson eagerly');
}

const adaptive=read('assets/adaptive-practice-layer.js');
if(!/window\.CSAIPythonRunner=\{prewarm:prewarmPython,runSource:runPython/.test(adaptive))fail('shared Python runner API missing');
if(/MutationObserver|querySelectorAll\('\.lesson'\)|data-adaptive-lab|adaptive-tab|function\s+render\(/.test(adaptive))fail('adaptive-practice-layer.js still contains the old DOM-rendering example system');

const publisher=read('assets/portfolio-publish-controls.js');
for(const marker of ['[data-final-publish],[data-final-readme]','function readme(d)','Publish to GitHub','Add a README'])if(!publisher.includes(marker))fail(`portfolio publisher missing ${marker}`);

const coursesDir=path.join(root,'courses');
const pages=fs.existsSync(coursesDir)?fs.readdirSync(coursesDir).filter(name=>name.endsWith('.html')):[];
if(pages.length!==57)fail(`expected 57 course pages, found ${pages.length}`);
for(const name of pages){
 const html=fs.readFileSync(path.join(coursesDir,name),'utf8');
 const studyCount=(html.match(/\/assets\/study-examples\.js/g)||[]).length;
 if(studyCount!==1)fail(`${name}: study-examples.js must appear exactly once, found ${studyCount}`);
 if(!html.includes('portfolio-publish-controls.js'))fail(`${name}: portfolio publisher missing`);
 if(!html.includes('adaptive-practice-layer.js?v=20260811-3'))fail(`${name}: cache-busted shared Python runner missing`);
 if(!/<details\b[^>]*class=["'][^"']*\blesson\b[^"']*["'][^>]*\bopen\b/i.test(html))fail(`${name}: no initially open lesson for immediate study-example rendering`);
 if(/lesson-example-runner\.js|runnable-lesson-example-fixes\.js|lesson-example-runner-guard\.js/.test(html))fail(`${name}: obsolete original-example runtime remains`);
}

if(failures.length){console.error('Study-example verification failed:');failures.slice(0,160).forEach(x=>console.error(' - '+x));process.exit(1);}
console.log('Study-example verification passed: all 57 course pages use lazy, responsive 5–8-example lesson rendering with Run/Check, output, Reset, GitHub publishing, and README controls.');
