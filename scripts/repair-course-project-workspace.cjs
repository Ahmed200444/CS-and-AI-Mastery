const fs=require('fs');
const path=require('path');

const file=path.join(process.cwd(),'assets','course-project-workspace.js');
if(!fs.existsSync(file))throw new Error('assets/course-project-workspace.js is missing');

let src=fs.readFileSync(file,'utf8');
const broken="if(lang==='json'){try{var obj=JSON.parse(text);return{error:false,text:'JSON is valid.\\nTop-level type: '+(Array.isArray(obj)?'array':typeof obj)+'\\nProject check passed.'}}catch(e){return{error:true,text:'JSON error: '+e.message}}\n if(lang==='shell')";
const fixed="if(lang==='json'){try{var obj=JSON.parse(text);return{error:false,text:'JSON is valid.\\nTop-level type: '+(Array.isArray(obj)?'array':typeof obj)+'\\nProject check passed.'}}catch(e){return{error:true,text:'JSON error: '+e.message}}}\n if(lang==='shell')";

if(src.includes(broken)){
  src=src.replace(broken,fixed);
  fs.writeFileSync(file,src,'utf8');
  console.log('Repaired missing closing brace in course-project-workspace.js');
}else if(src.includes(fixed)){
  console.log('course-project-workspace.js syntax repair already present');
}else{
  throw new Error('Expected project workspace validation block was not found; refusing an unsafe automatic rewrite.');
}

// Keep the project workspace patch in the same pre-injection build stage so every
// generated course receives C++ project running plus code + README GitHub publishing.
require('./patch-project-readme-publishing.cjs');
