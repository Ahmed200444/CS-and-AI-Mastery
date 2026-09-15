
(function(){
  var RESUME_LESSONS = [
    { id:'resume-quantify', mode:'choice', title:'Vague claims vs. quantified impact',
      explain:'A resume bullet that states an outcome with a real number is far more credible and specific than a vague claim.',
      scenario:'"Improved website performance" vs. "Reduced page load time from 4.2s to 1.1s, a 74% improvement, by optimizing image compression and lazy-loading." Which is stronger, and why?',
      choices:['They\'re equally strong -- specificity doesn\'t matter on a resume', 'The quantified version -- specific, measurable numbers are far more credible and memorable than a vague claim', 'The vague version -- it sounds more impressive by leaving room for imagination', 'Numbers should never appear on a resume'],
      correct:1,
      feedback:['Vague claims are easy to write and hard to verify or remember -- specificity is a real, well-established resume strength.','Correct -- concrete numbers (before/after values, percentages) give a hiring manager something specific and credible to evaluate, and are simply more memorable than a vague adjective.','Vague claims actually read as LESS credible, not more impressive -- a reader can\'t tell if "improved" means 2% or 200%.','Quantified achievements are one of the most consistently recommended resume practices precisely because numbers are concrete evidence.'] },
    { id:'resume-tailoring', mode:'choice', title:'One generic resume vs. tailoring per role',
      explain:'Different job postings emphasize different skills and requirements -- a resume that speaks directly to what each posting asks for reads as more relevant.',
      scenario:'You\'re applying to both a "Backend Engineer" role emphasizing API design and a "Data Engineer" role emphasizing pipelines and ETL. Should you submit the identical resume to both?',
      choices:['Yes -- resumes should always stay exactly the same regardless of the role', 'No -- adjusting which projects/skills you emphasize (without fabricating anything) to match what each specific role actually asks for makes your relevance to that role clearer', 'Only entry-level candidates need to tailor their resume', 'Tailoring a resume is considered dishonest'],
      correct:1,
      feedback:['A single generic resume often buries the most relevant experience for a specific role under less relevant details -- tailoring surfaces what actually matters for THAT posting.','Correct -- this is standard, honest practice: choosing which of your REAL experiences and skills to emphasize based on what a specific role is actually asking for, not inventing anything new.','Tailoring benefits candidates at any experience level -- relevance matters regardless of seniority.','Tailoring which true things you emphasize is completely different from fabricating false claims -- it\'s honest, standard practice, not dishonesty.'] },
    { id:'resume-project-relevance', mode:'choice', title:'Choosing which projects to include',
      explain:'Limited resume space means choosing which real projects best demonstrate what a specific role needs to see.',
      scenario:'You have 5 real projects: 3 are small course exercises, 2 are substantial, deployed, real-world applications with genuine complexity. Applying for a software engineering role, what\'s the better choice?',
      choices:['Include all 5 to show maximum quantity of work', 'Lead with the 2 substantial, deployed projects, since depth and real-world complexity matter more than sheer count', 'Only ever include course exercises since they show fundamentals', 'Project choice never affects how a resume is perceived'],
      correct:1,
      feedback:['Padding with less substantial exercises can actually dilute the impact of your strongest, most relevant work -- quantity isn\'t the goal.','Correct -- for most engineering roles, a smaller number of substantial, real projects demonstrating genuine complexity and deployment experience reads as stronger than a longer list of basic exercises.','Course exercises have their place (e.g., for absolute beginners with nothing else yet), but substantial real projects generally demonstrate more for an engineering role.','Which specific projects you choose to highlight, and how you describe them, directly shapes what a reader concludes about your actual capabilities.'] },
    { id:'resume-length', mode:'choice', title:'Resume length: a real, practical guideline',
      explain:'Hiring managers and recruiters typically spend very little time on an initial resume scan.',
      scenario:'A candidate with 2 years of experience submits a 4-page resume packed with every detail from every project and course ever taken. What\'s the likely practical issue?',
      choices:['No issue -- more content is always better regardless of length', 'Length disproportionate to experience level makes it harder for a reader to quickly find the most relevant, impactful information -- a real practical cost', 'Resume length has no bearing on how it\'s received', 'Longer resumes always indicate a stronger candidate'],
      correct:1,
      feedback:['Given how briefly resumes are typically scanned initially, excessive length actively works against a candidate by burying the most important information.','Correct -- for this experience level, a 4-page resume is disproportionate; conciseness that surfaces the strongest, most relevant points serves the candidate better than exhaustive completeness.','Given how resumes are actually reviewed (often quickly, at least at first), length is a real practical factor in how effectively the content gets read.','Length by itself says nothing about candidate quality -- what matters is whether the most relevant, impactful information is easy to find.'] }
  ];

  function resumeKey(id, field){ return 'resumetrack:'+id+':'+field; }
  function resumeDoneKey(id){ return 'resumetrack:'+id+':done'; }
  function resumeIsDone(id){ try{ return localStorage.getItem(resumeDoneKey(id))==='1'; }catch(e){ return false; } }
  function resumeEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var resumeCurIdx = 0;
  window.resumeOpen = function(idx){ resumeCurIdx = idx; renderResumeNav(); renderResumeLesson(); window.scrollTo(0,0); };
  window.resumeNext = function(){ if(resumeCurIdx < RESUME_LESSONS.length-1) window.resumeOpen(resumeCurIdx+1); };
  window.resumePrev = function(){ if(resumeCurIdx > 0) window.resumeOpen(resumeCurIdx-1); };
  window.resumeMarkDone = function(idx){ try{ localStorage.setItem(resumeDoneKey(RESUME_LESSONS[idx].id), '1'); }catch(e){} renderResumeNav(); };

  function renderResumeNav(){
    var nav = document.getElementById('resumeLessonNav'); if(!nav) return;
    nav.innerHTML = RESUME_LESSONS.map(function(l, i){
      var done = resumeIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===resumeCurIdx?'active':'')+'" data-act="resumeOpen('+i+')">'+(i+1)+'. '+resumeEsc(l.title)+done+'</button>';
    }).join('');
  }
  function resumeNavRow(){
    return '<div class="wd-navrow">'
      + (resumeCurIdx>0 ? '<button class="wd-btn-ghost" data-act="resumePrev()">&larr; Previous</button>' : '<span></span>')
      + (resumeCurIdx<RESUME_LESSONS.length-1 ? '<button class="wd-btn" data-act="resumeNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderResumeLesson(){
    var body = document.getElementById('resumeLessonBody'); if(!body) return;
    var l = RESUME_LESSONS[resumeCurIdx];
    var choicesHtml = l.choices.map(function(c, i){
      return '<button class="agent-choice-btn" id="resumechoice_'+l.id+'_'+i+'" data-act="resumeAnswer(\''+l.id+'\','+i+')">'+resumeEsc(c)+'</button>';
    }).join('');
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(resumeCurIdx+1)+resumeEsc(l.title)+'</h2></div>'
        + trackMentalModel(resumeEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+resumeEsc(l.scenario)+'</p>'
      + '<div>'+choicesHtml+'</div>'
      + '<div class="agent-feedback" id="resumefeedback_'+l.id+'"></div>'
      + '<div class="wd-row"><button class="wd-btn-ghost" data-act="resumeMarkDone('+resumeCurIdx+')">Mark task done</button></div>'
      + resumeNavRow();
  }
  window.resumeAnswer = function(lessonId, choiceIdx){
    var l = RESUME_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('resumechoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('resumefeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  var resumeBooted = false;
  window._resumeBoot = function(){ if(resumeBooted) return; resumeBooted = true; window.resumeOpen(0); };
})();
