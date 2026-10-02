import { jsonToGraph, filterCollapsedGraph, getValueAtPath, searchGraphNodes } from "./jsonGraph";

describe("jsonToGraph", () => {
  test("empty object -> single root node, zero edges", () => {
    const { nodes, edges, nodeCount, truncated } = jsonToGraph({});
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ id: "root", type: "object", rows: [], childCount: 0 });
    expect(edges).toHaveLength(0);
    expect(nodeCount).toBe(1);
    expect(truncated).toBe(false);
  });

  test("empty array -> single root node, zero edges", () => {
    const { nodes, edges } = jsonToGraph([]);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ id: "root", type: "array", rows: [], childCount: 0 });
    expect(edges).toHaveLength(0);
  });

  test("flat object of primitives -> one node, N rows, zero edges", () => {
    const { nodes, edges } = jsonToGraph({ a: 1, b: "x", c: true, d: null });
    expect(nodes).toHaveLength(1);
    expect(nodes[0].rows).toEqual([
      { key: "a", valueType: "number", value: 1 },
      { key: "b", valueType: "string", value: "x" },
      { key: "c", valueType: "boolean", value: true },
      { key: "d", valueType: "null", value: null },
    ]);
    expect(edges).toHaveLength(0);
  });

  test("nested object -> parent + child nodes with a labeled edge", () => {
    const { nodes, edges } = jsonToGraph({ address: { city: "NYC" } });
    expect(nodes).toHaveLength(2);

    const root = nodes.find((n) => n.id === "root");
    const child = nodes.find((n) => n.id === "root.address");

    expect(root.childCount).toBe(1);
    expect(child).toMatchObject({
      type: "object",
      path: "$.address",
      label: "address",
      rows: [{ key: "city", valueType: "string", value: "NYC" }],
    });

    expect(edges).toEqual([
      { id: "root->root.address", source: "root", target: "root.address", label: "address" },
    ]);
  });

  test("array of primitives -> one array node with childCount, no child nodes", () => {
    const { nodes, edges } = jsonToGraph(["a", "b", "c"]);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ id: "root", type: "array", childCount: 3 });
    expect(nodes[0].rows).toEqual([
      { key: 0, valueType: "string", value: "a" },
      { key: 1, valueType: "string", value: "b" },
      { key: 2, valueType: "string", value: "c" },
    ]);
    expect(edges).toHaveLength(0);
  });

  test("array of objects -> array node + one child node per item, edges labeled by index", () => {
    const { nodes, edges } = jsonToGraph([{ id: 1 }, { id: 2 }]);
    expect(nodes).toHaveLength(3); // root array + 2 item nodes
    const root = nodes.find((n) => n.id === "root");
    expect(root.type).toBe("array");
    expect(root.childCount).toBe(2);

    const item0 = nodes.find((n) => n.id === "root[0]");
    const item1 = nodes.find((n) => n.id === "root[1]");
    expect(item0).toMatchObject({ path: "$[0]", label: "0", rows: [{ key: "id", valueType: "number", value: 1 }] });
    expect(item1).toMatchObject({ path: "$[1]", label: "1", rows: [{ key: "id", valueType: "number", value: 2 }] });

    expect(edges).toEqual(
      expect.arrayContaining([
        { id: "root->root[0]", source: "root", target: "root[0]", label: "0" },
        { id: "root->root[1]", source: "root", target: "root[1]", label: "1" },
      ])
    );
  });

  test("deeply nested/mixed structure -> correct node/edge count and id/path stability", () => {
    const value = {
      user: {
        name: "Ada",
        roles: ["admin", "editor"],
        address: { city: "London", geo: { lat: 1.1, lng: 2.2 } },
      },
      active: true,
    };
    const { nodes, edges, nodeCount } = jsonToGraph(value);
    // nodes: root, user, user.roles (array is its own node even though its
    // items are primitives), user.address, user.address.geo
    const ids = nodes.map((n) => n.id).sort();
    expect(ids).toEqual(
      ["root", "root.user", "root.user.roles", "root.user.address", "root.user.address.geo"].sort()
    );
    expect(nodeCount).toBe(5);

    const geo = nodes.find((n) => n.id === "root.user.address.geo");
    expect(geo.path).toBe("$.user.address.geo");
    expect(geo.rows).toEqual([
      { key: "lat", valueType: "number", value: 1.1 },
      { key: "lng", valueType: "number", value: 2.2 },
    ]);

    expect(edges).toEqual(
      expect.arrayContaining([
        { id: "root->root.user", source: "root", target: "root.user", label: "user" },
        {
          id: "root.user->root.user.address",
          source: "root.user",
          target: "root.user.address",
          label: "address",
        },
        {
          id: "root.user.address->root.user.address.geo",
          source: "root.user.address",
          target: "root.user.address.geo",
          label: "geo",
        },
      ])
    );
  });

  test("maxNodes guard -> truncated: true and traversal actually stops at the limit", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const { nodes, truncated } = jsonToGraph({ items }, { maxNodes: 5 });
    expect(nodes.length).toBeLessThanOrEqual(5);
    expect(truncated).toBe(true);
  });

  test("bare top-level primitive input -> single node, no crash", () => {
    expect(jsonToGraph("hello").nodes).toEqual([
      {
        id: "root",
        type: "primitive-root",
        path: "$",
        label: null,
        rows: [{ key: null, valueType: "string", value: "hello" }],
        childCount: 0,
      },
    ]);

    expect(jsonToGraph(42).nodes[0].rows[0]).toEqual({ key: null, valueType: "number", value: 42 });
    expect(jsonToGraph(null).nodes[0].rows[0]).toEqual({ key: null, valueType: "null", value: null });
    expect(jsonToGraph(true).nodes[0].rows[0]).toEqual({ key: null, valueType: "boolean", value: true });
  });
});

describe("getValueAtPath", () => {
  const root = { user: { name: "Ada", roles: ["admin", "editor"] }, items: [{ id: 1 }, { id: 2 }] };

  test("returns the root for '$'", () => {
    expect(getValueAtPath(root, "$")).toBe(root);
  });

  test("resolves nested object paths", () => {
    expect(getValueAtPath(root, "$.user.name")).toBe("Ada");
  });

  test("resolves array index paths", () => {
    expect(getValueAtPath(root, "$.items[1].id")).toBe(2);
    expect(getValueAtPath(root, "$.user.roles[0]")).toBe("admin");
  });

  test("returns undefined for a path that doesn't exist", () => {
    expect(getValueAtPath(root, "$.missing.deeper")).toBeUndefined();
  });
});

describe("searchGraphNodes", () => {
  const { nodes } = jsonToGraph({
    user: { name: "Ada Lovelace", email: "ada@example.com" },
    tags: ["admin", "editor"],
  });

  test("returns no matches for an empty term", () => {
    expect(searchGraphNodes(nodes, "")).toEqual([]);
    expect(searchGraphNodes(nodes, "   ")).toEqual([]);
  });

  test("matches by row value (case-insensitive)", () => {
    const ids = searchGraphNodes(nodes, "lovelace");
    expect(ids).toContain("root.user");
  });

  test("matches by row key", () => {
    const ids = searchGraphNodes(nodes, "email");
    expect(ids).toContain("root.user");
  });

  test("matches by node label", () => {
    const ids = searchGraphNodes(nodes, "tags");
    expect(ids).toContain("root.tags");
  });

  test("returns an empty array when nothing matches", () => {
    expect(searchGraphNodes(nodes, "nonexistent-term")).toEqual([]);
  });
});

describe("filterCollapsedGraph", () => {
  const graph = jsonToGraph({
    user: { name: "Ada", address: { city: "London" } },
    tags: ["a", "b"],
  });

  test("returns the same graph when nothing is collapsed", () => {
    const result = filterCollapsedGraph(graph, new Set());
    expect(result.nodes).toHaveLength(graph.nodes.length);
    expect(result.edges).toHaveLength(graph.edges.length);
  });

  test("hides descendant nodes/edges of a collapsed node", () => {
    const result = filterCollapsedGraph(graph, new Set(["root.user"]));
    const ids = result.nodes.map((n) => n.id);
    expect(ids).toContain("root");
    expect(ids).toContain("root.user");
    expect(ids).not.toContain("root.user.address");
    expect(result.edges.some((e) => e.source === "root.user")).toBe(false);
  });
});
