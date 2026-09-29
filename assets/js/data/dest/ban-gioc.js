/* Sinh tự động bởi tools/build.js từ places.js + sights.js – không sửa tay. */
const STAY_TYPES = {"homestay":["Homestay","Homestay"],"hotel":["Khách sạn","Hotel"],"resort":["Resort","Resort"],"boat":["Du thuyền ngủ đêm","Overnight cruise"]}
const PLACES = {
 "ban-gioc": {
  "city": "Cao Bang",
  "airport": "HAN",
  "getThere": [
   "Xe giường nằm Hà Nội – TP Cao Bằng ~7 giờ, thêm ~2 giờ tới Trùng Khánh (thác Bản Giốc). Nhiều tour 2 ngày 1 đêm từ Hà Nội.",
   "Sleeper bus Hanoi – Cao Bang city ~7 h, then ~2 h to Trung Khanh (Ban Gioc falls). Many 2-day tours from Hanoi."
  ],
  "eats": [
   {
    "name": "Vịt quay 7 vị – chợ Xanh",
    "dish": [
     "Vịt quay mắc mật, bánh áp chao",
     "Roast duck with mac mat leaves, fried rice cakes"
    ],
    "address": "Chợ Xanh, TP Cao Bằng",
    "price": [
     80000,
     200000
    ]
   },
   {
    "name": "Phở chua Cao Bằng",
    "dish": [
     "Phở chua, bánh cuốn canh",
     "Sour pho, rice rolls in broth"
    ],
    "address": "Phố Kim Đồng, TP Cao Bằng",
    "price": [
     35000,
     60000
    ]
   },
   {
    "name": "Quán ăn Trùng Khánh",
    "dish": [
     "Hạt dẻ Trùng Khánh, cá suối nướng",
     "Trung Khanh chestnuts, grilled stream fish"
    ],
    "address": "Thị trấn Trùng Khánh",
    "price": [
     80000,
     200000
    ]
   },
   {
    "name": "Bánh cuốn canh Hải Ghi",
    "dish": [
     "Bánh cuốn canh xương, trứng",
     "Rice rolls in bone broth with egg"
    ],
    "address": "TP Cao Bằng",
    "price": [
     30000,
     50000
    ]
   },
   {
    "name": "Bánh áp chao chợ Xanh",
    "dish": [
     "Bánh áp chao, bánh khảo",
     "Fried rice cakes and khao cakes"
    ],
    "address": "Chợ Xanh, TP Cao Bằng",
    "price": [
     20000,
     50000
    ]
   },
   {
    "name": "Quán lợn quay Trùng Khánh",
    "dish": [
     "Lợn quay mắc mật, xôi trám",
     "Roast pork with mac mat leaves, olive sticky rice"
    ],
    "address": "Thị trấn Trùng Khánh",
    "price": [
     100000,
     200000
    ]
   },
   {
    "name": "Nhà hàng cá suối thác Bản Giốc",
    "dish": [
     "Cá suối rán giòn, rau rừng",
     "Crispy stream fish, wild greens"
    ],
    "address": "Khu thác Bản Giốc",
    "price": [
     120000,
     250000
    ]
   },
   {
    "name": "Phở vịt quay Cao Bằng",
    "dish": [
     "Phở vịt quay đặc trưng",
     "Roast-duck pho"
    ],
    "address": "Phố Hoàng Như, TP Cao Bằng",
    "price": [
     40000,
     60000
    ]
   }
  ],
  "cafes": [
   {
    "name": "Quán nước chân thác Bản Giốc",
    "drink": [
     "Nước mía, hạt dẻ nướng, trà nóng",
     "Sugarcane juice, roasted chestnuts, hot tea"
    ],
    "address": "Khu thác Bản Giốc",
    "price": [
     15000,
     40000
    ]
   },
   {
    "name": "Cà phê view ruộng lúa Trùng Khánh",
    "drink": [
     "Cà phê, trà gừng ngắm đồng lúa",
     "Coffee and ginger tea over the paddies"
    ],
    "address": "Thị trấn Trùng Khánh",
    "price": [
     25000,
     50000
    ]
   },
   {
    "name": "Cà phê bờ sông Bằng",
    "drink": [
     "Cà phê, trà sữa ven sông",
     "Coffee and milk tea by the Bang river"
    ],
    "address": "TP Cao Bằng",
    "price": [
     25000,
     50000
    ]
   }
  ],
  "stays": [
   {
    "area": [
     "Gần thác Bản Giốc",
     "Near Ban Gioc falls"
    ],
    "type": "homestay",
    "price": [
     300000,
     800000
    ],
    "note": [
     "Ngắm thác sáng sớm khi vắng khách.",
     "See the falls early before the crowds."
    ]
   },
   {
    "area": [
     "Thị trấn Trùng Khánh",
     "Trung Khanh town"
    ],
    "type": "hotel",
    "price": [
     300000,
     600000
    ],
    "note": [
     "Tiện đi thác, động Ngườm Ngao.",
     "Handy for the falls and Nguom Ngao cave."
    ]
   },
   {
    "area": [
     "TP Cao Bằng",
     "Cao Bang city"
    ],
    "type": "hotel",
    "price": [
     400000,
     1000000
    ],
    "note": [
     "Đêm đầu/cuối, gần bến xe.",
     "First/last night, near the bus station."
    ]
   }
  ]
 }
}
const SIGHTS = {
 "ban-gioc": [
  [
   {
    "at": "a",
    "name": [
     "Khu di tích Pác Bó – hang Cốc Bó",
     "Pac Bo relic site – Coc Bo cave"
    ],
    "price": 0,
    "hours": "07:00–17:00",
    "address": "Trường Hà, Hà Quảng, Cao Bằng",
    "cafe": {
     "name": "Quán nước suối Lê-nin",
     "drink": [
      "Trà nóng, nước mía, bánh trứng kiến (mùa)",
      "Hot tea, sugarcane juice, seasonal cakes"
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
     "Thác Bản Giốc",
     "Ban Gioc waterfall"
    ],
    "price": 45000,
    "note": [
     "Bè tre sát thác ~50.000đ/người",
     "Bamboo raft ~50,000đ per person"
    ],
    "hours": "07:00–17:00",
    "address": "Đàm Thủy, Trùng Khánh",
    "cafe": {
     "name": "Quán hạt dẻ – trà nóng cổng thác",
     "drink": [
      "Trà nóng, hạt dẻ rang Trùng Khánh",
      "Hot tea with roasted Trung Khanh chestnuts"
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
     "Chùa Phật tích Trúc Lâm Bản Giốc",
     "Truc Lam Ban Gioc pagoda"
    ],
    "price": 0,
    "hours": "06:00–18:00",
    "address": "Đàm Thủy, Trùng Khánh"
   },
   {
    "at": "a",
    "name": [
     "Động Ngườm Ngao",
     "Nguom Ngao cave"
    ],
    "price": 45000,
    "hours": "07:30–17:00",
    "address": "Đàm Thủy, Trùng Khánh",
    "cafe": {
     "name": "Quán nước cổng động Ngườm Ngao",
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
     "Hồ Thang Hen – đèo Khau Cốc Chà",
     "Thang Hen lake – Khau Coc Cha pass"
    ],
    "price": 20000,
    "hours": "07:00–17:00",
    "address": "Quang Trung, Trà Lĩnh",
    "cafe": {
     "name": "Quán nước đèo Khau Cốc Chà",
     "drink": [
      "Trà nóng, ngô nướng ngắm đèo 14 tầng",
      "Hot tea and grilled corn over the 14-bend pass"
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
     "Làng rèn Phúc Sen – làng hương Phja Thắp",
     "Phuc Sen blacksmiths – Phja Thap incense village"
    ],
    "price": 0,
    "hours": "07:00–17:00",
    "address": "Quảng Hòa, Cao Bằng",
    "cafe": {
     "name": "Quán nước làng hương Phja Thắp",
     "drink": [
      "Trà xanh, bánh khảo",
      "Green tea, banh khao cookies"
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
     "Núi Mắt Thần",
     "Eye of God mountain"
    ],
    "price": 0,
    "hours": "all",
    "address": "Quốc Toản, Quảng Hòa",
    "cafe": {
     "name": "Quán nước chân núi Mắt Thần",
     "drink": [
      "Trà đá, nước ngọt",
      "Iced tea, soft drinks"
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
     "Sông Gâm – Bảo Lạc",
     "Gam river – Bao Lac"
    ],
    "price": 0,
    "hours": "all",
    "address": "Bảo Lạc, Cao Bằng",
    "cafe": {
     "name": "Cà phê bờ sông Gâm",
     "drink": [
      "Cà phê, nước chanh ngắm khúc sông",
      "Coffee and lemonade by the river bend"
     ],
     "price": [
      20000,
      40000
     ]
    }
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Hồ Ba Bể",
     "Ba Be lake"
    ],
    "price": 45000,
    "note": [
     "Thuyền 300.000–500.000đ/thuyền",
     "Boat 300,000–500,000đ per boat"
    ],
    "hours": "07:00–17:00",
    "address": "Nam Mẫu, Ba Bể, Bắc Kạn",
    "cafe": {
     "name": "Quán nước bến thuyền Ba Bể",
     "drink": [
      "Trà nóng, cá nướng xiên",
      "Hot tea, grilled fish skewers"
     ],
     "price": [
      15000,
      50000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Động Puông – ao Tiên – đảo Bà Góa",
     "Puong cave – Tien pond – Widow island"
    ],
    "price": 0,
    "note": [
     "Gồm trong tour thuyền",
     "Included in the boat tour"
    ],
    "hours": "07:00–17:00",
    "address": "Hồ Ba Bể",
    "cafe": {
     "name": "Quán nước ao Tiên",
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
  ]
 ]
}
