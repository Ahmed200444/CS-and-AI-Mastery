
(function(){
  // ---- Reuses the shared Python runner verbatim -----------------------------
  // Calls the SAME global runEditor()/getPy()/RUN_HARNESS every other runnable
  // exercise on the platform uses -- no second Python runtime. These tasks are
  // exploratory (cleaning, filtering, grouping) rather than single-answer, so
  // they use plain Run + read-the-output, like the platform's original
  // Data Science runnable exercises, not an auto-graded test harness.

  var DSCI_LESSONS = [
    { id:'dsci-numpy-basics', title:'NumPy array basics',
      explain:'A NumPy array is a fast, fixed-type container for numbers. Unlike a plain Python list, math operations apply element-wise automatically -- no manual loop needed.',
      starter:'import numpy as np\n\ndata = np.array([12, 15, 14, 22, 15, 16])\n\n# TODO: print the mean, and the array with 10 added to every element\n',
      solution:'import numpy as np\n\ndata = np.array([12, 15, 14, 22, 15, 16])\nprint(data.mean())\nprint(data + 10)',
      hints:['.mean() computes the average directly on the array.','Adding a number to a NumPy array adds it to every element at once -- no loop needed.','print(data.mean()) then print(data + 10)'] },
    { id:'dsci-numpy-filter', title:'Filtering with boolean masks',
      explain:'You can filter a NumPy array by writing a condition directly (like data > 15) -- this produces a mask of True/False values, which you then use to select only the matching elements.',
      starter:'import numpy as np\n\ndata = np.array([12, 15, 14, 22, 15, 16, 30])\n\n# TODO: print only the values greater than 15\n',
      solution:'import numpy as np\n\ndata = np.array([12, 15, 14, 22, 15, 16, 30])\nprint(data[data > 15])',
      hints:['data > 15 produces an array of True/False values, one per element.','Using that boolean array as an index (data[mask]) keeps only the True positions.','print(data[data > 15])'] },
    { id:'dsci-pandas-basics', title:'Pandas DataFrame basics',
      explain:'A DataFrame is a table: rows and named columns, built on top of NumPy. You can view its shape, column names, and the first few rows to get oriented quickly.',
      starter:'import pandas as pd\n\ndf = pd.DataFrame({\n    "name": ["Ana", "Ben", "Cleo", "Dan"],\n    "score": [88, 92, 79, 95]\n})\n\n# TODO: print df.shape, then df.columns.tolist(), then df.head(2)\n',
      solution:'import pandas as pd\n\ndf = pd.DataFrame({\n    "name": ["Ana", "Ben", "Cleo", "Dan"],\n    "score": [88, 92, 79, 95]\n})\nprint(df.shape)\nprint(df.columns.tolist())\nprint(df.head(2))',
      hints:['.shape returns (rows, columns) as a tuple.','.columns.tolist() gives you the column names as a plain list.','.head(2) shows just the first 2 rows.'] },
    { id:'dsci-cleaning', title:'Cleaning missing data',
      explain:'Real data often has missing values (NaN). dropna() removes rows with any missing value; fillna(value) replaces missing values with something specific instead. Which is right depends on the situation.',
      starter:'import pandas as pd\nimport numpy as np\n\ndf = pd.DataFrame({\n    "name": ["Ana", "Ben", "Cleo", "Dan"],\n    "score": [88, np.nan, 79, 95]\n})\n\n# TODO: print the DataFrame with the missing score filled in as 0,\n# then separately print it with rows containing any missing value dropped\n',
      solution:'import pandas as pd\nimport numpy as np\n\ndf = pd.DataFrame({\n    "name": ["Ana", "Ben", "Cleo", "Dan"],\n    "score": [88, np.nan, 79, 95]\n})\nprint(df.fillna(0))\nprint(df.dropna())',
      hints:['fillna(0) replaces every NaN with 0, keeping all rows.','dropna() removes any row that has at least one NaN, changing the row count.','print(df.fillna(0)) then print(df.dropna())'] },
    { id:'dsci-groupby', title:'Grouping & aggregating',
      explain:'groupby(column) splits a DataFrame into groups sharing the same value in that column; calling an aggregate like .mean() afterward computes it separately per group.',
      starter:'import pandas as pd\n\ndf = pd.DataFrame({\n    "dept": ["eng", "eng", "sales", "sales"],\n    "salary": [90000, 95000, 70000, 72000]\n})\n\n# TODO: print the average salary per department\n',
      solution:'import pandas as pd\n\ndf = pd.DataFrame({\n    "dept": ["eng", "eng", "sales", "sales"],\n    "salary": [90000, 95000, 70000, 72000]\n})\nprint(df.groupby("dept")["salary"].mean())',
      hints:['groupby("dept") groups rows sharing the same dept value.','Chain ["salary"] to pick which column to aggregate, then .mean() to average it.','df.groupby("dept")["salary"].mean()'] },
    { id:'dsci-summary-stats', title:'Summary statistics',
      explain:'.describe() gives you count, mean, std, min, max, and quartiles for numeric columns in one call -- a fast way to get oriented on a new dataset. .value_counts() counts how often each value appears in a column.',
      starter:'import pandas as pd\n\ndf = pd.DataFrame({\n    "dept": ["eng", "eng", "sales", "sales", "eng"],\n    "salary": [90000, 95000, 70000, 72000, 88000]\n})\n\n# TODO: print df["salary"].describe(), then df["dept"].value_counts()\n',
      solution:'import pandas as pd\n\ndf = pd.DataFrame({\n    "dept": ["eng", "eng", "sales", "sales", "eng"],\n    "salary": [90000, 95000, 70000, 72000, 88000]\n})\nprint(df["salary"].describe())\nprint(df["dept"].value_counts())',
      hints:['.describe() works on a single column (a Series), giving count/mean/std/min/max/quartiles.','.value_counts() counts how many times each unique value appears.','df["salary"].describe() then df["dept"].value_counts()'] }
  ];

  function dsciKey(id, field){ return 'dscitrack:'+id+':'+field; }
  function dsciSave(id, field, val){ try{ localStorage.setItem(dsciKey(id,field), val); }catch(e){} }
  function dsciLoad(id, field, fallback){ try{ var v=localStorage.getItem(dsciKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function dsciDoneKey(id){ return 'dscitrack:'+id+':done'; }
  function dsciIsDone(id){ try{ return localStorage.getItem(dsciDoneKey(id))==='1'; }catch(e){ return false; } }
  function dsciEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var dsciCurIdx = 0;

  window.dsciOpen = function(idx){
    dsciCurIdx = idx;
    renderDsciNav();
    renderDsciLesson();
    window.scrollTo(0,0);
  };
  window.dsciNext = function(){ if(dsciCurIdx < DSCI_LESSONS.length-1) window.dsciOpen(dsciCurIdx+1); };
  window.dsciPrev = function(){ if(dsciCurIdx > 0) window.dsciOpen(dsciCurIdx-1); };
  window.dsciMarkDone = function(idx){
    try{ localStorage.setItem(dsciDoneKey(DSCI_LESSONS[idx].id), '1'); }catch(e){}
    renderDsciNav();
  };

  function renderDsciNav(){
    var nav = document.getElementById('dsciLessonNav');
    if(!nav) return;
    nav.innerHTML = DSCI_LESSONS.map(function(l, i){
      var done = dsciIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===dsciCurIdx?'active':'')+'" data-act="dsciOpen('+i+')">'+(i+1)+'. '+dsciEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderDsciLesson(){
    var body = document.getElementById('dsciLessonBody');
    if(!body) return;
    var l = DSCI_LESSONS[dsciCurIdx];
    var savedCode = dsciLoad(l.id, 'code', l.starter);
    var idBase = 'dscipm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="dsciRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="dsciRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="dscihint_'+l.id+'_'+(i+1)+'">'+dsciEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="dscihint_'+l.id+'_99"><b>Solution:</b><pre>'+dsciEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(dsciCurIdx+1)+dsciEsc(l.title)+'</h2></div>'
      + trackMentalModel(dsciEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:130px">'+dsciEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="dsciRun(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run</button>'
        + '<button class="wd-btn-ghost" data-act="dsciReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="dsciMarkDone('+dsciCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + '<div class="wd-navrow">'
        + (dsciCurIdx>0 ? '<button class="wd-btn-ghost" data-act="dsciPrev()">&larr; Previous</button>' : '<span></span>')
        + (dsciCurIdx<DSCI_LESSONS.length-1 ? '<button class="wd-btn" data-act="dsciNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  // Delegates to the SAME shared runEditor() already defined earlier in the
  // page (used by every legacy runnable exercise) -- deliberately not
  // reimplemented here, to avoid a second Python execution path.
  window.dsciRun = function(lessonId, editId, outId, statusId){
    var ta = document.getElementById(editId);
    if(ta) dsciSave(lessonId, 'code', ta.value);
    if(typeof runEditor === 'function') runEditor(editId, outId, statusId);
  };

  window.dsciReset = function(lessonId, editId){
    var l = DSCI_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    dsciSave(lessonId, 'code', l.starter);
  };

  window.dsciRevealHint = function(lessonId, tier){
    var l = DSCI_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('dscihint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  var dsciBooted = false;
  window._dsciBoot = function(){
    if(dsciBooted) return;
    dsciBooted = true;
    window.dsciOpen(0);
  };
})();
