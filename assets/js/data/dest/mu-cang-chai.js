/* Sinh tự động bởi tools/build.js từ places.js + sights.js – không sửa tay. */
const STAY_TYPES = {"homestay":["Homestay","Homestay"],"hotel":["Khách sạn","Hotel"],"resort":["Resort","Resort"],"boat":["Du thuyền ngủ đêm","Overnight cruise"]}
const PLACES = {
 "mu-cang-chai": {
  "city": "Mu Cang Chai",
  "airport": "HAN",
  "getThere": [
   "Xe khách Hà Nội – Mù Cang Chải ~7–8 giờ qua Nghĩa Lộ, đèo Khau Phạ. Đẹp nhất mùa lúa chín cuối tháng 9 – đầu tháng 10.",
   "Bus Hanoi – Mu Cang Chai ~7–8 h via Nghia Lo and Khau Pha pass. Best at harvest, late Sep – early Oct."
  ],
  "eats": [
   {
    "name": "Chợ Mù Cang Chải",
    "dish": [
     "Xôi ngũ sắc, cơm lam, bánh ngô",
     "Five-colour sticky rice, bamboo rice, corn cakes"
    ],
    "address": "Thị trấn Mù Cang Chải",
    "price": [
     30000,
     80000
    ]
   },
   {
    "name": "Quán thịt trâu gác bếp",
    "dish": [
     "Thịt trâu gác bếp, lợn bản nướng",
     "Smoked buffalo, grilled local pork"
    ],
    "address": "Thị trấn Mù Cang Chải",
    "price": [
     120000,
     250000
    ]
   },
   {
    "name": "Cá suối nướng La Pán Tẩn",
    "dish": [
     "Cá suối nướng, rau rừng xào",
     "Grilled stream fish, stir-fried wild greens"
    ],
    "address": "Xã La Pán Tẩn",
    "price": [
     100000,
     200000
    ]
   },
   {
    "name": "Xôi Tú Lệ",
    "dish": [
     "Xôi nếp Tú Lệ nổi tiếng, cốm mới",
     "Famous Tu Le sticky rice, young green rice"
    ],
    "address": "Thung lũng Tú Lệ (trên đường đi)",
    "price": [
     30000,
     60000
    ]
   },
   {
    "name": "Phở gà bản Mù Cang Chải",
    "dish": [
     "Phở gà, bún mọc buổi sáng",
     "Chicken pho or pork-ball noodles for breakfast"
    ],
    "address": "Thị trấn Mù Cang Chải",
    "price": [
     30000,
     50000
    ]
   },
   {
    "name": "Quán cơm Tú Lệ",
    "dish": [
     "Cơm nếp Tú Lệ, gà đồi",
     "Tu Le sticky rice, hill chicken"
    ],
    "address": "Thung lũng Tú Lệ",
    "price": [
     100000,
     200000
    ]
   },
   {
    "name": "Bếp homestay Lìm Mông",
    "dish": [
     "Lợn bản nướng, rau cải mèo",
     "Grilled local pork, H'Mong mustard greens"
    ],
    "address": "Bản Lìm Mông, Cao Phạ",
    "price": [
     100000,
     200000
    ]
   },
   {
    "name": "Quán lẩu cá hồi Khau Phạ",
    "dish": [
     "Lẩu cá hồi nuôi suối lạnh",
     "Cold-stream salmon hotpot"
    ],
    "address": "Chân đèo Khau Phạ",
    "price": [
     200000,
     350000
    ]
   }
  ],
  "cafes": [
   {
    "name": "Quán nước đèo Khau Phạ",
    "drink": [
     "Trà nóng, ngô nướng, trứng nướng",
     "Hot tea, grilled corn and eggs"
    ],
    "address": "Đèo Khau Phạ",
    "price": [
     10000,
     30000
    ]
   },
   {
    "name": "Cà phê view đồi Mâm Xôi",
    "drink": [
     "Cà phê, trà gừng ngắm ruộng bậc thang",
     "Coffee and ginger tea over the terraces"
    ],
    "address": "Xã La Pán Tẩn",
    "price": [
     25000,
     50000
    ]
   },
   {
    "name": "Quán nước chợ Mù Cang Chải",
    "drink": [
     "Trà, sữa đậu nành nóng",
     "Tea and hot soy milk"
    ],
    "address": "Thị trấn Mù Cang Chải",
    "price": [
     10000,
     25000
    ]
   }
  ],
  "stays": [
   {
    "area": [
     "Bản Lìm Mông – Cao Phạ",
     "Lim Mong – Cao Pha"
    ],
    "type": "homestay",
    "price": [
     250000,
     600000
    ],
    "note": [
     "Ngay giữa ruộng bậc thang.",
     "Right in the middle of the terraces."
    ]
   },
   {
    "area": [
     "Thị trấn Mù Cang Chải",
     "Mu Cang Chai town"
    ],
    "type": "hotel",
    "price": [
     300000,
     700000
    ],
    "note": [
     "Tiện đi đồi Mâm Xôi, La Pán Tẩn.",
     "Handy for Mam Xoi hill and La Pan Tan."
    ]
   },
   {
    "area": [
     "Tú Lệ",
     "Tu Le"
    ],
    "type": "homestay",
    "price": [
     300000,
     700000
    ],
    "note": [
     "Có suối khoáng nóng, nghỉ giữa đường.",
     "Hot springs – a good halfway stop."
    ]
   }
  ]
 }
}
const SIGHTS = {
 "mu-cang-chai": [
  [
   {
    "at": "a",
    "name": [
     "Suối khoáng nóng Tú Lệ",
     "Tu Le hot springs"
    ],
    "price": [
     50000,
     100000
    ],
    "hours": "07:00–21:00",
    "address": "Xã Tú Lệ, Văn Chấn, Yên Bái",
    "cafe": {
     "name": "Quán nước bên suối nóng Tú Lệ",
     "drink": [
      "Trà nóng, cốm Tú Lệ",
      "Hot tea with Tu Le green rice flakes"
     ],
     "price": [
      15000,
      40000
     ]
    }
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Đèo Khau Phạ",
     "Khau Pha pass"
    ],
    "price": 0,
    "note": [
     "Bay dù lượn đôi ~1.500.000–2.500.000đ (mùa lúa chín)",
     "Tandem paragliding ~1.5–2.5M đ (harvest season)"
    ],
    "hours": "all",
    "address": "QL32, Tú Lệ – Mù Cang Chải",
    "cafe": {
     "name": "Quán ngô nướng – trà nóng đỉnh Khau Phạ",
     "drink": [
      "Trà nóng, ngô nướng, trứng nướng",
      "Hot tea, grilled corn and eggs"
     ],
     "price": [
      10000,
      40000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Đồi Mâm Xôi – La Pán Tẩn",
     "Mam Xoi hill – La Pan Tan"
    ],
    "price": 20000,
    "note": [
     "Phí check-in",
     "Viewpoint fee"
    ],
    "hours": "06:00–18:00",
    "address": "La Pán Tẩn, Mù Cang Chải",
    "cafe": {
     "name": "Quán nước bản La Pán Tẩn",
     "drink": [
      "Trà nóng, nước ngọt ngắm ruộng",
      "Hot tea and soft drinks over the terraces"
     ],
     "price": [
      10000,
      30000
     ]
    }
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Ruộng bậc thang Chế Cu Nha",
     "Che Cu Nha terraces"
    ],
    "price": [
     10000,
     20000
    ],
    "note": [
     "Phí check-in",
     "Viewpoint fee"
    ],
    "hours": "05:30–18:00",
    "address": "Chế Cu Nha, Mù Cang Chải",
    "cafe": {
     "name": "Quán nước điểm ngắm Chế Cu Nha",
     "drink": [
      "Trà gừng, sữa ngô",
      "Ginger tea, corn milk"
     ],
     "price": [
      10000,
      30000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Bản Dế Xu Phình",
     "De Xu Phinh village"
    ],
    "price": [
     10000,
     20000
    ],
    "hours": "06:00–18:00",
    "address": "Dế Xu Phình, Mù Cang Chải",
    "cafe": {
     "name": "Quán nước bản Dế Xu Phình",
     "drink": [
      "Trà nóng, khoai nướng",
      "Hot tea, roast potatoes"
     ],
     "price": [
      10000,
      30000
     ]
    }
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Thác Mơ – rừng pơ mu Púng Luông",
     "Mo waterfall – Pung Luong pơ mu forest"
    ],
    "price": 0,
    "hours": "all",
    "address": "Púng Luông, Mù Cang Chải",
    "cafe": {
     "name": "Quán nước bản Púng Luông",
     "drink": [
      "Trà nóng, nước chanh",
      "Hot tea, lemonade"
     ],
     "price": [
      10000,
      25000
     ]
    }
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Cánh đồng Mường Lò",
     "Muong Lo valley"
    ],
    "price": 0,
    "hours": "all",
    "address": "Nghĩa Lộ, Yên Bái",
    "cafe": {
     "name": "Cà phê cánh đồng Mường Lò",
     "drink": [
      "Cà phê, nước ép nhìn đồng lúa",
      "Coffee and juice over the rice fields"
     ],
     "price": [
      20000,
      45000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Múa xòe Thái Nghĩa Lộ",
     "Thai xoe dance, Nghia Lo"
    ],
    "price": [
     0,
     50000
    ],
    "note": [
     "Xem tại bản hoặc nhà văn hóa",
     "At villages or the cultural house"
    ],
    "hours": [
     "Theo lịch biểu diễn",
     "Per show schedule"
    ],
    "address": "Bản Sà Rèn, Nghĩa Lộ",
    "cafe": {
     "name": "Quán cốm Tú Lệ – trà nóng",
     "drink": [
      "Trà nóng, cốm, xôi nếp Tú Lệ",
      "Hot tea, rice flakes, Tu Le sticky rice"
     ],
     "price": [
      15000,
      40000
     ]
    }
   }
  ]
 ]
}
