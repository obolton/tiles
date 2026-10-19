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
  CODE = 1 << 8,
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
  JUSTIFY = 3,
}

export interface TextNode {
  type: "text";
  text: string;
  format: number;
  size?: number;
  color?: string;
  font?: string;
  pending?: boolean;
}

export interface LinkNode {
  type: "link";
  href: string;
  theme?: string;
  children: TextNode[];
}

export interface DateNode {
  type: "date";
  value: string;
  format: number;
  size?: number;
  color?: string;
  font?: string;
  theme?: string | null;
}

export interface DropdownNode {
  type: "dropdown";
  dropdownType: string;
  value: string;
  format: number;
  size?: number;
  color?: string;
  font?: string;
}

export interface MentionNode {
  type: "mention";
  userId: string;
  displayName: string;
  format: number;
  size?: number;
  color?: string;
  font?: string;
}

export type InlineNode = TextNode | LinkNode | DateNode | DropdownNode | MentionNode;

export interface BlockStyle {
  align?: TextAlignment;
  lineHeight?: number;
  indent?: number;
}

export interface ParagraphNode extends BlockStyle {
  type: "paragraph";
  children: InlineNode[];
}

export interface HeadingNode extends BlockStyle {
  type: "heading";
  level: 1 | 2 | 3;
  theme?: string;
  children: InlineNode[];
}

export interface ListItemNode {
  type: "listitem";
  checked?: boolean;
  children: BlockNode[];
}

export interface ListNode {
  type: "list";
  listType: ListType;
  children: ListItemNode[];
}

export interface CodeNode {
  type: "code";
  language: string;
  lineNumbers: boolean;
  children: TextNode[];
}

export interface DividerNode {
  type: "divider";
}

export interface QuoteNode {
  type: "quote";
  children: Exclude<BlockNode, { type: "quote" | "pending" }>[];
}

export interface PendingNode {
  type: "pending";
  children: Exclude<BlockNode, { type: "pending" }>[];
}

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | QuoteNode
  | ListNode
  | PendingNode
  | CodeNode
  | DividerNode;

export type Node = InlineNode | BlockNode | ListItemNode;

export type RichText = BlockNode[];
