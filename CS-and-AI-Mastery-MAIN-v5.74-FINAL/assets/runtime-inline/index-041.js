
(function(){
  var K8S_LESSONS = [
    { id:'k8s-basic-deployment', mode:'config', title:'Writing a basic Deployment',
      explain:'A Deployment describes how many copies (replicas) of your app should run, and what container image to use -- Kubernetes keeps that many running automatically.',
      starter:'# TODO: write a Deployment named my-app, running 3 replicas of\n# image my-app:1.0, with the matching selector/template labels\n',
      checks:[
        {re:/kind:\s*Deployment/, label:'Defines a Deployment'},
        {re:/replicas:\s*3/, label:'Specifies 3 replicas'},
        {re:/image:\s*my-app:1\.0/, label:'Uses image my-app:1.0'},
        {re:/matchLabels:[\s\S]*app:\s*my-app/, label:'Selector matches the pod template\'s labels'}
      ],
      hints:['A Deployment needs: kind, metadata.name, spec.replicas, and a pod template.','The selector.matchLabels must match the labels in spec.template.metadata.labels exactly -- this is how the Deployment finds "its" pods.','kind: Deployment\\nmetadata:\\n  name: my-app\\nspec:\\n  replicas: 3\\n  selector:\\n    matchLabels: {app: my-app}\\n  template:\\n    metadata:\\n      labels: {app: my-app}\\n    spec:\\n      containers:\\n      - name: my-app\\n        image: my-app:1.0'],
      solution:'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: my-app\n  template:\n    metadata:\n      labels:\n        app: my-app\n    spec:\n      containers:\n      - name: my-app\n        image: my-app:1.0' },
    { id:'k8s-resource-limits', mode:'config', title:'Setting resource requests and limits',
      explain:'requests tell the scheduler how much a container needs to be placed on a node; limits cap how much it can ever use -- without limits, one misbehaving pod can starve everything else on its node.',
      starter:'# TODO: add resources.requests AND resources.limits (both memory and cpu)\n# to a container spec for my-app:1.0\n',
      checks:[
        {re:/requests:[\s\S]*memory:/, label:'Sets a memory request'},
        {re:/requests:[\s\S]*cpu:/, label:'Sets a CPU request'},
        {re:/limits:[\s\S]*memory:/, label:'Sets a memory limit'},
        {re:/limits:[\s\S]*cpu:/, label:'Sets a CPU limit'}
      ],
      hints:['resources has two sub-keys: requests (minimum needed) and limits (hard cap).','Both memory and cpu should appear under BOTH requests and limits.','resources:\\n  requests:\\n    memory: "256Mi"\\n    cpu: "250m"\\n  limits:\\n    memory: "512Mi"\\n    cpu: "500m"'],
      solution:'containers:\n- name: my-app\n  image: my-app:1.0\n  resources:\n    requests:\n      memory: "256Mi"\n      cpu: "250m"\n    limits:\n      memory: "512Mi"\n      cpu: "500m"' },
    { id:'k8s-service-type', mode:'choice', title:'Choosing the right Service type',
      explain:'A Service exposes a set of pods -- but HOW it\'s exposed depends on the type you choose.',
      scenario:'You need your app reachable from OUTSIDE the cluster, on the public internet, ideally with a cloud load balancer provisioned automatically. Which Service type fits?',
      choices:['ClusterIP -- internal cluster access only', 'NodePort -- exposes a static port on every node', 'LoadBalancer -- provisions an external cloud load balancer automatically', 'None -- Services can\'t be reached from outside the cluster'],
      correct:2,
      feedback:['ClusterIP is internal-only by design -- exactly the opposite of what\'s needed here.','NodePort technically allows external access, but through a specific high-numbered port on every node, not a clean public-facing load balancer.','Correct -- LoadBalancer is the type specifically designed to provision a real external load balancer (on supporting cloud providers) with a public IP automatically.','Services absolutely can be reached from outside -- LoadBalancer and NodePort both allow it, just differently.'] },
    { id:'k8s-liveness-readiness', mode:'choice', title:'Liveness vs. readiness probes',
      explain:'These sound similar but do very different things: one restarts a broken container, the other only affects traffic routing.',
      scenario:'Your app takes 30 seconds to warm up before it can serve requests, but once running never crashes or hangs. Which probe matters most here, and why?',
      choices:['Liveness probe -- to restart it if it ever crashes', 'Readiness probe -- so Kubernetes doesn\'t send it traffic during that 30-second warm-up, without restarting anything', 'Neither -- probes only matter for crashing apps', 'Both are equally critical here, for the same reason'],
      correct:1,
      feedback:['A liveness probe restarts a container that\'s already running but stuck -- that doesn\'t address the "not ready yet" warm-up period at all.','Correct -- readiness controls whether a pod RECEIVES traffic, independent of whether it\'s "alive." This exactly describes not sending requests during a real warm-up window, no restart needed.','Probes matter for exactly this kind of case too -- the readiness gate during startup, not just crash recovery.','They serve genuinely different purposes -- liveness handles crashes/hangs, readiness handles traffic routing timing. This scenario specifically needs readiness.'] },
    { id:'k8s-compose-yaml', mode:'config', title:'A basic docker-compose-to-K8s mental model: ConfigMap',
      explain:'A ConfigMap externalizes configuration (like environment settings) from your container image, so the same image can run in different environments without being rebuilt.',
      starter:'# TODO: write a ConfigMap named app-config with a data section\n# holding two settings: a logging level set to the word "info",\n# and a maximum-connections setting of one hundred (as a string)\n',
      checks:[
        {re:/kind:\s*ConfigMap/, label:'Defines a ConfigMap'},
        {re:/name:\s*app-config/, label:'Named app-config'},
        {re:/LOG_LEVEL:\s*info/, label:'Sets LOG_LEVEL to info'},
        {re:/MAX_CONNECTIONS:\s*"100"/, label:'Sets MAX_CONNECTIONS to "100"'}
      ],
      hints:['A ConfigMap has kind: ConfigMap and a data: section holding key-value pairs.','Both keys go directly under data:, indented the same amount.','kind: ConfigMap\\nmetadata:\\n  name: app-config\\ndata:\\n  LOG_LEVEL: info\\n  MAX_CONNECTIONS: "100"'],
      solution:'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-config\ndata:\n  LOG_LEVEL: info\n  MAX_CONNECTIONS: "100"' },
    { id:'k8s-debug-crashloop', mode:'choice', title:'Debugging: CrashLoopBackOff', 
      explain:'This status means Kubernetes keeps trying to restart a container that keeps failing right after starting -- the fix is finding out WHY it\'s failing, not just waiting.',
      scenario:'A pod shows status CrashLoopBackOff. What\'s the correct first diagnostic step?',
      choices:['Delete the pod and hope a fresh one works', 'Check the container\'s logs (kubectl logs) to see the actual error causing the crash', 'Immediately increase the replica count', 'Assume it\'s a temporary Kubernetes glitch and ignore it'],
      correct:1,
      feedback:['Deleting without understanding why just recreates the same crash -- Kubernetes will keep restarting it into the same failure.','Correct -- the logs from the crashing container almost always show the actual error (a missing config value, a failed startup check, an unhandled exception) that\'s causing the crash.','More replicas means more crashing pods, not a fix -- this doesn\'t address the actual failure.','CrashLoopBackOff reflects a REAL, repeated failure -- it\'s not a transient glitch to ignore.'] }
  ];

  function k8sKey(id, field){ return 'k8strack:'+id+':'+field; }
  function k8sSave(id, field, val){ try{ localStorage.setItem(k8sKey(id,field), val); }catch(e){} }
  function k8sLoad(id, field, fallback){ try{ var v=localStorage.getItem(k8sKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function k8sDoneKey(id){ return 'k8strack:'+id+':done'; }
  function k8sIsDone(id){ try{ return localStorage.getItem(k8sDoneKey(id))==='1'; }catch(e){ return false; } }
  function k8sEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var k8sCurIdx = 0;

  window.k8sOpen = function(idx){
    k8sCurIdx = idx;
    renderK8sNav();
    renderK8sLesson();
    window.scrollTo(0,0);
  };
  window.k8sNext = function(){ if(k8sCurIdx < K8S_LESSONS.length-1) window.k8sOpen(k8sCurIdx+1); };
  window.k8sPrev = function(){ if(k8sCurIdx > 0) window.k8sOpen(k8sCurIdx-1); };
  window.k8sMarkDone = function(idx){
    try{ localStorage.setItem(k8sDoneKey(K8S_LESSONS[idx].id), '1'); }catch(e){}
    renderK8sNav();
  };

  function renderK8sNav(){
    var nav = document.getElementById('k8sLessonNav');
    if(!nav) return;
    nav.innerHTML = K8S_LESSONS.map(function(l, i){
      var done = k8sIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===k8sCurIdx?'active':'')+'" data-act="k8sOpen('+i+')">'+(i+1)+'. '+k8sEsc(l.title)+done+'</button>';
    }).join('');
  }

  function k8sNavRow(){
    return '<div class="wd-navrow">'
      + (k8sCurIdx>0 ? '<button class="wd-btn-ghost" data-act="k8sPrev()">&larr; Previous</button>' : '<span></span>')
      + (k8sCurIdx<K8S_LESSONS.length-1 ? '<button class="wd-btn" data-act="k8sNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function renderK8sLesson(){
    var body = document.getElementById('k8sLessonBody');
    if(!body) return;
    var l = K8S_LESSONS[k8sCurIdx];

    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="k8schoice_'+l.id+'_'+i+'" data-act="k8sAnswer(\''+l.id+'\','+i+')">'+k8sEsc(c)+'</button>';
      }).join('');
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(k8sCurIdx+1)+k8sEsc(l.title)+'</h2></div>'
        + trackMentalModel(k8sEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+k8sEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="k8sfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="k8sMarkDone('+k8sCurIdx+')">Mark task done</button></div>'
        + k8sNavRow();
      return;
    }

    var savedCode = k8sLoad(l.id, 'code', l.starter);
    var idBase = 'k8spm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="k8sRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="k8sRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="k8shint_'+l.id+'_'+(i+1)+'">'+k8sEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="k8shint_'+l.id+'_99"><b>Solution:</b><pre>'+k8sEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(k8sCurIdx+1)+k8sEsc(l.title)+'</h2></div>'
      + '<p class="wd-lesson-explain"><span class="cx-pm-badge cx-pm-badge-sim" style="display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:6px;margin-right:6px;background:#3a2f12;color:#f0b878;vertical-align:middle">STRUCTURAL CHECK</span>Checks the shape of your YAML -- this does not actually deploy to a real cluster.</p>'
      + trackMentalModel(k8sEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.yml', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:150px">'+k8sEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="k8sCheck(\''+l.id+'\',\''+editId+'\',\''+outId+'\')">&#9654; Check</button>'
        + '<button class="wd-btn-ghost" data-act="k8sReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="k8sMarkDone('+k8sCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + k8sNavRow();
  }

  window.k8sCheck = function(lessonId, editId, outId){
    var l = K8S_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    k8sSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(!out) return;
    var results = l.checks.map(function(chk){ return {label:chk.label, pass:chk.re.test(code)}; });
    var passCount = results.filter(function(r){ return r.pass; }).length;
    out.innerHTML = '<b>'+passCount+'/'+results.length+' checks passed</b>' + results.map(function(r){
      return '<div class="dsa-testrow '+(r.pass?'pass':'fail')+'"><span>'+k8sEsc(r.label)+'</span><span>'+(r.pass?'PASS':'FAIL')+'</span></div>';
    }).join('');
  };

  window.k8sReset = function(lessonId, editId){
    var l = K8S_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    k8sSave(lessonId, 'code', l.starter);
  };

  window.k8sRevealHint = function(lessonId, tier){
    var l = K8S_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('k8shint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  window.k8sAnswer = function(lessonId, choiceIdx){
    var l = K8S_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('k8schoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('k8sfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };

  var k8sBooted = false;
  window._k8sBoot = function(){
    if(k8sBooted) return;
    k8sBooted = true;
    window.k8sOpen(0);
  };
})();
