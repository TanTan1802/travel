# travel
link: https://tantan1802.github.io/travel/

Website du lịch khám phá danh lam thắng cảnh Việt Nam.

## Tính năng
- **Trang chủ** (`index.html`): 34 danh lam thắng cảnh trên cả 3 miền, tìm kiếm thông minh,
  lọc theo vùng miền / loại hình / yêu thích, xem dạng **danh sách hoặc bản đồ**.
- **Landing page động** (`destination.html?id=<mã-điểm-đến>`): khi bấm vào một điểm đến, trang được
  tạo tự động từ dữ liệu, gồm ảnh bìa, thông tin nhanh, tổng quan, thư viện ảnh (có lightbox),
  ẩm thực, hoạt động vui chơi, kinh nghiệm du lịch và gợi ý điểm đến cùng vùng.
- **Tour 3 ngày 2 đêm / 4 ngày 3 đêm / 5 ngày 4 đêm** cho mỗi điểm đến: lịch trình từng ngày
  (sáng / chiều / tối), chi phí ước tính theo từng tour, xem từng ngày hoặc tất cả các ngày.
- **Lịch 12 tháng bấm được**: chọn tháng để biết có nên đi không và gợi ý điểm đến đẹp vào tháng đó;
  trang chủ lọc được điểm đến theo tháng muốn đi.
- **Bản đồ** (Leaflet + OpenStreetMap) với điểm lân cận và khoảng cách.
- **Thời tiết hiện tại** (Open-Meteo) và thanh 12 tháng tô màu mùa đẹp.
- **Yêu thích**: lưu điểm đến ngay trên trình duyệt, không cần đăng nhập.
- **Song ngữ Việt – Anh**: bản tiếng Anh ở `/en/`, nút chuyển ngôn ngữ trên thanh menu.

## Cấu trúc & quy trình
| Đường dẫn | Vai trò |
|---|---|
| `assets/js/data/destinations.js` | Toàn bộ dữ liệu điểm đến |
| `destination.html` | Mẫu giao diện trang chi tiết (cũng chạy động với `?id=`) |
| `diem-den/<id>/index.html`, `en/` | Trang tĩnh sinh tự động (vi + en) – **không sửa tay** |
| `tools/` | Script build, tải ảnh, kiểm tra ảnh |

Sau khi sửa dữ liệu hoặc `destination.html`:

```bash
npm run build          # sinh lại diem-den/*, danh sách ở index.html, sitemap.xml
```

Tự host ảnh (khuyên dùng, chạy trên máy có Internet):

```bash
npm run images         # tải ảnh về assets/img/wiki + sinh local-images.js
npm run build
```

Mỗi trang điểm đến có thẻ Open Graph (hiện ảnh xem trước khi chia sẻ Facebook/Zalo),
dữ liệu có cấu trúc schema.org `TouristDestination` + `BreadcrumbList` + `FAQPage` (hỏi đáp tự sinh từ
thời điểm đẹp, số ngày, điểm nổi bật, cách đi) và được liệt kê trong `sitemap.xml`. Bài cẩm nang có `Article`,
trang chủ có `WebSite`.

Tên tỉnh ghi theo địa giới sau sáp nhập ngày 1/7/2025, kèm tên cũ trong ngoặc cho dễ tìm, ví dụ
`Tuyên Quang (Hà Giang cũ)`.

## Song ngữ
- Chuỗi giao diện trong JS dùng `t('Câu tiếng Việt')`; bản dịch nằm trong `assets/js/data/en.js`
  (`ui`, `html`, `destinations`, `itineraries`).
- Lịch trình nằm trong `assets/js/data/itineraries.js`: mỗi điểm đến có 5 ngày nối tiếp, tour 3/4/5 ngày
  lấy lần lượt 3/4/5 ngày đầu; `budget` là chi phí cho [3, 4, 5] ngày.
- Khi thêm điểm đến mới, thêm bản dịch tương ứng vào `en.js` rồi chạy `npm run build`
  (các trường chưa dịch sẽ hiển thị tiếng Việt).

## Cài như ứng dụng (PWA)
Website có thể cài lên màn hình chính điện thoại/máy tính và xem lại các trang đã mở khi mất mạng
(hữu ích khi lên vùng cao). Service worker (`sw.js`) được `npm run build` tự cập nhật phiên bản.

## Form đăng ký nhận tin
Tạo form miễn phí tại [Formspree](https://formspree.io), rồi dán URL vào `assets/js/config.js`:

```js
newsletterEndpoint: 'https://formspree.io/f/xxxxxxx',
```

Khi để trống, form hiển thị thông báo "sắp ra mắt" thay vì gửi đi.

## Bình luận (Giscus)
Mỗi trang điểm đến có thể có mục bình luận lưu trong GitHub Discussions (trang tiếng Việt và tiếng Anh
dùng chung một luồng):

1. Bật **Discussions** trong Settings của repo và cài app [giscus](https://github.com/apps/giscus).
2. Vào [giscus.app](https://giscus.app), nhập repo, chọn category → copy `data-repo-id`, `data-category`,
   `data-category-id` vào mục `giscus` trong `assets/js/config.js`.
3. Chạy `npm run build`.

Khi chưa cấu hình, mục bình luận được ẩn.

## Lập kế hoạch chuyến đi (`ke-hoach/`)

- Mẫu `planner.html` → build ra `ke-hoach/index.html` và `en/ke-hoach/index.html`; logic ở `assets/js/planner.js`.
- Ghép tối đa 10 điểm đến, mỗi nơi 1–7 ngày; nút "Sắp xếp tuyến ngắn nhất" (láng giềng gần nhất + 2-opt, giữ điểm xuất phát).
- Ước tính quãng đường (đường chim bay × 1,3), phương tiện (xe khách/ô tô hoặc máy bay khi xa trên 450 km hay ra đảo) và chi phí/người (nội suy từ ngân sách tour 3/4/5 ngày + di chuyển). Hằng số ở đầu `planner.js`.
- Lịch trình từng ngày gộp từ `ITINERARIES`, có ghi chú ngày di chuyển; cảnh báo điểm đến ngoài mùa đẹp theo tháng khởi hành.
- Kế hoạch lưu trong trình duyệt (`TripPlan` ở `favorites.js`) và chia sẻ qua URL: `ke-hoach/index.html?p=hue.2,hoi-an.3&m=3&b=c`.
- Trang điểm đến có nút "Thêm vào kế hoạch chuyến đi" dưới phần lịch trình.

## Cẩm nang du lịch (`cam-nang/`)

- Nội dung ở `assets/js/data/guides.js` (6 bài song ngữ: thời điểm đẹp, di chuyển, chi phí, ẩm thực, visa/giấy tờ, an toàn & liên lạc); hàm render ở `assets/js/guide-render.js`.
- Build sinh `cam-nang/index.html`, `cam-nang/<slug>/index.html` và bản `en/` từ mẫu `guide.html` (nội dung render sẵn – tốt cho SEO), thêm vào sitemap; trang chủ có mục "Cẩm nang" (3 bài đầu).
- Bài "Nên đi du lịch Việt Nam vào tháng nào?" có bảng 12 tháng tự sinh từ `bestMonths` của các điểm đến.
- Thêm bài mới: thêm một phần tử vào `GUIDES` rồi chạy `npm run build`.

## Quán ăn, lưu trú & đặt chỗ (`assets/js/data/places.js`)

- Mỗi điểm đến có: 4 quán cụ thể (tên, món, địa chỉ, giá/người), 3 khu nên ở (homestay/khách sạn/resort/du thuyền, giá/đêm), cách đi tới, sân bay và ga tàu gần nhất. Chuỗi viết dạng `[tiếng Việt, English]`.
- Trang điểm đến: mục **Quán nên ghé** (bấm địa chỉ mở Google Maps) và mục **Lưu trú & đi lại** với nút Booking.com / Airbnb / Google Maps, vé máy bay (Google Flights), vé tàu (dsvn.vn), vé xe (Vexere).
- Trang kế hoạch: chọn **ngày khởi hành** → mỗi ngày có ngày cụ thể, bữa trưa/tối ở quán cụ thể, chỗ nghỉ gợi ý theo mức chi tiêu; mục **Cần đặt trước** liệt kê vé từng chặng + phòng từng điểm với link đã điền sẵn ngày nhận/trả phòng, có ô đánh dấu "đã đặt" (lưu trên trình duyệt).
- Dữ liệu mang tính tham khảo – nên cập nhật khi quán đổi địa chỉ/giá. Không dùng link tiếp thị liên kết.

## In / lưu PDF & chia sẻ

- CSS `@media print` ở cuối `vietnam.css`: bỏ menu, bản đồ, nút bấm; luôn nền sáng; mỗi ngày/điểm dừng không bị cắt ngang trang; ghi kèm địa chỉ trang (`.print-url`).
- Trang điểm đến: nút **In / PDF** ở lịch trình chỉ in tour đang chọn (đủ các ngày + chi phí); nút **Chia sẻ** dùng bảng chia sẻ của điện thoại hoặc sao chép liên kết `#itinerary`. In cả trang (Ctrl+P) vẫn gọn.
- Trang kế hoạch: bản in gồm trang tóm tắt tuyến/chi phí và lịch từng ngày; nút **Sao chép dạng chữ** tạo lịch trình để dán vào Zalo/Messenger.

## Hiệu năng (Lighthouse)

- Ảnh bìa được ghi sẵn `src/srcset` + `fetchpriority="high"` lúc build (thuộc tính `data-priority`), các ảnh khác tải lười.
- Leaflet chỉ được tải khi mở bản đồ (`loadLeaflet()` trong `map.js`); font Google và Remix Icon tải không chặn hiển thị; toàn bộ script dùng `defer`.
- `data-sizes` trên thẻ ảnh cho biết kích thước hiển thị thực để trình duyệt chọn file WebP vừa đủ.

## Test tự động

```bash
npm install
npx playwright install chromium   # lần đầu
npm test                          # = npm run test:data && npm run test:e2e
```

- `tests/data.test.js`: dữ liệu điểm đến, lịch trình 3/4/5 ngày, bản dịch tiếng Anh, manifest ảnh, trang tĩnh & sitemap, liên kết nội bộ.
- `tests/e2e.test.js` (Playwright + Chromium): mọi trang không lỗi JS, tìm kiếm/lọc/yêu thích, chọn tour & ngày, chọn tháng, lightbox, chuyển ngôn ngữ, giao diện điện thoại. Tài nguyên ngoài (Wikimedia, Open-Meteo, bản đồ, giscus) được giả lập nên test chạy ổn định.
- Workflow `.github/workflows/test.yml` chạy toàn bộ cho mỗi pull request và mỗi lần đẩy lên `main`, đồng thời báo lỗi nếu quên `npm run build` sau khi sửa dữ liệu.

## Thêm điểm đến mới
Thêm một object vào mảng `DESTINATIONS` (mã `id`, tên, vùng, mô tả, ảnh, món ăn, hoạt động...)
rồi chạy `npm run build`.

Ảnh chỉ cần khai báo **tên file trên Wikimedia Commons**; trang sẽ tự tải bản độ phân giải cao
qua `Special:FilePath`, và mỗi ảnh trong lightbox có liên kết về trang bản quyền gốc.

## Tìm kiếm
- Gõ **không dấu** (`pho`) để tìm rộng, gõ **có dấu** (`phở`) để tìm chính xác.
- Tìm theo tên, tỉnh thành, điểm nhấn, món ăn, hoạt động; kết quả xếp theo độ liên quan
  và hiển thị lý do khớp (ví dụ *Món ăn: Phở Hà Nội*).

## Ảnh dự phòng
- Ảnh bìa lỗi → tự động thử lần lượt các ảnh trong gallery.
- Ảnh gallery lỗi → tự ẩn khỏi lưới và lightbox.
- Món ăn chưa có ảnh hoặc ảnh lỗi → hiện thẻ chữ kiểu thực đơn. Món dùng ảnh liên quan
  (chợ, nồi lẩu...) được gắn nhãn *Ảnh minh họa*.

## Kiểm tra ảnh
Chạy trên máy có Internet (Node.js 18+):

```bash
node tools/check-images.js
```

Script liệt kê ảnh không tồn tại trên Wikimedia Commons và ảnh có độ phân giải thấp.

## Nguồn ảnh
Ảnh các địa danh và món ăn lấy từ [Wikimedia Commons](https://commons.wikimedia.org/) theo giấy phép
Creative Commons (CC BY / CC BY-SA); thông tin tác giả xem tại trang của từng file.
