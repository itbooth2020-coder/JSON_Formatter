import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import JsonVisualizerPage from "./JsonVisualizerPage";

// @monaco-editor/react loads Monaco from a CDN and won't render in jsdom;
// stand in with a plain textarea driving the same value/onChange contract
// (mirrors JsonFormatterPage.test.js's mock).
jest.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: ({ value, onChange, options }) => (
    <textarea
      data-testid={options?.readOnly ? "node-json-editor" : "input-editor"}
      readOnly={options?.readOnly}
      value={value || ""}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
}));

// The real VisualizerCanvas pulls in @xyflow/react + an async elkjs layout
// pass, which would make this page-level test slow/flaky for behavior
// that's already covered by VisualizerCanvas.test.js and
// jsonGraph/jsonGraphLayout unit tests. Stand in with a minimal stub that
// exposes just enough to assert the page wired the graph through.
jest.mock("../components/visualizer/VisualizerCanvas", () => ({
  __esModule: true,
  default: ({ graph }) => (
    <div data-testid="visualizer-canvas">graph nodes: {graph.nodes.length}</div>
  ),
}));

const renderPage = () => render(<JsonVisualizerPage title="JSON Visualizer" />);

test("renders the page title", () => {
  renderPage();
  expect(screen.getByRole("heading", { name: /JSON Visualizer/i })).toBeInTheDocument();
});

test("loads with a sample JSON by default so the graph is visible immediately", async () => {
  renderPage();

  const input = screen.getByTestId("input-editor");
  expect(input.value).toContain("Ada Lovelace");

  await waitFor(() => {
    expect(screen.getByTestId("visualizer-canvas")).not.toHaveTextContent("graph nodes: 0");
  });
  expect(screen.getByText(/valid json/i)).toBeInTheDocument();
});

test("typing valid JSON produces a non-empty graph and updates the node count", async () => {
  renderPage();

  const input = screen.getByTestId("input-editor");
  fireEvent.change(input, { target: { value: '{"a":1,"b":{"c":2}}' } });

  await waitFor(() => {
    expect(screen.getByTestId("visualizer-canvas")).toHaveTextContent("graph nodes: 2");
  });
  expect(screen.getByText(/2 nodes/i)).toBeInTheDocument();
  expect(screen.getByText(/valid json/i)).toBeInTheDocument();
});

test("typing invalid JSON shows the existing error shape in the status bar", async () => {
  renderPage();

  const input = screen.getByTestId("input-editor");
  fireEvent.change(input, { target: { value: "{invalid" } });

  await waitFor(() => {
    expect(screen.getByText(/expecting/i)).toBeInTheDocument();
  });
  // baseGraph (parsed from input) and positionedGraph (derived from it via
  // the async layout effect) land in separate renders -- since the page now
  // starts with a non-empty sample graph, clearing it on invalid input is a
  // real transition (not a no-op), so give the layout effect its own tick.
  await waitFor(() => {
    expect(screen.getByTestId("visualizer-canvas")).toHaveTextContent("graph nodes: 0");
  });
  expect(screen.queryByText(/^valid json$/i)).not.toBeInTheDocument();
});

test("Live Transform off: the graph does not update until Transform is clicked", async () => {
  renderPage();

  // The page starts with the default sample JSON already transformed into a
  // graph -- capture that baseline before disabling Live Transform.
  const canvas = screen.getByTestId("visualizer-canvas");
  await waitFor(() => expect(canvas).not.toHaveTextContent("graph nodes: 0"));
  const sampleGraphText = canvas.textContent;

  fireEvent.click(screen.getByRole("switch", { name: /live transform/i }));

  const input = screen.getByTestId("input-editor");
  fireEvent.change(input, { target: { value: '{"a":1}' } });

  // Give the (unused, since Live Transform is off) debounce window time to
  // pass -- the graph must still reflect the sample JSON, not the new input.
  await new Promise((r) => setTimeout(r, 600));
  expect(canvas).toHaveTextContent(sampleGraphText);

  fireEvent.click(screen.getByRole("button", { name: /transform/i }));
  await waitFor(() => {
    expect(screen.getByTestId("visualizer-canvas")).toHaveTextContent("graph nodes: 1");
  });
});

test("collapsing and expanding the editor panel keeps the editor mounted (content/undo state preserved)", async () => {
  renderPage();

  const collapseButton = screen.getByRole("button", { name: /collapse editor/i });
  const inputBefore = screen.getByTestId("input-editor");
  expect(inputBefore.value).toContain("Ada Lovelace");

  fireEvent.click(collapseButton);

  // The rail's "Expand editor" button appears, and the editor itself is
  // still in the DOM (just visually covered by the rail overlay) rather
  // than unmounted -- that's what actually preserves Monaco's undo stack
  // in the real browser (verified separately via Playwright).
  const expandButton = await screen.findByRole("button", { name: /expand editor/i });
  expect(screen.queryByRole("button", { name: /collapse editor/i })).not.toBeInTheDocument();
  const inputAfterCollapse = screen.getByTestId("input-editor");
  expect(inputAfterCollapse).toBe(inputBefore);
  expect(inputAfterCollapse.value).toContain("Ada Lovelace");

  fireEvent.click(expandButton);

  await screen.findByRole("button", { name: /collapse editor/i });
  expect(screen.queryByRole("button", { name: /expand editor/i })).not.toBeInTheDocument();
  expect(screen.getByTestId("input-editor")).toBe(inputBefore);
});

test("empty input shows the same empty-input error message contract as other pages", async () => {
  renderPage();

  const input = screen.getByTestId("input-editor");
  fireEvent.change(input, { target: { value: "{}" } });
  await waitFor(() => {
    expect(screen.getByTestId("visualizer-canvas")).toHaveTextContent("graph nodes: 1");
  });

  fireEvent.change(input, { target: { value: "" } });
  await waitFor(() => {
    expect(screen.getByText(/JSON input is empty\. Please enter some JSON\./i)).toBeInTheDocument();
  });
});
