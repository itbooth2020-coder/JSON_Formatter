import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// @monaco-editor/react loads Monaco from a CDN and won't render in jsdom;
// stand in with a plain textarea driving the same value/onChange contract.
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

test('renders the app header', () => {
  render(<App />);
  expect(
    screen.getByText(/JSON Formatter & Compare Tool/i)
  ).toBeInTheDocument();
});

test('formats valid JSON typed into the input editor', async () => {
  render(<App />);

  const input = screen.getByTestId('input-editor');
  fireEvent.change(input, { target: { value: '{"a":1}' } });

  await waitFor(() => {
    expect(screen.getByTestId('output-editor').value).toContain('"a": 1');
  });
});

test('shows a detailed error with line number and suggestion for invalid JSON', async () => {
  render(<App />);

  const input = screen.getByTestId('input-editor');
  fireEvent.change(input, { target: { value: '{invalid' } });

  await waitFor(() => {
    expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    expect(screen.getByText(/Line:/i)).toBeInTheDocument();
    expect(screen.getByText(/Fix:/i)).toBeInTheDocument();
  });
});

test('input editor is not rewritten while the user is still typing', async () => {
  render(<App />);

  const input = screen.getByTestId('input-editor');
  fireEvent.change(input, { target: { value: '{"a":1' } });

  // Wait for the debounced validation (incomplete JSON -> error) to run,
  // then confirm the input was never rewritten while typing.
  await waitFor(() => {
    expect(screen.getByText(/Error:/i)).toBeInTheDocument();
  });
  expect(input.value).toBe('{"a":1');
});

test('Beautify, Minify, and Clear buttons work', async () => {
  render(<App />);

  const input = screen.getByTestId('input-editor');
  fireEvent.change(input, { target: { value: '{"a":1}' } });

  await screen.findByRole('button', { name: /beautify/i });

  fireEvent.click(screen.getByRole('button', { name: /minify/i }));
  await waitFor(() => {
    expect(screen.getByTestId('output-editor').value).toBe('{"a":1}');
  });

  fireEvent.click(screen.getByRole('button', { name: /beautify/i }));
  await waitFor(() => {
    expect(screen.getByTestId('output-editor').value).toContain('"a": 1');
  });

  fireEvent.click(screen.getByRole('button', { name: /clear/i }));
  await waitFor(() => {
    expect(screen.getByTestId('input-editor').value).toBe('');
    expect(screen.getByTestId('output-editor').value).toBe('');
  });
});
