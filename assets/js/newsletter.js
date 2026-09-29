/*==================== ĐĂNG KÝ NHẬN TIN ====================*/
function initNewsletter(form) {
    if (!form) return
    const input = form.querySelector('input[type="email"]')
    const button = form.querySelector('button')
    const message = document.getElementById('subscribe-message')

    const show = (text, type) => {
        message.textContent = text
        message.className = `subscribe__message subscribe__message--${type}`
    }

    form.addEventListener('submit', async e => {
        e.preventDefault()
        const email = input.value.trim()

        if (!input.checkValidity() || !email) {
            show('Vui lòng nhập địa chỉ email hợp lệ.', 'error')
            input.focus()
            return
        }

        const endpoint = typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.newsletterEndpoint
        if (!endpoint) {
            show('Tính năng nhận tin sắp ra mắt. Cảm ơn bạn đã quan tâm!', 'info')
            return
        }

        button.disabled = true
        show('Đang gửi...', 'info')
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ email, source: 'Việt Travel – đăng ký nhận tin' }),
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            form.reset()
            show('Đăng ký thành công! Hãy kiểm tra hộp thư của bạn.', 'success')
        } catch {
            show('Chưa gửi được, vui lòng thử lại sau.', 'error')
        } finally {
            button.disabled = false
        }
    })
}

initNewsletter(document.querySelector('.subscribe__form'))
