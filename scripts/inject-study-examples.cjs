const fs=require('fs');
const path=require('path');
const root=process.cwd();
const indexPath=path.join(root,'index.html');
const coursesDir=path.join(root,'courses');
// FIX #16/#17 -- the v5.74 build tag the contracts assert.
// FIX #29 -- course pages need the relative ../assets/ form; index.html needs the bare form.
const tag='<script defer src="../assets/study-examples.js?v=20260824-v574"></script>';
const homeTag='<script src="assets/study-examples.js?v=20260824-v574" defer></script>';
const files=[indexPath];
if(!fs.existsSync(coursesDir))throw new Error('courses directory missing before study-example injection');
for(const name of fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html')))files.push(path.join(coursesDir,name));
if(files.length!==63)throw new Error(`Expected index + 62 course pages, found ${files.length}`);
for(const file of files){
 let html=fs.readFileSync(file,'utf8');
 // FIX #27 -- tolerate both the ../assets/ and /assets/ prefixes and any attribute order, so
// the shipped tag is actually removed instead of leaving a duplicate behind.
html=html.replace(/\s*<script\b[^>]*src=["'](?:\.\.\/|\/)?assets\/study-examples\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
 const at=html.toLowerCase().lastIndexOf('</body>');
 if(at<0)throw new Error(`Final </body> missing in ${path.relative(root,file)}`);
 html=html.slice(0,at)+'\n'+(file===indexPath?homeTag:tag)+'\n'+html.slice(at);
 fs.writeFileSync(file,html,'utf8');
}
console.log('Injected the every-key-idea study layer into the homepage and all 62 course pages.');
