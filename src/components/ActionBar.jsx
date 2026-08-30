import React from "react";
import { Button, Stack } from "@mui/material";

const ActionBar = ({ onFormat, onMinify, onClear, onUpload }) => {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result);
    reader.readAsText(file);
  };

  return (
    <Stack direction="row" spacing={2} sx={{ my: 2 }}>
      <Button variant="contained" onClick={onFormat}>
        Beautify
      </Button>

      <Button variant="outlined" onClick={onMinify}>
        Minify
      </Button>

      <Button variant="outlined" onClick={onClear}>
        Clear
      </Button>

      <Button variant="outlined" component="label">
        Upload JSON
        <input hidden type="file" accept=".json" onChange={handleFile} />
      </Button>
    </Stack>
  );
};

export default ActionBar;