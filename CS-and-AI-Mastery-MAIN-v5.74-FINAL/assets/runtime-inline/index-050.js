
(function(){
  var DIFF_LESSONS = [
    { id:'diff-forward-process', mode:'choice', title:'The forward diffusion process',
      explain:'Diffusion models are trained by first gradually ADDING noise to real images over many steps, until they become pure noise -- then training a model to reverse that exact process.',
      scenario:'Why does the forward process (adding noise) not need to be learned at all, while the reverse process (removing noise) does?',
      choices:['Both actually need to be learned equally', 'Adding noise follows a simple, fixed mathematical formula (a known noise schedule) -- but removing noise to recover the original signal requires learning the data\'s actual structure', 'Removing noise is simpler than adding it', 'Neither process is mathematical -- both are just random'],
      correct:1,
      feedback:['This is the key asymmetry in diffusion models -- one direction is fixed math, the other requires learning.','Correct -- adding noise according to a known schedule is straightforward and requires no learning; reversing it (denoising) requires the model to have learned what real images actually look like, which is the hard, learned part.','Denoising is actually the HARDER, learned direction -- it requires real understanding of the data distribution, unlike the fixed forward process.','The forward process specifically follows a defined, non-random mathematical schedule -- that\'s precisely why it doesn\'t need to be learned.'] },
    { id:'diff-noise-schedule', mode:'calc', title:'Computing a linear noise schedule', funcName:'noise_level_at_step',
      explain:'A noise schedule defines how much noise gets added at each step -- a simple, common choice increases linearly from a small starting value to a larger ending value.',
      starter:'def noise_level_at_step(step, total_steps, beta_start=0.0001, beta_end=0.02):\n    # TODO: linearly interpolate between beta_start and beta_end based on\n    # step/total_steps, rounded to 5 decimals\n    pass',
      solution:'def noise_level_at_step(step, total_steps, beta_start=0.0001, beta_end=0.02):\n    beta_t = beta_start + (beta_end - beta_start) * (step / total_steps)\n    return round(beta_t, 5)',
      hints:['This is linear interpolation: start value plus a fraction of the total range.','step/total_steps gives you a fraction from 0 to 1, representing progress through the schedule.','beta_t = beta_start + (beta_end - beta_start) * (step / total_steps); return round(beta_t, 5)'],
      tests:[
        {argsRepr:'500, 1000', expectedRepr:'0.01005'},
        {argsRepr:'0, 1000', expectedRepr:'0.0001'}
      ]},
    { id:'diff-vs-gan-stability', mode:'choice', title:'Why diffusion models train more stably than GANs',
      explain:'Diffusion models learn via a straightforward denoising objective (predict and remove noise) -- no adversarial competition between two networks.',
      scenario:'Diffusion models don\'t suffer from mode collapse or the delicate generator/discriminator balancing act GANs require. Why?',
      choices:['Diffusion models are just smaller and simpler networks', 'There\'s no adversarial game at all -- just a single network learning a well-defined denoising task, avoiding the instabilities that come from two networks competing', 'Diffusion models don\'t actually generate diverse output either', 'This is incorrect -- diffusion models have the exact same stability issues as GANs'],
      correct:1,
      feedback:['Diffusion models are often LARGER and more computationally expensive than GANs -- their stability comes from the training objective, not model size.','Correct -- without an adversarial min-max game between two competing networks, diffusion training avoids the specific instabilities (mode collapse, delicate balance) that come from that competitive dynamic.','Diffusion models are actually well-regarded for good output diversity -- avoiding the adversarial dynamic doesn\'t cost them diversity.','This is a well-documented, real difference -- diffusion models are widely recognized for their more stable training compared to GANs.'] },
    { id:'diff-sampling-cost', mode:'choice', title:'The real cost of diffusion sampling',
      explain:'Generating one sample from a diffusion model requires running the denoising step many times in sequence, not just once.',
      scenario:'A GAN generates an image in a single forward pass. A diffusion model might need 50-1000 sequential denoising steps to generate one image. What real trade-off does this represent?',
      choices:['There\'s no trade-off -- diffusion models are strictly better in every way', 'Diffusion models often trade generation SPEED for training stability and sample quality/diversity -- a real, honest cost', 'GANs are always faster and better in every respect', 'The number of steps has no effect on generation time'],
      correct:1,
      feedback:['Every generative approach makes real trade-offs -- the multi-step sampling cost is a genuine, well-known downside of diffusion models.','Correct -- this is the honest trade-off: diffusion\'s training stability and often excellent sample quality/diversity come at the real cost of slower, multi-step generation compared to a GAN\'s single forward pass.','GANs trade away training stability and diversity guarantees for that generation speed -- neither approach is simply "better" across the board.','More denoising steps directly means more sequential computation, and therefore more real generation time -- this is a genuine, measurable cost.'] }
  ];

  function diffKey(id, field){ return 'difftrack:'+id+':'+field; }
  function diffSave(id, field, val){ try{ localStorage.setItem(diffKey(id,field), val); }catch(e){} }
  function diffLoad(id, field, fallback){ try{ var v=localStorage.getItem(diffKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function diffDoneKey(id){ return 'difftrack:'+id+':done'; }
  function diffIsDone(id){ try{ return localStorage.getItem(diffDoneKey(id))==='1'; }catch(e){ return false; } }
  function diffEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var diffCurIdx = 0;
  window.diffOpen = function(idx){ diffCurIdx = idx; renderDiffNav(); renderDiffLesson(); window.scrollTo(0,0); };
  window.diffNext = function(){ if(diffCurIdx < DIFF_LESSONS.length-1) window.diffOpen(diffCurIdx+1); };
  window.diffPrev = function(){ if(diffCurIdx > 0) window.diffOpen(diffCurIdx-1); };
  window.diffMarkDone = function(idx){ try{ localStorage.setItem(diffDoneKey(DIFF_LESSONS[idx].id), '1'); }catch(e){} renderDiffNav(); };

  function renderDiffNav(){
    var nav = document.getElementById('diffLessonNav'); if(!nav) return;
    nav.innerHTML = DIFF_LESSONS.map(function(l, i){
      var done = diffIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===diffCurIdx?'active':'')+'" data-act="diffOpen('+i+')">'+(i+1)+'. '+diffEsc(l.title)+done+'</button>';
    }).join('');
  }
  function diffNavRow(){
    return '<div class="wd-navrow">'
      + (diffCurIdx>0 ? '<button class="wd-btn-ghost" data-act="diffPrev()">&larr; Previous</button>' : '<span></span>')
      + (diffCurIdx<DIFF_LESSONS.length-1 ? '<button class="wd-btn" data-act="diffNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderDiffLesson(){
    var body = document.getElementById('diffLessonBody'); if(!body) return;
    var l = DIFF_LESSONS[diffCurIdx];
    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="diffchoice_'+l.id+'_'+i+'" data-act="diffAnswer(\''+l.id+'\','+i+')">'+diffEsc(c)+'</button>';
      }).join('');
      body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(diffCurIdx+1)+diffEsc(l.title)+'</h2></div>'
        + trackMentalModel(diffEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+diffEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="difffeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="diffMarkDone('+diffCurIdx+')">Mark task done</button></div>'
        + diffNavRow();
      return;
    }
    var savedCode = diffLoad(l.id, 'code', l.starter);
    var idBase = 'diffpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){ return '<button data-act="diffRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>'; }).join('') + '<button data-act="diffRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){ return '<div class="wd-hintbox" id="diffhint_'+l.id+'_'+(i+1)+'">'+diffEsc(h)+'</div>'; }).join('') + '<div class="wd-hintbox" id="diffhint_'+l.id+'_99"><b>Solution:</b><pre>'+diffEsc(l.solution)+'</pre></div>';
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(diffCurIdx+1)+diffEsc(l.title)+'</h2></div>'
      + trackMentalModel(diffEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:110px">'+diffEsc(savedCode)+'</textarea>')
      + '<div class="wd-row"><button class="wd-btn" data-act="diffRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
      + '<button class="wd-btn-ghost" data-act="diffReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
      + '<button class="wd-btn-ghost" data-act="diffMarkDone('+diffCurIdx+')">Mark task done</button></div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes + diffNavRow();
  }
  window.diffReset = function(lessonId, editId){
    var l = DIFF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var ta = document.getElementById(editId); if(ta) ta.value = l.starter;
    diffSave(lessonId, 'code', l.starter);
  };
  window.diffRevealHint = function(lessonId, tier){
    var l = DIFF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){ var el = document.getElementById('diffhint_'+lessonId+'_'+t); if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier)); });
  };
  window.diffAnswer = function(lessonId, choiceIdx){
    var l = DIFF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('diffchoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('difffeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  window.diffRunTests = async function(lessonId, editId, outId, statusId){
    var l = DIFF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    diffSave(lessonId, 'code', code);
    var out = document.getElementById(outId); if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py; try{ py = await getPy(statusId); } catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }
    var harnessLines = ['_diff_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push('try:\n    _r = '+l.funcName+'('+t.argsRepr+')\n    _exp = ('+t.expectedRepr+')\n    _ok = (abs(_r - _exp) < 1e-6) if isinstance(_r,(int,float)) and isinstance(_exp,(int,float)) and not isinstance(_r,bool) and not isinstance(_exp,bool) else (_r == _exp)\n    _diff_results.append(("'+i+'", _ok, repr(_r)))\nexcept Exception as _e:\n    _diff_results.append(("'+i+'", False, "Error: " + str(_e)))');
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _diff_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';
    try{
      py.globals.set('_SRC', fullSrc); py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT'); var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){ var parts = ln.split('|'); return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+diffEsc(parts[3])+'</span></div>'; }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>'; }
  };
  var diffBooted = false;
  window._diffBoot = function(){ if(diffBooted) return; diffBooted = true; window.diffOpen(0); };
})();
