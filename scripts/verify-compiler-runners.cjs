const fs=require('fs');
const path=require('path');
const root=process.cwd(),problems=[];
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
const pkg=JSON.parse(read('package.json'));
const netlify=read('netlify.toml');
const example=read('assets/example-learning-tools.js');
const bundler=read('scripts/build-local-cpp-runner.cjs');
const patcher=read('scripts/patch-example-cpp-runner.cjs');
const clientEntry=read('scripts/cpp-emception-client-entry.js');
const workerEntry=read('scripts/cpp-toolchain-worker-entry.js');
const clientPath=path.join(root,'assets','emception-vite','cpp-client.mjs');
const workerPath=path.join(root,'assets','emception-vite','cpp-toolchain-worker.mjs');

if(pkg.dependencies?.['@gameguild/emception-browser']!=='3.8.0')problems.push('missing pinned @gameguild/emception-browser 3.8.0 dependency');
if(pkg.dependencies?.emception!=='3.8.0')problems.push('missing pinned emception 3.8.0 dependency');
if(pkg.devDependencies?.vite!=='6.4.3')problems.push('missing pinned Vite 6.4.3 bundler dependency');
if(!/WorkerOrchestrator/.test(clientEntry)||!/workerTransport/.test(clientEntry))problems.push('DOM-free Emception client entry is incomplete');
if(!/@gameguild\/emception-browser\/worker/.test(workerEntry))problems.push('dedicated Emception worker export is not used');
if(!/cpp-emception-client-entry\.js/.test(bundler)||!/cpp-toolchain-worker-entry\.js/.test(bundler))problems.push('bundler does not build both direct C++ entries');
if(!/formats:\s*\[['"]es['"]\]/.test(bundler))problems.push('C++ assets are not emitted as native ES modules');
if(!/C\+\+ RPC client unexpectedly contains DOM globals/.test(bundler))problems.push('bundler does not reject DOM globals in the page-side C++ RPC client');
if(!/Worker message runtime/.test(bundler))problems.push('bundler does not validate the dedicated toolchain Worker runtime');

if(!fs.existsSync(clientPath)||fs.statSync(clientPath).size<1000)problems.push('built C++ client is missing or unexpectedly small');
else{
 const built=fs.readFileSync(clientPath,'utf8');
 if(/\bdocument\b|\bwindow\b/.test(built))problems.push('built C++ RPC client contains DOM globals');
 if(/\?raw(?:['"`]|\b)/.test(built))problems.push('built C++ RPC client contains unresolved ?raw imports');
 if(/var\s+import_meta\s*=\s*\{\s*\}/.test(built))problems.push('built C++ RPC client erased import.meta');
 if(!/WorkerOrchestrator/.test(built)||!/workerTransport/.test(built))problems.push('built C++ RPC client does not expose WorkerOrchestrator/workerTransport');
}
if(!fs.existsSync(workerPath)||fs.statSync(workerPath).size<1000)problems.push('built C++ toolchain worker is missing or unexpectedly small');
else{
 const built=fs.readFileSync(workerPath,'utf8');
 if(!/(?:onmessage|addEventListener\([^)]*message|postMessage)/.test(built))problems.push('built C++ toolchain worker does not contain a Worker message runtime');
 if(/\?raw(?:['"`]|\b)/.test(built))problems.push('built C++ toolchain worker contains unresolved ?raw imports');
 if(/var\s+import_meta\s*=\s*\{\s*\}/.test(built))problems.push('built C++ toolchain worker erased import.meta');
}
if(/@gameguild\/emception-browser@3\.8\.0\/\+esm/.test(example))problems.push('broken jsDelivr +esm loader is still present');
if(/createEmception\(/.test(example))problems.push('legacy DOM-dependent createEmception path is still present');
if(!/dedicated toolchain Worker controller/.test(example))problems.push('example tools do not delegate C++ to the dedicated controller');
if(!/assert 6 \* 7 == 42/.test(example))problems.push('Python runtime smoke test is missing');
if(!/async function runPython/.test(example))problems.push('Python runner function is missing');
if(!/createEmception\\\(/.test(patcher)||!/legacy createEmception browser-facade path/i.test(patcher))problems.push('patcher does not guard against legacy C++ browser facade');

const b=netlify.indexOf('node scripts/build-local-cpp-runner.cjs');
const p=netlify.indexOf('node scripts/patch-example-cpp-runner.cjs');
const s=netlify.indexOf('node --check assets/example-learning-tools.js');
const a=netlify.indexOf('node scripts/audit-language-example-syntax.cjs');
const v=netlify.indexOf('node scripts/verify-compiler-runners.cjs');
if(!(b>=0&&p>b&&s>p&&a>s&&v>a))problems.push('Netlify compiler build/patch/audit/verify order is incorrect');
if(problems.length)throw new Error('Compiler runner verification failed:\n'+problems.join('\n'));
console.log('Compiler runner verification passed: Python smoke test + DOM-free RPC client + official dedicated Emception toolchain Worker are wired.');
