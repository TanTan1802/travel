/*
 * Kiểm tra liên kết ra ngoài trong các trang đã build còn sống không (chạy trên máy có Internet).
 * Bỏ qua URL tìm kiếm sinh tự động (Google Maps/Flights/Calendar, Booking, Airbnb, GitHub Issues…) vì luôn trả về trang.
 * Chạy:  npm run check-links      → mã lỗi 1 nếu có link hỏng (404/410/5xx, không phân giải được tên miền)
 * Ảnh Wikimedia Commons được kiểm tra riêng bằng npm run check-images.
 */
const fs = require('fs')
const path = require('path')
const { ROOT } = require('./lib')
const { builtPages } = require('../tests/helpers')

const SKIP = [
    /^https:\/\/www\.google\.com\/(maps|travel|search)/,
    /^https:\/\/calendar\.google\.com\//,
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/new/,
    /^https:\/\/www\.booking\.com\/searchresults/,
    /^https:\/\/www\.airbnb\.com\/s\//,
    /^https:\/\/tantan1802\.github\.io\//, // trang của chính site – đã có test liên kết nội bộ
]
/* Mạng xã hội thường chặn bot (403/429): coi là "không kiểm tra được", không tính là hỏng */
const BLOCKED_OK = new Set([401, 403, 405, 429, 999])

function externalLinks() {
    const urls = new Map()
    for (const page of builtPages()) {
        const html = fs.readFileSync(path.join(ROOT, page), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '')
        for (const [, raw] of html.matchAll(/href="(https?:[^"]+)"/g)) {
            const url = raw.replace(/&amp;/g, '&')
            if (SKIP.some(re => re.test(url))) continue
            if (!urls.has(url)) urls.set(url, new Set())
            urls.get(url).add(page)
        }
    }
    return urls
}

async function check(url) {
    const opts = { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0 (compatible; VietTravelLinkCheck/1.0)' } }
    try {
        let res = await fetch(url, { ...opts, method: 'HEAD' })
        if (res.status === 405 || res.status === 501) res = await fetch(url, { ...opts, method: 'GET' })
        return { status: res.status, ok: res.ok || BLOCKED_OK.has(res.status) }
    } catch (err) {
        return { status: err.cause?.code || err.name, ok: false }
    }
}

async function main() {
    const urls = [...externalLinks().entries()]
    const results = []
    const queue = [...urls]
    await Promise.all(Array.from({ length: 6 }, async () => {
        while (queue.length) {
            const [url, pages] = queue.shift()
            results.push({ url, pages: [...pages], ...(await check(url)) })
        }
    }))
    const broken = results.filter(r => !r.ok)
    const summary = [
        '## Liên kết ra ngoài',
        '',
        `Đã kiểm tra **${results.length}** liên kết (bỏ qua URL tìm kiếm sinh tự động).`,
        broken.length ? `❌ **${broken.length}** liên kết hỏng:` : '✅ Không có liên kết hỏng.',
        ...broken.map(r => `- ${r.url} → ${r.status} (ở ${r.pages.length} trang, vd. ${r.pages[0]})`),
    ].join('\n')
    console.log(summary)
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n')
    if (broken.length) process.exitCode = 1
}

main()
