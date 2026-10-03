'use strict';
const fs=require('fs'),path=require('path');
const text=s=>s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
let moved=0,scriptCopies=0;
for(const file of ['index.html',...fs.readdirSync('courses').filter(n=>n.endsWith('.html')).map(n=>path.join('courses',n))]){let html=fs.readFileSync(file,'utf8');
 // The build is repeatable: retain the existing common checklist when no
 // repeated objective remains, rather than discarding already consolidated text.
 const objective=/<h3>What you will learn<\/h3>\s*<ul>([\s\S]*?)<\/ul>/g,counts=new Map(),shared=new Map();
 for(const match of html.matchAll(objective))for(const li of match[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)){const key=text(li[1]);if(key.length>65){counts.set(key,(counts.get(key)||0)+1);shared.set(key,li[0]);}}
 const repeated=new Set([...counts].filter(([,n])=>n>1).map(([key])=>key));
 if(file!=='index.html'&&repeated.size){
  html=html.replace(objective,(all,body)=>all.replace(body,body.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/g,(li,inner)=>{if(repeated.has(text(inner))){moved++;return '';}return li;})));
  const checklist='<section class="card" data-shared-study-checklist><h2>Course study checklist</h2><ul>'+[...repeated].map(k=>shared.get(k)).join('')+'</ul></section>\n';
  html=html.replace(/<section\b[^>]*data-shared-study-checklist[^>]*>[\s\S]*?<\/section>\s*/g,'');
  html=html.replace(/(<section\b[^>]*class="lessons"[^>]*>)/,checklist+'$1');
 }
 // Keep the first occurrence so blocking/deferred initialization order stays
 // unchanged. Version differences do not justify loading a module twice.
 const seen=new Set();html=html.replace(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/g,(tag,src)=>{const key=src.split('?')[0];if(seen.has(key)){scriptCopies++;return '';}seen.add(key);return tag;});
 fs.writeFileSync(file,html);
}
console.log(`Repeated learning consolidated: ${moved} objective occurrences moved into one checklist per course; ${scriptCopies} duplicate script loads removed.`);
