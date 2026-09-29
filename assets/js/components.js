/*==================== THÀNH PHẦN DÙNG CHUNG ====================*/
/* Trang tĩnh của điểm đến (sinh bởi `npm run build`) */
const destinationUrl = id => `${SITE_ROOT}${LANG_PREFIX}diem-den/${encodeURIComponent(id)}/index.html`

/* Trang lập kế hoạch chuyến đi (tham số tùy chọn, ví dụ '?p=hue.2') */
const plannerUrl = (suffix = '') => `${SITE_ROOT}${LANG_PREFIX}ke-hoach/index.html${suffix}`

/* Trang chủ của ngôn ngữ hiện tại */
const homeUrl = (suffix = '') => `${SITE_ROOT}${LANG_PREFIX}index.html${suffix}`

applyTranslations()

const DAY_SLOTS = [
    { key: 'morning', label: () => t('Sáng'), icon: 'ri-sun-foggy-line' },
    { key: 'afternoon', label: () => t('Chiều'), icon: 'ri-sun-line' },
    { key: 'evening', label: () => t('Tối'), icon: 'ri-moon-clear-line' },
]

/* Định dạng tiền VND theo ngôn ngữ: 2.400.000đ / 2,400,000 VND */
function formatVnd(amount) {
    const grouped = String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, LANG === 'en' ? ',' : '.')
    return LANG === 'en' ? `${grouped} VND` : `${grouped}đ`
}

/* Thẻ điểm đến – dùng ở trang chủ và mục "Điểm đến cùng vùng" */
function favoriteButton(id, { withLabel = false } = {}) {
    return `
        <button type="button" class="fav-btn${withLabel ? ' fav-btn--labeled' : ''}" data-favorite="${id}" aria-pressed="false" title="${t('Lưu vào yêu thích')}">
            <i class="ri-heart-3-line fav-btn__off"></i><i class="ri-heart-3-fill fav-btn__on"></i>
            ${withLabel ? `<span class="fav-btn__label">${t('Lưu yêu thích')}</span>` : ''}
        </button>
    `
}

function destinationCard(d, hint = '') {
    return `
        <div class="dest-card-wrap">
            <a href="${destinationUrl(d.id)}" class="dest-card">
                <div class="dest-card__media">
                    <img data-wiki="${wikiAttr(heroCandidates(d))}" data-width="960" data-sizes="(max-width: 576px) calc(100vw - 32px), (max-width: 1024px) 46vw, 360px" alt="${d.name}" class="dest-card__img" loading="lazy">
                    <span class="dest-card__region">${REGIONS[d.region]}</span>
                    <span class="dest-card__rating"><i class="ri-star-fill"></i> ${d.rating.toFixed(1)}</span>
                </div>
                <div class="dest-card__body">
                    <h3 class="dest-card__title">${d.name}</h3>
                    <span class="dest-card__province"><i class="ri-map-pin-2-line"></i> ${d.province}</span>
                    ${hint ? `<span class="dest-card__hint"><i class="ri-search-line"></i> ${hint}</span>` : ''}
                    <p class="dest-card__tagline">${d.tagline}</p>
                    <div class="dest-card__tags">
                        ${d.categories.map(c => `<span class="tag">${CATEGORIES[c]}</span>`).join('')}
                    </div>
                </div>
                <span class="dest-card__button" aria-hidden="true"><i class="ri-arrow-right-line"></i></span>
            </a>
            ${favoriteButton(d.id)}
        </div>
    `
}

/*==================== QUÁN ĂN, LƯU TRÚ & ĐẶT CHỖ ====================*/
/* Chọn chuỗi theo ngôn ngữ từ cặp [vi, en] (chuỗi thường giữ nguyên) */
const pickLang = pair => (Array.isArray(pair) ? pair[LANG === 'en' ? 1 : 0] || pair[0] : pair)

const placesOf = id => (typeof PLACES !== 'undefined' && PLACES[id]) || null

/* 45000 → 45k · 1200000 → 1,2tr (vi) / 1.2M (en) */
function shortVnd(n) {
    if (n >= 1000000) {
        const m = String(Math.round(n / 100000) / 10)
        return LANG === 'en' ? `${m}M` : `${m.replace('.', ',')}tr`
    }
    return `${Math.round(n / 1000)}k`
}
const priceRange = ([low, high]) => `${shortVnd(low)}–${shortVnd(high)}`

const mapsSearchUrl = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
const mapsDirectionsUrl = (a, b) => `https://www.google.com/maps/dir/?api=1&origin=${a.lat},${a.lng}&destination=${b.lat},${b.lng}&travelmode=driving`

/* Ngày dạng YYYY-MM-DD (theo giờ địa phương), cộng thêm n ngày */
function addDays(iso, n) {
    const [y, m, d] = iso.split('-').map(Number)
    const date = new Date(y, m - 1, d + n)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(iso) {
    const [y, m, d] = iso.split('-').map(Number)
    return LANG === 'en' ? `${MONTHS_EN[m - 1].slice(0, 3)} ${d}, ${y}` : `${d}/${m}/${y}`
}

/* Link tìm phòng đã điền sẵn nơi ở + ngày (nếu có) */
function stayLinks(city, area = '', checkin = '', nights = 0) {
    const checkout = checkin && nights ? addDays(checkin, nights) : ''
    const booking = new URLSearchParams({ ss: `${city}, Vietnam`, group_adults: 2, no_rooms: 1 })
    const airbnb = new URLSearchParams({ adults: 2 })
    if (checkin) {
        booking.set('checkin', checkin); booking.set('checkout', checkout)
        airbnb.set('checkin', checkin); airbnb.set('checkout', checkout)
    }
    return [
        { label: 'Booking.com', icon: 'ri-hotel-line', url: `https://www.booking.com/searchresults.html?${booking}` },
        { label: 'Airbnb', icon: 'ri-home-heart-line', url: `https://www.airbnb.com/s/${encodeURIComponent(`${city}, Vietnam`)}/homes?${airbnb}` },
        { label: 'Google Maps', icon: 'ri-map-pin-line', url: mapsSearchUrl(`${area ? `${area} ` : ''}hotel ${city}`) },
    ]
}

/* Link tìm vé giữa hai điểm đến theo phương tiện gợi ý */
function transportLinks(a, b, mode, date = '') {
    const pa = placesOf(a.id) || {}
    const pb = placesOf(b.id) || {}
    const links = []
    if (mode === 'flight' && pa.airport && pb.airport && pa.airport !== pb.airport) {
        links.push({ label: t('Vé máy bay'), icon: 'ri-plane-line', url: `https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${pa.airport} to ${pb.airport}${date ? ` on ${date}` : ''}`)}` })
    }
    if (pa.rail && pb.rail && pa.rail !== pb.rail) {
        links.push({ label: t('Vé tàu {from} – {to}', { from: pa.rail, to: pb.rail }), icon: 'ri-train-line', url: 'https://dsvn.vn/' })
    }
    links.push({ label: t('Vé xe khách / limousine'), icon: 'ri-bus-2-line', url: 'https://vexere.com/' })
    links.push({ label: t('Chỉ đường'), icon: 'ri-route-line', url: mapsDirectionsUrl(a, b) })
    return links
}

const linkButtons = links => links.map(l => `
    <a href="${l.url}" target="_blank" rel="noopener" class="book-link"><i class="${l.icon}"></i> ${l.label}</a>
`).join('')

/*==================== CHI PHÍ CHI TIẾT THEO MỨC CHI TIÊU ====================*/
/*
 * Chi phí / người được tính từ dữ liệu cụ thể của điểm đến:
 * - Lưu trú: phòng đôi chia 2 người. Tiết kiệm = giá thấp nhất trong PLACES.stays; thoải mái = khách sạn 3–4 sao (≈ 2,5 lần).
 * - Ăn uống: ăn sáng bình dân + 2 bữa ở các quán trong PLACES.eats; thoải mái ≈ 1,8 lần (nhà hàng tầm trung).
 * - Đi lại tại chỗ: xe máy/xe buýt chia 2 người hoặc Grab/taxi.
 * - Vé tham quan & trải nghiệm: ITINERARIES[id].fees theo từng điểm đến.
 */
const COST_TIERS = {
    saving: { stay: 1, food: 1, transport: 60000, fee: 0 },
    comfort: { stay: 2.5, food: 1.8, transport: 150000, fee: 1 },
}
const round10k = n => Math.round(n / 10000) * 10000

/* Khu lưu trú gợi ý: tiết kiệm → nơi rẻ nhất; thoải mái → nơi có giá gần mức khách sạn 3–4 sao nhất */
function tierStay(id, tier) {
    const places = placesOf(id)
    if (!places) return null
    const sorted = [...places.stays].sort((a, b) => a.price[0] - b.price[0])
    if (tier !== 'comfort') return sorted[0]
    const target = sorted[0].price[0] * COST_TIERS.comfort.stay
    const mid = s => (s.price[0] + s.price[1]) / 2
    return sorted.reduce((best, s) => (Math.abs(mid(s) - target) < Math.abs(mid(best) - target) ? s : best))
}

/* Chi phí một ngày / người theo từng khoản */
function dailyCosts(id, tier) {
    const places = placesOf(id)
    const plan = typeof ITINERARIES !== 'undefined' && ITINERARIES[id]
    if (!places || !plan) return null
    const k = COST_TIERS[tier] || COST_TIERS.saving
    const cheapest = [...places.stays].sort((a, b) => a.price[0] - b.price[0])[0]
    const avgEat = places.eats.reduce((sum, e) => sum + e.price[0], 0) / places.eats.length
    const food = round10k(Math.min(300000, Math.max(150000, 40000 + 2 * avgEat)))
    return {
        stay: round10k(cheapest.price[0] / 2 * k.stay),
        food: round10k(food * k.food),
        transport: k.transport,
        fees: plan.fees[k.fee],
    }
}

/* Tổng chi phí cho n ngày (mặc định n − 1 đêm) kèm từng khoản để hiển thị chi tiết */
function tripCost(id, days, tier, nights = Math.max(1, days - 1)) {
    const daily = dailyCosts(id, tier)
    if (!daily) return { total: 0, items: [] }
    const places = placesOf(id)
    const stay = tierStay(id, tier)
    const eats = places.eats.slice(0, 2).map(e => e.name).join(', ')
    const comfort = tier === 'comfort'
    const items = [
        {
            key: 'stay', icon: 'ri-hotel-bed-line', label: t('Lưu trú'), count: nights, unit: t('đêm'), per: daily.stay,
            note: comfort
                ? t('Khách sạn 3–4 sao, phòng đôi chia 2 người')
                : t('{type} {area} ({price}/phòng), chia 2 người', { type: pickLang(STAY_TYPES[stay.type]), area: pickLang(stay.area), price: priceRange(stay.price) }),
        },
        {
            key: 'food', icon: 'ri-restaurant-line', label: t('Ăn uống'), count: days, unit: t('ngày'), per: daily.food,
            note: comfort ? t('Nhà hàng tầm trung, đặc sản và hải sản') : t('Ăn sáng bình dân, quán địa phương như {eats}', { eats }),
        },
        {
            key: 'transport', icon: 'ri-motorbike-line', label: t('Đi lại tại chỗ'), count: days, unit: t('ngày'), per: daily.transport,
            note: comfort ? t('Grab, taxi hoặc xe riêng quãng ngắn') : t('Thuê xe máy hoặc xe buýt, chia 2 người'),
        },
        {
            key: 'fees', icon: 'ri-ticket-2-line', label: t('Vé tham quan & trải nghiệm'), count: days, unit: t('ngày'), per: daily.fees,
            note: comfort ? t('Theo lịch trình, thêm tour/show có hướng dẫn') : t('Vé vào cổng, thuyền, cáp treo theo lịch trình'),
        },
    ].map(item => ({ ...item, amount: item.per * item.count }))
    return { total: items.reduce((sum, item) => sum + item.amount, 0), items }
}

/* Bảng chi tiết chi phí (dùng ở trang điểm đến và trang kế hoạch) */
function costBreakdownHtml(cost) {
    return `
        <ul class="cost-list">
            ${cost.items.map(item => `
                <li class="cost-item">
                    <span class="cost-item__icon"><i class="${item.icon}"></i></span>
                    <div class="cost-item__text">
                        <strong>${item.label}</strong>
                        <small>${item.note}</small>
                    </div>
                    <div class="cost-item__amount">
                        <strong>${formatVnd(item.amount)}</strong>
                        <small>${item.count} ${item.unit} × ${formatVnd(item.per)}</small>
                    </div>
                </li>
            `).join('')}
        </ul>
    `
}

/*==================== CHIA SẺ & IN ====================*/
/* Sao chép chữ vào bộ nhớ tạm; trình duyệt chặn thì hiện hộp để người dùng tự chép */
async function copyText(text, message) {
    try {
        await navigator.clipboard.writeText(text)
        showToast(message)
    } catch {
        window.prompt(t('Sao chép liên kết này:'), text)
    }
}

/* Chia sẻ qua ứng dụng của máy (điện thoại) hoặc sao chép liên kết (máy tính) */
async function shareLink({ title, text = '', url }) {
    if (navigator.share) {
        try {
            await navigator.share({ title, text, url })
            return
        } catch (err) {
            if (err && err.name === 'AbortError') return
        }
    }
    copyText(url, t('Đã sao chép liên kết'))
}

/* Bản in ghi kèm địa chỉ trang để mở lại bản online */
if (typeof window.addEventListener === 'function') {
    window.addEventListener('beforeprint', () => {
        document.querySelectorAll('.print-url').forEach(el => { el.textContent = location.href.split('#')[0] })
    })
}
