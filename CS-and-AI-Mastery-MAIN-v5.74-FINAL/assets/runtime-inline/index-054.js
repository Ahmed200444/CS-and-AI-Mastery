
(function(){
  var TF_LESSONS = [
    { id:'tf-conv-output-size', mode:'test', title:'Computing a convolutional layer\'s output size', funcName:'conv_output_size',
      explain:'Before building a CNN, you need to know exactly what spatial size comes out of each convolutional layer -- a real formula, not a guess, using input size, kernel size, stride, and padding.',
      starter:'def conv_output_size(input_size, kernel_size, stride, padding):\n    # TODO: return (input_size + 2*padding - kernel_size) // stride + 1\n    pass',
      solution:'def conv_output_size(input_size, kernel_size, stride, padding):\n    return (input_size + 2*padding - kernel_size) // stride + 1',
      hints:['Padding is added to BOTH sides, so it counts twice: 2*padding.','Integer division (//) matches how these dimensions actually work in practice.','return (input_size + 2*padding - kernel_size) // stride + 1'],
      tests:[
        {argsRepr:'32, 3, 1, 1', expectedRepr:'32'},
        {argsRepr:'28, 5, 2, 0', expectedRepr:'12'}
      ]},
    { id:'tf-conv-params', mode:'test', title:'Counting a convolutional layer\'s parameters', funcName:'num_conv_params',
      explain:'Knowing a layer\'s parameter count helps you reason about model size and memory -- it\'s a straightforward calculation from the layer\'s configuration.',
      starter:'def num_conv_params(kernel_h, kernel_w, in_channels, out_channels, use_bias=True):\n    # TODO: weights = kernel_h * kernel_w * in_channels * out_channels;\n    # bias = out_channels if use_bias else 0; return weights + bias\n    pass',
      solution:'def num_conv_params(kernel_h, kernel_w, in_channels, out_channels, use_bias=True):\n    weights = kernel_h * kernel_w * in_channels * out_channels\n    bias = out_channels if use_bias else 0\n    return weights + bias',
      hints:['Each output channel needs its own full kernel across all input channels -- that\'s the weights term.','Each output channel also gets one bias value, if use_bias is True.','weights = kernel_h*kernel_w*in_channels*out_channels; bias = out_channels if use_bias else 0; return weights+bias'],
      tests:[
        {argsRepr:'3, 3, 3, 16', expectedRepr:'448'}
      ]},
    { id:'tf-eager-vs-graph', mode:'choice', title:'Eager execution vs. graph mode',
      explain:'TensorFlow can run operations immediately (eager mode, easy to debug) or build a static computation graph first (often faster, but harder to inspect step-by-step).',
      scenario:'You\'re debugging a model that produces unexpected output, and you want to print intermediate tensor values as they compute, line by line. Which mode makes this easier?',
      choices:['Graph mode -- the whole computation is defined upfront', 'Eager execution -- operations run immediately, so you can inspect values right where they\'re computed, like normal Python', 'Neither mode allows inspecting intermediate values', 'This distinction stopped mattering in TensorFlow 1.x'],
      correct:1,
      feedback:['Graph mode defines the WHOLE computation before running it, making step-by-step inspection significantly harder.','Correct -- eager execution runs each operation as it\'s called, exactly like normal Python code, making print-debugging and step-by-step inspection straightforward.','Eager execution specifically supports this kind of straightforward, line-by-line inspection.','This distinction is exactly the reason TensorFlow 2.x made eager execution the default -- it remains a real, relevant choice.'] },
    { id:'tf-data-pipeline', mode:'choice', title:'Why tf.data pipelines matter for performance',
      explain:'Loading and preprocessing data can easily become the bottleneck in training, leaving an expensive GPU sitting idle waiting for the next batch.',
      scenario:'Your GPU utilization is low during training, and profiling shows most time is spent waiting for the next batch of data to be loaded and preprocessed from disk. What does a well-built tf.data pipeline with prefetching address?',
      choices:['Nothing -- this is purely a hardware limitation with no software fix', 'It overlaps data loading/preprocessing (on CPU) with model computation (on GPU), so the GPU doesn\'t sit idle waiting', 'It only affects the very first batch, not overall throughput', 'This only matters for extremely small datasets'],
      correct:1,
      feedback:['This is very much a solvable software/pipeline design problem, not a fixed hardware limitation.','Correct -- this is exactly what prefetching (and pipeline design generally) solves: preparing the NEXT batch on the CPU while the GPU is still busy with the current one, keeping the GPU fed continuously.','Poor data pipeline performance affects EVERY batch throughout training, not just the first one -- this is precisely why it matters for overall throughput.','This bottleneck is arguably MORE relevant for larger datasets/longer training runs, where the cumulative wasted GPU idle time adds up significantly.'] }
  ];

  function tfKey(id, field){ return 'tftrack:'+id+':'+field; }
  function tfSave(id, field, val){ try{ localStorage.setItem(tfKey(id,field), val); }catch(e){} }
  function tfLoad(id, field, fallback){ try{ var v=localStorage.getItem(tfKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function tfDoneKey(id){ return 'tftrack:'+id+':done'; }
  function tfIsDone(id){ try{ return localStorage.getItem(tfDoneKey(id))==='1'; }catch(e){ return false; } }
  function tfEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var tfCurIdx = 0;
  window.tfOpen = function(idx){ tfCurIdx = idx; renderTfNav(); renderTfLesson(); window.scrollTo(0,0); };
  window.tfNext = function(){ if(tfCurIdx < TF_LESSONS.length-1) window.tfOpen(tfCurIdx+1); };
  window.tfPrev = function(){ if(tfCurIdx > 0) window.tfOpen(tfCurIdx-1); };
  window.tfMarkDone = function(idx){ try{ localStorage.setItem(tfDoneKey(TF_LESSONS[idx].id), '1'); }catch(e){} renderTfNav(); };

  function renderTfNav(){
    var nav = document.getElementById('tfLessonNav'); if(!nav) return;
    nav.innerHTML = TF_LESSONS.map(function(l, i){
      var done = tfIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===tfCurIdx?'active':'')+'" data-act="tfOpen('+i+')">'+(i+1)+'. '+tfEsc(l.title)+done+'</button>';
    }).join('');
  }
  function tfNavRow(){
    return '<div class="wd-navrow">'
      + (tfCurIdx>0 ? '<button class="wd-btn-ghost" data-act="tfPrev()">&larr; Previous</button>' : '<span></span>')
      + (tfCurIdx<TF_LESSONS.length-1 ? '<button class="wd-btn" data-act="tfNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderTfLesson(){
    var body = document.getElementById('tfLessonBody'); if(!body) return;
    var l = TF_LESSONS[tfCurIdx];
    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="tfchoice_'+l.id+'_'+i+'" data-act="tfAnswer(\''+l.id+'\','+i+')">'+tfEsc(c)+'</button>';
      }).join('');
      body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(tfCurIdx+1)+tfEsc(l.title)+'</h2></div>'
        + trackMentalModel(tfEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+tfEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="tffeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="tfMarkDone('+tfCurIdx+')">Mark task done</button></div>'
        + tfNavRow();
      return;
    }
    var savedCode = tfLoad(l.id, 'code', l.starter);
    var idBase = 'tfpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){ return '<button data-act="tfRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>'; }).join('') + '<button data-act="tfRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){ return '<div class="wd-hintbox" id="tfhint_'+l.id+'_'+(i+1)+'">'+tfEsc(h)+'</div>'; }).join('') + '<div class="wd-hintbox" id="tfhint_'+l.id+'_99"><b>Solution:</b><pre>'+tfEsc(l.solution)+'</pre></div>';
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(tfCurIdx+1)+tfEsc(l.title)+'</h2></div>'
      + trackMentalModel(tfEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:110px">'+tfEsc(savedCode)+'</textarea>')
      + '<div class="wd-row"><button class="wd-btn" data-act="tfRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
      + '<button class="wd-btn-ghost" data-act="tfReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
      + '<button class="wd-btn-ghost" data-act="tfMarkDone('+tfCurIdx+')">Mark task done</button></div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes + tfNavRow();
  }
  window.tfReset = function(lessonId, editId){
    var l = TF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var ta = document.getElementById(editId); if(ta) ta.value = l.starter;
    tfSave(lessonId, 'code', l.starter);
  };
  window.tfRevealHint = function(lessonId, tier){
    var l = TF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){ var el = document.getElementById('tfhint_'+lessonId+'_'+t); if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier)); });
  };
  window.tfAnswer = function(lessonId, choiceIdx){
    var l = TF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('tfchoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('tffeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  window.tfRunTests = async function(lessonId, editId, outId, statusId){
    var l = TF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    tfSave(lessonId, 'code', code);
    var out = document.getElementById(outId); if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py; try{ py = await getPy(statusId); } catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }
    var harnessLines = ['_tf_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push('try:\n    _r = '+l.funcName+'('+t.argsRepr+')\n    _exp = ('+t.expectedRepr+')\n    _ok = (_r == _exp)\n    _tf_results.append(("'+i+'", _ok, repr(_r)))\nexcept Exception as _e:\n    _tf_results.append(("'+i+'", False, "Error: " + str(_e)))');
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _tf_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';
    try{
      py.globals.set('_SRC', fullSrc); py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT'); var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){ var parts = ln.split('|'); return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+tfEsc(parts[3])+'</span></div>'; }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>'; }
  };
  var tfBooted = false;
  window._tfBoot = function(){ if(tfBooted) return; tfBooted = true; window.tfOpen(0); };
})();
