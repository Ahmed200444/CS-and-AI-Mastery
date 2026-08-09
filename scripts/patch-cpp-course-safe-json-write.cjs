const fs=require('fs');
const path=require('path');
const root=process.cwd();
for(const rel of ['scripts/add-cpp-course.cjs','scripts/patch-course-count-for-cpp.cjs']){
 const file=path.join(root,rel);let s=fs.readFileSync(file,'utf8');
 s=s.replace("html=html.replace(re,`${match[1]}${safe}${match[3]}`);","html=html.replace(re,function(){return match[1]+safe+match[3];});");
 s=s.replace("html=html.replace(re,`${m[1]}${safe}${m[3]}`);","html=html.replace(re,function(){return m[1]+safe+m[3];});");
 fs.writeFileSync(file,s,'utf8');
}
const add=fs.readFileSync(path.join(root,'scripts/add-cpp-course.cjs'),'utf8');
const count=fs.readFileSync(path.join(root,'scripts/patch-course-count-for-cpp.cjs'),'utf8');
if(!/html=html\.replace\(re,function\(\)\{return match\[1\]\+safe\+match\[3\];\}\);/.test(add))throw new Error('Safe callback replacement missing from C++ course injector');
if(!/html=html\.replace\(re,function\(\)\{return m\[1\]\+safe\+m\[3\];\}\);/.test(count))throw new Error('Safe callback replacement missing from C++ metadata migration');
console.log('C++ course JSON insertion uses callback replacement; $ sequences inside existing course code cannot be interpreted as replacement tokens.');
