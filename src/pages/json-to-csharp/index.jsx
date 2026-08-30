import React from "react";
import ConverterPage from "../ConverterPage";
import { TOOLS } from "../../toolsConfig";
import { jsonToCSharp } from "../../utils/converters/jsonToCSharp";

const tool = TOOLS.find((t) => t.path === "/json-to-csharp");

const JsonToCSharpRoute = () => (
  <ConverterPage
    title={tool.name}
    description={tool.tagline}
    convert={(data) => jsonToCSharp(data)}
    outputLanguage="csharp"
    successMessage="Class generated"
  />
);

export default JsonToCSharpRoute;
