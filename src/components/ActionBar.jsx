import React, { useState } from "react";
import { Button, Stack } from "@mui/material";

const ActionBar = ({ onFormat, onMinify, onClear, onUpload }) => {
  // Beautify starts active (when available) since the app auto-formats to
  // beautified JSON by default as the user types.
  const [activeAction, setActiveAction] = useState(onFormat ? "format" : null);

  const runAction = (action, handler) => {
    setActiveAction(action);
    handler();
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setActiveAction("upload");
      onUpload(reader.result);
    };
    reader.readAsText(file);
  };

  return (
    <Stack direction="row" spacing={2} sx={{ my: 2 }}>
      {onFormat && (
        <Button
          variant={activeAction === "format" ? "contained" : "outlined"}
          onClick={() => runAction("format", onFormat)}
        >
          Beautify
        </Button>
      )}

      {onMinify && (
        <Button
          variant={activeAction === "minify" ? "contained" : "outlined"}
          onClick={() => runAction("minify", onMinify)}
        >
          Minify
        </Button>
      )}

      {onClear && (
        <Button
          variant={activeAction === "clear" ? "contained" : "outlined"}
          onClick={() => runAction("clear", onClear)}
        >
          Clear
        </Button>
      )}

      {onUpload && (
        <Button
          variant={activeAction === "upload" ? "contained" : "outlined"}
          component="label"
        >
          Upload JSON
          <input hidden type="file" accept=".json" onChange={handleFile} />
        </Button>
      )}
    </Stack>
  );
};

export default ActionBar;
