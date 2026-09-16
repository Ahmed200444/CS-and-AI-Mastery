
(function(){
  var GANS_LESSONS = [
    { id:'gans-roles', mode:'choice', title:'Generator vs. discriminator roles',
      explain:'A GAN trains two networks against each other -- their goals are directly opposed.',
      scenario:'The generator creates fake images; the discriminator tries to tell real from fake. If the discriminator gets too good too fast, what typically happens to training?',
      choices:['Training improves faster since the discriminator is doing its job well', 'The generator receives a weak/uninformative gradient signal (everything is confidently rejected), stalling its learning', 'Nothing changes -- the two networks train independently', 'The discriminator automatically becomes the generator'],
      correct:1,
      feedback:['A discriminator that\'s "too good" actually HURTS generator training -- it needs a real chance of being fooled to provide a useful learning signal.','Correct -- if the discriminator confidently rejects everything the generator produces, the generator gets little useful gradient information about how to improve, a well-known GAN training instability.','They train adversarially, in direct response to each other -- one\'s progress directly affects the other\'s training dynamics.','These are two separate networks with different architectures and objectives -- one doesn\'t "become" the other.'] },
    { id:'gans-mode-collapse', mode:'choice', title:'Recognizing mode collapse',
      explain:'A generator can "cheat" by finding one output that reliably fools the discriminator, then producing only variations of that one output.',
      scenario:'A GAN trained on diverse handwritten digits (0-9) starts producing only very similar-looking "8"s, no matter what random input it receives. What is this?',
      choices:['This is normal, healthy convergence', 'Mode collapse -- the generator has found one output that fools the discriminator and stopped exploring diverse outputs', 'The discriminator has stopped working entirely', 'This means training is complete and successful'],
      correct:1,
      feedback:['Healthy GAN training produces diverse outputs matching the real data\'s variety -- collapsing to near-identical outputs is a well-known failure mode, not healthy convergence.','Correct -- this is the classic signature of mode collapse: the generator exploits one successful pattern rather than learning the true diversity of the target distribution.','The discriminator is likely still functioning -- the generator has just found a way to satisfy it without learning genuine diversity.','This is a training failure to diagnose and address (e.g. via architectural changes or different loss functions), not a success signal.'] },
    { id:'gans-discriminator-confidence', mode:'calc', title:'Measuring discriminator accuracy', funcName:'discriminator_confidence',
      explain:'A simple way to gauge how well a discriminator is doing: average how confidently it correctly identifies real images as real, and fake images as fake.',
      starter:'def discriminator_confidence(real_prob, fake_prob):\n    # real_prob: probability the discriminator assigns to a REAL image being real\n    # fake_prob: probability the discriminator assigns to a FAKE image being real\n    # TODO: return the average of (real_prob) and (1 - fake_prob), rounded to 3 decimals\n    pass',
      solution:'def discriminator_confidence(real_prob, fake_prob):\n    return round((real_prob + (1 - fake_prob)) / 2, 3)',
      hints:['You want the discriminator to say "real" (high prob) for real images, and "not real" (low fake_prob) for fake images.','1 - fake_prob converts "probability fake image looks real" into "correctly identifying it as fake."','return round((real_prob + (1 - fake_prob)) / 2, 3)'],
      tests:[
        {argsRepr:'0.9, 0.1', expectedRepr:'0.9'},
        {argsRepr:'0.5, 0.5', expectedRepr:'0.5'}
      ]},
    { id:'gans-vs-other-gen', mode:'choice', title:'When GANs are the right generative choice',
      explain:'GANs, VAEs, and diffusion models all generate new data, but with different trade-offs in training stability, output diversity, and sample quality.',
      scenario:'You need extremely photorealistic, sharp image generation, and you\'re prepared to invest significant effort in stabilizing training. GANs are historically known for excelling at exactly this. What\'s the honest trade-off you\'re accepting?',
      choices:['None -- GANs are strictly better than every alternative in every way', 'Sharper samples, but at the cost of notoriously unstable training and risks like mode collapse', 'GANs are always easier to train than any alternative', 'GANs guarantee perfectly diverse output with no extra effort'],
      correct:1,
      feedback:['No generative approach is strictly better in every dimension -- each makes real trade-offs, and GANs\' sharpness comes with real costs elsewhere.','Correct -- this is the honest, well-documented trade-off: GANs can produce very sharp, realistic samples, but their adversarial training is notoriously less stable than alternatives like VAEs or diffusion models.','GAN training is widely known to be MORE finicky to stabilize than many alternatives, not easier.','Mode collapse (covered earlier in this track) is exactly the risk that diversity is NOT guaranteed without careful training.'] }
  ];

  function gansKey(id, field){ return 'ganstrack:'+id+':'+field; }
  function gansSave(id, field, val){ try{ localStorage.setItem(gansKey(id,field), val); }catch(e){} }
  function gansLoad(id, field, fallback){ try{ var v=localStorage.getItem(gansKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function gansDoneKey(id){ return 'ganstrack:'+id+':done'; }
  function gansIsDone(id){ try{ return localStorage.getItem(gansDoneKey(id))==='1'; }catch(e){ return false; } }
  function gansEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var gansCurIdx = 0;
  window.gansOpen = function(idx){ gansCurIdx = idx; renderGansNav(); renderGansLesson(); window.scrollTo(0,0); };
  window.gansNext = function(){ if(gansCurIdx < GANS_LESSONS.length-1) window.gansOpen(gansCurIdx+1); };
  window.gansPrev = function(){ if(gansCurIdx > 0) window.gansOpen(gansCurIdx-1); };
  window.gansMarkDone = function(idx){ try{ localStorage.setItem(gansDoneKey(GANS_LESSONS[idx].id), '1'); }catch(e){} renderGansNav(); };

  function renderGansNav(){
    var nav = document.getElementById('gansLessonNav'); if(!nav) return;
    nav.innerHTML = GANS_LESSONS.map(function(l, i){
      var done = gansIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===gansCurIdx?'active':'')+'" data-act="gansOpen('+i+')">'+(i+1)+'. '+gansEsc(l.title)+done+'</button>';
    }).join('');
  }
  function gansNavRow(){
    return '<div class="wd-navrow">'
      + (gansCurIdx>0 ? '<button class="wd-btn-ghost" data-act="gansPrev()">&larr; Previous</button>' : '<span></span>')
      + (gansCurIdx<GANS_LESSONS.length-1 ? '<button class="wd-btn" data-act="gansNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderGansLesson(){
    var body = document.getElementById('gansLessonBody'); if(!body) return;
    var l = GANS_LESSONS[gansCurIdx];
    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="ganschoice_'+l.id+'_'+i+'" data-act="gansAnswer(\''+l.id+'\','+i+')">'+gansEsc(c)+'</button>';
      }).join('');
      body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(gansCurIdx+1)+gansEsc(l.title)+'</h2></div>'
        + trackMentalModel(gansEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+gansEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="gansfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="gansMarkDone('+gansCurIdx+')">Mark task done</button></div>'
        + gansNavRow();
      return;
    }
    var savedCode = gansLoad(l.id, 'code', l.starter);
    var idBase = 'ganspm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){ return '<button data-act="gansRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>'; }).join('') + '<button data-act="gansRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){ return '<div class="wd-hintbox" id="ganshint_'+l.id+'_'+(i+1)+'">'+gansEsc(h)+'</div>'; }).join('') + '<div class="wd-hintbox" id="ganshint_'+l.id+'_99"><b>Solution:</b><pre>'+gansEsc(l.solution)+'</pre></div>';
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(gansCurIdx+1)+gansEsc(l.title)+'</h2></div>'
      + trackMentalModel(gansEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:110px">'+gansEsc(savedCode)+'</textarea>')
      + '<div class="wd-row"><button class="wd-btn" data-act="gansRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
      + '<button class="wd-btn-ghost" data-act="gansReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
      + '<button class="wd-btn-ghost" data-act="gansMarkDone('+gansCurIdx+')">Mark task done</button></div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes + gansNavRow();
  }
  window.gansReset = function(lessonId, editId){
    var l = GANS_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var ta = document.getElementById(editId); if(ta) ta.value = l.starter;
    gansSave(lessonId, 'code', l.starter);
  };
  window.gansRevealHint = function(lessonId, tier){
    var l = GANS_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){ var el = document.getElementById('ganshint_'+lessonId+'_'+t); if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier)); });
  };
  window.gansAnswer = function(lessonId, choiceIdx){
    var l = GANS_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('ganschoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('gansfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  window.gansRunTests = async function(lessonId, editId, outId, statusId){
    var l = GANS_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    gansSave(lessonId, 'code', code);
    var out = document.getElementById(outId); if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py; try{ py = await getPy(statusId); } catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }
    var harnessLines = ['_gans_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push('try:\n    _r = '+l.funcName+'('+t.argsRepr+')\n    _exp = ('+t.expectedRepr+')\n    _ok = (abs(_r - _exp) < 1e-6) if isinstance(_r,(int,float)) and isinstance(_exp,(int,float)) and not isinstance(_r,bool) and not isinstance(_exp,bool) else (_r == _exp)\n    _gans_results.append(("'+i+'", _ok, repr(_r)))\nexcept Exception as _e:\n    _gans_results.append(("'+i+'", False, "Error: " + str(_e)))');
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _gans_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';
    try{
      py.globals.set('_SRC', fullSrc); py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT'); var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){ var parts = ln.split('|'); return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+gansEsc(parts[3])+'</span></div>'; }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>'; }
  };
  var gansBooted = false;
  window._gansBoot = function(){ if(gansBooted) return; gansBooted = true; window.gansOpen(0); };
})();
