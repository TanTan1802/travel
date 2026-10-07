/*
 * Sinh worker/src/knowledge.js – dữ liệu của site dạng văn bản gọn cho trợ lý hỏi đáp (worker/).
 * Nội dung chỉ phụ thuộc dữ liệu (không có ngày giờ) nên giống hệt nhau giữa các lần build → prompt caching
 * của Claude dùng lại được khối này cho mọi câu hỏi.
 * Chạy tự động trong `npm run build`.
 */
const fs = require('fs')
const path = require('path')
const { ROOT, SITE_URL, loadBrowserScripts } = require('./lib')

const OUT = 'worker/src/knowledge.js'

const site = loadBrowserScripts([
    'assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/data/itineraries.js',
    'assets/js/data/places.js', 'assets/js/data/sights.js', 'assets/js/data/events.js', 'assets/js/components.js',
], ['DESTINATIONS', 'REGIONS', 'CATEGORIES', 'ITINERARIES', 'TOUR_LENGTHS', 'PLACES', 'SIGHTS', 'STAY_TYPES', 'EVENTS', 'EVENT_TYPES', 'tripCost'],
{ SITE_ROOT: '', SITE_LANG: 'vi' })

const vnd = n => `${Math.round(n / 1000).toLocaleString('vi-VN')}k`
const range = p => (Array.isArray(p) ? (p[1] ? `${vnd(p[0])}–${vnd(p[1])}` : 'miễn phí') : p ? vnd(p) : 'miễn phí')
const hours = h => (h === 'all' ? 'mở cả ngày' : Array.isArray(h) ? h[0] : h)
const vi = pair => (Array.isArray(pair) ? pair[0] : pair)

function eventLine(e) {
    const when = e.dates ? `${e.dates[0]} → ${e.dates[1]} (MM-DD)` : `tháng ${e.months.join(', ')}`
    return `${vi(e.name)} (${vi(site.EVENT_TYPES[e.type].label)}, ${when}${e.lunar ? ', âm lịch' : ''}): ${vi(e.desc)} Mẹo: ${vi(e.tip)}`
}

function destinationBlock(d) {
    const plan = site.ITINERARIES[d.id] || { days: [] }
    const places = site.PLACES[d.id] || { eats: [], cafes: [], stays: [] }
    const sights = (site.SIGHTS[d.id] || []).flat()
    const events = site.EVENTS.filter(e => e.where !== 'all' && e.where.includes(d.id))
    const costs = site.TOUR_LENGTHS.map(n => `${n} ngày ${n - 1} đêm: ${vnd(site.tripCost(d.id, n, 'saving').total)} (tiết kiệm) / ${vnd(site.tripCost(d.id, n, 'comfort').total)} (thoải mái)`)
    return [
        `## ${d.name} (mã: ${d.id})`,
        `Tỉnh: ${d.province} · ${site.REGIONS[d.region]} · Loại hình: ${d.categories.map(c => site.CATEGORIES[c]).join(', ')} · Đánh giá ${d.rating}/5`,
        `Thời điểm đẹp: ${d.bestTime} (các tháng đẹp: ${d.bestMonths.join(', ')}) · Nên ở: ${d.duration}`,
        `Trang: ${SITE_URL}diem-den/${d.id}/ · Giá vé: ${SITE_URL}diem-den/${d.id}/gia-ve/`,
        `Giới thiệu: ${d.tagline}. ${d.description}`,
        `Điểm nhấn: ${d.highlights.join('; ')}`,
        `Đặc sản: ${d.foods.map(f => f.name).join(', ')}`,
        `Trải nghiệm: ${d.activities.map(a => a.title || a.name || a).join('; ')}`,
        `Kinh nghiệm: ${d.tips.map(x => (typeof x === 'string' ? x : x.text || x.title)).join(' | ')}`,
        `Đi tới: ${vi(places.getThere || '')}${places.airport ? ` · Sân bay gần nhất: ${places.airport}` : ''}${places.rail ? ` · Ga tàu: ${places.rail}` : ''}`,
        `Chi phí tour ước tính/người (chưa gồm vé máy bay/tàu tới nơi): ${costs.join('; ')}`,
        'Lịch trình gợi ý (tour 3/4 ngày = 3/4 ngày đầu):',
        ...plan.days.map((day, i) => `- Ngày ${i + 1} – ${day.title}: sáng ${day.morning} Chiều ${day.afternoon} Tối ${day.evening}`),
        'Điểm tham quan (giá vé người lớn · giờ mở cửa · địa chỉ):',
        ...sights.map(s => `- ${vi(s.name)}: ${range(s.price)} · ${hours(s.hours)} · ${s.address}${s.note ? ` (${vi(s.note)})` : ''}`),
        'Quán ăn (món · giá/người · địa chỉ):',
        ...places.eats.map(e => `- ${e.name}: ${vi(e.dish)} · ${range(e.price)} · ${e.address}`),
        'Quán cà phê / nước:',
        ...places.cafes.map(c => `- ${c.name}: ${vi(c.drink)} · ${range(c.price)} · ${c.address}`),
        'Khu lưu trú (giá/đêm/phòng):',
        ...places.stays.map(s => `- ${vi(s.area)} (${vi(site.STAY_TYPES[s.type])}): ${range(s.price)} – ${vi(s.note)}`),
        ...(events.length ? ['Lễ hội & mùa đặc sắc:', ...events.map(e => `- ${eventLine(e)}`)] : []),
    ].join('\n')
}

function knowledgeText() {
    const national = site.EVENTS.filter(e => e.where === 'all')
    return [
        '# Dữ liệu Việt Travel (giá tham khảo, VND; "k" = nghìn đồng)',
        `Trang chủ: ${SITE_URL} · Lập kế hoạch nhiều điểm: ${SITE_URL}ke-hoach/ · Cẩm nang: ${SITE_URL}cam-nang/ · Đi đâu theo tháng: ${SITE_URL}thang/<1-12>/`,
        'Lễ hội, nghỉ lễ toàn quốc:',
        ...national.map(e => `- ${eventLine(e)}`),
        '',
        ...site.DESTINATIONS.map(destinationBlock),
    ].join('\n')
}

function main() {
    const text = knowledgeText()
    fs.mkdirSync(path.join(ROOT, path.dirname(OUT)), { recursive: true })
    fs.writeFileSync(path.join(ROOT, OUT),
        '/* Sinh tự động bởi tools/build-knowledge.js (npm run build) – không sửa tay. */\n' +
        `export default ${JSON.stringify(text)}\n`)
    console.log(`✅ ${OUT}: ${site.DESTINATIONS.length} điểm đến, ${(text.length / 1024).toFixed(0)} KB văn bản`)
}

if (require.main === module) main()

module.exports = { knowledgeText }
