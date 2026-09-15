
(function(){
  var CV_LESSONS = [
    { id:'cv-grayscale', mode:'test', title:'Converting a pixel to grayscale', funcName:'grayscale_pixel',
      explain:'Grayscale conversion isn\'t a simple average -- human eyes are more sensitive to green than red or blue, so the standard luminosity formula weights channels differently.',
      starter:'def grayscale_pixel(r, g, b):\n    # TODO: return round(0.299*r + 0.587*g + 0.114*b) -- the standard\n    # luminosity-weighted grayscale formula\n    pass',
      solution:'def grayscale_pixel(r, g, b):\n    return round(0.299*r + 0.587*g + 0.114*b)',
      hints:['This is a weighted sum of the three channels, not a simple average.','Green gets the highest weight (0.587) since human eyes are most sensitive to it.','return round(0.299*r + 0.587*g + 0.114*b)'],
      tests:[
        {argsRepr:'255, 0, 0', expectedRepr:'76'},
        {argsRepr:'0, 255, 0', expectedRepr:'150'}
      ]},
    { id:'cv-brightness', mode:'test', title:'Adjusting brightness with clamping', funcName:'apply_brightness',
      explain:'A pixel value must always stay within the valid 0-255 range -- adjusting brightness without clamping can produce invalid, wrapped-around colors.',
      starter:'def apply_brightness(pixel, delta):\n    # TODO: add delta to pixel, then clamp the result to the range [0, 255]\n    pass',
      solution:'def apply_brightness(pixel, delta):\n    return max(0, min(255, pixel + delta))',
      hints:['Add delta first, then clamp -- clamping before adding would give the wrong result.','max(0, ...) prevents going below 0; min(255, ...) prevents going above 255.','return max(0, min(255, pixel + delta))'],
      tests:[
        {argsRepr:'200, 100', expectedRepr:'255'},
        {argsRepr:'50, -100', expectedRepr:'0'}
      ]},
    { id:'cv-iou', mode:'test', title:'Intersection over Union (object detection)', funcName:'iou',
      explain:'IoU measures how well a predicted bounding box overlaps a real one -- the standard metric for evaluating object detection accuracy.',
      starter:'def iou(box1, box2):\n    # box format: (x1, y1, x2, y2). TODO: compute the intersection\n    # rectangle\'s area, then divide by the union area (sum of both areas\n    # minus the intersection), rounded to 3 decimals. Return 0 if union is 0.\n    pass',
      solution:'def iou(box1, box2):\n    x1 = max(box1[0], box2[0]); y1 = max(box1[1], box2[1])\n    x2 = min(box1[2], box2[2]); y2 = min(box1[3], box2[3])\n    inter = max(0, x2-x1) * max(0, y2-y1)\n    area1 = (box1[2]-box1[0]) * (box1[3]-box1[1])\n    area2 = (box2[2]-box2[0]) * (box2[3]-box2[1])\n    union = area1 + area2 - inter\n    return round(inter/union, 3) if union > 0 else 0',
      hints:['The intersection rectangle\'s corners are the max of the two left/top edges and the min of the two right/bottom edges.','If the boxes don\'t overlap, max(0, ...) keeps the intersection area at 0 instead of going negative.','union = area1 + area2 - inter; return round(inter/union, 3) if union > 0 else 0'],
      tests:[
        {argsRepr:'(0,0,10,10), (5,5,15,15)', expectedRepr:'0.143'},
        {argsRepr:'(0,0,10,10), (20,20,30,30)', expectedRepr:'0'}
      ]},
    { id:'cv-cnn-vs-dense', mode:'choice', title:'Why CNNs, not plain dense networks, for images',
      explain:'A plain fully-connected network treats every pixel as independent, ignoring spatial structure entirely.',
      scenario:'A 224x224 color image has over 150,000 input values. A CNN uses small, shared convolutional filters instead of connecting every pixel to every neuron. Why does this matter?',
      choices:['It doesn\'t -- dense networks work identically well on images', 'Shared filters exploit spatial locality (nearby pixels are related) and drastically reduce the number of parameters needed', 'CNNs are just an older, obsolete technique', 'It only matters for black-and-white images'],
      correct:1,
      feedback:['Dense networks ignore spatial structure entirely and would need an enormous number of parameters, generalizing far worse on images.','Correct -- convolutional filters are applied across the whole image, so nearby-pixel patterns (edges, textures) are learned once and reused everywhere, not re-learned per pixel-position.','CNNs remain foundational and widely used, including inside many modern architectures.','This applies equally to color images -- the parameter-sharing benefit doesn\'t depend on channel count.'] },
    { id:'cv-augmentation', mode:'choice', title:'What data augmentation actually helps with',
      explain:'Data augmentation creates modified copies of training images (rotated, flipped, cropped) without collecting any new real data.',
      scenario:'A model trained only on photos of cats facing left performs poorly on photos of cats facing right. What\'s the most direct fix?',
      choices:['Collect thousands of new photos of cats facing right', 'Augment the existing training data with horizontally flipped copies', 'Increase the learning rate', 'This can\'t be fixed without a completely different model architecture'],
      correct:1,
      feedback:['This would work, but it\'s far more expensive than a fix already available from the data you have.','Correct -- horizontally flipping existing images is a free, direct way to teach the model both orientations without collecting anything new.','Learning rate affects training dynamics, not what visual variations the model has actually seen examples of.','This is a data problem, well-addressed by augmentation -- not something requiring a different architecture.'] },
    { id:'cv-overfitting-signal', mode:'choice', title:'Recognizing overfitting from training curves',
      explain:'A model that "memorizes" training images performs well on data it has seen, but poorly on new images -- a distinct, recognizable pattern.',
      scenario:'Training accuracy is 99%, but validation accuracy (on images the model never trained on) is stuck at 65% and getting worse over time. What does this indicate?',
      choices:['The model is underfitting and needs to train longer', 'The model is overfitting -- memorizing training images rather than learning generalizable features', 'This is normal and requires no action', 'The learning rate is too low'],
      correct:1,
      feedback:['Underfitting looks the opposite: BOTH training and validation accuracy would be low -- that\'s not what\'s described here.','Correct -- a large, growing gap between high training accuracy and low/declining validation accuracy is the classic signature of overfitting.','A worsening validation trend alongside high training accuracy is a real problem worth addressing (more data, augmentation, regularization, early stopping).','A too-low learning rate typically shows slow improvement on BOTH metrics, not this specific train/validation gap pattern.'] }
  ];

  function cvKey(id, field){ return 'cvtrack:'+id+':'+field; }
  function cvSave(id, field, val){ try{ localStorage.setItem(cvKey(id,field), val); }catch(e){} }
  function cvLoad(id, field, fallback){ try{ var v=localStorage.getItem(cvKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function cvDoneKey(id){ return 'cvtrack:'+id+':done'; }
  function cvIsDone(id){ try{ return localStorage.getItem(cvDoneKey(id))==='1'; }catch(e){ return false; } }
  function cvEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var cvCurIdx = 0;
  window.cvOpen = function(idx){ cvCurIdx = idx; renderCvNav(); renderCvLesson(); window.scrollTo(0,0); };
  window.cvNext = function(){ if(cvCurIdx < CV_LESSONS.length-1) window.cvOpen(cvCurIdx+1); };
  window.cvPrev = function(){ if(cvCurIdx > 0) window.cvOpen(cvCurIdx-1); };
  window.cvMarkDone = function(idx){ try{ localStorage.setItem(cvDoneKey(CV_LESSONS[idx].id), '1'); }catch(e){} renderCvNav(); };

  function renderCvNav(){
    var nav = document.getElementById('cvLessonNav');
    if(!nav) return;
    nav.innerHTML = CV_LESSONS.map(function(l, i){
      var done = cvIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===cvCurIdx?'active':'')+'" data-act="cvOpen('+i+')">'+(i+1)+'. '+cvEsc(l.title)+done+'</button>';
    }).join('');
  }
  function cvNavRow(){
    return '<div class="wd-navrow">'
      + (cvCurIdx>0 ? '<button class="wd-btn-ghost" data-act="cvPrev()">&larr; Previous</button>' : '<span></span>')
      + (cvCurIdx<CV_LESSONS.length-1 ? '<button class="wd-btn" data-act="cvNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderCvLesson(){
    var body = document.getElementById('cvLessonBody');
    if(!body) return;
    var l = CV_LESSONS[cvCurIdx];
    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="cvchoice_'+l.id+'_'+i+'" data-act="cvAnswer(\''+l.id+'\','+i+')">'+cvEsc(c)+'</button>';
      }).join('');
      body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(cvCurIdx+1)+cvEsc(l.title)+'</h2></div>'
        + trackMentalModel(cvEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+cvEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="cvfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="cvMarkDone('+cvCurIdx+')">Mark task done</button></div>'
        + cvNavRow();
      return;
    }
    var savedCode = cvLoad(l.id, 'code', l.starter);
    var idBase = 'cvpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){ return '<button data-act="cvRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>'; }).join('') + '<button data-act="cvRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){ return '<div class="wd-hintbox" id="cvhint_'+l.id+'_'+(i+1)+'">'+cvEsc(h)+'</div>'; }).join('') + '<div class="wd-hintbox" id="cvhint_'+l.id+'_99"><b>Solution:</b><pre>'+cvEsc(l.solution)+'</pre></div>';
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(cvCurIdx+1)+cvEsc(l.title)+'</h2></div>'
      + trackMentalModel(cvEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:110px">'+cvEsc(savedCode)+'</textarea>')
      + '<div class="wd-row"><button class="wd-btn" data-act="cvRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
      + '<button class="wd-btn-ghost" data-act="cvReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
      + '<button class="wd-btn-ghost" data-act="cvMarkDone('+cvCurIdx+')">Mark task done</button></div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes + cvNavRow();
  }
  window.cvReset = function(lessonId, editId){
    var l = CV_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var ta = document.getElementById(editId); if(ta) ta.value = l.starter;
    cvSave(lessonId, 'code', l.starter);
  };
  window.cvRevealHint = function(lessonId, tier){
    var l = CV_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){ var el = document.getElementById('cvhint_'+lessonId+'_'+t); if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier)); });
  };
  window.cvAnswer = function(lessonId, choiceIdx){
    var l = CV_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('cvchoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('cvfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  window.cvRunTests = async function(lessonId, editId, outId, statusId){
    var l = CV_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    cvSave(lessonId, 'code', code);
    var out = document.getElementById(outId); if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py; try{ py = await getPy(statusId); } catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }
    var harnessLines = ['_cv_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push('try:\n    _r = '+l.funcName+'('+t.argsRepr+')\n    _exp = ('+t.expectedRepr+')\n    _ok = (abs(_r - _exp) < 1e-6) if isinstance(_r,(int,float)) and isinstance(_exp,(int,float)) and not isinstance(_r,bool) and not isinstance(_exp,bool) else (_r == _exp)\n    _cv_results.append(("'+i+'", _ok, repr(_r)))\nexcept Exception as _e:\n    _cv_results.append(("'+i+'", False, "Error: " + str(_e)))');
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _cv_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';
    try{
      py.globals.set('_SRC', fullSrc); py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT'); var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){ var parts = ln.split('|'); return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+cvEsc(parts[3])+'</span></div>'; }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>'; }
  };
  var cvBooted = false;
  window._cvBoot = function(){ if(cvBooted) return; cvBooted = true; window.cvOpen(0); };
})();
