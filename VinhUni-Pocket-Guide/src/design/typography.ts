import { Platform } from 'react-native';

/**
 * VinhUni Pocket Guide — Design Token: Typography
 *
 * Strategy:
 * - Display/heading: dùng font hệ thống bold weight (iOS: San Francisco, Android: Roboto)
 *   với letter-spacing âm cho cảm giác "tight & premium"
 * - Body: line-height rộng rãi 1.6x size để dễ đọc tài liệu Markdown dài
 * - Caption/label: tracking nhẹ, dễ tách biệt với body
 *
 * Không thêm custom font để không tăng bundle size và tránh FOUT.
 * Tận dụng font-weight hierarchy + letter-spacing thay thế.
 */
export const typography = {
  fontFamily: {
    // Dùng font hệ thống chất lượng cao có sẵn
    regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    medium: Platform.select({ ios: 'System', android: 'Roboto-Medium', default: 'System' }),
    semibold: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }),
    bold: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }),
  },

  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 30,
    display: 36,
  },

  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,   // 1.6x md — tốt cho body text
    lg: 26,
    xl: 30,
    xxl: 34,
    xxxl: 42,
    display: 48,
  },

  letterSpacing: {
    tight: -0.5,    // Display headings
    normal: 0,
    wide: 0.3,      // Labels, captions
    wider: 0.8,     // Uppercase tags, badges
  },

  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;