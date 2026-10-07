/*==================== FORM BÁO SAI THÔNG TIN ====================*/
/*
 * Bấm "Báo sai" → mở form ngay trên trang (không cần tài khoản GitHub).
 * - Có SITE_CONFIG.reportEndpoint (vd. Formspree): gửi thẳng, người dùng ở lại trang.
 * - Chưa cấu hình: mở GitHub Issue đã điền sẵn nội dung người dùng vừa nhập (như trước).
 * Không có JS: liên kết vẫn mở GitHub Issue (reportLinkHtml trong components.js).
 */
function reportDialog() {
    let dialog = document.getElementById('report-dialog')
    if (dialog) return dialog
    dialog = document.createElement('dialog')
    dialog.id = 'report-dialog'
    dialog.className = 'quiz report-dialog'
    dialog.setAttribute('aria-labelledby', 'report-heading')
    dialog.innerHTML = `
        <form method="dialog" class="report-form" novalidate>
            <div class="quiz__header">
                <strong id="report-heading"><i class="ri-flag-line"></i> ${t('Báo sai thông tin')}</strong>
                <button type="button" class="quiz__close" data-report-close aria-label="${t('Đóng')}"><i class="ri-close-line"></i></button>
            </div>
            <div class="quiz__body">
                <p class="report-form__item"><strong data-report-field="item"></strong><small data-report-field="details"></small></p>
                <label class="report-form__label" for="report-correction">${t('Thông tin đúng / góp ý')} *</label>
                <textarea id="report-correction" name="correction" rows="4" required class="report-form__input"
                    placeholder="${t('Vd: giá vé đã tăng lên 250.000đ từ tháng 6, quán đã chuyển sang địa chỉ...')}"></textarea>
                <label class="report-form__label" for="report-source">${t('Nguồn (không bắt buộc)')}</label>
                <input id="report-source" name="source" class="report-form__input" placeholder="${t('Link trang chính thức, thời điểm bạn ghé...')}">
                <label class="report-form__label" for="report-email">${t('Email để nhận phản hồi (không bắt buộc)')}</label>
                <input id="report-email" name="email" type="email" class="report-form__input" autocomplete="email">
                <p class="report-form__status" role="status"></p>
                <button type="submit" class="button button--flex report-form__submit"><i class="ri-send-plane-line"></i> ${t('Gửi báo cáo')}</button>
            </div>
        </form>
    `
    document.body.appendChild(dialog)
    dialog.querySelector('[data-report-close]').addEventListener('click', () => dialog.close())
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close() })
    dialog.querySelector('form').addEventListener('submit', e => {
        e.preventDefault()
        submitReport(dialog)
    })
    return dialog
}

function openReport(info) {
    const dialog = reportDialog()
    dialog.report = info
    dialog.querySelector('[data-report-field="item"]').textContent = [info.dest, info.item].filter(Boolean).join(' – ')
    dialog.querySelector('[data-report-field="details"]').textContent = info.details ? ` · ${info.details}` : ''
    dialog.querySelector('form').reset()
    dialog.querySelector('.report-form__status').textContent = ''
    dialog.showModal()
    dialog.querySelector('#report-correction').focus()
}

async function submitReport(dialog) {
    const form = dialog.querySelector('form')
    const status = dialog.querySelector('.report-form__status')
    const correction = form.correction.value.trim()
    if (!correction) {
        status.textContent = t('Hãy cho biết thông tin đúng hoặc góp ý của bạn.')
        form.correction.focus()
        return
    }
    if (form.email.value && !form.email.checkValidity()) {
        status.textContent = t('Vui lòng nhập địa chỉ email hợp lệ.')
        form.email.focus()
        return
    }
    const report = { ...dialog.report, correction, source: form.source.value.trim(), page: location.href.split('#')[0] }
    const endpoint = typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.reportEndpoint
    if (!endpoint) {
        window.open(reportUrl(report), '_blank', 'noopener')
        dialog.close()
        showToast(t('Đã mở GitHub để gửi báo cáo – cảm ơn bạn!'))
        return
    }
    const button = form.querySelector('button[type="submit"]')
    button.disabled = true
    status.textContent = t('Đang gửi...')
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ _subject: `[Sửa thông tin] ${report.dest} – ${report.item}`, ...report, email: form.email.value.trim() }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        dialog.close()
        showToast(t('Đã gửi – cảm ơn bạn đã giúp thông tin chính xác hơn!'))
    } catch {
        status.textContent = t('Chưa gửi được, vui lòng thử lại sau.')
    } finally {
        button.disabled = false
    }
}

document.addEventListener('click', e => {
    const link = e.target.closest('.report-link[data-report-item]')
    if (!link || typeof HTMLDialogElement === 'undefined') return
    e.preventDefault()
    openReport({ dest: link.dataset.reportDest, item: link.dataset.reportItem, details: link.dataset.reportDetails })
})
