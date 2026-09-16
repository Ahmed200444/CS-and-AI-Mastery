
(function(){
  var LLMS_LESSONS = [
    { id:'llms-token-estimate', mode:'test', title:'Estimating token count', funcName:'estimate_tokens',
      explain:'LLM APIs bill and limit by TOKENS, not characters or words. A common rough approximation for English text: about 4 characters per token.',
      starter:'def estimate_tokens(text):\n    # TODO: return an estimated token count using ~4 characters per token\n    # (use integer division, and return at least 1 even for very short text)\n    pass',
      solution:'def estimate_tokens(text):\n    return max(1, len(text) // 4)',
      hints:['len(text) // 4 gives a rough token estimate for English text.','Use max(1, ...) so even a very short string never estimates to 0 tokens.','return max(1, len(text) // 4)'],
      tests:[
        {argsRepr:'"Hello world, this is a test."', expectedRepr:'7'},
        {argsRepr:'"hi"', expectedRepr:'1'}
      ]},
    { id:'llms-cost-calc', mode:'test', title:'Calculating API cost', funcName:'estimate_cost',
      explain:'Most LLM APIs price input and output tokens separately (output is often more expensive) -- estimating cost means calculating both halves separately, then adding them.',
      starter:'def estimate_cost(input_tokens, output_tokens, input_price_per_1k, output_price_per_1k):\n    # TODO: return (input_tokens/1000)*input_price_per_1k + (output_tokens/1000)*output_price_per_1k,\n    # rounded to 4 decimal places\n    pass',
      solution:'def estimate_cost(input_tokens, output_tokens, input_price_per_1k, output_price_per_1k):\n    return round((input_tokens/1000)*input_price_per_1k + (output_tokens/1000)*output_price_per_1k, 4)',
      hints:['Compute the input cost and output cost as two separate terms, then add them.','Prices are typically quoted "per 1,000 tokens" -- divide the token count by 1000 first.','return round((input_tokens/1000)*input_price_per_1k + (output_tokens/1000)*output_price_per_1k, 4)'],
      tests:[
        {argsRepr:'1000, 500, 0.003, 0.015', expectedRepr:'0.0105'}
      ]},
    { id:'llms-context-window', mode:'test', title:'Does it fit the context window?', funcName:'fits_context_window',
      explain:'A model\'s context window is a hard ceiling on prompt+response tokens combined -- exceeding it means truncation or a hard error, not graceful degradation.',
      starter:'def fits_context_window(prompt_tokens, response_tokens, context_window):\n    # TODO: return True if prompt_tokens + response_tokens fits within\n    # context_window, False otherwise\n    pass',
      solution:'def fits_context_window(prompt_tokens, response_tokens, context_window):\n    return prompt_tokens + response_tokens <= context_window',
      hints:['Add the prompt and response token counts together first.','Compare that sum to the context window using <= (exactly at the limit still fits).','return prompt_tokens + response_tokens <= context_window'],
      tests:[
        {argsRepr:'3000, 500, 4096', expectedRepr:'True'},
        {argsRepr:'4000, 500, 4096', expectedRepr:'False'}
      ]},
    { id:'llms-prompt-strategy', mode:'choice', title:'Zero-shot vs. few-shot prompting',
      explain:'Few-shot prompting (showing example input/output pairs) can dramatically improve accuracy on a specific task format, at the cost of extra tokens on every single call.',
      scenario:'You need the model to output data in an unusual, very specific JSON structure your app requires, and zero-shot attempts keep getting the structure slightly wrong. What\'s the most direct fix?',
      choices:['Give up and switch to a completely different, larger model', 'Add a few-shot example or two showing the exact expected input/output format in the prompt', 'Just retry the same zero-shot prompt repeatedly until it happens to work', 'Reduce the temperature to 0 and assume that alone fixes structural errors'],
      correct:1,
      feedback:['A bigger model might help, but it\'s a much more expensive fix for a problem that\'s really about showing the model your specific expected format.','Correct -- this is exactly what few-shot examples are for: showing the model the precise structure you want, which zero-shot instructions alone often can\'t fully specify.','Retrying without changing anything relies on luck, not a real fix -- the same structural mistake will keep recurring.','Lower temperature reduces randomness in wording choices, but doesn\'t teach the model an unfamiliar structure it doesn\'t already understand from the prompt.'] },
    { id:'llms-hallucination-eval', mode:'choice', title:'Evaluating a suspicious LLM answer',
      explain:'LLMs can state incorrect information fluently and confidently -- confidence in tone is not evidence of correctness.',
      scenario:'An LLM confidently cites a specific statistic with a precise source and date, for a question about a very recent or obscure event. What\'s the appropriate level of trust?',
      choices:['Full trust -- confident, specific-sounding answers are reliable', 'Treat it as a claim to verify against a real source, not a confirmed fact -- LLMs can generate plausible-sounding but fabricated specifics ("hallucination")', 'No trust at all -- LLMs are never useful for factual questions', 'Trust depends only on how long the answer is'],
      correct:1,
      feedback:['Confidence and specificity in an LLM\'s tone are not reliability signals -- fabricated statistics and citations are a well-documented failure mode.','Correct -- this is the right calibration: treat specific factual claims (especially about recent/obscure topics) as things to verify independently, not as already-confirmed facts.','LLMs are genuinely useful for many factual tasks -- the right response is calibrated verification, not blanket distrust.','Answer length has no bearing on factual accuracy -- a fabricated statistic can be stated in one confident sentence.'] },
    { id:'llms-temperature', mode:'choice', title:'Choosing a temperature setting',
      explain:'Temperature controls randomness: lower values make outputs more deterministic and focused; higher values increase variety and creativity, at some cost to consistency.',
      scenario:'You\'re building a tool that extracts structured data (names, dates, amounts) from documents, where you need consistent, repeatable output every time. What temperature setting fits best?',
      choices:['A high temperature (e.g. 1.5), for more creative extraction', 'A low temperature (e.g. 0-0.2), for consistent, deterministic-leaning output', 'Temperature doesn\'t affect this kind of task at all', 'Always use the maximum temperature the API allows'],
      correct:1,
      feedback:['Creativity is actively unhelpful here -- you want the SAME correct extraction every time, not varied phrasing.','Correct -- structured extraction wants consistency and predictability, which a low temperature setting supports directly.','Temperature directly affects output randomness, which absolutely matters for a task requiring consistent, repeatable results.','Maximum randomness is close to the opposite of what a consistent-extraction task needs.'] }
  ];

  function llmsKey(id, field){ return 'llmstrack:'+id+':'+field; }
  function llmsSave(id, field, val){ try{ localStorage.setItem(llmsKey(id,field), val); }catch(e){} }
  function llmsLoad(id, field, fallback){ try{ var v=localStorage.getItem(llmsKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function llmsDoneKey(id){ return 'llmstrack:'+id+':done'; }
  function llmsIsDone(id){ try{ return localStorage.getItem(llmsDoneKey(id))==='1'; }catch(e){ return false; } }
  function llmsEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var llmsCurIdx = 0;

  window.llmsOpen = function(idx){
    llmsCurIdx = idx;
    renderLlmsNav();
    renderLlmsLesson();
    window.scrollTo(0,0);
  };
  window.llmsNext = function(){ if(llmsCurIdx < LLMS_LESSONS.length-1) window.llmsOpen(llmsCurIdx+1); };
  window.llmsPrev = function(){ if(llmsCurIdx > 0) window.llmsOpen(llmsCurIdx-1); };
  window.llmsMarkDone = function(idx){
    try{ localStorage.setItem(llmsDoneKey(LLMS_LESSONS[idx].id), '1'); }catch(e){}
    renderLlmsNav();
  };

  function renderLlmsNav(){
    var nav = document.getElementById('llmsLessonNav');
    if(!nav) return;
    nav.innerHTML = LLMS_LESSONS.map(function(l, i){
      var done = llmsIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===llmsCurIdx?'active':'')+'" data-act="llmsOpen('+i+')">'+(i+1)+'. '+llmsEsc(l.title)+done+'</button>';
    }).join('');
  }

  function llmsNavRow(){
    return '<div class="wd-navrow">'
      + (llmsCurIdx>0 ? '<button class="wd-btn-ghost" data-act="llmsPrev()">&larr; Previous</button>' : '<span></span>')
      + (llmsCurIdx<LLMS_LESSONS.length-1 ? '<button class="wd-btn" data-act="llmsNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function renderLlmsLesson(){
    var body = document.getElementById('llmsLessonBody');
    if(!body) return;
    var l = LLMS_LESSONS[llmsCurIdx];

    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="llmschoice_'+l.id+'_'+i+'" data-act="llmsAnswer(\''+l.id+'\','+i+')">'+llmsEsc(c)+'</button>';
      }).join('');
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(llmsCurIdx+1)+llmsEsc(l.title)+'</h2></div>'
        + trackMentalModel(llmsEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+llmsEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="llmsfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="llmsMarkDone('+llmsCurIdx+')">Mark task done</button></div>'
        + llmsNavRow();
      return;
    }

    var savedCode = llmsLoad(l.id, 'code', l.starter);
    var idBase = 'llmspm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="llmsRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="llmsRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="llmshint_'+l.id+'_'+(i+1)+'">'+llmsEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="llmshint_'+l.id+'_99"><b>Solution:</b><pre>'+llmsEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(llmsCurIdx+1)+llmsEsc(l.title)+'</h2></div>'
      + trackMentalModel(llmsEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:110px">'+llmsEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="llmsRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
        + '<button class="wd-btn-ghost" data-act="llmsReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="llmsMarkDone('+llmsCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + llmsNavRow();
  }

  window.llmsReset = function(lessonId, editId){
    var l = LLMS_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    llmsSave(lessonId, 'code', l.starter);
  };
  window.llmsRevealHint = function(lessonId, tier){
    var l = LLMS_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('llmshint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };
  window.llmsAnswer = function(lessonId, choiceIdx){
    var l = LLMS_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('llmschoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('llmsfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };

  window.llmsRunTests = async function(lessonId, editId, outId, statusId){
    var l = LLMS_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    llmsSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_llms_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _exp = ('+t.expectedRepr+')\n'+
        '    _ok = (abs(_r - _exp) < 1e-6) if isinstance(_r,(int,float)) and isinstance(_exp,(int,float)) and not isinstance(_r,bool) and not isinstance(_exp,bool) else (_r == _exp)\n'+
        '    _llms_results.append(("'+i+'", _ok, repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _llms_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _llms_results))');
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
        return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+llmsEsc(parts[3])+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  var llmsBooted = false;
  window._llmsBoot = function(){
    if(llmsBooted) return;
    llmsBooted = true;
    window.llmsOpen(0);
  };
})();
