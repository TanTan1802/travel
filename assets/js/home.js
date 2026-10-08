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
        { text: d.province, weight: 6, label: t('Tỉnh/thành') },
        { text: REGIONS[d.region], weight: 2, label: t('Vùng') },
        ...d.highlights.map(h => ({ text: h, weight: 4, label: t('Điểm nhấn') })),
        ...d.foods.map(f => ({ text: f.name, weight: 3, label: t('Món ăn') })),
        ...d.activities.map(a => ({ text: a.title, weight: 2, label: t('Trải nghiệm') })),
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
/* Danh sách nổi bật lấy từ data/site.json (window.HOME_FEATURED / mùa đang chạy: window.HOME_SEASON – do build ghi vào trang) */
const FEATURED_IDS = ['vinh-ha-long', 'hoi-an', 'sa-pa', 'phu-quoc', 'ninh-binh', 'da-nang', 'ha-giang']

function renderDiscover() {
    const list = document.getElementById('discover-list')
    if (!list) return

    const season = window.HOME_SEASON
    const ids = (season && season.featured) || window.HOME_FEATURED || FEATURED_IDS
    const title = document.querySelector('#discover .section__title')
    if (season && season.ft && title) title.innerHTML = season.ft

    list.innerHTML = ids.map(getDestination).filter(Boolean).map(d => `
        <a href="${destinationUrl(d.id)}" class="discover__card">
            <img data-wiki="${wikiAttr(heroCandidates(d))}" data-width="960" data-sizes="(max-width: 1024px) 200px, 237px" alt="${d.name}" class="discover__img">
            <div class="discover__data">
                <h2 class="discover__title">${d.name}</h2>
                <span class="discover__description">${d.province} · ${REGIONS[d.region]}</span>
            </div>
        </a>
    `).join('')
}

/*==================== EXPLORE: TÌM KIẾM + LỌC ====================*/
const exploreState = {
    visible: 0,
    region: 'all',
    category: 'all',
    query: '',
    view: 'grid',
    favoritesOnly: false,
    month: 0,
    near: null,
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

async function showExploreMap() {
    const el = document.getElementById('explore-map')
    el.hidden = false
    if (!(await loadLeaflet())) return showMapUnavailable(el)
    if (exploreState.view !== 'map') return // người dùng đã chuyển lại dạng lưới khi đang tải

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

const CATEGORY_ICONS = {
    all: 'ri-apps-2-line',
    bien: 'ri-sailboat-line',
    nui: 'ri-landscape-line',
    'di-san': 'ri-ancient-pavilion-line',
    'thanh-pho': 'ri-building-2-line',
    'hang-dong': 'ri-moon-foggy-line',
}

/* Số điểm đến của mỗi lựa chọn (hiện cạnh tên bộ lọc) */
function optionCount(key, value) {
    if (value === 'all') return DESTINATIONS.length
    return DESTINATIONS.filter(d => (key === 'region' ? d.region === value : d.categories.includes(value))).length
}

function syncChips(containerId, key) {
    document.querySelectorAll(`#${containerId} .chip`).forEach(c => {
        const active = c.dataset.value === exploreState[key]
        c.classList.toggle('chip--active', active)
        c.setAttribute('aria-pressed', active)
    })
}

function renderChips(containerId, options, key, { icons = null } = {}) {
    const container = document.getElementById(containerId)
    if (!container) return

    container.innerHTML = Object.entries(options).map(([value, label]) => `
        <button type="button" class="chip" data-value="${value}" aria-pressed="false">
            ${icons ? `<i class="${icons[value] || 'ri-price-tag-3-line'}"></i>` : ''}
            <span>${label}</span>
            <small class="chip__count">${optionCount(key, value)}</small>
        </button>
    `).join('')
    syncChips(containerId, key)

    container.addEventListener('click', e => {
        const chip = e.target.closest('.chip')
        if (!chip) return
        exploreState[key] = chip.dataset.value
        syncChips(containerId, key)
        renderGrid()
    })
}

/* Có bộ lọc nào đang bật không (để hiện nút "Xóa bộ lọc") */
const filtersActive = () => exploreState.region !== 'all' || exploreState.category !== 'all'
    || exploreState.month > 0 || exploreState.favoritesOnly || exploreState.query.trim() !== ''

function resetFilters() {
    Object.assign(exploreState, { region: 'all', category: 'all', month: 0, favoritesOnly: false, query: '' })
    syncChips('region-filters', 'region')
    syncChips('category-filters', 'category')
    const search = document.getElementById('explore-search')
    if (search) search.value = ''
    const month = document.getElementById('month-filter')
    if (month) {
        month.value = '0'
        month.parentElement.classList.remove('month-filter--active')
    }
    const fav = document.getElementById('fav-filter')
    if (fav) {
        fav.classList.remove('chip--active')
        fav.setAttribute('aria-pressed', 'false')
    }
    renderGrid()
}

/* Đường bộ dài hơn đường chim bay khoảng 30% (giống trình lập kế hoạch) */
const ROAD_FACTOR_HOME = 1.3

/* "Gần tôi": lấy vị trí điện thoại (chỉ dùng trong trình duyệt, không gửi đi đâu) */
function initNearFilter() {
    const btn = document.getElementById('near-filter')
    if (!btn) return
    if (!('geolocation' in navigator)) {
        btn.hidden = true
        return
    }
    btn.addEventListener('click', () => {
        if (exploreState.near) {
            exploreState.near = null
            btn.setAttribute('aria-pressed', 'false')
            btn.classList.remove('chip--active')
            return renderGrid()
        }
        btn.classList.add('chip--loading')
        navigator.geolocation.getCurrentPosition(pos => {
            btn.classList.remove('chip--loading')
            exploreState.near = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            btn.setAttribute('aria-pressed', 'true')
            btn.classList.add('chip--active')
            renderGrid()
            showToast(t('Đã sắp xếp điểm đến theo khoảng cách từ vị trí của bạn'))
        }, () => {
            btn.classList.remove('chip--loading')
            showToast(t('Không lấy được vị trí – hãy cho phép truy cập vị trí trong trình duyệt'))
        }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 })
    })
}

/* Nhắc chuyến đi đã lên kế hoạch: đang đi → hôm nay là ngày mấy; sắp đi (≤ 14 ngày) → đếm ngược */
const TRIP_BANNER_DISMISS = 'viet-travel:trip-banner-closed'

function renderTripBanner() {
    const box = document.getElementById('trip-banner')
    if (!box || typeof tripStatus !== 'function') return
    const plan = TripPlan.get()
    const status = tripStatus(plan)
    const today = currentIsoDate()
    let dismissed = ''
    try { dismissed = sessionStorage.getItem(TRIP_BANNER_DISMISS) || '' } catch { /* bỏ qua */ }
    if (!status || dismissed === today || (status.kind === 'upcoming' && status.inDays > 14)) return

    let text
    if (status.kind === 'ongoing') {
        let offset = status.dayIndex
        const stop = plan.stops.find(s => (offset -= s.days) < 0)
        text = t('Hôm nay là ngày {n}/{total} của chuyến đi – {name}', { n: status.dayIndex + 1, total: status.trip.days, name: getDestination(stop.id).name })
    } else {
        text = status.inDays === 1 ? t('Ngày mai khởi hành!') : t('Còn {n} ngày nữa là tới chuyến đi', { n: status.inDays })
    }
    box.innerHTML = `
        <i class="ri-suitcase-3-line trip-banner__icon"></i>
        <div class="trip-banner__text">
            <strong>${text}</strong>
            <a href="${plannerUrl(status.kind === 'ongoing' ? '#today' : '')}">${status.kind === 'ongoing' ? t('Xem lịch hôm nay') : t('Xem kế hoạch')} <i class="ri-arrow-right-line"></i></a>
        </div>
        <button type="button" class="trip-banner__close" aria-label="${t('Đóng')}"><i class="ri-close-line"></i></button>
    `
    box.hidden = false
    box.querySelector('.trip-banner__close').addEventListener('click', () => {
        box.hidden = true
        try { sessionStorage.setItem(TRIP_BANNER_DISMISS, today) } catch { /* bỏ qua */ }
    })
}

/* Danh sách hiện theo trang để trang chủ không quá dài (nhất là trên điện thoại) */
const GRID_PAGE = 8

function renderGrid({ more = false } = {}) {
    const grid = document.getElementById('dest-grid')
    if (!grid) return
    exploreState.visible = more ? exploreState.visible + GRID_PAGE : GRID_PAGE

    const tokens = splitWords(exploreState.query)
    const results = DESTINATIONS
        .filter(d =>
            (exploreState.region === 'all' || d.region === exploreState.region) &&
            (exploreState.category === 'all' || d.categories.includes(exploreState.category)) &&
            (!exploreState.favoritesOnly || Favorites.has(d.id)) &&
            (!exploreState.month || d.bestMonths.includes(exploreState.month)))
        .map(d => ({ d, match: tokens.length ? scoreDestination(d, tokens) : { score: 0, hint: '' } }))
        .filter(r => r.match)
        .map(r => (exploreState.near ? { ...r, km: distanceKm(exploreState.near, r.d) } : r))
        /* "Gần tôi" (khi không tìm kiếm): sắp theo khoảng cách; còn lại theo độ khớp từ khóa */
        .sort((a, b) => (exploreState.near && !tokens.length ? a.km - b.km : b.match.score - a.match.score))

    const shown = results.slice(0, exploreState.visible)
    grid.innerHTML = shown.map(r => (r.km != null && !r.match.hint
        ? destinationCard(r.d, t('Cách bạn ~{km} km', { km: Math.round(r.km * ROAD_FACTOR_HOME).toLocaleString(LANG === 'vi' ? 'vi-VN' : 'en-US') }), 'ri-focus-3-line')
        : destinationCard(r.d, r.match.hint))).join('')
    grid.dataset.results = results.length
    const rest = results.length - shown.length
    document.getElementById('explore-more-wrap').hidden = rest <= 0
    if (rest > 0) {
        document.getElementById('explore-more').innerHTML =
            `${t('Xem thêm {n} điểm đến', { n: Math.min(GRID_PAGE, rest) })} <i class="ri-arrow-down-s-line"></i>`
    }
    hydrateWikiImages(grid)
    syncFavoriteButtons(grid)
    updateExploreMap(results)

    document.getElementById('explore-empty').hidden = results.length > 0
    document.getElementById('explore-empty-text').textContent = exploreState.favoritesOnly && !Favorites.count()
        ? t('Bạn chưa lưu điểm đến nào. Nhấn biểu tượng ♥ trên thẻ để lưu lại nhé!')
        : t('Không tìm thấy điểm đến phù hợp. Hãy thử từ khóa khác nhé!')
    document.getElementById('explore-result').textContent =
        t('Hiển thị {count} / {total} điểm đến', { count: results.length, total: DESTINATIONS.length })

    const reset = document.getElementById('filter-reset')
    if (reset) reset.hidden = !filtersActive()

    const tip = document.getElementById('explore-tip')
    const looseSearch = LANG === 'vi' && tokens.some(token => !hasDiacritics(token)) && results.length > 4
    tip.hidden = !looseSearch
    if (looseSearch) {
        tip.textContent = `Mẹo: gõ có dấu (ví dụ "phở" thay vì "pho") để kết quả chính xác hơn.`
    }
}

function initFavoriteFilter() {
    const btn = document.getElementById('fav-filter')
    const counter = document.getElementById('fav-count')
    if (!btn) return

    const update = () => { counter.textContent = Favorites.count() }
    btn.addEventListener('click', () => {
        exploreState.favoritesOnly = !exploreState.favoritesOnly
        btn.classList.toggle('chip--active', exploreState.favoritesOnly)
        btn.setAttribute('aria-pressed', exploreState.favoritesOnly)
        renderGrid()
    })
    window.addEventListener('favorites:change', () => {
        update()
        if (exploreState.favoritesOnly) renderGrid()
    })
    if (new URLSearchParams(location.search).get('favorites') === '1') btn.click()
    update()
}

/* Lọc điểm đến theo tháng muốn đi (dựa trên mùa đẹp) */
function initMonthFilter() {
    const select = document.getElementById('month-filter')
    if (!select) return
    select.innerHTML = [`<option value="0">${t('Mọi tháng')}</option>`,
        ...Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${t('Đi vào tháng {m}', { m: monthLabel(i + 1) })}</option>`)].join('')
    select.addEventListener('change', () => {
        exploreState.month = Number(select.value)
        select.parentElement.classList.toggle('month-filter--active', exploreState.month > 0)
        renderGrid()
    })
}

function initExplore() {
    const params = new URLSearchParams(location.search)
    if (REGIONS[params.get('region')]) exploreState.region = params.get('region')

    renderChips('region-filters', { all: t('Tất cả'), ...REGIONS }, 'region')
    renderChips('category-filters', { all: t('Mọi loại hình'), ...CATEGORIES }, 'category', { icons: CATEGORY_ICONS })
    document.getElementById('filter-reset')?.addEventListener('click', resetFilters)

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

    initFavoriteFilter()
    initMonthFilter()
    initNearFilter()

    const count = document.getElementById('dest-count')
    if (count) count.textContent = DESTINATIONS.length

    renderGrid()

    document.getElementById('explore-more')?.addEventListener('click', () => renderGrid({ more: true }))
    document.getElementById('explore-all')?.addEventListener('click', () => {
        exploreState.visible = DESTINATIONS.length - GRID_PAGE
        renderGrid({ more: true })
    })
}

/*==================== ĐI ĐÂU THÁNG NÀY ====================*/
/* Chọn theo tháng trên máy người xem (không render sẵn khi build để luôn đúng tháng).
 * 6 thẻ = đủ hàng ở lưới 3 cột (máy tính) và 2 cột (máy tính bảng); điện thoại vuốt ngang */
const SEASON_COUNT = 6

function renderSeason() {
    const list = document.getElementById('season-list')
    if (!list) return
    const month = new Date().getMonth() + 1
    const picks = DESTINATIONS.filter(d => d.bestMonths.includes(month))
    const lead = document.getElementById('season-lead')
    if (lead) {
        lead.textContent = t('Tháng {m} có {n} điểm đến đang vào mùa đẹp nhất – thời tiết thuận lợi, cảnh sắc rực rỡ.', { m: monthLabel(month), n: picks.length })
    }
    /* Ưu tiên điểm đánh giá cao, mỗi vùng một điểm trước rồi mới lấp đủ – gợi ý đa dạng hơn */
    const byRating = [...picks].sort((a, b) => b.rating - a.rating)
    const chosen = byRating.filter((d, i) => byRating.findIndex(x => x.region === d.region) === i)
    byRating.forEach(d => { if (!chosen.includes(d)) chosen.push(d) })
    chosen.length = Math.min(chosen.length, SEASON_COUNT)
    list.innerHTML = chosen.map(d => destinationCard(d)).join('')
    renderSeasonEvents(month)
    syncFavoriteButtons(list)
    /* Trang tĩnh "Tháng N nên đi đâu" của tháng hiện tại */
    const monthLink = document.getElementById('season-month-link')
    if (monthLink) monthLink.href = `${SITE_ROOT}${LANG_PREFIX}thang/${month}/index.html`

    document.getElementById('season-more')?.addEventListener('click', () => {
        const select = document.getElementById('month-filter')
        if (select) {
            select.value = String(month)
            select.dispatchEvent(new Event('change', { bubbles: true }))
        }
        document.getElementById('place')?.scrollIntoView({ behavior: 'smooth' })
    })
}

/* Lễ hội & mùa đặc sắc trong tháng: mỗi sự kiện dẫn tới điểm đến tiêu biểu */
function renderSeasonEvents(month) {
    const box = document.getElementById('season-events')
    if (!box || typeof EVENTS === 'undefined') return
    const events = EVENTS.filter(e => e.where !== 'all' && e.months?.length !== 12 && eventInMonth(e, month))
    box.hidden = !events.length
    box.innerHTML = events.length ? `
        <span class="season__events-title"><i class="ri-flag-2-line"></i> ${t('Lễ hội & mùa đặc sắc tháng {m}:', { m: monthLabel(month) })}</span>
        ${events.slice(0, 8).map(e => {
            const d = getDestination(e.where[0])
            return `<a href="${destinationUrl(d.id)}#climate" class="tag event-tag event-tag--${e.type}" title="${pickLang(e.desc)}">
                <i class="${EVENT_TYPES[e.type].icon}"></i> ${pickLang(e.name)} · ${d.name}
            </a>`
        }).join('')}
        <a href="${SITE_ROOT}${LANG_PREFIX}le-hoi/index.html#thang-${month}" class="season__events-more">${t('Xem lịch lễ hội cả năm')} <i class="ri-arrow-right-line"></i></a>
    ` : ''
}

renderDiscover()
renderTripBanner()
renderSeason()
initExplore()
hydrateWikiImages()
