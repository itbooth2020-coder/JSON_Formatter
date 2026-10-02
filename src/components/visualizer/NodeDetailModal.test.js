import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NodeDetailModal from "./NodeDetailModal";

jest.mock("@monaco-editor/react", () => ({
  __esModule: true,
  default: ({ value }) => <textarea data-testid="node-json-editor" readOnly value={value || ""} />,
}));

const rootValue = { user: { name: "Ada", address: { city: "London" } } };
const node = { id: "root.user.address", label: "address", path: "$.user.address" };

const writeText = jest.fn().mockResolvedValue(undefined);
beforeAll(() => {
  Object.assign(navigator, { clipboard: { writeText } });
});

test("shows the node's path and its formatted JSON subtree", () => {
  render(<NodeDetailModal open node={node} rootValue={rootValue} onClose={() => {}} />);
  expect(screen.getByText("$.user.address")).toBeInTheDocument();
  expect(screen.getByTestId("node-json-editor").value).toContain('"city": "London"');
});

test("copy button copies the formatted JSON to the clipboard", async () => {
  render(<NodeDetailModal open node={node} rootValue={rootValue} onClose={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /copy node json/i }));

  await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining('"city": "London"')));
});

test("calls onClose when the Close button is clicked", () => {
  const onClose = jest.fn();
  render(<NodeDetailModal open node={node} rootValue={rootValue} onClose={onClose} />);
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  expect(onClose).toHaveBeenCalled();
});
