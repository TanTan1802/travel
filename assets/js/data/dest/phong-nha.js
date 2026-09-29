/* Sinh tự động bởi tools/build.js từ places.js + sights.js – không sửa tay. */
const STAY_TYPES = {"homestay":["Homestay","Homestay"],"hotel":["Khách sạn","Hotel"],"resort":["Resort","Resort"],"boat":["Du thuyền ngủ đêm","Overnight cruise"]}
const PLACES = {
 "phong-nha": {
  "city": "Phong Nha",
  "airport": "VDH",
  "rail": "Đồng Hới",
  "getThere": [
   "Bay hoặc đi tàu tới Đồng Hới (sân bay VDH / ga Đồng Hới), rồi xe ~1 giờ (45 km) tới thị trấn Phong Nha. Từ Huế đi xe ~3,5–4 giờ.",
   "Fly or take the train to Dong Hoi (VDH airport / Dong Hoi Station), then ~1 h (45 km) by road to Phong Nha town. ~3.5–4 h by road from Hue."
  ],
  "eats": [
   {
    "name": "Bamboo Café",
    "dish": [
     "Món Việt & Tây, sinh tố, gặp dân phượt",
     "Vietnamese & Western food, smoothies, traveller hangout"
    ],
    "address": "Thị trấn Phong Nha, Bố Trạch",
    "price": [
     60000,
     150000
    ]
   },
   {
    "name": "Quán gà nướng bên sông Son",
    "dish": [
     "Gà nướng, cá sông Son",
     "Grilled chicken, Son river fish"
    ],
    "address": "Bờ sông Son, thị trấn Phong Nha",
    "price": [
     100000,
     250000
    ]
   },
   {
    "name": "Bánh bột lọc Quảng Bình",
    "dish": [
     "Bánh bột lọc tôm, cháo canh",
     "Tapioca shrimp dumplings, chao canh noodle soup"
    ],
    "address": "Chợ Phong Nha",
    "price": [
     30000,
     60000
    ]
   },
   {
    "name": "The Pub with Cold Beer",
    "dish": [
     "Gà ta tự nướng giữa vườn, bia lạnh",
     "DIY grilled farm chicken in a garden, cold beer"
    ],
    "address": "Thôn Cù Lạc, Phong Nha",
    "price": [
     150000,
     300000
    ]
   },
   {
    "name": "Quán bánh canh Phong Nha",
    "dish": [
     "Bánh canh cá lóc buổi sáng",
     "Snakehead fish noodle soup for breakfast"
    ],
    "address": "Chợ Phong Nha",
    "price": [
     25000,
     40000
    ]
   },
   {
    "name": "Nhà hàng cá sông Son",
    "dish": [
     "Cá mát, cá niêng nướng",
     "Grilled river fish from the Son"
    ],
    "address": "Bờ sông Son, Phong Nha",
    "price": [
     150000,
     300000
    ]
   },
   {
    "name": "Quán cháo canh Đồng Hới",
    "dish": [
     "Cháo canh bột gạo, bánh lọc",
     "Rice-flour noodle soup, tapioca dumplings"
    ],
    "address": "TP Đồng Hới",
    "price": [
     25000,
     45000
    ]
   },
   {
    "name": "Bếp farmstay Bồng Lai",
    "dish": [
     "Cơm quê, gà ta, rau vườn",
     "Farm meals: chicken and garden greens"
    ],
    "address": "Thung lũng Bồng Lai",
    "price": [
     100000,
     200000
    ]
   }
  ],
  "cafes": [
   {
    "name": "Cà phê ven sông Son",
    "drink": [
     "Cà phê, nước ép nhìn ra sông",
     "Coffee and juices by the Son river"
    ],
    "address": "Thị trấn Phong Nha",
    "price": [
     25000,
     50000
    ]
   },
   {
    "name": "Quán nước dừa bến thuyền Phong Nha",
    "drink": [
     "Nước dừa, nước mía chờ thuyền",
     "Coconut water and sugarcane juice at the boat pier"
    ],
    "address": "Bến thuyền Phong Nha",
    "price": [
     15000,
     35000
    ]
   },
   {
    "name": "Cà phê farmstay Bồng Lai",
    "drink": [
     "Cà phê, trà giữa thung lũng",
     "Coffee and tea in the valley"
    ],
    "address": "Thung lũng Bồng Lai",
    "price": [
     30000,
     60000
    ]
   }
  ],
  "stays": [
   {
    "area": [
     "Thị trấn Phong Nha",
     "Phong Nha town"
    ],
    "type": "hotel",
    "price": [
     300000,
     900000
    ],
    "note": [
     "Gần bến thuyền vào động Phong Nha, nhiều quán ăn.",
     "Near the Phong Nha Cave boats and eateries."
    ]
   },
   {
    "area": [
     "Làng Bồng Lai – Cù Lạc",
     "Bong Lai – Cu Lac valley"
    ],
    "type": "homestay",
    "price": [
     300000,
     800000
    ],
    "note": [
     "Farmstay giữa ruộng lúa, núi đá vôi.",
     "Farmstays among rice fields and karsts."
    ]
   },
   {
    "area": [
     "Ven sông Chày – Hang Tối",
     "Chay river"
    ],
    "type": "resort",
    "price": [
     1200000,
     3000000
    ],
    "note": [
     "Gần khu zipline Hang Tối.",
     "Close to the Dark Cave zipline."
    ]
   }
  ]
 }
}
const SIGHTS = {
 "phong-nha": [
  [
   {
    "at": "m",
    "name": [
     "Động Phong Nha",
     "Phong Nha Cave"
    ],
    "price": 150000,
    "note": [
     "Thuyền sông Son ~550.000đ/thuyền (tối đa 14 người)",
     "Son river boat ~550,000đ per boat (up to 14)"
    ],
    "hours": "07:00–16:00",
    "address": "Bến thuyền Phong Nha, Sơn Trạch",
    "cafe": {
     "name": "Bamboo Café Phong Nha",
     "drink": [
      "Cà phê, sinh tố, nước ép",
      "Coffee, smoothies, juices"
     ],
     "price": [
      30000,
      60000
     ]
    }
   },
   {
    "at": "m",
    "name": [
     "Động Tiên Sơn",
     "Tien Son Cave"
    ],
    "price": 80000,
    "hours": "07:00–16:00",
    "address": "Khu Phong Nha, Sơn Trạch"
   },
   {
    "at": "a",
    "name": [
     "Thung lũng Bồng Lai",
     "Bong Lai valley"
    ],
    "price": 0,
    "note": [
     "Thuê xe đạp ~50.000đ/ngày",
     "Bike hire ~50,000đ/day"
    ],
    "hours": "all",
    "address": "Thung lũng Bồng Lai, Phong Nha",
    "cafe": {
     "name": "Pub with Cold Beer",
     "drink": [
      "Bia lạnh, nước ép giữa đồng quê",
      "Cold beer and juice in the countryside"
     ],
     "price": [
      25000,
      60000
     ]
    }
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Động Thiên Đường",
     "Paradise Cave"
    ],
    "price": 250000,
    "hours": "07:00–16:30",
    "address": "Sơn Trạch, Bố Trạch",
    "cafe": {
     "name": "Quán nước cổng động Thiên Đường",
     "drink": [
      "Nước dừa, nước mía",
      "Coconut water, sugarcane juice"
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
     "Sông Chày – hang Tối (zipline, tắm bùn)",
     "Chay river – Dark Cave (zipline, mud bath)"
    ],
    "price": 450000,
    "hours": "08:00–16:00",
    "address": "Sông Chày, Phong Nha",
    "cafe": {
     "name": "Quầy nước bến sông Chày",
     "drink": [
      "Nước ngọt, bia lạnh, nước dừa",
      "Soft drinks, cold beer, coconut water"
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
     "Suối Nước Moọc",
     "Nuoc Mooc spring"
    ],
    "price": 120000,
    "hours": "07:00–16:30",
    "address": "Phúc Trạch, Bố Trạch",
    "cafe": {
     "name": "Quán nước suối Moọc",
     "drink": [
      "Nước dừa, cà phê đá",
      "Coconut water, iced coffee"
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
     "Hang Tám Cô – đường Trường Sơn",
     "Eight Ladies Cave – Ho Chi Minh Trail"
    ],
    "price": 0,
    "hours": "07:00–17:00",
    "address": "Tân Trạch, Bố Trạch",
    "cafe": {
     "name": "Quán nước hang Tám Cô",
     "drink": [
      "Trà xanh, nước ngọt",
      "Green tea, soft drinks"
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
     "Thành cổ Đồng Hới – nhà thờ Tam Tòa",
     "Dong Hoi citadel – Tam Toa church"
    ],
    "price": 0,
    "hours": "all",
    "address": "Quang Trung, Đồng Hới",
    "cafe": {
     "name": "Cà phê bờ sông Nhật Lệ",
     "drink": [
      "Cà phê, trà chanh ven sông",
      "Coffee and lime tea by the river"
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
     "Biển Nhật Lệ – đồi cát Quang Phú",
     "Nhat Le beach – Quang Phu dunes"
    ],
    "price": [
     0,
     50000
    ],
    "note": [
     "Trượt cát ~50.000đ",
     "Sand sledding ~50,000đ"
    ],
    "hours": "all",
    "address": "Quang Phú, Đồng Hới",
    "cafe": {
     "name": "Quán nước dừa đồi cát Quang Phú",
     "drink": [
      "Nước dừa, nước mía",
      "Coconut water, sugarcane juice"
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
     "Mộ Đại tướng Võ Nguyên Giáp",
     "General Vo Nguyen Giap's tomb"
    ],
    "price": 0,
    "hours": "06:00–18:00",
    "address": "Vũng Chùa, Quảng Đông, Quảng Trạch",
    "cafe": {
     "name": "Quán nước bến Vũng Chùa",
     "drink": [
      "Nước dừa, trà đá",
      "Coconut water, iced tea"
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
     "Biển Đá Nhảy",
     "Da Nhay beach"
    ],
    "price": 0,
    "hours": "all",
    "address": "Thanh Trạch, Bố Trạch",
    "cafe": {
     "name": "Quán nước dừa bãi Đá Nhảy",
     "drink": [
      "Nước dừa, bia lạnh",
      "Coconut water, cold beer"
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
