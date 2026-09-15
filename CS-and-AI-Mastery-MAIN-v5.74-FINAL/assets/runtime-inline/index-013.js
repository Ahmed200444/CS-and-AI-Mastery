
(function(){
  // Two task types share one lesson array:
  // 'config' tasks -- learner edits a Dockerfile/Compose file as plain text;
  //   a "Check" button runs REGEX-based structural checks (this platform
  //   can't actually build/run containers, so this checks shape and required
  //   instructions, not a real build -- clearly labeled as such in the UI).
  // 'choice' tasks -- reuse the AI Agents track's scenario+feedback pattern
  //   for genuinely conceptual decisions (no code to check).

  var DOCKER_LESSONS = [
    { id:'docker-basic-dockerfile', type:'config', title:'Writing a basic Dockerfile',
      explain:'A Dockerfile needs at minimum: a base image (FROM), copying your code in (COPY), installing dependencies (RUN), and a start command (CMD).',
      starter:'# TODO: write a Dockerfile for a Python app:\n# - base image python:3.11-slim\n# - copy everything into /app\n# - install from requirements.txt\n# - run app.py with python\n',
      checks:[
        {re:/FROM\s+python:3\.11-slim/i, label:'Uses python:3.11-slim as the base image'},
        {re:/COPY\s+\.\s+/i, label:'Copies the current directory into the image'},
        {re:/RUN\s+pip install.*requirements\.txt/i, label:'Installs dependencies from requirements.txt'},
        {re:/CMD\s*\[.*python.*app\.py.*\]/i, label:'Starts the app with python app.py in exec form'}
      ],
      hints:['Every Dockerfile starts with FROM <base image>.','Order matters for later tasks, but for now just get all 4 required pieces present.','FROM python:3.11-slim\\nWORKDIR /app\\nCOPY . .\\nRUN pip install -r requirements.txt\\nCMD ["python", "app.py"]'],
      solution:'FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -r requirements.txt\nCMD ["python", "app.py"]' },
    { id:'docker-layer-caching', type:'config', title:'Ordering layers for build caching',
      explain:'Docker caches each instruction as a layer, reusing it if nothing above it changed. Copying requirements.txt and installing BEFORE copying the rest of your code means dependency installs get cached even when your app code changes.',
      starter:'# TODO: reorder so dependency install is cached separately from app code:\n# copy ONLY requirements.txt first, install, THEN copy everything else\nFROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -r requirements.txt\nCMD ["python", "app.py"]\n',
      checks:[
        {re:/COPY\s+requirements\.txt\s+\.[\s\S]*RUN\s+pip install[\s\S]*COPY\s+\.\s+\./i, label:'requirements.txt is copied and installed BEFORE the rest of the code (correct caching order)'}
      ],
      hints:['Split the single "COPY . ." into two steps: one for requirements.txt, one for everything else.','The install step must come between the two COPY steps.','FROM python:3.11-slim\\nWORKDIR /app\\nCOPY requirements.txt .\\nRUN pip install -r requirements.txt\\nCOPY . .\\nCMD ["python", "app.py"]'],
      solution:'FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nCMD ["python", "app.py"]' },
    { id:'docker-multistage', type:'config', title:'A multi-stage build',
      explain:'A multi-stage build uses more than one FROM, letting you build in one stage (with all your build tools) and copy only the final result into a smaller final image -- keeping the shipped image lean.',
      starter:'# TODO: write a 2-stage build:\n# stage 1 named "build", using node:20 to run "npm run build"\n# stage 2 using nginx:alpine, copying /app/dist from the build stage\n',
      checks:[
        {re:/FROM\s+node:20\s+as\s+build/i, label:'Stage 1 is named "build" using node:20'},
        {re:/npm run build/i, label:'Runs the build command'},
        {re:/FROM\s+nginx:alpine/i, label:'Stage 2 uses nginx:alpine'},
        {re:/COPY\s+--from=build/i, label:'Copies files from the "build" stage into the final image'}
      ],
      hints:['Name the first stage with "AS build" so you can reference it later.','The final stage starts with a completely new FROM line.','COPY --from=build <path> <dest> pulls files from the earlier stage.'],
      solution:'FROM node:20 AS build\nWORKDIR /app\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=build /app/dist /usr/share/nginx/html' },
    { id:'docker-compose-basic', type:'config', title:'A basic docker-compose.yml',
      explain:'Compose describes multiple containers (services) that run together -- e.g. an app and its database -- and how they connect, in one file.',
      starter:'# TODO: write a compose file with two services: "web" (build from .)\n# and "db" (image postgres:16), where web depends_on db\n',
      checks:[
        {re:/services:/i, label:'Has a top-level "services:" key'},
        {re:/web:[\s\S]*build:\s*\./i, label:'Defines a "web" service built from the current directory'},
        {re:/db:[\s\S]*image:\s*postgres:16/i, label:'Defines a "db" service using the postgres:16 image'},
        {re:/depends_on:/i, label:'Uses depends_on so web waits for db'}
      ],
      hints:['Compose files start with a top-level "services:" key, then each service name indented under it.','"web" needs "build: ." since it\'s built from your own code; "db" needs "image: postgres:16" since it\'s a ready-made image.','services:\\n  web:\\n    build: .\\n    depends_on:\\n      - db\\n  db:\\n    image: postgres:16'],
      solution:'services:\n  web:\n    build: .\n    depends_on:\n      - db\n  db:\n    image: postgres:16' },
    { id:'docker-dockerignore', type:'choice', title:'What belongs in .dockerignore?',
      explain:'.dockerignore excludes files from the build context, the same way .gitignore excludes files from version control.',
      scenario:'Your project has a large node_modules/ folder and a .git/ folder. Both slow down every build unnecessarily since they\'re copied into the build context. What should you do?',
      choices:['Nothing -- Docker automatically excludes these', 'Add node_modules/ and .git/ to a .dockerignore file', 'Delete node_modules/ and .git/ before every build manually', 'Rename them so Docker skips them'],
      correct:1,
      feedback:['Docker does NOT automatically exclude anything -- without a .dockerignore, the entire build context (including node_modules and .git) gets sent to the Docker daemon on every build.','Correct -- a .dockerignore file works exactly like .gitignore, excluding these from the build context so builds are faster and images don\'t accidentally include them.','This works but is fragile and wastes real files -- .dockerignore solves this permanently with one file.','Renaming doesn\'t exclude anything from the build context -- .dockerignore is the actual mechanism for this.'] },
    { id:'docker-debug-cache', type:'choice', title:'Debugging: a Dockerfile that rebuilds everything every time',
      explain:'A teammate says every single code change causes ALL dependencies to reinstall, even though only one Python file changed.',
      scenario:'Their Dockerfile does: FROM python -> WORKDIR /app -> COPY . . -> RUN pip install -r requirements.txt -> CMD [...]. What is causing dependencies to reinstall on every code change?',
      choices:['Docker doesn\'t support caching at all', 'COPY . . happens before the pip install, so ANY file change invalidates the cache for every layer after it, including the install', 'pip install is just slow no matter what', 'The base image is too large'],
      correct:1,
      feedback:['Docker absolutely caches layers -- the problem here is the ORDER of instructions defeats that caching.','Correct -- because COPY . . comes before RUN pip install, changing ANY file (even one unrelated to dependencies) invalidates that COPY layer\'s cache, which cascades to invalidate the install layer too, forcing a full reinstall.','pip install\'s speed isn\'t the issue -- it\'s being triggered unnecessarily due to the layer order.','Image size doesn\'t cause cache invalidation on code changes -- layer ORDER does.'] }
  ];

  function dockKey(id, field){ return 'dockertrack:'+id+':'+field; }
  function dockSave(id, field, val){ try{ localStorage.setItem(dockKey(id,field), val); }catch(e){} }
  function dockLoad(id, field, fallback){ try{ var v=localStorage.getItem(dockKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function dockDoneKey(id){ return 'dockertrack:'+id+':done'; }
  function dockIsDone(id){ try{ return localStorage.getItem(dockDoneKey(id))==='1'; }catch(e){ return false; } }
  function dockEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var dockCurIdx = 0;

  window.dockOpen = function(idx){
    dockCurIdx = idx;
    renderDockNav();
    renderDockLesson();
    window.scrollTo(0,0);
  };
  window.dockNext = function(){ if(dockCurIdx < DOCKER_LESSONS.length-1) window.dockOpen(dockCurIdx+1); };
  window.dockPrev = function(){ if(dockCurIdx > 0) window.dockOpen(dockCurIdx-1); };
  window.dockMarkDone = function(idx){
    try{ localStorage.setItem(dockDoneKey(DOCKER_LESSONS[idx].id), '1'); }catch(e){}
    renderDockNav();
  };

  function renderDockNav(){
    var nav = document.getElementById('dockerLessonNav');
    if(!nav) return;
    nav.innerHTML = DOCKER_LESSONS.map(function(l, i){
      var done = dockIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===dockCurIdx?'active':'')+'" data-act="dockOpen('+i+')">'+(i+1)+'. '+dockEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderDockLesson(){
    var body = document.getElementById('dockerLessonBody');
    if(!body) return;
    var l = DOCKER_LESSONS[dockCurIdx];
    var navRow = '<div class="wd-navrow">'
        + (dockCurIdx>0 ? '<button class="wd-btn-ghost" data-act="dockPrev()">&larr; Previous</button>' : '<span></span>')
        + (dockCurIdx<DOCKER_LESSONS.length-1 ? '<button class="wd-btn" data-act="dockNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';

    if(l.type === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="dockchoice_'+l.id+'_'+i+'" data-act="dockAnswer(\''+l.id+'\','+i+')">'+dockEsc(c)+'</button>';
      }).join('');
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(dockCurIdx+1)+dockEsc(l.title)+'</h2></div>'
        + trackMentalModel(dockEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+dockEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="dockfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="dockMarkDone('+dockCurIdx+')">Mark task done</button></div>'
        + navRow;
      return;
    }

    var savedCode = dockLoad(l.id, 'code', l.starter);
    var idBase = 'dockpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="dockRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="dockRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="dockhint_'+l.id+'_'+(i+1)+'">'+dockEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="dockhint_'+l.id+'_99"><b>Solution:</b><pre>'+dockEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(dockCurIdx+1)+dockEsc(l.title)+'</h2></div>'
      + '<p class="wd-lesson-explain"><span class="cx-pm-badge cx-pm-badge-sim" style="display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:6px;margin-right:6px;background:#3a2f12;color:#f0b878;vertical-align:middle">STRUCTURAL CHECK</span>Checks the shape of your file against the required instructions -- this does not actually build a real Docker image.</p>'
      + trackMentalModel(dockEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.yml', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:120px">'+dockEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="dockCheck(\''+l.id+'\',\''+editId+'\',\''+outId+'\')">&#9654; Check</button>'
        + '<button class="wd-btn-ghost" data-act="dockReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="dockMarkDone('+dockCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + navRow;
  }

  window.dockCheck = function(lessonId, editId, outId){
    var l = DOCKER_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    dockSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(!out) return;
    var results = l.checks.map(function(chk){
      return {label: chk.label, pass: chk.re.test(code)};
    });
    var passCount = results.filter(function(r){ return r.pass; }).length;
    out.innerHTML = '<b>'+passCount+'/'+results.length+' checks passed</b>' + results.map(function(r){
      return '<div class="dsa-testrow '+(r.pass?'pass':'fail')+'"><span>'+dockEsc(r.label)+'</span><span>'+(r.pass?'PASS':'FAIL')+'</span></div>';
    }).join('');
  };

  window.dockReset = function(lessonId, editId){
    var l = DOCKER_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    dockSave(lessonId, 'code', l.starter);
  };

  window.dockRevealHint = function(lessonId, tier){
    var l = DOCKER_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('dockhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  window.dockAnswer = function(lessonId, choiceIdx){
    var l = DOCKER_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('dockchoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('dockfeedback_'+lessonId);
    if(fb){
      fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong');
      fb.textContent = l.feedback[choiceIdx];
    }
    dockSave(lessonId, 'answered', String(choiceIdx));
  };

  var dockBooted = false;
  window._dockBoot = function(){
    if(dockBooted) return;
    dockBooted = true;
    window.dockOpen(0);
  };
})();
