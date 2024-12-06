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
  children: TextNode[];
}

export interface HeadingNode extends BaseNode {
  type: "heading";
  children: TextNode[];
}

export interface QuoteNode extends BaseNode {
  type: "quote";
  children: TextNode[];
}

export interface ListNode extends BaseNode {
  type: "list";
  listType: ListType;
  children: ListItemNode[];
}

export interface ListItemNode extends BaseNode {
  type: "listitem";
  value: number;
  children: (TextNode | ListNode)[];
}

export type Node =
  | TextNode
  | ParagraphNode
  | HeadingNode
  | QuoteNode
  | ListNode
  | ListItemNode;

export type RootNode = ParagraphNode | ListNode | HeadingNode | QuoteNode;

export type RichText = RootNode[];
