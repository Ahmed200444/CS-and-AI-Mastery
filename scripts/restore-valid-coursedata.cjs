const fs=require('fs');
const path=require('path');
const root=process.cwd();
const indexPath=path.join(root,'index.html');
const sourcePath=path.join(root,'assets','coursedata-source.json');
const source=fs.readFileSync(sourcePath,'utf8');
const parsed=JSON.parse(source);
// JSON inside an HTML <script> element must not contain a literal </script>, even
// inside a JSON string, because the HTML parser would close the element early.
const safeSource=source.replace(/<\/script/gi,'<\\/script');
let html=fs.readFileSync(indexPath,'utf8');
const open='<script id="coursedata" type="application/json">';
const start=html.indexOf(open);
if(start<0) throw new Error('coursedata script open tag missing');
const contentStart=start+open.length;
const nextBlock=html.indexOf('<script id="companypathsdata"',contentStart);
if(nextBlock<0) throw new Error('companypathsdata marker missing after coursedata');
const end=html.lastIndexOf('</script>',nextBlock);
if(end<contentStart) throw new Error('intended coursedata closing tag missing');
html=html.slice(0,contentStart)+safeSource+html.slice(end);
fs.writeFileSync(indexPath,html);
console.log('Restored HTML-safe coursedata JSON:', parsed.length, 'courses.');
