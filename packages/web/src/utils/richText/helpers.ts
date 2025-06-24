import type { Node, NodeType, MarkType, ResolvedPos } from "prosemirror-model";
import type { EditorState } from "prosemirror-state";
import { schema, type TextAlignment } from "./schema";
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
    const storedMarks = state.storedMarks ?? [];
    const marks = $from.marks();

    return new Set<MarkType>(
      storedMarks.concat(marks).map((mark) => mark.type),
    );
  }

  const marks = new Set<MarkType>($from.marks().map((mark) => mark.type));

  const textNodes = findInSelection(state, (node) => node.isText);

  for (const node of textNodes) {
    for (const mark of marks) {
      if (!mark.isInSet(node.marks)) {
        marks?.delete(mark);

        if (marks.size === 0) {
          return marks;
        }
      }
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
  const level = nodes[0]?.attrs.level ?? null;
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
  return textBlock ? textBlock.node.attrs.align : undefined;
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
