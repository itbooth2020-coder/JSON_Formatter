import React, { useEffect, useRef } from "react";
import { Paper, Typography, useTheme } from "@mui/material";
import Editor from "@monaco-editor/react";

const JsonEditor = ({ value, onChange, errorLine, label = "Input JSON" }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIdsRef = useRef([]);
  const theme = useTheme();

  const isDark = theme.palette.mode === "dark";

  const applyErrorDecoration = (line) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const decorations = line
      ? [
          {
            range: new monaco.Range(line, 1, line, 1),
            options: {
              isWholeLine: true,
              className: isDark
                ? "json-editor-error-line-dark"
                : "json-editor-error-line",
              linesDecorationsClassName: isDark
                ? "json-editor-error-line-margin-dark"
                : "json-editor-error-line-margin",
            },
          },
        ]
      : [];

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      decorations
    );
  };

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    applyErrorDecoration(errorLine);
  };

  useEffect(() => {
    applyErrorDecoration(errorLine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorLine, isDark]);

  return (
    <Paper
      sx={{
        p: 2,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Typography variant="h6">{label}</Typography>

      <Editor
        height="100%"
        defaultLanguage="json"
        value={value}
        theme={theme.palette.mode === "dark" ? "vs-dark" : "light"}
        onChange={(val) => onChange(val)}
        onMount={handleMount}
        options={{
            minimap: { enabled: false },
            fontSize: 14,
            formatOnPaste: true,
            formatOnType: true,
            automaticLayout: true,
            lineNumbers: "on",          // ✅ enable line numbers
            glyphMargin: true,
            folding: true,
            scrollBeyondLastLine: false,
        }}
        />
    </Paper>
  );
};

export default JsonEditor;
