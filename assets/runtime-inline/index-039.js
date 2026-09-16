
(function(){
  // Every task here is defensive: recognizing and preventing attacks, never
  // constructing or running one against any real system. Reuses the shared
  // Pyodide test-harness pattern and the scenario+feedback pattern.

  var SEC_LESSONS = [
    { id:'sec-input-validation', mode:'test', title:'Input validation: a safe username check', funcName:'is_safe_username',
      explain:'Validating input against a strict allow-list pattern (only what IS permitted) is safer than trying to block everything bad -- attackers are creative, allow-lists are simple to reason about.',
      starter:'import re\n\ndef is_safe_username(username):\n    # TODO: return True only if username is 3-20 characters, using only\n    # letters, digits, and underscores (use re.match with an anchored pattern)\n    pass',
      solution:'import re\n\ndef is_safe_username(username):\n    return bool(re.match(r"^[a-zA-Z0-9_]{3,20}$", username))',
      hints:['re.match checks from the start of the string -- anchor the end too with $ so nothing extra sneaks in.','A character class like [a-zA-Z0-9_] plus a {3,20} length range covers this exactly.','return bool(re.match(r"^[a-zA-Z0-9_]{3,20}$", username))'],
      tests:[
        {argsRepr:'"ahmed_dev"', expectedRepr:'True'},
        {argsRepr:'"\\\'; DROP TABLE users;--"', expectedRepr:'False'}
      ]},
    { id:'sec-sqli-recognition', mode:'test', title:'Recognizing SQL injection patterns', funcName:'looks_like_sql_injection',
      explain:'Before you can defend against SQL injection, you need to recognize the shape of it. This is detection logic ONLY -- never construct or run an actual injection against a real system.',
      starter:'def looks_like_sql_injection(input_str):\n    # TODO: return True if input_str (lowercased) contains any of these\n    # suspicious substrings: "--", ";", "\\\' or \\\'1\\\'=\\\'1", "drop table", "union select"\n    pass',
      solution:'def looks_like_sql_injection(input_str):\n    suspicious = ["--", ";", "\\\' or \\\'1\\\'=\\\'1", "drop table", "union select"]\n    lower = input_str.lower()\n    return any(s in lower for s in suspicious)',
      hints:['Lowercase the input first so the check isn\'t case-sensitive.','Check each suspicious substring with the "in" operator, and combine results with any().','lower = input_str.lower(); return any(s in lower for s in suspicious)'],
      tests:[
        {argsRepr:'"admin\\\' or \\\'1\\\'=\\\'1"', expectedRepr:'True'},
        {argsRepr:'"ahmed"', expectedRepr:'False'}
      ]},
    { id:'sec-password-strength', mode:'test', title:'Scoring password strength', funcName:'password_strength',
      explain:'A simple, real scoring rubric: award a point for each independent strength signal (length, uppercase, digit, symbol) rather than one all-or-nothing check.',
      starter:'import re\n\ndef password_strength(password):\n    # TODO: return a score from 0-4: +1 if length >= 8, +1 if it has an\n    # uppercase letter, +1 if it has a digit, +1 if it has a non-alphanumeric symbol\n    pass',
      solution:'import re\n\ndef password_strength(password):\n    score = 0\n    if len(password) >= 8: score += 1\n    if re.search(r"[A-Z]", password): score += 1\n    if re.search(r"[0-9]", password): score += 1\n    if re.search(r"[^a-zA-Z0-9]", password): score += 1\n    return score',
      hints:['Four independent checks, each adding 1 to the score if true.','re.search(r"[A-Z]", password) finds any uppercase letter anywhere in the string.','score = 0; if len(password)>=8: score+=1; if re.search(r"[A-Z]",password): score+=1; ...'],
      tests:[
        {argsRepr:'"weak"', expectedRepr:'0'},
        {argsRepr:'"Str0ng!Pass"', expectedRepr:'4'}
      ]},
    { id:'sec-timing-attack', mode:'choice', title:'Why == is unsafe for comparing secrets', 
      explain:'Python\'s == comparison on strings stops at the first mismatched character -- which can leak timing information about how much of the guess was correct.',
      scenario:'You\'re comparing a user-submitted API token to the real one. Why is `if submitted_token == real_token:` a security risk, even though it "works" functionally?',
      choices:['It doesn\'t work at all -- == can\'t compare strings', 'It can leak timing information: matching more correct characters takes measurably longer, letting an attacker guess the token byte-by-byte', 'It\'s slower than other comparison methods, nothing more', 'There\'s no real risk -- this concern is theoretical and never exploited'],
      correct:1,
      feedback:['== absolutely works for comparing strings -- that\'s not the issue here.','Correct -- this is a real, documented attack class (timing attack): == exits as soon as it finds a mismatch, so a guess sharing more correct leading characters takes measurably longer to reject, letting an attacker narrow in one character at a time.','Speed isn\'t the security concern -- the RELATIVE timing difference between guesses is what leaks information.','Timing attacks against == for secret comparison are a real, practical, and exploitable vulnerability -- this is exactly why hmac.compare_digest exists.'] },
    { id:'sec-threat-priority', mode:'choice', title:'Which vulnerability is most urgent to fix first?',
      explain:'With limited time, prioritize by actual risk: how easy is it to exploit, and how bad is the damage if it is.',
      scenario:'Your team found two issues: (1) a public-facing login form with no rate limiting on failed attempts, and (2) a rarely-used internal admin page missing a minor UI accessibility label. Which do you fix first?',
      choices:['The accessibility label -- it\'s a simpler fix', 'The missing rate limiting -- it directly enables automated password-guessing (brute force) attacks against real user accounts', 'Both are equally urgent', 'Neither is worth fixing right now'],
      correct:1,
      feedback:['Simplicity of the fix isn\'t the prioritization criterion -- actual risk and exploitability are.','Correct -- no rate limiting on a public login form is a direct, actively exploitable path to account compromise; that risk vastly outweighs a cosmetic accessibility issue on an internal page.','These are not remotely equal in risk -- one is a real attack vector on real user accounts, the other is a minor UI issue.','The rate-limiting gap is a genuine, high-priority security risk that should be fixed promptly.'] },
    { id:'sec-secure-config', mode:'choice', title:'Spotting a misconfiguration', 
      explain:'A surprising number of real breaches come from configuration mistakes, not clever exploits.',
      scenario:'A production database is configured with a default admin password that was never changed after initial setup, and the database port is open to the entire internet. What\'s the single most important fix?',
      choices:['Just add a firewall rule -- the default password is fine if the port is protected', 'Change the default credentials immediately AND restrict network access -- both are needed, neither alone is sufficient', 'Just change the password -- open ports aren\'t a real risk on their own', 'Nothing needs to change if there\'s no evidence of a breach yet'],
      correct:1,
      feedback:['A firewall rule helps, but a default, publicly-documented password is still a critical risk if that rule is ever misconfigured or bypassed -- defense in depth means not relying on just one layer.','Correct -- this is a case for defense in depth: default credentials are trivially guessable/publicly known, AND an open port maximizes who can reach it. Fixing only one still leaves a serious gap.','An open port to the internet significantly increases exposure regardless of password strength -- it\'s a real, independent risk.','Waiting for evidence of a breach before fixing a known, serious misconfiguration is backwards -- the goal is preventing the breach, not reacting after it.'] }
  ];

  function secKey(id, field){ return 'sectrack:'+id+':'+field; }
  function secSave(id, field, val){ try{ localStorage.setItem(secKey(id,field), val); }catch(e){} }
  function secLoad(id, field, fallback){ try{ var v=localStorage.getItem(secKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function secDoneKey(id){ return 'sectrack:'+id+':done'; }
  function secIsDone(id){ try{ return localStorage.getItem(secDoneKey(id))==='1'; }catch(e){ return false; } }
  function secEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var secCurIdx = 0;

  window.secOpen = function(idx){
    secCurIdx = idx;
    renderSecNav();
    renderSecLesson();
    window.scrollTo(0,0);
  };
  window.secNext = function(){ if(secCurIdx < SEC_LESSONS.length-1) window.secOpen(secCurIdx+1); };
  window.secPrev = function(){ if(secCurIdx > 0) window.secOpen(secCurIdx-1); };
  window.secMarkDone = function(idx){
    try{ localStorage.setItem(secDoneKey(SEC_LESSONS[idx].id), '1'); }catch(e){}
    renderSecNav();
  };

  function renderSecNav(){
    var nav = document.getElementById('secLessonNav');
    if(!nav) return;
    nav.innerHTML = SEC_LESSONS.map(function(l, i){
      var done = secIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===secCurIdx?'active':'')+'" data-act="secOpen('+i+')">'+(i+1)+'. '+secEsc(l.title)+done+'</button>';
    }).join('');
  }

  function secNavRow(){
    return '<div class="wd-navrow">'
      + (secCurIdx>0 ? '<button class="wd-btn-ghost" data-act="secPrev()">&larr; Previous</button>' : '<span></span>')
      + (secCurIdx<SEC_LESSONS.length-1 ? '<button class="wd-btn" data-act="secNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function renderSecLesson(){
    var body = document.getElementById('secLessonBody');
    if(!body) return;
    var l = SEC_LESSONS[secCurIdx];

    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="secchoice_'+l.id+'_'+i+'" data-act="secAnswer(\''+l.id+'\','+i+')">'+secEsc(c)+'</button>';
      }).join('');
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(secCurIdx+1)+secEsc(l.title)+'</h2></div>'
        + trackMentalModel(secEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+secEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="secfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="secMarkDone('+secCurIdx+')">Mark task done</button></div>'
        + secNavRow();
      return;
    }

    var savedCode = secLoad(l.id, 'code', l.starter);
    var idBase = 'secpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="secRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="secRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="sechint_'+l.id+'_'+(i+1)+'">'+secEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="sechint_'+l.id+'_99"><b>Solution:</b><pre>'+secEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(secCurIdx+1)+secEsc(l.title)+'</h2></div>'
      + trackMentalModel(secEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:130px">'+secEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="secRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
        + '<button class="wd-btn-ghost" data-act="secReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="secMarkDone('+secCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + secNavRow();
  }

  window.secReset = function(lessonId, editId){
    var l = SEC_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    secSave(lessonId, 'code', l.starter);
  };
  window.secRevealHint = function(lessonId, tier){
    var l = SEC_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('sechint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };
  window.secAnswer = function(lessonId, choiceIdx){
    var l = SEC_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('secchoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('secfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };

  window.secRunTests = async function(lessonId, editId, outId, statusId){
    var l = SEC_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    secSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_sec_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _exp = ('+t.expectedRepr+')\n'+
        '    _ok = (_r == _exp)\n'+
        '    _sec_results.append(("'+i+'", _ok, repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _sec_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _sec_results))');
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
        return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+secEsc(parts[3])+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  var secBooted = false;
  window._secBoot = function(){
    if(secBooted) return;
    secBooted = true;
    window.secOpen(0);
  };
})();
