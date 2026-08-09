const fs=require('fs');
const path=require('path');
const dir=path.join(process.cwd(),'courses');
if(!fs.existsSync(dir))throw new Error('courses directory is missing');

const tags=[
  '<script src="/assets/github-portfolio-controls.js?v=20260809-1"></script>',
  '<script src="/assets/smart-code-editor.js?v=20260809-1"></script>',
  '<script src="/assets/universal-safe-output.js?v=20260809-1"></script>',
  '<script src="/assets/evergreen-example-diversity.js?v=20260809-1"></script>'
].join('\n')+'\n';
const remove=/<script[^>]*src=["']\/assets\/(?:github-portfolio-controls|smart-code-editor|universal-safe-output|evergreen-example-diversity)\.js[^"']*["'][^>]*><\/script>\s*/gi;
const anchors=[
  /<script[^>]*src=["']\/assets\/exercise-direct-publish\.js[^"']*["'][^>]*><\/script>/i,
  /<script[^>]*src=["']\/assets\/dual-single-editor-publish\.js[^"']*["'][^>]*><\/script>/i,
  /<script[^>]*src=["']\/assets\/practice-publish-completer\.js[^"']*["'][^>]*><\/script>/i,
  /<script[^>]*src=["']\/assets\/course-project-workspace\.js[^"']*["'][^>]*><\/script>/i
];

let count=0;
for(const file of fs.readdirSync(dir).filter(name=>name.endsWith('.html'))){
  const full=path.join(dir,file);
  let html=fs.readFileSync(full,'utf8').replace(remove,'');
  let at=-1;
  for(const re of anchors){const m=re.exec(html);if(m&& (at<0||m.index<at))at=m.index;}
  if(at<0){const body=html.toLowerCase().lastIndexOf('</body>');at=body>=0?body:html.length;}
  html=html.slice(0,at)+tags+html.slice(at);
  fs.writeFileSync(full,html,'utf8');
  count++;
}
if(count!==54)throw new Error(`Expected 54 course pages, injected ${count}`);
console.log(`Injected final quality layer into ${count} course pages.`);
