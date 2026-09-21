'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets','studycore-export.js'),'utf8');
assert.match(source,/Export to StudyCore/);
assert.match(source,/one course at a time/i);
assert.match(source,/Download StudyCore file/);
assert.doesNotMatch(source,/ChatGPT Work/);
assert.match(source,/imported directly into StudyCore/i);
assert.match(source,/StudyCore-ready export/);
assert.doesNotMatch(source,/studycore-git-|masteryLessons|masteryCommit|Continue in StudyCore/);

const document={readyState:'loading',addEventListener(){},getElementById(){return null;}};
const sandbox={window:{},document,Map,Set,Blob:function(){},URL:{createObjectURL(){return'blob:test'},revokeObjectURL(){}},setTimeout(){},console};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'studycore-export.js'});
const api=sandbox.window.CSAIStudyCoreExport;
assert(api&&typeof api.buildStudyCoreMarkdown==='function');
assert.equal(typeof api.exportFileName,'function');

const course={
  id:'python',
  title:'Python',
  lessons:[
    {id:'py-loops',title:'Loops',objectives:['Use for loops'],explanation:'Loops repeat work.',concepts:['for loop','enumerate()'],examples:['for x in [1, 2]:\n    print(x)'],commonMistakes:['Using while when for is simpler.']},
    {id:'py-lists',title:'Lists',objectives:['Use lists'],explanation:'Lists store ordered values.',concepts:['list'],examples:['nums = [1, 2, 3]']},
    {id:'py-dicts',title:'Dictionaries',explanation:'Dictionaries map keys to values.'}
  ]
};
const md=api.buildStudyCoreMarkdown(course,['py-lists','py-loops','py-loops'],'flashcards',{commit:'a'.repeat(40),version:'5.76.0'});
assert.match(md,/CS & AI Mastery — Python/);
assert.match(md,/StudyCore intent: flashcards/);
assert.match(md,/py-loops, py-lists/);
assert.match(md,/## Lesson 1 — Loops/);
assert.match(md,/## Lesson 2 — Lists/);
assert.match(md,/Loops repeat work\./);
assert.match(md,/Using while when for is simpler\./);
assert(!md.includes('Dictionaries map keys to values.'),'unselected lessons must not leak into the export');
assert.equal(api.exportFileName(course,['py-loops'],'flashcards'),'cs-ai-mastery-python-py-loops-flashcards.md');
assert.equal(api.exportFileName(course,['py-loops','py-lists'],'materials'),'cs-ai-mastery-python-2-lessons-materials.md');
assert.throws(()=>api.buildStudyCoreMarkdown(course,[],'flashcards',{}),/at least one lesson/i);
console.log('StudyCore export contract PASS — selected lessons download as a StudyCore-ready Markdown export without changing StudyCore.');
