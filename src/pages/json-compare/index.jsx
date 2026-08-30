import React from "react";
import JsonComparePage from "./JsonComparePage";
import { TOOLS } from "../../toolsConfig";

const tool = TOOLS.find((t) => t.path === "/json-compare");

const JsonCompareRoute = () => (
  <JsonComparePage title={tool.name} description={tool.tagline} />
);

export default JsonCompareRoute;
