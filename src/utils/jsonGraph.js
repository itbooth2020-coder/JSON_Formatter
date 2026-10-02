// Pure, framework-agnostic JSON -> graph transform. No dependency on
// React Flow or any layout library so this stays trivially unit-testable
// (mirrors the jsonUtils.js / jsonDiff.js convention of keeping transform
// logic separate from rendering).
//
// One node is created per object/array (including nested ones); primitive
// leaf values that belong directly to an object/array are rows *inside*
// their parent's node rather than separate nodes/edges -- this keeps the
// graph readable (JSON Crack-style "card" per object/array). A bare
// top-level primitive still produces a single root node so the canvas is
// never empty for valid JSON.

export const DEFAULT_MAX_NODES = 2000;

const isPrimitive = (value) => value === null || typeof value !== "object";

const getValueType = (value) => {
  if (value === null) return "null";
  return typeof value; // "string" | "number" | "boolean" (only primitives reach here)
};

// Input: any value produced by JSON.parse (already validated upstream via
// jsonUtils.validateAndFormatJSON).
export function jsonToGraph(value, options = {}) {
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;

  const nodes = [];
  const edges = [];
  let truncated = false;

  // Once the cap is hit, stop descending entirely rather than merely
  // skipping individual children -- keeps traversal cheap on pathological
  // input instead of walking the whole document just to discard most of it.
  const addNode = (node) => {
    if (truncated) return false;
    if (nodes.length >= maxNodes) {
      truncated = true;
      return false;
    }
    nodes.push(node);
    return true;
  };

  // Returns the id of the node created for `value`, or null if it was
  // skipped because the maxNodes cap was already reached.
  const buildNode = (nodeValue, id, path, label) => {
    if (truncated) return null;

    if (isPrimitive(nodeValue)) {
      // Only reachable for a primitive root -- primitive children of an
      // object/array are folded into their parent's `rows` instead.
      const node = {
        id,
        type: "primitive-root",
        path,
        label,
        rows: [{ key: null, valueType: getValueType(nodeValue), value: nodeValue }],
        childCount: 0,
      };
      return addNode(node) ? id : null;
    }

    const isArray = Array.isArray(nodeValue);
    const rows = [];
    const children = [];

    if (isArray) {
      nodeValue.forEach((item, index) => {
        if (isPrimitive(item)) {
          rows.push({ key: index, valueType: getValueType(item), value: item });
        } else {
          children.push({ key: index, value: item });
        }
      });
    } else {
      Object.keys(nodeValue).forEach((key) => {
        const item = nodeValue[key];
        if (isPrimitive(item)) {
          rows.push({ key, valueType: getValueType(item), value: item });
        } else {
          children.push({ key, value: item });
        }
      });
    }

    const node = {
      id,
      type: isArray ? "array" : "object",
      path,
      label,
      rows,
      // Arrays show total item count (matches the "N items" badge on the
      // node); objects show how many fields spawned a child node -- both
      // double as "does this node have anything to collapse/expand".
      childCount: isArray ? nodeValue.length : children.length,
    };

    if (!addNode(node)) return null;

    for (const child of children) {
      if (truncated) break;

      const childId = isArray ? `${id}[${child.key}]` : `${id}.${child.key}`;
      const childPath = isArray ? `${path}[${child.key}]` : `${path}.${child.key}`;
      const createdId = buildNode(child.value, childId, childPath, String(child.key));

      if (createdId) {
        edges.push({
          id: `${id}->${createdId}`,
          source: id,
          target: createdId,
          label: String(child.key),
        });
      }
    }

    return id;
  };

  buildNode(value, "root", "$", null);

  return { nodes, edges, nodeCount: nodes.length, truncated };
}

// Resolves the live JS value at a node's `path` (e.g. "$.items[2].name")
// against the original parsed JSON -- used by NodeDetailModal so a node
// click can show that subtree's full formatted JSON without jsonToGraph
// needing to carry raw values around on every node.
export function getValueAtPath(root, path) {
  if (!path || path === "$") return root;

  const tokens = path.slice(1).match(/\.[^.[\]]+|\[\d+\]/g) || [];
  let current = root;

  for (const token of tokens) {
    if (current == null) return undefined;
    if (token[0] === "[") {
      current = current[parseInt(token.slice(1, -1), 10)];
    } else {
      current = current[token.slice(1)];
    }
  }

  return current;
}

// Returns the ids of nodes (from an already-laid-out/visible node list)
// whose label, path, or any row's key/value matches `term`
// (case-insensitive substring match). Used to drive the search box's
// highlight + cycle-through + center behavior.
export function searchGraphNodes(nodes, term) {
  if (!term || !term.trim()) return [];
  const needle = term.trim().toLowerCase();

  return nodes
    .filter((node) => {
      if (node.label && String(node.label).toLowerCase().includes(needle)) return true;
      if (node.path && node.path.toLowerCase().includes(needle)) return true;
      return node.rows.some(
        (row) =>
          String(row.key).toLowerCase().includes(needle) ||
          String(row.value).toLowerCase().includes(needle)
      );
    })
    .map((node) => node.id);
}

// Applies a collapsed-id Set as a filter over a {nodes, edges} result --
// kept separate from the transform above so toggling collapse never
// requires re-parsing/re-walking the source JSON. A node is hidden once
// any ancestor edge's source is collapsed.
export function filterCollapsedGraph({ nodes, edges }, collapsedIds) {
  if (!collapsedIds || collapsedIds.size === 0) {
    return { nodes, edges };
  }

  const hiddenIds = new Set();
  const childrenBySource = new Map();
  edges.forEach((edge) => {
    if (!childrenBySource.has(edge.source)) childrenBySource.set(edge.source, []);
    childrenBySource.get(edge.source).push(edge.target);
  });

  const hideSubtree = (id) => {
    const childIds = childrenBySource.get(id) || [];
    childIds.forEach((childId) => {
      if (hiddenIds.has(childId)) return;
      hiddenIds.add(childId);
      hideSubtree(childId);
    });
  };

  collapsedIds.forEach((id) => hideSubtree(id));

  return {
    nodes: nodes.filter((node) => !hiddenIds.has(node.id)),
    edges: edges.filter((edge) => !hiddenIds.has(edge.source) && !hiddenIds.has(edge.target)),
  };
}
