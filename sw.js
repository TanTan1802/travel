/*
 * Service worker – cho phép cài website như ứng dụng và xem lại trang đã mở khi mất mạng.
 * Bộ nhớ 'trip-offline' do nút "Tải về dùng offline" (today.js) tạo – không bị xóa khi cập nhật.
 * VERSION được `npm run build` cập nhật tự động mỗi khi mã nguồn thay đổi.
 */
const VERSION = 'f6c33b8118'
const CORE_CACHE = `core-${VERSION}`
const PAGE_CACHE = 'pages'
const PAGE_LIMIT = 80
const MEDIA_CACHE = 'media'
const MEDIA_LIMIT = 250

/*
 * Tài nguyên tải sẵn khi cài đặt (đường dẫn tương đối với sw.js): trang offline + đủ để mở lại trang chủ.
 * Mã/dữ liệu của trang điểm đến, kế hoạch, bản tiếng Anh được lưu dần khi người dùng mở các trang đó
 * (không bắt mọi người tải ~450 KB ngay lần đầu); "Tải về dùng offline" (today.js) lưu trọn chuyến đi.
 */
const CORE_ASSETS = [
    './',
    './index.html',
    './offline.html',
    './manifest.webmanifest',
    './assets/fonts/remixicon.woff2',
    './assets/fonts/open-sans-latin-400.woff2',
    './assets/fonts/open-sans-vietnamese-400.woff2',
    /* build:core-assets */
    './assets/css/site-76182f4a89.css',
    './assets/js/dist/f42550c10b.js',
    /* /build:core-assets */
    './assets/img/favicon.svg',
    './assets/img/favicon.png',
    './assets/img/icons/icon-192.png',
]

/* Thư viện bên ngoài (Leaflet): lưu lại để dùng offline */
const CDN_HOSTS = ['cdnjs.cloudflare.com']
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
async function networkFirst(request, cacheName = PAGE_CACHE, limit = 0) {
    const cache = await caches.open(cacheName)
    try {
        const response = await fetch(request)
        if (response.ok) {
            cache.put(request, response.clone()).then(() => limit && trimCache(cacheName, limit))
        }
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
            cache.put(request, response.clone()).then(() => limit && trimCache(cacheName, limit))
        }
        return response
    }).catch(async () => cached || (await caches.match(request)) || Response.error())
    return cached || network
}

self.addEventListener('fetch', event => {
    const { request } = event
    if (request.method !== 'GET') return
    const url = new URL(request.url)

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, PAGE_CACHE, PAGE_LIMIT))
    } else if (url.origin === self.location.origin && /\.(?:js|css|webmanifest)$/.test(url.pathname)) {
        /* Mã nguồn: luôn lấy bản mới nhất để khớp với HTML vừa deploy, mất mạng mới dùng bản lưu */
        event.respondWith(networkFirst(request, CORE_CACHE))
    } else if (url.origin === self.location.origin && url.pathname.includes('/assets/img/wiki/')) {
        /* Ảnh địa danh (tới vài trăm KB/ảnh): bộ nhớ có giới hạn, không bị xóa mỗi lần cập nhật phiên bản */
        event.respondWith(staleWhileRevalidate(request, MEDIA_CACHE, MEDIA_LIMIT))
    } else if (url.origin === self.location.origin) {
        event.respondWith(staleWhileRevalidate(request, CORE_CACHE))
    } else if (CDN_HOSTS.includes(url.hostname)) {
        event.respondWith(staleWhileRevalidate(request, CORE_CACHE))
    } else if (MEDIA_HOSTS.some(host => url.hostname.endsWith(host))) {
        event.respondWith(staleWhileRevalidate(request, MEDIA_CACHE, MEDIA_LIMIT))
    }
    /* Còn lại (vd: API thời tiết) đi thẳng ra mạng */
})
