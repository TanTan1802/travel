/*
 * Thêm một ảnh người đọc gửi (sau khi duyệt Issue "Gửi ảnh") vào site:
 * tải ảnh (URL hoặc file), xoay đúng chiều, xóa metadata (EXIF/GPS), tạo WebP 480/960/1920 theo cạnh dài
 * trong assets/img/community/ và thêm mục vào data/community-photos.json.
 *
 *   node tools/add-photo.js --dest hoi-an --src <URL ảnh trong Issue | đường dẫn file> \
 *     --author "Nguyễn Văn A" --caption "Phố cổ lúc lên đèn" --caption-en "Old town at dusk" \
 *     [--license "CC BY 4.0"] [--issue https://github.com/TanTan1802/travel/issues/123]
 *   npm run build
 *
 * Chỉ nhận ảnh người gửi là tác giả và đã đồng ý giấy phép trong form.
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { ROOT } = require('./lib')

const OUT_DIR = 'assets/img/community'
const DATA = path.join(ROOT, 'data/community-photos.json')
const SIZES = [480, 960, 1920]

function parseArgs(argv) {
    const args = {}
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith('--')) args[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
    }
    return args
}

const slug = text => text.toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)

async function readSource(src) {
    if (/^https?:\/\//.test(src)) {
        const res = await fetch(src)
        if (!res.ok) throw new Error(`Không tải được ảnh: HTTP ${res.status}`)
        return Buffer.from(await res.arrayBuffer())
    }
    return fs.readFileSync(path.resolve(src))
}

/*
 * Thêm một ảnh: { dest, src, author, caption, captionEn?, license?, issue?, input? (Buffer đã tải) }.
 * Dùng chung cho dòng lệnh và tools/approve-photo.js (duyệt ảnh từ trang quản trị).
 */
async function addPhoto(args) {
    for (const key of ['dest', 'author', 'caption']) {
        if (!args[key] || args[key] === true) throw new Error(`Thiếu --${key}`)
    }
    if (!args.src && !args.input) throw new Error('Thiếu --src')
    const { destinations } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/destinations.json'), 'utf8'))
    if (!destinations.some(d => d.id === args.dest)) throw new Error(`Không có điểm đến "${args.dest}"`)

    const sharp = require('sharp')
    const input = args.input || await readSource(args.src)
    const base = `${args.dest}-${slug(args.caption)}-${crypto.createHash('md5').update(input).digest('hex').slice(0, 6)}`
    fs.mkdirSync(path.join(ROOT, OUT_DIR), { recursive: true })
    let lg
    for (const size of SIZES) {
        /* sharp mặc định không giữ metadata → bỏ EXIF/GPS của người gửi */
        const info = await sharp(input).rotate().resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 78, effort: 5 }).toFile(path.join(ROOT, OUT_DIR, `${base}-${size}.webp`))
        lg = info
    }

    const json = JSON.parse(fs.readFileSync(DATA, 'utf8'))
    json.photos.push({
        dest: args.dest,
        base,
        w: lg.width,
        h: lg.height,
        caption: [args.caption, args.captionEn || args['caption-en'] || args.caption],
        author: args.author,
        license: args.license || 'CC BY 4.0',
        date: new Date().toISOString().slice(0, 7),
        ...(args.issue ? { source: args.issue } : {}),
    })
    fs.writeFileSync(DATA, JSON.stringify(json, null, 2) + '\n')
    console.log(`✅ Đã thêm ${OUT_DIR}/${base}-{480,960,1920}.webp – chạy npm run build`)
    return base
}

if (require.main === module) {
    addPhoto(parseArgs(process.argv.slice(2))).catch(err => {
        console.error(`❌ ${err.message}`)
        process.exitCode = 1
    })
}

module.exports = { addPhoto }
