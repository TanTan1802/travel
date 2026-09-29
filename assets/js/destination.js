/*==================== TRANG CHI TIẾT: LANDING PAGE ĐỘNG ====================*/
/*
 * - Trang tĩnh diem-den/<id>/: nội dung đã được build sẵn (data-prerendered),
 *   JS chỉ gắn tương tác.
 * - destination.html?id=<id>: nội dung được tạo động từ dữ liệu.
 */
const destRoot = document.getElementById('destination')
const destId = window.DEST_ID || new URLSearchParams(location.search).get('id')
const dest = getDestination(destId)
const isPrerendered = destRoot.hasAttribute('data-prerendered')

/*==================== GALLERY: LẤP ĐẦY HÀNG CUỐI ====================*/
/*
 * Ảnh nổi bật chiếm 2x2 ô. Vùng bên cạnh nó rộng (số cột - 2) và cao 2 hàng;
 * phần còn lại xếp thành các hàng đầy đủ. Nới rộng vài ảnh cuối để không còn ô trống.
 */
function balanceGallery() {
    const grid = document.querySelector('.gallery__grid')
    if (!grid) return

    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length
    const items = [...grid.querySelectorAll('.gallery__item:not(.is-broken)')]
    items.forEach(item => {
        item.classList.remove('is-wide', 'is-full')
        item.style.gridColumn = item.style.gridRow = ''
    })

    const rest = items.filter(item => !item.classList.contains('is-featured'))
    const sideCols = Math.max(cols - 2, 0)
    const sideSlots = sideCols * 2

    if (!rest.length) {
        /* Chỉ còn ảnh nổi bật: cho trải hết chiều ngang */
        const featured = items.find(item => item.classList.contains('is-featured'))
        if (featured) featured.style.gridColumn = '1 / -1'
        return
    }

    if (rest.length === 1 && sideCols > 0) {
        /* Chỉ còn 1 ảnh phụ: cho nó lấp trọn vùng bên cạnh ảnh nổi bật */
        rest[0].style.gridColumn = `span ${sideCols}`
        rest[0].style.gridRow = 'span 2'
        return
    }

    if (rest.length < sideSlots) {
        /* Không đủ ảnh lấp vùng bên cạnh: chỉ nới được khi vùng này rộng 2 cột */
        if (sideCols === 2) {
            const extra = sideSlots - rest.length
            rest.slice(-extra).forEach(item => item.classList.add('is-wide'))
        }
        return
    }

    const tail = rest.slice(sideSlots)
    const lastRow = tail.length % cols
    if (lastRow === 0) return
    if (lastRow === 1) {
        tail[tail.length - 1].classList.add('is-full')
    } else {
        tail.slice(-(cols - lastRow)).forEach(item => item.classList.add('is-wide'))
    }
}

/*==================== LIGHTBOX ====================*/
function initLightbox(photos) {
    const box = document.getElementById('lightbox'),
          img = document.getElementById('lightbox-img'),
          caption = document.getElementById('lightbox-caption'),
          credit = document.getElementById('lightbox-credit')
    let current = 0

    const items = [...document.querySelectorAll('.gallery__item')]
    const isBroken = i => items[i] && items[i].classList.contains('is-broken')

    function show(index, step = 1) {
        current = (index + photos.length) % photos.length
        /* Bỏ qua ảnh đã tải lỗi trong gallery */
        for (let tries = 0; isBroken(current) && tries < photos.length; tries++) {
            current = (current + step + photos.length) % photos.length
        }
        const photo = photos[current]
        img.src = wikiImg(photo.file, 1920)
        img.alt = photo.caption
        caption.textContent = `${photo.caption} (${current + 1}/${photos.length})`
        credit.href = wikiPage(photo.file)
    }

    function open(index) {
        show(index)
        box.hidden = false
        document.body.classList.add('no-scroll')
    }

    function close() {
        box.hidden = true
        document.body.classList.remove('no-scroll')
    }

    items.forEach(item => {
        item.addEventListener('click', () => open(Number(item.dataset.index)))
        /* Ảnh gallery lỗi: ẩn khỏi lưới thay vì hiện khung trống */
        item.addEventListener('wiki:failed', () => {
            item.classList.add('is-broken')
            if (item.classList.contains('is-featured')) {
                item.classList.remove('is-featured')
                const next = items.find(x => !x.classList.contains('is-broken'))
                if (next) next.classList.add('is-featured')
            }
            balanceGallery()
        })
    })
    img.addEventListener('error', () => {
        if (!box.hidden) caption.textContent = t('Không tải được ảnh này.')
    })
    document.getElementById('lightbox-close').addEventListener('click', close)
    document.getElementById('lightbox-prev').addEventListener('click', () => show(current - 1, -1))
    document.getElementById('lightbox-next').addEventListener('click', () => show(current + 1))
    box.addEventListener('click', e => { if (e.target === box) close() })

    document.addEventListener('keydown', e => {
        if (box.hidden) return
        if (e.key === 'Escape') close()
        if (e.key === 'ArrowLeft') show(current - 1, -1)
        if (e.key === 'ArrowRight') show(current + 1)
    })
}

/*==================== LỊCH TRÌNH: CHUYỂN NGÀY ====================*/
function initItineraryTabs() {
    const tabs = [...document.querySelectorAll('.itinerary__tab')]
    const select = tab => {
        tabs.forEach(t => {
            const active = t === tab
            t.classList.toggle('itinerary__tab--active', active)
            t.setAttribute('aria-selected', active)
            document.getElementById(t.getAttribute('aria-controls')).hidden = !active
        })
    }
    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab))
        tab.addEventListener('keydown', e => {
            const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
            if (!step) return
            const next = tabs[(i + step + tabs.length) % tabs.length]
            next.focus()
            select(next)
        })
    })
}

/*==================== BẢN ĐỒ VỊ TRÍ ====================*/
function initLocationMap(d) {
    const el = document.getElementById('dest-map')
    if (!el) return

    whenVisible(el, () => {
        if (!mapAvailable()) return showMapUnavailable(el)

        const map = createMap(el, { center: [d.lat, d.lng], zoom: 8 })
        L.marker([d.lat, d.lng], { icon: pinIcon(d.region, { active: true }), title: d.name, zIndexOffset: 1000 })
            .addTo(map)
            .bindTooltip(d.name, { permanent: true, direction: 'left', offset: [-12, -16], className: 'map-tooltip' })

        const nearby = nearestDestinations(d, 3)
        nearby.forEach(({ d: n, km }) => {
            bindDestinationPopup(L.marker([n.lat, n.lng], { icon: pinIcon(n.region), title: n.name }), n, ` · ~${Math.round(km)} km`)
                .addTo(map)
        })

        const bounds = L.latLngBounds([[d.lat, d.lng], ...nearby.map(({ d: n }) => [n.lat, n.lng])])
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 9 })
    })
}

/*==================== BÌNH LUẬN (GISCUS) ====================*/
function giscusTheme() {
    return document.body.classList.contains('dark-theme') ? 'dark' : 'light'
}

function initComments() {
    const el = document.getElementById('giscus')
    if (!el || !giscusEnabled()) return
    const g = SITE_CONFIG.giscus

    whenVisible(el, () => {
        const script = document.createElement('script')
        script.src = 'https://giscus.app/client.js'
        script.async = true
        script.crossOrigin = 'anonymous'
        Object.entries({
            repo: g.repo,
            'repo-id': g.repoId,
            category: g.category,
            'category-id': g.categoryId,
            /* Dùng mã điểm đến để trang tiếng Việt và tiếng Anh chung một luồng thảo luận */
            mapping: 'specific',
            term: el.dataset.term,
            strict: '1',
            'reactions-enabled': '1',
            'emit-metadata': '0',
            'input-position': 'top',
            theme: giscusTheme(),
            lang: LANG,
            loading: 'lazy',
        }).forEach(([key, value]) => script.setAttribute(`data-${key}`, value))
        el.appendChild(script)
    })

    /* Đồng bộ giao diện sáng/tối với nút đổi theme của site */
    const themeButton = document.getElementById('theme-button')
    if (themeButton) {
        themeButton.addEventListener('click', () => {
            /* Đợi main.js đổi class dark-theme xong mới đọc theme mới */
            setTimeout(() => {
                const frame = document.querySelector('iframe.giscus-frame')
                if (frame) frame.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusTheme() } } }, 'https://giscus.app')
            })
        })
    }
}

/*==================== RENDER ====================*/
if (dest) {
    if (!isPrerendered) {
        document.title = `${dest.name} – Việt Travel`
        destRoot.innerHTML = renderDestinationPage(dest)
        /* Trang động trỏ canonical về trang tĩnh tương ứng */
        const canonical = document.createElement('link')
        canonical.rel = 'canonical'
        canonical.href = new URL(destinationUrl(dest.id).replace('index.html', ''), location.href).href
        document.head.appendChild(canonical)

        /* Nút chuyển ngôn ngữ trỏ tới trang tiếng Anh tương ứng */
        const langSwitch = document.querySelector('.nav__lang')
        if (langSwitch) langSwitch.href = `${SITE_ROOT}en/diem-den/${dest.id}/index.html`
    }
    initLightbox([{ file: dest.hero, caption: dest.name }, ...dest.gallery])
    balanceGallery()
    window.addEventListener('resize', balanceGallery)
    syncFavoriteButtons()
    initItineraryTabs()
    initLocationMap(dest)
    initWeather(document.getElementById('weather'), dest.lat, dest.lng)
    initComments()
    markCurrentMonth(destRoot)
} else {
    document.title = `${t('Không tìm thấy điểm đến')} – Việt Travel`
    destRoot.innerHTML = notFoundSection()
    document.getElementById('header').classList.add('header--solid')
}

hydrateWikiImages(destRoot)
