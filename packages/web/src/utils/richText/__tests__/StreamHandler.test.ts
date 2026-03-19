import { describe, test, expect, vi } from "vitest";
import { EditorState } from "prosemirror-state";
import { reactive } from "@/utils/reactivity";
import { schema } from "../schema";
import { StreamHandler } from "../stream";
import type { StreamContext, StreamEvent, ReactiveState } from "../stream";

function createOutput(): ReactiveState {
  const doc = schema.nodes.doc.create(null, schema.nodes.paragraph.create());
  return reactive<EditorState | null>(EditorState.create({ doc, schema }));
}

function createContext(
  output: ReactiveState,
  onEvent?: StreamContext["onEvent"],
): StreamContext {
  return {
    getState: () => output,
    onEvent,
  };
}

async function* streamOf(...events: StreamEvent[]): AsyncIterable<StreamEvent> {
  for (const event of events) {
    yield event;
  }
}

function destination(id: string): StreamEvent {
  return { destination: id, mode: "replace" };
}

describe("StreamHandler", () => {
  describe("text insertion", () => {
    test("inserts plain text", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(destination("t1"), "hello"),
      );
      expect(output.value!.doc.textContent).toBe("hello");
    });

    test("inserts multiple text chunks", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(destination("t1"), "hello", " ", "world"),
      );
      expect(output.value!.doc.textContent).toBe("hello world");
    });

    test("inserts text with bold mark", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(destination("t1"), { bold: true }, "bold text"),
      );
      const textNode = output.value!.doc.firstChild!.firstChild!;
      expect(textNode.text).toBe("bold text");
      expect(textNode.marks.some((m) => m.type === schema.marks.bold)).toBe(
        true,
      );
    });

    test("inserts text with italic mark", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(destination("t1"), { italic: true }, "italic text"),
      );
      const textNode = output.value!.doc.firstChild!.firstChild!;
      expect(textNode.text).toBe("italic text");
      expect(textNode.marks.some((m) => m.type === schema.marks.italic)).toBe(
        true,
      );
    });

    test("inserts text with bold and italic marks", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(destination("t1"), { bold: true, italic: true }, "both"),
      );
      const textNode = output.value!.doc.firstChild!.firstChild!;
      expect(textNode.text).toBe("both");
      expect(textNode.marks.some((m) => m.type === schema.marks.bold)).toBe(
        true,
      );
      expect(textNode.marks.some((m) => m.type === schema.marks.italic)).toBe(
        true,
      );
    });

    test("toggles formatting mid-stream", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(
          destination("t1"),
          "plain ",
          { bold: true },
          "bold ",
          { bold: false },
          "plain again",
        ),
      );
      const doc = output.value!.doc;
      expect(doc.textContent).toBe("plain bold plain again");
      const para = doc.firstChild!;
      expect(para.child(0).marks.length).toBe(0);
      expect(
        para.child(1).marks.some((m) => m.type === schema.marks.bold),
      ).toBe(true);
      expect(para.child(2).marks.length).toBe(0);
    });
  });

  describe("block insertion", () => {
    test("inserts heading", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(destination("t1"), { type: "heading", level: 2 }, "Title"),
      );
      const node = output.value!.doc.firstChild!;
      expect(node.type).toBe(schema.nodes.heading);
      expect(node.attrs.level).toBe(2);
      expect(node.textContent).toBe("Title");
    });

    test("inserts paragraph after existing content", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(
          destination("t1"),
          { type: "paragraph" },
          "first",
          { type: "paragraph" },
          "second",
        ),
      );
      const doc = output.value!.doc;
      expect(doc.childCount).toBe(2);
      expect(doc.child(0).textContent).toBe("first");
      expect(doc.child(1).textContent).toBe("second");
    });

    test("inserts divider", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(destination("t1"), { type: "divider" }),
      );
      expect(output.value!.doc.firstChild!.type).toBe(schema.nodes.divider);
    });

    test("inserts code block with language", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(
          destination("t1"),
          { type: "code", language: "typescript" },
          "const x = 1;",
        ),
      );
      const node = output.value!.doc.firstChild!;
      expect(node.type).toBe(schema.nodes.code);
      expect(node.attrs.language).toBe("typescript");
      expect(node.textContent).toBe("const x = 1;");
    });

    test("inserts multiple blocks in sequence", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(
          destination("t1"),
          { type: "heading", level: 1 },
          "Heading",
          { type: "paragraph" },
          "Body text",
          { type: "divider" },
        ),
      );
      const doc = output.value!.doc;
      expect(doc.childCount).toBe(3);
      expect(doc.child(0).type).toBe(schema.nodes.heading);
      expect(doc.child(1).type).toBe(schema.nodes.paragraph);
      expect(doc.child(2).type).toBe(schema.nodes.divider);
    });
  });

  describe("list insertion", () => {
    test("creates a new unordered list", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(
          destination("t1"),
          { type: "listitem", listType: "unordered", depth: 0 },
          "item one",
        ),
      );
      const list = output.value!.doc.firstChild!;
      expect(list.type).toBe(schema.nodes.unordered_list);
      expect(list.textContent).toBe("item one");
    });

    test("creates a new ordered list", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(
          destination("t1"),
          { type: "listitem", listType: "ordered", depth: 0 },
          "item one",
        ),
      );
      const list = output.value!.doc.firstChild!;
      expect(list.type).toBe(schema.nodes.ordered_list);
      expect(list.textContent).toBe("item one");
    });

    test("adds sibling list items", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(
          destination("t1"),
          { type: "listitem", listType: "unordered", depth: 0 },
          "first",
          { type: "listitem", listType: "unordered", depth: 0 },
          "second",
        ),
      );
      const list = output.value!.doc.firstChild!;
      expect(list.type).toBe(schema.nodes.unordered_list);
      expect(list.childCount).toBe(2);
      expect(list.child(0).textContent).toBe("first");
      expect(list.child(1).textContent).toBe("second");
    });

    test("nests list items at increased depth", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(
          destination("t1"),
          { type: "listitem", listType: "unordered", depth: 0 },
          "parent",
          { type: "listitem", listType: "unordered", depth: 1 },
          "child",
        ),
      );
      const list = output.value!.doc.firstChild!;
      expect(list.type).toBe(schema.nodes.unordered_list);
      const firstItem = list.child(0);
      expect(firstItem.childCount).toBe(2);
      expect(firstItem.child(1).type).toBe(schema.nodes.unordered_list);
      expect(firstItem.child(1).textContent).toBe("child");
    });
  });

  describe("observer events", () => {
    test("notifies observer for message events", async () => {
      const output = createOutput();
      const onEvent = vi.fn();
      await new StreamHandler(createContext(output, onEvent)).handle(
        streamOf(destination("t1"), { message: "hello" }, "document text", {
          message: "world",
        }),
      );
      expect(output.value!.doc.textContent).toBe("document text");
      expect(onEvent).toHaveBeenCalledTimes(2);
      expect(onEvent).toHaveBeenCalledWith({ message: "hello" });
      expect(onEvent).toHaveBeenCalledWith({ message: "world" });
    });

    test("notifies observer for action events", async () => {
      const output = createOutput();
      const onEvent = vi.fn();
      const action = { type: "test", data: {} };
      await new StreamHandler(createContext(output, onEvent)).handle(
        streamOf(destination("t1"), { action }),
      );
      expect(onEvent).toHaveBeenCalledWith({ action });
    });

    test("notifies observer for artifact events", async () => {
      const output = createOutput();
      const onEvent = vi.fn();
      const artifact = { id: "a1", type: "TEXT" } as any;
      await new StreamHandler(createContext(output, onEvent)).handle(
        streamOf(destination("t1"), { artifact }),
      );
      expect(onEvent).toHaveBeenCalledWith({ artifact });
    });

    test("notifies observer even without active destination", async () => {
      const output = createOutput();
      const onEvent = vi.fn();
      await new StreamHandler(createContext(output, onEvent)).handle(
        streamOf({ message: "no destination set" }),
      );
      expect(onEvent).toHaveBeenCalledWith({ message: "no destination set" });
    });
  });

  describe("destination handling", () => {
    test("returns destination IDs", async () => {
      const output = createOutput();
      const ids = await new StreamHandler(createContext(output)).handle(
        streamOf(destination("t1"), "content"),
      );
      expect(ids).toEqual(new Set(["t1"]));
    });

    test("skips content when no destination is set", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf("orphaned text"),
      );
      expect(output.value!.doc.textContent).toBe("");
    });

    test("skips content after destination is cleared", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(destination("t1"), "first", { destination: null }, "orphaned"),
      );
      expect(output.value!.doc.textContent).toBe("first");
    });
  });

  describe("mixed content", () => {
    test("handles interleaved formatting and blocks", async () => {
      const output = createOutput();
      await new StreamHandler(createContext(output)).handle(
        streamOf(
          destination("t1"),
          { type: "heading", level: 1 },
          { bold: true },
          "Bold Heading",
          { bold: false },
          { type: "paragraph" },
          "Normal text with ",
          { italic: true },
          "emphasis",
        ),
      );
      const doc = output.value!.doc;
      const heading = doc.child(0);
      expect(heading.type).toBe(schema.nodes.heading);
      expect(
        heading.firstChild!.marks.some((m) => m.type === schema.marks.bold),
      ).toBe(true);

      const para = doc.child(1);
      expect(para.child(0).marks.length).toBe(0);
      expect(
        para.child(1).marks.some((m) => m.type === schema.marks.italic),
      ).toBe(true);
    });
  });
});
