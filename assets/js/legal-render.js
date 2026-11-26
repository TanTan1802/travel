/*==================== CHÍNH SÁCH BẢO MẬT: chinh-sach-bao-mat/ ====================*/
/*
 * Chỉ dùng khi build (tools/build.js). Nội dung sinh theo cấu hình THẬT của site lúc build: tính năng nào chưa bật
 * (form nhận tin, trợ lý hỏi đáp, bình luận, đo lượt xem) thì không có đoạn tương ứng – trang luôn đúng với site.
 * Chuỗi hai ngôn ngữ [tiếng Việt, English]; ko / zh / ja hiện tiếng Anh.
 */
const PRIVACY_DIR = 'chinh-sach-bao-mat'
const PRIVACY_UPDATED = '2026-11'
const privacyUrl = () => `${SITE_ROOT}${LANG_PREFIX}${PRIVACY_DIR}/index.html`

function privacyTitle() {
    return t('Chính sách bảo mật')
}

/* opts.analytics: build có chèn Cloudflare Web Analytics hay không (WEB_ANALYTICS_TOKEN) */
function privacySections({ analytics }) {
    const cfg = typeof SITE_CONFIG !== 'undefined' ? SITE_CONFIG : {}
    const issues = `https://github.com/${(cfg.giscus && cfg.giscus.repo) || 'TanTan1802/travel'}/issues`
    const P = (vi, en) => [vi, en]
    const sections = [
        [P('Tóm tắt', 'Summary'), [
            P('Việt Travel không có tài khoản người dùng, không dùng cookie quảng cáo, không bán hay chia sẻ dữ liệu của bạn.', 'Viet Travel has no user accounts, uses no advertising cookies and never sells or shares your data.'),
            P('Phần lớn tính năng (yêu thích, kế hoạch chuyến đi, danh sách đồ) chạy ngay trên trình duyệt của bạn và chỉ lưu trên máy bạn.', 'Most features (favourites, trip plans, packing lists) run in your browser and are stored only on your device.'),
        ]],
        [P('Dữ liệu lưu trên máy bạn', 'Data stored on your device'), [
            P('Bộ nhớ của trình duyệt (localStorage) giữ: điểm đến yêu thích, kế hoạch chuyến đi, giao diện sáng / tối, món đồ đã đánh dấu chuẩn bị, lịch đã lưu để xem khi không có mạng.', 'Your browser’s storage (localStorage) keeps: favourite destinations, trip plans, light / dark theme, ticked packing items and itineraries saved for offline use.'),
            P('Bộ nhớ đệm (service worker) lưu sẵn một số trang để site mở được khi mất mạng; dự báo thời tiết được nhớ tạm trong phiên.', 'A cache (service worker) keeps some pages so the site works offline; weather forecasts are remembered for the session.'),
            P('Những dữ liệu này không được gửi về máy chủ. Muốn xóa: vào cài đặt trình duyệt → xóa dữ liệu trang web của site này.', 'None of this is sent to a server. To delete it, clear this site’s data in your browser settings.'),
        ]],
        ...(analytics ? [[P('Đo lượt xem', 'Visitor statistics'), [
            P('Site dùng Cloudflare Web Analytics để đếm lượt xem: trang được xem, trang dẫn tới, quốc gia, loại thiết bị và trình duyệt – ở dạng tổng hợp.', 'The site uses Cloudflare Web Analytics to count visits: pages viewed, referring site, country, device and browser type – in aggregate.'),
            P('Công cụ này không dùng cookie, không lưu dấu vân tay trình duyệt và không theo dõi bạn qua các site khác.', 'It sets no cookies, does no browser fingerprinting and does not track you across other sites.'),
        ]]] : []),
        [P('Vị trí của bạn', 'Your location'), [
            P('Nút "Gần tôi" xin quyền vị trí để xếp điểm đến theo khoảng cách. Việc tính toán diễn ra trên máy bạn; vị trí không được gửi đi hay lưu lại. Bạn có thể từ chối mà vẫn dùng site bình thường.', 'The "Near me" button asks for your location to sort destinations by distance. The calculation happens on your device; your location is never sent or stored. You can decline and still use the site.'),
        ]],
        [P('Dịch vụ bên ngoài', 'Third-party services'), [
            P('Khi bạn mở trang có các phần sau, trình duyệt kết nối trực tiếp tới dịch vụ đó (họ thấy địa chỉ IP như với mọi trang web): Open-Meteo (thời tiết – gửi tọa độ của điểm đến, không phải của bạn), OpenStreetMap và cdnjs (bản đồ), Wikimedia Commons (một số ảnh).', 'When a page uses these, your browser connects to the service directly (they see your IP address, as with any website): Open-Meteo (weather – sends the destination’s coordinates, not yours), OpenStreetMap and cdnjs (maps), Wikimedia Commons (some photos).'),
            P('Các nút Booking.com, Airbnb, Klook, Google Maps, Google Calendar, Vexere chỉ mở trang của họ; từ đó áp dụng chính sách của chính họ.', 'Buttons for Booking.com, Airbnb, Klook, Google Maps, Google Calendar and Vexere just open their sites; their own policies apply from there.'),
        ]],
        ...(typeof affiliateActive === 'function' && affiliateActive() ? [[P('Link giới thiệu (affiliate)', 'Affiliate links'), [
            P('Một số link đặt phòng, đặt vé có mã giới thiệu. Khi bạn đặt qua link đó, đối tác biết bạn đến từ Việt Travel (thường qua cookie của chính họ) và Việt Travel có thể nhận hoa hồng; giá bạn trả không đổi.', 'Some booking and ticket links carry a referral code. If you book through one, the partner knows you came from Viet Travel (usually via its own cookie) and Viet Travel may earn a commission; the price you pay is the same.'),
        ]]] : []),
        [P('Thông tin bạn gửi cho chúng tôi', 'Information you send us'), [
            cfg.reportEndpoint
                ? P('Form "Báo sai thông tin" gửi nội dung bạn nhập qua Formspree tới người quản lý site; chỉ dùng để sửa dữ liệu.', 'The "Report an error" form sends what you type via Formspree to the site owner; it is used only to fix the data.')
                : P('"Báo sai thông tin" mở một GitHub Issue đã điền sẵn – nội dung và tài khoản GitHub của bạn sẽ công khai trên GitHub.', '"Report an error" opens a pre-filled GitHub Issue – its content and your GitHub account are public on GitHub.'),
            P('Gửi ảnh cho mục Cộng đồng cũng qua GitHub Issue công khai; ảnh được duyệt mới đăng, đã xóa thông tin vị trí (EXIF / GPS) và ghi tên tác giả như bạn yêu cầu.', 'Community photos are also submitted through a public GitHub Issue; they are published only after review, with location data (EXIF / GPS) removed and credited as you ask.'),
            ...(cfg.newsletterEndpoint ? [P('Email đăng ký nhận tin được lưu qua Formspree, chỉ dùng để gửi thư của Việt Travel; mỗi thư có cách hủy đăng ký.', 'Newsletter emails are stored via Formspree and used only for Viet Travel mail; every message lets you unsubscribe.')] : []),
            ...(cfg.assistantEndpoint ? [P('Câu hỏi gửi cho trợ lý "Hỏi Việt Travel" được chuyển tới Claude API (Anthropic) để soạn câu trả lời; không kèm tên hay tài khoản của bạn – đừng nhập thông tin cá nhân vào câu hỏi.', 'Questions to the "Ask Viet Travel" assistant are sent to the Claude API (Anthropic) to write the answer, without your name or account – please do not put personal details in questions.')] : []),
            ...(typeof giscusEnabled === 'function' && giscusEnabled() ? [P('Bình luận dùng Giscus và được lưu công khai trong GitHub Discussions dưới tài khoản GitHub của bạn.', 'Comments use Giscus and are stored publicly in GitHub Discussions under your GitHub account.')] : []),
        ]],
        [P('Liên hệ, yêu cầu xóa', 'Contact and deletion requests'), [
            P(`Muốn hỏi hoặc yêu cầu xóa nội dung bạn đã gửi, mở một Issue tại ${issues}.`, `For questions or to have something you sent removed, open an Issue at ${issues}.`),
        ]],
    ]
    return sections
}

function privacyPage(opts = {}) {
    const sections = privacySections(opts)
    const link = text => text.replace(/(https:\/\/github\.com\/\S+?\/issues)/, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    return `
        <section class="planner-hero guide-hero">
            <div class="container">
                ${breadcrumbHtml([[t('Trang chủ'), homeUrl()]])}
                <span class="guide-hero__icon"><i class="ri-shield-check-line"></i></span>
                <h1 class="planner-hero__title">${privacyTitle()}</h1>
                <p class="guide-hero__updated">${t('Cập nhật: tháng {date}', { date: `${PRIVACY_UPDATED.slice(5)}/${PRIVACY_UPDATED.slice(0, 4)}` })}</p>
            </div>
        </section>
        <div class="guide container">
            <article class="guide__body">
                ${sections.map(([title, items]) => `
                    <section class="guide-section">
                        <h2 class="guide-section__title">${pickLang(title)}</h2>
                        <ul class="guide-section__list">${items.map(x => `<li>${link(pickLang(x))}</li>`).join('')}</ul>
                    </section>
                `).join('')}
            </article>
        </div>
    `
}
