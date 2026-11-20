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

/* Trang Trekking: lọc cung theo độ khó / số ngày / miền / tháng đi (thẻ có data-trek-*) */
const trekFilter = document.getElementById('trek-filter')
if (trekFilter) {
    const cards = [...document.querySelectorAll('[data-trek-level]')]
    const count = trekFilter.querySelector('.trek-filter__count')
    const empty = document.querySelector('.trek-filter__empty')
    const apply = () => {
        const f = Object.fromEntries(new FormData(trekFilter))
        let shown = 0
        cards.forEach(card => {
            const d = card.dataset
            const days = Number(d.trekDays)
            const ok = (!f.level || d.trekLevel === f.level)
                && (!f.days || (f.days === '3' ? days >= 3 : days === Number(f.days)))
                && (!f.region || d.trekRegion === f.region)
                && (!f.month || d.trekMonths.split(' ').includes(f.month))
            card.hidden = !ok
            if (ok) shown++
        })
        document.querySelectorAll('[data-trek-group]').forEach(sec => { sec.hidden = !sec.querySelector('[data-trek-level]:not([hidden])') })
        count.textContent = count.dataset.template.replace('{count}', shown)
        empty.hidden = shown > 0
    }
    trekFilter.hidden = false
    trekFilter.addEventListener('change', apply)
    trekFilter.addEventListener('submit', e => e.preventDefault())
    apply()
}

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
