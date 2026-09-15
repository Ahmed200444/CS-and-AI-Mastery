
(function(){
  // Reuses the shared Python runner (runEditor/getPy/RUN_HARNESS) exactly like
  // the Data Science track -- no new Python execution path. Kept to plain
  // Python/lists (no sklearn) so nothing here depends on a heavy package load.

  var AIML_LESSONS = [
    { id:'aiml-metrics', title:'Precision, recall & accuracy by hand',
      explain:'Given a confusion matrix (true positives, false positives, false negatives, true negatives), you can compute every common classification metric directly with arithmetic -- no library needed to understand what they mean.',
      starter:'tp, fp, fn, tn = 18, 6, 2, 74\n\n# TODO: print precision (tp/(tp+fp)), recall (tp/(tp+fn)),\n# and accuracy ((tp+tn)/(tp+fp+fn+tn)), each rounded to 2 decimals\n',
      solution:'tp, fp, fn, tn = 18, 6, 2, 74\nprecision = tp / (tp + fp)\nrecall = tp / (tp + fn)\naccuracy = (tp + tn) / (tp + fp + fn + tn)\nprint(round(precision, 2))\nprint(round(recall, 2))\nprint(round(accuracy, 2))',
      hints:['Precision asks: of everything predicted positive, how much was actually positive?','Recall asks: of everything actually positive, how much did we catch?','precision = tp/(tp+fp); recall = tp/(tp+fn); accuracy = (tp+tn)/(tp+fp+fn+tn)'] },
    { id:'aiml-preprocessing', title:'Normalizing features',
      explain:'Many models perform better when features are on a similar scale. Min-max normalization rescales values into a fixed range (commonly 0 to 1) using (x - min) / (max - min).',
      starter:'values = [12, 45, 7, 100, 33]\n\n# TODO: print each value min-max normalized to the range 0-1\n',
      solution:'values = [12, 45, 7, 100, 33]\nlo, hi = min(values), max(values)\nnormalized = [(v - lo) / (hi - lo) for v in values]\nprint(normalized)',
      hints:['You need the min and max of the whole list first.','Each value becomes (value - min) / (max - min).','lo, hi = min(values), max(values)\\nprint([(v-lo)/(hi-lo) for v in values])'] },
    { id:'aiml-split', title:'Train/test split',
      explain:'Splitting data into a training set and a held-out test set lets you check whether a model generalizes to data it never saw, rather than just memorizing what it was trained on.',
      starter:'data = list(range(1, 21))  # 20 data points\n\n# TODO: split into the first 80% as train, last 20% as test, and print both lengths\n',
      solution:'data = list(range(1, 21))\nsplit_point = int(len(data) * 0.8)\ntrain = data[:split_point]\ntest = data[split_point:]\nprint(len(train), len(test))',
      hints:['80% of 20 items is 16 -- compute that as an integer.','List slicing data[:n] and data[n:] splits at index n.','split_point = int(len(data) * 0.8)\\ntrain, test = data[:split_point], data[split_point:]\\nprint(len(train), len(test))'] },
    { id:'aiml-regression', title:'Simple linear regression by hand',
      explain:'Linear regression fits a line y = m*x + b through data points. For two points, the slope m and intercept b can be computed directly -- this is the same idea real regression libraries scale up.',
      starter:'x1, y1 = 1, 3\nx2, y2 = 4, 12\n\n# TODO: compute slope m = (y2-y1)/(x2-x1) and intercept b = y1 - m*x1,\n# then predict y when x=10 using y = m*x + b\n',
      solution:'x1, y1 = 1, 3\nx2, y2 = 4, 12\nm = (y2 - y1) / (x2 - x1)\nb = y1 - m * x1\nprediction = m * 10 + b\nprint(m, b, prediction)',
      hints:['Slope is "rise over run": change in y divided by change in x.','Once you have the slope, intercept comes from plugging one known point back in.','m = (y2-y1)/(x2-x1); b = y1 - m*x1; print(m*10+b)'] },
    { id:'aiml-classification', title:'A simple threshold classifier',
      explain:'The simplest possible classifier: pick a threshold, and classify anything above it as one class, below as another. Real classifiers are more sophisticated, but this is the same underlying decision shape.',
      starter:'scores = [0.2, 0.9, 0.5, 0.51, 0.49, 0.8]\nthreshold = 0.5\n\n# TODO: print a list of "positive"/"negative" labels for each score,\n# using the threshold (>= threshold is "positive")\n',
      solution:'scores = [0.2, 0.9, 0.5, 0.51, 0.49, 0.8]\nthreshold = 0.5\nlabels = ["positive" if s >= threshold else "negative" for s in scores]\nprint(labels)',
      hints:['A list comprehension can apply the same if/else check to every score.','"positive" if s >= threshold else "negative" is the per-item decision.','print(["positive" if s >= threshold else "negative" for s in scores])'] },
    { id:'aiml-overfitting', title:'Diagnosing overfitting from accuracy numbers',
      explain:'If training accuracy is much higher than test accuracy, the model has likely memorized the training data rather than learning patterns that generalize -- that gap itself is the diagnostic signal.',
      starter:'train_accuracy = 0.99\ntest_accuracy = 0.71\n\n# TODO: print the gap between them, and print "overfitting" if the gap\n# is greater than 0.15, otherwise print "looks fine"\n',
      solution:'train_accuracy = 0.99\ntest_accuracy = 0.71\ngap = train_accuracy - test_accuracy\nprint(round(gap, 2))\nprint("overfitting" if gap > 0.15 else "looks fine")',
      hints:['The gap is just train accuracy minus test accuracy.','A large gap (here: 0.28) is a strong overfitting signal.','gap = train_accuracy - test_accuracy\\nprint(gap)\\nprint("overfitting" if gap > 0.15 else "looks fine")'] }
  ];

  function aimlKey(id, field){ return 'aimltrack:'+id+':'+field; }
  function aimlSave(id, field, val){ try{ localStorage.setItem(aimlKey(id,field), val); }catch(e){} }
  function aimlLoad(id, field, fallback){ try{ var v=localStorage.getItem(aimlKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function aimlDoneKey(id){ return 'aimltrack:'+id+':done'; }
  function aimlIsDone(id){ try{ return localStorage.getItem(aimlDoneKey(id))==='1'; }catch(e){ return false; } }
  function aimlEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var aimlCurIdx = 0;

  window.aimlOpen = function(idx){
    aimlCurIdx = idx;
    renderAimlNav();
    renderAimlLesson();
    window.scrollTo(0,0);
  };
  window.aimlNext = function(){ if(aimlCurIdx < AIML_LESSONS.length-1) window.aimlOpen(aimlCurIdx+1); };
  window.aimlPrev = function(){ if(aimlCurIdx > 0) window.aimlOpen(aimlCurIdx-1); };
  window.aimlMarkDone = function(idx){
    try{ localStorage.setItem(aimlDoneKey(AIML_LESSONS[idx].id), '1'); }catch(e){}
    renderAimlNav();
  };

  function renderAimlNav(){
    var nav = document.getElementById('aimlLessonNav');
    if(!nav) return;
    nav.innerHTML = AIML_LESSONS.map(function(l, i){
      var done = aimlIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===aimlCurIdx?'active':'')+'" data-act="aimlOpen('+i+')">'+(i+1)+'. '+aimlEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderAimlLesson(){
    var body = document.getElementById('aimlLessonBody');
    if(!body) return;
    var l = AIML_LESSONS[aimlCurIdx];
    var savedCode = aimlLoad(l.id, 'code', l.starter);
    var idBase = 'aimlpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="aimlRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="aimlRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="aimlhint_'+l.id+'_'+(i+1)+'">'+aimlEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="aimlhint_'+l.id+'_99"><b>Solution:</b><pre>'+aimlEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(aimlCurIdx+1)+aimlEsc(l.title)+'</h2></div>'
      + trackMentalModel(aimlEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:110px">'+aimlEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="aimlRun(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run</button>'
        + '<button class="wd-btn-ghost" data-act="aimlReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="aimlMarkDone('+aimlCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + '<div class="wd-navrow">'
        + (aimlCurIdx>0 ? '<button class="wd-btn-ghost" data-act="aimlPrev()">&larr; Previous</button>' : '<span></span>')
        + (aimlCurIdx<AIML_LESSONS.length-1 ? '<button class="wd-btn" data-act="aimlNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  // Delegates to the shared global runEditor() -- no new Python runtime.
  window.aimlRun = function(lessonId, editId, outId, statusId){
    var ta = document.getElementById(editId);
    if(ta) aimlSave(lessonId, 'code', ta.value);
    if(typeof runEditor === 'function') runEditor(editId, outId, statusId);
  };

  window.aimlReset = function(lessonId, editId){
    var l = AIML_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    aimlSave(lessonId, 'code', l.starter);
  };

  window.aimlRevealHint = function(lessonId, tier){
    var l = AIML_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('aimlhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  var aimlBooted = false;
  window._aimlBoot = function(){
    if(aimlBooted) return;
    aimlBooted = true;
    window.aimlOpen(0);
  };
})();
