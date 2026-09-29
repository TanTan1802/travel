/*=============== LỊCH TRÌNH TOUR 3 – 4 – 5 NGÀY ===============*/
/*
 * Mỗi điểm đến có 5 ngày nối tiếp nhau:
 *   - Tour 3 ngày 2 đêm = ngày 1 → 3
 *   - Tour 4 ngày 3 đêm = ngày 1 → 4
 *   - Tour 5 ngày 4 đêm = ngày 1 → 5
 * Ngày cuối của mỗi tour tự động có ghi chú trả phòng / di chuyển về.
 * fees: vé tham quan & trải nghiệm trung bình mỗi ngày cho 1 người (VND) [tiết kiệm, thoải mái].
 *   Các khoản còn lại (lưu trú, ăn uống, đi lại) tính từ dữ liệu places.js – xem tripCost() trong components.js.
 */
const TOUR_LENGTHS = [3, 4, 5]

const ITINERARIES = {
    'vinh-ha-long': {
        days: [
            { title: 'Lên du thuyền, khám phá vịnh', morning: 'Di chuyển từ Hà Nội theo cao tốc (khoảng 2,5 giờ), lên du thuyền tại cảng Tuần Châu.', afternoon: 'Thăm hang Sửng Sốt, chèo kayak quanh hang Luồn.', evening: 'Ngắm hoàng hôn trên boong, ăn tối hải sản và câu mực đêm.' },
            { title: 'Ti Tốp và làng chài', morning: 'Tập thái cực quyền đón bình minh, leo đỉnh Ti Tốp ngắm toàn cảnh.', afternoon: 'Thăm làng chài Cửa Vạn, trả phòng du thuyền về cảng.', evening: 'Dạo Sun World Hạ Long, đi vòng quay Mặt Trời, ngủ tại Bãi Cháy.' },
            { title: 'Bảo tàng và chợ hải sản', morning: 'Bảo tàng Quảng Ninh kiến trúc "khối đen" độc đáo, cung văn hóa thiếu nhi.', afternoon: 'Đi cáp treo Nữ Hoàng lên đồi Ba Đèo ngắm vịnh từ trên cao.', evening: 'Mua chả mực, sá sùng tại chợ Hạ Long 1.' },
            { title: 'Vịnh Lan Hạ – Cát Bà', morning: 'Đi tàu sang đảo Cát Bà, chèo kayak vịnh Lan Hạ.', afternoon: 'Tắm biển bãi Ba Trái Đào, thăm làng chài Cái Bèo.', evening: 'Ngủ thị trấn Cát Bà, ăn hải sản bè nổi.' },
            { title: 'Yên Tử linh thiêng', morning: 'Về Uông Bí, đi cáp treo lên chùa Đồng – đỉnh Yên Tử.', afternoon: 'Thăm Thiền viện Trúc Lâm Yên Tử, làng Nủ.', evening: 'Thưởng thức bánh gio, măng mai Yên Tử.' },
        ],
        fees: [280000, 390000],
    },
    'sa-pa': {
        days: [
            { title: 'Thị trấn trong sương', morning: 'Đến Sa Pa bằng xe giường nằm, nhận phòng, ăn sáng phở gà.', afternoon: 'Đi bộ xuống bản Cát Cát, xem thác Tiên Sa và nhà người H\'Mông.', evening: 'Dạo nhà thờ đá, chợ đêm, thưởng thức đồ nướng và rượu táo mèo.' },
            { title: 'Chinh phục Fansipan', morning: 'Đi cáp treo lên đỉnh Fansipan 3.143m, săn mây và viếng quần thể tâm linh.', afternoon: 'Ngắm đèo Ô Quy Hồ, thác Bạc và cổng trời.', evening: 'Thử lẩu cá hồi, ngâm lá thuốc người Dao đỏ.' },
            { title: 'Trekking Mường Hoa', morning: 'Trekking Lao Chải – Tả Van giữa ruộng bậc thang.', afternoon: 'Ăn trưa tại homestay, mua thổ cẩm ở Tả Van.', evening: 'Ngủ homestay người Dao, thưởng thức cơm lam, thịt lợn cắp nách.' },
            { title: 'Bản Tả Phìn', morning: 'Thăm bản Tả Phìn của người Dao đỏ, hang Tả Phìn.', afternoon: 'Tìm hiểu nghề thêu thổ cẩm, tắm lá thuốc.', evening: 'Về thị trấn, cà phê ngắm Sa Pa lên đèn.' },
            { title: 'Chợ phiên Bắc Hà', morning: 'Đi chợ phiên Bắc Hà (sáng Chủ nhật) – chợ vùng cao sặc sỡ nhất Tây Bắc.', afternoon: 'Thăm dinh Hoàng A Tưởng, vườn mận Bắc Hà.', evening: 'Thử thắng cố, rượu ngô Bản Phố.' },
        ],
        fees: [250000, 350000],
    },
    'ha-noi': {
        days: [
            { title: 'Hà Nội nghìn năm', morning: 'Viếng Lăng Bác, Chùa Một Cột, Văn Miếu – Quốc Tử Giám.', afternoon: 'Dạo hồ Hoàn Kiếm, đền Ngọc Sơn, uống cà phê trứng nhìn ra hồ.', evening: 'Xem múa rối nước, food tour phố cổ Tạ Hiện.' },
            { title: 'Phố cổ và Tây Hồ', morning: 'Ăn phở gia truyền, đạp xích lô 36 phố phường, chợ Đồng Xuân.', afternoon: 'Nhà tù Hỏa Lò, phố đường tàu, Nhà hát Lớn.', evening: 'Hoàng hôn Hồ Tây, ăn bánh tôm và dạo phố đi bộ cuối tuần.' },
            { title: 'Làng nghề ven đô', morning: 'Làng gốm Bát Tràng – tự tay nặn gốm.', afternoon: 'Bảo tàng Dân tộc học Việt Nam với nhà sàn, nhà rông các dân tộc.', evening: 'Ăn chả cá Lã Vọng, nghe nhạc trịnh ở quán cà phê phố cổ.' },
            { title: 'Chùa Hương', morning: 'Đi thuyền suối Yến giữa núi non, tới chùa Thiên Trù.', afternoon: 'Đi cáp treo lên động Hương Tích – "Nam thiên đệ nhất động".', evening: 'Về Hà Nội, ăn bún chả Hàng Mành.' },
            { title: 'Đường Lâm – Ba Vì', morning: 'Làng cổ Đường Lâm với cổng làng, nhà đá ong trăm năm.', afternoon: 'Vườn quốc gia Ba Vì, đền Thượng, rừng thông.', evening: 'Thưởng thức gà đồi, sữa chua Ba Vì.' },
        ],
        fees: [230000, 320000],
    },
    'ninh-binh': {
        days: [
            { title: 'Tràng An – Bái Đính', morning: 'Đi thuyền Tràng An qua các hang xuyên thủy (2–3 giờ).', afternoon: 'Viếng chùa Bái Đính, ăn trưa cơm cháy, dê núi.', evening: 'Nghỉ homestay Tam Cốc giữa cánh đồng.' },
            { title: 'Tam Cốc – Hang Múa', morning: 'Đạp xe đồng quê, đi thuyền Tam Cốc – Bích Động.', afternoon: 'Tham quan cố đô Hoa Lư, đền vua Đinh, vua Lê.', evening: 'Leo 500 bậc Hang Múa ngắm hoàng hôn.' },
            { title: 'Vân Long – đầm chim', morning: 'Đi thuyền khu bảo tồn Vân Long, ngắm voọc mông trắng.', afternoon: 'Thung Nham – vườn chim với hàng nghìn cò trắng về tổ.', evening: 'Ăn ốc núi, rau sắng Ninh Bình.' },
            { title: 'Nhà thờ Phát Diệm', morning: 'Nhà thờ đá Phát Diệm – kiến trúc Á Đông độc đáo.', afternoon: 'Tắm biển Kim Sơn hoặc thăm làng cói Kim Sơn.', evening: 'Về Tam Cốc, dạo phố đêm Tam Cốc.' },
            { title: 'Rừng Cúc Phương', morning: 'Vườn quốc gia Cúc Phương – trung tâm cứu hộ linh trưởng, cây chò nghìn năm.', afternoon: 'Động Người Xưa, hang Con Moong.', evening: 'Thưởng thức gỏi cá nhệch, cơm cháy chà bông.' },
        ],
        fees: [270000, 380000],
    },
    'ha-giang': {
        days: [
            { title: 'Hà Giang – Quản Bạ – Yên Minh', morning: 'Thuê xe máy hoặc easy rider, check-in cột mốc km0.', afternoon: 'Cổng trời Quản Bạ, núi đôi Cô Tiên, rừng thông Yên Minh.', evening: 'Nghỉ Yên Minh, ăn thắng cố hoặc lẩu gà đen.' },
            { title: 'Đồng Văn – Lũng Cú', morning: 'Dinh thự họ Vương, dốc Thẩm Mã.', afternoon: 'Lên cột cờ Lũng Cú – điểm cực Bắc Tổ quốc.', evening: 'Dạo phố cổ Đồng Văn, cà phê phố cổ.' },
            { title: 'Mã Pí Lèng – Nho Quế', morning: 'Vượt đèo Mã Pí Lèng, ngắm hẻm Tu Sản.', afternoon: 'Đi thuyền sông Nho Quế, rồi về Mèo Vạc.', evening: 'Tham gia chợ tình (nếu đúng dịp), nghỉ đêm Mèo Vạc.' },
            { title: 'Mèo Vạc – Du Già', morning: 'Đi cung Mèo Vạc – Du Già qua những con dốc hùng vĩ.', afternoon: 'Tắm suối Du Già, ăn trưa homestay.', evening: 'Ngủ homestay Du Già, đốt lửa trại cùng người Tày.' },
            { title: 'Hoàng Su Phì', morning: 'Sang Hoàng Su Phì ngắm ruộng bậc thang di sản quốc gia.', afternoon: 'Thăm bản Nậm Hồng, đồi chè shan tuyết cổ thụ.', evening: 'Về thành phố Hà Giang, ăn bánh cuốn trứng.' },
        ],
        fees: [500000, 700000],
    },
    'ban-gioc': {
        days: [
            { title: 'Thành phố Cao Bằng – Pác Bó', morning: 'Đến Cao Bằng, ăn sáng bánh cuốn canh.', afternoon: 'Khu di tích Pác Bó, suối Lê-nin, hang Cốc Bó.', evening: 'Thưởng thức vịt quay 7 vị, nghỉ tại thành phố.' },
            { title: 'Thác Bản Giốc', morning: 'Đi đèo Mã Phục đến thác Bản Giốc, đi bè tre sát chân thác.', afternoon: 'Chùa Phật tích Trúc Lâm, động Ngườm Ngao.', evening: 'Nghỉ homestay Trùng Khánh.' },
            { title: 'Hồ Thang Hen – Khau Cốc Chà', morning: 'Ngắm hồ Thang Hen và đèo Khau Cốc Chà "14 tầng".', afternoon: 'Làng rèn Phúc Sen, làng hương Phja Thắp.', evening: 'Mua hạt dẻ Trùng Khánh, ăn phở chua.' },
            { title: 'Núi Mắt Thần – Bảo Lạc', morning: 'Núi Mắt Thần (núi thủng) ở Quảng Uyên.', afternoon: 'Vượt đèo Mã Phục, sang Bảo Lạc với sông Gâm uốn lượn.', evening: 'Nghỉ Bảo Lạc, thưởng thức bánh áp chao.' },
            { title: 'Hồ Ba Bể', morning: 'Di chuyển sang Bắc Kạn, đi thuyền hồ Ba Bể.', afternoon: 'Động Puông, ao Tiên, đảo Bà Góa.', evening: 'Ngủ homestay bản Pác Ngòi, ăn cá nướng hồ Ba Bể.' },
        ],
        fees: [420000, 590000],
    },
    'cat-ba': {
        days: [
            { title: 'Đảo ngọc Cát Bà', morning: 'Di chuyển Hà Nội – Hải Phòng, đi tàu cao tốc ra đảo, nhận phòng.', afternoon: 'Tắm biển Cát Cò 1, 2, 3, đi bộ đường ven vách đá.', evening: 'Ngắm hoàng hôn pháo đài Thần Công, ăn hải sản tại bến cá.' },
            { title: 'Vịnh Lan Hạ', morning: 'Lên thuyền ra vịnh Lan Hạ, chèo kayak qua hang Sáng – Tối.', afternoon: 'Tắm biển bãi Ba Trái Đào, thăm làng chài Cái Bèo.', evening: 'Dạo phố đi bộ thị trấn, thưởng thức bánh đa cua.' },
            { title: 'Rừng quốc gia', morning: 'Trekking vườn quốc gia Cát Bà, leo đỉnh Ngự Lâm.', afternoon: 'Tham quan hang Quân Y, hang Trung Trang.', evening: 'Ăn tối trên bè nổi, ngắm vịnh về đêm.' },
            { title: 'Đảo Khỉ – Việt Hải', morning: 'Đi cano ra đảo Khỉ, tắm biển cát trắng.', afternoon: 'Đạp xe vào làng Việt Hải giữa lòng vườn quốc gia.', evening: 'BBQ hải sản bên biển.' },
            { title: 'Hải Phòng thành phố hoa phượng', morning: 'Về Hải Phòng, Nhà hát Lớn, phố cổ Tam Bạc.', afternoon: 'Tháp Tường Long, bãi biển Đồ Sơn.', evening: 'Food tour Hải Phòng: bánh mì que, nem cua bể, bánh đa cua.' },
        ],
        fees: [210000, 290000],
    },
    'mu-cang-chai': {
        days: [
            { title: 'Nghĩa Lộ – Tú Lệ', morning: 'Xe khách đêm từ Hà Nội, ăn sáng xôi Tú Lệ.', afternoon: 'Tắm suối khoáng nóng Tú Lệ, ngắm cánh đồng lúa.', evening: 'Nghỉ homestay người Thái, ăn cơm lam, gà đồi.' },
            { title: 'Đèo Khau Phạ – Mâm Xôi', morning: 'Vượt đèo Khau Phạ, xem bay dù lượn (mùa lúa chín).', afternoon: 'Check-in đồi Mâm Xôi và ruộng bậc thang La Pán Tẩn.', evening: 'Ngủ homestay H\'Mông, thưởng thức thịt trâu gác bếp.' },
            { title: 'Chế Cu Nha – Dế Xu Phình', morning: 'Săn mây và ngắm ruộng bậc thang Chế Cu Nha.', afternoon: 'Bản Dế Xu Phình với ruộng hình móng ngựa.', evening: 'Giao lưu văn nghệ, uống rượu ngô cùng người H\'Mông.' },
            { title: 'Thác Mơ – Púng Luông', morning: 'Thác Mơ và rừng pơ mu Púng Luông.', afternoon: 'Tắm suối, ăn trưa picnic giữa ruộng bậc thang.', evening: 'Về Tú Lệ, ngủ nhà sàn.' },
            { title: 'Mường Lò – Nghĩa Lộ', morning: 'Cánh đồng Mường Lò – vựa lúa thứ hai Tây Bắc.', afternoon: 'Xem múa xòe Thái, mua cốm Tú Lệ làm quà.', evening: 'Lên xe về Hà Nội.' },
        ],
        fees: [270000, 380000],
    },
    'hue': {
        days: [
            { title: 'Hoàng thành Huế', morning: 'Ăn sáng bún bò, tham quan Đại Nội – Ngọ Môn – Tử Cấm Thành.', afternoon: 'Chùa Thiên Mụ, lăng Minh Mạng.', evening: 'Nghe ca Huế trên thuyền rồng, thả đèn hoa đăng sông Hương.' },
            { title: 'Lăng tẩm và ẩm thực', morning: 'Lăng Khải Định, lăng Tự Đức.', afternoon: 'Làng hương Thủy Xuân, chợ Đông Ba.', evening: 'Food tour bánh bèo, bánh nậm, chè Huế ở phố Hàn Thuyên.' },
            { title: 'Phá Tam Giang – biển Thuận An', morning: 'Đầm Chuồn trên phá Tam Giang, ăn hải sản đầm phá.', afternoon: 'Làng cổ Phước Tích, biển Thuận An.', evening: 'Ngắm hoàng hôn trên phá Tam Giang.' },
            { title: 'Bạch Mã – Lăng Cô', morning: 'Vườn quốc gia Bạch Mã, thác Đỗ Quyên.', afternoon: 'Vịnh Lăng Cô – một trong những vịnh đẹp nhất thế giới.', evening: 'Ăn hải sản đầm Lập An.' },
            { title: 'Vượt Hải Vân sang Đà Nẵng', morning: 'Chạy xe đèo Hải Vân, ghé Hải Vân Quan.', afternoon: 'Tắm biển Mỹ Khê, chùa Linh Ứng Sơn Trà.', evening: 'Ngắm Cầu Rồng về đêm ở Đà Nẵng.' },
        ],
        fees: [320000, 450000],
    },
    'phong-nha': {
        days: [
            { title: 'Động Phong Nha', morning: 'Đến Phong Nha, đi thuyền sông Son vào động Phong Nha và động Tiên Sơn.', afternoon: 'Đạp xe thung lũng Bống Lai.', evening: 'Ăn gà nướng Phong Nha, nghỉ homestay bên sông.' },
            { title: 'Thiên Đường – hang Tối', morning: 'Khám phá động Thiên Đường với nhũ đá lộng lẫy.', afternoon: 'Zipline, tắm bùn tại hang Tối, bơi sông Chày.', evening: 'Thưởng thức bánh bột lọc, cháo canh Quảng Bình.' },
            { title: 'Suối Nước Moọc – Trạng Nguyên', morning: 'Suối Nước Moọc – tắm suối, chèo kayak giữa rừng.', afternoon: 'Hang Tám Cô, đường Trường Sơn huyền thoại.', evening: 'BBQ tại homestay, nghe kể chuyện khám phá hang động.' },
            { title: 'Đồng Hới – biển Nhật Lệ', morning: 'Về Đồng Hới, thành cổ Đồng Hới, nhà thờ Tam Tòa.', afternoon: 'Tắm biển Nhật Lệ, đồi cát Quang Phú.', evening: 'Ăn hải sản chợ đêm Đồng Hới.' },
            { title: 'Vũng Chùa – Đảo Yến', morning: 'Viếng mộ Đại tướng Võ Nguyên Giáp tại Vũng Chùa – Đảo Yến.', afternoon: 'Tắm biển Đá Nhảy, mua khoai deo làm quà.', evening: 'Dạo quảng trường sông Nhật Lệ.' },
        ],
        fees: [430000, 600000],
    },
    'da-nang': {
        days: [
            { title: 'Bà Nà Hills – Cầu Vàng', morning: 'Đi cáp treo lên Bà Nà, check-in Cầu Vàng khi còn sớm.', afternoon: 'Làng Pháp, vườn hoa Le Jardin, Fantasy Park.', evening: 'Xuống núi, ăn mì Quảng và hải sản ven biển.' },
            { title: 'Sơn Trà – Ngũ Hành Sơn', morning: 'Tắm biển Mỹ Khê, chùa Linh Ứng Sơn Trà.', afternoon: 'Ngũ Hành Sơn, làng đá Non Nước.', evening: 'Xem Cầu Rồng phun lửa (tối cuối tuần), chợ đêm Sơn Trà.' },
            { title: 'Đèo Hải Vân', morning: 'Chạy xe máy đèo Hải Vân, ghé Lăng Cô.', afternoon: 'Ăn bánh tráng cuốn thịt heo, cà phê view sông Hàn.', evening: 'Du thuyền sông Hàn ngắm thành phố lên đèn.' },
            { title: 'Phố cổ Hội An', morning: 'Sang Hội An, làng rau Trà Quế, rừng dừa Bảy Mẫu.', afternoon: 'Chùa Cầu, hội quán Phúc Kiến, nhà cổ Tấn Ký.', evening: 'Thả hoa đăng sông Hoài, ăn cao lầu.' },
            { title: 'Cù Lao Chàm', morning: 'Đi cano ra Cù Lao Chàm, lặn ngắm san hô.', afternoon: 'Tắm biển bãi Chồng, thăm làng chài Bãi Làng.', evening: 'Về Đà Nẵng, mua chả bò, mực rim làm quà.' },
        ],
        fees: [290000, 410000],
    },
    'hoi-an': {
        days: [
            { title: 'Phố cổ ban ngày', morning: 'Mua vé tham quan, đi Chùa Cầu, hội quán Phúc Kiến, nhà cổ Tấn Ký.', afternoon: 'Đạp xe ra rừng dừa Bảy Mẫu, ngồi thúng chai.', evening: 'Thả hoa đăng sông Hoài, ăn cao lầu và dạo chợ đêm.' },
            { title: 'Làng nghề và biển', morning: 'Học nấu ăn, làng rau Trà Quế.', afternoon: 'Tắm biển An Bàng, may đo áo dài.', evening: 'Ăn bánh mì Phượng, xem show Ký ức Hội An.' },
            { title: 'Thánh địa Mỹ Sơn', morning: 'Khu đền tháp Chăm Mỹ Sơn – di sản UNESCO.', afternoon: 'Làng gốm Thanh Hà, làng mộc Kim Bồng.', evening: 'Ăn mì Quảng, bánh xèo giếng Bá Lễ.' },
            { title: 'Cù Lao Chàm', morning: 'Đi cano ra Cù Lao Chàm, lặn ngắm san hô.', afternoon: 'Tắm biển bãi Chồng, chùa Hải Tạng.', evening: 'Về Hội An, cà phê view sông Thu Bồn.' },
            { title: 'Bà Nà Hills', morning: 'Đi cáp treo Bà Nà, check-in Cầu Vàng.', afternoon: 'Làng Pháp, vườn hoa Le Jardin.', evening: 'Ngắm Cầu Rồng về đêm ở Đà Nẵng.' },
        ],
        fees: [390000, 550000],
    },
    'nha-trang': {
        days: [
            { title: 'Thành phố biển', morning: 'Tháp Bà Po Nagar, chùa Long Sơn.', afternoon: 'Tắm bùn khoáng nóng, thư giãn.', evening: 'Dạo biển Trần Phú, ăn hải sản chợ Xóm Mới.' },
            { title: 'Tour 4 đảo', morning: 'Lặn ngắm san hô Hòn Mun.', afternoon: 'Hòn Tằm, Bãi Tranh, tiệc nổi trên biển.', evening: 'Ăn bún chả cá, nem nướng Ninh Hòa.' },
            { title: 'VinWonders', morning: 'Đi cáp treo vượt biển sang Hòn Tre.', afternoon: 'Công viên nước và trò chơi tại VinWonders.', evening: 'Xem show nhạc nước Tata.' },
            { title: 'Đảo Bình Ba – Bình Hưng', morning: 'Ra đảo Bình Ba – "đảo tôm hùm", tắm bãi Nồm.', afternoon: 'Lặn ngắm san hô, ăn tôm hùm, ốc hương tại bè.', evening: 'Về Nha Trang, dạo chợ đêm.' },
            { title: 'Dốc Lết – Ninh Vân', morning: 'Tắm biển Dốc Lết cát trắng mịn.', afternoon: 'Suối khoáng nóng Trăm Trứng, mua yến sào làm quà.', evening: 'Bar trên tầng thượng ngắm vịnh Nha Trang.' },
        ],
        fees: [360000, 500000],
    },
    'da-lat': {
        days: [
            { title: 'Trung tâm Đà Lạt', morning: 'Dạo hồ Xuân Hương, ăn bánh căn, quảng trường Lâm Viên.', afternoon: 'Ga Đà Lạt, tàu hỏa Trại Mát, chùa Linh Phước.', evening: 'Chợ đêm Đà Lạt, bánh tráng nướng và sữa đậu nành.' },
            { title: 'Săn mây – đồi chè', morning: 'Dậy sớm săn mây tại đồi chè Cầu Đất.', afternoon: 'Vườn dâu tây, vườn hoa cẩm tú cầu.', evening: 'Lẩu gà lá é, cà phê acoustic.' },
            { title: 'Rừng thông – thác nước', morning: 'Đồi thông Thung lũng Tình Yêu, hồ Tuyền Lâm.', afternoon: 'Thác Datanla (máng trượt), Thiền viện Trúc Lâm bằng cáp treo.', evening: 'Mua mứt, atiso làm quà.' },
            { title: 'Langbiang – làng Cù Lần', morning: 'Chinh phục đỉnh Langbiang bằng xe jeep.', afternoon: 'Làng Cù Lần – chèo kayak, cưỡi ngựa giữa rừng thông.', evening: 'Giao lưu cồng chiêng Tây Nguyên, uống rượu cần.' },
            { title: 'Biệt thự Pháp – Dinh Bảo Đại', morning: 'Dinh III Bảo Đại, nhà thờ Con Gà, biệt thự Hằng Nga (Nhà điên).', afternoon: 'Làng hoa Vạn Thành, vườn hồng Đà Lạt.', evening: 'Cà phê Tùng, ăn nem nướng Bà Hùng.' },
        ],
        fees: [210000, 290000],
    },
    'mui-ne': {
        days: [
            { title: 'Đồi cát – Suối Tiên', morning: 'Xe jeep ngắm bình minh ở đồi cát Bàu Trắng.', afternoon: 'Lội Suối Tiên, thăm làng chài Mũi Né.', evening: 'Ngắm hoàng hôn đồi cát Bay, ăn hải sản ven biển.' },
            { title: 'Biển và thể thao', morning: 'Học lướt ván diều hoặc tắm biển tại resort.', afternoon: 'Tháp Chàm Poshanư, lâu đài rượu vang.', evening: 'Ăn bánh căn, gỏi cá mai.' },
            { title: 'Mũi Kê Gà', morning: 'Hải đăng Kê Gà – ngọn hải đăng cổ nhất Việt Nam.', afternoon: 'Tắm biển Tiến Thành, bãi đá Ông Địa.', evening: 'Về Phan Thiết, ăn lẩu thả.' },
            { title: 'Hòn Rơm – làng nước mắm', morning: 'Tắm biển Hòn Rơm, chèo SUP buổi sáng.', afternoon: 'Làng nước mắm Phan Thiết, mua đặc sản.', evening: 'Hải sản nướng ở bãi Đồi Dương.' },
            { title: 'Núi Tà Cú', morning: 'Đi cáp treo lên núi Tà Cú, tượng Phật nằm lớn nhất Đông Nam Á.', afternoon: 'Biển Kê Gà, đồi cát Hồng.', evening: 'Về lại TP.HCM hoặc nghỉ thêm ở resort.' },
        ],
        fees: [190000, 270000],
    },
    'quy-nhon': {
        days: [
            { title: 'Kỳ Co – Eo Gió', morning: 'Đi cano ra Kỳ Co, tắm biển và lặn ngắm san hô Bãi Dứa.', afternoon: 'Eo Gió – ngắm biển từ đường đi bộ trên vách đá.', evening: 'Ăn bánh xèo tôm nhảy, dạo biển Xuân Diệu.' },
            { title: 'Nội thành Quy Nhơn', morning: 'Ghềnh Ráng Tiên Sa, mộ Hàn Mặc Tử.', afternoon: 'Tháp Đôi, chùa Long Khánh.', evening: 'Ăn hải sản tại chợ đêm Quy Nhơn.' },
            { title: 'Tây Sơn – đất võ', morning: 'Bảo tàng Quang Trung, xem biểu diễn võ cổ truyền.', afternoon: 'Tháp Bánh Ít, thưởng thức bánh hỏi cháo lòng.', evening: 'Dạo quảng trường Nguyễn Tất Thành.' },
            { title: 'Cù Lao Xanh', morning: 'Đi tàu ra Cù Lao Xanh, hải đăng trên đảo.', afternoon: 'Tắm biển, lặn ngắm san hô, ăn hải sản đảo.', evening: 'Về đất liền, cà phê view biển.' },
            { title: 'Hòn Khô – Nhơn Lý', morning: 'Làng chài Nhơn Lý, đi thuyền thúng ra Hòn Khô.', afternoon: 'Lặn ngắm san hô, tắm biển Hòn Khô.', evening: 'Mua chả cá, nem chợ Huyện làm quà.' },
        ],
        fees: [320000, 450000],
    },
    'phu-yen': {
        days: [
            { title: 'Mũi Điện – Bãi Môn', morning: 'Đón bình minh sớm nhất đất liền tại Mũi Điện, leo hải đăng Đại Lãnh.', afternoon: 'Tắm biển Bãi Môn, thăm đầm Ô Loan.', evening: 'Ăn mắt cá ngừ, dạo tháp Nhạn về đêm.' },
            { title: 'Gành Đá Đĩa – Xuân Đài', morning: 'Khám phá Gành Đá Đĩa, nhà thờ Mằng Lăng.', afternoon: 'Đi thuyền vịnh Xuân Đài, làng Đo Đo (phim "Mắt Biếc").', evening: 'Ăn sò huyết đầm Ô Loan.' },
            { title: 'Hòn Yến – Gành Ông', morning: 'Hòn Yến – rạn san hô nổi khi thủy triều rút.', afternoon: 'Gành Ông, bãi Xép – bối cảnh "Tôi thấy hoa vàng trên cỏ xanh".', evening: 'Về Tuy Hòa, ăn bánh canh hẹ.' },
            { title: 'Cù Lao Mái Nhà', morning: 'Đi thuyền ra Cù Lao Mái Nhà, tắm biển trong vắt.', afternoon: 'Lặn ngắm san hô, ăn trưa hải sản trên đảo.', evening: 'Nghỉ ngơi, dạo biển Tuy Hòa.' },
            { title: 'Đập Đồng Cam – ga Hòa Đa', morning: 'Đập Đồng Cam trăm tuổi, cánh đồng lúa Tuy An.', afternoon: 'Ga Hòa Đa, núi Chóp Chài.', evening: 'Mua bánh tráng Hòa Đa làm quà.' },
        ],
        fees: [330000, 460000],
    },
    'sai-gon': {
        days: [
            { title: 'Sài Gòn di sản', morning: 'Dinh Độc Lập, Nhà thờ Đức Bà, Bưu điện Thành phố.', afternoon: 'Bảo tàng Chứng tích Chiến tranh, chợ Bến Thành.', evening: 'Phố đi bộ Nguyễn Huệ, ngắm thành phố từ Landmark 81 hoặc Bitexco.' },
            { title: 'Địa đạo và ẩm thực', morning: 'Địa đạo Củ Chi (nửa ngày).', afternoon: 'Chợ Lớn, chùa Bà Thiên Hậu ở Quận 5.', evening: 'Food tour xe máy Quận 4: ốc, cơm tấm, bánh mì.' },
            { title: 'Cần Giờ – rừng ngập mặn', morning: 'Rừng Sác Cần Giờ, đảo Khỉ.', afternoon: 'Tắm biển 30/4, ăn hải sản Cần Giờ.', evening: 'Du thuyền sông Sài Gòn, ăn tối ngắm thành phố.' },
            { title: 'Mỹ Tho – Bến Tre', morning: 'Đi Mỹ Tho, thuyền trên sông Tiền, cồn Thới Sơn.', afternoon: 'Xuồng ba lá rạch dừa Bến Tre, nghe đờn ca tài tử.', evening: 'Về Sài Gòn, dạo phố Bùi Viện.' },
            { title: 'Tây Ninh – núi Bà Đen', morning: 'Tòa Thánh Cao Đài Tây Ninh.', afternoon: 'Cáp treo lên đỉnh núi Bà Đen – "nóc nhà Nam Bộ".', evening: 'Về Sài Gòn, ăn bánh tráng phơi sương Trảng Bàng.' },
        ],
        fees: [290000, 410000],
    },
    'can-tho': {
        days: [
            { title: 'Bến Ninh Kiều – nhà cổ', morning: 'Đến Cần Thơ, nhà cổ Bình Thủy, chùa Ông.', afternoon: 'Vườn trái cây Phong Điền, ăn bánh xèo miền Tây.', evening: 'Dạo bến Ninh Kiều, du thuyền nghe đờn ca tài tử.' },
            { title: 'Chợ nổi Cái Răng', morning: '5h sáng đi thuyền ra chợ nổi Cái Răng, ăn hủ tiếu trên ghe.', afternoon: 'Lò hủ tiếu truyền thống, làng du lịch Mỹ Khánh.', evening: 'Chợ đêm Tây Đô, ăn lẩu mắm.' },
            { title: 'Cồn Sơn – vườn cò Bằng Lăng', morning: 'Cồn Sơn – xem cá lóc bay, làm bánh dân gian.', afternoon: 'Vườn cò Bằng Lăng với hàng nghìn cò về tổ.', evening: 'Nghỉ homestay miệt vườn.' },
            { title: 'Sóc Trăng – chùa Khmer', morning: 'Sang Sóc Trăng, chùa Dơi, chùa Chén Kiểu.', afternoon: 'Chùa Đất Sét, ăn bún nước lèo, bánh pía.', evening: 'Về Cần Thơ.' },
            { title: 'Châu Đốc – rừng tràm Trà Sư', morning: 'Đi An Giang, xuồng rừng tràm Trà Sư.', afternoon: 'Miếu Bà Chúa Xứ, núi Sam.', evening: 'Ăn bún cá Châu Đốc, mua mắm làm quà.' },
        ],
        fees: [270000, 380000],
    },
    'phu-quoc': {
        days: [
            { title: 'Nam đảo', morning: 'Cáp treo Hòn Thơm, công viên nước Aquatopia.', afternoon: 'Tắm biển Bãi Sao, nhà tù Phú Quốc.', evening: 'Ngắm hoàng hôn Sunset Town, xem show Kiss of the Sea.' },
            { title: 'Tour 4 đảo', morning: 'Lặn ngắm san hô quần đảo An Thới.', afternoon: 'Hòn Mây Rút, Hòn Móng Tay.', evening: 'Chợ đêm Dinh Cậu, ăn gỏi cá trích, ghẹ Hàm Ninh.' },
            { title: 'Bắc đảo', morning: 'Grand World, VinWonders, Vinpearl Safari.', afternoon: 'Rạch Vẹm ngắm sao biển, cơ sở nước mắm, vườn tiêu.', evening: 'Ngắm hoàng hôn Bãi Dài.' },
            { title: 'Làng chài Hàm Ninh – suối Tranh', morning: 'Làng chài Hàm Ninh, ăn ghẹ luộc trên cầu cảng.', afternoon: 'Suối Tranh, trại nuôi ngọc trai.', evening: 'Dinh Cậu ngắm hoàng hôn, thử bún quậy.' },
            { title: 'Mũi Gành Dầu – rừng nguyên sinh', morning: 'Trekking vườn quốc gia Phú Quốc, mũi Gành Dầu.', afternoon: 'Tắm biển Gành Dầu, chùa Hộ Quốc.', evening: 'Mua nước mắm, tiêu, ngọc trai làm quà.' },
        ],
        fees: [500000, 700000],
    },
    'vung-tau': {
        days: [
            { title: 'Núi Nhỏ – Bãi Sau', morning: 'Khởi hành từ TP.HCM, leo tượng Chúa Kitô Vua trên núi Nhỏ.', afternoon: 'Tắm biển Bãi Sau, đi bộ ra Hòn Bà khi triều rút.', evening: 'Ăn bánh khọt, lẩu cá đuối, dạo Bãi Trước.' },
            { title: 'Hải đăng – Bạch Dinh', morning: 'Ngắm bình minh ở ngọn hải đăng Vũng Tàu.', afternoon: 'Thăm Bạch Dinh, cáp treo Hồ Mây.', evening: 'Hải sản chợ Xóm Lưới.' },
            { title: 'Long Hải – Hồ Tràm', morning: 'Dinh Cô Long Hải, biển Long Hải.', afternoon: 'Tắm biển Hồ Tràm, suối khoáng nóng Bình Châu.', evening: 'Nghỉ resort Hồ Tràm.' },
            { title: 'Rừng Bình Châu – Phước Bửu', morning: 'Khu bảo tồn Bình Châu – Phước Bửu, trekking rừng.', afternoon: 'Luộc trứng suối nóng, ngâm bùn khoáng.', evening: 'Về Vũng Tàu, mua bánh bông lan trứng muối.' },
            { title: 'Cần Giờ – rừng ngập mặn', morning: 'Đi phà sang Cần Giờ, rừng Sác, đảo Khỉ.', afternoon: 'Ăn hải sản Cần Giờ, tắm biển 30/4.', evening: 'Về lại TP.HCM.' },
        ],
        fees: [50000, 70000],
    },
    'chau-doc': {
        days: [
            { title: 'Núi Sam – Châu Đốc', morning: 'Đến Châu Đốc, viếng miếu Bà Chúa Xứ, lăng Thoại Ngọc Hầu.', afternoon: 'Leo núi Sam ngắm cánh đồng biên giới, chùa Tây An.', evening: 'Ăn lẩu mắm, dạo chợ Châu Đốc.' },
            { title: 'Trà Sư – núi Cấm', morning: 'Xuồng rừng tràm Trà Sư giữa thảm bèo và đàn chim.', afternoon: 'Cáp treo núi Cấm, tượng Phật Di Lặc.', evening: 'Thử bánh bò thốt nốt, ngủ tại Tịnh Biên.' },
            { title: 'Làng Chăm – làng bè', morning: 'Làng Chăm Châu Giang, thánh đường Hồi giáo Mubarak.', afternoon: 'Làng bè cá Châu Đốc, xem nuôi cá tra.', evening: 'Ăn bún cá Châu Đốc.' },
            { title: 'Hồ Tà Pạ – rừng Tân Tuyến', morning: 'Hồ Tà Pạ – "Tiểu Thụy Sĩ" giữa núi đá.', afternoon: 'Cánh đồng thốt nốt Tri Tôn, chùa Xà Tón.', evening: 'Thưởng thức gà đốt lá chúc Ô Thum.' },
            { title: 'Long Xuyên – cù lao Ông Hổ', morning: 'Chợ nổi Long Xuyên.', afternoon: 'Cù lao Ông Hổ, nhà lưu niệm Chủ tịch Tôn Đức Thắng.', evening: 'Mua mắm, khô cá làm quà, về TP.HCM.' },
        ],
        fees: [240000, 340000],
    },
    'con-dao': {
        days: [
            { title: 'Di tích lịch sử', morning: 'Nhà tù Côn Đảo, trại Phú Hải, chuồng cọp.', afternoon: 'Bảo tàng Côn Đảo, cầu tàu 914.', evening: 'Viếng nghĩa trang Hàng Dương, mộ chị Võ Thị Sáu (khoảng 23h–24h).' },
            { title: 'Biển đảo hoang sơ', morning: 'Tắm biển Đầm Trầu – ngắm máy bay hạ cánh ngay trên đầu.', afternoon: 'Lặn ngắm san hô Hòn Bảy Cạnh (hoặc Hòn Cau).', evening: 'Ăn hải sản ở chợ đêm Côn Đảo.' },
            { title: 'Rừng nguyên sinh', morning: 'Trekking đường mòn Ông Đụng ra bãi biển hoang sơ.', afternoon: 'Miếu Bà Phi Yến, chùa Vân Sơn.', evening: 'Dạo phố Côn Sơn, cà phê bờ kè.' },
            { title: 'Hòn Bảy Cạnh – rùa biển', morning: 'Đi cano ra Hòn Bảy Cạnh, tham quan trạm bảo tồn rùa.', afternoon: 'Tắm biển, lặn ngắm san hô bãi Đầm Tre.', evening: 'Xem rùa đẻ trứng (tháng 5 – 9, cần đăng ký).' },
            { title: 'Mũi Cá Mập – bãi Nhát', morning: 'Ngắm bình minh ở mũi Cá Mập, bãi Nhát khi thủy triều rút.', afternoon: 'Tắm biển An Hải, mua hạt bàng làm quà.', evening: 'Ăn tối hải sản chia tay Côn Đảo.' },
        ],
        fees: [700000, 980000],
    },
    'moc-chau': {
        days: [
            { title: 'Đồi chè và thác Dải Yếm', morning: 'Từ Hà Nội theo QL6 (~4 giờ), dừng đèo Thung Khe ngắm thung lũng Mai Châu.', afternoon: 'Dạo đồi chè trái tim, thưởng trà shan tuyết, thăm thác Dải Yếm.', evening: 'Ăn bê chao, cá suối nướng ở thị trấn Nông Trường.' },
            { title: 'Rừng thông và cầu kính', morning: 'Săn bình minh rừng thông bản Áng, chèo thuyền hồ.', afternoon: 'Đi cầu kính Bạch Long, ngắm vực sâu giữa núi.', evening: 'Uống sữa tươi, mua bánh sữa, mận khô làm quà.' },
            { title: 'Thung lũng Nà Ka', morning: 'Thung lũng mận Nà Ka (hoa trắng tháng 1 – 2, quả chín tháng 5 – 6).', afternoon: 'Đồi cải trắng Chiềng Đi (tháng 11 – 12), trang trại bò sữa.', evening: 'Giao lưu văn nghệ, ăn cơm lam tại homestay bản Thái.' },
            { title: 'Bản Hua Tạt', morning: 'Đi bộ vào bản Hua Tạt của người H\'Mông giữa rừng núi.', afternoon: 'Thác Chiềng Khoa và hang Dơi.', evening: 'Nướng BBQ, lẩu gà đen tại homestay.' },
            { title: 'Mai Châu trên đường về', morning: 'Rẽ qua Mai Châu (Hòa Bình), đạp xe bản Lác, bản Pom Coọng.', afternoon: 'Ăn cơm lam, gà nướng Mai Châu rồi về Hà Nội.', evening: 'Về tới Hà Nội khoảng 20h.' },
        ],
        fees: [210000, 290000],
    },
    'pu-luong': {
        days: [
            { title: 'Vào bản giữa ruộng bậc thang', morning: 'Từ Hà Nội đi xe ~4 giờ qua Mai Châu tới Pù Luông, nhận phòng homestay.', afternoon: 'Dạo ruộng bậc thang bản Đôn, xem guồng nước quay.', evening: 'Ăn vịt Cổ Lũng, cơm lam bên nhà sàn.' },
            { title: 'Trekking Kho Mường', morning: 'Trekking qua rừng tre tới bản Kho Mường của người Thái.', afternoon: 'Khám phá hang Bàng, tắm suối trong vắt.', evening: 'Nghe tiếng guồng nước, ngắm sao giữa thung lũng.' },
            { title: 'Thác Hiêu và bản Hiêu', morning: 'Đạp xe đến thác Hiêu nhiều tầng, tắm thác.', afternoon: 'Thăm bản Hiêu, xem dệt thổ cẩm, chợ phiên Phố Đoàn (thứ Bảy).', evening: 'Uống rượu cần, xem múa sạp.' },
            { title: 'Chèo bè suối Mã', morning: 'Chèo bè tre trên sông Mã, ngắm vách núi hai bờ.', afternoon: 'Nghỉ ngơi ở homestay có hồ bơi view ruộng lúa.', evening: 'BBQ gà đồi, cá suối.' },
            { title: 'Mai Châu – về Hà Nội', morning: 'Săn mây sớm trên đỉnh Pù Luông.', afternoon: 'Dừng Mai Châu ăn trưa, mua thổ cẩm.', evening: 'Về Hà Nội.' },
        ],
        fees: [230000, 320000],
    },
    'ly-son': {
        days: [
            { title: 'Ra đảo lớn', morning: 'Tàu cao tốc từ cảng Sa Kỳ (~30 phút), nhận phòng, thuê xe máy.', afternoon: 'Chùa Hang, cổng Tò Vò – chờ hoàng hôn.', evening: 'Ăn gỏi tỏi, ốc cừ ở chợ đêm Lý Sơn.' },
            { title: 'Đỉnh Thới Lới', morning: 'Leo đỉnh Thới Lới ngắm bình minh và miệng núi lửa.', afternoon: 'Âm Linh Tự, Nhà trưng bày Hải đội Hoàng Sa kiêm quản Bắc Hải.', evening: 'Hải sản tươi và cháo nhum.' },
            { title: 'Đảo Bé', morning: 'Đi cano ra Đảo Bé, tắm biển bãi Hang.', afternoon: 'Lặn ngắm san hô, đi bộ vòng đảo nhỏ.', evening: 'Về đảo lớn, dạo cánh đồng tỏi lúc chiều muộn.' },
            { title: 'Hang Câu và vách đá', morning: 'Hang Câu với vách đá núi lửa nhiều lớp.', afternoon: 'Cột cờ Tổ quốc, mua tỏi cô đơn làm quà.', evening: 'Nướng hải sản bên bờ kè.' },
            { title: 'Về đất liền', morning: 'Ngắm bình minh trên cầu cảng, lên tàu về Sa Kỳ.', afternoon: 'Thăm khu chứng tích Sơn Mỹ, ăn cá bống sông Trà.', evening: 'Về Quảng Ngãi hoặc Đà Nẵng.' },
        ],
        fees: [370000, 520000],
    },
    'buon-ma-thuot': {
        days: [
            { title: 'Thủ phủ cà phê', morning: 'Ăn sáng bún đỏ, uống cà phê Ban Mê.', afternoon: 'Bảo tàng Thế giới Cà phê, làng cà phê Trung Nguyên.', evening: 'Dạo quảng trường, ăn gà nướng cơm lam.' },
            { title: 'Thác Dray Nur – Dray Sáp', morning: 'Đi xe ~30 phút tới thác Dray Nur, Dray Sáp.', afternoon: 'Tham quan vườn cà phê, xem quy trình rang xay.', evening: 'Nghe cồng chiêng, uống rượu cần ở buôn Kô Siêr.' },
            { title: 'Hồ Lắk', morning: 'Tới hồ Lắk (~1 giờ), chèo thuyền độc mộc.', afternoon: 'Thăm buôn Jun của người M\'Nông, biệt điện Bảo Đại.', evening: 'Ngủ nhà dài, ăn cá lăng nướng.' },
            { title: 'Buôn Đôn', morning: 'Cầu treo Buôn Đôn, nhà sàn cổ.', afternoon: 'Tham quan khu bảo tồn voi (chọn tour đi bộ cùng voi).', evening: 'Về thành phố, ăn lẩu cá lăng.' },
            { title: 'Chợ và quà Tây Nguyên', morning: 'Chợ Buôn Ma Thuột – mua cà phê, tiêu, mắc ca.', afternoon: 'Nhà đày Buôn Ma Thuột, chùa Sắc tứ Khải Đoan.', evening: 'Ra sân bay hoặc đi tiếp Đà Lạt, Nha Trang.' },
        ],
        fees: [350000, 490000],
    },
    'ha-tien': {
        days: [
            { title: 'Hà Tiên thập cảnh', morning: 'Tới Hà Tiên, ăn sáng bánh canh ghẹ, dạo đầm Đông Hồ.', afternoon: 'Lăng Mạc Cửu, chùa Phù Dung, núi Tô Châu.', evening: 'Chợ đêm Hà Tiên ven sông.' },
            { title: 'Mũi Nai – Thạch Động', morning: 'Thạch Động – ngôi chùa trong hang núi đá.', afternoon: 'Tắm biển Mũi Nai, lên hải đăng ngắm vịnh.', evening: 'Hải sản nướng, ngắm hoàng hôn Mũi Nai.' },
            { title: 'Quần đảo Hải Tặc', morning: 'Tàu cao tốc ra quần đảo Hải Tặc (~1,5 giờ).', afternoon: 'Tắm biển Bãi Nam, lặn ngắm san hô, câu cá.', evening: 'Ngủ homestay trên đảo, ăn cá mú nướng.' },
            { title: 'Đảo và về đất liền', morning: 'Đi cano quanh đảo Hòn Đước, Hòn Tre Nhỏ.', afternoon: 'Về Hà Tiên, cà phê view đầm Đông Hồ.', evening: 'Ăn bún kèn, xôi xiêm.' },
            { title: 'Đi tiếp Phú Quốc', morning: 'Tàu cao tốc Hà Tiên – Phú Quốc (~1,5 giờ) hoặc về Rạch Giá.', afternoon: 'Nhận phòng, bắt đầu hành trình đảo ngọc.', evening: 'Chợ đêm Phú Quốc.' },
        ],
        fees: [320000, 450000],
    },
}
