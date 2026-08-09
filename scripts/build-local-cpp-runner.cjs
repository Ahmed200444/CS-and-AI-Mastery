const fs=require('fs');
const path=require('path');

(async()=>{
  const root=process.cwd();
  const outDir=path.join(root,'assets','emception-vite');
  fs.rmSync(outDir,{recursive:true,force:true});
  fs.mkdirSync(outDir,{recursive:true});

  const {build}=await import('vite');
  const common={
    configFile:false,
    root,
    publicDir:false,
    logLevel:'warn'
  };

  await build({
    ...common,
    build:{
      outDir,
      emptyOutDir:true,
      target:'es2020',
      sourcemap:false,
      minify:'esbuild',
      lib:{
        entry:path.join(root,'scripts','cpp-emception-client-entry.js'),
        formats:['es'],
        fileName:()=> 'cpp-client.mjs'
      },
      rollupOptions:{output:{
        entryFileNames:'cpp-client.mjs',
        chunkFileNames:'client-chunks/[name]-[hash].js',
        assetFileNames:'client-assets/[name]-[hash][extname]'
      }}
    }
  });

  await build({
    ...common,
    build:{
      outDir,
      emptyOutDir:false,
      target:'es2020',
      sourcemap:false,
      minify:'esbuild',
      lib:{
        entry:path.join(root,'scripts','cpp-toolchain-worker-entry.js'),
        formats:['es'],
        fileName:()=> 'cpp-toolchain-worker.mjs'
      },
      rollupOptions:{
        treeshake:false,
        output:{
          entryFileNames:'cpp-toolchain-worker.mjs',
          chunkFileNames:'worker-chunks/[name]-[hash].js',
          assetFileNames:'worker-assets/[name]-[hash][extname]'
        }
      }
    }
  });

  const clientPath=path.join(outDir,'cpp-client.mjs');
  const workerPath=path.join(outDir,'cpp-toolchain-worker.mjs');
  if(!fs.existsSync(clientPath))throw new Error('Vite did not create the DOM-free C++ client module');
  if(!fs.existsSync(workerPath))throw new Error('Vite did not create the dedicated C++ toolchain worker');

  const client=fs.readFileSync(clientPath,'utf8');
  const worker=fs.readFileSync(workerPath,'utf8');
  if(client.length<1000)throw new Error('C++ client module is unexpectedly small');
  if(worker.length<1000)throw new Error('C++ toolchain worker is unexpectedly small');
  if(/\bdocument\b|\bwindow\b/.test(client))throw new Error('C++ client module unexpectedly contains DOM globals');
  if(/\bdocument\b|\bwindow\b/.test(worker))throw new Error('C++ toolchain worker unexpectedly contains DOM globals');
  if(/\?raw(?:['"`]|\b)/.test(worker))throw new Error('C++ toolchain worker still contains an unresolved ?raw import');
  if(/var\s+import_meta\s*=\s*\{\s*\}/.test(worker))throw new Error('C++ toolchain worker erased import.meta');

  const emitted=[];
  (function walk(dir){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name),st=fs.statSync(p);if(st.isDirectory())walk(p);else emitted.push(path.relative(outDir,p));}})(outDir);
  console.log(`Built DOM-free C++ client + dedicated toolchain worker. Emitted ${emitted.length} file(s): ${emitted.slice(0,10).join(', ')}${emitted.length>10?' …':''}`);
})().catch(err=>{console.error(err);process.exit(1);});
