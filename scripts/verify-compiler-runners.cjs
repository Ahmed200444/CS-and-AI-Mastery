const fs=require('fs');
const path=require('path');
const root=process.cwd(),problems=[];
function read(p){return fs.readFileSync(path.join(root,p),'utf8');}
const pkg=JSON.parse(read('package.json'));
const netlify=read('netlify.toml');
const example=read('assets/example-learning-tools.js');
const bundler=read('scripts/build-local-cpp-runner.cjs');
const patcher=read('scripts/patch-example-cpp-runner.cjs');
const bundlePath=path.join(root,'assets','emception-vite','emception-browser-bundle.mjs');

if(pkg.dependencies?.['@gameguild/emception-browser']!=='3.8.0')problems.push('missing pinned @gameguild/emception-browser 3.8.0 dependency');
if(pkg.dependencies?.emception!=='3.8.0')problems.push('missing pinned emception 3.8.0 dependency');
if(pkg.devDependencies?.vite!=='6.4.3')problems.push('missing pinned Vite 6.4.3 bundler dependency');
if(!/await import\(['"]vite['"]\)/.test(bundler))problems.push('C++ adapter is not built with Vite');
if(!/formats:\s*\[['"]es['"]\]/.test(bundler))problems.push('C++ adapter is not emitted as a native ES module');
if(/format:\s*['"]iife['"]|globalName/.test(bundler))problems.push('legacy IIFE/global C++ bundling is still configured');
if(!fs.existsSync(bundlePath)||fs.statSync(bundlePath).size<1000)problems.push('Vite-built Emception browser module was not created');
else{
 const built=fs.readFileSync(bundlePath,'utf8');
 if(/var\s+import_meta\s*=\s*\{\s*\}/.test(built))problems.push('built C++ module erased import.meta and can create Invalid URL errors');
 if(/\?raw(?:['"`]|\b)/.test(built))problems.push('built C++ module contains unresolved ?raw imports');
 if(/new URL\(\s*(?:''|""|undefined|void 0)\s*,/.test(built))problems.push('built C++ module contains an invalid URL constructor');
 if(!/createEmception/.test(built))problems.push('built C++ module does not expose createEmception');
}
if(/@gameguild\/emception-browser@3\.8\.0\/\+esm/.test(example))problems.push('broken jsDelivr +esm loader is still present');
if(!/emception-vite\/emception-browser-bundle\.mjs/.test(example))problems.push('example runner does not use the local Vite-built module');
if(!/new URL\(EMCEPTION_BUNDLE,window\.location\.href\)\.href/.test(example))problems.push('example runner does not construct an absolute module URL');
if(!/await import\(bundleUrl\)/.test(example))problems.push('example runner does not dynamically import the local ES module');
if(/loadScript\(EMCEPTION_BUNDLE/.test(example))problems.push('example runner still treats the ES module as a classic script');
if(!/createEmception\(\{tty:'none'\}\)/.test(example))problems.push('example runner does not use Emception browser defaults for runtime URLs');
if(!/verifyCppCompiler/.test(example)||!/CSAI_CPP_OK/.test(example))problems.push('C++ smoke compile/run check is missing');
if(!/assert 6 \* 7 == 42/.test(example))problems.push('Python runtime smoke test is missing');
if(!/async function runPython/.test(example)||!/async function runCpp\(/.test(example))problems.push('Python/C++ run functions are missing');
if(!/emception-browser-bundle\.mjs\?v=20260809-4/.test(patcher))problems.push('C++ runner cache version was not bumped');

const b=netlify.indexOf('node scripts/build-local-cpp-runner.cjs');
const p=netlify.indexOf('node scripts/patch-example-cpp-runner.cjs');
const s=netlify.indexOf('node --check assets/example-learning-tools.js');
const a=netlify.indexOf('node scripts/audit-language-example-syntax.cjs');
const v=netlify.indexOf('node scripts/verify-compiler-runners.cjs');
if(!(b>=0&&p>b&&s>p&&a>s&&v>a))problems.push('Netlify compiler build/patch/audit/verify order is incorrect');
if(problems.length)throw new Error('Compiler runner verification failed:\n'+problems.join('\n'));
console.log('Compiler runner verification passed: Vite ES-module adapter, valid browser URL handling, Python/C++ runtime smoke tests, and generated-example syntax audit are wired.');
