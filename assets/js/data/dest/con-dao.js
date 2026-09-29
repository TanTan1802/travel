/* Sinh tự động bởi tools/build.js từ places.js + sights.js – không sửa tay. */
const STAY_TYPES = {"homestay":["Homestay","Homestay"],"hotel":["Khách sạn","Hotel"],"resort":["Resort","Resort"],"boat":["Du thuyền ngủ đêm","Overnight cruise"]}
const PLACES = {
 "con-dao": {
  "city": "Con Dao",
  "airport": "VCS",
  "getThere": [
   "Bay từ Sài Gòn/Cần Thơ tới sân bay Côn Sơn (VCS) ~1 giờ; hoặc tàu cao tốc từ Vũng Tàu/Sóc Trăng (Trần Đề) ~2,5–4 giờ.",
   "Fly from Saigon or Can Tho to Con Son (VCS) ~1 h; or a fast ferry from Vung Tau / Soc Trang (Tran De) ~2.5–4 h."
  ],
  "eats": [
   {
    "name": "Chợ đêm Côn Đảo",
    "dish": [
     "Hải sản nướng, bánh xèo, ốc",
     "Grilled seafood, banh xeo, snails"
    ],
    "address": "Đường Tôn Đức Thắng, Côn Sơn",
    "price": [
     80000,
     250000
    ]
   },
   {
    "name": "Quán Thu Ba",
    "dish": [
     "Hải sản, cá mú hấp, mực một nắng",
     "Seafood, steamed grouper, sun-dried squid"
    ],
    "address": "Đường Võ Văn Kiệt, Côn Sơn",
    "price": [
     200000,
     450000
    ]
   },
   {
    "name": "Bánh canh chả cá Côn Đảo",
    "dish": [
     "Bánh canh chả cá bữa sáng",
     "Fish-cake noodle soup for breakfast"
    ],
    "address": "Chợ Côn Đảo",
    "price": [
     30000,
     50000
    ]
   },
   {
    "name": "Hạt bàng Côn Đảo",
    "dish": [
     "Kẹo hạt bàng – quà đặc sản",
     "Tropical almond candy – a local gift"
    ],
    "address": "Chợ Côn Đảo",
    "price": [
     100000,
     250000
    ]
   },
   {
    "name": "Bánh mì – bánh canh chợ Côn Đảo",
    "dish": [
     "Bánh mì, bánh canh bữa sáng",
     "Banh mi or noodle soup for breakfast"
    ],
    "address": "Chợ Côn Đảo",
    "price": [
     30000,
     50000
    ]
   },
   {
    "name": "Quán ốc vú nàng Côn Sơn",
    "dish": [
     "Ốc vú nàng, cua đá",
     "Limpets and rock crab"
    ],
    "address": "Đường Nguyễn Huệ, Côn Sơn",
    "price": [
     150000,
     350000
    ]
   },
   {
    "name": "Nhà hàng Bà Ba Côn Đảo",
    "dish": [
     "Cơm nhà, cá kho, canh chua",
     "Home-style rice, braised fish, sour soup"
    ],
    "address": "Thị trấn Côn Sơn",
    "price": [
     100000,
     200000
    ]
   },
   {
    "name": "Quán mực một nắng bờ kè",
    "dish": [
     "Mực một nắng nướng, cá khô",
     "Grilled sun-dried squid and dried fish"
    ],
    "address": "Bờ kè Côn Sơn",
    "price": [
     150000,
     300000
    ]
   }
  ],
  "cafes": [
   {
    "name": "Cà phê bờ kè Côn Sơn",
    "drink": [
     "Cà phê, nước dừa ngắm vịnh",
     "Coffee and coconut water over the bay"
    ],
    "address": "Đường Tôn Đức Thắng, Côn Sơn",
    "price": [
     30000,
     60000
    ]
   },
   {
    "name": "Quán nước bãi An Hải",
    "drink": [
     "Nước dừa, sinh tố trên bãi",
     "Coconut water and smoothies on the beach"
    ],
    "address": "Bãi An Hải, Côn Sơn",
    "price": [
     25000,
     50000
    ]
   },
   {
    "name": "Quán chè chợ đêm Côn Đảo",
    "drink": [
     "Chè, sữa đậu nành",
     "Sweet soups and soy milk"
    ],
    "address": "Chợ đêm Côn Đảo",
    "price": [
     15000,
     30000
    ]
   }
  ],
  "stays": [
   {
    "area": [
     "Thị trấn Côn Sơn",
     "Con Son town"
    ],
    "type": "hotel",
    "price": [
     500000,
     1500000
    ],
    "note": [
     "Gần chợ, di tích nhà tù, nghĩa trang Hàng Dương.",
     "Near the market, prisons and Hang Duong cemetery."
    ]
   },
   {
    "area": [
     "Ven vịnh Côn Sơn",
     "Con Son Bay"
    ],
    "type": "homestay",
    "price": [
     400000,
     1000000
    ],
    "note": [
     "Ngắm bình minh trên vịnh.",
     "Watch sunrise over the bay."
    ]
   },
   {
    "area": [
     "Bãi Đất Dốc",
     "Dat Doc beach"
    ],
    "type": "resort",
    "price": [
     5000000,
     15000000
    ],
    "note": [
     "Resort cao cấp, biển riêng.",
     "Luxury resorts with private beaches."
    ]
   }
  ]
 }
}
const SIGHTS = {
 "con-dao": [
  [
   {
    "at": "m",
    "name": [
     "Di tích nhà tù Côn Đảo (trại Phú Hải, chuồng cọp)",
     "Con Dao prisons (Phu Hai, tiger cages)"
    ],
    "price": 50000,
    "note": [
     "Vé liên tuyến gồm bảo tàng",
     "Combined ticket incl. the museum"
    ],
    "hours": "07:30–11:00, 13:30–17:00",
    "address": "Lê Duẩn, Côn Sơn",
    "cafe": {
     "name": "Quán nước phố Lê Duẩn",
     "drink": [
      "Cà phê, nước dừa",
      "Coffee, coconut water"
     ],
     "price": [
      15000,
      40000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Bảo tàng Côn Đảo",
     "Con Dao Museum"
    ],
    "price": 0,
    "note": [
     "Dùng vé liên tuyến",
     "Uses the combined ticket"
    ],
    "hours": "07:30–11:00, 13:30–17:00",
    "address": "Nguyễn Huệ, Côn Sơn"
   },
   {
    "at": "a",
    "name": [
     "Cầu tàu 914",
     "Pier 914"
    ],
    "price": 0,
    "hours": "all",
    "address": "Tôn Đức Thắng, Côn Sơn",
    "cafe": {
     "name": "Cà phê bờ kè cầu tàu 914",
     "drink": [
      "Cà phê, nước ép ngắm biển",
      "Coffee and juice by the sea"
     ],
     "price": [
      20000,
      50000
     ]
    }
   },
   {
    "at": "e",
    "name": [
     "Nghĩa trang Hàng Dương",
     "Hang Duong cemetery"
    ],
    "price": 0,
    "hours": [
     "Mở cả đêm, đông nhất 23:00–24:00",
     "Open at night, busiest 11pm–midnight"
    ],
    "address": "Nguyễn An Ninh, Côn Sơn"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Bãi Đầm Trầu",
     "Dam Trau beach"
    ],
    "price": 0,
    "hours": "all",
    "address": "Gần sân bay Cỏ Ống, Côn Đảo",
    "cafe": {
     "name": "Quán nước dừa Đầm Trầu",
     "drink": [
      "Nước dừa, mực nướng",
      "Coconut water, grilled squid"
     ],
     "price": [
      20000,
      60000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Tour lặn san hô Hòn Bảy Cạnh / Hòn Cau",
     "Snorkelling at Bay Canh / Cau island"
    ],
    "price": [
     500000,
     1000000
    ],
    "note": [
     "Gồm cano, đồ lặn, phí VQG",
     "Includes boat, gear, park fee"
    ],
    "hours": "08:00–16:00",
    "address": "Cảng Bến Đầm, Côn Đảo"
   },
   {
    "at": "e",
    "name": [
     "Chợ đêm Côn Đảo",
     "Con Dao night market"
    ],
    "price": 0,
    "hours": "17:00–22:00",
    "address": "Tôn Đức Thắng, Côn Sơn"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Đường mòn Ông Đụng",
     "Ong Dung trail"
    ],
    "price": 60000,
    "note": [
     "Phí VQG Côn Đảo",
     "Con Dao National Park fee"
    ],
    "hours": "07:00–16:00",
    "address": "VQG Côn Đảo",
    "cafe": {
     "name": "Quán nước cổng đường mòn Ông Đụng",
     "drink": [
      "Nước chanh, nước dừa",
      "Lemonade, coconut water"
     ],
     "price": [
      15000,
      35000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Miếu Bà Phi Yến – chùa Vân Sơn",
     "Phi Yen temple – Van Son pagoda"
    ],
    "price": 0,
    "hours": "06:00–18:00",
    "address": "An Hội, Côn Sơn",
    "cafe": {
     "name": "Quán nước miếu Bà Phi Yến",
     "drink": [
      "Nước mía, trà đá",
      "Sugarcane juice, iced tea"
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
     "Hòn Bảy Cạnh – trạm bảo tồn rùa",
     "Bay Canh island – turtle station"
    ],
    "price": [
     1000000,
     1500000
    ],
    "note": [
     "Cano chia theo nhóm, cần giấy phép VQG",
     "Speedboat shared by group; park permit needed"
    ],
    "hours": "07:00–16:00",
    "address": "Cảng Bến Đầm, Côn Đảo"
   },
   {
    "at": "e",
    "name": [
     "Xem rùa đẻ trứng",
     "Turtle nesting watch"
    ],
    "price": [
     1500000,
     2500000
    ],
    "note": [
     "Tháng 5 – 9, đăng ký với VQG, ngủ lại đảo",
     "May – Sep, book with the park, overnight"
    ],
    "hours": [
     "Ban đêm",
     "At night"
    ],
    "address": "Hòn Bảy Cạnh, Côn Đảo"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Mũi Cá Mập – bãi Nhát",
     "Shark Cape – Nhat beach"
    ],
    "price": 0,
    "hours": "all",
    "address": "Đường Côn Sơn – Bến Đầm",
    "cafe": {
     "name": "Quán nước mũi Cá Mập",
     "drink": [
      "Cà phê, nước dừa đón bình minh",
      "Coffee and coconut water at sunrise"
     ],
     "price": [
      15000,
      40000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Biển An Hải",
     "An Hai beach"
    ],
    "price": 0,
    "hours": "all",
    "address": "Nguyễn Huệ, Côn Sơn",
    "cafe": {
     "name": "Cà phê bờ biển An Hải",
     "drink": [
      "Cà phê, nước dừa dưới hàng bàng",
      "Coffee and coconut water under the almond trees"
     ],
     "price": [
      20000,
      50000
     ]
    }
   }
  ]
 ]
}
