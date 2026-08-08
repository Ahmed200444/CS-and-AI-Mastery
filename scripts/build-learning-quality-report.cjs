const fs=require('fs');
const path=require('path');

const dir=path.join(process.cwd(),'courses');
const out=path.join(process.cwd(),'assets','learning-quality.json');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');

const files=fs.readdirSync(dir).filter(name=>name.endsWith('.html'));
if(files.length!==54)throw new Error(`Learning quality guard expected 54 courses, found ${files.length}`);

let lessons=0,deepDives=0,codeExamples=0,evergreenPages=0;
const courses=[];
for(const file of files){
  const html=fs.readFileSync(path.join(dir,file),'utf8');
  const count=(re)=>(html.match(re)||[]).length;
  const lessonCount=count(/<details\b[^>]*class=["'][^"']*\blesson\b/gi);
  const deepCount=count(/data-expanded-lesson/gi);
  const codeCount=count(/<pre\b[^>]*class=["'][^"']*\bcode\b/gi);
  const evergreen=html.includes('/assets/evergreen-learning-engine.js');
  if(!lessonCount)throw new Error(`Learning quality guard: ${file} has no lessons`);
  if(!evergreen)throw new Error(`Learning quality guard: ${file} is missing Evergreen Learning Engine`);
  lessons+=lessonCount;deepDives+=deepCount;codeExamples+=codeCount;if(evergreen)evergreenPages++;
  courses.push({id:file.replace(/\.html$/,''),lessons:lessonCount,expandedLessons:deepCount,sourceExamples:codeCount,evergreenExamplesPlanned:lessonCount*3});
}

const report={
  version:1,
  coursePages:files.length,
  evergreenPages,
  lessons,
  expandedLessons:deepDives,
  sourceExamples:codeExamples,
  evergreenExamplesPlanned:lessons*3,
  promise:'Every generated lesson receives an Evergreen Mastery Lab with a minimum three-example learning ladder plus review scheduling.',
  courses
};
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n','utf8');
console.log(`Learning quality guard passed: ${files.length} courses, ${lessons} lessons, ${lessons*3} Evergreen example slots.`);
