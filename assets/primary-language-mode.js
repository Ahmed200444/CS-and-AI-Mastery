(function(){
'use strict';

var MODE_KEY_PREFIX='csai-course-language-v2:';
var MODES={python:'Python',cpp:'C++',dual:'Dual'};
var FLEXIBLE_IDS=['dsa','problem-solving','oop','algorithms','data-structures'];
var editorState=new WeakMap();
var lessonState=new WeakMap();

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function meta(){try{var n=document.getElementById('course-page-meta');return n?JSON.parse(n.textContent||'{}'):{};}catch(e){return{}}}
function courseId(){var m=meta();return String(m.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'').toLowerCase()}
function courseTitle(){var m=meta();return String(m.title||document.querySelector('.hero h1')&&document.querySelector('.hero h1').textContent||'').toLowerCase()}
function isCoursePage(){return !!document.getElementById('course-page-meta')}
function isFlexibleCourse(){
 var id=courseId(),title=courseTitle();
 if(/python|javascript|typescript|sql|html|css|react|node|java\b|c\+\+/.test(id+' '+title))return false;
 return FLEXIBLE_IDS.some(function(x){return id===x||id.indexOf(x)>=0})||/data structures|algorithms|problem solving|object[ -]oriented/.test(title);
}
function modeKey(){return MODE_KEY_PREFIX+courseId()}
function readMode(){if(!isFlexibleCourse())return'python';try{var m=localStorage.getItem(modeKey());return MODES[m]?m:'python'}catch(e){return'python'}}
function saveMode(mode){if(!MODES[mode]||!isFlexibleCourse())return;try{localStorage.setItem(modeKey(),mode)}catch(e){}window.dispatchEvent(new CustomEvent('csai-language-mode-change',{detail:{mode:mode,courseId:courseId()}}))}
function slug(v){return String(v||'exercise').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'exercise'}
function looksCpp(code){return /#include\s*[<"]|\bstd::|\bcout\s*<<|\bcin\s*>>|\bvector\s*</.test(String(code||''))||/\bint\s+main\s*\(/.test(String(code||''))}
function looksPython(code){code=String(code||'');return /(^|\n)\s*(def |class |from |import |for\s+\w+\s+in\s+|while\s+.+:|if\s+.+:|elif\s+.+:|print\s*\()/.test(code)||/\brange\s*\(|\blen\s*\(/.test(code)}
function addStyle(){
 if(document.getElementById('csai-language-mode-style'))return;
 var s=document.createElement('style');s.id='csai-language-mode-style';s.textContent=`
 [data-evergreen-predict]{display:none!important}
 .course-lang-mode{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px}.course-lang-mode-label{font-size:.76rem;font-weight:850;color:var(--muted)}.lang-mode-btn{border:1px solid var(--border);border-radius:9px;background:var(--panel);color:var(--text);padding:7px 11px;font:850 12px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}.lang-mode-btn.active{background:#17649a;color:#fff;border-color:#17649a}
 .csai-cpp-note{margin:10px 0;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--panel);color:var(--muted);font-size:.8rem;line-height:1.5}.csai-cpp-note strong{color:var(--text)}
 .csai-dual-pane{margin:10px;border:1px solid var(--border);border-radius:11px;overflow:hidden}.csai-dual-head{padding:8px 11px;background:var(--panel);border-bottom:1px solid var(--border);font-weight:850;font-size:.78rem}.csai-dual-editor{display:block;width:100%;min-height:180px;resize:vertical;border:0;outline:0;padding:14px;background:#0d1520;color:#e8eef6;font:500 14px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;tab-size:4}
 .cpp-companion{margin-top:16px;border:1px solid var(--border);border-radius:14px;overflow:hidden;background:var(--panel)}.cpp-head{padding:13px 15px;border-bottom:1px solid var(--border)}.cpp-head h4{margin:0;font-size:1rem}.cpp-head p{margin:5px 0 0;color:var(--muted);font-size:.82rem}.cpp-tabs{display:flex;gap:7px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid var(--border)}.cpp-tab{border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);padding:7px 10px;font:800 12px/1.2 inherit;cursor:pointer}.cpp-tab.active{background:#17649a;color:#fff;border-color:#17649a}.cpp-option{display:none;padding:14px}.cpp-option.active{display:block}.cpp-code{margin:0;white-space:pre;overflow:auto;border:1px solid var(--border);border-radius:10px;background:#0b111b;color:#f4f7fb;padding:13px;font:500 13px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace}.cpp-deep{display:grid;gap:9px;margin-top:12px}.cpp-step{border:1px solid var(--border);border-radius:9px;padding:10px 11px;background:var(--bg);line-height:1.6;font-size:.84rem}.cpp-trace{width:100%;border-collapse:collapse;margin-top:8px;font-size:.8rem}.cpp-trace th,.cpp-trace td{border:1px solid var(--border);padding:6px 7px;text-align:left}.cpp-trace th{background:var(--panel)}
 .csai-hidden-python-example{display:none!important}
 @media(max-width:720px){.cpp-tabs{display:grid;grid-template-columns:1fr}.course-lang-mode .lang-mode-btn{flex:1}.csai-dual-editor{min-height:150px}}
 `;document.head.appendChild(s)
}
function removePredict(){document.querySelectorAll('[data-evergreen-predict]').forEach(function(n){n.remove()})}
function modeButtons(mode){return Object.keys(MODES).map(function(k){return'<button type="button" class="lang-mode-btn '+(mode===k?'active':'')+'" data-lang-mode="'+k+'">'+MODES[k]+'</button>'}).join('')}
function renderSelector(){
 if(!isCoursePage())return;
 var old=document.querySelector('[data-course-language-mode]');
 if(!isFlexibleCourse()){if(old)old.remove();return}
 var hero=document.querySelector('.hero');if(!hero)return;
 var wrap=old;if(!wrap){wrap=document.createElement('div');wrap.className='course-lang-mode';wrap.setAttribute('data-course-language-mode','');var progress=hero.querySelector('[data-progress-status]');if(progress)progress.insertAdjacentElement('afterend',wrap);else hero.appendChild(wrap)}
 wrap.innerHTML='<span class="course-lang-mode-label">Coding language:</span>'+modeButtons(readMode())
}

function cppStarter(task){
 var title=String(task.getAttribute('data-title')||task.querySelector('h3')&&task.querySelector('h3').textContent||'Exercise').trim();
 var prompt=String(task.querySelector('.oa-prompt p')&&task.querySelector('.oa-prompt p').textContent||'').trim().replace(/\s+/g,' ');
 var loop=/loop|iterate|array|vector|list|travers/.test((title+' '+prompt).toLowerCase());
 return '#include <iostream>\n#include <vector>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\n// '+title.replace(/\n/g,' ')+'\n// '+(prompt||'Solve the exercise using C++.').slice(0,180).replace(/\n/g,' ')+'\n\nint main() {\n'+(loop?'    vector<int> nums = {10, 20, 30, 40};\n\n    // Normal beginner for loop:\n    for (int i = 0; i < nums.size(); i++) {\n        cout << nums[i] << endl;\n    }\n':'    // Write your C++ solution here.\n')+'\n    return 0;\n}\n';
}
function taskKey(task){return String(task.getAttribute('data-task')||slug(task.getAttribute('data-title')||'exercise'))}
function draftKey(task,lang){return'csai-language-draft-v2:'+courseId()+':'+taskKey(task)+':'+lang}
function loadDraft(task,lang){try{return localStorage.getItem(draftKey(task,lang))||''}catch(e){return''}}
function saveDraft(task,lang,value){try{localStorage.setItem(draftKey(task,lang),String(value||''))}catch(e){}}
function ensureLangOption(task,lang){
 var select=task.querySelector('[data-lang]');
 if(select){if(!Array.from(select.options).some(function(o){return o.value===lang})){var opt=document.createElement('option');opt.value=lang;opt.textContent=lang==='cpp'?'C++':MODES[lang]||lang;select.appendChild(opt)}select.value=lang;return}
 var bar=task.querySelector('.oa-editorbar');if(!bar)return;Array.from(bar.children).forEach(function(ch){if(ch.tagName==='SPAN'&&!ch.hasAttribute('data-file-label')&&!ch.hasAttribute('data-flex-active-lang')&&/^Python$/i.test(ch.textContent.trim()))ch.style.display='none'});var badge=bar.querySelector('[data-flex-active-lang]');if(!badge){badge=document.createElement('span');badge.setAttribute('data-flex-active-lang','');bar.appendChild(badge)}badge.textContent=lang==='cpp'?'C++':'Python';
}
function ensureEditorState(task){
 var editor=task.querySelector('textarea[data-editor]:not(.oa-answer)');if(!editor)return null;
 var state=editorState.get(editor);if(state)return state;
 var current=String(editor.value||'');var savedPy=loadDraft(task,'python'),savedCpp=loadDraft(task,'cpp');
 state={active:looksCpp(current)?'cpp':'python',python:savedPy||(!looksCpp(current)?current:''),cpp:savedCpp||(looksCpp(current)?current:'')};
 if(!state.python)state.python='# Write your Python solution here\n';
 editorState.set(editor,state);return state
}
function updateFileLabel(task,lang){var label=task.querySelector('[data-file-label]');if(label)label.textContent=slug(task.getAttribute('data-title')||'exercise')+(lang==='cpp'?'.cpp':'.py')}
function removeDual(task){var pane=task.querySelector('[data-dual-cpp-pane]');if(pane)pane.remove()}
function makeDual(task,state){
 removeDual(task);var work=task.querySelector('.oa-work');if(!work)return;
 var pane=document.createElement('div');pane.className='csai-dual-pane';pane.setAttribute('data-dual-cpp-pane','');pane.innerHTML='<div class="csai-dual-head">C++</div><textarea class="csai-dual-editor" spellcheck="false" data-dual-cpp-editor></textarea>';var area=pane.querySelector('textarea');area.value=state.cpp||cppStarter(task);area.addEventListener('input',function(){state.cpp=area.value;saveDraft(task,'cpp',area.value)});work.appendChild(pane)
}
function applyTaskMode(task,mode){
 var editor=task.querySelector('textarea[data-editor]:not(.oa-answer)');if(!editor)return;var state=ensureEditorState(task);if(!state)return;
 if(state.active==='cpp'){state.cpp=editor.value;saveDraft(task,'cpp',state.cpp)}else if(state.active==='python'){state.python=editor.value;saveDraft(task,'python',state.python)}
 removeDual(task);
 if(mode==='cpp'){
   state.active='cpp';editor.value=state.cpp||cppStarter(task);task.setAttribute('data-csai-active-language','cpp');ensureLangOption(task,'cpp');updateFileLabel(task,'cpp');
 }else{
   state.active='python';editor.value=state.python||'# Write your Python solution here\n';task.setAttribute('data-csai-active-language',mode==='dual'?'dual':'python');ensureLangOption(task,'python');updateFileLabel(task,'python');if(mode==='dual')makeDual(task,state)
 }
 var out=task.querySelector('[data-output]');if(out)out.textContent=mode==='cpp'?'C++ workspace ready.':'Ready.';
}
function applyAssessmentMode(){if(!isFlexibleCourse())return;var mode=readMode();document.querySelectorAll('.assessment-stack .oa-task').forEach(function(task){applyTaskMode(task,mode)})}

function normalLoopCode(){return '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> nums = {10, 20, 30, 40};\n\n    for (int i = 0; i < nums.size(); i++) {\n        cout << nums[i] << endl;\n    }\n\n    return 0;\n}'}
function rangeLoopCode(){return '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> nums = {10, 20, 30, 40};\n\n    for (int value : nums) {\n        cout << value << endl;\n    }\n\n    return 0;\n}'}
function iteratorLoopCode(){return '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> nums = {10, 20, 30, 40};\n\n    for (auto it = nums.begin(); it != nums.end(); it++) {\n        cout << *it << endl;\n    }\n\n    return 0;\n}'}
function trace(){return'<table class="cpp-trace"><thead><tr><th>i</th><th>condition</th><th>nums[i]</th><th>then</th></tr></thead><tbody><tr><td>0</td><td>0 &lt; 4 → true</td><td>10</td><td>print 10, then i++</td></tr><tr><td>1</td><td>1 &lt; 4 → true</td><td>20</td><td>print 20, then i++</td></tr><tr><td>2</td><td>2 &lt; 4 → true</td><td>30</td><td>print 30, then i++</td></tr><tr><td>3</td><td>3 &lt; 4 → true</td><td>40</td><td>print 40, then i++</td></tr><tr><td>4</td><td>4 &lt; 4 → false</td><td>—</td><td>stop</td></tr></tbody></table>'}
function loopPanel(){return'<section class="cpp-companion" data-cpp-loop-panel><div class="cpp-head"><h4>C++ for loops — 3 possibilities</h4><p>The normal loop is shown first and explained in execution order.</p></div><div class="cpp-tabs"><button class="cpp-tab active" type="button" data-cpp-tab="normal">1. Normal for loop</button><button class="cpp-tab" type="button" data-cpp-tab="range">2. Range-based loop</button><button class="cpp-tab" type="button" data-cpp-tab="iterator">3. Iterator loop</button></div><div class="cpp-option active" data-cpp-option="normal"><pre class="cpp-code">'+esc(normalLoopCode())+'</pre><div class="cpp-deep"><div class="cpp-step"><b>Initialization — <code>int i = 0</code></b><br>This runs once. C++ creates the index variable and starts it at 0 because the first vector position is index 0.</div><div class="cpp-step"><b>Condition — <code>i &lt; nums.size()</code></b><br>This is checked before every iteration. The body runs only while the condition is true. Using <code>&lt;</code> prevents accessing an index past the end of the vector.</div><div class="cpp-step"><b>Body — <code>nums[i]</code></b><br>The current index selects the current element. When <code>i</code> is 0, <code>nums[i]</code> is 10; when <code>i</code> is 1, it is 20, and so on.</div><div class="cpp-step"><b>Update — <code>i++</code></b><br>This happens after the body. It is equivalent to <code>i = i + 1</code>, then control returns to the condition.</div><div class="cpp-step"><b>Trace it iteration by iteration</b><br>The exact order is initialize → check condition → body → update → check condition → body → update … until false.'+trace()+'</div></div></div><div class="cpp-option" data-cpp-option="range"><pre class="cpp-code">'+esc(rangeLoopCode())+'</pre><div class="cpp-deep"><div class="cpp-step"><b><code>int value : nums</code></b><br>Read it as “for each integer value in nums.” C++ moves through the container for you, so there is no visible index.</div><div class="cpp-step"><b>When to use it</b><br>Use it when you need each value but do not need the numeric index. <code>int value</code> copies the element; <code>int&amp; value</code> would refer to the real element.</div></div></div><div class="cpp-option" data-cpp-option="iterator"><pre class="cpp-code">'+esc(iteratorLoopCode())+'</pre><div class="cpp-deep"><div class="cpp-step"><b><code>auto it = nums.begin()</code></b><br>The iterator starts at the first element. <code>auto</code> lets C++ infer the iterator type.</div><div class="cpp-step"><b><code>it != nums.end()</code></b><br><code>end()</code> is the position just after the last element. Stop when the iterator reaches it.</div><div class="cpp-step"><b><code>it++</code> and <code>*it</code></b><br><code>it++</code> moves to the next position. <code>*it</code> dereferences the iterator to get the value at that position.</div><div class="cpp-step"><b>Iterator vs iterative</b><br><b>Iterative</b> describes repeated steps such as a loop. An <b>iterator</b> is an object used to move through a container. They are different ideas.</div></div></div></section>'}
function lessonHasLoop(lesson){var text=String(lesson.textContent||'');return /for\s*\(|for\s+\w+\s+in\s+|for loop|iterate|iteration/i.test(text)}
function applyLessonMode(){
 if(!isFlexibleCourse())return;var mode=readMode();
 document.querySelectorAll('.lesson').forEach(function(lesson){
   var pyPres=Array.from(lesson.querySelectorAll('pre')).filter(function(pre){return looksPython(pre.textContent)});
   pyPres.forEach(function(pre){if(!lessonState.has(pre))lessonState.set(pre,{hidden:pre.hidden});pre.classList.toggle('csai-hidden-python-example',mode==='cpp')});
   var panel=lesson.querySelector('[data-cpp-lesson-panel]');
   if((mode==='cpp'||mode==='dual')&&lessonHasLoop(lesson)){if(!panel){var host=document.createElement('div');host.setAttribute('data-cpp-lesson-panel','');host.innerHTML=loopPanel();(lesson.querySelector('.body')||lesson).appendChild(host)}}else if(panel){panel.remove()}
   var note=lesson.querySelector('[data-cpp-generic-note]');
   if(mode==='cpp'&&pyPres.length&&!lessonHasLoop(lesson)){if(!note){note=document.createElement('div');note.className='csai-cpp-note';note.setAttribute('data-cpp-generic-note','');note.innerHTML='<strong>C++ mode is active.</strong> The Python-only example is hidden here; use the C++ exercise workspace for this language-flexible concept.';(lesson.querySelector('.body')||lesson).appendChild(note)}}else if(note){note.remove()}
 })
}
function enhanceReveal(button){var mode=readMode();if(mode!=='cpp'&&mode!=='dual')return;var task=button.closest('.oa-task,.quiz-card,[data-task]');if(!task)return;var text=String(task.textContent||'');if(!/for loop|iterate|iteration|for\s*\(|for\s+\w+\s+in/i.test(text))return;if(task.querySelector('[data-cpp-reveal]'))return;var target=task.querySelector('[data-solution-panel],.oa-solution,.quiz-solution')||task;var holder=document.createElement('div');holder.setAttribute('data-cpp-reveal','');holder.innerHTML=loopPanel();target.appendChild(holder)}
function markReady(){document.documentElement.setAttribute('data-csai-course-ready','1');window.dispatchEvent(new CustomEvent('csai-course-ready'))}
function applyMode(){renderSelector();removePredict();applyAssessmentMode();applyLessonMode();document.querySelectorAll('[data-lang-mode]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-lang-mode')===readMode())});markReady()}
function bind(){
 document.addEventListener('click',function(e){
   var b=e.target.closest&&e.target.closest('[data-lang-mode]');if(b){saveMode(b.getAttribute('data-lang-mode'));applyMode();return}
   var tab=e.target.closest&&e.target.closest('[data-cpp-tab]');if(tab){var panel=tab.closest('[data-cpp-loop-panel]');if(!panel)return;var key=tab.getAttribute('data-cpp-tab');panel.querySelectorAll('[data-cpp-tab]').forEach(function(x){x.classList.toggle('active',x===tab)});panel.querySelectorAll('[data-cpp-option]').forEach(function(x){x.classList.toggle('active',x.getAttribute('data-cpp-option')===key)});return}
   var reveal=e.target.closest&&e.target.closest('[data-reveal-solution],[data-reveal-answer]');if(reveal){setTimeout(function(){enhanceReveal(reveal)},60)}
   var task=e.target.closest&&e.target.closest('.oa-task');if(task&&task.getAttribute('data-csai-active-language')==='cpp'&&e.target.closest('[data-run],[data-submit]')){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();var out=task.querySelector('[data-output]');if(out)out.textContent='C++ mode is active. This page will not send C++ code into the Python test runner.'}
 },true);
 document.addEventListener('input',function(e){var task=e.target.closest&&e.target.closest('.oa-task');if(!task)return;if(e.target.matches('textarea[data-editor]:not(.oa-answer)')){var state=ensureEditorState(task);if(!state)return;var lang=task.getAttribute('data-csai-active-language');if(lang==='cpp'){state.cpp=e.target.value;saveDraft(task,'cpp',e.target.value)}else{state.python=e.target.value;saveDraft(task,'python',e.target.value)}}},true)
}
function staticCourseUrl(id){id=String(id||'').trim();if(!/^[A-Za-z0-9._-]+$/.test(id))return'';return'/courses/'+encodeURIComponent(id)+'.html'}
function installStaticNavigation(){
 if(window.__csaiStaticCourseGuard)return;window.__csaiStaticCourseGuard=true;
 var existing=window.cxOpen;window.cxOpen=function(id){var url=staticCourseUrl(id);if(url){location.assign(url);return}if(typeof existing==='function')return existing.apply(this,arguments)};
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-scr-course]');if(!b)return;var url=staticCourseUrl(b.getAttribute('data-scr-course'));if(!url)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();location.assign(url)},true)
}
function start(){addStyle();installStaticNavigation();if(!isCoursePage())return;removePredict();setTimeout(removePredict,180);setTimeout(removePredict,650);setTimeout(removePredict,1300);if(!isFlexibleCourse()){var old=document.querySelector('[data-course-language-mode]');if(old)old.remove();markReady();return}renderSelector();bind();applyMode();setTimeout(applyMode,180);setTimeout(applyMode,650);setTimeout(applyMode,1300)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
