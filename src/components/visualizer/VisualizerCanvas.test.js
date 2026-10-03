import { render, screen, fireEvent, act } from "@testing-library/react";
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

// jsdom implements none of the Fullscreen API -- stand in with a minimal
// mock: requestFullscreen()/exitFullscreen() update a module-local "current
// fullscreen element" and dispatch the real fullscreenchange event, exactly
// like a real browser would, so the component's own fullscreenchange
// listener (not just its button click handler) is what's actually under
// test.
describe("fullscreen toggle", () => {
  let fullscreenElement = null;

  beforeEach(() => {
    fullscreenElement = null;
    document.fullscreenEnabled = true;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement,
    });
    Element.prototype.requestFullscreen = jest.fn(function mockRequestFullscreen() {
      fullscreenElement = this;
      document.dispatchEvent(new Event("fullscreenchange"));
      return Promise.resolve();
    });
    document.exitFullscreen = jest.fn(() => {
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
      return Promise.resolve();
    });
  });

  afterEach(() => {
    delete document.fullscreenEnabled;
    delete Element.prototype.requestFullscreen;
    delete document.exitFullscreen;
    delete document.fullscreenElement;
  });

  const renderCanvas = (onFullscreenChange) =>
    render(
      <VisualizerCanvas
        graph={graph}
        direction="RIGHT"
        collapsedIds={new Set()}
        onToggleCollapse={() => {}}
        onNodeActivate={() => {}}
        searchMatchIds={new Set()}
        activeMatchId={null}
        onFullscreenChange={onFullscreenChange}
      />
    );

  test("the button enters and exits full screen, syncing its own icon/label and notifying the parent", async () => {
    const onFullscreenChange = jest.fn();
    renderCanvas(onFullscreenChange);

    const enterButton = screen.getByRole("button", { name: /enter full screen/i });
    await act(async () => {
      fireEvent.click(enterButton);
      await Promise.resolve();
    });

    expect(document.fullscreenElement).not.toBeNull();
    expect(screen.getByRole("button", { name: /exit full screen/i })).toBeInTheDocument();
    expect(onFullscreenChange).toHaveBeenLastCalledWith(true);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /exit full screen/i }));
      await Promise.resolve();
    });

    expect(document.fullscreenElement).toBeNull();
    expect(screen.getByRole("button", { name: /enter full screen/i })).toBeInTheDocument();
    expect(onFullscreenChange).toHaveBeenLastCalledWith(false);
  });

  test("the icon syncs when the browser exits full screen on its own (e.g. Esc), not just via the button", async () => {
    renderCanvas();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /enter full screen/i }));
      await Promise.resolve();
    });
    expect(screen.getByRole("button", { name: /exit full screen/i })).toBeInTheDocument();

    // The browser (not our code) clears fullscreenElement and fires the
    // event -- exactly what happens when the user presses Esc.
    await act(async () => {
      fullscreenElement = null;
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(screen.getByRole("button", { name: /enter full screen/i })).toBeInTheDocument();
  });
});
