/*
 * Test dữ liệu & trang tĩnh (không cần trình duyệt).   Chạy:  npm run test:data
 */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const { loadBrowserScripts } = require('../tools/lib')
const { ROOT, builtPages } = require('./helpers')

const site = loadBrowserScripts(
    ['assets/js/data/local-images.js', 'assets/js/data/en.js', 'assets/js/data/destinations.js', 'assets/js/data/itineraries.js', 'assets/js/data/places.js', 'assets/js/data/sights.js'],
    ['LOCAL_IMAGES', 'TRANSLATION_EN', 'DESTINATIONS', 'ITINERARIES', 'REGIONS', 'CATEGORIES', 'TOUR_LENGTHS', 'PLACES', 'STAY_TYPES', 'SIGHTS'],
)
const { DESTINATIONS, ITINERARIES, TRANSLATION_EN: EN, REGIONS, CATEGORIES } = site

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
        ['assets/js/data/local-images.js', 'assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/data/itineraries.js',
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
        ['assets/js/data/local-images.js', 'assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/data/itineraries.js',
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
        ['assets/js/data/local-images.js', 'assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/data/itineraries.js',
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
        ['assets/js/data/local-images.js', 'assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/data/itineraries.js',
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
        ['assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/components.js', 'assets/js/weather.js'],
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
        ['assets/js/data/destinations.js', 'assets/js/data/events.js'],
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
        ['assets/js/data/destinations.js', 'assets/js/data/packing.js'],
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
    const app = loadBrowserScripts(['assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/components.js'], ['reportUrl'])
    const url = new URL(app.reportUrl({ dest: 'Phố cổ Hội An', item: 'Chùa Cầu', details: 'Miễn phí' }))
    assert.equal(url.origin + url.pathname, 'https://github.com/TanTan1802/travel/issues/new')
    assert.equal(url.searchParams.get('title'), '[Sửa thông tin] Phố cổ Hội An – Chùa Cầu')
    assert.match(url.searchParams.get('body'), /Thông tin hiện tại:\*\* Miễn phí/)
})

test('chế độ Hôm nay: trạng thái chuyến đi và mốc hiện tại / kế tiếp', () => {
    const app = loadBrowserScripts(
        ['assets/js/i18n.js', 'assets/js/data/destinations.js', 'assets/js/components.js', 'assets/js/today.js'],
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

test('trang tĩnh đã được build cho mọi điểm đến ở cả hai ngôn ngữ', () => {
    for (const d of DESTINATIONS) {
        for (const rel of [`diem-den/${d.id}/index.html`, `en/diem-den/${d.id}/index.html`]) {
            assert.ok(fs.existsSync(path.join(ROOT, rel)), `chưa build ${rel} – chạy npm run build`)
        }
    }
    const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8')
    DESTINATIONS.forEach(d => assert.ok(sitemap.includes(`/diem-den/${d.id}/`), `sitemap thiếu ${d.id}`))
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
