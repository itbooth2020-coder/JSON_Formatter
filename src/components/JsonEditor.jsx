import React, { useEffect, useRef } from "react";
import { Paper, Typography } from "@mui/material";
import Editor from "@monaco-editor/react";

const JsonEditor = ({ value, onChange, errorLine }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIdsRef = useRef([]);

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
              className: "json-editor-error-line",
              linesDecorationsClassName: "json-editor-error-line-margin",
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
  }, [errorLine]);

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
      <Typography variant="h6">Input JSON</Typography>

      <Editor
        height="100%"
        defaultLanguage="json"
        value={value}
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
