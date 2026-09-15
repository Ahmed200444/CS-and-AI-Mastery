
(function(){
  var VAES_LESSONS = [
    { id:'vaes-latent-space', mode:'choice', title:'What the latent space actually represents',
      explain:'A VAE compresses input data into a lower-dimensional latent space, then reconstructs it back -- but unlike a plain autoencoder, it forces that space to have useful structure.',
      scenario:'In a well-trained VAE trained on faces, moving smoothly along one direction in latent space produces faces that smile more and more. What does this demonstrate?',
      choices:['This is a coincidence with no real structure', 'The latent space has learned a smooth, continuous, meaningful representation -- nearby points correspond to similar outputs', 'This means the model has memorized specific training images', 'This only happens with images, never with other data types'],
      correct:1,
      feedback:['This kind of smooth, interpretable direction is a well-documented, repeatable property of good VAE latent spaces, not a coincidence.','Correct -- this is exactly what a good VAE latent space provides: continuity and structure, so smooth movement through it produces smoothly varying, meaningful outputs.','Memorization would NOT produce smooth, continuous variation -- it would produce abrupt jumps between memorized examples, not gradual change.','This same latent-space structure has been demonstrated for many other data types (audio, text embeddings, molecular structures) -- it\'s a general property, not image-specific.'] },
    { id:'vaes-loss-tradeoff', mode:'calc', title:'The reconstruction vs. KL divergence trade-off', funcName:'vae_total_loss',
      explain:'A VAE\'s loss has two competing terms: reconstruction loss (how well it rebuilds the input) and KL divergence (how close the latent distribution stays to a simple prior). The beta parameter controls their balance.',
      starter:'def vae_total_loss(reconstruction_loss, kl_divergence, beta=1.0):\n    # TODO: return reconstruction_loss + beta * kl_divergence, rounded to 3 decimals\n    pass',
      solution:'def vae_total_loss(reconstruction_loss, kl_divergence, beta=1.0):\n    return round(reconstruction_loss + beta * kl_divergence, 3)',
      hints:['This is a simple weighted sum of the two loss terms.','beta multiplies ONLY the KL term -- reconstruction loss keeps its full weight.','return round(reconstruction_loss + beta * kl_divergence, 3)'],
      tests:[
        {argsRepr:'2.5, 0.8', expectedRepr:'3.3'},
        {argsRepr:'2.5, 0.8, 0.5', expectedRepr:'2.9'}
      ]},
    { id:'vaes-beta-effect', mode:'choice', title:'What increasing beta actually does',
      explain:'Beta controls how strongly the model is pushed to keep its latent space close to a simple, well-structured prior distribution, versus focusing purely on accurate reconstruction.',
      scenario:'You increase beta significantly in a beta-VAE. Reconstructions become noticeably blurrier, but the latent space becomes more organized and interpretable. Why?',
      choices:['This is unrelated to beta -- it\'s just random variation between training runs', 'A higher beta prioritizes latent-space structure over reconstruction accuracy -- a real, deliberate trade-off, not a bug', 'Higher beta always improves both reconstruction AND latent structure simultaneously', 'Beta has no effect on training at all'],
      correct:1,
      feedback:['This is a well-documented, repeatable, deliberate effect of the beta parameter -- not random noise between runs.','Correct -- this is the beta-VAE trade-off by design: pushing harder for a clean, disentangled latent structure costs some reconstruction fidelity. Practitioners tune beta based on which they need more.','This is precisely the trade-off -- gains in latent structure typically COST some reconstruction quality, not both at once for free.','Beta directly and significantly affects the balance between the two loss terms -- it\'s a core, intentional training hyperparameter.'] },
    { id:'vaes-vs-gan', mode:'choice', title:'VAEs vs. GANs: a real trade-off, not a winner',
      explain:'VAEs and GANs solve the same generative problem very differently -- and each makes real trade-offs the other doesn\'t.',
      scenario:'A VAE\'s reconstructions are often noticeably blurrier than a well-trained GAN\'s sharp outputs, but VAE training is far more stable and rarely suffers mode collapse. Which framing is most accurate?',
      choices:['VAEs are strictly worse than GANs in every way', 'This is a genuine trade-off: VAEs offer more stable training and better-behaved latent spaces at some cost to output sharpness, while GANs offer sharper output at the cost of training stability', 'GANs are strictly worse than VAEs in every way', 'There is no real difference between the two approaches'],
      correct:1,
      feedback:['VAEs have real, distinct advantages (training stability, structured latent space, no mode collapse) -- "strictly worse" isn\'t an honest framing.','Correct -- this is the accurate, balanced way to describe it: each approach makes a real trade-off, and which one is "better" depends entirely on what a specific project actually needs.','GANs have real, distinct advantages too (sharper samples) -- neither approach dominates the other across all dimensions.','These are architecturally and behaviorally very different approaches with genuinely different strengths and weaknesses -- the difference is real and well-documented.'] }
  ];

  function vaesKey(id, field){ return 'vaestrack:'+id+':'+field; }
  function vaesSave(id, field, val){ try{ localStorage.setItem(vaesKey(id,field), val); }catch(e){} }
  function vaesLoad(id, field, fallback){ try{ var v=localStorage.getItem(vaesKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function vaesDoneKey(id){ return 'vaestrack:'+id+':done'; }
  function vaesIsDone(id){ try{ return localStorage.getItem(vaesDoneKey(id))==='1'; }catch(e){ return false; } }
  function vaesEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var vaesCurIdx = 0;
  window.vaesOpen = function(idx){ vaesCurIdx = idx; renderVaesNav(); renderVaesLesson(); window.scrollTo(0,0); };
  window.vaesNext = function(){ if(vaesCurIdx < VAES_LESSONS.length-1) window.vaesOpen(vaesCurIdx+1); };
  window.vaesPrev = function(){ if(vaesCurIdx > 0) window.vaesOpen(vaesCurIdx-1); };
  window.vaesMarkDone = function(idx){ try{ localStorage.setItem(vaesDoneKey(VAES_LESSONS[idx].id), '1'); }catch(e){} renderVaesNav(); };

  function renderVaesNav(){
    var nav = document.getElementById('vaesLessonNav'); if(!nav) return;
    nav.innerHTML = VAES_LESSONS.map(function(l, i){
      var done = vaesIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===vaesCurIdx?'active':'')+'" data-act="vaesOpen('+i+')">'+(i+1)+'. '+vaesEsc(l.title)+done+'</button>';
    }).join('');
  }
  function vaesNavRow(){
    return '<div class="wd-navrow">'
      + (vaesCurIdx>0 ? '<button class="wd-btn-ghost" data-act="vaesPrev()">&larr; Previous</button>' : '<span></span>')
      + (vaesCurIdx<VAES_LESSONS.length-1 ? '<button class="wd-btn" data-act="vaesNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderVaesLesson(){
    var body = document.getElementById('vaesLessonBody'); if(!body) return;
    var l = VAES_LESSONS[vaesCurIdx];
    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="vaeschoice_'+l.id+'_'+i+'" data-act="vaesAnswer(\''+l.id+'\','+i+')">'+vaesEsc(c)+'</button>';
      }).join('');
      body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(vaesCurIdx+1)+vaesEsc(l.title)+'</h2></div>'
        + trackMentalModel(vaesEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+vaesEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="vaesfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="vaesMarkDone('+vaesCurIdx+')">Mark task done</button></div>'
        + vaesNavRow();
      return;
    }
    var savedCode = vaesLoad(l.id, 'code', l.starter);
    var idBase = 'vaespm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){ return '<button data-act="vaesRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>'; }).join('') + '<button data-act="vaesRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){ return '<div class="wd-hintbox" id="vaeshint_'+l.id+'_'+(i+1)+'">'+vaesEsc(h)+'</div>'; }).join('') + '<div class="wd-hintbox" id="vaeshint_'+l.id+'_99"><b>Solution:</b><pre>'+vaesEsc(l.solution)+'</pre></div>';
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(vaesCurIdx+1)+vaesEsc(l.title)+'</h2></div>'
      + trackMentalModel(vaesEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:110px">'+vaesEsc(savedCode)+'</textarea>')
      + '<div class="wd-row"><button class="wd-btn" data-act="vaesRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
      + '<button class="wd-btn-ghost" data-act="vaesReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
      + '<button class="wd-btn-ghost" data-act="vaesMarkDone('+vaesCurIdx+')">Mark task done</button></div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes + vaesNavRow();
  }
  window.vaesReset = function(lessonId, editId){
    var l = VAES_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var ta = document.getElementById(editId); if(ta) ta.value = l.starter;
    vaesSave(lessonId, 'code', l.starter);
  };
  window.vaesRevealHint = function(lessonId, tier){
    var l = VAES_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){ var el = document.getElementById('vaeshint_'+lessonId+'_'+t); if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier)); });
  };
  window.vaesAnswer = function(lessonId, choiceIdx){
    var l = VAES_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('vaeschoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('vaesfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  window.vaesRunTests = async function(lessonId, editId, outId, statusId){
    var l = VAES_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    vaesSave(lessonId, 'code', code);
    var out = document.getElementById(outId); if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py; try{ py = await getPy(statusId); } catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }
    var harnessLines = ['_vaes_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push('try:\n    _r = '+l.funcName+'('+t.argsRepr+')\n    _exp = ('+t.expectedRepr+')\n    _ok = (abs(_r - _exp) < 1e-6) if isinstance(_r,(int,float)) and isinstance(_exp,(int,float)) and not isinstance(_r,bool) and not isinstance(_exp,bool) else (_r == _exp)\n    _vaes_results.append(("'+i+'", _ok, repr(_r)))\nexcept Exception as _e:\n    _vaes_results.append(("'+i+'", False, "Error: " + str(_e)))');
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _vaes_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';
    try{
      py.globals.set('_SRC', fullSrc); py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT'); var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){ var parts = ln.split('|'); return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+vaesEsc(parts[3])+'</span></div>'; }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>'; }
  };
  var vaesBooted = false;
  window._vaesBoot = function(){ if(vaesBooted) return; vaesBooted = true; window.vaesOpen(0); };
})();
