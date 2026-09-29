/*=============== LỊCH TRÌNH GỢI Ý ===============*/
/*
 * Mỗi điểm đến: danh sách ngày (sáng / chiều / tối) và ngân sách ước tính cho 1 người,
 * chưa gồm vé máy bay/tàu xe tới điểm đến. Giá mang tính tham khảo.
 */
const ITINERARIES = {
    'vinh-ha-long': {
        days: [
            { title: 'Lên du thuyền, khám phá vịnh', morning: 'Di chuyển từ Hà Nội theo cao tốc (khoảng 2,5 giờ), lên du thuyền tại cảng Tuần Châu.', afternoon: 'Thăm hang Sửng Sốt, chèo kayak quanh hang Luồn.', evening: 'Ngắm hoàng hôn trên boong, ăn tối hải sản và câu mực đêm.' },
            { title: 'Ti Tốp và làng chài', morning: 'Tập thái cực quyền đón bình minh, leo đỉnh Ti Tốp ngắm toàn cảnh.', afternoon: 'Thăm làng chài Cửa Vạn, trả phòng và về lại cảng.', evening: 'Dạo Sun World Hạ Long, đi vòng quay Mặt Trời hoặc quay về Hà Nội.' },
        ],
        budget: { saving: '1.800.000đ', comfort: '4.500.000đ' },
    },
    'sa-pa': {
        days: [
            { title: 'Thị trấn trong sương', morning: 'Đến Sa Pa bằng xe giường nằm, nhận phòng, ăn sáng phở gà.', afternoon: 'Đi bộ xuống bản Cát Cát, xem thác Tiên Sa và nhà người H\'Mông.', evening: 'Dạo nhà thờ đá, chợ đêm, thưởng thức đồ nướng và rượu táo mèo.' },
            { title: 'Chinh phục Fansipan', morning: 'Đi cáp treo lên đỉnh Fansipan 3.143m, săn mây và viếng quần thể tâm linh.', afternoon: 'Ngắm đèo Ô Quy Hồ, thác Bạc và cổng trời.', evening: 'Thử lẩu cá hồi, ngâm lá thuốc người Dao đỏ.' },
            { title: 'Trekking Mường Hoa', morning: 'Trekking Lao Chải – Tả Van giữa ruộng bậc thang.', afternoon: 'Ăn trưa tại homestay, mua thổ cẩm rồi về lại thị trấn.', evening: 'Lên xe về Hà Nội.' },
        ],
        budget: { saving: '2.000.000đ', comfort: '5.000.000đ' },
    },
    'ha-noi': {
        days: [
            { title: 'Hà Nội nghìn năm', morning: 'Viếng Lăng Bác, Chùa Một Cột, Văn Miếu – Quốc Tử Giám.', afternoon: 'Dạo hồ Hoàn Kiếm, đền Ngọc Sơn, uống cà phê trứng nhìn ra hồ.', evening: 'Xem múa rối nước, food tour phố cổ Tạ Hiện.' },
            { title: 'Phố cổ và Tây Hồ', morning: 'Ăn phở gia truyền, đạp xích lô 36 phố phường, chợ Đồng Xuân.', afternoon: 'Nhà tù Hỏa Lò, phố đường tàu, Nhà hát Lớn.', evening: 'Hoàng hôn Hồ Tây, ăn bánh tôm và dạo phố đi bộ cuối tuần.' },
        ],
        budget: { saving: '1.200.000đ', comfort: '3.500.000đ' },
    },
    'ninh-binh': {
        days: [
            { title: 'Tràng An – Bái Đính', morning: 'Đi thuyền Tràng An qua các hang xuyên thủy (2–3 giờ).', afternoon: 'Viếng chùa Bái Đính, ăn trưa cơm cháy, dê núi.', evening: 'Nghỉ homestay Tam Cốc giữa cánh đồng.' },
            { title: 'Tam Cốc – Hang Múa', morning: 'Đạp xe đồng quê, đi thuyền Tam Cốc – Bích Động.', afternoon: 'Tham quan cố đô Hoa Lư.', evening: 'Leo 500 bậc Hang Múa ngắm hoàng hôn, về lại Hà Nội.' },
        ],
        budget: { saving: '1.300.000đ', comfort: '3.200.000đ' },
    },
    'ha-giang': {
        days: [
            { title: 'Hà Giang – Quản Bạ – Yên Minh', morning: 'Thuê xe máy hoặc easy rider, check-in cột mốc km0.', afternoon: 'Cổng trời Quản Bạ, núi đôi Cô Tiên, rừng thông Yên Minh.', evening: 'Nghỉ Yên Minh, ăn thắng cố hoặc lẩu gà đen.' },
            { title: 'Đồng Văn – Lũng Cú', morning: 'Dinh thự họ Vương, dốc Thẩm Mã.', afternoon: 'Lên cột cờ Lũng Cú – điểm cực Bắc Tổ quốc.', evening: 'Dạo phố cổ Đồng Văn, cà phê phố cổ.' },
            { title: 'Mã Pí Lèng – Nho Quế', morning: 'Vượt đèo Mã Pí Lèng, ngắm hẻm Tu Sản.', afternoon: 'Đi thuyền sông Nho Quế, rồi về Mèo Vạc.', evening: 'Tham gia chợ tình (nếu đúng dịp), nghỉ đêm Mèo Vạc.' },
            { title: 'Về lại Hà Giang', morning: 'Đi cung Mèo Vạc – Du Già qua những con dốc hùng vĩ.', afternoon: 'Tắm suối Du Già, ăn trưa homestay.', evening: 'Về thành phố Hà Giang, lên xe về Hà Nội.' },
        ],
        budget: { saving: '3.000.000đ', comfort: '6.500.000đ' },
    },
    'ban-gioc': {
        days: [
            { title: 'Thành phố Cao Bằng – Pác Bó', morning: 'Đến Cao Bằng, ăn sáng bánh cuốn canh.', afternoon: 'Khu di tích Pác Bó, suối Lê-nin, hang Cốc Bó.', evening: 'Thưởng thức vịt quay 7 vị, nghỉ tại thành phố.' },
            { title: 'Thác Bản Giốc', morning: 'Đi đèo Mã Phục đến thác Bản Giốc, đi bè tre sát chân thác.', afternoon: 'Chùa Phật tích Trúc Lâm, động Ngườm Ngao.', evening: 'Nghỉ homestay Trùng Khánh.' },
            { title: 'Hồ Thang Hen – về xuôi', morning: 'Ngắm hồ Thang Hen và đèo Khau Cốc Chà.', afternoon: 'Mua hạt dẻ Trùng Khánh, lên xe về Hà Nội.', evening: 'Kết thúc hành trình.' },
        ],
        budget: { saving: '2.200.000đ', comfort: '4.800.000đ' },
    },
    'hue': {
        days: [
            { title: 'Hoàng thành Huế', morning: 'Ăn sáng bún bò, tham quan Đại Nội – Ngọ Môn – Tử Cấm Thành.', afternoon: 'Chùa Thiên Mụ, lăng Minh Mạng.', evening: 'Nghe ca Huế trên thuyền rồng, thả đèn hoa đăng sông Hương.' },
            { title: 'Lăng tẩm và ẩm thực', morning: 'Lăng Khải Định, lăng Tự Đức.', afternoon: 'Làng hương Thủy Xuân, chợ Đông Ba.', evening: 'Food tour bánh bèo, bánh nậm, chè Huế ở phố Hàn Thuyên.' },
        ],
        budget: { saving: '1.300.000đ', comfort: '3.500.000đ' },
    },
    'phong-nha': {
        days: [
            { title: 'Động Phong Nha', morning: 'Đến Phong Nha, đi thuyền sông Son vào động Phong Nha và động Tiên Sơn.', afternoon: 'Đạp xe thung lũng Bống Lai.', evening: 'Ăn gà nướng Phong Nha, nghỉ homestay bên sông.' },
            { title: 'Thiên Đường – hang Tối', morning: 'Khám phá động Thiên Đường với nhũ đá lộng lẫy.', afternoon: 'Zipline, tắm bùn tại hang Tối, bơi sông Chày.', evening: 'Về Đồng Hới ăn hải sản, dạo biển Nhật Lệ.' },
        ],
        budget: { saving: '1.800.000đ', comfort: '4.000.000đ' },
    },
    'da-nang': {
        days: [
            { title: 'Bà Nà Hills – Cầu Vàng', morning: 'Đi cáp treo lên Bà Nà, check-in Cầu Vàng khi còn sớm.', afternoon: 'Làng Pháp, vườn hoa Le Jardin, Fantasy Park.', evening: 'Xuống núi, ăn mì Quảng và hải sản ven biển.' },
            { title: 'Sơn Trà – Ngũ Hành Sơn', morning: 'Tắm biển Mỹ Khê, chùa Linh Ứng Sơn Trà.', afternoon: 'Ngũ Hành Sơn, làng đá Non Nước.', evening: 'Xem Cầu Rồng phun lửa (tối cuối tuần), chợ đêm Sơn Trà.' },
            { title: 'Đèo Hải Vân', morning: 'Chạy xe máy đèo Hải Vân, ghé Lăng Cô.', afternoon: 'Ăn bánh tráng cuốn thịt heo, cà phê view sông Hàn.', evening: 'Du thuyền sông Hàn ngắm thành phố lên đèn.' },
        ],
        budget: { saving: '2.200.000đ', comfort: '6.000.000đ' },
    },
    'hoi-an': {
        days: [
            { title: 'Phố cổ ban ngày', morning: 'Mua vé tham quan, đi Chùa Cầu, hội quán Phúc Kiến, nhà cổ Tấn Ký.', afternoon: 'Đạp xe ra rừng dừa Bảy Mẫu, ngồi thúng chai.', evening: 'Thả hoa đăng sông Hoài, ăn cao lầu và dạo chợ đêm.' },
            { title: 'Làng nghề và biển', morning: 'Học nấu ăn, làng rau Trà Quế.', afternoon: 'Tắm biển An Bàng, may đo áo dài.', evening: 'Ăn bánh mì Phượng, xem show Ký ức Hội An.' },
        ],
        budget: { saving: '1.400.000đ', comfort: '4.000.000đ' },
    },
    'nha-trang': {
        days: [
            { title: 'Thành phố biển', morning: 'Tháp Bà Po Nagar, chùa Long Sơn.', afternoon: 'Tắm bùn khoáng nóng, thư giãn.', evening: 'Dạo biển Trần Phú, ăn hải sản chợ Xóm Mới.' },
            { title: 'Tour 4 đảo', morning: 'Lặn ngắm san hô Hòn Mun.', afternoon: 'Hòn Tằm, Bãi Tranh, tiệc nổi trên biển.', evening: 'Ăn bún chả cá, nem nướng Ninh Hòa.' },
            { title: 'VinWonders', morning: 'Đi cáp treo vượt biển sang Hòn Tre.', afternoon: 'Công viên nước và trò chơi tại VinWonders.', evening: 'Xem show nhạc nước Tata, về lại đất liền.' },
        ],
        budget: { saving: '2.200.000đ', comfort: '6.000.000đ' },
    },
    'da-lat': {
        days: [
            { title: 'Trung tâm Đà Lạt', morning: 'Dạo hồ Xuân Hương, ăn bánh căn, quảng trường Lâm Viên.', afternoon: 'Ga Đà Lạt, tàu hỏa Trại Mát, chùa Linh Phước.', evening: 'Chợ đêm Đà Lạt, bánh tráng nướng và sữa đậu nành.' },
            { title: 'Săn mây – đồi chè', morning: 'Dậy sớm săn mây tại đồi chè Cầu Đất.', afternoon: 'Vườn dâu tây, vườn hoa cẩm tú cầu.', evening: 'Lẩu gà lá é, cà phê acoustic.' },
            { title: 'Rừng thông – thác nước', morning: 'Đồi thông Thung lũng Tình Yêu, hồ Tuyền Lâm.', afternoon: 'Thác Datanla (máng trượt), Thiền viện Trúc Lâm bằng cáp treo.', evening: 'Mua mứt, atiso làm quà.' },
        ],
        budget: { saving: '1.800.000đ', comfort: '4.500.000đ' },
    },
    'mui-ne': {
        days: [
            { title: 'Đồi cát – Suối Tiên', morning: 'Xe jeep ngắm bình minh ở đồi cát Bàu Trắng.', afternoon: 'Lội Suối Tiên, thăm làng chài Mũi Né.', evening: 'Ngắm hoàng hôn đồi cát Bay, ăn hải sản ven biển.' },
            { title: 'Biển và thể thao', morning: 'Học lướt ván diều hoặc tắm biển tại resort.', afternoon: 'Tháp Chàm Poshanư, lâu đài rượu vang.', evening: 'Ăn bánh căn, gỏi cá mai rồi về lại TP.HCM.' },
        ],
        budget: { saving: '1.500.000đ', comfort: '4.000.000đ' },
    },
    'sai-gon': {
        days: [
            { title: 'Sài Gòn di sản', morning: 'Dinh Độc Lập, Nhà thờ Đức Bà, Bưu điện Thành phố.', afternoon: 'Bảo tàng Chứng tích Chiến tranh, chợ Bến Thành.', evening: 'Phố đi bộ Nguyễn Huệ, ngắm thành phố từ Landmark 81 hoặc Bitexco.' },
            { title: 'Địa đạo và ẩm thực', morning: 'Địa đạo Củ Chi (nửa ngày).', afternoon: 'Chợ Lớn, chùa Bà Thiên Hậu ở Quận 5.', evening: 'Food tour xe máy Quận 4: ốc, cơm tấm, bánh mì.' },
        ],
        budget: { saving: '1.300.000đ', comfort: '4.000.000đ' },
    },
    'can-tho': {
        days: [
            { title: 'Bến Ninh Kiều – nhà cổ', morning: 'Đến Cần Thơ, nhà cổ Bình Thủy, chùa Ông.', afternoon: 'Vườn trái cây Phong Điền, ăn bánh xèo miền Tây.', evening: 'Dạo bến Ninh Kiều, du thuyền nghe đờn ca tài tử.' },
            { title: 'Chợ nổi Cái Răng', morning: '5h sáng đi thuyền ra chợ nổi Cái Răng, ăn hủ tiếu trên ghe.', afternoon: 'Lò hủ tiếu truyền thống, làng du lịch Mỹ Khánh.', evening: 'Mua bánh pía, về lại TP.HCM.' },
        ],
        budget: { saving: '1.200.000đ', comfort: '3.000.000đ' },
    },
    'phu-quoc': {
        days: [
            { title: 'Nam đảo', morning: 'Cáp treo Hòn Thơm, công viên nước Aquatopia.', afternoon: 'Tắm biển Bãi Sao, nhà tù Phú Quốc.', evening: 'Ngắm hoàng hôn Sunset Town, xem show Kiss of the Sea.' },
            { title: 'Tour 4 đảo', morning: 'Lặn ngắm san hô quần đảo An Thới.', afternoon: 'Hòn Mây Rút, Hòn Móng Tay.', evening: 'Chợ đêm Dinh Cậu, ăn gỏi cá trích, ghẹ Hàm Ninh.' },
            { title: 'Bắc đảo', morning: 'Grand World, VinWonders, Vinpearl Safari.', afternoon: 'Rạch Vẹm ngắm sao biển, cơ sở nước mắm, vườn tiêu.', evening: 'Ngắm hoàng hôn Bãi Dài, mua quà đặc sản.' },
        ],
        budget: { saving: '3.000.000đ', comfort: '8.000.000đ' },
    },
    'con-dao': {
        days: [
            { title: 'Di tích lịch sử', morning: 'Nhà tù Côn Đảo, trại Phú Hải, chuồng cọp.', afternoon: 'Bảo tàng Côn Đảo, cầu tàu 914.', evening: 'Viếng nghĩa trang Hàng Dương, mộ chị Võ Thị Sáu (khoảng 23h–24h).' },
            { title: 'Biển đảo hoang sơ', morning: 'Tắm biển Đầm Trầu – ngắm máy bay hạ cánh ngay trên đầu.', afternoon: 'Lặn ngắm san hô Hòn Bảy Cạnh (hoặc Hòn Cau).', evening: 'Ăn hải sản ở chợ đêm Côn Đảo.' },
        ],
        budget: { saving: '3.500.000đ', comfort: '8.000.000đ' },
    },
}
