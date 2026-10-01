# travel
link: https://tantan1802.github.io/travel/

Website du lịch khám phá danh lam thắng cảnh Việt Nam.

## Tính năng
- **Trang chủ** (mẫu `home.html` → build ra `index.html`): 28 danh lam thắng cảnh trên cả 3 miền, tìm kiếm thông minh,
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
| `data/*.json` + `data/schema/` | **Nguồn dữ liệu** (điểm đến, lịch trình, quán, điểm tham quan, lễ hội) có JSON Schema – xem [docs/du-lieu.md](docs/du-lieu.md) |
| `assets/js/data/destinations.js`, `itineraries.js`, `places.js`, `sights.js`, `events.js` | Sinh tự động từ `data/*.json` khi build – **không sửa tay** |
| `assets/js/core.js` | Hàm dùng chung (ảnh, điểm đến, tra cứu lễ hội) |
| `destination.html` | Mẫu giao diện trang chi tiết (cũng chạy động với `?id=`) |
| `home.html`, `destination.html`, `planner.html`, `guide.html` | Mẫu giao diện (sửa ở đây) |
| `index.html`, `diem-den/<id>/index.html`, `en/`, `ke-hoach/`, `cam-nang/` | Trang tĩnh sinh tự động (vi + en) – **không sửa tay** |
| `assets/js/dist/<hash>.js` | Script mỗi trang đã gộp + nén (esbuild) khi build – **không sửa tay** |
| `tools/` | Script build, tải ảnh, kiểm tra ảnh |

Sau khi sửa dữ liệu hoặc `destination.html`:

```bash
npm run check-data     # kiểm tra data/*.json theo JSON Schema
npm run build          # kiểm tra dữ liệu, sinh assets/js/data/*.js, trang tĩnh, bundle JS, sitemap.xml
```

Cập nhật giá vé, giờ mở cửa, giá quán bằng **Google Sheets**: workflow `Đồng bộ Google Sheets` đọc bảng tính
và mở Pull Request – hướng dẫn thiết lập ở [docs/du-lieu.md](docs/du-lieu.md).

Tự host ảnh (khuyên dùng, chạy trên máy có Internet):

```bash
npm run images         # tải ảnh về assets/img/wiki + sinh local-images.js
npm run build
```

Mỗi trang điểm đến có thẻ Open Graph (hiện ảnh xem trước khi chia sẻ Facebook/Zalo),
dữ liệu có cấu trúc schema.org `TouristDestination` và được liệt kê trong `sitemap.xml`.

## Song ngữ
- Chuỗi giao diện trong JS dùng `t('Câu tiếng Việt')`; bản dịch nằm trong `assets/js/data/en.js`
  (`ui`, `html`, `destinations`, `itineraries`).
- Lịch trình nằm trong `data/itineraries.json`: mỗi điểm đến có 5 ngày nối tiếp, tour 3/4/5 ngày
  lấy lần lượt 3/4/5 ngày đầu; `fees` là vé tham quan & trải nghiệm mỗi ngày [tiết kiệm, thoải mái].
- Chi phí tour tính theo từng khoản bằng `tripCost()` (components.js): lưu trú (phòng đôi chia 2, từ `places.js`), ăn uống (từ giá các quán), đi lại tại chỗ và vé tham quan. Mức thoải mái = khách sạn 3–4 sao, nhà hàng, Grab (≈ 1,7–1,9 lần mức tiết kiệm). Bấm vào mỗi mức để xem bảng chi tiết.
- Khi thêm điểm đến mới, thêm bản dịch tương ứng vào `en.js` rồi chạy `npm run build`
  (các trường chưa dịch sẽ hiển thị tiếng Việt).

## Cài như ứng dụng (PWA)
Website có thể cài lên màn hình chính điện thoại/máy tính và xem lại các trang đã mở khi mất mạng
(hữu ích khi lên vùng cao). Service worker (`sw.js`) được `npm run build` tự cập nhật phiên bản.

## Dữ liệu luôn mới

- Trường `updated` (tháng cập nhật) cho từng điểm tham quan / quán, hiện trên trang; đồng bộ Google Sheets tự ghi khi sửa
  hoặc khi đánh dấu "đã kiểm tra" (cột `confirmed`).
- `npm run check-freshness`, `npm run check-links`, `npm run check-images` + workflow **Kiểm tra định kỳ dữ liệu** hằng tháng.
- Form **"Báo sai"** ngay trên trang (`assets/js/report.js`): gửi tới `reportEndpoint` trong `config.js`, chưa cấu hình thì
  mở GitHub Issue điền sẵn. Chi tiết: [docs/du-lieu.md](docs/du-lieu.md#độ-mới-của-dữ-liệu).

## Cộng đồng: ảnh người đọc & bình luận

- Mỗi trang điểm đến có mục **Cộng đồng**: ảnh người đọc gửi (đã duyệt, ghi tên tác giả + giấy phép CC) và nút
  **Gửi ảnh của bạn** → form GitHub (`.github/ISSUE_TEMPLATE/gui-anh.yml`, điền sẵn điểm đến, cam kết là tác giả).
- Duyệt ảnh: `npm run add-photo -- --dest hoi-an --src <URL ảnh trong Issue> --author "Tên" --caption "..." --caption-en "..." --issue <link>`
  → tạo WebP 480/960/1920 trong `assets/img/community/` (đã **xóa EXIF/GPS**), thêm vào `data/community-photos.json`; rồi `npm run build`.
- Bình luận + **đánh giá bằng cảm xúc (reactions)** qua Giscus: xem mục Bình luận bên dưới để bật.

## Trợ lý hỏi đáp (Claude)

- Nút **"Hỏi Việt Travel"** (`assets/js/assistant.js`) mở khung chat; câu hỏi gửi tới Cloudflare Worker trong `worker/`,
  Worker gọi Claude kèm dữ liệu site (`worker/src/knowledge.js`, sinh khi `npm run build`, dùng prompt caching).
- Ẩn cho tới khi đặt `assistantEndpoint` trong `config.js`. Triển khai, chi phí, an toàn: [worker/README.md](worker/README.md).

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

## Timeline theo giờ

- `dayTimeline()` (components.js) ghép buổi sáng/chiều/tối của `ITINERARIES` với quán ăn và quán cà phê/quán nước trong `places.js` thành lịch theo giờ: 06:30 ăn sáng → 07:30 tham quan → 11:30 ăn trưa → 13:00 cà phê → 14:30 tham quan → 16:30 quán nước/ăn vặt → 18:00 ăn tối → 19:30 buổi tối → 21:30 cà phê đêm. Mỗi quán/món chỉ dùng một lần trong cả chuyến (phân bổ lần lượt từ ngày đầu, nên tour 3 ngày là 3 ngày đầu của tour 5 ngày); bỏ qua món đã nhắc trong phần tham quan và không chèn bữa khi lịch tham quan đã có bữa đó. Hết quán có tên → món đặc sản → gợi ý chung luân phiên.
- Dùng chung cho trang điểm đến (từng tab ngày), trang kế hoạch (kể cả ngày di chuyển) và bản "Sao chép dạng chữ".

## Lập kế hoạch chuyến đi (`ke-hoach/`)

- Mẫu `planner.html` → build ra `ke-hoach/index.html` và `en/ke-hoach/index.html`; logic ở `assets/js/planner.js`.
- Ghép tối đa 10 điểm đến, mỗi nơi 1–7 ngày; nút "Sắp xếp tuyến ngắn nhất" (láng giềng gần nhất + 2-opt, giữ điểm xuất phát).
- Quãng đường + thời gian đường bộ **thật** từ bảng OSRM (`data/routes.json`, tạo bằng `node tools/build-routes.js` hoặc workflow
  **Cập nhật quãng đường**; chưa có bảng thì ước tính đường chim bay × 1,3), phương tiện (xe khách/ô tô hoặc máy bay khi xa trên 450 km hay ra đảo) và chi phí/người (tổng `tripCost()` từng điểm dừng + di chuyển giữa các điểm, có bảng "Xem chi tiết chi phí"). Hằng số ở đầu `planner.js`.
- Lịch trình từng ngày gộp từ `ITINERARIES`, có ghi chú ngày di chuyển; cảnh báo điểm đến ngoài mùa đẹp theo tháng khởi hành.
- Kế hoạch lưu trong trình duyệt (`TripPlan` ở `favorites.js`) và chia sẻ qua URL: `ke-hoach/index.html?p=hue.2,hoi-an.3&m=3&b=c`.
- Trang điểm đến có nút "Thêm vào kế hoạch chuyến đi" dưới phần lịch trình.

## Cẩm nang du lịch (`cam-nang/`)

- Nội dung ở `assets/js/data/guides.js` (6 bài song ngữ: thời điểm đẹp, di chuyển, chi phí, ẩm thực, visa/giấy tờ, an toàn & liên lạc); hàm render ở `assets/js/guide-render.js`.
- Build sinh `cam-nang/index.html`, `cam-nang/<slug>/index.html` và bản `en/` từ mẫu `guide.html` (nội dung render sẵn – tốt cho SEO), thêm vào sitemap; trang chủ có mục "Cẩm nang" (3 bài đầu).
- Bài "Nên đi du lịch Việt Nam vào tháng nào?" có bảng 12 tháng tự sinh từ `bestMonths` của các điểm đến.
- Thêm bài mới: thêm một phần tử vào `GUIDES` rồi chạy `npm run build`.

## Trang khám phá (SEO) – `assets/js/seo-render.js`

Sinh tự động khi build từ dữ liệu sẵn có (vi + en, có trong sitemap, canonical/hreflang, Open Graph, JSON-LD `ItemList` +
`BreadcrumbList`):

| Đường dẫn | Nội dung |
|---|---|
| `diem-den/<id>/gia-ve/` | Bảng **giá vé & giờ mở cửa** mọi điểm tham quan của điểm đến, xếp theo ngày lịch trình; mỗi điểm có anchor riêng (`#hang-sung-sot`) và dữ liệu `TouristAttraction`. Trang điểm đến có liên kết tới đây. |
| `thang/<1–12>/` | **Tháng N nên đi đâu**: điểm đến đúng mùa theo miền, lễ hội & lưu ý thời tiết của tháng. Nút "Tháng nào đi đâu?" ở trang chủ trỏ tới tháng hiện tại; bảng 12 tháng trong cẩm nang có liên kết. |
| `chu-de/<loại hình \| miền>/` | Điểm đến theo **chủ đề** (biển đảo, núi rừng, di sản, thành phố, hang động) và theo **miền**. |

- Một trang cho mỗi điểm đến thay vì mỗi điểm tham quan một trang: mỗi điểm chỉ có vài dòng (giá, giờ, địa chỉ) nên gộp lại
  thành trang đầy đủ tốt hơn cho SEO (tránh "nội dung mỏng"), vẫn tìm được từng điểm qua anchor.
- Lời giới thiệu theo tháng/chủ đề ở `MONTH_NOTES`, `THEME_INTROS` (song ngữ). Trang cẩm nang có khối "Khám phá theo tháng & chủ đề".

## Quán ăn, lưu trú & đặt chỗ (`data/places.json`)

- Mỗi điểm đến có: 8 quán cụ thể (tên, món, địa chỉ, giá/người), 3 quán cà phê/quán nước (`cafes`), 3 khu nên ở (homestay/khách sạn/resort/du thuyền, giá/đêm), cách đi tới, sân bay và ga tàu gần nhất. Chuỗi viết dạng `[tiếng Việt, English]`.
- Trang điểm đến: mục **Quán nên ghé** (bấm địa chỉ mở Google Maps) và mục **Lưu trú & đi lại** với nút Booking.com / Airbnb / Google Maps, vé máy bay (Google Flights), vé tàu (dsvn.vn), vé xe (Vexere).
- Trang kế hoạch: chọn **ngày khởi hành** → mỗi ngày có ngày cụ thể, bữa trưa/tối ở quán cụ thể, chỗ nghỉ gợi ý theo mức chi tiêu; mục **Cần đặt trước** liệt kê vé từng chặng + phòng từng điểm với link đã điền sẵn ngày nhận/trả phòng, có ô đánh dấu "đã đặt" (lưu trên trình duyệt).
- Dữ liệu mang tính tham khảo – nên cập nhật khi quán đổi địa chỉ/giá. Không dùng link tiếp thị liên kết.

## In / lưu PDF & chia sẻ

- CSS `@media print` ở cuối `vietnam.css`: bỏ menu, bản đồ, nút bấm; luôn nền sáng; mỗi ngày/điểm dừng không bị cắt ngang trang; ghi kèm địa chỉ trang (`.print-url`).
- Trang điểm đến: nút **In / PDF** ở lịch trình chỉ in tour đang chọn (đủ các ngày + chi phí); nút **Chia sẻ** dùng bảng chia sẻ của điện thoại hoặc sao chép liên kết `#itinerary`. In cả trang (Ctrl+P) vẫn gọn.
- Trang kế hoạch: bản in gồm trang tóm tắt tuyến/chi phí và lịch từng ngày; nút **Sao chép dạng chữ** tạo lịch trình để dán vào Zalo/Messenger.

## Hiệu năng (Lighthouse)

- Ảnh bìa được ghi sẵn `src/srcset` + `fetchpriority="high"` lúc build (thuộc tính `data-priority`), các ảnh khác tải lười.
- Leaflet chỉ được tải khi mở bản đồ (`loadLeaflet()` trong `map.js`); toàn bộ script dùng `defer`.
- Font chữ **tự host** (`assets/css/fonts.css` + `assets/fonts/`): Open Sans 400/600, Raleway 500/600/700, chỉ bộ ký tự latin +
  tiếng Việt (`unicode-range`), giấy phép OFL. Trang không còn gọi Google Fonts/CDN nào ngoài Leaflet và API thời tiết.
- **Gộp & nén CSS**: các `<link rel="stylesheet">` trong `assets/css/` của trang tĩnh gộp thành `assets/css/site-<hash>.css` khi build.
- Icon Remix Icon **tự host, rút gọn** còn các icon đang dùng (`assets/css/icons.css` + `assets/fonts/remixicon.woff2`, ~18 KB thay vì ~235 KB từ CDN).
  Thêm icon mới → viết đủ tên class (`'ri-sun-line'`, không ghép chuỗi) rồi chạy `npm run icons`; `npm run test:data` báo lỗi nếu quên.
- `data-sizes` trên thẻ ảnh cho biết kích thước hiển thị thực để trình duyệt chọn file WebP vừa đủ.
- **Gộp & nén script**: mẫu HTML vẫn liệt kê từng file trong `assets/js/` (dễ sửa, trang động `destination.html?id=` dùng trực tiếp);
  khi build, mỗi chuỗi `<script defer>` liền nhau của trang tĩnh được nối đúng thứ tự và nén bằng esbuild thành
  `assets/js/dist/<hash>.js` (trang giống nhau dùng chung bundle). Bundle bỏ bảng dịch HTML tĩnh và bản dịch lịch trình
  khi trang không cần; `LOCAL_IMAGES` được ghi dạng gọn. Trang điểm đến lấy lịch trình riêng trong `data/dest/<id>.js`.
  Service worker tải sẵn bundle trang chủ (khối `build:core-scripts` trong `sw.js` do build ghi).
- Ảnh WebP 480/960/1920 tính theo **cạnh dài** (ảnh dọc không cao quá 1920px); `srcset` ghi chiều rộng thật của từng file.
- Lịch trình tour 3/4/5 ngày render **một lần** (tour ngắn = các ngày đầu của tour dài): ngày ngoài tour ẩn bằng
  `itinerary__panel--off`, mục cuối ngày có hai dạng "Về nghỉ"/"Kết thúc tour" (`data-end`) – xem `tourDaysHtml()` và `setTourLength()`.
- Hiệu ứng hiện dần khi cuộn dùng `IntersectionObserver` + CSS (`.reveal` trong `main.js`, không cần thư viện), chỉ áp dụng cho
  phần dưới màn hình đầu tiên và tắt khi bật "giảm chuyển động". Một listener cuộn duy nhất, gom theo `requestAnimationFrame`.
- Chế độ tối được gắn bằng script nội tuyến ngay sau `<body>` nên không nháy nền sáng khi tải trang.
- Service worker chỉ tải sẵn tài nguyên trang chủ + trang offline; ảnh địa danh lưu ở bộ nhớ `media` (giới hạn 250 file,
  không bị xóa khi đổi phiên bản), trang HTML giữ tối đa 80 trang.

## Lighthouse CI

- Workflow `Lighthouse` đo 5 trang tiêu biểu (trang chủ, điểm đến vi/en, kế hoạch, cẩm nang) cho mỗi pull request.
- Ngân sách trong `lighthouserc.json`: CLS ≤ 0,1; JS ≤ 140 KB, CSS ≤ 25 KB, font ≤ 170 KB (dung lượng truyền);
  điểm truy cập ≥ 90, SEO ≥ 95, best practices ≥ 90 → vượt là check đỏ. Điểm hiệu năng < 85 hoặc LCP > 3,5 s chỉ cảnh báo
  (dao động theo máy chạy).
- Chạy trên máy: `npx @lhci/cli@0.15.1 autorun` (cần Chrome; đặt `CHROME_PATH` nếu dùng Chromium khác). Báo cáo ở `.lighthouseci/`.

## Test tự động

```bash
npm install
npx playwright install chromium   # lần đầu
npm test                          # = npm run test:data && npm run test:e2e
```

- Dùng Chromium có sẵn trên máy: `CHROMIUM_PATH=/đường/dẫn/chrome npm run test:e2e`.
- Máy không ra được CDN: `LOCAL_CDN_DIR=<thư mục node_modules có leaflet@1.9.4>`.
- CI dùng `npm ci` (khóa phiên bản bằng `package-lock.json`) và lưu cache npm + Chromium.

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
