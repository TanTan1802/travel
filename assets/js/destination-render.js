/*==================== TRANG CHI TIẾT: CÁC KHỐI HTML ====================*/
/*
 * Các hàm thuần trả về chuỗi HTML – dùng chung cho trình duyệt (destination.js)
 * và script build trang tĩnh (tools/build.js).
 */
function heroSection(d) {
    return `
        <section class="dest-hero" id="top">
            <img data-wiki="${wikiAttr(heroCandidates(d))}" data-width="1920" data-priority alt="${d.name}" class="dest-hero__img">
            <div class="dest-hero__overlay"></div>

            <div class="dest-hero__content container">
                <nav class="breadcrumb" aria-label="Breadcrumb">
                    <a href="${homeUrl()}">${t('Trang chủ')}</a>
                    <i class="ri-arrow-right-s-line"></i>
                    <a href="${homeUrl(`?region=${d.region}#place`)}">${REGIONS[d.region]}</a>
                    <i class="ri-arrow-right-s-line"></i>
                    <span>${d.name}</span>
                </nav>

                <span class="dest-hero__subtitle"><i class="ri-map-pin-2-fill"></i> ${d.province}</span>
                <h1 class="dest-hero__title">${d.name}</h1>
                <p class="dest-hero__tagline">${d.tagline}</p>

                <div class="dest-hero__actions">
                    <a href="#gallery" class="button button--flex">${t('Xem hình ảnh')} <i class="ri-image-line"></i></a>
                    <a href="#food" class="button button--flex button--ghost">${t('Ẩm thực')} <i class="ri-restaurant-line"></i></a>
                    ${favoriteButton(d.id, { withLabel: true })}
                </div>
            </div>
        </section>

        <div class="container">
            <div class="dest-facts">
                ${fact('ri-star-fill', t('Đánh giá'), `${d.rating.toFixed(1)} / 5`)}
                ${fact('ri-calendar-event-line', t('Thời điểm đẹp'), d.bestTime)}
                ${fact('ri-time-line', t('Thời gian gợi ý'), d.duration)}
                ${fact('ri-compass-3-line', t('Vùng miền'), REGIONS[d.region])}
            </div>
        </div>
    `
}

function fact(icon, label, value) {
    return `
        <div class="dest-facts__item">
            <i class="${icon} dest-facts__icon"></i>
            <div>
                <span class="dest-facts__label">${label}</span>
                <span class="dest-facts__value">${value}</span>
            </div>
        </div>
    `
}

function overviewSection(d) {
    const side = d.gallery[0]
    const sideFiles = d.gallery.slice(0, 3).map(g => g.file)
    return `
        <section class="overview section" id="overview">
            <div class="overview__container container grid">
                <div class="overview__data">
                    <span class="section__subtitle">${t('Tổng quan')}</span>
                    <h2 class="section__title overview__title">${t('Vì sao nên đến {name}?', { name: d.name })}</h2>
                    <p class="overview__description">${d.description}</p>

                    <h3 class="overview__highlights-title">${t('Điểm nhấn không thể bỏ lỡ')}</h3>
                    <ul class="overview__highlights">
                        ${d.highlights.map(h => `<li><i class="ri-checkbox-circle-fill"></i> ${h}</li>`).join('')}
                    </ul>

                    <div class="dest-card__tags">
                        ${d.categories.map(c => `<span class="tag">${CATEGORIES[c]}</span>`).join('')}
                    </div>
                </div>

                ${side ? `
                <div class="overview__img">
                    <img data-wiki="${wikiAttr(sideFiles)}" data-width="960" alt="${side.caption}" loading="lazy">
                </div>` : ''}
            </div>
        </section>
    `
}

function climateSection(d) {
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    return `
        <section class="climate section" id="climate">
            <span class="section__subtitle">${t('Thời tiết')}</span>
            <h2 class="section__title">${t('Thời tiết & mùa đẹp')}</h2>

            <div class="climate__container container">
                <div class="climate__card weather weather--loading" id="weather" aria-live="polite">
                    <p class="weather__loading"><i class="ri-loader-4-line"></i> ${t('Đang tải thời tiết...')}</p>
                </div>

                <div class="climate__card season">
                    <h3 class="season__title"><i class="ri-calendar-event-line"></i> ${t('Thời điểm đẹp')}: ${d.bestTime}</h3>
                    <p class="season__hint">${t('Bấm vào một tháng để xem có nên đi không')}</p>
                    <div class="season__months" role="group" aria-label="${t('Các tháng trong năm')}">
                        ${months.map(m => {
                            const best = d.bestMonths.includes(m)
                            return `<button type="button" class="season__month${best ? ' season__month--best' : ''}" data-month="${m}" aria-pressed="false"
                                        title="${t('Tháng {m}', { m: monthLabel(m) })}${best ? ` – ${t('mùa đẹp')}` : ''}">${monthShort(m)}</button>`
                        }).join('')}
                    </div>
                    <div class="season__legend">
                        <span><i class="season__dot season__dot--best"></i> ${t('Mùa đẹp')}</span>
                        <span><i class="season__dot season__dot--current"></i> ${t('Tháng hiện tại')}</span>
                        <span><i class="season__dot season__dot--selected"></i> ${t('Tháng đang xem')}</span>
                    </div>
                    <p class="season__status" data-season-status="${d.bestMonths.join(',')}" aria-live="polite"></p>
                    <div class="season__others" id="season-others"></div>
                </div>
                ${eventsCardHtml(d)}
            </div>
        </section>
    `
}

/* Lễ hội & mùa đặc sắc của điểm đến – bấm tháng trên thanh 12 tháng để làm nổi sự kiện của tháng đó */
function eventsCardHtml(d) {
    const events = destinationEvents(d.id)
    if (!events.length) return ''
    return `
        <div class="climate__card events-card">
            <h3 class="season__title"><i class="ri-flag-2-line"></i> ${t('Lễ hội & mùa đặc sắc')}</h3>
            <ul class="events__list" id="dest-events">${events.map(e => eventCardHtml(e)).join('')}</ul>
            <p class="budget__note">${t('Lễ theo âm lịch đổi ngày dương mỗi năm – kiểm tra lịch chính thức trước khi đi.')}</p>
        </div>
    `
}

function gallerySection(d) {
    const photos = [{ file: d.hero, caption: d.name }, ...d.gallery]
    return `
        <section class="gallery section" id="gallery">
            <span class="section__subtitle">${t('Hình ảnh')}</span>
            <h2 class="section__title">${t('Vẻ đẹp {name}', { name: d.name })}</h2>

            <div class="gallery__grid container">
                ${photos.map((p, i) => `
                    <button type="button" class="gallery__item${i === 0 ? ' is-featured' : ''}" data-index="${i}" aria-label="${t('Xem ảnh')}: ${p.caption}">
                        <img data-wiki="${wikiAttr(p.file)}" data-width="960" alt="" class="gallery__img" loading="lazy">
                        <span class="gallery__caption"><i class="ri-zoom-in-line"></i> ${p.caption}</span>
                    </button>
                `).join('')}
            </div>
        </section>
    `
}

function foodSection(d) {
    return `
        <section class="food section" id="food">
            <span class="section__subtitle">${t('Ẩm thực')}</span>
            <h2 class="section__title">${t('Món ngon phải thử')}</h2>

            <div class="food__grid container">
                ${d.foods.map(foodCard).join('')}
            </div>
            ${eatsBlock(d)}
        </section>
    `
}

/* Quán cụ thể nên ghé (dữ liệu PLACES) */
function eatCard(e, d) {
    return `
        <li class="eat">
            <div class="eat__head">
                <h4 class="eat__name">${e.name}</h4>
                <span class="eat__price">${priceRange(e.price)}</span>
            </div>
            <p class="eat__dish">${pickLang(e.dish)}</p>
            <a href="${mapsSearchUrl(`${e.name}, ${e.address}`)}" target="_blank" rel="noopener" class="eat__address">
                <i class="ri-map-pin-2-line"></i> ${e.address}
            </a>
            ${reportLinkHtml({ dest: d.name, item: e.name, details: `${e.address} · ${priceRange(e.price)}` })}
        </li>
    `
}

/* Hiện trước 4 quán, phần còn lại mở khi cần để trang không quá dài */
const EATS_VISIBLE = 4

function eatsBlock(d) {
    const places = placesOf(d.id)
    if (!places) return ''
    return `
        <div class="eats container">
            <h3 class="eats__title"><i class="ri-restaurant-2-line"></i> ${t('Quán nên ghé ở {name}', { name: d.name })}</h3>
            <ul class="eats__list">${places.eats.slice(0, EATS_VISIBLE).map(e => eatCard(e, d)).join('')}</ul>
            ${places.eats.length > EATS_VISIBLE ? `
                <details class="eats__more">
                    <summary class="button button--ghost button--flex">${t('Xem thêm {n} quán', { n: places.eats.length - EATS_VISIBLE })} <i class="ri-arrow-down-s-line"></i></summary>
                    <ul class="eats__list">${places.eats.slice(EATS_VISIBLE).map(e => eatCard(e, d)).join('')}</ul>
                </details>
            ` : ''}
            <p class="budget__note">${t('Giá tham khảo mỗi người. Bấm địa chỉ để mở Google Maps xem giờ mở cửa và đánh giá mới nhất.')}</p>
        </div>
    `
}

/* Nên ở khu nào + đặt phòng + cách đi tới */
function stayCard(s, city) {
    return `
        <article class="stay-card">
            <span class="stay-card__type stay-card__type--${s.type}">${pickLang(STAY_TYPES[s.type])}</span>
            <h4 class="stay-card__area">${pickLang(s.area)}</h4>
            <p class="stay-card__price">${priceRange(s.price)} <small>/ ${t('đêm')}</small></p>
            <p class="stay-card__note">${pickLang(s.note)}</p>
            <div class="book-links">${linkButtons(stayLinks(city, pickLang(s.area)))}</div>
        </article>
    `
}

function staySection(d) {
    const places = placesOf(d.id)
    if (!places) return ''
    const travel = [
        places.airport ? { label: t('Vé máy bay tới {code}', { code: places.airport }), icon: 'ri-plane-line', url: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights to ${places.airport}`)}` } : null,
        places.rail ? { label: t('Vé tàu (ga {station})', { station: places.rail }), icon: 'ri-train-line', url: 'https://dsvn.vn/' } : null,
        { label: t('Vé xe khách / limousine'), icon: 'ri-bus-2-line', url: 'https://vexere.com/' },
    ].filter(Boolean)
    return `
        <section class="stay section" id="stay">
            <span class="section__subtitle">${t('Lưu trú & đi lại')}</span>
            <h2 class="section__title">${t('Ở đâu khi đến {name}', { name: d.name })}</h2>

            <div class="stay__container container">
                <div class="stay__grid">${places.stays.map(s => stayCard(s, places.city)).join('')}</div>

                <div class="getthere">
                    <h3 class="getthere__title"><i class="ri-map-2-line"></i> ${t('Cách đi tới {name}', { name: d.name })}</h3>
                    <p>${pickLang(places.getThere)}</p>
                    <div class="book-links">${linkButtons(travel)}</div>
                </div>
                <p class="budget__note">${t('Giá phòng tham khảo cho 2 người/đêm, cao hơn vào lễ Tết và cuối tuần. Việt Travel không nhận hoa hồng từ các trang đặt chỗ.')}</p>
            </div>
        </section>
    `
}

function foodCard(f) {
    /* Thẻ chữ kiểu thực đơn nằm dưới ảnh: hiện ra khi món chưa có ảnh hoặc ảnh tải lỗi */
    return `
        <article class="food-card">
            <div class="food-card__media">
                <span class="food-card__menu"><small>${t('Đặc sản')}</small>${f.name}</span>
                ${f.file ? `<img data-wiki="${wikiAttr(f.file)}" data-width="960" alt="${f.name}" class="food-card__img" loading="lazy">` : ''}
                ${f.illustrative ? `<span class="food-card__badge" title="${f.illustrative}">${t('Ảnh minh họa')}</span>` : ''}
                <span class="food-card__price">${f.price}</span>
            </div>
            <div class="food-card__body">
                <h3 class="food-card__title">${f.name}</h3>
                <p class="food-card__desc">${f.desc}</p>
                ${f.illustrative ? `<span class="food-card__note"><i class="ri-information-line"></i> ${t('Ảnh minh họa')}: ${f.illustrative}</span>` : ''}
            </div>
        </article>
    `
}

function activitiesSection(d) {
    return `
        <section class="activities section" id="activities">
            <span class="section__subtitle">${t('Vui chơi')}</span>
            <h2 class="section__title">${t('Trải nghiệm đáng nhớ')}</h2>

            <div class="activities__grid container">
                ${d.activities.map(a => `
                    <article class="activity-card">
                        <span class="activity-card__icon"><i class="${a.icon}"></i></span>
                        <h3 class="activity-card__title">${a.title}</h3>
                        <p class="activity-card__desc">${a.desc}</p>
                    </article>
                `).join('')}
            </div>

            ${d.tips.length ? `
            <div class="tips container">
                <h3 class="tips__title"><i class="ri-lightbulb-flash-line"></i> ${t('Kinh nghiệm du lịch')}</h3>
                <ul class="tips__list">
                    ${d.tips.map(t => `<li class="tip-item">${t}</li>`).join('')}
                </ul>
            </div>` : ''}

            <div class="packing-block container" id="packing" data-dest="${d.id}">
                <h3 class="tips__title"><i class="ri-luggage-cart-line"></i> <span data-packing-title>${t('Đồ cần mang')}</span></h3>
                <p class="packing-block__hint">${t('Tự gợi ý theo điểm đến và tháng đi (chọn ngày khởi hành ở phần Lịch trình để đổi tháng). Đánh dấu để ghi nhớ món đã chuẩn bị.')}</p>
                <div data-packing-slot></div>
            </div>

            <p class="report-page container">
                <i class="ri-feedback-line"></i> ${t('Thấy giá vé, giờ mở cửa hay quán đã thay đổi?')}
                ${reportLinkHtml({ dest: d.name, item: t('Thông tin chung') })}
            </p>
        </section>
    `
}

const tourLabel = n => t('{n} ngày {m} đêm', { n, m: n - 1 })

/*
 * Công cụ của một ngày: lộ trình trên Google Maps (luôn có) + ngày, dự báo thời tiết và link
 * Google Calendar (hiện khi người dùng chọn ngày khởi hành – điền bởi destination.js).
 */
function dayToolsHtml(d, dayIndex) {
    const route = dayRouteUrl(d.id, dayIndex)
    return `
        <div class="day-tools" data-day-offset="${dayIndex}">
            <span class="day-tools__date" data-day-date hidden></span>
            <span class="day-tools__forecast" data-forecast-dest="${d.id}"></span>
            <span class="day-tools__links">
                ${route ? `<a href="${route}" target="_blank" rel="noopener" class="day-tools__link"><i class="ri-route-line"></i> ${t('Lộ trình trên Google Maps')}</a>` : ''}
                <a href="#" target="_blank" rel="noopener" class="day-tools__link" data-gcal hidden><i class="ri-calendar-event-line"></i> ${t('Thêm ngày này vào Google Calendar')}</a>
            </span>
        </div>
    `
}

function tourDaysHtml(d, plan, n) {
    const days = plan.days.slice(0, n)
    return `
        <div class="itinerary__tabs" role="tablist" aria-label="${t('Chọn ngày')}">
            ${days.map((day, i) => `
                <button type="button" class="itinerary__tab${i === 0 ? ' itinerary__tab--active' : ''}" role="tab"
                        id="tour${n}-tab-${i}" aria-controls="tour${n}-panel-${i}" aria-selected="${i === 0}" data-day="${i}">
                    <span>${t('Ngày {n}', { n: i + 1 })}</span>
                    <small>${day.title}</small>
                </button>
            `).join('')}
        </div>

        ${days.map((day, i) => `
            <div class="itinerary__panel" role="tabpanel" id="tour${n}-panel-${i}" aria-labelledby="tour${n}-tab-${i}"${i === 0 ? '' : ' hidden'}>
                <h3 class="itinerary__day-title">${t('Ngày {n}', { n: i + 1 })}: ${day.title}</h3>
                ${dayToolsHtml(d, i)}
                ${dayTimelineHtml(dayTimeline(d.id, i, day, { last: i === n - 1 }))}
            </div>
        `).join('')}
    `
}

/* Chi phí tour: hai mức chọn được, mỗi mức có bảng chi tiết từng khoản */
const BUDGET_TIERS = [
    { tier: 'saving', label: () => t('Tiết kiệm'), desc: () => t('Homestay, ăn quán địa phương, xe máy') },
    { tier: 'comfort', label: () => t('Thoải mái'), desc: () => t('Khách sạn 3–4 sao, nhà hàng, Grab') },
]

function budgetBlock(d, n) {
    const costs = Object.fromEntries(BUDGET_TIERS.map(({ tier }) => [tier, tripCost(d.id, n, tier)]))
    return `
        <div class="budget">
            <h3 class="budget__title"><i class="ri-wallet-3-line"></i> ${t('Chi phí ước tính / người')} – ${tourLabel(n)}</h3>
            <div class="budget__options" role="group" aria-label="${t('Mức chi tiêu')}">
                ${BUDGET_TIERS.map(({ tier, label, desc }, i) => `
                    <button type="button" class="budget__option${i === 0 ? ' budget__option--active' : ''}" data-budget-tier="${tier}" aria-pressed="${i === 0}">
                        <span>${label()}</span>
                        <strong>${formatVnd(costs[tier].total)}</strong>
                        <small>${desc()}</small>
                        <em class="budget__more">${t('Xem chi tiết')} <i class="ri-arrow-down-s-line"></i></em>
                    </button>
                `).join('')}
            </div>
            ${BUDGET_TIERS.map(({ tier, label }, i) => `
                <div class="budget__detail" data-budget-detail="${tier}"${i === 0 ? '' : ' hidden'}>
                    <p class="budget__detail-title">${t('Chi tiết mức {tier}', { tier: label().toLowerCase() })}</p>
                    ${costBreakdownHtml(costs[tier])}
                </div>
            `).join('')}
        </div>
    `
}

function itinerarySection(d) {
    const plan = typeof ITINERARIES !== 'undefined' && ITINERARIES[d.id]
    if (!plan) return ''
    const lengths = (typeof TOUR_LENGTHS !== 'undefined' ? TOUR_LENGTHS : [plan.days.length])
        .filter(n => n <= plan.days.length)

    return `
        <section class="itinerary section" id="itinerary">
            <span class="section__subtitle">${t('Lịch trình tour')}</span>
            <h2 class="section__title">${t('Lịch trình tour {name}', { name: d.name })}</h2>

            <div class="itinerary__container container">
                <div class="print-only print-header">
                    <strong>${t('Lịch trình tour {name}', { name: d.name })}</strong>
                    <p>Việt Travel · ${d.province} · ${t('Thời điểm đẹp')}: ${d.bestTime}</p>
                    <p class="print-url"></p>
                </div>
                <div class="trip-date">
                    <label class="trip-date__label" for="tour-start"><i class="ri-calendar-event-line"></i> ${t('Ngày khởi hành')}</label>
                    <input type="date" id="tour-start" class="planner__select trip-date__input">
                    <small class="trip-date__hint">${t('Chọn ngày để xem dự báo thời tiết từng ngày và thêm lịch trình vào lịch của bạn.')}</small>
                    <ul class="trip-alerts events__list" id="tour-alerts" hidden></ul>
                </div>

                <div class="tour-picker" role="tablist" aria-label="${t('Chọn tour')}">
                    ${lengths.map((n, i) => `
                        <button type="button" class="tour-picker__btn${i === 0 ? ' tour-picker__btn--active' : ''}" role="tab"
                                aria-selected="${i === 0}" aria-controls="tour-${n}" data-tour="${n}">
                            <strong>${tourLabel(n)}</strong>
                            <small>${t('từ {price}', { price: formatVnd(tripCost(d.id, n, 'saving').total) })}</small>
                        </button>
                    `).join('')}
                </div>

                ${lengths.map((n, i) => `
                    <div class="tour" id="tour-${n}" data-tour="${n}"${i === 0 ? '' : ' hidden'}>
                        <div class="tour__toolbar">
                            <p class="tour__summary"><i class="ri-route-line"></i> ${tourLabel(n)} · ${plan.days.slice(0, n).map(day => day.title).join(' → ')}</p>
                            <div class="tour__buttons">
                                <button type="button" class="tour__expand" data-expanded="false">
                                    <i class="ri-list-check-2"></i> <span>${t('Xem tất cả các ngày')}</span>
                                </button>
                                <button type="button" class="tour__expand" data-tour-action="print" aria-label="${t('In lịch trình {tour}', { tour: tourLabel(n) })}">
                                    <i class="ri-printer-line"></i> <span>${t('In / PDF')}</span>
                                </button>
                                <button type="button" class="tour__expand" data-tour-action="ics" aria-label="${t('Thêm lịch trình {tour} vào lịch (.ics)', { tour: tourLabel(n) })}">
                                    <i class="ri-calendar-2-line"></i> <span>${t('Thêm vào lịch')}</span>
                                </button>
                                <button type="button" class="tour__expand" data-tour-action="share" aria-label="${t('Chia sẻ lịch trình')}">
                                    <i class="ri-share-line"></i> <span>${t('Chia sẻ')}</span>
                                </button>
                            </div>
                        </div>

                        ${tourDaysHtml(d, plan, n)}

                        ${budgetBlock(d, n)}
                    </div>
                `).join('')}

                <p class="budget__note">${t('Chưa gồm vé máy bay/tàu xe tới {name}. Giá tham khảo, thay đổi theo mùa.', { name: d.name })}</p>

                <div class="plan-cta">
                    <p><i class="ri-route-line"></i> ${t('Muốn đi nhiều nơi trong một chuyến? Ghép {name} với các điểm đến khác.', { name: d.name })}</p>
                    <button type="button" class="button button--flex plan-btn" data-plan-add="${d.id}">
                        <i class="ri-add-circle-line"></i> <span class="plan-btn__label">${t('Thêm vào kế hoạch chuyến đi')}</span>
                    </button>
                </div>
            </div>
        </section>
    `
}

function locationSection(d) {
    const nearby = nearestDestinations(d, 3)
    return `
        <section class="location section" id="location">
            <span class="section__subtitle">${t('Vị trí')}</span>
            <h2 class="section__title">${t('Bản đồ & điểm lân cận')}</h2>

            <div class="location__container container">
                <div class="location__map" id="dest-map" role="region" aria-label="${t('Bản đồ')} ${d.name}"></div>

                <div class="location__side">
                    <h3 class="location__title">${t('Gần {name}', { name: d.name })}</h3>
                    <ul class="location__nearby">
                        ${nearby.map(({ d: n, km }) => `
                            <li>
                                <a href="${destinationUrl(n.id)}" class="nearby-item">
                                    <span class="nearby-item__media">
                                        <img data-wiki="${wikiAttr(heroCandidates(n))}" data-width="500" alt="${n.name}" loading="lazy">
                                    </span>
                                    <span class="nearby-item__body">
                                        <strong>${n.name}</strong>
                                        <small>${n.province}</small>
                                    </span>
                                    <span class="nearby-item__distance">~${Math.round(km)} km</span>
                                </a>
                            </li>
                        `).join('')}
                    </ul>
                    <a href="https://www.google.com/maps/dir/?api=1&amp;destination=${d.lat},${d.lng}" target="_blank" rel="noopener" class="button button--flex location__directions">
                        <i class="ri-direction-line"></i> ${t('Chỉ đường Google Maps')}
                    </a>
                </div>
            </div>
        </section>
    `
}

function commentsSection(d) {
    if (typeof giscusEnabled === 'undefined' || !giscusEnabled()) return ''
    return `
        <section class="comments section" id="comments">
            <span class="section__subtitle">${t('Cộng đồng')}</span>
            <h2 class="section__title">${t('Chia sẻ trải nghiệm của bạn')}</h2>
            <div class="comments__container container">
                <p class="comments__intro">${t('Bạn đã đến {name}? Hãy để lại cảm nhận, mẹo hay câu hỏi cho mọi người nhé!', { name: d.name })}</p>
                <div class="giscus" id="giscus" data-term="${d.id}"></div>
            </div>
        </section>
    `
}

function relatedSection(d) {
    /* Các điểm đến cùng vùng, bỏ qua những điểm đã có trong "lân cận" */
    const nearbyIds = nearestDestinations(d, 3).map(n => n.d.id)
    const related = DESTINATIONS
        .filter(x => x.region === d.region && x.id !== d.id && !nearbyIds.includes(x.id))
        .slice(0, 3)
    if (!related.length) return ''
    return `
        <section class="related section" id="related">
            <span class="section__subtitle">${t('Gợi ý')}</span>
            <h2 class="section__title">${t('Điểm đến khác ở {region}', { region: REGIONS[d.region] })}</h2>

            <div class="dest__grid container">
                ${related.map(x => destinationCard(x)).join('')}
            </div>

            <div class="related__more">
                <a href="${homeUrl('#place')}" class="button button--flex">${t('Xem tất cả điểm đến')} <i class="ri-arrow-right-line"></i></a>
            </div>
        </section>
    `
}

function notFoundSection() {
    return `
        <section class="dest-notfound section">
            <div class="container">
                <i class="ri-map-pin-line dest-notfound__icon"></i>
                <h1 class="section__title">${t('Không tìm thấy điểm đến')}</h1>
                <p>${t('Điểm đến bạn tìm không tồn tại hoặc đã bị đổi tên.')}</p>
                <a href="${homeUrl('#place')}" class="button">${t('Quay lại danh sách điểm đến')}</a>
            </div>
        </section>
    `
}

/* Toàn bộ nội dung trang của một điểm đến */
function renderDestinationPage(d) {
    return [
        heroSection(d),
        overviewSection(d),
        climateSection(d),
        gallerySection(d),
        foodSection(d),
        activitiesSection(d),
        staySection(d),
        itinerarySection(d),
        locationSection(d),
        commentsSection(d),
        relatedSection(d),
    ].join('')
}
