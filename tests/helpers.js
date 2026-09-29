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

/*
 * Chặn/giả lập tài nguyên bên ngoài để test ổn định:
 * - Wikimedia Commons: 404 (bắt buộc dùng ảnh trong repo), Open-Meteo: dữ liệu giả, Giscus: chặn.
 * - CDN (Leaflet, Remix Icon, Google Fonts): dùng mạng thật; nếu đặt LOCAL_CDN_DIR thì lấy bản cục bộ.
 */
async function setupRoutes(context) {
    await context.route('https://commons.wikimedia.org/**', r => r.fulfill({ status: 404, body: '' }))
    await context.route('https://api.open-meteo.com/**', r => r.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(WEATHER_MOCK),
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
        await context.route('https://cdn.jsdelivr.net/npm/remixicon@2.5.0/**', r => {
            const rel = r.request().url().split('remixicon@2.5.0/')[1].split('?')[0]
            const file = path.join(local, 'remixicon', rel)
            if (!fs.existsSync(file)) return r.fulfill({ status: 404, body: '' })
            r.fulfill({ status: 200, body: fs.readFileSync(file) })
        })
        await context.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }))
    }
}

/* Danh sách mọi trang HTML đã build (tương đối với gốc repo) */
function builtPages() {
    const pages = ['index.html', 'en/index.html']
    for (const dir of ['diem-den', 'en/diem-den']) {
        for (const id of fs.readdirSync(path.join(ROOT, dir))) pages.push(`${dir}/${id}/index.html`)
    }
    return pages
}

module.exports = { ROOT, startServer, setupRoutes, builtPages }
