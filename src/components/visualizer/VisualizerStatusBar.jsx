import React from "react";
import { Box, Stack, Typography, FormControlLabel, Switch, Button, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { getStatusColors } from "../../utils/statusColors";

// Bottom status bar: valid/invalid indicator (reusing the same error shape
// jsonUtils.validateAndFormatJSON already produces), node count, truncation
// warning, and the Live Transform toggle + manual Transform button.
const VisualizerStatusBar = ({
  error,
  nodeCount,
  truncated,
  sizeBytes,
  liveTransform,
  onToggleLiveTransform,
  onTransformNow,
}) => {
  const theme = useTheme();
  const statusColors = getStatusColors(theme.palette.mode);
  // Mirrors OutputViewer's `isValid = !error && !!output` contract: a
  // pristine, not-yet-validated state (no error *and* nothing parsed yet)
  // is neither "valid" nor "invalid" -- it just hasn't run yet.
  const isValid = !error && nodeCount > 0;
  const isPristine = !error && nodeCount === 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
        px: 1.5,
        py: 0.75,
        borderTop: 1,
        borderColor: "divider",
        fontSize: 13,
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center">
        {isPristine ? null : isValid ? (
          <CheckCircleIcon sx={{ fontSize: 16, color: statusColors.success.text }} />
        ) : (
          <ErrorIcon sx={{ fontSize: 16, color: statusColors.error.text }} />
        )}
        <Typography
          variant="caption"
          sx={{
            color: isPristine
              ? "text.secondary"
              : isValid
              ? statusColors.success.text
              : statusColors.error.text,
          }}
        >
          {isPristine ? "Enter JSON to see the graph" : isValid ? "Valid JSON" : error?.message || "Invalid JSON"}
        </Typography>
      </Stack>

      {truncated && (
        <Typography variant="caption" sx={{ color: statusColors.warning.text }}>
          Graph truncated — showing the first {nodeCount} nodes
        </Typography>
      )}

      <Typography variant="caption" color="text.secondary">
        {nodeCount} node{nodeCount === 1 ? "" : "s"}
      </Typography>

      {typeof sizeBytes === "number" && (
        <Typography variant="caption" color="text.secondary">
          {sizeBytes.toLocaleString()} bytes
        </Typography>
      )}

      <Box sx={{ flex: 1 }} />

      <FormControlLabel
        control={
          <Switch size="small" checked={liveTransform} onChange={(e) => onToggleLiveTransform(e.target.checked)} />
        }
        label={<Typography variant="caption">Live Transform</Typography>}
        sx={{ m: 0 }}
      />

      {!liveTransform && (
        <Button size="small" variant="outlined" onClick={onTransformNow}>
          Transform
        </Button>
      )}
    </Box>
  );
};

export default VisualizerStatusBar;
