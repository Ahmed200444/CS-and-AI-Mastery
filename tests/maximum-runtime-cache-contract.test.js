const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),r=p=>fs.readFileSync(path.join(root,p),'utf8'),ok=(c,m)=>{if(!c)throw new Error(m)};
const cache=r('runtime-cache.js');
ok(/https:\/\/cdn\.jsdelivr\.net\/pyodide\/v0\.26\.2\/full\//.test(cache),'Pyodide cache must have a valid remote origin');
ok(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/sql\.js\/1\.8\.0\//.test(cache),'SQL cache must have a valid remote origin');
ok(/JSCPP@2\.0\.9/.test(cache),'C++ lightweight cache origin missing');
ok(/max-age=31536000/.test(cache),'cached runtimes must use immutable browser caching');
const forbiddenPython='https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
const forbiddenSql='https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
for(const p of fs.readdirSync(path.join(root,'assets'),{withFileTypes:true})){
  if(!p.isFile()||!p.name.endsWith('.js'))continue;
  const t=r('assets/'+p.name);
  ok(!t.includes(forbiddenPython),p.name+': still hardcodes remote Pyodide script');
  ok(!t.includes(forbiddenSql),p.name+': still hardcodes remote SQL.js script');
}
for(const p of fs.readdirSync(path.join(root,'assets/runtime-inline')).filter(f=>f.endsWith('.js'))){
  const t=r('assets/runtime-inline/'+p);
  ok(!t.includes(forbiddenPython),p+': homepage runtime still hardcodes remote Pyodide');
  ok(!t.includes(forbiddenSql),p+': homepage runtime still hardcodes remote SQL.js');
}
console.log('Maximum local runtime cache contracts passed.');
