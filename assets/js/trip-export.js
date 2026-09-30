/*==================== XUẤT LỊCH TRÌNH: LỊCH (.ics / GOOGLE CALENDAR) & GOOGLE MAPS ====================*/
/*
 * - File .ics theo chuẩn iCalendar (RFC 5545): mỗi mốc trong timeline là một sự kiện có giờ,
 *   múi giờ Asia/Ho_Chi_Minh – nhập được vào Google Calendar, Apple Calendar, Outlook.
 * - Link Google Calendar: một sự kiện cả ngày cho từng ngày, phần mô tả là timeline của ngày đó.
 * - Link Google Maps: lộ trình các điểm tham quan trong ngày / toàn tuyến nhiều điểm đến.
 * Chỉ gồm hàm thuần (không đụng DOM) trừ downloadTextFile – dùng được cả khi build và trong test.
 */
const TRIP_TZ = 'Asia/Ho_Chi_Minh'
const ICS_PRODID = '-//Viet Travel//Lich trinh du lich Viet Nam//VI'
/* Google Maps nhận tối đa 9 điểm dừng giữa đường (web) */
const MAPS_MAX_WAYPOINTS = 8

/*---------- Thời gian ----------*/
const pad2 = n => String(n).padStart(2, '0')
const isoToCompact = iso => iso.replace(/-/g, '')

/* '2026-10-05' + '07:30' (+ phút) → '20261005T073000' (giờ địa phương, dùng với TZID) */
function localStamp(date, time, addMinutes = 0) {
    const [h, m] = time.split(':').map(Number)
    const total = h * 60 + m + addMinutes
    const day = addDays(date, Math.floor(total / 1440))
    const minutes = ((total % 1440) + 1440) % 1440
    return `${isoToCompact(day)}T${pad2(Math.floor(minutes / 60))}${pad2(minutes % 60)}00`
}

const minutesOf = time => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
}

/* Thời điểm tạo file theo UTC – bắt buộc trong mỗi VEVENT (DTSTAMP) */
function utcStamp(now = new Date()) {
    return `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}T` +
        `${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`
}

/*---------- Nội dung một mốc timeline ----------*/
/* Chữ thuần (không HTML) mô tả một mốc: hoạt động, quán, điểm tham quan kèm giá vé, giờ mở cửa */
function timelineEntryText(e) {
    const lines = []
    if (e.text) lines.push(e.text)
    if (e.place) {
        const price = e.place.price ? priceRange(e.place.price) : e.place.priceText
        lines.push(`${e.place.name} – ${pickLang(e.place.dish || e.place.drink)}`)
        lines.push(`${e.place.address}${price ? ` · ${price}` : ''}`)
    }
    ;(e.sights || []).forEach(s => {
        lines.push(`• ${pickLang(s.name)}: ${sightPriceText(s.price)} · ${sightHours(s.hours)} · ${s.address}`)
    })
    return lines.join('\n')
}

function timelineEntryLocation(e, destName) {
    if (e.place) return `${e.place.name}, ${e.place.address}`
    if (e.sights && e.sights.length) return `${e.sights[0].name[0]}, ${e.sights[0].address}`
    return destName
}

/*
 * Timeline một ngày → danh sách sự kiện có giờ. Mỗi mốc kéo dài tới mốc kế tiếp
 * (tối thiểu 30 phút); mốc cuối ngày kéo dài 30 phút.
 */
function timelineToEvents(entries, { date, destName, dayLabel }) {
    return entries.map((e, i) => {
        const next = entries[i + 1]
        const duration = next ? Math.max(30, minutesOf(next.time) - minutesOf(e.time)) : 30
        return {
            start: localStamp(date, e.time),
            end: localStamp(date, e.time, duration),
            summary: `${e.title} – ${destName}`,
            description: `${dayLabel}\n${timelineEntryText(e)}`.trim(),
            location: timelineEntryLocation(e, destName),
        }
    })
}

/*---------- Tạo file .ics ----------*/
/* Thoát ký tự đặc biệt trong giá trị TEXT (RFC 5545 §3.3.11) */
const icsText = value => String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')

/* Gập dòng dài hơn 75 byte UTF-8, dòng nối bắt đầu bằng một dấu cách (RFC 5545 §3.1) */
function foldIcsLine(line) {
    const bytes = ch => new TextEncoder().encode(ch).length
    const out = []
    let current = ''
    let size = 0
    for (const ch of line) {
        const b = bytes(ch)
        const limit = out.length ? 74 : 75
        if (size + b > limit) {
            out.push(current)
            current = ''
            size = 0
        }
        current += ch
        size += b
    }
    out.push(current)
    return out.join('\r\n ')
}

/* Mã ngắn ổn định để UID không đổi giữa các lần tải lại cùng một lịch trình */
function shortHash(text) {
    let h = 5381
    for (const ch of text) h = ((h * 33) ^ ch.codePointAt(0)) >>> 0
    return h.toString(36)
}

function buildIcs({ name, events, now = new Date() }) {
    const stamp = utcStamp(now)
    const base = shortHash(`${name}|${events.map(e => e.start).join(',')}`)
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        `PRODID:${ICS_PRODID}`,
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${icsText(name)}`,
        `X-WR-TIMEZONE:${TRIP_TZ}`,
        /* Việt Nam dùng UTC+7 quanh năm, không có giờ mùa hè */
        'BEGIN:VTIMEZONE',
        `TZID:${TRIP_TZ}`,
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZOFFSETFROM:+0700',
        'TZOFFSETTO:+0700',
        'TZNAME:+07',
        'END:STANDARD',
        'END:VTIMEZONE',
    ]
    events.forEach((e, i) => {
        lines.push(
            'BEGIN:VEVENT',
            `UID:${base}-${i}@viet-travel`,
            `DTSTAMP:${stamp}`,
            `DTSTART;TZID=${TRIP_TZ}:${e.start}`,
            `DTEND;TZID=${TRIP_TZ}:${e.end}`,
            `SUMMARY:${icsText(e.summary)}`,
            ...(e.description ? [`DESCRIPTION:${icsText(e.description)}`] : []),
            ...(e.location ? [`LOCATION:${icsText(e.location)}`] : []),
            ...(e.url ? [`URL:${e.url}`] : []),
            'END:VEVENT',
        )
    })
    lines.push('END:VCALENDAR')
    return lines.map(foldIcsLine).join('\r\n') + '\r\n'
}

/* Tên file an toàn: bỏ dấu, chỉ giữ chữ, số và gạch nối */
function safeFileName(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'lich-trinh'
}

function downloadTextFile(fileName, content, type = 'text/calendar;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/*---------- Google Calendar: một sự kiện cả ngày ----------*/
const GCAL_DETAILS_MAX = 1500 // giữ URL đủ ngắn cho mọi trình duyệt

function googleCalendarDayUrl({ title, date, details = '', location = '' }) {
    const text = details.length > GCAL_DETAILS_MAX ? `${details.slice(0, GCAL_DETAILS_MAX - 1)}…` : details
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${isoToCompact(date)}/${isoToCompact(addDays(date, 1))}`,
        details: text,
        location,
        ctz: TRIP_TZ,
    })
    return `https://calendar.google.com/calendar/render?${params}`
}

/* Mô tả gọn cả ngày cho Google Calendar: mỗi mốc một dòng */
function dayDetailsText(entries) {
    return entries.map(e => {
        const what = e.place ? `${e.place.name} (${e.place.address})` : e.text
        const sights = (e.sights || []).map(s => pickLang(s.name)).join(', ')
        return `${e.time} ${e.title}: ${what}${sights ? ` – ${sights}` : ''}`
    }).join('\n')
}

/*---------- Google Maps ----------*/
function mapsDirectionsUrlFor(stops, travelmode = '') {
    if (!stops.length) return ''
    if (stops.length === 1) return mapsSearchUrl(stops[0])
    const trimmed = stops.length > MAPS_MAX_WAYPOINTS + 2
        ? [stops[0], ...stops.slice(1, MAPS_MAX_WAYPOINTS + 1), stops[stops.length - 1]]
        : stops
    const params = new URLSearchParams({ api: '1', origin: trimmed[0], destination: trimmed[trimmed.length - 1] })
    if (trimmed.length > 2) params.set('waypoints', trimmed.slice(1, -1).join('|'))
    if (travelmode) params.set('travelmode', travelmode)
    return `https://www.google.com/maps/dir/?${params}`
}

/* Lộ trình các điểm tham quan trong ngày (bỏ buổi sáng nếu là ngày di chuyển) */
function dayRouteUrl(destId, dayIndex, { skipMorning = false } = {}) {
    const stops = sightsOf(destId, dayIndex)
        .filter(s => !(skipMorning && s.at === 'm'))
        .map(s => `${s.name[0]}, ${s.address}`)
    return mapsDirectionsUrlFor([...new Set(stops)])
}

/* Toàn tuyến nhiều điểm đến theo tọa độ */
function tripRouteUrl(dests) {
    return mapsDirectionsUrlFor(dests.map(d => `${d.lat},${d.lng}`), 'driving')
}
