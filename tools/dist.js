/*
 * Gom các file cần đăng lên mạng vào thư mục dist/ (để deploy lên Cloudflare Pages hoặc host tĩnh khác).
 *
 *   npm run build:dist                                        – giữ địa chỉ gốc (GitHub Pages) trong canonical/sitemap
 *   SITE_URL=https://viet-travel.pages.dev/ npm run build:dist – đổi canonical, hreflang, og:image, sitemap sang địa chỉ mới
 *   npx wrangler pages deploy dist --project-name viet-travel
 *
 * Không build lại: dùng đúng các trang đã build trong repo (CI bảo đảm luôn mới nhất).
 * Kèm _headers (cache dài cho file có hash, sw.js luôn kiểm tra bản mới) và 404.html
 * (không có 404.html thì Cloudflare Pages trả trang chủ cho mọi đường dẫn sai).
 */
const fs = require('fs')
const path = require('path')
const { ROOT } = require('./lib')

const SOURCE_URL = 'https://tantan1802.github.io/travel/'
/* Chỉ phục vụ việc phát triển – không đăng */
const EXCLUDE = new Set(['.git', '.github', '.claude', '.lighthouseci', 'node_modules', 'dist', 'tools', 'tests', 'data', 'docs', 'worker',
    'package.json', 'package-lock.json', 'lighthouserc.json', 'README.md', '.gitignore',
    'home.html']) // mẫu của index.html
const TEXT = /\.(html|xml|txt|js|json|css|webmanifest)$/

const HEADERS = `/assets/js/dist/*
  Cache-Control: public, max-age=31536000, immutable
/assets/css/site-*
  Cache-Control: public, max-age=31536000, immutable
/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/assets/img/*
  Cache-Control: public, max-age=2592000
/sw.js
  Cache-Control: no-cache
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`

const NOT_FOUND = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex">
    <title>Không tìm thấy trang – Việt Travel</title>
    <style>
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif;
               background: hsl(190, 100%, 99%); color: hsl(190, 64%, 18%); text-align: center; padding: 1rem; }
        h1 { font-size: 4rem; margin: 0; }
        a { display: inline-block; margin: .5rem; padding: .75rem 1.25rem; border-radius: .5rem;
            background: hsl(190, 64%, 22%); color: #fff; text-decoration: none; }
        @media (prefers-color-scheme: dark) { body { background: hsl(190, 29%, 10%); color: hsl(190, 20%, 90%); } }
    </style>
</head>
<body>
    <main>
        <h1>404</h1>
        <p>Không tìm thấy trang này. · This page could not be found.</p>
        <a href="/">Về trang chủ</a><a href="/en/">Home (English)</a>
    </main>
</body>
</html>
`

function copyDir(src, dest, rewrite) {
    let count = 0
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (src === ROOT && (EXCLUDE.has(entry.name) || entry.name.endsWith('.png'))) continue
        const from = path.join(src, entry.name)
        const to = path.join(dest, entry.name)
        if (entry.isDirectory()) {
            count += copyDir(from, to, rewrite)
        } else if (rewrite && TEXT.test(entry.name)) {
            fs.writeFileSync(to, rewrite(fs.readFileSync(from, 'utf8')))
            count++
        } else {
            fs.copyFileSync(from, to)
            count++
        }
    }
    return count
}

function buildDist(outDir = path.join(ROOT, 'dist'), siteUrl = process.env.SITE_URL) {
    const target = siteUrl ? siteUrl.replace(/\/?$/, '/') : ''
    if (target && !/^https:\/\/[^/]+\/(.+\/)?$/.test(target)) throw new Error(`SITE_URL không hợp lệ: ${siteUrl} (ví dụ https://viet-travel.pages.dev/)`)
    const rewrite = target && target !== SOURCE_URL ? text => text.split(SOURCE_URL).join(target) : null

    fs.rmSync(outDir, { recursive: true, force: true })
    const count = copyDir(ROOT, outDir, rewrite)
    fs.writeFileSync(path.join(outDir, '_headers'), HEADERS)
    fs.writeFileSync(path.join(outDir, '404.html'), NOT_FOUND)
    return { count: count + 2, url: target || SOURCE_URL }
}

if (require.main === module) {
    const { count, url } = buildDist()
    console.log(`✅ dist/: ${count} file · địa chỉ site: ${url}`)
    if (!process.env.SITE_URL) console.log('   (đặt SITE_URL=https://<tên-project>.pages.dev/ để canonical, sitemap trỏ về Cloudflare)')
}

module.exports = { buildDist, SOURCE_URL }
