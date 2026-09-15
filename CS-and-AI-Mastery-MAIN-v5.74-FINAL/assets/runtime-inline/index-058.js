
(function(){
  // Reuses the SAME sql.js engine already loaded for SQL Mastery and the
  // capstone's Databases milestone (window.SQL) -- a fresh in-memory
  // database per task, not a second engine. 'sql' tasks are checked by
  // running the learner's SQL and comparing the resulting grid to an
  // expected result; 'choice' tasks reuse the same scenario+feedback
  // pattern as AI Agents/Docker.

  var DB_LESSONS = [
    { id:'db-schema-keys', mode:'sql', title:'Schema design: primary & foreign keys',
      explain:'A foreign key links a row in one table to a row in another -- here, each book belongs to one author. Create both tables correctly, then a JOIN should return matched rows.',
      starter:'-- TODO: create authors(id, name) and books(id, title, author_id)\n-- with books.author_id referencing authors.id, insert one of each,\n-- then SELECT the book title with its author\'s name via a JOIN\n',
      solution:'CREATE TABLE authors (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL\n);\nCREATE TABLE books (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  title TEXT NOT NULL,\n  author_id INTEGER NOT NULL,\n  FOREIGN KEY (author_id) REFERENCES authors(id)\n);\nINSERT INTO authors (name) VALUES (\'Ada Lovelace\');\nINSERT INTO books (title, author_id) VALUES (\'Notes on the Analytical Engine\', 1);\nSELECT books.title, authors.name FROM books JOIN authors ON books.author_id = authors.id;',
      hints:['A foreign key column just stores the id of the row it points to -- books.author_id holds an authors.id value.','FOREIGN KEY (author_id) REFERENCES authors(id) documents (and in stricter databases enforces) that link.','JOIN books ON books.author_id = authors.id combines matching rows from both tables.'],
      expectedCols:['title','name'], expectedRowCount:1 },
    { id:'db-normalization', mode:'sql', title:'Fixing a denormalized table',
      explain:'This single table repeats the customer\'s name on every order row -- if "Ana" gets renamed, every row needs updating. Split it into two properly normalized tables instead.',
      starter:'-- Given (conceptually): orders(id, customer_name, customer_email, amount)\n-- repeats customer_name/email on every row.\n-- TODO: create customers(id, name, email) and orders(id, customer_id, amount)\n-- instead, insert one customer and one order, then join them back together\n',
      solution:'CREATE TABLE customers (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  email TEXT NOT NULL\n);\nCREATE TABLE orders (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  customer_id INTEGER NOT NULL,\n  amount REAL NOT NULL\n);\nINSERT INTO customers (name, email) VALUES (\'Ana\', \'ana@example.com\');\nINSERT INTO orders (customer_id, amount) VALUES (1, 49.99);\nSELECT customers.name, orders.amount FROM orders JOIN customers ON orders.customer_id = customers.id;',
      hints:['Customer details (name, email) belong in their OWN table, referenced by id -- not repeated on every order.','orders should store customer_id, not the customer\'s name/email directly.','Two CREATE TABLEs, one INSERT each, then a JOIN to bring the data back together for reading.'],
      expectedCols:['name','amount'], expectedRowCount:1 },
    { id:'db-joins-aggregation', mode:'sql', title:'JOIN + aggregation',
      explain:'Combine two tables and summarize per group -- a bread-and-butter real-world query: total spent per customer, highest spender first.',
      starter:'-- TODO: create customers(id, name) and orders(id, customer_id, amount),\n-- insert: customers (1,\'Ana\'),(2,\'Ben\'); orders (1,1,50.0),(2,1,30.0),(3,2,20.0)\n-- then SELECT each customer\'s name and their TOTAL order amount,\n-- ordered highest total first\n',
      solution:'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);\nCREATE TABLE orders (id INTEGER PRIMARY KEY, customer_id INTEGER, amount REAL);\nINSERT INTO customers VALUES (1,\'Ana\'),(2,\'Ben\');\nINSERT INTO orders VALUES (1,1,50.0),(2,1,30.0),(3,2,20.0);\nSELECT customers.name, SUM(orders.amount) as total\nFROM customers JOIN orders ON customers.id = orders.customer_id\nGROUP BY customers.name\nORDER BY total DESC;',
      hints:['GROUP BY customers.name collapses all of one customer\'s orders into one row.','SUM(orders.amount) totals the amount column within each group.','ORDER BY total DESC puts the highest spender first.'],
      expectedCols:['name','total'], expectedRowCount:2 },
    { id:'db-indexing', mode:'choice', title:'When does an index actually help?',
      explain:'An index speeds up lookups on a column, at the cost of slightly slower writes and extra storage.',
      scenario:'A `users` table has 5 million rows. Queries constantly filter by `email` (e.g. WHERE email = ?), but the table is rarely written to after initial signup. Should you add an index on email?',
      choices:['No -- indexes only matter for small tables', 'Yes -- frequent reads on a rarely-written column is exactly when an index earns its cost', 'No -- only primary keys should ever be indexed', 'Only if the table has fewer than 1,000 rows'],
      correct:1,
      feedback:['Indexes matter MORE as tables grow, not less -- a full scan of 5 million rows on every query is exactly the expensive case an index avoids.','Correct -- this is the ideal case: frequent reads on this column, infrequent writes, so the index\'s lookup speedup far outweighs its small write-time cost.','Any column you filter or join on frequently is a index candidate, not just primary keys.','Indexes become MORE valuable as row count grows -- this reasoning is backwards.'] },
    { id:'db-nosql-decision', mode:'choice', title:'Choosing SQL vs. NoSQL for a real system',
      explain:'This decision comes down to your actual access pattern, not which technology is trendier.',
      scenario:'You\'re building a session store: get/set a user\'s session by session_id, sub-millisecond, no relationships between sessions, no complex queries ever. Which fits better?',
      choices:['A relational SQL database, for its strong consistency guarantees', 'A key-value store (like Redis) -- pure id-based lookup speed, no relational structure needed', 'A document store (like MongoDB), for its flexible schema', 'Neither -- sessions should be stored in application memory only'],
      correct:1,
      feedback:['SQL\'s relational features (joins, constraints) add overhead you\'re not using here -- this access pattern doesn\'t need them.','Correct -- a pure id lookup with no relationships and a need for extreme speed is exactly the key-value store\'s ideal use case.','Document stores earn their keep when you need flexible, nested structure -- a session is typically a flat blob, not a good fit for that flexibility\'s cost.','In-memory-only would lose all sessions on a restart or across multiple server instances -- a real session store needs to persist and be shared.'] },
    { id:'db-postgres-jsonb', mode:'sql', title:'PostgreSQL specifics: SERIAL, RETURNING, JSONB',
      explain:'These three features go beyond standard SQL and are specifically how PostgreSQL is used in real code: SERIAL for auto-incrementing ids, RETURNING to get a row back from an INSERT in one round trip, and JSONB for flexible structured data alongside your normal columns.',
      starter:'-- TODO: create a table `events` with an auto-incrementing id,\n-- a TEXT name column, and a metadata column storing arbitrary JSON,\n-- then insert one row and SELECT it back\n-- (this sandbox runs SQLite, which doesn\'t support SERIAL/JSONB/RETURNING\n-- syntax directly -- write the INTENT using TEXT for metadata; the\n-- Postgres-specific syntax itself is covered in the "PostgreSQL in\n-- practice" lesson)\n',
      solution:'CREATE TABLE events (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  metadata TEXT\n);\nINSERT INTO events (name, metadata) VALUES (\'signup\', \'{"plan": "free"}\');\nSELECT id, name, metadata FROM events;',
      hints:['AUTOINCREMENT here stands in for what SERIAL does in real Postgres -- an auto-incrementing id.','Store the JSON metadata as TEXT in this sandbox (SQLite has no native JSON type) -- the "PostgreSQL in practice" lesson shows the real JSONB column type.','A simple CREATE TABLE + INSERT + SELECT proves the shape works, same as it would with real Postgres syntax.'],
      expectedCols:['id','name','metadata'], expectedRowCount:1 }
  ];

  function dbtKey(id, field){ return 'dbtrack:'+id+':'+field; }
  function dbtSave(id, field, val){ try{ localStorage.setItem(dbtKey(id,field), val); }catch(e){} }
  function dbtLoad(id, field, fallback){ try{ var v=localStorage.getItem(dbtKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function dbtDoneKey(id){ return 'dbtrack:'+id+':done'; }
  function dbtIsDone(id){ try{ return localStorage.getItem(dbtDoneKey(id))==='1'; }catch(e){ return false; } }
  function dbtEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var dbCurIdx = 0;

  window.dbOpen = function(idx){
    dbCurIdx = idx;
    renderDbNav();
    renderDbLesson();
    window.scrollTo(0,0);
  };
  window.dbNext = function(){ if(dbCurIdx < DB_LESSONS.length-1) window.dbOpen(dbCurIdx+1); };
  window.dbPrev = function(){ if(dbCurIdx > 0) window.dbOpen(dbCurIdx-1); };
  window.dbMarkDone = function(idx){
    try{ localStorage.setItem(dbtDoneKey(DB_LESSONS[idx].id), '1'); }catch(e){}
    renderDbNav();
  };

  function renderDbNav(){
    var nav = document.getElementById('dbLessonNav');
    if(!nav) return;
    nav.innerHTML = DB_LESSONS.map(function(l, i){
      var done = dbtIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===dbCurIdx?'active':'')+'" data-act="dbOpen('+i+')">'+(i+1)+'. '+dbtEsc(l.title)+done+'</button>';
    }).join('');
  }

  function navRow(){
    return '<div class="wd-navrow">'
      + (dbCurIdx>0 ? '<button class="wd-btn-ghost" data-act="dbPrev()">&larr; Previous</button>' : '<span></span>')
      + (dbCurIdx<DB_LESSONS.length-1 ? '<button class="wd-btn" data-act="dbNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  function renderDbLesson(){
    var body = document.getElementById('dbLessonBody');
    if(!body) return;
    var l = DB_LESSONS[dbCurIdx];

    if(l.mode === 'choice'){
      var choicesHtml = l.choices.map(function(c, i){
        return '<button class="agent-choice-btn" id="dbchoice_'+l.id+'_'+i+'" data-act="dbAnswer(\''+l.id+'\','+i+')">'+dbtEsc(c)+'</button>';
      }).join('');
      body.innerHTML =
        '<div class="wd-lesson-head"><h2>'+trackNumBadge(dbCurIdx+1)+dbtEsc(l.title)+'</h2></div>'
        + trackMentalModel(dbtEsc(l.explain))
        + '<p style="color:var(--teal,#4fd1c5);font-weight:600">'+dbtEsc(l.scenario)+'</p>'
        + '<div>'+choicesHtml+'</div>'
        + '<div class="agent-feedback" id="dbfeedback_'+l.id+'"></div>'
        + '<div class="wd-row"><button class="wd-btn-ghost" data-act="dbMarkDone('+dbCurIdx+')">Mark task done</button></div>'
        + navRow();
      return;
    }

    // mode === 'sql'
    var savedSql = dbtLoad(l.id, 'sql', l.starter);
    var idBase = 'dbpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="dbRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="dbRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="dbhint_'+l.id+'_'+(i+1)+'">'+dbtEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="dbhint_'+l.id+'_99"><b>Solution:</b><pre>'+dbtEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(dbCurIdx+1)+dbtEsc(l.title)+'</h2></div>'
      + trackMentalModel(dbtEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.sql', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:150px">'+dbtEsc(savedSql)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="dbRunSql(\''+l.id+'\',\''+editId+'\',\''+outId+'\')">&#9654; Run SQL</button>'
        + '<button class="wd-btn-ghost" data-act="dbReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="dbMarkDone('+dbCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+outId+'" class="wd-out">(waiting for the SQL engine to load...)</div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>' + hintBoxes
      + navRow();
    dbEnsureReady(outId);
  }

  function dbEnsureReady(outId, attempt){
    attempt = attempt || 0;
    var out = document.getElementById(outId);
    if(window.SQL){
      if(out && out.textContent.indexOf('waiting') >= 0) out.textContent = 'Ready -- click Run SQL.';
      return;
    }
    if(attempt >= 25){ // ~10s total -- matches the SQL Mastery track's own load-failure message instead of retrying forever
      if(out) out.textContent = 'Could not load the SQL engine (needs internet the first time). On Netlify it works.';
      return;
    }
    if(out) out.textContent = 'Waiting for the SQL engine to finish loading (needs internet the first time; on Netlify this works)...';
    setTimeout(function(){ dbEnsureReady(outId, attempt + 1); }, 400);
  }

  window.dbRunSql = function(lessonId, editId, outId){
    var l = DB_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var sql = (document.getElementById(editId)||{}).value || '';
    dbtSave(lessonId, 'sql', sql);
    var out = document.getElementById(outId);
    if(!out) return;
    if(!window.SQL){ out.innerHTML = '<span class="err">SQL engine not loaded yet.</span>'; return; }
    try{
      var db = new window.SQL.Database(); // fresh db per run -- reruns are idempotent
      var stmts = sql.split(';').map(function(s){ return s.trim(); }).filter(Boolean);
      var lastResult = null;
      stmts.forEach(function(stmt){
        var res = db.exec(stmt + ';');
        if(res && res.length) lastResult = res[0];
      });
      if(!lastResult){ out.textContent = 'Ran successfully -- no SELECT result to show (did your last statement return rows?).'; return; }
      var colsOk = !l.expectedCols || l.expectedCols.every(function(c){ return lastResult.columns.indexOf(c) >= 0; });
      var rowsOk = !l.expectedRowCount || lastResult.values.length === l.expectedRowCount;
      var gridHtml = '<div class="grid-wrap"><table><tr>' + lastResult.columns.map(function(c){ return '<th>'+dbtEsc(c)+'</th>'; }).join('') + '</tr>'
        + lastResult.values.map(function(row){ return '<tr>' + row.map(function(v){ return '<td>'+(v===null?'NULL':dbtEsc(v))+'</td>'; }).join('') + '</tr>'; }).join('')
        + '</table></div>';
      var verdict = (colsOk && rowsOk)
        ? '<div class="dsa-testrow pass"><span>Result shape check</span><span>PASS</span></div>'
        : '<div class="dsa-testrow fail"><span>Result shape check (expected columns: '+dbtEsc((l.expectedCols||[]).join(', '))+', expected rows: '+l.expectedRowCount+')</span><span>FAIL</span></div>';
      out.innerHTML = verdict + gridHtml;
    }catch(e){
      out.innerHTML = '<span class="err">'+dbtEsc(e.message)+'</span>';
    }
  };

  window.dbReset = function(lessonId, editId){
    var l = DB_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    dbtSave(lessonId, 'sql', l.starter);
  };

  window.dbRevealHint = function(lessonId, tier){
    var l = DB_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('dbhint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  window.dbAnswer = function(lessonId, choiceIdx){
    var l = DB_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var isCorrect = choiceIdx === l.correct;
    l.choices.forEach(function(_, i){
      var btn = document.getElementById('dbchoice_'+lessonId+'_'+i);
      if(!btn) return;
      btn.classList.remove('correct','wrong');
      if(i === choiceIdx) btn.classList.add(isCorrect ? 'correct' : 'wrong');
      if(i === l.correct && !isCorrect) btn.classList.add('correct');
    });
    var fb = document.getElementById('dbfeedback_'+lessonId);
    if(fb){
      fb.className = 'agent-feedback show ' + (isCorrect ? 'correct' : 'wrong');
      fb.textContent = l.feedback[choiceIdx];
    }
  };

  var dbBooted = false;
  window._dbBoot = function(){
    if(dbBooted) return;
    dbBooted = true;
    window.dbOpen(0);
  };
})();
