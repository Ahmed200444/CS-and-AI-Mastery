'use strict';
const fs=require('fs');
const path=require('path');
const root=process.cwd();
const sourcePath=path.join(root,'assets','coursedata-source.json');
const outDir=path.join(root,'assets','course-data');
const courses=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
if(!Array.isArray(courses)||courses.length!==65)throw new Error('Expected 65 courses in coursedata-source.json');
fs.mkdirSync(outDir,{recursive:true});
let lessons=0;
for(const course of courses){
  if(!course||typeof course.id!=='string'||!/^[A-Za-z0-9._-]+$/.test(course.id))throw new Error('Unsafe course id');
  fs.writeFileSync(path.join(outDir,course.id+'.json'),JSON.stringify(course),'utf8');
  lessons+=Array.isArray(course.lessons)?course.lessons.length:0;
}
if(lessons!==832)throw new Error('Expected 832 lessons, found '+lessons);
console.log('Synced 65 course mirrors from coursedata-source.json before static-page generation.');
