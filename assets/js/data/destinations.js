/*=============== DỮ LIỆU DANH LAM THẮNG CẢNH VIỆT NAM ===============*/
/*
 * Ảnh được lấy từ Wikimedia Commons (giấy phép Creative Commons).
 * Mỗi ảnh chỉ cần khai báo đúng tên file trên Commons; hàm wikiImg() sẽ tạo
 * đường dẫn tới bản thu nhỏ độ phân giải cao, còn wikiPage() trỏ về trang
 * thông tin bản quyền của ảnh.
 */
const WIKI_BASE = 'https://commons.wikimedia.org/wiki/'

/* Đường dẫn gốc của site so với trang hiện tại (vd: "../../" cho trang diem-den/<id>/) */
const SITE_ROOT = (typeof window !== 'undefined' && window.SITE_ROOT) || ''

/*
 * Ảnh đã tải về máy (sinh bởi tools/download-images.js, khai báo trong local-images.js)
 * được ưu tiên dùng; nếu chưa có thì lấy trực tiếp từ Wikimedia Commons.
 */
function wikiImg(file, width = 1280) {
    const local = typeof LOCAL_IMAGES !== 'undefined' && LOCAL_IMAGES[file]
    if (local) return SITE_ROOT + (width > 960 ? local.lg : local.sm)
    return `${WIKI_BASE}Special:FilePath/${encodeURIComponent(file)}?width=${width}`
}

function wikiPage(file) {
    return `${WIKI_BASE}File:${encodeURIComponent(file.replace(/ /g, '_'))}`
}

const REGIONS = {
    bac: 'Miền Bắc',
    trung: 'Miền Trung',
    nam: 'Miền Nam',
}

const CATEGORIES = {
    bien: 'Biển đảo',
    nui: 'Núi rừng',
    'di-san': 'Di sản',
    'thanh-pho': 'Thành phố',
    'hang-dong': 'Hang động',
}

const DESTINATIONS = [
    /*==================== MIỀN BẮC ====================*/
    {
        id: 'vinh-ha-long',
        name: 'Vịnh Hạ Long',
        province: 'Quảng Ninh',
        region: 'bac',
        categories: ['bien', 'di-san'],
        rating: 4.9,
        tagline: 'Kỳ quan thiên nhiên thế giới giữa lòng vịnh Bắc Bộ',
        description: 'Gần 2.000 hòn đảo đá vôi nhô lên giữa làn nước xanh ngọc tạo nên một bức tranh thủy mặc sống động. Hai lần được UNESCO công nhận là Di sản Thiên nhiên Thế giới, Hạ Long là nơi bạn có thể ngủ đêm trên du thuyền, chèo kayak qua những hang động bí ẩn và ngắm hoàng hôn buông xuống trên mặt vịnh.',
        highlights: ['Hang Sửng Sốt', 'Đảo Ti Tốp', 'Làng chài Cửa Vạn', 'Vịnh Lan Hạ'],
        bestTime: 'Tháng 4 – 10',
        duration: '2 – 3 ngày',
        hero: 'Halong Bay in Vietnam.jpg',
        gallery: [
            { file: 'Ha Long Bay, Vietnam, Islands.jpg', caption: 'Những đảo đá vôi hùng vĩ' },
            { file: 'Ha Long Bay, sunset.jpg', caption: 'Hoàng hôn trên vịnh' },
            { file: 'Ha Long Bay - North East Vietnam.JPG', caption: 'Du thuyền len lỏi giữa các đảo' },
            { file: 'Hạ Long Bay.jpg', caption: 'Mặt vịnh xanh ngọc' },
            { file: 'Ha Long Bay - Bahía de Ha Long.JPG', caption: 'Thuyền buồm truyền thống' },
        ],
        foods: [
            { name: 'Chả mực Hạ Long', desc: 'Mực giã tay dai giòn, chiên vàng thơm lừng – đặc sản số một đất mỏ.', price: '350.000đ/kg', file: 'Chả mực Hạ Long, Quảng Ninh, Việt Nam.jpg' },
            { name: 'Bánh cuốn chả mực', desc: 'Bánh cuốn mỏng mềm ăn cùng chả mực giòn thơm – bữa sáng kiểu Quảng Ninh.', price: '45.000đ', file: 'Banh cuon.jpg' },
            { name: 'Phở', desc: 'Món ăn quốc hồn quốc túy, bát phở nóng hổi cho buổi sáng trên vịnh.', price: '45.000đ', file: 'Phở bò (39425047901).jpg' },
        ],
        activities: [
            { icon: 'ri-ship-2-line', title: 'Ngủ đêm trên du thuyền', desc: 'Trải nghiệm 2 ngày 1 đêm, ngắm bình minh giữa vịnh.' },
            { icon: 'ri-sailboat-line', title: 'Chèo kayak', desc: 'Luồn qua hang Luồn, khám phá các áng nước kín đáo.' },
            { icon: 'ri-landscape-line', title: 'Leo đỉnh Ti Tốp', desc: 'Ngắm toàn cảnh vịnh từ trên cao sau hơn 400 bậc đá.' },
            { icon: 'ri-flight-takeoff-line', title: 'Thủy phi cơ', desc: 'Ngắm vịnh từ bầu trời trong chuyến bay 25 phút.' },
        ],
        tips: ['Đặt du thuyền trước ít nhất 1 tuần vào mùa cao điểm.', 'Mang theo kem chống nắng và giày đế bám để leo núi.'],
    },
    {
        id: 'sa-pa',
        name: 'Sa Pa',
        province: 'Lào Cai',
        region: 'bac',
        categories: ['nui'],
        rating: 4.8,
        tagline: 'Thị trấn trong sương và những thửa ruộng bậc thang',
        description: 'Nằm ở độ cao 1.600m, Sa Pa quyến rũ bởi khí hậu mát mẻ quanh năm, ruộng bậc thang uốn lượn như những nấc thang lên trời và bản sắc văn hóa đặc sắc của người H\'Mông, Dao đỏ. Đây cũng là cửa ngõ chinh phục Fansipan – "nóc nhà Đông Dương".',
        highlights: ['Đỉnh Fansipan', 'Bản Cát Cát', 'Thung lũng Mường Hoa', 'Đèo Ô Quy Hồ'],
        bestTime: 'Tháng 9 – 11 (mùa lúa chín)',
        duration: '2 – 3 ngày',
        hero: 'Rice terraces in Sa Pa 02.jpg',
        gallery: [
            { file: 'Rice terraces in Sa Pa 03.jpg', caption: 'Ruộng bậc thang Mường Hoa' },
            { file: 'Terraced fields Sa Pa Vietnam.JPG', caption: 'Những nấc thang lên trời' },
            { file: 'Fansipan-vietnam.jpg', caption: 'Fansipan – nóc nhà Đông Dương' },
            { file: 'Stairs to the Fansipan.jpg', caption: 'Bậc đá lên đỉnh Fansipan' },
        ],
        foods: [
            { name: 'Thắng cố', desc: 'Món ăn truyền thống của người H\'Mông, nấu từ thịt và nội tạng ngựa cùng thảo quả.', price: '100.000đ', file: 'Indigenous Girl in Sunday Market - Bac Ha - Lao Cai Province - Vietnam - 01 (48218346821).jpg', illustrative: 'Chợ phiên Bắc Hà – nơi bán thắng cố' },
            { name: 'Cơm lam', desc: 'Gạo nếp nương nướng trong ống tre, dẻo thơm mùi khói bếp.', price: '20.000đ/ống', file: 'Khao lam87.jpg' },
            { name: 'Lẩu cá hồi', desc: 'Cá hồi nuôi bằng nước suối lạnh Sa Pa, thịt chắc ngọt.', price: '300.000đ', file: 'Homemade Hotpot.jpg', illustrative: 'Nồi lẩu nóng' },
        ],
        activities: [
            { icon: 'ri-riding-line', title: 'Cáp treo Fansipan', desc: 'Chinh phục đỉnh 3.143m chỉ trong 15 phút.' },
            { icon: 'ri-walk-line', title: 'Trekking bản làng', desc: 'Đi bộ qua Lao Chải, Tả Van, ngủ homestay người Dao.' },
            { icon: 'ri-store-2-line', title: 'Chợ phiên vùng cao', desc: 'Chợ tình Sa Pa, chợ Bắc Hà rực rỡ sắc màu.' },
            { icon: 'ri-camera-lens-line', title: 'Săn mây', desc: 'Ngắm biển mây trên đèo Ô Quy Hồ lúc bình minh.' },
        ],
        tips: ['Nhiệt độ về đêm có thể xuống dưới 10°C, nhớ mang áo ấm.', 'Thuê người bản địa dẫn đường khi trekking.'],
    },
    {
        id: 'ha-noi',
        name: 'Hà Nội',
        province: 'Thủ đô',
        region: 'bac',
        categories: ['thanh-pho', 'di-san'],
        rating: 4.7,
        tagline: 'Nghìn năm văn hiến bên hồ Gươm',
        description: 'Thủ đô ngàn năm tuổi là nơi giao thoa giữa nét cổ kính của 36 phố phường, những công trình kiến trúc Pháp và nhịp sống hiện đại. Dạo quanh hồ Hoàn Kiếm, thưởng thức một ly cà phê trứng hay bát phở gia truyền là cách tuyệt vời để cảm nhận hồn cốt Hà Nội.',
        highlights: ['Hồ Hoàn Kiếm', 'Văn Miếu – Quốc Tử Giám', 'Phố cổ', 'Lăng Chủ tịch Hồ Chí Minh'],
        bestTime: 'Tháng 9 – 11 (mùa thu)',
        duration: '2 – 3 ngày',
        hero: 'Turtle Tower, Hoan Kiem Lake, Hanoi 4G4A7301.jpg',
        gallery: [
            { file: 'Hoan Kiem lake Hanoi (39513889222).jpg', caption: 'Hồ Hoàn Kiếm' },
            { file: 'Temple of Literature, Hanoi by Xiquinho Silva 04.jpg', caption: 'Văn Miếu – Quốc Tử Giám' },
            { file: 'Well of Heavenly Clarity - Temple of Literature, Hanoi - DSC04565.JPG', caption: 'Giếng Thiên Quang' },
            { file: 'Stelae of Doctors - Temple of Literature, Hanoi - DSC04563.JPG', caption: 'Bia Tiến sĩ' },
            { file: 'Hoan Kiem Lake, Hanoi, Vietnam (8120855653).jpg', caption: 'Hồ Gươm buổi sớm' },
        ],
        foods: [
            { name: 'Phở Hà Nội', desc: 'Nước dùng trong, ngọt từ xương bò hầm hàng giờ, bánh phở mềm.', price: '50.000đ', file: 'Phở bát đá.jpg' },
            { name: 'Bún chả', desc: 'Chả nướng than hoa thơm lừng, chấm nước mắm chua ngọt.', price: '45.000đ', file: 'Bun-cha-hanoi.jpg' },
            { name: 'Chả cá Lã Vọng', desc: 'Cá lăng ướp nghệ, rán trên chảo mỡ cùng thì là và hành.', price: '150.000đ', file: 'Chả cá Lã Vọng.jpg' },
            { name: 'Cà phê trứng', desc: 'Lớp kem trứng béo ngậy phủ trên cà phê đậm đà – phát minh của Hà Nội.', price: '35.000đ', file: 'Cà phê trứng.jpg' },
        ],
        activities: [
            { icon: 'ri-walk-line', title: 'Dạo phố đi bộ', desc: 'Phố đi bộ Hồ Gươm sôi động mỗi tối cuối tuần.' },
            { icon: 'ri-bike-line', title: 'Xích lô phố cổ', desc: 'Ngắm 36 phố phường từ chiếc xích lô chầm chậm.' },
            { icon: 'ri-drama-line', title: 'Múa rối nước', desc: 'Nghệ thuật dân gian độc đáo tại Nhà hát Thăng Long.' },
            { icon: 'ri-restaurant-line', title: 'Food tour đêm', desc: 'Khám phá ẩm thực đường phố Tạ Hiện, Đồng Xuân.' },
        ],
        tips: ['Băng qua đường chậm rãi, đều bước để xe máy tránh bạn.', 'Nhiều di tích yêu cầu trang phục kín đáo.'],
    },
    {
        id: 'ninh-binh',
        name: 'Tràng An – Ninh Bình',
        province: 'Ninh Bình',
        region: 'bac',
        categories: ['di-san', 'nui'],
        rating: 4.9,
        tagline: '"Hạ Long trên cạn" giữa núi non hùng vĩ',
        description: 'Quần thể danh thắng Tràng An là di sản hỗn hợp văn hóa và thiên nhiên đầu tiên của Việt Nam. Ngồi thuyền nan xuôi dòng Ngô Đồng, len qua những hang động xuyên núi và cánh đồng lúa vàng ở Tam Cốc – Bích Động là trải nghiệm khó quên.',
        highlights: ['Bến thuyền Tràng An', 'Tam Cốc – Bích Động', 'Hang Múa', 'Chùa Bái Đính'],
        bestTime: 'Tháng 5 – 6 (lúa chín)',
        duration: '1 – 2 ngày',
        hero: 'Trang An Landscape Complex, Ninh Binh Province, Vietnam, 20240202 1419 5252.jpg',
        gallery: [
            { file: 'Trang An Landscape Complex, Ninh Binh Province, Vietnam, 20240202 1456 5313.jpg', caption: 'Thuyền nan Tràng An' },
            { file: 'Trang An Landscape Complex, Ninh Binh Province, Vietnam, 20240202 1456 5316.jpg', caption: 'Dòng sông giữa núi đá' },
            { file: 'Vietnam, Ninh Binh, Trang An Limestone Peaks.jpg', caption: 'Núi đá vôi Tràng An' },
            { file: 'Tam Cốc-Bích Động in Ninh Binh province 2.jpg', caption: 'Tam Cốc – Bích Động' },
            { file: 'Tam Coc, Ninh Binh ,Vietnam.jpg', caption: 'Ruộng lúa Tam Cốc' },
        ],
        foods: [
            { name: 'Cơm cháy Ninh Bình', desc: 'Cơm cháy giòn rụm chan nước sốt tim cật, đặc sản cố đô.', price: '80.000đ', file: null },
            { name: 'Thịt dê núi', desc: 'Dê chạy núi đá thịt săn chắc, chế biến tái chanh, nướng, hấp.', price: '200.000đ', file: null },
            { name: 'Bánh mì', desc: 'Ổ bánh mì giòn rụm tiện lợi cho những chuyến đi trong ngày.', price: '25.000đ', file: 'Hai ổ bánh mì.jpg' },
        ],
        activities: [
            { icon: 'ri-sailboat-line', title: 'Đi thuyền Tràng An', desc: 'Hành trình 2–3 giờ qua 9 hang động xuyên thủy.' },
            { icon: 'ri-landscape-line', title: 'Leo Hang Múa', desc: 'Leo 500 bậc đá lên đỉnh ngắm toàn cảnh Tam Cốc.' },
            { icon: 'ri-bike-line', title: 'Đạp xe đồng quê', desc: 'Thong dong giữa làng quê và cánh đồng lúa.' },
            { icon: 'ri-ancient-pavilion-line', title: 'Viếng chùa Bái Đính', desc: 'Quần thể chùa với nhiều kỷ lục Việt Nam và châu Á.' },
        ],
        tips: ['Đi thuyền vào sáng sớm để tránh nắng và đông khách.', 'Hang Múa đẹp nhất lúc hoàng hôn.'],
    },
    {
        id: 'ha-giang',
        name: 'Hà Giang',
        province: 'Hà Giang',
        region: 'bac',
        categories: ['nui'],
        rating: 4.9,
        tagline: 'Cung đường đèo hùng vĩ nhất Việt Nam',
        description: 'Vùng cao nguyên đá Đồng Văn – công viên địa chất toàn cầu UNESCO – là thiên đường của dân phượt. Đèo Mã Pí Lèng uốn lượn trên vực sâu, dòng Nho Quế xanh biếc, cột cờ Lũng Cú nơi địa đầu Tổ quốc và mùa hoa tam giác mạch tím hồng cả sườn đồi.',
        highlights: ['Đèo Mã Pí Lèng', 'Sông Nho Quế', 'Cột cờ Lũng Cú', 'Phố cổ Đồng Văn'],
        bestTime: 'Tháng 10 – 11 (hoa tam giác mạch)',
        duration: '3 – 4 ngày',
        hero: 'MaPiLeng,HaGiang,Vietnam.jpg',
        gallery: [
            { file: 'Ma Pi Leng pass plateau in 2014.jpg', caption: 'Cao nguyên Mã Pí Lèng' },
            { file: 'Le col de Ma Pi Leng (Dong Van-Meo Vac).jpg', caption: 'Đèo Mã Pí Lèng' },
            { file: 'Ha Giang Loop.jpg', caption: 'Cung đường Hà Giang Loop' },
            { file: 'SaPhin HaGiang Vietnam.JPG', caption: 'Thung lũng Sà Phìn' },
            { file: 'Ha Giang rizieres bis.jpg', caption: 'Ruộng bậc thang Hoàng Su Phì' },
        ],
        foods: [
            { name: 'Cháo ấu tẩu', desc: 'Cháo nấu từ củ ấu tẩu đắng nhẹ, bùi béo, ấm lòng đêm lạnh.', price: '30.000đ', file: 'Quyết Tiến market, Hà Giang, Vietnam - 2.jpg', illustrative: 'Chợ phiên Hà Giang' },
            { name: 'Bánh cuốn trứng', desc: 'Bánh cuốn kẹp trứng chan nước xương hầm – bữa sáng kiểu Hà Giang.', price: '25.000đ', file: 'Banh cuon.jpg' },
            { name: 'Cơm lam', desc: 'Gạo nương nướng ống tre, chấm muối vừng hoặc thịt nướng.', price: '20.000đ/ống', file: 'Khao lam87.jpg' },
        ],
        activities: [
            { icon: 'ri-motorbike-line', title: 'Phượt Hà Giang Loop', desc: 'Chạy xe máy qua 350km cung đường đèo đẹp nhất.' },
            { icon: 'ri-sailboat-line', title: 'Thuyền sông Nho Quế', desc: 'Xuôi dòng qua hẻm Tu Sản sâu nhất Đông Nam Á.' },
            { icon: 'ri-flag-line', title: 'Cột cờ Lũng Cú', desc: 'Đứng tại điểm cực Bắc thiêng liêng của Tổ quốc.' },
            { icon: 'ri-store-2-line', title: 'Chợ phiên Đồng Văn', desc: 'Chợ họp sáng Chủ nhật đậm chất vùng cao.' },
        ],
        tips: ['Chỉ tự lái xe máy nếu có kinh nghiệm đường đèo; nên thuê "easy rider".', 'Đổ xăng đầy khi gặp trạm vì cây xăng khá thưa.'],
    },
    {
        id: 'ban-gioc',
        name: 'Thác Bản Giốc',
        province: 'Cao Bằng',
        region: 'bac',
        categories: ['nui'],
        rating: 4.8,
        tagline: 'Thác nước biên giới đẹp nhất Đông Nam Á',
        description: 'Nằm trên dòng Quây Sơn nơi biên giới Việt – Trung, thác Bản Giốc đổ xuống qua nhiều tầng đá vôi tạo nên màn nước trắng xóa giữa núi rừng xanh thẳm. Kết hợp khám phá động Ngườm Ngao và hồ Ba Bể cho một hành trình Đông Bắc trọn vẹn.',
        highlights: ['Thác Bản Giốc', 'Động Ngườm Ngao', 'Chùa Phật tích Trúc Lâm', 'Hồ Thang Hen'],
        bestTime: 'Tháng 8 – 10 (nước nhiều, lúa chín)',
        duration: '2 – 3 ngày',
        hero: 'Ban Gioc Waterfall - Trung Kanh District - Cao Bang Province - Vietnam - 01 (48119813303).jpg',
        gallery: [
            { file: 'Ban Gioc Waterfall - Trung Kanh District - Cao Bang Province - Vietnam - 16 (48119888466).jpg', caption: 'Các tầng thác trắng xóa' },
            { file: 'Thác Bản Giốc.jpg', caption: 'Toàn cảnh thác Bản Giốc' },
            { file: 'Ban Gioc - Detian Falls2.jpg', caption: 'Dòng Quây Sơn' },
        ],
        foods: [
            { name: 'Vịt quay 7 vị', desc: 'Vịt quay lá mắc mật thơm nức, da giòn óng – niềm tự hào Cao Bằng.', price: '250.000đ/con', file: null },
            { name: 'Bánh cuốn Cao Bằng', desc: 'Bánh mỏng, ăn cùng nước canh xương nóng thay vì nước mắm.', price: '30.000đ', file: 'Banh cuon.jpg' },
            { name: 'Phở chua', desc: 'Món phở trộn chua ngọt với thịt quay, lạc rang, rau thơm.', price: '40.000đ', file: null },
        ],
        activities: [
            { icon: 'ri-sailboat-line', title: 'Đi bè tre', desc: 'Ngồi bè tiến sát chân thác, cảm nhận hơi nước mát lạnh.' },
            { icon: 'ri-lightbulb-flash-line', title: 'Động Ngườm Ngao', desc: 'Hang động với nhũ đá lung linh kỳ ảo.' },
            { icon: 'ri-camera-lens-line', title: 'Chụp ảnh thác', desc: 'Nắng sớm tạo cầu vồng tuyệt đẹp trên màn nước.' },
        ],
        tips: ['Mang theo CCCD/hộ chiếu vì đây là khu vực biên giới.', 'Mùa khô (tháng 12 – 3) thác ít nước hơn.'],
    },

    /*==================== MIỀN TRUNG ====================*/
    {
        id: 'hue',
        name: 'Cố đô Huế',
        province: 'Thừa Thiên Huế',
        region: 'trung',
        categories: ['di-san', 'thanh-pho'],
        rating: 4.7,
        tagline: 'Kinh thành triều Nguyễn bên dòng Hương mộng mơ',
        description: 'Kinh đô của 13 đời vua triều Nguyễn lưu giữ quần thể di tích cung đình đồ sộ, những lăng tẩm uy nghiêm và nhịp sống chậm rãi, trầm mặc. Nghe ca Huế trên sông Hương và thưởng thức ẩm thực cung đình là trải nghiệm chỉ có ở Huế.',
        highlights: ['Đại Nội', 'Chùa Thiên Mụ', 'Lăng Khải Định', 'Sông Hương'],
        bestTime: 'Tháng 1 – 4',
        duration: '2 ngày',
        hero: 'Vietnam, Hue, Imperial City of Hue.jpg',
        gallery: [
            { file: 'Vietnam, Hue, Imperial City of Hue, The Meridian Gate.jpg', caption: 'Ngọ Môn' },
            { file: 'Vietnam, Hue, Imperial City of Hue, Thế Miếu temple.jpg', caption: 'Thế Miếu' },
            { file: 'Hue Vietnam Thien-Mu-Temple-and-Pagoda-01.jpg', caption: 'Chùa Thiên Mụ' },
            { file: 'Imperial City, Hue, Vietnam (6927420512).jpg', caption: 'Hoàng thành Huế' },
            { file: 'Vietnam, Hue, Imperial City of Hue, Enclosure.jpg', caption: 'Tường thành cổ kính' },
        ],
        foods: [
            { name: 'Bún bò Huế', desc: 'Nước dùng đậm mùi sả và mắm ruốc, giò heo, chả cua cay nồng.', price: '45.000đ', file: 'Bun-Bo-Hue-from-Huong-Giang-2011.jpg' },
            { name: 'Bánh bèo chén', desc: 'Bánh bột gạo mỏng trong chén nhỏ, rắc tôm chấy và tóp mỡ.', price: '30.000đ', file: 'Bánh bèo chén.jpg' },
            { name: 'Bánh canh Nam Phổ', desc: 'Sợi bánh canh bột gạo lọc, nước dùng cua đỏ au béo ngọt.', price: '25.000đ', file: 'Bánh Canh Nam Phổ, Da Nang, Vietnam.jpg' },
            { name: 'Bánh bột lọc', desc: 'Vỏ trong suốt dai dai, nhân tôm thịt, gói lá chuối hấp.', price: '30.000đ', file: 'Banh Bot Loc in Danang, Vietnam.jpg' },
        ],
        activities: [
            { icon: 'ri-ancient-gate-line', title: 'Tham quan Đại Nội', desc: 'Khám phá Hoàng thành với hơn 100 công trình kiến trúc.' },
            { icon: 'ri-music-2-line', title: 'Nghe ca Huế', desc: 'Thả hồn theo điệu ca trên thuyền rồng sông Hương.' },
            { icon: 'ri-bike-line', title: 'Đạp xe lăng tẩm', desc: 'Lăng Tự Đức, Minh Mạng, Khải Định giữa rừng thông.' },
            { icon: 'ri-lightbulb-line', title: 'Thả đèn hoa đăng', desc: 'Gửi lời cầu nguyện trên dòng Hương về đêm.' },
        ],
        tips: ['Mùa mưa Huế kéo dài từ tháng 9 đến tháng 12.', 'Mua vé liên tuyến để tiết kiệm khi thăm nhiều di tích.'],
    },
    {
        id: 'phong-nha',
        name: 'Phong Nha – Kẻ Bàng',
        province: 'Quảng Bình',
        region: 'trung',
        categories: ['hang-dong', 'di-san', 'nui'],
        rating: 4.9,
        tagline: 'Vương quốc hang động của thế giới',
        description: 'Vườn quốc gia Phong Nha – Kẻ Bàng sở hữu hệ thống hang động karst cổ nhất châu Á, trong đó có Sơn Đoòng – hang động lớn nhất hành tinh. Động Thiên Đường với nhũ đá lộng lẫy và động Phong Nha với dòng sông ngầm là những điểm đến không thể bỏ lỡ.',
        highlights: ['Hang Sơn Đoòng', 'Động Thiên Đường', 'Động Phong Nha', 'Hang Én'],
        bestTime: 'Tháng 3 – 8',
        duration: '2 – 3 ngày',
        hero: 'Son Doong Cave 1.jpg',
        gallery: [
            { file: 'Cueva Paraíso, Phong Nha, Vietnam (36277324796).jpg', caption: 'Động Thiên Đường' },
            { file: 'Cueva Phong Nha, Vietnam (38652790530).jpg', caption: 'Động Phong Nha' },
            { file: 'Phong Nha-Ke Bang cave3.jpg', caption: 'Nhũ đá kỳ ảo' },
            { file: 'Hang Én Cave - 201505 - JB.jpg', caption: 'Hang Én' },
            { file: 'Son Doong Cave by Daniel Burka.jpg', caption: 'Sơn Đoòng – hang lớn nhất thế giới' },
        ],
        foods: [
            { name: 'Bánh bột lọc Quảng Bình', desc: 'Vỏ bột trong veo, nhân tôm đất rim đậm đà, chấm nước mắm ớt.', price: '30.000đ', file: 'Banh Bot Loc in Danang, Vietnam.jpg' },
            { name: 'Gà nướng Phong Nha', desc: 'Gà ta thả vườn nướng than, chấm muối tiêu chanh.', price: '250.000đ/con', file: null },
            { name: 'Bánh xèo', desc: 'Bánh xèo giòn rụm nhân tôm thịt, cuốn rau rừng chấm nước mắm.', price: '30.000đ', file: 'Bánh xèo with nước mắm.jpg' },
        ],
        activities: [
            { icon: 'ri-sailboat-line', title: 'Thuyền vào động Phong Nha', desc: 'Xuôi sông Son rồi tiến vào dòng sông ngầm.' },
            { icon: 'ri-flashlight-line', title: 'Thám hiểm hang Tối', desc: 'Zipline, tắm bùn và bơi trong lòng hang.' },
            { icon: 'ri-walk-line', title: 'Trekking Hang Én', desc: 'Cắm trại trong hang động lớn thứ 3 thế giới.' },
            { icon: 'ri-bike-line', title: 'Đạp xe Bống Lai', desc: 'Khám phá thung lũng xanh mướt quanh Phong Nha.' },
        ],
        tips: ['Tour Sơn Đoòng cần đặt trước nhiều tháng và yêu cầu thể lực tốt.', 'Mùa lũ (tháng 9 – 11) nhiều hang đóng cửa.'],
    },
    {
        id: 'da-nang',
        name: 'Đà Nẵng',
        province: 'Đà Nẵng',
        region: 'trung',
        categories: ['thanh-pho', 'bien'],
        rating: 4.8,
        tagline: 'Thành phố đáng sống bên bờ biển Mỹ Khê',
        description: 'Đà Nẵng hội tụ đủ biển xanh, núi rừng và phố thị hiện đại. Bãi biển Mỹ Khê từng được bình chọn là một trong những bãi biển quyến rũ nhất hành tinh, Cầu Vàng trên Bà Nà Hills nổi tiếng toàn cầu, và Cầu Rồng phun lửa mỗi tối cuối tuần.',
        highlights: ['Cầu Vàng – Bà Nà Hills', 'Biển Mỹ Khê', 'Ngũ Hành Sơn', 'Cầu Rồng'],
        bestTime: 'Tháng 3 – 8',
        duration: '3 – 4 ngày',
        hero: 'The Golden Bridge, Ba Na Hills, Vietnam.jpg',
        gallery: [
            { file: 'Golden Bridge at Ba Na Hills 20250718.jpg', caption: 'Cầu Vàng giữa mây' },
            { file: 'Dragon Bridge, Da Nang at night - 20230819.jpg', caption: 'Cầu Rồng về đêm' },
            { file: 'My Khe Beach Da Nang.jpg', caption: 'Biển Mỹ Khê' },
            { file: 'Marble Mountains, Vietnam.jpg', caption: 'Ngũ Hành Sơn' },
            { file: 'Dragon Marble Mountain Da Nang Vietnam.jpg', caption: 'Chùa trên núi Ngũ Hành Sơn' },
        ],
        foods: [
            { name: 'Mì Quảng', desc: 'Sợi mì vàng nghệ, ít nước, tôm thịt, bánh tráng mè giòn.', price: '35.000đ', file: 'Mi Quang at Ngoc Mai (with noodles uncovered).jpg' },
            { name: 'Bánh tráng cuốn thịt heo', desc: 'Thịt heo luộc cuốn rau rừng, chấm mắm nêm đậm đà.', price: '90.000đ', file: 'Bánh tráng cuốn thịt heo.jpg' },
            { name: 'Bánh bèo', desc: 'Bánh bèo Đà Nẵng dẻo mềm, chan nước mắm ngọt và tôm chấy.', price: '25.000đ', file: 'Banh beo Da Nang.JPG' },
            { name: 'Bánh xèo', desc: 'Bánh xèo miền Trung nhỏ xinh, giòn tan, chấm tương gan.', price: '30.000đ', file: 'Bánh xèo with nước mắm.jpg' },
        ],
        activities: [
            { icon: 'ri-riding-line', title: 'Cáp treo Bà Nà', desc: 'Tuyến cáp treo kỷ lục lên Cầu Vàng và làng Pháp.' },
            { icon: 'ri-surfing-line', title: 'Lướt sóng Mỹ Khê', desc: 'Tắm biển, chèo SUP, lướt ván buổi sáng sớm.' },
            { icon: 'ri-fire-line', title: 'Xem Cầu Rồng phun lửa', desc: '21h tối thứ 7 và Chủ nhật hàng tuần.' },
            { icon: 'ri-motorbike-line', title: 'Đèo Hải Vân', desc: '"Thiên hạ đệ nhất hùng quan" trên đường đi Huế.' },
        ],
        tips: ['Kết hợp Đà Nẵng – Hội An – Huế cho lịch trình miền Trung trọn vẹn.', 'Mùa mưa bão từ tháng 9 đến tháng 12.'],
    },
    {
        id: 'hoi-an',
        name: 'Phố cổ Hội An',
        province: 'Quảng Nam',
        region: 'trung',
        categories: ['di-san', 'thanh-pho'],
        rating: 4.9,
        tagline: 'Thương cảng cổ lung linh ánh đèn lồng',
        description: 'Từng là thương cảng sầm uất bậc nhất Đông Nam Á thế kỷ XVI–XVII, Hội An ngày nay vẫn giữ nguyên vẹn những dãy nhà tường vàng mái ngói rêu phong. Khi đêm xuống, hàng nghìn chiếc đèn lồng sắc màu thắp sáng phố cổ và dòng sông Hoài.',
        highlights: ['Chùa Cầu', 'Sông Hoài', 'Hội quán Phúc Kiến', 'Rừng dừa Bảy Mẫu'],
        bestTime: 'Tháng 2 – 5',
        duration: '1 – 2 ngày',
        hero: 'Hội An, Ancient Town, 2020-01 CN-06.jpg',
        gallery: [
            { file: 'Hội An, Ancient Town, 2020-01 CN-11.jpg', caption: 'Đèn lồng và nhà phố cổ' },
            { file: 'Lanterns in Hoi An 4.jpg', caption: 'Đèn lồng Hội An về đêm' },
            { file: '2024 Hội An - Japanese Covered Bridge (Chùa Cầu) after renovation - img 11.jpg', caption: 'Chùa Cầu sau trùng tu' },
            { file: 'Japanese Covered Bridge, Hoi An, Vietnam (6944563878).jpg', caption: 'Chùa Cầu' },
            { file: 'Hội An, Ancient Town, 2020-01 CN-03.jpg', caption: 'Góc phố vàng' },
        ],
        foods: [
            { name: 'Cao lầu', desc: 'Sợi mì vàng dai từ nước giếng Bá Lễ, xá xíu, rau Trà Quế.', price: '35.000đ', file: 'Cao Lau Hoi An.JPG' },
            { name: 'Bánh mì Hội An', desc: 'Ổ bánh mì "ngon nhất thế giới" với pate và nước sốt đặc biệt.', price: '30.000đ', file: 'Two mini banh mi Vietnamese sandwiches.jpg' },
            { name: 'Mì Quảng', desc: 'Món mì trứ danh xứ Quảng với nước dùng đậm đà sắc nghệ.', price: '35.000đ', file: 'Mi Quang - Quan Hat Mi Quang, Cao Lau VND2000.jpg' },
        ],
        activities: [
            { icon: 'ri-lightbulb-line', title: 'Thả hoa đăng sông Hoài', desc: 'Ngồi thuyền thả đèn giữa phố cổ lung linh.' },
            { icon: 'ri-sailboat-line', title: 'Thúng chai Bảy Mẫu', desc: 'Xoay thúng giữa rừng dừa nước Cẩm Thanh.' },
            { icon: 'ri-t-shirt-line', title: 'May đo áo dài', desc: 'Nhận đồ may đo chỉ sau 24 giờ.' },
            { icon: 'ri-restaurant-2-line', title: 'Lớp học nấu ăn', desc: 'Đi chợ và học nấu món Hội An cùng người bản địa.' },
        ],
        tips: ['Phố cổ cấm xe máy vào buổi tối – hãy đi bộ hoặc đạp xe.', 'Đêm rằm hằng tháng phố cổ tắt đèn điện, chỉ thắp đèn lồng.'],
    },
    {
        id: 'nha-trang',
        name: 'Nha Trang',
        province: 'Khánh Hòa',
        region: 'trung',
        categories: ['bien', 'thanh-pho'],
        rating: 4.6,
        tagline: 'Hòn ngọc của biển Đông',
        description: 'Vịnh Nha Trang là thành viên câu lạc bộ những vịnh biển đẹp nhất thế giới với bờ cát dài, nước trong xanh và hệ sinh thái san hô phong phú. Du khách có thể lặn biển ngắm san hô, tắm bùn khoáng hay khám phá tháp Chăm Po Nagar cổ kính.',
        highlights: ['Tháp Bà Po Nagar', 'Hòn Mun', 'VinWonders', 'Đảo Bình Ba'],
        bestTime: 'Tháng 1 – 8',
        duration: '3 – 4 ngày',
        hero: 'Nha Trang Beach, Vietnam.jpg',
        gallery: [
            { file: 'Nha Trang Beach 1.jpg', caption: 'Bãi biển Trần Phú' },
            { file: 'Po Nagar Nha Trang Vietnam.JPG', caption: 'Tháp Bà Po Nagar' },
            { file: 'Nha Trang, Po Nagar Cham, North Tower (6223880651).jpg', caption: 'Tháp Chăm cổ' },
            { file: 'Nhatrang Beach at night.jpg', caption: 'Nha Trang về đêm' },
            { file: 'Beach at Nha Trang, Vietnam.jpg', caption: 'Biển xanh cát trắng' },
        ],
        foods: [
            { name: 'Bún chả cá', desc: 'Chả cá thu, cá chuồn chiên và hấp trong nước dùng ngọt thanh.', price: '35.000đ', file: null },
            { name: 'Nem nướng Ninh Hòa', desc: 'Nem nướng than cuốn bánh tráng, rau sống, chấm tương đặc biệt.', price: '50.000đ', file: null },
            { name: 'Bánh căn', desc: 'Bánh đổ khuôn đất nung, nhân trứng, mực, tôm, chấm nước mắm.', price: '30.000đ', file: 'Bánh căn in phan rang, vietnam.jpg' },
        ],
        activities: [
            { icon: 'ri-drop-line', title: 'Lặn ngắm san hô', desc: 'Khu bảo tồn biển Hòn Mun với làn nước trong vắt.' },
            { icon: 'ri-sailboat-line', title: 'Tour 4 đảo', desc: 'Hòn Mun, Hòn Tằm, Hòn Một, Bãi Tranh trong một ngày.' },
            { icon: 'ri-sun-line', title: 'Tắm bùn khoáng', desc: 'Thư giãn tại Tháp Bà hoặc I-Resort.' },
            { icon: 'ri-riding-line', title: 'VinWonders', desc: 'Công viên giải trí trên đảo Hòn Tre.' },
        ],
        tips: ['Mùa mưa ngắn từ tháng 10 đến tháng 12.', 'Mua hải sản tại chợ Xóm Mới và nhờ quán chế biến để tiết kiệm.'],
    },
    {
        id: 'da-lat',
        name: 'Đà Lạt',
        province: 'Lâm Đồng',
        region: 'trung',
        categories: ['nui', 'thanh-pho'],
        rating: 4.7,
        tagline: 'Thành phố ngàn hoa trên cao nguyên Lâm Viên',
        description: 'Với khí hậu se lạnh quanh năm, rừng thông reo, hồ nước thơ mộng và những biệt thự kiểu Pháp, Đà Lạt là điểm đến lãng mạn bậc nhất Việt Nam. Buổi sáng săn mây, chiều dạo hồ Xuân Hương và tối lang thang chợ đêm với ly sữa đậu nành nóng.',
        highlights: ['Hồ Xuân Hương', 'Ga Đà Lạt', 'Thung lũng Tình Yêu', 'Đồi chè Cầu Đất'],
        bestTime: 'Tháng 11 – 3 (mùa hoa)',
        duration: '3 ngày',
        hero: 'Xuan Huong Lake (31404267520).jpg',
        gallery: [
            { file: 'Da Lat Panorama.JPG', caption: 'Toàn cảnh Đà Lạt' },
            { file: 'HoXuanHuong.JPG', caption: 'Hồ Xuân Hương' },
            { file: 'Hồ Xuân Hương, Đà Lạt (2).JPG', caption: 'Hồ Xuân Hương về đêm' },
            { file: 'Rail cars at Dalat Station.JPG', caption: 'Ga xe lửa Đà Lạt' },
            { file: 'Da Lat - Viet Nam.jpg', caption: 'Thành phố giữa rừng thông' },
        ],
        foods: [
            { name: 'Bánh tráng nướng', desc: '"Pizza Việt Nam" – bánh tráng nướng than với trứng, hành, xúc xích.', price: '20.000đ', file: 'Bánh tráng nướng TP. Hồ Chí Minh - street food in Ho Chi Minh City, Vietnam.jpg' },
            { name: 'Bánh căn', desc: 'Bánh căn nóng hổi chấm xíu mại – món ăn sáng của người Đà Lạt.', price: '30.000đ', file: 'Bánh căn in phan rang, vietnam.jpg' },
            { name: 'Lẩu gà lá é', desc: 'Gà ta nấu cùng lá é thơm nồng, ấm bụng giữa tiết trời se lạnh.', price: '300.000đ', file: 'Homemade Hotpot.jpg', illustrative: 'Nồi lẩu nóng' },
            { name: 'Cà phê Đà Lạt', desc: 'Nhâm nhi cà phê nhìn đồi thông trong làn sương sớm.', price: '30.000đ', file: 'Ca Phe Sua Da.jpg' },
        ],
        activities: [
            { icon: 'ri-cloud-line', title: 'Săn mây Cầu Đất', desc: 'Ngắm biển mây trên đồi chè lúc 5 giờ sáng.' },
            { icon: 'ri-train-line', title: 'Tàu hỏa Trại Mát', desc: 'Chuyến tàu cổ từ ga Đà Lạt qua vườn rau, đồi hoa.' },
            { icon: 'ri-flower-line', title: 'Vườn hoa & dâu tây', desc: 'Tự tay hái dâu tây và dạo vườn hoa cẩm tú cầu.' },
            { icon: 'ri-store-3-line', title: 'Chợ đêm Đà Lạt', desc: 'Ăn vặt, mua đồ len và đặc sản mứt.' },
        ],
        tips: ['Mang áo khoác vì đêm Đà Lạt có thể xuống 12–15°C.', 'Cuối tuần và lễ Tết thường rất đông, nên đặt phòng sớm.'],
    },
    {
        id: 'mui-ne',
        name: 'Mũi Né',
        province: 'Bình Thuận',
        region: 'trung',
        categories: ['bien'],
        rating: 4.5,
        tagline: '"Tiểu sa mạc Sahara" của Việt Nam',
        description: 'Mũi Né nổi tiếng với những đồi cát đỏ, cát trắng thay hình đổi dạng theo gió, Suối Tiên với dòng nước chảy giữa vách đất đỏ và làng chài rộn ràng thuyền thúng. Đây cũng là thủ phủ lướt ván diều của Đông Nam Á.',
        highlights: ['Đồi cát Bay', 'Bàu Trắng', 'Suối Tiên', 'Làng chài Mũi Né'],
        bestTime: 'Tháng 11 – 4',
        duration: '2 ngày',
        hero: 'Vietnam, Mui Ne sand dunes.jpg',
        gallery: [
            { file: 'Mui Ne sand dunes voyage.jpg', caption: 'Đồi cát trải dài' },
            { file: 'Đồi cát Mũi Né.jpg', caption: 'Đồi cát Mũi Né' },
            { file: 'Fishing Boats, Mui Ne.jpg', caption: 'Làng chài Mũi Né' },
        ],
        foods: [
            { name: 'Bánh căn Phan Thiết', desc: 'Bánh căn giòn rìa, chấm nước mắm cá kho đặc trưng.', price: '25.000đ', file: 'Bánh căn in phan rang, vietnam.jpg' },
            { name: 'Gỏi cá mai', desc: 'Cá mai tái chanh trộn thính, cuốn bánh tráng rau rừng.', price: '120.000đ', file: null },
            { name: 'Bánh xèo', desc: 'Bánh xèo mực tươi giòn rụm bên bờ biển.', price: '30.000đ', file: 'Bánh xèo with nước mắm.jpg' },
        ],
        activities: [
            { icon: 'ri-car-line', title: 'Xe jeep đồi cát', desc: 'Ngắm bình minh trên Bàu Trắng bằng xe jeep.' },
            { icon: 'ri-windy-line', title: 'Lướt ván diều', desc: 'Gió mạnh đều quanh năm – lý tưởng cho kitesurf.' },
            { icon: 'ri-footprint-line', title: 'Trượt cát', desc: 'Trượt ván từ đỉnh đồi cát Bay.' },
            { icon: 'ri-walk-line', title: 'Lội Suối Tiên', desc: 'Đi chân trần giữa vách đá đỏ trắng kỳ thú.' },
        ],
        tips: ['Đến đồi cát lúc bình minh hoặc hoàng hôn để tránh cát nóng.', 'Mang kính râm và khăn che mặt khi gió lớn.'],
    },

    /*==================== MIỀN NAM ====================*/
    {
        id: 'sai-gon',
        name: 'TP. Hồ Chí Minh',
        province: 'Sài Gòn',
        region: 'nam',
        categories: ['thanh-pho'],
        rating: 4.6,
        tagline: 'Thành phố không ngủ đầy năng động',
        description: 'Sài Gòn là đô thị lớn nhất Việt Nam với nhịp sống sôi động suốt ngày đêm. Từ Nhà thờ Đức Bà, Bưu điện Thành phố mang dấu ấn Pháp đến những tòa cao ốc chọc trời, từ chợ Bến Thành nhộn nhịp đến những con hẻm ẩm thực bất tận.',
        highlights: ['Nhà thờ Đức Bà', 'Chợ Bến Thành', 'Dinh Độc Lập', 'Phố đi bộ Nguyễn Huệ'],
        bestTime: 'Tháng 12 – 4 (mùa khô)',
        duration: '2 – 3 ngày',
        hero: 'Ho Chi Minh City Skyline at Night.jpg',
        gallery: [
            { file: 'Ho Chi Minh City Skyline 2022 (1).jpg', caption: 'Đường chân trời Sài Gòn' },
            { file: 'Notre Dame Cathedral Ho Chi Minh city (39543912241).jpg', caption: 'Nhà thờ Đức Bà' },
            { file: 'Ben Thanh Market, 2023 (02).jpg', caption: 'Chợ Bến Thành' },
            { file: 'Saigon skyline night view.jpg', caption: 'Quận 1 về đêm' },
            { file: 'Ben Thanh Market, Saigon.jpg', caption: 'Nhộn nhịp Bến Thành' },
        ],
        foods: [
            { name: 'Cơm tấm', desc: 'Sườn nướng mật ong, bì, chả trứng trên đĩa cơm tấm thơm dẻo.', price: '45.000đ', file: 'Broken rice restaurant in Saigon.JPG' },
            { name: 'Bánh mì Sài Gòn', desc: 'Ổ bánh mì đầy ắp pate, chả lụa, thịt nguội, đồ chua.', price: '25.000đ', file: 'Hai ổ bánh mì.jpg' },
            { name: 'Gỏi cuốn', desc: 'Tôm thịt cuốn bánh tráng cùng bún và rau sống, chấm tương đậu.', price: '10.000đ/cuốn', file: 'East-asian-food-spring-rolls-3.jpg' },
            { name: 'Hủ tiếu', desc: 'Sợi hủ tiếu dai, nước dùng xương ngọt thanh, tôm, gan, thịt bằm.', price: '45.000đ', file: 'Hu tieu trieu chau.JPG' },
        ],
        activities: [
            { icon: 'ri-building-line', title: 'City tour di sản', desc: 'Nhà thờ Đức Bà, Bưu điện, Dinh Độc Lập, Bảo tàng Chứng tích.' },
            { icon: 'ri-motorbike-line', title: 'Food tour xe máy', desc: 'Lượn phố đêm, thưởng thức ẩm thực Quận 4, Quận 5.' },
            { icon: 'ri-sailboat-line', title: 'Du thuyền sông Sài Gòn', desc: 'Ăn tối ngắm thành phố lên đèn.' },
            { icon: 'ri-map-pin-line', title: 'Địa đạo Củ Chi', desc: 'Hệ thống đường hầm lịch sử dài 250km.' },
        ],
        tips: ['Mưa rào thường đến buổi chiều trong mùa mưa (tháng 5 – 11).', 'Dùng ứng dụng gọi xe để di chuyển thuận tiện.'],
    },
    {
        id: 'can-tho',
        name: 'Cần Thơ – Miền Tây',
        province: 'Cần Thơ',
        region: 'nam',
        categories: ['thanh-pho'],
        rating: 4.6,
        tagline: 'Chợ nổi, vườn trái cây và sông nước miệt vườn',
        description: 'Thủ phủ đồng bằng sông Cửu Long mang đến trải nghiệm sông nước độc đáo: chợ nổi Cái Răng họp từ tờ mờ sáng, những miệt vườn trĩu quả, kênh rạch rợp bóng dừa và con người miền Tây hiền hòa, mến khách.',
        highlights: ['Chợ nổi Cái Răng', 'Bến Ninh Kiều', 'Nhà cổ Bình Thủy', 'Vườn trái cây Phong Điền'],
        bestTime: 'Tháng 9 – 11 (mùa nước nổi)',
        duration: '2 ngày',
        hero: 'Can Tho, Vietnam, Floating Market.jpg',
        gallery: [
            { file: 'Vietnam 08 - 112 - Cai Be floating market (3185044019).jpg', caption: 'Mua bán trên chợ nổi' },
            { file: 'Cho noi (Cai Rang, Can Tho).JPG', caption: 'Chợ nổi Cái Răng' },
            { file: 'CanThoFloatingMarket.jpg', caption: 'Ghe thuyền tấp nập' },
        ],
        foods: [
            { name: 'Bánh xèo miền Tây', desc: 'Bánh xèo to bằng chảo, nhân giá, tôm, thịt, cuốn cải bẹ xanh.', price: '40.000đ', file: 'Bánh xèo with nước mắm.jpg' },
            { name: 'Bánh khọt', desc: 'Bánh nhỏ giòn rụm, tôm tươi, ăn kèm rau sống và nước mắm.', price: '40.000đ', file: 'Banh khot aka Banh can - Thanh Ha AUD8 (4171696432).jpg' },
            { name: 'Bánh bò nướng', desc: 'Bánh lá dứa nướng than, rỗ tổ ong, thơm béo nước cốt dừa.', price: '15.000đ', file: 'Banh Bo Nuong.jpg' },
            { name: 'Hủ tiếu miền Tây', desc: 'Tô hủ tiếu nóng hổi bán ngay trên ghe giữa chợ nổi.', price: '30.000đ', file: 'Hu tieu trieu chau.JPG' },
        ],
        activities: [
            { icon: 'ri-sailboat-line', title: 'Chợ nổi lúc bình minh', desc: 'Ăn sáng trên ghe, ngắm cảnh mua bán tấp nập.' },
            { icon: 'ri-plant-line', title: 'Miệt vườn trái cây', desc: 'Hái chôm chôm, sầu riêng, măng cụt tại vườn.' },
            { icon: 'ri-music-line', title: 'Đờn ca tài tử', desc: 'Nghe nhạc truyền thống Nam Bộ bên bến sông.' },
            { icon: 'ri-bike-line', title: 'Đạp xe cù lao', desc: 'Khám phá làng quê trên cù lao Tân Lộc, Sơn.' },
        ],
        tips: ['Khởi hành đi chợ nổi từ 5h sáng để thấy chợ đông nhất.', 'Mùa trái cây rộ nhất vào tháng 5 – 8.'],
    },
    {
        id: 'phu-quoc',
        name: 'Phú Quốc',
        province: 'Kiên Giang',
        region: 'nam',
        categories: ['bien'],
        rating: 4.8,
        tagline: 'Đảo ngọc với hoàng hôn đẹp nhất Việt Nam',
        description: 'Hòn đảo lớn nhất Việt Nam sở hữu những bãi cát trắng mịn, làn nước trong xanh như ngọc và hoàng hôn rực rỡ ở bờ Tây. Phú Quốc còn nổi tiếng với nước mắm, hồ tiêu, ngọc trai và tuyến cáp treo vượt biển dài nhất thế giới.',
        highlights: ['Bãi Sao', 'Hòn Thơm', 'Grand World', 'Làng chài Hàm Ninh'],
        bestTime: 'Tháng 11 – 4',
        duration: '3 – 4 ngày',
        hero: 'Amazing beach on Phu Quoc island Vietnam (38647607275).jpg',
        gallery: [
            { file: 'Beautiful beach on Phu Quoc island Vietnam (39543775721).jpg', caption: 'Bãi biển hoang sơ' },
            { file: 'Sunset on Phu Quoc island.jpg', caption: 'Hoàng hôn Phú Quốc' },
            { file: 'Starfishes on the Starfish Beach, Phu Quoc, Vietnam.jpg', caption: 'Rạch Vẹm – bãi sao biển' },
            { file: 'Bai-sao-phu-quoc-tuonglamphotos.jpg', caption: 'Bãi Sao cát trắng' },
        ],
        foods: [
            { name: 'Gỏi cá trích', desc: 'Cá trích tươi trộn dừa nạo, hành tây, cuốn bánh tráng rau rừng.', price: '120.000đ', file: 'Ham Ninh market, Phu Quoc- Kien Giang, Vietnam - panoramio.jpg', illustrative: 'Chợ hải sản Hàm Ninh' },
            { name: 'Nước mắm Phú Quốc', desc: 'Nước mắm cá cơm ủ chượp trong thùng gỗ hàng năm trời – đặc sản trứ danh của đảo.', price: '150.000đ/lít', file: 'Vats at a Fish Sauce Factory on Phu Quoc Island in Vietnam 01.jpg', illustrative: 'Nhà thùng ủ nước mắm' },
            { name: 'Bánh canh ghẹ', desc: 'Bánh canh sánh sệt với ghẹ Hàm Ninh chắc thịt, ngọt lịm.', price: '60.000đ', file: 'Bánh canh cua (Vietnamese thick noodle with crab soup).jpg' },
        ],
        activities: [
            { icon: 'ri-riding-line', title: 'Cáp treo Hòn Thơm', desc: 'Tuyến cáp treo vượt biển dài gần 8km.' },
            { icon: 'ri-drop-line', title: 'Lặn ngắm san hô', desc: 'Tour 4 đảo quần đảo An Thới.' },
            { icon: 'ri-sun-foggy-line', title: 'Ngắm hoàng hôn', desc: 'Sunset Town hoặc bãi Dài lúc chiều tà.' },
            { icon: 'ri-store-2-line', title: 'Chợ đêm Dinh Cậu', desc: 'Hải sản tươi sống và đặc sản đảo ngọc.' },
        ],
        tips: ['Mùa mưa (tháng 5 – 10) biển bờ Tây động, nên chọn bãi Sao ở bờ Đông.', 'Nước mắm không được mang lên máy bay dạng lỏng thông thường.'],
    },
    {
        id: 'con-dao',
        name: 'Côn Đảo',
        province: 'Bà Rịa – Vũng Tàu',
        region: 'nam',
        categories: ['bien', 'di-san'],
        rating: 4.7,
        tagline: 'Thiên nhiên hoang sơ và những trang sử bi hùng',
        description: 'Quần đảo gồm 16 hòn đảo với rừng nguyên sinh, bãi biển vắng và rạn san hô còn nguyên vẹn. Côn Đảo cũng là chứng tích lịch sử với hệ thống nhà tù và nghĩa trang Hàng Dương – nơi yên nghỉ của nữ anh hùng Võ Thị Sáu.',
        highlights: ['Bãi Đầm Trầu', 'Nhà tù Côn Đảo', 'Nghĩa trang Hàng Dương', 'Hòn Bảy Cạnh'],
        bestTime: 'Tháng 3 – 9',
        duration: '2 – 3 ngày',
        hero: 'Pulo Condore island beach.jpg',
        gallery: [
            { file: 'Côn Đảo National Park.jpg', caption: 'Vườn quốc gia Côn Đảo' },
            { file: 'Côn Đảo banner prison.jpg', caption: 'Di tích nhà tù Côn Đảo' },
            { file: 'Con Dao Tiger Käfige.jpg', caption: 'Chuồng cọp Côn Đảo' },
        ],
        foods: [
            { name: 'Hải sản Côn Đảo', desc: 'Mực, ốc vú nàng, cua đá tươi rói từ biển.', price: 'Theo thời giá', file: null },
            { name: 'Hạt bàng', desc: 'Đặc sản dân dã, hạt bàng rang hoặc làm kẹo, thơm bùi.', price: '400.000đ/kg', file: null },
            { name: 'Bánh xèo', desc: 'Bánh xèo hải sản nóng giòn bên bờ biển.', price: '35.000đ', file: 'Bánh xèo with nước mắm.jpg' },
        ],
        activities: [
            { icon: 'ri-drop-line', title: 'Lặn biển Hòn Bảy Cạnh', desc: 'Ngắm rạn san hô và rùa biển trong vườn quốc gia.' },
            { icon: 'ri-moon-line', title: 'Xem rùa đẻ trứng', desc: 'Tháng 5 – 9 trên Hòn Bảy Cạnh (cần đăng ký).' },
            { icon: 'ri-candle-line', title: 'Viếng nghĩa trang Hàng Dương', desc: 'Thắp hương tưởng niệm các anh hùng liệt sĩ.' },
            { icon: 'ri-walk-line', title: 'Trekking rừng nguyên sinh', desc: 'Đường mòn Ông Đụng, Đỉnh Thánh Giá.' },
        ],
        tips: ['Chuyến bay tới Côn Đảo ít, nên đặt vé sớm.', 'Tôn trọng các quy định khi thăm khu di tích lịch sử.'],
    },
]

function getDestination(id) {
    return DESTINATIONS.find(d => d.id === id)
}

/*=============== ẢNH NHIỀU TẦNG DỰ PHÒNG ===============*/
/* Ảnh đại diện của điểm đến: nếu ảnh bìa lỗi sẽ lần lượt thử các ảnh trong gallery */
function heroCandidates(dest) {
    return [dest.hero, ...dest.gallery.map(g => g.file)]
}

/* Chuỗi dùng cho thuộc tính data-wiki (các ảnh dự phòng ngăn cách bởi "|") */
function wikiAttr(files) {
    return (Array.isArray(files) ? files : [files]).join('|').replace(/"/g, '&quot;')
}

function markImgFallback(img) {
    img.classList.add('img--hidden')
    if (img.parentElement) img.parentElement.classList.add('img-fallback')
    img.dispatchEvent(new CustomEvent('wiki:failed', { bubbles: true }))
}

/*
 * Gán src cho các <img data-wiki="a.jpg|b.jpg" data-width="1280">.
 * Khi một ảnh lỗi, tự động chuyển sang ảnh kế tiếp; hết ảnh thì hiện khung thay thế.
 */
function hydrateWikiImages(root = document) {
    root.querySelectorAll('img[data-wiki]:not([data-hydrated])').forEach(img => {
        const files = img.dataset.wiki.split('|').filter(Boolean)
        const width = Number(img.dataset.width) || 1280
        let index = 0

        img.dataset.hydrated = ''
        img.addEventListener('error', () => {
            index++
            if (index < files.length) img.src = wikiImg(files[index], width)
            else markImgFallback(img)
        })
        img.src = wikiImg(files[0], width)
    })
}
