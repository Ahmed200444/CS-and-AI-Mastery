
(function(){
  // System design is fundamentally judgment-based -- most tasks reuse the
  // scenario+feedback pattern (AI Agents/Docker/Databases/Testing/
  // Deployment). One task is a genuine calculation, reusing the shared
  // Python runtime the same way DSA/AI-ML/Backend do.

  var SYSD_LESSONS = [
    { id:'sysd-caching', mode:'choice', title:'Where does caching actually help?',
      explain:'A cache trades a little staleness for a lot of speed -- it only helps when data is read far more often than it changes.',
      scenario:'A product page is viewed 50,000 times per minute but its price/description only changes a few times per day. Should you cache the rendered page?',
      choices:['No -- caching only applies to database queries, not full pages', 'Yes -- extremely high read frequency with rare changes is exactly caching\'s ideal case', 'No -- caching always risks showing stale data, which is never acceptable', 'Only if the page has no dynamic content at all'],
      correct:1,
      feedback:['Caching applies at many layers -- full rendered pages, API responses, and query results can all be cached, not just raw DB queries.','Correct -- this read:write ratio (50,000 reads per minute vs. a few writes per day) is the textbook case where caching gives enormous speedup for a tiny, usually-acceptable staleness window.','Some staleness for a few minutes on rarely-changing content is a completely normal, deliberate trade-off most real systems make -- "never acceptable" is too absolute.','Caching works fine even with some dynamic content, as long as you invalidate the cache when the underlying data actually changes.'] },
    { id:'sysd-load-balancing', mode:'choice', title:'Load balancing under uneven load',
      explain:'A load balancer\'s job is distributing requests across multiple servers so no single one is overwhelmed.',
      scenario:'You have 3 backend servers. One keeps getting 3x the traffic of the other two because clients keep reconnecting to the same one. What\'s the most direct fix?',
      choices:['Add a 4th server without changing anything else', 'Put a load balancer in front that distributes requests evenly (e.g. round-robin) across all servers', 'Tell users to manually pick a different server', 'Make the overloaded server\'s hardware faster'],
      correct:1,
      feedback:['Adding more capacity without fixing the DISTRIBUTION problem just gives you a 4th server that also might not get used evenly.','Correct -- a load balancer is exactly the piece designed to solve uneven distribution, routing new requests across all available servers instead of letting clients pile onto one.','Users manually managing server selection isn\'t a scalable or realistic fix for a backend architecture problem.','Faster hardware treats a symptom (that one server is overwhelmed) without fixing the actual cause (uneven distribution).'] },
    { id:'sysd-sql-nosql', mode:'choice', title:'SQL or NoSQL for this specific system?',
      explain:'The right answer always depends on the actual access pattern and consistency needs -- not which is newer or trendier.',
      scenario:'You\'re building a banking ledger: every transaction must be atomic, consistent, and related to specific accounts via strict relationships. Which fits better?',
      choices:['NoSQL -- it scales better for any use case', 'SQL -- strong consistency (ACID) and relational integrity are exactly what a financial ledger needs', 'Either works equally well for this', 'NoSQL, because banking apps need to be fast'],
      correct:1,
      feedback:['NoSQL\'s scaling advantages usually come from relaxing exactly the strict consistency guarantees a ledger requires -- "scales better" isn\'t the deciding factor here.','Correct -- ACID transactions and strict relational constraints are precisely what prevents a banking ledger from ever landing in an inconsistent state (e.g. money vanishing between accounts).','The requirements here (atomicity, strong consistency, relationships) point clearly toward SQL -- this isn\'t a coin flip.','Speed alone doesn\'t justify sacrificing consistency in a domain where an incorrect balance is a serious, real-world failure.'] },
    { id:'sysd-scaling', mode:'choice', title:'Vertical vs. horizontal scaling',
      explain:'One approach makes a single machine bigger; the other adds more machines.',
      scenario:'Your single database server is maxed out on CPU during peak hours, and you\'ve already given it the largest available machine size. What\'s your only remaining path to more capacity?',
      choices:['Keep waiting for an even bigger machine size to become available', 'Horizontal scaling -- distribute load across multiple machines (e.g. read replicas, sharding)', 'Turn off some features to reduce load', 'Nothing can be done once you hit the largest machine size'],
      correct:1,
      feedback:['Vertical scaling (bigger machines) always has a ceiling -- eventually there IS no bigger size, which is exactly this scenario.','Correct -- once vertical scaling is maxed out, horizontal scaling (spreading load across multiple machines) is the remaining path to more capacity.','Removing features is a real short-term mitigation, but it treats the symptom rather than solving the actual capacity problem.','There\'s always a path forward through horizontal scaling -- read replicas and sharding exist specifically for this ceiling.'] },
    { id:'sysd-cap-theorem', mode:'choice', title:'CAP theorem: a real trade-off',
      explain:'CAP theorem: during a network partition, a distributed system must choose between staying fully Consistent or staying fully Available -- it cannot guarantee both.',
      scenario:'During a network partition between two data centers, your system chooses to keep serving requests from BOTH sides, even though they might briefly disagree on the data. Which side of the CAP trade-off is this?',
      choices:['Consistency over availability', 'Availability over consistency', 'Both at once, with no trade-off', 'Neither -- this is a partition-tolerance choice, unrelated to C or A'],
      correct:1,
      feedback:['Choosing consistency would mean refusing to serve some requests (or serving errors) rather than risk disagreement -- that\'s the opposite of what\'s described here.','Correct -- continuing to serve from both sides despite a partition, accepting the RISK of temporary disagreement, is choosing availability over strict consistency.','CAP theorem\'s whole point is that you CANNOT have both during an actual partition -- this scenario is a concrete example of that trade-off being made, not avoided.','Partition tolerance is essentially assumed (the partition already exists) -- what\'s being decided here is how the system behaves DURING it, which is exactly the C-vs-A choice.'] },
    { id:'sysd-capacity-calc', mode:'calc', title:'Back-of-envelope capacity estimation', funcName:'estimate_capacity',
      explain:'Given a rough daily request volume and average response size, estimate average and peak requests-per-second and bandwidth -- the kind of quick math system design interviews expect, using a common rule of thumb (peak load is roughly 3x average).',
      starter:'def estimate_capacity(requests_per_day, avg_response_kb):\n    # TODO: compute and return (avg_rps, peak_rps, bandwidth_mbps), each\n    # rounded to 1 decimal place:\n    # - avg_rps = requests_per_day / seconds_in_a_day\n    # - peak_rps = avg_rps * 3   (a common rule-of-thumb multiplier)\n    # - bandwidth_mbps = (peak_rps * avg_response_kb * 8) / 1000\n    pass',
      solution:'def estimate_capacity(requests_per_day, avg_response_kb):\n    seconds_per_day = 24 * 60 * 60\n    avg_rps = requests_per_day / seconds_per_day\n    peak_rps = avg_rps * 3\n    bandwidth_mbps = (peak_rps * avg_response_kb * 8) / 1000\n    return round(avg_rps, 1), round(peak_rps, 1), round(bandwidth_mbps, 1)',
      hints:['There are 24*60*60 seconds in a day -- divide daily requests by that for the average rate.','Peak is a simple multiple of average here (x3) -- a common, simple rule of thumb, not a precise formula.','Converting KB to Mbit: multiply by 8 (bytes to bits) then divide by 1000 (kilobits to megabits).'],
      tests:[
        {argsRepr:'10000000, 50', expectedRepr:'(115.7, 347.2, 138.9)'}
      ] }
  ];

  function sysdKey(id, field){ return 'sysdtrack:'+id+':'+field; }
  function sysdSave(id, field, val){ try{ localStorage.setItem(sysdKey(id,field), val); }catch(e){} }
  function sysdLoad(id, field, fallback){ try{ var v=localStorage.getItem(sysdKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function sysdDoneKey(id){ return 'sysdtrack:'+id+':done'; }
  function sysdIsDone(id){ try{ return localStorage.getItem(sysdDoneKey(id))==='1'; }catch(e){ return false; } }
  function sysdEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var sysdCurIdx = 0;

  window.sysdOpen = function(idx){
    sysdCurIdx = idx;
    renderSysdNav();
    renderSysdLesson();
    window.scrollTo(0,0);
  };
  window.sysdNext = function(){ if(sysdCurIdx < SYSD_LESSONS.length-1) window.sysdOpen(sysdCurIdx+1); };
  window.sysdPrev = function(){ if(sysdCurIdx > 0) window.sysdOpen(sysdCurIdx-1); };
  window.sysdMarkDone = function(idx){
    try{ localStorage.setItem(sysdDoneKey(SYSD_LESSONS[idx].id), '1'); }catch(e){}
    renderSysdNav();
  };

  function renderSysdNav(){
    var nav = document.getElementById('sysdLessonNav');
    if(!nav) return;
    nav.innerHTML = SYSD_LESSONS.map(function(l, i){
      var done = sysdIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===sysdCurIdx?'active':'')+'" data-act="sysdOpen('+i+')">'+(i+1)+'. '+sysdEsc(l.title)+done+'</button>';
    }).join('');
  }

  function navRow(){
    return '<div class="wd-navrow">'
      + (sysdCurIdx>0 ? '<button class="wd-btn-ghost" data-act="sysdPrev()">&larr; Previous</button>' : '<span></span>')
      + (sysdCurIdx<SYSD_LESSONS.length-1 ? '<button class="wd-btn" data-act="sysdNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function renderSysdLesson(){
    var body = document.getElementById('sysdLessonBody');
    if(!body) return;
    var l = SYSD_LESSONS[sysdCurIdx];

    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="sysdchoice_'+l.id+'_'+i+'" data-act="sysdAnswer(\''+l.id+'\','+i+')">'+sysdEsc(c)+'</button>';
      }).join('');
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(sysdCurIdx+1)+sysdEsc(l.title)+'</h2></div>'
        + trackMentalModel(sysdEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+sysdEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="sysdfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="sysdMarkDone('+sysdCurIdx+')">Mark task done</button></div>'
        + navRow();
      return;
    }

    // mode === 'calc'
    var savedCode = sysdLoad(l.id, 'code', l.starter);
    var idBase = 'sysdpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="sysdRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="sysdRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="sysdhint_'+l.id+'_'+(i+1)+'">'+sysdEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="sysdhint_'+l.id+'_99"><b>Solution:</b><pre>'+sysdEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(sysdCurIdx+1)+sysdEsc(l.title)+'</h2></div>'
      + trackMentalModel(sysdEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:130px">'+sysdEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="sysdRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
        + '<button class="wd-btn-ghost" data-act="sysdReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="sysdMarkDone('+sysdCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + navRow();
  }

  window.sysdReset = function(lessonId, editId){
    var l = SYSD_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    sysdSave(lessonId, 'code', l.starter);
  };
  window.sysdRevealHint = function(lessonId, tier){
    var l = SYSD_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('sysdhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };
  window.sysdAnswer = function(lessonId, choiceIdx){
    var l = SYSD_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('sysdchoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('sysdfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };

  // Reuses the SAME shared Pyodide (getPy/RUN_HARNESS) as DSA/RAG/Backend --
  // no new Python runtime. Tuple comparison uses element-wise float
  // tolerance (same fix validated in the RAG track's hybrid-score task).
  window.sysdRunTests = async function(lessonId, editId, outId, statusId){
    var l = SYSD_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    sysdSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_sysd_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _exp = ('+t.expectedRepr+')\n'+
        '    _ok = all(abs(a-b) < 1e-6 for a,b in zip(_r, _exp)) if isinstance(_r, tuple) and isinstance(_exp, tuple) else (_r == _exp)\n'+
        '    _sysd_results.append(("'+i+'", _ok, repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _sysd_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _sysd_results))');
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
        return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+sysdEsc(parts[3])+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  var sysdBooted = false;
  window._sysdBoot = function(){
    if(sysdBooted) return;
    sysdBooted = true;
    window.sysdOpen(0);
  };
})();
