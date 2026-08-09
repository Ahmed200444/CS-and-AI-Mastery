const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'assets','cpp-runner-ui-worker.js');
let src=fs.readFileSync(file,'utf8');

const marker="window.addEventListener('csai-language-controller-applied',function(event){var mode=event&&event.detail&&event.detail.mode;refreshNotes();if(mode==='cpp'||mode==='dual')scheduleBackgroundWarmup(80);});";
const toggle="document.addEventListener('toggle',function(event){var details=event.target;if(!details||details.tagName!=='DETAILS'||!details.open)return;if(!details.querySelector('[data-lang-variant=\\\"cpp\\\"] [data-run-language-example]'))return;prebootCompiler();setTimeout(function(){refreshNotes();var buttons=Array.from(details.querySelectorAll('[data-lang-variant=\\\"cpp\\\"] [data-run-language-example]'));var target=buttons.find(function(button){var variant=cppVariant(button),code=codeFor(variant),key=codeKey(code);return code.trim()&&!artifacts[key]&&!artifactPromises[key]&&actuallyVisibleForWarmup(button,variant);});if(target&&!active&&!backgroundRunning)prepareButtonInBackground(target);else scheduleBackgroundWarmup(20);},0);},true);";

if(!src.includes("document.addEventListener('toggle'")){
  if(!src.includes(marker))throw new Error('Could not find C++ language-mode event marker for lesson-toggle warmup patch');
  src=src.replace(marker,marker+'\n'+toggle);
}
if(!src.includes("document.addEventListener('toggle'"))throw new Error('Lesson toggle warmup listener was not installed');
if(!src.includes("details.querySelector('[data-lang-variant=\\\"cpp\\\"] [data-run-language-example]')"))throw new Error('Lesson toggle warmup is not scoped to C++ examples');
if(!src.includes('prepareButtonInBackground(target)'))throw new Error('Lesson toggle does not prioritize the opened lesson example');
fs.writeFileSync(file,src,'utf8');
console.log('C++ lesson-open warmup enabled: newly opened lessons immediately prioritize their visible unprepared C++ example.');
