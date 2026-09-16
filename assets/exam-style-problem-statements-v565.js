(function(){
'use strict';
var node=document.getElementById('csai-assessment-data');
if(!node)return;
var DATA={};
try{DATA=JSON.parse(node.textContent||'{}')}catch(e){return}
var exercises=Array.isArray(DATA.exercises)?DATA.exercises:[];
var structured=DATA.structured||{};
var courseId=String(DATA.courseId||'');
function norm(v){return String(v||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function words(v){return String(v||'').trim().split(/\s+/).filter(Boolean).length}
function keyFor(item,index){return item&&item.id?String(item.id):'exercises-'+index}
function firstLine(v){return String(v||'').split(/\r?\n/).find(function(x){return x.trim()})||''}
function signature(item,index){var cfg=structured[keyFor(item,index)]||{},starter=(cfg&&cfg.starter)||item.starter||'',line=firstLine(starter).trim();if(/^def\s+[A-Za-z_]\w*\s*\([^)]*\)\s*:/.test(line))return line.replace(/:\s*$/,'');return''}
function sentence(v){var s=String(v||'').trim();if(!s)return'';return /[.!?]$/.test(s)?s:s+'.'}
function lowerFirst(v){var s=String(v||'').trim();return s?s.charAt(0).toLowerCase()+s.slice(1):s}
/* These are deliberately problem statements, not solution hints. They do not reveal the algorithm or implementation steps. They explain the input, required behavior, and result while leaving the algorithm choice to the learner. */
var SPECIAL={
'dsa::two sum':'Given a list of integers `nums` and a target integer, find two different positions whose values add up to the target. Return the two indices as a list. Assume the test input contains a valid pair.',
'dsa::valid parentheses':'Given a string containing the bracket characters `()`, `[]`, and `{}`, determine whether the brackets are balanced. A sequence is balanced when every opening bracket is closed by the same bracket type and the pairs close in the correct order. Return `True` when the whole sequence is valid; otherwise return `False`.',
'dsa::longest substring w o repeat':'Given a string, find the length of the longest contiguous substring that contains no repeated characters. Return that maximum length as an integer.',
'oop::point class':'Create a `Point` class that stores `x` and `y` coordinates. Add a `dist_from_origin()` method that returns the point\'s distance from `(0, 0)`.',
'python::point class':'Create a `Point` class that stores `x` and `y` coordinates. Add a `dist_from_origin()` method that returns the point\'s distance from `(0, 0)`.',
'oop::bankaccount':'Create a `BankAccount` class with deposit and withdrawal behavior. Deposits should increase the balance, while a withdrawal must not allow the balance to become negative.',
'python::bankaccount':'Create a `BankAccount` class with deposit and withdrawal behavior. Deposits should increase the balance, while a withdrawal must not allow the balance to become negative.',
'oop::shape hierarchy':'Create `Circle` and `Square` classes that each provide an `area()` method. Then write `total_area(shapes)` so it returns the combined area of the supplied shape objects without checking their concrete types.',
'python::shape hierarchy':'Create `Circle` and `Square` classes that each provide an `area()` method. Then write `total_area(shapes)` so it returns the combined area of the supplied shape objects without checking their concrete types.',
'python::sum a list':'Complete `total(nums)`. The input is a list of numbers. Return the sum of all values in the list without using Python\'s built-in `sum()` function.',
'python::fizzbuzz':'Complete the FizzBuzz function for an integer `n`. Produce the values from 1 through `n` in order, replacing multiples of 3 with `Fizz`, multiples of 5 with `Buzz`, and multiples of both with `FizzBuzz`. Return the completed list.',
'python::word frequency':'Given a string of words, count how many times each word appears. Return a dictionary whose keys are the words and whose values are their occurrence counts.',
'sql::top 5 by price':'Write a SQL query that returns the five products with the highest prices. Sort the result from the most expensive product to the least expensive among those five.',
'sql::orders per customer':'Write a SQL query that counts the orders for each customer. Return only customers who have more than three orders, together with their order count.',
'sql::running total':'Write a SQL query that shows sales by date together with a running cumulative total, so each row includes the total sales from the beginning through that date.',
'nlp::tokenize a sentence':'Given the sentence `NLP is powerful!`, produce its word-level tokens. Return or display the tokens separately rather than keeping the sentence as one string.',
'web dev::todo list vanilla js':'Build a small browser todo list where the user can add a new item and remove an existing item. Each button action must update the visible list in the page immediately.',
'web dev::fetch and render':'Fetch JSON data from a public API, read the returned records, and display them as cards in the page. The rendered cards should show useful fields from the response.',
'apis::handle errors':'Update an API request so the program handles unsuccessful HTTP responses and request timeouts instead of treating every request as successful. Show or return an appropriate error result for those failure cases.',
'apis::paginate':'Given an API that returns results across multiple pages, request every page and combine the returned records into one final collection.',
'deployment::env config':'Move a secret value out of the source code and read it from environment configuration instead. Briefly explain why secrets should not be hardcoded in the program.',
'debugging::fix the flaky test':'A test passes on some runs and fails on others. Identify likely causes of the inconsistent behavior and state what evidence you would check to determine the actual cause.',
'backend::add auth':'Protect an API route so requests are accepted only when they contain a valid authentication token. Invalid or missing tokens must not be allowed to access the protected operation.',
'linux::find big files':'Write a shell command that searches under a directory and lists files whose size is greater than 100 MB.',
'testing::parametrize':'Use `pytest.mark.parametrize` to run the same test function with several different input and expected-output pairs. The test should verify the function correctly for every supplied case.'
};
function specialFor(item){var title=norm(item&&item.title),exact=SPECIAL[courseId+'::'+title];if(exact)return exact;return''}
function clearerPrompt(item,index,task){
 var original=String(item.prompt||item.description||'Complete the task.').trim();
 var special=specialFor(item);if(special)return special;
 if(!task||!task.querySelector('.oa-editor'))return original;
 var type=norm(item.type),sig=signature(item,index),count=words(original);
 if(count>=18)return original;
 if(/debug/.test(type)){
   if(/\b(fix|rewrite|identify|diagnose|explain|list|predict)\b/i.test(original))return sentence(original);
   return 'Inspect the described failing code or behavior. '+sentence(original)+' Identify the cause and provide the corrected behavior or code requested by the question.';
 }
 if(/^(write|build|create|design|add|use|load|fetch|select|list|describe|rewrite|outline|draft|split)\b/i.test(original)&&count>=9)return sentence(original);
 if(sig){
   if(/^return\b/i.test(original))return 'Complete `'+sig+'`. Using the function inputs, '+sentence(lowerFirst(original))+' Keep the function name and parameters unchanged because the tests call that interface.';
   if(/^length of\b/i.test(original))return 'Complete `'+sig+'`. Using the function input, find and return the '+sentence(lowerFirst(original).replace(/^length of\s+/i,''))+' Keep the function name and parameters unchanged.';
   return 'Complete `'+sig+'`. '+sentence(original)+' Return or produce exactly the result requested by the question for the supplied input.';
 }
 if(count<12)return sentence(original)+' Write the code needed to produce that result from the input or data described in the question; choose the implementation yourself.';
 return sentence(original);
}
function enhance(){
 var tasks=Array.from(document.querySelectorAll('.assessment-stack .oa-task'));
 tasks.forEach(function(task,index){var item=exercises[index]||{},p=task.querySelector('.oa-prompt > p');if(!p)return;var text=clearerPrompt(item,index,task);if(!text)return;p.textContent=text;p.setAttribute('data-csai-exam-style-prompt','1');});
}
enhance();
})();
