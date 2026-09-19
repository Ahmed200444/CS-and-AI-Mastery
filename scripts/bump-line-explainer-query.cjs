const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const version='20260919-v575';
const files=[path.join(root,'index.html')];
const coursesDir=path.join(root,'courses');
if(fs.existsSync(coursesDir)){
  for(const name of fs.readdirSync(coursesDir)){
    if(name.endsWith('.html'))files.push(path.join(coursesDir,name));
  }
}
let touched=0,replacements=0;
for(const file of files){
  if(!fs.existsSync(file))continue;
  const before=fs.readFileSync(file,'utf8');
  let local=0;
  const after=before.replace(/line-by-line-explanations\.js(?:\?v=[^"'\s<]*)?/g,()=>{
    local++;
    return 'line-by-line-explanations.js?v='+version;
  });
  if(after!==before){
    fs.writeFileSync(file,after,'utf8');
    touched++;
    replacements+=local;
  }
}
if(!replacements)throw new Error('No line-by-line explainer script references were found to cache-bust.');
console.log('Updated line-by-line explainer cache key in '+touched+' HTML files ('+replacements+' references).');
