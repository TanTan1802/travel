/*
 * Worker đứng trước site tĩnh trên Cloudflare (wrangler.jsonc) – chỉ chạy cho đường dẫn /google*.html
 * (run_worker_first), mọi đường dẫn khác Cloudflare trả thẳng từ dist/.
 *
 * Lý do: Cloudflare mặc định chuyển hướng /ten-file.html → /ten-file (html_handling), còn Google Search Console
 * cần đọc đúng /googleXXXX.html (phương thức "Tệp HTML"). Worker lấy nội dung file đó trong dist/ và trả về
 * trực tiếp, không chuyển hướng. Chỉ file có thật trong repo mới được trả – không ai khác xác minh được site.
 */
export default {
    async fetch(request, env) {
        const url = new URL(request.url)
        if (/^\/google[0-9a-f]+\.html$/.test(url.pathname)) {
            const res = await env.ASSETS.fetch(new Request(new URL(url.pathname.slice(0, -'.html'.length), url), request))
            if (res.ok) return new Response(res.body, { headers: { 'content-type': 'text/html; charset=utf-8' } })
        }
        return env.ASSETS.fetch(request)
    },
}
