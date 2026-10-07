/*==================== HÀM DÙNG CHUNG CHO MỌI TRANG ====================*/
/*
 * Tách khỏi các file dữ liệu (assets/js/data/*.js giờ được sinh tự động từ data/*.json).
 * Nạp ngay sau assets/js/data/destinations.js.
 */

/*---------- Ảnh Wikimedia Commons / ảnh đã tải về repo ----------*/
/*
 * Ảnh được lấy từ Wikimedia Commons (giấy phép Creative Commons).
 * Mỗi ảnh chỉ cần khai báo đúng tên file trên Commons; hàm wikiImg() sẽ tạo
 * đường dẫn tới bản thu nhỏ độ phân giải cao, còn wikiPage() trỏ về trang
 * thông tin bản quyền của ảnh.
 */
const WIKI_BASE = 'https://commons.wikimedia.org/wiki/'

/* Đường dẫn gốc của site so với trang hiện tại (vd: "../../" cho trang diem-den/<id>/) */
const SITE_ROOT = (typeof window !== 'undefined' && window.SITE_ROOT) || ''

/*
 * Ảnh đã tải về máy (sinh bởi tools/download-images.js, khai báo trong local-images.js)
 * được ưu tiên dùng; nếu chưa có thì lấy trực tiếp từ Wikimedia Commons.
 */
const localImage = file => (typeof LOCAL_IMAGES !== 'undefined' && LOCAL_IMAGES[file]) || null

function wikiImg(file, width = 1280) {
    const local = localImage(file)
    if (local) return SITE_ROOT + (width > 960 ? local.lg : width > 500 && local.sm ? local.sm : local.xs || local.sm)
    return `${WIKI_BASE}Special:FilePath/${encodeURIComponent(file)}?width=${width}`
}

/*
 * srcset cho ảnh đã tối ưu (WebP 480/960/1920 theo cạnh dài) – trình duyệt tự chọn ảnh vừa với màn hình.
 * Mô tả bằng chiều rộng thật (ảnh dọc/ảnh gốc nhỏ hẹp hơn 480/960/1920), bỏ cỡ trùng nhau.
 */
function wikiSrcset(file) {
    const local = localImage(file)
    if (!local || !local.xs) return ''
    const long = Math.max(local.w || 0, local.h || 0)
    const widthAt = box => (!long || long <= box ? local.w || box : Math.round(local.w * box / long))
    const seen = new Set()
    return [['xs', 480], ['sm', 960], ['lg', 1920]]
        .map(([key, box]) => [key, widthAt(box)])
        .filter(([, w]) => !seen.has(w) && seen.add(w))
        .map(([key, w]) => `${SITE_ROOT}${local[key]} ${w}w`).join(', ')
}

/* Chiều rộng hiển thị ước tính theo vị trí ảnh (data-width) */
function imageSizes(width) {
    if (width >= 1920) return '100vw'
    if (width >= 960) return '(max-width: 768px) 100vw, 50vw'
    return '(max-width: 768px) 50vw, 320px'
}

function wikiPage(file) {
    return `${WIKI_BASE}File:${encodeURIComponent(file.replace(/ /g, '_'))}`
}

/*---------- Điểm đến ----------*/
function getDestination(id) {
    return DESTINATIONS.find(d => d.id === id)
}

/* Khoảng cách đường chim bay (km) giữa hai điểm đến – công thức Haversine */
function distanceKm(a, b) {
    const rad = deg => deg * Math.PI / 180
    const dLat = rad(b.lat - a.lat)
    const dLng = rad(b.lng - a.lng)
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
    return 2 * 6371 * Math.asin(Math.sqrt(h))
}

/* Các điểm đến gần nhất, kèm khoảng cách */
function nearestDestinations(dest, count = 3) {
    return DESTINATIONS
        .filter(d => d.id !== dest.id)
        .map(d => ({ d, km: distanceKm(dest, d) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, count)
}

/*=============== ẢNH NHIỀU TẦNG DỰ PHÒNG ===============*/
/* Ảnh đại diện của điểm đến: nếu ảnh bìa lỗi sẽ lần lượt thử các ảnh trong gallery */
function heroCandidates(dest) {
    return [dest.hero, ...dest.gallery.map(g => g.file)]
}

/* Chuỗi dùng cho thuộc tính data-wiki (các ảnh dự phòng ngăn cách bởi "|") */
function wikiAttr(files) {
    return (Array.isArray(files) ? files : [files]).join('|').replace(/"/g, '&quot;')
}

function markImgFallback(img) {
    img.classList.add('img--hidden')
    if (img.parentElement) img.parentElement.classList.add('img-fallback')
    img.dispatchEvent(new CustomEvent('wiki:failed', { bubbles: true }))
}

/*
 * Gán src cho các <img data-wiki="a.jpg|b.jpg" data-width="1280">.
 * Khi một ảnh lỗi, tự động chuyển sang ảnh kế tiếp; hết ảnh thì hiện khung thay thế.
 */
function hydrateWikiImages(root = document) {
    root.querySelectorAll('img[data-wiki]:not([data-hydrated])').forEach(img => {
        const files = img.dataset.wiki.split('|').filter(Boolean)
        const width = Number(img.dataset.width) || 1280
        let index = 0

        img.dataset.hydrated = ''
        const load = file => {
            const srcset = wikiSrcset(file)
            if (srcset) {
                img.sizes = img.dataset.sizes || imageSizes(width)
                img.srcset = srcset
            } else {
                img.removeAttribute('srcset')
            }
            img.src = wikiImg(file, width)
        }

        img.addEventListener('error', () => {
            index++
            if (index < files.length) load(files[index])
            else markImgFallback(img)
        })
        if (!img.hasAttribute('decoding')) img.decoding = 'async'
        if ('priority' in img.dataset) img.fetchPriority = 'high'
        else if (!img.hasAttribute('loading')) img.loading = 'lazy'
        load(files[0])
    })
}

/*---------- Lễ hội & sự kiện (dữ liệu: EVENTS, EVENT_TYPES) ----------*/
/* 'MM-DD' của một ngày ISO */
const monthDay = iso => iso.slice(5, 10)

/* Sự kiện có diễn ra vào ngày ISO này không */
function eventOnDate(e, iso) {
    if (e.dates) {
        const md = monthDay(iso)
        return md >= e.dates[0] && md <= e.dates[1]
    }
    return e.months.includes(Number(iso.slice(5, 7)))
}

/* Sự kiện có trong tháng này không (dates được tính theo tháng bắt đầu → kết thúc) */
function eventInMonth(e, month) {
    if (e.months) return e.months.includes(month)
    const from = Number(e.dates[0].slice(0, 2))
    const to = Number(e.dates[1].slice(0, 2))
    return month >= from && month <= to
}

const eventAt = (e, destId) => e.where === 'all' || e.where.includes(destId)

/* Tháng đại diện để sắp xếp và hiển thị */
const eventMonths = e => (e.months ? e.months : Array.from(
    { length: Number(e.dates[1].slice(0, 2)) - Number(e.dates[0].slice(0, 2)) + 1 },
    (_, i) => Number(e.dates[0].slice(0, 2)) + i,
))

/* Sự kiện riêng của điểm đến (không gồm nghỉ lễ toàn quốc), sắp theo tháng */
function destinationEvents(destId, { includeNational = false } = {}) {
    return EVENTS
        .filter(e => (includeNational ? eventAt(e, destId) : e.where !== 'all' && e.where.includes(destId)))
        .sort((a, b) => eventMonths(a)[0] - eventMonths(b)[0])
}

/* Sự kiện trùng các ngày (hoặc tháng) của một chuyến đi tại điểm đến */
function eventsForTrip(destId, { dates = [], month = 0 } = {}) {
    return EVENTS.filter(e => eventAt(e, destId) && (dates.length
        ? dates.some(d => eventOnDate(e, d))
        : month && eventInMonth(e, month)))
}
