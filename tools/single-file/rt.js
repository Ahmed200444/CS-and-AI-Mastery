(function(){
var D=__DATA__,M=__MODS__,P=__PAGES__,A=__ASSETS__,B={},HOME=location.href.split('#')[0];
var BASE={};Object.getOwnPropertyNames(window).forEach(function(k){BASE[k]=1});
var rf=window.fetch.bind(window);
window.fetch=function(i,o){try{var u=typeof i==="string"?i:(i&&i.url)||"";u=u.split("?")[0].split("#")[0].replace(/^https?:\/\/[^\/]+/,"").replace(/^(\.\.\/|\.\/|\/)+/,"");if(Object.prototype.hasOwnProperty.call(D,u))return Promise.resolve(new Response(D[u],{status:200,headers:{"content-type":"application/json"}}))}catch(e){}return rf(i,o)};
window.__csaiImport=function(n){var s=M[n];if(!s)return import(n);return import(URL.createObjectURL(new Blob([s],{type:"text/javascript"})))};
function key(u){return String(u).split('?')[0].replace(/^(\.\.\/|\.\/|\/)+/,'')}
function mk(p){if(!B[p])B[p]=URL.createObjectURL(new Blob([A[p]],{type:/\.css$/.test(p)?'text/css':'text/javascript'}));return B[p]}
function goHome(frag){window.__csaiInCourse=false;location.href=HOME+(frag||'#courses');location.reload()}
window.__csaiHook=function(){document.addEventListener('click',function(e){
  var a=e.target&&e.target.closest&&e.target.closest('a[href]');
  if(!a||e.defaultPrevented||e.button||e.ctrlKey||e.metaKey||e.shiftKey)return;
  var h=a.getAttribute('href')||'';
  var m=h.match(/(?:^|\/)courses\/([A-Za-z0-9._-]+)\.html/);
  if(m&&P[m[1]]){e.preventDefault();window.__csaiOpen(m[1]);return}
  if(window.__csaiInCourse&&(/(?:^|\/)index\.html/.test(h)||/^(?:\.\.\/|\/)$/.test(h))){e.preventDefault();goHome(h.indexOf('#')>-1?h.slice(h.indexOf('#')):'')}
},true)};
window.__csaiOpen=function(id){
  var h=P[id];if(!h)return false;
  h=h.replace(/<link\b[^>]*rel=["']?(?:preload|prefetch)[^>]*>/gi,'')
   .replace(/(<script\b[^>]*\bsrc=)(["'])([^"']+)\2/gi,function(m,a,q,u){var k=key(u);return A[k]!=null?a+q+mk(k)+q:m})
   .replace(/(<link\b[^>]*\bhref=)(["'])([^"']+\.css[^"']*)\2/gi,function(m,a,q,u){var k=key(u);return A[k]!=null?a+q+mk(k)+q:m})
   .replace(/<head[^>]*>/i,function(m){return m+'<script>window.__csaiHook()<\/script>'});
  window.__csaiInCourse=true;
  try{history.pushState(null,'','#csai-course='+id)}catch(e){}
  Object.getOwnPropertyNames(window).forEach(function(k){if(BASE[k]||/^__csai/.test(k))return;try{delete window[k]}catch(e){}});
  document.open();document.write(h);document.close();window.scrollTo(0,0);return true};
window.__csaiNav=function(u){var m=String(u).match(/(?:^|\/)courses\/([A-Za-z0-9._-]+)\.html/);if(m&&P[m[1]]&&window.__csaiOpen(m[1]))return;location.assign(u)};
window.__csaiHook();
var bm=location.hash.match(/^#csai-course=([A-Za-z0-9._-]+)/);
if(bm&&P[bm[1]]){var once=0,go=function(){if(once)return;once=1;window.__csaiOpen(bm[1])};window.addEventListener('load',function(){setTimeout(go,400)});setTimeout(function(){if(document.readyState!=='loading')go()},3500)}
})();
