# travel
link: https://viet-travel.congtan5918.workers.dev/ (bản sao: https://tantan1802.github.io/travel/)

Website du lịch khám phá danh lam thắng cảnh Việt Nam.

## Tính năng
- **Trang chủ** (mẫu `home.html` → build ra `index.html`): 37 danh lam thắng cảnh trên cả 3 miền, tìm kiếm thông minh,
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
- **5 ngôn ngữ**: Việt (gốc), Anh `/en/`, Hàn `/ko/`, Trung giản thể `/zh/`, Nhật `/ja/` – menu chọn ngôn ngữ trên thanh menu.
- **Dữ liệu có cấu trúc (schema.org)**: trang điểm đến có `TouristDestination` + `BreadcrumbList` + `FAQPage` (mùa đẹp, số ngày, điểm nổi bật, cách đi), trang chủ có `WebSite`, bài cẩm nang có `Article` – để Google hiện kết quả nhiều thông tin.
- **Địa giới sau sáp nhập tỉnh (2025)**: tên tỉnh ghi theo đơn vị mới, kèm tên cũ trong ngoặc (vd. "Tuyên Quang (Hà Giang cũ)").

## Cấu trúc & quy trình
| Đường dẫn | Vai trò |
|---|---|
| `data/*.json` + `data/schema/` | **Nguồn dữ liệu** (điểm đến, lịch trình, quán, điểm tham quan, lễ hội) có JSON Schema – xem [docs/du-lieu.md](docs/du-lieu.md) |
| `assets/js/data/destinations.js`, `itineraries.js`, `places.js`, `sights.js`, `events.js` | Sinh tự động từ `data/*.json` khi build – **không sửa tay** |
| `assets/js/core.js` | Hàm dùng chung (ảnh, điểm đến, tra cứu lễ hội) |
| `destination.html` | Mẫu giao diện trang chi tiết (cũng chạy động với `?id=`) |
| `home.html`, `destination.html`, `planner.html`, `guide.html` | Mẫu giao diện (sửa ở đây) |
| `index.html`, `diem-den/<id>/index.html`, `en/`, `ko/`, `zh/`, `ja/`, `ke-hoach/`, `cam-nang/` | Trang tĩnh sinh tự động (5 ngôn ngữ) – **không sửa tay** |
| `data/i18n/<lang>.json` | Bản dịch tiếng Hàn / Trung / Nhật → sinh `assets/js/data/i18n/<lang>.js` |
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

## Đa ngôn ngữ
- Chuỗi giao diện trong JS dùng `t('Câu tiếng Việt')`; bản dịch nằm trong `data/i18n/en.json` (sinh ra `assets/js/data/en.js` khi build – không sửa tay file JS)
  (`ui`, `html`, `destinations`, `itineraries`).
- Lịch trình nằm trong `data/itineraries.json`: mỗi điểm đến có 5 ngày nối tiếp, tour 3/4/5 ngày
  lấy lần lượt 3/4/5 ngày đầu; `fees` là vé tham quan & trải nghiệm mỗi ngày [tiết kiệm, thoải mái].
- Chi phí tour tính theo từng khoản bằng `tripCost()` (components.js): lưu trú (phòng đôi chia 2, từ `places.js`), ăn uống (từ giá các quán), đi lại tại chỗ và vé tham quan. Mức thoải mái = khách sạn 3–4 sao, nhà hàng, Grab (≈ 1,7–1,9 lần mức tiết kiệm). Bấm vào mỗi mức để xem bảng chi tiết.
- Khi thêm điểm đến mới, thêm bản dịch tương ứng vào `data/i18n/en.json` rồi chạy `npm run build` (build báo lỗi nếu điểm đến / lịch trình thiếu bản tiếng Anh)
  (các trường chưa dịch sẽ hiển thị tiếng Việt).
- **Hàn / Trung / Nhật** (`data/i18n/ko.json`, `zh.json`, `ja.json`): khóa là chuỗi tiếng Việt gốc giống `en.json` –
  `ui`, `html`, `regions`, `categories`, `destinations` (tên, tỉnh, khẩu hiệu, mùa đẹp, số ngày, điểm nổi bật, mô tả, chú thích ảnh, món ăn, trải nghiệm, kinh nghiệm)
  và `itineraries` (tên từng ngày). Bản dịch được phủ lên bản tiếng Anh, nên phần chưa dịch
  (chi tiết lịch trình, quán ăn, điểm tham quan, bài cẩm nang…) hiện tiếng Anh. `npm run build` báo lỗi nếu khóa không còn trong `en.json`
  hoặc biến `{…}` không khớp.
- Thêm ngôn ngữ mới: tạo `data/i18n/<mã>.json`, khai báo trong `LANGS` (tools/build.js) và `SITE_LANGS` +
  tên tháng / thứ / định dạng ngày (assets/js/i18n.js, components.js, weather.js), rồi thêm thư mục `<mã>`
  vào danh sách kiểm tra build của workflow.

## Deploy lên Cloudflare
Site chính: **https://viet-travel.congtan5918.workers.dev/** (Cloudflare Workers, kết nối thẳng repo này).
GitHub Pages vẫn chạy song song nhưng canonical, hreflang, og:image và sitemap đều trỏ về địa chỉ Cloudflare
(một nguồn duy nhất: `SITE_URL` trong `tools/lib.js`), nên Google coi Cloudflare là bản chính.

**Cách đang dùng** – Cloudflare *Workers & Pages → viet-travel → Settings → Build*:
- Build command `node tools/dist.js`, Deploy command `npx wrangler deploy` (đọc `wrangler.jsonc`: tên `viet-travel`,
  thư mục `dist/`, trả `404.html` cho đường dẫn sai), Branch control = `main`.
- Mỗi lần main thay đổi Cloudflare tự build + deploy (xem log ở tab *Deployments*).
- `tools/dist.js` chép trang đã build + tài nguyên vào `dist/` (bỏ `tools/`, `data/`, `tests/`, `worker/`, `node_modules/`…),
  thêm `_headers` (cache dài cho file có hash) và `404.html`.

**Deploy từ máy** (cần Node 18+): `npx wrangler login` (một lần) rồi `npm run deploy:cf`.

**Đổi sang tên miền riêng**: gắn tên miền ở *Settings → Domains & Routes*, rồi sửa `SITE_URL` trong `tools/lib.js`,
chạy `npm run build` và thêm tên miền vào `ALLOWED_ORIGINS` của trợ lý. (Muốn thử nhanh mà chưa build lại:
biến build `SITE_URL=https://ten-mien.vn/` trên Cloudflare – `tools/dist.js` đổi địa chỉ trong `dist/`.)

Trợ lý hỏi đáp: `ALLOWED_ORIGINS` trong `worker/wrangler.toml` đã có địa chỉ Cloudflare và GitHub Pages.

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

- Món đặc sản đang dùng **ảnh minh họa** có liên kết "Có ảnh thật của món này?" mở cùng form gửi ảnh, điền sẵn mã điểm đến
  và tên món (tiêu đề `[Ảnh món] …`). Duyệt xong: tải ảnh lên Wikimedia Commons (hoặc thêm vào repo), đổi `file` của món trong
  `data/destinations.json` và bỏ `illustrative` (cả bản dịch ở `data/i18n/*.json`).

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
  **Cập nhật quãng đường**; chưa có bảng thì ước tính đường chim bay × 1,3) và chi phí/người (tổng `tripCost()` từng điểm dừng + di chuyển giữa các điểm, có bảng "Xem chi tiết chi phí").
- **Phương tiện từng chặng** (`transportOptions()` trong `components.js`): ✈ máy bay (hai sân bay khác nhau, cách ≥ 200 km),
  🚆 tàu hỏa (hai ga cùng tuyến – km lý trình, tốc độ, giá vé đ/km ở `transport.rail` trong `data/places.json`),
  🚌 xe khách / ô tô, ⛴ xe + tàu cao tốc ra đảo (cảng ở `transport.ports`: Phú Quốc, Côn Đảo, Lý Sơn, Cát Bà).
  Gợi ý mặc định: bay khi đường bộ ≥ 450 km (không có sân bay thì đi tàu), ra đảo bằng tàu nếu ≤ 4 giờ, còn lại xe khách;
  người dùng bấm để đổi phương tiện từng chặng (kể cả chặng đi / về từ Hà Nội, Đà Nẵng, Sài Gòn), lưu trong kế hoạch và URL (`&t=ha-noi.hue.t`).
  Trang điểm đến có bảng "Đi từ các thành phố lớn" với các phương án và giá. Thời gian, giá vé là ước tính tham khảo.
- **Bản đồ lộ trình**: mỗi chặng vẽ theo phương tiện đã chọn – máy bay (cung nét chấm), tàu hỏa (nét gạch), xe (nét liền),
  ra đảo (xe tới cảng + tàu); chặng đi / về từ điểm xuất phát vẽ nhạt hơn, rê chuột xem thời gian; chú giải dưới bản đồ.
- Lịch trình từng ngày gộp từ `ITINERARIES`, có ghi chú ngày di chuyển; cảnh báo điểm đến ngoài mùa đẹp theo tháng khởi hành.
- Kế hoạch lưu trong trình duyệt (`TripPlan` ở `favorites.js`) và chia sẻ qua URL: `ke-hoach/index.html?p=hue.2,hoi-an.3&m=3&b=c`.
- Trang điểm đến có nút "Thêm vào kế hoạch chuyến đi" dưới phần lịch trình.
- Gói JS của trang không chứa quán / điểm tham quan / lịch trình của cả 34 điểm đến: `planner.js` tải
  `assets/js/data/plan/<lang>/<id>.json` (một ngôn ngữ, lịch trình đã dịch – sinh khi build) của các điểm trong kế hoạch,
  và đưa chúng vào bản lưu offline.

## Giao diện sáng / tối
- Bấm nút mặt trăng / mặt trời trên menu; lựa chọn lưu trong trình duyệt (`selected-theme`).
- Màu chữ / icon nhấn dùng biến theo theme, đừng dùng thẳng màu nền nút cho chữ:
  `--first-color-text` (sáng: xanh thương hiệu, tối: cam) và `--accent-color-text` (sáng: cam đậm đủ tương phản trên nền trắng, tối: cam).
  `--first-color` / `--accent-color` chỉ dùng làm nền nút, viền, nền thẻ.
- Test e2e "chữ đủ tương phản với nền" đo tỷ lệ tương phản WCAG AA mọi đoạn chữ trên các trang chính ở cả hai theme (bỏ qua chữ đặt trên ảnh).

## Cẩm nang du lịch (`cam-nang/`)

- Nội dung ở `assets/js/data/guides.js` (6 bài song ngữ: thời điểm đẹp, di chuyển, chi phí, ẩm thực, visa/giấy tờ, an toàn & liên lạc); hàm render ở `assets/js/guide-render.js`.
- Build sinh `cam-nang/index.html`, `cam-nang/<slug>/index.html` và bản `en/` từ mẫu `guide.html` (nội dung render sẵn – tốt cho SEO), thêm vào sitemap; trang chủ có mục "Cẩm nang" (3 bài đầu).
- Bài "Nên đi du lịch Việt Nam vào tháng nào?" có bảng 12 tháng tự sinh từ `bestMonths` của các điểm đến.
- Thêm bài mới: thêm một phần tử vào `GUIDES` rồi chạy `npm run build`.

## Trang khám phá (SEO) – `assets/js/seo-render.js`

Sinh tự động khi build từ dữ liệu sẵn có (5 ngôn ngữ, có trong sitemap, canonical/hreflang, Open Graph, JSON-LD `ItemList` +
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

## Google Search Console / Bing
Chưa bật. Khi cần: Search Console → *Thêm tài sản* → *Tiền tố URL* → phương thức **Thẻ HTML**, chép giá trị `content="…"`
vào `SITE_VERIFICATION.google` trong `tools/lib.js` (Bing: `msvalidate.01` → `SITE_VERIFICATION.bing`), chạy `npm run build`
– thẻ meta được chèn vào trang chủ 5 ngôn ngữ. (Không dùng phương thức "Tệp HTML": Cloudflare chuyển hướng `/x.html` → `/x`.)
Sau khi xác minh: *Sơ đồ trang web* → gửi `sitemap.xml`.

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

- Workflow `Lighthouse` đo 8 trang tiêu biểu (trang chủ, điểm đến vi/en/ja, kế hoạch, cẩm nang, giá vé, theo tháng) cho mỗi pull request.
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
- Workflow `.github/workflows/test.yml` chạy toàn bộ cho mỗi pull request và mỗi lần đẩy lên `main`, đồng thời báo lỗi nếu quên `npm run build` sau khi sửa dữ liệu
  (PR từ trang quản trị – nhánh `admin/*` – được `admin-build.yml` tự build và kiểm tra).

## Trang quản trị dữ liệu (`/admin/`)
Sửa hoặc thêm điểm đến ngay trên trình duyệt, không cần cài gì: mở `https://viet-travel.congtan5918.workers.dev/admin/`.

- **Đăng nhập** bằng *fine-grained token* GitHub: [Generate new token](https://github.com/settings/personal-access-tokens/new)
  → *Repository access*: chỉ repo `travel` → *Permissions*: `Contents` và `Pull requests` = **Read and write**
  (thêm `Commit statuses` = Read-only để xem PR đã kiểm tra xong chưa).
  Token chỉ lưu trên trình duyệt đó và chỉ gửi tới `api.github.com`; không dán token vào chat, issue hay mã nguồn.
- **Tổng quan**: số điểm đến, điểm thiếu bản dịch, món dùng ảnh minh họa, quán / điểm quá 12 tháng chưa kiểm tra,
  mùa đang chạy + mùa sắp tới, PR đang chờ và danh sách "cần chú ý". **Điểm đến**: lưới ảnh hoặc bảng, tìm, lọc, sắp xếp.
- Trình sửa: số mục còn thiếu hiện ngay trên từng tab, danh sách dài thu gọn được, **tự lưu nháp** trên máy
  (đóng trang / chuyển trang không mất), `Ctrl + S` mở **xem lại thay đổi** (diff từng file) trước khi tạo PR.
- **Sửa**: danh sách 37 điểm đến (tìm theo tên/tỉnh) → các tab Thông tin chung, Ảnh (xem trước ảnh Wikimedia Commons),
  Ẩm thực & hoạt động, Lịch trình 5 ngày, Quán & lưu trú, Điểm tham quan, Bản dịch (en bắt buộc; ko/zh/ja tùy chọn).
  Trang kiểm tra trước các lỗi thường gặp (thiếu quán, thiếu ngày, bản dịch dở dang…).
- **Lưu thành Pull Request**: tạo nhánh `admin/<mã>-<thời gian>` chỉ đổi đúng các file `data/*.json` liên quan.
  Workflow `admin-build.yml` tự build lại trang, chạy toàn bộ test rồi commit phần đã build vào PR và báo trạng thái
  `Kiểm tra (admin)`; khi PR **Sẵn sàng đăng**, bấm **Đăng lên site** ngay trong trang quản trị (hoặc Merge trên GitHub) –
  Cloudflare tự deploy, `images.yml` tự tải ảnh mới.
- **Giao diện & mùa** (`#/site`, dữ liệu `data/site.json`): màu chủ đạo + màu nhấn (có bảng màu mẫu, xem trước sáng/tối,
  chặn màu không đủ tương phản WCAG AA), slogan / dòng chữ nhỏ / ảnh bìa trang chủ theo 5 ngôn ngữ, danh sách điểm đến nổi bật.
  Thêm **mùa / chiến dịch** (Tết, hè biển, lúa chín…): khoảng ngày `MM-DD` lặp hằng năm hoặc `YYYY-MM-DD` một lần;
  trong khoảng đó site tự đổi màu mọi trang, slogan, ảnh bìa, dải thông báo có liên kết và mục nổi bật –
  chọn theo ngày trên máy người xem nên không cần build lại. Xem thử bất kỳ mùa nào: `/?season=<mã>` (`?season=none` = mặc định).
- Mã nguồn: `admin/` (HTML/CSS/JS thuần, `robots.txt` chặn lập chỉ mục). Lễ hội, cẩm nang, cảng/ga tàu, chuỗi giao diện vẫn sửa trong repo.

## Thêm điểm đến mới
Cách nhanh: trang quản trị `/admin/` → **+ Thêm điểm đến**. Sửa tay: xem [docs/du-lieu.md](docs/du-lieu.md)
(dữ liệu ở `data/*.json`), rồi chạy `npm run build`.

Ảnh chỉ cần khai báo **tên file trên Wikimedia Commons**; trang sẽ tự tải bản độ phân giải cao
qua `Special:FilePath`, và mỗi ảnh trong lightbox có liên kết về trang bản quyền gốc.

Tìm ảnh: tab **Actions → "Tìm ảnh Wikimedia" → Run workflow**, nhập từ khóa ngăn cách bằng `|`
và tích **Ảnh xem trước** → bảng ứng viên (≥ 1200px, giấy phép tự do) ở Summary, kèm tấm ghép ảnh
có đánh số trên nhánh `image-previews` để chọn ảnh đúng nội dung trước khi khai báo.

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
