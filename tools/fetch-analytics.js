/*
 * Lấy số liệu Cloudflare Web Analytics 30 ngày gần nhất (GraphQL API) → stats/analytics.json
 * cho ô "Người xem" ở Tổng quan trang quản trị. Workflow thong-ke.yml chạy hằng ngày và đẩy file
 * lên nhánh riêng "stats" (không kích hoạt deploy).
 *
 * Cần biến môi trường (GitHub → Settings → Secrets and variables → Actions):
 *   CF_API_TOKEN   – API token Cloudflare, quyền "Account › Account Analytics › Read"
 *   CF_ACCOUNT_ID  – Account ID (trang Overview của tài khoản Cloudflare, cột phải)
 *   CF_SITE_TAG    – (tùy chọn) chỉ lấy một site khi tài khoản có nhiều site Web Analytics
 * Chạy thử:  CF_API_TOKEN=… CF_ACCOUNT_ID=… node tools/fetch-analytics.js
 */
const fs = require('fs')
const path = require('path')

const DAYS = 30
const OUT = process.env.OUT || path.join(process.cwd(), 'stats', 'analytics.json')

const iso = d => d.toISOString().slice(0, 10)

function query(siteTag) {
    const filter = `{ date_geq: $from, date_leq: $to${siteTag ? ', siteTag: $site' : ''} }`
    const group = (alias, limit, order, dim) =>
        `${alias}: rumPageloadEventsAdaptiveGroups(limit: ${limit}, filter: ${filter}, orderBy: [${order}]) { count sum { visits } dimensions { ${dim} } }`
    return `query ($account: string!, $from: Date!, $to: Date!${siteTag ? ', $site: string!' : ''}) {
  viewer { accounts(filter: { accountTag: $account }) {
    ${group('daily', DAYS + 2, 'date_ASC', 'date')}
    ${group('pages', 15, 'count_DESC', 'requestPath')}
    ${group('countries', 8, 'count_DESC', 'countryName')}
    ${group('referrers', 8, 'count_DESC', 'refererHost')}
    ${group('devices', 5, 'count_DESC', 'deviceType')}
  } }
}`
}

async function main() {
    const token = process.env.CF_API_TOKEN
    const account = process.env.CF_ACCOUNT_ID
    if (!token || !account) {
        console.log('Chưa có CF_API_TOKEN / CF_ACCOUNT_ID – bỏ qua (xem hướng dẫn ở đầu file).')
        process.exit(0)
    }
    const siteTag = process.env.CF_SITE_TAG || ''
    const to = new Date()
    const from = new Date(to.getTime() - (DAYS - 1) * 86400000)
    const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ query: query(siteTag), variables: { account, from: iso(from), to: iso(to), ...(siteTag ? { site: siteTag } : {}) } }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok || body.errors?.length || !body.data) {
        throw new Error(`Cloudflare trả lỗi ${res.status}: ${JSON.stringify(body.errors || body).slice(0, 500)}`)
    }
    const acc = body.data.viewer.accounts[0]
    if (!acc) throw new Error('Không thấy tài khoản – kiểm tra CF_ACCOUNT_ID và quyền của token')
    const rows = (list, key) => (list || []).map(r => ({ [key]: r.dimensions[Object.keys(r.dimensions)[0]] || '(không rõ)', views: r.count, visits: r.sum.visits }))
    /* Đủ 30 ngày, ngày không có lượt xem = 0 */
    const byDate = new Map((acc.daily || []).map(r => [r.dimensions.date, r]))
    const daily = Array.from({ length: DAYS }, (_, i) => {
        const date = iso(new Date(from.getTime() + i * 86400000))
        const r = byDate.get(date)
        return { date, views: r ? r.count : 0, visits: r ? r.sum.visits : 0 }
    })
    const out = {
        updated: new Date().toISOString(),
        from: iso(from),
        to: iso(to),
        totals: { views: daily.reduce((n, d) => n + d.views, 0), visits: daily.reduce((n, d) => n + d.visits, 0) },
        daily,
        pages: rows(acc.pages, 'path'),
        countries: rows(acc.countries, 'country'),
        referrers: rows(acc.referrers, 'host'),
        devices: rows(acc.devices, 'device'),
    }
    fs.mkdirSync(path.dirname(OUT), { recursive: true })
    fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`)
    console.log(`✅ ${out.totals.views} lượt xem, ${out.totals.visits} lượt truy cập (${out.from} → ${out.to}) → ${OUT}`)
}

main().catch(err => { console.error(`❌ ${err.message}`); process.exit(1) })
