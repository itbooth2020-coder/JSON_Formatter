import React from "react";
import { Box, Typography, Card, CardActionArea, CardContent, Grid } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { TOOLS } from "../toolsConfig";

const HomePage = () => {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
        JSON tools, all in your browser
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 720 }}>
        Format, validate, compare, and convert JSON — every tool below runs entirely
        client-side. Nothing you paste is ever sent to a server.
      </Typography>

      <Grid container spacing={2}>
        {TOOLS.map((tool) => (
          <Grid key={tool.path} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardActionArea
                component={RouterLink}
                to={tool.path}
                sx={{
                  height: "100%",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                }}
              >
                <CardContent sx={{ p: 0, width: "100%", "&:last-child": { pb: 0 } }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    {tool.name}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Q: {tool.question}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    A: {tool.answer}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage;
