const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),cp=require('child_process');
const root=process.cwd(),dir=path.join(root,'courses');
if(!fs.existsSync(dir))throw new Error('courses directory missing; run the production build first');
const pages=fs.readdirSync(dir).filter(f=>f.endsWith('.html')).sort();
if(pages.length!==54)throw new Error(`Expected 54 generated course pages, found ${pages.length}`);
function decode(v){return String(v||'').replace(/<[^>]+>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');}
function lang(code,open){
  const hint=String(open||'').toLowerCase();
  if(/data-reference-only|data-example-audit=["']reference/.test(hint))return null;
  if(/data-lang-variant=["']cpp|language-cpp|lang-cpp/.test(hint)||/#include\s*[<"]|\bstd::|\bcout\s*<<|\bint\s+main\s*\(/.test(code))return'cpp';
  if(/data-lang-variant=["']python|language-python|lang-python/.test(hint)||/(^|\n)\s*(def\s+|class\s+|from\s+|import\s+|for\s+\w+\s+in\s+|while\s+.+:|if\s+.+:|print\s*\()/.test(code))return'python';
  return null;
}
const occurrences=[],unique=new Map(),re=/<pre\b([^>]*)>([\s\S]*?)<\/pre>/gi;
for(const file of pages){
  const html=fs.readFileSync(path.join(dir,file),'utf8');let m,index=0;
  while((m=re.exec(html))){
    index++;const code=decode(m[2]).trim();if(!code)continue;
    const language=lang(code,m[1]);if(!language)continue;
    const hash=crypto.createHash('sha256').update(language+'\0'+code).digest('hex');
    occurrences.push({file,index,language,hash});
    if(!unique.has(hash))unique.set(hash,{language,code,locations:[]});
    unique.get(hash).locations.push(`${file}#pre-${index}`);
  }
}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'csai-code-cert-')),failures=[],stats={pages:pages.length,occurrences:occurrences.length,unique:unique.size,python:0,cpp:0,cppCompileOnly:0};
function run(cmd,args,opts={}){return cp.spawnSync(cmd,args,{encoding:'utf8',timeout:opts.timeout||6000,maxBuffer:2*1024*1024});}
let n=0;
for(const item of unique.values()){
  n++;const stem=path.join(temp,`case-${String(n).padStart(4,'0')}`);
  if(item.language==='python'){
    stats.python++;const file=stem+'.py';fs.writeFileSync(file,item.code+'\n');
    const result=run('python3',[file],{timeout:5000});
    if(result.error||result.status!==0)failures.push({language:'python',locations:item.locations.slice(0,5),error:result.error?.message||result.stderr||`exit ${result.status}`});
  }else{
    stats.cpp++;const file=stem+'.cpp',bin=stem;fs.writeFileSync(file,item.code+'\n');
    const hasMain=/\bint\s+main\s*\(/.test(item.code);
    const args=hasMain?['-std=c++17','-O0',file,'-o',bin]:['-std=c++17','-fsyntax-only',file];
    const compile=run('g++',args,{timeout:12000});
    if(compile.error||compile.status!==0){failures.push({language:'cpp',locations:item.locations.slice(0,5),error:compile.error?.message||compile.stderr||`compile exit ${compile.status}`});continue;}
    if(!hasMain){stats.cppCompileOnly++;continue;}
    const result=run(bin,[],{timeout:5000});
    if(result.error||result.status!==0)failures.push({language:'cpp',locations:item.locations.slice(0,5),error:result.error?.message||result.stderr||`exit ${result.status}`});
  }
}
fs.rmSync(temp,{recursive:true,force:true});
console.log(`Generated-code certification: ${stats.pages} courses, ${stats.occurrences} Python/C++ example occurrences, ${stats.unique} unique programs/snippets.`);
console.log(`Python executed: ${stats.python}; C++ checked: ${stats.cpp} (${stats.cppCompileOnly} syntax-only snippets without main).`);
if(failures.length){
  console.error(JSON.stringify(failures.slice(0,30),null,2));
  throw new Error(`${failures.length} generated Python/C++ examples failed certification`);
}
console.log('Generated Python/C++ code certification passed.');
