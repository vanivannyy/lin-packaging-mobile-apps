// Identitas visual Lin Packaging: navy premium + aksen emas (beda dari palet flat
// biru generik BigSeller), dipakai konsisten di semua layar mobile.
export const COLORS = {
  primary: "#12245c", // navy dalam, warna utama brand
  primarySoft: "#1e3a8a",
  primaryGradientEnd: "#1e40af",
  accent: "#d4a017", // emas "premium" — ciri khas Lin Packaging
  accentSoft: "#fdf1d6",
  bg: "#f4f5fa",
  card: "#ffffff",
  border: "#e6e8f0",
  textPrimary: "#101426",
  textSecondary: "#667085",
  textMuted: "#98a2b3",
  success: "#0f9d58",
  successSoft: "#e3f8ec",
  danger: "#d92d20",
  dangerSoft: "#fdeceb",
  warning: "#b54708",
  warningSoft: "#fdf1d6",
  info: "#2563eb",
  infoSoft: "#e8effe",
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const SHADOW = {
  card: {
    shadowColor: "#0f1533",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
} as const;
