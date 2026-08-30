import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  IconButton,
  Snackbar,
  useTheme,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import Editor from "@monaco-editor/react";
import { getStatusColors } from "../utils/statusColors";

const SUCCESS_MESSAGE_DURATION_MS = 10000;

const OutputViewer = ({
  output,
  error,
  language = "json",
  successMessage = "Valid JSON",
  label = "Formatted Output",
}) => {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const theme = useTheme();
  const statusColors = getStatusColors(theme.palette.mode);
  const isValid = !error && !!output;

  // The "Valid JSON" message only needs to confirm the moment things
  // became valid -- auto-hide it after a while so it doesn't linger
  // indefinitely (errors stay visible until fixed, since those need
  // ongoing attention).
  useEffect(() => {
    if (!isValid) {
      setShowSuccess(false);
      return;
    }

    setShowSuccess(true);
    const timer = setTimeout(() => setShowSuccess(false), SUCCESS_MESSAGE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isValid, output]);

  const copyToClipboard = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        height: "100%",
        minHeight: 0,
      }}
    >
      <Typography variant="h6">{label}</Typography>

      {/* Copy button with toggle icon */}
      <IconButton
        onClick={copyToClipboard}
        sx={{ position: "absolute", top: 10, right: 10 }}
      >
        {copied ? (
          <CheckCircleIcon color="success" />
        ) : copyFailed ? (
          <ErrorIcon color="error" />
        ) : (
          <ContentCopyIcon />
        )}
      </IconButton>

      {/* Error panel */}
      {error && (
        <div
          style={{
            background: statusColors.error.background,
            color: statusColors.error.text,
            padding: 10,
            borderRadius: 6,
            marginTop: 10,
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          <strong>❌ Error:</strong> {error.message}
          <br />
          {error.line && <>📍 Line: {error.line}<br /></>}
          {error.column && <>📌 Column: {error.column}<br /></>}
          {error.suggestion && <div>💡 Fix: {error.suggestion}</div>}
        </div>
      )}

      {/* Success panel */}
      {isValid && showSuccess && (
        <div
          style={{
            background: statusColors.success.background,
            color: statusColors.success.text,
            padding: 10,
            borderRadius: 6,
            marginTop: 10,
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          ✅ {successMessage}
        </div>
      )}

      {/* Output editor */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          defaultLanguage={language}
          value={output || ""}
          theme={theme.palette.mode === "dark" ? "vs-dark" : "light"}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            folding: true,
            renderLineHighlight: "all",
          }}
        />
      </div>

      <Snackbar
        open={copied}
        message="✅ Copied to clipboard"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
      <Snackbar
        open={copyFailed}
        message="❌ Copy failed — clipboard unavailable"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Paper>
  );
};

export default OutputViewer;
