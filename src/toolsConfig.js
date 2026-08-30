// Single source of truth for every tool page: its route, its short in-page
// subtitle (tagline), and the question/answer copy shown on the home page.
export const TOOLS = [
  {
    path: "/json-formatter",
    name: "JSON Formatter",
    tagline: "Format and validate JSON with instant, plain-English error messages.",
    question: "What does a JSON formatter do?",
    answer:
      "It takes raw or minified JSON and reformats it with consistent indentation and line breaks. This makes deeply nested structures easy to read and spot mistakes in. Everything runs locally in your browser — your data is never uploaded.",
  },
  {
    path: "/json-validator",
    name: "JSON Validator",
    tagline: "Check whether your JSON is valid and see exactly what's wrong if it isn't.",
    question: "How do I check if my JSON is valid?",
    answer:
      "Paste your JSON and it's parsed instantly, flagging the exact line where anything is wrong. Instead of cryptic parser errors, you get a plain-English explanation of the mistake. No installs or servers required.",
  },
  {
    path: "/json-beautifier",
    name: "JSON Beautifier",
    tagline: "Turn compact or minified JSON into readable, properly indented JSON.",
    question: "What's the difference between beautify and format?",
    answer:
      "Beautifying adds indentation, line breaks, and spacing to compact JSON so it's readable at a glance. It's the same engine as the formatter, tuned for turning minified payloads into something reviewable. One click restores full readability.",
  },
  {
    path: "/json-viewer",
    name: "JSON Viewer",
    tagline: "Browse and inspect JSON in a syntax-highlighted, line-numbered editor.",
    question: "How can I browse a large JSON file?",
    answer:
      "Paste or upload your JSON and view it in a line-numbered, syntax-highlighted editor built on the same engine as VS Code. Collapse and expand nested objects and arrays to navigate large structures. Nothing is sent anywhere — it's read entirely client-side.",
  },
  {
    path: "/json-minifier",
    name: "JSON Minifier",
    tagline: "Strip whitespace from JSON to shrink it for transport or storage.",
    question: "Why would I minify JSON?",
    answer:
      "Minifying strips all unnecessary whitespace, shrinking payload size for APIs, configs, or storage. It keeps the JSON fully valid, just without the formatting meant for humans. Useful right before shipping data over the wire.",
  },
  {
    path: "/json-diff",
    name: "JSON Diff",
    tagline: "Compare two JSON documents and see every difference between them.",
    question: "How do I compare two JSON documents?",
    answer:
      "Paste two JSON documents side by side and see every key, value, and structural difference between them highlighted. It's ideal for comparing API responses, config versions, or test fixtures. All comparison happens locally.",
  },
  {
    path: "/json-compare",
    name: "JSON Compare",
    tagline: "Compare two JSON documents and see every difference between them.",
    question: "What's the difference between diff and compare?",
    answer:
      "They're the same tool under different names — both show you exactly what changed between two JSON documents. Added, removed, and changed values are each called out clearly. Use whichever name you think of first.",
  },
  {
    path: "/jsonpath-tester",
    name: "JSONPath Tester",
    tagline: "Run a JSONPath expression against your JSON and see the matched results.",
    question: "How do I test a JSONPath expression?",
    answer:
      "Paste your JSON, write a JSONPath query like $.store.book[0].title, and see the matched results instantly. It's useful for debugging API filters, extraction logic, or documenting a data shape. Powered by the standard JSONPath-Plus engine.",
  },
  {
    path: "/json-schema-generator",
    name: "JSON Schema Generator",
    tagline: "Generate a Draft-07 JSON Schema describing the structure of your sample JSON.",
    question: "How do I generate a JSON Schema from sample data?",
    answer:
      "Paste an example JSON document and get a Draft-07 JSON Schema describing its structure and types. It's a fast starting point for API contracts or validation rules. Review and refine the generated schema before relying on it.",
  },
  {
    path: "/json-to-xml",
    name: "JSON to XML",
    tagline: "Convert JSON into well-formed XML.",
    question: "How do I convert JSON to XML?",
    answer:
      "Paste your JSON and get well-formed XML with elements generated from your keys and values. Arrays become repeated sibling elements automatically. Useful when integrating with older systems that expect XML.",
  },
  {
    path: "/json-to-csv",
    name: "JSON to CSV",
    tagline: "Convert an array of JSON objects into CSV rows, flattening nested fields.",
    question: "How do I convert JSON to CSV?",
    answer:
      "Paste an array of JSON objects and get a CSV file with one row per object and one column per field. Nested objects are flattened using dot notation so nothing is lost. Great for opening API data straight in a spreadsheet.",
  },
  {
    path: "/json-to-yaml",
    name: "JSON to YAML",
    tagline: "Convert JSON into equivalent YAML.",
    question: "How do I convert JSON to YAML?",
    answer:
      "Paste your JSON and get equivalent YAML — the same data, in YAML's cleaner, indentation-based syntax. Handy for Kubernetes manifests, CI configs, and other YAML-first tooling. Conversion is exact; no data is lost.",
  },
  {
    path: "/json-to-typescript",
    name: "JSON to TypeScript",
    tagline: "Generate a TypeScript interface from a sample JSON object.",
    question: "How do I generate a TypeScript interface from JSON?",
    answer:
      "Paste a sample JSON object and get a matching TypeScript interface with inferred field types. Nested objects and arrays produce their own named sub-interfaces. Saves you from hand-writing types for API responses.",
  },
  {
    path: "/json-to-java",
    name: "JSON to Java",
    tagline: "Generate a Java class from a sample JSON object.",
    question: "How do I generate a Java class from JSON?",
    answer:
      "Paste a sample JSON object and get a Java class with typed fields and getters/setters. Nested objects generate their own nested classes automatically. A quick starting point for consuming an API in Java.",
  },
  {
    path: "/json-to-csharp",
    name: "JSON to C#",
    tagline: "Generate a C# class from a sample JSON object.",
    question: "How do I generate a C# class from JSON?",
    answer:
      "Paste a sample JSON object and get a C# class with typed, auto-implemented properties. Nested objects generate their own classes, and arrays map to List<T>. A fast starting point for deserializing JSON in .NET.",
  },
];
