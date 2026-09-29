/*
 * Service worker – cho phép cài website như ứng dụng và xem lại trang đã mở khi mất mạng.
 * VERSION được `npm run build` cập nhật tự động mỗi khi mã nguồn thay đổi.
 */
const VERSION = 'a68808c2b8'
const CORE_CACHE = `core-${VERSION}`
const PAGE_CACHE = 'pages'
const MEDIA_CACHE = 'media'
const MEDIA_LIMIT = 250

/* Tài nguyên tải sẵn khi cài đặt (đường dẫn tương đối với sw.js) */
const CORE_ASSETS = [
    './',
    './index.html',
    './offline.html',
    './manifest.webmanifest',
    './assets/css/styles.css',
    './assets/css/vietnam.css',
    './assets/css/swiper-bundle.min.css',
    './assets/js/data/local-images.js',
    './assets/js/i18n.js',
    './assets/js/data/en.js',
    './assets/js/data/destinations.js',
    './assets/js/data/itineraries.js',
    './assets/js/favorites.js',
    './assets/js/components.js',
    './assets/js/map.js',
    './assets/js/weather.js',
    './assets/js/home.js',
    './assets/js/destination-render.js',
    './assets/js/destination.js',
    './assets/js/config.js',
    './assets/js/newsletter.js',
    './assets/js/main.js',
    './assets/js/scrollreveal.min.js',
    './assets/js/swiper-bundle.min.js',
    './assets/img/favicon.png',
    './assets/img/icons/icon-192.png',
]

/* Thư viện/phông chữ bên ngoài: lưu lại để dùng offline */
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com']
/* Ảnh và ô bản đồ: lưu có giới hạn */
const MEDIA_HOSTS = ['commons.wikimedia.org', 'upload.wikimedia.org', 'tile.openstreetmap.org']

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CORE_CACHE).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys()
        await Promise.all(keys.filter(k => k.startsWith('core-') && k !== CORE_CACHE).map(k => caches.delete(k)))
        await self.clients.claim()
    })())
})

async function trimCache(name, limit) {
    const cache = await caches.open(name)
    const keys = await cache.keys()
    await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map(k => cache.delete(k)))
}

/* Trang HTML: ưu tiên mạng để luôn mới nhất, mất mạng thì dùng bản đã lưu */
async function networkFirst(request, cacheName = PAGE_CACHE) {
    const cache = await caches.open(cacheName)
    try {
        const response = await fetch(request)
        if (response.ok) cache.put(request, response.clone())
        return response
    } catch {
        return (await cache.match(request, { ignoreSearch: false }))
            || (await caches.match(request))
            || (request.mode === 'navigate' ? caches.match('./offline.html') : Response.error())
    }
}

/* Tài nguyên tĩnh: dùng bản lưu ngay, cập nhật ngầm ở nền */
async function staleWhileRevalidate(request, cacheName, limit) {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    const network = fetch(request).then(response => {
        if (response.ok || response.type === 'opaque') {
            cache.put(request, response.clone())
            if (limit) trimCache(cacheName, limit)
        }
        return response
    }).catch(() => cached || Response.error())
    return cached || network
}

self.addEventListener('fetch', event => {
    const { request } = event
    if (request.method !== 'GET') return
    const url = new URL(request.url)

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request))
    } else if (url.origin === self.location.origin && /\.(?:js|css|webmanifest)$/.test(url.pathname)) {
        /* Mã nguồn: luôn lấy bản mới nhất để khớp với HTML vừa deploy, mất mạng mới dùng bản lưu */
        event.respondWith(networkFirst(request, CORE_CACHE))
    } else if (url.origin === self.location.origin) {
        event.respondWith(staleWhileRevalidate(request, CORE_CACHE))
    } else if (CDN_HOSTS.includes(url.hostname)) {
        event.respondWith(staleWhileRevalidate(request, CORE_CACHE))
    } else if (MEDIA_HOSTS.some(host => url.hostname.endsWith(host))) {
        event.respondWith(staleWhileRevalidate(request, MEDIA_CACHE, MEDIA_LIMIT))
    }
    /* Còn lại (vd: API thời tiết) đi thẳng ra mạng */
})
