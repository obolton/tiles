import { beforeEach, describe, expect, test } from "vitest";
import * as Y from "yjs";
import { YXmlStreamWriter } from "@/richText/writer";

// Simulates a concurrent remote edit
function concurrently(doc: Y.Doc, edit: (peer: Y.Doc) => void): void {
  const peer = new Y.Doc();
  Y.applyUpdate(peer, Y.encodeStateAsUpdate(doc));
  edit(peer);
  Y.applyUpdate(doc, Y.encodeStateAsUpdate(peer));
}

function paragraph(text: string): Y.XmlElement {
  const el = new Y.XmlElement("paragraph");
  const content = new Y.XmlText();
  content.insert(0, text);
  el.insert(0, [content]);
  return el;
}

function textOf(fragment: Y.XmlFragment, index: number): string {
  const block = fragment.get(index) as Y.XmlElement;
  const text = block.get(0) as Y.XmlText;
  return text
    .toDelta()
    .map((op: { insert?: unknown }) =>
      typeof op.insert === "string" ? op.insert : "",
    )
    .join("");
}

describe("YXmlStreamWriter concurrency", () => {
  let doc: Y.Doc;
  let fragment: Y.XmlFragment;
  let writer: YXmlStreamWriter;

  beforeEach(() => {
    doc = new Y.Doc();
    fragment = doc.getXmlFragment("content");
    writer = new YXmlStreamWriter(fragment, "append");
  });

  test("keeps the text cursor correct across a concurrent insert", () => {
    writer.apply({ type: "paragraph" });
    writer.apply("Hello ");

    concurrently(doc, (peer) => {
      const block = peer.getXmlFragment("content").get(0) as Y.XmlElement;
      (block.get(0) as Y.XmlText).insert(0, "X");
    });

    writer.apply("world");

    expect(textOf(fragment, 0)).toBe("XHello world");
  });

  test("keeps the block cursor correct across a concurrent block insert", () => {
    writer.apply({ type: "paragraph" });
    writer.apply("one");

    concurrently(doc, (peer) => {
      peer.getXmlFragment("content").insert(0, [paragraph("human")]);
    });

    writer.apply({ type: "paragraph" });
    writer.apply("two");

    // Both edits survive
    expect(fragment.length).toBe(3);
    expect(textOf(fragment, 0)).toBe("human");
    expect(textOf(fragment, 1)).toBe("one");
    expect(textOf(fragment, 2)).toBe("two");
  });

  test("never clobbers a concurrent edit in an untouched block", () => {
    writer.apply({ type: "paragraph" });
    writer.apply("first");
    writer.apply({ type: "paragraph" });
    writer.apply("second");

    concurrently(doc, (peer) => {
      const block = peer.getXmlFragment("content").get(0) as Y.XmlElement;
      (block.get(0) as Y.XmlText).insert(0, "edited-");
    });

    writer.apply({ type: "paragraph" });
    writer.apply("third");

    expect(textOf(fragment, 0)).toBe("edited-first");
    expect(textOf(fragment, 1)).toBe("second");
    expect(textOf(fragment, 2)).toBe("third");
  });
});
