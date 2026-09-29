/* Sinh tự động bởi tools/build.js từ places.js + sights.js – không sửa tay. */
const STAY_TYPES = {"homestay":["Homestay","Homestay"],"hotel":["Khách sạn","Hotel"],"resort":["Resort","Resort"],"boat":["Du thuyền ngủ đêm","Overnight cruise"]}
const PLACES = {
 "ha-giang": {
  "city": "Ha Giang",
  "airport": "HAN",
  "getThere": [
   "Xe giường nằm Hà Nội – Hà Giang ~6–7 giờ (thường chạy đêm). Đi cung Đồng Văn – Mã Pì Lèng bằng xe máy tự lái hoặc thuê tài xế \"easy rider\".",
   "Sleeper bus Hanoi – Ha Giang ~6–7 h (often overnight). Ride the Dong Van – Ma Pi Leng loop on a scooter or hire an \"easy rider\" driver."
  ],
  "eats": [
   {
    "name": "Chợ đêm TP Hà Giang",
    "dish": [
     "Cháo ấu tẩu, bánh cuốn trứng",
     "Au tau porridge, egg rice rolls"
    ],
    "address": "Đường Nguyễn Thái Học, TP Hà Giang",
    "price": [
     30000,
     70000
    ]
   },
   {
    "name": "Phố cổ Đồng Văn",
    "dish": [
     "Bánh cuốn trứng canh xương, thắng cố",
     "Rice rolls in bone broth, thang co"
    ],
    "address": "Phố cổ Đồng Văn",
    "price": [
     30000,
     100000
    ]
   },
   {
    "name": "Chợ phiên Đồng Văn (Chủ nhật)",
    "dish": [
     "Thắng cố, rượu ngô, bánh tam giác mạch",
     "Thang co, corn wine, buckwheat cakes"
    ],
    "address": "Chợ Đồng Văn",
    "price": [
     30000,
     100000
    ]
   },
   {
    "name": "Quán thịt trâu gác bếp Yên Minh",
    "dish": [
     "Thịt trâu gác bếp, lạp xưởng hun khói",
     "Smoked buffalo, smoked sausages"
    ],
    "address": "Thị trấn Yên Minh",
    "price": [
     100000,
     250000
    ]
   },
   {
    "name": "Phở chua Quản Bạ",
    "dish": [
     "Phở chua ăn sáng dọc đường",
     "Sour pho for breakfast on the road"
    ],
    "address": "Thị trấn Tam Sơn, Quản Bạ",
    "price": [
     30000,
     50000
    ]
   },
   {
    "name": "Quán lẩu gà đen Mèo Vạc",
    "dish": [
     "Lẩu gà đen, rau cải mèo",
     "Black-chicken hotpot with H'Mong greens"
    ],
    "address": "Thị trấn Mèo Vạc",
    "price": [
     200000,
     350000
    ]
   },
   {
    "name": "Nhà hàng cơm bản Lũng Cú",
    "dish": [
     "Cơm bản: thịt treo, măng, đậu",
     "Village meal: smoked pork, bamboo shoots, beans"
    ],
    "address": "Chân cột cờ Lũng Cú",
    "price": [
     100000,
     200000
    ]
   },
   {
    "name": "Bếp homestay Du Già",
    "dish": [
     "Cơm nhà người Tày, cá suối",
     "Tay family meal with stream fish"
    ],
    "address": "Làng Du Già, Yên Minh",
    "price": [
     100000,
     180000
    ]
   }
  ],
  "cafes": [
   {
    "name": "Cà phê Phố Cáo – Đồng Văn",
    "drink": [
     "Cà phê, trà shan tuyết trong nhà trình tường",
     "Coffee and shan tuyet tea in a rammed-earth house"
    ],
    "address": "Phố cổ Đồng Văn",
    "price": [
     25000,
     50000
    ]
   },
   {
    "name": "Quán nước đỉnh Mã Pì Lèng",
    "drink": [
     "Trà nóng, nước ngô, bánh tam giác mạch",
     "Hot tea, corn drink, buckwheat cake"
    ],
    "address": "Đèo Mã Pì Lèng",
    "price": [
     15000,
     40000
    ]
   },
   {
    "name": "Cà phê bờ sông Lô",
    "drink": [
     "Cà phê, sinh tố ven sông",
     "Coffee and smoothies by the Lo river"
    ],
    "address": "TP Hà Giang",
    "price": [
     25000,
     50000
    ]
   }
  ],
  "stays": [
   {
    "area": [
     "TP Hà Giang (đêm đầu)",
     "Ha Giang city (first night)"
    ],
    "type": "hotel",
    "price": [
     300000,
     700000
    ],
    "note": [
     "Nghỉ sau chuyến xe đêm, thuê xe máy.",
     "Rest after the night bus and rent your scooter."
    ]
   },
   {
    "area": [
     "Phố cổ Đồng Văn",
     "Dong Van old town"
    ],
    "type": "homestay",
    "price": [
     250000,
     600000
    ],
    "note": [
     "Điểm nghỉ chính trước Mã Pì Lèng.",
     "The main overnight stop before Ma Pi Leng."
    ]
   },
   {
    "area": [
     "Làng Lô Lô Chải – Lũng Cú",
     "Lo Lo Chai – Lung Cu"
    ],
    "type": "homestay",
    "price": [
     300000,
     700000
    ],
    "note": [
     "Nhà trình tường cổ, gần cột cờ Lũng Cú.",
     "Rammed-earth houses near the Lung Cu flag tower."
    ]
   }
  ]
 }
}
const SIGHTS = {
 "ha-giang": [
  [
   {
    "at": "m",
    "name": [
     "Cột mốc Km0 Hà Giang",
     "Ha Giang Km0 marker"
    ],
    "price": 0,
    "hours": "all",
    "address": "Trước UBND tỉnh, TP Hà Giang",
    "cafe": {
     "name": "Cà phê Km0 Hà Giang",
     "drink": [
      "Cà phê, trà shan tuyết trước khi lên đường",
      "Coffee or shan tea before setting off"
     ],
     "price": [
      25000,
      50000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Cổng trời Quản Bạ – núi đôi Cô Tiên",
     "Quan Ba Heaven Gate – Fairy Bosom hills"
    ],
    "price": 0,
    "hours": "all",
    "address": "Tam Sơn, Quản Bạ",
    "cafe": {
     "name": "Quán nước cổng trời Quản Bạ",
     "drink": [
      "Trà nóng, trứng nướng ngắm núi đôi",
      "Hot tea and grilled eggs facing the twin hills"
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
     "Rừng thông Yên Minh",
     "Yen Minh pine forest"
    ],
    "price": 0,
    "hours": "all",
    "address": "QL4C, Yên Minh"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Dinh thự họ Vương",
     "Vuong family mansion"
    ],
    "price": 20000,
    "hours": "07:00–17:30",
    "address": "Sà Phìn, Đồng Văn"
   },
   {
    "at": "m",
    "name": [
     "Dốc Thẩm Mã",
     "Tham Ma slope"
    ],
    "price": 0,
    "hours": "all",
    "address": "QL4C, Phố Cáo",
    "cafe": {
     "name": "Quán nước dốc Thẩm Mã",
     "drink": [
      "Trà shan tuyết, sữa ngô",
      "Shan tea, corn milk"
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
     "Cột cờ Lũng Cú",
     "Lung Cu flag tower"
    ],
    "price": 25000,
    "hours": "07:00–17:30",
    "address": "Lũng Cú, Đồng Văn",
    "cafe": {
     "name": "Quán trà chân cột cờ Lũng Cú",
     "drink": [
      "Trà nóng, bánh tam giác mạch",
      "Hot tea, buckwheat cakes"
     ],
     "price": [
      15000,
      40000
     ]
    }
   },
   {
    "at": "e",
    "name": [
     "Phố cổ Đồng Văn",
     "Dong Van old quarter"
    ],
    "price": 0,
    "hours": "all",
    "address": "Thị trấn Đồng Văn"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Đèo Mã Pí Lèng – hẻm Tu Sản",
     "Ma Pi Leng pass – Tu San canyon"
    ],
    "price": 0,
    "hours": "all",
    "address": "QL4C, Đồng Văn – Mèo Vạc",
    "cafe": {
     "name": "Mã Pí Lèng Panorama",
     "drink": [
      "Cà phê, trà ngắm sông Nho Quế",
      "Coffee and tea above the Nho Que river"
     ],
     "price": [
      35000,
      70000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Thuyền sông Nho Quế",
     "Nho Que river boat"
    ],
    "price": [
     150000,
     200000
    ],
    "note": [
     "Khứ hồi ~1,5 giờ",
     "Return trip ~1.5 h"
    ],
    "hours": "07:00–17:00",
    "address": "Bến thuyền Tà Làng, Mèo Vạc",
    "cafe": {
     "name": "Quán nước bến thuyền Nho Quế",
     "drink": [
      "Nước dừa, nước ngọt, bắp luộc",
      "Coconut water, soft drinks, boiled corn"
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
     "Cung đường Mèo Vạc – Du Già",
     "Meo Vac – Du Gia road"
    ],
    "price": 0,
    "hours": "all",
    "address": "Mèo Vạc – Yên Minh"
   },
   {
    "at": "a",
    "name": [
     "Thác Du Già",
     "Du Gia waterfall"
    ],
    "price": 0,
    "hours": "all",
    "address": "Du Già, Yên Minh",
    "cafe": {
     "name": "Quán nước thác Du Già",
     "drink": [
      "Trà, bia lạnh, nước ngọt",
      "Tea, cold beer, soft drinks"
     ],
     "price": [
      15000,
      35000
     ]
    }
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Ruộng bậc thang Hoàng Su Phì",
     "Hoang Su Phi rice terraces"
    ],
    "price": 0,
    "note": [
     "Đẹp nhất tháng 5 – 6 và 9 – 10",
     "Best in May – Jun and Sep – Oct"
    ],
    "hours": "all",
    "address": "Hoàng Su Phì, Hà Giang",
    "cafe": {
     "name": "Quán trà shan tuyết Hoàng Su Phì",
     "drink": [
      "Trà shan tuyết cổ thụ",
      "Ancient shan tuyet tea"
     ],
     "price": [
      20000,
      50000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Đồi chè Nậm Hồng",
     "Nam Hong tea hills"
    ],
    "price": 0,
    "hours": "all",
    "address": "Nậm Hồng, Hoàng Su Phì"
   }
  ]
 ]
}
