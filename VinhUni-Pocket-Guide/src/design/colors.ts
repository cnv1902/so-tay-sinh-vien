/**
 * VinhUni Pocket Guide — Design Token: Colors
 *
 * Bảng màu lấy cảm hứng từ bản sắc Đại học Vinh:
 * - Primary: Indigo Navy (#1E3A5F) — tông học thuật, trang trọng, như màu đồng phục và logo nhiều ĐH uy tín
 * - Accent: Amber Gold (#C8943A)  — màu vàng đồng ánh kim, tạo điểm nhấn sang trọng, tương phản tốt
 * - Surface: Trắng ngà ấm (#FAFBFC) — không lạnh, dễ đọc lâu
 * - Tránh: Sky-blue neon, đỏ tươi đơn sắc, cream + serif
 */
export const colors = {
  // Primary — Indigo Navy (màu chủ đạo học thuật)
  primary: "#1E3A5F",
  primaryDark: "#132840",
  primaryLight: "#EBF0F7",
  primaryMid: "#2E5088",

  // Accent — Amber Gold (điểm nhấn sang trọng)
  accent: "#C8943A",
  accentLight: "#FDF4E7",
  accentDark: "#A07628",

  // Surfaces
  background: "#F4F6F9",
  surface: "#FFFFFF",
  surfaceElevated: "#FAFBFC",
  surfaceBlur: "rgba(255, 255, 255, 0.82)",

  // Text
  textPrimary: "#0D1B2A",
  textSecondary: "#4A6080",
  textTertiary: "#8FA3BF",
  textOnPrimary: "#FFFFFF",
  textOnAccent: "#FFFFFF",

  // Semantic
  success: "#1A7A4A",
  successLight: "#E6F5ED",
  warning: "#C8943A",
  warningLight: "#FDF4E7",
  danger: "#C0392B",
  dangerLight: "#FDECEA",
  error: "#C0392B",

  // Borders & Dividers
  border: "rgba(30, 58, 95, 0.10)",
  divider: "#ECF0F5",
  borderStrong: "rgba(30, 58, 95, 0.18)",

  // Overlay
  overlay: "rgba(13, 27, 42, 0.52)",
  overlayLight: "rgba(13, 27, 42, 0.25)",

  // Utility
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;
