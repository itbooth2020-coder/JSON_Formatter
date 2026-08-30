# Issue 3: Auto-reformat on every typing pause disrupts editing

**Severity:** High (core-feature UX)
**Status:** Fixed (Option B applied)
**Files:** [src/App.js](../src/App.js), [src/components/JsonEditor.jsx](../src/components/JsonEditor.jsx)

## Symptom

While typing multi-line JSON into the input editor, the editor content visibly resets and the cursor jumps roughly every 500ms after a typing pause, interrupting continuous typing — most noticeable when entering JSON that isn't already indented the way `JSON.stringify(parsed, null, 2)` would format it.

## Root Cause Analysis

`JsonEditor` renders Monaco's `<Editor>` as a **controlled** component:

```jsx
<Editor value={value} onChange={(val) => onChange(val)} ... />
```

`value` comes from `App.js`'s `input` state. But `App.js`'s `handleInputChange` does not update `input` directly on each keystroke — it only starts a debounce timer:

```js
const handleInputChange = (val) => {
  clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    autoFormatJSON(val);
  }, 500);
};
```

500ms after the user stops typing, `autoFormatJSON` runs, and on success it does:

```js
const formatted = JSON.stringify(parsed, null, 2);
setInput(formatted);   // pushes a NEW value back into the controlled Editor
setOutput(formatted);
```

Whenever `formatted` differs from what's currently in the editor buffer (true for almost any input that isn't already pretty-printed with 2-space indent — e.g. minified JSON, or JSON the user is still in the middle of typing), the controlled `value` prop changes and Monaco resets the model to match it. This:

1. Replaces the buffer content out from under the user mid-edit.
2. Moves the cursor/selection to an unpredictable position (typically the start or wherever the new text diff lands), rather than preserving the user's cursor location.
3. Repeats on every 500ms pause, so a user typing a large JSON document gets interrupted repeatedly rather than once at the end.

This is a controlled-component feedback loop: the app treats "format" as a side effect of "the user stopped typing," rather than an explicit action, and feeds the reformatted text straight back into the same editor the user is actively using.

## Solution

Pick one of the following (in order of how much they preserve the current "live" UX while fixing the disruption):

**Option A — Format on blur instead of on pause.** Only call `autoFormatJSON` when the editor loses focus (Monaco's `onDidBlurEditorText` / a wrapping `onBlur`), not on a typing-pause timer. This keeps auto-formatting but only fires once the user is actually done editing.

**Option B — Don't feed formatted text back into the live editor.** Keep two states: `rawInput` (what the user is typing, always reflected verbatim in `JsonEditor`) and `output` (the formatted result, shown only in `OutputViewer`, which is already a separate read-only Monaco instance). Stop calling `setInput(formatted)` in `autoFormatJSON` — only `setOutput(formatted)`. This is the smallest change and removes the feedback loop entirely.

**Option C — Preserve cursor position across reformat.** If reformat-in-place is a hard requirement, capture the Monaco editor's cursor/selection via a ref before calling `setInput`, and restore it after, using Monaco's `onMount` to get an editor instance and `editor.getPosition()` / `editor.setPosition()`. More complex; only worth it if in-place reformatting while typing is an intentional product decision.

Recommend **Option B** — it's the least code, matches how `OutputViewer` already exists as the dedicated "formatted result" panel, and removes the root cause (controlled Editor being re-driven by its own debounced output) rather than working around it.

## Applied fix

`App.js`'s `handleInputChange` now sets `input` immediately on every keystroke (so `JsonEditor`'s `value` prop always mirrors exactly what the user typed) and only uses the 500ms debounce to derive `output`/`error` via `validateAndSetOutput`. `autoFormatJSON` no longer calls `setInput(...)` on success — formatting only ever writes to `output`, never back into the live input editor.

**Verification:** added a regression test in `src/App.test.js` ("input editor is not rewritten while the user is still typing") that types incomplete JSON, waits past the debounce window, and asserts the input value is unchanged. `CI=true npx react-scripts test --watchAll=false` → all tests pass.
