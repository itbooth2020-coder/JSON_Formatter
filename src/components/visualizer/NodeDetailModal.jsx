import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Typography,
  Box,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import Editor from "@monaco-editor/react";
import { useTheme } from "@mui/material/styles";
import { getValueAtPath } from "../../utils/jsonGraph";

// Click-node modal: shows that node's subtree as formatted JSON plus its
// JSON path, with a copy button mirroring OutputViewer's copied/copyFailed
// Snackbar pattern.
const NodeDetailModal = ({ open, node, rootValue, onClose, container }) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const formatted = useMemo(() => {
    if (!node) return "";
    const value = getValueAtPath(rootValue, node.path);
    return value === undefined ? "" : JSON.stringify(value, null, 2);
  }, [node, rootValue]);

  const copyToClipboard = async () => {
    if (!formatted) return;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2000);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      // While the graph canvas is in full screen, only that element (and
      // its descendants) is actually presented by the browser -- a Dialog
      // portaled to its default document.body root would be invisible, so
      // JsonVisualizerPage redirects the portal there via this prop when
      // relevant (undefined the rest of the time, which keeps the normal
      // document.body portal behavior).
      container={container}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="subtitle1" component="span" sx={{ fontWeight: 700, flex: 1 }}>
          {node?.label ?? "root"}
        </Typography>
        <IconButton onClick={copyToClipboard} aria-label="Copy node JSON" size="small">
          {copied ? (
            <CheckCircleIcon color="success" fontSize="small" />
          ) : copyFailed ? (
            <ErrorIcon color="error" fontSize="small" />
          ) : (
            <ContentCopyIcon fontSize="small" />
          )}
        </IconButton>
        <IconButton onClick={onClose} aria-label="Close dialog" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="caption" color="text.secondary">
            Path
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
            {node?.path}
          </Typography>
        </Box>
        <Box sx={{ height: 320 }}>
          <Editor
            height="100%"
            defaultLanguage="json"
            value={formatted}
            theme={theme.palette.mode === "dark" ? "vs-dark" : "light"}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

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
    </Dialog>
  );
};

export default NodeDetailModal;
