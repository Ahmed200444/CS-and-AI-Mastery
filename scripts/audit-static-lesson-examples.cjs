const fs=require('fs');
const path=require('path');

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
  if(/^\s*(GET|POST|PUT|PATCH|DELETE)\s+\//m.test(code)&&!/fetch\s*\(/.test(code))return true;
  return false;
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
function isBigOOld(code){return /#\s*O\(n\):\s*one pass/i.test(code)&&/for\s+x\s+in\s+nums\s*:\s*\.\.\./m.test(code)&&/O\(n\^?2\)/i.test(code);}
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
    if(file==='dsa.html'&&isBigOOld(code)){
      code=BIG_O;
      repaired++;
      candidates++;
      return addAuditAttrs(open,'candidate')+esc(code)+close;
    }
    const bad=placeholder(code)||shell(code)||diagram(code)||missingSetup(code);
    if(bad){references++;return addAuditAttrs(open,'reference')+body+close;}
    candidates++;return addAuditAttrs(open,'candidate')+body+close;
  });
  fs.writeFileSync(full,html,'utf8');
}

if(pages!==54)throw new Error(`Expected 54 course pages, audited ${pages}`);
if(total===0)throw new Error('No lesson code examples were found to audit');
console.log(`Audited ${total} lesson examples across ${pages} courses: ${candidates} runnable candidates, ${references} reference-only, ${repaired} repaired example(s).`);
