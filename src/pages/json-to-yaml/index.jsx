import React from "react";
import ConverterPage from "../ConverterPage";
import { TOOLS } from "../../toolsConfig";
import { jsonToYaml } from "../../utils/converters/jsonToYaml";

const tool = TOOLS.find((t) => t.path === "/json-to-yaml");

const JsonToYamlRoute = () => (
  <ConverterPage
    title={tool.name}
    description={tool.tagline}
    convert={jsonToYaml}
    outputLanguage="yaml"
    successMessage="Converted to YAML"
  />
);

export default JsonToYamlRoute;
