/*==================== THỜI TIẾT (OPEN-METEO, KHÔNG CẦN API KEY) ====================*/
const WEATHER_CODES = [
    { codes: [0], text: 'Trời quang', icon: 'ri-sun-line' },
    { codes: [1, 2], text: 'Ít mây', icon: 'ri-sun-cloudy-line' },
    { codes: [3], text: 'Nhiều mây', icon: 'ri-cloudy-line' },
    { codes: [45, 48], text: 'Sương mù', icon: 'ri-mist-line' },
    { codes: [51, 53, 55, 56, 57], text: 'Mưa phùn', icon: 'ri-drizzle-line' },
    { codes: [61, 63, 66, 80, 81], text: 'Có mưa', icon: 'ri-showers-line' },
    { codes: [65, 67, 82], text: 'Mưa to', icon: 'ri-heavy-showers-line' },
    { codes: [71, 73, 75, 77, 85, 86], text: 'Tuyết', icon: 'ri-snowy-line' },
    { codes: [95, 96, 99], text: 'Dông', icon: 'ri-thunderstorms-line' },
]

function describeWeather(code) {
    const w = WEATHER_CODES.find(x => x.codes.includes(code)) || { text: 'Không rõ', icon: 'ri-question-line' }
    return { ...w, text: t(w.text) }
}

const WEEKDAYS = {
    vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    ko: ['일', '월', '화', '수', '목', '금', '토'],
    zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    ja: ['日', '月', '火', '水', '木', '金', '土'],
}[LANG]
const WEATHER_CACHE_MINUTES = 30

async function fetchWeather(lat, lng) {
    const cacheKey = `viet-travel:weather:${lat},${lng}`
    try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null')
        if (cached && Date.now() - cached.time < WEATHER_CACHE_MINUTES * 60000) return cached.data
    } catch { /* bỏ qua cache lỗi */ }

    const url = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
        latitude: lat,
        longitude: lng,
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        timezone: 'Asia/Ho_Chi_Minh',
        forecast_days: 4,
    })
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data }))
    } catch { /* bỏ qua */ }
    return data
}

function renderWeather(el, data) {
    const now = data.current
    const current = describeWeather(now.weather_code)
    const days = data.daily.time.slice(1).map((date, i) => ({
        date: new Date(`${date}T00:00:00`),
        code: data.daily.weather_code[i + 1],
        max: data.daily.temperature_2m_max[i + 1],
        min: data.daily.temperature_2m_min[i + 1],
        rain: data.daily.precipitation_probability_max[i + 1],
    }))

    el.innerHTML = `
        <div class="weather__now">
            <i class="${current.icon} weather__icon"></i>
            <div>
                <span class="weather__temp">${Math.round(now.temperature_2m)}°C</span>
                <span class="weather__text">${current.text}</span>
            </div>
        </div>
        <div class="weather__meta">
            <span><i class="ri-drop-line"></i> ${t('Độ ẩm')} ${now.relative_humidity_2m}%</span>
            <span><i class="ri-windy-line"></i> ${t('Gió')} ${Math.round(now.wind_speed_10m)} km/h</span>
        </div>
        <ul class="weather__forecast">
            ${days.map(day => {
                const w = describeWeather(day.code)
                return `
                    <li title="${w.text}">
                        <span>${WEEKDAYS[day.date.getDay()]}</span>
                        <i class="${w.icon}"></i>
                        <strong>${Math.round(day.max)}° / ${Math.round(day.min)}°</strong>
                        ${day.rain != null ? `<small><i class="ri-umbrella-line"></i> ${day.rain}%</small>` : ''}
                    </li>
                `
            }).join('')}
        </ul>
        <p class="weather__source">${t('Nguồn')}: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a></p>
    `
}

function initWeather(el, lat, lng) {
    if (!el) return
    whenVisible(el, async () => {
        try {
            renderWeather(el, await fetchWeather(lat, lng))
            el.classList.remove('weather--loading')
        } catch {
            el.classList.remove('weather--loading')
            el.innerHTML = `<p class="weather__error"><i class="ri-cloud-off-line"></i> ${t('Chưa lấy được thời tiết lúc này.')}</p>`
        }
    })
}

/*==================== DỰ BÁO THEO NGÀY ĐI ====================*/
/* Open-Meteo dự báo tối đa 16 ngày (hôm nay + 15); xa hơn thì báo ngày sẽ có dự báo */
const FORECAST_DAYS = 16
const FORECAST_CACHE_MINUTES = 60

function todayIso(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const lastForecastDate = (now = new Date()) => addDays(todayIso(now), FORECAST_DAYS - 1)

/* Phần khoảng ngày [start, end] nằm trong tầm dự báo, hoặc null nếu không có ngày nào */
function forecastWindow(start, end, now = new Date()) {
    const from = start > todayIso(now) ? start : todayIso(now)
    const to = end < lastForecastDate(now) ? end : lastForecastDate(now)
    return from <= to ? { from, to } : null
}

/* { 'YYYY-MM-DD': { code, max, min, rain } } cho một tọa độ trong khoảng ngày */
async function fetchDailyForecast(lat, lng, from, to) {
    const cacheKey = `viet-travel:forecast:${lat},${lng}:${from}:${to}`
    try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null')
        if (cached && Date.now() - cached.time < FORECAST_CACHE_MINUTES * 60000) return cached.data
    } catch { /* bỏ qua cache lỗi */ }

    const url = 'https://api.open-meteo.com/v1/forecast?' + new URLSearchParams({
        latitude: lat,
        longitude: lng,
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        timezone: 'Asia/Ho_Chi_Minh',
        start_date: from,
        end_date: to,
    })
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const data = Object.fromEntries(json.daily.time.map((date, i) => [date, {
        code: json.daily.weather_code[i],
        max: json.daily.temperature_2m_max[i],
        min: json.daily.temperature_2m_min[i],
        rain: json.daily.precipitation_probability_max[i],
    }]))

    try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data }))
    } catch { /* bỏ qua */ }
    return data
}

function forecastChipHtml(day) {
    const w = describeWeather(day.code)
    return `
        <span class="forecast-chip" title="${t('Dự báo')}: ${w.text}">
            <i class="${w.icon}"></i> ${w.text} · <strong>${Math.round(day.max)}° / ${Math.round(day.min)}°</strong>
            ${day.rain != null ? `<small><i class="ri-umbrella-line"></i> ${day.rain}%</small>` : ''}
        </span>
    `
}

/* Ngày quá xa để dự báo: báo ngày có dự báo + mùa đẹp hay không */
function forecastLaterHtml(date, dest, now = new Date()) {
    const month = Number(date.slice(5, 7))
    const inSeason = dest && dest.bestMonths.includes(month)
    return `
        <span class="forecast-chip forecast-chip--later">
            <i class="ri-calendar-check-line"></i> ${t('Có dự báo từ {date}', { date: formatDate(addDays(date, -(FORECAST_DAYS - 1))) })}
            ${dest ? `· <em>${inSeason ? t('Tháng {m} là mùa đẹp', { m: monthLabel(month) }) : t('Tháng {m} chưa phải mùa đẹp nhất', { m: monthLabel(month) })}</em>` : ''}
        </span>
    `
}

/*
 * Điền dự báo vào các ô <span data-forecast-date="YYYY-MM-DD" data-forecast-dest="id">.
 * Gom theo điểm đến để mỗi nơi chỉ gọi API một lần.
 */
async function fillForecasts(root = document, now = new Date()) {
    const slots = [...root.querySelectorAll('[data-forecast-date]')]
    const today = todayIso(now)
    const groups = new Map()
    slots.forEach(el => {
        const date = el.dataset.forecastDate
        const dest = getDestination(el.dataset.forecastDest)
        if (!date || !dest || date < today) {
            el.innerHTML = ''
            return
        }
        if (date > lastForecastDate(now)) {
            el.innerHTML = forecastLaterHtml(date, dest, now)
            return
        }
        if (!groups.has(dest.id)) groups.set(dest.id, { dest, slots: [] })
        groups.get(dest.id).slots.push(el)
    })

    await Promise.all([...groups.values()].map(async ({ dest, slots: list }) => {
        const dates = list.map(el => el.dataset.forecastDate).sort()
        const range = forecastWindow(dates[0], dates[dates.length - 1], now)
        if (!range) return
        list.forEach(el => { el.innerHTML = `<span class="forecast-chip forecast-chip--loading"><i class="ri-loader-4-line"></i> ${t('Đang tải dự báo...')}</span>` })
        try {
            const data = await fetchDailyForecast(dest.lat, dest.lng, range.from, range.to)
            list.forEach(el => {
                const day = data[el.dataset.forecastDate]
                el.innerHTML = day ? forecastChipHtml(day) : ''
            })
        } catch {
            list.forEach(el => { el.innerHTML = `<span class="forecast-chip forecast-chip--error"><i class="ri-cloud-off-line"></i> ${t('Chưa lấy được dự báo')}</span>` })
        }
    }))
}

/* Đánh dấu tháng hiện tại trên thanh 12 tháng */
function markCurrentMonth(root = document) {
    const month = new Date().getMonth() + 1
    root.querySelectorAll(`.season__month[data-month="${month}"]`).forEach(el => {
        el.classList.add('season__month--current')
        el.setAttribute('aria-current', 'date')
    })
    /* Nhận xét theo tháng do initSeasonPicker() (destination.js) hiển thị */
}
