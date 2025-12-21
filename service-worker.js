self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("eatheria-v7").then(cache => {
      return cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./game.js"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
