/*==================== TRANG CHỦ: RENDER DANH SÁCH ĐIỂM ĐẾN ====================*/
/* Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu */
function normalizeText(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
}

function searchableText(dest) {
    return normalizeText([
        dest.name, dest.province, REGIONS[dest.region], dest.tagline,
        ...dest.highlights,
        ...dest.foods.map(f => f.name),
        ...dest.categories.map(c => CATEGORIES[c]),
    ].join(' '))
}

/*==================== DISCOVER (SWIPER) ====================*/
const FEATURED_IDS = ['vinh-ha-long', 'hoi-an', 'sa-pa', 'phu-quoc', 'ninh-binh', 'da-nang', 'ha-giang']

function renderDiscover() {
    const list = document.getElementById('discover-list')
    if (!list) return

    list.innerHTML = FEATURED_IDS.map(getDestination).filter(Boolean).map(d => `
        <a href="${destinationUrl(d.id)}" class="discover__card swiper-slide">
            <img data-wiki="${d.hero}" data-width="960" alt="${d.name}" class="discover__img">
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

    const query = normalizeText(exploreState.query.trim())
    const results = DESTINATIONS.filter(d =>
        (exploreState.region === 'all' || d.region === exploreState.region) &&
        (exploreState.category === 'all' || d.categories.includes(exploreState.category)) &&
        (!query || searchableText(d).includes(query))
    )

    grid.innerHTML = results.map(destinationCard).join('')
    hydrateWikiImages(grid)

    document.getElementById('explore-empty').hidden = results.length > 0
    document.getElementById('explore-result').textContent =
        `Hiển thị ${results.length} / ${DESTINATIONS.length} điểm đến`
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

    const count = document.getElementById('dest-count')
    if (count) count.textContent = DESTINATIONS.length

    renderGrid()
}

renderDiscover()
initExplore()
hydrateWikiImages()
