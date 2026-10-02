import { render, screen } from "@testing-library/react";
import VisualizerCanvas from "./VisualizerCanvas";

const graph = {
  nodes: [
    {
      id: "root",
      type: "object",
      label: null,
      path: "$",
      rows: [{ key: "a", valueType: "number", value: 1 }],
      childCount: 1,
      x: 0,
      y: 0,
      width: 220,
      height: 80,
    },
    {
      id: "root.b",
      type: "object",
      label: "b",
      path: "$.b",
      rows: [],
      childCount: 0,
      x: 300,
      y: 0,
      width: 220,
      height: 60,
    },
  ],
  edges: [{ id: "root->root.b", source: "root", target: "root.b", label: "b" }],
};

test("shows a placeholder message when the graph is empty", () => {
  render(
    <VisualizerCanvas
      graph={{ nodes: [], edges: [] }}
      direction="RIGHT"
      collapsedIds={new Set()}
      onToggleCollapse={() => {}}
      onNodeActivate={() => {}}
      searchMatchIds={new Set()}
      activeMatchId={null}
    />
  );
  expect(screen.getByText(/enter valid json to see the graph/i)).toBeInTheDocument();
});

test("renders every node's label from a populated graph", () => {
  render(
    <VisualizerCanvas
      graph={graph}
      direction="RIGHT"
      collapsedIds={new Set()}
      onToggleCollapse={() => {}}
      onNodeActivate={() => {}}
      searchMatchIds={new Set()}
      activeMatchId={null}
    />
  );
  expect(screen.getByText("root")).toBeInTheDocument();
  expect(screen.getByText("b")).toBeInTheDocument();
});
