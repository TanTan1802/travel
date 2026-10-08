/*
 * Đăng ảnh người đọc đã được duyệt trên trang quản trị (workflow photo-approve.yml).
 * Trang quản trị bình luận vào Issue "Gửi ảnh" một dòng <!-- duyet-anh:<base64 JSON> --> gồm
 * { dest, caption, captionEn, author, images: [URL ảnh đính kèm của Issue] }; script này giải mã,
 * kiểm tra rồi chạy addPhoto (tools/add-photo.js) cho từng ảnh.
 *
 *   COMMENT="<nội dung bình luận>" ISSUE_URL=https://github.com/... node tools/approve-photo.js
 *
 * Nội dung bình luận đến từ Issue công khai – chỉ chạy khi người bình luận có quyền ghi repo (workflow kiểm tra)
 * và mọi trường đều được kiểm tra lại ở đây.
 */
const fs = require('fs')
const { addPhoto } = require('./add-photo')

const MARKER = /<!-- duyet-anh:([A-Za-z0-9+/=]+) -->/
/* Chỉ nhận ảnh đính kèm do GitHub lưu (kéo thả vào Issue) */
const IMAGE_URL = /^https:\/\/(github\.com\/user-attachments\/assets\/[0-9a-f-]+|user-images\.githubusercontent\.com\/\S+|private-user-images\.githubusercontent\.com\/\S+)$/
const MAX_IMAGES = 3

function parseApproval(comment) {
    const m = String(comment || '').match(MARKER)
    if (!m) throw new Error('Bình luận không có dòng duyet-anh')
    const data = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'))
    const text = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
    const approval = {
        dest: text(data.dest, 60),
        caption: text(data.caption, 200),
        captionEn: text(data.captionEn, 200),
        author: text(data.author, 80),
        images: Array.isArray(data.images) ? data.images.filter(u => typeof u === 'string' && IMAGE_URL.test(u)).slice(0, MAX_IMAGES) : [],
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(approval.dest)) throw new Error('Mã điểm đến không hợp lệ')
    if (!approval.caption || !approval.author) throw new Error('Thiếu chú thích hoặc tên tác giả')
    if (!approval.images.length) throw new Error('Không có ảnh hợp lệ (chỉ nhận ảnh đính kèm trong Issue)')
    return approval
}

async function download(url) {
    let res = await fetch(url, { redirect: 'follow' })
    /* Ảnh của repo riêng tư cần token; repo công khai tải được không cần */
    if (!res.ok && process.env.GITHUB_TOKEN) res = await fetch(url, { headers: { authorization: `token ${process.env.GITHUB_TOKEN}` } })
    if (!res.ok) throw new Error(`Không tải được ảnh ${url}: HTTP ${res.status}`)
    const type = res.headers.get('content-type') || ''
    if (!/^image\//.test(type)) throw new Error(`Tệp ${url} không phải ảnh (${type})`)
    return Buffer.from(await res.arrayBuffer())
}

async function main() {
    const approval = parseApproval(process.env.COMMENT)
    const added = []
    for (const url of approval.images) {
        const input = await download(url)
        added.push(await addPhoto({ ...approval, input, src: url, issue: process.env.ISSUE_URL || undefined }))
    }
    const summary = `${added.length} ảnh cho ${approval.dest}`
    console.log(`✅ ${summary}`)
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `summary=${summary}\ndest=${approval.dest}\n`)
}

if (require.main === module) {
    main().catch(err => {
        console.error(`❌ ${err.message}`)
        if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `error=${err.message.replace(/\n/g, ' ')}\n`)
        process.exitCode = 1
    })
}

module.exports = { parseApproval, IMAGE_URL }
