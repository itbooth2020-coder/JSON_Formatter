import { jsonToXml } from "./jsonToXml";
import { jsonToCsv } from "./jsonToCsv";
import { jsonToYaml } from "./jsonToYaml";
import { jsonToTypeScript } from "./jsonToTypeScript";
import { jsonToJava } from "./jsonToJava";
import { jsonToCSharp } from "./jsonToCSharp";
import { jsonToSchema } from "./jsonSchema";
import { diffJson } from "../jsonDiff";

describe("jsonToXml", () => {
  test("converts a simple object", () => {
    const xml = jsonToXml({ name: "John", age: 30 });
    expect(xml).toContain("<name>John</name>");
    expect(xml).toContain("<age>30</age>");
    expect(xml).toContain("<root>");
  });

  test("converts arrays as repeated sibling elements", () => {
    const xml = jsonToXml({ tags: ["a", "b"] });
    expect(xml).toContain("<tags>a</tags>");
    expect(xml).toContain("<tags>b</tags>");
  });

  test("escapes special characters", () => {
    const xml = jsonToXml({ note: "<a> & \"b\"" });
    expect(xml).toContain("&lt;a&gt; &amp; &quot;b&quot;");
  });
});

describe("jsonToCsv", () => {
  test("converts an array of flat objects", () => {
    const csv = jsonToCsv([
      { name: "John", age: 30 },
      { name: "Jane", age: 25 },
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("name,age");
    expect(lines[1]).toBe("John,30");
    expect(lines[2]).toBe("Jane,25");
  });

  test("flattens nested objects with dot notation", () => {
    const csv = jsonToCsv([{ user: { name: "John" } }]);
    expect(csv).toContain("user.name");
    expect(csv).toContain("John");
  });

  test("quotes values containing commas", () => {
    const csv = jsonToCsv([{ note: "hello, world" }]);
    expect(csv).toContain('"hello, world"');
  });

  test("throws on an empty array", () => {
    expect(() => jsonToCsv([])).toThrow();
  });
});

describe("jsonToYaml", () => {
  test("converts a simple object", () => {
    const yamlText = jsonToYaml({ name: "John", age: 30 });
    expect(yamlText).toContain("name: John");
    expect(yamlText).toContain("age: 30");
  });

  test("converts nested arrays", () => {
    const yamlText = jsonToYaml({ tags: ["a", "b"] });
    expect(yamlText).toContain("- a");
    expect(yamlText).toContain("- b");
  });
});

describe("jsonToTypeScript", () => {
  test("generates a flat interface", () => {
    const ts = jsonToTypeScript({ name: "John", age: 30, active: true });
    expect(ts).toContain("interface Root {");
    expect(ts).toContain("name: string;");
    expect(ts).toContain("age: number;");
    expect(ts).toContain("active: boolean;");
  });

  test("generates nested interfaces for nested objects", () => {
    const ts = jsonToTypeScript({ user: { name: "John" } });
    expect(ts).toContain("interface User {");
    expect(ts).toContain("interface Root {");
    expect(ts).toContain("user: User;");
  });

  test("generates array element types", () => {
    const ts = jsonToTypeScript({ tags: ["a", "b"] });
    expect(ts).toContain("tags: string[];");
  });
});

describe("jsonToJava", () => {
  test("generates a class with private fields and accessors", () => {
    const java = jsonToJava({ name: "John", age: 30 });
    expect(java).toContain("public class Root {");
    expect(java).toContain("private String name;");
    expect(java).toContain("private int age;");
    expect(java).toContain("public String getName()");
    expect(java).toContain("public void setName(String name)");
  });

  test("throws for a top-level primitive", () => {
    expect(() => jsonToJava(42)).toThrow();
  });
});

describe("jsonToCSharp", () => {
  test("generates a class with auto-implemented properties", () => {
    const csharp = jsonToCSharp({ name: "John", age: 30 });
    expect(csharp).toContain("public class Root");
    expect(csharp).toContain("public string Name { get; set; }");
    expect(csharp).toContain("public int Age { get; set; }");
  });
});

describe("jsonToSchema", () => {
  test("infers types for a simple object", () => {
    const schema = JSON.parse(jsonToSchema({ name: "John", age: 30, active: true }));
    expect(schema.type).toBe("object");
    expect(schema.properties.name.type).toBe("string");
    expect(schema.properties.age.type).toBe("integer");
    expect(schema.properties.active.type).toBe("boolean");
  });

  test("infers array item schema", () => {
    const schema = JSON.parse(jsonToSchema({ tags: ["a", "b"] }));
    expect(schema.properties.tags.type).toBe("array");
    expect(schema.properties.tags.items.type).toBe("string");
  });
});

describe("diffJson", () => {
  test("returns no diffs for identical objects", () => {
    expect(diffJson({ a: 1 }, { a: 1 })).toEqual([]);
  });

  test("detects an added key", () => {
    const diffs = diffJson({ a: 1 }, { a: 1, b: 2 });
    expect(diffs).toEqual([{ path: "$.b", type: "added", right: 2 }]);
  });

  test("detects a removed key", () => {
    const diffs = diffJson({ a: 1, b: 2 }, { a: 1 });
    expect(diffs).toEqual([{ path: "$.b", type: "removed", left: 2 }]);
  });

  test("detects a changed value", () => {
    const diffs = diffJson({ a: 1 }, { a: 2 });
    expect(diffs).toEqual([{ path: "$.a", type: "changed", left: 1, right: 2 }]);
  });

  test("detects differences inside arrays", () => {
    const diffs = diffJson({ items: [1, 2] }, { items: [1, 3, 4] });
    expect(diffs).toEqual([
      { path: "$.items[1]", type: "changed", left: 2, right: 3 },
      { path: "$.items[2]", type: "added", right: 4 },
    ]);
  });
});
