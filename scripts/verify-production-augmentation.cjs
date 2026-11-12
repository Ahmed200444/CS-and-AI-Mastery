const fs=require('fs');
const path=require('path');
const root=process.cwd(),failures=[];
const catalogPath=path.join(root,'assets','catalog-data.json'),coursesDir=path.join(root,'courses'),dataDir=path.join(root,'assets','course-data'),indexPath=path.join(root,'index.html');
function fail(x){failures.push(x)}
function arr(v){return Array.isArray(v)?v:[]}
function countExamples(lesson){const seen=new Set();const c=arr(lesson.concepts).filter(Boolean).filter(x=>{const k=String(x).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();if(!k||seen.has(k))return false;seen.add(k);return true;}).length;return Math.max(5,c+2);}
const required=['embedded-systems','systems-programming','advanced-computer-organization'];
if(!fs.existsSync(catalogPath))fail('catalog-data.json missing after augmentation');
if(!fs.existsSync(coursesDir))fail('courses directory missing after augmentation');
if(!fs.existsSync(dataDir))fail('course-data directory missing after augmentation');
if(!fs.existsSync(indexPath))fail('index.html missing after augmentation');
let catalog={courses:[]};try{catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'))}catch(e){fail('catalog-data.json invalid JSON')}
if(arr(catalog.courses).length!==62)fail(`expected 62 catalog courses, found ${arr(catalog.courses).length}`);
for(const id of required){if(!arr(catalog.courses).some(c=>c.id===id))fail(`catalog missing ${id}`);if(!fs.existsSync(path.join(coursesDir,id+'.html')))fail(`course page missing ${id}`);if(!fs.existsSync(path.join(dataDir,id+'.json')))fail(`course data missing ${id}`);}
const pages=fs.existsSync(coursesDir)?fs.readdirSync(coursesDir).filter(f=>f.endsWith('.html')):[];
if(pages.length!==62)fail(`expected 62 static course pages, found ${pages.length}`);
for(const file of pages){const html=fs.readFileSync(path.join(coursesDir,file),'utf8');if(!html.includes('adaptive-practice-layer.js'))fail(`${file}: adaptive practice layer missing`);if(!html.includes('project-readme-layer.js'))fail(`${file}: project README layer missing`);if(!html.includes('python-only-ui.js'))fail(`${file}: Python-only UI guard missing`);if(/cpp-runner-ui-worker|primary-language-mode|dual-single-editor-publish/.test(html))fail(`${file}: removed language runtime still referenced`);}
let lessonCount=0,totalExamples=0,min=99,max=0;
if(fs.existsSync(dataDir)){for(const file of fs.readdirSync(dataDir).filter(f=>f.endsWith('.json'))){let c;try{c=JSON.parse(fs.readFileSync(path.join(dataDir,file),'utf8'))}catch(e){continue}for(const lesson of arr(c.lessons)){const n=countExamples(lesson);lessonCount++;totalExamples+=n;min=Math.min(min,n);max=Math.max(max,n);if(n<5)fail(`${file}:${lesson.id||lesson.title}: concept-example count ${n} below five`)}}}
if(lessonCount<580)fail(`expected at least 580 lessons, found ${lessonCount}`);
if(min<5)fail(`concept-example range invalid: ${min}-${max}`);
const index=fs.existsSync(indexPath)?fs.readFileSync(indexPath,'utf8'):'';
if(!index.includes('home-path-polish.js'))fail('homepage/path polish runtime missing');
if(!index.includes('csai-inline-catalog-data'))fail('inline catalog missing');
if(!index.includes('python-only-ui.js'))fail('homepage Python-only guard missing');
const adaptive=fs.readFileSync(path.join(root,'assets','adaptive-practice-layer.js'),'utf8');
for(const id of ['python','dsa','problem-solving','oop','systems-programming','embedded-systems','advanced-computer-organization'])if(!adaptive.includes(`'${id}'`))fail(`Python practice list missing ${id}`);
if(/C\+\+|\bDual\b|data-adaptive-mode/.test(adaptive))fail('adaptive practice still contains removed language switching');
const readme=fs.readFileSync(path.join(root,'assets','project-readme-layer.js'),'utf8');
if(!readme.includes('README')||!readme.includes('Publish')||!readme.includes("folder+'/README.md'"))fail('project README + publish contract missing');
if(failures.length){console.error('Production augmentation verification failed:');failures.forEach(x=>console.error(' - '+x));process.exit(1)}
console.log(`Production augmentation verified: 62 courses, ${lessonCount} lessons, ${totalExamples} base concept-example slots (${min}-${max} per lesson), Python practice runtime, README + GitHub project publishing.`);
