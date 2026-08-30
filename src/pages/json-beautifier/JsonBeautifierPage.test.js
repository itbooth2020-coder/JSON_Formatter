import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import JsonBeautifierPage from './JsonBeautifierPage';

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

const renderPage = () => render(<JsonBeautifierPage title="JSON Beautifier" />);

test('renders the page title', () => {
  renderPage();
  expect(
    screen.getByRole('heading', { name: /JSON Beautifier/i })
  ).toBeInTheDocument();
});

test('formats valid JSON typed into the input editor', async () => {
  renderPage();

  const input = screen.getByTestId('input-editor');
  fireEvent.change(input, { target: { value: '{"a":1}' } });

  await waitFor(() => {
    expect(screen.getByTestId('output-editor').value).toContain('"a": 1');
  });
});

test('shows a detailed error with line number and suggestion for invalid JSON', async () => {
  renderPage();

  const input = screen.getByTestId('input-editor');
  fireEvent.change(input, { target: { value: '{invalid' } });

  await waitFor(() => {
    expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    expect(screen.getByText(/Line:/i)).toBeInTheDocument();
    expect(screen.getByText(/Fix:/i)).toBeInTheDocument();
  });
});

test('input editor is not rewritten while the user is still typing', async () => {
  renderPage();

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
  renderPage();

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

test('the "Valid JSON" success message auto-hides after 10 seconds', () => {
  jest.useFakeTimers();

  renderPage();

  const input = screen.getByTestId('input-editor');
  fireEvent.change(input, { target: { value: '{"a":1}' } });

  act(() => {
    jest.advanceTimersByTime(500); // debounced validation
  });
  expect(screen.getByText(/Valid JSON/i)).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(10000); // success message auto-hide
  });
  expect(screen.queryByText(/Valid JSON/i)).not.toBeInTheDocument();

  jest.useRealTimers();
});

test('Beautify, Minify, and Clear all show a friendly message on empty input', async () => {
  renderPage();

  for (const name of [/beautify/i, /minify/i, /clear/i]) {
    fireEvent.click(screen.getByRole('button', { name }));
    // eslint-disable-next-line no-await-in-loop
    await waitFor(() => {
      expect(
        screen.getByText(/JSON input is empty\. Please enter some JSON\./i)
      ).toBeInTheDocument();
    });
  }
});
