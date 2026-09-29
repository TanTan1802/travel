/* Sinh tự động bởi tools/build.js từ places.js + sights.js – không sửa tay. */
const STAY_TYPES = {"homestay":["Homestay","Homestay"],"hotel":["Khách sạn","Hotel"],"resort":["Resort","Resort"],"boat":["Du thuyền ngủ đêm","Overnight cruise"]}
const PLACES = {
 "buon-ma-thuot": {
  "city": "Buon Ma Thuot",
  "airport": "BMV",
  "getThere": [
   "Sân bay Buôn Ma Thuột (BMV) cách trung tâm ~8 km. Xe giường nằm từ Sài Gòn ~8 giờ, từ Đà Lạt/Nha Trang ~4–5 giờ.",
   "Buon Ma Thuot Airport (BMV) is ~8 km from the centre. Sleeper buses take ~8 h from Saigon and ~4–5 h from Da Lat or Nha Trang."
  ],
  "eats": [
   {
    "name": "Bún đỏ Ban Mê (đường Hai Bà Trưng)",
    "dish": [
     "Bún đỏ chả cá, trứng cút",
     "Red noodles with fish cake and quail eggs"
    ],
    "address": "Đường Hai Bà Trưng, TP Buôn Ma Thuột",
    "price": [
     25000,
     40000
    ]
   },
   {
    "name": "Bảo tàng Thế giới Cà phê",
    "dish": [
     "Cà phê robusta, cà phê muối trong nhà dài",
     "Robusta and salted coffee in a longhouse setting"
    ],
    "address": "Đường Lê Duẩn, TP Buôn Ma Thuột",
    "price": [
     40000,
     100000
    ]
   },
   {
    "name": "Gà nướng cơm lam Ban Mê",
    "dish": [
     "Gà nướng, cơm lam, muối lá é",
     "Grilled chicken, bamboo rice, e-leaf salt"
    ],
    "address": "Đường Y Wang, TP Buôn Ma Thuột",
    "price": [
     150000,
     300000
    ]
   },
   {
    "name": "Chợ Buôn Ma Thuột",
    "dish": [
     "Bánh căn, bơ, cà phê, tiêu mang về",
     "Banh can, avocados, coffee and pepper to take home"
    ],
    "address": "Chợ trung tâm Buôn Ma Thuột",
    "price": [
     20000,
     200000
    ]
   },
   {
    "name": "Bánh căn Ban Mê",
    "dish": [
     "Bánh căn, bánh xèo buổi sáng",
     "Banh can and banh xeo for breakfast"
    ],
    "address": "Đường Hùng Vương, TP Buôn Ma Thuột",
    "price": [
     30000,
     50000
    ]
   },
   {
    "name": "Bún chìa Ban Mê",
    "dish": [
     "Bún chìa xương heo",
     "Pork-rib noodle soup"
    ],
    "address": "Đường Lê Hồng Phong, TP Buôn Ma Thuột",
    "price": [
     35000,
     55000
    ]
   },
   {
    "name": "Nhà hàng lẩu cá lăng hồ Lắk",
    "dish": [
     "Lẩu cá lăng, cá nướng",
     "Lang fish hotpot and grilled fish"
    ],
    "address": "Hồ Lắk",
    "price": [
     150000,
     300000
    ]
   },
   {
    "name": "Quán cơm Ê Đê buôn Kô Siêr",
    "dish": [
     "Cơm lam, canh cà đắng, thịt nướng",
     "Bamboo rice, bitter eggplant soup, grilled meat"
    ],
    "address": "Buôn Kô Siêr, TP Buôn Ma Thuột",
    "price": [
     100000,
     200000
    ]
   }
  ],
  "cafes": [
   {
    "name": "Cà phê Ban Mê phin nhôm",
    "drink": [
     "Cà phê phin robusta đậm đặc",
     "Strong robusta drip coffee"
    ],
    "address": "Đường Lê Duẩn, TP Buôn Ma Thuột",
    "price": [
     20000,
     40000
    ]
   },
   {
    "name": "Cà phê muối Ban Mê",
    "drink": [
     "Cà phê muối, cacao Đắk Lắk",
     "Salted coffee and Dak Lak cocoa"
    ],
    "address": "Trung tâm TP Buôn Ma Thuột",
    "price": [
     20000,
     40000
    ]
   },
   {
    "name": "Quán nước bơ – sinh tố chợ",
    "drink": [
     "Sinh tố bơ, nước ép chanh dây",
     "Avocado smoothies and passion-fruit juice"
    ],
    "address": "Chợ Buôn Ma Thuột",
    "price": [
     15000,
     35000
    ]
   }
  ],
  "stays": [
   {
    "area": [
     "Trung tâm (Ngã 6 Ban Mê)",
     "City centre (Ban Me six-way junction)"
    ],
    "type": "hotel",
    "price": [
     400000,
     1200000
    ],
    "note": [
     "Gần quảng trường, quán cà phê, chợ.",
     "Near the square, cafés and market."
    ]
   },
   {
    "area": [
     "Buôn Kô Siêr – buôn Akô Dhông",
     "Ko Sier – Ako Dhong villages"
    ],
    "type": "homestay",
    "price": [
     300000,
     700000
    ],
    "note": [
     "Nhà dài Ê Đê ngay trong thành phố.",
     "Ede longhouses right inside the city."
    ]
   },
   {
    "area": [
     "Hồ Lắk",
     "Lak Lake"
    ],
    "type": "resort",
    "price": [
     700000,
     2000000
    ],
    "note": [
     "Resort ven hồ, gần buôn Jun.",
     "Lakeside resorts near Jun village."
    ]
   }
  ]
 }
}
const SIGHTS = {
 "buon-ma-thuot": [
  [
   {
    "at": "a",
    "name": [
     "Bảo tàng Thế giới Cà phê",
     "World Coffee Museum"
    ],
    "price": 75000,
    "hours": "07:00–17:00",
    "address": "Nguyễn Đình Chiểu, Tân Lợi",
    "cafe": {
     "name": "Cà phê trong Bảo tàng Thế giới Cà phê",
     "drink": [
      "Cà phê rang xay nhiều vùng trồng",
      "Single-origin brews from many regions"
     ],
     "price": [
      40000,
      90000
     ]
    }
   },
   {
    "at": "a",
    "name": [
     "Làng cà phê Trung Nguyên",
     "Trung Nguyen Coffee Village"
    ],
    "price": 0,
    "hours": "07:00–22:00",
    "address": "Lê Thánh Tông, Buôn Ma Thuột"
   },
   {
    "at": "e",
    "name": [
     "Quảng trường 10/3",
     "10 March Square"
    ],
    "price": 0,
    "hours": "all",
    "address": "Trung tâm Buôn Ma Thuột"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Thác Dray Nur",
     "Dray Nur falls"
    ],
    "price": 60000,
    "hours": "07:00–17:00",
    "address": "Krông Ana, Đắk Lắk",
    "cafe": {
     "name": "Quán nước chân thác Dray Nur",
     "drink": [
      "Nước dừa, cà phê đá",
      "Coconut water, iced coffee"
     ],
     "price": [
      15000,
      35000
     ]
    }
   },
   {
    "at": "m",
    "name": [
     "Thác Dray Sáp",
     "Dray Sap falls"
    ],
    "price": 50000,
    "hours": "07:00–17:00",
    "address": "Krông Nô, Đắk Nông"
   },
   {
    "at": "a",
    "name": [
     "Vườn cà phê – xưởng rang xay",
     "Coffee farm – roastery"
    ],
    "price": 0,
    "hours": "07:00–17:00",
    "address": "Ea Tu, Buôn Ma Thuột",
    "cafe": {
     "name": "Cà phê vườn rẫy Ea Tu",
     "drink": [
      "Cà phê phin vừa rang tại vườn",
      "Phin coffee freshly roasted on the farm"
     ],
     "price": [
      25000,
      50000
     ]
    }
   },
   {
    "at": "e",
    "name": [
     "Buôn Kô Siêr – cồng chiêng, rượu cần",
     "Ko Sier village – gongs & rice wine"
    ],
    "price": [
     150000,
     300000
    ],
    "hours": "19:00–21:30",
    "address": "Buôn Kô Siêr, Buôn Ma Thuột"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Hồ Lắk – thuyền độc mộc",
     "Lak lake – dugout canoe"
    ],
    "price": [
     100000,
     150000
    ],
    "hours": "07:00–17:00",
    "address": "Liên Sơn, Lắk",
    "cafe": {
     "name": "Quán nước bờ hồ Lắk",
     "drink": [
      "Cà phê, nước dừa nhìn hồ",
      "Coffee and coconut water by the lake"
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
     "Buôn Jun – biệt điện Bảo Đại",
     "Jun village – Bao Dai villa"
    ],
    "price": 20000,
    "hours": "07:00–17:00",
    "address": "Liên Sơn, Lắk",
    "cafe": {
     "name": "Cà phê biệt điện Bảo Đại hồ Lắk",
     "drink": [
      "Cà phê, trà ngắm toàn hồ",
      "Coffee and tea over the whole lake"
     ],
     "price": [
      25000,
      50000
     ]
    }
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Cầu treo Buôn Đôn",
     "Buon Don suspension bridges"
    ],
    "price": 60000,
    "hours": "07:00–17:00",
    "address": "Krông Na, Buôn Đôn",
    "cafe": {
     "name": "Quán nước cầu treo Buôn Đôn",
     "drink": [
      "Nước dừa, cà phê đá",
      "Coconut water, iced coffee"
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
     "Khu bảo tồn voi (đi bộ cùng voi)",
     "Elephant sanctuary (walk with elephants)"
    ],
    "price": [
     300000,
     800000
    ],
    "note": [
     "Chọn tour không cưỡi voi",
     "Choose a no-riding tour"
    ],
    "hours": "07:00–16:00",
    "address": "VQG Yok Đôn, Buôn Đôn",
    "cafe": {
     "name": "Quán nước nhà sàn cổ Buôn Đôn",
     "drink": [
      "Rượu cần, trà nóng",
      "Rice wine, hot tea"
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
     "Chợ Buôn Ma Thuột",
     "Buon Ma Thuot market"
    ],
    "price": 0,
    "hours": "05:00–18:00",
    "address": "Phan Bội Châu, Buôn Ma Thuột"
   },
   {
    "at": "a",
    "name": [
     "Nhà đày Buôn Ma Thuột",
     "Buon Ma Thuot Prison"
    ],
    "price": 0,
    "hours": "07:00–11:00, 13:30–17:00",
    "address": "18 Tán Thuật, Buôn Ma Thuột"
   },
   {
    "at": "a",
    "name": [
     "Chùa Sắc tứ Khải Đoan",
     "Khai Doan Pagoda"
    ],
    "price": 0,
    "hours": "06:00–18:00",
    "address": "117 Phan Bội Châu, Buôn Ma Thuột",
    "cafe": {
     "name": "Quán nước chùa Khải Đoan",
     "drink": [
      "Cà phê sữa đá, trà đá",
      "Iced milk coffee, iced tea"
     ],
     "price": [
      15000,
      30000
     ]
    }
   }
  ]
 ]
}
