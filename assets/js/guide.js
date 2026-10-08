/*==================== TRANG CẨM NANG ====================*/
/* Nội dung đã được build sẵn – chỉ cần nạp ảnh thẻ điểm đến và trạng thái yêu thích */
hydrateWikiImages(document.getElementById('guide-page'))
syncFavoriteButtons()

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
