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

export enum TextAlignment {
  LEFT = 0,
  CENTER = 1,
  RIGHT = 2,
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

export interface DateNode extends BaseNode {
  type: "date";
  value: string;
  format: number;
  theme?: string | null;
}

export interface ParagraphNode extends BaseNode {
  type: "paragraph";
  align?: TextAlignment;
  children: InlineNode[];
}

export interface HeadingNode extends BaseNode {
  type: "heading";
  level: 1 | 2 | 3;
  align?: TextAlignment;
  children: InlineNode[];
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

export type InlineNode = TextNode | DateNode;
export type BlockNode = ParagraphNode | ListNode | HeadingNode | QuoteNode;

export type Node =
  | TextNode
  | ParagraphNode
  | HeadingNode
  | QuoteNode
  | ListNode
  | ListItemNode
  | DateNode;

export type RichText = BlockNode[];
