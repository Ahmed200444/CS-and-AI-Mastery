'use strict';
const fs=require('fs');
const path=require('path');
const root=process.cwd();
const extrasPath=path.join(root,'assets','additional-courses.json');
const sourcePath=path.join(root,'assets','coursedata-source.json');
const catalogPath=path.join(root,'assets','catalog-data.json');

if(!fs.existsSync(extrasPath)) throw new Error('assets/additional-courses.json is missing');
const extraPayload=JSON.parse(fs.readFileSync(extrasPath,'utf8'));
const extras=Array.isArray(extraPayload)?extraPayload:extraPayload.courses;
if(!Array.isArray(extras)||extras.length===0) throw new Error('No additional courses were provided');

const source=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
if(!Array.isArray(source)) throw new Error('coursedata-source.json must be an array');
for(const course of extras){
  if(!course||typeof course.id!=='string'||!/^[A-Za-z0-9._-]+$/.test(course.id)) throw new Error('Invalid additional course id');
  const i=source.findIndex(x=>x&&x.id===course.id);
  if(i>=0) source[i]=course; else source.push(course);
}
fs.writeFileSync(sourcePath,JSON.stringify(source),'utf8');

const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
if(!catalog||!Array.isArray(catalog.courses)) throw new Error('catalog-data.json must have courses[]');
function summary(course){
  const lessons=Array.isArray(course.lessons)?course.lessons:[];
  const exercises=Array.isArray(course.exercises)?course.exercises:[];
  const quiz=Array.isArray(course.quiz)?course.quiz:[];
  const projects=(Array.isArray(course.projects)?course.projects:[]).concat(course.capstone?[course.capstone]:[]);
  return {
    id:course.id,title:course.title,icon:course.icon||'📘',
    blurb:course.blurb||course.description||'',description:course.description||course.blurb||'',
    category:course.category||'foundations',level:course.level||'mixed',linked:course.id,status:'available',
    counts:{lessons:lessons.length,exercises:exercises.length,quiz:quiz.length,projects:projects.length},
    progressIds:{
      lessons:lessons.map((x,i)=>x.id||('lesson-'+i)),
      exercises:exercises.map((x,i)=>x.id||('exercise-'+i)),
      quiz:quiz.map((x,i)=>x.id||('quiz-'+i)),
      projects:projects.map((x,i)=>x.id||('project-'+i))
    }
  };
}
for(const course of extras){
  const item=summary(course);
  const i=catalog.courses.findIndex(x=>x&&x.id===course.id);
  if(i>=0) catalog.courses[i]=item; else catalog.courses.push(item);
}
fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n','utf8');
console.log('Merged '+extras.length+' additional courses. Catalog='+catalog.courses.length+', source='+source.length+'.');
