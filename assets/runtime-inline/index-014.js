
(function(){
  // Reuses the shared Python runner (runEditor/getPy/RUN_HARNESS) exactly like
  // Data Science and AI/ML -- no new Python runtime. Real model TRAINING is
  // out of scope for browser execution (too slow, too heavy) -- the final
  // task is an explicit, labeled Colab guidance card for that part, matching
  // the same "external" pattern used elsewhere on the platform.

  var DL_LESSONS = [
    { id:'dl-neuron', title:'A single neuron by hand',
      explain:'A neuron computes a weighted sum of its inputs plus a bias, then applies an activation function. Compute this step by step with plain numbers before ever touching a framework.',
      starter:'inputs = [1.0, 2.0, 3.0]\nweights = [0.2, 0.4, -0.1]\nbias = 0.5\n\n# TODO: compute the weighted sum (dot product of inputs and weights) plus bias\n',
      solution:'inputs = [1.0, 2.0, 3.0]\nweights = [0.2, 0.4, -0.1]\nbias = 0.5\nweighted_sum = sum(i*w for i, w in zip(inputs, weights)) + bias\nprint(weighted_sum)',
      hints:['A weighted sum multiplies each input by its matching weight, then adds them all up.','zip(inputs, weights) pairs them up so you can multiply corresponding elements.','sum(i*w for i,w in zip(inputs, weights)) + bias'] },
    { id:'dl-activation', title:'Activation functions',
      explain:'An activation function introduces non-linearity. ReLU is the simplest common one: it outputs the input unchanged if positive, and 0 otherwise.',
      starter:'values = [-2.5, -0.1, 0, 1.2, 4.0]\n\n# TODO: print the ReLU of each value (max(0, x))\n',
      solution:'values = [-2.5, -0.1, 0, 1.2, 4.0]\nprint([max(0, x) for x in values])',
      hints:['ReLU is just max(0, x) applied to each value.','A list comprehension applies this to every element at once.','print([max(0, x) for x in values])'] },
    { id:'dl-forward-pass', title:'A tiny forward pass',
      explain:'A forward pass chains neurons together: the output of one layer becomes the input to the next. Compute a 2-neuron hidden layer, then a single output neuron reading from both.',
      starter:'x = [1.0, 0.5]\n\n# Hidden layer: 2 neurons\nw1 = [0.3, -0.2]  # neuron 1 weights\nw2 = [0.1, 0.4]   # neuron 2 weights\nb1, b2 = 0.1, -0.1\n\n# TODO: compute h1 and h2 (weighted sum + bias, then ReLU),\n# then combine them with output weights wo=[0.5, 0.5] and bias bo=0.2\n# (no activation on the output) and print the final result\n',
      solution:'x = [1.0, 0.5]\nw1 = [0.3, -0.2]\nw2 = [0.1, 0.4]\nb1, b2 = 0.1, -0.1\n\nh1 = max(0, sum(a*b for a,b in zip(x, w1)) + b1)\nh2 = max(0, sum(a*b for a,b in zip(x, w2)) + b2)\n\nwo = [0.5, 0.5]\nbo = 0.2\noutput = h1*wo[0] + h2*wo[1] + bo\nprint(h1, h2, output)',
      hints:['Compute each hidden neuron the same way as the single-neuron task, then apply ReLU (max(0, ...)).','The output neuron reads h1 and h2 as ITS inputs, using wo and bo the same way.','h1 = max(0, sum(a*b for a,b in zip(x,w1))+b1); h2 = max(0, sum(a*b for a,b in zip(x,w2))+b2); output = h1*wo[0]+h2*wo[1]+bo'] },
    { id:'dl-gradient-intuition', title:'Gradient intuition: which way to nudge a weight',
      explain:'Gradient descent nudges each weight in the direction that reduces error. If increasing a weight increases the error, you should decrease that weight (and vice versa) -- this task checks that intuition directly.',
      starter:'# error_if_weight_increases tells you what happens to the loss\n# if this specific weight is nudged UP slightly.\nerror_if_weight_increases = 0.03  # loss went UP when weight went up\n\n# TODO: print "decrease" if increasing the weight increases error,\n# otherwise print "increase"\n',
      solution:'error_if_weight_increases = 0.03\nprint("decrease" if error_if_weight_increases > 0 else "increase")',
      hints:['If nudging the weight up makes the loss WORSE (goes up), gradient descent should move the weight the OPPOSITE way.','A positive error_if_weight_increases value means increasing the weight hurts -- so you should decrease it.','print("decrease" if error_if_weight_increases > 0 else "increase")'] },
    { id:'dl-vanishing-gradient', title:'Spotting a vanishing gradient symptom',
      explain:'When gradients shrink to nearly zero as they propagate backward through many layers, early layers stop learning almost entirely -- weights barely change even after many training steps.',
      starter:'layer1_weight_change = 0.00001\nlayer5_weight_change = 0.15\n\n# TODO: print "vanishing gradient likely" if the earliest layer\n# changed much less than the later layer (say, more than 100x smaller),\n# otherwise print "looks normal"\n',
      solution:'layer1_weight_change = 0.00001\nlayer5_weight_change = 0.15\nratio = layer5_weight_change / layer1_weight_change\nprint("vanishing gradient likely" if ratio > 100 else "looks normal")',
      hints:['Compare the two changes as a ratio, not just by looking at them.','layer5_weight_change / layer1_weight_change tells you how many times bigger the later layer\'s change is.','ratio = layer5_weight_change / layer1_weight_change; print("vanishing gradient likely" if ratio > 100 else "looks normal")'] },
    { id:'dl-colab-training', title:'Real model training (Google Colab)', external:true,
      explain:'Everything above ran real Python logic in your browser. Actually training a real neural network needs a GPU and real data loading -- both impractical in a browser tab. This is where you\'d move to Colab for the first real training run.',
      colabTitle:'Google Colab (free GPU access)',
      colabDesc:'Open a new notebook at colab.research.google.com, set Runtime > Change runtime type > GPU, then paste the starter cell below to begin training a tiny real network on a small dataset.',
      colabSnippet:'!pip install torch torchvision --quiet\nimport torch, torch.nn as nn\nprint("GPU available:", torch.cuda.is_available())\n\nmodel = nn.Sequential(nn.Linear(784, 64), nn.ReLU(), nn.Linear(64, 10))\nprint(model)' }
  ];

  function dlKey(id, field){ return 'dltrack:'+id+':'+field; }
  function dlSave(id, field, val){ try{ localStorage.setItem(dlKey(id,field), val); }catch(e){} }
  function dlLoad(id, field, fallback){ try{ var v=localStorage.getItem(dlKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function dlDoneKey(id){ return 'dltrack:'+id+':done'; }
  function dlIsDone(id){ try{ return localStorage.getItem(dlDoneKey(id))==='1'; }catch(e){ return false; } }
  function dlEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var dlCurIdx = 0;

  window.dlOpen = function(idx){
    dlCurIdx = idx;
    renderDlNav();
    renderDlLesson();
    window.scrollTo(0,0);
  };
  window.dlNext = function(){ if(dlCurIdx < DL_LESSONS.length-1) window.dlOpen(dlCurIdx+1); };
  window.dlPrev = function(){ if(dlCurIdx > 0) window.dlOpen(dlCurIdx-1); };
  window.dlMarkDone = function(idx){
    try{ localStorage.setItem(dlDoneKey(DL_LESSONS[idx].id), '1'); }catch(e){}
    renderDlNav();
  };

  function renderDlNav(){
    var nav = document.getElementById('dlLessonNav');
    if(!nav) return;
    nav.innerHTML = DL_LESSONS.map(function(l, i){
      var done = dlIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===dlCurIdx?'active':'')+'" data-act="dlOpen('+i+')">'+(i+1)+'. '+dlEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderDlLesson(){
    var body = document.getElementById('dlLessonBody');
    if(!body) return;
    var l = DL_LESSONS[dlCurIdx];
    var navRow = '<div class="wd-navrow">'
        + (dlCurIdx>0 ? '<button class="wd-btn-ghost" data-act="dlPrev()">&larr; Previous</button>' : '<span></span>')
        + (dlCurIdx<DL_LESSONS.length-1 ? '<button class="wd-btn" data-act="dlNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';

    if(l.external){
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+(dlCurIdx+1)+'. '+dlEsc(l.title)+'</h2>'
        + '<p class="wd-lesson-explain">'+dlEsc(l.explain)+'</p></div>'
        + '<div class="cx-pm cx-pm-guidance">'
          + '<div class="cx-pm-label"><span class="cx-pm-badge cx-pm-badge-ext">EXTERNAL</span>This part happens outside this platform -- no API key or paid service required.</div>'
          + '<h4 style="margin:4px 0">'+dlEsc(l.colabTitle)+'</h4>'
          + '<p style="margin:4px 0 8px;font-size:.85rem">'+dlEsc(l.colabDesc)+'</p>'
          + '<pre>'+dlEsc(l.colabSnippet)+'</pre>'
        + '</div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="dlMarkDone('+dlCurIdx+')">Mark task done</button></div>'
        + navRow;
      return;
    }

    var savedCode = dlLoad(l.id, 'code', l.starter);
    var idBase = 'dlpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="dlRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="dlRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="dlhint_'+l.id+'_'+(i+1)+'">'+dlEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="dlhint_'+l.id+'_99"><b>Solution:</b><pre>'+dlEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(dlCurIdx+1)+dlEsc(l.title)+'</h2></div>'
      + trackMentalModel(dlEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:120px">'+dlEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="dlRun(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run</button>'
        + '<button class="wd-btn-ghost" data-act="dlReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="dlMarkDone('+dlCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + navRow;
  }

  window.dlRun = function(lessonId, editId, outId, statusId){
    var ta = document.getElementById(editId);
    if(ta) dlSave(lessonId, 'code', ta.value);
    if(typeof runEditor === 'function') runEditor(editId, outId, statusId);
  };

  window.dlReset = function(lessonId, editId){
    var l = DL_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    dlSave(lessonId, 'code', l.starter);
  };

  window.dlRevealHint = function(lessonId, tier){
    var l = DL_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('dlhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  var dlBooted = false;
  window._dlBoot = function(){
    if(dlBooted) return;
    dlBooted = true;
    window.dlOpen(0);
  };
})();
