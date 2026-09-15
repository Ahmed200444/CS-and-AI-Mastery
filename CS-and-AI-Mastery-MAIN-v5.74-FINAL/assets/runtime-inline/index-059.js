
(function(){
  var TEST_LESSONS = [
    { id:'test-unit-basics', mode:'write-test', title:'Writing your first unit test', testName:'test_is_even',
      explain:'A unit test calls a function and asserts on what it returns. Test both a True case and a False case for is_even -- one test alone rarely proves much.',
      given:'def is_even(n):\n    return n % 2 == 0\n\n',
      starter:'# TODO: write test_is_even() using assert -- check both an even\n# number and an odd number\ndef test_is_even():\n    pass',
      hints:['Call is_even with a known even number and assert the result is True.','Also call it with an odd number and assert the result is False -- one assertion per behavior you\'re checking.','assert is_even(4) == True\\nassert is_even(3) == False'],
      solution:'def test_is_even():\n    assert is_even(4) == True\n    assert is_even(3) == False' },
    { id:'test-integration', mode:'write-test', title:'An integration test: two functions together', testName:'test_checkout_flow',
      explain:'An integration test checks that multiple pieces work together correctly, not just each one in isolation -- here, adding items to a cart and then calculating its total.',
      given:'def add_to_cart(cart, price):\n    cart.append(price)\n    return cart\n\ndef cart_total(cart):\n    return sum(cart)\n\n',
      starter:'# TODO: write test_checkout_flow() -- add two items to an empty cart,\n# then assert cart_total gives their correct sum\ndef test_checkout_flow():\n    pass',
      hints:['Start with an empty list as the cart, then call add_to_cart twice.','After adding, call cart_total on the same cart and assert it equals the expected sum.','cart = []\\nadd_to_cart(cart, 10)\\nadd_to_cart(cart, 15)\\nassert cart_total(cart) == 25'],
      solution:'def test_checkout_flow():\n    cart = []\n    add_to_cart(cart, 10)\n    add_to_cart(cart, 15)\n    assert cart_total(cart) == 25' },
    { id:'test-mocking', mode:'write-test', title:'Mocking a slow/external dependency', testName:'test_get_greeting',
      explain:'Real code often calls something slow or external (a network request, a clock). A mock replaces that dependency with a fast, predictable stand-in so the TEST focuses on your own logic, not the external thing.',
      given:'def get_greeting(clock_fn):\n    hour = clock_fn()\n    if hour < 12:\n        return "Good morning"\n    return "Good afternoon"\n\n',
      starter:'# TODO: write test_get_greeting() -- instead of using a real clock,\n# pass in a fake clock_fn (a lambda returning a fixed hour) so the\n# test is fast and predictable\ndef test_get_greeting():\n    pass',
      hints:['clock_fn is just a function get_greeting calls -- you can pass ANY function, including a fake one.','lambda: 9 is a fake "clock" that always returns 9 (morning), with no real time involved.','assert get_greeting(lambda: 9) == "Good morning"\\nassert get_greeting(lambda: 15) == "Good afternoon"'],
      solution:'def test_get_greeting():\n    assert get_greeting(lambda: 9) == "Good morning"\n    assert get_greeting(lambda: 15) == "Good afternoon"' },
    { id:'test-coverage-decision', mode:'choice', title:'What does 100% test coverage actually guarantee?',
      explain:'Coverage measures which LINES ran during tests -- not whether the tests checked the right things.',
      scenario:'A function has 100% test coverage (every line executed at least once by the test suite). Does this guarantee the function is bug-free?',
      choices:['Yes -- 100% coverage means every possible bug has been caught', 'No -- coverage only shows which lines RAN, not whether the assertions checked the right outcomes', 'Yes, but only for functions under 10 lines', 'No -- coverage tools are usually broken'],
      correct:1,
      feedback:['This is the most common coverage misconception -- a line can execute with a weak or missing assertion and still count as "covered."','Correct -- a test that calls a function but asserts nothing meaningful (or the wrong thing) still gives 100% coverage on that line, while catching zero real bugs.','Coverage percentage isn\'t a function-size-dependent guarantee at any size.','Coverage tools work fine at measuring what ran -- the misconception is about what that measurement actually proves.'] },
    { id:'test-tdd', mode:'fix-code', title:'Test-driven development: make the test pass', testName:'test_clamp',
      explain:'In TDD, the test is written first and defines correct behavior; your job is to make the (already correct) test pass by fixing the implementation -- not to change the test.',
      given:'def test_clamp():\n    assert clamp(15, 0, 10) == 10\n    assert clamp(-5, 0, 10) == 0\n    assert clamp(5, 0, 10) == 5\n\n',
      starter:'# This function is not implemented yet -- make test_clamp (given, correct, above) pass\ndef clamp(value, lo, hi):\n    return value',
      hints:['clamp should keep a value within [lo, hi] -- pulling it up to lo if too low, down to hi if too high.','Python\'s built-in max() and min() do exactly this kind of bounding.','return max(lo, min(value, hi))'],
      solution:'def clamp(value, lo, hi):\n    return max(lo, min(value, hi))' },
    { id:'test-debug-failing', mode:'fix-code', title:'Debugging: fix the code, not the test', testName:'test_average',
      explain:'This test is correct and already given. The function it\'s testing has a real bug -- find and fix it so the test passes.',
      given:'def test_average():\n    assert average([2, 4, 6]) == 4\n\n',
      starter:'# BUG: this function has an off-by-one style error -- find it\ndef average(nums):\n    return sum(nums) / len(nums) - 1',
      hints:['Run the test and see exactly how far off the result is from what\'s expected.','average([2,4,6]) should be (2+4+6)/3 = 4 -- what\'s the extra "- 1" doing there?','def average(nums):\\n    return sum(nums) / len(nums)'],
      solution:'def average(nums):\n    return sum(nums) / len(nums)' }
  ];

  function testKey(id, field){ return 'testtrack:'+id+':'+field; }
  function testSave(id, field, val){ try{ localStorage.setItem(testKey(id,field), val); }catch(e){} }
  function testLoad(id, field, fallback){ try{ var v=localStorage.getItem(testKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function testDoneKey(id){ return 'testtrack:'+id+':done'; }
  function testIsDone(id){ try{ return localStorage.getItem(testDoneKey(id))==='1'; }catch(e){ return false; } }
  function testEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var testCurIdx = 0;

  window.testOpen = function(idx){
    testCurIdx = idx;
    renderTestNav();
    renderTestLesson();
    window.scrollTo(0,0);
  };
  window.testNext = function(){ if(testCurIdx < TEST_LESSONS.length-1) window.testOpen(testCurIdx+1); };
  window.testPrev = function(){ if(testCurIdx > 0) window.testOpen(testCurIdx-1); };
  window.testMarkDone = function(idx){
    try{ localStorage.setItem(testDoneKey(TEST_LESSONS[idx].id), '1'); }catch(e){}
    renderTestNav();
  };

  function renderTestNav(){
    var nav = document.getElementById('testLessonNav');
    if(!nav) return;
    nav.innerHTML = TEST_LESSONS.map(function(l, i){
      var done = testIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===testCurIdx?'active':'')+'" data-act="testOpen('+i+')">'+(i+1)+'. '+testEsc(l.title)+done+'</button>';
    }).join('');
  }

  function navRow(){
    return '<div class="wd-navrow">'
      + (testCurIdx>0 ? '<button class="wd-btn-ghost" data-act="testPrev()">&larr; Previous</button>' : '<span></span>')
      + (testCurIdx<TEST_LESSONS.length-1 ? '<button class="wd-btn" data-act="testNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function renderTestLesson(){
    var body = document.getElementById('testLessonBody');
    if(!body) return;
    var l = TEST_LESSONS[testCurIdx];

    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="testchoice_'+l.id+'_'+i+'" data-act="testAnswer(\''+l.id+'\','+i+')">'+testEsc(c)+'</button>';
      }).join('');
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(testCurIdx+1)+testEsc(l.title)+'</h2></div>'
        + trackMentalModel(testEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+testEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="testfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="testMarkDone('+testCurIdx+')">Mark task done</button></div>'
        + navRow();
      return;
    }

    var savedCode = testLoad(l.id, 'code', l.starter);
    var idBase = 'testpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="testRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="testRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="testhint_'+l.id+'_'+(i+1)+'">'+testEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="testhint_'+l.id+'_99"><b>Solution:</b><pre>'+testEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(testCurIdx+1)+testEsc(l.title)+'</h2></div>'
      + trackMentalModel(testEsc(l.explain))
      + (l.mode==='fix-code' ? '<div class="note"><b>Given, correct test</b> (do not edit -- shown for reference):<pre style="background:var(--code-bg);color:var(--code-text);border:1px solid var(--line);border-radius:8px;padding:10px;font-size:.8rem;margin-top:8px">'+testEsc(l.given)+'</pre></div>' : '')
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:130px">'+testEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="testRun(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run</button>'
        + '<button class="wd-btn-ghost" data-act="testReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="testMarkDone('+testCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + navRow();
  }

  window.testReset = function(lessonId, editId){
    var l = TEST_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    testSave(lessonId, 'code', l.starter);
  };
  window.testRevealHint = function(lessonId, tier){
    var l = TEST_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('testhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };
  window.testAnswer = function(lessonId, choiceIdx){
    var l = TEST_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('testchoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('testfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };

  window.testRun = async function(lessonId, editId, outId, statusId){
    var l = TEST_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    testSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var fullCode = (l.given || '') + code;
    var harness;
    if(l.mode === 'write-test'){
      harness = 'import ast as _ast\n'
        + '_SRC_TEXT = ' + JSON.stringify(code) + '\n'
        + 'def _has_assert(_fname):\n'
        + '    try:\n'
        + '        _tree = _ast.parse(_SRC_TEXT)\n'
        + '    except Exception:\n'
        + '        return False\n'
        + '    for _node in _ast.walk(_tree):\n'
        + '        if isinstance(_node, _ast.FunctionDef) and _node.name == _fname:\n'
        + '            return any(isinstance(_n, _ast.Assert) for _n in _ast.walk(_node))\n'
        + '    return False\n'
        + 'if not _has_assert(' + JSON.stringify(l.testName) + '):\n'
        + '    print("NO_ASSERT: write real assert statements, not an empty stub")\n'
        + 'else:\n'
        + '    try:\n'
        + '        ' + l.testName + '()\n'
        + '        print("TEST_PASSED")\n'
        + '    except AssertionError as _e:\n'
        + '        print("TEST_FAILED: " + str(_e))\n'
        + '    except Exception as _e:\n'
        + '        print("ERROR: " + str(_e))\n';
    } else {
      harness = 'try:\n'
        + '    ' + l.testName + '()\n'
        + '    print("TEST_PASSED")\n'
        + 'except AssertionError as _e:\n'
        + '    print("TEST_FAILED: " + str(_e))\n'
        + 'except Exception as _e:\n'
        + '    print("ERROR: " + str(_e))\n';
    }
    var fullSrc = fullCode + '\n\n' + harness;

    try{
      py.globals.set('_SRC', fullSrc);
      py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT');
      var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      if(out){
        if(result.indexOf('TEST_PASSED') >= 0) out.innerHTML = '<div class="dsa-testrow pass"><span>'+testEsc(l.testName)+'()</span><span>PASS</span></div>';
        else out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>';
      }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  var testBooted = false;
  window._testBoot = function(){
    if(testBooted) return;
    testBooted = true;
    window.testOpen(0);
  };
})();
