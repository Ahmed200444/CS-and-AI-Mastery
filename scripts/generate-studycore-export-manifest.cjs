'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const root=process.cwd();
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const courses=JSON.parse(fs.readFileSync(path.join(root,'assets','coursedata-source.json'),'utf8'));
let commit=(process.env.COMMIT_REF||process.env.GITHUB_SHA||'').trim();
if(!commit){try{commit=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}}
if(!/^[0-9a-f]{40}$/i.test(commit))throw new Error('A full source commit is required for the StudyCore export manifest.');
if(!Array.isArray(courses)||!courses.length)throw new Error('Course source data is missing.');
const manifest={schemaVersion:1,source:'Ahmed200444/CS-and-AI-Mastery',version:String(pkg.version),commit,courseCount:courses.length,generatedAt:new Date().toISOString()};
fs.writeFileSync(path.join(root,'assets','studycore-export-manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
console.log('Generated StudyCore export manifest for v'+manifest.version+' at '+commit.slice(0,12)+'.');
