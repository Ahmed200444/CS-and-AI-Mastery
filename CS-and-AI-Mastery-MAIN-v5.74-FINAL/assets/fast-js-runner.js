(function(){
'use strict';
if(window.CSAIJSRunner)return;
var worker=null,seq=0,pending=new Map(),ready=false;
function buildWorker(){
 var source=`const __cache=new Map();function __fn(code){let fn=__cache.get(code);if(fn)return fn;if(__cache.size>=48)__cache.clear();fn=new Function(code);__cache.set(code,fn);return fn;}self.console={log:(...a)=>self.postMessage({t:'log',id:self.__id,v:a.map(String).join(' ')}),error:(...a)=>self.postMessage({t:'log',id:self.__id,v:a.map(String).join(' ')})};self.onmessage=e=>{const d=e.data||{};self.__id=d.id;try{if(d.t==='prepare'){__fn(d.code);self.postMessage({t:'prepared',id:d.id});return;}__fn(d.code)();self.postMessage({t:'done',id:d.id});}catch(err){self.postMessage({t:'err',id:d.id,v:err&&err.stack?err.stack:String(err)});}};`;
 var url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
 var w=new Worker(url);URL.revokeObjectURL(url);
 w.onmessage=function(e){var d=e.data||{},p=pending.get(d.id);if(!p)return;if(d.t==='log'){p.lines.push(d.v);return;}pending.delete(d.id);clearTimeout(p.timer);if(d.t==='err')p.resolve({error:true,text:p.lines.concat([d.v]).join('\\n')});else p.resolve({error:false,text:p.lines.join('\\n')});};
 w.onerror=function(e){for(const [id,p] of pending){clearTimeout(p.timer);p.resolve({error:true,text:e.message||'JavaScript runner failed.'});}pending.clear();try{w.terminate();}catch(_){}worker=null;ready=false;};
 ready=true;return w;
}
function getWorker(){return worker||(worker=buildWorker());}
function prewarm(){getWorker();document.documentElement.setAttribute('data-csai-js-ready','1');return Promise.resolve(true);}
function prewarmSource(code){var src=String(code||'');if(!src.trim())return Promise.resolve(true);var id=++seq,w=getWorker();return new Promise(function(resolve){var p={resolve:function(r){resolve(!r.error);},lines:[],timer:null};p.timer=setTimeout(function(){if(!pending.has(id))return;pending.delete(id);resolve(false);},900);pending.set(id,p);w.postMessage({t:'prepare',id:id,code:src});});}
function runSource(code){var id=++seq,w=getWorker();return new Promise(function(resolve){var p={resolve:resolve,lines:[],timer:null};p.timer=setTimeout(function(){if(!pending.has(id))return;pending.delete(id);try{w.terminate();}catch(_){}worker=null;ready=false;resolve({error:true,text:'Execution stopped after 2 seconds.'});},2000);pending.set(id,p);w.postMessage({id:id,code:String(code||'')});});}
window.CSAIJSRunner={prewarm:prewarm,prewarmSource:prewarmSource,runSource:runSource,isReady:function(){return ready;},compiledSourceCache:true};
})();
