/*==================== YÊU THÍCH (LƯU TRÊN TRÌNH DUYỆT) ====================*/
const Favorites = (() => {
    const KEY = 'viet-travel:favorites'

    function read() {
        try {
            const ids = JSON.parse(localStorage.getItem(KEY) || '[]')
            return Array.isArray(ids) ? ids : []
        } catch {
            return []
        }
    }

    function write(ids) {
        try {
            localStorage.setItem(KEY, JSON.stringify(ids))
        } catch {
            /* Trình duyệt chặn lưu trữ (chế độ riêng tư...) – vẫn chạy trong phiên hiện tại */
        }
        memory = ids
        window.dispatchEvent(new CustomEvent('favorites:change', { detail: ids }))
    }

    let memory = read()

    return {
        all: () => [...memory],
        has: id => memory.includes(id),
        count: () => memory.length,
        toggle(id) {
            write(memory.includes(id) ? memory.filter(x => x !== id) : [...memory, id])
            return memory.includes(id)
        },
    }
})()

/* Cập nhật trạng thái mọi nút ♥ trên trang */
function syncFavoriteButtons(root = document) {
    root.querySelectorAll('[data-favorite]').forEach(btn => {
        const active = Favorites.has(btn.dataset.favorite)
        btn.classList.toggle('fav-btn--active', active)
        btn.setAttribute('aria-pressed', active)
        const label = btn.querySelector('.fav-btn__label')
        if (label) label.textContent = active ? t('Đã lưu') : t('Lưu yêu thích')
        btn.title = active ? t('Bỏ khỏi yêu thích') : t('Lưu vào yêu thích')
    })
}

/* Một listener cho toàn trang (hoạt động cả với thẻ được render lại) */
document.addEventListener('click', e => {
    const btn = e.target.closest('[data-favorite]')
    if (!btn) return
    e.preventDefault()
    const added = Favorites.toggle(btn.dataset.favorite)
    btn.classList.add('fav-btn--pop')
    setTimeout(() => btn.classList.remove('fav-btn--pop'), 400)
    showToast(added ? t('Đã lưu vào yêu thích') : t('Đã bỏ khỏi yêu thích'))
})

window.addEventListener('favorites:change', () => syncFavoriteButtons())

/* Thông báo nhỏ ở góc màn hình */
function showToast(message) {
    let toast = document.getElementById('toast')
    if (!toast) {
        toast = document.createElement('div')
        toast.id = 'toast'
        toast.className = 'toast'
        toast.setAttribute('role', 'status')
        document.body.appendChild(toast)
    }
    toast.textContent = message
    toast.classList.add('toast--show')
    clearTimeout(showToast.timer)
    showToast.timer = setTimeout(() => toast.classList.remove('toast--show'), 1800)
}

/*==================== KẾ HOẠCH CHUYẾN ĐI (NHIỀU ĐIỂM ĐẾN) ====================*/
const PLAN_MAX_STOPS = 10
const PLAN_MAX_DAYS = 7

/* Số ngày gợi ý cho một điểm dừng: lấy số lớn nhất trong "2 – 3 ngày", tối đa 3 */
function planDefaultDays(d) {
    const nums = String(d.duration || '').match(/\d+/g) || ['2']
    return Math.min(3, Math.max(1, ...nums.map(Number)))
}

const TripPlan = (() => {
    const KEY = 'viet-travel:plan'
    const empty = () => ({ stops: [], month: 0, start: '', tier: 'saving', booked: {}, origin: '', people: 2, style: '', modes: {} })

    function read() {
        try {
            const plan = JSON.parse(localStorage.getItem(KEY) || 'null')
            return plan && Array.isArray(plan.stops) ? { ...empty(), ...plan } : empty()
        } catch {
            return empty()
        }
    }

    let memory = read()

    return {
        get: () => JSON.parse(JSON.stringify(memory)),
        save(plan) {
            memory = plan
            try {
                localStorage.setItem(KEY, JSON.stringify(plan))
            } catch {
                /* Không lưu được – vẫn dùng trong phiên hiện tại */
            }
        },
        has: id => memory.stops.some(s => s.id === id),
        add(id) {
            const d = getDestination(id)
            if (!d || this.has(id) || memory.stops.length >= PLAN_MAX_STOPS) return false
            this.save({ ...memory, stops: [...memory.stops, { id, days: planDefaultDays(d) }] })
            return true
        },
    }
})()

/* Nút "Thêm vào kế hoạch": lần đầu thêm, lần sau mở trang kế hoạch */
function syncPlanButtons(root = document) {
    root.querySelectorAll('[data-plan-add]').forEach(btn => {
        const added = TripPlan.has(btn.dataset.planAdd)
        btn.classList.toggle('plan-btn--added', added)
        const label = btn.querySelector('.plan-btn__label')
        if (label) label.textContent = added ? t('Xem kế hoạch chuyến đi') : t('Thêm vào kế hoạch chuyến đi')
    })
}

document.addEventListener('click', e => {
    const btn = e.target.closest('[data-plan-add]')
    if (!btn) return
    e.preventDefault()
    const id = btn.dataset.planAdd
    if (TripPlan.has(id)) {
        location.href = plannerUrl()
        return
    }
    if (TripPlan.add(id)) showToast(t('Đã thêm {name} vào kế hoạch', { name: getDestination(id).name }))
    else showToast(t('Kế hoạch tối đa {n} điểm đến', { n: PLAN_MAX_STOPS }))
    syncPlanButtons()
})
