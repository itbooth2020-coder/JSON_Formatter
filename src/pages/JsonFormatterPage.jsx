import React, { useState, useRef } from "react";
import { Box, Typography } from "@mui/material";
import JsonEditor from "../components/JsonEditor";
import ActionBar from "../components/ActionBar";
import OutputViewer from "../components/OutputViewer";
import { validateAndFormatJSON } from "../utils/jsonUtils";

const EMPTY_INPUT_ERROR = {
  message: "JSON input is empty. Please enter some JSON.",
};

// Shared core behind /json-formatter, /json-validator, /json-beautifier,
// /json-viewer, and /json-minifier -- they're functionally the same tool
// (validate-as-you-type, beautify, minify, clear, upload), just framed
// differently per page via title/description.
const JsonFormatterPage = ({ title, description }) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);

  const validateAndSetOutput = (raw) => {
    if (!raw.trim()) {
      setOutput("");
      setError(EMPTY_INPUT_ERROR);
      return;
    }

    const result = validateAndFormatJSON(raw);

    if (result.valid) {
      setOutput(result.formatted);
      setError(null);
    } else {
      setOutput("");
      setError(result.error);
    }
  };

  // Input editor always mirrors exactly what the user typed; only the
  // debounced output/error is derived from it, so the input is never
  // rewritten out from under the user while they're typing.
  const handleInputChange = (val) => {
    setInput(val);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      validateAndSetOutput(val);
    }, 500);
  };

  const handleUpload = (data) => {
    setInput(data);
    validateAndSetOutput(data);
  };

  const handleFormat = () => {
    clearTimeout(debounceRef.current);
    validateAndSetOutput(input);
  };

  const handleMinify = () => {
    clearTimeout(debounceRef.current);

    if (!input.trim()) {
      setOutput("");
      setError(EMPTY_INPUT_ERROR);
      return;
    }

    const result = validateAndFormatJSON(input);

    if (result.valid) {
      setOutput(JSON.stringify(JSON.parse(input)));
      setError(null);
    } else {
      setOutput("");
      setError(result.error);
    }
  };

  const handleClear = () => {
    clearTimeout(debounceRef.current);

    if (!input.trim()) {
      setError(EMPTY_INPUT_ERROR);
      return;
    }

    setInput("");
    setOutput("");
    setError(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
          {description}
        </Typography>
      )}

      <ActionBar
        onFormat={handleFormat}
        onMinify={handleMinify}
        onClear={handleClear}
        onUpload={handleUpload}
      />

      <Box
        sx={{
          flex: 1,
          minHeight: { xs: 420, md: 560 },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1, display: "flex" }}>
          <JsonEditor
            value={input}
            onChange={handleInputChange}
            errorLine={error?.line ?? null}
          />
        </Box>

        <Box sx={{ flex: 1, display: "flex" }}>
          <OutputViewer output={output} error={error} />
        </Box>
      </Box>
    </Box>
  );
};

export default JsonFormatterPage;
