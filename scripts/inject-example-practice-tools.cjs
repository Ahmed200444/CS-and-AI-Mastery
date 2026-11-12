const fs=require('fs');
const path=require('path');
const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');
const exampleTag='<script defer src="../assets/example-learning-tools.js?v=20260822-v567"></script>';
const practiceTag='<script defer src="../assets/practice-publish-completer.js?v=20260823-v573"></script>';
let count=0;
for(const file of fs.readdirSync(dir).filter(name=>name.endsWith('.html'))){
  const full=path.join(dir,file);
  let html=fs.readFileSync(full,'utf8');
  html=html.replace(/<script[^>]*src=["']\/assets\/example-learning-tools\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  html=html.replace(/<script[^>]*src=["']\/assets\/practice-publish-completer\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  const body=html.toLowerCase().lastIndexOf('</body>');
  const tags=exampleTag+'\n'+practiceTag+'\n';
  html=body>=0?html.slice(0,body)+tags+html.slice(body):html+'\n'+tags;
  fs.writeFileSync(full,html,'utf8');
  count++;
}
if(count!==62)throw new Error(`Expected 62 course pages, injected ${count}`);
console.log(`Injected deep example tools and practice publishing into ${count} course pages.`);
