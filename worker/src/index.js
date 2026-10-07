/*
 * Cloudflare Worker: trợ lý hỏi đáp của Việt Travel (Claude API).
 * Khóa API đặt bằng `npx wrangler secret put ANTHROPIC_API_KEY` – không bao giờ để trong mã hay trên site tĩnh.
 */
import Anthropic from '@anthropic-ai/sdk'
import { handleRequest, corsHeaders } from './handler.js'

export default {
    async fetch(request, env) {
        const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
        try {
            return await handleRequest(request, env, client)
        } catch (error) {
            const cors = corsHeaders(request, env)
            const reply = (message, status) => new Response(JSON.stringify({ error: message }), { status, headers: { ...cors, 'content-type': 'application/json; charset=utf-8' } })
            if (error instanceof Anthropic.RateLimitError) return reply('Trợ lý đang bận, thử lại sau ít phút nhé.', 503)
            if (error instanceof Anthropic.APIError) {
                console.error(`Claude API ${error.status}: ${error.message}`)
                return reply('Trợ lý tạm thời gặp lỗi, thử lại sau nhé.', 502)
            }
            console.error(error)
            return reply('Có lỗi xảy ra.', 500)
        }
    },
}
