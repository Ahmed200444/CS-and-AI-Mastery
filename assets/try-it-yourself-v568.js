(function(){
'use strict';
if(window.CSAITryItYourself)return;
var VERSION='5.68';
var ownerSeq=0;
var ROOT_SELECTOR='.csai-study-example,.lesson-run-card,.evergreen-example,.csai-lang-variant,.csai-example-card,.adaptive-panel,.oa-work,.oa-task,.project-card,[data-project-workspace],.wd-project,.wd-card,.cx-pm-card,.workspace,.editor-shell,.item[data-exercise],.item';
var RUN_SELECTOR='button[data-run-example],button[data-study-run],button[data-project-run],button[data-new-project-run],button[data-run],button[data-csai-oa-python-run],button[data-universal-run],button[data-run-language-example],button[data-adaptive-run],.adaptive-run';
var CODE_SELECTOR='pre.code,[data-csai-language-generated],.csai-language-code,textarea[data-project-editor],textarea[data-dual-editor],textarea.csai-code-editor,textarea.csai-study-code,textarea.adaptive-code,textarea.evergreen-editor,textarea.oa-editor[data-editor],textarea[data-evergreen-code],textarea[aria-label="Code editor" i],textarea[aria-label="SQL query editor" i],textarea[aria-label="HTML editor" i],textarea[aria-label="CSS editor" i],textarea[aria-label="JavaScript editor" i],textarea[aria-label="Git command" i],textarea.py[readonly],textarea.wd-edit,textarea.cx-pm-edit,textarea.cx-projfb-edit';
var PRACTICE_LANGS=new Set(['python','javascript','typescript','sql','cpp','c','java','html','css','shell','dockerfile','yaml','json']);

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]});}
function addStyle(){
 if(document.getElementById('csai-try-it-yourself-style'))return;
 var s=document.createElement('style');s.id='csai-try-it-yourself-style';s.textContent=`
 .csai-try-panel{margin:12px 14px 14px;border:1px solid color-mix(in srgb,var(--border,#33475b) 92%,#5aa7d9);border-radius:12px;background:color-mix(in srgb,var(--panel,#172431) 96%,var(--bg,#0c1420));overflow:hidden;color:var(--text,#eef4f8)}
 .csai-try-panel>summary{display:flex;align-items:center;gap:10px;min-height:44px;padding:10px 13px;cursor:pointer;list-style:none;font:800 13px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;user-select:none}
 .csai-try-panel>summary::-webkit-details-marker{display:none}.csai-try-panel>summary:before{content:"▸";font-size:12px;color:#66b5e8;transition:transform .12s ease}.csai-try-panel[open]>summary:before{transform:rotate(90deg)}
 .csai-try-sub{margin-left:auto;color:var(--muted,#9eb0c2);font-weight:700;font-size:11px}.csai-try-body{padding:0 12px 12px;border-top:1px solid var(--border,#33475b)}
 .csai-try-note{margin:10px 0 8px;color:var(--muted,#aebdca);font:650 12px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
 .csai-try-editor{display:block;width:100%;min-height:180px;box-sizing:border-box;resize:vertical;border:1px solid #2d4054;border-radius:9px;background:#09121e;color:#edf5fb;padding:13px 14px;outline:none;tab-size:4;font:500 14px/1.55 ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace;white-space:pre;overflow:auto}
 .csai-try-editor:focus{border-color:#4ba5dc;box-shadow:0 0 0 2px rgba(75,165,220,.12)}
 .csai-try-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:9px}.csai-try-btn{border:1px solid var(--border,#33475b);border-radius:9px;background:#172637;color:var(--text,#eef4f8);padding:8px 12px;font:800 12px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}.csai-try-btn.run{background:#1676b5;border-color:#1676b5;color:#fff}.csai-try-btn:disabled{opacity:.65;cursor:wait}
 .csai-try-output{display:none;margin:9px 0 0;min-height:42px;padding:11px 12px;border:1px solid #26394d;border-radius:9px;background:#0a131e;color:#eaf3fa;white-space:pre-wrap;overflow-wrap:anywhere;font:500 13px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.csai-try-output.has-output{display:block}.csai-try-output .ok{color:#52d69a;font-weight:800}.csai-try-output .bad{color:#ff8e9a;font-weight:800}
 .csai-try-preview{width:100%;min-height:210px;border:0;background:white;border-radius:6px}
 @media(max-width:700px){.csai-try-panel{margin-left:8px;margin-right:8px}.csai-try-editor{min-height:160px;font-size:13px}}
 `;document.head.appendChild(s);
}
function textOf(node){return node&&('value' in node)?String(node.value||''):String(node&&node.textContent||'');}
function normalizeLang(v){v=String(v||'').toLowerCase().trim();if(/^(py|python)$/.test(v))return'python';if(/^(js|javascript|node|nodejs)$/.test(v))return'javascript';if(/^(ts|typescript)$/.test(v))return'typescript';if(/^(c\+\+|cpp)$/.test(v))return'cpp';if(v==='c')return'c';if(v==='java')return'java';if(/^(sql|sqlite|postgres|postgresql|mysql)$/.test(v))return'sql';if(/^(html|htm)$/.test(v))return'html';if(v==='css')return'css';if(/^(sh|shell|bash|zsh|powershell|terminal)$/.test(v))return'shell';if(/dockerfile|docker/.test(v))return'dockerfile';if(/^(yaml|yml)$/.test(v))return'yaml';if(v==='json')return'json';return v||'text';}
function label(lang){return{python:'Python',javascript:'JavaScript',typescript:'TypeScript',cpp:'C++',c:'C',java:'Java',sql:'SQL',html:'HTML',css:'CSS',shell:'Shell',dockerfile:'Dockerfile',yaml:'YAML',json:'JSON'}[lang]||lang;}
function explicitLanguage(node,root){
 var bits=[];if(node&&node.dataset){bits.push(node.dataset.language,node.dataset.lang)}
 if(root){var langEl=root.querySelector('[data-project-lang],.lesson-run-lang,.csai-study-kind,[data-lang-variant]');if(langEl)bits.push(langEl.value,langEl.textContent,langEl.getAttribute&&langEl.getAttribute('data-lang-variant'));bits.push(root.getAttribute&&root.getAttribute('data-language'),root.getAttribute&&root.getAttribute('data-adaptive-lang'));}
 return bits.filter(Boolean).join(' ');
}
function inferLanguage(node,root){
 var code=textOf(node),hint=explicitLanguage(node,root);
 if(window.CSAILineExplainer&&typeof window.CSAILineExplainer.inferLanguage==='function'){
  try{return normalizeLang(window.CSAILineExplainer.inferLanguage(code,hint,node));}catch(_){}
 }
 var h=String(hint||'').toLowerCase();if(/c\+\+|cpp/.test(h))return'cpp';if(/python|\bpy\b/.test(h))return'python';if(/javascript|\bjs\b/.test(h))return'javascript';if(/typescript|\bts\b/.test(h))return'typescript';if(/sql/.test(h))return'sql';if(/html/.test(h))return'html';if(/css/.test(h))return'css';if(/shell|bash|terminal/.test(h))return'shell';
 if(/(^|\n)\s*(def\s+|class\s+|import\s+|from\s+\S+\s+import\s+|print\s*\(|for\s+\w+\s+in\s+|while\s+|if\s+.+:)/m.test(code))return'python';if(/#include\s*</.test(code)||/std::|cout\s*<</.test(code))return'cpp';if(/\b(console\.log|const\s+|let\s+|function\s+|=>)/.test(code))return'javascript';if(/\bSELECT\b|\bCREATE\s+TABLE\b/i.test(code))return'sql';if(/^\s*</.test(code))return'html';return'text';
}
function isWritten(node){if(!node||!node.matches)return false;if(node.matches('.oa-answer,[aria-label*="reasoning" i],[aria-label*="answer notes" i],[aria-label*="interview answer" i],[placeholder*="own words" i],[placeholder*="write your answer" i]'))return true;return false;}
function isCandidate(node){
 if(!node||!node.matches||node.matches('[data-csai-try-editor]')||isWritten(node))return false;
 if(window.CSAILineExplainer&&typeof window.CSAILineExplainer.isCodeWorkspace==='function'){try{if(window.CSAILineExplainer.isCodeWorkspace(node))return true;}catch(_){}}
 return node.matches(CODE_SELECTOR);
}
function rootFor(node){return node.closest(ROOT_SELECTOR)||node.parentElement;}
function hasOriginalRunner(root){return !!(root&&root.querySelector(RUN_SELECTOR));}
function uniqueRootOwner(root,node){
 var existing=root.querySelector(':scope > [data-csai-try-panel],:scope > .project-workspace > [data-csai-try-panel]');if(existing)return existing;
 var id=node.getAttribute('data-csai-try-owner');if(!id){id='try-'+(++ownerSeq);node.setAttribute('data-csai-try-owner',id);}return id;
}
function panelFor(node,root,lang){
 var p=document.createElement('details');p.className='csai-try-panel';p.setAttribute('data-csai-try-panel','1');p.dataset.language=lang;p.dataset.owner=node.getAttribute('data-csai-try-owner')||'';
 p.innerHTML='<summary><span>Try it yourself</span><span class="csai-try-sub">Blank '+esc(label(lang))+' editor</span></summary><div class="csai-try-body" data-csai-try-body></div>';
 p.addEventListener('toggle',function(){if(p.open)materialize(p,node,root,lang);});
 return p;
}
function insertPanel(node,root,panel){
 if(root.matches('.project-card')){var workspace=root.querySelector('.project-workspace');if(workspace){workspace.appendChild(panel);return;}}
 root.appendChild(panel);
}
function materialize(panel,node,root,lang){
 if(panel.dataset.materialized==='1')return;panel.dataset.materialized='1';var body=panel.querySelector('[data-csai-try-body]');
 body.innerHTML='<p class="csai-try-note">Write your own version from scratch, then run it here. The original example above will not change.</p><textarea class="csai-try-editor" data-csai-try-editor spellcheck="false" aria-label="Try it yourself '+esc(label(lang))+' editor" placeholder="Write your own '+esc(label(lang))+' code here..."></textarea><div class="csai-try-toolbar"><button type="button" class="csai-try-btn run" data-csai-try-run>▶ Run my code</button><button type="button" class="csai-try-btn" data-csai-try-clear>Clear</button></div><div class="csai-try-output" data-csai-try-output></div>';
 var editor=body.querySelector('[data-csai-try-editor]');editor.dataset.language=lang;
 editor.addEventListener('keydown',function(e){if(e.key==='Tab'){e.preventDefault();var a=editor.selectionStart,b=editor.selectionEnd,v=editor.value;editor.value=v.slice(0,a)+'    '+v.slice(b);editor.selectionStart=editor.selectionEnd=a+4;}if(e.key==='Enter'){var a2=editor.selectionStart,v2=editor.value,line=v2.slice(0,a2).split('\n').pop()||'',indent=(line.match(/^\s*/)||[''])[0],extra=(lang==='python'&&/:\s*$/.test(line))?'    ':'';if(indent||extra){e.preventDefault();var ins='\n'+indent+extra;editor.value=v2.slice(0,a2)+ins+v2.slice(editor.selectionEnd);editor.selectionStart=editor.selectionEnd=a2+ins.length;}}});
 body.querySelector('[data-csai-try-clear]').addEventListener('click',function(){editor.value='';var out=body.querySelector('[data-csai-try-output]');out.textContent='';out.classList.remove('has-output');editor.focus();});
 body.querySelector('[data-csai-try-run]').addEventListener('click',function(){runPractice(this,editor,body.querySelector('[data-csai-try-output]'),lang);});
}
function show(out,html){out.classList.add('has-output');out.innerHTML=html;}
function showText(out,text){out.classList.add('has-output');out.textContent=text;}
function waitFor(name,method,ms){ms=ms||2200;return new Promise(function(resolve){var start=performance.now();(function check(){var api=window[name];if(api&&typeof api[method]==='function')return resolve(api);if(performance.now()-start>ms)return resolve(null);setTimeout(check,50);})();});}
async function runPractice(button,editor,out,lang){
 var code=String(editor.value||'');if(!code.trim()){showText(out,'Write your code first.');return;}button.disabled=true;button.textContent='Running…';showText(out,'Running…');
 try{
  if(lang==='python'){
   var py=await waitFor('CSAIPythonRunner','runSource');if(!py)throw new Error('Python runner is still loading. Try again in a moment.');var r=await py.runSource(code,{trigger:button,outputElement:out});if(out.querySelector('.csai-inline-terminal'))return;show(out,'<span class="'+(r.error?'bad':'ok')+'">'+(r.error?'Run error':'Run complete ✓')+'</span>\n'+esc(r.text||'(no printed output)')+(r.milliseconds!=null?'\n\nPython run: '+esc(r.milliseconds)+' ms':''));return;
  }
  if(lang==='javascript'||lang==='typescript'){
   var js=await waitFor('CSAIJSRunner','runSource');if(!js)throw new Error('JavaScript runner is still loading.');var j=await js.runSource(code);show(out,'<span class="'+(j.error?'bad':'ok')+'">'+(j.error?'Run error':'Run complete ✓')+'</span>\n'+esc(j.text||'(no console output)'));return;
  }
  if(lang==='sql'){
   var sql=await waitFor('CSAISQLRunner','runSource');if(!sql)throw new Error('SQL runner is still loading.');var q=await sql.runSource(code);show(out,'<span class="'+(q.error?'bad':'ok')+'">'+(q.error?'SQL error':'Query complete ✓')+'</span>\n'+esc(q.text||'(no result rows)'));return;
  }
  if(lang==='cpp'){
   var cpp=await waitFor('CSAICppRunner','runSource',3500);if(!cpp)throw new Error('C++ runner is still loading.');var c=await cpp.runSource(code);show(out,'<span class="'+(c.error?'bad':'ok')+'">'+(c.error?'C++ error':'Run complete ✓')+'</span>\n'+esc(c.text||'(no output)'));return;
  }
  if(lang==='html'){
   out.classList.add('has-output');out.innerHTML='';var f=document.createElement('iframe');f.className='csai-try-preview';f.setAttribute('sandbox','allow-scripts');f.srcdoc=code;out.appendChild(f);return;
  }
  if(lang==='css'){
   out.classList.add('has-output');out.innerHTML='';var fc=document.createElement('iframe');fc.className='csai-try-preview';fc.setAttribute('sandbox','allow-scripts');fc.srcdoc='<!doctype html><html><head><style>'+code+'</style></head><body><div class="demo"><h2>CSS preview</h2><p>Style this sample content with your CSS.</p><button>Button</button></div></body></html>';out.appendChild(fc);return;
  }
  if(lang==='json'){
   try{var obj=JSON.parse(code);show(out,'<span class="ok">Valid JSON ✓</span>\n'+esc(JSON.stringify(obj,null,2)));}catch(e){show(out,'<span class="bad">JSON error</span>\n'+esc(e.message||String(e)));}return;
  }
  if(lang==='yaml'||lang==='dockerfile'||lang==='shell'||lang==='c'||lang==='java'){
   show(out,'<span class="ok">Practice saved in the editor.</span>\nThis browser lesson cannot safely execute '+esc(label(lang))+' directly here. Compare your code with the original example and use the course runner when one is available.');return;
  }
  showText(out,'This example is reference material rather than browser-executable code.');
 }catch(error){show(out,'<span class="bad">Runner error</span>\n'+esc(error.message||String(error)));}
 finally{button.disabled=false;button.textContent='▶ Run my code';}
}
function enhanceNode(node){
 if(!isCandidate(node)||node.closest('[data-csai-try-panel]'))return;var root=rootFor(node);if(!root||!hasOriginalRunner(root))return;
 if(root.querySelector('[data-csai-try-panel]'))return;var lang=inferLanguage(node,root);if(!PRACTICE_LANGS.has(lang))return;
 var owner=uniqueRootOwner(root,node);if(owner&&owner.nodeType===1)return;var panel=panelFor(node,root,lang);insertPanel(node,root,panel);root.setAttribute('data-csai-try-ready','1');
}
function targetNodes(root){root=root||document;var out=[],seen=new Set();if(root.nodeType===1&&isCandidate(root))out.push(root);if(window.CSAILineExplainer&&typeof window.CSAILineExplainer.targetNodes==='function'){try{out=out.concat(window.CSAILineExplainer.targetNodes(root));}catch(_){}}else if(root.querySelectorAll)out=out.concat(Array.from(root.querySelectorAll(CODE_SELECTOR)));return out.filter(function(n){if(!n||seen.has(n)||!isCandidate(n))return false;seen.add(n);return true;});}
function enhance(root){targetNodes(root).forEach(enhanceNode);}
function openScopes(){
 document.querySelectorAll('.lesson[open]').forEach(enhance);
 document.querySelectorAll('.project-card,.oa-task,[data-project-workspace]').forEach(enhance);
}
function boot(){addStyle();openScopes();document.addEventListener('toggle',function(e){var d=e.target;if(d&&d.matches&&d.matches('.lesson')&&d.open)enhance(d);},true);document.addEventListener('focusin',function(e){var n=e.target;if(n&&isCandidate(n))enhanceNode(n);},true);document.addEventListener('click',function(e){var n=e.target&&e.target.closest&&e.target.closest(CODE_SELECTOR);if(n)enhanceNode(n);},true);
 var pending=new Set(),timer=0;new MutationObserver(function(records){records.forEach(function(r){Array.from(r.addedNodes||[]).forEach(function(n){if(n&&n.nodeType===1&&!n.closest?.('[data-csai-try-panel]'))pending.add(n);});});if(!pending.size)return;clearTimeout(timer);timer=setTimeout(function(){var batch=Array.from(pending);pending.clear();batch.forEach(function(n){var lesson=n.closest&&n.closest('.lesson');if(!lesson||lesson.open)enhance(n);});},60);}).observe(document.documentElement,{childList:true,subtree:true});
}
window.CSAITryItYourself={version:VERSION,enhance:enhance,inferLanguage:inferLanguage};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
