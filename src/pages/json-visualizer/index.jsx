import React from "react";
import JsonVisualizerPage from "../JsonVisualizerPage";
import { TOOLS } from "../../toolsConfig";

const tool = TOOLS.find((t) => t.path === "/json-visualizer");

const JsonVisualizerRoute = () => (
  <JsonVisualizerPage title={tool.name} description={tool.tagline} />
);

export default JsonVisualizerRoute;
