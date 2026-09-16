
(function(){
  var DEPLOY_LESSONS = [
    { id:'deploy-cicd-pipeline', mode:'config', title:'Writing a CI/CD pipeline',
      explain:'A pipeline should run tests BEFORE deploying, and the deploy step should only run if tests actually passed -- that dependency is what "needs" expresses.',
      starter:'# TODO: write a GitHub-Actions-style pipeline (YAML) that:\n# - triggers on push to main\n# - has a "test" job that installs deps and runs pytest\n# - has a "deploy" job that NEEDS the test job (only runs if tests pass)\n',
      checks:[
        {re:/on:\s*\n\s*push:/i, label:'Triggers on push'},
        {re:/run:\s*pytest/i, label:'Runs the test suite'},
        {re:/needs:\s*test/i, label:'Deploy job depends on (needs) the test job -- never deploy before tests pass'},
        {re:/runs-on:\s*ubuntu-latest/i, label:'Specifies a runner'}
      ],
      hints:['A GitHub-Actions-style file has "on:" for triggers and "jobs:" containing named jobs.','Each job needs "runs-on:" and a list of "steps:".','The deploy job needs a "needs: test" line so it only runs after the test job succeeds.'],
      solution:'name: Deploy App\non:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: pip install -r requirements.txt\n      - run: pytest\n  deploy:\n    needs: test\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo deploying' },
    { id:'deploy-env-vars', mode:'choice', title:'Environment variables: local vs. production',
      explain:'A value that changes between environments (a database URL, a secret key) should never be hard-coded -- it should come from the environment itself.',
      scenario:'Your app\'s code has: DATABASE_URL = "postgres://localhost/dev_db" hard-coded directly in the source file. What\'s wrong with shipping this to production?',
      choices:['Nothing -- as long as the code works locally, it will work in production too', 'It will try to connect to a local database that doesn\'t exist in production -- this value must come from an environment variable instead', 'The URL format is wrong', 'This is fine as long as you remember to change it manually before every deploy'],
      correct:1,
      feedback:['Local and production are different environments with different real infrastructure -- code that "works locally" often fails immediately in production for exactly this reason.','Correct -- production has its own real database at its own real address; hard-coding the local one means production literally cannot connect to its own data. This value belongs in an environment variable (e.g. os.environ["DATABASE_URL"]), set differently per environment.','The URL format itself is valid Postgres connection string syntax -- the problem is WHERE it points, not its syntax.','Relying on remembering a manual step before every deploy is exactly the kind of fragile process automation and environment variables exist to eliminate.'] },
    { id:'deploy-strategy', mode:'choice', title:'Blue-green vs. canary deployment',
      explain:'Both strategies reduce risk by not sending 100% of traffic to new code immediately -- they differ in how gradually.',
      scenario:'You want to release a risky change to only 5% of real users first, watch error rates, then gradually increase to 100% if it looks healthy. Which strategy is this?',
      choices:['Blue-green deployment -- instantly switching all traffic from old to new', 'Canary deployment -- gradually shifting a small, growing percentage of traffic to the new version', 'Neither -- this requires taking the whole app offline first', 'Rolling back to the previous version'],
      correct:1,
      feedback:['Blue-green switches ALL traffic at once between two full environments -- that\'s a different (also valid) strategy, but not this gradual, percentage-based one.','Correct -- canary deployment is exactly this: start with a small percentage of real traffic on the new version, watch metrics, and ramp up gradually if it\'s healthy.','No deployment strategy here requires downtime -- that\'s exactly what these techniques are designed to avoid.','Rolling back means reverting to the OLD version after a problem -- this scenario is about a controlled, gradual release of something NEW.'] },
    { id:'deploy-rollback', mode:'choice', title:'When something breaks right after deploying',
      explain:'Speed matters here -- the goal is to stop the bleeding first, understand it second.',
      scenario:'You just deployed, and error rates immediately spike. You\'re not yet sure what\'s wrong. What should you do FIRST?',
      choices:['Start reading through the new code line by line to find the bug', 'Roll back to the last known-good version immediately, then investigate the root cause afterward', 'Wait to see if the error rate goes down on its own', 'Deploy a new fix immediately without rolling back first'],
      correct:1,
      feedback:['Debugging in production while users are actively affected wastes precious time -- restore service first, investigate calmly after.','Correct -- rolling back immediately stops user impact; you can debug the actual cause afterward with much less time pressure and a known-stable system running.','Waiting while users are actively experiencing errors is the wrong instinct when a fast, safe rollback is available.','Deploying an unverified fix under pressure, without first stabilizing on the known-good version, risks making things worse.'] },
    { id:'deploy-monitoring', mode:'choice', title:'What should trigger an alert?',
      explain:'Good alerting is about SIGNAL -- something a human genuinely needs to act on -- not noise.',
      scenario:'Your team wants to add monitoring to the deployed app. Which of these is the most appropriate thing to page someone about at 3am?',
      choices:['CPU usage briefly touched 60% for 10 seconds', 'The error rate on checkout requests jumped from 0.1% to 15% and is staying there', 'A single request took 50ms longer than average', 'Disk usage is at 40%, same as yesterday'],
      correct:1,
      feedback:['A brief, small CPU blip that self-resolves isn\'t something a human needs to be woken up for.','Correct -- a sustained, large jump in error rate on a critical path (checkout) is exactly the kind of signal that represents real, ongoing user impact worth an urgent page.','A single slightly-slow request is normal noise, not a pattern indicating a real problem.','Stable, unremarkable disk usage is exactly what you WANT to see -- not alert-worthy.'] },
    { id:'deploy-readiness', mode:'config', title:'A production-readiness Dockerfile + healthcheck',
      explain:'Beyond just running, a production container should expose a way for its orchestrator to know if it\'s actually healthy.',
      starter:'# TODO: write a Dockerfile for a FastAPI app that:\n# - uses python:3.11-slim\n# - installs from requirements.txt (cached before copying the rest)\n# - declares the port it listens on (8000)\n# - adds an instruction so the orchestrator can detect if it stops responding to /health\n# - starts with uvicorn\n',
      checks:[
        {re:/FROM\s+python:3\.11-slim/i, label:'Uses python:3.11-slim as the base image'},
        {re:/COPY\s+requirements\.txt\s+\.[\s\S]*RUN\s+pip install[\s\S]*COPY\s+\.\s+\./i, label:'Installs dependencies before copying the rest (cache-friendly order)'},
        {re:/HEALTHCHECK/i, label:'Includes a HEALTHCHECK so the orchestrator can detect a broken container'},
        {re:/CMD\s*\[.*uvicorn.*\]/i, label:'Starts the app with uvicorn in exec form'}
      ],
      hints:['A HEALTHCHECK instruction lets Docker/an orchestrator know if the container is actually working, not just running.','HEALTHCHECK CMD curl -f http://localhost:8000/health || exit 1 is a common pattern.','Keep the same cache-friendly COPY requirements.txt first, install, THEN copy-everything-else order from the Docker course.'],
      solution:'FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nEXPOSE 8000\nHEALTHCHECK CMD curl -f http://localhost:8000/health || exit 1\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0"]' }
  ];

  function deployKey(id, field){ return 'deploytrack:'+id+':'+field; }
  function deploySave(id, field, val){ try{ localStorage.setItem(deployKey(id,field), val); }catch(e){} }
  function deployLoad(id, field, fallback){ try{ var v=localStorage.getItem(deployKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function deployDoneKey(id){ return 'deploytrack:'+id+':done'; }
  function deployIsDone(id){ try{ return localStorage.getItem(deployDoneKey(id))==='1'; }catch(e){ return false; } }
  function deployEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var deployCurIdx = 0;

  window.deployOpen = function(idx){
    deployCurIdx = idx;
    renderDeployNav();
    renderDeployLesson();
    window.scrollTo(0,0);
  };
  window.deployNext = function(){ if(deployCurIdx < DEPLOY_LESSONS.length-1) window.deployOpen(deployCurIdx+1); };
  window.deployPrev = function(){ if(deployCurIdx > 0) window.deployOpen(deployCurIdx-1); };
  window.deployMarkDone = function(idx){
    try{ localStorage.setItem(deployDoneKey(DEPLOY_LESSONS[idx].id), '1'); }catch(e){}
    renderDeployNav();
  };

  function renderDeployNav(){
    var nav = document.getElementById('deployLessonNav');
    if(!nav) return;
    nav.innerHTML = DEPLOY_LESSONS.map(function(l, i){
      var done = deployIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===deployCurIdx?'active':'')+'" data-act="deployOpen('+i+')">'+(i+1)+'. '+deployEsc(l.title)+done+'</button>';
    }).join('');
  }

  function navRow(){
    return '<div class="wd-navrow">'
      + (deployCurIdx>0 ? '<button class="wd-btn-ghost" data-act="deployPrev()">&larr; Previous</button>' : '<span></span>')
      + (deployCurIdx<DEPLOY_LESSONS.length-1 ? '<button class="wd-btn" data-act="deployNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function renderDeployLesson(){
    var body = document.getElementById('deployLessonBody');
    if(!body) return;
    var l = DEPLOY_LESSONS[deployCurIdx];

    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="deploychoice_'+l.id+'_'+i+'" data-act="deployAnswer(\''+l.id+'\','+i+')">'+deployEsc(c)+'</button>';
      }).join('');
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(deployCurIdx+1)+deployEsc(l.title)+'</h2></div>'
        + trackMentalModel(deployEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+deployEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="deployfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="deployMarkDone('+deployCurIdx+')">Mark task done</button></div>'
        + navRow();
      return;
    }

    var savedCode = deployLoad(l.id, 'code', l.starter);
    var idBase = 'deploypm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="deployRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="deployRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="deployhint_'+l.id+'_'+(i+1)+'">'+deployEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="deployhint_'+l.id+'_99"><b>Solution:</b><pre>'+deployEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(deployCurIdx+1)+deployEsc(l.title)+'</h2></div>'
      + '<p class="wd-lesson-explain"><span class="cx-pm-badge cx-pm-badge-sim" style="display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:6px;margin-right:6px;background:#3a2f12;color:#f0b878;vertical-align:middle">STRUCTURAL CHECK</span>Checks the shape of your config -- this does not actually run a real pipeline or build a real image.</p>'
      + trackMentalModel(deployEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.yml', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:150px">'+deployEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="deployCheck(\''+l.id+'\',\''+editId+'\',\''+outId+'\')">&#9654; Check</button>'
        + '<button class="wd-btn-ghost" data-act="deployReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="deployMarkDone('+deployCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + navRow();
  }

  window.deployCheck = function(lessonId, editId, outId){
    var l = DEPLOY_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    deploySave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(!out) return;
    var results = l.checks.map(function(chk){ return {label:chk.label, pass:chk.re.test(code)}; });
    var passCount = results.filter(function(r){ return r.pass; }).length;
    out.innerHTML = '<b>'+passCount+'/'+results.length+' checks passed</b>' + results.map(function(r){
      return '<div class="dsa-testrow '+(r.pass?'pass':'fail')+'"><span>'+deployEsc(r.label)+'</span><span>'+(r.pass?'PASS':'FAIL')+'</span></div>';
    }).join('');
  };

  window.deployReset = function(lessonId, editId){
    var l = DEPLOY_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    deploySave(lessonId, 'code', l.starter);
  };

  window.deployRevealHint = function(lessonId, tier){
    var l = DEPLOY_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('deployhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  window.deployAnswer = function(lessonId, choiceIdx){
    var l = DEPLOY_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('deploychoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('deployfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };

  var deployBooted = false;
  window._deployBoot = function(){
    if(deployBooted) return;
    deployBooted = true;
    window.deployOpen(0);
  };
})();
