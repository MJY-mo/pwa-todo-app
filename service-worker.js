const CACHE_NAME = 'pwa-todo-app-cache-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@latest'
];

// インストールイベント: 必要なファイルをキャッシュする
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// フェッチイベント: キャッシュ優先で応答する
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // キャッシュにヒットしたら、それを返す
                if (response) {
                    return response;
                }
                
                // キャッシュになければ、ネットワークから取得し、キャッシュにも保存する
                return fetch(event.request).then(
                    response => {
                        // レスポンスが有効かチェック
                        // (CORSリクエストなどもキャッシュするため、チェックを緩めます)
                        if(!response || response.status !== 200) {
                            // cdn.tailwindcss.com などへの 'opaque' レスポンスもキャッシュ対象
                            if (response.type === 'opaque') {
                                // console.log('Caching opaque response:', event.request.url);
                            } else {
                                // console.warn('Fetch failed, not caching:', event.request.url, response.status, response.type);
                                return response;
                            }
                        }

                        // レスポンスをクローンする（レスポンスはストリームなので一度しか使えない）
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                ).catch(err => {
                    // ネットワークエラー（オフラインなど）
                    console.warn('Fetch failed, network error:', event.request.url, err);
                    // ここでオフライン用のフォールバックページを返すこともできます
                });
            })
    );
});


// アクティベートイベント: 古いキャッシュを削除する
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});