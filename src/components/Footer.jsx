import React from "react";
import { Box, Container, Typography, Stack } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: "divider",
        py: 3,
        mt: 2,
      }}
    >
      <Container maxWidth="xl">
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
