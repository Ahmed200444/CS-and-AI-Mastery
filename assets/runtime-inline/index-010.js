
(function(){
  // One coherent app (a Task Tracker) grows across all 9 Full-Stack Path
  // milestones. Every interactive piece reuses an engine ALREADY built
  // elsewhere on this platform -- no new runtime is created anywhere here:
  //   M1 Python core logic      -> shared Pyodide (getPy/RUN_HARNESS)
  //   M2 Web interface          -> shared sandboxed iframe playground pattern
  //   M3 API contract           -> the same request/response simulator pattern as the APIs track
  //   M4 Backend + JWT          -> shared Pyodide, extends the Backend track's own JWT functions
  //   M5 Database               -> the SAME sql.js engine already loaded for SQL Mastery (window.SQL) --
  //                                a fresh empty in-memory database, not a second engine
  //   M6 Git                    -> the same in-memory fake-repo pattern as the Git track
  //   M7 Docker                 -> the same regex structural-check pattern as the Docker track
  //   M8 Testing                -> shared Pyodide again, testing M1's own functions
  //   M9 Deployment             -> an external guidance card, same pattern as the Colab/Docker-local cards

  function capKey(id, field){ return 'captrack:'+id+':'+field; }
  function capSave(id, field, val){ try{ localStorage.setItem(capKey(id,field), val); }catch(e){} }
  function capLoad(id, field, fallback){ try{ var v=localStorage.getItem(capKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function capDoneKey(id){ return 'captrack:'+id+':done'; }
  function capIsDone(id){ try{ return localStorage.getItem(capDoneKey(id))==='1'; }catch(e){ return false; } }
  function capEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var CAP_MILESTONES = [
    { id:'cap-m1-python', title:'M1 · Python: core task logic', stage:'Python',
      note:'Prove the core logic works in plain functions with no UI at all -- everything built on top of this (API, database, frontend) depends on this logic being correct first.',
      objectives:['Model a task as a plain dict with id/title/done', 'Implement add, complete, and list-pending operations with no UI at all', 'Prove the logic works before any interface exists'],
      expected:'list_pending returns ["Write report"] after adding one task and completing none of them.',
      mode:'pytest', funcName:'task_scenario',
      starter:'def add_task(tasks, title):\n    # TODO: assign a new id (max existing id + 1, or 1 if empty),\n    # append {"id":..., "title":title, "done":False} to tasks, return the id\n    pass\n\ndef complete_task(tasks, task_id):\n    # TODO: find the task with this id, set its "done" to True, return True.\n    # If no task has this id, return False.\n    pass\n\ndef list_pending(tasks):\n    # TODO: return a list of titles for every task where done is False\n    pass\n\ndef task_scenario():\n    tasks = []\n    add_task(tasks, "Write report")\n    tid = add_task(tasks, "Fix bug")\n    complete_task(tasks, tid)\n    return list_pending(tasks)',
      solution:'def add_task(tasks, title):\n    new_id = max((t["id"] for t in tasks), default=0) + 1\n    tasks.append({"id": new_id, "title": title, "done": False})\n    return new_id\n\ndef complete_task(tasks, task_id):\n    for t in tasks:\n        if t["id"] == task_id:\n            t["done"] = True\n            return True\n    return False\n\ndef list_pending(tasks):\n    return [t["title"] for t in tasks if not t["done"]]\n\ndef task_scenario():\n    tasks = []\n    add_task(tasks, "Write report")\n    tid = add_task(tasks, "Fix bug")\n    complete_task(tasks, tid)\n    return list_pending(tasks)',
      hints:['add_task needs a fresh id -- the highest existing id plus one, or 1 for an empty list.','complete_task loops through tasks looking for a matching id.','list_pending is a one-line list comprehension filtering on "done".'],
      tests:[
        {argsRepr:'', expectedRepr:"['Write report']"}
      ] },
    { id:'cap-m2-webdev', title:'M2 · Web Development: HTML/CSS/JS + React interface', stage:'Web Development',
      note:'The backend from M1 needs a real interface -- this milestone connects working logic to something a person can actually click through in a browser.',
      objectives:['Render the task list from M1 as real DOM elements', 'Add a task via a form, toggle done/pending by clicking', 'Rebuild the same interface as a React component (via CDN) to see the difference directly'],
      expected:'Clicking a task toggles a strikethrough style; adding text and pressing the button appends a new task to the visible list.',
      mode:'web-multi' },
    { id:'cap-m3-apis', title:'M3 · APIs: the contract this app will speak', stage:'APIs',
      note:'A UI and a backend can only talk to each other through a well-defined contract -- this milestone is about designing and testing that contract directly, before wiring up a full server.',
      objectives:['Design the exact REST endpoints this app needs: list tasks, create a task, mark one complete', 'Practice the request/response cycle before any real backend exists'],
      expected:'GET /tasks returns the current list as JSON; POST /tasks with a valid body returns 201; PATCH /tasks/{id}/complete returns the updated task.',
      mode:'api-sim' },
    { id:'cap-m4-backend', title:'M4 · Backend Development: FastAPI logic + JWT login', stage:'Backend Development',
      note:'A real backend needs to authenticate who is making a request, not just answer it -- this milestone adds a genuine login flow using JSON Web Tokens.',
      objectives:['Implement a login(username, password) function that issues a real signed JWT on success', 'Implement get_current_user(token) that a protected route would call to identify the caller', 'See exactly how a "protected route" checks identity without a database lookup'],
      expected:'login("ahmed","correcthorse") returns a token; get_current_user on that token returns "ahmed"; a wrong password returns None.',
      mode:'pytest', funcName:'get_current_user',
      starter:'import hmac, hashlib, base64, json\n\ndef _b64url_encode(data):\n    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()\n\ndef _b64url_decode(s):\n    pad = "=" * (-len(s) % 4)\n    return base64.urlsafe_b64decode(s + pad)\n\ndef create_jwt(payload, secret):\n    header = {"alg": "HS256", "typ": "JWT"}\n    header_b64 = _b64url_encode(json.dumps(header).encode())\n    payload_b64 = _b64url_encode(json.dumps(payload).encode())\n    signing_input = header_b64 + "." + payload_b64\n    sig = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()\n    return signing_input + "." + _b64url_encode(sig)\n\ndef verify_jwt(token, secret):\n    try:\n        header_b64, payload_b64, sig_b64 = token.split(".")\n    except ValueError:\n        return None\n    signing_input = header_b64 + "." + payload_b64\n    expected_sig = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()\n    if not hmac.compare_digest(_b64url_encode(expected_sig), sig_b64):\n        return None\n    return json.loads(_b64url_decode(payload_b64))\n\nUSERS = {"ahmed": "correcthorse"}\nSECRET = "taskflow-secret"\n\ndef login(username, password):\n    # TODO: check USERS.get(username) == password; if it matches,\n    # return create_jwt({"user_id": username}, SECRET); otherwise return None\n    pass\n\ndef get_current_user(token):\n    # TODO: verify_jwt(token, SECRET); if it\'s valid, return payload["user_id"];\n    # otherwise return None\n    pass',
      solution:'def login(username, password):\n    if USERS.get(username) != password:\n        return None\n    return create_jwt({"user_id": username}, SECRET)\n\ndef get_current_user(token):\n    payload = verify_jwt(token, SECRET)\n    return payload["user_id"] if payload else None',
      hints:['login should return None immediately if the password doesn\'t match.','On a correct password, wrap the username in a JWT using the already-provided create_jwt.','get_current_user just calls verify_jwt and pulls "user_id" out of the result if it\'s not None.'],
      tests:[
        {argsRepr:'login("ahmed","correcthorse")', expectedRepr:"'ahmed'"},
        {argsRepr:'login("ahmed","wrongpass")', expectedRepr:'None'}
      ] },
    { id:'cap-m5-databases', title:'M5 · Databases: real persistence', stage:'Databases',
      note:'In-memory data disappears when the app restarts -- this milestone replaces that with real, persistent storage using actual SQL.',
      objectives:['Create a real tasks table with a schema matching M1\'s data shape', 'Insert real rows and query them back with SQL', 'Update a row\'s done status directly in the database'],
      expected:'Querying pending tasks for user 1 returns 2 rows before completing one, then 1 row after.',
      mode:'sql' },
    { id:'cap-m6-git', title:'M6 · Git: version-controlling the growing app', stage:'Git & GitHub',
      note:'A growing app with real history needs real version control -- this milestone practices the everyday git workflow on the SAME project you have been building, not an isolated exercise.',
      objectives:['Commit the app\'s progress in meaningful stages, the way a real engineer would', 'Practice creating a feature branch for one new piece of work'],
      expected:'Your fake repo\'s log shows a clean history: initial commit, then one commit per milestone you\'ve built so far.',
      mode:'git-sim' },
    { id:'cap-m7-docker', title:'M7 · Docker: containerizing the backend', stage:'Docker',
      note:'Getting an app to run does not mean it will run the SAME way somewhere else -- this milestone packages the backend into a container so its environment travels with it.',
      objectives:['Write a Dockerfile that correctly packages the FastAPI backend from M4', 'Get the layer-caching order right, the same way the standalone Docker course teaches it'],
      expected:'All 4 structural checks pass: correct base image, dependency install cached before the app code copy, correct start command.',
      mode:'docker-check' },
    { id:'cap-m8-testing', title:'M8 · Testing: proving it actually works', stage:'Testing',
      note:'Code that appears to work is not the same as code that is proven to work -- this milestone writes real tests against the app you have actually built, not a toy example.',
      objectives:['Write real test functions for M1\'s core logic, not just eyeball it', 'See a test genuinely fail before it\'s correct, and genuinely pass once it is'],
      expected:'All 3 test functions run without raising -- a real assertion failure would show exactly which one and why.',
      mode:'pytest-write',
      starter:'# The core logic from M1 (already correct -- your job is to test it, not rewrite it)\ndef add_task(tasks, title):\n    new_id = max((t["id"] for t in tasks), default=0) + 1\n    tasks.append({"id": new_id, "title": title, "done": False})\n    return new_id\n\ndef complete_task(tasks, task_id):\n    for t in tasks:\n        if t["id"] == task_id:\n            t["done"] = True\n            return True\n    return False\n\ndef list_pending(tasks):\n    return [t["title"] for t in tasks if not t["done"]]\n\n# TODO: write these three tests using assert -- each should raise\n# AssertionError if the behavior is wrong, and do nothing if it\'s right\ndef test_add_task_appears_in_pending():\n    pass\n\ndef test_complete_task_removes_from_pending():\n    pass\n\ndef test_complete_nonexistent_task_returns_false():\n    pass',
      hints:['A test function calls the code under test, then asserts on the result -- assert actual == expected.','test_add_task_appears_in_pending: add one task to an empty list, then assert list_pending(tasks) equals a list containing just its title.','test_complete_task_removes_from_pending: add a task, complete it using the id add_task returned, then assert list_pending(tasks) is now empty.'] },
    { id:'cap-m9-deployment', title:'M9 · Deployment: publishing it live', stage:'Model & App Deployment',
      note:'A finished app that only runs on your own machine is not actually finished -- this final milestone covers what real deployment involves, honestly, without pretending to deploy for you.',
      objectives:['Understand the real steps to take this app from your machine to a live URL', 'Know what changes between local development and production (environment variables, a real Postgres instance, HTTPS)'],
      expected:'A live URL you can open in any browser -- the actual finish line of the whole path.',
      mode:'external' }
  ];

  var capCurIdx = 0;

  window.capOpen = function(idx){
    capCurIdx = idx;
    renderCapNav();
    renderCapLesson();
    window.scrollTo(0,0);
  };
  window.capNext = function(){ if(capCurIdx < CAP_MILESTONES.length-1) window.capOpen(capCurIdx+1); };
  window.capPrev = function(){ if(capCurIdx > 0) window.capOpen(capCurIdx-1); };
  window.capMarkDone = function(idx){
    try{ localStorage.setItem(capDoneKey(CAP_MILESTONES[idx].id), '1'); }catch(e){}
    renderCapNav();
  };

  function renderCapNav(){
    var nav = document.getElementById('capLessonNav');
    if(!nav) return;
    nav.innerHTML = CAP_MILESTONES.map(function(l, i){
      var done = capIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===capCurIdx?'active':'')+'" data-act="capOpen('+i+')">'+(i+1)+'. '+capEsc(l.title.split('\u00b7')[1]||l.title)+done+'</button>';
    }).join('');
  }

  function objectivesBlock(l){
    return '<div class="cap-obj"><b>Learning objectives</b><ul>'
      + l.objectives.map(function(o){ return '<li>'+capEsc(o)+'</li>'; }).join('')
      + '</ul></div>';
  }
  function expectedBlock(l){
    return '<div class="cap-expected"><b>Expected output:</b> '+capEsc(l.expected)+'</div>';
  }
  function navRowHtml(){
    return '<div class="wd-navrow">'
      + (capCurIdx>0 ? '<button class="wd-btn-ghost" data-act="capPrev()">&larr; Previous milestone</button>' : '<span></span>')
      + (capCurIdx<CAP_MILESTONES.length-1 ? '<button class="wd-btn" data-act="capNext()">Next milestone &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function markDoneRow(){
    return '<div class="wd-row"><button class="wd-btn-ghost" data-act="capMarkDone('+capCurIdx+')">Mark milestone done</button></div>';
  }

  function renderCapLesson(){
    var body = document.getElementById('capLessonBody');
    if(!body) return;
    var l = CAP_MILESTONES[capCurIdx];
    var head = '<div class="wd-lesson-head"><h2>'+trackNumBadge(capCurIdx+1)+capEsc(l.title)+'</h2></div>' + trackMentalModel(capEsc(l.note)) + objectivesBlock(l);

    if(l.mode === 'pytest' || l.mode === 'pytest-write'){
      renderPytestMilestone(body, head, l);
    } else if(l.mode === 'web-multi'){
      renderWebMultiMilestone(body, head, l);
    } else if(l.mode === 'api-sim'){
      renderApiSimMilestone(body, head, l);
    } else if(l.mode === 'sql'){
      renderSqlMilestone(body, head, l);
    } else if(l.mode === 'git-sim'){
      renderGitSimMilestone(body, head, l);
    } else if(l.mode === 'docker-check'){
      renderDockerCheckMilestone(body, head, l);
    } else if(l.mode === 'external'){
      renderExternalMilestone(body, head, l);
    }
  }

  // ---- M1 / M4 / M8: Python test-harness (shared Pyodide, no new runtime) ----
  function renderPytestMilestone(body, head, l){
    var savedCode = capLoad(l.id, 'code', l.starter);
    var idBase = 'cappm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = '', hintBoxes = '';
    if(l.hints){
      hintHtml = l.hints.map(function(h,i){
        return '<button data-act="capRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
      }).join('') + '<button data-act="capRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
      hintBoxes = l.hints.map(function(h,i){
        return '<div class="wd-hintbox" id="caphint_'+l.id+'_'+(i+1)+'">'+capEsc(h)+'</div>';
      }).join('') + '<div class="wd-hintbox" id="caphint_'+l.id+'_99"><b>Solution:</b><pre>'+capEsc(l.solution||'')+'</pre></div>';
    }
    body.innerHTML = head + expectedBlock(l)
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:160px">'+capEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="capRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
        + '<button class="wd-btn-ghost" data-act="capResetPy(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="capMarkDone('+capCurIdx+')">Mark milestone done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + navRowHtml();
  }

  window.capResetPy = function(lessonId, editId){
    var l = CAP_MILESTONES.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    capSave(lessonId, 'code', l.starter);
  };
  window.capRevealHint = function(lessonId, tier){
    var l = CAP_MILESTONES.find(function(x){ return x.id === lessonId; });
    if(!l || !l.hints) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('caphint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  window.capRunTests = async function(lessonId, editId, outId, statusId){
    var l = CAP_MILESTONES.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    capSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }

    if(l.mode === 'pytest-write'){
      // M8: the learner writes test_* functions. Running them and catching
      // AssertionError isn't enough on its own -- an empty `pass` body never
      // raises, so it would report success without testing anything. This
      // harness ALSO parses the code's AST to confirm each required test
      // function actually contains a real assert statement, catching that
      // exact vacuous-pass case before it can look like a completed milestone.
      var testNames = ['test_add_task_appears_in_pending','test_complete_task_removes_from_pending','test_complete_nonexistent_task_returns_false'];
      var astCheck = 'import ast as _ast\n'
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
        + '_test_names = ' + JSON.stringify(testNames) + '\n'
        + '_missing_assert = [n for n in _test_names if not _has_assert(n)]\n'
        + 'if _missing_assert:\n'
        + '    print("NO_ASSERT: " + ", ".join(_missing_assert) + " -- write real assert statements, not empty stubs")\n'
        + 'else:\n'
        + '    try:\n'
        + '        test_add_task_appears_in_pending()\n'
        + '        test_complete_task_removes_from_pending()\n'
        + '        test_complete_nonexistent_task_returns_false()\n'
        + '        print("ALL_TESTS_PASSED")\n'
        + '    except AssertionError as _e:\n'
        + '        print("TEST_FAILED: " + str(_e))\n'
        + '    except Exception as _e:\n'
        + '        print("ERROR: " + str(_e))\n';
      var fullSrc2 = code + '\n\n' + astCheck;
      var py2;
      try{ py2 = await getPy(statusId); }
      catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }
      py2.globals.set('_SRC', fullSrc2);
      py2.runPython(RUN_HARNESS);
      var result2 = py2.globals.get('_RESULT');
      var iserr2 = py2.globals.get('_ISERR');
      if(iserr2){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result2)+'</span>'; return; }
      if(out){
        if(result2.indexOf('ALL_TESTS_PASSED') >= 0) out.innerHTML = '<b>All 3 tests passed.</b>';
        else out.innerHTML = '<span class="err">'+escapeHtml(result2)+'</span>';
      }
      return;
    }

    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_cap_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _exp = ('+t.expectedRepr+')\n'+
        '    _ok = (abs(_r - _exp) < 1e-9) if isinstance(_r, (int, float)) and isinstance(_exp, (int, float)) and not isinstance(_r, bool) and not isinstance(_exp, bool) else (_r == _exp)\n'+
        '    _cap_results.append(("'+i+'", _ok, repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _cap_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _cap_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';

    try{
      try{ await py.loadPackagesFromImports(fullSrc); }catch(e){}
      py.globals.set('_SRC', fullSrc);
      py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT');
      var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){
        var parts = ln.split('|');
        var idx = parts[1], status = parts[2], detail = parts[3];
        return '<div class="dsa-testrow '+(status==='PASS'?'pass':'fail')+'"><span>Test '+(Number(idx)+1)+'</span><span>'+status+' &mdash; got '+capEsc(detail)+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  // ---- M2: Web Development -- vanilla JS + React sub-tabs (shared iframe pattern) ----
  var CAP_WEB_SUB = {
    vanilla: {
      html:'<ul id="task-list"></ul>\n<input id="new-task" aria-label="New task" placeholder="New task">\n<button id="add-btn">Add</button>',
      css:'body{font-family:sans-serif;padding:16px} li.done{text-decoration:line-through;color:#888} li{cursor:pointer}',
      js:'// TODO: render `tasks` into #task-list as <li> elements (add class "done"\n// when a task is done); clicking an <li> toggles its done state and\n// re-renders; the Add button appends a new task from the input and re-renders\nvar tasks = [\n  {id:1, title:"Write report", done:false},\n  {id:2, title:"Fix bug", done:true}\n];\n\nfunction render(){\n  console.log("implement render() here");\n}\n\ndocument.getElementById("add-btn").addEventListener("click", function(){\n  console.log("implement add here");\n});\n\nrender();'
    },
    react: {
      html:'<div id="root"></div>\n<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"><\/script>\n<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>\n<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>',
      css:'body{font-family:sans-serif;padding:16px} li.done{text-decoration:line-through;color:#888} li{cursor:pointer}',
      js:'/* babel */\n// TODO: the exact same task list, now as a React component using useState.\n// This block runs as JSX (Babel transpiles it in the browser -- fine for\n// learning, not how you\'d ship this in production).\nfunction App(){\n  const [tasks, setTasks] = React.useState([\n    {id:1, title:"Write report", done:false},\n    {id:2, title:"Fix bug", done:true}\n  ]);\n\n  function toggle(id){\n    console.log("implement toggle here");\n  }\n\n  return (\n    <ul>\n      {tasks.map(t => (\n        <li key={t.id} className={t.done ? "done" : ""} onClick={() => toggle(t.id)}>{t.title}</li>\n      ))}\n    </ul>\n  );\n}\nReactDOM.createRoot(document.getElementById("root")).render(<App />);'
    }
  };
  var capWebSub = 'vanilla';

  function renderWebMultiMilestone(body, head, l){
    var idBase = 'capweb_'+capWebSub;
    var htmlId=idBase+'_html', cssId=idBase+'_css', jsId=idBase+'_js', frameId=idBase+'_frame', outId=idBase+'_out';
    var cfg = CAP_WEB_SUB[capWebSub];
    var savedHtml = capLoad(l.id, capWebSub+'_html', cfg.html);
    var savedCss = capLoad(l.id, capWebSub+'_css', cfg.css);
    var savedJs = capLoad(l.id, capWebSub+'_js', cfg.js);

    body.innerHTML = head + expectedBlock(l)
      + '<div class="cap-tabs">'
        + '<button class="cap-subtab '+(capWebSub==='vanilla'?'active':'')+'" data-act="capWebSwitch(\'vanilla\')">Vanilla JS</button>'
        + '<button class="cap-subtab '+(capWebSub==='react'?'active':'')+'" data-act="capWebSwitch(\'react\')">React (via CDN)</button>'
      + '</div>'
      + (capWebSub==='react' ? '<p style="font-size:.8rem;color:var(--sub)">This sub-task loads React from a CDN inside the preview iframe -- it needs your browser to have internet access (same as the SQL engine elsewhere on this platform); it will not load in an offline sandbox.</p>' : '')
      + '<div class="wd-pm-fields">'
        + trackEditorShell('index.html', '<textarea class="wd-edit" id="'+htmlId+'" aria-label="Code editor" spellcheck="false" style="min-height:70px">'+capEsc(savedHtml)+'</textarea>')
        + trackEditorShell('style.css', '<textarea class="wd-edit" id="'+cssId+'" aria-label="Code editor" spellcheck="false" style="min-height:50px">'+capEsc(savedCss)+'</textarea>')
        + trackEditorShell('script.js', '<textarea class="wd-edit" id="'+jsId+'" aria-label="Code editor" spellcheck="false" style="min-height:110px">'+capEsc(savedJs)+'</textarea>')
      + '</div>'
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="capWebRun(\''+htmlId+'\',\''+cssId+'\',\''+jsId+'\',\''+frameId+'\',\''+outId+'\')">&#9654; Run</button>'
        + '<button class="wd-btn-ghost" data-act="capWebReset(\''+l.id+'\',\''+htmlId+'\',\''+cssId+'\',\''+jsId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="capMarkDone('+capCurIdx+')">Mark milestone done</button>'
      + '</div>'
      + '<iframe class="wd-iframe" id="'+frameId+'" sandbox="allow-scripts" title="Live preview"></iframe>'
      + '<div class="wd-field-label">console output</div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + navRowHtml();

    window.capWebRun(htmlId, cssId, jsId, frameId, outId);
  }

  window.capWebSwitch = function(sub){
    capWebSub = sub;
    renderCapLesson();
  };

  var capWebMsgAttached = false;
  function capWebAttachMsg(){
    if(capWebMsgAttached) return;
    capWebMsgAttached = true;
    window.addEventListener('message', function(ev){
      var d = ev.data;
      if(!d || !d.capweb) return;
      var out = document.getElementById(d.outId);
      if(out) out.textContent += (out.textContent ? '\n' : '') + d.line;
    });
  }
  capWebAttachMsg();

  window.capWebRun = function(htmlId, cssId, jsId, frameId, outId){
    var html = (document.getElementById(htmlId)||{}).value || '';
    var css = (document.getElementById(cssId)||{}).value || '';
    var js = (document.getElementById(jsId)||{}).value || '';
    var lessonId = CAP_MILESTONES[capCurIdx].id;
    capSave(lessonId, capWebSub+'_html', html); capSave(lessonId, capWebSub+'_css', css); capSave(lessonId, capWebSub+'_js', js);
    var out = document.getElementById(outId); if(out) out.textContent = '';
    var frame = document.getElementById(frameId);
    if(!frame) return;
    var isReact = capWebSub === 'react';
    var jsBlock = isReact
      ? '<script type="text/babel">(function(){var OUT_ID='+JSON.stringify(outId)+';'
        + 'console.log=function(){var a=Array.prototype.slice.call(arguments).map(String).join(" ");parent.postMessage({capweb:true,outId:OUT_ID,line:a},"*");};'
        + 'window.onerror=function(msg){parent.postMessage({capweb:true,outId:OUT_ID,line:"Error: "+msg},"*");return true;};'
        + 'try{\n' + js + '\n}catch(e){console.log("Error: "+e.message);}'
        + '})();<\/script>'
      : '<script>(function(){var OUT_ID='+JSON.stringify(outId)+';'
        + 'console.log=function(){var a=Array.prototype.slice.call(arguments).map(String).join(" ");parent.postMessage({capweb:true,outId:OUT_ID,line:a},"*");};'
        + 'window.onerror=function(msg){parent.postMessage({capweb:true,outId:OUT_ID,line:"Error: "+msg},"*");return true;};'
        + 'try{\n' + js + '\n}catch(e){console.log("Error: "+e.message);}'
        + '})();<\/script>';
    var srcdoc = '<!doctype html><html><head><meta charset="utf-8"><style>'+css+'</style></head><body>'
      + html + jsBlock + '</body></html>';
    frame.srcdoc = srcdoc;
  };

  window.capWebReset = function(lessonId, htmlId, cssId, jsId){
    var cfg = CAP_WEB_SUB[capWebSub];
    var h=document.getElementById(htmlId), c=document.getElementById(cssId), j=document.getElementById(jsId);
    if(h) h.value = cfg.html; if(c) c.value = cfg.css; if(j) j.value = cfg.js;
    capSave(lessonId, capWebSub+'_html', cfg.html); capSave(lessonId, capWebSub+'_css', cfg.css); capSave(lessonId, capWebSub+'_js', cfg.js);
  };

  // ---- M3: APIs -- request/response simulator (same pattern as the APIs track) ----
  var CAP_API_RESPONDER = function(req){
    if(req.method === 'GET' && (req.url||'').indexOf('/tasks') === 0 && (req.url||'').indexOf('/tasks/') !== 0){
      return {status:200, body:[{id:1,title:'Write report',done:false},{id:2,title:'Fix bug',done:true}]};
    }
    if(req.method === 'POST' && req.url === '/tasks'){
      var parsed;
      try{ parsed = JSON.parse(req.body||''); }catch(e){ return {status:400, body:{error:'Invalid JSON'}}; }
      if(!parsed || typeof parsed.title !== 'string' || !parsed.title) return {status:400, body:{error:'Missing required field: title'}};
      return {status:201, body:{id:3, title:parsed.title, done:false}};
    }
    var m = (req.url||'').match(/^\/tasks\/(\d+)\/complete$/);
    if(req.method === 'PATCH' && m){
      return {status:200, body:{id:Number(m[1]), done:true}};
    }
    return {status:404, body:{error:'No matching route for '+req.method+' '+req.url}};
  };

  function renderApiSimMilestone(body, head, l){
    var idBase = 'capapi';
    var methodId=idBase+'_method', urlId=idBase+'_url', bodyId=idBase+'_body', outId=idBase+'_out';
    var savedMethod = capLoad(l.id, 'method', 'GET');
    var savedUrl = capLoad(l.id, 'url', '/tasks');
    var savedBody = capLoad(l.id, 'body', '');
    body.innerHTML = head + expectedBlock(l)
      + '<div class="card">'
      + '<div class="api-field-row">'
        + '<select class="api-method-select" id="'+methodId+'" aria-label="HTTP method">'
          + ['GET','POST','PATCH'].map(function(m){ return '<option value="'+m+'"'+(m===savedMethod?' selected':'')+'>'+m+'</option>'; }).join('')
        + '</select>'
        + '<input class="api-url-input" id="'+urlId+'" aria-label="API endpoint URL" value="'+capEsc(savedUrl)+'" spellcheck="false">'
      + '</div>'
      + trackEditorShell('request-body.json', '<textarea class="wd-edit" id="'+bodyId+'" aria-label="Code editor" spellcheck="false" style="min-height:50px">'+capEsc(savedBody)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="capApiSend(\''+methodId+'\',\''+urlId+'\',\''+bodyId+'\',\''+outId+'\')">&#9654; Send</button>'
        + '<button class="wd-btn-ghost" data-act="capMarkDone('+capCurIdx+')">Mark milestone done</button>'
      + '</div>'
      + '<div id="'+outId+'">(build a request above and click Send -- try GET /tasks, POST /tasks with {"title":"New one"}, and PATCH /tasks/1/complete)</div>'
      + '</div>'
      + navRowHtml();
  }

  window.capApiSend = function(methodId, urlId, bodyId, outId){
    var method = (document.getElementById(methodId)||{}).value || 'GET';
    var url = (document.getElementById(urlId)||{}).value || '';
    var bodyRaw = (document.getElementById(bodyId)||{}).value || '';
    var lessonId = CAP_MILESTONES[capCurIdx].id;
    capSave(lessonId, 'method', method); capSave(lessonId, 'url', url); capSave(lessonId, 'body', bodyRaw);
    var resp = CAP_API_RESPONDER({method:method, url:url, body:bodyRaw});
    var out = document.getElementById(outId);
    if(!out) return;
    var statusClass = resp.status < 300 ? 'ok' : 'err';
    out.innerHTML = '<div class="api-response-box '+statusClass+'"><span class="api-status-badge">'+resp.status+'</span>'
      + capEsc(method)+' '+capEsc(url)+'\n\n'+capEsc(JSON.stringify(resp.body, null, 2))+'</div>';
  };

  // ---- M5: Databases -- reuses the SAME sql.js engine (window.SQL), no new runtime ----
  var capDb = null;
  function renderSqlMilestone(body, head, l){
    var idBase = 'capsql';
    var editId=idBase+'_edit', outId=idBase+'_out';
    var savedSql = capLoad(l.id, 'sql', '-- TODO: create the tasks table, insert the 3 sample rows,\n-- then write a SELECT for pending tasks belonging to user 1\nCREATE TABLE tasks (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  title TEXT NOT NULL,\n  done INTEGER NOT NULL DEFAULT 0,\n  user_id INTEGER NOT NULL\n);\n\nINSERT INTO tasks (title, user_id) VALUES (\'Write report\', 1);\nINSERT INTO tasks (title, user_id) VALUES (\'Fix bug\', 1);\nINSERT INTO tasks (title, done, user_id) VALUES (\'Deploy app\', 1, 2);\n\nSELECT id, title FROM tasks WHERE user_id = 1 AND done = 0;');
    body.innerHTML = head + expectedBlock(l)
      + '<p style="font-size:.8rem;color:var(--sub)">Uses the same real SQL engine as the SQL Mastery track (sql.js/SQLite) -- the fundamentals here are identical to PostgreSQL; the "PostgreSQL in practice" lesson in the Databases course covers Postgres-specific syntax on top of this.</p>'
      + '<div class="card">'
      + trackEditorShell(l.id+'.sql', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:180px">'+capEsc(savedSql)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="capSqlRun(\''+editId+'\',\''+outId+'\')">&#9654; Run SQL</button>'
        + '<button class="wd-btn-ghost" data-act="capMarkDone('+capCurIdx+')">Mark milestone done</button>'
      + '</div>'
      + '<div id="'+outId+'" class="wd-out">(waiting for the SQL engine to load...)</div>'
      + '</div>'
      + navRowHtml();
    capSqlEnsureReady(outId);
  }

  function capSqlEnsureReady(outId, attempt){
    attempt = attempt || 0;
    var out = document.getElementById(outId);
    if(window.SQL){
      if(!capDb) capDb = new window.SQL.Database();
      if(out && out.textContent.indexOf('waiting') >= 0) out.textContent = 'Ready -- click Run SQL.';
      return;
    }
    if(attempt >= 25){ // ~10s total -- matches the SQL Mastery track's own load-failure message instead of retrying forever
      if(out) out.textContent = 'Could not load the SQL engine (needs internet the first time). On Netlify it works.';
      return;
    }
    if(out) out.textContent = 'Waiting for the SQL engine to finish loading (needs internet the first time; on Netlify this works)...';
    setTimeout(function(){ capSqlEnsureReady(outId, attempt + 1); }, 400);
  }

  window.capSqlRun = function(editId, outId){
    var sql = (document.getElementById(editId)||{}).value || '';
    capSave(CAP_MILESTONES[capCurIdx].id, 'sql', sql);
    var out = document.getElementById(outId);
    if(!out) return;
    if(!window.SQL){ out.innerHTML = '<span class="err">SQL engine not loaded yet.</span>'; return; }
    try{
      capDb = new window.SQL.Database(); // fresh db each run, so re-running is idempotent
      var stmts = sql.split(';').map(function(s){ return s.trim(); }).filter(Boolean);
      var lastResult = null;
      stmts.forEach(function(stmt){
        var res = capDb.exec(stmt + ';');
        if(res && res.length) lastResult = res[0];
      });
      if(!lastResult){ out.textContent = 'Ran successfully -- no SELECT result to show (did your last statement return rows?).'; return; }
      var html = '<div class="grid-wrap"><table><tr>' + lastResult.columns.map(function(c){ return '<th>'+capEsc(c)+'</th>'; }).join('') + '</tr>'
        + lastResult.values.map(function(row){ return '<tr>' + row.map(function(v){ return '<td>'+(v===null?'NULL':capEsc(v))+'</td>'; }).join('') + '</tr>'; }).join('')
        + '</table></div>';
      out.innerHTML = html;
    }catch(e){
      out.innerHTML = '<span class="err">'+capEsc(e.message)+'</span>';
    }
  };

  // ---- M6: Git -- reuses the same in-memory fake-repo pattern as the Git track ----
  function freshCapRepo(){ return { branches:{main:[{msg:'(initial state)', files:[]}]}, current:'main', staged:[] }; }
  var CAP_GIT_REPO = freshCapRepo();

  function renderGitSimMilestone(body, head, l){
    var idBase = 'capgit';
    var inId=idBase+'_in', outId=idBase+'_out';
    body.innerHTML = head + expectedBlock(l)
      + '<p class="wd-lesson-explain"><span class="cx-pm-badge cx-pm-badge-sim" style="display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:6px;margin-right:6px;background:#3a2f12;color:#f0b878;vertical-align:middle">SIMULATION</span>An in-memory fake repository -- no changes are made on disk.</p>'
      + '<div class="card">'
      + trackEditorShell('terminal', '<textarea class="wd-edit" id="'+inId+'" aria-label="Code editor" spellcheck="false" style="min-height:34px" placeholder="e.g. commit -m &quot;Add core task logic (M1)&quot;"></textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="capGitRun(\''+inId+'\',\''+outId+'\')">&#9654; Run command</button>'
        + '<button class="wd-btn-ghost" data-act="capGitReset(\''+outId+'\')">Reset repo</button>'
        + '<button class="wd-btn-ghost" data-act="capMarkDone('+capCurIdx+')">Mark milestone done</button>'
      + '</div>'
      + '<div class="wd-out" id="'+outId+'">(try: add app.py, then commit -m "Add core task logic (M1)", then log)</div>'
      + '</div>'
      + navRowHtml();
  }

  window.capGitRun = function(inId, outId){
    var cmd = ((document.getElementById(inId)||{}).value || '').trim();
    var out = document.getElementById(outId);
    if(!out || !cmd) return;
    if(out.textContent.indexOf('(try:') === 0) out.textContent = '';
    out.textContent += (out.textContent ? '\n' : '') + '$ '+cmd;
    var repo = CAP_GIT_REPO, m;
    if((m=/^add\s+(.+)$/.exec(cmd))){ repo.staged.push(m[1]); out.textContent += '\nstaged: '+m[1]; }
    else if((m=/^commit\s+-m\s+"(.*)"$/.exec(cmd))){
      if(!repo.staged.length){ out.textContent += '\nnothing to commit -- stage a file first with: add <file>'; }
      else { repo.branches[repo.current].push({msg:m[1], files:repo.staged.slice()}); out.textContent += '\n['+repo.current+'] '+m[1]; repo.staged=[]; }
    }
    else if((m=/^branch\s+(\S+)$/.exec(cmd))){
      if(repo.branches[m[1]]) out.textContent += '\nbranch already exists';
      else { repo.branches[m[1]] = repo.branches[repo.current].slice(); out.textContent += '\ncreated branch \''+m[1]+'\''; }
    }
    else if((m=/^checkout\s+(\S+)$/.exec(cmd))){
      if(!repo.branches[m[1]]) out.textContent += '\nerror: branch does not exist';
      else { repo.current = m[1]; out.textContent += '\nswitched to \''+m[1]+'\''; }
    }
    else if(cmd==='log'){ out.textContent += '\n'+repo.branches[repo.current].map(function(c,i){ return (i+1)+'. '+c.msg; }).join('\n'); }
    else { out.textContent += '\nunrecognized simulated command: '+cmd; }
    var ta = document.getElementById(inId); if(ta) ta.value='';
  };
  window.capGitReset = function(outId){
    CAP_GIT_REPO = freshCapRepo();
    var out = document.getElementById(outId); if(out) out.textContent = '(fake repo reset)';
  };

  // ---- M7: Docker -- reuses the same regex structural-check pattern as the Docker track ----
  var CAP_DOCKER_CHECKS = [
    {re:/FROM\s+python:3\.11-slim/i, label:'Uses python:3.11-slim as the base image'},
    {re:/COPY\s+requirements\.txt\s+\.[\s\S]*RUN\s+pip install[\s\S]*COPY\s+\.\s+\./i, label:'Copies+installs requirements BEFORE copying the rest of the app (correct caching order)'},
    {re:/EXPOSE\s+\d+/i, label:'Declares the port the app listens on with EXPOSE'},
    {re:/CMD\s*\[.*uvicorn.*\]/i, label:'Starts the app with uvicorn in exec form'}
  ];
  function renderDockerCheckMilestone(body, head, l){
    var idBase = 'capdock';
    var editId=idBase+'_edit', outId=idBase+'_out';
    var savedCode = capLoad(l.id, 'code', '# TODO: write a Dockerfile for the TaskFlow FastAPI backend:\n# - base image python:3.11-slim\n# - copy requirements.txt first and install (cache-friendly order)\n# - THEN copy the rest of the app\n# - EXPOSE the port it listens on\n# - CMD starts it with uvicorn\n');
    body.innerHTML = head + expectedBlock(l)
      + '<p class="wd-lesson-explain"><span class="cx-pm-badge cx-pm-badge-sim" style="display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:6px;margin-right:6px;background:#3a2f12;color:#f0b878;vertical-align:middle">STRUCTURAL CHECK</span>Checks the shape of your Dockerfile -- this does not actually build a real image.</p>'
      + '<div class="card">'
      + trackEditorShell('Dockerfile', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:130px">'+capEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="capDockCheck(\''+editId+'\',\''+outId+'\')">&#9654; Check</button>'
        + '<button class="wd-btn-ghost" data-act="capMarkDone('+capCurIdx+')">Mark milestone done</button>'
      + '</div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + navRowHtml();
  }
  window.capDockCheck = function(editId, outId){
    var code = (document.getElementById(editId)||{}).value || '';
    capSave(CAP_MILESTONES[capCurIdx].id, 'code', code);
    var out = document.getElementById(outId);
    if(!out) return;
    var results = CAP_DOCKER_CHECKS.map(function(chk){ return {label:chk.label, pass:chk.re.test(code)}; });
    var passCount = results.filter(function(r){ return r.pass; }).length;
    out.innerHTML = '<b>'+passCount+'/'+results.length+' checks passed</b>' + results.map(function(r){
      return '<div class="dsa-testrow '+(r.pass?'pass':'fail')+'"><span>'+capEsc(r.label)+'</span><span>'+(r.pass?'PASS':'FAIL')+'</span></div>';
    }).join('');
  };

  // ---- M9: Deployment -- external guidance card (same pattern as Colab/Docker-local cards) ----
  function renderExternalMilestone(body, head, l){
    body.innerHTML = head + expectedBlock(l)
      + '<div class="cx-pm cx-pm-guidance">'
        + '<div class="cx-pm-label"><span class="cx-pm-badge cx-pm-badge-ext">EXTERNAL</span>This final step happens outside this platform -- no paid service is required to try it (most of these have a free tier).</div>'
        + '<h4 style="margin:4px 0">Taking TaskFlow live</h4>'
        + '<p style="margin:4px 0 8px;font-size:.85rem">A common, honest path: push the repo you built in M6 to GitHub. Deploy the FastAPI backend (from the M7 Docker image) to a container host with a free tier (e.g. Render, Railway, Fly.io). Deploy the frontend (from M2) to a static host (e.g. Netlify, Vercel). Point the frontend\'s API calls at the backend\'s live URL. Set the JWT secret from M4 as a real environment variable, never hard-coded in the deployed code.</p>'
        + '<pre># example: after pushing to GitHub, most of these hosts let you\n# "New app -> connect repo -> deploy" with no extra config beyond\n# setting environment variables like:\nJWT_SECRET=your-real-secret-here\nDATABASE_URL=postgres://...</pre>'
      + '</div>'
      + markDoneRow()
      + navRowHtml();
  }

  var capBooted = false;
  window._capBoot = function(){
    if(capBooted) return;
    capBooted = true;
    window.capOpen(0);
  };
})();
