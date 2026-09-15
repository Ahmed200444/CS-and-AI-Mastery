
// ============ ADAPTIVE QUIZ GENERATOR (Phase 3C.3) ============
// Curates and mixes from the REAL quiz pool across all courses by concept --
// does not invent new questions (that would need real generative AI, which
// this static platform doesn't have). Two data sources are combined honestly:
//   1) courses_progress_v1[*].quiz -- existing snapshot right/wrong per question,
//      no timestamp, but works immediately even for users who never touch this
//      feature (so "mostly correct/incorrect history" scenarios work from day one).
//   2) adaptive_quiz_log_v1 -- a new, timestamped, append-only log of every quiz
//      answer going forward, giving real recency for spaced review. Absent for a
//      brand-new or freshly-imported user -- that's an honest gap, not faked.
(function(){
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  var _coursesCache = null;
  function courses(){ if(!_coursesCache){ try{ _coursesCache = (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent))); }catch(e){ _coursesCache=[]; } } return _coursesCache; }
  function courseProg(){ try{ return JSON.parse(localStorage.getItem('courses_progress_v1'))||{}; }catch(e){ return {}; } }
  function quizLog(){ try{ return JSON.parse(localStorage.getItem('adaptive_quiz_log_v1'))||[]; }catch(e){ return []; } }
  function saveQuizLog(log){ try{ localStorage.setItem('adaptive_quiz_log_v1', JSON.stringify(log)); }catch(e){} }

  // ---------- concept tagging (same honest keyword-overlap pattern as 3C.1's findRelatedLesson) ----------
  var _tagCache = {};
  function tagQuizQuestion(course, q, qIndex){
    var cacheKey = course.id+'_'+qIndex;
    if(_tagCache[cacheKey]) return _tagCache[cacheKey];
    var text = (q.q + ' ' + (q.options||[]).join(' ')).toLowerCase();
    var best = null, bestScore = 0, bestTier = null;
    (course.lessons||[]).forEach(function(l){
      (l.concepts||[]).forEach(function(c){
        var cLower = String(c).toLowerCase();
        if(text.indexOf(cLower) !== -1){
          var score = cLower.length; // longer, more specific concept matches win
          if(score > bestScore){ bestScore = score; best = c; bestTier = l.tier; }
        }
      });
    });
    var result = { concept: best || (course.title), tier: bestTier || 'beginner', fallback: !best };
    _tagCache[cacheKey] = result;
    return result;
  }

  function allQuizQuestions(){
    var out = [];
    courses().forEach(function(c){
      if(c.status === 'coming-soon') return;
      (c.quiz||[]).forEach(function(q, i){
        var tag = tagQuizQuestion(c, q, i);
        out.push({ courseId: c.id, courseTitle: c.title, index: i, q: q, concept: tag.concept, tier: tag.tier });
      });
    });
    return out;
  }

  // ---------- concept stats: merges snapshot progress + timestamped log ----------
  function computeConceptStats(){
    var all = allQuizQuestions();
    var prog = courseProg();
    var log = quizLog();
    var stats = {}; // concept -> {attempts, correct, lastTs, items:[{courseId,index,correct}]}

    function get(concept){
      if(!stats[concept]) stats[concept] = { attempts:0, correct:0, lastTs:null, items:[] };
      return stats[concept];
    }

    // Signal 1: snapshot from courses_progress_v1 (works even with zero adaptive-log history)
    all.forEach(function(item){
      var st = prog[item.courseId];
      if(!st || !st.quiz || st.quiz[item.index] === undefined) return;
      var chosen = st.quiz[item.index];
      var wasCorrect = chosen === item.q.correct;
      var s = get(item.concept);
      s.attempts++;
      if(wasCorrect) s.correct++;
      s.items.push({ courseId:item.courseId, index:item.index, correct:wasCorrect, courseTitle:item.courseTitle, q:item.q, tier:item.tier });
    });

    // Signal 2: timestamped log -- refines lastTs (recency) for spaced review;
    // does NOT double-count attempts already captured by signal 1 for the same
    // (courseId,index) -- it's the same event, we just want the timestamp from it.
    log.forEach(function(entry){
      var s = get(entry.concept);
      if(!s.lastTs || entry.ts > s.lastTs) s.lastTs = entry.ts;
    });

    return stats;
  }

  window.cxLogQuizAttempt = function(concept, correct){
    var log = quizLog();
    log.push({ concept: concept, correct: !!correct, ts: Date.now() });
    if(log.length > 500) log = log.slice(-500); // cap growth, oldest entries aren't needed for recency
    saveQuizLog(log);
  };

  // Lets cxAnswer (regular per-course quiz taking) log into the same concept history
  // as Focus Quiz sessions, so recency/spaced-review data builds from normal use too.
  window.cxTagQuizQuestion = function(courseId, index){
    var course = courses().find(function(c){ return c.id===courseId; });
    if(!course || !course.quiz || !course.quiz[index]) return null;
    return tagQuizQuestion(course, course.quiz[index], index).concept;
  };

  // ---------- session generator ----------
  window.generateAdaptiveQuiz = function(){
    var stats = computeConceptStats();
    var concepts = Object.keys(stats);
    var attempted = concepts.filter(function(c){ return stats[c].attempts > 0; });

    if(!attempted.length){
      return {
        mode: 'new-user',
        message: "You haven't answered any quiz questions yet, so there's no history to personalize from. Answer a few checkpoints across your courses and this will start focusing on exactly what you need.",
        questions: [],
        weakConcepts: [], reviewConcepts: []
      };
    }

    // weak: accuracy < 70%, at least 1 attempt
    var weak = attempted.filter(function(c){ return stats[c].correct/stats[c].attempts < 0.7; })
      .sort(function(a,b){ return (stats[a].correct/stats[a].attempts) - (stats[b].correct/stats[b].attempts); });
    // strong/mastered: accuracy >= 80%, at least 1 attempt -- same floor as "weak" since
    // concepts are fine-grained (close to 1:1 with individual questions), so requiring
    // 2+ attempts per concept left almost nothing eligible for spaced review in realistic
    // single-attempt-per-concept data. Prioritize oldest (or unknown) last-practiced time.
    var strong = attempted.filter(function(c){ return stats[c].correct/stats[c].attempts >= 0.8; })
      .sort(function(a,b){
        var ta = stats[a].lastTs || 0, tb = stats[b].lastTs || 0;
        return ta - tb; // oldest/unknown first
      });

    var TARGET_SIZE = 6;
    var weakCount = Math.round(TARGET_SIZE * 0.75);
    var reviewCount = TARGET_SIZE - weakCount;

    var questions = [];
    var usedKeys = {};
    function keyOf(item){ return item.courseId+'_'+item.index; }
    function pickFrom(conceptList, count, preferWrong){
      var picked = 0;
      for(var ci=0; ci<conceptList.length && picked<count; ci++){
        var items = stats[conceptList[ci]].items.slice();
        if(preferWrong) items.sort(function(a,b){ return (a.correct?1:0) - (b.correct?1:0); });
        for(var ii=0; ii<items.length && picked<count; ii++){
          var it = items[ii];
          var k = keyOf(it);
          if(usedKeys[k]) continue;
          usedKeys[k] = true;
          questions.push({ courseId: it.courseId, courseTitle: it.courseTitle, index: it.index, q: it.q, concept: conceptList[ci], wasCorrectLastTime: it.correct });
          picked++;
        }
      }
      return picked;
    }

    var weakPicked = weak.length ? pickFrom(weak, weakCount, true) : 0;
    var reviewPicked = strong.length ? pickFrom(strong, TARGET_SIZE - weakPicked, false) : 0;
    // if either pool ran short, backfill from the other so the session isn't tiny
    if(weakPicked + reviewPicked < TARGET_SIZE && weak.length) weakPicked += pickFrom(weak, TARGET_SIZE - weakPicked - reviewPicked, true);
    if(weakPicked + reviewPicked < TARGET_SIZE && strong.length) reviewPicked += pickFrom(strong, TARGET_SIZE - weakPicked - reviewPicked, false);

    var topWeak = weak.slice(0, 2);
    var topReview = strong.slice(0, 2);

    var message;
    if(topWeak.length){
      var pct = function(c){ return Math.round((1 - stats[c].correct/stats[c].attempts)*100); };
      if(topWeak.length === 1){
        message = "This quiz focuses on " + topWeak[0] + " because you've missed " + pct(topWeak[0]) + "% of recent questions on it.";
      } else {
        message = "This quiz focuses on " + topWeak.slice(0,-1).join(', ') + " and " + topWeak[topWeak.length-1] + " — topics you've been missing recently.";
      }
      if(topReview.length){
        message += " It also mixes in a couple of " + topReview[0] + " questions for spaced review, since you've consistently done well there.";
      }
    } else if(topReview.length){
      message = "You're doing well across the board — this is spaced review of " + topReview.map(function(c){return c;}).join(', ') + " and other strong topics, to keep them fresh.";
    } else {
      message = "Mixed practice from your recent quiz history.";
    }

    if(!questions.length){
      return {
        mode: 'exhausted',
        message: "You've already worked through the available quiz questions matching your history — nice work. Check back after completing more courses for fresh material.",
        questions: [], weakConcepts: topWeak, reviewConcepts: topReview
      };
    }

    return { mode: 'adaptive', message: message, questions: questions, weakConcepts: topWeak, reviewConcepts: topReview };
  };

  window.cxComputeConceptStats = computeConceptStats; // exposed for testing/debugging
})();

