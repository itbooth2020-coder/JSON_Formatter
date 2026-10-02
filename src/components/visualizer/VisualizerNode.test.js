import { render, screen, fireEvent } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import VisualizerNode from "./VisualizerNode";

const baseData = {
  id: "root.user",
  label: "user",
  type: "object",
  rows: [
    { key: "name", valueType: "string", value: "Ada" },
    { key: "age", valueType: "number", value: 36 },
  ],
  childCount: 1,
  hasChildNodes: true,
  collapsed: false,
  isRoot: false,
  isSearchMatch: false,
  isActiveMatch: false,
  direction: "RIGHT",
};

const renderNode = (overrides = {}) =>
  render(
    <ReactFlowProvider>
      <VisualizerNode data={{ ...baseData, ...overrides }} />
    </ReactFlowProvider>
  );

test("renders the node label and its primitive rows", () => {
  renderNode();
  expect(screen.getByText("user")).toBeInTheDocument();
  expect(screen.getByText("name")).toBeInTheDocument();
  expect(screen.getByText('"Ada"')).toBeInTheDocument();
  expect(screen.getByText("age")).toBeInTheDocument();
  expect(screen.getByText("36")).toBeInTheDocument();
});

test("clicking the node calls onActivate with its id", () => {
  const onActivate = jest.fn();
  renderNode({ onActivate });
  fireEvent.click(screen.getByRole("button", { name: /user/i }));
  expect(onActivate).toHaveBeenCalledWith("root.user");
});

test("pressing Enter activates the node (keyboard accessibility)", () => {
  const onActivate = jest.fn();
  renderNode({ onActivate });
  fireEvent.keyDown(screen.getByRole("button", { name: /user/i }), { key: "Enter" });
  expect(onActivate).toHaveBeenCalledWith("root.user");
});

test("clicking the collapse chevron calls onToggleCollapse without activating the node", () => {
  const onToggleCollapse = jest.fn();
  const onActivate = jest.fn();
  renderNode({ onToggleCollapse, onActivate });
  fireEvent.click(screen.getByRole("button", { name: /collapse node/i }));
  expect(onToggleCollapse).toHaveBeenCalledWith("root.user");
  expect(onActivate).not.toHaveBeenCalled();
});

test("does not render a collapse chevron when the node has no children", () => {
  renderNode({ hasChildNodes: false });
  expect(screen.queryByRole("button", { name: /collapse node/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /expand node/i })).not.toBeInTheDocument();
});
