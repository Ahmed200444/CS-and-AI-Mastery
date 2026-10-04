'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const trace=require('../assets/arm-trace-engine.js');
function run(source){return trace.create(source).run();}
let s=run('MOV r0, #17\nMOV r1, r0\nMVN r2, r1');
assert.equal(s.registers[1],17);assert.equal(s.registers[2],0xffffffee);
s=run('MOV r0, #0xffffffff\nADDS r1, r0, #1\nADC r2, r1, #0');
assert.deepEqual(s.flags,{N:0,Z:1,C:1,V:0});assert.equal(s.registers[2],1);
s=run('MOV r0, #0x7fffffff\nADDS r1, r0, #1');assert.deepEqual(s.flags,{N:1,Z:0,C:0,V:1});
s=run('MOV r0, #3\nSUBS r1, r0, #5');assert.deepEqual(s.flags,{N:1,Z:0,C:0,V:0});
s=run('MOV r0, #5\nSUBS r1, r0, #5');assert.deepEqual(s.flags,{N:0,Z:1,C:1,V:0});
s=run('MOV r0, #0x80000000\nSUBS r1, r0, #1\nMOVGE r2, #1\nMOVLT r3, #1');assert.equal(s.flags.V,1);assert.equal(s.registers[2],0);assert.equal(s.registers[3],1);
s=run('MOV r0, #1\nCMP r0, #2\nSBC r1, r0, #0\nRSC r2, r0, #4');assert.equal(s.registers[1],0);assert.equal(s.registers[2],2);
s=run('MOV r0, #9\nRSB r1, r0, #4');assert.equal(s.registers[1],0xfffffffb);
s=run('MOV r0, #2\nCMP r0, #2\nMOVEQ r1, #7\nMOVNE r1, #99');assert.equal(s.registers[0],2);assert.equal(s.registers[1],7);
s=run('MOV r0, #0x80000001\nMOVS r1, r0, LSR #1\nMOV r2, r0, ASR #1\nMOV r3, r0, ROR #1');assert.equal(s.registers[1],0x40000000);assert.equal(s.flags.C,1);assert.equal(s.registers[2],0xc0000000);assert.equal(s.registers[3],0xc0000000);
s=run('MOV r0, #7\nADD r1, r0, r0, LSL #4');assert.equal(s.registers[1],119);
s=run('MOV r0, #0xff\nBIC r1, r0, #0x0f\nTST r1, #0x0f');assert.equal(s.registers[1],240);assert.equal(s.flags.Z,1);
s=run('MOV r0, #0x1000\nMOV r1, #42\nSTR r1, [r0, #4]!\nLDR r2, [r0], #4');assert.equal(s.registers[0],0x1008);assert.equal(s.registers[2],42);assert.equal(s.memory[0x1004],42);
s=run('MOV r1, #42\nMOV r2, #7\nPUSH {r2, r1}\nMOV r1, #0\nPOP {r3, r4}');assert.equal(s.registers[3],42);assert.equal(s.registers[4],7);assert.equal(s.registers[13],0x10000);
s=run('MOV r0, #5\nBL double\nB stop\ndouble ADD r0, r0, r0\nBX lr\nstop B stop');assert.equal(s.registers[0],10);assert.equal(s.registers[14],8);assert.ok(s.halted);
s=run('count RN 0\nlimit EQU 3\nMOV count, #0\nloop ADD count, count, #1\nCMP count, #limit\nBLT loop');assert.equal(s.registers[0],3);
s=run('MOV r0, #0x1004\nMOV r1, #-0x1\nSTR r1, [r0, #-0x4]\nLDR r2, [r0, #-0x4]');assert.equal(s.registers[2],0xffffffff);assert.equal(s.memory[0x1000],0xffffffff);
assert.throws(()=>trace.create('huge EQU 99999999999\nMOV r0, #huge'),/range/);
const loop=trace.create('loop B loop');assert.ok(loop.run().halted);
const continuing=trace.create('loop ADD r0, r0, #1\nB loop');assert.equal(continuing.run(10).steps,10);assert.ok(!continuing.snapshot().halted);
assert.throws(()=>trace.create('SVC #0'),/outside/);assert.throws(()=>run('LDR r0, [r1]'),/uninitialized/);assert.throws(()=>run('MOV r0, #1\nSTR r0, [r0]'),/aligned/);
const failed=trace.create('MOV r0, #1\nPUSH {r0}\nPOP {r1, r2}');failed.step();failed.step();const before=failed.snapshot();assert.throws(()=>failed.step(),/uninitialized/);assert.deepEqual(failed.snapshot(),before,'a failing instruction must preserve all register/memory state');
const sandbox={window:{},document:{readyState:'loading',addEventListener(){},getElementById(){return null;}},setTimeout(){},clearTimeout(){},MutationObserver:function(){this.observe=function(){};},console};
vm.runInNewContext(fs.readFileSync('assets/line-by-line-explanations.js','utf8'),sandbox);const api=sandbox.window.CSAILineExplainer;
assert.equal(api.inferLanguage('MOV r0, #5','armasm'),'armasm');assert.equal(api.inferLanguage('function y = f(x)\ny=x;\nend','matlab'),'matlab');
assert.match(api.explain('MOV r0, #5','armasm')[0].purpose,/Copies/);
assert.match(api.explain('count RN 0','armasm')[0].purpose,/alias/);
assert.match(api.explain('MOVEQ r1, #1','armasm')[0].purpose,/condition.*EQ/);
const armLecture=api.commentedCode(`AREA Prog1, CODE, READONLY
ENTRY
counter RN 0
limit EQU 5
MOV r1, #5
LDR r2, Q
Stop B Stop
END`,'armasm');
assert.ok(!armLecture.includes('; Explanation:'),'ARM learning view must not use verbose generated Explanation: comments');
assert.match(armLecture,/AREA Prog1, CODE, READONLY\s+; code area \/ section/,'ARM learning view should use concise lecture-style AREA comments');
assert.match(armLecture,/MOV R1, #5\s+; load R1 with #5/,'ARM learning view should uppercase registers and keep comments short');
assert.match(armLecture,/LDR R2, Q\s+; load R2 from Q/,'ARM learning view should resemble university ARMASM examples');
const armExisting=api.commentedCode('LDR r1, Q ; load r1 with Q','armasm');
assert.match(armExisting,/LDR R1, Q\s+; load r1 with Q/,'existing lecture-style ARM comments should be preserved');
assert.equal((armExisting.match(/;/g)||[]).length,1,'existing ARM comments must not be duplicated');
const explained=api.explain('LDR r0, [r1, #4]','armasm')[0];assert.ok(JSON.stringify(explained).includes('memory address'));assert.ok(!JSON.stringify(explained).includes('create a list'));
const course=JSON.parse(fs.readFileSync('assets/arm-course-additions.json','utf8')).find(c=>c.id==='arm-assembly');
for(const lesson of course.lessons.filter(l=>l.id!=='arm-12'))for(const example of lesson.examples){const result=run(example);assert.ok(result.halted,lesson.id+' example must finish at its end or explicit stop.');}
for(const name of fs.readdirSync('courses').filter(n=>n.endsWith('.html'))){const html=fs.readFileSync('courses/'+name,'utf8');assert.equal((html.match(/src="\.\.\/assets\/lesson-recall\.js/g)||[]).length,1,name+' must have exactly one recall layer.');}
console.log('ARM trace arithmetic, flags, branches, memory, stack, errors and every-course recall coverage passed.');
