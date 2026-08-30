import React, { useState, useMemo, useEffect } from "react";
import { Container, Box, ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import JsonFormatterPage from "./pages/JsonFormatterPage";
import ConverterPage from "./pages/ConverterPage";
import JsonDiffPage from "./pages/JsonDiffPage";
import JsonPathTesterPage from "./pages/JsonPathTesterPage";
import { getAppTheme } from "./theme";
import { TOOLS } from "./toolsConfig";
import { jsonToXml } from "./utils/converters/jsonToXml";
import { jsonToCsv } from "./utils/converters/jsonToCsv";
import { jsonToYaml } from "./utils/converters/jsonToYaml";
import { jsonToTypeScript } from "./utils/converters/jsonToTypeScript";
import { jsonToJava } from "./utils/converters/jsonToJava";
import { jsonToCSharp } from "./utils/converters/jsonToCSharp";
import { jsonToSchema } from "./utils/converters/jsonSchema";

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

const tagline = (path) => TOOLS.find((t) => t.path === path)?.tagline;

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

              <Route
                path="/json-formatter"
                element={<JsonFormatterPage title="JSON Formatter" description={tagline("/json-formatter")} />}
              />
              <Route
                path="/json-validator"
                element={<JsonFormatterPage title="JSON Validator" description={tagline("/json-validator")} />}
              />
              <Route
                path="/json-beautifier"
                element={<JsonFormatterPage title="JSON Beautifier" description={tagline("/json-beautifier")} />}
              />
              <Route
                path="/json-viewer"
                element={<JsonFormatterPage title="JSON Viewer" description={tagline("/json-viewer")} />}
              />
              <Route
                path="/json-minifier"
                element={<JsonFormatterPage title="JSON Minifier" description={tagline("/json-minifier")} />}
              />

              <Route
                path="/json-diff"
                element={<JsonDiffPage title="JSON Diff" description={tagline("/json-diff")} />}
              />
              <Route
                path="/json-compare"
                element={<JsonDiffPage title="JSON Compare" description={tagline("/json-compare")} />}
              />

              <Route
                path="/jsonpath-tester"
                element={<JsonPathTesterPage title="JSONPath Tester" description={tagline("/jsonpath-tester")} />}
              />

              <Route
                path="/json-schema-generator"
                element={
                  <ConverterPage
                    title="JSON Schema Generator"
                    description={tagline("/json-schema-generator")}
                    convert={jsonToSchema}
                    outputLanguage="json"
                    successMessage="Schema generated"
                  />
                }
              />
              <Route
                path="/json-to-xml"
                element={
                  <ConverterPage
                    title="JSON to XML"
                    description={tagline("/json-to-xml")}
                    convert={jsonToXml}
                    outputLanguage="xml"
                    successMessage="Converted to XML"
                  />
                }
              />
              <Route
                path="/json-to-csv"
                element={
                  <ConverterPage
                    title="JSON to CSV"
                    description={tagline("/json-to-csv")}
                    convert={jsonToCsv}
                    outputLanguage="plaintext"
                    successMessage="Converted to CSV"
                  />
                }
              />
              <Route
                path="/json-to-yaml"
                element={
                  <ConverterPage
                    title="JSON to YAML"
                    description={tagline("/json-to-yaml")}
                    convert={jsonToYaml}
                    outputLanguage="yaml"
                    successMessage="Converted to YAML"
                  />
                }
              />
              <Route
                path="/json-to-typescript"
                element={
                  <ConverterPage
                    title="JSON to TypeScript"
                    description={tagline("/json-to-typescript")}
                    convert={(data) => jsonToTypeScript(data)}
                    outputLanguage="typescript"
                    successMessage="Interface generated"
                  />
                }
              />
              <Route
                path="/json-to-java"
                element={
                  <ConverterPage
                    title="JSON to Java"
                    description={tagline("/json-to-java")}
                    convert={(data) => jsonToJava(data)}
                    outputLanguage="java"
                    successMessage="Class generated"
                  />
                }
              />
              <Route
                path="/json-to-csharp"
                element={
                  <ConverterPage
                    title="JSON to C#"
                    description={tagline("/json-to-csharp")}
                    convert={(data) => jsonToCSharp(data)}
                    outputLanguage="csharp"
                    successMessage="Class generated"
                  />
                }
              />

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
