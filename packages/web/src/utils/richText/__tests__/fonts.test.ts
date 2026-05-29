import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { prosemirrorToYXmlFragment } from "y-prosemirror";
import { getRichTextFonts, getFragmentFonts } from "../fonts";
import { deserialize } from "../deserialize";
import { ListType } from "../types";
import type { RichText } from "../types";

function toFragment(content: RichText): Y.XmlFragment {
  const fragment = new Y.Doc().getXmlFragment("content");
  prosemirrorToYXmlFragment(deserialize(content), fragment);
  return fragment;
}

describe("getRichTextFonts", () => {
  test("returns an empty set for an empty document", () => {
    expect(getRichTextFonts([])).toEqual(new Set());
  });

  test("returns an empty set when no nodes have a font", () => {
    const text: RichText = [
      {
        type: "paragraph",
        children: [{ type: "text", text: "Hello", format: 0 }],
      },
    ];
    expect(getRichTextFonts(text)).toEqual(new Set());
  });

  test("collects a font mark on a text node", () => {
    const text: RichText = [
      {
        type: "paragraph",
        children: [{ type: "text", text: "Hello", format: 0, font: "lora" }],
      },
    ];
    expect(getRichTextFonts(text)).toEqual(new Set(["lora"]));
  });

  test("collects multiple distinct fonts across nodes", () => {
    const text: RichText = [
      {
        type: "paragraph",
        children: [
          { type: "text", text: "A", format: 0, font: "lora" },
          { type: "text", text: "B", format: 0, font: "quicksand" },
        ],
      },
    ];
    expect(getRichTextFonts(text)).toEqual(new Set(["lora", "quicksand"]));
  });

  test("dedupes when the same font appears multiple times", () => {
    const text: RichText = [
      {
        type: "paragraph",
        children: [
          { type: "text", text: "A", format: 0, font: "lora" },
          { type: "text", text: "B", format: 0, font: "lora" },
        ],
      },
      {
        type: "heading",
        level: 1,
        children: [{ type: "text", text: "C", format: 0, font: "lora" }],
      },
    ];
    expect(getRichTextFonts(text)).toEqual(new Set(["lora"]));
  });

  test("walks into headings, lists, and links", () => {
    const text: RichText = [
      {
        type: "heading",
        level: 1,
        children: [{ type: "text", text: "H", format: 0, font: "lora" }],
      },
      {
        type: "list",
        listType: ListType.UNORDERED,
        children: [
          {
            type: "listitem",
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    type: "link",
                    href: "https://example.com",
                    children: [
                      {
                        type: "text",
                        text: "link",
                        format: 0,
                        font: "quicksand",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(getRichTextFonts(text)).toEqual(new Set(["lora", "quicksand"]));
  });

  test("collects font marks on date, dropdown, and mention nodes", () => {
    const text: RichText = [
      {
        type: "paragraph",
        children: [
          {
            type: "date",
            value: "2026-05-07",
            format: 0,
            font: "lora",
          },
          {
            type: "dropdown",
            dropdownType: "00000000-0000-0000-0000-000000000000",
            value: "Option",
            format: 0,
            font: "quicksand",
          },
          {
            type: "mention",
            userId: "00000000-0000-0000-0000-000000000000",
            displayName: "Alice",
            format: 0,
            font: "dynapuff",
          },
        ],
      },
    ];
    expect(getRichTextFonts(text)).toEqual(
      new Set(["lora", "quicksand", "dynapuff"]),
    );
  });

  test("ignores divider nodes", () => {
    const text: RichText = [
      { type: "divider" },
      {
        type: "paragraph",
        children: [{ type: "text", text: "A", format: 0, font: "lora" }],
      },
    ];
    expect(getRichTextFonts(text)).toEqual(new Set(["lora"]));
  });
});

describe("getFragmentFonts", () => {
  test("returns an empty set for an empty fragment", () => {
    const fragment = new Y.Doc().getXmlFragment("content");
    expect(getFragmentFonts(fragment)).toEqual(new Set());
  });

  test("returns an empty set when no text run has a font", () => {
    const fragment = toFragment([
      {
        type: "paragraph",
        children: [{ type: "text", text: "Hello", format: 0 }],
      },
    ]);
    expect(getFragmentFonts(fragment)).toEqual(new Set());
  });

  test("collects a font mark on a text run", () => {
    const fragment = toFragment([
      {
        type: "paragraph",
        children: [{ type: "text", text: "Hello", format: 0, font: "lora" }],
      },
    ]);
    expect(getFragmentFonts(fragment)).toEqual(new Set(["lora"]));
  });

  test("collects multiple distinct fonts and dedupes repeats", () => {
    const fragment = toFragment([
      {
        type: "paragraph",
        children: [
          { type: "text", text: "A", format: 0, font: "lora" },
          { type: "text", text: "B", format: 0, font: "quicksand" },
          { type: "text", text: "C", format: 0, font: "lora" },
        ],
      },
    ]);
    expect(getFragmentFonts(fragment)).toEqual(new Set(["lora", "quicksand"]));
  });

  test("walks into headings, lists, and links", () => {
    const fragment = toFragment([
      {
        type: "heading",
        level: 1,
        children: [{ type: "text", text: "H", format: 0, font: "lora" }],
      },
      {
        type: "list",
        listType: ListType.UNORDERED,
        children: [
          {
            type: "listitem",
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    type: "link",
                    href: "https://example.com",
                    children: [
                      {
                        type: "text",
                        text: "link",
                        format: 0,
                        font: "quicksand",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
    expect(getFragmentFonts(fragment)).toEqual(new Set(["lora", "quicksand"]));
  });
});
