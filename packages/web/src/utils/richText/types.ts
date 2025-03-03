export enum TextFormat {
  NONE = 0,
  BOLD = 1,
  ITALIC = 1 << 1,
  STRIKETHROUGH = 1 << 2,
  UNDERLINE = 1 << 3,
}

export enum ListType {
  ORDERED = 0,
  UNORDERED = 1,
  CHECK = 2,
}

export interface BaseNode {
  type: string;
}

export interface TextNode extends BaseNode {
  type: "text";
  text: string;
  format: number;
}

export interface ParagraphNode extends BaseNode {
  type: "paragraph";
  children: (TextNode | LinkNode)[];
}

export interface HeadingNode extends BaseNode {
  type: "heading";
  level: 1 | 2 | 3;
  children: (TextNode | LinkNode)[];
}

export interface LinkNode extends BaseNode {
  type: "link";
  url: string;
  children: TextNode[];
}

export interface QuoteNode extends BaseNode {
  type: "quote";
  children: (TextNode | LinkNode)[];
}

export interface ListNode extends BaseNode {
  type: "list";
  listType: ListType;
  children: ListItemNode[];
}

export interface ListItemNode extends BaseNode {
  type: "listitem";
  value: number;
  checked?: boolean;
  children: (TextNode | LinkNode | ListNode)[];
}

export type Node =
  | TextNode
  | ParagraphNode
  | HeadingNode
  | LinkNode
  | QuoteNode
  | ListNode
  | ListItemNode;

export type RootNode = ParagraphNode | ListNode | HeadingNode | QuoteNode;

export type RichText = RootNode[];
