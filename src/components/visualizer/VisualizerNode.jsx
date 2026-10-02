import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { getTypeColors, TYPE_LABELS } from "../../utils/nodeTypeColors";

const DIRECTION_HANDLES = {
  RIGHT: { target: Position.Left, source: Position.Right },
  LEFT: { target: Position.Right, source: Position.Left },
  DOWN: { target: Position.Top, source: Position.Bottom },
  UP: { target: Position.Bottom, source: Position.Top },
};

const formatRowValue = (row) => {
  if (row.valueType === "string") return `"${row.value}"`;
  return String(row.value);
};

const TYPE_LABEL_BY_NODE_TYPE = {
  object: "{ }",
  array: "[ ]",
  "primitive-root": "value",
};

// Custom React Flow node: renders a JSON object/array/primitive-root as a
// themed "card" -- header (path segment + type badge + collapse chevron)
// and one row per direct primitive field, color-coded by value type.
const VisualizerNode = ({ data }) => {
  const theme = useTheme();
  const typeColors = getTypeColors(theme.palette.mode);
  const isDark = theme.palette.mode === "dark";

  const {
    id,
    label,
    type,
    rows,
    childCount,
    hasChildNodes,
    collapsed,
    onToggleCollapse,
    onActivate,
    isRoot,
    isSearchMatch,
    isActiveMatch,
    direction,
  } = data;

  const handles = DIRECTION_HANDLES[direction] || DIRECTION_HANDLES.RIGHT;

  const handleActivate = () => onActivate?.(id);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleActivate();
    }
  };

  const handleToggleCollapse = (e) => {
    e.stopPropagation();
    onToggleCollapse?.(id);
  };

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`JSON node ${label ?? "root"}, ${type}${
        childCount ? `, ${childCount} item${childCount === 1 ? "" : "s"}` : ""
      }`}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      sx={{
        minWidth: 220,
        maxWidth: 280,
        borderRadius: 1.5,
        border: 2,
        borderColor: isActiveMatch
          ? "warning.main"
          : isSearchMatch
          ? "primary.main"
          : "divider",
        boxShadow: isActiveMatch ? 4 : 1,
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
        cursor: "pointer",
        outline: "none",
        "&:focus-visible": { borderColor: "primary.main" },
      }}
    >
      {!isRoot && (
        <Handle type="target" position={handles.target} isConnectable={false} />
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          py: 0.5,
          borderBottom: rows.length > 0 ? 1 : 0,
          borderColor: "divider",
          background: isDark ? "rgba(79,70,229,0.12)" : "rgba(79,70,229,0.06)",
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
        }}
      >
        {hasChildNodes && (
          <IconButton
            size="small"
            onClick={handleToggleCollapse}
            aria-label={collapsed ? "Expand node" : "Collapse node"}
            sx={{ p: 0.25 }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        )}
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {label ?? "root"}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
          {TYPE_LABEL_BY_NODE_TYPE[type] || type}
        </Typography>
        {type === "array" && (
          <Typography variant="caption" color="text.secondary">
            ({childCount})
          </Typography>
        )}
      </Box>

      {rows.length > 0 && (
        <Box sx={{ px: 1, py: 0.5 }}>
          {rows.map((row) => (
            <Box
              key={String(row.key)}
              sx={{ display: "flex", justifyContent: "space-between", gap: 1, fontSize: 12, py: 0.25 }}
            >
              <Typography
                component="span"
                variant="caption"
                sx={{ color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {row.key}
              </Typography>
              <Typography
                component="span"
                variant="caption"
                title={`${TYPE_LABELS[row.valueType]}: ${formatRowValue(row)}`}
                sx={{
                  color: typeColors[row.valueType],
                  fontFamily: "monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 150,
                }}
              >
                {formatRowValue(row)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <Handle type="source" position={handles.source} isConnectable={false} />
    </Box>
  );
};

export default VisualizerNode;
