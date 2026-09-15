const fs=require('fs');
const path=require('path');
const root=process.cwd(),failures=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
function fail(x){failures.push(x)}
function strings(value,out=[]){if(typeof value==='string')out.push(value);else if(Array.isArray(value))value.forEach(v=>strings(v,out));else if(value&&typeof value==='object')Object.values(value).forEach(v=>strings(v,out));return out;}
function badText(v){return /C\+\+|Python\s*(?:&|\+|\/)\s*C\+\+|\.cpp\b/.test(String(v||''));}
function badCode(v){return /#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\busing\s+namespace\s+std\b/.test(String(v||''));}

const readme=read('README.md');
if(!/62 generated course pages/.test(readme))fail('README does not say 62 generated course pages');
if(!/62-course set/.test(readme))fail('README repository structure does not say 62-course set');
if(/54 generated course pages|54-course set/.test(readme))fail('README still contains old 54-course count');if(!/C\+\+ Programming & DSA/.test(readme))fail('README missing dedicated C++ course');

const pkg=JSON.parse(read('package.json'));
if(pkg.dependencies&&Object.keys(pkg.dependencies).length)fail('obsolete compiler dependencies remain in package.json');
for(const name of ['@gameguild/emception-browser','emception'])if(JSON.stringify(pkg).includes(name))fail(`compiler dependency remains: ${name}`);

const removed=[
 'assets/cpp-runner-ui-worker.js','assets/dual-single-editor-publish.js','assets/primary-language-mode.js','assets/course-language-mode-controller.js','assets/lesson-language-variants.js',
 'scripts/build-local-cpp-runner.cjs','scripts/cpp-emception-client-entry.js','scripts/cpp-toolchain-worker-entry.js','scripts/emception-browser-entry.js','scripts/inject-cpp-responsive-runner.cjs','scripts/inject-dual-single-editor-publish.cjs','scripts/inject-course-language-mode-controller.cjs','scripts/inject-lesson-language-variants.cjs','scripts/inject-primary-language-mode.cjs','scripts/patch-example-cpp-runner.cjs','scripts/patch-primary-dual-single-editor.cjs','scripts/verify-cpp-responsive-runner.cjs','scripts/verify-dual-single-editor-publish.cjs','scripts/verify-home-cpp-dual-ux.cjs','scripts/verify-compiler-runners.cjs'
];
for(const p of removed)if(exists(p))fail(`obsolete language file still exists: ${p}`);

for(const p of ['assets/adaptive-practice-layer.js','assets/runner-performance-guard.js','assets/python-only-ui.js'])if(!exists(p))fail(`Python runtime missing: ${p}`);
const adaptive=read('assets/adaptive-practice-layer.js');
if(!adaptive.includes('window.CSAIPythonRunner'))fail('shared Python runner API missing');
if(!adaptive.includes('prewarmPython'))fail('Python prewarm missing');
if(/C\+\+|\bDual\b|data-adaptive-mode|CSAICppRunner/.test(adaptive))fail('adaptive practice still contains removed language support');
const hero=read('assets/adaptive-v4-live.js')+'\n'+read('assets/hero-polish.js')+'\n'+read('assets/home-path-polish.js');
if(/\bDual\b/.test(hero))fail('homepage runtime still contains obsolete dual-language wording');
if(!/cpp-dsa|C\+\+/.test(read('assets/runtime-inline/index-066.js')))fail('guided paths do not include C++ course');

const portfolio=read('assets/portfolio-publish-controls.js');
if(/\bdual\b/i.test(portfolio))fail('exercise/example publisher still contains obsolete dual-language handling');
if(!/C\+\+/.test(portfolio)||!/cpp/.test(portfolio))fail('exercise/example publisher is missing dedicated C++/.cpp support');
for(const marker of ['Publish to GitHub','Add a README','data-final-publish','data-final-readme','requirePath:isReadme?d.codePath:undefined','function readme(d)'])if(!portfolio.includes(marker))fail(`exercise/example publishing control missing: ${marker}`);
if(!portfolio.includes("root.querySelector('[data-final-readme]')"))fail('README controls are not deduplicated per item');
if(!portfolio.includes("existing.insertAdjacentElement('afterend',readmeBtn)"))fail('README control is not attached beside its item publish button');
const projectReadme=read('assets/project-readme-layer.js');
if(/\bdual\b/i.test(projectReadme))fail('Smart README runtime still contains obsolete dual-language handling');
if(!/C\+\+/.test(projectReadme)||!/g\+\+/.test(projectReadme)||!/cpp/.test(projectReadme))fail('Smart README runtime is missing dedicated C++/.cpp run support');
if(!/Smart README/.test(projectReadme)||!/Published code \+ recruiter-ready README/.test(projectReadme))fail('Smart README project publishing is incomplete');

const catalog=JSON.parse(read('assets/catalog-data.json'));
if(!Array.isArray(catalog.courses)||catalog.courses.length!==62)fail(`catalog expected 62 courses, found ${catalog.courses&&catalog.courses.length}`);
const dataDir=path.join(root,'assets','course-data');
const dataFiles=fs.readdirSync(dataDir).filter(x=>x.endsWith('.json'));
if(dataFiles.length!==62)fail(`expected 62 course-data files, found ${dataFiles.length}`);
for(const name of dataFiles){
 const data=JSON.parse(fs.readFileSync(path.join(dataDir,name),'utf8'));
 const all=strings(data),isCpp=name==='cpp-dsa.json';
 if(!isCpp&&all.some(badText))fail(`${name}: unexpected C++ text or .cpp filename remains outside dedicated C++ course`);
 if(!isCpp&&all.some(badCode))fail(`${name}: unexpected C++ code example remains outside dedicated C++ course`);
 const raw=JSON.stringify(data);
 if(!isCpp&&/"(?:language|defaultLanguage)":"(?:cpp|c\+\+|dual)"/i.test(raw))fail(`${name}: unexpected C++/dual language mode remains`);
 if(isCpp&&!all.some(v=>/#include\s*</.test(v)))fail('cpp-dsa.json: C++ examples missing');
}

const coursesDir=path.join(root,'courses');
const pages=fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html'));
if(pages.length!==62)fail(`expected 62 course pages, found ${pages.length}`);
for(const name of pages){
 const html=fs.readFileSync(path.join(coursesDir,name),'utf8');
 if(!html.includes('adaptive-practice-layer.js'))fail(`${name}: Python adaptive runtime missing`);
 if(!html.includes('runner-performance-guard.js'))fail(`${name}: Python performance guard missing`);
 if(!html.includes('python-only-ui.js'))fail(`${name}: Python-only UI guard missing`);
 if(!html.includes('project-readme-layer.js'))fail(`${name}: project README publishing missing`);
 if(!html.includes('portfolio-publish-controls.js'))fail(`${name}: example/exercise GitHub publishing missing`);
 if(/cpp-runner-ui-worker|primary-language-mode|dual-single-editor-publish|course-language-mode-controller|lesson-language-variants/.test(html))fail(`${name}: removed runtime reference remains`);
 if(name!=='cpp-dsa.html'&&/C\+\+|\.cpp\b/.test(html))fail(`${name}: unexpected C++ text remains outside dedicated course`);if(name==='cpp-dsa.html'&&!/C\+\+ Programming &amp; DSA|C\+\+ Programming & DSA/.test(html))fail('cpp-dsa.html: dedicated C++ title missing');
 if(/data-lang-mode=["'](?:cpp|dual)|data-adaptive-mode=["'](?:cpp|dual)|data-csai-oa-cpp|data-dual-cpp-editor/.test(html))fail(`${name}: removed language control remains in generated page`);
 if(/csai-course-first-paint-|csai-course-booting|Loading course…/.test(html))fail(`${name}: legacy blocking course loading cover remains`);
}

const index=read('index.html');
if(!index.includes('python-only-ui.js'))fail('index.html missing Python-only UI guard');
if(/cpp-runner-ui-worker|primary-language-mode|dual-single-editor-publish/.test(index))fail('index.html still references removed language runtime');
const visible=index.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
if(/\bDual\s+(?:mode|practice|language)/i.test(visible))fail('index.html still exposes obsolete dual-language text');
if(!index.includes('\"id\":\"cpp-dsa\"')||!index.includes('C++ Programming & DSA'))fail('index.html embedded catalog does not expose dedicated C++ course');

if(failures.length){console.error('Python-only platform verification failed:');failures.slice(0,160).forEach(x=>console.error(' - '+x));if(failures.length>160)console.error(` - ... ${failures.length-160} more`);process.exit(1)}
console.log('Primary-Python + dedicated-C++ platform verified: 62 courses, dedicated C++/DSA runtime plus Python runtime, immediate static course first paint, attached GitHub + README controls for examples/exercises, Smart README project publishing, and corrected README count.');
