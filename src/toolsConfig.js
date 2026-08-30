// Single source of truth for every tool page: its route, its short in-page
// subtitle (tagline), the question/answer copy shown on the home page card,
// and the "know more" paragraph + FAQ shown in that page's footer.
export const TOOLS = [
  {
    path: "/json-formatter",
    name: "JSON Formatter",
    tagline: "Format and validate JSON with instant, plain-English error messages.",
    question: "What does a JSON formatter do?",
    answer:
      "It takes raw or minified JSON and reformats it with consistent indentation and line breaks. This makes deeply nested structures easy to read and spot mistakes in. Everything runs locally in your browser — your data is never uploaded.",
    about:
      "Whether you're debugging an API response or reviewing a config file, the JSON Formatter turns dense, single-line JSON into something you can actually read. Paste your data and it's reformatted instantly, with consistent 2-space indentation throughout.",
    faq: [
      {
        q: "Does formatting change my data?",
        a: "No — formatting only changes whitespace and indentation. The underlying values, keys, and structure stay exactly the same.",
      },
      {
        q: "Is there a size limit?",
        a: "There's no hard limit enforced by the tool, though very large documents (multiple megabytes) may format more slowly since everything runs in your browser rather than on a server.",
      },
    ],
  },
  {
    path: "/json-validator",
    name: "JSON Validator",
    tagline: "Check whether your JSON is valid and see exactly what's wrong if it isn't.",
    question: "How do I check if my JSON is valid?",
    answer:
      "Paste your JSON and it's parsed instantly, flagging the exact line where anything is wrong. Instead of cryptic parser errors, you get a plain-English explanation of the mistake. No installs or servers required.",
    about:
      "Invalid JSON often comes from a single misplaced comma or an unquoted key, but tracking down exactly where is tedious by hand. The JSON Validator parses your document the moment you paste it and points to the precise line the problem starts on.",
    faq: [
      {
        q: "What counts as 'valid' JSON?",
        a: "Valid JSON follows the official JSON specification: double-quoted keys and strings, no trailing commas, and only the types JSON supports (objects, arrays, strings, numbers, booleans, and null).",
      },
      {
        q: "Why does it show one error at a time?",
        a: "Parsers stop at the first problem they hit, since later content can't be reliably checked until earlier syntax is fixed. Fix the first error and re-check to reveal the next one, if any.",
      },
    ],
  },
  {
    path: "/json-beautifier",
    name: "JSON Beautifier",
    tagline: "Turn compact or minified JSON into readable, properly indented JSON.",
    question: "What's the difference between beautify and format?",
    answer:
      "Beautifying adds indentation, line breaks, and spacing to compact JSON so it's readable at a glance. It's the same engine as the formatter, tuned for turning minified payloads into something reviewable. One click restores full readability.",
    about:
      "Minified JSON from an API or a build tool is efficient for machines but painful to read. The JSON Beautifier expands it back out with proper indentation and line breaks so nested objects and arrays are easy to follow.",
    faq: [
      {
        q: "How is this different from the JSON Formatter?",
        a: "They use the same underlying engine — beautify is simply the one-click action for turning compact JSON into a readable layout.",
      },
      {
        q: "Can I beautify JSON with comments?",
        a: "No — the JSON specification doesn't support comments, so JSON containing // or /* */ comments (sometimes called JSONC) won't parse. Remove comments first.",
      },
    ],
  },
  {
    path: "/json-viewer",
    name: "JSON Viewer",
    tagline: "Browse and inspect JSON in a syntax-highlighted, line-numbered editor.",
    question: "How can I browse a large JSON file?",
    answer:
      "Paste or upload your JSON and view it in a line-numbered, syntax-highlighted editor built on the same engine as VS Code. Collapse and expand nested objects and arrays to navigate large structures. Nothing is sent anywhere — it's read entirely client-side.",
    about:
      "Large JSON documents are easier to explore than to read top to bottom. The JSON Viewer gives you a syntax-highlighted, collapsible editor so you can fold sections you don't need and focus on the part you're investigating.",
    faq: [
      {
        q: "Can I collapse nested objects and arrays?",
        a: "Yes — click the fold markers next to any { or [ to collapse that section, and again to expand it.",
      },
      {
        q: "Does it modify my JSON?",
        a: "No, viewing is read-only by default. Use the Beautify or Minify actions if you want to change formatting.",
      },
    ],
  },
  {
    path: "/json-minifier",
    name: "JSON Minifier",
    tagline: "Strip whitespace from JSON to shrink it for transport or storage.",
    question: "Why would I minify JSON?",
    answer:
      "Minifying strips all unnecessary whitespace, shrinking payload size for APIs, configs, or storage. It keeps the JSON fully valid, just without the formatting meant for humans. Useful right before shipping data over the wire.",
    about:
      "Every space and line break in formatted JSON adds bytes to a payload. The JSON Minifier strips that whitespace down to the smallest valid representation, which is what you'd want right before sending data over a network or storing it.",
    faq: [
      {
        q: "Does minifying lose any data?",
        a: "No — minifying only removes insignificant whitespace. All keys, values, and structure are fully preserved.",
      },
      {
        q: "Should I minify JSON in version control?",
        a: "Generally no — keep formatted JSON in source files for readability, and minify only at the point where size actually matters, like an API response or bundled asset.",
      },
    ],
  },
  {
    path: "/json-diff",
    name: "JSON Diff",
    tagline: "Compare two JSON documents and see every difference between them.",
    question: "How do I compare two JSON documents?",
    answer:
      "Paste two JSON documents side by side and see every key, value, and structural difference between them highlighted. It's ideal for comparing API responses, config versions, or test fixtures. All comparison happens locally.",
    about:
      "Comparing two versions of a JSON document by eye is error-prone once there's more than a handful of fields. JSON Diff walks both documents and reports every key that was added, removed, or changed, so you can see exactly what's different.",
    faq: [
      {
        q: "Does field order matter?",
        a: "No — the comparison is based on keys and values, not the order fields appear in, since JSON objects are inherently unordered.",
      },
      {
        q: "Can I compare arrays?",
        a: "Yes — arrays are compared element by element, and any items added or removed at the end are reported like any other difference.",
      },
    ],
  },
  {
    path: "/json-compare",
    name: "JSON Compare",
    tagline: "Compare two JSON documents and see every difference between them.",
    question: "What's the difference between diff and compare?",
    answer:
      "They're the same tool under different names — both show you exactly what changed between two JSON documents. Added, removed, and changed values are each called out clearly. Use whichever name you think of first.",
    about:
      "'JSON compare' and 'JSON diff' describe the same task — finding what's different between two documents — so this page uses the identical comparison engine. Paste your two JSON documents and every difference is listed clearly below.",
    faq: [
      {
        q: "Is this the same tool as JSON Diff?",
        a: "Yes, exactly the same tool under a different name — pages exist under both names since people search for this task both ways.",
      },
      {
        q: "What counts as a 'change'?",
        a: "A value is reported as changed when the same key exists in both documents but holds a different value or type.",
      },
    ],
  },
  {
    path: "/jsonpath-tester",
    name: "JSONPath Tester",
    tagline: "Run a JSONPath expression against your JSON and see the matched results.",
    question: "How do I test a JSONPath expression?",
    answer:
      "Paste your JSON, write a JSONPath query like $.store.book[0].title, and see the matched results instantly. It's useful for debugging API filters, extraction logic, or documenting a data shape. Powered by the standard JSONPath-Plus engine.",
    about:
      "JSONPath lets you query a JSON document the way XPath queries XML — pulling out specific values without writing custom code. This tester lets you try an expression against real JSON and see the matches immediately, which is much faster than testing inside application code.",
    faq: [
      {
        q: "What JSONPath syntax is supported?",
        a: "Standard JSONPath syntax is supported, including dot notation ($.a.b), array indexing ($.a[0]), and wildcards ($.a[*]), via the widely-used JSONPath-Plus library.",
      },
      {
        q: "What does an empty result mean?",
        a: "An empty array means the expression parsed successfully but didn't match anything in your JSON — double-check the path against your document's actual structure.",
      },
    ],
  },
  {
    path: "/json-schema-generator",
    name: "JSON Schema Generator",
    tagline: "Generate a Draft-07 JSON Schema describing the structure of your sample JSON.",
    question: "How do I generate a JSON Schema from sample data?",
    answer:
      "Paste an example JSON document and get a Draft-07 JSON Schema describing its structure and types. It's a fast starting point for API contracts or validation rules. Review and refine the generated schema before relying on it.",
    about:
      "Writing a JSON Schema by hand is tedious, especially for a document with many nested fields. This generator infers a Draft-07 schema directly from a real example, giving you a solid starting point to refine rather than a blank page.",
    faq: [
      {
        q: "Is the generated schema production-ready?",
        a: "Treat it as a starting point. It infers types and required fields from your one example, so review it — especially optional fields and value constraints — before using it to validate real data.",
      },
      {
        q: "What JSON Schema draft is used?",
        a: "Draft-07, a widely supported version compatible with most validation libraries and tools.",
      },
    ],
  },
  {
    path: "/json-to-xml",
    name: "JSON to XML",
    tagline: "Convert JSON into well-formed XML.",
    question: "How do I convert JSON to XML?",
    answer:
      "Paste your JSON and get well-formed XML with elements generated from your keys and values. Arrays become repeated sibling elements automatically. Useful when integrating with older systems that expect XML.",
    about:
      "Some systems, especially older enterprise APIs, still expect XML rather than JSON. This converter maps your JSON keys and values onto XML elements automatically, saving you from writing that translation by hand.",
    faq: [
      {
        q: "How are arrays represented in the XML?",
        a: 'Each array item becomes a repeated sibling element using the array\'s own key name, e.g. tags: ["a","b"] becomes <tags>a</tags><tags>b</tags>.',
      },
      {
        q: "Are XML attributes supported?",
        a: "No — every JSON key becomes a nested element rather than an attribute, which keeps the mapping simple and unambiguous in both directions.",
      },
    ],
  },
  {
    path: "/json-to-csv",
    name: "JSON to CSV",
    tagline: "Convert an array of JSON objects into CSV rows, flattening nested fields.",
    question: "How do I convert JSON to CSV?",
    answer:
      "Paste an array of JSON objects and get a CSV file with one row per object and one column per field. Nested objects are flattened using dot notation so nothing is lost. Great for opening API data straight in a spreadsheet.",
    about:
      "Spreadsheets don't understand nested JSON, but they're often the fastest way to review or share tabular data. This converter turns an array of JSON objects into CSV rows, flattening any nested fields so nothing gets left out.",
    faq: [
      {
        q: "What happens to nested objects?",
        a: "Nested fields are flattened into dot-notation columns — for example, address.city — so every value still ends up in its own column.",
      },
      {
        q: "What if my JSON isn't an array?",
        a: "A single JSON object is treated as one row. For a proper table, an array of similarly-shaped objects works best.",
      },
    ],
  },
  {
    path: "/json-to-yaml",
    name: "JSON to YAML",
    tagline: "Convert JSON into equivalent YAML.",
    question: "How do I convert JSON to YAML?",
    answer:
      "Paste your JSON and get equivalent YAML — the same data, in YAML's cleaner, indentation-based syntax. Handy for Kubernetes manifests, CI configs, and other YAML-first tooling. Conversion is exact; no data is lost.",
    about:
      "YAML is the format of choice for Kubernetes manifests, CI pipelines, and many config files, but hand-converting JSON to YAML's indentation-based syntax is fiddly. This converter produces exact, well-formed YAML from your JSON in one step.",
    faq: [
      {
        q: "Is any data lost in the conversion?",
        a: "No — the conversion is exact. Every key, value, and structure in your JSON is represented equivalently in the resulting YAML.",
      },
      {
        q: "Can I convert the YAML back to JSON?",
        a: "Not on this page currently, but since YAML is a superset of JSON, most YAML tooling can parse it back into equivalent structured data directly.",
      },
    ],
  },
  {
    path: "/json-to-typescript",
    name: "JSON to TypeScript",
    tagline: "Generate a TypeScript interface from a sample JSON object.",
    question: "How do I generate a TypeScript interface from JSON?",
    answer:
      "Paste a sample JSON object and get a matching TypeScript interface with inferred field types. Nested objects and arrays produce their own named sub-interfaces. Saves you from hand-writing types for API responses.",
    about:
      "Typing an API response by hand is easy to get wrong and tedious to keep in sync. This tool generates a TypeScript interface directly from a real JSON example, including nested interfaces for nested objects.",
    faq: [
      {
        q: "Does it infer optional fields?",
        a: "No — every field from your sample is treated as required. If a field is sometimes missing in real data, add a ? manually after generating.",
      },
      {
        q: "What about deeply nested or repeated shapes?",
        a: "Each distinct field name gets its own interface. Two different objects sharing the same field name at different nesting levels may reuse one interface incorrectly — review nested types for accuracy on complex data.",
      },
    ],
  },
  {
    path: "/json-to-java",
    name: "JSON to Java",
    tagline: "Generate a Java class from a sample JSON object.",
    question: "How do I generate a Java class from JSON?",
    answer:
      "Paste a sample JSON object and get a Java class with typed fields and getters/setters. Nested objects generate their own nested classes automatically. A quick starting point for consuming an API in Java.",
    about:
      "Consuming a JSON API in Java usually starts with writing a POJO to deserialize it into. This tool generates that class directly from a sample response, with typed fields and standard getters and setters, so you can skip the boilerplate.",
    faq: [
      {
        q: "Does it use Java records?",
        a: "No — it generates a traditional class with private fields and getter/setter methods, which works with the widest range of Java versions and JSON libraries.",
      },
      {
        q: "Are Jackson or Gson annotations included?",
        a: "No, the generated class is plain Java with no library-specific annotations. Most JSON libraries can map matching field names automatically without them.",
      },
    ],
  },
  {
    path: "/json-to-csharp",
    name: "JSON to C#",
    tagline: "Generate a C# class from a sample JSON object.",
    question: "How do I generate a C# class from JSON?",
    answer:
      "Paste a sample JSON object and get a C# class with typed, auto-implemented properties. Nested objects generate their own classes, and arrays map to List<T>. A fast starting point for deserializing JSON in .NET.",
    about:
      "This tool generates a C# class with typed, auto-implemented properties directly from a sample JSON object — the same shape you'd typically hand-write for deserializing an API response in .NET.",
    faq: [
      {
        q: "Are the properties nullable?",
        a: "No — types are inferred as non-nullable by default. Add ? manually to any property that may be missing or null in real data.",
      },
      {
        q: "Does it work with System.Text.Json or Newtonsoft?",
        a: "Yes — the generated class uses plain public properties with standard naming, which both libraries can map to JSON automatically without extra configuration.",
      },
    ],
  },
];

// Fallback footer content for the home page (not a specific tool page).
export const HOME_FOOTER = {
  title: "About JsonForge",
  description:
    "JsonForge is a collection of JSON tools for developers — formatting, validation, comparison, and conversion — that all run entirely in your browser.",
  about:
    "Every tool on this site parses and transforms your JSON entirely client-side. Nothing you paste is ever uploaded to a server, which makes it safe to use with real data, including anything sensitive.",
  faq: [
    {
      q: "Is JsonForge free to use?",
      a: "Yes, every tool is free with no account required.",
    },
    {
      q: "Is my data safe?",
      a: "Yes — every tool processes your JSON entirely in your browser using JavaScript. Nothing you paste or upload is sent to a server or stored anywhere.",
    },
  ],
};
