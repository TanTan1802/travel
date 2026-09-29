/*
 * Sinh trang tĩnh cho từng điểm đến + sitemap.   Chạy:  npm run build
 *
 * - diem-den/<id>/index.html: nội dung được render sẵn (tốt cho SEO) kèm thẻ
 *   Open Graph để chia sẻ Facebook/Zalo hiện ảnh xem trước.
 * - index.html: chèn sẵn danh sách thẻ điểm đến (trình duyệt vẫn render lại để lọc/tìm kiếm).
 * - sitemap.xml, robots.txt.
 *
 * Mẫu giao diện là destination.html – sửa giao diện ở đó rồi chạy lại build.
 */
const fs = require('fs')
const path = require('path')
const { ROOT, loadBrowserScripts } = require('./lib')

const SITE_URL = 'https://tantan1802.github.io/travel/'
const PAGE_DIR = 'diem-den'
const PAGE_ROOT = '../../' // từ diem-den/<id>/ về gốc site

const SCRIPTS = [
    'assets/js/data/local-images.js',
    'assets/js/data/destinations.js',
    'assets/js/data/itineraries.js',
    'assets/js/components.js',
    'assets/js/destination-render.js',
]
const EXPORTS = ['DESTINATIONS', 'REGIONS', 'CATEGORIES', 'LOCAL_IMAGES', 'WIKI_BASE',
    'renderDestinationPage', 'destinationCard']

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

/* URL tuyệt đối của ảnh (dùng cho og:image) */
function absoluteImage(site, file) {
    const local = site.LOCAL_IMAGES && site.LOCAL_IMAGES[file]
    if (local) return SITE_URL + local.lg
    return `${site.WIKI_BASE}Special:FilePath/${encodeURIComponent(file)}?width=1280`
}

/* Thêm tiền tố đường dẫn cho các liên kết tương đối trỏ về tài nguyên của site */
function prefixPaths(html, prefix) {
    return html.replace(/(href|src)="(?!https?:|#|mailto:|data:|\/)([^"]+)"/g,
        (m, attr, url) => `${attr}="${prefix}${url}"`)
}

function headTags(site, d) {
    const url = `${SITE_URL}${PAGE_DIR}/${d.id}/`
    const title = `${d.name} – ${d.tagline}`
    const desc = truncate(d.description)
    const image = absoluteImage(site, d.hero)
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TouristDestination',
        name: d.name,
        description: d.description,
        url,
        image: [d.hero, ...d.gallery.map(g => g.file)].slice(0, 4).map(f => absoluteImage(site, f)),
        address: { '@type': 'PostalAddress', addressRegion: d.province, addressCountry: 'VN' },
        touristType: d.categories.map(c => site.CATEGORIES[c]),
        ...(d.lat ? { geo: { '@type': 'GeoCoordinates', latitude: d.lat, longitude: d.lng } } : {}),
    }

    return `
        <link rel="canonical" href="${url}">
        <meta property="og:type" content="article">
        <meta property="og:site_name" content="Việt Travel">
        <meta property="og:locale" content="vi_VN">
        <meta property="og:title" content="${escapeHtml(title)}">
        <meta property="og:description" content="${escapeHtml(desc)}">
        <meta property="og:url" content="${url}">
        <meta property="og:image" content="${escapeHtml(image)}">
        <meta name="twitter:card" content="summary_large_image">
        <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    `
}

function buildDestinationPage(template, site, d) {
    let html = prefixPaths(template, PAGE_ROOT)

    html = html
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(d.name)} – Việt Travel</title>`)
        .replace(/<meta name="description" content="[^"]*">/,
            `<meta name="description" content="${escapeHtml(truncate(d.description))}">`)
        .replace('</head>', `${headTags(site, d)}</head>`)
        .replace(/(\s*)<script src="/, `$1<script>window.SITE_ROOT = '${PAGE_ROOT}'; window.DEST_ID = '${d.id}'</script>$1<script src="`)
        .replace('<main class="main" id="destination"></main>',
            `<main class="main" id="destination" data-prerendered>${site.renderDestinationPage(d)}</main>`)

    if (!html.includes('data-prerendered')) throw new Error('Không tìm thấy <main id="destination"> trong destination.html')
    return html
}

function buildHomeGrid(home, site) {
    const cards = site.DESTINATIONS.map(d => site.destinationCard(d)).join('')
    return home
        .replace(/<!-- build:grid -->[\s\S]*?<!-- \/build:grid -->/, `<!-- build:grid -->${cards}<!-- /build:grid -->`)
        .replace(/(<span id="dest-count">)\d+(<\/span>)/, `$1${site.DESTINATIONS.length}$2`)
}

function buildSitemap(site) {
    const today = new Date().toISOString().slice(0, 10)
    const urls = ['', ...site.DESTINATIONS.map(d => `${PAGE_DIR}/${d.id}/`)]
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
}

function main() {
    const template = read('destination.html')
    const pageSite = loadBrowserScripts(SCRIPTS, EXPORTS, { SITE_ROOT: PAGE_ROOT })
    const homeSite = loadBrowserScripts(SCRIPTS, EXPORTS, { SITE_ROOT: '' })

    // Xóa trang cũ (điểm đến đã bị đổi tên/xóa)
    fs.rmSync(path.join(ROOT, PAGE_DIR), { recursive: true, force: true })
    for (const d of pageSite.DESTINATIONS) {
        write(`${PAGE_DIR}/${d.id}/index.html`, buildDestinationPage(template, pageSite, d))
    }

    const home = read('index.html')
    if (!home.includes('<!-- build:grid -->')) throw new Error('index.html thiếu đánh dấu <!-- build:grid -->')
    write('index.html', buildHomeGrid(home, homeSite))

    write('sitemap.xml', buildSitemap(pageSite))
    write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`)

    console.log(`✅ Đã tạo ${pageSite.DESTINATIONS.length} trang trong ${PAGE_DIR}/, cập nhật index.html, sitemap.xml, robots.txt`)
}

main()
