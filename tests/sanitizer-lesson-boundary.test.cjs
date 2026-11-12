'use strict';
// Regression: the commercial sanitizer must sync a corrected source lesson into the right
// lesson on the static page, even when the lesson contains inner <section> blocks and nested
// <details>, and it must not alter neighbouring lessons.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const text=fs.readFileSync(path.join(__dirname,'..','scripts','sanitize-commercial-course-content.cjs'),'utf8');
const a=text.indexOf('function esc('),b=text.indexOf('function sanitizePage(');
assert.ok(a>=0&&b>a,'sanitizer helper functions not found');
const api=vm.runInNewContext(text.slice(a,b)+';({lessonBounds,syncLesson})',{});

const lesson=(id,title,explanation,extra='')=>`<details class="lesson" data-lesson="${id}" open>
<summary><span class="num">01</span><span class="title">${title}</span></summary>
<div class="body"><h3>What you will learn</h3><ul><li>old objective</li></ul>
<section class="lesson-main-explanation" data-main-explanation>
<h3>Explanation</h3>
<p>${explanation}</p>
</section>
${extra}<h3>Key concepts</h3><div class="meta"><span class="pill">old</span></div>
</div></details>`;
const nested='<details class="inner"><summary>Solution</summary><section class="x"><p>hidden</p></section></details>\n';
const page=`<section class="lessons">${lesson('a','Lesson A','Broken prose written with WITH here.',nested)}
${lesson('b','Lesson B','Neighbour explanation stays exactly as it is.')}
</section><section class="card">after</section>`;

// Bounds cover the whole lesson, including inner sections and nested details, and stop at its own </details>.
const [s,e]=api.lessonBounds(page,'a');
const seg=page.slice(s,e);
assert.ok(seg.startsWith('<details class="lesson" data-lesson="a"'));
assert.ok(seg.endsWith('</details>'));
assert.ok(seg.includes('hidden')&&seg.includes('Key concepts'),'lesson A bounds must include content after its inner </section>');
assert.ok(!seg.includes('Lesson B'),'lesson A bounds must not leak into the next lesson');

const fixed={id:'a',title:'Lesson A',explanation:'Corrected prose that reaches the page.',objectives:['new objective'],concepts:['new'],commonMistakes:[]};
const out=api.syncLesson(page,fixed,'x');
assert.ok(out.includes('Corrected prose that reaches the page.'),'corrected explanation must reach lesson A');
assert.ok(!out.includes('written with WITH'),'broken source prose must be replaced');
assert.ok(out.includes('<li>new objective</li>')&&out.includes('<span class="pill">new</span>'),'objectives and concepts must sync inside lesson A');
assert.ok(out.includes('hidden'),'nested content must be preserved');
const [bs,be]=[page.indexOf('<details class="lesson" data-lesson="b"'),page.indexOf('</details>',page.indexOf('Neighbour explanation'))+10];
assert.equal(out.slice(out.indexOf('<details class="lesson" data-lesson="b"'),out.indexOf('</details>',out.indexOf('Neighbour explanation'))+10),page.slice(bs,be),'neighbouring lesson B must be byte-identical');
assert.equal(api.lessonBounds(page,'missing'),null);
console.log('Sanitizer lesson-boundary regression PASS — corrected source text reaches the right lesson without touching its neighbours.');
