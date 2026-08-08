(function(){
'use strict';

var meta={};
try{var m=document.getElementById('course-page-meta');meta=m?JSON.parse(m.textContent||'{}'):{};}catch(e){}
var courseId=String(meta.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'');
var STORAGE='csai-evergreen-mastery-v1';
var pyInstance=null,pyPromise=null,sqlInstance=null,sqlPromise=null;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function read(){try{return JSON.parse(localStorage.getItem(STORAGE)||'{}')||{}}catch(e){return{}}}
function save(v){try{localStorage.setItem(STORAGE,JSON.stringify(v))}catch(e){}}
function lessonId(lesson,index){return lesson.getAttribute('data-lesson')||('lesson-'+index)}
function titleOf(lesson){var t=lesson.querySelector('.title');return t?t.textContent.trim():'Lesson'}
function bodyOf(lesson){return lesson.querySelector('.body')}
function deepText(body,heading){var heads=Array.from(body.querySelectorAll('.lesson-deep-dive h3'));var h=heads.find(function(x){return norm(x.textContent)===norm(heading)});if(!h)return'';var out=[],n=h.nextElementSibling;while(n&&n.tagName!=='H3'){out.push(n.textContent.trim());n=n.nextElementSibling}return out.filter(Boolean).join(' ')}
function conceptsOf(body){var labels=Array.from(body.querySelectorAll('.meta .pill')).map(function(x){return x.textContent.trim()}).filter(Boolean);return Array.from(new Set(labels)).slice(0,8)}
function codeBlocks(body){return Array.from(body.querySelectorAll('pre.code')).filter(function(pre){return !pre.closest('.assessment-section')})}
function inferLanguage(code){var c=String(code||'').trim();if(!c)return'text';if(/<\/?[a-z][^>]*>/i.test(c))return'html';if(/\b(SELECT|INSERT|UPDATE|DELETE|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i.test(c))return'sql';if(/\b(console\.log|const\s+|let\s+|function\s+|=>|document\.)/.test(c))return'javascript';if(/(^|\n)\s*(def\s+|class\s+|import\s+|from\s+\S+\s+import\s+|print\s*\(|for\s+\w+\s+in\s+|while\s+|if\s+.+:|try\s*:)/m.test(c)||/\brange\s*\(/.test(c))return'python';if(/(^|\n)\s*(git\s+|ls\b|cd\s+|pwd\b|mkdir\b|docker\s+|npm\s+|pip\s+|curl\s+|ssh\s+)/m.test(c))return'shell';return'text'}
function langLabel(lang){return{python:'Python',javascript:'JavaScript',sql:'SQL',html:'HTML',shell:'Command example',text:'Concept walkthrough'}[lang]||lang}
function runnable(lang,code){if(['python','javascript','sql','html'].indexOf(lang)<0)return false;if(/(^|\s)\.\.\.(\s|$)/m.test(code)||/\bTODO\b|\bpass\s*($|#)/mi.test(code))return false;return true}

function addStyle(){if(document.getElementById('csai-evergreen-style'))return;var s=document.createElement('style');s.id='csai-evergreen-style';s.textContent=`
.evergreen-lab{margin-top:22px;padding-top:20px;border-top:1px solid var(--border)}.evergreen-titlebar{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}.evergreen-titlebar h3{margin:0!important;font-size:1.15rem!important}.evergreen-titlebar p{margin:3px 0 0;color:var(--muted);font-size:.9rem}.evergreen-badge{padding:5px 9px;border-radius:999px;background:var(--pill);color:var(--pilltext);font-size:.72rem;font-weight:900}.evergreen-concepts{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 16px}.evergreen-concept{border:1px solid var(--border);border-radius:9px;background:var(--bg);padding:7px 9px;font-size:.8rem;font-weight:800}.evergreen-examples{display:grid;gap:13px}.evergreen-example{border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--panel)}.evergreen-example-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;background:color-mix(in srgb,var(--panel) 88%,var(--bg));border-bottom:1px solid var(--border)}.evergreen-example-head b{font-size:.86rem}.evergreen-example-head span{font-size:.7rem;font-weight:850;color:var(--muted)}.evergreen-editor{display:block;width:100%;min-height:150px;resize:vertical;border:0;border-bottom:1px solid var(--border);outline:0;padding:13px;background:#0b111b;color:#f4f7fb;font:500 13px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;tab-size:4}.evergreen-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:7px;padding:9px 10px;border-bottom:1px solid var(--border)}.evergreen-btn{border:1px solid var(--border);border-radius:8px;background:var(--panel);color:var(--text);padding:7px 10px;font:800 12px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}.evergreen-btn.primary{background:#17649a;color:#fff;border-color:#17649a}.evergreen-btn:disabled{opacity:.55;cursor:wait}.evergreen-predict{min-width:180px;flex:1;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);padding:7px 9px;font:inherit}.evergreen-output{min-height:58px;padding:10px 12px;background:var(--bg);white-space:pre-wrap;overflow:auto;font:500 12.5px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.evergreen-output .ok{color:#16805b;font-weight:850}.evergreen-output .bad{color:#c44152;font-weight:850}.evergreen-explain{display:none;padding:12px;border-top:1px solid var(--border);background:color-mix(in srgb,var(--panel) 92%,var(--bg))}.evergreen-explain.open{display:block}.evergreen-explain ol{margin:6px 0 0;padding-left:22px}.evergreen-explain li{margin:5px 0}.evergreen-scenario{padding:13px}.evergreen-scenario p{margin:5px 0 10px}.evergreen-master{margin-top:14px;border:1px solid var(--border);border-radius:11px;padding:12px;background:var(--bg)}.evergreen-master-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.evergreen-master strong{margin-right:auto}.evergreen-review{margin-top:8px;color:var(--muted);font-size:.8rem}.evergreen-course-status{display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:5px 8px;border-radius:999px;background:var(--pill);color:var(--pilltext);font-size:.75rem;font-weight:850}@media(max-width:720px){.evergreen-toolbar{align-items:stretch}.evergreen-predict{width:100%;flex-basis:100%}}
`;document.head.appendChild(s)}

function loadScript(src,test){return new Promise(function(resolve,reject){if(test&&test())return resolve();var s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=function(){reject(new Error('Could not load browser runner.'))};document.head.appendChild(s)})}
var PY=`
import sys,io,traceback
_b=io.StringIO();_old=sys.stdout;sys.stdout=_b;_err=None
try: exec(compile(_SRC,'<evergreen-example>','exec'),{'__name__':'__main__'})
except Exception: _err=traceback.format_exc()
finally: sys.stdout=_old
_RESULT=_b.getvalue() if _err is None else _b.getvalue()+'\\n'+_err
_ISERR=_err is not None
`;
async function getPy(){if(pyInstance)return pyInstance;if(!pyPromise){pyPromise=(async function(){await loadScript('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js',function(){return typeof window.loadPyodide==='function'});pyInstance=await window.loadPyodide();return pyInstance})()}return pyPromise}
async function runPython(code){var py=await getPy();try{await py.loadPackagesFromImports(code)}catch(e){}py.globals.set('_SRC',code);py.runPython(PY);return{error:!!py.globals.get('_ISERR'),text:String(py.globals.get('_RESULT')||'')}}
function runJS(code){return new Promise(function(resolve){var blob=new Blob([`self.console={log:(...a)=>self.postMessage({t:'log',v:a.map(String).join(' ')})};try{new Function(${JSON.stringify(code)})();self.postMessage({t:'done'})}catch(e){self.postMessage({t:'err',v:e.stack||String(e)})}`],{type:'text/javascript'}),url=URL.createObjectURL(blob),w=new Worker(url),lines=[],done=false,t=setTimeout(function(){if(done)return;done=true;w.terminate();URL.revokeObjectURL(url);resolve({error:true,text:'Execution stopped after 2 seconds.'})},2000);w.onmessage=function(e){if(done)return;var d=e.data||{};if(d.t==='log')lines.push(d.v);if(d.t==='err'){done=true;clearTimeout(t);w.terminate();URL.revokeObjectURL(url);resolve({error:true,text:lines.concat([d.v]).join('\n')})}else if(d.t==='done'){done=true;clearTimeout(t);w.terminate();URL.revokeObjectURL(url);resolve({error:false,text:lines.join('\n')})}}})}
async function getSql(){if(sqlInstance)return sqlInstance;if(!sqlPromise){sqlPromise=(async function(){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js',function(){return typeof window.initSqlJs==='function'});var SQL=await window.initSqlJs({locateFile:function(f){return'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/'+f}}),db=new SQL.Database();db.run("CREATE TABLE Customers (customer_id INTEGER, name TEXT, age INTEGER, country TEXT); INSERT INTO Customers VALUES (1,'Ada',31,'UAE'),(2,'Linus',22,'USA'),(3,'Grace',28,'UK'),(4,'Alan',25,'UAE'); CREATE TABLE Orders (order_id INTEGER, item TEXT, amount INTEGER, customer_id INTEGER); INSERT INTO Orders VALUES (1,'Keyboard',400,1),(2,'Mouse',300,1),(3,'Monitor',1200,3),(4,'Keyboard',400,4);");sqlInstance=db;return db})()}return sqlPromise}
async function runSQL(code){try{var db=await getSql(),r=db.exec(code);if(!r.length)return{error:false,text:'Query ran successfully. 0 result rows.'};var cols=r[0].columns,rows=r[0].values.slice(0,30),out=[cols.join(' | '),cols.map(function(){return'---'}).join(' | ')];rows.forEach(function(row){out.push(row.map(function(v){return v===null?'NULL':String(v)}).join(' | '))});return{error:false,text:out.join('\n')}}catch(e){return{error:true,text:e.message||String(e)}}}

function explainLine(line,lang){var s=line.trim();if(!s)return'Blank line: separates logical parts of the example.';if(/^#|^\/\//.test(s))return'Comment: explains the intention of the code without executing anything.';if(lang==='python'){
 if(/^def\s+/.test(s))return'Defines a reusable function and names its inputs.';
 if(/^class\s+/.test(s))return'Defines a class, which groups data and behavior into one type.';
 if(/^for\s+/.test(s))return'Starts a loop that repeats the indented block for each item in the sequence.';
 if(/^while\s+/.test(s))return'Starts a loop that continues while its condition remains true.';
 if(/^if\s+/.test(s))return'Checks a condition; the indented block runs only when that condition is true.';
 if(/^elif\s+/.test(s))return'Checks another condition only if the earlier condition was false.';
 if(/^else\s*:/.test(s))return'Handles the remaining case when the earlier conditions were false.';
 if(/^return\b/.test(s))return'Returns a value to the caller and ends the current function call.';
 if(/\.append\(/.test(s))return'Adds one new value to the end of a list.';
 if(/^print\s*\(/.test(s))return'Prints a value so you can observe the program output.';
 if(/^from\s+|^import\s+/.test(s))return'Loads code from a module so it can be used in this example.';
 if(/^[A-Za-z_]\w*\s*=/.test(s))return'Assigns a value to a variable so later lines can reuse or change it.';
 }
 if(lang==='javascript'){
  if(/^function\s+|=>/.test(s))return'Defines reusable JavaScript behavior.';
  if(/^if\s*\(/.test(s))return'Checks a condition before running the following block.';
  if(/^for\s*\(/.test(s)||/^for\s+/.test(s))return'Repeats a block of code while moving through values.';
  if(/console\.log/.test(s))return'Writes a value to the output console.';
  if(/^(const|let)\s+/.test(s))return'Creates a variable; const prevents reassignment while let allows it.';
 }
 if(lang==='sql'){
  if(/^SELECT\b/i.test(s))return'Selects the columns or expressions that should appear in the result.';
  if(/^FROM\b/i.test(s))return'Chooses the table that supplies the starting rows.';
  if(/^WHERE\b/i.test(s))return'Filters out rows that do not satisfy the condition.';
  if(/^JOIN\b|^INNER JOIN\b|^LEFT JOIN\b/i.test(s))return'Combines related rows from another table.';
  if(/^GROUP BY\b/i.test(s))return'Groups rows so aggregate calculations can be performed per group.';
  if(/^ORDER BY\b/i.test(s))return'Sorts the result rows by one or more expressions.';
 }
 return'This line performs the next operation in the example: '+s;
}
function explanation(code,lang){return String(code||'').split(/\r?\n/).map(function(line,i){return'<li><code>'+esc(line||' ')+'</code><br>'+esc(explainLine(line,lang))+'</li>'}).join('')}

function variantCode(code,number){var out=String(code||'');if(number===1){
 var list=out.match(/\[(\s*-?\d+(?:\s*,\s*-?\d+){1,})\]/);if(list){var vals=list[1].split(',').map(function(x){return Number(x.trim())});var changed=vals.map(function(v,i){return v+(i+1)*5});return out.replace(list[0],'['+changed.join(', ')+']')}
 var n=out.match(/\b(\d{1,3})\b/);if(n)return out.slice(0,n.index)+String(Number(n[1])+3)+out.slice(n.index+n[1].length);
 var str=out.match(/(['"])([A-Za-z][^'"\n]{0,20})\1/);if(str)return out.replace(str[0],str[1]+str[2]+' example'+str[1]);
 }
 if(number===2){
 var n2=out.match(/\b(\d{1,3})\b/);if(n2)return out.slice(0,n2.index)+String(Math.max(0,Number(n2[1])-1))+out.slice(n2.index+n2[1].length);
 }
 return out;
}

function makeCodeExample(code,lang,label,index){var run=runnable(lang,code);return'<article class="evergreen-example" data-evergreen-example data-lang="'+esc(lang)+'"><div class="evergreen-example-head"><b>'+esc(label)+'</b><span>'+esc(langLabel(lang))+'</span></div><textarea class="evergreen-editor" spellcheck="false" data-evergreen-code>'+esc(code)+'</textarea><div class="evergreen-toolbar">'+(run?'<button type="button" class="evergreen-btn primary" data-evergreen-run>▶ Run</button>':'<button type="button" class="evergreen-btn primary" data-evergreen-walk>▶ Show walkthrough</button>')+'<input class="evergreen-predict" data-evergreen-predict placeholder="Predict the output before you run"><button type="button" class="evergreen-btn" data-evergreen-explain>Explain step by step</button><button type="button" class="evergreen-btn" data-evergreen-reset>Reset</button></div><div class="evergreen-output" data-evergreen-output>Ready.</div><div class="evergreen-explain" data-evergreen-explanation><b>Step-by-step explanation</b><ol>'+explanation(code,lang)+'</ol></div></article>'}
function makeScenario(label,text,concept){return'<article class="evergreen-example"><div class="evergreen-example-head"><b>'+esc(label)+'</b><span>Worked scenario</span></div><div class="evergreen-scenario"><p><b>'+esc(concept||'Apply the concept')+'</b></p><p>'+esc(text||'Explain what is happening, what information goes in, and what result should come out.')+'</p><button type="button" class="evergreen-btn primary" data-evergreen-walk>▶ Show walkthrough</button></div><div class="evergreen-output" data-evergreen-output>Think through the scenario first, then reveal the walkthrough.</div></article>'}

function buildLab(lesson,index){var body=bodyOf(lesson);if(!body||body.querySelector('[data-evergreen-lab]'))return;var lid=lessonId(lesson,index),title=titleOf(lesson),concepts=conceptsOf(body),blocks=codeBlocks(body),deep=deepText(body,'Deeper explanation'),scenario=deepText(body,'Worked scenario'),why=deepText(body,'Why this matters');var examples=[];
 var base=blocks.map(function(pre){return{code:pre.textContent||'',lang:inferLanguage(pre.textContent||'')}}).find(function(x){return runnable(x.lang,x.code)});
 if(base){examples.push(makeCodeExample(base.code,base.lang,'Example 1 — Guided example',0));examples.push(makeCodeExample(variantCode(base.code,1),base.lang,'Example 2 — Same concept, different input',1));examples.push(makeCodeExample(variantCode(base.code,2),base.lang,'Example 3 — Change an edge value',2));}
 else {var conceptText=concepts.length?concepts:['the main idea'];examples.push(makeScenario('Example 1 — Recognize it',deep||scenario,conceptText[0]));examples.push(makeScenario('Example 2 — Apply it',scenario||why,conceptText[1]||conceptText[0]));examples.push(makeScenario('Example 3 — Explain it yourself',why||deep,conceptText[2]||conceptText[0]));}
 var state=read(),saved=(((state[courseId]||{})[lid])||{}),due=saved.nextReview?new Date(saved.nextReview):null;var lab=document.createElement('section');lab.className='evergreen-lab';lab.setAttribute('data-evergreen-lab','');lab.setAttribute('data-evergreen-lesson',lid);lab.innerHTML='<div class="evergreen-titlebar"><div><h3>🌱 Evergreen Mastery Lab</h3><p>Learn it, run it, explain it, then review it later.</p></div><span class="evergreen-badge">3-example minimum</span></div>'+(concepts.length?'<div class="evergreen-concepts">'+concepts.map(function(c){return'<span class="evergreen-concept">'+esc(c)+'</span>'}).join('')+'</div>':'')+'<div class="evergreen-examples">'+examples.join('')+'</div><div class="evergreen-master"><div class="evergreen-master-row"><strong>How well do you know this lesson?</strong><button type="button" class="evergreen-btn" data-mastery="again">Need review</button><button type="button" class="evergreen-btn" data-mastery="good">Getting it</button><button type="button" class="evergreen-btn" data-mastery="easy">Confident</button></div><div class="evergreen-review" data-review-status>'+(due?'Next review: '+due.toLocaleDateString():'Choose a mastery level to schedule a review.')+'</div></div>';
 body.appendChild(lab);bindLab(lab,title);
}

async function execute(lang,code,out){if(lang==='python'){var r=await runPython(code);out.innerHTML='<span class="'+(r.error?'bad':'ok')+'">'+(r.error?'Run error':'Output')+'</span>\n'+esc(r.text||'(no printed output)');return}if(lang==='javascript'){var j=await runJS(code);out.innerHTML='<span class="'+(j.error?'bad':'ok')+'">'+(j.error?'Run error':'Output')+'</span>\n'+esc(j.text||'(no console output)');return}if(lang==='sql'){var q=await runSQL(code);out.innerHTML='<span class="'+(q.error?'bad':'ok')+'">'+(q.error?'SQL error':'Output')+'</span>\n'+esc(q.text);return}if(lang==='html'){out.innerHTML='';var f=document.createElement('iframe');f.setAttribute('sandbox','allow-scripts');f.style.cssText='width:100%;height:220px;border:0;background:#fff';f.srcdoc=code;out.appendChild(f);return}out.textContent='This is a conceptual walkthrough rather than executable browser code.'}
function bindLab(lab,title){lab.addEventListener('click',async function(e){var card=e.target.closest('[data-evergreen-example]')||e.target.closest('.evergreen-example'),out=card&&card.querySelector('[data-evergreen-output]');if(e.target.closest('[data-evergreen-run]')){var btn=e.target.closest('[data-evergreen-run]'),code=card.querySelector('[data-evergreen-code]').value,lang=card.getAttribute('data-lang');btn.disabled=true;out.textContent=lang==='python'?'Loading Python runner…':'Running…';try{await execute(lang,code,out);var pred=card.querySelector('[data-evergreen-predict]');if(pred&&pred.value.trim())out.innerHTML+='\n\nPrediction: '+esc(pred.value.trim())}catch(err){out.innerHTML='<span class="bad">Runner error</span>\n'+esc(err.message||String(err))}finally{btn.disabled=false}return}
 if(e.target.closest('[data-evergreen-walk]')){var body=lab.closest('.body'),deep=deepText(body,'Deeper explanation'),scenario=deepText(body,'Worked scenario');out.textContent=(scenario||deep||'Explain the inputs, the transformation, and the result in your own words.');return}
 if(e.target.closest('[data-evergreen-explain]')){var ex=card.querySelector('[data-evergreen-explanation]');if(ex)ex.classList.toggle('open');return}
 if(e.target.closest('[data-evergreen-reset]')){var ta=card.querySelector('[data-evergreen-code]');if(ta)ta.value=ta.defaultValue;out.textContent='Reset.';return}
 var mastery=e.target.closest('[data-mastery]');if(mastery){var level=mastery.getAttribute('data-mastery'),days=level==='again'?1:level==='good'?3:7,lid=lab.getAttribute('data-evergreen-lesson'),state=read();state[courseId]=state[courseId]||{};state[courseId][lid]={level:level,lastReviewed:new Date().toISOString(),nextReview:new Date(Date.now()+days*86400000).toISOString(),title:title};save(state);lab.querySelector('[data-review-status]').textContent='Next review: '+new Date(state[courseId][lid].nextReview).toLocaleDateString()+' · '+(level==='again'?'We will bring this back soon.':level==='good'?'Review again after a short gap.':'Longer review interval because you feel confident.');updateCourseStatus();}}
 )}
function updateCourseStatus(){var state=read(),course=state[courseId]||{},now=Date.now(),due=Object.keys(course).filter(function(k){var x=course[k];return x&&x.nextReview&&new Date(x.nextReview).getTime()<=now}).length,hero=document.querySelector('.hero');if(!hero)return;var badge=hero.querySelector('[data-evergreen-course-status]');if(!badge){badge=document.createElement('div');badge.className='evergreen-course-status';badge.setAttribute('data-evergreen-course-status','');hero.appendChild(badge)}badge.textContent=due?('🌱 '+due+' lesson'+(due===1?'':'s')+' due for review'):'🌱 Evergreen review active'}
function run(){addStyle();Array.from(document.querySelectorAll('.lesson')).forEach(buildLab);updateCourseStatus()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();setTimeout(run,450);
})();
