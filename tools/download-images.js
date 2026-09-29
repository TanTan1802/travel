/*
 * Tải toàn bộ ảnh Wikimedia Commons về repo để site không phụ thuộc bên thứ ba.
 * Chạy trên máy có Internet (Node.js 18+):   npm run images
 *
 * - Mỗi ảnh được tải 2 kích thước: 960px (thẻ, gallery) và 1920px (ảnh bìa, lightbox).
 *   Commons tự thu nhỏ ảnh nên không cần thư viện xử lý ảnh.
 * - Ảnh đã tải sẽ được bỏ qua ở lần chạy sau.
 * - Kết quả ghi vào assets/img/wiki/ và assets/js/data/local-images.js.
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { ROOT, collectWikiFiles, slugify } = require('./lib')

const FILEPATH_BASE = process.env.WIKI_FILEPATH_BASE || 'https://commons.wikimedia.org/wiki/Special:FilePath/'
const OUT_DIR = 'assets/img/wiki'
const MANIFEST = 'assets/js/data/local-images.js'
const SIZES = { sm: 960, lg: 1920 }
const CONCURRENCY = 4

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }

function baseName(file) {
    const hash = crypto.createHash('md5').update(file).digest('hex').slice(0, 6)
    return `${slugify(file)}-${hash}`
}

function findExisting(name, width) {
    const dir = path.join(ROOT, OUT_DIR)
    if (!fs.existsSync(dir)) return null
    const hit = fs.readdirSync(dir).find(f => f.startsWith(`${name}-${width}.`))
    return hit ? `${OUT_DIR}/${hit}` : null
}

async function download(file, width) {
    const name = baseName(file)
    const existing = findExisting(name, width)
    if (existing) return existing

    const url = `${FILEPATH_BASE}${encodeURIComponent(file)}?width=${width}`
    const res = await fetch(url, { headers: { 'User-Agent': 'viet-travel-image-download/1.0' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const type = (res.headers.get('content-type') || '').split(';')[0]
    const ext = EXT[type]
    if (!ext) throw new Error(`không phải ảnh (${type || 'không rõ'})`)

    const rel = `${OUT_DIR}/${name}-${width}.${ext}`
    fs.writeFileSync(path.join(ROOT, rel), Buffer.from(await res.arrayBuffer()))
    return rel
}

async function runPool(items, worker) {
    let next = 0
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
        while (next < items.length) await worker(items[next++])
    }))
}

async function main() {
    fs.mkdirSync(path.join(ROOT, OUT_DIR), { recursive: true })
    const files = [...collectWikiFiles().keys()]
    const manifest = {}
    const failed = []

    console.log(`Đang tải ${files.length} ảnh...`)
    await runPool(files, async file => {
        try {
            const entry = {}
            for (const [key, width] of Object.entries(SIZES)) entry[key] = await download(file, width)
            manifest[file] = entry
            process.stdout.write('.')
        } catch (err) {
            failed.push(`${file}: ${err.message}`)
            process.stdout.write('x')
        }
    })

    const sorted = Object.fromEntries(Object.keys(manifest).sort().map(k => [k, manifest[k]]))
    fs.writeFileSync(path.join(ROOT, MANIFEST),
        '/* File này được sinh tự động bởi `npm run images` (tools/download-images.js). Không sửa tay. */\n' +
        `const LOCAL_IMAGES = ${JSON.stringify(sorted, null, 4)}\n`)

    console.log(`\n\nĐã tải ${Object.keys(manifest).length}/${files.length} ảnh → ${OUT_DIR}/`)
    if (failed.length) {
        console.log(`\n❌ ${failed.length} ảnh lỗi (site sẽ tự dùng ảnh dự phòng):`)
        failed.forEach(f => console.log(`  - ${f}`))
    }
    console.log('\nChạy `npm run build` để cập nhật các trang tĩnh.')
}

main().catch(err => {
    console.error(err)
    process.exitCode = 1
})
