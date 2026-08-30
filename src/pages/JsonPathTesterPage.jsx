import React, { useState, useMemo } from "react";
import { Box, Typography, TextField, Paper, useTheme } from "@mui/material";
import { JSONPath } from "jsonpath-plus";
import JsonEditor from "../components/JsonEditor";
import { validateAndFormatJSON } from "../utils/jsonUtils";
import { getStatusColors } from "../utils/statusColors";

const JsonPathTesterPage = ({ title, description }) => {
  const [input, setInput] = useState("");
  const [path, setPath] = useState("$");
  const theme = useTheme();
  const statusColors = getStatusColors(theme.palette.mode);

  const { result, error } = useMemo(() => {
    if (!input.trim()) return { result: null, error: null };

    const parsedResult = validateAndFormatJSON(input);
    if (!parsedResult.valid) return { result: null, error: parsedResult.error.message };

    try {
      const json = JSON.parse(input);
      const matches = JSONPath({ path: path || "$", json });
      return { result: matches, error: null };
    } catch (e) {
      return { result: null, error: e.message || "Invalid JSONPath expression." };
    }
  }, [input, path]);

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

      <TextField
        label="JSONPath expression"
        value={path}
        onChange={(e) => setPath(e.target.value)}
        placeholder="$.store.book[0].title"
        size="small"
        fullWidth
        slotProps={{ htmlInput: { style: { fontFamily: "'JetBrains Mono', monospace" } } }}
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          flex: 1,
          minHeight: { xs: 420, md: 480 },
        }}
      >
        <Box sx={{ flex: 1, display: "flex" }}>
          <JsonEditor value={input} onChange={setInput} errorLine={null} label="JSON Input" />
        </Box>

        <Paper variant="outlined" sx={{ flex: 1, p: 2, overflow: "auto" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Matches
          </Typography>

          {error && (
            <Box
              sx={{
                background: statusColors.error.background,
                color: statusColors.error.text,
                p: 1.5,
                borderRadius: 1,
                fontSize: 13,
              }}
            >
              ❌ {error}
            </Box>
          )}

          {!error && result && (
            <Box
              component="pre"
              sx={{
                m: 0,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {JSON.stringify(result, null, 2)}
            </Box>
          )}

          {!error && !result && (
            <Typography variant="body2" color="text.secondary">
              Paste JSON and enter a JSONPath expression to see matches.
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default JsonPathTesterPage;
