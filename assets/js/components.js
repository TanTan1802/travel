/*==================== THÀNH PHẦN DÙNG CHUNG ====================*/
/* Trang tĩnh của điểm đến (sinh bởi `npm run build`) */
const destinationUrl = id => `${SITE_ROOT}${LANG_PREFIX}diem-den/${encodeURIComponent(id)}/index.html`

/* Trang lập kế hoạch chuyến đi (tham số tùy chọn, ví dụ '?p=hue.2') */
const plannerUrl = (suffix = '') => `${SITE_ROOT}${LANG_PREFIX}ke-hoach/index.html${suffix}`

/* Trang chủ của ngôn ngữ hiện tại */
const homeUrl = (suffix = '') => `${SITE_ROOT}${LANG_PREFIX}index.html${suffix}`

applyTranslations()

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

function destinationCard(d, hint = '', hintIcon = 'ri-search-line') {
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
                    ${hint ? `<span class="dest-card__hint"><i class="${hintIcon}"></i> ${hint}</span>` : ''}
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

/*==================== TIMELINE CHI TIẾT TỪNG NGÀY ====================*/
/*
 * Ghép một ngày trong lịch trình (sáng / chiều / tối) với quán ăn, quán cà phê trong PLACES
 * và món đặc sản của điểm đến thành timeline theo giờ.
 * - Mỗi quán / món chỉ xuất hiện MỘT lần trong cả chuyến: phân bổ lần lượt từ ngày đầu,
 *   nên tour 3 ngày chính là 3 ngày đầu của tour 5 ngày.
 * - Hết quán có tên → dùng món đặc sản (tìm quán trên Google Maps) → gợi ý chung.
 * - Nếu lịch tham quan đã có bữa ăn (vd. buổi tối "ăn cao lầu") thì không chèn thêm bữa đó.
 * - Mỗi buổi tham quan kèm điểm cụ thể trong SIGHTS (giá vé, giờ mở cửa, địa chỉ); quán nước
 *   ưu tiên quán ngay cạnh điểm tham quan của chính ngày đó.
 */
const NIGHT_SPOT = /chợ đêm|night|ăn đêm|nướng|bè|bbq|carnival/i
const BIG_MEAL = /nhà hàng|hải sản|lẩu|dê|vịt|gà|bò bảy/i
/* Quán chỉ bán đồ uống / quà vặt: không tính là bữa chính, dùng cho khung "quán nước, ăn vặt" */
const SNACK_SPOT = /cà phê|coffee|chè|hạt bàng|sữa|bánh bông lan|dãy mắm|bảo tàng|trái cây|bánh ít|bánh bò/i
const BREAKFAST_DISH = /phở|bánh mì|bún|cháo|xôi|bánh cuốn|hủ tiếu|bánh căn|bánh canh|mì|bánh đa|bánh khọt|cơm tấm|bánh bèo/i
const MEAL_IN_TEXT = {
    breakfast: /ăn sáng|bữa sáng|breakfast/i,
    lunch: /ăn trưa|bữa trưa|lunch/i,
    dinner: /(^|[\s,])(ăn|thưởng thức|nếm)\s|ăn tối|bữa tối|food tour|dinner|\beat\b|\btry\b|seafood|bbq/i,
}

/* Đồ uống đường phố theo vùng – dùng cho buổi chiều khi đã hết quán cà phê có tên */
const STREET_DRINKS = {
    bac: [
        ['Trà đá vỉa hè và hướng dương', 'Street iced tea with sunflower seeds'],
        ['Cà phê trứng hoặc cà phê cốt dừa', 'Egg coffee or coconut coffee'],
        ['Chè, kem que vỉa hè', 'Sweet soups and street ice-cream sticks'],
        ['Nước mía, sữa chua mít', 'Sugarcane juice or jackfruit yogurt'],
        ['Trà nóng và bánh ngô nướng', 'Hot tea with grilled corn cakes'],
    ],
    trung: [
        ['Cà phê muối', 'Salted coffee'],
        ['Nước mía, nước sâm mát lạnh', 'Chilled sugarcane juice or herbal drink'],
        ['Chè đậu, chè bột lọc', 'Bean and tapioca sweet soups'],
        ['Nước dừa tươi', 'Fresh coconut water'],
        ['Sinh tố, nước ép trái cây', 'Fruit smoothies and juices'],
    ],
    nam: [
        ['Cà phê sữa đá vỉa hè', 'Street-side iced milk coffee'],
        ['Nước dừa tươi', 'Fresh coconut water'],
        ['Nước mía, sâm bổ lượng', 'Sugarcane juice or sam bo luong'],
        ['Chè, tàu hũ nước đường', 'Sweet soups and tofu in ginger syrup'],
        ['Sinh tố bơ, xoài', 'Avocado or mango smoothies'],
    ],
}

/* Món đặc sản của điểm đến dưới dạng "quán" để đưa vào timeline */
function specialtyPlaces(d) {
    return (d.foods || []).map(f => ({
        name: f.name,
        dish: f.desc,
        address: t('Quán địa phương ở {name}', { name: d.name }),
        priceText: f.price,
        search: `${f.name} ${placesOf(d.id)?.city || d.name}`,
        specialty: true,
    }))
}

/* Gợi ý chung khi đã dùng hết quán có tên – luân phiên theo ngày để không lặp câu */
const GENERIC_MEALS = {
    breakfast: [
        () => t('Ăn sáng tại nơi ở (thường đã gồm trong giá phòng)'),
        () => t('Ăn sáng quán bình dân đông người địa phương gần nơi ở'),
        () => t('Mang theo bánh mì, xôi nếu khởi hành sớm'),
    ],
    lunch: [
        () => t('Ăn trưa ngay tại khu tham quan buổi sáng – nhiều quán gần bến, cổng'),
        () => t('Cơm trưa bình dân gần điểm tham quan'),
        () => t('Ăn trưa nhẹ, mang theo nước và đồ ăn nếu đi xa'),
    ],
    dinner: [
        () => t('Dạo chợ đêm hoặc phố ẩm thực để chọn món ăn tối'),
        () => t('Ăn tối gần nơi ở – chọn quán đông khách địa phương'),
        () => t('Ăn tối tự chọn: thử lại món bạn thích nhất'),
    ],
}
const genericMeal = (meal, day) => GENERIC_MEALS[meal][day % GENERIC_MEALS[meal].length]()

/* Điểm tham quan của một buổi trong ngày: at = 'm' sáng, 'a' chiều, 'e' tối */
function sightsOf(id, dayIndex, at) {
    const days = typeof SIGHTS !== 'undefined' && SIGHTS[id]
    const list = (days && days[dayIndex]) || []
    return at ? list.filter(s => s.at === at) : list
}

/* Quán nước cạnh các điểm tham quan của ngày, theo thứ tự các buổi truyền vào */
function sightCafes(id, dayIndex, ats) {
    const city = placesOf(id)?.city || getDestination(id)?.name || ''
    return ats.flatMap(at => sightsOf(id, dayIndex, at))
        .filter(s => s.cafe)
        .map(s => ({
            ...s.cafe,
            address: t('Gần {place}', { place: pickLang(s.name) }),
            search: `${s.cafe.name} ${city}`,
            nearAt: s.at,
        }))
}

/* Giá vé một điểm: 0 → miễn phí, số → giá, [thấp, cao] → khoảng */
function sightPriceText(price) {
    if (price == null) return ''
    if (!Array.isArray(price)) return price ? formatVnd(price) : t('Miễn phí')
    const [low, high] = price
    if (!high) return t('Miễn phí')
    return low ? `${formatVnd(low)} – ${formatVnd(high)}` : t('Miễn phí – {max}', { max: formatVnd(high) })
}
const priceBounds = price => (Array.isArray(price) ? price : [price || 0, price || 0])
const sightHours = hours => (hours === 'all' ? t('Mở cả ngày') : pickLang(hours))

const mealPlanCache = {}

/* Phân bổ quán ăn / cà phê / đồ uống cho các ngày 0..count-1, không lặp trong cả chuyến */
function mealPlan(id, count) {
    const cached = mealPlanCache[id]
    if (cached && cached.length >= count) return cached
    const d = getDestination(id)
    const places = placesOf(id) || {}
    const itinerary = (typeof ITINERARIES !== 'undefined' && ITINERARIES[id]) || { days: [] }
    const allEats = places.eats || []
    const eats = allEats.filter(e => !SNACK_SPOT.test(e.name))
    const snacks = allEats.filter(e => SNACK_SPOT.test(e.name))
    const specials = d ? specialtyPlaces(d).filter(f => !SNACK_SPOT.test(f.name)) : []
    const cafes = places.cafes || []
    const drinks = STREET_DRINKS[d?.region] || STREET_DRINKS.nam

    /* Coi "Cao lầu" và "Cao lầu Thanh" là cùng một món để không gợi ý hai lần */
    const norm = x => x.toLowerCase().normalize('NFC')
    const usedNames = []
    const isUsed = p => usedNames.some(n => n.includes(norm(p.name)) || norm(p.name).includes(n))

    /* Món / quán đã nhắc trong phần tham quan (vd. "ăn cao lầu") thì không gợi ý lại ở bữa ăn */
    const itineraryText = norm(itinerary.days.map(day => [day.morning, day.afternoon, day.evening].join(' ')).join(' '))
    const specialNames = (d ? specialtyPlaces(d) : []).map(f => norm(f.name))
    const covered = p => itineraryText.includes(norm(p.name))
        || specialNames.some(n => norm(p.name).includes(n) && itineraryText.includes(n))
    const take = (...lists) => {
        for (const list of lists) {
            const hit = list.find(p => !isUsed(p) && !covered(p))
            if (hit) {
                usedNames.push(norm(hit.name))
                return hit
            }
        }
        return null
    }
    const plan = []
    for (let k = 0; k < Math.max(count, 5); k++) {
        const day = itinerary.days[k] || null
        const has = (meal, ...keys) => Boolean(day) && keys.some(key => MEAL_IN_TEXT[meal].test(day[key] || ''))
        const entry = {}
        if (!has('breakfast', 'morning')) {
            entry.breakfast = take(
                eats.filter(e => e.price[0] <= 50000 && !NIGHT_SPOT.test(e.name) && !BIG_MEAL.test(e.name)),
                specials.filter(f => BREAKFAST_DISH.test(f.name)),
            )
        }
        if (!has('lunch', 'morning', 'afternoon')) {
            entry.lunch = take(eats.filter(e => !NIGHT_SPOT.test(e.name)), specials, eats)
        }
        entry.dinnerInEvening = has('dinner', 'evening')
        if (!entry.dinnerInEvening) {
            entry.dinner = take(eats.filter(e => NIGHT_SPOT.test(e.name) || BIG_MEAL.test(e.name)), eats, specials)
        }
        /* 13:00 – quán cạnh điểm buổi sáng; 16:30 – quán cạnh điểm buổi chiều / tối */
        entry.cafe = take(sightCafes(id, k, ['m']), sightCafes(id, k, ['a']), cafes)
        entry.snack = take(sightCafes(id, k, ['a', 'e']), snacks, cafes)
        entry.drink = drinks[k % drinks.length]
        plan.push(entry)
    }
    mealPlanCache[id] = plan
    return plan
}

/*
 * Trả về danh sách mục { time, icon, kind, title, text, place }.
 * options.arrival: { text } thay buổi sáng bằng chặng di chuyển; options.last: ngày cuối (trả phòng).
 */
function dayTimeline(id, dayIndex, day, { arrival = null, last = false } = {}) {
    const meals = mealPlan(id, dayIndex + 1)[dayIndex]
    const entries = []
    const add = (time, icon, kind, title, text, place = null, sights = []) => {
        if (text || place) entries.push({ time, icon, kind, title, text, place, sights })
    }
    const destName = getDestination(id)?.name || ''
    const sights = at => (day ? sightsOf(id, dayIndex, at).map(s => ({ ...s, dest: destName })) : [])
    /* Ngày có lịch riêng dùng phân bổ bữa đã tính; ngày tự do / ngày di chuyển luôn cần đủ bữa */
    const ownDay = Boolean(day) && !arrival
    const breakfast = 'breakfast' in meals || !ownDay
    const lunch = 'lunch' in meals || !ownDay
    const dinnerInEvening = ownDay && meals.dinnerInEvening

    if (breakfast) add('06:30', 'ri-sun-foggy-line', 'meal', t('Ăn sáng'), meals.breakfast ? '' : genericMeal('breakfast', dayIndex), meals.breakfast)
    if (arrival) add('07:30', 'ri-route-line', 'travel', t('Di chuyển'), arrival.text)
    else if (day) add('07:30', 'ri-map-pin-line', 'visit', t('Tham quan buổi sáng'), day.morning, null, sights('m'))
    if (lunch) add('11:30', 'ri-restaurant-line', 'meal', t('Ăn trưa'), meals.lunch ? '' : genericMeal('lunch', dayIndex), meals.lunch)
    /* Ngày di chuyển không tham quan buổi sáng nên bỏ quán cạnh điểm buổi sáng */
    const cafe = arrival && meals.cafe?.nearAt === 'm' ? null : meals.cafe
    if (cafe) add('13:00', 'ri-cup-line', 'cafe', t('Cà phê & nghỉ trưa'), '', cafe)
    else add('13:00', 'ri-hotel-bed-line', 'rest', t('Nghỉ trưa'), t('Về nơi ở nghỉ ngơi, tránh nắng giữa trưa'))
    if (day) add('14:30', 'ri-camera-line', 'visit', t('Tham quan buổi chiều'), day.afternoon, null, sights('a'))
    else add('14:30', 'ri-compass-3-line', 'visit', t('Buổi chiều tự do'), t('Ngày tự do: nghỉ ngơi, khám phá theo sở thích hoặc đi thêm các điểm lân cận.'))
    add('16:30', 'ri-goblet-line', 'drink', t('Quán nước, ăn vặt'), meals.snack ? '' : pickLang(meals.drink), meals.snack)
    if (!dinnerInEvening) add('18:00', 'ri-restaurant-2-line', 'meal', t('Ăn tối'), meals.dinner ? '' : genericMeal('dinner', dayIndex), meals.dinner)
    if (day) add(dinnerInEvening ? '18:00' : '19:30', 'ri-moon-clear-line', 'visit', dinnerInEvening ? t('Ăn tối & buổi tối') : t('Buổi tối'), day.evening, null, sights('e'))
    if (last) add('21:00', 'ri-luggage-cart-line', 'rest', t('Kết thúc tour'), t('Kết thúc tour: trả phòng, mua đặc sản và di chuyển về.'))
    else add('21:30', 'ri-hotel-bed-line', 'rest', t('Về nghỉ'), t('Dạo phố đêm một chút rồi về nơi ở nghỉ ngơi'))
    return entries
}

function timelinePlaceHtml(place) {
    const what = pickLang(place.dish || place.drink)
    const price = place.price ? priceRange(place.price) : place.priceText
    const query = place.search || `${place.name}, ${place.address}`
    return `
        <a href="${mapsSearchUrl(query)}" target="_blank" rel="noopener" class="day-tl__place">${place.specialty ? `${t('Món đặc sản')}: ` : ''}${place.name}</a>
        <span class="day-tl__what">${what}</span>
        <small class="day-tl__meta"><i class="ri-map-pin-2-line"></i> ${place.address}${price ? ` · ${price}` : ''}</small>
    `
}

/* Buổi tham quan liệt kê nhiều điểm ("A, B, C") → hiện thành từng dòng cho dễ theo dõi.
   Đã có thẻ chi tiết từng điểm thì giữ một đoạn ngắn để khỏi lặp tên hai lần. */
function activityTextHtml(e) {
    const parts = e.kind === 'visit' && !e.sights?.length ? e.text.split(/,\s+/).map(x => x.trim()).filter(Boolean) : []
    if (parts.length < 2) return `<p class="day-tl__text">${e.text}</p>`
    const cap = x => x.charAt(0).toLocaleUpperCase(LANG) + x.slice(1)
    return `<ul class="day-tl__list">${parts.map(x => `<li>${cap(x.replace(/\.$/, ''))}</li>`).join('')}</ul>`
}

/* Thẻ chi tiết một điểm tham quan: tên (mở Google Maps), giá vé, giờ mở cửa, địa chỉ */
function sightHtml(s, { id = '' } = {}) {
    const name = pickLang(s.name)
    const free = !Array.isArray(s.price) ? s.price === 0 : !s.price[1]
    return `
        <li class="sight"${id ? ` id="${id}"` : ''}>
            <div class="sight__head">
                <a href="${mapsSearchUrl(`${s.name[0]}, ${s.address}`)}" target="_blank" rel="noopener" class="sight__name">${name}</a>
                <span class="sight__price${free ? ' sight__price--free' : ''}"><i class="ri-ticket-2-line"></i> ${sightPriceText(s.price)}</span>
            </div>
            <small class="sight__meta">
                <span><i class="ri-time-line"></i> ${sightHours(s.hours)}</span>
                <span><i class="ri-map-pin-2-line"></i> ${s.address}</span>
                ${s.updated ? `<span title="${t('Tháng thông tin được cập nhật hoặc kiểm tra lại gần nhất')}"><i class="ri-refresh-line"></i> ${updatedText(s.updated)}</span>` : ''}
            </small>
            ${s.note ? `<small class="sight__note"><i class="ri-information-line"></i> ${pickLang(s.note)}</small>` : ''}
            ${s.dest ? reportLinkHtml({ dest: s.dest, item: s.name[0], details: `${sightPriceText(s.price)} · ${sightHours(s.hours)} · ${s.address}` }) : ''}
        </li>
    `
}

/* "2026-09" → "Cập nhật 09/2026" */
const updatedText = ym => t('Cập nhật {m}/{y}', { m: ym.slice(5, 7), y: ym.slice(0, 4) })

/* Chi phí ước tính mỗi người trong ngày: vé tham quan + ăn uống, cà phê (quán có giá) */
function dayCost(entries) {
    const sum = list => list.reduce(([lo, hi], [a, b]) => [lo + a, hi + b], [0, 0])
    return {
        tickets: sum(entries.flatMap(e => e.sights || []).map(s => priceBounds(s.price))),
        food: sum(entries.filter(e => e.place && Array.isArray(e.place.price)).map(e => e.place.price)),
    }
}

function dayCostHtml(entries) {
    const { tickets, food } = dayCost(entries)
    const range = ([lo, hi]) => (hi ? (lo === hi ? formatVnd(lo) : `${formatVnd(lo)} – ${formatVnd(hi)}`) : t('Miễn phí'))
    if (!tickets[1] && !food[1] && !entries.some(e => e.sights?.length)) return ''
    return `
        <div class="day-cost">
            <span class="day-cost__label"><i class="ri-wallet-3-line"></i> ${t('Ước tính mỗi người hôm nay')}</span>
            <span class="day-cost__item">${t('Vé tham quan')}: <strong>${range(tickets)}</strong></span>
            ${food[1] ? `<span class="day-cost__item">${t('Ăn uống, cà phê')}: <strong>${range(food)}</strong></span>` : ''}
        </div>
    `
}

function dayTimelineHtml(entries) {
    return `
        ${dayCostHtml(entries)}
        <ol class="day-tl">
            ${entries.map(e => `
                <li class="day-tl__item day-tl__item--${e.kind}"${e.end ? ` data-end="${e.end}"` : ''}${e.hidden ? ' hidden' : ''}>
                    <time class="day-tl__time">${e.time}</time>
                    <span class="day-tl__icon"><i class="${e.icon}"></i></span>
                    <div class="day-tl__body">
                        <h4 class="day-tl__title">${e.title}</h4>
                        ${e.text ? activityTextHtml(e) : ''}
                        ${e.sights?.length ? `<ul class="day-tl__sights">${e.sights.map(sightHtml).join('')}</ul>` : ''}
                        ${e.place ? timelinePlaceHtml(e.place) : ''}
                    </div>
                </li>
            `).join('')}
        </ol>
    `
}

/*==================== LỄ HỘI & SỰ KIỆN ====================*/
/* Nhãn tháng của sự kiện: "Tháng 9 – 10" hoặc "05/09 – 15/10" */
function eventWhenText(e) {
    if (e.dates) {
        const fmt = md => `${md.slice(3)}/${md.slice(0, 2)}`
        return `${fmt(e.dates[0])} – ${fmt(e.dates[1])}`
    }
    if (e.months.length === 12) return t('Hằng tháng')
    const months = e.months
    const label = months.length === 1 ? monthLabel(months[0]) : `${monthLabel(months[0])} – ${monthLabel(months[months.length - 1])}`
    return t('Tháng {m}', { m: label })
}

function eventCardHtml(e, { destName = '' } = {}) {
    const type = EVENT_TYPES[e.type]
    return `
        <li class="event event--${e.type}" data-event-months="${eventMonths(e).join(',')}">
            <span class="event__icon" title="${pickLang(type.label)}"><i class="${type.icon}"></i></span>
            <div class="event__body">
                <div class="event__head">
                    <strong class="event__name">${pickLang(e.name)}${destName ? ` <small>· ${destName}</small>` : ''}</strong>
                    <span class="event__when">${eventWhenText(e)}${e.lunar ? ` · ${t('âm lịch')}` : ''}</span>
                </div>
                <p class="event__desc">${pickLang(e.desc)}</p>
                <p class="event__tip"><i class="ri-lightbulb-line"></i> ${pickLang(e.tip)}</p>
            </div>
        </li>
    `
}

/*==================== DANH SÁCH ĐỒ CẦN MANG ====================*/
const PACKING_STORE = 'viet-travel:packing'

function packingState(key) {
    try { return JSON.parse(localStorage.getItem(`${PACKING_STORE}:${key}`) || '{}') } catch { return {} }
}

/* groups từ packingList(); key để ghi nhớ các món đã chuẩn bị (theo điểm đến / kế hoạch) */
function packingHtml(groups, key) {
    const done = packingState(key)
    const total = groups.reduce((n, g) => n + g.items.length, 0)
    const checked = groups.reduce((n, g) => n + g.items.filter(item => done[item.id]).length, 0)
    return `
        <div class="packing" data-packing-key="${key}">
            <p class="packing__progress"><span data-packing-count>${checked}</span>/${total} ${t('món đã chuẩn bị')}</p>
            <div class="packing__groups">
                ${groups.map(g => `
                    <div class="packing__group">
                        <h4 class="packing__title"><i class="${PACKING_GROUPS[g.group].icon}"></i> ${pickLang(PACKING_GROUPS[g.group].label)}</h4>
                        <ul class="packing__list">
                            ${g.items.map(item => `
                                <li><label class="packing__item">
                                    <input type="checkbox" data-pack-item="${item.id}"${done[item.id] ? ' checked' : ''}>
                                    <span>${pickLang(item.name)}</span>
                                </label></li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>
    `
}

/* Ghi nhớ ô đã đánh dấu cho mọi danh sách đồ trên trang */
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('change', e => {
        const box = e.target.closest && e.target.closest('[data-pack-item]')
        if (!box) return
        const root = box.closest('[data-packing-key]')
        const key = root.dataset.packingKey
        const state = packingState(key)
        if (box.checked) state[box.dataset.packItem] = true
        else delete state[box.dataset.packItem]
        try { localStorage.setItem(`${PACKING_STORE}:${key}`, JSON.stringify(state)) } catch { /* bỏ qua */ }
        root.querySelector('[data-packing-count]').textContent = root.querySelectorAll('[data-pack-item]:checked').length
    })
}

/*==================== BÁO SAI THÔNG TIN ====================*/
/* Mở GitHub Issue điền sẵn nội dung – ai cũng góp ý được, không cần server */
const ISSUES_URL = 'https://github.com/TanTan1802/travel/issues/new'

function reportUrl({ dest = '', item = '', details = '', correction = '', source = '', page = '' } = {}) {
    const title = `[Sửa thông tin] ${[dest, item].filter(Boolean).join(' – ')}`
    const body = [
        `**Điểm đến:** ${dest || '-'}`,
        `**Mục cần sửa:** ${item || '-'}`,
        ...(details ? [`**Thông tin hiện tại:** ${details}`] : []),
        ...(page ? [`**Trang:** ${page}`] : []),
        '',
        '**Thông tin đúng / góp ý:**',
        correction,
        '',
        '**Nguồn (link, ảnh chụp bảng giá...):**',
        source,
    ].join('\n')
    return `${ISSUES_URL}?${new URLSearchParams({ title, body, labels: 'sua-thong-tin' })}`
}

/* Liên kết "Báo sai": không có JS → mở GitHub Issue điền sẵn; có JS → report.js mở form ngay trên trang */
function reportLinkHtml(opts, { label = true } = {}) {
    const attr = value => String(value || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    return `<a href="${reportUrl(opts)}" target="_blank" rel="noopener" class="report-link" title="${t('Báo sai thông tin')}"
        data-report-dest="${attr(opts.dest)}" data-report-item="${attr(opts.item)}" data-report-details="${attr(opts.details)}"><i class="ri-flag-line"></i>${label ? ` ${t('Báo sai')}` : ''}</a>`
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
        /* Bản in cần đủ nội dung: mở các phần đang thu gọn (vd. "Xem thêm quán") */
        document.querySelectorAll('details.eats__more').forEach(el => { el.open = true })
        document.querySelectorAll('.print-url').forEach(el => { el.textContent = location.href.split('#')[0] })
    })
}
