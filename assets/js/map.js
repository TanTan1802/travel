/*==================== BẢN ĐỒ (LEAFLET + OPENSTREETMAP) ====================*/
const VIETNAM_CENTER = [16.2, 106.5]

/* Nhãn chủ quyền biển đảo Việt Nam hiển thị trên mọi bản đồ */
const SOVEREIGNTY_LABELS = [
    { name: 'Quần đảo Hoàng Sa (Việt Nam)', lat: 16.5, lng: 112.0 }, // tên được dịch khi hiển thị
    { name: 'Quần đảo Trường Sa (Việt Nam)', lat: 10.2, lng: 114.3 },
]

const mapAvailable = () => typeof L !== 'undefined'

function createMap(el, { center = VIETNAM_CENTER, zoom = 5, scrollWheelZoom = false } = {}) {
    const map = L.map(el, { center, zoom, scrollWheelZoom, minZoom: 4 })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map)

    SOVEREIGNTY_LABELS.forEach(label => {
        L.marker([label.lat, label.lng], {
            interactive: false,
            keyboard: false,
            icon: L.divIcon({ className: 'map-label', html: `<span>${t(label.name)}</span>`, iconSize: null }),
        }).addTo(map)
    })

    /* Chỉ cho cuộn chuột phóng to khi người dùng đã bấm vào bản đồ */
    if (!scrollWheelZoom) {
        map.on('click', () => map.scrollWheelZoom.enable())
        map.on('mouseout', () => map.scrollWheelZoom.disable())
    }
    return map
}

function pinIcon(region, { active = false } = {}) {
    return L.divIcon({
        className: `map-pin map-pin--${region}${active ? ' map-pin--active' : ''}`,
        html: '<span></span>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -26],
    })
}

function destinationPopup(d, extra = '') {
    return `
        <a href="${destinationUrl(d.id)}" class="map-popup">
            <span class="map-popup__media">
                <img data-wiki="${wikiAttr(heroCandidates(d))}" data-width="500" alt="${d.name}">
            </span>
            <span class="map-popup__body">
                <strong>${d.name}</strong>
                <small>${d.province} · ${REGIONS[d.region]}${extra}</small>
                <em>${t('Xem chi tiết')} <i class="ri-arrow-right-line"></i></em>
            </span>
        </a>
    `
}

/* Popup chứa ảnh: gán src khi popup mở */
function bindDestinationPopup(marker, d, extra) {
    marker.bindPopup(destinationPopup(d, extra), { minWidth: 220, maxWidth: 240 })
    marker.on('popupopen', e => hydrateWikiImages(e.popup.getElement()))
    return marker
}

/* Chạy callback khi phần tử xuất hiện trên màn hình (tránh tải bản đồ khi chưa cần) */
function whenVisible(el, callback) {
    if (!('IntersectionObserver' in window)) return callback()
    const observer = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) {
            observer.disconnect()
            callback()
        }
    }, { rootMargin: '200px' })
    observer.observe(el)
}

function showMapUnavailable(el) {
    el.classList.add('map--unavailable')
    el.innerHTML = `<p><i class="ri-map-2-line"></i> ${t('Không tải được bản đồ. Vui lòng kiểm tra kết nối mạng.')}</p>`
}
