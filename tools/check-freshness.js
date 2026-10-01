/*
 * Liệt kê điểm tham quan / quán có thông tin lâu chưa cập nhật (trường "updated" trong data/*.json).
 * Chạy:  npm run check-freshness            (mặc định: cũ hơn 12 tháng)
 *        node tools/check-freshness.js --months 6 --strict   (--strict: có mục cũ → mã lỗi 1)
 * Cập nhật: sửa JSON, hoặc trong Google Sheets sửa giá / ghi "x" vào cột confirmed rồi đồng bộ (docs/du-lieu.md).
 */
const fs = require('fs')
const path = require('path')
const { ROOT } = require('./lib')

const args = process.argv.slice(2)
const MONTHS = Number(args[args.indexOf('--months') + 1]) || 12
const STRICT = args.includes('--strict')

const readJson = name => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', `${name}.json`), 'utf8'))
const monthsBetween = (from, to) => (Number(to.slice(0, 4)) - Number(from.slice(0, 4))) * 12 + Number(to.slice(5, 7)) - Number(from.slice(5, 7))

function staleItems(now = new Date().toISOString().slice(0, 7), months = MONTHS) {
    const items = []
    Object.entries(readJson('sights').sights).forEach(([id, days]) => days.forEach((list, d) => list.forEach(s =>
        items.push({ dest: id, kind: `điểm tham quan (ngày ${d + 1})`, name: s.name[0], updated: s.updated }))))
    Object.entries(readJson('places').places).forEach(([id, p]) => {
        p.eats.forEach(e => items.push({ dest: id, kind: 'quán ăn', name: e.name, updated: e.updated }))
        p.cafes.forEach(c => items.push({ dest: id, kind: 'quán nước', name: c.name, updated: c.updated }))
    })
    return {
        total: items.length,
        stale: items.filter(x => !x.updated || monthsBetween(x.updated, now) >= months)
            .sort((a, b) => (a.updated || '').localeCompare(b.updated || '')),
    }
}

if (require.main === module) {
    const { total, stale } = staleItems()
    const byDest = stale.reduce((acc, x) => ({ ...acc, [x.dest]: [...(acc[x.dest] || []), x] }), {})
    const summary = [
        `## Độ mới của dữ liệu`,
        '',
        stale.length
            ? `**${stale.length}/${total}** mục chưa cập nhật trong ${MONTHS} tháng – nên kiểm tra lại giá vé, giờ mở cửa, địa chỉ.`
            : `✅ Cả ${total} mục đều được cập nhật trong ${MONTHS} tháng gần đây.`,
        '',
        ...Object.entries(byDest).flatMap(([dest, list]) => [`### ${dest} (${list.length})`, ...list.map(x => `- ${x.kind}: ${x.name} – ${x.updated || 'chưa có'}`), '']),
    ].join('\n')
    console.log(summary)
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n')
    if (STRICT && stale.length) process.exitCode = 1
}

module.exports = { staleItems, monthsBetween }
