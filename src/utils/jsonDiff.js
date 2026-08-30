const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const typeName = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);

// Returns a flat list of { path, type: "added"|"removed"|"changed", left?, right? }
// describing every difference between two already-parsed JSON values.
export const diffJson = (a, b, path = "$") => {
  const diffs = [];

  if (typeName(a) !== typeName(b)) {
    diffs.push({ path, type: "changed", left: a, right: b });
    return diffs;
  }

  if (isPlainObject(a)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach((key) => {
      const childPath = `${path}.${key}`;
      if (!(key in a)) {
        diffs.push({ path: childPath, type: "added", right: b[key] });
      } else if (!(key in b)) {
        diffs.push({ path: childPath, type: "removed", left: a[key] });
      } else {
        diffs.push(...diffJson(a[key], b[key], childPath));
      }
    });
    return diffs;
  }

  if (Array.isArray(a)) {
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
      const childPath = `${path}[${i}]`;
      if (i >= a.length) {
        diffs.push({ path: childPath, type: "added", right: b[i] });
      } else if (i >= b.length) {
        diffs.push({ path: childPath, type: "removed", left: a[i] });
      } else {
        diffs.push(...diffJson(a[i], b[i], childPath));
      }
    }
    return diffs;
  }

  if (a !== b) {
    diffs.push({ path, type: "changed", left: a, right: b });
  }

  return diffs;
};
