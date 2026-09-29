# travel
link: https://tantan1802.github.io/travel/

Website du lịch khám phá danh lam thắng cảnh Việt Nam.

## Tính năng
- **Trang chủ** (`index.html`): 23 danh lam thắng cảnh trên cả 3 miền, tìm kiếm thông minh,
  lọc theo vùng miền / loại hình / yêu thích, xem dạng **danh sách hoặc bản đồ**.
- **Landing page động** (`destination.html?id=<mã-điểm-đến>`): khi bấm vào một điểm đến, trang được
  tạo tự động từ dữ liệu, gồm ảnh bìa, thông tin nhanh, tổng quan, thư viện ảnh (có lightbox),
  ẩm thực, hoạt động vui chơi, kinh nghiệm du lịch và gợi ý điểm đến cùng vùng.
- **Lịch trình gợi ý** theo ngày (sáng / chiều / tối) kèm chi phí ước tính.
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
dữ liệu có cấu trúc schema.org `TouristDestination` và được liệt kê trong `sitemap.xml`.

## Song ngữ
- Chuỗi giao diện trong JS dùng `t('Câu tiếng Việt')`; bản dịch nằm trong `assets/js/data/en.js`
  (`ui`, `html`, `destinations`, `itineraries`).
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
