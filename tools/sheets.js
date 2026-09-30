/*
 * Đồng bộ giá vé, giờ mở cửa, giá quán với Google Sheets (qua file CSV).
 *
 *   node tools/sheets.js export          – xuất data/sheets/sights.csv + eats.csv (để nhập vào Google Sheets lần đầu)
 *   node tools/sheets.js sync            – đọc CSV từ SHEET_SIGHTS_CSV / SHEET_EATS_CSV (link "Xuất bản lên web
 *                                          dạng CSV" của Google Sheets hoặc đường dẫn file), cập nhật data/*.json
 *
 * Chỉ CẬP NHẬT mục đã có (khớp theo mã điểm đến + ngày + tên / loại + tên) – không tự thêm hay xóa mục,
 * để dữ liệu luôn khớp lịch trình. Sau khi đồng bộ, dữ liệu được kiểm tra lại theo JSON Schema.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data')
const SHEETS_DIR = path.join(DATA_DIR, 'sheets')

const SIGHT_COLUMNS = ['dest_id', 'day', 'at', 'name_vi', 'name_en', 'price_min', 'price_max', 'hours', 'address', 'note_vi', 'note_en']
const EAT_COLUMNS = ['dest_id', 'kind', 'name', 'price_min', 'price_max', 'address', 'dish_vi', 'dish_en']

/*---------- CSV (RFC 4180) ----------*/
function parseCsv(text) {
    const rows = []
    let row = []
    let field = ''
    let quoted = false
    const src = text.replace(/^﻿/, '')
    for (let i = 0; i < src.length; i++) {
        const ch = src[i]
        if (quoted) {
            if (ch === '"' && src[i + 1] === '"') { field += '"'; i++ }
            else if (ch === '"') quoted = false
            else field += ch
        } else if (ch === '"') quoted = true
        else if (ch === ',') { row.push(field); field = '' }
        else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && src[i + 1] === '\n') i++
            row.push(field)
            rows.push(row)
            row = []
            field = ''
        } else field += ch
    }
    if (field !== '' || row.length) {
        row.push(field)
        rows.push(row)
    }
    const nonEmpty = rows.filter(r => r.some(cell => cell.trim() !== ''))
    if (!nonEmpty.length) return []
    const header = nonEmpty[0].map(h => h.trim())
    return nonEmpty.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()])))
}

const csvCell = value => {
    const s = value == null ? '' : String(value)
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const toCsv = (columns, rows) => [columns.join(','), ...rows.map(r => columns.map(c => csvCell(r[c])).join(','))].join('\n') + '\n'

/*---------- Chuyển dữ liệu ↔ dòng bảng ----------*/
const priceCells = price => (Array.isArray(price) ? { price_min: price[0], price_max: price[1] } : { price_min: price, price_max: price })
const hoursCell = hours => (Array.isArray(hours) ? `${hours[0]} | ${hours[1]}` : hours)

function sightsToRows(sights) {
    const rows = []
    Object.entries(sights).forEach(([id, days]) => days.forEach((list, d) => list.forEach(s => rows.push({
        dest_id: id, day: d + 1, at: s.at, name_vi: s.name[0], name_en: s.name[1],
        ...priceCells(s.price), hours: hoursCell(s.hours), address: s.address,
        note_vi: s.note ? s.note[0] : '', note_en: s.note ? s.note[1] : '',
    }))))
    return rows
}

function eatsToRows(places) {
    const rows = []
    Object.entries(places).forEach(([id, p]) => {
        p.eats.forEach(e => rows.push({ dest_id: id, kind: 'eat', name: e.name, ...priceCells(e.price), address: e.address, dish_vi: e.dish[0], dish_en: e.dish[1] }))
        p.cafes.forEach(c => rows.push({ dest_id: id, kind: 'cafe', name: c.name, ...priceCells(c.price), address: c.address, dish_vi: c.drink[0], dish_en: c.drink[1] }))
    })
    return rows
}

/* Giá từ ô bảng: "120000", "120.000", "120,000đ" → 120000; min = max → một số; 0 → miễn phí */
function parseVnd(cell) {
    const digits = String(cell || '').replace(/[^\d]/g, '')
    return digits === '' ? null : Number(digits)
}

function priceFromRow(row, { allowSingle = true } = {}) {
    const min = parseVnd(row.price_min)
    const max = parseVnd(row.price_max)
    if (min == null && max == null) return null
    const lo = min == null ? max : min
    const hi = max == null ? min : max
    if (lo > hi) throw new Error(`giá thấp (${lo}) lớn hơn giá cao (${hi})`)
    return allowSingle && lo === hi ? lo : [lo, hi]
}

function hoursFromCell(cell) {
    if (!cell) return null
    const parts = cell.split('|').map(x => x.trim())
    return parts.length === 2 && parts[0] && parts[1] ? parts : cell
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* Áp dòng bảng vào dữ liệu; trả về { changes, unknown, errors } (dữ liệu được sửa trực tiếp) */
function applySightRows(sights, rows) {
    const changes = []
    const unknown = []
    const errors = []
    rows.forEach((row, i) => {
        const line = i + 2
        const list = sights[row.dest_id] && sights[row.dest_id][Number(row.day) - 1]
        const s = list && list.find(x => x.name[0] === row.name_vi)
        if (!s) return unknown.push(`dòng ${line}: ${row.dest_id} ngày ${row.day} – ${row.name_vi}`)
        try {
            const updates = {}
            const price = priceFromRow(row)
            if (price != null) updates.price = price
            const hours = hoursFromCell(row.hours)
            if (hours != null) updates.hours = hours
            if (row.address) updates.address = row.address
            if (row.name_en) updates.name = [s.name[0], row.name_en]
            if (row.note_vi) updates.note = [row.note_vi, row.note_en || row.note_vi]
            Object.entries(updates).forEach(([key, value]) => {
                if (!same(s[key], value)) {
                    changes.push(`${row.dest_id} · ${row.name_vi}: ${key} ${JSON.stringify(s[key])} → ${JSON.stringify(value)}`)
                    s[key] = value
                }
            })
            if (!row.note_vi && s.note && row.note_en === '' && 'note_vi' in row) {
                changes.push(`${row.dest_id} · ${row.name_vi}: bỏ ghi chú`)
                delete s.note
            }
        } catch (err) {
            errors.push(`dòng ${line} (${row.name_vi}): ${err.message}`)
        }
    })
    return { changes, unknown, errors }
}

function applyEatRows(places, rows) {
    const changes = []
    const unknown = []
    const errors = []
    rows.forEach((row, i) => {
        const line = i + 2
        const p = places[row.dest_id]
        const list = p && (row.kind === 'cafe' ? p.cafes : row.kind === 'eat' ? p.eats : null)
        const item = list && list.find(x => x.name === row.name)
        if (!item) return unknown.push(`dòng ${line}: ${row.dest_id} ${row.kind} – ${row.name}`)
        const textKey = row.kind === 'cafe' ? 'drink' : 'dish'
        try {
            const updates = {}
            const price = priceFromRow(row, { allowSingle: false })
            if (price != null) updates.price = price
            if (row.address) updates.address = row.address
            if (row.dish_vi) updates[textKey] = [row.dish_vi, row.dish_en || item[textKey][1]]
            Object.entries(updates).forEach(([key, value]) => {
                if (!same(item[key], value)) {
                    changes.push(`${row.dest_id} · ${row.name}: ${key} ${JSON.stringify(item[key])} → ${JSON.stringify(value)}`)
                    item[key] = value
                }
            })
        } catch (err) {
            errors.push(`dòng ${line} (${row.name}): ${err.message}`)
        }
    })
    return { changes, unknown, errors }
}

/*---------- Dòng lệnh ----------*/
const readJson = name => JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${name}.json`), 'utf8'))
const writeJson = (name, json) => fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(json, null, 2) + '\n')

async function readSource(src) {
    if (/^https?:\/\//.test(src)) {
        const res = await fetch(src)
        if (!res.ok) throw new Error(`Không tải được ${src}: HTTP ${res.status}`)
        return res.text()
    }
    return fs.readFileSync(path.resolve(src), 'utf8')
}

function exportSheets() {
    fs.mkdirSync(SHEETS_DIR, { recursive: true })
    const sights = sightsToRows(readJson('sights').sights)
    const eats = eatsToRows(readJson('places').places)
    fs.writeFileSync(path.join(SHEETS_DIR, 'sights.csv'), toCsv(SIGHT_COLUMNS, sights))
    fs.writeFileSync(path.join(SHEETS_DIR, 'eats.csv'), toCsv(EAT_COLUMNS, eats))
    console.log(`✅ Đã xuất ${sights.length} điểm tham quan → data/sheets/sights.csv, ${eats.length} quán → data/sheets/eats.csv`)
}

async function syncSheets() {
    const sources = { sights: process.env.SHEET_SIGHTS_CSV, eats: process.env.SHEET_EATS_CSV }
    if (!sources.sights && !sources.eats) {
        console.log('ℹ️  Chưa cấu hình SHEET_SIGHTS_CSV / SHEET_EATS_CSV – bỏ qua đồng bộ.')
        return { changed: false }
    }
    const report = { changes: [], unknown: [], errors: [] }
    const merge = r => Object.keys(report).forEach(k => report[k].push(...r[k]))
    const sightsJson = readJson('sights')
    const placesJson = readJson('places')
    if (sources.sights) merge(applySightRows(sightsJson.sights, parseCsv(await readSource(sources.sights))))
    if (sources.eats) merge(applyEatRows(placesJson.places, parseCsv(await readSource(sources.eats))))

    if (report.errors.length) {
        console.error(`❌ ${report.errors.length} dòng lỗi – không ghi thay đổi:`)
        report.errors.forEach(e => console.error(`  - ${e}`))
        process.exitCode = 1
        return { changed: false, report }
    }
    if (report.changes.length) {
        writeJson('sights', sightsJson)
        writeJson('places', placesJson)
        /* Kiểm tra lại toàn bộ dữ liệu sau khi cập nhật */
        const { errors } = require('./build-data').loadAndValidate()
        if (errors.length) {
            console.error('❌ Dữ liệu sau đồng bộ không hợp lệ:')
            errors.forEach(e => console.error(`  - ${e}`))
            process.exitCode = 1
            return { changed: false, report }
        }
    }
    const summary = [
        `## Đồng bộ từ Google Sheets`,
        '',
        `- Thay đổi: **${report.changes.length}**`,
        `- Dòng không khớp mục nào (bỏ qua): **${report.unknown.length}**`,
        '',
        ...(report.changes.length ? ['### Thay đổi', ...report.changes.map(c => `- ${c}`), ''] : []),
        ...(report.unknown.length ? ['### Không khớp (kiểm tra lại tên / ngày)', ...report.unknown.map(c => `- ${c}`)] : []),
    ].join('\n')
    fs.mkdirSync(SHEETS_DIR, { recursive: true })
    fs.writeFileSync(path.join(SHEETS_DIR, 'last-sync.md'), summary + '\n')
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n')
    console.log(summary)
    return { changed: report.changes.length > 0, report }
}

if (require.main === module) {
    const cmd = process.argv[2]
    if (cmd === 'export') exportSheets()
    else if (cmd === 'sync') syncSheets().catch(err => { console.error(err.message); process.exitCode = 1 })
    else console.log('Dùng: node tools/sheets.js export | sync')
}

module.exports = { parseCsv, toCsv, sightsToRows, eatsToRows, applySightRows, applyEatRows, priceFromRow, SIGHT_COLUMNS, EAT_COLUMNS }
