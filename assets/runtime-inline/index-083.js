(function(){
  'use strict';
  var node=document.getElementById('csai-inline-catalog-data');
  if(!node)return;
  var data;
  try{data=JSON.parse(node.textContent||'{}')}catch(error){console.error('[CS AI Mastery] Inline catalog parse failed',error);return}
  if(!data||!Array.isArray(data.courses)||!data.courses.length)return;
  window.__CSAI_CATALOG_DATA__=data;
  var original=window.fetch;
  if(typeof original!=='function'||original.__csaiCatalogShim)return;
  function wrapped(input,init){
    var url=typeof input==='string'?input:(input&&input.url)||'';
    if(/\/assets\/catalog-data\.json(?:[?#]|$)/.test(url)){
      return Promise.resolve({
        ok:true,
        status:200,
        json:function(){return Promise.resolve(window.__CSAI_CATALOG_DATA__)},
        text:function(){return Promise.resolve(JSON.stringify(window.__CSAI_CATALOG_DATA__))}
      });
    }
    return original.apply(this,arguments);
  }
  wrapped.__csaiCatalogShim=true;
  wrapped.__csaiOriginalFetch=original;
  window.fetch=wrapped;
})();