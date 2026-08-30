const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

const primitiveType = (value) => {
  if (value === null) return "object";
  switch (typeof value) {
    case "string":
      return "string";
    case "boolean":
      return "bool";
    case "number":
      return Number.isInteger(value) ? "int" : "double";
    default:
      return "object";
  }
};

// Best-effort class generation, same approach and limitations as the Java
// and TypeScript generators (see jsonToJava.js).
export const jsonToCSharp = (data, rootName = "Root") => {
  const classes = [];

  const buildClass = (obj, name) => {
    if (classes.some((c) => c.name === name)) return;

    const props = Object.entries(obj).map(([key, value]) => ({
      key: capitalize(key),
      type: typeFor(value, key),
    }));

    const propLines = props.map((p) => `    public ${p.type} ${p.key} { get; set; }`).join("\n");
    classes.push({ name, body: `public class ${name}\n{\n${propLines}\n}` });
  };

  function typeFor(value, name) {
    if (Array.isArray(value)) {
      if (value.length === 0) return "List<object>";
      return `List<${typeFor(value[0], name)}>`;
    }
    if (isPlainObject(value)) {
      const className = capitalize(name);
      buildClass(value, className);
      return className;
    }
    return primitiveType(value);
  }

  if (isPlainObject(data)) {
    buildClass(data, rootName);
  } else if (Array.isArray(data) && data.length && isPlainObject(data[0])) {
    buildClass(data[0], rootName);
  } else {
    throw new Error(
      "C# class generation needs a JSON object (or an array of objects) at the top level."
    );
  }

  const needsList = classes.some((c) => c.body.includes("List<"));
  const header = needsList ? "using System.Collections.Generic;\n\n" : "";
  return header + classes.map((c) => c.body).join("\n\n");
};
