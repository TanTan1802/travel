/*
 * Kiểm tra toàn bộ ảnh Wikimedia Commons được dùng trên website.
 * Chạy trên máy có Internet (Node.js 18+):   node tools/check-images.js
 * Kết quả liệt kê ảnh không tồn tại và ảnh có độ phân giải thấp (< 1200px).
 */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const root = path.join(__dirname, '..')
const MIN_WIDTH = 1200

function loadDestinations() {
    const code = fs.readFileSync(path.join(root, 'assets/js/data/destinations.js'), 'utf8')
    const context = {}
    vm.runInNewContext(`${code}\nthis.DESTINATIONS = DESTINATIONS`, context)
    return context.DESTINATIONS
}

function collectFiles() {
    const files = new Map() // tên file -> nơi sử dụng
    const add = (file, where) => {
        if (!file) return
        ;(Array.isArray(file) ? file : [file]).forEach(f => {
            if (!files.has(f)) files.set(f, new Set())
            files.get(f).add(where)
        })
    }

    for (const d of loadDestinations()) {
        add(d.hero, `${d.id} (ảnh bìa)`)
        d.gallery.forEach(g => add(g.file, `${d.id} (gallery)`))
        d.foods.forEach(f => add(f.file, `${d.id} (món: ${f.name})`))
    }

    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    for (const [, attr] of html.matchAll(/data-wiki="([^"]+)"/g)) {
        attr.split('|').forEach(f => add(f, 'index.html'))
    }
    return files
}

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
    const files = collectFiles()
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
