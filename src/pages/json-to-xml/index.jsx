import React from "react";
import ConverterPage from "../ConverterPage";
import { TOOLS } from "../../toolsConfig";
import { jsonToXml } from "../../utils/converters/jsonToXml";

const tool = TOOLS.find((t) => t.path === "/json-to-xml");

const JsonToXmlRoute = () => (
  <ConverterPage
    title={tool.name}
    description={tool.tagline}
    convert={jsonToXml}
    outputLanguage="xml"
    successMessage="Converted to XML"
  />
);

export default JsonToXmlRoute;
