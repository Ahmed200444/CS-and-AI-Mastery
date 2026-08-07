(function(){
'use strict';

var meta={};
try{var n=document.getElementById('course-page-meta');meta=n?JSON.parse(n.textContent||'{}'):{};}catch(e){}
var courseId=String(meta.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'');

function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function lessonTitle(pre){var lesson=pre.closest('.lesson');var t=lesson&&lesson.querySelector('.title');return norm(t?t.textContent:'')}
function looksPlaceholder(code){return /(^|\s)\.\.\.(\s|$)/m.test(code)||/\bTODO\b/i.test(code)||/\bYOUR[_ ]CODE\b/i.test(code)}

var FIXES={
 'dsa|big o notation':`nums = [10, 20, 30, 40]\n\n# O(n): one pass through the list\nlinear_steps = 0\nfor x in nums:\n    linear_steps = linear_steps + 1\n\n# O(n^2): one full pass for every item\nquadratic_steps = 0\nfor i in nums:\n    for j in nums:\n        quadratic_steps = quadratic_steps + 1\n\nprint("Number of items:", len(nums))\nprint("O(n) loop steps:", linear_steps)\nprint("O(n^2) loop steps:", quadratic_steps)`,
 'dsa|arrays and strings':`nums = [10, 20, 30, 40]\n\nprint("First item:", nums[0])\nprint("Last item:", nums[-1])\n\nnums.append(50)\nprint("After append:", nums)\n\nnums[1] = 99\nprint("After changing index 1:", nums)`,
 'dsa|hash maps and sets':`scores = {}\nscores["Ada"] = 95\nscores["Linus"] = 88\n\nprint("Ada's score:", scores["Ada"])\nprint("Is Grace in scores?", "Grace" in scores)\n\nseen = set()\nfor value in [2, 4, 2, 6, 4]:\n    seen.add(value)\n\nprint("Unique values:", sorted(seen))`,
 'dsa|two pointers':`nums = [1, 2, 3, 4, 6]\ntarget = 6\nleft = 0\nright = len(nums) - 1\n\nwhile left < right:\n    current_sum = nums[left] + nums[right]\n\n    if current_sum == target:\n        print("Pair found:", nums[left], nums[right])\n        break\n    elif current_sum < target:\n        left = left + 1\n    else:\n        right = right - 1`,
 'dsa|sliding window':`nums = [2, 1, 5, 1, 3, 2]\nk = 3\n\nwindow_sum = 0\nfor i in range(k):\n    window_sum = window_sum + nums[i]\n\nbest = window_sum\n\nfor right in range(k, len(nums)):\n    window_sum = window_sum + nums[right]\n    window_sum = window_sum - nums[right - k]\n\n    if window_sum > best:\n        best = window_sum\n\nprint("Largest sum of", k, "consecutive values:", best)`,
 'dsa|binary search':`nums = [2, 5, 8, 12, 16, 23, 38]\ntarget = 16\nleft = 0\nright = len(nums) - 1\n\nwhile left <= right:\n    middle = (left + right) // 2\n\n    if nums[middle] == target:\n        print("Found at index:", middle)\n        break\n    elif nums[middle] < target:\n        left = middle + 1\n    else:\n        right = middle - 1`,
 'dsa|stacks and queues':`stack = []\nstack.append("A")\nstack.append("B")\nstack.append("C")\n\nprint("Stack pop:", stack.pop())\nprint("Stack now:", stack)\n\nfrom collections import deque\nqueue = deque()\nqueue.append("A")\nqueue.append("B")\nqueue.append("C")\n\nprint("Queue remove:", queue.popleft())\nprint("Queue now:", list(queue))`
};

function fix(){
 var examples=Array.from(document.querySelectorAll('.lesson .body pre.code'));
 examples.forEach(function(pre){
   var code=pre.textContent||'';
   if(!looksPlaceholder(code))return;
   var key=courseId+'|'+lessonTitle(pre),replacement=FIXES[key];
   if(replacement){
     pre.textContent=replacement;
     pre.dataset.runnableExample='true';
   }else{
     pre.dataset.referenceOnly='true';
   }
 });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix);else fix();
})();
