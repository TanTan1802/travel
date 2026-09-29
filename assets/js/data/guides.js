/*=============== CẨM NANG DU LỊCH ===============*/
/*
 * Mỗi bài: slug (đường dẫn cam-nang/<slug>/), icon Remix, tiêu đề, tóm tắt, các mục.
 * Chuỗi hai ngôn ngữ dạng [tiếng Việt, English]. Mục có thể gồm đoạn văn (paragraphs),
 * danh sách (list) hoặc widget tự sinh từ dữ liệu: 'months' (điểm đến đẹp theo tháng).
 * related: các điểm đến liên quan hiện ở cuối bài.
 */
const GUIDE_UPDATED = '2026-09'

const GUIDES = [
    {
        slug: 'thoi-diem-du-lich',
        icon: 'ri-calendar-event-line',
        title: ['Nên đi du lịch Việt Nam vào tháng nào?', 'When is the best time to visit Vietnam?'],
        summary: ['Khí hậu ba miền khác nhau hoàn toàn – đây là lịch gợi ý theo tháng để chọn điểm đến đẹp nhất.', 'The three regions have very different climates – here is a month-by-month guide to the best places to go.'],
        sections: [
            {
                heading: ['Ba miền, ba kiểu thời tiết', 'Three regions, three climates'],
                list: [
                    ['Miền Bắc có bốn mùa: đông lạnh (tháng 12 – 2, vùng núi có thể dưới 5°C), hè nóng ẩm và mưa nhiều (tháng 6 – 8). Đẹp nhất là tháng 3 – 5 và 9 – 11.', 'The North has four seasons: cold winters (Dec – Feb, below 5°C in the mountains), hot and rainy summers (Jun – Aug). The best months are Mar – May and Sep – Nov.'],
                    ['Miền Trung nắng đẹp từ tháng 2 – 8; tháng 9 – 12 là mùa mưa bão, dễ ngập lụt ở Huế, Hội An, Quảng Bình.', 'Central Vietnam is sunny from Feb – Aug; Sep – Dec is the rainy and typhoon season, with flooding in Hue, Hoi An and Quang Binh.'],
                    ['Miền Nam nóng quanh năm: mùa khô tháng 12 – 4, mùa mưa tháng 5 – 11 nhưng thường chỉ mưa rào buổi chiều.', 'The South is warm all year: dry season Dec – Apr, rainy season May – Nov, usually with short afternoon showers.'],
                    ['Tây Nguyên (Đà Lạt, Buôn Ma Thuột) mát mẻ, mùa khô tháng 11 – 4 là lúc đẹp nhất.', 'The Central Highlands (Da Lat, Buon Ma Thuot) are cool; the dry season Nov – Apr is best.'],
                ],
            },
            {
                heading: ['Điểm đến đẹp theo từng tháng', 'Where to go, month by month'],
                widget: 'months',
            },
            {
                heading: ['Lưu ý dịp Tết và lễ lớn', 'Tet and public holidays'],
                paragraphs: [
                    ['Tết Nguyên đán (cuối tháng 1 – giữa tháng 2 dương lịch) là dịp đông nhất năm: vé máy bay, xe khách tăng giá mạnh và cần đặt trước 1–2 tháng; nhiều quán ăn, cửa hàng đóng cửa 3–5 ngày đầu năm.', 'Lunar New Year (Tet – late January to mid-February) is the busiest time of year: flights and buses cost much more and need booking 1–2 months ahead; many eateries and shops close for the first 3–5 days.'],
                    ['Các kỳ nghỉ 30/4 – 1/5 và 2/9 cũng rất đông ở các điểm biển gần Hà Nội, Sài Gòn. Nếu có thể, hãy đi lệch vài ngày để có giá tốt và ít chen chúc.', 'The 30 April – 1 May and 2 September holidays are also packed at beaches near Hanoi and Saigon. Shift your dates by a few days for better prices and fewer crowds.'],
                ],
            },
            {
                heading: ['Mang theo gì?', 'What to pack'],
                list: [
                    ['Mùa đông miền Bắc và vùng núi: áo khoác dày, khăn, tất ấm.', 'Northern winter and mountains: a warm jacket, scarf and socks.'],
                    ['Miền Trung, miền Nam: kem chống nắng, mũ, áo mỏng, áo mưa gọn nhẹ.', 'Central and South: sunscreen, a hat, light clothes and a compact raincoat.'],
                    ['Trekking Sa Pa, Hà Giang, Pù Luông: giày có độ bám tốt, thuốc chống côn trùng.', 'Trekking in Sa Pa, Ha Giang or Pu Luong: shoes with good grip and insect repellent.'],
                    ['Đi chùa, đền: trang phục kín vai và đầu gối.', 'Temples and pagodas: clothes that cover shoulders and knees.'],
                ],
            },
        ],
        related: ['sa-pa', 'hoi-an', 'da-lat', 'phu-quoc'],
    },
    {
        slug: 'di-chuyen',
        icon: 'ri-route-line',
        title: ['Di chuyển ở Việt Nam: máy bay, tàu, xe khách hay xe máy?', 'Getting around Vietnam: planes, trains, buses or scooters?'],
        summary: ['So sánh các phương tiện giữa các thành phố và trong nội đô, kèm mẹo đặt vé tiết kiệm.', 'How to travel between and within cities, with tips for booking cheaper tickets.'],
        sections: [
            {
                heading: ['Máy bay – nhanh nhất cho quãng đường xa', 'Flights – fastest for long distances'],
                paragraphs: [
                    ['Các hãng nội địa phổ biến: Vietnam Airlines, Vietjet Air, Bamboo Airways, Vietravel Airlines. Hà Nội – Sài Gòn chỉ khoảng 2 giờ bay. Vé rẻ nhất khi đặt sớm 3–6 tuần và tránh cuối tuần, lễ Tết.', 'Main domestic airlines are Vietnam Airlines, Vietjet Air, Bamboo Airways and Vietravel Airlines. Hanoi – Saigon takes about 2 hours. Fares are lowest 3–6 weeks ahead, avoiding weekends and holidays.'],
                    ['Vé giá rẻ thường chỉ gồm 7kg hành lý xách tay – mua thêm ký gửi khi đặt vé sẽ rẻ hơn mua ở sân bay.', 'Budget fares usually include only 7 kg of cabin baggage – adding checked bags when booking is cheaper than at the airport.'],
                ],
            },
            {
                heading: ['Tàu hỏa Thống Nhất – chậm mà thú vị', 'The Reunification Express – slow but scenic'],
                paragraphs: [
                    ['Tuyến Hà Nội – Sài Gòn dài hơn 1.700 km, đi hết khoảng 30–35 giờ, qua Ninh Bình, Đồng Hới, Huế, Đà Nẵng, Nha Trang, Phan Thiết. Đoạn Huế – Đà Nẵng qua đèo Hải Vân là một trong những cung đường sắt đẹp nhất.', 'The Hanoi – Saigon line is over 1,700 km and takes about 30–35 hours, stopping at Ninh Binh, Dong Hoi, Hue, Da Nang, Nha Trang and Phan Thiet. The Hue – Da Nang stretch over Hai Van pass is one of the most beautiful rail journeys around.'],
                    ['Chọn giường nằm khoang 4 (điều hòa) cho chặng đêm. Mua vé chính thức tại dsvn.vn hoặc ga tàu.', 'Choose a 4-berth air-conditioned sleeper for overnight legs. Buy official tickets at dsvn.vn or at stations.'],
                ],
            },
            {
                heading: ['Xe khách, xe giường nằm và limousine', 'Buses, sleeper buses and limousine vans'],
                paragraphs: [
                    ['Đây là cách rẻ và phổ biến nhất để tới Sa Pa, Hà Giang, Ninh Bình, Đà Lạt, Mũi Né… Xe limousine 9–11 chỗ êm hơn, thường đón trả tận khách sạn. Đặt vé qua Vexere hoặc trực tiếp nhà xe có đánh giá tốt.', 'The cheapest and most common way to reach Sa Pa, Ha Giang, Ninh Binh, Da Lat, Mui Ne… 9–11-seat limousine vans are more comfortable and often pick up from hotels. Book via Vexere or directly with well-reviewed operators.'],
                ],
            },
            {
                heading: ['Trong thành phố', 'Getting around town'],
                list: [
                    ['Ứng dụng gọi xe Grab, Be, Xanh SM (xe điện): giá hiển thị trước, không phải mặc cả.', 'Ride-hailing apps Grab, Be and Xanh SM (electric): upfront prices, no haggling.'],
                    ['Hà Nội và TP.HCM có metro/đường sắt đô thị và xe buýt giá rẻ.', 'Hanoi and HCMC have metro/urban rail lines and cheap buses.'],
                    ['Thuê xe máy: bạn cần bằng lái hợp lệ tại Việt Nam, luôn đội mũ bảo hiểm và kiểm tra bảo hiểm du lịch có chi trả tai nạn xe máy không.', 'Renting a scooter: you need a licence valid in Vietnam, always wear a helmet and check whether your travel insurance covers scooter accidents.'],
                    ['Qua đường: đi chậm, đều và dứt khoát – xe sẽ tránh bạn; đừng đột ngột chạy hay lùi lại.', 'Crossing the street: walk slowly and steadily – traffic flows around you; never suddenly run or step back.'],
                ],
            },
        ],
        related: ['ha-noi', 'hue', 'da-nang', 'sai-gon'],
    },
    {
        slug: 'chi-phi-tien-te',
        icon: 'ri-wallet-3-line',
        title: ['Chi phí, tiền tệ và cách thanh toán', 'Costs, money and paying'],
        summary: ['Du lịch Việt Nam tốn bao nhiêu mỗi ngày, nên dùng tiền mặt hay thẻ, và những mẹo tiết kiệm hữu ích.', 'How much Vietnam costs per day, cash vs. cards, and useful money-saving tips.'],
        sections: [
            {
                heading: ['Ngân sách tham khảo mỗi ngày (1 người)', 'Daily budget guide (per person)'],
                list: [
                    ['Tiết kiệm: 500.000 – 900.000đ – homestay/nhà nghỉ, ăn quán địa phương, xe khách.', 'Budget: 500,000 – 900,000 VND – homestays/guesthouses, local eateries, buses.'],
                    ['Tầm trung: 1.200.000 – 2.500.000đ – khách sạn 3 sao, nhà hàng, vài tour trong ngày.', 'Mid-range: 1,200,000 – 2,500,000 VND – 3-star hotels, restaurants, a few day tours.'],
                    ['Cao cấp: từ 4.000.000đ – resort, du thuyền, xe riêng.', 'Upscale: 4,000,000 VND and up – resorts, cruises, private cars.'],
                ],
            },
            {
                heading: ['Tiền mặt, thẻ và chuyển khoản QR', 'Cash, cards and QR payments'],
                paragraphs: [
                    ['Đơn vị tiền là Việt Nam đồng (VND). Tiền mặt vẫn cần cho chợ, quán nhỏ, xe ôm. Rất nhiều nơi nhận chuyển khoản bằng mã QR (VietQR) nếu bạn có tài khoản ngân hàng Việt Nam hoặc ví điện tử hỗ trợ.', 'The currency is the Vietnamese dong (VND). Cash is still needed at markets, small eateries and motorbike taxis. Many places accept QR bank transfers (VietQR) if you have a Vietnamese bank account or a supported e-wallet.'],
                    ['Thẻ Visa/Mastercard dùng được ở khách sạn, siêu thị, nhà hàng lớn và cây ATM ở thành phố. Ở vùng núi, đảo nhỏ nên mang đủ tiền mặt.', 'Visa/Mastercard work in hotels, supermarkets, larger restaurants and city ATMs. In the mountains and on small islands, carry enough cash.'],
                    ['Các tờ 10.000đ và 100.000đ dễ nhầm lẫn khi mới quen, 20.000đ và 500.000đ cũng có màu xanh – hãy đếm kỹ khi trả tiền.', 'Notes are easy to mix up at first (the 20,000 and 500,000 VND notes are both blue) – count carefully when paying.'],
                ],
            },
            {
                heading: ['Mẹo tiết kiệm', 'Money-saving tips'],
                list: [
                    ['Hỏi giá trước khi gọi món ở quán hải sản, chợ đêm; ưu tiên nơi có bảng giá.', 'Ask prices before ordering at seafood spots and night markets; prefer places with price lists.'],
                    ['Mặc cả nhẹ nhàng ở chợ quà lưu niệm – không cần mặc cả ở cửa hàng có giá niêm yết.', 'Bargain politely at souvenir markets – not in shops with fixed prices.'],
                    ['Tiền tip không bắt buộc; có thể để lại 5–10% nếu hài lòng với hướng dẫn viên, tài xế.', 'Tipping is not required; 5–10% for good guides and drivers is appreciated.'],
                    ['Đi ngày thường, tránh lễ Tết để có giá phòng và vé rẻ hơn 20–50%.', 'Travel on weekdays and outside holidays for rooms and tickets 20–50% cheaper.'],
                ],
            },
        ],
        related: ['ha-giang', 'ninh-binh', 'can-tho', 'quy-nhon'],
    },
    {
        slug: 'am-thuc',
        icon: 'ri-restaurant-line',
        title: ['Ăn gì ở Việt Nam? Cẩm nang ẩm thực ba miền', 'What to eat in Vietnam: a food guide by region'],
        summary: ['Những món không thể bỏ lỡ ở từng miền, cách ăn đường phố an toàn và vài quy tắc nhỏ trên bàn ăn.', 'Must-try dishes in each region, how to eat street food safely and a few table manners.'],
        sections: [
            {
                heading: ['Miền Bắc: thanh, nhẹ, tinh tế', 'The North: clean, subtle flavours'],
                list: [
                    ['Phở bò, bún chả, chả cá Lã Vọng, bánh cuốn, cà phê trứng ở Hà Nội.', 'Beef pho, bun cha, turmeric fish, rice rolls and egg coffee in Hanoi.'],
                    ['Chả mực Hạ Long, bánh đa cua Hải Phòng, thắng cố và lợn cắp nách vùng cao.', 'Ha Long squid cakes, Hai Phong crab noodles, thang co and free-range pork in the highlands.'],
                ],
            },
            {
                heading: ['Miền Trung: đậm, cay, nhiều món nhỏ', 'Central: bold, spicy, lots of small dishes'],
                list: [
                    ['Bún bò Huế, bánh bèo – nậm – lọc, cơm hến ở Huế.', 'Hue beef noodle soup, banh beo, nam and loc, and clam rice in Hue.'],
                    ['Mì Quảng, bánh tráng cuốn thịt heo ở Đà Nẵng; cao lầu, cơm gà, bánh mì ở Hội An.', 'Mi Quang and pork rice-paper rolls in Da Nang; cao lau, chicken rice and banh mi in Hoi An.'],
                    ['Bún chả cá, nem nướng Nha Trang; bánh căn Đà Lạt, Phan Thiết.', 'Fish-cake noodles and grilled pork rolls in Nha Trang; banh can in Da Lat and Phan Thiet.'],
                ],
            },
            {
                heading: ['Miền Nam: ngọt, phóng khoáng, nhiều rau', 'The South: sweeter, generous, lots of herbs'],
                list: [
                    ['Cơm tấm, hủ tiếu, bánh mì, bánh xèo ở Sài Gòn.', 'Broken rice, hu tieu, banh mi and banh xeo in Saigon.'],
                    ['Lẩu mắm, bánh cống, trái cây miệt vườn ở Cần Thơ, Châu Đốc.', 'Fermented-fish hotpot, shrimp fritters and orchard fruit in Can Tho and Chau Doc.'],
                    ['Bún quậy, gỏi cá trích, ghẹ Hàm Ninh ở Phú Quốc.', 'Bun quay, herring salad and Ham Ninh crab in Phu Quoc.'],
                ],
            },
            {
                heading: ['Ăn đường phố an toàn', 'Eating street food safely'],
                list: [
                    ['Chọn quán đông khách địa phương, món nấu chín nóng tại chỗ.', 'Pick stalls busy with locals and food cooked hot in front of you.'],
                    ['Uống nước đóng chai; đá viên ở thành phố thường là đá sản xuất công nghiệp.', 'Drink bottled water; ice in cities is usually factory-made.'],
                    ['Người ăn chay có thể tìm quán chay – đặc biệt đông vào ngày rằm và mùng 1 âm lịch.', 'Vegetarians can look for quán chay – especially busy on the 1st and 15th of the lunar month.'],
                    ['Trên bàn ăn: không cắm đũa thẳng đứng vào bát cơm; mời người lớn tuổi ăn trước.', 'At the table: never stand chopsticks upright in rice; invite elders to start first.'],
                ],
            },
        ],
        related: ['hue', 'hoi-an', 'sai-gon', 'ha-noi'],
    },
    {
        slug: 'giay-to-visa',
        icon: 'ri-passport-line',
        title: ['Visa và giấy tờ cần mang theo', 'Visas and documents to bring'],
        summary: ['Thị thực điện tử, miễn thị thực, hộ chiếu và giấy tờ cần khi bay nội địa, nhận phòng khách sạn.', 'E-visas, visa exemptions, passports and the documents you need for domestic flights and hotels.'],
        sections: [
            {
                heading: ['Khách quốc tế', 'International visitors'],
                list: [
                    ['Thị thực điện tử (e-visa) cấp cho công dân mọi quốc gia, thời hạn tối đa 90 ngày, nhập cảnh một hoặc nhiều lần. Chỉ nộp tại cổng chính thức evisa.gov.vn để tránh trang giả mạo thu phí cao.', 'E-visas are available to citizens of all countries, valid for up to 90 days with single or multiple entry. Apply only on the official portal evisa.gov.vn to avoid look-alike sites charging extra fees.'],
                    ['Công dân một số nước (ví dụ nhiều nước châu Âu, Nhật Bản, Hàn Quốc) được miễn thị thực 45 ngày; các nước ASEAN có thời hạn miễn riêng. Danh sách thay đổi theo thời gian – hãy kiểm tra trước chuyến đi.', 'Citizens of some countries (for example many European countries, Japan and South Korea) get 45 days visa-free; ASEAN countries have their own exemptions. The list changes over time – check before you travel.'],
                    ['Hộ chiếu nên còn hạn ít nhất 6 tháng. Khách sạn, homestay sẽ giữ/ghi thông tin hộ chiếu để khai báo tạm trú – đây là quy định bình thường.', 'Your passport should be valid for at least 6 more months. Hotels and homestays will record your passport for residence registration – this is normal.'],
                ],
            },
            {
                heading: ['Khách trong nước', 'Domestic travellers'],
                list: [
                    ['Bay nội địa: mang căn cước công dân gắn chip hoặc dùng tài khoản định danh điện tử VNeID mức 2; trẻ em mang giấy khai sinh.', 'Domestic flights: bring your chip-based citizen ID card or use a level-2 VNeID digital ID; children need a birth certificate.'],
                    ['Nhận phòng: khách sạn cần căn cước để đăng ký lưu trú.', 'Check-in: hotels need your ID card for guest registration.'],
                    ['Một số khu vực biên giới, hải đảo có thể yêu cầu giấy tờ tùy thân khi qua trạm kiểm soát – luôn mang theo bản gốc.', 'Some border and island areas may check ID at checkpoints – always carry the original.'],
                ],
            },
            {
                heading: ['Nên chuẩn bị thêm', 'Also worth preparing'],
                list: [
                    ['Bảo hiểm du lịch có chi trả y tế và tai nạn.', 'Travel insurance covering medical care and accidents.'],
                    ['Bản chụp hộ chiếu/căn cước lưu trên điện thoại và email.', 'Photos of your passport/ID saved on your phone and email.'],
                    ['Số điện thoại khách sạn và địa chỉ bằng tiếng Việt để đưa tài xế.', 'Your hotel\'s phone number and address in Vietnamese to show drivers.'],
                ],
            },
        ],
        related: ['ha-noi', 'sai-gon', 'da-nang', 'phu-quoc'],
    },
    {
        slug: 'an-toan-lien-lac',
        icon: 'ri-shield-check-line',
        title: ['An toàn, sức khỏe và liên lạc khi du lịch', 'Safety, health and staying connected'],
        summary: ['Số khẩn cấp, SIM/eSIM, ứng dụng nên cài, cách tránh bị chặt chém và giữ sức khỏe trên đường.', 'Emergency numbers, SIM/eSIM, apps to install, avoiding scams and staying healthy on the road.'],
        sections: [
            {
                heading: ['Số điện thoại khẩn cấp', 'Emergency numbers'],
                list: [
                    ['113 – Công an', '113 – Police'],
                    ['114 – Cứu hỏa, cứu nạn', '114 – Fire and rescue'],
                    ['115 – Cấp cứu y tế', '115 – Ambulance'],
                ],
            },
            {
                heading: ['SIM, eSIM và ứng dụng hữu ích', 'SIM, eSIM and useful apps'],
                paragraphs: [
                    ['Các nhà mạng lớn: Viettel (phủ sóng tốt nhất ở vùng núi, hải đảo), VinaPhone, MobiFone. Mua SIM/eSIM du lịch tại sân bay hoặc cửa hàng chính hãng, cần xuất trình hộ chiếu/căn cước để đăng ký.', 'The main networks are Viettel (best coverage in mountains and islands), VinaPhone and MobiFone. Buy a tourist SIM/eSIM at the airport or an official store; you need your passport/ID to register.'],
                ],
                list: [
                    ['Google Maps – chỉ đường, xem giờ mở cửa và đánh giá quán.', 'Google Maps – directions, opening hours and reviews.'],
                    ['Grab / Be / Xanh SM – gọi xe, giao đồ ăn.', 'Grab / Be / Xanh SM – rides and food delivery.'],
                    ['Zalo – ứng dụng nhắn tin phổ biến nhất, nhiều homestay, nhà xe liên lạc qua đây.', 'Zalo – the most popular messaging app; many homestays and bus companies use it.'],
                ],
            },
            {
                heading: ['Tránh bị "chặt chém"', 'Avoiding scams'],
                list: [
                    ['Dùng ứng dụng gọi xe hoặc taxi hãng lớn có đồng hồ; hỏi giá trước khi đi xích lô, xe ôm.', 'Use ride-hailing apps or metered taxis from major companies; agree prices before cyclo or motorbike taxi rides.'],
                    ['Kiểm tra hóa đơn, đếm lại tiền thối.', 'Check bills and count your change.'],
                    ['Đặt tour qua nơi có đánh giá rõ ràng; cẩn thận với lời mời "tour giá rẻ" trên đường.', 'Book tours with clearly reviewed companies; be wary of cheap tours offered on the street.'],
                ],
            },
            {
                heading: ['Giữ sức khỏe', 'Staying healthy'],
                list: [
                    ['Nắng miền Trung, miền Nam rất gắt: uống đủ nước, dùng kem chống nắng, tránh ra ngoài lúc 11–14h.', 'The sun in the Centre and South is strong: stay hydrated, use sunscreen and avoid 11 am – 2 pm.'],
                    ['Dùng thuốc chống muỗi, nhất là mùa mưa (phòng sốt xuất huyết).', 'Use mosquito repellent, especially in the rainy season (dengue).'],
                    ['Mang theo thuốc cá nhân, thuốc say xe cho đèo núi và tàu ra đảo.', 'Bring personal medicine and motion-sickness pills for mountain passes and island boats.'],
                    ['Theo dõi dự báo bão khi đi biển đảo, miền Trung từ tháng 9 – 12.', 'Watch typhoon forecasts for islands and Central Vietnam from Sep – Dec.'],
                ],
            },
        ],
        related: ['ha-giang', 'con-dao', 'ly-son', 'phong-nha'],
    },
]
