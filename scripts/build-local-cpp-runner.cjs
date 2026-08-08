const fs=require('fs');
const path=require('path');
const esbuild=require('esbuild');

(async()=>{
  const root=process.cwd();
  const out=path.join(root,'assets','emception-browser-bundle.js');
  fs.mkdirSync(path.dirname(out),{recursive:true});
  await esbuild.build({
    entryPoints:[path.join(root,'scripts','emception-browser-entry.js')],
    outfile:out,
    bundle:true,
    platform:'browser',
    format:'iife',
    globalName:'CSAIEmceptionBundle',
    target:['es2020'],
    minify:true,
    sourcemap:false,
    logLevel:'warning'
  });
  const built=fs.readFileSync(out,'utf8');
  if(!/createEmception/.test(built))throw new Error('Bundled C++ browser runner does not expose createEmception');
  console.log(`Built local Emception browser adapter (${Math.round(fs.statSync(out).size/1024)} KiB).`);
})().catch(err=>{console.error(err);process.exit(1);});
