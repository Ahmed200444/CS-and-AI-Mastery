const fs=require('fs');
const path=require('path');
const root=process.cwd();
// FIX #13/#14 -- the release tag must match the per-asset cache-busting contract asserted
// by tests/performance-navigation-contract.test.js: 20260822-v567 by default, with the
// assets introduced by a later build pinned to their own tag.
const TAG='20260822-v567';
const TAG_RULES=[
  [/try-it-yourself-v568\.js/,'20260822-v568'],
  [/(?:study-examples|conceptual-examples-v574|program-questions-v574)\.js/,'20260824-v574'],
  [/(?:practice-guidance|practice-publish-completer)\.js/,'20260823-v573'],
  [/course-project-workspace\.js/,'20260822-v571']
];
function versionUrl(url){
  if(!/^(?:\.\.\/)?assets\//.test(url))return url;
  const base=url.split('?')[0];
  let tag=TAG;
  for(const rule of TAG_RULES){if(rule[0].test(base)){tag=rule[1];break;}}
  return base+'?v='+tag;
}
function updateHtml(file,isCourse){
  let html=fs.readFileSync(file,'utf8');
  // Never ship the old delayed in-page course viewer interceptors.
  html=html.replace(/<script\b[^>]*src=["'][^"']*(?:course-speed-boost|catalog-course-viewer)\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
  html=html.replace(/(<script\b[^>]*\bsrc=")([^"]+)("[^>]*>)/gi,(all,a,url,b)=>{
    let tag=a+versionUrl(url)+b;
    if(isCourse && /^(?:\.\.\/)?assets\//.test(url)){
      const critical=/runtime-inline\/courses-[^/]+-00[12]\.js/.test(url);
      if(!critical && !/\bdefer\b/i.test(tag))tag=tag.replace(/>$/,' defer>');
    }
    return tag;
  });
  html=html.replace(/(<link\b[^>]*\bhref=")([^"]+)("[^>]*>)/gi,(all,a,url,b)=>{
    if(/^(?:\.\.\/)?assets\//.test(url)&&/\.(?:css|js)(?:\?|$)/i.test(url))url=versionUrl(url);
    return a+url+b;
  });
  fs.writeFileSync(file,html,'utf8');
}
const index=path.join(root,'index.html');
if(fs.existsSync(index))updateHtml(index,false);
const dir=path.join(root,'courses');
const pages=fs.existsSync(dir)?fs.readdirSync(dir).filter(x=>x.endsWith('.html')):[];
for(const name of pages)updateHtml(path.join(dir,name),true);
if(pages.length!==62)throw new Error(`Expected 62 course pages, found ${pages.length}`);
console.log(`Applied final performance release tag ${TAG} to index + ${pages.length} course pages.`);
