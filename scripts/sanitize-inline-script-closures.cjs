const fs=require('fs');
const path=require('path');
const vm=require('vm');
const cp=require('child_process');
const os=require('os');
const root=process.cwd();
const targets=[path.join(root,'index.html')];
const courseDir=path.join(root,'courses');
if(fs.existsSync(courseDir))for(const f of fs.readdirSync(courseDir).filter(x=>x.endsWith('.html')))targets.push(path.join(courseDir,f));
function nextNonSpace(source,from){let i=from;while(i<source.length&&/\s/.test(source[i]))i++;return source[i]||'';}
function attrsType(open){const m=/\btype\s*=\s*["']([^"']+)["']/i.exec(open);return (m?m[1]:'').toLowerCase();}
function validCode(code,open,index){
 const type=attrsType(open);
 if(/application\/(?:json|ld\+json)/.test(type)){try{JSON.parse(code.trim()||'null');return true}catch(e){return false}}
 if(/text\/plain|text\/template|x-template/.test(type))return true;
 if(/\btype\s*=\s*["']module["']/i.test(open)){
  const tmp=path.join(os.tmpdir(),`csai-sanitize-${process.pid}-${index}.mjs`);fs.writeFileSync(tmp,code);
  const r=cp.spawnSync(process.execPath,['--check',tmp],{encoding:'utf8'});try{fs.unlinkSync(tmp)}catch(e){}return r.status===0;
 }
 try{new vm.Script(code,{filename:`inline-${index}.js`});return true}catch(e){return false}
}
function sanitize(source,file){
 let out='',cursor=0,fixes=0,blocks=0;
 const openRe=/<script\b[^>]*>/ig;
 while(true){
  openRe.lastIndex=cursor;const om=openRe.exec(source);if(!om){out+=source.slice(cursor);break;}
  const openStart=om.index,openEnd=openRe.lastIndex,open=om[0];
  out+=source.slice(cursor,openStart)+open;
  const srcAttr=/\bsrc\s*=/i.test(open);
  let segStart=openEnd,code='',found=false,closeIndex=0;
  const closeRe=/<\/script\s*>/ig;closeRe.lastIndex=segStart;
  while(true){
   const cm=closeRe.exec(source);if(!cm)break;
   const piece=source.slice(segStart,cm.index),candidate=code+piece;
   const after=nextNonSpace(source,closeRe.lastIndex);
   const plausibleBoundary=after===''||after==='<';
   const valid=srcAttr ? candidate.trim()==='' : validCode(candidate,open,blocks+'-'+closeIndex);
   if(valid&&plausibleBoundary){
    out+=candidate+cm[0];cursor=closeRe.lastIndex;found=true;blocks++;break;
   }
   code=candidate+'<\\/script>';segStart=closeRe.lastIndex;fixes++;closeIndex++;
  }
  if(!found)throw new Error(`${path.relative(root,file)}: could not find a syntactically valid closing </script> for block ${blocks+1}`);
 }
 return{html:out,fixes,blocks};
}
let totalFixes=0,totalBlocks=0,changed=0;
for(const file of targets){if(!fs.existsSync(file))continue;const before=fs.readFileSync(file,'utf8');const r=sanitize(before,file);if(r.html!==before){fs.writeFileSync(file,r.html);changed++;}totalFixes+=r.fixes;totalBlocks+=r.blocks;}
console.log(`Inline-script closure sanitizer checked ${totalBlocks} script blocks across ${targets.filter(fs.existsSync).length} HTML files; escaped ${totalFixes} unsafe literal </script> sequence(s) in ${changed} file(s).`);
