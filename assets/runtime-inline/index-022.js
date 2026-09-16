
(function(){
  // ---- Reusable "algorithm lab" component ----------------------------------
  // Test cases run via the SAME shared Pyodide instance and RUN_HARNESS the
  // rest of the platform already uses (getPy()/RUN_HARNESS, defined earlier in
  // the document) -- a test harness is appended to the learner's own code as
  // plain Python text, then executed exactly the same way a normal runnable
  // exercise is. No second Python runtime is created anywhere in this module.

  var DSA_LESSONS = [
    { id:'dsa-two-sum', title:'Two Sum', funcName:'two_sum',
      explain:'Given a list of numbers and a target, return the indices of the two numbers that add up to the target. A hash map lets you check "have I seen the complement before?" in one pass, instead of comparing every pair.',
      starter:'def two_sum(nums, target):\n    # TODO: return [i, j] such that nums[i] + nums[j] == target\n    pass',
      solution:'def two_sum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        complement = target - n\n        if complement in seen:\n            return [seen[complement], i]\n        seen[n] = i',
      hints:['A brute-force double loop works but is O(n^2) -- think about what you could remember as you go.','A hash map from value -> index lets you check "have I seen target-n before?" in O(1).','For each n at index i, check if (target-n) is already a key in a dict; if not, store n:i and continue.'],
      complexity:'Time: O(n) with a hash map (O(n^2) with brute force). Space: O(n) for the hash map.',
      tests:[
        {argsRepr:'[2,7,11,15], 9', expectedRepr:'[0,1]'},
        {argsRepr:'[3,2,4], 6', expectedRepr:'[1,2]'},
        {argsRepr:'[3,3], 6', expectedRepr:'[0,1]'}
      ]},
    { id:'dsa-valid-parens', title:'Valid Parentheses', funcName:'is_valid',
      explain:'Given a string of only ()[]{} characters, determine if the brackets are properly matched and nested. A stack is the natural fit: push opening brackets, and on a closing bracket, check it matches the top of the stack.',
      starter:'def is_valid(s):\n    # TODO: return True if all brackets in s are properly matched\n    pass',
      solution:'def is_valid(s):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in s:\n        if ch in "([{":\n            stack.append(ch)\n        else:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return not stack',
      hints:['A stack naturally tracks "most recently opened, not yet closed" brackets.','On an opening bracket, push it. On a closing bracket, pop and check it matches.','If the stack is empty when you need to pop, or anything is left on the stack at the end, it\'s invalid.'],
      complexity:'Time: O(n) -- one pass through the string. Space: O(n) worst case for the stack.',
      tests:[
        {argsRepr:'"()[]{}"', expectedRepr:'True'},
        {argsRepr:'"(]"', expectedRepr:'False'},
        {argsRepr:'"([)]"', expectedRepr:'False'},
        {argsRepr:'"{[]}"', expectedRepr:'True'}
      ]},
    { id:'dsa-binary-search', title:'Binary Search', funcName:'binary_search',
      explain:'Given a SORTED list and a target, find its index (or -1). Instead of scanning every element, repeatedly cut the search space in half by comparing the target to the middle element.',
      starter:'def binary_search(nums, target):\n    # TODO: return the index of target in sorted nums, or -1 if not found\n    pass',
      solution:'def binary_search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1',
      hints:['Keep two pointers, lo and hi, marking the current search range.','Compare nums[mid] to target: if too small, search the right half; if too large, search the left half.','Loop while lo <= hi; move lo/hi based on the comparison; return -1 if the loop ends without finding it.'],
      complexity:'Time: O(log n) -- the search space halves every step. Space: O(1).',
      tests:[
        {argsRepr:'[1,3,5,7,9,11], 7', expectedRepr:'3'},
        {argsRepr:'[1,3,5,7,9,11], 2', expectedRepr:'-1'},
        {argsRepr:'[5], 5', expectedRepr:'0'}
      ]},
    { id:'dsa-reverse-linked-list', title:'Reverse a Linked List (as a Python list simulation)', funcName:'reverse_list',
      explain:'Reversing a singly linked list is a classic pointer-manipulation exercise. Here it\'s simulated with a plain Python list so it runs safely in the browser, but the logic (walk once, flip direction) is identical to the real pointer version.',
      starter:'def reverse_list(lst):\n    # TODO: return a NEW list with the elements in reverse order,\n    # built by walking lst once and prepending (no lst[::-1] shortcut!)\n    pass',
      solution:'def reverse_list(lst):\n    result = []\n    for item in lst:\n        result.insert(0, item)\n    return result',
      hints:['Walk through the list once, from front to back.','For each item you see, put it at the FRONT of a new result list.','result.insert(0, item) puts item at index 0, pushing everything else back.'],
      complexity:'Time: O(n^2) with insert(0,...) in a plain list (O(n) with a true linked list\'s O(1) prepend). Space: O(n) for the new list.',
      tests:[
        {argsRepr:'[1,2,3,4]', expectedRepr:'[4,3,2,1]'},
        {argsRepr:'[]', expectedRepr:'[]'},
        {argsRepr:'[7]', expectedRepr:'[7]'}
      ]},
    { id:'dsa-max-subarray', title:'Maximum Subarray Sum (Kadane\'s Algorithm)', funcName:'max_subarray',
      explain:'Given a list of integers, find the largest sum of any contiguous subarray. Kadane\'s algorithm tracks "best sum ending here" as it walks the array once -- at each step, either extend the previous subarray or start fresh.',
      starter:'def max_subarray(nums):\n    # TODO: return the largest sum of any contiguous subarray\n    pass',
      solution:'def max_subarray(nums):\n    best = nums[0]\n    current = nums[0]\n    for n in nums[1:]:\n        current = max(n, current + n)\n        best = max(best, current)\n    return best',
      hints:['At each position, you either extend the running subarray or start a new one there.','current = max(n, current + n) decides: is it better to start fresh at n, or add n to what you had?','Track a separate "best seen so far" since the best subarray might not end at the last element.'],
      complexity:'Time: O(n) -- one pass. Space: O(1).',
      tests:[
        {argsRepr:'[-2,1,-3,4,-1,2,1,-5,4]', expectedRepr:'6'},
        {argsRepr:'[1]', expectedRepr:'1'},
        {argsRepr:'[5,4,-1,7,8]', expectedRepr:'23'}
      ]},
    { id:'dsa-fizzbuzz-recursive', title:'Recursion Warm-up: Factorial', funcName:'factorial',
      explain:'A recursive function calls itself on a smaller version of the same problem, with a base case that stops the recursion. Factorial is the classic first example: n! = n * (n-1)!, with 0! = 1 as the base case.',
      starter:'def factorial(n):\n    # TODO: return n! using recursion (call factorial() inside itself)\n    pass',
      solution:'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)',
      hints:['Every recursive function needs a base case -- what\'s the simplest input where you already know the answer?','factorial(0) and factorial(1) are both 1 -- that\'s your base case.','For anything else, return n * factorial(n - 1).'],
      complexity:'Time: O(n) -- n recursive calls. Space: O(n) for the call stack.',
      tests:[
        {argsRepr:'5', expectedRepr:'120'},
        {argsRepr:'0', expectedRepr:'1'},
        {argsRepr:'1', expectedRepr:'1'}
      ]},
    { id:'dsa-level-order', title:'Binary Tree Level-Order Traversal', funcName:'level_order',
      explain:'Given a binary tree (as nested dicts with val/left/right), return its values grouped by level, top to bottom. This is a breadth-first search (BFS) -- process nodes level by level using a queue, rather than diving deep first like DFS would.',
      starter:'def level_order(tree):\n    # tree is a dict {"val":..., "left":..., "right":...} or None.\n    # TODO: return a list of lists, one per level, using BFS (a queue).\n    pass',
      solution:'def level_order(tree):\n    if not tree: return []\n    result = []\n    queue = [tree]\n    while queue:\n        level = []\n        next_queue = []\n        for node in queue:\n            level.append(node["val"])\n            if node.get("left"): next_queue.append(node["left"])\n            if node.get("right"): next_queue.append(node["right"])\n        result.append(level)\n        queue = next_queue\n    return result',
      hints:['BFS uses a queue (process in the order added), unlike DFS which uses a stack/recursion.','Process one whole level at a time: collect the CURRENT queue\'s values, then build the NEXT level\'s queue from their children, before moving on.','Track two lists: the current level\'s nodes (to read values from) and the next level\'s nodes (children to process after).'],
      complexity:'Time: O(n) -- every node visited once. Space: O(n) for the queue in the worst case (a very wide tree).',
      tests:[
        {argsRepr:'{"val":1,"left":{"val":2,"left":None,"right":None},"right":{"val":3,"left":{"val":4,"left":None,"right":None},"right":None}}', expectedRepr:'[[1], [2, 3], [4]]'}
      ]},
    { id:'dsa-shortest-path', title:'Shortest Path in an Unweighted Graph', funcName:'shortest_path',
      explain:'Given a graph as an adjacency list and a start/end node, find the shortest path (fewest edges) between them. BFS guarantees the shortest path in an UNWEIGHTED graph, because it explores everything at distance 1 before anything at distance 2, and so on.',
      starter:'def shortest_path(graph, start, end):\n    # graph: dict of node -> list of neighbors. TODO: BFS from start,\n    # tracking the path so far, and return the first path that reaches end\n    # (or None if unreachable).\n    from collections import deque\n    pass',
      solution:'def shortest_path(graph, start, end):\n    from collections import deque\n    if start == end: return [start]\n    visited = {start}\n    queue = deque([[start]])\n    while queue:\n        path = queue.popleft()\n        node = path[-1]\n        for neighbor in graph.get(node, []):\n            if neighbor == end:\n                return path + [neighbor]\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(path + [neighbor])\n    return None',
      hints:['Instead of a queue of just nodes, use a queue of PATHS (lists) -- when you find the end, you already have the full path that got you there.','Track a visited set so you don\'t revisit nodes and loop forever on a graph with cycles.','popleft() (not pop()) is what makes this BFS instead of DFS -- it processes the OLDEST-added path first.'],
      complexity:'Time: O(V+E) -- every node and edge visited once. Space: O(V) for the visited set and queue.',
      tests:[
        {argsRepr:'{"A":["B","C"],"B":["D"],"C":["D"],"D":["E"]}, "A", "E"', expectedRepr:"['A', 'B', 'D', 'E']"}
      ]},
    { id:'dsa-climb-stairs', title:'Climbing Stairs (Dynamic Programming)', funcName:'climb_stairs',
      explain:'You can climb 1 or 2 steps at a time -- how many distinct ways are there to reach the top of an n-step staircase? This is really "Fibonacci in disguise": the ways to reach step n is the ways to reach step n-1, plus the ways to reach step n-2 (your last move was either a 1-step or a 2-step).',
      starter:'def climb_stairs(n):\n    # TODO: return the number of distinct ways to climb n steps,\n    # taking 1 or 2 steps at a time\n    pass',
      solution:'def climb_stairs(n):\n    if n <= 2: return n\n    a, b = 1, 2\n    for _ in range(3, n+1):\n        a, b = b, a+b\n    return b',
      hints:['ways(n) = ways(n-1) + ways(n-2) -- same recurrence as Fibonacci.','You don\'t need to store every value -- just the previous two, updated as you go (this is what makes it O(1) space instead of O(n)).','ways(1)=1, ways(2)=2 are your base cases (1 step: only [1]; 2 steps: [1,1] or [2]).'],
      complexity:'Time: O(n). Space: O(1) -- only two running values are kept, not a full array.',
      tests:[
        {argsRepr:'5', expectedRepr:'8'},
        {argsRepr:'2', expectedRepr:'2'}
      ]},
    { id:'dsa-subsets', title:'Generate All Subsets (Backtracking)', funcName:'subsets',
      explain:'Given a list of distinct numbers, return every possible subset (the power set), including the empty set and the full list. Backtracking builds each subset incrementally: at each step, either include the next number or don\'t, exploring both choices and undoing ("backtracking") after each.',
      starter:'def subsets(nums):\n    # TODO: return a list of all subsets of nums (order within results doesn\'t matter)\n    pass',
      solution:'def subsets(nums):\n    result = []\n    def backtrack(start, path):\n        result.append(path[:])\n        for i in range(start, len(nums)):\n            path.append(nums[i])\n            backtrack(i+1, path)\n            path.pop()\n    backtrack(0, [])\n    return result',
      hints:['Every prefix you build along the way IS a valid subset -- append a COPY of the current path at the start of each recursive call, not just at the end.','After exploring "include nums[i]", pop() it back off before trying the next option -- that\'s the "backtrack" step that lets you explore other branches cleanly.','path[:] (or list(path)) makes a copy -- without it, later mutations would silently change subsets you already saved.'],
      complexity:'Time: O(n * 2^n) -- there are 2^n subsets, each up to O(n) to copy. Space: O(n) for the recursion depth, plus O(n * 2^n) for the output.',
      tests:[
        {argsRepr:'[1,2,3]', expectedRepr:'[[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]'}
      ]}
  ];

  function dsaKey(id, field){ return 'dsatrack:'+id+':'+field; }
  function dsaSave(id, field, val){ try{ localStorage.setItem(dsaKey(id,field), val); }catch(e){} }
  function dsaLoad(id, field, fallback){ try{ var v=localStorage.getItem(dsaKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function dsaDoneKey(id){ return 'dsatrack:'+id+':done'; }
  function dsaIsDone(id){ try{ return localStorage.getItem(dsaDoneKey(id))==='1'; }catch(e){ return false; } }
  function dsaEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&lt;','>':'&gt;','&':'&amp;'}[c]||c;}); }

  var dsaCurIdx = 0;

  window.dsaOpen = function(idx){
    dsaCurIdx = idx;
    renderDsaNav();
    renderDsaLesson();
    window.scrollTo(0,0);
  };
  window.dsaNext = function(){ if(dsaCurIdx < DSA_LESSONS.length-1) window.dsaOpen(dsaCurIdx+1); };
  window.dsaPrev = function(){ if(dsaCurIdx > 0) window.dsaOpen(dsaCurIdx-1); };
  window.dsaMarkDone = function(idx){
    try{ localStorage.setItem(dsaDoneKey(DSA_LESSONS[idx].id), '1'); }catch(e){}
    renderDsaNav();
  };

  function renderDsaNav(){
    var nav = document.getElementById('dsaLessonNav');
    if(!nav) return;
    nav.innerHTML = DSA_LESSONS.map(function(l, i){
      var done = dsaIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===dsaCurIdx?'active':'')+'" data-act="dsaOpen('+i+')">'+(i+1)+'. '+dsaEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderDsaLesson(){
    var body = document.getElementById('dsaLessonBody');
    if(!body) return;
    var l = DSA_LESSONS[dsaCurIdx];
    var savedCode = dsaLoad(l.id, 'code', l.starter);
    var idBase = 'dsapm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="dsaRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="dsaRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="dsahint_'+l.id+'_'+(i+1)+'">'+dsaEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="dsahint_'+l.id+'_99"><b>Solution:</b><pre>'+dsaEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(dsaCurIdx+1)+dsaEsc(l.title)+(l.difficulty?trackDiffBadge(l.difficulty):'')+'</h2></div>'
      + trackMentalModel(dsaEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:130px">'+dsaEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="dsaRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
        + '<button class="wd-btn-ghost" data-act="dsaReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="dsaMarkDone('+dsaCurIdx+')">Mark solved</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="dsa-complexity"><b>Complexity:</b> '+dsaEsc(l.complexity)+'</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + '<div class="wd-navrow">'
        + (dsaCurIdx>0 ? '<button class="wd-btn-ghost" data-act="dsaPrev()">&larr; Previous</button>' : '<span></span>')
        + (dsaCurIdx<DSA_LESSONS.length-1 ? '<button class="wd-btn" data-act="dsaNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  window.dsaReset = function(lessonId, editId){
    var l = DSA_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    dsaSave(lessonId, 'code', l.starter);
  };

  window.dsaRevealHint = function(lessonId, tier){
    var l = DSA_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('dsahint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  // Reuses the SAME shared Pyodide instance (getPy) and the SAME RUN_HARNESS
  // (both defined earlier in the document, used by every other runnable
  // exercise on the platform) -- appends a plain-Python test harness to the
  // learner's own code as text, then runs it exactly the same way a normal
  // exercise's "Run" button does. No second Python runtime.
  window.dsaRunTests = async function(lessonId, editId, outId, statusId){
    var l = DSA_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    dsaSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running…'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_dsa_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _dsa_results.append(("'+i+'", _r == ('+t.expectedRepr+'), repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _dsa_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _dsa_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';

    try{
      try{ await py.loadPackagesFromImports(fullSrc); }catch(e){ /* offline or unneeded -- fall through */ }
      py.globals.set('_SRC', fullSrc);
      py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT');
      var iserr = py.globals.get('_ISERR');
      if(iserr){
        if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>';
        return;
      }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){
        if(out) out.textContent = result || '(no test results -- did you rename the function? it must be called "'+l.funcName+'")';
        return;
      }
      var rows = lines.map(function(ln){
        var parts = ln.split('|');
        var idx = parts[1], status = parts[2], detail = parts[3];
        var t = l.tests[Number(idx)];
        return '<div class="dsa-testrow '+(status==='PASS'?'pass':'fail')+'">'
          + '<span>Test '+(Number(idx)+1)+': '+dsaEsc(l.funcName)+'('+dsaEsc(t.argsRepr)+')</span>'
          + '<span>'+status+' &mdash; got '+dsaEsc(detail)+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  var dsaBooted = false;
  window._dsaBoot = function(){
    if(dsaBooted) return;
    dsaBooted = true;
    window.dsaOpen(0);
  };
})();
