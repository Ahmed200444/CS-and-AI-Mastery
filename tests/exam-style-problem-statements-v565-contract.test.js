const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),courses=path.join(root,'courses');
const pages=fs.readdirSync(courses).filter(x=>x.endsWith('.html'));
if(pages.length!==62)throw new Error(`expected 62 course pages, found ${pages.length}`);
for(const file of pages){const html=fs.readFileSync(path.join(courses,file),'utf8');if(!html.includes('exam-style-problem-statements-v565.js'))throw new Error(`${file}: exam-style problem statement layer missing`);}
const js=fs.readFileSync(path.join(root,'assets','exam-style-problem-statements-v565.js'),'utf8');
for(const required of ['Given a string containing the bracket characters','every opening bracket is closed by the same bracket type','Given a list of integers `nums` and a target integer','longest contiguous substring that contains no repeated characters','Create a `Point` class that stores `x` and `y` coordinates','five products with the highest prices','do not reveal the algorithm or implementation steps']){if(!js.includes(required))throw new Error(`missing required problem-statement contract text: ${required}`);}
if(/<h4>Your task<\/h4>|<h4>Expected result<\/h4>|<h4>Requirements<\/h4>/.test(js))throw new Error('v5.65 must not add multi-panel verbose assessment framing');
console.log(`Exam-style problem statements verified across ${pages.length} courses.`);