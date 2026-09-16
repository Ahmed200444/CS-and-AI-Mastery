
(function(){
  var GENAI_LESSONS = [
    { id:'genai-approach-choice', mode:'choice', title:'GAN, VAE, or diffusion: matching the tool to the job',
      explain:'Each generative approach (covered in their own dedicated tracks) makes different trade-offs -- the right choice depends on what actually matters for a specific project.',
      scenario:'You need STABLE, reproducible training on a modest budget, and diverse-but-good-enough (not perfectly sharp) outputs matter more than photorealism. Which historically has been the easiest starting point?',
      choices:['A GAN, for its famously stable and simple training', 'A VAE, for its more stable training and well-behaved latent space, even though outputs are typically blurrier', 'Always diffusion, regardless of the actual requirements', 'The choice never matters -- all three behave identically'],
      correct:1,
      feedback:['GAN training is widely known to be LESS stable, not more -- this doesn\'t match the stated priorities.','Correct -- given a stated priority of stability and budget over sharpness, a VAE\'s well-documented training stability is the better-matched starting point.','Diffusion models are often more computationally expensive to train and sample from -- "always" isn\'t justified without considering the actual requirements.','These three approaches have genuinely different, well-documented trade-offs -- the choice meaningfully matters.'] },
    { id:'genai-hallucination', mode:'choice', title:'Hallucination isn\'t unique to text models',
      explain:'"Hallucination" (confidently generating incorrect or fabricated content) is a general risk across generative AI, not just language models.',
      scenario:'An image-generation model asked to draw "a hand" sometimes produces six fingers, confidently rendered as if correct. What\'s the most accurate framing?',
      choices:['This never happens with image models, only text', 'This is the same underlying failure mode as text hallucination -- confident generation of something that doesn\'t match reality/training data correctly', 'This means the model is broken and unusable', 'Six-finger hands are always intentional artistic choices'],
      correct:1,
      feedback:['Image generation models absolutely exhibit this kind of failure -- confidently wrong output isn\'t exclusive to text.','Correct -- this is the same fundamental issue as text hallucination: the model generates something confidently that doesn\'t match reality or the true structure of what it was asked for.','A specific failure mode on a specific input doesn\'t mean the whole model is unusable -- it\'s a known limitation to be aware of and work around, not a total failure.','This is a well-documented, common generation ARTIFACT/failure, not an intentional stylistic choice.'] },
    { id:'genai-prompt-vs-finetune', mode:'choice', title:'Prompting vs. fine-tuning: a real cost trade-off',
      explain:'You can adapt a generative model\'s behavior either by crafting better prompts, or by actually retraining part of the model on your own data.',
      scenario:'You need a model to consistently generate images in one very specific, unusual art style your prompts alone can\'t reliably capture. What\'s the honest trade-off of fine-tuning vs. just prompting harder?',
      choices:['Prompting harder always eventually works with no real limit', 'Fine-tuning costs more time/compute/data upfront, but can reliably capture patterns that prompting alone genuinely cannot express', 'Fine-tuning is always the wrong choice regardless of the situation', 'There\'s no difference between the two approaches'],
      correct:1,
      feedback:['Prompting has real limits -- some patterns genuinely can\'t be reliably expressed through instructions alone, no matter how the prompt is worded.','Correct -- this is the honest trade-off: fine-tuning requires real upfront investment (data, compute, time), but it can capture patterns and consistency that prompting alone has genuine limits reaching.','Fine-tuning is a legitimate, sometimes necessary tool -- calling it "always wrong" ignores real cases where it\'s the right choice.','These are genuinely different techniques with different costs and capabilities -- not interchangeable.'] },
    { id:'genai-copyright-consideration', mode:'choice', title:'A real, current consideration: training data provenance',
      explain:'Generative models learn from the data they\'re trained on -- and what that data was, and how it was licensed, is a genuinely unresolved area of ongoing legal and ethical discussion.',
      scenario:'A team is choosing a generative model for a commercial product. Why might the training data\'s provenance and licensing matter, beyond just how good the model\'s outputs look?',
      choices:['It never matters -- only output quality matters for a commercial product', 'Training data provenance carries real legal, ethical, and business risk considerations that are separate from output quality', 'This is purely a marketing consideration with no real substance', 'Only academic researchers need to consider this, never companies'],
      correct:1,
      feedback:['Output quality and data provenance are genuinely separate concerns -- a great-looking model can still carry real legal/business risk from its training data.','Correct -- this is a real, actively-discussed consideration (licensing, consent, attribution, legal exposure) that exists independently of how good the outputs look.','This has real legal and business substance -- multiple ongoing lawsuits and licensing disputes make this a genuine, not just marketing, concern.','Commercial use specifically increases legal exposure -- this is arguably MORE relevant for companies than for academic research use.'] }
  ];

  function genaiKey(id, field){ return 'genaitrack:'+id+':'+field; }
  function genaiDoneKey(id){ return 'genaitrack:'+id+':done'; }
  function genaiIsDone(id){ try{ return localStorage.getItem(genaiDoneKey(id))==='1'; }catch(e){ return false; } }
  function genaiEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var genaiCurIdx = 0;
  window.genaiOpen = function(idx){ genaiCurIdx = idx; renderGenaiNav(); renderGenaiLesson(); window.scrollTo(0,0); };
  window.genaiNext = function(){ if(genaiCurIdx < GENAI_LESSONS.length-1) window.genaiOpen(genaiCurIdx+1); };
  window.genaiPrev = function(){ if(genaiCurIdx > 0) window.genaiOpen(genaiCurIdx-1); };
  window.genaiMarkDone = function(idx){ try{ localStorage.setItem(genaiDoneKey(GENAI_LESSONS[idx].id), '1'); }catch(e){} renderGenaiNav(); };

  function renderGenaiNav(){
    var nav = document.getElementById('genaiLessonNav'); if(!nav) return;
    nav.innerHTML = GENAI_LESSONS.map(function(l, i){
      var done = genaiIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===genaiCurIdx?'active':'')+'" data-act="genaiOpen('+i+')">'+(i+1)+'. '+genaiEsc(l.title)+done+'</button>';
    }).join('');
  }
  function genaiNavRow(){
    return '<div class="wd-navrow">'
      + (genaiCurIdx>0 ? '<button class="wd-btn-ghost" data-act="genaiPrev()">&larr; Previous</button>' : '<span></span>')
      + (genaiCurIdx<GENAI_LESSONS.length-1 ? '<button class="wd-btn" data-act="genaiNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderGenaiLesson(){
    var body = document.getElementById('genaiLessonBody'); if(!body) return;
    var l = GENAI_LESSONS[genaiCurIdx];
    var choicesHtml = l.choices.map(function(c, i){
      return '<button class="agent-choice-btn" id="genaichoice_'+l.id+'_'+i+'" data-act="genaiAnswer(\''+l.id+'\','+i+')">'+genaiEsc(c)+'</button>';
    }).join('');
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(genaiCurIdx+1)+genaiEsc(l.title)+'</h2></div>'
        + trackMentalModel(genaiEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+genaiEsc(l.scenario)+'</p>'
      + '<div>'+choicesHtml+'</div>'
      + '<div class="agent-feedback" id="genaifeedback_'+l.id+'"></div>'
      + '<div class="wd-row"><button class="wd-btn-ghost" data-act="genaiMarkDone('+genaiCurIdx+')">Mark task done</button></div>'
      + genaiNavRow();
  }
  window.genaiAnswer = function(lessonId, choiceIdx){
    var l = GENAI_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('genaichoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('genaifeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  var genaiBooted = false;
  window._genaiBoot = function(){ if(genaiBooted) return; genaiBooted = true; window.genaiOpen(0); };
})();
