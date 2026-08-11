(function(){
'use strict';

var pyInstance=null,pyPromise=null;
var PYODIDE='https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
var PY=`import sys,io,traceback\n_b=io.StringIO();_old=sys.stdout;sys.stdout=_b;_err=None\ntry: exec(compile(_SRC,'<study-example>','exec'),{'__name__':'__main__'})\nexcept Exception: _err=traceback.format_exc()\nfinally: sys.stdout=_old\n_RESULT=_b.getvalue() if _err is None else _b.getvalue()+'\\n'+_err\n_ISERR=_err is not None`;

function loadScript(src,test){return new Promise(function(resolve,reject){if(test&&test())return resolve();var existing=document.querySelector('script[data-csai-pyodide]');if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',function(){reject(new Error('Could not load Python runtime'));},{once:true});return;}var script=document.createElement('script');script.src=src;script.async=true;script.crossOrigin='anonymous';script.setAttribute('data-csai-pyodide','1');script.onload=resolve;script.onerror=function(){reject(new Error('Could not load '+src));};document.head.appendChild(script);});}
async function getPy(){if(pyInstance)return pyInstance;if(!pyPromise){pyPromise=(async function(){await loadScript(PYODIDE,function(){return typeof window.loadPyodide==='function';});pyInstance=await window.loadPyodide();document.documentElement.setAttribute('data-csai-python-ready','1');return pyInstance;})().catch(function(error){pyPromise=null;throw error;});}return pyPromise;}
function prewarmPython(){return getPy().catch(function(error){console.warn('[Python prewarm]',error);return null;});}
async function runPython(code){var start=performance.now(),py=await getPy();try{await py.loadPackagesFromImports(code);}catch(error){}py.globals.set('_SRC',String(code||''));py.runPython(PY);return{error:!!py.globals.get('_ISERR'),text:String(py.globals.get('_RESULT')||''),milliseconds:Math.max(1,Math.round(performance.now()-start))};}
window.CSAIPythonRunner={prewarm:prewarmPython,runSource:runPython,isReady:function(){return!!pyInstance;}};
})();
