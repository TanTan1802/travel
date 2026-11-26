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
    'assets/js/data/places.js', 'assets/js/data/routes.js', 'assets/js/data/sights.js', 'assets/js/data/events.js', 'assets/js/components.js',
    'assets/js/data/treks.js', 'assets/js/data/tours.js', 'assets/js/tour-render.js',
], ['DESTINATIONS', 'REGIONS', 'CATEGORIES', 'ITINERARIES', 'TOUR_LENGTHS', 'PLACES', 'SIGHTS', 'STAY_TYPES', 'EVENTS', 'EVENT_TYPES', 'tripCost',
    'TREKS', 'TREK_LEVELS', 'TOUR_PACKAGES', 'TOUR_STYLES', 'tourCost', 'tourStops', 'tourLegs', 'tourDayDest', 'tourDaySights', 'tourBestMonths', 'getDestination', 'modeLabel'],
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

/* Tour & combo: hành trình, lịch từng ngày, chặng di chuyển, chi phí – cùng hàm tính với trang tour/ */
function tourBlock(tp) {
    const stops = site.tourStops(tp).map(x => `${site.getDestination(x.id).name} ${x.days} ngày`).join(' → ')
    const { items, total } = site.tourCost(tp)
    const legs = site.tourLegs(tp)
    return [
        `### ${vi(tp.name)} (mã tour: ${tp.id})`,
        `Hành trình: ${stops} · ${tp.days} ngày ${tp.days - 1} đêm · Phong cách: ${vi(site.TOUR_STYLES[tp.style].label)} · Tháng đẹp: ${site.tourBestMonths(tp).join(', ')}`,
        `Trang: ${SITE_URL}tour/${tp.id}/ · Tóm tắt: ${vi(tp.summary)}`,
        `Chi phí ước tính/người: ${range(total)} (${items.map(x => `${x.label}: ${range(x.range)}`).join('; ')}). Chưa gồm vé máy bay/tàu xe tới điểm đầu.`,
        ...tp.plan.map((day, i) => `- Ngày ${i + 1} (${site.getDestination(site.tourDayDest(tp, i)).name})${legs[i] ? ` [di chuyển ${legs[i].from.name} → ${legs[i].to.name}: ${site.modeLabel(legs[i].option)}, ${range(legs[i].cost)}]` : ''} – ${vi(day.title)}: ${vi(day.text)} Điểm: ${site.tourDaySights(tp, i).map(x => vi(x.name)).join(', ')}`),
        ...(tp.tips || []).map(x => `- Mẹo: ${vi(x)}`),
    ].join('\n')
}

function trekBlock(tr) {
    return [
        `### Trekking ${vi(tr.name)} (mã: ${tr.id})`,
        `${vi(tr.province)} · Độ khó: ${vi(site.TREK_LEVELS[tr.level].label)} · ${tr.days} ngày · ${tr.distanceKm[0]}–${tr.distanceKm[1]} km (${vi(tr.distanceNote)})${tr.summit ? ` · Đỉnh ${tr.summit} m` : ''} · Tháng đẹp: ${tr.bestMonths.join(', ')} · Người dẫn đường: ${tr.guide === 'required' ? 'bắt buộc' : 'nên thuê'}`,
        `Trang: ${SITE_URL}trekking/${tr.id}/ · Xuất phát: ${vi(tr.start)}`,
        ...(tr.notice ? [`QUY ĐỊNH: ${vi(tr.notice)}`] : []),
        ...tr.plan.map((d, i) => `- Ngày ${i + 1} – ${vi(d.title)}: ${vi(d.text)}`),
        `Chi phí: ${tr.costs.map(vi).join(' | ')}`,
        `An toàn: ${tr.safety.map(vi).join(' | ')}`,
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
        '',
        `## Tour & combo trọn gói (${SITE_URL}tour/) – 1 đến 7 ngày, có tour liên tuyến nhiều điểm đến`,
        ...site.TOUR_PACKAGES.map(tourBlock),
        '',
        `## Trekking (${SITE_URL}trekking/) – luôn nhắc quy định và an toàn khi trả lời`,
        ...site.TREKS.map(trekBlock),
    ].join('\n')
}

function main() {
    const text = knowledgeText()
    fs.mkdirSync(path.join(ROOT, path.dirname(OUT)), { recursive: true })
    fs.writeFileSync(path.join(ROOT, OUT),
        '/* Sinh tự động bởi tools/build-knowledge.js (npm run build) – không sửa tay. */\n' +
        `export default ${JSON.stringify(text)}\n`)
    console.log(`✅ ${OUT}: ${site.DESTINATIONS.length} điểm đến, ${site.TOUR_PACKAGES.length} tour, ${site.TREKS.length} cung trekking, ${(text.length / 1024).toFixed(0)} KB văn bản`)
}

if (require.main === module) main()

module.exports = { knowledgeText }
