const fs=require('fs');
const path=require('path');
const root=process.cwd();
const TAG='20260813-instant2';
function versionUrl(url){
  if(!/^(?:\.\.\/)?assets\//.test(url))return url;
  return url.split('?')[0]+'?v='+TAG;
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
