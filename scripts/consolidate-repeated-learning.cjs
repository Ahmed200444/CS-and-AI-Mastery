'use strict';
const fs=require('fs'),path=require('path');
const text=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
let removed=0,scriptCopies=0,proseFixes=0;

function polishGeneratedProse(html){
 const rules=[
  [/, which is exactly\./g,'.'],
  [/\bwhich is exactly\./g,''],
  [/focus specifically on apply(?:ing)? this lesson idea/gi,'apply this lesson idea'],
  [/input, state, or operation changes into a result/gi,'input or state changes into a result'],
  [/\b02Registers\b/g,'Registers'],
  [/written with WITH/gi,'written with the with statement']
 ];
 for(const [re,replacement] of rules){
  const before=html;html=html.replace(re,replacement);if(html!==before)proseFixes++;
 }
 return html;
}

for(const file of ['index.html',...fs.readdirSync('courses').filter(n=>n.endsWith('.html')).map(n=>path.join('courses',n))]){
 let html=fs.readFileSync(file,'utf8');

 // Remove any older generated checklist. Repeated objectives should not become
 // another theory block; keep one useful occurrence and drop later duplicates.
 html=html.replace(/<section\b[^>]*data-shared-study-checklist[^>]*>[\s\S]*?<\/section>\s*/g,'');

 const objective=/<h3>What you will learn<\/h3>\s*<ul>([\s\S]*?)<\/ul>/g;
 const seenObjectives=new Set();
 if(file!=='index.html'){
  html=html.replace(objective,(all,body)=>{
   const cleaned=body.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/g,(li,inner)=>{
    const key=text(inner);
    if(key.length>65&&seenObjectives.has(key)){removed++;return'';}
    if(key.length>65)seenObjectives.add(key);
    return li;
   });
   return all.replace(body,cleaned);
  });
 }

 // Keep the first script occurrence so initialization order remains stable.
 const seenScripts=new Set();
 html=html.replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/g,(tag,src)=>{
  const key=src.split('?')[0];
  if(seenScripts.has(key)){scriptCopies++;return'';}
  seenScripts.add(key);return tag;
 });

 html=polishGeneratedProse(html);
 fs.writeFileSync(file,html,'utf8');
}
console.log(`Repeated learning consolidated: ${removed} repeated objective occurrences removed; ${scriptCopies} duplicate script loads removed; ${proseFixes} generated-prose cleanup rules applied.`);
