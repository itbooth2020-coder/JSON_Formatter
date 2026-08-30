import React from "react";
import ConverterPage from "../ConverterPage";
import { TOOLS } from "../../toolsConfig";
import { jsonToSchema } from "../../utils/converters/jsonSchema";

const tool = TOOLS.find((t) => t.path === "/json-schema-generator");

const JsonSchemaGeneratorRoute = () => (
  <ConverterPage
    title={tool.name}
    description={tool.tagline}
    convert={jsonToSchema}
    outputLanguage="json"
    successMessage="Schema generated"
  />
);

export default JsonSchemaGeneratorRoute;
