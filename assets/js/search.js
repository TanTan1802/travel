/*==================== Ô TÌM KIẾM TOÀN SITE ====================*/
/*
 * Nút kính lúp trên thanh menu (mọi trang) mở hộp tìm. Chỉ mục assets/js/data/search-<lang>.json (sinh khi build)
 * chỉ tải lần đầu mở hộp. Tìm không dấu, theo đầu từ; mọi từ gõ vào phải khớp (không có thì lấy mục khớp nhiều nhất).
 * Phím tắt: "/" hoặc Ctrl / ⌘ + K; ↑ ↓ chọn, Enter mở, Esc đóng.
 */
(function () {
    const openBtn = document.getElementById('search-open')
    if (!openBtn) return
    const plain = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    const TYPES = {
        dest: ['ri-map-pin-2-line', t('Điểm đến')],
        food: ['ri-restaurant-line', t('Ẩm thực')],
        tour: ['ri-suitcase-3-line', t('Tour')],
        trek: ['ri-footprint-line', t('Trekking')],
        guide: ['ri-book-open-line', t('Cẩm nang')],
        page: ['ri-compass-3-line', t('Trang')],
    }
    const BONUS = { dest: 3, tour: 2, food: 1, trek: 1, guide: 0, page: 0 }
    let index = null
    let results = []
    let active = -1

    const box = document.createElement('div')
    box.className = 'search'
    box.hidden = true
    box.setAttribute('role', 'dialog')
    box.setAttribute('aria-modal', 'true')
    box.setAttribute('aria-label', t('Tìm kiếm'))
    box.innerHTML = `
        <div class="search__box">
            <div class="search__bar">
                <i class="ri-search-line" aria-hidden="true"></i>
                <input type="search" class="search__input" placeholder="${t('Tìm điểm đến, món ăn, tour…')}" aria-label="${t('Tìm kiếm')}"
                    role="combobox" aria-expanded="false" aria-controls="search-list" aria-autocomplete="list" autocomplete="off" enterkeyhint="go">
                <button type="button" class="search__close" aria-label="${t('Đóng')}"><i class="ri-close-line"></i></button>
            </div>
            <ul class="search__list" id="search-list" role="listbox"></ul>
            <p class="search__hint">${t('Ví dụ: "Phú Quốc 3 ngày", "Hội An ăn gì", "trekking", "tháng 12"')}</p>
        </div>`
    document.body.append(box)
    const input = box.querySelector('.search__input')
    const list = box.querySelector('.search__list')

    async function load() {
        if (index) return index
        try {
            const res = await fetch(`${SITE_ROOT}assets/js/data/search-${LANG}.json`)
            index = (await res.json()).map(x => ({ ...x, words: x.k.split(' '), nameWords: plain(x.n).split(' ') }))
        } catch {
            index = []
        }
        return index
    }

    /* "3 ngày" / "3 days" / "3n" → một từ "3ngay" (khớp đúng số ngày của tour); từ ≤ 2 ký tự phải khớp nguyên chữ */
    const tokenize = q => [...new Set(plain(q).replace(/\b(\d+) ?(ngay|days?|n)\b/g, '$1ngay').split(' ').filter(Boolean))]
    const matches = (words, tok) => words.some(w => (tok.length <= 2 || /^\d/.test(tok) ? w === tok : w.startsWith(tok)))
    const FOOD = /\b(an gi|am thuc|mon ngon|dac san|food|eat)\b/

    function search(q) {
        const tokens = tokenize(q)
        if (!tokens.length || !index) return []
        const wantsFood = FOOD.test(plain(q))
        const scored = index.map(x => {
            const hit = tokens.filter(tok => matches(x.words, tok)).length
            const inName = tokens.filter(tok => matches(x.nameWords, tok)).length
            return { x, hit, score: hit * 10 + inName * 4 + BONUS[x.t] + (wantsFood && x.t === 'food' ? 20 : 0) }
        })
        let pool = scored.filter(s => s.hit === tokens.length)
        if (!pool.length && tokens.length > 1) pool = scored.filter(s => s.hit >= tokens.length - 1)
        return pool.sort((a, b) => b.score - a.score).slice(0, 8).map(s => s.x)
    }

    function render() {
        const q = input.value.trim()
        active = results.length ? 0 : -1
        input.setAttribute('aria-expanded', String(results.length > 0))
        list.innerHTML = results.length
            ? results.map((x, i) => `
                <li role="option" id="search-opt-${i}" aria-selected="${i === active}">
                    <a href="${SITE_ROOT}${x.u}" class="search__item">
                        <i class="${TYPES[x.t][0]}" aria-hidden="true"></i>
                        <span><strong>${x.n}</strong><small>${TYPES[x.t][1]} · ${x.s}</small></span>
                    </a>
                </li>`).join('')
            : q ? `<li class="search__empty">${t('Không tìm thấy – thử tên khác, viết không dấu hoặc ít từ hơn.')}</li>` : ''
        input.setAttribute('aria-activedescendant', active >= 0 ? `search-opt-${active}` : '')
    }

    function move(step) {
        if (!results.length) return
        active = (active + step + results.length) % results.length
        list.querySelectorAll('[role=option]').forEach((li, i) => li.setAttribute('aria-selected', String(i === active)))
        input.setAttribute('aria-activedescendant', `search-opt-${active}`)
        list.querySelector(`#search-opt-${active}`)?.scrollIntoView({ block: 'nearest' })
    }

    function open() {
        box.hidden = false
        document.body.classList.add('search-is-open')
        input.focus()
        load().then(() => { results = search(input.value); render() })
    }
    function close() {
        box.hidden = true
        document.body.classList.remove('search-is-open')
        openBtn.focus()
    }

    openBtn.addEventListener('click', open)
    box.querySelector('.search__close').addEventListener('click', close)
    box.addEventListener('click', e => { if (e.target === box) close() })
    input.addEventListener('input', async () => { await load(); results = search(input.value); render() })
    input.addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); move(1) }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1) }
        else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); location.href = `${SITE_ROOT}${results[active].u}` }
        else if (e.key === 'Escape') close()
    })
    document.addEventListener('keydown', e => {
        const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable
        if (box.hidden && ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)))) {
            e.preventDefault()
            open()
        }
    })
})()
