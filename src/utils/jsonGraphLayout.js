// Thin wrapper around elkjs: takes the { nodes, edges } shape produced by
// jsonGraph.js (post collapse-filter) and returns the same nodes with
// x/y/width/height added, ready to hand to React Flow. Isolating this
// means swapping elkjs for another layout engine later only touches this
// file. Imports the browser-safe bundled build (self-contained, no
// external `web-worker` require surfaced to webpack/CRA's bundler).
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

// Estimated node card dimensions -- a real DOM measurement would be more
// accurate, but a row-count-based estimate is enough for ELK's layered
// algorithm to avoid overlaps, and keeps layout synchronous-feeling
// (no render-measure-relayout round trip).
export const NODE_WIDTH = 240;
export const NODE_HEADER_HEIGHT = 36;
export const NODE_ROW_HEIGHT = 22;
export const NODE_MIN_HEIGHT = 48;

export const estimateNodeHeight = (node) => {
  const rowCount = node.rows?.length ?? 0;
  return Math.max(NODE_MIN_HEIGHT, NODE_HEADER_HEIGHT + rowCount * NODE_ROW_HEIGHT);
};

// direction: "RIGHT" (default, left-to-right tree) | "DOWN" | "LEFT" | "UP"
export async function layoutGraph(nodes, edges, options = {}) {
  const direction = options.direction || "RIGHT";

  if (nodes.length === 0) {
    return [];
  }

  const elkGraph = {
    id: "elk-root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.spacing.nodeNode": "32",
      "elk.layered.spacing.nodeNodeBetweenLayers": "72",
      "elk.layered.spacing.edgeNodeBetweenLayers": "24",
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: NODE_WIDTH,
      height: estimateNodeHeight(node),
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const result = await elk.layout(elkGraph);
  const positionById = new Map(
    (result.children || []).map((child) => [
      child.id,
      { x: child.x ?? 0, y: child.y ?? 0, width: child.width ?? NODE_WIDTH, height: child.height ?? NODE_MIN_HEIGHT },
    ])
  );

  return nodes.map((node) => {
    const pos = positionById.get(node.id) || {
      x: 0,
      y: 0,
      width: NODE_WIDTH,
      height: estimateNodeHeight(node),
    };
    return { ...node, x: pos.x, y: pos.y, width: pos.width, height: pos.height };
  });
}
