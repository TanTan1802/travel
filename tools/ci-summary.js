/*
 * Tóm tắt lỗi từ log build / test (workflow "Kiểm tra PR từ trang quản trị") để trang quản trị hiện lý do lỗi
 * mà không cần mở log GitHub Actions.
 *
 *   node tools/ci-summary.js ci.log            – in các dòng lỗi chính (tối đa 15 dòng)
 *   node tools/ci-summary.js ci.log --short    – một dòng ≤ 140 ký tự (mô tả commit status)
 */
const fs = require('fs')

const ANSI = /\u001b\[[0-9;]*m/g
/* Dòng báo lỗi của build-data (❌ / - …), node:test (error: '…', not ok N - …) và lỗi JS chưa bắt */
const LINE = /❌|^\s*- .+|^\s*error: ['"].+|^not ok \d+ - |^\s*(TypeError|ReferenceError|SyntaxError|Error): /

function summarize(text, max = 15) {
    const lines = text.replace(ANSI, '').split('\n').map(l => l.replace(/^\d{4}-\d\d-\d\dT[\d:.]+Z\s/, '').trimEnd())
    const out = []
    let inErrorBlock = 0
    let blockIndent = 0
    const indent = l => l.length - l.trimStart().length
    for (const line of lines) {
        /* error: |- (thông báo nhiều dòng của assert) – lấy vài dòng thụt vào ngay sau, dừng ở dòng thụt ít hơn */
        if (/^\s*error: \|-?$/.test(line)) { inErrorBlock = 4; blockIndent = indent(line); continue }
        if (inErrorBlock > 0 && line.trim() && indent(line) > blockIndent) {
            inErrorBlock--
            if (!/^[+-] (actual|expected)|^\+ actual/.test(line.trim())) out.push(line.trim())
            continue
        }
        inErrorBlock = 0
        if (LINE.test(line) && !/^\s*- (expected|actual)/.test(line)) out.push(line.trim().replace(/^error: /, ''))
    }
    const seen = new Set()
    return out.filter(l => l.length > 3 && !seen.has(l) && seen.add(l)).slice(0, max)
}

/* Một dòng cho commit status: bỏ phần "not ok N -" / dấu nháy, ưu tiên dòng có nội dung cụ thể */
function shortReason(lines) {
    /* Dòng cụ thể nhất: không phải tiêu đề test, không phải dòng mở đầu kết thúc bằng dấu hai chấm */
    const i = lines.findIndex(l => !/^not ok/.test(l) && !/:$/.test(l))
    let pick = lines[i] || lines[0] || 'Build hoặc test lỗi – xem log'
    /* Hết thời gian chờ (Playwright): tên test cho biết phần nào hỏng rõ hơn */
    const title = lines.slice(0, Math.max(i, 0)).reverse().find(l => /^not ok/.test(l))
    if (/Timeout \d+ms exceeded/.test(pick) && title) pick = `${title.replace(/^not ok \d+ - /, '')} – quá thời gian chờ`
    const clean = pick.replace(/^❌\s*/, '').replace(/^['"]|['"]$/g, '').replace(/^- /, '')
    return clean.length > 140 ? `${clean.slice(0, 137)}…` : clean
}

if (require.main === module) {
    const [file, flag] = process.argv.slice(2)
    const text = file && fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
    const lines = summarize(text)
    console.log(flag === '--short' ? shortReason(lines) : lines.join('\n'))
}

module.exports = { summarize, shortReason }
