
/* ---------------- three databases ---------------- */
let coreDb=null, schoolDb=null, companyDb=null, ready=false;
window.dmSqlStatus = function(){ return ready ? 'loaded' : 'not loaded yet'; };
const CORE_SCHEMA=`
CREATE TABLE Customers (customer_id INTEGER, first_name TEXT, last_name TEXT, age INTEGER, country TEXT);
INSERT INTO Customers VALUES (1,'John','Doe',31,'USA'),(2,'Robert','Luna',22,'USA'),(3,'David','Robinson',22,'UK'),(4,'John','Reinhardt',25,'UK'),(5,'Betty','Doe',28,'UAE');
CREATE TABLE Orders (order_id INTEGER, item TEXT, amount INTEGER, customer_id INTEGER);
INSERT INTO Orders VALUES (1,'Keyboard',400,4),(2,'Mouse',300,4),(3,'Monitor',12000,3),(4,'Keyboard',400,1),(5,'Mousepad',250,2);
CREATE TABLE Shippings (shipping_id INTEGER, status TEXT, customer INTEGER);
INSERT INTO Shippings VALUES (1,'Pending',2),(2,'Pending',4),(3,'Delivered',3),(4,'Pending',5),(5,'Delivered',1);
CREATE TABLE Employees (emp_id INTEGER, name TEXT, department TEXT, salary INTEGER);
INSERT INTO Employees VALUES (1,'Alice','Engineering',9000),(2,'Bob','Engineering',7500),(3,'Carol','Sales',7500),(4,'Dan','Sales',6000),(5,'Eve','Marketing',9000),(6,'Frank','Engineering',5000);
`;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function buildSchool(db){
  db.run(`CREATE TABLE students (student_id INTEGER, name TEXT, gender TEXT, major TEXT, enrollment_year INTEGER);
          CREATE TABLE courses (course_id INTEGER, title TEXT, department TEXT, credits INTEGER);
          CREATE TABLE enrollments (enrollment_id INTEGER, student_id INTEGER, course_id INTEGER, semester TEXT, score INTEGER);`);
  const r=mulberry32(42),pick=a=>a[Math.floor(r()*a.length)];
  const majors=["Computer Science","Mathematics","Biology","Business","Physics","Economics","Psychology","Engineering"];
  const depts=["CS","MATH","BIO","BUS","PHYS","ECON","PSY","ENG"];
  const firsts=["Liam","Noor","Aisha","Omar","Sara","Yusuf","Mia","Zara","Ali","Lena","Ravi","Emma","Hassan","Tara","Jack","Nina"];
  const lasts=["Khan","Smith","Ali","Patel","Chen","Garcia","Haddad","Nguyen","Kim","Silva","Okafor","Rossi"];
  db.run("BEGIN");
  let st=db.prepare("INSERT INTO students VALUES (?,?,?,?,?)");
  for(let i=1;i<=2000;i++)st.run([i,`${pick(firsts)} ${pick(lasts)}`,pick(["M","F"]),pick(majors),2020+Math.floor(r()*6)]);st.free();
  const titles=["Intro","Advanced","Applied","Theory of","Foundations of","Seminar in"],subj=["Algorithms","Calculus","Genetics","Marketing","Mechanics","Microecon","Cognition","Circuits","Databases","Statistics"];
  let cs=db.prepare("INSERT INTO courses VALUES (?,?,?,?)"),cid=1;
  for(const d of depts)for(let k=0;k<5;k++)cs.run([cid++,`${pick(titles)} ${pick(subj)}`,d,pick([3,3,4])]);cs.free();const nc=cid-1;
  let es=db.prepare("INSERT INTO enrollments VALUES (?,?,?,?,?)"),eid=1,sems=["2023F","2024S","2024F","2025S"];
  for(let s=1;s<=2000;s++){const m=3+Math.floor(r()*8);for(let k=0;k<m;k++)es.run([eid++,s,1+Math.floor(r()*nc),pick(sems),45+Math.floor(r()*56)]);}es.free();db.run("COMMIT");
}
function buildCompany(db){
  db.run(`CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, name TEXT, email TEXT, country TEXT, signup_date TEXT);
          CREATE TABLE products (product_id INTEGER PRIMARY KEY, name TEXT, category TEXT, price REAL, stock INTEGER);
          CREATE TABLE orders (order_id INTEGER PRIMARY KEY, customer_id INTEGER, order_date TEXT, status TEXT);
          CREATE TABLE order_items (item_id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER, quantity INTEGER, unit_price REAL);
          CREATE TABLE txn_demo (id INTEGER PRIMARY KEY, name TEXT);
          INSERT INTO txn_demo VALUES (1,'row one'),(2,'row two'),(3,'row three');`);
  const r=mulberry32(7),pick=a=>a[Math.floor(r()*a.length)],pad=n=>String(n).padStart(2,'0');
  const countries=["USA","UK","UAE","India","Germany","Brazil","Japan","Canada"],cats=["Electronics","Books","Home","Toys","Sports","Beauty"];
  db.run("BEGIN");
  let cs=db.prepare("INSERT INTO customers VALUES (?,?,?,?,?)");
  for(let i=1;i<=3000;i++){const y=pick([2023,2024,2025]);cs.run([i,`Cust${i}`,`user${i}@mail.com`,pick(countries),`${y}-${pad(1+Math.floor(r()*12))}-${pad(1+Math.floor(r()*28))}`]);}cs.free();
  const prices=[];let ps=db.prepare("INSERT INTO products VALUES (?,?,?,?,?)");
  for(let i=1;i<=200;i++){const pr=Math.round((5+r()*495)*100)/100;prices[i]=pr;ps.run([i,`Product ${i}`,pick(cats),pr,Math.floor(r()*500)]);}ps.free();
  const ordering=[];for(let i=1;i<=3000;i++)if(r()<0.8)ordering.push(i);
  let os=db.prepare("INSERT INTO orders VALUES (?,?,?,?)"),is=db.prepare("INSERT INTO order_items VALUES (?,?,?,?,?)"),oid=1,iid=1,stat=["completed","completed","completed","cancelled","pending"];
  for(let k=0;k<12000;k++){const cid=ordering[Math.floor(r()*ordering.length)],y=pick([2023,2024,2025]);
    os.run([oid,cid,`${y}-${pad(1+Math.floor(r()*12))}-${pad(1+Math.floor(r()*28))}`,pick(stat)]);
    const lines=1+Math.floor(r()*4);for(let l=0;l<lines;l++){const pid=1+Math.floor(r()*200);is.run([iid++,oid,pid,1+Math.floor(r()*5),prices[pid]]);}oid++;}
  os.free();is.free();db.run("COMMIT");
}
function dbFor(n){return n==='school'?schoolDb:n==='company'?companyDb:coreDb;}
function exec(n,sql){const db=dbFor(n);if(!db)return{error:'SQL needs internet the first time to load; on Netlify this works.'};try{const res=db.exec(sql);if(!res.length)return{cols:[],rows:[],empty:true};return{cols:res[0].columns,rows:res[0].values};}catch(e){return{error:e.message};}}

function sqlStatusError(message){
  const s=document.getElementById('dbstatus');
  if(s){s.className='status-chip status-err';s.textContent=message||'⚠ Could not load the SQL engine. All lesson content still displays.';}
}
function startSqlEngine(){
  function boot(){
    if(typeof initSqlJs!=='function'){sqlStatusError('⚠ Could not load the SQL engine. All lesson content still displays.');return;}
    initSqlJs({locateFile:f=>`/runtime/sql/${f}`}).then(SQL=>{
      window.SQL=SQL;
      coreDb=new SQL.Database();coreDb.run(CORE_SCHEMA);
      schoolDb=new SQL.Database();buildSchool(schoolDb);
      companyDb=new SQL.Database();buildCompany(companyDb);
      ready=true;
      const s=document.getElementById('dbstatus');if(s){s.className='status-chip status-ready';
      const e=companyDb.exec("SELECT COUNT(*) FROM order_items")[0].values[0][0];
      s.textContent=`✓ Ready — 3 databases loaded (teaching · 2,000 students · ${Number(e).toLocaleString()} order-items). Everything runs live.`;}
      buildInline();nextQuestion();
    }).catch(err=>{sqlStatusError('⚠ Could not load the SQL engine. Check your internet connection; all lesson content still displays.');console.error(err);});
  }
  if(typeof initSqlJs==='function'){boot();return;}
  const existing=document.querySelector('script[data-csai-sqljs]');
  if(existing){existing.addEventListener('load',boot,{once:true});return;}
  const status=document.getElementById('dbstatus');if(status){status.className='status-chip';status.textContent='Loading SQL engine…';}
  const script=document.createElement('script');
  script.src='/runtime/sql/sql-wasm.js';
  script.async=true;script.dataset.csaiSqljs='1';
  script.addEventListener('load',boot,{once:true});
  script.addEventListener('error',()=>sqlStatusError('⚠ Could not load the SQL engine. Check your internet connection; all lesson content still displays.'),{once:true});
  document.head.appendChild(script);
}
startSqlEngine();

/* ---------------- shared helpers ---------------- */
function esc(s){return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function grid(r){
  if(r.error)return`<div class="verdict v-err">Error: ${esc(r.error)}</div>`;
  if(r.empty||!r.rows.length)return`<div style="color:var(--sub);padding:4px 2px">Ran fine — 0 rows.</div>`;
  let h='<div class="grid-wrap"><table><tr>';r.cols.forEach(c=>h+=`<th>${esc(c)}</th>`);h+='</tr>';
  r.rows.slice(0,50).forEach(row=>{h+='<tr>';row.forEach(v=>h+=`<td>${v===null?'<span style="color:#999">NULL</span>':esc(v)}</td>`);h+='</tr>';});
  h+='</table></div>';if(r.rows.length>50)h+=`<div style="font-size:.78rem;color:var(--sub);margin-top:4px">…first 50 of ${r.rows.length} rows</div>`;return h;
}
function norm(r,ordered){const rows=r.rows.map(x=>JSON.stringify(x));return ordered?rows.join('||'):rows.slice().sort().join('||');}
function runPG(dbn,inId,outId){document.getElementById(outId).innerHTML=grid(exec(dbn,document.getElementById(inId).value));}
function tg(id){const e=document.getElementById(id);if(e)e.style.display=e.style.display==='none'?'block':'none';}

/* ---------------- state ---------------- */
const BANK=JSON.parse(document.getElementById('bank').textContent);
const TOPICS=[...new Set(BANK.map(q=>q.topic))];
const LS='sqlmastery_all_v1';
let stats={},solvedIds={},challengeMode=false;
function loadState(){try{const r=localStorage.getItem(LS);if(r){const o=JSON.parse(r);stats=o.stats||{};solvedIds=o.solved||{};}}catch(e){}}
function saveState(){try{localStorage.setItem(LS,JSON.stringify({stats,solved:solvedIds}));}catch(e){}}
function tstat(t){if(!stats[t])stats[t]={att:0,correct:0,recent:[]};return stats[t];}
function acc(t){const s=stats[t];return(!s||!s.att)?null:s.correct/s.att;}
function racc(t){const s=stats[t];return(!s||!s.recent.length)?null:s.recent.reduce((a,b)=>a+b,0)/s.recent.length;}
function mastered(t){const s=stats[t];if(!s)return false;const ra=racc(t);const hard=BANK.some(q=>q.topic===t&&q.level===3&&solvedIds[q.id]);return s.correct>=4&&ra!==null&&ra>=0.8&&hard;}

/* ---------------- grading (shared by lab + inline) ---------------- */
function gradeAnswer(q,userSql,box){
  if(!userSql.trim()){box.innerHTML='<div class="verdict v-bad">Write a query first.</div>';return;}
  const ur=exec(q.db,userSql);
  if(ur.error){box.innerHTML=grid(ur)+tutorHTML(q);return;}
  const refs=[q.sol].concat(q.alt||[]);let ok=false;
  for(const rs of refs){const rr=exec(q.db,rs);if(rr.error)continue;if(norm(ur,q.order)===norm(rr,q.order)){ok=true;break;}}
  const s=tstat(q.topic);s.att++;s.recent.push(ok?1:0);if(s.recent.length>5)s.recent.shift();
  if(ok){s.correct++;solvedIds[q.id]=true;if(window.cxLogActivity) window.cxLogActivity('exercises', 1);}
  saveState();refreshMastery();refreshDash();
  const why = (ok && q.whyItWorks) ? `<div style="margin-top:8px;font-size:.87rem"><b>Why this works:</b> ${esc(q.whyItWorks)}</div>` : '';
  box.innerHTML=grid(ur)+(ok?`<div class="verdict v-ok">✓ Correct — matches the expected result.${mastered(q.topic)?' You\'ve <b>mastered</b> '+esc(q.topic)+'!':''}${why}</div>`
    :`<div class="verdict v-bad">Not matching yet — check columns &amp; rows vs the question.</div>`+tutorHTML(q));
  sqlRenderCheckpoints();
}
function tutorHTML(q){return `<div class="tutor"><b>Tutor:</b> ${esc(q.tutor)}<br><span style="color:var(--sub)">Pro approach: name one answer row, find which table each column is in, decide WHERE vs HAVING, then type.</span></div>`;}
let _sqlHintLevel={};
function sqlNextHint(id){
  const q=BANK.find(x=>x.id===id);
  const hints = q.hints || (q.hint ? [q.hint] : []);
  const cur=_sqlHintLevel[id]||0;
  if(cur>=hints.length)return;
  const next=cur+1;
  _sqlHintLevel[id]=next;
  const box=document.getElementById('h-'+id);
  box.style.display='';
  box.innerHTML=hints.slice(0,next).map((h,i)=>'<div style="margin-bottom:6px"><b>Hint '+(i+1)+':</b> '+esc(h)+'</div>').join('')+(q.diff?'<br><b>MySQL vs SQLite:</b> '+esc(q.diff):'');
  const btn=document.getElementById('hbtn-'+id);
  if(btn) btn.textContent='💡 Hint ('+next+'/'+hints.length+')'+(next>=hints.length?' — all shown':'');
}
function sqlRenderCheckpoints(){
  document.querySelectorAll('.sql-checkpoint').forEach(box=>{
    const topic=box.getAttribute('data-topic');
    const items=BANK.filter(q=>q.topic===topic);
    if(!items.length)return;
    const solved=items.filter(q=>solvedIds[q.id]).length;
    const need=Math.min(items.length, Math.ceil(items.length*0.7))||items.length;
    const met=solved>=need;
    box.innerHTML = met
      ? '<div class="checkpoint-met">🏆 Mastery checkpoint reached — '+solved+'/'+items.length+' solved. Move on whenever you\'re ready.</div>'
      : '<div class="checkpoint-pending">Mastery checkpoint: solve '+need+' of '+items.length+' exercises above to mark this lesson mastered — you\'ve got '+solved+'/'+need+'.<div class="checkpoint-bar"><div class="checkpoint-fill" style="width:'+Math.min(100,Math.round(solved/need*100))+'%"></div></div></div>';
  });
}

/* ---------------- inline challenge widgets ---------------- */
function widgetHTML(q){
  const dcls=q.level===1?'d1':q.level===2?'d2':'d3',dlab=q.level===1?'🟢 Beginner':q.level===2?'🟡 Intermediate':'🔴 Advanced';
  const help=!challengeMode;
  const hints = q.hints || (q.hint ? [q.hint] : []);
  if(q.type==='reasoning'){
    return `<div class="chal" id="chal-${q.id}">
    <div class="qtop"><span class="diff ${dcls}">${dlab}</span><span class="topictag">${esc(q.topic)}</span></div>
    <div class="qtext">${esc(q.q)}</div>
    <textarea class="editor" id="ed-${q.id}" aria-label="Write your reasoning" spellcheck="false" placeholder="Write your reasoning here, then reveal to compare against the explanation…" style="min-height:90px"></textarea>
    <div class="btns">
      <button class="act check" data-act="checkReasoningInline('${q.id}')">✓ Reveal &amp; mark understood</button>
      ${help?`<button class="act ghost" data-act="sqlNextHint('${q.id}')" id="hbtn-${q.id}">💡 Hint (0/${hints.length})</button>`:''}
    </div>
    <div class="result" aria-live="polite" id="r-${q.id}"></div>
    ${help?`<div class="hint" id="h-${q.id}" style="display:none"></div>`:''}
  </div>`;
  }
  return `<div class="chal" id="chal-${q.id}">
    <div class="qtop"><span class="diff ${dcls}">${dlab}</span><span class="topictag">${esc(q.topic)}</span><span class="dbtag">${q.db==='company'?'Nimbus':q.db==='school'?'student':'teaching'} DB</span></div>
    <div class="qtext">${esc(q.q)}</div>
    <textarea class="editor" id="ed-${q.id}" aria-label="SQL query editor" spellcheck="false" placeholder="Predict the result… then write your SQL"></textarea>
    <div class="btns">
      <button class="act run" data-act="runInline('${q.id}')">▶ Run</button>
      <button class="act check" data-act="checkInline('${q.id}')">✓ Check</button>
      ${help?`<button class="act ghost" data-act="sqlNextHint('${q.id}')" id="hbtn-${q.id}">💡 Hint (0/${hints.length})</button>`:''}
      ${q.workbench?`<button class="act ghost" data-act="tg('w-${q.id}')">🐬 MySQL version</button>`:''}
      ${help?`<button class="act ghost" data-act="tg('s-${q.id}')">Reveal</button>`:''}
      <button class="cr-review-btn" data-act="cxReviewSql('ed-${q.id}','crout-${q.id}')">🔍 Review my code</button>
    </div>
    <div class="result" aria-live="polite" id="r-${q.id}"></div>
    <div id="crout-${q.id}" aria-live="polite"></div>
    ${help?`<div class="hint" id="h-${q.id}" style="display:none"></div>`:''}
    ${q.workbench?`<div class="sol" id="w-${q.id}" style="display:none">🐬 MySQL version:<pre>${esc(q.workbench)}</pre></div>`:''}
    ${help?`<div class="sol" id="s-${q.id}" style="display:none">Solution:<pre>${esc(q.sol)}</pre></div>`:''}
  </div>`;
}
function checkReasoningInline(id){
  const q=BANK.find(x=>x.id===id);
  const box=document.getElementById('r-'+id);
  if(!solvedIds[id]){
    solvedIds[id]=true;
    const s=tstat(q.topic);s.att++;s.correct++;s.recent.push(1);if(s.recent.length>5)s.recent.shift();
    if(window.cxLogActivity) window.cxLogActivity('exercises', 1);
    saveState();refreshMastery();refreshDash();
  }
  box.innerHTML=`<div class="verdict v-ok">✓ Marked understood.</div><div style="margin-top:8px;font-size:.87rem"><b>Reasoning:</b> ${esc(q.sol)}</div>`;
  sqlRenderCheckpoints();
}
function buildInline(){
  document.querySelectorAll('.inline-chal').forEach(c=>{
    const ids=c.dataset.ids.split(',');
    const heading = c.hasAttribute('data-nolabel') ? '' : '<h3 style="margin-top:20px">Practice — write, run, check</h3>';
    c.innerHTML=heading+ids.map(id=>{const q=BANK.find(x=>x.id===id);return q?widgetHTML(q):'';}).join('');
  });
  sqlRenderCheckpoints();
}
function runInline(id){const q=BANK.find(x=>x.id===id);document.getElementById('r-'+id).innerHTML=grid(exec(q.db,document.getElementById('ed-'+id).value));}
function checkInline(id){const q=BANK.find(x=>x.id===id);gradeAnswer(q,document.getElementById('ed-'+id).value,document.getElementById('r-'+id));}

/* ---------------- adaptive lab ---------------- */
let current=null,forcedTopic=null,dailyQueue=null;
function pickLevel(t){const ra=racc(t);if(ra===null)return 1;if(ra>=0.8)return Math.min(3,levelFloor(t)+1);if(ra<0.5)return 1;return 2;}
function levelFloor(t){const L=BANK.filter(q=>q.topic===t&&solvedIds[q.id]).map(q=>q.level);return L.length?Math.max(...L):1;}
function chooseTopic(){
  if(forcedTopic)return forcedTopic;
  const sel=document.getElementById('topicSel').value;
  if(sel!=='__adaptive__')return sel;
  let worst=null,wa=2;for(const t of TOPICS){const ra=racc(t);if(ra===null)continue;if(!mastered(t)&&ra<wa){wa=ra;worst=t;}}
  if(worst)return worst;
  const un=TOPICS.filter(t=>!mastered(t));return un.length?un[Math.floor(Math.random()*un.length)]:TOPICS[Math.floor(Math.random()*TOPICS.length)];
}
function candidate(t,lvl){let pool=BANK.filter(q=>q.topic===t&&q.level===lvl);if(!pool.length)pool=BANK.filter(q=>q.topic===t);const uns=pool.filter(q=>!solvedIds[q.id]);const use=uns.length?uns:pool;return use[Math.floor(Math.random()*use.length)];}
function nextQuestion(){
  if(dailyQueue){if(dailyQueue.length){current=dailyQueue.shift();renderQ(current,`Daily challenge · ${dailyQueue.length} left after this`);return;}else{dailyQueue=null;setFlag('Adaptive');}}
  if(!BANK.length)return;const t=chooseTopic();current=candidate(t,pickLevel(t));renderQ(current);
}
function setFlag(t){document.getElementById('modeFlag').textContent=t;}
function renderQ(q,banner){
  const dcls=q.level===1?'d1':q.level===2?'d2':'d3',dlab=q.level===1?'🟢 Beginner':q.level===2?'🟡 Intermediate':'🔴 Advanced',help=!challengeMode;
  document.getElementById('qcard').innerHTML=`
    ${banner?`<div style="font-size:.8rem;color:var(--accent-ink);font-weight:700;margin-bottom:6px">${esc(banner)}</div>`:''}
    <div class="qtop"><span class="diff ${dcls}">${dlab}</span><span class="topictag">${esc(q.topic)}</span><span class="dbtag">${q.db==='company'?'Nimbus':q.db==='school'?'student':'teaching'} DB</span>${mastered(q.topic)?'<span class="topictag" style="background:#e8f8ee;color:#1c6b3a">✓ mastered</span>':''}</div>
    <div class="qtext">${esc(q.q)}</div>
    <textarea class="editor" id="labed" aria-label="Code editor" spellcheck="false" placeholder="Predict the result… then write your SQL"></textarea>
    <div class="btns">
      <button class="act run" data-act="labRun()">▶ Run</button>
      <button class="act check" data-act="labCheck()">✓ Check</button>
      ${help?`<button class="act ghost" data-act="tg('labhint')">💡 Hint</button>`:''}
      ${q.workbench?`<button class="act ghost" data-act="tg('labwb')">🐬 MySQL version</button>`:''}
      ${help?`<button class="act ghost" data-act="tg('labsol')">Reveal</button>`:''}
      <button class="act ghost" data-act="nextQuestion()">Skip →</button>
    </div>
    <div class="result" aria-live="polite" id="labres"></div>
    ${help?`<div class="hint" id="labhint" style="display:none">${esc(q.hint)}${q.diff?'<br><b>MySQL vs SQLite:</b> '+esc(q.diff):''}</div>`:''}
    ${q.workbench?`<div class="sol" id="labwb" style="display:none">🐬 MySQL version:<pre>${esc(q.workbench)}</pre></div>`:''}
    ${help?`<div class="sol" id="labsol" style="display:none">Solution:<pre>${esc(q.sol)}</pre></div>`:''}`;
}
function labRun(){document.getElementById('labres').innerHTML=grid(exec(current.db,document.getElementById('labed').value));}
function labCheck(){gradeAnswer(current,document.getElementById('labed').value,document.getElementById('labres'));}

/* ---------------- adaptive tool buttons ---------------- */
function drillWeakest(){let worst=null,wa=2;for(const t of TOPICS){const a=racc(t)??acc(t);if(a===null)continue;if(a<wa){wa=a;worst=t;}}if(!worst)worst=TOPICS[Math.floor(Math.random()*TOPICS.length)];forcedTopic=worst;document.getElementById('topicSel').value='__adaptive__';setFlag('Drilling: '+worst);dailyQueue=null;nextQuestion();forcedTopic=null;document.getElementById('lab').scrollIntoView({behavior:'smooth'});}
function startDaily(){const d=new Date(),seed=d.getFullYear()*1000+(d.getMonth()+1)*40+d.getDate(),rnd=mulberry32(seed);const touched=TOPICS.filter(t=>stats[t]&&stats[t].att>0);const base=touched.length>=3?touched:TOPICS;const pool=BANK.filter(q=>base.includes(q.topic));dailyQueue=pool.map(q=>({q,k:rnd()})).sort((a,b)=>a.k-b.k).map(x=>x.q).slice(0,5);setFlag('📅 Daily set');document.getElementById('lab').scrollIntoView({behavior:'smooth'});nextQuestion();}
function toggleDash(){document.getElementById('dash').classList.toggle('show');refreshDash();}
function toggleChallengeMode(){challengeMode=!challengeMode;document.getElementById('cmBtn').textContent='🔒 Challenge mode: '+(challengeMode?'ON':'OFF');setFlag(challengeMode?'Challenge (no hints)':'Adaptive');if(current)renderQ(current);buildInline();}

/* ---------------- dashboards ---------------- */
function refreshMastery(){
  document.getElementById('masteryList').innerHTML=TOPICS.map(t=>{const a=acc(t),pct=a===null?0:Math.round(a*100),m=mastered(t);
    return `<div style="margin:5px 0"><div style="display:flex;justify-content:space-between"><span>${m?'✓ ':''}${esc(t)}</span><span style="color:#7fb8ae">${a===null?'—':pct+'%'}</span></div><div class="mbar"><span style="width:${pct}%;${m?'background:#3fbf87':''}"></span></div></div>`;}).join('');
}
function refreshDash(){const b=document.getElementById('dashBody');if(!b)return;
  b.innerHTML=TOPICS.map(t=>{const a=acc(t),s=stats[t],pct=a===null?0:Math.round(a*100),col=a===null?'#ccc':a>=0.8?'#3fbf87':a>=0.5?'#e2a13a':'#d16a6a';
    return `<div class="wrow"><span class="name">${esc(t)}</span><div class="wbar"><span style="width:${pct}%;background:${col}"></span></div><span class="wpct">${a===null?'not tried':pct+'% ('+s.correct+'/'+s.att+')'}</span></div>`;}).join('');
}

/* ---------------- EXPLAIN + txn demos (company db) ---------------- */
function planText(sql){const r=exec('company',sql);if(r.error)return r.error;return r.rows.map(x=>x.join(' | ')).join('<br>');}
function explainBefore(){try{companyDb.run("DROP INDEX IF EXISTS idx_orders_cust;");}catch(e){}document.getElementById('explOut').innerHTML=`<div class="verdict v-bad"><b>Before (no index):</b><br>${planText("EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id=1234;")}<br><span style="font-weight:400">↑ SCAN = reads every order row.</span></div>`;}
function makeIndex(){exec('company',"CREATE INDEX IF NOT EXISTS idx_orders_cust ON orders(customer_id);");document.getElementById('explOut').innerHTML=`<div class="verdict v-ok">Index created on orders(customer_id). Now run step 3.</div>`;}
function explainAfter(){document.getElementById('explOut').innerHTML=`<div class="verdict v-ok"><b>After (indexed):</b><br>${planText("EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id=1234;")}<br><span style="font-weight:400">↑ SEARCH … USING INDEX = jumps straight to matches. Same query, no scan.</span></div>`;}
function txnCount(){const n=exec('company',"SELECT COUNT(*) FROM txn_demo").rows[0][0];document.getElementById('txnOut').innerHTML=`<div class="verdict v-ok">txn_demo has <b>${n}</b> rows.</div>`;}
function txnBegin(){try{companyDb.run("BEGIN;");companyDb.run("DELETE FROM txn_demo WHERE id=1;");const n=exec('company',"SELECT COUNT(*) FROM txn_demo").rows[0][0];document.getElementById('txnOut').innerHTML=`<div class="verdict v-bad">Inside the transaction: <b>${n}</b> rows. Not committed. Hit ROLLBACK.</div>`;}catch(e){document.getElementById('txnOut').innerHTML=`<div class="verdict v-err">${esc(e.message)} (already open? hit ROLLBACK)</div>`;}}
function txnRollback(){try{companyDb.run("ROLLBACK;");const n=exec('company',"SELECT COUNT(*) FROM txn_demo").rows[0][0];document.getElementById('txnOut').innerHTML=`<div class="verdict v-ok">ROLLBACK → back to <b>${n}</b> rows. The delete never really happened. That's atomicity.</div>`;}catch(e){document.getElementById('txnOut').innerHTML=`<div class="verdict v-err">${esc(e.message)}</div>`;}}

/* ---------------- boot ---------------- */
function initTopicSelect(){const sel=document.getElementById('topicSel');sel.innerHTML='<option value="__adaptive__">⚡ Adaptive (recommended)</option>'+TOPICS.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');}
function resetAll(){stats={};solvedIds={};saveState();refreshMastery();refreshDash();document.querySelectorAll('.result').forEach(r=>r.innerHTML='');alert('Progress reset.');}
loadState();initTopicSelect();refreshMastery();refreshDash();buildInline();
