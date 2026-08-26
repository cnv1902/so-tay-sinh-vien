/**
 * i18n/locales/vi.ts
 * Bộ từ điển Tiếng Việt chuẩn cho toàn bộ ứng dụng VinhUni Pocket Guide.
 */

export const vi = {
  common: {
    loading: "Đang tải...",
    error: "Đã xảy ra sự cố",
    retry: "Thử lại",
    search: "Tìm kiếm...",
    cancel: "Hủy",
    confirm: "Xác nhận",
    save: "Lưu",
    close: "Đóng",
    back: "Quay lại",
    all: "Tất cả",
    viewAll: "Xem tất cả",
    emptyData: "Không có dữ liệu",
    readMore: "Đọc tiếp",
    callNow: "Gọi ngay",
    copied: "Đã sao chép vào bộ nhớ tạm",
    minutes: "phút",
    meters: "m",
    kilometers: "km",
  },

  tabs: {
    home: "Trang chủ",
    map: "Bản đồ",
    chat: "Trợ lý",
    calendar: "Lịch",
    news: "Tin tức",
    services: "Sổ tay",
  },

  home: {
    greeting: "Chào bạn,",
    subGreeting: "Chúc bạn một ngày học tập hiệu quả!",
    aiAssistantTitle: "Trợ lý AI VinhUni",
    aiAssistantDesc: "Hỏi đáp quy chế đào tạo, thủ tục, vị trí phòng ban...",
    askNow: "Hỏi ngay",
    mapHeroTitle: "Khuôn viên 3D Thông minh",
    mapHeroDesc:
      "Tìm phòng học, đường đi và xem sơ đồ 3D các tòa nhà Đại học Vinh.",
    exploreMap: "Mở bản đồ",
    quickActions: "Truy cập nhanh",
    actionDepartment: "Phòng ban",
    actionHandbook: "Sổ tay",
    actionCalendar: "Lịch học",
    actionNews: "Tin tức",
    actionSos: "Cứu trợ SOS",
    latestNews: "Tin tức & Thông báo mới",
    categoriesTitle: "Danh mục cẩm nang",
  },

  map: {
    title: "Bản đồ VinhUni",
    subtitle: "Bản đồ khuôn viên Đại học Vinh",
    searchPlaceholder: "Tìm kiếm tòa nhà, phòng ban, giảng đường...",
    routeTitle: "Lộ trình di chuyển",
    startPoint: "Điểm xuất phát...",
    destinationPoint: "Chọn điểm đến...",
    yourLocation: "Vị trí của bạn (GPS)",
    startNavigation: "Bắt đầu đi (Chỉ đường trực tiếp)",
    stopNavigation: "Dừng dẫn đường",
    offRouteAlert: "Đang đi lệch tuyến đường • Đang cập nhật...",
    arrivedText: "Bạn đã đến điểm đích",
    headingTo: "Hướng đến",
    remaining: "Còn",
    distance: "Khoảng cách",
    eta: "Thời gian",
    locationServicesOffTitle: "Dịch vụ vị trí đang tắt",
    locationServicesOffMsg:
      "Vui lòng bật GPS (Vị trí) trong cài đặt thiết bị để hiển thị vị trí của bạn trên bản đồ.",
    locationPermissionDeniedTitle: "Chưa cấp quyền vị trí",
    locationPermissionDeniedMsg:
      "Bạn cần cấp quyền truy cập vị trí để ứng dụng có thể hiển thị bạn đang ở đâu trong khuôn viên trường.",
    understood: "Đã hiểu",
    // Turn Maneuvers
    maneuvers: {
      straight: "Đi thẳng {{distance}}",
      slightLeft: "Rẽ nhẹ trái sau {{distance}}",
      slightRight: "Rẽ nhẹ phải sau {{distance}}",
      left: "Rẽ trái sau {{distance}}",
      right: "Rẽ phải sau {{distance}}",
      sharpLeft: "Cua gấp trái sau {{distance}}",
      sharpRight: "Cua gấp phải sau {{distance}}",
      uturn: "Quay đầu sau {{distance}}",
      arrive: "Bạn đã đến điểm đích",
      straightNow: "Tiếp tục đi thẳng",
      leftNow: "Rẽ trái ngay bây giờ",
      rightNow: "Rẽ phải ngay bây giờ",
    },
  },

  chat: {
    title: "Trợ lý AI VinhUni",
    subtitle: "Sẵn sàng 24/7",
    clearHistory: "Xóa hội thoại",

    initialGreeting:
      "Chào bạn! Mình là Trợ lý AI của Đại học Vinh. Mình có thể giúp gì cho bạn về quy chế, học bổng, địa điểm học hay thủ tục hành chính hôm nay?",
    placeholder: "Nhập câu hỏi của bạn...",
    sending: "Đang gửi...",
    thinking: "Trợ lý đang suy nghĩ và tổng hợp tài liệu...",
    suggestionsTitle: "Gợi ý câu hỏi phổ biến:",
    errorMsg:
      "Rất tiếc, đã có sự cố khi kết nối với máy chủ AI. Vui lòng thử lại sau giây lát.",
    quickQuestions: [
      "Điều kiện xét học bổng khuyến khích học tập là gì?",
      "Phòng Đào tạo ở nhà nào và làm việc lúc mấy giờ?",
      "Quy trình xin cấp giấy xác nhận sinh viên như thế nào?",
      "Làm thế nào để đăng ký học lại / thi cải thiện điểm?",
    ],
  },

  calendar: {
    title: "Lịch VinhUni",
    subtitle: "Lịch học, thi và sự kiện Đại học Vinh",
    noEvents: "Không có sự kiện nào trong tháng này",
    eventTypeExam: "Lịch thi",
    eventTypeHoliday: "Nghỉ lễ",
    eventTypeAcademic: "Học tập",
    eventTypeEvent: "Sự kiện trường",
    month: "Tháng",
    year: "Năm",
  },

  news: {
    title: "Bảng tin VinhUni",
    subtitle: "Cập nhật thông tin mới nhất từ nhà trường",
    searchNews: "Tìm kiếm tin tức, thông báo...",
    noNewsFound: "Không tìm thấy bài viết nào phù hợp",
    publishedOn: "Đăng ngày",
    author: "Nguồn",
    share: "Chia sẻ",
  },

  handbook: {
    title: "Sổ tay sinh viên",
    subtitle: "Toàn văn quy chế, hướng dẫn và dịch vụ sinh viên",
    searchPlaceholder: "Tìm kiếm quy chế, học phí, biểu mẫu...",
    noDocsFound: "Không tìm thấy tài liệu phù hợp",
    categoryAll: "Tất cả",
    categories: {
      quy_che_dao_tao: "Quy chế đào tạo",
      hoc_phi_hoc_bong: "Học phí & Học bổng",
      cong_tac_sinh_vien: "Công tác sinh viên",
      ho_tro_viec_lam: "Hỗ trợ việc làm",
      doi_song: "Đời sống sinh viên",
      co_so_vat_chat: "Cơ sở vật chất",
      thanh_tich: "Thành tích & Khen thưởng",
      gioi_thieu: "Giới thiệu trường",
      lich_su: "Lịch sử phát triển",
      khac: "Văn bản khác",
    },
  },

  emergency: {
    title: "Liên hệ Khẩn cấp",
    subtitle: "Đường dây nóng hỗ trợ sinh viên 24/7",
    sosButton: "GỌI CỨU TRỢ KHẨN CẤP",
    setupPersonalContact: "Thêm Liên Hệ Người Thân Khẩn Cấp",
    setupPersonalDesc: "Thêm số điện thoại người thân để gửi tin nhắn định vị GPS ngay khi gặp sự cố",
    sendGpsTo: "Gửi Tọa độ GPS Khẩn cấp cho {{name}}",
    editPersonal: "Đổi người thân",
    personalBadge: "Người thân của bạn",
    namePlaceholder: "Tên người thân (VD: Bố, Mẹ, Bạn thân)",
    phonePlaceholder: "Số điện thoại (VD: 0912345678)",
    saveContact: "Lưu Liên Hệ",
    securityTitle: "Ban Bảo vệ & An ninh trật tự",
    medicalTitle: "Trạm Y tế trường",
    studentAffairsTitle: "Phòng Công tác Chính trị - HSSV",
    hotline: "Hotline",
    location: "Vị trí trực",
  },


  language: {
    title: "Ngôn ngữ",
    vietnamese: "Tiếng Việt",
    english: "English",
    changeSuccess: "Đã đổi ngôn ngữ thành công",
  },
};

export type TranslationKeys = typeof vi;
