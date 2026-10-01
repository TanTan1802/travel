/*==================== ĐA NGÔN NGỮ (VI / EN / KO / ZH / JA) ====================*/
/*
 * - Ngôn ngữ lấy từ window.SITE_LANG (do trang/build đặt) hoặc thuộc tính lang của <html>.
 * - t('Chuỗi tiếng Việt', { biến }) trả về bản dịch trong TRANSLATION_EN.ui (trang không phải tiếng Việt).
 * - Trang ko/zh/ja nạp thêm data/i18n/<lang>.js (TRANSLATION_LOCAL) phủ lên bản tiếng Anh:
 *   chuỗi chưa dịch sẽ hiện tiếng Anh.
 * - applyTranslations() ghi đè dữ liệu điểm đến/lịch trình bằng bản dịch – gọi sau khi nạp dữ liệu.
 */
const SITE_LANGS = ['vi', 'en', 'ko', 'zh', 'ja']
const LANG = (typeof window !== 'undefined' && window.SITE_LANG)
    || (typeof document !== 'undefined' && SITE_LANGS.find(l => l !== 'vi' && document.documentElement.lang === l))
    || 'vi'

/* Tiền tố đường dẫn tới các trang HTML của một ngôn ngữ (tính từ gốc site) */
const langPrefix = lang => (lang === 'vi' ? '' : `${lang}/`)
const LANG_PREFIX = langPrefix(LANG)

if (typeof TRANSLATION_LOCAL !== 'undefined' && typeof TRANSLATION_EN !== 'undefined') {
    ;['ui', 'html', 'regions', 'categories'].forEach(key => {
        if (TRANSLATION_LOCAL[key]) TRANSLATION_EN[key] = { ...TRANSLATION_EN[key], ...TRANSLATION_LOCAL[key] }
    })
    Object.entries(TRANSLATION_LOCAL.destinations || {}).forEach(([id, d]) => {
        TRANSLATION_EN.destinations[id] = { ...TRANSLATION_EN.destinations[id], ...d }
    })
}

function t(text, vars = {}) {
    const dict = LANG !== 'vi' && typeof TRANSLATION_EN !== 'undefined' ? TRANSLATION_EN.ui : null
    const out = (dict && dict[text]) || text
    return out.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m))
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/* Tên tháng ngắn (nhãn lịch) và đầy đủ (giá trị {m} trong câu "Tháng {m}...") theo ngôn ngữ */
const MONTH_NAMES = {
    vi: { short: m => `T${m}`, long: m => m },
    en: { short: m => MONTHS_EN[m - 1].slice(0, 3), long: m => MONTHS_EN[m - 1] },
    ko: { short: m => `${m}월`, long: m => `${m}월` },
    zh: { short: m => `${m}月`, long: m => `${m}月` },
    ja: { short: m => `${m}月`, long: m => `${m}月` },
}
const monthShort = m => MONTH_NAMES[LANG].short(m)
const monthLabel = m => MONTH_NAMES[LANG].long(m)

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
    if (LANG === 'vi' || typeof TRANSLATION_EN === 'undefined') return
    Object.assign(REGIONS, TRANSLATION_EN.regions)
    Object.assign(CATEGORIES, TRANSLATION_EN.categories)
    DESTINATIONS.forEach(d => mergeTranslation(d, TRANSLATION_EN.destinations[d.id]))
    if (typeof ITINERARIES !== 'undefined') {
        /* Trang điểm đến đã build: bản dịch lịch trình nằm trong data/dest/<id>.js (ITINERARIES_EN) */
        const plans = { ...TRANSLATION_EN.itineraries, ...(typeof ITINERARIES_EN !== 'undefined' ? ITINERARIES_EN : {}) }
        const local = typeof TRANSLATION_LOCAL !== 'undefined' ? TRANSLATION_LOCAL.itineraries || {} : {}
        ;[plans, local].forEach(set => Object.entries(set).forEach(([id, plan]) => {
            if (ITINERARIES[id]) mergeTranslation(ITINERARIES[id], plan)
        }))
    }
}
