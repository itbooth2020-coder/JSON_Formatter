import { render, screen } from '@testing-library/react';
import App from './App';
import { TOOLS } from './toolsConfig';

// @monaco-editor/react loads Monaco from a CDN and won't render in jsdom;
// stand in with a plain textarea driving the same value/onChange contract.
// (Only relevant once a tool page renders, but App always mounts one.)
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ value, onChange, options }) => (
    <textarea
      data-testid={options?.readOnly ? 'output-editor' : 'input-editor'}
      readOnly={options?.readOnly}
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
}));

beforeEach(() => {
  window.history.pushState({}, '', '/');
});

test('renders the header and the home page with a card for every tool', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /JsonForge/i, level: 1 })).toBeInTheDocument();

  TOOLS.forEach((tool) => {
    expect(screen.getByRole('link', { name: new RegExp(tool.name, 'i') })).toHaveAttribute(
      'href',
      tool.path
    );
  });
});

test('navigating to /json-formatter renders the formatter tool', async () => {
  window.history.pushState({}, '', '/json-formatter');
  render(<App />);

  expect(await screen.findByTestId('input-editor')).toBeInTheDocument();
  // "JSON Formatter" now appears twice -- once as the page's own heading,
  // once again as the footer's page-aware title -- so assert at least one
  // rather than a single unique match.
  expect(
    screen.getAllByRole('heading', { name: /^JSON Formatter$/i }).length
  ).toBeGreaterThan(0);
});

test('unknown routes redirect to the home page', () => {
  window.history.pushState({}, '', '/this-route-does-not-exist');
  render(<App />);

  expect(screen.getByText(/JSON tools, all in your browser/i)).toBeInTheDocument();
});
