const fs=require('fs');
const path=require('path');
const root=process.cwd(),dir=path.join(root,'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.html'));
if(files.length!==55)throw new Error(`Expected 55 course pages before C++ runtime injection, found ${files.length}`);
let loopCount=0,cppCount=0;
for(const file of files){
 const full=path.join(dir,file);let html=fs.readFileSync(full,'utf8');
 html=html.replace(/<script[^>]*src=["']\/assets\/cpp-loop-deep-dive\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
 html=html.replace(/<script[^>]*src=["']\/assets\/dedicated-cpp-course\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
 const tags=['<script src="/assets/cpp-loop-deep-dive.js?v=20260809-1"></script>'];
 if(file==='cpp.html')tags.unshift('<script src="/assets/dedicated-cpp-course.js?v=20260809-1"></script>');
 const at=html.toLowerCase().lastIndexOf('</body>');html=at>=0?html.slice(0,at)+tags.join('\n')+'\n'+html.slice(at):html+'\n'+tags.join('\n');
 fs.writeFileSync(full,html,'utf8');loopCount++;if(file==='cpp.html')cppCount++;
}
if(loopCount!==55||cppCount!==1)throw new Error(`Dedicated C++ injection mismatch: loop=${loopCount}, cpp=${cppCount}`);
const cpp=fs.readFileSync(path.join(dir,'cpp.html'),'utf8');
if((cpp.match(/dedicated-cpp-course\.js/g)||[]).length!==1)throw new Error('C++ page must contain exactly one dedicated runtime');
console.log(`Injected universal C++ loop explanations into ${loopCount} pages and dedicated C++ runtime into cpp.html.`);
