// Shared status color palette used across the app's feedback UI
// (error highlighting, success/validation banners, etc).
export const STATUS_COLORS = {
  error: { background: "#FEE2E2", text: "#B91C1C" },
  warning: { background: "#FEF3C7", text: "#B45309" },
  success: { background: "#DCFCE7", text: "#15803D" },
  info: { background: "#DBEAFE", text: "#1D4ED8" },
  neutral: { background: "#F3F4F6", text: "#374151" },
};

// Dark-mode equivalents: the light backgrounds above read as washed-out
// glowing boxes on a dark page, so dark mode uses a translucent tint of
// the same hue with a lighter text color instead.
const STATUS_COLORS_DARK = {
  error: { background: "rgba(185, 28, 28, 0.18)", text: "#FCA5A5" },
  warning: { background: "rgba(180, 83, 9, 0.2)", text: "#FBBF6D" },
  success: { background: "rgba(21, 128, 61, 0.18)", text: "#6EE7A0" },
  info: { background: "rgba(29, 78, 216, 0.2)", text: "#93C5FD" },
  neutral: { background: "rgba(148, 163, 184, 0.15)", text: "#CBD5E1" },
};

export const getStatusColors = (mode) =>
  mode === "dark" ? STATUS_COLORS_DARK : STATUS_COLORS;
