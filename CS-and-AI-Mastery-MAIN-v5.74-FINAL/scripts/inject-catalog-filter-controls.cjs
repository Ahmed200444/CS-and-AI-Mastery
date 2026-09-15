const fs=require('fs');
const path=require('path');

const indexPath=path.join(process.cwd(),'index.html');
if(!fs.existsSync(indexPath))throw new Error('index.html is missing');

let html=fs.readFileSync(indexPath,'utf8');
html=html.replace(/<script[^>]*src=["']\/assets\/catalog-filter-controls\.js[^"']*["'][^>]*><\/script>\s*/gi,'');
const tag='<script src="/assets/catalog-filter-controls.js?v=20260807-1"></script>';
const at=html.toLowerCase().lastIndexOf('</body>');
html=at>=0?html.slice(0,at)+tag+'\n'+html.slice(at):html+'\n'+tag+'\n';
fs.writeFileSync(indexPath,html,'utf8');

const result=fs.readFileSync(indexPath,'utf8');
const count=(result.match(/\/assets\/catalog-filter-controls\.js/g)||[]).length;
if(count!==1)throw new Error(`Expected one catalog filter controls script, found ${count}`);
console.log('Injected reliable custom catalog filter controls.');
