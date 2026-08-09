const fs=require('fs');
const path=require('path');
const root=process.cwd();
const practicePath=path.join(root,'assets','assessment-practice.js');
const injectPath=path.join(root,'scripts','inject-assessment-practice.cjs');
let practice=fs.readFileSync(practicePath,'utf8');
practice=practice.replace("function extFor(lang){return{python:'py',javascript:'js',sql:'sql',html:'html',text:'txt'}[lang]||'txt'}","function extFor(lang){return{cpp:'cpp',python:'py',javascript:'js',sql:'sql',html:'html',text:'txt'}[lang]||'txt'}");
practice=practice.replace("function starterFor(lang){if(lang==='python')return'# Write your solution here\\n';","function starterFor(lang){if(lang==='cpp')return'#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    // Write your solution here\\n    return 0;\\n}\\n';if(lang==='python')return'# Write your solution here\\n';");
practice=practice.replace("var opts=[['python','Python'],['javascript','JavaScript'],['sql','SQL'],['html','HTML preview']];","var opts=[['cpp','C++'],['python','Python'],['javascript','JavaScript'],['sql','SQL'],['html','HTML preview']];");
if(!/cpp:'cpp'/.test(practice)||!/if\(lang==='cpp'\)return'#include <iostream>/.test(practice)||!/\['cpp','C\+\+'\]/.test(practice))throw new Error('assessment-practice C++ support patch incomplete');
fs.writeFileSync(practicePath,practice,'utf8');

let inject=fs.readFileSync(injectPath,'utf8');
if(!inject.includes("const CPP_COURSES=new Set(['cpp']);"))inject=inject.replace("const PYTHON_COURSES=new Set(","const CPP_COURSES=new Set(['cpp']);\nconst PYTHON_COURSES=new Set(");
inject=inject.replace("function defaultLanguage(id){if(SQL_COURSES.has(id))return'sql';if(JS_COURSES.has(id))return'javascript';if(PYTHON_COURSES.has(id))return'python';return'text'}","function defaultLanguage(id){if(CPP_COURSES.has(id))return'cpp';if(SQL_COURSES.has(id))return'sql';if(JS_COURSES.has(id))return'javascript';if(PYTHON_COURSES.has(id))return'python';return'text'}");
if(!/CPP_COURSES=new Set\(\['cpp'\]\)/.test(inject)||!/if\(CPP_COURSES\.has\(id\)\)return'cpp'/.test(inject))throw new Error('inject-assessment-practice C++ default-language patch incomplete');
fs.writeFileSync(injectPath,inject,'utf8');
console.log('Dedicated C++ assessment now renders .cpp starters/labels natively before the C++ runner bridge takes over execution.');
