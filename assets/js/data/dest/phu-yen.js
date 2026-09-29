/* Sinh tự động bởi tools/build.js từ places.js + sights.js – không sửa tay. */
const STAY_TYPES = {"homestay":["Homestay","Homestay"],"hotel":["Khách sạn","Hotel"],"resort":["Resort","Resort"],"boat":["Du thuyền ngủ đêm","Overnight cruise"]}
const PLACES = {
 "phu-yen": {
  "city": "Tuy Hoa",
  "airport": "TBB",
  "rail": "Tuy Hòa",
  "getThere": [
   "Sân bay Tuy Hòa (TBB) và ga Tuy Hòa ngay trong TP. Từ Quy Nhơn đi xe ~2 giờ, từ Nha Trang ~2,5 giờ.",
   "Tuy Hoa Airport (TBB) and station are in the city. ~2 h by road from Quy Nhon, ~2.5 h from Nha Trang."
  ],
  "eats": [
   {
    "name": "Mắt cá ngừ đại dương – ven biển Tuy Hòa",
    "dish": [
     "Mắt cá ngừ tiềm thuốc bắc, gỏi cá ngừ",
     "Tuna eye herbal stew, tuna salad"
    ],
    "address": "Đường Độc Lập, TP Tuy Hòa",
    "price": [
     80000,
     250000
    ]
   },
   {
    "name": "Sò huyết đầm Ô Loan",
    "dish": [
     "Sò huyết nướng, hấp sả",
     "Grilled or lemongrass-steamed blood cockles"
    ],
    "address": "Đầm Ô Loan, Tuy An",
    "price": [
     100000,
     250000
    ]
   },
   {
    "name": "Bánh canh hẹ Tuy Hòa",
    "dish": [
     "Bánh canh hẹ chả cá",
     "Chive noodle soup with fish cake"
    ],
    "address": "TP Tuy Hòa",
    "price": [
     25000,
     45000
    ]
   },
   {
    "name": "Bánh xèo – bánh căn Phú Yên",
    "dish": [
     "Bánh xèo nhỏ, bánh căn chấm mắm",
     "Mini banh xeo and banh can"
    ],
    "address": "Chợ Tuy Hòa",
    "price": [
     30000,
     60000
    ]
   },
   {
    "name": "Bánh hỏi lòng heo Tuy Hòa",
    "dish": [
     "Bánh hỏi lòng heo buổi sáng",
     "Rice vermicelli with pork offal for breakfast"
    ],
    "address": "Chợ Tuy Hòa",
    "price": [
     30000,
     50000
    ]
   },
   {
    "name": "Cá ngừ đại dương nướng Tuy Hòa",
    "dish": [
     "Cá ngừ nướng, gỏi cá ngừ",
     "Grilled tuna and tuna salad"
    ],
    "address": "Đường Độc Lập, TP Tuy Hòa",
    "price": [
     150000,
     300000
    ]
   },
   {
    "name": "Bún cá ngừ Tuy Hòa",
    "dish": [
     "Bún cá ngừ kho",
     "Braised tuna noodle soup"
    ],
    "address": "TP Tuy Hòa",
    "price": [
     30000,
     50000
    ]
   },
   {
    "name": "Hải sản đầm Cù Mông",
    "dish": [
     "Tôm hùm, ốc, cá lồng bè",
     "Lobster, snails and fish-farm seafood"
    ],
    "address": "Đầm Cù Mông, Sông Cầu",
    "price": [
     250000,
     600000
    ]
   }
  ],
  "cafes": [
   {
    "name": "Cà phê view tháp Nhạn",
    "drink": [
     "Cà phê, trà ngắm sông Đà Rằng",
     "Coffee and tea over the Da Rang river"
    ],
    "address": "Khu tháp Nhạn, TP Tuy Hòa",
    "price": [
     20000,
     45000
    ]
   },
   {
    "name": "Quán nước dừa Gành Đá Đĩa",
    "drink": [
     "Nước dừa, nước mía cạnh gành đá",
     "Coconut water and sugarcane juice by the basalt columns"
    ],
    "address": "Gành Đá Đĩa, Tuy An",
    "price": [
     15000,
     35000
    ]
   },
   {
    "name": "Cà phê ven biển Tuy Hòa",
    "drink": [
     "Cà phê sáng nhìn ra biển",
     "Morning coffee by the sea"
    ],
    "address": "Đường Độc Lập, TP Tuy Hòa",
    "price": [
     20000,
     40000
    ]
   }
  ],
  "stays": [
   {
    "area": [
     "TP Tuy Hòa ven biển",
     "Tuy Hoa beachfront"
    ],
    "type": "hotel",
    "price": [
     400000,
     1200000
    ],
    "note": [
     "Gần tháp Nhạn, chợ, quán ăn.",
     "Near Nhan tower, the market and eateries."
    ]
   },
   {
    "area": [
     "Gành Đá Đĩa – An Ninh Đông",
     "Ganh Da Dia area"
    ],
    "type": "homestay",
    "price": [
     250000,
     600000
    ],
    "note": [
     "Ngắm bình minh gành đá sớm.",
     "Catch sunrise at the basalt columns."
    ]
   },
   {
    "area": [
     "Bãi Xép – Mũi Điện",
     "Bai Xep – Mui Dien"
    ],
    "type": "resort",
    "price": [
     1200000,
     3000000
    ],
    "note": [
     "Gần điểm đón bình minh sớm nhất.",
     "Near the country's easternmost sunrise point."
    ]
   }
  ]
 }
}
const SIGHTS = {
 "phu-yen": [
  [
   {
    "at": "m",
    "name": [
     "Mũi Điện – hải đăng Đại Lãnh",
     "Mui Dien – Dai Lanh lighthouse"
    ],
    "price": 20000,
    "note": [
     "Có mặt trước 5:30 để đón bình minh",
     "Arrive before 5:30am for sunrise"
    ],
    "hours": "05:00–17:00",
    "address": "Hòa Tâm, Đông Hòa",
    "cafe": {
     "name": "Quán nước chân hải đăng Đại Lãnh",
     "drink": [
      "Cà phê, nước dừa sau khi leo",
      "Coffee and coconut water after the climb"
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
     "Bãi Môn – đầm Ô Loan",
     "Bai Mon beach – O Loan lagoon"
    ],
    "price": 0,
    "hours": "all",
    "address": "Đông Hòa / Tuy An",
    "cafe": {
     "name": "Quán nước ven đầm Ô Loan",
     "drink": [
      "Nước dừa, nước mía nhìn đầm",
      "Coconut water, sugarcane juice by the lagoon"
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
     "Tháp Nhạn",
     "Nhan Tower"
    ],
    "price": 0,
    "hours": "07:00–21:00",
    "address": "Núi Nhạn, Tuy Hòa"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Gành Đá Đĩa",
     "Ganh Da Dia basalt columns"
    ],
    "price": 20000,
    "hours": "06:00–18:00",
    "address": "An Ninh Đông, Tuy An",
    "cafe": {
     "name": "Quán nước làng chài An Ninh Đông",
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
    "at": "m",
    "name": [
     "Nhà thờ Mằng Lăng",
     "Mang Lang church"
    ],
    "price": 0,
    "hours": "06:00–17:00",
    "address": "An Thạch, Tuy An"
   },
   {
    "at": "a",
    "name": [
     "Vịnh Xuân Đài – làng Đo Đo",
     "Xuan Dai bay – Do Do village"
    ],
    "price": [
     150000,
     300000
    ],
    "note": [
     "Thuyền ngắm vịnh",
     "Bay boat trip"
    ],
    "hours": "07:00–17:00",
    "address": "Xuân Phương, Sông Cầu",
    "cafe": {
     "name": "Cà phê view vịnh Xuân Đài",
     "drink": [
      "Cà phê, nước ép nhìn vịnh",
      "Coffee and juice over the bay"
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
     "Hòn Yến",
     "Hon Yen"
    ],
    "price": 0,
    "note": [
     "Đi lúc thủy triều rút",
     "Visit at low tide"
    ],
    "hours": "all",
    "address": "An Hòa Hải, Tuy An",
    "cafe": {
     "name": "Quán nước bãi Hòn Yến",
     "drink": [
      "Nước dừa, nước ngọt",
      "Coconut water, soft drinks"
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
     "Gành Ông – bãi Xép",
     "Ganh Ong – Bai Xep"
    ],
    "price": [
     0,
     10000
    ],
    "hours": "all",
    "address": "An Chấn, Tuy An",
    "cafe": {
     "name": "Quán nước bãi Xép",
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
  ],
  [
   {
    "at": "m",
    "name": [
     "Cù Lao Mái Nhà",
     "Cu Lao Mai Nha island"
    ],
    "price": [
     250000,
     400000
    ],
    "note": [
     "Tour thuyền, gồm ăn trưa",
     "Boat tour with lunch"
    ],
    "hours": "07:00–15:00",
    "address": "Bến An Hải, Tuy An",
    "cafe": {
     "name": "Quán nước bãi Cù Lao Mái Nhà",
     "drink": [
      "Nước dừa, trà đá",
      "Coconut water, iced tea"
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
     "Biển Tuy Hòa",
     "Tuy Hoa beach"
    ],
    "price": 0,
    "hours": "all",
    "address": "Độc Lập, Tuy Hòa"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Đập Đồng Cam – đồng lúa Tuy An",
     "Dong Cam dam – Tuy An rice fields"
    ],
    "price": 0,
    "hours": "all",
    "address": "Phú Hòa, Phú Yên",
    "cafe": {
     "name": "Quán nước đập Đồng Cam",
     "drink": [
      "Nước mía, trà đá",
      "Sugarcane juice, iced tea"
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
     "Ga Hòa Đa – núi Chóp Chài",
     "Hoa Da station – Chop Chai mountain"
    ],
    "price": 0,
    "hours": "all",
    "address": "An Mỹ, Tuy An",
    "cafe": {
     "name": "Quán nước làng bánh tráng Hòa Đa",
     "drink": [
      "Trà xanh, bánh tráng nướng",
      "Green tea with grilled rice paper"
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
