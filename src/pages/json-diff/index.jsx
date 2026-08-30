import React from "react";
import JsonDiffPage from "../JsonDiffPage";
import { TOOLS } from "../../toolsConfig";

const tool = TOOLS.find((t) => t.path === "/json-diff");

const JsonDiffRoute = () => (
  <JsonDiffPage title={tool.name} description={tool.tagline} />
);

export default JsonDiffRoute;
