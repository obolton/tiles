import { describe, expect, test } from "vitest";
import { toMarkdown } from "../markdown";
import type { RichText } from "doc/types/richText";

describe("toMarkdown", () => {
  describe("paragraph", () => {
    test("extracts text from a paragraph", () => {
      const input: RichText = [
        {
          type: "paragraph",
          children: [{ type: "text", text: "Hello world", format: 0 }],
        },
      ];
      expect(toMarkdown(input)).toBe("Hello world");
    });

    test("extracts text from multiple paragraphs", () => {
      const input: RichText = [
        {
          type: "paragraph",
          children: [{ type: "text", text: "First", format: 0 }],
        },
        {
          type: "paragraph",
          children: [{ type: "text", text: "Second", format: 0 }],
        },
      ];
      expect(toMarkdown(input)).toBe("First\n\nSecond");
    });
  });

  describe("heading", () => {
    test("extracts heading level 1", () => {
      const input: RichText = [
        {
          type: "heading",
          level: 1,
          children: [{ type: "text", text: "Title", format: 0 }],
        },
      ];
      expect(toMarkdown(input)).toBe("# Title");
    });

    test("extracts heading level 2", () => {
      const input: RichText = [
        {
          type: "heading",
          level: 2,
          children: [{ type: "text", text: "Subtitle", format: 0 }],
        },
      ];
      expect(toMarkdown(input)).toBe("## Subtitle");
    });

    test("extracts heading level 3", () => {
      const input: RichText = [
        {
          type: "heading",
          level: 3,
          children: [{ type: "text", text: "Section", format: 0 }],
        },
      ];
      expect(toMarkdown(input)).toBe("### Section");
    });
  });

  describe("list", () => {
    test("extracts unordered list", () => {
      const input: RichText = [
        {
          type: "list",
          listType: 1,
          children: [
            {
              type: "listitem",
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", text: "Item 1", format: 0 }],
                },
              ],
            },
            {
              type: "listitem",
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", text: "Item 2", format: 0 }],
                },
              ],
            },
          ],
        },
      ];
      expect(toMarkdown(input)).toBe("- Item 1\n- Item 2");
    });

    test("extracts ordered list", () => {
      const input: RichText = [
        {
          type: "list",
          listType: 0,
          children: [
            {
              type: "listitem",
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", text: "First", format: 0 }],
                },
              ],
            },
            {
              type: "listitem",
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", text: "Second", format: 0 }],
                },
              ],
            },
          ],
        },
      ];
      expect(toMarkdown(input)).toBe("1. First\n2. Second");
    });

    test("extracts checklist with checked and unchecked items", () => {
      const input: RichText = [
        {
          type: "list",
          listType: 2,
          children: [
            {
              type: "listitem",
              checked: true,
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", text: "Done", format: 0 }],
                },
              ],
            },
            {
              type: "listitem",
              checked: false,
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", text: "Todo", format: 0 }],
                },
              ],
            },
          ],
        },
      ];
      expect(toMarkdown(input)).toBe("- [x] Done\n- [ ] Todo");
    });
  });

  describe("code", () => {
    test("extracts code block with language", () => {
      const input: RichText = [
        {
          type: "code",
          language: "javascript",
          lineNumbers: false,
          children: [{ type: "text", text: "const x = 1;", format: 0 }],
        },
      ];
      expect(toMarkdown(input)).toBe("```javascript\nconst x = 1;\n```");
    });

    test("extracts code block without language", () => {
      const input: RichText = [
        {
          type: "code",
          language: "",
          lineNumbers: false,
          children: [{ type: "text", text: "some code", format: 0 }],
        },
      ];
      expect(toMarkdown(input)).toBe("```\nsome code\n```");
    });
  });

  describe("quote", () => {
    test("extracts quote", () => {
      const input: RichText = [
        {
          type: "quote",
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", text: "A wise quote", format: 0 }],
            },
          ],
        },
      ];
      expect(toMarkdown(input)).toBe("> A wise quote");
    });
  });

  describe("divider", () => {
    test("extracts divider", () => {
      const input: RichText = [
        {
          type: "paragraph",
          children: [{ type: "text", text: "Before", format: 0 }],
        },
        { type: "divider" },
        {
          type: "paragraph",
          children: [{ type: "text", text: "After", format: 0 }],
        },
      ];
      expect(toMarkdown(input)).toBe("Before\n\n---\n\nAfter");
    });
  });

  describe("inline nodes", () => {
    test("extracts link", () => {
      const input: RichText = [
        {
          type: "paragraph",
          children: [
            {
              type: "link",
              href: "https://example.com",
              children: [{ type: "text", text: "Example", format: 0 }],
            },
          ],
        },
      ];
      expect(toMarkdown(input)).toBe("[Example](https://example.com)");
    });

    test("extracts date", () => {
      const input: RichText = [
        {
          type: "paragraph",
          children: [{ type: "date", value: "2024-01-15", format: 0 }],
        },
      ];
      expect(toMarkdown(input)).toBe("2024-01-15");
    });

    test("extracts dropdown value", () => {
      const input: RichText = [
        {
          type: "paragraph",
          children: [
            {
              type: "dropdown",
              dropdownType: "status",
              value: "In Progress",
              format: 0,
            },
          ],
        },
      ];
      expect(toMarkdown(input)).toBe("In Progress");
    });

    test("extracts mention", () => {
      const input: RichText = [
        {
          type: "paragraph",
          children: [
            {
              type: "mention",
              userId: "user-123",
              displayName: "John Doe",
              format: 0,
            },
          ],
        },
      ];
      expect(toMarkdown(input)).toBe("@John Doe");
    });
  });

  describe("empty input", () => {
    test("returns empty string for empty array", () => {
      expect(toMarkdown([])).toBe("");
    });
  });

  describe("tile", () => {
    const input: RichText = [
      { type: "paragraph", children: [{ type: "text", text: "Before", format: 0 }] },
      { type: "tile", id: "tile-1" },
      { type: "paragraph", children: [{ type: "text", text: "After", format: 0 }] },
    ];

    test("throws for an embedded tile without a resolver", () => {
      expect(() => toMarkdown(input)).toThrow("Embedded tiles need a tile serializer");
    });

    test("inlines resolved tile content at its position", () => {
      expect(toMarkdown(input, { tile: (id) => `![${id}]` })).toBe("Before\n\n![tile-1]\n\nAfter");
    });

    test("resolves tiles nested in list items", () => {
      const nested: RichText = [
        {
          type: "list",
          listType: 1,
          children: [
            {
              type: "listitem",
              children: [
                { type: "paragraph", children: [{ type: "text", text: "Item", format: 0 }] },
                { type: "tile", id: "tile-2" },
              ],
            },
          ],
        },
      ];
      expect(toMarkdown(nested, { tile: (id) => `![${id}]` })).toBe("- Item\n\n![tile-2]");
    });
  });
});
