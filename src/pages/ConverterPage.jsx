import React, { useState, useRef } from "react";
import { Box, Typography } from "@mui/material";
import JsonEditor from "../components/JsonEditor";
import ActionBar from "../components/ActionBar";
import OutputViewer from "../components/OutputViewer";
import { validateAndFormatJSON } from "../utils/jsonUtils";

const EMPTY_INPUT_ERROR = {
  message: "JSON input is empty. Please enter some JSON.",
};

// Generic "one JSON input -> one text output" tool shell, shared by the
// schema generator and every json-to-X converter page. `convert` receives
// the already-parsed JSON value and returns the output string (or throws
// an Error with a user-facing message if the shape doesn't fit).
const ConverterPage = ({ title, description, convert, outputLanguage, successMessage }) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);

  const runConversion = (raw) => {
    if (!raw.trim()) {
      setOutput("");
      setError(EMPTY_INPUT_ERROR);
      return;
    }

    const result = validateAndFormatJSON(raw);
    if (!result.valid) {
      setOutput("");
      setError(result.error);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setOutput(convert(parsed));
      setError(null);
    } catch (e) {
      setOutput("");
      setError({ message: e.message || "Couldn't convert this JSON." });
    }
  };

  const handleInputChange = (val) => {
    setInput(val);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runConversion(val);
    }, 500);
  };

  const handleUpload = (data) => {
    setInput(data);
    runConversion(data);
  };

  const handleClear = () => {
    clearTimeout(debounceRef.current);
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

      <ActionBar onClear={handleClear} onUpload={handleUpload} />

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
          <OutputViewer
            output={output}
            error={error}
            language={outputLanguage}
            successMessage={successMessage}
            label="Converted Output"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ConverterPage;
