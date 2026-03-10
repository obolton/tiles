export enum TextFormat {
  NONE = 0,
  BOLD = 1,
  ITALIC = 1 << 1,
  STRIKETHROUGH = 1 << 2,
  UNDERLINE = 1 << 3,
  HIGHLIGHT = 1 << 4,
  SUPERSCRIPT = 1 << 5,
  SUBSCRIPT = 1 << 6,
  SMALL_CAPS = 1 << 7,
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
  size?: number;
  color?: string;
  pending?: boolean;
}

export interface LinkNode extends BaseNode {
  type: "link";
  href: string;
  theme?: string;
  children: TextNode[];
}

export interface DateNode extends BaseNode {
  type: "date";
  value: string;
  format: number;
  size?: number;
  color?: string;
  theme?: string | null;
}

export interface DropdownNode extends BaseNode {
  type: "dropdown";
  dropdownType: string;
  value: string;
  format: number;
  size?: number;
  color?: string;
}

export interface MentionNode extends BaseNode {
  type: "mention";
  userId: string;
  displayName: string;
  format: number;
  size?: number;
  color?: string;
}

export interface PendingNode extends BaseNode {
  type: "pending";
  children: Exclude<BlockNode, { type: "pending" }>[];
}

export interface ParagraphNode extends BaseNode {
  type: "paragraph";
  align?: TextAlignment;
  lineHeight?: number;
  children: InlineNode[];
}

export interface HeadingNode extends BaseNode {
  type: "heading";
  level: 1 | 2 | 3;
  align?: TextAlignment;
  lineHeight?: number;
  theme?: string;
  children: InlineNode[];
}

export interface QuoteNode extends BaseNode {
  type: "quote";
  children: Exclude<BlockNode, { type: "quote" | "pending" }>[];
}

export interface CodeNode extends BaseNode {
  type: "code";
  language: string;
  children: TextNode[];
}

export interface DividerNode extends BaseNode {
  type: "divider";
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

export type InlineNode =
  | TextNode
  | LinkNode
  | DateNode
  | DropdownNode
  | MentionNode;

export type BlockNode =
  | PendingNode
  | ParagraphNode
  | ListNode
  | HeadingNode
  | QuoteNode
  | CodeNode
  | DividerNode;

export type Node =
  | TextNode
  | LinkNode
  | DateNode
  | ParagraphNode
  | HeadingNode
  | QuoteNode
  | ListNode
  | ListItemNode
  | PendingNode
  | CodeNode
  | DividerNode
  | DropdownNode
  | MentionNode;

export type RichText = BlockNode[];
