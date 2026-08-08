(function(){
'use strict';

var pyInstance=null,pyPromise=null,cppPromise=null,emceptionPromise=null;
var EMCEPTION_IMPORT='https://cdn.jsdelivr.net/npm/@gameguild/emception-browser@3.8.0/+esm';
var EMCEPTION_MANIFEST='https://cdn.jsdelivr.net/npm/emception@3.8.0/cdn/manifest.json';
var JSCPP_URL='https://cdn.jsdelivr.net/npm/JSCPP@2.0.9/dist/JSCPP.es5.min.js';

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c];});}
function loadScript(src,test){return new Promise(function(resolve,reject){if(test&&test())return resolve();var s=document.createElement('script');s.src=src;s.async=true;s.crossOrigin='anonymous';s.onload=resolve;s.onerror=function(){reject(new Error('Could not load '+src));};document.head.appendChild(s);});}
function addStyle(){if(document.getElementById('csai-example-learning-tools-style'))return;var s=document.createElement('style');s.id='csai-example-learning-tools-style';s.textContent=`
.csai-example-tools{border-top:1px solid var(--border);background:var(--panel)}.csai-example-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid var(--border)}.csai-example-run{border:1px solid #17649a;border-radius:8px;background:#17649a;color:#fff;padding:8px 12px;font:800 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}.csai-example-run:disabled{opacity:.58;cursor:wait}.csai-example-output{min-height:58px;margin:0;padding:11px 13px;background:var(--bg);color:var(--text);white-space:pre-wrap;overflow:auto;font:500 13px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.csai-example-output .ok{color:#16805b;font-weight:850}.csai-example-output .bad{color:#c44152;font-weight:850}.csai-example-explain{padding:12px 14px;border-top:1px solid var(--border);background:color-mix(in srgb,var(--panel) 92%,var(--bg))}.csai-example-explain summary{cursor:pointer;font-weight:900}.csai-example-explain ol{margin:9px 0 0;padding-left:22px}.csai-example-explain li{margin:8px 0;line-height:1.55}.csai-example-explain code{font:600 12px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace}.csai-example-note{margin-left:auto;font-size:.74rem;color:var(--muted);font-weight:750}.lesson-run-card>.csai-example-explain{border-top:1px solid var(--border)}
`;document.head.appendChild(s);}

function inferLang(code,label){var c=String(code||''),l=String(label||'').toLowerCase();if(/c\+\+|cpp/.test(l)||/#include\s*[<"]|\bcout\s*<<|\bvector\s*</.test(c))return'cpp';if(/python/.test(l)||/(^|\n)\s*(def\s+|from\s+|import\s+|for\s+\w+\s+in\s+|print\s*\()/.test(c))return'python';if(/javascript/.test(l)||/\b(console\.log|const\s+|let\s+|function\s+)/.test(c))return'javascript';if(/sql/.test(l)||/\b(SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE)\b/i.test(c))return'sql';if(/html/.test(l)||/<\/?[a-z][^>]*>/i.test(c))return'html';return'text';}
function explainLine(line,lang){var s=String(line||'').trim();if(!s)return'Blank line: separates parts of the example so the logic is easier to read.';if(/^#(?!include)|^\/\//.test(s))return'Comment: explains the intention of the code and is not executed.';
 if(lang==='python'){
  if(/^def\s+/.test(s))return'Function definition: creates a reusable block of code and names its inputs.';
  if(/^class\s+/.test(s))return'Class definition: creates a new type that can group data and behavior.';
  if(/^for\s+.+\s+in\s+/.test(s))return'Loop header: takes the next value from the sequence, then runs the indented body.';
  if(/^while\s+/.test(s))return'While loop: checks the condition before each iteration and repeats while it stays true.';
  if(/^if\s+/.test(s))return'Condition: the indented block runs only when this expression is true.';
  if(/^elif\s+/.test(s))return'Alternative condition: checked only when the earlier condition was false.';
  if(/^else\s*:/.test(s))return'Fallback branch: runs when the earlier conditions were false.';
  if(/^return\b/.test(s))return'Return: sends a value back to the caller and ends the current function call.';
  if(/\.append\(/.test(s))return'Append: adds a new item to the end of the list.';
  if(/^print\s*\(/.test(s))return'Print: sends a value to the output area so you can observe the program result.';
  if(/^from\s+|^import\s+/.test(s))return'Import: loads a library or name that the program uses later.';
  if(/\brange\s*\(/.test(s))return'range(...) produces a sequence of integer values used by the loop.';
  if(/\blen\s*\(/.test(s))return'len(...) asks Python for the number of items in the sequence.';
  if(/^[A-Za-z_]\w*\s*=/.test(s))return'Assignment: stores the value on the right inside the variable on the left.';
 }
 if(lang==='cpp'){
  if(/^#include\s*</.test(s))return'Header include: makes a C++ standard-library feature available to this file.';
  if(/^using\s+namespace\s+std/.test(s))return'Namespace statement: lets this example write standard names such as cout and vector without the std:: prefix.';
  if(/^int\s+main\s*\(/.test(s))return'Program entry point: execution begins inside main().' ;
  if(/^for\s*\(\s*int\s+\w+\s*=/.test(s))return'Normal for loop: initialize once, check the condition before every iteration, run the body, then perform the update such as i++.';
  if(/^for\s*\([^:]+:[^)]+\)/.test(s))return'Range-based for loop: C++ gives the loop variable each value from the container automatically.';
  if(/\.begin\(\).*\.end\(\)/.test(s))return'Iterator loop: begin() points to the first element, end() marks the position just after the last element, and the iterator moves one position at a time.';
  if(/^while\s*\(/.test(s))return'While loop: checks its condition first, then repeats the body while the condition remains true.';
  if(/^if\s*\(/.test(s))return'Condition: the following block runs only when the expression inside parentheses is true.';
  if(/\bvector\s*</.test(s))return'vector is a resizable C++ sequence. The element type is written inside angle brackets.';
  if(/\b(stack|queue|unordered_map|priority_queue)\s*</.test(s))return'This declares a C++ STL container and specifies the type of values it stores.';
  if(/\bcout\s*<</.test(s))return'Output: cout sends the value to standard output; << passes each next value into the output stream.';
  if(/^return\b/.test(s))return'Return: ends the current function and sends a value back. return 0 in main means the program finished successfully.';
  if(/\+\+/.test(s))return'Increment: ++ increases that integer by one after the current operation.';
  if(/^class\s+|^struct\s+/.test(s))return'Type definition: groups related data and behavior into one C++ type.';
  if(/^}/.test(s))return'Closing brace: ends the current block such as a loop, condition, function, or class.';
 }
 if(lang==='javascript'){
  if(/^(const|let)\s+/.test(s))return'Variable declaration: creates a named value for later use.';
  if(/^function\s+|=>/.test(s))return'Function definition: creates reusable JavaScript behavior.';
  if(/^for\s*\(/.test(s))return'Loop: repeats the block while its condition remains true.';
  if(/console\.log/.test(s))return'Output: writes a value to the JavaScript console/output area.';
 }
 if(lang==='sql'){
  if(/^SELECT\b/i.test(s))return'SELECT chooses which columns or expressions appear in the result.';
  if(/^FROM\b/i.test(s))return'FROM identifies the table that supplies the rows.';
  if(/^WHERE\b/i.test(s))return'WHERE filters rows using a condition.';
  if(/JOIN\b/i.test(s))return'JOIN combines related rows from another table.';
  if(/^ORDER BY\b/i.test(s))return'ORDER BY sorts the result.';
 }
 if(lang==='html')return'This line contributes markup or content to the browser preview.';
 return'This line performs the next operation in the example. Read it together with the lines immediately before and after it.';
}
function explanationHtml(code,lang){var lines=String(code||'').split(/\r?\n/),items=[];for(var i=0;i<lines.length;i++){if(!lines[i].trim())continue;items.push('<li><code>'+esc(lines[i])+'</code><br>'+esc(explainLine(lines[i],lang))+'</li>');}return'<details class="csai-example-explain" open><summary>Deep step-by-step explanation</summary><ol>'+items.join('')+'</ol></details>';}

async function getPy(){if(pyInstance)return pyInstance;if(!pyPromise){pyPromise=(async function(){await loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js',function(){return typeof window.loadPyodide==='function';});pyInstance=await window.loadPyodide();return pyInstance;})();}return pyPromise;}
async function runPython(code){var py=await getPy();try{await py.loadPackagesFromImports(code);}catch(e){}var wrapped='import sys,io,traceback\n_b=io.StringIO();_old=sys.stdout;sys.stdout=_b;_err=None\ntry:\n exec(compile(_SRC,"<example>","exec"),{"__name__":"__main__"})\nexcept Exception:\n _err=traceback.format_exc()\nfinally:\n sys.stdout=_old\n_RESULT=_b.getvalue() if _err is None else _b.getvalue()+"\\n"+_err\n_ISERR=_err is not None';py.globals.set('_SRC',code);py.runPython(wrapped);return{error:!!py.globals.get('_ISERR'),text:String(py.globals.get('_RESULT')||'')};}
function runJavascript(code){return new Promise(function(resolve){var blob=new Blob([`self.console={log:(...a)=>self.postMessage({t:'log',v:a.map(String).join(' ')})};try{new Function(${JSON.stringify(code)})();self.postMessage({t:'done'})}catch(e){self.postMessage({t:'err',v:e.stack||String(e)})}`],{type:'text/javascript'}),url=URL.createObjectURL(blob),w=new Worker(url),lines=[],done=false,t=setTimeout(function(){if(done)return;done=true;w.terminate();URL.revokeObjectURL(url);resolve({error:true,text:'Execution stopped after 2 seconds.'});},2000);w.onmessage=function(e){if(done)return;var d=e.data||{};if(d.t==='log')lines.push(d.v);if(d.t==='err'){done=true;clearTimeout(t);w.terminate();URL.revokeObjectURL(url);resolve({error:true,text:lines.concat([d.v]).join('\n')});}else if(d.t==='done'){done=true;clearTimeout(t);w.terminate();URL.revokeObjectURL(url);resolve({error:false,text:lines.join('\n')});}};});}
async function getEmception(){if(!emceptionPromise){emceptionPromise=(async function(){var mod=await import(EMCEPTION_IMPORT);if(!mod||typeof mod.createEmception!=='function')throw new Error('C++ compiler module did not load');return mod.createEmception({manifestUrl:EMCEPTION_MANIFEST,tty:'none'});})();}return emceptionPromise;}
async function runCppEmception(code){var em=await getEmception(),stamp=Date.now().toString(36)+Math.random().toString(36).slice(2,7),src='/home/user/csai-'+stamp+'.cpp',out='/home/user/csai-'+stamp+'.out';await em.writeFile(src,code);var tools=['em++','clang++','clang'],compile=null,last='';for(var i=0;i<tools.length;i++){try{compile=await em.run(tools[i],[src,'-std=c++17','-O0','-o',out]);if(compile&&compile.exitCode===0)break;last=String((compile&&compile.stderr)||'')||String((compile&&compile.stdout)||'');}catch(e){last=e.message||String(e);compile=null;}}if(!compile||compile.exitCode!==0)return{error:true,text:last||'C++ compilation failed.'};var run=await em.run(out,[]);var text=String(run.stdout||'')+String(run.stderr||'');return{error:run.exitCode!==0,text:text||'(no output)'};}
async function getJsCpp(){if(window.JSCPP)return window.JSCPP;if(!cppPromise){cppPromise=loadScript(JSCPP_URL,function(){return !!window.JSCPP;}).then(function(){return window.JSCPP;});}return cppPromise;}
async function runCppFallback(code){var JSCPP=await getJsCpp(),output='';try{var exit=JSCPP.run(code,'',{stdio:{write:function(s){output+=s;}},maxTimeout:2500,unsigned_overflow:'error'});return{error:exit!==0,text:output||'(no output)'};}catch(e){return{error:true,text:(e.message||String(e))+'\n\nThe lightweight fallback runner could not execute this STL-heavy example.'};}}
async function runCpp(code){try{return await runCppEmception(code);}catch(primary){try{return await runCppFallback(code);}catch(fallback){return{error:true,text:'C++ runner could not start. '+(primary.message||String(primary))};}}}

async function runGenerated(button,variant){var pre=variant.querySelector('[data-csai-language-generated],.csai-language-code'),out=variant.querySelector('[data-csai-example-output]');if(!pre||!out)return;var code=pre.textContent||'',lang=variant.getAttribute('data-lang-variant')||inferLang(code,'');button.disabled=true;out.textContent=lang==='cpp'?'Loading the C++ compiler on demand…':lang==='python'?'Loading Python runner…':'Running…';try{var result;if(lang==='python')result=await runPython(code);else if(lang==='cpp')result=await runCpp(code);else if(lang==='javascript')result=await runJavascript(code);else{result={error:true,text:'This generated example does not have a browser runner for '+lang+' yet.'};}out.innerHTML='<span class="'+(result.error?'bad':'ok')+'">'+(result.error?'Run error':'Output')+'</span>\n'+esc(result.text||'(no output)');}catch(e){out.innerHTML='<span class="bad">Runner error</span>\n'+esc(e.message||String(e));}finally{button.disabled=false;}}
function enhanceVariant(variant){if(variant.hasAttribute('data-csai-example-tools-ready'))return;var pre=variant.querySelector('[data-csai-language-generated],.csai-language-code');if(!pre)return;variant.setAttribute('data-csai-example-tools-ready','1');var lang=variant.getAttribute('data-lang-variant')||inferLang(pre.textContent,'');var tools=document.createElement('div');tools.className='csai-example-tools';tools.innerHTML='<div class="csai-example-actions"><button type="button" class="csai-example-run" data-run-language-example>▶ Run example</button><span class="csai-example-note">Runner loads only when you press Run</span></div><pre class="csai-example-output" data-csai-example-output>Ready.</pre>'+explanationHtml(pre.textContent,lang);variant.appendChild(tools);tools.querySelector('[data-run-language-example]').addEventListener('click',function(){runGenerated(this,variant);});}
function enhanceLegacy(card){if(card.hasAttribute('data-csai-example-explanation-ready'))return;var pre=card.querySelector('pre.code'),label=card.querySelector('.lesson-run-lang');if(!pre)return;card.setAttribute('data-csai-example-explanation-ready','1');card.insertAdjacentHTML('beforeend',explanationHtml(pre.textContent,inferLang(pre.textContent,label&&label.textContent)));}
function enhance(){addStyle();document.querySelectorAll('.csai-lang-variant[data-lang-variant]').forEach(enhanceVariant);document.querySelectorAll('.lesson-run-card').forEach(enhanceLegacy);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();setTimeout(enhance,250);setTimeout(enhance,800);window.addEventListener('csai-language-mode-change',function(){setTimeout(enhance,50);});var observer=new MutationObserver(function(records){if(records.some(function(r){return r.addedNodes&&r.addedNodes.length;}))setTimeout(enhance,30);});observer.observe(document.documentElement,{childList:true,subtree:true});
})();
