/*==================== TRANG KHÁM PHÁ (SEO): GIÁ VÉ, THEO THÁNG, THEO CHỦ ĐỀ ====================*/
/*
 * Chỉ dùng khi build trang tĩnh (tools/build.js) – trình duyệt không cần file này.
 * - diem-den/<id>/gia-ve/   : bảng giá vé + giờ mở cửa mọi điểm tham quan của một điểm đến (mỗi điểm có anchor riêng)
 * - thang/<1..12>/          : tháng N nên đi đâu (điểm đến đúng mùa, lễ hội, lưu ý thời tiết)
 * - chu-de/<chủ đề | miền>/ : điểm đến theo loại hình (biển, núi…) hoặc theo miền
 * Nội dung lấy từ dữ liệu sẵn có (destinations, itineraries, sights, events) nên tự cập nhật khi dữ liệu đổi.
 */
const PRICES_DIR = 'gia-ve'
const MONTH_DIR = 'thang'
const THEME_DIR = 'chu-de'

const REGION_SLUGS = { bac: 'mien-bac', trung: 'mien-trung', nam: 'mien-nam' }

const pricesUrl = id => `${SITE_ROOT}${LANG_PREFIX}diem-den/${id}/${PRICES_DIR}/index.html`
const monthUrl = m => `${SITE_ROOT}${LANG_PREFIX}${MONTH_DIR}/${m}/index.html`
const themeUrl = slug => `${SITE_ROOT}${LANG_PREFIX}${THEME_DIR}/${slug}/index.html`

/* Mã anchor không dấu: "Hang Sửng Sốt" → "hang-sung-sot" */
function slugify(text) {
    return text.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function breadcrumbHtml(items) {
    return `
        <nav class="breadcrumb" aria-label="Breadcrumb">
            ${items.map(([label, url]) => `<a href="${url}">${label}</a>`).join('<i class="ri-arrow-right-s-line"></i>')}
        </nav>
    `
}

/* Dữ liệu cấu trúc BreadcrumbList (url tuyệt đối do build truyền vào) */
function breadcrumbJsonLd(items) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })),
    }
}

/*---------- Giá vé & giờ mở cửa ----------*/
/* Danh sách điểm tham quan theo ngày lịch trình, mỗi điểm một lần (trùng tên → giữ lần đầu) */
function destinationSights(id) {
    const days = (typeof SIGHTS !== 'undefined' && SIGHTS[id]) || []
    const plan = (typeof ITINERARIES !== 'undefined' && ITINERARIES[id]) || { days: [] }
    const seen = new Set()
    return days.map((list, i) => ({
        title: plan.days[i] ? plan.days[i].title : '',
        sights: list.filter(s => !seen.has(s.name[0]) && seen.add(s.name[0])).map(s => ({ ...s, anchor: slugify(s.name[0]) })),
    })).filter(day => day.sights.length)
}

function pricesSummary(groups) {
    const all = groups.flatMap(g => g.sights)
    const bounds = all.map(s => priceBounds(s.price))
    const free = bounds.filter(([, hi]) => !hi).length
    const paid = bounds.filter(([, hi]) => hi)
    const low = paid.length ? Math.min(...paid.map(([lo, hi]) => lo || hi)) : 0
    const high = paid.length ? Math.max(...paid.map(([, hi]) => hi)) : 0
    return { count: all.length, free, low, high }
}

function pricesPage(d) {
    const groups = destinationSights(d.id)
    const sum = pricesSummary(groups)
    return `
        <section class="planner-hero guide-hero">
            <div class="container">
                ${breadcrumbHtml([[t('Trang chủ'), homeUrl()], [d.name, destinationUrl(d.id)]])}
                <span class="guide-hero__icon"><i class="ri-ticket-2-line"></i></span>
                <h1 class="planner-hero__title">${t('Giá vé tham quan {name} & giờ mở cửa', { name: d.name })}</h1>
                <p class="planner-hero__text">${t('{count} điểm tham quan theo lịch trình gợi ý, có giá vé, giờ mở cửa, địa chỉ và quán nước gần đó.', { count: sum.count })}</p>
            </div>
        </section>

        <div class="guide container">
            <aside class="guide__toc">
                <strong>${t('Nội dung')}</strong>
                <ol>${groups.map((g, i) => `<li><a href="#ngay-${i + 1}">${t('Ngày {n}', { n: i + 1 })}: ${g.title}</a></li>`).join('')}</ol>
            </aside>
            <article class="guide__body">
                <section class="guide-section">
                    <ul class="guide-section__list">
                        <li>${t('{count} điểm tham quan, {free} điểm miễn phí.', { count: sum.count, free: sum.free })}</li>
                        ${sum.high ? `<li>${t('Vé có phí từ {low} đến {high} mỗi người.', { low: formatVnd(sum.low), high: formatVnd(sum.high) })}</li>` : ''}
                        <li>${t('Thời điểm đẹp: {time}.', { time: d.bestTime })}</li>
                    </ul>
                </section>
                ${groups.map((g, i) => `
                    <section class="guide-section" id="ngay-${i + 1}">
                        <h2 class="guide-section__title">${t('Ngày {n}', { n: i + 1 })}: ${g.title}</h2>
                        <ul class="day-tl__sights">
                            ${g.sights.map(s => sightHtml({ ...s, dest: d.name }, { id: s.anchor })).join('')}
                        </ul>
                    </section>
                `).join('')}
                <p class="budget__note">${t('Giá tham khảo cho người lớn, có thể thay đổi theo mùa – hãy kiểm tra tại quầy vé hoặc trang chính thức. Thấy thông tin sai? Bấm "Báo sai" ở từng điểm.')}</p>
                <p><a href="${destinationUrl(d.id)}#itinerary" class="button button--flex">${t('Xem lịch trình {name}', { name: d.name })} <i class="ri-arrow-right-line"></i></a></p>
            </article>
        </div>

        <section class="section">
            <h2 class="section__title">${t('Điểm đến gần {name}', { name: d.name })}</h2>
            <div class="dest__grid container">${nearestDestinations(d, 3).map(x => destinationCard(x.d)).join('')}</div>
        </section>
    `
}

/* ItemList các điểm tham quan cho schema.org */
function pricesJsonLd(d, pageUrl) {
    const items = destinationSights(d.id).flatMap(g => g.sights)
    return {
        '@type': 'ItemList',
        name: t('Giá vé tham quan {name} & giờ mở cửa', { name: d.name }),
        itemListElement: items.map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
                '@type': 'TouristAttraction',
                name: pickLang(s.name),
                url: `${pageUrl}#${s.anchor}`,
                address: { '@type': 'PostalAddress', streetAddress: s.address, addressRegion: d.province, addressCountry: 'VN' },
                isAccessibleForFree: !priceBounds(s.price)[1],
            },
        })),
    }
}

/*---------- Theo tháng ----------*/
/* Nhận xét chung về thời tiết từng tháng (bổ sung cho danh sách tự sinh) */
const MONTH_NOTES = {
    1: ['Miền Bắc lạnh và khô, vùng núi có thể có băng giá; miền Nam vào mùa khô nắng đẹp. Tết Nguyên Đán thường rơi vào cuối tháng 1 hoặc tháng 2.',
        'The north is cold and dry, with possible frost in the mountains; the south is in its sunny dry season. Tết usually falls in late January or February.'],
    2: ['Miền Bắc mưa phùn, se lạnh và vào mùa lễ hội đầu xuân; miền Nam khô ráo, nắng nhẹ.',
        'The north has drizzle, cool air and spring festivals; the south is dry with gentle sunshine.'],
    3: ['Miền Bắc ấm dần, hoa ban nở ở Tây Bắc; miền Trung bắt đầu nắng ráo; miền Nam nóng và khô.',
        'The north warms up and bauhinia blooms in the northwest; central Vietnam turns sunny; the south is hot and dry.'],
    4: ['Một trong những tháng dễ chịu nhất cả nước; biển miền Trung bắt đầu vào mùa đẹp. Dịp 30/4 – 1/5 rất đông khách.',
        'One of the most pleasant months nationwide; central beaches enter their best season. The 30 April – 1 May holiday is very busy.'],
    5: ['Biển miền Trung trong xanh, ít mưa; miền Bắc bắt đầu nóng; miền Nam và Tây Nguyên chớm mùa mưa.',
        'Central beaches are clear and dry; the north heats up; the south and Central Highlands enter the rainy season.'],
    6: ['Cao điểm hè: biển miền Bắc và miền Trung đông vui; miền Nam, Tây Nguyên, Phú Quốc có mưa rào chiều.',
        'Peak summer: northern and central beaches are lively; the south, Central Highlands and Phu Quoc get afternoon showers.'],
    7: ['Miền Bắc nóng, có thể có mưa bão; biển miền Trung vẫn nắng đẹp; miền Nam mưa rào ngắn.',
        'The north is hot with possible storms; central beaches stay sunny; the south has short showers.'],
    8: ['Miền Bắc vào mùa mưa bão; miền Trung còn nắng; cuối tháng lúa bắt đầu chín ở vùng cao Tây Bắc.',
        'The north is in storm season; central Vietnam is still sunny; rice terraces in the northwest start to ripen late in the month.'],
    9: ['Mùa lúa chín vàng ở Mù Cang Chải, Hoàng Su Phì; dịp Quốc khánh 2/9 đông khách; cuối tháng miền Trung bắt đầu mưa.',
        'Golden rice season in Mu Cang Chai and Hoang Su Phi; the 2 September holiday is busy; rains reach central Vietnam late in the month.'],
    10: ['Hà Nội vào thu mát mẻ; miền Trung mưa lớn, có thể ngập lụt; miền Tây vào mùa nước nổi.',
        'Hanoi has its mild autumn; central Vietnam gets heavy rain and possible floods; the Mekong Delta is in its flood season.'],
    11: ['Miền Bắc se lạnh, hoa tam giác mạch nở ở Hà Giang; miền Trung còn mưa; miền Nam và Phú Quốc bắt đầu mùa khô.',
        'The north is cool and buckwheat flowers bloom in Ha Giang; central Vietnam is still rainy; the south and Phu Quoc start their dry season.'],
    12: ['Miền Bắc lạnh, vùng núi cao có thể có băng tuyết; miền Nam và các đảo phía Nam khô ráo, nắng đẹp – mùa du lịch biển phía Nam.',
        'The north is cold with possible frost on high peaks; the south and southern islands are dry and sunny – beach season in the south.'],
}

const monthDestinations = m => DESTINATIONS.filter(d => d.bestMonths.includes(m)).sort((a, b) => b.rating - a.rating)
const monthEvents = m => EVENTS.filter(e => eventInMonth(e, m)).sort((a, b) => eventMonths(a)[0] - eventMonths(b)[0])

function monthTitle(m) {
    return t('Tháng {m} nên đi du lịch đâu? {count} điểm đến đẹp nhất', { m: monthLabel(m), count: monthDestinations(m).length })
}

function monthPage(m) {
    const picks = monthDestinations(m)
    const events = monthEvents(m)
    const prev = m === 1 ? 12 : m - 1
    const next = m === 12 ? 1 : m + 1
    const byRegion = Object.keys(REGIONS).map(r => [r, picks.filter(d => d.region === r)]).filter(([, list]) => list.length)
    return `
        <section class="planner-hero guide-hero">
            <div class="container">
                ${breadcrumbHtml([[t('Trang chủ'), homeUrl()], [t('Đi đâu theo tháng'), monthUrl(1)]])}
                <span class="guide-hero__icon"><i class="ri-calendar-event-line"></i></span>
                <h1 class="planner-hero__title">${monthTitle(m)}</h1>
                <p class="planner-hero__text">${pickLang(MONTH_NOTES[m])}</p>
            </div>
        </section>

        <nav class="month-nav container" aria-label="${t('Chọn tháng')}">
            ${Array.from({ length: 12 }, (_, i) => i + 1).map(x => `<a href="${monthUrl(x)}" class="chip${x === m ? ' chip--active' : ''}"${x === m ? ' aria-current="page"' : ''}>${monthShort(x)}</a>`).join('')}
        </nav>

        <div class="guide container">
            <aside class="guide__toc">
                <strong>${t('Theo miền')}</strong>
                <ol>${byRegion.map(([r, list]) => `<li><a href="#${REGION_SLUGS[r]}">${REGIONS[r]} (${list.length})</a></li>`).join('')}${events.length ? `<li><a href="#le-hoi">${t('Lễ hội & lưu ý')}</a></li>` : ''}</ol>
            </aside>
            <article class="guide__body">
                ${byRegion.map(([r, list]) => `
                    <section class="guide-section" id="${REGION_SLUGS[r]}">
                        <h2 class="guide-section__title">${REGIONS[r]}</h2>
                        <ul class="guide-section__list">
                            ${list.map(d => `<li><a href="${destinationUrl(d.id)}"><strong>${d.name}</strong></a> (${d.province}) – ${d.tagline}. ${t('Thời điểm đẹp: {time}.', { time: d.bestTime })}</li>`).join('')}
                        </ul>
                    </section>
                `).join('')}
                ${events.length ? `
                    <section class="guide-section" id="le-hoi">
                        <h2 class="guide-section__title">${t('Lễ hội & lưu ý trong tháng {m}', { m: monthLabel(m) })}</h2>
                        <ul class="events__list">${events.map(e => eventCardHtml(e, { destName: e.where === 'all' ? '' : e.where.map(id => getDestination(id)?.name).filter(Boolean).join(', ') })).join('')}</ul>
                    </section>
                ` : ''}
                <p class="month-nav__prevnext">
                    <a href="${monthUrl(prev)}"><i class="ri-arrow-left-line"></i> ${t('Tháng {m}', { m: monthLabel(prev) })}</a>
                    <a href="${monthUrl(next)}">${t('Tháng {m}', { m: monthLabel(next) })} <i class="ri-arrow-right-line"></i></a>
                </p>
            </article>
        </div>

        <section class="section">
            <h2 class="section__title">${t('Điểm đến đẹp nhất tháng {m}', { m: monthLabel(m) })}</h2>
            <div class="dest__grid container">${picks.map(d => destinationCard(d)).join('')}</div>
        </section>
    `
}

/*---------- Theo chủ đề / theo miền ----------*/
const THEME_INTROS = {
    bien: ['Hơn 3.000 km bờ biển cho Việt Nam những vịnh đá vôi, bãi cát trắng và hòn đảo hoang sơ – từ vịnh Hạ Long phía Bắc đến Phú Quốc phía Nam.',
        'Over 3,000 km of coastline give Vietnam limestone bays, white-sand beaches and unspoilt islands – from Ha Long Bay in the north to Phu Quoc in the south.'],
    nui: ['Ruộng bậc thang, đèo cao, bản làng dân tộc và khí hậu mát lạnh – những vùng núi Việt Nam hợp với người thích trekking, săn mây và khám phá văn hóa.',
        'Rice terraces, high passes, ethnic villages and cool air – Vietnam\'s mountains suit travellers who love trekking, cloud-hunting and culture.'],
    'di-san': ['Kinh thành, phố cổ, thánh địa và kỳ quan thiên nhiên được UNESCO công nhận – nơi lịch sử và cảnh quan Việt Nam được gìn giữ rõ nét nhất.',
        'Citadels, old towns, sanctuaries and natural wonders recognised by UNESCO – where Vietnam\'s history and landscapes are best preserved.'],
    'thanh-pho': ['Ẩm thực đường phố, kiến trúc thuộc địa, cà phê và nhịp sống sôi động – các thành phố Việt Nam là điểm khởi đầu lý tưởng cho mọi hành trình.',
        'Street food, colonial architecture, coffee culture and a buzzing pace of life – Vietnam\'s cities are the ideal starting point for any trip.'],
    'hang-dong': ['Những hệ thống hang động lớn và đẹp bậc nhất thế giới, cùng sông ngầm và rừng nguyên sinh bao quanh.',
        'Some of the largest and most beautiful cave systems in the world, surrounded by underground rivers and primary forest.'],
    bac: ['Núi non hùng vĩ, vịnh biển kỳ vĩ và thủ đô ngàn năm văn hiến; bốn mùa rõ rệt – mùa thu (tháng 9–11) và mùa xuân (tháng 3–4) là đẹp nhất.',
        'Majestic mountains, a spectacular bay and a thousand-year-old capital; four distinct seasons – autumn (Sep–Nov) and spring (Mar–Apr) are the best.'],
    trung: ['Cố đô, phố cổ, di sản và những bãi biển đẹp nhất nước; mùa khô từ tháng 2 đến tháng 8, mùa mưa bão từ tháng 9 đến tháng 12.',
        'An imperial capital, old towns, heritage sites and the country\'s finest beaches; dry from February to August, rainy and stormy from September to December.'],
    nam: ['Sài Gòn sôi động, miền Tây sông nước và các đảo phía Nam; nắng ấm quanh năm, mùa khô từ tháng 11 đến tháng 4.',
        'Lively Saigon, the Mekong Delta waterways and southern islands; warm all year, with a dry season from November to April.'],
}

/* Danh sách chủ đề: loại hình (CATEGORIES) + miền (REGIONS) */
function themeList() {
    return [
        ...Object.keys(CATEGORIES).map(key => ({ slug: key, key, kind: 'category', label: CATEGORIES[key] })),
        ...Object.keys(REGIONS).map(key => ({ slug: REGION_SLUGS[key], key, kind: 'region', label: REGIONS[key] })),
    ]
}

const themeDestinations = theme => DESTINATIONS
    .filter(d => (theme.kind === 'region' ? d.region === theme.key : d.categories.includes(theme.key)))
    .sort((a, b) => b.rating - a.rating)

function themeTitle(theme) {
    const count = themeDestinations(theme).length
    return theme.kind === 'region'
        ? t('Du lịch {label}: {count} điểm đến nên đi', { label: theme.label, count })
        : t('Du lịch {label} Việt Nam: {count} điểm đến nên đi', { label: theme.label.toLowerCase(), count })
}

function themePage(theme) {
    const picks = themeDestinations(theme)
    return `
        <section class="planner-hero guide-hero">
            <div class="container">
                ${breadcrumbHtml([[t('Trang chủ'), homeUrl()], [t('Chủ đề'), themeUrl(themeList()[0].slug)]])}
                <span class="guide-hero__icon"><i class="${theme.kind === 'region' ? 'ri-map-2-line' : 'ri-compass-3-line'}"></i></span>
                <h1 class="planner-hero__title">${themeTitle(theme)}</h1>
                <p class="planner-hero__text">${pickLang(THEME_INTROS[theme.key])}</p>
            </div>
        </section>

        <nav class="month-nav container" aria-label="${t('Chủ đề')}">
            ${themeList().map(x => `<a href="${themeUrl(x.slug)}" class="chip${x.slug === theme.slug ? ' chip--active' : ''}"${x.slug === theme.slug ? ' aria-current="page"' : ''}>${x.label}</a>`).join('')}
        </nav>

        <div class="guide container">
            <article class="guide__body">
                <section class="guide-section">
                    <ul class="guide-section__list">
                        ${picks.map(d => `<li><a href="${destinationUrl(d.id)}"><strong>${d.name}</strong></a> (${d.province}) – ${d.tagline}. ${t('Thời điểm đẹp: {time}.', { time: d.bestTime })} <a href="${pricesUrl(d.id)}">${t('Giá vé tham quan')}</a></li>`).join('')}
                    </ul>
                </section>
            </article>
        </div>

        <section class="section">
            <div class="dest__grid container">${picks.map(d => destinationCard(d)).join('')}</div>
        </section>
    `
}

/* Khối liên kết tới các trang khám phá (đặt ở trang cẩm nang) */
function exploreHubHtml() {
    return `
        <section class="section container explore-hub">
            <h2 class="section__title">${t('Khám phá theo tháng & chủ đề')}</h2>
            <div class="explore-hub__group">
                <strong>${t('Đi đâu theo tháng')}</strong>
                <div class="month-nav">${Array.from({ length: 12 }, (_, i) => i + 1).map(m => `<a href="${monthUrl(m)}" class="chip">${t('Tháng {m}', { m: monthLabel(m) })}</a>`).join('')}</div>
            </div>
            <div class="explore-hub__group">
                <strong>${t('Theo chủ đề')}</strong>
                <div class="month-nav">${themeList().map(x => `<a href="${themeUrl(x.slug)}" class="chip">${x.label}</a>`).join('')}</div>
            </div>
        </section>
    `
}
