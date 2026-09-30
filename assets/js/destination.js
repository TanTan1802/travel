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

/*==================== LỊCH TRÌNH: CHỌN TOUR + CHUYỂN NGÀY ====================*/
function initDayTabs(tour) {
    const tabs = [...tour.querySelectorAll('.itinerary__tab')]
    const select = tab => {
        tabs.forEach(t => {
            const active = t === tab
            t.classList.toggle('itinerary__tab--active', active)
            t.setAttribute('aria-selected', active)
            document.getElementById(t.getAttribute('aria-controls')).hidden = !active
        })
    }
    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => {
            tour.classList.remove('tour--expanded')
            select(tab)
        })
        tab.addEventListener('keydown', e => {
            const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
            if (!step) return
            const next = tabs[(i + step + tabs.length) % tabs.length]
            next.focus()
            next.click()
        })
    })

    /* Xem tất cả các ngày một lúc (tiện đọc/in) */
    const expand = tour.querySelector('.tour__expand')
    if (expand) {
        expand.addEventListener('click', () => {
            const expanded = !tour.classList.contains('tour--expanded')
            tour.classList.toggle('tour--expanded', expanded)
            expand.dataset.expanded = expanded
            expand.querySelector('span').textContent = expanded ? t('Xem từng ngày') : t('Xem tất cả các ngày')
            tour.querySelectorAll('.itinerary__panel').forEach((panel, i) => {
                panel.hidden = expanded ? false : !tabs[i].classList.contains('itinerary__tab--active')
            })
        })
    }
}

function initItineraryTabs() {
    const tours = [...document.querySelectorAll('.tour')]
    const buttons = [...document.querySelectorAll('.tour-picker__btn')]
    tours.forEach(initDayTabs)

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => {
                const active = b === btn
                b.classList.toggle('tour-picker__btn--active', active)
                b.setAttribute('aria-selected', active)
            })
            tours.forEach(tour => { tour.hidden = tour.dataset.tour !== btn.dataset.tour })
        })
    })
}

/* Chọn mức chi tiêu để xem chi tiết từng khoản */
document.addEventListener('click', e => {
    const btn = e.target.closest('[data-budget-tier]')
    if (!btn) return
    const box = btn.closest('.budget')
    box.querySelectorAll('[data-budget-tier]').forEach(b => {
        const active = b === btn
        b.classList.toggle('budget__option--active', active)
        b.setAttribute('aria-pressed', active)
    })
    box.querySelectorAll('[data-budget-detail]').forEach(el => { el.hidden = el.dataset.budgetDetail !== btn.dataset.budgetTier })
})

/* In chỉ phần lịch trình (tour đang chọn, đủ các ngày) hoặc chia sẻ trang */
function initTourActions(d) {
    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-tour-action]')
        if (!btn) return
        if (btn.dataset.tourAction === 'ics') {
            exportTourIcs(d, Number(btn.closest('.tour').dataset.tour))
        } else if (btn.dataset.tourAction === 'print') {
            document.body.classList.add('print-itinerary')
            window.addEventListener('afterprint', () => document.body.classList.remove('print-itinerary'), { once: true })
            window.print()
        } else {
            const tour = btn.closest('.tour')
            shareLink({
                title: `${d.name} – Việt Travel`,
                text: t('Gợi ý {days} ngày tại {name}', { days: tour.dataset.tour, name: d.name }),
                url: location.href.split('#')[0] + '#itinerary',
            })
        }
    })
}

/*==================== NGÀY KHỞI HÀNH: DỰ BÁO THỜI TIẾT + XUẤT LỊCH ====================*/
const TOUR_START_KEY = 'viet-travel:tour-start'

function tourStart() {
    return document.getElementById('tour-start')?.value || ''
}

/* Điền ngày, dự báo và link Google Calendar cho từng ngày của mọi tour */
function applyTourStart(d) {
    const start = tourStart()
    const plan = ITINERARIES[d.id]
    document.querySelectorAll('.tour').forEach(tour => {
        const n = Number(tour.dataset.tour)
        tour.querySelectorAll('.day-tools').forEach(tools => {
            const i = Number(tools.dataset.dayOffset)
            const date = start ? addDays(start, i) : ''
            const dateEl = tools.querySelector('[data-day-date]')
            const forecast = tools.querySelector('[data-forecast-dest]')
            const gcal = tools.querySelector('[data-gcal]')
            dateEl.hidden = !date
            dateEl.innerHTML = date ? `<i class="ri-calendar-line"></i> ${formatDate(date)}` : ''
            gcal.hidden = !date
            if (date) {
                forecast.dataset.forecastDate = date
                const entries = dayTimeline(d.id, i, plan.days[i], { last: i === n - 1 })
                gcal.href = googleCalendarDayUrl({
                    title: `${d.name} – ${t('Ngày {n}', { n: i + 1 })}: ${plan.days[i].title}`,
                    date,
                    details: `${dayDetailsText(entries)}\n\n${location.href.split('#')[0]}#itinerary`,
                    location: `${d.name}, ${d.province}`,
                })
            } else {
                delete forecast.dataset.forecastDate
                forecast.innerHTML = ''
            }
        })
    })
    if (start) fillForecasts(document.getElementById('itinerary'))
    renderTourAlerts(d)
    renderPacking(d)
}

/* Lễ hội, nghỉ lễ, thời tiết cần lưu ý trùng các ngày của tour đang chọn */
function renderTourAlerts(d) {
    const box = document.getElementById('tour-alerts')
    if (!box) return
    const start = tourStart()
    const tour = document.querySelector('.tour:not([hidden])')
    const n = tour ? Number(tour.dataset.tour) : 3
    const events = start ? eventsForTrip(d.id, { dates: Array.from({ length: n }, (_, i) => addDays(start, i)) }) : []
    box.hidden = !events.length
    box.innerHTML = events.length
        ? `<li class="trip-alerts__title"><i class="ri-alarm-warning-line"></i> ${t('Lưu ý trong những ngày bạn đi')}</li>${events.map(e => eventCardHtml(e)).join('')}`
        : ''
}

/* Danh sách đồ cần mang theo tháng đi (ngày khởi hành hoặc tháng hiện tại) */
function renderPacking(d) {
    const block = document.getElementById('packing')
    if (!block) return
    const start = tourStart()
    const month = start ? Number(start.slice(5, 7)) : new Date().getMonth() + 1
    block.querySelector('[data-packing-title]').textContent = t('Đồ cần mang – tháng {m}', { m: monthLabel(month) })
    block.querySelector('[data-packing-slot]').innerHTML = packingHtml(packingList([d], [month]), d.id)
}

function initTourStart(d) {
    const input = document.getElementById('tour-start')
    if (!input) return
    input.min = todayIso()
    try {
        const saved = localStorage.getItem(TOUR_START_KEY)
        if (saved && saved >= todayIso()) input.value = saved
    } catch { /* bỏ qua */ }
    input.addEventListener('change', () => {
        try {
            if (input.value) localStorage.setItem(TOUR_START_KEY, input.value)
            else localStorage.removeItem(TOUR_START_KEY)
        } catch { /* bỏ qua */ }
        applyTourStart(d)
    })
    /* Đổi tour 3/4/5 ngày → cập nhật lưu ý theo số ngày */
    document.querySelectorAll('.tour-picker__btn').forEach(btn => btn.addEventListener('click', () => renderTourAlerts(d)))
    applyTourStart(d)
}

/* Tải file .ics của tour đang chọn: mỗi mốc timeline là một sự kiện có giờ */
function exportTourIcs(d, n) {
    const start = tourStart()
    if (!start) {
        const input = document.getElementById('tour-start')
        input.scrollIntoView({ behavior: 'smooth', block: 'center' })
        input.focus()
        showToast(t('Chọn ngày khởi hành trước để thêm vào lịch'))
        return
    }
    const plan = ITINERARIES[d.id]
    const events = plan.days.slice(0, n).flatMap((day, i) => timelineToEvents(
        dayTimeline(d.id, i, day, { last: i === n - 1 }),
        { date: addDays(start, i), destName: d.name, dayLabel: `${t('Ngày {n}', { n: i + 1 })}: ${day.title}` },
    ))
    const name = `${d.name} – ${tourLabel(n)}`
    downloadTextFile(`${safeFileName(name)}-${start}.ics`, buildIcs({ name, events }))
    showToast(t('Đã tải file lịch – mở file để thêm vào Google Calendar, Apple Calendar hoặc Outlook'))
}

/*==================== THANH 12 THÁNG: BẤM CHỌN THÁNG ====================*/
function initSeasonPicker(d) {
    const months = [...document.querySelectorAll('.season__month')]
    const status = document.querySelector('.season__status')
    const others = document.getElementById('season-others')
    if (!months.length || !status) return

    const select = month => {
        months.forEach(btn => {
            const active = Number(btn.dataset.month) === month
            btn.classList.toggle('season__month--selected', active)
            btn.setAttribute('aria-pressed', active)
        })
        const good = d.bestMonths.includes(month)
        status.textContent = good
            ? t('Tháng {m} là thời điểm đẹp để đi!', { m: monthLabel(month) })
            : t('Tháng {m} chưa phải mùa đẹp nhất – cân nhắc các tháng được tô màu.', { m: monthLabel(month) })
        status.classList.toggle('season__status--good', good)

        /* Làm nổi lễ hội / mùa đặc sắc diễn ra trong tháng đang xem */
        document.querySelectorAll('#dest-events .event').forEach(el => {
            const inMonth = el.dataset.eventMonths.split(',').map(Number).includes(month)
            el.classList.toggle('event--active', inMonth)
            el.classList.toggle('event--dim', !inMonth)
        })

        /* Gợi ý các điểm đến khác đẹp vào tháng này */
        const picks = DESTINATIONS.filter(x => x.id !== d.id && x.bestMonths.includes(month)).slice(0, 6)
        others.innerHTML = picks.length ? `
            <span class="season__others-title">${t('Điểm đến đẹp vào tháng {m}:', { m: monthLabel(month) })}</span>
            ${picks.map(x => `<a href="${destinationUrl(x.id)}" class="tag">${x.name}</a>`).join('')}
        ` : ''
    }

    months.forEach(btn => btn.addEventListener('click', () => select(Number(btn.dataset.month))))
    select(new Date().getMonth() + 1)
}

/*==================== BẢN ĐỒ VỊ TRÍ ====================*/
function initLocationMap(d) {
    const el = document.getElementById('dest-map')
    if (!el) return

    whenVisible(el, async () => {
        if (!(await loadLeaflet())) return showMapUnavailable(el)

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
    syncPlanButtons()
    initItineraryTabs()
    initTourActions(dest)
    initTourStart(dest)
    initLocationMap(dest)
    initWeather(document.getElementById('weather'), dest.lat, dest.lng)
    initComments()
    markCurrentMonth(destRoot)
    initSeasonPicker(dest)
} else {
    document.title = `${t('Không tìm thấy điểm đến')} – Việt Travel`
    destRoot.innerHTML = notFoundSection()
    document.getElementById('header').classList.add('header--solid')
}

hydrateWikiImages(destRoot)
