'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{exec}=require('child_process');
const localGitHub=require('./local-github-backend'),runtimeCache=require('./runtime-cache');
const ROOT=path.resolve(__dirname),PORT=5711,RELEASE='5.74';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.cjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.webmanifest':'application/manifest+json','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8','.woff':'font/woff','.woff2':'font/woff2'};
const MEM=new Map();
function norm(p){return p.split(path.sep).join('/').replace(/^\/+/, '');}
function preload(dir){let entries;try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch(e){console.error('Skipping unreadable folder: '+dir+' - '+e.message);return;}for(const ent of entries){const full=path.join(dir,ent.name);if(ent.isSymbolicLink())continue;if(ent.isDirectory()){if(ent.name==='node_modules'||ent.name==='.git'||ent.name==='runtime-cache')continue;preload(full);}else{const rel=norm(path.relative(ROOT,full));if(rel==='csai-server.log'||rel==='.csai-server.pid'||rel.endsWith('.zip'))continue;try{const data=fs.readFileSync(full);const etag='"'+crypto.createHash('sha1').update(data).digest('hex')+'"';MEM.set('/'+rel,{data,etag});}catch(e){console.error('Skipping unreadable file: '+rel+' - '+e.message);}}}}
preload(ROOT);
const buildHash=crypto.createHash('sha1');
for(const [key,entry] of Array.from(MEM.entries()).sort((a,b)=>a[0].localeCompare(b[0]))){buildHash.update(key);buildHash.update(entry.etag);}
const BUILD_ID=buildHash.digest('hex').slice(0,12);
let cachePurgeSent=false;
function pathnameFor(url){try{return decodeURIComponent(new URL(url,'http://localhost').pathname)}catch{return null}}
function keyFor(url){let pn=pathnameFor(url);if(!pn)return null;if(pn==='/')pn='/index.html';if(pn.includes('..'))return null;if(MEM.has(pn))return pn;if(pn.endsWith('/')&&MEM.has(pn+'index.html'))return pn+'index.html';return pn}
function baseHeaders(key,entry){const ext=path.extname(key).toLowerCase(),html=ext==='.html';return{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':html?'no-cache, max-age=0, must-revalidate':'public, max-age=31536000, immutable','ETag':entry.etag,'Connection':'keep-alive','X-Content-Type-Options':'nosniff','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','X-CSAI-Build':BUILD_ID};}
async function serve(req,res){
  const pn=pathnameFor(req.url||'/')||'';
  if(pn==='/__health'){
    const body=Buffer.from(JSON.stringify({ok:true,release:RELEASE,build:BUILD_ID,files:MEM.size,localGitHub:true}));
    res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Content-Length':String(body.length)});
    return res.end(body);
  }
  if(await localGitHub.route(req,res,pn,ROOT))return;
  if(await runtimeCache.route(req,res,pn))return;
  const key=keyFor(req.url||'/');
  if(!key){res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Bad request')}
  const entry=MEM.get(key);
  if(!entry){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});return res.end('Not found: '+pn)}
  const headers=baseHeaders(key,entry);
  if(key==='/index.html'&&!cachePurgeSent){headers['Clear-Site-Data']='"cache"';cachePurgeSent=true;}
  if(req.headers['if-none-match']===entry.etag){delete headers['Content-Length'];res.writeHead(304,headers);return res.end()}
  headers['Content-Length']=String(entry.data.length);
  res.writeHead(200,headers);
  if(req.method==='HEAD')return res.end();
  res.end(entry.data);
}
const s=http.createServer((req,res)=>{serve(req,res).catch(error=>{console.error(error);if(!res.headersSent){const body=Buffer.from(JSON.stringify({error:error.message||'Local server error'}));res.writeHead(500,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Content-Length':String(body.length)});res.end(body);}else res.end();});});
s.keepAliveTimeout=65000;s.headersTimeout=66000;
s.on('error',e=>{if(e.code==='EADDRINUSE'){console.error('\nAnother CS & AI Mastery study server is already using port '+PORT+'.');console.error('Close the OLD black START_SITE window first, then double-click START_SITE.bat again.');console.error('This prevents your browser from accidentally opening an older ZIP.\n');process.exit(2)}console.error(e);process.exit(1)});
s.listen(PORT,'127.0.0.1',()=>{
  const url=`http://127.0.0.1:${PORT}/index.html?build=${BUILD_ID}`;
  const ghInstalled=localGitHub.commandExists('gh'),ghConnected=!!localGitHub.getToken(),runtimeStats=runtimeCache.stats();
  console.log('\nCS & AI Mastery - instant local study server');
  console.log('Release: '+RELEASE);console.log('Build: '+BUILD_ID);
  console.log('Preloaded '+MEM.size+' local files into memory.');
  console.log('Local GitHub backend: enabled');
  console.log('Maximum runtime cache: '+runtimeStats.files+' files already local');
  setTimeout(function(){runtimeCache.warmMaximum().then(function(r){var st=runtimeCache.stats();console.log('Maximum runtime cache ready: '+r.core.ok+'/'+r.core.total+' core files · '+(st.bytes/1024/1024).toFixed(1)+' MB local');}).catch(function(){});},25);
  console.log('GitHub CLI: '+(ghInstalled?(ghConnected?'signed in ✓':'installed, sign-in needed'):'not installed'));
  console.log('The first homepage request clears stale browser CACHE only; saved progress is preserved.');
  console.log('Open: '+url);
  console.log(process.env.CSAI_NO_AUTO_OPEN==='1'?'Background server mode: active. Use STOP_CSAI.bat to stop.\n':'Keep this window open while studying. Press Ctrl+C to stop.\n');
  if(process.env.CSAI_NO_AUTO_OPEN!=='1'){if(process.platform==='win32')exec(`start "" "${url}"`);else if(process.platform==='darwin')exec(`open "${url}"`);}
});
