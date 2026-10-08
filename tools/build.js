/*
 * Sinh trang tĩnh cho cả hai ngôn ngữ + sitemap.   Chạy:  npm run build
 *
 * Tiếng Việt (gốc site):
 *   - diem-den/<id>/index.html – trang điểm đến render sẵn (SEO + Open Graph).
 *   - index.html – chèn sẵn danh sách thẻ điểm đến.
 * Tiếng Anh (thư mục en/), Hàn (ko/), Trung giản thể (zh/), Nhật (ja/):
 *   - <lang>/index.html, <lang>/diem-den/<id>/index.html, ... – dịch từ assets/js/data/en.js;
 *     ko/zh/ja phủ thêm bản dịch riêng assets/js/data/i18n/<lang>.js (sinh từ data/i18n/<lang>.json),
 *     chuỗi chưa dịch hiện tiếng Anh.
 * Kèm sitemap.xml, robots.txt và cập nhật phiên bản service worker.
 *
 * Mẫu giao diện là home.html (→ index.html), destination.html, planner.html, guide.html – sửa ở đó rồi chạy lại build.
 * Script của mỗi trang được gộp + nén bằng esbuild thành assets/js/dist/<hash>.js (xem bundleScripts).
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const esbuild = require('esbuild')
const { ROOT, SITE_URL, SITE_VERIFICATION, loadBrowserScripts } = require('./lib')
const { DEFAULT_THEME, pickText, sloganHtml } = require('./theme')

const PAGE_DIR = 'diem-den'
const PLANNER_DIR = 'ke-hoach'
const GUIDE_DIR = 'cam-nang'
const PRICES_DIR = 'gia-ve'
const MONTH_DIR = 'thang'
const THEME_DIR = 'chu-de'

/* code: mã trong SITE_LANG / thư mục; html: thuộc tính lang + hreflang; label: tên trong menu ngôn ngữ */
const LANGS = {
    vi: { prefix: '', html: 'vi', locale: 'vi_VN', label: 'Tiếng Việt' },
    en: { prefix: 'en/', html: 'en', locale: 'en_US', label: 'English' },
    ko: { prefix: 'ko/', html: 'ko', locale: 'ko_KR', label: '한국어' },
    zh: { prefix: 'zh/', html: 'zh-Hans', locale: 'zh_CN', label: '中文（简体）' },
    ja: { prefix: 'ja/', html: 'ja', locale: 'ja_JP', label: '日本語' },
}
/* Script dịch nạp trước local-images.js: tiếng Anh làm nền, ko/zh/ja phủ thêm bản dịch riêng */
const translationScripts = lang => (lang === 'vi' ? [] : lang === 'en' ? ['assets/js/data/en.js'] : ['assets/js/data/en.js', `assets/js/data/i18n/${lang}.js`])

const SCRIPTS = [
    'assets/js/data/local-images.js',
    'assets/js/i18n.js',
    'assets/js/data/destinations.js',
    'assets/js/core.js',
    'assets/js/data/itineraries.js',
    'assets/js/data/places.js',
    'assets/js/data/sights.js',
    'assets/js/data/events.js',
    'assets/js/data/community-photos.js',
    'assets/js/data/packing.js',
    'assets/js/data/guides.js',
    'assets/js/components.js',
    'assets/js/trip-export.js',
    'assets/js/config.js',
    'assets/js/destination-render.js',
    'assets/js/guide-render.js',
    'assets/js/seo-render.js',
]
const EXPORTS = ['PLACES', 'SIGHTS', 'STAY_TYPES', 'TRANSPORT', 'ITINERARIES', 'TOUR_LENGTHS', 'COMMUNITY_PHOTOS', 'DESTINATIONS', 'REGIONS', 'CATEGORIES', 'LOCAL_IMAGES', 'WIKI_BASE', 'TRANSLATION_EN',
    'renderDestinationPage', 'destinationCard', 'wikiImg', 'wikiSrcset', 'imageSizes',
    'TRANSLATION_LOCAL', 'GUIDES', 'GUIDE_UPDATED', 'guidesIndexPage', 'guideArticlePage', 'homeGuidesSection', 'pickLang',
    'pricesPage', 'pricesJsonLd', 'destinationSights', 'monthPage', 'monthTitle', 'monthDestinations', 'MONTH_NOTES',
    'themeList', 'themePage', 'themeTitle', 'THEME_INTROS', 'exploreHubHtml', 't', 'monthLabel']

const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true })
    fs.writeFileSync(path.join(ROOT, rel), content)
}

const escapeHtml = text => String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/*==================== GIAO DIỆN & MÙA (data/site.json – đã kiểm tra bởi build-data.js) ====================*/
const SITE_CONFIG = JSON.parse(read('data/site.json'))
const DARK_THEME_SCRIPT = `<script>try{if(localStorage.getItem('selected-theme')==='dark')document.body.classList.add('dark-theme')}catch(e){}</script>`
const inlineJson = value => JSON.stringify(value).replace(/</g, '\\u003c')

/*
 * Chạy ngay đầu <body> mọi trang (trước khi vẽ): chọn mùa theo ngày trên máy người xem
 * (?season=<mã> để xem thử, ?season=none để tắt), đặt window.SEASON + màu của mùa.
 * Mùa tắt (enabled: false) chỉ hiện khi xem thử. Mùa đứng trước được ưu tiên.
 */
function themeScript() {
    const seasons = SITE_CONFIG.seasons.map(s => ({
        i: s.id, f: s.from, t: s.to,
        ...(s.enabled ? {} : { x: 1 }),
        ...(s.theme ? { h: s.theme.hue, a: s.theme.accentHue } : {}),
    }))
    if (!seasons.length) return DARK_THEME_SCRIPT
    return DARK_THEME_SCRIPT.replace('</script>', `\n(function(S){var q=/[?&]season=([a-z0-9-]+)/.exec(location.search),n=new Date(),p=function(v){return(v<10?'0':'')+v},` +
        `md=p(n.getMonth()+1)+'-'+p(n.getDate()),ymd=n.getFullYear()+'-'+md;for(var i=0;i<S.length;i++){var s=S[i];` +
        `if(q?q[1]===s.i:!s.x&&(s.f.length>5?ymd>=s.f&&ymd<=s.t:s.f<=s.t?md>=s.f&&md<=s.t:md>=s.f||md<=s.t)){` +
        `var r=document.documentElement,m;window.SEASON=s.i;r.setAttribute('data-season',s.i);if(s.h!=null){r.style.setProperty('--hue-color',s.h);` +
        `r.style.setProperty('--accent-hue',s.a);if(m=document.querySelector('meta[name=theme-color]'))m.content='hsl('+s.h+', 64%, 22%)'}return}}})(${inlineJson(seasons)})</script>`)
}

/* Mọi trang: script màu theo mùa + màu thanh trình duyệt theo màu chủ đạo */
function applyTheme(html) {
    if (!html.includes(DARK_THEME_SCRIPT)) throw new Error('Mẫu HTML thiếu script chế độ tối ngay sau <body>')
    html = html.replace(DARK_THEME_SCRIPT, themeScript())
    const { hue } = SITE_CONFIG.theme
    return hue === DEFAULT_THEME.hue ? html : html.replace(/(<meta name="theme-color" content=")[^"]*(">)/, `$1hsl(${hue}, 64%, 22%)$2`)
}

/* Màu mặc định khác màu gốc trong CSS (190 / 38) thì ghi đè ở cuối gói CSS */
function themeCss() {
    const { hue, accentHue } = SITE_CONFIG.theme
    return hue === DEFAULT_THEME.hue && accentHue === DEFAULT_THEME.accentHue ? '' : `\n:root{--hue-color:${hue};--accent-hue:${accentHue}}`
}

/* Trang chủ: slogan, ảnh bìa, tiêu đề mục nổi bật mặc định theo ngôn ngữ */
function applyHomeContent(html, lang) {
    const hero = SITE_CONFIG.hero
    const replaceOnce = (input, re, fn, what) => {
        if (!re.test(input)) throw new Error(`home.html thiếu ${what}`)
        return input.replace(re, fn)
    }
    html = replaceOnce(html, /(<span class="home__data-subtitle">)[^<]*(<\/span>)/, (m, a, b) => `${a}${escapeHtml(pickText(hero.subtitle, lang))}${b}`, 'home__data-subtitle')
    html = replaceOnce(html, /(<h1 class="home__data-title">)[\s\S]*?(<\/h1>)/, (m, a, b) => `${a}${sloganHtml(pickText(hero.title, lang))}${b}`, 'home__data-title')
    html = replaceOnce(html, /<img [^>]*class="home__img"[^>]*>/, tag => tag
        .replace(/data-wiki="[^"]*"/, `data-wiki="${escapeHtml(hero.image.join('|'))}"`)
        .replace(/alt="[^"]*"/, `alt="${escapeHtml(pickText(hero.alt, lang))}"`), 'ảnh bìa .home__img')
    return replaceOnce(html, /(<section class="discover section" id="discover">\s*<h2 class="section__title">)[\s\S]*?(<\/h2>)/,
        (m, a, b) => `${a}${sloganHtml(pickText(SITE_CONFIG.featuredTitle, lang))}${b}`, 'tiêu đề mục nổi bật')
}

/*
 * Trang chủ: nội dung riêng của từng mùa (slogan, ảnh bìa, thông báo, điểm đến nổi bật) cho đúng ngôn ngữ,
 * áp dụng ngay sau khối chữ đầu trang để không nháy nội dung mặc định. home.js đọc window.HOME_SEASON.
 */
/* Chữ đếm ngược + nút tắt hiệu ứng theo ngôn ngữ ({label} = tên sự kiện, {n} = số ngày) */
const COUNTDOWN_TEXT = {
    vi: { left: '{label}: còn {n} ngày', today: '{label}: hôm nay!', decorOff: 'Tắt hiệu ứng' },
    en: { left: '{label}: {n} days to go', today: '{label}: today!', decorOff: 'Turn off effect' },
    ko: { left: '{label}: {n}일 남음', today: '{label}: 오늘!', decorOff: '효과 끄기' },
    zh: { left: '{label}：还有 {n} 天', today: '{label}：就在今天！', decorOff: '关闭特效' },
    ja: { left: '{label}：あと{n}日', today: '{label}：今日！', decorOff: '効果をオフ' },
}

function homeSeasonScript(lang, site, siteRoot) {
    const langRoot = siteRoot + LANGS[lang].prefix
    const seasons = {}
    for (const s of SITE_CONFIG.seasons) {
        const hero = s.hero || {}
        const o = {}
        if (hero.subtitle) o.sub = escapeHtml(pickText(hero.subtitle, lang))
        if (hero.title) o.title = sloganHtml(pickText(hero.title, lang))
        if (hero.image) {
            const file = hero.image[0]
            o.img = { wiki: hero.image.join('|'), src: site.wikiImg(file, 1920), srcset: site.wikiSrcset(file) || '', sizes: site.imageSizes(1920), alt: pickText(hero.alt || SITE_CONFIG.hero.alt, lang) }
        }
        if (s.banner) {
            const link = s.banner.link || ''
            o.promo = { text: pickText(s.banner.text, lang), href: link && (link.startsWith('https://') ? link : langRoot + link), ext: link.startsWith('https://') }
            if (s.banner.countdown) o.promo.cd = { date: s.banner.countdown.date, label: pickText(s.banner.countdown.label, lang) }
        }
        if (s.decor) o.decor = s.decor
        if (s.featured) Object.assign(o, { featured: s.featured, ft: sloganHtml(pickText(s.featuredTitle, lang)) })
        seasons[s.id] = o
    }
    const T = COUNTDOWN_TEXT[lang] || COUNTDOWN_TEXT.en
    /* Đếm ngược: số ngày từ hôm nay (máy người xem) tới ngày sự kiện; MM-DD → lần tới gần nhất; đã qua → ẩn */
    const countdown = `function cd(c){var n=new Date();n.setHours(0,0,0,0);var t=new Date((c.date.length>5?c.date:n.getFullYear()+'-'+c.date)+'T00:00:00');` +
        `if(c.date.length<=5&&t<n)t.setFullYear(t.getFullYear()+1);var d=Math.round((t-n)/864e5);if(d<0)return'';` +
        `return(d?${inlineJson(T.left)}.replace('{n}',d):${inlineJson(T.today)}).replace('{label}',c.label)}`
    /* Hiệu ứng rơi nhẹ trên ảnh bìa: không hiện khi người xem bật giảm chuyển động hoặc đã tắt */
    const decor = `function decor(kind){try{if(matchMedia('(prefers-reduced-motion: reduce)').matches||localStorage.getItem('vt-decor-off'))return}catch(x){}` +
        `var h=q('.home');if(!h)return;var box=document.createElement('div');box.className='decor decor--'+kind;box.setAttribute('aria-hidden','true');` +
        `for(var i=0;i<18;i++){var p=document.createElement('i');p.style.cssText='--x:'+(i*5.5+(i*37%11))%100+'%;--d:'+(9+i*7%8)+'s;--delay:-'+(i*13%17)+'s;--s:'+(9+i*5%9)+'px;--dx:'+((i%2?1:-1)*(20+i*11%60))+'px';box.appendChild(p)}` +
        `var b=document.createElement('button');b.type='button';b.className='decor__off';b.textContent=${inlineJson(T.decorOff)};` +
        `b.onclick=function(){box.remove();b.remove();try{localStorage.setItem('vt-decor-off','1')}catch(x){}};h.appendChild(box);h.appendChild(b)}`
    return `<script>window.HOME_FEATURED=${inlineJson(SITE_CONFIG.featured)};` +
        `(function(H){var s=window.SEASON&&H[window.SEASON],q=function(c){return document.querySelector(c)},e;window.HOME_SEASON=s||null;if(!s)return;` +
        `if(s.sub)q('.home__data-subtitle').innerHTML=s.sub;if(s.title)q('.home__data-title').innerHTML=s.title;` +
        `if(s.img&&(e=q('.home__img'))){e.setAttribute('data-wiki',s.img.wiki);e.alt=s.img.alt;if(s.img.srcset){e.sizes=s.img.sizes;e.srcset=s.img.srcset}else e.removeAttribute('srcset');e.src=s.img.src}` +
        `if(s.promo&&(e=q('#home-promo'))){e.querySelector('span').textContent=s.promo.text;var c=s.promo.cd&&cd(s.promo.cd),k=e.querySelector('.home__countdown');if(c&&k){k.textContent=c;k.hidden=false}` +
        `if(s.promo.href){e.href=s.promo.href;if(s.promo.ext){e.target='_blank';e.rel='noopener'}}else e.lastElementChild.remove();e.hidden=false}` +
        `if(s.decor)decor(s.decor);${countdown}${decor}` +
        `})(${inlineJson(seasons)})</script>`
}

function truncate(text, max = 160) {
    return text.length <= max ? text : text.slice(0, text.lastIndexOf(' ', max - 1)) + '…'
}

/* Nạp dữ liệu + hàm render cho một ngôn ngữ, với đường dẫn gốc tương ứng độ sâu của trang */
const siteCache = new Map()
const siteLangs = new WeakMap()
function loadSite(lang, siteRoot) {
    const key = `${lang}:${siteRoot}`
    if (!siteCache.has(key)) {
        const scripts = [...translationScripts(lang), ...SCRIPTS]
        siteCache.set(key, loadBrowserScripts(scripts, EXPORTS, { SITE_ROOT: siteRoot, SITE_LANG: lang }))
        siteLangs.set(siteCache.get(key), lang)
    }
    return siteCache.get(key)
}

const homePath = lang => `${LANGS[lang].prefix}index.html`
const destPath = (lang, id) => `${LANGS[lang].prefix}${PAGE_DIR}/${id}/index.html`
const plannerPath = lang => `${LANGS[lang].prefix}${PLANNER_DIR}/index.html`
const guidePath = (lang, slug = '') => `${LANGS[lang].prefix}${GUIDE_DIR}/${slug ? `${slug}/` : ''}index.html`
const pricesPath = (lang, id) => `${LANGS[lang].prefix}${PAGE_DIR}/${id}/${PRICES_DIR}/index.html`
const monthPath = (lang, m) => `${LANGS[lang].prefix}${MONTH_DIR}/${m}/index.html`
const themePath = (lang, slug) => `${LANGS[lang].prefix}${THEME_DIR}/${slug}/index.html`
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
        const isPage = url.startsWith('index.html') || [PAGE_DIR, PLANNER_DIR, GUIDE_DIR, MONTH_DIR, THEME_DIR].some(dir => url.startsWith(`${dir}/`))
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

/* relOf(lang) → đường dẫn trang tương ứng ở ngôn ngữ đó */
function alternateLinks(relOf) {
    return Object.entries(LANGS).map(([lang, { html }]) => `
        <link rel="alternate" hreflang="${html}" href="${pageUrl(relOf(lang))}">`).join('') + `
        <link rel="alternate" hreflang="x-default" href="${pageUrl(relOf('vi'))}">`
}

/* Menu ngôn ngữ: mỗi mục trỏ tới trang tương ứng của ngôn ngữ đó */
function setLangSwitch(html, lang, siteRoot, relOf) {
    const items = Object.entries(LANGS).map(([code, l]) =>
        `<li><a href="${siteRoot}${relOf(code)}" hreflang="${l.html}" lang="${l.html}" data-lang="${code}"${code === lang ? ' aria-current="true"' : ''}>${l.label}</a></li>`)
    const menu = `<details class="nav__lang" id="lang-menu">
                        <summary class="nav__lang-btn" title="Ngôn ngữ / Language"><i class="ri-global-line"></i> ${lang.toUpperCase()}</summary>
                        <ul class="nav__lang-list">
                            ${items.join('\n                            ')}
                        </ul>
                    </details>`
    if (!/<details class="nav__lang"[\s\S]*?<\/details>/.test(html)) throw new Error('Mẫu HTML thiếu menu ngôn ngữ (details.nav__lang)')
    return html.replace(/<details class="nav__lang"[\s\S]*?<\/details>/, menu)
}

/* Chuẩn bị mẫu HTML cho một ngôn ngữ và độ sâu thư mục */
function prepareTemplate(template, lang, rel, site) {
    const siteRoot = rootFor(rel)
    let html = template
    if (lang !== 'vi') {
        const scripts = [...translationScripts(lang), 'assets/js/data/local-images.js']
        html = translateHtml(html, site.TRANSLATION_EN.html)
            .replace('<html lang="vi">', `<html lang="${LANGS[lang].html}">`)
            .replace('<script defer src="assets/js/data/local-images.js"></script>',
                scripts.map(src => `<script defer src="${src}"></script>`).join('\n        '))
    }
    html = prefixPaths(html, siteRoot, siteRoot + LANGS[lang].prefix)
    return { html, siteRoot }
}

/*==================== DỮ LIỆU CÓ CẤU TRÚC (schema.org) ====================*/
const ldScript = graph => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>`

/* Đường dẫn breadcrumb: [[tên, rel], ...] – mục cuối là trang hiện tại */
function breadcrumbLd(items) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: items.map(([name, rel], i) => ({ '@type': 'ListItem', position: i + 1, name, item: pageUrl(rel) })),
    }
}

/* Câu hỏi thường gặp lấy từ thông tin đã hiện trên trang (thời điểm đẹp, số ngày, điểm nổi bật, cách đi) */
function faqLd(site, d, lang) {
    const pairs = [
        [site.t('Thời điểm nào đẹp nhất để đi {name}?', { name: d.name }), `${d.bestTime}.`],
        [site.t('Nên đi {name} mấy ngày?', { name: d.name }), site.t('Khoảng {duration}.', { duration: d.duration })],
        [site.t('{name} có gì nổi bật?', { name: d.name }), `${d.highlights.join(', ')}.`],
    ]
    /* Cách đi tới chỉ có tiếng Việt / Anh – các ngôn ngữ khác bỏ qua để câu trả lời cùng ngôn ngữ với trang */
    const place = site.PLACES && site.PLACES[d.id]
    if (place && (lang === 'vi' || lang === 'en')) pairs.push([site.t('Đi {name} bằng cách nào?', { name: d.name }), site.pickLang(place.getThere)])
    return {
        '@type': 'FAQPage',
        mainEntity: pairs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    }
}

/* Bài cẩm nang: Article + breadcrumb; trang danh sách: chỉ breadcrumb */
function guideLd(site, lang, guide, rel, description) {
    const crumbs = [[site.t('Trang chủ'), homePath(lang)], [site.t('Cẩm nang'), guidePath(lang)]]
    if (!guide) return [breadcrumbLd(crumbs)]
    const headline = site.pickLang(guide.title)
    return [
        {
            '@type': 'Article',
            headline,
            description,
            inLanguage: LANGS[lang].html,
            url: pageUrl(rel),
            dateModified: site.GUIDE_UPDATED,
            image: `${SITE_URL}assets/img/og/${guide.related && guide.related[0] ? guide.related[0] : 'hoi-an'}.jpg`,
            author: { '@type': 'Organization', name: 'Việt Travel', url: SITE_URL },
            publisher: { '@type': 'Organization', name: 'Việt Travel', url: SITE_URL },
        },
        breadcrumbLd([...crumbs, [headline, rel]]),
    ]
}

function headTags(site, d, lang) {
    const rel = destPath(lang, d.id)
    const url = pageUrl(rel)
    const title = `${d.name} – ${d.tagline}`
    const image = ogImage(site, d)
    const jsonLd = {
        '@type': 'TouristDestination',
        name: d.name,
        description: d.description,
        url,
        inLanguage: LANGS[lang].html,
        image: [d.hero, ...d.gallery.map(g => g.file)].slice(0, 4).map(f => absoluteImage(site, f)),
        address: { '@type': 'PostalAddress', addressRegion: d.province, addressCountry: 'VN' },
        touristType: d.categories.map(c => site.CATEGORIES[c]),
        ...(d.lat ? { geo: { '@type': 'GeoCoordinates', latitude: d.lat, longitude: d.lng } } : {}),
    }

    return `
        <link rel="canonical" href="${url}">${alternateLinks(l => destPath(l, d.id))}
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
        ${ldScript([jsonLd, breadcrumbLd([[site.t('Trang chủ'), homePath(lang)], [d.name, rel]]), faqLd(site, d, lang)])}
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
const PHOTOS_SCRIPT = /\s*<script defer src="assets\/js\/data\/community-photos\.js"><\/script>/
/* Xem trước từ trang quản trị chỉ dùng cho destination.html?id=…&preview=1 – không đưa vào trang tĩnh */
const PREVIEW_SCRIPT = /\s*<script defer src="assets\/js\/preview\.js"><\/script>/

function destDataFile(d, site, enSite) {
    const pick = (obj, key) => JSON.stringify(obj && obj[key] ? { [key]: obj[key] } : {})
    return '/* Sinh tự động bởi tools/build.js từ places.js + sights.js + itineraries.js + en.js – không sửa tay. */\n' +
        `const STAY_TYPES = ${JSON.stringify(site.STAY_TYPES)}\n` +
        `const TRANSPORT = ${JSON.stringify(site.TRANSPORT)}\n` +
        `const PLACES = ${pick(site.PLACES, d.id)}\n` +
        `const SIGHTS = ${pick(site.SIGHTS, d.id)}\n` +
        `const TOUR_LENGTHS = ${JSON.stringify(site.TOUR_LENGTHS)}\n` +
        `const ITINERARIES = ${pick(site.ITINERARIES, d.id)}\n` +
        `const ITINERARIES_EN = ${pick(enSite.TRANSLATION_EN.itineraries, d.id)}\n` +
        `const COMMUNITY_PHOTOS = ${JSON.stringify((site.COMMUNITY_PHOTOS || []).filter(p => p.dest === d.id))}\n`
}

function buildDestinationPage(template, lang, d, site) {
    const rel = destPath(lang, d.id)
    if (!DEST_DATA_SCRIPTS.test(template)) throw new Error('destination.html thiếu thẻ script places.js + sights.js')
    if (!ITINERARIES_SCRIPT.test(template)) throw new Error('destination.html thiếu thẻ script itineraries.js')
    template = template.replace(DEST_DATA_SCRIPTS, `$1<script defer src="${DEST_DATA_DIR}/${d.id}.js"></script>`)
        .replace(ITINERARIES_SCRIPT, '')
        .replace(PHOTOS_SCRIPT, '')
        .replace(PREVIEW_SCRIPT, '')
    let { html, siteRoot } = prepareTemplate(template, lang, rel, site)

    html = setLangSwitch(html, lang, siteRoot, l => destPath(l, d.id))
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

/* Thẻ xác minh Google Search Console / Bing (chỉ cần ở trang chủ) – khai báo trong tools/lib.js */
const verificationTags = () => [['google-site-verification', SITE_VERIFICATION.google], ['msvalidate.01', SITE_VERIFICATION.bing]]
    .filter(([, code]) => code)
    .map(([name, code]) => `    <meta name="${name}" content="${escapeHtml(code)}">\n`).join('')

function buildHome(template, lang, site) {
    const rel = homePath(lang)
    let { html, siteRoot } = prepareTemplate(template, lang, rel, site)
    const cards = site.DESTINATIONS.map(d => site.destinationCard(d)).join('')
    html = applyHomeContent(html, lang)
        .replace('<!-- build:season --><!-- /build:season -->', `<!-- build:season -->${homeSeasonScript(lang, site, siteRoot)}<!-- /build:season -->`)
    if (!html.includes('<!-- build:season --><script>')) throw new Error('home.html thiếu <!-- build:season --><!-- /build:season -->')

    html = setLangSwitch(html, lang, siteRoot, homePath)
        .replace(/<!-- build:grid -->[\s\S]*?<!-- \/build:grid -->/, `<!-- build:grid -->${cards}<!-- /build:grid -->`)
        .replace(/<!-- build:guides -->[\s\S]*?<!-- \/build:guides -->/, `<!-- build:guides -->${site.homeGuidesSection()}<!-- /build:guides -->`)
        .replace(/(<span id="dest-count">)\d+(<\/span>)/, `$1${site.DESTINATIONS.length}$2`)
        .replace(/<!-- build:alternate -->[\s\S]*?<!-- \/build:alternate -->/,
            `<!-- build:alternate -->${alternateLinks(homePath)}\n        <!-- /build:alternate -->`)
        .replace(/(<link rel="canonical" href=")[^"]*(">)/, `$1${pageUrl(rel)}$2`)
        .replace(/(<meta property="og:url" content=")[^"]*(">)/, `$1${pageUrl(rel)}$2`)
        .replace(/(<meta property="og:locale" content=")[^"]*(">)/, `$1${LANGS[lang].locale}$2`)
        .replace('</head>', `${verificationTags()}    ${ldScript([{
            '@type': 'WebSite',
            name: 'Việt Travel',
            url: pageUrl(rel),
            inLanguage: LANGS[lang].html,
            description: (html.match(/<meta name="description" content="([^"]*)">/) || [])[1],
        }])}\n    </head>`)

    html = prioritizeImages(html, site)
    if (lang !== 'vi') {
        html = html.replace(/(\s*)<script defer src="/,
            `$1<script>window.SITE_ROOT = '${siteRoot}'; window.SITE_LANG = '${lang}'</script>$1<script defer src="`)
    }
    return html
}

/* Trang lập kế hoạch chuyến đi: nội dung do planner.js tạo trên trình duyệt */
function buildPlanner(template, lang, site) {
    const rel = plannerPath(lang)
    let { html, siteRoot } = prepareTemplate(template, lang, rel, site)
    const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]
    const description = (html.match(/<meta name="description" content="([^"]*)">/) || [])[1]
    const head = `
        <link rel="canonical" href="${pageUrl(rel)}">${alternateLinks(plannerPath)}
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="Việt Travel">
        <meta property="og:locale" content="${LANGS[lang].locale}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:url" content="${pageUrl(rel)}">
        <meta property="og:image" content="${SITE_URL}assets/img/og/hoi-an.jpg">
        <meta name="twitter:card" content="summary_large_image">
    `
    return setLangSwitch(html, lang, siteRoot, plannerPath)
        .replace('</head>', `${head}</head>`)
        .replace(/(\s*)<script defer src="/,
            `$1<script>window.SITE_ROOT = '${siteRoot}'; window.SITE_LANG = '${lang}'; window.PLAN_DATA = '${siteRoot}${PLAN_DATA_DIR}/${lang}/'</script>$1<script defer src="`)
}

/* Trang cẩm nang (danh sách hoặc một bài): nội dung render sẵn từ guide-render.js */
function buildGuidePage(template, lang, slug, site) {
    const rel = guidePath(lang, slug)
    const guide = slug && site.GUIDES.find(g => g.slug === slug)
    let { html, siteRoot } = prepareTemplate(template, lang, rel, site)
    const title = guide ? `${site.pickLang(guide.title)} – Việt Travel` : (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]
    const description = guide ? site.pickLang(guide.summary) : (html.match(/<meta name="description" content="([^"]*)">/) || [])[1]
    const head = `
        <link rel="canonical" href="${pageUrl(rel)}">${alternateLinks(l => guidePath(l, slug))}
        <meta property="og:type" content="${guide ? 'article' : 'website'}">
        <meta property="og:site_name" content="Việt Travel">
        <meta property="og:locale" content="${LANGS[lang].locale}">
        <meta property="og:title" content="${escapeHtml(title)}">
        <meta property="og:description" content="${escapeHtml(description)}">
        <meta property="og:url" content="${pageUrl(rel)}">
        <meta property="og:image" content="${SITE_URL}assets/img/og/${guide && guide.related && guide.related[0] ? guide.related[0] : 'hoi-an'}.jpg">
        <meta name="twitter:card" content="summary_large_image">
        ${ldScript(guideLd(site, lang, guide, rel, description))}
    `
    html = setLangSwitch(html, lang, siteRoot, l => guidePath(l, slug))
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
        .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(description)}">`)
        .replace('</head>', `${head}</head>`)
        .replace(/(\s*)<script defer src="/,
            `$1<script>window.SITE_ROOT = '${siteRoot}'; window.SITE_LANG = '${lang}'</script>$1<script defer src="`)
        .replace('<main class="main guide-page" id="guide-page"></main>',
            `<main class="main guide-page" id="guide-page" data-prerendered>${guide ? site.guideArticlePage(guide) : site.guidesIndexPage() + site.exploreHubHtml()}</main>`)
    if (!html.includes('data-prerendered')) throw new Error('Không tìm thấy <main id="guide-page"> trong guide.html')
    return html
}

/*
 * Trang nội dung tĩnh dùng khung guide.html (trang giá vé, theo tháng, theo chủ đề):
 * title/description/canonical/hreflang/Open Graph + JSON-LD (kèm BreadcrumbList).
 */
function buildContentPage(template, lang, relOf, site, { title, description, main, image, jsonLd = [], crumbs = [] }) {
    const rel = relOf(lang)
    let { html, siteRoot } = prepareTemplate(template, lang, rel, site)
    const url = pageUrl(rel)
    const graph = [...jsonLd, {
        '@type': 'BreadcrumbList',
        itemListElement: [...crumbs, [title, url]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
    }]
    const head = `
        <link rel="canonical" href="${url}">${alternateLinks(relOf)}
        <meta property="og:type" content="article">
        <meta property="og:site_name" content="Việt Travel">
        <meta property="og:locale" content="${LANGS[lang].locale}">
        <meta property="og:title" content="${escapeHtml(title)}">
        <meta property="og:description" content="${escapeHtml(description)}">
        <meta property="og:url" content="${url}">
        <meta property="og:image" content="${escapeHtml(image)}">
        <meta name="twitter:card" content="summary_large_image">
        <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
    `
    html = setLangSwitch(html, lang, siteRoot, relOf)
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)} – Việt Travel</title>`)
        .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(truncate(description))}">`)
        .replace('</head>', `${head}</head>`)
        .replace(/(\s*)<script defer src="/,
            `$1<script>window.SITE_ROOT = '${siteRoot}'; window.SITE_LANG = '${lang}'</script>$1<script defer src="`)
        .replace('<main class="main guide-page" id="guide-page"></main>',
            `<main class="main guide-page" id="guide-page" data-prerendered>${main}</main>`)
    if (!html.includes('data-prerendered')) throw new Error('Không tìm thấy <main id="guide-page"> trong guide.html')
    return html
}

/* Trang khám phá: giá vé từng điểm đến, 12 tháng, chủ đề/miền */
function explorePages(template, lang) {
    const pages = []
    const home = [loadSite(lang, '').t('Trang chủ'), pageUrl(homePath(lang))]
    const destSite = loadSite(lang, rootFor(pricesPath(lang, 'x')))
    for (const d of destSite.DESTINATIONS) {
        const rel = pricesPath(lang, d.id)
        const sum = destSite.destinationSights(d.id).flatMap(g => g.sights).length
        if (!sum) continue
        pages.push([rel, () => buildContentPage(template, lang, l => pricesPath(l, d.id), destSite, {
            title: destSite.t('Giá vé tham quan {name} & giờ mở cửa', { name: d.name }),
            description: destSite.t('Giá vé, giờ mở cửa và địa chỉ {count} điểm tham quan ở {name} theo lịch trình từng ngày, kèm quán nước gần đó.', { count: sum, name: d.name }),
            main: destSite.pricesPage(d),
            image: ogImage(destSite, d),
            jsonLd: [destSite.pricesJsonLd(d, pageUrl(rel))],
            crumbs: [home, [d.name, pageUrl(destPath(lang, d.id))]],
        }), destSite])
    }
    const monthSite = loadSite(lang, rootFor(monthPath(lang, 1)))
    for (let m = 1; m <= 12; m++) {
        const rel = monthPath(lang, m)
        const picks = monthSite.monthDestinations(m)
        pages.push([rel, () => buildContentPage(template, lang, l => monthPath(l, m), monthSite, {
            title: monthSite.monthTitle(m),
            description: `${monthSite.pickLang(monthSite.MONTH_NOTES[m])} ${picks.slice(0, 5).map(d => d.name).join(', ')}…`,
            main: monthSite.monthPage(m),
            image: picks[0] ? ogImage(monthSite, picks[0]) : `${SITE_URL}assets/img/og/hoi-an.jpg`,
            jsonLd: [{ '@type': 'ItemList', name: monthSite.monthTitle(m),
                itemListElement: picks.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: pageUrl(destPath(lang, d.id)), name: d.name })) }],
            crumbs: [home],
        }), monthSite])
    }
    const themeSite = loadSite(lang, rootFor(themePath(lang, 'x')))
    for (const theme of themeSite.themeList()) {
        const rel = themePath(lang, theme.slug)
        const picks = themeSite.DESTINATIONS.filter(d => (theme.kind === 'region' ? d.region === theme.key : d.categories.includes(theme.key)))
            .sort((a, b) => b.rating - a.rating)
        pages.push([rel, () => buildContentPage(template, lang, l => themePath(l, theme.slug), themeSite, {
            title: themeSite.themeTitle(theme),
            description: themeSite.pickLang(themeSite.THEME_INTROS[theme.key]),
            main: themeSite.themePage(theme),
            image: picks[0] ? ogImage(themeSite, picks[0]) : `${SITE_URL}assets/img/og/hoi-an.jpg`,
            jsonLd: [{ '@type': 'ItemList', name: themeSite.themeTitle(theme),
                itemListElement: picks.map((d, i) => ({ '@type': 'ListItem', position: i + 1, url: pageUrl(destPath(lang, d.id)), name: d.name })) }],
            crumbs: [home],
        }), themeSite])
    }
    return pages
}

function buildSitemap(site) {
    const today = new Date().toISOString().slice(0, 10)
    const rels = Object.keys(LANGS).flatMap(lang =>
        [homePath(lang), plannerPath(lang), guidePath(lang), ...site.GUIDES.map(g => guidePath(lang, g.slug)),
            ...site.DESTINATIONS.map(d => destPath(lang, d.id)), ...exploreRels(lang)])
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rels.map(rel => `  <url><loc>${pageUrl(rel)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
}

const exploreRels = lang => explorePages(read('guide.html'), lang).map(([rel]) => rel)

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

/*
 * Quán / lưu trú / điểm tham quan lưu cặp [tiếng Việt, English]; trên trình duyệt chỉ đọc qua pickLang (chấp nhận
 * cả chuỗi) nên mỗi trang chỉ cần một ngôn ngữ. Giữ nguyên cặp ở tên điểm tham quan (link Google Maps dùng tên tiếng Việt).
 */
const monoPair = lang => pair => (Array.isArray(pair) && pair.length === 2 && pair.every(x => typeof x === 'string') ? pair[lang === 'vi' ? 0 : 1] || pair[0] : pair)
const monoSights = (days, lang, one = monoPair(lang)) => days.map(list => list.map(s => ({
    ...s,
    ...(s.note ? { note: one(s.note) } : {}),
    ...(s.cafe ? { cafe: { ...s.cafe, drink: one(s.cafe.drink) } } : {}),
})))
const monoPlaces = (p, lang, one = monoPair(lang)) => ({
    ...p,
    getThere: one(p.getThere),
    eats: p.eats.map(e => ({ ...e, dish: one(e.dish) })),
    cafes: p.cafes.map(c => ({ ...c, drink: one(c.drink) })),
    stays: p.stays.map(st => ({ ...st, area: one(st.area), note: one(st.note) })),
})
const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]))

/*
 * Trang lập kế hoạch không nạp sẵn quán / điểm tham quan / lịch trình của cả 34 điểm đến: planner.js tải
 * assets/js/data/plan/<lang>/<id>.json của các điểm trong kế hoạch khi cần (đã một ngôn ngữ, lịch trình đã dịch).
 */
const PLAN_DATA_DIR = 'assets/js/data/plan'
const isPlannerPage = pageFiles => pageFiles.includes('assets/js/planner.js')
const planDataFile = (site, lang, id) => JSON.stringify({
    places: monoPlaces(site.PLACES[id], lang),
    sights: monoSights(site.SIGHTS[id], lang),
    itinerary: site.ITINERARIES[id],
})

function monolingualData(file, site, lang, lazy) {
    const one = monoPair(lang)
    if (file === 'assets/js/data/sights.js') return `const SIGHTS = ${lazy ? '{}' : JSON.stringify(mapValues(site.SIGHTS, days => monoSights(days, lang)))}`
    const stayTypes = mapValues(site.STAY_TYPES, one)
    const transport = { ...site.TRANSPORT, ports: site.TRANSPORT.ports.map(port => ({ ...port, name: one(port.name) })) }
    const places = lazy ? {} : mapValues(site.PLACES, p => monoPlaces(p, lang))
    return `const STAY_TYPES = ${JSON.stringify(stayTypes)}\nconst TRANSPORT = ${JSON.stringify(transport)}\nconst PLACES = ${JSON.stringify(places)}`
}

function scriptSource(file, site, pageFiles) {
    if (file === 'assets/js/data/local-images.js') return compactLocalImages(site.LOCAL_IMAGES)
    if (file === 'assets/js/data/places.js' || file === 'assets/js/data/sights.js') return monolingualData(file, site, siteLangs.get(site), isPlannerPage(pageFiles))
    if (file === 'assets/js/data/itineraries.js' && isPlannerPage(pageFiles)) return `const TOUR_LENGTHS = ${JSON.stringify(site.TOUR_LENGTHS)}\nconst ITINERARIES = {}`
    if (file === 'assets/js/data/en.js') {
        /* Bản tiếng Anh gốc (trang ko/zh/ja: i18n.js tự phủ bản dịch riêng lên trên trình duyệt) */
        const { html, itineraries, ...en } = loadSite('en', '').TRANSLATION_EN
        const local = site.TRANSLATION_LOCAL
        if (local) {
            /* Bỏ chuỗi tiếng Anh đã có bản dịch riêng (không bao giờ hiện); giữ phần bản dịch không có (vd. giá món ăn) */
            const covered = (a, b) => (a && typeof a === 'object'
                ? b != null && typeof b === 'object' && Object.keys(a).every(k => covered(a[k], b[k]))
                : b !== undefined)
            const omit = (obj, over = {}) => Object.fromEntries(Object.entries(obj).filter(([k, v]) => !covered(v, over[k])))
            ;['ui', 'regions', 'categories'].forEach(k => { en[k] = omit(en[k], local[k]) })
            en.destinations = Object.fromEntries(Object.entries(en.destinations).map(([id, d]) => [id, omit(d, local.destinations[id])]))
        }
        const withPlans = pageFiles.includes('assets/js/data/itineraries.js') && !isPlannerPage(pageFiles)
        return `const TRANSLATION_EN = ${JSON.stringify({ ...en, itineraries: withPlans ? itineraries : {} })}`
    }
    if (file.startsWith('assets/js/data/i18n/')) {
        /* Giữ tên ngày của lịch trình (nhỏ) – trang điểm đến cần nó, bỏ bảng dịch HTML tĩnh */
        const { html, ...local } = site.TRANSLATION_LOCAL
        return `const TRANSLATION_LOCAL = ${JSON.stringify(local)}`
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
    html = bundleStyles(applyTheme(html), siteRoot)
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
        const code = hrefs.map(h => read(h.slice(siteRoot.length))).join('\n') + themeCss()
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
    for (const marker of ['<!-- build:grid -->', '<!-- build:alternate -->', '<details class="nav__lang"']) {
        if (!homeTemplate.includes(marker)) throw new Error(`home.html thiếu ${marker}`)
    }

    // Xóa trang cũ (điểm đến đã bị đổi tên/xóa)
    fs.rmSync(path.join(ROOT, PAGE_DIR), { recursive: true, force: true })
    Object.values(LANGS).filter(l => l.prefix).forEach(l => fs.rmSync(path.join(ROOT, l.prefix), { recursive: true, force: true }))
    fs.rmSync(path.join(ROOT, PLANNER_DIR), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, GUIDE_DIR), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, MONTH_DIR), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, THEME_DIR), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, DEST_DATA_DIR), { recursive: true, force: true })
    fs.rmSync(path.join(ROOT, DIST_DIR), { recursive: true, force: true })
    fs.readdirSync(path.join(ROOT, CSS_DIR)).filter(f => /^site-\w+\.css$/.test(f)).forEach(f => fs.rmSync(path.join(ROOT, CSS_DIR, f)))

    let count = 0
    let explore = 0
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
        const planSite = loadSite(lang, '')
        fs.rmSync(path.join(ROOT, PLAN_DATA_DIR, lang), { recursive: true, force: true })
        planSite.DESTINATIONS.forEach(d => write(`${PLAN_DATA_DIR}/${lang}/${d.id}.json`, planDataFile(planSite, lang, d.id)))
        page(guidePath(lang), site => buildGuidePage(guideTemplate, lang, '', site))
        for (const g of loadSite(lang, '').GUIDES) page(guidePath(lang, g.slug), site => buildGuidePage(guideTemplate, lang, g.slug, site))
        for (const [rel, build, site] of explorePages(guideTemplate, lang)) {
            write(rel, bundleScripts(build(), rootFor(rel), site))
            explore++
        }
    }

    /* Liên kết trong thông báo theo mùa phải trỏ tới trang có thật */
    SITE_CONFIG.seasons.forEach(season => {
        const link = season.banner && season.banner.link
        if (link && !link.startsWith('https://') && !fs.existsSync(path.join(ROOT, link))) {
            throw new Error(`data/site.json: mùa ${season.id} – liên kết ${link} không tồn tại`)
        }
    })

    bundles.forEach((code, rel) => write(rel, code))
    write('sitemap.xml', buildSitemap(loadSite('vi', '')))
    write('sw.js', updateServiceWorkerVersion(updateCoreAssets(read('sw.js'), read(homePath('vi')))))
    write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE_URL}sitemap.xml\n`)

    const n = Object.keys(LANGS).length
    console.log(`✅ Đã tạo ${count} trang điểm đến (${Object.keys(LANGS).join(' + ')}), ${n} trang chủ, ${n} trang kế hoạch, ${n * (1 + loadSite('vi', '').GUIDES.length)} trang cẩm nang, ${explore} trang khám phá (giá vé, theo tháng, chủ đề), ${bundles.size} bundle JS/CSS, sitemap.xml, robots.txt`)
}

main()
