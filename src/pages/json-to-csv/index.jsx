import React from "react";
import ConverterPage from "../ConverterPage";
import { TOOLS } from "../../toolsConfig";
import { jsonToCsv } from "../../utils/converters/jsonToCsv";

const tool = TOOLS.find((t) => t.path === "/json-to-csv");

const JsonToCsvRoute = () => (
  <ConverterPage
    title={tool.name}
    description={tool.tagline}
    convert={jsonToCsv}
    outputLanguage="plaintext"
    successMessage="Converted to CSV"
  />
);

export default JsonToCsvRoute;
