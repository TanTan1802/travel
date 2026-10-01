/*
 * Tìm ảnh trên Wikimedia Commons cho điểm đến / món ăn mới (chạy trên máy có Internet hoặc workflow "Tìm ảnh Wikimedia").
 * In bảng ứng viên: tên file (dán vào data/destinations.json), kích thước, giấy phép, mô tả.
 * Chỉ giữ ảnh ≥ 1200px chiều rộng, giấy phép tự do (CC BY / CC BY-SA / CC0 / Public domain).
 *
 *   node tools/find-images.js "Mai Chau" "Ban Lac Mai Chau" "Com lam"
 *   QUERIES="Mai Chau|Com lam" node tools/find-images.js
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
        iiprop: 'size|extmetadata', iiextmetadatafilter: 'LicenseShortName|ImageDescription|Artist',
    })
    const res = await fetch(`${API}?${params}`, { headers: { 'user-agent': 'VietTravel/1.0 (https://tantan1802.github.io/travel/)' } })
    if (!res.ok) throw new Error(`Commons HTTP ${res.status}`)
    const data = await res.json()
    return Object.values(data.query?.pages || {})
        .sort((a, b) => a.index - b.index)
        .map(p => {
            const info = p.imageinfo?.[0] || {}
            const meta = info.extmetadata || {}
            return {
                file: p.title.replace(/^File:/, ''),
                width: info.width, height: info.height,
                license: strip(meta.LicenseShortName?.value),
                description: strip(meta.ImageDescription?.value).slice(0, 140),
            }
        })
        .filter(x => x.width >= MIN_WIDTH && FREE.test(x.license))
}

async function main() {
    const queries = [...process.argv.slice(2), ...(process.env.QUERIES || '').split('|')].map(q => q.trim()).filter(Boolean)
    if (!queries.length) throw new Error('Cần ít nhất một từ khóa')
    const out = ['## Ảnh Wikimedia Commons (≥ 1200px, giấy phép tự do)', '']
    for (const q of queries) {
        const results = await search(q)
        out.push(`### ${q} (${results.length})`, '', '| Tên file | Kích thước | Giấy phép | Mô tả |', '|---|---|---|---|')
        results.slice(0, 10).forEach(r => out.push(`| \`${r.file}\` | ${r.width}×${r.height} | ${r.license} | ${r.description.replace(/\|/g, '/')} |`))
        out.push('')
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
