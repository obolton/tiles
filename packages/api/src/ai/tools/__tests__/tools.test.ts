import { describe, test, expect, vi } from "vitest";
import { z } from "zod";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai";
import { FUNCTION_TOOLS, createTools } from "../tools";
import type { FunctionToolOptions } from "../types";

const EXECUTION_OPTIONS = { toolCallId: "call-1", messages: [], context: {} };

function getSchemas(tool: FunctionToolOptions): z.core.JSONSchema.BaseSchema[] {
  const schemas: z.core.JSONSchema.BaseSchema[] = [];
  z.toJSONSchema(tool.schema, {
    target: "draft-7",
    io: "input",
    override: ({ jsonSchema }) => {
      schemas.push(jsonSchema);
    },
  });
  return schemas;
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
});

// Strict tool schemas are limited to the features that every provider supports.
describe("tool schemas", () => {
  const UNSUPPORTED_KEYWORDS = [
    "minimum",
    "maximum",
    "exclusiveMinimum",
    "exclusiveMaximum",
    "multipleOf",
    "minLength",
    "maxLength",
    "maxItems",
  ];
  const MAX_UNION_PARAMETERS = 16;

  const TOOLS = FUNCTION_TOOLS.map((tool) => [tool.name, getSchemas(tool)] as const);

  test.each(TOOLS)("%s uses no unsupported constraints", (_, schemas) => {
    for (const schema of schemas) {
      const unsupported = Object.keys(schema).filter((key) => UNSUPPORTED_KEYWORDS.includes(key));
      expect(unsupported).toEqual([]);
      expect(schema.minItems ?? 0).toBeLessThanOrEqual(1);
    }
  });

  // Optional values are nullable rather than `.optional()` or `.default()`.
  test.each(TOOLS)("%s lists every property as required", (_, schemas) => {
    for (const schema of schemas) {
      expect(schema.required ?? []).toEqual(Object.keys(schema.properties ?? {}));
    }
  });

  test("stay within the union parameter limit", () => {
    const parameters = TOOLS.flatMap(([, schemas]) =>
      schemas.flatMap((schema) => Object.values(schema.properties ?? {})),
    );
    const unions = parameters.filter(
      (parameter) =>
        typeof parameter === "object" && (parameter.anyOf || Array.isArray(parameter.type)),
    );

    expect(unions.length).toBeLessThanOrEqual(MAX_UNION_PARAMETERS);
  });
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
