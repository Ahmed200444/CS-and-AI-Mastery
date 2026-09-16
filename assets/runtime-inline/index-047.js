
(function(){
  var TRANS_LESSONS = [
    { id:'trans-softmax', mode:'test', title:'Softmax: turning scores into attention weights', funcName:'softmax',
      explain:'Attention scores must become a probability distribution that sums to 1 -- softmax does exactly this, while amplifying the biggest score\'s relative influence.',
      starter:'import math\n\ndef softmax(scores):\n    # TODO: subtract the max score from each (for numerical stability),\n    # exponentiate, then divide each by the total sum -- round each to 4 decimals\n    pass',
      solution:'import math\n\ndef softmax(scores):\n    max_s = max(scores)\n    exps = [math.exp(s - max_s) for s in scores]\n    total = sum(exps)\n    return [round(e/total, 4) for e in exps]',
      hints:['Subtracting the max before exponentiating prevents huge numbers/overflow -- it doesn\'t change the final result.','Sum all the exponentiated values first, then divide each one by that total.','max_s = max(scores); exps = [math.exp(s-max_s) for s in scores]; total = sum(exps); return [round(e/total,4) for e in exps]'],
      tests:[
        {argsRepr:'[1.0, 2.0, 3.0]', expectedRepr:'[0.09, 0.2447, 0.6652]'}
      ]},
    { id:'trans-attention-score', mode:'test', title:'Scaled dot-product attention score', funcName:'scaled_dot_product_score',
      explain:'The raw building block of self-attention: a dot product between query and key vectors, scaled down by the square root of the dimension to keep gradients stable.',
      starter:'def scaled_dot_product_score(query, key, dim):\n    # TODO: compute the dot product of query and key, then divide by\n    # sqrt(dim), rounded to 4 decimals\n    pass',
      solution:'def scaled_dot_product_score(query, key, dim):\n    dot = sum(q*k for q,k in zip(query,key))\n    return round(dot / (dim ** 0.5), 4)',
      hints:['zip(query, key) pairs up corresponding elements; sum(q*k for ...) is the dot product.','Divide by dim ** 0.5 (the square root) -- this is the "scaled" part of scaled dot-product attention.','dot = sum(q*k for q,k in zip(query,key)); return round(dot / (dim ** 0.5), 4)'],
      tests:[
        {argsRepr:'[1,2], [3,4], 2', expectedRepr:'7.7782'}
      ]},
    { id:'trans-why-attention', mode:'choice', title:'Why self-attention over RNNs',
      explain:'RNNs process a sequence step-by-step, one token at a time -- inherently sequential.',
      scenario:'A 500-word document takes an RNN 500 sequential steps to process, but a transformer processes all 500 tokens\' attention scores largely in parallel. Why does this matter in practice?',
      choices:['It doesn\'t -- both approaches take the same wall-clock time', 'Parallelization lets transformers use modern GPU/TPU hardware far more efficiently, dramatically speeding up training on long sequences', 'RNNs are actually faster for long documents', 'This only matters for translation tasks specifically'],
      correct:1,
      feedback:['Sequential dependency in RNNs genuinely limits parallel computation -- this has a real, measurable impact on training speed, not just a theoretical one.','Correct -- GPUs/TPUs excel at massively parallel computation; a transformer\'s parallelizable attention mechanism is a major reason it trains so much faster than an RNN on the same hardware, especially for longer sequences.','RNNs\' sequential nature makes them SLOWER for long sequences, not faster, precisely because each step must wait for the previous one.','This parallelization advantage applies to any sequence task transformers are used for, not just translation.'] },
    { id:'trans-positional', mode:'choice', title:'Why transformers need positional encoding',
      explain:'Unlike an RNN (which processes tokens in order), a transformer\'s attention mechanism has no inherent sense of token order at all.',
      scenario:'Without any additional information, a transformer would treat "dog bites man" and "man bites dog" identically, since attention alone doesn\'t know which token came first. What solves this?',
      choices:['Nothing needs to solve this -- word order doesn\'t matter to transformers', 'Positional encodings are added to each token\'s embedding, injecting order information the attention mechanism otherwise lacks', 'Transformers process tokens in a fixed physical order like RNNs, so this isn\'t an issue', 'This is solved by using a bigger model'],
      correct:1,
      feedback:['Word order absolutely matters for meaning ("dog bites man" vs "man bites dog") -- this is a real problem transformers must solve.','Correct -- positional encodings (often sinusoidal patterns added to each embedding) give the model the order information that pure attention doesn\'t provide on its own.','This is exactly the misconception positional encoding corrects -- transformer attention itself is order-agnostic; the order information comes from a separate mechanism.','Model size doesn\'t address the fundamental lack of order information in the attention mechanism itself.'] }
  ];

  function transKey(id, field){ return 'transtrack:'+id+':'+field; }
  function transSave(id, field, val){ try{ localStorage.setItem(transKey(id,field), val); }catch(e){} }
  function transLoad(id, field, fallback){ try{ var v=localStorage.getItem(transKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function transDoneKey(id){ return 'transtrack:'+id+':done'; }
  function transIsDone(id){ try{ return localStorage.getItem(transDoneKey(id))==='1'; }catch(e){ return false; } }
  function transEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var transCurIdx = 0;
  window.transOpen = function(idx){ transCurIdx = idx; renderTransNav(); renderTransLesson(); window.scrollTo(0,0); };
  window.transNext = function(){ if(transCurIdx < TRANS_LESSONS.length-1) window.transOpen(transCurIdx+1); };
  window.transPrev = function(){ if(transCurIdx > 0) window.transOpen(transCurIdx-1); };
  window.transMarkDone = function(idx){ try{ localStorage.setItem(transDoneKey(TRANS_LESSONS[idx].id), '1'); }catch(e){} renderTransNav(); };

  function renderTransNav(){
    var nav = document.getElementById('transLessonNav'); if(!nav) return;
    nav.innerHTML = TRANS_LESSONS.map(function(l, i){
      var done = transIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===transCurIdx?'active':'')+'" data-act="transOpen('+i+')">'+(i+1)+'. '+transEsc(l.title)+done+'</button>';
    }).join('');
  }
  function transNavRow(){
    return '<div class="wd-navrow">'
      + (transCurIdx>0 ? '<button class="wd-btn-ghost" data-act="transPrev()">&larr; Previous</button>' : '<span></span>')
      + (transCurIdx<TRANS_LESSONS.length-1 ? '<button class="wd-btn" data-act="transNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderTransLesson(){
    var body = document.getElementById('transLessonBody'); if(!body) return;
    var l = TRANS_LESSONS[transCurIdx];
    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="transchoice_'+l.id+'_'+i+'" data-act="transAnswer(\''+l.id+'\','+i+')">'+transEsc(c)+'</button>';
      }).join('');
      body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(transCurIdx+1)+transEsc(l.title)+'</h2></div>'
        + trackMentalModel(transEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+transEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="transfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="transMarkDone('+transCurIdx+')">Mark task done</button></div>'
        + transNavRow();
      return;
    }
    var savedCode = transLoad(l.id, 'code', l.starter);
    var idBase = 'transpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){ return '<button data-act="transRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>'; }).join('') + '<button data-act="transRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){ return '<div class="wd-hintbox" id="transhint_'+l.id+'_'+(i+1)+'">'+transEsc(h)+'</div>'; }).join('') + '<div class="wd-hintbox" id="transhint_'+l.id+'_99"><b>Solution:</b><pre>'+transEsc(l.solution)+'</pre></div>';
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(transCurIdx+1)+transEsc(l.title)+'</h2></div>'
      + trackMentalModel(transEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:110px">'+transEsc(savedCode)+'</textarea>')
      + '<div class="wd-row"><button class="wd-btn" data-act="transRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
      + '<button class="wd-btn-ghost" data-act="transReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
      + '<button class="wd-btn-ghost" data-act="transMarkDone('+transCurIdx+')">Mark task done</button></div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes + transNavRow();
  }
  window.transReset = function(lessonId, editId){
    var l = TRANS_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var ta = document.getElementById(editId); if(ta) ta.value = l.starter;
    transSave(lessonId, 'code', l.starter);
  };
  window.transRevealHint = function(lessonId, tier){
    var l = TRANS_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){ var el = document.getElementById('transhint_'+lessonId+'_'+t); if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier)); });
  };
  window.transAnswer = function(lessonId, choiceIdx){
    var l = TRANS_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('transchoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('transfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  window.transRunTests = async function(lessonId, editId, outId, statusId){
    var l = TRANS_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    transSave(lessonId, 'code', code);
    var out = document.getElementById(outId); if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py; try{ py = await getPy(statusId); } catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }
    var harnessLines = ['_trans_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push('try:\n    _r = '+l.funcName+'('+t.argsRepr+')\n    _exp = ('+t.expectedRepr+')\n    _ok = (all(abs(a-b)<1e-3 for a,b in zip(_r,_exp)) if isinstance(_r,list) and isinstance(_exp,list) else (abs(_r-_exp)<1e-3 if isinstance(_r,(int,float)) and isinstance(_exp,(int,float)) else _r==_exp))\n    _trans_results.append(("'+i+'", _ok, repr(_r)))\nexcept Exception as _e:\n    _trans_results.append(("'+i+'", False, "Error: " + str(_e)))');
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _trans_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';
    try{
      py.globals.set('_SRC', fullSrc); py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT'); var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){ var parts = ln.split('|'); return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+transEsc(parts[3])+'</span></div>'; }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>'; }
  };
  var transBooted = false;
  window._transBoot = function(){ if(transBooted) return; transBooted = true; window.transOpen(0); };
})();
