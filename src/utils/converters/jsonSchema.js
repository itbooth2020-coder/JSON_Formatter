const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

const schemaFor = (value) => {
  if (value === null) return { type: "null" };

  if (Array.isArray(value)) {
    if (value.length === 0) return { type: "array", items: {} };
    return { type: "array", items: schemaFor(value[0]) };
  }

  if (isPlainObject(value)) {
    const properties = {};
    Object.entries(value).forEach(([k, v]) => {
      properties[k] = schemaFor(v);
    });
    return { type: "object", properties, required: Object.keys(value) };
  }

  switch (typeof value) {
    case "string":
      return { type: "string" };
    case "number":
      return { type: Number.isInteger(value) ? "integer" : "number" };
    case "boolean":
      return { type: "boolean" };
    default:
      return {};
  }
};

export const jsonToSchema = (data) => {
  const schema = { $schema: "http://json-schema.org/draft-07/schema#", ...schemaFor(data) };
  return JSON.stringify(schema, null, 2);
};
