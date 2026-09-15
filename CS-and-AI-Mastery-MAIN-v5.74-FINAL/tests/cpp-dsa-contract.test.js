const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const fail=[];
function check(ok,msg){if(!ok)fail.push(msg);}
const data=JSON.parse(read('assets/course-data/cpp-dsa.json'));
check(data.id==='cpp-dsa','course id must be cpp-dsa');
check(data.title==='C++ Programming & DSA','course title mismatch');
check(Array.isArray(data.lessons)&&data.lessons.length===54,`expected 54 lessons, found ${data.lessons&&data.lessons.length}`);
check(Array.isArray(data.exercises)&&data.exercises.length===54,`expected 54 exercises, found ${data.exercises&&data.exercises.length}`);
check(Array.isArray(data.quiz)&&data.quiz.length===54,`expected 54 checkpoints, found ${data.quiz&&data.quiz.length}`);
check(Array.isArray(data.projects)&&data.projects.length===6,`expected 6 projects, found ${data.projects&&data.projects.length}`);
check(data.projects.every(p=>p.language==='cpp'),'all C++ course projects must publish as cpp');
const titles=data.lessons.map(l=>l.title);
for(const required of ['C++ toolchain, compilation & program structure','Classes, objects & access control','RAII & smart pointers','DSA in C++: Big-O time, space & amortized analysis','Linked lists in C++','Graphs: representations, BFS & DFS','Dynamic programming: states, transitions & optimization'])check(titles.includes(required),`missing required lesson: ${required}`);
for(const [i,l] of data.lessons.entries()){
 const code=(l.examples||[]).join('\n');
 check((l.concepts||[]).length>=3,`lesson ${i+1} needs at least 3 concepts for 5+ adaptive examples`);
 check(code.length>20,`lesson ${i+1} missing source example`);
 check(!/(^|\n)\s*(def |print\(|from \w+ import|import random\b)/.test(code),`lesson ${i+1} contains Python fallback code`);
 const cppLike=/#include|#pragma|std::|\bint\s+main\s*\(|\bclass\s+\w+|\bstruct\s+\w+|\btemplate\s*<|\.hpp\b|\.cpp\b/.test(code);
 check(cppLike,`lesson ${i+1} source example does not look like C++`);
}
const page=read('courses/cpp-dsa.html');
check((page.match(/<details class="lesson"/g)||[]).length===54,'cpp-dsa page must render 54 lesson blocks');
check(/"defaultLanguage"\s*:\s*"cpp"/.test(page),'cpp-dsa project workspace must default to cpp');
check((page.match(/"language"\s*:\s*"cpp"/g)||[]).length>=6,'cpp-dsa page must contain six cpp projects');
for(const asset of ['assets/course-project-workspace.js','assets/portfolio-publish-controls.js','assets/project-readme-layer.js','assets/assessment-practice.js']){
 const src=read(asset); check(/cpp/.test(src),`${asset} missing cpp support`);
}
const workspace=read('assets/course-project-workspace.js');
check(/cpp:'cpp'/.test(workspace),'project workspace must publish .cpp extension');
check(/CSAICppRunner/.test(workspace),'project workspace must call C++ runner');
const portfolio=read('assets/portfolio-publish-controls.js');
check(/g\+\+ -std=c\+\+17/.test(portfolio),'portfolio README must include C++17 compile command');
const readme=read('assets/project-readme-layer.js');
check(/g\+\+ -std=c\+\+17/.test(readme),'Smart README must include C++17 compile command');
const study=read('assets/study-examples.js');
check(/course==='cpp-dsa'/.test(study),'study examples must have dedicated cpp-dsa generator');
check(/cppNativeProgram/.test(study),'study examples must generate native C++ examples');
const ui=read('assets/python-only-ui.js');
check(/function isCppCourse/.test(ui),'primary-language guard must preserve dedicated C++ course');
const guard=read('assets/runner-performance-guard.js');
check(/courseId\(\)==='cpp-dsa'/.test(guard),'C++ runtime must prewarm on cpp-dsa course');
const tools=read('assets/example-learning-tools.js');
check(/window\.CSAICppRunner/.test(tools),'shared example tools must expose C++ runner');
check(/\/runtime\/cpp\/JSCPP\.es5\.min\.js/.test(tools),'C++ runner must use local cached fast runtime');
if(fail.length){console.error('C++ + DSA contract failed:');fail.forEach(x=>console.error(' - '+x));process.exit(1);}
console.log('C++ + DSA contract: PASS — 54 lessons, 54 exercises, 54 checkpoints, 6 projects, native C++ examples, .cpp GitHub publishing, Smart README, and C++ runtime wiring verified.');
