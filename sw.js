const V='souffle-v3';
const FILES=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const su=new URL(e.request.url);
  if(e.request.method==='POST'&&su.origin===self.location.origin&&su.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      try{
        const fd=await e.request.formData();const f=fd.get('gpx');
        if(f&&f.text){const c=await caches.open('souffle-share');await c.put('shared-gpx',new Response(await f.text()));}
      }catch(err){}
      return Response.redirect('./index.html?share=1',303);
    })());
    return;
  }
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  const same=u.origin===self.location.origin;
  const fonts=/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!same&&!fonts)return;                       // ex. api.github.com : jamais mis en cache
  if(fonts){
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp));return r;})));
    return;
  }
  // fichiers de l'appli : réseau d'abord (les mises à jour arrivent), cache en secours hors ligne
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{
    if(r&&r.ok){const cp=r.clone();caches.open(V).then(c=>c.put(e.request,cp));}return r;
  }).catch(()=>caches.match(e.request).then(hit=>hit||caches.match('./index.html'))));
});
