/*
 * Kiểm tra toàn bộ ảnh Wikimedia Commons được dùng trên website.
 * Chạy trên máy có Internet (Node.js 18+):   node tools/check-images.js
 * Kết quả liệt kê ảnh không tồn tại và ảnh có độ phân giải thấp (< 1200px).
 */
const { collectWikiFiles } = require('./lib')

const MIN_WIDTH = 1200

async function checkBatch(names) {
    const url = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
        action: 'query',
        format: 'json',
        formatversion: '2',
        prop: 'imageinfo',
        iiprop: 'size',
        titles: names.map(n => `File:${n}`).join('|'),
    })
    const res = await fetch(url, { headers: { 'User-Agent': 'viet-travel-image-check/1.0' } })
    const json = await res.json()

    // API có thể chuẩn hóa tên (vd: "_" -> " ") nên cần ánh xạ ngược
    const normalized = new Map((json.query.normalized || []).map(n => [n.to, n.from]))
    return json.query.pages.map(page => ({
        name: (normalized.get(page.title) || page.title).replace(/^File:/, ''),
        missing: Boolean(page.missing || page.invalid),
        width: page.imageinfo ? page.imageinfo[0].width : 0,
    }))
}

async function main() {
    const files = collectWikiFiles()
    const names = [...files.keys()]
    const results = []
    for (let i = 0; i < names.length; i += 50) {
        results.push(...await checkBatch(names.slice(i, i + 50)))
    }

    const missing = results.filter(r => r.missing)
    const small = results.filter(r => !r.missing && r.width < MIN_WIDTH)
    const usage = name => [...(files.get(name) || [])].join(', ')

    console.log(`Đã kiểm tra ${results.length} ảnh.`)
    if (missing.length) {
        console.log(`\n❌ ${missing.length} ảnh KHÔNG tồn tại:`)
        missing.forEach(r => console.log(`  - ${r.name}  →  ${usage(r.name)}`))
    }
    if (small.length) {
        console.log(`\n⚠️  ${small.length} ảnh độ phân giải thấp (< ${MIN_WIDTH}px):`)
        small.forEach(r => console.log(`  - ${r.name} (${r.width}px)  →  ${usage(r.name)}`))
    }
    if (!missing.length && !small.length) console.log('✅ Tất cả ảnh đều tồn tại và đủ độ phân giải.')
    process.exitCode = missing.length ? 1 : 0
}

main().catch(err => {
    console.error('Không kiểm tra được:', err.message)
    process.exitCode = 1
})
