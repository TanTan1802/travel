/*
 * Bộ icon Remix Icon rút gọn, tự host (thay cho ~235 KB CSS + font tải từ CDN).
 * Quét các class `ri-...` trong mẫu HTML, mã JS và dữ liệu → giữ đúng các icon đang dùng:
 *   assets/fonts/remixicon.woff2  – font chỉ còn các ký tự cần thiết
 *   assets/css/icons.css          – @font-face + class của từng icon
 * Chạy:  npm run icons   (sau khi thêm icon mới; test dữ liệu báo lỗi nếu quên chạy)
 *
 * Lưu ý: tên icon phải viết đầy đủ trong mã ('ri-sun-line'), không ghép chuỗi ('ri-' + name).
 */
const fs = require('fs')
const path = require('path')
const { ROOT } = require('./lib')

const REMIX_DIR = path.join(ROOT, 'node_modules/remixicon/fonts')
const FONT_OUT = 'assets/fonts/remixicon.woff2'
const CSS_OUT = 'assets/css/icons.css'
/* Nơi có thể chứa tên icon (không quét trang đã build – chúng sinh ra từ chính các nguồn này) */
const SOURCES = ['index.html', 'destination.html', 'planner.html', 'guide.html', 'offline.html', 'assets/js', 'data']
/* Class tiện ích của Remix Icon, không phải tên icon */
const UTILITY = new Set(['ri-lg', 'ri-xl', 'ri-xxs', 'ri-xs', 'ri-sm', 'ri-fw', ...Array.from({ length: 10 }, (_, i) => `ri-${i + 1}x`)])

function listFiles(rel) {
    const abs = path.join(ROOT, rel)
    if (!fs.statSync(abs).isDirectory()) return [rel]
    return fs.readdirSync(abs, { withFileTypes: true }).flatMap(e => listFiles(`${rel}/${e.name}`))
        .filter(f => /\.(?:html|js|json)$/.test(f))
}

/* Tên icon đang được dùng (sắp xếp để file sinh ra ổn định) */
function usedIcons() {
    const names = new Set()
    SOURCES.flatMap(listFiles).forEach(file => {
        const text = fs.readFileSync(path.join(ROOT, file), 'utf8')
        for (const [name] of text.matchAll(/\bri-[a-z0-9]+(?:-[a-z0-9]+)*/g)) {
            if (!UTILITY.has(name)) names.add(name)
        }
    })
    return [...names].sort()
}

/* Bảng tên icon → mã ký tự từ remixicon.css gốc */
function remixCodepoints() {
    const css = fs.readFileSync(path.join(REMIX_DIR, 'remixicon.css'), 'utf8')
    return new Map([...css.matchAll(/\.(ri-[a-z0-9-]+):before\s*\{\s*content:\s*"\\([0-9a-f]+)"/g)]
        .map(([, name, hex]) => [name, parseInt(hex, 16)]))
}

function iconsCss(icons, codepoints) {
    return `/* Sinh tự động bởi tools/build-icons.js (npm run icons) – không sửa tay.
   Remix Icon v2.5.0 (Apache License 2.0, https://remixicon.com) – chỉ giữ ${icons.length} icon site đang dùng. */
@font-face {
  font-family: "remixicon";
  src: url("../fonts/remixicon.woff2") format("woff2");
  font-display: block;
}

[class^="ri-"], [class*=" ri-"] {
  font-family: "remixicon" !important;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

${icons.map(name => `.${name}:before { content: "\\${codepoints.get(name).toString(16)}"; }`).join('\n')}
`
}

async function main() {
    const subsetFont = require('subset-font')
    const codepoints = remixCodepoints()
    const used = usedIcons()
    const unknown = used.filter(name => !codepoints.has(name))
    /* Chuỗi "ri-" trong mã nhưng không phải icon (vd. class tiện ích tự đặt) → bỏ qua và báo */
    if (unknown.length) console.log(`ℹ️  Bỏ qua (không có trong Remix Icon): ${unknown.join(', ')}`)
    const icons = used.filter(name => codepoints.has(name))

    const source = fs.readFileSync(path.join(REMIX_DIR, 'remixicon.woff2'))
    const text = icons.map(name => String.fromCodePoint(codepoints.get(name))).join('')
    const font = await subsetFont(source, text, { targetFormat: 'woff2' })

    fs.mkdirSync(path.join(ROOT, path.dirname(FONT_OUT)), { recursive: true })
    fs.writeFileSync(path.join(ROOT, FONT_OUT), font)
    fs.writeFileSync(path.join(ROOT, CSS_OUT), iconsCss(icons, codepoints))
    console.log(`✅ ${icons.length} icon · font ${(font.length / 1024).toFixed(1)} KB (gốc ${(source.length / 1024).toFixed(0)} KB)`)
}

if (require.main === module) {
    main().catch(err => {
        console.error(err)
        process.exitCode = 1
    })
}

module.exports = { usedIcons, remixCodepoints, CSS_OUT }
