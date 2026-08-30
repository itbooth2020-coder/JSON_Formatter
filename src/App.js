import React, { useState, useMemo, useEffect } from "react";
import { Container, Box, ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import JsonFormatterRoute from "./pages/json-formatter";
import JsonValidatorRoute from "./pages/json-validator";
import JsonBeautifierRoute from "./pages/json-beautifier";
import JsonViewerRoute from "./pages/json-viewer";
import JsonMinifierRoute from "./pages/json-minifier";
import JsonDiffRoute from "./pages/json-diff";
import JsonCompareRoute from "./pages/json-compare";
import JsonPathTesterRoute from "./pages/jsonpath-tester";
import JsonSchemaGeneratorRoute from "./pages/json-schema-generator";
import JsonToXmlRoute from "./pages/json-to-xml";
import JsonToCsvRoute from "./pages/json-to-csv";
import JsonToYamlRoute from "./pages/json-to-yaml";
import JsonToTypeScriptRoute from "./pages/json-to-typescript";
import JsonToJavaRoute from "./pages/json-to-java";
import JsonToCSharpRoute from "./pages/json-to-csharp";
import { getAppTheme } from "./theme";

const THEME_STORAGE_KEY = "jsonforge:theme-mode";

const getInitialMode = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable (private browsing, etc.) -- fall through
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

function App() {
  const [mode, setMode] = useState(getInitialMode);
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore write failures
    }
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <Header mode={mode} onToggleMode={toggleMode} />

          <Container
            maxWidth={false}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              py: 2,
              px: { xs: 2, sm: 3, lg: 4 },
            }}
          >
            <Routes>
              <Route path="/" element={<HomePage />} />

              <Route path="/json-formatter" element={<JsonFormatterRoute />} />
              <Route path="/json-validator" element={<JsonValidatorRoute />} />
              <Route path="/json-beautifier" element={<JsonBeautifierRoute />} />
              <Route path="/json-viewer" element={<JsonViewerRoute />} />
              <Route path="/json-minifier" element={<JsonMinifierRoute />} />

              <Route path="/json-diff" element={<JsonDiffRoute />} />
              <Route path="/json-compare" element={<JsonCompareRoute />} />

              <Route path="/jsonpath-tester" element={<JsonPathTesterRoute />} />

              <Route path="/json-schema-generator" element={<JsonSchemaGeneratorRoute />} />
              <Route path="/json-to-xml" element={<JsonToXmlRoute />} />
              <Route path="/json-to-csv" element={<JsonToCsvRoute />} />
              <Route path="/json-to-yaml" element={<JsonToYamlRoute />} />
              <Route path="/json-to-typescript" element={<JsonToTypeScriptRoute />} />
              <Route path="/json-to-java" element={<JsonToJavaRoute />} />
              <Route path="/json-to-csharp" element={<JsonToCSharpRoute />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Container>

          <Footer />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
