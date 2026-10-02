import { jsonToGraph } from "./jsonGraph";
import { layoutGraph } from "./jsonGraphLayout";

describe("layoutGraph", () => {
  test("returns an empty array for an empty graph", async () => {
    const positioned = await layoutGraph([], []);
    expect(positioned).toEqual([]);
  });

  test("every returned node has numeric x/y/width/height", async () => {
    const { nodes, edges } = jsonToGraph({
      user: { name: "Ada", address: { city: "London" } },
      tags: ["a", "b", "c"],
    });

    const positioned = await layoutGraph(nodes, edges);
    expect(positioned).toHaveLength(nodes.length);

    positioned.forEach((node) => {
      expect(typeof node.x).toBe("number");
      expect(typeof node.y).toBe("number");
      expect(Number.isNaN(node.x)).toBe(false);
      expect(Number.isNaN(node.y)).toBe(false);
      expect(node.width).toBeGreaterThan(0);
      expect(node.height).toBeGreaterThan(0);
    });
  });

  test("sibling nodes at the same layer do not overlap on the cross axis", async () => {
    // root -> two children at the same depth (siblings), layered left-to-right
    // ("RIGHT"), so siblings are stacked along y and should not overlap.
    const { nodes, edges } = jsonToGraph({ a: { x: 1 }, b: { y: 2 } });
    const positioned = await layoutGraph(nodes, edges);

    const a = positioned.find((n) => n.id === "root.a");
    const b = positioned.find((n) => n.id === "root.b");

    const overlaps =
      a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
    expect(overlaps).toBe(false);
  });

  test("preserves jsonGraph node fields (id, type, rows) alongside layout fields", async () => {
    const { nodes, edges } = jsonToGraph({ a: 1 });
    const positioned = await layoutGraph(nodes, edges);
    const root = positioned.find((n) => n.id === "root");
    expect(root.type).toBe("object");
    expect(root.rows).toEqual([{ key: "a", valueType: "number", value: 1 }]);
  });
});
