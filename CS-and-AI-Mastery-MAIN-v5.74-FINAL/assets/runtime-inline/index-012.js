
(function(){
  // Reuses the SAME shared Python runtime as DSA/RAG (getPy/RUN_HARNESS) for
  // test-harness tasks, and the SAME plain runEditor() for the one Run-based
  // task (building a JWT -- its output is a real signature, not something
  // worth exact-matching, so it's Run+observe like the AI/ML/Data Science
  // tracks). This platform can't run a real FastAPI server in-browser, so
  // these tasks isolate the actual LOGIC a backend engineer writes --
  // routing, validation, JWT verification -- as plain, honestly-testable
  // Python functions, not a simulated HTTP layer.

  var BE_LESSONS = [
    { id:'be-route-match', mode:'test', title:'Matching a request to a route', funcName:'route_match',
      explain:'A web framework\'s router does one core job: given an incoming method+path, find the handler registered for it. Implement that matching logic directly.',
      starter:'def route_match(routes, method, path):\n    # routes is a list of (method, path, handler_name) tuples.\n    # TODO: return the handler_name for the first route matching\n    # both method and path, or None if nothing matches\n    pass',
      solution:'def route_match(routes, method, path):\n    for r_method, r_path, handler in routes:\n        if r_method == method and r_path == path:\n            return handler\n    return None',
      hints:['Loop through the routes list and check both method and path against each entry.','Return as soon as you find a match; return None if the loop finishes without one.','for r_method, r_path, handler in routes:\\n    if r_method == method and r_path == path:\\n        return handler\\nreturn None'],
      tests:[
        {argsRepr:'[("GET","/users","list_users"),("POST","/users","create_user")], "GET", "/users"', expectedRepr:"'list_users'"},
        {argsRepr:'[("GET","/users","list_users"),("POST","/users","create_user")], "POST", "/users"', expectedRepr:"'create_user'"},
        {argsRepr:'[("GET","/users","list_users"),("POST","/users","create_user")], "GET", "/orders"', expectedRepr:'None'}
      ]},
    { id:'be-validate', mode:'test', title:'Validating a request body', funcName:'validate_request',
      explain:'Before acting on a request body, check that every required field is actually present. Return the list of what\'s missing, so the caller can build a useful error message.',
      starter:'def validate_request(body, required_fields):\n    # TODO: return a list of the field names in required_fields\n    # that are NOT present as keys in body\n    pass',
      solution:'def validate_request(body, required_fields):\n    return [f for f in required_fields if f not in body]',
      hints:['A list comprehension can filter required_fields down to just the missing ones.','"in body" checks membership among body\'s keys for a dict.','return [f for f in required_fields if f not in body]'],
      tests:[
        {argsRepr:'{"name":"Ana"}, ["name","email"]', expectedRepr:"['email']"},
        {argsRepr:'{"name":"Ana","email":"a@b.com"}, ["name","email"]', expectedRepr:'[]'},
        {argsRepr:'{}, ["a","b"]', expectedRepr:"['a','b']"}
      ]},
    { id:'be-crud', mode:'test', title:'A minimal in-memory CRUD store', funcName:'crud_roundtrip',
      explain:'Every backend eventually reads and writes some form of storage. Implement create (assign a new id, store the item) and read (look it up by id) against a plain dict standing in for a database table.',
      starter:'def create_item(db, item):\n    # TODO: assign a new id (max existing key + 1, or 1 if db is empty),\n    # store item under that id in db, and return the new id\n    pass\n\ndef get_item(db, item_id):\n    # TODO: return db[item_id] if it exists, otherwise None\n    pass\n\ndef crud_roundtrip(db, item):\n    new_id = create_item(db, item)\n    return get_item(db, new_id)',
      solution:'def create_item(db, item):\n    new_id = max(db.keys(), default=0) + 1\n    db[new_id] = item\n    return new_id\n\ndef get_item(db, item_id):\n    return db.get(item_id)\n\ndef crud_roundtrip(db, item):\n    new_id = create_item(db, item)\n    return get_item(db, new_id)',
      hints:['max(db.keys(), default=0) gives you the highest existing id, or 0 for an empty db.','.get(key) returns None automatically if the key is missing -- no need for a manual check.','new_id = max(db.keys(), default=0) + 1; db[new_id] = item; return new_id  /  return db.get(item_id)'],
      tests:[
        {argsRepr:'{}, "apple"', expectedRepr:"'apple'"},
        {argsRepr:'{1:"x",2:"y"}, "z"', expectedRepr:"'z'"}
      ]},
    { id:'be-build-jwt', mode:'run', title:'Building a JWT',
      explain:'A JWT is: base64url(header) + "." + base64url(payload) + "." + base64url(signature), where the signature is an HMAC-SHA256 of the first two parts. Build one from scratch using only Python\'s standard library -- no framework needed to understand what a JWT actually is.',
      starter:'import hmac, hashlib, base64, json\n\ndef b64url_encode(data):\n    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()\n\n# TODO: build a JWT for payload {"user_id": 42} using secret "supersecret":\n# 1. header = {"alg": "HS256", "typ": "JWT"}, base64url-encode its JSON\n# 2. base64url-encode the JSON payload\n# 3. signing_input = header_b64 + "." + payload_b64\n# 4. signature = hmac-sha256(secret, signing_input), base64url-encoded\n# 5. print signing_input + "." + signature\n' },
    { id:'be-verify-jwt', mode:'test', title:'Verifying a JWT', funcName:'verify_jwt',
      explain:'Verifying means recomputing the expected signature yourself and comparing it to the one in the token -- using hmac.compare_digest (not ==) to avoid timing attacks. If it matches, decode and return the payload; otherwise return None.',
      starter:'import hmac, hashlib, base64, json\n\ndef _b64url_decode(s):\n    pad = "=" * (-len(s) % 4)\n    return base64.urlsafe_b64decode(s + pad)\n\ndef _b64url_encode(data):\n    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()\n\ndef verify_jwt(token, secret):\n    # TODO: split token into header_b64, payload_b64, sig_b64 on \'.\'\n    # (return None if the token doesn\'t have exactly 3 parts),\n    # recompute the expected signature with hmac-sha256 over\n    # header_b64+\'.\'+payload_b64, compare using hmac.compare_digest,\n    # and return the decoded payload dict if it matches, else None\n    pass',
      solution:'import hmac, hashlib, base64, json\n\ndef _b64url_decode(s):\n    pad = "=" * (-len(s) % 4)\n    return base64.urlsafe_b64decode(s + pad)\n\ndef _b64url_encode(data):\n    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()\n\ndef verify_jwt(token, secret):\n    try:\n        header_b64, payload_b64, sig_b64 = token.split(".")\n    except ValueError:\n        return None\n    signing_input = header_b64 + "." + payload_b64\n    expected_sig = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()\n    expected_sig_b64 = _b64url_encode(expected_sig)\n    if not hmac.compare_digest(expected_sig_b64, sig_b64):\n        return None\n    return json.loads(_b64url_decode(payload_b64))',
      hints:['token.split(".") should give exactly 3 pieces -- guard against a malformed token with a try/except.','Recompute the signature the SAME way it would have been created (hmac-sha256 of header_b64+"."+payload_b64), then compare with hmac.compare_digest, never ==.','If the signature matches, base64url-decode the payload and json.loads it; otherwise return None.'],
      tests:[
        {argsRepr:'"eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJ1c2VyX2lkIjogNDJ9.jlQ0fr473_M180Zw5-D0nNwKZAY2vJIMLIYhxEQOjZQ", "supersecret"', expectedRepr:"{'user_id': 42}"},
        {argsRepr:'"eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJ1c2VyX2lkIjogNDJ9.jlQ0fr473_M180Zw5-D0nNwKZAY2vJIMLIYhxEQOjZQ", "wrongsecret"', expectedRepr:'None'},
        {argsRepr:'"not.a.validtoken", "supersecret"', expectedRepr:'None'}
      ]},
    { id:'be-n-plus-one', mode:'test', title:'Diagnosing an N+1 query problem', funcName:'is_n_plus_one',
      explain:'An N+1 problem is: one query to fetch a list, then one MORE query per item in that list (instead of a single join/batch query) -- a classic backend performance bug. Detect the pattern from a query log.',
      starter:'def is_n_plus_one(queries):\n    # TODO: return True if `queries` looks like an N+1 pattern:\n    # the first query is a SELECT, followed by 3+ near-identical\n    # queries (same shape before any "=" filter value), otherwise False\n    pass',
      solution:'def is_n_plus_one(queries):\n    if len(queries) < 2:\n        return False\n    first = queries[0]\n    rest = queries[1:]\n    if not first.strip().upper().startswith("SELECT"):\n        return False\n    template = rest[0].split("=")[0] if "=" in rest[0] else rest[0]\n    matches = sum(1 for q in rest if (q.split("=")[0] if "=" in q else q) == template)\n    return matches >= len(rest) * 0.8 and len(rest) >= 3',
      hints:['Compare each later query\'s shape (everything before "=") to the first later query\'s shape.','A high proportion of matches among 3+ near-identical follow-up queries is the N+1 signature.','template = rest[0].split("=")[0]; matches = sum(1 for q in rest if q.split("=")[0]==template); return matches >= len(rest)*0.8 and len(rest) >= 3'],
      tests:[
        {argsRepr:'["SELECT * FROM orders", "SELECT * FROM items WHERE order_id=1", "SELECT * FROM items WHERE order_id=2", "SELECT * FROM items WHERE order_id=3"]', expectedRepr:'True'},
        {argsRepr:'["SELECT * FROM orders WHERE id=1"]', expectedRepr:'False'},
        {argsRepr:'["SELECT * FROM orders", "SELECT * FROM users WHERE id=1", "SELECT * FROM products WHERE id=2"]', expectedRepr:'False'}
      ]}
  ];

  function beKey(id, field){ return 'betrack:'+id+':'+field; }
  function beSave(id, field, val){ try{ localStorage.setItem(beKey(id,field), val); }catch(e){} }
  function beLoad(id, field, fallback){ try{ var v=localStorage.getItem(beKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function beDoneKey(id){ return 'betrack:'+id+':done'; }
  function beIsDone(id){ try{ return localStorage.getItem(beDoneKey(id))==='1'; }catch(e){ return false; } }
  function beEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var beCurIdx = 0;

  window.beOpen = function(idx){
    beCurIdx = idx;
    renderBeNav();
    renderBeLesson();
    window.scrollTo(0,0);
  };
  window.beNext = function(){ if(beCurIdx < BE_LESSONS.length-1) window.beOpen(beCurIdx+1); };
  window.bePrev = function(){ if(beCurIdx > 0) window.beOpen(beCurIdx-1); };
  window.beMarkDone = function(idx){
    try{ localStorage.setItem(beDoneKey(BE_LESSONS[idx].id), '1'); }catch(e){}
    renderBeNav();
  };

  function renderBeNav(){
    var nav = document.getElementById('beLessonNav');
    if(!nav) return;
    nav.innerHTML = BE_LESSONS.map(function(l, i){
      var done = beIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===beCurIdx?'active':'')+'" data-act="beOpen('+i+')">'+(i+1)+'. '+beEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderBeLesson(){
    var body = document.getElementById('beLessonBody');
    if(!body) return;
    var l = BE_LESSONS[beCurIdx];
    var savedCode = beLoad(l.id, 'code', l.starter);
    var idBase = 'bepm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var navRow = '<div class="wd-navrow">'
        + (beCurIdx>0 ? '<button class="wd-btn-ghost" data-act="bePrev()">&larr; Previous</button>' : '<span></span>')
        + (beCurIdx<BE_LESSONS.length-1 ? '<button class="wd-btn" data-act="beNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';

    var runBtnLabel = l.mode === 'test' ? '&#9654; Run tests' : '&#9654; Run';
    var runAct = l.mode === 'test'
      ? "beRunTests('"+l.id+"','"+editId+"','"+outId+"','"+statusId+"')"
      : "beRun('"+l.id+"','"+editId+"','"+outId+"','"+statusId+"')";

    var hintsBlock = '', hintBoxes = '';
    if(l.hints){
      hintsBlock = l.hints.map(function(h,i){
        return '<button data-act="beRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
      }).join('') + '<button data-act="beRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
      hintBoxes = l.hints.map(function(h,i){
        return '<div class="wd-hintbox" id="behint_'+l.id+'_'+(i+1)+'">'+beEsc(h)+'</div>';
      }).join('') + '<div class="wd-hintbox" id="behint_'+l.id+'_99"><b>Solution:</b><pre>'+beEsc(l.solution||'')+'</pre></div>';
    }

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(beCurIdx+1)+beEsc(l.title)+'</h2></div>'
      + trackMentalModel(beEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:130px">'+beEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="'+runAct+'">'+runBtnLabel+'</button>'
        + '<button class="wd-btn-ghost" data-act="beReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="beMarkDone('+beCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintsBlock+'</div>'
      + hintBoxes
      + navRow;
  }

  window.beReset = function(lessonId, editId){
    var l = BE_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    beSave(lessonId, 'code', l.starter);
  };

  window.beRevealHint = function(lessonId, tier){
    var l = BE_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l || !l.hints) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('behint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  // Run-based task (Build a JWT) -- delegates to the shared global runEditor().
  window.beRun = function(lessonId, editId, outId, statusId){
    var ta = document.getElementById(editId);
    if(ta) beSave(lessonId, 'code', ta.value);
    if(typeof runEditor === 'function') runEditor(editId, outId, statusId);
  };

  // Test-harness tasks -- reuse the SAME shared Pyodide instance (getPy) and
  // RUN_HARNESS as DSA/RAG. No new Python runtime.
  window.beRunTests = async function(lessonId, editId, outId, statusId){
    var l = BE_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    beSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_be_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _exp = ('+t.expectedRepr+')\n'+
        '    _ok = (abs(_r - _exp) < 1e-9) if isinstance(_r, (int, float)) and isinstance(_exp, (int, float)) and not isinstance(_r, bool) and not isinstance(_exp, bool) else (_r == _exp)\n'+
        '    _be_results.append(("'+i+'", _ok, repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _be_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _be_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';

    try{
      try{ await py.loadPackagesFromImports(fullSrc); }catch(e){ /* offline or unneeded */ }
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
          + '<span>Test '+(Number(idx)+1)+': '+beEsc(l.funcName)+'('+beEsc(t.argsRepr)+')</span>'
          + '<span>'+status+' &mdash; got '+beEsc(detail)+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  var beBooted = false;
  window._beBoot = function(){
    if(beBooted) return;
    beBooted = true;
    window.beOpen(0);
  };
})();
