
(function(){
  var PYTORCH_LESSONS = [
    { id:'pytorch-broadcast', mode:'test', title:'Tensor broadcasting rules', funcName:'broadcast_shape',
      explain:'PyTorch (like NumPy) can operate on tensors of different shapes by "broadcasting" -- but only when dimensions align according to specific rules, comparing shapes from the RIGHT.',
      starter:'def broadcast_shape(shape1, shape2):\n    # TODO: align shapes from the right (pad the shorter one with 1s on\n    # the left), then for each pair of dims: they must be equal, or one\n    # of them must be 1. Return the resulting broadcast shape as a tuple,\n    # or None if any pair is incompatible.\n    pass',
      solution:'def broadcast_shape(shape1, shape2):\n    len1, len2 = len(shape1), len(shape2)\n    maxlen = max(len1, len2)\n    s1 = (1,) * (maxlen - len1) + tuple(shape1)\n    s2 = (1,) * (maxlen - len2) + tuple(shape2)\n    result = []\n    for a, b in zip(s1, s2):\n        if a == b or a == 1 or b == 1:\n            result.append(max(a, b))\n        else:\n            return None\n    return tuple(result)',
      hints:['Pad the SHORTER shape with 1s on the LEFT so both have the same length, then compare pairs from left to right (which is really right-to-left in the original shapes).','Two dims are compatible if they\'re equal, OR either one is 1 (a size-1 dim "stretches" to match).','Return None the moment you find an incompatible pair -- otherwise build up the result shape.'],
      tests:[
        {argsRepr:'(3,1), (1,4)', expectedRepr:'(3, 4)'},
        {argsRepr:'(5,3,1), (3,4)', expectedRepr:'(5, 3, 4)'},
        {argsRepr:'(3,), (4,)', expectedRepr:'None'}
      ]},
    { id:'pytorch-flatten', mode:'test', title:'Computing a flattened tensor\'s size', funcName:'flatten_shape',
      explain:'Flattening a tensor (e.g. before a fully-connected layer) collapses all its dimensions into one -- the resulting size is simply the product of all the original dimensions.',
      starter:'def flatten_shape(shape):\n    # TODO: return the product of all values in shape\n    pass',
      solution:'def flatten_shape(shape):\n    total = 1\n    for d in shape:\n        total *= d\n    return total',
      hints:['Start with a running total of 1, then multiply by each dimension in turn.','This is exactly what a nested for-loop with *= does.','total = 1\\nfor d in shape: total *= d\\nreturn total'],
      tests:[
        {argsRepr:'(2,3,4)', expectedRepr:'24'}
      ]},
    { id:'pytorch-autograd', mode:'choice', title:'Why autograd matters',
      explain:'PyTorch\'s autograd system automatically tracks operations on tensors and computes gradients -- the mechanism that makes training via backpropagation practical.',
      scenario:'Without autograd, what would you need to do to train a neural network by hand?',
      choices:['Nothing different -- gradients aren\'t actually needed for training', 'Manually derive and code the gradient (derivative) of every single operation in your network, for every possible architecture', 'Training would actually be easier without autograd', 'Autograd only matters for very large networks'],
      correct:1,
      feedback:['Gradients are exactly what gradient descent (the core training algorithm) needs -- they\'re essential, not optional.','Correct -- this is precisely the enormous, error-prone task autograd eliminates: automatically computing gradients through arbitrarily complex chains of operations, so you don\'t hand-derive calculus for every architecture.','Manually deriving and coding gradients by hand for every operation would be dramatically MORE work, not less.','Autograd saves real, substantial effort at any network size -- the benefit doesn\'t only appear at scale.'] },
    { id:'pytorch-gpu-tensor', mode:'choice', title:'CPU vs. GPU tensors: a real practical detail',
      explain:'A PyTorch tensor lives on a specific device (CPU or GPU) -- operations between tensors on DIFFERENT devices will raise an error, not silently work.',
      scenario:'Your model\'s weights are on the GPU (.cuda()), but you forgot to move your input data there too. What actually happens when you run a forward pass?',
      choices:['It works fine automatically -- PyTorch handles this transparently', 'A runtime error, because operations require all tensors involved to be on the same device', 'The GPU tensor silently moves back to CPU', 'This is only a problem during training, never during inference'],
      correct:1,
      feedback:['PyTorch does NOT automatically move tensors between devices for you -- this mismatch causes a real, explicit error.','Correct -- this is a very common, real practical gotcha: PyTorch requires tensors in the same operation to be on the same device, and raises a clear error if they aren\'t.','Tensors don\'t silently move themselves between devices -- you must explicitly call .to(device) or .cuda()/.cpu().','This error occurs identically during inference and training -- any forward pass with mismatched devices fails the same way.'] }
  ];

  function pytorchKey(id, field){ return 'pytorchtrack:'+id+':'+field; }
  function pytorchSave(id, field, val){ try{ localStorage.setItem(pytorchKey(id,field), val); }catch(e){} }
  function pytorchLoad(id, field, fallback){ try{ var v=localStorage.getItem(pytorchKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function pytorchDoneKey(id){ return 'pytorchtrack:'+id+':done'; }
  function pytorchIsDone(id){ try{ return localStorage.getItem(pytorchDoneKey(id))==='1'; }catch(e){ return false; } }
  function pytorchEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var pytorchCurIdx = 0;
  window.pytorchOpen = function(idx){ pytorchCurIdx = idx; renderPytorchNav(); renderPytorchLesson(); window.scrollTo(0,0); };
  window.pytorchNext = function(){ if(pytorchCurIdx < PYTORCH_LESSONS.length-1) window.pytorchOpen(pytorchCurIdx+1); };
  window.pytorchPrev = function(){ if(pytorchCurIdx > 0) window.pytorchOpen(pytorchCurIdx-1); };
  window.pytorchMarkDone = function(idx){ try{ localStorage.setItem(pytorchDoneKey(PYTORCH_LESSONS[idx].id), '1'); }catch(e){} renderPytorchNav(); };

  function renderPytorchNav(){
    var nav = document.getElementById('pytorchLessonNav'); if(!nav) return;
    nav.innerHTML = PYTORCH_LESSONS.map(function(l, i){
      var done = pytorchIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===pytorchCurIdx?'active':'')+'" data-act="pytorchOpen('+i+')">'+(i+1)+'. '+pytorchEsc(l.title)+done+'</button>';
    }).join('');
  }
  function pytorchNavRow(){
    return '<div class="wd-navrow">'
      + (pytorchCurIdx>0 ? '<button class="wd-btn-ghost" data-act="pytorchPrev()">&larr; Previous</button>' : '<span></span>')
      + (pytorchCurIdx<PYTORCH_LESSONS.length-1 ? '<button class="wd-btn" data-act="pytorchNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderPytorchLesson(){
    var body = document.getElementById('pytorchLessonBody'); if(!body) return;
    var l = PYTORCH_LESSONS[pytorchCurIdx];
    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="pytorchchoice_'+l.id+'_'+i+'" data-act="pytorchAnswer(\''+l.id+'\','+i+')">'+pytorchEsc(c)+'</button>';
      }).join('');
      body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(pytorchCurIdx+1)+pytorchEsc(l.title)+'</h2></div>'
        + trackMentalModel(pytorchEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+pytorchEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="pytorchfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="pytorchMarkDone('+pytorchCurIdx+')">Mark task done</button></div>'
        + pytorchNavRow();
      return;
    }
    var savedCode = pytorchLoad(l.id, 'code', l.starter);
    var idBase = 'pytorchpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){ return '<button data-act="pytorchRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>'; }).join('') + '<button data-act="pytorchRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){ return '<div class="wd-hintbox" id="pytorchhint_'+l.id+'_'+(i+1)+'">'+pytorchEsc(h)+'</div>'; }).join('') + '<div class="wd-hintbox" id="pytorchhint_'+l.id+'_99"><b>Solution:</b><pre>'+pytorchEsc(l.solution)+'</pre></div>';
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(pytorchCurIdx+1)+pytorchEsc(l.title)+'</h2></div>'
      + trackMentalModel(pytorchEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:130px">'+pytorchEsc(savedCode)+'</textarea>')
      + '<div class="wd-row"><button class="wd-btn" data-act="pytorchRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
      + '<button class="wd-btn-ghost" data-act="pytorchReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
      + '<button class="wd-btn-ghost" data-act="pytorchMarkDone('+pytorchCurIdx+')">Mark task done</button></div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes + pytorchNavRow();
  }
  window.pytorchReset = function(lessonId, editId){
    var l = PYTORCH_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var ta = document.getElementById(editId); if(ta) ta.value = l.starter;
    pytorchSave(lessonId, 'code', l.starter);
  };
  window.pytorchRevealHint = function(lessonId, tier){
    var l = PYTORCH_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){ var el = document.getElementById('pytorchhint_'+lessonId+'_'+t); if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier)); });
  };
  window.pytorchAnswer = function(lessonId, choiceIdx){
    var l = PYTORCH_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('pytorchchoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('pytorchfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  window.pytorchRunTests = async function(lessonId, editId, outId, statusId){
    var l = PYTORCH_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    pytorchSave(lessonId, 'code', code);
    var out = document.getElementById(outId); if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py; try{ py = await getPy(statusId); } catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }
    var harnessLines = ['_pytorch_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push('try:\n    _r = '+l.funcName+'('+t.argsRepr+')\n    _exp = ('+t.expectedRepr+')\n    _ok = (_r == _exp)\n    _pytorch_results.append(("'+i+'", _ok, repr(_r)))\nexcept Exception as _e:\n    _pytorch_results.append(("'+i+'", False, "Error: " + str(_e)))');
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _pytorch_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';
    try{
      py.globals.set('_SRC', fullSrc); py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT'); var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){ var parts = ln.split('|'); return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+pytorchEsc(parts[3])+'</span></div>'; }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>'; }
  };
  var pytorchBooted = false;
  window._pytorchBoot = function(){ if(pytorchBooted) return; pytorchBooted = true; window.pytorchOpen(0); };
})();
