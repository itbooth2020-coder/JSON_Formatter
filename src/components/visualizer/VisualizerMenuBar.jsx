import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  IconButton,
  Tooltip,
  Typography,
  Divider,
  Snackbar,
} from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FitScreenIcon from "@mui/icons-material/FitScreen";

const DIRECTIONS = [
  { value: "RIGHT", label: "Left to right" },
  { value: "DOWN", label: "Top to bottom" },
];

// Top menu bar: File (new/import/download), View (layout direction,
// expand/collapse all), search with cycle + center, and zoom controls.
const VisualizerMenuBar = ({
  onNew,
  onImportFile,
  onDownload,
  canDownload,
  direction,
  onDirectionChange,
  onExpandAll,
  onCollapseAll,
  searchTerm,
  onSearchChange,
  matchCount,
  activeMatchIndex,
  onSearchNext,
  onSearchPrev,
  onZoomIn,
  onZoomOut,
  onFitView,
}) => {
  const [fileAnchor, setFileAnchor] = useState(null);
  const [viewAnchor, setViewAnchor] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    setFileAnchor(null);
    fileInputRef.current?.click();
  };

  const readFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImportFile(reader.result);
    reader.onerror = () => {
      setImportError(`Could not read "${file.name}" — the file may be unreadable or too large.`);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    readFile(file);
    e.target.value = "";
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) onSearchPrev();
      else onSearchNext();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1,
        px: 1,
        py: 0.5,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Button
        size="small"
        startIcon={<InsertDriveFileOutlinedIcon fontSize="small" />}
        onClick={(e) => setFileAnchor(e.currentTarget)}
      >
        File
      </Button>
      <Menu anchorEl={fileAnchor} open={Boolean(fileAnchor)} onClose={() => setFileAnchor(null)}>
        <MenuItem
          onClick={() => {
            setFileAnchor(null);
            onNew();
          }}
        >
          <ListItemIcon>
            <NoteAddOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>New</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleImportClick}>
          <ListItemIcon>
            <FileUploadOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Import file…</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={!canDownload}
          onClick={() => {
            setFileAnchor(null);
            onDownload();
          }}
        >
          <ListItemIcon>
            <FileDownloadOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download JSON</ListItemText>
        </MenuItem>
      </Menu>
      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept=".json,.txt,.log,application/json,text/plain"
        onChange={handleFileChange}
      />

      <Tooltip title="Import a JSON or text file">
        <Button
          size="small"
          variant="outlined"
          startIcon={<FileUploadOutlinedIcon fontSize="small" />}
          onClick={handleImportClick}
        >
          Import file
        </Button>
      </Tooltip>

      <Button
        size="small"
        startIcon={<VisibilityOutlinedIcon fontSize="small" />}
        onClick={(e) => setViewAnchor(e.currentTarget)}
      >
        View
      </Button>
      <Menu anchorEl={viewAnchor} open={Boolean(viewAnchor)} onClose={() => setViewAnchor(null)}>
        <Typography variant="caption" sx={{ px: 2, pt: 1, display: "block", color: "text.secondary" }}>
          Layout direction
        </Typography>
        {DIRECTIONS.map((d) => (
          <MenuItem
            key={d.value}
            onClick={() => {
              setViewAnchor(null);
              onDirectionChange(d.value);
            }}
          >
            <ListItemIcon>{direction === d.value ? <CheckIcon fontSize="small" /> : null}</ListItemIcon>
            <ListItemText>{d.label}</ListItemText>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => {
            setViewAnchor(null);
            onExpandAll();
          }}
        >
          <ListItemIcon>
            <UnfoldMoreIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Expand all</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setViewAnchor(null);
            onCollapseAll();
          }}
        >
          <ListItemIcon>
            <UnfoldLessIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Collapse all</ListItemText>
        </MenuItem>
      </Menu>

      <TextField
        size="small"
        placeholder="Search nodes…"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleSearchKeyDown}
        InputProps={{
          startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: "text.secondary" }} />,
        }}
        sx={{ width: { xs: 140, sm: 220 } }}
      />
      {searchTerm && (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 48 }}>
            {matchCount > 0 ? `${activeMatchIndex + 1}/${matchCount}` : "0/0"}
          </Typography>
          <Tooltip title="Previous match (Shift+Enter)">
            <span>
              <IconButton size="small" onClick={onSearchPrev} disabled={matchCount === 0} aria-label="Previous match">
                <NavigateBeforeIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Next match (Enter)">
            <span>
              <IconButton size="small" onClick={onSearchNext} disabled={matchCount === 0} aria-label="Next match">
                <NavigateNextIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </>
      )}

      <Box sx={{ flex: 1 }} />

      <Tooltip title="Zoom in">
        <IconButton size="small" onClick={onZoomIn} aria-label="Zoom in">
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Zoom out">
        <IconButton size="small" onClick={onZoomOut} aria-label="Zoom out">
          <ZoomOutIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Fit to screen">
        <IconButton size="small" onClick={onFitView} aria-label="Fit to screen">
          <FitScreenIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Snackbar
        open={!!importError}
        onClose={() => setImportError(null)}
        autoHideDuration={5000}
        message={importError ? `❌ ${importError}` : ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default VisualizerMenuBar;
