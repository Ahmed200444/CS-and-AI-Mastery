const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'index.html');
if(!fs.existsSync(file))throw new Error('index.html is missing');
let html=fs.readFileSync(file,'utf8');

// Remove only public-facing semantic-version labels from HTML text. Script/style
// blocks are preserved byte-for-byte so internal cache/build versions can remain.
const protectedBlocks=[];
html=html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi,block=>{
  const token=`__CSAI_PROTECTED_${protectedBlocks.length}__`;
  protectedBlocks.push(block);
  return token;
});
html=html
  .replace(/\b(CS\s*&\s*AI\s*Mastery)\s+v\d+\.\d+\.\d+\b/gi,'$1')
  .replace(/\bVersion\s*:?[ \t]*v?\d+\.\d+\.\d+\b/gi,'')
  .replace(/\bv\d+\.\d+\.\d+\b/g,'')
  .replace(/[ \t]{2,}/g,' ');
html=html.replace(/__CSAI_PROTECTED_(\d+)__/g,(_,i)=>protectedBlocks[Number(i)]||'');
fs.writeFileSync(file,html,'utf8');
console.log('Removed public version labels from the homepage while preserving internal build/cache versions.');
