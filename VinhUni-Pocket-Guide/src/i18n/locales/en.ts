/**
 * i18n/locales/en.ts
 * English dictionary for VinhUni Pocket Guide mobile app.
 */

import { TranslationKeys } from "./vi";

export const en: TranslationKeys = {
  common: {
    loading: "Loading...",
    error: "An error occurred",
    retry: "Retry",
    search: "Search...",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    close: "Close",
    back: "Back",
    all: "All",
    viewAll: "View all",
    emptyData: "No data available",
    readMore: "Read more",
    callNow: "Call now",
    copied: "Copied to clipboard",
    minutes: "mins",
    meters: "m",
    kilometers: "km",
  },

  tabs: {
    home: "Home",
    map: "Campus Map",
    chat: "AI Assistant",
    calendar: "Calendar",
    news: "News",
    services: "Handbook",
  },

  home: {
    greeting: "Hello,",
    subGreeting: "Have an inspiring and productive day!",
    aiAssistantTitle: "VinhUni AI Assistant",
    aiAssistantDesc: "Ask about academic rules, procedures, campus offices...",
    askNow: "Ask now",
    mapHeroTitle: "Smart 3D Campus",
    mapHeroDesc:
      "Find lecture halls, walking routes and 3D buildings of Vinh University.",
    exploreMap: "Open map",
    quickActions: "Quick Actions",
    actionDepartment: "Departments",
    actionHandbook: "Handbook",
    actionCalendar: "Calendar",
    actionNews: "News",
    actionSos: "SOS Hotline",
    latestNews: "Latest News & Announcements",
    categoriesTitle: "Handbook Categories",
  },

  map: {
    title: "VinhUni Map",
    subtitle: "Vinh University Campus Navigation",
    searchPlaceholder: "Search buildings, departments, halls...",
    routeTitle: "Walking Route",
    startPoint: "Starting point...",
    destinationPoint: "Select destination...",
    yourLocation: "Your current location (GPS)",
    startNavigation: "Start Navigation (Live Turn-by-Turn)",
    stopNavigation: "Exit navigation",
    offRouteAlert: "Off route • Recalculating path...",
    arrivedText: "You have arrived at your destination",
    headingTo: "Heading to",
    remaining: "Remaining",
    distance: "Distance",
    eta: "ETA",
    locationServicesOffTitle: "Location Services Disabled",
    locationServicesOffMsg:
      "Please enable GPS location in your device settings to view your position on the map.",
    locationPermissionDeniedTitle: "Location Permission Denied",
    locationPermissionDeniedMsg:
      "Location permission is required to display your position on campus.",
    understood: "Understood",
    maneuvers: {
      straight: "Go straight for {{distance}}",
      slightLeft: "Slight left in {{distance}}",
      slightRight: "Slight right in {{distance}}",
      left: "Turn left in {{distance}}",
      right: "Turn right in {{distance}}",
      sharpLeft: "Sharp left in {{distance}}",
      sharpRight: "Sharp right in {{distance}}",
      uturn: "Make a U-turn in {{distance}}",
      arrive: "You have arrived at your destination",
      straightNow: "Continue straight ahead",
      leftNow: "Turn left now",
      rightNow: "Turn right now",
    },
  },

  chat: {
    title: "VinhUni AI Assistant",
    subtitle: "Online 24/7",
    clearHistory: "Clear chat",

    initialGreeting:
      "Hello! I am your VinhUni AI Assistant. How can I help you today with university regulations, scholarships, campus locations, or student procedures?",
    placeholder: "Ask me anything...",
    sending: "Sending...",
    thinking: "AI is thinking and synthesizing handbook documents...",
    suggestionsTitle: "Popular Questions:",
    errorMsg:
      "Sorry, could not connect to AI service. Please try again in a moment.",
    quickQuestions: [
      "What are the requirements for academic merit scholarships?",
      "Where is the Academic Affairs Office and what are their hours?",
      "How do I request a student status verification certificate?",
      "How can I register for course retake / grade improvement?",
    ],
  },

  calendar: {
    title: "VinhUni Calendar",
    subtitle: "Academic schedule, exams and campus events",
    noEvents: "No events scheduled for this month",
    eventTypeExam: "Exam Schedule",
    eventTypeHoliday: "Public Holiday",
    eventTypeAcademic: "Academic",
    eventTypeEvent: "Campus Event",
    month: "Month",
    year: "Year",
  },

  news: {
    title: "VinhUni News",
    subtitle: "Official announcements and latest updates",
    searchNews: "Search news and notices...",
    noNewsFound: "No articles match your search",
    publishedOn: "Published on",
    author: "Source",
    share: "Share",
  },

  handbook: {
    title: "Student Handbook",
    subtitle: "Full university regulations, guidelines and student services",
    searchPlaceholder: "Search rules, tuition, forms...",
    noDocsFound: "No documents match your query",
    categoryAll: "All",
    categories: {
      quy_che_dao_tao: "Academic Regulations",
      hoc_phi_hoc_bong: "Tuition & Scholarships",
      cong_tac_sinh_vien: "Student Affairs",
      ho_tro_viec_lam: "Career Support",
      doi_song: "Student Life",
      co_so_vat_chat: "Campus Facilities",
      thanh_tich: "Awards & Honors",
      gioi_thieu: "About VinhUni",
      lich_su: "History & Heritage",
      khac: "Other Documents",
    },
  },

  emergency: {
    title: "Emergency Contacts",
    subtitle: "24/7 Student support hotline",
    sosButton: "CALL EMERGENCY HOTLINE",
    setupPersonalContact: "Add Personal Emergency Contact",
    setupPersonalDesc: "Add a trusted contact to instantly receive your live GPS location during an emergency",
    sendGpsTo: "Send Emergency GPS to {{name}}",
    editPersonal: "Change Contact",
    personalBadge: "Your Trusted Contact",
    namePlaceholder: "Contact Name (e.g. Mom, Dad, Roommate)",
    phonePlaceholder: "Phone Number (e.g. 0912345678)",
    saveContact: "Save Contact",
    securityTitle: "Campus Security & Safety",
    medicalTitle: "University Health Clinic",
    studentAffairsTitle: "Student Affairs Department",
    hotline: "Hotline",
    location: "Duty Station",
  },

  language: {
    title: "Language",
    vietnamese: "Tiếng Việt",
    english: "English",
    changeSuccess: "Language changed successfully",
  },
};
