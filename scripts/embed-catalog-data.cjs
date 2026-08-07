const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'index.html');
const catalogPath = path.join(process.cwd(), 'assets', 'catalog-data.json');

if (!fs.existsSync(indexPath)) throw new Error('index.html is missing');
if (!fs.existsSync(catalogPath)) throw new Error('catalog-data.json is missing');

const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
if (!catalog || !Array.isArray(catalog.courses) || catalog.courses.length === 0) {
  throw new Error('catalog-data.json is empty');
}

let html = fs.readFileSync(indexPath, 'utf8');
const dataId = 'csai-inline-catalog-data';
const shimId = 'csai-inline-catalog-fetch-shim';

html = html.replace(new RegExp(`<script\\b[^>]*\\bid=["']${dataId}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`, 'gi'), '');
html = html.replace(new RegExp(`<script\\b[^>]*\\bid=["']${shimId}["'][^>]*>[\\s\\S]*?<\\/script>\\s*`, 'gi'), '');

const safeJson = JSON.stringify(catalog).replace(/<\//g, '<\\/');
const dataTag = `<script id="${dataId}" type="application/json">${safeJson}</script>`;
const shimTag = `<script id="${shimId}">(function(){
  'use strict';
  var node=document.getElementById('${dataId}');
  if(!node)return;
  var data;
  try{data=JSON.parse(node.textContent||'{}')}catch(error){console.error('[CS AI Mastery] Inline catalog parse failed',error);return}
  if(!data||!Array.isArray(data.courses)||!data.courses.length)return;
  window.__CSAI_CATALOG_DATA__=data;
  var original=window.fetch;
  if(typeof original!=='function'||original.__csaiCatalogShim)return;
  function wrapped(input,init){
    var url=typeof input==='string'?input:(input&&input.url)||'';
    if(/\\/assets\\/catalog-data\\.json(?:[?#]|$)/.test(url)){
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
})();</script>`;

const recoveryMatch = html.match(/<script[^>]*src=["']\/assets\/catalog-recovery\.js[^"']*["'][^>]*><\/script>/i);
if (!recoveryMatch || recoveryMatch.index == null) {
  throw new Error('catalog-recovery.js tag was not found in index.html');
}

const insertAt = recoveryMatch.index;
html = html.slice(0, insertAt) + dataTag + '\n' + shimTag + '\n' + html.slice(insertAt);
fs.writeFileSync(indexPath, html, 'utf8');

const output = fs.readFileSync(indexPath, 'utf8');
if ((output.match(new RegExp(`id=["']${dataId}["']`, 'g')) || []).length !== 1) {
  throw new Error('Expected exactly one embedded catalog data block');
}
if ((output.match(new RegExp(`id=["']${shimId}["']`, 'g')) || []).length !== 1) {
  throw new Error('Expected exactly one embedded catalog fetch shim');
}
if (output.indexOf(dataTag) > output.search(/<script[^>]*src=["']\/assets\/catalog-recovery\.js/i)) {
  throw new Error('Embedded catalog must load before catalog-recovery.js');
}

console.log(`Embedded ${catalog.courses.length} catalog entries directly into index.html; catalog rendering no longer waits for a network request.`);
