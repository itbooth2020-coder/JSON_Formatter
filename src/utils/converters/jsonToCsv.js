// Flattens nested objects/arrays to dot-and-index notation (e.g.
// "address.city", "tags.0") so every cell in the resulting CSV stays scalar.
const flatten = (value, prefix = "", out = {}) => {
  if (value === null || value === undefined) {
    out[prefix] = "";
    return out;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      out[prefix] = "";
      return out;
    }
    value.forEach((item, i) => flatten(item, prefix ? `${prefix}.${i}` : String(i), out));
    return out;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      out[prefix] = "";
      return out;
    }
    keys.forEach((k) => flatten(value[k], prefix ? `${prefix}.${k}` : k, out));
    return out;
  }

  out[prefix] = value;
  return out;
};

const csvEscape = (value) => {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const jsonToCsv = (data) => {
  const rows = Array.isArray(data) ? data : [data];

  if (rows.length === 0) {
    throw new Error("There's nothing to convert — the JSON array is empty.");
  }

  const flatRows = rows.map((row) => flatten(row));
  const headerSet = new Set();
  flatRows.forEach((row) => Object.keys(row).forEach((k) => headerSet.add(k)));
  const headers = Array.from(headerSet);

  if (headers.length === 0) {
    throw new Error("Couldn't find any fields to convert to CSV columns.");
  }

  const lines = [headers.map(csvEscape).join(",")];
  flatRows.forEach((row) => {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  });

  return lines.join("\n");
};
