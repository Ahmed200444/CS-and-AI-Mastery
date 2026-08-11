const fs=require('fs');
const path=require('path');
const root=process.cwd();
const files=[path.join(root,'index.html')];
const courses=path.join(root,'courses');
if(fs.existsSync(courses))for(const name of fs.readdirSync(courses).filter(x=>x.endsWith('.html')))files.push(path.join(courses,name));
const tag='<script src="/assets/python-only-ui.js?v=20260811-2" defer></script>';
let fixed=0;
for(const file of files){
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/\s*<script\b[^>]*src=["']\/assets\/python-only-ui\.js[^"']*["'][^>]*><\/script>\s*/gi,'\n');
 // A previous first-match injection could land inside a legacy srcdoc string.
 // Removing that tag leaves a literal newline inside the quoted HTML string;
 // collapse that newline before parsing the page's inline JavaScript again.
 html=html.replace(/'\s*\n\s*<\/body><\/html>'/g,"'</body></html>'");
 html=html.replace(/"\s*\n\s*<\/body><\/html>"/g,'"</body></html>"');
 const at=html.toLowerCase().lastIndexOf('</body>');
 if(at<0)throw new Error(`Final </body> missing in ${path.relative(root,file)}`);
 html=html.slice(0,at)+'\n'+tag+'\n'+html.slice(at);
 fs.writeFileSync(file,html,'utf8');fixed++;
}
if(fixed!==58)throw new Error(`Expected index + 57 course pages, fixed ${fixed}`);
console.log(`Python-only runtime moved to the real final body boundary in ${fixed} HTML files and legacy preview strings were repaired.`);
