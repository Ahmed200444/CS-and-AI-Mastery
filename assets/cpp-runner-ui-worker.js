(function(){
'use strict';

var CLIENT_URL='/assets/emception-vite/cpp-client.mjs?v=20260809-5';
var TOOLCHAIN_WORKER_URL='/assets/emception-vite/cpp-toolchain-worker.mjs?v=20260809-5';
var MANIFEST_URL='https://cdn.jsdelivr.net/npm/emception@3.8.0/cdn/manifest.json';
var clientPromise=null,orchestrator=null,toolWorker=null,runnerPromise=null,smokeDone=false,active=null,seq=0;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function cppVariant(button){return button&&button.closest?button.closest('[data-lang-variant="cpp"]'):null;}
function outputFor(variant){return variant&&variant.querySelector('[data-csai-example-output]');}
function codeFor(variant){var pre=variant&&variant.querySelector('[data-csai-language-generated],.csai-language-code');return String(pre&&pre.textContent||'');}
function render(out,label,text,error){if(!out)return;out.innerHTML='<span class="'+(error?'bad':'ok')+'">'+esc(label)+'</span>\n'+esc(text||'');}
function progress(out,text){if(out)out.textContent=String(text||'Working…');}
function absolute(path){return new URL(path,window.location.href).href;}
function timeout(promise,ms,message){return new Promise(function(resolve,reject){var done=false,t=setTimeout(function(){if(done)return;done=true;reject(new Error(message));},ms);Promise.resolve(promise).then(function(value){if(done)return;done=true;clearTimeout(t);resolve(value);},function(error){if(done)return;done=true;clearTimeout(t);reject(error);});});}

async function resetRunner(){
 var old=orchestrator,w=toolWorker;
 orchestrator=null;toolWorker=null;runnerPromise=null;smokeDone=false;
 try{if(old&&typeof old.dispose==='function')await old.dispose(new Error('C++ runner reset'));}catch(e){}
 try{if(w)w.terminate();}catch(e){}
}
async function getClient(){
 if(!clientPromise){clientPromise=import(absolute(CLIENT_URL)).then(function(mod){
  if(!mod||typeof mod.WorkerOrchestrator!=='function'||typeof mod.workerTransport!=='function')throw new Error('C++ worker client module did not load correctly.');
  return mod;
 });}
 return clientPromise;
}
async function compileSource(orch,src,out){
 var tools=['em++','clang++','clang'],last='';
 for(var i=0;i<tools.length;i++){
  try{
   var result=await timeout(orch.run(tools[i],[src,'-std=c++17','-O0','-o',out]),45000,'C++ compilation timed out.');
   if(result&&result.exitCode===0)return result;
   last=String(result&&result.stderr||'')||String(result&&result.stdout||'');
  }catch(error){last=error&&error.message||String(error);}
 }
 throw new Error(last||'C++ compilation failed.');
}
async function smokeTest(orch,outNode){
 if(smokeDone)return;
 progress(outNode,'Checking the C++ compiler…');
 var stamp='smoke-'+Date.now().toString(36),src='/home/user/'+stamp+'.cpp',out='/home/user/'+stamp+'.out';
 await orch.writeFile(src,new TextEncoder().encode('#include <iostream>\nusing namespace std;\nint main(){ cout << "CSAI_CPP_OK" << endl; return 0; }\n'));
 await compileSource(orch,src,out);
 var run=await timeout(orch.run(out,[]),30000,'C++ smoke program timed out.');
 var text=String(run&&run.stdout||'')+String(run&&run.stderr||'');
 if(!run||run.exitCode!==0||text.indexOf('CSAI_CPP_OK')<0)throw new Error('C++ compiler smoke test failed. '+text);
 smokeDone=true;
}
async function getRunner(outNode){
 if(orchestrator&&smokeDone)return orchestrator;
 if(!runnerPromise){runnerPromise=(async function(){
  progress(outNode,'Loading the lightweight C++ worker client…');
  var mod=await getClient();
  progress(outNode,'Starting the C++ toolchain worker…');
  var worker=new Worker(absolute(TOOLCHAIN_WORKER_URL),{type:'module',name:'csai-emception-toolchain'});
  var orch=new mod.WorkerOrchestrator(mod.workerTransport(worker),{
   onTransportError:function(error){console.error('[C++ runner]',error);}
  });
  toolWorker=worker;orchestrator=orch;
  try{
   progress(outNode,'Loading the C++ compiler in the background…');
   await timeout(orch.boot(MANIFEST_URL,{origin:window.location.origin}),90000,'The C++ compiler took too long to initialize.');
   await smokeTest(orch,outNode);
   return orch;
  }catch(error){await resetRunner();throw error;}
 })();}
 try{return await runnerPromise;}catch(error){runnerPromise=null;throw error;}
}
async function runCode(button,variant){
 var outNode=outputFor(variant),code=codeFor(variant);if(!outNode||!code.trim())return;
 if(active){progress(outNode,'Another C++ example is already running. Wait for it to finish, then press Run example.');return;}
 var token='cpp-'+(++seq);active=token;button.disabled=true;button.textContent='Running C++…';
 try{
  var orch=await getRunner(outNode);
  if(active!==token)return;
  var stamp=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),src='/home/user/csai-'+stamp+'.cpp',out='/home/user/csai-'+stamp+'.out';
  progress(outNode,'Compiling C++…');
  await orch.writeFile(src,new TextEncoder().encode(code));
  await compileSource(orch,src,out);
  progress(outNode,'Running C++…');
  var result=await timeout(orch.run(out,[]),30000,'The C++ program took too long to run.');
  var text=String(result&&result.stdout||'')+String(result&&result.stderr||'');
  render(outNode,result&&result.exitCode===0?'Output':'Run error',text||'(no output)',!result||result.exitCode!==0);
 }catch(error){
  var message=error&&error.message||String(error);
  render(outNode,'Run error',message,true);
  if(/timed out|worker|transport|initialize|boot/i.test(message))await resetRunner();
 }finally{
  if(active===token)active=null;
  button.disabled=false;button.textContent='▶ Run example';
 }
}

document.addEventListener('click',function(event){
 var button=event.target&&event.target.closest&&event.target.closest('[data-run-language-example]');if(!button)return;
 var variant=cppVariant(button);if(!variant)return;
 event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();
 runCode(button,variant);
},true);
window.addEventListener('pagehide',function(){active=null;resetRunner();});
})();
