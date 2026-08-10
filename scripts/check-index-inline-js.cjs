const fs=require('fs');
const vm=require('vm');
const path=require('path');
const label=process.argv.slice(2).join(' ')||'checkpoint';
const file=path.join(process.cwd(),'index.html');
if(!fs.existsSync(file))throw new Error('index.html missing');
const html=fs.readFileSync(file,'utf8');
const re=/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
let m,index=0,bad=[];
while((m=re.exec(html))){
 const attrs=m[1]||'',code=m[2]||'';
 if(/\bsrc\s*=/.test(attrs)||!code.trim()){index++;continue;}
 if(/type\s*=\s*["'](?:application\/json|application\/ld\+json|text\/plain|text\/template|x-template)["']/i.test(attrs)){index++;continue;}
 try{new vm.Script(code,{filename:`inline-${index}.js`});}
 catch(e){
   const lines=code.split(/\r?\n/),line=Math.max(1,Number(e.lineNumber)||Number((String(e.stack).match(/inline-\d+\.js:(\d+)/)||[])[1])||1);
   const from=Math.max(0,line-4),to=Math.min(lines.length,line+3);
   bad.push({index,line,message:e.message,snippet:lines.slice(from,to).map((x,i)=>`${from+i+1}: ${x}`).join('\n')});
 }
 index++;
}
if(bad.length){
 console.error(`[inline-check:${label}] FAIL invalid inline blocks: ${bad.length}`);
 bad.slice(0,5).forEach(b=>console.error(`BLOCK ${b.index} line ${b.line}: ${b.message}\n${b.snippet}`));
 process.exit(1);
}
console.log(`[inline-check:${label}] PASS ${index} browser-visible script blocks parsed; no inline JavaScript syntax errors.`);
