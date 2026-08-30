# Issue 5: Line/column/suggestion error UI never populated

**Severity:** Medium (UX — feature exists but is unreachable)
**Status:** Fixed
**Files:** [src/App.js](../src/App.js), [src/utils/jsonUtils.js](../src/utils/jsonUtils.js), [src/components/OutputViewer.jsx](../src/components/OutputViewer.jsx)

## Symptom

When invalid JSON is entered, the error panel only ever shows a generic `❌ Error: Invalid JSON` — never the line number, column number, or suggested fix, even though `OutputViewer` is built to display all three.

## Root Cause Analysis

`OutputViewer` renders a rich error block:

```jsx
{error && (
  <div>
    <strong>❌ Error:</strong> {error.message}
    {error.line && <>📍 Line: {error.line}<br /></>}
    {error.column && <>📌 Column: {error.column}<br /></>}
    <div>💡 Fix: {error.suggestion}</div>
  </div>
)}
```

This expects `error` to have `message`, `line`, `column`, and `suggestion` fields. `src/utils/jsonUtils.js` already implements exactly this: `validateAndFormatJSON()` uses `jsonlint-mod` to get a precise parser error, regex-extracts the line/column from the message, and generates a `suggestion` via `getSuggestion()`.

However, the live code path in `App.js` never calls `validateAndFormatJSON`. `autoFormatJSON` uses the plain built-in `JSON.parse` instead and sets a minimal error on failure:

```js
} catch (e) {
  setInput(raw);
  setOutput("");
  setError({ message: "Invalid JSON" });   // no line/column/suggestion
}
```

The `import { validateAndFormatJSON, minifyJSON } from "./utils/jsonUtils"` line only exists in the commented-out legacy version of `App.js` (lines 75-188) — it was never carried over into the active component. So the more capable validator (and its `jsonlint-mod` dependency, which is otherwise unused in the running app) is dead code from the live UI's perspective, and `OutputViewer`'s line/column/suggestion rendering path is unreachable.

## Solution

In `autoFormatJSON`, swap `JSON.parse`/manual error construction for the existing utility:

```js
import { validateAndFormatJSON } from "./utils/jsonUtils";

const autoFormatJSON = (raw) => {
  const result = validateAndFormatJSON(raw);

  if (result.valid) {
    setInput(result.formatted);
    setOutput(result.formatted);
    setError(null);
  } else {
    setInput(raw);
    setOutput("");
    setError(result.error); // already has message, line, column, suggestion
  }
};
```

(If [Issue 3](03-aggressive-auto-format-disrupts-typing.md)'s Option B is also applied, drop the `setInput(...)` calls here and only set `output`/`error`.)

**Verification:** after the change, entering JSON with a trailing comma or missing quote should show a specific line/column and a suggestion (e.g. "Check for missing comma, extra comma, or invalid character."), not just "Invalid JSON".

## Applied fix

`App.js` now imports `validateAndFormatJSON` from `src/utils/jsonUtils.js` and calls it (via `validateAndSetOutput`) instead of a bare `JSON.parse`/manual error object. On failure, `error` is now `result.error` — the full `{ message, line, column, suggestion }` object from `jsonlint-mod` — so `OutputViewer`'s existing line/column/suggestion rendering is now reachable. (This was combined with the [Issue 3](03-aggressive-auto-format-disrupts-typing.md) fix: `setInput(...)` was dropped from this path since the input editor is no longer driven by the formatted/validated result.)

**Verification:** added a test in `src/App.test.js` ("shows a detailed error with line number and suggestion for invalid JSON") asserting the `Line:` and `Fix:` text render, not just the generic error message. All tests pass; `CI=true npm run build` still compiles cleanly.
