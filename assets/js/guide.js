/*==================== TRANG CẨM NANG ====================*/
/* Nội dung đã được build sẵn – chỉ cần nạp ảnh thẻ điểm đến và trạng thái yêu thích */
hydrateWikiImages(document.getElementById('guide-page'))
syncFavoriteButtons()

/* Lịch du lịch 12 tháng: đánh dấu tháng hiện tại (theo ngày trên máy người xem) */
document.querySelector(`.travel-cal [data-cal-month="${new Date().getMonth() + 1}"]`)?.classList.add('travel-cal__month--now')

/* Trang lịch lễ hội (le-hoi/): lọc theo loại / miền, đánh dấu tháng hiện tại và sự kiện đang diễn ra */
const festivalFilter = document.getElementById('festival-filter')
if (festivalFilter) {
    const month = new Date().getMonth() + 1
    document.querySelector(`.festival-nav [data-month="${month}"]`)?.classList.add('chip--active')
    document.querySelectorAll('.festival .event').forEach(li => {
        if (li.dataset.eventMonths.split(',').map(Number).includes(month)) li.classList.add('event--active')
    })
    const state = { type: '', region: '' }
    festivalFilter.hidden = false
    festivalFilter.addEventListener('click', e => {
        const btn = e.target.closest('[data-filter]')
        if (!btn) return
        state[btn.dataset.filter] = btn.dataset.value
        festivalFilter.querySelectorAll(`[data-filter="${btn.dataset.filter}"]`).forEach(b => {
            b.classList.toggle('chip--active', b === btn)
            b.setAttribute('aria-pressed', String(b === btn))
        })
        let total = 0
        document.querySelectorAll('[data-month-group]').forEach(group => {
            let shown = 0
            let ongoing = 0
            group.querySelectorAll('.event, .festival__ongoing a').forEach(el => {
                const regions = el.dataset.regions.split(' ')
                const ok = (!state.type || el.dataset.type === state.type)
                    && (!state.region || regions.includes('all') || regions.includes(state.region))
                el.hidden = !ok
                if (ok && el.matches('.event')) shown++
                if (ok && !el.matches('.event')) ongoing++
            })
            const more = group.querySelector('.festival__ongoing')
            if (more) more.hidden = !ongoing
            group.hidden = !shown && !ongoing
            const count = group.querySelector('.festival__count')
            if (count) {
                count.textContent = shown
                count.hidden = !shown
            }
            const link = document.querySelector(`.festival-nav [href="#${group.id}"]`)
            if (link) link.hidden = group.hidden
            total += shown
        })
        document.querySelector('.festival__empty').hidden = total > 0
    })
}

/* Trang Trekking / Tour: lọc thẻ theo độ khó hoặc phong cách / số ngày / miền / tháng đi (thẻ có data-<loại>-*) */
function setupCardFilter(form, kind, first) {
    if (!form) return
    const attr = k => `${kind}${k[0].toUpperCase()}${k.slice(1)}`
    const cards = [...document.querySelectorAll(`[data-${kind}-${first}]`)]
    const count = form.querySelector('.trek-filter__count')
    const empty = form.parentElement.querySelector('.trek-filter__empty')
    const apply = () => {
        const f = Object.fromEntries(new FormData(form))
        let shown = 0
        cards.forEach(card => {
            const d = card.dataset
            const days = Number(d[attr('days')])
            const ok = (!f[first] || d[attr(first)] === f[first])
                && (!f.days || (f.days === '3' ? days >= 3 : days === Number(f.days)))
                && (!f.region || d[attr('region')] === f.region)
                && (!f.month || d[attr('months')].split(' ').includes(f.month))
            card.hidden = !ok
            if (ok) shown++
        })
        document.querySelectorAll('[data-trek-group]').forEach(sec => { sec.hidden = !sec.querySelector('[data-trek-level]:not([hidden])') })
        count.textContent = count.dataset.template.replace('{count}', shown)
        empty.hidden = shown > 0
    }
    form.hidden = false
    form.addEventListener('change', apply)
    form.addEventListener('submit', e => e.preventDefault())
    apply()
}
setupCardFilter(document.getElementById('trek-filter'), 'trek', 'level')
setupCardFilter(document.getElementById('tour-filter'), 'tour', 'style')

/* Trang một cung: danh sách đồ cần mang – nhớ món đã tick trên máy này, in riêng danh sách */
const gearBox = document.querySelector('[data-gear]')
if (gearBox) {
    const key = `trek-gear:${gearBox.dataset.gear}`
    const boxes = [...gearBox.querySelectorAll('[data-gear-item]')]
    const count = gearBox.querySelector('.trek-gear__count')
    const save = () => {
        const done = boxes.filter(b => b.checked).map(b => b.dataset.gearItem)
        try { done.length ? localStorage.setItem(key, done.join(',')) : localStorage.removeItem(key) } catch { /* trình duyệt chặn lưu – vẫn tick được */ }
        count.textContent = count.dataset.template.replace('{done}', done.length).replace('{total}', boxes.length)
    }
    let saved = []
    try { saved = (localStorage.getItem(key) || '').split(',') } catch { /* bỏ qua */ }
    boxes.forEach(b => { b.checked = saved.includes(b.dataset.gearItem) })
    gearBox.querySelector('.trek-gear__bar').hidden = false
    gearBox.addEventListener('change', e => { if (e.target.matches('[data-gear-item]')) save() })
    gearBox.addEventListener('click', e => {
        const btn = e.target.closest('[data-gear-action]')
        if (!btn) return
        if (btn.dataset.gearAction === 'reset') {
            boxes.forEach(b => { b.checked = false })
            save()
        } else {
            document.body.classList.add('print-gear')
            window.addEventListener('afterprint', () => document.body.classList.remove('print-gear'), { once: true })
            window.print()
        }
    })
    save()
}

/* Trang một tour: tùy chỉnh lịch – bỏ / thêm điểm tham quan, tính lại vé và tổng; nhớ lựa chọn trên máy này */
const tourCustom = document.querySelector('[data-tour-custom]')
if (tourCustom) {
    const key = `tour-custom:${tourCustom.dataset.tourCustom}`
    const boxes = [...tourCustom.querySelectorAll('[data-pick]')]
    const ticketsCell = document.querySelector('[data-cost-tickets]')
    const totalCell = document.querySelector('[data-cost-total]')
    const other = (totalCell?.dataset.other || '0,0').split(',').map(Number)
    const defaults = new Map(boxes.map(b => [b.dataset.pick, b.checked]))
    let saved = {}
    try { saved = JSON.parse(localStorage.getItem(key) || '{}') } catch { /* bỏ qua */ }
    /* Link chia sẻ #c=<vị trí các ô đổi so với lịch gốc, cơ số 36> – ưu tiên hơn lựa chọn đã lưu trên máy */
    const shared = (location.hash.match(/^#c=([0-9a-z.]*)$/) || [])[1]
    if (shared !== undefined) {
        const flip = new Set(shared.split('.').filter(Boolean).map(x => parseInt(x, 36)))
        boxes.forEach((b, i) => { b.checked = flip.has(i) ? !defaults.get(b.dataset.pick) : defaults.get(b.dataset.pick) })
    } else boxes.forEach(b => { if (b.dataset.pick in saved) b.checked = saved[b.dataset.pick] })
    const update = () => {
        let lo = 0
        let hi = 0
        const changed = {}
        boxes.forEach(b => {
            b.closest('.pkg-sight').classList.toggle('pkg-sight--off', !b.checked)
            if (b.checked) { lo += Number(b.dataset.lo); hi += Number(b.dataset.hi) }
            if (b.checked !== defaults.get(b.dataset.pick)) changed[b.dataset.pick] = b.checked
        })
        if (ticketsCell) ticketsCell.textContent = priceRange([lo, hi])
        if (totalCell) totalCell.textContent = priceRange([lo + other[0], hi + other[1]])
        try { Object.keys(changed).length ? localStorage.setItem(key, JSON.stringify(changed)) : localStorage.removeItem(key) } catch { /* bỏ qua */ }
        tourCustom.querySelector('[data-custom-reset]').hidden = !Object.keys(changed).length
    }
    tourCustom.querySelectorAll('.pkg-pick, .pkg-more, .pkg-custom-hint, .pkg-actions').forEach(el => { el.hidden = false })
    const actions = tourCustom.querySelector('.pkg-actions')
    const shareUrl = () => {
        const flip = boxes.map((b, i) => (b.checked !== defaults.get(b.dataset.pick) ? i.toString(36) : null)).filter(Boolean)
        return `${location.href.split('#')[0]}${flip.length ? `#c=${flip.join('.')}` : ''}`
    }
    /* Mỗi ngày: tiêu đề, điểm đến, các điểm đang chọn (kể cả điểm thêm), chặng di chuyển */
    const dayPlans = () => [...tourCustom.querySelectorAll('.trek-plan__day')].map(day => ({
        title: day.dataset.dayTitle,
        dest: day.dataset.dayDest,
        leg: day.querySelector(':scope > .pkg-leg')?.textContent.replace(/\s+/g, ' ').trim() || '',
        sights: [...day.querySelectorAll('[data-pick]:checked')].map(b => b.closest('.pkg-sight').querySelector('.pkg-sight__name').textContent.trim()),
    }))
    actions.addEventListener('click', async e => {
        const btn = e.target.closest('[data-tour-action]')
        if (!btn) return
        const name = actions.dataset.tourName
        if (btn.dataset.tourAction === 'share') {
            const url = shareUrl()
            if (navigator.share) { try { await navigator.share({ title: name, url }); return } catch { /* người dùng hủy – sao chép thay */ } }
            copyText(url, t('Đã sao chép liên kết'))
        } else if (btn.dataset.tourAction === 'ics') {
            const input = actions.querySelector('[data-tour-start]')
            if (!input.value) { input.focus(); showToast(t('Chọn ngày đi để tạo lịch')); return }
            const url = shareUrl()
            const events = dayPlans().map((d, i) => ({
                start: localStamp(addDays(input.value, i), '08:00'),
                end: localStamp(addDays(input.value, i), '20:00'),
                summary: `${d.title} – ${d.dest}`,
                description: [d.leg, ...d.sights.map(x => `• ${x}`), url].filter(Boolean).join('\n'),
                location: d.dest,
            }))
            downloadTextFile(`${safeFileName(name)}.ics`, buildIcs({ name, events }))
        } else {
            document.body.classList.add('print-tour')
            window.addEventListener('afterprint', () => document.body.classList.remove('print-tour'), { once: true })
            window.print()
        }
    })
    tourCustom.addEventListener('change', e => { if (e.target.matches('[data-pick]')) update() })
    tourCustom.querySelector('[data-custom-reset]').addEventListener('click', () => {
        boxes.forEach(b => { b.checked = defaults.get(b.dataset.pick) })
        update()
    })
    update()
}

/* Trang tour nhiều điểm: bản đồ hành trình – điểm dừng đánh số, đường nối, nhãn chặng (Leaflet tải khi cuộn tới) */
const tourMap = document.querySelector('[data-tour-map]')
if (tourMap && typeof whenVisible === 'function') {
    whenVisible(tourMap, async () => {
        if (!(await loadLeaflet())) return
        const stops = JSON.parse(tourMap.dataset.tourMap)
        const legs = JSON.parse(tourMap.dataset.legs || '[]')
        const map = createMap(tourMap, { zoom: 6 })
        const points = stops.map(s => [s.lat, s.lng])
        L.polyline(points, { color: getComputedStyle(document.documentElement).getPropertyValue('--first-color').trim() || '#8b4513', weight: 3, dashArray: '6 8' }).addTo(map)
        stops.forEach((s, i) => {
            L.marker([s.lat, s.lng], {
                icon: L.divIcon({ className: 'pkg-map-pin', html: `<span>${i + 1}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
                keyboard: false,
            }).bindTooltip(`${i + 1}. ${s.n} · ${tourMap.dataset.daysLabel.replace('{n}', s.d)}`, { direction: 'top', offset: [0, -14] }).addTo(map)
        })
        legs.forEach((leg, i) => {
            const [a, b] = [points[i], points[i + 1]]
            if (!a || !b) return
            L.marker([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], {
                interactive: false, keyboard: false,
                icon: L.divIcon({ className: 'pkg-map-leg', html: `<span>${leg.l}</span>`, iconSize: null }),
            }).addTo(map)
        })
        map.fitBounds(points, { padding: [40, 40], maxZoom: 9 })
    })
}
