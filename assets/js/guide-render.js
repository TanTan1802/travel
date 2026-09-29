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
                        <strong class="months-table__month">${t('Tháng {m}', { m: monthLabel(m) })}</strong>
                        <div class="months-table__places">
                            ${picks.map(d => `<a href="${destinationUrl(d.id)}" class="tag tag--${d.region}">${d.name}</a>`).join('')}
                        </div>
                    </div>
                `
            }).join('')}
        </div>
    `
}

const GUIDE_WIDGETS = { months: monthsWidget }

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
