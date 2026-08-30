import { validateAndFormatJSON } from "./jsonUtils";

// Table-driven regression test for Issue 7 (Generate-MD-Files/07-...): each
// of the 20 requested broken-JSON samples must produce a specific,
// plain-English suggestion, not the old generic
// "Check JSON syntax near the reported location." fallback.
const cases = [
  {
    title: "Missing Comma JSON",
    input: '{\n  "name": "John"\n  "age": 30\n}',
    expect: /you're missing a comma/i,
  },
  {
    title: "Missing Closing Bracket JSON",
    input: '{\n  "items": ["a", "b", "c"\n}',
    expect: /list \(\[\) was never closed/i,
  },
  {
    title: "Single Quotes JSON",
    input: "{\n  'name': 'John',\n  'age': 30\n}",
    expect: /single quotes/i,
  },
  {
    title: "Trailing Commas JSON",
    input: '{\n  "name": "John",\n  "age": 30,\n}',
    expect: /extra comma right before/i,
  },
  {
    title: "Unclosed String JSON",
    input: '{\n  "name": "John,\n  "age": 30\n}',
    expect: /missing its closing quote/i,
  },
  {
    title: "Invalid Boolean & Null JSON",
    input: '{\n  "active": True,\n  "deleted": NULL\n}',
    expect: /lowercase/i,
  },
  {
    title: "Missing Property Value JSON",
    input: '{\n  "name": ,\n  "age": 30\n}',
    expect: /no value after its colon/i,
  },
  {
    title: "Malformed Object Structure JSON",
    input: '{\n  "name": "John",\n  "age": 30,,\n}',
    expect: /two commas/i,
  },
  {
    title: "Broken Nested JSON",
    input: '{\n  "user": {\n    "name": "John",\n    "address": {\n      "city": "NYC"\n    \n  }\n}',
    expect: /never closed/i,
  },
  {
    title: "Multiple Syntax Errors JSON",
    input: "{\n  'name': John,\n  age: 30,,\n}",
    expect: /more than one problem/i,
  },
  {
    title: "Severely Broken JSON",
    input: "{name: John, age: 30, active: tru }}",
    expect: /more than one problem|double quotes/i,
  },
  {
    title: "Missing Closing Brace JSON",
    input: '{\n  "name": "John",\n  "age": 30\n',
    expect: /object \({\) was never closed/i,
  },
  {
    title: "Invalid Array Structure JSON",
    input: '{\n  "items": [1, 2, , 4]\n}',
    expect: /gap in your list/i,
  },
  {
    title: "Unexpected Character JSON",
    input: '{\n  "name": "John" #\n}',
    expect: /character here JSON doesn't recognize/i,
  },
  {
    title: "Unquoted Property JSON",
    input: '{\n  name: "John",\n  age: 30\n}',
    expect: /field names must be wrapped/i,
  },
  {
    title: "Invalid Number Format JSON",
    input: '{\n  "price": 01.5,\n  "qty": 5.\n}',
    expect: /leading zero|trailing dot/i,
  },
  {
    title: "Extra Comma JSON",
    input: '{\n  "name": "John",,\n  "age": 30\n}',
    expect: /two commas/i,
  },
  {
    title: "Incomplete JSON Object",
    input: '{\n  "name": "John",\n  "age":',
    expect: /never closed|cut off|no value after its colon/i,
  },
  {
    title: "Incomplete JSON Array",
    input: '{\n  "items": [1, 2, 3,',
    expect: /list \(\[\) was never closed|cut off/i,
  },
  {
    title: "Mixed Syntax Errors JSON",
    input: "{\n  'name': John\n  age: 30,\n}",
    expect: /more than one problem/i,
  },
];

describe("validateAndFormatJSON friendly suggestions", () => {
  test.each(cases)("$title", ({ input, expect: expected }) => {
    const result = validateAndFormatJSON(input);

    expect(result.valid).toBe(false);
    expect(result.error.suggestion).toMatch(expected);
    // Regression guard: never fall back to the old generic message.
    expect(result.error.suggestion).not.toBe(
      "Check JSON syntax near the reported location."
    );
  });
});

test("valid JSON still formats correctly", () => {
  const result = validateAndFormatJSON('{"a":1,"b":[1,2,3]}');
  expect(result.valid).toBe(true);
  expect(result.formatted).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2,\n    3\n  ]\n}');
});

test("real-world sample: missing comma between email and role", () => {
  const input = `{
  "user": {
    "id": 1001,
    "name": "Rahul Sharma",
    "email": "rahul@example.com"
    "role": "admin",
    "active": true
  },
  "permissions": [
    "read",
    "write",
    "delete"
  ]
}`;
  const result = validateAndFormatJSON(input);

  expect(result.valid).toBe(false);
  expect(result.error.line).toBe(5);
  expect(result.error.suggestion).toMatch(/you're missing a comma/i);

  const fixed = input.replace(
    '"email": "rahul@example.com"',
    '"email": "rahul@example.com",'
  );
  const fixedResult = validateAndFormatJSON(fixed);
  expect(fixedResult.valid).toBe(true);
});

test("real-world sample with Windows CRLF line endings still gets the specific message", () => {
  // Monaco (and Windows clipboard paste) commonly produces \r\n; the
  // detector must not silently fall back to the generic message here.
  const crlfInput = `{
  "user": {
    "id": 1001,
    "name": "Rahul Sharma",
    "email": "rahul@example.com"
    "role": "admin",
    "active": true
  },
  "permissions": [
    "read",
    "write",
    "delete"
  ]
}`.replace(/\n/g, "\r\n");

  const result = validateAndFormatJSON(crlfInput);

  expect(result.valid).toBe(false);
  expect(result.error.suggestion).toMatch(/you're missing a comma/i);
  expect(result.error.suggestion).not.toMatch(/JSON expected something else here/i);
});
