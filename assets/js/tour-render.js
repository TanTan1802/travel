/*==================== TOUR & COMBO: TRANG TỔNG tour/ + TỪNG TOUR tour/<id>/ ====================*/
/*
 * Chỉ dùng khi build (tools/build.js) – dữ liệu ở data/tours.json (TOUR_STYLES, TOUR_PACKAGES).
 * Lịch trình trỏ tới điểm tham quan trong SIGHTS (theo tên tiếng Việt) nên giá vé, giờ mở cửa, địa chỉ luôn
 * khớp trang điểm đến. Chi phí / người tính từ dữ liệu: vé các điểm + phòng đôi chia 2 (PLACES.stays theo loại)
 * + ăn uống, đi lại tại chỗ (dailyCosts – cùng cách tính với trình lập kế hoạch). Chưa gồm vé máy bay / tàu xe tới nơi.
 * Ngoài ra: mục "Tour & combo ở đây" trên trang điểm đến.
 */
const TOUR_DIR = 'tour'
const TOUR_STYLE_ORDER = () => Object.keys(TOUR_STYLES)

const tourHubUrl = (hash = '') => `${SITE_ROOT}${LANG_PREFIX}${TOUR_DIR}/index.html${hash}`
const tourUrl = id => `${SITE_ROOT}${LANG_PREFIX}${TOUR_DIR}/${id}/index.html`
const tourList = () => (typeof TOUR_PACKAGES !== 'undefined' ? TOUR_PACKAGES : [])
const tourStyle = tp => TOUR_STYLES[tp.style]
const tourDaysText = tp => (tp.days === 1 ? t('Trong ngày') : t('{days} ngày {nights} đêm', { days: tp.days, nights: tp.days - 1 }))

/*---------- Tour một hoặc nhiều điểm đến ----------*/
/* Điểm đến của ngày i: plan[i].dest nếu có, không thì như ngày trước (ngày đầu: tp.dest). Ngủ đêm ở điểm đến của ngày đó. */
function tourDayDest(tp, i) {
    let dest = tp.dest
    for (let k = 0; k <= i; k++) if (tp.plan[k].dest) dest = tp.plan[k].dest
    return dest
}
/* Các chặng: [{ id, days }] – nối liền các ngày cùng điểm đến (dùng cho trình lập kế hoạch) */
function tourStops(tp) {
    const stops = []
    tp.plan.forEach((_, i) => {
        const id = tourDayDest(tp, i)
        if (stops.length && stops[stops.length - 1].id === id) stops[stops.length - 1].days++
        else stops.push({ id, days: 1 })
    })
    return stops
}
const tourStopNames = tp => tourStops(tp).map(s => getDestination(s.id).name).join(' → ')
/* Tháng đẹp: đẹp ở mọi điểm đến của tour (không có tháng nào chung thì lấy theo điểm đầu) */
function tourBestMonths(tp) {
    const lists = tourStops(tp).map(s => getDestination(s.id).bestMonths)
    const common = lists[0].filter(m => lists.every(l => l.includes(m)))
    return common.length ? common : lists[0]
}

/* Điểm tham quan của ngày i (đối tượng trong SIGHTS – đã kiểm tra lúc build-data) */
function tourDaySights(tp, i) {
    const all = (SIGHTS[tourDayDest(tp, i)] || []).flat()
    return tp.plan[i].sights.map(name => all.find(s => s.name[0] === name)).filter(Boolean)
}
const tourAllSights = tp => tp.plan.flatMap((_, i) => tourDaySights(tp, i))
const sightRange = s => (Array.isArray(s.price) ? s.price : [s.price || 0, s.price || 0])

/* Chặng di chuyển giữa hai điểm đến: phương tiện gợi ý (cùng cách tính với trình lập kế hoạch), chi phí tiết kiệm – thoải mái */
function tourLeg(fromId, toId) {
    if (fromId === toId) return null
    const a = getDestination(fromId)
    const b = getDestination(toId)
    const saving = transportOptions(a, b, 'saving')
    const comfort = transportOptions(a, b, 'comfort')
    const pick = res => res.options.find(o => o.mode === res.recommended) || res.options[0]
    const option = pick(saving)
    return { from: a, to: b, option, cost: [option.cost, pick(comfort).cost] }
}
const tourLegs = tp => tp.plan.map((_, i) => (i ? tourLeg(tourDayDest(tp, i - 1), tourDayDest(tp, i)) : null))
const legHtml = leg => `<p class="pkg-leg"><i class="${MODE_ICONS[leg.option.mode]}"></i> <span><strong>${leg.from.name} → ${leg.to.name}</strong> · ${modeLabel(leg.option)} · ${priceRange(leg.cost)}${modeNote(leg.option) ? ` <small>(${modeNote(leg.option)})</small>` : ''}</span></p>`

/* Chi phí / người: từng khoản [thấp, cao] + tổng */
function tourCost(tp) {
    const r10 = n => Math.round(n / 10000) * 10000
    const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
    const nights = tp.days - 1
    const tickets = tourAllSights(tp).map(sightRange).reduce(add, [0, 0])
    const items = [{ key: 'tickets', icon: 'ri-ticket-2-line', label: t('Vé tham quan & trải nghiệm'), range: tickets }]
    if (nights) {
        /* Đêm sau ngày i ngủ ở điểm đến của ngày i; loại lưu trú: các loại trong tp.stay mà điểm đến đó có */
        const stay = Array.from({ length: nights }, (_, i) => {
            const stays = (placesOf(tourDayDest(tp, i))?.stays || []).filter(x => tp.stay.includes(x.type))
            return [Math.min(...stays.map(x => x.price[0])) / 2, Math.max(...stays.map(x => x.price[1])) / 2]
        }).reduce(add, [0, 0])
        items.push({ key: 'stay', icon: 'ri-hotel-bed-line', label: t('{n} đêm lưu trú (phòng đôi, chia 2 người)', { n: nights }), range: [r10(stay[0]), r10(stay[1])] })
    }
    const legs = tourLegs(tp).filter(Boolean)
    if (legs.length) items.push({ key: 'legs', icon: 'ri-route-line', label: t('Di chuyển giữa các điểm ({n} chặng)', { n: legs.length }), range: legs.map(l => l.cost).reduce(add, [0, 0]) })
    const food = tp.plan.map((_, i) => {
        const saving = dailyCosts(tourDayDest(tp, i), 'saving')
        const comfort = dailyCosts(tourDayDest(tp, i), 'comfort')
        return saving && comfort ? [saving.food + saving.transport, comfort.food + comfort.transport] : [0, 0]
    }).reduce(add, [0, 0])
    if (food[1]) items.push({ key: 'food', icon: 'ri-restaurant-line', label: t('Ăn uống, đi lại tại chỗ'), range: food })
    const total = items.reduce((a, x) => add(a, x.range), [0, 0])
    return { items, total }
}

/* Link trình lập kế hoạch đã điền sẵn các chặng (một hoặc nhiều tour nối nhau) */
function tourPlannerUrl(...tours) {
    const stops = []
    tours.flatMap(tourStops).forEach(s => {
        if (stops.length && stops[stops.length - 1].id === s.id) stops[stops.length - 1].days += s.days
        else stops.push({ ...s })
    })
    return plannerUrl(`?p=${stops.map(s => `${s.id}.${s.days}`).join(',')}`)
}

/* Ảnh: ảnh riêng nếu có; không thì ảnh điểm đến đầu – các tour cùng điểm đến lần lượt dùng ảnh khác nhau */
function tourImages(tp) {
    const all = heroCandidates(getDestination(tp.dest))
    const k = tourList().filter(x => x.dest === tp.dest).findIndex(x => x.id === tp.id) % all.length
    return [...(tp.images || []), ...all.slice(k), ...all.slice(0, k)]
}

function tourCard(tp) {
    const style = tourStyle(tp)
    const d = getDestination(tp.dest)
    const { total } = tourCost(tp)
    return `
        <div class="dest-card-wrap" data-tour-style="${tp.style}" data-tour-days="${tp.days}" data-tour-region="${d.region}" data-tour-months="${tourBestMonths(tp).join(' ')}">
            <a href="${tourUrl(tp.id)}" class="dest-card pkg-card">
                <div class="dest-card__media">
                    <img data-wiki="${wikiAttr(tourImages(tp))}" data-width="960" data-sizes="(max-width: 576px) calc(100vw - 32px), (max-width: 1024px) 46vw, 360px" alt="${pickLang(tp.name)}" class="dest-card__img" loading="lazy">
                    <span class="dest-card__region pkg-style"><i class="${style.icon}"></i> ${pickLang(style.label)}</span>
                </div>
                <div class="dest-card__body">
                    <h3 class="dest-card__title">${pickLang(tp.name)}</h3>
                    <span class="dest-card__province"><i class="${tourStops(tp).length > 1 ? 'ri-route-line' : 'ri-map-pin-2-line'}"></i> ${tourStopNames(tp)}</span>
                    <p class="dest-card__tagline">${pickLang(tp.summary)}</p>
                    <div class="dest-card__tags">
                        <span class="tag"><i class="ri-time-line"></i> ${tourDaysText(tp)}</span>
                        <span class="tag"><i class="ri-wallet-3-line"></i> ${priceRange(total)}</span>
                    </div>
                </div>
                <span class="dest-card__button" aria-hidden="true"><i class="ri-arrow-right-line"></i></span>
            </a>
        </div>
    `
}

function tourHubTitle() {
    return t('Tour & combo du lịch Việt Nam: lịch trình 1 – 4 ngày, chi phí ước tính')
}

function tourFilterHtml(tours) {
    const opt = (value, label) => `<option value="${value}">${label}</option>`
    const select = (name, label, options) => `<label class="trek-filter__field"><span>${label}</span><select name="${name}">${opt('', t('Tất cả'))}${options}</select></label>`
    const styles = TOUR_STYLE_ORDER().filter(s => tours.some(x => x.style === s))
    const regions = Object.keys(REGIONS).filter(r => tours.some(x => getDestination(x.dest).region === r))
    return `
        <form class="trek-filter" id="tour-filter" hidden>
            ${select('style', t('Phong cách'), styles.map(s => opt(s, pickLang(TOUR_STYLES[s].label))).join(''))}
            ${select('days', t('Số ngày'), [opt('1', t('Trong ngày')), opt('2', t('{days} ngày {nights} đêm', { days: 2, nights: 1 })), opt('3', t('3 ngày trở lên'))].join(''))}
            ${select('region', t('Miền'), regions.map(r => opt(r, REGIONS[r])).join(''))}
            ${select('month', t('Tháng đi'), Array.from({ length: 12 }, (_, i) => opt(i + 1, t('Tháng {m}', { m: monthLabel(i + 1) }))).join(''))}
            <p class="trek-filter__count" aria-live="polite" data-template="${t('{count} tour phù hợp')}"></p>
        </form>
        <p class="trek-filter__empty" hidden>${t('Không có tour nào phù hợp – thử bỏ bớt điều kiện.')}</p>`
}

function tourHubPage() {
    const tours = tourList()
    const notes = [
        t('Giá là ước tính / người, tính từ giá vé và giá phòng trên trang điểm đến (có ghi tháng kiểm tra): mức thấp là phòng rẻ nhất + ăn bình dân, mức cao là phòng đắt nhất cùng loại + nhà hàng.'),
        t('Chưa gồm vé máy bay, tàu xe tới điểm đến – xem trang đường đi hoặc trình lập kế hoạch.'),
        t('Combo của resort, khu vui chơi (phòng + vé) thường rẻ hơn mua lẻ – so giá trước khi đặt.'),
    ]
    return `
        <section class="planner-hero guide-hero">
            <div class="container">
                ${breadcrumbHtml([[t('Trang chủ'), homeUrl()]])}
                <span class="guide-hero__icon"><i class="ri-suitcase-3-line"></i></span>
                <h1 class="planner-hero__title">${tourHubTitle()}</h1>
                <p class="planner-hero__text">${t('{count} tour trọn gói từ 1 đến 4 ngày: lịch trình từng ngày, điểm tham quan kèm giá vé, chi phí ước tính và link đặt phòng.', { count: tours.length })}</p>
            </div>
        </section>

        <div class="guide container">
            <aside class="guide__toc">
                <strong>${t('Nội dung')}</strong>
                <ol>
                    <li><a href="#phong-cach">${t('Phong cách')}</a></li>
                    <li><a href="#tim-tour">${t('Tìm tour phù hợp')}</a></li>
                    <li><a href="#cach-tinh">${t('Cách tính chi phí')}</a></li>
                </ol>
            </aside>
            <article class="guide__body">
                <section class="guide-section" id="phong-cach">
                    <h2 class="guide-section__title">${t('Phong cách')}</h2>
                    <div class="pkg-styles">
                        ${TOUR_STYLE_ORDER().filter(s => tours.some(x => x.style === s)).map(s => `
                            <div class="pkg-styles__item">
                                <strong><i class="${TOUR_STYLES[s].icon}"></i> ${pickLang(TOUR_STYLES[s].label)}</strong>
                                <span>${pickLang(TOUR_STYLES[s].desc)}</span>
                            </div>
                        `).join('')}
                    </div>
                </section>
                <section class="guide-section" id="tim-tour">
                    <h2 class="guide-section__title">${t('Tìm tour phù hợp')}</h2>
                    ${tourFilterHtml(tours)}
                    <div class="dest__grid trek-grid">${tours.map(tourCard).join('')}</div>
                </section>
                <section class="guide-section" id="cach-tinh">
                    <h2 class="guide-section__title">${t('Cách tính chi phí')}</h2>
                    <ul class="guide-section__list">${notes.map(x => `<li>${x}</li>`).join('')}</ul>
                </section>
            </article>
        </div>
    `
}

function tourTitle(tp) {
    return t('Tour {name}: lịch trình {days}, chi phí', { name: pickLang(tp.name), days: tourDaysText(tp).toLowerCase() })
}

function tourDescription(tp) {
    return `${pickLang(tp.summary)} ${t('Lịch trình từng ngày, giá vé từng điểm, chi phí ước tính {cost} / người.', { cost: priceRange(tourCost(tp).total) })}`
}

/* JSON-LD: TouristTrip với các điểm dừng theo thứ tự */
function tourJsonLd(tp, url) {
    return {
        '@type': 'TouristTrip',
        name: pickLang(tp.name),
        description: pickLang(tp.summary),
        url,
        itinerary: {
            '@type': 'ItemList',
            itemListElement: tourAllSights(tp).map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'TouristAttraction', name: pickLang(s.name) } })),
        },
    }
}

function tourStats(tp) {
    const style = tourStyle(tp)
    const stats = [
        [tourStops(tp).length > 1 ? 'ri-route-line' : 'ri-map-pin-2-line', tourStops(tp).length > 1 ? t('Hành trình') : t('Điểm đến'),
            tourStops(tp).map(x => `<a href="${destinationUrl(x.id)}">${getDestination(x.id).name}</a>${x.days > 1 || tourStops(tp).length > 1 ? ` <small>(${t('{n} ngày', { n: x.days })})</small>` : ''}`).join(' → ')],
        ['ri-compass-3-line', t('Phong cách'), `<i class="${style.icon}"></i> ${pickLang(style.label)}`],
        ['ri-time-line', t('Thời gian'), tourDaysText(tp)],
        ['ri-wallet-3-line', t('Chi phí ước tính / người'), priceRange(tourCost(tp).total)],
        ...(tp.stay.length ? [['ri-hotel-bed-line', t('Lưu trú'), tp.stay.map(s => pickLang(STAY_TYPES[s])).join(', ')]] : []),
    ]
    return `<dl class="trek-stats">${stats.map(([icon, label, value]) => `<div><dt><i class="${icon}"></i> ${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`
}

/* Điểm có vé từ mức này (cáp treo, khu vui chơi, tour đảo…) hiện link tìm vé online */
const TICKET_LINK_MIN = 300000
const escapeAttr = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/* key: mã ổn định của điểm trong tour (ngày + tên) để nhớ lựa chọn tùy chỉnh; on: có trong tour gốc */
function tourSightHtml(s, key = '', on = true) {
    const [low, high] = sightRange(s)
    const price = !high ? t('Miễn phí') : low === high ? shortVnd(low) : priceRange([low, high])
    return `
        <li class="pkg-sight${on ? '' : ' pkg-sight--extra'}">
            ${key ? `<label class="pkg-pick" hidden><input type="checkbox" data-pick="${escapeAttr(key)}" data-lo="${low}" data-hi="${high}"${on ? ' checked' : ''}> <span class="visually-hidden">${on ? t('Giữ trong tour') : t('Thêm vào tour')}</span></label>` : ''}
            <span class="pkg-sight__name">${pickLang(s.name)}</span>
            <span class="pkg-sight__meta">
                <span><i class="ri-ticket-2-line"></i> ${price}</span>
                ${s.hours ? `<span><i class="ri-time-line"></i> ${sightHours(s.hours)}</span>` : ''}
                ${s.address ? `<a href="${mapsSearchUrl(s.address)}" target="_blank" rel="noopener"><i class="ri-map-pin-line"></i> ${s.address}</a>` : ''}
                ${high >= TICKET_LINK_MIN ? `<a href="${ticketSearchUrl(s.name[1] || s.name[0])}" target="_blank" rel="noopener nofollow${affiliateActive() ? ' sponsored' : ''}"><i class="ri-coupon-3-line"></i> ${t('Tìm vé online')}</a>` : ''}
            </span>
        </li>`
}

function tourPage(tp) {
    const list = items => `<ul class="guide-section__list">${items.map(x => `<li>${pickLang(x)}</li>`).join('')}</ul>`
    const { items, total } = tourCost(tp)
    const legs = tourLegs(tp)
    const stops = tourStops(tp)
    const next = tourNextHtml(tp)
    const others = tourList().filter(x => x.id !== tp.id).sort((a, b) => (b.dest === tp.dest) - (a.dest === tp.dest) || (b.style === tp.style) - (a.style === tp.style)).slice(0, 3)
    const sections = [
        ['tong-quan', t('Tổng quan')],
        ['lich-trinh', t('Lịch trình từng ngày')],
        ['chi-phi', t('Chi phí ước tính')],
        ['dat-cho', t('Đặt phòng & lên kế hoạch')],
        ['mua-dep', t('Mùa đẹp')],
        ['noi-tiep', t('Nối tiếp hành trình')],
    ]
    return `
        <section class="planner-hero guide-hero">
            <div class="container">
                ${breadcrumbHtml([[t('Trang chủ'), homeUrl()], [t('Tour & combo'), tourHubUrl()]])}
                <span class="guide-hero__icon"><i class="${tourStyle(tp).icon}"></i></span>
                <h1 class="planner-hero__title">${pickLang(tp.name)}</h1>
                <p class="planner-hero__text">${tourStopNames(tp)} · ${pickLang(tourStyle(tp).label)} · ${tourDaysText(tp)} · ${priceRange(total)} / ${t('người')}</p>
                <p class="guide-hero__updated">${t('Cập nhật: tháng {date}', { date: `${tp.updated.slice(5)}/${tp.updated.slice(0, 4)}` })}</p>
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
                        <img data-wiki="${wikiAttr(tourImages(tp))}" data-width="1280" data-sizes="(max-width: 768px) calc(100vw - 32px), 760px" alt="${pickLang(tp.name)}" loading="lazy">
                    </figure>
                    <p>${pickLang(tp.summary)}</p>
                    ${tourStats(tp)}
                </section>
                <section class="guide-section" id="lich-trinh" data-tour-custom="${tp.id}">
                    <h2 class="guide-section__title">${t('Lịch trình từng ngày')}</h2>
                    <p class="pkg-custom-hint" hidden><i class="ri-equalizer-line"></i> ${t('Tùy chỉnh: bỏ tick điểm không muốn đi, mở "Thêm điểm" để thêm – chi phí tính lại ngay, lựa chọn được nhớ trên máy này.')} <button type="button" class="chip" data-custom-reset>${t('Về lịch gốc')}</button></p>
                    <ol class="trek-plan">
                        ${tp.plan.map((day, i) => `
                            <li class="trek-plan__day">
                                ${legs[i] ? legHtml(legs[i]) : ''}
                                <h3 class="trek-plan__title">${tp.days > 1 ? `${t('Ngày {n}', { n: i + 1 })}: ` : ''}${pickLang(day.title)}</h3>
                                <p>${pickLang(day.text)}</p>
                                <ul class="pkg-sights">${tourDaySights(tp, i).map(x => tourSightHtml(x, `${i}:${x.name[0]}`)).join('')}</ul>
                                ${tourExtrasHtml(tp, i)}
                            </li>
                        `).join('')}
                    </ol>
                </section>
                <section class="guide-section" id="chi-phi">
                    <h2 class="guide-section__title">${t('Chi phí ước tính')}</h2>
                    <table class="pkg-cost">
                        <caption class="visually-hidden">${t('Chi phí ước tính / người')}</caption>
                        <tbody>
                            ${items.map(x => `<tr><th scope="row"><i class="${x.icon}"></i> ${x.label}</th><td${x.key === 'tickets' ? ' data-cost-tickets' : ''}>${priceRange(x.range)}</td></tr>`).join('')}
                        </tbody>
                        <tfoot><tr><th scope="row">${t('Tổng / người')}</th><td data-cost-total data-other="${total[0] - items[0].range[0]},${total[1] - items[0].range[1]}">${priceRange(total)}</td></tr></tfoot>
                    </table>
                    <p class="budget__note">${t('Chưa gồm vé máy bay, tàu xe tới {dest} và chi tiêu cá nhân. Giá vé, giá phòng lấy từ trang điểm đến – combo phòng + vé của resort, khu vui chơi có thể rẻ hơn.', { dest: getDestination(stops[0].id).name })}</p>
                </section>
                <section class="guide-section" id="dat-cho">
                    <h2 class="guide-section__title">${t('Đặt phòng & lên kế hoạch')}</h2>
                    <div class="book-links">
                        <a href="${tourPlannerUrl(tp)}" class="book-link"><i class="ri-calendar-todo-line"></i> ${t('Thêm vào kế hoạch chuyến đi')}</a>
                        ${tp.stay.length ? stops.filter((x, k) => k < stops.length - 1 || x.days > 1).map(x => `<a href="${stayLinks(getDestination(x.id).name, '', '', x.days)[0].url}" class="book-link" target="_blank" rel="noopener nofollow"><i class="ri-hotel-line"></i> ${stops.length > 1 ? t('Phòng ở {dest}', { dest: getDestination(x.id).name }) : 'Booking.com'}</a>`).join('') : ''}
                    </div>
                    ${affiliateActive() ? `<p class="budget__note">${t('Một số link đặt phòng, đặt vé có mã giới thiệu: Việt Travel có thể nhận hoa hồng, giá bạn trả không đổi.')}</p>` : ''}
                    <div class="month-nav">
                        ${HUB_IDS.filter(id => id !== stops[0].id).map(id => `<a href="${routeUrl(id, stops[0].id)}" class="chip">${t('{from} đi {to}', { from: getDestination(id).name, to: getDestination(stops[0].id).name })}</a>`).join('')}
                    </div>
                    ${tp.tips && tp.tips.length ? `<h3 class="trek-subtitle">${t('Mẹo')}</h3>${list(tp.tips)}` : ''}
                </section>
                <section class="guide-section" id="mua-dep">
                    <h2 class="guide-section__title">${t('Mùa đẹp')}</h2>
                    ${stops.length > 1 ? `<p>${t('Tháng đẹp ở mọi điểm của hành trình')}:</p>` : ''}
                    ${trekMonths({ bestMonths: tourBestMonths(tp) })}
                </section>
                ${next}
                ${others.length ? `
                <section class="guide-section">
                    <h2 class="guide-section__title">${t('Tour khác')}</h2>
                    <div class="dest__grid trek-grid">${others.map(tourCard).join('')}</div>
                    <p><a href="${tourHubUrl()}">${t('Xem tất cả tour & combo')} <i class="ri-arrow-right-line"></i></a></p>
                </section>` : ''}
            </article>
        </div>
    `
}

/* "Thêm điểm": điểm tham quan khác của điểm đến – chỉ ở ngày đầu mỗi chặng để không trùng */
function tourExtrasHtml(tp, i) {
    const dest = tourDayDest(tp, i)
    if (i && tourDayDest(tp, i - 1) === dest) return ''
    const used = new Set(tp.plan.flatMap((d, k) => (tourDayDest(tp, k) === dest ? d.sights : [])))
    const extras = (SIGHTS[dest] || []).flat().filter(x => !used.has(x.name[0]))
    if (!extras.length) return ''
    return `
        <details class="pkg-more" hidden>
            <summary>${t('+ Thêm điểm ở {dest} ({n})', { dest: getDestination(dest).name, n: extras.length })}</summary>
            <ul class="pkg-sights">${extras.map(x => tourSightHtml(x, `+${dest}:${x.name[0]}`, false)).join('')}</ul>
        </details>`
}

/* Trang điểm đến: các tour ở đây */
function nearbyToursHtml(d) {
    const tours = tourList().filter(x => tourStops(x).some(s => s.id === d.id))
    if (!tours.length) return ''
    return `
        <div class="hub-transport">
            <h4 class="hub-transport__title"><i class="ri-suitcase-3-line"></i> ${t('Tour & combo ở đây')}</h4>
            <ul class="hub-modes">
                ${tours.map(x => `<li><a href="${tourUrl(x.id)}">${pickLang(x.name)}</a> <span>· ${tourStops(x).length > 1 ? `${tourStopNames(x)} · ` : ''}${tourDaysText(x)} · ${priceRange(tourCost(x).total)}</span></li>`).join('')}
            </ul>
        </div>
    `
}

/* "Nối tiếp hành trình": tour bắt đầu gần nơi tour này kết thúc – chặng nối, tổng số ngày, 1 nút mở trình lập kế hoạch đã ghép sẵn */
function tourNextHtml(tp) {
    const stops = tourStops(tp)
    const last = stops[stops.length - 1].id
    const lastIds = new Set(stops.map(s => s.id))
    const picks = tourList()
        .filter(x => x.id !== tp.id && !tourStops(x).every(s => lastIds.has(s.id)))
        .map(x => ({ x, leg: tourLeg(last, tourStops(x)[0].id) }))
        .map(o => ({ ...o, hours: o.leg ? o.leg.option.hours : 0 }))
        .filter(o => o.hours <= 6)
        .sort((a, b) => a.hours - b.hours)
        .slice(0, 3)
    if (!picks.length) return ''
    return `
        <section class="guide-section" id="noi-tiep">
            <h2 class="guide-section__title">${t('Nối tiếp hành trình')}</h2>
            <p>${t('Đi tiếp từ {dest} sang một tour khác – chặng nối và chi phí đã tính sẵn, bấm để mở trình lập kế hoạch với cả hai tour.', { dest: getDestination(last).name })}</p>
            <ul class="pkg-next">
                ${picks.map(({ x, leg }) => `
                    <li class="pkg-next__item">
                        <a href="${tourUrl(x.id)}" class="pkg-next__name">${pickLang(x.name)}</a>
                        <span class="pkg-next__meta">${tourDaysText(x)} · ${priceRange(tourCost(x).total)} / ${t('người')}</span>
                        ${leg ? legHtml(leg) : `<p class="pkg-leg"><i class="ri-map-pin-2-line"></i> <span>${t('Cùng điểm đến – không cần di chuyển')}</span></p>`}
                        <a href="${tourPlannerUrl(tp, x)}" class="book-link"><i class="ri-links-line"></i> ${t('Ghép 2 tour: {n} ngày', { n: tp.days + x.days })}</a>
                    </li>
                `).join('')}
            </ul>
        </section>`
}
