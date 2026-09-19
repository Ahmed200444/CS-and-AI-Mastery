'use strict';
const assert=require('assert');
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const explainer=fs.readFileSync(path.join(root,'assets','line-by-line-explanations.js'),'utf8');
const sandbox={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},setTimeout(){return 1;},clearTimeout(){},MutationObserver:function(){this.observe=function(){};},WeakMap,console};
vm.createContext(sandbox);
vm.runInContext(explainer,sandbox);
const api=sandbox.window.CSAILineExplainer;
const courses=JSON.parse(fs.readFileSync(path.join(root,'assets','coursedata-source.json'),'utf8'));
function examples(lesson){
  const v=lesson.examples!==undefined?lesson.examples:lesson.example;
  return Array.isArray(v)?v:(v!==undefined?[v]:[]);
}
let blocks=0,lines=0;
for(const course of courses){
  for(const lesson of (course.lessons||[])){
    for(const code of examples(lesson)){
      if(typeof code!=='string'||api.inferLanguage(code,'',null)!=='python')continue;
      blocks++;
      for(const line of code.split(/\r?\n/)){
        lines++;
        assert(!/^\s*(?:if|elif|else|for|while|try|except|finally|with)\b[^#]*:\s+\S/.test(line),course.id+'/'+lesson.id+': put the controlled body on its own indented line: '+line);
        assert(!/^\s*(?:async\s+def|def)\b.*\)\s*(?:->\s*[^:]+)?\s*:\s+\S/.test(line),course.id+'/'+lesson.id+': put the function body on its own indented line: '+line);
        assert(!/^\s*class\b[^#]*:\s+\S/.test(line),course.id+'/'+lesson.id+': put the class body on its own indented line: '+line);
        assert(!/;\s*(?:[A-Za-z_]\w*\s*=|[A-Za-z_]\w*\(|return\b|break\b|continue\b)/.test(line),course.id+'/'+lesson.id+': avoid chaining Python statements with semicolons: '+line);
      }
    }
  }
}
const study=fs.readFileSync(path.join(root,'assets','study-examples.js'),'utf8');
assert(!/\\n\s*(?:if|elif|else|for|while|def)\b[^\\n'"]*:\s+[^\\n'"]+/.test(study),'study-example bank contains compressed Python control/function flow');
console.log('Beginner-readable code contract: PASS across '+blocks+' Python source examples / '+lines+' lines.');
