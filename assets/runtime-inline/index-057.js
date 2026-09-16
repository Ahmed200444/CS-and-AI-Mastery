
(function(){
  var COMPANY_LESSONS = [
    { id:'company-research-depth', mode:'choice', title:'How much company research is actually useful',
      explain:'Company research should inform genuine, specific questions and understanding -- not just be recited as memorized facts.',
      scenario:'Before an interview, you memorize the company\'s founding date, funding rounds, and every executive\'s name, but haven\'t looked at what the actual TEAM you\'d join works on day-to-day. What\'s the gap?',
      choices:['There is no gap -- this level of research is exactly what\'s needed', 'The memorized facts don\'t help you ask genuinely informed questions about the actual role and team -- the more useful research is understanding what you\'d actually be doing', 'Company research is never useful for any interview', 'Only the founding date and funding actually matter'],
      correct:1,
      feedback:['Reciting memorized facts doesn\'t demonstrate genuine engagement with the actual role -- it can come across as surface-level research.','Correct -- understanding the team\'s actual work, the product\'s real challenges, and the role\'s specific responsibilities lets you ask genuinely informed questions and show real interest in the SPECIFIC job, not just the company\'s general profile.','Some research is genuinely valuable -- the issue here is depth in the wrong direction, not research itself being useless.','These specific facts are the LEAST likely to inform genuinely useful interview questions about the actual role -- team/product understanding matters more.'] },
    { id:'company-culture-fit', mode:'choice', title:'Evaluating culture fit both ways',
      explain:'An interview is a two-way evaluation -- you\'re assessing the company just as much as they\'re assessing you.',
      scenario:'During an interview, you notice every question you ask about work-life balance or team collaboration gets a vague, deflecting answer. What should you do with this signal?',
      choices:['Ignore it completely -- only the company\'s evaluation of you matters', 'Take it seriously as real information about the company\'s actual culture, and factor it into your own decision about whether this role is right for you', 'Assume you asked the questions wrong', 'This kind of signal is never meaningful'],
      correct:1,
      feedback:['An interview is genuinely a two-way street -- ignoring real signals about the company\'s culture wastes information that directly affects your own future satisfaction there.','Correct -- consistent vagueness or deflection on a topic you asked about directly is real information worth weighing seriously in your own decision, not something to dismiss.','The question phrasing usually isn\'t the issue -- a genuinely healthy team culture is usually easy and comfortable to describe when asked directly.','This kind of pattern (repeated vagueness on a specific topic) is exactly the kind of signal worth paying attention to.'] },
    { id:'company-questions-to-ask', mode:'choice', title:'Choosing genuinely useful questions to ask',
      explain:'The questions you ask at the end of an interview are a real opportunity to learn what actually matters for your decision.',
      scenario:'At the end of an interview, you can ask either "What\'s a typical day like for someone in this role?" or "Does this company have good benefits?" (something you could find on their public careers page). Which is the better use of that time?',
      choices:['The benefits question -- benefits matter most', 'The "typical day" question -- it surfaces real, specific information you genuinely can\'t get from public materials, directly from someone doing the job', 'Neither question is worth asking', 'Both questions are equally good uses of interview time'],
      correct:1,
      feedback:['Benefits information is usually already publicly available -- asking about it uses valuable interview time on something you could learn elsewhere.','Correct -- questions that surface information you genuinely can\'t find publicly (day-to-day reality, team dynamics, real challenges) make far better use of limited interview time with someone actually doing the job.','Asking thoughtful questions is a genuine opportunity, both to learn and to demonstrate real engagement -- it\'s worth using well.','The value of these two questions is meaningfully different -- one gives you real, hard-to-find insight; the other duplicates public information.'] },
    { id:'company-red-flags', mode:'choice', title:'Recognizing a real red flag vs. a minor concern',
      explain:'Not every imperfection in an interview process is equally serious -- distinguishing genuine red flags from minor, forgivable issues matters.',
      scenario:'An interviewer arrives 5 minutes late due to a scheduling mix-up, apologizes, and the interview proceeds normally. Separately, a different candidate reports that this company has had 3 different people in the SAME role in the past year. Which is the more serious signal?',
      choices:['The late arrival -- punctuality is always the most serious signal', 'The role\'s high turnover -- 3 people in the same role in one year is a real, specific signal potentially indicating a deeper problem with that role or team', 'Neither is worth taking seriously', 'Both are equally serious and equally likely to be random chance'],
      correct:1,
      feedback:['A one-time scheduling mix-up with a genuine apology is a minor, common occurrence -- not a meaningful signal about the company.','Correct -- consistent, high turnover in a SPECIFIC role over a short period is a real, specific pattern that often points to a genuine underlying issue (management, scope, expectations) worth investigating further.','The turnover pattern specifically is worth taking seriously and asking direct follow-up questions about.','These are not equally serious -- one is a common, minor scheduling issue; the other is a specific, repeated pattern that\'s harder to explain away as random chance.'] }
  ];

  function companyDoneKey(id){ return 'companytrack:'+id+':done'; }
  function companyIsDone(id){ try{ return localStorage.getItem(companyDoneKey(id))==='1'; }catch(e){ return false; } }
  function companyEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var companyCurIdx = 0;
  window.companyOpen = function(idx){ companyCurIdx = idx; renderCompanyNav(); renderCompanyLesson(); window.scrollTo(0,0); };
  window.companyNext = function(){ if(companyCurIdx < COMPANY_LESSONS.length-1) window.companyOpen(companyCurIdx+1); };
  window.companyPrev = function(){ if(companyCurIdx > 0) window.companyOpen(companyCurIdx-1); };
  window.companyMarkDone = function(idx){ try{ localStorage.setItem(companyDoneKey(COMPANY_LESSONS[idx].id), '1'); }catch(e){} renderCompanyNav(); };

  function renderCompanyNav(){
    var nav = document.getElementById('companyLessonNav'); if(!nav) return;
    nav.innerHTML = COMPANY_LESSONS.map(function(l, i){
      var done = companyIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===companyCurIdx?'active':'')+'" data-act="companyOpen('+i+')">'+(i+1)+'. '+companyEsc(l.title)+done+'</button>';
    }).join('');
  }
  function companyNavRow(){
    return '<div class="wd-navrow">'
      + (companyCurIdx>0 ? '<button class="wd-btn-ghost" data-act="companyPrev()">&larr; Previous</button>' : '<span></span>')
      + (companyCurIdx<COMPANY_LESSONS.length-1 ? '<button class="wd-btn" data-act="companyNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }
  function renderCompanyLesson(){
    var body = document.getElementById('companyLessonBody'); if(!body) return;
    var l = COMPANY_LESSONS[companyCurIdx];
    var choicesHtml = l.choices.map(function(c, i){
      return '<button class="agent-choice-btn" id="companychoice_'+l.id+'_'+i+'" data-act="companyAnswer(\''+l.id+'\','+i+')">'+companyEsc(c)+'</button>';
    }).join('');
    body.innerHTML = '<div class="wd-lesson-head"><h2>'+trackNumBadge(companyCurIdx+1)+companyEsc(l.title)+'</h2></div>'
        + trackMentalModel(companyEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+companyEsc(l.scenario)+'</p>'
      + '<div>'+choicesHtml+'</div>'
      + '<div class="agent-feedback" id="companyfeedback_'+l.id+'"></div>'
      + '<div class="wd-row"><button class="wd-btn-ghost" data-act="companyMarkDone('+companyCurIdx+')">Mark task done</button></div>'
      + companyNavRow();
  }
  window.companyAnswer = function(lessonId, choiceIdx){
    var l = COMPANY_LESSONS.find(function(x){ return x.id === lessonId; }); if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('companychoice_'+lessonId+'_'+i); if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('companyfeedback_'+lessonId);
    if(fb){ fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong'); fb.textContent = l.feedback[choiceIdx]; }
  };
  var companyBooted = false;
  window._companyBoot = function(){ if(companyBooted) return; companyBooted = true; window.companyOpen(0); };
})();
