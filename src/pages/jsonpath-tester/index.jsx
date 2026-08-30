import React from "react";
import JsonPathTesterPage from "../JsonPathTesterPage";
import { TOOLS } from "../../toolsConfig";

const tool = TOOLS.find((t) => t.path === "/jsonpath-tester");

const JsonPathTesterRoute = () => (
  <JsonPathTesterPage title={tool.name} description={tool.tagline} />
);

export default JsonPathTesterRoute;
