// Saved progress must survive the id prefix rename: the migration rewrites keys and values once,
// and every page loads it before any other script.
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.join(__dirname,'..');
const OLD='apt'+'ech-';
const indexHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
const code=(indexHtml.match(/<script id="csai-core-id-migration">([\s\S]*?)<\/script>/)||[])[1];
assert.ok(code,'index.html must carry the inline migration script');
function run(store){
  const ls={get length(){return Object.keys(store).length;},key:i=>Object.keys(store)[i],getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}};
  vm.runInNewContext(code,{localStorage:ls});
  return store;
}
const store={courses_progress_v1:JSON.stringify({python:{lessons:{[OLD+'py-intro']:true,'variables':true}},oop:{lessons:{[OLD+'oop-solid']:true}}}),[OLD+'note']:'x',other:'untouched'};
run(store);
assert.deepStrictEqual(JSON.parse(store.courses_progress_v1),{python:{lessons:{'core-py-intro':true,variables:true}},oop:{lessons:{'core-oop-solid':true}}},'progress values must be migrated');
assert.strictEqual(store['core-note'],'x','keys must be migrated');
assert.ok(!(OLD+'note' in store),'old keys must be removed');
assert.strictEqual(store.other,'untouched');
const snapshot=JSON.stringify(store);run(store);
assert.strictEqual(JSON.stringify(store),snapshot,'migration must be idempotent');
let pages=0;
for(const f of ['index.html',...fs.readdirSync(path.join(root,'courses')).filter(n=>n.endsWith('.html')).map(n=>'courses/'+n)]){
  const h=fs.readFileSync(path.join(root,f),'utf8');
  const head=h.slice(0,h.indexOf('</head>'));
  assert.ok(head.includes('<script id="csai-core-id-migration">'+code+'</script>'),f+': inline migration script missing or different from index.html');
  const before=[...head.slice(0,head.indexOf('id="csai-core-id-migration"')).matchAll(/<script\b[^>]*>/g)].map(m=>m[0]);
  assert.ok(before.every(t=>/first-paint/.test(t)||t==='<script'),f+': migration must run before every script except the first-paint guard');
  pages++;
}
console.log('Identifier migration PASS — progress keys/values rewritten once across '+pages+' pages.');
