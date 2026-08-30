import React from "react";
import JsonBeautifierPage from "./JsonBeautifierPage";
import { TOOLS } from "../../toolsConfig";

const tool = TOOLS.find((t) => t.path === "/json-beautifier");

const JsonBeautifierRoute = () => (
  <JsonBeautifierPage title={tool.name} description={tool.tagline} />
);

export default JsonBeautifierRoute;
