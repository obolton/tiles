import {
  EditorState,
  Selection,
  TextSelection,
  type Command,
  type Plugin,
  type Transaction,
} from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "../schema";
import type { Attrs, Mark, Node } from "prosemirror-model";

type Inline = Node | string;

function inline(content: Inline | Inline[]): Node[] {
  const items = Array.isArray(content) ? content : [content];
  return items.map((item) => (typeof item === "string" ? schema.text(item) : item));
}

function blocks(content: Node | Node[]): Node[] {
  return Array.isArray(content) ? content : [content];
}

export const bold = schema.marks.bold.create();
export const italic = schema.marks.italic.create();
export const code = schema.marks.code.create();

export function text(value: string, ...marks: Mark[]) {
  return schema.text(value, marks);
}

export function doc(...content: Node[]) {
  return schema.node("doc", null, content);
}

export function p(content: Inline | Inline[] = [], attrs: Attrs | null = null) {
  return schema.node("paragraph", attrs, inline(content));
}

export function h(level: 1 | 2 | 3, content: Inline | Inline[] = [], attrs: Attrs | null = null) {
  return schema.node("heading", { ...attrs, level }, inline(content));
}

export function quote(...content: Node[]) {
  return schema.node("quote", null, content);
}

export function pendingBlock(...content: Node[]) {
  return schema.node("pending", null, content);
}

export function codeBlock(content = "", attrs: Attrs | null = null) {
  return schema.node("codeBlock", attrs, content ? [schema.text(content)] : []);
}

export function divider() {
  return schema.node("divider");
}

export function li(content: Node | Node[], attrs: Attrs | null = null) {
  return schema.node("list_item", attrs, blocks(content));
}

export function ul(...items: Node[]) {
  return schema.node("unordered_list", null, items);
}

export function ol(...items: Node[]) {
  return schema.node("ordered_list", null, items);
}

export function checkList(...items: Node[]) {
  return schema.node("check_list", null, items);
}

export function link(href: string, content: Inline | Inline[] = []) {
  return schema.node("link", { href }, inline(content));
}

export function date(value: string, time = false) {
  return schema.node("date", { value, time });
}

export function dropdown(dropdownType: string, value: string) {
  return schema.node("dropdown", { dropdownType, value });
}

export function mention(userId: string, displayName: string) {
  return schema.node("mention", { userId, displayName });
}

/** Finds the first occurrence of `value` in a text node and returns its document range. */
export function range(node: Node, value: string): [number, number] {
  let found: [number, number] | null = null;
  node.descendants((child, pos) => {
    if (found) {
      return false;
    }
    const index = child.isText && child.text ? child.text.indexOf(value) : -1;
    if (index >= 0) {
      found = [pos + index, pos + index + value.length];
    }
  });
  if (!found) {
    throw new Error(`Text not found in document: ${value}`);
  }
  return found;
}

/** A cursor position, an explicit range, the text to select, or a ready-made selection. */
export type SelectionSpec = number | [number, number] | string | Selection;

export function resolveSelection(node: Node, spec: SelectionSpec): Selection {
  if (spec instanceof Selection) {
    return spec;
  }
  if (typeof spec === "number") {
    return TextSelection.create(node, spec);
  }
  const [from, to] = typeof spec === "string" ? range(node, spec) : spec;
  return TextSelection.create(node, from, to);
}

export function createState(node: Node, selection: SelectionSpec = 1, plugins: Plugin[] = []) {
  return EditorState.create({ doc: node, selection: resolveSelection(node, selection), plugins });
}

/** Runs a command against a state and returns the result with the state it produced. */
export function run(command: Command, state: EditorState) {
  const captured: { state: EditorState; tr: Transaction | null } = { state, tr: null };
  const result = command(state, (tr) => {
    captured.tr = tr;
    captured.state = state.apply(tr);
  });
  return { result, ...captured };
}

/** Mounts an editor view for the duration of the callback. */
export function withView<T>(state: EditorState, callback: (view: EditorView) => T): T {
  const view = new EditorView(document.body, { state });
  try {
    return callback(view);
  } finally {
    view.destroy();
  }
}
