/*=============== QUÁN ĂN, LƯU TRÚ & ĐI LẠI THEO ĐIỂM ĐẾN ===============*/
/*
 * Dữ liệu cụ thể cho lịch trình: quán nên ghé, khu nên ở và cách di chuyển tới.
 * - Chuỗi hai ngôn ngữ viết dạng [tiếng Việt, English].
 * - price: [thấp, cao] tính bằng VND (quán: mỗi người; lưu trú: mỗi đêm/phòng).
 * - city: tên dùng để tìm trên Booking.com / Airbnb / Google Maps.
 * - airport: mã sân bay gần nhất (Google Flights); rail: ga tàu Thống Nhất gần nhất (nếu có).
 * Thông tin mang tính tham khảo – địa chỉ, giá và giờ mở cửa có thể thay đổi.
 */
const STAY_TYPES = {
    homestay: ['Homestay', 'Homestay'],
    hotel: ['Khách sạn', 'Hotel'],
    resort: ['Resort', 'Resort'],
    boat: ['Du thuyền ngủ đêm', 'Overnight cruise'],
}

const PLACES = {
    'vinh-ha-long': {
        city: 'Ha Long',
        airport: 'VDO',
        getThere: ['Từ Hà Nội đi xe limousine/xe khách cao tốc ~2,5 giờ (180 km); hoặc bay tới sân bay Vân Đồn (VDO) rồi đi xe ~1 giờ.', 'From Hanoi take a limousine van or express bus, ~2.5 h (180 km); or fly to Van Don (VDO) then drive ~1 h.'],
        eats: [
            { name: 'Chợ Hạ Long 1', dish: ['Chả mực giã tay, hải sản tươi chọn tại chợ', 'Hand-pounded squid cakes, fresh seafood picked at the market'], address: 'Đường Cột Đồng Hồ, Bạch Đằng, Hạ Long', price: [80000, 300000] },
            { name: 'Nhà hàng Hồng Hạnh', dish: ['Hải sản: tu hài, sam, ghẹ hấp', 'Seafood: geoduck, horseshoe crab, steamed crab'], address: 'Bãi Cháy, Hạ Long', price: [300000, 700000] },
            { name: 'Bánh cuốn chả mực Bãi Cháy', dish: ['Bánh cuốn nóng ăn kèm chả mực', 'Steamed rice rolls with squid cake'], address: 'Khu chợ Bãi Cháy, Hạ Long', price: [40000, 70000] },
            { name: 'Phố ăn đêm Sun Carnival', dish: ['Nướng, ăn vặt, xem show ven biển', 'Grills, street snacks and seaside shows'], address: 'Sun World Hạ Long, Bãi Cháy', price: [80000, 250000] },
        ],
        stays: [
            { area: ['Bãi Cháy', 'Bai Chay'], type: 'hotel', price: [500000, 1500000], note: ['Gần bến tàu Tuần Châu, Sun World, nhiều nhà hàng.', 'Close to Tuan Chau pier, Sun World and plenty of restaurants.'] },
            { area: ['Du thuyền ngủ đêm trên vịnh', 'Overnight cruise on the bay'], type: 'boat', price: [2500000, 6000000], note: ['Trọn gói ăn uống, chèo kayak – nên đặt trước 1–2 tuần.', 'Meals and kayaking included – book 1–2 weeks ahead.'] },
            { area: ['Đảo Tuần Châu', 'Tuan Chau Island'], type: 'resort', price: [1200000, 3000000], note: ['Yên tĩnh, ngay bến du thuyền.', 'Quiet, right next to the cruise port.'] },
        ],
    },
    'sa-pa': {
        city: 'Sa Pa',
        airport: 'HAN',
        rail: 'Lào Cai',
        getThere: ['Xe giường nằm/limousine từ Hà Nội ~5,5 giờ (cao tốc Nội Bài – Lào Cai), hoặc tàu đêm tới ga Lào Cai rồi đi xe 35 km lên Sa Pa.', 'Sleeper bus or limousine from Hanoi ~5.5 h via the expressway, or the night train to Lao Cai then 35 km by road.'],
        eats: [
            { name: 'Chợ đêm Sa Pa', dish: ['Đồ nướng: thịt xiên, trứng nướng, cơm lam', 'Grilled skewers, eggs and bamboo-tube rice'], address: 'Khu quảng trường – nhà thờ đá Sa Pa', price: [50000, 150000] },
            { name: 'Lẩu cá hồi phố Xuân Viên', dish: ['Lẩu cá hồi, cá tầm nuôi nước lạnh', 'Salmon and sturgeon hotpot'], address: 'Phố Xuân Viên, Sa Pa', price: [200000, 400000] },
            { name: 'Nhà hàng Little Sapa', dish: ['Thắng cố, lợn cắp nách, rau rừng', 'Thang co stew, free-range pork, wild greens'], address: 'Đường Cầu Mây, Sa Pa', price: [150000, 300000] },
            { name: 'Quán Thắng Cố chợ Sa Pa', dish: ['Thắng cố, mèn mén, rượu ngô', 'Thang co, corn cake and corn wine'], address: 'Chợ trung tâm Sa Pa', price: [60000, 150000] },
        ],
        stays: [
            { area: ['Trung tâm thị xã (Cầu Mây, Xuân Viên)', 'Town centre (Cau May, Xuan Vien)'], type: 'hotel', price: [400000, 1200000], note: ['Đi bộ tới chợ đêm, nhà thờ đá, dễ đặt xe.', 'Walk to the night market and stone church, easy transport.'] },
            { area: ['Bản Tả Van – Lao Chải', 'Ta Van – Lao Chai villages'], type: 'homestay', price: [250000, 700000], note: ['Ngủ giữa ruộng bậc thang, có bữa tối cùng chủ nhà.', 'Sleep among the rice terraces with family dinners.'] },
            { area: ['Đồi Mường Hoa', 'Muong Hoa valley'], type: 'resort', price: [1500000, 4000000], note: ['View thung lũng, hồ bơi – hợp nghỉ dưỡng.', 'Valley views and pools – great for a relaxing stay.'] },
        ],
    },
    'ha-noi': {
        city: 'Hanoi',
        airport: 'HAN',
        rail: 'Hà Nội',
        getThere: ['Sân bay Nội Bài (HAN) cách phố cổ ~30 km: xe bus 86 (~45 phút) hoặc taxi/Grab ~250–350k. Ga Hà Nội nằm ở trung tâm.', 'Noi Bai Airport (HAN) is ~30 km from the Old Quarter: bus 86 (~45 min) or taxi/Grab ~250–350k VND. Hanoi Station is central.'],
        eats: [
            { name: 'Phở Bát Đàn', dish: ['Phở bò tái nạm, xếp hàng tự bưng', 'Beef pho – queue and self-serve'], address: '49 Bát Đàn, Hoàn Kiếm', price: [50000, 70000] },
            { name: 'Bún chả Hương Liên', dish: ['Bún chả, nem cua bể ("combo Obama")', 'Bun cha and crab spring rolls (the "Obama combo")'], address: '24 Lê Văn Hưu, Hai Bà Trưng', price: [50000, 100000] },
            { name: 'Chả cá Thăng Long', dish: ['Chả cá Lã Vọng rán tại bàn với thì là', 'Turmeric fish sizzled at the table with dill'], address: '21 Đường Thành, Hoàn Kiếm', price: [150000, 200000] },
            { name: 'Cà phê Giảng', dish: ['Cà phê trứng nguyên bản', 'The original egg coffee'], address: '39 Nguyễn Hữu Huân, Hoàn Kiếm', price: [30000, 50000] },
        ],
        stays: [
            { area: ['Phố cổ Hoàn Kiếm', 'Old Quarter (Hoan Kiem)'], type: 'hotel', price: [500000, 1500000], note: ['Đi bộ tới hồ Gươm, phố đi bộ, chợ đêm.', 'Walk to Hoan Kiem Lake, the walking street and night market.'] },
            { area: ['Tây Hồ', 'Tay Ho (West Lake)'], type: 'homestay', price: [400000, 1000000], note: ['Yên tĩnh, nhiều cà phê view hồ.', 'Quieter, lots of lakeside cafés.'] },
            { area: ['Ba Đình – quanh Lăng Bác', 'Ba Dinh'], type: 'hotel', price: [700000, 2000000], note: ['Gần Lăng Bác, Văn Miếu, khách sạn lớn.', 'Near the Mausoleum, Temple of Literature and larger hotels.'] },
        ],
    },
    'ninh-binh': {
        city: 'Ninh Binh',
        airport: 'HAN',
        rail: 'Ninh Bình',
        getThere: ['Cách Hà Nội ~95 km: limousine/xe khách ~2 giờ, hoặc tàu hỏa tới ga Ninh Bình (~2,5 giờ). Thuê xe đạp/xe máy để đi Tràng An, Tam Cốc.', '~95 km from Hanoi: limousine or bus ~2 h, or train to Ninh Binh Station (~2.5 h). Rent a bike or scooter for Trang An and Tam Coc.'],
        eats: [
            { name: 'Nhà hàng dê núi Chính Thư', dish: ['Dê tái chanh, dê nướng, cơm cháy', 'Goat with lime, grilled goat, crispy rice'], address: 'Đường Tràng An, TP Ninh Bình', price: [150000, 300000] },
            { name: 'Quán cơm cháy Tam Cốc', dish: ['Cơm cháy chà bông, gỏi dê', 'Crispy rice with pork floss, goat salad'], address: 'Phố Tam Cốc, Hoa Lư', price: [100000, 200000] },
            { name: 'Bún mọc – miến lươn chợ Rồng', dish: ['Miến lươn, bún mọc bữa sáng', 'Eel glass noodles and pork-ball noodle soup'], address: 'Chợ Rồng, TP Ninh Bình', price: [35000, 60000] },
            { name: 'Nhà hàng Hang Múa', dish: ['Cơm quê view núi, gà đồi', 'Country meals with mountain views'], address: 'Khu Hang Múa, Hoa Lư', price: [120000, 250000] },
        ],
        stays: [
            { area: ['Tam Cốc', 'Tam Coc'], type: 'homestay', price: [300000, 900000], note: ['Giữa đồng lúa, gần Hang Múa, bến thuyền Tam Cốc.', 'Among rice fields, near Mua Cave and the Tam Coc boats.'] },
            { area: ['Tràng An – Bái Đính', 'Trang An – Bai Dinh'], type: 'resort', price: [1200000, 3500000], note: ['Resort ven núi đá vôi, yên tĩnh.', 'Resorts set among karsts, very quiet.'] },
            { area: ['TP Ninh Bình', 'Ninh Binh city'], type: 'hotel', price: [350000, 900000], note: ['Gần ga tàu, bến xe, giá mềm.', 'Near the train and bus stations, budget-friendly.'] },
        ],
    },
    'ha-giang': {
        city: 'Ha Giang',
        airport: 'HAN',
        getThere: ['Xe giường nằm Hà Nội – Hà Giang ~6–7 giờ (thường chạy đêm). Đi cung Đồng Văn – Mã Pì Lèng bằng xe máy tự lái hoặc thuê tài xế "easy rider".', 'Sleeper bus Hanoi – Ha Giang ~6–7 h (often overnight). Ride the Dong Van – Ma Pi Leng loop on a scooter or hire an "easy rider" driver.'],
        eats: [
            { name: 'Chợ đêm TP Hà Giang', dish: ['Cháo ấu tẩu, bánh cuốn trứng', 'Au tau porridge, egg rice rolls'], address: 'Đường Nguyễn Thái Học, TP Hà Giang', price: [30000, 70000] },
            { name: 'Phố cổ Đồng Văn', dish: ['Bánh cuốn trứng canh xương, thắng cố', 'Rice rolls in bone broth, thang co'], address: 'Phố cổ Đồng Văn', price: [30000, 100000] },
            { name: 'Chợ phiên Đồng Văn (Chủ nhật)', dish: ['Thắng cố, rượu ngô, bánh tam giác mạch', 'Thang co, corn wine, buckwheat cakes'], address: 'Chợ Đồng Văn', price: [30000, 100000] },
            { name: 'Quán thịt trâu gác bếp Yên Minh', dish: ['Thịt trâu gác bếp, lạp xưởng hun khói', 'Smoked buffalo, smoked sausages'], address: 'Thị trấn Yên Minh', price: [100000, 250000] },
        ],
        stays: [
            { area: ['TP Hà Giang (đêm đầu)', 'Ha Giang city (first night)'], type: 'hotel', price: [300000, 700000], note: ['Nghỉ sau chuyến xe đêm, thuê xe máy.', 'Rest after the night bus and rent your scooter.'] },
            { area: ['Phố cổ Đồng Văn', 'Dong Van old town'], type: 'homestay', price: [250000, 600000], note: ['Điểm nghỉ chính trước Mã Pì Lèng.', 'The main overnight stop before Ma Pi Leng.'] },
            { area: ['Làng Lô Lô Chải – Lũng Cú', 'Lo Lo Chai – Lung Cu'], type: 'homestay', price: [300000, 700000], note: ['Nhà trình tường cổ, gần cột cờ Lũng Cú.', 'Rammed-earth houses near the Lung Cu flag tower.'] },
        ],
    },
    'ban-gioc': {
        city: 'Cao Bang',
        airport: 'HAN',
        getThere: ['Xe giường nằm Hà Nội – TP Cao Bằng ~7 giờ, thêm ~2 giờ tới Trùng Khánh (thác Bản Giốc). Nhiều tour 2 ngày 1 đêm từ Hà Nội.', 'Sleeper bus Hanoi – Cao Bang city ~7 h, then ~2 h to Trung Khanh (Ban Gioc falls). Many 2-day tours from Hanoi.'],
        eats: [
            { name: 'Vịt quay 7 vị – chợ Xanh', dish: ['Vịt quay mắc mật, bánh áp chao', 'Roast duck with mac mat leaves, fried rice cakes'], address: 'Chợ Xanh, TP Cao Bằng', price: [80000, 200000] },
            { name: 'Phở chua Cao Bằng', dish: ['Phở chua, bánh cuốn canh', 'Sour pho, rice rolls in broth'], address: 'Phố Kim Đồng, TP Cao Bằng', price: [35000, 60000] },
            { name: 'Quán ăn Trùng Khánh', dish: ['Hạt dẻ Trùng Khánh, cá suối nướng', 'Trung Khanh chestnuts, grilled stream fish'], address: 'Thị trấn Trùng Khánh', price: [80000, 200000] },
            { name: 'Bánh cuốn canh Hải Ghi', dish: ['Bánh cuốn canh xương, trứng', 'Rice rolls in bone broth with egg'], address: 'TP Cao Bằng', price: [30000, 50000] },
        ],
        stays: [
            { area: ['Gần thác Bản Giốc', 'Near Ban Gioc falls'], type: 'homestay', price: [300000, 800000], note: ['Ngắm thác sáng sớm khi vắng khách.', 'See the falls early before the crowds.'] },
            { area: ['Thị trấn Trùng Khánh', 'Trung Khanh town'], type: 'hotel', price: [300000, 600000], note: ['Tiện đi thác, động Ngườm Ngao.', 'Handy for the falls and Nguom Ngao cave.'] },
            { area: ['TP Cao Bằng', 'Cao Bang city'], type: 'hotel', price: [400000, 1000000], note: ['Đêm đầu/cuối, gần bến xe.', 'First/last night, near the bus station.'] },
        ],
    },
    'cat-ba': {
        city: 'Cat Ba',
        airport: 'HPH',
        getThere: ['Xe combo Hà Nội – Cát Bà (xe + tàu cao tốc) ~3,5 giờ; hoặc từ Hải Phòng đi tàu cao tốc Bính – Cát Bà ~1 giờ.', 'Hanoi – Cat Ba combo tickets (bus + speedboat) ~3.5 h; or from Hai Phong take the Binh – Cat Ba speedboat ~1 h.'],
        eats: [
            { name: 'Phố hải sản Núi Ngọc', dish: ['Tu hài nướng, ghẹ hấp, cá song', 'Grilled geoduck, steamed crab, grouper'], address: 'Đường Núi Ngọc, thị trấn Cát Bà', price: [250000, 600000] },
            { name: 'Chợ Cát Bà', dish: ['Mua hải sản rồi nhờ quán chế biến', 'Buy seafood and have it cooked nearby'], address: 'Đường 1/4, thị trấn Cát Bà', price: [150000, 400000] },
            { name: 'Bánh đa cua Cát Bà', dish: ['Bánh đa cua đỏ kiểu Hải Phòng', 'Hai Phong-style red crab noodle soup'], address: 'Thị trấn Cát Bà', price: [35000, 60000] },
            { name: 'Nhà bè Lan Hạ', dish: ['Hải sản trên bè nổi vịnh Lan Hạ', 'Seafood on floating rafts in Lan Ha Bay'], address: 'Vịnh Lan Hạ (đi tàu)', price: [300000, 700000] },
        ],
        stays: [
            { area: ['Thị trấn Cát Bà', 'Cat Ba town'], type: 'hotel', price: [400000, 1200000], note: ['Gần bến tàu đi vịnh Lan Hạ, phố ăn uống.', 'Near Lan Ha Bay boats and restaurants.'] },
            { area: ['Bãi Cát Cò', 'Cat Co beaches'], type: 'resort', price: [1500000, 3500000], note: ['Sát bãi tắm đẹp nhất đảo.', 'Right on the island\'s best beaches.'] },
            { area: ['Làng Việt Hải', 'Viet Hai village'], type: 'homestay', price: [300000, 700000], note: ['Giữa vườn quốc gia, rất yên bình.', 'Inside the national park, very peaceful.'] },
        ],
    },
    'mu-cang-chai': {
        city: 'Mu Cang Chai',
        airport: 'HAN',
        getThere: ['Xe khách Hà Nội – Mù Cang Chải ~7–8 giờ qua Nghĩa Lộ, đèo Khau Phạ. Đẹp nhất mùa lúa chín cuối tháng 9 – đầu tháng 10.', 'Bus Hanoi – Mu Cang Chai ~7–8 h via Nghia Lo and Khau Pha pass. Best at harvest, late Sep – early Oct.'],
        eats: [
            { name: 'Chợ Mù Cang Chải', dish: ['Xôi ngũ sắc, cơm lam, bánh ngô', 'Five-colour sticky rice, bamboo rice, corn cakes'], address: 'Thị trấn Mù Cang Chải', price: [30000, 80000] },
            { name: 'Quán thịt trâu gác bếp', dish: ['Thịt trâu gác bếp, lợn bản nướng', 'Smoked buffalo, grilled local pork'], address: 'Thị trấn Mù Cang Chải', price: [120000, 250000] },
            { name: 'Cá suối nướng La Pán Tẩn', dish: ['Cá suối nướng, rau rừng xào', 'Grilled stream fish, stir-fried wild greens'], address: 'Xã La Pán Tẩn', price: [100000, 200000] },
            { name: 'Xôi Tú Lệ', dish: ['Xôi nếp Tú Lệ nổi tiếng, cốm mới', 'Famous Tu Le sticky rice, young green rice'], address: 'Thung lũng Tú Lệ (trên đường đi)', price: [30000, 60000] },
        ],
        stays: [
            { area: ['Bản Lìm Mông – Cao Phạ', 'Lim Mong – Cao Pha'], type: 'homestay', price: [250000, 600000], note: ['Ngay giữa ruộng bậc thang.', 'Right in the middle of the terraces.'] },
            { area: ['Thị trấn Mù Cang Chải', 'Mu Cang Chai town'], type: 'hotel', price: [300000, 700000], note: ['Tiện đi đồi Mâm Xôi, La Pán Tẩn.', 'Handy for Mam Xoi hill and La Pan Tan.'] },
            { area: ['Tú Lệ', 'Tu Le'], type: 'homestay', price: [300000, 700000], note: ['Có suối khoáng nóng, nghỉ giữa đường.', 'Hot springs – a good halfway stop.'] },
        ],
    },
    'hue': {
        city: 'Hue',
        airport: 'HUI',
        rail: 'Huế',
        getThere: ['Bay tới sân bay Phú Bài (HUI, cách trung tâm ~15 km) hoặc tàu hỏa tới ga Huế. Từ Đà Nẵng/Hội An đi xe qua hầm Hải Vân ~2–2,5 giờ.', 'Fly to Phu Bai (HUI, ~15 km from the centre) or take the train to Hue Station. From Da Nang/Hoi An it is ~2–2.5 h by road via the Hai Van tunnel.'],
        eats: [
            { name: 'Bún bò Mệ Kéo', dish: ['Bún bò Huế giò heo, chả cua', 'Hue beef noodle soup with pork knuckle and crab cake'], address: '20 Bạch Đằng, TP Huế', price: [40000, 60000] },
            { name: 'Quán Hạnh', dish: ['Bánh bèo, nậm, lọc, ram ít', 'Steamed rice cakes, banh nam, banh loc, ram it'], address: '11 Phó Đức Chính, TP Huế', price: [60000, 120000] },
            { name: 'Bánh khoái Lạc Thiện', dish: ['Bánh khoái giòn, nem lụi', 'Crispy banh khoai, lemongrass pork skewers'], address: '6 Đinh Tiên Hoàng, TP Huế', price: [50000, 100000] },
            { name: 'Chè Hẻm', dish: ['Chè Huế đủ loại', 'Every kind of Hue sweet soup'], address: '1 kiệt 29 Hùng Vương, TP Huế', price: [15000, 30000] },
        ],
        stays: [
            { area: ['Bờ Nam sông Hương (Lê Lợi, Phạm Ngũ Lão)', 'South bank (Le Loi, Pham Ngu Lao)'], type: 'hotel', price: [400000, 1500000], note: ['Đi bộ ra sông Hương, phố Tây, chợ đêm.', 'Walk to the Perfume River, backpacker street and night market.'] },
            { area: ['Nhà vườn Kim Long – Vỹ Dạ', 'Garden houses in Kim Long / Vy Da'], type: 'homestay', price: [500000, 1500000], note: ['Nhà rường cổ, yên tĩnh, đậm chất Huế.', 'Traditional wooden houses – calm and very Hue.'] },
            { area: ['Ven sông ngoại ô', 'Riverside outskirts'], type: 'resort', price: [1500000, 4000000], note: ['Resort sinh thái, gần lăng tẩm.', 'Eco-resorts near the royal tombs.'] },
        ],
    },
    'phong-nha': {
        city: 'Phong Nha',
        airport: 'VDH',
        rail: 'Đồng Hới',
        getThere: ['Bay hoặc đi tàu tới Đồng Hới (sân bay VDH / ga Đồng Hới), rồi xe ~1 giờ (45 km) tới thị trấn Phong Nha. Từ Huế đi xe ~3,5–4 giờ.', 'Fly or take the train to Dong Hoi (VDH airport / Dong Hoi Station), then ~1 h (45 km) by road to Phong Nha town. ~3.5–4 h by road from Hue.'],
        eats: [
            { name: 'Bamboo Café', dish: ['Món Việt & Tây, sinh tố, gặp dân phượt', 'Vietnamese & Western food, smoothies, traveller hangout'], address: 'Thị trấn Phong Nha, Bố Trạch', price: [60000, 150000] },
            { name: 'Quán gà nướng bên sông Son', dish: ['Gà nướng, cá sông Son', 'Grilled chicken, Son river fish'], address: 'Bờ sông Son, thị trấn Phong Nha', price: [100000, 250000] },
            { name: 'Bánh bột lọc Quảng Bình', dish: ['Bánh bột lọc tôm, cháo canh', 'Tapioca shrimp dumplings, chao canh noodle soup'], address: 'Chợ Phong Nha', price: [30000, 60000] },
            { name: 'The Pub with Cold Beer', dish: ['Gà ta tự nướng giữa vườn, bia lạnh', 'DIY grilled farm chicken in a garden, cold beer'], address: 'Thôn Cù Lạc, Phong Nha', price: [150000, 300000] },
        ],
        stays: [
            { area: ['Thị trấn Phong Nha', 'Phong Nha town'], type: 'hotel', price: [300000, 900000], note: ['Gần bến thuyền vào động Phong Nha, nhiều quán ăn.', 'Near the Phong Nha Cave boats and eateries.'] },
            { area: ['Làng Bồng Lai – Cù Lạc', 'Bong Lai – Cu Lac valley'], type: 'homestay', price: [300000, 800000], note: ['Farmstay giữa ruộng lúa, núi đá vôi.', 'Farmstays among rice fields and karsts.'] },
            { area: ['Ven sông Chày – Hang Tối', 'Chay river'], type: 'resort', price: [1200000, 3000000], note: ['Gần khu zipline Hang Tối.', 'Close to the Dark Cave zipline.'] },
        ],
    },
    'da-nang': {
        city: 'Da Nang',
        airport: 'DAD',
        rail: 'Đà Nẵng',
        getThere: ['Sân bay Đà Nẵng (DAD) chỉ cách trung tâm ~3 km, taxi/Grab ~80–120k. Ga Đà Nẵng nằm trên tuyến Bắc – Nam.', 'Da Nang Airport (DAD) is just ~3 km from the centre, taxi/Grab ~80–120k VND. Da Nang Station is on the North–South line.'],
        eats: [
            { name: 'Mì Quảng Bà Mua', dish: ['Mì Quảng tôm thịt, gà, ếch', 'Mi Quang with shrimp & pork, chicken or frog'], address: '19–21 Trần Bình Trọng, Hải Châu', price: [35000, 60000] },
            { name: 'Nhà hàng Trần', dish: ['Bánh tráng cuốn thịt heo hai đầu da', 'Rice paper rolls with boiled pork'], address: '4 Lê Duẩn, Hải Châu', price: [100000, 200000] },
            { name: 'Hải sản Bé Mặn', dish: ['Hải sản ven biển Mỹ Khê', 'Seafood by My Khe beach'], address: 'Võ Nguyên Giáp, Sơn Trà', price: [250000, 500000] },
            { name: 'Bún chả cá Bà Lữ', dish: ['Bún chả cá Đà Nẵng', 'Da Nang fish-cake noodle soup'], address: '319 Hùng Vương, Hải Châu', price: [30000, 50000] },
        ],
        stays: [
            { area: ['Biển Mỹ Khê (Võ Nguyên Giáp)', 'My Khe beach'], type: 'hotel', price: [500000, 1800000], note: ['View biển, gần quán hải sản.', 'Sea views, close to seafood spots.'] },
            { area: ['Trung tâm sông Hàn', 'Han River centre'], type: 'hotel', price: [400000, 1500000], note: ['Xem cầu Rồng phun lửa, gần chợ Hàn, chợ Cồn.', 'See the Dragon Bridge, near Han and Con markets.'] },
            { area: ['Bán đảo Sơn Trà – Non Nước', 'Son Tra / Non Nuoc'], type: 'resort', price: [2000000, 6000000], note: ['Resort biển riêng tư.', 'Private beach resorts.'] },
        ],
    },
    'hoi-an': {
        city: 'Hoi An',
        airport: 'DAD',
        rail: 'Đà Nẵng',
        getThere: ['Bay/tàu tới Đà Nẵng rồi đi taxi/Grab ~45 phút (30 km, ~300–400k) hoặc xe bus số 1 ra Hội An.', 'Fly or take the train to Da Nang, then ~45 min by taxi/Grab (30 km, ~300–400k VND) or local bus no. 1.'],
        eats: [
            { name: 'Bánh mì Phượng', dish: ['Bánh mì thập cẩm nổi tiếng', 'The famous mixed banh mi'], address: '2B Phan Châu Trinh, Hội An', price: [30000, 50000] },
            { name: 'Cơm gà Bà Buội', dish: ['Cơm gà xé Hội An', 'Hoi An shredded chicken rice'], address: '22 Phan Châu Trinh, Hội An', price: [40000, 60000] },
            { name: 'Cao lầu Thanh', dish: ['Cao lầu sợi dai, thịt xá xíu', 'Chewy cao lau noodles with char siu'], address: '26 Thái Phiên, Hội An', price: [35000, 50000] },
            { name: 'Morning Glory', dish: ['Món Hội An trong nhà cổ: hoành thánh, bánh xèo', 'Hoi An classics in an old house: wontons, banh xeo'], address: '106 Nguyễn Thái Học, Hội An', price: [100000, 250000] },
        ],
        stays: [
            { area: ['Quanh phố cổ (Trần Hưng Đạo, Bà Triệu)', 'Around the Old Town'], type: 'homestay', price: [400000, 1200000], note: ['Đi bộ 5–10 phút vào phố cổ.', '5–10 minutes\' walk to the Old Town.'] },
            { area: ['Biển An Bàng – Cửa Đại', 'An Bang – Cua Dai beach'], type: 'resort', price: [1000000, 3500000], note: ['Kết hợp tắm biển, đạp xe vào phố 15 phút.', 'Beach time plus a 15-min cycle to town.'] },
            { area: ['Làng rau Trà Quế – Cẩm Thanh', 'Tra Que – Cam Thanh'], type: 'homestay', price: [300000, 800000], note: ['Giữa ruộng rau, rừng dừa – rất yên tĩnh.', 'Among vegetable gardens and coconut groves – very quiet.'] },
        ],
    },
    'nha-trang': {
        city: 'Nha Trang',
        airport: 'CXR',
        rail: 'Nha Trang',
        getThere: ['Sân bay Cam Ranh (CXR) cách trung tâm ~35 km: xe bus/taxi ~40 phút. Ga Nha Trang nằm ngay trung tâm.', 'Cam Ranh Airport (CXR) is ~35 km from town: shuttle bus or taxi ~40 min. Nha Trang Station is right in the centre.'],
        eats: [
            { name: 'Bún chả cá Nguyên Loan', dish: ['Bún chả cá, bún sứa Nha Trang', 'Fish-cake and jellyfish noodle soup'], address: '123 Ngô Gia Tự, Nha Trang', price: [35000, 60000] },
            { name: 'Nem nướng Đặng Văn Quyên', dish: ['Nem nướng Ninh Hòa cuốn bánh tráng', 'Ninh Hoa grilled pork rolls'], address: '16A Lãn Ông, Nha Trang', price: [50000, 100000] },
            { name: 'Bánh căn 51 Tô Hiến Thành', dish: ['Bánh căn trứng, mực, chấm mắm nêm', 'Mini rice pancakes with egg or squid'], address: '51 Tô Hiến Thành, Nha Trang', price: [40000, 80000] },
            { name: 'Chợ Đầm', dish: ['Hải sản khô, ăn vặt, mua quà', 'Dried seafood, snacks and souvenirs'], address: 'Chợ Đầm, Nha Trang', price: [30000, 150000] },
        ],
        stays: [
            { area: ['Đường Trần Phú (ven biển)', 'Tran Phu beachfront'], type: 'hotel', price: [500000, 2000000], note: ['Ngay bãi biển trung tâm, phố đi bộ.', 'On the main beach and promenade.'] },
            { area: ['Bãi Dài – Cam Ranh', 'Bai Dai – Cam Ranh'], type: 'resort', price: [2000000, 7000000], note: ['Resort biển gần sân bay.', 'Beach resorts near the airport.'] },
            { area: ['Hòn Tre (VinWonders)', 'Hon Tre island'], type: 'resort', price: [2500000, 6000000], note: ['Hợp gia đình đi công viên giải trí.', 'Great for families visiting the theme park.'] },
        ],
    },
    'da-lat': {
        city: 'Da Lat',
        airport: 'DLI',
        getThere: ['Sân bay Liên Khương (DLI) cách trung tâm ~30 km. Xe giường nằm/limousine từ Sài Gòn ~7 giờ, từ Nha Trang ~3,5 giờ.', 'Lien Khuong Airport (DLI) is ~30 km from town. Sleeper bus or limousine from Saigon ~7 h, from Nha Trang ~3.5 h.'],
        eats: [
            { name: 'Bánh căn Nhà Chung', dish: ['Bánh căn trứng, xíu mại chấm', 'Mini rice pancakes with meatball dipping sauce'], address: '1 Nhà Chung, Đà Lạt', price: [30000, 60000] },
            { name: 'Lẩu gà lá é Tao Ngộ', dish: ['Lẩu gà lá é đặc sản', 'Chicken hotpot with e basil leaves'], address: '5 Ba Tháng Tư, Đà Lạt', price: [250000, 400000] },
            { name: 'Bánh mì xíu mại Hoàng Diệu', dish: ['Bánh mì chấm xíu mại buổi sáng', 'Banh mi with meatball soup for breakfast'], address: '26 Hoàng Diệu, Đà Lạt', price: [25000, 40000] },
            { name: 'Chợ đêm Đà Lạt', dish: ['Bánh tráng nướng, sữa đậu nành nóng', 'Grilled rice paper "pizza", hot soy milk'], address: 'Đường Nguyễn Thị Minh Khai, Đà Lạt', price: [20000, 80000] },
        ],
        stays: [
            { area: ['Trung tâm – hồ Xuân Hương', 'Centre – Xuan Huong Lake'], type: 'hotel', price: [400000, 1500000], note: ['Đi bộ ra chợ đêm, quảng trường.', 'Walk to the night market and square.'] },
            { area: ['Đồi thông ngoại ô (Trại Mát, Tà Nung)', 'Pine hills outside town'], type: 'homestay', price: [400000, 1200000], note: ['Homestay gỗ, view đồi thông, săn mây.', 'Wooden homestays with pine views, cloud hunting.'] },
            { area: ['Hồ Tuyền Lâm', 'Tuyen Lam Lake'], type: 'resort', price: [1500000, 4500000], note: ['Resort giữa rừng thông ven hồ.', 'Resorts in pine forest by the lake.'] },
        ],
    },
    'mui-ne': {
        city: 'Mui Ne',
        airport: 'SGN',
        rail: 'Phan Thiết',
        getThere: ['Từ Sài Gòn: cao tốc ~3,5 giờ bằng xe khách/limousine, hoặc tàu hỏa SE tới ga Phan Thiết (~4 giờ) rồi taxi ~20 phút.', 'From Saigon: ~3.5 h on the expressway by bus or limousine, or the train to Phan Thiet Station (~4 h) then a 20-min taxi.'],
        eats: [
            { name: 'Phố hải sản Hàm Tiến', dish: ['Hải sản tươi, sò điệp nướng mỡ hành', 'Fresh seafood, scallops with scallion oil'], address: 'Nguyễn Đình Chiểu, Hàm Tiến, Mũi Né', price: [200000, 500000] },
            { name: 'Làng chài Mũi Né', dish: ['Mua hải sản sáng sớm ngay bãi', 'Buy seafood on the beach at dawn'], address: 'Làng chài Mũi Né', price: [100000, 300000] },
            { name: 'Bánh căn Phan Thiết', dish: ['Bánh căn, bánh xèo mực', 'Mini rice pancakes, squid banh xeo'], address: 'TP Phan Thiết', price: [30000, 60000] },
            { name: 'Lẩu thả Phan Thiết', dish: ['Lẩu thả cá mai đặc sản', 'Lau tha – anchovy "hotpot" salad'], address: 'Phan Thiết – Mũi Né', price: [150000, 300000] },
        ],
        stays: [
            { area: ['Hàm Tiến – Nguyễn Đình Chiểu', 'Ham Tien strip'], type: 'resort', price: [700000, 2500000], note: ['Dãy resort ven biển, gần phố ăn uống.', 'Beachfront resorts near the food strip.'] },
            { area: ['Gần Đồi Cát Bay', 'Near the Red Sand Dunes'], type: 'homestay', price: [300000, 700000], note: ['Giá mềm, tiện ngắm bình minh đồi cát.', 'Budget-friendly, handy for dune sunrises.'] },
            { area: ['Phan Thiết – Tiến Thành', 'Phan Thiet – Tien Thanh'], type: 'resort', price: [1500000, 4000000], note: ['Resort mới, yên tĩnh.', 'Newer, quieter resorts.'] },
        ],
    },
    'quy-nhon': {
        city: 'Quy Nhon',
        airport: 'UIH',
        rail: 'Diêu Trì',
        getThere: ['Sân bay Phù Cát (UIH) cách TP ~30 km; ga Diêu Trì cách ~10 km. Từ Đà Nẵng/Nha Trang đi xe ~5–6 giờ.', 'Phu Cat Airport (UIH) is ~30 km from the city; Dieu Tri Station ~10 km. ~5–6 h by road from Da Nang or Nha Trang.'],
        eats: [
            { name: 'Bánh xèo tôm nhảy Diên Hồng', dish: ['Bánh xèo tôm nhảy giòn rụm', 'Crispy banh xeo with jumping shrimp'], address: 'Đường Diên Hồng, Quy Nhơn', price: [40000, 80000] },
            { name: 'Bún chả cá Quy Nhơn', dish: ['Bún chả cá nước trong', 'Clear-broth fish-cake noodle soup'], address: 'Đường Phan Bội Châu, Quy Nhơn', price: [30000, 50000] },
            { name: 'Phố ăn vặt Ngô Văn Sở', dish: ['Bánh hỏi cháo lòng, nem chợ Huyện', 'Banh hoi with offal congee, Cho Huyen nem'], address: 'Ngô Văn Sở, Quy Nhơn', price: [30000, 80000] },
            { name: 'Hải sản Eo Gió – Nhơn Lý', dish: ['Hải sản làng chài, gỏi cá mai', 'Village seafood, raw anchovy salad'], address: 'Xã Nhơn Lý', price: [200000, 450000] },
        ],
        stays: [
            { area: ['Ven biển Xuân Diệu – An Dương Vương', 'City beachfront'], type: 'hotel', price: [500000, 1500000], note: ['Biển ngay trung tâm, nhiều quán ăn.', 'Beach in the city centre, lots of food.'] },
            { area: ['Bán đảo Phương Mai – Nhơn Lý', 'Phuong Mai peninsula'], type: 'resort', price: [1500000, 4000000], note: ['Gần Eo Gió, Kỳ Co.', 'Near Eo Gio and Ky Co.'] },
            { area: ['Ghềnh Ráng – Bãi Xép', 'Ghenh Rang – Bai Xep'], type: 'homestay', price: [300000, 800000], note: ['Homestay làng chài ven vịnh.', 'Fishing-village homestays by the cove.'] },
        ],
    },
    'phu-yen': {
        city: 'Tuy Hoa',
        airport: 'TBB',
        rail: 'Tuy Hòa',
        getThere: ['Sân bay Tuy Hòa (TBB) và ga Tuy Hòa ngay trong TP. Từ Quy Nhơn đi xe ~2 giờ, từ Nha Trang ~2,5 giờ.', 'Tuy Hoa Airport (TBB) and station are in the city. ~2 h by road from Quy Nhon, ~2.5 h from Nha Trang.'],
        eats: [
            { name: 'Mắt cá ngừ đại dương – ven biển Tuy Hòa', dish: ['Mắt cá ngừ tiềm thuốc bắc, gỏi cá ngừ', 'Tuna eye herbal stew, tuna salad'], address: 'Đường Độc Lập, TP Tuy Hòa', price: [80000, 250000] },
            { name: 'Sò huyết đầm Ô Loan', dish: ['Sò huyết nướng, hấp sả', 'Grilled or lemongrass-steamed blood cockles'], address: 'Đầm Ô Loan, Tuy An', price: [100000, 250000] },
            { name: 'Bánh canh hẹ Tuy Hòa', dish: ['Bánh canh hẹ chả cá', 'Chive noodle soup with fish cake'], address: 'TP Tuy Hòa', price: [25000, 45000] },
            { name: 'Bánh xèo – bánh căn Phú Yên', dish: ['Bánh xèo nhỏ, bánh căn chấm mắm', 'Mini banh xeo and banh can'], address: 'Chợ Tuy Hòa', price: [30000, 60000] },
        ],
        stays: [
            { area: ['TP Tuy Hòa ven biển', 'Tuy Hoa beachfront'], type: 'hotel', price: [400000, 1200000], note: ['Gần tháp Nhạn, chợ, quán ăn.', 'Near Nhan tower, the market and eateries.'] },
            { area: ['Gành Đá Đĩa – An Ninh Đông', 'Ganh Da Dia area'], type: 'homestay', price: [250000, 600000], note: ['Ngắm bình minh gành đá sớm.', 'Catch sunrise at the basalt columns.'] },
            { area: ['Bãi Xép – Mũi Điện', 'Bai Xep – Mui Dien'], type: 'resort', price: [1200000, 3000000], note: ['Gần điểm đón bình minh sớm nhất.', 'Near the country\'s easternmost sunrise point.'] },
        ],
    },
    'sai-gon': {
        city: 'Ho Chi Minh City',
        airport: 'SGN',
        rail: 'Sài Gòn',
        getThere: ['Sân bay Tân Sơn Nhất (SGN) cách Quận 1 ~7 km: bus 109 hoặc taxi/Grab ~100–150k. Ga Sài Gòn ở Quận 3.', 'Tan Son Nhat Airport (SGN) is ~7 km from District 1: bus 109 or taxi/Grab ~100–150k VND. Saigon Station is in District 3.'],
        eats: [
            { name: 'Bánh mì Huỳnh Hoa', dish: ['Bánh mì pate "khổng lồ"', 'The famously loaded pâté banh mi'], address: '26 Lê Thị Riêng, Quận 1', price: [60000, 80000] },
            { name: 'Cơm tấm Ba Ghiền', dish: ['Cơm tấm sườn nướng miếng lớn', 'Broken rice with giant grilled pork chop'], address: '84 Đặng Văn Ngữ, Phú Nhuận', price: [60000, 100000] },
            { name: 'Phở Hòa Pasteur', dish: ['Phở bò kiểu Nam, nhiều rau', 'Southern-style beef pho with herbs'], address: '260C Pasteur, Quận 3', price: [80000, 110000] },
            { name: 'Bánh xèo 46A Đinh Công Tráng', dish: ['Bánh xèo miền Tây cỡ lớn', 'Giant Mekong-style banh xeo'], address: '46A Đinh Công Tráng, Quận 1', price: [80000, 150000] },
        ],
        stays: [
            { area: ['Quận 1 (Bến Thành – Nguyễn Huệ)', 'District 1 (Ben Thanh – Nguyen Hue)'], type: 'hotel', price: [600000, 2500000], note: ['Đi bộ tới chợ Bến Thành, phố đi bộ.', 'Walk to Ben Thanh market and the walking street.'] },
            { area: ['Quận 3', 'District 3'], type: 'homestay', price: [400000, 1200000], note: ['Yên tĩnh hơn, nhiều quán ăn địa phương.', 'Quieter, full of local eateries.'] },
            { area: ['Phố Tây Bùi Viện', 'Bui Vien backpacker street'], type: 'hotel', price: [300000, 800000], note: ['Giá rẻ, sôi động về đêm (khá ồn).', 'Cheap and lively at night (can be noisy).'] },
        ],
    },
    'can-tho': {
        city: 'Can Tho',
        airport: 'VCA',
        getThere: ['Sân bay Cần Thơ (VCA) cách trung tâm ~10 km. Từ Sài Gòn xe khách/limousine ~3,5 giờ (170 km).', 'Can Tho Airport (VCA) is ~10 km from the centre. ~3.5 h by bus or limousine from Saigon (170 km).'],
        eats: [
            { name: 'Chợ nổi Cái Răng', dish: ['Hủ tiếu, cà phê bán trên ghe lúc bình minh', 'Noodle soup and coffee served from boats at dawn'], address: 'Chợ nổi Cái Răng (đi thuyền từ bến Ninh Kiều)', price: [30000, 60000] },
            { name: 'Lẩu mắm Dạ Lý', dish: ['Lẩu mắm miền Tây đủ loại rau', 'Mekong fermented-fish hotpot with many greens'], address: '89 Đường 3/2, Ninh Kiều', price: [150000, 300000] },
            { name: 'Bánh cống Cô Út', dish: ['Bánh cống tôm, bánh xèo', 'Shrimp fritters, banh xeo'], address: 'Ninh Kiều, Cần Thơ', price: [40000, 80000] },
            { name: 'Chợ đêm Ninh Kiều', dish: ['Ăn vặt, trái cây miền Tây ven sông', 'Street snacks and Mekong fruit by the river'], address: 'Bến Ninh Kiều, Cần Thơ', price: [30000, 100000] },
        ],
        stays: [
            { area: ['Bến Ninh Kiều', 'Ninh Kieu riverfront'], type: 'hotel', price: [400000, 1500000], note: ['Gần bến thuyền đi chợ nổi sáng sớm.', 'Near the boats for the dawn floating market.'] },
            { area: ['Cồn Sơn – Mỹ Khánh', 'Con Son islet – My Khanh'], type: 'homestay', price: [300000, 800000], note: ['Nhà vườn giữa vườn trái cây.', 'Garden homestays among fruit orchards.'] },
            { area: ['Cồn Ấu – ven sông Hậu', 'Con Au – Hau river'], type: 'resort', price: [1500000, 3500000], note: ['Resort sinh thái trên cù lao.', 'Eco-resorts on river islets.'] },
        ],
    },
    'phu-quoc': {
        city: 'Phu Quoc',
        airport: 'PQC',
        getThere: ['Bay tới sân bay Phú Quốc (PQC) – từ Sài Gòn ~1 giờ, từ Hà Nội ~2 giờ. Hoặc tàu cao tốc từ Rạch Giá/Hà Tiên ~1,5–2,5 giờ.', 'Fly to Phu Quoc (PQC) – ~1 h from Saigon, ~2 h from Hanoi. Or take a fast ferry from Rach Gia / Ha Tien (~1.5–2.5 h).'],
        eats: [
            { name: 'Bún quậy Kiến Xây', dish: ['Bún quậy tự pha nước chấm', 'Bun quay – stir your own dipping sauce'], address: '28 Bạch Đằng, Dương Đông', price: [40000, 60000] },
            { name: 'Chợ đêm Phú Quốc', dish: ['Hải sản nướng, gỏi cá trích, kem cuộn', 'Grilled seafood, herring salad, rolled ice cream'], address: 'Đường Bạch Đằng, Dương Đông', price: [100000, 400000] },
            { name: 'Làng chài Hàm Ninh', dish: ['Ghẹ Hàm Ninh luộc, nhum nướng', 'Boiled Ham Ninh crab, grilled sea urchin'], address: 'Làng chài Hàm Ninh', price: [200000, 500000] },
            { name: 'Gỏi cá trích Nam Đảo', dish: ['Gỏi cá trích cuốn bánh tráng', 'Raw herring salad rolls'], address: 'An Thới – Nam đảo', price: [120000, 250000] },
        ],
        stays: [
            { area: ['Dương Đông – Bãi Trường', 'Duong Dong – Long Beach'], type: 'hotel', price: [500000, 2500000], note: ['Gần chợ đêm, hoàng hôn Bãi Trường.', 'Near the night market and Long Beach sunsets.'] },
            { area: ['Bãi Sao – An Thới (Nam đảo)', 'Sao Beach – An Thoi (south)'], type: 'resort', price: [1500000, 5000000], note: ['Gần cáp treo Hòn Thơm, lặn ngắm san hô.', 'Near the Hon Thom cable car and snorkelling.'] },
            { area: ['Gành Dầu – Bãi Dài (Bắc đảo)', 'Ganh Dau – Bai Dai (north)'], type: 'resort', price: [2000000, 6000000], note: ['Gần VinWonders, Safari; biển vắng.', 'Near VinWonders and Safari; quiet beaches.'] },
        ],
    },
    'vung-tau': {
        city: 'Vung Tau',
        airport: 'SGN',
        getThere: ['Từ Sài Gòn: xe khách/limousine ~2 giờ, hoặc tàu cao tốc từ bến Bạch Đằng ~2 giờ.', 'From Saigon: bus or limousine ~2 h, or the fast boat from Bach Dang pier ~2 h.'],
        eats: [
            { name: 'Bánh khọt Gốc Vú Sữa', dish: ['Bánh khọt tôm giòn cuốn rau', 'Crispy shrimp banh khot with herbs'], address: '14 Nguyễn Trường Tộ, Vũng Tàu', price: [60000, 120000] },
            { name: 'Lẩu cá đuối Hoàng Hoa Thám', dish: ['Lẩu cá đuối chua cay', 'Sour-spicy stingray hotpot'], address: 'Đường Hoàng Hoa Thám, Vũng Tàu', price: [150000, 300000] },
            { name: 'Hải sản Gành Hào', dish: ['Hải sản view biển Bãi Dâu', 'Seafood with sea views at Bai Dau'], address: '3 Trần Phú, Vũng Tàu', price: [300000, 600000] },
            { name: 'Bánh bông lan trứng muối Vũng Tàu', dish: ['Quà mang về đặc trưng', 'The classic salted-egg sponge cake to take home'], address: 'Đường Thùy Vân, Vũng Tàu', price: [80000, 150000] },
        ],
        stays: [
            { area: ['Bãi Sau (Thùy Vân)', 'Back Beach (Thuy Van)'], type: 'hotel', price: [500000, 1800000], note: ['Biển tắm đẹp nhất, nhiều quán hải sản.', 'The best swimming beach with seafood spots.'] },
            { area: ['Bãi Trước – trung tâm', 'Front Beach – centre'], type: 'hotel', price: [400000, 1200000], note: ['Gần tượng Chúa Kitô, ngọn hải đăng.', 'Near the Christ statue and lighthouse.'] },
            { area: ['Long Hải – Hồ Tràm', 'Long Hai – Ho Tram'], type: 'resort', price: [1500000, 5000000], note: ['Resort biển yên tĩnh cách 30–60 phút.', 'Quiet beach resorts 30–60 min away.'] },
        ],
    },
    'chau-doc': {
        city: 'Chau Doc',
        airport: 'VCA',
        getThere: ['Từ Sài Gòn xe khách ~6 giờ; từ Cần Thơ ~3 giờ. Có thể đi tàu cao tốc Châu Đốc – Phnom Penh.', '~6 h by bus from Saigon, ~3 h from Can Tho. Fast boats also run Chau Doc – Phnom Penh.'],
        eats: [
            { name: 'Bún cá Châu Đốc – chợ Châu Đốc', dish: ['Bún cá lóc nghệ, bông điên điển', 'Turmeric snakehead noodle soup'], address: 'Chợ Châu Đốc', price: [30000, 50000] },
            { name: 'Lẩu mắm Châu Đốc', dish: ['Lẩu mắm với mắm cá linh, cá sặc', 'Hotpot made with local fermented fish'], address: 'Đường Trưng Nữ Vương, Châu Đốc', price: [150000, 300000] },
            { name: 'Dãy mắm chợ Châu Đốc', dish: ['Mắm thái, mắm cá linh mang về', 'Pickled fish pastes to take home'], address: 'Chợ Châu Đốc', price: [50000, 200000] },
            { name: 'Bò bảy món Núi Sam', dish: ['Bò nướng lá lốt, bò bảy món', 'Beef seven ways, betel-leaf beef'], address: 'Chân Núi Sam', price: [150000, 300000] },
        ],
        stays: [
            { area: ['Trung tâm – ven sông Hậu', 'Centre – Hau riverside'], type: 'hotel', price: [350000, 1000000], note: ['Gần chợ, bến thuyền làng bè.', 'Near the market and floating-village boats.'] },
            { area: ['Chân Núi Sam', 'Foot of Sam Mountain'], type: 'hotel', price: [400000, 1500000], note: ['Gần miếu Bà Chúa Xứ, ngắm hoàng hôn.', 'Near Ba Chua Xu temple, sunset views.'] },
            { area: ['Rừng tràm Trà Sư', 'Tra Su forest area'], type: 'homestay', price: [300000, 700000], note: ['Mùa nước nổi (tháng 9–11) rất đẹp.', 'Lovely in the flood season (Sep–Nov).'] },
        ],
    },
    'con-dao': {
        city: 'Con Dao',
        airport: 'VCS',
        getThere: ['Bay từ Sài Gòn/Cần Thơ tới sân bay Côn Sơn (VCS) ~1 giờ; hoặc tàu cao tốc từ Vũng Tàu/Sóc Trăng (Trần Đề) ~2,5–4 giờ.', 'Fly from Saigon or Can Tho to Con Son (VCS) ~1 h; or a fast ferry from Vung Tau / Soc Trang (Tran De) ~2.5–4 h.'],
        eats: [
            { name: 'Chợ đêm Côn Đảo', dish: ['Hải sản nướng, bánh xèo, ốc', 'Grilled seafood, banh xeo, snails'], address: 'Đường Tôn Đức Thắng, Côn Sơn', price: [80000, 250000] },
            { name: 'Quán Thu Ba', dish: ['Hải sản, cá mú hấp, mực một nắng', 'Seafood, steamed grouper, sun-dried squid'], address: 'Đường Võ Văn Kiệt, Côn Sơn', price: [200000, 450000] },
            { name: 'Bánh canh chả cá Côn Đảo', dish: ['Bánh canh chả cá bữa sáng', 'Fish-cake noodle soup for breakfast'], address: 'Chợ Côn Đảo', price: [30000, 50000] },
            { name: 'Hạt bàng Côn Đảo', dish: ['Kẹo hạt bàng – quà đặc sản', 'Tropical almond candy – a local gift'], address: 'Chợ Côn Đảo', price: [100000, 250000] },
        ],
        stays: [
            { area: ['Thị trấn Côn Sơn', 'Con Son town'], type: 'hotel', price: [500000, 1500000], note: ['Gần chợ, di tích nhà tù, nghĩa trang Hàng Dương.', 'Near the market, prisons and Hang Duong cemetery.'] },
            { area: ['Ven vịnh Côn Sơn', 'Con Son Bay'], type: 'homestay', price: [400000, 1000000], note: ['Ngắm bình minh trên vịnh.', 'Watch sunrise over the bay.'] },
            { area: ['Bãi Đất Dốc', 'Dat Doc beach'], type: 'resort', price: [5000000, 15000000], note: ['Resort cao cấp, biển riêng.', 'Luxury resorts with private beaches.'] },
        ],
    },
}
