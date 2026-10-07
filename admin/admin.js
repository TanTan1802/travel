/*==================== TRANG QUẢN TRỊ DỮ LIỆU ====================*/
/*
 * Sửa / thêm điểm đến ngay trên trình duyệt, không cần máy chủ:
 * - Đăng nhập bằng fine-grained token GitHub (chỉ repo travel, quyền Contents + Pull requests: Read and write).
 *   Token chỉ lưu trên trình duyệt của người quản trị, gửi thẳng tới api.github.com.
 * - Đọc data/*.json + data/i18n/*.json từ nhánh main, sửa bằng form, kiểm tra cơ bản trên trình duyệt.
 * - Lưu = tạo nhánh admin/<mã>-<thời gian> + một commit + Pull Request. Workflow "Kiểm tra PR từ trang quản trị"
 *   tự build lại trang và chạy toàn bộ test; người quản trị duyệt rồi merge – site tự cập nhật.
 */
'use strict'

const REPO = 'TanTan1802/travel'
const BASE_BRANCH = 'main'
const API = 'https://api.github.com'
const TOKEN_KEY = 'vt-admin-token'
const FILES = {
    destinations: 'data/destinations.json',
    itineraries: 'data/itineraries.json',
    places: 'data/places.json',
    sights: 'data/sights.json',
    en: 'data/i18n/en.json',
    ko: 'data/i18n/ko.json',
    zh: 'data/i18n/zh.json',
    ja: 'data/i18n/ja.json',
    site: 'data/site.json',
}
const TR_LANGS = ['en', 'ko', 'zh', 'ja']
const LANG_NAMES = { en: 'English', ko: '한국어 (Hàn)', zh: '中文 (Trung)', ja: '日本語 (Nhật)' }
const DAYS = 5
const MONTH = () => new Date().toISOString().slice(0, 7)
const SITE_URL = 'https://viet-travel.congtan5918.workers.dev/'

const state = {
    token: null,
    user: null,
    baseSha: null,
    texts: {},     // nội dung gốc từng file (để so sánh, chỉ commit file đổi)
    data: {},      // JSON đã parse
    bundle: null,  // dữ liệu đang sửa: { dest, plan, place, sights, tr } hoặc { site } (giao diện & mùa)
    mode: null,    // 'dest' | 'site'
    id: null,
    isNew: false,
    tab: 'info',
    lang: 'en',
    dirty: false,
    errors: [],
    showErrors: false, // hiện lỗi chi tiết sau lần bấm lưu đầu tiên
    open: new Map(),   // mục danh sách đang mở / đóng
    draft: null,       // bản nháp tìm thấy khi mở trang sửa
    prs: null,         // Pull Request từ trang quản trị (đang mở)
}

/*---------- Tiện ích ----------*/
const $ = sel => document.querySelector(sel)
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)))
const get = (obj, path) => path.reduce((o, k) => (o == null ? undefined : o[k]), obj)
function set(obj, path, value) {
    let o = obj
    path.slice(0, -1).forEach((k, i) => {
        if (o[k] == null) o[k] = typeof path[i + 1] === 'number' ? [] : {}
        o = o[k]
    })
    o[path[path.length - 1]] = value
}
/* Ảnh đã tải về site (assets/js/data/local-images.js nạp trước admin.js) – nhanh hơn; chưa có thì lấy từ Commons */
const LOCAL = typeof LOCAL_IMAGES !== 'undefined' ? LOCAL_IMAGES : {}
const thumbUrl = file => (LOCAL[file] ? `../${LOCAL[file].xs}` : `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=320`)
const commonsPage = file => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`
const IMAGE_RE = /\.(jpe?g|png|webp|JPE?G|PNG)$/
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const YM_RE = /^20[0-9]{2}-(0[1-9]|1[0-2])$/

function toast(message, ms = 4000, type = 'info') {
    const box = $('#toasts')
    if (!box) return
    const el = document.createElement('div')
    el.className = `toast toast--${type}`
    el.textContent = message
    box.append(el)
    while (box.children.length > 3) box.firstElementChild.remove() // chỉ giữ 3 thông báo mới nhất
    setTimeout(() => el.remove(), ms)
}

/*---------- GitHub API ----------*/
async function gh(path, { method = 'GET', body, raw = false } = {}) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: {
            Authorization: `Bearer ${state.token}`,
            Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
        let detail = ''
        try { detail = (await res.json()).message } catch { /* không có JSON */ }
        const err = new Error(`GitHub ${res.status}${detail ? `: ${detail}` : ''}`)
        err.status = res.status
        throw err
    }
    return raw ? res.text() : res.json()
}

async function login(token, remember) {
    state.token = token
    const repo = await gh(`/repos/${REPO}`)
    if (!repo.permissions || !repo.permissions.push) throw new Error('Token không có quyền ghi vào repo travel (cần Contents: Read and write).')
    const user = await gh('/user').catch(() => null)
    state.user = user ? user.login : 'token'
    state.avatar = user ? user.avatar_url : null
    try {
        if (remember) localStorage.setItem(TOKEN_KEY, token)
        else sessionStorage.setItem(TOKEN_KEY, token)
    } catch { /* trình duyệt chặn lưu trữ – vẫn dùng được trong phiên này */ }
}

function logout() {
    try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY) } catch { /* bỏ qua */ }
    Object.assign(state, { token: null, user: null, avatar: null, baseSha: null, texts: {}, data: {}, bundle: null, mode: null, dirty: false, prs: null })
    location.hash = '#/'
    render()
}

async function loadData() {
    const ref = await gh(`/repos/${REPO}/git/ref/heads/${BASE_BRANCH}`)
    state.baseSha = ref.object.sha
    state.loadedAt = new Date().toISOString()
    const entries = await Promise.all(Object.entries(FILES).map(async ([key, path]) => {
        const text = await gh(`/repos/${REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${state.baseSha}`, { raw: true })
        return [key, text]
    }))
    entries.forEach(([key, text]) => {
        state.texts[key] = text
        state.data[key] = JSON.parse(text)
    })
}

/*---------- Dữ liệu một điểm đến ----------*/
const emptyDay = () => ({ title: '', morning: '', afternoon: '', evening: '' })

function newBundle() {
    return {
        dest: {
            id: '', name: '', province: '', region: 'bac', categories: [], rating: 4.5, lat: 16, lng: 106, bestMonths: [],
            tagline: '', description: '', highlights: [''], bestTime: '', duration: '', hero: '',
            gallery: [{ file: '', caption: '' }],
            foods: [{ name: '', desc: '', price: '', file: '' }],
            activities: [{ icon: 'ri-map-pin-line', title: '', desc: '' }],
            tips: [''],
        },
        plan: { days: Array.from({ length: DAYS }, emptyDay), fees: [0, 0] },
        place: { city: '', airport: '', getThere: ['', ''], eats: [], cafes: [], stays: [] },
        sights: Array.from({ length: DAYS }, () => []),
        tr: Object.fromEntries(TR_LANGS.map(l => [l, {}])),
    }
}

function loadBundle(id) {
    const d = state.data
    const dest = d.destinations.destinations.find(x => x.id === id)
    if (!dest) return null
    const tr = {}
    TR_LANGS.forEach(lang => {
        const src = d[lang] || {}
        tr[lang] = { ...clone((src.destinations || {})[id] || {}), days: clone(((src.itineraries || {})[id] || {}).days || []) }
    })
    return {
        dest: clone(dest),
        plan: clone(d.itineraries.itineraries[id] || { days: Array.from({ length: DAYS }, emptyDay), fees: [0, 0] }),
        place: clone(d.places.places[id] || newBundle().place),
        sights: clone(d.sights.sights[id] || newBundle().sights),
        tr,
    }
}

/* Mảng bản dịch luôn khớp số mục của bản tiếng Việt (để hiện cạnh nhau) */
function alignTranslation(b, lang) {
    const t = b.tr[lang]
    const v = b.dest
    const fit = (arr, n, make) => Array.from({ length: n }, (_, i) => (arr && arr[i] !== undefined ? arr[i] : make()))
    t.highlights = fit(t.highlights, v.highlights.length, () => '')
    t.tips = fit(t.tips, v.tips.length, () => '')
    t.gallery = fit(t.gallery, v.gallery.length, () => ({ caption: '' }))
    t.foods = fit(t.foods, v.foods.length, () => ({ name: '', desc: '' }))
    t.activities = fit(t.activities, v.activities.length, () => ({ title: '', desc: '' }))
    t.days = fit(t.days, b.plan.days.length, () => (lang === 'en' ? emptyDay() : { title: '' }))
}

/*---------- Làm sạch trước khi lưu ----------*/
const trim = s => (typeof s === 'string' ? s.trim() : s)
const filled = v => (typeof v === 'string' ? v.trim() !== '' : v != null)
const pairFilled = p => Array.isArray(p) && filled(p[0]) && filled(p[1])

function cleanBundle(b) {
    const d = b.dest
    for (const k of ['id', 'name', 'province', 'tagline', 'description', 'bestTime', 'duration', 'hero']) d[k] = trim(d[k]) || ''
    d.highlights = d.highlights.map(trim).filter(filled)
    d.tips = d.tips.map(trim).filter(filled)
    d.gallery = d.gallery.map(g => ({ file: trim(g.file), caption: trim(g.caption) })).filter(g => g.file || g.caption)
    d.foods = d.foods.map(f => {
        const files = (Array.isArray(f.file) ? f.file : String(f.file || '').split('|')).map(trim).filter(Boolean)
        const out = { name: trim(f.name), desc: trim(f.desc), price: trim(f.price), file: files.length > 1 ? files : files[0] || '' }
        if (filled(f.illustrative)) out.illustrative = trim(f.illustrative)
        return out
    }).filter(f => f.name || f.desc)
    d.activities = d.activities.map(a => ({ icon: trim(a.icon), title: trim(a.title), desc: trim(a.desc) })).filter(a => a.title || a.desc)
    d.categories = [...new Set(d.categories)]
    d.bestMonths = [...new Set(d.bestMonths)]

    const cleanPrice = p => (Array.isArray(p) ? (p[1] ? [Number(p[0]) || 0, Number(p[1])] : Number(p[0]) || 0) : Number(p) || 0)
    b.place.getThere = b.place.getThere.map(trim)
    ;['eats', 'cafes'].forEach(list => {
        b.place[list] = b.place[list].map(e => ({ ...e, name: trim(e.name), address: trim(e.address) })).filter(e => e.name)
    })
    b.place.stays = b.place.stays.filter(s => filled(s.area?.[0]) || filled(s.area?.[1]))
    if (!filled(b.place.rail)) delete b.place.rail
    b.sights = b.sights.map(list => list.filter(s => filled(s.name?.[0]) || filled(s.name?.[1])).map(s => {
        const out = { at: s.at || 'm', name: s.name.map(trim), price: cleanPrice(s.price) }
        if (s.note && (filled(s.note[0]) || filled(s.note[1]))) out.note = s.note.map(trim)
        out.hours = trim(s.hours) || 'all'
        out.address = trim(s.address)
        if (s.cafe && filled(s.cafe.name)) out.cafe = { name: trim(s.cafe.name), drink: (s.cafe.drink || ['', '']).map(trim), price: (s.cafe.price || [0, 0]).map(Number) }
        out.updated = s.updated || MONTH()
        return out
    }))
}

/* Bản dịch → đúng dạng trong data/i18n/<lang>.json (bỏ mục để trống) */
function exportTranslation(b, lang) {
    const t = b.tr[lang]
    const v = b.dest
    const out = {}
    for (const k of ['name', 'province', 'tagline', 'bestTime', 'duration', 'description']) if (filled(t[k])) out[k] = t[k].trim()
    const allOrNone = (key, arr) => {
        if (arr.some(x => (typeof x === 'string' ? filled(x) : Object.values(x).some(filled)))) out[key] = arr
    }
    allOrNone('highlights', t.highlights.slice(0, v.highlights.length).map(trim))
    allOrNone('tips', t.tips.slice(0, v.tips.length).map(trim))
    allOrNone('gallery', t.gallery.slice(0, v.gallery.length).map(g => ({ caption: trim(g.caption) })))
    allOrNone('foods', t.foods.slice(0, v.foods.length).map((f, i) => {
        const o = { name: trim(f.name), desc: trim(f.desc) }
        if (lang === 'en' && filled(f.price)) o.price = trim(f.price)
        if (v.foods[i].illustrative) o.illustrative = trim(f.illustrative || '')
        return o
    }))
    allOrNone('activities', t.activities.slice(0, v.activities.length).map(a => ({ title: trim(a.title), desc: trim(a.desc) })))
    const days = t.days.slice(0, b.plan.days.length).map(d => (lang === 'en'
        ? { title: trim(d.title), morning: trim(d.morning), afternoon: trim(d.afternoon), evening: trim(d.evening) }
        : { title: trim(d.title) }))
    return { dest: out, days: days.some(d => Object.values(d).some(filled)) ? days : null }
}

/*---------- Kiểm tra (CI kiểm tra đầy đủ hơn sau khi mở PR) ----------*/
function validate(b) {
    const e = []
    const d = b.dest
    const need = (cond, msg) => { if (!cond) e.push(msg) }
    need(ID_RE.test(d.id), 'Mã điểm đến chỉ gồm chữ thường không dấu, số và gạch nối (vd. tam-dao)')
    if (state.isNew) need(!state.data.destinations.destinations.some(x => x.id === d.id), `Mã "${d.id}" đã tồn tại`)
    for (const [k, label] of [['name', 'Tên'], ['province', 'Tỉnh'], ['tagline', 'Câu giới thiệu ngắn'], ['bestTime', 'Thời điểm đẹp'], ['duration', 'Số ngày nên đi']]) need(filled(d[k]), `Thông tin chung: thiếu ${label}`)
    need(d.description.length >= 20, 'Thông tin chung: mô tả cần ít nhất 20 ký tự')
    need(d.categories.length > 0, 'Thông tin chung: chọn ít nhất một loại hình')
    need(d.bestMonths.length > 0, 'Thông tin chung: chọn ít nhất một tháng đẹp')
    need(d.highlights.length > 0, 'Thông tin chung: cần ít nhất một điểm nổi bật')
    need(d.rating > 0 && d.rating <= 5, 'Thông tin chung: đánh giá trong khoảng 0–5')
    need(d.lat > 8 && d.lat < 24 && d.lng > 102 && d.lng < 110, 'Thông tin chung: tọa độ phải nằm trong Việt Nam')
    need(IMAGE_RE.test(d.hero), 'Ảnh: ảnh bìa phải là tên file .jpg/.png/.webp trên Wikimedia Commons')
    need(d.gallery.length > 0, 'Ảnh: thư viện cần ít nhất một ảnh')
    d.gallery.forEach((g, i) => need(IMAGE_RE.test(g.file || '') && filled(g.caption), `Ảnh: ảnh thư viện ${i + 1} thiếu tên file hợp lệ hoặc chú thích`))
    need(d.foods.length > 0, 'Ẩm thực: cần ít nhất một món')
    d.foods.forEach((f, i) => need(filled(f.name) && filled(f.desc) && filled(f.price) && [].concat(f.file).every(x => IMAGE_RE.test(x || '')), `Ẩm thực: món ${i + 1} thiếu tên, mô tả, giá hoặc ảnh hợp lệ`))
    need(d.activities.length > 0, 'Hoạt động: cần ít nhất một hoạt động')
    d.activities.forEach((a, i) => need(/^ri-[a-z0-9-]+$/.test(a.icon) && filled(a.title) && filled(a.desc), `Hoạt động ${i + 1}: thiếu biểu tượng (ri-…), tiêu đề hoặc mô tả`))

    need(b.plan.days.length === DAYS, `Lịch trình: cần đúng ${DAYS} ngày`)
    b.plan.days.forEach((day, i) => need(['title', 'morning', 'afternoon', 'evening'].every(k => filled(day[k])), `Lịch trình ngày ${i + 1}: điền đủ tiêu đề, sáng, chiều, tối`))
    need(b.plan.fees[0] > 0 && b.plan.fees[0] <= b.plan.fees[1], 'Lịch trình: phí tham quan tiết kiệm phải > 0 và ≤ mức thoải mái')

    const p = b.place
    need(filled(p.city), 'Quán & lưu trú: thiếu tên thành phố (không dấu, dùng cho link đặt phòng)')
    need(/^[A-Z]{3}$/.test(p.airport || ''), 'Quán & lưu trú: mã sân bay gần nhất gồm 3 chữ in hoa (vd. HAN)')
    need(pairFilled(p.getThere), 'Quán & lưu trú: cách đi tới cần cả tiếng Việt và tiếng Anh')
    const priceOk = r => Array.isArray(r) && r[0] > 0 && r[0] < r[1]
    need(p.eats.length >= 3, 'Quán & lưu trú: cần ít nhất 3 quán ăn')
    p.eats.forEach((x, i) => need(filled(x.address) && pairFilled(x.dish) && priceOk(x.price) && YM_RE.test(x.updated || ''), `Quán ăn ${i + 1} (${x.name}): thiếu địa chỉ, món (2 thứ tiếng), giá thấp < cao hoặc tháng cập nhật`))
    need(p.cafes.length >= 3, 'Quán & lưu trú: cần ít nhất 3 quán cà phê / quán nước')
    p.cafes.forEach((x, i) => need(filled(x.address) && pairFilled(x.drink) && priceOk(x.price) && YM_RE.test(x.updated || ''), `Quán nước ${i + 1} (${x.name}): thiếu địa chỉ, đồ uống (2 thứ tiếng), giá thấp < cao hoặc tháng cập nhật`))
    need(p.stays.length >= 2, 'Quán & lưu trú: cần ít nhất 2 khu lưu trú')
    p.stays.forEach((x, i) => need(pairFilled(x.area) && pairFilled(x.note) && priceOk(x.price) && state.data.places.stayTypes[x.type], `Lưu trú ${i + 1}: thiếu khu vực / ghi chú (2 thứ tiếng), loại hoặc giá thấp < cao`))

    need(b.sights.length === DAYS, `Điểm tham quan: cần đủ ${DAYS} ngày`)
    let cafes = 0
    b.sights.forEach((list, i) => {
        need(list.length > 0, `Điểm tham quan ngày ${i + 1}: chưa có điểm nào`)
        list.forEach(s => {
            need(pairFilled(s.name) && filled(s.address) && filled(s.hours), `Điểm tham quan ngày ${i + 1}: "${s.name[0] || '?'}" thiếu tên (2 thứ tiếng), địa chỉ hoặc giờ mở cửa`)
            if (Array.isArray(s.price)) need(s.price[0] >= 0 && s.price[0] < s.price[1], `Điểm tham quan ngày ${i + 1}: "${s.name[0]}" giá thấp phải < giá cao`)
            if (s.cafe) {
                cafes++
                need(pairFilled(s.cafe.drink) && priceOk(s.cafe.price), `Điểm tham quan ngày ${i + 1}: quán cạnh "${s.name[0]}" thiếu đồ uống (2 thứ tiếng) hoặc giá`)
            }
        })
    })
    need(cafes >= 6, `Điểm tham quan: cần ít nhất 6 quán nước gần điểm (đang có ${cafes})`)

    TR_LANGS.forEach(lang => {
        alignTranslation(b, lang)
        const { dest: t, days } = exportTranslation(b, lang)
        const name = LANG_NAMES[lang]
        const groupFull = (key, arr, test) => {
            if (t[key] && !arr.every(test)) e.push(`Bản dịch ${name}: mục "${key}" đã dịch một phần – dịch đủ hoặc để trống cả mục`)
        }
        groupFull('highlights', t.highlights || [], filled)
        groupFull('tips', t.tips || [], filled)
        groupFull('gallery', t.gallery || [], g => filled(g.caption))
        groupFull('foods', t.foods || [], f => filled(f.name) && filled(f.desc) && (!('illustrative' in f) || filled(f.illustrative)))
        groupFull('activities', t.activities || [], a => filled(a.title) && filled(a.desc))
        if (lang === 'en') {
            for (const k of ['name', 'province', 'tagline', 'description', 'bestTime', 'duration', 'highlights', 'gallery', 'foods', 'activities', 'tips']) {
                if (!t[k]) e.push(`Bản dịch English (bắt buộc): thiếu "${k}"`)
            }
            if (!days || !days.every(day => ['title', 'morning', 'afternoon', 'evening'].every(k => filled(day[k])))) e.push('Bản dịch English (bắt buộc): lịch trình cần đủ tiêu đề, sáng, chiều, tối cho cả 5 ngày')
        } else if (days && !days.every(day => filled(day.title))) {
            e.push(`Bản dịch ${name}: tên ngày trong lịch trình đã dịch một phần – dịch đủ hoặc để trống`)
        }
    })
    return e
}

/*---------- Áp dụng vào file JSON ----------*/
/* Giữ thứ tự khóa như bản cũ để diff của PR chỉ gồm phần thật sự sửa */
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v)
function ordered(value, ref) {
    if (Array.isArray(value)) return value.map((x, i) => ordered(x, Array.isArray(ref) ? ref[i] : undefined))
    if (!isObj(value)) return value
    const old = isObj(ref) ? Object.keys(ref).filter(k => k in value) : []
    const keys = [...old, ...Object.keys(value).filter(k => !old.includes(k))]
    return Object.fromEntries(keys.map(k => [k, ordered(value[k], isObj(ref) ? ref[k] : undefined)]))
}

function buildFiles(b) {
    const d = clone(state.data)
    const id = b.dest.id
    const list = d.destinations.destinations
    const idx = list.findIndex(x => x.id === (state.isNew ? null : state.id))
    if (idx >= 0) list[idx] = ordered(b.dest, list[idx])
    else list.push(b.dest)
    d.itineraries.itineraries[id] = ordered(b.plan, d.itineraries.itineraries[id])
    d.places.places[id] = ordered(b.place, d.places.places[id])
    d.sights.sights[id] = ordered(b.sights, d.sights.sights[id])
    TR_LANGS.forEach(lang => {
        const { dest, days } = exportTranslation(b, lang)
        d[lang].destinations = d[lang].destinations || {}
        d[lang].itineraries = d[lang].itineraries || {}
        if (Object.keys(dest).length) d[lang].destinations[id] = ordered(dest, d[lang].destinations[id])
        else delete d[lang].destinations[id]
        if (days) d[lang].itineraries[id] = ordered({ days }, d[lang].itineraries[id])
        else delete d[lang].itineraries[id]
    })
    const changed = {}
    Object.keys(FILES).forEach(key => {
        const text = `${JSON.stringify(d[key], null, 2)}\n`
        if (text !== state.texts[key]) changed[FILES[key]] = text
    })
    return changed
}

async function saveAsPullRequest(b, note) {
    const action = state.isNew ? 'Thêm' : 'Cập nhật'
    return createPullRequest(buildFiles(b), {
        title: `${action} điểm đến: ${b.dest.name}`,
        slug: b.dest.id,
        summary: `${action} dữ liệu điểm đến **${b.dest.name}** (\`${b.dest.id}\`) từ trang quản trị.`,
    }, note)
}

async function createPullRequest(changed, { title, slug, summary }, note) {
    const paths = Object.keys(changed)
    if (!paths.length) throw new Error('Không có thay đổi nào so với dữ liệu hiện tại.')
    const baseCommit = await gh(`/repos/${REPO}/git/commits/${state.baseSha}`)
    const tree = await gh(`/repos/${REPO}/git/trees`, {
        method: 'POST',
        body: {
            base_tree: baseCommit.tree.sha,
            tree: paths.map(path => ({ path, mode: '100644', type: 'blob', content: changed[path] })),
        },
    })
    const message = `${title}\n\nTạo từ trang quản trị dữ liệu (/admin) bởi ${state.user}.${note ? `\n\n${note}` : ''}`
    const commit = await gh(`/repos/${REPO}/git/commits`, { method: 'POST', body: { message, tree: tree.sha, parents: [state.baseSha] } })
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
    const branch = `admin/${slug}-${stamp}`
    await gh(`/repos/${REPO}/git/refs`, { method: 'POST', body: { ref: `refs/heads/${branch}`, sha: commit.sha } })
    const body = [
        summary,
        note ? `\n> ${note.replace(/\n/g, '\n> ')}` : '',
        '\n**File thay đổi:**',
        ...paths.map(p => `- \`${p}\``),
        '\nWorkflow **Kiểm tra PR từ trang quản trị** sẽ tự build lại trang, thêm commit vào PR này và chạy toàn bộ test.',
        'Khi kiểm tra xanh: xem lại thay đổi rồi merge – Cloudflare tự deploy, ảnh mới được tải về tự động.',
    ].join('\n')
    return gh(`/repos/${REPO}/pulls`, { method: 'POST', body: { title, head: branch, base: BASE_BRANCH, body } })
}

/*==================== GIAO DIỆN & MÙA (data/site.json) ====================*/
const SITE_LANGS = ['vi', 'en', 'ko', 'zh', 'ja']
const SITE_LANG_LABELS = { vi: 'Tiếng Việt *', en: 'English *', ko: '한국어', zh: '中文', ja: '日本語' }
const DEFAULT_THEME = { hue: 190, accentHue: 38 }
const THEME_PRESETS = [
    ['Biển xanh (mặc định)', 190, 38], ['Tết đỏ – vàng', 355, 40], ['Hoa đào hồng', 340, 38], ['Hè biển xanh', 205, 28],
    ['Lúa chín – thu vàng', 28, 38], ['Núi rừng xanh lá', 150, 38], ['Tím hoa sim', 270, 30], ['Giáng sinh', 145, 20],
]

/* Bản sao tools/theme.js (contrastIssues) – build kiểm tra lại khi mở PR */
function hslToRgb(h, sat, l) {
    h = ((h % 360) + 360) % 360
    sat /= 100
    l /= 100
    const k = n => (n + h / 30) % 12
    const a = sat * Math.min(l, 1 - l)
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
    return [f(0), f(8), f(4)]
}
const luminance = rgb => {
    const [r, g, b] = rgb.map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrastRatio(a, b) {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
}
function contrastIssues({ hue, accentHue }) {
    const white = [1, 1, 1]
    return [
        ['Nút / chữ trắng trên màu chủ đạo', hslToRgb(hue, 64, 22), white],
        ['Tiêu đề trên nền sáng', hslToRgb(hue, 64, 18), hslToRgb(hue, 100, 99)],
        ['Chữ thường trên nền sáng', hslToRgb(hue, 24, 35), hslToRgb(hue, 100, 99)],
        ['Chữ nhấn trên nền sáng', hslToRgb(accentHue - 5, 90, 31), hslToRgb(hue, 100, 99)],
        ['Chữ nhấn trên thẻ trắng', hslToRgb(accentHue - 6, 90, 34), white],
        ['Chữ nhấn trên nền tối', hslToRgb(accentHue, 92, 55), hslToRgb(hue, 29, 16)],
        ['Chữ thường trên nền tối', hslToRgb(hue, 8, 75), hslToRgb(hue, 29, 12)],
    ].map(([label, fg, bg]) => ({ label, ratio: contrastRatio(fg, bg) }))
        .filter(p => p.ratio < 4.5)
        .map(p => `${p.label}: ${p.ratio.toFixed(2)}:1 (cần ≥ 4.5:1)`)
}

/* Mùa đang có hiệu lực hôm nay (giống script trên site) */
function seasonActive(season, iso) {
    if (season.from.length > 5) return iso >= season.from && iso <= season.to
    const md = iso.slice(5, 10)
    return season.from <= season.to ? md >= season.from && md <= season.to : md >= season.from || md <= season.to
}

const joinFiles = files => (files || []).join(' | ')
const splitFiles = text => String(text || '').split('|').map(x => x.trim()).filter(Boolean)
const langText = map => Object.fromEntries(SITE_LANGS.map(l => [l, (map && map[l]) || '']))

/* data/site.json → dạng dễ sửa trên form (mọi khối tùy chọn đều có sẵn, để trống = không dùng) */
function toEditableSite(site) {
    return {
        theme: { ...site.theme },
        hero: { subtitle: langText(site.hero.subtitle), title: langText(site.hero.title), image: joinFiles(site.hero.image), alt: langText(site.hero.alt) },
        featured: [...site.featured],
        featuredTitle: langText(site.featuredTitle),
        seasons: site.seasons.map(sea => {
            const hero = sea.hero || {}
            return {
                id: sea.id, name: sea.name, enabled: sea.enabled, from: sea.from, to: sea.to,
                useTheme: !!sea.theme, theme: { ...(sea.theme || site.theme) },
                hero: { subtitle: langText(hero.subtitle), title: langText(hero.title), image: joinFiles(hero.image), alt: langText(hero.alt) },
                banner: { text: langText(sea.banner && sea.banner.text), link: (sea.banner && sea.banner.link) || '' },
                featured: [...(sea.featured || [])],
                featuredTitle: langText(sea.featuredTitle),
            }
        }),
    }
}

const newSeason = () => ({
    id: '', name: '', enabled: true, from: '', to: '', useTheme: false, theme: { ...DEFAULT_THEME },
    hero: { subtitle: langText(), title: langText(), image: '', alt: langText() },
    banner: { text: langText(), link: '' }, featured: [], featuredTitle: langText(),
})

/* Chữ theo ngôn ngữ: bỏ ô trống; cả khối trống → undefined */
function cleanText(map) {
    const out = {}
    SITE_LANGS.forEach(l => { const v = String(map[l] || '').trim(); if (v) out[l] = v })
    return Object.keys(out).length ? out : undefined
}

/* Dạng form → data/site.json (giữ thứ tự khóa như file gốc) */
function fromEditableSite(e) {
    const site = {
        $schema: (state.data.site && state.data.site.$schema) || './schema/site.schema.json',
        theme: { hue: Number(e.theme.hue), accentHue: Number(e.theme.accentHue) },
        hero: { subtitle: cleanText(e.hero.subtitle), title: cleanText(e.hero.title), image: splitFiles(e.hero.image), alt: cleanText(e.hero.alt) },
        featured: e.featured,
        featuredTitle: cleanText(e.featuredTitle),
        seasons: e.seasons.map(sea => {
            const out = { id: sea.id.trim(), name: sea.name.trim(), enabled: !!sea.enabled, from: sea.from.trim(), to: sea.to.trim() }
            if (sea.useTheme) out.theme = { hue: Number(sea.theme.hue), accentHue: Number(sea.theme.accentHue) }
            const hero = {}
            for (const k of ['subtitle', 'title']) { const t = cleanText(sea.hero[k]); if (t) hero[k] = t }
            const image = splitFiles(sea.hero.image)
            if (image.length) {
                hero.image = image
                const alt = cleanText(sea.hero.alt)
                if (alt) hero.alt = alt
            }
            if (Object.keys(hero).length) out.hero = hero
            const text = cleanText(sea.banner.text)
            if (text) out.banner = sea.banner.link.trim() ? { text, link: sea.banner.link.trim() } : { text }
            if (sea.featured.length) {
                out.featured = sea.featured
                out.featuredTitle = cleanText(sea.featuredTitle)
            }
            return out
        }),
    }
    return ordered(site, state.data.site)
}

const DAY_RE = /^(20[0-9]{2}-)?(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
const LINK_RE = /^(https:\/\/\S+|[a-z0-9-]+(\/[a-z0-9-]+)*\/index\.html)$/

/* Kiểm tra trước khi lưu (build kiểm tra lại theo data/schema/site.schema.json) */
function validateSite(site) {
    const e = []
    const ids = new Set(state.data.destinations.destinations.map(d => d.id))
    const text = (where, map, required) => {
        if (!map) { if (required) e.push(`${where}: chưa nhập`); return }
        if (!map.vi || !map.en) e.push(`${where}: cần ít nhất tiếng Việt và tiếng Anh`)
    }
    const images = (where, list) => list.forEach(f => { if (!IMAGE_RE.test(f)) e.push(`${where}: "${f}" không phải tên file ảnh .jpg/.png/.webp`) })
    const featured = (where, list) => {
        if (list.length < 3 || list.length > 12) e.push(`${where}: chọn 3 – 12 điểm đến nổi bật (đang chọn ${list.length})`)
    }
    const theme = (where, t) => contrastIssues(t).forEach(m => e.push(`${where}: màu chưa đủ tương phản – ${m}`))
    theme('Mặc định', site.theme)
    text('Mặc định – dòng chữ nhỏ', site.hero.subtitle, true)
    text('Mặc định – slogan', site.hero.title, true)
    text('Mặc định – mô tả ảnh', site.hero.alt, true)
    if (!site.hero.image.length) e.push('Mặc định: cần ảnh bìa')
    images('Mặc định – ảnh bìa', site.hero.image)
    featured('Mặc định', site.featured)
    text('Mặc định – tiêu đề mục nổi bật', site.featuredTitle, true)
    const seen = new Set()
    site.seasons.forEach((sea, i) => {
        const w = `Mùa ${i + 1} (${sea.name || sea.id || 'chưa đặt tên'})`
        if (!ID_RE.test(sea.id)) e.push(`${w}: mã chỉ gồm chữ thường không dấu, số, gạch nối (vd. tet-2027)`)
        if (seen.has(sea.id)) e.push(`${w}: mã bị trùng`)
        seen.add(sea.id)
        if (!sea.name) e.push(`${w}: thiếu tên`)
        if (!DAY_RE.test(sea.from) || !DAY_RE.test(sea.to)) e.push(`${w}: ngày dạng MM-DD (hằng năm) hoặc YYYY-MM-DD (một lần)`)
        else if (sea.from.length !== sea.to.length) e.push(`${w}: ngày bắt đầu và kết thúc phải cùng dạng`)
        else if (sea.from.length > 5 && sea.from > sea.to) e.push(`${w}: ngày bắt đầu sau ngày kết thúc`)
        if (sea.theme) theme(w, sea.theme)
        if (sea.hero) {
            for (const k of ['subtitle', 'title', 'alt']) if (sea.hero[k]) text(`${w} – ${k === 'alt' ? 'mô tả ảnh' : k === 'title' ? 'slogan' : 'dòng chữ nhỏ'}`, sea.hero[k])
            if (sea.hero.image) images(w, sea.hero.image)
        }
        if (sea.banner) {
            text(`${w} – thông báo`, sea.banner.text)
            if (sea.banner.link && !LINK_RE.test(sea.banner.link)) e.push(`${w}: liên kết thông báo phải dạng diem-den/<mã>/index.html, thang/9/index.html… hoặc https://…`)
        }
        if (sea.featured) {
            featured(w, sea.featured)
            text(`${w} – tiêu đề mục nổi bật`, sea.featuredTitle, true)
            sea.featured.filter(id => !ids.has(id)).forEach(id => e.push(`${w}: điểm đến ${id} không tồn tại`))
        }
    })
    return e
}

function buildSiteFiles(site) {
    const text = `${JSON.stringify(site, null, 2)}\n`
    return text === state.texts.site ? {} : { [FILES.site]: text }
}

/*==================== GIAO DIỆN ====================*/
/*
 * Form khai báo bằng đặc tả trường: { type, path, label, ... }. Ô nhập mang data-path (JSON) và data-kind;
 * một bộ lắng nghe chung cập nhật state.bundle; thêm / xóa / đổi chỗ mục trong danh sách thì vẽ lại tab.
 */
function attrs(path, kind) {
    return `data-path="${esc(JSON.stringify(path))}" data-kind="${kind}"`
}

function field(spec) {
    const b = state.bundle
    const v = spec.path ? get(b, spec.path) : undefined
    const label = spec.label ? `<label>${esc(spec.label)}</label>` : ''
    const help = spec.help ? `<div class="field__help">${spec.help}</div>` : ''
    const src = spec.src !== undefined ? `<div class="field__src">🇻🇳 ${esc(spec.src) || '<em>(trống)</em>'}</div>` : ''
    let input = ''
    switch (spec.type) {
        case 'text':
            input = `<input type="text" ${attrs(spec.path, 'text')} value="${esc(v)}"${spec.placeholder ? ` placeholder="${esc(spec.placeholder)}"` : ''}${spec.list ? ` list="${spec.list}"` : ''}>`
            break
        case 'textarea':
            input = `<textarea ${attrs(spec.path, 'text')} rows="${spec.rows || 3}">${esc(v)}</textarea>`
            break
        case 'number':
            input = `<input type="number" ${attrs(spec.path, 'number')} value="${esc(v)}" step="${spec.step || 'any'}">`
            break
        case 'select':
            input = `<select ${attrs(spec.path, spec.numeric ? 'number' : 'text')}>${Object.entries(spec.options).map(([k, l]) => `<option value="${esc(k)}"${String(v) === String(k) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`
            break
        case 'checks':
            input = `<div class="checks">${Object.entries(spec.options).map(([k, l]) => `<label><input type="checkbox" ${attrs(spec.path, spec.numeric ? 'check-number' : 'check')} value="${esc(k)}"${(v || []).map(String).includes(String(k)) ? ' checked' : ''}> ${esc(l)}</label>`).join('')}</div>`
            break
        case 'lines':
            input = `<textarea ${attrs(spec.path, 'lines')} rows="${Math.max(3, (v || []).length + 1)}">${esc((v || []).join('\n'))}</textarea>`
            break
        case 'pair':
            input = `<div class="grid grid--2">
                <div>${spec.multiline ? `<textarea ${attrs([...spec.path, 0], 'text')} rows="2" placeholder="Tiếng Việt">${esc(v?.[0])}</textarea>` : `<input type="text" ${attrs([...spec.path, 0], 'text')} value="${esc(v?.[0])}" placeholder="Tiếng Việt">`}</div>
                <div>${spec.multiline ? `<textarea ${attrs([...spec.path, 1], 'text')} rows="2" placeholder="English">${esc(v?.[1])}</textarea>` : `<input type="text" ${attrs([...spec.path, 1], 'text')} value="${esc(v?.[1])}" placeholder="English">`}</div>
            </div>`
            break
        case 'range':
            input = `<div class="grid grid--2">
                <input type="number" ${attrs([...spec.path, 0], 'number')} value="${esc(v?.[0])}" step="1000" placeholder="${esc(spec.low || 'Thấp')}">
                <input type="number" ${attrs([...spec.path, 1], 'number')} value="${esc(v?.[1])}" step="1000" placeholder="${esc(spec.high || 'Cao')}">
            </div>`
            break
        case 'price': {
            const [lo, hi] = Array.isArray(v) ? v : [v, '']
            input = `<div class="grid grid--2">
                <input type="number" ${attrs(spec.path, 'price-lo')} value="${esc(lo)}" step="1000" placeholder="Giá (hoặc giá thấp)">
                <input type="number" ${attrs(spec.path, 'price-hi')} value="${esc(hi)}" step="1000" placeholder="Giá cao (để trống nếu một giá)">
            </div>`
            break
        }
        case 'image': {
            const file = Array.isArray(v) ? v.join(' | ') : v || ''
            const first = file.split('|')[0].trim()
            input = `<input type="text" ${attrs(spec.path, spec.multi ? 'files' : 'text')} value="${esc(file)}" placeholder="Tên file trên Wikimedia Commons, vd. Hoi An Ancient Town.jpg">
                ${first ? `<a href="${commonsPage(first)}" target="_blank" rel="noopener"><img class="thumb" src="${thumbUrl(first)}" alt="" loading="lazy" onerror="this.classList.add('thumb--missing');this.alt='Không tìm thấy ảnh trên Commons'"></a>` : ''}`
            break
        }
        case 'langtext':
            input = `<div class="grid grid--langs">${SITE_LANGS.map(l => `<div><span class="field__lang">${SITE_LANG_LABELS[l]}</span>${spec.multiline
                ? `<textarea ${attrs([...spec.path, l], 'text')} rows="${spec.rows || 3}">${esc(v?.[l])}</textarea>`
                : `<input type="text" ${attrs([...spec.path, l], 'text')} value="${esc(v?.[l])}">`}</div>`).join('')}</div>`
            break
        case 'bool':
            input = `<label class="checks"><input type="checkbox" ${attrs(spec.path, 'bool')}${v ? ' checked' : ''}> ${esc(spec.text || '')}</label>`
            break
        case 'theme':
            input = themeField(spec.path, v)
            break
        case 'list':
            return listField(spec, v || [])
        case 'group':
            return `<div class="grid grid--${spec.cols || 2}">${spec.fields.map(field).join('')}</div>`
        case 'html':
            return spec.html
        default:
            input = ''
    }
    return `<div class="field">${label}${src}${input}${help}</div>`
}

/* Mục danh sách thu gọn được (nhớ trạng thái mở theo đường dẫn); danh sách ngắn mở sẵn */
function listField(spec, items) {
    const path = spec.path
    const rows = items.map((item, i) => {
        const key = JSON.stringify([...path, i])
        const open = state.open.has(key) ? state.open.get(key) : items.length <= 3
        return `
        <details class="list__item" data-key="${esc(key)}"${open ? ' open' : ''}>
            <summary class="list__head">
                <span class="list__label"><span class="list__num">${i + 1}</span>${esc(spec.itemLabel ? spec.itemLabel(item, i) : `#${i + 1}`)}</span>
                ${spec.fixed ? '' : `<span class="list__tools">
                    <button type="button" class="icon-btn" data-op="up" ${attrs([...path, i], 'op')} title="Lên"${i === 0 ? ' disabled' : ''}>↑</button>
                    <button type="button" class="icon-btn" data-op="down" ${attrs([...path, i], 'op')} title="Xuống"${i === items.length - 1 ? ' disabled' : ''}>↓</button>
                    <button type="button" class="icon-btn icon-btn--danger" data-op="del" ${attrs([...path, i], 'op')} title="Xóa">Xóa</button>
                </span>`}
            </summary>
            <div class="list__body">${spec.fields(i).map(field).join('')}</div>
        </details>`
    }).join('')
    return `<div class="field">
        ${spec.label ? `<h3>${esc(spec.label)}</h3>` : ''}
        ${spec.help ? `<div class="field__help">${spec.help}</div>` : ''}
        <div class="list">${rows || '<p class="muted small">Chưa có mục nào.</p>'}</div>
        ${spec.fixed ? '' : `<p><button type="button" class="btn btn--ghost btn--sm" data-op="add" data-template="${esc(JSON.stringify(spec.newItem()))}" ${attrs(path, 'op')}>+ ${esc(spec.addLabel || 'Thêm')}</button></p>`}
    </div>`
}

/*---------- Chọn màu (giao diện & mùa) ----------*/
function themePreview({ hue, accentHue }) {
    const issues = contrastIssues({ hue, accentHue })
    return `<div class="tp" style="--h:${Number(hue)};--a:${Number(accentHue)}">
            <div class="tp__box tp__box--light"><span class="tp__sub">Chữ nhấn</span><strong class="tp__title">Tiêu đề trang</strong><span class="tp__text">Chữ nội dung thường</span><span class="tp__btn">Nút bấm</span></div>
            <div class="tp__box tp__box--dark"><span class="tp__sub">Chữ nhấn</span><strong class="tp__title">Chế độ tối</strong><span class="tp__text">Chữ nội dung thường</span><span class="tp__btn">Nút bấm</span></div>
        </div>
        <div class="tp__issues">${issues.length ? `<div class="errors">⚠ Chưa đủ tương phản (chữ khó đọc) – chọn màu khác:<ul>${issues.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>` : '<p class="small tp__ok">✔ Độ tương phản đạt chuẩn WCAG AA</p>'}</div>`
}

function themeField(path, t) {
    const presets = THEME_PRESETS.map(([name, h, a]) => `<button type="button" class="preset" data-preset="${h},${a}" data-path="${esc(JSON.stringify(path))}" title="${esc(name)}">
            <span class="preset__dot" style="background:hsl(${h}, 64%, 22%)"></span><span class="preset__dot" style="background:hsl(${a}, 92%, 55%)"></span>${esc(name)}</button>`).join('')
    return `<div class="theme-field">
        <div class="presets">${presets}</div>
        <div class="grid grid--2">
            <div><span class="field__lang">Màu chủ đạo (nút, tiêu đề, nền) – <output data-out="hue">${t.hue}</output></span>
                <input type="range" class="hue-range" min="0" max="359" ${attrs([...path, 'hue'], 'number')} value="${t.hue}"></div>
            <div><span class="field__lang">Màu nhấn (chữ nhỏ, sao đánh giá) – <output data-out="accentHue">${t.accentHue}</output></span>
                <input type="range" class="hue-range" min="0" max="359" ${attrs([...path, 'accentHue'], 'number')} value="${t.accentHue}"></div>
        </div>
        <div class="theme-preview">${themePreview(t)}</div>
    </div>`
}

/*---------- Tab của trang Giao diện & mùa ----------*/
const destOptions = () => Object.fromEntries(state.data.destinations.destinations.map(d => [d.id, d.name]))
const SLOGAN_HELP = 'Xuống dòng = xuống dòng trên trang; <code>*chữ*</code> = in đậm. Tiếng Việt và tiếng Anh bắt buộc; ngôn ngữ để trống sẽ hiện tiếng Anh.'
const LINK_HELP = 'Trang trong site, vd. <code>diem-den/mu-cang-chai/index.html</code>, <code>thang/9/index.html</code>, <code>chu-de/bien/index.html</code>, <code>ke-hoach/index.html</code> – hoặc địa chỉ <code>https://…</code>. Để trống = chỉ hiện chữ.'

function siteGeneralFields() {
    return [
        { type: 'html', html: '<p class="muted small">Áp dụng khi không có mùa nào đang chạy. Mỗi mùa (tab bên cạnh) có thể đổi màu, slogan, ảnh bìa, thêm dải thông báo và danh sách điểm đến nổi bật trong khoảng ngày của nó – site tự đổi theo ngày, không cần build lại.</p>' },
        { type: 'theme', path: ['site', 'theme'], label: 'Màu giao diện' },
        { type: 'langtext', path: ['site', 'hero', 'subtitle'], label: 'Dòng chữ nhỏ trên slogan' },
        { type: 'langtext', path: ['site', 'hero', 'title'], label: 'Slogan (tiêu đề lớn trang chủ)', multiline: true, help: SLOGAN_HELP },
        { type: 'image', path: ['site', 'hero', 'image'], label: 'Ảnh bìa trang chủ (ảnh ngang, nhiều ảnh dự phòng: ngăn cách bằng |)', multi: true },
        { type: 'langtext', path: ['site', 'hero', 'alt'], label: 'Mô tả ảnh bìa' },
        { type: 'langtext', path: ['site', 'featuredTitle'], label: 'Tiêu đề mục "điểm đến nổi bật"', multiline: true, rows: 2, help: SLOGAN_HELP },
        { type: 'checks', path: ['site', 'featured'], label: 'Điểm đến nổi bật (3 – 12, hiện theo thứ tự tích chọn)', options: destOptions() },
    ]
}

function seasonFields(i) {
    const sea = state.bundle.site.seasons[i]
    const n = state.bundle.site.seasons.length
    const today = new Date().toISOString().slice(0, 10)
    const live = DAY_RE.test(sea.from) && DAY_RE.test(sea.to) && sea.from.length === sea.to.length && sea.enabled && seasonActive(sea, today)
    const base = ['site', 'seasons', i]
    return [
        { type: 'html', html: `<div class="toolbar">
                <span class="badge ${live ? 'badge--ok' : 'badge--miss'}">${live ? 'Đang chạy hôm nay' : sea.enabled ? 'Chưa tới / đã qua' : 'Đang tắt'}</span>
                ${ID_RE.test(sea.id) ? `<a href="${SITE_URL}?season=${sea.id}" target="_blank" rel="noopener">Xem thử trên site ↗</a><span class="muted small">(mùa mới / thay đổi chỉ thấy sau khi merge PR)</span>` : ''}
                <span style="margin-left:auto"></span>
                <button type="button" class="icon-btn" data-season-op="up" data-index="${i}"${i === 0 ? ' disabled' : ''} title="Ưu tiên hơn">↑ Ưu tiên</button>
                <button type="button" class="icon-btn" data-season-op="down" data-index="${i}"${i === n - 1 ? ' disabled' : ''}>↓</button>
                <button type="button" class="icon-btn icon-btn--danger" data-season-op="del" data-index="${i}">Xóa mùa</button>
            </div>
            <p class="muted small">Mùa đứng trước được ưu tiên khi trùng ngày. Ô nào để trống thì dùng nội dung mặc định.</p>` },
        { type: 'group', fields: [
            { type: 'text', path: [...base, 'name'], label: 'Tên mùa / chiến dịch (chỉ hiện ở đây)', placeholder: 'vd. Tết 2027' },
            { type: 'text', path: [...base, 'id'], label: 'Mã (dùng để xem thử ?season=…)', placeholder: 'vd. tet-2027' },
        ] },
        { type: 'group', cols: 3, fields: [
            { type: 'text', path: [...base, 'from'], label: 'Từ ngày', placeholder: 'MM-DD hoặc YYYY-MM-DD', help: 'MM-DD lặp lại hằng năm (vd. 12-20 → 01-05 vắt qua năm mới); YYYY-MM-DD chỉ một lần (Tết âm lịch).' },
            { type: 'text', path: [...base, 'to'], label: 'Đến ngày', placeholder: 'MM-DD hoặc YYYY-MM-DD' },
            { type: 'bool', path: [...base, 'enabled'], label: 'Trạng thái', text: 'Bật (tự chạy theo ngày)' },
        ] },
        { type: 'html', html: '<h3>Màu</h3>' },
        { type: 'bool', path: [...base, 'useTheme'], text: 'Đổi màu giao diện trong mùa này (mọi trang)' },
        ...(sea.useTheme ? [{ type: 'theme', path: [...base, 'theme'] }] : []),
        { type: 'html', html: '<h3>Trang chủ</h3>' },
        { type: 'langtext', path: [...base, 'hero', 'subtitle'], label: 'Dòng chữ nhỏ trên slogan' },
        { type: 'langtext', path: [...base, 'hero', 'title'], label: 'Slogan', multiline: true, help: SLOGAN_HELP },
        { type: 'image', path: [...base, 'hero', 'image'], label: 'Ảnh bìa (để trống = ảnh mặc định)', multi: true },
        { type: 'langtext', path: [...base, 'hero', 'alt'], label: 'Mô tả ảnh bìa' },
        { type: 'langtext', path: [...base, 'banner', 'text'], label: 'Dải thông báo trên slogan (để trống = không hiện)' },
        { type: 'text', path: [...base, 'banner', 'link'], label: 'Liên kết của thông báo', list: 'link-list', help: LINK_HELP },
        { type: 'checks', path: [...base, 'featured'], label: 'Điểm đến nổi bật trong mùa (3 – 12, để trống = mặc định)', options: destOptions() },
        { type: 'langtext', path: [...base, 'featuredTitle'], label: 'Tiêu đề mục nổi bật trong mùa', multiline: true, rows: 2 },
    ]
}

function linkDatalist() {
    const links = ['ke-hoach/index.html', 'cam-nang/index.html',
        ...Array.from({ length: 12 }, (_, i) => `thang/${i + 1}/index.html`),
        ...Object.keys(state.data.destinations.categories).map(c => `chu-de/${c}/index.html`),
        ...state.data.destinations.destinations.map(d => `diem-den/${d.id}/index.html`)]
    return `<datalist id="link-list">${links.map(l => `<option value="${l}">`).join('')}</datalist>`
}

function currentTabs() {
    if (state.mode !== 'site') return TABS
    const tabs = { general: { label: 'Mặc định', fields: siteGeneralFields } }
    const today = new Date().toISOString().slice(0, 10)
    state.bundle.site.seasons.forEach((sea, i) => {
        const live = sea.enabled && DAY_RE.test(sea.from) && DAY_RE.test(sea.to) && sea.from.length === sea.to.length && seasonActive(sea, today)
        tabs[`s${i}`] = { label: `${live ? '● ' : ''}${sea.name || 'Mùa mới'}`, fields: () => seasonFields(i) }
    })
    return tabs
}

/*---------- Đặc tả từng tab ----------*/
const MONTHS = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, `T${i + 1}`]))
const AT = { m: 'Sáng', a: 'Chiều', e: 'Tối' }
const ICON_HELP = 'Biểu tượng <a href="https://remixicon.com" target="_blank" rel="noopener">Remix Icon</a> dạng <code>ri-…-line</code>. Biểu tượng mới được tự thêm vào bộ icon khi build.'

const TABS = {
    info: {
        label: 'Thông tin chung',
        fields: () => [
            ...(state.isNew ? [{ type: 'text', path: ['dest', 'id'], label: 'Mã điểm đến (đường dẫn)', placeholder: 'vd. tam-dao', help: 'Chữ thường không dấu, số, gạch nối. Không đổi được sau khi tạo.' }] : []),
            { type: 'group', fields: [
                { type: 'text', path: ['dest', 'name'], label: 'Tên điểm đến' },
                { type: 'text', path: ['dest', 'province'], label: 'Tỉnh / thành', help: 'Sau sáp nhập ghi kèm tên cũ, vd. "Phú Thọ (Vĩnh Phúc cũ)"' },
            ] },
            { type: 'group', fields: [
                { type: 'select', path: ['dest', 'region'], label: 'Vùng miền', options: state.data.destinations.regions },
                { type: 'checks', path: ['dest', 'categories'], label: 'Loại hình', options: state.data.destinations.categories },
            ] },
            { type: 'group', cols: 3, fields: [
                { type: 'number', path: ['dest', 'rating'], label: 'Đánh giá (0–5)', step: '0.1' },
                { type: 'number', path: ['dest', 'lat'], label: 'Vĩ độ', step: '0.0001' },
                { type: 'number', path: ['dest', 'lng'], label: 'Kinh độ', step: '0.0001' },
            ] },
            { type: 'checks', path: ['dest', 'bestMonths'], label: 'Tháng đẹp nhất', options: MONTHS, numeric: true },
            { type: 'text', path: ['dest', 'tagline'], label: 'Câu giới thiệu ngắn' },
            { type: 'textarea', path: ['dest', 'description'], label: 'Mô tả', rows: 5 },
            { type: 'lines', path: ['dest', 'highlights'], label: 'Điểm nổi bật (mỗi dòng một điểm)' },
            { type: 'group', fields: [
                { type: 'text', path: ['dest', 'bestTime'], label: 'Thời điểm đẹp (chữ)', placeholder: 'vd. Tháng 4 – 9' },
                { type: 'text', path: ['dest', 'duration'], label: 'Số ngày nên đi', placeholder: 'vd. 2 – 3 ngày' },
            ] },
        ],
    },
    images: {
        label: 'Ảnh',
        fields: () => [
            { type: 'html', html: `<p class="muted small">Ảnh lấy từ <a href="https://commons.wikimedia.org" target="_blank" rel="noopener">Wikimedia Commons</a> (giấy phép tự do) – nhập đúng tên file, ảnh xem trước hiện bên dưới (viền đỏ = không tìm thấy). Tìm ảnh nhanh: tab Actions → <a href="https://github.com/${REPO}/actions/workflows/find-images.yml" target="_blank" rel="noopener">Tìm ảnh Wikimedia</a> (tích "Ảnh xem trước"). Sau khi merge, ảnh được tự tải về và tối ưu.</p>` },
            { type: 'image', path: ['dest', 'hero'], label: 'Ảnh bìa (ảnh ngang, đẹp nhất)' },
            { type: 'list', path: ['dest', 'gallery'], label: 'Thư viện ảnh', addLabel: 'Thêm ảnh', newItem: () => ({ file: '', caption: '' }),
                itemLabel: g => g.caption || 'Ảnh',
                fields: i => [
                    { type: 'image', path: ['dest', 'gallery', i, 'file'], label: 'Tên file' },
                    { type: 'text', path: ['dest', 'gallery', i, 'caption'], label: 'Chú thích (mô tả đúng nội dung ảnh)' },
                ] },
        ],
    },
    food: {
        label: 'Ẩm thực & hoạt động',
        fields: () => [
            { type: 'list', path: ['dest', 'foods'], label: 'Món đặc sản', addLabel: 'Thêm món', newItem: () => ({ name: '', desc: '', price: '', file: '' }),
                itemLabel: f => f.name || 'Món mới',
                fields: i => [
                    { type: 'group', fields: [
                        { type: 'text', path: ['dest', 'foods', i, 'name'], label: 'Tên món' },
                        { type: 'text', path: ['dest', 'foods', i, 'price'], label: 'Giá (chữ)', placeholder: 'vd. 50.000đ hoặc 300.000đ/kg' },
                    ] },
                    { type: 'textarea', path: ['dest', 'foods', i, 'desc'], label: 'Mô tả', rows: 2 },
                    { type: 'image', path: ['dest', 'foods', i, 'file'], label: 'Ảnh (nhiều ảnh dự phòng: ngăn cách bằng |)', multi: true },
                    { type: 'text', path: ['dest', 'foods', i, 'illustrative'], label: 'Ảnh minh họa? Ghi nội dung ảnh', help: 'Để trống nếu ảnh đúng là món này. Nếu ảnh chỉ minh họa (món tương tự), ghi ảnh chụp gì – trang hiện nhãn "Ảnh minh họa".' },
                ] },
            { type: 'list', path: ['dest', 'activities'], label: 'Hoạt động / trải nghiệm', addLabel: 'Thêm hoạt động', newItem: () => ({ icon: 'ri-map-pin-line', title: '', desc: '' }),
                itemLabel: a => a.title || 'Hoạt động mới',
                fields: i => [
                    { type: 'group', fields: [
                        { type: 'text', path: ['dest', 'activities', i, 'title'], label: 'Tiêu đề' },
                        { type: 'text', path: ['dest', 'activities', i, 'icon'], label: 'Biểu tượng', list: 'icon-list', help: ICON_HELP },
                    ] },
                    { type: 'textarea', path: ['dest', 'activities', i, 'desc'], label: 'Mô tả', rows: 2 },
                ] },
            { type: 'lines', path: ['dest', 'tips'], label: 'Kinh nghiệm (mỗi dòng một mẹo)' },
        ],
    },
    plan: {
        label: 'Lịch trình 5 ngày',
        fields: () => [
            { type: 'range', path: ['plan', 'fees'], label: 'Phí tham quan cả chuyến / người (VND): tiết kiệm – thoải mái', low: 'Tiết kiệm', high: 'Thoải mái' },
            { type: 'list', path: ['plan', 'days'], label: 'Các ngày (tour 3/4 ngày = 3/4 ngày đầu)', fixed: true,
                itemLabel: (d, i) => `Ngày ${i + 1}${d.title ? ` – ${d.title}` : ''}`,
                fields: i => [
                    { type: 'text', path: ['plan', 'days', i, 'title'], label: 'Tiêu đề ngày' },
                    { type: 'group', cols: 3, fields: [
                        { type: 'textarea', path: ['plan', 'days', i, 'morning'], label: 'Sáng' },
                        { type: 'textarea', path: ['plan', 'days', i, 'afternoon'], label: 'Chiều' },
                        { type: 'textarea', path: ['plan', 'days', i, 'evening'], label: 'Tối' },
                    ] },
                ] },
        ],
    },
    places: {
        label: 'Quán & lưu trú',
        fields: () => [
            { type: 'group', cols: 3, fields: [
                { type: 'text', path: ['place', 'city'], label: 'Thành phố (không dấu)', help: 'Dùng cho link tìm phòng, vd. Tam Dao' },
                { type: 'text', path: ['place', 'airport'], label: 'Sân bay gần nhất (IATA)', placeholder: 'HAN' },
                { type: 'text', path: ['place', 'rail'], label: 'Ga tàu (tùy chọn)', help: 'Phải trùng tên ga trong transport.rail của data/places.json' },
            ] },
            { type: 'pair', path: ['place', 'getThere'], label: 'Cách đi tới', multiline: true },
            { type: 'list', path: ['place', 'eats'], label: 'Quán ăn (ít nhất 3, nên 8 để lịch theo giờ không lặp)', addLabel: 'Thêm quán ăn',
                newItem: () => ({ name: '', dish: ['', ''], address: '', price: [0, 0], updated: MONTH() }),
                itemLabel: e => e.name || 'Quán mới',
                fields: i => placeFields('eats', i, 'dish', 'Món') },
            { type: 'list', path: ['place', 'cafes'], label: 'Quán cà phê / quán nước (ít nhất 3)', addLabel: 'Thêm quán nước',
                newItem: () => ({ name: '', drink: ['', ''], address: '', price: [0, 0], updated: MONTH() }),
                itemLabel: e => e.name || 'Quán mới',
                fields: i => placeFields('cafes', i, 'drink', 'Đồ uống') },
            { type: 'list', path: ['place', 'stays'], label: 'Khu lưu trú (ít nhất 2)', addLabel: 'Thêm khu lưu trú',
                newItem: () => ({ area: ['', ''], type: 'hotel', price: [0, 0], note: ['', ''] }),
                itemLabel: s => s.area?.[0] || 'Khu mới',
                fields: i => [
                    { type: 'pair', path: ['place', 'stays', i, 'area'], label: 'Khu vực' },
                    { type: 'group', fields: [
                        { type: 'select', path: ['place', 'stays', i, 'type'], label: 'Loại', options: Object.fromEntries(Object.entries(state.data.places.stayTypes).map(([k, v]) => [k, v[0]])) },
                        { type: 'range', path: ['place', 'stays', i, 'price'], label: 'Giá phòng / đêm (VND)' },
                    ] },
                    { type: 'pair', path: ['place', 'stays', i, 'note'], label: 'Ghi chú' },
                ] },
        ],
    },
    sights: {
        label: 'Điểm tham quan',
        fields: () => [
            { type: 'html', html: '<p class="muted small">Mỗi ngày của lịch trình gắn với các điểm tham quan (giá vé, giờ mở cửa, địa chỉ) và quán nước gần đó – cần ít nhất 6 quán nước trong cả 5 ngày. Giờ mở cửa: <code>all</code> (luôn mở) hoặc <code>07:00–17:00</code>.</p>' },
            ...state.bundle.sights.map((_, day) => ({
                type: 'list', path: ['sights', day], label: `Ngày ${day + 1}${state.bundle.plan.days[day]?.title ? ` – ${state.bundle.plan.days[day].title}` : ''}`, addLabel: 'Thêm điểm',
                newItem: () => ({ at: 'm', name: ['', ''], price: 0, hours: 'all', address: '', note: ['', ''], cafe: { name: '', drink: ['', ''], price: [0, 0] } }),
                itemLabel: s => `${AT[s.at] || ''} · ${s.name?.[0] || 'Điểm mới'}`,
                fields: i => [
                    { type: 'group', cols: 3, fields: [
                        { type: 'select', path: ['sights', day, i, 'at'], label: 'Buổi', options: AT },
                        { type: 'text', path: ['sights', day, i, 'hours'], label: 'Giờ mở cửa' },
                        { type: 'text', path: ['sights', day, i, 'address'], label: 'Địa chỉ' },
                    ] },
                    { type: 'pair', path: ['sights', day, i, 'name'], label: 'Tên điểm' },
                    { type: 'price', path: ['sights', day, i, 'price'], label: 'Giá vé (VND, 0 = miễn phí)' },
                    { type: 'pair', path: ['sights', day, i, 'note'], label: 'Ghi chú (tùy chọn)' },
                    { type: 'group', fields: [
                        { type: 'text', path: ['sights', day, i, 'cafe', 'name'], label: 'Quán nước gần đó (tùy chọn)' },
                        { type: 'range', path: ['sights', day, i, 'cafe', 'price'], label: 'Giá đồ uống (VND)' },
                    ] },
                    { type: 'pair', path: ['sights', day, i, 'cafe', 'drink'], label: 'Đồ uống của quán' },
                ],
            })),
        ],
    },
    tr: {
        label: 'Bản dịch',
        fields: () => {
            const lang = state.lang
            alignTranslation(state.bundle, lang)
            const v = state.bundle.dest
            const base = ['tr', lang]
            const fields = [
                { type: 'html', html: `<div class="toolbar">${TR_LANGS.map(l => `<button type="button" class="btn btn--sm${l === lang ? '' : ' btn--ghost'}" data-lang="${l}">${LANG_NAMES[l]}</button>`).join('')}</div>
                    <p class="muted small">${lang === 'en' ? 'Tiếng Anh <strong>bắt buộc</strong> (build báo lỗi nếu thiếu).' : 'Tùy chọn – mục nào để trống sẽ hiện tiếng Anh. Mỗi mục (vd. món ăn) dịch đủ hoặc để trống cả mục.'} Dòng 🇻🇳 là bản gốc tiếng Việt.</p>` },
                { type: 'group', fields: [
                    { type: 'text', path: [...base, 'name'], label: 'Tên', src: v.name },
                    { type: 'text', path: [...base, 'province'], label: 'Tỉnh', src: v.province },
                ] },
                { type: 'text', path: [...base, 'tagline'], label: 'Câu giới thiệu', src: v.tagline },
                { type: 'textarea', path: [...base, 'description'], label: 'Mô tả', src: v.description, rows: 5 },
                { type: 'group', fields: [
                    { type: 'text', path: [...base, 'bestTime'], label: 'Thời điểm đẹp', src: v.bestTime },
                    { type: 'text', path: [...base, 'duration'], label: 'Số ngày nên đi', src: v.duration },
                ] },
                { type: 'html', html: '<h3>Điểm nổi bật</h3>' },
                ...v.highlights.map((h, i) => ({ type: 'text', path: [...base, 'highlights', i], src: h })),
                { type: 'html', html: '<h3>Chú thích ảnh</h3>' },
                ...v.gallery.map((g, i) => ({ type: 'text', path: [...base, 'gallery', i, 'caption'], src: g.caption })),
                { type: 'html', html: '<h3>Món ăn</h3>' },
                ...v.foods.flatMap((f, i) => [
                    { type: 'group', fields: [
                        { type: 'text', path: [...base, 'foods', i, 'name'], label: `Món ${i + 1}`, src: f.name },
                        ...(lang === 'en' ? [{ type: 'text', path: [...base, 'foods', i, 'price'], label: 'Giá (tiếng Anh, tùy chọn)', src: f.price }] : []),
                    ] },
                    { type: 'textarea', path: [...base, 'foods', i, 'desc'], src: f.desc, rows: 2 },
                    ...(f.illustrative ? [{ type: 'text', path: [...base, 'foods', i, 'illustrative'], label: 'Nhãn ảnh minh họa', src: f.illustrative }] : []),
                ]),
                { type: 'html', html: '<h3>Hoạt động</h3>' },
                ...v.activities.flatMap((a, i) => [
                    { type: 'text', path: [...base, 'activities', i, 'title'], label: `Hoạt động ${i + 1}`, src: a.title },
                    { type: 'textarea', path: [...base, 'activities', i, 'desc'], src: a.desc, rows: 2 },
                ]),
                { type: 'html', html: '<h3>Kinh nghiệm</h3>' },
                ...v.tips.map((tip, i) => ({ type: 'textarea', path: [...base, 'tips', i], src: tip, rows: 2 })),
                { type: 'html', html: '<h3>Lịch trình</h3>' },
                ...state.bundle.plan.days.flatMap((d, i) => [
                    { type: 'text', path: [...base, 'days', i, 'title'], label: `Ngày ${i + 1}`, src: d.title },
                    ...(lang === 'en' ? [{ type: 'group', cols: 3, fields: [
                        { type: 'textarea', path: [...base, 'days', i, 'morning'], label: 'Sáng', src: d.morning },
                        { type: 'textarea', path: [...base, 'days', i, 'afternoon'], label: 'Chiều', src: d.afternoon },
                        { type: 'textarea', path: [...base, 'days', i, 'evening'], label: 'Tối', src: d.evening },
                    ] }] : []),
                ]),
            ]
            return fields
        },
    },
}

function placeFields(list, i, key, keyLabel) {
    return [
        { type: 'group', fields: [
            { type: 'text', path: ['place', list, i, 'name'], label: 'Tên quán' },
            { type: 'text', path: ['place', list, i, 'address'], label: 'Địa chỉ' },
        ] },
        { type: 'pair', path: ['place', list, i, key], label: keyLabel },
        { type: 'group', fields: [
            { type: 'range', path: ['place', list, i, 'price'], label: 'Giá / người (VND)' },
            { type: 'text', path: ['place', list, i, 'updated'], label: 'Tháng cập nhật (YYYY-MM)' },
        ] },
    ]
}

/*==================== KHUNG TRANG ====================*/
const NAV = [
    ['/', 'Tổng quan', '▦'],
    ['/dest', 'Điểm đến', '◉'],
    ['/site', 'Giao diện & mùa', '◐'],
    ['/prs', 'Pull Request', '⇄'],
]
const route = () => location.hash.replace(/^#/, '') || '/'
const navOf = r => (r.startsWith('/edit/') || r === '/new' ? '/dest' : r)

function renderShell(crumbs = [], actions = '') {
    $('#side').hidden = false
    $('#topbar').hidden = false
    const active = navOf(route().split('?')[0])
    $('#side-nav').innerHTML = NAV.map(([href, label, icon]) => `<a href="#${href}" class="side__link${active === href ? ' is-active' : ''}"${active === href ? ' aria-current="page"' : ''}>
            <span class="side__icon" aria-hidden="true">${icon}</span>${label}${href === '/prs' && state.prs && state.prs.length ? `<span class="side__count">${state.prs.length}</span>` : ''}</a>`).join('') +
        '<a href="#/new" class="side__link side__link--add"><span class="side__icon" aria-hidden="true">＋</span>Thêm điểm đến</a>'
    $('#side-user').textContent = state.user ? `@${state.user}` : ''
    const avatar = $('#side-avatar')
    if (state.avatar) { avatar.src = state.avatar; avatar.hidden = false }
    $('#crumbs').innerHTML = crumbs.map(([label, href], i) => (href && i < crumbs.length - 1 ? `<a href="${href}">${esc(label)}</a>` : `<span>${esc(label)}</span>`)).join('<span class="crumbs__sep">/</span>')
    $('#topbar-actions').innerHTML = actions
    closeNav()
}

function closeNav() {
    $('#shell').classList.remove('shell--nav-open')
    $('#side-backdrop').hidden = true
    $('#menu-toggle').setAttribute('aria-expanded', 'false')
}

/*==================== CHỈ SỐ DỮ LIỆU ====================*/
function monthsAgo(ym) {
    if (!YM_RE.test(ym || '')) return 0
    const [y, m] = ym.split('-').map(Number)
    const now = new Date()
    return (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m)
}

/* Tình trạng một điểm đến: thiếu bản dịch, món dùng ảnh minh họa, mục quá 12 tháng chưa kiểm tra */
function destHealth(x) {
    const d = state.data
    const missing = ['ko', 'zh', 'ja'].filter(l => !(d[l].destinations || {})[x.id])
    const illus = x.foods.filter(f => f.illustrative).length
    const p = d.places.places[x.id] || {}
    const entries = [...(p.eats || []), ...(p.cafes || []), ...(d.sights.sights[x.id] || []).flat()]
    const stale = entries.filter(e => monthsAgo(e.updated) > 12).length
    return { missing, illus, stale, eats: (p.eats || []).length, sights: (d.sights.sights[x.id] || []).flat().length, score: missing.length * 2 + illus + stale }
}

function healthChips(h, { ok = true } = {}) {
    return [
        h.missing.length ? `<span class="chip chip--warn" title="Chưa có bản dịch">Thiếu ${h.missing.join(', ')}</span>` : ok ? '<span class="chip chip--ok">Đủ 5 thứ tiếng</span>' : '',
        h.illus ? `<span class="chip chip--muted" title="Món đang dùng ảnh minh họa">${h.illus} ảnh minh họa</span>` : '',
        h.stale ? `<span class="chip chip--warn" title="Quán / điểm tham quan quá 12 tháng chưa kiểm tra">${h.stale} mục cũ</span>` : '',
    ].join('')
}

function activeSeason(today = new Date().toISOString().slice(0, 10)) {
    return state.data.site.seasons.find(s => s.enabled && seasonActive(s, today)) || null
}

/* Mùa sắp tới gần nhất (trong 365 ngày) */
function nextSeason() {
    const day = new Date()
    for (let i = 1; i <= 365; i++) {
        day.setDate(day.getDate() + 1)
        const iso = day.toISOString().slice(0, 10)
        const s = state.data.site.seasons.find(x => x.enabled && seasonActive(x, iso))
        if (s && s !== activeSeason()) return { season: s, from: iso, days: i }
    }
    return null
}

const swatch = theme => `<span class="swatch" style="background:hsl(${theme.hue}, 64%, 22%)"></span><span class="swatch" style="background:hsl(${theme.accentHue}, 92%, 55%)"></span>`
const fmtDate = iso => {
    const d = new Date(iso)
    return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`
}
function ago(iso) {
    const min = Math.round((Date.now() - new Date(iso)) / 60000)
    if (min < 1) return 'vừa xong'
    if (min < 60) return `${min} phút trước`
    if (min < 60 * 24) return `${Math.round(min / 60)} giờ trước`
    return `${Math.round(min / 1440)} ngày trước`
}

/*==================== PULL REQUEST TỪ TRANG QUẢN TRỊ ====================*/
const STATUS_CONTEXT = 'Kiểm tra (admin)'
const PR_STATUS = {
    pending: ['Đang build & kiểm tra', 'chip--info'],
    success: ['Sẵn sàng đăng', 'chip--ok'],
    failure: ['Kiểm tra lỗi', 'chip--bad'],
    error: ['Kiểm tra lỗi', 'chip--bad'],
    unknown: ['Chưa rõ kết quả', 'chip--muted'],
}

async function prStatus(sha) {
    try {
        const combined = await gh(`/repos/${REPO}/commits/${sha}/status`)
        const st = combined.statuses.find(x => x.context === STATUS_CONTEXT)
        return st ? { status: st.state, url: st.target_url } : { status: 'pending' }
    } catch {
        return { status: 'unknown' } // token chưa có quyền Commit statuses: Read
    }
}

async function loadPrs() {
    const list = await gh(`/repos/${REPO}/pulls?state=open&per_page=50`)
    const mine = list.filter(p => p.head.ref.startsWith('admin/'))
    state.prs = await Promise.all(mine.map(async p => ({
        number: p.number, title: p.title, url: p.html_url, branch: p.head.ref, sha: p.head.sha,
        created: p.created_at, user: p.user && p.user.login, ...(await prStatus(p.head.sha)),
    })))
    return state.prs
}

function prItem(p) {
    const [label, cls] = PR_STATUS[p.status] || PR_STATUS.unknown
    return `<li class="pr" data-pr="${p.number}">
        <div class="pr__main">
            <a class="pr__title" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)}</a>
            <span class="pr__meta">#${p.number} · ${esc(p.user || '')} · ${ago(p.created)}</span>
        </div>
        <span class="chip ${cls}">${p.status === 'pending' ? '<span class="spin" aria-hidden="true"></span>' : ''}${label}</span>
        <div class="pr__actions">
            <a class="btn btn--ghost btn--sm" href="${esc(p.url)}/files" target="_blank" rel="noopener">Xem thay đổi</a>
            ${p.status === 'failure' || p.status === 'error' ? `<a class="btn btn--ghost btn--sm" href="${esc(p.url || '')}/checks" target="_blank" rel="noopener">Xem lỗi</a>` : ''}
            <button type="button" class="btn btn--sm" data-pr-merge="${p.number}"${p.status === 'success' || p.status === 'unknown' ? '' : ' disabled'} title="Gộp vào main – site tự cập nhật sau vài phút">Đăng lên site</button>
            <button type="button" class="btn btn--ghost btn--sm btn--danger" data-pr-close="${p.number}">Đóng</button>
        </div>
    </li>`
}

function prListHtml(prs, empty = 'Không có Pull Request nào đang chờ.') {
    if (!prs) return '<p class="muted"><span class="spin"></span> Đang tải…</p>'
    return prs.length ? `<ul class="prs">${prs.map(prItem).join('')}</ul>` : `<p class="empty">${empty}</p>`
}

async function mergePr(number) {
    const pr = state.prs.find(p => p.number === number)
    const warn = pr && pr.status !== 'success' ? '\n\nChưa xem được kết quả kiểm tra của PR này – chỉ đăng khi chắc chắn PR đã xanh.' : ''
    if (!confirm(`Đăng PR #${number} lên site?${warn}`)) return
    await gh(`/repos/${REPO}/pulls/${number}/merge`, { method: 'PUT', body: { merge_method: 'merge' } })
    if (pr) await gh(`/repos/${REPO}/git/refs/heads/${pr.branch}`, { method: 'DELETE' }).catch(() => {})
    state.baseSha = null // dữ liệu main đã đổi
    toast(`Đã đăng PR #${number} – Cloudflare cập nhật site sau vài phút.`, 6000, 'ok')
}

async function closePr(number) {
    const pr = state.prs.find(p => p.number === number)
    if (!confirm(`Đóng PR #${number} mà không đăng? Thay đổi trong PR sẽ bị bỏ.`)) return
    await gh(`/repos/${REPO}/pulls/${number}`, { method: 'PATCH', body: { state: 'closed' } })
    if (pr) await gh(`/repos/${REPO}/git/refs/heads/${pr.branch}`, { method: 'DELETE' }).catch(() => {})
    toast(`Đã đóng PR #${number}.`, 4000, 'ok')
}

/* Làm mới danh sách PR trong vùng đang hiện; tự hỏi lại khi còn PR đang kiểm tra */
function refreshPrs(target) {
    clearTimeout(refreshPrs.timer)
    loadPrs().then(prs => {
        const box = document.getElementById(target)
        if (!box) return
        box.innerHTML = prListHtml(prs)
        renderShellCount()
        if (prs.some(p => p.status === 'pending')) refreshPrs.timer = setTimeout(() => refreshPrs(target), 20000)
    }).catch(err => {
        const box = document.getElementById(target)
        if (box) box.innerHTML = `<p class="errors">Không tải được Pull Request: ${esc(err.message)}</p>`
    })
}

function renderShellCount() {
    const link = document.querySelector('.side__link[href="#/prs"]')
    if (!link || !state.prs) return
    link.querySelector('.side__count')?.remove()
    if (state.prs.length) link.insertAdjacentHTML('beforeend', `<span class="side__count">${state.prs.length}</span>`)
}

/*==================== TRANG ====================*/
function renderLogin(error) {
    $('#side').hidden = true
    $('#topbar').hidden = true
    $('#app').innerHTML = `
        <div class="login">
            <div class="login__brand"><span class="side__logo">VT</span><div><strong>Việt Travel</strong><small>Quản trị dữ liệu</small></div></div>
            <div class="card login__card">
                <h1>Đăng nhập</h1>
                <p class="muted">Dùng một <strong>fine-grained token</strong> GitHub chỉ có quyền với repo <a href="https://github.com/${REPO}" target="_blank" rel="noopener">${REPO}</a>. Token chỉ lưu trên trình duyệt này và chỉ gửi tới api.github.com.</p>
                ${error ? `<div class="errors">${esc(error)}</div>` : ''}
                <form id="login-form">
                    <div class="field"><label for="token">Token</label><input type="password" id="token" autocomplete="off" required placeholder="github_pat_…"></div>
                    <label class="checks"><input type="checkbox" id="remember"> Ghi nhớ trên máy này (chỉ máy riêng của bạn)</label>
                    <button class="btn btn--block" type="submit">Đăng nhập</button>
                </form>
                <details class="login__help">
                    <summary>Cách tạo token</summary>
                    <ol class="steps">
                        <li>Mở <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → Fine-grained tokens → Generate new token</a>.</li>
                        <li><strong>Repository access</strong>: Only select repositories → <code>travel</code>. Đặt thời hạn (vd. 90 ngày).</li>
                        <li><strong>Permissions → Repository</strong>: <code>Contents</code> và <code>Pull requests</code> = Read and write; nên thêm <code>Commit statuses</code> = Read-only để xem PR đã kiểm tra xong chưa.</li>
                        <li>Bấm Generate, chép token (bắt đầu bằng <code>github_pat_</code>) và dán vào ô trên. Không gửi token cho ai khác.</li>
                    </ol>
                </details>
            </div>
        </div>`
    $('#login-form').addEventListener('submit', async e => {
        e.preventDefault()
        const btn = e.target.querySelector('button')
        btn.disabled = true
        btn.textContent = 'Đang kiểm tra…'
        try {
            await login($('#token').value.trim(), $('#remember').checked)
            await loadData()
            render()
        } catch (err) {
            state.token = null
            renderLogin(err.status === 401 ? 'Token không hợp lệ hoặc đã hết hạn.' : err.message)
        }
    })
}

function renderDashboard() {
    const d = state.data
    const dests = d.destinations.destinations
    const health = dests.map(x => ({ x, h: destHealth(x) }))
    const sum = key => health.reduce((n, { h }) => n + (Array.isArray(h[key]) ? (h[key].length ? 1 : 0) : h[key]), 0)
    const season = activeSeason()
    const next = nextSeason()
    const attention = health.filter(({ h }) => h.score > 0).sort((a, b) => b.h.score - a.h.score).slice(0, 8)
    renderShell([['Tổng quan']], '<button type="button" class="btn btn--ghost btn--sm" id="reload">↻ Tải lại dữ liệu</button>')
    $('#app').innerHTML = `
        <div class="page-head">
            <div><h1>Xin chào${state.user ? `, ${esc(state.user)}` : ''}</h1>
            <p class="muted">Dữ liệu nhánh main · commit <code>${esc(state.baseSha.slice(0, 7))}</code> · tải ${ago(state.loadedAt)}</p></div>
            <div class="page-head__actions"><a class="btn" href="#/new">＋ Thêm điểm đến</a><a class="btn btn--ghost" href="#/site">Giao diện & mùa</a></div>
        </div>
        <div class="stats">
            <a class="stat" href="#/dest"><span class="stat__num">${dests.length}</span><span class="stat__label">Điểm đến</span></a>
            <a class="stat" href="#/dest?f=lang"><span class="stat__num">${sum('missing')}</span><span class="stat__label">Điểm đến thiếu bản dịch ko / zh / ja</span></a>
            <a class="stat" href="#/dest?f=illus"><span class="stat__num">${sum('illus')}</span><span class="stat__label">Món đang dùng ảnh minh họa</span></a>
            <a class="stat" href="#/dest?f=stale"><span class="stat__num">${sum('stale')}</span><span class="stat__label">Quán / điểm quá 12 tháng chưa kiểm tra</span></a>
        </div>
        <div class="cols">
            <section class="card">
                <div class="card__head"><h2>Mùa trên site</h2><a href="#/site">Sửa →</a></div>
                ${season ? `<div class="season-now">${season.theme ? swatch(season.theme) : swatch(d.site.theme)}<div><strong>${esc(season.name)}</strong><span class="muted small">Đang chạy · ${esc(season.from)} → ${esc(season.to)}</span></div>
                    <a class="btn btn--ghost btn--sm" href="${SITE_URL}?season=${esc(season.id)}" target="_blank" rel="noopener">Xem ↗</a></div>`
                    : `<div class="season-now">${swatch(d.site.theme)}<div><strong>Giao diện mặc định</strong><span class="muted small">Không có mùa nào đang chạy</span></div></div>`}
                ${next ? `<p class="muted small">Tiếp theo: <strong>${esc(next.season.name)}</strong> sau ${next.days} ngày (${next.from.split('-').reverse().join('/')}).</p>` : ''}
                <p class="muted small">${d.site.seasons.length} mùa · ${d.site.seasons.filter(s => s.enabled).length} đang bật</p>
            </section>
            <section class="card">
                <div class="card__head"><h2>Pull Request chờ đăng</h2><a href="#/prs">Tất cả →</a></div>
                <div id="dash-prs">${prListHtml(state.prs)}</div>
            </section>
        </div>
        <section class="card">
            <div class="card__head"><h2>Cần chú ý</h2><a href="#/dest?f=attention">Xem tất cả →</a></div>
            ${attention.length ? `<ul class="attention">${attention.map(({ x, h }) => `<li><a href="#/edit/${x.id}"><img src="${esc(thumbUrl(x.hero))}" alt="" loading="lazy"><span><strong>${esc(x.name)}</strong><span class="chips">${healthChips(h, { ok: false })}</span></span></a></li>`).join('')}</ul>` : '<p class="empty">Mọi điểm đến đều đủ bản dịch và dữ liệu mới.</p>'}
        </section>`
    refreshPrs('dash-prs')
}

const DEST_FILTERS = {
    all: ['Tất cả', () => true],
    attention: ['Cần chú ý', h => h.score > 0],
    lang: ['Thiếu bản dịch', h => h.missing.length > 0],
    illus: ['Có ảnh minh họa', h => h.illus > 0],
    stale: ['Dữ liệu cũ', h => h.stale > 0],
}
const DEST_SORTS = { order: 'Thứ tự trên site', name: 'Tên A → Z', attention: 'Cần chú ý nhất' }

function renderList() {
    const d = state.data
    const params = new URLSearchParams(route().split('?')[1] || '')
    const view = (() => { try { return localStorage.getItem('vt-admin-view') || 'grid' } catch { return 'grid' } })()
    const f = state.listFilter || { q: '', region: '', filter: params.get('f') || 'all', sort: 'order', view }
    if (params.get('f')) f.filter = params.get('f')
    state.listFilter = f
    renderShell([['Tổng quan', '#/'], ['Điểm đến']], '<a class="btn btn--sm" href="#/new">＋ Thêm điểm đến</a>')
    $('#app').innerHTML = `
        <div class="page-head"><div><h1>Điểm đến</h1><p class="muted" id="list-count"></p></div></div>
        <div class="toolbar">
            <input type="search" id="search" placeholder="Tìm theo tên, mã, tỉnh…" aria-label="Tìm điểm đến" value="${esc(f.q)}">
            <select id="f-region" aria-label="Vùng miền"><option value="">Mọi vùng</option>${Object.entries(d.destinations.regions).map(([k, v]) => `<option value="${k}"${f.region === k ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>
            <select id="f-filter" aria-label="Lọc">${Object.entries(DEST_FILTERS).map(([k, [label]]) => `<option value="${k}"${f.filter === k ? ' selected' : ''}>${label}</option>`).join('')}</select>
            <select id="f-sort" aria-label="Sắp xếp">${Object.entries(DEST_SORTS).map(([k, label]) => `<option value="${k}"${f.sort === k ? ' selected' : ''}>${label}</option>`).join('')}</select>
            <div class="seg" role="group" aria-label="Kiểu xem">
                <button type="button" data-view="grid" aria-pressed="${f.view === 'grid'}">▦ Lưới</button>
                <button type="button" data-view="table" aria-pressed="${f.view === 'table'}">☰ Bảng</button>
            </div>
        </div>
        <div id="dest-results"></div>`
    const update = () => {
        const q = f.q.trim().toLowerCase()
        let rows = d.destinations.destinations.map(x => ({ x, h: destHealth(x) }))
            .filter(({ x, h }) => (!q || `${x.id} ${x.name} ${x.province}`.toLowerCase().includes(q))
                && (!f.region || x.region === f.region) && DEST_FILTERS[f.filter][1](h))
        if (f.sort === 'name') rows.sort((a, b) => a.x.name.localeCompare(b.x.name, 'vi'))
        if (f.sort === 'attention') rows.sort((a, b) => b.h.score - a.h.score)
        $('#list-count').textContent = `${rows.length} / ${d.destinations.destinations.length} điểm đến`
        const region = x => esc(d.destinations.regions[x.region] || x.region)
        $('#dest-results').innerHTML = !rows.length ? '<p class="empty">Không có điểm đến nào khớp bộ lọc.</p>' : f.view === 'table'
            ? `<div class="card card--flush"><table class="table">
                <thead><tr><th>Điểm đến</th><th>Vùng</th><th>Nội dung</th><th>Tình trạng</th><th></th></tr></thead>
                <tbody>${rows.map(({ x, h }) => `<tr>
                    <td><a href="#/edit/${x.id}" class="table__name"><img src="${esc(thumbUrl(x.hero))}" alt="" loading="lazy"><span><strong>${esc(x.name)}</strong><small>${esc(x.province)}</small></span></a></td>
                    <td>${region(x)}</td>
                    <td class="small">${x.foods.length} món · ${h.eats} quán · ${h.sights} điểm</td>
                    <td><span class="chips">${healthChips(h)}</span></td>
                    <td><a class="btn btn--ghost btn--sm" href="#/edit/${x.id}">Sửa</a></td></tr>`).join('')}</tbody></table></div>`
            : `<div class="grid-cards">${rows.map(({ x, h }) => `<a class="dcard" href="#/edit/${x.id}">
                <span class="dcard__img"><img src="${esc(thumbUrl(x.hero))}" alt="" loading="lazy"><span class="dcard__region">${region(x)}</span></span>
                <span class="dcard__body"><strong>${esc(x.name)}</strong><small>${esc(x.province)}</small>
                <span class="dcard__meta">${x.foods.length} món · ${h.eats} quán · ${h.sights} điểm</span>
                <span class="chips">${healthChips(h)}</span></span></a>`).join('')}</div>`
    }
    update()
    $('#search').addEventListener('input', e => { f.q = e.target.value; update() })
    $('#f-region').addEventListener('change', e => { f.region = e.target.value; update() })
    $('#f-filter').addEventListener('change', e => { f.filter = e.target.value; update() })
    $('#f-sort').addEventListener('change', e => { f.sort = e.target.value; update() })
    document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
        f.view = b.dataset.view
        try { localStorage.setItem('vt-admin-view', f.view) } catch { /* bỏ qua */ }
        document.querySelectorAll('[data-view]').forEach(x => x.setAttribute('aria-pressed', String(x === b)))
        update()
    }))
}

function renderPrsPage() {
    renderShell([['Tổng quan', '#/'], ['Pull Request']], '<button type="button" class="btn btn--ghost btn--sm" id="reload-prs">↻ Làm mới</button>')
    $('#app').innerHTML = `
        <div class="page-head"><div><h1>Pull Request từ trang quản trị</h1>
            <p class="muted">Mỗi lần lưu tạo một PR. GitHub tự build lại trang và chạy toàn bộ test (khoảng 5 phút); khi <strong>Sẵn sàng đăng</strong>, bấm <strong>Đăng lên site</strong> – Cloudflare cập nhật sau vài phút.</p></div></div>
        <section class="card"><div id="all-prs">${prListHtml(state.prs)}</div></section>
        <p class="muted small">PR do người khác mở hoặc không bắt đầu bằng <code>admin/</code> xem ở <a href="https://github.com/${REPO}/pulls" target="_blank" rel="noopener">GitHub</a>.</p>`
    refreshPrs('all-prs')
}

function iconDatalist() {
    const icons = new Set()
    state.data.destinations.destinations.forEach(d => d.activities.forEach(a => icons.add(a.icon)))
    return `<datalist id="icon-list">${[...icons].sort().map(i => `<option value="${esc(i)}">`).join('')}</datalist>`
}

/*---------- Trình sửa: lỗi theo tab ----------*/
function errorTab(msg) {
    if (state.mode === 'site') {
        const m = msg.match(/^Mùa (\d+)/)
        return m ? `s${Number(m[1]) - 1}` : 'general'
    }
    const rules = [[/^(Mã|Thông tin chung)/, 'info'], [/^Ảnh/, 'images'], [/^(Ẩm thực|Hoạt động)/, 'food'], [/^Lịch trình/, 'plan'],
        [/^(Quán|Lưu trú)/, 'places'], [/^Điểm tham quan/, 'sights'], [/^Bản dịch/, 'tr']]
    const hit = rules.find(([re]) => re.test(msg))
    return hit ? hit[1] : 'info'
}

function workingCopy() {
    if (state.mode === 'site') return fromEditableSite(state.bundle.site)
    const w = clone(state.bundle)
    cleanBundle(w)
    return w
}

function computeErrors() {
    const w = workingCopy()
    return state.mode === 'site' ? validateSite(w) : validate(w)
}

function errorsByTab(errors) {
    const by = {}
    errors.forEach(m => { const t = errorTab(m); (by[t] = by[t] || []).push(m) })
    return by
}

/* Cập nhật số lỗi trên tab + thanh lưu mà không vẽ lại form (gõ phím không mất con trỏ) */
function updateErrorBadges() {
    if (!state.bundle) return
    state.errors = computeErrors()
    const by = errorsByTab(state.errors)
    document.querySelectorAll('.tabs [data-tab]').forEach(btn => {
        const n = (by[btn.dataset.tab] || []).length
        let badge = btn.querySelector('.tab__count')
        if (!n) { badge?.remove(); return }
        if (!badge) { badge = document.createElement('span'); badge.className = 'tab__count'; btn.append(badge) }
        badge.textContent = n
        badge.classList.toggle('tab__count--bad', state.showErrors)
    })
    const status = $('#save-status')
    if (status) status.innerHTML = saveStatusHtml()
}

function saveStatusHtml() {
    const n = state.errors.length
    const draft = state.draftSavedAt ? ` · nháp tự lưu ${new Date(state.draftSavedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : ''
    return `${state.dirty ? '<span class="dot dot--warn"></span>Có thay đổi chưa đăng' : '<span class="dot"></span>Chưa có thay đổi'}${draft}${n ? ` · <span class="${state.showErrors ? 'text-bad' : ''}">${n} mục cần điền / sửa</span>` : ''}`
}

/*---------- Trình sửa: bản nháp tự lưu trên trình duyệt ----------*/
const draftKey = () => `vt-admin-draft:${state.mode === 'site' ? 'site' : state.isNew ? 'new' : `edit:${state.id}`}`
function readDraft() {
    try { return JSON.parse(localStorage.getItem(draftKey()) || 'null') } catch { return null }
}
function clearDraft() {
    try { localStorage.removeItem(draftKey()) } catch { /* bỏ qua */ }
    state.draftSavedAt = null
}
function saveDraftSoon() {
    clearTimeout(saveDraftSoon.timer)
    saveDraftSoon.timer = setTimeout(() => {
        if (!state.bundle || !state.dirty) return
        try {
            state.draftSavedAt = Date.now()
            localStorage.setItem(draftKey(), JSON.stringify({ bundle: state.bundle, savedAt: state.draftSavedAt, baseSha: state.baseSha }))
        } catch { state.draftSavedAt = null }
        updateErrorBadges()
    }, 800)
}

function markDirty() {
    state.dirty = true
    saveDraftSoon()
    clearTimeout(markDirty.timer)
    markDirty.timer = setTimeout(updateErrorBadges, 300)
}

/*---------- Trình sửa ----------*/
function renderEditor() {
    const b = state.bundle
    const isSite = state.mode === 'site'
    const allTabs = currentTabs()
    if (!allTabs[state.tab]) state.tab = Object.keys(allTabs)[0]
    state.errors = computeErrors()
    const by = errorsByTab(state.errors)
    const tabs = Object.entries(allTabs).map(([key, t]) => {
        const n = (by[key] || []).length
        return `<button type="button" role="tab" data-tab="${key}" aria-selected="${key === state.tab}">${esc(t.label)}${n ? `<span class="tab__count${state.showErrors ? ' tab__count--bad' : ''}">${n}</span>` : ''}</button>`
    }).join('') + (isSite ? '<button type="button" class="tab--add" data-season-add>＋ Thêm mùa</button>' : '')
    const title = isSite ? 'Giao diện & mùa' : state.isNew ? 'Thêm điểm đến mới' : b.dest.name
    const tabErrors = state.showErrors && by[state.tab] ? `<div class="errors"><strong>Cần sửa trong tab này:</strong><ul>${by[state.tab].map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''
    const others = state.showErrors ? Object.keys(by).filter(t => t !== state.tab && allTabs[t]) : []
    const draft = state.draft ? `<div class="notice">
            <span>Có bản nháp chưa đăng lưu lúc ${fmtDate(state.draft.savedAt)}${state.draft.baseSha !== state.baseSha ? ' (trên dữ liệu cũ hơn hiện tại)' : ''}.</span>
            <button type="button" class="btn btn--sm" data-draft="restore">Khôi phục nháp</button>
            <button type="button" class="btn btn--ghost btn--sm" data-draft="discard">Bỏ nháp</button></div>` : ''
    const view = !isSite && !state.isNew ? `<a class="btn btn--ghost btn--sm" href="../diem-den/${esc(b.dest.id)}/index.html" target="_blank" rel="noopener">Xem trên site ↗</a>`
        : isSite ? `<a class="btn btn--ghost btn--sm" href="../" target="_blank" rel="noopener">Xem trang chủ ↗</a>` : ''
    renderShell(isSite ? [['Tổng quan', '#/'], ['Giao diện & mùa']] : [['Tổng quan', '#/'], ['Điểm đến', '#/dest'], [state.isNew ? 'Thêm mới' : b.dest.name]], view)
    $('#app').innerHTML = `
        <div class="page-head page-head--editor">
            ${!isSite && !state.isNew && b.dest.hero ? `<img class="page-head__img" src="${esc(thumbUrl(b.dest.hero))}" alt="">` : ''}
            <div><h1>${esc(title)}</h1>
            <p class="muted">${isSite ? 'Màu giao diện, slogan, ảnh bìa trang chủ và các mùa / chiến dịch tự đổi theo ngày.' : state.isNew ? 'Điền đủ các tab – số đỏ trên tab là mục còn thiếu.' : `${esc(b.dest.id)} · ${esc(b.dest.province)}`}</p></div>
        </div>
        ${draft}
        <div class="tabs" role="tablist">${tabs}</div>
        ${tabErrors}
        ${others.length ? `<p class="muted small">Còn lỗi ở: ${others.map(t => `<button type="button" class="link" data-tab="${t}">${esc(allTabs[t].label)} (${by[t].length})</button>`).join(', ')}</p>` : ''}
        <div class="card" id="tab-body">${allTabs[state.tab].fields().map(field).join('')}</div>
        ${isSite ? linkDatalist() : iconDatalist()}
        <div class="savebar">
            <span class="savebar__status" id="save-status">${saveStatusHtml()}</span>
            <span class="muted small savebar__hint">Ctrl + S</span>
            <button type="button" class="btn" id="save">Xem lại & tạo Pull Request</button>
        </div>`
}

function renderDone(pr) {
    renderShell([['Tổng quan', '#/'], ['Đã tạo Pull Request']])
    $('#app').innerHTML = `
        <div class="done card">
            <div class="done__icon" aria-hidden="true">✓</div>
            <h1>Đã tạo Pull Request #${pr.number}</h1>
            <p class="muted">${esc(pr.title)}</p>
            <ol class="timeline">
                <li class="is-done">Đã lưu thay đổi vào nhánh riêng và mở PR</li>
                <li class="is-active">GitHub build lại trang và chạy toàn bộ test (khoảng 5 phút)</li>
                <li>Bấm <strong>Đăng lên site</strong> khi PR sẵn sàng – Cloudflare cập nhật sau vài phút</li>
            </ol>
            <div id="done-pr">${prListHtml(null)}</div>
            <p><a href="#/">← Về tổng quan</a> · <a href="${esc(pr.html_url)}" target="_blank" rel="noopener">Mở PR trên GitHub ↗</a></p>
        </div>`
    const poll = () => loadPrs().then(prs => {
        const box = document.getElementById('done-pr')
        if (!box) return
        const mine = prs.filter(p => p.number === pr.number)
        box.innerHTML = prListHtml(mine, 'PR này đã được đăng hoặc đóng.')
        renderShellCount()
        if (mine[0] && mine[0].status === 'pending') setTimeout(poll, 20000)
    }).catch(() => {})
    poll()
}

/*---------- Xem lại thay đổi trước khi tạo PR ----------*/
/* Diff theo dòng: bỏ phần đầu / cuối giống nhau, phần giữa so bằng LCS (nếu đủ nhỏ) */
function lineDiff(oldText, newText) {
    const a = oldText ? oldText.split('\n') : []
    const b = newText.split('\n')
    let s = 0
    while (s < a.length && s < b.length && a[s] === b[s]) s++
    let ea = a.length
    let eb = b.length
    while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) { ea--; eb-- }
    const A = a.slice(s, ea)
    const B = b.slice(s, eb)
    let ops
    if (A.length * B.length <= 250000) {
        const L = Array.from({ length: A.length + 1 }, () => new Uint16Array(B.length + 1))
        for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
        ops = []
        let i = 0
        let j = 0
        while (i < A.length && j < B.length) {
            if (A[i] === B[j]) { ops.push([' ', A[i]]); i++; j++ } else if (L[i + 1][j] >= L[i][j + 1]) ops.push(['-', A[i++]])
            else ops.push(['+', B[j++]])
        }
        while (i < A.length) ops.push(['-', A[i++]])
        while (j < B.length) ops.push(['+', B[j++]])
    } else {
        ops = [...A.map(l => ['-', l]), ...B.map(l => ['+', l])]
    }
    const ctx = 3
    const lines = [...a.slice(Math.max(0, s - ctx), s).map(l => [' ', l]), ...ops, ...a.slice(ea, ea + ctx).map(l => [' ', l])]
    /* Thu gọn đoạn dài không đổi ở giữa */
    const out = []
    for (let k = 0; k < lines.length; k++) {
        let run = 0
        while (lines[k + run] && lines[k + run][0] === ' ') run++
        if (run > 2 * ctx + 2) {
            out.push(...lines.slice(k, k + ctx), ['…', `${run - 2 * ctx} dòng không đổi`], ...lines.slice(k + run - ctx, k + run))
            k += run - 1
        } else out.push(lines[k])
    }
    return { lines: out, added: ops.filter(o => o[0] === '+').length, removed: ops.filter(o => o[0] === '-').length }
}

function openModal(html) {
    $('#modal-box').innerHTML = html
    $('#modal').hidden = false
    document.body.classList.add('no-scroll')
    $('#modal-box').querySelector('textarea, button')?.focus()
}
function closeModal() {
    $('#modal').hidden = true
    document.body.classList.remove('no-scroll')
}

function openReview() {
    if (!state.bundle) return
    state.showErrors = true
    state.errors = computeErrors()
    if (state.errors.length) {
        const by = errorsByTab(state.errors)
        const first = Object.keys(currentTabs()).find(t => by[t])
        if (first) state.tab = first
        renderEditor()
        window.scrollTo(0, 0)
        toast(`Còn ${state.errors.length} mục cần điền / sửa – xem các tab có số đỏ.`, 5000, 'error')
        return
    }
    const w = workingCopy()
    const changed = state.mode === 'site' ? buildSiteFiles(w) : buildFiles(w)
    const files = Object.keys(changed)
    if (!files.length) {
        toast('Không có thay đổi nào so với dữ liệu hiện tại.', 4000)
        return
    }
    const texts = Object.fromEntries(Object.entries(FILES).map(([k, f]) => [f, state.texts[k]]))
    const diffs = files.map(f => ({ f, ...lineDiff(texts[f], changed[f]) }))
    const total = diffs.reduce((n, x) => [n[0] + x.added, n[1] + x.removed], [0, 0])
    const MAX = 400
    openModal(`
        <div class="modal__head"><h2 id="modal-title">Xem lại thay đổi</h2><button type="button" class="icon-btn" data-modal-close aria-label="Đóng">✕</button></div>
        <p class="muted">${files.length} file · <span class="text-ok">+${total[0]}</span> <span class="text-bad">−${total[1]}</span> dòng. Pull Request sẽ được build và kiểm tra tự động trước khi đăng.</p>
        <div class="diffs">${diffs.map(x => `<details open class="diff">
            <summary><code>${esc(x.f)}</code><span><span class="text-ok">+${x.added}</span> <span class="text-bad">−${x.removed}</span></span></summary>
            <pre>${x.lines.slice(0, MAX).map(([t, l]) => `<span class="diff__l diff__l--${t === '+' ? 'add' : t === '-' ? 'del' : t === '…' ? 'gap' : 'ctx'}">${t === '…' ? `⋯ ${esc(l)}` : `${t} ${esc(l)}`}</span>`).join('')}${x.lines.length > MAX ? `<span class="diff__l diff__l--gap">⋯ còn ${x.lines.length - MAX} dòng – xem đầy đủ trên GitHub sau khi tạo PR</span>` : ''}</pre></details>`).join('')}</div>
        <div class="field"><label for="save-note">Ghi chú cho người duyệt (tùy chọn)</label><textarea id="save-note" rows="2" placeholder="vd. Cập nhật giá vé theo bảng giá mới tháng 10"></textarea></div>
        <div class="modal__foot"><button type="button" class="btn btn--ghost" data-modal-close>Quay lại sửa</button><button type="button" class="btn" id="confirm-save">Tạo Pull Request</button></div>`)
}

async function confirmSave(btn) {
    const isSite = state.mode === 'site'
    const working = workingCopy()
    btn.disabled = true
    btn.innerHTML = '<span class="spin"></span> Đang tạo Pull Request…'
    try {
        const note = $('#save-note').value.trim()
        const pr = isSite
            ? await createPullRequest(buildSiteFiles(working), {
                title: 'Cập nhật giao diện & mùa',
                slug: 'giao-dien',
                summary: `Cập nhật giao diện & mùa (\`data/site.json\`) từ trang quản trị: ${working.seasons.length} mùa (${working.seasons.filter(x => x.enabled).map(x => x.name).join(', ') || 'không mùa nào bật'}).`,
            }, note)
            : await saveAsPullRequest(working, note)
        clearDraft()
        closeModal()
        Object.assign(state, { dirty: false, bundle: null, mode: null, id: null, showErrors: false, draft: null, baseSha: null, prs: null })
        renderDone(pr)
        toast(`Đã tạo PR #${pr.number}.`, 4000, 'ok')
    } catch (err) {
        btn.disabled = false
        btn.textContent = 'Tạo Pull Request'
        toast(err.status === 403 ? 'Token thiếu quyền (cần Contents + Pull requests: Read and write).' : err.message, 8000, 'error')
    }
}

/*---------- Điều hướng ----------*/
function openEditor(mode, id, isNew) {
    Object.assign(state, { mode, id, isNew, dirty: false, errors: [], showErrors: false, open: new Map(), draftSavedAt: null })
    state.tab = mode === 'site' ? 'general' : 'info'
    state.bundle = mode === 'site' ? { site: toEditableSite(state.data.site) } : isNew ? newBundle() : loadBundle(id)
    const draft = state.bundle && readDraft()
    state.draft = draft && JSON.stringify(draft.bundle) !== JSON.stringify(state.bundle) ? draft : null
}

function render() {
    clearTimeout(refreshPrs.timer)
    if (!state.token) return renderLogin()
    if (!state.baseSha) {
        renderShell([['Đang tải…']])
        $('#app').innerHTML = '<div class="loading"><span class="spin"></span> Đang tải dữ liệu từ GitHub…</div>'
        return loadData().then(render).catch(err => {
            if (err.status === 401) return logout()
            $('#app').innerHTML = `<div class="errors">Không tải được dữ liệu: ${esc(err.message)}</div>`
        })
    }
    const r = route()
    const path = r.split('?')[0]
    const edit = path.match(/^\/edit\/([a-z0-9-]+)$/)
    if (path === '/site') {
        if (state.mode !== 'site' || !state.bundle) openEditor('site', null, false)
        return renderEditor()
    }
    if (path === '/new' || edit) {
        const id = edit ? edit[1] : null
        if (state.mode !== 'dest' || state.id !== id || !state.bundle || state.isNew !== !edit) openEditor('dest', id, !edit)
        if (!state.bundle) {
            renderShell([['Tổng quan', '#/'], ['Điểm đến', '#/dest'], ['Không tìm thấy']])
            $('#app').innerHTML = `<div class="errors">Không có điểm đến "${esc(id)}".</div><p><a href="#/dest">← Danh sách</a></p>`
            return
        }
        return renderEditor()
    }
    Object.assign(state, { bundle: null, mode: null, id: null })
    if (path === '/dest') return renderList()
    if (path === '/prs') return renderPrsPage()
    return renderDashboard()
}

/*---------- Sự kiện ----------*/
function rerenderTab() {
    const y = window.scrollY
    renderEditor()
    window.scrollTo(0, y)
}

document.addEventListener('input', e => {
    const el = e.target
    if (!state.bundle || !el.dataset || !el.dataset.path) return
    const path = JSON.parse(el.dataset.path)
    const kind = el.dataset.kind
    const b = state.bundle
    if (kind === 'text') set(b, path, el.value)
    else if (kind === 'number') {
        set(b, path, el.value === '' ? 0 : Number(el.value))
        const box = el.closest('.theme-field')
        if (box) {
            const t = get(b, path.slice(0, -1))
            box.querySelector(`[data-out="${path[path.length - 1]}"]`).textContent = el.value
            box.querySelector('.theme-preview').innerHTML = themePreview(t)
        }
    } else if (kind === 'bool') {
        set(b, path, el.checked)
        markDirty()
        rerenderTab()
        return
    }
    else if (kind === 'lines') set(b, path, el.value.split('\n'))
    else if (kind === 'files') set(b, path, el.value)
    else if (kind === 'check' || kind === 'check-number') {
        const value = kind === 'check-number' ? Number(el.value) : el.value
        const list = (get(b, path) || []).filter(x => x !== value)
        if (el.checked) list.push(value)
        if (kind === 'check-number') list.sort((x, y) => x - y)
        set(b, path, list)
    } else if (kind === 'price-lo' || kind === 'price-hi') {
        const cur = get(b, path)
        let [lo, hi] = Array.isArray(cur) ? cur : [cur, '']
        if (kind === 'price-lo') lo = el.value === '' ? 0 : Number(el.value)
        else hi = el.value === '' ? '' : Number(el.value)
        set(b, path, hi === '' ? lo : [lo, hi])
    } else return
    markDirty()
})
document.addEventListener('change', e => {
    if (e.target.matches('input[type="checkbox"][data-path]')) e.target.dispatchEvent(new Event('input', { bubbles: true }))
})
/* Nhớ mục danh sách đang mở / đóng (sự kiện toggle không nổi bọt nên bắt ở pha capture) */
document.addEventListener('toggle', e => {
    if (e.target.matches && e.target.matches('details.list__item')) state.open.set(e.target.dataset.key, e.target.open)
}, true)

document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && state.bundle) {
        e.preventDefault()
        if ($('#modal').hidden) openReview()
    }
    if (e.key === 'Escape' && !$('#modal').hidden) closeModal()
})

document.addEventListener('click', async e => {
    const t = e.target
    if (t.closest('[data-modal-close]') || t.id === 'modal') { closeModal(); return }
    if (t.closest('#confirm-save')) { confirmSave(t.closest('#confirm-save')); return }
    if (t.closest('#menu-toggle')) {
        const open = !$('#shell').classList.contains('shell--nav-open')
        $('#shell').classList.toggle('shell--nav-open', open)
        $('#side-backdrop').hidden = !open
        $('#menu-toggle').setAttribute('aria-expanded', String(open))
        return
    }
    if (t.closest('#side-backdrop')) { closeNav(); return }
    if (t.closest('#theme-toggle')) {
        const order = [null, 'dark', 'light']
        const cur = document.documentElement.getAttribute('data-theme')
        const next = order[(order.indexOf(cur) + 1) % order.length]
        if (next) document.documentElement.setAttribute('data-theme', next)
        else document.documentElement.removeAttribute('data-theme')
        try { next ? localStorage.setItem('vt-admin-theme', next) : localStorage.removeItem('vt-admin-theme') } catch { /* bỏ qua */ }
        toast(next === 'dark' ? 'Giao diện tối' : next === 'light' ? 'Giao diện sáng' : 'Giao diện theo hệ thống', 1500)
        return
    }
    if (t.closest('#reload')) {
        state.baseSha = null
        state.prs = null
        render()
        return
    }
    if (t.closest('#reload-prs')) { state.prs = null; renderPrsPage(); return }
    const merge = t.closest('[data-pr-merge]')
    const close = t.closest('[data-pr-close]')
    if (merge || close) {
        const btn = merge || close
        btn.disabled = true
        try {
            if (merge) await mergePr(Number(merge.dataset.prMerge))
            else await closePr(Number(close.dataset.prClose))
        } catch (err) {
            toast(err.status === 405 ? 'Chưa đăng được: PR chưa đủ điều kiện (đang kiểm tra hoặc bị xung đột).' : err.message, 7000, 'error')
        }
        btn.disabled = false
        render()
        return
    }
    const draftBtn = t.closest('[data-draft]')
    if (draftBtn && state.draft) {
        if (draftBtn.dataset.draft === 'restore') {
            state.bundle = state.draft.bundle
            state.dirty = true
            toast('Đã khôi phục bản nháp.', 3000, 'ok')
        } else clearDraft()
        state.draft = null
        renderEditor()
        return
    }
    const tab = t.closest('[data-tab]')
    if (tab) {
        state.tab = tab.dataset.tab
        renderEditor()
        window.scrollTo(0, 0)
        return
    }
    const preset = t.closest('[data-preset]')
    if (preset && state.bundle) {
        const [hue, accentHue] = preset.dataset.preset.split(',').map(Number)
        set(state.bundle, JSON.parse(preset.dataset.path), { hue, accentHue })
        markDirty()
        rerenderTab()
        return
    }
    if (t.closest('[data-season-add]') && state.mode === 'site') {
        state.bundle.site.seasons.push(newSeason())
        state.tab = `s${state.bundle.site.seasons.length - 1}`
        markDirty()
        renderEditor()
        return
    }
    const seasonOp = t.closest('[data-season-op]')
    if (seasonOp && state.mode === 'site') {
        const list = state.bundle.site.seasons
        const i = Number(seasonOp.dataset.index)
        if (seasonOp.dataset.seasonOp === 'del') {
            if (!confirm(`Xóa mùa "${list[i].name || list[i].id || 'mới'}"?`)) return
            list.splice(i, 1)
            state.tab = 'general'
        } else {
            const j = seasonOp.dataset.seasonOp === 'up' ? i - 1 : i + 1
            ;[list[i], list[j]] = [list[j], list[i]]
            state.tab = `s${j}`
        }
        markDirty()
        renderEditor()
        return
    }
    const langBtn = t.closest('[data-lang]')
    if (langBtn) {
        state.lang = langBtn.dataset.lang
        rerenderTab()
        return
    }
    const op = t.closest('[data-op]')
    if (op && state.bundle) {
        e.preventDefault() // nút nằm trong <summary>: không đóng / mở mục
        const path = JSON.parse(op.dataset.path)
        if (op.dataset.op === 'add') {
            const list = get(state.bundle, path) || []
            list.push(JSON.parse(op.dataset.template))
            set(state.bundle, path, list)
            state.open.set(JSON.stringify([...path, list.length - 1]), true)
        } else {
            const i = path[path.length - 1]
            const list = get(state.bundle, path.slice(0, -1))
            if (op.dataset.op === 'del') {
                if (!confirm('Xóa mục này?')) return
                list.splice(i, 1)
            } else {
                const j = op.dataset.op === 'up' ? i - 1 : i + 1
                ;[list[i], list[j]] = [list[j], list[i]]
            }
        }
        markDirty()
        rerenderTab()
        return
    }
    if (t.closest('#logout')) {
        if (state.dirty && !confirm('Đăng xuất? Thay đổi chưa đăng vẫn được giữ dạng nháp trên máy này.')) return
        logout()
        return
    }
    if (t.closest('#save')) openReview()
})

/* Rời trang sửa: thay đổi vẫn còn trong bản nháp tự lưu, mở lại sẽ được hỏi khôi phục */
window.addEventListener('hashchange', () => {
    if (state.dirty && state.bundle) {
        clearTimeout(saveDraftSoon.timer)
        try { localStorage.setItem(draftKey(), JSON.stringify({ bundle: state.bundle, savedAt: Date.now(), baseSha: state.baseSha })) } catch { /* bỏ qua */ }
        const here = state.mode === 'site' ? '#/site' : state.isNew ? '#/new' : `#/edit/${state.id}`
        if (!location.hash.startsWith(here)) {
            state.dirty = false
            toast('Thay đổi chưa đăng đã được lưu nháp trên máy này.', 3500)
        }
    }
    closeModal()
    render()
})
window.addEventListener('beforeunload', () => {
    if (state.dirty && state.bundle) {
        try { localStorage.setItem(draftKey(), JSON.stringify({ bundle: state.bundle, savedAt: Date.now(), baseSha: state.baseSha })) } catch { /* bỏ qua */ }
    }
})

/* Khởi động: token đã lưu (nếu có) */
try { state.token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) } catch { state.token = null }
if (state.token) {
    gh('/user').then(u => { state.user = u.login; state.avatar = u.avatar_url }).catch(() => {}).finally(render)
} else {
    render()
}
