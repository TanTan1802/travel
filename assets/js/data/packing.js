/*=============== DANH SÁCH ĐỒ CẦN MANG ===============*/
/*
 * Danh sách tự sinh theo điểm đến + tháng đi:
 * - base: đồ cần cho mọi chuyến.
 * - rules: thêm đồ khi điều kiện đúng (xem packingConditions() bên dưới).
 * Mỗi món: { id, name: [vi, en] } – id dùng để ghi nhớ ô đã đánh dấu.
 */
const PACKING_GROUPS = {
    docs: { icon: 'ri-passport-line', label: ['Giấy tờ & tiền', 'Documents & money'] },
    clothes: { icon: 'ri-t-shirt-line', label: ['Quần áo', 'Clothing'] },
    health: { icon: 'ri-first-aid-kit-line', label: ['Sức khỏe & vệ sinh', 'Health & toiletries'] },
    gear: { icon: 'ri-plug-line', label: ['Đồ dùng & điện tử', 'Gear & electronics'] },
}

/* Điểm đến vùng cao / khí hậu mát – cần áo ấm, nhất là tối và mùa đông */
const COOL_DESTINATIONS = ['sa-pa', 'ha-giang', 'moc-chau', 'mu-cang-chai', 'pu-luong', 'ban-gioc', 'da-lat']
/* Đi tàu, cano ra đảo */
const BOAT_DESTINATIONS = ['vinh-ha-long', 'cat-ba', 'phu-quoc', 'con-dao', 'ly-son', 'ha-tien', 'nha-trang', 'quy-nhon', 'phu-yen', 'ninh-thuan', 'co-to', 'ca-mau', 'nam-du']
/* Thường đi bằng xe máy qua đèo */
const MOTORBIKE_DESTINATIONS = ['ha-giang', 'mu-cang-chai', 'ban-gioc', 'pu-luong']
/* Có trekking / đi bộ đường dài */
const TREK_DESTINATIONS = ['sa-pa', 'ha-giang', 'mu-cang-chai', 'pu-luong', 'phong-nha', 'cat-ba', 'ninh-binh', 'ban-gioc', 'moc-chau']

const PACKING = {
    base: [
        { id: 'cccd', group: 'docs', name: ['CCCD / hộ chiếu', 'ID card / passport'] },
        { id: 'cash', group: 'docs', name: ['Tiền mặt (chợ, quán nhỏ ít nhận thẻ)', 'Cash (markets and small shops rarely take cards)'] },
        { id: 'bank', group: 'docs', name: ['Thẻ ngân hàng / ví điện tử', 'Bank card / e-wallet'] },
        { id: 'booking', group: 'docs', name: ['Xác nhận đặt phòng, vé (lưu offline)', 'Booking confirmations (saved offline)'] },
        { id: 'clothes', group: 'clothes', name: ['Quần áo đủ số ngày + 1 bộ dự phòng', 'Clothes for each day + 1 spare set'] },
        { id: 'shoes', group: 'clothes', name: ['Giày đi bộ thoải mái', 'Comfortable walking shoes'] },
        { id: 'meds', group: 'health', name: ['Thuốc cá nhân, hạ sốt, đau bụng', 'Personal meds, fever and stomach remedies'] },
        { id: 'toiletries', group: 'health', name: ['Đồ vệ sinh cá nhân', 'Toiletries'] },
        { id: 'charger', group: 'gear', name: ['Sạc điện thoại + pin dự phòng', 'Phone charger + power bank'] },
        { id: 'bottle', group: 'gear', name: ['Bình nước cá nhân', 'Reusable water bottle'] },
    ],
    rules: [
        { when: 'beach', items: [
            { id: 'swim', group: 'clothes', name: ['Đồ bơi, dép tông', 'Swimwear and flip-flops'] },
            { id: 'sunscreen', group: 'health', name: ['Kem chống nắng SPF 50', 'SPF 50 sunscreen'] },
            { id: 'hat', group: 'clothes', name: ['Mũ rộng vành, kính râm', 'Wide-brim hat and sunglasses'] },
            { id: 'drybag', group: 'gear', name: ['Túi chống nước cho điện thoại', 'Waterproof phone pouch'] },
        ] },
        { when: 'boat', items: [
            { id: 'seasick', group: 'health', name: ['Thuốc say tàu xe', 'Motion-sickness tablets'] },
        ] },
        { when: 'mountain', items: [
            { id: 'jacket', group: 'clothes', name: ['Áo khoác (tối và sáng sớm se lạnh)', 'Jacket (cool mornings and evenings)'] },
            { id: 'repellent', group: 'health', name: ['Kem chống muỗi, côn trùng', 'Insect repellent'] },
        ] },
        { when: 'cold', items: [
            { id: 'down', group: 'clothes', name: ['Áo phao / áo ấm dày', 'Down jacket / warm coat'] },
            { id: 'gloves', group: 'clothes', name: ['Găng tay, mũ len, tất dày', 'Gloves, beanie and thick socks'] },
            { id: 'lipbalm', group: 'health', name: ['Son dưỡng, kem dưỡng da', 'Lip balm and moisturiser'] },
        ] },
        { when: 'hot', items: [
            { id: 'light', group: 'clothes', name: ['Quần áo mỏng, thoáng', 'Light, breathable clothing'] },
            { id: 'electrolyte', group: 'health', name: ['Oresol / nước điện giải', 'Oral rehydration salts'] },
        ] },
        { when: 'rain', items: [
            { id: 'raincoat', group: 'clothes', name: ['Áo mưa / ô gấp', 'Raincoat / compact umbrella'] },
            { id: 'plasticbag', group: 'gear', name: ['Túi nilon bọc đồ điện tử', 'Plastic bags to keep electronics dry'] },
        ] },
        { when: 'trek', items: [
            { id: 'trekshoes', group: 'clothes', name: ['Giày trekking đế bám', 'Grippy trekking shoes'] },
            { id: 'daypack', group: 'gear', name: ['Balo nhỏ đi trong ngày', 'Small daypack'] },
            { id: 'plaster', group: 'health', name: ['Băng dán cá nhân', 'Plasters'] },
        ] },
        { when: 'motorbike', items: [
            { id: 'license', group: 'docs', name: ['Bằng lái xe máy (A1)', 'Motorbike licence (A1)'] },
            { id: 'rainsuit', group: 'clothes', name: ['Áo mưa bộ, găng tay chạy xe', 'Rain suit and riding gloves'] },
        ] },
        { when: 'heritage', items: [
            { id: 'modest', group: 'clothes', name: ['Trang phục kín vai, gối khi vào chùa, lăng', 'Clothes covering shoulders and knees for temples'] },
        ] },
        { when: 'family', items: [
            { id: 'kidsmeds', group: 'health', name: ['Thuốc hạ sốt, men tiêu hóa cho trẻ', 'Kids’ fever and digestion meds'] },
            { id: 'kidsgear', group: 'gear', name: ['Đồ ăn vặt, bình nước, đồ chơi nhỏ cho trẻ', 'Snacks, water bottle and small toys for kids'] },
            { id: 'wetwipes', group: 'health', name: ['Khăn ướt, khăn giấy', 'Wet wipes and tissues'] },
        ] },
        { when: 'elder', items: [
            { id: 'regularmeds', group: 'health', name: ['Thuốc dùng hằng ngày (huyết áp, tiểu đường...) đủ cả chuyến', 'Daily medication (blood pressure, diabetes...) for the whole trip'] },
            { id: 'softshoes', group: 'clothes', name: ['Giày đế êm, chống trơn', 'Soft, non-slip shoes'] },
        ] },
        { when: 'cave', items: [
            { id: 'torch', group: 'gear', name: ['Đèn pin nhỏ', 'Small torch'] },
        ] },
    ],
}

/* Tháng lạnh ở miền Bắc và vùng cao */
const COLD_MONTHS = [11, 12, 1, 2, 3]
/* Tháng nóng nhất */
const HOT_MONTHS = [4, 5, 6, 7, 8]

/* Điều kiện đúng cho một điểm đến trong một tháng (0 = chưa chọn tháng) */
function packingConditions(d, month) {
    const set = new Set()
    if (d.categories.includes('bien')) set.add('beach')
    if (d.categories.includes('nui') || COOL_DESTINATIONS.includes(d.id)) set.add('mountain')
    if (d.categories.includes('di-san')) set.add('heritage')
    if (d.categories.includes('hang-dong')) set.add('cave')
    if (BOAT_DESTINATIONS.includes(d.id)) set.add('boat')
    if (MOTORBIKE_DESTINATIONS.includes(d.id)) set.add('motorbike')
    if (TREK_DESTINATIONS.includes(d.id)) set.add('trek')
    if (month) {
        const coldPlace = COOL_DESTINATIONS.includes(d.id) || d.region === 'bac'
        if (coldPlace && COLD_MONTHS.includes(month)) set.add('cold')
        if (!COOL_DESTINATIONS.includes(d.id) && HOT_MONTHS.includes(month)) set.add('hot')
        if (!d.bestMonths.includes(month)) set.add('rain')
    }
    return set
}

/* Danh sách đồ gộp cho một hoặc nhiều điểm đến, không trùng món (style: phong cách chuyến đi) */
function packingList(dests, months = [], { style = '' } = {}) {
    const seen = new Set()
    const items = []
    const add = item => {
        if (seen.has(item.id)) return
        seen.add(item.id)
        items.push(item)
    }
    PACKING.base.forEach(add)
    dests.forEach((d, i) => {
        const conditions = packingConditions(d, months[i] || months[0] || 0)
        if (style === 'family' || style === 'elder') conditions.add(style)
        PACKING.rules.forEach(rule => { if (conditions.has(rule.when)) rule.items.forEach(add) })
    })
    return Object.keys(PACKING_GROUPS)
        .map(group => ({ group, items: items.filter(item => item.group === group) }))
        .filter(g => g.items.length)
}
