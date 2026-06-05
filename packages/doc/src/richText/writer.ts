import * as Y from "yjs";
import { AI_ORIGIN } from "../origins";
import type { DestinationMode, RichTextContent, RichTextNode } from "./events";

type ListType = "ordered" | "unordered";

interface ListLevel {
  list: Y.XmlElement;
  item: Y.XmlElement;
}

/**
 * Streams rich text events into a `Y.XmlFragment`.
 */
export class YXmlStreamWriter {
  private readonly fragment: Y.XmlFragment;
  private readonly doc: Y.Doc;
  private readonly origin: unknown;
  private readonly before: boolean;

  private block: Y.XmlElement | null = null;
  private text: Y.XmlText | null = null;
  private textRel: Y.RelativePosition | null = null;
  private blockRel: Y.RelativePosition | null = null;
  private bold = false;
  private italic = false;
  private lists: ListLevel[] = [];

  constructor(
    fragment: Y.XmlFragment,
    mode: DestinationMode,
    origin: unknown = AI_ORIGIN,
  ) {
    if (!fragment.doc) {
      throw new Error("YXmlStreamWriter requires an integrated Y.XmlFragment");
    }
    this.fragment = fragment;
    this.doc = fragment.doc;
    this.origin = origin;
    // "insert" (the create-text default) appends; cursor-anchored insertion at
    // a Y.RelativePosition is Milestone 3.5.
    this.before = mode === "prepend";
    if (mode === "replace") {
      this.transact(() => this.fragment.delete(0, this.fragment.length));
    }
  }

  apply(event: RichTextContent): void {
    if (typeof event === "string") {
      this.transact(() => this.insertText(event));
      return;
    }
    if ("type" in event) {
      this.transact(() => this.insertNode(event));
      return;
    }
    if (typeof event.bold === "boolean") {
      this.bold = event.bold;
    }
    if (typeof event.italic === "boolean") {
      this.italic = event.italic;
    }
  }

  private transact(fn: () => void): void {
    this.doc.transact(fn, this.origin);
  }

  private insertText(str: string): void {
    const block = this.block ?? this.placeBlock(this.paragraph());
    let text = this.text;
    if (!text) {
      text = new Y.XmlText();
      block.insert(block.length, [text]);
      this.text = text;
      this.textRel = Y.createRelativePositionFromTypeIndex(text, 0);
    }
    const at = this.resolve(this.textRel, text.length);
    const attrs = block.nodeName === "codeBlock" ? undefined : this.marks();
    text.insert(at, str, attrs);
    this.textRel = Y.createRelativePositionFromTypeIndex(text, at + str.length);
  }

  private marks(): Record<string, object | null> {
    return {
      bold: this.bold ? {} : null,
      italic: this.italic ? {} : null,
    };
  }

  private insertNode(node: RichTextNode): void {
    switch (node.type) {
      case "paragraph":
        this.placeBlock(this.paragraph());
        break;
      case "heading":
        this.placeBlock(
          this.element("heading", { align: "left", level: node.level }),
        );
        break;
      case "code":
        this.placeBlock(
          this.element("codeBlock", {
            language: node.language,
            lineNumbers: node.lineNumbers,
          }),
        );
        break;
      case "divider":
        this.placeBlock(this.element("divider"), true);
        break;
      case "listitem":
        this.insertListItem(node.listType, node.depth);
        break;
    }
  }

  private placeBlock(el: Y.XmlElement, atom = false): Y.XmlElement {
    this.insertTopLevel(el, atom);
    this.lists = [];
    this.setLeaf(el);
    return el;
  }

  private insertTopLevel(el: Y.XmlElement, atom = false): void {
    const at = this.resolve(
      this.blockRel,
      this.before ? 0 : this.fragment.length,
    );
    this.fragment.insert(at, [el]);
    const after = !this.before || atom;
    this.blockRel = Y.createRelativePositionFromTypeIndex(
      this.fragment,
      after ? at + 1 : at,
    );
  }

  private insertListItem(type: ListType, depth: number): void {
    const { item, paragraph } = this.listItem();

    if (depth > this.lists.length - 1) {
      const list =
        type === "ordered"
          ? this.element("ordered_list", { order: 1 })
          : this.element("unordered_list");
      list.insert(0, [item]);
      if (this.lists.length === 0) {
        this.insertTopLevel(list);
      } else {
        const parent = this.lists.at(-1)!.item;
        parent.insert(parent.length, [list]);
      }
      this.lists.push({ list, item });
    } else {
      // Same or shallower depth: drop to the target level, add a sibling item.
      const target = Math.max(0, depth);
      this.lists.length = target + 1;
      const level = this.lists[target]!;
      level.list.insert(level.list.length, [item]);
      level.item = item;
    }

    this.setLeaf(paragraph);
  }

  private setLeaf(block: Y.XmlElement): void {
    this.block = block;
    this.text = null;
    this.textRel = null;
  }

  private resolve(rel: Y.RelativePosition | null, fallback: number): number {
    const abs = rel
      ? Y.createAbsolutePositionFromRelativePosition(rel, this.doc)
      : null;
    return abs ? abs.index : fallback;
  }

  private element(name: string, attrs?: Record<string, unknown>): Y.XmlElement {
    const el = new Y.XmlElement(name);
    for (const [key, value] of Object.entries(attrs ?? {})) {
      (el.setAttribute as (k: string, v: unknown) => void)(key, value);
    }
    return el;
  }

  private paragraph(): Y.XmlElement {
    return this.element("paragraph", { align: "left" });
  }

  private listItem(): { item: Y.XmlElement; paragraph: Y.XmlElement } {
    const item = this.element("list_item", { checked: false });
    const paragraph = this.paragraph();
    item.insert(0, [paragraph]);
    return { item, paragraph };
  }
}
