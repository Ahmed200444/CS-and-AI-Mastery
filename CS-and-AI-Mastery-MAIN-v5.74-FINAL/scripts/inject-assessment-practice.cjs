const fs=require('fs');
const path=require('path');
const vm=require('vm');

const root=process.cwd();
const indexPath=path.join(root,'index.html');
const courseDataDir=path.join(root,'assets','course-data');
const coursesDir=path.join(root,'courses');

if(!fs.existsSync(indexPath))throw new Error('index.html is missing');
if(!fs.existsSync(courseDataDir))throw new Error('course-data directory is missing');
if(!fs.existsSync(coursesDir))throw new Error('courses directory is missing');

const indexHtml=fs.readFileSync(indexPath,'utf8');

function readJsonScript(id){
  const re=new RegExp(`<script\\b[^>]*\\bid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`,'i');
  const m=indexHtml.match(re);
  if(!m)return [];
  return JSON.parse(m[1]);
}

function extractArrayVar(name){
  const needle=new RegExp(`\\b(?:var|let|const)\\s+${name}\\s*=\\s*\\[`,'g');
  const m=needle.exec(indexHtml);
  if(!m)return [];
  const start=indexHtml.indexOf('[',m.index);
  let depth=0,quote=null,escaped=false,lineComment=false,blockComment=false;
  for(let i=start;i<indexHtml.length;i++){
    const ch=indexHtml[i],next=indexHtml[i+1];
    if(lineComment){if(ch==='\n')lineComment=false;continue}
    if(blockComment){if(ch==='*'&&next==='/'){blockComment=false;i++}continue}
    if(quote){if(escaped){escaped=false;continue}if(ch==='\\'){escaped=true;continue}if(ch===quote){quote=null}continue}
    if(ch==='/'&&next==='/'){lineComment=true;i++;continue}
    if(ch==='/'&&next==='*'){blockComment=true;i++;continue}
    if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue}
    if(ch==='[')depth++;
    if(ch===']'){
      depth--;
      if(depth===0){
        const literal=indexHtml.slice(start,i+1);
        return vm.runInNewContext('('+literal+')',{}, {timeout:1500});
      }
    }
  }
  throw new Error(`Could not find end of ${name}`);
}

function norm(v){return String(v||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()}
function safeJson(v){return JSON.stringify(v).replace(/<\//g,'<\\/')}
function exerciseKey(item,index){return item&&item.id?String(item.id):`exercises-${index}`}
function starterFromSolution(item,lang){
  if(item&&item.starter)return item.starter;
  const sol=String(item&&item.solution||'');
  if(lang==='python'&&sol){
    const m=sol.match(/^\s*(def\s+[^\n]+:)/m);
    if(m)return `${m[1]}\n    pass`;
  }
  const prompt=String(item&&item.prompt||'');
  const inline=prompt.match(/`([^`]+)`/);
  if(inline&&/debug/i.test(String(item&&item.type||'')))return inline[1];
  return undefined;
}

const exdata=readJsonScript('exdata');
const exById=new Map(exdata.map(x=>[x.id,x]));
let dsaLessons=[];
try{dsaLessons=extractArrayVar('DSA_LESSONS')}catch(error){console.warn('DSA structured challenges unavailable:',error.message)}
const dsaByTitle=new Map(dsaLessons.map(x=>[norm(x.title),x]));

const PY_MAP={
  'sum a list':'l_sum',
  'fizzbuzz':'f_fizzbuzz',
  'word frequency':'d_word_freq',
  'fix a type error':'bug_string_int',
  'write a list comprehension':'c_squares',
  'safe dictionary access':'e_safe_dict_access',
  'catch a specific exception':'e_safe_divide',
  'fix the mutable default argument bug':'bug_mutable_default'
};
const DSA_MAP={
  'two sum':'two sum',
  'valid parentheses':'valid parentheses'
};

const codeSignalBankFiles=fs.readdirSync(path.join(root,'assets'))
  .filter(name=>/^codesignal-dsa-bank-.*\.json$/.test(name))
  .sort();
if(codeSignalBankFiles.length!==5)throw new Error(`Expected 5 CodeSignal DSA bank files, found ${codeSignalBankFiles.length}`);
const codeSignalQuestions=[];
for(const bankFile of codeSignalBankFiles){
  const bank=JSON.parse(fs.readFileSync(path.join(root,'assets',bankFile),'utf8'));
  if(!Array.isArray(bank.questions))throw new Error(`Missing questions array in ${bankFile}`);
  codeSignalQuestions.push(...bank.questions);
}
if(codeSignalQuestions.length!==25)throw new Error(`Expected 25 CodeSignal DSA questions, found ${codeSignalQuestions.length}`);
const codeSignalById=new Map();
for(const question of codeSignalQuestions){
  if(!question||typeof question.id!=='string'||!question.id.startsWith('codesignal-'))throw new Error('Invalid CodeSignal question id');
  if(codeSignalById.has(question.id))throw new Error(`Duplicate CodeSignal question id: ${question.id}`);
  if(!question.title||!question.prompt||!question.starter||!question.funcName||!question.solution)throw new Error(`Incomplete CodeSignal question: ${question.id}`);
  if(!Array.isArray(question.tests)||question.tests.length<2)throw new Error(`CodeSignal question needs at least 2 tests: ${question.id}`);
  codeSignalById.set(question.id,question);
}

const PYTHON_COURSES=new Set(['python','oop','dsa','backend','ai-ml','testing','apis','debugging','problem-solving','deep-learning','llms','rag','ai-agents','data-science','computer-vision','nlp','transformers','generative-ai','gans','vaes','diffusion','pytorch','tensorflow','huggingface','mlops','data-engineering','ai-system-design','secure-ai-applications','llm-evaluation-testing']);
const JS_COURSES=new Set(['web-dev','frontend-dev']);
const SQL_COURSES=new Set(['sql','databases']);
function defaultLanguage(id){if(SQL_COURSES.has(id))return'sql';if(JS_COURSES.has(id))return'javascript';if(PYTHON_COURSES.has(id))return'python';return'text'}

function pythonConfig(ex){
  if(!ex)return null;
  return {language:'python',starter:ex.starter||'',fname:ex.fname||null,kwargs:!!ex.kwargs,tests_py:ex.tests_py||'',hint:Array.isArray(ex.hints)?ex.hints[0]:(ex.hint||''),solution:ex.solution||''};
}
function dsaConfig(ex){
  if(!ex)return null;
  const tests=Array.isArray(ex.tests)?ex.tests:[];
  const testsPy='['+tests.map(t=>`[[${t.argsRepr}], ${t.expectedRepr}]`).join(',')+']';
  return {language:'python',starter:ex.starter||'',fname:ex.funcName||null,tests_py:testsPy,hint:Array.isArray(ex.hints)?ex.hints[0]:'',solution:ex.solution||''};
}
function codeSignalConfig(ex){
  if(!ex)return null;
  const tests=Array.isArray(ex.tests)?ex.tests:[];
  const testsPy='['+tests.map(t=>`[[${t.argsRepr}], ${t.expectedRepr}]`).join(',')+']';
  return {language:'python',starter:ex.starter||'',fname:ex.funcName||null,tests_py:testsPy,hint:ex.hint||'',solution:ex.solution||''};
}

let injected=0;
for(const file of fs.readdirSync(coursesDir).filter(f=>f.endsWith('.html'))){
  const id=file.replace(/\.html$/,'');
  const dataPath=path.join(courseDataDir,`${id}.json`);
  if(!fs.existsSync(dataPath))continue;
  const course=JSON.parse(fs.readFileSync(dataPath,'utf8'));
  const lang=defaultLanguage(id);
  const items=(Array.isArray(course.exercises)?course.exercises:[]).map((item,index)=>{
    const copy={...item};
    const starter=starterFromSolution(copy,lang);
    if(starter&&!copy.starter)copy.starter=starter;
    if(lang==='text')copy.type='scenario-analysis';
    return copy;
  });
  if(id==='dsa'){
    for(const question of codeSignalQuestions){
      items.push({
        id:question.id,
        title:`CodeSignal • ${question.title}`,
        prompt:`${question.prompt}\n\nAssessment-style practice problem. This is an original practice question, not an official assessment question.`,
        difficulty:Number(question.difficulty)||1,
        hint:question.hint||'',
        starter:question.starter,
        type:'coding-practice'
      });
    }
  }
  const structured={};
  items.forEach((item,index)=>{
    const key=exerciseKey(item,index),title=norm(item.title);
    if(id==='python'){
      const mapped=exById.get(PY_MAP[title]);
      if(mapped)structured[key]=pythonConfig(mapped);
    }else if(id==='dsa'){
      const target=DSA_MAP[title];
      if(target){
        const dsa=dsaByTitle.get(norm(target));
        if(dsa)structured[key]=dsaConfig(dsa);
      }else{
        const codeSignal=codeSignalById.get(key);
        if(codeSignal)structured[key]=codeSignalConfig(codeSignal);
      }
    }
  });

  const payload={courseId:id,courseTitle:course.title||id,defaultLanguage:lang,exercises:items,quiz:Array.isArray(course.quiz)?course.quiz:[],structured};
  const dataTag=`<script id="csai-assessment-data" type="application/json">${safeJson(payload)}</script>`;
  const practiceTag='<script src="/assets/assessment-practice.js?v=20260807-1"></script>';
  const githubTag='<script src="/assets/github-integration.js?v=20260807-1"></script>';
  let html=fs.readFileSync(path.join(coursesDir,file),'utf8');
  html=html.replace(/<script\b[^>]*\bid=["']csai-assessment-data["'][^>]*>[\s\S]*?<\/script>\s*/gi,'');
  html=html.replace(/<script[^>]*src=["']\/assets\/assessment-practice\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  html=html.replace(/<script[^>]*src=["']\/assets\/github-integration\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  const at=html.toLowerCase().lastIndexOf('</body>');
  const tags=`${dataTag}\n${practiceTag}\n${githubTag}\n`;
  html=at>=0?html.slice(0,at)+tags+html.slice(at):html+'\n'+tags;
  fs.writeFileSync(path.join(coursesDir,file),html,'utf8');
  injected++;
}

if(injected!==54)throw new Error(`Expected to enhance 54 course pages, enhanced ${injected}`);
console.log(`Injected assessment-style practice + GitHub publishing into ${injected} static course pages; DSA includes ${codeSignalQuestions.length} CodeSignal-style questions.`);
