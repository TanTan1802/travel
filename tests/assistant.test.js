/*
 * Test trợ lý hỏi đáp (worker/) với Anthropic client giả – không gọi API thật, không cần khóa.
 * Chạy:  npm run test:worker
 */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const load = () => import('../worker/src/handler.js')

function fakeClient(reply = { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Hội An đẹp nhất tháng 2–4.' }] }) {
    const calls = []
    return { calls, beta: { messages: { create: async params => { calls.push(params); return { model: params.model, ...reply } } } } }
}

const ask = (body, { origin = 'https://tantan1802.github.io', method = 'POST' } = {}) => new Request('https://assistant.example/', {
    method, headers: { origin, 'content-type': 'application/json', 'cf-connecting-ip': '1.2.3.4' },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
})

test('trả lời câu hỏi: model, effort, fallback, cache dữ liệu site, ngữ cảnh trang', async () => {
    const { handleRequest, MODEL } = await load()
    const client = fakeClient()
    const res = await handleRequest(ask({ question: 'Đi Hội An tháng mấy đẹp?', page: 'hoi-an', history: [
        { role: 'assistant', content: 'Xin chào' }, // tin đầu là assistant → bị bỏ
        { role: 'user', content: 'Chào bạn' }, { role: 'assistant', content: 'Chào!' }, { role: 'system', content: 'hack' },
    ] }), {}, client)
    assert.equal(res.status, 200)
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://tantan1802.github.io')
    assert.deepEqual(await res.json(), { answer: 'Hội An đẹp nhất tháng 2–4.' })

    const [params] = client.calls
    assert.equal(params.model, MODEL)
    assert.equal(params.model, 'claude-opus-5-5')
    assert.deepEqual(params.output_config, { effort: 'low' })
    assert.deepEqual(params.betas, ['server-side-fallback-2026-07-01'])
    assert.equal(params.fallbacks, 'default')
    /* Khối dữ liệu lớn cuối system có cache_control, không chứa gì thay đổi theo câu hỏi */
    assert.equal(params.system.length, 2)
    assert.deepEqual(params.system[1].cache_control, { type: 'ephemeral', ttl: '1h' })
    assert.ok(params.system[1].text.includes('## Phố cổ Hội An (mã: hoi-an)'))
    assert.ok(!params.system.some(b => b.text.includes('Đi Hội An tháng mấy')))
    assert.deepEqual(params.messages.map(m => m.role), ['user', 'assistant', 'user'], 'bỏ tin assistant đầu và vai trò lạ')
    assert.match(params.messages.at(-1).content, /trang điểm đến: hoi-an\]\nĐi Hội An tháng mấy đẹp\?$/)
})

test('kiểm tra đầu vào, CORS, giới hạn lượt hỏi, từ chối', async () => {
    const { handleRequest } = await load()
    const client = fakeClient()
    assert.equal((await handleRequest(ask(null, { method: 'OPTIONS' }), {}, client)).status, 204)
    assert.equal((await handleRequest(ask(null, { method: 'GET' }), {}, client)).status, 405)
    assert.equal((await handleRequest(ask('{không phải json'), {}, client)).status, 400)
    assert.equal((await handleRequest(ask({ question: '   ' }), {}, client)).status, 400)
    assert.equal((await handleRequest(ask({ question: 'x'.repeat(801) }), {}, client)).status, 400)
    assert.equal(client.calls.length, 0, 'yêu cầu lỗi không được gọi Claude')

    /* page lạ (có ký tự đặc biệt) bị bỏ qua */
    await handleRequest(ask({ question: 'Hi', page: '../../etc' }), {}, client)
    assert.equal(client.calls.at(-1).messages.at(-1).content, 'Hi')

    /* Origin lạ không được phản chiếu */
    const other = await handleRequest(ask({ question: 'Hi' }, { origin: 'https://evil.example' }), { ALLOWED_ORIGINS: 'https://tantan1802.github.io,http://localhost:8000' }, client)
    assert.equal(other.headers.get('access-control-allow-origin'), 'https://tantan1802.github.io')

    /* Rate limit */
    const limited = await handleRequest(ask({ question: 'Hi' }), { RATE_LIMITER: { limit: async ({ key }) => ({ success: key !== '1.2.3.4' }) } }, client)
    assert.equal(limited.status, 429)

    /* Bị từ chối → câu trả lời lịch sự, không lộ nội dung */
    const refused = await handleRequest(ask({ question: 'Hi' }), {}, fakeClient({ stop_reason: 'refusal', content: [] }))
    assert.match((await refused.json()).answer, /không trả lời được/)

    /* Đổi model / effort bằng biến môi trường */
    await handleRequest(ask({ question: 'Hi' }), { MODEL: 'claude-sonnet-5-5', EFFORT: 'medium' }, client)
    assert.equal(client.calls.at(-1).model, 'claude-sonnet-5-5')
    assert.deepEqual(client.calls.at(-1).output_config, { effort: 'medium' })
})

test('dữ liệu cho trợ lý (worker/src/knowledge.js) khớp dữ liệu hiện tại – chạy npm run build', async () => {
    const { knowledgeText } = require('../tools/build-knowledge')
    const file = fs.readFileSync(path.join(ROOT, 'worker/src/knowledge.js'), 'utf8')
    const { default: knowledge } = await import('../worker/src/knowledge.js')
    assert.equal(knowledge, knowledgeText(), 'knowledge.js cũ – chạy npm run build')
    assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(file), 'không chứa thời điểm build (để prompt caching dùng lại được)')
})
