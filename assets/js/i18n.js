/*==================== ĐA NGÔN NGỮ (VI / EN) ====================*/
/*
 * - Ngôn ngữ lấy từ window.SITE_LANG (do trang/build đặt) hoặc thuộc tính lang của <html>.
 * - t('Chuỗi tiếng Việt', { biến }) trả về bản dịch trong TRANSLATION_EN.ui (nếu là trang tiếng Anh).
 * - applyTranslations() ghi đè dữ liệu điểm đến/lịch trình bằng bản dịch – gọi sau khi nạp dữ liệu.
 */
const LANG = (typeof window !== 'undefined' && window.SITE_LANG)
    || (typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'vi')

/* Tiền tố đường dẫn tới các trang HTML của ngôn ngữ hiện tại (tính từ gốc site) */
const LANG_PREFIX = LANG === 'en' ? 'en/' : ''

function t(text, vars = {}) {
    const dict = LANG === 'en' && typeof TRANSLATION_EN !== 'undefined' ? TRANSLATION_EN.ui : null
    const out = (dict && dict[text]) || text
    return out.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m))
}

const MONTHS_SHORT = {
    vi: m => `T${m}`,
    en: m => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1],
}
const monthShort = m => MONTHS_SHORT[LANG](m)

/* Giá trị {m} trong câu "Tháng {m}...": tiếng Việt giữ số, tiếng Anh dùng tên tháng */
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const monthLabel = m => (LANG === 'en' ? MONTHS_EN[m - 1] : m)

/* Ghi đè sâu: chỉ các trường có trong bản dịch được thay; mảng được ghép theo vị trí */
function mergeTranslation(target, source) {
    if (!source) return target
    for (const [key, value] of Object.entries(source)) {
        if (Array.isArray(value) && Array.isArray(target[key])) {
            value.forEach((item, i) => {
                if (item && typeof item === 'object' && target[key][i] && typeof target[key][i] === 'object') {
                    mergeTranslation(target[key][i], item)
                } else if (item != null) {
                    target[key][i] = item
                }
            })
        } else if (value && typeof value === 'object' && target[key] && typeof target[key] === 'object') {
            mergeTranslation(target[key], value)
        } else {
            target[key] = value
        }
    }
    return target
}

function applyTranslations() {
    if (LANG !== 'en' || typeof TRANSLATION_EN === 'undefined') return
    Object.assign(REGIONS, TRANSLATION_EN.regions)
    Object.assign(CATEGORIES, TRANSLATION_EN.categories)
    DESTINATIONS.forEach(d => mergeTranslation(d, TRANSLATION_EN.destinations[d.id]))
    if (typeof ITINERARIES !== 'undefined') {
        /* Trang điểm đến đã build: bản dịch lịch trình nằm trong data/dest/<id>.js (ITINERARIES_EN) */
        const plans = { ...TRANSLATION_EN.itineraries, ...(typeof ITINERARIES_EN !== 'undefined' ? ITINERARIES_EN : {}) }
        Object.entries(plans).forEach(([id, plan]) => {
            if (ITINERARIES[id]) mergeTranslation(ITINERARIES[id], plan)
        })
    }
}
