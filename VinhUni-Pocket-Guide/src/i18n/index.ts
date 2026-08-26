/**
 * i18n/index.ts
 * =============
 * Cấu hình hệ thống đa ngôn ngữ i18next cho VinhUni Pocket Guide.
 * Tự động ghi nhớ lựa chọn ngôn ngữ qua AsyncStorage.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { vi } from './locales/vi';
import { en } from './locales/en';
import { lo } from './locales/lo';

const LANGUAGE_KEY = '@vinhuni_app_language';

export const resources = {
  vi: { translation: vi },
  en: { translation: en },
  lo: { translation: lo },
} as const;

export type SupportedLanguage = 'vi' | 'en' | 'lo';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi', // Ngôn ngữ mặc định: Tiếng Việt
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false, // React Native đã tự động escape XSS
    },
    compatibilityJSON: 'v4',
  });

// Khôi phục ngôn ngữ đã lưu khi mở app (chỉ chạy trên Client/Native để tránh lỗi SSR Node.js)
if (typeof window !== 'undefined' || typeof navigator !== 'undefined') {
  try {
    AsyncStorage.getItem(LANGUAGE_KEY).then((savedLang) => {
      if (savedLang && (savedLang === 'vi' || savedLang === 'en' || savedLang === 'lo')) {
        i18n.changeLanguage(savedLang);
      }
    }).catch((err) => {
      // Bỏ qua lỗi storage trên môi trường server/SSR
    });
  } catch (e) {
    // Ignore in non-client context
  }
}

// Hàm hỗ trợ đổi ngôn ngữ và lưu vào storage
export const changeAppLanguage = async (lng: SupportedLanguage) => {
  try {
    await i18n.changeLanguage(lng);
    if (typeof window !== 'undefined' || typeof navigator !== 'undefined') {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    }
  } catch (error) {
    console.error('Lỗi khi đổi ngôn ngữ:', error);
  }
};


export default i18n;
