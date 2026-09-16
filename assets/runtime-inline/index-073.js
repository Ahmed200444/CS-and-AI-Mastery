
(function(){
  // Single shared context object every AI-assistance feature reads from --
  // hints, code review, adaptive quiz, and the tutor panel all call this
  // instead of each maintaining separate state-reading logic.
  var _coursesCache = null, _categoriesCache = null;
  function courses(){ if(!_coursesCache){ try{ _coursesCache = (window.__CSAI_COURSES__||(window.__CSAI_COURSES__=JSON.parse(document.getElementById('coursedata').textContent))); }catch(e){ _coursesCache=[]; } } return _coursesCache; }
  function categories(){ if(!_categoriesCache){ try{ _categoriesCache = JSON.parse(document.getElementById('categorydata').textContent); }catch(e){ _categoriesCache=[]; } } return _categoriesCache; }
  function courseProg(){ try{ return JSON.parse(localStorage.getItem('courses_progress_v1'))||{}; }catch(e){ return {}; } }

  function pctDone(course, st){
    if(!course) return 0;
    var total = course.lessons.length+course.exercises.length+course.quiz.length+course.projects.length;
    if(!total) return 0;
    var done = course.lessons.filter(function(l){return st.lessons&&st.lessons[l.id];}).length
             + course.exercises.filter(function(_,i){return st.exercises&&st.exercises[i];}).length
             + course.quiz.filter(function(_,i){return st.quiz&&st.quiz[i]!==undefined;}).length
             + (course.projects||[]).filter(function(p){return st.projects&&st.projects[p.id];}).length;
    return Math.round(done/total*100);
  }

  /**
   * getLessonContext(courseId, lessonIndex, exerciseIndex)
   * Returns: { course, lesson, concepts, prerequisites, completedLessons,
   *            completedExercises, quizHistory, currentExercise, language }
   * All fields are derived from REAL saved data -- nothing here is guessed
   * or fabricated. Any field that can't be determined is null/empty, not faked.
   */
  window.getLessonContext = function(courseId, lessonIndex, exerciseIndex){
    var cid = courseId || window._cxCur;
    if(!cid) return null;
    var all = courses();
    var course = all.find(function(c){ return c.id===cid; });
    if(!course) return null;
    var cp = courseProg();
    var st = cp[cid] || {lessons:{},exercises:{},quiz:{}};

    var lesson = (lessonIndex!=null && course.lessons[lessonIndex]) ? course.lessons[lessonIndex] : null;
    var currentExercise = (exerciseIndex!=null && course.exercises[exerciseIndex]) ? course.exercises[exerciseIndex] : null;

    var completedLessons = course.lessons
      .map(function(l){ return (st.lessons&&st.lessons[l.id]) ? (l.title) : null; })
      .filter(Boolean);
    var completedExercises = course.exercises
      .map(function(e,i){ return (st.exercises&&st.exercises[i]) ? e.title : null; })
      .filter(Boolean);

    var prereqCourses = (course.prerequisites||[]).map(function(pid){ return all.find(function(c){return c.id===pid;}); }).filter(Boolean);
    var prerequisites = prereqCourses.map(function(pc){
      return { title: pc.title, complete: pctDone(pc, cp[pc.id]||{}) >= 100 };
    });

    var quizHistory = course.quiz.map(function(q,i){
      if(st.quiz==null || st.quiz[i]===undefined) return null;
      return { question: q.q, correct: st.quiz[i]===q.correct, chosenIndex: st.quiz[i] };
    }).filter(Boolean);

    var language = 'general';
    if(cid==='sql') language = 'sql';
    else if(cid==='python' || cid==='oop' || course.linked==='python') language = 'python';
    else if((course.tags||[]).indexOf('databases')!==-1 || cid==='databases') language = 'sql';

    return {
      course: { id: course.id, title: course.title, category: course.category },
      lesson: lesson ? { id: lesson.id||null, title: lesson.title, tier: lesson.tier||null } : null,
      concepts: lesson ? (lesson.concepts||[]) : [],
      prerequisites: prerequisites,
      completedLessons: completedLessons,
      completedExercises: completedExercises,
      quizHistory: quizHistory,
      currentExercise: currentExercise ? { id: currentExercise.id||null, title: currentExercise.title, difficulty: currentExercise.difficulty } : null,
      language: language
    };
  };
})();
