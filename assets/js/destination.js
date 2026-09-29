/*==================== TRANG CHI TIẾT: LANDING PAGE ĐỘNG THEO ?id= ====================*/
const destRoot = document.getElementById('destination')
const destId = new URLSearchParams(location.search).get('id')
const dest = getDestination(destId)

/*==================== CÁC KHỐI GIAO DIỆN ====================*/
function heroSection(d) {
    return `
        <section class="dest-hero" id="top">
            <img data-wiki="${wikiAttr(heroCandidates(d))}" data-width="1920" alt="${d.name}" class="dest-hero__img">
            <div class="dest-hero__overlay"></div>

            <div class="dest-hero__content container">
                <nav class="breadcrumb" aria-label="Breadcrumb">
                    <a href="index.html">Trang chủ</a>
                    <i class="ri-arrow-right-s-line"></i>
                    <a href="index.html?region=${d.region}#place">${REGIONS[d.region]}</a>
                    <i class="ri-arrow-right-s-line"></i>
                    <span>${d.name}</span>
                </nav>

                <span class="dest-hero__subtitle"><i class="ri-map-pin-2-fill"></i> ${d.province}</span>
                <h1 class="dest-hero__title">${d.name}</h1>
                <p class="dest-hero__tagline">${d.tagline}</p>

                <div class="dest-hero__actions">
                    <a href="#gallery" class="button button--flex">Xem hình ảnh <i class="ri-image-line"></i></a>
                    <a href="#food" class="button button--flex button--ghost">Ẩm thực <i class="ri-restaurant-line"></i></a>
                </div>
            </div>
        </section>

        <div class="container">
            <div class="dest-facts">
                ${fact('ri-star-fill', 'Đánh giá', `${d.rating.toFixed(1)} / 5`)}
                ${fact('ri-calendar-event-line', 'Thời điểm đẹp', d.bestTime)}
                ${fact('ri-time-line', 'Thời gian gợi ý', d.duration)}
                ${fact('ri-compass-3-line', 'Vùng miền', REGIONS[d.region])}
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
                    <span class="section__subtitle">Tổng quan</span>
                    <h2 class="section__title overview__title">Vì sao nên đến ${d.name}?</h2>
                    <p class="overview__description">${d.description}</p>

                    <h3 class="overview__highlights-title">Điểm nhấn không thể bỏ lỡ</h3>
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

function gallerySection(d) {
    const photos = [{ file: d.hero, caption: d.name }, ...d.gallery]
    return `
        <section class="gallery section" id="gallery">
            <span class="section__subtitle">Hình ảnh</span>
            <h2 class="section__title">Vẻ đẹp ${d.name}</h2>

            <div class="gallery__grid container">
                ${photos.map((p, i) => `
                    <button type="button" class="gallery__item${i === 0 ? ' is-featured' : ''}" data-index="${i}" aria-label="Xem ảnh: ${p.caption}">
                        <img data-wiki="${wikiAttr(p.file)}" data-width="960" alt="${p.caption}" class="gallery__img" loading="lazy">
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
            <span class="section__subtitle">Ẩm thực</span>
            <h2 class="section__title">Món ngon phải thử</h2>

            <div class="food__grid container">
                ${d.foods.map(foodCard).join('')}
            </div>
        </section>
    `
}

function foodCard(f) {
    /* Thẻ chữ kiểu thực đơn nằm dưới ảnh: hiện ra khi món chưa có ảnh hoặc ảnh tải lỗi */
    return `
        <article class="food-card">
            <div class="food-card__media">
                <span class="food-card__menu"><small>Đặc sản</small>${f.name}</span>
                ${f.file ? `<img data-wiki="${wikiAttr(f.file)}" data-width="960" alt="${f.name}" class="food-card__img" loading="lazy">` : ''}
                ${f.illustrative ? `<span class="food-card__badge" title="${f.illustrative}">Ảnh minh họa</span>` : ''}
                <span class="food-card__price">${f.price}</span>
            </div>
            <div class="food-card__body">
                <h3 class="food-card__title">${f.name}</h3>
                <p class="food-card__desc">${f.desc}</p>
                ${f.illustrative ? `<span class="food-card__note"><i class="ri-information-line"></i> Ảnh minh họa: ${f.illustrative}</span>` : ''}
            </div>
        </article>
    `
}

function activitiesSection(d) {
    return `
        <section class="activities section" id="activities">
            <span class="section__subtitle">Vui chơi</span>
            <h2 class="section__title">Trải nghiệm đáng nhớ</h2>

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
                <h3 class="tips__title"><i class="ri-lightbulb-flash-line"></i> Kinh nghiệm du lịch</h3>
                <ul class="tips__list">
                    ${d.tips.map(t => `<li class="tip-item">${t}</li>`).join('')}
                </ul>
            </div>` : ''}
        </section>
    `
}

function relatedSection(d) {
    const related = DESTINATIONS.filter(x => x.region === d.region && x.id !== d.id).slice(0, 3)
    if (!related.length) return ''
    return `
        <section class="related section" id="related">
            <span class="section__subtitle">Gợi ý</span>
            <h2 class="section__title">Điểm đến khác ở ${REGIONS[d.region]}</h2>

            <div class="dest__grid container">
                ${related.map(destinationCard).join('')}
            </div>

            <div class="related__more">
                <a href="index.html#place" class="button button--flex">Xem tất cả điểm đến <i class="ri-arrow-right-line"></i></a>
            </div>
        </section>
    `
}

function notFoundSection() {
    return `
        <section class="dest-notfound section">
            <div class="container">
                <i class="ri-map-pin-line dest-notfound__icon"></i>
                <h1 class="section__title">Không tìm thấy điểm đến</h1>
                <p>Điểm đến bạn tìm không tồn tại hoặc đã bị đổi tên.</p>
                <a href="index.html#place" class="button">Quay lại danh sách điểm đến</a>
            </div>
        </section>
    `
}

/*==================== GALLERY: LẤP ĐẦY HÀNG CUỐI ====================*/
/*
 * Ảnh nổi bật chiếm 2x2 ô. Vùng bên cạnh nó rộng (số cột - 2) và cao 2 hàng;
 * phần còn lại xếp thành các hàng đầy đủ. Nới rộng vài ảnh cuối để không còn ô trống.
 */
function balanceGallery() {
    const grid = document.querySelector('.gallery__grid')
    if (!grid) return

    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length
    const items = [...grid.querySelectorAll('.gallery__item:not(.is-broken)')]
    items.forEach(item => {
        item.classList.remove('is-wide', 'is-full')
        item.style.gridColumn = item.style.gridRow = ''
    })

    const rest = items.filter(item => !item.classList.contains('is-featured'))
    const sideCols = Math.max(cols - 2, 0)
    const sideSlots = sideCols * 2

    if (rest.length === 1 && sideCols > 0) {
        /* Chỉ còn 1 ảnh phụ: cho nó lấp trọn vùng bên cạnh ảnh nổi bật */
        rest[0].style.gridColumn = `span ${sideCols}`
        rest[0].style.gridRow = 'span 2'
        return
    }

    if (rest.length < sideSlots) {
        /* Không đủ ảnh lấp vùng bên cạnh: chỉ nới được khi vùng này rộng 2 cột */
        if (sideCols === 2) {
            const extra = sideSlots - rest.length
            rest.slice(-extra).forEach(item => item.classList.add('is-wide'))
        }
        return
    }

    const tail = rest.slice(sideSlots)
    const lastRow = tail.length % cols
    if (lastRow === 0) return
    if (lastRow === 1) {
        tail[tail.length - 1].classList.add('is-full')
    } else {
        tail.slice(-(cols - lastRow)).forEach(item => item.classList.add('is-wide'))
    }
}

/*==================== LIGHTBOX ====================*/
function initLightbox(photos) {
    const box = document.getElementById('lightbox'),
          img = document.getElementById('lightbox-img'),
          caption = document.getElementById('lightbox-caption'),
          credit = document.getElementById('lightbox-credit')
    let current = 0

    const items = [...document.querySelectorAll('.gallery__item')]
    const isBroken = i => items[i] && items[i].classList.contains('is-broken')

    function show(index, step = 1) {
        current = (index + photos.length) % photos.length
        /* Bỏ qua ảnh đã tải lỗi trong gallery */
        for (let tries = 0; isBroken(current) && tries < photos.length; tries++) {
            current = (current + step + photos.length) % photos.length
        }
        const photo = photos[current]
        img.src = wikiImg(photo.file, 1920)
        img.alt = photo.caption
        caption.textContent = `${photo.caption} (${current + 1}/${photos.length})`
        credit.href = wikiPage(photo.file)
    }

    function open(index) {
        show(index)
        box.hidden = false
        document.body.classList.add('no-scroll')
    }

    function close() {
        box.hidden = true
        document.body.classList.remove('no-scroll')
    }

    items.forEach(item => {
        item.addEventListener('click', () => open(Number(item.dataset.index)))
        /* Ảnh gallery lỗi: ẩn khỏi lưới thay vì hiện khung trống */
        item.addEventListener('wiki:failed', () => {
            item.classList.add('is-broken')
            if (item.classList.contains('is-featured')) {
                item.classList.remove('is-featured')
                const next = items.find(x => !x.classList.contains('is-broken'))
                if (next) next.classList.add('is-featured')
            }
            balanceGallery()
        })
    })
    img.addEventListener('error', () => {
        if (!box.hidden) caption.textContent = 'Không tải được ảnh này.'
    })
    document.getElementById('lightbox-close').addEventListener('click', close)
    document.getElementById('lightbox-prev').addEventListener('click', () => show(current - 1, -1))
    document.getElementById('lightbox-next').addEventListener('click', () => show(current + 1))
    box.addEventListener('click', e => { if (e.target === box) close() })

    document.addEventListener('keydown', e => {
        if (box.hidden) return
        if (e.key === 'Escape') close()
        if (e.key === 'ArrowLeft') show(current - 1, -1)
        if (e.key === 'ArrowRight') show(current + 1)
    })
}

/*==================== RENDER ====================*/
if (dest) {
    document.title = `${dest.name} – Việt Travel`
    destRoot.innerHTML = [
        heroSection(dest),
        overviewSection(dest),
        gallerySection(dest),
        foodSection(dest),
        activitiesSection(dest),
        relatedSection(dest),
    ].join('')
    initLightbox([{ file: dest.hero, caption: dest.name }, ...dest.gallery])
    balanceGallery()
    window.addEventListener('resize', balanceGallery)
} else {
    document.title = 'Không tìm thấy điểm đến – Việt Travel'
    destRoot.innerHTML = notFoundSection()
    document.getElementById('header').classList.add('header--solid')
}

hydrateWikiImages(destRoot)
