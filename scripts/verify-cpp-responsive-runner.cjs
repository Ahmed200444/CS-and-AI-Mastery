const fs=require('fs');
const path=require('path');
const root=process.cwd(),problems=[];
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ui=read('assets/cpp-runner-ui-worker.js');
const worker=read('assets/cpp-example-runner-worker.mjs');
const netlify=read('netlify.toml');
const requiredUi=[
 ['dedicated module Worker',/new Worker\(url,\{type:'module',name:'csai-cpp-runner'\}\)/],
 ['capture interception',/data-run-language-example[\s\S]*stopImmediatePropagation/],
 ['C++ variant scoping',/data-lang-variant=\\?"cpp\\?"/],
 ['persistent worker reuse',/if\(worker\)return worker/],
 ['single active C++ run guard',/if\(pending\.size\)/],
 ['progress handling',/data\.type==='progress'/],
 ['timeout recovery',/120000/],
 ['worker termination recovery',/w\.terminate\(\)/]
];
for(const [label,re] of requiredUi)if(!re.test(ui))problems.push('UI controller missing '+label);
const requiredWorker=[
 ['local Emception module',/emception-vite\/emception-browser-bundle\.mjs/],
 ['createEmception',/createEmception/],
 ['background message API',/self\.addEventListener\('message'/],
 ['serialized queue',/queue\s*=\s*queue\.then/],
 ['compiler smoke test',/CSAI_CPP_OK/],
 ['C++17 compile',/-std=c\+\+17/],
 ['progress reporting',/post\('progress'/]
];
for(const [label,re] of requiredWorker)if(!re.test(worker))problems.push('Worker missing '+label);
if(/\bwindow\b|\bdocument\b/.test(worker))problems.push('C++ compiler worker depends on window/document and may block or fail outside the UI thread');
const dir=path.join(root,'courses');
if(!fs.existsSync(dir))problems.push('courses directory missing');
else{
 const files=fs.readdirSync(dir).filter(x=>x.endsWith('.html'));
 if(files.length!==54)problems.push(`expected 54 course pages, found ${files.length}`);
 for(const name of files){const html=fs.readFileSync(path.join(dir,name),'utf8');if(!html.includes('/assets/cpp-runner-ui-worker.js?v=20260809-1'))problems.push(`${name}: missing responsive C++ runner controller`);}
}
const build=netlify.indexOf('node scripts/build-local-cpp-runner.cjs');
const workerCheck=netlify.indexOf('node --check assets/cpp-example-runner-worker.mjs');
const uiCheck=netlify.indexOf('node --check assets/cpp-runner-ui-worker.js');
const inject=netlify.indexOf('node scripts/inject-cpp-responsive-runner.cjs');
const verify=netlify.indexOf('node scripts/verify-cpp-responsive-runner.cjs');
if(!(build>=0&&workerCheck>build&&uiCheck>workerCheck&&inject>uiCheck&&verify>inject))problems.push('Netlify does not syntax-check, inject, then verify the responsive C++ runner in order');
if(problems.length)throw new Error('Responsive C++ runner verification failed:\n'+problems.slice(0,120).join('\n'));
console.log('Responsive C++ runner verification passed: heavy compiler work is isolated in a persistent module worker with progress, timeout recovery, and 54-page injection.');
