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
 * Logo hoa sen + sao vàng dạng SVG độc lập (favicon): nền chuyển từ màu chủ đạo sang màu nhấn – cùng hình với logo
 * trên thanh menu (home.html…, màu lấy từ CSS). hue/accentHue là số hoặc chuỗi giữ chỗ ('{h}', '{a}').
 */
function logoSvg(hue, accentHue) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="hsl(${hue},64%,30%)"/><stop offset="1" stop-color="hsl(${accentHue},90%,50%)"/></linearGradient></defs>` +
        `<circle cx="20" cy="20" r="20" fill="url(#g)"/>` +
        `<path d="M20 28C15 29.1 10 27.1 7.8 23.1c3.6-.6 8.2 1 12.2 4.9zm0 0c5 1.1 10-.9 12.2-4.9-3.6-.6-8.2 1-12.2 4.9z" fill="#fff" opacity=".72"/>` +
        `<path d="M20 27.5c-4.2-.9-7.6-4.6-8-9.6 3.8 1 6.8 4.3 8 9.6zm0 0c4.2-.9 7.6-4.6 8-9.6-3.8 1-6.8 4.3-8 9.6z" fill="#fff" opacity=".9"/>` +
        `<path d="M20 12c3.6 4 3.6 10.6 0 15.5-3.6-4.9-3.6-11.5 0-15.5z" fill="#fff"/>` +
        `<path d="M20 4.4l1.25 3.75h3.95l-3.2 2.3 1.25 3.75L20 11.9l-3.25 2.3 1.25-3.75-3.2-2.3h3.95z" fill="hsl(50,100%,62%)"/></svg>`
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
