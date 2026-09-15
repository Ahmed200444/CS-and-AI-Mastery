(function(){
'use strict';

var node=document.getElementById('csai-assessment-data');
if(!node)return;
var DATA={};
try{DATA=JSON.parse(node.textContent||'{}')}catch(e){return}
var courseId=String(DATA.courseId||'course');
var exercises=Array.isArray(DATA.exercises)?DATA.exercises:[];
var quiz=Array.isArray(DATA.quiz)?DATA.quiz:[];
var structured=DATA.structured||{};

function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(v){return String(v||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function keyFor(item,index){return item&&item.id?String(item.id):'exercises-'+index}
function first(v){return Array.isArray(v)?v[0]:v}
function languageFor(task){var select=task&&task.querySelector('[data-lang]');if(select)return select.value;var file=task&&task.querySelector('[data-file-label]');if(file){var t=file.textContent||'';if(/\.py$/i.test(t))return'python';if(/\.js$/i.test(t))return'javascript';if(/\.sql$/i.test(t))return'sql';if(/\.html$/i.test(t))return'html'}return DATA.defaultLanguage||'text'}

var MANUAL={
 python:{
  'sum a list':['Start a variable at 0 to hold the running total.','Go through the numbers one at a time with a normal for loop.','Add each number to the running total.','Return the total only after the loop finishes.'],
  'fizzbuzz':['Create an empty list to store the answers.','Loop from 1 through n.','Check multiples of both 3 and 5 first, because those numbers also match the individual 3 and 5 conditions.','Add FizzBuzz, Fizz, Buzz, or the number itself to the list.','Return the completed list after the loop.'],
  'word frequency':['Create an empty dictionary for the counts.','Split the text into individual words.','Visit each word one at a time.','If the word already exists in the dictionary, increase its count; otherwise start it at 1.','Return the dictionary when every word has been counted.'],
  'fix a type error':['The values begin as strings, so arithmetic would not behave like normal number addition.','Convert each string to an integer first.','Add the two integers and print the result.'],
  'write a list comprehension':['Start with an empty result list.','Loop through the numbers normally so each step is easy to see.','Calculate the square of the current number.','Append that square to the result list.'],
  'safe dictionary access':['Check whether the key exists before reading it.','If the key exists, use its value.','Otherwise handle the missing-key case instead of causing a KeyError.'],
  'catch a specific exception':['Put the risky division inside try.','If the division succeeds, use the answer normally.','If b is zero, Python raises ZeroDivisionError and the except block handles only that expected problem.'],
  'fix the mutable default argument bug':['Use None as the default instead of creating a list in the function definition.','When no list is supplied, create a fresh list inside the function.','Append the new item to that fresh list and return it.','This prevents data from one call leaking into later calls.']
 },
 dsa:{
  'two sum':['Use a dictionary to remember numbers you have already seen and their indexes.','For each number, calculate the value needed to reach the target.','If that needed value is already in the dictionary, you have found the two indexes.','Otherwise store the current number and index, then continue.','This avoids checking every pair and gives O(n) average time.'],
  'valid parentheses':['Use a stack to remember opening brackets.','Push every opening bracket onto the stack.','When a closing bracket appears, pop the most recent opening bracket and check that the pair matches.','If the stack is empty too early or a pair does not match, return False.','At the end, the stack must be empty for the string to be valid.'],
  'longest substring w o repeat':['Keep a sliding window with left and right boundaries.','Move the right boundary through the string one character at a time.','When a repeated character is inside the current window, move the left boundary past its previous position.','Track the largest window length seen so far.','Because each boundary only moves forward, the algorithm runs in O(n) time.']
 }
};

function codeSteps(solution,lang){
 var s=String(solution||''),steps=[];
 if(lang==='python'){
  if(/^\s*def\s+/m.test(s))steps.push('The function receives the input from the problem and keeps the logic in one reusable place.');
  if(/=\s*\[\]/.test(s))steps.push('It creates an empty list first, then fills that list as the algorithm runs.');
  if(/=\s*\{\}/.test(s))steps.push('It creates an empty dictionary so values can be stored and looked up by key.');
  if(/=\s*0\b/.test(s))steps.push('It starts a counter or running total at 0 before processing the input.');
  if(/\bfor\s+.+\s+in\s+/.test(s))steps.push('A normal for loop processes the input one item at a time, which keeps the logic easy to follow.');
  if(/\bwhile\s+/.test(s))steps.push('The while loop repeats only while its condition is true, so each pass moves the solution closer to finishing.');
  if(/\bif\s+.+:/.test(s))steps.push('The if statements separate the important cases so each situation is handled explicitly.');
  if(/\.append\(/.test(s))steps.push('Each finished value is appended to the result list instead of using a compressed one-line expression.');
  if(/\breturn\s+/.test(s))steps.push('The return statement sends the final answer back only after the required work is complete.');
 }else if(lang==='javascript'){
  if(/function\s+|=>/.test(s))steps.push('The solution puts the logic in a function so the input can be processed and a result can be returned.');
  if(/for\s*\(|for\s+\(/.test(s))steps.push('A loop handles the values one at a time instead of hiding the work in a compressed expression.');
  if(/if\s*\(/.test(s))steps.push('The conditions handle each required case explicitly.');
  if(/\.push\(/.test(s))steps.push('The solution adds results to an array as they are produced.');
  if(/return\s+/.test(s))steps.push('The final value is returned after the processing is finished.');
 }else if(lang==='sql'){
  if(/\bSELECT\b/i.test(s))steps.push('SELECT chooses the columns or calculated values that should appear in the result.');
  if(/\bFROM\b/i.test(s))steps.push('FROM identifies the table that supplies the data.');
  if(/\bJOIN\b/i.test(s))steps.push('JOIN combines related rows from another table using the matching condition.');
  if(/\bWHERE\b/i.test(s))steps.push('WHERE removes rows that do not satisfy the required condition.');
  if(/\bGROUP BY\b/i.test(s))steps.push('GROUP BY places matching rows into groups so aggregate functions can be calculated correctly.');
  if(/\bORDER BY\b/i.test(s))steps.push('ORDER BY sorts the final rows into the requested order.');
 }else if(lang==='html'){
  steps.push('The HTML is written in clear structural sections so each part of the page has one purpose.');
  if(/<head[\s>]/i.test(s))steps.push('The head contains page-level information such as the title or metadata.');
  if(/<body[\s>]/i.test(s))steps.push('The body contains the content that the user actually sees.');
 }
 return steps.slice(0,5);
}

function explanationFor(item,index,task,solution){
 var title=norm(item&&item.title),manual=MANUAL[courseId]&&MANUAL[courseId][title];
 if(manual)return manual;
 var cfg=structured[keyFor(item,index)]||{};
 var explicit=first(cfg.whyItWorks)||first(item.whyItWorks)||first(cfg.explanation)||first(item.solutionExplanation)||first(item.rationale);
 if(explicit)return[String(explicit)];
 var lang=languageFor(task),steps=codeSteps(solution,lang);
 if(steps.length)return steps;
 var hint=first(item.hint)||first(cfg.hint);
 if(hint)return['The answer follows the same idea as the hint: '+String(hint),'The solution keeps that idea in the simplest direct form so each step is visible.'];
 return['The solution answers only what the prompt asks for, without adding unnecessary shortcuts.','It breaks the task into small direct steps so you can see how the final answer is produced.','Use the lesson above the exercise to connect each step back to the concept being practised.'];
}

function solutionText(panel){var pre=panel&&panel.querySelector('pre'),plain=panel&&panel.querySelector('.plain');return pre?pre.textContent:(plain?plain.textContent:'')}
function addExplanationToTask(task,index){
 var panel=task.querySelector('[data-solution-panel]');if(!panel||panel.querySelector('[data-solution-explanation]'))return;
 var item=exercises[index]||{},steps=explanationFor(item,index,task,solutionText(panel));
 var box=document.createElement('div');box.setAttribute('data-solution-explanation','');box.className='oa-explanation';
 box.innerHTML='<div class="oa-explanation-title">Why this works</div><ol>'+steps.map(function(step){return'<li>'+esc(step)+'</li>'}).join('')+'</ol>';
 panel.appendChild(box);
}

function quizExplanation(item){
 var explicit=first(item&&item.explanation)||first(item&&item.rationale)||first(item&&item.why)||first(item&&item.whyItWorks);
 if(explicit)return String(explicit);
 var q=String(item&&item.q||item&&item.question||item&&item.prompt||''),opts=Array.isArray(item&&item.options)?item.options:[],correct=Number(item&&item.correct),answer=Number.isFinite(correct)&&opts[correct]!=null?String(opts[correct]):'';
 if(/mutable/i.test(q)&&/list/i.test(answer))return'A list is mutable because its contents can be changed in place after the list is created, for example with append(), remove(), or item assignment.';
 if(/f["']?\{2\+2\}/i.test(q)&&answer.indexOf('4')>=0)return'An f-string evaluates the expression inside { } first. The expression 2 + 2 becomes 4, and that value is inserted into the string.';
 if(/range\(3\)/i.test(q))return'range(3) starts at 0 by default and stops before 3, so it produces 0, 1, 2.';
 if(/len\(\[1,2,3\]\)/i.test(q))return'len() counts how many items are in the list. The list contains three items, so the result is 3.';
 if(/\/\/\s*2|7 \/\/ 2/i.test(q))return'// is floor division in Python. It divides and rounds down to the nearest whole-number result, so 7 // 2 is 3.';
 if(/%\s*2|7 % 2/i.test(q))return'% returns the remainder after division. Dividing 7 by 2 leaves a remainder of 1.';
 if(answer)return'The correct answer is “'+answer+'”. It matches the rule or definition being tested in this question; compare it with the lesson directly above this knowledge check.';
 return'Review the lesson directly above this question: the revealed option follows the definition or rule explained there.';
}
function addExplanationToQuiz(card,index){
 var panel=card.querySelector('.quiz-solution');if(!panel||panel.querySelector('[data-answer-explanation]'))return;
 var box=document.createElement('div');box.setAttribute('data-answer-explanation','');box.className='quiz-explanation';box.innerHTML='<strong>Why:</strong> '+esc(quizExplanation(quiz[index]||{}));panel.appendChild(box);
}

function style(){if(document.getElementById('csai-reveal-explanation-style'))return;var s=document.createElement('style');s.id='csai-reveal-explanation-style';s.textContent=`
.oa-explanation{margin-top:12px;padding:13px 14px;border:1px solid var(--border);border-radius:10px;background:var(--panel);color:var(--text)}.oa-explanation-title{font-weight:900;margin-bottom:7px;color:var(--accent)}.oa-explanation ol{margin:0;padding-left:22px}.oa-explanation li{margin:5px 0;line-height:1.55}.quiz-explanation{margin-top:9px;padding-top:9px;border-top:1px solid var(--border);font-weight:500;line-height:1.55;color:var(--text)}.quiz-explanation strong{color:var(--accent)}
`;document.head.appendChild(s)}
function enhance(){style();Array.from(document.querySelectorAll('.assessment-stack .oa-task')).forEach(addExplanationToTask);Array.from(document.querySelectorAll('.quiz-card')).forEach(addExplanationToQuiz)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
setTimeout(enhance,350);setTimeout(enhance,900);
})();
