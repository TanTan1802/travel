/* Sinh tự động bởi tools/build.js từ places.js + sights.js – không sửa tay. */
const STAY_TYPES = {"homestay":["Homestay","Homestay"],"hotel":["Khách sạn","Hotel"],"resort":["Resort","Resort"],"boat":["Du thuyền ngủ đêm","Overnight cruise"]}
const PLACES = {
 "cat-ba": {
  "city": "Cat Ba",
  "airport": "HPH",
  "getThere": [
   "Xe combo Hà Nội – Cát Bà (xe + tàu cao tốc) ~3,5 giờ; hoặc từ Hải Phòng đi tàu cao tốc Bính – Cát Bà ~1 giờ.",
   "Hanoi – Cat Ba combo tickets (bus + speedboat) ~3.5 h; or from Hai Phong take the Binh – Cat Ba speedboat ~1 h."
  ],
  "eats": [
   {
    "name": "Phố hải sản Núi Ngọc",
    "dish": [
     "Tu hài nướng, ghẹ hấp, cá song",
     "Grilled geoduck, steamed crab, grouper"
    ],
    "address": "Đường Núi Ngọc, thị trấn Cát Bà",
    "price": [
     250000,
     600000
    ]
   },
   {
    "name": "Chợ Cát Bà",
    "dish": [
     "Mua hải sản rồi nhờ quán chế biến",
     "Buy seafood and have it cooked nearby"
    ],
    "address": "Đường 1/4, thị trấn Cát Bà",
    "price": [
     150000,
     400000
    ]
   },
   {
    "name": "Bánh đa cua Cát Bà",
    "dish": [
     "Bánh đa cua đỏ kiểu Hải Phòng",
     "Hai Phong-style red crab noodle soup"
    ],
    "address": "Thị trấn Cát Bà",
    "price": [
     35000,
     60000
    ]
   },
   {
    "name": "Nhà bè Lan Hạ",
    "dish": [
     "Hải sản trên bè nổi vịnh Lan Hạ",
     "Seafood on floating rafts in Lan Ha Bay"
    ],
    "address": "Vịnh Lan Hạ (đi tàu)",
    "price": [
     300000,
     700000
    ]
   },
   {
    "name": "Quán ốc bờ kè Cát Bà",
    "dish": [
     "Ốc hương, ốc móng tay",
     "Babylon snails and razor clams"
    ],
    "address": "Bờ kè thị trấn Cát Bà",
    "price": [
     100000,
     250000
    ]
   },
   {
    "name": "Bún cá cay Cát Bà",
    "dish": [
     "Bún cá cay kiểu Hải Phòng",
     "Spicy fish noodle soup Hai Phong-style"
    ],
    "address": "Đường Núi Ngọc, Cát Bà",
    "price": [
     40000,
     60000
    ]
   },
   {
    "name": "Nhà hàng hải sản Cái Bèo",
    "dish": [
     "Cá song, tu hài ở làng chài",
     "Grouper and geoduck at the fishing village"
    ],
    "address": "Làng chài Cái Bèo",
    "price": [
     250000,
     600000
    ]
   },
   {
    "name": "Quán cơm Việt Hải",
    "dish": [
     "Cơm quê giữa vườn quốc gia",
     "Country meals inside the national park"
    ],
    "address": "Làng Việt Hải",
    "price": [
     80000,
     150000
    ]
   }
  ],
  "cafes": [
   {
    "name": "Cà phê view vịnh Cát Bà",
    "drink": [
     "Cà phê, nước dừa nhìn ra bến tàu",
     "Coffee and coconut water over the harbour"
    ],
    "address": "Đường 1/4, thị trấn Cát Bà",
    "price": [
     30000,
     70000
    ]
   },
   {
    "name": "Quán nước bãi Cát Cò",
    "drink": [
     "Nước dừa, sinh tố, bia lạnh trên bãi",
     "Coconut water, smoothies, cold beer on the beach"
    ],
    "address": "Bãi Cát Cò 1 – 2",
    "price": [
     25000,
     60000
    ]
   },
   {
    "name": "Quầy trà chanh bờ kè",
    "drink": [
     "Trà chanh, ốc luộc ăn vặt",
     "Lime tea and boiled snails"
    ],
    "address": "Bờ kè thị trấn Cát Bà",
    "price": [
     15000,
     40000
    ]
   }
  ],
  "stays": [
   {
    "area": [
     "Thị trấn Cát Bà",
     "Cat Ba town"
    ],
    "type": "hotel",
    "price": [
     400000,
     1200000
    ],
    "note": [
     "Gần bến tàu đi vịnh Lan Hạ, phố ăn uống.",
     "Near Lan Ha Bay boats and restaurants."
    ]
   },
   {
    "area": [
     "Bãi Cát Cò",
     "Cat Co beaches"
    ],
    "type": "resort",
    "price": [
     1500000,
     3500000
    ],
    "note": [
     "Sát bãi tắm đẹp nhất đảo.",
     "Right on the island's best beaches."
    ]
   },
   {
    "area": [
     "Làng Việt Hải",
     "Viet Hai village"
    ],
    "type": "homestay",
    "price": [
     300000,
     700000
    ],
    "note": [
     "Giữa vườn quốc gia, rất yên bình.",
     "Inside the national park, very peaceful."
    ]
   }
  ]
 }
}
const SIGHTS = {
 "cat-ba": [
  [
   {
    "at": "a",
    "name": [
     "Bãi Cát Cò 1, 2, 3 – đường ven vách đá",
     "Cat Co 1, 2, 3 beaches – cliff path"
    ],
    "price": 0,
    "hours": "all",
    "address": "Thị trấn Cát Bà",
    "cafe": {
     "name": "Cà phê đường ven vách đá Cát Cò",
     "drink": [
      "Nước dừa, sinh tố ngắm biển",
      "Coconut water and smoothies over the sea"
     ],
     "price": [
      30000,
      60000
     ]
    }
   },
   {
    "at": "e",
    "name": [
     "Pháo đài Thần Công",
     "Cannon Fort"
    ],
    "price": 40000,
    "hours": "06:00–18:30",
    "address": "Núi Thần Công, thị trấn Cát Bà",
    "cafe": {
     "name": "Quán nước đỉnh pháo đài",
     "drink": [
      "Nước mía, bia lạnh ngắm hoàng hôn",
      "Sugarcane juice or cold beer at sunset"
     ],
     "price": [
      20000,
      50000
     ]
    }
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Tour vịnh Lan Hạ – kayak hang Sáng Tối",
     "Lan Ha Bay tour – Sang Toi caves kayak"
    ],
    "price": [
     350000,
     700000
    ],
    "note": [
     "Gồm phí vịnh, kayak, ăn trưa",
     "Includes bay fee, kayak and lunch"
    ],
    "hours": "08:00–16:30",
    "address": "Bến Bèo, thị trấn Cát Bà"
   },
   {
    "at": "a",
    "name": [
     "Làng chài Cái Bèo",
     "Cai Beo fishing village"
    ],
    "price": 0,
    "hours": "all",
    "address": "Cái Bèo, Cát Bà",
    "cafe": {
     "name": "Quán nước bè làng chài Cái Bèo",
     "drink": [
      "Trà đá, nước dừa trên bè",
      "Iced tea and coconut water on a raft"
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
     "Vườn quốc gia Cát Bà – đỉnh Ngự Lâm",
     "Cat Ba National Park – Ngu Lam peak"
    ],
    "price": 80000,
    "hours": "07:00–17:00",
    "address": "Trung Trang, Cát Hải",
    "cafe": {
     "name": "Quán nước cổng VQG Cát Bà",
     "drink": [
      "Nước chanh, trà gừng sau khi leo núi",
      "Lemonade or ginger tea after the climb"
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
     "Hang Quân Y",
     "Hospital Cave"
    ],
    "price": 40000,
    "hours": "07:00–17:00",
    "address": "Xuân Đám, Cát Bà"
   },
   {
    "at": "a",
    "name": [
     "Hang Trung Trang",
     "Trung Trang cave"
    ],
    "price": 40000,
    "hours": "07:00–17:00",
    "address": "Trung Trang, Cát Bà",
    "cafe": {
     "name": "Quán nước hang Trung Trang",
     "drink": [
      "Nước dừa, nước ngọt",
      "Coconut water, soft drinks"
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
     "Đảo Khỉ (cano)",
     "Monkey Island (speedboat)"
    ],
    "price": [
     100000,
     150000
    ],
    "note": [
     "Cano khứ hồi",
     "Return speedboat"
    ],
    "hours": "08:00–17:00",
    "address": "Bến Bèo, Cát Bà",
    "cafe": {
     "name": "Quán nước bãi tắm đảo Khỉ",
     "drink": [
      "Nước dừa, bia lạnh",
      "Coconut water, cold beer"
     ],
     "price": [
      30000,
      60000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Làng Việt Hải",
     "Viet Hai village"
    ],
    "price": 0,
    "note": [
     "Thuê xe đạp ~50.000đ",
     "Bike hire ~50,000đ"
    ],
    "hours": "all",
    "address": "Việt Hải, VQG Cát Bà",
    "cafe": {
     "name": "Quán nước làng Việt Hải",
     "drink": [
      "Trà thảo mộc, nước chanh leo",
      "Herbal tea, passion-fruit juice"
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
     "Nhà hát Lớn – phố cổ Tam Bạc",
     "Hai Phong Opera House – Tam Bac old street"
    ],
    "price": 0,
    "hours": "all",
    "address": "Quảng trường Nhà hát Lớn, Hồng Bàng, Hải Phòng",
    "cafe": {
     "name": "Cà phê phố Tam Bạc",
     "drink": [
      "Cà phê, trà chanh ven sông Tam Bạc",
      "Coffee and lime tea by the Tam Bac river"
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
     "Tháp Tường Long – bãi biển Đồ Sơn",
     "Tuong Long tower – Do Son beach"
    ],
    "price": 0,
    "hours": "all",
    "address": "Đồ Sơn, Hải Phòng",
    "cafe": {
     "name": "Cà phê view biển Đồ Sơn",
     "drink": [
      "Nước dừa, sinh tố",
      "Coconut water, smoothies"
     ],
     "price": [
      25000,
      55000
     ]
    }
   }
  ]
 ]
}
