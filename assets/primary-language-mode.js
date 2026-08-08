(function(){
'use strict';

var KEY='csai-primary-language-v1';
var MODES={python:'Python',cpp:'C++',dual:'Dual'};
var PROGRAMMING_IDS=['python','dsa','problem-solving','oop','debugging','testing','software-engineering','backend-development','computer-architecture','operating-systems','distributed-systems','data-structures','algorithms'];

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function readMode(){try{var m=localStorage.getItem(KEY);return MODES[m]?m:'python'}catch(e){return'python'}}
function saveMode(mode){if(!MODES[mode])return;try{localStorage.setItem(KEY,mode)}catch(e){}window.dispatchEvent(new CustomEvent('csai-language-mode-change',{detail:{mode:mode}}))}
function courseMeta(){try{var n=document.getElementById('course-page-meta');return n?JSON.parse(n.textContent||'{}'):{};}catch(e){return{}}}
function courseId(){var m=courseMeta();return String(m.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'')}
function isProgrammingCourse(){var id=courseId().toLowerCase();return PROGRAMMING_IDS.some(function(x){return id.indexOf(x)>=0})}
function isHub(){return !!document.querySelector('.hub-courses-banner')&&!document.getElementById('course-page-meta')}

function addStyle(){
 if(document.getElementById('csai-language-mode-style'))return;
 var s=document.createElement('style');s.id='csai-language-mode-style';s.textContent=`
 .lang-mode-card{margin:28px 0 8px;padding:18px 20px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:linear-gradient(110deg,rgba(79,209,197,.10),rgba(91,155,213,.09),rgba(180,142,240,.10));font-family:"Segoe UI",-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif}.lang-mode-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}.lang-mode-title{font-size:1.02rem;font-weight:900;color:#eef4fb}.lang-mode-sub{margin-top:4px;color:#9aa7b8;font-size:.84rem;line-height:1.55;max-width:66ch}.lang-mode-options{display:flex;gap:8px;flex-wrap:wrap}.lang-mode-btn{border:1px solid rgba(255,255,255,.16);border-radius:10px;background:rgba(255,255,255,.05);color:#e8eef7;padding:9px 13px;font:850 13px/1.2 inherit;cursor:pointer}.lang-mode-btn.active{background:#4fd1c5;color:#081016;border-color:#4fd1c5}.lang-mode-note{margin-top:12px;padding-top:11px;border-top:1px solid rgba(255,255,255,.08);color:#9aa7b8;font-size:.78rem;line-height:1.5}
 body[data-theme="light"] .lang-mode-card{border-color:rgba(0,0,0,.10);background:linear-gradient(110deg,rgba(15,118,110,.07),rgba(43,91,140,.06),rgba(111,66,193,.06))}body[data-theme="light"] .lang-mode-title{color:#211f2b}body[data-theme="light"] .lang-mode-sub,body[data-theme="light"] .lang-mode-note{color:#65616f}body[data-theme="light"] .lang-mode-btn{border-color:#cfd6df;background:#fff;color:#211f2b}body[data-theme="light"] .lang-mode-btn.active{background:#0f766e;color:#fff;border-color:#0f766e}
 .course-lang-mode{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px}.course-lang-mode-label{font-size:.76rem;font-weight:850;color:var(--muted)}.course-lang-mode .lang-mode-btn{background:var(--panel);color:var(--text);border-color:var(--border);padding:7px 10px}.course-lang-mode .lang-mode-btn.active{background:#17649a;color:#fff;border-color:#17649a}
 .cpp-companion{margin-top:18px;border:1px solid var(--border);border-radius:14px;overflow:hidden;background:var(--panel)}.cpp-companion[hidden]{display:none!important}.cpp-head{padding:13px 15px;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--panel) 90%,var(--bg))}.cpp-head h4{margin:0;font-size:1rem}.cpp-head p{margin:4px 0 0;color:var(--muted);font-size:.82rem;line-height:1.5}.cpp-tabs{display:flex;gap:7px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid var(--border)}.cpp-tab{border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);padding:7px 10px;font:800 12px/1.2 inherit;cursor:pointer}.cpp-tab.active{background:#17649a;color:#fff;border-color:#17649a}.cpp-option{display:none;padding:14px}.cpp-option.active{display:block}.cpp-option h5{margin:0 0 7px;font-size:.94rem}.cpp-option .cpp-when{margin:0 0 10px;color:var(--muted);font-size:.82rem;line-height:1.55}.cpp-code{margin:0;white-space:pre;overflow:auto;border:1px solid var(--border);border-radius:10px;background:#0b111b;color:#f4f7fb;padding:13px;font:500 13px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace}.cpp-deep{margin-top:13px;display:grid;gap:10px}.cpp-step{border:1px solid var(--border);border-radius:10px;padding:11px 12px;background:var(--bg);line-height:1.6}.cpp-step b{color:var(--text)}.cpp-step code{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.cpp-trace{width:100%;border-collapse:collapse;margin-top:8px;font-size:.82rem}.cpp-trace th,.cpp-trace td{border:1px solid var(--border);padding:7px 8px;text-align:left}.cpp-trace th{background:color-mix(in srgb,var(--panel) 85%,var(--bg))}.cpp-concepts{margin-top:12px;padding:11px 12px;border:1px dashed var(--border);border-radius:10px;color:var(--muted);line-height:1.6;font-size:.83rem}.cpp-concepts strong{color:var(--text)}.cpp-reveal-title{margin:15px 0 8px;font-weight:900}.cpp-mini-badge{display:inline-flex;padding:4px 7px;border-radius:999px;background:var(--pill);color:var(--pilltext);font-size:.7rem;font-weight:900;margin-left:6px}
 @media(max-width:720px){.lang-mode-head{flex-direction:column}.lang-mode-options{width:100%}.lang-mode-btn{flex:1}.cpp-tabs{display:grid;grid-template-columns:1fr}.cpp-trace{font-size:.74rem}}
 `;document.head.appendChild(s);
}

function modeButtons(mode,context){
 return Object.keys(MODES).map(function(k){return'<button type="button" class="lang-mode-btn '+(mode===k?'active':'')+'" data-lang-mode="'+k+'">'+(k==='cpp'?'C++':MODES[k])+'</button>'}).join('');
}
function description(mode){
 if(mode==='cpp')return'C++ mode: programming-oriented lessons show C++ companions. Normal beginner syntax is shown first, then alternative C++ approaches.';
 if(mode==='dual')return'Dual mode: keep the original Python material and add C++ companions so you can compare both languages concept by concept.';
 return'Python mode: keep the original Python-first learning path. You can switch to C++ or Dual at any time.';
}
function renderHubSelector(){
 if(!isHub())return;
 var banner=document.querySelector('.hub-courses-banner');if(!banner)return;
 var card=document.querySelector('[data-language-mode-card]');
 if(!card){card=document.createElement('section');card.className='lang-mode-card';card.setAttribute('data-language-mode-card','');banner.parentNode.insertBefore(card,banner)}
 var mode=readMode();
 card.innerHTML='<div class="lang-mode-head"><div><div class="lang-mode-title">Choose your primary coding language</div><div class="lang-mode-sub">Pick this before entering the course catalog. Your choice is remembered. C++ affects programming-oriented material; AI/ML remains Python-first where Python is the real industry ecosystem.</div></div><div class="lang-mode-options">'+modeButtons(mode,'hub')+'</div></div><div class="lang-mode-note">'+esc(description(mode))+'</div>';
}
function renderCourseSelector(){
 var hero=document.querySelector('.hero');if(!hero)return;
 var wrap=hero.querySelector('[data-course-language-mode]');
 if(!wrap){wrap=document.createElement('div');wrap.className='course-lang-mode';wrap.setAttribute('data-course-language-mode','');var progress=hero.querySelector('[data-progress-status]');if(progress)progress.insertAdjacentElement('afterend',wrap);else hero.appendChild(wrap)}
 var mode=readMode();wrap.innerHTML='<span class="course-lang-mode-label">Coding language:</span>'+modeButtons(mode,'course');
}

function valuesFromContext(root){
 var code=Array.from(root.querySelectorAll('pre.code,pre,.oa-solution pre')).map(function(x){return x.textContent}).join('\n');
 var m=code.match(/\[(\s*-?\d+(?:\s*,\s*-?\d+){1,7})\]/);if(m){var vals=m[1].split(',').map(function(x){return Number(x.trim())}).filter(function(x){return Number.isFinite(x)});if(vals.length)return vals.slice(0,6)}
 return[10,20,30,40];
}
function vectorLiteral(vals){return'{'+vals.join(', ')+'}'}
function traceRows(vals){return vals.map(function(v,i){return'<tr><td>'+i+'</td><td>'+i+' &lt; '+vals.length+' → true</td><td>'+v+'</td><td>prints '+v+'</td><td>'+(i+1)+'</td></tr>'}).join('')+'<tr><td>'+vals.length+'</td><td>'+vals.length+' &lt; '+vals.length+' → false</td><td>—</td><td>loop stops</td><td>—</td></tr>'}
function normalCode(vals){return '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> nums = '+vectorLiteral(vals)+';\n\n    for (int i = 0; i < nums.size(); i++) {\n        cout << nums[i] << endl;\n    }\n\n    return 0;\n}'}
function rangeCode(vals){return '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> nums = '+vectorLiteral(vals)+';\n\n    for (int value : nums) {\n        cout << value << endl;\n    }\n\n    return 0;\n}'}
function iteratorCode(vals){return '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> nums = '+vectorLiteral(vals)+';\n\n    for (auto it = nums.begin(); it != nums.end(); it++) {\n        cout << *it << endl;\n    }\n\n    return 0;\n}'}
function normalExplanation(vals){return '<div class="cpp-deep">'+
 '<div class="cpp-step"><b>1. Initialization — <code>int i = 0</code></b><br>C++ creates an integer variable named <code>i</code> and gives it the value <code>0</code>. A vector starts at index 0, so this means “start at the first element.” This part runs <b>once</b>, before the first iteration.</div>'+
 '<div class="cpp-step"><b>2. Condition — <code>i &lt; nums.size()</code></b><br>Before every iteration, C++ checks whether the condition is true. <code>nums.size()</code> is '+vals.length+' here, because the vector contains '+vals.length+' elements. If the condition is true, the body runs. If it is false, the loop ends immediately.</div>'+
 '<div class="cpp-step"><b>3. Body — <code>cout &lt;&lt; nums[i] &lt;&lt; endl;</code></b><br><code>nums[i]</code> means “get the element stored at index <code>i</code>.” When <code>i</code> is 0, C++ reads the first element. <code>cout</code> sends the value to standard output, and <code>endl</code> moves to a new line.</div>'+
 '<div class="cpp-step"><b>4. Update — <code>i++</code></b><br>Only after the body finishes, <code>i++</code> increases <code>i</code> by 1. It is the short form of <code>i = i + 1</code>. C++ then goes back to the condition and checks again.</div>'+
 '<div class="cpp-step"><b>5. Full execution order</b><br>The real order is: <b>initialize → check condition → run body → update → check condition → run body → update</b> … until the condition becomes false. The semicolons inside <code>for (...; ...; ...)</code> separate initialization, condition, and update.</div>'+
 '<div class="cpp-step"><b>6. Trace it iteration by iteration</b><table class="cpp-trace"><thead><tr><th>i before body</th><th>condition</th><th>nums[i]</th><th>body</th><th>i after i++</th></tr></thead><tbody>'+traceRows(vals)+'</tbody></table></div>'+
 '<div class="cpp-step"><b>7. Why <code>&lt;</code> and not <code>&lt;=</code>?</b><br>The last valid index is <code>nums.size() - 1</code>. For '+vals.length+' elements, valid indexes are 0 through '+(vals.length-1)+'. If you used <code>i &lt;= nums.size()</code>, C++ would eventually try to access index '+vals.length+', which is outside the vector.</div>'+
 '</div>'}
function rangeExplanation(vals){return '<div class="cpp-deep">'+
 '<div class="cpp-step"><b>1. Read it like English</b><br><code>for (int value : nums)</code> means: “for each integer <code>value</code> inside <code>nums</code>, run the loop body.” C++ handles the index movement for you.</div>'+
 '<div class="cpp-step"><b>2. <code>int value</code></b><br>On each iteration, <code>value</code> receives the current element. With this vector, it becomes '+vals.map(function(v){return'<code>'+v+'</code>'}).join(', ')+' one after another.</div>'+
 '<div class="cpp-step"><b>3. The colon <code>:</code></b><br>The colon separates the variable that receives each item from the container being traversed. It is not the same as the two semicolons used in the normal three-part <code>for</code> loop.</div>'+
 '<div class="cpp-step"><b>4. Important detail: copy vs reference</b><br><code>int value</code> copies each element into <code>value</code>. If you wanted to modify the real element in the vector, you would normally write <code>int&amp; value</code>. For now, when simply reading/printing values, <code>int value</code> is the easiest version.</div>'+
 '<div class="cpp-step"><b>5. When to use it</b><br>Use a range-based loop when you only need each value and do not need its numeric index. It is shorter and avoids index mistakes, but the normal loop is better while learning how iteration and indexes work.</div>'+
 '</div>'}
function iteratorExplanation(vals){return '<div class="cpp-deep">'+
 '<div class="cpp-step"><b>1. <code>auto it = nums.begin()</code></b><br><code>nums.begin()</code> returns an iterator positioned at the first element. <code>auto</code> asks C++ to infer the iterator type so you do not have to write the long type manually.</div>'+
 '<div class="cpp-step"><b>2. <code>it != nums.end()</code></b><br><code>nums.end()</code> is a special position just <b>after</b> the last element. The iterator is allowed to move until it reaches that position, but you must not dereference <code>end()</code>.</div>'+
 '<div class="cpp-step"><b>3. <code>it++</code></b><br>This advances the iterator to the next element. Here <code>it++</code> does not mean “add one to the stored integer value”; it means “move this iterator forward by one position.”</div>'+
 '<div class="cpp-step"><b>4. <code>*it</code> — dereferencing</b><br>The iterator itself represents a position. The star operator <code>*</code> asks for the actual value at that position. So if the iterator points to the element '+vals[0]+', then <code>*it</code> evaluates to '+vals[0]+'.</div>'+
 '<div class="cpp-step"><b>5. Why iterators matter</b><br>Iterators are a major part of the C++ Standard Template Library (STL). Algorithms and containers such as <code>vector</code>, <code>list</code>, <code>set</code>, and <code>map</code> commonly expose <code>begin()</code>/<code>end()</code> iterator ranges.</div>'+
 '<div class="cpp-step"><b>6. Iterator vs iterative</b><br><strong>Iterative</strong> describes a process that repeats, such as solving a problem with a loop instead of recursion. An <strong>iterator</strong> is an object used to move through elements in a container. They sound similar, but they are different concepts.</div>'+
 '</div>'}
function loopPanel(root,kind){
 var vals=valuesFromContext(root);var id='cpp-loop-'+Math.random().toString(36).slice(2,9);
 var intro=kind==='reveal'?'This solution uses iteration. Here are the three important C++ possibilities. The normal beginner loop is shown first.':'C++ companion: the three common ways to traverse a vector. Start with the normal loop until the control flow feels automatic.';
 return '<section class="cpp-companion" data-cpp-loop-panel id="'+id+'"><div class="cpp-head"><h4>C++ For Loops — 3 possibilities <span class="cpp-mini-badge">deep explanation</span></h4><p>'+esc(intro)+'</p></div><div class="cpp-tabs"><button type="button" class="cpp-tab active" data-cpp-tab="normal">1. Normal for loop — learn this first</button><button type="button" class="cpp-tab" data-cpp-tab="range">2. Range-based loop</button><button type="button" class="cpp-tab" data-cpp-tab="iterator">3. Iterator loop</button></div>'+
 '<div class="cpp-option active" data-cpp-option="normal"><h5>Normal index-based <code>for</code> loop</h5><p class="cpp-when"><strong>Default choice while learning.</strong> You can see initialization, condition, update, indexes, and exactly why the loop stops.</p><pre class="cpp-code">'+esc(normalCode(vals))+'</pre>'+normalExplanation(vals)+'</div>'+
 '<div class="cpp-option" data-cpp-option="range"><h5>Range-based <code>for</code> loop</h5><p class="cpp-when">Use this when you want each value and do not need the index.</p><pre class="cpp-code">'+esc(rangeCode(vals))+'</pre>'+rangeExplanation(vals)+'</div>'+
 '<div class="cpp-option" data-cpp-option="iterator"><h5>Iterator-based <code>for</code> loop</h5><p class="cpp-when">Use this to learn STL traversal and how containers expose positions through iterators.</p><pre class="cpp-code">'+esc(iteratorCode(vals))+'</pre>'+iteratorExplanation(vals)+'</div>'+
 '<div class="cpp-concepts"><strong>Which one should you write first?</strong> Use the normal <code>for (int i = 0; i &lt; nums.size(); i++)</code> form by default. Learn the other two as alternative tools, not replacements you must memorize immediately.</div></section>';
}
function hasLoopContext(root){
 var text=String(root&&root.textContent||'').toLowerCase();
 var code=Array.from(root&&root.querySelectorAll?root.querySelectorAll('pre,code'):[]).map(function(x){return x.textContent}).join('\n');
 return /\bfor\s*\(|\bfor\s+\w+\s+in\b|\bfor loop\b|\biterate\b|\biteration\b/.test(code+'\n'+text);
}
function enhanceLessons(){
 var mode=readMode();var show=mode==='cpp'||mode==='dual';
 document.querySelectorAll('.cpp-companion[data-cpp-lesson]').forEach(function(p){p.hidden=!show});
 if(!show||!isProgrammingCourse())return;
 Array.from(document.querySelectorAll('.lesson')).forEach(function(lesson){if(!hasLoopContext(lesson)||lesson.querySelector('[data-cpp-lesson]'))return;var body=lesson.querySelector('.body')||lesson;var wrap=document.createElement('div');wrap.setAttribute('data-cpp-lesson','');wrap.innerHTML=loopPanel(lesson,'lesson');var panel=wrap.firstElementChild;if(panel)panel.setAttribute('data-cpp-lesson','');body.appendChild(panel)});
}
function revealTarget(btn){var task=btn.closest('.oa-task,.quiz-card,[data-task]');if(!task)return null;return task.querySelector('[data-solution-panel],.oa-solution,.quiz-solution')||task}
function enhanceReveal(btn){
 var mode=readMode();if(mode!=='cpp'&&mode!=='dual')return;
 var target=revealTarget(btn);if(!target||target.querySelector('[data-cpp-reveal]'))return;
 var task=btn.closest('.oa-task,.quiz-card,[data-task]')||target;if(!hasLoopContext(task)&&!hasLoopContext(target))return;
 var holder=document.createElement('div');holder.setAttribute('data-cpp-reveal','');holder.innerHTML='<div class="cpp-reveal-title">C++ alternatives for this loop</div>'+loopPanel(task,'reveal');target.appendChild(holder);
}
function bindTabs(){document.addEventListener('click',function(e){var tab=e.target.closest&&e.target.closest('[data-cpp-tab]');if(!tab)return;var panel=tab.closest('[data-cpp-loop-panel]');if(!panel)return;var key=tab.getAttribute('data-cpp-tab');panel.querySelectorAll('[data-cpp-tab]').forEach(function(x){x.classList.toggle('active',x===tab)});panel.querySelectorAll('[data-cpp-option]').forEach(function(x){x.classList.toggle('active',x.getAttribute('data-cpp-option')===key)})})}
function bindMode(){document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-lang-mode]');if(!b)return;saveMode(b.getAttribute('data-lang-mode'));renderHubSelector();renderCourseSelector();enhanceLessons()});window.addEventListener('storage',function(e){if(e.key===KEY){renderHubSelector();renderCourseSelector();enhanceLessons()}});window.addEventListener('csai-language-mode-change',function(){renderHubSelector();renderCourseSelector();enhanceLessons()})}
function bindReveal(){document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-reveal-solution],[data-reveal-answer],[data-solution-toggle],[data-reveal]');if(!b)return;setTimeout(function(){enhanceReveal(b)},40)},true)}
function start(){addStyle();renderHubSelector();renderCourseSelector();bindTabs();bindMode();bindReveal();enhanceLessons();setTimeout(enhanceLessons,350);setTimeout(enhanceLessons,900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
