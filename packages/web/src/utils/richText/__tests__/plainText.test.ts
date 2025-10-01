import { describe, expect, test } from "vitest";
import { toPlainText } from "../plainText";
import type { RichText } from "../types";

describe("toPlainText", () => {
  test("formats a rich text document as plain text", () => {
    const text: RichText = [
      {
        type: "heading",
        level: 1,
        children: [{ type: "text", text: "Heading", format: 0 }],
      },
      {
        type: "paragraph",
        children: [
          { type: "text", text: "First", format: 0 },
          { type: "text", text: " line", format: 1 },
        ],
      },
      {
        type: "paragraph",
        children: [{ type: "text", text: "Second line", format: 0 }],
      },
      {
        type: "paragraph",
        children: [
          {
            type: "dropdown",
            dropdownType: "dropdown",
            value: "DONE",
            format: 0,
          },
        ],
      },
      {
        type: "list",
        listType: 0,
        children: [
          {
            type: "listitem",
            children: [
              {
                type: "paragraph",
                children: [{ type: "text", text: "List item", format: 0 }],
              },
            ],
          },
        ],
      },
    ];
    expect(toPlainText(text)).toEqual(
      "Heading\nFirst line\nSecond line\nDONE\nList item\n",
    );
  });
});
