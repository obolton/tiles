import { schema, LIST_NODES, type TextAlignment } from "./schema";
import type { Node, NodeType, MarkType, ResolvedPos } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";
import type { ListType } from "./format";

interface ResolvedNode {
  node: Node;
  pos: number;
  depth: number;
}

export function closest(
  $pos: ResolvedPos,
  predicate: (node: Node) => boolean,
): ResolvedNode | null {
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (predicate(node)) {
      return { node, pos: $pos.before(depth), depth };
    }
  }
  return null;
}

export function findInSelection(
  state: EditorState,
  predicate: (node: Node) => boolean,
) {
  const {
    selection: { from, to },
  } = state;
  const nodes: Node[] = [];
  state.doc.nodesBetween(from, to, (node) => {
    if (predicate(node)) {
      nodes.push(node);
    }
  });
  return nodes;
}

export function getSelectionMarks(state: EditorState) {
  const {
    selection: { empty, $from },
  } = state;

  if (empty) {
    return state.storedMarks ?? $from.marks();
  }

  const textNodes = findInSelection(state, (node) => node.isText);
  let marks = textNodes[0]?.marks ?? [];

  for (const node of textNodes) {
    marks = marks.filter((mark) => mark.type.isInSet(node.marks));
    if (marks.length === 0) {
      return marks;
    }
  }

  return marks;
}

export function getSelectionBlockNodeTypes(state: EditorState): Set<NodeType> {
  return new Set(
    findInSelection(state, (node) => node.isBlock).map((node) => node.type),
  );
}

export function getSelectionHeadingLevel(state: EditorState): number | null {
  const nodes = findInSelection(state, (node) => node.isTextblock);
  const level = (nodes[0]?.attrs.level as number | undefined) ?? null;
  for (const node of nodes) {
    if (node.type.name !== "heading" || node.attrs.level !== level) {
      return null;
    }
  }
  return level;
}

export function findMark(node: Node, markType: MarkType) {
  return node.marks.find((mark) => mark.type === markType);
}

export function getLink(state: EditorState) {
  return closest(
    state.selection.$from,
    (node) => node.type === schema.nodes.link,
  );
}

export function getSelectionAlignment(
  state: EditorState,
): TextAlignment | undefined {
  const textBlock = closest(state.selection.$from, (node) => node.isTextblock);
  return textBlock
    ? (textBlock.node.attrs.align as TextAlignment | undefined)
    : undefined;
}

export function getSelectionLineHeight(state: EditorState): number | undefined {
  const textBlock = closest(state.selection.$from, (node) => node.isTextblock);
  return textBlock
    ? (textBlock.node.attrs.lineHeight as number | undefined)
    : undefined;
}

export function getSelectionList(state: EditorState): ListType | null {
  const blockNodeTypes = getSelectionBlockNodeTypes(state);
  if (blockNodeTypes.has(schema.nodes.unordered_list)) {
    return "unordered";
  }
  if (blockNodeTypes.has(schema.nodes.ordered_list)) {
    return "ordered";
  }
  if (blockNodeTypes.has(schema.nodes.check_list)) {
    return "check";
  }
  return null;
}

export function getMarkRange(
  state: EditorState,
  pos: number,
  markType: MarkType,
) {
  const doc = state.doc;
  let from = pos;
  let to = pos;

  while (from > 0) {
    const $pos = doc.resolve(from);
    const node = $pos.nodeBefore;
    if (!node) {
      from = $pos.before();
      continue;
    }
    if (!node.isText) {
      from--;
      continue;
    }
    if (!findMark(node, markType)) {
      break;
    }
    from -= node.nodeSize;
  }

  while (to < doc.content.size) {
    const $pos = doc.resolve(to);
    const node = $pos.nodeAfter;
    if (!node) {
      to = $pos.after();
      continue;
    }
    if (!node.isText) {
      to++;
      continue;
    }
    if (!findMark(node, markType)) {
      break;
    }
    to += node.nodeSize;
  }

  return from === to ? null : { from, to };
}

export function getListDepth($pos: ResolvedPos) {
  let depth = -1;

  for (let d = $pos.depth; d > 0; d--) {
    if (LIST_NODES.has($pos.node(d).type)) {
      depth++;
    }
  }

  return depth;
}
