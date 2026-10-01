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
        vars: { stayTypes: 'STAY_TYPES', places: 'PLACES' },
        doc: 'Quán ăn, quán nước, khu lưu trú và cách đi tới từng điểm đến.',
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
    const { vars, whole, doc } = DATASETS[name]
    const body = whole
        ? `const ${whole} = ${json ? JSON.stringify((({ $schema, ...rest }) => rest)(json)) : 'null'}`
        : Object.entries(vars)
            .map(([key, constName]) => `const ${constName} = ${JSON.stringify(json[key])}`)
            .join('\n\n')
    return `/*=============== SINH TỰ ĐỘNG TỪ data/${name}.json – KHÔNG SỬA TAY ===============*/\n` +
        `/*\n * ${doc}\n * Sửa dữ liệu trong data/${name}.json rồi chạy \`npm run build\` (kiểm tra theo data/schema/${name}.schema.json).\n */\n` +
        `${body}\n`
}

function main() {
    const checkOnly = process.argv.includes('--check')
    const { data, errors } = loadAndValidate()
    if (errors.length) {
        console.error(`❌ Dữ liệu không hợp lệ (${errors.length} lỗi):`)
        errors.forEach(e => console.error(`  - ${e}`))
        process.exit(1)
    }
    if (checkOnly) {
        console.log('✅ Dữ liệu hợp lệ theo schema')
        return
    }
    for (const name of Object.keys(DATASETS)) {
        fs.writeFileSync(path.join(OUT_DIR, `${name}.js`), generate(name, data[name]))
    }
    console.log(`✅ Dữ liệu hợp lệ – đã sinh ${Object.keys(DATASETS).length} file assets/js/data/*.js`)
}

if (require.main === module) main()

module.exports = { loadAndValidate, DATASETS }
