# travel
link: https://tantan1802.github.io/travel/

Website du lịch khám phá danh lam thắng cảnh Việt Nam.

## Tính năng
- **Trang chủ** (`index.html`): danh sách 17 danh lam thắng cảnh trên cả 3 miền, có ô tìm kiếm
  (không phân biệt dấu) và bộ lọc theo vùng miền / loại hình.
- **Landing page động** (`destination.html?id=<mã-điểm-đến>`): khi bấm vào một điểm đến, trang được
  tạo tự động từ dữ liệu, gồm ảnh bìa, thông tin nhanh, tổng quan, thư viện ảnh (có lightbox),
  ẩm thực, hoạt động vui chơi, kinh nghiệm du lịch và gợi ý điểm đến cùng vùng.

## Thêm điểm đến mới
Toàn bộ nội dung nằm trong `assets/js/data/destinations.js`. Thêm một object vào mảng `DESTINATIONS`
(mã `id`, tên, vùng, mô tả, ảnh, món ăn, hoạt động...) là trang chủ và trang chi tiết tự cập nhật.

Ảnh chỉ cần khai báo **tên file trên Wikimedia Commons**; trang sẽ tự tải bản độ phân giải cao
qua `Special:FilePath`, và mỗi ảnh trong lightbox có liên kết về trang bản quyền gốc.

## Nguồn ảnh
Ảnh các địa danh và món ăn lấy từ [Wikimedia Commons](https://commons.wikimedia.org/) theo giấy phép
Creative Commons (CC BY / CC BY-SA); thông tin tác giả xem tại trang của từng file.
