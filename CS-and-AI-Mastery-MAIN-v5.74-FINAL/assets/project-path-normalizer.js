(function(){
'use strict';
if(window.__csaiProjectPathNormalizer)return;
window.__csaiProjectPathNormalizer=true;
var nativeFetch=window.fetch.bind(window);
window.fetch=function(input,init){
 try{
  var url=typeof input==='string'?input:(input&&input.url)||'';
  if(url.indexOf('/api/github/file')!==-1&&init&&typeof init.body==='string'){
   var body=JSON.parse(init.body);
   var prefix='student-code/Projects/';
   if(typeof body.path==='string'&&body.path.indexOf(prefix)===0){
    body.path='student-code/projects/'+body.path.slice(prefix.length);
    init=Object.assign({},init,{body:JSON.stringify(body)});
   }
  }
 }catch(e){}
 return nativeFetch(input,init);
};
})();
