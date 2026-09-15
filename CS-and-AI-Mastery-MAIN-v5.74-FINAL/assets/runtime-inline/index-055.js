
(function(){
  var HF_LESSONS = [
    { id:'hf-pipeline-select', mode:'test', title:'Choosing the right pipeline for a task', funcName:'select_pipeline',
      explain:'Hugging Face\'s pipeline() function needs to know which TASK you want (sentiment analysis, translation, summarization, etc.) -- picking the right one is the first real decision in using the library.',
      starter:'def select_pipeline(task_description):\n    # TODO: given a lowercase task_description, return the matching\n    # pipeline task name using this mapping (check if the keyword appears\n    # anywhere in the description):\n    # "sentiment" -> "text-classification"\n    # "translate" -> "translation"\n    # "summarize" -> "summarization"\n    # "classify image" -> "image-classification"\n    # "answer question" -> "question-answering"\n    # If nothing matches, return "unknown"\n    pass',
      solution:'def select_pipeline(task_description):\n    task_map = {\n        "sentiment": "text-classification",\n        "translate": "translation",\n        "summarize": "summarization",\n        "classify image": "image-classification",\n        "answer question": "question-answering",\n    }\n    for keyword, pipeline in task_map.items():\n        if keyword in task_description.lower():\n            return pipeline\n    return "unknown"',
      hints:['Lowercase the description first so matching isn\'t case-sensitive.','Loop through the mapping, checking if each keyword appears anywhere in the description.','If nothing in the loop matches, fall through to returning "unknown".'],
      tests:[
        {argsRepr:'"I need to detect sentiment in reviews"', expectedRepr:"'text-classification'"},
        {argsRepr:'"Please summarize this document"', expectedRepr:"'summarization'"}
      ]},
    { id:'hf-model-card', mode:'choice', title:'Why model cards matter before using a model',
      explain:'A model card documents what a pretrained model was trained on, its known limitations, and its intended use cases.',
      scenario:'Before deploying a pretrained sentiment model in a medical context, checking its model card reveals it was trained exclusively on movie reviews. What\'s the real risk of skipping this check?',
      choices:['No risk -- a model that works on one type of text works equally well on any other', 'The model may perform poorly or unpredictably on medical text, since its training data doesn\'t represent that domain -- a real, checkable risk', 'Model cards are purely optional documentation with no practical value', 'This only matters for very large models'],
      correct:1,
      feedback:['Models frequently perform worse on data very different from what they were trained on -- domain mismatch is a real, well-documented risk, not a non-issue.','Correct -- this is exactly what checking the model card upfront helps you avoid: deploying a model into a domain it was never actually evaluated on, risking poor or unpredictable results.','Model cards provide genuinely actionable information (training data, limitations, intended use) that directly informs whether a model is appropriate for your use case.','Domain mismatch risk applies regardless of model size -- a huge model trained on the wrong domain still carries this risk.'] },
    { id:'hf-tokenizer-mismatch', mode:'choice', title:'Why you must use the matching tokenizer',
      explain:'A pretrained model was trained with a SPECIFIC tokenizer, converting text into specific numeric IDs -- using a different tokenizer breaks that mapping entirely.',
      scenario:'You load a pretrained model, but accidentally load a DIFFERENT model\'s tokenizer alongside it. What actually happens?',
      choices:['Nothing -- tokenizers are interchangeable between any models', 'The model receives token IDs that don\'t mean what it was trained to expect, producing nonsensical or badly degraded output', 'The mismatch is automatically detected and fixed', 'This only matters for translation models specifically'],
      correct:1,
      feedback:['Tokenizers are specific to the vocabulary and encoding scheme each model was actually trained with -- they are NOT generically interchangeable.','Correct -- the model\'s learned weights are meaningless without the token-ID mapping it was trained on; a mismatched tokenizer feeds it IDs that correspond to entirely different words/subwords than intended.','There\'s no automatic detection of this mismatch by default -- it\'s a real, silent failure mode to watch for.','This applies to any pretrained model, not just translation -- the tokenizer/model pairing matters universally.'] },
    { id:'hf-fine-tune-vs-zero-shot', mode:'choice', title:'Zero-shot vs. fine-tuning: a real cost decision',
      explain:'Many Hugging Face models support zero-shot classification (no training needed, just describe your categories) as an alternative to fine-tuning on your own labeled data.',
      scenario:'You need to classify support tickets into 5 categories, but have no labeled training data yet and need something working THIS WEEK. What\'s the pragmatic first step?',
      choices:['Immediately start collecting and labeling thousands of examples before building anything', 'Try zero-shot classification first to get something working now, and consider fine-tuning later once you have real labeled data and know if the zero-shot accuracy needs improving', 'Zero-shot classification never works well enough to be useful', 'Wait until you have a large labeled dataset before doing anything at all'],
      correct:1,
      feedback:['This is the slower path when you have a real time constraint -- data collection/labeling for fine-tuning takes real time you may not have this week.','Correct -- zero-shot lets you ship something working immediately, and gives you a real baseline to decide whether fine-tuning is even necessary once you see actual performance and start accumulating real labeled data.','Zero-shot classification is often surprisingly effective, especially for a reasonable starting baseline -- dismissing it entirely isn\'t accurate.','This ignores the real time constraint stated in the scenario -- there\'s a pragmatic path to a working solution now.'] },
    { id:'hf-peft-strategy-selector', mode:'sim', title:'PEFT Strategy Selector',
      explain:'Given a fixed scenario, decide between full fine-tuning, LoRA, and QLoRA -- there is no universally correct choice; the right one depends on the specific constraints given.',
      render: function(){
        return '<div class="card">'
          + '<label for="hfPeftScenario" style="display:block;font-size:.85rem;margin-bottom:6px">Scenario:</label>'
          + '<select id="hfPeftScenario" class="api-method-select" style="max-width:100%;width:100%" data-change="hfPeftCheck()">'
            + '<option value="full">7B model, 40GB GPU memory, 50,000 examples</option>'
            + '<option value="lora">7B model, 24GB GPU memory, 5,000 examples</option>'
            + '<option value="qlora">13B model, 12GB GPU memory, 5,000 examples</option>'
            + '<option value="frozen">7B model, adequate memory, but base weights may not be modified</option>'
          + '</select>'
          + '<div id="hfPeftOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'hf-dataset-inspector', mode:'sim', title:'Fine-Tuning Dataset Inspector',
      explain:'Inspect a fixed conversational training example and identify exactly why it is valid or problematic.',
      render: function(){
        return '<div class="card">'
          + '<label for="hfDatasetExample" style="display:block;font-size:.85rem;margin-bottom:6px">Example:</label>'
          + '<select id="hfDatasetExample" class="api-method-select" style="max-width:100%;width:100%" data-change="hfDatasetCheck()">'
            + '<option value="valid">user: "What is 2+2?" -&gt; assistant: "4"</option>'
            + '<option value="missing_response">user: "What is 2+2?" (no assistant response)</option>'
            + '<option value="invalid_roles">user: "a" -&gt; user: "b" -&gt; assistant: "c"</option>'
            + '<option value="duplicate">Identical to the valid example above, submitted twice</option>'
            + '<option value="leakage">user: "The answer is 4. What is 2+2?" -&gt; assistant: "The answer is 4."</option>'
          + '</select>'
          + '<div id="hfDatasetOutput" role="status" aria-live="polite" style="margin-top:14px;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }},
    { id:'hf-lora-config-simulator', mode:'sim', title:'LoRA Configuration Simulator',
      explain:'Adjust conceptual LoRA settings and see illustrative, clearly-labeled estimates -- these do not predict real training quality.',
      render: function(){
        return '<div class="card">'
          + '<label for="hfLoraRank" style="display:block;font-size:.85rem">Rank: <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="hfLoraRank" value="16" data-input="hfLoraUpdate()"></label>'
          + '<label for="hfLoraAlpha" style="display:block;font-size:.85rem;margin-top:8px">Alpha: <input type="number" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="hfLoraAlpha" value="32" data-input="hfLoraUpdate()"></label>'
          + '<label for="hfLoraDropout" style="display:block;font-size:.85rem;margin-top:8px">Dropout: <input type="number" step="0.05" class="wd-edit" style="width:100px;display:inline-block;min-height:0;padding:4px 8px" id="hfLoraDropout" value="0.05" data-input="hfLoraUpdate()"></label>'
          + '<label for="hfLoraScope" style="display:block;font-size:.85rem;margin-top:8px">Target modules:</label>'
          + '<select id="hfLoraScope" class="api-method-select" style="max-width:100%;width:100%" data-change="hfLoraUpdate()">'
            + '<option value="attention_only">Attention layers only</option>'
            + '<option value="attention_and_mlp">Attention and MLP layers</option>'
            + '<option value="all_linear">All linear layers</option>'
          + '</select>'
          + '<div id="hfLoraOutput" role="status" aria-live="polite" style="margin-top:14px;font-family:ui-monospace,monospace;font-size:.85rem;white-space:pre-wrap"></div>'
          + '</div>';
      }}
  ];

  function hfKey(id, field){ return 'hftrack:'+id+':'+field; }
  function hfSave(id, field, val){ try{ localStorage.setItem(hfKey(id,field), val); }catch(e){} }
  function hfLoad(id, field, fallback){ try{ var v=localStorage.getItem(hfKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function hfDoneKey(id){ return 'hftrack:'+id+':done'; }
  function hfIsDone(id){ try{ return localStorage.getItem(hfDoneKey(id))==='1'; }catch(e){ return false; } }
  function hfEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var hfCurIdx = 0;
  window.hfOpen = function(idx){ hfCurIdx = idx; renderHfNav(); renderHfLesson(); window.scrollTo(0,0); };
  window.hfNext = function(){ if(hfCurIdx < HF_LESSONS.length-1) window.hfOpen(hfCurIdx+1); };
  window.hfPrev = function(){ if(hfCurIdx > 0) window.hfOpen(hfCurIdx-1); };
  window.hfMarkDone = function(idx){ try{ localStorage.setItem(hfDoneKey(HF_LESSONS[idx].id), '1'); }catch(e){} renderHfNav(); };

  function renderHfNav(){
    var nav = document.getElementById('hfLessonNav'); if(!nav) return;
    nav.innerHTML = HF_LESSONS.map(function(l, i){
      var done = hfIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===hfCurIdx?'active':'')+'" data-act="hfOpen('+i+')">'+(i+1)+'. '+hfEsc(l.title)+done+'</button>';
    }).join('');
  }
  function hfNavRow(){
    return '<div class="wd-navrow">'
      + (hfCurIdx>0 ? '<button class="wd-btn-ghost" data-act="hfPrev()">&larr; Previous</button>' : '<span></span>')
      + (hfCurIdx<HF_LESSONS.length-1 ? '<button class="wd-btn" data-act="hfNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderHfLesson(){
    var body = document.getElementById('hfLessonBody'); if(!body) return;
    var l = HF_LESSONS[hfCurIdx];
    if(l.mode === 'sim'){
      body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(hfCurIdx+1)+hfEsc(l.title)+'</h2></div>'
        + trackMentalModel(hfEsc(l.explain))
        + l.render()
        + '<div class="wd-row" style="margin-top:14px"><button class="wd-btn-ghost" data-act="hfMarkDone('+hfCurIdx+')">Mark task done</button></div>'
        + hfNavRow();
      if(l.id==='hf-peft-strategy-selector') hfPeftCheck();
      if(l.id==='hf-dataset-inspector') hfDatasetCheck();
      if(l.id==='hf-lora-config-simulator') hfLoraUpdate();
      return;
    }
    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="hfchoice_'+l.id+'_'+i+'" data-act="hfAnswer(\''+l.id+'\','+i+')">'+hfEsc(c)+'</button>';
      }).join('');
      body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(hfCurIdx+1)+hfEsc(l.title)+'</h2></div>'
        + trackMentalModel(hfEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+hfEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="hffeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="hfMarkDone('+hfCurIdx+')">Mark task done</button></div>'
        + hfNavRow();
      return;
    }
    var savedCode = hfLoad(l.id, 'code', l.starter);
    var idBase = 'hfpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){ return '<button data-act="hfRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>'; }).join('') + '<button data-act="hfRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){ return '<div class="wd-hintbox" id="hfhint_'+l.id+'_'+(i+1)+'">'+hfEsc(h)+'</div>'; }).join('') + '<div class="wd-hintbox" id="hfhint_'+l.id+'_99"><b>Solution:</b><pre>'+hfEsc(l.solution)+'</pre></div>';
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(hfCurIdx+1)+hfEsc(l.title)+'</h2></div>'
      + trackMentalModel(hfEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:140px">'+hfEsc(savedCode)+'</textarea>')
      + '<div class="wd-row"><button class="wd-btn" data-act="hfRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
      + '<button class="wd-btn-ghost" data-act="hfReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
      + '<button class="wd-btn-ghost" data-act="hfMarkDone('+hfCurIdx+')">Mark task done</button></div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes + hfNavRow();
  }
  window.hfReset = function(lessonId, editId){
    var l = HF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var ta = document.getElementById(editId); if(ta) ta.value = l.starter;
    hfSave(lessonId, 'code', l.starter);
  };
  window.hfRevealHint = function(lessonId, tier){
    var l = HF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){ var el = document.getElementById('hfhint_'+lessonId+'_'+t); if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier)); });
  };
  window.hfAnswer = function(lessonId, choiceIdx){
    var l = HF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('hfchoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('hffeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  window.hfRunTests = async function(lessonId, editId, outId, statusId){
    var l = HF_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    hfSave(lessonId, 'code', code);
    var out = document.getElementById(outId); if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py; try{ py = await getPy(statusId); } catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }
    var harnessLines = ['_hf_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push('try:\n    _r = '+l.funcName+'('+t.argsRepr+')\n    _exp = ('+t.expectedRepr+')\n    _ok = (_r == _exp)\n    _hf_results.append(("'+i+'", _ok, repr(_r)))\nexcept Exception as _e:\n    _hf_results.append(("'+i+'", False, "Error: " + str(_e)))');
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _hf_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';
    try{
      py.globals.set('_SRC', fullSrc); py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT'); var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){ var parts = ln.split('|'); return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+hfEsc(parts[3])+'</span></div>'; }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>'; }
  };
  // ---- New deterministic task 1: PEFT Strategy Selector ----
  window.hfPeftCheck = function(){
    var scenario = document.getElementById('hfPeftScenario').value;
    var out = document.getElementById('hfPeftOutput');
    var result;
    if(scenario === 'frozen'){
      result = ['Recommendation: LoRA', 'Why: base weights cannot be modified here, so an adapter-based approach (LoRA) is required rather than full fine-tuning, which would need to modify the base weights directly.'];
    } else if(scenario === 'qlora'){
      result = ['Recommendation: QLoRA', 'Why: a large model (13B) with limited GPU memory (12GB) is unlikely to fit full fine-tuning or even standard LoRA training comfortably -- quantizing the frozen base model during training makes this fit.'];
    } else if(scenario === 'full'){
      result = ['Recommendation: full fine-tuning', 'Why: ample GPU memory (40GB) and a large dataset (50,000 examples) both support full fine-tuning, which can be justified when resources and data both allow it.'];
    } else {
      result = ['Recommendation: LoRA', 'Why: moderate memory (24GB) and a smaller dataset (5,000 examples) favor LoRA -- efficient, and less prone to overfitting on limited data than full fine-tuning.'];
    }
    result.push('', 'Note: this is not a universal ranking -- a different scenario could favor a different approach.');
    out.textContent = result.join('\n');
  };

  // ---- New deterministic task 2: Fine-Tuning Dataset Inspector ----
  window.hfDatasetCheck = function(){
    var example = document.getElementById('hfDatasetExample').value;
    var out = document.getElementById('hfDatasetOutput');
    var explanations = {
      valid: 'VALID -- ends with an assistant response, has a correct user/assistant role sequence, and the answer is not leaked into the prompt.',
      missing_response: 'INVALID: missing assistant response -- the example does not end with an assistant turn, so there is nothing for the model to learn to predict.',
      invalid_roles: 'INVALID: invalid role sequence -- two consecutive turns from the same role (user, user) before the assistant responds.',
      duplicate: 'INVALID: duplicate training example -- identical to another example already in the dataset, adding no new signal.',
      leakage: 'INVALID: response leakage -- the expected answer already appears verbatim in the prompt, so the model would not actually need to learn anything to "solve" this example.'
    };
    out.textContent = explanations[example];
  };

  // ---- New deterministic task 3: LoRA Configuration Simulator ----
  window.hfLoraUpdate = function(){
    var rank = Number(document.getElementById('hfLoraRank').value) || 1;
    var alpha = Number(document.getElementById('hfLoraAlpha').value) || 1;
    var dropout = Number(document.getElementById('hfLoraDropout').value) || 0;
    var scope = document.getElementById('hfLoraScope').value;
    var scopeMultiplier = {attention_only:1, attention_and_mlp:3, all_linear:5}[scope];
    var trainableLevel = rank * scopeMultiplier;
    var memoryLevel = Math.round(trainableLevel * 0.4 * 10) / 10;
    var capacity = trainableLevel < 20 ? 'low' : (trainableLevel < 80 ? 'medium' : 'high');
    var overfittingRisk = (rank > 32 && dropout < 0.05) ? 'elevated' : 'normal';
    var scalingFactor = rank > 0 ? Math.round((alpha/rank)*100)/100 : 0;
    var lines = [
      '[Illustrative / conceptual estimates -- these do NOT predict real training quality or real GPU memory usage]',
      'Relative trainable-parameter level: '+trainableLevel,
      'Relative memory requirement: '+memoryLevel,
      'Adapter capacity: '+capacity,
      'Overfitting-risk warning: '+overfittingRisk,
      'Alpha/rank scaling factor: '+scalingFactor
    ];
    document.getElementById('hfLoraOutput').textContent = lines.join('\n');
  };

  var hfBooted = false;
  window._hfBoot = function(){ if(hfBooted) return; hfBooted = true; window.hfOpen(0); };
})();
