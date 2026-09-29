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
