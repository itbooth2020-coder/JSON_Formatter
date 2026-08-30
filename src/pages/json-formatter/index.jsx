import React from "react";
import JsonFormatterPage from "../JsonFormatterPage";
import { TOOLS } from "../../toolsConfig";

const tool = TOOLS.find((t) => t.path === "/json-formatter");

const JsonFormatterRoute = () => (
  <JsonFormatterPage title={tool.name} description={tool.tagline} />
);

export default JsonFormatterRoute;
