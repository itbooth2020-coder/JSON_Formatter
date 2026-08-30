import { createTheme } from "@mui/material/styles";

// Brand palette. Indigo primary (distinct from MUI's stock default blue),
// slate neutrals, and the same semantic status colors already used for
// error/success feedback (src/utils/statusColors.js) so the whole app
// reads as one consistent system.
const BRAND = {
  primary: "#4F46E5",
  primaryLight: "#818CF8",
  primaryDark: "#3730A3",
};

export const getAppTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: BRAND.primary,
        light: BRAND.primaryLight,
        dark: BRAND.primaryDark,
        contrastText: "#ffffff",
      },
      ...(mode === "light"
        ? {
            background: { default: "#F7F8FA", paper: "#FFFFFF" },
            text: { primary: "#1B2430", secondary: "#5B6572" },
            divider: "#E3E7ED",
          }
        : {
            background: { default: "#0F172A", paper: "#171E28" },
            text: { primary: "#E7EBF1", secondary: "#A7B0BE" },
            divider: "#2A3341",
          }),
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: "none" },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: mode === "light" ? BRAND.primary : "#0B1020",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
