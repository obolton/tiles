import { describe, expect, test } from "vitest";
import { safeJsonStringify } from "../serialize";

describe("safeJsonStringify", () => {
  test("serializes primitive values", () => {
    expect(safeJsonStringify("hello")).toBe('"hello"');
    expect(safeJsonStringify(123)).toBe("123");
    expect(safeJsonStringify(true)).toBe("true");
    expect(safeJsonStringify(null)).toBe("null");
  });

  test("serializes objects and arrays", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
    expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
  });

  test("escapes < to prevent </script> injection", () => {
    const data = { content: "</script><script>alert('xss')</script>" };
    const result = safeJsonStringify(data);

    expect(result).not.toContain("<");
    expect(result).toContain("\\u003c");
    expect(result).toBe(
      '{"content":"\\u003c/script\\u003e\\u003cscript\\u003ealert(\'xss\')\\u003c/script\\u003e"}',
    );
  });

  test("escapes > for additional safety", () => {
    const data = { content: "a > b" };
    const result = safeJsonStringify(data);

    expect(result).not.toContain(">");
    expect(result).toContain("\\u003e");
  });

  test("escapes & to prevent HTML entity injection", () => {
    const data = { content: "a & b" };
    const result = safeJsonStringify(data);

    expect(result).not.toContain("&");
    expect(result).toContain("\\u0026");
  });

  test("output is valid JSON that parses correctly", () => {
    const original = {
      title: "Test </script> page",
      content: "<div>Hello & goodbye</div>",
      nested: { value: "a > b && c < d" },
    };
    const serialized = safeJsonStringify(original);
    const parsed = JSON.parse(serialized);

    expect(parsed).toEqual(original);
  });

  test("handles deeply nested structures", () => {
    const data = {
      level1: {
        level2: {
          level3: {
            dangerous: "</script>",
          },
        },
      },
    };
    const result = safeJsonStringify(data);

    expect(result).not.toContain("</script>");
    expect(JSON.parse(result)).toEqual(data);
  });

  test("handles arrays with dangerous content", () => {
    const data = ["<script>", "</script>", "normal"];
    const result = safeJsonStringify(data);

    expect(result).not.toContain("<");
    expect(JSON.parse(result)).toEqual(data);
  });
});
