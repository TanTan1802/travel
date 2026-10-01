/* Tiện ích cho bộ test: server tĩnh + định tuyến tài nguyên bên ngoài cho trình duyệt */
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml',
    '.mp4': 'video/mp4',
}

/* Server tĩnh phục vụ thư mục repo (giống GitHub Pages) trên cổng ngẫu nhiên */
function startServer() {
    const server = http.createServer((req, res) => {
        let file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
        if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end() }
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
        if (!fs.existsSync(file)) { res.writeHead(404); return res.end('not found') }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' })
        fs.createReadStream(file).pipe(res)
    })
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
        resolve({ url: `http://127.0.0.1:${server.address().port}/`, close: () => new Promise(r => server.close(r)) })
    }))
}

const WEATHER_MOCK = {
    current: { temperature_2m: 27.4, relative_humidity_2m: 78, weather_code: 2, wind_speed_10m: 11.2 },
    daily: {
        time: ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'],
        weather_code: [2, 61, 95, 0],
        temperature_2m_max: [31, 30, 29, 32],
        temperature_2m_min: [24, 24, 23, 25],
        precipitation_probability_max: [20, 70, 90, 5],
    },
}

/* Dự báo theo khoảng ngày (start_date → end_date) khi trang hỏi theo ngày đi, còn lại dùng mẫu cố định */
function weatherMock(url) {
    const start = url.searchParams.get('start_date')
    const end = url.searchParams.get('end_date')
    if (!start || !end) return WEATHER_MOCK
    const time = []
    for (let d = new Date(`${start}T00:00:00Z`); d <= new Date(`${end}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
        time.push(d.toISOString().slice(0, 10))
    }
    const codes = [0, 2, 61, 95]
    return {
        daily: {
            time,
            weather_code: time.map((_, i) => codes[i % codes.length]),
            temperature_2m_max: time.map((_, i) => 30 + (i % 3)),
            temperature_2m_min: time.map((_, i) => 23 + (i % 2)),
            precipitation_probability_max: time.map((_, i) => (i * 17) % 100),
        },
    }
}

/*
 * Chặn/giả lập tài nguyên bên ngoài để test ổn định:
 * - Wikimedia Commons: 404 (bắt buộc dùng ảnh trong repo), Open-Meteo: dữ liệu giả, Giscus: chặn.
 * - CDN (Leaflet, Google Fonts): dùng mạng thật; nếu đặt LOCAL_CDN_DIR thì lấy bản cục bộ (icon đã tự host).
 */
async function setupRoutes(context) {
    await context.route('https://commons.wikimedia.org/**', r => r.fulfill({ status: 404, body: '' }))
    await context.route('https://api.open-meteo.com/**', r => r.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(weatherMock(new URL(r.request().url()))),
    }))
    await context.route('https://giscus.app/**', r => r.fulfill({ status: 404, body: '' }))
    await context.route('https://*.tile.openstreetmap.org/**', r => r.fulfill({
        status: 200, contentType: 'image/png',
        body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64'),
    }))

    const local = process.env.LOCAL_CDN_DIR
    if (local) {
        await context.route('https://cdnjs.cloudflare.com/ajax/libs/leaflet/**', r => {
            const css = r.request().url().endsWith('.css')
            r.fulfill({ status: 200, contentType: css ? 'text/css' : 'application/javascript',
                body: fs.readFileSync(path.join(local, 'leaflet/dist', css ? 'leaflet.css' : 'leaflet.js')) })
        })
        await context.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }))
    }
}

/* Tiền tố thư mục của các ngôn ngữ (tiếng Việt ở gốc site) */
const LANG_PREFIXES = ['', 'en/', 'ko/', 'zh/', 'ja/']

/* Danh sách mọi trang HTML đã build (tương đối với gốc repo) */
function builtPages() {
    const pages = LANG_PREFIXES.flatMap(p => [`${p}index.html`, `${p}ke-hoach/index.html`, `${p}cam-nang/index.html`])
    for (const dir of LANG_PREFIXES.flatMap(p => ['diem-den', 'cam-nang', 'thang', 'chu-de'].map(d => p + d))) {
        for (const id of fs.readdirSync(path.join(ROOT, dir))) {
            if (!fs.statSync(path.join(ROOT, dir, id)).isDirectory()) continue
            pages.push(`${dir}/${id}/index.html`)
            /* Trang giá vé của điểm đến: diem-den/<id>/gia-ve/ */
            if (fs.existsSync(path.join(ROOT, dir, id, 'gia-ve', 'index.html'))) pages.push(`${dir}/${id}/gia-ve/index.html`)
        }
    }
    return pages
}

module.exports = { ROOT, LANG_PREFIXES, startServer, setupRoutes, builtPages }
