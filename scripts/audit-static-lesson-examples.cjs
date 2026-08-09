const fs=require('fs');
const path=require('path');
const cp=require('child_process');

const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');

const BIG_O=`nums = [10, 20, 30, 40]

# O(n): one pass through the list
linear_steps = 0
for x in nums:
    linear_steps = linear_steps + 1

# O(n^2): one full pass for every item
quadratic_steps = 0
for i in nums:
    for j in nums:
        quadratic_steps = quadratic_steps + 1

print("Number of items:", len(nums))
print("O(n) loop steps:", linear_steps)
print("O(n^2) loop steps:", quadratic_steps)`;

const PY_ANALYZER=String.raw`
import ast,builtins,json,sys,symtable
code=sys.stdin.read()
out={"ok":True,"reason":""}
try:
    compile(code,"<lesson-example>","exec")
except SyntaxError as e:
    print(json.dumps({"ok":False,"reason":"contextual/pseudocode syntax: "+(e.msg or "syntax error")})); raise SystemExit
try:
    tree=ast.parse(code)
    roots=[]
    for n in ast.walk(tree):
        if isinstance(n,ast.Import): roots += [a.name.split('.')[0] for a in n.names]
        elif isinstance(n,ast.ImportFrom) and n.module: roots.append(n.module.split('.')[0])
    std=set(getattr(sys,'stdlib_module_names',set()))|{'__future__'}
    external=sorted(set(x for x in roots if x and x not in std))
    if external:
        print(json.dumps({"ok":False,"reason":"requires external package: "+', '.join(external)})); raise SystemExit
    if any(isinstance(n,ast.Constant) and isinstance(n.value,str) and n.value.startswith(('http://','https://')) for n in ast.walk(tree)):
        print(json.dumps({"ok":False,"reason":"requires an external web/service context"})); raise SystemExit
    st=symtable.symtable(code,'<lesson-example>','exec')
    module_defined=set()
    for s in st.get_symbols():
        if s.is_assigned() or s.is_imported() or s.is_namespace(): module_defined.add(s.get_name())
    built=set(dir(builtins))|{'__name__','__file__'}
    missing=set()
    def walk(table):
        for s in table.get_symbols():
            name=s.get_name()
            if s.is_referenced() and s.is_global() and name not in module_defined and name not in built:
                missing.add(name)
        for child in table.get_children(): walk(child)
    walk(st)
    if missing:
        print(json.dumps({"ok":False,"reason":"needs surrounding lesson context: "+', '.join(sorted(missing)[:6])})); raise SystemExit
    print(json.dumps({"ok":True,"reason":"self-contained Python"}))
except SystemExit:
    raise
except Exception as e:
    print(json.dumps({"ok":False,"reason":"could not prove self-contained execution: "+str(e)}))
`;

function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function attr(v){return esc(String(v||'').replace(/\s+/g,' ').slice(0,180));}
function decode(v){return String(v||'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');}
function placeholder(code){return /(^|\s)\.\.\.(\s|$)/m.test(code)||/\bTODO\b/i.test(code)||/\bTBD\b/i.test(code)||/\bYOUR[_ ]CODE\b/i.test(code)||/\bREPLACE[_ ]ME\b/i.test(code)||/\?\?\?/.test(code)||/^\s*pass\s*(#.*)?$/m.test(code);}
function shell(code){return /(^|\n)\s*(git\s+|ls\b|cd\s+|pwd\b|mkdir\b|docker\s+|npm\s+|pip\s+|curl\s+|ssh\s+|chmod\b|grep\b|awk\b|sed\b)/m.test(code);}
function diagram(code){if(/[┌┐└┘├┤│─→←↔]/.test(code))return true;if(/^\s*(GET|POST|PUT|PATCH|DELETE)\s+\//m.test(code)&&!/fetch\s*\(/.test(code))return true;return false;}
function missingSetup(code){const names=[];const patterns=[/\bfor\s+\w+\s+in\s+(nums|arr|items|values|data)\b/g,/\b(?:len|sum|sorted)\s*\(\s*(nums|arr|items|values|data)\s*\)/g];for(const re of patterns){let m;while((m=re.exec(code)))names.push(m[1]);}return names.some(name=>{const setup=new RegExp('(?:^|\\n)\\s*'+name+'\\s*=','m'),param=new RegExp('def\\s+\\w+\\s*\\([^)]*\\b'+name+'\\b[^)]*\\)');return !setup.test(code)&&!param.test(code);});}
function looksPython(code){return /(^|\n)\s*(def\s+|class\s+|from\s+|import\s+|for\s+\w+\s+in\s+|while\s+|if\s+.+:|elif\s+|try\s*:|print\s*\()/m.test(code)||/\brange\s*\(|\blen\s*\(|\.append\s*\(/.test(code);}
const pyCache=new Map();
function pythonAssessment(code){if(!looksPython(code))return null;if(pyCache.has(code))return pyCache.get(code);const r=cp.spawnSync('python3',['-c',PY_ANALYZER],{input:code,encoding:'utf8',timeout:2500,maxBuffer:256000});let result={ok:false,reason:r.error?'Python analysis unavailable':(r.stderr||'Python analysis failed').trim()};try{const lines=String(r.stdout||'').trim().split(/\r?\n/);result=JSON.parse(lines.at(-1)||'{}');}catch(e){}pyCache.set(code,result);return result;}
function isBigOOld(code){return /#\s*O\(n\):\s*one pass/i.test(code)&&/for\s+x\s+in\s+nums\s*:\s*\.\.\./m.test(code)&&/O\(n\^?2\)/i.test(code);}
function addAuditAttrs(open,status,reason=''){
  let tag=open.replace(/\sdata-reference-only=("[^"]*"|'[^']*')/gi,'').replace(/\sdata-reference-reason=("[^"]*"|'[^']*')/gi,'').replace(/\sdata-example-audit=("[^"]*"|'[^']*')/gi,'');
  const extra=status==='reference'?' data-reference-only="true" data-reference-reason="'+attr(reason||'context-dependent example')+'"':'';
  return tag.replace(/>$/,' data-example-audit="'+status+'"'+extra+'>');
}

let pages=0,total=0,candidates=0,references=0,repaired=0,contextualPython=0;
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))){
  pages++;const full=path.join(dir,file);let html=fs.readFileSync(full,'utf8');
  html=html.replace(/(<pre\b[^>]*class=(?:"[^"]*\bcode\b[^"]*"|'[^']*\bcode\b[^']*')[^>]*>)([\s\S]*?)(<\/pre>)/gi,(whole,open,body,close)=>{
    total++;let code=decode(body);
    if(file==='dsa.html'&&isBigOOld(code)){code=BIG_O;repaired++;candidates++;return addAuditAttrs(open,'candidate')+esc(code)+close;}
    let reason='';
    if(placeholder(code))reason='contains placeholder/pseudocode';
    else if(shell(code))reason='system/shell command — use safe simulation';
    else if(diagram(code))reason='diagram/protocol reference — use guided walkthrough';
    else if(missingSetup(code))reason='needs setup from surrounding lesson context';
    else{const py=pythonAssessment(code);if(py&&!py.ok){reason=py.reason||'context-dependent Python';contextualPython++;}}
    if(reason){references++;return addAuditAttrs(open,'reference',reason)+body+close;}
    candidates++;return addAuditAttrs(open,'candidate')+body+close;
  });
  fs.writeFileSync(full,html,'utf8');
}
if(pages!==54)throw new Error(`Expected 54 course pages, audited ${pages}`);
if(total===0)throw new Error('No lesson code examples were found to audit');
console.log(`Audited ${total} lesson examples across ${pages} courses: ${candidates} self-contained runnable candidates, ${references} guided/reference examples (${contextualPython} contextual Python), ${repaired} repaired example(s).`);
