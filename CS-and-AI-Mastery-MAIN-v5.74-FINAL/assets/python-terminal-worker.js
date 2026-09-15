'use strict';
var PYODIDE_BASE='/runtime/pyodide/';
var pyPromise=null,py=null,control=null,inputBytes=null,decoder=new TextDecoder('utf-8'),stdoutDecoder=new TextDecoder('utf-8'),stderrDecoder=new TextDecoder('utf-8');
var runId=0,output='',preparedImports=Object.create(null),helpersReady=false;
function send(type,extra){postMessage(Object.assign({type:type,runId:runId},extra||{}));}
function importKey(code){var lines=String(code||'').split(/\r?\n/).map(function(x){return x.trim();}).filter(function(x){return /^(?:from\s+[A-Za-z_][\w.]*\s+import\s+|import\s+[A-Za-z_][\w.]*)/.test(x);});return lines.sort().join('|');}
function mayNeedPackages(key){return /\b(?:numpy|pandas|matplotlib|scipy|sklearn|sympy|networkx|statsmodels|seaborn|gradio|fastapi|micropip)\b/i.test(key);}
async function prepareImports(runtime,code){var key=importKey(code);if(!key||preparedImports[key])return;if(mayNeedPackages(key)){try{await runtime.loadPackagesFromImports(String(code||''));}catch(_){}}preparedImports[key]=1;}
function ensurePy(){if(pyPromise)return pyPromise;pyPromise=(async function(){importScripts(PYODIDE_BASE+'pyodide.js');py=await loadPyodide({indexURL:PYODIDE_BASE});py.setStdout({write:function(buffer){var t=stdoutDecoder.decode(buffer,{stream:true});output+=t;send('stdout',{text:t});return buffer.length;},isatty:true});py.setStderr({write:function(buffer){var t=stderrDecoder.decode(buffer,{stream:true});output+=t;send('stderr',{text:t});return buffer.length;},isatty:true});if(!helpersReady){py.runPython(`import traceback, json, ast
_CSAI_CODE_CACHE={}
def _csai_compiled(source, filename):
    key=(filename, source)
    code=_CSAI_CODE_CACHE.get(key)
    if code is None:
        if len(_CSAI_CODE_CACHE)>=48:
            _CSAI_CODE_CACHE.clear()
        code=compile(source, filename, 'exec')
        _CSAI_CODE_CACHE[key]=code
    return code
def _csai_prepare(source):
    _csai_compiled(source, '<student-code>')
    _csai_compiled(source, '<code>')
    return True
def _csai_execute(source):
    try:
        exec(_csai_compiled(source, '<student-code>'), {'__name__':'__main__'})
        return ''
    except Exception:
        return traceback.format_exc()
def _csai_test(source, spec_json, tests_text):
    spec=json.loads(spec_json); ns={}; res={'passed':False,'results':[]}
    try:
        exec(_csai_compiled(source, '<code>'), ns)
        fn=ns.get(spec.get('fname'))
        if fn is None: raise NameError('Define a function named '+str(spec.get('fname')))
        tests=ast.literal_eval(tests_text); ok=True
        for args,expected in tests:
            try:
                got=fn(**args) if spec.get('kwargs') else fn(*args)
                passed=(got==expected)
                res['results'].append({'passed':passed,'args':repr(args),'got':repr(got),'expected':repr(expected)})
                if not passed: ok=False
            except Exception:
                ok=False; res['results'].append({'passed':False,'args':repr(args),'error':traceback.format_exc()})
        res['passed']=ok
    except Exception:
        res['error']=traceback.format_exc()
    return json.dumps(res)`);helpersReady=true;}postMessage({type:'runtime-ready'});return py;})();return pyPromise;}
function stdinLine(){send('input-request',{});while(true){var state=Atomics.load(control,0);if(state===1)break;if(state===2){Atomics.store(control,0,0);return null;}Atomics.wait(control,0,0);}var len=Math.max(0,Math.min(inputBytes.length,Atomics.load(control,1)));var value=decoder.decode(inputBytes.slice(0,len));Atomics.store(control,1,0);Atomics.store(control,0,0);return value;}
async function run(code,id){runId=id;output='';Atomics.store(control,0,0);Atomics.store(control,1,0);var start=performance.now();try{var runtime=await ensurePy();runtime.setStdin({stdin:stdinLine,isatty:true,autoEOF:true});await prepareImports(runtime,code);runtime.globals.set('_CSAI_SOURCE',String(code||''));var err=runtime.runPython(`_csai_execute(_CSAI_SOURCE)`);var errText=err==null?'':String(err);if(errText){var addition=(output&&!output.endsWith('\\n')?'\\n':'')+errText;output+=addition;send('stderr',{text:addition});}send('done',{error:!!errText,text:output,milliseconds:Math.max(1,Math.round(performance.now()-start))});}catch(error){var text=(error&&error.stack)||String(error),addition=(output&&!output.endsWith('\\n')?'\\n':'')+text;output+=addition;send('stderr',{text:addition});send('done',{error:true,text:output,milliseconds:Math.max(1,Math.round(performance.now()-start))});}finally{try{if(py)py.setStdin({error:true});}catch(_){}}}
async function testSource(code,cfg,id){runId=id;var start=performance.now();try{var runtime=await ensurePy();await prepareImports(runtime,code);runtime.globals.set('_CSAI_SOURCE',String(code||''));runtime.globals.set('_CSAI_SPEC',JSON.stringify({fname:cfg&&cfg.fname,kwargs:!!(cfg&&cfg.kwargs)}));runtime.globals.set('_CSAI_TESTS',String(cfg&&cfg.tests_py||'[]'));var text=runtime.runPython(`_csai_test(_CSAI_SOURCE,_CSAI_SPEC,_CSAI_TESTS)`);postMessage({type:'test-done',runId:id,result:String(text),milliseconds:Math.max(1,Math.round(performance.now()-start))});}catch(error){postMessage({type:'test-done',runId:id,result:JSON.stringify({passed:false,error:(error&&error.stack)||String(error),results:[]}),milliseconds:Math.max(1,Math.round(performance.now()-start))});}}
self.onmessage=function(e){var d=e.data||{};if(d.type==='init'){control=new Int32Array(d.controlBuffer);inputBytes=new Uint8Array(d.inputBuffer);postMessage({type:'initialized'});return;}if(d.type==='prewarm'){ensurePy().then(function(){postMessage({type:'ready'});}).catch(function(error){postMessage({type:'worker-error',message:(error&&error.message)||String(error)});});return;}if(d.type==='prewarm-source'){ensurePy().then(async function(runtime){await prepareImports(runtime,d.code);try{runtime.globals.set('_CSAI_PREP_SOURCE',String(d.code||''));runtime.runPython('_csai_prepare(_CSAI_PREP_SOURCE)');}catch(_){} }).then(function(){postMessage({type:'source-ready'});}).catch(function(){postMessage({type:'source-ready'});});return;}if(d.type==='prewarm-sources'){ensurePy().then(async function(runtime){for(var i=0;i<(d.codes||[]).length;i++){var src=String(d.codes[i]||'');await prepareImports(runtime,src);try{runtime.globals.set('_CSAI_PREP_SOURCE',src);runtime.runPython('_csai_prepare(_CSAI_PREP_SOURCE)');}catch(_){}}}).then(function(){postMessage({type:'sources-ready'});}).catch(function(){postMessage({type:'sources-ready'});});return;}if(d.type==='run'){if(!control||!inputBytes){postMessage({type:'worker-error',runId:d.runId,message:'Python terminal worker is not initialized.'});return;}run(d.code,d.runId);return;}if(d.type==='test'){testSource(d.code,d.cfg||{},d.runId);return;}if(d.type==='cancel'&&control){Atomics.store(control,0,2);Atomics.notify(control,0,1);}};
