/*==================== TREKKING: TRANG TỔNG trekking/ + TỪNG CUNG trekking/<id>/ ====================*/
/*
 * Chỉ dùng khi build (tools/build.js) – dữ liệu ở data/treks.json (TREK_LEVELS, TREKS).
 * Trang tổng: thang độ khó, các cung theo độ khó, đồ cần mang, nguyên tắc an toàn, chọn đơn vị tổ chức.
 * Trang từng cung: số liệu chính, quy định, lịch trình từng ngày, mùa đẹp 12 tháng, chi phí, an toàn, đồ mang theo,
 * đường tới điểm xuất phát, các cung khác. Ngoài ra: mục "Trekking quanh đây" (trang điểm đến) và theo tháng (thang/<m>/).
 */
const TREK_DIR = 'trekking'
const TREK_ORDER = ['easy', 'moderate', 'hard', 'expert']

const trekHubUrl = (hash = '') => `${SITE_ROOT}${LANG_PREFIX}${TREK_DIR}/index.html${hash}`
const trekUrl = id => `${SITE_ROOT}${LANG_PREFIX}${TREK_DIR}/${id}/index.html`
const trekList = () => (typeof TREKS !== 'undefined' ? TREKS : [])
const trekLevel = tr => TREK_LEVELS[tr.level]

const kmText = tr => (tr.distanceKm[0] === tr.distanceKm[1] ? `${tr.distanceKm[0]} km` : `${tr.distanceKm[0]} – ${tr.distanceKm[1]} km`)
const daysText = tr => (tr.days === 1 ? t('Trong ngày') : t('{days} ngày {nights} đêm', { days: tr.days, nights: tr.days - 1 }))
const summitText = tr => (tr.summit ? `${tr.summit.toLocaleString(LANG === 'vi' ? 'vi-VN' : 'en-US')} m` : '')

/* Đồ cần mang theo từng mức độ (mức sau gồm cả mức trước) */
const TREK_GEAR = {
    easy: [
        ['Giày đế bám (giày trekking hoặc giày thể thao gai sâu), tất dày', 'Grippy shoes (hiking boots or deep-tread trainers) and thick socks'],
        ['Áo mưa mỏng, mũ, kem chống nắng', 'A light raincoat, hat and sunscreen'],
        ['1,5 – 2 lít nước, đồ ăn nhẹ', '1.5 – 2 litres of water and snacks'],
        ['Thuốc cá nhân, băng cá nhân, xịt chống côn trùng', 'Personal medicine, plasters and insect repellent'],
    ],
    moderate: [
        ['Balo 25 – 35 lít có đai hông, túi chống nước bên trong', 'A 25 – 35 litre pack with a hip belt and a waterproof liner'],
        ['Áo giữ nhiệt, áo khoác ấm cho đêm trên núi', 'A base layer and a warm jacket for the night'],
        ['Đèn pin đeo trán, pin dự phòng, sạc dự phòng', 'A head torch, spare batteries and a power bank'],
        ['Gậy trekking – đỡ gối rất nhiều khi xuống dốc', 'Trekking poles – they save your knees on descents'],
        ['Tất, quần áo thay khô để trong túi nilon', 'Dry socks and clothes in a plastic bag'],
    ],
    hard: [
        ['Áo gió chống nước, găng tay, mũ len – trên 2.500 m có thể dưới 5°C', 'A waterproof shell, gloves and a beanie – above 2,500 m it can drop below 5°C'],
        ['Giày trekking cổ cao đã đi quen (không mang giày mới)', 'Broken-in high-ankle boots (never new ones)'],
        ['Túi ngủ hoặc lót túi ngủ nếu ngủ lán', 'A sleeping bag or liner if sleeping in huts'],
        ['Viên muối khoáng, đồ ăn năng lượng', 'Electrolyte tablets and energy food'],
    ],
    expert: [
        ['Quần áo nhiều lớp, đồ dự phòng cho 3 ngày ẩm ướt', 'Layered clothing and spares for three wet days'],
        ['Còi, chăn giữ nhiệt khẩn cấp, bộ sơ cứu đầy đủ', 'A whistle, an emergency blanket and a full first-aid kit'],
    ],
}
const gearFor = level => TREK_ORDER.slice(0, TREK_ORDER.indexOf(level) + 1).flatMap(l => TREK_GEAR[l])

/* Nguyên tắc an toàn chung */
const TREK_RULES = [
    ['Đi cùng người dẫn đường địa phương hoặc đơn vị tổ chức có đăng ký với ban quản lý rừng; nhiều nơi cấm đi tự phát và có thể phạt.', 'Go with a local guide or an operator registered with the forest managers; many areas ban unorganised trekking and can fine you.'],
    ['Báo lịch trình, giờ dự kiến về cho người nhà; trên núi thường mất sóng điện thoại.', 'Leave your route and return time with family; there is often no phone signal in the mountains.'],
    ['Xem dự báo thời tiết trước 1 – 2 ngày; mưa lớn, bão, sương mù dày thì hoãn hoặc quay đầu.', 'Check the forecast 1 – 2 days ahead; postpone or turn back in heavy rain, storms or thick fog.'],
    ['Không tách đoàn, không đi đường tắt; đi sau người dẫn đường ở đoạn hẹp, đá trơn.', 'Never leave the group or take shortcuts; follow the guide on narrow and slippery sections.'],
    ['Mua bảo hiểm du lịch có bảo hiểm hoạt động leo núi, trekking.', 'Buy travel insurance that covers hiking and trekking.'],
    ['Mang rác xuống núi, không đốt lửa ngoài nơi cho phép, không hái hoa, bẻ cây.', 'Carry your rubbish down, only light fires where allowed and do not pick flowers or break branches.'],
]

/* Chọn đơn vị tổ chức */
const TREK_OPERATOR = [
    ['Có giấy phép lữ hành và có đăng ký với ban quản lý vườn quốc gia / chính quyền nơi đi.', 'Has a tour licence and is registered with the national park or local authorities.'],
    ['Thuê porter, người dẫn đường là người địa phương; tỉ lệ khoảng 1 người dẫn đường cho 5 – 8 khách.', 'Hires local porters and guides, with roughly one guide per 5 – 8 trekkers.'],
    ['Có bộ sơ cứu, phương án đưa người xuống núi khi bị thương, bảo hiểm cho khách.', 'Carries first aid, has an evacuation plan and insures its guests.'],
    ['Sẵn sàng hoãn, đổi lịch khi thời tiết xấu thay vì cố đi.', 'Is willing to postpone when the weather is bad rather than push on.'],
]

/* Ảnh của cung: ảnh riêng (images) nếu có; không thì ảnh của điểm đến gần, các cung cùng điểm đến lần lượt dùng ảnh khác nhau */
function trekImages(tr) {
    if (tr.images && tr.images.length) return [...tr.images, ...heroCandidates(getDestination(tr.near[0]))]
    const d = getDestination(tr.near[0])
    const k = trekList().filter(x => x.near[0] === tr.near[0]).findIndex(x => x.id === tr.id)
    const all = heroCandidates(d)
    return [...all.slice(k % all.length), ...all.slice(0, k % all.length)]
}

/* Thẻ một cung (dùng lại kiểu thẻ điểm đến) */
function trekCard(tr) {
    const level = trekLevel(tr)
    return `
        <div class="dest-card-wrap" data-trek-level="${tr.level}" data-trek-days="${tr.days}" data-trek-region="${tr.region}" data-trek-months="${tr.bestMonths.join(' ')}">
            <a href="${trekUrl(tr.id)}" class="dest-card trek-card">
                <div class="dest-card__media">
                    <img data-wiki="${wikiAttr(trekImages(tr))}" data-width="960" data-sizes="(max-width: 576px) calc(100vw - 32px), (max-width: 1024px) 46vw, 360px" alt="${pickLang(tr.name)}" class="dest-card__img" loading="lazy">
                    <span class="dest-card__region trek-level trek-level--${tr.level}"><i class="${level.icon}"></i> ${pickLang(level.label)}</span>
                </div>
                <div class="dest-card__body">
                    <h3 class="dest-card__title">${pickLang(tr.name)}</h3>
                    <span class="dest-card__province"><i class="ri-map-pin-2-line"></i> ${pickLang(tr.province)}</span>
                    <p class="dest-card__tagline">${pickLang(tr.highlights[0])}</p>
                    <div class="dest-card__tags">
                        <span class="tag"><i class="ri-time-line"></i> ${daysText(tr)}</span>
                        <span class="tag"><i class="ri-route-line"></i> ${kmText(tr)}</span>
                        ${tr.summit ? `<span class="tag"><i class="ri-arrow-up-line"></i> ${summitText(tr)}</span>` : ''}
                    </div>
                </div>
                <span class="dest-card__button" aria-hidden="true"><i class="ri-arrow-right-line"></i></span>
            </a>
        </div>
    `
}

/* Bộ lọc trang Trekking: chạy bằng JS (assets/js/guide.js) – không có JS thì ẩn, vẫn xem đủ các cung theo độ khó */
function trekFilterHtml(treks) {
    const opt = (value, label) => `<option value="${value}">${label}</option>`
    const select = (name, label, options) => `<label class="trek-filter__field"><span>${label}</span><select name="${name}">${opt('', t('Tất cả'))}${options}</select></label>`
    const levels = TREK_ORDER.filter(l => treks.some(x => x.level === l))
    const regions = Object.keys(REGIONS).filter(r => treks.some(x => x.region === r))
    return `
        <form class="trek-filter" id="trek-filter" hidden>
            ${select('level', t('Độ khó'), levels.map(l => opt(l, pickLang(TREK_LEVELS[l].label))).join(''))}
            ${select('days', t('Số ngày'), [opt('1', t('Trong ngày')), opt('2', t('{days} ngày {nights} đêm', { days: 2, nights: 1 })), opt('3', t('3 ngày trở lên'))].join(''))}
            ${select('region', t('Miền'), regions.map(r => opt(r, REGIONS[r])).join(''))}
            ${select('month', t('Tháng đi'), Array.from({ length: 12 }, (_, i) => opt(i + 1, t('Tháng {m}', { m: monthLabel(i + 1) }))).join(''))}
            <p class="trek-filter__count" aria-live="polite" data-template="${t('{count} cung phù hợp')}"></p>
        </form>
        <p class="trek-filter__empty" hidden>${t('Không có cung nào phù hợp – thử bỏ bớt điều kiện.')}</p>`
}

/* Đồ cần mang theo dạng danh sách tick: lưu trên máy người xem (guide.js), nút in chỉ in phần này */
function gearChecklistHtml(tr) {
    return `
        <section class="guide-section trek-gear" id="do-mang-theo" data-gear="${tr.id}">
            <h2 class="guide-section__title">${t('Đồ cần mang theo')}</h2>
            <p class="print-only trek-gear__print-title">${pickLang(tr.name)} · ${daysText(tr)} · ${pickLang(trekLevel(tr).label)}</p>
            <p class="trek-gear__hint">${t('Đánh dấu món đã chuẩn bị – lưu trên máy này, in ra để mang theo.')}</p>
            <div class="trek-gear__bar" hidden>
                <span class="trek-gear__count" aria-live="polite" data-template="${t('{done}/{total} món đã chuẩn bị')}"></span>
                <button type="button" class="chip trek-gear__btn" data-gear-action="reset"><i class="ri-checkbox-blank-line"></i> ${t('Bỏ chọn tất cả')}</button>
                <button type="button" class="chip chip--active trek-gear__btn" data-gear-action="print"><i class="ri-printer-line"></i> ${t('In danh sách')}</button>
            </div>
            <ul class="trek-gear__list">
                ${gearFor(tr.level).map((x, i) => `<li><label><input type="checkbox" data-gear-item="${i}"> <span>${pickLang(x)}</span></label></li>`).join('')}
            </ul>
        </section>`
}

function trekHubTitle() {
    return t('Trekking Việt Nam: cung đường, độ khó, lịch trình chi tiết')
}

function trekHubPage() {
    const treks = trekList()
    const list = items => `<ul class="guide-section__list">${items.map(x => `<li>${pickLang(x)}</li>`).join('')}</ul>`
    return `
        <section class="planner-hero guide-hero">
            <div class="container">
                ${breadcrumbHtml([[t('Trang chủ'), homeUrl()]])}
                <span class="guide-hero__icon"><i class="ri-footprint-line"></i></span>
                <h1 class="planner-hero__title">${trekHubTitle()}</h1>
                <p class="planner-hero__text">${t('{count} cung trekking từ dễ đến rất khó, mỗi cung có quãng đường, độ cao, mùa đẹp, lịch trình từng ngày, chi phí và quy định cần biết.', { count: treks.length })}</p>
            </div>
        </section>

        <div class="guide container">
            <aside class="guide__toc">
                <strong>${t('Nội dung')}</strong>
                <ol>
                    <li><a href="#do-kho">${t('Thang độ khó')}</a></li>
                    <li><a href="#tim-cung">${t('Tìm cung phù hợp')}</a></li>
                    ${TREK_ORDER.filter(l => treks.some(x => x.level === l)).map(l => `<li><a href="#${l}">${pickLang(TREK_LEVELS[l].label)}</a></li>`).join('')}
                    <li><a href="#do-mang-theo">${t('Đồ cần mang theo')}</a></li>
                    <li><a href="#an-toan">${t('Nguyên tắc an toàn')}</a></li>
                    <li><a href="#don-vi-to-chuc">${t('Chọn đơn vị tổ chức')}</a></li>
                </ol>
            </aside>
            <article class="guide__body">
                <section class="guide-section" id="do-kho">
                    <h2 class="guide-section__title">${t('Thang độ khó')}</h2>
                    <div class="trek-levels">
                        ${TREK_ORDER.map(l => `
                            <a href="#${l}" class="trek-levels__item trek-level--${l}">
                                <strong><i class="${TREK_LEVELS[l].icon}"></i> ${pickLang(TREK_LEVELS[l].label)}</strong>
                                <span>${pickLang(TREK_LEVELS[l].desc)}</span>
                            </a>
                        `).join('')}
                    </div>
                </section>
                <section class="guide-section" id="tim-cung">
                    <h2 class="guide-section__title">${t('Tìm cung phù hợp')}</h2>
                    ${trekFilterHtml(treks)}
                </section>
                ${TREK_ORDER.filter(l => treks.some(x => x.level === l)).map(l => `
                    <section class="guide-section" id="${l}" data-trek-group>
                        <h2 class="guide-section__title"><i class="${TREK_LEVELS[l].icon}"></i> ${pickLang(TREK_LEVELS[l].label)}</h2>
                        <div class="dest__grid trek-grid">${treks.filter(x => x.level === l).map(trekCard).join('')}</div>
                    </section>
                `).join('')}
                <section class="guide-section" id="do-mang-theo">
                    <h2 class="guide-section__title">${t('Đồ cần mang theo')}</h2>
                    <p>${t('Danh sách theo mức độ – mức khó hơn mang thêm đồ của mức trước.')}</p>
                    ${TREK_ORDER.map(l => `<h3 class="trek-subtitle">${pickLang(TREK_LEVELS[l].label)}</h3>${list(TREK_GEAR[l])}`).join('')}
                </section>
                <section class="guide-section" id="an-toan">
                    <h2 class="guide-section__title">${t('Nguyên tắc an toàn')}</h2>
                    ${list(TREK_RULES)}
                </section>
                <section class="guide-section" id="don-vi-to-chuc">
                    <h2 class="guide-section__title">${t('Chọn đơn vị tổ chức')}</h2>
                    ${list(TREK_OPERATOR)}
                    <p class="budget__note">${t('Quãng đường, chi phí và quy định là thông tin tham khảo tổng hợp từ nhiều nguồn và có thể thay đổi – hãy hỏi lại ban quản lý rừng hoặc đơn vị tổ chức trước khi đi.')}</p>
                </section>
            </article>
        </div>
    `
}

function trekTitle(tr) {
    return t('Trekking {name}: lịch trình {days}, độ khó, chi phí', { name: pickLang(tr.name), days: daysText(tr).toLowerCase() })
}

function trekDescription(tr) {
    return t('{name} ({province}): {level}, {km}{summit}, {days}. Lịch trình từng ngày, mùa đẹp, chi phí, quy định và lưu ý an toàn.', {
        name: pickLang(tr.name), province: pickLang(tr.province), level: pickLang(trekLevel(tr).label).toLowerCase(), km: kmText(tr),
        summit: tr.summit ? `, ${t('đỉnh {m}', { m: summitText(tr) })}` : '', days: daysText(tr).toLowerCase(),
    })
}

/* Câu hỏi thường gặp – hiện trên trang và đưa vào FAQPage */
function trekFaq(tr) {
    const months = tr.bestMonths.slice().sort((a, b) => a - b).map(m => monthLabel(m)).join(', ')
    return [
        [t('Trekking {name} mất bao lâu, dài bao nhiêu km?', { name: pickLang(tr.name) }),
            `${daysText(tr)}, ${kmText(tr)} (${pickLang(tr.distanceNote)}).`],
        [t('Trekking {name} có khó không?', { name: pickLang(tr.name) }),
            `${pickLang(trekLevel(tr).label)}: ${pickLang(trekLevel(tr).desc)}`],
        [t('Có cần người dẫn đường khi trekking {name}?', { name: pickLang(tr.name) }),
            tr.guide === 'required' ? t('Có – phải đi cùng người dẫn đường địa phương hoặc đơn vị tổ chức.') + (tr.notice ? ` ${pickLang(tr.notice)}` : '')
                : t('Không bắt buộc nhưng nên thuê người dẫn đường địa phương.')],
        [t('Nên trekking {name} vào tháng nào?', { name: pickLang(tr.name) }), t('Tháng {months}.', { months })],
    ]
}

function trekStats(tr) {
    const level = trekLevel(tr)
    const stats = [
        ['ri-bar-chart-line', t('Độ khó'), `<span class="trek-level trek-level--${tr.level}"><i class="${level.icon}"></i> ${pickLang(level.label)}</span>`],
        ['ri-time-line', t('Thời gian'), daysText(tr)],
        ['ri-route-line', t('Quãng đường'), `${kmText(tr)} <small>(${pickLang(tr.distanceNote)})</small>`],
        ...(tr.summit ? [['ri-arrow-up-line', t('Điểm cao nhất'), summitText(tr)]] : []),
        ['ri-user-follow-line', t('Người dẫn đường'), tr.guide === 'required' ? t('Bắt buộc') : t('Nên thuê')],
        ['ri-flag-line', t('Xuất phát'), pickLang(tr.start)],
    ]
    return `<dl class="trek-stats">${stats.map(([icon, label, value]) => `<div><dt><i class="${icon}"></i> ${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`
}

/* Dải 12 tháng: tháng đẹp tô đậm, có liên kết sang trang tháng */
function trekMonths(tr) {
    return `
        <ol class="trek-months">
            ${Array.from({ length: 12 }, (_, i) => i + 1).map(m => `
                <li class="${tr.bestMonths.includes(m) ? 'trek-months__good' : ''}"><a href="${monthUrl(m)}" title="${tr.bestMonths.includes(m) ? t('Mùa đẹp') : t('Ngoài mùa đẹp')}">${monthShort(m)}</a></li>
            `).join('')}
        </ol>
    `
}

function trekPage(tr) {
    const list = items => `<ul class="guide-section__list">${items.map(x => `<li>${pickLang(x)}</li>`).join('')}</ul>`
    const dests = tr.near.map(getDestination).filter(Boolean)
    const others = trekList().filter(x => x.id !== tr.id).sort((a, b) => (b.region === tr.region) - (a.region === tr.region)).slice(0, 3)
    const sections = [
        ['tong-quan', t('Tổng quan')],
        ['lich-trinh', t('Lịch trình từng ngày')],
        ['mua-dep', t('Mùa đẹp')],
        ['chi-phi', t('Chi phí & thủ tục')],
        ['an-toan', t('An toàn')],
        ['do-mang-theo', t('Đồ cần mang theo')],
        ['hoi-dap', t('Câu hỏi thường gặp')],
    ]
    return `
        <section class="planner-hero guide-hero">
            <div class="container">
                ${breadcrumbHtml([[t('Trang chủ'), homeUrl()], [t('Trekking'), trekHubUrl()]])}
                <span class="guide-hero__icon"><i class="${trekLevel(tr).icon}"></i></span>
                <h1 class="planner-hero__title">${t('Trekking {name}', { name: pickLang(tr.name) })}</h1>
                <p class="planner-hero__text">${pickLang(tr.province)} · ${pickLang(trekLevel(tr).label)} · ${daysText(tr)} · ${kmText(tr)}${tr.summit ? ` · ${summitText(tr)}` : ''}</p>
                <p class="guide-hero__updated">${t('Cập nhật: tháng {date}', { date: `${tr.updated.slice(5)}/${tr.updated.slice(0, 4)}` })}</p>
            </div>
        </section>

        <div class="guide container">
            <aside class="guide__toc">
                <strong>${t('Nội dung')}</strong>
                <ol>${sections.map(([id, title]) => `<li><a href="#${id}">${title}</a></li>`).join('')}</ol>
            </aside>
            <article class="guide__body">
                <section class="guide-section" id="tong-quan">
                    <h2 class="guide-section__title">${t('Tổng quan')}</h2>
                    <figure class="trek-photo">
                        <img data-wiki="${wikiAttr(trekImages(tr))}" data-width="1280" data-sizes="(max-width: 768px) calc(100vw - 32px), 760px" alt="${pickLang(tr.name)}" loading="lazy">
                    </figure>
                    ${trekStats(tr)}
                    ${tr.notice ? `<p class="trek-notice"><i class="ri-alarm-warning-line"></i> <span>${pickLang(tr.notice)}</span></p>` : ''}
                    ${list(tr.highlights)}
                </section>
                <section class="guide-section" id="lich-trinh">
                    <h2 class="guide-section__title">${t('Lịch trình từng ngày')}</h2>
                    <ol class="trek-plan">
                        ${tr.plan.map((day, i) => `
                            <li class="trek-plan__day">
                                <h3 class="trek-plan__title">${tr.days > 1 ? `${t('Ngày {n}', { n: i + 1 })}: ` : ''}${pickLang(day.title)}</h3>
                                <p>${pickLang(day.text)}</p>
                            </li>
                        `).join('')}
                    </ol>
                    <p><strong>${t('Kết thúc')}:</strong> ${pickLang(tr.end)}</p>
                </section>
                <section class="guide-section" id="mua-dep">
                    <h2 class="guide-section__title">${t('Mùa đẹp')}</h2>
                    ${trekMonths(tr)}
                </section>
                <section class="guide-section" id="chi-phi">
                    <h2 class="guide-section__title">${t('Chi phí & thủ tục')}</h2>
                    ${list(tr.costs)}
                </section>
                <section class="guide-section" id="an-toan">
                    <h2 class="guide-section__title">${t('An toàn')}</h2>
                    ${list(tr.safety)}
                    <p><a href="${trekHubUrl('#an-toan')}">${t('Nguyên tắc an toàn chung khi trekking')} <i class="ri-arrow-right-line"></i></a></p>
                </section>
                ${gearChecklistHtml(tr)}
                <section class="guide-section" id="hoi-dap">
                    <h2 class="guide-section__title">${t('Câu hỏi thường gặp')}</h2>
                    <dl class="route-faq">${trekFaq(tr).map(([q, a]) => `<dt>${q}</dt><dd>${a}</dd>`).join('')}</dl>
                </section>
                <section class="guide-section explore-hub">
                    <div class="explore-hub__group">
                        <strong>${t('Đi tới điểm xuất phát')}</strong>
                        <div class="month-nav">
                            ${dests.map(d => `<a href="${destinationUrl(d.id)}" class="chip"><i class="ri-map-pin-2-line"></i> ${d.name}</a>`).join('')}
                            ${HUB_IDS.filter(id => id !== dests[0].id).map(id => `<a href="${routeUrl(id, dests[0].id)}" class="chip">${t('{from} đi {to}', { from: getDestination(id).name, to: dests[0].name })}</a>`).join('')}
                        </div>
                    </div>
                    <p class="budget__note">${t('Quãng đường, chi phí và quy định là thông tin tham khảo tổng hợp từ nhiều nguồn và có thể thay đổi – hãy hỏi lại ban quản lý rừng hoặc đơn vị tổ chức trước khi đi.')}</p>
                </section>
            </article>
        </div>

        <section class="section">
            <h2 class="section__title">${t('Cung trekking khác')}</h2>
            <div class="dest__grid container">${others.map(trekCard).join('')}</div>
        </section>
    `
}

/* Trang điểm đến: các cung trekking gần (rỗng nếu không có) */
function nearbyTreksHtml(d) {
    const treks = trekList().filter(x => x.near.includes(d.id))
    if (!treks.length) return ''
    return `
        <div class="hub-transport">
            <h4 class="hub-transport__title"><i class="ri-footprint-line"></i> ${t('Trekking quanh đây')}</h4>
            <ul class="hub-modes">
                ${treks.map(x => `<li><a href="${trekUrl(x.id)}">${pickLang(x.name)}</a> <span>· ${pickLang(trekLevel(x).label)} · ${daysText(x)} · ${kmText(x)}</span></li>`).join('')}
            </ul>
        </div>
    `
}

/* Trang tháng: các cung đẹp trong tháng */
function monthTreksHtml(m) {
    const treks = trekList().filter(x => x.bestMonths.includes(m))
    if (!treks.length) return ''
    return `
        <section class="section">
            <h2 class="section__title">${t('Trekking đẹp tháng {m}', { m: monthLabel(m) })}</h2>
            <div class="dest__grid container">${treks.map(trekCard).join('')}</div>
            <p class="container"><a href="${trekHubUrl()}">${t('Xem tất cả cung trekking')} <i class="ri-arrow-right-line"></i></a></p>
        </section>
    `
}
