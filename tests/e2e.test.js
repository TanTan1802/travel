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
    browser = await chromium.launch()
})

test.after(async () => {
    await browser?.close()
    await server?.close()
})

/* Trang mới với tài nguyên ngoài đã được giả lập; trả về trang + danh sách lỗi thu được */
async function openPage(url, { viewport = { width: 1280, height: 900 } } = {}) {
    const context = await browser.newContext({ viewport, serviceWorkers: 'block' })
    await setupRoutes(context)
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: server.url.replace(/\/$/, '') })
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
    const count = async () => page.$$eval('#dest-grid .dest-card', a => a.length)
    const total = await count()
    assert.ok(total >= 20, `chỉ có ${total} thẻ điểm đến`)

    await page.fill('#explore-search', 'phở')
    assert.ok((await count()) >= 1 && (await count()) < total, 'tìm "phở" phải thu hẹp kết quả')
    await page.fill('#explore-search', 'xyzkhongtontai')
    assert.ok(await page.isVisible('#explore-empty'), 'phải hiện thông báo không có kết quả')
    await page.fill('#explore-search', '')

    await page.click('#region-filters .chip[data-value="nam"]')
    const south = await page.$$eval('#dest-grid .dest-card__region', a => a.map(x => x.textContent.trim()))
    assert.ok(south.length && south.every(r => r === 'Miền Nam'), 'lọc Miền Nam sai')
    await page.click('#region-filters .chip[data-value="all"]')

    await page.selectOption('#month-filter', '10')
    const oct = await count()
    assert.ok(oct > 0 && oct < total, 'lọc tháng 10 phải thu hẹp kết quả')
    await page.selectOption('#month-filter', '0')

    await page.click('#dest-grid .fav-btn[data-favorite="hoi-an"]')
    assert.equal(await page.textContent('#fav-count'), '1')
    await page.click('#fav-filter')
    assert.equal(await count(), 1, 'bộ lọc yêu thích phải chỉ còn 1 thẻ')

    assert.deepEqual(errors, [])
    await close()
})

test('trang điểm đến: chọn tour, chuyển ngày, xem tất cả, chọn tháng, lightbox', async () => {
    const { page, errors, close } = await openPage('diem-den/hoi-an/index.html')
    const visiblePanels = () => page.$$eval('.tour:not([hidden]) .itinerary__panel', a => a.map(p => (p.hidden ? 0 : 1)).join(''))

    assert.equal(await page.$$eval('.tour-picker__btn', a => a.length), 3, 'cần 3 lựa chọn tour')
    assert.equal(await visiblePanels(), '100')

    await page.click('.tour-picker__btn[data-tour="5"]')
    assert.equal(await page.$eval('.tour:not([hidden])', t => t.dataset.tour), '5')
    await page.click('.tour:not([hidden]) .itinerary__tab[data-day="4"]')
    assert.equal(await visiblePanels(), '00001')
    assert.ok(await page.isVisible('.tour:not([hidden]) .itinerary__panel:not([hidden]) .itinerary__farewell'), 'ngày cuối phải có ghi chú kết thúc tour')

    await page.click('.tour:not([hidden]) .tour__expand')
    assert.equal(await visiblePanels(), '11111')

    await page.click('.season__month[data-month="3"]')
    assert.match(await page.textContent('.season__status'), /Tháng 3/)
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

    /* Kế hoạch được lưu lại khi mở lại trang không có tham số */
    await page.goto(page.url().split('?')[0])
    assert.equal((await stops()).length, 4)

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
    for (const rel of ['index.html', 'diem-den/ha-giang/index.html', 'en/diem-den/phu-quoc/index.html']) {
        const { page, close } = await openPage(rel, { viewport: { width: 375, height: 800 } })
        const width = await page.evaluate(() => document.documentElement.scrollWidth)
        assert.ok(width <= 375, `${rel}: rộng ${width}px trên màn hình 375px`)
        await close()
    }
})
