(function(){
'use strict';

var SCRIPT=document.currentScript;
var ASSET_ROOT=(function(){
  try{return new URL('./',SCRIPT&&SCRIPT.src?SCRIPT.src:location.href)}catch(e){return null}
})();
var INDEX_URL=ASSET_ROOT?new URL('practice-guidance-index.json',ASSET_ROOT).href:'assets/practice-guidance-index.json';
var STYLE_ID='csai-practice-guidance-style';
var indexPromise=null;
var courseCache={};
var activeId='';
var activeData=null;
var loadingId='';
var scanTimer=0;

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function arr(v){return Array.isArray(v)?v:(v?[v]:[])}
function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function titleOf(node){
  if(!node)return'';
  var t=node.querySelector('[data-title],h1,h2,h3,h4,b,.title,summary');
  return t?String(t.textContent||'').replace(/^\s*\d+[.)]?\s*/,'').trim():'';
}
function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  var s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
  .csai-practice-guide{margin:12px 0;border:1px solid var(--border,#cbd7e2);border-left:4px solid #1f8a66;border-radius:11px;background:var(--panel,#fff);color:var(--text,#172231);overflow:hidden;box-shadow:0 1px 0 rgba(15,35,55,.03)}
  .csai-guide-head{padding:10px 12px;display:flex;align-items:center;gap:9px;background:color-mix(in srgb,var(--panel,#fff) 90%,#dff5ec);border-bottom:1px solid var(--border,#d8e1ea);font-weight:900;color:inherit}
  .csai-guide-icon{font-size:.95rem;line-height:1}.csai-guide-title{min-width:0;flex:1}.csai-guide-required{flex:none;padding:3px 7px;border:1px solid color-mix(in srgb,#1f8a66 55%,var(--border,#cbd7e2));border-radius:999px;background:color-mix(in srgb,#1f8a66 12%,transparent);color:#176f53;font:900 .66rem/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;letter-spacing:.055em}
  .csai-practice-guide .csai-guide-body{padding:11px 13px 13px}.csai-practice-guide p{margin:0 0 9px;line-height:1.58}.csai-practice-guide ol,.csai-practice-guide ul{margin:8px 0 4px;padding-left:22px}.csai-practice-guide li{margin:6px 0;line-height:1.55}
  .csai-guide-tools{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 10px}.csai-guide-tool{display:inline-block;padding:4px 7px;border-radius:999px;background:var(--pill,#edf4f8);color:var(--pilltext,#174b72);font:800 .73rem/1.25 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .csai-guide-check{margin-top:10px!important;padding-top:9px;border-top:1px dashed var(--border,#cbd7e2);color:var(--muted,#5d6c7c);font-size:.9rem}.csai-guide-check b{color:var(--text,#172231)}
  .csai-guide-question,.csai-guide-why,.csai-guide-work,.csai-guide-engineer,.csai-guide-done{margin:0 0 10px;padding:10px 12px;border-radius:9px;line-height:1.58}.csai-guide-question{border:1px solid color-mix(in srgb,#2f7fb9 38%,var(--border,#cbd7e2));background:color-mix(in srgb,#2f7fb9 8%,var(--panel,#fff))}.csai-guide-why{border:1px solid color-mix(in srgb,#8d6b21 32%,var(--border,#cbd7e2));background:color-mix(in srgb,#d59a24 8%,var(--panel,#fff))}.csai-guide-work{border:1px solid color-mix(in srgb,#6b4fb8 36%,var(--border,#cbd7e2));background:color-mix(in srgb,#6b4fb8 8%,var(--panel,#fff))}.csai-guide-engineer{border:1px solid color-mix(in srgb,#1f8a66 34%,var(--border,#cbd7e2));background:color-mix(in srgb,#1f8a66 7%,var(--panel,#fff))}.csai-guide-done{border:1px solid color-mix(in srgb,#b6691f 34%,var(--border,#cbd7e2));background:color-mix(in srgb,#b6691f 7%,var(--panel,#fff))}.csai-guide-question b,.csai-guide-why b,.csai-guide-work b,.csai-guide-engineer b,.csai-guide-done b{display:block;margin-bottom:4px;color:var(--text,#172231)}.csai-guide-question p,.csai-guide-why p,.csai-guide-work p{margin:0!important}.csai-guide-engineer ol,.csai-guide-done ul{margin:6px 0 0;padding-left:21px}.csai-guide-engineer li,.csai-guide-done li{margin:5px 0}
  .csai-guide-plain{margin:10px 0 12px;padding:10px 12px;border:1px solid color-mix(in srgb,#2f7fb9 32%,var(--border,#cbd7e2));border-radius:9px;background:color-mix(in srgb,#2f7fb9 7%,var(--panel,#fff))}.csai-guide-plain-title{margin:0 0 6px;font-weight:900;color:var(--text,#172231)}.csai-guide-plain ul{margin:4px 0 0;padding-left:21px}.csai-guide-plain li{margin:5px 0;line-height:1.55}.csai-guide-plain-note{margin:6px 0 0!important;color:var(--muted,#5d6c7c);font-size:.82rem}
  .csai-course-guide{margin:0 0 16px}.csai-lesson-guide{margin:0 0 14px}.csai-project-guide{margin:0;border-radius:0;border-left-width:4px;border-right:0;border-bottom:1px solid var(--border,#cbd7e2);border-top:0}.csai-example-guide{margin:10px 0 8px}.csai-exercise-guide,.csai-quiz-guide{margin:9px 0}
  html[data-theme='dark'] .csai-practice-guide,body[data-theme='dark'] .csai-practice-guide{background:#17212c;color:#edf3f8;border-color:#344352}html[data-theme='dark'] .csai-guide-head,body[data-theme='dark'] .csai-guide-head{background:#142a26}html[data-theme='dark'] .csai-guide-required,body[data-theme='dark'] .csai-guide-required{color:#b8f0dd;border-color:#2a755e;background:#173d34}html[data-theme='dark'] .csai-guide-tool,body[data-theme='dark'] .csai-guide-tool{background:#203447;color:#dbe9f4}html[data-theme='dark'] .csai-guide-plain,body[data-theme='dark'] .csai-guide-plain{background:#172937;border-color:#34556b}
  @media(max-width:720px){.csai-guide-head{padding:10px}.csai-guide-required{font-size:.62rem}.csai-practice-guide .csai-guide-body{padding:10px}.csai-guide-tools{gap:5px}}
  `;document.head.appendChild(s);
}
function semanticFocus(items){
  var out=[],seen={};
  function add(x){var k=String(x||'').toLowerCase();if(!x||seen[k])return;seen[k]=1;out.push(x)}
  arr(items).forEach(function(raw){
    var t=norm(raw);
    if(!t)return;
    if(/break|stop condition|early exit/.test(t))add('stopping repetition at the right moment');
    else if(/continue|skip.*iteration|skip.*turn/.test(t))add('skipping one turn without ending the whole repetition');
    else if(/enumerate|index|position/.test(t))add("tracking an item's position while reading its value");
    else if(/for loop|while loop|loop|range|iterate|iteration/.test(t))add('repeating an action the correct number of times');
    else if(/if|elif|else|condition|boolean|comparison|decision/.test(t))add('choosing what happens based on a condition');
    else if(/list|array|tuple|set|collection|sequence/.test(t))add('working through a group of values');
    else if(/dict|dictionary|hash map|key lookup|key value/.test(t))add('finding and updating information by a key');
    else if(/function|method|return|argument|parameter|lambda/.test(t))add('organizing reusable behavior around inputs and results');
    else if(/class|object|oop|inheritance|polymorphism|encapsulation/.test(t))add('grouping related state and behavior');
    else if(/exception|error|try|raise|validation|failure/.test(t))add('handling invalid or failing cases safely');
    else if(/json|serialize|persist|save|load/.test(t))add('keeping structured information available between runs');
    else if(/file|path|open|context manager|resource/.test(t))add('working with external resources safely');
    else if(/input|prompt|stdin/.test(t))add('receiving information from the user or another source');
    else if(/print|output|display|stdout/.test(t))add('showing the result clearly');
    else if(/select|query|sql|table|database/.test(t))add('asking stored data for the exact result you need');
    else if(/join/.test(t))add('combining related information from different data sources');
    else if(/group|aggregate|count|sum|average/.test(t))add('summarizing related values into useful results');
    else if(/order|sort/.test(t))add('arranging results in a meaningful order');
    else if(/api|http|request|response|endpoint/.test(t))add('sending information to another service and handling its response');
    else if(/html|dom|component|element/.test(t))add('building and updating the visible page structure');
    else if(/css|flex|grid|responsive|style/.test(t))add('controlling layout and presentation clearly');
    else if(/git|branch|commit|merge/.test(t))add('tracking changes and combining work safely');
    else if(/test|debug|edge case/.test(t))add('checking normal behavior and important edge cases');
    else add('understanding what changes, what is checked, and what result should follow');
  });
  return out.slice(0,7);
}
function exampleProgramSummary(g){
  var plain=arr(g&&g.plainEnglish).map(function(x){return String(x||'').trim()}).filter(Boolean);
  if(plain.length)return plain.slice(0,2).join(' ');
  var fallback=String((g&&g.intro)||(g&&g.why)||(g&&g.question)||'').replace(/\s+/g,' ').trim();
  return fallback||'Follow the program from its input or starting state to the result it produces.';
}
function briefGuideText(g){
  var candidates=[];
  arr(g&&g.plainEnglish).forEach(function(x){candidates.push(x)});
  if(g&&g.intro)candidates.push(g.intro);
  arr(g&&g.requirements).forEach(function(x){candidates.push(x)});
  arr(g&&g.steps).forEach(function(x){candidates.push(x)});
  if(g&&g.workTask)candidates.push(g.workTask);
  if(g&&g.question)candidates.push(g.question);
  if(g&&g.why)candidates.push(g.why);
  var text=String(candidates.find(function(x){return String(x||'').trim()})||'').replace(/\s+/g,' ').trim();
  if(!text)return'';
  var parts=text.split(/(?<=[.!?])\s+/),out='';
  for(var i=0;i<parts.length&&i<2;i++){var next=(out?out+' ':'')+parts[i];if(out&&next.length>280)break;out=next;}
  return out||text.slice(0,280).trim();
}
function questionOnlyElement(question,kind){
  question=String(question||'').replace(/\s+/g,' ').trim();if(!question)return null;
  var d=document.createElement('div');d.className='csai-learning-question csai-'+kind+'-question';d.setAttribute('data-csai-practice-guide',kind);d.setAttribute('data-csai-learning-question',kind);
  d.innerHTML='<b>Question</b><p>'+esc(question)+'</p>';
  return d;
}
function lessonQuestionFor(el,meta){
  var title=titleOf(el),t=norm(title),p=(meta&&meta.practice)||{},tools=arr(p.tools).map(norm),focus=arr(p.focus),all=(t+' '+tools.join(' '));
  if(/big o|complexity/.test(all))return'You have two possible solutions for the same problem. How would you compare how their time or extra memory grows as the input gets larger, and which growth rate would be acceptable for the expected scale?';
  if(/reference|alias|identity|memory pointer/.test(all))return'Two Python variables may refer to the same object or to separate objects with equal values. How can you tell the difference, and what can change when one name mutates a shared object?';
  if(/array|python lists|\blist\b/.test(all))return'You need an ordered collection whose items can be accessed by position. When is an array/list a good fit, what operations are fast, and what operations become more expensive when items must be shifted?';
  if(/linked list/.test(all))return'You need a sequence where nodes are connected by references instead of stored as one contiguous block. When would a linked list fit better than an array, and what trade-off do you make for access by position?';
  if(/stack|lifo/.test(all)&&/queue|fifo/.test(all))return'You need to process items in a particular order. When should you choose last-in-first-out behavior instead of first-in-first-out behavior, and what real task would each structure model?';
  if(/binary search/.test(all))return'You have sorted data and need to find a target efficiently. What condition lets you use binary search, how does the search range change, and what result should you return when the target is absent?';
  if(/linear search/.test(all))return'You need to find a value in data that may not be sorted. How would a linear search inspect the collection, and what result should it produce if the value is not present?';
  if(/tree|bst|binary tree/.test(all))return'You need to represent hierarchical data as connected nodes. What relationship should each node store, how would you traverse the structure, and what result should a correct traversal produce?';
  if(/graph|bfs|dfs/.test(all))return'You need to model items connected by relationships and explore them without missing or repeatedly visiting nodes. What information should the graph store, and when would BFS or DFS be the better traversal?';
  if(/recurs/.test(all))return'You have a problem that can be expressed as a smaller version of itself. What is the base case, what smaller input is passed to the next call, and what result should be combined or returned?';
  if(/prefix sum/.test(all))return'You need to answer cumulative or range-sum questions efficiently. What running information should you precompute, and how would that stored information help you answer later queries?';
  if(/two pointer/.test(all))return'You can solve a sequence problem by tracking two positions at once. Where should the pointers start, what condition moves each one, and what result tells you the task is finished?';
  if(/sliding window/.test(all))return'You need to examine many overlapping contiguous ranges without recomputing each range from scratch. What information should the current window maintain as its boundaries move?';
  if(/dynamic programming|\bdp\b/.test(all))return'The problem repeats the same smaller subproblems. What state should be remembered, how does one state depend on earlier states, and what final state contains the answer?';
  if(/greedy/.test(all))return'You need to make a sequence of local choices without revisiting earlier decisions. What makes a locally best choice safe for this problem, and how would you verify the final result is still globally correct?';
  if(/backtrack/.test(all))return'You need to explore possible choices and undo a choice when it cannot lead to a valid result. What state must be changed before exploring a branch and restored when you return?';
  if(/tuple/.test(all))return'You have a small fixed group of related values that should stay together. When is a tuple more appropriate than a list, and how can unpacking or multiple return values make the data easier to use?';
  if(/\bset\b|uniqueness|intersection|union/.test(all))return'You care about unique values or fast membership checks rather than duplicate entries. When is a set the right structure, and what information is lost compared with an ordered sequence?';
  if(/dictionary|\bdict\b|hash map|mapping/.test(all))return'You need to store or update information by a meaningful key. What should the keys and values represent, and when is direct key lookup more useful than scanning a list?';
  if(/condition|if elif else|branch/.test(all))return'Your program needs to choose different behavior depending on data or state. What conditions should be checked, which cases are mutually exclusive, and what should happen in the fallback case?';
  if(/loop|iteration|\bfor\b|\bwhile\b/.test(all))return'You need to repeat work over data or until a condition changes. What determines how many times the loop runs, what state changes each time, and what condition stops it?';
  if(/function|parameter|argument|return/.test(all))return'You need reusable behavior that accepts input and produces a result. What should become parameters, what should the function return, and why is this cleaner than repeating the same logic?';
  if(/comprehension/.test(all))return'You need to build a new collection from existing data. What expression creates each new item, what collection is being traversed, and is there a condition that decides which items are included?';
  if(/generator|yield|iterator/.test(all))return'You need values to be produced only when requested instead of storing the entire result at once. What state must be preserved between values, and when is that useful for large or streaming data?';
  if(/join|sql join/.test(all))return'You have related rows stored in different tables. Which columns connect the tables, what kind of join matches the requirement, and what rows should appear in the result?';
  if(/group by|aggregate/.test(all))return'You need summary information for groups of rows rather than one result per raw row. What defines each group, which aggregate should be calculated, and what should one output row represent?';
  if(/transaction|acid|isolation/.test(all))return'Several database changes must behave as one reliable unit of work. What must happen on success, what must happen on failure, and what concurrent behavior must remain safe?';
  if(/index/.test(all)&&/database|sql/.test(all))return'You need faster database lookups without changing the logical result of the query. Which columns are searched or sorted often enough to justify an index, and what write/storage trade-off does the index introduce?';
  if(/rag|retrieval augmented/.test(all))return'You need an AI answer to use external evidence. What should be retrieved, how should that evidence reach the model, and what would show that the final answer is actually grounded in the retrieved information?';
  if(/embedding/.test(all))return'You need to represent items as vectors so similar meaning can be compared numerically. What is being embedded, how will similarity be measured, and what downstream task uses that comparison?';
  if(/classification/.test(all))return'You need a model to choose one label from known categories. What features go in, what label should come out, and which evaluation result would show the classifier is useful?';
  if(/regression/.test(all))return'You need a model to predict a numeric value. What features go in, what continuous target should come out, and which error metric would tell you how close the predictions are?';
  if(/transformer|attention/.test(all))return'You need a model to relate information across positions in a sequence. What representations enter the attention step, what relationships should it learn to emphasize, and what output does the next stage receive?';
  if(/agent|tool calling/.test(all))return'You need an AI system to decide when to use tools and carry out more than one step. What information should guide the decision, what tool result comes back, and how will you verify the final action is correct?';
  if(/git|branch|commit|merge/.test(all))return'You are changing a shared codebase. What should be saved as a commit, when should work be isolated on a branch, and how would you verify a merge did not lose or break changes?';
  if(/docker|container/.test(all))return'You need an application to run consistently in an isolated environment. What must be packaged into the container image, what configuration belongs outside it, and how would you verify the container starts correctly?';
  if(/kubernetes|pod|deployment/.test(all))return'You need to run and maintain containerized workloads across a cluster. What desired state should be declared, what resource actually runs the workload, and what observation would show the deployment is healthy?';
  if(/process|thread|concurrency/.test(all))return'More than one unit of work may make progress at the same time. What state is shared, what can run independently, and what race or coordination problem must be prevented?';
  if(/cache/.test(all))return'You want repeated access to be faster by keeping a copy of useful data closer to where it is needed. What should be cached, when is the cached value valid, and what should happen when it becomes stale?';
  if(/security|authentication|authorization/.test(all))return'A system must decide who a user is and what that user is allowed to do. What evidence establishes identity, what rule grants or denies access, and what should happen when the check fails?';
  var f=focus.length?String(focus[0]):'';
  return'You are working on a problem involving '+title+'. When is this lesson idea the right tool, what should it do to the input or system state, and what observable result would show it worked correctly'+(f?' while '+f:'')+'?';
}
function guideElement(g,kind){
  /* v5.72: one visible Question block only, with no extra badge or workflow panels. */
  if(!g||kind==='example'||kind==='quiz')return null;
  return questionOnlyElement(g.question,kind);
}

function codeText(node){if(!node)return'';return 'value' in node?String(node.value||''):String(node.textContent||'')}
function cleanMeaning(v){return String(v||'').replace(/`([^`]+)`/g,'$1').replace(/\s+/g,' ').trim()}
function pythonFriendlyAction(raw){
  var t=String(raw||'').replace(/\s+#.*$/,'').trim(),m;
  if(!t||/^#/.test(t))return'';
  if((m=t.match(/^for\s+[A-Za-z_]\w*\s+in\s+range\(\s*(-?\d+)\s*\)\s*:\s*$/))){var stop=Number(m[1]);if(stop>0)return'Repeat the indented block '+stop+' times, moving through the numbers from 0 through '+(stop-1)+' one at a time.';return'The requested count does not produce a normal forward repetition, so the indented block does not run.';}
  if((m=t.match(/^for\s+[A-Za-z_]\w*\s+in\s+range\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)\s*:\s*$/)))return'Repeat the indented block using the numbers from '+m[1]+' up to, but not including, '+m[2]+'.';
  if((m=t.match(/^for\s+[A-Za-z_]\w*\s+in\s+range\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)\s*:\s*$/)))return'Repeat the indented block from '+m[1]+' toward '+m[2]+', changing the current number by '+m[3]+' each turn and stopping before the end boundary is crossed.';
  if(/^for\s+[^:]+?\s+in\s+enumerate\(.+\)\s*:\s*$/.test(t))return"Go through the collection one item at a time while keeping track of both each item's position and its value.";
  if((m=t.match(/^if\s+[A-Za-z_]\w*\s*==\s*(.+?)\s*:\s*break\s*$/)))return'When the current value becomes '+cleanMeaning(m[1])+', stop the repetition immediately. The rest of the program can keep running afterward.';
  if((m=t.match(/^if\s+[A-Za-z_]\w*\s*==\s*(.+?)\s*:\s*continue\s*$/)))return'When the current value is '+cleanMeaning(m[1])+', skip the rest of that turn and move to the next turn.';
  if(/^break\s*$/.test(t))return'Stop the current repetition immediately, then continue with whatever comes after that repeated section.';
  if(/^continue\s*$/.test(t))return'Skip the rest of the current turn and move straight to the next turn.';
  if(/^while\s+.+:\s*$/.test(t))return'Keep repeating the indented block while the stated condition remains true.';
  if(/^if\s+.+:\s*$/.test(t))return'Check the stated condition; run the indented block only when that condition is true.';
  if(/^elif\s+.+:\s*$/.test(t))return'If the earlier condition did not match, check another condition before choosing what happens next.';
  if(/^else\s*:\s*$/.test(t))return'Use this fallback path when the earlier conditions did not match.';
  if(/^def\s+/.test(t))return'Create a reusable operation that can receive information and perform the indented work when it is used later.';
  if(/^class\s+/.test(t))return'Create a reusable type that groups related information and behavior together.';
  if(/^return\b/.test(t))return'Send the result back to the part of the program that requested this operation.';
  if(/^import\s+|^from\s+\S+\s+import\s+/.test(t))return'Make the outside library capability needed by this example available.';
  if(/^try\s*:\s*$/.test(t))return'Attempt the indented work while preparing to handle a possible failure safely.';
  if(/^except\b/.test(t))return'Handle the expected failure here instead of letting the program end unexpectedly.';
  if(/^with\s+.+:\s*$/.test(t))return'Use an external resource for this block and make sure it is cleaned up when the block finishes.';
  if(/^print\s*\(/.test(t))return'Display the current result at this point.';
  if(/\binput\s*\(/.test(t))return'Receive information from the user so the program can use it in the next steps.';
  if(/^[A-Za-z_]\w*\s*=\s*.+$/.test(t))return'Store a value so it can be used or changed later in the example.';
  if(/\.append\s*\(/.test(t))return'Add one new item to the end of the current collection.';
  return'';
}
function behaviorFromPurpose(purpose,raw,lang){
  var p=cleanMeaning(purpose).toLowerCase(),t=String(raw||'').trim();
  if(!p)return'';
  if(/imports?|module/.test(p))return'Make the outside capability needed by this example available.';
  if(/defines? .*function|reusable function|asynchronous function/.test(p))return'Create a reusable operation that can receive information and perform work later.';
  if(/defines? .*class|custom type/.test(p))return'Create a reusable type that groups related information and behavior.';
  if(/starts? .*loop|repeats? .*while|iteration/.test(p))return'Repeat the following work according to the sequence or condition described by the example.';
  if(/condition|fallback branch|checks? an additional/.test(p))return'Choose which work happens next based on whether the current condition is satisfied.';
  if(/ends? .*function|sends? a value back|return/.test(p))return'Send the finished result back to the part of the program that requested it.';
  if(/standard output|print|writes? values|display/.test(p))return'Display the current result.';
  if(/standard input|reads? values|user input/.test(p))return'Receive information from the user or input source.';
  if(/assignment|stored|updates? the existing value/.test(p))return'Store or update information that later steps will use.';
  if(/protected block|catches? .*exception|failure/.test(p))return'Handle a possible failure so the overall task can continue safely.';
  if(/select|rows|result set|query/.test(p)&&lang==='sql')return'Read or transform the stored data so the requested result can be produced.';
  if(/join/.test(p)&&lang==='sql')return'Combine related information from different data sources.';
  if(/group|aggregate/.test(p)&&lang==='sql')return'Combine related rows into groups so a summary can be calculated.';
  if(/order/.test(p)&&lang==='sql')return'Arrange the result in the required order.';
  if(/html element|opening tag|closing tag/.test(p))return'Add to or finish part of the page structure.';
  if(/css/.test(p))return'Apply the next layout or visual rule to the page.';
  if(/git/.test(p))return'Inspect or change the saved history/state of the project.';
  if(/http request|url|response/.test(p))return'Send or receive information across a network request.';
  if(/container|image/.test(p)&&lang==='dockerfile')return'Configure how the application environment is built or started.';
  if(/json/.test(p)||/yaml/.test(p))return'Build or read one part of the structured data/configuration.';
  return'';
}
function plainEnglishForCode(node){
  var code=codeText(node);if(!code.trim())return[];
  var api=window.CSAILineExplainer,lang='';
  try{lang=api&&api.inferLanguage?api.inferLanguage(code,'',node):''}catch(e){}
  var records=[];
  try{if(api&&api.explain)records=api.explain(code,lang||'text')}catch(e){}
  if(!records.length)records=code.split(/\r?\n/).map(function(line,i){return{number:i+1,code:line,purpose:''}});
  var out=[],seen={};
  records.forEach(function(r){var raw=String(r.code||''),trim=raw.trim();if(!trim||/^#/.test(trim)||/^\/\//.test(trim)||/^--/.test(trim))return;var meaning='';if(lang==='python')meaning=pythonFriendlyAction(raw);if(!meaning)meaning=behaviorFromPurpose(r.purpose,raw,lang);if(!meaning)return;meaning=cleanMeaning(meaning);var key=meaning.toLowerCase();if(!meaning||seen[key])return;seen[key]=1;out.push(meaning)});
  return out;
}
function guideWithCodeMeaning(g,node,label){
  if(!g)return g;var meanings=plainEnglishForCode(node);if(!meanings.length)return g;
  var copy={};for(var k in g)copy[k]=g[k];copy.plainEnglish=meanings;copy.plainEnglishTitle=label||g.plainEnglishTitle||'What this code means in plain English';return copy;
}
function codeNodeIn(card){return card&&card.querySelector('pre.code,pre.dcv-code,pre,[data-csai-language-generated],.csai-language-code,textarea[data-project-editor],textarea[data-dual-editor],textarea.csai-code-editor,textarea.oa-editor,textarea[data-evergreen-code],textarea.answer')}
function fetchJson(url){return fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json()})}
function loadIndex(){if(!indexPromise)indexPromise=fetchJson(INDEX_URL).catch(function(e){console.warn('[CS AI Mastery] Practice guidance index failed',e);return{courses:[]}});return indexPromise}
function guideUrl(id){return ASSET_ROOT?new URL('practice-guidance/'+encodeURIComponent(id)+'.json',ASSET_ROOT).href:'assets/practice-guidance/'+encodeURIComponent(id)+'.json'}
function loadCourse(id){if(courseCache[id])return Promise.resolve(courseCache[id]);return fetchJson(guideUrl(id)).then(function(d){courseCache[id]=d;return d})}
function metaCourseId(){
  var nodes=[document.getElementById('course-page-meta'),document.getElementById('csai-project-data')];
  for(var i=0;i<nodes.length;i++){
    var n=nodes[i];if(!n)continue;
    try{var d=JSON.parse(n.textContent||'{}'),id=d.id||d.courseId;if(id)return String(id)}catch(e){}
  }
  return'';
}
function directTitle(){
  var root=document.getElementById('csai-direct-course-view');if(!root)return'';
  var aria=String(root.getAttribute('aria-label')||'').replace(/\s+course\s*$/i,'').trim();if(aria)return aria;
  var h=root.querySelector('.dcv-hero h1');return h?String(h.textContent||'').replace(/^[^A-Za-z0-9]+/,'').trim():'';
}
async function detectId(){
  var id=metaCourseId();if(id)return id;
  var t=directTitle();if(!t)return'';
  var idx=await loadIndex(),nt=norm(t),best='';
  arr(idx.courses).forEach(function(c){var ct=norm(c.title);if(nt===ct||nt.endsWith(' '+ct)||nt.indexOf(ct)>=0){if(!best||ct.length>norm(best.title).length)best=c}});
  return best&&best.id?String(best.id):'';
}
function mapByTitle(items){var m={};arr(items).forEach(function(x,i){var k=norm(x.title);if(k&&!m[k])m[k]={item:x,index:i}});return m}
function findByTitle(items,node,index){
  var m=mapByTitle(items),t=norm(titleOf(node));
  if(t&&m[t])return m[t].item;
  if(t){for(var k in m){if(k&&t.indexOf(k)>=0||k&&k.indexOf(t)>=0)return m[k].item}}
  return arr(items)[index]||null;
}
function heading(section){var h=section&&section.querySelector(':scope > h2,:scope > h3');return h?String(h.textContent||'').trim():''}
function sections(pattern){return Array.from(document.querySelectorAll('section.card,.dcv-card')).filter(function(s){return pattern.test(heading(s))})}
function insertBeforeAnswer(card,g){
  var target=card.querySelector('textarea,.answer,[data-project-editor]');
  if(target&&target.parentNode===card)card.insertBefore(g,target);else if(target)target.insertAdjacentElement('beforebegin',g);else card.appendChild(g);
}
function fallbackTools(blob){
  var s=norm(blob),out=[];
  function add(re,vals){if(re.test(s))out=out.concat(vals)}
  add(/expense|budget|spending/,['list of dictionaries','while-loop menu','functions','json','input validation']);
  add(/list|array/,['list/array','loop']);add(/dict|hash|frequency|count/,['dictionary/hash map','loop']);
  add(/while/,['while loop']);add(/loop|iterate|each|every/,['for loop']);add(/condition|fizz|compare/,['if / elif / else']);
  add(/file|save|load|persist/,['file handling','with/open or equivalent','error handling']);add(/json/,['json module']);
  add(/exception|error|invalid|fail/,['validation','try / except or explicit error path']);add(/class|object|oop/,['class/object','methods']);
  add(/sql|query|table|join/,['schema/table','SQL query','result verification']);add(/api|endpoint/,['request/response','validation','error/status handling']);
  add(/test|debug/,['small test case','edge case','failure case']);add(/graph|bfs|dfs/,['adjacency structure','visited set','BFS/DFS']);
  var seen={};return out.filter(function(x){var k=x.toLowerCase();if(seen[k])return false;seen[k]=1;return true}).slice(0,6)
}
function fallbackGuide(kind,node){
  var tools=fallbackTools(String(node.textContent||''));
  var names={course:'Course requirements — what you must be able to do',lesson:'Lesson requirements — what you must be able to do',example:'Example requirements — what you must do',exercise:'Exercise question — what your answer must do',project:'Project question — what your finished work must do',quiz:'Knowledge-check requirements — what you must determine'};
  var intros={course:'Treat this course like exam preparation: satisfy the requirements with your own work.',lesson:'Meet these lesson requirements without memorizing a provided answer.',example:'Treat the example like a trace-and-apply exam question.',exercise:'Treat this like an exam question: satisfy the requested behavior or answer, but write the solution yourself.',project:'Treat this like an exam question: meet the required behavior, but write the solution yourself.',quiz:'Treat this like a short exam item and justify the answer from the course concept.'};
  var base={title:names[kind]||'Requirements — what you must do',intro:intros[kind]||'Meet the requirements below with your own work.',plainEnglishTitle:'In plain English',plainEnglish:['Read this as a description of the behavior you should understand or produce; decide the exact code yourself.'],focus:semanticFocus(tools),tools:tools,steps:[],requirements:[],checkpoint:''};
  if(kind==='course'){
    base.requirements=['You must be able to explain and apply the main concepts taught in the course.','Every lesson must be understood well enough to apply its idea to a new small case.','Every example must be predictable/explainable and reproducible with different values or data.','Every exercise and project must satisfy its stated behavior using your own solution.','Every knowledge-check answer must be justifiable from a course rule or concept.'];base.checkpoint='You can demonstrate the course ideas on unfamiliar inputs or a new task.';
  }else if(kind==='lesson'){
    base.requirements=['You must be able to state what this lesson is teaching.','You must be able to determine and explain the result/effect of a small example from the lesson.','You must be able to explain the behavior this lesson is teaching without repeating the exact code words from its example.','You must be able to create or complete a different small case using the same idea.','You must be able to identify a relevant mistake, invalid case, limitation, or edge case.'];base.checkpoint='You can apply the lesson idea without copying its example.';
  }else if(kind==='example'){
    base.requirements=['Before checking, determine or predict what the example will output, return, change, create, query, or otherwise do.','Describe what the important actions mean in ordinary language without naming the exact variable or code keyword.','Explain how the input/data/state changes from the beginning to the end.','Change one meaningful input/value/condition and determine the new expected result.','Create a separate small example using the same concept with different data.'];base.checkpoint='You can predict, explain, modify, and recreate the idea.';
  }else if(kind==='project'){
    base.requirements=['The finished project must perform the behavior described in the project statement.','Choose the implementation yourself; the guidance should describe the required behavior rather than name the exact code construct to use.','The required inputs, outputs, or visible behavior must be demonstrated clearly.','Relevant invalid input or failure cases must be handled without corrupting the result.','You must be able to demonstrate the finished project and explain how your own solution meets every requirement.'];base.checkpoint='Every stated requirement can be demonstrated and explained.';
  }else if(kind==='quiz'){
    base.requirements=['Determine which option correctly answers the question using the course material.','Base the decision on the related behavior or rule rather than matching familiar syntax words.','State why the selected answer is correct.','Explain why at least one competing option does not fit.'];base.checkpoint='You can justify your choice before viewing the answer key.';
  }else{
    base.requirements=['Your submission must produce the behavior or answer requested by the exercise for a normal valid case.','Choose an implementation that produces the requested behavior without relying on a syntax hint from the guidance.','The required input/output or question/answer relationship must be preserved.','Check a relevant boundary, invalid, empty, duplicate, missing-data, or failure case when applicable.','You must be able to explain why your own answer satisfies the exercise.'];base.checkpoint='The requested behavior can be demonstrated and explained.';
  }
  base.steps=base.requirements;
  return base;
}
function enhanceCourseGuide(data){
  var host=document.querySelector('#csai-direct-course-view .dcv-hero')||document.querySelector('main.wrap > .hero,main .hero');if(!host||host.parentNode.querySelector(':scope > [data-csai-course-guide]'))return;
  var g=guideElement(data.course,'course');if(!g)return;g.setAttribute('data-csai-course-guide','1');host.insertAdjacentElement('afterend',g);
}
function enhanceLessons(data){
  var lessonEls=Array.from(document.querySelectorAll('details.lesson,details.dcv-lesson'));
  lessonEls.forEach(function(el){
    var lid=el.getAttribute('data-lesson')||el.getAttribute('data-dcv-lesson')||String(el.id||'').replace(/^lesson-/,'');
    var meta=data.lessons&&data.lessons[lid];if(!meta)return;
    var body=el.querySelector('.body,.dcv-body');if(!body)return;
    if(!body.querySelector(':scope > [data-csai-practice-guide="lesson"]')){
      var lessonPractice=Object.assign({},meta.practice||{});lessonPractice.question=lessonQuestionFor(el,meta);var lg=guideElement(lessonPractice,'lesson');if(lg)body.insertBefore(lg,body.firstChild)
    }
    var pres=Array.from(body.querySelectorAll('pre.code,pre.dcv-code')).filter(function(p){return !p.closest('[data-csai-practice-guide],.csai-study-example')});
    pres.forEach(function(pre,i){var prev=pre.previousElementSibling;if(prev&&prev.matches('[data-csai-example-guide-for="'+i+'"]'))return;var eg=(meta.examples||[])[i];if(!eg)return;var eg2=guideWithCodeMeaning(eg,pre,'What this code means in plain English');var g=guideElement(eg2,'example');if(g){g.setAttribute('data-csai-example-guide-for',String(i));pre.insertAdjacentElement('beforebegin',g)}});
  });
}
function enhanceExerciseSections(data){
  sections(/^Exercises$/i).forEach(function(sec){
    var cards=Array.from(sec.querySelectorAll(':scope > .item,:scope > .oa-task,:scope > [data-exercise]'));
    cards.forEach(function(card,i){if(card.querySelector(':scope > [data-csai-practice-guide="exercise"]'))return;var m=findByTitle(data.exercises,card,i),base=m&&m.practice?m.practice:fallbackGuide('exercise',card),source=codeNodeIn(card),g=guideElement(guideWithCodeMeaning(base,source,'What the starter code means in plain English'),'exercise');if(g)insertBeforeAnswer(card,g)});
  });
  Array.from(document.querySelectorAll('.oa-task,[data-exercise],.exercise-card,.task-card')).forEach(function(card,i){
    if(card.closest('[data-csai-practice-guide]')||card.querySelector(':scope > [data-csai-practice-guide="exercise"]'))return;
    if(card.closest('.project-card,[data-project]'))return;
    var m=findByTitle(data.exercises,card,i),base=m&&m.practice?m.practice:fallbackGuide('exercise',card),source=codeNodeIn(card),g=guideElement(guideWithCodeMeaning(base,source,'What the starter code means in plain English'),'exercise');if(g)insertBeforeAnswer(card,g);
  });
}
function enhanceProjects(data){
  var cards=Array.from(document.querySelectorAll('.project-card[data-project-index],.project-card[data-project]'));
  cards.forEach(function(card,i){
    if(card.querySelector(':scope > [data-csai-practice-guide="project"]'))return;
    var idx=Number(card.getAttribute('data-project-index'));if(!Number.isFinite(idx))idx=i;
    var m=findByTitle(data.projects,card,idx),base=m&&m.practice?m.practice:fallbackGuide('project',card),source=codeNodeIn(card),g=guideElement(guideWithCodeMeaning(base,source,'What the starter code means in plain English'),'project');if(!g)return;
    var head=card.querySelector(':scope > .project-head');if(head)head.insertAdjacentElement('afterend',g);else card.insertBefore(g,card.firstChild);
  });
  sections(/^Projects$/i).forEach(function(sec){
    var cards2=Array.from(sec.querySelectorAll(':scope > .item,.dcv-item')).filter(function(x){return !x.closest('.project-card')});
    cards2.forEach(function(card,i){if(card.querySelector(':scope > [data-csai-practice-guide="project"]'))return;var m=findByTitle(data.projects,card,i),base=m&&m.practice?m.practice:fallbackGuide('project',card),source=codeNodeIn(card),g=guideElement(guideWithCodeMeaning(base,source,'What the starter code means in plain English'),'project');if(g)card.appendChild(g)});
  });
}
function enhanceQuiz(data){
  sections(/^(Knowledge checks|Knowledge Checks|Quiz|Checkpoints)$/i).forEach(function(sec){
    var cards=Array.from(sec.querySelectorAll(':scope > .item,:scope > .dcv-item'));
    cards.forEach(function(card,i){if(card.querySelector(':scope > [data-csai-practice-guide="quiz"]'))return;var m=arr(data.quiz)[i],base=m&&m.practice?m.practice:fallbackGuide('quiz',card),source=codeNodeIn(card),g=guideElement(guideWithCodeMeaning(base,source,'What the code in this question means in plain English'),'quiz');if(g)insertBeforeAnswer(card,g)});
  });
}
function enhance(data){if(!data)return;addStyle();enhanceCourseGuide(data);enhanceLessons(data);enhanceExerciseSections(data);enhanceProjects(data);enhanceQuiz(data)}
async function scan(){
  scanTimer=0;
  var id='';try{id=await detectId()}catch(e){console.warn('[CS AI Mastery] Could not detect course for guidance',e);return}
  if(!id)return;
  if(activeId!==id||!activeData){
    if(loadingId===id)return;loadingId=id;
    try{var d=await loadCourse(id);activeId=id;activeData=d;enhance(d)}catch(e){console.warn('[CS AI Mastery] Practice guidance failed for '+id,e)}finally{loadingId=''}
  }else enhance(activeData);
}
function schedule(){if(scanTimer)return;scanTimer=setTimeout(scan,80)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
new MutationObserver(function(records){var selector='details.lesson,details.dcv-lesson,.oa-task,[data-exercise],.project-card[data-project-index],.project-card[data-project],.assessment-section';for(var i=0;i<records.length;i++){var nodes=Array.from(records[i].addedNodes||[]);for(var j=0;j<nodes.length;j++){var n=nodes[j];if(!n||n.nodeType!==1)continue;if((n.matches&&n.matches(selector))||(n.querySelector&&n.querySelector(selector))){schedule();return}}}}).observe(document.documentElement,{childList:true,subtree:true});
window.CSAIPracticeGuidance={rescan:schedule,getCourse:function(){return activeData},plainEnglishForCode:plainEnglishForCode,pythonFriendlyAction:pythonFriendlyAction,semanticFocus:semanticFocus};
})();
