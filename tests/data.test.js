/*
 * Test dữ liệu & trang tĩnh (không cần trình duyệt).   Chạy:  npm run test:data
 */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const { loadBrowserScripts, SITE_URL } = require('../tools/lib')
const siteRe = SITE_URL.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
const { ROOT, LANG_PREFIXES, builtPages } = require('./helpers')

const site = loadBrowserScripts(
    ['assets/js/data/local-images.js', 'assets/js/data/en.js', 'assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/data/itineraries.js', 'assets/js/data/places.js', 'assets/js/data/sights.js'],
    ['LOCAL_IMAGES', 'TRANSLATION_EN', 'DESTINATIONS', 'ITINERARIES', 'REGIONS', 'CATEGORIES', 'TOUR_LENGTHS', 'PLACES', 'STAY_TYPES', 'SIGHTS'],
)
const { DESTINATIONS, ITINERARIES, TRANSLATION_EN: EN, REGIONS, CATEGORIES } = site
/* Tên một quán có thật trong dữ liệu – dùng để kiểm tra gói JS trang kế hoạch không nạp sẵn mọi quán */
const PLACES_SAMPLE = site.PLACES['hoi-an'].eats[0].name

test('mã điểm đến không trùng và đủ trường bắt buộc', () => {
    const ids = DESTINATIONS.map(d => d.id)
    assert.equal(new Set(ids).size, ids.length, 'có mã điểm đến bị trùng')
    const required = ['id', 'name', 'province', 'region', 'categories', 'rating', 'lat', 'lng', 'bestMonths',
        'tagline', 'description', 'highlights', 'bestTime', 'duration', 'hero', 'gallery', 'foods', 'activities', 'tips']
    for (const d of DESTINATIONS) {
        for (const key of required) assert.ok(d[key] !== undefined && d[key] !== '', `${d.id} thiếu ${key}`)
        assert.match(d.id, /^[a-z0-9-]+$/, `${d.id}: mã chỉ gồm chữ thường, số, gạch nối`)
        assert.ok(REGIONS[d.region], `${d.id}: vùng không hợp lệ`)
        d.categories.forEach(c => assert.ok(CATEGORIES[c], `${d.id}: loại hình ${c} không hợp lệ`))
        assert.ok(d.lat > 8 && d.lat < 24 && d.lng > 102 && d.lng < 110, `${d.id}: tọa độ ngoài Việt Nam`)
        d.bestMonths.forEach(m => assert.ok(m >= 1 && m <= 12, `${d.id}: tháng ${m} không hợp lệ`))
        assert.ok(d.rating > 0 && d.rating <= 5, `${d.id}: đánh giá ngoài khoảng 0–5`)
    }
})

test('lịch trình: mỗi điểm đến có 5 ngày và phí tham quan cho 2 mức chi tiêu', () => {
    for (const d of DESTINATIONS) {
        const plan = ITINERARIES[d.id]
        assert.ok(plan, `${d.id} chưa có lịch trình`)
        assert.equal(plan.days.length, 5, `${d.id}: cần 5 ngày`)
        plan.days.forEach((day, i) => {
            for (const key of ['title', 'morning', 'afternoon', 'evening']) assert.ok(day[key], `${d.id} ngày ${i + 1} thiếu ${key}`)
        })
        assert.ok(Array.isArray(plan.fees) && plan.fees.length === 2, `${d.id}: fees cần [tiết kiệm, thoải mái]`)
        assert.ok(plan.fees[0] > 0 && plan.fees[0] <= plan.fees[1], `${d.id}: phí tiết kiệm phải > 0 và ≤ thoải mái`)
    }
})

test('chi phí tour: tăng theo số ngày, hai mức chênh hợp lý và cộng đúng các khoản', () => {
    const app = loadBrowserScripts(
        ['assets/js/data/local-images.js', 'assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/data/itineraries.js',
            'assets/js/data/places.js', 'assets/js/data/sights.js', 'assets/js/components.js'],
        ['DESTINATIONS', 'tripCost'],
    )
    for (const d of app.DESTINATIONS) {
        const [s3, s4, s5] = [3, 4, 5].map(n => app.tripCost(d.id, n, 'saving'))
        const c3 = app.tripCost(d.id, 3, 'comfort')
        assert.ok(s3.total < s4.total && s4.total < s5.total, `${d.id}: chi phí phải tăng theo số ngày`)
        const ratio = c3.total / s3.total
        assert.ok(ratio >= 1.3 && ratio <= 2.3, `${d.id}: mức thoải mái gấp ${ratio.toFixed(2)} lần tiết kiệm (nên 1,3–2,3)`)
        assert.equal(s3.items.reduce((sum, i) => sum + i.amount, 0), s3.total, `${d.id}: tổng phải bằng tổng các khoản`)
        assert.deepEqual([...s3.items.map(i => i.key)], ['stay', 'food', 'transport', 'fees'])
    }
})

test('timeline 5 ngày: không lặp quán / món, không chèn bữa trùng với lịch tham quan', () => {
    const app = loadBrowserScripts(
        ['assets/js/data/local-images.js', 'assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/data/itineraries.js',
            'assets/js/data/places.js', 'assets/js/data/sights.js', 'assets/js/components.js'],
        ['DESTINATIONS', 'ITINERARIES', 'dayTimeline'],
    )
    for (const d of app.DESTINATIONS) {
        const seen = new Map()
        app.ITINERARIES[d.id].days.forEach((day, i) => {
            const entries = app.dayTimeline(d.id, i, day, { last: i === 4 })
            assert.ok(entries.length >= 7, `${d.id} ngày ${i + 1}: timeline quá ít mục (${entries.length})`)
            const meals = entries.filter(e => e.kind === 'meal').map(e => e.title)
            assert.equal(new Set(meals).size, meals.length, `${d.id} ngày ${i + 1}: một bữa xuất hiện 2 lần`)
            for (const e of entries.filter(x => x.place)) {
                assert.ok(!seen.has(e.place.name), `${d.id}: "${e.place.name}" lặp lại (ngày ${seen.get(e.place.name)} và ${i + 1})`)
                seen.set(e.place.name, i + 1)
            }
        })
    }
})

test('quán ăn, lưu trú, đi lại: đủ cho mọi điểm đến và có cả hai ngôn ngữ', () => {
    const { PLACES, STAY_TYPES } = site
    const pair = (v, where) => assert.ok(Array.isArray(v) && v.length === 2 && v[0] && v[1], `${where}: cần [tiếng Việt, English]`)
    const range = (v, where) => assert.ok(Array.isArray(v) && v[0] > 0 && v[0] < v[1], `${where}: giá phải là [thấp, cao]`)
    assert.deepEqual(Object.keys(PLACES).sort(), [...DESTINATIONS.map(d => d.id)].sort(), 'PLACES phải khớp danh sách điểm đến')
    for (const [id, p] of Object.entries(PLACES)) {
        assert.ok(p.city, `${id}: thiếu city`)
        assert.match(p.airport, /^[A-Z]{3}$/, `${id}: mã sân bay không hợp lệ`)
        pair(p.getThere, `${id}.getThere`)
        assert.ok(p.eats.length >= 3, `${id}: cần ít nhất 3 quán`)
        p.eats.forEach((e, i) => {
            assert.ok(e.name && e.address, `${id}.eats[${i}]: thiếu tên/địa chỉ`)
            pair(e.dish, `${id}.eats[${i}].dish`)
            range(e.price, `${id}.eats[${i}].price`)
        })
        assert.ok(p.cafes && p.cafes.length >= 3, `${id}: cần ít nhất 3 quán cà phê / quán nước`)
        p.cafes.forEach((c, i) => {
            assert.ok(c.name && c.address, `${id}.cafes[${i}]: thiếu tên/địa chỉ`)
            pair(c.drink, `${id}.cafes[${i}].drink`)
            range(c.price, `${id}.cafes[${i}].price`)
        })
        assert.ok(p.stays.length >= 2, `${id}: cần ít nhất 2 khu lưu trú`)
        p.stays.forEach((st, i) => {
            assert.ok(STAY_TYPES[st.type], `${id}.stays[${i}]: loại "${st.type}" không hợp lệ`)
            pair(st.area, `${id}.stays[${i}].area`)
            pair(st.note, `${id}.stays[${i}].note`)
            range(st.price, `${id}.stays[${i}].price`)
        })
    }
})

test('điểm tham quan: đủ 5 ngày, có giá vé, giờ mở cửa, địa chỉ và quán nước gần điểm', () => {
    const { SIGHTS } = site
    const pair = (v, where) => assert.ok(Array.isArray(v) && v.length === 2 && v[0] && v[1], `${where}: cần [tiếng Việt, English]`)
    assert.deepEqual(Object.keys(SIGHTS).sort(), [...DESTINATIONS.map(d => d.id)].sort(), 'SIGHTS phải khớp danh sách điểm đến')
    for (const [id, days] of Object.entries(SIGHTS)) {
        assert.equal(days.length, 5, `${id}: cần điểm tham quan cho 5 ngày`)
        let cafes = 0
        days.forEach((list, i) => {
            const where = `${id} ngày ${i + 1}`
            assert.ok(list.length >= 1, `${where}: chưa có điểm tham quan`)
            list.forEach((s, j) => {
                assert.ok(['m', 'a', 'e'].includes(s.at), `${where}[${j}]: at phải là m / a / e`)
                pair(s.name, `${where}[${j}].name`)
                const ok = typeof s.price === 'number' ? s.price >= 0
                    : Array.isArray(s.price) && s.price[0] >= 0 && s.price[0] < s.price[1]
                assert.ok(ok, `${where}: giá "${s.name[0]}" phải là số ≥ 0 hoặc [thấp, cao]`)
                assert.ok(s.hours === 'all' || typeof s.hours === 'string' || (Array.isArray(s.hours) && s.hours.length === 2), `${where}: "${s.name[0]}" thiếu giờ mở cửa`)
                assert.ok(s.address, `${where}: "${s.name[0]}" thiếu địa chỉ`)
                if (s.note) pair(s.note, `${where}: ghi chú "${s.name[0]}"`)
                if (s.cafe) {
                    cafes++
                    assert.ok(s.cafe.name, `${where}: quán cạnh "${s.name[0]}" thiếu tên`)
                    pair(s.cafe.drink, `${where}: đồ uống quán "${s.cafe.name}"`)
                    assert.ok(Array.isArray(s.cafe.price) && s.cafe.price[0] > 0 && s.cafe.price[0] < s.cafe.price[1], `${where}: giá quán "${s.cafe.name}"`)
                }
            })
        })
        assert.ok(cafes >= 6, `${id}: cần ít nhất 6 quán nước gần điểm tham quan (có ${cafes})`)
    }
})

test('timeline: mỗi ngày có quán nước có tên và ước tính chi phí', () => {
    const app = loadBrowserScripts(
        ['assets/js/data/local-images.js', 'assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/data/itineraries.js',
            'assets/js/data/places.js', 'assets/js/data/sights.js', 'assets/js/components.js'],
        ['DESTINATIONS', 'ITINERARIES', 'dayTimeline', 'dayCost'],
    )
    for (const d of app.DESTINATIONS) {
        app.ITINERARIES[d.id].days.forEach((day, i) => {
            const entries = app.dayTimeline(d.id, i, day, { last: i === 4 })
            const where = `${d.id} ngày ${i + 1}`
            assert.ok(entries.some(e => e.sights.length), `${where}: buổi tham quan chưa có điểm cụ thể`)
            assert.ok(entries.find(e => e.kind === 'cafe')?.place, `${where}: khung 13:00 cần quán cà phê có tên`)
            assert.ok(entries.find(e => e.kind === 'drink')?.place, `${where}: khung 16:30 cần quán nước có tên`)
            const cost = app.dayCost(entries)
            assert.ok(cost.tickets[0] <= cost.tickets[1] && cost.food[1] > 0, `${where}: chi phí ước tính không hợp lệ`)
        })
    }
})

test('món đặc sản nào cũng có ảnh (ảnh thật hoặc ảnh minh họa có chú thích)', () => {
    for (const d of DESTINATIONS) {
        d.foods.forEach(f => {
            const files = [].concat(f.file || [])
            assert.ok(files.length && files.every(x => typeof x === 'string' && /\.(jpe?g|png|webp)$/i.test(x)), `${d.id}: món "${f.name}" chưa có ảnh`)
        })
    }
})

test('xuất lịch .ics đúng chuẩn RFC 5545, link Google Calendar và Google Maps hợp lệ', () => {
    const app = loadBrowserScripts(
        ['assets/js/data/local-images.js', 'assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/data/itineraries.js',
            'assets/js/data/places.js', 'assets/js/data/sights.js', 'assets/js/components.js', 'assets/js/trip-export.js'],
        ['DESTINATIONS', 'ITINERARIES', 'dayTimeline', 'timelineToEvents', 'buildIcs', 'foldIcsLine', 'googleCalendarDayUrl',
            'dayDetailsText', 'dayRouteUrl', 'tripRouteUrl', 'safeFileName', 'addDays'],
    )
    const d = app.DESTINATIONS.find(x => x.id === 'hoi-an')
    const days = app.ITINERARIES[d.id].days.slice(0, 3)
    const start = '2026-12-30' // qua năm mới để kiểm tra cộng ngày
    const entries = days.map((day, i) => app.dayTimeline(d.id, i, day, { last: i === 2 }))
    const events = entries.flatMap((list, i) => app.timelineToEvents(list, { date: app.addDays(start, i), destName: d.name, dayLabel: `Ngày ${i + 1}` }))
    assert.equal(events.length, entries.reduce((n, list) => n + list.length, 0), 'mỗi mốc timeline là một sự kiện')
    events.forEach(e => assert.ok(e.end > e.start, `sự kiện ${e.summary} phải kết thúc sau khi bắt đầu`))
    assert.ok(events.some(e => e.start.startsWith('20270101T')), 'ngày thứ 3 phải là 01/01/2027')

    const ics = app.buildIcs({ name: 'Hội An; thử, "ký tự" đặc biệt', events, now: new Date(Date.UTC(2026, 8, 30, 8, 0, 0)) })
    assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'), 'mở đầu VCALENDAR + VERSION')
    assert.ok(ics.endsWith('END:VCALENDAR\r\n'))
    assert.ok(!/[^\r]\n/.test(ics), 'mọi dòng phải kết thúc bằng CRLF')
    const lines = ics.split('\r\n').slice(0, -1)
    lines.forEach(line => assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `dòng quá 75 byte: ${line}`))
    const unfolded = ics.replace(/\r\n /g, '').split('\r\n')
    assert.equal(unfolded.filter(l => l === 'BEGIN:VEVENT').length, events.length)
    assert.equal(unfolded.filter(l => l === 'END:VEVENT').length, events.length)
    assert.ok(unfolded.includes('TZID:Asia/Ho_Chi_Minh') && unfolded.includes('TZOFFSETTO:+0700'), 'cần VTIMEZONE Việt Nam')
    assert.ok(unfolded.includes('X-WR-CALNAME:Hội An\\; thử\\, "ký tự" đặc biệt'), 'phải thoát ; và , trong TEXT')
    assert.ok(unfolded.every(l => !l.startsWith('DTSTART;') || /^DTSTART;TZID=Asia\/Ho_Chi_Minh:\d{8}T\d{6}$/.test(l)), 'DTSTART sai định dạng')
    assert.ok(unfolded.includes('DTSTAMP:20260930T080000Z'), 'DTSTAMP theo UTC')
    const uids = unfolded.filter(l => l.startsWith('UID:'))
    assert.equal(new Set(uids).size, uids.length, 'UID không được trùng')
    /* Gập dòng không làm vỡ ký tự tiếng Việt nhiều byte */
    const long = `DESCRIPTION:${'Phố cổ Hội An – đèn lồng rực rỡ '.repeat(8)}`
    assert.equal(app.foldIcsLine(long).replace(/\r\n /g, ''), long)

    const gcal = new URL(app.googleCalendarDayUrl({ title: 'Hội An – Ngày 1', date: '2026-12-31', details: app.dayDetailsText(entries[0]), location: 'Hội An' }))
    assert.equal(gcal.hostname, 'calendar.google.com')
    assert.equal(gcal.searchParams.get('dates'), '20261231/20270101', 'sự kiện cả ngày: ngày kết thúc là hôm sau')
    assert.equal(gcal.searchParams.get('ctz'), 'Asia/Ho_Chi_Minh')
    assert.ok(gcal.searchParams.get('details').length <= 1500)

    for (const x of app.DESTINATIONS) {
        app.ITINERARIES[x.id].days.forEach((_, i) => {
            const url = app.dayRouteUrl(x.id, i)
            assert.ok(url.startsWith('https://www.google.com/maps/'), `${x.id} ngày ${i + 1}: thiếu lộ trình Google Maps`)
            if (url.includes('/dir/')) {
                const waypoints = new URL(url).searchParams.get('waypoints')
                assert.ok(!waypoints || waypoints.split('|').length <= 8, `${x.id} ngày ${i + 1}: quá 8 điểm dừng`)
            }
        })
    }
    const route = new URL(app.tripRouteUrl(['ha-noi', 'hue', 'hoi-an'].map(id => app.DESTINATIONS.find(x => x.id === id))))
    assert.equal(route.searchParams.get('waypoints').split('|').length, 1)
    assert.equal(app.safeFileName('Phố cổ Hội An – 3 ngày 2 đêm'), 'pho-co-hoi-an-3-ngay-2-dem')
})

test('dự báo theo ngày đi: chỉ hỏi trong tầm 16 ngày', () => {
    const app = loadBrowserScripts(
        ['assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/components.js', 'assets/js/weather.js'],
        ['forecastWindow', 'lastForecastDate', 'todayIso'],
    )
    const now = new Date(2026, 8, 30, 10) // 30/09/2026
    assert.equal(app.todayIso(now), '2026-09-30')
    assert.equal(app.lastForecastDate(now), '2026-10-15')
    assert.deepEqual({ ...app.forecastWindow('2026-10-10', '2026-10-20', now) }, { from: '2026-10-10', to: '2026-10-15' })
    assert.deepEqual({ ...app.forecastWindow('2026-09-25', '2026-10-02', now) }, { from: '2026-09-30', to: '2026-10-02' })
    assert.equal(app.forecastWindow('2026-11-01', '2026-11-05', now), null, 'quá xa thì không gọi API')
})

test('lễ hội & sự kiện: dữ liệu hợp lệ và tra đúng theo ngày đi', () => {
    const app = loadBrowserScripts(
        ['assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/data/events.js'],
        ['DESTINATIONS', 'EVENTS', 'EVENT_TYPES', 'eventsForTrip', 'destinationEvents'],
    )
    const ids = new Set(app.DESTINATIONS.map(d => d.id))
    const pair = (v, where) => assert.ok(Array.isArray(v) && v.length === 2 && v[0] && v[1], `${where}: cần [vi, en]`)
    const seen = new Set()
    for (const e of app.EVENTS) {
        assert.ok(!seen.has(e.id), `trùng mã sự kiện ${e.id}`)
        seen.add(e.id)
        assert.ok(app.EVENT_TYPES[e.type], `${e.id}: type không hợp lệ`)
        ;['name', 'desc', 'tip'].forEach(k => pair(e[k], `${e.id}.${k}`))
        assert.ok(e.where === 'all' || (e.where.length && e.where.every(id => ids.has(id))), `${e.id}: where có điểm đến không tồn tại`)
        assert.ok(Boolean(e.dates) !== Boolean(e.months), `${e.id}: cần đúng một trong dates / months`)
        if (e.dates) {
            e.dates.forEach(md => assert.match(md, /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, `${e.id}: ngày ${md} sai định dạng MM-DD`))
            assert.ok(e.dates[0] <= e.dates[1], `${e.id}: ngày bắt đầu phải trước ngày kết thúc`)
        } else {
            assert.ok(e.months.every(m => m >= 1 && m <= 12), `${e.id}: tháng không hợp lệ`)
        }
    }
    const has = (list, id) => list.some(e => e.id === id)
    assert.ok(has(app.eventsForTrip('ha-noi', { dates: ['2027-02-06', '2027-02-07'] }), 'tet'), 'tháng 2 phải có Tết')
    assert.ok(has(app.eventsForTrip('da-lat', { dates: ['2026-04-30'] }), 'le-30-4'), '30/4 là nghỉ lễ toàn quốc')
    assert.ok(!has(app.eventsForTrip('da-lat', { dates: ['2026-05-04'] }), 'le-30-4'), '04/05 đã hết kỳ nghỉ')
    assert.ok(has(app.eventsForTrip('mu-cang-chai', { dates: ['2026-09-20'] }), 'lua-chin-tay-bac'))
    assert.ok(has(app.eventsForTrip('hoi-an', { month: 10 }), 'bao-mien-trung'), 'tháng 10 miền Trung có mưa bão')
    assert.ok(!has(app.eventsForTrip('sa-pa', { month: 10 }), 'bao-mien-trung'))
    assert.ok(app.destinationEvents('ha-noi').every(e => e.where !== 'all'), 'danh sách riêng không gồm nghỉ lễ toàn quốc')
})

test('danh sách đồ cần mang theo điểm đến và tháng', () => {
    const app = loadBrowserScripts(
        ['assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/data/packing.js'],
        ['DESTINATIONS', 'PACKING', 'PACKING_GROUPS', 'packingList'],
    )
    const get = id => app.DESTINATIONS.find(d => d.id === id)
    const ids = (dests, months) => app.packingList(dests, months).flatMap(g => g.items.map(i => i.id))
    const allItems = [...app.PACKING.base, ...app.PACKING.rules.flatMap(r => r.items)]
    allItems.forEach(item => {
        assert.ok(app.PACKING_GROUPS[item.group], `${item.id}: nhóm không hợp lệ`)
        assert.ok(Array.isArray(item.name) && item.name[0] && item.name[1], `${item.id}: cần [vi, en]`)
    })
    const sapaDec = ids([get('sa-pa')], [12])
    assert.ok(sapaDec.includes('down') && sapaDec.includes('trekshoes'), 'Sa Pa tháng 12: áo phao, giày trekking')
    assert.ok(!sapaDec.includes('swim'))
    const pqJul = ids([get('phu-quoc')], [7])
    assert.ok(['swim', 'sunscreen', 'seasick', 'raincoat', 'light'].every(id => pqJul.includes(id)), 'Phú Quốc tháng 7: đồ biển, thuốc say tàu, áo mưa')
    assert.ok(!ids([get('phu-quoc')], [1]).includes('raincoat'), 'Phú Quốc tháng 1 là mùa khô')
    const trip = ids([get('sa-pa'), get('phu-quoc')], [12, 12])
    assert.equal(new Set(trip).size, trip.length, 'không trùng món khi gộp nhiều điểm đến')
    assert.ok(trip.includes('cccd') && trip.includes('down') && trip.includes('swim'))
})

test('báo sai thông tin: link GitHub Issue điền sẵn', () => {
    const app = loadBrowserScripts(['assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/components.js'], ['reportUrl'])
    const url = new URL(app.reportUrl({ dest: 'Phố cổ Hội An', item: 'Chùa Cầu', details: 'Miễn phí' }))
    assert.equal(url.origin + url.pathname, 'https://github.com/TanTan1802/travel/issues/new')
    assert.equal(url.searchParams.get('title'), '[Sửa thông tin] Phố cổ Hội An – Chùa Cầu')
    assert.match(url.searchParams.get('body'), /Thông tin hiện tại:\*\* Miễn phí/)
})

test('chế độ Hôm nay: trạng thái chuyến đi và mốc hiện tại / kế tiếp', () => {
    const app = loadBrowserScripts(
        ['assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/components.js', 'assets/js/today.js'],
        ['tripStatus', 'currentAndNext', 'daysBetween', 'assetsInHtml'],
    )
    const plan = { stops: [{ id: 'ha-noi', days: 2 }, { id: 'hoi-an', days: 3 }], start: '2026-12-30' }
    assert.equal(app.daysBetween('2026-12-30', '2027-01-02'), 3)
    assert.equal(app.tripStatus(plan, '2026-12-20').kind, 'upcoming')
    assert.equal(app.tripStatus(plan, '2026-12-20').inDays, 10)
    const ongoing = app.tripStatus(plan, '2027-01-01')
    assert.equal(ongoing.kind, 'ongoing')
    assert.equal(ongoing.dayIndex, 2)
    assert.equal(ongoing.trip.end, '2027-01-03')
    assert.equal(app.tripStatus(plan, '2027-01-04'), null, 'chuyến đã kết thúc')
    assert.equal(app.tripStatus({ ...plan, start: '' }, '2027-01-01'), null, 'chưa có ngày khởi hành')

    const entries = [{ time: '06:30' }, { time: '07:30' }, { time: '11:30' }, { time: '13:00' }]
    const at = (h, m) => app.currentAndNext(entries, h * 60 + m)
    assert.equal(at(6, 0).current, null)
    assert.equal(at(6, 0).next.time, '06:30')
    assert.equal(at(12, 15).current.time, '11:30')
    assert.equal(at(12, 15).next.time, '13:00')
    assert.equal(at(12, 15).minutesToNext, 45)
    assert.equal(at(22, 0).next, null)

    const assets = [...app.assetsInHtml('<script src="../../assets/js/a.js"></script><img srcset="x-480.webp 480w, x-1920.webp 1920w"><a href="https://x.com/a.js">', 'http://h/diem-den/hoi-an/index.html')]
    assert.deepEqual(assets.sort(), ['http://h/assets/js/a.js', 'http://h/diem-den/hoi-an/x-480.webp'], 'bỏ ảnh 1920 và link ngoài')
})

test('hồ sơ chuyến đi: chi phí cả nhóm và trắc nghiệm gợi ý điểm đến', () => {
    const app = loadBrowserScripts(
        ['assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/components.js', 'assets/js/data/profiles.js', 'assets/js/quiz.js'],
        ['DESTINATIONS', 'TRAVEL_STYLES', 'ORIGIN_IDS', 'groupCost', 'quizRecommendation', 'distanceKm'],
    )
    assert.equal(app.groupCost(1000000, 300000, 2), 2000000, '2 người = 2 lần chi phí / người')
    assert.equal(app.groupCost(1000000, 300000, 3), 3300000, '3 người cần 2 phòng')
    assert.equal(app.groupCost(1000000, 300000, 1), 1300000, '1 người trả trọn phòng')
    app.ORIGIN_IDS.forEach(id => assert.ok(app.DESTINATIONS.some(d => d.id === id), `điểm xuất phát ${id} không tồn tại`))
    Object.entries(app.TRAVEL_STYLES).forEach(([id, st]) => {
        assert.ok(st.label[0] && st.label[1] && st.tips.length, `${id}: thiếu nhãn / gợi ý`)
        st.caution.forEach(x => assert.ok(app.DESTINATIONS.some(d => d.id === x), `${id}: caution ${x} không tồn tại`))
    })

    const get = id => app.DESTINATIONS.find(d => d.id === id)
    const beachSouthJan = app.quizRecommendation({ likes: ['bien'], month: '1', length: 'long', region: 'nam', style: 'couple', tier: 'saving' })
    assert.equal(beachSouthJan.stops.reduce((n, s) => n + s.days, 0), 9, 'chuyến 7–10 ngày ≈ 9 ngày')
    const first = get(beachSouthJan.stops[0].id)
    assert.ok(first.categories.includes('bien') && first.region === 'nam' && first.bestMonths.includes(1), `gợi ý đầu (${first.id}) phải là biển miền Nam đẹp tháng 1`)
    beachSouthJan.stops.slice(1).forEach(s => assert.ok(beachSouthJan.stops.some(o => o.id !== s.id && app.distanceKm(get(o.id), get(s.id)) <= 450), `${s.id} phải gần một điểm khác trong tuyến`))
    const family = app.quizRecommendation({ likes: ['nui'], month: '10', length: 'short', region: 'bac', style: 'family' })
    assert.equal(family.stops.length, 1)
    assert.ok(!app.TRAVEL_STYLES.family.caution.includes(family.stops[0].id), 'gia đình có trẻ nhỏ không nên gợi ý điểm nhiều đèo dốc')
})

test('dữ liệu JSON hợp lệ theo schema và file JS sinh ra khớp với JSON', () => {
    const { loadAndValidate, DATASETS } = require('../tools/build-data')
    const { data, errors } = loadAndValidate()
    assert.deepEqual(errors, [], `dữ liệu không hợp lệ:\n${errors.join('\n')}`)
    for (const [name, { vars, whole, transform }] of Object.entries(DATASETS)) {
        if (whole) {
            /* Bộ dữ liệu không bắt buộc, sinh nguyên khối (vd. ROUTES = null khi chưa có data/routes.json) */
            const value = loadBrowserScripts([`assets/js/data/${name}.js`], [whole])[whole]
            const expected = data[name] && (({ $schema, ...rest }) => rest)(data[name])
            assert.equal(JSON.stringify(value), JSON.stringify(expected || null), `assets/js/data/${name}.js lệch với data/${name}.json – chạy npm run build`)
            continue
        }
        const generated = loadBrowserScripts([`assets/js/data/${name}.js`], Object.values(vars))
        const source = transform ? transform(data[name]) : data[name]
        for (const [key, constName] of Object.entries(vars)) {
            assert.equal(JSON.stringify(generated[constName]), JSON.stringify(source[key]), `assets/js/data/${name}.js lệch với data/${name}.json – chạy npm run build`)
        }
    }
    /* Bản tiếng Anh: assets/js/data/en.js sinh từ data/i18n/en.json */
    const en = loadBrowserScripts(['assets/js/data/en.js'], ['TRANSLATION_EN']).TRANSLATION_EN
    assert.equal(JSON.stringify(en), JSON.stringify(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/i18n/en.json'), 'utf8'))), 'assets/js/data/en.js lệch với data/i18n/en.json – chạy npm run build')

    /* Schema phải bắt được lỗi thường gặp */
    const Ajv2020 = require('ajv/dist/2020')
    const ajv = new Ajv2020({ allErrors: true, strictRequired: false })
    for (const file of fs.readdirSync(path.join(ROOT, 'data/schema'))) ajv.addSchema(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/schema', file), 'utf8')))
    const sightsSchema = ajv.getSchema('sights.schema.json')
    const bad = JSON.parse(JSON.stringify(data.sights))
    bad.sights['hoi-an'][0][0].price = -5
    assert.equal(sightsSchema(bad), false, 'giá âm phải bị từ chối')
    const eventsSchema = ajv.getSchema('events.schema.json')
    const ev = JSON.parse(JSON.stringify(data.events))
    const fixed = ev.events.find(e => e.dates)
    fixed.dates = ['13-01', '13-05']
    assert.equal(eventsSchema(ev), false, 'tháng 13 phải bị từ chối')
})

test('đồng bộ Google Sheets: CSV hai chiều, chỉ cập nhật mục đã có', () => {
    const sheets = require('../tools/sheets')
    const sights = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sights.json'), 'utf8')).sights
    const places = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/places.json'), 'utf8')).places
    const csv = sheets.toCsv(sheets.SIGHT_COLUMNS, sheets.sightsToRows(sights))
    const rows = sheets.parseCsv(csv)
    assert.equal(rows.length, sheets.sightsToRows(sights).length)
    assert.equal(sheets.applySightRows(JSON.parse(JSON.stringify(sights)), rows).changes.length, 0, 'xuất rồi nhập lại không được đổi gì')

    const copy = JSON.parse(JSON.stringify(sights))
    const row = rows.find(r => r.dest_id === 'hoi-an' && r.name_vi === 'Chùa Cầu')
    const edited = [{ ...row, price_min: '30.000', price_max: '30.000đ', hours: '07:00–21:30' }, { ...row, name_vi: 'Không có thật' }]
    const result = sheets.applySightRows(copy, edited)
    const bridge = copy['hoi-an'].flat().find(s => s.name[0] === 'Chùa Cầu')
    assert.equal(bridge.price, 30000, '"30.000" và "30.000đ" → 30000')
    assert.equal(bridge.hours, '07:00–21:30')
    assert.equal(result.unknown.length, 1, 'dòng không khớp bị bỏ qua và báo lại')
    assert.equal(sheets.applySightRows(copy, [{ ...row, price_min: '50000', price_max: '10000' }]).errors.length, 1, 'giá thấp > giá cao là lỗi')

    const eatRows = sheets.parseCsv(sheets.toCsv(sheets.EAT_COLUMNS, sheets.eatsToRows(places)))
    const eat = eatRows.find(r => r.kind === 'cafe')
    const placesCopy = JSON.parse(JSON.stringify(places))
    sheets.applyEatRows(placesCopy, [{ ...eat, price_min: '20000', price_max: '45000' }])
    assert.deepEqual(placesCopy[eat.dest_id].cafes.find(c => c.name === eat.name).price, [20000, 45000])
    assert.deepEqual(sheets.parseCsv('a,b\n"x, ""y""",2\n'), [{ a: 'x, "y"', b: '2' }], 'CSV có dấu phẩy và ngoặc kép')
})

test('độ mới dữ liệu: mọi mục có tháng cập nhật; đồng bộ Sheets ghi tháng khi sửa hoặc đánh dấu đã kiểm tra', () => {
    const { staleItems, monthsBetween } = require('../tools/check-freshness')
    assert.equal(monthsBetween('2025-11', '2026-10'), 11)
    const now = staleItems()
    assert.ok(now.total > 600)
    assert.equal(now.stale.filter(x => !x.updated).length, 0, 'mục nào cũng phải có updated')
    assert.equal(staleItems('2099-01').stale.length, now.total, 'sau nhiều năm thì mọi mục đều cũ')

    const sheets = require('../tools/sheets')
    process.env.SYNC_MONTH = '2027-03'
    try {
        const sights = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/sights.json'), 'utf8')).sights
        const rows = sheets.parseCsv(sheets.toCsv(sheets.SIGHT_COLUMNS, sheets.sightsToRows(sights)))
        const pick = (data, name) => data['hoi-an'].flat().find(s => s.name[0] === name)
        const row = rows.find(r => r.dest_id === 'hoi-an' && r.name_vi === 'Chùa Cầu')
        const other = rows.find(r => r.dest_id === 'hoi-an' && r.name_vi !== 'Chùa Cầu')

        const unchanged = JSON.parse(JSON.stringify(sights))
        sheets.applySightRows(unchanged, [row])
        assert.equal(pick(unchanged, 'Chùa Cầu').updated, '2026-09', 'không đổi gì, không đánh dấu → giữ tháng cũ')

        const edited = JSON.parse(JSON.stringify(sights))
        const result = sheets.applySightRows(edited, [{ ...row, price_min: '99000', price_max: '99000' }, { ...other, confirmed: 'x' }])
        assert.equal(pick(edited, 'Chùa Cầu').updated, '2027-03', 'sửa giá → ghi tháng cập nhật')
        assert.equal(pick(edited, other.name_vi).updated, '2027-03', 'ghi "x" ở cột confirmed → ghi tháng đã kiểm tra')
        assert.ok(result.changes.some(c => c.includes('đã kiểm tra lại')))
    } finally {
        delete process.env.SYNC_MONTH
    }
})

test('bản dịch tiếng Anh đầy đủ và khớp vị trí với dữ liệu gốc', () => {
    for (const d of DESTINATIONS) {
        const e = EN.destinations[d.id]
        assert.ok(e, `${d.id} chưa có bản dịch`)
        for (const key of ['name', 'province', 'tagline', 'description', 'bestTime', 'duration']) assert.ok(e[key], `${d.id}: thiếu bản dịch ${key}`)
        for (const key of ['highlights', 'gallery', 'foods', 'activities', 'tips']) {
            assert.equal(e[key].length, d[key].length, `${d.id}: số phần tử ${key} lệch (en ${e[key].length} / vi ${d[key].length})`)
        }
        d.foods.forEach((f, i) => {
            if (f.illustrative) assert.ok(e.foods[i].illustrative, `${d.id}: món ${f.name} thiếu bản dịch "ảnh minh họa"`)
        })
        const plan = EN.itineraries[d.id]
        assert.ok(plan, `${d.id}: thiếu bản dịch lịch trình`)
        assert.equal(plan.days.length, ITINERARIES[d.id].days.length, `${d.id}: số ngày lịch trình tiếng Anh lệch`)
    }
})

test('mọi chuỗi t(...) trong mã nguồn đều có bản dịch tiếng Anh', () => {
    const keys = new Set()
    for (const file of fs.readdirSync(path.join(ROOT, 'assets/js'))) {
        if (!file.endsWith('.js') || file.endsWith('.min.js')) continue
        const code = fs.readFileSync(path.join(ROOT, 'assets/js', file), 'utf8')
        for (const m of code.matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g)) keys.add(m[1].replace(/\\'/g, "'"))
    }
    keys.delete('Chuỗi tiếng Việt') // ví dụ trong chú thích
    const missing = [...keys].filter(k => !EN.ui[k])
    assert.deepEqual(missing, [], `thiếu bản dịch: ${missing.join(' | ')}`)
})

test('ảnh trong repo: mọi file trong manifest đều tồn tại', () => {
    const missing = []
    for (const [file, entry] of Object.entries(site.LOCAL_IMAGES || {})) {
        for (const key of ['xs', 'sm', 'lg']) {
            if (entry[key] && !fs.existsSync(path.join(ROOT, entry[key]))) missing.push(`${file} (${key})`)
        }
    }
    assert.deepEqual(missing, [], `thiếu file ảnh: ${missing.join(', ')}`)

    /* Ảnh mới chưa được workflow tải về: chỉ cảnh báo (site vẫn dùng ảnh Wikimedia) */
    const used = new Set()
    DESTINATIONS.forEach(d => [d.hero, ...d.gallery.map(g => g.file), ...d.foods.flatMap(f => [].concat(f.file || []))].filter(Boolean).forEach(f => used.add(f)))
    const notLocal = [...used].filter(f => !site.LOCAL_IMAGES[f])
    if (notLocal.length) console.log(`  ⚠️  ${notLocal.length} ảnh chưa tải về repo (workflow sẽ tải sau khi merge): ${notLocal.join(', ')}`)
})

test('trang tĩnh đã được build cho mọi điểm đến ở mọi ngôn ngữ', () => {
    for (const d of DESTINATIONS) {
        for (const rel of LANG_PREFIXES.map(p => `${p}diem-den/${d.id}/index.html`)) {
            assert.ok(fs.existsSync(path.join(ROOT, rel)), `chưa build ${rel} – chạy npm run build`)
        }
    }
    const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8')
    DESTINATIONS.forEach(d => LANG_PREFIXES.forEach(p => assert.ok(sitemap.includes(`${SITE_URL}${p}diem-den/${d.id}/`), `sitemap thiếu ${p}${d.id}`)))
})

test('bản dịch ko/zh/ja: đủ điểm đến + giao diện, trang build đúng ngôn ngữ, menu ngôn ngữ trỏ đúng trang', () => {
    const { loadAndValidate, loadTranslations } = require('../tools/build-data')
    const { translations, errors } = loadTranslations(loadAndValidate().data)
    assert.deepEqual(errors, [])
    assert.deepEqual(Object.keys(translations).sort(), ['ja', 'ko', 'zh'])
    const htmlLang = { ko: 'ko', zh: 'zh-Hans', ja: 'ja' }
    for (const [lang, tr] of Object.entries(translations)) {
        const untranslated = Object.keys(EN.ui).filter(k => !tr.ui[k])
        assert.deepEqual(untranslated, [], `${lang}: chưa dịch ${untranslated.slice(0, 5).join(' | ')}`)
        DESTINATIONS.forEach(d => {
            assert.ok(tr.destinations[d.id] && tr.destinations[d.id].name, `${lang}: thiếu ${d.id}`)
            for (const key of ['gallery', 'foods', 'activities', 'tips']) {
                assert.equal((tr.destinations[d.id][key] || []).length, d[key].length, `${lang}: ${d.id}.${key} chưa dịch đủ`)
            }
            assert.equal(tr.itineraries[d.id].days.length, ITINERARIES[d.id].days.length, `${lang}: số ngày lịch trình ${d.id} lệch`)
        })
        const html = fs.readFileSync(path.join(ROOT, `${lang}/diem-den/hue/index.html`), 'utf8')
        assert.ok(html.includes(`<html lang="${htmlLang[lang]}">`), `${lang}: thuộc tính lang`)
        assert.ok(html.includes(`assets/js/data/i18n/${lang}.js`) || /assets\/js\/dist\//.test(html), `${lang}: thiếu script bản dịch`)
        assert.ok(html.includes(tr.destinations.hue.name), `${lang}: tên điểm đến chưa dịch`)
        const menu = html.match(/<details class="nav__lang"[\s\S]*?<\/details>/)[0]
        LANG_PREFIXES.forEach(p => assert.ok(menu.includes(`../../../${p}diem-den/hue/index.html`), `${lang}: menu thiếu ${p || 'vi'}`))
        assert.match(html, new RegExp(`hreflang="${htmlLang[lang]}" href="${siteRe}${lang}/diem-den/hue/"`))
    }
})

test('gói deploy dist/: chỉ file cần đăng, đổi địa chỉ site, có _headers và 404.html', () => {
    const { buildDist, SOURCE_URL } = require('../tools/dist')
    const os = require('os')
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-'))
    try {
        buildDist(out, 'https://vd.pages.dev')
        for (const rel of ['index.html', 'en/index.html', 'ko/diem-den/hue/index.html', 'destination.html', 'sw.js', '_headers', '404.html', 'sitemap.xml']) {
            assert.ok(fs.existsSync(path.join(out, rel)), `dist thiếu ${rel}`)
        }
        for (const rel of ['tools', 'tests', 'data', 'worker', 'node_modules', 'package.json', 'home.html']) {
            assert.ok(!fs.existsSync(path.join(out, rel)), `dist không được chứa ${rel}`)
        }
        const sitemap = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8')
        assert.ok(sitemap.includes('https://vd.pages.dev/diem-den/hue/') && !sitemap.includes(SOURCE_URL), 'sitemap phải dùng địa chỉ mới')
        assert.match(fs.readFileSync(path.join(out, 'diem-den/hue/index.html'), 'utf8'), /rel="canonical" href="https:\/\/vd\.pages\.dev\/diem-den\/hue\/"/)
        assert.throws(() => buildDist(out, 'http://khong-https'), /SITE_URL/)
    } finally {
        fs.rmSync(out, { recursive: true, force: true })
    }
})

test('không có liên kết nội bộ hỏng trong các trang đã build', () => {
    const broken = []
    for (const page of builtPages()) {
        const html = fs.readFileSync(path.join(ROOT, page), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '')
        for (const [, url] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
            if (/^(https?:|#|mailto:|data:|tel:)/.test(url) || url === '') continue
            const target = path.join(ROOT, path.dirname(page), url.split(/[?#]/)[0])
            const file = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, 'index.html') : target
            if (!fs.existsSync(file)) broken.push(`${page} → ${url}`)
        }
    }
    assert.deepEqual([...new Set(broken)], [], `liên kết hỏng:\n${[...new Set(broken)].join('\n')}`)
})

test('file mà trang đã build dùng tới không bị .gitignore bỏ qua (nếu không sẽ thiếu trên web)', t => {
    if (!fs.existsSync(path.join(ROOT, '.git'))) return t.skip('không phải git repo')
    const files = new Set()
    for (const page of builtPages()) {
        const html = fs.readFileSync(path.join(ROOT, page), 'utf8')
        for (const [, url] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
            if (/^(https?:|#|mailto:|data:|tel:)/.test(url) || url === '') continue
            const file = path.relative(ROOT, path.join(ROOT, path.dirname(page), url.split(/[?#]/)[0]))
            if (path.extname(file)) files.add(file)
        }
    }
    const { spawnSync } = require('child_process')
    const res = spawnSync('git', ['check-ignore', '--stdin'], { cwd: ROOT, input: [...files].join('\n'), encoding: 'utf8' })
    const ignored = res.stdout.split('\n').filter(Boolean)
    assert.deepEqual(ignored, [], `file bị .gitignore bỏ qua nên không được commit:\n${ignored.join('\n')}`)
})

test('mọi icon dùng trong mã đều có trong bộ icon rút gọn (npm run icons)', () => {
    const { usedIcons, remixCodepoints, CSS_OUT } = require('../tools/build-icons')
    const codepoints = remixCodepoints()
    const used = usedIcons()
    const unknown = used.filter(name => !codepoints.has(name))
    assert.deepEqual(unknown, [], `icon không có trong Remix Icon 2.5.0: ${unknown.join(', ')}`)
    const css = fs.readFileSync(path.join(ROOT, CSS_OUT), 'utf8')
    const missing = used.filter(name => !css.includes(`.${name}:before`))
    assert.deepEqual(missing, [], `thiếu icon ${missing.join(', ')} – chạy npm run icons`)
    assert.ok(fs.existsSync(path.join(ROOT, 'assets/fonts/remixicon.woff2')), 'thiếu font icon – chạy npm run icons')
})

test('trang khám phá: giá vé từng điểm đến, 12 tháng, chủ đề – có trong sitemap, JSON-LD hợp lệ', () => {
    const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8')
    const rels = [
        ...DESTINATIONS.flatMap(d => [`diem-den/${d.id}/gia-ve/`, `en/diem-den/${d.id}/gia-ve/`]),
        ...Array.from({ length: 12 }, (_, i) => [`thang/${i + 1}/`, `en/thang/${i + 1}/`]).flat(),
        ...['bien', 'nui', 'di-san', 'thanh-pho', 'hang-dong', 'mien-bac', 'mien-trung', 'mien-nam'].flatMap(s => [`chu-de/${s}/`, `en/chu-de/${s}/`]),
    ]
    for (const rel of rels) {
        assert.ok(sitemap.includes(`${SITE_URL}${rel}<`), `sitemap thiếu ${rel}`)
        const html = fs.readFileSync(path.join(ROOT, rel, 'index.html'), 'utf8')
        const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]))
        const graph = blocks.flatMap(b => b['@graph'] || [b])
        assert.ok(graph.some(n => n['@type'] === 'BreadcrumbList'), `${rel} thiếu BreadcrumbList`)
        assert.ok(graph.some(n => n['@type'] === 'ItemList' && n.itemListElement.length), `${rel} thiếu ItemList`)
        assert.match(html, new RegExp(`<link rel="canonical" href="${siteRe}`))
    }
    /* Mỗi điểm tham quan có anchor riêng trên trang giá vé */
    const hue = fs.readFileSync(path.join(ROOT, 'diem-den/hue/gia-ve/index.html'), 'utf8')
    assert.ok(hue.includes('id="dai-noi-hue-ngo-mon-tu-cam-thanh"'))
})

test('lập kế hoạch: quãng đường bộ thật (ROUTES), nhiều phương tiện (bay / tàu hỏa / xe / tàu ra đảo), chọn phương tiện từng chặng', () => {
    const vm = require('vm')
    const noop = () => {}
    const files = ['assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/core.js', 'assets/js/data/itineraries.js', 'assets/js/data/places.js',
        'assets/js/data/sights.js', 'assets/js/data/events.js', 'assets/js/data/packing.js', 'assets/js/data/profiles.js', 'assets/js/favorites.js',
        'assets/js/components.js', 'assets/js/planner.js']
    const run = routes => {
        const ctx = {
            window: { addEventListener: noop }, URLSearchParams, URL, navigator: {},
            document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, documentElement: { lang: 'vi' } },
            localStorage: { getItem: () => null, setItem: noop }, location: { search: '', href: 'http://x/' },
        }
        vm.runInNewContext(`const ROUTES = ${JSON.stringify(routes)};\n${files.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n')}
            ;this.leg = (a, b) => legInfo(getDestination(a), getDestination(b), 'saving')
            ;this.options = (a, b) => transportOptions(getDestination(a), getDestination(b), 'saving')
            ;this.totals = plan => planTotals(plan)
            ;this.toQuery = plan => planToQuery(plan)
            ;this.fromQuery = q => planFromQuery(q)
            ;this.links = stayLinks('Hue', '', '2026-11-10', 2, 5)`, ctx)
        return ctx
    }
    const estimated = run(null)
    const guess = estimated.leg('hue', 'hoi-an')
    assert.equal(guess.mode, 'road')
    assert.ok(guess.km > 100 && guess.km < 200)

    const measured = run({ ids: ['hue', 'hoi-an', 'ha-noi'], km: [[0, 125, 660], [125, 0, 780], [660, 780, 0]], hours: [[0, 2.5, 11], [2.5, 0, 13], [11, 13, 0]] })
    const leg = measured.leg('hue', 'hoi-an')
    assert.equal(leg.km, 125, 'quãng đường lấy từ ROUTES')
    assert.equal(leg.hours, 3, '2,5 giờ lái xe × 1,25 (xe khách) ≈ 3 giờ')
    assert.equal(measured.leg('hue', 'ha-noi').mode, 'flight', 'trên 450 km đường bộ → gợi ý bay')

    /* Nhiều phương tiện: tàu hỏa theo km lý trình, tàu cao tốc ra đảo, đảo không có đường bộ */
    const opts = (a, b) => measured.options(a, b)
    const hnDn = opts('ha-noi', 'da-nang')
    assert.deepEqual([...hnDn.options.map(o => o.mode)].sort(), ['flight', 'road', 'train'], 'Hà Nội – Đà Nẵng: bay, tàu, xe')
    assert.equal(hnDn.recommended, 'flight')
    const train = hnDn.options.find(o => o.mode === 'train')
    assert.equal(train.km, 791, 'km lý trình Hà Nội – Đà Nẵng')
    assert.ok(train.hours >= 15 && train.hours <= 17, `tàu Hà Nội – Đà Nẵng ~16 giờ (${train.hours})`)
    assert.ok(train.cost < hnDn.options.find(o => o.mode === 'flight').cost, 'vé tàu rẻ hơn vé bay')
    assert.ok(opts('hue', 'da-nang').options.some(o => o.mode === 'train'), 'Huế – Đà Nẵng có tàu qua đèo Hải Vân')
    assert.ok(opts('ha-noi', 'sa-pa').options.some(o => o.mode === 'train' && o.stations[1] === 'Lào Cai'), 'Hà Nội – Sa Pa: tàu tới ga Lào Cai')
    assert.ok(!opts('hue', 'sa-pa').options.some(o => o.mode === 'train'), 'khác tuyến thì không gợi ý tàu thẳng')
    assert.ok(!opts('hue', 'da-nang').options.some(o => o.mode === 'flight'), 'quá gần thì không có chuyến bay')
    const island = opts('ha-tien', 'phu-quoc')
    assert.equal(island.recommended, 'boat')
    assert.ok(!island.options.some(o => o.mode === 'road'), 'không đi đường bộ ra đảo')
    assert.deepEqual([...opts('phu-quoc', 'con-dao').options.map(o => o.mode)], ['flight'], 'đảo – đảo chỉ có máy bay')
    assert.equal(opts('ha-noi', 'cat-ba').recommended, 'boat', 'Cát Bà: xe + tàu cao tốc')

    /* Chọn phương tiện cho từng chặng: lưu trong plan.modes, chia sẻ qua URL (t=...) */
    const plan = { stops: [{ id: 'hue', days: 2 }, { id: 'da-nang', days: 2 }], tier: 'saving', origin: 'ha-noi', modes: {} }
    const before = measured.totals(plan)
    assert.equal(before.legs[0].mode, 'road')
    assert.equal(before.outbound.mode, 'flight')
    const chosen = { ...plan, modes: { 'hue>da-nang': 'train', 'ha-noi>hue': 'train' } }
    const after = measured.totals(chosen)
    assert.equal(after.legs[0].mode, 'train')
    assert.equal(after.outbound.mode, 'train')
    assert.ok(after.total < before.total, 'đi tàu thay máy bay rẻ hơn')
    const query = measured.toQuery(chosen)
    assert.match(query, /t=hue\.da-nang\.t,ha-noi\.hue\.t|t=ha-noi\.hue\.t,hue\.da-nang\.t/)
    assert.deepEqual({ ...measured.fromQuery(query).modes }, chosen.modes)

    /* Link đặt phòng theo số người: 5 người → 3 phòng */
    const booking = new URL(measured.links.find(l => l.label === 'Booking.com').url)
    assert.equal(booking.searchParams.get('group_adults'), '5')
    assert.equal(booking.searchParams.get('no_rooms'), '3')
})

test('trang lập kế hoạch: gói JS không chứa dữ liệu mọi điểm đến, dữ liệu từng điểm tải riêng (data/plan/<lang>/<id>.json)', () => {
    const langs = ['vi', 'en', 'ko', 'zh', 'ja']
    for (const lang of langs) {
        const rel = `${lang === 'vi' ? '' : `${lang}/`}ke-hoach/index.html`
        const html = fs.readFileSync(path.join(ROOT, rel), 'utf8')
        assert.match(html, new RegExp(`window.PLAN_DATA = '[./]*assets/js/data/plan/${lang}/'`), `${rel}: thiếu PLAN_DATA`)
        const bundles = [...html.matchAll(/src="[./]*(assets\/js\/dist\/[0-9a-f]+\.js)"/g)].map(m => fs.readFileSync(path.join(ROOT, m[1]), 'utf8')).join('\n')
        assert.ok(!bundles.includes(PLACES_SAMPLE), `${rel}: gói JS vẫn chứa quán ăn của mọi điểm đến`)
        for (const d of DESTINATIONS) {
            const file = path.join(ROOT, `assets/js/data/plan/${lang}/${d.id}.json`)
            const data = JSON.parse(fs.readFileSync(file, 'utf8'))
            assert.ok(data.places.eats.length && data.sights.length === 5 && data.itinerary.days.length === 5, `${lang}/${d.id}.json thiếu dữ liệu`)
            if (lang !== 'vi') assert.equal(typeof data.places.eats[0].dish, 'string', `${lang}/${d.id}.json: dữ liệu phải một ngôn ngữ`)
        }
    }
})

test('không file nào còn sót dấu xung đột merge; sw.js và trang quản trị là JS hợp lệ', () => {
    const files = require('child_process').execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
        .split('\n').filter(f => /\.(js|json|html|css|xml|txt|md|yml)$/.test(f) && fs.existsSync(path.join(ROOT, f)))
    for (const f of files) {
        const text = fs.readFileSync(path.join(ROOT, f), 'utf8')
        assert.doesNotMatch(text, /^(<<<<<<< |>>>>>>> )/m, `${f}: còn dấu xung đột merge`)
    }
    const vm = require('vm')
    for (const f of ['sw.js', 'admin/admin.js']) {
        assert.doesNotThrow(() => new vm.Script(fs.readFileSync(path.join(ROOT, f), 'utf8'), { filename: f }), `${f}: lỗi cú pháp`)
    }
    assert.match(fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8'), /Disallow: \/admin\//, 'robots.txt phải chặn /admin/')
})

test('giao diện & mùa: màu đủ tương phản, chọn mùa theo ngày, trang chủ lấy slogan từ data/site.json, mọi trang có script mùa', () => {
    const { contrastIssues, seasonActive, sloganHtml, pickText } = require('../tools/theme')
    const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/site.json'), 'utf8'))
    for (const theme of [site.theme, ...site.seasons.filter(s => s.theme).map(s => s.theme)]) assert.deepEqual(contrastIssues(theme), [])
    assert.ok(contrastIssues({ hue: 190, accentHue: 60 }).length > 0, 'màu nhấn vàng chanh phải bị chặn')

    const wrap = { from: '12-20', to: '01-05' }
    assert.ok(seasonActive(wrap, '2026-12-25') && seasonActive(wrap, '2027-01-03') && !seasonActive(wrap, '2027-01-06'))
    const once = { from: '2027-01-25', to: '2027-02-14' }
    assert.ok(seasonActive(once, '2027-02-01') && !seasonActive(once, '2028-02-01'))
    assert.equal(sloganHtml('Khám Phá\nDanh Thắng *Tuyệt Đẹp\nCủa Việt Nam*'), 'Khám Phá <br> Danh Thắng <b>Tuyệt Đẹp <br> Của Việt Nam</b>')
    assert.equal(sloganHtml('<script>'), '&lt;script&gt;')

    for (const [lang, prefix] of [['vi', ''], ['en', 'en/'], ['ko', 'ko/'], ['zh', 'zh/'], ['ja', 'ja/']]) {
        const html = fs.readFileSync(path.join(ROOT, `${prefix}index.html`), 'utf8')
        assert.ok(html.includes(`<h1 class="home__data-title">${sloganHtml(pickText(site.hero.title, lang))}</h1>`), `${prefix}index.html: slogan`)
        assert.match(html, /<!-- build:season --><script>window\.HOME_FEATURED=/, `${prefix}index.html: thiếu dữ liệu mùa`)
    }
    for (const rel of builtPages()) {
        const html = fs.readFileSync(path.join(ROOT, rel), 'utf8')
        if (site.seasons.length) assert.ok(html.includes("--hue-color',s.h)") && html.includes(`"i":"${site.seasons[0].id}"`), `${rel}: thiếu script màu theo mùa`)
        else assert.ok(html.includes("classList.add('dark-theme')"), `${rel}: thiếu script chế độ tối`)
    }
})
