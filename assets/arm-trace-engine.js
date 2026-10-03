(function(root){
'use strict';
// Bounded A32 teaching semantics. No assembler encoding, peripherals, exceptions,
// timing, Thumb state, byte transfers, or privileged execution are simulated.
var CONDITIONS=['EQ','NE','CS','HS','CC','LO','MI','PL','VS','VC','HI','LS','GE','LT','GT','LE','AL'];
var OPS=['PUSH','POP','MOV','MVN','ADD','ADC','SUB','SBC','RSB','RSC','AND','ORR','EOR','BIC','CMP','CMN','TST','TEQ','LSL','LSR','ASR','ROR','LDR','STR','BL','BX','B'];
function number(s){return s[0]==='-'?-Number(s.slice(1)):s[0]==='+'?Number(s.slice(1)):Number(s);}
function decode(token){
 token=token.toUpperCase();
 for(var i=0;i<OPS.length;i++){
  var op=OPS[i];if(token.slice(0,op.length)!==op)continue;
  var suffix=token.slice(op.length),flags=false;
  if(suffix.endsWith('S')&&suffix!=='CS'&&suffix!=='HS'&&suffix!=='VS'&&suffix!=='LS'){flags=true;suffix=suffix.slice(0,-1);}
  if(suffix&&CONDITIONS.indexOf(suffix)<0)continue;
  if(flags&&['B','BL','BX','PUSH','POP','LDR','STR'].indexOf(op)>=0)continue;
  return {op:op,condition:suffix||'AL',flags:flags||['CMP','CMN','TST','TEQ'].indexOf(op)>=0};
 }
 return null;
}
function split(s){var result=[],part='',depth=0;for(var ch of s){if(ch==='['||ch==='{')depth++;if(ch===']'||ch==='}')depth--;if(ch===','&&depth===0){result.push(part.trim());part='';}else part+=ch;}if(part.trim())result.push(part.trim());return result;}
function compile(source){
 var program=[],labels=Object.create(null),aliases=Object.assign(Object.create(null),{sp:13,lr:14,pc:15}),constants=Object.create(null);
 String(source).split('\n').forEach(function(raw,line){
  var s=raw.split(';')[0].trim();if(!s)return;
  var alias=s.match(/^([A-Za-z_]\w*)\s+RN\s+(\d+)$/i),constant=s.match(/^([A-Za-z_]\w*)\s+EQU\s+([+-]?(?:0x[\da-f]+|\d+))$/i);
  if(alias){var r=Number(alias[2]);if(r>14)throw Error('Line '+(line+1)+': aliases must name r0–r14.');aliases[alias[1].toLowerCase()]=r;return;}
  if(constant){var constantValue=number(constant[2]);if(!Number.isSafeInteger(constantValue)||constantValue< -2147483648||constantValue>4294967295)throw Error('Constant outside the 32-bit teaching range.');constants[constant[1].toLowerCase()]=constantValue;return;}
  if(/^(AREA|ENTRY|END|ALIGN)\b/i.test(s)){if(/^ALIGN\s+\S/i.test(s))throw Error('Explicit ALIGN is outside this tracer.');return;}
  var label=s.match(/^([A-Za-z_]\w*):\s*(.*)$/);
  if(!label){var first=s.match(/^(\S+)\s+(.+)$/);if(first&&!decode(first[1])&&decode(first[2].split(/\s/)[0]))label=[s,first[1],first[2]];}
  if(label){var name=label[1].toLowerCase();if(Object.hasOwn(labels,name))throw Error('Duplicate label '+name);labels[name]=program.length;s=label[2].trim();if(!s)return;}
  var parts=s.match(/^(\S+)(?:\s+(.*))?$/),info=decode(parts[1]);
  if(!info)throw Error('Line '+(line+1)+': '+parts[1]+' is outside the teaching tracer. Use the lesson explanation or a full ARM tool.');
  program.push(Object.assign(info,{args:split(parts[2]||''),line:line+1,source:s}));
 });
 if(!program.length)throw Error('No supported ARM instructions in this example.');
 return {program:program,labels:labels,aliases:aliases,constants:constants};
}
function accepts(c,f){switch(c){case'EQ':return!!f.Z;case'NE':return!f.Z;case'CS':case'HS':return!!f.C;case'CC':case'LO':return!f.C;case'MI':return!!f.N;case'PL':return!f.N;case'VS':return!!f.V;case'VC':return!f.V;case'HI':return!!f.C&&!f.Z;case'LS':return!f.C||!!f.Z;case'GE':return f.N===f.V;case'LT':return f.N!==f.V;case'GT':return!f.Z&&f.N===f.V;case'LE':return!!f.Z||f.N!==f.V;default:return true;}}
function addCarry(a,b,c){var sum=BigInt(a>>>0)+BigInt(b>>>0)+BigInt(c),value=Number(sum&0xffffffffn),signed=BigInt(a|0)+BigInt(b|0)+BigInt(c);return {value:value,C:Number(sum>0xffffffffn),V:Number(signed>2147483647n||signed< -2147483648n)};}
function create(source){
 var code=compile(source),state={registers:Array(16).fill(0),flags:{N:0,Z:0,C:0,V:0},memory:Object.create(null),ip:0,steps:0,halted:false,message:'Ready. Registers start at 0; SP starts at 0x00010000.'};state.registers[13]=0x10000;
 function reg(s){s=s.toLowerCase();if(Object.hasOwn(code.aliases,s))return code.aliases[s];if(/^r(?:[0-9]|1[0-5])$/.test(s))var n=number(s.slice(1));if(!Number.isSafeInteger(n)||Math.abs(n)>4294967295)throw Error("Address offset outside the teaching range.");return n;throw Error('Unknown register '+s);}
 function write(r,v){if(r===15)throw Error('Writing PC directly is outside this tracer; use B, BL or BX.');state.registers[r]=v>>>0;}
 function value(s){s=s.trim().replace(/^#/,'').toLowerCase();if(Object.hasOwn(code.constants,s))return code.constants[s]>>>0;if(/^[+-]?(?:0x[\da-f]+|\d+)$/.test(s)){var n=number(s);if(!Number.isSafeInteger(n)||n< -2147483648||n>4294967295)throw Error('Value outside the 32-bit teaching range.');return n>>>0;}var r=reg(s);return r===15?((state.ip*4)+8)>>>0:state.registers[r];}
 function shift(v,s){if(!s)return {value:v,C:state.flags.C};var m=s.match(/^(LSL|LSR|ASR|ROR)\s+#(\d+)$/i);if(!m)throw Error('Use an immediate LSL/LSR/ASR/ROR shift.');var n=Number(m[2]),op=m[1].toUpperCase();if(n>32)throw Error('This tracer supports shift counts 0–32.');if(n===0){if(op!=='LSL')throw Error(op+' #0 has special encoding semantics; use a count of 1–32.');return {value:v,C:state.flags.C};}var c;if(op==='LSL'){c=(v>>>(32-n))&1;return {value:n===32?0:(v<<n)>>>0,C:c};}if(op==='LSR'){c=(v>>>(n-1))&1;return {value:n===32?0:v>>>n,C:c};}if(op==='ASR'){c=(v>>>(n-1))&1;return {value:(n===32?(v|0)<0?-1:0:(v|0)>>n)>>>0,C:c};}return {value:n===32?v:((v>>>n)|(v<<(32-n)))>>>0,C:(v>>>(n-1))&1};}
 function operand(args,start){if(args.length>start+2)throw Error('Too many source operands.');return shift(value(args[start]),args[start+1]);}
 function nz(v){state.flags.N=v>>>31;state.flags.Z=Number(v===0);}
 function address(a){if(a%4)throw Error('Word memory addresses must be aligned to 4 bytes.');return a>>>0;}
 function load(a){a=address(a);if(!Object.hasOwn(state.memory,a))throw Error('Memory at 0x'+a.toString(16)+' is uninitialized. Store a value there first.');return state.memory[a];}
 function store(a,v){state.memory[address(a)]=v>>>0;}
 function branch(index){if(!Number.isInteger(index)||index<0||index>code.program.length)throw Error('Branch target is outside the example.');return index;}
 function target(label){if(!Object.hasOwn(code.labels,label.toLowerCase()))throw Error('Unknown label '+label);return branch(code.labels[label.toLowerCase()]);}
 function execute(ins){
  var a=ins.args,op=ins.op,next=state.ip+1,result,b,r,x,sh;
  if(!accepts(ins.condition,state.flags)){state.message=ins.source+' skipped: '+ins.condition+' is false.';return next;}
  if(op==='B'||op==='BL'){if(a.length!==1)throw Error(op+' needs one label.');next=target(a[0]);if(op==='BL')state.registers[14]=(state.ip+1)*4;if(op==='B'&&next===state.ip){state.halted=true;state.message='Reached the self-branch stop at '+a[0]+'.';}return next;}
  if(op==='BX'){if(a.length!==1)throw Error('BX needs one register.');var dest=value(a[0]);if(dest%4)throw Error('Thumb/interworking targets are outside this tracer.');return branch(dest/4);}
  if(op==='PUSH'||op==='POP'){
   if(a.length!==1||!/^\{[^{}]+\}$/.test(a[0]))throw Error(op+' needs a register list.');
   var regs=a[0].slice(1,-1).split(',').map(function(s){return reg(s.trim());}).sort(function(a,b){return a-b;});
   if(new Set(regs).size!==regs.length||regs.some(function(r){return r===13||r===15;}))throw Error('Use distinct r0–r12 or LR in this stack tracer.');
   var sp=state.registers[13],start=op==='PUSH'?(sp-regs.length*4)>>>0:sp;
   regs.forEach(function(r,i){if(op==='PUSH')store(start+i*4,state.registers[r]);else write(r,load(start+i*4));});
   state.registers[13]=op==='PUSH'?start:(sp+regs.length*4)>>>0;return next;
  }
  if(op==='LDR'||op==='STR'){
   if(a.length<2||a.length>3)throw Error(op+' needs a register and word address.');r=reg(a[0]);
   if(op==='LDR'&&a[1][0]==='='){if(a.length!==2)throw Error('Literal LDR takes one value.');var literal=a[1].slice(1);write(r,Object.hasOwn(code.labels,literal.toLowerCase())?target(literal)*4:value(literal));return next;}
   var m=a[1].match(/^\[([^\]]+)\](!)?$/);if(!m)throw Error('Use [base], [base, #offset], [base, #offset]! or [base], #offset.');
   var parts=split(m[1]),base=reg(parts[0]);if(base===15||r===15||parts.length>2||(a.length===3&&(parts.length!==1||m[2])))throw Error('This addressing form is outside the tracer.');
   if((m[2]||a.length===3)&&r===base)throw Error('Write-back with the same base and destination is outside this tracer.');
   function offset(s){if(!/^#[+-]?(?:0x[\da-f]+|\d+)$/i.test(s))throw Error('Use an immediate address offset.');var n=number(s.slice(1));if(!Number.isSafeInteger(n)||Math.abs(n)>4294967295)throw Error("Address offset outside the teaching range.");return n;}
   var old=state.registers[base],off=parts[1]?offset(parts[1]):0,addr=(old+off)>>>0;
   if(op==='LDR')write(r,load(addr));else store(addr,state.registers[r]);
   if(m[2])write(base,addr);if(a.length===3)write(base,old+offset(a[2]));return next;
  }
  var test=['CMP','CMN','TST','TEQ'].indexOf(op)>=0,start=test?1:2;
  if(op==='MOV'||op==='MVN'){if(a.length<2||a.length>3)throw Error(op+' needs destination and source.');r=reg(a[0]);sh=operand(a,1);result={value:op==='MOV'?sh.value:(~sh.value)>>>0,C:sh.C};}
  else if(['LSL','LSR','ASR','ROR'].indexOf(op)>=0){if(a.length!==3)throw Error(op+' needs destination, source and count.');r=reg(a[0]);sh=shift(value(a[1]),op+' '+a[2]);result=sh;}
  else{
   if(a.length<start+1||a.length>start+2)throw Error(op+' has the wrong operand count.');if(!test)r=reg(a[0]);x=value(a[test?0:1]);sh=operand(a,start);b=sh.value;
   switch(op){case'ADD':case'CMN':result=addCarry(x,b,0);break;case'ADC':result=addCarry(x,b,state.flags.C);break;case'SUB':case'CMP':result=addCarry(x,~b,1);break;case'SBC':result=addCarry(x,~b,state.flags.C);break;case'RSB':result=addCarry(b,~x,1);break;case'RSC':result=addCarry(b,~x,state.flags.C);break;case'AND':case'TST':result={value:(x&b)>>>0,C:sh.C};break;case'ORR':result={value:(x|b)>>>0,C:sh.C};break;case'EOR':case'TEQ':result={value:(x^b)>>>0,C:sh.C};break;case'BIC':result={value:(x&~b)>>>0,C:sh.C};break;default:throw Error('Unsupported operation '+op);}
  }
  if(!test)write(r,result.value);if(ins.flags){nz(result.value);state.flags.C=result.C;if(result.V!==undefined)state.flags.V=result.V;}
  return next;
 }
 function snapshot(){return {registers:state.registers.slice(),flags:Object.assign({},state.flags),memory:Object.assign({},state.memory),ip:state.ip,steps:state.steps,halted:state.halted,message:state.message,nextLine:code.program[state.ip]?code.program[state.ip].line:null};}
 function step(){if(state.halted)return snapshot();if(state.ip>=code.program.length){state.halted=true;state.message='End of example.';return snapshot();}var previous=snapshot(),ins=code.program[state.ip];try{state.message='Executed '+ins.source;state.ip=execute(ins);state.steps++;if(state.ip>=code.program.length){state.halted=true;state.message+=' End of example.';}return snapshot();}catch(e){Object.assign(state,previous);throw Error('Line '+ins.line+': '+e.message);}}
 function run(limit){limit=Math.min(Number(limit)||500,2000);for(var n=0;n<limit&&!state.halted;n++)step();if(!state.halted)state.message='Paused after '+limit+' steps. A loop may still be running; use Step or reset.';return snapshot();}
 return {step:step,run:run,snapshot:snapshot,program:code.program};
}
var api={create:create,compile:compile,accepts:accepts,addCarry:addCarry};
if(typeof module==='object'&&module.exports)module.exports=api;else root.CSAIArmTrace=api;
})(typeof window==='object'?window:globalThis);
