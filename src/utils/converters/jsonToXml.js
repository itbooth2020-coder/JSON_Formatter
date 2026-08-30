const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Arrays are rendered as repeated sibling elements under the array's own
// key (e.g. {"tags":["a","b"]} -> <tags>a</tags><tags>b</tags>) rather than
// invented "item" wrappers, so round-tripping stays predictable.
const valueToXml = (key, value, indent) => {
  const pad = "  ".repeat(indent);

  if (Array.isArray(value)) {
    return value.map((item) => valueToXml(key, item, indent)).join("\n");
  }

  if (isPlainObject(value)) {
    const inner = Object.entries(value)
      .map(([k, v]) => valueToXml(k, v, indent + 1))
      .join("\n");
    if (!inner) return `${pad}<${key}></${key}>`;
    return `${pad}<${key}>\n${inner}\n${pad}</${key}>`;
  }

  if (value === null || value === undefined) {
    return `${pad}<${key}/>`;
  }

  return `${pad}<${key}>${escapeXml(value)}</${key}>`;
};

export const jsonToXml = (data) => {
  const header = '<?xml version="1.0" encoding="UTF-8"?>';

  if (Array.isArray(data)) {
    const body = data.map((item) => valueToXml("item", item, 1)).join("\n");
    return `${header}\n<root>\n${body}\n</root>`;
  }

  if (isPlainObject(data)) {
    const body = Object.entries(data)
      .map(([k, v]) => valueToXml(k, v, 1))
      .join("\n");
    return `${header}\n<root>\n${body}\n</root>`;
  }

  return `${header}\n<root>${escapeXml(data)}</root>`;
};
