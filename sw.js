/* Klappe, Zwischenspeicher für den Betrieb ohne Netz.
   Beim ersten Öffnen legt der Browser die App ab, danach startet sie
   auch dann, wenn am Drehort kein Empfang ist. */
const CACHE = "klappe-8";
const DATEIEN = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-512.png"];

self.addEventListener("install", ev=>{
  self.skipWaiting();
  ev.waitUntil(caches.open(CACHE).then(c=>c.addAll(DATEIEN).catch(()=>{})));
});

self.addEventListener("activate", ev=>{
  ev.waitUntil(
    caches.keys().then(namen=>Promise.all(
      namen.filter(n=>n !== CACHE).map(n=>caches.delete(n))
    )).then(()=>self.clients.claim())
  );
});

/* Erst der Zwischenspeicher, dann das Netz. Was aus dem Netz kommt,
   wird gleich mit abgelegt. */
self.addEventListener("fetch", ev=>{
  if(ev.request.method !== "GET") return;
  ev.respondWith(
    caches.match(ev.request, {ignoreSearch:true}).then(treffer=>{
      if(treffer){
        fetch(ev.request).then(a=>{
          if(a && a.ok) caches.open(CACHE).then(c=>c.put(ev.request, a));
        }).catch(()=>{});
        return treffer;
      }
      return fetch(ev.request).then(a=>{
        if(a && a.ok && a.type === "basic"){
          const kopie = a.clone();
          caches.open(CACHE).then(c=>c.put(ev.request, kopie));
        }
        return a;
      }).catch(()=>caches.match("./index.html"));
    })
  );
});
