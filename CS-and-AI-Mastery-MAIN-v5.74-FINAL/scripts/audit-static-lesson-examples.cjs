const fs=require('fs');
const path=require('path');

const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');


function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function decode(v){return String(v||'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');}
function placeholder(code){
  return /(^|\s)\.\.\.(\s|$)/m.test(code)
    || /\bTODO\b/i.test(code)
    || /\bTBD\b/i.test(code)
    || /\bYOUR[_ ]CODE\b/i.test(code)
    || /\bREPLACE[_ ]ME\b/i.test(code)
    || /\?\?\?/.test(code)
    || /^\s*pass\s*(#.*)?$/m.test(code);
}
function shell(code){return /(^|\n)\s*(git\s+|ls\b|cd\s+|pwd\b|mkdir\b|docker\s+|npm\s+|pip\s+|curl\s+|ssh\s+|chmod\b|grep\b|awk\b|sed\b)/m.test(code);}
function diagram(code){
  if(/[┌┐└┘├┤│─→←↔]/.test(code))return true;
  if(/\s(?:-->|->)\s/.test(code)&&!/\bdef\s+\w+\s*\([^)]*\)\s*->/.test(code))return true;
  if(/^Traceback \(/m.test(code)||/^HTTP\/\d/m.test(code))return true;
  if(/(^|\n)\s*(Workflow|Daily pipeline|Example sequence|Input\s*\(|prompt\s*:)/i.test(code))return true;
  if(/(^|\n)\s*\d{3}\s+(OK|Created|Bad Request|Unauthorized|Forbidden|Not Found|Conflict|Too Many Requests|Server Error)\b/im.test(code))return true;
  if(/x_\(t-1\)\s*=/.test(code))return true;
  if(/\b(useState|useEffect)\s*\(/.test(code))return true;
  if(/(^|\n)\s*[.#][A-Za-z_-][\w-]*\s*\{/.test(code)||/@media\s*\(/.test(code))return true;
  var flat=code.replace(/\s+/g,' ').trim();
  if(!/[={}();\[\]]/.test(code)&&flat.split(' ').length>=12&&/[.!?]$/.test(flat))return true;
  if(/^\s*(GET|POST|PUT|PATCH|DELETE)\s+\//m.test(code)&&!/fetch\s*\(/.test(code))return true;
  return false;
}


function commentHeavy(code){
  const lines=String(code||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length)return true;
  const comments=lines.filter(x=>x.startsWith('#')||x.startsWith('//')).length;
  return comments>=2 && comments/lines.length>=0.6;
}
function unsupportedSqlDialect(code){
  return /\b(?:DATE_TRUNC|SERIAL\s+PRIMARY\s+KEY|FOR\s+UPDATE)\b/i.test(code)
    || /^\s*(?:Pessimistic pattern|Production checklist|A useful candidate index)\b/im.test(code);
}
function mixedSqlPython(code){
  return /\bcursor\.execute\s*\(|\bUser\.objects\.|\bvector_db\.|\bembed_model\./.test(code);
}

function contextDependentPython(code){
  const c=String(code||'');
  if(/^\s*\{[\s\S]*\b(?:true|false|null)\b[\s\S]*\}\s*$/m.test(c))return true; // JSON, not Python
  const patterns=[
    /\btransforms\./,
    /class\s+\w+\s*\(\s*Animal\s*\)/,
    /class\s+\w+\s*\(\s*ABC\s*\)/,
    /\babstractmethod\b/,
    /\bshapes\b/,
    /\bactivation\s*\(/,
    /\bW\s*@\s*input\b/,
    /\bmodel\.(?:forward|parameters|predict|train|eval|to|load_state_dict|fit)\b/,
    /\bloss_fn\s*\(/,
    /\boptimizer\.(?:step|zero_grad)\s*\(/,
    /\bnum_epochs\b/,
    /\b(?:torch|nn|keras)\./,
    /\bload_pretrained\s*\(/,
    /\breal_image\b/,
    /\bpipeline\s*\(/,
    /\bvector_search\s*\(/,
    /\brerank_model\s*\(/,
    /\bdataloader\b/,
    /\btrain_loader\b/,
    /\bfetch\s*\(\s*program_counter\s*\)/,
    /\bdecode\s*\(\s*instruction\s*\)/,
    /\btrain_(?:discriminator|generator)_one_step\s*\(/,
    /\bwhile\s+not\s+done\s*:/,
    /\bToolError\b/,
    /\bcall_tool\s*\(/,
    /\bdf\s*\[/,
    /\bdf\.(?:shape|dtypes|describe|corr)\b/,
    /\bnp\./,
    /\bembed\s*\(\s*token\s*\)/,
    /\bposition_encode\s*\(/,
  ];
  return patterns.some(re=>re.test(c));
}

function invalidStandalonePython(code){
  return /(^|\n)\s*return\b/m.test(code)&&!/\bdef\s+\w+\s*\(/.test(code);
}

function browserUnsupported(code){
  // These snippets are valuable reference material, but this study site's browser
  // runner cannot faithfully provide their server/native/runtime environment.
  return /\b(?:from|import)\s+(?:sklearn|tensorflow|torch|torchvision|transformers|sentence_transformers|datasets|huggingface_hub|evaluate|gradio|fastapi|requests|pandas|subprocess|multiprocessing)\b/m.test(code)
    || /\b(?:import\s+torch\.nn|from\s+torch\.)/m.test(code)
    || /\bpd\.read_csv\s*\(/.test(code)
    || /\b(?:document|window|localStorage|sessionStorage)\./.test(code);
}
function obviousExternalState(code){
  // Examples that intentionally assume objects/data from earlier notebook/server
  // setup are shown as reference examples instead of a Run button that would fail.
  return /train_test_split\s*\(\s*X\s*,\s*y\b/.test(code)
    || /\.fit\s*\(\s*X(?:_train)?\s*,?\s*y?_?train?\b/.test(code)
    || /cross_val_score\s*\(\s*model\s*,\s*X_train\s*,\s*y_train\b/.test(code)
    || /\bprocess_order\s*\(/.test(code)&&!/def\s+process_order\s*\(/.test(code)
    || /\blogging\.(?:info|error|warning)\s*\([^\n]*\border_id\b/.test(code)&&!/(?:^|\n)\s*order_id\s*=/.test(code);
}

function missingSetup(code){
  const names=[];
  const patterns=[/\bfor\s+\w+\s+in\s+(nums|arr|items|values|data)\b/g,/\b(?:len|sum|sorted)\s*\(\s*(nums|arr|items|values|data)\s*\)/g];
  for(const re of patterns){let m;while((m=re.exec(code)))names.push(m[1]);}
  return names.some(name=>{
    const setup=new RegExp('(?:^|\\n)\\s*'+name+'\\s*=','m');
    const param=new RegExp('def\\s+\\w+\\s*\\([^)]*\\b'+name+'\\b[^)]*\\)');
    return !setup.test(code)&&!param.test(code);
  });
}
function addAuditAttrs(open,status){
  let tag=open.replace(/\sdata-reference-only=("[^"]*"|'[^']*')/gi,'').replace(/\sdata-example-audit=("[^"]*"|'[^']*')/gi,'');
  tag=tag.replace(/>$/,' data-example-audit="'+status+'"'+(status==='reference'?' data-reference-only="true"':'')+'>');
  return tag;
}

let pages=0,total=0,candidates=0,references=0,repaired=0;
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))){
  pages++;
  const full=path.join(dir,file);
  let html=fs.readFileSync(full,'utf8');
  html=html.replace(/(<pre\b[^>]*class=(?:"[^"]*\bcode\b[^"]*"|'[^']*\bcode\b[^']*')[^>]*>)([\s\S]*?)(<\/pre>)/gi,(whole,open,body,close)=>{
    total++;
    let code=decode(body);
    const bad=placeholder(code)||shell(code)||diagram(code)||missingSetup(code)||browserUnsupported(code)||obviousExternalState(code)||commentHeavy(code)||unsupportedSqlDialect(code)||mixedSqlPython(code)||invalidStandalonePython(code)||contextDependentPython(code);
    if(bad){references++;return addAuditAttrs(open,'reference')+body+close;}
    candidates++;return addAuditAttrs(open,'candidate')+body+close;
  });
  fs.writeFileSync(full,html,'utf8');
}

if(pages!==62)throw new Error(`Expected 62 course pages, audited ${pages}`);
if(total===0)throw new Error('No lesson code examples were found to audit');
console.log(`Audited ${total} lesson examples across ${pages} courses: ${candidates} runnable candidates, ${references} reference-only, ${repaired} repaired example(s).`);
