const fs=require('fs');
const path=require('path');
const root=process.cwd();
const sourcePath=path.join(root,'scripts','augment-production-platform.cjs');
if(!fs.existsSync(sourcePath))throw new Error('augment-production-platform.cjs missing');
let source=fs.readFileSync(sourcePath,'utf8');
const start=source.indexOf('function injectBeforeBody(html,tags)');
const end=source.indexOf('function themeScript()',start);
if(start<0||end<=start)throw new Error('Could not locate production augmentation body-injection helper');
const safeHelper=`function injectBeforeBody(html,tags){
 const marker='<!-- csai-production-augmentation -->';
 html=html.replace(new RegExp('\\\\n?'+marker+'[\\\\s\\\\S]*?<!-- /csai-production-augmentation -->\\\\n?','g'),'\\n');
 const block=marker+'\\n'+tags+'\\n<!-- /csai-production-augmentation -->';
 const at=html.toLowerCase().lastIndexOf('</body>');
 if(at<0)throw new Error('Final document </body> missing during production augmentation');
 return html.slice(0,at)+'\\n'+block+'\\n'+html.slice(at);
}
`;
source=source.slice(0,start)+safeHelper+source.slice(end);
if(/return html\.replace\(\/\\s\*<\\\/body>\/i/.test(source.slice(start,start+900)))throw new Error('Unsafe first-body augmentation helper survived patch');
const tmp=path.join(root,'scripts','.augment-production-platform.safe.tmp.cjs');
try{
 fs.writeFileSync(tmp,source,'utf8');
 require(tmp);
}finally{
 try{fs.unlinkSync(tmp)}catch(e){}
}
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const marker=index.lastIndexOf('<!-- csai-production-augmentation -->');
const finalBody=index.toLowerCase().lastIndexOf('</body>');
if(marker<0||finalBody<0||marker>finalBody)throw new Error('Production augmentation marker was not inserted before the real final body close');
console.log('Production augmentation executed with safe final-document boundary insertion.');
