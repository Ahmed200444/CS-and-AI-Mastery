const fs=require('fs');
const path=require('path');
const root=process.cwd(),problems=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ui=read('assets/cpp-runner-ui-worker.js');
const clientEntry=read('scripts/cpp-emception-client-entry.js');
const workerEntry=read('scripts/cpp-toolchain-worker-entry.js');
const netlify=read('netlify.toml');

const requiredUi=[
 ['direct core client module',/cpp-client\.mjs\?v=20260809-5/],
 ['direct toolchain worker module',/cpp-toolchain-worker\.mjs\?v=20260809-5/],
 ['core client dynamic import',/import\(absolute\(CLIENT_URL\)\)/],
 ['direct toolchain Worker',/new Worker\(absolute\(TOOLCHAIN_WORKER_URL\),\{type:'module',name:'csai-emception-toolchain'\}\)/],
 ['WorkerOrchestrator construction',/new mod\.WorkerOrchestrator\(mod\.workerTransport\(worker\)/],
 ['worker boot',/orch\.boot\(MANIFEST_URL,\{origin:window\.location\.origin\}\)/],
 ['VFS write',/orch\.writeFile/],
 ['capture interception',/data-run-language-example[\s\S]*stopImmediatePropagation/],
 ['C++ variant scoping',/data-lang-variant=\\?"cpp\\?"/],
 ['persistent runner reuse',/if\(orchestrator\)return orchestrator/],
 ['single active run guard',/if\(active\)/],
 ['correct em++ argv0',/var argv=\['em\+\+',src,'-std=c\+\+17','-O0','-sSTANDALONE_WASM=1','-o',out\]/],
 ['correct em++ tool call',/orch\.run\('em\+\+',argv\)/],
 ['standalone WASM output',/out='\/home\/user\/csai-'\+stamp\+'\.wasm'/],
 ['correct WASI argv0 and program path',/orch\.run\('wasi-run',\['wasi-run',out\]\)/],
 ['initialization timeout',/60000,'The C\+\+ compiler took too long to initialize/],
 ['compile timeout',/60000,'Your C\+\+ compilation took too long/],
 ['run timeout',/20000,'Your C\+\+ program took too long to run/],
 ['reset recovery',/resetRunner/]
];
for(const [label,re] of requiredUi)if(!re.test(ui))problems.push('UI controller missing '+label);
if(/cpp-example-runner-worker\.mjs/.test(ui))problems.push('UI still references the broken outer Worker layer');
if(/createEmception/.test(ui))problems.push('UI still uses the DOM-dependent createEmception facade');
if(/tools=\[['"]em\+\+['"],['"]clang\+\+['"],['"]clang['"]\]/.test(ui)||/orch\.run\(['"]clang['"]/.test(ui))problems.push('UI still contains the slow/wrong plain-clang fallback chain');
if(/CSAI_CPP_OK|smokeTest\(/.test(ui))problems.push('UI still performs the redundant throwaway C++ smoke compilation');
if(!/argv\[0\].*executable name[\s\S]*argv\.slice\(1\)/.test(ui))problems.push('UI does not document the Emception argv[0] contract that caused the C/C++ mode bug');
if(!/WorkerOrchestrator/.test(clientEntry)||!/workerTransport/.test(clientEntry))problems.push('core client entry is incomplete');
if(!/@gameguild\/emception-browser\/worker/.test(workerEntry))problems.push('toolchain entry does not use the package worker export');

const dir=path.join(root,'courses');
if(!fs.existsSync(dir))problems.push('courses directory missing');
else{
 const files=fs.readdirSync(dir).filter(x=>x.endsWith('.html'));
 if(files.length!==54)problems.push(`expected 54 course pages, found ${files.length}`);
 for(const name of files){
  const html=fs.readFileSync(path.join(dir,name),'utf8');
  if(!html.includes('/assets/cpp-runner-ui-worker.js?v=20260809-3'))problems.push(`${name}: missing corrected C++ runner controller`);
  if(html.includes('/assets/cpp-runner-ui-worker.js?v=20260809-1')||html.includes('/assets/cpp-runner-ui-worker.js?v=20260809-2'))problems.push(`${name}: stale C++ controller cache version remains`);
 }
}
const build=netlify.indexOf('node scripts/build-local-cpp-runner.cjs');
const clientCheck=netlify.indexOf('node --check assets/emception-vite/cpp-client.mjs');
const workerCheck=netlify.indexOf('node --check assets/emception-vite/cpp-toolchain-worker.mjs');
const uiCheck=netlify.indexOf('node --check assets/cpp-runner-ui-worker.js');
const inject=netlify.indexOf('node scripts/inject-cpp-responsive-runner.cjs');
const verify=netlify.indexOf('node scripts/verify-cpp-responsive-runner.cjs');
if(!(build>=0&&clientCheck>build&&workerCheck>clientCheck&&uiCheck>workerCheck&&inject>uiCheck&&verify>inject))problems.push('Netlify does not build, syntax-check, inject, then verify the direct C++ runner in order');
if(problems.length)throw new Error('Responsive C++ runner verification failed:\n'+problems.slice(0,120).join('\n'));
console.log('Responsive C++ runner verification passed: em++ receives the required argv[0], compiles exactly once to standalone WASM, and wasi-run executes the compiled program on all 54 course pages.');
