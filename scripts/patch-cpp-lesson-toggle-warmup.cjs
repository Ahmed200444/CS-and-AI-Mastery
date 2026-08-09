const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'assets','cpp-runner-ui-worker.js');
let src=fs.readFileSync(file,'utf8');

const varsOld="var warmTimer=0,backgroundRunning=false,backgroundKey='',backgroundPromise=null,prebootStarted=false,firstPrewarmStarted=false,scrollTimer=0;";
const varsNew="var warmTimer=0,backgroundRunning=false,backgroundKey='',backgroundPromise=null,prebootStarted=false,firstPrewarmStarted=false,scrollTimer=0,pendingWarmButton=null;";
if(src.includes(varsOld))src=src.replace(varsOld,varsNew);

const resetOld="backgroundRunning=false;backgroundKey='';backgroundPromise=null;prebootStarted=false;firstPrewarmStarted=false;";
const resetNew="backgroundRunning=false;backgroundKey='';backgroundPromise=null;prebootStarted=false;firstPrewarmStarted=false;pendingWarmButton=null;";
if(src.includes(resetOld))src=src.replace(resetOld,resetNew);

const finallyOld="backgroundPromise=ensureArtifact(code,null).then(function(){setVariantNote(variant,'C++ ready');}).catch(function(error){setVariantNote(variant,'C++ compiler ready — press Run to retry');console.warn('[C++ runner] background preparation skipped:',error&&error.message||error);}).finally(function(){backgroundRunning=false;backgroundKey='';backgroundPromise=null;if(cppModeRequested())scheduleBackgroundWarmup(180);});";
const finallyNew="backgroundPromise=ensureArtifact(code,null).then(function(){setVariantNote(variant,'C++ ready');}).catch(function(error){setVariantNote(variant,'C++ compiler ready — press Run to retry');console.warn('[C++ runner] background preparation skipped:',error&&error.message||error);}).finally(function(){backgroundRunning=false;backgroundKey='';backgroundPromise=null;var next=pendingWarmButton;pendingWarmButton=null;if(next){var nv=cppVariant(next),nd=nv&&nv.closest&&nv.closest('details');if(!nd||nd.open)prepareButtonInBackground(next);}if(!backgroundRunning&&cppModeRequested())scheduleBackgroundWarmup(180);});";
if(src.includes(finallyOld))src=src.replace(finallyOld,finallyNew);

const marker="window.addEventListener('csai-language-controller-applied',function(event){var mode=event&&event.detail&&event.detail.mode;refreshNotes();if(mode==='cpp'||mode==='dual')scheduleBackgroundWarmup(80);});";
const toggle="document.addEventListener('toggle',function(event){var details=event.target;if(!details||details.tagName!=='DETAILS'||!details.open)return;if(!details.querySelector('[data-lang-variant=\\\"cpp\\\"] [data-run-language-example]'))return;prebootCompiler();setTimeout(function(){refreshNotes();var buttons=Array.from(details.querySelectorAll('[data-lang-variant=\\\"cpp\\\"] [data-run-language-example]'));var target=buttons.find(function(button){var variant=cppVariant(button),code=codeFor(variant),key=codeKey(code);return code.trim()&&!artifacts[key]&&!artifactPromises[key];});if(!target){scheduleBackgroundWarmup(20);return;}pendingWarmButton=target;if(!active&&!backgroundRunning){pendingWarmButton=null;prepareButtonInBackground(target);}else scheduleBackgroundWarmup(20);},0);},true);";

if(!src.includes("document.addEventListener('toggle'")){
  if(!src.includes(marker))throw new Error('Could not find C++ language-mode event marker for lesson-toggle warmup patch');
  src=src.replace(marker,marker+'\n'+toggle);
}
if(!src.includes('pendingWarmButton=null'))throw new Error('Pending C++ warmup priority slot was not installed');
if(!src.includes('var next=pendingWarmButton;pendingWarmButton=null'))throw new Error('Background completion does not consume the opened-lesson priority');
if(!src.includes("document.addEventListener('toggle'"))throw new Error('Lesson toggle warmup listener was not installed');
if(!src.includes("details.querySelector('[data-lang-variant=\\\"cpp\\\"] [data-run-language-example]')"))throw new Error('Lesson toggle warmup is not scoped to C++ examples');
if(!src.includes('pendingWarmButton=target'))throw new Error('Opened lesson is not queued ahead of generic background work');
fs.writeFileSync(file,src,'utf8');
console.log('C++ lesson-open warmup enabled: newly opened lessons are queued ahead of generic background compilation.');
