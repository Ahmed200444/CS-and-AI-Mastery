const fs=require('fs');
const path=require('path');
const root=process.cwd();
const indexPath=path.join(root,'index.html');
const coursesDir=path.join(root,'courses');
const cssTag='<link rel="stylesheet" href="/assets/unified-learning-ui.css" data-csai-unified-ui>'; 
const jsTag='<script src="/assets/path-experience.js" defer data-csai-path-experience></script>';
const courseCssTag='<link rel="stylesheet" href="../assets/unified-learning-ui.css" data-csai-unified-ui>';

if(!fs.existsSync(indexPath))throw new Error('index.html missing');
if(!fs.existsSync(path.join(root,'assets','unified-learning-ui.css')))throw new Error('assets/unified-learning-ui.css missing');
if(!fs.existsSync(path.join(root,'assets','path-experience.js')))throw new Error('assets/path-experience.js missing');

function strip(html){
  return html
    .replace(/\n?<link\b[^>]*data-csai-unified-ui[^>]*>\n?/gi,'\n')
    .replace(/\n?<script\b[^>]*data-csai-path-experience[^>]*><\/script>\n?/gi,'\n');
}
let index=strip(fs.readFileSync(indexPath,'utf8'));
index=index.includes('</head>')?index.replace('</head>',cssTag+'\n</head>'):cssTag+'\n'+index;
index=index.includes('</body>')?index.replace('</body>',jsTag+'\n</body>'):index+'\n'+jsTag+'\n';
fs.writeFileSync(indexPath,index,'utf8');

if(!fs.existsSync(coursesDir))throw new Error('courses directory missing — run static course generation before unified UI injection');
const pages=fs.readdirSync(coursesDir).filter(f=>f.endsWith('.html'));
if(pages.length!==54)throw new Error(`Expected 54 generated course pages, found ${pages.length}`);
for(const file of pages){
  const p=path.join(coursesDir,file);let html=strip(fs.readFileSync(p,'utf8'));
  html=html.includes('</head>')?html.replace('</head>',courseCssTag+'\n</head>'):courseCssTag+'\n'+html;
  fs.writeFileSync(p,html,'utf8');
}
console.log(`Unified learning UI injected into index.html and ${pages.length} generated course pages.`);
