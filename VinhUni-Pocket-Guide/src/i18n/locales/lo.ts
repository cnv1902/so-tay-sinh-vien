/**
 * i18n/locales/lo.ts
 * ປຶ້ມວັດຈະນານຸກົມພາສາລາວສຳລັບແອັບ VinhUni Pocket Guide (ສະເພາະນັກສຶກສາລາວ).
 */

import { TranslationKeys } from "./vi";

export const lo: TranslationKeys = {
  common: {
    loading: "ກຳລັງໂຫລດ...",
    error: "ເກີດຂໍ້ຜິດພາດ",
    retry: "ລອງໃໝ່",
    search: "ຄົ້ນຫາ...",
    cancel: "ຍົກເລີກ",
    confirm: "ຢືນຢັນ",
    save: "ບັນທຶກ",
    close: "ປິດ",
    back: "ກັບຄືນ",
    all: "ທັງໝົດ",
    viewAll: "ເບິ່ງທັງໝົດ",
    emptyData: "ບໍ່ມີຂໍ້ມູນ",
    readMore: "ອ່ານຕໍ່",
    callNow: "ໂທດຽວນີ້",
    copied: "ສຳເນົາໃສ່ຄລິບບອດແລ້ວ",
    minutes: "ນາທີ",
    meters: "ມ",
    kilometers: "ກມ",
  },

  tabs: {
    home: "ໜ້າຫຼັກ",
    map: "ແຜນທີ່",
    chat: "ຜູ້ຊ່ວຍ AI",
    calendar: "ປະຕິທິນ",
    news: "ຂ່າວສານ",
    services: "ປຶ້ມຄູ່ມື",
  },

  home: {
    greeting: "ສະບາຍດີ,",
    subGreeting: "ຂໍໃຫ້ເປັນມື້ທີ່ດີໃນການຮຽນ!",
    aiAssistantTitle: "ຜູ້ຊ່ວຍ AI VinhUni",
    aiAssistantDesc: "ຖາມ-ຕອບກ່ຽວກັບລະບຽບການ, ທຶນການສຶກສາ, ທີ່ຕັ້ງຫ້ອງການ...",
    askNow: "ຖາມເລີຍ",
    mapHeroTitle: "ວິທະຍາເຂດ 3D ອັດສະລິຍະ",
    mapHeroDesc:
      "ຊອກຫາຫ້ອງຮຽນ, ເສັ້ນທາງຍ່າງ ແລະ ເບິ່ງແຜນຜັງ 3D ຂອງມະຫາວິທະຍາໄລວິ້ງ.",
    exploreMap: "ເປີດແຜນທີ່",
    quickActions: "ເຂົ້າເຖິງດ່ວນ",
    actionDepartment: "ພະແນກ",
    actionHandbook: "ປຶ້ມຄູ່ມື",
    actionCalendar: "ຕາຕະລາງ",
    actionNews: "ຂ່າວສານ",
    actionSos: "ຊ່ວຍເຫຼືອ SOS",
    latestNews: "ຂ່າວສານ & ແຈ້ງການໃໝ່",
    categoriesTitle: "ໝວດໝູ່ປຶ້ມຄູ່ມື",
  },

  map: {
    title: "ແຜນທີ່ VinhUni",
    subtitle: "ແຜນທີ່ວິທະຍາເຂດມະຫາວິທະຍາໄລວິ້ງ",
    searchPlaceholder: "ຄົ້ນຫາອາຄານ, ພະແນກ, ຫ້ອງຮຽນ...",
    routeTitle: "ເສັ້ນທາງການເດີນທາງ",
    startPoint: "ຈຸດເລີ່ມຕົ້ນ...",
    destinationPoint: "ເລືອກຈຸດໝາຍປາຍທາງ...",
    yourLocation: "ຕຳແໜ່ງຂອງທ່ານ (GPS)",
    startNavigation: "ເລີ່ມຕົ້ນການນຳທາງ (3D Live)",
    stopNavigation: "ຢຸດການນຳທາງ",
    offRouteAlert: "ອອກນອກເສັ້ນທາງ • ກຳລັງອັບເດດ...",
    arrivedText: "ທ່ານໄດ້ມາຮອດຈຸດໝາຍແລ້ວ",
    headingTo: "ມຸ່ງໜ້າສູ່",
    remaining: "ຍັງເຫຼືອ",
    distance: "ໄລຍະທາງ",
    eta: "ເວລາ",
    locationServicesOffTitle: "ບໍລິການສະຖານທີ່ປິດຢູ່",
    locationServicesOffMsg:
      "ກະລຸນາເປີດ GPS ໃນການຕັ້ງຄ່າເພື່ອສະແດງຕຳແໜ່ງຂອງທ່ານໃນແຜນທີ່.",
    locationPermissionDeniedTitle: "ຍັງບໍ່ໄດ້ຮັບອະນຸຍາດສະຖານທີ່",
    locationPermissionDeniedMsg:
      "ທ່ານຕ້ອງອະນຸຍາດເຂົ້າເຖິງສະຖານທີ່ເພື່ອສະແດງຕຳແໜ່ງໃນວິທະຍາເຂດ.",
    understood: "ເຂົ້າໃຈແລ້ວ",
    maneuvers: {
      straight: "ກົງໄປ {{distance}}",
      slightLeft: "ລ້ຽວຊ້າຍເລັກນ້ອຍຫຼັງຈາກ {{distance}}",
      slightRight: "ລ້ຽວຂວາເລັກນ້ອຍຫຼັງຈາກ {{distance}}",
      left: "ລ້ຽວຊ້າຍຫຼັງຈາກ {{distance}}",
      right: "ລ້ຽວຂວາຫຼັງຈາກ {{distance}}",
      sharpLeft: "ລ້ຽວຊ້າຍຢ່າງກະທັນຫັນຫຼັງຈາກ {{distance}}",
      sharpRight: "ລ້ຽວຂວາຢ່າງກະທັນຫັນຫຼັງຈາກ {{distance}}",
      uturn: "ລ້ຽວກັບຫຼັງຈາກ {{distance}}",
      arrive: "ທ່ານໄດ້ມາຮອດຈຸດໝາຍແລ້ວ",
      straightNow: "ສືບຕໍ່ກົງໄປ",
      leftNow: "ລ້ຽວຊ້າຍດຽວນີ້",
      rightNow: "ລ້ຽວຂວາດຽວນີ້",
    },
  },

  chat: {
    title: "ຜູ້ຊ່ວຍ AI VinhUni",
    subtitle: "ຊ່ຽວຊານຊ່ວຍເຫຼືອນັກສຶກສາ 24/7",
    clearHistory: "ລຶບປະຫວັດສົນທະນາ",
    initialGreeting:
      "ສະບາຍດີ! ຂ້ອຍແມ່ນຜູ້ຊ່ວຍ AI ຂອງມະຫາວິທະຍາໄລວິ້ງ. ຂ້ອຍສາມາດຊ່ວຍຫຍັງເຈົ້າກ່ຽວກັບລະບຽບການ, ທຶນການສຶກສາ, ສະຖານທີ່ ຫຼື ຂັ້ນຕອນຕ່າງໆໃນມື້ນີ້?",
    placeholder: "ພິມຄຳຖາມຂອງທ່ານ...",
    sending: "ກຳລັງສົ່ງ...",
    thinking: "ຜູ້ຊ່ວຍ AI ກຳລັງຄິດ ແລະ ສັງເຄາະຂໍ້ມູນ...",
    suggestionsTitle: "ຄຳຖາມທີ່ພົບເລື້ອຍ:",
    errorMsg:
      "ຂໍອະໄພ, ມີຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່ກັບເຊີບເວີ AI. ກະລຸນາລອງໃໝ່ອີກຄັ້ງ.",
    quickQuestions: [
      "ເງື່ອນໄຂການຮັບທຶນການສຶກສາແມ່ນຫຍັງ?",
      "ຫ້ອງການວິຊາການຢູ່ອາຄານໃດ ແລະ ເຮັດວຽກຈັກໂມງ?",
      "ຂັ້ນຕອນການຂໍໃບຢັ້ງຢືນນັກສຶກສາມີຄືແນວໃດ?",
      "ວິທີການລົງທະບຽນຮຽນຄືນ / ສອບເສັງປັບປຸງຄະແນນ?",
    ],
  },

  calendar: {
    title: "ປະຕິທິນ VinhUni",
    subtitle: "ຕາຕະລາງຮຽນ, ການສອບເສັງ ແລະ ກິດຈະກຳ",
    noEvents: "ບໍ່ມີກິດຈະກຳໃນເດືອນນີ້",
    eventTypeExam: "ຕາຕະລາງສອບເສັງ",
    eventTypeHoliday: "ວັນພັກລັດຖະການ",
    eventTypeAcademic: "ການຮຽນການສອນ",
    eventTypeEvent: "ກິດຈະກຳໂຮງຮຽນ",
    month: "ເດືອນ",
    year: "ປີ",
  },

  news: {
    title: "ຂ່າວສານ VinhUni",
    subtitle: "ອັບເດດຂໍ້ມູນໃໝ່ລ່າສຸດຈາກມະຫາວິທະຍາໄລ",
    searchNews: "ຄົ້ນຫາຂ່າວສານ, ແຈ້ງການ...",
    noNewsFound: "ບໍ່ພົບຂ່າວສານທີ່ກົງກັນ",
    publishedOn: "ວັນທີໂພສ",
    author: "ແຫຼ່ງຂໍ້ມູນ",
    share: "ແບ່ງປັນ",
  },

  handbook: {
    title: "ປຶ້ມຄູ່ມືນັກສຶກສາ",
    subtitle: "ລະບຽບການ, ຄຳແນະນຳ ແລະ ການບໍລິການນັກສຶກສາ",
    searchPlaceholder: "ຄົ້ນຫາລະບຽບການ, ຄ່າຮຽນ, ແບບຟອມ...",
    noDocsFound: "ບໍ່ພົບເອກະສານທີ່ກົງກັນ",
    categoryAll: "ທັງໝົດ",
    categories: {
      quy_che_dao_tao: "ລະບຽບການຝຶກອົບຮົມ",
      hoc_phi_hoc_bong: "ຄ່າຮຽນ & ທຶນການສຶກສາ",
      cong_tac_sinh_vien: "ວຽກງານນັກສຶກສາ",
      ho_tro_viec_lam: "ສະໜັບສະໜູນວຽກເຮັດງານທຳ",
      doi_song: "ຊີວິດນັກສຶກສາ",
      co_so_vat_chat: "ສິ່ງອຳນວຍຄວາມສະດວກ",
      thanh_tich: "ຜົນງານ & ຍ້ອງຍໍ",
      gioi_thieu: "ແນະນຳມະຫາວິທະຍາໄລ",
      lich_su: "ປະຫວັດຄວາມເປັນມາ",
      khac: "ເອກະສານອື່ນໆ",
    },
  },

  emergency: {
    title: "ຕິດຕໍ່ສຸກເສີນ",
    subtitle: "ສາຍດ່ວນຊ່ວຍເຫຼືອນັກສຶກສາ 24/7",
    sosButton: "ໂທສຸກເສີນ SOS",
    setupPersonalContact: "ເພີ່ມຜູ້ຕິດຕໍ່ສຸກເສີນສ່ວນຕົວ",
    setupPersonalDesc: "ເພີ່ມເບີໂທຍາດພີ່ນ້ອງເພື່ອສົ່ງຕຳແໜ່ງ GPS ທັນທີເມື່ອເກີດເຫດສຸກເສີນ",
    sendGpsTo: "ສົ່ງ GPS ສຸກເສີນຫາ {{name}}",
    editPersonal: "ປ່ຽນເບີໂທ",
    personalBadge: "ຍາດພີ່ນ້ອງຂອງທ່ານ",
    namePlaceholder: "ຊື່ຍາດພີ່ນ້ອງ (ຕົວຢ່າງ: ພໍ່, ແມ່, ໝູ່ສະໜິດ)",
    phonePlaceholder: "ເບີໂທລະສັບ (ຕົວຢ່າງ: 020...)",
    saveContact: "ບັນທຶກ",
    securityTitle: "ໜ່ວຍງານປ້ອງກັນຄວາມສະຫງົບ",
    medicalTitle: "ຫ້ອງພະຍາບານ",
    studentAffairsTitle: "ຫ້ອງການວຽກງານນັກສຶກສາ",
    hotline: "ສາຍດ່ວນ",
    location: "ສະຖານທີ່ປະຈຳການ",
  },


  language: {
    title: "ພາສາ",
    vietnamese: "Tiếng Việt",
    english: "English",
    changeSuccess: "ປ່ຽນພາສາສຳເລັດແລ້ວ",
  },
};
