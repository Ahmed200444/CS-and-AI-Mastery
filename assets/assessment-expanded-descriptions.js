(function(){
'use strict';

var node=document.getElementById('csai-assessment-data');
if(!node)return;
var DATA={};
try{DATA=JSON.parse(node.textContent||'{}')}catch(e){return}
var courseId=String(DATA.courseId||'course');
var exercises=Array.isArray(DATA.exercises)?DATA.exercises:[];
var structured=DATA.structured||{};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function keyFor(item,index){return item&&item.id?String(item.id):'exercises-'+index}
function norm(v){return String(v||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function firstLine(v){return String(v||'').split(/\r?\n/).find(function(x){return x.trim()})||''}
function languageFor(task){var s=task.querySelector('[data-lang]');if(s)return s.value;var f=task.querySelector('[data-file-label]');var t=f?f.textContent:'';if(/\.py$/i.test(t))return'python';if(/\.js$/i.test(t))return'javascript';if(/\.sql$/i.test(t))return'sql';if(/\.html$/i.test(t))return'html';return DATA.defaultLanguage||'text'}
function signature(item,cfg,lang){var starter=(cfg&&cfg.starter)||item.starter||'';var line=firstLine(starter).trim();if(!line)return'';if(lang==='python'&&/^def\s+/.test(line))return line.replace(/:$/,'');if(lang==='javascript'&&(/function\s+/.test(line)||/=>/.test(line)))return line;if(lang==='sql')return'';return''}
function addStyle(){if(document.getElementById('csai-expanded-spec-style'))return;var s=document.createElement('style');s.id='csai-expanded-spec-style';s.textContent=`
.oa-spec{margin:14px 0 0;border-top:1px solid var(--border);padding-top:14px}.oa-spec h4{margin:0 0 5px;font-size:.82rem;letter-spacing:.04em;text-transform:uppercase;color:var(--accent)}.oa-spec p{margin:0 0 12px;line-height:1.65;white-space:normal!important}.oa-spec ul{margin:4px 0 13px;padding-left:20px}.oa-spec li{margin:4px 0;line-height:1.55}.oa-spec code{display:inline-block;max-width:100%;overflow-wrap:anywhere;padding:2px 6px;border-radius:6px;background:var(--code);color:#f4f7fb;font:500 .86rem/1.45 ui-monospace,SFMono-Regular,Consolas,monospace}.oa-example{margin-top:10px;padding:10px 11px;border:1px solid var(--border);border-radius:9px;background:var(--bg)}.oa-example b{display:block;margin-bottom:4px}.oa-original-prompt{font-weight:650}
`;document.head.appendChild(s)}

var SPECIAL={
 python:{
  'sum a list':{goal:'Complete the function so it calculates the total of all numbers in the input list.',result:'Return one number: the sum of every value in nums. Do not use Python\'s built-in sum() function.',example:'Example: nums = [1, 2, 3] → return 6.'},
  'fizzbuzz':{goal:'Complete fizzbuzz(n). Build the result for every integer from 1 through n, in order.',result:'Return a list. For a multiple of 3 use "Fizz"; for a multiple of 5 use "Buzz"; for a multiple of both use "FizzBuzz"; otherwise keep the number.',example:'Example: n = 5 → [1, 2, "Fizz", 4, "Buzz"].'},
  'word frequency':{goal:'Count how many times each word appears in the given string.',result:'Return a dictionary where each key is a word and each value is that word\'s count.',example:'Example: "a b a" → {"a": 2, "b": 1}.'}
 },
 dsa:{
  'two sum':{goal:'Given a list of integers and a target value, find two different positions whose values add up to the target.',result:'Return the two indices in a list. The test data expects a valid pair when one exists.',example:'Example: nums = [2, 7, 11, 15], target = 9 → return [0, 1].'},
  'valid parentheses':{goal:'Determine whether every opening bracket in the input string is closed by the correct type of bracket in the correct order.',result:'Return True when the bracket sequence is valid; otherwise return False.',example:'Example: "()[]{}" → True, while "([)]" → False.'}
 }
};

function genericSpec(item,index,task){
 var cfg=structured[keyFor(item,index)]||{},lang=languageFor(task),sig=signature(item,cfg,lang),prompt=String(item.prompt||item.description||item.title||'Complete the task.'),title=norm(item.title),special=SPECIAL[courseId]&&SPECIAL[courseId][title];
 if(special)return{prompt:prompt,goal:special.goal,result:special.result,example:special.example,signature:sig,lang:lang};
 var goal=prompt;
 var result='Produce exactly the result described in the task for every valid input used by the tests.';
 var rules=[];
 if(lang==='python'){
   if(sig){goal='Complete the provided Python function '+sig+'. '+prompt;rules.push('Keep the function name and parameters unchanged so the test runner can call it.');}
   result=/\bprint\b/i.test(prompt)?'Print exactly the output requested by the task.':'Return the requested value from your function. Do not rely on printed output unless the prompt specifically asks you to print.';
   rules.push('Your code should work for normal inputs and reasonable edge cases.');
 }else if(lang==='javascript'){
   result='Your JavaScript should produce the behavior or value described in the task.';rules.push('Keep any provided function name or interface unchanged.');
 }else if(lang==='sql'){
   goal='Write a SQL query that satisfies the requirement below. '+prompt;result='The query result should contain exactly the rows and columns required by the prompt.';rules.push('Return data with the requested filtering, grouping, sorting, or aggregation.');
 }else if(lang==='html'){
   goal='Build the requested HTML/CSS/JavaScript behavior described below. '+prompt;result='The preview should visibly match the requested structure or behavior.';
 }else{
   goal='Answer the task below clearly and completely. '+prompt;result='Your response should directly address the requested decision, explanation, or analysis.';rules.push('Use complete reasoning, but keep the response focused on the requirement.');
 }
 rules.push('Do not change the meaning of the requested output.');
 return{prompt:prompt,goal:goal,result:result,rules:rules,signature:sig,lang:lang};
}

function renderSpec(spec){
 var rules=(spec.rules&&spec.rules.length?spec.rules:[]);
 if(spec.signature)rules.unshift('The test runner will call <code>'+esc(spec.signature)+'</code> using different input values.');
 return '<div class="oa-spec">'+
   '<h4>Your task</h4><p>'+esc(spec.goal)+'</p>'+
   '<h4>Expected result</h4><p>'+esc(spec.result)+'</p>'+
   (rules.length?'<h4>Requirements</h4><ul>'+rules.map(function(r){return'<li>'+(/<code>/.test(r)?r:esc(r))+'</li>'}).join('')+'</ul>':'')+
   (spec.example?'<div class="oa-example"><b>Example</b>'+esc(spec.example)+'</div>':'')+
   '</div>';
}

function enhance(){
 addStyle();
 var tasks=Array.from(document.querySelectorAll('.assessment-stack .oa-task'));
 tasks.forEach(function(task,index){if(task.querySelector('.oa-spec'))return;var item=exercises[index]||{},promptBox=task.querySelector('.oa-prompt');if(!promptBox)return;var old=promptBox.querySelector('p');if(old)old.classList.add('oa-original-prompt');var spec=genericSpec(item,index,task);var wrapper=document.createElement('div');wrapper.innerHTML=renderSpec(spec);var hint=promptBox.querySelector('.oa-hint');if(hint)promptBox.insertBefore(wrapper.firstElementChild,hint);else promptBox.appendChild(wrapper.firstElementChild)})
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
setTimeout(enhance,350);
})();
