/*
 * Chuyển ảnh đã tải (assets/img/wiki) sang WebP ở 3 kích thước 480 / 960 / 1920px
 * để trình duyệt chọn ảnh vừa đủ theo màn hình (srcset). Xóa file JPG/PNG gốc sau khi chuyển.
 * Kích thước tính theo CẠNH DÀI (ảnh dọc 1920 không cao tới 3000px+); srcset dùng chiều rộng thật (core.js).
 * Chạy:  npm run images   (tự gọi sau bước tải ảnh)
 */
const fs = require('fs')
const path = require('path')
const { ROOT, loadBrowserScripts, loadDestinations } = require('./lib')

const OUT_DIR = 'assets/img/wiki'
const MANIFEST = 'assets/js/data/local-images.js'
const SIZES = { xs: 480, sm: 960, lg: 1920 }
const QUALITY = 78
/* Ảnh 1920px nặng hơn ngưỡng này sẽ được nén lại với chất lượng thấp dần (ảnh nhiều chi tiết như rừng, phố cổ) */
const MAX_BYTES = { lg: 450 * 1024, sm: 200 * 1024 }
const MIN_QUALITY = 55
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

/* Mã hóa WebP; nếu vượt MAX_BYTES thì giảm chất lượng từng bước cho tới khi vừa ngưỡng */
async function encodeWebp(input, width, key) {
    let quality = QUALITY
    let buf
    do {
        buf = await sharp(input).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer()
        quality -= 7
    } while (MAX_BYTES[key] && buf.length > MAX_BYTES[key] && quality >= MIN_QUALITY)
    return buf
}

async function writeWebp(input, width, rel, key) {
    fs.writeFileSync(abs(rel), await encodeWebp(input, width, key))
}

/* Ảnh đã tối ưu từ trước nhưng vượt ngưỡng dung lượng: nén lại từ chính bản WebP đó */
async function shrinkOversized(target) {
    let shrunk = false
    for (const [key, max] of Object.entries(MAX_BYTES)) {
        const rel = target[key]
        if (fs.statSync(abs(rel)).size <= max) continue
        /* Chỉ ghi khi nhẹ hơn rõ rệt – tránh nén đi nén lại một ảnh ở mỗi lần chạy */
        const current = fs.readFileSync(abs(rel))
        const buf = await encodeWebp(current, SIZES[key], key)
        if (buf.length > current.length * 0.85) continue
        fs.writeFileSync(abs(rel), buf)
        shrunk = true
    }
    return shrunk
}

async function optimizeEntry(entry) {
    const base = baseOf(entry.lg || entry.sm)
    const target = Object.fromEntries(Object.entries(SIZES).map(([k, w]) => [k, `${base}-${w}.webp`]))
    const done = Object.values(target).every(rel => fs.existsSync(abs(rel)))
    if (done) {
        /* Đã tối ưu từ trước: không tạo lại (tránh giảm chất lượng), chỉ nén lại ảnh vượt ngưỡng dung lượng –
           trừ ảnh dọc tạo theo quy tắc cũ (chỉ giới hạn chiều rộng) còn vượt khung thì tạo lại bên dưới */
        const { width, height } = await sharp(abs(target.lg)).metadata()
        if (Math.max(width, height) <= SIZES.lg) {
            const shrunk = await shrinkOversized(target)
            return { entry: { ...target, w: width, h: height }, converted: shrunk }
        }
    }

    /* Nguồn: ảnh lớn nhất đang có (JPG gốc hoặc WebP 1920) */
    const source = [entry.lg, target.lg, entry.sm].find(rel => rel && fs.existsSync(abs(rel)))
    if (!source) throw new Error('không tìm thấy file nguồn')
    const input = fs.readFileSync(abs(source))
    const meta = await sharp(input).metadata()

    for (const [key, width] of Object.entries(SIZES)) {
        await writeWebp(input, width, target[key], key)
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
