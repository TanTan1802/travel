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
    ['assets/js/data/local-images.js', 'assets/js/data/en.js', 'assets/js/data/destinations.js', 'assets/js/data/itineraries.js', 'assets/js/data/places.js'],
    ['LOCAL_IMAGES', 'TRANSLATION_EN', 'DESTINATIONS', 'ITINERARIES', 'REGIONS', 'CATEGORIES', 'TOUR_LENGTHS', 'PLACES', 'STAY_TYPES'],
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

test('lịch trình: mỗi điểm đến có 5 ngày và chi phí cho tour 3/4/5 ngày', () => {
    for (const d of DESTINATIONS) {
        const plan = ITINERARIES[d.id]
        assert.ok(plan, `${d.id} chưa có lịch trình`)
        assert.equal(plan.days.length, 5, `${d.id}: cần 5 ngày`)
        plan.days.forEach((day, i) => {
            for (const key of ['title', 'morning', 'afternoon', 'evening']) assert.ok(day[key], `${d.id} ngày ${i + 1} thiếu ${key}`)
        })
        for (const tier of ['saving', 'comfort']) {
            const b = plan.budget[tier]
            assert.equal(b.length, 3, `${d.id}: budget.${tier} cần 3 mức`)
            assert.ok(b[0] < b[1] && b[1] < b[2], `${d.id}: budget.${tier} phải tăng dần theo số ngày`)
        }
        plan.budget.saving.forEach((v, i) => assert.ok(v < plan.budget.comfort[i], `${d.id}: mức tiết kiệm phải rẻ hơn thoải mái`))
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
        assert.ok(p.stays.length >= 2, `${id}: cần ít nhất 2 khu lưu trú`)
        p.stays.forEach((st, i) => {
            assert.ok(STAY_TYPES[st.type], `${id}.stays[${i}]: loại "${st.type}" không hợp lệ`)
            pair(st.area, `${id}.stays[${i}].area`)
            pair(st.note, `${id}.stays[${i}].note`)
            range(st.price, `${id}.stays[${i}].price`)
        })
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
    DESTINATIONS.forEach(d => [d.hero, ...d.gallery.map(g => g.file), ...d.foods.map(f => f.file)].filter(Boolean).forEach(f => used.add(f)))
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
