const fs=require('fs');
const path=require('path');
const root=process.cwd();
const indexPath=path.join(root,'index.html');
const coursesDir=path.join(root,'courses');
const tag='<script src="/assets/study-examples.js?v=20260811-2" defer></script>';
const files=[indexPath];
if(!fs.existsSync(coursesDir))throw new Error('courses directory missing before study-example injection');
for(const name of fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html')))files.push(path.join(coursesDir,name));
if(files.length!==58)throw new Error(`Expected index + 57 course pages, found ${files.length}`);
for(const file of files){
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/\s*<script\b[^>]*src=["']\/assets\/study-examples\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
 const at=html.toLowerCase().lastIndexOf('</body>');
 if(at<0)throw new Error(`Final </body> missing in ${path.relative(root,file)}`);
 html=html.slice(0,at)+'\n'+tag+'\n'+html.slice(at);
 fs.writeFileSync(file,html,'utf8');
}
console.log('Injected responsive lazy 5–8-example study layer into the homepage and all 57 course pages.');
