const cacheName = "v1.0.0";
const cacheFiles = [
  "/layouts/pages/blog/entries.css",
  "/layouts/pages/blog/entry.css",
  "/layouts/partials/global.css",
  "/lib/global.js",
  "/public/css/prism.css",
  "/public/jpg/thumbnail_circle.jpg",
  "/public/webp/thumbnail_circle.webp",
  "/public/png/github.png",
  "/public/svg/twitter.svg",
];

self.addEventListener("install", (e) => {
  console.log("INSTALL in SW");
  const install = async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(cacheFiles);
  };
  e.waitUntil(install());
});

self.addEventListener("activate", (e) => {
  console.log("ACTIVATE in SW");
  e.waitUntil(
    caches.keys().then((keyList) => {
      Promise.all(
        keyList.map((key) => {
          if (key === cacheName) {
            return;
          }
          caches.delete(key);
        })
      );
    })
  );
});

self.addEventListener("fetch", (e) => {
  console.log("FETCH in SW");
  e.respondWith(
    (async () => {
      const r = await caches.match(e.request);
      if (r) {
        return r;
      }
      const response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      await cache.put(e.request, response.clone());
      return response;
    })()
  );
});
