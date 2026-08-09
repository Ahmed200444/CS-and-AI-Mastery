const CACHE='csai-v5-20-0';
const CORE=['/','/index.html','/manifest.webmanifest','/icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

function isApi(url){
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/functions/');
}

async function networkFirst(request){
  try{
    const response=await fetch(request);
    if(response.ok){
      const cache=await caches.open(CACHE);
      cache.put(request,response.clone()).catch(()=>{});
    }
    return response;
  }catch(error){
    const cached=await caches.match(request);
    if(cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;

  const url=new URL(request.url);
  if(url.origin!==self.location.origin || isApi(url)) return;

  if(request.mode==='navigate' || request.destination==='document'){
    event.respondWith(
      networkFirst(request).catch(async()=>{
        return (await caches.match('/index.html')) || Response.error();
      })
    );
    return;
  }

  event.respondWith(networkFirst(request));
});
