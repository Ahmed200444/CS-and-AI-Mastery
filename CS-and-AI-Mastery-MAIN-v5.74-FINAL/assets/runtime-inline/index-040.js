
(function(){
  // A safe, in-memory fake filesystem -- no real disk access, ever. Commands
  // are real (pwd, ls, cd, mkdir, touch, cat, echo redirection, grep, chmod,
  // rm, pipes) and their behavior is genuinely simulated (path resolution,
  // permission strings, piping), not scripted text.

  var LINUX_LESSONS = [
    { id:'linux-navigation', title:'Navigation: pwd, cd, ls',
      explain:'The three commands you\'ll use constantly: pwd shows where you are, cd moves you, ls shows what\'s there.',
      task:'You start in /home/user. Move into a new directory called projects (create it first), then confirm your location.',
      hints:['mkdir creates a directory; cd moves into it.','pwd always shows your current absolute path.','mkdir projects, then cd projects, then pwd'],
      solution:'mkdir projects\ncd projects\npwd' },
    { id:'linux-file-basics', title:'Creating and reading files', 
      explain:'touch creates an empty file; echo "text" > file writes (overwriting); echo "text" >> file appends; cat displays content.',
      task:'Create a file called notes.txt, write "first line" into it, then append "second line", then display it.',
      hints:['> overwrites a file\'s content; >> adds to what\'s already there.','touch isn\'t strictly required before echo > -- echo > creates the file if it doesn\'t exist.','echo "first line" > notes.txt\\necho "second line" >> notes.txt\\ncat notes.txt'],
      solution:'echo "first line" > notes.txt\necho "second line" >> notes.txt\ncat notes.txt' },
    { id:'linux-grep', title:'Searching file content with grep',
      explain:'grep searches text for a pattern and shows only the matching lines -- essential for finding things in large files or command output.',
      task:'A file called log.txt already exists with several lines. Find only the lines containing the word "ERROR".',
      preSetup:function(fs){ fs.files['/home/user/log.txt'] = 'INFO: started\nERROR: connection failed\nINFO: retrying\nERROR: timeout\nINFO: done'; },
      hints:['grep <pattern> <file> prints only the lines that contain that pattern.','The pattern here is exactly the word ERROR.','grep ERROR log.txt'],
      solution:'grep ERROR log.txt' },
    { id:'linux-pipes', title:'Pipes: chaining commands together',
      explain:'A pipe (|) sends one command\'s output directly into the next command\'s input -- the foundation of composing small tools into bigger ones.',
      task:'Without creating any file, pipe the output of echo directly into grep to find just the word "world" in "hello world foo".',
      hints:['The pipe symbol | connects the output of the command on its left to the input of the command on its right.','echo "hello world foo" produces text; grep world filters it.','echo "hello world foo" | grep world'],
      solution:'echo "hello world foo" | grep world' },
    { id:'linux-permissions', title:'File permissions with chmod',
      explain:'A permission string like rwxr-xr-- describes owner/group/other read-write-execute rights. chmod changes them.',
      task:'A script.sh file exists but isn\'t executable yet (rw-r--r--). Make it executable for the owner (rwxr--r--).',
      preSetup:function(fs){ fs.files['/home/user/script.sh'] = '#!/bin/bash\necho hi'; fs.perms['/home/user/script.sh'] = 'rw-r--r--'; },
      hints:['chmod changes the permission string directly in this simulation -- write the exact new string you want.','You want the OWNER portion (first 3 characters) to include x: rwx instead of rw-.','chmod rwxr--r-- script.sh'],
      solution:'chmod rwxr--r-- script.sh' },
    { id:'linux-debug-permission', title:'Debugging: permission denied',
      explain:'A permission error means the FILE\'S permission string doesn\'t allow the action you\'re trying -- fixing it means changing that string, not retrying the same command.',
      task:'Trying to cat a file called secret.txt fails with a permission error because it has no read permission for you (---------). Fix it so cat succeeds.',
      preSetup:function(fs){ fs.files['/home/user/secret.txt'] = 'top secret'; fs.perms['/home/user/secret.txt'] = '---------'; },
      hints:['Run cat secret.txt first and read the actual error message.','The permission string has no r anywhere -- that\'s why every read fails.','chmod r--------- secret.txt\\ncat secret.txt'],
      solution:'chmod r--------- secret.txt\ncat secret.txt' }
  ];

  function linuxKey(id, field){ return 'linuxtrack:'+id+':'+field; }
  function linuxSave(id, field, val){ try{ localStorage.setItem(linuxKey(id,field), val); }catch(e){} }
  function linuxDoneKey(id){ return 'linuxtrack:'+id+':done'; }
  function linuxIsDone(id){ try{ return localStorage.getItem(linuxDoneKey(id))==='1'; }catch(e){ return false; } }
  function linuxEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var linuxCurIdx = 0;
  var LINUX_STATE = {};

  function freshFs(){
    return { files:{}, dirs:{'/':true, '/home':true, '/home/user':true}, cwd:'/home/user', perms:{} };
  }

  function ensureFs(l){
    var key = l.id;
    if(!LINUX_STATE[key]){
      var fs = freshFs();
      if(l.preSetup) l.preSetup(fs);
      LINUX_STATE[key] = fs;
    }
    return LINUX_STATE[key];
  }

  function resolvePath(cwd, path){
    var parts;
    if(path.indexOf('/') === 0){
      parts = path.split('/').filter(Boolean);
    } else {
      parts = cwd.split('/').filter(Boolean).concat(path.split('/').filter(Boolean));
    }
    var stack = [];
    parts.forEach(function(p){
      if(p === '..'){ if(stack.length) stack.pop(); }
      else if(p === '.'){ /* no-op */ }
      else { stack.push(p); }
    });
    return stack.length ? '/' + stack.join('/') : '/';
  }

  window.linuxOpen = function(idx){
    linuxCurIdx = idx;
    renderLinuxNav();
    renderLinuxLesson();
    window.scrollTo(0,0);
  };
  window.linuxNext = function(){ if(linuxCurIdx < LINUX_LESSONS.length-1) window.linuxOpen(linuxCurIdx+1); };
  window.linuxPrev = function(){ if(linuxCurIdx > 0) window.linuxOpen(linuxCurIdx-1); };
  window.linuxMarkDone = function(idx){
    try{ localStorage.setItem(linuxDoneKey(LINUX_LESSONS[idx].id), '1'); }catch(e){}
    renderLinuxNav();
  };

  function renderLinuxNav(){
    var nav = document.getElementById('linuxLessonNav');
    if(!nav) return;
    nav.innerHTML = LINUX_LESSONS.map(function(l, i){
      var done = linuxIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===linuxCurIdx?'active':'')+'" data-act="linuxOpen('+i+')">'+(i+1)+'. '+linuxEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderLinuxLesson(){
    var body = document.getElementById('linuxLessonBody');
    if(!body) return;
    var l = LINUX_LESSONS[linuxCurIdx];
    ensureFs(l);
    var idBase = 'linuxpm_'+l.id;
    var inId=idBase+'_in', outId=idBase+'_out';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="linuxRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="linuxRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="linuxhint_'+l.id+'_'+(i+1)+'">'+linuxEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="linuxhint_'+l.id+'_99"><b>Solution:</b><pre>'+linuxEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(linuxCurIdx+1)+linuxEsc(l.title)+'</h2></div>'
      + '<p class="wd-lesson-explain"><span class="cx-pm-badge cx-pm-badge-sim" style="display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:6px;margin-right:6px;background:#3a2f12;color:#f0b878;vertical-align:middle">SIMULATION</span>A safe, in-memory fake filesystem -- no real disk or shell access, ever.</p>'
      + trackMentalModel(linuxEsc(l.explain))
      + '<p style="color:var(--teal,#4fd1c5);font-weight:600">Task: '+linuxEsc(l.task)+'</p>'
      + '<div class="card">'
      + trackEditorShell('terminal', '<textarea class="wd-edit" id="'+inId+'" aria-label="Code editor" spellcheck="false" style="min-height:34px" placeholder="e.g. pwd"></textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="linuxRun(\''+l.id+'\',\''+inId+'\',\''+outId+'\')">&#9654; Run command</button>'
        + '<button class="wd-btn-ghost" data-act="linuxReset(\''+l.id+'\',\''+outId+'\')">Reset filesystem</button>'
        + '<button class="wd-btn-ghost" data-act="linuxMarkDone('+linuxCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div class="wd-out" id="'+outId+'">(simulated shell -- type a command above and click Run)</div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + '<div class="wd-navrow">'
        + (linuxCurIdx>0 ? '<button class="wd-btn-ghost" data-act="linuxPrev()">&larr; Previous</button>' : '<span></span>')
        + (linuxCurIdx<LINUX_LESSONS.length-1 ? '<button class="wd-btn" data-act="linuxNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function linuxLog(out, line){ out.textContent += (out.textContent && out.textContent.indexOf('(simulated')!==0 ? '\n' : '') + line; }

  window.linuxRun = function(lessonId, inId, outId){
    var l = LINUX_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var fs = ensureFs(l);
    var cmd = ((document.getElementById(inId)||{}).value || '').trim();
    var out = document.getElementById(outId);
    if(!out || !cmd) return;
    if(out.textContent.indexOf('(simulated') === 0) out.textContent = '';
    out.textContent += (out.textContent ? '\n' : '') + '$ ' + cmd;

    // support a single pipe: "cmdA | cmdB"
    var pipeParts = cmd.split('|').map(function(s){ return s.trim(); });
    var pipedInput = null;
    var result;
    pipeParts.forEach(function(part, idx){
      result = execCmd(fs, part, pipedInput);
      pipedInput = result;
    });
    out.textContent += '\n' + (result === null || result === undefined ? '' : result);
    var ta = document.getElementById(inId); if(ta) ta.value = '';
  };

  function execCmd(fs, cmdStr, stdin){
    var m;
    if(cmdStr === 'pwd'){ return fs.cwd; }
    if((m = /^cd\s+(\S+)$/.exec(cmdStr))){
      var target = resolvePath(fs.cwd, m[1]);
      if(!fs.dirs[target]) return 'cd: no such directory: ' + m[1];
      fs.cwd = target; return '';
    }
    if((m = /^mkdir\s+(\S+)$/.exec(cmdStr))){
      var p = resolvePath(fs.cwd, m[1]);
      fs.dirs[p] = true; return '';
    }
    if(cmdStr === 'ls'){
      var prefix = fs.cwd === '/' ? '/' : fs.cwd + '/';
      var entries = {};
      Object.keys(fs.dirs).forEach(function(d){
        if(d !== fs.cwd && d.indexOf(prefix) === 0 && d.slice(prefix.length).indexOf('/') === -1) entries[d.slice(prefix.length)] = true;
      });
      Object.keys(fs.files).forEach(function(f){
        if(f.indexOf(prefix) === 0 && f.slice(prefix.length).indexOf('/') === -1) entries[f.slice(prefix.length)] = true;
      });
      return Object.keys(entries).join('  ') || '(empty)';
    }
    if((m = /^echo\s+"([^"]*)"\s*(>>|>)\s*(\S+)$/.exec(cmdStr))){
      var text = m[1], mode = m[2], fname = m[3];
      var fpath = resolvePath(fs.cwd, fname);
      if(mode === '>' || !fs.files[fpath]) fs.files[fpath] = text;
      else fs.files[fpath] += '\n' + text;
      return '';
    }
    if((m = /^echo\s+"([^"]*)"$/.exec(cmdStr))){
      return m[1];
    }
    if((m = /^cat\s+(\S+)$/.exec(cmdStr))){
      var cpath = resolvePath(fs.cwd, m[1]);
      var perm = fs.perms[cpath];
      if(perm && perm[0] !== 'r') return 'cat: ' + m[1] + ': Permission denied';
      if(!(cpath in fs.files)) return 'cat: ' + m[1] + ': No such file';
      return fs.files[cpath];
    }
    if((m = /^grep\s+(\S+)\s+(\S+)$/.exec(cmdStr))){
      var pattern = m[1], gfname = m[2];
      var gpath = resolvePath(fs.cwd, gfname);
      if(!(gpath in fs.files)) return 'grep: ' + gfname + ': No such file';
      return fs.files[gpath].split('\n').filter(function(line){ return line.indexOf(pattern) >= 0; }).join('\n');
    }
    if((m = /^grep\s+(\S+)$/.exec(cmdStr)) && stdin !== null && stdin !== undefined){
      var p2 = m[1];
      return stdin.split('\n').filter(function(line){ return line.indexOf(p2) >= 0; }).join('\n');
    }
    if((m = /^chmod\s+(\S+)\s+(\S+)$/.exec(cmdStr))){
      var chpath = resolvePath(fs.cwd, m[2]);
      fs.perms[chpath] = m[1];
      return '';
    }
    if((m = /^rm\s+(\S+)$/.exec(cmdStr))){
      var rpath = resolvePath(fs.cwd, m[1]);
      delete fs.files[rpath];
      return '';
    }
    return 'command not recognized in this simulation: ' + cmdStr;
  }

  window.linuxReset = function(lessonId, outId){
    var l = LINUX_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var fs = freshFs();
    if(l.preSetup) l.preSetup(fs);
    LINUX_STATE[lessonId] = fs;
    var out = document.getElementById(outId);
    if(out) out.textContent = '(simulated shell reset)';
  };

  window.linuxRevealHint = function(lessonId, tier){
    var l = LINUX_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('linuxhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  var linuxBooted = false;
  window._linuxBoot = function(){
    if(linuxBooted) return;
    linuxBooted = true;
    window.linuxOpen(0);
  };
})();
