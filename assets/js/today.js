/*==================== CHẾ ĐỘ "HÔM NAY" & TIỆN ÍCH TRONG CHUYẾN ĐI ====================*/
/*
 * Dùng kế hoạch đã lưu (TripPlan) + ngày khởi hành để biết hôm nay là ngày mấy của chuyến đi.
 * Thêm ?today=YYYY-MM-DD&now=HH:MM vào URL để xem thử (và để test).
 */
function todayParams() {
    const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '')
    const today = /^\d{4}-\d{2}-\d{2}$/.test(params.get('today') || '') ? params.get('today') : ''
    const now = /^\d{2}:\d{2}$/.test(params.get('now') || '') ? params.get('now') : ''
    return { today, now }
}

function currentIsoDate(now = new Date()) {
    return todayParams().today
        || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function currentMinutes(now = new Date()) {
    const override = todayParams().now
    if (override) {
        const [h, m] = override.split(':').map(Number)
        return h * 60 + m
    }
    return now.getHours() * 60 + now.getMinutes()
}

/* Số ngày giữa hai ngày ISO (b - a) */
function daysBetween(a, b) {
    const toUtc = iso => Date.UTC(...iso.split('-').map((n, i) => Number(n) - (i === 1 ? 1 : 0)))
    return Math.round((toUtc(b) - toUtc(a)) / 86400000)
}

/* Chuyến đi đã lưu: ngày bắt đầu, kết thúc, tổng số ngày (cần có ngày khởi hành) */
function tripWindow(plan) {
    if (!plan || !plan.start || !plan.stops.length) return null
    const days = plan.stops.reduce((n, s) => n + s.days, 0)
    return { start: plan.start, end: addDays(plan.start, days - 1), days }
}

/* Trạng thái chuyến đi so với hôm nay: upcoming (còn N ngày) · ongoing (ngày thứ i) · null */
function tripStatus(plan, today = currentIsoDate()) {
    const trip = tripWindow(plan)
    if (!trip) return null
    if (today < trip.start) return { kind: 'upcoming', inDays: daysBetween(today, trip.start), trip }
    if (today <= trip.end) return { kind: 'ongoing', dayIndex: daysBetween(trip.start, today), trip }
    return null
}

/* Mốc đang diễn ra và mốc kế tiếp trong timeline của ngày, theo giờ hiện tại */
function currentAndNext(entries, minutes = currentMinutes()) {
    const toMin = time => {
        const [h, m] = time.split(':').map(Number)
        return h * 60 + m
    }
    let current = null
    let next = null
    for (const e of entries) {
        if (toMin(e.time) <= minutes) current = e
        else if (!next) next = e
    }
    return { current, next, minutesToNext: next ? toMin(next.time) - minutes : 0 }
}

/* Tìm nhanh quanh vị trí hiện tại trên Google Maps (Google tự dùng vị trí của điện thoại) */
const NEARBY_SEARCHES = [
    { icon: 'ri-cup-line', label: ['Cà phê gần đây', 'Coffee nearby'], query: ['quán cà phê gần đây', 'coffee near me'] },
    { icon: 'ri-restaurant-line', label: ['Quán ăn gần đây', 'Food nearby'], query: ['quán ăn gần đây', 'restaurants near me'] },
    { icon: 'ri-bank-card-line', label: ['ATM', 'ATM'], query: ['ATM gần đây', 'ATM near me'] },
    { icon: 'ri-capsule-line', label: ['Nhà thuốc', 'Pharmacy'], query: ['nhà thuốc gần đây', 'pharmacy near me'] },
    { icon: 'ri-gas-station-line', label: ['Cây xăng', 'Petrol'], query: ['cây xăng gần đây', 'petrol station near me'] },
    { icon: 'ri-hospital-line', label: ['Bệnh viện', 'Hospital'], query: ['bệnh viện gần đây', 'hospital near me'] },
]

function nearbyLinksHtml() {
    return `
        <div class="nearby-links">
            ${NEARBY_SEARCHES.map(s => `
                <a href="${mapsSearchUrl(pickLang(s.query))}" target="_blank" rel="noopener" class="chip nearby-links__chip">
                    <i class="${s.icon}"></i> ${pickLang(s.label)}
                </a>
            `).join('')}
        </div>
    `
}

/* Chỉ đường từ vị trí hiện tại tới một nơi (Google Maps tự lấy điểm xuất phát) */
const directionsToUrl = place => `https://www.google.com/maps/dir/?${new URLSearchParams({ api: '1', destination: place })}`

/* Nơi cần tới của một mốc timeline (quán hoặc điểm tham quan đầu tiên) */
function entryDestination(e, destName) {
    if (e.place) return `${e.place.name}, ${e.place.address}`
    if (e.sights && e.sights.length) return `${e.sights[0].name[0]}, ${e.sights[0].address}`
    return ''
}

/*==================== TẢI TRỌN CHUYẾN ĐỂ DÙNG OFFLINE ====================*/
const OFFLINE_CACHE = 'trip-offline'
const OFFLINE_KEY = 'viet-travel:offline-saved'
const offlineSupported = () => typeof caches !== 'undefined' && typeof fetch === 'function'

/* Mọi tài nguyên nội bộ (JS, CSS, ảnh trong repo) mà một trang HTML dùng tới */
function assetsInHtml(html, baseUrl) {
    const urls = new Set()
    for (const [, url] of html.matchAll(/\b(?:src|href)="([^"#]+)"/g)) {
        if (/^(https?:|data:|mailto:|tel:)/.test(url)) continue
        if (!/\.(?:js|css|webp|jpe?g|png|svg|webmanifest)(?:\?|$)/.test(url)) continue
        urls.add(new URL(url, baseUrl).href)
    }
    for (const [, set] of html.matchAll(/\bsrcset="([^"]+)"/g)) {
        set.split(',').map(x => x.trim().split(/\s+/)[0]).filter(Boolean).forEach(u => {
            if (!/^https?:/.test(u) && !/-1920\./.test(u)) urls.add(new URL(u, baseUrl).href)
        })
    }
    return urls
}

/* Ảnh trong repo (bản 480/960) của các điểm đến – ảnh bìa, gallery, món ăn */
function destinationImageUrls(d) {
    const files = [d.hero, ...d.gallery.map(g => g.file), ...d.foods.flatMap(f => [].concat(f.file || []))].filter(Boolean)
    const urls = new Set()
    files.forEach(file => {
        const entry = typeof LOCAL_IMAGES !== 'undefined' && LOCAL_IMAGES[file]
        if (!entry) return
        /* Chỉ bản nhỏ (xs 480px, sm 960px) – bỏ bản 1920px và các trường kích thước */
        ;[entry.xs, entry.sm].filter(path => typeof path === 'string').forEach(path => urls.add(new URL(`${SITE_ROOT}${path}`, location.href).href))
    })
    return urls
}

/*
 * Lưu trang kế hoạch + trang các điểm đến + mã nguồn + ảnh vào bộ nhớ đệm của trình duyệt.
 * onProgress(done, total) để hiện tiến độ. Trả về { saved, failed }.
 */
async function saveTripOffline(plan, pageUrls, onProgress = () => {}) {
    const cache = await caches.open(OFFLINE_CACHE)
    const urls = new Set(pageUrls.map(u => new URL(u, location.href).href))
    /* Lấy HTML từng trang để biết trang đó cần những file nào */
    for (const page of [...urls]) {
        try {
            const res = await fetch(page, { cache: 'no-cache' })
            if (!res.ok) continue
            const html = await res.clone().text()
            await cache.put(page, res)
            assetsInHtml(html, page).forEach(u => urls.add(u))
        } catch { /* bỏ qua trang lỗi */ }
    }
    plan.stops.forEach(s => destinationImageUrls(getDestination(s.id)).forEach(u => urls.add(u)))

    const list = [...urls]
    let done = 0
    let failed = 0
    await Promise.all(Array.from({ length: 4 }, async () => {
        while (list.length) {
            const url = list.shift()
            try {
                if (!(await cache.match(url))) {
                    const res = await fetch(url)
                    if (res.ok) await cache.put(url, res)
                    else failed++
                }
            } catch {
                failed++
            }
            onProgress(++done, urls.size)
        }
    }))
    const info = { time: new Date().toISOString(), count: urls.size - failed, route: plan.stops.map(s => s.id).join(',') }
    try { localStorage.setItem(OFFLINE_KEY, JSON.stringify(info)) } catch { /* bỏ qua */ }
    return { saved: urls.size - failed, failed }
}

function offlineInfo() {
    try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || 'null') } catch { return null }
}
