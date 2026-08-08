const fs=require('fs');
const os=require('os');
const path=require('path');
const vm=require('vm');
const cp=require('child_process');

const file=path.join(process.cwd(),'assets','lesson-language-variants.js');
const src=fs.readFileSync(file,'utf8');
function extractFunction(name){
 const marker='function '+name+'(';
 const start=src.indexOf(marker);if(start<0)throw new Error('Missing '+name);
 const brace=src.indexOf('{',start);let depth=0,end=-1,quote='',esc=false;
 for(let i=brace;i<src.length;i++){
  const c=src[i];
  if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote='';continue;}
  if(c==='"'||c==="'"||c==='`'){quote=c;continue;}
  if(c==='{')depth++;else if(c==='}'&&--depth===0){end=i+1;break;}
 }
 if(end<0)throw new Error('Unclosed '+name);
 return src.slice(start,end);
}
const context={};vm.createContext(context);vm.runInContext(extractFunction('pyProgram')+'\n'+extractFunction('cppProgram')+'\nthis.pyProgram=pyProgram;this.cppProgram=cppProgram;',context);
const topics=['linked list','stack','queue','hash map','recursion','binary search','linear search','bubble sort','selection sort','insertion sort','merge sort','quick sort','tree bst','graph bfs','heap priority','two pointer','sliding window','array traversal'];
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'csai-example-audit-'));
function available(cmd,args){const r=cp.spawnSync(cmd,args,{encoding:'utf8'});return !r.error&&r.status===0;}
const hasPy=available('python3',['--version']);
const hasCpp=available('g++',['--version']);
let checkedPy=0,checkedCpp=0;
for(let i=0;i<topics.length;i++){
 const topic=topics[i],py=String(context.pyProgram(topic)||''),cpp=String(context.cppProgram(topic)||'');
 if(!py.trim())throw new Error('Empty Python generated example for '+topic);
 if(!cpp.trim()||!/#include\s*</.test(cpp)||!/int\s+main\s*\(/.test(cpp))throw new Error('Invalid C++ generated example shape for '+topic);
 if(hasPy){const p=path.join(tmp,'p'+i+'.py');fs.writeFileSync(p,py);const r=cp.spawnSync('python3',['-m','py_compile',p],{encoding:'utf8'});if(r.status!==0)throw new Error('Python syntax failed for '+topic+': '+(r.stderr||r.stdout));checkedPy++;}
 if(hasCpp){const p=path.join(tmp,'c'+i+'.cpp');fs.writeFileSync(p,cpp);const r=cp.spawnSync('g++',['-std=c++17','-fsyntax-only',p],{encoding:'utf8'});if(r.status!==0)throw new Error('C++ syntax failed for '+topic+': '+(r.stderr||r.stdout));checkedCpp++;}
}
fs.rmSync(tmp,{recursive:true,force:true});
console.log(`Language example audit passed for ${topics.length} generated topic families. python3 syntax checks: ${checkedPy}; g++ syntax checks: ${checkedCpp}.`);
