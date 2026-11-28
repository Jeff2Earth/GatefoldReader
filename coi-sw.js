/* Lets the page use several processor cores (Kokoro faster mode). Adds the two headers that unlock it. */
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim())});
self.addEventListener('fetch',function(e){
 var r=e.request;
 if(r.cache==='only-if-cached'&&r.mode!=='same-origin')return;
 e.respondWith(fetch(r).then(function(res){
  if(!res||res.status===0||res.type==='opaque'||res.type==='opaqueredirect')return res;
  var h=new Headers(res.headers);
  h.set('Cross-Origin-Opener-Policy','same-origin');
  h.set('Cross-Origin-Embedder-Policy','credentialless');
  return new Response(res.body,{status:res.status,statusText:res.statusText,headers:h})
 }).catch(function(){return fetch(r)}))
});
