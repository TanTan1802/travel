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
const thumbUrl = file => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=320`
const commonsPage = file => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, '_'))}`
const IMAGE_RE = /\.(jpe?g|png|webp|JPE?G|PNG)$/
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const YM_RE = /^20[0-9]{2}-(0[1-9]|1[0-2])$/

function toast(message, ms = 4000) {
    const el = $('#toast')
    el.textContent = message
    el.hidden = false
    clearTimeout(toast.timer)
    toast.timer = setTimeout(() => { el.hidden = true }, ms)
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
    try {
        if (remember) localStorage.setItem(TOKEN_KEY, token)
        else sessionStorage.setItem(TOKEN_KEY, token)
    } catch { /* trình duyệt chặn lưu trữ – vẫn dùng được trong phiên này */ }
}

function logout() {
    try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY) } catch { /* bỏ qua */ }
    Object.assign(state, { token: null, user: null, baseSha: null, texts: {}, data: {}, bundle: null, dirty: false })
    location.hash = '#/'
    render()
}

async function loadData() {
    const ref = await gh(`/repos/${REPO}/git/ref/heads/${BASE_BRANCH}`)
    state.baseSha = ref.object.sha
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

function listField(spec, items) {
    const path = spec.path
    const rows = items.map((item, i) => `
        <div class="list__item">
            <div class="list__head">
                <span>${esc(spec.itemLabel ? spec.itemLabel(item, i) : `#${i + 1}`)}</span>
                ${spec.fixed ? '' : `<span class="list__tools">
                    <button type="button" class="icon-btn" data-op="up" ${attrs([...path, i], 'op')} title="Lên"${i === 0 ? ' disabled' : ''}>↑</button>
                    <button type="button" class="icon-btn" data-op="down" ${attrs([...path, i], 'op')} title="Xuống"${i === items.length - 1 ? ' disabled' : ''}>↓</button>
                    <button type="button" class="icon-btn icon-btn--danger" data-op="del" ${attrs([...path, i], 'op')} title="Xóa">Xóa</button>
                </span>`}
            </div>
            ${spec.fields(i).map(field).join('')}
        </div>`).join('')
    return `<div class="field">
        ${spec.label ? `<h3>${esc(spec.label)}</h3>` : ''}
        ${spec.help ? `<div class="field__help">${spec.help}</div>` : ''}
        <div class="list">${rows || '<p class="muted small">Chưa có mục nào.</p>'}</div>
        ${spec.fixed ? '' : `<p><button type="button" class="button button--ghost" data-op="add" data-template="${esc(JSON.stringify(spec.newItem()))}" ${attrs(path, 'op')}>+ ${esc(spec.addLabel || 'Thêm')}</button></p>`}
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
                { type: 'html', html: `<div class="toolbar">${TR_LANGS.map(l => `<button type="button" class="button${l === lang ? '' : ' button--ghost'}" data-lang="${l}">${LANG_NAMES[l]}</button>`).join('')}</div>
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

/*---------- Trang ----------*/
function renderLogin(error) {
    $('#bar-nav').hidden = true
    $('#app').innerHTML = `
        <div class="card" style="max-width:640px">
            <h1>Đăng nhập</h1>
            <p>Trang này sửa trực tiếp dữ liệu trong repo <a href="https://github.com/${REPO}" target="_blank" rel="noopener">${REPO}</a> bằng một <strong>fine-grained token</strong> GitHub. Token chỉ lưu trên trình duyệt này và chỉ gửi tới api.github.com.</p>
            <ol class="steps">
                <li>Mở <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → Fine-grained tokens → Generate new token</a>.</li>
                <li><strong>Repository access</strong>: Only select repositories → <code>travel</code>. Đặt thời hạn (vd. 90 ngày).</li>
                <li><strong>Permissions → Repository</strong>: <code>Contents</code> = Read and write, <code>Pull requests</code> = Read and write.</li>
                <li>Bấm Generate, chép token (bắt đầu bằng <code>github_pat_</code>) và dán vào ô dưới. Không gửi token cho ai khác.</li>
            </ol>
            ${error ? `<div class="errors">${esc(error)}</div>` : ''}
            <form id="login-form">
                <div class="field"><label for="token">Token</label><input type="password" id="token" autocomplete="off" required placeholder="github_pat_…"></div>
                <div class="field"><label class="checks" style="font-weight:400"><input type="checkbox" id="remember"> Ghi nhớ trên máy này (chỉ máy riêng của bạn)</label></div>
                <button class="button" type="submit">Đăng nhập</button>
            </form>
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

function renderList() {
    const d = state.data
    const rows = d.destinations.destinations.map(x => {
        const badges = TR_LANGS.map(l => `<span class="badge ${d[l].destinations?.[x.id] ? 'badge--ok' : 'badge--miss'}" title="${LANG_NAMES[l]}">${l}</span>`).join('')
        const illus = x.foods.filter(f => f.illustrative).length
        return `<tr data-search="${esc(`${x.id} ${x.name} ${x.province}`.toLowerCase())}">
            <td><a href="#/edit/${x.id}"><strong>${esc(x.name)}</strong></a><br><span class="muted small">${esc(x.id)}</span></td>
            <td>${esc(x.province)}<br><span class="muted small">${esc(d.destinations.regions[x.region] || x.region)}</span></td>
            <td>${x.foods.length} món${illus ? ` <span class="muted small">(${illus} ảnh minh họa)</span>` : ''}<br><span class="muted small">${(d.places.places[x.id]?.eats || []).length} quán · ${(d.sights.sights[x.id] || []).flat().length} điểm</span></td>
            <td>${badges}</td>
            <td><a class="button button--ghost" href="#/edit/${x.id}">Sửa</a></td>
        </tr>`
    }).join('')
    $('#app').innerHTML = `
        <h1>Điểm đến (${d.destinations.destinations.length})</h1>
        <div class="toolbar">
            <input type="search" id="search" placeholder="Tìm theo tên, mã, tỉnh…" aria-label="Tìm điểm đến">
            <a class="button" href="#/new">+ Thêm điểm đến</a>
            <a class="button button--ghost" href="#/site">Giao diện & mùa</a>
            <button type="button" class="button button--ghost" id="reload">Tải lại dữ liệu</button>
            <span class="muted small">Dữ liệu nhánh main · commit ${esc(state.baseSha.slice(0, 7))}</span>
        </div>
        <div class="card" style="padding:0;overflow-x:auto">
            <table>
                <thead><tr><th>Điểm đến</th><th>Tỉnh / vùng</th><th>Nội dung</th><th>Bản dịch</th><th></th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        <p class="muted small">Ngoài điểm đến, các dữ liệu khác (lễ hội, cẩm nang, tàu hỏa / cảng ra đảo, chuỗi giao diện) vẫn sửa trong repo – xem docs/du-lieu.md.</p>`
    $('#search').addEventListener('input', e => {
        const q = e.target.value.trim().toLowerCase()
        document.querySelectorAll('tbody tr').forEach(tr => { tr.hidden = q && !tr.dataset.search.includes(q) })
    })
    $('#reload').addEventListener('click', async e => {
        e.target.disabled = true
        await loadData().catch(err => toast(err.message))
        renderList()
    })
}

function iconDatalist() {
    const icons = new Set()
    state.data.destinations.destinations.forEach(d => d.activities.forEach(a => icons.add(a.icon)))
    return `<datalist id="icon-list">${[...icons].sort().map(i => `<option value="${esc(i)}">`).join('')}</datalist>`
}

function renderEditor() {
    const b = state.bundle
    const allTabs = currentTabs()
    if (!allTabs[state.tab]) state.tab = Object.keys(allTabs)[0]
    const tabs = Object.entries(allTabs).map(([key, t]) => `<button type="button" role="tab" data-tab="${key}" aria-selected="${key === state.tab}">${esc(t.label)}</button>`).join('') +
        (state.mode === 'site' ? '<button type="button" data-season-add>+ Thêm mùa</button>' : '')
    const heading = state.mode === 'site' ? 'Giao diện & mùa' : state.isNew ? 'Thêm điểm đến mới' : `Sửa: ${esc(b.dest.name)}`
    const errors = state.errors.length ? `<div class="errors"><strong>Chưa lưu được – cần sửa ${state.errors.length} chỗ:</strong><ul>${state.errors.slice(0, 25).map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''
    $('#app').innerHTML = `
        <p><a href="#/">← Danh sách điểm đến</a></p>
        <h1>${heading}</h1>
        ${errors}
        <div class="tabs" role="tablist">${tabs}</div>
        <div class="card" id="tab-body">${allTabs[state.tab].fields().map(field).join('')}</div>
        ${state.mode === 'site' ? linkDatalist() : iconDatalist()}
        <div class="savebar">
            <span class="savebar__status">${state.dirty ? 'Có thay đổi chưa lưu' : 'Chưa có thay đổi'}</span>
            <input type="text" id="save-note" placeholder="Ghi chú cho người duyệt (tùy chọn)" style="max-width:320px">
            <button type="button" class="button" id="save">Lưu thành Pull Request</button>
        </div>`
}

function renderDone(pr) {
    $('#app').innerHTML = `
        <div class="card" style="max-width:720px">
            <h1>Đã tạo Pull Request ✔</h1>
            <p><a class="button" href="${esc(pr.html_url)}" target="_blank" rel="noopener">Mở PR #${pr.number}: ${esc(pr.title)}</a></p>
            <ol class="steps">
                <li>Workflow <strong>Kiểm tra PR từ trang quản trị</strong> tự build lại trang, thêm commit vào PR và chạy toàn bộ test (khoảng 5 phút).</li>
                <li>Nếu báo lỗi: xem log trong tab Checks của PR, sửa lại ở trang này (sẽ tạo PR mới) rồi đóng PR cũ.</li>
                <li>Khi xanh: xem tab <em>Files changed</em> rồi bấm <strong>Merge</strong>. Cloudflare tự deploy, ảnh mới được tự tải về.</li>
            </ol>
            <p><a href="#/">← Về danh sách điểm đến</a></p>
        </div>`
}

function render() {
    if (!state.token) return renderLogin()
    $('#bar-nav').hidden = false
    $('#bar-user').textContent = state.user ? `@${state.user}` : ''
    if (!state.baseSha) {
        $('#app').innerHTML = '<p class="muted">Đang tải dữ liệu từ GitHub…</p>'
        return loadData().then(render).catch(err => {
            if (err.status === 401) return logout()
            $('#app').innerHTML = `<div class="errors">Không tải được dữ liệu: ${esc(err.message)}</div>`
        })
    }
    const route = location.hash.replace(/^#/, '') || '/'
    const edit = route.match(/^\/edit\/([a-z0-9-]+)$/)
    if (route === '/site') {
        if (state.mode !== 'site' || !state.bundle) {
            Object.assign(state, { mode: 'site', id: null, isNew: false, tab: 'general', dirty: false, errors: [] })
            state.bundle = { site: toEditableSite(state.data.site) }
        }
        return renderEditor()
    }
    if (route === '/new' || edit) {
        const id = edit ? edit[1] : null
        if (state.mode !== 'dest' || state.id !== id || !state.bundle || state.isNew !== !edit) {
            state.mode = 'dest'
            state.isNew = !edit
            state.id = id
            state.bundle = edit ? loadBundle(id) : newBundle()
            state.tab = 'info'
            state.dirty = false
            state.errors = []
            if (!state.bundle) {
                $('#app').innerHTML = `<div class="errors">Không có điểm đến "${esc(id)}".</div><p><a href="#/">← Danh sách</a></p>`
                return
            }
        }
        return renderEditor()
    }
    state.bundle = null
    state.mode = null
    state.id = null
    renderList()
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
        state.dirty = true
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
    if (!state.dirty) {
        state.dirty = true
        const status = document.querySelector('.savebar__status')
        if (status) status.textContent = 'Có thay đổi chưa lưu'
    }
})
document.addEventListener('change', e => {
    if (e.target.matches('input[type="checkbox"][data-path]')) e.target.dispatchEvent(new Event('input', { bubbles: true }))
})

document.addEventListener('click', async e => {
    const tab = e.target.closest('[data-tab]')
    if (tab) {
        state.tab = tab.dataset.tab
        renderEditor()
        return
    }
    const preset = e.target.closest('[data-preset]')
    if (preset && state.bundle) {
        const [hue, accentHue] = preset.dataset.preset.split(',').map(Number)
        set(state.bundle, JSON.parse(preset.dataset.path), { hue, accentHue })
        state.dirty = true
        rerenderTab()
        return
    }
    if (e.target.closest('[data-season-add]') && state.mode === 'site') {
        state.bundle.site.seasons.push(newSeason())
        state.tab = `s${state.bundle.site.seasons.length - 1}`
        state.dirty = true
        renderEditor()
        return
    }
    const seasonOp = e.target.closest('[data-season-op]')
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
        state.dirty = true
        renderEditor()
        return
    }
    const langBtn = e.target.closest('[data-lang]')
    if (langBtn) {
        state.lang = langBtn.dataset.lang
        rerenderTab()
        return
    }
    const op = e.target.closest('[data-op]')
    if (op && state.bundle) {
        const path = JSON.parse(op.dataset.path)
        if (op.dataset.op === 'add') {
            const list = get(state.bundle, path) || []
            list.push(JSON.parse(op.dataset.template))
            set(state.bundle, path, list)
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
        state.dirty = true
        rerenderTab()
        return
    }
    if (e.target.id === 'logout') {
        if (state.dirty && !confirm('Có thay đổi chưa lưu – vẫn đăng xuất?')) return
        logout()
        return
    }
    if (e.target.id === 'save') {
        const btn = e.target
        const isSite = state.mode === 'site'
        const working = isSite ? fromEditableSite(state.bundle.site) : clone(state.bundle)
        if (!isSite) cleanBundle(working)
        state.errors = isSite ? validateSite(working) : validate(working)
        if (state.errors.length) {
            rerenderTab()
            window.scrollTo(0, 0)
            return
        }
        btn.disabled = true
        btn.textContent = 'Đang tạo Pull Request…'
        try {
            const note = $('#save-note').value.trim()
            const pr = isSite
                ? await createPullRequest(buildSiteFiles(working), {
                    title: 'Cập nhật giao diện & mùa',
                    slug: 'giao-dien',
                    summary: `Cập nhật giao diện & mùa (\`data/site.json\`) từ trang quản trị: ${working.seasons.length} mùa (${working.seasons.filter(x => x.enabled).map(x => x.name).join(', ') || 'không mùa nào bật'}).`,
                }, note)
                : await saveAsPullRequest(working, note)
            state.dirty = false
            state.bundle = null
            state.mode = null
            state.id = null
            state.baseSha = null // lần sau tải lại dữ liệu mới nhất
            renderDone(pr)
        } catch (err) {
            btn.disabled = false
            btn.textContent = 'Lưu thành Pull Request'
            toast(err.status === 403 ? 'Token thiếu quyền (cần Contents + Pull requests: Read and write).' : err.message, 8000)
        }
    }
})

window.addEventListener('hashchange', e => {
    if (state.dirty && state.bundle) {
        const here = state.mode === 'site' ? '#/site' : state.isNew ? '#/new' : `#/edit/${state.id}`
        const leaving = !location.hash.startsWith(here)
        if (leaving && !confirm('Có thay đổi chưa lưu – rời trang sửa?')) {
            history.replaceState(null, '', new URL(e.oldURL).hash)
            return
        }
        if (leaving) state.dirty = false
    }
    render()
})
window.addEventListener('beforeunload', e => {
    if (state.dirty) e.preventDefault()
})

/* Khởi động: token đã lưu (nếu có) */
try { state.token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) } catch { state.token = null }
if (state.token) {
    gh('/user').then(u => { state.user = u.login }).catch(() => {}).finally(render)
} else {
    render()
}
