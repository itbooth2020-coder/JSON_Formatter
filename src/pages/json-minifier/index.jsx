import React from "react";
import JsonFormatterPage from "../JsonFormatterPage";
import { TOOLS } from "../../toolsConfig";

const tool = TOOLS.find((t) => t.path === "/json-minifier");

const JsonMinifierRoute = () => (
  <JsonFormatterPage title={tool.name} description={tool.tagline} />
);

export default JsonMinifierRoute;
