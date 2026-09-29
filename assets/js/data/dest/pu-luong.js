/* Sinh tự động bởi tools/build.js từ places.js + sights.js – không sửa tay. */
const STAY_TYPES = {"homestay":["Homestay","Homestay"],"hotel":["Khách sạn","Hotel"],"resort":["Resort","Resort"],"boat":["Du thuyền ngủ đêm","Overnight cruise"]}
const PLACES = {
 "pu-luong": {
  "city": "Pu Luong",
  "airport": "HAN",
  "getThere": [
   "Từ Hà Nội ~4 giờ (170 km) qua Mai Châu: xe khách đi Bá Thước rồi homestay đón, hoặc thuê xe riêng/limousine.",
   "From Hanoi ~4 h (170 km) via Mai Chau: bus to Ba Thuoc and a homestay pick-up, or a private car/limousine."
  ],
  "eats": [
   {
    "name": "Bếp homestay bản Đôn",
    "dish": [
     "Vịt Cổ Lũng, cơm lam, rau rừng",
     "Co Lung duck, bamboo rice, wild greens"
    ],
    "address": "Bản Đôn, xã Thành Lâm, Bá Thước",
    "price": [
     100000,
     200000
    ]
   },
   {
    "name": "Quán ăn Phố Đoàn",
    "dish": [
     "Cá suối nướng, măng đắng xào",
     "Grilled stream fish, bitter bamboo shoots"
    ],
    "address": "Phố Đoàn, xã Lũng Niêm, Bá Thước",
    "price": [
     80000,
     180000
    ]
   },
   {
    "name": "Chợ phiên Phố Đoàn (thứ Bảy)",
    "dish": [
     "Xôi, bánh chưng đen, rượu cần",
     "Sticky rice, black banh chung, rice wine"
    ],
    "address": "Chợ Phố Đoàn, Bá Thước",
    "price": [
     20000,
     80000
    ]
   },
   {
    "name": "Nhà hàng vịt Cổ Lũng thị trấn Cành Nàng",
    "dish": [
     "Vịt Cổ Lũng luộc, nướng mắc khén",
     "Co Lung duck boiled or grilled with mac khen"
    ],
    "address": "Thị trấn Cành Nàng, Bá Thước",
    "price": [
     150000,
     300000
    ]
   },
   {
    "name": "Quán phở – bánh cuốn Cành Nàng",
    "dish": [
     "Phở, bánh cuốn buổi sáng",
     "Pho or rice rolls for breakfast"
    ],
    "address": "Thị trấn Cành Nàng, Bá Thước",
    "price": [
     30000,
     50000
    ]
   },
   {
    "name": "Bếp homestay bản Hiêu",
    "dish": [
     "Cơm nhà người Thái, xôi, cá suối",
     "Thai family meal: sticky rice, stream fish"
    ],
    "address": "Bản Hiêu, Cổ Lũng",
    "price": [
     100000,
     200000
    ]
   },
   {
    "name": "Quán lẩu gà bản Kho Mường",
    "dish": [
     "Lẩu gà, măng rừng",
     "Chicken hotpot with bamboo shoots"
    ],
    "address": "Bản Kho Mường",
    "price": [
     150000,
     250000
    ]
   },
   {
    "name": "Nhà hàng cá sông Mã",
    "dish": [
     "Cá sông Mã nướng, rán",
     "Grilled or fried Ma river fish"
    ],
    "address": "Ven sông Mã, Bá Thước",
    "price": [
     120000,
     250000
    ]
   }
  ],
  "cafes": [
   {
    "name": "Quán nước bên guồng nước bản Hiêu",
    "drink": [
     "Trà nóng, nước lá rừng",
     "Hot tea and forest-leaf drinks"
    ],
    "address": "Bản Hiêu, Cổ Lũng",
    "price": [
     10000,
     30000
    ]
   },
   {
    "name": "Cà phê view ruộng bậc thang bản Đôn",
    "drink": [
     "Cà phê, sinh tố từ homestay",
     "Coffee and smoothies from a homestay deck"
    ],
    "address": "Bản Đôn, Thành Lâm",
    "price": [
     25000,
     50000
    ]
   },
   {
    "name": "Quán nước chợ Phố Đoàn",
    "drink": [
     "Nước mía, chè, trà đá",
     "Sugarcane juice, sweet soup, iced tea"
    ],
    "address": "Phố Đoàn, Lũng Niêm",
    "price": [
     10000,
     25000
    ]
   }
  ],
  "stays": [
   {
    "area": [
     "Bản Đôn – bản Hiêu",
     "Don – Hieu villages"
    ],
    "type": "homestay",
    "price": [
     250000,
     700000
    ],
    "note": [
     "Nhà sàn giữa ruộng bậc thang, gần guồng nước.",
     "Stilt houses among terraces, near the water wheels."
    ]
   },
   {
    "area": [
     "Eco-lodge ven thung lũng",
     "Valley eco-lodges"
    ],
    "type": "resort",
    "price": [
     1200000,
     3000000
    ],
    "note": [
     "Hồ bơi vô cực view lúa – nên đặt sớm mùa lúa chín.",
     "Infinity pools over the paddies – book early at harvest."
    ]
   },
   {
    "area": [
     "Thị trấn Cành Nàng",
     "Canh Nang town"
    ],
    "type": "hotel",
    "price": [
     300000,
     600000
    ],
    "note": [
     "Nhà nghỉ bình dân, gần bến xe.",
     "Simple guesthouses near the bus station."
    ]
   }
  ]
 }
}
const SIGHTS = {
 "pu-luong": [
  [
   {
    "at": "a",
    "name": [
     "Ruộng bậc thang bản Đôn – guồng nước",
     "Don village terraces – water wheels"
    ],
    "price": 0,
    "hours": "all",
    "address": "Thành Lâm, Bá Thước",
    "cafe": {
     "name": "Quán nước guồng nước bản Đôn",
     "drink": [
      "Trà nóng, nước chanh leo",
      "Hot tea, passion-fruit juice"
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
     "Bản Kho Mường",
     "Kho Muong village"
    ],
    "price": 0,
    "hours": "all",
    "address": "Thành Sơn, Bá Thước",
    "cafe": {
     "name": "Quán nước bản Kho Mường",
     "drink": [
      "Trà nóng, nước ngọt",
      "Hot tea, soft drinks"
     ],
     "price": [
      10000,
      25000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Hang Bàng – suối",
     "Bang cave & stream"
    ],
    "price": [
     0,
     20000
    ],
    "hours": "07:00–17:00",
    "address": "Kho Mường, Thành Sơn",
    "cafe": {
     "name": "Quán nước suối hang Bàng",
     "drink": [
      "Nước chanh, trà đá",
      "Lemonade, iced tea"
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
     "Thác Hiêu",
     "Hieu waterfall"
    ],
    "price": 20000,
    "hours": "07:00–17:00",
    "address": "Bản Hiêu, Cổ Lũng",
    "cafe": {
     "name": "Quán nước chân thác Hiêu",
     "drink": [
      "Nước chanh leo, trà nóng",
      "Passion-fruit juice, hot tea"
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
     "Chợ phiên Phố Đoàn",
     "Pho Doan market"
    ],
    "price": 0,
    "hours": [
     "Sáng thứ Bảy",
     "Saturday morning"
    ],
    "address": "Phố Đoàn, Bá Thước",
    "cafe": {
     "name": "Quán nước nhà dệt thổ cẩm bản Hiêu",
     "drink": [
      "Trà nóng, rượu cần",
      "Hot tea, rice wine"
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
     "Bè tre sông Mã",
     "Bamboo raft on the Ma river"
    ],
    "price": [
     100000,
     200000
    ],
    "hours": "07:00–17:00",
    "address": "Bến Cổ Lũng, Bá Thước",
    "cafe": {
     "name": "Quán nước bến bè sông Mã",
     "drink": [
      "Nước dừa, trà đá",
      "Coconut water, iced tea"
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
     "Đỉnh Pù Luông – săn mây",
     "Pu Luong summit – cloud hunting"
    ],
    "price": 0,
    "hours": [
     "Đẹp nhất 05:00–07:00",
     "Best 5–7am"
    ],
    "address": "Khu bảo tồn Pù Luông",
    "cafe": {
     "name": "Quán trà điểm săn mây Pù Luông",
     "drink": [
      "Trà nóng, khoai nướng",
      "Hot tea, roast sweet potatoes"
     ],
     "price": [
      15000,
      35000
     ]
    }
   }
  ]
 ]
}
