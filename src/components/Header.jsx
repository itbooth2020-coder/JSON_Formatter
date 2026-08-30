import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import DataObjectIcon from "@mui/icons-material/DataObject";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import MenuIcon from "@mui/icons-material/Menu";
import { TOOLS } from "../toolsConfig";

const Header = ({ mode, onToggleMode }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ gap: 1 }}>
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flex: 1,
            color: "inherit",
            textDecoration: "none",
            minWidth: 0,
          }}
        >
          <DataObjectIcon sx={{ fontSize: 28, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 700, lineHeight: 1.15, m: 0 }}>
              JsonForge
            </Typography>
            <Typography
              variant="caption"
              sx={{ opacity: 0.85, display: { xs: "none", sm: "block" } }}
            >
              JSON tools for developers — entirely in your browser
            </Typography>
          </Box>
        </Box>

        <Button
          color="inherit"
          startIcon={<MenuIcon />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-haspopup="true"
        >
          Tools
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          slotProps={{ paper: { sx: { maxHeight: 420 } } }}
        >
          {TOOLS.map((tool) => (
            <MenuItem
              key={tool.path}
              component={RouterLink}
              to={tool.path}
              onClick={() => setAnchorEl(null)}
            >
              {tool.name}
            </MenuItem>
          ))}
        </Menu>

        <Tooltip title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
          <IconButton
            color="inherit"
            onClick={onToggleMode}
            aria-label="Toggle color mode"
          >
            {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
