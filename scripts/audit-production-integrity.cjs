const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const os=require('os');
const root=process.cwd(),failures=[];
const htmlFiles=[path.join(root,'index.html')];
const coursesDir=path.join(root,'courses');
if(fs.existsSync(coursesDir))for(const f of fs.readdirSync(coursesDir).filter(x=>x.endsWith('.html')))htmlFiles.push(path.join(coursesDir,f));
function rel(p){return path.relative(root,p).replace(/\\/g,'/')}
function stripVisible(html){return html
 .replace(/<script\b[\s\S]*?<\/script\s*>/gi,' ')
 .replace(/<style\b[\s\S]*?<\/style\s*>/gi,' ')
 .replace(/<template\b[\s\S]*?<\/template\s*>/gi,' ')
 .replace(/<pre\b[\s\S]*?<\/pre\s*>/gi,' ')
 .replace(/<code\b[\s\S]*?<\/code\s*>/gi,' ')
 .replace(/<textarea\b[\s\S]*?<\/textarea\s*>/gi,' ')
 .replace(/<[^>]+>/g,' ')
 .replace(/&quot;|&#34;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&amp;/gi,'&')
 .replace(/\s+/g,' ');
}
const leakPatterns=[
 ['DOM JavaScript',/document\.(?:getElementById|querySelector|querySelectorAll|createElement)\s*\(/],
 ['window assignment',/window\.[A-Za-z_$][\w$]*\s*=\s*(?:function|\(?[A-Za-z_$])/],
 ['raw function declaration',/function\s+[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\{/],
 ['raw variable declaration',/(?:^|\s)(?:var|let|const)\s+[A-Za-z_$][\w$]*\s*=\s*(?:document|window|function|\{\s*|\[\s*)/],
 ['template concatenation leak',/["']\s*\+\s*[A-Za-z_$][\w$]*\s*\([^)]*\)\s*\+\s*["']/],
 ['raw innerHTML code',/\.innerHTML\s*=\s*[A-Za-z_$"']/]
];
let inlineChecked=0,localAssetsChecked=0;
for(const file of htmlFiles){
 const html=fs.readFileSync(file,'utf8'),name=rel(file);
 const opens=(html.match(/<script\b/gi)||[]).length,closes=(html.match(/<\/script\s*>/gi)||[]).length;
 if(opens!==closes)failures.push(`${name}: unbalanced script tags (${opens} open, ${closes} close)`);
 const visible=stripVisible(html);
 for(const [label,re] of leakPatterns){const m=re.exec(visible);if(m){const start=Math.max(0,m.index-90),end=Math.min(visible.length,m.index+190);failures.push(`${name}: possible visible ${label}: ${visible.slice(start,end)}`);break;}}
 const scriptRe=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;let sm;
 while((sm=scriptRe.exec(html))){
  const attrs=sm[1]||'',code=sm[2]||'';
  if(/\bsrc\s*=/.test(attrs)||!code.trim())continue;
  if(/type\s*=\s*["'](?:application\/json|application\/ld\+json|text\/plain)["']/i.test(attrs))continue;
  const ext=/type\s*=\s*["']module["']/i.test(attrs)?'.mjs':'.js';
  const tmp=path.join(os.tmpdir(),`csai-inline-${process.pid}-${inlineChecked}${ext}`);fs.writeFileSync(tmp,code.replace(/<\\\/script>/gi,'</script>'));
  const r=cp.spawnSync(process.execPath,['--check',tmp],{encoding:'utf8'});try{fs.unlinkSync(tmp)}catch(e){}
  if(r.status!==0)failures.push(`${name}: inline JavaScript syntax error: ${(r.stderr||r.stdout||'').trim().slice(0,450)}`);
  inlineChecked++;
 }
 const refs=[...html.matchAll(/(?:src|href)=["'](\/assets\/[^"'?#]+)[^"']*["']/gi)].map(m=>m[1]);
 for(const ref of new Set(refs)){const p=path.join(root,ref.replace(/^\//,''));if(!fs.existsSync(p))failures.push(`${name}: missing local asset ${ref}`);else localAssetsChecked++;}
}
if(htmlFiles.length!==58)failures.push(`expected index + 57 course pages = 58 HTML files, found ${htmlFiles.length}`);
const expectedAssets=['assets/adaptive-practice-layer.js','assets/project-readme-layer.js','assets/cpp-runner-ui-worker.js','assets/runner-performance-guard.js'];
for(const a of expectedAssets)if(!fs.existsSync(path.join(root,a)))failures.push(`missing critical runtime ${a}`);
for(const f of htmlFiles.slice(1)){
 const html=fs.readFileSync(f,'utf8'),name=rel(f);
 if(!html.includes('adaptive-practice-layer.js'))failures.push(`${name}: adaptive practice runtime missing`);
 if(!html.includes('project-readme-layer.js'))failures.push(`${name}: project/README runtime missing`);
 if(!html.includes('cpp-runner-ui-worker.js'))failures.push(`${name}: C++ runner missing`);
 if(!html.includes('runner-performance-guard.js'))failures.push(`${name}: runner performance guard missing`);
}
if(failures.length){console.error('Production integrity audit failed:');failures.slice(0,120).forEach(x=>console.error(' - '+x));if(failures.length>120)console.error(` - ... ${failures.length-120} more`);process.exit(1)}
console.log(`Production integrity audit passed: ${htmlFiles.length} HTML files, ${inlineChecked} inline JS blocks syntax-checked, ${localAssetsChecked} local asset references resolved, no visible raw-JavaScript signatures detected.`);
