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
 * Mẫu giao diện là home.html (→ index.html), destination.html, planner.html, guide.html – sửa ở đó rồi chạy lại build.
 * Script của mỗi trang được gộp + nén bằng esbuild thành assets/js/dist/<hash>.js (xem bundleScripts).
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const esbuild = require('esbuild')
const { ROOT, loadBrowserScripts } = require('./lib')

const SITE_URL = 'https://tantan1802.github.io/travel/'
const PAGE_DIR = 'diem-den'
const PLANNER_DIR = 'ke-hoach'
const GUIDE_DIR = 'cam-nang'

const LANGS = {
    vi: { prefix: '', locale: 'vi_VN', switchLabel: 'EN' },
    en: { prefix: 'en/', locale: 'en_US', switchLabel: 'VI' },
}

const SCRIPTS = [
    'assets/js/data/local-images.js',
    'assets/js/i18n.js',
    'assets/js/data/destinations.js',
    'assets/js/core.js',
    'assets/js/data/itineraries.js',
    'assets/js/data/places.js',
    'assets/js/data/sights.js',
    'assets/js/data/events.js',
    'assets/js/data/packing.js',
    'assets/js/data/guides.js',
    'assets/js/components.js',
    'assets/js/trip-export.js',
    'assets/js/config.js',
    'assets/js/destination-render.js',
    'assets/js/guide-render.js',
]
const EXPORTS = ['PLACES', 'SIGHTS', 'STAY_TYPES', 'ITINERARIES', 'TOUR_LENGTHS', 'DESTINATIONS', 'REGIONS', 'CATEGORIES', 'LOCAL_IMAGES', 'WIKI_BASE', 'TRANSLATION_EN',
    'renderDestinationPage', 'destinationCard', 'wikiImg', 'wikiSrcset', 'imageSizes',
    'GUIDES', 'guidesIndexPage', 'guideArticlePage', 'homeGuidesSection', 'pickLang']

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
const siteCache = new Map()
function loadSite(lang, siteRoot) {
    const key = `${lang}:${siteRoot}`
    if (!siteCache.has(key)) {
        const scripts = lang === 'en' ? ['assets/js/data/en.js', ...SCRIPTS] : SCRIPTS
        siteCache.set(key, loadBrowserScripts(scripts, EXPORTS, { SITE_ROOT: siteRoot, SITE_LANG: lang }))
    }
    return siteCache.get(key)
}

const homePath = lang => `${LANGS[lang].prefix}index.html`
const destPath = (lang, id) => `${LANGS[lang].prefix}${PAGE_DIR}/${id}/index.html`
const plannerPath = lang => `${LANGS[lang].prefix}${PLANNER_DIR}/index.html`
const guidePath = (lang, slug = '') => `${LANGS[lang].prefix}${GUIDE_DIR}/${slug ? `${slug}/` : ''}index.html`
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
        const isPage = url.startsWith('index.html') || url.startsWith(`${PAGE_DIR}/`) || url.startsWith(`${PLANNER_DIR}/`) || url.startsWith(`${GUIDE_DIR}/`)
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

/*
 * Dữ liệu quán ăn / lưu trú / điểm tham quan / lịch trình (kèm bản dịch lịch trình) chỉ của một điểm đến
 * (~10 KB) để trang điểm đến khỏi tải cả places.js + sights.js + itineraries.js (~250 KB).
 * Trình lập kế hoạch và trang động destination.html?id= vẫn dùng file đầy đủ.
 */
const DEST_DATA_DIR = 'assets/js/data/dest'
const DEST_DATA_SCRIPTS = /(\s*)<script defer src="assets\/js\/data\/places\.js"><\/script>\s*<script defer src="assets\/js\/data\/sights\.js"><\/script>/
const ITINERARIES_SCRIPT = /\s*<script defer src="assets\/js\/data\/itineraries\.js"><\/script>/

function destDataFile(d, site, enSite) {
    const pick = (obj, key) => JSON.stringify(obj && obj[key] ? { [key]: obj[key] } : {})
    return '/* Sinh tự động bởi tools/build.js từ places.js + sights.js + itineraries.js + en.js – không sửa tay. */\n' +
        `const STAY_TYPES = ${JSON.stringify(site.STAY_TYPES)}\n` +
        `const PLACES = ${pick(site.PLACES, d.id)}\n` +
        `const SIGHTS = ${pick(site.SIGHTS, d.id)}\n` +
        `const TOUR_LENGTHS = ${JSON.stringify(site.TOUR_LENGTHS)}\n` +
        `const ITINERARIES = ${pick(site.ITINERARIES, d.id)}\n` +
        `const ITINERARIES_EN = ${pick(enSite.TRANSLATION_EN.itineraries, d.id)}\n`
}

function buildDestinationPage(template, lang, d, site) {
    const rel = destPath(lang, d.id)
    if (!DEST_DATA_SCRIPTS.test(template)) throw new Error('destination.html thiếu thẻ script places.js + sights.js')
    if (!ITINERARIES_SCRIPT.test(template)) throw new Error('destination.html thiếu thẻ script itineraries.js')
    template = template.replace(DEST_DATA_SCRIPTS, `$1<script defer src="${DEST_DATA_DIR}/${d.id}.js"></script>`)
        .replace(ITINERARIES_SCRIPT, '')
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
        .replace(/<!-- build:guides -->[\s\S]*?<!-- \/build:guides -->/, `<!-- build:guides -->${site.homeGuidesSection()}<!-- /build:guides -->`)
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

/* Trang cẩm nang (danh sách hoặc một bài): nội dung render sẵn từ guide-render.js */
function buildGuidePage(template, lang, slug, site) {
    const rel = guidePath(lang, slug)
    const other = lang === 'vi' ? 'en' : 'vi'
    const guide = slug && site.GUIDES.find(g => g.slug === slug)
    let { html, siteRoot } = prepareTemplate(template, lang, rel, site)
    const title = guide ? `${site.pickLang(guide.title)} – Việt Travel` : (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]
    const description = guide ? site.pickLang(guide.summary) : (html.match(/<meta name="description" content="([^"]*)">/) || [])[1]
    const head = `
        <link rel="canonical" href="${pageUrl(rel)}">${alternateLinks(guidePath('vi', slug), guidePath('en', slug))}
        <meta property="og:type" content="${guide ? 'article' : 'website'}">
        <meta property="og:site_name" content="Việt Travel">
        <meta property="og:locale" content="${LANGS[lang].locale}">
        <meta property="og:title" content="${escapeHtml(title)}">
        <meta property="og:description" content="${escapeHtml(description)}">
        <meta property="og:url" content="${pageUrl(rel)}">
        <meta property="og:image" content="${SITE_URL}assets/img/og/${guide && guide.related && guide.related[0] ? guide.related[0] : 'hoi-an'}.jpg">
        <meta name="twitter:card" content="summary_large_image">
    `
    html = setLangSwitch(html, lang, siteRoot, guidePath(other, slug))
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
        .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(description)}">`)
        .replace('</head>', `${head}</head>`)
        .replace(/(\s*)<script defer src="/,
            `$1<script>window.SITE_ROOT = '${siteRoot}'; window.SITE_LANG = '${lang}'</script>$1<script defer src="`)
        .replace('<main class="main guide-page" id="guide-page"></main>',
            `<main class="main guide-page" id="guide-page" data-prerendered>${guide ? site.guideArticlePage(guide) : site.guidesIndexPage()}</main>`)
    if (!html.includes('data-prerendered')) throw new Error('Không tìm thấy <main id="guide-page"> trong guide.html')
    return html
}

function buildSitemap(site) {
    const today = new Date().toISOString().slice(0, 10)
    const rels = Object.keys(LANGS).flatMap(lang =>
        [homePath(lang), plannerPath(lang), guidePath(lang), ...site.GUIDES.map(g => guidePath(lang, g.slug)),
            ...site.DESTINATIONS.map(d => destPath(lang, d.id))])
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rels.map(rel => `  <url><loc>${pageUrl(rel)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
}

/* Đổi VERSION của service worker theo nội dung tài nguyên để trình duyệt tải bản mới */
/* Gồm tài nguyên tải sẵn trong sw.js và mọi file CSS/JS (kể cả file chỉ được lưu khi mở trang) */
function updateServiceWorkerVersion(sw) {
    const listed = [...sw.matchAll(/'\.\/([^']+\.(?:css|js|html|webmanifest))'/g)].map(m => m[1])
    const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e =>
        e.isDirectory() ? walk(`${dir}/${e.name}`) : /\.(?:css|js)$/.test(e.name) ? [`${dir}/${e.name}`] : [])
    const assets = [...new Set([...listed, ...walk('assets/js'), ...walk('assets/css')])].sort()
    const hash = crypto.createHash('md5')
    assets.forEach(file => hash.update(read(file)))
    return sw.replace(/const VERSION = '[^']*'/, `const VERSION = '${hash.digest('hex').slice(0, 10)}'`)
}

/*==================== GỘP & NÉN SCRIPT ====================*/
/*
 * Mỗi chuỗi thẻ <script defer src="assets/js/..."> liền nhau trong trang đã build được gộp thành một
 * file nén assets/js/dist/<hash>.js (cùng nội dung → cùng file, trang giống nhau dùng chung).
 * Các script là script thường dùng chung phạm vi toàn cục nên nối theo đúng thứ tự là tương đương.
 * Dữ liệu riêng từng điểm đến (data/dest/<id>.js) giữ file riêng để "Tải về dùng offline" lưu theo điểm.
 * Rút gọn theo trang: bỏ bảng dịch HTML tĩnh (chỉ build dùng) và bản dịch lịch trình khi trang không
 * nạp itineraries.js (trang điểm đến lấy lịch trình + bản dịch của riêng nó trong data/dest/<id>.js).
 * Nhờ vậy mọi trang điểm đến cùng ngôn ngữ dùng chung một bundle (trình duyệt chỉ tải một lần).
 */
const DIST_DIR = 'assets/js/dist'
const bundles = new Map()

/* LOCAL_IMAGES dạng gọn: chỉ lưu tên gốc + kích thước, đường dẫn 3 cỡ dựng lại trên trình duyệt (~64 KB → ~25 KB) */
function compactLocalImages(images) {
    const compact = {}
    const full = {}
    for (const [file, e] of Object.entries(images)) {
        const base = (e.lg || '').match(/^assets\/img\/wiki\/(.+)-1920\.webp$/)
        if (base && e.sm === `assets/img/wiki/${base[1]}-960.webp` && e.xs === `assets/img/wiki/${base[1]}-480.webp`) {
            compact[file] = [base[1], e.w, e.h]
        } else {
            full[file] = e
        }
    }
    return `const LOCAL_IMAGES = (() => {
    const out = ${JSON.stringify(full)}
    const path = (base, size) => \`assets/img/wiki/\${base}-\${size}.webp\`
    Object.entries(${JSON.stringify(compact)}).forEach(([file, [base, w, h]]) => {
        out[file] = { xs: path(base, 480), sm: path(base, 960), lg: path(base, 1920), w, h }
    })
    return out
})()`
}

function scriptSource(file, site, pageFiles) {
    if (file === 'assets/js/data/local-images.js') return compactLocalImages(site.LOCAL_IMAGES)
    if (file === 'assets/js/data/en.js') {
        const { html, itineraries, ...en } = site.TRANSLATION_EN
        const withPlans = pageFiles.includes('assets/js/data/itineraries.js')
        return `const TRANSLATION_EN = ${JSON.stringify({ ...en, itineraries: withPlans ? itineraries : {} })}`
    }
    return read(file)
}

function bundleFile(files, site, pageFiles) {
    const code = files.map(f => `/* ${f} */\n${scriptSource(f, site, pageFiles)}`).join('\n;\n')
    const { code: min } = esbuild.transformSync(code, { minify: true, legalComments: 'none', charset: 'utf8' })
    const rel = `${DIST_DIR}/${crypto.createHash('md5').update(min).digest('hex').slice(0, 10)}.js`
    bundles.set(rel, min)
    return rel
}

const isOwnFile = src => src.startsWith(`${DEST_DATA_DIR}/`)

function bundleScripts(html, siteRoot, site) {
    html = bundleStyles(html, siteRoot)
    const pageFiles = [...html.matchAll(/<script defer src="([^"]+)"><\/script>/g)].map(m => m[1].slice(siteRoot.length))
    /* Một chuỗi script liền nhau (cho phép chú thích HTML xen giữa – chú thích bị bỏ) */
    return html.replace(/(?:<script defer src="[^"]+"><\/script>\s*(?:<!--[\s\S]*?-->\s*)*)+/g, (run, offset) => {
        const trailing = run.match(/\s*$/)[0]
        const srcs = [...run.matchAll(/src="([^"]+)"/g)].map(m => m[1])
        if (!srcs.every(src => src.startsWith(`${siteRoot}assets/js/`))) return run
        const rels = srcs.map(src => src.slice(siteRoot.length))
        const groups = []
        rels.forEach(rel => {
            if (isOwnFile(rel)) groups.push({ own: rel })
            else if (groups.length && !groups[groups.length - 1].own) groups[groups.length - 1].files.push(rel)
            else groups.push({ files: [rel] })
        })
        const indent = (html.slice(0, offset).match(/[ \t]*$/) || [''])[0]
        return groups.map(g => `<script defer src="${siteRoot}${g.own || bundleFile(g.files, site, pageFiles)}"></script>`)
            .join(`\n${indent}`) + trailing
    })
}

/*
 * CSS: các <link rel="stylesheet"> liền nhau trỏ tới assets/css/ được gộp + nén thành assets/css/site-<hash>.css
 * (đặt cùng thư mục để đường dẫn url(../fonts/...) giữ nguyên).
 */
const CSS_DIR = 'assets/css'

function bundleStyles(html, siteRoot) {
    return html.replace(/(?:<link rel="stylesheet" href="[^"]+">\s*)+/g, (run, offset) => {
        const trailing = run.match(/\s*$/)[0]
        const hrefs = [...run.matchAll(/href="([^"]+)"/g)].map(m => m[1])
        if (hrefs.length < 2 || !hrefs.every(h => h.startsWith(`${siteRoot}${CSS_DIR}/`))) return run
        const code = hrefs.map(h => read(h.slice(siteRoot.length))).join('\n')
        const { code: min } = esbuild.transformSync(code, { loader: 'css', minify: true, legalComments: 'none', charset: 'utf8' })
        const rel = `${CSS_DIR}/site-${crypto.createHash('md5').update(min).digest('hex').slice(0, 10)}.css`
        bundles.set(rel, min)
        return `<link rel="stylesheet" href="${siteRoot}${rel}">${trailing}`
    })
}

/* CSS + script trang chủ (tiếng Việt) để service worker tải sẵn: ghi vào khối build:core-assets của sw.js */
function updateCoreAssets(sw, homeHtml) {
    const assets = [...homeHtml.matchAll(/<(?:script defer src|link rel="stylesheet" href)="([^"]+)"/g)].map(m => `    './${m[1]}',`)
    return sw.replace(/(\/\* build:core-assets \*\/)[\s\S]*?(\n\s*\/\* \/build:core-assets \*\/)/, `$1\n${assets.join('\n')}$2`)
}

function main() {
    const destTemplate = read('destination.html')
    const homeTemplate = read('home.html')
    const plannerTemplate = read('planner.html')
    const guideTemplate = read('guide.html')
    for (const marker of ['<!-- build:grid -->', '<!-- build:alternate -->', 'class="nav__lang"']) {
        if (!homeTemplate.includes(marker)) throw new Error(`home.html thiếu ${marker}`)
    }

    // Xóa trang cũ (điểm đến đã bị đổi tên/xóa)
    fs.rmSync(path.join(ROOT, PAGE_DIR), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, 'en'), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, PLANNER_DIR), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, GUIDE_DIR), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, DEST_DATA_DIR), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, DIST_DIR), { recursive: true, force: true })
    fs.readdirSync(path.join(ROOT, CSS_DIR)).filter(f => /^site-\w+\.css$/.test(f)).forEach(f => fs.rmSync(path.join(ROOT, CSS_DIR, f)))

    let count = 0
    for (const lang of Object.keys(LANGS)) {
        const pageSite = loadSite(lang, rootFor(destPath(lang, 'x')))
        for (const d of pageSite.DESTINATIONS) {
            write(destPath(lang, d.id), bundleScripts(buildDestinationPage(destTemplate, lang, d, pageSite), rootFor(destPath(lang, d.id)), pageSite))
            if (lang === 'vi') write(`${DEST_DATA_DIR}/${d.id}.js`, destDataFile(d, pageSite, loadSite('en', '')))
            count++
        }
        const page = (rel, build) => {
            const site = loadSite(lang, rootFor(rel))
            write(rel, bundleScripts(build(site), rootFor(rel), site))
        }
        page(homePath(lang), site => buildHome(homeTemplate, lang, site))
        page(plannerPath(lang), site => buildPlanner(plannerTemplate, lang, site))
        page(guidePath(lang), site => buildGuidePage(guideTemplate, lang, '', site))
        for (const g of loadSite(lang, '').GUIDES) page(guidePath(lang, g.slug), site => buildGuidePage(guideTemplate, lang, g.slug, site))
    }

    bundles.forEach((code, rel) => write(rel, code))
    write('sitemap.xml', buildSitemap(loadSite('vi', '')))
    write('sw.js', updateServiceWorkerVersion(updateCoreAssets(read('sw.js'), read(homePath('vi')))))
    write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`)

    console.log(`✅ Đã tạo ${count} trang điểm đến (vi + en), 2 trang chủ, 2 trang kế hoạch, ${2 + 2 * loadSite("vi", "").GUIDES.length} trang cẩm nang, ${bundles.size} bundle JS/CSS, sitemap.xml, robots.txt`)
}

main()
