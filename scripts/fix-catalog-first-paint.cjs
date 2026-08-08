const fs=require('fs');
const path=require('path');

const root=process.cwd();
const catalogPath=path.join(root,'assets','catalog-recovery.js');
const injectorPath=path.join(root,'scripts','inject-course-loader.cjs');

if(!fs.existsSync(catalogPath))throw new Error('catalog-recovery.js is missing');
if(!fs.existsSync(injectorPath))throw new Error('inject-course-loader.cjs is missing');

let catalog=fs.readFileSync(catalogPath,'utf8');
const oldFlow="var wrapped=function(name){var result;try{result=old.apply(this,arguments)}catch(error){console.error('[CS AI Mastery] Catalog route error',error)}if(name==='courses')setTimeout(function(){render(false)},0);else remove();return result}";
const newFlow="var wrapped=function(name){var result;if(name==='courses')render(false);else remove();try{result=old.apply(this,arguments)}catch(error){console.error('[CS AI Mastery] Catalog route error',error)}return result}";

if(catalog.includes(oldFlow)){
  catalog=catalog.replace(oldFlow,newFlow);
}else if(!catalog.includes(newFlow)){
  throw new Error('Could not locate the catalog showTrack wrapper to fix first paint');
}
if(/name==='courses'\)setTimeout\(function\(\)\{render\(false\)\},0\)/.test(catalog)){
  throw new Error('Catalog still defers the loading shell and may flash raw content');
}
fs.writeFileSync(catalogPath,catalog,'utf8');

let injector=fs.readFileSync(injectorPath,'utf8');
const version="/assets/catalog-recovery.js?v=20260808-4";
if(!/const catalogPath = '\/assets\/catalog-recovery\.js\?v=[^']+';/.test(injector)){
  throw new Error('Could not locate catalog recovery cache version in course loader injector');
}
injector=injector.replace(/const catalogPath = '\/assets\/catalog-recovery\.js\?v=[^']+';/,`const catalogPath = '${version}';`);
fs.writeFileSync(injectorPath,injector,'utf8');

console.log('Catalog first-paint guard enabled: loading shell renders before the legacy Courses view, cache version bumped.');
