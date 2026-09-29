/* Sinh tự động bởi tools/build.js từ places.js + sights.js – không sửa tay. */
const STAY_TYPES = {"homestay":["Homestay","Homestay"],"hotel":["Khách sạn","Hotel"],"resort":["Resort","Resort"],"boat":["Du thuyền ngủ đêm","Overnight cruise"]}
const PLACES = {
 "sai-gon": {
  "city": "Ho Chi Minh City",
  "airport": "SGN",
  "rail": "Sài Gòn",
  "getThere": [
   "Sân bay Tân Sơn Nhất (SGN) cách Quận 1 ~7 km: bus 109 hoặc taxi/Grab ~100–150k. Ga Sài Gòn ở Quận 3.",
   "Tan Son Nhat Airport (SGN) is ~7 km from District 1: bus 109 or taxi/Grab ~100–150k VND. Saigon Station is in District 3."
  ],
  "eats": [
   {
    "name": "Bánh mì Huỳnh Hoa",
    "dish": [
     "Bánh mì pate \"khổng lồ\"",
     "The famously loaded pâté banh mi"
    ],
    "address": "26 Lê Thị Riêng, Quận 1",
    "price": [
     60000,
     80000
    ]
   },
   {
    "name": "Cơm tấm Ba Ghiền",
    "dish": [
     "Cơm tấm sườn nướng miếng lớn",
     "Broken rice with giant grilled pork chop"
    ],
    "address": "84 Đặng Văn Ngữ, Phú Nhuận",
    "price": [
     60000,
     100000
    ]
   },
   {
    "name": "Phở Hòa Pasteur",
    "dish": [
     "Phở bò kiểu Nam, nhiều rau",
     "Southern-style beef pho with herbs"
    ],
    "address": "260C Pasteur, Quận 3",
    "price": [
     80000,
     110000
    ]
   },
   {
    "name": "Bánh xèo 46A Đinh Công Tráng",
    "dish": [
     "Bánh xèo miền Tây cỡ lớn",
     "Giant Mekong-style banh xeo"
    ],
    "address": "46A Đinh Công Tráng, Quận 1",
    "price": [
     80000,
     150000
    ]
   },
   {
    "name": "Hủ tiếu Nam Vang Liến Hưng",
    "dish": [
     "Hủ tiếu Nam Vang",
     "Phnom Penh-style noodle soup"
    ],
    "address": "Đường Trần Hưng Đạo, Quận 5",
    "price": [
     60000,
     90000
    ]
   },
   {
    "name": "Bò bía – gỏi cuốn phố Nguyễn Thượng Hiền",
    "dish": [
     "Gỏi cuốn, bò bía, bánh tráng trộn",
     "Spring rolls, bo bia, rice-paper salad"
    ],
    "address": "Nguyễn Thượng Hiền, Quận 3",
    "price": [
     30000,
     60000
    ]
   },
   {
    "name": "Phố ốc Vĩnh Khánh",
    "dish": [
     "Ốc len xào dừa, sò điệp nướng",
     "Coconut snails, grilled scallops"
    ],
    "address": "Vĩnh Khánh, Quận 4",
    "price": [
     100000,
     250000
    ]
   },
   {
    "name": "Chợ Bến Thành",
    "dish": [
     "Ăn vặt, chè, bánh canh cua",
     "Snacks, sweet soups, crab noodle soup"
    ],
    "address": "Chợ Bến Thành, Quận 1",
    "price": [
     40000,
     120000
    ]
   }
  ],
  "cafes": [
   {
    "name": "Cà phê chung cư 42 Nguyễn Huệ",
    "drink": [
     "Cà phê, trà ngắm phố đi bộ",
     "Coffee and tea over the walking street"
    ],
    "address": "42 Nguyễn Huệ, Quận 1",
    "price": [
     40000,
     80000
    ]
   },
   {
    "name": "Cà phê bệt công viên Bến Thành",
    "drink": [
     "Cà phê sữa đá kiểu Sài Gòn vỉa hè",
     "Street-style iced milk coffee"
    ],
    "address": "Khu công viên quanh Nhà thờ Đức Bà, Quận 1",
    "price": [
     15000,
     30000
    ]
   },
   {
    "name": "The Workshop Coffee",
    "drink": [
     "Cà phê pha thủ công, cold brew",
     "Specialty pour-over and cold brew"
    ],
    "address": "27 Ngô Đức Kế, Quận 1",
    "price": [
     60000,
     100000
    ]
   }
  ],
  "stays": [
   {
    "area": [
     "Quận 1 (Bến Thành – Nguyễn Huệ)",
     "District 1 (Ben Thanh – Nguyen Hue)"
    ],
    "type": "hotel",
    "price": [
     600000,
     2500000
    ],
    "note": [
     "Đi bộ tới chợ Bến Thành, phố đi bộ.",
     "Walk to Ben Thanh market and the walking street."
    ]
   },
   {
    "area": [
     "Quận 3",
     "District 3"
    ],
    "type": "homestay",
    "price": [
     400000,
     1200000
    ],
    "note": [
     "Yên tĩnh hơn, nhiều quán ăn địa phương.",
     "Quieter, full of local eateries."
    ]
   },
   {
    "area": [
     "Phố Tây Bùi Viện",
     "Bui Vien backpacker street"
    ],
    "type": "hotel",
    "price": [
     300000,
     800000
    ],
    "note": [
     "Giá rẻ, sôi động về đêm (khá ồn).",
     "Cheap and lively at night (can be noisy)."
    ]
   }
  ]
 }
}
const SIGHTS = {
 "sai-gon": [
  [
   {
    "at": "m",
    "name": [
     "Dinh Độc Lập",
     "Independence Palace"
    ],
    "price": 65000,
    "hours": "08:00–16:30",
    "address": "135 Nam Kỳ Khởi Nghĩa, Quận 1"
   },
   {
    "at": "m",
    "name": [
     "Nhà thờ Đức Bà",
     "Notre-Dame Cathedral"
    ],
    "price": 0,
    "note": [
     "Đang trùng tu – ngắm bên ngoài",
     "Under restoration – view outside"
    ],
    "hours": "all",
    "address": "01 Công xã Paris, Quận 1"
   },
   {
    "at": "m",
    "name": [
     "Bưu điện Thành phố",
     "Central Post Office"
    ],
    "price": 0,
    "hours": "07:00–19:00",
    "address": "02 Công xã Paris, Quận 1",
    "cafe": {
     "name": "Cà phê đường sách Nguyễn Văn Bình",
     "drink": [
      "Cà phê, trà giữa đường sách",
      "Coffee and tea on Book Street"
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
     "Bảo tàng Chứng tích Chiến tranh",
     "War Remnants Museum"
    ],
    "price": 40000,
    "hours": "07:30–17:30",
    "address": "28 Võ Văn Tần, Quận 3"
   },
   {
    "at": "a",
    "name": [
     "Chợ Bến Thành",
     "Ben Thanh Market"
    ],
    "price": 0,
    "hours": "07:00–18:00",
    "address": "Lê Lợi, Quận 1",
    "cafe": {
     "name": "Quán nước mía – sinh tố chợ Bến Thành",
     "drink": [
      "Nước mía, sinh tố bơ, nước dừa",
      "Sugarcane juice, avocado smoothie, coconut"
     ],
     "price": [
      20000,
      45000
     ]
    }
   },
   {
    "at": "e",
    "name": [
     "Phố đi bộ Nguyễn Huệ",
     "Nguyen Hue walking street"
    ],
    "price": 0,
    "hours": "all",
    "address": "Nguyễn Huệ, Quận 1"
   },
   {
    "at": "e",
    "name": [
     "Saigon Skydeck (Bitexco)",
     "Saigon Skydeck (Bitexco)"
    ],
    "price": [
     200000,
     250000
    ],
    "hours": "09:30–21:30",
    "address": "36 Hồ Tùng Mậu, Quận 1"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Địa đạo Củ Chi",
     "Cu Chi Tunnels"
    ],
    "price": 125000,
    "note": [
     "Khách nước ngoài; người Việt ~35.000đ",
     "Foreign visitors; Vietnamese ~35,000đ"
    ],
    "hours": "07:00–17:00",
    "address": "Phú Hiệp, Củ Chi",
    "cafe": {
     "name": "Quán nước địa đạo Bến Đình",
     "drink": [
      "Trà, khoai mì luộc, nước dừa",
      "Tea, boiled cassava, coconut water"
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
     "Chùa Bà Thiên Hậu",
     "Thien Hau Temple"
    ],
    "price": 0,
    "hours": "06:00–16:30",
    "address": "710 Nguyễn Trãi, Quận 5"
   },
   {
    "at": "a",
    "name": [
     "Chợ Lớn – chợ Bình Tây",
     "Cho Lon – Binh Tay Market"
    ],
    "price": 0,
    "hours": "06:00–19:00",
    "address": "Tháp Mười, Quận 6",
    "cafe": {
     "name": "Chè Hà Ký (Chợ Lớn)",
     "drink": [
      "Chè mè đen, sâm bổ lượng",
      "Black sesame soup, sam bo luong"
     ],
     "price": [
      25000,
      45000
     ]
    }
   },
   {
    "at": "e",
    "name": [
     "Food tour xe máy Quận 4",
     "District 4 motorbike food tour"
    ],
    "price": [
     700000,
     1200000
    ],
    "note": [
     "Gồm xe, hướng dẫn và món ăn",
     "Includes bike, guide and food"
    ],
    "hours": "17:30–21:30",
    "address": "Đón tại khách sạn Quận 1"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Rừng Sác Cần Giờ – đảo Khỉ",
     "Can Gio mangroves – Monkey Island"
    ],
    "price": [
     150000,
     200000
    ],
    "note": [
     "Gồm vé khu du lịch, cano",
     "Includes park entry and boat"
    ],
    "hours": "07:00–17:00",
    "address": "Long Hòa, Cần Giờ",
    "cafe": {
     "name": "Quán nước đảo Khỉ Cần Giờ",
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
     "Biển 30/4 Cần Giờ",
     "30/4 beach, Can Gio"
    ],
    "price": 0,
    "hours": "all",
    "address": "Thị trấn Cần Thạnh, Cần Giờ",
    "cafe": {
     "name": "Quán nước dừa biển 30/4",
     "drink": [
      "Nước dừa, ốc luộc",
      "Coconut water, boiled snails"
     ],
     "price": [
      15000,
      50000
     ]
    }
   },
   {
    "at": "e",
    "name": [
     "Du thuyền sông Sài Gòn",
     "Saigon river dinner cruise"
    ],
    "price": [
     400000,
     900000
    ],
    "note": [
     "Gồm ăn tối",
     "Dinner included"
    ],
    "hours": "19:00–21:30",
    "address": "Bến Bạch Đằng, Quận 1"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Mỹ Tho – cồn Thới Sơn",
     "My Tho – Thoi Son islet"
    ],
    "price": [
     250000,
     450000
    ],
    "note": [
     "Tour thuyền, gồm trái cây, đờn ca tài tử",
     "Boat tour with fruit and folk music"
    ],
    "hours": "07:30–16:00",
    "address": "Bến tàu du lịch Mỹ Tho",
    "cafe": {
     "name": "Quán trà mật ong cồn Thới Sơn",
     "drink": [
      "Trà mật ong, nước dừa",
      "Honey tea, coconut water"
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
     "Xuồng ba lá rạch dừa Bến Tre",
     "Sampan through Ben Tre coconut canals"
    ],
    "price": 0,
    "note": [
     "Gồm trong tour",
     "Included in the tour"
    ],
    "hours": "08:00–16:00",
    "address": "Cồn Phụng, Bến Tre",
    "cafe": {
     "name": "Quán nước dừa Cồn Phụng",
     "drink": [
      "Nước dừa xiêm, kẹo dừa",
      "Siamese coconut, coconut candy"
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
     "Phố Tây Bùi Viện",
     "Bui Vien backpacker street"
    ],
    "price": 0,
    "hours": "19:00–02:00",
    "address": "Bùi Viện, Quận 1"
   }
  ],
  [
   {
    "at": "m",
    "name": [
     "Tòa Thánh Cao Đài Tây Ninh",
     "Cao Dai Holy See"
    ],
    "price": 0,
    "hours": [
     "Lễ 06:00, 12:00, 18:00, 24:00",
     "Services 6am, noon, 6pm, midnight"
    ],
    "address": "Hòa Thành, Tây Ninh",
    "cafe": {
     "name": "Quán nước cổng Tòa Thánh",
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
     "Cáp treo núi Bà Đen",
     "Ba Den mountain cable car"
    ],
    "price": [
     300000,
     450000
    ],
    "note": [
     "Khứ hồi, tùy tuyến",
     "Return, depending on route"
    ],
    "hours": "06:00–18:00",
    "address": "Thạnh Tân, Tây Ninh",
    "cafe": {
     "name": "Quán nước ga cáp treo Bà Đen",
     "drink": [
      "Cà phê, nước ép",
      "Coffee, juice"
     ],
     "price": [
      30000,
      60000
     ]
    }
   }
  ]
 ]
}
