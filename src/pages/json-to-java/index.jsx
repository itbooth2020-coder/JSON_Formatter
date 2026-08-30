import React from "react";
import ConverterPage from "../ConverterPage";
import { TOOLS } from "../../toolsConfig";
import { jsonToJava } from "../../utils/converters/jsonToJava";

const tool = TOOLS.find((t) => t.path === "/json-to-java");

const JsonToJavaRoute = () => (
  <ConverterPage
    title={tool.name}
    description={tool.tagline}
    convert={(data) => jsonToJava(data)}
    outputLanguage="java"
    successMessage="Class generated"
  />
);

export default JsonToJavaRoute;
