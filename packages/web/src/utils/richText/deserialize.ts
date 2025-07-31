import type { Node } from "prosemirror-model";
import type {
  DateNode,
  LinkNode,
  ListNode,
  ListItemNode,
  ParagraphNode,
  TextNode,
  HeadingNode,
  QuoteNode,
  RichText,
  PendingNode,
  Node as SerializedNode,
} from "./types";
import { TextFormat, ListType, TextAlignment } from "./types";
import { schema } from "./schema";

function getMarks(format: number) {
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

  return marks;
}

function createTextNode(text: TextNode) {
  const textNode = schema.text(text.text, getMarks(text.format));
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

function createParagraphNode(paragraph: ParagraphNode): Node {
  return schema.nodes.paragraph.create(
    { align: getTextAlignment(paragraph.align) },
    paragraph.children.map(createNode),
  );
}

function createHeadingNode(heading: HeadingNode): Node {
  return schema.nodes.heading.create(
    {
      level: heading.level,
      align: getTextAlignment(heading.align),
      theme: heading.theme,
    },
    heading.children.map(createNode),
  );
}

function createQuoteNode(quote: QuoteNode): Node {
  return schema.nodes.quote.create(null, quote.children.map(createNode));
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
  const marks = getMarks(date.format);
  return schema.nodes.date.create(
    {
      value: new Date(date.value),
      time: date.value.length > 10,
      theme: date.theme,
    },
    null,
    marks,
  );
}

function createPendingNode(pending: PendingNode): Node {
  return schema.nodes.pending.create(null, pending.children.map(createNode));
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
    default:
      throw new Error(`Unsupported node type: ${type}`);
  }
}

export function deserialize(content: RichText) {
  return schema.nodes.doc.create(null, content.map(createNode));
}
