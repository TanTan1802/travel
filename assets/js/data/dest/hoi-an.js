/* Sinh tự động bởi tools/build.js từ places.js + sights.js – không sửa tay. */
const STAY_TYPES = {"homestay":["Homestay","Homestay"],"hotel":["Khách sạn","Hotel"],"resort":["Resort","Resort"],"boat":["Du thuyền ngủ đêm","Overnight cruise"]}
const PLACES = {
 "hoi-an": {
  "city": "Hoi An",
  "airport": "DAD",
  "rail": "Đà Nẵng",
  "getThere": [
   "Bay/tàu tới Đà Nẵng rồi đi taxi/Grab ~45 phút (30 km, ~300–400k) hoặc xe bus số 1 ra Hội An.",
   "Fly or take the train to Da Nang, then ~45 min by taxi/Grab (30 km, ~300–400k VND) or local bus no. 1."
  ],
  "eats": [
   {
    "name": "Bánh mì Phượng",
    "dish": [
     "Bánh mì thập cẩm nổi tiếng",
     "The famous mixed banh mi"
    ],
    "address": "2B Phan Châu Trinh, Hội An",
    "price": [
     30000,
     50000
    ]
   },
   {
    "name": "Cơm gà Bà Buội",
    "dish": [
     "Cơm gà xé Hội An",
     "Hoi An shredded chicken rice"
    ],
    "address": "22 Phan Châu Trinh, Hội An",
    "price": [
     40000,
     60000
    ]
   },
   {
    "name": "Cao lầu Thanh",
    "dish": [
     "Cao lầu sợi dai, thịt xá xíu",
     "Chewy cao lau noodles with char siu"
    ],
    "address": "26 Thái Phiên, Hội An",
    "price": [
     35000,
     50000
    ]
   },
   {
    "name": "Morning Glory",
    "dish": [
     "Món Hội An trong nhà cổ: hoành thánh, bánh xèo",
     "Hoi An classics in an old house: wontons, banh xeo"
    ],
    "address": "106 Nguyễn Thái Học, Hội An",
    "price": [
     100000,
     250000
    ]
   },
   {
    "name": "Bánh xèo giếng Bá Lễ",
    "dish": [
     "Bánh xèo, nem lụi cuốn rau",
     "Banh xeo and lemongrass pork rolls"
    ],
    "address": "45/51 Trần Hưng Đạo, Hội An",
    "price": [
     50000,
     100000
    ]
   },
   {
    "name": "Mì Quảng Ông Hai",
    "dish": [
     "Mì Quảng tôm thịt, ếch",
     "Mi Quang with shrimp & pork or frog"
    ],
    "address": "Trần Hưng Đạo, Hội An",
    "price": [
     30000,
     50000
    ]
   },
   {
    "name": "Hoành thánh chiên phố cổ",
    "dish": [
     "Hoành thánh chiên, bánh bao bánh vạc",
     "Fried wontons, white rose dumplings"
    ],
    "address": "Nguyễn Thái Học, Hội An",
    "price": [
     50000,
     100000
    ]
   },
   {
    "name": "Nhà hàng hải sản An Bàng",
    "dish": [
     "Hải sản nướng ven biển",
     "Grilled seafood by the beach"
    ],
    "address": "Biển An Bàng, Hội An",
    "price": [
     200000,
     450000
    ]
   }
  ],
  "cafes": [
   {
    "name": "Reaching Out Tea House",
    "drink": [
     "Trà, cà phê trong không gian yên lặng",
     "Tea and coffee in a silent tea house"
    ],
    "address": "131 Trần Phú, Hội An",
    "price": [
     50000,
     120000
    ]
   },
   {
    "name": "Faifo Coffee (sân thượng)",
    "drink": [
     "Cà phê, sinh tố ngắm mái ngói phố cổ",
     "Coffee and smoothies over the old-town rooftops"
    ],
    "address": "130 Trần Phú, Hội An",
    "price": [
     40000,
     80000
    ]
   },
   {
    "name": "Nước mót Hội An",
    "drink": [
     "Nước mót thảo mộc, chè",
     "Herbal \"nuoc mot\" drink and sweet soups"
    ],
    "address": "Phan Châu Trinh, Hội An",
    "price": [
     15000,
     30000
    ]
   }
  ],
  "stays": [
   {
    "area": [
     "Quanh phố cổ (Trần Hưng Đạo, Bà Triệu)",
     "Around the Old Town"
    ],
    "type": "homestay",
    "price": [
     400000,
     1200000
    ],
    "note": [
     "Đi bộ 5–10 phút vào phố cổ.",
     "5–10 minutes' walk to the Old Town."
    ]
   },
   {
    "area": [
     "Biển An Bàng – Cửa Đại",
     "An Bang – Cua Dai beach"
    ],
    "type": "resort",
    "price": [
     1000000,
     3500000
    ],
    "note": [
     "Kết hợp tắm biển, đạp xe vào phố 15 phút.",
     "Beach time plus a 15-min cycle to town."
    ]
   },
   {
    "area": [
     "Làng rau Trà Quế – Cẩm Thanh",
     "Tra Que – Cam Thanh"
    ],
    "type": "homestay",
    "price": [
     300000,
     800000
    ],
    "note": [
     "Giữa ruộng rau, rừng dừa – rất yên tĩnh.",
     "Among vegetable gardens and coconut groves – very quiet."
    ]
   }
  ]
 }
}
const SIGHTS = {
 "hoi-an": [
  [
   {
    "at": "m",
    "name": [
     "Vé tham quan phố cổ Hội An",
     "Hoi An Old Town ticket"
    ],
    "price": 120000,
    "note": [
     "Người Việt 80.000đ; vào 5 điểm tùy chọn",
     "80,000đ for Vietnamese; entry to 5 sites"
    ],
    "hours": "07:00–21:30",
    "address": "Quầy vé Nguyễn Thị Minh Khai, Hội An"
   },
   {
    "at": "m",
    "name": [
     "Chùa Cầu",
     "Japanese Covered Bridge"
    ],
    "price": 0,
    "note": [
     "Dùng vé phố cổ",
     "Uses the Old Town ticket"
    ],
    "hours": "08:00–21:00",
    "address": "Trần Phú, Hội An",
    "cafe": {
     "name": "Hội An Roastery (Chùa Cầu)",
     "drink": [
      "Cà phê rang xay, cà phê dừa",
      "Freshly roasted coffee, coconut coffee"
     ],
     "price": [
      40000,
      75000
     ]
    }
   },
   {
    "at": "m",
    "name": [
     "Hội quán Phúc Kiến",
     "Phuc Kien Assembly Hall"
    ],
    "price": 0,
    "note": [
     "Dùng vé phố cổ",
     "Uses the Old Town ticket"
    ],
    "hours": "07:00–17:30",
    "address": "46 Trần Phú, Hội An"
   },
   {
    "at": "m",
    "name": [
     "Nhà cổ Tấn Ký",
     "Tan Ky Old House"
    ],
    "price": 0,
    "note": [
     "Dùng vé phố cổ",
     "Uses the Old Town ticket"
    ],
    "hours": "08:00–18:00",
    "address": "101 Nguyễn Thái Học, Hội An"
   },
   {
    "at": "a",
    "name": [
     "Rừng dừa Bảy Mẫu – thuyền thúng",
     "Bay Mau coconut forest – basket boat"
    ],
    "price": [
     100000,
     150000
    ],
    "note": [
     "Mỗi người",
     "Per person"
    ],
    "hours": "07:00–17:30",
    "address": "Cẩm Thanh, Hội An",
    "cafe": {
     "name": "Quán nước dừa rừng dừa Bảy Mẫu",
     "drink": [
      "Nước dừa tươi, nước mía",
      "Fresh coconut, sugarcane juice"
     ],
     "price": [
      15000,
      35000
     ]
    }
   },
   {
    "at": "e",
    "name": [
     "Thả hoa đăng sông Hoài",
     "Lanterns on the Hoai river"
    ],
    "price": [
     20000,
     50000
    ],
    "note": [
     "Đò ~150.000đ/thuyền",
     "Boat ~150,000đ per boat"
    ],
    "hours": "17:30–22:00",
    "address": "Bến sông Hoài, Hội An"
   },
   {
    "at": "e",
    "name": [
     "Chợ đêm Nguyễn Hoàng",
     "Nguyen Hoang night market"
    ],
    "price": 0,
    "hours": "17:00–22:30",
    "address": "Nguyễn Hoàng, An Hội"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Lớp học nấu ăn – làng rau Trà Quế",
     "Cooking class – Tra Que village"
    ],
    "price": [
     500000,
     800000
    ],
    "note": [
     "Gồm đi chợ, nấu và ăn trưa",
     "Includes market visit, cooking and lunch"
    ],
    "hours": "08:00–13:00",
    "address": "Cẩm Hà, Hội An",
    "cafe": {
     "name": "Cà phê làng rau Trà Quế",
     "drink": [
      "Nước rau má, cà phê giữa vườn rau",
      "Pennywort juice and coffee in the garden"
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
     "Biển An Bàng",
     "An Bang beach"
    ],
    "price": 0,
    "note": [
     "Gửi xe ~10.000đ; ghế dù miễn phí nếu gọi đồ",
     "Parking ~10,000đ; free loungers if you order"
    ],
    "hours": "all",
    "address": "Cẩm An, Hội An",
    "cafe": {
     "name": "Quán nước bãi An Bàng",
     "drink": [
      "Nước dừa, sinh tố, bia lạnh",
      "Coconut water, smoothies, cold beer"
     ],
     "price": [
      30000,
      70000
     ]
    }
   },
   {
    "at": "e",
    "name": [
     "Show Ký ức Hội An",
     "Hoi An Memories show"
    ],
    "price": [
     600000,
     1200000
    ],
    "hours": [
     "19:30–20:30, nghỉ thứ Hai",
     "7:30–8:30pm, closed Mon"
    ],
    "address": "Công viên Ấn tượng Hội An, Cẩm Nam"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Khu đền tháp Mỹ Sơn",
     "My Son Sanctuary"
    ],
    "price": 150000,
    "note": [
     "Nên đến lúc mở cửa để tránh nắng",
     "Arrive at opening to beat the heat"
    ],
    "hours": "06:00–17:00",
    "address": "Duy Phú, Duy Xuyên",
    "cafe": {
     "name": "Quán nước cổng Mỹ Sơn",
     "drink": [
      "Nước dừa, nước mía",
      "Coconut water, sugarcane juice"
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
     "Làng gốm Thanh Hà",
     "Thanh Ha pottery village"
    ],
    "price": 35000,
    "hours": "08:00–17:30",
    "address": "Phạm Phán, Thanh Hà, Hội An",
    "cafe": {
     "name": "Cà phê ven sông làng gốm Thanh Hà",
     "drink": [
      "Cà phê, trà ngắm sông Thu Bồn",
      "Coffee and tea over the Thu Bon river"
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
     "Làng mộc Kim Bồng",
     "Kim Bong carpentry village"
    ],
    "price": 0,
    "note": [
     "Đò qua sông ~30.000đ",
     "River ferry ~30,000đ"
    ],
    "hours": "07:00–17:00",
    "address": "Cẩm Kim, Hội An"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Tour cano Cù Lao Chàm – lặn san hô",
     "Cu Lao Cham speedboat & snorkelling"
    ],
    "price": [
     650000,
     800000
    ],
    "note": [
     "Gồm cano, phí đảo, lặn, ăn trưa",
     "Includes boat, island fee, snorkelling, lunch"
    ],
    "hours": [
     "Tàu đi ~08:00",
     "Boats leave ~8am"
    ],
    "address": "Cảng Cửa Đại, Hội An"
   },
   {
    "at": "a",
    "name": [
     "Bãi Chồng – chùa Hải Tạng",
     "Bai Chong beach – Hai Tang pagoda"
    ],
    "price": 0,
    "hours": "all",
    "address": "Cù Lao Chàm",
    "cafe": {
     "name": "Quán nước dừa bãi Chồng",
     "drink": [
      "Nước dừa, nước ngọt",
      "Coconut water, soft drinks"
     ],
     "price": [
      20000,
      45000
     ]
    }
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Bà Nà Hills – Cầu Vàng",
     "Ba Na Hills – Golden Bridge"
    ],
    "price": 950000,
    "note": [
     "Gồm cáp treo, Fantasy Park",
     "Includes cable car and Fantasy Park"
    ],
    "hours": "07:00–22:00",
    "address": "Hòa Ninh, Hòa Vang, Đà Nẵng",
    "cafe": {
     "name": "Quán nước ga cáp treo Bà Nà",
     "drink": [
      "Cà phê, nước ép trước giờ lên núi",
      "Coffee and juice before going up"
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
     "Làng Pháp – vườn hoa Le Jardin",
     "French Village – Le Jardin"
    ],
    "price": 0,
    "note": [
     "Gồm trong vé Bà Nà",
     "Included in the Ba Na ticket"
    ],
    "hours": "08:00–21:00",
    "address": "Đỉnh Bà Nà",
    "cafe": {
     "name": "Quán nước vườn hoa Le Jardin",
     "drink": [
      "Trà, nước ép giữa vườn hoa",
      "Tea and juice among the flowers"
     ],
     "price": [
      40000,
      80000
     ]
    }
   },
   {
    "at": "e",
    "name": [
     "Cầu Rồng",
     "Dragon Bridge"
    ],
    "price": 0,
    "hours": [
     "Phun lửa 21:00 thứ Bảy, Chủ nhật",
     "Fire show 9pm Sat & Sun"
    ],
    "address": "Nguyễn Văn Linh, Đà Nẵng"
   }
  ]
 ]
}
