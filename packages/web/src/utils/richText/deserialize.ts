import type { Node } from "prosemirror-model";
import type {
  DateNode,
  DividerNode,
  LinkNode,
  ListNode,
  ListItemNode,
  ParagraphNode,
  TextNode,
  HeadingNode,
  QuoteNode,
  CodeNode,
  RichText,
  PendingNode,
  DropdownNode,
  MentionNode,
  Node as SerializedNode,
} from "./types";
import { TextFormat, ListType, TextAlignment, type BlockStyle } from "./types";
import { schema } from "./schema";

function getMarks(node: TextNode | DateNode | DropdownNode | MentionNode) {
  const { format, size, color } = node;
  const marks = [];

  if (format & TextFormat.BOLD) {
    marks.push(schema.marks.bold.create());
  }
  if (format & TextFormat.ITALIC) {
    marks.push(schema.marks.italic.create());
  }
  if (format & TextFormat.STRIKETHROUGH) {
    marks.push(schema.marks.strikethrough.create());
  }
  if (format & TextFormat.UNDERLINE) {
    marks.push(schema.marks.underline.create());
  }
  if (format & TextFormat.HIGHLIGHT) {
    marks.push(schema.marks.highlight.create());
  }
  if (format & TextFormat.SUPERSCRIPT) {
    marks.push(schema.marks.superscript.create());
  }
  if (format & TextFormat.SUBSCRIPT) {
    marks.push(schema.marks.subscript.create());
  }
  if (format & TextFormat.SMALL_CAPS) {
    marks.push(schema.marks.smallCaps.create());
  }
  if (typeof size === "number") {
    marks.push(schema.marks.size.create({ size }));
  }
  if (typeof color === "string") {
    marks.push(schema.marks.color.create({ color }));
  }

  return marks;
}

function createTextNode(text: TextNode) {
  const textNode = schema.text(text.text, getMarks(text));
  return textNode;
}

function getTextAlignment(align?: TextAlignment) {
  switch (align) {
    case TextAlignment.LEFT:
      return "left";
    case TextAlignment.CENTER:
      return "center";
    case TextAlignment.RIGHT:
      return "right";
    default:
      return undefined;
  }
}

function getBlockStyle(node: BlockStyle) {
  return {
    align: getTextAlignment(node.align),
    lineHeight: node.lineHeight,
  };
}

function createParagraphNode(paragraph: ParagraphNode): Node {
  return schema.nodes.paragraph.create(
    getBlockStyle(paragraph),
    paragraph.children.map(createNode),
  );
}

function createHeadingNode(heading: HeadingNode): Node {
  return schema.nodes.heading.create(
    {
      level: heading.level,
      ...getBlockStyle(heading),
      theme: heading.theme,
    },
    heading.children.map(createNode),
  );
}

function createQuoteNode(quote: QuoteNode): Node {
  return schema.nodes.quote.create(null, quote.children.map(createNode));
}

function createCodeNode(code: CodeNode): Node {
  return schema.nodes.code.create(
    { language: code.language },
    code.children.map(createNode),
  );
}

function getListType(listType: ListType) {
  switch (listType) {
    case ListType.ORDERED:
      return schema.nodes.ordered_list;
    case ListType.UNORDERED:
      return schema.nodes.unordered_list;
    case ListType.CHECK:
      return schema.nodes.check_list;
    default:
      throw new Error(`Unsupported list type: ${listType}`);
  }
}

function createListNode(list: ListNode): Node {
  return getListType(list.listType).create(null, list.children.map(createNode));
}

function createListItemNode(listItem: ListItemNode): Node {
  return schema.nodes.list_item.create(
    { checked: listItem.checked },
    listItem.children.map(createNode),
  );
}

function createLinkNode(link: LinkNode): Node {
  return schema.nodes.link.create(
    { href: link.href, theme: link.theme },
    link.children.map(createNode),
  );
}

function createDateNode(date: DateNode): Node {
  return schema.nodes.date.create(
    {
      value: new Date(date.value),
      time: date.value.length > 10,
      theme: date.theme,
    },
    null,
    getMarks(date),
  );
}

function createDropdownNode(dropdown: DropdownNode): Node {
  return schema.nodes.dropdown.create(
    {
      dropdownType: dropdown.dropdownType,
      value: dropdown.value,
    },
    null,
    getMarks(dropdown),
  );
}

function createMentionNode(mention: MentionNode): Node {
  return schema.nodes.mention.create(
    {
      userId: mention.userId,
      displayName: mention.displayName,
    },
    null,
    getMarks(mention),
  );
}

function createPendingNode(pending: PendingNode): Node {
  return schema.nodes.pending.create(null, pending.children.map(createNode));
}

function createDividerNode(_divider: DividerNode): Node {
  return schema.nodes.divider.create(null);
}

function createNode(node: SerializedNode) {
  const type = node.type;
  switch (type) {
    case "text":
      return createTextNode(node);
    case "paragraph":
      return createParagraphNode(node);
    case "heading":
      return createHeadingNode(node);
    case "quote":
      return createQuoteNode(node);
    case "code":
      return createCodeNode(node);
    case "list":
      return createListNode(node);
    case "listitem":
      return createListItemNode(node);
    case "link":
      return createLinkNode(node);
    case "date":
      return createDateNode(node);
    case "pending":
      return createPendingNode(node);
    case "dropdown":
      return createDropdownNode(node);
    case "mention":
      return createMentionNode(node);
    case "divider":
      return createDividerNode(node);
    default:
      throw new Error(`Unsupported node type: ${type}`);
  }
}

export function deserialize(content: RichText) {
  return schema.nodes.doc.create(null, content.map(createNode));
}
