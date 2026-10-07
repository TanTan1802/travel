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
}
const TR_LANGS = ['en', 'ko', 'zh', 'ja']
const LANG_NAMES = { en: 'English', ko: '한국어 (Hàn)', zh: '中文 (Trung)', ja: '日本語 (Nhật)' }
const DAYS = 5
const MONTH = () => new Date().toISOString().slice(0, 7)

const state = {
    token: null,
    user: null,
    baseSha: null,
    texts: {},     // nội dung gốc từng file (để so sánh, chỉ commit file đổi)
    data: {},      // JSON đã parse
    bundle: null,  // dữ liệu đang sửa của một điểm đến
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
    const changed = buildFiles(b)
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
    const action = state.isNew ? 'Thêm' : 'Cập nhật'
    const title = `${action} điểm đến: ${b.dest.name}`
    const message = `${title}\n\nTạo từ trang quản trị dữ liệu (/admin) bởi ${state.user}.${note ? `\n\n${note}` : ''}`
    const commit = await gh(`/repos/${REPO}/git/commits`, { method: 'POST', body: { message, tree: tree.sha, parents: [state.baseSha] } })
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
    const branch = `admin/${b.dest.id}-${stamp}`
    await gh(`/repos/${REPO}/git/refs`, { method: 'POST', body: { ref: `refs/heads/${branch}`, sha: commit.sha } })
    const body = [
        `${action} dữ liệu điểm đến **${b.dest.name}** (\`${b.dest.id}\`) từ trang quản trị.`,
        note ? `\n> ${note.replace(/\n/g, '\n> ')}` : '',
        '\n**File thay đổi:**',
        ...paths.map(p => `- \`${p}\``),
        '\nWorkflow **Kiểm tra PR từ trang quản trị** sẽ tự build lại trang, thêm commit vào PR này và chạy toàn bộ test.',
        'Khi kiểm tra xanh: xem lại thay đổi rồi merge – Cloudflare tự deploy, ảnh mới được tải về tự động.',
    ].join('\n')
    return gh(`/repos/${REPO}/pulls`, { method: 'POST', body: { title, head: branch, base: BASE_BRANCH, body } })
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
    const tabs = Object.entries(TABS).map(([key, t]) => `<button type="button" role="tab" data-tab="${key}" aria-selected="${key === state.tab}">${t.label}</button>`).join('')
    const errors = state.errors.length ? `<div class="errors"><strong>Chưa lưu được – cần sửa ${state.errors.length} chỗ:</strong><ul>${state.errors.slice(0, 25).map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>` : ''
    $('#app').innerHTML = `
        <p><a href="#/">← Danh sách điểm đến</a></p>
        <h1>${state.isNew ? 'Thêm điểm đến mới' : `Sửa: ${esc(b.dest.name)}`}</h1>
        ${errors}
        <div class="tabs" role="tablist">${tabs}</div>
        <div class="card" id="tab-body">${TABS[state.tab].fields().map(field).join('')}</div>
        ${iconDatalist()}
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
    if (route === '/new' || edit) {
        const id = edit ? edit[1] : null
        if (state.id !== id || !state.bundle || state.isNew !== !edit) {
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
    else if (kind === 'number') set(b, path, el.value === '' ? 0 : Number(el.value))
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
        const working = clone(state.bundle)
        cleanBundle(working)
        state.errors = validate(working)
        if (state.errors.length) {
            rerenderTab()
            window.scrollTo(0, 0)
            return
        }
        btn.disabled = true
        btn.textContent = 'Đang tạo Pull Request…'
        try {
            const pr = await saveAsPullRequest(working, $('#save-note').value.trim())
            state.dirty = false
            state.bundle = null
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
        const leaving = !location.hash.startsWith(state.isNew ? '#/new' : `#/edit/${state.id}`)
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
