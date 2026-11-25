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

/* Điểm tham quan của từng ngày (đối tượng trong SIGHTS – đã kiểm tra lúc build-data) */
function tourDaySights(tp, day) {
    const all = (SIGHTS[tp.dest] || []).flat()
    return day.sights.map(name => all.find(s => s.name[0] === name)).filter(Boolean)
}
const sightRange = s => (Array.isArray(s.price) ? s.price : [s.price || 0, s.price || 0])

/* Chi phí / người: từng khoản [thấp, cao] + tổng */
function tourCost(tp) {
    const r10 = n => Math.round(n / 10000) * 10000
    const nights = tp.days - 1
    const tickets = tp.plan.flatMap(d => tourDaySights(tp, d)).map(sightRange).reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0])
    const items = [{ key: 'tickets', icon: 'ri-ticket-2-line', label: t('Vé tham quan & trải nghiệm'), range: tickets }]
    if (nights) {
        const stays = (placesOf(tp.dest)?.stays || []).filter(s => tp.stay.includes(s.type))
        const low = Math.min(...stays.map(s => s.price[0])) / 2 * nights
        const high = Math.max(...stays.map(s => s.price[1])) / 2 * nights
        items.push({ key: 'stay', icon: 'ri-hotel-bed-line', label: t('{n} đêm lưu trú (phòng đôi, chia 2 người)', { n: nights }), range: [r10(low), r10(high)] })
    }
    const saving = dailyCosts(tp.dest, 'saving')
    const comfort = dailyCosts(tp.dest, 'comfort')
    if (saving && comfort) {
        items.push({ key: 'food', icon: 'ri-restaurant-line', label: t('Ăn uống, đi lại tại chỗ'), range: [tp.days * (saving.food + saving.transport), tp.days * (comfort.food + comfort.transport)] })
    }
    const total = items.reduce((a, x) => [a[0] + x.range[0], a[1] + x.range[1]], [0, 0])
    return { items, total }
}

/* Ảnh: ảnh riêng nếu có; không thì ảnh điểm đến – các tour cùng điểm đến lần lượt dùng ảnh khác nhau */
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
        <div class="dest-card-wrap" data-tour-style="${tp.style}" data-tour-days="${tp.days}" data-tour-region="${d.region}" data-tour-months="${d.bestMonths.join(' ')}">
            <a href="${tourUrl(tp.id)}" class="dest-card pkg-card">
                <div class="dest-card__media">
                    <img data-wiki="${wikiAttr(tourImages(tp))}" data-width="960" data-sizes="(max-width: 576px) calc(100vw - 32px), (max-width: 1024px) 46vw, 360px" alt="${pickLang(tp.name)}" class="dest-card__img" loading="lazy">
                    <span class="dest-card__region pkg-style"><i class="${style.icon}"></i> ${pickLang(style.label)}</span>
                </div>
                <div class="dest-card__body">
                    <h3 class="dest-card__title">${pickLang(tp.name)}</h3>
                    <span class="dest-card__province"><i class="ri-map-pin-2-line"></i> ${d.name}</span>
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
            itemListElement: tp.plan.flatMap(d => tourDaySights(tp, d)).map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'TouristAttraction', name: pickLang(s.name) } })),
        },
    }
}

function tourStats(tp) {
    const d = getDestination(tp.dest)
    const style = tourStyle(tp)
    const stats = [
        ['ri-map-pin-2-line', t('Điểm đến'), `<a href="${destinationUrl(d.id)}">${d.name}</a>`],
        ['ri-compass-3-line', t('Phong cách'), `<i class="${style.icon}"></i> ${pickLang(style.label)}`],
        ['ri-time-line', t('Thời gian'), tourDaysText(tp)],
        ['ri-wallet-3-line', t('Chi phí ước tính / người'), priceRange(tourCost(tp).total)],
        ...(tp.stay.length ? [['ri-hotel-bed-line', t('Lưu trú'), tp.stay.map(s => pickLang(STAY_TYPES[s])).join(', ')]] : []),
    ]
    return `<dl class="trek-stats">${stats.map(([icon, label, value]) => `<div><dt><i class="${icon}"></i> ${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`
}

function tourSightHtml(s) {
    const [low, high] = sightRange(s)
    const price = !high ? t('Miễn phí') : low === high ? shortVnd(low) : priceRange([low, high])
    return `
        <li class="pkg-sight">
            <span class="pkg-sight__name">${pickLang(s.name)}</span>
            <span class="pkg-sight__meta">
                <span><i class="ri-ticket-2-line"></i> ${price}</span>
                ${s.hours ? `<span><i class="ri-time-line"></i> ${sightHours(s.hours)}</span>` : ''}
                ${s.address ? `<a href="${mapsSearchUrl(s.address)}" target="_blank" rel="noopener"><i class="ri-map-pin-line"></i> ${s.address}</a>` : ''}
            </span>
        </li>`
}

function tourPage(tp) {
    const d = getDestination(tp.dest)
    const list = items => `<ul class="guide-section__list">${items.map(x => `<li>${pickLang(x)}</li>`).join('')}</ul>`
    const { items, total } = tourCost(tp)
    const others = tourList().filter(x => x.id !== tp.id).sort((a, b) => (b.dest === tp.dest) - (a.dest === tp.dest) || (b.style === tp.style) - (a.style === tp.style)).slice(0, 3)
    const sections = [
        ['tong-quan', t('Tổng quan')],
        ['lich-trinh', t('Lịch trình từng ngày')],
        ['chi-phi', t('Chi phí ước tính')],
        ['dat-cho', t('Đặt phòng & lên kế hoạch')],
        ['mua-dep', t('Mùa đẹp')],
    ]
    return `
        <section class="planner-hero guide-hero">
            <div class="container">
                ${breadcrumbHtml([[t('Trang chủ'), homeUrl()], [t('Tour & combo'), tourHubUrl()]])}
                <span class="guide-hero__icon"><i class="${tourStyle(tp).icon}"></i></span>
                <h1 class="planner-hero__title">${pickLang(tp.name)}</h1>
                <p class="planner-hero__text">${d.name} · ${pickLang(tourStyle(tp).label)} · ${tourDaysText(tp)} · ${priceRange(total)} / ${t('người')}</p>
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
                <section class="guide-section" id="lich-trinh">
                    <h2 class="guide-section__title">${t('Lịch trình từng ngày')}</h2>
                    <ol class="trek-plan">
                        ${tp.plan.map((day, i) => `
                            <li class="trek-plan__day">
                                <h3 class="trek-plan__title">${tp.days > 1 ? `${t('Ngày {n}', { n: i + 1 })}: ` : ''}${pickLang(day.title)}</h3>
                                <p>${pickLang(day.text)}</p>
                                <ul class="pkg-sights">${tourDaySights(tp, day).map(tourSightHtml).join('')}</ul>
                            </li>
                        `).join('')}
                    </ol>
                </section>
                <section class="guide-section" id="chi-phi">
                    <h2 class="guide-section__title">${t('Chi phí ước tính')}</h2>
                    <table class="pkg-cost">
                        <caption class="visually-hidden">${t('Chi phí ước tính / người')}</caption>
                        <tbody>
                            ${items.map(x => `<tr><th scope="row"><i class="${x.icon}"></i> ${x.label}</th><td>${priceRange(x.range)}</td></tr>`).join('')}
                        </tbody>
                        <tfoot><tr><th scope="row">${t('Tổng / người')}</th><td>${priceRange(total)}</td></tr></tfoot>
                    </table>
                    <p class="budget__note">${t('Chưa gồm vé máy bay, tàu xe tới {dest} và chi tiêu cá nhân. Giá vé, giá phòng lấy từ trang điểm đến – combo phòng + vé của resort, khu vui chơi có thể rẻ hơn.', { dest: d.name })}</p>
                </section>
                <section class="guide-section" id="dat-cho">
                    <h2 class="guide-section__title">${t('Đặt phòng & lên kế hoạch')}</h2>
                    <div class="book-links">
                        ${tp.stay.length ? stayLinks(d.name, '', '', tp.days - 1).map(l => `<a href="${l.url}" class="book-link" target="_blank" rel="noopener nofollow"><i class="${l.icon}"></i> ${l.label}</a>`).join('') : ''}
                        <a href="${plannerUrl(`?p=${tp.dest}.${tp.days}`)}" class="book-link"><i class="ri-calendar-todo-line"></i> ${t('Thêm vào kế hoạch chuyến đi')}</a>
                    </div>
                    <div class="month-nav">
                        ${HUB_IDS.filter(id => id !== tp.dest).map(id => `<a href="${routeUrl(id, tp.dest)}" class="chip">${t('{from} đi {to}', { from: getDestination(id).name, to: d.name })}</a>`).join('')}
                    </div>
                    ${tp.tips && tp.tips.length ? `<h3 class="trek-subtitle">${t('Mẹo')}</h3>${list(tp.tips)}` : ''}
                </section>
                <section class="guide-section" id="mua-dep">
                    <h2 class="guide-section__title">${t('Mùa đẹp')}</h2>
                    ${trekMonths({ bestMonths: d.bestMonths })}
                </section>
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

/* Trang điểm đến: các tour ở đây */
function nearbyToursHtml(d) {
    const tours = tourList().filter(x => x.dest === d.id)
    if (!tours.length) return ''
    return `
        <div class="hub-transport">
            <h4 class="hub-transport__title"><i class="ri-suitcase-3-line"></i> ${t('Tour & combo ở đây')}</h4>
            <ul class="hub-modes">
                ${tours.map(x => `<li><a href="${tourUrl(x.id)}">${pickLang(x.name)}</a> <span>· ${tourDaysText(x)} · ${priceRange(tourCost(x).total)}</span></li>`).join('')}
            </ul>
        </div>
    `
}
