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
if(!/57 generated course pages/.test(readme))fail('README does not say 57 generated course pages');
if(!/57-course set/.test(readme))fail('README repository structure does not say 57-course set');
if(/C\+\+|54 generated course pages|54-course set/.test(readme))fail('README still contains removed language or old 54-course count');

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
if(/C\+\+|Python\s*(?:&|\+|\/)\s*C\+\+|\bboth languages\b|\bDual\b/.test(hero))fail('homepage runtime still contains removed language wording');
if(!/57/.test(hero))fail('homepage runtime does not preserve 57-course count');

const portfolio=read('assets/portfolio-publish-controls.js');
if(/C\+\+|\bcpp\b|\bdual\b/i.test(portfolio))fail('exercise/example publisher still contains removed language handling');
if(/Add a README|data-final-readme|README already added/.test(portfolio))fail('exercise/example publisher still adds duplicate README controls');
if(!/Publish to GitHub/.test(portfolio))fail('exercise/example publisher lost its single GitHub publish action');
const projectReadme=read('assets/project-readme-layer.js');
if(/C\+\+|\bcpp\b|g\+\+|STL data structures|RAII/i.test(projectReadme))fail('Smart README runtime still contains removed language handling');
if(!/Smart README/.test(projectReadme)||!/Published code \+ recruiter-ready README/.test(projectReadme))fail('Smart README project publishing is incomplete');

const catalog=JSON.parse(read('assets/catalog-data.json'));
if(!Array.isArray(catalog.courses)||catalog.courses.length!==57)fail(`catalog expected 57 courses, found ${catalog.courses&&catalog.courses.length}`);
const dataDir=path.join(root,'assets','course-data');
const dataFiles=fs.readdirSync(dataDir).filter(x=>x.endsWith('.json'));
if(dataFiles.length!==57)fail(`expected 57 course-data files, found ${dataFiles.length}`);
for(const name of dataFiles){
 const data=JSON.parse(fs.readFileSync(path.join(dataDir,name),'utf8'));
 const all=strings(data);
 if(all.some(badText))fail(`${name}: removed language text or .cpp filename remains`);
 if(all.some(badCode))fail(`${name}: removed language code example remains`);
 const raw=JSON.stringify(data);
 if(/"(?:language|defaultLanguage)":"(?:cpp|c\+\+|dual)"/i.test(raw))fail(`${name}: removed language mode remains in data`);
}

const coursesDir=path.join(root,'courses');
const pages=fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html'));
if(pages.length!==57)fail(`expected 57 course pages, found ${pages.length}`);
for(const name of pages){
 const html=fs.readFileSync(path.join(coursesDir,name),'utf8');
 if(!html.includes('adaptive-practice-layer.js'))fail(`${name}: Python adaptive runtime missing`);
 if(!html.includes('runner-performance-guard.js'))fail(`${name}: Python performance guard missing`);
 if(!html.includes('python-only-ui.js'))fail(`${name}: Python-only UI guard missing`);
 if(!html.includes('project-readme-layer.js'))fail(`${name}: project README publishing missing`);
 if(/cpp-runner-ui-worker|primary-language-mode|dual-single-editor-publish|course-language-mode-controller|lesson-language-variants/.test(html))fail(`${name}: removed runtime reference remains`);
 if(/C\+\+|Python\s*(?:&|\+|\/)\s*C\+\+|\.cpp\b/.test(html))fail(`${name}: removed language text remains in generated page`);
 if(/data-lang-mode=["'](?:cpp|dual)|data-adaptive-mode=["'](?:cpp|dual)|data-csai-oa-cpp|data-dual-cpp-editor/.test(html))fail(`${name}: removed language control remains in generated page`);
}

const index=read('index.html');
if(!index.includes('python-only-ui.js'))fail('index.html missing Python-only UI guard');
if(/cpp-runner-ui-worker|primary-language-mode|dual-single-editor-publish/.test(index))fail('index.html still references removed language runtime');
const visible=index.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
if(/C\+\+|Python\s*(?:&|\+|\/)\s*C\+\+|\bboth languages\b|\bDual\s+(?:mode|practice|language)/i.test(visible))fail('index.html still exposes removed language text');

if(failures.length){console.error('Python-only platform verification failed:');failures.slice(0,160).forEach(x=>console.error(' - '+x));if(failures.length>160)console.error(` - ... ${failures.length-160} more`);process.exit(1)}
console.log('Python-only platform verified: 57 courses, one Python runtime, no removed-language UI/generated content, clean single publishing controls, Smart README project publishing, and corrected README count.');
