const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

const primitiveType = (value) => {
  if (value === null) return "null";
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "unknown";
  }
};

// Best-effort inference: one interface per distinct field name that holds
// an object. Two differently-shaped objects sharing the same field name at
// different nesting levels will reuse the first-seen interface -- a known
// limitation of a lightweight generator, not a full type-inference engine.
export const jsonToTypeScript = (data, rootName = "Root") => {
  const interfaces = [];

  const buildInterface = (obj, name) => {
    if (interfaces.some((i) => i.name === name)) return;
    const fields = Object.entries(obj).map(([key, value]) => `  ${key}: ${typeFor(value, key)};`);
    interfaces.push({ name, body: `interface ${name} {\n${fields.join("\n")}\n}` });
  };

  function typeFor(value, name) {
    if (Array.isArray(value)) {
      if (value.length === 0) return "unknown[]";
      return `${typeFor(value[0], name)}[]`;
    }
    if (isPlainObject(value)) {
      const interfaceName = capitalize(name);
      buildInterface(value, interfaceName);
      return interfaceName;
    }
    return primitiveType(value);
  }

  if (Array.isArray(data)) {
    const elementType = data.length ? typeFor(data[0], rootName) : "unknown";
    interfaces.push({ name: rootName, body: `type ${rootName} = ${elementType}[];` });
  } else if (isPlainObject(data)) {
    buildInterface(data, rootName);
  } else {
    interfaces.push({ name: rootName, body: `type ${rootName} = ${primitiveType(data)};` });
  }

  return interfaces.map((i) => i.body).join("\n\n");
};
