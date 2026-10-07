/*==================== CẤU HÌNH SITE ====================*/
const SITE_CONFIG = {
    /*
     * Địa chỉ nhận email đăng ký nhận tin.
     * Tạo form miễn phí tại https://formspree.io → dán URL dạng "https://formspree.io/f/xxxxxxx" vào đây.
     * Để trống: form hiển thị thông báo "sắp ra mắt" thay vì gửi đi.
     */
    newsletterEndpoint: '',

    /*
     * Nơi nhận báo cáo "Báo sai thông tin" (form trên trang). Có thể dùng một form Formspree khác.
     * Để trống: form mở GitHub Issue đã điền sẵn nội dung người dùng nhập (cần tài khoản GitHub).
     */
    reportEndpoint: '',

    /*
     * Trợ lý hỏi đáp (Claude) – URL Cloudflare Worker trong thư mục worker/ (xem worker/README.md).
     * Để trống: không hiện nút "Hỏi Việt Travel".
     */
    assistantEndpoint: '',

    /*
     * Bình luận qua Giscus (lưu trong GitHub Discussions của repo).
     * 1. Bật Discussions cho repo và cài app https://github.com/apps/giscus
     * 2. Vào https://giscus.app, nhập repo → copy data-repo-id, data-category, data-category-id vào đây.
     * Để trống repoId/categoryId: mục bình luận được ẩn.
     */
    giscus: {
        repo: 'TanTan1802/travel',
        repoId: '',
        category: 'Announcements',
        categoryId: '',
    },
}

const giscusEnabled = () => {
    const g = typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.giscus
    return Boolean(g && g.repo && g.repoId && g.category && g.categoryId)
}
