const fs=require('fs');
const path=require('path');
const file=path.join(process.cwd(),'index.html');
if(!fs.existsSync(file))throw new Error('index.html missing');
let html=fs.readFileSync(file,'utf8');
html=html.replace(/\s*<style\s+id=["']csai-home-first-paint-style["'][\s\S]*?<\/style>\s*<script\s+id=["']csai-home-first-paint-start["'][\s\S]*?<\/script>/gi,'');
html=html.replace(/\s*<script\s+id=["']csai-home-first-paint-end["'][\s\S]*?<\/script>/gi,'');
function lastClosingTag(source,name){return source.toLowerCase().lastIndexOf('</'+name.toLowerCase()+'>');}
function firstOpeningTagEnd(source,name){const re=new RegExp('<'+name+'\\b[^>]*>','i'),m=re.exec(source);return m?m.index+m[0].length:-1;}
const headOpenEnd=firstOpeningTagEnd(html,'head'),headClose=lastClosingTag(html,'head'),bodyClose=lastClosingTag(html,'body');
if(headOpenEnd<0||headClose<headOpenEnd||bodyClose<headClose)throw new Error('index.html is missing valid final head/body structure');
const start=`<style id="csai-home-first-paint-style">html.csai-home-booting{background:#0f1720}html.csai-home-booting body{visibility:hidden!important}html.csai-home-booting::before{content:"Loading CS & AI Mastery…";position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#0f1720;color:#edf3f8;font:800 15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}</style><script id="csai-home-first-paint-start">(function(){document.documentElement.classList.add('csai-home-booting');window.__csaiHomeBootStarted=Date.now();window.__csaiHomeBootFailSafe=setTimeout(function(){document.documentElement.classList.remove('csai-home-booting')},2200)})();</script>`;
const end=`<script id="csai-home-first-paint-end">(function(){var stable=0;function raw(){var t=(document.body&&document.body.innerText||'').slice(0,180000);return /window\\.capWebReset|CAP_API_RESPONDER|renderApiSimMilestone|trackEditorShell|capWebSub/.test(t)}function reveal(){clearTimeout(window.__csaiHomeBootFailSafe);requestAnimationFrame(function(){requestAnimationFrame(function(){document.documentElement.classList.remove('csai-home-booting')})})}function check(){if(!raw())stable++;else stable=0;if(stable>=2||Date.now()-(window.__csaiHomeBootStarted||Date.now())>1900)return reveal();setTimeout(check,70)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',check,{once:true});else check()})();</script>`;
html=html.slice(0,headOpenEnd)+start+html.slice(headOpenEnd);
const finalBodyClose=lastClosingTag(html,'body');
if(finalBodyClose<0)throw new Error('index.html lost its final body close during guard injection');
html=html.slice(0,finalBodyClose)+end+html.slice(finalBodyClose);
fs.writeFileSync(file,html,'utf8');
const finalHeadEnd=lastClosingTag(html,'head'),guard=html.indexOf('csai-home-first-paint-start'),endGuard=html.lastIndexOf('csai-home-first-paint-end'),finalBody=lastClosingTag(html,'body');
if(guard<0||guard>finalHeadEnd)throw new Error('Homepage first-paint start guard was not placed in the real head');
if(endGuard<finalHeadEnd||endGuard>finalBody)throw new Error('Homepage first-paint end guard was not placed before the real final body close');
console.log('Homepage raw-code first paint guard injected at real document boundaries.');
