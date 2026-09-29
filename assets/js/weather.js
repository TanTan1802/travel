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

const WEEKDAYS = LANG === 'en'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
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

/* Đánh dấu tháng hiện tại trên thanh 12 tháng */
function markCurrentMonth(root = document) {
    const month = new Date().getMonth() + 1
    root.querySelectorAll(`.season__month[data-month="${month}"]`).forEach(el => {
        el.classList.add('season__month--current')
        el.setAttribute('aria-current', 'date')
    })
    root.querySelectorAll('[data-season-status]').forEach(el => {
        const best = el.dataset.seasonStatus.split(',').map(Number)
        el.textContent = best.includes(month)
            ? t('Tháng {m} là thời điểm đẹp để đi!', { m: monthLabel(month) })
            : t('Tháng {m} chưa phải mùa đẹp nhất – cân nhắc các tháng được tô màu.', { m: monthLabel(month) })
        el.classList.toggle('season__status--good', best.includes(month))
    })
}
