import React, { useState } from "react";
import {
  Paper,
  Typography,
  IconButton,
  Snackbar,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import Editor from "@monaco-editor/react";
import { STATUS_COLORS } from "../utils/statusColors";

const OutputViewer = ({ output, error }) => {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

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
      <Typography variant="h6">Formatted Output</Typography>

      {/* ✅ Copy Button with toggle icon */}
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

      {/* ✅ Error UI */}
      {error && (
        <div
          style={{
            background: STATUS_COLORS.error.background,
            color: STATUS_COLORS.error.text,
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

      {/* ✅ Success UI */}
      {!error && output && (
        <div
          style={{
            background: STATUS_COLORS.success.background,
            color: STATUS_COLORS.success.text,
            padding: 10,
            borderRadius: 6,
            marginTop: 10,
            marginBottom: 10,
            fontSize: 13,
          }}
        >
          ✅ Valid JSON
        </div>
      )}

      {/* ✅ Monaco Output */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={output || ""}
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

      {/* ✅ Snackbar Notification */}
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


// import React from "react";
// import { Paper, Typography, IconButton } from "@mui/material";
// import ContentCopyIcon from "@mui/icons-material/ContentCopy";
// import Editor from "@monaco-editor/react";

// const OutputViewer = ({ output, error }) => {
//   const copyToClipboard = () => {
//     if (output) {
//       navigator.clipboard.writeText(output);
//     }
//   };

//   return (
//     <Paper
//       sx={{
//         p: 2,
//         flex: 1,
//         display: "flex",
//         flexDirection: "column",
//         position: "relative",
//         height: "100%",     // ✅ FIX 1
//         minHeight: 0,       // ✅ FIX 2 (critical for flex scroll)
//       }}
//     >
//       <Typography variant="h6">Formatted Output</Typography>

//       {/* ✅ Copy Button */}
//       <IconButton
//         onClick={copyToClipboard}
//         sx={{ position: "absolute", top: 10, right: 10 }}
//       >
//         <ContentCopyIcon />
//       </IconButton>

//       {/* ✅ Error UI */}
//       {error && (
//         <div
//           style={{
//             background: "#ffe6e6",
//             padding: 10,
//             borderRadius: 6,
//             marginTop: 10,
//             marginBottom: 10,
//             fontSize: 13,
//           }}
//         >
//           <strong>❌ Error:</strong> {error.message}
//           <br />
//           {error.line && <>📍 Line: {error.line}<br /></>}
//           {error.column && <>📌 Column: {error.column}<br /></>}
//           <div>💡 Fix: {error.suggestion}</div>
//         </div>
//       )}

//       {/* ✅ Monaco Output Viewer */}
//       <div style={{ flex: 1, minHeight: 0 }}>
//         <Editor
//           height="100%"
//           defaultLanguage="json"
//           value={output || ""}
//           options={{
//             readOnly: true,                 // ✅ important
//             minimap: { enabled: false },
//             fontSize: 14,
//             lineNumbers: "on",              // ✅ line numbers added
//             scrollBeyondLastLine: false,
//             wordWrap: "on",                 // ✅ mobile friendly
//             folding: true,
//             renderLineHighlight: "all",
//           }}
//         />
//       </div>
//     </Paper>
//   );
// };

// export default OutputViewer;





// import React from "react";
// import { Paper, Typography, IconButton } from "@mui/material";
// import ContentCopyIcon from "@mui/icons-material/ContentCopy";
// import Editor from "@monaco-editor/react";

// const OutputViewer = ({ output, error }) => {
//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(output);
//   };

//   return (
//     <Paper
//       sx={{
//         p: 2,
//         flex: 1,
//         display: "flex",
//         flexDirection: "column",
//         position: "relative",
//       }}
//     >
//       <Typography variant="h6">Formatted Output</Typography>

//       <IconButton
//         onClick={copyToClipboard}
//         sx={{ position: "absolute", top: 10, right: 10 }}
//       >
//         <ContentCopyIcon />
//       </IconButton>

//       {/* ✅ Error UI */}
//       {error && (
//         <div
//           style={{
//             background: "#ffe6e6",
//             padding: 10,
//             borderRadius: 6,
//             marginTop: 10,
//             marginBottom: 10,
//           }}
//         >
//           <strong>❌ Error:</strong> {error.message}
//           <br />
//           {error.line && <>📍 Line: {error.line}<br /></>}
//           {error.column && <>📌 Column: {error.column}<br /></>}
//           <div>💡 Fix: {error.suggestion}</div>
//         </div>
//       )}

//       {/* ✅ Output */}
//       <pre style={{ marginTop: 10, overflow: "auto", flex: 1 }}>
//         {output}
//       </pre>
//     </Paper>
//   );
// };

// export default OutputViewer;