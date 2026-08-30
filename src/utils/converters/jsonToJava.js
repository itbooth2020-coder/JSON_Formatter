const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

const primitiveType = (value) => {
  if (value === null) return "Object";
  switch (typeof value) {
    case "string":
      return "String";
    case "boolean":
      return "boolean";
    case "number":
      return Number.isInteger(value) ? "int" : "double";
    default:
      return "Object";
  }
};

// Best-effort POJO generation: one class per distinct field name that holds
// an object, with private fields plus getters/setters. Like the TypeScript
// generator, two differently-shaped objects sharing a field name reuse the
// first-seen class -- fine for typical API-response samples, not a full
// schema-aware code generator.
export const jsonToJava = (data, rootName = "Root") => {
  const classes = [];

  const buildClass = (obj, name) => {
    if (classes.some((c) => c.name === name)) return;

    const fields = Object.entries(obj).map(([key, value]) => ({
      key,
      type: typeFor(value, key),
    }));

    const fieldLines = fields.map((f) => `    private ${f.type} ${f.key};`).join("\n");
    const accessors = fields
      .map(
        (f) => `
    public ${f.type} get${capitalize(f.key)}() {
        return ${f.key};
    }

    public void set${capitalize(f.key)}(${f.type} ${f.key}) {
        this.${f.key} = ${f.key};
    }`
      )
      .join("\n");

    classes.push({
      name,
      body: `public class ${name} {\n${fieldLines}\n${accessors}\n}`,
    });
  };

  function typeFor(value, name) {
    if (Array.isArray(value)) {
      if (value.length === 0) return "List<Object>";
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
      "Java class generation needs a JSON object (or an array of objects) at the top level."
    );
  }

  const needsList = classes.some((c) => c.body.includes("List<"));
  const header = needsList ? "import java.util.List;\n\n" : "";
  return header + classes.map((c) => c.body).join("\n\n");
};
