
(function(){
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  var CONF_LABEL = { confirmed: 'Confirmed', likely: 'Likely', possible: 'Possible' };
  var BUCKET_LABEL = { correctness:'Correctness', completeness:'Completeness', readability:'Readability',
    modularity:'Modularity', efficiency:'Efficiency', edgecases:'Edge cases' };

  // Maps existing 3C.2 finding "check" tags into the 6 project-feedback buckets --
  // reuses the SAME detection logic and confidence labels, just regrouped for this view.
  var PY_BUCKET = {
    'syntax':'correctness', 'mutable-default':'edgecases', 'mutation':'edgecases',
    'broad-except':'edgecases', 'edge-case':'edgecases',
    'naming':'readability', 'unused-variable':'readability', 'loop-style':'readability',
    'duplication':'modularity', 'complexity':'modularity'
  };
  var SQL_BUCKET = {
    'select-star':'readability', 'readability':'readability',
    'null-comparison':'correctness', 'where-vs-having':'correctness',
    'missing-join-condition':'correctness', 'aggregation-grouping':'correctness',
    'cartesian-product':'edgecases', 'duplicate-rows':'edgecases',
    'subquery-style':'efficiency'
  };

  // ---------- requirements parsing (honest heuristic, always "possible" confidence) ----------
  function parseRequirements(descText){
    if(!descText) return [];
    // split on sentence boundaries and "and"/commas joining distinct asked-for actions;
    // keep only substantive clauses (avoid tiny fragments)
    var raw = descText.split(/(?:\.\s+|,\s+and\s+|\s+and\s+|;\s*)/);
    return raw.map(function(s){ return s.trim().replace(/\.$/,''); })
      .filter(function(s){ return s.split(/\s+/).length >= 3; })
      .slice(0, 6); // cap so the checklist stays a checklist, not the whole paragraph re-rendered
  }
  function checkRequirementCoverage(requirements, submissionText){
    var textLower = submissionText.toLowerCase();
    return requirements.map(function(req){
      // pull distinctive keywords (4+ letter words) from the requirement clause
      var words = req.toLowerCase().match(/[a-z]{4,}/g) || [];
      var hits = words.filter(function(w){ return textLower.indexOf(w) !== -1; });
      var covered = words.length ? (hits.length / words.length) >= 0.3 : false;
      return { text: req, covered: covered };
    });
  }

  function pickNextImprovement(findings){
    if(!findings.length) return null;
    var order = {confirmed:0, likely:1, possible:2};
    var bucketPriority = {correctness:0, edgecases:1, completeness:2, modularity:3, readability:4, efficiency:5};
    var sorted = findings.slice().sort(function(a,b){
      var oa = order[a.confidence], ob = order[b.confidence];
      if(oa !== ob) return oa - ob;
      return (bucketPriority[a.bucket]||9) - (bucketPriority[b.bucket]||9);
    });
    return sorted[0];
  }

  function renderProjectFeedback(containerId, opts){
    // opts: { mode, requirements(checked), findings(bucketed), executionNote, contextLine }
    var el = document.getElementById(containerId);
    if(!el) return;
    var html = '<div class="cr-panel">';
    html += '<div class="cr-header">Project feedback <span class="cr-sub">(structured, local, evidence-based — not an AI grader)</span></div>';
    if(opts.contextLine) html += '<div class="cr-context">'+esc(opts.contextLine)+'</div>';

    if(opts.mode === 'empty'){ html += '<p class="cr-empty">Paste your project code or a description above, then click Get Feedback.</p></div>'; el.innerHTML=html; return; }
    if(opts.mode === 'no-requirements'){ html += '<p class="cr-empty">This project has no authored requirements to compare against yet.</p></div>'; el.innerHTML=html; return; }

    if(opts.mode === 'empty'){ html += '<p class="cr-empty">Paste your project code or a description above, then click Get Feedback.</p></div>'; el.innerHTML=html; return; }
    if(opts.mode === 'no-requirements'){ html += '<p class="cr-empty">This project has no authored requirements to compare against yet.</p></div>'; el.innerHTML=html; return; }

    if(opts.requirements && opts.requirements.length){
      html += '<div class="cr-section"><div class="cr-section-h">Completeness</div>'
        + '<ul class="cr-req-list">' + opts.requirements.map(function(r){
            return '<li class="'+(r.covered?'cr-req-yes':'cr-req-no')+'">'+(r.covered?'&#10003;':'?')+' '+esc(r.text)+' <span class="cr-conf cr-conf-possible" style="margin-left:6px;">Possible</span></li>';
          }).join('') + '</ul>'
        + '<p class="cr-empty" style="margin-top:8px">Coverage is a keyword-overlap heuristic, not proof — review each item yourself.</p></div>';
    }

    // One "Correctness" section: the execution note (if any) comes first, followed by
    // any structural findings bucketed as correctness -- never two separate headers.
    var buckets = ['correctness','edgecases','modularity','readability','efficiency'];
    var byBucket = {};
    (opts.findings||[]).forEach(function(f){ (byBucket[f.bucket] = byBucket[f.bucket]||[]).push(f); });
    var anyFindings = (opts.findings||[]).length > 0;

    if(opts.executionNote || byBucket.correctness){
      html += '<div class="cr-section"><div class="cr-section-h">Correctness</div>';
      if(opts.executionNote) html += '<p class="cr-exec-note">'+esc(opts.executionNote)+'</p>';
      (byBucket.correctness||[]).forEach(function(f){
        html += '<div class="cr-finding">'
          + '<div class="cr-finding-top"><span class="cr-conf cr-conf-'+f.confidence+'">'+CONF_LABEL[f.confidence]+'</span>'
          + '<span class="cr-issue">'+esc(f.issue)+'</span></div>'
          + '<div class="cr-why"><b>Why it matters:</b> '+esc(f.why)+'</div>'
          + '<div class="cr-suggest"><b>Suggested next step:</b> '+esc(f.suggestion)+'</div>'
          + '</div>';
      });
      html += '</div>';
    }

    ['edgecases','modularity','readability','efficiency'].forEach(function(b){
      if(!byBucket[b] || !byBucket[b].length) return;
      html += '<div class="cr-section"><div class="cr-section-h">'+BUCKET_LABEL[b]+'</div>';
      byBucket[b].forEach(function(f){
        html += '<div class="cr-finding">'
          + '<div class="cr-finding-top"><span class="cr-conf cr-conf-'+f.confidence+'">'+CONF_LABEL[f.confidence]+'</span>'
          + '<span class="cr-issue">'+esc(f.issue)+'</span></div>'
          + '<div class="cr-why"><b>Why it matters:</b> '+esc(f.why)+'</div>'
          + '<div class="cr-suggest"><b>Suggested next step:</b> '+esc(f.suggestion)+'</div>'
          + '</div>';
      });
      html += '</div>';
    });

    if(!anyFindings && (!opts.requirements || opts.requirements.every(function(r){return r.covered;}))){
      html += '<div class="cr-section"><div class="cr-section-h">Summary</div><p class="cr-empty" style="color:#7ee0a0">All detectable requirements and structural checks look good — nice work. This checks patterns and stated requirements, not full correctness; a human review (or grading against real tests) is still the final word.</p></div>';
    } else {
      var next = pickNextImprovement(opts.findings||[]);
      html += '<div class="cr-section"><div class="cr-section-h">Next improvement</div>';
      if(next){
        html += '<p class="cr-issue" style="margin-bottom:4px">'+esc(next.issue)+'</p><p class="cr-suggest">'+esc(next.suggestion)+'</p>';
      } else {
        var uncovered = (opts.requirements||[]).filter(function(r){return !r.covered;});
        if(uncovered.length){
          html += '<p class="cr-suggest">Start with: "'+esc(uncovered[0].text)+'" — it doesn\'t appear addressed yet.</p>';
        } else {
          html += '<p class="cr-empty">Nothing specific stood out — consider a peer or instructor review for anything this local check can\'t see.</p>';
        }
      }
      html += '</div>';
    }

    html += '</div>';
    el.innerHTML = html;
  }

  // ---------- main entry points ----------
  window.cxSubmitProjectFeedback = async function(courseId, projIndex, editId, outId){
    var btn = document.getElementById('pfbtn_'+outId);
    if(btn){ if(btn.disabled) return; btn.disabled = true; }
    try{
    var courses = (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent)));
    var course = courses.find(function(c){ return c.id===courseId; });
    var project = course ? course.projects[projIndex] : null;
    var submission = document.getElementById(editId).value;
    var ctx = window.getLessonContext ? window.getLessonContext(courseId) : null;
    var language = ctx ? ctx.language : 'general';
    var contextLine = project ? 'Reviewing your submission for "'+project.title+'" ('+course.title+').' : null;

    if(!submission || !submission.trim()){
      renderProjectFeedback(outId, {mode:'empty', contextLine: contextLine});
      return;
    }
    if(!project || !project.desc){
      renderProjectFeedback(outId, {mode:'no-requirements', contextLine: contextLine});
      return;
    }
    var requirements = checkRequirementCoverage(parseRequirements(project.desc), submission);

    if(language === 'python'){
      var el = document.getElementById(outId);
      if(el) el.innerHTML = '<div class="cr-panel"><span class="spinner"></span> Analyzing…</div>';
      try{
        var py = await getPy();
        py.globals.set('_SRC', submission);
        py.runPython(RUN_HARNESS);
        var ranOk = !py.globals.get('_ISERR');
        var output = py.globals.get('_RESULT');
        var execNote;
        if(!ranOk){
          execNote = 'Confirmed — your code raised an error when run: ' + String(output).split('\\n').slice(-3).join(' ');
        } else if(!output || !output.trim()){
          execNote = 'Possible — the code ran without error but produced no visible output. If this project is expected to print or return something, double-check that happened.';
        } else {
          execNote = 'Confirmed — the code ran without errors and produced output.';
        }
        py.runPython(PY_REVIEW_HARNESS);
        var reviewResult = JSON.parse(py.globals.get('_RESULT_REVIEW'));
        var findings = reviewResult.findings.map(function(f){
          return { check:f.check, confidence:f.confidence, issue:f.issue, why:f.why, suggestion:f.suggestion, bucket: PY_BUCKET[f.check] || 'readability' };
        });
        renderProjectFeedback(outId, { mode:'result', executionNote: execNote, requirements: requirements, findings: findings, contextLine: contextLine });
      }catch(e){
        renderProjectFeedback(outId, { mode:'result', executionNote: "Execution isn't available right now, so runtime correctness and static analysis can't run — here's the requirements checklist based on what was submitted.", requirements: requirements, findings: [], contextLine: contextLine });
      }
    } else if(language === 'sql'){
      var sqlResult = window.reviewSqlCode ? window.reviewSqlCode(submission) : {findings:[],good:[]};
      var findings2 = sqlResult.findings.map(function(f){
        return { check:f.check, confidence:f.confidence, issue:f.issue, why:f.why, suggestion:f.suggestion, bucket: SQL_BUCKET[f.check] || 'readability' };
      });
      renderProjectFeedback(outId, { mode:'result',
        executionNote: "This project isn't bound to a specific database here, so live execution/output can't be verified — this is a structural review plus your requirements checklist.",
        requirements: requirements, findings: findings2, contextLine: contextLine });
    } else {
      renderProjectFeedback(outId, { mode:'result',
        executionNote: null,
        requirements: requirements, findings: [], contextLine: contextLine });
    }
    } finally { if(btn) btn.disabled = false; }
  };
})();
