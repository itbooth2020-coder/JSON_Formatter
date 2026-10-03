import React, { useEffect, useRef } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import Editor from "@monaco-editor/react";

const JsonEditor = ({ value, onChange, errorLine, label = "Input JSON", headerAction }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationIdsRef = useRef([]);
  const containerRef = useRef(null);
  const layoutRafRef = useRef(null);
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
    // The container's own ResizeObserver (below) fires its one "initial
    // size" notification as soon as this component mounts -- almost always
    // *before* Monaco itself finishes loading/mounting (editorRef.current
    // is still null then), so that one chance to lay out at the correct
    // size is wasted and the editor stays at its placeholder size until
    // some later real resize happens. Force one layout pass right here,
    // once Monaco is actually ready, so it's correctly sized from the start.
    requestAnimationFrame(() => editor.layout());
  };

  useEffect(() => {
    applyErrorDecoration(errorLine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorLine, isDark]);

  // Monaco's own `automaticLayout: true` re-measures and calls
  // `editor.layout()` *synchronously inside its own internal
  // ResizeObserver callback*, which itself resizes the editor's DOM in the
  // same frame the observer fired. When the container is being resized
  // rapidly (e.g. dragging the JsonVisualizerPage split-pane handle, which
  // changes both panes' widths on every pointermove), that same-frame
  // observe -> mutate -> observe cycle trips the browser's "ResizeObserver
  // loop completed with undelivered notifications" protection -- a benign
  // warning in production, but one CRA's dev error overlay (incorrectly)
  // surfaces as an uncaught runtime error. Using our own ResizeObserver and
  // deferring the layout call to the next animation frame breaks that
  // synchronous loop while keeping the editor correctly sized (including on
  // window resize, which `automaticLayout` also used to handle).
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => {
      if (layoutRafRef.current) cancelAnimationFrame(layoutRafRef.current);
      layoutRafRef.current = requestAnimationFrame(() => {
        layoutRafRef.current = null;
        editorRef.current?.layout();
      });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (layoutRafRef.current) cancelAnimationFrame(layoutRafRef.current);
    };
  }, []);

  return (
    <Paper
      sx={{
        p: 2,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        // Explicit rather than relying solely on CssBaseline's global reset
        // -- the padding (p: 2) must be subtracted from, not added on top
        // of, the 100% height below, or this Paper renders taller than its
        // pane and gets silently clipped by the Panel's overflow:hidden
        // (clipping Monaco's own measured container along with it).
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6">{label}</Typography>
        {headerAction}
      </Box>

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          // A definite, directly-positioned containing block for the
          // absolutely-positioned wrapper below -- more robust than relying
          // on flex stretch alone to resolve Editor's height="100", and
          // `overflow: hidden` guarantees this element itself never visually
          // overflows its own box even if Monaco's internal measurement is
          // ever a pixel off.
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", inset: 0 }}>
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
              automaticLayout: false,
              lineNumbers: "on",          // ✅ enable line numbers
              glyphMargin: true,
              folding: true,
              scrollBeyondLastLine: false,
              // Monaco's content height is `lineCount * lineHeight` with no
              // bottom cushion by default -- for almost any container
              // height that isn't an exact multiple of the (19px) line
              // height, that leaves the last line's bottom few pixels sitting
              // flush against (or a hair past) the viewport edge, revealed
              // only by dragging an ~8px sliver of scrollbar most users will
              // never notice is there. A real bottom padding guarantees the
              // last line always has visible breathing room once scrolled
              // into view, and makes any genuine overflow's scrollbar
              // obviously draggable instead of a near-invisible hairline.
              padding: { top: 8, bottom: 12 },
            }}
            />
        </Box>
      </Box>
    </Paper>
  );
};

export default JsonEditor;
