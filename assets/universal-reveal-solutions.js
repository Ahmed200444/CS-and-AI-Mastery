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

var EASY={
 python:{
  'sum a list':`def total(nums):
    total_value = 0

    for number in nums:
        total_value = total_value + number

    return total_value`,
  'fizzbuzz':`def fizzbuzz(n):
    result = []

    for number in range(1, n + 1):
        if number % 15 == 0:
            result.append('FizzBuzz')
        elif number % 3 == 0:
            result.append('Fizz')
        elif number % 5 == 0:
            result.append('Buzz')
        else:
            result.append(number)

    return result`,
  'word frequency':`def word_freq(text):
    counts = {}
    words = text.split()

    for word in words:
        if word in counts:
            counts[word] = counts[word] + 1
        else:
            counts[word] = 1

    return counts`,
  'fix a type error':`first_number = int("5")
second_number = int("3")
answer = first_number + second_number
print(answer)  # 8`,
  'write a list comprehension':`# The exercise asks for a list comprehension, but this is the clearest
# beginner version of the same logic.
squares = []

for number in range(5):
    square = number * number
    squares.append(square)

print(squares)  # [0, 1, 4, 9, 16]`,
  'safe dictionary access':`if 'age' in d:
    print(d['age'])
else:
    print('unknown')`,
  'catch a specific exception':`try:
    answer = a / b
    print(answer)
except ZeroDivisionError:
    print('Cannot divide by zero')`,
  'fix the mutable default argument bug':`def add_item(item, cart=None):
    if cart is None:
        cart = []

    cart.append(item)
    return cart`
 },
 dsa:{
  'two sum':`def two_sum(nums, target):
    seen = {}

    for index in range(len(nums)):
        number = nums[index]
        needed = target - number

        if needed in seen:
            return [seen[needed], index]

        seen[number] = index

    return []`,
  'valid parentheses':`def valid(s):
    stack = []
    pairs = {
        ')': '(',
        ']': '[',
        '}': '{'
    }

    for character in s:
        if character == '(' or character == '[' or character == '{':
            stack.append(character)
        else:
            if len(stack) == 0:
                return False

            opening = stack.pop()
            if opening != pairs[character]:
                return False

    return len(stack) == 0`,
  'longest substring w o repeat':`def longest(s):
    last_seen = {}
    left = 0
    best = 0

    for right in range(len(s)):
        character = s[right]

        if character in last_seen and last_seen[character] >= left:
            left = last_seen[character] + 1

        last_seen[character] = right
        current_length = right - left + 1

        if current_length > best:
            best = current_length

    return best`,
  'array vs linked list trade off':`Use a linked list.

Reason:
1. Inserting at the front of a linked list can be O(1).
2. Inserting at the front of an array usually requires shifting the existing items, which is O(n).
3. The question says random index access is not important, so the linked list's slower random access is not a problem here.`,
  'implement a stack based check':`Use a stack.

1. Start with an empty stack.
2. Read the string from left to right.
3. When you see an opening parenthesis "(", push it onto the stack.
4. When you see a closing parenthesis ")", the stack must contain a matching opening parenthesis. Pop it.
5. If you try to pop when the stack is empty, the string is not balanced.
6. At the end, the stack must be empty for the string to be balanced.`,
  'choose linear or binary search':`You cannot use binary search directly because the list is unsorted.

The simplest choices are:
- Use linear search immediately: O(n), or
- Sort the data first, then use binary search.

Binary search only works correctly when the search order is sorted.`,
  'find the off by one bug in a binary search':`The search range must get smaller on every loop.

A simple consistent version is:

while lo <= hi:
    mid = (lo + hi) // 2

    if values[mid] == target:
        return mid
    elif values[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1

return -1`,
  'diagnose a hidden o n2 in optimized code':`The code is O(n²) because "x in my_list" is an O(n) search, and it runs inside another loop that also runs n times.

The simplest fix is to use a set for membership checks:

lookup = set(my_list)

for x in items:
    if x in lookup:
        # handle the match
        pass

Average set membership is O(1), so the full loop becomes O(n).`
 }
};

function beginnerify(raw,lang){
 raw=String(raw||'').trim();
 if(!raw)return'';
 if(lang==='python'){
  if(/^def\s+evens\(nums\):\s*\n\s*return \[n for n in nums if n%2==0\]/m.test(raw))return`def evens(nums):\n    result = []\n\n    for number in nums:\n        if number % 2 == 0:\n            result.append(number)\n\n    return result`;
  if(/^def\s+squares\(n\):\s*\n\s*return \[i\*i for i in range\(1,n\+1\)\]/m.test(raw))return`def squares(n):\n    result = []\n\n    for number in range(1, n + 1):\n        result.append(number * number)\n\n    return result`;
  if(/^def\s+flatten\(rows\):\s*\n\s*return \[x for row in rows for x in row\]/m.test(raw))return`def flatten(rows):\n    result = []\n\n    for row in rows:\n        for value in row:\n            result.append(value)\n\n    return result`;
  if(/^def\s+invert\(d\):\s*\n\s*return \{v:k for k,v in d\.items\(\)\}/m.test(raw))return`def invert(d):\n    result = {}\n\n    for key, value in d.items():\n        result[value] = key\n\n    return result`;
  raw=raw.replace(/;\s*/g,'\n');
 }
 return raw;
}

function languageFor(task){var select=task.querySelector('[data-lang]');if(select)return select.value;var file=task.querySelector('[data-file-label]');if(file){var t=file.textContent||'';if(/\.py$/i.test(t))return'python';if(/\.js$/i.test(t))return'javascript';if(/\.sql$/i.test(t))return'sql';if(/\.html$/i.test(t))return'html'}return DATA.defaultLanguage||'text'}
function solutionFor(item,index,task){
 var title=norm(item&&item.title);
 var manual=EASY[courseId]&&EASY[courseId][title];
 if(manual)return manual;
 var cfg=structured[keyFor(item,index)]||{};
 var raw=cfg.easySolution||item.easySolution||cfg.solution||item.solution||item.modelAnswer||item.sampleAnswer||item.expectedAnswer||item.answer||item.expected;
 if(raw)return beginnerify(first(raw),languageFor(task));
 var hint=first(item.hint)||first(cfg.hint);
 if(hint)return`Easiest approach:\n\n${String(hint)}`;
 return`Easiest approach:\n\n1. Read the requirement carefully.\n2. Solve only the exact thing the prompt asks for.\n3. Keep the answer direct and simple.\n4. Use the lesson immediately above this exercise as your reference.\n\nPrompt:\n${String(item.prompt||item.description||item.title||'Complete the task.')}`;
}

function addStyle(){
 if(document.getElementById('csai-reveal-style'))return;
 var s=document.createElement('style');s.id='csai-reveal-style';s.textContent=`
 .oa-btn.reveal{background:#6f42c1;color:#fff;border-color:#6f42c1}.oa-solution{border-top:1px solid var(--border);background:color-mix(in srgb,var(--panel) 88%,#6f42c1 12%);padding:13px 14px}.oa-solution[hidden]{display:none}.oa-solution-head{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;font-weight:900;color:var(--text)}.oa-solution pre{margin:0;white-space:pre-wrap;overflow:auto;border:1px solid var(--border);border-radius:9px;background:var(--code);color:#f4f7fb;padding:13px;font:500 13px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace}.oa-solution .plain{white-space:pre-wrap;line-height:1.65;color:var(--text)}.response-normalized .oa-work{padding:0!important}.response-normalized .oa-editor{min-height:220px}.response-normalized .oa-output{min-height:54px}.quiz-reveal{margin-left:8px}.quiz-solution{margin-top:10px;padding:10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);font-weight:750}.quiz-solution[hidden]{display:none}
 `;document.head.appendChild(s)
}

function insertSolution(task,item,index){
 if(task.querySelector('[data-reveal-solution]'))return;
 var toolbar=task.querySelector('.oa-toolbar')||task.querySelector('.oa-response-actions');
 if(!toolbar)return;
 var publish=toolbar.querySelector('[data-publish]'),anchor=publish;
 while(anchor&&anchor.parentNode!==toolbar)anchor=anchor.parentNode;
 var btn=document.createElement('button');btn.type='button';btn.className='oa-btn reveal';btn.setAttribute('data-reveal-solution','');btn.textContent='Reveal solution';
 if(anchor)toolbar.insertBefore(btn,anchor);else toolbar.appendChild(btn);
 var panel=document.createElement('div');panel.className='oa-solution';panel.hidden=true;panel.setAttribute('data-solution-panel','');
 var sol=solutionFor(item,index,task),lang=languageFor(task),codeLike=lang!=='text'&&(/\n/.test(sol)||/^(def |class |SELECT |INSERT |UPDATE |DELETE |CREATE |const |let |function |<)/i.test(sol.trim()));
 panel.innerHTML='<div class="oa-solution-head"><span>Easiest solution</span><span style="font-size:.72rem;color:var(--muted)">beginner-friendly</span></div>'+(codeLike?'<pre>'+esc(sol)+'</pre>':'<div class="plain">'+esc(sol)+'</div>');
 var work=task.querySelector('.oa-work')||task;work.appendChild(panel);
 btn.addEventListener('click',function(){panel.hidden=!panel.hidden;btn.textContent=panel.hidden?'Reveal solution':'Hide solution'});
}

function normalizeResponseTask(task,item,index){
 if(task.querySelector('.oa-answer')){task.setAttribute('data-response-task','1');return;}
 if(task.querySelector('.oa-editorbar'))return;
 task.classList.add('response-normalized');
 var work=task.querySelector('.oa-work'),editor=task.querySelector('[data-editor]');if(!work||!editor)return;
 editor.classList.remove('oa-answer');editor.classList.add('oa-editor');editor.setAttribute('spellcheck','false');
 var bar=document.createElement('div');bar.className='oa-editorbar';bar.innerHTML='<span class="oa-dots"><i></i><i></i><i></i></span><span>response.txt</span><span>Response</span>';work.insertBefore(bar,editor);
 var actions=task.querySelector('.oa-response-actions');if(!actions){actions=document.createElement('div');actions.className='oa-toolbar';work.appendChild(actions)}else actions.className='oa-toolbar';
 var mark=actions.querySelector('[data-mark]');if(mark){mark.textContent='Submit solution';mark.classList.add('submit')}
 if(!actions.querySelector('[data-compare]')){var check=document.createElement('button');check.type='button';check.className='oa-btn run';check.setAttribute('data-compare','');check.textContent='▶ Check response';actions.insertBefore(check,actions.firstChild);check.addEventListener('click',function(){var p=task.querySelector('[data-solution-panel]');if(p){p.hidden=false;var b=task.querySelector('[data-reveal-solution]');if(b)b.textContent='Hide solution'}var out=task.querySelector('[data-output]');if(out)out.textContent='Compare your response with the beginner-friendly solution below.'})}
 if(!actions.querySelector('[data-reset]')){var reset=document.createElement('button');reset.type='button';reset.className='oa-btn';reset.setAttribute('data-reset','');reset.textContent='Reset';var pub=actions.querySelector('[data-publish]');if(pub)actions.insertBefore(reset,pub);else actions.appendChild(reset)}
 if(!task.querySelector('[data-output]')){var out=document.createElement('div');out.className='oa-output';out.setAttribute('data-output','');out.textContent='Ready.';work.appendChild(out)}
}

function enhanceTasks(){
 var tasks=Array.from(document.querySelectorAll('.assessment-stack .oa-task'));
 tasks.forEach(function(task,index){var item=exercises[index]||{};normalizeResponseTask(task,item,index);insertSolution(task,item,index)});
}
function enhanceQuiz(){
 Array.from(document.querySelectorAll('.quiz-card')).forEach(function(card,index){if(card.querySelector('[data-reveal-answer]'))return;var item=quiz[index]||{},actions=card.querySelector('.oa-response-actions');if(!actions)return;var btn=document.createElement('button');btn.type='button';btn.className='oa-btn reveal quiz-reveal';btn.setAttribute('data-reveal-answer','');btn.textContent='Reveal answer';actions.appendChild(btn);var panel=document.createElement('div');panel.className='quiz-solution';panel.hidden=true;var correct=Number(item.correct),opts=Array.isArray(item.options)?item.options:[];panel.textContent=Number.isFinite(correct)&&opts[correct]!=null?'Correct answer: '+opts[correct]:'Review the lesson explanation directly above this knowledge check.';card.appendChild(panel);btn.addEventListener('click',function(){panel.hidden=!panel.hidden;btn.textContent=panel.hidden?'Reveal answer':'Hide answer'})})
}

addStyle();
function run(){enhanceTasks();enhanceQuiz()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
setTimeout(run,300);
})();
