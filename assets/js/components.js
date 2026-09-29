/*==================== THÀNH PHẦN DÙNG CHUNG ====================*/
/* Trang tĩnh của điểm đến (sinh bởi `npm run build`) */
const destinationUrl = id => `${SITE_ROOT}diem-den/${encodeURIComponent(id)}/index.html`

/* Thẻ điểm đến – dùng ở trang chủ và mục "Điểm đến cùng vùng" */
function favoriteButton(id, { withLabel = false } = {}) {
    return `
        <button type="button" class="fav-btn${withLabel ? ' fav-btn--labeled' : ''}" data-favorite="${id}" aria-pressed="false" title="Lưu vào yêu thích">
            <i class="ri-heart-3-line fav-btn__off"></i><i class="ri-heart-3-fill fav-btn__on"></i>
            ${withLabel ? '<span class="fav-btn__label">Lưu yêu thích</span>' : ''}
        </button>
    `
}

function destinationCard(d, hint = '') {
    return `
        <div class="dest-card-wrap">
            <a href="${destinationUrl(d.id)}" class="dest-card">
                <div class="dest-card__media">
                    <img data-wiki="${wikiAttr(heroCandidates(d))}" data-width="960" alt="${d.name}" class="dest-card__img" loading="lazy">
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
