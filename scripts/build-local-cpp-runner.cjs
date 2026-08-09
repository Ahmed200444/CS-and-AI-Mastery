const fs=require('fs');
const path=require('path');

(async()=>{
  const root=process.cwd();
  const outDir=path.join(root,'assets','emception-vite');
  const out=path.join(outDir,'emception-browser-bundle.mjs');
  fs.rmSync(outDir,{recursive:true,force:true});
  fs.mkdirSync(outDir,{recursive:true});

  const {build}=await import('vite');
  await build({
    configFile:false,
    root,
    publicDir:false,
    logLevel:'warn',
    build:{
      outDir,
      emptyOutDir:true,
      target:'es2020',
      sourcemap:false,
      minify:'esbuild',
      lib:{
        entry:path.join(root,'scripts','emception-browser-entry.js'),
        formats:['es'],
        fileName:()=> 'emception-browser-bundle.mjs'
      },
      rollupOptions:{
        output:{
          entryFileNames:'emception-browser-bundle.mjs',
          chunkFileNames:'chunks/[name]-[hash].js',
          assetFileNames:'assets/[name]-[hash][extname]'
        }
      }
    }
  });

  if(!fs.existsSync(out))throw new Error('Vite did not create the local Emception ES-module bundle');
  const built=fs.readFileSync(out,'utf8');
  if(built.length<1000)throw new Error('Local Emception browser module is unexpectedly small');
  if(!/createEmception/.test(built))throw new Error('Local Emception browser module does not expose createEmception');
  if(/var\s+import_meta\s*=\s*\{\s*\}/.test(built))throw new Error('C++ browser module erased import.meta and would create invalid URLs');
  if(/\?raw(?:['"`]|\b)/.test(built))throw new Error('C++ browser module still contains an unresolved ?raw import');
  if(/new URL\(\s*(?:''|""|undefined|void 0)\s*,/.test(built))throw new Error('C++ browser module contains an invalid URL base/input');

  const emitted=[];
  (function walk(dir){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name),st=fs.statSync(p);if(st.isDirectory())walk(p);else emitted.push(path.relative(outDir,p));}})(outDir);
  console.log(`Built Emception with Vite as a native ES module. Emitted ${emitted.length} runtime file(s): ${emitted.slice(0,8).join(', ')}${emitted.length>8?' …':''}`);
})().catch(err=>{console.error(err);process.exit(1);});
