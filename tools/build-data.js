/*
 * Dữ liệu gốc nằm trong data/*.json (có JSON Schema ở data/schema/).
 * Script này kiểm tra dữ liệu rồi sinh lại các file assets/js/data/*.js mà trình duyệt dùng.
 *
 *   node tools/build-data.js           – kiểm tra + sinh file (chạy tự động trong `npm run build`)
 *   node tools/build-data.js --check   – chỉ kiểm tra, không ghi file
 *
 * Muốn sửa dữ liệu: sửa file JSON trong data/, KHÔNG sửa assets/js/data/*.js (sẽ bị ghi đè).
 */
const fs = require('fs')
const path = require('path')
const Ajv2020 = require('ajv/dist/2020')
const { loadBrowserScripts } = require('./lib')

const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data')
const OUT_DIR = path.join(ROOT, 'assets/js/data')

/* Tên bộ dữ liệu → các biến toàn cục sinh ra (khóa JSON → tên hằng JS) + mô tả đầu file */
const DATASETS = {
    destinations: {
        vars: { regions: 'REGIONS', categories: 'CATEGORIES', destinations: 'DESTINATIONS' },
        doc: 'Điểm đến: thông tin, ảnh Wikimedia Commons, món đặc sản, trải nghiệm, kinh nghiệm.\n * Hàm dùng chung (getDestination, wikiImg, ...) nằm ở assets/js/core.js.',
    },
    itineraries: {
        vars: { tourLengths: 'TOUR_LENGTHS', itineraries: 'ITINERARIES' },
        doc: 'Lịch trình 5 ngày mỗi điểm đến (tour 3/4/5 ngày = 3/4/5 ngày đầu) + fees [tiết kiệm, thoải mái].',
    },
    places: {
        vars: { stayTypes: 'STAY_TYPES', transport: 'TRANSPORT', places: 'PLACES' },
        doc: 'Quán ăn, quán nước, khu lưu trú và cách đi tới từng điểm đến; TRANSPORT: tàu hỏa, cảng tàu ra đảo\n * và (sinh thêm) stations = sân bay + ga của từng điểm đến.',
        /* Sân bay + ga của mọi điểm đến đi kèm TRANSPORT để trang điểm đến (chỉ nạp dữ liệu của riêng nó) vẫn tính được chặng từ thành phố khác */
        transform: json => ({ ...json, transport: { ...json.transport, stations: Object.fromEntries(Object.entries(json.places).map(([id, p]) => [id, { airport: p.airport, ...(p.rail ? { rail: p.rail } : {}) }])) } }),
    },
    sights: {
        vars: { sights: 'SIGHTS' },
        doc: 'Điểm tham quan theo từng ngày (giá vé, giờ mở cửa, địa chỉ) và quán nước gần điểm.',
    },
    events: {
        vars: { eventTypes: 'EVENT_TYPES', events: 'EVENTS' },
        doc: 'Lễ hội, mùa cảnh sắc, nghỉ lễ, thời tiết cần lưu ý. Hàm tra cứu nằm ở assets/js/core.js.',
    },
    'community-photos': {
        vars: { photos: 'COMMUNITY_PHOTOS' },
        doc: 'Ảnh do người đọc gửi (đã duyệt, ghi tác giả + giấy phép) – thêm bằng tools/add-photo.js.',
    },
    /* Không bắt buộc: chưa có data/routes.json thì ROUTES = null (trình lập kế hoạch ước tính theo đường chim bay) */
    routes: {
        whole: 'ROUTES',
        optional: true,
        doc: 'Quãng đường (km) + thời gian lái xe (giờ) giữa các điểm đến từ OSRM – sinh bởi tools/build-routes.js.',
    },
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function createValidator() {
    const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false })
    for (const file of fs.readdirSync(path.join(DATA_DIR, 'schema'))) {
        ajv.addSchema(readJson(path.join(DATA_DIR, 'schema', file)))
    }
    return ajv
}

/* Ràng buộc giữa các bộ dữ liệu mà JSON Schema không diễn tả được */
function crossChecks(data) {
    const errors = []
    const ids = data.destinations.destinations.map(d => d.id)
    const idSet = new Set(ids)
    if (idSet.size !== ids.length) errors.push('destinations: có mã điểm đến bị trùng')
    const sameIds = (name, keys) => {
        const missing = ids.filter(id => !keys.includes(id))
        const extra = keys.filter(id => !idSet.has(id))
        if (missing.length) errors.push(`${name}: thiếu ${missing.join(', ')}`)
        if (extra.length) errors.push(`${name}: có mã không tồn tại ${extra.join(', ')}`)
    }
    sameIds('itineraries', Object.keys(data.itineraries.itineraries))
    sameIds('places', Object.keys(data.places.places))
    sameIds('sights', Object.keys(data.sights.sights))

    const { regions, categories } = data.destinations
    data.destinations.destinations.forEach(d => {
        if (!regions[d.region]) errors.push(`${d.id}: vùng ${d.region} chưa khai báo trong regions`)
        d.categories.filter(c => !categories[c]).forEach(c => errors.push(`${d.id}: loại hình ${c} chưa khai báo`))
    })
    Object.entries(data.itineraries.itineraries).forEach(([id, plan]) => {
        if (plan.fees[0] > plan.fees[1]) errors.push(`itineraries.${id}: phí tiết kiệm lớn hơn thoải mái`)
    })
    const rangeOk = (r, where) => { if (r[0] > r[1]) errors.push(`${where}: giá thấp lớn hơn giá cao`) }
    /* Tháng cập nhật không được ở tương lai (gõ nhầm năm/tháng) */
    const thisMonth = new Date().toISOString().slice(0, 7)
    Object.entries(data.sights.sights).forEach(([id, days]) => days.flat().forEach(s => {
        if (s.updated > thisMonth) errors.push(`sights.${id} · ${s.name[0]}: updated ${s.updated} ở tương lai`)
    }))
    Object.entries(data.places.places).forEach(([id, p]) => [...p.eats, ...p.cafes].forEach(e => {
        if (e.updated > thisMonth) errors.push(`places.${id} · ${e.name}: updated ${e.updated} ở tương lai`)
    }))
    const stations = new Set(data.places.transport.rail.lines.flatMap(l => Object.keys(l.stations)))
    Object.entries(data.places.places).forEach(([id, p]) => {
        if (p.rail && !stations.has(p.rail)) errors.push(`places.${id}: ga ${p.rail} không có trong transport.rail.lines`)
    })
    data.places.transport.ports.forEach((port, i) => { if (!idSet.has(port.dest)) errors.push(`places.transport.ports[${i}]: điểm đến ${port.dest} không tồn tại`) })
    Object.entries(data.places.places).forEach(([id, p]) => {
        p.eats.forEach((e, i) => rangeOk(e.price, `places.${id}.eats[${i}]`))
        p.cafes.forEach((c, i) => rangeOk(c.price, `places.${id}.cafes[${i}]`))
        p.stays.forEach((s, i) => {
            rangeOk(s.price, `places.${id}.stays[${i}]`)
            if (!data.places.stayTypes[s.type]) errors.push(`places.${id}.stays[${i}]: loại ${s.type} chưa khai báo`)
        })
    })
    Object.entries(data.sights.sights).forEach(([id, days]) => days.forEach((list, day) => list.forEach(s => {
        if (Array.isArray(s.price)) rangeOk(s.price, `sights.${id}[${day}] ${s.name[0]}`)
        if (s.cafe) rangeOk(s.cafe.price, `sights.${id}[${day}] quán ${s.cafe.name}`)
    })))
    const eventIds = new Set()
    data.events.events.forEach(e => {
        if (eventIds.has(e.id)) errors.push(`events: trùng mã ${e.id}`)
        eventIds.add(e.id)
        if (!data.events.eventTypes[e.type]) errors.push(`events.${e.id}: loại ${e.type} chưa khai báo`)
        if (e.where !== 'all') e.where.filter(id => !idSet.has(id)).forEach(id => errors.push(`events.${e.id}: điểm đến ${id} không tồn tại`))
        if (e.dates && e.dates[0] > e.dates[1]) errors.push(`events.${e.id}: ngày bắt đầu sau ngày kết thúc`)
    })
    data['community-photos'].photos.forEach((p, i) => {
        if (!idSet.has(p.dest)) errors.push(`community-photos[${i}]: điểm đến ${p.dest} không tồn tại`)
        ;[480, 960, 1920].forEach(size => {
            if (!fs.existsSync(path.join(ROOT, 'assets/img/community', `${p.base}-${size}.webp`))) errors.push(`community-photos[${i}]: thiếu assets/img/community/${p.base}-${size}.webp`)
        })
    })
    if (data.routes) {
        const { ids: routeIds, km, hours } = data.routes
        routeIds.filter(id => !idSet.has(id)).forEach(id => errors.push(`routes: điểm đến ${id} không tồn tại`))
        const square = m => m.length === routeIds.length && m.every(row => row.length === routeIds.length)
        if (!square(km) || !square(hours)) errors.push(`routes: km/hours phải là bảng ${routeIds.length}×${routeIds.length}`)
    }
    return errors
}

function loadAndValidate() {
    const ajv = createValidator()
    const data = {}
    const errors = []
    for (const name of Object.keys(DATASETS)) {
        const file = path.join(DATA_DIR, `${name}.json`)
        if (DATASETS[name].optional && !fs.existsSync(file)) {
            data[name] = null
            continue
        }
        const json = readJson(file)
        const validate = ajv.getSchema(`${name}.schema.json`)
        if (!validate(json)) {
            validate.errors.slice(0, 20).forEach(err => errors.push(`data/${name}.json${err.instancePath}: ${err.message}${err.params && err.params.additionalProperty ? ` (${err.params.additionalProperty})` : ''}`))
        }
        data[name] = json
    }
    if (!errors.length) errors.push(...crossChecks(data))
    return { data, errors }
}

function generate(name, json) {
    const { vars, whole, doc, transform } = DATASETS[name]
    if (transform && json) json = transform(json)
    const body = whole
        ? `const ${whole} = ${json ? JSON.stringify((({ $schema, ...rest }) => rest)(json)) : 'null'}`
        : Object.entries(vars)
            .map(([key, constName]) => `const ${constName} = ${JSON.stringify(json[key])}`)
            .join('\n\n')
    return `/*=============== SINH TỰ ĐỘNG TỪ data/${name}.json – KHÔNG SỬA TAY ===============*/\n` +
        `/*\n * ${doc}\n * Sửa dữ liệu trong data/${name}.json rồi chạy \`npm run build\` (kiểm tra theo data/schema/${name}.schema.json).\n */\n` +
        `${body}\n`
}

/*==================== BẢN DỊCH KO / ZH / JA ====================*/
/*
 * data/i18n/<lang>.json – khóa là chuỗi tiếng Việt gốc (giống assets/js/data/en.js):
 *   ui, html, regions, categories, destinations (chữ của điểm đến: thông tin, chú thích ảnh, món ăn,
 *   trải nghiệm, kinh nghiệm), itineraries (tên từng ngày).
 * Sinh assets/js/data/i18n/<lang>.js (TRANSLATION_LOCAL) – i18n.js phủ lên bản tiếng Anh,
 * chuỗi chưa dịch sẽ hiện tiếng Anh. Thêm ngôn ngữ: tạo file JSON + khai báo trong LANGS của tools/build.js.
 */
const I18N_DIR = path.join(DATA_DIR, 'i18n')
const I18N_OUT = path.join(OUT_DIR, 'i18n')
const I18N_FIELDS = ['name', 'province', 'tagline', 'bestTime', 'duration', 'highlights', 'description', 'gallery', 'foods', 'activities', 'tips']
/* Trường chữ được dịch trong từng phần tử của mảng */
const I18N_ITEM_FIELDS = { gallery: ['caption'], foods: ['name', 'desc', 'illustrative'], activities: ['title', 'desc'] }

const placeholders = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',')

function checkTranslation(lang, json, data, en) {
    const errors = []
    for (const section of ['ui', 'html']) {
        Object.entries(json[section] || {}).forEach(([key, value]) => {
            if (!(key in en[section])) errors.push(`i18n/${lang}.${section}: "${key.slice(0, 50)}" không còn trong en.js (chuỗi gốc đã đổi?)`)
            else if (typeof value !== 'string' || !value.trim()) errors.push(`i18n/${lang}.${section}: "${key.slice(0, 50)}" để trống`)
            else if (placeholders(key) !== placeholders(value)) errors.push(`i18n/${lang}.${section}: "${key.slice(0, 50)}" sai biến {…}`)
        })
    }
    ;['regions', 'categories'].forEach(section => Object.keys(json[section] || {}).forEach(key => {
        if (!data.destinations[section][key]) errors.push(`i18n/${lang}.${section}: ${key} không tồn tại`)
    }))
    const dests = new Map(data.destinations.destinations.map(d => [d.id, d]))
    Object.entries(json.destinations || {}).forEach(([id, d]) => {
        if (!dests.has(id)) return errors.push(`i18n/${lang}.destinations: ${id} không tồn tại`)
        Object.keys(d).filter(k => !I18N_FIELDS.includes(k)).forEach(k => errors.push(`i18n/${lang}.destinations.${id}: trường ${k} không dịch được`))
        const vi = dests.get(id)
        ;['highlights', 'gallery', 'foods', 'activities', 'tips'].forEach(key => {
            if (d[key] && d[key].length !== vi[key].length) errors.push(`i18n/${lang}.destinations.${id}: ${key} phải có ${vi[key].length} mục`)
        })
        Object.entries(I18N_ITEM_FIELDS).forEach(([key, fields]) => (d[key] || []).forEach((item, i) => {
            Object.keys(item).filter(k => !fields.includes(k)).forEach(k => errors.push(`i18n/${lang}.destinations.${id}.${key}[${i}]: trường ${k} không dịch được`))
            if (key === 'foods' && !!item.illustrative !== !!(vi.foods[i] && vi.foods[i].illustrative)) errors.push(`i18n/${lang}.destinations.${id}.foods[${i}]: illustrative phải khớp dữ liệu gốc`)
        }))
    })
    Object.entries(json.itineraries || {}).forEach(([id, plan]) => {
        const days = data.itineraries.itineraries[id] && data.itineraries.itineraries[id].days
        if (!days) errors.push(`i18n/${lang}.itineraries: ${id} không tồn tại`)
        else if (plan.days.length > days.length) errors.push(`i18n/${lang}.itineraries.${id}: nhiều ngày hơn lịch trình gốc`)
    })
    return errors
}

function loadTranslations(data) {
    if (!fs.existsSync(I18N_DIR)) return { translations: {}, errors: [] }
    const { TRANSLATION_EN: en } = loadBrowserScripts(['assets/js/data/en.js'], ['TRANSLATION_EN'])
    const translations = {}
    const errors = []
    for (const file of fs.readdirSync(I18N_DIR).filter(f => f.endsWith('.json')).sort()) {
        const lang = file.replace(/\.json$/, '')
        translations[lang] = readJson(path.join(I18N_DIR, file))
        errors.push(...checkTranslation(lang, translations[lang], data, en))
    }
    return { translations, errors }
}

function generateTranslation(lang, json) {
    return `/*=============== SINH TỰ ĐỘNG TỪ data/i18n/${lang}.json – KHÔNG SỬA TAY ===============*/\n` +
        '/* Bản dịch phủ lên TRANSLATION_EN (assets/js/i18n.js) – chuỗi chưa dịch hiện tiếng Anh. */\n' +
        `const TRANSLATION_LOCAL = ${JSON.stringify(json)}\n`
}

function main() {
    const checkOnly = process.argv.includes('--check')
    const { data, errors } = loadAndValidate()
    if (errors.length) {
        console.error(`❌ Dữ liệu không hợp lệ (${errors.length} lỗi):`)
        errors.forEach(e => console.error(`  - ${e}`))
        process.exit(1)
    }
    const { translations, errors: i18nErrors } = loadTranslations(data)
    if (i18nErrors.length) {
        console.error(`❌ Bản dịch không hợp lệ (${i18nErrors.length} lỗi):`)
        i18nErrors.slice(0, 30).forEach(e => console.error(`  - ${e}`))
        process.exit(1)
    }
    if (checkOnly) {
        console.log('✅ Dữ liệu hợp lệ theo schema')
        return
    }
    for (const name of Object.keys(DATASETS)) {
        fs.writeFileSync(path.join(OUT_DIR, `${name}.js`), generate(name, data[name]))
    }
    fs.rmSync(I18N_OUT, { recursive: true, force: true })
    fs.mkdirSync(I18N_OUT, { recursive: true })
    Object.entries(translations).forEach(([lang, json]) => fs.writeFileSync(path.join(I18N_OUT, `${lang}.js`), generateTranslation(lang, json)))
    console.log(`✅ Dữ liệu hợp lệ – đã sinh ${Object.keys(DATASETS).length} file assets/js/data/*.js`)
}

if (require.main === module) main()

module.exports = { loadAndValidate, loadTranslations, DATASETS }
