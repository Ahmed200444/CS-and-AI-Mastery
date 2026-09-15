(function(){
'use strict';
var VERSION='20260824-v574-conceptual-examples';
function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function courseId(){
 try{var n=document.getElementById('course-page-meta');if(n){var d=JSON.parse(n.textContent||'{}');if(d&&d.id)return String(d.id);}}catch(_e){}
 return String(location.pathname.split('/').pop()||'').replace(/\.html$/,'');
}
function lessonTitle(lesson){var n=lesson&&lesson.querySelector('summary .title,summary');return clean(n&&n.textContent||'Lesson');}
function concepts(body){
 var h=Array.from(body.querySelectorAll(':scope > h3')).find(function(n){return /^key concepts$/i.test(clean(n.textContent));});
 if(!h)return{heading:null,host:null,items:[]};
 var host=h.nextElementSibling;
 var items=host?Array.from(host.querySelectorAll('.pill')).map(function(n){return clean(n.textContent);}).filter(Boolean):[];
 return{heading:h,host:host,items:Array.from(new Set(items))};
}
function fallbackUse(title,concept,index){
 var c=concept.toLowerCase(),m=index%4;
 if(/array|list|index/.test(c))return['Store ordered values and read a known position directly.','Walk through an ordered group of values without losing their order.','Insert or remove an item while noticing that later positions may shift.','Compare direct indexed access with scanning every item.'][m];
 if(/linked|node|next reference|pointer/.test(c))return['Represent values as connected nodes, where each node points to the next one.','Insert a new first node by changing links instead of shifting every existing value.','Traverse from the head by following one next reference at a time.','Reverse or reconnect links while making sure no node is lost.'][m];
 if(/stack|lifo/.test(c))return['Undo the most recent action first.','Match nested brackets by remembering the latest unmatched opening bracket.','Process the newest pending item before older ones.','Reverse processing order by pushing first and popping later.'][m];
 if(/queue|fifo|deque/.test(c))return['Process requests in the same order they arrive.','Use breadth-first search to explore the oldest discovered node first.','Model a waiting line where the first item added leaves first.','Buffer work between a producer and a consumer.'][m];
 if(/prefix sum/.test(c))return['Precompute running totals once so later range sums can be answered quickly.','Keep cumulative totals so each new position knows the sum before it.','Answer many sum queries without adding the same values again and again.','Use the difference between two stored prefix totals to get a range total.'][m];
 if(/two pointers/.test(c))return['Move one position from the left and one from the right while solving an in-place sequence problem.','Compare values from both ends without creating another full list.','Shrink a search region by moving two positions toward each other.','Track two positions that move under different conditions.'][m];
 if(/binary search/.test(c))return['Search sorted data by discarding half of the remaining range after each comparison.','Find where a value should be inserted into sorted data.','Locate the first or last occurrence of a repeated target.','Search for the smallest value that satisfies a monotonic condition.'][m];
 if(/hash|dictionary|map/.test(c))return['Remember a value under a meaningful key for direct lookup.','Count how many times each item appears.','Remember values already seen while scanning once.','Group related records under the same key.'][m];
 if(/recurs|base case/.test(c))return['Solve a problem by reducing it to a smaller version until a stopping case is reached.','Walk a tree by letting each call handle one node and its smaller subtrees.','Trace repeated calls and then combine their returned results.','Use a clear base case so recursive calls cannot continue forever.'][m];
 if(/sql|join|group by|query/.test(c))return['Filter or combine stored records to answer a specific data question.','Join related rows using columns that connect two tables.','Summarize many rows into one result per group.','Rank or aggregate records without moving the data into application code first.'][m];
 if(/model|regression|classification|embedding|llm|rag|agent/.test(c))return['Turn an input into a measurable prediction or decision and check the result against evidence.','Compare model output with known answers using an evaluation signal.','Represent information so similar inputs can be compared or retrieved.','Trace the data, model/tool step, and observable output in one small AI workflow.'][m];
 return 'Use '+concept+' in a concrete '+title+' situation where you can point to the input, the important behavior, and the result.';
}
function useFor(body,title,concept,index){
 var api=window.CSAIStudyExampleContent;
 if(api&&typeof api.practicalUseFor==='function'){
  try{var v=clean(api.practicalUseFor(courseId(),title,concept,index));if(v)return v;}catch(_e){}
 }
 return fallbackUse(title,concept,index);
}
function build(lesson){
 if(!lesson||lesson.getAttribute('data-csai-conceptual-v574')==='1')return;
 var body=lesson.querySelector(':scope > .body');if(!body)return;
 var data=concepts(body);if(!data.host||!data.items.length)return;
 var title=lessonTitle(lesson),section=document.createElement('section');
 section.className='csai-conceptual-examples';section.setAttribute('data-csai-conceptual-examples','');
 section.innerHTML='<div class="csai-conceptual-head"><h3>Conceptual examples</h3><p>Short situations that show when each key idea is useful.</p></div><div class="csai-conceptual-list"></div>';
 var list=section.querySelector('.csai-conceptual-list');
 data.items.forEach(function(concept,index){
  var use=useFor(body,title,concept,index),item=document.createElement('article');item.className='csai-conceptual-item';item.setAttribute('data-concept-name',concept);
  item.innerHTML='<h4>'+esc(concept)+'</h4><p><b>Example:</b> '+esc(use)+'</p><p class="csai-conceptual-question"><b>Question:</b> What part of this situation tells you that '+esc(concept)+' is the right idea to use?</p>';
  list.appendChild(item);
 });
 data.host.insertAdjacentElement('afterend',section);lesson.setAttribute('data-csai-conceptual-v574','1');
}
function style(){if(document.getElementById('csai-conceptual-v574-style'))return;var s=document.createElement('style');s.id='csai-conceptual-v574-style';s.textContent=`
.csai-conceptual-examples{margin:14px 0 18px;border:1px solid var(--border);border-radius:13px;background:var(--panel);overflow:hidden}.csai-conceptual-head{padding:13px 15px;border-bottom:1px solid var(--border)}.csai-conceptual-head h3{margin:0 0 4px!important;font-size:1rem}.csai-conceptual-head p{margin:0;color:var(--muted);font-size:.82rem}.csai-conceptual-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:0}.csai-conceptual-item{padding:12px 14px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);min-width:0}.csai-conceptual-item h4{margin:0 0 6px;font-size:.9rem}.csai-conceptual-item p{margin:0;color:var(--text);font-size:.83rem;line-height:1.5}.csai-conceptual-item .csai-conceptual-question{margin-top:7px;color:var(--muted)}@media(max-width:680px){.csai-conceptual-list{grid-template-columns:1fr}.csai-conceptual-item{border-right:0}}
`;document.head.appendChild(s);}
function current(){return document.querySelector('.lesson[open]')||document.querySelector('.lesson');}
function enhance(root){style();root=root||document;if(root.matches&&root.matches('.lesson'))build(root);if(root.querySelectorAll)root.querySelectorAll('.lesson[open]').forEach(build);}
function boot(){enhance(document);document.addEventListener('toggle',function(e){if(e.target&&e.target.matches&&e.target.matches('.lesson')&&e.target.open)build(e.target);},true);var pending=new Set(),timer=0;new MutationObserver(function(records){records.forEach(function(r){Array.from(r.addedNodes||[]).forEach(function(n){if(n&&n.nodeType===1)pending.add(n);});});if(!pending.size)return;clearTimeout(timer);timer=setTimeout(function(){var batch=Array.from(pending);pending.clear();batch.forEach(enhance);},70);}).observe(document.documentElement,{childList:true,subtree:true});var c=current();if(c)build(c);}
window.CSAIConceptualExamples={version:VERSION,build:build,enhance:enhance};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
