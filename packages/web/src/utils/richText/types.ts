export enum TextFormat {
  NONE = 0,
  BOLD = 1,
  ITALIC = 1 << 1,
  STRIKETHROUGH = 1 << 2,
  UNDERLINE = 1 << 3,
  HIGHLIGHT = 1 << 4,
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
  link?: string;
}

export interface ParagraphNode extends BaseNode {
  type: "paragraph";
  children: TextNode[];
}

export interface HeadingNode extends BaseNode {
  type: "heading";
  level: 1 | 2 | 3;
  children: TextNode[];
}

export interface QuoteNode extends BaseNode {
  type: "quote";
  children: (ParagraphNode | HeadingNode | ListNode)[];
}

export interface ListNode extends BaseNode {
  type: "list";
  listType: ListType;
  children: ListItemNode[];
}

export interface ListItemNode extends BaseNode {
  type: "listitem";
  checked?: boolean;
  children: BlockNode[];
}

export type BlockNode = ParagraphNode | ListNode | HeadingNode | QuoteNode;

export type Node =
  | TextNode
  | ParagraphNode
  | HeadingNode
  | QuoteNode
  | ListNode
  | ListItemNode;

export type RichText = BlockNode[];
