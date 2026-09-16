
(function(){
  var INTERVIEW_LESSONS = [
    { id:'interview-palindrome', mode:'test', title:'Classic warm-up: valid palindrome', funcName:'is_palindrome',
      explain:'A very common opening interview question: check if a string reads the same forwards and backwards, ignoring case and non-alphanumeric characters.',
      starter:'def is_palindrome(s):\n    # TODO: strip out non-alphanumeric characters, lowercase everything,\n    # then check if the result equals its own reverse\n    pass',
      solution:'def is_palindrome(s):\n    cleaned = "".join(c.lower() for c in s if c.isalnum())\n    return cleaned == cleaned[::-1]',
      hints:['c.isalnum() tells you if a character is a letter or digit -- filter to keep only those.','s[::-1] reverses a string in Python.','cleaned = "".join(c.lower() for c in s if c.isalnum()); return cleaned == cleaned[::-1]'],
      tests:[
        {argsRepr:'"A man a plan a canal Panama"', expectedRepr:'True'},
        {argsRepr:'"hello"', expectedRepr:'False'}
      ]},
    { id:'interview-star-method', mode:'choice', title:'Structuring a behavioral answer: STAR',
      explain:'STAR (Situation, Task, Action, Result) keeps a behavioral answer concrete and complete instead of vague or rambling.',
      scenario:'An interviewer asks "Tell me about a time you disagreed with a teammate." Which answer structure is strongest?',
      choices:['A general statement about your communication philosophy, with no specific example', 'A specific situation, what your role/task was, the concrete action you took, and the actual result', 'Just the result ("it worked out fine") with no other detail', 'Describing the disagreement from the other person\'s perspective only'],
      correct:1,
      feedback:['Interviewers are asking for a REAL example specifically because general philosophy is easy to say and hard to verify -- it tells them little.','Correct -- this is exactly the STAR structure: concrete situation, your specific role, the action YOU took, and a real, checkable result.','A result with no situation or action gives the interviewer nothing to actually evaluate -- what did you DO?','The question is about YOUR handling of the disagreement -- your role, actions, and reasoning need to be the center of the answer.'] },
    { id:'interview-time-management', mode:'choice', title:'Managing time in a coding interview',
      explain:'A coding interview is watching your PROCESS, not just your final answer -- time management is part of what\'s being evaluated.',
      scenario:'You\'re 20 minutes into a 45-minute coding interview and realize your current approach won\'t finish in time. What\'s the best move?',
      choices:['Keep pushing on the same approach silently, hoping it works out', 'Say out loud that this approach is too slow, and openly discuss switching to a better one with the interviewer', 'Ask to end the interview early since you\'re stuck', 'Start over completely silently without explaining why'],
      correct:1,
      feedback:['Interviewers can\'t evaluate reasoning they can\'t see -- silently struggling forward looks worse than openly recognizing and adjusting.','Correct -- verbalizing that you\'ve recognized a problem with your approach, and discussing the trade-off of switching, demonstrates exactly the self-awareness and communication interviewers want to see.','Asking to end early forecloses the chance to recover -- most interviewers would rather see you adapt.','Restarting without any explanation hides your reasoning process, which is often what\'s actually being evaluated, not just the final code.'] },
    { id:'interview-dont-know', mode:'choice', title:'Handling "I don\'t know"',
      explain:'Nobody knows everything -- HOW you handle a genuine knowledge gap is itself being evaluated.',
      scenario:'An interviewer asks about a specific technology you\'ve genuinely never used. What\'s the strongest response?',
      choices:['Pretend familiarity and improvise details that sound plausible', 'Honestly say you haven\'t used it, then relate it to something similar you do know and ask a clarifying question if useful', 'Stay completely silent and hope they move to a different question', 'Criticize the question as unfair or irrelevant'],
      correct:1,
      feedback:['Fabricated familiarity is easily exposed by a follow-up question, and damages trust in everything else you\'ve said once caught.','Correct -- honesty plus connecting it to related knowledge you DO have shows good judgment and genuine reasoning ability, which is often more valuable than surface-level familiarity with every specific tool.','Silence gives the interviewer nothing to work with and wastes the opportunity to show how you reason about gaps in your knowledge.','Deflecting by criticizing the question doesn\'t address the actual gap and reads poorly regardless of whether the question was reasonable.'] },
    { id:'interview-first-unique', mode:'test', title:'Coding warm-up: first unique character', funcName:'first_unique_char',
      explain:'Another common warm-up: find the index of the first character in a string that appears exactly once.',
      starter:'def first_unique_char(s):\n    # TODO: return the index of the first character that appears exactly\n    # once in s, or -1 if every character repeats\n    from collections import Counter\n    pass',
      solution:'def first_unique_char(s):\n    from collections import Counter\n    counts = Counter(s)\n    for i, c in enumerate(s):\n        if counts[c] == 1:\n            return i\n    return -1',
      hints:['Counter(s) gives you a count of every character in one pass.','Then walk through the string in order, and return the first index whose count is exactly 1.','counts = Counter(s)\\nfor i, c in enumerate(s):\\n    if counts[c] == 1:\\n        return i\\nreturn -1'],
      tests:[
        {argsRepr:'"leetcode"', expectedRepr:'0'},
        {argsRepr:'"aabb"', expectedRepr:'-1'}
      ]},
    { id:'interview-negotiation', mode:'choice', title:'When to discuss salary',
      explain:'Timing matters in negotiation -- discussing compensation too early can undermine your position before you\'ve established your value.',
      scenario:'You\'re in a first-round screening call, and the recruiter asks your salary expectations before any technical interviews have happened. What\'s a reasonable approach?',
      choices:['Immediately state your absolute minimum acceptable number', 'Give a broad, researched range if pressed, while noting you\'d like to learn more about the role and their range first', 'Refuse to discuss compensation at any point in the process', 'Make up a number much higher than you actually expect, just to see what happens'],
      correct:1,
      feedback:['Anchoring on your minimum this early gives away negotiating room before you\'ve demonstrated your value or learned the role\'s actual scope.','Correct -- a researched range, paired with genuine interest in learning more about the role and THEIR range, keeps the conversation productive without prematurely committing to a number.','Some recruiters require an answer to proceed -- outright refusal can stall the process unnecessarily; a range is usually a better middle ground.','An inflated, dishonest number can misalign expectations and damage trust once the real conversation happens later.'] }
  ];

  function interviewKey(id, field){ return 'interviewtrack:'+id+':'+field; }
  function interviewSave(id, field, val){ try{ localStorage.setItem(interviewKey(id,field), val); }catch(e){} }
  function interviewLoad(id, field, fallback){ try{ var v=localStorage.getItem(interviewKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function interviewDoneKey(id){ return 'interviewtrack:'+id+':done'; }
  function interviewIsDone(id){ try{ return localStorage.getItem(interviewDoneKey(id))==='1'; }catch(e){ return false; } }
  function interviewEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var interviewCurIdx = 0;

  window.interviewOpen = function(idx){
    interviewCurIdx = idx;
    renderInterviewNav();
    renderInterviewLesson();
    window.scrollTo(0,0);
  };
  window.interviewNext = function(){ if(interviewCurIdx < INTERVIEW_LESSONS.length-1) window.interviewOpen(interviewCurIdx+1); };
  window.interviewPrev = function(){ if(interviewCurIdx > 0) window.interviewOpen(interviewCurIdx-1); };
  window.interviewMarkDone = function(idx){
    try{ localStorage.setItem(interviewDoneKey(INTERVIEW_LESSONS[idx].id), '1'); }catch(e){}
    renderInterviewNav();
  };

  function renderInterviewNav(){
    var nav = document.getElementById('interviewLessonNav');
    if(!nav) return;
    nav.innerHTML = INTERVIEW_LESSONS.map(function(l, i){
      var done = interviewIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===interviewCurIdx?'active':'')+'" data-act="interviewOpen('+i+')">'+(i+1)+'. '+interviewEsc(l.title)+done+'</button>';
    }).join('');
  }

  function interviewNavRow(){
    return '<div class="wd-navrow">'
      + (interviewCurIdx>0 ? '<button class="wd-btn-ghost" data-act="interviewPrev()">&larr; Previous</button>' : '<span></span>')
      + (interviewCurIdx<INTERVIEW_LESSONS.length-1 ? '<button class="wd-btn" data-act="interviewNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function renderInterviewLesson(){
    var body = document.getElementById('interviewLessonBody');
    if(!body) return;
    var l = INTERVIEW_LESSONS[interviewCurIdx];

    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="interviewchoice_'+l.id+'_'+i+'" data-act="interviewAnswer(\''+l.id+'\','+i+')">'+interviewEsc(c)+'</button>';
      }).join('');
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(interviewCurIdx+1)+interviewEsc(l.title)+'</h2></div>'
        + trackMentalModel(interviewEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+interviewEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="interviewfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="interviewMarkDone('+interviewCurIdx+')">Mark task done</button></div>'
        + interviewNavRow();
      return;
    }

    var savedCode = interviewLoad(l.id, 'code', l.starter);
    var idBase = 'interviewpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="interviewRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="interviewRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="interviewhint_'+l.id+'_'+(i+1)+'">'+interviewEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="interviewhint_'+l.id+'_99"><b>Solution:</b><pre>'+interviewEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(interviewCurIdx+1)+interviewEsc(l.title)+'</h2></div>'
      + trackMentalModel(interviewEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:120px">'+interviewEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="interviewRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
        + '<button class="wd-btn-ghost" data-act="interviewReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="interviewMarkDone('+interviewCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + interviewNavRow();
  }

  window.interviewReset = function(lessonId, editId){
    var l = INTERVIEW_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    interviewSave(lessonId, 'code', l.starter);
  };
  window.interviewRevealHint = function(lessonId, tier){
    var l = INTERVIEW_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('interviewhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };
  window.interviewAnswer = function(lessonId, choiceIdx){
    var l = INTERVIEW_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('interviewchoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('interviewfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };

  window.interviewRunTests = async function(lessonId, editId, outId, statusId){
    var l = INTERVIEW_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    interviewSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_interview_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _exp = ('+t.expectedRepr+')\n'+
        '    _ok = (_r == _exp)\n'+
        '    _interview_results.append(("'+i+'", _ok, repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _interview_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _interview_results))');
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
        return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+interviewEsc(parts[3])+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  var interviewBooted = false;
  window._interviewBoot = function(){
    if(interviewBooted) return;
    interviewBooted = true;
    window.interviewOpen(0);
  };
})();
