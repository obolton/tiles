import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { EditorState } from "prosemirror-state";
import { prosemirrorToYXmlFragment } from "y-prosemirror";
import { reactive } from "@/utils/reactivity";
import { schema } from "@/utils/richText/schema";
import { StreamHandler, type StreamEvent } from "@/utils/richText/stream";
import { serializeFragment } from "@/utils/richText/serialize";
import { YXmlStreamWriter } from "doc/richText/writer";
import type { DestinationMode, RichTextContent } from "doc/richText/events";

// The contract: for the same event stream, the server-side YXmlStreamWriter must
// produce a Y.XmlFragment that serializes identically to what the client
// StreamHandler produces (→ prosemirrorToYXmlFragment). This pins the writer to
// y-prosemirror's representation without depending on its internals at runtime.

async function* iterate(items: StreamEvent[]): AsyncIterable<StreamEvent> {
  for (const item of items) {
    yield item;
  }
}

function emptyDoc() {
  return EditorState.create({ schema }).doc;
}

// Drive the real StreamHandler headless on a bare editor state.
async function fromStreamHandler(
  mode: DestinationMode,
  events: RichTextContent[],
) {
  const state = reactive<EditorState | null>(EditorState.create({ schema }));
  const handler = new StreamHandler({ getState: () => state });
  await handler.handle(
    iterate([{ destination: "tile", mode }, ...events, { destination: null }]),
  );

  const fragment = new Y.Doc().getXmlFragment("content");
  prosemirrorToYXmlFragment(state.value!.doc, fragment);
  return serializeFragment(fragment);
}

// Drive the writer, seeded with the same initial doc (one empty paragraph) the
// StreamHandler starts from, so the two are directly comparable.
function fromWriter(mode: DestinationMode, events: RichTextContent[]) {
  const fragment = new Y.Doc().getXmlFragment("content");
  prosemirrorToYXmlFragment(emptyDoc(), fragment);
  const writer = new YXmlStreamWriter(fragment, mode);
  for (const event of events) {
    writer.apply(event);
  }
  return serializeFragment(fragment);
}

const FIXTURES: { name: string; events: RichTextContent[] }[] = [
  { name: "a paragraph", events: [{ type: "paragraph" }, "Hello world"] },
  {
    name: "bold and italic spans",
    events: [
      { type: "paragraph" },
      "plain ",
      { bold: true },
      "bold",
      { bold: false },
      " and ",
      { italic: true },
      "italic",
      { italic: false },
      " end",
    ],
  },
  {
    name: "soft and hard line breaks",
    events: [{ type: "paragraph" }, "first", " second", "\nthird"],
  },
  {
    name: "headings of each level",
    events: [
      { type: "heading", level: 1 },
      "H1",
      { type: "heading", level: 2 },
      "H2",
      { type: "heading", level: 3 },
      "H3",
    ],
  },
  {
    name: "multiple paragraphs",
    events: [
      { type: "paragraph" },
      "one",
      { type: "paragraph" },
      "two",
      { type: "paragraph" },
      "three",
    ],
  },
  {
    name: "an unordered list",
    events: [
      { type: "listitem", listType: "unordered", depth: 0 },
      "first",
      { type: "listitem", listType: "unordered", depth: 0 },
      "second",
    ],
  },
  {
    name: "an ordered list",
    events: [
      { type: "listitem", listType: "ordered", depth: 0 },
      "one",
      { type: "listitem", listType: "ordered", depth: 0 },
      "two",
    ],
  },
  {
    name: "a nested list (0 → 1 → 2 → 1 → 0)",
    events: [
      { type: "listitem", listType: "unordered", depth: 0 },
      "a",
      { type: "listitem", listType: "unordered", depth: 1 },
      "b",
      { type: "listitem", listType: "unordered", depth: 2 },
      "c",
      { type: "listitem", listType: "unordered", depth: 1 },
      "d",
      { type: "listitem", listType: "unordered", depth: 0 },
      "e",
    ],
  },
  {
    name: "a list followed by a paragraph",
    events: [
      { type: "listitem", listType: "unordered", depth: 0 },
      "item",
      { type: "paragraph" },
      "after",
    ],
  },
  {
    name: "a code block",
    events: [
      { type: "code", language: "ts", lineNumbers: false },
      "const x = 1;",
    ],
  },
  {
    name: "a divider between paragraphs",
    events: [
      { type: "paragraph" },
      "before",
      { type: "divider" },
      { type: "paragraph" },
      "after",
    ],
  },
  {
    name: "bold within a heading",
    events: [
      { type: "heading", level: 2 },
      "A ",
      { bold: true },
      "bold",
      { bold: false },
      " title",
    ],
  },
  {
    name: "bold within a list item",
    events: [
      { type: "listitem", listType: "unordered", depth: 0 },
      "plain ",
      { bold: true },
      "bold",
      { bold: false },
      { type: "listitem", listType: "unordered", depth: 0 },
      "second",
    ],
  },
  {
    name: "a mark spanning a block break",
    events: [
      { type: "paragraph" },
      { bold: true },
      "before",
      { type: "paragraph" },
      "after",
      { bold: false },
    ],
  },
  {
    name: "active marks are dropped inside a code block",
    events: [
      { bold: true },
      { type: "code", language: "js", lineNumbers: false },
      "const x = 1;",
    ],
  },
];

describe("YXmlStreamWriter matches the client StreamHandler", () => {
  for (const mode of ["append", "replace", "prepend"] as const) {
    describe(mode, () => {
      for (const { name, events } of FIXTURES) {
        test(name, async () => {
          expect(fromWriter(mode, events)).toEqual(
            await fromStreamHandler(mode, events),
          );
        });
      }
    });
  }
});
