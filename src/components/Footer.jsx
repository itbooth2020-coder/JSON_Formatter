import React from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Stack,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FacebookIcon from "@mui/icons-material/Facebook";
import LockIcon from "@mui/icons-material/Lock";
import { TOOLS, HOME_FOOTER } from "../toolsConfig";

// MUI's icon set only ships the old Twitter bird; the current X mark is
// small enough to inline directly rather than pull in another dependency.
const XIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.9 2.6h3.1l-6.8 7.8 8 10.8h-6.3l-4.9-6.5-5.7 6.5H3.2l7.3-8.4-7.7-10.2h6.4l4.5 6L18.9 2.6Zm-1.1 16.7h1.7L7.3 4.5H5.5L17.8 19.3Z" />
  </svg>
);

const Footer = () => {
  const location = useLocation();
  const page = TOOLS.find((t) => t.path === location.pathname);
  const content = page
    ? { title: page.name, description: page.tagline, about: page.about, faq: page.faq }
    : HOME_FOOTER;
  const year = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ borderTop: 1, borderColor: "divider", mt: 2 }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: 5 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, textAlign: "center", mb: 1 }}>
          {content.title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: "center", maxWidth: 720, mx: "auto", mb: 5 }}
        >
          {content.description}
        </Typography>

        <Box sx={{ maxWidth: 720, mx: "auto", mb: 5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            {page ? `Know more about ${content.title}` : "Know more"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {content.about}
          </Typography>
        </Box>

        <Box sx={{ maxWidth: 720, mx: "auto", mb: 5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            FAQ
          </Typography>
          {content.faq.map((item) => (
            <Accordion
              key={item.q}
              disableGutters
              elevation={0}
              square
              sx={{
                background: "transparent",
                borderBottom: 1,
                borderColor: "divider",
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0 }}>
                <Typography variant="body2" color="text.secondary">
                  {item.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        <Stack spacing={1} alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Follow Us
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Facebook (coming soon)">
              <IconButton
                href="#"
                onClick={(e) => e.preventDefault()}
                size="small"
                aria-label="Facebook"
              >
                <FacebookIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="X / Twitter (coming soon)">
              <IconButton
                href="#"
                onClick={(e) => e.preventDefault()}
                size="small"
                aria-label="X (formerly Twitter)"
              >
                <XIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Typography variant="body2" color="text.secondary">
            &copy; {year} JsonForge. All formatting happens locally in your browser.
          </Typography>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <LockIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              Your JSON is never sent to a server
            </Typography>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
