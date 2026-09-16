
(function(){
  // Reuses the exact fix-code pattern proven in Testing and AI Agents: a
  // correct, given test defines the expected behavior; the learner fixes
  // the buggy function underneath it. Shared Pyodide (getPy/RUN_HARNESS),
  // no new runtime.

  var DEBUG_LESSONS = [
    { id:'debug-off-by-one', title:'Off-by-one error', testName:'test_last_index',
      explain:'A classic off-by-one bug: returning the length of a list when you meant the index of its last element.',
      given:'def test_last_index():\n    assert last_index([1,2,3]) == 2\n\n',
      starter:'# BUG: this returns the wrong value -- run it and compare to what the test expects\ndef last_index(lst):\n    return len(lst)',
      hints:['The last valid index of a list is one less than its length.','len([1,2,3]) is 3, but the last index is 2.','def last_index(lst):\\n    return len(lst) - 1'],
      solution:'def last_index(lst):\n    return len(lst) - 1' },
    { id:'debug-comparison-operator', title:'Wrong comparison operator', testName:'test_is_adult',
      explain:'A boundary bug: using > instead of >= silently excludes the boundary value itself.',
      given:'def test_is_adult():\n    assert is_adult(18) == True\n    assert is_adult(17) == False\n\n',
      starter:'# BUG: someone exactly at the boundary age gets the wrong answer\ndef is_adult(age):\n    return age > 18',
      hints:['Check what happens at exactly age 18 -- should that count as an adult?','">" excludes the boundary value itself; ">=" includes it.','def is_adult(age):\\n    return age >= 18'],
      solution:'def is_adult(age):\n    return age >= 18' },
    { id:'debug-mutable-default', title:'The mutable default argument trap', testName:'test_add_item',
      explain:'One of Python\'s most famous gotchas: a mutable default argument (like []) is created ONCE and shared across every call that doesn\'t pass its own -- not fresh each time.',
      given:'def test_add_item():\n    a = add_item("x")\n    b = add_item("y")\n    assert a == ["x"]\n    assert b == ["y"]\n\n',
      starter:'# BUG: this list default is shared across calls -- run the test to see the surprising result\ndef add_item(item, lst=[]):\n    lst.append(item)\n    return lst',
      hints:['Default argument values are evaluated ONCE, when the function is defined, not fresh on every call.','The standard fix: default to None, then create a new list inside the function if none was given.','def add_item(item, lst=None):\\n    if lst is None:\\n        lst = []\\n    lst.append(item)\\n    return lst'],
      solution:'def add_item(item, lst=None):\n    if lst is None:\n        lst = []\n    lst.append(item)\n    return lst' },
    { id:'debug-type-error', title:'Type error: mixing str and int', testName:'test_format_score',
      explain:'Python won\'t silently convert an int to a string when concatenating with + -- you have to do it explicitly.',
      given:'def test_format_score():\n    assert format_score(85) == "Score: 85"\n\n',
      starter:'# BUG: run this and read the actual Python error message carefully\ndef format_score(score):\n    return "Score: " + score',
      hints:['Read the exact error message -- it names the two types that can\'t be concatenated directly.','You need to convert the number to a string before concatenating it with +.','def format_score(score):\\n    return "Score: " + str(score)'],
      solution:'def format_score(score):\n    return "Score: " + str(score)' },
    { id:'debug-off-by-one-loop', title:'A loop that skips the last element', testName:'test_sum_all',
      explain:'range(len(lst)-1) is a subtle off-by-one: it stops one element short of the end.',
      given:'def test_sum_all():\n    assert sum_all([1,2,3,4]) == 10\n\n',
      starter:'# BUG: this undercounts -- find out why by running it\ndef sum_all(nums):\n    total = 0\n    for i in range(len(nums)-1):\n        total += nums[i]\n    return total',
      hints:['range(len(nums)-1) produces indices 0 up to (but not including) len(nums)-1 -- one short of the real last index.','range(len(nums)) correctly covers every valid index, including the last one.','for i in range(len(nums)):\\n    total += nums[i]'],
      solution:'def sum_all(nums):\n    total = 0\n    for i in range(len(nums)):\n        total += nums[i]\n    return total' },
    { id:'debug-wrong-variable', title:'Debugging: the wrong variable was updated', testName:'test_running_total',
      explain:'A copy-paste style bug: updating the same variable twice instead of the two different ones that were meant to track separately.',
      given:'def test_running_total():\n    result = running_total([1,2,3], [10,20,30])\n    assert result == (6, 60)\n\n',
      starter:'# BUG: both totals end up wrong -- one variable is being updated instead of two\ndef running_total(list_a, list_b):\n    total_a = 0\n    total_b = 0\n    for x in list_a:\n        total_a += x\n    for y in list_b:\n        total_a += y\n    return (total_a, total_b)',
      hints:['Look at the second loop carefully -- which variable does it actually update?','The second loop should accumulate into total_b, not total_a.','for y in list_b:\\n    total_b += y'],
      solution:'def running_total(list_a, list_b):\n    total_a = 0\n    total_b = 0\n    for x in list_a:\n        total_a += x\n    for y in list_b:\n        total_b += y\n    return (total_a, total_b)' }
  ];

  function debugKey(id, field){ return 'debugtrack:'+id+':'+field; }
  function debugSave(id, field, val){ try{ localStorage.setItem(debugKey(id,field), val); }catch(e){} }
  function debugLoad(id, field, fallback){ try{ var v=localStorage.getItem(debugKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function debugDoneKey(id){ return 'debugtrack:'+id+':done'; }
  function debugIsDone(id){ try{ return localStorage.getItem(debugDoneKey(id))==='1'; }catch(e){ return false; } }
  function debugEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var debugCurIdx = 0;

  window.debugOpen = function(idx){
    debugCurIdx = idx;
    renderDebugNav();
    renderDebugLesson();
    window.scrollTo(0,0);
  };
  window.debugNext = function(){ if(debugCurIdx < DEBUG_LESSONS.length-1) window.debugOpen(debugCurIdx+1); };
  window.debugPrev = function(){ if(debugCurIdx > 0) window.debugOpen(debugCurIdx-1); };
  window.debugMarkDone = function(idx){
    try{ localStorage.setItem(debugDoneKey(DEBUG_LESSONS[idx].id), '1'); }catch(e){}
    renderDebugNav();
  };

  function renderDebugNav(){
    var nav = document.getElementById('debugLessonNav');
    if(!nav) return;
    nav.innerHTML = DEBUG_LESSONS.map(function(l, i){
      var done = debugIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===debugCurIdx?'active':'')+'" data-act="debugOpen('+i+')">'+(i+1)+'. '+debugEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderDebugLesson(){
    var body = document.getElementById('debugLessonBody');
    if(!body) return;
    var l = DEBUG_LESSONS[debugCurIdx];
    var savedCode = debugLoad(l.id, 'code', l.starter);
    var idBase = 'debugpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="debugRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="debugRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="debughint_'+l.id+'_'+(i+1)+'">'+debugEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="debughint_'+l.id+'_99"><b>Solution:</b><pre>'+debugEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(debugCurIdx+1)+debugEsc(l.title)+'</h2></div>'
      + trackMentalModel(debugEsc(l.explain))
      + '<div class="note"><b>Given, correct test</b> (do not edit -- shown for reference):<pre style="background:var(--code-bg);color:var(--code-text);border:1px solid var(--line);border-radius:8px;padding:10px;font-size:.8rem;margin-top:8px">'+debugEsc(l.given)+'</pre></div>'
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:120px">'+debugEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="debugRun(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run</button>'
        + '<button class="wd-btn-ghost" data-act="debugReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="debugMarkDone('+debugCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + '<div class="wd-navrow">'
        + (debugCurIdx>0 ? '<button class="wd-btn-ghost" data-act="debugPrev()">&larr; Previous</button>' : '<span></span>')
        + (debugCurIdx<DEBUG_LESSONS.length-1 ? '<button class="wd-btn" data-act="debugNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  window.debugReset = function(lessonId, editId){
    var l = DEBUG_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    debugSave(lessonId, 'code', l.starter);
  };

  window.debugRevealHint = function(lessonId, tier){
    var l = DEBUG_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('debughint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  window.debugRun = async function(lessonId, editId, outId, statusId){
    var l = DEBUG_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    debugSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var fullCode = code + '\n\n' + l.given;
    var harness = 'try:\n    ' + l.testName + '()\n    print("TEST_PASSED")\nexcept AssertionError as _e:\n    print("TEST_FAILED: " + str(_e))\nexcept Exception as _e:\n    print("ERROR: " + str(_e))\n';
    var fullSrc = fullCode + '\n' + harness;
    try{
      py.globals.set('_SRC', fullSrc);
      py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT');
      var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      if(out){
        out.innerHTML = result.indexOf('TEST_PASSED') >= 0
          ? '<div class="dsa-testrow pass"><span>'+debugEsc(l.testName)+'()</span><span>PASS</span></div>'
          : '<span class="err">'+escapeHtml(result)+'</span>';
      }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  var debugBooted = false;
  window._debugBoot = function(){
    if(debugBooted) return;
    debugBooted = true;
    window.debugOpen(0);
  };
})();
