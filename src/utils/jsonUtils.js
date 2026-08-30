import jsonlint from "jsonlint-mod";

export const validateAndFormatJSON = (input) => {
  try {
    const parsed = jsonlint.parse(input);

    return {
      valid: true,
      formatted: JSON.stringify(parsed, null, 2),
      error: null,
    };
  } catch (err) {
    const message = err.message;

    const lineMatch = message.match(/line (\d+)/i);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : null;

    return {
      valid: false,
      formatted: null,
      error: {
        message,
        line,
        column: null,
        suggestion: getFriendlySuggestion(input, message),
      },
    };
  }
};

// ---------------------------------------------------------------------
// Friendly error detection
//
// jsonlint-mod's raw messages only describe parser grammar state
// ("Expecting 'STRING', got 'undefined'") and can't by themselves tell
// apart most real mistakes -- single quotes, unquoted keys, and a
// bareword value all produce the exact same message. So detection works
// by scanning the *raw input text* for known mistake patterns (most
// specific first) and only falls back to a plain-English translation of
// jsonlint's own tokens when nothing matches.
// ---------------------------------------------------------------------

const KEYWORDS = /^(true|false|null)$/i;

// Replaces every properly double-quoted string with a short, non-whitespace
// placeholder ("s") so structural checks below (which look for "nothing
// but whitespace" between punctuation, e.g. a trailing comma) aren't
// confused by punctuation *inside* string values, and don't mistake a
// collapsed string for empty space. Also reports whether a string was
// left open (hit a newline or end-of-input before its closing quote).
const stripDoubleQuotedStrings = (text) => {
  let code = "";
  let i = 0;
  let hadUnterminatedString = false;

  while (i < text.length) {
    const ch = text[i];

    if (ch === '"') {
      let j = i + 1;
      let closed = false;
      while (j < text.length) {
        if (text[j] === "\\") {
          j += 2;
          continue;
        }
        if (text[j] === "\n") break;
        if (text[j] === '"') {
          closed = true;
          break;
        }
        j++;
      }

      if (!closed) hadUnterminatedString = true;
      // Closed strings become "s" so other rules can treat them as a
      // normal, complete value. An unterminated string becomes "u"
      // instead -- deliberately a different token, so it's never
      // mistaken for a valid, complete value by e.g. the missing-comma
      // check (the real problem here is the open quote, not a comma).
      code += closed ? '"s"' : '"u"';
      i = closed ? j + 1 : j;
      continue;
    }

    code += ch;
    i++;
  }

  return { code, hadUnterminatedString };
};

const nearestEnclosingBracket = (code, index) => {
  let depth = 0;
  for (let i = index; i >= 0; i--) {
    const ch = code[i];
    if (ch === "}" || ch === "]") {
      depth++;
    } else if (ch === "{" || ch === "[") {
      if (depth === 0) return ch;
      depth--;
    }
  }
  return null;
};

// Returns the still-open bracket characters, in the order they were
// opened (so the last entry is the innermost one still unclosed).
const findUnclosedBrackets = (code) => {
  const stack = [];
  for (const ch of code) {
    if (ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (ch === "}") {
      if (stack[stack.length - 1] === "{") stack.pop();
    } else if (ch === "]") {
      if (stack[stack.length - 1] === "[") stack.pop();
    }
  }
  return stack;
};

const TOKEN_WORDS = {
  STRING: "text in quotes",
  NUMBER: "a number",
  NULL: "null",
  TRUE: "true",
  FALSE: "false",
  EOF: "the end of the file",
  "'{'": "an opening {",
  "'}'": "a closing }",
  "'['": "an opening [",
  "']'": "a closing ]",
  "':'": "a colon (:)",
  "','": "a comma (,)",
  undefined: "something unexpected (maybe a stray character or unquoted text)",
};

const plainWord = (token) => {
  const bare = token.replace(/'/g, "");
  return TOKEN_WORDS[bare] || TOKEN_WORDS[token] || `\`${token}\``;
};

const fallbackFromMessage = (message) => {
  const match = message.match(/Expecting ([^,]+(?:,\s*[^,]+)*), got '([^']*)'/);
  if (!match) {
    return "Check the JSON syntax near the reported line — a comma, quote, or bracket is likely misplaced.";
  }

  const gotToken = match[2] || "undefined";
  return `JSON expected something else here but found ${plainWord(
    gotToken === "" ? "undefined" : gotToken
  )}. Check for a missing comma, quote, or bracket near this spot.`;
};

const detectIssues = (input) => {
  // Monaco (and Windows clipboard paste in general) commonly produces
  // \r\n line endings; every regex below assumes a bare \n, so without
  // this the \r silently blocks matches that span a line break.
  const normalizedInput = input.replace(/\r\n?/g, "\n");
  const { code, hadUnterminatedString } = stripDoubleQuotedStrings(normalizedInput);
  const issues = [];

  if (/(^|[:,[{]\s*)'(?:[^'\\]|\\.)*'/.test(code)) {
    issues.push({
      name: "single-quotes",
      message:
        "JSON only allows double quotes, not single quotes. Change every ' to \".",
    });
  }

  if (/:\s*(True|False|TRUE|FALSE|Null|NULL)\b/.test(code)) {
    issues.push({
      name: "invalid-boolean-null",
      message:
        "true, false, and null must be lowercase in JSON. Change True/FALSE/NULL to true/false/null.",
    });
  }

  if (/[{,]\s*[A-Za-z_$][A-Za-z0-9_$]*\s*:/.test(code)) {
    issues.push({
      name: "unquoted-property",
      message:
        'Field names must be wrapped in double quotes. Change name: to "name":.',
    });
  }

  const barewordMatch = code.match(/[:,[]\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*(?=[,}\]])/);
  if (barewordMatch && !KEYWORDS.test(barewordMatch[1])) {
    issues.push({
      name: "bareword-value",
      message: `A text value isn't wrapped in double quotes. Change ${barewordMatch[1]} to "${barewordMatch[1]}".`,
    });
  }

  // Two adjacent values with a line break but no comma between them --
  // the single most common JSON mistake (e.g. two object properties on
  // consecutive lines with nothing separating them).
  const missingCommaMatch = code.match(
    /(?:"s"|true|false|null|-?\d+(?:\.\d+)?|\}|\])[ \t]*\n[ \t]*(?="s"|[{[]|-?\d|true\b|false\b|null\b|[A-Za-z_$])/
  );
  if (missingCommaMatch) {
    const newlineOffset = missingCommaMatch[0].indexOf("\n");
    const upToNewline = code.slice(0, missingCommaMatch.index + newlineOffset);
    const lineNum = (upToNewline.match(/\n/g) || []).length + 1;
    issues.push({
      name: "missing-comma",
      message: `You're missing a comma between two items. Add a , right after the value on line ${lineNum}.`,
    });
  }

  const doubleCommaMatch = code.match(/,\s*,/);
  if (doubleCommaMatch) {
    const enclosing = nearestEnclosingBracket(code, doubleCommaMatch.index);
    if (enclosing === "[") {
      issues.push({
        name: "double-comma-array",
        message:
          "There's a gap in your list — two commas in a row, or a comma with nothing after it. Remove the extra comma or fill in the missing value.",
      });
    } else if (enclosing === "{") {
      issues.push({
        name: "double-comma-object",
        message:
          "There are two commas in a row with nothing between them. Remove the extra comma.",
      });
    } else {
      issues.push({
        name: "double-comma-generic",
        message: "There are two commas next to each other. Remove the extra one.",
      });
    }
  } else if (/,\s*[}\]]/.test(code)) {
    issues.push({
      name: "trailing-comma",
      message:
        "There's an extra comma right before a closing } or ]. Remove that last comma.",
    });
  }

  if (/:\s*[,}\]]/.test(code)) {
    issues.push({
      name: "missing-value",
      message:
        'A field has no value after its colon. Every "key": needs something after it — text, a number, true/false, or null.',
    });
  }

  if (/:\s*0\d/.test(code) || /:\s*\d+\.(?=[,}\]\s]|$)/.test(code)) {
    issues.push({
      name: "invalid-number",
      message:
        "This number isn't written the way JSON expects (no leading zero like 01, no trailing dot like 5.). Try 1.5 or 5.0 instead.",
    });
  }

  if (hadUnterminatedString) {
    issues.push({
      name: "unclosed-string",
      message:
        'A piece of text is missing its closing quote. Make sure every value starts and ends with ".',
    });
  }

  const unclosed = findUnclosedBrackets(code);
  if (unclosed.length > 0) {
    const innermost = unclosed[unclosed.length - 1];
    issues.push(
      innermost === "["
        ? {
            name: "missing-closing-bracket",
            message: "A list ([) was never closed. Add a ] where the list should end.",
          }
        : {
            name: "missing-closing-brace",
            message:
              "An object ({) was never closed. Add a } where the object should end.",
          }
    );
  }

  if (/[^\sA-Za-z0-9{}[\]:,"'.\-+_$]/.test(code)) {
    issues.push({
      name: "unexpected-character",
      message: "There's a character here JSON doesn't recognize. Remove or replace it.",
    });
  }

  return issues;
};

const getFriendlySuggestion = (input, message) => {
  const issues = detectIssues(input);

  if (issues.length === 0) {
    return fallbackFromMessage(message);
  }

  if (issues.length === 1) {
    return issues[0].message;
  }

  return `${issues[0].message} This JSON has more than one problem — fix this one first, then re-check for more.`;
};
