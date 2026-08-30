# Issue 6: Copy button shows false "Copied" success on failure

**Severity:** Low (UX edge case)
**Status:** Fixed
**File:** [src/components/OutputViewer.jsx](../src/components/OutputViewer.jsx)

## Symptom

Clicking the copy-to-clipboard icon always shows the success checkmark and the "✅ Copied to clipboard" snackbar, even in situations where the copy silently failed (e.g. clipboard permission denied by the browser, or the page running in a non-secure/non-HTTPS context where the Clipboard API is unavailable).

## Root Cause Analysis

```js
const copyToClipboard = () => {
  if (output) {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
};
```

`navigator.clipboard.writeText()` returns a `Promise` that can reject (permission denied, focus lost, insecure context, etc.). The code neither `await`s nor attaches a `.catch()` to it — it fires the call and immediately, unconditionally sets `copied` to `true`. The UI has no way to distinguish "copy succeeded" from "copy was rejected," so users get positive feedback regardless of outcome.

Separately, on a page served over plain HTTP (or `file://`), `navigator.clipboard` itself can be `undefined`, in which case `navigator.clipboard.writeText` throws synchronously — an uncaught exception inside the click handler.

## Solution

Await the promise and branch on success/failure:

```js
const copyToClipboard = async () => {
  if (!output) return;

  try {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch {
    setCopyFailed(true);
    setTimeout(() => setCopyFailed(false), 2000);
  }
};
```

Add a parallel `copyFailed` state and a corresponding Snackbar/icon (e.g. an error-colored icon or "Copy failed — clipboard unavailable" message) so failure is visibly distinct from success, instead of just leaving the button in its default state.

## Priority note

This is a low-frequency edge case (most deployments will be HTTPS with a normal permission grant), so it's reasonable to batch this fix in alongside other `OutputViewer` changes (e.g. when addressing [Issue 5](05-error-diagnostics-not-wired.md)) rather than treating it as urgent on its own.

## Applied fix

`copyToClipboard` is now `async` and `await`s `navigator.clipboard.writeText(output)` inside a `try`/`catch`. Success still shows the green checkmark icon and "Copied to clipboard" snackbar; failure now sets a separate `copyFailed` state that shows a red error icon and a "Copy failed — clipboard unavailable" snackbar instead of falsely reporting success.
