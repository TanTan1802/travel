/*==================== LẬP KẾ HOẠCH CHUYẾN ĐI NHIỀU ĐIỂM ĐẾN ====================*/
/*
 * Ghép nhiều điểm đến thành một hành trình: chọn số ngày mỗi nơi, sắp xếp tuyến ngắn nhất,
 * ước tính quãng đường – phương tiện – chi phí, và gộp lịch trình từng ngày từ ITINERARIES.
 * Kế hoạch lưu trên trình duyệt (TripPlan) và chia sẻ được qua URL: ?p=hue.2,hoi-an.3&m=3&b=c
 */

/* Đảo chỉ đến được bằng máy bay / tàu cao tốc */
const ISLAND_IDS = ['phu-quoc', 'con-dao']
const ROAD_FACTOR = 1.3 // đường bộ dài hơn đường chim bay khoảng 30%
const FLIGHT_FROM_KM = 450 // từ quãng đường bộ này trở lên gợi ý bay

const TRANSPORT_COST = {
    road: { saving: 900, comfort: 2200, min: 120000 }, // đ/km: xe khách / xe riêng ghép
    flight: { saving: 1300000, comfort: 2800000 }, // vé một chiều phổ thông
}

const SUGGESTED_ROUTES = [
    { title: 'Miền Bắc kinh điển', icon: 'ri-landscape-line', stops: [['ha-noi', 2], ['ninh-binh', 2], ['vinh-ha-long', 2], ['sa-pa', 3]] },
    { title: 'Con đường di sản miền Trung', icon: 'ri-ancient-pavilion-line', stops: [['phong-nha', 2], ['hue', 2], ['da-nang', 2], ['hoi-an', 2]] },
    { title: 'Biển xanh & cao nguyên', icon: 'ri-sun-line', stops: [['nha-trang', 3], ['da-lat', 3], ['mui-ne', 2]] },
    { title: 'Sài Gòn – miền Tây – đảo ngọc', icon: 'ri-ship-line', stops: [['sai-gon', 2], ['can-tho', 2], ['chau-doc', 2], ['phu-quoc', 3]] },
    { title: 'Xuyên Việt 2 tuần', icon: 'ri-flight-takeoff-line', stops: [['ha-noi', 2], ['vinh-ha-long', 2], ['hue', 2], ['hoi-an', 2], ['da-lat', 2], ['sai-gon', 2]] },
    { title: 'Mộc Châu – Pù Luông – Ninh Bình', icon: 'ri-leaf-line', stops: [['ha-noi', 1], ['moc-chau', 2], ['pu-luong', 2], ['ninh-binh', 2]] },
]

const planner = {
    plan: null,
    map: null,
    layer: null,
}

/*---------- Tính toán ----------*/
function legInfo(a, b, tier) {
    const km = Math.round(distanceKm(a, b) * ROAD_FACTOR)
    const flight = km >= FLIGHT_FROM_KM || ISLAND_IDS.includes(a.id) || ISLAND_IDS.includes(b.id)
    if (flight) {
        return { km, mode: 'flight', hours: null, cost: TRANSPORT_COST.flight[tier] }
    }
    const hours = Math.max(1, Math.round(km / 45 * 2) / 2)
    return { km, mode: 'road', hours, cost: Math.max(TRANSPORT_COST.road.min, Math.round(km * TRANSPORT_COST.road[tier] / 10000) * 10000) }
}

function planTotals(plan) {
    const dests = plan.stops.map(s => getDestination(s.id))
    const legs = dests.slice(1).map((d, i) => legInfo(dests[i], d, plan.tier))
    const days = plan.stops.reduce((sum, s) => sum + s.days, 0)
    /* Chi phí từng điểm dừng (lưu trú, ăn uống, đi lại, vé tham quan) – xem tripCost() trong components.js */
    const nights = planStays(plan).map(s => s.nights)
    const stopCosts = plan.stops.map((s, i) => tripCost(s.id, s.days, plan.tier, nights[i]))
    const stay = stopCosts.reduce((sum, c) => sum + c.total, 0)
    const transport = legs.reduce((sum, l) => sum + l.cost, 0)
    const km = legs.reduce((sum, l) => sum + l.km, 0)

    /* Gộp các khoản của mọi điểm dừng để hiển thị chi tiết */
    const byKey = {}
    stopCosts.forEach(c => c.items.forEach(item => {
        const acc = byKey[item.key] || (byKey[item.key] = { ...item, amount: 0, count: 0 })
        acc.amount += item.amount
        acc.count += item.count
    }))
    const breakdown = Object.values(byKey)
    if (legs.length) breakdown.push({ key: 'legs', icon: 'ri-route-line', label: t('Di chuyển giữa các điểm'), amount: transport, count: legs.length, unit: t('chặng') })

    /* Điểm xuất phát: thêm chặng đi và chặng về (bỏ qua nếu trùng điểm đầu / cuối) */
    const origin = plan.origin && getDestination(plan.origin)
    const outbound = origin && dests.length && origin.id !== dests[0].id ? legInfo(origin, dests[0], plan.tier) : null
    const inbound = origin && dests.length && origin.id !== dests[dests.length - 1].id ? legInfo(dests[dests.length - 1], origin, plan.tier) : null
    const originCost = (outbound ? outbound.cost : 0) + (inbound ? inbound.cost : 0)
    if (originCost) {
        breakdown.push({ key: 'origin', icon: 'ri-flight-takeoff-line', label: t('Đi và về {name}', { name: origin.name }), amount: originCost, count: [outbound, inbound].filter(Boolean).length, unit: t('chặng') })
    }
    const total = stay + transport + originCost
    const stayPerPerson = byKey.stay ? byKey.stay.amount : 0
    const people = plan.people || 2
    return {
        dests, legs, days, stay, stopCosts, breakdown, total, origin, outbound, inbound, people,
        km: km + (outbound ? outbound.km : 0) + (inbound ? inbound.km : 0),
        transport: transport + originCost,
        groupTotal: groupCost(total, stayPerPerson, people),
    }
}

/* Tuyến ngắn nhất (giữ điểm xuất phát): láng giềng gần nhất rồi cải thiện bằng 2-opt */
function optimizeStops(stops) {
    if (stops.length < 3) return stops
    const pts = stops.map(s => getDestination(s.id))
    const dist = (i, j) => distanceKm(pts[i], pts[j])
    const order = [0]
    const left = new Set(pts.map((_, i) => i).slice(1))
    while (left.size) {
        const last = order[order.length - 1]
        const next = [...left].reduce((best, i) => (dist(last, i) < dist(last, best) ? i : best))
        order.push(next)
        left.delete(next)
    }
    const length = o => o.slice(1).reduce((sum, p, i) => sum + dist(o[i], p), 0)
    let improved = true
    while (improved) {
        improved = false
        for (let i = 1; i < order.length - 1; i++) {
            for (let j = i + 1; j < order.length; j++) {
                const candidate = [...order.slice(0, i), ...order.slice(i, j + 1).reverse(), ...order.slice(j + 1)]
                if (length(candidate) < length(order) - 0.01) {
                    order.splice(0, order.length, ...candidate)
                    improved = true
                }
            }
        }
    }
    return order.map(i => stops[i])
}

/* Gộp lịch trình từng ngày của các điểm dừng */
/* Lịch nghỉ từng điểm dừng: ngày nhận phòng (nếu đã chọn ngày khởi hành) và số đêm */
function planStays(plan) {
    let offset = 0
    return plan.stops.map((stop, i) => {
        const last = i === plan.stops.length - 1
        const item = {
            id: stop.id,
            dayIndex: offset,
            checkin: plan.start ? addDays(plan.start, offset) : '',
            nights: last ? Math.max(1, stop.days - 1) : stop.days,
            stay: tierStay(stop.id, plan.tier),
        }
        offset += stop.days
        return item
    })
}

function planDays(plan, totals) {
    const out = []
    const stays = planStays(plan)
    plan.stops.forEach((stop, si) => {
        const d = totals.dests[si]
        const source = (ITINERARIES[d.id] || { days: [] }).days
        for (let i = 0; i < stop.days; i++) {
            out.push({
                dest: d,
                stopIndex: si,
                date: plan.start ? addDays(plan.start, stays[si].dayIndex + i) : '',
                day: source[i] || null,
                dayOfStop: i,
                checkin: i === 0 ? stays[si] : null,
                arrival: i === 0 && si > 0 ? { from: totals.dests[si - 1], leg: totals.legs[si - 1] }
                    : i === 0 && si === 0 && totals.outbound ? { from: totals.origin, leg: totals.outbound } : null,
                departure: i === stop.days - 1 && si === plan.stops.length - 1,
            })
        }
    })
    return out
}

/*---------- URL chia sẻ ----------*/
function planToQuery(plan) {
    const params = new URLSearchParams()
    params.set('p', plan.stops.map(s => `${s.id}.${s.days}`).join(','))
    if (plan.start) params.set('d', plan.start)
    else if (plan.month) params.set('m', plan.month)
    if (plan.tier === 'comfort') params.set('b', 'c')
    if (plan.origin) params.set('o', plan.origin)
    if (plan.people && plan.people !== 2) params.set('n', plan.people)
    if (plan.style) params.set('s', plan.style)
    return `?${params.toString().replace(/%2C/g, ',')}`
}

function planFromQuery(search) {
    const params = new URLSearchParams(search)
    if (!params.get('p')) return null
    const stops = []
    params.get('p').split(',').forEach(part => {
        const [id, n] = part.split('.')
        if (getDestination(id) && !stops.some(s => s.id === id) && stops.length < PLAN_MAX_STOPS) {
            stops.push({ id, days: Math.min(PLAN_MAX_DAYS, Math.max(1, parseInt(n, 10) || 2)) })
        }
    })
    const start = /^\d{4}-\d{2}-\d{2}$/.test(params.get('d') || '') ? params.get('d') : ''
    const month = start ? Number(start.slice(5, 7)) : parseInt(params.get('m'), 10)
    const people = parseInt(params.get('n'), 10)
    return {
        stops, start, month: month >= 1 && month <= 12 ? month : 0, tier: params.get('b') === 'c' ? 'comfort' : 'saving', booked: {},
        origin: ORIGIN_IDS.includes(params.get('o')) ? params.get('o') : '',
        people: people >= 1 && people <= PEOPLE_MAX ? people : 2,
        style: TRAVEL_STYLES[params.get('s')] ? params.get('s') : '',
    }
}

/*---------- Giao diện ----------*/
const legMode = leg => (leg.mode === 'flight'
    ? t('Máy bay / tàu cao tốc')
    : t('Xe khách / ô tô ~{h} giờ', { h: LANG === 'en' ? leg.hours : String(leg.hours).replace('.', ',') }))

const legLabel = leg => `<i class="${leg.mode === 'flight' ? 'ri-plane-line' : 'ri-bus-2-line'}"></i> ${legMode(leg)}`

function destinationOptions(plan) {
    return Object.keys(REGIONS).map(region => `
        <optgroup label="${REGIONS[region]}">
            ${DESTINATIONS.filter(d => d.region === region).map(d => `
                <option value="${d.id}"${plan.stops.some(s => s.id === d.id) ? ' disabled' : ''}>${d.name}</option>
            `).join('')}
        </optgroup>
    `).join('')
}

function renderControls(plan) {
    const favs = Favorites.all().filter(id => getDestination(id) && !plan.stops.some(s => s.id === id))
    return `
        <form class="planner__add" id="planner-add">
            <label class="planner__label" for="planner-select">${t('Thêm điểm đến')}</label>
            <div class="planner__add-row">
                <select id="planner-select" class="planner__select">
                    <option value="">${t('– Chọn điểm đến –')}</option>
                    ${destinationOptions(plan)}
                </select>
                <button type="submit" class="button planner__add-btn"><i class="ri-add-line"></i> ${t('Thêm')}</button>
            </div>
        </form>
        <div class="planner__actions">
            <button type="button" class="chip" data-action="favorites"${favs.length ? '' : ' disabled'}>
                <i class="ri-heart-3-fill"></i> ${t('Thêm từ yêu thích')} <span class="chip__count">${favs.length}</span>
            </button>
            <button type="button" class="chip" data-action="optimize"${plan.stops.length > 2 ? '' : ' disabled'}>
                <i class="ri-route-line"></i> ${t('Sắp xếp tuyến ngắn nhất')}
            </button>
            <button type="button" class="chip" data-action="clear"${plan.stops.length ? '' : ' disabled'}>
                <i class="ri-delete-bin-line"></i> ${t('Xóa tất cả')}
            </button>
        </div>
    `
}

function renderStops(plan, totals) {
    if (!plan.stops.length) {
        return `
            <div class="planner__empty">
                <i class="ri-map-2-line"></i>
                <p>${t('Chưa có điểm đến nào. Thêm điểm đến ở trên hoặc bắt đầu từ một hành trình gợi ý:')}</p>
                <div class="planner__routes">
                    ${SUGGESTED_ROUTES.map((r, i) => `
                        <button type="button" class="planner__route" data-action="route" data-route="${i}">
                            <i class="${r.icon}"></i>
                            <strong>${t(r.title)}</strong>
                            <small>${r.stops.map(([id]) => getDestination(id).name).join(' → ')}</small>
                            <span>${t('{n} ngày', { n: r.stops.reduce((s, [, n]) => s + n, 0) })}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `
    }

    return `
        <div class="print-only print-header">
            <strong>Việt Travel – ${t('Kế hoạch chuyến đi')}</strong>
            <p>${planRoute(plan)}</p>
            <p>${t('{n} ngày', { n: totals.days })} · ${t('{n} điểm đến', { n: plan.stops.length })} · ~${totals.km} km · ${t('Chi phí ước tính / người')}: ${formatVnd(totals.total)} (${plan.tier === 'comfort' ? t('Thoải mái') : t('Tiết kiệm')})${plan.month ? ` · ${t('Tháng khởi hành')}: ${t('Tháng {m}', { m: monthLabel(plan.month) })}` : ''}</p>
            <p class="print-url"></p>
        </div>
        <ol class="planner__stops">
            ${plan.stops.map((stop, i) => {
                const d = totals.dests[i]
                const offSeason = plan.month && !d.bestMonths.includes(plan.month)
                const leg = totals.legs[i]
                return `
                    <li class="stop" data-index="${i}">
                        <span class="stop__number">${i + 1}</span>
                        <img data-wiki="${wikiAttr(heroCandidates(d))}" data-width="500" data-sizes="96px" alt="" class="stop__img">
                        <div class="stop__info">
                            <a href="${destinationUrl(d.id)}" class="stop__name">${d.name}</a>
                            <span class="stop__meta">${d.province} · ${formatVnd(totals.stopCosts[i].total)}</span>
                            ${offSeason ? `<span class="stop__warn"><i class="ri-error-warning-line"></i> ${t('Tháng {m} không phải mùa đẹp nhất', { m: monthLabel(plan.month) })}</span>` : ''}
                            ${plan.style && TRAVEL_STYLES[plan.style].caution.includes(d.id) ? `<span class="stop__warn"><i class="ri-alert-line"></i> ${t('Nhiều đường đèo, leo dốc hoặc đi tàu xa – cân nhắc với {style}', { style: pickLang(TRAVEL_STYLES[plan.style].label).toLowerCase() })}</span>` : ''}
                        </div>
                        <div class="stop__days" role="group" aria-label="${t('Số ngày tại {name}', { name: d.name })}">
                            <button type="button" data-action="days" data-delta="-1" aria-label="${t('Bớt một ngày')}"${stop.days <= 1 ? ' disabled' : ''}><i class="ri-subtract-line"></i></button>
                            <span>${t('{n} ngày', { n: stop.days })}</span>
                            <button type="button" data-action="days" data-delta="1" aria-label="${t('Thêm một ngày')}"${stop.days >= PLAN_MAX_DAYS ? ' disabled' : ''}><i class="ri-add-line"></i></button>
                        </div>
                        <div class="stop__tools">
                            <button type="button" data-action="move" data-delta="-1" aria-label="${t('Lên trên')}"${i === 0 ? ' disabled' : ''}><i class="ri-arrow-up-line"></i></button>
                            <button type="button" data-action="move" data-delta="1" aria-label="${t('Xuống dưới')}"${i === plan.stops.length - 1 ? ' disabled' : ''}><i class="ri-arrow-down-line"></i></button>
                            <button type="button" data-action="remove" aria-label="${t('Xóa {name}', { name: d.name })}"><i class="ri-close-line"></i></button>
                        </div>
                    </li>
                    ${leg ? `
                        <li class="leg" aria-label="${t('Di chuyển')}">
                            <span>${legLabel(leg)}</span>
                            <span>~${leg.km} km · ${formatVnd(leg.cost)}</span>
                        </li>
                    ` : ''}
                `
            }).join('')}
        </ol>
    `
}

function renderSettings(plan) {
    return `
        <div class="planner__setting">
            <label class="planner__label" for="planner-start">${t('Ngày khởi hành')}</label>
            <input type="date" id="planner-start" class="planner__select" value="${plan.start || ''}">
            <small class="planner__hint">${t('Chọn ngày để link đặt phòng, vé tự điền sẵn ngày.')}</small>
        </div>
        <div class="planner__setting"${plan.start ? ' hidden' : ''}>
            <label class="planner__label" for="planner-month">${t('Tháng khởi hành')}</label>
            <select id="planner-month" class="planner__select">
                <option value="0">${t('Chưa chọn')}</option>
                ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}"${plan.month === i + 1 ? ' selected' : ''}>${t('Tháng {m}', { m: monthLabel(i + 1) })}</option>`).join('')}
            </select>
        </div>
        <div class="planner__setting planner__setting--row">
            <div>
                <label class="planner__label" for="planner-origin">${t('Xuất phát từ')}</label>
                <select id="planner-origin" class="planner__select">
                    <option value="">${t('Không tính chặng đi/về')}</option>
                    ${ORIGIN_IDS.map(id => `<option value="${id}"${plan.origin === id ? ' selected' : ''}>${getDestination(id).name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="planner__label" for="planner-people">${t('Số người')}</label>
                <input type="number" id="planner-people" class="planner__select" min="1" max="${PEOPLE_MAX}" value="${plan.people || 2}">
            </div>
        </div>
        <div class="planner__setting">
            <span class="planner__label" id="planner-style-label">${t('Phong cách chuyến đi')}</span>
            <div class="chip-row planner__styles" role="group" aria-labelledby="planner-style-label">
                ${Object.entries(TRAVEL_STYLES).map(([id, st]) => `
                    <button type="button" class="chip${plan.style === id ? ' chip--active' : ''}" data-action="style" data-style="${id}" aria-pressed="${plan.style === id}">
                        <i class="${st.icon}"></i> ${pickLang(st.label)}
                    </button>
                `).join('')}
            </div>
        </div>
        <div class="planner__setting">
            <span class="planner__label" id="planner-tier-label">${t('Mức chi tiêu')}</span>
            <div class="view-toggle" role="group" aria-labelledby="planner-tier-label">
                ${['saving', 'comfort'].map(tier => `
                    <button type="button" class="view-toggle__btn${plan.tier === tier ? ' view-toggle__btn--active' : ''}" data-action="tier" data-tier="${tier}" aria-pressed="${plan.tier === tier}">
                        ${tier === 'saving' ? t('Tiết kiệm') : t('Thoải mái')}
                    </button>
                `).join('')}
            </div>
        </div>
    `
}

function renderSummary(plan, totals) {
    if (!plan.stops.length) return ''
    return `
        <div class="planner__stats">
            <div class="planner__stat"><i class="ri-calendar-2-line"></i><strong>${totals.days}</strong><span>${t('ngày')}</span></div>
            <div class="planner__stat"><i class="ri-map-pin-2-line"></i><strong>${plan.stops.length}</strong><span>${t('điểm đến')}</span></div>
            <div class="planner__stat"><i class="ri-road-map-line"></i><strong>~${totals.km.toLocaleString(LANG === 'en' ? 'en-US' : 'vi-VN')}</strong><span>km</span></div>
        </div>
        <div class="planner__cost">
            <span>${t('Chi phí ước tính / người')}</span>
            <strong>${formatVnd(totals.total)}</strong>
            <small>${plan.tier === 'comfort' ? t('Khách sạn 3–4 sao, nhà hàng, Grab') : t('Homestay, ăn quán địa phương, xe máy')}</small>
            <p class="planner__group" id="planner-group"><i class="ri-group-line"></i> ${t('Cả nhóm {n} người: {total}', { n: totals.people, total: formatVnd(totals.groupTotal) })}${totals.people === 1 ? ` · ${t('ở một mình trả trọn giá phòng')}` : totals.people % 2 ? ` · ${t('lẻ người nên tính thêm 1 phòng')}` : ''}</p>
        </div>
        ${plan.style ? `
            <details class="cost-details style-tips" open>
                <summary><i class="${TRAVEL_STYLES[plan.style].icon}"></i> ${t('Gợi ý cho {style}', { style: pickLang(TRAVEL_STYLES[plan.style].label).toLowerCase() })}</summary>
                <ul class="style-tips__list">${TRAVEL_STYLES[plan.style].tips.map(tip => `<li>${pickLang(tip)}</li>`).join('')}</ul>
            </details>
        ` : ''}
        <details class="cost-details"${planner.costOpen ? ' open' : ''}>
            <summary>${t('Xem chi tiết chi phí')}</summary>
            <ul class="cost-list">
                ${totals.breakdown.map(item => `
                    <li class="cost-item">
                        <span class="cost-item__icon"><i class="${item.icon}"></i></span>
                        <div class="cost-item__text">
                            <strong>${item.label}</strong>
                            <small>${item.count} ${item.unit}</small>
                        </div>
                        <div class="cost-item__amount"><strong>${formatVnd(item.amount)}</strong></div>
                    </li>
                `).join('')}
            </ul>
        </details>
        <p class="budget__note">${totals.origin ? t('Đã gồm chặng đi và về {name}. Giá tham khảo, thay đổi theo mùa.', { name: totals.origin.name }) : t('Chưa gồm vé tới điểm đầu tiên và về từ điểm cuối. Giá tham khảo, thay đổi theo mùa.')}</p>
        <div class="planner__share">
            <button type="button" class="button button--flex" data-action="share"><i class="ri-share-line"></i> ${t('Chia sẻ kế hoạch')}</button>
            <button type="button" class="button button--flex button--ghost" data-action="copy-text"><i class="ri-file-copy-line"></i> ${t('Sao chép dạng chữ')}</button>
            <button type="button" class="button button--flex button--ghost" data-action="print"><i class="ri-printer-line"></i> ${t('In / lưu PDF')}</button>
        </div>
        <div class="planner__share planner__export">
            <button type="button" class="button button--flex button--ghost" data-action="ics"><i class="ri-calendar-2-line"></i> ${t('Thêm vào lịch (.ics)')}</button>
            ${totals.dests.length > 1 ? `<a href="${tripRouteUrl(totals.dests)}" target="_blank" rel="noopener" class="button button--flex button--ghost"><i class="ri-route-line"></i> ${t('Cả tuyến trên Google Maps')}</a>` : ''}
            ${offlineSupported() ? `<button type="button" class="button button--flex button--ghost" data-action="offline"><i class="ri-download-cloud-2-line"></i> ${t('Tải về dùng offline')}</button>` : ''}
        </div>
        ${offlineStatusHtml(plan)}
        ${plan.start ? '' : `<p class="budget__note">${t('Chọn ngày khởi hành để thêm lịch trình vào lịch và xem dự báo thời tiết từng ngày.')}</p>`}
    `
}

/* Đã lưu offline chưa (và có đúng tuyến hiện tại không) */
function offlineStatusHtml(plan) {
    const info = offlineSupported() ? offlineInfo() : null
    if (!info) return ''
    const same = info.route === plan.stops.map(s => s.id).join(',')
    const when = new Date(info.time)
    const stamp = `${formatDate(`${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, '0')}-${String(when.getDate()).padStart(2, '0')}`)} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`
    return `<p class="offline-status${same ? '' : ' offline-status--stale'}" id="offline-status"><i class="ri-${same ? 'checkbox-circle' : 'error-warning'}-line"></i> ${same
        ? t('Đã lưu offline {n} tệp lúc {time}', { n: info.count, time: stamp })
        : t('Bản offline đã lưu là của tuyến cũ – bấm tải lại để cập nhật.')}</p>`
}

async function downloadOffline(plan, btn) {
    const totals = planTotals(plan)
    const pages = [location.href, ...totals.dests.map(d => destinationUrl(d.id))]
    btn.disabled = true
    const label = btn.innerHTML
    try {
        const result = await saveTripOffline(plan, pages, (done, total) => {
            btn.innerHTML = `<i class="ri-loader-4-line"></i> ${t('Đang lưu {done}/{total}', { done, total })}`
        })
        showToast(result.failed
            ? t('Đã lưu {n} tệp để dùng offline ({failed} tệp lỗi)', { n: result.saved, failed: result.failed })
            : t('Đã lưu {n} tệp – mở lại trang này khi mất mạng vẫn xem được', { n: result.saved }))
    } catch {
        showToast(t('Không lưu được bản offline trên trình duyệt này'))
    }
    btn.innerHTML = label
    btn.disabled = false
    const status = document.getElementById('offline-status')
    const html = offlineStatusHtml(plan)
    if (status) status.outerHTML = html
    else btn.closest('.planner__export').insertAdjacentHTML('afterend', html)
}

/*---------- Chế độ "Hôm nay": ngày đang đi, mốc hiện tại / kế tiếp, chỉ đường ----------*/
function renderToday(plan, totals) {
    const status = tripStatus(plan)
    if (!status) return ''
    if (status.kind === 'upcoming') {
        if (status.inDays > 60) return ''
        return `
            <div class="today today--upcoming">
                <i class="ri-suitcase-3-line today__icon"></i>
                <div>
                    <strong>${status.inDays === 1 ? t('Ngày mai khởi hành!') : t('Còn {n} ngày nữa là tới chuyến đi', { n: status.inDays })}</strong>
                    <p>${planRoute(plan)} · ${formatDate(status.trip.start)} – ${formatDate(status.trip.end)}</p>
                </div>
            </div>
        `
    }
    const days = planDays(plan, totals)
    const item = days[status.dayIndex]
    const entries = planDayTimeline(item)
    const { current, next, minutesToNext } = currentAndNext(entries)
    const hm = m => {
        if (m < 60) return t('{m} phút', { m })
        return m % 60 ? t('{h} giờ {m} phút', { h: Math.floor(m / 60), m: m % 60 }) : t('{h} giờ', { h: m / 60 })
    }
    const line = (e, cls) => {
        if (!e) return ''
        const where = entryDestination(e, item.dest.name)
        const what = e.place ? e.place.name : (e.sights && e.sights.length ? e.sights.map(x => pickLang(x.name)).join(', ') : e.text)
        return `
            <div class="today__entry today__entry--${cls}">
                <span class="today__label">${cls === 'now' ? t('Đang diễn ra') : t('Tiếp theo – còn {time}', { time: hm(minutesToNext) })}</span>
                <strong><time>${e.time}</time> ${e.title}</strong>
                <p>${what}</p>
                ${where ? `<a href="${directionsToUrl(where)}" target="_blank" rel="noopener" class="button button--flex today__go"><i class="ri-direction-line"></i> ${t('Chỉ đường')}</a>` : ''}
            </div>
        `
    }
    return `
        <section class="today" id="today" aria-live="polite">
            <div class="today__head">
                <span class="today__badge"><i class="ri-map-pin-time-line"></i> ${t('Hôm nay')}</span>
                <h2 class="today__title">${t('Ngày {n}/{total}', { n: status.dayIndex + 1, total: status.trip.days })} – ${item.dest.name}${item.day ? `: ${item.day.title}` : ''}</h2>
                <span class="day-tools__forecast" data-forecast-dest="${item.dest.id}" data-forecast-date="${item.date}"></span>
            </div>
            <div class="today__entries">
                ${line(current, 'now')}
                ${line(next, 'next')}
                ${!current && !next ? `<p>${t('Chưa có hoạt động nào cho hôm nay.')}</p>` : ''}
                ${current && !next ? `<p class="today__done"><i class="ri-moon-clear-line"></i> ${t('Đã hết các hoạt động hôm nay – nghỉ ngơi nhé!')}</p>` : ''}
            </div>
            ${nearbyLinksHtml()}
            <a href="#plan-day-${status.dayIndex + 1}" class="today__all"><i class="ri-list-check-2"></i> ${t('Xem cả lịch hôm nay')}</a>
        </section>
    `
}

/* Chi tiết một ngày trong kế hoạch dùng cho timeline, lịch và Google Calendar */
function planDayTimeline(item) {
    return dayTimeline(item.dest.id, item.dayOfStop, item.day, {
        arrival: item.arrival ? { text: `${legMode(item.arrival.leg)} · ${t('Từ {from} đến {to} (~{km} km). Nên đi sớm để kịp tham quan buổi chiều.', { from: item.arrival.from.name, to: item.dest.name, km: item.arrival.leg.km })}` } : null,
        last: item.departure,
    })
}

const planDayLabel = (item, i) => `${t('Ngày {n}', { n: i + 1 })} – ${item.dest.name}${item.day ? `: ${item.day.title}` : ''}`

function planDayToolsHtml(item, i, entries) {
    const route = item.day ? dayRouteUrl(item.dest.id, item.dayOfStop, { skipMorning: Boolean(item.arrival) }) : ''
    const gcal = item.date ? googleCalendarDayUrl({
        title: planDayLabel(item, i),
        date: item.date,
        details: `${dayDetailsText(entries)}\n\n${planShareUrl(planner.plan)}`,
        location: `${item.dest.name}, ${item.dest.province}`,
    }) : ''
    if (!route && !gcal && !item.date) return ''
    return `
        <div class="day-tools">
            ${item.date ? `<span class="day-tools__forecast" data-forecast-dest="${item.dest.id}" data-forecast-date="${item.date}"></span>` : ''}
            <span class="day-tools__links">
                ${route ? `<a href="${route}" target="_blank" rel="noopener" class="day-tools__link"><i class="ri-route-line"></i> ${t('Lộ trình trên Google Maps')}</a>` : ''}
                ${gcal ? `<a href="${gcal}" target="_blank" rel="noopener" class="day-tools__link"><i class="ri-calendar-event-line"></i> ${t('Thêm ngày này vào Google Calendar')}</a>` : ''}
            </span>
        </div>
    `
}

/* File .ics cho cả kế hoạch – cần ngày khởi hành */
function exportPlanIcs(plan) {
    if (!plan.start) {
        const input = document.getElementById('planner-start')
        input.scrollIntoView({ behavior: 'smooth', block: 'center' })
        input.focus()
        showToast(t('Chọn ngày khởi hành trước để thêm vào lịch'))
        return
    }
    const totals = planTotals(plan)
    const events = planDays(plan, totals).flatMap((item, i) => timelineToEvents(planDayTimeline(item), {
        date: item.date, destName: item.dest.name, dayLabel: planDayLabel(item, i),
    }))
    const name = t('Kế hoạch chuyến đi: {route}', { route: planRoute(plan) })
    downloadTextFile(`${safeFileName(planRoute(plan))}-${plan.start}.ics`, buildIcs({ name, events }))
    showToast(t('Đã tải file lịch – mở file để thêm vào Google Calendar, Apple Calendar hoặc Outlook'))
}

function renderDays(plan, totals) {
    if (!plan.stops.length) return ''
    const days = planDays(plan, totals)
    return `
        <h2 class="section__title">${t('Lịch trình {n} ngày', { n: days.length })}</h2>
        <ol class="plan-days">
            ${days.map((item, i) => `
                <li class="plan-day${item.arrival ? ' plan-day--travel' : ''}" id="plan-day-${i + 1}">
                    <div class="plan-day__head">
                        <span class="plan-day__number">${t('Ngày {n}', { n: i + 1 })}</span>
                        ${item.date ? `<span class="plan-day__date">${formatDate(item.date)}</span>` : ''}
                        <h3 class="plan-day__title">${item.dest.name}${item.day ? ` – ${item.day.title}` : ''}</h3>
                    </div>
                    ${(entries => `${planDayToolsHtml(item, i, entries)}${dayTimelineHtml(entries)}`)(planDayTimeline(item))}
                    ${item.checkin && item.checkin.stay ? `
                        <div class="plan-day__stay">
                            <p><i class="ri-hotel-bed-line"></i> <strong>${t('Nghỉ đêm')}:</strong> ${pickLang(item.checkin.stay.area)} · ${pickLang(STAY_TYPES[item.checkin.stay.type])} ${priceRange(item.checkin.stay.price)}/${t('đêm')} · ${t('{n} đêm', { n: item.checkin.nights })}</p>
                            <div class="book-links">${linkButtons(stayLinks(placesOf(item.dest.id).city, pickLang(item.checkin.stay.area), item.checkin.checkin, item.checkin.nights))}</div>
                        </div>
                    ` : ''}
                </li>
            `).join('')}
        </ol>
    `
}

/* Ngày (ISO) của từng điểm dừng khi đã chọn ngày khởi hành */
function stopDates(plan) {
    return planStays(plan).map((s, i) => (plan.start
        ? Array.from({ length: plan.stops[i].days }, (_, k) => addDays(plan.start, s.dayIndex + k))
        : []))
}

/* Lễ hội, nghỉ lễ, thời tiết cần lưu ý trùng ngày (hoặc tháng) đi của từng điểm dừng */
function renderNotes(plan, totals) {
    if (!plan.stops.length || (!plan.start && !plan.month)) return ''
    const dates = stopDates(plan)
    const seen = new Set()
    const notes = []
    totals.dests.forEach((d, i) => {
        eventsForTrip(d.id, { dates: dates[i], month: plan.month }).forEach(e => {
            const key = e.where === 'all' ? e.id : `${e.id}:${d.id}`
            if (seen.has(key)) return
            seen.add(key)
            notes.push({ e, destName: e.where === 'all' ? '' : d.name })
        })
    })
    if (!notes.length) return ''
    return `
        <section class="planner__block">
            <h2 class="planner__block-title"><i class="ri-alarm-warning-line"></i> ${t('Lưu ý theo ngày đi')}</h2>
            <p class="budget__note">${plan.start ? t('Lễ hội, nghỉ lễ và thời tiết trùng những ngày bạn có mặt ở từng nơi.') : t('Theo tháng khởi hành – chọn ngày cụ thể để lọc chính xác hơn.')}</p>
            <ul class="events__list">${notes.map(n => eventCardHtml(n.e, { destName: n.destName })).join('')}</ul>
        </section>
    `
}

/* Danh sách đồ gộp cho cả chuyến theo điểm đến và tháng đi */
function renderPackingBlock(plan, totals) {
    if (!plan.stops.length) return ''
    const dates = stopDates(plan)
    const months = totals.dests.map((_, i) => (dates[i].length ? Number(dates[i][0].slice(5, 7)) : plan.month || 0))
    return `
        <section class="planner__block">
            <h2 class="planner__block-title"><i class="ri-luggage-cart-line"></i> ${t('Chuẩn bị hành lý')}</h2>
            ${months.some(Boolean) ? '' : `<p class="budget__note">${t('Chọn tháng hoặc ngày khởi hành để thêm đồ theo thời tiết (áo ấm, áo mưa...).')}</p>`}
            ${packingHtml(packingList(totals.dests, months, { style: plan.style }), 'plan')}
        </section>
    `
}

/* Những thứ cần đặt trước: vé từng chặng + phòng từng điểm, có ô đánh dấu đã đặt */
function bookingItems(plan, totals) {
    const stays = planStays(plan)
    const items = []
    const originItem = (from, to, leg, date, key) => ({
        key,
        icon: leg.mode === 'flight' ? 'ri-plane-line' : 'ri-bus-2-line',
        title: `${from.name} → ${to.name}`,
        detail: `${legMode(leg)}${date ? ` · ${formatDate(date)}` : ''}`,
        links: transportLinks(from, to, leg.mode, date),
    })
    if (totals.outbound) items.push(originItem(totals.origin, totals.dests[0], totals.outbound, plan.start, `go:${totals.origin.id}>${totals.dests[0].id}`))
    stays.forEach((s, i) => {
        const d = totals.dests[i]
        if (i > 0) {
            const leg = totals.legs[i - 1]
            const from = totals.dests[i - 1]
            items.push({
                key: `leg:${from.id}>${d.id}`,
                icon: leg.mode === 'flight' ? 'ri-plane-line' : 'ri-bus-2-line',
                title: `${from.name} → ${d.name}`,
                detail: `${legMode(leg)}${s.checkin ? ` · ${formatDate(s.checkin)}` : ''}`,
                links: transportLinks(from, d, leg.mode, s.checkin),
            })
        }
        const places = placesOf(d.id)
        if (places && s.stay) {
            items.push({
                key: `stay:${d.id}`,
                icon: 'ri-hotel-bed-line',
                title: t('Phòng tại {name}', { name: d.name }),
                detail: `${pickLang(s.stay.area)} · ${t('{n} đêm', { n: s.nights })}${s.checkin ? ` · ${formatDate(s.checkin)} → ${formatDate(addDays(s.checkin, s.nights))}` : ''}`,
                links: stayLinks(places.city, pickLang(s.stay.area), s.checkin, s.nights),
            })
        }
    })
    if (totals.inbound) {
        const last = totals.dests[totals.dests.length - 1]
        const end = plan.start ? addDays(plan.start, totals.days - 1) : ''
        items.push(originItem(last, totals.origin, totals.inbound, end, `back:${last.id}>${totals.origin.id}`))
    }
    return items
}

function renderBookings(plan, totals) {
    if (!plan.stops.length) return ''
    const items = bookingItems(plan, totals)
    const booked = plan.booked || {}
    const done = items.filter(item => booked[item.key]).length
    return `
        <div class="bookings__head">
            <h2 class="bookings__title"><i class="ri-checkbox-multiple-line"></i> ${t('Cần đặt trước')}</h2>
            <span class="bookings__progress">${t('Đã đặt {done}/{total}', { done, total: items.length })}</span>
        </div>
        ${plan.start ? '' : `<p class="bookings__hint"><i class="ri-calendar-event-line"></i> ${t('Chọn ngày khởi hành để các link đặt phòng, vé tự điền ngày tương ứng.')}</p>`}
        <ul class="bookings__list">
            ${items.map(item => `
                <li class="booking${booked[item.key] ? ' booking--done' : ''}">
                    <label class="booking__check">
                        <input type="checkbox" data-booking="${item.key}"${booked[item.key] ? ' checked' : ''}>
                        <span class="booking__icon"><i class="${item.icon}"></i></span>
                        <span class="booking__text"><strong>${item.title}</strong><small>${item.detail}</small></span>
                    </label>
                    <div class="book-links">${linkButtons(item.links)}</div>
                </li>
            `).join('')}
        </ul>
        <p class="budget__note">${t('Các link mở trang tìm kiếm của Booking.com, Airbnb, Google Flights, Vexere, Đường sắt Việt Nam – bạn so sánh giá và đặt trực tiếp trên đó.')}</p>
    `
}

/*---------- Bản đồ tuyến ----------*/
async function updatePlannerMap(plan, totals) {
    const el = document.getElementById('planner-map')
    if (!el) return
    el.hidden = !plan.stops.length
    if (!plan.stops.length) return
    if (!(await loadLeaflet())) return showMapUnavailable(el)

    if (!planner.map) planner.map = createMap(el)
    if (planner.layer) planner.layer.remove()

    const points = totals.dests.map(d => [d.lat, d.lng])
    planner.layer = L.layerGroup([
        L.polyline(points, { color: '#e8912d', weight: 3, dashArray: '6 8' }),
        ...totals.dests.map((d, i) => bindDestinationPopup(L.marker([d.lat, d.lng], {
            title: d.name,
            icon: L.divIcon({ className: `map-pin map-pin--${d.region} map-pin--numbered`, html: `<span>${i + 1}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] }),
        }), d)),
    ]).addTo(planner.map)

    planner.map.invalidateSize()
    if (points.length === 1) planner.map.setView(points[0], 8)
    else planner.map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 9 })
}

/*---------- Cập nhật ----------*/
function renderPlanner() {
    const plan = planner.plan
    const totals = planTotals(plan)
    document.getElementById('planner-today').innerHTML = renderToday(plan, totals)
    document.getElementById('planner-controls').innerHTML = renderControls(plan)
    document.getElementById('planner-stops').innerHTML = renderStops(plan, totals)
    document.getElementById('planner-settings').innerHTML = renderSettings(plan)
    document.getElementById('planner-summary').innerHTML = renderSummary(plan, totals)
    document.getElementById('planner-bookings').innerHTML = renderBookings(plan, totals)
    document.getElementById('planner-notes').innerHTML = renderNotes(plan, totals)
    document.getElementById('planner-packing').innerHTML = renderPackingBlock(plan, totals)
    document.getElementById('planner-days').innerHTML = renderDays(plan, totals)
    document.getElementById('planner-page').classList.toggle('planner--empty', !plan.stops.length)
    hydrateWikiImages(document.getElementById('planner-stops'))
    updatePlannerMap(plan, totals)
    if (plan.start) {
        fillForecasts(document.getElementById('planner-days'))
        fillForecasts(document.getElementById('planner-today'))
    }
}

function commit(plan, { scroll = false } = {}) {
    planner.plan = plan
    TripPlan.save(plan)
    history.replaceState(null, '', plan.stops.length ? planToQuery(plan) : location.pathname)
    renderPlanner()
    if (scroll) document.getElementById('planner-stops').scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function addStops(plan, ids) {
    const stops = [...plan.stops]
    ids.forEach(id => {
        const d = getDestination(id)
        if (d && !stops.some(s => s.id === id) && stops.length < PLAN_MAX_STOPS) stops.push({ id, days: planDefaultDays(d) })
    })
    if (stops.length === PLAN_MAX_STOPS && ids.length) showToast(t('Kế hoạch tối đa {n} điểm đến', { n: PLAN_MAX_STOPS }))
    return { ...plan, stops }
}

const planRoute = plan => plan.stops.map(s => getDestination(s.id).name).join(' → ')
const planShareUrl = plan => new URL(planToQuery(plan), location.href).href

function sharePlan() {
    const plan = planner.plan
    shareLink({ title: t('Kế hoạch chuyến đi: {route}', { route: planRoute(plan) }), url: planShareUrl(plan) })
}

/* Lịch trình dạng chữ để dán vào tin nhắn (Zalo, Messenger...) */
function planAsText(plan) {
    const totals = planTotals(plan)
    const lines = [
        t('Kế hoạch chuyến đi: {route}', { route: planRoute(plan) }),
        `${t('{n} ngày', { n: totals.days })} · ~${totals.km} km · ${t('Chi phí ước tính / người')}: ${formatVnd(totals.total)} (${plan.tier === 'comfort' ? t('Thoải mái') : t('Tiết kiệm')})`,
        t('Cả nhóm {n} người: {total}', { n: totals.people, total: formatVnd(totals.groupTotal) }),
    ]
    if (totals.origin) lines.push(`${t('Xuất phát từ')}: ${totals.origin.name}`)
    if (plan.month) lines.push(`${t('Tháng khởi hành')}: ${t('Tháng {m}', { m: monthLabel(plan.month) })}`)
    planDays(plan, totals).forEach((item, i) => {
        lines.push('', `${t('Ngày {n}', { n: i + 1 })} – ${item.dest.name}${item.day ? `: ${item.day.title}` : ''}${item.date ? ` (${formatDate(item.date)})` : ''}`)
        const arrival = item.arrival
            ? { text: `${item.arrival.from.name} → ${item.dest.name} (~${item.arrival.leg.km} km, ${legMode(item.arrival.leg)})` }
            : null
        dayTimeline(item.dest.id, item.dayOfStop, item.day, { arrival, last: item.departure }).forEach(e => {
            const detail = e.place ? `${e.place.name} – ${e.place.address}` : e.text
            lines.push(`  ${e.time} ${e.title}: ${detail}`)
            ;(e.sights || []).forEach(s => {
                lines.push(`      • ${pickLang(s.name)} – ${sightPriceText(s.price)} – ${sightHours(s.hours)}`)
            })
        })
        if (item.checkin && item.checkin.stay) {
            lines.push(`  ${t('Nghỉ đêm')}: ${pickLang(item.checkin.stay.area)} (${pickLang(STAY_TYPES[item.checkin.stay.type])} ${priceRange(item.checkin.stay.price)}/${t('đêm')}, ${t('{n} đêm', { n: item.checkin.nights })})`)
        }
    })
    lines.push('', `${t('Xem kế hoạch')}: ${planShareUrl(plan)}`)
    return lines.join('\n')
}

function handlePlannerClick(e) {
    const btn = e.target.closest('[data-action]')
    if (!btn || btn.disabled) return
    const plan = planner.plan
    const index = Number(btn.closest('[data-index]')?.dataset.index)
    const delta = Number(btn.dataset.delta)

    switch (btn.dataset.action) {
        case 'favorites':
            return commit(addStops(plan, Favorites.all()))
        case 'optimize':
            showToast(t('Đã sắp xếp lại tuyến đường'))
            return commit({ ...plan, stops: optimizeStops(plan.stops) })
        case 'clear':
            if (window.confirm(t('Xóa toàn bộ kế hoạch?'))) commit({ ...plan, stops: [] })
            return
        case 'route': {
            const route = SUGGESTED_ROUTES[Number(btn.dataset.route)]
            return commit({ ...plan, stops: route.stops.map(([id, days]) => ({ id, days })) }, { scroll: true })
        }
        case 'days': {
            const stops = plan.stops.map((s, i) => (i === index ? { ...s, days: Math.min(PLAN_MAX_DAYS, Math.max(1, s.days + delta)) } : s))
            return commit({ ...plan, stops })
        }
        case 'move': {
            const stops = [...plan.stops]
            const [moved] = stops.splice(index, 1)
            stops.splice(index + delta, 0, moved)
            return commit({ ...plan, stops })
        }
        case 'remove':
            return commit({ ...plan, stops: plan.stops.filter((_, i) => i !== index) })
        case 'tier':
            return commit({ ...plan, tier: btn.dataset.tier })
        case 'style': {
            const style = plan.style === btn.dataset.style ? '' : btn.dataset.style
            const suggested = style && TRAVEL_STYLES[style].tier
            if (suggested && suggested !== plan.tier) showToast(t('Đã chuyển sang mức chi tiêu gợi ý cho phong cách này'))
            return commit({ ...plan, style, tier: suggested || plan.tier })
        }
        case 'share':
            return sharePlan()
        case 'copy-text':
            return copyText(planAsText(plan), t('Đã sao chép lịch trình dạng chữ'))
        case 'print':
            return window.print()
        case 'ics':
            return exportPlanIcs(plan)
        case 'offline':
            return downloadOffline(plan, btn)
    }
}

function initPlanner() {
    const root = document.getElementById('planner-page')
    if (!root) return

    /* Liên kết chia sẻ được ưu tiên hơn kế hoạch đã lưu */
    const saved = TripPlan.get()
    const fromUrl = planFromQuery(location.search)
    const sameStops = fromUrl && fromUrl.stops.map(x => `${x.id}.${x.days}`).join() === saved.stops.map(x => `${x.id}.${x.days}`).join()
    /* Mở lại chính kế hoạch của mình: giữ các mục đã đánh dấu "đã đặt" */
    planner.plan = fromUrl ? { ...fromUrl, booked: sameStops ? saved.booked || {} : {} } : saved
    if (location.search && planner.plan.stops.length) TripPlan.save(planner.plan)

    root.addEventListener('click', handlePlannerClick)
    root.addEventListener('toggle', e => {
        if (e.target.classList && e.target.classList.contains('cost-details')) planner.costOpen = e.target.open
    }, true)
    root.addEventListener('submit', e => {
        if (e.target.id !== 'planner-add') return
        e.preventDefault()
        const id = document.getElementById('planner-select').value
        if (id) commit(addStops(planner.plan, [id]))
    })
    root.addEventListener('change', e => {
        if (e.target.id === 'planner-month') commit({ ...planner.plan, month: Number(e.target.value) })
        if (e.target.id === 'planner-origin') commit({ ...planner.plan, origin: e.target.value })
        if (e.target.id === 'planner-people') {
            const people = Math.min(PEOPLE_MAX, Math.max(1, parseInt(e.target.value, 10) || 2))
            commit({ ...planner.plan, people })
        }
        if (e.target.id === 'planner-start') {
            const start = e.target.value
            commit({ ...planner.plan, start, month: start ? Number(start.slice(5, 7)) : planner.plan.month })
        }
        if (e.target.dataset.booking) {
            const booked = { ...(planner.plan.booked || {}), [e.target.dataset.booking]: e.target.checked }
            commit({ ...planner.plan, booked })
        }
    })
    renderPlanner()

    /* Cập nhật mốc "đang diễn ra / tiếp theo" mỗi phút */
    setInterval(() => {
        const box = document.getElementById('planner-today')
        if (!box || !box.firstElementChild || box.firstElementChild.classList.contains('today--upcoming')) return
        box.innerHTML = renderToday(planner.plan, planTotals(planner.plan))
        fillForecasts(box)
    }, 60000)
}

initPlanner()
