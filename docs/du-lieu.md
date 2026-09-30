# Dữ liệu của Việt Travel

Toàn bộ nội dung (điểm đến, lịch trình, quán ăn, điểm tham quan, lễ hội) nằm trong thư mục **`data/`** dưới dạng JSON, có **JSON Schema** để kiểm tra tự động. Trình duyệt không đọc trực tiếp các file JSON; mỗi lần `npm run build`, script `tools/build-data.js` sẽ:

1. kiểm tra từng file theo schema trong `data/schema/` (dùng [Ajv](https://ajv.js.org/));
2. kiểm tra ràng buộc chéo, ví dụ mọi điểm đến đều phải có lịch trình, quán và điểm tham quan, hoặc giá thấp không được lớn hơn giá cao;
3. sinh lại các file `assets/js/data/*.js` mà website dùng.

> ⚠️ **Không sửa** các file `assets/js/data/destinations.js`, `itineraries.js`, `places.js`, `sights.js`, `events.js`, vì chúng bị ghi đè mỗi lần build. Hãy sửa file JSON tương ứng trong `data/`.

| File | Nội dung | Schema |
|---|---|---|
| `data/destinations.json` | 28 điểm đến: thông tin, ảnh Wikimedia Commons, món đặc sản, trải nghiệm, kinh nghiệm | `destinations.schema.json` |
| `data/itineraries.json` | Lịch trình 5 ngày mỗi điểm đến + phí tham quan trung bình | `itineraries.schema.json` |
| `data/places.json` | Quán ăn, quán nước, khu lưu trú, cách đi tới | `places.schema.json` |
| `data/sights.json` | Điểm tham quan theo từng ngày (giá vé, giờ mở cửa, địa chỉ) + quán nước gần điểm | `sights.schema.json` |
| `data/events.json` | Lễ hội, mùa cảnh sắc, nghỉ lễ, thời tiết cần lưu ý | `events.schema.json` |

Bản dịch tiếng Anh của phần chữ trong điểm đến và lịch trình vẫn nằm ở `assets/js/data/en.js`. Các chuỗi hai ngôn ngữ trong `places`, `sights` và `events` được viết dạng `["tiếng Việt", "English"]`.

## Kiểm tra nhanh

```bash
npm install
npm run check-data   # chỉ kiểm tra dữ liệu theo schema
npm run build        # kiểm tra + sinh file + build trang tĩnh
npm test             # test dữ liệu + test giao diện
```

Trình soạn thảo có hỗ trợ JSON Schema (VS Code…) sẽ tự gợi ý và báo lỗi khi sửa, nhờ khóa `"$schema"` ở đầu mỗi file.

## Thêm một điểm đến mới

1. Thêm một mục vào `data/destinations.json`. `id` viết chữ thường không dấu, nối bằng gạch ngang, ví dụ `"hoi-an"`.
2. Thêm lịch trình 5 ngày vào `data/itineraries.json`.
3. Thêm quán ăn, quán nước và lưu trú vào `data/places.json`.
4. Thêm điểm tham quan cho 5 ngày vào `data/sights.json`.
5. Thêm bản dịch vào `assets/js/data/en.js`, phần `destinations` và `itineraries`.
6. Chạy `npm run build` và `npm test`, rồi mở Pull Request. Sau khi merge, workflow sẽ tự tải ảnh.

## Cập nhật giá vé, giờ mở cửa bằng Google Sheets

Người không rành code vẫn có thể cập nhật giá bằng Google Sheets. Workflow **Đồng bộ Google Sheets** (`.github/workflows/sync-sheets.yml`) chạy mỗi sáng thứ Hai, hoặc khi bấm *Run workflow*. Nó đọc bảng tính, cập nhật `data/*.json` và **mở Pull Request** để bạn duyệt trước khi lên web.

### Thiết lập lần đầu

1. **Xuất bảng mẫu** từ dữ liệu hiện có:
   ```bash
   node tools/sheets.js export   # tạo data/sheets/sights.csv và data/sheets/eats.csv
   ```
2. Tạo một Google Sheet có 2 trang tính, rồi nhập 2 file CSV trên vào (*Tệp → Nhập → Tải lên*).
3. Với mỗi trang tính, chọn *Tệp → Chia sẻ → Xuất bản lên web*, chọn trang tính đó, định dạng **Giá trị được phân tách bằng dấu phẩy (.csv)**, rồi sao chép link.
4. Trên GitHub, vào *Settings → Secrets and variables → Actions → Variables* và thêm:
   - `SHEET_SIGHTS_CSV_URL` = link CSV của trang điểm tham quan
   - `SHEET_EATS_CSV_URL` = link CSV của trang quán
5. Vào *Settings → Actions → General* và bật **Allow GitHub Actions to create and approve pull requests**.

### Các cột trong bảng

**Điểm tham quan** (`sights.csv`)

| Cột | Ý nghĩa |
|---|---|
| `dest_id`, `day`, `name_vi` | Dùng để **xác định mục cần sửa**, không nên đổi |
| `price_min`, `price_max` | Giá vé người lớn (VND). Hai ô bằng nhau nghĩa là một mức giá; `0` là miễn phí. Có thể gõ `120.000` hoặc `120000` |
| `hours` | Giờ mở cửa, ví dụ `07:00–17:30`; `all` là mở cả ngày; hai ngôn ngữ thì viết `Sáng thứ Bảy \| Saturday morning` |
| `address` | Địa chỉ |
| `name_en`, `note_vi`, `note_en` | Tên tiếng Anh và ghi chú về giá |

**Quán** (`eats.csv`): `dest_id`, `kind` (`eat` là quán ăn, `cafe` là quán nước) và `name` dùng để xác định mục. Các cột sửa được là `price_min`, `price_max` (giá mỗi người), `address`, `dish_vi` và `dish_en`.

Công cụ đồng bộ **chỉ cập nhật mục đã có**, không tự thêm hay xóa. Dòng không khớp mục nào (ví dụ gõ sai tên) sẽ được liệt kê trong mô tả của Pull Request để bạn kiểm tra. Nếu dữ liệu sau khi đồng bộ không hợp lệ theo schema, workflow sẽ dừng và **không** mở PR.

### Chạy thử trên máy

```bash
SHEET_SIGHTS_CSV=data/sheets/sights.csv SHEET_EATS_CSV=data/sheets/eats.csv node tools/sheets.js sync
```
