
(function(){
  var NLP_LESSONS = [
    { id:'nlp-tokenize', mode:'test', title:'Basic tokenization', funcName:'tokenize',
      explain:'Before any NLP model can process text, it must be split into tokens (words/numbers), with punctuation and casing normalized away.',
      starter:'import re\n\ndef tokenize(text):\n    # TODO: lowercase text, then return all sequences of letters/digits\n    # as a list (hint: re.findall(r\'[a-z0-9]+\', ...))\n    pass',
      solution:'import re\n\ndef tokenize(text):\n    return re.findall(r"[a-z0-9]+", text.lower())',
      hints:['Lowercase the text first so casing doesn\'t create duplicate tokens.','re.findall with a character-class pattern extracts all matching runs as a list.','return re.findall(r"[a-z0-9]+", text.lower())'],
      tests:[
        {argsRepr:'"Hello, World! This is NLP."', expectedRepr:"['hello', 'world', 'this', 'is', 'nlp']"}
      ]},
    { id:'nlp-word-freq', mode:'test', title:'Word frequency counting', funcName:'word_frequency',
      explain:'Word frequency is the foundation of bag-of-words models -- simply counting how often each token appears.',
      starter:'def word_frequency(tokens):\n    # TODO: return a dict mapping each token to how many times it appears\n    pass',
      solution:'def word_frequency(tokens):\n    freq = {}\n    for t in tokens:\n        freq[t] = freq.get(t, 0) + 1\n    return freq',
      hints:['Loop through tokens, incrementing a counter for each one.','dict.get(key, 0) gives you 0 for a token you haven\'t seen yet, avoiding a KeyError.','freq[t] = freq.get(t, 0) + 1'],
      tests:[
        {argsRepr:"['cat','dog','cat','cat']", expectedRepr:"{'cat': 3, 'dog': 1}"}
      ]},
    { id:'nlp-stopwords', mode:'test', title:'Removing stopwords', funcName:'remove_stopwords',
      explain:'Stopwords (like "the", "on", "a") carry little meaning on their own and are often filtered out before further analysis.',
      starter:'def remove_stopwords(tokens, stopwords):\n    # TODO: return tokens with any token that\'s in the stopwords set removed\n    pass',
      solution:'def remove_stopwords(tokens, stopwords):\n    return [t for t in tokens if t not in stopwords]',
      hints:['A list comprehension with a filtering condition does this in one line.','Keep a token only if it is NOT in the stopwords set.','return [t for t in tokens if t not in stopwords]'],
      tests:[
        {argsRepr:"['the','cat','sat','on','the','mat'], {'the','on'}", expectedRepr:"['cat', 'sat', 'mat']"}
      ]},
    { id:'nlp-stem-lemma', mode:'choice', title:'Stemming vs. lemmatization',
      explain:'Both reduce words to a base form, but through very different means -- one is crude and fast, the other linguistically informed.',
      scenario:'Stemming might reduce "better" to "bet" (chopping suffixes by simple rules), while lemmatization correctly reduces "better" to "good" (its true dictionary root). When does the difference matter most?',
      choices:['Never -- they always produce the same result', 'When the crude, rule-based stemming produces a form that isn\'t even a real word or loses the correct meaning, hurting downstream tasks that rely on meaning', 'Only for very short words', 'Lemmatization is always worse because it\'s slower'],
      correct:1,
      feedback:['This example shows exactly a case where they diverge -- "bet" and "good" are very different results.','Correct -- stemming\'s speed comes at the cost of sometimes producing meaningless or misleading roots, which matters especially for tasks sensitive to actual word meaning.','Word length isn\'t the deciding factor -- irregular words like "better" are exactly where the two methods diverge most.','Lemmatization IS typically slower (it needs a real dictionary/vocabulary lookup), but "slower" doesn\'t mean "worse" -- the trade-off is speed vs. linguistic accuracy, task-dependent.'] },
    { id:'nlp-embeddings', mode:'choice', title:'Why word embeddings capture meaning',
      explain:'Unlike a simple word-frequency count, embeddings represent words as vectors positioned so that similar words end up close together in that space.',
      scenario:'In a good embedding space, the vectors for "king" and "queen" are close together, and "king" minus "man" plus "woman" lands near "queen". What does this demonstrate?',
      choices:['This is a coincidence with no real meaning', 'Embeddings capture semantic relationships as geometric ones -- meaning becomes something you can literally do arithmetic on', 'This only works for royalty-related words', 'Embeddings just memorize a lookup table of exact word pairs'],
      correct:1,
      feedback:['This is a well-documented, repeatable property of good embedding spaces, not a coincidence -- it\'s exactly the kind of result researchers use to demonstrate embedding quality.','Correct -- this is the defining property of a good embedding space: relationships between concepts (like gender or royalty) become consistent geometric directions, meaning "meaning" becomes something computable.','This same kind of relationship holds for many other word pairs and categories (e.g. country/capital pairs) -- it\'s a general property, not royalty-specific.','Embeddings are trained to capture co-occurrence patterns across huge amounts of text -- they generalize far beyond any fixed lookup table.'] },
    { id:'nlp-bag-of-words-limit', mode:'choice', title:'A real limitation of bag-of-words',
      explain:'Bag-of-words represents text purely by word counts, discarding word ORDER entirely.',
      scenario:'"The movie was not good, it was boring" and a hypothetical scrambled version with the same words in different order would produce IDENTICAL bag-of-words vectors. What does this reveal about the technique?',
      choices:['Nothing -- word order never matters for meaning', 'Bag-of-words cannot distinguish meaning that depends on word order or structure (like negation placement), a real limitation', 'This is actually a feature, not a limitation', 'This only affects very long sentences'],
      correct:1,
      feedback:['Word order absolutely matters for meaning in many cases -- negation, sarcasm, and grammatical structure all depend on it.','Correct -- this is a genuine, well-known limitation: bag-of-words treats "not good" and a scrambled version identically, losing information that more advanced techniques (n-grams, sequence models) can capture.','Losing meaningful information is a real limitation, not a feature -- it\'s a known trade-off made for simplicity and speed.','This limitation applies regardless of sentence length -- even short sentences can have order-dependent meaning (e.g. negation).'] }
  ];

  function nlpKey(id, field){ return 'nlptrack:'+id+':'+field; }
  function nlpSave(id, field, val){ try{ localStorage.setItem(nlpKey(id,field), val); }catch(e){} }
  function nlpLoad(id, field, fallback){ try{ var v=localStorage.getItem(nlpKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function nlpDoneKey(id){ return 'nlptrack:'+id+':done'; }
  function nlpIsDone(id){ try{ return localStorage.getItem(nlpDoneKey(id))==='1'; }catch(e){ return false; } }
  function nlpEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var nlpCurIdx = 0;
  window.nlpOpen = function(idx){ nlpCurIdx = idx; renderNlpNav(); renderNlpLesson(); window.scrollTo(0,0); };
  window.nlpNext = function(){ if(nlpCurIdx < NLP_LESSONS.length-1) window.nlpOpen(nlpCurIdx+1); };
  window.nlpPrev = function(){ if(nlpCurIdx > 0) window.nlpOpen(nlpCurIdx-1); };
  window.nlpMarkDone = function(idx){ try{ localStorage.setItem(nlpDoneKey(NLP_LESSONS[idx].id), '1'); }catch(e){} renderNlpNav(); };

  function renderNlpNav(){
    var nav = document.getElementById('nlpLessonNav'); if(!nav) return;
    nav.innerHTML = NLP_LESSONS.map(function(l, i){
      var done = nlpIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===nlpCurIdx?'active':'')+'" data-act="nlpOpen('+i+')">'+(i+1)+'. '+nlpEsc(l.title)+done+'</button>';
    }).join('');
  }
  function nlpNavRow(){
    return '<div class="wd-navrow">'
      + (nlpCurIdx>0 ? '<button class="wd-btn-ghost" data-act="nlpPrev()">&larr; Previous</button>' : '<span></span>')
      + (nlpCurIdx<NLP_LESSONS.length-1 ? '<button class="wd-btn" data-act="nlpNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderNlpLesson(){
    var body = document.getElementById('nlpLessonBody'); if(!body) return;
    var l = NLP_LESSONS[nlpCurIdx];
    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="nlpchoice_'+l.id+'_'+i+'" data-act="nlpAnswer(\''+l.id+'\','+i+')">'+nlpEsc(c)+'</button>';
      }).join('');
      body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(nlpCurIdx+1)+nlpEsc(l.title)+'</h2></div>'
        + trackMentalModel(nlpEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+nlpEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="nlpfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="nlpMarkDone('+nlpCurIdx+')">Mark task done</button></div>'
        + nlpNavRow();
      return;
    }
    var savedCode = nlpLoad(l.id, 'code', l.starter);
    var idBase = 'nlppm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){ return '<button data-act="nlpRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>'; }).join('') + '<button data-act="nlpRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){ return '<div class="wd-hintbox" id="nlphint_'+l.id+'_'+(i+1)+'">'+nlpEsc(h)+'</div>'; }).join('') + '<div class="wd-hintbox" id="nlphint_'+l.id+'_99"><b>Solution:</b><pre>'+nlpEsc(l.solution)+'</pre></div>';
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(nlpCurIdx+1)+nlpEsc(l.title)+'</h2></div>'
      + trackMentalModel(nlpEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:110px">'+nlpEsc(savedCode)+'</textarea>')
      + '<div class="wd-row"><button class="wd-btn" data-act="nlpRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
      + '<button class="wd-btn-ghost" data-act="nlpReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
      + '<button class="wd-btn-ghost" data-act="nlpMarkDone('+nlpCurIdx+')">Mark task done</button></div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes + nlpNavRow();
  }
  window.nlpReset = function(lessonId, editId){
    var l = NLP_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var ta = document.getElementById(editId); if(ta) ta.value = l.starter;
    nlpSave(lessonId, 'code', l.starter);
  };
  window.nlpRevealHint = function(lessonId, tier){
    var l = NLP_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){ var el = document.getElementById('nlphint_'+lessonId+'_'+t); if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier)); });
  };
  window.nlpAnswer = function(lessonId, choiceIdx){
    var l = NLP_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('nlpchoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('nlpfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  window.nlpRunTests = async function(lessonId, editId, outId, statusId){
    var l = NLP_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    nlpSave(lessonId, 'code', code);
    var out = document.getElementById(outId); if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py; try{ py = await getPy(statusId); } catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }
    var harnessLines = ['_nlp_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push('try:\n    _r = '+l.funcName+'('+t.argsRepr+')\n    _exp = ('+t.expectedRepr+')\n    _ok = (_r == _exp)\n    _nlp_results.append(("'+i+'", _ok, repr(_r)))\nexcept Exception as _e:\n    _nlp_results.append(("'+i+'", False, "Error: " + str(_e)))');
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _nlp_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';
    try{
      py.globals.set('_SRC', fullSrc); py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT'); var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){ var parts = ln.split('|'); return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+nlpEsc(parts[3])+'</span></div>'; }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>'; }
  };
  var nlpBooted = false;
  window._nlpBoot = function(){ if(nlpBooted) return; nlpBooted = true; window.nlpOpen(0); };
})();
