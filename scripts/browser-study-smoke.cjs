const fs=require('fs');
const path=require('path');
const http=require('http');
const {spawn,spawnSync}=require('child_process');

const root=process.cwd();
function findChrome(){
 for(const name of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
  const r=spawnSync('which',[name],{encoding:'utf8'});
  if(r.status===0&&r.stdout.trim())return r.stdout.trim();
 }
 throw new Error('Headless Chrome/Chromium is not installed on the Quality Gate runner');
}
function mime(file){
 const ext=path.extname(file).toLowerCase();
 return({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'})[ext]||'application/octet-stream';
}
function count(text,re){return (text.match(re)||[]).length;}
function assert(ok,message){if(!ok)throw new Error(message);}

const server=http.createServer((req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');
  let rel=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';
  const file=path.resolve(root,rel);
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end('Forbidden');}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Not found');}
  res.writeHead(200,{'Content-Type':mime(file),'Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
 }catch(error){res.writeHead(500);res.end(String(error));}
});

(async()=>{
 const chrome=findChrome();
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const port=server.address().port;
 const url=`http://127.0.0.1:${port}/courses/python.html?study-smoke=1`;
 const args=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--disable-default-apps','--disable-extensions','--no-first-run','--virtual-time-budget=3000','--dump-dom',url];
 const start=Date.now();
 const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});
 let dom='',stderr='';
 child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
 child.stdout.on('data',chunk=>{dom+=chunk;if(dom.length>30*1024*1024)child.kill('SIGKILL');});
 child.stderr.on('data',chunk=>{stderr+=chunk;if(stderr.length>2*1024*1024)stderr=stderr.slice(-2*1024*1024);});
 const timer=setTimeout(()=>child.kill('SIGKILL'),15000);
 const result=await new Promise(resolve=>{child.on('close',(code,signal)=>resolve({code,signal}));child.on('error',error=>resolve({error}));});
 clearTimeout(timer);server.close();
 const elapsed=Date.now()-start;
 if(result.error)throw result.error;
 assert(dom.length>1000,`Browser returned no useful DOM. code=${result.code} signal=${result.signal}\n${stderr.slice(-1200)}`);
 assert(elapsed<15000,`Python course browser smoke exceeded 15 seconds (${elapsed} ms)`);
 const sectionMatch=dom.match(/<section class="csai-study-set"[^>]*data-study-example-set=""[^>]*data-study-count="(\d+)"[^>]*>[\s\S]*?<\/section>/i);
 assert(sectionMatch,'First open lesson did not render the study-example section in the browser');
 const expected=Number(sectionMatch[1]),section=sectionMatch[0];
 assert(expected>=5&&expected<=8,`Browser rendered invalid example count ${expected}; expected 5–8`);
 const checks={
  cards:count(section,/class="csai-study-example csai-example-card"/g),
  run:count(section,/data-study-run=""/g),
  reset:count(section,/data-study-reset=""/g),
  publish:count(section,/data-final-publish=""/g),
  readme:count(section,/data-final-readme=""/g),
  output:count(section,/data-study-output=""/g),
  editors:count(section,/class="csai-study-code"/g)
 };
 for(const [name,value] of Object.entries(checks))assert(value===expected,`${name}: browser rendered ${value}, expected ${expected}`);
 assert(!/csai-course-booting|Loading course…/.test(dom),'Blocking course-loading cover reappeared in browser DOM');
 console.log(`Browser study smoke passed in ${elapsed} ms: Python lesson rendered ${expected} editable examples with Run/Check, Reset, output, GitHub publish, and README controls.`);
})().catch(error=>{try{server.close();}catch(e){}console.error('Browser study smoke failed:',error.stack||error);process.exit(1);});
