/*
 * Sinh trang tĩnh cho cả hai ngôn ngữ + sitemap.   Chạy:  npm run build
 *
 * Tiếng Việt (gốc site):
 *   - diem-den/<id>/index.html – trang điểm đến render sẵn (SEO + Open Graph).
 *   - index.html – chèn sẵn danh sách thẻ điểm đến.
 * Tiếng Anh (thư mục en/):
 *   - en/index.html, en/diem-den/<id>/index.html – dịch từ assets/js/data/en.js.
 * Kèm sitemap.xml, robots.txt và cập nhật phiên bản service worker.
 *
 * Mẫu giao diện là index.html và destination.html – sửa ở đó rồi chạy lại build.
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { ROOT, loadBrowserScripts } = require('./lib')

const SITE_URL = 'https://tantan1802.github.io/travel/'
const PAGE_DIR = 'diem-den'
const PLANNER_DIR = 'ke-hoach'

const LANGS = {
    vi: { prefix: '', locale: 'vi_VN', switchLabel: 'EN' },
    en: { prefix: 'en/', locale: 'en_US', switchLabel: 'VI' },
}

const SCRIPTS = [
    'assets/js/data/local-images.js',
    'assets/js/i18n.js',
    'assets/js/data/destinations.js',
    'assets/js/data/itineraries.js',
    'assets/js/data/places.js',
    'assets/js/components.js',
    'assets/js/config.js',
    'assets/js/destination-render.js',
]
const EXPORTS = ['DESTINATIONS', 'REGIONS', 'CATEGORIES', 'LOCAL_IMAGES', 'WIKI_BASE', 'TRANSLATION_EN',
    'renderDestinationPage', 'destinationCard', 'wikiImg', 'wikiSrcset', 'imageSizes']

const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true })
    fs.writeFileSync(path.join(ROOT, rel), content)
}

const escapeHtml = text => String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function truncate(text, max = 160) {
    return text.length <= max ? text : text.slice(0, text.lastIndexOf(' ', max - 1)) + '…'
}

/* Nạp dữ liệu + hàm render cho một ngôn ngữ, với đường dẫn gốc tương ứng độ sâu của trang */
function loadSite(lang, siteRoot) {
    const scripts = lang === 'en' ? ['assets/js/data/en.js', ...SCRIPTS] : SCRIPTS
    return loadBrowserScripts(scripts, EXPORTS, { SITE_ROOT: siteRoot, SITE_LANG: lang })
}

const homePath = lang => `${LANGS[lang].prefix}index.html`
const destPath = (lang, id) => `${LANGS[lang].prefix}${PAGE_DIR}/${id}/index.html`
const plannerPath = lang => `${LANGS[lang].prefix}${PLANNER_DIR}/index.html`
const pageUrl = rel => SITE_URL + rel.replace(/index\.html$/, '')
const rootFor = rel => '../'.repeat(rel.split('/').length - 1)

/* URL tuyệt đối của ảnh (dùng cho og:image) */
/* Ảnh chia sẻ của điểm đến (JPEG 1200x630 do optimize-images.js tạo), nếu chưa có thì dùng ảnh bìa */
function ogImage(site, d) {
    const rel = `assets/img/og/${d.id}.jpg`
    return fs.existsSync(path.join(ROOT, rel)) ? SITE_URL + rel : absoluteImage(site, d.hero)
}

function absoluteImage(site, file) {
    const local = site.LOCAL_IMAGES && site.LOCAL_IMAGES[file]
    if (local) return SITE_URL + local.lg
    return `${site.WIKI_BASE}Special:FilePath/${encodeURIComponent(file)}?width=1280`
}

/*
 * Sửa đường dẫn tương đối trong mẫu HTML cho trang nằm ở thư mục con:
 * trang HTML (index.html, diem-den/) trỏ về bản cùng ngôn ngữ, còn tài nguyên trỏ về gốc site.
 */
function prefixPaths(html, siteRoot, langRoot) {
    return html.replace(/(href|src)="(?!https?:|#|mailto:|data:|\/)([^"]+)"/g, (m, attr, url) => {
        const isPage = url.startsWith('index.html') || url.startsWith(`${PAGE_DIR}/`) || url.startsWith(`${PLANNER_DIR}/`)
        return `${attr}="${isPage ? langRoot : siteRoot}${url}"`
    })
}

/* Dịch chuỗi trong HTML tĩnh theo bảng TRANSLATION_EN.html (bỏ qua <script>) */
function translateHtml(html, map) {
    const scripts = []
    html = html.replace(/<script[\s\S]*?<\/script>/g, m => `\u0000${scripts.push(m) - 1}\u0000`)
    html = html.replace(/>([^<>]+)</g, (m, text) => {
        const key = text.replace(/\s+/g, ' ').trim()
        if (!key || !(key in map)) return m
        const [, lead, trail] = text.match(/^(\s*)[\s\S]*?(\s*)$/)
        return `>${lead}${map[key]}${trail}<`
    })
    html = html.replace(/\b(content|placeholder|alt|aria-label|title)="([^"]+)"/g,
        (m, attr, value) => (value in map ? `${attr}="${map[value]}"` : m))
    return html.replace(/\u0000(\d+)\u0000/g, (m, i) => scripts[i])
}

/*
 * Ảnh quan trọng nhất trang (data-priority: ảnh bìa) được ghi sẵn src/srcset vào HTML
 * để trình duyệt tải ngay từ đầu thay vì chờ JavaScript – cải thiện LCP.
 */
function prioritizeImages(html, site) {
    return html.replace(/<img ([^>]*?)data-priority([^>]*)>/g, (m, before, after) => {
        const attrs = (before + after).replace(/\s(src|srcset|sizes|fetchpriority)="[^"]*"/g, '').replace(/\s+/g, ' ')
        const files = (attrs.match(/data-wiki="([^"]*)"/) || [])[1]?.split('|') || []
        const file = files.find(f => site.LOCAL_IMAGES[f.replace(/&quot;/g, '"')])
        if (!file) return `<img ${before}data-priority${after}>`
        const width = Number((attrs.match(/data-width="(\d+)"/) || [])[1]) || 1280
        const name = file.replace(/&quot;/g, '"')
        return `<img ${attrs.trim()} data-priority src="${site.wikiImg(name, width)}" ` +
            `srcset="${site.wikiSrcset(name)}" sizes="${site.imageSizes(width)}" fetchpriority="high">`
    })
}

function alternateLinks(viRel, enRel) {
    return `
        <link rel="alternate" hreflang="vi" href="${pageUrl(viRel)}">
        <link rel="alternate" hreflang="en" href="${pageUrl(enRel)}">
        <link rel="alternate" hreflang="x-default" href="${pageUrl(viRel)}">`
}

/* Nút chuyển ngôn ngữ trỏ tới trang tương ứng của ngôn ngữ kia */
function setLangSwitch(html, lang, siteRoot, otherRel) {
    const other = lang === 'vi' ? 'en' : 'vi'
    return html.replace(/<a class="nav__lang"[^>]*>[^<]*<\/a>/,
        `<a class="nav__lang" id="lang-switch" href="${siteRoot}${otherRel}" hreflang="${other}" lang="${other}" title="${other === 'en' ? 'English' : 'Tiếng Việt'}">${LANGS[lang].switchLabel}</a>`)
}

/* Chuẩn bị mẫu HTML cho một ngôn ngữ và độ sâu thư mục */
function prepareTemplate(template, lang, rel, site) {
    const siteRoot = rootFor(rel)
    let html = template
    if (lang === 'en') {
        html = translateHtml(html, site.TRANSLATION_EN.html)
            .replace('<html lang="vi">', '<html lang="en">')
            .replace('<script defer src="assets/js/data/local-images.js"></script>',
                '<script defer src="assets/js/data/en.js"></script>\n        <script defer src="assets/js/data/local-images.js"></script>')
    }
    html = prefixPaths(html, siteRoot, siteRoot + LANGS[lang].prefix)
    return { html, siteRoot }
}

function headTags(site, d, lang) {
    const rel = destPath(lang, d.id)
    const url = pageUrl(rel)
    const title = `${d.name} – ${d.tagline}`
    const image = ogImage(site, d)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TouristDestination',
        name: d.name,
        description: d.description,
        url,
        inLanguage: lang,
        image: [d.hero, ...d.gallery.map(g => g.file)].slice(0, 4).map(f => absoluteImage(site, f)),
        address: { '@type': 'PostalAddress', addressRegion: d.province, addressCountry: 'VN' },
        touristType: d.categories.map(c => site.CATEGORIES[c]),
        ...(d.lat ? { geo: { '@type': 'GeoCoordinates', latitude: d.lat, longitude: d.lng } } : {}),
    }

    return `
        <link rel="canonical" href="${url}">${alternateLinks(destPath('vi', d.id), destPath('en', d.id))}
        <meta property="og:type" content="article">
        <meta property="og:site_name" content="Việt Travel">
        <meta property="og:locale" content="${LANGS[lang].locale}">
        <meta property="og:title" content="${escapeHtml(title)}">
        <meta property="og:description" content="${escapeHtml(truncate(d.description))}">
        <meta property="og:url" content="${url}">
        <meta property="og:image" content="${escapeHtml(image)}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta name="twitter:card" content="summary_large_image">
        <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    `
}

function buildDestinationPage(template, lang, d, site) {
    const rel = destPath(lang, d.id)
    let { html, siteRoot } = prepareTemplate(template, lang, rel, site)
    const other = lang === 'vi' ? 'en' : 'vi'

    html = setLangSwitch(html, lang, siteRoot, destPath(other, d.id))
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(d.name)} – Việt Travel</title>`)
        .replace(/<meta name="description" content="[^"]*">/,
            `<meta name="description" content="${escapeHtml(truncate(d.description))}">`)
        .replace('</head>', `${headTags(site, d, lang)}</head>`)
        .replace(/(\s*)<script defer src="/,
            `$1<script>window.SITE_ROOT = '${siteRoot}'; window.SITE_LANG = '${lang}'; window.DEST_ID = '${d.id}'</script>$1<script defer src="`)
        .replace('<main class="main" id="destination"></main>',
            `<main class="main" id="destination" data-prerendered>${site.renderDestinationPage(d)}</main>`)

    html = prioritizeImages(html, site)
    if (!html.includes('data-prerendered')) throw new Error('Không tìm thấy <main id="destination"> trong destination.html')
    return html
}

function buildHome(template, lang, site) {
    const rel = homePath(lang)
    let { html, siteRoot } = prepareTemplate(template, lang, rel, site)
    const cards = site.DESTINATIONS.map(d => site.destinationCard(d)).join('')

    html = setLangSwitch(html, lang, siteRoot, homePath(lang === 'vi' ? 'en' : 'vi'))
        .replace(/<!-- build:grid -->[\s\S]*?<!-- \/build:grid -->/, `<!-- build:grid -->${cards}<!-- /build:grid -->`)
        .replace(/(<span id="dest-count">)\d+(<\/span>)/, `$1${site.DESTINATIONS.length}$2`)
        .replace(/<!-- build:alternate -->[\s\S]*?<!-- \/build:alternate -->/,
            `<!-- build:alternate -->${alternateLinks(homePath('vi'), homePath('en'))}\n        <!-- /build:alternate -->`)
        .replace(/(<link rel="canonical" href=")[^"]*(">)/, `$1${pageUrl(rel)}$2`)
        .replace(/(<meta property="og:url" content=")[^"]*(">)/, `$1${pageUrl(rel)}$2`)
        .replace(/(<meta property="og:locale" content=")[^"]*(">)/, `$1${LANGS[lang].locale}$2`)

    html = prioritizeImages(html, site)
    if (lang === 'en') {
        html = html.replace(/(\s*)<script defer src="/,
            `$1<script>window.SITE_ROOT = '${siteRoot}'; window.SITE_LANG = 'en'</script>$1<script defer src="`)
    }
    return html
}

/* Trang lập kế hoạch chuyến đi: nội dung do planner.js tạo trên trình duyệt */
function buildPlanner(template, lang, site) {
    const rel = plannerPath(lang)
    const other = lang === 'vi' ? 'en' : 'vi'
    let { html, siteRoot } = prepareTemplate(template, lang, rel, site)
    const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]
    const description = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1]
    const head = `
        <link rel="canonical" href="${pageUrl(rel)}">${alternateLinks(plannerPath('vi'), plannerPath('en'))}
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="Việt Travel">
        <meta property="og:locale" content="${LANGS[lang].locale}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:url" content="${pageUrl(rel)}">
        <meta property="og:image" content="${SITE_URL}assets/img/og/hoi-an.jpg">
        <meta name="twitter:card" content="summary_large_image">
    `
    return setLangSwitch(html, lang, siteRoot, plannerPath(other))
        .replace('</head>', `${head}</head>`)
        .replace(/(\s*)<script defer src="/,
            `$1<script>window.SITE_ROOT = '${siteRoot}'; window.SITE_LANG = '${lang}'</script>$1<script defer src="`)
}

function buildSitemap(site) {
    const today = new Date().toISOString().slice(0, 10)
    const rels = Object.keys(LANGS).flatMap(lang =>
        [homePath(lang), plannerPath(lang), ...site.DESTINATIONS.map(d => destPath(lang, d.id))])
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rels.map(rel => `  <url><loc>${pageUrl(rel)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
}

/* Đổi VERSION của service worker theo nội dung tài nguyên để trình duyệt tải bản mới */
function updateServiceWorkerVersion(sw) {
    const assets = [...sw.matchAll(/'\.\/([^']+\.(?:css|js|html|webmanifest))'/g)].map(m => m[1])
    const hash = crypto.createHash('md5')
    assets.forEach(file => hash.update(read(file)))
    return sw.replace(/const VERSION = '[^']*'/, `const VERSION = '${hash.digest('hex').slice(0, 10)}'`)
}

function main() {
    const destTemplate = read('destination.html')
    const homeTemplate = read('index.html')
    const plannerTemplate = read('planner.html')
    for (const marker of ['<!-- build:grid -->', '<!-- build:alternate -->', 'class="nav__lang"']) {
        if (!homeTemplate.includes(marker)) throw new Error(`index.html thiếu ${marker}`)
    }

    // Xóa trang cũ (điểm đến đã bị đổi tên/xóa)
    fs.rmSync(path.join(ROOT, PAGE_DIR), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, 'en'), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, PLANNER_DIR), { recursive: true, force: true })

    let count = 0
    for (const lang of Object.keys(LANGS)) {
        const pageSite = loadSite(lang, rootFor(destPath(lang, 'x')))
        for (const d of pageSite.DESTINATIONS) {
            write(destPath(lang, d.id), buildDestinationPage(destTemplate, lang, d, pageSite))
            count++
        }
        write(homePath(lang), buildHome(homeTemplate, lang, loadSite(lang, rootFor(homePath(lang)))))
        write(plannerPath(lang), buildPlanner(plannerTemplate, lang, loadSite(lang, rootFor(plannerPath(lang)))))
    }

    write('sitemap.xml', buildSitemap(loadSite('vi', '')))
    write('sw.js', updateServiceWorkerVersion(read('sw.js')))
    write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`)

    console.log(`✅ Đã tạo ${count} trang điểm đến (vi + en), 2 trang chủ, 2 trang kế hoạch, sitemap.xml, robots.txt`)
}

main()
