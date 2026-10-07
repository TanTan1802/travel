/*
 * Tìm ảnh trên Wikimedia Commons cho điểm đến / món ăn mới (chạy trên máy có Internet hoặc workflow "Tìm ảnh Wikimedia").
 * In bảng ứng viên: tên file (dán vào data/destinations.json), kích thước, giấy phép, mô tả.
 * Chỉ giữ ảnh ≥ 1200px chiều rộng, giấy phép tự do (CC BY / CC BY-SA / CC0 / Public domain).
 *
 *   node tools/find-images.js "Mai Chau" "Ban Lac Mai Chau" "Com lam"
 *   QUERIES="Mai Chau|Com lam" node tools/find-images.js
 *   PREVIEW_DIR=preview node tools/find-images.js "Com lam"   – thêm ảnh xem trước: mỗi từ khóa một tấm ghép
 *                                                               các ảnh ứng viên có đánh số (khớp cột # trong bảng)
 */
const fs = require('fs')

const API = 'https://commons.wikimedia.org/w/api.php'
const MIN_WIDTH = 1200
const FREE = /^(CC BY(-SA)?( \d\.\d)?|CC0|Public domain|PD.*)$/i
const strip = html => String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

async function search(query, limit = 20) {
    const params = new URLSearchParams({
        action: 'query', format: 'json', generator: 'search', gsrsearch: `${query} filetype:bitmap`,
        gsrnamespace: '6', gsrlimit: String(limit), prop: 'imageinfo',
        iiprop: 'size|url|extmetadata', iiurlwidth: '400', iiextmetadatafilter: 'LicenseShortName|ImageDescription|Artist',
    })
    const res = await fetch(`${API}?${params}`, { headers: { 'user-agent': 'VietTravel/1.0 (https://viet-travel.congtan5918.workers.dev/)' } })
    if (!res.ok) throw new Error(`Commons HTTP ${res.status}`)
    const data = await res.json()
    return Object.values(data.query?.pages || {})
        .sort((a, b) => a.index - b.index)
        .map(p => {
            const info = p.imageinfo?.[0] || {}
            const meta = info.extmetadata || {}
            return {
                file: p.title.replace(/^File:/, ''),
                width: info.width, height: info.height, thumb: info.thumburl,
                license: strip(meta.LicenseShortName?.value),
                description: strip(meta.ImageDescription?.value).slice(0, 140),
            }
        })
        .filter(x => x.width >= MIN_WIDTH && FREE.test(x.license))
}

const slug = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const escapeXml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* Tấm ghép ảnh ứng viên (số thứ tự + tên file) để chọn ảnh mà không phải mở từng trang Commons */
async function contactSheet(results, file) {
    const sharp = require('sharp')
    const W = 400, H = 300, LABEL = 36, COLS = 4
    const tiles = []
    for (const [i, r] of results.entries()) {
        const left = (i % COLS) * W
        const top = Math.floor(i / COLS) * (H + LABEL)
        try {
            const res = await fetch(r.thumb, { headers: { 'user-agent': 'VietTravel/1.0 (https://viet-travel.congtan5918.workers.dev/)' } })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            tiles.push({ input: await sharp(Buffer.from(await res.arrayBuffer())).resize(W, H, { fit: 'cover' }).toBuffer(), left, top })
        } catch (err) {
            console.warn(`  không tải được ảnh xem trước ${r.file}: ${err.message}`)
        }
        const label = `${i + 1}. ${r.file}`.slice(0, 48)
        tiles.push({ input: Buffer.from(`<svg width="${W}" height="${LABEL}"><rect width="100%" height="100%" fill="#111"/><text x="8" y="24" font-size="16" font-family="sans-serif" fill="#fff">${escapeXml(label)}</text></svg>`), left, top: top + H })
    }
    const rows = Math.ceil(results.length / COLS)
    await sharp({ create: { width: W * COLS, height: rows * (H + LABEL), channels: 3, background: '#333' } })
        .composite(tiles).jpeg({ quality: 75 }).toFile(file)
}

async function main() {
    const queries = [...process.argv.slice(2), ...(process.env.QUERIES || '').split('|')].map(q => q.trim()).filter(Boolean)
    if (!queries.length) throw new Error('Cần ít nhất một từ khóa')
    const out = ['## Ảnh Wikimedia Commons (≥ 1200px, giấy phép tự do)', '']
    for (const q of queries) {
        const results = await search(q)
        const top = results.slice(0, 12)
        out.push(`### ${q} (${results.length})`, '', '| # | Tên file | Kích thước | Giấy phép | Mô tả |', '|---|---|---|---|---|')
        top.forEach((r, i) => out.push(`| ${i + 1} | \`${r.file}\` | ${r.width}×${r.height} | ${r.license} | ${r.description.replace(/\|/g, '/')} |`))
        out.push('')
        if (process.env.PREVIEW_DIR && top.length) {
            fs.mkdirSync(process.env.PREVIEW_DIR, { recursive: true })
            const name = `${slug(q) || 'anh'}.jpg`
            await contactSheet(top, require('path').join(process.env.PREVIEW_DIR, name))
            out.push(`Ảnh xem trước: \`${name}\` (nhánh image-previews)`, '')
        }
        await new Promise(resolve => setTimeout(resolve, 500)) // lịch sự với API Commons
    }
    const text = out.join('\n')
    console.log(text)
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n')
}

main().catch(err => {
    console.error(`❌ ${err.message}`)
    process.exitCode = 1
})
