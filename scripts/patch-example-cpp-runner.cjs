const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'assets','example-learning-tools.js');
let s=fs.readFileSync(file,'utf8');

const oldImport="var EMCEPTION_IMPORT='https://cdn.jsdelivr.net/npm/@gameguild/emception-browser@3.8.0/+esm';";
if(s.includes(oldImport))s=s.replace(oldImport,"var EMCEPTION_IMPORT=null; // C++ execution is handled by the dedicated toolchain Worker controller.");

const oldGet="async function getEmception(){if(!emceptionPromise){emceptionPromise=(async function(){var mod=await import(EMCEPTION_IMPORT);if(!mod||typeof mod.createEmception!=='function')throw new Error('C++ compiler module did not load');return mod.createEmception({manifestUrl:EMCEPTION_MANIFEST,tty:'none'});})();}return emceptionPromise;}";
if(s.includes(oldGet))s=s.replace(oldGet,"async function getEmception(){throw new Error('C++ examples are handled by the dedicated toolchain Worker controller.');}");

const oldRun="async function runCpp(code){try{return await runCppEmception(code);}catch(primary){try{return await runCppFallback(code);}catch(fallback){return{error:true,text:'C++ runner could not start. '+(primary.message||String(primary))};}}}";
if(s.includes(oldRun))s=s.replace(oldRun,"async function runCpp(code){return{error:true,text:'C++ runner controller did not initialize. Refresh the page and try again.'};}");

const pyNeedle="pyInstance=await window.loadPyodide();return pyInstance";
if(s.includes(pyNeedle))s=s.replace(pyNeedle,"pyInstance=await window.loadPyodide();pyInstance.runPython('assert 6 * 7 == 42');return pyInstance");

if(s.includes('/@gameguild/emception-browser@3.8.0/+esm'))throw new Error('Broken jsDelivr +esm C++ import is still present');
if(/createEmception\(/.test(s))throw new Error('Legacy createEmception browser-facade path is still present in example tools');
if(!s.includes("assert 6 * 7 == 42"))throw new Error('Python runtime smoke test was not installed');
if(!s.includes('dedicated toolchain Worker controller'))throw new Error('Dedicated C++ runner handoff was not installed');
fs.writeFileSync(file,s,'utf8');
console.log('Patched example tools: Python smoke test retained; C++ execution delegated exclusively to the direct toolchain Worker controller.');
