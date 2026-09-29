/*==================== TRANG CHỦ: RENDER DANH SÁCH ĐIỂM ĐẾN ====================*/
/*==================== TÌM KIẾM THÔNG MINH ====================*/
/*
 * - Gõ không dấu ("pho") → so khớp không phân biệt dấu (phở, phố...).
 * - Gõ có dấu ("phở")   → so khớp chính xác theo dấu.
 * - Mọi từ khóa phải cùng khớp trong MỘT trường (tên, món ăn, điểm nhấn...).
 * - Khớp trọn từ được ưu tiên; khớp đầu từ chỉ áp dụng cho từ đang gõ dài từ 4 ký tự.
 * - Kết quả xếp theo mức độ liên quan và hiển thị lý do khớp.
 */
const PREFIX_MIN_LENGTH = 4

function normalizeText(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
}

const hasDiacritics = word => word !== normalizeText(word)

function splitWords(text) {
    return text.normalize('NFC').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)
}

/* Các trường dữ liệu được tìm kiếm, kèm trọng số và nhãn gợi ý */
function searchFields(d) {
    return [
        { text: d.name, weight: 10 },
        { text: d.province, weight: 6, label: 'Tỉnh/thành' },
        { text: REGIONS[d.region], weight: 2, label: 'Vùng' },
        ...d.highlights.map(h => ({ text: h, weight: 4, label: 'Điểm nhấn' })),
        ...d.foods.map(f => ({ text: f.name, weight: 3, label: 'Món ăn' })),
        ...d.activities.map(a => ({ text: a.title, weight: 2, label: 'Trải nghiệm' })),
        { text: d.tagline, weight: 1 },
    ].map(field => ({ ...field, words: splitWords(field.text) }))
}

/* 2 = khớp trọn từ, 1 = khớp đầu từ, 0 = không khớp */
function tokenQuality(token, word, allowPrefix) {
    const exact = hasDiacritics(token)
    const a = exact ? word : normalizeText(word)
    const b = exact ? token : normalizeText(token)
    if (a === b) return 2
    if (allowPrefix && a.startsWith(b)) return 1
    return 0
}

function fieldQuality(tokens, field) {
    let total = 0
    for (let i = 0; i < tokens.length; i++) {
        const isLast = i === tokens.length - 1
        const allowPrefix = isLast && tokens[i].length >= PREFIX_MIN_LENGTH
        const best = Math.max(0, ...field.words.map(w => tokenQuality(tokens[i], w, allowPrefix)))
        if (!best) return 0
        total += best
    }
    return total / (2 * tokens.length) // 0..1
}

/* Trả về { score, hint } hoặc null nếu không khớp */
function scoreDestination(d, tokens) {
    let best = null
    for (const field of searchFields(d)) {
        const quality = fieldQuality(tokens, field)
        if (!quality) continue
        const score = field.weight * quality
        if (!best || score > best.score) best = { score, field }
    }
    if (!best) return null
    return { score: best.score, hint: best.field.label ? `${best.field.label}: ${best.field.text}` : '' }
}

/*==================== DISCOVER (SWIPER) ====================*/
const FEATURED_IDS = ['vinh-ha-long', 'hoi-an', 'sa-pa', 'phu-quoc', 'ninh-binh', 'da-nang', 'ha-giang']

function renderDiscover() {
    const list = document.getElementById('discover-list')
    if (!list) return

    list.innerHTML = FEATURED_IDS.map(getDestination).filter(Boolean).map(d => `
        <a href="${destinationUrl(d.id)}" class="discover__card swiper-slide">
            <img data-wiki="${wikiAttr(heroCandidates(d))}" data-width="960" alt="${d.name}" class="discover__img">
            <div class="discover__data">
                <h2 class="discover__title">${d.name}</h2>
                <span class="discover__description">${d.province} · ${REGIONS[d.region]}</span>
            </div>
        </a>
    `).join('')
}

/*==================== EXPLORE: TÌM KIẾM + LỌC ====================*/
const exploreState = {
    region: 'all',
    category: 'all',
    query: '',
    view: 'grid',
}

/*==================== EXPLORE: BẢN ĐỒ ====================*/
const exploreMap = { map: null, markers: [], results: [] }

function updateExploreMap(results) {
    exploreMap.results = results
    if (!exploreMap.map) return

    exploreMap.markers.forEach(m => m.remove())
    exploreMap.markers = results.map(({ d }) =>
        bindDestinationPopup(L.marker([d.lat, d.lng], { icon: pinIcon(d.region), title: d.name }), d).addTo(exploreMap.map))

    if (results.length) {
        const bounds = L.latLngBounds(results.map(({ d }) => [d.lat, d.lng]))
        exploreMap.map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 })
    }
}

function showExploreMap() {
    const el = document.getElementById('explore-map')
    el.hidden = false
    if (!mapAvailable()) return showMapUnavailable(el)

    if (!exploreMap.map) {
        exploreMap.map = createMap(el)
        updateExploreMap(exploreMap.results)
    }
    exploreMap.map.invalidateSize()
}

function setView(view) {
    exploreState.view = view
    document.querySelectorAll('.view-toggle__btn').forEach(btn => {
        const active = btn.dataset.view === view
        btn.classList.toggle('view-toggle__btn--active', active)
        btn.setAttribute('aria-pressed', active)
    })
    document.getElementById('dest-grid').hidden = view !== 'grid'
    if (view === 'map') showExploreMap()
    else document.getElementById('explore-map').hidden = true
}

function renderChips(containerId, options, key) {
    const container = document.getElementById(containerId)
    if (!container) return

    container.innerHTML = Object.entries(options).map(([value, label]) => `
        <button type="button" class="chip${exploreState[key] === value ? ' chip--active' : ''}" data-value="${value}">
            ${label}
        </button>
    `).join('')

    container.addEventListener('click', e => {
        const chip = e.target.closest('.chip')
        if (!chip) return
        exploreState[key] = chip.dataset.value
        container.querySelectorAll('.chip').forEach(c => c.classList.toggle('chip--active', c === chip))
        renderGrid()
    })
}

function renderGrid() {
    const grid = document.getElementById('dest-grid')
    if (!grid) return

    const tokens = splitWords(exploreState.query)
    const results = DESTINATIONS
        .filter(d =>
            (exploreState.region === 'all' || d.region === exploreState.region) &&
            (exploreState.category === 'all' || d.categories.includes(exploreState.category)))
        .map(d => ({ d, match: tokens.length ? scoreDestination(d, tokens) : { score: 0, hint: '' } }))
        .filter(r => r.match)
        .sort((a, b) => b.match.score - a.match.score)

    grid.innerHTML = results.map(r => destinationCard(r.d, r.match.hint)).join('')
    hydrateWikiImages(grid)
    updateExploreMap(results)

    document.getElementById('explore-empty').hidden = results.length > 0
    document.getElementById('explore-result').textContent =
        `Hiển thị ${results.length} / ${DESTINATIONS.length} điểm đến`

    const tip = document.getElementById('explore-tip')
    const looseSearch = tokens.some(t => !hasDiacritics(t)) && results.length > 4
    tip.hidden = !looseSearch
    if (looseSearch) {
        tip.textContent = `Mẹo: gõ có dấu (ví dụ "phở" thay vì "pho") để kết quả chính xác hơn.`
    }
}

function initExplore() {
    const params = new URLSearchParams(location.search)
    if (REGIONS[params.get('region')]) exploreState.region = params.get('region')

    renderChips('region-filters', { all: 'Tất cả', ...REGIONS }, 'region')
    renderChips('category-filters', { all: 'Mọi loại hình', ...CATEGORIES }, 'category')

    const search = document.getElementById('explore-search')
    if (search) {
        search.addEventListener('input', () => {
            exploreState.query = search.value
            renderGrid()
        })
    }

    document.querySelectorAll('.view-toggle__btn').forEach(btn =>
        btn.addEventListener('click', () => setView(btn.dataset.view)))
    if (params.get('view') === 'map') setView('map')

    const count = document.getElementById('dest-count')
    if (count) count.textContent = DESTINATIONS.length

    renderGrid()
}

renderDiscover()
initExplore()
hydrateWikiImages()
