(function(){
'use strict';

/* v5.44: never replace a lesson's real examples with one shared snippet.
   This layer only classifies whether an existing block is runnable or reference-only. */
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
function isShell(code){return /(^|\n)\s*(git\s+|ls\b|cd\s+|pwd\b|mkdir\b|docker\s+|npm\s+|pip\s+|curl\s+|ssh\s+|chmod\b|grep\b|awk\b|sed\b)/m.test(String(code||''));}
function isDiagramOrReference(code){
  var c=String(code||'').trim();
  if(!c)return true;
  if(/^O\([^\n]+\)/m.test(c)&&!/\b(print|for|while|def|class)\b/.test(c))return true;
  if(/[┌┐└┘├┤│─→←↔]/.test(c))return true;
  if(/^\s*(GET|POST|PUT|PATCH|DELETE)\s+\//m.test(c)&&!/fetch\s*\(/.test(c))return true;
  return false;
}
function obviousPythonMissingSetup(code){
  var c=String(code||''),names=[];
  var patterns=[/\bfor\s+\w+\s+in\s+(nums|arr|items|values|data)\b/g,/\b(len|sum|sorted)\s*\(\s*(nums|arr|items|values|data)\s*\)/g];
  patterns.forEach(function(re){var m;while((m=re.exec(c))){names.push(m[2]||m[1]);}});
  return names.some(function(name){
    var setup=new RegExp('(?:^|\\n)\\s*'+name+'\\s*=','m');
    var param=new RegExp('def\\s+\\w+\\s*\\([^)]*\\b'+name+'\\b[^)]*\\)');
    return !setup.test(c)&&!param.test(c);
  });
}
function classify(pre){
  if(pre.dataset.referenceOnly==='true')return 'reference';
  var code=pre.textContent||'';
  if(hasPlaceholder(code)||isShell(code)||isDiagramOrReference(code)||obviousPythonMissingSetup(code))return 'reference';
  return 'candidate';
}
function audit(){
  Array.from(document.querySelectorAll('.lesson .body pre.code')).forEach(function(pre){
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
