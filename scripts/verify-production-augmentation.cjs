const fs=require('fs');
const path=require('path');
const root=process.cwd(),failures=[];
const catalogPath=path.join(root,'assets','catalog-data.json'),coursesDir=path.join(root,'courses'),dataDir=path.join(root,'assets','course-data'),indexPath=path.join(root,'index.html');
function fail(x){failures.push(x)}
function arr(v){return Array.isArray(v)?v:[]}
function countExamples(lesson){const c=arr(lesson.concepts).filter(Boolean).length,o=arr(lesson.objectives).filter(Boolean).length;return Math.max(5,Math.min(8,Math.max(c,o)+2));}
const required=['embedded-systems','systems-programming','advanced-computer-organization'];
if(!fs.existsSync(catalogPath))fail('catalog-data.json missing after augmentation');
if(!fs.existsSync(coursesDir))fail('courses directory missing after augmentation');
if(!fs.existsSync(dataDir))fail('course-data directory missing after augmentation');
if(!fs.existsSync(indexPath))fail('index.html missing after augmentation');
let catalog={courses:[]};try{catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'))}catch(e){fail('catalog-data.json invalid JSON')}
if(arr(catalog.courses).length!==57)fail(`expected 57 catalog courses, found ${arr(catalog.courses).length}`);
for(const id of required){if(!arr(catalog.courses).some(c=>c.id===id))fail(`catalog missing ${id}`);if(!fs.existsSync(path.join(coursesDir,id+'.html')))fail(`course page missing ${id}`);if(!fs.existsSync(path.join(dataDir,id+'.json')))fail(`course data missing ${id}`);}
const pages=fs.existsSync(coursesDir)?fs.readdirSync(coursesDir).filter(f=>f.endsWith('.html')):[];
if(pages.length!==57)fail(`expected 57 static course pages, found ${pages.length}`);
for(const file of pages){const html=fs.readFileSync(path.join(coursesDir,file),'utf8');if(!html.includes('adaptive-practice-layer.js?v=20260811-3'))fail(`${file}: cache-busted Python runner missing`);if(!html.includes('study-examples.js?v=20260811-2'))fail(`${file}: 5-8 study-example layer missing`);if(!html.includes('project-readme-layer.js'))fail(`${file}: project README layer missing`);if(!html.includes('python-only-ui.js'))fail(`${file}: Python-only UI guard missing`);if(/cpp-runner-ui-worker|primary-language-mode|dual-single-editor-publish/.test(html))fail(`${file}: removed language runtime still referenced`);if(/lesson-example-runner\.js|runnable-lesson-example-fixes\.js|lesson-example-runner-guard\.js/.test(html))fail(`${file}: obsolete single-example runtime still referenced`);}
let lessonCount=0,totalExamples=0,min=99,max=0;
if(fs.existsSync(dataDir)){for(const file of fs.readdirSync(dataDir).filter(f=>f.endsWith('.json'))){let c;try{c=JSON.parse(fs.readFileSync(path.join(dataDir,file),'utf8'))}catch(e){continue}for(const lesson of arr(c.lessons)){const n=countExamples(lesson);lessonCount++;totalExamples+=n;min=Math.min(min,n);max=Math.max(max,n);if(n<5||n>8)fail(`${file}:${lesson.id||lesson.title}: study count ${n} outside 5-8`)}}}
if(lessonCount<580)fail(`expected at least 580 lessons, found ${lessonCount}`);
if(min<5||max>8)fail(`study example range invalid: ${min}-${max}`);
const index=fs.existsSync(indexPath)?fs.readFileSync(indexPath,'utf8'):'';
if(!index.includes('home-path-polish.js'))fail('homepage/path polish runtime missing');
if(!index.includes('csai-inline-catalog-data'))fail('inline catalog missing');
if(!index.includes('python-only-ui.js'))fail('homepage Python-only guard missing');
const adaptive=fs.readFileSync(path.join(root,'assets','adaptive-practice-layer.js'),'utf8');
if(!adaptive.includes('window.CSAIPythonRunner')||!adaptive.includes('prewarmPython')||!adaptive.includes('runPython'))fail('shared Python runner API incomplete');
if(/MutationObserver|querySelectorAll\('\.lesson'\)|data-adaptive-lab|adaptive-tab/.test(adaptive))fail('shared Python runner still contains legacy lesson rendering');
if(/C\+\+|\bDual\b|data-adaptive-mode/.test(adaptive))fail('adaptive practice still contains removed language switching');
const readme=fs.readFileSync(path.join(root,'assets','project-readme-layer.js'),'utf8');
if(!readme.includes('README')||!readme.includes('Publish')||!readme.includes("folder+'/README.md'"))fail('project README + publish contract missing');
if(failures.length){console.error('Production augmentation verification failed:');failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log(`Production augmentation verified: 57 courses, ${lessonCount} lessons, ${totalExamples} study example slots (${min}-${max} per lesson), one lightweight Python runner, README + GitHub project publishing.`);
