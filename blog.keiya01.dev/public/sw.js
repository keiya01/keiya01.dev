const cacheName = "v1.0.0";
const cacheFiles = [
  "/layouts/pages/blog/entries.css",
  "/layouts/pages/blog/entry.css",
  "/layouts/partials/global.css",
  "/lib/global.js",
  "/public/css/prism.min.css",
  "/public/image/thumbnail_circle.jpg",
  "/public/image/thumbnail_circle.webp",
  "/public/image/github.png",
  "/public/image/twitter.svg",
  "/public/image/icon.png",
];

self.addEventListener("install", (e) => {
  const install = async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(cacheFiles);
  };
  e.waitUntil(install());
});

self.addEventListener("activate", (e) => {
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

// Only use SWR strategy
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") {
    return;
  }

  e.respondWith(
    (async () => {
      const handledResponse = fetch(e.request).then((res) => {
        const url = new URL(e.request.url);
        if (!cacheFiles.includes(url.pathname)) {
          return res;
        }

        // レスポンスを取得したら非同期にキャッシュに格納する
        const clonedResponse = res.clone();
        (async () => {
          /**
           * @see https://github.com/GoogleChrome/workbox/blob/v6/packages/workbox-strategies/src/StrategyHandler.ts#L309-L311
           */
          await (e.handled || new Promise((resolve) => setTimeout(resolve, 0)));

          const cache = await caches.open(cacheName);
          await cache.put(e.request, clonedResponse);
        })();

        return res;
      });

      // fetchしている間はキャッシュからレスポンスを返す
      const cachedResponse = await caches.match(e.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // キャッシュが存在しない場合はレスポンスを待ち、解決され次第、レスポンスを返す
      const response = await handledResponse;

      return response;
    })()
  );
});
