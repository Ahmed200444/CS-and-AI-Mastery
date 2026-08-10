const fs=require('fs');
const path=require('path');
const root=process.cwd();
const indexPath=path.join(root,'index.html');
const backupPath=path.join(root,'.csai-coursedata-backup.json');
const augmentPath=path.join(root,'scripts','augment-production-platform.cjs');
if(!fs.existsSync(indexPath))throw new Error('index.html missing');
if(!fs.existsSync(augmentPath))throw new Error('augment-production-platform.cjs missing');

// Protect the large legacy coursedata block while the production catalog is augmented.
let html=fs.readFileSync(indexPath,'utf8');
const re=/(<script\b[^>]*\bid=["']coursedata["'][^>]*>)([\s\S]*?)(<\/script>)/i;
const m=html.match(re);
if(!m)throw new Error('coursedata script missing before production augmentation');
fs.writeFileSync(backupPath,JSON.stringify({content:m[2]}),'utf8');
html=html.replace(re,`${m[1]}[]${m[3]}`);
fs.writeFileSync(indexPath,html,'utf8');

// The legacy augmentation helper used the first literal </body>, but index.html contains
// srcdoc HTML strings with their own </body>. Patch the build-workspace copy so production
// assets are always inserted at the real final document boundary.
let source=fs.readFileSync(augmentPath,'utf8');
const start=source.indexOf('function injectBeforeBody(html,tags)');
const end=source.indexOf('function themeScript()',start);
if(start<0||end<=start)throw new Error('Could not locate augmentation body-injection helper');
const safe=`function injectBeforeBody(html,tags){const marker='<!-- csai-production-augmentation -->';html=html.replace(new RegExp('\\\\n?'+marker+'[\\\\s\\\\S]*?<!-- /csai-production-augmentation -->\\\\n?','g'),'\\n');const block=marker+'\\n'+tags+'\\n<!-- /csai-production-augmentation -->';const at=html.toLowerCase().lastIndexOf('</body>');if(at<0)throw new Error('Final document </body> missing during production augmentation');return html.slice(0,at)+'\\n'+block+'\\n'+html.slice(at);}\n`;
source=source.slice(0,start)+safe+source.slice(end);
fs.writeFileSync(augmentPath,source,'utf8');
if(!source.includes("lastIndexOf('</body>')"))throw new Error('Safe final-body augmentation patch was not applied');
console.log('Protected legacy coursedata and forced 57-course augmentation to the real final document body.');
