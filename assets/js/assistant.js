/*==================== TRỢ LÝ HỎI ĐÁP (Claude qua Cloudflare Worker – thư mục worker/) ====================*/
/*
 * Nút "Hỏi Việt Travel" góc màn hình → hộp chat. Chỉ hiện khi đặt SITE_CONFIG.assistantEndpoint (URL Worker).
 * Gửi { question, history, lang, page } – page là mã điểm đến đang xem để trợ lý hiểu "ở đây".
 */
const assistant = { endpoint: '', history: [] }

const escapeText = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* Chữ thường + liên kết bấm được + xuống dòng (không chèn HTML từ câu trả lời) */
function assistantHtml(text) {
    return escapeText(text)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(https?:\/\/[^\s)<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
        .replace(/\n/g, '<br>')
}

function assistantMessage(role, html) {
    const log = document.getElementById('assistant-log')
    const item = document.createElement('div')
    item.className = `assistant__msg assistant__msg--${role}`
    item.innerHTML = html
    log.appendChild(item)
    log.scrollTop = log.scrollHeight
    return item
}

function buildAssistant() {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'assistant__fab'
    button.id = 'assistant-open'
    button.innerHTML = `<i class="ri-chat-smile-3-line"></i> <span>${t('Hỏi Việt Travel')}</span>`

    const dialog = document.createElement('dialog')
    dialog.className = 'quiz assistant'
    dialog.id = 'assistant'
    dialog.setAttribute('aria-labelledby', 'assistant-heading')
    dialog.innerHTML = `
        <div class="quiz__header">
            <strong id="assistant-heading"><i class="ri-chat-smile-3-line"></i> ${t('Hỏi Việt Travel')}</strong>
            <button type="button" class="quiz__close" data-assistant-close aria-label="${t('Đóng')}"><i class="ri-close-line"></i></button>
        </div>
        <div class="assistant__log" id="assistant-log" aria-live="polite">
            <div class="assistant__msg assistant__msg--assistant">${t('Xin chào! Hỏi mình về điểm đến, thời điểm đẹp, lịch trình, giá vé hay chi phí nhé. Ví dụ: "Đi Đà Lạt 3 ngày tháng 12 hết bao nhiêu?"')}</div>
        </div>
        <form class="assistant__form" id="assistant-form">
            <label for="assistant-input" class="visually-hidden">${t('Câu hỏi của bạn')}</label>
            <textarea id="assistant-input" rows="2" maxlength="800" class="report-form__input" placeholder="${t('Nhập câu hỏi...')}" required></textarea>
            <button type="submit" class="button button--flex"><i class="ri-send-plane-line"></i> ${t('Gửi')}</button>
        </form>
        <small class="assistant__note">${t('Trợ lý AI trả lời dựa trên dữ liệu của site và có thể nhầm – hãy kiểm tra lại trước khi đặt chỗ.')}</small>
    `
    document.body.append(button, dialog)

    button.addEventListener('click', () => {
        dialog.showModal()
        dialog.querySelector('#assistant-input').focus()
    })
    dialog.querySelector('[data-assistant-close]').addEventListener('click', () => dialog.close())
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close() })
    const input = dialog.querySelector('#assistant-input')
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            dialog.querySelector('form').requestSubmit()
        }
    })
    dialog.querySelector('form').addEventListener('submit', e => {
        e.preventDefault()
        askAssistant(input)
    })
}

async function askAssistant(input) {
    const question = input.value.trim()
    if (!question) return
    const submit = input.form.querySelector('button[type="submit"]')
    input.value = ''
    submit.disabled = true
    assistantMessage('user', escapeText(question))
    const pending = assistantMessage('assistant', `<i class="ri-loader-4-line"></i> ${t('Đang trả lời...')}`)
    try {
        const res = await fetch(assistant.endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ question, history: assistant.history.slice(-6), lang: LANG, page: window.DEST_ID || '' }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.answer) throw new Error(data.error || `HTTP ${res.status}`)
        pending.innerHTML = assistantHtml(data.answer)
        assistant.history.push({ role: 'user', content: question }, { role: 'assistant', content: data.answer })
    } catch (err) {
        pending.classList.add('assistant__msg--error')
        pending.textContent = err.message && !/^HTTP/.test(err.message) ? err.message : t('Chưa kết nối được trợ lý, thử lại sau nhé.')
    } finally {
        submit.disabled = false
        input.focus()
    }
}

/* Gọi khi đã có URL Worker (tự gọi từ SITE_CONFIG; test gọi trực tiếp với URL giả) */
function initAssistant(endpoint) {
    if (!endpoint || assistant.endpoint || typeof HTMLDialogElement === 'undefined') return
    assistant.endpoint = endpoint
    buildAssistant()
}

initAssistant(typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.assistantEndpoint)
