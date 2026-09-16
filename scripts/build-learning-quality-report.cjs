const fs=require('fs');
const path=require('path');

const dir=path.join(process.cwd(),'courses');
const out=path.join(process.cwd(),'assets','learning-quality.json');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');

const files=fs.readdirSync(dir).filter(name=>name.endsWith('.html'));
if(files.length!==62)throw new Error(`Learning quality guard expected 62 courses, found ${files.length}`);

let lessons=0,deepDives=0,codeExamples=0,evergreenPages=0,studyExamplePages=0;
const courses=[];
for(const file of files){
  const html=fs.readFileSync(path.join(dir,file),'utf8');
  const count=(re)=>(html.match(re)||[]).length;
  const lessonCount=count(/<details\b[^>]*class=["'][^"']*\blesson\b/gi);
  const deepCount=count(/data-expanded-lesson/gi);
  const codeCount=count(/<pre\b[^>]*class=["'][^"']*\bcode\b/gi);
  const evergreen=html.includes('evergreen-learning-engine.js');
  const studyExamples=/study-examples\.js\?v=[A-Za-z0-9._-]+/.test(html);
  if(!lessonCount)throw new Error(`Learning quality guard: ${file} has no lessons`);
  if(!studyExamples)throw new Error(`Learning quality guard: ${file} is missing the current every-key-idea study-example system`);
  lessons+=lessonCount;deepDives+=deepCount;codeExamples+=codeCount;if(evergreen)evergreenPages++;if(studyExamples)studyExamplePages++;
  courses.push({id:file.replace(/\.html$/,''),lessons:lessonCount,expandedLessons:deepCount,sourceExamples:codeCount,studyExamplesPlannedMinimum:lessonCount*5,studyExamplesPlannedMaximum:lessonCount*8,evergreenLayer:evergreen});
}

const report={
  version:1,
  coursePages:files.length,
  evergreenPages,
  studyExamplePages,
  lessons,
  expandedLessons:deepDives,
  sourceExamples:codeExamples,
  studyExamplesPlannedMinimum:lessons*5,
  studyExamplesPlannedMaximum:lessons*8,
  promise:'Every generated lesson loads the current Study Examples system, which provides a distinct example for every key concept plus integration and edge-case practice.',
  courses
};
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n','utf8');
console.log(`Learning quality guard passed: ${files.length} courses, ${lessons} lessons, Study Examples enabled on ${studyExamplePages}/${files.length} pages.`);
