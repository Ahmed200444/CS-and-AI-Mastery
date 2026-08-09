const fs=require('fs');
const path=require('path');
const root=process.cwd(),problems=[];
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
const example=read('assets/example-learning-tools.js');
const examplePublish=read('assets/example-github-publish.js');
const cppController=read('assets/cpp-runner-ui-worker.js');
const clientEntry=read('scripts/cpp-emception-client-entry.js');
const workerEntry=read('scripts/cpp-toolchain-worker-entry.js');
const practice=read('assets/practice-publish-completer.js');
const direct=read('assets/exercise-direct-publish.js');
const dual=read('assets/dual-single-editor-publish.js');
const netlify=read('netlify.toml');
const checks=[
 ['example deep explanation',example,/Deep step-by-step explanation/],
 ['Python example runner',example,/async function runPython/],
 ['Python runtime smoke test',example,/assert 6 \* 7 == 42/],
 ['C++ dedicated-controller handoff',example,/dedicated toolchain Worker controller/],
 ['example Python/C++ GitHub buttons',examplePublish,/Publish ['"]\+languageLabel\(lang\)\+['"] to GitHub/],
 ['example exact displayed-code publishing',examplePublish,/function codeFor\(variant\)[\s\S]*textContent/],
 ['example Python extension',examplePublish,/lang==='cpp'\?'cpp':'py'/],
 ['example language folders',examplePublish,/lang==='cpp'\?'C\+\+':'Python'/],
 ['example GitHub endpoint',examplePublish,/FILE_URL='\/api\/github\/file'/],
 ['example CSRF publishing',examplePublish,/X-CSAI-CSRF/],
 ['example semantic path',examplePublish,/student-code\/'\+folder\(lang\)\+'\/'\+courseId\(\)\+'\/examples\/'/],
 ['example unnumbered title cleanup',examplePublish,/function cleanTitle\(text\)[\s\S]*lesson\\s\*\)\?\\d\+/],
 ['C++ direct runner controller',cppController,/WorkerOrchestrator/],
 ['C++ official toolchain worker entry',workerEntry,/@gameguild\/emception-browser\/worker/],
 ['C++ core worker client',clientEntry,/WorkerOrchestrator[\s\S]*workerTransport/],
 ['C++ native clang++ compile',cppController,/orch\.run\('clang\+\+',compileArgv\)/],
 ['C++ explicit language mode',cppController,/-x','c\+\+','-std=c\+\+17/],
 ['C++ direct wasm-ld link',cppController,/orch\.run\('wasm-ld',linkArgv\)/],
 ['C++ background warmup',cppController,/function scheduleBackgroundWarmup\(delay\)/],
 ['C++ precompiled artifact cache',cppController,/function ensureArtifact\(code,outNode\)/],
 ['C++ per-example background status',cppController,/Preparing this C\+\+ example in background/],
 ['C++ ready status',cppController,/C\+\+ ready/],
 ['C++ output newline normalization',cppController,/function normalizeCppOutput\(text\)/],
 ['C++ compile progress',cppController,/Compiling your C\+\+/],
 ['C++ link progress',cppController,/Linking your C\+\+/],
 ['C++ standalone WASM output',cppController,/\.wasm'/],
 ['C++ WASI execution',cppController,/artifact\.orch\.run\('wasi-run',\['wasi-run',artifact\.out\]\)/],
 ['C++ output path',cppController,/Output/],
 ['example output UI',example,/data-csai-example-output/],
 ['normal beginner C++ for-loop explanation',example,/Normal for loop|Normal for-loop/],
 ['practice main publish guarantee',practice,/data-publish/],
 ['revealed solution publishing',practice,/data-publish-revealed/],
 ['revealed solution editor use',practice,/data-use-revealed/],
 ['Python GitHub folder',practice,/return lang==='cpp'\?'C\+\+':'Python'/],
 ['C++ extension',practice,/lang==='cpp'\?'cpp':'py'/],
 ['Two Sum C++ reveal',practice,/vector<int> twoSum/],
 ['Valid Parentheses C++ reveal',practice,/bool valid\(const string& s\)/],
 ['Binary Search C++ reveal',practice,/int binarySearch\(const vector<int>& nums/],
 ['exact exercise path builder',direct,/function exercisePath\(task,lang\)/],
 ['Dual explicit language buttons',dual,/data-dual-publish-language/]
];
for(const [label,src,re] of checks)if(!re.test(src))problems.push('missing '+label);
if(/createEmception\(/.test(example))problems.push('legacy DOM-dependent C++ compiler path remains in example tools');
if(/CSAI_CPP_OK|smokeTest\(/.test(cppController))problems.push('redundant C++ smoke compilation remains');
if(/orch\.run\('em\+\+'/.test(cppController))problems.push('slow Python em++ driver remains in C++ controller');
if(/orch\.run\(['"]clang['"]/.test(cppController))problems.push('plain clang C fallback remains in C++ controller');
const dir=path.join(root,'courses');
if(!fs.existsSync(dir))problems.push('courses directory missing');
else{
 const files=fs.readdirSync(dir).filter(x=>x.endsWith('.html'));
 if(files.length!==54)problems.push(`expected 54 course pages, found ${files.length}`);
 for(const name of files){
   const html=fs.readFileSync(path.join(dir,name),'utf8');
   if(!html.includes('/assets/example-learning-tools.js?v=20260809-1'))problems.push(`${name}: missing example learning tools`);
   if(!html.includes('/assets/example-github-publish.js?v=20260809-1'))problems.push(`${name}: missing Python/C++ example GitHub publisher`);
   if(!html.includes('/assets/practice-publish-completer.js?v=20260809-1'))problems.push(`${name}: missing practice publishing tools`);
   if(!html.includes('/assets/cpp-runner-ui-worker.js?v=20260809-5'))problems.push(`${name}: missing background-warming native clang++ C++ toolchain controller`);
   if(/cpp-runner-ui-worker\.js\?v=20260809-[1-4]/.test(html))problems.push(`${name}: stale C++ controller cache version remains`);
 }
}
const syntaxExample=netlify.indexOf('node --check assets/example-learning-tools.js');
const syntaxExamplePublish=netlify.indexOf('node --check assets/example-github-publish.js');
const syntaxPractice=netlify.indexOf('node --check assets/practice-publish-completer.js');
const inject=netlify.indexOf('node scripts/inject-example-practice-tools.cjs');
const cppInject=netlify.indexOf('node scripts/inject-cpp-responsive-runner.cjs');
const verify=netlify.indexOf('node scripts/verify-example-practice-tools.cjs');
if(!(syntaxExample>=0&&syntaxExamplePublish>syntaxExample&&syntaxPractice>syntaxExamplePublish&&inject>syntaxPractice&&cppInject>inject&&verify>cppInject))problems.push('Netlify build order does not syntax-check and inject example GitHub/practice/C++ tools before verification');
if(problems.length)throw new Error('Example/practice verification failed:\n'+problems.slice(0,120).join('\n'));
console.log('Example/practice verification passed: Python/C++ example publishing, Python run/output, prewarmed native clang++/wasm-ld/WASI C++ execution, normalized C++ output spacing, practice publishing, revealed-solution publishing, and 55-page injection are wired.');
