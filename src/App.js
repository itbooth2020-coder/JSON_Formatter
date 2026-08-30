import React, { useState, useRef } from "react";
import { Container } from "@mui/material";
import Header from "./components/Header";
import JsonEditor from "./components/JsonEditor";
import ActionBar from "./components/ActionBar";
import OutputViewer from "./components/OutputViewer";
import { validateAndFormatJSON } from "./utils/jsonUtils";

const EMPTY_INPUT_ERROR = {
  message: "JSON input is empty. Please enter some JSON.",
};

function App() {
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
    <>
      <Header />

      <Container maxWidth="xl">
        <ActionBar
          onFormat={handleFormat}
          onMinify={handleMinify}
          onClear={handleClear}
          onUpload={handleUpload}
        />

        <div style={{ height: "calc(100vh - 120px)", display: "flex", gap: "16px" }}>

          <div style={{ flex: 1, display: "flex" }}>
            <JsonEditor
              value={input}
              onChange={handleInputChange}
              errorLine={error?.line ?? null}
            />
          </div>

          <div style={{ flex: 1, display: "flex" }}>
            <OutputViewer output={output} error={error} />
          </div>

        </div>
      </Container>
    </>
  );
}

export default App;
