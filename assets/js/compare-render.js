/*==================== SO SÁNH ĐIỂM ĐẾN: so-sanh/ ====================*/
/*
 * Chỉ dùng khi build. Bảng dựng sẵn một cột cho MỌI điểm đến (ẩn); guide.js hiện 2 – 3 cột theo lựa chọn
 * (?d=phu-quoc,nha-trang,con-dao) – trình duyệt không cần dữ liệu giá phòng / lịch trình.
 * Số liệu cùng hàm với trang điểm đến và trình lập kế hoạch: tripCost (3 ngày), transportOptions (từ Hà Nội / TP.HCM).
 */
const COMPARE_DIR = 'so-sanh'
const COMPARE_DEFAULT = ['phu-quoc', 'nha-trang', 'con-dao']
const compareUrl = (ids = []) => `${SITE_ROOT}${LANG_PREFIX}${COMPARE_DIR}/index.html${ids.length ? `?d=${ids.join(',')}` : ''}`

function compareTitle() {
    return t('So sánh điểm đến Việt Nam: chi phí, mùa đẹp, đường đi')
}

/* Chặng từ một thành phố lớn: phương tiện gợi ý + thời gian + giá vé tiết kiệm */
function compareFrom(hubId, d) {
    if (hubId === d.id) return t('Ngay tại đây')
    const res = transportOptions(getDestination(hubId), d, 'saving')
    const o = res.options.find(x => x.mode === res.recommended) || res.options[0]
    return `<i class="${MODE_ICONS[o.mode]}"></i> ${modeLabel(o)} · ${shortVnd(o.cost)}`
}

function comparePage() {
    const dests = [...DESTINATIONS].sort((a, b) => a.name.localeCompare(b.name, LANG))
    const show = id => COMPARE_DEFAULT.includes(id)
    const cell = (d, html) => `<td data-col="${d.id}"${show(d.id) ? '' : ' hidden'}>${html}</td>`
    const months = d => `<span class="compare-months">${Array.from({ length: 12 }, (_, i) => `<span class="${d.bestMonths.includes(i + 1) ? 'is-good' : ''}">${i + 1}</span>`).join('')}</span>`
    const cost = (d, tier) => shortVnd(tripCost(d.id, 3, tier).total)
    const rows = [
        [t('Miền'), d => REGIONS[d.region]],
        [t('Loại hình'), d => d.categories.map(c => CATEGORIES[c]).join(', ')],
        [t('Đánh giá'), d => `<i class="ri-star-fill"></i> ${d.rating}/5`],
        [t('Tháng đẹp'), months],
        [t('Chi phí 3 ngày 2 đêm / người'), d => `${t('Tiết kiệm')}: <strong>${cost(d, 'saving')}</strong><br>${t('Thoải mái')}: <strong>${cost(d, 'comfort')}</strong>`],
        [t('Từ Hà Nội'), d => compareFrom('ha-noi', d)],
        [t('Từ TP. Hồ Chí Minh'), d => compareFrom('sai-gon', d)],
        [t('Nên ở'), d => d.duration],
        [t('Điểm nhấn'), d => d.highlights.slice(0, 3).join(' · ')],
        [t('Đặc sản'), d => d.foods.slice(0, 3).map(f => f.name).join(', ')],
    ]
    const select = (i, value) => `
        <label class="compare-pick">
            <span>${t('Điểm đến {n}', { n: i + 1 })}</span>
            <select data-compare-pick="${i}">
                ${i === 2 ? `<option value="">${t('— không chọn —')}</option>` : ''}
                ${dests.map(d => `<option value="${d.id}"${d.id === value ? ' selected' : ''}>${d.name}</option>`).join('')}
            </select>
        </label>`
    return `
        <section class="planner-hero guide-hero">
            <div class="container">
                ${breadcrumbHtml([[t('Trang chủ'), homeUrl()]])}
                <span class="guide-hero__icon"><i class="ri-scales-3-line"></i></span>
                <h1 class="planner-hero__title">${compareTitle()}</h1>
                <p class="planner-hero__text">${t('Chọn 2 – 3 điểm đến để xem cạnh nhau: chi phí 3 ngày, tháng đẹp, đường đi từ Hà Nội và TP. Hồ Chí Minh, điểm nhấn, đặc sản.')}</p>
            </div>
        </section>
        <div class="container compare" data-compare>
            <div class="compare-picks">${COMPARE_DEFAULT.map((id, i) => select(i, id)).join('')}</div>
            <div class="compare-scroll">
                <table class="compare-table">
                    <thead>
                        <tr>
                            <th scope="col"><span class="visually-hidden">${t('Tiêu chí')}</span></th>
                            ${dests.map(d => `<th scope="col" data-col="${d.id}"${show(d.id) ? '' : ' hidden'}>
                                <a href="${destinationUrl(d.id)}" class="compare-head">
                                    <img data-wiki="${wikiAttr(heroCandidates(d))}" data-width="480" alt="" loading="lazy">
                                    <span>${d.name}</span>
                                </a>
                            </th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(([label, fn]) => `<tr><th scope="row">${label}</th>${dests.map(d => cell(d, fn(d))).join('')}</tr>`).join('')}
                        <tr><th scope="row"></th>${dests.map(d => cell(d, `<a href="${destinationUrl(d.id)}" class="book-link">${t('Xem chi tiết')} <i class="ri-arrow-right-line"></i></a>`)).join('')}</tr>
                    </tbody>
                </table>
            </div>
            <p class="budget__note">${t('Chi phí là ước tính / người, chưa gồm vé máy bay, tàu xe tới nơi – cùng cách tính với trang điểm đến. Giá chặng đi là mức tiết kiệm.')}</p>
        </div>
    `
}

/* Trang điểm đến: link so sánh với 2 điểm cùng loại hình gần giống nhất */
function compareLinkHtml(d) {
    const others = DESTINATIONS.filter(x => x.id !== d.id)
        .map(x => ({ x, score: x.categories.filter(c => d.categories.includes(c)).length * 2 + (x.region === d.region ? 1 : 0) }))
        .sort((a, b) => b.score - a.score).slice(0, 2).map(o => o.x)
    return `<p class="compare-link"><a href="${compareUrl([d.id, ...others.map(x => x.id)])}"><i class="ri-scales-3-line"></i> ${t('So sánh {name} với {others}', { name: d.name, others: others.map(x => x.name).join(', ') })}</a></p>`
}
