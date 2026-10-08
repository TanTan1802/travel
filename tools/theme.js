/*
 * Giao diện & mùa (data/site.json): kiểm tra độ tương phản màu, chọn mùa theo ngày, dựng chữ slogan.
 * Dùng chung cho tools/build-data.js (kiểm tra) và tools/build.js (sinh trang).
 * Trang quản trị (admin/admin.js) có bản sao các hàm contrastIssues / seasonActive – sửa thì sửa cả hai.
 */
const LANG_CODES = ['vi', 'en', 'ko', 'zh', 'ja']
const DEFAULT_THEME = { hue: 190, accentHue: 38 }
/* WCAG AA cho chữ thường */
const MIN_CONTRAST = 4.5

function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360
    s /= 100
    l /= 100
    const k = n => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
    return [f(0), f(8), f(4)]
}

const luminance = rgb => {
    const [r, g, b] = rgb.map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
}

/*
 * Các cặp chữ / nền dựng từ --hue-color và --accent-hue (assets/css/styles.css, vietnam.css).
 * Trả về danh sách cặp không đạt 4.5:1 (rỗng = dùng được).
 */
function contrastIssues({ hue, accentHue }) {
    const white = [1, 1, 1]
    const pairs = [
        ['Nút / chữ trắng trên màu chủ đạo', hslToRgb(hue, 64, 22), white],
        ['Tiêu đề trên nền sáng', hslToRgb(hue, 64, 18), hslToRgb(hue, 100, 99)],
        ['Chữ thường trên nền sáng', hslToRgb(hue, 24, 35), hslToRgb(hue, 100, 99)],
        ['Chữ nhấn trên nền sáng', hslToRgb(accentHue - 5, 90, 31), hslToRgb(hue, 100, 99)],
        ['Chữ nhấn trên thẻ trắng', hslToRgb(accentHue - 6, 90, 34), white],
        ['Chữ nhấn trên nền tối', hslToRgb(accentHue, 92, 55), hslToRgb(hue, 29, 16)],
        ['Chữ thường trên nền tối', hslToRgb(hue, 8, 75), hslToRgb(hue, 29, 12)],
    ]
    return pairs.map(([label, fg, bg]) => ({ label, ratio: contrast(fg, bg) }))
        .filter(p => p.ratio < MIN_CONTRAST)
        .map(p => `${p.label}: ${p.ratio.toFixed(2)}:1 (cần ≥ ${MIN_CONTRAST}:1)`)
}

/*
 * Logo nón lá dạng SVG độc lập (favicon): nền chuyển từ màu chủ đạo sang màu nhấn – cùng hình với logo
 * trên thanh menu (home.html…, màu lấy từ CSS). hue/accentHue là số hoặc chuỗi giữ chỗ ('{h}', '{a}').
 */
function logoSvg(hue, accentHue) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="hsl(${hue},64%,30%)"/><stop offset="1" stop-color="hsl(${accentHue},90%,50%)"/></linearGradient></defs>` +
        `<circle cx="20" cy="20" r="20" fill="url(#g)"/><path d="M7.5 23.5 20 8.5l12.5 15z" fill="#fff"/>` +
        `<path d="M14 23.5 20 8.5l6 15M10.5 19.8h19M13.3 16.4h13.4" fill="none" stroke="hsl(${hue},55%,40%)" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>` +
        `<path d="M5.5 23.8q14.5 6.4 29 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>` +
        `<path d="M9 30.5q2.75-2 5.5 0t5.5 0 5.5 0 5.5 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/></svg>`
}

/* Mùa có hiệu lực vào ngày iso (YYYY-MM-DD)? from/to dạng MM-DD (lặp lại hằng năm, được vắt qua năm mới) hoặc YYYY-MM-DD */
function seasonActive(season, iso) {
    if (season.from.length > 5) return iso >= season.from && iso <= season.to
    const md = iso.slice(5, 10)
    return season.from <= season.to ? md >= season.from && md <= season.to : md >= season.from || md <= season.to
}

/* Chữ theo ngôn ngữ, thiếu thì dùng tiếng Anh (vi, en bắt buộc) */
const pickText = (map, lang) => (map ? map[lang] || map.en || map.vi || '' : '')

const escapeHtml = text => String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/* Slogan: xuống dòng = <br>, *chữ* = in đậm (màu nhấn) */
const sloganHtml = text => escapeHtml(text.trim())
    .replace(/\*([^*]+)\*/g, '<b>$1</b>')
    .replace(/\s*\n\s*/g, ' <br> ')

module.exports = { logoSvg, LANG_CODES, DEFAULT_THEME, MIN_CONTRAST, contrastIssues, seasonActive, pickText, sloganHtml, escapeHtml }
