import React, { useState, useMemo } from "react";
import { Box, Typography, Paper, useTheme } from "@mui/material";
import JsonEditor from "../../components/JsonEditor";
import { validateAndFormatJSON } from "../../utils/jsonUtils";
import { diffJson } from "../../utils/jsonDiff";
import { getStatusColors } from "../../utils/statusColors";

// Dedicated core for /json-compare -- a replica of JsonDiffPage.jsx, kept
// as its own copy under this route's own folder rather than sharing the
// JsonDiffPage engine also used by /json-diff.
const JsonComparePage = ({ title, description }) => {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const theme = useTheme();
  const statusColors = getStatusColors(theme.palette.mode);

  const { diffs, error } = useMemo(() => {
    if (!left.trim() || !right.trim()) return { diffs: null, error: null };

    const leftResult = validateAndFormatJSON(left);
    if (!leftResult.valid) return { diffs: null, error: `Left JSON: ${leftResult.error.message}` };

    const rightResult = validateAndFormatJSON(right);
    if (!rightResult.valid) return { diffs: null, error: `Right JSON: ${rightResult.error.message}` };

    return { diffs: diffJson(JSON.parse(left), JSON.parse(right)), error: null };
  }, [left, right]);

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

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          minHeight: { xs: 320, md: 380 },
        }}
      >
        <Box sx={{ flex: 1, display: "flex" }}>
          <JsonEditor value={left} onChange={setLeft} errorLine={null} label="Original JSON" />
        </Box>
        <Box sx={{ flex: 1, display: "flex" }}>
          <JsonEditor value={right} onChange={setRight} errorLine={null} label="Changed JSON" />
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ mt: 2, p: 2, flex: 1, overflow: "auto", minHeight: 200 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Differences
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

        {!error && diffs && diffs.length === 0 && (
          <Box
            sx={{
              background: statusColors.success.background,
              color: statusColors.success.text,
              p: 1.5,
              borderRadius: 1,
              fontSize: 13,
            }}
          >
            ✅ These two JSON documents are identical.
          </Box>
        )}

        {!error && diffs && diffs.length > 0 && (
          <Box
            component="ul"
            sx={{ m: 0, pl: 2.5, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
          >
            {diffs.map((d, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <Box component="li" key={`${d.path}-${i}`} sx={{ mb: 0.75 }}>
                {d.type === "added" && (
                  <Box component="span" sx={{ color: statusColors.success.text }}>
                    + Added <code>{d.path}</code>: {JSON.stringify(d.right)}
                  </Box>
                )}
                {d.type === "removed" && (
                  <Box component="span" sx={{ color: statusColors.error.text }}>
                    - Removed <code>{d.path}</code>: {JSON.stringify(d.left)}
                  </Box>
                )}
                {d.type === "changed" && (
                  <Box component="span" sx={{ color: statusColors.warning.text }}>
                    ~ Changed <code>{d.path}</code>: {JSON.stringify(d.left)} &rarr; {JSON.stringify(d.right)}
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}

        {!error && !diffs && (
          <Typography variant="body2" color="text.secondary">
            Paste JSON into both panels above to see the differences.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default JsonComparePage;
