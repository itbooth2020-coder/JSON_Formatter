import React from "react";
import ConverterPage from "../ConverterPage";
import { TOOLS } from "../../toolsConfig";
import { jsonToTypeScript } from "../../utils/converters/jsonToTypeScript";

const tool = TOOLS.find((t) => t.path === "/json-to-typescript");

const JsonToTypeScriptRoute = () => (
  <ConverterPage
    title={tool.name}
    description={tool.tagline}
    convert={(data) => jsonToTypeScript(data)}
    outputLanguage="typescript"
    successMessage="Interface generated"
  />
);

export default JsonToTypeScriptRoute;
