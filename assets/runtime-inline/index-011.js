
(function(){
  var FSP_STAGES = [
    { id:'python', title:'Python', why:'The programming fundamentals (variables, functions, loops, logic) that JavaScript, FastAPI, and everything after this reuses directly.',
      milestone:'Capstone milestone: no UI yet -- this stage is the logic foundation the rest of the project is built on.' },
    { id:'web-dev', title:'Web Development', why:'HTML, CSS, JavaScript, and React -- the frontend of your capstone app starts here.',
      milestone:'Capstone milestone: after HTML/CSS, build the capstone\'s UI skeleton. After JavaScript, make it interactive. After React, convert it into a real React app.' },
    { id:'apis', title:'APIs', why:'REST principles, HTTP methods, and status codes -- the contract your frontend and backend will speak to each other.',
      milestone:'Capstone milestone: design the REST API contract your capstone\'s frontend will call.' },
    { id:'backend', title:'Backend Development', why:'FastAPI, request routing, validation, and JWT authentication -- the server side of your capstone.',
      milestone:'Capstone milestone: connect your capstone\'s React frontend to a real FastAPI backend, then add JWT-based login.' },
    { id:'databases', title:'Databases', why:'Schema design, normalization, and PostgreSQL specifically -- where your capstone\'s real data lives.',
      milestone:'Capstone milestone: give your capstone a real PostgreSQL schema and store real data in it.' },
    { id:'git', title:'Git & GitHub', why:'Version control -- how you\'ll actually manage your capstone\'s code as it grows across every stage.',
      milestone:'Capstone milestone: put your capstone under real version control with a meaningful commit history.' },
    { id:'docker', title:'Docker', why:'Containers -- packaging your capstone so it runs the same way everywhere.',
      milestone:'Capstone milestone: containerize your capstone with a Dockerfile and docker-compose.' },
    { id:'testing', title:'Testing', why:'Unit and integration tests -- proving your capstone actually works, and keeps working as it grows.',
      milestone:'Capstone milestone: write real tests for your capstone\'s critical paths (auth, core CRUD).' },
    { id:'software-engineering-practice', title:'Software Engineering in Practice', why:'Requirements, design decisions, code review, refactoring, release discipline, documentation, and incident learning -- the habits that turn working code into professional software.',
      milestone:'Capstone milestone: write the requirements and ADRs, review/refactor the codebase, document operations, and prepare a versioned release.' },
    { id:'deployment', title:'Deployment', why:'CI/CD, environment config, monitoring -- getting your capstone live where it earns its keep.',
      milestone:'Capstone milestone: publish your capstone live -- the final step of the path.' }
  ];

  function fspEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  window.fspGoToStage = function(id){
    id=String(id||'').replace(/[^A-Za-z0-9._-]/g,'');
    if(id)location.assign('courses/'+encodeURIComponent(id)+'.html');
  };

  window.fsPathRender = function(){
    var body = document.getElementById('fsPathBody');
    if(!body || typeof byId !== 'function' || typeof counts !== 'function') return;

    var stagesHtml = '';
    var overallDone = 0;
    var currentFound = false;

    FSP_STAGES.forEach(function(stage, i){
      var course = byId(stage.id);
      if(!course) return;
      var k = counts(course);
      var isDone = k.pct >= 100;
      var isLocked = false;
      if(i > 0){
        var prevCourse = byId(FSP_STAGES[i-1].id);
        isLocked = prevCourse ? counts(prevCourse).pct < 100 : false;
      }
      var isCurrent = !isDone && !isLocked && !currentFound;
      if(isCurrent) currentFound = true;
      if(isDone) overallDone++;

      var statusClass = isDone ? 'done' : (isCurrent ? 'current' : 'locked');
      var badgeContent = isDone ? '&#10003;' : (isLocked ? '&#128274;' : (i+1));

      stagesHtml += '<div class="fsp-stage '+statusClass+'">'
        + '<div class="fsp-stage-line"></div>'
        + '<div class="fsp-stage-badge">'+badgeContent+'</div>'
        + '<div class="fsp-stage-body">'
        + '<h3>Stage '+(i+1)+': '+fspEsc(stage.title)+'</h3>'
        + '<p>'+fspEsc(stage.why)+'</p>'
        + (isLocked ? '' : '<div class="fsp-stage-pct">'+k.pct+'% complete</div>')
        + (isLocked ? '' : '<button class="fsp-stage-btn" data-act="fspGoToStage(\''+stage.id+'\')">'+(isDone?'Review':isCurrent?'Continue':'Open')+' '+fspEsc(stage.title)+' &rarr;</button>')
        + '<div class="fsp-milestone">'+fspEsc(stage.milestone)+'</div>'
        + '</div></div>';
    });

    var overallPct = Math.round(overallDone / FSP_STAGES.length * 100);
    var pathComplete = overallDone === FSP_STAGES.length;
    var nextCourseCard = '';
    if(pathComplete){
      var nextCourse = byId('system-design');
      if(nextCourse){
        nextCourseCard = '<div class="fsp-overall" style="border:1px solid var(--teal,#4fd1c5);margin-top:0">'
          + '<div><b>Path complete \u2014 recommended next: System Design</b>'
          + '<p style="color:var(--sub);font-size:.85rem;margin:6px 0 10px">A software engineering specialization for after the Full-Stack Path \u2014 optional, not required to consider this path finished.</p>'
          + '<button class="fsp-stage-btn" data-act="cxOpen(\'system-design\')">Open System Design &rarr;</button></div></div>';
      }
    }

    body.innerHTML =
      '<div class="fsp-header"><h2>Python Full-Stack Developer Path</h2>'
      + '<p>One guided sequence, beginner to job-ready: HTML/CSS/JS/React, Python, FastAPI, PostgreSQL, JWT auth, REST APIs, Git, Docker, Testing, and Deployment. Each stage unlocks the next once the previous one is fully complete.</p></div>'
      + '<div class="fsp-overall"><b>'+overallPct+'% of the path complete</b><span style="color:var(--sub)">&nbsp;&mdash; '+overallDone+'/'+FSP_STAGES.length+' stages done</span></div>'
      + nextCourseCard
      + stagesHtml;
  };

  window._fsPathBoot = function(){
    window.fsPathRender();
  };
})();
