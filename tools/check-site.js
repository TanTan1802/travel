/*
 * Kiểm tra site ĐANG CHẠY (không phải bản build trên máy): mọi trang trong sitemap.xml mở được, và mọi
 * file JS / CSS / ảnh / trang nội bộ mà trang gọi tới đều tồn tại, đúng loại file.
 * Bắt được lỗi kiểu "trang trỏ tới bundle JS đã bị xoá" – test trên máy không thấy vì máy luôn có đủ file.
 *
 * Chạy:  npm run check-site                     → kiểm tra site thật (SITE_URL trong tools/lib.js)
 *        SITE=http://localhost:8000/ npm run check-site
 *        WAIT_FOR_DEPLOY=1 npm run check-site    → đợi site deploy xong bản đang có trong repo (so sw.js) rồi mới kiểm tra
 * Kết quả: mã lỗi 1 nếu có lỗi; báo cáo Markdown ghi vào $GITHUB_STEP_SUMMARY (nếu có) và site-check.md.
 */
const fs = require('fs')
const path = require('path')
const { ROOT, SITE_URL } = require('./lib')

const BASE = (process.env.SITE || SITE_URL).replace(/\/?$/, '/')
const CONCURRENCY = Number(process.env.CONCURRENCY) || 12
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; VietTravelSiteCheck/1.0)' }
const sleep = ms => new Promise(r => setTimeout(r, ms))

/* Loại nội dung mong đợi theo đuôi file: Cloudflare trả trang HTML 404 cho file thiếu, trình duyệt từ chối chạy */
const EXPECT = [
    [/\.m?js$/, /javascript/],
    [/\.css$/, /css/],
    [/\.(webp|png|jpe?g|svg|ico|gif|avif)$/i, /^image\//],
    [/\.(woff2?|ttf)$/, /font|octet-stream/],
    [/\.webmanifest$/, /json|manifest/],
    [/(\/|\.html)$/, /html/],
]

async function get(url, method = 'GET') {
    for (let attempt = 0; ; attempt++) {
        try {
            const res = await fetch(url, { method, redirect: 'follow', headers: UA, signal: AbortSignal.timeout(20000) })
            const body = method === 'GET' ? await res.text() : ''
            return { status: res.status, type: res.headers.get('content-type') || '', body }
        } catch (err) {
            if (attempt >= 2) return { status: err.cause?.code || err.name, type: '', body: '' }
            await sleep(1000 * (attempt + 1))
        }
    }
}

/* Đợi Cloudflare deploy xong: sw.js trên site trùng sw.js trong repo (VERSION đổi theo mọi mã nguồn) */
async function waitForDeploy() {
    const want = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').match(/const VERSION = '([^']+)'/)?.[1]
    if (!want) return
    const until = Date.now() + 15 * 60 * 1000
    while (Date.now() < until) {
        const { body } = await get(`${BASE}sw.js?t=${Date.now()}`)
        if (body.includes(`const VERSION = '${want}'`)) { console.log(`Site đã deploy bản ${want}`); return }
        console.log(`Chờ deploy bản ${want}…`)
        await sleep(30000)
    }
    console.log('⚠ Quá 15 phút chưa thấy bản mới – vẫn kiểm tra bản đang chạy')
}

/* Các địa chỉ nội bộ một trang gọi tới: [địa chỉ, loại] – asset = file trang cần để hiển thị, link = trang được liên kết */
function refsOf(html, pageUrl) {
    const out = []
    const add = (raw, kind) => {
        if (!raw) return
        raw = raw.replace(/&amp;/g, '&').trim()
        if (!raw || /^(#|data:|mailto:|tel:|javascript:|blob:)/.test(raw) || raw.includes('${')) return
        let u
        try { u = new URL(raw, pageUrl) } catch { return }
        if (u.origin !== new URL(BASE).origin) return
        u.hash = ''
        u.search = ''
        out.push([u.href, kind])
    }
    const noScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, m => m.replace(/>[\s\S]*<\/script>$/, '></script>'))
    for (const m of noScripts.matchAll(/<(script|link|img|source|a|meta)\b[^>]*>/gi)) {
        const tag = m[0]
        const name = tag.match(/^<(\w+)/)[1].toLowerCase()
        const attr = k => tag.match(new RegExp(`\\s${k}="([^"]*)"`, 'i'))?.[1]
        if (name === 'script') add(attr('src'), 'asset')
        else if (name === 'link') {
            const rel = (attr('rel') || '').toLowerCase()
            if (/stylesheet|icon|manifest|preload|modulepreload/.test(rel)) add(attr('href'), 'asset')
            else if (rel === 'alternate' || rel === 'canonical') add(attr('href'), 'link')
        } else if (name === 'img' || name === 'source') {
            add(attr('src'), 'asset')
            /* srcset: "url 480w, url 960w" – tên ảnh có thể chứa dấu phẩy nên tách theo mô tả kích thước */
            for (const [, url] of (attr('srcset') || '').matchAll(/(\S+)\s+\d+(?:\.\d+)?[wx](?:,|$)/g)) add(url, 'asset')
        } else if (name === 'a') add(attr('href'), 'link')
        else if (name === 'meta' && /^(og:image|twitter:image)$/.test(attr('property') || attr('name') || '')) add(attr('content'), 'asset')
    }
    return out
}

function typeProblem(url, type) {
    const p = new URL(url).pathname
    const rule = EXPECT.find(([re]) => re.test(p))
    return rule && !rule[1].test(type) ? `trả về ${type || 'không rõ loại'}` : ''
}

async function pool(items, fn) {
    const queue = [...items]
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
        while (queue.length) await fn(queue.shift())
    }))
}

/* Một lượt kiểm tra toàn site: { problems, checkedPages, refCount } */
async function crawl() {
    const sitemap = await get(`${BASE}sitemap.xml`)
    if (sitemap.status !== 200) throw new Error(`Không tải được sitemap.xml (${sitemap.status})`)
    const pages = [...new Set([...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(m[1].replace(/&amp;/g, '&')).pathname))]
        .map(p => new URL(p.replace(/^\//, ''), BASE).href)
    const problems = [] // { url, why, from }
    const refs = new Map() // url → { kind, from: Set }
    let checkedPages = 0

    await pool(pages, async url => {
        const res = await get(url)
        checkedPages++
        if (res.status !== 200) return problems.push({ url, why: `trang lỗi ${res.status}`, from: ['sitemap.xml'] })
        for (const [ref, kind] of refsOf(res.body, url)) {
            if (!refs.has(ref)) refs.set(ref, { kind, from: new Set() })
            const r = refs.get(ref)
            if (kind === 'asset') r.kind = 'asset'
            r.from.add(url)
        }
    })

    const checked = new Set(pages)
    const todo = [...refs.entries()].filter(([u]) => !checked.has(u))
    await pool(todo, async ([url, { kind, from }]) => {
        const res = await get(url, kind === 'asset' ? 'GET' : 'HEAD')
        const why = res.status !== 200 ? `lỗi ${res.status}` : kind === 'asset' ? typeProblem(url, res.type) : ''
        if (why) problems.push({ url, why, from: [...from] })
    })
    return { problems, checkedPages, refCount: todo.length }
}

async function main() {
    if (process.env.WAIT_FOR_DEPLOY) await waitForDeploy()
    const started = Date.now()
    let { problems, checkedPages, refCount } = await crawl()
    /* Ngay sau deploy, bộ nhớ đệm của Cloudflare có thể còn trộn trang cũ / mới vài phút (trang cũ gọi bundle đã thay):
       có lỗi thì đợi 3 phút kiểm tra lại, chỉ báo lỗi còn lại – tránh mở Issue nhầm */
    if (problems.length && process.env.WAIT_FOR_DEPLOY) {
        console.log(`Có ${problems.length} lỗi – đợi 3 phút cho bộ nhớ đệm cập nhật rồi kiểm tra lại…`)
        await sleep(180000)
        ;({ problems, checkedPages, refCount } = await crawl())
    }

    const rel = u => `/${u.replace(BASE, '')}`
    const lines = [
        `## Kiểm tra site đang chạy – ${BASE}`,
        '',
        `${checkedPages} trang trong sitemap · ${refCount} file / liên kết nội bộ · ${Math.round((Date.now() - started) / 1000)} giây`,
        '',
    ]
    if (!problems.length) lines.push('✅ Không có lỗi: mọi trang mở được, mọi file JS / CSS / ảnh / liên kết nội bộ đều tồn tại.')
    else {
        lines.push(`❌ **${problems.length} lỗi**`, '', '| Địa chỉ | Lỗi | Số trang gọi tới | Ví dụ trang |', '|---|---|---|---|')
        problems.sort((a, b) => b.from.length - a.from.length).slice(0, 100).forEach(p => {
            lines.push(`| \`${rel(p.url)}\` | ${p.why} | ${p.from.length} | ${p.from[0] === 'sitemap.xml' ? 'sitemap.xml' : rel(p.from[0])} |`)
        })
        if (problems.length > 100) lines.push('', `… và ${problems.length - 100} lỗi khác.`)
    }
    const report = lines.join('\n') + '\n'
    fs.writeFileSync(path.join(process.cwd(), 'site-check.md'), report)
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report)
    console.log(report)
    if (problems.length) process.exit(1)
}

if (require.main === module) main().catch(err => { console.error(err); process.exit(1) })
module.exports = { refsOf, typeProblem }
