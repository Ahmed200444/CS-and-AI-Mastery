
(function(){
  // Same shared-runtime architecture as the DSA module: test cases run through
  // the platform's existing getPy()/RUN_HARNESS, no second Python runtime.

  var CARCH_LESSONS = [
    { id:'carch-fcfs', title:'FCFS Completion Times', funcName:'fcfs_completion',
      explain:'Given processes in arrival order (name, burst time), First-Come-First-Served runs each to completion before starting the next. Return a dict mapping each process name to its completion time.',
      starter:'def fcfs_completion(processes):\n    # processes: list of (name, burst_time) tuples, in arrival order\n    # TODO: return {name: completion_time} for FCFS scheduling\n    pass',
      solution:'def fcfs_completion(processes):\n    time = 0\n    completion = {}\n    for name, bt in processes:\n        time += bt\n        completion[name] = time\n    return completion',
      hints:['Each process starts exactly when the previous one finishes -- keep a running clock.','Add the current process\'s burst time to the running clock, then record that as its completion time.','The FIRST process\'s completion time is just its own burst time (clock starts at 0).'],
      complexity:'Time: O(n) -- one pass through the process list. Space: O(n) for the completion dict.',
      tests:[
        {argsRepr:"[('P1',6),('P2',3),('P3',9)]", expectedRepr:"{'P1': 6, 'P2': 9, 'P3': 18}"}
      ]},
    { id:'carch-roundrobin', title:'Round-Robin Execution Order', funcName:'round_robin',
      explain:'Given processes (name, burst time) and a time quantum, simulate Round-Robin scheduling: each process runs for at most one quantum, then moves to the back of the queue if it still has remaining work. Return the execution order as a list of (name, start_time, end_time).',
      starter:'def round_robin(processes, quantum):\n    # processes: list of (name, burst_time) tuples\n    # TODO: return a list of (name, start_time, end_time) tuples\n    # in the order each slice actually ran\n    pass',
      solution:'def round_robin(processes, quantum):\n    queue = list(processes)\n    time = 0\n    order = []\n    while queue:\n        name, remaining = queue.pop(0)\n        run_time = min(quantum, remaining)\n        order.append((name, time, time+run_time))\n        time += run_time\n        remaining -= run_time\n        if remaining > 0:\n            queue.append((name, remaining))\n    return order',
      hints:['Use a queue (a list works, with pop(0) to take the front) -- pop the first process, run it for at most one quantum.','If a process still has remaining work after its slice, push it to the BACK of the queue instead of removing it.','Track a running clock -- each slice starts where the last one ended.'],
      complexity:'Time: O(n * bt/quantum) in the worst case -- each process may need multiple slices. Space: O(n) for the queue.',
      tests:[
        {argsRepr:"[('P1',5),('P2',3)], 2", expectedRepr:"[('P1', 0, 2), ('P2', 2, 4), ('P1', 4, 6), ('P2', 6, 7), ('P1', 7, 8)]"}
      ]},
    { id:'carch-lru', title:'LRU Cache Hit/Miss Simulation', funcName:'lru_simulate',
      explain:'Given a sequence of page accesses and a cache capacity, simulate an LRU (Least Recently Used) cache: each access is a hit if the page is already cached, or a miss otherwise. On a miss, if the cache is full, evict the LEAST recently used page first. Return (hits, misses).',
      starter:'def lru_simulate(sequence, capacity):\n    # TODO: return (hits, misses) after simulating LRU cache behavior\n    # over the access sequence\n    pass',
      solution:'def lru_simulate(sequence, capacity):\n    cache = []\n    hits = 0\n    misses = 0\n    for page in sequence:\n        if page in cache:\n            cache.remove(page)\n            cache.append(page)\n            hits += 1\n        else:\n            misses += 1\n            if len(cache) >= capacity:\n                cache.pop(0)\n            cache.append(page)\n    return hits, misses',
      hints:['Keep the cache as a list ordered from least-to-most recently used -- the FRONT is the next eviction candidate.','On a hit, remove the page from its current position and re-append it to the back (it\'s now the most recently used).','On a miss with a full cache, pop(0) evicts the least recently used page before adding the new one.'],
      complexity:'Time: O(n * capacity) -- list removal is O(capacity) per access. Space: O(capacity) for the cache itself.',
      tests:[
        {argsRepr:'[1,2,3,1,2,4,1,5], 3', expectedRepr:'(3, 5)'}
      ]},
    { id:'carch-vaddr', title:'Virtual Address Translation', funcName:'translate',
      explain:'Given a virtual address and a page size, split the address into a page number and an offset within that page -- the two pieces the OS/hardware uses together to find the real physical memory location.',
      starter:'def translate(virtual_address, page_size):\n    # TODO: return (page_number, offset)\n    pass',
      solution:'def translate(virtual_address, page_size):\n    page_number = virtual_address // page_size\n    offset = virtual_address % page_size\n    return page_number, offset',
      hints:['Integer division (//) by the page size gives you which page the address falls in.','The remainder (%) after that division gives you exactly how far into that page the address is.','Double-check: page_number * page_size + offset should equal the original virtual_address.'],
      complexity:'Time: O(1) -- just two arithmetic operations. Space: O(1).',
      tests:[
        {argsRepr:'4500, 4096', expectedRepr:'(1, 404)'},
        {argsRepr:'9000, 4096', expectedRepr:'(2, 808)'}
      ]},
    { id:'carch-deadlock', title:'Deadlock Detection', funcName:'has_deadlock',
      explain:'Given which resource each thread currently holds, and which resource each thread is waiting for, detect whether a circular wait (deadlock) exists. Build a "waits-for" graph between threads and check for a cycle.',
      starter:'def has_deadlock(holds, wants):\n    # holds: {thread: resource_it_holds}, wants: {thread: resource_it_wants}\n    # TODO: return True if a circular wait exists, False otherwise\n    pass',
      solution:'def has_deadlock(holds, wants):\n    resource_owner = {r: t for t, r in holds.items()}\n    graph = {}\n    for t, r in wants.items():\n        if r in resource_owner:\n            graph.setdefault(t, []).append(resource_owner[r])\n    visited = set()\n    stack = set()\n    def dfs(node):\n        visited.add(node)\n        stack.add(node)\n        for neighbor in graph.get(node, []):\n            if neighbor in stack:\n                return True\n            if neighbor not in visited and dfs(neighbor):\n                return True\n        stack.discard(node)\n        return False\n    for node in list(graph):\n        if node not in visited:\n            if dfs(node):\n                return True\n    return False',
      hints:['First figure out who owns each resource (invert the "holds" dict), so you can look up "who is thread A waiting ON?"','Build a graph: thread A has an edge to thread B if A wants a resource B currently holds.','A deadlock is exactly a CYCLE in this waits-for graph -- use depth-first search tracking the current recursion stack to detect one.'],
      complexity:'Time: O(V+E) -- standard cycle detection via DFS. Space: O(V) for the visited/stack sets.',
      tests:[
        {argsRepr:"{'A':'X','B':'Y'}, {'A':'Y','B':'X'}", expectedRepr:'True'},
        {argsRepr:"{'A':'X','B':'Y'}, {'A':'Y'}", expectedRepr:'False'}
      ]}
  ];

  var carchCurIdx = 0;
  function carchEsc(s){ return escapeHtml(s); }
  function carchDoneKey(id){ return 'carch_done_'+id; }
  function carchSaveKey(id){ return 'carch_code_'+id; }

  function carchLoad(id, fallback){
    try { var v = localStorage.getItem(carchSaveKey(id)); return v!==null ? v : fallback; } catch(e){ return fallback; }
  }
  function carchSave(id, code){ try { localStorage.setItem(carchSaveKey(id), code); } catch(e){} }
  function carchIsDone(id){ try { return localStorage.getItem(carchDoneKey(id))==='1'; } catch(e){ return false; } }

  window.carchMarkDone = function(idx){
    try { localStorage.setItem(carchDoneKey(CARCH_LESSONS[idx].id), '1'); } catch(e){}
    renderCarchNav(); renderCarchLesson();
  };

  function renderCarchNav(){
    var nav = document.getElementById('comparchLessonNav');
    if(!nav) return;
    nav.innerHTML = CARCH_LESSONS.map(function(l, i){
      var done = carchIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===carchCurIdx?'active':'')+'" data-act="carchOpen('+i+')">'+(i+1)+'. '+carchEsc(l.title)+done+'</button>';
    }).join('');
  }

  window.carchOpen = function(idx){
    carchCurIdx = idx;
    renderCarchNav();
    renderCarchLesson();
  };
  window.carchNext = function(){ if(carchCurIdx < CARCH_LESSONS.length-1){ carchCurIdx++; renderCarchNav(); renderCarchLesson(); } };
  window.carchPrev = function(){ if(carchCurIdx > 0){ carchCurIdx--; renderCarchNav(); renderCarchLesson(); } };

  window.carchReset = function(id, editId){
    var l = CARCH_LESSONS.find(function(x){ return x.id === id; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    carchSave(id, l.starter);
  };

  window.carchRunTests = async function(id, editId, outId, statusId){
    var l = CARCH_LESSONS.find(function(x){ return x.id === id; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    carchSave(id, code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running…'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_carch_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _carch_results.append(("'+i+'", _r == ('+t.expectedRepr+'), repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _carch_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _carch_results))');
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
          + '<span>Test '+(Number(idx)+1)+': '+carchEsc(l.funcName)+'('+carchEsc(t.argsRepr)+')</span>'
          + '<span>'+status+' &mdash; got '+carchEsc(detail)+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  window.carchRevealHint = function(lessonId, tier){
    var l = CARCH_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('carchhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  function renderCarchLesson(){
    var body = document.getElementById('comparchLessonBody');
    if(!body) return;
    var l = CARCH_LESSONS[carchCurIdx];
    var editId = 'carchEd_'+l.id;
    var outId = 'carchOut_'+l.id;
    var statusId = 'carchStatus_'+l.id;
    var savedCode = carchLoad(l.id, l.starter);
    var hintHtml = l.hints.map(function(h, i){
      return '<button class="wd-btn-ghost" data-act="carchRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button class="wd-btn-ghost" data-act="carchRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h, i){
      return '<div class="wd-hintbox" id="carchhint_'+l.id+'_'+(i+1)+'">'+carchEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="carchhint_'+l.id+'_99"><pre style="white-space:pre-wrap;margin:0">'+carchEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(carchCurIdx+1)+carchEsc(l.title)+'</h2></div>'
      + trackMentalModel(carchEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:130px">'+carchEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="carchRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
        + '<button class="wd-btn-ghost" data-act="carchReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="carchMarkDone('+carchCurIdx+')">Mark solved</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="dsa-complexity"><b>Complexity:</b> '+carchEsc(l.complexity)+'</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + '<div class="wd-navrow">'
        + (carchCurIdx>0 ? '<button class="wd-btn-ghost" data-act="carchPrev()">&larr; Previous</button>' : '<span></span>')
        + (carchCurIdx<CARCH_LESSONS.length-1 ? '<button class="wd-btn" data-act="carchNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  var carchBooted = false;
  window._comparchBoot = function(){
    if(carchBooted) return;
    carchBooted = true;
    renderCarchNav();
    renderCarchLesson();
  };
})();
