const EVENT_TYPES={festival:{icon:"ri-flag-2-line",label:["Lễ hội","Festival"]},nature:{icon:"ri-plant-line",label:["Mùa cảnh sắc","Seasonal scenery"]},holiday:{icon:"ri-group-line",label:["Nghỉ lễ – đông khách","Public holiday – busy"]},weather:{icon:"ri-thunderstorms-line",label:["Thời tiết cần lưu ý","Weather alert"]}},EVENTS=[{id:"tet",where:"all",type:"holiday",months:[1,2],lunar:!0,name:["Tết Nguyên Đán","Lunar New Year (Tết)"],desc:["Dịp lễ lớn nhất năm: không khí rộn ràng, chợ hoa, đền chùa đông vui.","The biggest holiday of the year: flower markets, busy temples and a festive mood."],tip:["Nhiều quán đóng cửa 3–5 ngày, vé xe/máy bay và phòng tăng giá mạnh – đặt trước 1–2 tháng.","Many shops close for 3–5 days; transport and rooms get much pricier – book 1–2 months ahead."]},{id:"le-30-4",where:"all",type:"holiday",dates:["04-28","05-03"],name:["Nghỉ lễ 30/4 – 1/5","Reunification Day & Labour Day holiday"],desc:["Kỳ nghỉ dài đầu hè, các điểm biển và gần thành phố lớn rất đông.","A long early-summer break; beaches and places near big cities get crowded."],tip:["Đặt phòng, vé sớm; tránh đi đường bộ vào ngày đầu và cuối kỳ nghỉ.","Book early and avoid road travel on the first and last day of the break."]},{id:"quoc-khanh",where:"all",type:"holiday",dates:["08-30","09-03"],name:["Nghỉ lễ Quốc khánh 2/9","National Day holiday (2 Sep)"],desc:["Kỳ nghỉ cuối hè, nhiều hoạt động kỷ niệm ở Hà Nội và các thành phố.","An end-of-summer break with celebrations in Hanoi and other cities."],tip:["Giá phòng tăng, nên đặt trước ít nhất 2–3 tuần.","Room prices rise – book at least 2–3 weeks ahead."]},{id:"he-bien",where:["vinh-ha-long","cat-ba","da-nang","nha-trang","quy-nhon","phu-yen","vung-tau","phu-quoc","ly-son","con-dao","mui-ne","ninh-thuan","co-to"],type:"holiday",months:[6,7,8],name:["Cao điểm du lịch hè","Summer peak season"],desc:["Học sinh nghỉ hè, các bãi biển đông nhất năm.","School holidays make beaches their busiest of the year."],tip:["Đi giữa tuần và đặt phòng sớm để có giá tốt.","Travel midweek and book early for better prices."]},{id:"phu-quoc-cao-diem",where:["phu-quoc","ha-tien"],type:"holiday",months:[12,1,2],name:["Mùa khô – cao điểm đảo ngọc","Dry season – peak time on Phu Quoc"],desc:["Biển êm, trời trong – thời điểm đẹp và đông khách quốc tế nhất.","Calm seas and clear skies – the most beautiful and busiest time."],tip:["Resort, tour 4 đảo và cáp treo nên đặt trước.","Book resorts, island tours and the cable car ahead."]},{id:"chua-huong",where:["ha-noi"],type:"festival",months:[2,3,4],lunar:!0,name:["Lễ hội chùa Hương","Perfume Pagoda Festival"],desc:["Mùng 6 tháng Giêng đến hết tháng 3 âm lịch – hàng vạn người trẩy hội suối Yến.","From the 6th of the first lunar month to the end of the third – huge crowds on Yen stream."],tip:["Tránh cuối tuần tháng Giêng; đi sớm từ 6h để kịp đò.","Avoid weekends in the first lunar month; set off by 6am."]},{id:"trung-thu",where:["ha-noi","hoi-an"],type:"festival",months:[9,10],lunar:!0,name:["Tết Trung thu","Mid-Autumn Festival"],desc:["Rằm tháng 8 âm lịch: phố Hàng Mã (Hà Nội) và phố cổ Hội An rực rỡ đèn lồng, múa lân.","15th of the 8th lunar month: lantern-filled Hang Ma street and Hoi An, lion dances."],tip:["Buổi tối rất đông – gửi xe xa và đi bộ vào phố.","Evenings are packed – park further out and walk in."]},{id:"hoi-an-ram",where:["hoi-an"],type:"festival",months:[1,2,3,4,5,6,7,8,9,10,11,12],lunar:!0,name:["Đêm rằm phố cổ","Full-moon night in the old town"],desc:["Tối 14 âm lịch hằng tháng: phố cổ tắt đèn điện, chỉ thắp đèn lồng, thả hoa đăng.","Every 14th lunar evening the old town switches to lantern light only."],tip:["Xem lịch âm để đi đúng đêm rằm.","Check the lunar calendar to catch the full-moon night."]},{id:"festival-hue",where:["hue"],type:"festival",months:[4,5,6],name:["Festival Huế","Hue Festival"],desc:["Chuỗi hoạt động văn hóa, nghệ thuật cung đình – các sự kiện chính thường vào năm chẵn.","Royal arts and culture events – the main edition is usually held in even years."],tip:["Xem lịch chính thức; phòng trung tâm hết sớm.","Check the official schedule; central hotels sell out early."]},{id:"phao-hoa-da-nang",where:["da-nang","hoi-an"],type:"festival",months:[6,7],name:["Lễ hội pháo hoa quốc tế Đà Nẵng (DIFF)","Da Nang International Fireworks Festival"],desc:["Các đội pháo hoa quốc tế trình diễn trên sông Hàn vào các tối cuối tuần.","International teams put on shows over the Han River on weekend nights."],tip:["Mua vé khán đài hoặc tìm quán ven sông từ sớm; phòng tăng giá mạnh.","Buy stand tickets or grab a riverside spot early; rooms get pricey."]},{id:"khau-vai",where:["ha-giang"],type:"festival",months:[4,5],lunar:!0,name:["Chợ tình Khâu Vai","Khau Vai Love Market"],desc:["Ngày 26–27 tháng 3 âm lịch ở Mèo Vạc – phiên chợ độc đáo của đồng bào vùng cao.","On the 26th–27th of the third lunar month in Meo Vac – a unique highland gathering."],tip:["Đặt homestay Mèo Vạc sớm, đường đèo đông xe.","Book Meo Vac homestays early; mountain roads get busy."]},{id:"ba-chua-xu",where:["chau-doc"],type:"festival",months:[5,6],lunar:!0,name:["Lễ hội Vía Bà Chúa Xứ núi Sam","Ba Chua Xu Festival at Sam Mountain"],desc:["23–27 tháng 4 âm lịch – một trong những lễ hội lớn nhất Nam Bộ.","The 23rd–27th of the fourth lunar month – one of the biggest festivals in the south."],tip:["Rất đông, nên ở Châu Đốc và đi sớm; giữ tư trang cẩn thận.","Very crowded – stay in Chau Doc, go early and watch your belongings."]},{id:"ca-phe-bmt",where:["buon-ma-thuot"],type:"festival",months:[3],name:["Lễ hội cà phê Buôn Ma Thuột","Buon Ma Thuot Coffee Festival"],desc:["Tháng 3, thường 2 năm/lần: đường phố cà phê, đua voi, cồng chiêng Tây Nguyên.","Usually every other March: coffee streets, elephant races and gong music."],tip:["Xem năm tổ chức trước khi lên kế hoạch.","Check whether it runs that year before planning."]},{id:"hoa-da-lat",where:["da-lat"],type:"festival",months:[12],name:["Festival Hoa Đà Lạt","Da Lat Flower Festival"],desc:["Tháng 12, thường 2 năm/lần: diễu hành xe hoa, trưng bày hoa quanh hồ Xuân Hương.","Usually every other December: flower parades and displays around Xuan Huong Lake."],tip:["Trùng mùa đông khách cuối năm – đặt phòng sớm.","Coincides with year-end crowds – book early."]},{id:"lua-chin-tay-bac",where:["mu-cang-chai","sa-pa","ha-giang","pu-luong"],type:"nature",dates:["09-05","10-15"],name:["Mùa lúa chín trên ruộng bậc thang","Golden rice terraces"],desc:["Ruộng bậc thang vàng óng – đẹp nhất nửa cuối tháng 9 đến đầu tháng 10.","Terraces turn gold – best from late September to early October."],tip:["Cuối tuần rất đông, homestay hết phòng sớm.","Weekends are crowded and homestays fill up fast."]},{id:"nuoc-do",where:["mu-cang-chai","pu-luong","sa-pa"],type:"nature",dates:["05-10","06-15"],name:["Mùa nước đổ","Water-pouring season"],desc:["Ruộng bậc thang ngập nước phản chiếu trời mây, người dân vào vụ cấy.","Flooded terraces mirror the sky as planting begins."],tip:["Đi sáng sớm hoặc chiều muộn để có ánh sáng đẹp.","Go early morning or late afternoon for the best light."]},{id:"tam-giac-mach",where:["ha-giang"],type:"nature",months:[10,11],name:["Mùa hoa tam giác mạch","Buckwheat flower season"],desc:["Hoa tam giác mạch hồng tím phủ các sườn đồi Đồng Văn, Sủng Là.","Pink-purple buckwheat flowers cover the hills around Dong Van and Sung La."],tip:["Cao điểm cuối tuần – nên đi giữa tuần.","Weekends peak – go midweek if you can."]},{id:"hoa-man-moc-chau",where:["moc-chau"],type:"nature",months:[1,2],name:["Mùa hoa mận, hoa đào","Plum and peach blossom season"],desc:["Thung lũng Nà Ka trắng hoa mận, xen hoa đào hồng dịp Tết.","Na Ka valley turns white with plum blossom, dotted with pink peach."],tip:["Trời lạnh và có sương – mang áo ấm.","It is cold and misty – bring warm layers."]},{id:"hoa-cai-moc-chau",where:["moc-chau"],type:"nature",months:[11,12],name:["Mùa hoa cải trắng","White mustard flower season"],desc:["Đồi cải trắng trải dài ở Chiềng Đi, Nà Ka.","Fields of white mustard flowers across Chieng Di and Na Ka."],tip:["Một số vườn thu phí chụp ảnh 20.000–30.000đ.","Some fields charge 20,000–30,000đ for photos."]},{id:"da-quy",where:["da-lat","buon-ma-thuot"],type:"nature",months:[11],name:["Mùa hoa dã quỳ","Wild sunflower season"],desc:["Hoa dã quỳ vàng rực ven đường Tây Nguyên, đèo Prenn, núi Langbiang.","Wild sunflowers line the Highlands roads, Prenn pass and Langbiang."],tip:["Nắng đẹp, se lạnh – thời điểm lý tưởng để chạy xe máy.","Sunny and cool – ideal for a motorbike ride."]},{id:"mai-anh-dao",where:["da-lat"],type:"nature",months:[1,2],name:["Mùa mai anh đào","Cherry blossom season"],desc:["Mai anh đào hồng quanh hồ Xuân Hương, đồi chè Cầu Đất.","Pink cherry blossoms around Xuan Huong Lake and Cau Dat tea hills."],tip:["Trùng dịp Tết – đặt phòng sớm.","Often overlaps with Tết – book early."]},{id:"nuoc-noi",where:["can-tho","chau-doc"],type:"nature",months:[9,10,11],name:["Mùa nước nổi miền Tây","Mekong flood season"],desc:["Nước lên đồng: cá linh, bông điên điển, rừng tràm Trà Sư xanh mướt.","Rising water brings linh fish, sesbania flowers and lush Tra Su forest."],tip:["Thử lẩu mắm cá linh – chỉ có vào mùa này.","Try linh fish hotpot – only available this season."]},{id:"rua-con-dao",where:["con-dao"],type:"nature",months:[5,6,7,8,9],name:["Mùa rùa biển đẻ trứng","Sea turtle nesting season"],desc:["Xem rùa lên bãi đẻ trứng và thả rùa con ở Hòn Bảy Cạnh.","Watch turtles nest and hatchlings released on Bay Canh island."],tip:["Phải đăng ký trước với Vườn quốc gia Côn Đảo.","Must be booked in advance with Con Dao National Park."]},{id:"bang-tuyet-sa-pa",where:["sa-pa"],type:"nature",months:[12,1],name:["Mùa băng giá, có thể có tuyết","Frost season – possible snow"],desc:["Đỉnh Fansipan và Ô Quy Hồ có thể xuất hiện băng giá, tuyết khi có không khí lạnh mạnh.","Fansipan and O Quy Ho may see frost or snow during strong cold spells."],tip:["Nhiệt độ có thể dưới 0°C – mang áo phao, găng tay, mũ len.","Temperatures can drop below 0°C – pack a down jacket, gloves and a beanie."]},{id:"bao-mien-trung",where:["hue","da-nang","hoi-an","phong-nha","quy-nhon","phu-yen","ly-son","nha-trang"],type:"weather",months:[9,10,11],name:["Mùa mưa bão miền Trung","Central Vietnam storm season"],desc:["Mưa lớn, có thể ngập lụt và bão; phố cổ Hội An, Huế có thể ngập.","Heavy rain, possible floods and typhoons; Hoi An and Hue may flood."],tip:["Theo dõi dự báo, chọn vé/phòng hủy linh hoạt; tàu ra đảo có thể tạm dừng.","Watch forecasts and book flexible tickets/rooms; island boats may be suspended."]},{id:"song-bien-dong",where:["phu-quoc","con-dao","ha-tien","cat-ba"],type:"weather",months:[6,7,8,9],name:["Mùa biển động","Rough-sea season"],desc:["Gió mùa làm biển động, tour đảo và tàu cao tốc có thể bị hủy.","Monsoon winds bring rough seas; island tours and ferries may be cancelled."],tip:["Để dư 1 ngày trong lịch trình phòng khi tàu hủy.","Keep a spare day in case boats are cancelled."]},{id:"hoi-xuan-nui-ba",where:["tay-ninh"],type:"festival",months:[1,2,3],lunar:!0,name:["Hội Xuân núi Bà Đen","Ba Den Mountain Spring Festival"],desc:["Từ mùng 1 Tết đến hết tháng Giêng âm lịch – lượng khách hành hương đông nhất năm.","From Tet to the end of the first lunar month – the busiest pilgrimage season of the year."],tip:["Mua vé cáp treo trước, đi thật sớm và tránh ngày rằm.","Buy cable car tickets ahead, go very early and avoid the full-moon day."]},{id:"kate",where:["ninh-thuan"],type:"festival",months:[9,10],lunar:!0,name:["Lễ hội Katê của người Chăm","Cham Kate Festival"],desc:["Tháng 7 lịch Chăm (thường rơi vào tháng 9–10 dương lịch) – lễ rước y trang, múa hát ở các tháp Pô Klong Garai, Pô Rômê.","The seventh month of the Cham calendar (usually September–October) – costume processions, music and dance at the Po Klong Garai and Po Rome towers."],tip:["Xem ngày cụ thể của tỉnh trước khi đi; tôn trọng nghi lễ, không chen vào đoàn rước.","Check the official dates first; respect the rites and don't cut into the procession."]}],PACKING_GROUPS={docs:{icon:"ri-passport-line",label:["Giấy tờ & tiền","Documents & money"]},clothes:{icon:"ri-t-shirt-line",label:["Quần áo","Clothing"]},health:{icon:"ri-first-aid-kit-line",label:["Sức khỏe & vệ sinh","Health & toiletries"]},gear:{icon:"ri-plug-line",label:["Đồ dùng & điện tử","Gear & electronics"]}},COOL_DESTINATIONS=["sa-pa","ha-giang","moc-chau","mu-cang-chai","pu-luong","ban-gioc","da-lat"],BOAT_DESTINATIONS=["vinh-ha-long","cat-ba","phu-quoc","con-dao","ly-son","ha-tien","nha-trang","quy-nhon","phu-yen","ninh-thuan","co-to","ca-mau","nam-du"],MOTORBIKE_DESTINATIONS=["ha-giang","mu-cang-chai","ban-gioc","pu-luong"],TREK_DESTINATIONS=["sa-pa","ha-giang","mu-cang-chai","pu-luong","phong-nha","cat-ba","ninh-binh","ban-gioc","moc-chau"],PACKING={base:[{id:"cccd",group:"docs",name:["CCCD / hộ chiếu","ID card / passport"]},{id:"cash",group:"docs",name:["Tiền mặt (chợ, quán nhỏ ít nhận thẻ)","Cash (markets and small shops rarely take cards)"]},{id:"bank",group:"docs",name:["Thẻ ngân hàng / ví điện tử","Bank card / e-wallet"]},{id:"booking",group:"docs",name:["Xác nhận đặt phòng, vé (lưu offline)","Booking confirmations (saved offline)"]},{id:"clothes",group:"clothes",name:["Quần áo đủ số ngày + 1 bộ dự phòng","Clothes for each day + 1 spare set"]},{id:"shoes",group:"clothes",name:["Giày đi bộ thoải mái","Comfortable walking shoes"]},{id:"meds",group:"health",name:["Thuốc cá nhân, hạ sốt, đau bụng","Personal meds, fever and stomach remedies"]},{id:"toiletries",group:"health",name:["Đồ vệ sinh cá nhân","Toiletries"]},{id:"charger",group:"gear",name:["Sạc điện thoại + pin dự phòng","Phone charger + power bank"]},{id:"bottle",group:"gear",name:["Bình nước cá nhân","Reusable water bottle"]}],rules:[{when:"beach",items:[{id:"swim",group:"clothes",name:["Đồ bơi, dép tông","Swimwear and flip-flops"]},{id:"sunscreen",group:"health",name:["Kem chống nắng SPF 50","SPF 50 sunscreen"]},{id:"hat",group:"clothes",name:["Mũ rộng vành, kính râm","Wide-brim hat and sunglasses"]},{id:"drybag",group:"gear",name:["Túi chống nước cho điện thoại","Waterproof phone pouch"]}]},{when:"boat",items:[{id:"seasick",group:"health",name:["Thuốc say tàu xe","Motion-sickness tablets"]}]},{when:"mountain",items:[{id:"jacket",group:"clothes",name:["Áo khoác (tối và sáng sớm se lạnh)","Jacket (cool mornings and evenings)"]},{id:"repellent",group:"health",name:["Kem chống muỗi, côn trùng","Insect repellent"]}]},{when:"cold",items:[{id:"down",group:"clothes",name:["Áo phao / áo ấm dày","Down jacket / warm coat"]},{id:"gloves",group:"clothes",name:["Găng tay, mũ len, tất dày","Gloves, beanie and thick socks"]},{id:"lipbalm",group:"health",name:["Son dưỡng, kem dưỡng da","Lip balm and moisturiser"]}]},{when:"hot",items:[{id:"light",group:"clothes",name:["Quần áo mỏng, thoáng","Light, breathable clothing"]},{id:"electrolyte",group:"health",name:["Oresol / nước điện giải","Oral rehydration salts"]}]},{when:"rain",items:[{id:"raincoat",group:"clothes",name:["Áo mưa / ô gấp","Raincoat / compact umbrella"]},{id:"plasticbag",group:"gear",name:["Túi nilon bọc đồ điện tử","Plastic bags to keep electronics dry"]}]},{when:"trek",items:[{id:"trekshoes",group:"clothes",name:["Giày trekking đế bám","Grippy trekking shoes"]},{id:"daypack",group:"gear",name:["Balo nhỏ đi trong ngày","Small daypack"]},{id:"plaster",group:"health",name:["Băng dán cá nhân","Plasters"]}]},{when:"motorbike",items:[{id:"license",group:"docs",name:["Bằng lái xe máy (A1)","Motorbike licence (A1)"]},{id:"rainsuit",group:"clothes",name:["Áo mưa bộ, găng tay chạy xe","Rain suit and riding gloves"]}]},{when:"heritage",items:[{id:"modest",group:"clothes",name:["Trang phục kín vai, gối khi vào chùa, lăng","Clothes covering shoulders and knees for temples"]}]},{when:"family",items:[{id:"kidsmeds",group:"health",name:["Thuốc hạ sốt, men tiêu hóa cho trẻ","Kids’ fever and digestion meds"]},{id:"kidsgear",group:"gear",name:["Đồ ăn vặt, bình nước, đồ chơi nhỏ cho trẻ","Snacks, water bottle and small toys for kids"]},{id:"wetwipes",group:"health",name:["Khăn ướt, khăn giấy","Wet wipes and tissues"]}]},{when:"elder",items:[{id:"regularmeds",group:"health",name:["Thuốc dùng hằng ngày (huyết áp, tiểu đường...) đủ cả chuyến","Daily medication (blood pressure, diabetes...) for the whole trip"]},{id:"softshoes",group:"clothes",name:["Giày đế êm, chống trơn","Soft, non-slip shoes"]}]},{when:"cave",items:[{id:"torch",group:"gear",name:["Đèn pin nhỏ","Small torch"]}]}]},COLD_MONTHS=[11,12,1,2,3],HOT_MONTHS=[4,5,6,7,8];function packingConditions(e,n){const a=new Set;return e.categories.includes("bien")&&a.add("beach"),(e.categories.includes("nui")||COOL_DESTINATIONS.includes(e.id))&&a.add("mountain"),e.categories.includes("di-san")&&a.add("heritage"),e.categories.includes("hang-dong")&&a.add("cave"),BOAT_DESTINATIONS.includes(e.id)&&a.add("boat"),MOTORBIKE_DESTINATIONS.includes(e.id)&&a.add("motorbike"),TREK_DESTINATIONS.includes(e.id)&&a.add("trek"),n&&((COOL_DESTINATIONS.includes(e.id)||e.region==="bac")&&COLD_MONTHS.includes(n)&&a.add("cold"),!COOL_DESTINATIONS.includes(e.id)&&HOT_MONTHS.includes(n)&&a.add("hot"),e.bestMonths.includes(n)||a.add("rain")),a}function packingList(e,n=[],{style:a=""}={}){const i=new Set,s=[],o=r=>{i.has(r.id)||(i.add(r.id),s.push(r))};return PACKING.base.forEach(o),e.forEach((r,c)=>{const l=packingConditions(r,n[c]||n[0]||0);(a==="family"||a==="elder")&&l.add(a),PACKING.rules.forEach(h=>{l.has(h.when)&&h.items.forEach(o)})}),Object.keys(PACKING_GROUPS).map(r=>({group:r,items:s.filter(c=>c.group===r)})).filter(r=>r.items.length)}const Favorites=(()=>{const e="viet-travel:favorites";function n(){try{const s=JSON.parse(localStorage.getItem(e)||"[]");return Array.isArray(s)?s:[]}catch{return[]}}function a(s){try{localStorage.setItem(e,JSON.stringify(s))}catch{}i=s,window.dispatchEvent(new CustomEvent("favorites:change",{detail:s}))}let i=n();return{all:()=>[...i],has:s=>i.includes(s),count:()=>i.length,toggle(s){return a(i.includes(s)?i.filter(o=>o!==s):[...i,s]),i.includes(s)}}})();function syncFavoriteButtons(e=document){e.querySelectorAll("[data-favorite]").forEach(n=>{const a=Favorites.has(n.dataset.favorite);n.classList.toggle("fav-btn--active",a),n.setAttribute("aria-pressed",a);const i=n.querySelector(".fav-btn__label");i&&(i.textContent=a?t("Đã lưu"):t("Lưu yêu thích")),n.title=a?t("Bỏ khỏi yêu thích"):t("Lưu vào yêu thích")})}document.addEventListener("click",e=>{const n=e.target.closest("[data-favorite]");if(!n)return;e.preventDefault();const a=Favorites.toggle(n.dataset.favorite);n.classList.add("fav-btn--pop"),setTimeout(()=>n.classList.remove("fav-btn--pop"),400),showToast(a?t("Đã lưu vào yêu thích"):t("Đã bỏ khỏi yêu thích"))}),window.addEventListener("favorites:change",()=>syncFavoriteButtons());function showToast(e){let n=document.getElementById("toast");n||(n=document.createElement("div"),n.id="toast",n.className="toast",n.setAttribute("role","status"),document.body.appendChild(n)),n.textContent=e,n.classList.add("toast--show"),clearTimeout(showToast.timer),showToast.timer=setTimeout(()=>n.classList.remove("toast--show"),1800)}const PLAN_MAX_STOPS=10,PLAN_MAX_DAYS=7;function planDefaultDays(e){const n=String(e.duration||"").match(/\d+/g)||["2"];return Math.min(3,Math.max(1,...n.map(Number)))}const TripPlan=(()=>{const e="viet-travel:plan",n=()=>({stops:[],month:0,start:"",tier:"saving",booked:{},origin:"",people:2,style:"",modes:{}});function a(){try{const s=JSON.parse(localStorage.getItem(e)||"null");return s&&Array.isArray(s.stops)?{...n(),...s}:n()}catch{return n()}}let i=a();return{get:()=>JSON.parse(JSON.stringify(i)),save(s){i=s;try{localStorage.setItem(e,JSON.stringify(s))}catch{}},has:s=>i.stops.some(o=>o.id===s),add(s){const o=getDestination(s);return!o||this.has(s)||i.stops.length>=PLAN_MAX_STOPS?!1:(this.save({...i,stops:[...i.stops,{id:s,days:planDefaultDays(o)}]}),!0)}}})();function syncPlanButtons(e=document){e.querySelectorAll("[data-plan-add]").forEach(n=>{const a=TripPlan.has(n.dataset.planAdd);n.classList.toggle("plan-btn--added",a);const i=n.querySelector(".plan-btn__label");i&&(i.textContent=a?t("Xem kế hoạch chuyến đi"):t("Thêm vào kế hoạch chuyến đi"))})}document.addEventListener("click",e=>{const n=e.target.closest("[data-plan-add]");if(!n)return;e.preventDefault();const a=n.dataset.planAdd;if(TripPlan.has(a)){location.href=plannerUrl();return}TripPlan.add(a)?showToast(t("Đã thêm {name} vào kế hoạch",{name:getDestination(a).name})):showToast(t("Kế hoạch tối đa {n} điểm đến",{n:PLAN_MAX_STOPS})),syncPlanButtons()});const destinationUrl=e=>`${SITE_ROOT}${LANG_PREFIX}diem-den/${encodeURIComponent(e)}/index.html`,plannerUrl=(e="")=>`${SITE_ROOT}${LANG_PREFIX}ke-hoach/index.html${e}`,homeUrl=(e="")=>`${SITE_ROOT}${LANG_PREFIX}index.html${e}`;applyTranslations();function formatVnd(e){const n=String(Math.round(e)).replace(/\B(?=(\d{3})+(?!\d))/g,LANG==="vi"?".":",");return LANG==="vi"?`${n}đ`:`${n} VND`}function favoriteButton(e,{withLabel:n=!1}={}){return`
        <button type="button" class="fav-btn${n?" fav-btn--labeled":""}" data-favorite="${e}" aria-pressed="false" title="${t("Lưu vào yêu thích")}">
            <i class="ri-heart-3-line fav-btn__off"></i><i class="ri-heart-3-fill fav-btn__on"></i>
            ${n?`<span class="fav-btn__label">${t("Lưu yêu thích")}</span>`:""}
        </button>
    `}function destinationCard(e,n="",a="ri-search-line"){return`
        <div class="dest-card-wrap">
            <a href="${destinationUrl(e.id)}" class="dest-card">
                <div class="dest-card__media">
                    <img data-wiki="${wikiAttr(heroCandidates(e))}" data-width="960" data-sizes="(max-width: 576px) calc(100vw - 32px), (max-width: 1024px) 46vw, 360px" alt="${e.name}" class="dest-card__img" loading="lazy">
                    <span class="dest-card__region">${REGIONS[e.region]}</span>
                    <span class="dest-card__rating"><i class="ri-star-fill"></i> ${e.rating.toFixed(1)}</span>
                </div>
                <div class="dest-card__body">
                    <h3 class="dest-card__title">${e.name}</h3>
                    <span class="dest-card__province"><i class="ri-map-pin-2-line"></i> ${e.province}</span>
                    ${n?`<span class="dest-card__hint"><i class="${a}"></i> ${n}</span>`:""}
                    <p class="dest-card__tagline">${e.tagline}</p>
                    <div class="dest-card__tags">
                        ${e.categories.map(i=>`<span class="tag">${CATEGORIES[i]}</span>`).join("")}
                    </div>
                </div>
                <span class="dest-card__button" aria-hidden="true"><i class="ri-arrow-right-line"></i></span>
            </a>
            ${favoriteButton(e.id)}
        </div>
    `}const pickLang=e=>Array.isArray(e)?e[LANG==="vi"?0:1]||e[0]:e,placesOf=e=>typeof PLACES<"u"&&PLACES[e]||null;function shortVnd(e){if(e>=1e6){const n=String(Math.round(e/1e5)/10);return LANG==="vi"?`${n.replace(".",",")}tr`:`${n}M`}return`${Math.round(e/1e3)}k`}const priceRange=([e,n])=>`${shortVnd(e)}–${shortVnd(n)}`,mapsSearchUrl=e=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e)}`,mapsDirectionsUrl=(e,n)=>`https://www.google.com/maps/dir/?api=1&origin=${e.lat},${e.lng}&destination=${n.lat},${n.lng}&travelmode=driving`;function addDays(e,n){const[a,i,s]=e.split("-").map(Number),o=new Date(a,i-1,s+n);return`${o.getFullYear()}-${String(o.getMonth()+1).padStart(2,"0")}-${String(o.getDate()).padStart(2,"0")}`}const DATE_FORMATS={vi:(e,n,a)=>`${a}/${n}/${e}`,en:(e,n,a)=>`${MONTHS_EN[n-1].slice(0,3)} ${a}, ${e}`,ko:(e,n,a)=>`${e}. ${n}. ${a}.`,zh:(e,n,a)=>`${e}年${n}月${a}日`,ja:(e,n,a)=>`${e}年${n}月${a}日`};function formatDate(e){const[n,a,i]=e.split("-").map(Number);return DATE_FORMATS[LANG](n,a,i)}function stayLinks(e,n="",a="",i=0,s=2){const o=a&&i?addDays(a,i):"",r=Math.max(1,s||2),c=new URLSearchParams({ss:`${e}, Vietnam`,group_adults:r,no_rooms:Math.ceil(r/2)}),l=new URLSearchParams({adults:r});return a&&(c.set("checkin",a),c.set("checkout",o),l.set("checkin",a),l.set("checkout",o)),[{label:"Booking.com",icon:"ri-hotel-line",url:`https://www.booking.com/searchresults.html?${c}`},{label:"Airbnb",icon:"ri-home-heart-line",url:`https://www.airbnb.com/s/${encodeURIComponent(`${e}, Vietnam`)}/homes?${l}`},{label:"Google Maps",icon:"ri-map-pin-line",url:mapsSearchUrl(`${n?`${n} `:""}hotel ${e}`)}]}const ROAD_FACTOR=1.3,COACH_FACTOR=1.25,FLIGHT_FROM_KM=450,FLIGHT_MIN_KM=200,AIRPORT_ISLANDS=["phu-quoc","con-dao"],MODES=["flight","train","road","boat"],MODE_ICONS={flight:"ri-plane-line",train:"ri-train-line",road:"ri-bus-2-line",boat:"ri-ship-line"},TRANSPORT_COST={road:{saving:900,comfort:2200,min:12e4},flight:{saving:13e5,comfort:28e5}},transportData=()=>typeof TRANSPORT<"u"&&TRANSPORT||{rail:{lines:[],fare:{}},ports:[],stations:{}},stationOf=e=>transportData().stations[e]||placesOf(e)||{},roundTo=(e,n)=>Math.round(e/n)*n,roadCost=(e,n)=>Math.max(TRANSPORT_COST.road.min,roundTo(e*TRANSPORT_COST.road[n],1e4));function roadRoute(e,n){const a=typeof ROUTES<"u"&&ROUTES,i=a&&e.id?a.ids.indexOf(e.id):-1,s=a&&n.id?a.ids.indexOf(n.id):-1;if(i>=0&&s>=0&&a.km[i][s]!=null)return{km:a.km[i][s],hours:a.hours[i][s]*COACH_FACTOR,measured:!0};const o=Math.round(distanceKm(e,n)*ROAD_FACTOR);return{km:o,hours:o/45,measured:!1}}function railRoute(e,n){const a=stationOf(e.id).rail,i=stationOf(n.id).rail;if(!a||!i||a===i)return null;const s=transportData().rail.lines.find(r=>a in r.stations&&i in r.stations);if(!s)return null;const o=Math.abs(s.stations[a]-s.stations[i]);return{km:o,hours:o/s.kmh,from:a,to:i}}function boatRoute(e,n){return transportData().ports.filter(i=>i.dest===n.id).map(i=>{const s=distanceKm(e,i)<15?{km:0,hours:0}:roadRoute(e,i);return{port:i,road:s,hours:s.hours+i.hours,km:s.km}}).sort((i,s)=>i.hours-s.hours)[0]||null}function transportOptions(e,n,a="saving"){const i=roadRoute(e,n),s=distanceKm(e,n),o=stationOf(e.id),r=stationOf(n.id),c=f=>AIRPORT_ISLANDS.includes(f)||transportData().ports.some(y=>y.dest===f),l=[e.id,n.id].filter(c),h=l[0],d=[],u=l.every(f=>AIRPORT_ISLANDS.includes(f));o.airport&&r.airport&&o.airport!==r.airport&&u&&(s>=FLIGHT_MIN_KM||h)&&d.push({mode:"flight",km:i.km,hours:roundTo(.5+s/750,1/6),cost:TRANSPORT_COST.flight[a]});const p=!h&&railRoute(e,n);if(p){const f=transportData().rail.fare;d.push({mode:"train",km:p.km,hours:roundTo(p.hours,.5),cost:Math.max(f.min,roundTo(p.km*f[a],1e4)),stations:[p.from,p.to]})}if(l.length===1){const f=h===e.id?n:e,y=boatRoute(f,getDestination(h));y&&d.push({mode:"boat",km:y.km,hours:roundTo(y.hours,.5),port:y.port,cost:(y.road.km?roadCost(y.road.km,a):0)+y.port.price[a==="comfort"?1:0],direct:y.road.km===0})}else l.length||d.push({mode:"road",km:i.km,hours:Math.max(1,roundTo(i.hours,.5)),cost:roadCost(i.km,a)});d.length||d.push({mode:"road",km:i.km,hours:Math.max(1,roundTo(i.hours,.5)),cost:roadCost(i.km,a)});const g=f=>d.find(y=>y.mode===f);let _;return h?_=g("boat")&&(g("boat").hours<=4||!g("flight"))?"boat":g("flight")?"flight":d[0].mode:i.km>=FLIGHT_FROM_KM?_=g("flight")?"flight":g("train")?"train":"road":_="road",{options:d,recommended:_,km:i.km}}function formatHours(e){const n=Math.round(e*60/10)*10;return n<60?t("{m} phút",{m:n}):n%60?t("{h} giờ {m} phút",{h:Math.floor(n/60),m:n%60}):t("{h} giờ",{h:n/60})}function modeLabel(e){const n=formatHours(e.hours);return e.mode==="flight"?t("Máy bay ~{time}",{time:n}):e.mode==="train"?t("Tàu hỏa ~{time}",{time:n}):e.mode==="boat"?e.direct?t("Tàu cao tốc ~{time}",{time:n}):t("Xe + tàu cao tốc ~{time}",{time:n}):t("Xe khách / ô tô ~{time}",{time:n})}function modeNote(e){return e.mode==="train"?t("Ga {from} → {to}",{from:e.stations[0],to:e.stations[1]}):e.mode==="boat"?t("Qua {port}",{port:pickLang(e.port.name)}):e.mode==="flight"?t("Chưa gồm thời gian ra sân bay"):""}const HUB_IDS=["ha-noi","da-nang","sai-gon"];function hubTransportTable(e){const n=HUB_IDS.filter(a=>a!==e.id&&getDestination(a)).map(a=>{const i=getDestination(a),{options:s,recommended:o}=transportOptions(i,e);return`
            <tr>
                <th scope="row">${t("Từ {name}",{name:i.name})}</th>
                <td>
                    <ul class="hub-modes">
                        ${MODES.map(r=>s.find(c=>c.mode===r)).filter(Boolean).map(r=>`
                            <li class="hub-modes__item${r.mode===o?" hub-modes__item--best":""}" title="${modeNote(r)}">
                                <i class="${MODE_ICONS[r.mode]}"></i> ${modeLabel(r)} <span>· ${formatVnd(r.cost)}</span>
                            </li>
                        `).join("")}
                    </ul>
                </td>
            </tr>
        `});return n.length?`
        <div class="hub-transport">
            <h4 class="hub-transport__title">${t("Đi từ các thành phố lớn")}</h4>
            <table class="hub-transport__table">${n.join("")}</table>
            <p class="budget__note">${t("Thời gian ước tính lúc di chuyển, giá một chiều / người mức tiết kiệm – tham khảo. Phương án in đậm là gợi ý.")}</p>
        </div>
    `:""}function transportLinks(e,n,a,i=""){const s=stationOf(e.id),o=stationOf(n.id),r=[];s.airport&&o.airport&&s.airport!==o.airport&&(a==="flight"||distanceKm(e,n)>=FLIGHT_MIN_KM)&&r.push({mode:"flight",label:t("Vé máy bay"),icon:MODE_ICONS.flight,url:`https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights from ${s.airport} to ${o.airport}${i?` on ${i}`:""}`)}`});const c=railRoute(e,n);return c&&r.push({mode:"train",label:t("Vé tàu {from} – {to}",{from:c.from,to:c.to}),icon:MODE_ICONS.train,url:"https://dsvn.vn/"}),a==="boat"&&r.push({mode:"boat",label:t("Vé tàu cao tốc"),icon:MODE_ICONS.boat,url:"https://vexere.com/"}),r.push({mode:"road",label:t("Vé xe khách / limousine"),icon:MODE_ICONS.road,url:"https://vexere.com/"}),r.push({label:t("Chỉ đường"),icon:"ri-route-line",url:mapsDirectionsUrl(e,n)}),[...r.filter(l=>l.mode===a),...r.filter(l=>l.mode!==a)]}const linkButtons=e=>e.map(n=>`
    <a href="${n.url}" target="_blank" rel="noopener" class="book-link"><i class="${n.icon}"></i> ${n.label}</a>
`).join(""),COST_TIERS={saving:{stay:1,food:1,transport:6e4,fee:0},comfort:{stay:2.5,food:1.8,transport:15e4,fee:1}},round10k=e=>Math.round(e/1e4)*1e4;function tierStay(e,n){const a=placesOf(e);if(!a)return null;const i=[...a.stays].sort((r,c)=>r.price[0]-c.price[0]);if(n!=="comfort")return i[0];const s=i[0].price[0]*COST_TIERS.comfort.stay,o=r=>(r.price[0]+r.price[1])/2;return i.reduce((r,c)=>Math.abs(o(c)-s)<Math.abs(o(r)-s)?c:r)}function dailyCosts(e,n){const a=placesOf(e),i=typeof ITINERARIES<"u"&&ITINERARIES[e];if(!a||!i)return null;const s=COST_TIERS[n]||COST_TIERS.saving,o=[...a.stays].sort((l,h)=>l.price[0]-h.price[0])[0],r=a.eats.reduce((l,h)=>l+h.price[0],0)/a.eats.length,c=round10k(Math.min(3e5,Math.max(15e4,4e4+2*r)));return{stay:round10k(o.price[0]/2*s.stay),food:round10k(c*s.food),transport:s.transport,fees:i.fees[s.fee]}}function tripCost(e,n,a,i=Math.max(1,n-1)){const s=dailyCosts(e,a);if(!s)return{total:0,items:[]};const o=placesOf(e),r=tierStay(e,a),c=o.eats.slice(0,2).map(d=>d.name).join(", "),l=a==="comfort",h=[{key:"stay",icon:"ri-hotel-bed-line",label:t("Lưu trú"),count:i,unit:t("đêm"),per:s.stay,note:l?t("Khách sạn 3–4 sao, phòng đôi chia 2 người"):t("{type} {area} ({price}/phòng), chia 2 người",{type:pickLang(STAY_TYPES[r.type]),area:pickLang(r.area),price:priceRange(r.price)})},{key:"food",icon:"ri-restaurant-line",label:t("Ăn uống"),count:n,unit:t("ngày"),per:s.food,note:l?t("Nhà hàng tầm trung, đặc sản và hải sản"):t("Ăn sáng bình dân, quán địa phương như {eats}",{eats:c})},{key:"transport",icon:"ri-motorbike-line",label:t("Đi lại tại chỗ"),count:n,unit:t("ngày"),per:s.transport,note:l?t("Grab, taxi hoặc xe riêng quãng ngắn"):t("Thuê xe máy hoặc xe buýt, chia 2 người")},{key:"fees",icon:"ri-ticket-2-line",label:t("Vé tham quan & trải nghiệm"),count:n,unit:t("ngày"),per:s.fees,note:l?t("Theo lịch trình, thêm tour/show có hướng dẫn"):t("Vé vào cổng, thuyền, cáp treo theo lịch trình")}].map(d=>({...d,amount:d.per*d.count}));return{total:h.reduce((d,u)=>d+u.amount,0),items:h}}function costBreakdownHtml(e){return`
        <ul class="cost-list">
            ${e.items.map(n=>`
                <li class="cost-item">
                    <span class="cost-item__icon"><i class="${n.icon}"></i></span>
                    <div class="cost-item__text">
                        <strong>${n.label}</strong>
                        <small>${n.note}</small>
                    </div>
                    <div class="cost-item__amount">
                        <strong>${formatVnd(n.amount)}</strong>
                        <small>${n.count} ${n.unit} × ${formatVnd(n.per)}</small>
                    </div>
                </li>
            `).join("")}
        </ul>
    `}const NIGHT_SPOT=/chợ đêm|night|ăn đêm|nướng|bè|bbq|carnival/i,BIG_MEAL=/nhà hàng|hải sản|lẩu|dê|vịt|gà|bò bảy/i,SNACK_SPOT=/cà phê|coffee|chè|hạt bàng|sữa|bánh bông lan|dãy mắm|bảo tàng|trái cây|bánh ít|bánh bò/i,BREAKFAST_DISH=/phở|bánh mì|bún|cháo|xôi|bánh cuốn|hủ tiếu|bánh căn|bánh canh|mì|bánh đa|bánh khọt|cơm tấm|bánh bèo/i,MEAL_IN_TEXT={breakfast:/ăn sáng|bữa sáng|breakfast/i,lunch:/ăn trưa|bữa trưa|lunch/i,dinner:/(^|[\s,])(ăn|thưởng thức|nếm)\s|ăn tối|bữa tối|food tour|dinner|\beat\b|\btry\b|seafood|bbq/i},STREET_DRINKS={bac:[["Trà đá vỉa hè và hướng dương","Street iced tea with sunflower seeds"],["Cà phê trứng hoặc cà phê cốt dừa","Egg coffee or coconut coffee"],["Chè, kem que vỉa hè","Sweet soups and street ice-cream sticks"],["Nước mía, sữa chua mít","Sugarcane juice or jackfruit yogurt"],["Trà nóng và bánh ngô nướng","Hot tea with grilled corn cakes"]],trung:[["Cà phê muối","Salted coffee"],["Nước mía, nước sâm mát lạnh","Chilled sugarcane juice or herbal drink"],["Chè đậu, chè bột lọc","Bean and tapioca sweet soups"],["Nước dừa tươi","Fresh coconut water"],["Sinh tố, nước ép trái cây","Fruit smoothies and juices"]],nam:[["Cà phê sữa đá vỉa hè","Street-side iced milk coffee"],["Nước dừa tươi","Fresh coconut water"],["Nước mía, sâm bổ lượng","Sugarcane juice or sam bo luong"],["Chè, tàu hũ nước đường","Sweet soups and tofu in ginger syrup"],["Sinh tố bơ, xoài","Avocado or mango smoothies"]]};function specialtyPlaces(e){return(e.foods||[]).map(n=>({name:n.name,dish:n.desc,address:t("Quán địa phương ở {name}",{name:e.name}),priceText:n.price,search:`${n.name} ${placesOf(e.id)?.city||e.name}`,specialty:!0}))}const GENERIC_MEALS={breakfast:[()=>t("Ăn sáng tại nơi ở (thường đã gồm trong giá phòng)"),()=>t("Ăn sáng quán bình dân đông người địa phương gần nơi ở"),()=>t("Mang theo bánh mì, xôi nếu khởi hành sớm")],lunch:[()=>t("Ăn trưa ngay tại khu tham quan buổi sáng – nhiều quán gần bến, cổng"),()=>t("Cơm trưa bình dân gần điểm tham quan"),()=>t("Ăn trưa nhẹ, mang theo nước và đồ ăn nếu đi xa")],dinner:[()=>t("Dạo chợ đêm hoặc phố ẩm thực để chọn món ăn tối"),()=>t("Ăn tối gần nơi ở – chọn quán đông khách địa phương"),()=>t("Ăn tối tự chọn: thử lại món bạn thích nhất")]},genericMeal=(e,n)=>GENERIC_MEALS[e][n%GENERIC_MEALS[e].length]();function sightsOf(e,n,a){const i=typeof SIGHTS<"u"&&SIGHTS[e],s=i&&i[n]||[];return a?s.filter(o=>o.at===a):s}function sightCafes(e,n,a){const i=placesOf(e)?.city||getDestination(e)?.name||"";return a.flatMap(s=>sightsOf(e,n,s)).filter(s=>s.cafe).map(s=>({...s.cafe,address:t("Gần {place}",{place:pickLang(s.name)}),search:`${s.cafe.name} ${i}`,nearAt:s.at}))}function sightPriceText(e){if(e==null)return"";if(!Array.isArray(e))return e?formatVnd(e):t("Miễn phí");const[n,a]=e;return a?n?`${formatVnd(n)} – ${formatVnd(a)}`:t("Miễn phí – {max}",{max:formatVnd(a)}):t("Miễn phí")}const priceBounds=e=>Array.isArray(e)?e:[e||0,e||0],sightHours=e=>e==="all"?t("Mở cả ngày"):pickLang(e),mealPlanCache={};function mealPlan(e,n){const a=mealPlanCache[e];if(a&&a.length>=n)return a;const i=getDestination(e),s=placesOf(e)||{},o=typeof ITINERARIES<"u"&&ITINERARIES[e]||{days:[]},r=s.eats||[],c=r.filter(m=>!SNACK_SPOT.test(m.name)),l=r.filter(m=>SNACK_SPOT.test(m.name)),h=i?specialtyPlaces(i).filter(m=>!SNACK_SPOT.test(m.name)):[],d=s.cafes||[],u=STREET_DRINKS[i?.region]||STREET_DRINKS.nam,p=m=>m.toLowerCase().normalize("NFC"),g=[],_=m=>g.some(b=>b.includes(p(m.name))||p(m.name).includes(b)),f=p(o.days.map(m=>[m.morning,m.afternoon,m.evening].join(" ")).join(" ")),y=(i?specialtyPlaces(i):[]).map(m=>p(m.name)),S=m=>f.includes(p(m.name))||y.some(b=>p(m.name).includes(b)&&f.includes(b)),k=(...m)=>{for(const b of m){const w=b.find(v=>!_(v)&&!S(v));if(w)return g.push(p(w.name)),w}return null},T=[];for(let m=0;m<Math.max(n,5);m++){const b=o.days[m]||null,w=($,...E)=>!!b&&E.some(A=>MEAL_IN_TEXT[$].test(b[A]||"")),v={};w("breakfast","morning")||(v.breakfast=k(c.filter($=>$.price[0]<=5e4&&!NIGHT_SPOT.test($.name)&&!BIG_MEAL.test($.name)),h.filter($=>BREAKFAST_DISH.test($.name)))),w("lunch","morning","afternoon")||(v.lunch=k(c.filter($=>!NIGHT_SPOT.test($.name)),h,c)),v.dinnerInEvening=w("dinner","evening"),v.dinnerInEvening||(v.dinner=k(c.filter($=>NIGHT_SPOT.test($.name)||BIG_MEAL.test($.name)),c,h)),v.cafe=k(sightCafes(e,m,["m"]),sightCafes(e,m,["a"]),d),v.snack=k(sightCafes(e,m,["a","e"]),l,d),v.drink=u[m%u.length],T.push(v)}return mealPlanCache[e]=T,T}function dayTimeline(e,n,a,{arrival:i=null,last:s=!1}={}){const o=mealPlan(e,n+1)[n],r=[],c=(f,y,S,k,T,m=null,b=[])=>{(T||m)&&r.push({time:f,icon:y,kind:S,title:k,text:T,place:m,sights:b})},l=getDestination(e)?.name||"",h=f=>a?sightsOf(e,n,f).map(y=>({...y,dest:l})):[],d=!!a&&!i,u="breakfast"in o||!d,p="lunch"in o||!d,g=d&&o.dinnerInEvening;u&&c("06:30","ri-sun-foggy-line","meal",t("Ăn sáng"),o.breakfast?"":genericMeal("breakfast",n),o.breakfast),i?c("07:30","ri-route-line","travel",t("Di chuyển"),i.text):a&&c("07:30","ri-map-pin-line","visit",t("Tham quan buổi sáng"),a.morning,null,h("m")),p&&c("11:30","ri-restaurant-line","meal",t("Ăn trưa"),o.lunch?"":genericMeal("lunch",n),o.lunch);const _=i&&o.cafe?.nearAt==="m"?null:o.cafe;return _?c("13:00","ri-cup-line","cafe",t("Cà phê & nghỉ trưa"),"",_):c("13:00","ri-hotel-bed-line","rest",t("Nghỉ trưa"),t("Về nơi ở nghỉ ngơi, tránh nắng giữa trưa")),a?c("14:30","ri-camera-line","visit",t("Tham quan buổi chiều"),a.afternoon,null,h("a")):c("14:30","ri-compass-3-line","visit",t("Buổi chiều tự do"),t("Ngày tự do: nghỉ ngơi, khám phá theo sở thích hoặc đi thêm các điểm lân cận.")),c("16:30","ri-goblet-line","drink",t("Quán nước, ăn vặt"),o.snack?"":pickLang(o.drink),o.snack),g||c("18:00","ri-restaurant-2-line","meal",t("Ăn tối"),o.dinner?"":genericMeal("dinner",n),o.dinner),a&&c(g?"18:00":"19:30","ri-moon-clear-line","visit",g?t("Ăn tối & buổi tối"):t("Buổi tối"),a.evening,null,h("e")),s?c("21:00","ri-luggage-cart-line","rest",t("Kết thúc tour"),t("Kết thúc tour: trả phòng, mua đặc sản và di chuyển về.")):c("21:30","ri-hotel-bed-line","rest",t("Về nghỉ"),t("Dạo phố đêm một chút rồi về nơi ở nghỉ ngơi")),r}function timelinePlaceHtml(e){const n=pickLang(e.dish||e.drink),a=e.price?priceRange(e.price):e.priceText,i=e.search||`${e.name}, ${e.address}`;return`
        <a href="${mapsSearchUrl(i)}" target="_blank" rel="noopener" class="day-tl__place">${e.specialty?`${t("Món đặc sản")}: `:""}${e.name}</a>
        <span class="day-tl__what">${n}</span>
        <small class="day-tl__meta"><i class="ri-map-pin-2-line"></i> ${e.address}${a?` · ${a}`:""}</small>
    `}function activityTextHtml(e){const n=e.kind==="visit"&&!e.sights?.length?e.text.split(/,\s+/).map(i=>i.trim()).filter(Boolean):[];if(n.length<2)return`<p class="day-tl__text">${e.text}</p>`;const a=i=>i.charAt(0).toLocaleUpperCase(LANG)+i.slice(1);return`<ul class="day-tl__list">${n.map(i=>`<li>${a(i.replace(/\.$/,""))}</li>`).join("")}</ul>`}function sightHtml(e,{id:n=""}={}){const a=pickLang(e.name),i=Array.isArray(e.price)?!e.price[1]:e.price===0;return`
        <li class="sight"${n?` id="${n}"`:""}>
            <div class="sight__head">
                <a href="${mapsSearchUrl(`${e.name[0]}, ${e.address}`)}" target="_blank" rel="noopener" class="sight__name">${a}</a>
                <span class="sight__price${i?" sight__price--free":""}"><i class="ri-ticket-2-line"></i> ${sightPriceText(e.price)}</span>
            </div>
            <small class="sight__meta">
                <span><i class="ri-time-line"></i> ${sightHours(e.hours)}</span>
                <span><i class="ri-map-pin-2-line"></i> ${e.address}</span>
                ${e.updated?`<span title="${t("Tháng thông tin được cập nhật hoặc kiểm tra lại gần nhất")}"><i class="ri-refresh-line"></i> ${updatedText(e.updated)}</span>`:""}
            </small>
            ${e.note?`<small class="sight__note"><i class="ri-information-line"></i> ${pickLang(e.note)}</small>`:""}
            ${e.dest?reportLinkHtml({dest:e.dest,item:e.name[0],details:`${sightPriceText(e.price)} · ${sightHours(e.hours)} · ${e.address}`}):""}
        </li>
    `}const updatedText=e=>t("Cập nhật {m}/{y}",{m:e.slice(5,7),y:e.slice(0,4)});function dayCost(e){const n=a=>a.reduce(([i,s],[o,r])=>[i+o,s+r],[0,0]);return{tickets:n(e.flatMap(a=>a.sights||[]).map(a=>priceBounds(a.price))),food:n(e.filter(a=>a.place&&Array.isArray(a.place.price)).map(a=>a.place.price))}}function dayCostHtml(e){const{tickets:n,food:a}=dayCost(e),i=([s,o])=>o?s===o?formatVnd(s):`${formatVnd(s)} – ${formatVnd(o)}`:t("Miễn phí");return!n[1]&&!a[1]&&!e.some(s=>s.sights?.length)?"":`
        <div class="day-cost">
            <span class="day-cost__label"><i class="ri-wallet-3-line"></i> ${t("Ước tính mỗi người hôm nay")}</span>
            <span class="day-cost__item">${t("Vé tham quan")}: <strong>${i(n)}</strong></span>
            ${a[1]?`<span class="day-cost__item">${t("Ăn uống, cà phê")}: <strong>${i(a)}</strong></span>`:""}
        </div>
    `}function dayTimelineHtml(e){return`
        ${dayCostHtml(e)}
        <ol class="day-tl">
            ${e.map(n=>`
                <li class="day-tl__item day-tl__item--${n.kind}"${n.end?` data-end="${n.end}"`:""}${n.hidden?" hidden":""}>
                    <time class="day-tl__time">${n.time}</time>
                    <span class="day-tl__icon"><i class="${n.icon}"></i></span>
                    <div class="day-tl__body">
                        <h4 class="day-tl__title">${n.title}</h4>
                        ${n.text?activityTextHtml(n):""}
                        ${n.sights?.length?`<ul class="day-tl__sights">${n.sights.map(sightHtml).join("")}</ul>`:""}
                        ${n.place?timelinePlaceHtml(n.place):""}
                    </div>
                </li>
            `).join("")}
        </ol>
    `}function eventWhenText(e){if(e.dates){const i=s=>`${s.slice(3)}/${s.slice(0,2)}`;return`${i(e.dates[0])} – ${i(e.dates[1])}`}if(e.months.length===12)return t("Hằng tháng");const n=e.months,a=n.length===1?monthLabel(n[0]):`${monthLabel(n[0])} – ${monthLabel(n[n.length-1])}`;return t("Tháng {m}",{m:a})}function eventCardHtml(e,{destName:n=""}={}){const a=EVENT_TYPES[e.type];return`
        <li class="event event--${e.type}" data-event-months="${eventMonths(e).join(",")}">
            <span class="event__icon" title="${pickLang(a.label)}"><i class="${a.icon}"></i></span>
            <div class="event__body">
                <div class="event__head">
                    <strong class="event__name">${pickLang(e.name)}${n?` <small>· ${n}</small>`:""}</strong>
                    <span class="event__when">${eventWhenText(e)}${e.lunar?` · ${t("âm lịch")}`:""}</span>
                </div>
                <p class="event__desc">${pickLang(e.desc)}</p>
                <p class="event__tip"><i class="ri-lightbulb-line"></i> ${pickLang(e.tip)}</p>
            </div>
        </li>
    `}const PACKING_STORE="viet-travel:packing";function packingState(e){try{return JSON.parse(localStorage.getItem(`${PACKING_STORE}:${e}`)||"{}")}catch{return{}}}function packingHtml(e,n){const a=packingState(n),i=e.reduce((o,r)=>o+r.items.length,0),s=e.reduce((o,r)=>o+r.items.filter(c=>a[c.id]).length,0);return`
        <div class="packing" data-packing-key="${n}">
            <p class="packing__progress"><span data-packing-count>${s}</span>/${i} ${t("món đã chuẩn bị")}</p>
            <div class="packing__groups">
                ${e.map(o=>`
                    <div class="packing__group">
                        <h4 class="packing__title"><i class="${PACKING_GROUPS[o.group].icon}"></i> ${pickLang(PACKING_GROUPS[o.group].label)}</h4>
                        <ul class="packing__list">
                            ${o.items.map(r=>`
                                <li><label class="packing__item">
                                    <input type="checkbox" data-pack-item="${r.id}"${a[r.id]?" checked":""}>
                                    <span>${pickLang(r.name)}</span>
                                </label></li>
                            `).join("")}
                        </ul>
                    </div>
                `).join("")}
            </div>
        </div>
    `}typeof document<"u"&&typeof document.addEventListener=="function"&&document.addEventListener("change",e=>{const n=e.target.closest&&e.target.closest("[data-pack-item]");if(!n)return;const a=n.closest("[data-packing-key]"),i=a.dataset.packingKey,s=packingState(i);n.checked?s[n.dataset.packItem]=!0:delete s[n.dataset.packItem];try{localStorage.setItem(`${PACKING_STORE}:${i}`,JSON.stringify(s))}catch{}a.querySelector("[data-packing-count]").textContent=a.querySelectorAll("[data-pack-item]:checked").length});const ISSUES_URL="https://github.com/TanTan1802/travel/issues/new";function reportUrl({dest:e="",item:n="",details:a="",correction:i="",source:s="",page:o=""}={}){const r=`[Sửa thông tin] ${[e,n].filter(Boolean).join(" – ")}`,c=[`**Điểm đến:** ${e||"-"}`,`**Mục cần sửa:** ${n||"-"}`,...a?[`**Thông tin hiện tại:** ${a}`]:[],...o?[`**Trang:** ${o}`]:[],"","**Thông tin đúng / góp ý:**",i,"","**Nguồn (link, ảnh chụp bảng giá...):**",s].join(`
`);return`${ISSUES_URL}?${new URLSearchParams({title:r,body:c,labels:"sua-thong-tin"})}`}function reportLinkHtml(e,{label:n=!0}={}){const a=i=>String(i||"").replace(/&/g,"&amp;").replace(/"/g,"&quot;");return`<a href="${reportUrl(e)}" target="_blank" rel="noopener" class="report-link" title="${t("Báo sai thông tin")}"
        data-report-dest="${a(e.dest)}" data-report-item="${a(e.item)}" data-report-details="${a(e.details)}"><i class="ri-flag-line"></i>${n?` ${t("Báo sai")}`:""}</a>`}async function copyText(e,n){try{await navigator.clipboard.writeText(e),showToast(n)}catch{window.prompt(t("Sao chép liên kết này:"),e)}}async function shareLink({title:e,text:n="",url:a}){if(navigator.share)try{await navigator.share({title:e,text:n,url:a});return}catch(i){if(i&&i.name==="AbortError")return}copyText(a,t("Đã sao chép liên kết"))}typeof window.addEventListener=="function"&&window.addEventListener("beforeprint",()=>{document.querySelectorAll("details.eats__more").forEach(e=>{e.open=!0}),document.querySelectorAll(".print-url").forEach(e=>{e.textContent=location.href.split("#")[0]})});const TRIP_TZ="Asia/Ho_Chi_Minh",ICS_PRODID="-//Viet Travel//Lich trinh du lich Viet Nam//VI",MAPS_MAX_WAYPOINTS=8,pad2=e=>String(e).padStart(2,"0"),isoToCompact=e=>e.replace(/-/g,"");function localStamp(e,n,a=0){const[i,s]=n.split(":").map(Number),o=i*60+s+a,r=addDays(e,Math.floor(o/1440)),c=(o%1440+1440)%1440;return`${isoToCompact(r)}T${pad2(Math.floor(c/60))}${pad2(c%60)}00`}const minutesOf=e=>{const[n,a]=e.split(":").map(Number);return n*60+a};function utcStamp(e=new Date){return`${e.getUTCFullYear()}${pad2(e.getUTCMonth()+1)}${pad2(e.getUTCDate())}T${pad2(e.getUTCHours())}${pad2(e.getUTCMinutes())}${pad2(e.getUTCSeconds())}Z`}function timelineEntryText(e){const n=[];if(e.text&&n.push(e.text),e.place){const a=e.place.price?priceRange(e.place.price):e.place.priceText;n.push(`${e.place.name} – ${pickLang(e.place.dish||e.place.drink)}`),n.push(`${e.place.address}${a?` · ${a}`:""}`)}return(e.sights||[]).forEach(a=>{n.push(`• ${pickLang(a.name)}: ${sightPriceText(a.price)} · ${sightHours(a.hours)} · ${a.address}`)}),n.join(`
`)}function timelineEntryLocation(e,n){return e.place?`${e.place.name}, ${e.place.address}`:e.sights&&e.sights.length?`${e.sights[0].name[0]}, ${e.sights[0].address}`:n}function timelineToEvents(e,{date:n,destName:a,dayLabel:i}){return e.map((s,o)=>{const r=e[o+1],c=r?Math.max(30,minutesOf(r.time)-minutesOf(s.time)):30;return{start:localStamp(n,s.time),end:localStamp(n,s.time,c),summary:`${s.title} – ${a}`,description:`${i}
${timelineEntryText(s)}`.trim(),location:timelineEntryLocation(s,a)}})}const icsText=e=>String(e).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");function foldIcsLine(e){const n=o=>new TextEncoder().encode(o).length,a=[];let i="",s=0;for(const o of e){const r=n(o),c=a.length?74:75;s+r>c&&(a.push(i),i="",s=0),i+=o,s+=r}return a.push(i),a.join(`\r
 `)}function shortHash(e){let n=5381;for(const a of e)n=(n*33^a.codePointAt(0))>>>0;return n.toString(36)}function buildIcs({name:e,events:n,now:a=new Date}){const i=utcStamp(a),s=shortHash(`${e}|${n.map(r=>r.start).join(",")}`),o=["BEGIN:VCALENDAR","VERSION:2.0",`PRODID:${ICS_PRODID}`,"CALSCALE:GREGORIAN","METHOD:PUBLISH",`X-WR-CALNAME:${icsText(e)}`,`X-WR-TIMEZONE:${TRIP_TZ}`,"BEGIN:VTIMEZONE",`TZID:${TRIP_TZ}`,"BEGIN:STANDARD","DTSTART:19700101T000000","TZOFFSETFROM:+0700","TZOFFSETTO:+0700","TZNAME:+07","END:STANDARD","END:VTIMEZONE"];return n.forEach((r,c)=>{o.push("BEGIN:VEVENT",`UID:${s}-${c}@viet-travel`,`DTSTAMP:${i}`,`DTSTART;TZID=${TRIP_TZ}:${r.start}`,`DTEND;TZID=${TRIP_TZ}:${r.end}`,`SUMMARY:${icsText(r.summary)}`,...r.description?[`DESCRIPTION:${icsText(r.description)}`]:[],...r.location?[`LOCATION:${icsText(r.location)}`]:[],...r.url?[`URL:${r.url}`]:[],"END:VEVENT")}),o.push("END:VCALENDAR"),o.map(foldIcsLine).join(`\r
`)+`\r
`}function safeFileName(e){return e.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"lich-trinh"}function downloadTextFile(e,n,a="text/calendar;charset=utf-8"){const i=URL.createObjectURL(new Blob([n],{type:a})),s=document.createElement("a");s.href=i,s.download=e,document.body.appendChild(s),s.click(),s.remove(),setTimeout(()=>URL.revokeObjectURL(i),1e3)}const GCAL_DETAILS_MAX=1500;function googleCalendarDayUrl({title:e,date:n,details:a="",location:i=""}){const s=a.length>GCAL_DETAILS_MAX?`${a.slice(0,GCAL_DETAILS_MAX-1)}…`:a;return`https://calendar.google.com/calendar/render?${new URLSearchParams({action:"TEMPLATE",text:e,dates:`${isoToCompact(n)}/${isoToCompact(addDays(n,1))}`,details:s,location:i,ctz:TRIP_TZ})}`}function dayDetailsText(e){return e.map(n=>{const a=n.place?`${n.place.name} (${n.place.address})`:n.text,i=(n.sights||[]).map(s=>pickLang(s.name)).join(", ");return`${n.time} ${n.title}: ${a}${i?` – ${i}`:""}`}).join(`
`)}function mapsDirectionsUrlFor(e,n=""){if(!e.length)return"";if(e.length===1)return mapsSearchUrl(e[0]);const a=e.length>MAPS_MAX_WAYPOINTS+2?[e[0],...e.slice(1,MAPS_MAX_WAYPOINTS+1),e[e.length-1]]:e,i=new URLSearchParams({api:"1",origin:a[0],destination:a[a.length-1]});return a.length>2&&i.set("waypoints",a.slice(1,-1).join("|")),n&&i.set("travelmode",n),`https://www.google.com/maps/dir/?${i}`}function dayRouteUrl(e,n,{skipMorning:a=!1}={}){const i=sightsOf(e,n).filter(s=>!(a&&s.at==="m")).map(s=>`${s.name[0]}, ${s.address}`);return mapsDirectionsUrlFor([...new Set(i)])}function tripRouteUrl(e){return mapsDirectionsUrlFor(e.map(n=>`${n.lat},${n.lng}`),"driving")}const SITE_CONFIG={newsletterEndpoint:"",reportEndpoint:"",assistantEndpoint:"",giscus:{repo:"TanTan1802/travel",repoId:"",category:"Announcements",categoryId:""}},giscusEnabled=()=>{const e=typeof SITE_CONFIG<"u"&&SITE_CONFIG.giscus;return!!(e&&e.repo&&e.repoId&&e.category&&e.categoryId)};function reportDialog(){let e=document.getElementById("report-dialog");return e||(e=document.createElement("dialog"),e.id="report-dialog",e.className="quiz report-dialog",e.setAttribute("aria-labelledby","report-heading"),e.innerHTML=`
        <form method="dialog" class="report-form" novalidate>
            <div class="quiz__header">
                <strong id="report-heading"><i class="ri-flag-line"></i> ${t("Báo sai thông tin")}</strong>
                <button type="button" class="quiz__close" data-report-close aria-label="${t("Đóng")}"><i class="ri-close-line"></i></button>
            </div>
            <div class="quiz__body">
                <p class="report-form__item"><strong data-report-field="item"></strong><small data-report-field="details"></small></p>
                <label class="report-form__label" for="report-correction">${t("Thông tin đúng / góp ý")} *</label>
                <textarea id="report-correction" name="correction" rows="4" required class="report-form__input"
                    placeholder="${t("Vd: giá vé đã tăng lên 250.000đ từ tháng 6, quán đã chuyển sang địa chỉ...")}"></textarea>
                <label class="report-form__label" for="report-source">${t("Nguồn (không bắt buộc)")}</label>
                <input id="report-source" name="source" class="report-form__input" placeholder="${t("Link trang chính thức, thời điểm bạn ghé...")}">
                <label class="report-form__label" for="report-email">${t("Email để nhận phản hồi (không bắt buộc)")}</label>
                <input id="report-email" name="email" type="email" class="report-form__input" autocomplete="email">
                <p class="report-form__status" role="status"></p>
                <button type="submit" class="button button--flex report-form__submit"><i class="ri-send-plane-line"></i> ${t("Gửi báo cáo")}</button>
            </div>
        </form>
    `,document.body.appendChild(e),e.querySelector("[data-report-close]").addEventListener("click",()=>e.close()),e.addEventListener("click",n=>{n.target===e&&e.close()}),e.querySelector("form").addEventListener("submit",n=>{n.preventDefault(),submitReport(e)}),e)}function openReport(e){const n=reportDialog();n.report=e,n.querySelector('[data-report-field="item"]').textContent=[e.dest,e.item].filter(Boolean).join(" – "),n.querySelector('[data-report-field="details"]').textContent=e.details?` · ${e.details}`:"",n.querySelector("form").reset(),n.querySelector(".report-form__status").textContent="",n.showModal(),n.querySelector("#report-correction").focus()}async function submitReport(e){const n=e.querySelector("form"),a=e.querySelector(".report-form__status"),i=n.correction.value.trim();if(!i){a.textContent=t("Hãy cho biết thông tin đúng hoặc góp ý của bạn."),n.correction.focus();return}if(n.email.value&&!n.email.checkValidity()){a.textContent=t("Vui lòng nhập địa chỉ email hợp lệ."),n.email.focus();return}const s={...e.report,correction:i,source:n.source.value.trim(),page:location.href.split("#")[0]},o=typeof SITE_CONFIG<"u"&&SITE_CONFIG.reportEndpoint;if(!o){window.open(reportUrl(s),"_blank","noopener"),e.close(),showToast(t("Đã mở GitHub để gửi báo cáo – cảm ơn bạn!"));return}const r=n.querySelector('button[type="submit"]');r.disabled=!0,a.textContent=t("Đang gửi...");try{const c=await fetch(o,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({_subject:`[Sửa thông tin] ${s.dest} – ${s.item}`,...s,email:n.email.value.trim()})});if(!c.ok)throw new Error(`HTTP ${c.status}`);e.close(),showToast(t("Đã gửi – cảm ơn bạn đã giúp thông tin chính xác hơn!"))}catch{a.textContent=t("Chưa gửi được, vui lòng thử lại sau.")}finally{r.disabled=!1}}document.addEventListener("click",e=>{const n=e.target.closest(".report-link[data-report-item]");!n||typeof HTMLDialogElement>"u"||(e.preventDefault(),openReport({dest:n.dataset.reportDest,item:n.dataset.reportItem,details:n.dataset.reportDetails}))});const assistant={endpoint:"",history:[]},escapeText=e=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");function assistantHtml(e){return escapeText(e).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>").replace(/(https?:\/\/[^\s)<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g,"<br>")}function assistantMessage(e,n){const a=document.getElementById("assistant-log"),i=document.createElement("div");return i.className=`assistant__msg assistant__msg--${e}`,i.innerHTML=n,a.appendChild(i),a.scrollTop=a.scrollHeight,i}function buildAssistant(){const e=document.createElement("button");e.type="button",e.className="assistant__fab",e.id="assistant-open",e.innerHTML=`<i class="ri-chat-smile-3-line"></i> <span>${t("Hỏi Việt Travel")}</span>`;const n=document.createElement("dialog");n.className="quiz assistant",n.id="assistant",n.setAttribute("aria-labelledby","assistant-heading"),n.innerHTML=`
        <div class="quiz__header">
            <strong id="assistant-heading"><i class="ri-chat-smile-3-line"></i> ${t("Hỏi Việt Travel")}</strong>
            <button type="button" class="quiz__close" data-assistant-close aria-label="${t("Đóng")}"><i class="ri-close-line"></i></button>
        </div>
        <div class="assistant__log" id="assistant-log" aria-live="polite">
            <div class="assistant__msg assistant__msg--assistant">${t('Xin chào! Hỏi mình về điểm đến, thời điểm đẹp, lịch trình, giá vé hay chi phí nhé. Ví dụ: "Đi Đà Lạt 3 ngày tháng 12 hết bao nhiêu?"')}</div>
        </div>
        <form class="assistant__form" id="assistant-form">
            <label for="assistant-input" class="visually-hidden">${t("Câu hỏi của bạn")}</label>
            <textarea id="assistant-input" rows="2" maxlength="800" class="report-form__input" placeholder="${t("Nhập câu hỏi...")}" required></textarea>
            <button type="submit" class="button button--flex"><i class="ri-send-plane-line"></i> ${t("Gửi")}</button>
        </form>
        <small class="assistant__note">${t("Trợ lý AI trả lời dựa trên dữ liệu của site và có thể nhầm – hãy kiểm tra lại trước khi đặt chỗ.")}</small>
    `,document.body.append(e,n),e.addEventListener("click",()=>{n.showModal(),n.querySelector("#assistant-input").focus()}),n.querySelector("[data-assistant-close]").addEventListener("click",()=>n.close()),n.addEventListener("click",i=>{i.target===n&&n.close()});const a=n.querySelector("#assistant-input");a.addEventListener("keydown",i=>{i.key==="Enter"&&!i.shiftKey&&(i.preventDefault(),n.querySelector("form").requestSubmit())}),n.querySelector("form").addEventListener("submit",i=>{i.preventDefault(),askAssistant(a)})}async function askAssistant(e){const n=e.value.trim();if(!n)return;const a=e.form.querySelector('button[type="submit"]');e.value="",a.disabled=!0,assistantMessage("user",escapeText(n));const i=assistantMessage("assistant",`<i class="ri-loader-4-line"></i> ${t("Đang trả lời...")}`);try{const s=await fetch(assistant.endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({question:n,history:assistant.history.slice(-6),lang:LANG,page:window.DEST_ID||""})}),o=await s.json().catch(()=>({}));if(!s.ok||!o.answer)throw new Error(o.error||`HTTP ${s.status}`);i.innerHTML=assistantHtml(o.answer),assistant.history.push({role:"user",content:n},{role:"assistant",content:o.answer})}catch(s){i.classList.add("assistant__msg--error"),i.textContent=s.message&&!/^HTTP/.test(s.message)?s.message:t("Chưa kết nối được trợ lý, thử lại sau nhé.")}finally{a.disabled=!1,e.focus()}}function initAssistant(e){!e||assistant.endpoint||typeof HTMLDialogElement>"u"||(assistant.endpoint=e,buildAssistant())}initAssistant(typeof SITE_CONFIG<"u"&&SITE_CONFIG.assistantEndpoint);const VIETNAM_CENTER=[16.2,106.5],SOVEREIGNTY_LABELS=[{name:"Quần đảo Hoàng Sa (Việt Nam)",lat:16.5,lng:112},{name:"Quần đảo Trường Sa (Việt Nam)",lat:10.2,lng:114.3}],LEAFLET_CDN="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";let leafletPromise=null;function loadLeaflet(){return typeof L<"u"?Promise.resolve(!0):(leafletPromise||(leafletPromise=new Promise(e=>{const n=document.createElement("link");n.rel="stylesheet",n.href=LEAFLET_CDN+"leaflet.min.css",document.head.appendChild(n);const a=document.createElement("script");a.src=LEAFLET_CDN+"leaflet.min.js",a.onload=()=>e(typeof L<"u"),a.onerror=()=>{leafletPromise=null,e(!1)},document.head.appendChild(a)})),leafletPromise)}function createMap(e,{center:n=VIETNAM_CENTER,zoom:a=5,scrollWheelZoom:i=!1}={}){const s=L.map(e,{center:n,zoom:a,scrollWheelZoom:i,minZoom:4});return L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(s),SOVEREIGNTY_LABELS.forEach(o=>{L.marker([o.lat,o.lng],{interactive:!1,keyboard:!1,icon:L.divIcon({className:"map-label",html:`<span>${t(o.name)}</span>`,iconSize:null})}).addTo(s)}),i||(s.on("click",()=>s.scrollWheelZoom.enable()),s.on("mouseout",()=>s.scrollWheelZoom.disable())),s}function pinIcon(e,{active:n=!1}={}){return L.divIcon({className:`map-pin map-pin--${e}${n?" map-pin--active":""}`,html:"<span></span>",iconSize:[28,28],iconAnchor:[14,28],popupAnchor:[0,-26]})}function destinationPopup(e,n=""){return`
        <a href="${destinationUrl(e.id)}" class="map-popup">
            <span class="map-popup__media">
                <img data-wiki="${wikiAttr(heroCandidates(e))}" data-width="500" alt="${e.name}">
            </span>
            <span class="map-popup__body">
                <strong>${e.name}</strong>
                <small>${e.province} · ${REGIONS[e.region]}${n}</small>
                <em>${t("Xem chi tiết")} <i class="ri-arrow-right-line"></i></em>
            </span>
        </a>
    `}function bindDestinationPopup(e,n,a){return e.bindPopup(destinationPopup(n,a),{minWidth:220,maxWidth:240}),e.on("popupopen",i=>hydrateWikiImages(i.popup.getElement())),e}function whenVisible(e,n){if(!("IntersectionObserver"in window))return n();const a=new IntersectionObserver(i=>{i.some(s=>s.isIntersecting)&&(a.disconnect(),n())},{rootMargin:"200px"});a.observe(e)}function showMapUnavailable(e){e.classList.add("map--unavailable"),e.innerHTML=`<p><i class="ri-map-2-line"></i> ${t("Không tải được bản đồ. Vui lòng kiểm tra kết nối mạng.")}</p>`}const WEATHER_CODES=[{codes:[0],text:"Trời quang",icon:"ri-sun-line"},{codes:[1,2],text:"Ít mây",icon:"ri-sun-cloudy-line"},{codes:[3],text:"Nhiều mây",icon:"ri-cloudy-line"},{codes:[45,48],text:"Sương mù",icon:"ri-mist-line"},{codes:[51,53,55,56,57],text:"Mưa phùn",icon:"ri-drizzle-line"},{codes:[61,63,66,80,81],text:"Có mưa",icon:"ri-showers-line"},{codes:[65,67,82],text:"Mưa to",icon:"ri-heavy-showers-line"},{codes:[71,73,75,77,85,86],text:"Tuyết",icon:"ri-snowy-line"},{codes:[95,96,99],text:"Dông",icon:"ri-thunderstorms-line"}];function describeWeather(e){const n=WEATHER_CODES.find(a=>a.codes.includes(e))||{text:"Không rõ",icon:"ri-question-line"};return{...n,text:t(n.text)}}const WEEKDAYS={vi:["CN","T2","T3","T4","T5","T6","T7"],en:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],ko:["일","월","화","수","목","금","토"],zh:["周日","周一","周二","周三","周四","周五","周六"],ja:["日","月","火","水","木","金","土"]}[LANG],WEATHER_CACHE_MINUTES=30;async function fetchWeather(e,n){const a=`viet-travel:weather:${e},${n}`;try{const r=JSON.parse(sessionStorage.getItem(a)||"null");if(r&&Date.now()-r.time<WEATHER_CACHE_MINUTES*6e4)return r.data}catch{}const i="https://api.open-meteo.com/v1/forecast?"+new URLSearchParams({latitude:e,longitude:n,current:"temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",timezone:"Asia/Ho_Chi_Minh",forecast_days:4}),s=await fetch(i);if(!s.ok)throw new Error(`HTTP ${s.status}`);const o=await s.json();try{sessionStorage.setItem(a,JSON.stringify({time:Date.now(),data:o}))}catch{}return o}function renderWeather(e,n){const a=n.current,i=describeWeather(a.weather_code),s=n.daily.time.slice(1).map((o,r)=>({date:new Date(`${o}T00:00:00`),code:n.daily.weather_code[r+1],max:n.daily.temperature_2m_max[r+1],min:n.daily.temperature_2m_min[r+1],rain:n.daily.precipitation_probability_max[r+1]}));e.innerHTML=`
        <div class="weather__now">
            <i class="${i.icon} weather__icon"></i>
            <div>
                <span class="weather__temp">${Math.round(a.temperature_2m)}°C</span>
                <span class="weather__text">${i.text}</span>
            </div>
        </div>
        <div class="weather__meta">
            <span><i class="ri-drop-line"></i> ${t("Độ ẩm")} ${a.relative_humidity_2m}%</span>
            <span><i class="ri-windy-line"></i> ${t("Gió")} ${Math.round(a.wind_speed_10m)} km/h</span>
        </div>
        <ul class="weather__forecast">
            ${s.map(o=>{const r=describeWeather(o.code);return`
                    <li title="${r.text}">
                        <span>${WEEKDAYS[o.date.getDay()]}</span>
                        <i class="${r.icon}"></i>
                        <strong>${Math.round(o.max)}° / ${Math.round(o.min)}°</strong>
                        ${o.rain!=null?`<small><i class="ri-umbrella-line"></i> ${o.rain}%</small>`:""}
                    </li>
                `}).join("")}
        </ul>
        <p class="weather__source">${t("Nguồn")}: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a></p>
    `}function initWeather(e,n,a){e&&whenVisible(e,async()=>{try{renderWeather(e,await fetchWeather(n,a)),e.classList.remove("weather--loading")}catch{e.classList.remove("weather--loading"),e.innerHTML=`<p class="weather__error"><i class="ri-cloud-off-line"></i> ${t("Chưa lấy được thời tiết lúc này.")}</p>`}})}const FORECAST_DAYS=16,FORECAST_CACHE_MINUTES=60;function todayIso(e=new Date){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}const lastForecastDate=(e=new Date)=>addDays(todayIso(e),FORECAST_DAYS-1);function forecastWindow(e,n,a=new Date){const i=e>todayIso(a)?e:todayIso(a),s=n<lastForecastDate(a)?n:lastForecastDate(a);return i<=s?{from:i,to:s}:null}async function fetchDailyForecast(e,n,a,i){const s=`viet-travel:forecast:${e},${n}:${a}:${i}`;try{const h=JSON.parse(sessionStorage.getItem(s)||"null");if(h&&Date.now()-h.time<FORECAST_CACHE_MINUTES*6e4)return h.data}catch{}const o="https://api.open-meteo.com/v1/forecast?"+new URLSearchParams({latitude:e,longitude:n,daily:"weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",timezone:"Asia/Ho_Chi_Minh",start_date:a,end_date:i}),r=await fetch(o);if(!r.ok)throw new Error(`HTTP ${r.status}`);const c=await r.json(),l=Object.fromEntries(c.daily.time.map((h,d)=>[h,{code:c.daily.weather_code[d],max:c.daily.temperature_2m_max[d],min:c.daily.temperature_2m_min[d],rain:c.daily.precipitation_probability_max[d]}]));try{sessionStorage.setItem(s,JSON.stringify({time:Date.now(),data:l}))}catch{}return l}function forecastChipHtml(e){const n=describeWeather(e.code);return`
        <span class="forecast-chip" title="${t("Dự báo")}: ${n.text}">
            <i class="${n.icon}"></i> ${n.text} · <strong>${Math.round(e.max)}° / ${Math.round(e.min)}°</strong>
            ${e.rain!=null?`<small><i class="ri-umbrella-line"></i> ${e.rain}%</small>`:""}
        </span>
    `}function forecastLaterHtml(e,n,a=new Date){const i=Number(e.slice(5,7)),s=n&&n.bestMonths.includes(i);return`
        <span class="forecast-chip forecast-chip--later">
            <i class="ri-calendar-check-line"></i> ${t("Có dự báo từ {date}",{date:formatDate(addDays(e,-(FORECAST_DAYS-1)))})}
            ${n?`· <em>${s?t("Tháng {m} là mùa đẹp",{m:monthLabel(i)}):t("Tháng {m} chưa phải mùa đẹp nhất",{m:monthLabel(i)})}</em>`:""}
        </span>
    `}async function fillForecasts(e=document,n=new Date){const a=[...e.querySelectorAll("[data-forecast-date]")],i=todayIso(n),s=new Map;a.forEach(o=>{const r=o.dataset.forecastDate,c=getDestination(o.dataset.forecastDest);if(!r||!c||r<i){o.innerHTML="";return}if(r>lastForecastDate(n)){o.innerHTML=forecastLaterHtml(r,c,n);return}s.has(c.id)||s.set(c.id,{dest:c,slots:[]}),s.get(c.id).slots.push(o)}),await Promise.all([...s.values()].map(async({dest:o,slots:r})=>{const c=r.map(h=>h.dataset.forecastDate).sort(),l=forecastWindow(c[0],c[c.length-1],n);if(l){r.forEach(h=>{h.innerHTML=`<span class="forecast-chip forecast-chip--loading"><i class="ri-loader-4-line"></i> ${t("Đang tải dự báo...")}</span>`});try{const h=await fetchDailyForecast(o.lat,o.lng,l.from,l.to);r.forEach(d=>{const u=h[d.dataset.forecastDate];d.innerHTML=u?forecastChipHtml(u):""})}catch{r.forEach(h=>{h.innerHTML=`<span class="forecast-chip forecast-chip--error"><i class="ri-cloud-off-line"></i> ${t("Chưa lấy được dự báo")}</span>`})}}}))}function markCurrentMonth(e=document){const n=new Date().getMonth()+1;e.querySelectorAll(`.season__month[data-month="${n}"]`).forEach(a=>{a.classList.add("season__month--current"),a.setAttribute("aria-current","date")})}function heroSection(e){return`
        <section class="dest-hero" id="top">
            <img data-wiki="${wikiAttr(heroCandidates(e))}" data-width="1920" data-priority alt="${e.name}" class="dest-hero__img">
            <div class="dest-hero__overlay"></div>

            <div class="dest-hero__content container">
                <nav class="breadcrumb" aria-label="Breadcrumb">
                    <a href="${homeUrl()}">${t("Trang chủ")}</a>
                    <i class="ri-arrow-right-s-line"></i>
                    <a href="${homeUrl(`?region=${e.region}#place`)}">${REGIONS[e.region]}</a>
                    <i class="ri-arrow-right-s-line"></i>
                    <span>${e.name}</span>
                </nav>

                <span class="dest-hero__subtitle"><i class="ri-map-pin-2-fill"></i> ${e.province}</span>
                <h1 class="dest-hero__title">${e.name}</h1>
                <p class="dest-hero__tagline">${e.tagline}</p>

                <div class="dest-hero__actions">
                    <a href="#gallery" class="button button--flex">${t("Xem hình ảnh")} <i class="ri-image-line"></i></a>
                    <a href="#food" class="button button--flex button--ghost">${t("Ẩm thực")} <i class="ri-restaurant-line"></i></a>
                    ${favoriteButton(e.id,{withLabel:!0})}
                </div>
            </div>
        </section>

        <div class="container">
            <div class="dest-facts">
                ${fact("ri-star-fill",t("Đánh giá"),`${e.rating.toFixed(1)} / 5`)}
                ${fact("ri-calendar-event-line",t("Thời điểm đẹp"),e.bestTime)}
                ${fact("ri-time-line",t("Thời gian gợi ý"),e.duration)}
                ${fact("ri-compass-3-line",t("Vùng miền"),REGIONS[e.region])}
            </div>
        </div>
    `}function fact(e,n,a){return`
        <div class="dest-facts__item">
            <i class="${e} dest-facts__icon"></i>
            <div>
                <span class="dest-facts__label">${n}</span>
                <span class="dest-facts__value">${a}</span>
            </div>
        </div>
    `}function overviewSection(e){const n=e.gallery[0],a=e.gallery.slice(0,3).map(i=>i.file);return`
        <section class="overview section" id="overview">
            <div class="overview__container container grid">
                <div class="overview__data">
                    <span class="section__subtitle">${t("Tổng quan")}</span>
                    <h2 class="section__title overview__title">${t("Vì sao nên đến {name}?",{name:e.name})}</h2>
                    <p class="overview__description">${e.description}</p>

                    <h3 class="overview__highlights-title">${t("Điểm nhấn không thể bỏ lỡ")}</h3>
                    <ul class="overview__highlights">
                        ${e.highlights.map(i=>`<li><i class="ri-checkbox-circle-fill"></i> ${i}</li>`).join("")}
                    </ul>

                    <div class="dest-card__tags">
                        ${e.categories.map(i=>`<span class="tag">${CATEGORIES[i]}</span>`).join("")}
                    </div>
                </div>

                ${n?`
                <div class="overview__img">
                    <img data-wiki="${wikiAttr(a)}" data-width="960" alt="${n.caption}" loading="lazy">
                </div>`:""}
            </div>
        </section>
    `}function climateSection(e){const n=Array.from({length:12},(a,i)=>i+1);return`
        <section class="climate section" id="climate">
            <span class="section__subtitle">${t("Thời tiết")}</span>
            <h2 class="section__title">${t("Thời tiết & mùa đẹp")}</h2>

            <div class="climate__container container">
                <div class="climate__card weather weather--loading" id="weather" aria-live="polite">
                    <p class="weather__loading"><i class="ri-loader-4-line"></i> ${t("Đang tải thời tiết...")}</p>
                </div>

                <div class="climate__card season">
                    <h3 class="season__title"><i class="ri-calendar-event-line"></i> ${t("Thời điểm đẹp")}: ${e.bestTime}</h3>
                    <p class="season__hint">${t("Bấm vào một tháng để xem có nên đi không")}</p>
                    <div class="season__months" role="group" aria-label="${t("Các tháng trong năm")}">
                        ${n.map(a=>{const i=e.bestMonths.includes(a);return`<button type="button" class="season__month${i?" season__month--best":""}" data-month="${a}" aria-pressed="false"
                                        title="${t("Tháng {m}",{m:monthLabel(a)})}${i?` – ${t("mùa đẹp")}`:""}">${monthShort(a)}</button>`}).join("")}
                    </div>
                    <div class="season__legend">
                        <span><i class="season__dot season__dot--best"></i> ${t("Mùa đẹp")}</span>
                        <span><i class="season__dot season__dot--current"></i> ${t("Tháng hiện tại")}</span>
                        <span><i class="season__dot season__dot--selected"></i> ${t("Tháng đang xem")}</span>
                    </div>
                    <p class="season__status" data-season-status="${e.bestMonths.join(",")}" aria-live="polite"></p>
                    <div class="season__others" id="season-others"></div>
                </div>
                ${eventsCardHtml(e)}
            </div>
        </section>
    `}function eventsCardHtml(e){const n=destinationEvents(e.id);return n.length?`
        <div class="climate__card events-card">
            <h3 class="season__title"><i class="ri-flag-2-line"></i> ${t("Lễ hội & mùa đặc sắc")}</h3>
            <ul class="events__list" id="dest-events">${n.map(a=>eventCardHtml(a)).join("")}</ul>
            <p class="budget__note">${t("Lễ theo âm lịch đổi ngày dương mỗi năm – kiểm tra lịch chính thức trước khi đi.")}</p>
        </div>
    `:""}function gallerySection(e){const n=[{file:e.hero,caption:e.name},...e.gallery];return`
        <section class="gallery section" id="gallery">
            <span class="section__subtitle">${t("Hình ảnh")}</span>
            <h2 class="section__title">${t("Vẻ đẹp {name}",{name:e.name})}</h2>

            <div class="gallery__grid container">
                ${n.map((a,i)=>`
                    <button type="button" class="gallery__item${i===0?" is-featured":""}" data-index="${i}" aria-label="${t("Xem ảnh")}: ${a.caption}">
                        <img data-wiki="${wikiAttr(a.file)}" data-width="960" alt="" class="gallery__img" loading="lazy">
                        <span class="gallery__caption"><i class="ri-zoom-in-line"></i> ${a.caption}</span>
                    </button>
                `).join("")}
            </div>
        </section>
    `}function foodSection(e){return`
        <section class="food section" id="food">
            <span class="section__subtitle">${t("Ẩm thực")}</span>
            <h2 class="section__title">${t("Món ngon phải thử")}</h2>

            <div class="food__grid container">
                ${e.foods.map(n=>foodCard(n,e)).join("")}
            </div>
            ${eatsBlock(e)}
        </section>
    `}function eatCard(e,n){return`
        <li class="eat">
            <div class="eat__head">
                <h4 class="eat__name">${e.name}</h4>
                <span class="eat__price">${priceRange(e.price)}</span>
            </div>
            <p class="eat__dish">${pickLang(e.dish)}</p>
            <a href="${mapsSearchUrl(`${e.name}, ${e.address}`)}" target="_blank" rel="noopener" class="eat__address">
                <i class="ri-map-pin-2-line"></i> ${e.address}
            </a>
            ${e.updated?`<small class="eat__updated"><i class="ri-refresh-line"></i> ${updatedText(e.updated)}</small>`:""}
            ${reportLinkHtml({dest:n.name,item:e.name,details:`${e.address} · ${priceRange(e.price)}`})}
        </li>
    `}const EATS_VISIBLE=4;function eatsBlock(e){const n=placesOf(e.id);return n?`
        <div class="eats container">
            <h3 class="eats__title"><i class="ri-restaurant-2-line"></i> ${t("Quán nên ghé ở {name}",{name:e.name})}</h3>
            <ul class="eats__list">${n.eats.slice(0,EATS_VISIBLE).map(a=>eatCard(a,e)).join("")}</ul>
            ${n.eats.length>EATS_VISIBLE?`
                <details class="eats__more">
                    <summary class="button button--ghost button--flex">${t("Xem thêm {n} quán",{n:n.eats.length-EATS_VISIBLE})} <i class="ri-arrow-down-s-line"></i></summary>
                    <ul class="eats__list">${n.eats.slice(EATS_VISIBLE).map(a=>eatCard(a,e)).join("")}</ul>
                </details>
            `:""}
            <p class="budget__note">${t("Giá tham khảo mỗi người. Bấm địa chỉ để mở Google Maps xem giờ mở cửa và đánh giá mới nhất.")}</p>
        </div>
    `:""}function stayCard(e,n){return`
        <article class="stay-card">
            <span class="stay-card__type stay-card__type--${e.type}">${pickLang(STAY_TYPES[e.type])}</span>
            <h4 class="stay-card__area">${pickLang(e.area)}</h4>
            <p class="stay-card__price">${priceRange(e.price)} <small>/ ${t("đêm")}</small></p>
            <p class="stay-card__note">${pickLang(e.note)}</p>
            <div class="book-links">${linkButtons(stayLinks(n,pickLang(e.area)))}</div>
        </article>
    `}function staySection(e){const n=placesOf(e.id);if(!n)return"";const a=[n.airport?{label:t("Vé máy bay tới {code}",{code:n.airport}),icon:"ri-plane-line",url:`https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights to ${n.airport}`)}`}:null,n.rail?{label:t("Vé tàu (ga {station})",{station:n.rail}),icon:"ri-train-line",url:"https://dsvn.vn/"}:null,{label:t("Vé xe khách / limousine"),icon:"ri-bus-2-line",url:"https://vexere.com/"}].filter(Boolean);return`
        <section class="stay section" id="stay">
            <span class="section__subtitle">${t("Lưu trú & đi lại")}</span>
            <h2 class="section__title">${t("Ở đâu khi đến {name}",{name:e.name})}</h2>

            <div class="stay__container container">
                <div class="stay__grid">${n.stays.map(i=>stayCard(i,n.city)).join("")}</div>

                <div class="getthere">
                    <h3 class="getthere__title"><i class="ri-map-2-line"></i> ${t("Cách đi tới {name}",{name:e.name})}</h3>
                    <p>${pickLang(n.getThere)}</p>
                    ${hubTransportTable(e)}
                    <div class="book-links">${linkButtons(a)}</div>
                </div>
                <p class="budget__note">${t("Giá phòng tham khảo cho 2 người/đêm, cao hơn vào lễ Tết và cuối tuần. Việt Travel không nhận hoa hồng từ các trang đặt chỗ.")}</p>
            </div>
        </section>
    `}function foodCard(e,n){return`
        <article class="food-card">
            <div class="food-card__media">
                <span class="food-card__menu"><small>${t("Đặc sản")}</small>${e.name}</span>
                ${e.file?`<img data-wiki="${wikiAttr(e.file)}" data-width="960" alt="${e.name}" class="food-card__img" loading="lazy">`:""}
                ${e.illustrative?`<span class="food-card__badge" title="${e.illustrative}">${t("Ảnh minh họa")}</span>`:""}
                <span class="food-card__price">${e.price}</span>
            </div>
            <div class="food-card__body">
                <h3 class="food-card__title">${e.name}</h3>
                <p class="food-card__desc">${e.desc}</p>
                ${e.illustrative?`<span class="food-card__note"><i class="ri-information-line"></i> ${t("Ảnh minh họa")}: ${e.illustrative}</span>
                <a href="${foodPhotoSubmitUrl(e,n)}" target="_blank" rel="noopener" class="food-card__submit"><i class="ri-camera-line"></i> ${t("Có ảnh thật của món này? Gửi cho Việt Travel")}</a>`:""}
            </div>
        </article>
    `}function activitiesSection(e){return`
        <section class="activities section" id="activities">
            <span class="section__subtitle">${t("Vui chơi")}</span>
            <h2 class="section__title">${t("Trải nghiệm đáng nhớ")}</h2>

            <div class="activities__grid container">
                ${e.activities.map(n=>`
                    <article class="activity-card">
                        <span class="activity-card__icon"><i class="${n.icon}"></i></span>
                        <h3 class="activity-card__title">${n.title}</h3>
                        <p class="activity-card__desc">${n.desc}</p>
                    </article>
                `).join("")}
            </div>

            ${e.tips.length?`
            <div class="tips container">
                <h3 class="tips__title"><i class="ri-lightbulb-flash-line"></i> ${t("Kinh nghiệm du lịch")}</h3>
                <ul class="tips__list">
                    ${e.tips.map(n=>`<li class="tip-item">${n}</li>`).join("")}
                </ul>
            </div>`:""}

            <div class="packing-block container" id="packing" data-dest="${e.id}">
                <h3 class="tips__title"><i class="ri-luggage-cart-line"></i> <span data-packing-title>${t("Đồ cần mang")}</span></h3>
                <p class="packing-block__hint">${t("Tự gợi ý theo điểm đến và tháng đi (chọn ngày khởi hành ở phần Lịch trình để đổi tháng). Đánh dấu để ghi nhớ món đã chuẩn bị.")}</p>
                <div data-packing-slot></div>
            </div>

            <p class="report-page container">
                <i class="ri-feedback-line"></i> ${t("Thấy giá vé, giờ mở cửa hay quán đã thay đổi?")}
                ${reportLinkHtml({dest:e.name,item:t("Thông tin chung")})}
            </p>
        </section>
    `}const tourLabel=e=>t("{n} ngày {m} đêm",{n:e,m:e-1});function dayToolsHtml(e,n){const a=dayRouteUrl(e.id,n);return`
        <div class="day-tools" data-day-offset="${n}">
            <span class="day-tools__date" data-day-date hidden></span>
            <span class="day-tools__forecast" data-forecast-dest="${e.id}"></span>
            <span class="day-tools__links">
                ${a?`<a href="${a}" target="_blank" rel="noopener" class="day-tools__link"><i class="ri-route-line"></i> ${t("Lộ trình trên Google Maps")}</a>`:""}
                <a href="#" target="_blank" rel="noopener" class="day-tools__link" data-gcal hidden><i class="ri-calendar-event-line"></i> ${t("Thêm ngày này vào Google Calendar")}</a>
            </span>
        </div>
    `}function tourDaysHtml(e,n,a,i=[a]){const s=n.days.slice(0,Math.max(a,...i));return`
        <div class="itinerary__tabs" role="tablist" aria-label="${t("Chọn ngày")}">
            ${s.map((o,r)=>`
                <button type="button" class="itinerary__tab${r===0?" itinerary__tab--active":""}" role="tab"
                        id="tour-tab-${r}" aria-controls="tour-panel-${r}" aria-selected="${r===0}" data-day="${r}"${r<a?"":" hidden"}>
                    <span>${t("Ngày {n}",{n:r+1})}</span>
                    <small>${o.title}</small>
                </button>
            `).join("")}
        </div>

        ${s.map((o,r)=>`
            <div class="itinerary__panel${r<a?"":" itinerary__panel--off"}" role="tabpanel" id="tour-panel-${r}" aria-labelledby="tour-tab-${r}"${r===0?"":" hidden"}>
                <h3 class="itinerary__day-title">${t("Ngày {n}",{n:r+1})}: ${o.title}</h3>
                ${dayToolsHtml(e,r)}
                ${dayTimelineHtml(tourDayEntries(e,r,o,a,i))}
            </div>
        `).join("")}
    `}function tourDayEntries(e,n,a,i,s){const o=s.includes(n+1),r=s.some(u=>u>n+1),c=dayTimeline(e.id,n,a,{last:!r});if(!o||!r)return c;const l=dayTimeline(e.id,n,a,{last:!0}).pop(),h=c.pop(),d=n===i-1;return[...c,{...h,end:"more",hidden:d},{...l,end:"last",hidden:!d}]}const BUDGET_TIERS=[{tier:"saving",label:()=>t("Tiết kiệm"),desc:()=>t("Homestay, ăn quán địa phương, xe máy")},{tier:"comfort",label:()=>t("Thoải mái"),desc:()=>t("Khách sạn 3–4 sao, nhà hàng, Grab")}];function budgetBlock(e,n,a=!1){const i=Object.fromEntries(BUDGET_TIERS.map(({tier:s})=>[s,tripCost(e.id,n,s)]));return`
        <div class="budget" data-tour-len="${n}"${a?" hidden":""}>
            <h3 class="budget__title"><i class="ri-wallet-3-line"></i> ${t("Chi phí ước tính / người")} – ${tourLabel(n)}</h3>
            <div class="budget__options" role="group" aria-label="${t("Mức chi tiêu")}">
                ${BUDGET_TIERS.map(({tier:s,label:o,desc:r},c)=>`
                    <button type="button" class="budget__option${c===0?" budget__option--active":""}" data-budget-tier="${s}" aria-pressed="${c===0}">
                        <span>${o()}</span>
                        <strong>${formatVnd(i[s].total)}</strong>
                        <small>${r()}</small>
                        <em class="budget__more">${t("Xem chi tiết")} <i class="ri-arrow-down-s-line"></i></em>
                    </button>
                `).join("")}
            </div>
            ${BUDGET_TIERS.map(({tier:s,label:o},r)=>`
                <div class="budget__detail" data-budget-detail="${s}"${r===0?"":" hidden"}>
                    <p class="budget__detail-title">${t("Chi tiết mức {tier}",{tier:o().toLowerCase()})}</p>
                    ${costBreakdownHtml(i[s])}
                </div>
            `).join("")}
        </div>
    `}function itinerarySection(e){const n=typeof ITINERARIES<"u"&&ITINERARIES[e.id];if(!n)return"";const a=(typeof TOUR_LENGTHS<"u"?TOUR_LENGTHS:[n.days.length]).filter(s=>s<=n.days.length),i=a[0];return`
        <section class="itinerary section" id="itinerary">
            <span class="section__subtitle">${t("Lịch trình tour")}</span>
            <h2 class="section__title">${t("Lịch trình tour {name}",{name:e.name})}</h2>

            <div class="itinerary__container container">
                <div class="print-only print-header">
                    <strong>${t("Lịch trình tour {name}",{name:e.name})}</strong>
                    <p>Việt Travel · ${e.province} · ${t("Thời điểm đẹp")}: ${e.bestTime}</p>
                    <p class="print-url"></p>
                </div>
                <div class="trip-date">
                    <label class="trip-date__label" for="tour-start"><i class="ri-calendar-event-line"></i> ${t("Ngày khởi hành")}</label>
                    <input type="date" id="tour-start" class="planner__select trip-date__input">
                    <small class="trip-date__hint">${t("Chọn ngày để xem dự báo thời tiết từng ngày và thêm lịch trình vào lịch của bạn.")}</small>
                    <ul class="trip-alerts events__list" id="tour-alerts" hidden></ul>
                </div>

                <div class="tour-picker" role="tablist" aria-label="${t("Chọn tour")}">
                    ${a.map((s,o)=>`
                        <button type="button" class="tour-picker__btn${o===0?" tour-picker__btn--active":""}" role="tab"
                                aria-selected="${o===0}" aria-controls="tour-plan" data-tour="${s}">
                            <strong>${tourLabel(s)}</strong>
                            <small>${t("từ {price}",{price:formatVnd(tripCost(e.id,s,"saving").total)})}</small>
                        </button>
                    `).join("")}
                </div>

                <div class="tour" id="tour-plan" data-tour="${i}">
                    <div class="tour__toolbar">
                        ${a.map(s=>`
                            <p class="tour__summary" data-tour-len="${s}"${s===i?"":" hidden"}><i class="ri-route-line"></i> ${tourLabel(s)} · ${n.days.slice(0,s).map(o=>o.title).join(" → ")}</p>
                        `).join("")}
                        <div class="tour__buttons">
                            <button type="button" class="tour__expand" data-expanded="false">
                                <i class="ri-list-check-2"></i> <span>${t("Xem tất cả các ngày")}</span>
                            </button>
                            <button type="button" class="tour__expand" data-tour-action="print" aria-label="${t("In lịch trình {tour}",{tour:tourLabel(i)})}">
                                <i class="ri-printer-line"></i> <span>${t("In / PDF")}</span>
                            </button>
                            <button type="button" class="tour__expand" data-tour-action="ics" aria-label="${t("Thêm lịch trình {tour} vào lịch (.ics)",{tour:tourLabel(i)})}">
                                <i class="ri-calendar-2-line"></i> <span>${t("Thêm vào lịch")}</span>
                            </button>
                            <button type="button" class="tour__expand" data-tour-action="share" aria-label="${t("Chia sẻ lịch trình")}">
                                <i class="ri-share-line"></i> <span>${t("Chia sẻ")}</span>
                            </button>
                        </div>
                    </div>

                    ${tourDaysHtml(e,n,i,a)}

                    ${a.map(s=>budgetBlock(e,s,s!==i)).join("")}
                </div>

                <p class="budget__note">${t("Chưa gồm vé máy bay/tàu xe tới {name}. Giá tham khảo, thay đổi theo mùa.",{name:e.name})}</p>

                <p class="budget__note"><i class="ri-ticket-2-line"></i> <a href="${SITE_ROOT}${LANG_PREFIX}diem-den/${e.id}/gia-ve/index.html">${t("Bảng giá vé & giờ mở cửa các điểm tham quan ở {name}",{name:e.name})}</a></p>

                <div class="plan-cta">
                    <p><i class="ri-route-line"></i> ${t("Muốn đi nhiều nơi trong một chuyến? Ghép {name} với các điểm đến khác.",{name:e.name})}</p>
                    <button type="button" class="button button--flex plan-btn" data-plan-add="${e.id}">
                        <i class="ri-add-circle-line"></i> <span class="plan-btn__label">${t("Thêm vào kế hoạch chuyến đi")}</span>
                    </button>
                </div>
            </div>
        </section>
    `}function locationSection(e){const n=nearestDestinations(e,3);return`
        <section class="location section" id="location">
            <span class="section__subtitle">${t("Vị trí")}</span>
            <h2 class="section__title">${t("Bản đồ & điểm lân cận")}</h2>

            <div class="location__container container">
                <div class="location__map" id="dest-map" role="region" aria-label="${t("Bản đồ")} ${e.name}"></div>

                <div class="location__side">
                    <h3 class="location__title">${t("Gần {name}",{name:e.name})}</h3>
                    <ul class="location__nearby">
                        ${n.map(({d:a,km:i})=>`
                            <li>
                                <a href="${destinationUrl(a.id)}" class="nearby-item">
                                    <span class="nearby-item__media">
                                        <img data-wiki="${wikiAttr(heroCandidates(a))}" data-width="500" alt="${a.name}" loading="lazy">
                                    </span>
                                    <span class="nearby-item__body">
                                        <strong>${a.name}</strong>
                                        <small>${a.province}</small>
                                    </span>
                                    <span class="nearby-item__distance">~${Math.round(i)} km</span>
                                </a>
                            </li>
                        `).join("")}
                    </ul>
                    <a href="https://www.google.com/maps/dir/?api=1&amp;destination=${e.lat},${e.lng}" target="_blank" rel="noopener" class="button button--flex location__directions">
                        <i class="ri-direction-line"></i> ${t("Chỉ đường Google Maps")}
                    </a>
                </div>
            </div>
        </section>
    `}const photoSubmitUrl=e=>`https://github.com/TanTan1802/travel/issues/new?${new URLSearchParams({template:"gui-anh.yml",title:`[Ảnh] ${e.name}`,dest:e.name})}`,foodPhotoSubmitUrl=(e,n)=>`https://github.com/TanTan1802/travel/issues/new?${new URLSearchParams({template:"gui-anh.yml",title:`[Ảnh món] ${e.name} – ${n.name}`,dest:n.id,caption:e.name})}`;function communityPhotoHtml(e){const n=a=>`${SITE_ROOT}assets/img/community/${e.base}-${a}.webp`;return`
        <figure class="community-photo">
            <img src="${n(960)}" srcset="${n(480)} 480w, ${n(960)} 960w, ${n(1920)} 1920w"
                 sizes="(max-width: 576px) calc(100vw - 32px), 360px" width="${e.w}" height="${e.h}" alt="${pickLang(e.caption)}" loading="lazy">
            <figcaption>${pickLang(e.caption)} <small>· ${t("Ảnh: {author}",{author:e.author})} (${e.license})</small></figcaption>
        </figure>
    `}function commentsSection(e){const n=(typeof COMMUNITY_PHOTOS<"u"?COMMUNITY_PHOTOS:[]).filter(i=>i.dest===e.id),a=typeof giscusEnabled<"u"&&giscusEnabled();return`
        <section class="comments section" id="comments">
            <span class="section__subtitle">${t("Cộng đồng")}</span>
            <h2 class="section__title">${t("Chia sẻ trải nghiệm của bạn")}</h2>
            <div class="comments__container container">
                <h3 class="community__title"><i class="ri-camera-3-line"></i> ${t("Ảnh từ người đọc")}</h3>
                ${n.length?`<div class="community__photos">${n.map(communityPhotoHtml).join("")}</div>`:`<p class="comments__intro">${t("Chưa có ảnh nào – hãy là người đầu tiên chia sẻ khoảnh khắc ở {name}!",{name:e.name})}</p>`}
                <a href="${photoSubmitUrl(e)}" target="_blank" rel="noopener" class="button button--flex community__submit">
                    <i class="ri-image-add-line"></i> ${t("Gửi ảnh của bạn")}
                </a>
                ${a?`
                    <h3 class="community__title"><i class="ri-chat-smile-2-line"></i> ${t("Cảm nhận & đánh giá")}</h3>
                    <p class="comments__intro">${t("Bạn đã đến {name}? Hãy để lại cảm nhận, mẹo hay câu hỏi – và thả cảm xúc để đánh giá nhé!",{name:e.name})}</p>
                    <div class="giscus" id="giscus" data-term="${e.id}"></div>
                `:""}
            </div>
        </section>
    `}function relatedSection(e){const n=nearestDestinations(e,3).map(i=>i.d.id),a=DESTINATIONS.filter(i=>i.region===e.region&&i.id!==e.id&&!n.includes(i.id)).slice(0,3);return a.length?`
        <section class="related section" id="related">
            <span class="section__subtitle">${t("Gợi ý")}</span>
            <h2 class="section__title">${t("Điểm đến khác ở {region}",{region:REGIONS[e.region]})}</h2>

            <div class="dest__grid container">
                ${a.map(i=>destinationCard(i)).join("")}
            </div>

            <div class="related__more">
                <a href="${homeUrl("#place")}" class="button button--flex">${t("Xem tất cả điểm đến")} <i class="ri-arrow-right-line"></i></a>
            </div>
        </section>
    `:""}function notFoundSection(){return`
        <section class="dest-notfound section">
            <div class="container">
                <i class="ri-map-pin-line dest-notfound__icon"></i>
                <h1 class="section__title">${t("Không tìm thấy điểm đến")}</h1>
                <p>${t("Điểm đến bạn tìm không tồn tại hoặc đã bị đổi tên.")}</p>
                <a href="${homeUrl("#place")}" class="button">${t("Quay lại danh sách điểm đến")}</a>
            </div>
        </section>
    `}function renderDestinationPage(e){return[heroSection(e),overviewSection(e),climateSection(e),gallerySection(e),foodSection(e),activitiesSection(e),staySection(e),itinerarySection(e),locationSection(e),commentsSection(e),relatedSection(e)].join("")}const destRoot=document.getElementById("destination"),destId=window.DEST_ID||new URLSearchParams(location.search).get("id"),dest=getDestination(destId),isPrerendered=destRoot.hasAttribute("data-prerendered");let galleryLayout="";function balanceGallery(){const e=document.querySelector(".gallery__grid");if(!e)return;const n=getComputedStyle(e).gridTemplateColumns.split(" ").length,a=[...e.querySelectorAll(".gallery__item:not(.is-broken)")],i=`${n}:${a.length}`;if(i===galleryLayout)return;galleryLayout=i,a.forEach(h=>{h.classList.remove("is-wide","is-full"),h.style.gridColumn=h.style.gridRow=""});const s=a.filter(h=>!h.classList.contains("is-featured")),o=Math.max(n-2,0),r=o*2;if(!s.length){const h=a.find(d=>d.classList.contains("is-featured"));h&&(h.style.gridColumn="1 / -1");return}if(s.length===1&&o>0){s[0].style.gridColumn=`span ${o}`,s[0].style.gridRow="span 2";return}if(s.length<r){if(o===2){const h=r-s.length;s.slice(-h).forEach(d=>d.classList.add("is-wide"))}return}const c=s.slice(r),l=c.length%n;l!==0&&(l===1?c[c.length-1].classList.add("is-full"):c.slice(-(n-l)).forEach(h=>h.classList.add("is-wide")))}function initLightbox(e){const n=document.getElementById("lightbox"),a=document.getElementById("lightbox-img"),i=document.getElementById("lightbox-caption"),s=document.getElementById("lightbox-credit");let o=0;const r=[...document.querySelectorAll(".gallery__item")],c=u=>r[u]&&r[u].classList.contains("is-broken");function l(u,p=1){o=(u+e.length)%e.length;for(let _=0;c(o)&&_<e.length;_++)o=(o+p+e.length)%e.length;const g=e[o];a.src=wikiImg(g.file,1920),a.alt=g.caption,i.textContent=`${g.caption} (${o+1}/${e.length})`,s.href=wikiPage(g.file)}function h(u){l(u),n.hidden=!1,document.body.classList.add("no-scroll")}function d(){n.hidden=!0,document.body.classList.remove("no-scroll")}r.forEach(u=>{u.addEventListener("click",()=>h(Number(u.dataset.index))),u.addEventListener("wiki:failed",()=>{if(u.classList.add("is-broken"),u.classList.contains("is-featured")){u.classList.remove("is-featured");const p=r.find(g=>!g.classList.contains("is-broken"));p&&p.classList.add("is-featured")}balanceGallery()})}),a.addEventListener("error",()=>{n.hidden||(i.textContent=t("Không tải được ảnh này."))}),document.getElementById("lightbox-close").addEventListener("click",d),document.getElementById("lightbox-prev").addEventListener("click",()=>l(o-1,-1)),document.getElementById("lightbox-next").addEventListener("click",()=>l(o+1)),n.addEventListener("click",u=>{u.target===n&&d()}),document.addEventListener("keydown",u=>{n.hidden||(u.key==="Escape"&&d(),u.key==="ArrowLeft"&&l(o-1,-1),u.key==="ArrowRight"&&l(o+1))})}function initDayTabs(e){const n=[...e.querySelectorAll(".itinerary__tab")],a=s=>{n.forEach(o=>{const r=o===s;o.classList.toggle("itinerary__tab--active",r),o.setAttribute("aria-selected",r),document.getElementById(o.getAttribute("aria-controls")).hidden=!r})};n.forEach(s=>{s.addEventListener("click",()=>{e.classList.remove("tour--expanded"),syncExpandButton(e),a(s)}),s.addEventListener("keydown",o=>{const r=o.key==="ArrowRight"?1:o.key==="ArrowLeft"?-1:0;if(!r)return;const c=n.filter(h=>!h.hidden),l=c[(c.indexOf(s)+r+c.length)%c.length];l.focus(),l.click()})}),e.selectDay=a;const i=e.querySelector(".tour__expand");i&&i.addEventListener("click",()=>{e.classList.toggle("tour--expanded"),syncExpandButton(e),syncPanels(e)})}function syncExpandButton(e){const n=e.querySelector(".tour__expand");if(!n)return;const a=e.classList.contains("tour--expanded");n.dataset.expanded=a,n.querySelector("span").textContent=a?t("Xem từng ngày"):t("Xem tất cả các ngày")}function syncPanels(e){const n=e.classList.contains("tour--expanded");e.querySelectorAll(".itinerary__tab").forEach(a=>{const i=document.getElementById(a.getAttribute("aria-controls"));i.hidden=i.classList.contains("itinerary__panel--off")||!(n||a.classList.contains("itinerary__tab--active"))})}function setTourLength(e,n){e.dataset.tour=n,e.querySelectorAll(".itinerary__tab").forEach((s,o)=>{const r=o>=n;s.hidden=r,document.getElementById(s.getAttribute("aria-controls")).classList.toggle("itinerary__panel--off",r)}),e.querySelectorAll(".itinerary__panel").forEach((s,o)=>{s.querySelectorAll("[data-end]").forEach(r=>{r.hidden=r.dataset.end==="last"!=(o===n-1)})}),e.querySelectorAll("[data-tour-len]").forEach(s=>{s.hidden=Number(s.dataset.tourLen)!==n});const a=tourLabel(n);e.querySelector('[data-tour-action="print"]')?.setAttribute("aria-label",t("In lịch trình {tour}",{tour:a})),e.querySelector('[data-tour-action="ics"]')?.setAttribute("aria-label",t("Thêm lịch trình {tour} vào lịch (.ics)",{tour:a})),e.querySelector(".itinerary__tab--active")?.hidden&&e.selectDay(e.querySelector(".itinerary__tab")),syncPanels(e)}function initItineraryTabs(){const e=[...document.querySelectorAll(".tour")],n=[...document.querySelectorAll(".tour-picker__btn")];e.forEach(initDayTabs),n.forEach(a=>{a.addEventListener("click",()=>{n.forEach(i=>{const s=i===a;i.classList.toggle("tour-picker__btn--active",s),i.setAttribute("aria-selected",s)}),e.forEach(i=>setTourLength(i,Number(a.dataset.tour)))})})}document.addEventListener("click",e=>{const n=e.target.closest("[data-budget-tier]");if(!n)return;const a=n.closest(".budget");a.querySelectorAll("[data-budget-tier]").forEach(i=>{const s=i===n;i.classList.toggle("budget__option--active",s),i.setAttribute("aria-pressed",s)}),a.querySelectorAll("[data-budget-detail]").forEach(i=>{i.hidden=i.dataset.budgetDetail!==n.dataset.budgetTier})});function initTourActions(e){document.addEventListener("click",n=>{const a=n.target.closest("[data-tour-action]");if(a)if(a.dataset.tourAction==="ics")exportTourIcs(e,Number(a.closest(".tour").dataset.tour));else if(a.dataset.tourAction==="print")document.body.classList.add("print-itinerary"),window.addEventListener("afterprint",()=>document.body.classList.remove("print-itinerary"),{once:!0}),window.print();else{const i=a.closest(".tour");shareLink({title:`${e.name} – Việt Travel`,text:t("Gợi ý {days} ngày tại {name}",{days:i.dataset.tour,name:e.name}),url:location.href.split("#")[0]+"#itinerary"})}})}const TOUR_START_KEY="viet-travel:tour-start";function tourStart(){return document.getElementById("tour-start")?.value||""}function applyTourStart(e){updateDayTools(e),tourStart()&&fillForecasts(document.getElementById("itinerary")),renderTourAlerts(e),renderPacking(e)}function updateDayTools(e){const n=tourStart(),a=ITINERARIES[e.id];document.querySelectorAll(".tour").forEach(i=>{const s=Number(i.dataset.tour);i.querySelectorAll(".day-tools").forEach(o=>{const r=Number(o.dataset.dayOffset),c=n?addDays(n,r):"",l=o.querySelector("[data-day-date]"),h=o.querySelector("[data-forecast-dest]"),d=o.querySelector("[data-gcal]");if(l.hidden=!c,l.innerHTML=c?`<i class="ri-calendar-line"></i> ${formatDate(c)}`:"",d.hidden=!c,c){h.dataset.forecastDate=c;const u=dayTimeline(e.id,r,a.days[r],{last:r===s-1});d.href=googleCalendarDayUrl({title:`${e.name} – ${t("Ngày {n}",{n:r+1})}: ${a.days[r].title}`,date:c,details:`${dayDetailsText(u)}

${location.href.split("#")[0]}#itinerary`,location:`${e.name}, ${e.province}`})}else delete h.dataset.forecastDate,h.innerHTML=""})})}function renderTourAlerts(e){const n=document.getElementById("tour-alerts");if(!n)return;const a=tourStart(),i=document.querySelector(".tour:not([hidden])"),s=i?Number(i.dataset.tour):3,o=a?eventsForTrip(e.id,{dates:Array.from({length:s},(r,c)=>addDays(a,c))}):[];n.hidden=!o.length,n.innerHTML=o.length?`<li class="trip-alerts__title"><i class="ri-alarm-warning-line"></i> ${t("Lưu ý trong những ngày bạn đi")}</li>${o.map(r=>eventCardHtml(r)).join("")}`:""}function renderPacking(e){const n=document.getElementById("packing");if(!n)return;const a=tourStart(),i=a?Number(a.slice(5,7)):new Date().getMonth()+1;n.querySelector("[data-packing-title]").textContent=t("Đồ cần mang – tháng {m}",{m:monthLabel(i)}),n.querySelector("[data-packing-slot]").innerHTML=packingHtml(packingList([e],[i]),e.id)}function initTourStart(e){const n=document.getElementById("tour-start");if(n){n.min=todayIso();try{const a=localStorage.getItem(TOUR_START_KEY);a&&a>=todayIso()&&(n.value=a)}catch{}n.addEventListener("change",()=>{try{n.value?localStorage.setItem(TOUR_START_KEY,n.value):localStorage.removeItem(TOUR_START_KEY)}catch{}applyTourStart(e)}),document.querySelectorAll(".tour-picker__btn").forEach(a=>a.addEventListener("click",()=>{updateDayTools(e),renderTourAlerts(e)})),applyTourStart(e)}}function exportTourIcs(e,n){const a=tourStart();if(!a){const r=document.getElementById("tour-start");r.scrollIntoView({behavior:"smooth",block:"center"}),r.focus(),showToast(t("Chọn ngày khởi hành trước để thêm vào lịch"));return}const s=ITINERARIES[e.id].days.slice(0,n).flatMap((r,c)=>timelineToEvents(dayTimeline(e.id,c,r,{last:c===n-1}),{date:addDays(a,c),destName:e.name,dayLabel:`${t("Ngày {n}",{n:c+1})}: ${r.title}`})),o=`${e.name} – ${tourLabel(n)}`;downloadTextFile(`${safeFileName(o)}-${a}.ics`,buildIcs({name:o,events:s})),showToast(t("Đã tải file lịch – mở file để thêm vào Google Calendar, Apple Calendar hoặc Outlook"))}function initSeasonPicker(e){const n=[...document.querySelectorAll(".season__month")],a=document.querySelector(".season__status"),i=document.getElementById("season-others");if(!n.length||!a)return;const s=o=>{n.forEach(l=>{const h=Number(l.dataset.month)===o;l.classList.toggle("season__month--selected",h),l.setAttribute("aria-pressed",h)});const r=e.bestMonths.includes(o);a.textContent=r?t("Tháng {m} là thời điểm đẹp để đi!",{m:monthLabel(o)}):t("Tháng {m} chưa phải mùa đẹp nhất – cân nhắc các tháng được tô màu.",{m:monthLabel(o)}),a.classList.toggle("season__status--good",r),document.querySelectorAll("#dest-events .event").forEach(l=>{const h=l.dataset.eventMonths.split(",").map(Number).includes(o);l.classList.toggle("event--active",h),l.classList.toggle("event--dim",!h)});const c=DESTINATIONS.filter(l=>l.id!==e.id&&l.bestMonths.includes(o)).slice(0,6);i.innerHTML=c.length?`
            <span class="season__others-title">${t("Điểm đến đẹp vào tháng {m}:",{m:monthLabel(o)})}</span>
            ${c.map(l=>`<a href="${destinationUrl(l.id)}" class="tag">${l.name}</a>`).join("")}
        `:""};n.forEach(o=>o.addEventListener("click",()=>s(Number(o.dataset.month)))),s(new Date().getMonth()+1)}function initLocationMap(e){const n=document.getElementById("dest-map");n&&whenVisible(n,async()=>{if(!await loadLeaflet())return showMapUnavailable(n);const a=createMap(n,{center:[e.lat,e.lng],zoom:8});L.marker([e.lat,e.lng],{icon:pinIcon(e.region,{active:!0}),title:e.name,zIndexOffset:1e3}).addTo(a).bindTooltip(e.name,{permanent:!0,direction:"left",offset:[-12,-16],className:"map-tooltip"});const i=nearestDestinations(e,3);i.forEach(({d:o,km:r})=>{bindDestinationPopup(L.marker([o.lat,o.lng],{icon:pinIcon(o.region),title:o.name}),o,` · ~${Math.round(r)} km`).addTo(a)});const s=L.latLngBounds([[e.lat,e.lng],...i.map(({d:o})=>[o.lat,o.lng])]);a.fitBounds(s,{padding:[40,40],maxZoom:9})})}function giscusTheme(){return document.body.classList.contains("dark-theme")?"dark":"light"}function initComments(){const e=document.getElementById("giscus");if(!e||!giscusEnabled())return;const n=SITE_CONFIG.giscus;whenVisible(e,()=>{const i=document.createElement("script");i.src="https://giscus.app/client.js",i.async=!0,i.crossOrigin="anonymous",Object.entries({repo:n.repo,"repo-id":n.repoId,category:n.category,"category-id":n.categoryId,mapping:"specific",term:e.dataset.term,strict:"1","reactions-enabled":"1","emit-metadata":"0","input-position":"top",theme:giscusTheme(),lang:LANG==="zh"?"zh-CN":LANG,loading:"lazy"}).forEach(([s,o])=>i.setAttribute(`data-${s}`,o)),e.appendChild(i)});const a=document.getElementById("theme-button");a&&a.addEventListener("click",()=>{setTimeout(()=>{const i=document.querySelector("iframe.giscus-frame");i&&i.contentWindow.postMessage({giscus:{setConfig:{theme:giscusTheme()}}},"https://giscus.app")})})}if(dest){if(!isPrerendered){document.title=`${dest.name} – Việt Travel`,destRoot.innerHTML=renderDestinationPage(dest);const n=document.createElement("link");n.rel="canonical",n.href=new URL(destinationUrl(dest.id).replace("index.html",""),location.href).href,document.head.appendChild(n),document.querySelectorAll(".nav__lang a[hreflang]").forEach(a=>{a.href=`${SITE_ROOT}${langPrefix(a.hreflang)}diem-den/${dest.id}/index.html`})}initLightbox([{file:dest.hero,caption:dest.name},...dest.gallery]),balanceGallery();let e=0;window.addEventListener("resize",()=>{cancelAnimationFrame(e),e=requestAnimationFrame(balanceGallery)},{passive:!0}),syncFavoriteButtons(),syncPlanButtons(),initItineraryTabs(),initTourActions(dest),initTourStart(dest),initLocationMap(dest),initWeather(document.getElementById("weather"),dest.lat,dest.lng),initComments(),markCurrentMonth(destRoot),initSeasonPicker(dest)}else document.title=`${t("Không tìm thấy điểm đến")} – Việt Travel`,destRoot.innerHTML=notFoundSection(),document.getElementById("header").classList.add("header--solid");hydrateWikiImages(destRoot);const navMenu=document.getElementById("nav-menu"),navToggle=document.getElementById("nav-toggle"),navClose=document.getElementById("nav-close");navToggle&&navToggle.addEventListener("click",()=>{navMenu.classList.add("show-menu")}),navClose&&navClose.addEventListener("click",()=>{navMenu.classList.remove("show-menu")});const navLink=document.querySelectorAll(".nav__link");function linkAction(){document.getElementById("nav-menu").classList.remove("show-menu")}navLink.forEach(e=>e.addEventListener("click",linkAction));const header=document.getElementById("header"),scrollUpBtn=document.getElementById("scroll-up");let scrollTicking=!1;function onScroll(){scrollTicking=!1;const e=window.scrollY;header?.classList.toggle("scroll-header",e>=100),scrollUpBtn?.classList.toggle("show-scroll",e>=200),sectionLinks.length&&scrollActive(e)}window.addEventListener("scroll",()=>{scrollTicking||(scrollTicking=!0,requestAnimationFrame(onScroll))},{passive:!0}),document.querySelectorAll(".hscroll-wrap").forEach(e=>{const n=e.querySelector(".hscroll"),a=e.querySelector(".hscroll__btn--prev"),i=e.querySelector(".hscroll__btn--next");if(!n||!a||!i)return;const s=r=>n.scrollBy({left:r*n.clientWidth*.8,behavior:"smooth"}),o=()=>{a.disabled=n.scrollLeft<=4,i.disabled=n.scrollLeft+n.clientWidth>=n.scrollWidth-4};a.addEventListener("click",()=>s(-1)),i.addEventListener("click",()=>s(1)),n.addEventListener("scroll",o,{passive:!0}),window.addEventListener("resize",o,{passive:!0}),o()});const sectionLinks=[...document.querySelectorAll("section[id]")].map(e=>({section:e,link:document.querySelector(`.nav__menu a[href*="#${CSS.escape(e.id)}"]`)})).filter(e=>e.link);function scrollActive(e){const n=sectionLinks.map(({section:a})=>{const i=a.getBoundingClientRect(),s=i.top+e-50;return e>s&&e<=s+i.height});sectionLinks.forEach(({link:a},i)=>a.classList.toggle("active-link",n[i]))}onScroll();const REVEAL_GROUPS=[{from:"top",stagger:!0,selector:`.home__data, .home__social-link, .home__info,
        .discover__container, .numbers__item,
        .explore__search, .explore__filters, .dest-hero__content, .dest-facts,
        .food-card, .activity-card, .tip-item, .footer__data, .footer__rights`},{from:"left",stagger:!1,selector:".about__data, .season__description, .subscribe__description, .overview__data"},{from:"right",stagger:!0,selector:".about__img-overlay, .subscribe__form, .overview__img"}];function initReveal(){if(!("IntersectionObserver"in window)||matchMedia("(prefers-reduced-motion: reduce)").matches)return;const e=new IntersectionObserver(a=>{let i=0;a.filter(s=>s.isIntersecting).forEach(({target:s})=>{s.style.transitionDelay=s.dataset.revealStagger?`${i}ms`:"",s.dataset.revealStagger&&(i+=100),s.classList.add("reveal--in"),e.unobserve(s),s.addEventListener("transitionend",()=>{s.classList.remove("reveal",`reveal--${s.dataset.revealFrom}`,"reveal--in"),s.style.transitionDelay=""},{once:!0})})},{rootMargin:"0px 0px -10% 0px"}),n=window.innerHeight;REVEAL_GROUPS.forEach(({from:a,stagger:i,selector:s})=>{document.querySelectorAll(s).forEach(o=>{o.classList.contains("reveal")||o.getBoundingClientRect().top<n||(o.dataset.revealFrom=a,i&&(o.dataset.revealStagger="1"),o.classList.add("reveal",`reveal--${a}`),e.observe(o))})})}initReveal();const themeButton=document.getElementById("theme-button"),darkTheme="dark-theme",iconTheme="ri-sun-line",readStore=e=>{try{return localStorage.getItem(e)}catch{return null}},selectedTheme=readStore("selected-theme"),selectedIcon=readStore("selected-icon"),getCurrentTheme=()=>document.body.classList.contains(darkTheme)?"dark":"light",getCurrentIcon=()=>themeButton.classList.contains(iconTheme)?"ri-moon-line":"ri-sun-line";selectedTheme&&(document.body.classList[selectedTheme==="dark"?"add":"remove"](darkTheme),themeButton.classList[selectedIcon==="ri-moon-line"?"add":"remove"](iconTheme)),themeButton.addEventListener("click",()=>{document.body.classList.toggle(darkTheme),themeButton.classList.toggle(iconTheme);try{localStorage.setItem("selected-theme",getCurrentTheme()),localStorage.setItem("selected-icon",getCurrentIcon())}catch{}});const langMenu=document.getElementById("lang-menu");langMenu&&(document.addEventListener("click",e=>{langMenu.open&&!langMenu.contains(e.target)&&(langMenu.open=!1)}),langMenu.addEventListener("keydown",e=>{e.key==="Escape"&&langMenu.open&&(langMenu.open=!1,langMenu.querySelector("summary").focus())})),"serviceWorker"in navigator&&(location.protocol==="https:"||location.hostname==="localhost")&&window.addEventListener("load",()=>{navigator.serviceWorker.register(`${window.SITE_ROOT||""}sw.js`).catch(()=>{})});
