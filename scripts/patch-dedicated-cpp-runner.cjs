const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'assets','cpp-runner-ui-worker.js');
let s=fs.readFileSync(file,'utf8');
const oldMode=`function cppModeRequested(){\n var activeMode=document.querySelector('[data-lang-mode].active');`;
if(s.includes(oldMode))s=s.replace(oldMode,`function cppModeRequested(){\n if(courseId()==='cpp')return true;\n var activeMode=document.querySelector('[data-lang-mode].active');`);
const oldSupport=`function courseSupportsCpp(){return !!document.querySelector('[data-lang-mode="cpp"],[data-lang-mode="dual"]');}`;
if(s.includes(oldSupport))s=s.replace(oldSupport,`function courseSupportsCpp(){return courseId()==='cpp'||!!document.querySelector('[data-lang-mode="cpp"],[data-lang-mode="dual"]');}`);
// The linker is the heaviest stage for STL/iostream examples. It normally runs in the
// background, so let legitimate heavier links finish rather than killing them at 30s.
s=s.replace("timeout(orch.run('wasm-ld',linkArgv),30000,'Your C++ link step took too long. Please press Run example to retry.')","timeout(orch.run('wasm-ld',linkArgv),60000,'Your C++ link step took too long. Please press Run example to retry.')");
if(!/function cppModeRequested\(\)\{\s*if\(courseId\(\)==='cpp'\)return true;/.test(s))throw new Error('Dedicated C++ mode request patch missing');
if(!/function courseSupportsCpp\(\)\{return courseId\(\)==='cpp'\|\|/.test(s))throw new Error('Dedicated C++ preboot support patch missing');
if(!/orch\.run\('wasm-ld',linkArgv\),60000/.test(s))throw new Error('60-second background C++ linker allowance missing');
fs.writeFileSync(file,s,'utf8');
console.log('Dedicated C++ course preboots/background-prepares examples; heavier C++ links get up to 60s to finish without slowing already-prepared Run clicks.');
