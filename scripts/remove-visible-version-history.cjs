const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'index.html');
let html=fs.readFileSync(file,'utf8');
const before=(html.match(/<details\b[^>]*class=["'][^"']*hub-changelog[^"']*["'][^>]*>[\s\S]*?<\/details>\s*/gi)||[]).length;
html=html.replace(/<details\b[^>]*class=["'][^"']*hub-changelog[^"']*["'][^>]*>[\s\S]*?<\/details>\s*/gi,'');
// Keep internal platform version metadata for exports/diagnostics/cache compatibility;
// only the user-facing footer history is removed.
fs.writeFileSync(file,html,'utf8');
const result=fs.readFileSync(file,'utf8');
if(/<details\b[^>]*class=["'][^"']*hub-changelog/i.test(result))throw new Error('Visible hub version history still remains');
console.log(`Removed ${before} visible footer version/changelog block(s); internal version metadata remains available to platform logic.`);
