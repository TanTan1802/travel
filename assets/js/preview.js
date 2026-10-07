/*==================== XEM TRƯỚC TỪ TRANG QUẢN TRỊ ====================*/
/*
 * destination.html?id=<mã>&preview=1: thay dữ liệu điểm đến bằng bản đang sửa trong trang quản trị
 * (admin/ ghi vào localStorage 'vt-admin-preview' – cùng tên miền nên đọc được) trước khi destination.js vẽ trang.
 * Không có tham số preview thì không làm gì. Các trang tĩnh diem-den/ không nạp file này (tools/build.js bỏ đi).
 */
;(() => {
    if (!/[?&]preview=1(&|$)/.test(location.search)) return
    let draft = null
    try { draft = JSON.parse(localStorage.getItem('vt-admin-preview') || 'null') } catch { /* bỏ qua */ }
    if (!draft || !draft.dest || !draft.dest.id) return
    const id = draft.dest.id
    const i = DESTINATIONS.findIndex(d => d.id === id)
    if (i >= 0) DESTINATIONS[i] = draft.dest
    else DESTINATIONS.push(draft.dest)
    ITINERARIES[id] = draft.plan
    PLACES[id] = draft.place
    SIGHTS[id] = draft.sights
    document.addEventListener('DOMContentLoaded', () => {
        const bar = document.createElement('div')
        bar.textContent = 'Bản xem trước – chưa đăng lên site'
        bar.setAttribute('role', 'status')
        bar.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:9999;padding:6px 14px;border-radius:999px;background:#b42318;color:#fff;font:600 13px/1.4 system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.3);pointer-events:none'
        document.body.append(bar)
    })
})()
