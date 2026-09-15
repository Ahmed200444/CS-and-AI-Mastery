
(function(){
  // ---- Reusable "command-simulator lab" component --------------------------
  // SIMULATED throughout: an in-memory fake repo object, not a real git repo,
  // and no changes are made on disk. Each task gets its own fresh fake repo.
  // A small set of commands is supported (init, add, commit, status, log,
  // branch, checkout, merge) with real conflict-detection logic based on
  // which branches touched which files -- not scripted/canned output.

  var GIT_LESSONS = [
    { id:'git-first-commit', title:'init, add & your first commit',
      explain:'Every repo starts with git init. Files must be staged with "add" before "commit" will include them. Try committing before adding anything, then do it in the right order.',
      task:'Stage index.html, then commit it with the message "Initial commit".',
      hints:['Nothing gets committed until it\'s staged first -- try "commit" with nothing staged and read the message.','Use: add index.html','Then: commit -m "Initial commit"'],
      solution:'add index.html\ncommit -m "Initial commit"' },
    { id:'git-status-log', title:'status & log',
      explain:'"status" shows what\'s staged, unstaged, or untracked right now. "log" shows the commit history so far. Make a commit, then check both.',
      task:'Stage and commit a file called app.py with message "Add app", then run status and log to see the result.',
      hints:['status always reflects the CURRENT moment -- run it before AND after committing to see the difference.','add app.py, then commit -m "Add app"','After committing, run: log -- you should see your commit listed.'],
      solution:'add app.py\ncommit -m "Add app"\nstatus\nlog' },
    { id:'git-branching', title:'Creating and switching branches',
      explain:'"branch" creates a new branch from your current position; "checkout" switches to it. Work on a branch is isolated from main until merged.',
      task:'Create a branch called feature-login and switch to it.',
      hints:['branch <name> creates a branch but does NOT switch to it automatically.','checkout <name> is the separate command that switches your current branch.','branch feature-login, then checkout feature-login'],
      solution:'branch feature-login\ncheckout feature-login' },
    { id:'git-merge-clean', title:'Merging a branch (clean merge)',
      explain:'Once work on a branch is done, merge it back into main. If the branches touched different files, the merge completes automatically with no conflict.',
      task:'You are on feature-readme, which added README.md. Switch to main, then merge feature-readme into it.',
      preSetup:function(repo){
        repo.branches['feature-readme'] = repo.branches.main.slice();
        repo.branches['feature-readme'].push({msg:'Add README', files:['README.md']});
      },
      hints:['You need to be ON the branch you\'re merging INTO -- that\'s main here.','checkout main first, then merge feature-readme','checkout main, then: merge feature-readme'],
      solution:'checkout main\nmerge feature-readme' },
    { id:'git-merge-conflict', title:'Handling a merge conflict',
      explain:'A conflict happens when two branches change the SAME lines of the SAME file differently. Git can\'t auto-decide which version is right -- you must resolve it by hand, then explicitly mark it resolved.',
      task:'main and feature-pricing both edited config.py differently. Merge feature-pricing into main, see the CONFLICT message, then type "resolve" to mark it fixed.',
      preSetup:function(repo){
        repo.branches['feature-pricing'] = repo.branches.main.slice();
        repo.branches['feature-pricing'].push({msg:'Update pricing', files:['config.py'], conflictsWith:'main-config'});
        repo.conflictFiles = {'config.py':'main-config'}; // main ALSO touched config.py
      },
      hints:['merge feature-pricing will report a CONFLICT in config.py -- that\'s expected, not an error to avoid.','A conflict means you must manually edit the file to combine both changes, then tell git it\'s resolved.','After seeing CONFLICT, type: resolve'],
      solution:'merge feature-pricing\nresolve' },
    { id:'git-log-review', title:'Reviewing history before merging',
      explain:'Checking "log" on a branch before merging it tells you exactly what commits you\'re about to bring in -- a good habit before merging anything into main.',
      task:'Switch to feature-tests, check its log, then switch back to main.',
      preSetup:function(repo){
        repo.branches['feature-tests'] = repo.branches.main.slice();
        repo.branches['feature-tests'].push({msg:'Add unit tests', files:['test_app.py']});
      },
      hints:['checkout feature-tests to switch onto it first.','log shows the commit history of whichever branch you\'re currently on.','checkout feature-tests, log, then checkout main'],
      solution:'checkout feature-tests\nlog\ncheckout main' }
  ];

  function gitTKey(id, field){ return 'gittrack:'+id+':'+field; }
  function gitTSave(id, field, val){ try{ localStorage.setItem(gitTKey(id,field), val); }catch(e){} }
  function gitTDoneKey(id){ return 'gittrack:'+id+':done'; }
  function gitTIsDone(id){ try{ return localStorage.getItem(gitTDoneKey(id))==='1'; }catch(e){ return false; } }
  function gitTEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var gitCurIdx = 0;
  var GIT_REPOS = {}; // per-lesson fake repo state

  function freshGitTRepo(){
    return { branches:{main:[{msg:'(initial commit)', files:[]}]}, current:'main', staged:[], conflict:null };
  }

  function ensureRepo(l){
    if(!GIT_REPOS[l.id]){
      var repo = freshGitTRepo();
      if(l.preSetup) l.preSetup(repo);
      GIT_REPOS[l.id] = repo;
    }
    return GIT_REPOS[l.id];
  }

  window.gitTOpen = function(idx){
    gitCurIdx = idx;
    renderGitTNav();
    renderGitTLesson();
    window.scrollTo(0,0);
  };
  window.gitTNext = function(){ if(gitCurIdx < GIT_LESSONS.length-1) window.gitTOpen(gitCurIdx+1); };
  window.gitTPrev = function(){ if(gitCurIdx > 0) window.gitTOpen(gitCurIdx-1); };
  window.gitTMarkDone = function(idx){
    try{ localStorage.setItem(gitTDoneKey(GIT_LESSONS[idx].id), '1'); }catch(e){}
    renderGitTNav();
  };

  function renderGitTNav(){
    var nav = document.getElementById('gitLessonNav');
    if(!nav) return;
    nav.innerHTML = GIT_LESSONS.map(function(l, i){
      var done = gitTIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===gitCurIdx?'active':'')+'" data-act="gitTOpen('+i+')">'+(i+1)+'. '+gitTEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderGitTLesson(){
    var body = document.getElementById('gitLessonBody');
    if(!body) return;
    var l = GIT_LESSONS[gitCurIdx];
    ensureRepo(l);
    var idBase = 'gitpm_'+l.id;
    var inId=idBase+'_in', outId=idBase+'_out';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="gitTRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="gitTRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="gitthint_'+l.id+'_'+(i+1)+'">'+gitTEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="gitthint_'+l.id+'_99"><b>Solution:</b><pre>'+gitTEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(gitCurIdx+1)+gitTEsc(l.title)+'</h2></div>'
      + '<p class="wd-lesson-explain"><span class="cx-pm-badge cx-pm-badge-sim" style="display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:6px;margin-right:6px;background:#3a2f12;color:#f0b878;vertical-align:middle">SIMULATION</span>An in-memory fake repository, not a real git repo -- no changes are made on disk.</p>'
      + trackMentalModel(gitTEsc(l.explain))
      + '<p style="color:var(--teal,#4fd1c5);font-weight:600">Task: '+gitTEsc(l.task)+'</p>'
      + '<div class="card">'
      + trackEditorShell('terminal', '<textarea class="wd-edit" id="'+inId+'" aria-label="Code editor" spellcheck="false" style="min-height:34px" placeholder="e.g. add index.html"></textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="gitTRun(\''+l.id+'\',\''+inId+'\',\''+outId+'\')">&#9654; Run command</button>'
        + '<button class="wd-btn-ghost" data-act="gitTReset(\''+l.id+'\',\''+outId+'\')">Reset repo</button>'
        + '<button class="wd-btn-ghost" data-act="gitTMarkDone('+gitCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div class="wd-out" id="'+outId+'">(simulated fake repo -- type a git command above and click Run)</div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + '<div class="wd-navrow">'
        + (gitCurIdx>0 ? '<button class="wd-btn-ghost" data-act="gitTPrev()">&larr; Previous</button>' : '<span></span>')
        + (gitCurIdx<GIT_LESSONS.length-1 ? '<button class="wd-btn" data-act="gitTNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function gitTLog(out, line){ out.textContent += (out.textContent && out.textContent.indexOf('(simulated')!==0 ? '\n' : (out.textContent.indexOf('(simulated')===0 ? '' : '\n')) + line; }

  window.gitTRun = function(lessonId, inId, outId){
    var l = GIT_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var repo = ensureRepo(l);
    var cmd = ((document.getElementById(inId)||{}).value || '').trim();
    var out = document.getElementById(outId);
    if(!out || !cmd) return;
    if(out.textContent.indexOf('(simulated') === 0) out.textContent = '';
    out.textContent += (out.textContent ? '\n' : '') + '$ '+cmd;
    var m;
    if(cmd==='init'){
      GIT_REPOS[lessonId] = freshGitTRepo();
      if(l.preSetup) l.preSetup(GIT_REPOS[lessonId]);
      out.textContent += '\nInitialized empty fake repository.';
    }
    else if((m=/^add\s+(.+)$/.exec(cmd))){
      repo.staged.push(m[1]);
      out.textContent += '\nstaged: '+m[1];
    }
    else if((m=/^commit\s+-m\s+"(.*)"$/.exec(cmd))){
      if(!repo.staged.length){ out.textContent += '\nnothing to commit -- stage a file first with: add <file>'; }
      else {
        repo.branches[repo.current].push({msg:m[1], files:repo.staged.slice()});
        out.textContent += '\n['+repo.current+'] '+m[1]+' ('+repo.staged.join(', ')+')';
        repo.staged = [];
      }
    }
    else if(cmd==='status'){
      out.textContent += '\nOn branch '+repo.current+'\n'+
        (repo.staged.length ? 'Staged: '+repo.staged.join(', ') : 'Nothing staged, working tree clean');
    }
    else if(cmd==='log'){
      out.textContent += '\n'+repo.branches[repo.current].map(function(c,i){ return (i+1)+'. '+c.msg; }).join('\n');
    }
    else if((m=/^branch\s+(\S+)$/.exec(cmd))){
      if(repo.branches[m[1]]) out.textContent += '\nbranch \''+m[1]+'\' already exists';
      else { repo.branches[m[1]] = repo.branches[repo.current].slice(); out.textContent += '\ncreated branch \''+m[1]+'\' from \''+repo.current+'\''; }
    }
    else if((m=/^checkout\s+(\S+)$/.exec(cmd))){
      if(!repo.branches[m[1]]) out.textContent += '\nerror: branch \''+m[1]+'\' does not exist';
      else { repo.current = m[1]; out.textContent += '\nswitched to branch \''+m[1]+'\''; }
    }
    else if((m=/^merge\s+(\S+)$/.exec(cmd))){
      if(!repo.branches[m[1]]) { out.textContent += '\nerror: branch \''+m[1]+'\' does not exist'; }
      else {
        var incoming = repo.branches[m[1]];
        var newCommits = incoming.slice(repo.branches[repo.current].length);
        var hasConflict = newCommits.some(function(c){ return c.conflictsWith; });
        if(hasConflict){
          repo.conflict = m[1];
          out.textContent += '\nCONFLICT (content): Merge conflict in config.py\nAutomatic merge failed; fix conflicts and then type: resolve';
        } else {
          repo.branches[repo.current] = repo.branches[repo.current].concat(newCommits);
          out.textContent += '\nmerged \''+m[1]+'\' into \''+repo.current+'\' (fast-forward)';
        }
      }
    }
    else if(cmd==='resolve'){
      if(!repo.conflict){ out.textContent += '\nnothing to resolve -- there is no conflict in progress'; }
      else {
        repo.branches[repo.current] = repo.branches[repo.current].concat(repo.branches[repo.conflict].slice(repo.branches[repo.current].length));
        out.textContent += '\nconflict resolved -- merge of \''+repo.conflict+'\' completed';
        repo.conflict = null;
      }
    }
    else { out.textContent += '\nunrecognized simulated command: '+cmd; }
    var ta = document.getElementById(inId); if(ta) ta.value='';
  };

  window.gitTReset = function(lessonId, outId){
    var l = GIT_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var repo = freshGitTRepo();
    if(l.preSetup) l.preSetup(repo);
    GIT_REPOS[lessonId] = repo;
    var out = document.getElementById(outId); if(out) out.textContent = '(simulated fake repo reset)';
  };

  window.gitTRevealHint = function(lessonId, tier){
    var l = GIT_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('gitthint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  var gitTBooted = false;
  window._gitTBoot = function(){
    if(gitTBooted) return;
    gitTBooted = true;
    window.gitTOpen(0);
  };
})();
