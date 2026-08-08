const fs=require('fs');
const path=require('path');
const esbuild=require('esbuild');

const rawTextPlugin={
  name:'csai-raw-text-imports',
  setup(build){
    build.onResolve({filter:/\?raw$/},args=>{
      const clean=args.path.replace(/\?raw$/,'');
      let resolved;
      if(clean.startsWith('.')||clean.startsWith('/')){
        resolved=path.resolve(args.resolveDir||process.cwd(),clean);
      }else{
        resolved=require.resolve(clean,{paths:[args.resolveDir||process.cwd()]});
      }
      return {path:resolved,namespace:'csai-raw-text'};
    });
    build.onLoad({filter:/.*/,namespace:'csai-raw-text'},async args=>({
      contents:await fs.promises.readFile(args.path,'utf8'),
      loader:'text',
      resolveDir:path.dirname(args.path)
    }));
  }
};

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
    logLevel:'warning',
    loader:{
      '.py':'text'
    },
    plugins:[rawTextPlugin]
  });
  const built=fs.readFileSync(out,'utf8');
  if(!/createEmception/.test(built))throw new Error('Bundled C++ browser runner does not expose createEmception');
  if(/subprocess_shim\.py\?raw/.test(built))throw new Error('Raw Python shim import was not bundled as text');
  console.log(`Built local Emception browser adapter (${Math.round(fs.statSync(out).size/1024)} KiB) with raw .py text support.`);
})().catch(err=>{console.error(err);process.exit(1);});
