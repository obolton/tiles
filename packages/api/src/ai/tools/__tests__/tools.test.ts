import { describe, test, expect, vi } from "vitest";
import { asSchema, type JSONSchema7 } from "ai";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai";
import { FUNCTION_TOOLS, createTools } from "../tools";

const EXECUTION_OPTIONS = { toolCallId: "call-1", messages: [], context: {} };

function collectObjectSchemas(schema: JSONSchema7, found: JSONSchema7[] = []): JSONSchema7[] {
  if (schema.properties) {
    found.push(schema);
  }
  const children = [
    ...Object.values(schema.properties ?? {}),
    ...(schema.anyOf ?? []),
    ...(schema.oneOf ?? []),
    ...(schema.allOf ?? []),
    ...(Array.isArray(schema.items) ? schema.items : [schema.items]),
  ];
  for (const child of children) {
    if (typeof child === "object") {
      collectObjectSchemas(child, found);
    }
  }
  return found;
}

describe("FUNCTION_TOOLS", () => {
  test("contains all expected tools", () => {
    const toolNames = FUNCTION_TOOLS.map((t) => t.name);

    expect(toolNames).toContain("create_text");
    expect(toolNames).toContain("create_image");
    expect(toolNames).toContain("create_link");
    expect(toolNames).toContain("create_map");
    expect(toolNames).toContain("create_section");
    expect(toolNames).toContain("delete_tiles");
    expect(toolNames).toContain("edit_style");
  });

  test("each tool has required properties", () => {
    for (const tool of FUNCTION_TOOLS) {
      expect(tool).toHaveProperty("name");
      expect(tool).toHaveProperty("description");
      expect(tool).toHaveProperty("schema");
      expect(tool).toHaveProperty("function");
      expect(typeof tool.name).toBe("string");
      expect(typeof tool.description).toBe("string");
      expect(typeof tool.function).toBe("function");
    }
  });

  // Strict tool schemas must list every property as required; optional values are nullable.
  test.each(FUNCTION_TOOLS.map((tool) => [tool.name, tool] as const))(
    "%s lists every property as required",
    (_, tool) => {
      const objects = collectObjectSchemas(asSchema(tool.schema).jsonSchema);
      expect(objects.length).toBeGreaterThan(0);

      for (const object of objects) {
        const missing = Object.keys(object.properties ?? {}).filter(
          (key) => !object.required?.includes(key),
        );
        expect(missing).toEqual([]);
      }
    },
  );
});

describe("createTools", () => {
  test("builds a tool set keyed by tool name", () => {
    const tools = createTools(MOCK_TOOL_CONTEXT, vi.fn());

    expect(Object.keys(tools)).toEqual(FUNCTION_TOOLS.map((tool) => tool.name));
  });

  test("offers no text tool on document pages", () => {
    const tools = createTools({ ...MOCK_TOOL_CONTEXT, pageType: "DOCUMENT" }, vi.fn());

    expect(Object.keys(tools)).not.toContain("create_text");
    expect(Object.keys(tools)).toContain("create_image");
  });

  test("registers a created tile and returns its id to the model", async () => {
    const registerTile = vi.fn(() => "3");
    const tools = createTools(MOCK_TOOL_CONTEXT, registerTile);

    const output = await tools.create_text?.execute?.(
      { parentId: null, align: null, size: "medium", coordinates: null },
      EXECUTION_OPTIONS,
    );

    expect(registerTile).toHaveBeenCalledWith({ tileId: expect.any(String), type: "TEXT" });
    expect(output).toEqual({ id: "3" });
  });

  test("returns an ok status for tools that do not create a tile", async () => {
    const registerTile = vi.fn();
    const tools = createTools(MOCK_TOOL_CONTEXT, registerTile);

    const output = await tools.delete_tiles?.execute?.({ ids: [0] }, EXECUTION_OPTIONS);

    expect(registerTile).not.toHaveBeenCalled();
    expect(output).toEqual({ status: "ok" });
  });
});
