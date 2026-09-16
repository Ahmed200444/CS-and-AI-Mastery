
(function(){
  // Reuses the SAME test-harness pattern as the DSA track: a plain-Python
  // test harness is appended to the learner's function and run through the
  // shared getPy()/RUN_HARNESS -- no new Python runtime, and real pass/fail
  // per test case rather than free-form output.

  var RAG_LESSONS = [
    { id:'rag-chunking', title:'Chunking a document', funcName:'chunk_text',
      explain:'Split text into fixed-size chunks with some overlap between them, so a fact split across a boundary isn\'t completely lost. Chunk size and overlap are both parameters your function should respect exactly.',
      starter:'def chunk_text(text, size, overlap):\n    # TODO: return a list of chunks, each of length `size` characters\n    # (except possibly the last), where each chunk after the first starts\n    # `size - overlap` characters after the previous one started\n    pass',
      solution:'def chunk_text(text, size, overlap):\n    chunks = []\n    step = size - overlap\n    i = 0\n    while i < len(text):\n        chunks.append(text[i:i+size])\n        i += step\n    return chunks',
      hints:['Each chunk starts "step" characters after the previous one, where step = size - overlap.','Use a while loop with an index i, slicing text[i:i+size], and advancing i by step each time.','step = size - overlap; loop while i < len(text), appending text[i:i+size] and doing i += step'],
      tests:[
        {argsRepr:'"abcdefghij", 4, 0', expectedRepr:"['abcd', 'efgh', 'ij']"},
        {argsRepr:'"abcdefghij", 4, 2', expectedRepr:"['abcd', 'cdef', 'efgh', 'ghij', 'ij']"},
        {argsRepr:'"abc", 10, 0', expectedRepr:"['abc']"}
      ]},
    { id:'rag-keyword-score', title:'Keyword-overlap scoring', funcName:'keyword_score',
      explain:'A simplified stand-in for real similarity search: count how many words in the query also appear in the document (case-insensitive). This is NOT how real embeddings work, but it illustrates the "how relevant is this?" scoring idea.',
      starter:'def keyword_score(query, doc):\n    # TODO: return the count of words in `query` (split on spaces) that\n    # also appear (case-insensitive) anywhere in `doc`\n    pass',
      solution:'def keyword_score(query, doc):\n    doc_words = set(doc.lower().split())\n    query_words = query.lower().split()\n    return sum(1 for w in query_words if w in doc_words)',
      hints:['Split both query and doc into words, lowercased, then count overlap.','A set of the doc\'s words makes membership checks fast.','doc_words = set(doc.lower().split()); return sum(1 for w in query.lower().split() if w in doc_words)'],
      tests:[
        {argsRepr:'"how long do refunds take", "refunds are processed within 7 days"', expectedRepr:'1'},
        {argsRepr:'"return policy", "our return policy allows 30 day returns"', expectedRepr:'2'},
        {argsRepr:'"zzz qqq", "nothing matches here"', expectedRepr:'0'}
      ]},
    { id:'rag-ranking', title:'Ranking documents by relevance', funcName:'rank_docs',
      explain:'Given a query and a list of (doc_id, doc_text) pairs, score each with keyword_score and return the doc_ids sorted from most to least relevant.',
      starter:'def keyword_score(query, doc):\n    doc_words = set(doc.lower().split())\n    return sum(1 for w in query.lower().split() if w in doc_words)\n\ndef rank_docs(query, docs):\n    # docs is a list of (doc_id, text) tuples.\n    # TODO: return a list of doc_ids sorted by keyword_score, highest first\n    pass',
      solution:'def keyword_score(query, doc):\n    doc_words = set(doc.lower().split())\n    return sum(1 for w in query.lower().split() if w in doc_words)\n\ndef rank_docs(query, docs):\n    scored = [(doc_id, keyword_score(query, text)) for doc_id, text in docs]\n    scored.sort(key=lambda x: x[1], reverse=True)\n    return [doc_id for doc_id, score in scored]',
      hints:['Score every doc first, then sort by score.','sorted(..., key=..., reverse=True) sorts highest-score first.','scored = [(d, keyword_score(query, t)) for d,t in docs]; scored.sort(key=lambda x:x[1], reverse=True); return [d for d,s in scored]'],
      tests:[
        {argsRepr:'"refund policy", [("a","our refund policy is simple"), ("b","shipping takes 5 days"), ("c","policy on refunds and returns")]', expectedRepr:"['a', 'c', 'b']"}
      ]},
    { id:'rag-hybrid', title:'Combining dense and sparse scores', funcName:'hybrid_score',
      explain:'Hybrid search combines a dense (embedding) score and a sparse (keyword) score into one number, usually with a weight controlling how much each contributes.',
      starter:'def hybrid_score(dense_score, sparse_score, weight):\n    # TODO: return weight*dense_score + (1-weight)*sparse_score\n    pass',
      solution:'def hybrid_score(dense_score, sparse_score, weight):\n    return weight * dense_score + (1 - weight) * sparse_score',
      hints:['This is a weighted average of the two scores.','weight controls dense\'s share; (1-weight) is sparse\'s share.','return weight*dense_score + (1-weight)*sparse_score'],
      tests:[
        {argsRepr:'0.8, 0.4, 0.5', expectedRepr:'0.6'},
        {argsRepr:'1.0, 0.0, 1.0', expectedRepr:'1.0'},
        {argsRepr:'0.0, 1.0, 0.0', expectedRepr:'1.0'}
      ]},
    { id:'rag-diagnose', title:'Diagnosing retrieval vs. generation failure', funcName:'diagnose_failure',
      explain:'Given whether the retrieved chunks actually contained the answer, and whether the final generated answer was correct, classify what actually failed -- an essential diagnostic distinction covered in the RAG lessons.',
      starter:'def diagnose_failure(chunks_contained_answer, final_answer_correct):\n    # TODO: return "retrieval failure" if chunks did NOT contain the answer,\n    # "generation failure" if chunks DID contain it but the final answer was wrong,\n    # or "no failure" if the final answer was correct\n    pass',
      solution:'def diagnose_failure(chunks_contained_answer, final_answer_correct):\n    if final_answer_correct:\n        return "no failure"\n    if not chunks_contained_answer:\n        return "retrieval failure"\n    return "generation failure"',
      hints:['Check the final answer first -- if it\'s correct, nothing failed.','If it\'s wrong AND the chunks never had the answer, that\'s a retrieval failure.','if final_answer_correct: return "no failure"\\nif not chunks_contained_answer: return "retrieval failure"\\nreturn "generation failure"'],
      tests:[
        {argsRepr:'False, False', expectedRepr:'"retrieval failure"'},
        {argsRepr:'True, False', expectedRepr:'"generation failure"'},
        {argsRepr:'True, True', expectedRepr:'"no failure"'}
      ]}
  ];

  function ragKey(id, field){ return 'ragtrack:'+id+':'+field; }
  function ragSave(id, field, val){ try{ localStorage.setItem(ragKey(id,field), val); }catch(e){} }
  function ragLoad(id, field, fallback){ try{ var v=localStorage.getItem(ragKey(id,field)); return v===null?fallback:v; }catch(e){ return fallback; } }
  function ragDoneKey(id){ return 'ragtrack:'+id+':done'; }
  function ragIsDone(id){ try{ return localStorage.getItem(ragDoneKey(id))==='1'; }catch(e){ return false; } }
  function ragEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];}); }

  var ragCurIdx = 0;

  window.ragOpen = function(idx){
    ragCurIdx = idx;
    renderRagNav();
    renderRagLesson();
    window.scrollTo(0,0);
  };
  window.ragNext = function(){ if(ragCurIdx < RAG_LESSONS.length-1) window.ragOpen(ragCurIdx+1); };
  window.ragPrev = function(){ if(ragCurIdx > 0) window.ragOpen(ragCurIdx-1); };
  window.ragMarkDone = function(idx){
    try{ localStorage.setItem(ragDoneKey(RAG_LESSONS[idx].id), '1'); }catch(e){}
    renderRagNav();
  };

  function renderRagNav(){
    var nav = document.getElementById('ragLessonNav');
    if(!nav) return;
    nav.innerHTML = RAG_LESSONS.map(function(l, i){
      var done = ragIsDone(l.id) ? ' \u2713' : '';
      return '<button class="'+(i===ragCurIdx?'active':'')+'" data-act="ragOpen('+i+')">'+(i+1)+'. '+ragEsc(l.title)+done+'</button>';
    }).join('');
  }

  function renderRagLesson(){
    var body = document.getElementById('ragLessonBody');
    if(!body) return;
    var l = RAG_LESSONS[ragCurIdx];
    var savedCode = ragLoad(l.id, 'code', l.starter);
    var idBase = 'ragpm_'+l.id;
    var editId=idBase+'_edit', outId=idBase+'_out', statusId=idBase+'_status';
    var hintHtml = l.hints.map(function(h,i){
      return '<button data-act="ragRevealHint(\''+l.id+'\','+(i+1)+')">Hint '+(i+1)+'</button>';
    }).join('') + '<button data-act="ragRevealHint(\''+l.id+'\',99)">Reveal Solution</button>';
    var hintBoxes = l.hints.map(function(h,i){
      return '<div class="wd-hintbox" id="raghint_'+l.id+'_'+(i+1)+'">'+ragEsc(h)+'</div>';
    }).join('') + '<div class="wd-hintbox" id="raghint_'+l.id+'_99"><b>Solution:</b><pre>'+ragEsc(l.solution)+'</pre></div>';

    body.innerHTML =
      '<div class="wd-lesson-head"><h2>'+trackNumBadge(ragCurIdx+1)+ragEsc(l.title)+'</h2></div>'
      + trackMentalModel(ragEsc(l.explain))
      + '<div class="card">'
      + trackEditorShell(l.id+'.py', '<textarea class="wd-edit" id="'+editId+'" aria-label="Code editor" spellcheck="false" style="min-height:120px">'+ragEsc(savedCode)+'</textarea>')
      + '<div class="wd-row">'
        + '<button class="wd-btn" data-act="ragRunTests(\''+l.id+'\',\''+editId+'\',\''+outId+'\',\''+statusId+'\')">&#9654; Run tests</button>'
        + '<button class="wd-btn-ghost" data-act="ragReset(\''+l.id+'\',\''+editId+'\')">Reset</button>'
        + '<button class="wd-btn-ghost" data-act="ragMarkDone('+ragCurIdx+')">Mark task done</button>'
      + '</div>'
      + '<div id="'+statusId+'" style="font-size:.78rem;color:var(--sub);margin-top:6px"></div>'
      + '<div class="wd-out" id="'+outId+'"></div>'
      + '</div>'
      + '<div class="wd-hintbtns">'+hintHtml+'</div>'
      + hintBoxes
      + '<div class="wd-navrow">'
        + (ragCurIdx>0 ? '<button class="wd-btn-ghost" data-act="ragPrev()">&larr; Previous</button>' : '<span></span>')
        + (ragCurIdx<RAG_LESSONS.length-1 ? '<button class="wd-btn" data-act="ragNext()">Next &rarr;</button>' : '<span></span>')
      + '</div>';
  }

  window.ragReset = function(lessonId, editId){
    var l = RAG_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var ta = document.getElementById(editId);
    if(ta) ta.value = l.starter;
    ragSave(lessonId, 'code', l.starter);
  };

  window.ragRevealHint = function(lessonId, tier){
    var l = RAG_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var tiers = l.hints.map(function(_,i){ return i+1; }).concat([99]);
    tiers.forEach(function(t){
      var el = document.getElementById('raghint_'+lessonId+'_'+t);
      if(el) el.classList.toggle('show', (tier===99) ? (t===99) : (t<=tier));
    });
  };

  // Reuses the SAME shared Pyodide instance (getPy) and RUN_HARNESS as the
  // DSA track and every other runnable exercise -- no new Python runtime.
  window.ragRunTests = async function(lessonId, editId, outId, statusId){
    var l = RAG_LESSONS.find(function(x){ return x.id === lessonId; });
    if(!l) return;
    var code = (document.getElementById(editId)||{}).value || '';
    ragSave(lessonId, 'code', code);
    var out = document.getElementById(outId);
    if(out){ out.className = 'wd-out'; out.textContent = 'Running\u2026'; }
    var py;
    try{ py = await getPy(statusId); }
    catch(e){ if(out) out.innerHTML = '<span class="err">Python failed to load. It needs internet the first time; on Netlify this works.</span>'; return; }

    var harnessLines = ['_rag_results = []'];
    l.tests.forEach(function(t, i){
      harnessLines.push(
        'try:\n'+
        '    _r = '+l.funcName+'('+t.argsRepr+')\n'+
        '    _exp = ('+t.expectedRepr+')\n'+
        '    _ok = (abs(_r - _exp) < 1e-9) if isinstance(_r, (int, float)) and isinstance(_exp, (int, float)) and not isinstance(_r, bool) and not isinstance(_exp, bool) else (_r == _exp)\n'+
        '    _rag_results.append(("'+i+'", _ok, repr(_r)))\n'+
        'except Exception as _e:\n'+
        '    _rag_results.append(("'+i+'", False, "Error: " + str(_e)))'
      );
    });
    harnessLines.push('print("\\n".join("TESTCASE|" + r[0] + "|" + ("PASS" if r[1] else "FAIL") + "|" + r[2] for r in _rag_results))');
    var fullSrc = code + '\n\n' + harnessLines.join('\n') + '\n';

    try{
      try{ await py.loadPackagesFromImports(fullSrc); }catch(e){ /* offline or unneeded */ }
      py.globals.set('_SRC', fullSrc);
      py.runPython(RUN_HARNESS);
      var result = py.globals.get('_RESULT');
      var iserr = py.globals.get('_ISERR');
      if(iserr){
        if(out) out.innerHTML = '<span class="err">'+escapeHtml(result)+'</span>';
        return;
      }
      var lines = result.split('\n').filter(function(ln){ return ln.indexOf('TESTCASE|') === 0; });
      if(!lines.length){
        if(out) out.textContent = result || '(no test results -- did you rename the function? it must be called "'+l.funcName+'")';
        return;
      }
      var rows = lines.map(function(ln){
        var parts = ln.split('|');
        var idx = parts[1], status = parts[2], detail = parts[3];
        var t = l.tests[Number(idx)];
        return '<div class="dsa-testrow '+(status==='PASS'?'pass':'fail')+'">'
          + '<span>Test '+(Number(idx)+1)+': '+ragEsc(l.funcName)+'('+ragEsc(t.argsRepr)+')</span>'
          + '<span>'+status+' &mdash; got '+ragEsc(detail)+'</span></div>';
      }).join('');
      var passCount = lines.filter(function(ln){ return ln.split('|')[2]==='PASS'; }).length;
      if(out){ out.innerHTML = '<b>'+passCount+'/'+lines.length+' tests passed</b>' + rows; }
    }catch(e){
      if(out) out.innerHTML = '<span class="err">'+escapeHtml(String(e))+'</span>';
    }
  };

  var ragBooted = false;
  window._ragBoot = function(){
    if(ragBooted) return;
    ragBooted = true;
    window.ragOpen(0);
  };
})();
