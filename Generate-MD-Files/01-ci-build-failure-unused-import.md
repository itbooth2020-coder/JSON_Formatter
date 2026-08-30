# Issue 1: CI build fails — unused `TextField` import

**Severity:** High (build-breaking in CI)
**Status:** Fixed
**File:** [src/components/JsonEditor.jsx](../src/components/JsonEditor.jsx)

## Symptom

`npm run build` succeeds locally with a warning, but the same build fails on any CI/deploy pipeline that sets `CI=true` (Netlify, Vercel, GitHub Actions, etc. all do this by default):

```
Treating warnings as errors because process.env.CI = true.

Failed to compile.

[eslint]
src\components\JsonEditor.jsx
  Line 2:29:  'TextField' is defined but never used  no-unused-vars
```

## Root Cause Analysis

`JsonEditor.jsx` imports `TextField` from `@mui/material`:

```js
import { Paper, Typography, TextField } from "@mui/material";
```

The only place `TextField` was used is a block of JSX that has since been commented out (an earlier plain-`<textarea>`-style input, superseded by the Monaco `<Editor>`). The import was never cleaned up after that block was disabled, leaving an `no-unused-vars` ESLint violation.

Create React App's build script (`react-scripts build`) treats all ESLint warnings as hard errors whenever `process.env.CI` is truthy (CRA's own behavior, not a custom config in this repo). Locally, `CI` is typically unset, so the same warning only prints — it doesn't fail the build — which is why this went unnoticed in local dev/build but breaks in CI.

## Solution

Remove the unused import:

```diff
- import { Paper, Typography, TextField } from "@mui/material";
+ import { Paper, Typography } from "@mui/material";
```

**Verification:** `CI=true npx react-scripts build` now reports `Compiled successfully.` with zero warnings.

## Prevention

- Run `CI=true npm run build` locally (or as a pre-push check) before pushing, so CI-mode failures surface before they reach the pipeline.
- When commenting out JSX during experimentation, also comment out or remove the now-unused imports it relied on, or delete the dead block outright once the replacement (Monaco `Editor`) is confirmed working.
