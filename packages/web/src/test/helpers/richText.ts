import { Node, type Attrs, type Mark } from "prosemirror-model";
import {
  EditorState,
  NodeSelection,
  TextSelection,
  type Command,
  type Plugin,
  type Selection,
  type Transaction,
} from "prosemirror-state";
import { EditorView, type NodeViewConstructor } from "prosemirror-view";
import { schema } from "@/utils/richText/schema";

type NodeName = Extract<keyof typeof schema.nodes, string>;
type MarkName = Extract<keyof typeof schema.marks, string>;
type Content = Node | string;
type BuilderArg = Content | Attrs | null;

function isContent(value: BuilderArg): value is Content {
  return typeof value === "string" || value instanceof Node;
}

function toNode(value: BuilderArg): Node {
  if (!isContent(value)) {
    throw new TypeError("Attributes must be the first argument");
  }
  return typeof value === "string" ? schema.text(value) : value;
}

/**
 * Creates a node builder that takes optional attrs as its first argument followed by content.
 */
function builder(type: NodeName, defaults: Attrs | null = null) {
  return (...args: BuilderArg[]): Node => {
    const [first, ...rest] = args;
    if (first !== undefined && !isContent(first)) {
      return schema.node(type, { ...defaults, ...first }, rest.map(toNode));
    }
    return schema.node(type, defaults, args.map(toNode));
  };
}

export const doc = builder("doc");
export const p = builder("paragraph");
export const h1 = builder("heading", { level: 1 });
export const h2 = builder("heading", { level: 2 });
export const h3 = builder("heading", { level: 3 });
export const quote = builder("quote");
export const ol = builder("ordered_list");
export const ul = builder("unordered_list");
export const cl = builder("check_list");
export const li = builder("list_item");
export const codeBlock = builder("codeBlock");
export const pendingBlock = builder("pending");
export const link = builder("link");
export const divider = builder("divider");
export const date = builder("date");
export const dropdown = builder("dropdown");
export const mention = builder("mention");

export function text(value: string, ...marks: Mark[]) {
  return schema.text(value, marks);
}

export function mark(name: MarkName, attrs: Attrs | null = null) {
  return schema.mark(name, attrs);
}

/**
 * Finds the positions of the first occurrence of `needle` within a single text node.
 */
export function textRange(root: Node, needle: string): { from: number; to: number } {
  let range: { from: number; to: number } | null = null;
  root.descendants((node, pos) => {
    if (range) {
      return false;
    }
    const index = node.isText ? (node.text?.indexOf(needle) ?? -1) : -1;
    if (index >= 0) {
      range = { from: pos + index, to: pos + index + needle.length };
    }
  });
  if (!range) {
    throw new Error(`Text "${needle}" not found in ${root.toString()}`);
  }
  return range;
}

/**
 * Selects from the start of `start` to the end of `end` (or of `start` when `end` is omitted).
 */
export function selectText(root: Node, start: string, end = start) {
  return TextSelection.create(root, textRange(root, start).from, textRange(root, end).to);
}

export function cursorBefore(root: Node, needle: string) {
  return TextSelection.create(root, textRange(root, needle).from);
}

export function cursorAfter(root: Node, needle: string) {
  return TextSelection.create(root, textRange(root, needle).to);
}

/**
 * Selects the first node matching the predicate as a node selection.
 */
export function selectNode(root: Node, predicate: (node: Node) => boolean) {
  let position: number | null = null;
  root.descendants((node, pos) => {
    if (position === null && predicate(node)) {
      position = pos;
    }
    return position === null;
  });
  if (position === null) {
    throw new Error(`No matching node in ${root.toString()}`);
  }
  return NodeSelection.create(root, position);
}

export function createEditorState(root: Node, selection?: Selection, plugins: Plugin[] = []) {
  return EditorState.create({ doc: root, selection, plugins });
}

/**
 * Minimal node views for node types that are normally rendered by plugin node views.
 */
function fallbackNodeViews(): Record<string, NodeViewConstructor> {
  const nodeViews: Record<string, NodeViewConstructor> = {};
  for (const type of Object.values(schema.nodes)) {
    if (!type.spec.toDOM && !type.isText) {
      nodeViews[type.name] = (node) => {
        const dom = document.createElement(node.isInline ? "span" : "div");
        return node.isLeaf ? { dom } : { dom, contentDOM: dom };
      };
    }
  }
  return nodeViews;
}

/**
 * Mounts a view in jsdom that records every dispatched transaction.
 */
export function createView(state: EditorState) {
  const transactions: Transaction[] = [];
  const view: EditorView = new EditorView(document.createElement("div"), {
    state,
    nodeViews: fallbackNodeViews(),
    dispatchTransaction(tr) {
      transactions.push(tr);
      view.updateState(view.state.apply(tr));
    },
  });
  return { view, transactions };
}

/**
 * Runs a command against a throwaway view and returns the resulting state.
 */
export function runCommand(command: Command, state: EditorState) {
  const { view, transactions } = createView(state);
  try {
    const handled = command(view.state, view.dispatch, view);
    return { handled, state: view.state, doc: view.state.doc, transactions };
  } finally {
    view.destroy();
  }
}
