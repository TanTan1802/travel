/*==================== TRẮC NGHIỆM "ĐI ĐÂU HỢP VỚI BẠN?" ====================*/
/*
 * 6 câu hỏi → chấm điểm mọi điểm đến theo sở thích, tháng đi, vùng miền, người đi cùng
 * → gợi ý tuyến 1–4 điểm gần nhau, mở thẳng trong trình lập kế hoạch.
 */
const QUIZ_TRIP_LENGTHS = [
    { id: 'short', label: ['2–3 ngày', '2–3 days'], days: 3, stops: 1 },
    { id: 'medium', label: ['4–6 ngày', '4–6 days'], days: 5, stops: 2 },
    { id: 'long', label: ['7–10 ngày', '7–10 days'], days: 9, stops: 3 },
    { id: 'epic', label: ['Trên 10 ngày', 'Over 10 days'], days: 12, stops: 4 },
]
/* Hai điểm liền nhau trong tuyến gợi ý cách nhau tối đa (đường chim bay, km) */
const QUIZ_MAX_HOP_KM = 450

const QUIZ_QUESTIONS = [
    { id: 'likes', multi: true, title: ['Bạn thích kiểu du lịch nào?', 'What kind of trip do you enjoy?'], hint: ['Chọn một hoặc nhiều', 'Pick one or more'],
        options: () => Object.keys(CATEGORIES).map(id => ({ id, label: CATEGORIES[id] })) },
    { id: 'month', title: ['Bạn định đi vào tháng nào?', 'Which month are you travelling?'],
        options: () => [{ id: '0', label: t('Chưa biết') }, ...Array.from({ length: 12 }, (_, i) => ({ id: String(i + 1), label: t('Tháng {m}', { m: monthLabel(i + 1) }) }))] },
    { id: 'length', title: ['Chuyến đi dài bao lâu?', 'How long is your trip?'],
        options: () => QUIZ_TRIP_LENGTHS.map(x => ({ id: x.id, label: pickLang(x.label) })) },
    { id: 'region', title: ['Muốn khám phá vùng nào?', 'Which region?'],
        options: () => [{ id: 'all', label: t('Đâu cũng được') }, ...Object.keys(REGIONS).map(id => ({ id, label: REGIONS[id] }))] },
    { id: 'style', title: ['Bạn đi cùng ai?', 'Who are you travelling with?'],
        options: () => Object.entries(TRAVEL_STYLES).map(([id, s]) => ({ id, label: pickLang(s.label) })) },
    { id: 'tier', title: ['Ngân sách của bạn?', 'Your budget?'],
        options: () => [{ id: 'saving', label: t('Tiết kiệm') }, { id: 'comfort', label: t('Thoải mái') }] },
]

/* Điểm một điểm đến theo câu trả lời, kèm lý do để hiển thị */
function scoreDestinationForQuiz(d, answers) {
    let score = d.rating
    const reasons = []
    const likes = answers.likes || []
    const matched = likes.filter(c => d.categories.includes(c))
    if (matched.length) {
        score += 3 * matched.length
        reasons.push(matched.map(c => CATEGORIES[c]).join(', '))
    } else if (likes.length) {
        score -= 3
    }
    const month = Number(answers.month || 0)
    if (month) {
        if (d.bestMonths.includes(month)) {
            score += 3
            reasons.push(t('Đẹp nhất tháng {m}', { m: monthLabel(month) }))
        } else {
            score -= 2
        }
    }
    if (answers.region && answers.region !== 'all') score += d.region === answers.region ? 2 : -6
    const style = TRAVEL_STYLES[answers.style]
    if (style && style.caution.includes(d.id)) score -= 3
    return { d, score, reasons }
}

/* Tuyến gợi ý: điểm cao nhất rồi thêm các điểm tốt nhất ở gần (≤ QUIZ_MAX_HOP_KM) */
function quizRecommendation(answers) {
    const length = QUIZ_TRIP_LENGTHS.find(x => x.id === answers.length) || QUIZ_TRIP_LENGTHS[1]
    const ranked = DESTINATIONS.map(d => scoreDestinationForQuiz(d, answers)).sort((a, b) => b.score - a.score)
    const route = [ranked[0]]
    for (const r of ranked.slice(1)) {
        if (route.length >= length.stops) break
        if (route.some(x => distanceKm(x.d, r.d) <= QUIZ_MAX_HOP_KM) && r.score >= ranked[0].score - 6) route.push(r)
    }
    /* Chia số ngày cho các điểm dừng (điểm đầu được thêm ngày lẻ) */
    const base = Math.floor(length.days / route.length)
    const extra = length.days - base * route.length
    const stops = route.map((r, i) => ({ id: r.d.id, days: Math.max(1, base + (i < extra ? 1 : 0)), reasons: r.reasons }))
    return { stops, alternatives: ranked.filter(r => !route.includes(r)).slice(0, 3).map(r => r.d) }
}

function quizPlannerUrl(answers, rec) {
    const params = new URLSearchParams()
    params.set('p', rec.stops.map(s => `${s.id}.${s.days}`).join(','))
    if (Number(answers.month)) params.set('m', answers.month)
    if (answers.tier === 'comfort') params.set('b', 'c')
    if (answers.style) params.set('s', answers.style)
    return plannerUrl(`?${params.toString().replace(/%2C/g, ',')}`)
}

/*---------- Giao diện: hộp thoại từng bước ----------*/
const quiz = { step: 0, answers: {} }

function quizStepHtml() {
    const q = QUIZ_QUESTIONS[quiz.step]
    const value = quiz.answers[q.id]
    const selected = id => (q.multi ? (value || []).includes(id) : value === id)
    return `
        <div class="quiz__progress" aria-hidden="true"><span style="width: ${((quiz.step + 1) / QUIZ_QUESTIONS.length) * 100}%"></span></div>
        <p class="quiz__count">${t('Câu {n}/{total}', { n: quiz.step + 1, total: QUIZ_QUESTIONS.length })}</p>
        <h3 class="quiz__question" id="quiz-title">${pickLang(q.title)}</h3>
        ${q.hint ? `<p class="quiz__hint">${pickLang(q.hint)}</p>` : ''}
        <div class="quiz__options${q.id === 'month' ? ' quiz__options--grid' : ''}" role="group" aria-labelledby="quiz-title">
            ${q.options().map(o => `
                <button type="button" class="quiz__option${selected(o.id) ? ' quiz__option--active' : ''}" data-quiz-option="${o.id}" aria-pressed="${selected(o.id)}">${o.label}</button>
            `).join('')}
        </div>
        <div class="quiz__nav">
            <button type="button" class="button button--ghost button--flex" data-quiz-nav="back"${quiz.step === 0 ? ' disabled' : ''}><i class="ri-arrow-left-line"></i> ${t('Quay lại')}</button>
            ${q.multi ? `<button type="button" class="button button--flex" data-quiz-nav="next"${(value || []).length ? '' : ' disabled'}>${t('Tiếp tục')} <i class="ri-arrow-right-line"></i></button>` : ''}
        </div>
    `
}

function quizResultHtml() {
    const rec = quizRecommendation(quiz.answers)
    const days = rec.stops.reduce((n, s) => n + s.days, 0)
    return `
        <p class="quiz__count">${t('Gợi ý dành cho bạn')}</p>
        <h3 class="quiz__question">${rec.stops.map(s => getDestination(s.id).name).join(' → ')}</h3>
        <p class="quiz__hint">${t('{n} ngày', { n: days })} · ${rec.stops.length > 1 ? t('{n} điểm đến gần nhau', { n: rec.stops.length }) : t('1 điểm đến')}</p>
        <ul class="quiz__result">
            ${rec.stops.map(s => {
                const d = getDestination(s.id)
                return `
                    <li class="quiz__pick">
                        <img data-wiki="${wikiAttr(heroCandidates(d))}" data-width="500" data-sizes="96px" alt="" class="quiz__pick-img">
                        <div>
                            <a href="${destinationUrl(d.id)}" class="quiz__pick-name">${d.name}</a>
                            <small>${t('{n} ngày', { n: s.days })} · ${d.tagline}</small>
                            ${s.reasons.length ? `<small class="quiz__reason"><i class="ri-check-line"></i> ${s.reasons.join(' · ')}</small>` : ''}
                        </div>
                    </li>
                `
            }).join('')}
        </ul>
        ${rec.alternatives.length ? `<p class="quiz__alt">${t('Cũng hợp với bạn:')} ${rec.alternatives.map(d => `<a href="${destinationUrl(d.id)}" class="tag">${d.name}</a>`).join(' ')}</p>` : ''}
        <div class="quiz__nav">
            <button type="button" class="button button--ghost button--flex" data-quiz-nav="restart"><i class="ri-refresh-line"></i> ${t('Làm lại')}</button>
            <a href="${quizPlannerUrl(quiz.answers, rec)}" class="button button--flex" id="quiz-plan"><i class="ri-route-line"></i> ${t('Lên kế hoạch với gợi ý này')}</a>
        </div>
    `
}

function renderQuiz() {
    const body = document.getElementById('quiz-body')
    body.innerHTML = quiz.step < QUIZ_QUESTIONS.length ? quizStepHtml() : quizResultHtml()
    hydrateWikiImages(body)
    body.querySelector('button:not([disabled]), a')?.focus({ preventScroll: true })
}

function initQuiz() {
    const dialog = document.getElementById('quiz')
    if (!dialog) return
    document.querySelectorAll('[data-quiz-open]').forEach(btn => btn.addEventListener('click', () => {
        quiz.step = 0
        quiz.answers = {}
        renderQuiz()
        if (typeof dialog.showModal === 'function') dialog.showModal()
        else dialog.setAttribute('open', '')
    }))
    dialog.addEventListener('click', e => {
        if (e.target === dialog || e.target.closest('[data-quiz-close]')) return dialog.close()
        const option = e.target.closest('[data-quiz-option]')
        const nav = e.target.closest('[data-quiz-nav]')
        const q = QUIZ_QUESTIONS[quiz.step]
        if (option && q) {
            const id = option.dataset.quizOption
            if (q.multi) {
                const list = new Set(quiz.answers[q.id] || [])
                list.has(id) ? list.delete(id) : list.add(id)
                quiz.answers[q.id] = [...list]
            } else {
                quiz.answers[q.id] = id
                quiz.step++
            }
            renderQuiz()
        } else if (nav) {
            if (nav.dataset.quizNav === 'back') quiz.step = Math.max(0, quiz.step - 1)
            if (nav.dataset.quizNav === 'next') quiz.step++
            if (nav.dataset.quizNav === 'restart') {
                quiz.step = 0
                quiz.answers = {}
            }
            renderQuiz()
        }
    })
}

if (typeof document !== 'undefined' && typeof document.getElementById === 'function') initQuiz()
