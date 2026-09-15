(function(){
'use strict';

var META={};
try{var metaNode=document.getElementById('course-page-meta');META=metaNode?JSON.parse(metaNode.textContent||'{}'):{};}catch(e){META={};}
var courseId=String(META.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'');
var REVIEW_KEY='csai-evergreen-mastery-v1';
var SIGNAL_KEY='csai-smart-review-signals-v1';
var STOP=new Set('the a an and or to of in on for with is are be as at by from this that it its your you we they do does how what why when where which can could should would will into through using use return write build create make given each every if else then than not only'.split(' '));

function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(e){return{}}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}}
function tokens(text){return String(text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(function(x){return x.length>2&&!STOP.has(x)})}
function uniq(a){return Array.from(new Set(a))}
function lessonId(el,index){return el.getAttribute('data-lesson')||('lesson-'+index)}
function lessonTitle(el){var t=el.querySelector('.title');return t?t.textContent.trim():'Lesson'}
function lessonTerms(el){var title=lessonTitle(el),pills=Array.from(el.querySelectorAll('.meta .pill')).map(function(x){return x.textContent}),heads=Array.from(el.querySelectorAll('h3')).map(function(x){return x.textContent}).slice(0,8);return{title:title,titleTokens:uniq(tokens(title)),conceptTokens:uniq(tokens(pills.concat(heads).join(' ')))}}
function lessons(){return Array.from(document.querySelectorAll('.lesson')).map(function(el,i){var terms=lessonTerms(el);return{el:el,id:lessonId(el,i),title:terms.title,titleTokens:terms.titleTokens,conceptTokens:terms.conceptTokens}})}
function relatedLesson(text){var q=uniq(tokens(text)),all=lessons();if(!all.length)return null;var best=null,bestScore=-1;all.forEach(function(l){var score=0;q.forEach(function(t){if(l.titleTokens.indexOf(t)>=0)score+=5;if(l.conceptTokens.indexOf(t)>=0)score+=2});if(score>bestScore){bestScore=score;best=l}});if(bestScore<=0){var incomplete=all.find(function(l){var cb=l.el.querySelector('input[type="checkbox"]');return cb&&!cb.checked});return incomplete||all[0]}return best}
function taskText(node){if(!node)return'';var title=node.getAttribute&&node.getAttribute('data-title')||'',h=node.querySelector&&node.querySelector('h3'),prompt=node.querySelector&&node.querySelector('.oa-prompt');return[title,h&&h.textContent,prompt&&prompt.textContent].filter(Boolean).join(' ')}
function quizText(node){if(!node||!node.querySelector)return'';var h=node.querySelector('h3');return h?h.textContent:''}
function nowIso(){return new Date().toISOString()}
function intervalFor(score){if(score>=6)return 1;if(score>=3)return 2;if(score>=1)return 3;if(score<=-5)return 14;if(score<=-2)return 7;return 5}
function reasonLabel(kind){return{reveal:'Revealed a solution/answer',fail:'Failed a run/test',wrongQuiz:'Missed a knowledge check',evergreenFail:'Evergreen example needs work',manualAgain:'Marked Need review',manualGood:'Marked Getting it',manualEasy:'Marked Confident',success:'Solved successfully',quizCorrect:'Answered a knowledge check correctly',lessonComplete:'Completed the lesson'}[kind]||kind}
function signal(lesson,delta,kind){
 if(!lesson)return;
 var signals=read(SIGNAL_KEY);signals[courseId]=signals[courseId]||{};
 var s=signals[courseId][lesson.id]||{score:0,successes:0,struggles:0,reveals:0,history:[]};
 s.score=Math.max(-8,Math.min(12,Number(s.score||0)+delta));
 if(delta>0)s.struggles=(s.struggles||0)+1;if(delta<0)s.successes=(s.successes||0)+1;if(kind==='reveal')s.reveals=(s.reveals||0)+1;
 s.lastSignal=nowIso();s.lastReason=reasonLabel(kind);s.history=Array.isArray(s.history)?s.history:[];s.history.push({at:s.lastSignal,kind:kind,delta:delta});s.history=s.history.slice(-20);signals[courseId][lesson.id]=s;write(SIGNAL_KEY,signals);

 var review=read(REVIEW_KEY);review[courseId]=review[courseId]||{};var current=review[courseId][lesson.id]||{};var days=intervalFor(s.score);var proposed=Date.now()+days*86400000;var existing=current.nextReview?new Date(current.nextReview).getTime():NaN;
 if(delta>0){existing=isFinite(existing)?Math.min(existing,proposed):proposed}
 else if(delta<0){existing=isFinite(existing)?Math.max(existing,proposed):proposed}
 else if(!isFinite(existing)){existing=proposed}
 current.title=lesson.title;current.smartScore=s.score;current.smartReason=s.lastReason;current.lastSignal=s.lastSignal;current.nextReview=new Date(existing).toISOString();if(!current.lastReviewed)current.lastReviewed=nowIso();review[courseId][lesson.id]=current;write(REVIEW_KEY,review);
 window.dispatchEvent(new CustomEvent('csai-review-updated',{detail:{courseId:courseId,lessonId:lesson.id,reason:s.lastReason,score:s.score}}));
}
function inspectOutput(task,lesson,kind){
 var tries=0;
 function check(){
  tries++;
  var out=task&&task.querySelector&&task.querySelector('[data-output],.oa-output,.quiz-feedback,.evergreen-output'),text=String(out&&out.textContent||'').toLowerCase();
  var ratio=text.match(/(\d+)\s*\/\s*(\d+)\s*tests?\s+passed/);
  if(ratio){var passed=Number(ratio[1]),total=Number(ratio[2]);signal(lesson,passed<total?3:-1,passed<total?(kind||'fail'):(kind==='wrongQuiz'?'quizCorrect':'success'));return}
  if(/fail|error|not quite|incorrect|check failed/.test(text)){signal(lesson,3,kind||'fail');return}
  if(/correct|passed|run complete|query complete|check complete|response captured/.test(text)&&!/fail|error|not quite/.test(text)){signal(lesson,-1,kind==='wrongQuiz'?'quizCorrect':'success');return}
  if(tries<12)setTimeout(check,350);
 }
 setTimeout(check,250);
}
function nearestLessonForNode(node){var lessonEl=node&&node.closest&&node.closest('.lesson');if(lessonEl){var all=lessons(),found=all.find(function(x){return x.el===lessonEl});if(found)return found}return relatedLesson(taskText(node)||quizText(node))}

function addStyle(){if(document.getElementById('csai-smart-review-style'))return;var s=document.createElement('style');s.id='csai-smart-review-style';s.textContent='.smart-review-note{margin-top:6px;color:var(--muted);font-size:.76rem;line-height:1.4}.smart-review-note strong{color:var(--text)}';document.head.appendChild(s)}
function showReason(){addStyle();var badge=document.querySelector('[data-evergreen-course-status]');if(!badge)return;var hero=badge.parentElement||document.querySelector('.hero');if(!hero)return;var note=hero.querySelector('[data-smart-review-note]');if(!note){note=document.createElement('div');note.className='smart-review-note';note.setAttribute('data-smart-review-note','');badge.insertAdjacentElement('afterend',note)}var sig=read(SIGNAL_KEY),course=sig[courseId]||{},items=Object.keys(course).map(function(k){return course[k]}).filter(Boolean).sort(function(a,b){return Number(b.score||0)-Number(a.score||0)});var top=items[0];note.innerHTML=top&&Number(top.score||0)>0?'<strong>Adaptive review:</strong> '+String(top.lastReason||'Recent difficulty')+' is influencing your next review.':'<strong>Adaptive review:</strong> watching your test results, reveals, knowledge checks, lesson completion, and Mastery Lab ratings.'}

function start(){
 addStyle();showReason();
 document.addEventListener('click',function(e){
  var reveal=e.target.closest&&e.target.closest('[data-reveal-solution],[data-reveal-answer],[data-reveal],[data-solution-toggle]');
  if(reveal){var revealBox=reveal.closest('[data-task],.oa-task,[data-quiz],.quiz-card'),revealLesson=nearestLessonForNode(revealBox);signal(revealLesson,3,'reveal');setTimeout(showReason,30);return}

  var run=e.target.closest&&e.target.closest('[data-run],[data-evergreen-run],[data-check-quiz],[data-universal-run],[data-compare]');
  if(run){var box=run.closest('[data-task],.oa-task,[data-quiz],.quiz-card,[data-evergreen-example],.evergreen-lab')||run.parentElement,lesson=nearestLessonForNode(box),kind=run.hasAttribute('data-check-quiz')?'wrongQuiz':(box&&box.matches&&box.matches('[data-evergreen-example],.evergreen-lab')?'evergreenFail':'fail');inspectOutput(box,lesson,kind);return}

  var mastery=e.target.closest&&e.target.closest('[data-mastery]');
  if(mastery){var lab=mastery.closest('[data-evergreen-lab]'),masteryLesson=nearestLessonForNode(lab),level=mastery.getAttribute('data-mastery');signal(masteryLesson,level==='again'?4:level==='good'?0:-2,level==='again'?'manualAgain':level==='good'?'manualGood':'manualEasy');setTimeout(showReason,30);return}
 },true);
 document.addEventListener('change',function(e){var cb=e.target;if(!(cb&&cb.matches&&cb.matches('.lesson input[type="checkbox"]')))return;if(!cb.checked)return;var lesson=nearestLessonForNode(cb.closest('.lesson'));signal(lesson,-1,'lessonComplete');setTimeout(showReason,30)},true);
 window.addEventListener('csai-review-updated',function(){setTimeout(showReason,20)});
 setTimeout(showReason,300);setTimeout(showReason,900);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
