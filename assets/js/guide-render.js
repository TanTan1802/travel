/*==================== CẨM NANG: HÀM RENDER (dùng cả khi build trang tĩnh) ====================*/
const GUIDE_DIR = 'cam-nang'
const guideUrl = slug => `${SITE_ROOT}${LANG_PREFIX}${GUIDE_DIR}/${slug}/index.html`
const guidesIndexUrl = () => `${SITE_ROOT}${LANG_PREFIX}${GUIDE_DIR}/index.html`
const getGuide = slug => GUIDES.find(g => g.slug === slug)

function guideCard(g) {
    return `
        <a href="${guideUrl(g.slug)}" class="guide-card">
            <span class="guide-card__icon"><i class="${g.icon}"></i></span>
            <h3 class="guide-card__title">${pickLang(g.title)}</h3>
            <p class="guide-card__summary">${pickLang(g.summary)}</p>
            <span class="guide-card__more">${t('Đọc bài')} <i class="ri-arrow-right-line"></i></span>
        </a>
    `
}

/* Mục "Cẩm nang" trên trang chủ */
function homeGuidesSection() {
    return `
        <section class="guides-home section" id="guides">
            <span class="section__subtitle">${t('Cẩm nang')}</span>
            <h2 class="section__title">${t('Chuẩn bị cho chuyến đi')}</h2>
            <div class="guides__grid container">
                ${GUIDES.slice(0, 3).map(guideCard).join('')}
            </div>
            <div class="guides-home__more">
                <a href="${guidesIndexUrl()}" class="button button--flex">${t('Xem tất cả cẩm nang')} <i class="ri-arrow-right-line"></i></a>
            </div>
        </section>
    `
}

/* Trang danh sách cẩm nang */
function guidesIndexPage() {
    return `
        <section class="planner-hero">
            <div class="container">
                <span class="section__subtitle">${t('Cẩm nang')}</span>
                <h1 class="planner-hero__title">${t('Cẩm nang du lịch Việt Nam')}</h1>
                <p class="planner-hero__text">${t('Thời điểm đẹp, di chuyển, chi phí, ẩm thực, giấy tờ và an toàn – những điều nên biết trước khi lên đường.')}</p>
            </div>
        </section>
        <section class="section container">
            <div class="guides__grid">${GUIDES.map(guideCard).join('')}</div>
        </section>
    `
}

/* Bảng tháng nào đi đâu – tự sinh từ bestMonths của các điểm đến */
function monthsWidget() {
    return `
        <div class="months-table">
            ${Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                const picks = DESTINATIONS.filter(d => d.bestMonths.includes(m))
                return `
                    <div class="months-table__row">
                        <strong class="months-table__month">${typeof monthUrl === 'function'
                            ? `<a href="${monthUrl(m)}">${t('Tháng {m}', { m: monthLabel(m) })}</a>`
                            : t('Tháng {m}', { m: monthLabel(m) })}</strong>
                        <div class="months-table__places">
                            ${picks.map(d => `<a href="${destinationUrl(d.id)}" class="tag tag--${d.region}">${d.name}</a>`).join('')}
                        </div>
                    </div>
                `
            }).join('')}
        </div>
    `
}

/*
 * Lịch du lịch 12 tháng: mỗi điểm đến một hàng, mỗi tháng một ô, tự sinh từ dữ liệu
 * - xanh (nên đi): tháng trong bestMonths – nhãn là mùa cảnh sắc / lễ hội có nhãn ngắn (short)
 * - đỏ (hạn chế): thời tiết nặng (severe: bão, lũ, biển động) ngoài mùa đẹp
 * - vàng (cân nhắc): thời tiết cần lưu ý, thời tiết nặng rơi vào mùa đẹp, hoặc ngoài mùa đẹp (nhãn là mùa hoa / lễ hội nếu có)
 * Các tháng liền nhau cùng trạng thái + nhãn được gộp thành một dải (colspan); dải 1 tháng chỉ hiện biểu tượng
 * (nhãn trong title và cho trình đọc màn hình).
 */
const CAL_STATUS = {
    good: { icon: 'ri-checkbox-circle-fill', label: () => t('Nên đi') },
    caution: { icon: 'ri-error-warning-fill', label: () => t('Cân nhắc') },
    avoid: { icon: 'ri-close-circle-fill', label: () => t('Hạn chế') },
}

function calendarCell(d, m) {
    const here = (typeof EVENTS !== 'undefined' ? EVENTS : []).filter(e => e.where !== 'all' && e.where.includes(d.id) && eventMonths(e).includes(m))
    const weather = here.filter(e => e.type === 'weather')
    const severe = weather.find(e => e.severe)
    const best = d.bestMonths.includes(m)
    const short = e => pickLang(e.short || e.name)
    const scene = here.find(e => e.type === 'nature' && e.short) || here.find(e => e.type === 'festival' && e.short)
    if (best && !severe) return { status: 'good', label: scene ? short(scene) : t('Mùa đẹp') }
    if (severe) return { status: best ? 'caution' : 'avoid', label: short(severe) }
    if (weather.length) return { status: 'caution', label: short(weather[0]) }
    /* Ngoài mùa đẹp nhưng có mùa hoa / lễ hội riêng (vd. hoa đào Hà Giang tháng 2 – 3) → vẫn đáng cân nhắc */
    return { status: 'caution', label: scene ? short(scene) : t('Ngoài mùa đẹp') }
}

/* Gộp các tháng liền nhau giống nhau: [{ status, label, from, span }] */
function calendarRow(d) {
    const segs = []
    for (let m = 1; m <= 12; m++) {
        const cell = calendarCell(d, m)
        const last = segs[segs.length - 1]
        if (last && last.status === cell.status && last.label === cell.label) last.span++
        else segs.push({ ...cell, from: m, span: 1 })
    }
    return segs
}

function calendarWidget() {
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const range = seg => (seg.span === 1 ? t('Tháng {m}', { m: monthLabel(seg.from) })
        : t('Tháng {from} – {to}', { from: monthLabel(seg.from), to: monthLabel(seg.from + seg.span - 1) }))
    const regions = Object.keys(REGIONS).map(region => [region, DESTINATIONS.filter(d => d.region === region).sort((a, b) => b.lat - a.lat)])
    return `
        <div class="travel-cal">
            <ul class="travel-cal__legend">
                ${Object.entries(CAL_STATUS).map(([key, s]) => `<li class="travel-cal__key travel-cal__seg--${key}"><i class="${s.icon}"></i> ${s.label()}</li>`).join('')}
            </ul>
            <p class="travel-cal__hint">${t('Kéo ngang để xem đủ 12 tháng. Bấm tên điểm đến để xem lịch trình, bấm tháng để xem nên đi đâu.')}</p>
            <div class="travel-cal__scroll" tabindex="0" role="region" aria-label="${t('Lịch du lịch 12 tháng')}">
                <table class="travel-cal__table">
                    <thead>
                        <tr>
                            <th scope="col" class="travel-cal__name">${t('Điểm đến')}</th>
                            ${months.map(m => `<th scope="col" class="travel-cal__month" data-cal-month="${m}">${typeof monthUrl === 'function' ? `<a href="${monthUrl(m)}">${monthShort(m)}</a>` : monthShort(m)}</th>`).join('')}
                        </tr>
                    </thead>
                    ${regions.map(([region, list]) => `
                        <tbody>
                            <tr><th scope="rowgroup" colspan="13" class="travel-cal__region">${REGIONS[region]}</th></tr>
                            ${list.map(d => `
                                <tr>
                                    <th scope="row" class="travel-cal__name"><a href="${destinationUrl(d.id)}">${d.name}</a></th>
                                    ${calendarRow(d).map(seg => `
                                        <td colspan="${seg.span}" class="travel-cal__seg travel-cal__seg--${seg.status}" title="${range(seg)}: ${CAL_STATUS[seg.status].label()} – ${seg.label}">
                                            <span><i class="${CAL_STATUS[seg.status].icon}" aria-label="${CAL_STATUS[seg.status].label()}"></i> ${seg.span > 1 ? seg.label : `<span class="visually-hidden">${seg.label}</span>`}</span>
                                        </td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    `).join('')}
                </table>
            </div>
        </div>
    `
}

const GUIDE_WIDGETS = { months: monthsWidget, calendar: calendarWidget }

function guideSection(section, i) {
    return `
        <section class="guide-section" id="muc-${i + 1}">
            <h2 class="guide-section__title">${pickLang(section.heading)}</h2>
            ${(section.paragraphs || []).map(p => `<p>${pickLang(p)}</p>`).join('')}
            ${section.list ? `<ul class="guide-section__list">${section.list.map(item => `<li>${pickLang(item)}</li>`).join('')}</ul>` : ''}
            ${section.widget && GUIDE_WIDGETS[section.widget] ? GUIDE_WIDGETS[section.widget]() : ''}
        </section>
    `
}

/* Trang một bài cẩm nang */
function guideArticlePage(g) {
    const related = (g.related || []).map(getDestination).filter(Boolean)
    const others = GUIDES.filter(x => x.slug !== g.slug)
    const [year, month] = GUIDE_UPDATED.split('-').map(Number)
    return `
        <section class="planner-hero guide-hero">
            <div class="container">
                <nav class="breadcrumb" aria-label="Breadcrumb">
                    <a href="${homeUrl()}">${t('Trang chủ')}</a>
                    <i class="ri-arrow-right-s-line"></i>
                    <a href="${guidesIndexUrl()}">${t('Cẩm nang')}</a>
                </nav>
                <span class="guide-hero__icon"><i class="${g.icon}"></i></span>
                <h1 class="planner-hero__title">${pickLang(g.title)}</h1>
                <p class="planner-hero__text">${pickLang(g.summary)}</p>
                <p class="guide-hero__updated">${t('Cập nhật: tháng {m}/{y}', { m: month, y: year })}</p>
            </div>
        </section>

        <div class="guide container">
            <aside class="guide__toc">
                <strong>${t('Nội dung')}</strong>
                <ol>${g.sections.map((s, i) => `<li><a href="#muc-${i + 1}">${pickLang(s.heading)}</a></li>`).join('')}</ol>
            </aside>
            <article class="guide__body">
                ${g.sections.map(guideSection).join('')}
                <p class="budget__note">${t('Thông tin mang tính tham khảo và có thể thay đổi – hãy kiểm tra nguồn chính thức trước chuyến đi.')}</p>
            </article>
        </div>

        ${related.length ? `
            <section class="section">
                <h2 class="section__title">${t('Điểm đến liên quan')}</h2>
                <div class="dest__grid container">${related.map(d => destinationCard(d)).join('')}</div>
            </section>
        ` : ''}

        <section class="section container">
            <h2 class="section__title">${t('Cẩm nang khác')}</h2>
            <div class="guides__grid">${others.map(guideCard).join('')}</div>
        </section>
    `
}
