(function(){
'use strict';
var VERSION='20260824-v574-program-questions';
function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function codeText(node){return String(node?('value' in node?node.value:node.textContent):'').replace(/\r/g,'');}
function lessonTitle(node){var l=node&&node.closest&&node.closest('.lesson'),n=l&&l.querySelector('summary .title,summary');return clean(n&&n.textContent||'this lesson');}
function labelFor(root){var n=root&&root.querySelector&&root.querySelector('.csai-study-example-head h4,.lesson-run-lang');return clean(n&&n.textContent||'this example');}
function language(root,code){var l=clean(root&&root.getAttribute&&root.getAttribute('data-language')||'').toLowerCase();if(l)return l;if(/\b(SELECT|JOIN|GROUP\s+BY|CREATE\s+TABLE)\b/i.test(code))return'sql';if(/#include\s*[<"]|\bstd::|\bcout\s*<</.test(code))return'cpp';if(/<\/?[a-z][^>]*>/i.test(code))return'html';if(/\b(console\.log|const\s+|let\s+|function\s+)/.test(code))return'javascript';return'python';}
function tailoredQuestion(code,lang,title,label){var c=String(code||''),t=(title+' '+label).toLowerCase();
 if(/class\s+Node\b/.test(c)&&/head\s*=\s*Node\(1\)/.test(c)&&/head\.next\s*=\s*Node\(2\)/.test(c)&&/head\.next\.next\s*=\s*Node\(3\)/.test(c))return'Create a singly linked list containing 1 → 2 → 3 by connecting each node through its next reference. After the links are built, what values should be reached from the head in order?';
 if(/class\s+Node\b/.test(c)&&/\.next\b/.test(c)&&/while\s+\w+/.test(c))return'Given the linked nodes shown below, traverse the list by following each next reference. In what order should the node values be visited or printed?';
 if(/class\s+Node\b/.test(c)&&/\.next\b/.test(c))return'Build or update the linked list shown below. Which node should each next reference point to, and what value or list state should the program produce?';
 if(/prefix\s*=\s*\[\s*0\s*\]/.test(c)&&/prefix\s*\.append\s*\(\s*prefix\s*\[\s*-1\s*\]/.test(c))return'Given the numbers shown below, build a prefix-sum list that starts with 0 and stores the running total after each number. What final prefix list should be produced?';
 if(/\.get\s*\([^,]+,\s*0\s*\)\s*\+\s*1/.test(c)&&/\{\s*\}/.test(c))return'Given the repeated values shown below, count how many times each value appears and store the counts in a dictionary. What final dictionary should the program produce?';
 if(/left\s*,\s*right\s*=\s*0\s*,\s*len\s*\([^)]*\)\s*-\s*1/.test(c)&&/while\s+left\s*<\s*right/.test(c))return'Given the list shown below, reverse it in place by swapping values from the two ends and moving inward. What should the final list contain?';
 if(/for\s+\w+\s*,\s*\w+\s+in\s+enumerate\s*\(/.test(c))return'Go through the collection while keeping both each item’s index and its value. What index-value pairs should this program produce for the shown input?';
 if(/\.insert\s*\(/.test(c)&&/\.pop\s*\(/.test(c))return'Update the list using the insertion and removal operations shown below. What should the list contain after both changes are complete?';
 if(/sorted\s*\(\s*set\s*\(/.test(c))return'Given values that may repeat, remove duplicates and return the remaining values in sorted order. What result should the shown input produce?';
 if(/\bset\s*\(/.test(c)&&/print/.test(c))return'Use a set with the shown data to keep unique values or test membership. Which values should remain or which membership checks should be true?';
 if(/\[[^\]]+\s+for\s+\w+\s+in\s+\w+\s+for\s+\w+\s+in\s+\w+\]/s.test(c))return'Flatten the nested collection shown below into one list while preserving the inner values in order. What final flat list should be produced?';
 if(/\[[^\]]+\s+for\s+\w+\s+in\s+[^\]]+\]/s.test(c))return'Build a new list using the transformation or filter in this list comprehension. What values should the new list contain for the shown input?';
 if(/\byield\b/.test(c)||/\([^\n()]+\s+for\s+\w+\s+in\s+[^\n()]+\)/.test(c))return'Produce the values lazily instead of building every result immediately. Which values should be produced, and why can generating them one at a time be useful?';
 if(/while\s+\w+\s*>\s*1/.test(c)&&/\/\/=\s*2/.test(c))return'Repeatedly halve the starting value with integer division until it reaches 1 or below. How many iterations should the shown starting value take?';
 if(/target/.test(c)&&/mid\s*=/.test(c)&&/(left|lo)/.test(c)&&/(right|hi)/.test(c))return'Use binary search on the sorted data shown below. Which index or search result should be produced for the target?';
 if(/deque\s*\(/.test(c)&&/popleft\s*\(/.test(c))return'Process the queue in first-in, first-out order. Which item should leave first, and what should remain afterward?';
 if(/stack/i.test(c+' '+t)&&/\.append\s*\(/.test(c)&&/\.pop\s*\(/.test(c)&&!/popleft/.test(c))return'Use last-in, first-out behavior with the values shown below. Which value should be removed first, and what should remain on the stack?';
 if(/def\s+\w+\s*\(/.test(c)&&/return\b/.test(c))return'Run the function with the shown input and trace the values passed in, the calculation or decision inside the function, and the returned result. What should it return?';
 if(/for\s+\w+\s+in\s+/.test(c)&&/print\s*\(/.test(c))return'Go through the shown input one item at a time and apply the loop body to each item. What values or lines should the loop print, in order?';
 if(lang==='sql'){
  if(/\bJOIN\b/i.test(c))return'Combine the related table rows using the join shown below. Which rows or columns should appear in the result?';
  if(/\bGROUP\s+BY\b/i.test(c))return'Group the matching rows and calculate the summary shown below. What result should each group produce?';
  return'Run the SQL operation shown below on the lesson data. What rows or values should the query return or change?';
 }
 if(lang==='cpp')return'Run the C++ program below and trace how the lesson concept changes the program state. What output or final value should prove it worked?';
 if(lang==='javascript')return'Run the JavaScript below with the shown data or page state. What value should be logged or what visible behavior should occur?';
 if(lang==='html')return'Build the HTML shown below. What structure or behavior should be visible in the page when it is correct?';
 if(/print\s*\(/.test(c))return'Run the program below and predict its printed output before pressing Run. Which lesson idea explains why that output is produced?';
 return'Run the program below and trace what it creates or changes. What final value, object state, or behavior should show that the '+title+' idea was used correctly?';
}
function existingQuestion(root){
 var study=root.closest&&root.closest('.csai-study-example');
 if(study){var q=study.querySelector(':scope > .csai-learning-question,.csai-study-example-lazy-body > .csai-learning-question');if(q)return q;}
 return root.querySelector&&root.querySelector(':scope > .csai-learning-question');
}
function ensure(root){
 if(!root||root.nodeType!==1)return;
 if(root.matches&&root.matches('pre.code')&&root.closest&&root.closest('.lesson-run-card'))return;
 var study=root.matches&&root.matches('.csai-study-example')?root:(root.closest&&root.closest('.csai-study-example'));
 if(study&&root.classList.contains('lesson-run-card')&&existingQuestion(root))return;
 var code=(root.matches&&root.matches('pre.code'))?root:(root.querySelector&&root.querySelector(':scope > .code,:scope > pre.code,:scope > textarea.csai-study-code,:scope > [data-csai-language-generated],:scope > .csai-language-code'));
 if(!code&&root.classList.contains('csai-study-example'))code=root.querySelector('.csai-study-code,pre.code,[data-example-audit]');
 if(!code)return;
 if(code.closest&&code.closest('[data-csai-try-it-yourself],.csai-try-it-yourself'))return;
 var q=existingQuestion(root);
 if(q){if(q.nextElementSibling!==code)code.insertAdjacentElement('beforebegin',q);return;}
 var host=study||root,text=codeText(code),lang=language(host,text),title=lessonTitle(root),label=labelFor(host),question='';
 if(study&&window.CSAIStudyExampleContent&&typeof window.CSAIStudyExampleContent.studyQuestionFor==='function'){
  try{question=clean(window.CSAIStudyExampleContent.studyQuestionFor(study,0));}catch(_e){}
 }
 if(!question)question=tailoredQuestion(text,lang,title,label);
 var node=document.createElement('div');node.className='csai-learning-question csai-program-question-v574';node.setAttribute('data-csai-learning-question','program');node.innerHTML='<b>Question</b><p>'+esc(question)+'</p>';
 code.insertAdjacentElement('beforebegin',node);
}
function style(){if(document.getElementById('csai-program-question-v574-style'))return;var s=document.createElement('style');s.id='csai-program-question-v574-style';s.textContent=`
.csai-program-question-v574,.csai-learning-question{padding:11px 13px;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--panel) 92%,#2f7fb9 8%);line-height:1.55}.csai-program-question-v574 b,.csai-learning-question>b{display:block;margin:0 0 4px;font-size:.8rem}.csai-program-question-v574 p,.csai-learning-question>p{margin:0;color:var(--text);font-size:.86rem}html[data-theme="dark"] .csai-program-question-v574,html[data-theme="dark"] .csai-learning-question{background:color-mix(in srgb,#17212c 90%,#2f7fb9 10%)}
`;document.head.appendChild(s);}
function enhance(root){style();root=root||document;var selectors='.lesson-run-card,.csai-study-example,.csai-lang-variant[data-lang-variant],.lesson .body pre.code';if(root.matches&&root.matches(selectors))ensure(root);if(root.querySelectorAll)root.querySelectorAll(selectors).forEach(ensure);}
function boot(){enhance(document);var pending=new Set(),timer=0;new MutationObserver(function(records){records.forEach(function(r){Array.from(r.addedNodes||[]).forEach(function(n){if(n&&n.nodeType===1)pending.add(n);});});if(!pending.size)return;clearTimeout(timer);timer=setTimeout(function(){var batch=Array.from(pending);pending.clear();batch.forEach(enhance);},60);}).observe(document.documentElement,{childList:true,subtree:true});setTimeout(function(){enhance(document);},350);setTimeout(function(){enhance(document);},1000);}
window.CSAIProgramQuestions={version:VERSION,enhance:enhance,questionFor:tailoredQuestion};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
