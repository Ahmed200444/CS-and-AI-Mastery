const fs=require('fs');
const path=require('path');
const root=process.cwd();
const indexPath=path.join(root,'index.html');
const coursesDir=path.join(root,'courses');
const courseTag='<script defer src="../assets/brilliant-tutor-v1.js?v=20260927-v1"></script>';
const homeTag='<script defer src="assets/brilliant-tutor-v1.js?v=20260927-v1"></script>';
const files=[indexPath];
if(!fs.existsSync(coursesDir))throw new Error('courses directory missing before tutor injection');
for(const name of fs.readdirSync(coursesDir).filter(function(x){return x.endsWith('.html');}))files.push(path.join(coursesDir,name));
if(files.length!==65)throw new Error('Expected index + 64 course pages, found '+files.length);
for(const file of files){
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/\s*<script\b[^>]*src=["'](?:\.\.\/|\/)?assets\/brilliant-tutor-v1\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
 const at=html.toLowerCase().lastIndexOf('</body>');
 if(at<0)throw new Error('Final </body> missing in '+path.relative(root,file));
 html=html.slice(0,at)+'\n'+(file===indexPath?homeTag:courseTag)+'\n'+html.slice(at);
 fs.writeFileSync(file,html,'utf8');
}
console.log('Injected the lesson-aware tutor into the homepage and all 64 course pages.');