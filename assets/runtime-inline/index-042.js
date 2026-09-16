
(function(){
  var CLOUD_LESSONS = [
    { id:'cloud-service-model', mode:'choice', title:'IaaS vs. PaaS vs. SaaS',
      explain:'These three models differ in how much infrastructure YOU manage versus the provider.',
      scenario:'You want to deploy a web app quickly without managing servers, operating systems, or runtime patching yourself -- just push code and have it run. Which service model fits best?',
      choices:['IaaS (e.g. raw virtual machines) -- you manage the OS and runtime yourself', 'PaaS (e.g. a managed app platform) -- the provider manages the OS/runtime, you manage just your code', 'SaaS (e.g. a finished software product) -- there\'s no code to deploy at all', 'On-premises hardware you own and rack yourself'],
      correct:1,
      feedback:['IaaS gives you flexibility but means YOU patch the OS, manage the runtime, handle scaling manually -- more work than this scenario wants.','Correct -- PaaS is exactly "just push code," with the provider handling the OS, runtime, and patching underneath.','SaaS is for using someone else\'s finished product (like Gmail) -- there\'s no "your code" to deploy in that model at all.','On-premises is the opposite of what\'s being asked for -- maximum management burden, not minimum.'] },
    { id:'cloud-autoscaling', mode:'choice', title:'When does autoscaling actually help?',
      explain:'Autoscaling adds/removes capacity based on real demand -- but it only helps when demand genuinely varies.',
      scenario:'Your app has extremely predictable, flat traffic 24/7 -- the same load every hour, every day, with no spikes ever. Is autoscaling worth setting up?',
      choices:['Yes -- autoscaling should always be enabled regardless of traffic pattern', 'Not really -- with genuinely flat, predictable load, a fixed capacity sized for that load is simpler and just as cost-effective', 'No -- autoscaling never works correctly for any workload', 'Only if the app is written in a specific programming language'],
      correct:1,
      feedback:['Autoscaling adds real operational complexity -- it earns that cost specifically when load VARIES; flat load doesn\'t need it.','Correct -- for genuinely flat, predictable demand, a fixed, right-sized capacity is simpler to reason about and reserved-pricing options often make it cheaper too, with none of autoscaling\'s added complexity.','Autoscaling works fine for many real workloads -- it\'s just not particularly valuable for this specific flat-traffic case.','Autoscaling is a platform/infrastructure concern, not tied to any specific programming language.'] },
    { id:'cloud-security-shared', mode:'choice', title:'The shared responsibility model',
      explain:'Cloud providers and customers split security responsibilities -- and misunderstanding where that line sits is a common, serious real-world mistake.',
      scenario:'Your company uses a managed cloud database service. A data breach happens because your team left the database publicly accessible with no access controls configured. Whose responsibility was that?',
      choices:['The cloud provider\'s -- they\'re responsible for all security', 'Your team\'s -- the provider secures the underlying infrastructure, but YOU are responsible for configuring access controls on what you deploy', 'Nobody\'s -- breaches like this are unavoidable', 'It depends only on which cloud provider was used'],
      correct:1,
      feedback:['Providers secure the infrastructure UNDERNEATH your service (physical security, host patching, etc.) -- they don\'t configure your access rules for you.','Correct -- this is exactly the shared responsibility model: the provider secures the platform itself, but configuring who can access what you deploy on it is the customer\'s job.','This is a completely preventable misconfiguration, not an unavoidable event -- proper access controls would have stopped it.','The shared responsibility model\'s general shape (provider secures the platform, customer configures their own resources) is consistent across major providers -- this isn\'t provider-specific.'] },
    { id:'cloud-cost-estimate', mode:'calc', title:'Estimating monthly compute cost', funcName:'estimate_monthly_cost',
      explain:'A basic, real calculation cloud engineers do constantly: instances multiplied by hourly rate multiplied by hours in a month.',
      starter:'def estimate_monthly_cost(instances, hourly_rate_per_instance, hours_per_month=730):\n    # TODO: return instances * hourly_rate_per_instance * hours_per_month,\n    # rounded to 2 decimal places\n    pass',
      solution:'def estimate_monthly_cost(instances, hourly_rate_per_instance, hours_per_month=730):\n    return round(instances * hourly_rate_per_instance * hours_per_month, 2)',
      hints:['This is a straightforward multiplication of all three inputs.','730 hours is the standard approximation for "a month" (24*365/12).','return round(instances * hourly_rate_per_instance * hours_per_month, 2)'],
      tests:[
        {argsRepr:'3, 0.05', expectedRepr:'109.5'},
        {argsRepr:'1, 0.10, 730', expectedRepr:'73.0'}
      ]},
    { id:'cloud-vendor-lockin', mode:'choice', title:'Weighing vendor lock-in',
      explain:'Using a provider\'s proprietary managed services is often faster to build with, but makes switching providers later harder.',
      scenario:'You\'re choosing between a cloud provider\'s proprietary, fully-managed database service (fast to set up, deeply integrated) versus running open-source PostgreSQL yourself on their VMs (more setup work, portable to any provider). What\'s the honest trade-off?',
      choices:['The proprietary service has no real downsides -- always choose it', 'Faster setup and less operational burden now, versus real difficulty migrating away from that provider later -- a genuine trade-off, not a free win', 'Self-managed PostgreSQL is always the better choice, with no downsides', 'This choice has no long-term consequences either way'],
      correct:1,
      feedback:['Proprietary managed services genuinely do have a downside -- migrating off them later is real, often significant work. It\'s not a free win.','Correct -- this is a real trade-off: less operational work and faster delivery now, against reduced portability and harder migration later. Reasonable teams make this call differently depending on their priorities.','Self-managed options have real downsides too -- more setup, more ongoing operational burden -- it\'s not simply "always better."','This decision has real, lasting consequences for how easily the system could move providers later -- it\'s not consequence-free.'] },
    { id:'cloud-region-choice', mode:'choice', title:'Choosing a deployment region',
      explain:'Region choice affects latency for your users, data residency/compliance requirements, and cost -- rarely just one factor alone.',
      scenario:'Your users are 90% based in the EU, and your company must comply with EU data residency regulations requiring user data stay within the EU. Which factor should dominate your region choice?',
      choices:['Whichever region is cheapest, regardless of location', 'An EU region -- both latency for your actual users AND the legal data-residency requirement point the same direction', 'A US region, since most cloud documentation defaults to US examples', 'Region choice doesn\'t matter for compliance, only for latency'],
      correct:1,
      feedback:['Cost matters, but ignoring a legal REQUIREMENT (data residency) to save money isn\'t a choice you actually get to make -- compliance isn\'t optional.','Correct -- here, user latency and legal compliance both point to the same answer (an EU region), making this a clear decision rather than a real trade-off.','Following documentation examples isn\'t a valid reason to violate an actual legal data-residency requirement.','Data residency laws are specifically ABOUT where infrastructure is physically located -- region choice is central to compliance, not irrelevant to it.'] }
  ];

  function cloudKey(id, field){ return 'cloudtrack:'+id+':'+field; }
  function cloudSave(id, field, val){ try{ localStorage.setItem(cloudKey(id,field), val); }catch(e){} }
  function cloudLoad(id, field, fallback){ try{ var v=localStorage.getItem(cloudKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function cloudDoneKey(id){ return 'cloudtrack:'+id+':done'; }
  function cloudIsDone(id){ try{ return localStorage.getItem(cloudDoneKey(id))==='1'; }catch(e){ return false; } }
  function cloudEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var cloudCurIdx = 0;

  window.cloudOpen = function(idx){
    cloudCurIdx = idx;
    renderCloudNav();
    renderCloudLesson();
    window.scrollTo(0,0);
  };
  window.cloudNext = function(){ if(cloudCurIdx < CLOUD_LESSONS.length-1) window.cloudOpen(cloudCurIdx+1); };
  window.cloudPrev = function(){ if(cloudCurIdx > 0) window.cloudOpen(cloudCurIdx-1); };
  window.cloudMarkDone = function(idx){
    try{ localStorage.setItem(cloudDoneKey(CLOUD_LESSONS[idx].id), '1'); }catch(e){}
    renderCloudNav();
  };

  function renderCloudNav(){
    var nav = document.getElementById('cloudLessonNav');
    if(!nav) return;
    nav.innerHTML = CLOUD_LESSONS.map(function(l, i){
      var done = cloudIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===cloudCurIdx?'active':'')+'" data-act="cloudOpen('+i+')">'+(i+1)+'. '+cloudEsc(l.title)+done+'</button>';
    }).join('');
  }

  function cloudNavRow(){
    return '<div class="wd-navrow">'
      + (cloudCurIdx>0 ? '<button class="wd-btn-ghost" data-act="cloudPrev()">&larr; Previous</button>' : '<span></span>')
      + (cloudCurIdx<CLOUD_LESSONS.length-1 ? '<button class="wd-btn" data-act="cloudNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function renderCloudLesson(){
    var body = document.getElementById('cloudLessonBody');
    if(!body) return;
    var l = CLOUD_LESSONS[cloudCurIdx];

    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="cloudchoice_'+l.id+'_'+i+'" data-act="cloudAnswer(\''+l.id+'\','+i+')">'+cloudEsc(c)+'</button>';
      }).join('');
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(cloudCurIdx+1)+cloudEsc(l.title)+'</h2></div>'
        + trackMentalModel(cloudEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+cloudEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="cloudfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="cloudMarkDone('+cloudCurIdx+')">Mark task done</button></div>'
        + cloudNavRow();
      return;
    }

    // mode === 'calc'
    var savedCode = cloudLoad(l.id, 'code', l.starter);
    var idBase = 'cloudpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="cloudRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="cloudRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="cloudhint_'+l.id+'_'+(i+1)+'">'+cloudEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="cloudhint_'+l.id+'_99"><b>Solution:</b><pre>'+cloudEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(cloudCurIdx+1)+cloudEsc(l.title)+'</h2></div>'
      + trackMentalModel(cloudEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:110px">'+cloudEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="cloudRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
        + '<button class="wd-btn-ghost" data-act="cloudReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="cloudMarkDone('+cloudCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + cloudNavRow();
  }

  window.cloudReset = function(lessonId, editId){
    var l = CLOUD_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    cloudSave(lessonId, 'code', l.starter);
  };
  window.cloudRevealHint = function(lessonId, tier){
    var l = CLOUD_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('cloudhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };
  window.cloudAnswer = function(lessonId, choiceIdx){
    var l = CLOUD_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('cloudchoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('cloudfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };

  window.cloudRunTests = async function(lessonId, editId, outId, statusId){
    var l = CLOUD_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    cloudSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_cloud_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _exp = ('+t.expectedRepr+')\n'+
        '    _ok = (abs(_r - _exp) < 1e-6) if isinstance(_r,(int,float)) and isinstance(_exp,(int,float)) else (_r == _exp)\n'+
        '    _cloud_results.append(("'+i+'", _ok, repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _cloud_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _cloud_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';

    try{
      py.globals.set('_SRC', fullSrc);
      py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT');
      var iserr = py.globals.get('_ISERR');
      if(iserr){ if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>'; return; }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){ if(out) out.textContent = result || '(no test results -- check the function name matches exactly)'; return; }
      var rows = lines.map(function(ln){
        var parts = ln.split('|');
        return '<div class="dsa-testrow '+(parts[2]==='PASS'?'pass':'fail')+'"><span>Test '+(Number(parts[1])+1)+'</span><span>'+parts[2]+' &mdash; got '+cloudEsc(parts[3])+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  var cloudBooted = false;
  window._cloudBoot = function(){
    if(cloudBooted) return;
    cloudBooted = true;
    window.cloudOpen(0);
  };
})();
