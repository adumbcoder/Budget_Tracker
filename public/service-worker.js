const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";
const FILES_TO_CACHE = [

];

// install the worker
self.addEventListener("install", function (evt) {
    // get all image data
    evt.waitUntil(
      caches.open(DATA_CACHE_NAME).then((cache) => cache.add("/api/images"))
    ); 
    //get all static assets
    evt.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
    );
    //once its done installing, activate immediately
    self.skipWaiting();
  });

//activate the worker
self.addEventListener("activate", (evt) => {
    // remove old caches
    evt.waitUntil(
      caches.keys().then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });

// fetch
self.addEventListener("fetch", function(evt) {
    if (evt.request.url.includes("/api/")) {
      evt.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
          return fetch(evt.request)
            .then(response => {
              //if response is good, clone and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
  
              return response;
            })
            .catch(err => {
              //if it fails, retry to get it from cache.
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
  
      return;
    }
  
    evt.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(evt.request).then(response => {
          return response || fetch(evt.request);
        });
      })
    );
  });