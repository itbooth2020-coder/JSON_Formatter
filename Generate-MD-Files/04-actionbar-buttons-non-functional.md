# Issue 4: Beautify / Minify / Clear buttons do nothing

**Severity:** Medium (functionality)
**Status:** Fixed (Option A applied on 2026-08-30, after initially being left as-is)
**Files:** [src/App.js](../src/App.js), [src/components/ActionBar.jsx](../src/components/ActionBar.jsx)

## Symptom

Clicking the "Beautify", "Minify", or "Clear" buttons in the toolbar has no visible effect. Only "Upload JSON" works.

## Root Cause Analysis

`ActionBar` destructures and wires four handler props:

```jsx
const ActionBar = ({ onFormat, onMinify, onClear, onUpload }) => {
  ...
  <Button onClick={onFormat}>Beautify</Button>
  <Button onClick={onMinify}>Minify</Button>
  <Button onClick={onClear}>Clear</Button>
  ...
```

But `App.js` only passes one of the four:

```jsx
<ActionBar onUpload={handleUpload} />
```

`onFormat`, `onMinify`, and `onClear` are `undefined` in `ActionBar`, so `onClick={undefined}` — clicking those buttons is a no-op. No error is thrown (React silently ignores an `undefined` `onClick`), which is why this fails silently rather than crashing.

The commented-out code at the bottom of `App.js` (lines 100–188) shows this used to work: `handleFormat`, `handleMinify`, and `handleClear` were defined there and passed to `ActionBar`, but the active `App` component above them never re-implements or re-wires those handlers — only `autoFormatJSON`/`handleInputChange`/`handleUpload` survived into the current version.

## Solution

Two valid directions, depending on intended product behavior:

**A — Restore the handlers (recommended if manual control is desired):**
```js
const handleFormat = () => autoFormatJSON(input);

const handleMinify = () => {
  try {
    setOutput(JSON.stringify(JSON.parse(input)));
    setError(null);
  } catch {
    setError({ message: "Invalid JSON for minify" });
    setOutput("");
  }
};

const handleClear = () => {
  setInput("");
  setOutput("");
  setError(null);
};
```
and pass all four to `ActionBar`:
```jsx
<ActionBar
  onFormat={handleFormat}
  onMinify={handleMinify}
  onClear={handleClear}
  onUpload={handleUpload}
/>
```

**B — Remove the dead buttons:** since input already auto-formats on typing (see [Issue 3](03-aggressive-auto-format-disrupts-typing.md)), drop the Beautify/Minify/Clear buttons from `ActionBar` and keep only Upload, to avoid presenting controls that don't do anything.

## Applied fix

Applied Option A, adapted to build on the [Issue 3](03-aggressive-auto-format-disrupts-typing.md)/[Issue 5](05-error-diagnostics-not-wired.md) fixes already in place (which introduced `validateAndSetOutput`, wrapping `validateAndFormatJSON`, instead of the original `autoFormatJSON`):

```js
const handleFormat = () => {
  clearTimeout(debounceRef.current);
  validateAndSetOutput(input);
};

const handleMinify = () => {
  clearTimeout(debounceRef.current);
  const result = validateAndFormatJSON(input);

  if (result.valid) {
    setOutput(JSON.stringify(JSON.parse(input)));
    setError(null);
  } else {
    setOutput("");
    setError(result.error);
  }
};

const handleClear = () => {
  clearTimeout(debounceRef.current);
  setInput("");
  setOutput("");
  setError(null);
};
```

All three cancel any pending debounced validation (`clearTimeout(debounceRef.current)`) before acting, so a stale auto-format from typing can't overwrite a manual button click's result. All four handlers are now passed to `ActionBar`.

**Verification:** added a test in `src/App.test.js` ("Beautify, Minify, and Clear buttons work") that types JSON, clicks Minify and asserts compact output, clicks Beautify and asserts pretty-printed output, then clicks Clear and asserts both editors are empty. `CI=true npm test` → 5/5 pass; `CI=true npm run build` still compiles cleanly.

## Note

This was initially raised during the review pass and left as-is per the user's decision at the time; it was implemented in a follow-up request. Recorded here so the history isn't lost.
