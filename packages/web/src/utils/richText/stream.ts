import { schema } from "./schema";
import { closest, getListDepth } from "./helpers";
import { handleStreamAction } from "./actions";
import Editor from "@/editor/Editor";
import type { EditorState, Transaction } from "prosemirror-state";
import type { Mark, Node } from "prosemirror-model";
import type { ClientTile } from "api/types/tiles";
import type { Reactive } from "@/utils/reactivity";

export interface ParagraphNode {
  type: "paragraph";
}

export interface HeadingNode {
  type: "heading";
  level: number;
}

export interface ListItemNode {
  type: "listitem";
  listType: "ordered" | "unordered";
  depth: number;
}

export interface DividerNode {
  type: "divider";
}

export interface CodeNode {
  type: "code";
  language: string;
  lineNumbers: boolean;
}

export type RichTextNode =
  | ParagraphNode
  | HeadingNode
  | ListItemNode
  | DividerNode
  | CodeNode;

export interface RichTextFormat {
  bold?: boolean;
  italic?: boolean;
}

export type DestinationMode = "insert" | "replace" | "append" | "prepend";

export interface Destination {
  destination: string | null;
  mode?: DestinationMode;
}

export type RichTextStreamEvent =
  | string
  | RichTextFormat
  | RichTextNode
  | Destination;

function createListItem() {
  return schema.nodes.list_item.create(null, schema.nodes.paragraph.create());
}

export interface ArtifactEvent {
  artifact: ClientTile;
}

export interface Action {
  readonly type: string;
  readonly data: Record<string, unknown>;
}

export interface ActionEvent {
  action: Action;
}

export interface Message {
  message: string | RichTextFormat | RichTextNode;
}

export type StreamEvent =
  | RichTextStreamEvent
  | ArtifactEvent
  | ActionEvent
  | Message;

export type ReactiveState = Reactive<EditorState | null>;

function getInsertPosition(tr: Transaction) {
  const { $from } = tr.selection;

  // If inside an empty textblock, use current position
  if ($from.parent.isTextblock && $from.parent.content.size === 0) {
    return $from.pos;
  }

  // Otherwise, insert a new paragraph after current block
  const pos = $from.after();
  tr.insert(pos, schema.nodes.paragraph.create());
  return pos + 1;
}

type InsertMode = "after" | "before" | "replace";

/**
 * Insert a node at the current position.
 * - "replace": replaces the current textblock node with the new node
 * - "before": inserts before the top-level block ancestor
 * - "after": inserts after the top-level block ancestor (default)
 * @returns The position where the node was inserted.
 */
export function insertNode(
  tr: Transaction,
  pos: number,
  node: Node,
  mode: InsertMode = "after",
): number {
  const $pos = tr.doc.resolve(pos);

  switch (mode) {
    case "replace": {
      const from = $pos.before();
      const to = $pos.after();
      tr.replaceWith(from, to, node);
      return from;
    }
    case "before": {
      const beforePos = $pos.before(1);
      tr.insert(beforePos, node);
      return beforePos;
    }
    case "after":
    default: {
      const afterPos = $pos.after(1);
      tr.insert(afterPos, node);
      return afterPos;
    }
  }
}

function dispatch(state: ReactiveState, tr: Transaction) {
  const newState = state.value?.apply(tr) ?? null;
  state.value = newState;
}

type InsertDirection = "before" | "after";

export type ObserverEvent = Message | ActionEvent | ArtifactEvent;

export interface StreamContext {
  getState: (id: string) => ReactiveState | null;
  onEvent?: (event: ObserverEvent) => void;
}

function isObserverEvent(event: StreamEvent): event is ObserverEvent {
  return (
    typeof event === "object" &&
    ("message" in event || "action" in event || "artifact" in event)
  );
}

export class StreamHandler {
  private readonly context: StreamContext;
  private readonly destinationIds = new Set<string>();
  private pos: number | null = null;
  private bold = false;
  private italic = false;
  private output: ReactiveState | null = null;
  private direction: InsertDirection = "after";
  private replaceEmptyBlock = false;

  constructor(context: StreamContext) {
    this.context = context;
  }

  async handle(stream: AsyncIterable<StreamEvent>): Promise<Set<string>> {
    for await (const event of stream) {
      if (typeof event === "object" && "destination" in event) {
        this.setDestination(event.destination, event.mode);
      } else if (isObserverEvent(event)) {
        this.context.onEvent?.(event);
      } else {
        this.handleContent(event);
      }
    }

    return this.destinationIds;
  }

  private handleContent(event: string | RichTextFormat | RichTextNode) {
    if (typeof event === "object" && !("type" in event)) {
      if ("bold" in event && typeof event.bold === "boolean") {
        this.bold = event.bold;
      }
      if ("italic" in event && typeof event.italic === "boolean") {
        this.italic = event.italic;
      }
      return;
    }

    if (!this.output?.value) {
      return;
    }

    const tr = this.output.value.tr;

    if (this.pos === null) {
      this.pos = getInsertPosition(tr);
      const $pos = tr.doc.resolve(this.pos);
      this.replaceEmptyBlock =
        $pos.parent.isTextblock && $pos.parent.content.size === 0;
    }

    if (typeof event === "string") {
      this.insertText(tr, event);
    } else {
      const mode: InsertMode = this.replaceEmptyBlock
        ? "replace"
        : this.direction;

      switch (event.type) {
        case "paragraph":
          this.insertParagraph(tr);
          break;
        case "heading":
          this.insertHeading(tr, event.level, mode);
          break;
        case "listitem":
          this.insertListItem(tr, event.listType, event.depth, mode);
          break;
        case "divider":
          this.insertDivider(tr, mode);
          break;
        case "code":
          this.insertCode(tr, event.language, mode);
          break;
      }
      this.replaceEmptyBlock = false;
    }

    dispatch(this.output, tr);
  }

  private setDestination(destination: string | null, mode?: DestinationMode) {
    if (!destination) {
      this.output = null;
      this.pos = null;
      this.direction = "after";
      this.replaceEmptyBlock = false;
      return;
    }

    this.destinationIds.add(destination);
    const output = this.context.getState(destination);

    if (!output) {
      this.output = null;
      this.pos = null;
      this.direction = "after";
      this.replaceEmptyBlock = false;
      return;
    }

    this.output = output;

    if (!output.value) {
      this.pos = null;
      this.direction = "after";
      this.replaceEmptyBlock = false;
      return;
    }

    switch (mode) {
      case "replace": {
        const tr = output.value.tr;
        tr.replaceWith(0, tr.doc.content.size, schema.nodes.paragraph.create());
        dispatch(output, tr);
        this.pos = 1;
        this.direction = "after";
        this.replaceEmptyBlock = true;
        break;
      }
      case "append":
        this.pos = output.value.doc.content.size;
        this.direction = "after";
        this.replaceEmptyBlock = false;
        break;
      case "prepend":
        this.pos = 1;
        this.direction = "before";
        this.replaceEmptyBlock = false;
        break;
      default:
        this.pos = null;
        this.direction = "after";
        this.replaceEmptyBlock = false;
        break;
    }
  }

  private insertText(tr: Transaction, text: string) {
    const marks: Mark[] = [];
    if (this.bold) {
      marks.push(schema.marks.bold.create());
    }
    if (this.italic) {
      marks.push(schema.marks.italic.create());
    }
    tr.setStoredMarks(marks);
    tr.insertText(text, this.pos!);
    this.pos! += text.length;
  }

  private insertParagraph(tr: Transaction) {
    if (!this.replaceEmptyBlock) {
      this.pos =
        insertNode(
          tr,
          this.pos!,
          schema.nodes.paragraph.create(),
          this.direction,
        ) + 1;
    }
  }

  private insertHeading(tr: Transaction, level: number, mode: InsertMode) {
    this.pos =
      insertNode(tr, this.pos!, schema.nodes.heading.create({ level }), mode) +
      1;
  }

  private insertListItem(
    tr: Transaction,
    listType: "ordered" | "unordered",
    depth: number,
    mode: InsertMode,
  ) {
    const $pos = tr.doc.resolve(this.pos!);
    const listNodeType =
      listType === "ordered"
        ? schema.nodes.ordered_list
        : schema.nodes.unordered_list;

    const listItem = closest($pos, (n) => n.type === schema.nodes.list_item);

    // Not currently in a list - create a new one
    if (!listItem) {
      const node = listNodeType.create(null, createListItem());
      this.pos = insertNode(tr, this.pos!, node, mode) + 3;
      return;
    }

    const currentDepth = getListDepth($pos);
    const afterPos = listItem.pos + listItem.node.nodeSize;

    if (depth === currentDepth) {
      // Insert sibling item at same depth
      tr.insert(afterPos, createListItem());
      this.pos = afterPos + 2;
    } else if (depth > currentDepth) {
      // Increase depth: nest a new list inside current item
      const node = listNodeType.create(null, createListItem());
      tr.insert(afterPos - 1, node);
      this.pos = afterPos - 1 + 3;
    } else if (depth >= 0) {
      // Decrease depth: insert after parent list item
      tr.insert(afterPos + 2, createListItem());
      this.pos = afterPos + 2 + 2;
    } else {
      // Top level reached: create a new list after current one
      const node = listNodeType.create(null, createListItem());
      tr.insert(afterPos + 3, node);
      this.pos = afterPos + 3 + 3;
    }
  }

  private insertDivider(tr: Transaction, mode: InsertMode) {
    this.pos =
      insertNode(tr, this.pos!, schema.nodes.divider.create(), mode) + 1;
  }

  private insertCode(tr: Transaction, language: string, mode: InsertMode) {
    this.pos =
      insertNode(
        tr,
        this.pos!,
        schema.nodes.codeBlock.create({ language }),
        mode,
      ) + 1;
  }
}

export async function insertFromStream(stream: AsyncIterable<StreamEvent>) {
  const editor = Editor.current;

  await new StreamHandler({
    getState() {
      // AI streaming for text tiles is disabled in Phase 1; restored
      // server-side in Phase 6.
      return null;
    },
    onEvent(event) {
      if ("artifact" in event) {
        const tile = editor.page.createTile(event.artifact);
        editor.addTile(tile);
      } else if ("action" in event) {
        handleStreamAction(event.action);
      }
    },
  }).handle(stream);
}
