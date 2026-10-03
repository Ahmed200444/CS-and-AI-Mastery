'use strict';
const fs=require('fs'),assert=require('assert/strict');
const courses=JSON.parse(fs.readFileSync('assets/coursedata-source.json','utf8')).filter(c=>!c.hidden);
const groups={explanations:new Map(),examples:new Map(),exercises:new Map(),quiz:new Map(),projects:new Map()};
const normalized=x=>String(x||'').replace(/\s+/g,' ').trim();
function unique(group,value,where,min=65){const key=normalized(value);if(key.length<min)return;assert(!groups[group].has(key),`${group}: ${where} duplicates ${groups[group].get(key)}`);groups[group].set(key,where);}
for(const c of courses){
 for(const l of c.lessons||[]){unique('explanations',l.explanation||l.explain,c.id+':'+l.id);for(const e of l.examples||[])unique('examples',typeof e==='string'?e:e.code||e.text,c.id+':'+l.id);}
 for(const group of ['exercises','quiz','projects'])for(const [i,item] of (c[group]||[]).entries())unique(group,item.q||item.prompt||item.description,c.id+':'+i,45);
}
let pages=0,lessons=0;
for(const file of ['index.html',...fs.readdirSync('courses').filter(n=>n.endsWith('.html')).map(n=>'courses/'+n)]){
 const name=file,html=fs.readFileSync(file,'utf8');const seenScripts=new Set(),seenObjectives=new Set();
 for(const m of html.matchAll(/<script\b[^>]*src=["']([^"']+)["']/g)){const src=m[1].split('?')[0];assert(!seenScripts.has(src),name+': duplicate module '+src);seenScripts.add(src);}
 for(const m of (file==='index.html'?'':html).matchAll(/<h3>What you will learn<\/h3>\s*<ul>([\s\S]*?)<\/ul>/g))for(const li of m[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)){const text=normalized(li[1].replace(/<[^>]*>/g,' '));if(text.length>65){assert(!seenObjectives.has(text),name+': repeated objective '+text);seenObjectives.add(text);}}
 if(file!=='index.html'){lessons+=(html.match(/data-lesson="/g)||[]).length;pages++;}
}
console.log(`Platform repetition audit passed: ${courses.length} visible courses, ${pages} preserved course pages, ${lessons} lessons; unique authored explanations/examples/prompts and consolidated objectives/modules.`);
