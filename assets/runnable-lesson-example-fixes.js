(function(){
'use strict';

var meta={};
try{var n=document.getElementById('course-page-meta');meta=n?JSON.parse(n.textContent||'{}'):{};}catch(e){}
var courseId=String(meta.id||location.pathname.split('/').pop()||'').replace(/\.html$/,'');

function norm(v){return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function lessonTitle(pre){var lesson=pre.closest('.lesson');var t=lesson&&lesson.querySelector('.title');return norm(t?t.textContent:'')}
function hasPlaceholder(code){
  var c=String(code||'');
  return /(^|\s)\.\.\.(\s|$)/m.test(c)
    || /\bTODO\b/i.test(c)
    || /\bTBD\b/i.test(c)
    || /\bYOUR[_ ]CODE\b/i.test(c)
    || /\bREPLACE[_ ]ME\b/i.test(c)
    || /\?\?\?/.test(c)
    || /^\s*pass\s*(#.*)?$/m.test(c);
}
function isShell(code){return /(^|\n)\s*(git\s+|ls\b|cd\s+|pwd\b|mkdir\b|docker\s+|npm\s+|pip\s+|curl\s+|ssh\s+|chmod\b|grep\b|awk\b|sed\b)/m.test(String(code||''))}
function isDiagramOrReference(code){
  var c=String(code||'').trim();
  if(!c)return true;
  if(/^O\([^\n]+\)/m.test(c)&&!/\b(print|for|while|def|class)\b/.test(c))return true;
  if(/[┌┐└┘├┤│─→←↔]/.test(c))return true;
  if(/^\s*(GET|POST|PUT|PATCH|DELETE)\s+\//m.test(c)&&!/fetch\s*\(/.test(c))return true;
  return false;
}
function obviousPythonMissingSetup(code){
  var c=String(code||'');
  var names=[];
  var patterns=[/\bfor\s+\w+\s+in\s+(nums|arr|items|values|data)\b/g,/\b(len|sum|sorted)\s*\(\s*(nums|arr|items|values|data)\s*\)/g];
  patterns.forEach(function(re){var m;while((m=re.exec(c))){names.push(m[2]||m[1])}});
  return names.some(function(name){
    var setup=new RegExp('(?:^|\\n)\\s*'+name+'\\s*=','m');
    var param=new RegExp('def\\s+\\w+\\s*\\([^)]*\\b'+name+'\\b[^)]*\\)');
    return !setup.test(c)&&!param.test(c);
  });
}
function classify(pre){
  var code=pre.textContent||'';
  if(hasPlaceholder(code))return 'reference';
  if(isShell(code))return 'reference';
  if(isDiagramOrReference(code))return 'reference';
  if(obviousPythonMissingSetup(code))return 'reference';
  return 'candidate';
}

/* Only this one lesson gets a content replacement. Other examples keep their own content. */
var BIG_O_EXAMPLE=`nums = [10, 20, 30, 40]\n\n# O(n): one pass through the list\nlinear_steps = 0\nfor x in nums:\n    linear_steps = linear_steps + 1\n\n# O(n^2): one full pass for every item\nquadratic_steps = 0\nfor i in nums:\n    for j in nums:\n        quadratic_steps = quadratic_steps + 1\n\nprint("Number of items:", len(nums))\nprint("O(n) loop steps:", linear_steps)\nprint("O(n^2) loop steps:", quadratic_steps)`;

function audit(){
  var examples=Array.from(document.querySelectorAll('.lesson .body pre.code'));
  examples.forEach(function(pre){
    if(courseId==='dsa'&&lessonTitle(pre)==='big o notation'){
      pre.textContent=BIG_O_EXAMPLE;
      pre.dataset.runnableExample='true';
      pre.dataset.exampleAudit='complete';
      return;
    }
    var status=classify(pre);
    pre.dataset.exampleAudit=status;
    if(status==='reference'){
      pre.dataset.referenceOnly='true';
      delete pre.dataset.runnableExample;
    }else{
      delete pre.dataset.referenceOnly;
      pre.dataset.runnableExample='true';
    }
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',audit);else audit();
})();
