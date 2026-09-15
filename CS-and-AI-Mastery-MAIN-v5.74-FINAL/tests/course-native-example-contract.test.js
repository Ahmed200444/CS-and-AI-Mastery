const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('assets/study-examples.js','utf8');
for(const marker of ['courseAllowsGeneratedPython','nativeExampleFor','sourceStudyCard','conceptDefinition','Course-native example']){
  assert.ok(source.includes(marker),`missing course-native example marker: ${marker}`);
}
assert.ok(source.includes("course==='sql'||course==='databases'"),'SQL/database examples must stay SQL-native');
assert.ok(source.includes("course==='web-dev'||course==='frontend-dev'"),'web examples must stay web-native');
assert.ok(source.includes("course==='git'"),'Git examples must stay Git/shell-native');
assert.ok(source.includes("course==='linux'"),'Linux examples must stay shell-native');
assert.ok(source.includes("if(courseAllowsGeneratedPython(course))"),'generic Python generation must be gated by course');

let runnable=source.replace(/\}\)\(\);\s*$/,'globalThis.__nativeAudit={courseAllowsGeneratedPython,nativeExampleFor};})();');
const sandbox={
  document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},
  location:{pathname:'/courses/python.html'},window:{},setTimeout(){},clearTimeout(){},MutationObserver:function(){this.observe=function(){}},console
};
vm.createContext(sandbox);vm.runInContext(runnable,sandbox);
const api=sandbox.__nativeAudit;
assert.equal(api.courseAllowsGeneratedPython('python'),true);
for(const id of ['sql','databases','git','linux','web-dev','frontend-dev','cicd','resume-prep'])assert.equal(api.courseAllowsGeneratedPython(id),false,`${id} must not receive generic Python examples`);
assert.equal(api.nativeExampleFor('sql','SELECT basics',1).language,'sql');
assert.equal(api.nativeExampleFor('databases','joins',2).language,'sql');
assert.equal(api.nativeExampleFor('git','branches',1).language,'shell');
assert.equal(api.nativeExampleFor('linux','pipes',2).language,'shell');
assert.ok(['html','javascript','css'].includes(api.nativeExampleFor('web-dev','semantic HTML',1).language));

const publisher=fs.readFileSync('assets/portfolio-publish-controls.js','utf8');
assert.ok(publisher.includes("return'css'"),'CSS examples should publish with .css');
assert.ok(publisher.includes("return'sh'"),'shell examples should publish with .sh');
assert.ok(publisher.includes('reference material in the course'),'reference-example README must not claim browser execution');
console.log('Course-native example contract: OK');
