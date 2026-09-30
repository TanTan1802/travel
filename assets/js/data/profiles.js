/*=============== HỒ SƠ CHUYẾN ĐI: ĐIỂM XUẤT PHÁT, SỐ NGƯỜI, PHONG CÁCH ===============*/
/* Thành phố xuất phát phổ biến (id điểm đến có sẵn tọa độ) */
const ORIGIN_IDS = ['ha-noi', 'sai-gon', 'da-nang']
const PEOPLE_MAX = 20

/*
 * Phong cách chuyến đi:
 * - tips: gợi ý riêng; caution: các điểm đến cần cân nhắc (nhiều leo dốc, đi xe máy đèo, đi tàu xa bờ).
 * - tier: mức chi tiêu gợi ý khi chọn phong cách.
 */
const TRAVEL_STYLES = {
    solo: {
        icon: 'ri-user-line',
        label: ['Một mình', 'Solo'],
        tips: [
            ['Ở homestay hoặc hostel có phòng chung để dễ kết bạn và tiết kiệm.', 'Stay in homestays or hostels with dorms to meet people and save money.'],
            ['Gửi lịch trình cho người thân, bật chia sẻ vị trí khi đi đường đèo, đảo.', 'Share your itinerary with family and your location on mountain or island legs.'],
        ],
        caution: [],
    },
    couple: {
        icon: 'ri-heart-2-line',
        label: ['Cặp đôi', 'Couple'],
        tips: [
            ['Đặt phòng có view (biển, ruộng bậc thang) cho 1–2 đêm đặc biệt.', 'Book a room with a view (sea, rice terraces) for one or two special nights.'],
            ['Ngắm hoàng hôn ở các điểm gợi ý trong lịch trình buổi tối.', 'Catch the sunsets suggested in the evening itinerary.'],
        ],
        caution: [],
    },
    family: {
        icon: 'ri-parent-line',
        label: ['Gia đình có trẻ nhỏ', 'Family with young kids'],
        tier: 'comfort',
        tips: [
            ['Chọn khách sạn/resort có hồ bơi, tránh chặng xe liên tục trên 4 giờ.', 'Choose hotels or resorts with a pool and avoid road legs over 4 hours.'],
            ['Nghỉ trưa ở nơi ở; bỏ bớt hoạt động leo núi, trekking dài.', 'Rest at your accommodation at midday and skip long treks.'],
            ['Mang thuốc hạ sốt, men tiêu hóa cho trẻ; ăn ở quán sạch, đông khách.', 'Bring kids’ fever and digestion meds; eat at clean, busy places.'],
        ],
        caution: ['ha-giang', 'mu-cang-chai', 'ban-gioc', 'pu-luong'],
    },
    friends: {
        icon: 'ri-group-line',
        label: ['Nhóm bạn', 'Group of friends'],
        tips: [
            ['Thuê xe riêng/limousine cả nhóm thường rẻ hơn đi lẻ.', 'Hiring a private car or limousine for the group is often cheaper.'],
            ['Chia chi phí chung bằng ứng dụng ghi chép để khỏi nhầm lẫn.', 'Track shared costs in an expense-splitting app.'],
        ],
        caution: [],
    },
    elder: {
        icon: 'ri-walk-line',
        label: ['Có người lớn tuổi', 'With older travellers'],
        tier: 'comfort',
        tips: [
            ['Ưu tiên cáp treo, xe điện; tránh leo nhiều bậc và đường đèo dài.', 'Prefer cable cars and electric carts; avoid many steps and long mountain passes.'],
            ['Chọn khách sạn trung tâm, có thang máy; mang đủ thuốc thường dùng.', 'Choose central hotels with lifts and bring regular medication.'],
        ],
        caution: ['ha-giang', 'mu-cang-chai', 'ban-gioc', 'pu-luong', 'sa-pa', 'con-dao', 'ly-son'],
    },
    backpacker: {
        icon: 'ri-riding-line',
        label: ['Phượt / du lịch bụi', 'Backpacker'],
        tier: 'saving',
        tips: [
            ['Đi xe giường nằm đêm để tiết kiệm một đêm phòng.', 'Take night sleeper buses to save a night’s accommodation.'],
            ['Ăn quán địa phương, chợ đêm; thuê xe máy theo ngày ở điểm đến.', 'Eat at local spots and night markets; rent a motorbike by the day.'],
        ],
        caution: [],
    },
}

/* Tổng chi phí cho cả nhóm: phòng đôi 2 người/phòng (lẻ người thì thêm phòng), các khoản khác nhân số người */
function groupCost(perPersonTotal, perPersonStay, people) {
    const n = Math.max(1, people || 1)
    const rooms = Math.ceil(n / 2)
    return (perPersonTotal - perPersonStay) * n + perPersonStay * 2 * rooms
}
