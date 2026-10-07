/* Tiện ích dùng chung cho các script trong thư mục tools/ */
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const ROOT = path.join(__dirname, '..')
/* Địa chỉ chính của site (canonical, sitemap, og:image) – bản Cloudflare. GitHub Pages là bản sao trỏ canonical về đây. */
const SITE_URL = 'https://viet-travel.congtan5918.workers.dev/'

/* Nạp các file JS của trình duyệt vào một sandbox và lấy ra các biến toàn cục cần dùng */
function loadBrowserScripts(files, exportNames, globals = {}) {
    const context = { window: { ...globals }, URLSearchParams, URL, TextEncoder, ...globals }
    const code = files.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n')
    const exportCode = exportNames.map(n => `this.${n} = typeof ${n} !== 'undefined' ? ${n} : undefined`).join(';')
    vm.runInNewContext(`${code}\n;${exportCode}`, context)
    return context
}

function loadDestinations() {
    return loadBrowserScripts(['assets/js/data/destinations.js'], ['DESTINATIONS']).DESTINATIONS
}

/* Tất cả ảnh Commons được dùng trên site: Map<tên file, Set<nơi dùng>> */
function collectWikiFiles() {
    const files = new Map()
    const add = (file, where) => {
        if (!file) return
        ;(Array.isArray(file) ? file : [file]).forEach(f => {
            if (!files.has(f)) files.set(f, new Set())
            files.get(f).add(where)
        })
    }

    for (const d of loadDestinations()) {
        add(d.hero, `${d.id} (ảnh bìa)`)
        d.gallery.forEach(g => add(g.file, `${d.id} (gallery)`))
        d.foods.forEach(f => add(f.file, `${d.id} (món: ${f.name})`))
    }

    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
    for (const [, attr] of html.matchAll(/data-wiki="([^"]+)"/g)) {
        attr.split('|').forEach(f => add(f.replace(/&quot;/g, '"'), 'index.html'))
    }
    return files
}

/* Tên file an toàn (không dấu, không khoảng trắng) */
function slugify(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
        .toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        .slice(0, 80)
}

module.exports = { ROOT, SITE_URL, loadBrowserScripts, loadDestinations, collectWikiFiles, slugify }
