
(function(){
  var PS_LESSONS = [
    { id:'ps-two-pointer', mode:'test', title:'The two-pointer technique', funcName:'has_pair_with_sum',
      explain:'Two pointers moving from opposite ends of a SORTED list can find a pair summing to a target in one pass -- much faster than checking every pair.',
      starter:'def has_pair_with_sum(nums, target):\n    # TODO: sort nums, then use two pointers (lo=0, hi=last index):\n    # if nums[lo]+nums[hi] == target, return True\n    # if the sum is too small, move lo up; if too big, move hi down\n    # return False if the pointers cross without finding one\n    pass',
      solution:'def has_pair_with_sum(nums, target):\n    nums = sorted(nums)\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        s = nums[lo] + nums[hi]\n        if s == target:\n            return True\n        elif s < target:\n            lo += 1\n        else:\n            hi -= 1\n    return False',
      hints:['Sort first -- two pointers only works correctly on sorted data.','If the current sum is too small, the only way to increase it is moving the LOW pointer up; too big, move the HIGH pointer down.','nums = sorted(nums); lo, hi = 0, len(nums)-1; while lo < hi: check nums[lo]+nums[hi] against target'],
      tests:[
        {argsRepr:'[1,4,8,10], 14', expectedRepr:'True'},
        {argsRepr:'[1,2,3], 100', expectedRepr:'False'}
      ]},
    { id:'ps-sliding-window', mode:'test', title:'The sliding window technique', funcName:'max_sum_window',
      explain:'Instead of recomputing a window\'s sum from scratch every time it shifts, update it incrementally: subtract what leaves, add what enters.',
      starter:'def max_sum_window(nums, k):\n    # TODO: compute the sum of the first k elements, then slide the\n    # window across the rest of nums, each time subtracting the element\n    # that leaves and adding the one that enters -- track the best sum seen\n    pass',
      solution:'def max_sum_window(nums, k):\n    window_sum = sum(nums[:k])\n    best = window_sum\n    for i in range(k, len(nums)):\n        window_sum += nums[i] - nums[i-k]\n        best = max(best, window_sum)\n    return best',
      hints:['Start with the sum of the first k elements as your baseline window.','As the window slides forward by one, it gains nums[i] and loses nums[i-k].','window_sum += nums[i] - nums[i-k]; best = max(best, window_sum)'],
      tests:[
        {argsRepr:'[2,1,5,1,3,2], 3', expectedRepr:'9'}
      ]},
    { id:'ps-greedy-when', mode:'choice', title:'When does a greedy approach actually work?',
      explain:'A greedy algorithm makes the locally-best choice at each step -- but that only produces the GLOBALLY best answer for certain problems.',
      scenario:'US coin denominations (25, 10, 5, 1) let a greedy "always take the biggest coin that fits" approach give the true minimum number of coins. Would this same greedy approach work for denominations (25, 10, 1) to make 30 cents?',
      choices:['Yes -- greedy always finds the minimum for any coin system', 'No -- greedy would pick 25+1+1+1+1+1 (6 coins) when 10+10+10 (3 coins) is actually better', 'It doesn\'t matter, both give the same answer here', 'Greedy never works for coin problems'],
      correct:1,
      feedback:['Greedy does NOT always work for arbitrary coin systems -- this is a classic counterexample showing exactly why.','Correct -- greedy takes the 25 first (locally best), then is stuck needing five 1s to reach 30, when skipping the 25 entirely (three 10s) uses far fewer coins. Greedy fails here because this denomination set isn\'t "canonical."','They give very different answers (6 coins vs 3) -- this is precisely the point of the example.','Greedy DOES work correctly for canonical systems like standard US currency -- it\'s specific denomination sets like this one where it fails.'] },
    { id:'ps-approach-choice', mode:'choice', title:'Brute force first, or optimize first?',
      explain:'A common, practical problem-solving discipline: get a correct (even if slow) solution working first, THEN optimize -- not the reverse.',
      scenario:'You\'re given a new, unfamiliar problem in an interview. What\'s the most reliable first step?',
      choices:['Immediately try to write the most optimized possible solution', 'Write a brute-force solution first to confirm you understand the problem correctly, then optimize', 'Skip straight to discussing time complexity without writing any code', 'Ask to skip the problem if you don\'t see the optimal approach immediately'],
      correct:1,
      feedback:['Jumping straight to the "clever" solution risks building the wrong thing efficiently, or getting stuck before ever having a working answer.','Correct -- a working brute-force solution proves you understand the problem, gives you something to test against, and is a real, gradable answer even if you run out of time to optimize it.','Complexity analysis before any concrete solution exists is premature -- it\'s much easier to reason about once you have working code to look at.','Skipping isn\'t problem-solving -- a slower, correct answer is almost always more valuable than no answer.'] },
    { id:'ps-complexity-intuition', mode:'choice', title:'Spotting hidden nested loops',
      explain:'Time complexity often hides inside function calls that look like a single operation but aren\'t.',
      scenario:'A function loops over a list of n items, and calls list.index(item) (a linear search) inside that loop for each one. What\'s the real time complexity, even though there\'s only one visible "for" loop?',
      choices:['O(n) -- there\'s only one loop written', 'O(n^2) -- .index() is itself a hidden linear scan, run once per outer iteration', 'O(log n) -- .index() is a fast lookup', 'It depends only on the size of the items, not the list'],
      correct:1,
      feedback:['Counting only the loops you can SEE misses the cost hiding inside function calls like .index().','Correct -- .index() itself scans the list linearly, and it\'s called once per outer iteration, so the real cost is n outer iterations times an O(n) inner scan = O(n^2).','.index() on a plain Python list is a linear scan, not a fast lookup -- that\'s exactly the hidden cost here.','List length is exactly what drives both the outer loop AND the cost of each .index() call -- it\'s the dominant factor.'] },
    { id:'ps-greedy-coins', mode:'test', title:'Greedy coin change (canonical system)', funcName:'min_coins',
      explain:'Implement the greedy algorithm itself: for a canonical coin system (like standard currency), always taking the largest coin that fits does give the true minimum count.',
      starter:'def min_coins(amount, coins):\n    # TODO: sort coins from largest to smallest, then for each coin,\n    # take as many as fit (amount // coin), reduce amount by that many,\n    # and count how many coins you used in total.\n    # Return -1 if amount can\'t be reduced to exactly 0.\n    pass',
      solution:'def min_coins(amount, coins):\n    coins = sorted(coins, reverse=True)\n    count = 0\n    for c in coins:\n        count += amount // c\n        amount %= c\n    return count if amount == 0 else -1',
      hints:['Sort coins largest-first so you always try the biggest denomination that could fit next.','amount // c tells you how many of that coin you can use; amount %= c leaves the remainder for smaller coins.','count += amount // c; amount %= c, for each coin in sorted(coins, reverse=True)'],
      tests:[
        {argsRepr:'63, [25,10,5,1]', expectedRepr:'6'}
      ]}
  ];

  function psKey(id, field){ return 'pstrack:'+id+':'+field; }
  function psSave(id, field, val){ try{ localStorage.setItem(psKey(id,field), val); }catch(e){} }
  function psLoad(id, field, fallback){ try{ var v=localStorage.getItem(psKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function psDoneKey(id){ return 'pstrack:'+id+':done'; }
  function psIsDone(id){ try{ return localStorage.getItem(psDoneKey(id))==='1'; }catch(e){ return false; } }
  function psEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var psCurIdx = 0;

  window.psOpen = function(idx){
    psCurIdx = idx;
    renderPsNav();
    renderPsLesson();
    window.scrollTo(0,0);
  };
  window.psNext = function(){ if(psCurIdx < PS_LESSONS.length-1) window.psOpen(psCurIdx+1); };
  window.psPrev = function(){ if(psCurIdx > 0) window.psOpen(psCurIdx-1); };
  window.psMarkDone = function(idx){
    try{ localStorage.setItem(psDoneKey(PS_LESSONS[idx].id), '1'); }catch(e){}
    renderPsNav();
  };

  function renderPsNav(){
    var nav = document.getElementById('psLessonNav');
    if(!nav) return;
    nav.innerHTML = PS_LESSONS.map(function(l, i){
      var done = psIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===psCurIdx?'active':'')+'" data-act="psOpen('+i+')">'+(i+1)+'. '+psEsc(l.title)+done+'</button>';
    }).join('');
  }

  function psNavRow(){
    return '<div class="wd-navrow">'
      + (psCurIdx>0 ? '<button class="wd-btn-ghost" data-act="psPrev()">&larr; Previous</button>' : '<span></span>')
      + (psCurIdx<PS_LESSONS.length-1 ? '<button class="wd-btn" data-act="psNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function renderPsLesson(){
    var body = document.getElementById('psLessonBody');
    if(!body) return;
    var l = PS_LESSONS[psCurIdx];

    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="pschoice_'+l.id+'_'+i+'" data-act="psAnswer(\''+l.id+'\','+i+')">'+psEsc(c)+'</button>';
      }).join('');
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(psCurIdx+1)+psEsc(l.title)+'</h2></div>'
        + trackMentalModel(psEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+psEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="psfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="psMarkDone('+psCurIdx+')">Mark task done</button></div>'
        + psNavRow();
      return;
    }

    var savedCode = psLoad(l.id, 'code', l.starter);
    var idBase = 'pspm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="psRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="psRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="pshint_'+l.id+'_'+(i+1)+'">'+psEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="pshint_'+l.id+'_99"><b>Solution:</b><pre>'+psEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(psCurIdx+1)+psEsc(l.title)+'</h2></div>'
      + trackMentalModel(psEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:140px">'+psEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="psRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
        + '<button class="wd-btn-ghost" data-act="psReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="psMarkDone('+psCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + psNavRow();
  }

  window.psReset = function(lessonId, editId){
    var l = PS_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    psSave(lessonId, 'code', l.starter);
  };
  window.psRevealHint = function(lessonId, tier){
    var l = PS_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('pshint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };
  window.psAnswer = function(lessonId, choiceIdx){
    var l = PS_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('pschoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('psfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };

  window.psRunTests = async function(lessonId, editId, outId, statusId){
    var l = PS_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    psSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_ps_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _exp = ('+t.expectedRepr+')\n'+
        '    _ok = (_r == _exp)\n'+
        '    _ps_results.append(("'+i+'", _ok, repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _ps_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _ps_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';

    try{
      py.globals.set('_SRC', fullSrc);
      py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT');
      var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){
        var parts = ln.split('|');
        return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+psEsc(parts[3])+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  var psBooted = false;
  window._psBoot = function(){
    if(psBooted) return;
    psBooted = true;
    window.psOpen(0);
  };
})();
