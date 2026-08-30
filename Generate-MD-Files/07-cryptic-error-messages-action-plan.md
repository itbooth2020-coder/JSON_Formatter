# Issue 7: Error messages are parser jargon, not plain English — Action Plan

**Severity:** High (core-feature UX — this app's entire value proposition is helping users fix broken JSON)
**Status:** Fixed
**Files:** [src/utils/jsonUtils.js](../src/utils/jsonUtils.js), [src/utils/jsonUtils.test.js](../src/utils/jsonUtils.test.js)

## Symptom

For invalid JSON, the app currently shows `jsonlint-mod`'s raw parser error verbatim, e.g.:

```
❌ Error: Parse error on line 2:
...  "name": "John"  "age": 30}
---------------------^
Expecting 'EOF', '}', ':', ',', ']', got 'STRING'
📍 Line: 2
💡 Fix: Check JSON syntax near the reported location.
```

This is compiler/parser output, not something a non-technical user can act on. The 💡 Fix suggestion is meant to help, but as shown below, it never actually gives a specific answer.

## Root Cause Analysis

Two separate problems compound each other:

**1. `getSuggestion()` is dead code in practice.** In `src/utils/jsonUtils.js`:

```js
const getSuggestion = (msg) => {
  if (msg.includes("Unexpected token")) { ... }
  if (msg.includes("Unexpected string")) { ... }
  if (msg.includes("Unexpected number")) { ... }
  if (msg.includes("Unexpected end")) { ... }
  return "Check JSON syntax near the reported location.";
};
```

These `msg.includes(...)` checks match the error text format of the **native `JSON.parse()`** (e.g. `"Unexpected token } in JSON at position 12"`). But this file parses with **`jsonlint-mod`**, whose error messages look completely different — always `"Parse error on line N: ... Expecting 'X', got 'Y'"`. None of the four `includes()` checks can ever match a real `jsonlint-mod` message, so `getSuggestion()` **always** falls through to the generic `"Check JSON syntax near the reported location."` — regardless of what's actually wrong. This was confirmed by probing `jsonlint-mod` directly with 20 broken-JSON samples (see table below): 0 of 20 hit anything but the generic fallback.

**2. Even fixed, message-text matching alone can't distinguish most real-world mistakes.** `jsonlint-mod`'s messages describe *grammar* state (which token was expected vs. found), not *intent*. Many distinct user mistakes produce the **identical** message:

| User's actual mistake | jsonlint-mod message |
|---|---|
| Used single quotes: `'name'` | `Expecting 'STRING', '}', got 'undefined'` |
| Forgot quotes on a key: `name:` | `Expecting 'STRING', '}', got 'undefined'` |
| Wrote `True`/`NULL` instead of `true`/`null` | `Expecting 'STRING', 'NUMBER', ..., got 'undefined'` |
| Value is a bare word: `John` instead of `"John"` | `Expecting 'STRING', '}', got 'undefined'` |

A message-only mapping (`if msg.includes(...)`) structurally cannot tell these apart — they're the same message. Any real fix needs to also look at **the actual characters near the reported line/column**, not just the parser's abstract token names.

## Evidence: what today's messages look like for each requested sample

Probed all 20 titles directly against this project's `jsonlint-mod` dependency. Raw parser output — cryptic — for every one:

| # | Title | Sample | Raw parser message (what the user sees today) |
|---|-------|--------|------------------------------------------------|
| 1 | Missing Comma JSON | `{"name":"John" "age":30}` | `Expecting 'EOF', '}', ':', ',', ']', got 'STRING'` |
| 2 | Missing Closing Bracket JSON | `{"items":["a","b","c"}` | `Expecting ',', ']', got '}'` |
| 3 | Single Quotes JSON | `{'name':'John','age':30}` | `Expecting 'STRING', '}', got 'undefined'` |
| 4 | Trailing Commas JSON | `{"name":"John","age":30,}` | `Expecting 'STRING', got '}'` |
| 5 | Unclosed String JSON | `{"name":"John,"age":30}` | `Expecting 'STRING','NUMBER',...,got 'undefined'` |
| 6 | Invalid Boolean & Null JSON | `{"active":True,"deleted":NULL}` | `Expecting 'STRING','NUMBER',...,got 'undefined'` |
| 7 | Missing Property Value JSON | `{"name":,"age":30}` | `Expecting 'STRING','NUMBER',...,got ','` |
| 8 | Malformed Object Structure JSON | `{"name":"John","age":30,,}` | `Expecting 'STRING', got ','` |
| 9 | Broken Nested JSON | unclosed outer `{` around a nested object | `Expecting '}', ',', got 'EOF'` |
| 10 | Multiple Syntax Errors JSON | `{'name':John,age:30,,}` | `Expecting 'STRING', '}', got 'undefined'` |
| 11 | Severely Broken JSON | `{name: John, age: 30, active: tru }}` | `Expecting 'STRING', '}', got 'undefined'` |
| 12 | Missing Closing Brace JSON | `{"name":"John","age":30` (no `}`) | `Expecting '}', ',', got 'EOF'` |
| 13 | Invalid Array Structure JSON | `{"items":[1,2,,4]}` | `Expecting 'STRING','NUMBER',...,got ','` |
| 14 | Unexpected Character JSON | `{"name":"John" #}` | `Expecting 'EOF', '}', ':', ',', ']', got 'undefined'` |
| 15 | Unquoted Property JSON | `{name:"John",age:30}` | `Expecting 'STRING', '}', got 'undefined'` |
| 16 | Invalid Number Format JSON | `{"price":01.5,"qty":5.}` | `Expecting 'STRING','NUMBER',...,got 'undefined'` |
| 17 | Extra Comma JSON | `{"name":"John",,"age":30}` | `Expecting 'STRING', got ','` |
| 18 | Incomplete JSON Object | `{"name":"John","age":` (cut off) | `Expecting 'STRING','NUMBER',...,got 'EOF'` |
| 19 | Incomplete JSON Array | `{"items":[1,2,3,` (cut off) | `Expecting 'STRING','NUMBER',...,got 'EOF'` |
| 20 | Mixed Syntax Errors JSON | `{'name':John age:30,}` | `Expecting 'STRING', '}', got 'undefined'` |

Under the *current* code, every single one of these gets the same 💡 Fix text: `"Check JSON syntax near the reported location."` — the table above is what `jsonlint-mod` actually says; the app currently discards all of that nuance anyway.

## Solution: proposed plain-English messages

Below is the proposed friendly message for each title — this is the target copy `getSuggestion()`/a new detector should produce. Written at a "explain it to someone who's never heard of JSON" reading level: name the problem, point at the symbol, say the fix.

| # | Title | Proposed friendly message |
|---|-------|---------------------------|
| 1 | Missing Comma JSON | "You're missing a comma between two items. Add a `,` right after the value on line {line}." |
| 2 | Missing Closing Bracket JSON | "A list (`[`) was never closed. Add a `]` where the list should end." |
| 3 | Single Quotes JSON | "JSON only allows double quotes, not single quotes. Change every `'` to `\"`." |
| 4 | Trailing Commas JSON | "There's an extra comma right before a closing `}` or `]`. Remove that last comma." |
| 5 | Unclosed String JSON | "A piece of text is missing its closing quote. Make sure every value starts and ends with `\"`." |
| 6 | Invalid Boolean & Null JSON | "`true`, `false`, and `null` must be lowercase in JSON. Change `True`/`NULL`/`FALSE` to `true`/`null`/`false`." |
| 7 | Missing Property Value JSON | "A field has no value after its colon. Every `\"key\":` needs something after it — text, a number, `true`/`false`, or `null`." |
| 8 | Malformed Object Structure JSON | "There are two commas in a row with nothing between them. Remove the extra comma." |
| 9 | Broken Nested JSON | "One of your `{` or `[` blocks was never closed. Check that every `{` has a matching `}`, and every `[` has a matching `]`." |
| 10 | Multiple Syntax Errors JSON | "This JSON has more than one problem. Fix the first one listed, then re-check — later errors often disappear once the first is fixed." |
| 11 | Severely Broken JSON | "This text doesn't follow JSON's rules in several places. It may be easiest to rebuild it from scratch using the format `{\"key\": \"value\"}`." |
| 12 | Missing Closing Brace JSON | "An object (`{`) was never closed. Add a `}` where the object should end." |
| 13 | Invalid Array Structure JSON | "There's a gap in your list — two commas in a row, or a comma with nothing after it. Remove the extra comma or fill in the missing value." |
| 14 | Unexpected Character JSON | "There's a character here JSON doesn't recognize. Remove or replace it." |
| 15 | Unquoted Property JSON | "Field names must be wrapped in double quotes. Change `name:` to `\"name\":`." |
| 16 | Invalid Number Format JSON | "This number isn't written the way JSON expects (no leading zero like `01`, no trailing dot like `5.`). Try `1.5` or `5.0` instead." |
| 17 | Extra Comma JSON | "There are two commas next to each other. Remove the extra one." |
| 18 | Incomplete JSON Object | "This object is cut off before it's finished. Make sure every field has a value and the object ends with `}`." |
| 19 | Incomplete JSON Array | "This list is cut off before it's finished. Make sure every item has a value and the list ends with `]`." |
| 20 | Mixed Syntax Errors JSON | "This JSON mixes several kinds of mistakes (quotes, commas, structure). Fix the first error shown and re-check the rest." |

## Implementation plan

**Step 1 — Add a text-based detector, not just a message-based one.**
In `src/utils/jsonUtils.js`, replace `getSuggestion(msg)` with a function that takes `(rawInput, error)` (the original text plus jsonlint's `line`/`column`/`message`) and runs a small ordered list of regex checks against the input **near the reported position** (e.g. the reported line, plus a few characters around the column). Check in this order (first match wins, most specific/highest-confidence first):

1. Single quote used as a string delimiter (`'...'` where a string is expected) → *Single Quotes*
2. Bareword `True`/`FALSE`/`NULL` (wrong case) → *Invalid Boolean & Null*
3. Unquoted key: an identifier immediately followed by `:` with no surrounding quotes → *Unquoted Property*
4. Comma immediately followed by `}` or `]` (optionally with whitespace) → *Trailing Comma*
5. Two commas in a row (`,,`) → *Extra Comma* / *Malformed Object Structure*
6. Colon immediately followed by `,`/`}`/`]` → *Missing Property Value*
7. Number with a leading zero (`0\d`) or trailing dot (`\d+\.(?!\d)`) → *Invalid Number Format*
8. Odd number of `"` on the reported line before end-of-input → *Unclosed String*
9. `got 'EOF'` and brace/bracket counts don't match → *Missing Closing Brace* / *Missing Closing Bracket* (whichever is unbalanced)
10. `got '}'`/`']'` right after `[`/`,` → *Invalid Array Structure*
11. If **more than one** of the above matched at different locations in the same document → prefix the message with the *Multiple/Mixed Syntax Errors* framing, then show the first one found.
12. Fallback (no pattern matched): translate jsonlint's token names into plain words (`'STRING'` → "text in quotes", `'NUMBER'` → "a number", `'EOF'` → "the end of the file") and build a sentence: *"Expected {expected, in plain English} but found {found, in plain English} on line {line}."* — still better than raw parser jargon even when no specific rule fires.

**Step 2 — Keep `line`/`column` from jsonlint-mod as-is.** Those are already accurate and useful; only the `suggestion` text needs replacing (per [Issue 5](05-error-diagnostics-not-wired.md), this is already wired into `OutputViewer`).

**Step 3 — Update `OutputViewer.jsx` copy.** Change the "💡 Fix:" label if needed once messages are more conversational (e.g. keep it, it still reads naturally: "💡 Fix: JSON only allows double quotes...").

**Step 4 — Test against all 20 samples.** Turn the 20 titles/inputs used for this analysis into a table-driven test (`jsonUtils.test.js`) asserting each produces its intended friendly message — this both locks in the mapping and prevents silent regressions like the current dead `getSuggestion()` bug.

**Step 5 — Re-verify `CI=true npm run build` and `CI=true npm test`** after implementation, consistent with every prior fix in this project.

## Recommendation

This is a meaningful chunk of new logic (12 ordered heuristics + a fallback translator + a 20-case test table) — recommend implementing it as its own follow-up task via the `react-developer` agent for the detector code and `react-testing` agent for the table-driven tests, rather than folding it into an unrelated change.

## Applied fix

Implemented in `src/utils/jsonUtils.js`. `getSuggestion(msg)` (the dead code described above) was replaced by `getFriendlySuggestion(input, message)`, which:

1. **Strips double-quoted strings** from the raw input to a short non-whitespace placeholder (`"s"`, not blank spaces — an earlier version blanked to spaces and produced false positives, e.g. reading a stripped string as "nothing" and wrongly flagging a trailing comma). Also flags an unterminated string when a `"` never finds its closing quote before a newline or end-of-input.
2. **Runs ordered pattern checks** against the stripped text: single quotes → wrong-case `True`/`FALSE`/`NULL` → unquoted keys → bareword values → double-comma (with bracket-depth lookup to tell an array gap from an object gap) → trailing comma → missing value after `:` → invalid number format (leading zero / trailing dot) → unclosed string → innermost unclosed bracket (via a bracket stack, so `{"items":[1,2,3,` correctly blames the array, not the object) → stray/unrecognized character.
3. **Combines multiple hits**: if more than one pattern matches, the first (most specific) message is shown with an added note that there's more than one problem.
4. **Falls back** to a plain-English translation of jsonlint's own grammar tokens (`STRING` → "text in quotes", `EOF` → "the end of the file", etc.) only when no specific pattern matches.

**Verification:** added `src/utils/jsonUtils.test.js` — a table-driven test with all 20 samples from this doc, each asserting a specific, non-generic suggestion (plus a regression guard that the old dead-code fallback string never reappears). `CI=true npx react-scripts test --watchAll=false` → **26/26 tests pass** (21 in `jsonUtils.test.js`, 5 in `App.test.js`). `CI=true npm run build` still compiles cleanly.
