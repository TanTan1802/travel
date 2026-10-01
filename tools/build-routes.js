/*
 * Bảng quãng đường + thời gian lái xe thật giữa mọi cặp điểm đến (OSRM – dữ liệu đường OpenStreetMap)
 * → data/routes.json. Trình lập kế hoạch dùng bảng này thay cho ước tính đường chim bay × 1,3.
 *
 * Chạy trên máy có Internet (hoặc workflow "Cập nhật quãng đường"):  node tools/build-routes.js && npm run build
 * Chỉ gửi MỘT yêu cầu "table" tới máy chủ OSRM công cộng (đúng chính sách sử dụng của OSRM demo server).
 * OSRM_URL để dùng máy chủ OSRM khác.
 */
const fs = require('fs')
const path = require('path')
const { ROOT } = require('./lib')

const OSRM_URL = process.env.OSRM_URL || 'https://router.project-osrm.org'

async function main() {
    const { destinations } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/destinations.json'), 'utf8'))
    const coords = destinations.map(d => `${d.lng},${d.lat}`).join(';')
    const url = `${OSRM_URL}/table/v1/driving/${coords}?annotations=duration,distance`
    const res = await fetch(url, { headers: { 'user-agent': 'VietTravel/1.0 (https://tantan1802.github.io/travel/)' } })
    if (!res.ok) throw new Error(`OSRM trả về HTTP ${res.status}`)
    const data = await res.json()
    if (data.code !== 'Ok') throw new Error(`OSRM: ${data.code} ${data.message || ''}`)

    /* km làm tròn tới 5 km, giờ tới 0,25 giờ; không có đường (đảo) → null */
    const km = data.distances.map(row => row.map(m => (m == null ? null : Math.round(m / 5000) * 5)))
    const hours = data.durations.map(row => row.map(s => (s == null ? null : Math.round(s / 900) / 4)))
    const json = {
        $schema: './schema/routes.schema.json',
        source: 'OSRM (router.project-osrm.org) – dữ liệu đường © OpenStreetMap contributors (ODbL)',
        generated: new Date().toISOString().slice(0, 10),
        ids: destinations.map(d => d.id),
        km,
        hours,
    }
    fs.writeFileSync(path.join(ROOT, 'data/routes.json'), JSON.stringify(json, null, 2).replace(/\[\n\s+([\d.,\snul]+?)\n\s+\]/g, (m, inner) => `[${inner.replace(/\s+/g, ' ').trim()}]`) + '\n')
    console.log(`✅ Đã ghi data/routes.json (${json.ids.length} điểm đến, ${json.ids.length ** 2} cặp)`)
}

main().catch(err => {
    console.error(`❌ ${err.message}`)
    process.exitCode = 1
})
