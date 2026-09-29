/*==================== THÀNH PHẦN DÙNG CHUNG ====================*/
const destinationUrl = id => `destination.html?id=${encodeURIComponent(id)}`

/* Thẻ điểm đến – dùng ở trang chủ và mục "Điểm đến cùng vùng" */
function destinationCard(d) {
    return `
        <a href="${destinationUrl(d.id)}" class="dest-card">
            <div class="dest-card__media">
                <img data-wiki="${d.hero}" data-width="960" alt="${d.name}" class="dest-card__img" loading="lazy">
                <span class="dest-card__region">${REGIONS[d.region]}</span>
                <span class="dest-card__rating"><i class="ri-star-fill"></i> ${d.rating.toFixed(1)}</span>
            </div>
            <div class="dest-card__body">
                <h3 class="dest-card__title">${d.name}</h3>
                <span class="dest-card__province"><i class="ri-map-pin-2-line"></i> ${d.province}</span>
                <p class="dest-card__tagline">${d.tagline}</p>
                <div class="dest-card__tags">
                    ${d.categories.map(c => `<span class="tag">${CATEGORIES[c]}</span>`).join('')}
                </div>
            </div>
            <span class="dest-card__button" aria-hidden="true"><i class="ri-arrow-right-line"></i></span>
        </a>
    `
}
