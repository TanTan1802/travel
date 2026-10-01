/*
 * Test giao diện bằng trình duyệt thật (Playwright + Chromium).   Chạy:  npm run test:e2e
 * Lần đầu cần cài trình duyệt:  npx playwright install chromium
 */
const test = require('node:test')
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const { startServer, setupRoutes, builtPages } = require('./helpers')

let server, browser

test.before(async () => {
    server = await startServer()
    /* CHROMIUM_PATH: dùng Chromium có sẵn trên máy thay vì bản Playwright tải về */
    browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
})

test.after(async () => {
    await browser?.close()
    await server?.close()
})

/* Trang mới với tài nguyên ngoài đã được giả lập; trả về trang + danh sách lỗi thu được */
async function openPage(url, { viewport = { width: 1280, height: 900 }, geolocation = null } = {}) {
    const context = await browser.newContext({ viewport, serviceWorkers: 'block', ...(geolocation ? { geolocation, permissions: ['geolocation'] } : {}) })
    await setupRoutes(context)
    /* grantPermissions thay thế quyền của origin nên phải kèm cả geolocation nếu cần */
    await context.grantPermissions(['clipboard-read', 'clipboard-write', ...(geolocation ? ['geolocation'] : [])], { origin: server.url.replace(/\/$/, '') })
    /* Ghi nhận lệnh in thay vì mở hộp thoại in */
    await context.addInitScript(() => {
        window.print = () => { window.__printed = { count: (window.__printed?.count || 0) + 1, bodyClass: document.body.className } }
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(`JS: ${e.message}`))
    page.on('response', r => {
        if (r.status() >= 400 && r.url().startsWith(server.url)) errors.push(`${r.status()} ${r.url().replace(server.url, '/')}`)
    })
    await page.goto(server.url + url)
    return { page, errors, close: () => context.close() }
}

test('mọi trang tải không có lỗi JS và không thiếu tài nguyên nội bộ', async () => {
    const problems = []
    for (const rel of builtPages()) {
        const { page, errors, close } = await openPage(rel)
        await page.waitForLoadState('networkidle')
        if (errors.length) problems.push(`${rel}: ${errors.join('; ')}`)
        await close()
    }
    assert.deepEqual(problems, [])
})

test('trang chủ: tìm kiếm, lọc vùng miền, lọc tháng, yêu thích', async () => {
    const { page, errors, close } = await openPage('index.html')
    /* Số kết quả sau lọc (lưới chỉ hiện từng trang 8 thẻ để trang không quá dài) */
    const count = async () => Number(await page.$eval('#dest-grid', g => g.dataset.results))
    const cards = async () => page.$$eval('#dest-grid .dest-card', a => a.length)
    const total = await count()
    assert.ok(total >= 20, `chỉ có ${total} điểm đến`)
    assert.equal(await cards(), 8, 'ban đầu chỉ hiện 8 thẻ')
    await page.click('#explore-more')
    assert.equal(await cards(), 16, 'bấm xem thêm phải hiện thêm 8 thẻ')
    await page.click('#explore-all')
    assert.equal(await cards(), total, 'xem tất cả phải hiện đủ')
    assert.ok(await page.isHidden('#explore-more-wrap'), 'hết thẻ thì ẩn nút xem thêm')

    /* Điểm đến nổi bật: thanh cuộn ngang thay Swiper */
    assert.equal(await page.evaluate(() => typeof Swiper), 'undefined', 'không còn tải Swiper')
    assert.ok(await page.$$eval('#discover-list .discover__card', a => a.length) >= 5)

    /* Đi đâu tháng này: thẻ điểm đến đúng mùa, bấm "xem tất cả" thì lọc theo tháng hiện tại */
    assert.equal(await page.$('video'), null, 'trang chủ không còn video mẫu')
    const month = new Date().getMonth() + 1
    assert.ok(await page.$$eval('#season-list .dest-card', a => a.length) >= 1, 'cần gợi ý điểm đến theo tháng')
    assert.equal(await page.isVisible('#season-events'), await page.evaluate(() => EVENTS.some(e => e.where !== 'all' && e.months?.length !== 12 && eventInMonth(e, new Date().getMonth() + 1))))
    await page.click('#season-more')
    assert.equal(await page.$eval('#month-filter', s => s.value), String(month))
    assert.ok((await count()) < total, 'bấm xem tất cả phải lọc theo tháng')
    await page.selectOption('#month-filter', '0')

    await page.fill('#explore-search', 'phở')
    assert.ok((await count()) >= 1 && (await count()) < total, 'tìm "phở" phải thu hẹp kết quả')
    await page.fill('#explore-search', 'xyzkhongtontai')
    assert.ok(await page.isVisible('#explore-empty'), 'phải hiện thông báo không có kết quả')
    await page.fill('#explore-search', '')

    await page.click('#region-filters .chip[data-value="nam"]')
    const south = await page.$$eval('#dest-grid .dest-card__region', a => a.map(x => x.textContent.trim()))
    assert.ok(south.length && south.every(r => r === 'Miền Nam'), 'lọc Miền Nam sai')
    assert.ok(await page.isVisible('#filter-reset'), 'phải hiện nút xóa bộ lọc khi đang lọc')
    await page.click('#filter-reset')
    assert.equal(await count(), total, 'xóa bộ lọc phải hiện lại tất cả')
    assert.ok(await page.isHidden('#filter-reset'))

    await page.selectOption('#month-filter', '10')
    const oct = await count()
    assert.ok(oct > 0 && oct < total, 'lọc tháng 10 phải thu hẹp kết quả')
    await page.selectOption('#month-filter', '0')

    await page.fill('#explore-search', 'Hội An')
    await page.click('#dest-grid .fav-btn[data-favorite="hoi-an"]')
    await page.fill('#explore-search', '')
    assert.equal(await page.textContent('#fav-count'), '1')
    await page.click('#fav-filter')
    assert.equal(await count(), 1, 'bộ lọc yêu thích phải chỉ còn 1 thẻ')

    assert.deepEqual(errors, [])
    await close()
})

test('trang điểm đến: chọn tour, chuyển ngày, xem tất cả, chọn tháng, lightbox', async () => {
    const { page, errors, close } = await openPage('diem-den/hoi-an/index.html')
    /* Tour 3/4/5 ngày dùng chung một khối: chỉ tính các ngày thuộc tour đang chọn */
    const visiblePanels = () => page.$$eval('.tour:not([hidden]) .itinerary__panel:not(.itinerary__panel--off)', a => a.map(p => (p.hidden ? 0 : 1)).join(''))

    assert.equal(await page.$$eval('.tour-picker__btn', a => a.length), 3, 'cần 3 lựa chọn tour')
    assert.ok(await page.$$eval('.eat', a => a.length) >= 3, 'cần danh sách quán nên ghé')
    assert.equal(await page.$$eval('#stay .stay-card', a => a.length), 3, 'cần 3 gợi ý khu lưu trú')
    assert.match(await page.getAttribute('#stay .book-link', 'href'), /booking\.com.*Hoi\+An/)

    /* Chi phí: mặc định hiện chi tiết mức tiết kiệm, bấm để xem mức thoải mái */
    const budget = '.tour:not([hidden]) .budget:not([hidden])'
    assert.ok(await page.isVisible(`${budget} [data-budget-detail="saving"]`), 'phải xem được chi tiết mức tiết kiệm')
    assert.equal(await page.$$eval(`${budget} [data-budget-detail="saving"] .cost-item`, a => a.length), 4)
    await page.click(`${budget} [data-budget-tier="comfort"]`)
    assert.ok(await page.isVisible(`${budget} [data-budget-detail="comfort"]`))
    assert.ok(await page.isHidden(`${budget} [data-budget-detail="saving"]`))
    assert.equal(await visiblePanels(), '100')

    await page.click('.tour-picker__btn[data-tour="5"]')
    assert.equal(await page.$eval('.tour:not([hidden])', t => t.dataset.tour), '5')
    await page.click('.tour:not([hidden]) .itinerary__tab[data-day="4"]')
    assert.equal(await visiblePanels(), '00001')
    const lastDay = '.tour:not([hidden]) .itinerary__panel:not([hidden])'
    assert.match(await page.textContent(`${lastDay} .day-tl__item:last-child`), /Kết thúc tour/, 'ngày cuối phải có mục kết thúc tour')
    assert.equal(await page.$$eval('.tour:not([hidden]) .budget:not([hidden])', a => a.map(b => b.dataset.tourLen).join()), '5', 'chỉ hiện chi phí tour đang chọn')

    /* Tour 3 ngày: ngày 3 kết thúc tour, ngày 4–5 bị ẩn; quay lại tour 5 ngày thì ngày 3 là "Về nghỉ" */
    await page.click('.tour-picker__btn[data-tour="3"]')
    assert.equal(await visiblePanels(), '100', 'đang ở ngày 5 → về ngày 1 khi đổi sang tour 3 ngày')
    assert.ok(await page.isHidden('.tour:not([hidden]) .itinerary__tab[data-day="3"]'))
    await page.click('.tour:not([hidden]) .itinerary__tab[data-day="2"]')
    const endOfDay = `${lastDay} .day-tl__item:not([hidden])`
    assert.match(await page.$$eval(endOfDay, a => a.at(-1).textContent), /Kết thúc tour/)
    await page.click('.tour-picker__btn[data-tour="5"]')
    assert.match(await page.$$eval(endOfDay, a => a.at(-1).textContent), /Về nghỉ/)
    await page.click('.tour:not([hidden]) .itinerary__tab[data-day="4"]')
    assert.ok(await page.$$eval(`${lastDay} .day-tl__item`, a => a.length) >= 8, 'mỗi ngày cần timeline chi tiết')
    assert.ok(await page.$$eval(`${lastDay} .day-tl__item--cafe, ${lastDay} .day-tl__item--drink`, a => a.length) >= 1, 'timeline cần quán cà phê / quán nước')
    assert.ok(await page.$$eval(`${lastDay} .sight`, a => a.length) >= 1, 'buổi tham quan cần thẻ điểm cụ thể')
    assert.match(await page.textContent(`${lastDay} .sight__price`), /\d|Miễn phí/, 'điểm tham quan cần giá vé')
    assert.ok(await page.$(`${lastDay} .day-cost`), 'mỗi ngày cần ước tính chi phí')

    /* Mỗi ngày có lộ trình Google Maps; chọn ngày khởi hành → ngày, dự báo, Google Calendar, file .ics */
    assert.match(await page.getAttribute(`${lastDay} .day-tools__link[href*="google.com/maps"]`, 'href'), /maps\/(dir|search)\//)
    await page.fill('#tour-start', await page.evaluate(() => addDays(todayIso(), 2)))
    await page.waitForSelector(`${lastDay} .forecast-chip strong`)
    assert.match(await page.textContent(`${lastDay} .day-tools__date`), /\d+\/\d+\/\d{4}/)
    const gcal = new URL(await page.getAttribute(`${lastDay} [data-gcal]`, 'href'))
    assert.equal(gcal.hostname, 'calendar.google.com')
    assert.match(gcal.searchParams.get('dates'), /^\d{8}\/\d{8}$/)
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click('.tour:not([hidden]) [data-tour-action="ics"]'),
    ])
    assert.match(download.suggestedFilename(), /^pho-co-hoi-an-5-ngay-4-dem-\d{4}-\d{2}-\d{2}\.ics$/)
    const ics = require('fs').readFileSync(await download.path(), 'utf8')
    assert.ok(ics.startsWith('BEGIN:VCALENDAR') && ics.includes('BEGIN:VEVENT') && ics.trim().endsWith('END:VCALENDAR'))
    assert.ok(ics.split('BEGIN:VEVENT').length - 1 >= 5 * 7, 'tour 5 ngày phải có đủ các mốc timeline')

    await page.click('.tour:not([hidden]) .tour__expand')
    assert.equal(await visiblePanels(), '11111')

    await page.click('.season__month[data-month="3"]')
    assert.match(await page.textContent('.season__status'), /Tháng 3/)

    /* Lễ hội & mùa đặc sắc: bấm tháng làm nổi sự kiện của tháng đó */
    assert.ok(await page.$$eval('#dest-events .event', a => a.length) >= 2, 'Hội An cần danh sách lễ hội / mùa đặc sắc')
    await page.click('.season__month[data-month="10"]')
    assert.ok(await page.$$eval('#dest-events .event--active', a => a.length) >= 1, 'tháng 10 phải có sự kiện nổi bật')

    /* Danh sách đồ cần mang: đánh dấu được ghi nhớ khi tải lại trang */
    assert.ok(await page.$$eval('#packing [data-pack-item]', a => a.length) >= 10)
    await page.check('#packing [data-pack-item="cccd"]')
    assert.match(await page.textContent('#packing .packing__progress'), /^1\//)
    await page.reload()
    assert.ok(await page.isChecked('#packing [data-pack-item="cccd"]'), 'phải nhớ món đã chuẩn bị')

    /* Báo sai thông tin trên thẻ điểm tham quan và quán */
    assert.match(await page.getAttribute('.sight .report-link', 'href'), /^https:\/\/github\.com\/TanTan1802\/travel\/issues\/new\?title=/)
    assert.ok(await page.$('.eat .report-link'))
    assert.ok(await page.$$eval('#season-others a', a => a.length) > 0, 'phải gợi ý điểm đến theo tháng')

    await page.click('.gallery__item[data-index="1"]')
    assert.ok(await page.isVisible('#lightbox'))
    await page.keyboard.press('Escape')
    assert.ok(await page.isHidden('#lightbox'))

    assert.deepEqual(errors, [])
    await close()
})

test('bản đồ: Leaflet chỉ tải khi cần, hiện đủ điểm đến', async () => {
    const { page, errors, close } = await openPage('index.html')
    assert.equal(await page.evaluate(() => typeof L), 'undefined', 'Leaflet không được tải sẵn khi chưa mở bản đồ')
    await page.click('.view-toggle__btn[data-view="map"]')
    await page.waitForSelector('#explore-map .leaflet-marker-icon')
    const total = await page.$$eval('#dest-grid .dest-card', a => a.length)
    assert.ok(await page.$$eval('#explore-map .leaflet-marker-icon:not(.map-label)', a => a.length) >= total)
    await close()

    const detail = await openPage('diem-den/sa-pa/index.html')
    await detail.page.locator('#dest-map').scrollIntoViewIfNeeded()
    await detail.page.waitForSelector('#dest-map .leaflet-marker-icon')
    assert.deepEqual([...errors, ...detail.errors], [])
    await detail.close()
})

test('lập kế hoạch: hành trình gợi ý, số ngày, tuyến ngắn nhất, lưu và chia sẻ', async () => {
    const { page, errors, close } = await openPage('ke-hoach/index.html')
    const stops = () => page.$$eval('.stop__name', a => a.map(x => x.textContent.trim()))

    await page.click('.planner__route[data-route="1"]')
    assert.equal((await stops()).length, 4)
    assert.match(page.url(), /\?p=phong-nha\.2,hue\.2,da-nang\.2,hoi-an\.2/)
    assert.equal(await page.$$eval('.plan-day', a => a.length), 8, 'lịch trình phải có 8 ngày')

    await page.click('.stop[data-index="0"] [data-action="days"][data-delta="1"]')
    assert.match(page.url(), /phong-nha\.3/)
    assert.equal(await page.$$eval('.plan-day', a => a.length), 9)

    await page.click('.stop[data-index="3"] [data-action="remove"]')
    assert.equal((await stops()).length, 3)

    /* Tuyến lộn xộn → sắp xếp lại theo địa lý */
    await page.goto(page.url().split('?')[0] + '?p=sa-pa.2,hoi-an.2,ha-noi.2,hue.2&m=7')
    assert.equal(await page.$eval('#planner-month', s => s.value), '7')
    await page.click('[data-action="optimize"]')
    assert.deepEqual(await stops(), ['Sa Pa', 'Hà Nội', 'Cố đô Huế', 'Phố cổ Hội An'])
    assert.ok(await page.$$eval('.stop__warn', a => a.length) > 0, 'phải cảnh báo điểm đến ngoài mùa đẹp')

    /* Ngày khởi hành: lịch có ngày, bữa ăn cụ thể, link đặt phòng điền sẵn ngày, checklist đặt chỗ */
    await page.fill('#planner-start', '2026-11-10')
    assert.match(page.url(), /d=2026-11-10/)
    assert.equal(await page.textContent('.plan-day__date'), '10/11/2026')
    assert.ok(await page.$$eval('.plan-day', days => days.every(d => d.querySelectorAll('.day-tl__item').length >= 7)), 'mỗi ngày cần timeline chi tiết')
    assert.equal(await page.$$eval('.plan-day .day-tl__item--drink', a => a.length), 8, 'mỗi ngày cần một mốc quán nước / ăn vặt')
    const named = await page.$$eval('.plan-day .day-tl__place', a => a.map(x => x.textContent.trim()))
    assert.equal(new Set(named).size, named.length, 'không quán nào lặp lại trong kế hoạch')
    const bookingUrl = await page.getAttribute('.booking a[href*="booking.com"]', 'href')
    assert.match(bookingUrl, /checkin=2026-11-10&checkout=2026-11-12/)
    await page.click('.cost-details summary')
    assert.ok(await page.$$eval('.cost-details .cost-item', a => a.length) >= 5, 'chi tiết chi phí phải có các khoản + di chuyển giữa các điểm')
    await page.check('[data-booking="stay:sa-pa"]')
    assert.match(await page.textContent('.bookings__progress'), /Đã đặt 1\//)

    /* Lưu ý theo ngày đi (tháng 11: mưa bão miền Trung ở Huế, Hội An) + danh sách đồ gộp cả chuyến */
    assert.match(await page.textContent('#planner-notes'), /Mùa mưa bão miền Trung/)
    assert.ok(await page.$$eval('#planner-packing [data-pack-item]', a => a.length) >= 12)
    assert.ok(await page.$('#planner-packing [data-pack-item="down"]'), 'Sa Pa tháng 11 cần áo ấm')

    /* Ngày khởi hành quá xa để dự báo: báo ngày sẽ có dự báo; xuất lịch cả kế hoạch và tuyến trên Google Maps */
    assert.match(await page.textContent('.plan-day .forecast-chip--later'), /Có dự báo từ/)
    const tripRoute = new URL(await page.getAttribute('.planner__export a[href*="google.com/maps/dir"]', 'href'))
    assert.equal(tripRoute.searchParams.get('waypoints').split('|').length, 2, '4 điểm đến → 2 điểm dừng giữa')
    const [planDownload] = await Promise.all([page.waitForEvent('download'), page.click('[data-action="ics"]')])
    const planIcs = require('fs').readFileSync(await planDownload.path(), 'utf8')
    const starts = [...planIcs.matchAll(/^DTSTART;TZID=Asia\/Ho_Chi_Minh:(\d{8})T\d{6}\r$/gm)].map(m => m[1])
    assert.equal(starts[0], '20261110', 'sự kiện đầu tiên vào ngày khởi hành 10/11/2026')
    assert.equal(new Set(starts).size, await page.$$eval('.plan-day', a => a.length), 'mỗi ngày của kế hoạch đều có sự kiện')
    assert.ok(await page.$('.plan-day a[href*="calendar.google.com"]'), 'mỗi ngày có link Google Calendar')

    /* Ngày khởi hành gần: hiện dự báo thật từ Open-Meteo (giả lập) */
    await page.fill('#planner-start', await page.evaluate(() => addDays(todayIso(), 1)))
    await page.waitForSelector('.plan-day .forecast-chip strong')

    /* Kế hoạch được lưu lại khi mở lại trang không có tham số */
    await page.goto(page.url().split('?')[0])
    assert.equal((await stops()).length, 4)
    assert.ok(await page.isChecked('[data-booking="stay:sa-pa"]'), 'phải nhớ mục đã đặt')

    /* Thêm từ trang điểm đến */
    await page.goto(page.url().replace('ke-hoach/index.html', 'diem-den/da-lat/index.html'))
    await page.click('[data-plan-add="da-lat"]')
    assert.match(await page.textContent('.plan-btn__label'), /Xem kế hoạch/)
    await page.click('[data-plan-add="da-lat"]')
    await page.waitForURL(/ke-hoach/)
    assert.ok((await stops()).includes('Đà Lạt'))

    assert.deepEqual(errors, [])
    await close()
})

test('trong chuyến đi: chế độ Hôm nay, nhắc chuyến đi, gần tôi, lưu offline', async () => {
    /* Đang đi: ngày 2/3 ở Hội An lúc 12:00 → đang ăn trưa (11:30), tiếp theo cà phê 13:00 */
    const { page, errors, close } = await openPage('ke-hoach/index.html?p=hoi-an.3&d=2026-11-10&today=2026-11-11&now=12:00', { geolocation: { latitude: 21.03, longitude: 105.85 } })
    assert.match(await page.textContent('#today .today__title'), /Ngày 2\/3 – Phố cổ Hội An/)
    assert.match(await page.textContent('#today .today__entry--now'), /11:30/)
    const next = await page.textContent('#today .today__entry--next')
    assert.match(next, /còn 1 giờ\s/)
    assert.match(next, /13:00/)
    assert.match(await page.getAttribute('#today .today__entry--next .today__go', 'href'), /google\.com\/maps\/dir\/\?api=1&destination=/)
    assert.ok(await page.$$eval('#today .nearby-links__chip', a => a.length) >= 5, 'cần tìm nhanh quanh đây')

    /* Lưu offline: trang kế hoạch, trang điểm đến và mã nguồn vào Cache Storage */
    await page.click('[data-action="offline"]')
    await page.waitForSelector('#offline-status')
    const cached = await page.evaluate(async () => (await (await caches.open('trip-offline')).keys()).map(r => new URL(r.url).pathname))
    assert.ok(cached.some(p => p.endsWith('/diem-den/hoi-an/index.html')), 'phải lưu trang Hội An')
    assert.ok(cached.some(p => p.endsWith('/assets/js/data/dest/hoi-an.js')), 'phải lưu dữ liệu riêng của Hội An')
    assert.ok(cached.some(p => /\/assets\/img\/wiki\/.+-480\.webp$/.test(p)), 'phải lưu ảnh cỡ nhỏ')

    /* Sắp đi: còn 5 ngày */
    await page.goto(page.url().split('?')[0] + '?p=hoi-an.3&d=2026-11-10&today=2026-11-05')
    assert.match(await page.textContent('#planner-today .today--upcoming'), /Còn 5 ngày/)

    /* Trang chủ nhắc chuyến đi đang diễn ra + "Gần tôi" sắp theo khoảng cách (vị trí: Hà Nội) */
    await page.goto(page.url().replace(/ke-hoach\/index\.html.*/, 'index.html?today=2026-11-11'))
    assert.match(await page.textContent('#trip-banner'), /ngày 2\/3 của chuyến đi – Phố cổ Hội An/)
    await page.click('#trip-banner .trip-banner__close')
    assert.ok(await page.isHidden('#trip-banner'))
    await page.click('#near-filter')
    await page.waitForSelector('#near-filter[aria-pressed="true"]')
    assert.match(await page.textContent('#dest-grid .dest-card__hint'), /Cách bạn ~\d+ km/)
    assert.equal((await page.textContent('#dest-grid .dest-card__title')).trim(), 'Hà Nội', 'gần Hà Nội nhất là Hà Nội')

    assert.deepEqual(errors, [])
    await close()
})

test('hồ sơ chuyến đi và trắc nghiệm "Đi đâu hợp với bạn?"', async () => {
    /* Xuất phát từ Hà Nội, 3 người, gia đình có trẻ nhỏ */
    const { page, errors, close } = await openPage('ke-hoach/index.html?p=hue.2,hoi-an.2&o=ha-noi&n=3&s=family')
    const bookings = await page.$$eval('.booking__title, .booking strong', a => a.map(x => x.textContent.trim()))
    assert.ok(bookings.some(x => x.includes('Hà Nội → Cố đô Huế')), 'phải có vé chặng đi từ Hà Nội')
    assert.ok(bookings.some(x => x.includes('Phố cổ Hội An → Hà Nội')), 'phải có vé chặng về Hà Nội')
    assert.match(await page.textContent('#planner-group'), /3 người[\s\S]*thêm 1 phòng/)
    assert.ok(await page.isVisible('.style-tips'), 'phải có gợi ý theo phong cách')
    assert.ok(await page.$('#planner-packing [data-pack-item="kidsmeds"]'), 'gia đình có trẻ nhỏ cần thuốc cho trẻ')
    assert.match(await page.getAttribute('.plan-day:first-child', 'class'), /plan-day--travel/, 'ngày 1 là ngày di chuyển từ Hà Nội')
    await page.fill('#planner-people', '4')
    await page.press('#planner-people', 'Enter')
    await page.waitForFunction(() => /4 người/.test(document.getElementById('planner-group')?.textContent || ''))
    assert.match(page.url(), /n=4/)

    /* Trắc nghiệm trên trang chủ → mở gợi ý trong trình lập kế hoạch */
    await page.goto(page.url().replace(/ke-hoach\/index\.html.*/, 'index.html'))
    await page.click('.home [data-quiz-open]')
    assert.ok(await page.isVisible('#quiz'))
    await page.click('[data-quiz-option="bien"]')
    await page.click('[data-quiz-nav="next"]')
    for (const option of ['1', 'medium', 'nam', 'couple', 'saving']) await page.click(`[data-quiz-option="${option}"]`)
    const href = await page.getAttribute('#quiz-plan', 'href')
    assert.match(href, /ke-hoach\/index\.html\?p=[a-z-]+\.\d/)
    assert.match(href, /m=1/)
    await page.click('#quiz-plan')
    await page.waitForURL(/ke-hoach/)
    assert.equal(await page.$$eval('.stop', a => a.length), 2, 'chuyến 4–6 ngày → 2 điểm đến')

    assert.deepEqual(errors, [])
    await close()
})

test('in & chia sẻ: in lịch trình, chia sẻ liên kết, sao chép kế hoạch dạng chữ', async () => {
    const { page, errors, close } = await openPage('diem-den/hue/index.html')
    await page.click('.tour:not([hidden]) [data-tour-action="print"]')
    const printed = await page.evaluate(() => window.__printed)
    assert.equal(printed?.count, 1)
    assert.match(printed.bodyClass, /print-itinerary/, 'phải bật chế độ chỉ in lịch trình')

    await page.click('.tour:not([hidden]) [data-tour-action="share"]')
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /diem-den\/hue\/index\.html#itinerary$/)

    /* Bản in hiện đủ các ngày của tour đang chọn */
    await page.emulateMedia({ media: 'print' })
    assert.equal(await page.$$eval('.tour:not([hidden]) .itinerary__panel', a => a.filter(p => getComputedStyle(p).display !== 'none').length), 3)
    assert.ok(await page.isHidden('.header'), 'bản in không có thanh menu')
    await page.emulateMedia({ media: 'screen' })

    await page.goto(page.url().replace('diem-den/hue/index.html', 'ke-hoach/index.html?p=hue.2,hoi-an.1&m=3'))
    await page.click('[data-action="copy-text"]')
    const text = await page.evaluate(() => navigator.clipboard.readText())
    assert.match(text, /^Kế hoạch chuyến đi: Cố đô Huế → Phố cổ Hội An/)
    assert.match(text, /Ngày 3 – Phố cổ Hội An/)
    assert.match(text, /ke-hoach\/index\.html\?p=hue\.2,hoi-an\.1&m=3/)
    await page.click('[data-action="print"]')
    assert.equal((await page.evaluate(() => window.__printed))?.count, 1)

    assert.deepEqual(errors, [])
    await close()
})

test('cẩm nang: trang chủ, danh sách, bài viết, bảng tháng', async () => {
    const { page, errors, close } = await openPage('index.html')
    assert.equal(await page.$$eval('#guides .guide-card', a => a.length), 3, 'trang chủ cần 3 thẻ cẩm nang')
    await page.click('#guides .guides-home__more a')
    await page.waitForURL(/cam-nang\/index\.html$/)
    assert.ok(await page.$$eval('.guide-card', a => a.length) >= 6)

    await page.click('.guide-card[href*="thoi-diem-du-lich"]')
    await page.waitForURL(/thoi-diem-du-lich/)
    assert.equal(await page.$$eval('.months-table__row', a => a.length), 12, 'bảng phải đủ 12 tháng')
    assert.ok(await page.$$eval('.months-table__row:nth-child(10) a', a => a.map(x => x.textContent)).then(n => n.includes('Hà Giang')), 'tháng 10 phải gợi ý Hà Giang')
    assert.ok(await page.$$eval('.guide__toc a', a => a.length) >= 3, 'cần mục lục')
    assert.ok(await page.$$eval('#guide-page .dest-card', a => a.length) >= 1, 'cần điểm đến liên quan')

    await page.click('#lang-switch')
    await page.waitForURL(/en\/cam-nang\/thoi-diem-du-lich/)
    assert.match(await page.textContent('h1'), /When is the best time/)

    assert.deepEqual(errors, [])
    await close()
})

test('bản tiếng Anh và nút chuyển ngôn ngữ', async () => {
    const { page, errors, close } = await openPage('en/diem-den/hue/index.html')
    assert.equal(await page.$eval('html', h => h.lang), 'en')
    assert.match(await page.textContent('.tour-picker__btn'), /3 days 2 nights/)
    assert.match(await page.textContent('.tour-picker__btn small'), /VND/)

    await page.click('#lang-switch')
    await page.waitForLoadState('domcontentloaded')
    assert.match(page.url(), /\/diem-den\/hue\/index\.html$/)
    assert.equal(await page.$eval('html', h => h.lang), 'vi')

    assert.deepEqual(errors, [])
    await close()
})

test('giao diện điện thoại không bị tràn ngang', async () => {
    for (const rel of ['index.html', 'diem-den/ha-giang/index.html', 'en/diem-den/phu-quoc/index.html', 'ke-hoach/index.html?p=hue.2,hoi-an.2,da-lat.2&d=2026-11-10']) {
        const { page, close } = await openPage(rel, { viewport: { width: 375, height: 800 } })
        const width = await page.evaluate(() => document.documentElement.scrollWidth)
        assert.ok(width <= 375, `${rel}: rộng ${width}px trên màn hình 375px`)
        await close()
    }
})

test('dữ liệu luôn mới: tháng cập nhật và form báo sai ngay trên trang', async () => {
    const { page, errors, close } = await openPage('diem-den/hue/gia-ve/index.html')
    assert.match(await page.textContent('.sight .sight__meta'), /Cập nhật \d{2}\/\d{4}/, 'điểm tham quan cần hiện tháng cập nhật')

    /* Bấm "Báo sai" → form trên trang (không rời trang), bắt buộc nhập thông tin đúng */
    await page.evaluate(() => { window.open = (url) => { window.__opened = url } })
    await page.click('.sight .report-link')
    await page.waitForSelector('#report-dialog[open]')
    assert.match(await page.textContent('#report-dialog .report-form__item'), /Cố đô Huế – Đại Nội/)
    await page.click('#report-dialog button[type="submit"]')
    assert.match(await page.textContent('#report-dialog .report-form__status'), /thông tin đúng/)
    await page.fill('#report-correction', 'Giá vé mới 220.000đ')
    await page.fill('#report-source', 'https://hueworldheritage.org.vn')
    await page.click('#report-dialog button[type="submit"]')
    /* Chưa cấu hình reportEndpoint → mở GitHub Issue chứa nội dung vừa nhập */
    const opened = new URL(await page.evaluate(() => window.__opened))
    assert.equal(opened.hostname, 'github.com')
    assert.match(opened.searchParams.get('body'), /Giá vé mới 220\.000đ[\s\S]*hueworldheritage/)
    assert.ok(await page.isHidden('#report-dialog'))

    assert.deepEqual(errors, [])
    await close()
})

test('cộng đồng: mục ảnh người đọc + nút gửi ảnh mở form GitHub điền sẵn điểm đến', async () => {
    const { page, errors, close } = await openPage('diem-den/hoi-an/index.html')
    assert.ok(await page.isVisible('#comments .community__title'))
    const submit = new URL(await page.getAttribute('#comments .community__submit', 'href'))
    assert.equal(submit.hostname, 'github.com')
    assert.equal(submit.searchParams.get('template'), 'gui-anh.yml')
    assert.equal(submit.searchParams.get('dest'), 'Phố cổ Hội An')
    assert.deepEqual(errors, [])
    await close()
})
