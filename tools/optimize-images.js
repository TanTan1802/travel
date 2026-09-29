/*
 * Chuyển ảnh đã tải (assets/img/wiki) sang WebP ở 3 kích thước 480 / 960 / 1920px
 * để trình duyệt chọn ảnh vừa đủ theo màn hình (srcset). Xóa file JPG/PNG gốc sau khi chuyển.
 * Chạy:  npm run images   (tự gọi sau bước tải ảnh)
 */
const fs = require('fs')
const path = require('path')
const { ROOT, loadBrowserScripts, loadDestinations } = require('./lib')

const OUT_DIR = 'assets/img/wiki'
const MANIFEST = 'assets/js/data/local-images.js'
const SIZES = { xs: 480, sm: 960, lg: 1920 }
const QUALITY = 78
const OG_DIR = 'assets/img/og'

let sharp
try {
    sharp = require('sharp')
} catch {
    console.log('⚠️  Chưa cài sharp (npm install) – bỏ qua bước tối ưu ảnh.')
    process.exit(0)
}

const abs = rel => path.join(ROOT, rel)
const baseOf = rel => rel.replace(/-\d+\.\w+$/, '')

async function optimizeEntry(entry) {
    const base = baseOf(entry.lg || entry.sm)
    const target = Object.fromEntries(Object.entries(SIZES).map(([k, w]) => [k, `${base}-${w}.webp`]))
    const done = Object.values(target).every(rel => fs.existsSync(abs(rel)))
    if (done) {
        /* Đã tối ưu từ trước: chỉ đọc kích thước, không nén lại (tránh giảm chất lượng) */
        const { width, height } = await sharp(abs(target.lg)).metadata()
        return { entry: { ...target, w: width, h: height }, converted: false }
    }

    /* Nguồn: ảnh lớn nhất đang có (JPG gốc hoặc WebP 1920) */
    const source = [entry.lg, entry.sm].find(rel => rel && fs.existsSync(abs(rel)))
    if (!source) throw new Error('không tìm thấy file nguồn')
    const input = fs.readFileSync(abs(source))
    const meta = await sharp(input).metadata()

    for (const [key, width] of Object.entries(SIZES)) {
        await sharp(input)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: QUALITY, effort: 5 })
            .toFile(abs(target[key]))
    }

    /* Xóa file gốc không còn dùng */
    for (const rel of new Set([entry.sm, entry.lg])) {
        if (rel && !rel.endsWith('.webp') && fs.existsSync(abs(rel))) fs.unlinkSync(abs(rel))
    }

    const lgMeta = await sharp(abs(target.lg)).metadata()
    return { entry: { ...target, w: lgMeta.width, h: lgMeta.height }, converted: true, from: meta.format }
}

function dirSize(dir) {
    return fs.readdirSync(abs(dir)).reduce((sum, f) => sum + fs.statSync(abs(`${dir}/${f}`)).size, 0)
}

async function main() {
    const { LOCAL_IMAGES } = loadBrowserScripts([MANIFEST], ['LOCAL_IMAGES'])
    const before = dirSize(OUT_DIR)
    const manifest = {}
    let converted = 0
    const failed = []

    for (const [file, entry] of Object.entries(LOCAL_IMAGES || {})) {
        try {
            const result = await optimizeEntry(entry)
            manifest[file] = result.entry
            if (result.converted) converted++
        } catch (err) {
            manifest[file] = entry
            failed.push(`${file}: ${err.message}`)
        }
    }

    fs.writeFileSync(abs(MANIFEST),
        '/* File này được sinh tự động bởi `npm run images` (tools/download-images.js + optimize-images.js). Không sửa tay. */\n' +
        `const LOCAL_IMAGES = ${JSON.stringify(manifest, null, 4)}\n`)

    /* Ảnh chia sẻ mạng xã hội (og:image): JPEG 1200x630 từ ảnh bìa mỗi điểm đến */
    fs.mkdirSync(abs(OG_DIR), { recursive: true })
    const ogFiles = new Set()
    for (const d of loadDestinations()) {
        const hero = manifest[d.hero]
        if (!hero) continue
        const rel = `${OG_DIR}/${d.id}.jpg`
        ogFiles.add(path.basename(rel))
        if (!fs.existsSync(abs(rel))) {
            await sharp(abs(hero.lg)).resize(1200, 630, { fit: 'cover', position: 'attention' })
                .jpeg({ quality: 82, mozjpeg: true }).toFile(abs(rel))
        }
    }
    fs.readdirSync(abs(OG_DIR)).filter(f => !ogFiles.has(f)).forEach(f => fs.unlinkSync(abs(`${OG_DIR}/${f}`)))

    const after = dirSize(OUT_DIR)
    const mb = n => (n / 1024 / 1024).toFixed(1)
    console.log(`✅ Tối ưu ${converted} ảnh mới · ${mb(before)} MB → ${mb(after)} MB`)
    if (failed.length) failed.forEach(f => console.log(`  ❌ ${f}`))
}

main().catch(err => {
    console.error(err)
    process.exitCode = 1
})
