// Value-type color coding for graph node rows (string/number/boolean/null),
// following the exact light/dark-variant pattern src/utils/statusColors.js
// already uses. Kept as a sibling file rather than folded into
// statusColors.js since this maps JSON *value types*, not success/error
// status semantics.
export const TYPE_COLORS = {
  string: "#15803D", // green
  number: "#1D4ED8", // blue
  boolean: "#B45309", // orange
  null: "#6B7280", // neutral gray
};

const TYPE_COLORS_DARK = {
  string: "#6EE7A0",
  number: "#93C5FD",
  boolean: "#FBBF6D",
  null: "#9CA3AF",
};

export const getTypeColors = (mode) => (mode === "dark" ? TYPE_COLORS_DARK : TYPE_COLORS);

// Short non-color label shown next to each row so type information isn't
// color-only (accessibility -- see plan §9).
export const TYPE_LABELS = {
  string: "str",
  number: "num",
  boolean: "bool",
  null: "null",
};
