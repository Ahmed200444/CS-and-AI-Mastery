const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'assets','example-learning-tools.js');
let s=fs.readFileSync(file,'utf8');

const oldImport="var EMCEPTION_IMPORT='https://cdn.jsdelivr.net/npm/@gameguild/emception-browser@3.8.0/+esm';";
const newImport="var EMCEPTION_BUNDLE='/assets/emception-browser-bundle.js?v=20260809-2';";
if(s.includes(oldImport))s=s.replace(oldImport,newImport);
else if(!s.includes('EMCEPTION_BUNDLE'))throw new Error('Could not locate old Emception +esm import');

const oldGet="async function getEmception(){if(!emceptionPromise){emceptionPromise=(async function(){var mod=await import(EMCEPTION_IMPORT);if(!mod||typeof mod.createEmception!=='function')throw new Error('C++ compiler module did not load');return mod.createEmception({manifestUrl:EMCEPTION_MANIFEST,tty:'none'});})();}return emceptionPromise;}";
const newGet=`var cppSmokePromise=null;
async function verifyCppCompiler(em){
 if(!cppSmokePromise){cppSmokePromise=(async function(){
  var stamp='smoke-'+Date.now().toString(36),src='/home/user/'+stamp+'.cpp',out='/home/user/'+stamp+'.out';
  await em.writeFile(src,'#include <iostream>\\nusing namespace std;\\nint main(){ cout << "CSAI_CPP_OK" << endl; return 0; }\\n');
  var tools=['em++','clang++','clang'],compile=null,last='';
  for(var i=0;i<tools.length;i++){
   try{compile=await em.run(tools[i],[src,'-std=c++17','-O0','-o',out]);if(compile&&compile.exitCode===0)break;last=String((compile&&compile.stderr)||'')||String((compile&&compile.stdout)||'');}
   catch(e){last=e.message||String(e);compile=null;}
  }
  if(!compile||compile.exitCode!==0)throw new Error('C++ compiler smoke compile failed. '+(last||''));
  var run=await em.run(out,[]),text=String(run.stdout||'')+String(run.stderr||'');
  if(run.exitCode!==0||text.indexOf('CSAI_CPP_OK')<0)throw new Error('C++ compiler smoke run failed. '+text);
  return true;
 })();}
 return cppSmokePromise;
}
async function getEmception(){
 if(!emceptionPromise){emceptionPromise=(async function(){
  await loadScript(EMCEPTION_BUNDLE,function(){return !!(window.CSAIEmceptionBundle&&typeof window.CSAIEmceptionBundle.createEmception==='function');});
  if(!window.CSAIEmceptionBundle||typeof window.CSAIEmceptionBundle.createEmception!=='function')throw new Error('Local C++ compiler adapter did not load');
  var em=await window.CSAIEmceptionBundle.createEmception({manifestUrl:EMCEPTION_MANIFEST,tty:'none'});
  await verifyCppCompiler(em);
  return em;
 })();}
 return emceptionPromise;
}`;
if(s.includes(oldGet))s=s.replace(oldGet,newGet);
else if(!s.includes('verifyCppCompiler'))throw new Error('Could not locate old getEmception implementation');

const pyNeedle="pyInstance=await window.loadPyodide();return pyInstance";
if(s.includes(pyNeedle))s=s.replace(pyNeedle,"pyInstance=await window.loadPyodide();pyInstance.runPython('assert 6 * 7 == 42');return pyInstance");

if(s.includes('/@gameguild/emception-browser@3.8.0/+esm'))throw new Error('Broken jsDelivr +esm C++ import is still present');
if(!s.includes('emception-browser-bundle.js'))throw new Error('Local C++ bundle path was not installed');
if(!s.includes('verifyCppCompiler'))throw new Error('C++ compiler smoke test was not installed');
fs.writeFileSync(file,s,'utf8');
console.log('Patched example runner to use locally bundled Emception with Python/C++ runtime smoke tests.');
