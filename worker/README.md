# Trợ lý hỏi đáp Việt Travel (Cloudflare Worker + Claude)

Nút **"Hỏi Việt Travel"** trên site gửi câu hỏi tới Worker này; Worker gọi Claude (`claude-opus-5-5`) kèm toàn bộ
dữ liệu site (`src/knowledge.js`, sinh bởi `npm run build` ở thư mục gốc) và trả câu trả lời ngắn.
Khóa API chỉ nằm trên Cloudflare – trang tĩnh không bao giờ thấy.

## Triển khai (một lần)

1. Tạo tài khoản [Cloudflare](https://dash.cloudflare.com) (gói miễn phí đủ dùng) và lấy khóa API tại
   [platform.claude.com](https://platform.claude.com).
2. Trong thư mục `worker/`:
   ```bash
   npm install
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY   # dán khóa API
   npx wrangler deploy                         # in ra URL dạng https://viet-travel-assistant.<tên>.workers.dev
   ```
3. Dán URL vào `assets/js/config.js` → `assistantEndpoint`, chạy `npm run build` ở thư mục gốc, commit.

Sau mỗi lần dữ liệu thay đổi (`npm run build` sinh lại `src/knowledge.js`), chạy lại `npx wrangler deploy`.

## Cấu hình (`wrangler.toml`)

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `ALLOWED_ORIGINS` | `https://viet-travel.congtan5918.workers.dev,https://tantan1802.github.io` | Trang được gọi Worker (CORS), ngăn cách bằng dấu phẩy. Thêm `http://localhost:8000` khi thử trên máy |
| `MODEL` | `claude-opus-5-5` | Model Claude |
| `EFFORT` | `low` | Mức suy nghĩ (`low`…`max`); câu hỏi ngắn kiểu trò chuyện dùng `low` là đủ |
| `RATE_LIMITER` | 10 câu / phút / IP | Binding Rate Limiting của Cloudflare – chống bị gọi tràn làm tốn tiền API |

## Chi phí

Mỗi câu hỏi gửi kèm khối dữ liệu site (~140 KB chữ). Khối này được **prompt caching** (TTL 1 giờ): lần đầu trong giờ tính
giá ghi cache, các câu sau chỉ tính giá đọc cache (rẻ hơn ~10 lần giá đầu vào thường). Xem lượng token thực tế ở
`usage.cache_read_input_tokens` trong log hoặc dùng API đếm token; đặt **giới hạn chi tiêu** trong console Claude.
Muốn rẻ hơn có thể đổi `MODEL`, đổi lại thì chất lượng trả lời có thể khác – nên thử với câu hỏi thật trước.

## An toàn

- Câu hỏi tối đa 800 ký tự, lịch sử tối đa 6 tin, chỉ nhận vai trò `user`/`assistant`; mã trang chỉ nhận `[a-z0-9-]`.
- Bộ lọc an toàn từ chối → Worker trả lời lịch sự; bật sẵn `fallbacks: "default"` để server tự chạy lại trên model dự phòng.
- Câu trả lời hiển thị dạng chữ (không chèn HTML), liên kết mở tab mới.

## Kiểm tra

`npm run test:worker` (thư mục gốc) chạy với client giả – không gọi API thật, không cần khóa.
`npx wrangler dev` để chạy thử Worker trên máy.
